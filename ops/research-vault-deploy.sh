#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

deploy_root="${RESEARCH_DEPLOY_ROOT:-/home/azureuser/research-obsidian-deploy}"
repository_dir="$deploy_root/repository.git"
releases_dir="$deploy_root/releases"
current_link="${RESEARCH_CURRENT_LINK:-/home/azureuser/research-obsidian-current}"
credential_file="${RESEARCH_CREDENTIAL_FILE:-/home/azureuser/.config/research-obsidian/git-credentials}"
repo_url="${RESEARCH_REPO_URL:-https://github.com/Colab-Claro/research-obsidian.git}"
branch="${RESEARCH_BRANCH:-main}"
keep_releases="${RESEARCH_KEEP_RELEASES:-3}"
lock_file="$deploy_root/deploy.lock"
candidate=''

log() { printf '[research-vault-deploy] %s\n' "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

safe_remove_dir() {
  local target="$1"
  case "$target" in
    "$releases_dir"/*) rm -rf -- "$target" ;;
    *) die "refusing to remove unsafe path: $target" ;;
  esac
}

cleanup() {
  if [[ -n "$candidate" && -d "$candidate" ]]; then
    safe_remove_dir "$candidate"
  fi
}
trap cleanup EXIT

git_with_auth() {
  if [[ -f "$credential_file" ]]; then
    git -c credential.helper= -c "credential.helper=store --file=$credential_file" "$@"
  else
    git "$@"
  fi
}

atomic_link() {
  local target="$1"
  local next_link="${current_link}.next"
  rm -f -- "$next_link"
  ln -s "$target" "$next_link"
  mv -Tf "$next_link" "$current_link"
}

frontmatter_date() {
  local file="$1"
  local field="$2"
  awk -v field="$field" '
    { sub(/\r$/, "") }
    NR == 1 && $0 != "---" { exit }
    NR == 1 { frontmatter = 1; next }
    frontmatter && $0 == "---" { closed = 1; exit }
    frontmatter && $0 ~ ("^" field ":[[:space:]]*") {
      sub("^" field ":[[:space:]]*", "")
      value = $0
    }
    END { if (closed && value != "") print value }
  ' "$file"
}

validate_snapshot() {
  local snapshot="$1"
  local topic_count=0
  local file created updated relative

  [[ -d "$snapshot/Researchs" ]] || die 'snapshot is missing Researchs/'
  [[ -f "$snapshot/Researches Index.md" ]] || die 'snapshot is missing Researches Index.md'
  if find "$snapshot" -type l -print -quit | grep -q .; then
    die 'snapshot contains a symbolic link'
  fi

  while IFS= read -r -d '' file; do
    topic_count=$((topic_count + 1))
    relative="${file#"$snapshot/"}"
    created="$(frontmatter_date "$file" created)"
    updated="$(frontmatter_date "$file" updated)"
    [[ "$created" =~ ^20[0-9]{2}-[0-9]{2}-[0-9]{2}$ ]] ||
      die "invalid or missing created date: $relative"
    [[ "$updated" =~ ^20[0-9]{2}-[0-9]{2}-[0-9]{2}$ ]] ||
      die "invalid or missing updated date: $relative"
  done < <(find "$snapshot/Researchs" -mindepth 3 -maxdepth 3 -type f -name '*.md' -print0)

  (( topic_count > 0 )) || die 'snapshot has no completed research topic'
}

[[ "$keep_releases" =~ ^[1-9][0-9]*$ ]] || die 'keep releases must be a positive integer'
mkdir -p "$repository_dir" "$releases_dir"
exec 9> "$lock_file"
if ! flock -n 9; then
  log 'another deployment is active; skipping'
  exit 0
fi

if [[ "$repo_url" == https://github.com/* ]]; then
  [[ -f "$credential_file" ]] || die "credential file is missing: $credential_file"
  [[ "$(stat -c '%a' "$credential_file")" == '600' ]] || die 'credential file mode must be 600'
fi

if [[ ! -f "$repository_dir/HEAD" ]]; then
  git init --bare -q "$repository_dir"
  git -C "$repository_dir" remote add origin "$repo_url"
fi
[[ "$(git -C "$repository_dir" remote get-url origin)" == "$repo_url" ]] ||
  die 'configured origin does not match the expected repository'

export GIT_TERMINAL_PROMPT=0
git_with_auth -C "$repository_dir" fetch --force --prune --no-tags origin \
  "refs/heads/$branch:refs/remotes/origin/$branch"
target_sha="$(git -C "$repository_dir" rev-parse --verify "refs/remotes/origin/$branch^{commit}")"
active_target="$(readlink -f "$current_link" 2>/dev/null || true)"
active_sha="$(basename "$active_target" 2>/dev/null || true)"

if [[ "$active_sha" == "$target_sha" ]]; then
  log "already deployed $target_sha"
  exit 0
fi

candidate="$(mktemp -d "$releases_dir/.candidate-${target_sha}.XXXXXX")"
git -C "$repository_dir" archive "$target_sha" | tar -x -C "$candidate"
validate_snapshot "$candidate"
printf '%s\n' "$target_sha" > "$candidate/.research-revision"

release_dir="$releases_dir/$target_sha"
if [[ -e "$release_dir" ]]; then
  safe_remove_dir "$release_dir"
fi
mv "$candidate" "$release_dir"
candidate=''
atomic_link "$release_dir"
touch "$release_dir"

mapfile -t release_paths < <(
  find "$releases_dir" -mindepth 1 -maxdepth 1 -type d \
    -regextype posix-extended -regex '.*/[0-9a-f]{40}' -printf '%T@ %p\n' |
    sort -nr | cut -d' ' -f2-
)
for ((index = keep_releases; index < ${#release_paths[@]}; index += 1)); do
  safe_remove_dir "${release_paths[$index]}"
done

log "deployed $target_sha"

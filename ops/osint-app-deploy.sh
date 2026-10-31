#!/usr/bin/env bash
# Publica o app OSINT (Colab-Claro/signals-osint) a cada commit novo em main: busca, faz o build embutido (dados e API
# apontando para as rotas do Jira Viewer), valida e troca a versão ativa de forma atômica. O Jira Viewer serve a versão
# ativa em /jira/osint-app a partir de OSINT_APP_DIR (o link "current"), sem reiniciar.
set -Eeuo pipefail
umask 022

deploy_root="${OSINT_DEPLOY_ROOT:-/home/azureuser/osint-app-deploy}"
repository_dir="$deploy_root/repository.git"
releases_dir="$deploy_root/releases"
current_link="${OSINT_CURRENT_LINK:-/home/azureuser/osint-app-current}"
credential_file="${OSINT_CREDENTIAL_FILE:-/home/azureuser/.config/signal-vault/git-credentials}"
repo_url="${OSINT_REPO_URL:-https://github.com/Colab-Claro/signals-osint.git}"
branch="${OSINT_BRANCH:-main}"
keep_releases="${OSINT_KEEP_RELEASES:-3}"
data_base="${OSINT_DATA_BASE:-/jira/api/osint/data}"
api_base="${OSINT_API_BASE:-/jira/api/osint}"
# Comando de build (substituível nos testes). Roda dentro do código do commit e precisa gerar dist/index.html.
build_cmd="${OSINT_BUILD_CMD:-}"
lock_file="$deploy_root/deploy.lock"
candidate=''

log() { printf '[osint-app-deploy] %s\n' "$*"; }
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

default_build() {
  # Instala do lockfile que o repositório tiver e gera o build com base relativa (o app é servido em /jira/osint-app/).
  if [[ -f package-lock.json ]]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
  VITE_DATA_BASE="$data_base" VITE_API_BASE="$api_base" npx --no-install vite build --base ./ --outDir dist --emptyOutDir
}

validate_build() {
  local dist="$1"
  [[ -f "$dist/index.html" ]] || die 'build has no index.html'
  [[ -n "$(find "$dist" -type f -name '*.js' -print -quit)" ]] || die 'build has no JavaScript bundle'
  if find "$dist" -type l -print -quit | grep -q .; then
    die 'build contains a symbolic link'
  fi
  # Caminhos absolutos ("/assets/...") quebrariam dentro de /jira/osint-app/.
  if grep -Eq '(src|href)="/assets/' "$dist/index.html"; then
    die 'build uses absolute asset paths; expected a relative base'
  fi
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
active_sha="$(basename "$(dirname "$active_target")" 2>/dev/null || true)"

if [[ "$active_sha" == "$target_sha" ]]; then
  log "already deployed $target_sha"
  exit 0
fi

candidate="$(mktemp -d "$releases_dir/.candidate-${target_sha}.XXXXXX")"
mkdir -p "$candidate/source"
git -C "$repository_dir" archive "$target_sha" | tar -x -C "$candidate/source"
log "building $target_sha"
(
  cd "$candidate/source"
  if [[ -n "$build_cmd" ]]; then bash -c "$build_cmd"; else default_build; fi
)
validate_build "$candidate/source/dist"
mv "$candidate/source/dist" "$candidate/dist"
rm -rf -- "$candidate/source"
printf '%s\n' "$target_sha" > "$candidate/dist/.osint-revision"

release_dir="$releases_dir/$target_sha"
if [[ -e "$release_dir" ]]; then
  safe_remove_dir "$release_dir"
fi
mv "$candidate" "$release_dir"
candidate=''
atomic_link "$release_dir/dist"
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

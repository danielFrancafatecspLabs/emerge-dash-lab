#!/usr/bin/env bash
# Publica o app OSINT (Colab-Claro/signals-osint) a cada commit novo em main: busca, faz o build embutido (dados e API
# apontando para as rotas do Jira Viewer), valida e troca a versão ativa de forma atômica. O Jira Viewer serve a versão
# ativa em /jira/osint-app a partir de OSINT_APP_DIR (o link "current"), sem reiniciar.
#
# Cada execução grava o resultado em $deploy_root/status.json (verificado em, resultado, commit, etapa e mensagem): o
# Radar OSINT mostra a versão ativa e, para admins, o último erro. Diagnóstico completo: ops/osint-app-doctor.sh.
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
status_file="${OSINT_STATUS_FILE:-$deploy_root/status.json}"
candidate=''
step='inicio'
target_sha=''
active_sha=''
status_written=0
run_started="$(date +%s)"

log() { printf '[osint-app-deploy] %s\n' "$*"; }

json_text() {
  # Texto seguro para JSON: sem aspas, barras invertidas nem quebras de linha.
  printf '%s' "$1" | tr -d '\000-\037"\\' | cut -c1-500
}

write_status() {
  local result="$1" message="$2"
  local tmp="${status_file}.tmp"
  mkdir -p "$(dirname "$status_file")" 2>/dev/null || return 0
  printf '{"checkedAt":"%s","result":"%s","step":"%s","targetSha":"%s","activeSha":"%s","message":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$result" "$(json_text "$step")" "$(json_text "$target_sha")" \
    "$(json_text "$active_sha")" "$(json_text "$message")" > "$tmp" 2>/dev/null && mv -f "$tmp" "$status_file" 2>/dev/null || true
  status_written=1
}

die() {
  log "ERROR: $*" >&2
  write_status error "$*"
  exit 1
}

on_error() {
  local code=$?
  # Um die() dentro do build (subshell) já gravou o motivo nesta execução: não sobrescreve.
  if [[ "$status_written" == 0 && -f "$status_file" ]] && (( $(stat -c %Y "$status_file") >= run_started )) &&
    grep -q '"result":"error"' "$status_file"; then
    status_written=1
  fi
  if [[ "$status_written" == 0 ]]; then
    write_status error "falhou na etapa '$step' (código $code); veja: journalctl -u osint-app-deploy.service"
  fi
}
trap on_error ERR

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

# O systemd roda sem o PATH do shell interativo: Node instalado pelo nvm (ou em /opt) não aparece. Procura o Node e
# confere a versão que o Vite do app exige (20.19+ ou 22.12+).
find_node() {
  local dir
  local -a dirs=()
  if [[ -n "${OSINT_NODE_BIN_DIR:-}" ]]; then
    PATH="$OSINT_NODE_BIN_DIR:$PATH"
  fi
  if ! command -v npm >/dev/null 2>&1; then
    shopt -s nullglob
    dirs=("$HOME"/.nvm/versions/node/v*/bin)
    if (( ${#dirs[@]} )); then mapfile -t dirs < <(printf '%s\n' "${dirs[@]}" | sort -rV); fi
    dirs+=("$HOME/.volta/bin" /usr/local/bin /usr/bin /opt/node*/bin /usr/local/lib/nodejs/*/bin)
    shopt -u nullglob
    for dir in "${dirs[@]}"; do
      if [[ -x "$dir/node" && -x "$dir/npm" ]]; then PATH="$dir:$PATH"; break; fi
    done
  fi
  export PATH
  command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1 ||
    die 'Node.js/npm não encontrados no PATH do serviço; defina OSINT_NODE_BIN_DIR na unit (ex.: /home/azureuser/.nvm/versions/node/v22.12.0/bin)'
  local version major minor
  version="$(node -p 'process.versions.node')"
  major="${version%%.*}"; minor="$(cut -d. -f2 <<< "$version")"
  if (( major < 20 || (major == 20 && minor < 19) || (major == 21) || (major == 22 && minor < 12) )); then
    die "Node $version é antigo para o Vite do app (precisa de 20.19+ ou 22.12+); instale um Node novo ou aponte OSINT_NODE_BIN_DIR"
  fi
  log "using node $version ($(command -v node))"
}

default_build() {
  # Instala do lockfile que o repositório tiver e gera o build com base relativa (o app é servido em /jira/osint-app/).
  # --legacy-peer-deps: o próprio signals-osint instala assim (o vite 8 e plugins ainda têm peer deps em conflito).
  find_node
  step='instalar dependências'
  if [[ -f package-lock.json ]]; then
    npm ci --no-audit --no-fund --legacy-peer-deps || {
      log 'npm ci failed (lockfile out of sync?); trying npm install'
      npm install --no-audit --no-fund --legacy-peer-deps
    }
  else
    npm install --no-audit --no-fund --legacy-peer-deps
  fi
  step='build'
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

step='credencial'
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
step='buscar commit'
git_with_auth -C "$repository_dir" fetch --force --prune --no-tags origin \
  "refs/heads/$branch:refs/remotes/origin/$branch"
target_sha="$(git -C "$repository_dir" rev-parse --verify "refs/remotes/origin/$branch^{commit}")"
active_target="$(readlink -f "$current_link" 2>/dev/null || true)"
active_sha="$(basename "$(dirname "$active_target")" 2>/dev/null || true)"

if [[ "$active_sha" == "$target_sha" ]]; then
  log "already deployed $target_sha"
  write_status unchanged "versão ativa já é a do último commit"
  exit 0
fi

candidate="$(mktemp -d "$releases_dir/.candidate-${target_sha}.XXXXXX")"
mkdir -p "$candidate/source"
git -C "$repository_dir" archive "$target_sha" | tar -x -C "$candidate/source"
log "building $target_sha"
step='build'
(
  cd "$candidate/source"
  if [[ -n "$build_cmd" ]]; then bash -c "$build_cmd"; else default_build; fi
)
step='validar build'
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
step='publicar'
atomic_link "$release_dir/dist"
touch "$release_dir"
active_sha="$target_sha"

mapfile -t release_paths < <(
  find "$releases_dir" -mindepth 1 -maxdepth 1 -type d \
    -regextype posix-extended -regex '.*/[0-9a-f]{40}' -printf '%T@ %p\n' |
    sort -nr | cut -d' ' -f2-
)
for ((index = keep_releases; index < ${#release_paths[@]}; index += 1)); do
  safe_remove_dir "${release_paths[$index]}"
done

log "deployed $target_sha"
write_status deployed "publicado o commit $target_sha"

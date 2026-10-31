#!/usr/bin/env bash
# Testa ops/osint-app-deploy.sh com um repositório local e um build falso: publica o commit novo, ignora o mesmo commit,
# mantém a versão ativa quando um build quebra e troca de versão no commit seguinte.
set -Eeuo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
deploy_script="$project_root/ops/osint-app-deploy.sh"
test_root="$(mktemp -d)"
trap 'rm -rf -- "$test_root"' EXIT

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
assert_eq() { [[ "$1" == "$2" ]] || fail "expected '$2', got '$1'"; }

remote="$test_root/remote.git"
work="$test_root/work"
current="$test_root/current"
git init --bare -q "$remote"
git init -q -b main "$work"
git -C "$work" config user.name 'OSINT Deploy Test'
git -C "$work" config user.email 'osint-deploy@example.invalid'

commit_app() {
  local version="$1"
  printf '%s\n' "$version" > "$work/VERSION"
  git -C "$work" add -A
  git -C "$work" commit -q -m "app $version"
  git -C "$work" push -q "$remote" main
  git -C "$work" rev-parse HEAD
}

# Build falso: gera dist/ a partir de VERSION (ou falha, se VERSION pedir).
fake_build='v="$(cat VERSION)"; [[ "$v" != broken ]] || exit 1; mkdir -p dist/assets; printf "<script src=\"./assets/app.js\"></script>%s" "$v" > dist/index.html; echo "x" > dist/assets/app.js'

run_deploy() {
  OSINT_DEPLOY_ROOT="$test_root/deploy" OSINT_CURRENT_LINK="$current" OSINT_REPO_URL="$remote" \
    OSINT_CREDENTIAL_FILE="$test_root/none" OSINT_BUILD_CMD="$fake_build" "$deploy_script"
}

sha1="$(commit_app v1)"
run_deploy > /dev/null
assert_eq "$(cat "$current/.osint-revision")" "$sha1"
grep -q 'v1' "$current/index.html" || fail 'v1 was not published'

output="$(run_deploy)"
[[ "$output" == *"already deployed $sha1"* ]] || fail 'same commit should not rebuild'

commit_app broken > /dev/null
if run_deploy > /dev/null 2>&1; then fail 'a broken build must fail'; fi
assert_eq "$(cat "$current/.osint-revision")" "$sha1"

sha3="$(commit_app v3)"
run_deploy > /dev/null
assert_eq "$(cat "$current/.osint-revision")" "$sha3"
grep -q 'v3' "$current/index.html" || fail 'v3 was not published'
[[ -z "$(find "$test_root/deploy/releases" -maxdepth 1 -name '.candidate-*' -print -quit)" ]] || fail 'candidate left behind'

printf 'osint-app-deploy: ok\n'

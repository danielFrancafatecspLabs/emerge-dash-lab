#!/usr/bin/env bash
set -Eeuo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
deploy_script="$project_root/ops/research-vault-deploy.sh"
test_root="$(mktemp -d)"
trap 'rm -rf -- "$test_root"' EXIT

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
assert_eq() { [[ "$1" == "$2" ]] || fail "expected '$2', got '$1'"; }

[[ -x "$deploy_script" ]] || fail "missing executable deploy script: $deploy_script"

remote="$test_root/remote.git"
work="$test_root/work"
deploy_root="$test_root/deploy"
current="$test_root/current"

git init --bare -q "$remote"
git init -q -b main "$work"
git -C "$work" config user.name 'Research Deploy Test'
git -C "$work" config user.email 'research-deploy@example.invalid'

write_valid_vault() {
  local title="$1"
  mkdir -p "$work/Researchs/Agents/$title"
  cat > "$work/Researches Index.md" <<'INDEX'
# Research Vault
INDEX
  mkdir -p "$work/Researchs/Agents"
  cat > "$work/Researchs/Agents/Agents.md" <<'CATEGORY'
---
title: Agents
created: 2026-08-01
updated: 2026-08-01
---
# Agents
CATEGORY
  cat > "$work/Researchs/Agents/$title/$title.md" <<TOPIC
---
title: $title
created: 2026-08-31
updated: 2026-08-31
---
# $title
TOPIC
}

commit_and_push() {
  local message="$1"
  git -C "$work" add .
  git -C "$work" commit -q -m "$message"
  git -C "$work" push -q origin main
  git -C "$work" rev-parse HEAD
}

run_deploy() {
  env \
    RESEARCH_DEPLOY_ROOT="$deploy_root" \
    RESEARCH_CURRENT_LINK="$current" \
    RESEARCH_CREDENTIAL_FILE="$test_root/not-needed" \
    RESEARCH_REPO_URL="$remote" \
    RESEARCH_BRANCH=main \
    RESEARCH_KEEP_RELEASES=3 \
    bash "$deploy_script"
}

write_valid_vault 'Adaptive Agents'
git -C "$work" remote add origin "$remote"
sha1="$(commit_and_push initial)"

first_output="$(run_deploy)"
assert_eq "$(basename "$(readlink -f "$current")")" "$sha1"
assert_eq "$(cat "$(readlink -f "$current")/.research-revision")" "$sha1"
[[ -f "$(readlink -f "$current")/Researchs/Agents/Adaptive Agents/Adaptive Agents.md" ]] ||
  fail 'valid topic missing from activated snapshot'
[[ "$first_output" == *"deployed $sha1"* ]] || fail 'first deployment did not report the SHA'

second_output="$(run_deploy)"
[[ "$second_output" == *"already deployed $sha1"* ]] || fail 'same SHA was not a no-op'

cat > "$work/Researchs/Agents/Adaptive Agents/Adaptive Agents.md" <<'INVALID'
---
title: Adaptive Agents
created: someday
updated: 2026-08-31
---
# Invalid date
INVALID
invalid_sha="$(commit_and_push invalid-date)"
if run_deploy; then fail 'invalid topic date unexpectedly activated'; fi
assert_eq "$(basename "$(readlink -f "$current")")" "$sha1"
[[ ! -d "$deploy_root/releases/$invalid_sha" ]] || fail 'invalid release was retained'

cat > "$work/Researchs/Agents/Adaptive Agents/Adaptive Agents.md" <<'VALID'
---
title: Adaptive Agents
created: 2026-08-31
updated: 2026-08-31
---
# Valid again
VALID
sha3="$(commit_and_push valid-again)"
run_deploy >/dev/null
assert_eq "$(basename "$(readlink -f "$current")")" "$sha3"

for sequence in four five; do
  printf '%s\n' "$sequence" >> "$work/Researchs/Agents/Adaptive Agents/Adaptive Agents.md"
  commit_and_push "$sequence" >/dev/null
  run_deploy >/dev/null
done

release_count="$(find "$deploy_root/releases" -mindepth 1 -maxdepth 1 -type d \
  -regextype posix-extended -regex '.*/[0-9a-f]{40}' | wc -l | tr -d ' ')"
assert_eq "$release_count" '3'

printf 'PASS: research vault deployment engine\n'

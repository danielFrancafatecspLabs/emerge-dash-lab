# Automatic `main` Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the Jira Viewer VM to check `origin/main` every five minutes and deploy only successful builds with automatic rollback.

**Architecture:** A systemd timer invokes an idempotent Bash deployment program as `azureuser`. The program fetches into a local bare repository, builds an immutable SHA-named release, atomically switches a `current` symlink, restarts the existing application service, and rolls back if service or HTTP validation fails.

**Tech Stack:** Bash 5, Git, npm/Next.js 14, systemd, curl, SSH.

## Global Constraints

- Poll `https://github.com/Colab-Claro/jira-viewer.git` branch `main` at minutes `00, 05, 10, ...`.
- Run Git, npm, and release-file operations as `azureuser`.
- Keep the GitHub token only in `/home/azureuser/.config/jira-viewer/git-credentials`, owned by `azureuser:azureuser` with mode `0600`.
- Never include the GitHub token in the Git remote URL, repository files, systemd units, process arguments, or journal output.
- Preserve `.env`, `.env.local`, `.portfolio-cache.json`, and `.segmento-cache-v2.json` outside immutable releases.
- Do not interrupt the active release until `npm ci` and `npm run build` both succeed.
- Require `jira-viewer.service` to be active and `GET http://127.0.0.1:3003/jira/login` to return HTTP 200 after switching.
- Restore the preceding symlink target and restart it when post-switch validation fails.
- Retain the active release and two previous releases.
- Keep `/home/azureuser/jira-viewer` as the migration fallback; do not delete it.

---

## File Map

- `ops/jira-viewer-deploy.sh`: fetch, build, atomic activation, health validation, rollback, locking, and retention.
- `ops/tests/jira-viewer-deploy-test.sh`: isolated Git and command-double integration tests for the deployment program.
- `ops/systemd/jira-viewer.service`: production Next.js service using the `current` symlink and shared environment file.
- `ops/systemd/jira-viewer-deploy.service`: oneshot deployment service executed as `azureuser`.
- `ops/systemd/jira-viewer-deploy.timer`: five-minute calendar timer.
- `ops/tests/systemd-units-test.sh`: static and `systemd-analyze` validation for all units.
- `ops/README.md`: operator commands for manual checks, logs, rollback visibility, and credential rotation.

### Task 1: Tested deployment engine

**Files:**
- Create: `ops/tests/jira-viewer-deploy-test.sh`
- Create: `ops/jira-viewer-deploy.sh`

**Interfaces:**
- Consumes: a Git remote containing `refs/heads/main`; shared persistent files; configurable command paths for test doubles.
- Produces: an exit-0 no-op or activated SHA release; journal-safe log lines beginning with `already deployed` or `deployed` followed by the exact 40-character SHA.
- Environment: `JIRA_VIEWER_DEPLOY_ROOT`, `JIRA_VIEWER_CURRENT_LINK`, `JIRA_VIEWER_SHARED_DIR`, `JIRA_VIEWER_CREDENTIAL_FILE`, `JIRA_VIEWER_REPO_URL`, `JIRA_VIEWER_BRANCH`, `JIRA_VIEWER_APP_SERVICE`, `JIRA_VIEWER_HEALTH_URL`, `JIRA_VIEWER_KEEP_RELEASES`, `JIRA_VIEWER_NPM_BIN`, `JIRA_VIEWER_CURL_BIN`, `JIRA_VIEWER_SYSTEMCTL_BIN`, `JIRA_VIEWER_SUDO_BIN`, `JIRA_VIEWER_HEALTH_RETRIES`, and `JIRA_VIEWER_HEALTH_DELAY_SECONDS`.

- [ ] **Step 1: Write the failing integration test**

Create `ops/tests/jira-viewer-deploy-test.sh` with this complete content:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
deploy_script="$project_root/ops/jira-viewer-deploy.sh"
test_root="$(mktemp -d)"
trap 'rm -rf -- "$test_root"' EXIT

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
assert_eq() { [[ "$1" == "$2" ]] || fail "expected '$2', got '$1'"; }
line_count() { [[ -f "$1" ]] && wc -l < "$1" | tr -d ' ' || printf '0'; }

[[ -x "$deploy_script" ]] || fail "missing executable deploy script: $deploy_script"

remote="$test_root/remote.git"
work="$test_root/work"
deploy_root="$test_root/deploy"
shared="$deploy_root/shared"
current="$test_root/current"
legacy="$test_root/legacy"
fakebin="$test_root/fakebin"
logs="$test_root/logs"

git init --bare -q "$remote"
git init -q -b main "$work"
git -C "$work" config user.name 'Deploy Test'
git -C "$work" config user.email 'deploy-test@example.invalid'
printf '{"name":"fixture","scripts":{"build":"true"}}\n' > "$work/package.json"
printf '{"name":"fixture","lockfileVersion":3,"packages":{}}\n' > "$work/package-lock.json"
git -C "$work" add package.json package-lock.json
git -C "$work" commit -q -m initial
git -C "$work" remote add origin "$remote"
git -C "$work" push -q -u origin main

mkdir -p "$shared" "$legacy" "$fakebin" "$logs"
printf 'AUTH_SECRET=test\n' > "$shared/.env.local"
printf 'JIRA_PROJECT_KEY=GL\n' > "$shared/.env"
printf '{}\n' > "$shared/.portfolio-cache.json"
printf '{}\n' > "$shared/.segmento-cache-v2.json"
ln -s "$legacy" "$current"

cat > "$fakebin/npm" <<'FAKE_NPM'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >> "$TEST_LOG_DIR/npm.log"
if [[ "$*" == 'run build' && -f FAIL_BUILD ]]; then
  exit 42
fi
if [[ "$*" == 'run build' ]]; then
  mkdir -p .next
fi
FAKE_NPM

cat > "$fakebin/systemctl" <<'FAKE_SYSTEMCTL'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >> "$TEST_LOG_DIR/systemctl.log"
exit 0
FAKE_SYSTEMCTL

cat > "$fakebin/sudo" <<'FAKE_SUDO'
#!/usr/bin/env bash
set -Eeuo pipefail
[[ "${1:-}" == '-n' ]] && shift
exec "$@"
FAKE_SUDO

cat > "$fakebin/curl" <<'FAKE_CURL'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >> "$TEST_LOG_DIR/curl.log"
[[ "${HEALTH_SHOULD_FAIL:-0}" != '1' ]]
FAKE_CURL
chmod +x "$fakebin"/*

run_deploy() {
  env \
    TEST_LOG_DIR="$logs" \
    HEALTH_SHOULD_FAIL="${HEALTH_SHOULD_FAIL:-0}" \
    JIRA_VIEWER_DEPLOY_ROOT="$deploy_root" \
    JIRA_VIEWER_CURRENT_LINK="$current" \
    JIRA_VIEWER_SHARED_DIR="$shared" \
    JIRA_VIEWER_CREDENTIAL_FILE="$test_root/not-needed" \
    JIRA_VIEWER_REPO_URL="$remote" \
    JIRA_VIEWER_BRANCH=main \
    JIRA_VIEWER_APP_SERVICE=jira-viewer.service \
    JIRA_VIEWER_HEALTH_URL=http://fixture/health \
    JIRA_VIEWER_KEEP_RELEASES=3 \
    JIRA_VIEWER_NPM_BIN="$fakebin/npm" \
    JIRA_VIEWER_CURL_BIN="$fakebin/curl" \
    JIRA_VIEWER_SYSTEMCTL_BIN="$fakebin/systemctl" \
    JIRA_VIEWER_SUDO_BIN="$fakebin/sudo" \
    JIRA_VIEWER_HEALTH_RETRIES=2 \
    JIRA_VIEWER_HEALTH_DELAY_SECONDS=0 \
    bash "$deploy_script"
}

sha1="$(git -C "$work" rev-parse HEAD)"
run_deploy
assert_eq "$(basename "$(readlink -f "$current")")" "$sha1"
[[ -L "$(readlink -f "$current")/.env.local" ]] || fail '.env.local is not shared'
[[ -L "$(readlink -f "$current")/.portfolio-cache.json" ]] || fail 'portfolio cache is not shared'
assert_eq "$(line_count "$logs/npm.log")" '2'
assert_eq "$(grep -c '^restart jira-viewer.service$' "$logs/systemctl.log")" '1'

run_deploy
assert_eq "$(line_count "$logs/npm.log")" '2'
assert_eq "$(grep -c '^restart jira-viewer.service$' "$logs/systemctl.log")" '1'

touch "$work/FAIL_BUILD"
git -C "$work" add FAIL_BUILD
git -C "$work" commit -q -m failing-build
git -C "$work" push -q
if run_deploy; then fail 'build failure unexpectedly succeeded'; fi
assert_eq "$(basename "$(readlink -f "$current")")" "$sha1"
assert_eq "$(grep -c '^restart jira-viewer.service$' "$logs/systemctl.log")" '1'

git -C "$work" rm -q FAIL_BUILD
printf 'healthy\n' > "$work/version.txt"
git -C "$work" add version.txt
git -C "$work" commit -q -m health-rollback
git -C "$work" push -q
sha3="$(git -C "$work" rev-parse HEAD)"
HEALTH_SHOULD_FAIL=1
export HEALTH_SHOULD_FAIL
if run_deploy; then fail 'health failure unexpectedly succeeded'; fi
unset HEALTH_SHOULD_FAIL
assert_eq "$(basename "$(readlink -f "$current")")" "$sha1"
assert_eq "$(grep -c '^restart jira-viewer.service$' "$logs/systemctl.log")" '3'

run_deploy
assert_eq "$(basename "$(readlink -f "$current")")" "$sha3"
assert_eq "$(grep -c '^restart jira-viewer.service$' "$logs/systemctl.log")" '4'

for version in four five; do
  printf '%s\n' "$version" > "$work/version.txt"
  git -C "$work" add version.txt
  git -C "$work" commit -q -m "$version"
  git -C "$work" push -q
  run_deploy
done
assert_eq "$(find "$deploy_root/releases" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended -regex '.*/[0-9a-f]{40}' | wc -l | tr -d ' ')" '3'

printf 'PASS: jira-viewer deployment engine\n'
```

- [ ] **Step 2: Run the test and verify the required failure**

Run: `bash ops/tests/jira-viewer-deploy-test.sh`

Expected: exit 1 with `FAIL: missing executable deploy script`.

- [ ] **Step 3: Implement the deployment engine**

Create executable `ops/jira-viewer-deploy.sh` with this complete content:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

deploy_root="${JIRA_VIEWER_DEPLOY_ROOT:-/home/azureuser/jira-viewer-deploy}"
repository_dir="$deploy_root/repository.git"
releases_dir="$deploy_root/releases"
shared_dir="${JIRA_VIEWER_SHARED_DIR:-$deploy_root/shared}"
current_link="${JIRA_VIEWER_CURRENT_LINK:-/home/azureuser/jira-viewer-current}"
credential_file="${JIRA_VIEWER_CREDENTIAL_FILE:-/home/azureuser/.config/jira-viewer/git-credentials}"
repo_url="${JIRA_VIEWER_REPO_URL:-https://github.com/Colab-Claro/jira-viewer.git}"
branch="${JIRA_VIEWER_BRANCH:-main}"
app_service="${JIRA_VIEWER_APP_SERVICE:-jira-viewer.service}"
health_url="${JIRA_VIEWER_HEALTH_URL:-http://127.0.0.1:3003/jira/login}"
keep_releases="${JIRA_VIEWER_KEEP_RELEASES:-3}"
npm_bin="${JIRA_VIEWER_NPM_BIN:-/usr/bin/npm}"
curl_bin="${JIRA_VIEWER_CURL_BIN:-/usr/bin/curl}"
systemctl_bin="${JIRA_VIEWER_SYSTEMCTL_BIN:-/usr/bin/systemctl}"
sudo_bin="${JIRA_VIEWER_SUDO_BIN:-/usr/bin/sudo}"
health_retries="${JIRA_VIEWER_HEALTH_RETRIES:-15}"
health_delay_seconds="${JIRA_VIEWER_HEALTH_DELAY_SECONDS:-2}"
lock_file="$deploy_root/deploy.lock"
candidate=''

log() { printf '[jira-viewer-deploy] %s\n' "$*"; }
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

restart_app() {
  "$sudo_bin" -n "$systemctl_bin" restart "$app_service" &&
    "$sudo_bin" -n "$systemctl_bin" is-active --quiet "$app_service"
}

health_ok() {
  local attempt
  for ((attempt = 1; attempt <= health_retries; attempt++)); do
    if "$curl_bin" -fsS --max-time 5 -o /dev/null "$health_url"; then
      return 0
    fi
    sleep "$health_delay_seconds"
  done
  return 1
}

[[ "$keep_releases" =~ ^[1-9][0-9]*$ ]] || die 'keep releases must be a positive integer'
[[ "$health_retries" =~ ^[1-9][0-9]*$ ]] || die 'health retries must be a positive integer'
mkdir -p "$repository_dir" "$releases_dir" "$shared_dir"
exec 9> "$lock_file"
if ! flock -n 9; then
  log 'another deployment is active; skipping'
  exit 0
fi

if [[ "$repo_url" == https://github.com/* ]]; then
  [[ -f "$credential_file" ]] || die "credential file is missing: $credential_file"
  [[ "$(stat -c '%a' "$credential_file")" == '600' ]] || die 'credential file mode must be 600'
fi
[[ -f "$shared_dir/.env.local" ]] || die 'shared .env.local is missing'
for cache_file in .portfolio-cache.json .segmento-cache-v2.json; do
  [[ -f "$shared_dir/$cache_file" ]] || printf '{}\n' > "$shared_dir/$cache_file"
done

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
for persistent_file in .env .env.local .portfolio-cache.json .segmento-cache-v2.json; do
  rm -f -- "$candidate/$persistent_file"
  if [[ -f "$shared_dir/$persistent_file" ]]; then
    ln -s "$shared_dir/$persistent_file" "$candidate/$persistent_file"
  fi
done

(
  cd "$candidate"
  "$npm_bin" ci --no-audit --no-fund
  "$npm_bin" run build
)

release_dir="$releases_dir/$target_sha"
if [[ -e "$release_dir" ]]; then
  safe_remove_dir "$release_dir"
fi
mv "$candidate" "$release_dir"
candidate=''
previous_target="$active_target"
atomic_link "$release_dir"

if ! restart_app || ! health_ok; then
  log "activation failed for $target_sha; rolling back"
  if [[ -n "$previous_target" && -d "$previous_target" ]]; then
    atomic_link "$previous_target"
    restart_app || log 'ERROR: rollback service restart failed'
  fi
  safe_remove_dir "$release_dir"
  exit 1
fi

mapfile -t release_paths < <(
  find "$releases_dir" -mindepth 1 -maxdepth 1 -type d \
    -regextype posix-extended -regex '.*/[0-9a-f]{40}' -printf '%T@ %p\n' |
    sort -nr | cut -d' ' -f2-
)
for ((index = keep_releases; index < ${#release_paths[@]}; index++)); do
  safe_remove_dir "${release_paths[$index]}"
done

log "deployed $target_sha"
```

Run: `chmod +x ops/jira-viewer-deploy.sh ops/tests/jira-viewer-deploy-test.sh`

- [ ] **Step 4: Run the integration test and syntax check**

Run:

```bash
bash -n ops/jira-viewer-deploy.sh
bash -n ops/tests/jira-viewer-deploy-test.sh
bash ops/tests/jira-viewer-deploy-test.sh
```

Expected: both syntax checks exit 0 and the test ends with `PASS: jira-viewer deployment engine`.

- [ ] **Step 5: Commit the tested engine**

```bash
git add ops/jira-viewer-deploy.sh ops/tests/jira-viewer-deploy-test.sh
git commit -m "ops: add safe Jira Viewer deployment engine"
```

### Task 2: systemd scheduling and operator documentation

**Files:**
- Create: `ops/tests/systemd-units-test.sh`
- Create: `ops/systemd/jira-viewer.service`
- Create: `ops/systemd/jira-viewer-deploy.service`
- Create: `ops/systemd/jira-viewer-deploy.timer`
- Create: `ops/README.md`

**Interfaces:**
- Consumes: `/usr/local/bin/jira-viewer-deploy` from Task 1 and `/home/azureuser/jira-viewer-current` created during installation.
- Produces: `jira-viewer-deploy.timer` firing at five-minute calendar boundaries and a production service whose working directory follows the active release.

- [ ] **Step 1: Write the failing systemd-unit test**

Create executable `ops/tests/systemd-units-test.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
unit_dir="$project_root/ops/systemd"
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

for unit in jira-viewer.service jira-viewer-deploy.service jira-viewer-deploy.timer; do
  [[ -f "$unit_dir/$unit" ]] || fail "missing $unit"
done

systemd-analyze verify \
  "$unit_dir/jira-viewer.service" \
  "$unit_dir/jira-viewer-deploy.service" \
  "$unit_dir/jira-viewer-deploy.timer"
systemd-analyze calendar '*:0/5' | grep -q 'Normalized form:.*:00/5:00'
grep -Fxq 'WorkingDirectory=/home/azureuser/jira-viewer-current' "$unit_dir/jira-viewer.service"
grep -Fxq 'User=azureuser' "$unit_dir/jira-viewer-deploy.service"
grep -Fxq 'OnCalendar=*:0/5' "$unit_dir/jira-viewer-deploy.timer"
grep -Fxq 'Persistent=true' "$unit_dir/jira-viewer-deploy.timer"

printf 'PASS: systemd units\n'
```

- [ ] **Step 2: Run the test and verify the required failure**

Run: `bash ops/tests/systemd-units-test.sh`

Expected: exit 1 with `FAIL: missing jira-viewer.service`.

- [ ] **Step 3: Create the application service**

Create `ops/systemd/jira-viewer.service`:

```ini
[Unit]
Description=Jira Viewer Dashboard (BeOn Lab)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=azureuser
Group=azureuser
WorkingDirectory=/home/azureuser/jira-viewer-current
Environment=NODE_ENV=production
Environment=PORT=3003
EnvironmentFile=/home/azureuser/jira-viewer-deploy/shared/.env.local
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 4: Create the deployment service and timer**

Create `ops/systemd/jira-viewer-deploy.service`:

```ini
[Unit]
Description=Deploy Jira Viewer from GitHub main
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=azureuser
Group=azureuser
UMask=0077
Environment=HOME=/home/azureuser
ExecStart=/usr/local/bin/jira-viewer-deploy
TimeoutStartSec=15min
SyslogIdentifier=jira-viewer-deploy
```

Create `ops/systemd/jira-viewer-deploy.timer`:

```ini
[Unit]
Description=Check Jira Viewer main every five minutes

[Timer]
OnCalendar=*:0/5
Persistent=true
AccuracySec=15s
Unit=jira-viewer-deploy.service

[Install]
WantedBy=timers.target
```

- [ ] **Step 5: Add operator documentation**

Create `ops/README.md` with these exact operational interfaces:

````markdown
# Jira Viewer deployment operations

The VM checks `Colab-Claro/jira-viewer` branch `main` every five minutes. A new commit is built before activation; a failed build leaves the running release untouched, and a failed activation restores the preceding release.

## Status and logs

```bash
sudo systemctl status jira-viewer.service jira-viewer-deploy.timer
sudo systemctl list-timers jira-viewer-deploy.timer
sudo journalctl -u jira-viewer-deploy.service -n 100 --no-pager
```

## Manual check

```bash
sudo systemctl start jira-viewer-deploy.service
sudo journalctl -u jira-viewer-deploy.service -n 30 --no-pager
```

## Active commit

```bash
basename "$(readlink -f /home/azureuser/jira-viewer-current)"
git --git-dir=/home/azureuser/jira-viewer-deploy/repository.git rev-parse refs/remotes/origin/main
```

The two values must match after a successful deployment.

## Rotate the GitHub token

Write one credential URL to `/home/azureuser/.config/jira-viewer/git-credentials`, then enforce ownership `azureuser:azureuser` and mode `0600`. Never place the token in a remote URL, unit, command argument, or log. Trigger a manual check afterward.
````

- [ ] **Step 6: Verify units and all shell tests**

Run:

```bash
chmod +x ops/tests/systemd-units-test.sh
bash ops/tests/systemd-units-test.sh
bash ops/tests/jira-viewer-deploy-test.sh
git diff --check
```

Expected: both tests print `PASS` and `git diff --check` is silent.

- [ ] **Step 7: Commit systemd configuration and documentation**

```bash
git add ops/systemd ops/tests/systemd-units-test.sh ops/README.md
git commit -m "ops: schedule Jira Viewer main deployments"
```

### Task 3: safe migration on the VM

**Files:**
- Install: `/usr/local/bin/jira-viewer-deploy`
- Install: `/etc/systemd/system/jira-viewer.service`
- Install: `/etc/systemd/system/jira-viewer-deploy.service`
- Install: `/etc/systemd/system/jira-viewer-deploy.timer`
- Create: `/home/azureuser/.config/jira-viewer/git-credentials`
- Create: `/home/azureuser/jira-viewer-deploy/shared/*`
- Create: `/home/azureuser/jira-viewer-current`

**Interfaces:**
- Consumes: the SSH key `/mnt/sda1/Projects/persona/vm-beonlabs_key.pem` and the GitHub token already authorized by the user, supplied through standard input rather than a command argument.
- Produces: installed root-owned executable and units, restricted credential/shared files, and a fallback symlink that initially targets `/home/azureuser/jira-viewer`.

- [ ] **Step 1: Reconfirm the migration preconditions**

Run read-only checks:

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
  'test -d /home/azureuser/jira-viewer && test ! -d /home/azureuser/jira-viewer/.git && systemctl is-active --quiet jira-viewer.service && curl -fsS -o /dev/null http://127.0.0.1:3003/jira/login'
```

Expected: exit 0.

- [ ] **Step 2: Upload only the reviewed deployment artifacts**

Create a remote temporary directory with `mktemp -d`, then upload the executable and three units with `scp`. Compare local and remote SHA-256 hashes before installation.

```bash
remote_stage="$(ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 'mktemp -d /home/azureuser/jira-viewer-bootstrap.XXXXXX')"
scp -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem \
  ops/jira-viewer-deploy.sh ops/systemd/jira-viewer.service \
  ops/systemd/jira-viewer-deploy.service ops/systemd/jira-viewer-deploy.timer \
  "azureuser@20.102.41.238:$remote_stage/"
sha256sum ops/jira-viewer-deploy.sh ops/systemd/jira-viewer.service \
  ops/systemd/jira-viewer-deploy.service ops/systemd/jira-viewer-deploy.timer
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
  "sha256sum '$remote_stage/'*"
```

Expected: each local hash matches the corresponding remote basename.

- [ ] **Step 3: Install persistent files, script, units, and the initial fallback link**

Run one fail-fast remote script. It must only copy a persistent file when the shared copy does not already exist.

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
  "remote_stage='$remote_stage' bash -s" <<'REMOTE'
set -Eeuo pipefail
install -d -m 0700 /home/azureuser/.config/jira-viewer
install -d -m 0700 /home/azureuser/jira-viewer-deploy
install -d -m 0755 /home/azureuser/jira-viewer-deploy/releases
install -d -m 0700 /home/azureuser/jira-viewer-deploy/shared
for name in .env .env.local .portfolio-cache.json .segmento-cache-v2.json; do
  source_file="/home/azureuser/jira-viewer/$name"
  shared_file="/home/azureuser/jira-viewer-deploy/shared/$name"
  if [[ -f "$source_file" && ! -e "$shared_file" ]]; then
    install -m 0600 "$source_file" "$shared_file"
  fi
done
test -f /home/azureuser/jira-viewer-deploy/shared/.env.local
if [[ ! -L /home/azureuser/jira-viewer-current ]]; then
  ln -s /home/azureuser/jira-viewer /home/azureuser/jira-viewer-current.next
  mv -T /home/azureuser/jira-viewer-current.next /home/azureuser/jira-viewer-current
fi
sudo install -o root -g root -m 0755 "$remote_stage/jira-viewer-deploy.sh" /usr/local/bin/jira-viewer-deploy
sudo install -o root -g root -m 0644 "$remote_stage/jira-viewer.service" /etc/systemd/system/jira-viewer.service
sudo install -o root -g root -m 0644 "$remote_stage/jira-viewer-deploy.service" /etc/systemd/system/jira-viewer-deploy.service
sudo install -o root -g root -m 0644 "$remote_stage/jira-viewer-deploy.timer" /etc/systemd/system/jira-viewer-deploy.timer
sudo systemd-analyze verify /etc/systemd/system/jira-viewer.service /etc/systemd/system/jira-viewer-deploy.service /etc/systemd/system/jira-viewer-deploy.timer
sudo systemctl daemon-reload
REMOTE
```

Expected: exit 0. `jira-viewer.service` remains active throughout this step.

- [ ] **Step 4: Store the authorized credential without echo**

Load the approved secret into `JIRA_VIEWER_GITHUB_TOKEN` with shell tracing disabled. Then send only the credential line over SSH standard input:

```bash
set +x
test -n "${JIRA_VIEWER_GITHUB_TOKEN:?approved GitHub token is not loaded}"
printf 'https://matheusmouraclaro:%s@github.com\n' "$JIRA_VIEWER_GITHUB_TOKEN" |
  ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
    'umask 077; IFS= read -r credential; printf "%s\n" "$credential" > /home/azureuser/.config/jira-viewer/git-credentials; chmod 600 /home/azureuser/.config/jira-viewer/git-credentials'
unset JIRA_VIEWER_GITHUB_TOKEN
```

Expected: no token output. Remote `stat -c '%U:%G %a'` reports `azureuser:azureuser 600`.

- [ ] **Step 5: Run the first build before enabling the timer**

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
  'sudo systemctl start jira-viewer-deploy.service'
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
  'sudo journalctl -u jira-viewer-deploy.service -n 80 --no-pager'
```

Expected: the journal ends with `[jira-viewer-deploy] deployed` followed by the exact 40-character SHA, and the command exits 0. If it fails, keep the timer disabled and invoke `superpowers:systematic-debugging` before changing configuration.

- [ ] **Step 6: Enable the timer only after the first deployment succeeds**

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
  'sudo systemctl enable --now jira-viewer-deploy.timer && systemctl is-enabled jira-viewer-deploy.timer && systemctl is-active jira-viewer-deploy.timer'
```

Expected: `enabled` and `active`.

- [ ] **Step 7: Remove only the temporary upload directory**

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
  "find '$remote_stage' -depth -delete"
```

Expected: exit 0 and `/home/azureuser/jira-viewer` remains untouched.

### Task 4: end-to-end verification and requested second pull

**Files:** None.

**Interfaces:**
- Consumes: installed timer, deployment service, bare repository, and active-release symlink.
- Produces: evidence that active SHA equals `origin/main`, HTTP is healthy, a second fetch is safe, and a real timer event runs.

- [ ] **Step 1: Compare source and deployed SHAs and verify application health**

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 'bash -s' <<'REMOTE'
set -Eeuo pipefail
source_sha="$(git --git-dir=/home/azureuser/jira-viewer-deploy/repository.git rev-parse refs/remotes/origin/main)"
deployed_sha="$(basename "$(readlink -f /home/azureuser/jira-viewer-current)")"
printf 'source_sha=%s\ndeployed_sha=%s\n' "$source_sha" "$deployed_sha"
test "$source_sha" = "$deployed_sha"
systemctl is-active --quiet jira-viewer.service
test "$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3003/jira/login)" = 200
REMOTE
```

Expected: identical 40-character SHAs and exit 0.

- [ ] **Step 2: Trigger the requested second fetch and prove its outcome**

Record the application PID, start `jira-viewer-deploy.service` again, then compare the fetched SHA and active SHA. If GitHub changed in the interval, both SHAs must advance together; otherwise the journal must contain `already deployed` and the PID must remain unchanged.

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 'bash -s' <<'REMOTE'
set -Eeuo pipefail
before_pid="$(systemctl show jira-viewer.service -p MainPID --value)"
sudo systemctl start jira-viewer-deploy.service
source_sha="$(git --git-dir=/home/azureuser/jira-viewer-deploy/repository.git rev-parse refs/remotes/origin/main)"
deployed_sha="$(basename "$(readlink -f /home/azureuser/jira-viewer-current)")"
after_pid="$(systemctl show jira-viewer.service -p MainPID --value)"
test "$source_sha" = "$deployed_sha"
if [[ "$before_pid" == "$after_pid" ]]; then
  sudo journalctl -u jira-viewer-deploy.service -n 20 --no-pager | grep -F 'already deployed'
fi
printf 'second_check_sha=%s before_pid=%s after_pid=%s\n' "$source_sha" "$before_pid" "$after_pid"
REMOTE
```

Expected: exit 0 and an explicit second-check SHA.

- [ ] **Step 3: Verify secret placement and persistent symlinks**

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 'bash -s' <<'REMOTE'
set -Eeuo pipefail
test "$(stat -c '%U:%G %a' /home/azureuser/.config/jira-viewer/git-credentials)" = 'azureuser:azureuser 600'
if sudo grep -RIlE 'gh[pousr]_' /etc/systemd/system /usr/local/bin/jira-viewer-deploy; then
  echo 'credential leaked outside credential file' >&2
  exit 1
fi
active="$(readlink -f /home/azureuser/jira-viewer-current)"
for name in .env .env.local .portfolio-cache.json .segmento-cache-v2.json; do
  test -L "$active/$name"
  test "$(readlink -f "$active/$name")" = "/home/azureuser/jira-viewer-deploy/shared/$name"
done
REMOTE
```

Expected: exit 0 and no matching filenames from `grep`.

- [ ] **Step 4: Observe one real timer execution**

Record the timer's next elapse, poll in intervals no longer than 45 seconds, and stop when `ExecMainStartTimestampMonotonic` for `jira-viewer-deploy.service` advances. Then inspect the latest journal entry.

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
  'systemctl list-timers jira-viewer-deploy.timer --no-pager; systemctl show jira-viewer-deploy.service -p ExecMainStartTimestamp -p Result --no-pager; sudo journalctl -u jira-viewer-deploy.service -n 20 --no-pager'
```

Expected: `Result=success` and the latest execution logs either `already deployed` or `deployed`, followed by the exact 40-character SHA.

- [ ] **Step 5: Run final local and remote verification**

Run locally:

```bash
bash ops/tests/jira-viewer-deploy-test.sh
bash ops/tests/systemd-units-test.sh
git diff --check
git status --short --branch
```

Run remotely:

```bash
ssh -i /mnt/sda1/Projects/persona/vm-beonlabs_key.pem azureuser@20.102.41.238 \
  'systemctl is-active jira-viewer.service jira-viewer-deploy.timer; systemctl is-enabled jira-viewer-deploy.timer; curl -fsS -o /dev/null http://127.0.0.1:3003/jira/login'
```

Expected: local tests pass; remote states print `active`, `active`, and `enabled`; curl exits 0.

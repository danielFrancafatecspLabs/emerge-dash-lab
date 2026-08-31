#!/usr/bin/env bash
set -Eeuo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
service="$project_root/ops/systemd/research-vault-deploy.service"
timer="$project_root/ops/systemd/research-vault-deploy.timer"

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
assert_eq() { [[ "$1" == "$2" ]] || fail "expected '$2', got '$1'"; }

unit_value() {
  local file="$1"
  local section="$2"
  local key="$3"
  awk -F= -v section="$section" -v key="$key" '
    $0 == "[" section "]" { active = 1; next }
    /^\[/ { active = 0 }
    active && $1 == key { sub("^[^=]*=", ""); print; exit }
  ' "$file"
}

[[ -f "$service" ]] || fail "missing service unit: $service"
[[ -f "$timer" ]] || fail "missing timer unit: $timer"

assert_eq "$(unit_value "$service" Service Type)" 'oneshot'
assert_eq "$(unit_value "$service" Service User)" 'azureuser'
assert_eq "$(unit_value "$service" Service Group)" 'azureuser'
assert_eq "$(unit_value "$service" Service ExecStart)" '/usr/local/bin/research-vault-deploy'
assert_eq "$(unit_value "$timer" Timer OnCalendar)" '*:0/5'
assert_eq "$(unit_value "$timer" Timer Persistent)" 'true'
assert_eq "$(unit_value "$timer" Timer RandomizedDelaySec)" '20'
assert_eq "$(unit_value "$timer" Timer Unit)" 'research-vault-deploy.service'
assert_eq "$(unit_value "$timer" Install WantedBy)" 'timers.target'

systemd-analyze calendar --iterations=2 '*:0/5' >/dev/null

verify_status=0
verify_output="$(systemd-analyze verify "$service" "$timer" 2>&1)" || verify_status=$?
unexpected_output="$(printf '%s\n' "$verify_output" | grep -vE '^research-vault-deploy\.service: Command /usr/local/bin/research-vault-deploy is not executable: No such file or directory$' || true)"

if [[ -n "$unexpected_output" ]]; then
  printf '%s\n' "$unexpected_output" >&2
  fail 'systemd-analyze found an invalid unit definition'
fi

if (( verify_status != 0 )) && [[ "$verify_output" != *'Command /usr/local/bin/research-vault-deploy is not executable: No such file or directory'* ]]; then
  fail "systemd-analyze exited with status $verify_status"
fi

printf 'PASS: research vault systemd units\n'

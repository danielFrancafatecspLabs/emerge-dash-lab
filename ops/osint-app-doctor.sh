#!/usr/bin/env bash
# Diagnóstico da atualização automática do Radar OSINT (ops/osint-app-deploy.sh). Rode na VM, de preferência com sudo,
# a partir da pasta do Jira Viewer:
#
#   sudo bash ops/osint-app-doctor.sh
#
# Confere cada elo da corrente (timer, script instalado, credencial, acesso ao GitHub, Node no PATH do systemd, versão
# publicada e o último resultado) e termina com o que precisa ser feito. Não altera nada.
set -uo pipefail

service_user="${OSINT_SERVICE_USER:-azureuser}"
service_home="$(getent passwd "$service_user" 2>/dev/null | cut -d: -f6)"
service_home="${service_home:-/home/$service_user}"
deploy_root="${OSINT_DEPLOY_ROOT:-$service_home/osint-app-deploy}"
current_link="${OSINT_CURRENT_LINK:-$service_home/osint-app-current}"
credential_file="${OSINT_CREDENTIAL_FILE:-$service_home/.config/signal-vault/git-credentials}"
repo_url="${OSINT_REPO_URL:-https://github.com/Colab-Claro/signals-osint.git}"
branch="${OSINT_BRANCH:-main}"
installed_script=/usr/local/bin/osint-app-deploy
repo_script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/osint-app-deploy.sh"

problems=()
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
bad() { printf '  \033[31m✗\033[0m %s\n' "$1"; problems+=("$2"); }
section() { printf '\n\033[1m%s\033[0m\n' "$*"; }

as_service_user() {
  if [[ "$(id -un)" == "$service_user" ]]; then "$@"
  elif [[ "$(id -u)" == 0 ]]; then sudo -u "$service_user" -H "$@"
  else return 99
  fi
}

section '1. Timer e serviço (systemd)'
if ! command -v systemctl >/dev/null 2>&1; then
  warn 'systemctl indisponível nesta máquina'
else
  for unit in osint-app-deploy.service osint-app-deploy.timer; do
    if [[ -f "/etc/systemd/system/$unit" ]]; then ok "$unit instalado"
    else bad "$unit não está instalado" 'Instale o script, as units e ative o timer (ops/README-osint-app.md, seção Instalação).'; fi
  done
  if systemctl is-enabled --quiet osint-app-deploy.timer 2>/dev/null && systemctl is-active --quiet osint-app-deploy.timer 2>/dev/null; then
    ok "timer ativo; próxima execução: $(systemctl show osint-app-deploy.timer -p NextElapseUSecRealtime --value 2>/dev/null || echo '?')"
  else
    bad 'o timer não está ativo' 'sudo systemctl daemon-reload && sudo systemctl enable --now osint-app-deploy.timer'
  fi
  result="$(systemctl show osint-app-deploy.service -p Result --value 2>/dev/null)"
  last="$(systemctl show osint-app-deploy.service -p ExecMainExitTimestamp --value 2>/dev/null)"
  if [[ -z "$last" ]]; then warn 'o serviço ainda não rodou nenhuma vez'
  elif [[ "$result" == success ]]; then ok "última execução: $last (sucesso)"
  else bad "última execução: $last (resultado: $result)" 'Veja o erro: journalctl -u osint-app-deploy.service -n 80 --no-pager'
  fi
  if grep -q 'OSINT_NODE_BIN_DIR' "/etc/systemd/system/osint-app-deploy.service" 2>/dev/null; then
    ok "unit define OSINT_NODE_BIN_DIR: $(grep -o 'OSINT_NODE_BIN_DIR=[^ "]*' /etc/systemd/system/osint-app-deploy.service | head -1)"
  fi
fi

section '2. Script instalado'
if [[ ! -x "$installed_script" ]]; then
  bad "$installed_script não existe" "sudo install -o root -g root -m 0755 ops/osint-app-deploy.sh $installed_script"
elif [[ -f "$repo_script" ]] && ! cmp -s "$installed_script" "$repo_script"; then
  bad 'o script instalado é diferente do que está no código (versão antiga?)' "sudo install -o root -g root -m 0755 ops/osint-app-deploy.sh $installed_script"
else
  ok "$installed_script igual ao do código"
fi

section '3. Credencial e acesso ao repositório'
if [[ ! -f "$credential_file" ]]; then
  bad "credencial não encontrada: $credential_file" "Crie o arquivo (dono $service_user, modo 600) com um token que leia Colab-Claro/signals-osint, ou aponte OSINT_CREDENTIAL_FILE na unit."
else
  git_err="$(mktemp)"
  mode="$(stat -c '%a' "$credential_file")"; owner="$(stat -c '%U' "$credential_file")"
  if [[ "$mode" == 600 && "$owner" == "$service_user" ]]; then ok "credencial $credential_file (dono $owner, modo $mode)"
  else bad "credencial com dono $owner e modo $mode" "sudo chown $service_user: $credential_file && sudo chmod 600 $credential_file"; fi
  remote_sha="$(as_service_user env GIT_TERMINAL_PROMPT=0 git -c credential.helper= -c "credential.helper=store --file=$credential_file" \
    ls-remote "$repo_url" "refs/heads/$branch" 2>"$git_err" | cut -f1)"
  code=$?
  if [[ $code == 99 ]]; then warn "rode com sudo (ou como $service_user) para testar o acesso ao GitHub"
  elif [[ -n "$remote_sha" ]]; then ok "acesso ao $repo_url ok; $branch está em ${remote_sha:0:7}"
  else
    bad "sem acesso ao $repo_url ($(head -c 200 "$git_err" | tr '\n' ' '))" \
      'O token da credencial precisa de leitura no Colab-Claro/signals-osint (o do signal-vault pode não ter). Gere um com acesso aos dois repositórios ou use um arquivo próprio em OSINT_CREDENTIAL_FILE.'
  fi
  rm -f "$git_err"
fi

section '4. Node.js como o systemd enxerga'
systemd_path='/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
node_seen="$(as_service_user env -i HOME="$service_home" PATH="$systemd_path" bash -c 'command -v node && node -v' 2>/dev/null)"
if [[ $? == 99 ]]; then warn "rode com sudo (ou como $service_user) para testar o Node"
elif [[ -n "$node_seen" ]]; then ok "node no PATH do serviço: $(tr '\n' ' ' <<< "$node_seen")"
else
  nvm_bin="$(ls -d "$service_home"/.nvm/versions/node/v*/bin 2>/dev/null | sort -rV | head -1)"
  if [[ -n "$nvm_bin" ]]; then
    ok "node fora do PATH do systemd, mas o deploy acha o do nvm: $nvm_bin ($("$nvm_bin/node" -v 2>/dev/null))"
  else
    bad 'Node.js não encontrado para o serviço' 'Instale Node 22 LTS (ou 20.19+) ou defina Environment=OSINT_NODE_BIN_DIR=<pasta do node> na unit.'
  fi
fi

section '5. Versão publicada'
if [[ -L "$current_link" && -f "$current_link/index.html" ]]; then
  active="$(cat "$current_link/.osint-revision" 2>/dev/null)"
  ok "$current_link → $(readlink -f "$current_link") (commit ${active:0:7})"
  if [[ -n "${remote_sha:-}" && -n "$active" && "$active" != "$remote_sha" ]]; then
    bad "versão no ar (${active:0:7}) atrás do $branch (${remote_sha:0:7})" 'Rode sudo systemctl start osint-app-deploy.service e veja o resultado no journal.'
  fi
else
  bad "nenhuma versão publicada em $current_link" 'Depois de corrigir os itens acima: sudo systemctl start osint-app-deploy.service'
fi
if [[ -f "$deploy_root/status.json" ]]; then
  ok "último status: $(cat "$deploy_root/status.json")"
fi

section '6. Jira Viewer'
found_env=0
for pid in $(pgrep -f 'next-server|next start|next-router-worker' 2>/dev/null); do
  value="$(tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep '^OSINT_APP_DIR=' | head -1)"
  if [[ -n "$value" ]]; then ok "processo $pid usa $value"; found_env=1; break; fi
done
if [[ $found_env == 0 ]]; then
  warn "OSINT_APP_DIR não encontrado no processo do Jira Viewer: vale o padrão $service_home/osint-app-current (código a partir de nov/2026)"
fi

section 'Resumo'
if (( ${#problems[@]} == 0 )); then
  printf '  Tudo certo. O Radar OSINT mostra no topo o commit no ar e a última verificação.\n'
else
  printf '  O que fazer:\n'
  n=0
  declare -A visto=()
  for p in "${problems[@]}"; do
    [[ -n "${visto[$p]:-}" ]] && continue
    visto[$p]=1; n=$((n + 1)); printf '  %d. %s\n' "$n" "$p"
  done
fi

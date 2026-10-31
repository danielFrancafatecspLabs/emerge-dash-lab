# Radar OSINT: atualização automática do app

O Radar OSINT (`/jira/osint`) embute o app do repositório `Colab-Claro/signals-osint`. Os **dados** (sinais e grafo)
vêm do vault de sinais (`signal-vault`, ver [README-signal-vault.md](README-signal-vault.md)); o **app** vem do
`signals-osint` e é publicado por este deploy.

## Por que não atualizava

O app tinha sido copiado uma vez para `public/osint-app` (14/10). Nada buscava os commits novos do `signals-osint`, e o
Next.js só serve os arquivos de `public/` que existiam no build: mesmo trocando a pasta na VM, os arquivos novos não
apareceriam.

## Como funciona agora

- A rota `src/app/osint-app/[[...caminho]]` serve o app lendo o disco a cada requisição: primeiro `OSINT_APP_DIR` (a
  versão publicada pelo deploy), depois a cópia `osint/bundle` que vem com o código.
- `ops/osint-app-deploy.sh` (timer de 5 minutos) busca `main` do `signals-osint`; se o commit é novo, instala as
  dependências, faz o build com `VITE_DATA_BASE=/jira/api/osint/data` e `VITE_API_BASE=/jira/api/osint`, valida e troca o
  link `current` de forma atômica. Um build que falha não troca nada. Guarda as 3 últimas versões.
- Não é preciso reiniciar o Jira Viewer.

## Caminhos

- script: `/usr/local/bin/osint-app-deploy`
- raiz do deploy: `/home/azureuser/osint-app-deploy` (repositório bare e `releases/<sha>/dist`)
- versão ativa: `/home/azureuser/osint-app-current` → no `.env` do Jira Viewer: `OSINT_APP_DIR=/home/azureuser/osint-app-current`
- credencial: a mesma do vault (`/home/azureuser/.config/signal-vault/git-credentials`, dono `azureuser`, modo `0600`),
  com acesso de leitura ao `signals-osint`. Outra pode ser indicada em `OSINT_CREDENTIAL_FILE` na unit.

## Instalação

```bash
sudo install -o root -g root -m 0755 ops/osint-app-deploy.sh /usr/local/bin/osint-app-deploy
sudo install -o root -g root -m 0644 ops/systemd/osint-app-deploy.service /etc/systemd/system/osint-app-deploy.service
sudo install -o root -g root -m 0644 ops/systemd/osint-app-deploy.timer /etc/systemd/system/osint-app-deploy.timer
sudo systemd-analyze verify /etc/systemd/system/osint-app-deploy.service /etc/systemd/system/osint-app-deploy.timer
sudo systemctl daemon-reload
sudo systemctl enable --now osint-app-deploy.timer
sudo systemctl start osint-app-deploy.service
```

Depois, acrescente `OSINT_APP_DIR=/home/azureuser/osint-app-current` ao ambiente do Jira Viewer e reinicie-o uma vez.
A VM precisa de Node.js e npm (os mesmos do Jira Viewer).

## Operação

```bash
sudo systemctl start osint-app-deploy.service                 # atualizar agora
cat /home/azureuser/osint-app-current/.osint-revision          # commit ativo
journalctl -u osint-app-deploy.service -n 100 --no-pager       # logs
bash ops/tests/osint-app-deploy-test.sh                        # teste do script (repositório local, build falso)
```

Para voltar uma versão, aponte o link para outra pasta de `releases/<sha>/dist` (como no README do vault).

## Se o mapa não mostrar sinais novos

O app guarda no navegador um conjunto importado à mão (botão de importar dados) e, enquanto ele existir, não busca os
sinais do servidor. Use a opção de restaurar os dados padrão do app para voltar a ver o vault.

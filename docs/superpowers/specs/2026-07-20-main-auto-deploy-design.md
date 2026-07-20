# Implantação automática da `main`

## Objetivo

Manter o Jira Viewer da VM `20.102.41.238` sincronizado com a branch `main` do repositório `Colab-Claro/jira-viewer`. A VM verificará mudanças a cada cinco minutos, publicará somente builds válidos e manterá a versão anterior disponível para rollback.

## Estado atual

- A aplicação está em `/home/azureuser/jira-viewer` e essa pasta não contém metadados Git.
- O serviço `jira-viewer.service` executa `npm start` como `azureuser`, com essa pasta como diretório de trabalho.
- `.env`, `.env.local`, `.portfolio-cache.json` e `.segmento-cache-v2.json` são dados locais que não podem ser substituídos pelo conteúdo do repositório.
- O serviço está ativo na porta 3003.

## Arquitetura escolhida

Um timer do systemd, agendado nos minutos `00, 05, 10, ...`, acionará um serviço `oneshot`. Esse serviço chamará um script de implantação idempotente executado como `azureuser`. Se uma execução ainda estiver ativa no próximo disparo, o systemd não iniciará uma segunda instância.

Sob `/home/azureuser/jira-viewer-deploy`, o script manterá quatro áreas separadas:

- um repositório Git local usado apenas para buscar a `main`;
- uma pasta de releases identificadas pelo SHA do commit;
- uma pasta compartilhada para ambiente e caches persistentes;
- um link simbólico `/home/azureuser/jira-viewer-current` apontando para a release ativa.

O `jira-viewer.service` passará a usar `/home/azureuser/jira-viewer-current` como diretório de trabalho. A instalação atual será mantida durante a migração e servirá como contingência até a primeira implantação validada.

## Credencial GitHub

O token autorizado pelo usuário ficará em um arquivo de credenciais exclusivo do `azureuser`, com permissão `0600`. O remote continuará sendo a URL limpa `https://github.com/Colab-Claro/jira-viewer.git`; o token não será incluído na URL do remote, nos units do systemd, no script versionado nem nos logs.

O token será transmitido ao servidor sem eco durante a configuração. Se ele for rotacionado, somente o arquivo de credenciais precisará ser atualizado.

## Fluxo de implantação

1. Obter o SHA atual de `origin/main`.
2. Encerrar sem mudanças quando o SHA já for o da release ativa.
3. Buscar o commit e criar uma nova pasta de release.
4. Ligar `.env`, `.env.local` e os dois arquivos de cache à área compartilhada.
5. Executar `npm ci` e `npm run build` na nova release.
6. Trocar o link `current` de forma atômica.
7. Reiniciar `jira-viewer.service`, confirmar o estado `active` e exigir HTTP `200` em `http://127.0.0.1:3003/jira/login`.
8. Em caso de falha após a troca, restaurar o link anterior e reiniciar a versão anterior.
9. Após sucesso, reter a release ativa e as duas releases anteriores.

Uma trava impede implantações concorrentes. A primeira falha em `git fetch`, instalação, build ou validação encerra a execução com erro e fica registrada no journal.

## Tratamento de falhas

- Falha antes da troca de release: o serviço atual não é interrompido.
- Falha de reinício ou verificação: o link anterior é restaurado e o serviço antigo é iniciado novamente.
- Falha de autenticação ou rede: nenhuma mudança é feita na aplicação ativa; o timer tentará novamente após cinco minutos.
- Alterações locais nos arquivos persistentes: são preservadas na área compartilhada e não participam do checkout Git.

## Validação

Após a instalação:

1. acionar manualmente o serviço de implantação;
2. comparar o SHA implantado com o SHA de `origin/main`;
3. confirmar `jira-viewer.service` ativo e HTTP `200` em `/jira/login` na porta 3003;
4. acionar uma segunda busca da `main`, atendendo à verificação solicitada pelo usuário, e confirmar implantação caso um commit novo tenha aparecido;
5. observar uma execução real do timer e conferir seus logs;
6. confirmar que uma execução sem commit novo não reinstala dependências nem reinicia a aplicação.

## Segurança e escopo

Arquivos de ambiente terão acesso restrito ao usuário do serviço. Nenhum segredo será gravado neste repositório local. A automação acompanhará somente `origin/main`; ela não fará push, merge ou alteração no GitHub.

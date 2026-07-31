# Sanitização de todas as mensagens de commit

## Objetivo

Substituir o assunto e o corpo de todos os commits alcançáveis pelas refs conhecidas do repositório por exatamente `updates`, sem alterar o conteúdo dos arquivos, autores, datas ou ordem do histórico.

## Escopo

- Reescrever a `main` e a branch local `ops/jira-viewer-auto-deploy` para impedir que o histórico local auxiliar reintroduza mensagens antigas.
- Publicar somente a `main`; a branch `ops/jira-viewer-auto-deploy` continuará exclusivamente local.
- Manter o `.env` local, ignorado, não rastreado e com permissão `0600`.
- Preservar a remoção histórica do `.env` já concluída.
- Não alterar código, dependências ou arquivos da aplicação durante a reescrita.
- Qualquer commit preparatório criado antes da reescrita também usará a mensagem `updates`.

## Estratégia

A operação acontecerá em um mirror temporário, separado do worktree:

1. registrar os OIDs atuais de `main`, `origin/main` e `ops/jira-viewer-auto-deploy`;
2. confirmar que o worktree está limpo e que `.env` não é alcançável por nenhuma ref conhecida;
3. criar um mirror temporário contendo as duas branches locais;
4. usar `git-filter-repo` com callback de mensagem para retornar exatamente `updates\n` em todos os commits;
5. comparar cada par do commit-map para confirmar que as árvores, autores, e datas de autoria e commit permaneceram iguais;
6. confirmar que toda mensagem reescrita é exatamente `updates` e que `.env` continua ausente;
7. consultar `origin/main` imediatamente antes da publicação;
8. publicar somente `main` com force-push protegido por lease baseado no OID registrado;
9. atualizar as refs locais `main` e `ops/jira-viewer-auto-deploy` para os OIDs reescritos;
10. expirar reflogs, podar objetos locais antigos e executar a auditoria final local e remota.

Não será usado `push --mirror`, porque o remoto conhecido contém somente `main` e a branch local `ops/...` não deve ser publicada.

## Invariantes e validação

- Cada commit alcançável por `main` e `ops/jira-viewer-auto-deploy` terá assunto e corpo equivalentes a `updates\n`.
- Para cada commit antigo e novo correspondente, o OID da árvore será idêntico.
- Autor, e-mail do autor, data de autoria, committer, e-mail do committer e data de commit serão preservados.
- A topologia e a contagem de commits de cada branch serão preservadas.
- `git log --all -- .env`, buscas nas árvores e `git rev-list --objects --all` não encontrarão `.env`.
- Os três blobs históricos conhecidos do `.env` continuarão ausentes.
- `git fsck --full --strict` terminará sem erro estrutural.
- Um clone novo do GitHub apontará `main` para o OID reescrito esperado e repetirá as mesmas verificações.

## Publicação segura

O force-push será abortado se `origin/main` não estiver no OID registrado imediatamente antes da operação. Nenhuma ref remota além de `refs/heads/main` será atualizada.

Os novos hashes invalidarão novamente clones e links baseados no histórico anterior. Colaboradores deverão reclonar ou realinhar seus clones, sem fazer merge do histórico antigo.

## Limites

A reescrita remove as mensagens da listagem atual de commits da `main`, mas não apaga por conta própria páginas em cache, refs internas de pull request, forks ou clones de terceiros. Os SHAs anteriores poderão continuar acessíveis diretamente até o GitHub Support remover caches e executar garbage collection no servidor.

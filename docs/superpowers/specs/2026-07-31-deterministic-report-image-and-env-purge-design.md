# Imagem determinística do relatório e remoção do `.env`

## Objetivo

Preservar a experiência atual de geração do relatório em imagem sem chamar `gpt-image-2` e remover o arquivo `.env` de todas as referências Git conhecidas, mantendo uma cópia local não rastreada e protegida.

## Escopo confirmado

- Manter o botão de geração, estado de carregamento, mensagem de erro, prévia e download.
- Manter o arquivo final em PNG retrato de `1024x1536` e o nome `report-beon-AAAA-MM-DD.png`.
- Preservar conteúdo e identidade visual equivalentes ao infográfico atual; fidelidade pixel a pixel não é exigida.
- Remover toda referência ativa a `gpt-image-2`, `AZURE_OPENAI_DEPLOYMENT_IMAGE` e `client.images.generate`.
- Manter as integrações OpenAI de texto existentes, usadas pelo Cientista, insights e classificadores.
- Remover `.env` do índice, de `main`, da branch local `ops/jira-viewer-auto-deploy`, das refs remotas encontradas e dos objetos/reflogs locais alcançáveis.
- Se houver commits, usar exclusivamente a mensagem `updates`.

## Imagem do relatório

### Arquitetura

O contrato HTTP existente será preservado. `GET /jira/api/report/image` continuará calculando as mesmas métricas a partir dos dados Jira e continuará respondendo com `{ image, format: "png" }`, onde `image` é o PNG em base64.

A chamada ao modelo será substituída por duas unidades isoladas:

1. um construtor puro recebe as métricas e produz um SVG de `1024x1536`;
2. o endpoint rasteriza esse SVG para PNG com `@resvg/resvg-js` e devolve o contrato atual.

O template terá cabeçalho vermelho, resumo semanal, estágios do funil, gráfico horizontal dos cinco principais domínios e rodapé beOn Labs. Textos, números e barras serão determinísticos e escapados antes de entrar no SVG; rótulos longos serão truncados e valores financeiros terão tamanho adaptativo para permanecer dentro dos cartões. A data será produzida explicitamente no fuso `America/Sao_Paulo`.

O componente do botão conservará seu fluxo atual. Apenas referências visíveis a IA serão neutralizadas: `Gerar Imagem IA` passa a `Gerar Imagem`, e o texto alternativo deixa de afirmar que a imagem foi criada por IA.

### Dados e compatibilidade

As regras numéricas atuais serão mantidas para evitar mudança de resultado junto com a troca do renderizador:

- total de iniciativas sem novo filtro de atividade;
- total de experimentos;
- `Em andamento` conforme o nome atual do status;
- `Em Piloto` com a mesma regra atualmente usada pelo endpoint;
- concluídos nos status atuais;
- benefício como soma de `beneficioQuantitativo`;
- cinco domínios ordenados pela contagem de experimentos.

O pacote `openai` permanecerá porque outras funcionalidades dependem dele. `@resvg/resvg-js` será declarado como dependência direta para rasterizar o SVG com suporte ao Node.js 18 e sem introduzir os avisos de segurança presentes na versão de `sharp` avaliada.

A rota da imagem não executará os classificadores OpenAI de texto, porque `metaCategoria` e `mercado` não participam de nenhuma métrica renderizada. O mapper receberá classificações vazias, preservando os demais campos e evitando latência e custo sem efeito no relatório.

### Falhas

- Erros internos serão registrados no servidor, mas a resposta pública usará uma mensagem genérica.
- O endpoint retornará erro quando a rasterização não produzir um PNG válido.
- O botão continuará exibindo erro de geração ou de conexão sem iniciar download inválido.
- A resposta continuará restrita pelo middleware de autenticação existente.

## Remoção do `.env`

### Proteção futura

O `.gitignore` passará a ignorar `/.env` e arquivos de ambiente derivados, preservando a possibilidade de versionar somente um eventual `.env.example` sanitizado. O `.env` local será mantido fora do índice com permissão `0600`. A configuração `AZURE_OPENAI_DEPLOYMENT_IMAGE` será retirada dessa cópia local; os demais valores não serão exibidos nem copiados para documentação.

### Reescrita segura

A reescrita acontecerá em um mirror temporário, não diretamente no worktree de desenvolvimento:

1. registrar os OIDs anteriores das refs a atualizar e confirmar que os worktrees estão limpos;
2. instalar ou disponibilizar `git-filter-repo` fora do repositório, pois ele não está presente atualmente;
3. criar um mirror temporário que contenha `main` e `ops/jira-viewer-auto-deploy`;
4. confirmar as refs do GitHub imediatamente antes da reescrita — a inspeção atual encontrou somente `refs/heads/main` e nenhuma tag;
5. executar `git filter-repo --path .env --invert-paths --force` no mirror;
6. verificar todas as árvores e objetos do mirror antes de publicar;
7. atualizar `origin/main` com force-push protegido por lease baseado no OID previamente registrado;
8. atualizar as refs locais `main` e `ops/jira-viewer-auto-deploy` para seus OIDs reescritos, sem publicar a branch local `ops/...`;
9. expirar reflogs e remover objetos locais inalcançáveis somente depois das verificações;
10. verificar novamente o histórico local e remoto.

O metadata de worktree associado a `ops/jira-viewer-auto-deploy` aponta atualmente para um caminho inexistente e está marcado como `prunable`. Como a branch não está efetivamente disponível nesse worktree, sua ref poderá ser atualizada após confirmação final de que não há checkout ativo.

Não será usado `push --mirror`: somente refs explicitamente inventariadas serão alteradas, evitando apagar refs remotas fora do escopo. Se a proteção da branch impedir o force-push, a execução local será preservada e o bloqueio será informado sem tentar contornar a política do GitHub.

### Limites de segurança

Reescrever o Git não revoga credenciais nem remove cópias em forks, clones de terceiros, caches de CI, logs ou refs internas de pull requests. Todas as credenciais presentes em qualquer versão histórica do `.env` devem ser rotacionadas. Colaboradores precisarão reclonar ou realinhar seus clones ao novo histórico antes de voltar a enviar commits.

## Validação

### Aplicação

- Teste unitário confirma que o SVG contém dimensões, textos e valores escapados esperados.
- Teste de integração do renderizador confirma assinatura PNG e metadados `1024x1536`.
- Teste do endpoint confirma o contrato `{ image, format: "png" }` sem invocar a API de imagens.
- `npm run build` confirma compatibilidade com o Next.js atual.
- Uma busca nos arquivos ativos da aplicação e de configuração, excluindo documentação histórica e testes de regressão, não encontra `gpt-image-2`, `AZURE_OPENAI_DEPLOYMENT_IMAGE`, `images.generate` nem textos que atribuam o PNG à IA.

### Git

- `git ls-files .env` não retorna resultado.
- `git check-ignore -v .env` confirma a nova regra.
- `git log --all -- .env` não retorna commit.
- Nenhuma árvore em qualquer ref conhecida contém `.env`.
- `git rev-list --objects --all` não referencia `.env`.
- `git fsck --full` termina sem erro estrutural.
- `git ls-remote --heads --tags origin` mostra somente os OIDs reescritos esperados.
- O `.env` local continua presente, não rastreado, sem o deployment de imagem e com permissão `0600`.

## Fora do escopo

- Alterar modelos ou comportamento das integrações OpenAI de texto.
- Corrigir as regras de negócio históricas usadas pelas métricas da imagem.
- Revogar credenciais em provedores externos em nome do usuário.
- Publicar a branch local `ops/jira-viewer-auto-deploy`.
- Garantir remoção de cópias fora do repositório GitHub controlado por este clone.

# Navegação do Research Vault no Jira Viewer

## Objetivo

Transformar a área `/pesquisas` do Jira Viewer em um navegador somente leitura do vault `research-obsidian`, com duas visualizações equivalentes: uma árvore de arquivos organizada e um grafo navegável no estilo Obsidian. A VM manterá uma cópia automática e validada da branch `main` do vault, sem exigir rebuild ou reinício do Jira Viewer a cada pesquisa publicada.

## Regras confirmadas

- Uma pesquisa está concluída quando existe um arquivo Markdown principal diretamente em `Researchs/<categoria>/<tema>/`.
- O painel mostra somente pesquisas concluídas; não existe backlog ou estado “em andamento”.
- `created` é a data de conclusão/inclusão da pesquisa no acervo.
- `updated` é a data da revisão mais recente declarada no Markdown.
- Categorias, conceitos e papers são conteúdo de navegação e contexto; apenas os arquivos principais dos temas contam como pesquisas concluídas.
- A interface terá modos “Arquivos” e “Grafo”, preservando a leitura do documento selecionado.
- O repositório de pesquisas continua sendo a fonte de verdade. O Jira Viewer é somente leitura.

## Fonte de dados e atualização

A VM manterá o vault em `/home/azureuser/research-obsidian-current`, um link simbólico para uma release imutável identificada pelo SHA do Git. Um timer do systemd buscará `origin/main` a cada cinco minutos. Quando houver um SHA novo, o atualizador criará um snapshot com `git archive`, validará a estrutura e as datas dos arquivos principais, gravará `.research-revision` e trocará o link de forma atômica.

O atualizador não reinicia o Jira Viewer: a API resolve o link e lê a revisão a cada carregamento. A release atual e as duas anteriores ficam disponíveis para rollback. Falhas de rede, autenticação ou validação preservam integralmente a release ativa.

Em desenvolvimento, `RESEARCH_VAULT_PATH=/mnt/sda1/Projects/claro/research`. Na VM, `RESEARCH_VAULT_PATH=/home/azureuser/research-obsidian-current`. A credencial GitHub não entra no repositório, nos units, nos argumentos do processo nem nos logs.

## Modelo do vault

O parser percorre somente arquivos `.md` sob `Researchs/` e produz documentos tipados:

- `category`: Markdown diretamente em `Researchs/<categoria>/`;
- `topic`: Markdown diretamente em `Researchs/<categoria>/<tema>/`;
- `concept`: Markdown sob uma pasta `Concepts`;
- `paper`: Markdown sob uma pasta `Papers`.

O arquivo principal não precisa repetir exatamente o nome da pasta. Essa descoberta estrutural cobre o exemplo `Adaptative Learning Model for AI Agents (ALMAA).md`.

Cada documento contém `id`, caminho relativo normalizado, nome, título, tipo, categoria, tema, tags, `created`, `updated` e wikilinks. Os links `[[Alvo]]` e `[[Alvo|Rótulo]]` são resolvidos por caminho, nome do arquivo ou título. A hierarquia gera arestas próprias; wikilinks geram arestas de relacionamento sem duplicação.

Datas ausentes ou inválidas em categorias, conceitos e papers ficam nulas. Um arquivo principal de tema com `created` ou `updated` ausente/inválido invalida o snapshot remoto e produz diagnóstico seguro no ambiente local.

## API

`GET /jira/api/pesquisas` devolve o índice do vault: revisão, documentos sem corpo e arestas. `GET /jira/api/pesquisas?file=<caminho>` devolve metadados e corpo Markdown de um documento conhecido.

O parâmetro `file` nunca é convertido diretamente em caminho do sistema. A API normaliza o valor e só permite caminhos presentes no índice, impedindo traversal. O cache em memória é invalidado quando `.research-revision` ou o caminho real do link muda. Erros públicos não expõem caminhos absolutos, credenciais ou detalhes internos.

## Interface

A página mantém três áreas lógicas:

1. uma barra superior compacta com pesquisa, alternância “Arquivos/Grafo”, revisão do vault e total de pesquisas concluídas;
2. a navegação ocupando a área principal quando nenhum documento está aberto;
3. um painel de leitura que abre ao selecionar qualquer nó ou arquivo e pode ser fechado sem perder o estado da navegação.

### Modo Arquivos

A árvore segue `categoria → pesquisa → Concepts/Papers → documento`. Categorias e pesquisas são recolhíveis, possuem ícones e contagens. Pesquisas mostram `created`; documentos revisados em data posterior mostram também `updated`. A busca filtra por título, nome, tags e caminho, mantendo ancestrais necessários para contexto.

### Modo Grafo

O grafo usa SVG responsivo e layout determinístico por clusters de categoria. Categorias, pesquisas, conceitos e papers têm cores e tamanhos distintos. Arestas hierárquicas são discretas e wikilinks têm maior contraste. O usuário pode aplicar zoom, mover o canvas, focar resultados da busca e selecionar um nó para abrir o documento. Tooltip e painel de leitura mostram tipo, categoria e datas.

### Leitura Markdown

O corpo usa `react-markdown` com `remark-gfm`, sem `dangerouslySetInnerHTML`. Links HTTP abrem com `noopener noreferrer`. Wikilinks internos viram botões de navegação quando o alvo foi resolvido e texto destacado quando não existe. HTML bruto do Markdown não é executado.

## Falhas e estados vazios

- Vault indisponível: a página mostra indisponibilidade temporária e a API responde 503.
- Snapshot vazio: a página explica que nenhuma pesquisa concluída foi encontrada.
- Documento removido entre índice e clique: a API responde 404 e a seleção é fechada com aviso.
- Wikilink sem alvo: permanece legível, sem quebrar o grafo.
- Data inválida localmente: o documento aparece sem data e o servidor registra o caminho relativo; no deploy remoto a validação bloqueia a ativação.

## Segurança

- Remover o token embutido da URL do remote local do `research` e rotacioná-lo, pois já foi exposto.
- Não servir arquivos fora de `Researchs/` nem arquivos que não sejam Markdown.
- Não executar HTML, JavaScript ou componentes provenientes do vault.
- Manter arquivos de credencial e ambiente com modo `0600`.
- O serviço de atualização roda como `azureuser`; apenas a instalação dos units exige `sudo`.

## Validação

- Testes unitários cobrem descoberta do arquivo principal com nome diferente da pasta, frontmatter, datas, classificação, wikilinks, arestas, ordenação e rejeição de traversal.
- Testes do atualizador cobrem primeira publicação, no-op, snapshot inválido, falha antes da troca e retenção.
- Testes puros cobrem layout determinístico do grafo e filtragem da árvore.
- `npm test` e `npm run build` validam aplicação e tipos.
- Na VM, a revisão do endpoint deve coincidir com `origin/main` do research, os dois modos devem carregar e o health check do Jira Viewer deve retornar HTTP 200.

## Fora do escopo

- Editar Markdown pelo Jira Viewer.
- Representar pesquisas planejadas ou em andamento.
- Métricas de produtividade, metas ou tempo de execução da pesquisa.
- Reproduzir plugins, backlinks ou o canvas completo do Obsidian.
- Sincronizar alterações locais não commitadas do vault.

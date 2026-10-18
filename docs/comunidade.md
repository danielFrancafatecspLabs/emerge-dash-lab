# Comunidade beOn Labs

Experiência de rede social de inovação em `/comunidade` e a home de todos os perfis: depois do login, todo mundo
cai no feed. Para a role `community` é a única área; executivos, financeiro e admins veem os painéis no mesmo menu.

## Acesso

- Role `community` (Admin › Usuários › Perfil "Comunidade"). O middleware restringe essa role a
  `/comunidade/*`, `/api/community/*`, `/api/stories`, `/api/auth/*`, leitura de `/api/pesquisas` e imagens de `public/`.
  Qualquer outra rota redireciona para `/comunidade` (páginas) ou responde 403 (APIs).
- As demais roles não mudam.

## Áreas

| Rota | Conteúdo |
|---|---|
| `/comunidade` | Feed: stories, publicar, filtros (Para você, Mais recentes, Em alta, Sem resposta, Pesquisas, Experimentos, Seguindo), tópicos e busca |
| `/comunidade/cientista` e `/[sid]` | Chat com o Cientista (cientista-lab): jornadas Solicitante e Desenvolvedor, mapa do problema, ficha, desenho e kit |
| `/comunidade/pessoas` e `/[username]` | Diretório de pessoas e perfil (edição do próprio perfil) |
| `/comunidade/pesquisas` | Materiais da comunidade, acervo beOn Labs (`/api/pesquisas`) e catálogo de experimentos |
| `/comunidade/future-thinking` | Sinais de futuro, radar por dimensão e horizonte, provocações |
| `/comunidade/trilha` | Trilha de Experimentação em 8 etapas, com progresso por pessoa |
| `/comunidade/mensagens` | Mensagens diretas |
| `/comunidade/salvos` | Publicações salvas, tópicos acompanhados e pessoas seguidas |
| `/comunidade/post/[id]` | Publicação com a conversa completa (link compartilhável) |

## Dados

Tudo o que é publicado é um `CommunityPost` (`src/lib/community/model.ts`), diferenciado por `kind`:
`discussao`, `pergunta`, `pesquisa`, `experimento` e `sinal`. Arquivos em `data/` (caminho configurável por variável de ambiente):

| Arquivo | Variável | Conteúdo |
|---|---|---|
| `posts.json` | `POSTS_FILE_PATH` | Publicações, comentários e marcações "Útil" |
| `community-profiles.json` | `COMMUNITY_PROFILES_PATH` | Perfil social, interesses, salvos, seguidos, progresso da trilha, preferências |
| `community-messages.json` | `COMMUNITY_MESSAGES_PATH` | Conversas diretas |
| `chat-presence.json` | `CHAT_PRESENCE_PATH` | Último acesso (base de "ativo agora") |
| `stories.json` | `STORIES_FILE_PATH` | Stories editoriais (Admin › Stories) |

## Cientista

O chat inteligente vem do projeto [cientista-lab](https://github.com/danielFrancafatecspLabs/cientista-lab) (METAEXP, FastAPI).
A Comunidade não chama o backend direto do navegador: tudo passa por `/api/community/cientista/*`, que

- exige a sessão da Comunidade (o backend do Cientista não tem login);
- registra cada conversa criada no perfil da pessoa e só deixa a dona (ou um admin) abrir;
- libera apenas a conversa (`papeis`, `sessoes`, `iniciar`, `mensagens`, `arquivos`, `retomar`, `ficha.md`, `kit`);
  fila e decisões do Lab, Sponsor, bancada e pedidos de recursos continuam no próprio cientista-lab;
- repassa o fluxo SSE sem bufferizar.

Configuração: `CIENTISTA_API_URL` (ex.: `http://cientista-lab:8000`). Sem ela, a aba mostra que o Cientista não está conectado.

## Dependências e limites conhecidos

- **Persistência**: os stores gravam em disco. Em ambiente serverless com sistema de arquivos somente leitura
  (ex.: Vercel), as gravações não persistem — é preciso um banco ou storage antes de abrir para muitos usuários.
- **Tempo real**: mensagens, presença e notificações são atualizadas por consulta periódica (8 s nas conversas,
  60 s no restante). Não há WebSocket.
- **Anexos**: não há upload de arquivos; publicações aceitam um link (SharePoint, OneDrive, YouTube…).
- **Notificações**: apenas dentro da plataforma (comentários, respostas e mensagens). Sem e-mail ou push.
- **Eventos**: a lista de encontros mostra os rituais recorrentes; datas e convites seguem no calendário corporativo.
- **Acervo de pesquisas**: depende de `RESEARCH_VAULT_PATH`; sem ele, a aba mostra o estado de indisponível.
- **Stories da comunidade**: são as publicações recentes de membros (uma por pessoa, até 7 dias), com capa ilustrada
  gerada pelo tipo de conteúdo. Stories editoriais usam a imagem cadastrada no Admin.

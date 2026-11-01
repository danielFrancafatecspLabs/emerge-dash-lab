# beOn Labs — Dashboard Executivo e Comunidade

Aplicação Next.js do beOn Labs (Claro Brasil). A entrada é a tela de login "Bem-vindo ao beOn Labs", onde a pessoa
entra ou pede uma conta. Depois do login, todo mundo cai no mesmo lugar: o feed da Comunidade. É um app só, com um
único menu:

- **Comunidade** (todos os perfis) — rede de tecnologias emergentes e experimentação: feed, Cientista (chat
  inteligente), Pesquisas, Future Thinking, Trilha de Experimentação, pessoas e mensagens. Detalhes em
  [docs/comunidade.md](docs/comunidade.md).
- **Painéis e rituais** (conforme o perfil) — portfólio de inovação lido do Jira (projeto `GL`): estratégia,
  operacional, portfólio, benefícios, priorização, OKRs, monitoramento, Report/MBR e Semanal.
- **Administração** (admin) — usuários, pedidos de cadastro e stories.

O modelo de domínio (Iniciativa × Experimento, boards, campos customizados) está em [CLAUDE.md](CLAUDE.md).

## Stack

Next.js 14 (App Router, `basePath: /jira`) · React 18 · TypeScript · Tailwind CSS · Recharts · Vitest

## Como rodar

Requisito: Node.js 20+.

```bash
npm install
cp .env.example .env.local        # preencha AUTH_SECRET, Jira e as chaves de IA
npm run dev                       # http://localhost:3003/jira
```

Para criar ou redefinir um administrador em `data/users.json`:

```bash
ADMIN_PASSWORD='uma-senha-forte-de-12+' node scripts/create_admin.js nome.sobrenome "Nome Sobrenome"
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 3003 |
| `npm test` | Testes (Vitest) |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npx tsc --noEmit` | Checagem de tipos (o build também falha com erro de tipo) |
| `npm run build && npm start` | Build e servidor de produção |

Todas as variáveis de ambiente estão descritas em [.env.example](.env.example).

### Cache dos dados do Jira: uma leitura por dia

Tudo o que vem do Jira (painéis, Semanal, OKRs, Priorização, a aba Experimentos ativos e a home da Comunidade) passa
por `fetchDashboardRaw` (`src/lib/jira.ts`), que guarda o resultado em memória e em `.cache/jira-dashboard.json`
(`src/lib/cache-dados.ts`). A regra (`POLITICA_DO_JIRA`):

- O Jira é lido **uma vez por dia** (horário de Brasília): ~30 leituras por mês. A primeira pessoa que entra no dia
  dispara a leitura (no login, sem esperar por ela); todo mundo depois usa a mesma leitura guardada.
- Quem chega antes de a leitura do dia terminar vê na hora os dados de ontem.
- Cada página com dados do Jira mostra quando eles foram lidos ("Jira lido hoje às 08:12").
- A leitura é incremental: changelog e último comentário só das issues novas ou alteradas.
- Se o Jira falhar, a última leitura continua valendo (por até 30 dias) e só se tenta de novo depois de 2 horas.
- Sem nenhuma leitura guardada e com o Jira fora do ar, as telas mostram "Desculpe, não conseguimos acessar o Jira" e
  quem procurar (`src/lib/jira-contatos.ts`). Não há mais dados de exemplo no lugar dos reais.
- "Ler o Jira agora" (`POST /api/clear-cache`, só admins) força uma leitura extra fora da regra diária.
- Exceção: o diagnóstico de bloqueios do Admin (`/api/admin/diagnostico-bloqueios`) consulta o Jira na hora, quando um
  admin o abre.

## Estrutura

```
src/
├── app/                    Rotas (páginas e API). Cada área do painel tem sua pasta.
│   ├── api/                Rotas de API (Jira, IA, admin, comunidade…)
│   ├── login/              Login e pedido de cadastro
│   └── (app)/              Páginas autenticadas, todas na mesma moldura (layout.tsx)
│       ├── comunidade/     Comunidade (a home)
│       ├── admin/          Usuários e stories
│       └── …               Painéis e rituais (estrategia, operacional, semanal…)
├── components/
│   ├── ui/                 Design system: primitivas compartilhadas (botões, avatar, diálogo, campos, estados)
│   ├── shell/              Moldura do app (menu único) e cabeçalho das páginas de painel
│   ├── comunidade/         Experiência da Comunidade
│   └── …                   Componentes de cada painel (dashboard, report, weekly, beneficios…)
├── lib/
│   ├── auth/               Sessão assinada, usuários, política de acesso, limite de tentativas
│   ├── community/          Modelo e regras da Comunidade, stores e integração com o Cientista
│   ├── storage/            Persistência em JSON (escrita atômica)
│   ├── validation/         Validação de entrada (URLs)
│   ├── jira.ts, mappers.ts Cliente do Jira e montagem dos dados do painel
│   └── …                   Regras do painel (weekly, semanal, governança, benefícios, report, IA)
└── middleware.ts           Aplica a política de acesso a todas as requisições
data/                       Usuários, validações de benefício e posts; perfis, mensagens e stories da Comunidade não são versionados
docs/                       Documentação funcional e referências
ops/                        Implantação do acervo de pesquisas (systemd)
scripts/                    Criação de admin e utilitários
```

## Acesso e perfis

A sessão é um cookie `HttpOnly` assinado com HMAC (`AUTH_SECRET`), válido por 7 dias. Toda a política de acesso
fica em [`src/lib/auth/access-policy.ts`](src/lib/auth/access-policy.ts) e é aplicada pelo middleware:

| Perfil | O que acessa |
|---|---|
| `admin` | Tudo, incluindo Admin, Benefícios, Pesquisas, Semanal e o Cientista do painel |
| `executivo` | Painéis executivos, insights de IA e atualização do cache |
| `financeiro` | Painéis executivos; edita validações de benefício |
| `viewer` | Painéis executivos sem áreas restritas |
| `community` | Somente a Comunidade (e leitura do acervo de pesquisas) |

As rotas de API conferem também o cadastro: um usuário desativado perde o acesso na hora, mesmo com cookie válido.

### Cadastro com aprovação

Na tela de login, a aba **Criar conta** pede nome, e-mail corporativo, área e senha. O pedido entra em
`data/users.json` como conta inativa com `status: "pendente"` e não dá acesso a nada. Quem tenta entrar antes da
aprovação vê o aviso de cadastro em análise. Em **Admin → Usuários**, os pedidos aparecem no topo (o menu mostra a
contagem): o admin escolhe o perfil e aprova, ou recusa e o pedido é removido.

- `POST /api/auth/register` é público, limitado a 5 pedidos por IP por hora e a 300 pedidos pendentes no total.
- Um e-mail já cadastrado recebe a mesma resposta de um pedido novo, para não revelar quem tem conta.
- `POST /api/admin/users/:id/aprovacao` (`{ decisao: "aprovar" | "recusar", role }`) é só para admin.

## Portfólio: quadros e filtros

A aba **Portfólio** mostra os dois boards do Jira com as colunas que eles têm lá:

- **Iniciativas** — Kanban do board de Ideação; cada cartão mostra os experimentos da iniciativa (ciclos).
- **Experimentos** — Kanban do board de Experimentação/Piloto (Epics), com a iniciativa-mãe, prazo e bloqueio.
- **Lista** — tabela de iniciativas ou de experimentos, com colunas escolhidas, ordenação e exportação em CSV.

Os filtros cobrem os campos dos dois boards (situação, colunas e status, lab, sponsor, BO, diretoria, domínio,
segmento, mercado, portfólio, impacto, faixas de benefício e custo, complexidade, tecnologia, prioridade, bloqueio,
prazo, pendências de cadastro…), mostram quantos itens cada valor tem e valem nas três visões: na de iniciativas, um
campo do experimento olha os experimentos de cada iniciativa; na de experimentos, os campos da iniciativa olham a mãe.
Dá para usar raias (Kanban) ou grupos (Lista) por campo. O estado da visão fica na URL (o link abre a mesma visão e o
mesmo item) e pode ser salvo em **Visões** (neste navegador); há visões prontas, como "Bloqueios" e "Prazos vencidos".
O botão **Maximizar** (presente em todas as abas do portal, pelo `PortalPage`) esconde o menu lateral e as barras do
app; a escolha fica lembrada por aba neste navegador.

O motor (campos, filtros, facetas, URL) está em `src/lib/portfolio/filtros.ts`; a montagem a partir do Jira, em
`src/lib/portfolio/dados.ts`.

## Semanal: deck do Comitê e PPTX editável

A aba **Semanal** reúne o ritual semanal (a antiga aba Weekly foi unificada aqui; `/weekly` redireciona):

1. **Deck do Comitê beOn Labs (V7)** com dados do Jira: capa, objetivo, visão geral (`buildSemanalData`),
   principais motivos de cancelamento (campo "Motivo de Bloqueio" dos Epics cancelados, com o histórico como
   reserva; até 5 motivos, os demais em "Outros motivos", e os sem motivo numa linha à parte), divisores, listas por fase (Em escala, Aguardando piloto, Em piloto, Em andamento, Backlog) e encerramento.
   Os botões DETALHES levam à lista da fase, e a seta de cada lista volta à visão geral.
2. **Acompanhamento da semana**: governança por domínio e fase, bloqueios, patrocinadores e aprendizados
   (download em PNG/JPG em cada slide).

**Baixar PPTX editável** (`GET /api/semanal/pptx`, só admin) gera o deck inteiro em PowerPoint, com formas nativas
nas mesmas posições da tela, a arte original do deck nas capas e divisores (`public/semanal`) e links entre slides
nos botões DETALHES e "voltar". A sequência de páginas, a paginação e a formatação ficam em
`src/lib/semanal-deck.ts`, usado pela tela e pelo gerador (`src/lib/semanal-pptx.ts`): os dois nunca divergem. Sem o
Jira, o arquivo sai com os dados de exemplo (o nome termina em `-exemplo`).

## Design system

Comunidade, login e painéis usam os mesmos tokens de cor (`beon-*` em `tailwind.config.ts`: `red`, `redhi`, `tint`,
`ink`, `body`, `muted`, `line`, `soft`) e as primitivas de `src/components/ui`.

Todas as páginas autenticadas ficam em `src/app/(app)` e compartilham o `AppShell` (`src/components/shell`): um único
menu com as áreas da Comunidade, os atalhos pessoais e, conforme o perfil, os painéis, rituais e a administração
(com a contagem de cadastros pendentes). Trocar de área não remonta o menu, e publicar, notificações e mensagens
funcionam em qualquer página. No celular, a navegação inferior traz as áreas da Comunidade e o botão de menu abre o
restante. O mapa do menu está em `src/components/shell/nav.ts`.

Páginas de painel usam `PortalPage`, que desenha a barra com título, ações e "Atualizar dados" — os gráficos mantêm
o estilo próprio:

```tsx
<PortalPage title="Operacional" description="…" actions={<MeuFiltro />} refreshable>
  {conteúdo da página}
</PortalPage>
```

`fit` deixa a página com a altura da tela (decks e chat rolam por dentro) e `chrome={false}` esconde o menu
(modo apresentação).

O login segue o layout dividido: foto e mensagem à esquerda ("beOn Labs — Comunidade de Experimentação da
Claro") e o formulário num painel branco à direita, com "Entrar" como padrão e "Criar conta" ao lado. No celular, a
foto vira um cabeçalho curto e o formulário vem logo abaixo. A foto fica em `public/login-fundo.jpg`; para trocar,
substitua o arquivo ou defina `NEXT_PUBLIC_LOGIN_PHOTO_URL`.

## Segurança

- Senhas com PBKDF2-SHA512 (100 mil iterações) e comparação em tempo constante.
- Login limitado a 8 tentativas por IP e usuário a cada 15 minutos.
- Cookies `HttpOnly` e `SameSite=Lax`; `Secure` quando o acesso chega por HTTPS (direto ou via proxy com `X-Forwarded-Proto`).
- Cabeçalhos de segurança em todas as respostas (CSP `frame-ancestors`, `X-Frame-Options`, `nosniff`…). HSTS fica a cargo do servidor web/proxy.
- Senhas definidas no Admin precisam de 10+ caracteres e não podem ser triviais; nenhum admin consegue
  desativar ou excluir o próprio acesso.
- Links e imagens enviados por pessoas usuárias só aceitam `http(s)` ou caminhos internos.
- O Cientista (cientista-lab) não tem login próprio: a Comunidade o acessa por um proxy que exige sessão
  e restringe cada conversa à pessoa que a criou.

Pontos de atenção para quem implanta:

- Use um `AUTH_SECRET` longo e aleatório e sirva a aplicação só por HTTPS.
- `src/lib/auth/users.ts` traz usuários de reserva (usados quando `data/users.json` não existe, como no build da
  Vercel). Prefira manter os usuários no arquivo de dados e troque as senhas que já foram versionadas.
- Os stores em `data/` gravam em disco. Em ambiente com sistema de arquivos somente leitura (serverless), as
  gravações não persistem; use um volume persistente ou migre os stores para um banco.

## Documentação

- [CLAUDE.md](CLAUDE.md) — domínio do Jira: Iniciativas, Experimentos, boards e campos
- [docs/comunidade.md](docs/comunidade.md) — Comunidade, Cientista e dados da Comunidade
- [ops/README-research-vault.md](ops/README-research-vault.md) — sincronização do acervo de pesquisas

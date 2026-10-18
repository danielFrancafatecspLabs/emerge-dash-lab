# beOn Labs — Dashboard Executivo e Comunidade

Aplicação Next.js do beOn Labs (Claro Brasil). A entrada é a tela de login "Bem-vindo ao beOn Labs", onde a pessoa
entra ou pede uma conta. Depois do login, todo mundo cai no mesmo lugar: o feed da Comunidade. É um app só, com um
único menu:

- **Comunidade** (todos os perfis) — rede de tecnologias emergentes e experimentação: feed, Cientista (chat
  inteligente), Pesquisas, Future Thinking, Trilha de Experimentação, pessoas e mensagens. Detalhes em
  [docs/comunidade.md](docs/comunidade.md).
- **Painéis e rituais** (conforme o perfil) — portfólio de inovação lido do Jira (projeto `GL`): estratégia,
  operacional, portfólio, benefícios, priorização, OKRs, monitoramento, Report/MBR, Weekly e Semanal.
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
| `npm run weekly:export` | Gera o PPTX da Weekly a partir das telas (ver `scripts/weekly-export`) |

Todas as variáveis de ambiente estão descritas em [.env.example](.env.example).

## Estrutura

```
src/
├── app/                    Rotas (páginas e API). Cada área do painel tem sua pasta.
│   ├── api/                Rotas de API (Jira, IA, admin, comunidade…)
│   ├── login/              Login e pedido de cadastro
│   └── (app)/              Páginas autenticadas, todas na mesma moldura (layout.tsx)
│       ├── comunidade/     Comunidade (a home)
│       ├── admin/          Usuários e stories
│       └── …               Painéis e rituais (estrategia, operacional, weekly…)
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
data/                       Usuários e validações de benefício; arquivos da Comunidade (não versionados)
docs/                       Documentação funcional e referências
ops/                        Implantação do acervo de pesquisas (systemd)
scripts/                    Exportação da Weekly e criação de admin
```

## Acesso e perfis

A sessão é um cookie `HttpOnly` assinado com HMAC (`AUTH_SECRET`), válido por 7 dias. Toda a política de acesso
fica em [`src/lib/auth/access-policy.ts`](src/lib/auth/access-policy.ts) e é aplicada pelo middleware:

| Perfil | O que acessa |
|---|---|
| `admin` | Tudo, incluindo Admin, Benefícios, Pesquisas, Weekly, Semanal e o Cientista do painel |
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

O fundo do login usa uma foto pública de pessoas colaborando (Unsplash), carregada no navegador e tratada em
duotone com as cores da marca. Para usar outra foto — por exemplo, do próprio time, salva em `public/` — defina
`NEXT_PUBLIC_LOGIN_PHOTO_URL`. Se a foto não carregar, fica o fundo da marca.

## Segurança

- Senhas com PBKDF2-SHA512 (100 mil iterações) e comparação em tempo constante.
- Login limitado a 8 tentativas por IP e usuário a cada 15 minutos.
- Cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Cabeçalhos de segurança em todas as respostas (CSP `frame-ancestors`, `X-Frame-Options`, `nosniff`, HSTS…).
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

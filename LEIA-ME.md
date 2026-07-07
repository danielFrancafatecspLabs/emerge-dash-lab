# Dashboard Executivo de Experimentos — Telecom

Aplicação web que consome dados do Jira (boards 2706 e 2707) e exibe um dashboard executivo do portfólio de inovação BeOn Lab / GL.

---

## O que precisa estar instalado na máquina

### Requisito único: Node.js 18 ou superior

Só isso. O `npm` já vem junto com o Node.js.

Para verificar se já está instalado:

```bash
node -v   # deve mostrar v18.x.x ou superior
npm -v    # deve mostrar qualquer versão
```

### Como instalar o Node.js (caso não tenha)

**Ubuntu / Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS (com Homebrew):**
```bash
brew install node
```

**macOS / Linux (com nvm — recomendado):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Reabra o terminal, depois:
nvm install 20
nvm use 20
```

**Windows:**
Baixe o instalador em https://nodejs.org e instale a versão LTS.

> Não é necessário instalar Docker, Python, banco de dados, ou qualquer outro software.

---

## Como rodar

### 1. Entre na pasta do projeto

```bash
cd /caminho/para/jira-viewer
```

### 2. Execute o script de setup

```bash
./setup.sh
```

O script vai:
- Verificar se o Node.js está OK
- Instalar as dependências (`npm install`) na primeira vez
- Iniciar o servidor na porta **3003**

### 3. Acesse no navegador

```
http://localhost:3003
```

---

## Estrutura de arquivos

```
jira-viewer/
├── setup.sh              ← Script para rodar o projeto
├── .env.local            ← Credenciais Jira (não commitar)
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── src/
    ├── app/
    │   ├── portfolio/
    │   │   └── page.tsx  ← Página principal do dashboard
    │   └── api/
    │       └── dashboard/
    │           └── route.ts  ← API interna que busca o Jira
    ├── lib/
    │   ├── jira.ts       ← Cliente Jira (paginação, autenticação)
    │   ├── mappers.ts    ← Join Iniciativa ↔ Epic, agregações
    │   └── types.ts      ← Tipos TypeScript
    └── components/
        ├── layout/
        │   ├── Sidebar.tsx
        │   └── Header.tsx
        └── dashboard/
            ├── MetasEstrategicas.tsx
            ├── ResumoPortfolio.tsx
            ├── PortfolioPorMercado.tsx
            ├── Top5Experimentos.tsx
            ├── SituacaoPortfolio.tsx
            ├── PipelineInovacao.tsx
            └── GovernancaAlinhamento.tsx
```

---

## Variáveis de ambiente (`.env.local`)

O arquivo `.env.local` já está configurado. Caso precise ajustar:

| Variável | Descrição |
|---|---|
| `JIRA_BASE_URL` | URL base do Jira Cloud |
| `JIRA_EMAIL` | E-mail da conta dona do token API |
| `JIRA_API_TOKEN` | Token de API gerado em id.atlassian.com |
| `JIRA_BOARD_IDEACAO_ID` | ID do board de Ideação (2706) |
| `JIRA_BOARD_INICIATIVAS_ID` | ID do board de Iniciativas (2707) |

> As credenciais ficam **apenas no servidor** — o token nunca é exposto ao navegador.

---

## Fontes de dados Jira

| Board | Nome | Tipo de issue | O que traz |
|---|---|---|---|
| **2706** | P&D - Ideação | Iniciativa | Posição no pipeline (coluna/status) |
| **2707** | P&D - Experimentação/Piloto | Epic | Domínio, Sponsor, Benefícios, Custo |

Cada **Epic** do board 2707 aponta para sua **Iniciativa-mãe** no board 2706 via `parent.key`. O dashboard faz esse join automaticamente.

---

## Solução de problemas

**`./setup.sh: Permission denied`**
```bash
chmod +x setup.sh
./setup.sh
```

**`node: command not found`**
Instale o Node.js conforme as instruções acima.

**Tela mostra "Erro ao carregar dados"**
- Verifique se o `.env.local` existe e tem as credenciais corretas
- Confirme que o token Jira não expirou (gere um novo em https://id.atlassian.com/manage-profile/security/api-tokens)
- Verifique se há acesso à internet (a API do Jira é remota)

**Porta 3003 já em uso**
```bash
# Para encontrar o processo usando a porta:
lsof -i :3003
# Para matar:
kill -9 <PID>
```
Ou altere a porta no `package.json`:
```json
"dev": "next dev -p 3004"
```

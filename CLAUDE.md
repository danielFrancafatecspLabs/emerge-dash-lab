# CLAUDE.md — jira-viewer

Instruções e contexto de domínio para todas as sessões neste projeto.

---

## Projeto

**Dashboard Executivo de Experimentos** para o time BeOn Lab / P&D da Claro Brasil.
Stack: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui + Recharts.
Projeto Jira: `GL` — **BeOn Lab - Governança Labs** (`project ID: 10371`).

---

## Modelo de Domínio — Iniciativas × Experimentos

> Esta distinção é FUNDAMENTAL. Nunca confundir os dois conceitos.

### INICIATIVA (Board ID: 2706)

- **Jira board**: `2706` — "P&D - Ideação"
- **Issue type**: `Iniciativa`
- **Total atual**: ~186 issues
- **O que é**: Uma iniciativa é uma **ideia estratégica de alto nível**. Representa a intenção de resolver um problema ou capturar uma oportunidade. Uma Iniciativa existe antes de qualquer execução.
- **Pipeline da Iniciativa** (colunas/status do board 2706):

  | Status ID | Coluna no board | Label no dashboard |
  |-----------|-----------------|-------------------|
  | `10004`   | BACKLOG | Backlog |
  | `10139`   | EM REFINAMENTO | Em Andamento |
  | `10067`   | PRONTO PARA EXECUÇÃO | Pré Piloto |
  | `13045`   | Aguardando Piloto | Pré Piloto |
  | `12848`   | EM EXPERIMENTAÇÃO | Piloto |
  | `12847`   | EM PILOTO | Piloto |
  | `10003`   | FINALIZADO | Concluído |
  | `10015`   | CANCELADO | Cancelado |

- **Campos retornados**: `summary, status, issuetype, created, updated`
- **Papel no dashboard**: define a **posição no pipeline de inovação** e as contagens do funil.

---

### EXPERIMENTO / CICLO (Board ID: 2707)

- **Jira board**: `2707` — "P&D - Experimentação/Piloto"
- **Issue type**: `Epic`
- **Total atual**: ~199 issues
- **O que é**: Um Experimento é a **instância concreta** de uma Iniciativa em execução. Uma Iniciativa pode gerar **zero, um ou vários Experimentos**. Quando há múltiplos, cada um é chamado de **Ciclo** (ex.: "Evolução da Clarinha — Ciclo 2"). Os Experimentos carregam todos os dados ricos de negócio.
- **Pipeline do Experimento** (colunas/status do board 2707):

  | Status ID | Coluna no board |
  |-----------|-----------------|
  | `10004`   | BACKLOG |
  | `10139`   | Em refinamento |
  | `10067`   | PRONTO PARA EXECUÇÃO |
  | `3`       | Em andamento |
  | `10204`   | EM VALIDAÇÃO |
  | `10003`   | Concluído |
  | `10015`   | CANCELADO |

- **Campos retornados**:
  ```
  summary, status, issuetype, parent,
  customfield_11662,  // Sponsor
  customfield_11663,  // BO (Business Owner)
  customfield_11664,  // Complexidade
  customfield_16911,  // Time Responsável (Lab — option → .value)
  customfield_13242,  // Benefício Quantitativo (R$, number)
  customfield_13243,  // Benefício Qualitativo (string)
  customfield_16400,  // Domínio (option → .value)
  customfield_13571,  // Custo Estimado Experimento (R$, number)
  customfield_11668,  // Custo Realizado Experimento (string)
  customfield_11378,  // Segmento (option → .value)
  customfield_15919,  // Portfólio (option → .value)
  customfield_10904   // Diretoria (string)
  ```
- **Papel no dashboard**: fonte de todos os **dados financeiros e de negócio** (benefícios, custos, sponsors, domínios, segmentos).

---

### Relacionamento Iniciativa ↔ Experimento

```
Iniciativa (board 2706, type: Iniciativa)
    ├── Experimento/Ciclo 1  (board 2707, type: Epic, parent.key = Iniciativa.key)
    ├── Experimento/Ciclo 2  (board 2707, type: Epic, parent.key = Iniciativa.key)
    └── Experimento/Ciclo N  ...

Exemplos reais:
  GL-400 "Evolução da Clarinha"  →  GL-510 "Evolução da Clarinha — Ciclo 2"
  GL-366 "Livia"                 →  GL-275 "Livia" (Epic)
  GL-470 "Assistente IA Ágil"    →  GL-254 (Epic)
```

**Join**: `Epic.fields.parent.key === Iniciativa.key`

**Regra de agregação**: os dados dos Epics são agregados para cima na Iniciativa-mãe
(ex.: `SUM(beneficioQuantitativo)`, `UNION(domínios)`, `UNION(sponsors)`).

---

## Variáveis de Ambiente

```
JIRA_BASE_URL=https://clarobr-jsw-tecnologia.atlassian.net
JIRA_EMAIL=...
JIRA_API_TOKEN=...
JIRA_PROJECT_KEY=GL
JIRA_BOARD_IDEACAO_ID=2706      # board das Iniciativas ("P&D - Ideação")
JIRA_BOARD_INICIATIVAS_ID=2707  # board dos Experimentos/Ciclos ("P&D - Experimentação/Piloto")
```

> Nota: Os nomes das variáveis no `.env` estão trocados em relação ao modelo de domínio acima.
> Use sempre os **IDs** como referência: **2706 = Iniciativas**, **2707 = Experimentos**.

---

## Endpoints Principais

```
GET /rest/agile/1.0/board/2706/issue?fields=...   → Iniciativas
GET /rest/agile/1.0/board/2707/issue?fields=...   → Experimentos (Epics)
GET /rest/agile/1.0/board/2706/configuration      → Colunas e status IDs
GET /rest/agile/1.0/board/2707/configuration      → Colunas e status IDs
```

Paginação: `maxResults=50`, iterar com `startAt` até `startAt >= total`.
Cache recomendado: `revalidate: 300` (5 min) para respeitar rate limit.

---

## Campos Customizados — Referência Rápida

| Campo de negócio | customfield | Tipo |
|---|---|---|
| Sponsor | `customfield_11662` | string |
| Business Owner | `customfield_11663` | string |
| Complexidade | `customfield_11664` | string (`"Baixa"`, `"Alta"`) |
| Time Responsável (Lab) | `customfield_16911` | option → `.value` |
| Benefício Quantitativo | `customfield_13242` | number (R$) |
| Benefício Qualitativo | `customfield_13243` | string |
| Domínio | `customfield_16400` | option → `.value` |
| Custo Estimado | `customfield_13571` | number (R$) |
| Custo Realizado | `customfield_11668` | string |
| Segmento | `customfield_11378` | option → `.value` |
| Portfólio | `customfield_15919` | option → `.value` |
| Diretoria | `customfield_10904` | string |

> `customfield_10900` (Domínio legado, string) — **ignorar**, usar `customfield_16400`.

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **Iniciativa** | Ideia/proposta estratégica de alto nível. Issue type `Iniciativa` no board 2706. |
| **Experimento** | Execução concreta de uma Iniciativa. Issue type `Epic` no board 2707. |
| **Ciclo** | Quando uma Iniciativa gera múltiplos Experimentos, cada rodada é um Ciclo (ex.: "Ciclo 2"). |
| **Piloto** | Fase do pipeline onde o Experimento está sendo validado em campo. |
| **Board de Ideação (2706)** | Onde as Iniciativas vivem e avançam no pipeline. |
| **Board de Experimentação/Piloto (2707)** | Onde os Experimentos/Ciclos vivem, com dados ricos de negócio. |

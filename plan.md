# Plano de Implementação — Dashboard Executivo de Experimentos

> Todos os endpoints, IDs, campos e hierarquias abaixo foram **testados e confirmados via API** antes da implementação.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Estilização | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Fetch/Cache | React Server Components + `fetch` nativo com `revalidate` |
| Env vars | `.env.local` (arquivo `.env` deste projeto) |

---

## Hierarquia de Issues Confirmada

```
Iniciativa  (board 2734 — "P&D - Ideação")
  └── Epic  (board 2735 — "P&D - Experimentação/Piloto")
                  └── (Stories/Tasks — não usadas no dashboard)
```

- **Board 2734** contém apenas issues do tipo **`Iniciativa`** (186 total)
  → define a **posição no pipeline** (coluna/status)

- **Board 2735** contém apenas issues do tipo **`Epic`** (199 total)
  → cada Epic tem `fields.parent.key` apontando para a Iniciativa-mãe do board 2706
  → carrega os **dados ricos**: Domínio, Sponsor, Benefícios, Custo, etc.

- **Join**: `Epic.fields.parent.key === Iniciativa.key`
  Uma Iniciativa pode ter **múltiplos Epics**. Os dados dos Epics são agregados para cima (soma de benefícios, union de domínios, union de sponsors).

---

## Fontes de Dados

### Board 2734 — "P&D - Ideação" (Iniciativas)
- **Endpoint**: `GET /rest/agile/1.0/board/2734/issue`
- **Total**: 186 issues
- **Paginação**: `maxResults=50` → 4 páginas

#### Colunas e Status IDs confirmados

| Coluna do Board | Status ID | Label no Dashboard |
|---|---|---|
| BACKLOG | `10004` | BACKLOG |
| EM REFINAMENTO | `10139` | EM ANDAMENTO |
| PRONTO PARA EXECUÇÃO | `10067` | PRÉ PILOTO |
| EM EXPERIMENTAÇÃO | `12848` | PILOTO |
| Aguardando Piloto | `13045` | PRÉ PILOTO |
| EM PILOTO | `12847` | PILOTO |
| FINALIZADO | `10003` | CONCLUÍDO |
| CANCELADO | `10015` | CANCELADO |

### Board 2735 — "P&D - Experimentação/Piloto" (Epics)
- **Endpoint**: `GET /rest/agile/1.0/board/2735/issue`
- **Total**: 199 issues
- **Paginação**: `maxResults=50` → 4 páginas

#### Colunas e Status IDs confirmados

| Coluna do Board | Status ID |
|---|---|
| BACKLOG | `10004` |
| Em refinamento | `10139` |
| PRONTO PARA EXECUÇÃO | `10067` |
| Em andamento | `3` |
| EM VALIDAÇÃO | `10204` |
| Concluído | `10003` |
| CANCELADO | `10015` |

---

## Campos a Buscar

### Em toda chamada ao board 2734 (Iniciativas)
```
summary, status, issuetype, created, updated
```

### Em toda chamada ao board 2735 (Epics)
```
summary, status, issuetype, parent,
customfield_30394,  // Sponsor (was customfield_11662)
customfield_30340,  // BO (Business Owner) (was customfield_11663)
customfield_30358,  // Complexidade (was customfield_11664)
customfield_11665,  // Time Responsável (mantido — campo do próprio épico)
customfield_13242,  // Benefício Quantitativo (number, R$)
customfield_13243,  // Benefício Qualitativo (string)
customfield_11987,  // Domínio (option → .value) (was customfield_16400)
customfield_30402,  // Custo Estimado Experimento (number, R$) (was customfield_13571)
customfield_30453,  // Custo Realizado Experimento (string) (was customfield_11668)
customfield_30445,  // Segmento (option → .value) (was customfield_11378)
customfield_30110,  // Portfólio (option → .value) (was customfield_15919)
customfield_21499   // Diretoria (string) (was customfield_10904)
```

> O campo `parent` retorna `{ key, fields: { summary, issuetype: { name } } }` e é a chave do join.

---

## Campos Customizados — Confirmados com Exemplos Reais

| Campo no Dashboard | customfield ID | Tipo | Exemplo real |
|---|---|---|---|
| Sponsor | `customfield_30394` | string | `"Celso Tonet"`, `"Gustavo Leite"` (was `customfield_11662`) |
| BO (Business Owner) | `customfield_30340` | string | `"Renato Fagundes"` (was `customfield_11663`) |
| Complexidade | `customfield_30358` | string | `"Baixa"`, `"Alta"` (was `customfield_11664`) |
| Time Responsável | `customfield_11665` | string | `"BCC"`, `"P&D Tech"`, `"BeOn Labs"` (mantido) |
| Benefício Quantitativo | `customfield_13242` | number | `9600000.0`, `603000.0` |
| Benefício Qualitativo | `customfield_13243` | string | `"Redução de custo de análise"` |
| Domínio | `customfield_11987` | option (`.value`) | `"Atendimento"`, `"Rede"` (was `customfield_16400`) |
| Custo Estimado | `customfield_30402` | number | em R$ (was `customfield_13571`) |
| Custo Realizado | `customfield_30453` | string | em R$ (was `customfield_11668`) |
| Segmento | `customfield_30445` | option (`.value`) | (was `customfield_11378`) |
| Portfólio | `customfield_30110` | option (`.value`) | (was `customfield_15919`) |
| Diretoria | `customfield_21499` | string | (was `customfield_10904`) |

> `customfield_10900` (Dominio, string) é campo legado — ignorar, usar `customfield_11987`.

---

## Mapeamento: Quadros do Dashboard → Fontes de Dados

### 1. Header
> Barra superior vermelha com título e filtros

| Elemento | Fonte |
|---|---|
| Título "DASHBOARD EXECUTIVO DE EXPERIMENTOS — TELECOM" | Estático / `NEXT_PUBLIC_APP_TITLE` |
| Filtro "Semestre Atual" | Estado local — filtra por `created`/`updated` das issues |
| Filtro "Visão Geral do Portfólio" | Estado local — alterna entre visão geral e por mercado |

---

### 2. Sidebar
> Navegação lateral (Estratégia, Portfólio, Monitoramento, Governança)

| Elemento | Fonte |
|---|---|
| Links de navegação | Estático / rotas Next.js |

---

### 3. CONTRIBUIÇÃO PARA AS METAS ESTRATÉGICAS
> Cards EBITDA / RECEITA / NPS com "Experimentos alinhados" e "Valor potencial"

| Elemento | Board | Campo | Lógica |
|---|---|---|---|
| EBITDA — qtd alinhados | 2707 (Epics) | `customfield_15919` (Portfólio) ou campo de OKR | Filtrar Epics onde Portfólio/alinhamento = "EBITDA" |
| RECEITA — qtd alinhados | 2707 (Epics) | idem | Filtrar por "Receita" |
| NPS — qtd alinhados | 2707 (Epics) | idem | Filtrar por "NPS" |
| Valor potencial por meta | 2707 (Epics) | `customfield_13242` | Soma de Benefício Quantitativo dos Epics alinhados |

> **Atenção**: confirmar campo exato de alinhamento estratégico (EBITDA/Receita/NPS). Candidatos: `customfield_15919` (Portfólio) ou `customfield_11477` (Objetivos, array). Investigar nas primeiras issues com valor preenchido.

---

### 4. RESUMO DO PORTFÓLIO
> 4 números grandes: total ativos, benefício total, benefício médio, em escala

| Elemento | Board | Campo | Lógica |
|---|---|---|---|
| 130 Experimentos ativos | 2707 (Epics) | `status` | `COUNT(Epics)` excluindo CANCELADO e FINALIZADO |
| R$ 236M Benefício potencial total | 2707 (Epics) | `customfield_13242` | `SUM(beneficioQuantitativo)` de Epics ativos |
| R$ 2M Benefício potencial médio | 2707 (Epics) | `customfield_13242` | `AVG(beneficioQuantitativo)` de Epics ativos |
| 9 Em escala/industrialização | 2706 (Iniciativas) | `status` | `COUNT(Iniciativas)` com status = FINALIZADO ativo em escala |

---

### 5. PORTFÓLIO POR MERCADO
> Cards CONSUMO / EMPRESARIAL / GOVERNO+PME com experimentos, valor e domínios

| Elemento | Board | Campo | Lógica |
|---|---|---|---|
| Segmento (CONSUMO / EMPRESARIAL / GOVERNO/PME) | 2707 (Epics) | `customfield_11378` (Segmento `.value`) | Agrupar Epics por segmento |
| Qtd experimentos por segmento | 2707 (Epics) | `customfield_11378` | `COUNT` por segmento |
| Valor potencial por segmento | 2707 (Epics) | `customfield_13242` | `SUM(beneficioQuantitativo)` por segmento |
| Principais Domínios (top 3 com %) | 2707 (Epics) | `customfield_16400` (Domínio `.value`) | Top 3 Domínios por contagem dentro do segmento |
| Donut chart de domínios | 2707 (Epics) | `customfield_16400` | Distribuição percentual de Domínios por segmento |

---

### 6. TOP 5 EXPERIMENTOS POR VALOR POTENCIAL
> Tabela com: Experimento, Lab Responsável, Domínio, Mercado, Valor Potencial

| Coluna da tabela | Board | Campo | Lógica |
|---|---|---|---|
| Experimento (nome) | 2707 (Epics) | `fields.summary` | Nome do Epic |
| Lab Responsável | 2707 (Epics) | `customfield_11665` (Time Responsável) | Valor direto |
| Domínio | 2707 (Epics) | `customfield_16400` `.value` | Valor direto |
| Mercado | 2707 (Epics) | `customfield_11378` (Segmento `.value`) | Valor direto |
| Valor Potencial | 2707 (Epics) | `customfield_13242` | `ORDER BY beneficioQuantitativo DESC LIMIT 5` |

---

### 7. SITUAÇÃO DO PORTFÓLIO
> Donut chart com 130 no centro + legenda com contagem por status

| Elemento | Board | Campo | Lógica |
|---|---|---|---|
| Total no centro (130) | 2706 (Iniciativas) | `status` | `COUNT` de Iniciativas ativas |
| Fatias do donut | 2706 (Iniciativas) | `status.id` | Agrupar por status ID usando tabela de mapeamento abaixo |
| Legenda com contagens | 2706 (Iniciativas) | `status.id` | COUNT por grupo |

**Mapeamento Status ID → Label do Donut:**

| Status ID | Label |
|---|---|
| `10004` | Backlog |
| `10139` | Em Andamento |
| `10067` | Pré Piloto |
| `13045` | Pré Piloto |
| `12848` | Piloto |
| `12847` | Piloto |
| `10003` | Concluído |
| `10015` | Cancelado |

---

### 8. PIPELINE DE INOVAÇÃO
> Fundo vermelho escuro. 8 colunas com contagens + métricas de funil abaixo

#### 8a. Contagens por coluna do pipeline

| Coluna | Board | Status ID | Lógica |
|---|---|---|---|
| BACKLOG | 2706 (Iniciativas) | `10004` | COUNT |
| EM ANDAMENTO | 2706 (Iniciativas) | `10139` | COUNT |
| PRÉ PILOTO | 2706 (Iniciativas) | `10067` + `13045` | COUNT combinado |
| PILOTO | 2706 (Iniciativas) | `12848` + `12847` | COUNT combinado |
| ADOÇÃO | 2706 (Iniciativas) | — | Verificar status adicional |
| CONCLUÍDO | 2706 (Iniciativas) | `10003` | COUNT |
| ENCERRADO | 2706 (Iniciativas) | — | Verificar status adicional |
| CANCELADO | 2706 (Iniciativas) | `10015` | COUNT |

#### 8b. Desempenho do Funil (métricas calculadas)

| Métrica | Fonte | Lógica |
|---|---|---|
| Taxa de conversão total (6%) | 2706 | `COUNT(CONCLUÍDO) / COUNT(total) * 100` |
| Lead time médio total (120 dias) | 2706 | `AVG(updated - created)` por Iniciativa |
| Lead time Discovery→MVP (45 dias) | 2706 | `AVG` para issues que passaram de BACKLOG → PRÉ PILOTO |
| Lead time MVP→Piloto (60 dias) | 2706 | `AVG` para issues que passaram de PRÉ PILOTO → PILOTO |
| Taxa de escala (5%) | 2706 | `COUNT(em escala) / COUNT(total)` |

#### 8c. Valor

| Métrica | Board | Campo | Lógica |
|---|---|---|---|
| R$ 236M Benefício potencial total | 2707 (Epics) | `customfield_13242` | SUM de todos os Epics ativos |
| R$ 2M Benefício potencial médio | 2707 (Epics) | `customfield_13242` | AVG |
| R$ 42K Realizado (semestre) | 2707 (Epics) | `customfield_11668` (Custo Realizado) | SUM do semestre atual |

#### 8d. Eficiência

| Métrica | Board | Campo | Lógica |
|---|---|---|---|
| Custo por experimento (R$ 377K) | 2707 (Epics) | `customfield_13571` (Custo Estimado) | AVG |
| ROI médio (0.1x) | 2707 (Epics) | `customfield_13242` / `customfield_13571` | `AVG(beneficio / custo)` |
| Reutilização (34%) | 2707 (Epics) | — | Verificar campo específico |

---

### 9. GOVERNANÇA E ALINHAMENTO

#### 9a. Sponsors Ativos (TOP 5)

| Elemento | Board | Campo | Lógica |
|---|---|---|---|
| Nome do Sponsor | 2707 (Epics) | `customfield_11662` | Agrupar por valor |
| Qtd experimentos | 2707 (Epics) | `customfield_11662` | COUNT por Sponsor |
| Top 5 | 2707 (Epics) | `customfield_11662` | `ORDER BY count DESC LIMIT 5` |

#### 9b. Alinhamento Estratégico

| Elemento | Board | Campo | Lógica |
|---|---|---|---|
| Alinhados à meta EBITDA (39 / 30%) | 2707 (Epics) | campo de alinhamento | COUNT + % do total |
| Alinhados à meta Receita (36 / 28%) | 2707 (Epics) | campo de alinhamento | COUNT + % do total |
| Alinhados à meta NPS (25 / 19%) | 2707 (Epics) | campo de alinhamento | COUNT + % do total |

#### 9c. Principais Bloqueios
> Lista estática ou derivada de campos — verificar se existe campo de impedimento/bloqueio nas issues
> Candidato: `customfield_11091` (Impedimento, array) ou texto manual

#### 9d. Decisões Pendentes
> Provável campo texto ou lista nas Iniciativas — verificar `customfield_10873` (Pontos de Atenção/Riscos) ou similar

---

## Estratégia de Join Iniciativa ↔ Epic

```
Board 2706           Board 2707
(Iniciativas)        (Epics)
─────────────        ──────────────────────────────────────
GL-400               GL-510 → parent.key = GL-400 (Evolução da Clarinha)
GL-366               GL-275 → parent.key = GL-366 (Livia)
GL-470               GL-254 → parent.key = GL-470 (Assistente IA Ágil)
```

```ts
// lib/mappers.ts
export function buildIniciativas(
  iniciativas: JiraIssue[],   // board 2706
  epics: JiraIssue[]          // board 2707
): Iniciativa[] {
  // Agrupa Epics por Iniciativa-mãe
  const epicsByIniciativa = new Map<string, JiraIssue[]>();
  for (const epic of epics) {
    const parentKey = epic.fields.parent?.key;
    if (!parentKey) continue;
    if (!epicsByIniciativa.has(parentKey)) epicsByIniciativa.set(parentKey, []);
    epicsByIniciativa.get(parentKey)!.push(epic);
  }

  return iniciativas.map(ini => {
    const myEpics = epicsByIniciativa.get(ini.key) ?? [];
    return {
      key: ini.key,
      nome: ini.fields.summary,
      status: ini.fields.status,
      epics: myEpics.map(mapEpicToDetail),
      // Agregações diretas:
      beneficioQuantitativoTotal: myEpics.reduce(
        (sum, e) => sum + (e.fields.customfield_13242 ?? 0), 0
      ),
      dominios: [...new Set(myEpics
        .map(e => e.fields.customfield_16400?.value)
        .filter(Boolean)
      )],
      sponsors: [...new Set(myEpics
        .map(e => e.fields.customfield_11662)
        .filter(Boolean)
      )],
    };
  });
}
```

---

## Implementação do Cliente Jira

### Autenticação (Basic Auth — server-side apenas)

```ts
// lib/jira.ts
const credentials = Buffer.from(
  `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
).toString('base64');

const BASE_HEADERS = {
  Authorization: `Basic ${credentials}`,
  Accept: 'application/json',
};
```

### Paginação completa

```ts
async function getAllBoardIssues(
  boardId: number,
  fields: string
): Promise<JiraIssue[]> {
  const all: JiraIssue[] = [];
  const maxResults = 50;
  let startAt = 0;
  let total = Infinity;

  while (startAt < total) {
    const url =
      `${process.env.JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/issue` +
      `?maxResults=${maxResults}&startAt=${startAt}&fields=${fields}`;

    const res = await fetch(url, {
      headers: BASE_HEADERS,
      next: { revalidate: 300 }, // cache 5 min — evita rate limit
    });

    const data = await res.json();
    total = data.total;
    all.push(...data.issues);
    startAt += data.issues.length;
  }

  return all;
}
```

### Busca paralela dos dois boards

```ts
// app/api/dashboard/route.ts
const FIELDS_INICIATIVA = 'summary,status,issuetype,created,updated';

const FIELDS_EPIC = [
  'summary', 'status', 'issuetype', 'parent',
  'customfield_11662', 'customfield_11663', 'customfield_11664',
  'customfield_11665', 'customfield_13242', 'customfield_13243',
  'customfield_16400', 'customfield_13571', 'customfield_11668',
  'customfield_11378', 'customfield_15919', 'customfield_10904',
].join(',');

const [iniciativas, epics] = await Promise.all([
  getAllBoardIssues(2706, FIELDS_INICIATIVA),
  getAllBoardIssues(2707, FIELDS_EPIC),
]);

const data = buildIniciativas(iniciativas, epics);
```

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # redirect → /portfolio
│   ├── api/
│   │   └── dashboard/
│   │       └── route.ts              # GET — busca + join + agregações
│   └── portfolio/
│       └── page.tsx                  # Server Component — consome /api/dashboard
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── dashboard/
│       ├── MetasEstrategicas.tsx     # [Q3] EBITDA / Receita / NPS
│       ├── ResumoPortfolio.tsx       # [Q4] 4 KPIs grandes
│       ├── PortfolioPorMercado.tsx   # [Q5] Consumo / Empresarial / Governo
│       ├── Top5Experimentos.tsx      # [Q6] Tabela top 5 por benefício
│       ├── SituacaoPortfolio.tsx     # [Q7] Donut chart por status
│       ├── PipelineInovacao.tsx      # [Q8] Pipeline 8 colunas + funil
│       └── GovernancaAlinhamento.tsx # [Q9] Sponsors + alinhamento + bloqueios
├── lib/
│   ├── jira.ts       # getAllBoardIssues(), headers, constantes de campos
│   ├── mappers.ts    # buildIniciativas(), agregações, mapeamento status
│   └── types.ts      # Iniciativa, EpicDetail, JiraIssue, DashboardData
└── hooks/
    └── useFilters.ts  # Semestre Atual, Visão Geral
```

---

## Fases de Implementação

### Fase 1 — Setup
1. `npx create-next-app@latest . --typescript --tailwind --app --src-dir`
2. `npm install recharts lucide-react`
3. `npx shadcn@latest init`
4. Copiar `.env` → `.env.local`

### Fase 2 — Camada de dados
1. `lib/types.ts` — interfaces `JiraIssue`, `Iniciativa`, `EpicDetail`, `DashboardData`
2. `lib/jira.ts` — `getAllBoardIssues()` com paginação
3. `lib/mappers.ts`:
   - `buildIniciativas()` — join Iniciativa ↔ Epic por `parent.key`
   - `aggregateByPipelineColumn()` — contagens por coluna
   - `aggregateBySegmento()` — agrupar por `customfield_11378`
   - `getTop5ByBeneficio()` — top 5 Epics por `customfield_13242`
   - `getTopSponsors()` — top 5 sponsors por `customfield_11662`
   - `sumBeneficioQuantitativo()` — total e média

### Fase 3 — API Route
- `app/api/dashboard/route.ts`:
  - `Promise.all` nos dois boards
  - Retorna JSON com `DashboardData` completo

### Fase 4 — UI (ordem de prioridade)
1. `Sidebar` + `Header` (cor base `#CC0000`)
2. `ResumoPortfolio` [Q4]
3. `MetasEstrategicas` [Q3]
4. `PortfolioPorMercado` [Q5]
5. `Top5Experimentos` [Q6]
6. `SituacaoPortfolio` [Q7] — Recharts `PieChart`
7. `PipelineInovacao` [Q8]
8. `GovernancaAlinhamento` [Q9]

### Fase 5 — Filtros e polish
- Filtro de semestre por `created`/`updated` das issues
- Loading skeletons por seção
- Fallback UI em caso de erro da API
- `revalidate: 300` — cache 5 min para respeitar rate limit Jira

---

## Itens a Confirmar Durante Implementação

| Item | O que verificar |
|---|---|
| Alinhamento estratégico (EBITDA/Receita/NPS) | Checar `customfield_15919` (Portfólio) ou `customfield_11477` (Objetivos) em Epics com dados preenchidos |
| Coluna "ADOÇÃO" e "ENCERRADO" no pipeline | Confirmar status IDs — não apareceram no board 2706 (pode ser status do board 2707) |
| Bloqueios e Decisões Pendentes | Investigar `customfield_11091` (Impedimento) e `customfield_10873` (Pontos de Atenção) |
| Reutilização (34%) | Verificar campo específico ou se é calculado |

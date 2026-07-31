# Deterministic Report Image and `.env` Purge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `gpt-image-2` report generator with a deterministic 1024×1536 PNG renderer and purge `.env` from every known local and remote Git ref without losing the local environment file.

**Architecture:** Keep `GET /jira/api/report/image` and its base64 PNG response stable. Build a pure SVG from the existing metrics, rasterize it server-side with `@resvg/resvg-js`, and keep the current client preview/download flow. Commit an ignore rule and removal from the index, then use `git-filter-repo` in a disposable mirror to rewrite `main` and the local `ops/jira-viewer-auto-deploy` branch before publishing only `main` with a force-with-lease.

**Tech Stack:** Next.js 14 App Router, TypeScript, Vitest 3, resvg-js 2.6, Git 2.43, git-filter-repo.

## Global Constraints

- Preserve the image button, loading state, error state, preview, download, `report-beon-YYYY-MM-DD.png` filename, JSON response shape, and PNG dimensions `1024x1536`.
- Preserve the current metric semantics; do not fix unrelated business rules during this change.
- Remove active uses of `gpt-image-2`, `AZURE_OPENAI_DEPLOYMENT_IMAGE`, and `client.images.generate` while retaining OpenAI text integrations.
- Never print or copy environment values into code, tests, documentation, commit messages, or tool output.
- Keep the local `.env`, remove only its image deployment setting, and set environment-file permissions to `0600`.
- Do not publish `ops/jira-viewer-auto-deploy`.
- Every commit created during this work must use exactly `updates` as its message.
- Stop before force-push if the remote refs differ from the inventory captured immediately before rewriting.

---

## File Structure

- Create `vitest.config.ts`: Node test environment and `@` alias.
- Create `src/lib/report-image.ts`: metric contract, São Paulo date formatter, XML escaping, and deterministic SVG builder.
- Create `src/lib/report-image.test.ts`: unit tests for dimensions, content, scaling, and escaping.
- Create `src/lib/report-image-renderer.ts`: server-side SVG-to-PNG conversion and dimension validation.
- Create `src/lib/report-image-renderer.test.ts`: PNG signature and metadata tests.
- Create `src/app/api/report/image/route.test.ts`: endpoint contract and non-disclosure tests with Jira/classifier mocks.
- Create `src/components/report/GenerateImageButton.test.tsx`: visible-copy regression test.
- Modify `src/app/api/report/image/route.ts`: remove Images API use and call the deterministic renderer.
- Modify `src/components/report/GenerateImageButton.tsx`: remove AI attribution while retaining behavior.
- Modify `package.json` and `package-lock.json`: add Vitest, resvg-js, and the test script.
- Modify `.gitignore`: ignore root environment files while allowing `/.env.example`.
- Remove `.env` from the Git index but preserve and tighten the local file.

---

### Task 1: Test Harness and Pure SVG Builder

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/report-image.ts`
- Test: `src/lib/report-image.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `ReportImageMetrics`, `ReportImageDomain`, `REPORT_IMAGE_WIDTH`, `REPORT_IMAGE_HEIGHT`, `formatReportImageDate(date: Date): string`, and `buildReportInfographicSvg(metrics: ReportImageMetrics): string`.
- Consumes: no application services; this unit must remain deterministic and side-effect free.

- [ ] **Step 1: Install pinned runtime and test dependencies**

Run:

```bash
npm install @resvg/resvg-js@2.6.2
npm install --save-dev vitest@3.2.7
```

Add this script to `package.json`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    clearMocks: true,
    restoreMocks: true,
  },
})
```

- [ ] **Step 3: Write the failing SVG tests**

Create `src/lib/report-image.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  REPORT_IMAGE_HEIGHT,
  REPORT_IMAGE_WIDTH,
  buildReportInfographicSvg,
  formatReportImageDate,
  type ReportImageMetrics,
} from './report-image'

const metrics: ReportImageMetrics = {
  generatedOn: '31/07/2026',
  totalIniciativas: 186,
  totalExperimentos: 199,
  emAndamento: 42,
  emPiloto: 18,
  concluidos: 27,
  beneficio: 2_500_000,
  topDominios: [
    { name: '<Rede & IA>', count: 31 },
    { name: 'Atendimento', count: 22 },
  ],
}

describe('buildReportInfographicSvg', () => {
  it('builds the complete 1024x1536 report with current metrics', () => {
    const svg = buildReportInfographicSvg(metrics)

    expect(REPORT_IMAGE_WIDTH).toBe(1024)
    expect(REPORT_IMAGE_HEIGHT).toBe(1536)
    expect(svg).toContain('width="1024"')
    expect(svg).toContain('height="1536"')
    expect(svg).toContain('Atualização Semanal do Portfólio de Inovação')
    expect(svg).toContain('31/07/2026')
    expect(svg).toContain('186 iniciativas')
    expect(svg).toContain('199 experimentos')
    expect(svg).toContain('R$ 2,5 MM')
    expect(svg).toContain('Em andamento')
    expect(svg).toContain('Concluídos')
  })

  it('escapes domain labels before inserting them into SVG', () => {
    const svg = buildReportInfographicSvg(metrics)

    expect(svg).toContain('&lt;Rede &amp; IA&gt;')
    expect(svg).not.toContain('<Rede & IA>')
  })
})

describe('formatReportImageDate', () => {
  it('formats the instant in the America/Sao_Paulo timezone', () => {
    expect(formatReportImageDate(new Date('2026-08-01T01:30:00.000Z'))).toBe('31/07/2026')
  })
})
```

- [ ] **Step 4: Run the unit test and verify the RED state**

Run:

```bash
npm test -- src/lib/report-image.test.ts
```

Expected: FAIL because `src/lib/report-image.ts` does not exist.

- [ ] **Step 5: Implement the pure SVG builder**

Create `src/lib/report-image.ts` with these exact public contracts and layout rules:

```ts
export const REPORT_IMAGE_WIDTH = 1024
export const REPORT_IMAGE_HEIGHT = 1536

export interface ReportImageDomain {
  name: string
  count: number
}

export interface ReportImageMetrics {
  generatedOn: string
  totalIniciativas: number
  totalExperimentos: number
  emAndamento: number
  emPiloto: number
  concluidos: number
  beneficio: number
  topDominios: ReportImageDomain[]
}

const escapeXml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const formatMillions = (value: number): string =>
  `R$ ${(value / 1_000_000).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MM`

const scaledBarWidth = (value: number, maximum: number, width: number): number => {
  if (value <= 0 || maximum <= 0) return 0
  return Math.max(12, Math.round((value / maximum) * width))
}

export function formatReportImageDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function buildReportInfographicSvg(metrics: ReportImageMetrics): string {
  const funnel = [
    { label: 'Em andamento', value: metrics.emAndamento, color: '#B91C1C' },
    { label: 'Em Piloto', value: metrics.emPiloto, color: '#DC2626' },
    { label: 'Concluídos', value: metrics.concluidos, color: '#F87171' },
  ]
  const funnelMaximum = Math.max(1, ...funnel.map(stage => stage.value))
  const domainMaximum = Math.max(1, ...metrics.topDominios.map(domain => domain.count))
  const funnelRows = funnel.map((stage, index) => {
    const y = 748 + index * 82
    const width = scaledBarWidth(stage.value, funnelMaximum, 610)
    return `<text x="126" y="${y}" class="label">${stage.label}</text>
      <rect x="300" y="${y - 25}" width="610" height="32" rx="16" fill="#F3F4F6"/>
      <rect x="300" y="${y - 25}" width="${width}" height="32" rx="16" fill="${stage.color}"/>
      <text x="930" y="${y}" text-anchor="end" class="value-small">${stage.value}</text>`
  }).join('')
  const domainRows = metrics.topDominios.slice(0, 5).map((domain, index) => {
    const y = 1135 + index * 58
    const width = scaledBarWidth(domain.count, domainMaximum, 520)
    return `<text x="126" y="${y}" class="domain">${escapeXml(domain.name)}</text>
      <rect x="340" y="${y - 20}" width="520" height="24" rx="12" fill="#F3F4F6"/>
      <rect x="340" y="${y - 20}" width="${width}" height="24" rx="12" fill="#991B1B"/>
      <text x="930" y="${y}" text-anchor="end" class="value-small">${domain.count}</text>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${REPORT_IMAGE_WIDTH}" height="${REPORT_IMAGE_HEIGHT}" viewBox="0 0 ${REPORT_IMAGE_WIDTH} ${REPORT_IMAGE_HEIGHT}">
    <style>
      text { font-family: Arial, Helvetica, sans-serif; }
      .eyebrow { font-size: 22px; font-weight: 700; letter-spacing: 3px; fill: #FECACA; }
      .title { font-size: 43px; font-weight: 700; fill: #FFFFFF; }
      .subtitle { font-size: 24px; fill: #FEE2E2; }
      .section { font-size: 22px; font-weight: 700; letter-spacing: 2px; fill: #7F1D1D; }
      .metric { font-size: 54px; font-weight: 700; fill: #111827; }
      .metric-label { font-size: 20px; fill: #6B7280; }
      .body { font-size: 27px; fill: #374151; }
      .label { font-size: 24px; fill: #374151; }
      .domain { font-size: 21px; fill: #374151; }
      .value-small { font-size: 24px; font-weight: 700; fill: #111827; }
      .footer { font-size: 20px; fill: #6B7280; }
    </style>
    <rect width="1024" height="1536" fill="#F5F5F5"/>
    <rect width="1024" height="260" fill="#8B0000"/>
    <text x="64" y="70" class="eyebrow">BEON LABS | CLARO BRASIL</text>
    <text x="64" y="132" class="title">Atualização Semanal do</text>
    <text x="64" y="184" class="title">Portfólio de Inovação</text>
    <text x="64" y="226" class="subtitle">${escapeXml(metrics.generatedOn)}</text>
    <rect x="64" y="306" width="896" height="268" rx="26" fill="#FFFFFF"/>
    <rect x="64" y="306" width="12" height="268" rx="6" fill="#B91C1C"/>
    <text x="112" y="360" class="section">DESTAQUES DA SEMANA</text>
    <text x="112" y="438" class="metric">${metrics.totalIniciativas}</text>
    <text x="112" y="474" class="metric-label">iniciativas</text>
    <text x="390" y="438" class="metric">${metrics.totalExperimentos}</text>
    <text x="390" y="474" class="metric-label">experimentos</text>
    <text x="650" y="430" class="metric" font-size="42">${escapeXml(formatMillions(metrics.beneficio))}</text>
    <text x="650" y="474" class="metric-label">potencial financeiro bruto</text>
    <text x="112" y="535" class="body">${metrics.totalIniciativas} iniciativas e ${metrics.totalExperimentos} experimentos no portfólio.</text>
    <rect x="64" y="620" width="896" height="380" rx="26" fill="#FFFFFF"/>
    <text x="112" y="682" class="section">FUNIL DE INOVAÇÃO</text>
    ${funnelRows}
    <rect x="64" y="1040" width="896" height="410" rx="26" fill="#FFFFFF"/>
    <text x="112" y="1094" class="section">TOP DOMÍNIOS</text>
    ${domainRows}
    <line x1="64" y1="1484" x2="960" y2="1484" stroke="#D1D5DB"/>
    <text x="64" y="1518" class="footer">beOn Labs | P&amp;D Claro Brasil</text>
    <text x="960" y="1518" text-anchor="end" class="footer">Relatório semanal</text>
  </svg>`
}
```

- [ ] **Step 6: Run the SVG test and verify the GREEN state**

Run:

```bash
npm test -- src/lib/report-image.test.ts
```

Expected: all three tests PASS.

- [ ] **Step 7: Commit the self-contained builder**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/report-image.ts src/lib/report-image.test.ts
git commit -m "updates"
```

---

### Task 2: PNG Rasterizer

**Files:**
- Create: `src/lib/report-image-renderer.ts`
- Test: `src/lib/report-image-renderer.test.ts`

**Interfaces:**
- Consumes: `ReportImageMetrics` and `buildReportInfographicSvg(metrics)` from Task 1.
- Produces: `renderReportInfographicPng(metrics: ReportImageMetrics): Promise<Buffer>`.

- [ ] **Step 1: Write the failing PNG integration test**

Create `src/lib/report-image-renderer.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { renderReportInfographicPng } from './report-image-renderer'

describe('renderReportInfographicPng', () => {
  it('returns a valid 1024x1536 PNG', async () => {
    const png = await renderReportInfographicPng({
      generatedOn: '31/07/2026',
      totalIniciativas: 186,
      totalExperimentos: 199,
      emAndamento: 42,
      emPiloto: 18,
      concluidos: 27,
      beneficio: 2_500_000,
      topDominios: [{ name: 'Rede', count: 31 }],
    })

    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    expect(png.toString('ascii', 12, 16)).toBe('IHDR')
    expect(png.readUInt32BE(16)).toBe(1024)
    expect(png.readUInt32BE(20)).toBe(1536)
  })
})
```

- [ ] **Step 2: Run the rasterizer test and verify the RED state**

Run:

```bash
npm test -- src/lib/report-image-renderer.test.ts
```

Expected: FAIL because `src/lib/report-image-renderer.ts` does not exist.

- [ ] **Step 3: Implement rasterization and invariant checks**

Create `src/lib/report-image-renderer.ts`:

```ts
import { Resvg } from '@resvg/resvg-js'
import {
  REPORT_IMAGE_HEIGHT,
  REPORT_IMAGE_WIDTH,
  buildReportInfographicSvg,
  type ReportImageMetrics,
} from './report-image'

export async function renderReportInfographicPng(metrics: ReportImageMetrics): Promise<Buffer> {
  const svg = buildReportInfographicSvg(metrics)
  const png = Buffer.from(
    new Resvg(svg, {
      fitTo: { mode: 'width', value: REPORT_IMAGE_WIDTH },
      font: { loadSystemFonts: true },
    }).render().asPng(),
  )

  if (
    png.length < 24 ||
    png.toString('ascii', 12, 16) !== 'IHDR' ||
    png.readUInt32BE(16) !== REPORT_IMAGE_WIDTH ||
    png.readUInt32BE(20) !== REPORT_IMAGE_HEIGHT
  ) {
    throw new Error('Invalid report image output')
  }

  return png
}
```

- [ ] **Step 4: Run the rasterizer tests and verify the GREEN state**

Run:

```bash
npm test -- src/lib/report-image-renderer.test.ts src/lib/report-image.test.ts
```

Expected: both test files PASS.

- [ ] **Step 5: Commit the renderer**

```bash
git add src/lib/report-image-renderer.ts src/lib/report-image-renderer.test.ts
git commit -m "updates"
```

---

### Task 3: Endpoint Contract and Client Copy

**Files:**
- Modify: `src/app/api/report/image/route.ts`
- Test: `src/app/api/report/image/route.test.ts`
- Modify: `src/components/report/GenerateImageButton.tsx`
- Test: `src/components/report/GenerateImageButton.test.tsx`

**Interfaces:**
- Consumes: `renderReportInfographicPng(metrics)` and `formatReportImageDate(date)` from Tasks 1–2, plus the existing Jira/classifier/mapper services.
- Produces: authenticated `GET /jira/api/report/image` response `{ image: string, format: 'png' }`.
- Preserves: `GenerateImageButton` request path, state transitions, preview, and download filename.

- [ ] **Step 1: Write the failing route contract tests**

Create `src/app/api/report/image/route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchDashboardRaw: vi.fn(),
  classifyPortfolios: vi.fn(),
  classifySegmentos: vi.fn(),
  buildDashboardData: vi.fn(),
  legacyImageGenerate: vi.fn(),
}))

vi.mock('@/lib/jira', () => ({ fetchDashboardRaw: mocks.fetchDashboardRaw }))
vi.mock('@/lib/portfolio-classifier', () => ({ classifyPortfolios: mocks.classifyPortfolios }))
vi.mock('@/lib/segmento-classifier', () => ({ classifySegmentos: mocks.classifySegmentos }))
vi.mock('@/lib/mappers', () => ({ buildDashboardData: mocks.buildDashboardData }))
vi.mock('@/lib/llm', () => ({
  getAzureOpenAIClient: () => ({ images: { generate: mocks.legacyImageGenerate } }),
}))

import { GET } from './route'

describe('GET /api/report/image', () => {
  beforeEach(() => {
    mocks.fetchDashboardRaw.mockResolvedValue({
      iniciativas: [],
      epics: [{
        key: 'GL-1',
        fields: {
          summary: 'Experimento de rede',
          customfield_16400: { value: 'Rede' },
          customfield_11661: 'Consumo',
        },
      }],
      board2706Config: {},
    })
    mocks.classifyPortfolios.mockResolvedValue({})
    mocks.classifySegmentos.mockResolvedValue({})
    mocks.buildDashboardData.mockReturnValue({
      iniciativas: [{ key: 'GL-100' }, { key: 'GL-101' }],
      allEpics: [
        { status: { name: 'Em andamento' }, beneficioQuantitativo: 1_500_000, dominio: 'Rede' },
        { status: { name: 'Concluído' }, beneficioQuantitativo: 500_000, dominio: 'Atendimento' },
      ],
    })
  })

  it('returns the existing JSON contract with a 1024x1536 PNG', async () => {
    const response = await GET()
    const body = await response.json()
    const png = Buffer.from(body.image, 'base64')

    expect(response.status).toBe(200)
    expect(body.format).toBe('png')
    expect(png.toString('ascii', 12, 16)).toBe('IHDR')
    expect(png.readUInt32BE(16)).toBe(1024)
    expect(png.readUInt32BE(20)).toBe(1536)
    expect(mocks.legacyImageGenerate).not.toHaveBeenCalled()
  })

  it('does not expose internal error details', async () => {
    mocks.fetchDashboardRaw.mockRejectedValueOnce(new Error('credential detail'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Falha ao gerar imagem' })
    expect(JSON.stringify(body)).not.toContain('credential detail')
  })
})
```

- [ ] **Step 2: Write the failing client-copy test**

Create `src/components/report/GenerateImageButton.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import GenerateImageButton from './GenerateImageButton'

describe('GenerateImageButton', () => {
  it('offers deterministic image generation without AI attribution', () => {
    const markup = renderToStaticMarkup(<GenerateImageButton />)

    expect(markup).toContain('Gerar Imagem')
    expect(markup).not.toContain('Gerar Imagem IA')
  })
})
```

- [ ] **Step 3: Run both tests and verify the RED state**

Run:

```bash
npm test -- src/app/api/report/image/route.test.ts src/components/report/GenerateImageButton.test.tsx
```

Expected: route test FAIL because the legacy implementation calls `legacyImageGenerate`; component test FAIL because the initial label contains `IA`.

- [ ] **Step 4: Replace the route implementation**

Replace `src/app/api/report/image/route.ts` with:

```ts
import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import { formatReportImageDate, type ReportImageMetrics } from '@/lib/report-image'
import { renderReportInfographicPng } from '@/lib/report-image-renderer'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const raw = await fetchDashboardRaw()
    const [classification, segmentoClassification] = await Promise.all([
      classifyPortfolios(raw.epics.map(epic => ({
        key: epic.key,
        summary: epic.fields.summary,
        dominio: epic.fields.customfield_16400?.value ?? null,
      }))),
      classifySegmentos(raw.epics.map(epic => ({
        key: epic.key,
        summary: epic.fields.summary,
        dominio: epic.fields.customfield_11661 ?? null,
      }))),
    ])
    const data = buildDashboardData(
      raw.iniciativas,
      raw.epics,
      classification,
      segmentoClassification,
      raw.board2706Config,
    )
    const dominioCount: Record<string, number> = {}

    for (const epic of data.allEpics) {
      if (epic.dominio) {
        dominioCount[epic.dominio] = (dominioCount[epic.dominio] ?? 0) + 1
      }
    }

    const metrics: ReportImageMetrics = {
      generatedOn: formatReportImageDate(new Date()),
      totalIniciativas: data.iniciativas.length,
      totalExperimentos: data.allEpics.length,
      emAndamento: data.allEpics.filter(epic => epic.status.name === 'Em andamento').length,
      emPiloto: data.allEpics.filter(epic => ['EM PILOTO', 'Em andamento'].includes(epic.status.name)).length,
      concluidos: data.allEpics.filter(epic => ['Concluído', 'FINALIZADO'].includes(epic.status.name)).length,
      beneficio: data.allEpics.reduce((total, epic) => total + (epic.beneficioQuantitativo ?? 0), 0),
      topDominios: Object.entries(dominioCount)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    }
    const png = await renderReportInfographicPng(metrics)

    return NextResponse.json({ image: png.toString('base64'), format: 'png' })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Falha ao gerar imagem' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Remove AI attribution from the existing client**

In `src/components/report/GenerateImageButton.tsx` make only these copy changes:

```tsx
{loading ? 'Gerando imagem...' : 'Gerar Imagem'}
```

```tsx
alt="Prévia do relatório em imagem"
```

- [ ] **Step 6: Run endpoint, client, and renderer tests**

Run:

```bash
npm test -- src/app/api/report/image/route.test.ts src/components/report/GenerateImageButton.test.tsx src/lib/report-image-renderer.test.ts src/lib/report-image.test.ts
```

Expected: all test files PASS and `legacyImageGenerate` remains uncalled.

- [ ] **Step 7: Commit endpoint and UI changes**

```bash
git add src/app/api/report/image/route.ts src/app/api/report/image/route.test.ts src/components/report/GenerateImageButton.tsx src/components/report/GenerateImageButton.test.tsx
git commit -m "updates"
```

---

### Task 4: Stop Tracking and Protect Environment Files

**Files:**
- Modify: `.gitignore`
- Remove from index, preserve locally: `.env`
- Modify locally without tracking: `.env`, only to remove `AZURE_OPENAI_DEPLOYMENT_IMAGE`

**Interfaces:**
- Produces: an ignored local `.env` with mode `0600` and no image deployment setting.
- Preserves: all other environment keys and values byte-for-byte.

- [ ] **Step 1: Confirm the regression before changing ignore rules**

Run:

```bash
git check-ignore -q .env
```

Expected: exit 1 because `.env` is not currently ignored.

- [ ] **Step 2: Add root environment-file rules**

Replace the existing `.env*.local` rule in `.gitignore` with:

```gitignore
/.env
/.env.*
!/.env.example
```

- [ ] **Step 3: Remove only the image deployment setting from the local file**

Use `apply_patch` to remove this line from `.env` without displaying the file:

```dotenv
AZURE_OPENAI_DEPLOYMENT_IMAGE=gpt-image-2
```

Run a filename-only check across local environment files:

```bash
rg -l '^AZURE_OPENAI_DEPLOYMENT_IMAGE=' .env .env.local .worktrees
```

Expected: no output. If a second local file is reported, remove only that named setting with `apply_patch`, without printing surrounding values.

- [ ] **Step 4: Remove `.env` from the index and tighten local permissions**

Run:

```bash
git rm --cached -- .env
chmod 600 .env
chmod 600 .env.local
chmod 600 .worktrees/jira-viewer-auto-deploy/.env
```

Expected: `.env` still exists locally, appears as a staged deletion, and is ignored after the next commit.

- [ ] **Step 5: Verify the active application has no image-model references**

Run:

```bash
rg -n 'gpt-image-2|AZURE_OPENAI_DEPLOYMENT_IMAGE|images\.generate|Gerar Imagem IA|gerado por IA' src package.json .gitignore
```

Expected: no output.

Run:

```bash
git check-ignore -v .env
git ls-files .env
stat -c '%a %n' .env .env.local .worktrees/jira-viewer-auto-deploy/.env
```

Expected: `.env` is ignored, `git ls-files` prints nothing, and all three modes are `600`.

- [ ] **Step 6: Run the complete application verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: tests PASS, production build succeeds, and `git diff --check` has no output.

- [ ] **Step 7: Commit the ignore rule and index deletion**

```bash
git add .gitignore
git commit -m "updates"
```

Run:

```bash
git status --short --branch
```

Expected: clean worktree; `main` is ahead of `origin/main`; ignored `.env` is absent from status.

---

### Task 5: Rewrite Local and Remote History

**Files and refs:**
- Rewrite in disposable mirror: `refs/heads/main`, `refs/heads/ops/jira-viewer-auto-deploy`, and any local remote-tracking copy.
- Publish: `refs/heads/main` only.
- Preserve outside Git: local `.env`, `.env.local`, and `.worktrees/jira-viewer-auto-deploy/.env`.

**Interfaces:**
- Consumes: clean commits from Tasks 1–4 and the pre-rewrite remote `main` OID.
- Produces: matching clean `main` locally/remotely, clean local `ops/jira-viewer-auto-deploy`, no reachable `.env` path or old `.env` blobs, and no temporary mirror or backup.

- [ ] **Step 1: Capture the exact pre-rewrite inventory without printing environment contents**

Keep these values in one task-local shell or equivalent orchestration state:

```bash
git status --short --branch
main_before="$(git rev-parse refs/heads/main)"
ops_before="$(git rev-parse refs/heads/ops/jira-viewer-auto-deploy)"
remote_main_before="$(git ls-remote --heads origin refs/heads/main | cut -f1)"
mapfile -t env_object_ids < <(git rev-list --objects --all -- .env | awk '$2 == ".env" { print $1 }')
git ls-remote --heads --tags origin
git worktree list --porcelain
```

Expected: worktree clean; all four variables are non-empty; `env_object_ids` contains the three historical blob IDs; remote contains only `refs/heads/main`; no tags; local `ops/...` exists; stale worktree metadata is still marked prunable.

- [ ] **Step 2: Create an explicit temporary workspace and protected backup**

Create one directory with:

```bash
rewrite_root="$(mktemp -d /tmp/jira-viewer-env-purge.XXXXXX)"
install -m 600 .env "$rewrite_root/env.backup"
python3 -m venv "$rewrite_root/venv"
"$rewrite_root/venv/bin/pip" install git-filter-repo
git clone --mirror /mnt/sda1/Projects/claro/jira-viewer "$rewrite_root/rewrite.git"
```

Expected: the backup mode is `600`; the mirror contains both local heads; no path outside the explicit temporary directory is modified.

- [ ] **Step 3: Recheck GitHub immediately before rewriting**

Run:

```bash
remote_main_recheck="$(git ls-remote --heads origin refs/heads/main | cut -f1)"
test "$remote_main_recheck" = "$remote_main_before"
test "$(git ls-remote --heads --tags origin | wc -l)" -eq 1
```

Expected: exactly the same remote `main` OID captured in Step 1 and no additional branch or tag. Abort this task if it differs.

- [ ] **Step 4: Rewrite all mirror refs**

Set the command working directory to `$rewrite_root/rewrite.git`, then run:

```bash
"$rewrite_root/venv/bin/git-filter-repo" --path .env --invert-paths --force
```

Capture the rewritten OIDs:

```bash
main_after="$(git -C "$rewrite_root/rewrite.git" rev-parse refs/heads/main)"
ops_after="$(git -C "$rewrite_root/rewrite.git" rev-parse refs/heads/ops/jira-viewer-auto-deploy)"
```

- [ ] **Step 5: Verify the mirror before any remote mutation**

Run:

```bash
git -C "$rewrite_root/rewrite.git" log --all -- .env
test -z "$(git -C "$rewrite_root/rewrite.git" rev-list --objects --all | awk '$2 == ".env" { print $1 }')"
git -C "$rewrite_root/rewrite.git" fsck --full
```

Expected: the log is empty; the object listing has no line whose path is `.env`; `fsck` reports no structural error. Inspect the rewritten `main` tree and confirm the image implementation, tests, `.gitignore`, spec, and plan are present.

- [ ] **Step 6: Publish only rewritten `main` with an exact lease**

Use the old remote OID captured in Step 1:

```bash
git -C "$rewrite_root/rewrite.git" push --force-with-lease="refs/heads/main:$remote_main_before" https://github.com/Colab-Claro/jira-viewer.git refs/heads/main:refs/heads/main
```

Expected: only `main` is force-updated. Do not push `ops/jira-viewer-auto-deploy` and do not use `--mirror`.

- [ ] **Step 7: Realign local refs to the verified clean history**

Fetch the rewritten remote, reset the clean current worktree, then update the inactive local branch with compare-and-swap:

```bash
git fetch --prune origin
git reset --hard origin/main
git update-ref refs/heads/ops/jira-viewer-auto-deploy "$ops_after" "$ops_before"
git worktree prune
git update-ref -d ORIG_HEAD
```

Confirm `git rev-parse HEAD` equals `$main_after`. If `.env` is missing after reset, restore it from `$rewrite_root/env.backup` with mode `600`; otherwise compare it to the backup without displaying either file.

- [ ] **Step 8: Remove old local reflogs and unreachable objects**

Only after local and remote refs point to verified clean commits, run:

```bash
git reflog expire --expire=now --all
git gc --prune=now
```

Check every old `.env` object ID saved in Step 1:

```bash
for env_object_id in "${env_object_ids[@]}"; do
  if git cat-file -e "$env_object_id" 2>/dev/null; then
    exit 1
  fi
done
```

Expected: each check exits nonzero because the old object is no longer present locally.

- [ ] **Step 9: Audit a fresh copy of the remote**

Create a second bare clone inside the same temporary root:

```bash
git clone --mirror https://github.com/Colab-Claro/jira-viewer.git "$rewrite_root/remote-audit.git"
git -C "$rewrite_root/remote-audit.git" log --all -- .env
test -z "$(git -C "$rewrite_root/remote-audit.git" rev-list --objects --all | awk '$2 == ".env" { print $1 }')"
git -C "$rewrite_root/remote-audit.git" fsck --full
git ls-remote --heads --tags origin
```

Expected: no `.env` history/path, no structural error, and remote `main` equals local `main`.

- [ ] **Step 10: Run final application and repository verification**

Run:

```bash
npm test
npm run build
git status --short --branch
git log --all -- .env
test -z "$(git rev-list --objects --all | awk '$2 == ".env" { print $1 }')"
git ls-files .env
git check-ignore -v .env
stat -c '%a %n' .env
```

Expected: tests/build PASS; branch is clean and synchronized; both Git history commands contain no `.env` path; `.env` is untracked, ignored, present, and mode `600`.

- [ ] **Step 11: Destroy the temporary sensitive workspace**

Resolve and validate the exact `$rewrite_root` path, then remove only that temporary workspace:

```bash
case "$rewrite_root" in
  /tmp/jira-viewer-env-purge.*) ;;
  *) exit 1 ;;
esac
shred -u -- "$rewrite_root/env.backup"
rm -rf -- "$rewrite_root"
```

Report that this removed the transient full mirror and local secret backup and that they are not recoverable through Git.

- [ ] **Step 12: Security handoff**

Report the rewritten remote `main` OID and tell the user to:

1. rotate every credential that appeared in any historical `.env` version;
2. have collaborators reclone or hard-reset to the rewritten `main` before pushing;
3. contact GitHub Support if inaccessible pull-request refs, forks, or cached objects must also be purged.

Do not claim credential rotation or off-repository purge was completed by this implementation.

---

## Final Self-Review Checklist

- The renderer owns no Jira/OpenAI behavior and accepts one typed metric object.
- The route alone translates dashboard data into renderer metrics.
- The endpoint and button preserve the user-visible contract.
- Tests cover SVG escaping, timezone, PNG dimensions, route response, lack of Images API use, and generic errors.
- The only new runtime dependency is `@resvg/resvg-js`; Vitest is development-only.
- `.env` remains available locally while leaving the index and every rewritten ref.
- The remote mutation is one explicit force-with-lease of `main`; no mirror push and no publication of `ops/...`.
- Every commit command uses exactly `updates`.

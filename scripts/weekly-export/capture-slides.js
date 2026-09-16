/**
 * Captura todos os slides da Weekly (os 4 slides principais + o "Ver
 * detalhes" de cada uma das 7 fases do funil) como PNGs, usando os mesmos
 * botões de download que já existem na página — não recria o layout,
 * só automatiza cliques nos botões "PNG" já prontos.
 *
 * Pré-requisitos (uma vez só):
 *   npx playwright install chromium
 *
 * Uso:
 *   node scripts/weekly-export/capture-slides.js
 *
 * Variáveis de ambiente (todas opcionais):
 *   WEEKLY_BASE_URL       URL base da aplicação (default: http://localhost:3003/jira)
 *   WEEKLY_LOGIN_USER     usuário de login (default: preview)
 *   WEEKLY_LOGIN_PASSWORD senha de login (default: preview123)
 *   WEEKLY_EXPORT_DIR     pasta de saída dos PNGs (default: ./weekly-export/slides)
 *   WEEKLY_CHROMIUM_PATH  caminho de um binário do Chromium já instalado
 *                         (opcional — útil em CI/sandboxes com navegador
 *                         próprio; sem isso o Playwright usa o Chromium que
 *                         ele mesmo baixa via `npx playwright install`)
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.WEEKLY_BASE_URL || 'http://localhost:3003/jira'
const LOGIN_USER = process.env.WEEKLY_LOGIN_USER || 'preview'
const LOGIN_PASSWORD = process.env.WEEKLY_LOGIN_PASSWORD || 'preview123'
const OUT_DIR = process.env.WEEKLY_EXPORT_DIR || path.join(process.cwd(), 'weekly-export', 'slides')

// Ordem e rótulos das fases do funil — precisa bater com os labels de
// src/lib/weekly.ts (WeeklyStage.label) usados nos chips "Ver detalhes".
const STAGES = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'cancelados', label: 'Cancelados' },
  { id: 'concluidos', label: 'Concluídos' },
  { id: 'aguardando', label: 'Aguardando piloto' },
  { id: 'piloto', label: 'Piloto' },
  { id: 'escala', label: 'Em escala' },
]
const MAIN_SLIDE_COUNT = 5 // Governança, Bloqueios, Pipeline, Aprendizados, Patrocinadores — nessa ordem no DOM

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true })
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const launchOptions = { headless: true, args: ['--no-sandbox'] }
  if (process.env.WEEKLY_CHROMIUM_PATH) launchOptions.executablePath = process.env.WEEKLY_CHROMIUM_PATH
  const browser = await chromium.launch(launchOptions)
  const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, acceptDownloads: true })
  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message))

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="text"], input[name="username"], input[placeholder="admin"]', LOGIN_USER)
  await page.fill('input[type="password"]', LOGIN_PASSWORD)
  await page.click('button:has-text("Entrar")')
  await page.waitForURL('**/estrategia', { timeout: 15000 }).catch(() => {})

  await page.goto(`${BASE_URL}/weekly`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const manifest = []
  let seq = 0

  async function downloadNth(n, name) {
    const pngButtons = page.locator('button:has-text("PNG")')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      pngButtons.nth(n).click(),
    ])
    seq += 1
    const fname = `${String(seq).padStart(2, '0')}_${name}.png`
    const dest = path.join(OUT_DIR, fname)
    await download.saveAs(dest)
    manifest.push(fname)
    console.log('  saved', fname)
  }

  console.log('Capturando os 5 slides principais...')
  await downloadNth(0, 'governanca_beon_labs')
  await downloadNth(1, 'bloqueios_acao_executivo')
  await downloadNth(2, 'pipeline_experimentos')
  await downloadNth(3, 'principais_aprendizados')
  await downloadNth(4, 'principais_patrocinadores')

  console.log('Capturando "Ver detalhes" de cada fase...')
  for (const stage of STAGES) {
    const chip = page.locator('button', { hasText: new RegExp('^' + escapeRegExp(stage.label) + ' \\(') })
    await chip.first().click()
    await page.waitForTimeout(600)

    // Só a fase clicada fica montada por vez, então qualquer botão PNG além
    // dos 4 principais pertence a ela — pode ser mais de um se a fase tiver
    // mais de SLIDE_PAGE_SIZE (10) experimentos e paginar.
    const totalButtons = await page.locator('button:has-text("PNG")').count()
    const paginas = totalButtons - MAIN_SLIDE_COUNT
    for (let p = 0; p < paginas; p++) {
      await downloadNth(MAIN_SLIDE_COUNT + p, `detalhes_${stage.id}_pagina${p + 1}`)
    }
  }

  if (consoleErrors.length > 0) {
    console.warn('Erros de console durante a captura:', consoleErrors)
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`\n${manifest.length} imagens salvas em ${OUT_DIR}`)

  await browser.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

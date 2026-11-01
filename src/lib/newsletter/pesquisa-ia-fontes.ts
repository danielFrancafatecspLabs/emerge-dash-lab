import fs from 'fs'
import path from 'path'
import { comCache, diretorioDoCache } from '@/lib/cache-dados'
import {
  AREAS, DESTAQUES, PESQUISADORES, consultaDosPesquisadores, fotoDaWikipedia, lerArxiv, papersDoHuggingFace, papersPorPesquisador,
  type AreaId, type DadosDePesquisa, type FotoDoPesquisador, type Paper,
} from './pesquisa-ia'

// Leitura das fontes da Pesquisa em IA (só no servidor): arXiv, Daily Papers do Hugging Face e fotos da Wikipedia.
// As leituras ficam em cache (renovadas a cada 6 horas; fotos a cada 7 dias). Se uma fonte falhar, segue o que foi lido
// da última vez.

// A Wikimedia pede um User-Agent que identifique quem chama (com um endereço de contato), senão pode recusar.
const UA = 'beOnLabs-Radar/1.0 (+https://github.com/danielFrancafatecspLabs/emerge-dash-lab; newsletter interna de tecnologia)'

async function buscar(url: string, aceitar: string, timeoutMs = 15_000): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store', redirect: 'follow', headers: { 'User-Agent': UA, Accept: aceitar } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.text()).slice(0, 4_000_000)
  } finally {
    clearTimeout(timer)
  }
}

const bases = () => ({
  arxiv: process.env.RADAR_ARXIV_BASE_URL || 'https://export.arxiv.org',
  hf: process.env.RADAR_HUGGINGFACE_BASE_URL || 'https://huggingface.co',
  wiki: process.env.RADAR_WIKIPEDIA_BASE_URL || 'https://en.wikipedia.org',
})

const consultaArxiv = (base: string, q: string, max: number) =>
  `${base}/api/query?search_query=${encodeURIComponent(q)}&sortBy=submittedDate&sortOrder=descending&max_results=${max}`

// O arXiv pede no máximo uma chamada a cada 3 segundos: as chamadas daqui entram numa fila.
let filaDoArxiv: Promise<unknown> = Promise.resolve()
function buscarNoArxiv(url: string): Promise<string> {
  const vez = filaDoArxiv.then(() => buscar(url, 'application/atom+xml'))
  const intervalo = Number(process.env.RADAR_ARXIV_INTERVALO_MS ?? 3_000)
  filaDoArxiv = vez.catch(() => undefined).then(() => new Promise(r => setTimeout(r, intervalo)))
  return vez
}

const FOTOS_VALEM_MS = 7 * 86_400_000

/** Lê as fontes. O que falhar fica com a leitura anterior. */
export async function lerFontes(anterior?: DadosDePesquisa, pesquisadores = PESQUISADORES): Promise<DadosDePesquisa> {
  const b = bases()
  const fontes: DadosDePesquisa['fontes'] = []

  const [arxiv, hf] = await Promise.all([
    buscarNoArxiv(consultaArxiv(b.arxiv, consultaDosPesquisadores(pesquisadores), 400)).then(lerArxiv).catch(err => {
      console.warn('[pesquisa-ia] arXiv indisponível:', String(err)); return null
    }),
    buscar(`${b.hf}/api/daily_papers?limit=50`, 'application/json').then(t => papersDoHuggingFace(JSON.parse(t))).catch(err => {
      console.warn('[pesquisa-ia] Hugging Face indisponível:', String(err)); return null
    }),
  ])
  fontes.push({ nome: 'arXiv', ok: !!arxiv?.length }, { nome: 'Hugging Face Daily Papers', ok: !!hf?.length })

  let destaques = hf?.length ? hf : null
  let destaquesFonte: DadosDePesquisa['destaquesFonte'] = destaques ? 'huggingface' : null
  if (!destaques) {
    // Sem o Daily Papers: os mais recentes do arXiv em IA, aprendizado de máquina e linguagem.
    const recentes = await buscarNoArxiv(consultaArxiv(b.arxiv, 'cat:cs.AI OR cat:cs.LG OR cat:cs.CL', DESTAQUES)).then(lerArxiv).catch(() => null)
    if (recentes?.length) { destaques = recentes; destaquesFonte = 'arxiv' }
  }
  if (!destaques && anterior?.destaques.length) { destaques = anterior.destaques; destaquesFonte = anterior.destaquesFonte }

  // Fotos: só quando ainda não há ou já passaram 7 dias.
  const renovarFotos = !anterior?.fotosEm || Date.now() - Date.parse(anterior.fotosEm) > FOTOS_VALEM_MS
  let fotos = anterior?.fotos ?? {}
  let fotosEm = anterior?.fotosEm ?? null
  const faltando = pesquisadores.filter(p => renovarFotos || !(p.id in fotos))
  if (faltando.length) {
    const lidas = await Promise.all(faltando.map(async p => {
      try {
        return [p.id, fotoDaWikipedia(JSON.parse(await buscar(`${b.wiki}/api/rest_v1/page/summary/${encodeURIComponent(p.wikipedia)}`, 'application/json', 8_000)))] as const
      } catch {
        return [p.id, undefined] as const
      }
    }))
    const ok = lidas.filter((x): x is readonly [string, FotoDoPesquisador | null] => x[1] !== undefined)
    fontes.push({ nome: 'Wikipedia', ok: ok.length > 0 })
    if (ok.length) {
      fotos = { ...fotos, ...Object.fromEntries(ok) }
      if (ok.length === faltando.length || !fotosEm) fotosEm = new Date().toISOString()
    }
  }

  if (!arxiv?.length && !destaques && !anterior) throw new Error('nenhuma fonte de pesquisa respondeu')

  const datas = (arxiv ?? []).map(p => p.publicadoEm).filter((d): d is string => !!d).sort()
  return {
    papers: arxiv?.length ? papersPorPesquisador(arxiv, pesquisadores) : anterior?.papers ?? {},
    arxivDesde: arxiv?.length ? datas[0] ?? null : anterior?.arxivDesde ?? null,
    destaques: destaques ?? [],
    destaquesFonte,
    fotos,
    fotosEm,
    atualizadoEm: new Date().toISOString(),
    fontes,
  }
}

/** Dados das fontes com cache no servidor: no máximo uma leitura a cada 6 horas, para todo mundo. */
export function dadosDePesquisa(): Promise<DadosDePesquisa> {
  return comCache('radar-pesquisa-ia', anterior => lerFontes(anterior), {
    frescoPorMs: 6 * 3600_000, maximoObsoletoMs: 7 * 86_400_000, esperaAposFalhaMs: 30 * 60_000,
  })
}

// ── Fotos servidas pelo próprio app ─────────────────────────────────────────────────────────
// O servidor baixa a foto uma vez e guarda em disco: quem abre a newsletter não precisa alcançar a Wikimedia (redes
// corporativas costumam bloquear), e a Wikimedia recebe uma visita por foto, não uma por pessoa.

const LIMITE_DA_FOTO = 3_000_000
const falhasDeFoto = new Map<string, number>()

export interface ImagemGuardada { bytes: Buffer; tipo: string }

const pastaDasFotos = () => path.join(diretorioDoCache(), 'pesquisadores')

export async function fotoGuardada(id: string): Promise<ImagemGuardada | null> {
  if (!PESQUISADORES.some(p => p.id === id)) return null
  const foto = (await dadosDePesquisa()).fotos[id]
  if (!foto) return null
  const base = path.join(pastaDasFotos(), id)
  try {
    const meta = JSON.parse(fs.readFileSync(`${base}.json`, 'utf-8')) as { url: string; tipo: string }
    if (meta.url === foto.url) return { bytes: fs.readFileSync(`${base}.img`), tipo: meta.tipo }
  } catch { /* ainda não guardada */ }

  const falhou = falhasDeFoto.get(id)
  if (falhou && Date.now() - falhou < 3600_000) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(foto.url, { signal: controller.signal, cache: 'no-store', redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'image/*' } })
    const tipo = res.headers.get('content-type') ?? ''
    if (!res.ok || !/^image\/(jpeg|png|webp|gif|svg\+xml)/i.test(tipo)) throw new Error(`HTTP ${res.status} ${tipo}`)
    const bytes = Buffer.from(await res.arrayBuffer())
    if (bytes.length > LIMITE_DA_FOTO) throw new Error('foto grande demais')
    try {
      fs.mkdirSync(pastaDasFotos(), { recursive: true })
      fs.writeFileSync(`${base}.img`, bytes)
      fs.writeFileSync(`${base}.json`, JSON.stringify({ url: foto.url, tipo }))
    } catch { /* sem disco: serve sem guardar */ }
    falhasDeFoto.delete(id)
    return { bytes, tipo }
  } catch (err) {
    console.warn(`[pesquisa-ia] foto de ${id} indisponível:`, String(err))
    falhasDeFoto.set(id, Date.now())
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ── Papers de cada área (lidos só quando alguém abre a área) ───────────────────────────────

export interface PapersDaArea { area: AreaId; papers: Paper[]; atualizadoEm: string }

export function papersDaArea(area: AreaId): Promise<PapersDaArea> {
  const consulta = AREAS.find(a => a.id === area)?.arxiv
  if (!consulta) return Promise.resolve({ area, papers: [], atualizadoEm: new Date().toISOString() })
  return comCache(`radar-pesquisa-area-${area}`, async () => {
    const papers = lerArxiv(await buscarNoArxiv(consultaArxiv(bases().arxiv, consulta, DESTAQUES)))
    if (!papers.length) throw new Error(`nenhum paper do arXiv em ${area}`)
    return { area, papers, atualizadoEm: new Date().toISOString() }
  }, { frescoPorMs: 12 * 3600_000, maximoObsoletoMs: 14 * 86_400_000, esperaAposFalhaMs: 30 * 60_000 })
}

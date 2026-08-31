import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'

export const dynamic = 'force-dynamic'

export default async function DebugChangelogPage() {
  const raw = await fetchDashboardRaw()
  
  // Encontrar as iniciativas candidatas
  const CANDIDATAS_NOMES = new Set([
    'ARI Juridico', 'Zelador', 'Reajuste Telmex', 'OCR do Solar',
    'Processamento de Manifestos', 'Identificação de Chamadas de Spam',
    'Automação de Editais', 'Qualificações de Segurança',
    'Tabulação Automática em Leitura de Contexto',
  ])

  const linhas: string[] = []

  for (const ini of raw.iniciativas) {
    if (!CANDIDATAS_NOMES.has(ini.fields.summary.trim())) continue
    
    linhas.push(`<h3>${ini.key} — ${ini.fields.summary}</h3>`)
    linhas.push(`<p>Status: ${ini.fields.status.name} (id: ${ini.fields.status.id})</p>`)
    
    // Changelog da iniciativa
    const cl = raw.iniciativaChangelogs[ini.key]
    if (cl) {
      linhas.push(`<p>Changelog (${cl.length} entries):</p><ul>`)
      for (const entry of cl) {
        for (const item of entry.items) {
          if (item.field === 'status') {
            linhas.push(`<li>[${entry.created}] "${item.fromString}" → "${item.toString}"</li>`)
          }
        }
      }
      linhas.push('</ul>')
    } else {
      linhas.push('<p>Sem changelog</p>')
    }
    
    // Epics filhos
    const epicsFilhos = raw.epics.filter(e => e.fields.parent?.key === ini.key)
    linhas.push(`<p>Epics filhos: ${epicsFilhos.length}</p><ul>`)
    for (const ep of epicsFilhos) {
      linhas.push(`<li><b>${ep.key}</b> — ${ep.fields.summary} (status: ${ep.fields.status.name}, id: ${ep.fields.status.id})`)
      
      // Changelog do Epic
      const ecl = raw.epicChangelogs[ep.key]
      if (ecl) {
        linhas.push(`<ul>`)
        for (const entry of ecl) {
          for (const item of entry.items) {
            if (item.field === 'status') {
              linhas.push(`<li>[${entry.created}] "${item.fromString}" → "${item.toString}"</li>`)
            }
          }
        }
        linhas.push(`</ul>`)
      }
      linhas.push('</li>')
    }
    linhas.push('</ul><hr/>')
  }

  return (
    <div style={{fontFamily:'monospace',fontSize:13,padding:20,background:'#f5f5f5'}}>
      <h1>Debug Changelog — Candidatas Delivery</h1>
      {linhas.join('\n')}
    </div>
  )
}
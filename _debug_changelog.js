const https = require('https')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const email = 'daniel.anunciacao@claro.com.br'
const token = 'ATATT3xFfGF0H948UMMf-mW3S74c_oTD1mKwgT13kRN4tFEpbm4NMu3s3ovvQv-o52cY8pW15TfkKxemnxHMaQoKAspNDTF40dTBKO-MOhuCCvurAb90_CCvImBX2efeMzFzSHIhzJB2IMn4lVvBFNgymzZH3fqXtdRxqJFGosxYTW6TuYSlor8=9F0C4DED'
const b = Buffer.from(`${email}:${token}`).toString('base64')

// Primeiro, buscar os Epics das iniciativas candidatas
function getJson(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'clarobr-jsw-tecnologia.atlassian.net',
      path,
      headers: { 'Authorization': `Basic ${b}`, 'Accept': 'application/json' }
    }
    https.get(opts, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try { resolve(JSON.parse(d)) }
        catch (e) { reject(new Error(`Parse error: ${d.substring(0, 200)}`)) }
      })
    }).on('error', reject)
  })
}

async function main() {
  // Buscar iniciativas do board 2734
  const iniciativas = await getJson('/rest/agile/1.0/board/2734/issue?maxResults=200&fields=summary,status,issuetype')
  const nomesBusca = ['ARI Juridico', 'Zelador', 'Reajuste Telmex', 'OCR do Solar', 'Processamento de Manifestos', 'Identificação de Chamadas de Spam', 'Automação de Editais', 'Qualificações de Segurança', 'Tabulação Automática']
  
  console.log('Total issues no board 2734:', iniciativas.issues?.length)
  
  for (const ini of iniciativas.issues || []) {
    const s = ini.fields.summary
    if (nomesBusca.some(n => s.includes(n) || n.includes(s))) {
      console.log(`\n=== INICIATIVA: ${ini.key} - "${s}" (status: ${ini.fields.status.name}, id: ${ini.fields.status.id}, type: ${ini.fields.issuetype?.name}) ===`)
      
      // Buscar changelog da iniciativa
      try {
        const cl = await getJson(`/rest/api/3/issue/${ini.key}/changelog?maxResults=50`)
        if (cl.values) {
          for (const v of cl.values) {
            for (const item of v.items) {
              if (item.field === 'status') {
                console.log(`  [${v.created}] "${item.fromString}" → "${item.toString}"`)
              }
            }
          }
        }
      } catch(e) { console.log('  Erro changelog:', e.message) }
      
      // Buscar Epics filhos (board 2735)
      try {
        const epics = await getJson(`/rest/agile/1.0/board/2735/issue?maxResults=50&jql=parent=${ini.key}&fields=summary,status`)
        console.log(`  Epics filhos encontrados: ${epics.issues?.length || 0}`)
        for (const ep of epics.issues || []) {
          console.log(`  EPIC FILHO: ${ep.key} - "${ep.fields.summary}" (status: ${ep.fields.status.name}, id: ${ep.fields.status.id})`)
          
          // Changelog do Epic
          try {
            const ecl = await getJson(`/rest/api/3/issue/${ep.key}/changelog?maxResults=50`)
            if (ecl.values) {
              for (const v of ecl.values) {
                for (const item of v.items) {
                  if (item.field === 'status') {
                    console.log(`    [${v.created}] "${item.fromString}" → "${item.toString}"`)
                  }
                }
              }
            }
          } catch(e) { console.log('    Erro changelog:', e.message) }
        }
      } catch(e) { console.log('  Erro epics:', e.message) }
    }
  }
  
  // Se não encontrou, listar os 10 primeiros nomes
  if (!iniciativas.issues?.some(i => nomesBusca.some(n => i.fields.summary.includes(n) || n.includes(i.fields.summary)))) {
    console.log('\n--- Nenhuma encontrada. Primeiras 20 issues: ---')
    for (const ini of iniciativas.issues?.slice(0, 20) || []) {
      console.log(`${ini.key}: "${ini.fields.summary}" (${ini.fields.status.name})`)
    }
  }
}

main().catch(console.error)
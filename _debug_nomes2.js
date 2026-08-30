// Script para buscar nomes das iniciativas via API direta do Jira
const https = require('https');

const EMAIL = 'daniel.anunciacao@claro.com.br';
const TOKEN = 'ATATT3xFfGF0H948UMMf-mW3S74c_oTD1mKwgT13kRN4tFEpbm4NMu3s3ovvQv-o52cY8pW15TfkKxemnxHMaQoKAspNDTF40dTBKO-MOhuCCvurAb90_CCvImBX2efeMzFzSHIhzJB2IMn4lVvBFNgymzZH3fqXtdRxqJFGosxYTW6TuYSlor8=9F0C4DED';
const AUTH = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

function jiraGet(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'clarobr.atlassian.net',
      path: path,
      method: 'GET',
      headers: { 'Authorization': `Basic ${AUTH}`, 'Accept': 'application/json' }
    };
    https.get(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  // Busca todas as iniciativas do board 2734
  let startAt = 0;
  const maxResults = 100;
  let allIssues = [];
  
  while (true) {
    const result = await jiraGet(`/rest/agile/1.0/board/2734/issue?maxResults=${maxResults}&startAt=${startAt}&fields=summary,status`);
    allIssues = allIssues.concat(result.issues || []);
    if (startAt + maxResults >= (result.total || 0)) break;
    startAt += maxResults;
  }
  
  console.log('=== TODAS AS INICIATIVAS (board 2734) ===');
  allIssues.forEach(i => {
    console.log(`${i.key}: "${i.fields.summary}" (status: ${i.fields.status.name})`);
  });
  
  console.log('\n=== BUSCANDO OS 3 NOMES ESPECÍFICOS ===');
  const alvos = ['ARI Jurídico', 'ARI Juridico', 'Identificação de Chamadas SPAM', 'Identificação de Chamadas Spam', 'SPAM', 'Spam', 'Automação para Resposta de Editais', 'Automação de Editais', 'Editais'];
  
  for (const alvo of alvos) {
    const encontradas = allIssues.filter(i => i.fields.summary.toLowerCase().includes(alvo.toLowerCase()));
    if (encontradas.length > 0) {
      encontradas.forEach(e => console.log(`  "${alvo}" → "${e.fields.summary}" (${e.key})`));
    }
  }
}

main().catch(console.error);
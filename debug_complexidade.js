// Script temporário para inspecionar customfield_30358 (was customfield_11664)
const https = require('https');

const BASE_URL = 'clarobr-jsw-tecnologia.atlassian.net';
const EMAIL = 'Daniel.anunciacao@claro.com.br';
const TOKEN = 'ATATT3xFfGF0dIip5cTTvHtESF9bTP2zWywCNDpFdeq53LkxRwUfpHuM-TN1EGG8VUr31bX69TCbJDMgrh3FuN_Hofyjlcbpk6GWdqzt7nRTCC-EJKFDIyZPU6Jy_QV9D9BQlccpuubKrKpd-MU701UVeXjDDKUWX5183aUrLp8MXi3J7mBeJ1Q=B1BEF00E';
const auth = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

function jiraGet(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: BASE_URL,
      path: path,
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
    };
    https.get(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`HTTP ${res.statusCode}: ${data.substring(0,200)}`);
          resolve(null);
        } else {
          resolve(JSON.parse(data));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  // Buscar Epics concluídos (status=10003) do board 2707
  const fields = 'summary,status,customfield_30358';
  let allIssues = [];
  let startAt = 0;
  const maxResults = 50;
  
  while (true) {
    const url = `/rest/agile/1.0/board/2707/issue?fields=${fields}&maxResults=${maxResults}&startAt=${startAt}`;
    console.error(`Fetching startAt=${startAt}...`);
    const data = await jiraGet(url);
    if (!data || !data.issues) break;
    allIssues = allIssues.concat(data.issues);
    if (startAt + maxResults >= data.total) break;
    startAt += maxResults;
  }
  
  console.error(`Total issues: ${allIssues.length}`);
  
  // Filtrar concluídos
  const concluidos = allIssues.filter(i => i.fields.status.id === '10003');
  console.error(`Concluídos: ${concluidos.length}`);
  
  // Agrupar por valor de customfield_30358
  const grupos = {};
  for (const issue of concluidos) {
    const raw = issue.fields.customfield_30358;
    const tipo = typeof raw;
    const key = tipo === 'object' ? `[obj] ${JSON.stringify(raw)}` : `[${tipo}] ${raw}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(issue.key);
  }
  
  console.log(JSON.stringify(grupos, null, 2));
}

main().catch(console.error);
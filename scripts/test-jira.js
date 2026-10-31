// Testa as credenciais do Jira (GET /rest/api/3/myself). Lê tudo do ambiente, nunca do código:
//   JIRA_BASE_URL=… JIRA_EMAIL=… JIRA_API_TOKEN=… node scripts/test-jira.js
const https = require('https');

const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;
if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('Defina JIRA_BASE_URL, JIRA_EMAIL e JIRA_API_TOKEN (veja .env.example).');
  process.exit(1);
}
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const req = https.get(`${JIRA_BASE_URL}/rest/api/3/myself`, {
  headers: { 'Authorization': `Basic ${auth}` }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Resposta:', d.slice(0, 300));
  });
});
req.on('error', e => console.log('ERRO:', e.message));
req.end();

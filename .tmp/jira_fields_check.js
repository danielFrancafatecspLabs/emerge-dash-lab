const fs = require('fs');
const https = require('https');
function parseEnv(path) {
  const raw = fs.readFileSync(path, 'utf8');
  const lines = raw.split(/\r?\n/);
  const env = {};
  for (const l of lines) {
    const m = l.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}
const env = parseEnv('.env.local');
const base = env.JIRA_BASE_URL;
const email = env.JIRA_EMAIL;
const token = env.JIRA_API_TOKEN;
if (!base || !email || !token) { console.error('Missing JIRA env'); process.exit(1)}
const credentials = Buffer.from(`${email}:${token}`).toString('base64');
const url = new URL('/rest/api/3/field', base);
const options = {
  method: 'GET',
  headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' }
};
const req = https.request(url, options, (res) => {
  console.log('Status', res.statusCode);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', ()=>{
    try{
      const j = JSON.parse(body);
      if (Array.isArray(j)) {
        for (const f of j) console.log(`${f.id}\t${f.name}`);
      } else {
        console.log('Unexpected response', Object.keys(j));
        console.log(body.slice(0,2000));
      }
    }catch(e){ console.error('Parse',e); console.log(body.slice(0,2000))}
  })
});
req.on('error', e=>console.error('Request error', e));
req.end();

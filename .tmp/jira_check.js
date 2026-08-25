const fs = require('fs');
const http = require('https');

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
if (!base || !email || !token) {
  console.error('Missing JIRA_BASE_URL, JIRA_EMAIL or JIRA_API_TOKEN in .env.local');
  process.exit(1);
}

const credentials = Buffer.from(`${email}:${token}`).toString('base64');
const url = new URL('/rest/agile/1.0/board', base);
url.searchParams.set('projectKeyOrId', 'GL');

const options = {
  method: 'GET',
  headers: {
    Authorization: `Basic ${credentials}`,
    Accept: 'application/json'
  }
};

const req = http.request(url, options, (res) => {
  console.log('Status', res.statusCode);
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    try {
      const j = JSON.parse(body);
      console.log('total', j.total, 'maxResults', j.maxResults);
      if (Array.isArray(j.values)) {
        for (const b of j.values) {
          console.log('board', b.id, b.name, b.type, b.location?.project?.key);
        }
      } else {
        console.log('No boards array in response', Object.keys(j));
        console.log(body);
      }
    } catch (e) {
      console.error('Parse error', e);
      console.log(body.slice(0,2000));
    }
  });
});
req.on('error', (e) => console.error('Request error', e));
req.end();

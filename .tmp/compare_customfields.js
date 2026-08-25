const fs = require('fs');
const path = require('path');

function readEnv(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const out = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      out[m[1]] = m[2];
    }
  }
  return out;
}

function collectCustomfields(dir) {
  const re = /customfield_(\d+)/g;
  const ignore = new Set(['.git','node_modules','.next','.venv','.tmp']);
  const found = new Set();

  function walk(d) {
    for (const name of fs.readdirSync(d)) {
      if (ignore.has(name)) continue;
      const full = path.join(d, name);
      let st;
      try { st = fs.statSync(full); } catch(e) { continue; }
      if (st.isDirectory()) walk(full);
      else if (st.isFile()) {
        try {
          const txt = fs.readFileSync(full, 'utf8');
          let m;
          while ((m = re.exec(txt))) found.add('customfield_'+m[1]);
        } catch(e) { }
      }
    }
  }

  walk(dir);
  return Array.from(found).sort();
}

const https = require('https');
function fetchJiraFields(baseUrl, auth) {
  const url = new URL(baseUrl.replace(/\/$/, '') + '/rest/api/3/field');
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      port: url.port || 443,
      method: 'GET',
      headers: { Authorization: 'Basic ' + auth }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
        } else {
          reject(new Error('Failed to fetch fields: '+res.statusCode+' '+res.statusMessage+'\n'+data));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found in repo root'); process.exit(2);
  }
  const env = readEnv(envPath);
  const base = env.JIRA_BASE_URL;
  const email = env.JIRA_EMAIL;
  const token = env.JIRA_API_TOKEN;
  if (!base || !email || !token) {
    console.error('Missing JIRA_BASE_URL, JIRA_EMAIL or JIRA_API_TOKEN in .env.local'); process.exit(2);
  }
  const auth = Buffer.from(email+':'+token).toString('base64');

  console.log('Collecting customfield_ usages in repo...');
  const repoCF = collectCustomfields(process.cwd());
  console.log('Found', repoCF.length, 'unique customfield_ ids in code.');

  console.log('Querying Jira to list instance fields...');
  const fields = await fetchJiraFields(base, auth);
  const map = {};
  for (const f of fields) {
    if (f.id && f.id.startsWith('customfield_')) map[f.id] = f.name || f.schema || f;
  }

  const report = repoCF.map(id => ({ id, name: map[id] || null }));
  const extras = Object.keys(map).filter(k => !repoCF.includes(k)).sort();

  const out = { repoCustomfields: repoCF, report, instanceCustomfieldsCount: Object.keys(map).length, extras };
  if (!fs.existsSync('.tmp')) fs.mkdirSync('.tmp');
  fs.writeFileSync(path.join('.tmp','customfield_report.json'), JSON.stringify(out, null, 2));
  console.log('Wrote .tmp/customfield_report.json');
  console.log('Summary:');
  for (const r of report) console.log(r.id, '->', r.name || '(not found in instance)');
}

main().catch(err => { console.error(err); process.exit(1); });

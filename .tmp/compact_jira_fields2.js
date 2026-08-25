const fs = require('fs');
const srcs = ['.tmp/jira_fields_output.txt', '.tmp/jira_fields_api.json', '.tmp/jira_fields_ps.json', '.tmp/jira_fields_list.txt', 'jira_fields_output.txt', '.tmp/jira_fields_output.txt'.replace('.tmp/','.tmp/')];
let src = null;
for (const p of srcs) { if (fs.existsSync(p)) { src = p; break; } }
if (!src) { console.error('No source found. Available files:', fs.readdirSync('.tmp').join(',')); process.exit(2); }
console.error('Using source:', src);
const txt = fs.readFileSync(src,'utf8');
let pairs = [];
try{
  const j = JSON.parse(txt);
  if (Array.isArray(j)) {
    pairs = j.map(f=>({id:f.id||f.key||'', name:f.name||f.value||''})).filter(x=>x.id);
  }
} catch(e){
  const re = /"id"\s*:\s*"([^"\\]+)"[^}]{0,500}?"name"\s*:\s*"([^"\\]+)"/gs;
  let m;
  while((m=re.exec(txt))){ pairs.push({id:m[1], name:m[2]}); }
  if(pairs.length===0){
    const re2 = /"name"\s*:\s*"([^"\\]+)"[^}]{0,500}?"id"\s*:\s*"([^"\\]+)"/gs;
    while((m=re2.exec(txt))){ pairs.push({id:m[2], name:m[1]}); }
  }
  if(pairs.length===0){
    const lines = txt.split(/\r?\n/);
    for(const l of lines){ const t = l.trim(); if(!t) continue; const parts = t.split(/\t+/); if(parts.length>=2 && /^(customfield_|field_)?\w+/.test(parts[0])){ pairs.push({id:parts[0].trim(), name:parts.slice(1).join('\t').trim()}); } }
  }
}
const map = new Map();
for(const p of pairs){ if(!map.has(p.id)) map.set(p.id,p.name); }
const out = Array.from(map.entries()).map(([id,name])=>`${id}\t${name}`).join('\n')+"\n";
fs.writeFileSync('.tmp/jira_fields_compact2.txt',out,'utf8');
console.error('WROTE .tmp/jira_fields_compact2.txt with', map.size, 'entries');
console.log(out.split(/\r?\n/).slice(0,200).join('\n'));

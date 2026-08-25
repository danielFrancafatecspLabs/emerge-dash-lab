const fs = require('fs');
const paths = [
  '.tmp/jira_fields_output.txt',
  '.tmp/jira_fields_api.json',
  '.tmp/jira_fields_ps.json',
  '.tmp/jira_fields_list.txt',
  '.tmp/jira_fields_list.txt'
];
let src = null;
for (const p of paths) { if (fs.existsSync(p)) { src = p; break; } }
if (!src) { console.error('No source file found in .tmp/ for jira fields.'); process.exit(2); }
const txt = fs.readFileSync(src,'utf8');
let pairs = [];
try{
  const j = JSON.parse(txt);
  if (Array.isArray(j)) {
    pairs = j.map(f=>({id:f.id||f.key||'', name:f.name||f.value||''})).filter(x=>x.id);
  }
} catch(e){
  // fallback: regex to capture id & name inside objects
  const re = /"id"\s*:\s*"([^"\\]+)"[^}]{0,500}?"name"\s*:\s*"([^"\\]+)"/gs;
  let m;
  while((m=re.exec(txt))){ pairs.push({id:m[1], name:m[2]}); }
  // alternate order (name before id)
  if(pairs.length===0){
    const re2 = /"name"\s*:\s*"([^"\\]+)"[^}]{0,500}?"id"\s*:\s*"([^"\\]+)"/gs;
    while((m=re2.exec(txt))){ pairs.push({id:m[2], name:m[1]}); }
  }
  // Try line-per-field format like: id\tname
  if(pairs.length===0){
    const lines = txt.split(/\r?\n/);
    for(const l of lines){ const t = l.trim(); if(!t) continue; const parts = t.split(/\t+/); if(parts.length>=2 && /^(customfield_|field_)?\w+/.test(parts[0])){ pairs.push({id:parts[0].trim(), name:parts.slice(1).join('\t').trim()}); } }
  }
}
// dedupe by id
const map = new Map();
for(const p of pairs){ if(!map.has(p.id)) map.set(p.id,p.name); }
const out = Array.from(map.entries()).map(([id,name])=>`${id}\t${name}`).join('\n')+"\n";
fs.writeFileSync('.tmp/jira_fields_compact.txt',out,'utf8');
console.log('WROTE .tmp/jira_fields_compact.txt with', map.size, 'entries');
// print first 200 lines
const preview = out.split(/\r?\n/).slice(0,200).join('\n');
console.log(preview);

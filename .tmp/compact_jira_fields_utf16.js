const fs = require('fs');
const src = '.tmp/jira_fields_output.txt';
if(!fs.existsSync(src)){ console.error('source missing:', src); process.exit(2); }
const txt = fs.readFileSync(src, 'utf16le');
let pairs = [];
const re = /\b(id|key)\b\s*[:=]\s*"?(customfield_\d+|[A-Za-z0-9_\-:\.]+)"?[^\r\n\{\}]{0,300}?\bname\b\s*[:=]\s*"([^"]+)"/gmi;
let m;
while((m=re.exec(txt))){ pairs.push({id:m[2], name:m[3]}); }
// fallback: look for "id":"customfield_123" ... "name":"Foo"
if(pairs.length===0){
  const re2 = /"id"\s*:\s*"(customfield_\d+)"[\s\S]{0,300}?"name"\s*:\s*"([^"]+)"/gmi;
  while((m=re2.exec(txt))){ pairs.push({id:m[1], name:m[2]}); }
}
// fallback: lines like customfield_123\tName
if(pairs.length===0){
  const lines = txt.split(/\r?\n/);
  for(const l of lines){ const parts = l.trim().split(/\t+/); if(parts.length>=2 && /^customfield_\d+$/.test(parts[0])) pairs.push({id:parts[0], name:parts.slice(1).join('\t')}); }
}
const map = new Map();
for(const p of pairs){ if(!map.has(p.id)) map.set(p.id,p.name); }
const out = Array.from(map.entries()).map(([id,name])=>`${id}\t${name}`).join('\n')+"\n";
fs.writeFileSync('.tmp/jira_fields_compact_utf16.txt', out, 'utf8');
console.error('WROTE .tmp/jira_fields_compact_utf16.txt with', map.size, 'entries');
console.log(out.split(/\r?\n/).slice(0,200).join('\n'));

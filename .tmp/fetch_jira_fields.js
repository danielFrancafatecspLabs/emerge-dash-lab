const fs = require('fs');
(async ()=>{
  try{
    const env = fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(Boolean).reduce((acc,line)=>{const m=line.match(/^(\w+)=(.*)$/); if(m) acc[m[1]]=m[2]; return acc},{});
    if(!env.JIRA_BASE_URL||!env.JIRA_EMAIL||!env.JIRA_API_TOKEN) throw new Error('Missing JIRA env vars');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const url = `${env.JIRA_BASE_URL.replace(/\/+$/,'')}/rest/api/3/field`;
    const auth = Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`).toString('base64');
    const res = await fetch(url,{headers:{Authorization:`Basic ${auth}`,Accept:'application/json'}});
    if(!res.ok) { console.error('HTTP',res.status); const t=await res.text(); console.error(t); process.exit(2);}    
    const json = await res.json();
    json.forEach(f=>console.log(`${f.id}\t${f.name}\t${f.schema?JSON.stringify(f.schema):''}`));
  }catch(e){console.error(e); process.exit(1)}
})();

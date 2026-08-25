const fs = require('fs');
const path = require('path');

const MAPPING = {
  'customfield_11662': 'customfield_30394',
  'customfield_11663': 'customfield_30340',
  'customfield_11664': 'customfield_30358',
  'customfield_16911': 'customfield_30357',
  'customfield_16400': 'customfield_11987',
  'customfield_13571': 'customfield_30402',
  'customfield_11668': 'customfield_30453',
  'customfield_11378': 'customfield_30445',
  'customfield_15919': 'customfield_30110',
  'customfield_10904': 'customfield_21499'
};

const IGNORE = new Set(['.git','node_modules','.next','.venv','.tmp']);
const WORKDIR = process.cwd();
const changed = [];

function shouldProcess(file){
  const ext = path.extname(file).toLowerCase();
  return ['.js','.ts','.tsx','.jsx','.json','.md','.txt','.mjs'].includes(ext);
}

function walk(dir){
  for(const name of fs.readdirSync(dir)){
    if(IGNORE.has(name)) continue;
    const full = path.join(dir,name);
    let st;
    try{ st = fs.statSync(full); }catch(e){ continue; }
    if(st.isDirectory()) walk(full);
    else if(st.isFile() && shouldProcess(full)) processFile(full);
  }
}

function processFile(file){
  let txt = fs.readFileSync(file,'utf8');
  let orig = txt;
  let totalRepl = 0;
  for(const [oldId,newId] of Object.entries(MAPPING)){
    const re = new RegExp(oldId,'g');
    const m = (txt.match(re)||[]).length;
    if(m>0){ txt = txt.replace(re,newId); totalRepl += m; }
  }
  if(totalRepl>0){
    const backupDir = path.join('.tmp','backups');
    if(!fs.existsSync(backupDir)) fs.mkdirSync(backupDir,{recursive:true});
    const rel = path.relative(WORKDIR,file).replace(/[\\/]/g,'__');
    fs.writeFileSync(path.join(backupDir,rel+'.bak'), orig, 'utf8');
    fs.writeFileSync(file, txt, 'utf8');
    changed.push({file: path.relative(WORKDIR,file), replacements: totalRepl});
    console.log('Updated', file, 'replacements=', totalRepl);
  }
}

function main(){
  console.log('Starting replacements...');
  walk(WORKDIR);
  fs.writeFileSync('.tmp/replacements_result.json', JSON.stringify({changed, mapping: MAPPING}, null, 2), 'utf8');
  console.log('Done. Files changed:', changed.length);
}

main();

const fs = require('fs');
const path = require('path');
const root = process.cwd();
const ignoreDirs = ['.next','node_modules','.git','.venv','.tmp'];
const re = /customfield_(\d+)/g;
let set = new Set();
function walk(dir){
  const entries = fs.readdirSync(dir,{withFileTypes:true});
  for(const e of entries){
    const full = path.join(dir,e.name);
    if(e.isDirectory()){
      const name = e.name;
      if(ignoreDirs.includes(name)) continue;
      walk(full);
    } else if(e.isFile()){
      try{
        const txt = fs.readFileSync(full,'utf8');
        let m;
        while((m = re.exec(txt))){ set.add('customfield_'+m[1]); }
      }catch(e){}
    }
  }
}
walk(root);
const out = Array.from(set).sort().join('\n')+"\n";
fs.writeFileSync('.tmp/customfields_used.txt',out,'utf8');
console.log(out);

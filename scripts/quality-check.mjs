import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const required=[
  'index.html','operations.html','pin.js','sw-v20.js',
  'src/core/config-v25.js','src/core/api-v25.js','src/core/auth-v25.js','src/core/features-v25.js',
  'styles/theme-v25.css','logo.png','manifest.json'
];
let failed=false;
const fail=msg=>{failed=true;console.error(`✗ ${msg}`)};
const ok=msg=>console.log(`✓ ${msg}`);

for(const file of required){
  if(!fs.existsSync(path.join(root,file)))fail(`Missing required file: ${file}`);
}
if(!failed)ok('Required workshop core files are present');

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(entry.name==='.git'||entry.name==='node_modules')return[];
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

const files=walk(root);
const jsFiles=files.filter(f=>f.endsWith('.js')||f.endsWith('.mjs'));
for(const file of jsFiles){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0)fail(`JavaScript syntax error in ${path.relative(root,file)}\n${result.stderr}`);
}
if(!failed)ok(`JavaScript syntax checked (${jsFiles.length} files)`);

const htmlFiles=files.filter(f=>f.endsWith('.html'));
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  const refs=[...html.matchAll(/(?:src|href)=["']([^"'#?]+)(?:\?[^"']*)?["']/g)].map(m=>m[1]);
  for(const ref of refs){
    if(/^(?:https?:|data:|mailto:|tel:)/i.test(ref)||ref.startsWith('/'))continue;
    const target=path.resolve(path.dirname(file),ref);
    if(!fs.existsSync(target))fail(`${path.relative(root,file)} references missing asset ${ref}`);
  }
}
if(!failed)ok(`HTML asset references checked (${htmlFiles.length} pages)`);

const textFiles=files.filter(f=>/\.(?:js|mjs|html|css|md|json|yml|yaml)$/i.test(f));
for(const file of textFiles){
  const text=fs.readFileSync(file,'utf8');
  if(/sb_secret_[A-Za-z0-9_-]+/.test(text))fail(`Potential Supabase secret found in ${path.relative(root,file)}`);
  if(/service[_-]?role.{0,20}(?:eyJ|sb_secret_)/i.test(text))fail(`Potential service-role credential found in ${path.relative(root,file)}`);
}
if(!failed)ok('No obvious private Supabase credentials found in repository text');

if(failed){console.error('\nWorkshop quality checks failed.');process.exit(1)}
console.log('\nWorkshop quality checks passed.');

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root=process.cwd();
const ignore=execFileSync('git',['check-ignore','.env.local'],{encoding:'utf8'}).trim();
if(ignore!=='.env.local')throw new Error('Local environment file is not ignored');
const privateValues=fs.existsSync('.env.local')?fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('NEXT_PUBLIC_')).map(l=>({name:l.slice(0,l.indexOf('=')),value:l.slice(l.indexOf('=')+1).replace(/^"|"$/g,'')})).filter(e=>e.value.length>=16):[];
for(const item of [...privateValues]){if(/^postgres(?:ql)?:\/\//.test(item.value)){const password=decodeURIComponent(new URL(item.value).password);if(password.length>=8)privateValues.push({name:`${item.name} password`,value:password});}}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const tracked=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const targets=[...new Set(tracked.map(f=>path.join(root,f)))].filter(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(fs.existsSync('.next/static'))targets.push(...walk(path.join(root,'.next/static')).filter(f=>/\.(js|map)$/.test(f)));
for(const file of targets){const contents=fs.readFileSync(file,'utf8');for(const secret of privateValues)if(contents.includes(secret.value))throw new Error(`Private ${secret.name} appears in ${path.relative(root,file)}`);}
console.log('PASS: .env.local ignored; private credential values and database password absent from repository files and browser assets.');

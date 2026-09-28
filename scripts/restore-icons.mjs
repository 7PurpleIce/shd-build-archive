import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {resolve,dirname,sep} from 'node:path';
// Lossless catalogue icon bundle, split into text files for repository transport.
const manifest=JSON.parse(readFileSync('assets/icons-manifest.json','utf8'));
const encoded=readdirSync('assets').filter(p=>/^icons-\d+\.b64$/.test(p)).sort().map(p=>readFileSync(`assets/${p}`,'utf8')).join('');
const bytes=Buffer.from(encoded,'base64');
if(createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('Icon bundle checksum mismatch');
const files=JSON.parse(gunzipSync(bytes).toString('utf8'));
if(Object.keys(files).length!==manifest.files)throw Error('Icon bundle count mismatch');
const root=resolve('public');
for(const[name,data]of Object.entries(files)){
 const target=resolve(root,name);
 if(!target.startsWith(root+sep)||!name.startsWith('game-icons/'))throw Error('Invalid icon path');
 mkdirSync(dirname(target),{recursive:true});writeFileSync(target,Buffer.from(data,'base64'));
}
console.log(`Restored ${manifest.files} catalogue icons.`);

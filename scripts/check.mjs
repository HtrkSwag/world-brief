import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
const html=await fs.readFile(path.join(dist,'index.html'),'utf8');
assert.ok(html.includes('观世界'));
for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(ref.startsWith('http'))throw Error('Unexpected external runtime dependency: '+ref);assert.ok(!ref.startsWith('/'),'Absolute asset path: '+ref);await fs.access(path.join(dist,ref));}
const data=JSON.parse(await fs.readFile(path.join(dist,'news.json'),'utf8'));
assert.ok(data.articles.length>0);assert.ok(data.sources.length>0);
assert.equal(new Set(data.articles.map(a=>a.id)).size,data.articles.length);
for(const a of data.articles){assert.ok(/^https?:\/\//.test(a.url));assert.ok(Number.isFinite(Date.parse(a.published)));}
for(const f of await fs.readdir(path.join(dist,'assets'))){if(!f.endsWith('.js'))continue;const content=await fs.readFile(path.join(dist,'assets',f),'utf8');for(const forbidden of ['/api/news','cloudflare:workers','OAI-Sites-Authorization','siwc_bypass_bearer_token'])assert.ok(!content.includes(forbidden),'Unexpected backend dependency: '+forbidden);}
console.log('Static validation passed: relative assets, independent bundle, valid news snapshot ('+data.articles.length+' articles).');

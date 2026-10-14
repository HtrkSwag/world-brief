import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {sources,collectFeeds} from './news.mjs';
const target=fileURLToPath(new URL('../public/news.json',import.meta.url));
let previous={articles:[]};
try{previous=JSON.parse(await fs.readFile(target,'utf8'));if(!Array.isArray(previous.articles))throw Error('news.json 缺少 articles 数组');}catch(e){if(e.code!=='ENOENT')throw e;}
const result=await collectFeeds();
if(!result.articles.length)throw Error('全部来源读取失败；现有快照未改变，请稍后重试。');
const records=new Map();
for(const a of [...previous.articles,...result.articles])records.set(a.id,a);
const byTitle=new Map();
for(const a of [...records.values()].sort((a,b)=>b.collected.localeCompare(a.collected))){const title=a.title.toLowerCase().replace(/[\s\p{P}]/gu,'');if(!byTitle.has(title))byTitle.set(title,a);}
const articles=[...byTitle.values()].sort((a,b)=>b.published.localeCompare(a.published));
const failed=result.health.filter(s=>!s.ok).map(s=>s.source);
const data={articles,updated:result.articles.map(a=>a.collected).sort().at(-1),sources:sources.map(({name,home,language})=>({name,home,language})),health:result.health,warning:failed.length?'部分来源暂未更新，已保留历史内容：'+failed.join('、'):null};
await fs.writeFile(target+'.tmp',JSON.stringify(data,null,2)+'\n');
await fs.rename(target+'.tmp',target);
console.log(JSON.stringify({collected:result.articles.length,total:articles.length,updated:data.updated,health:data.health}));

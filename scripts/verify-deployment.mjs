import fs from 'node:fs/promises';
const site=process.env.TCB_SITE_URL;
if(!site)throw Error('TCB_SITE_URL 未设置');
const expected=JSON.parse(await fs.readFile(new URL('../dist/news.json',import.meta.url),'utf8'));
const url=new URL('news.json',site);
let lastError;
const deadline=Date.now()+180000;
console.log(JSON.stringify({site:url.href,expectedUpdated:expected.updated,expectedCount:expected.articles.length}));
while(Date.now()<deadline){
 try{
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(Math.max(1,Math.min(15000,deadline-Date.now()))),headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('HTTP '+response.status);
  const remote=await response.json();
  if(remote.updated!==expected.updated||remote.articles?.length!==expected.articles.length)throw Error('线上快照尚未匹配：'+JSON.stringify({actualUpdated:remote.updated,actualCount:remote.articles?.length}));
  console.log(JSON.stringify({verified:true,updated:remote.updated,count:remote.articles.length}));
  process.exit(0);
 }catch(error){lastError=error;}
 console.log(lastError.message);
 const remaining=deadline-Date.now();
 if(remaining>0)await new Promise(resolve=>setTimeout(resolve,Math.min(5000,remaining)));
}
throw lastError;


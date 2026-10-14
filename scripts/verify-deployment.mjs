import fs from 'node:fs/promises';
const site=process.env.TCB_SITE_URL;
if(!site)throw Error('TCB_SITE_URL 未设置');
const expected=JSON.parse(await fs.readFile(new URL('../dist/news.json',import.meta.url),'utf8'));
const url=new URL('news.json',site);
let lastError;
for(let attempt=0;attempt<6;attempt++){
 try{
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('HTTP '+response.status);
  const remote=await response.json();
  if(remote.updated!==expected.updated||remote.articles?.length!==expected.articles.length)throw Error('线上快照与本次采集结果不一致，可能尚未生效。');
  console.log(JSON.stringify({verified:true,updated:remote.updated,count:remote.articles.length}));
  process.exit(0);
 }catch(error){lastError=error;}
 if(attempt<5)await new Promise(resolve=>setTimeout(resolve,5000));
}
throw lastError;

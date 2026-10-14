import assert from 'node:assert/strict';
for(const prefix of ['http://127.0.0.1:8080/','http://127.0.0.1:8080/nested/']){
 const r=await fetch(prefix);assert.equal(r.status,200);
 const html=await r.text();
 for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  const asset=await fetch(new URL(ref,prefix));assert.equal(asset.status,200,ref);
 }
 const news=await(await fetch(new URL('news.json',prefix))).json();
 assert.ok(news.articles.length>0);
 console.log('Root/subdirectory HTTP check passed: '+prefix);
}
assert.equal((await fetch('http://127.0.0.1:8080/api/news')).status,404);

export type Article = { id:string; title:string; summary:string; url:string; source:string; category:string; published:string; day:string; collected:string; score:number; topic:string; language:string };
export const sources = [
 { name:'联合国新闻', url:'https://news.un.org/feed/subscribe/zh/news/all/rss.xml', home:'https://news.un.org/zh/', language:'中文', category:'国际' },
 { name:'德国之声', url:'https://rss.dw.com/rdf/rss-chi-all', home:'https://www.dw.com/zh/', language:'中文', category:'国际' },
 { name:'BBC中文', url:'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml', home:'https://www.bbc.com/zhongwen/simp', language:'中文', category:'国际' },
 { name:'美联储', url:'https://www.federalreserve.gov/feeds/press_all.xml', home:'https://www.federalreserve.gov/newsevents.htm', language:'英文', category:'财经' },
 { name:'欧洲央行', url:'https://www.ecb.europa.eu/rss/press.html', home:'https://www.ecb.europa.eu/', language:'英文', category:'财经' },
 { name:'NASA', url:'https://www.nasa.gov/news-release/feed/', home:'https://www.nasa.gov/news/', language:'英文', category:'科技' },
];
export function dayOf(date:string|Date) { return new Date(date).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'}); }
export function clean(s:string) { return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{ const c=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return c>0&&c<=0x10ffff?String.fromCodePoint(c):''; }).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim(); }
function tag(xml:string,name:string) { return xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]??''; }
const topics:[string,RegExp][] = [['货币与利率',/利率|降息|加息|货币政策|monetary|interest rate|fomc|inflation|通胀/i],['贸易与产业',/贸易|关税|出口|进口|tariff|trade|供应链/i],['中东局势',/加沙|以色列|黎巴嫩|巴勒斯坦|伊朗|gaza|israel|iran|lebanon/i],['俄乌局势',/乌克兰|俄罗斯|ukraine|russia/i],['气候与能源',/气候|能源|排放|气温|climate|energy/i],['科技与太空',/人工智能|科技|太空|宇航|nasa|space|artemis|ai\b/i],['公共卫生',/卫生|疫情|疾病|疫苗|health|vaccine/i],['政策与治理',/改革|立法|法案|法规|选举|regulation|reform|election/i]];
export function parseFeed(xml:string,source:typeof sources[number],now=new Date()):Article[] {
 return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,35).flatMap(m=>{
  const item=m[1],title=clean(tag(item,'title')),rawUrl=clean(tag(item,'link'))||clean(tag(item,'guid')); let url:URL;
  try { url=new URL(rawUrl);if(url.protocol!=='https:'&&url.protocol!=='http:')return []; }catch{return [];}
  const date=new Date(clean(tag(item,'pubDate')||tag(item,'dc:date')));if(!title||!Number.isFinite(date.getTime())||date.getTime()>now.getTime()+86400000)return [];
  const summary=clean(tag(item,'description')||tag(item,'content:encoded')).slice(0,900),hay=title+' '+summary;
  let category=source.category;
  if(/改革|法案|新规|法规|立法|regulation|reform|rulemaking/i.test(hay)) category='政策';
  else if(/经济|金融|通胀|利率|贸易|就业|央行|economic|inflation|monetary|interest rate|tariff/i.test(hay))category='财经';
  else if(/人工智能|科研|太空|宇航|nasa|space|artemis/i.test(hay))category='科技';
  else if(/气候|环境|能源|climate|energy/i.test(hay))category='环境';
  else if(/卫生|疫情|疫苗|粮食|教育|health|hunger/i.test(hay))category='社会';
  const topic=topics.find(([,re])=>re.test(hay))?.[0]??'全球动态';
  const score=(source.language==='中文'?20:0)+(/利率|战争|冲突|改革|关税|气候|停火|monetary|fomc|interest rate|ceasefire/i.test(hay)?20:0)+Math.max(0,20-Math.floor((now.getTime()-date.getTime())/86400000));
  return [{id:url.href,title,summary,url:url.href,source:source.name,category,published:date.toISOString(),day:dayOf(date),collected:now.toISOString(),score,topic,language:source.language}];
 });
}
export async function collectFeeds() {
 const results=await Promise.all(sources.map(async source=>{try {
  const res=await fetch(source.url,{signal:AbortSignal.timeout(9000),headers:{'User-Agent':'WorldBrief/1.0 (public RSS reader)','Accept':'application/rss+xml, application/xml, text/xml'}});
  if(!res.ok)throw Error('HTTP '+res.status);const xml=await res.text();if(xml.length>2500000)throw Error('Feed too large');
  const articles=parseFeed(xml,source);if(!articles.length)throw Error('No valid entries');
  return {source:source.name,ok:true,articles};
 }catch(e){console.error('Feed unavailable:',source.name,String(e));return {source:source.name,ok:false,articles:[] as Article[]};}}));
 const unique=new Map<string,Article>(); for(const r of results)for(const a of r.articles){const key=a.title.toLowerCase().replace(/[\s\p{P}]/gu,'');if(!unique.has(key))unique.set(key,a);}
 return { articles:[...unique.values()], health:results.map(({source,ok})=>({source,ok})) };
}

#!/usr/bin/env node
// Independent read-only Japanese SEO audit: never modifies content, queue or code.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {decorateTaxonomy} from './taxonomy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const site=json('site/data.json'),cfg=json('data/factory-config.json'),state=json('data/factory-state.json');
const taxonomy=json('site/taxonomy.json'),plan=json('data/editorial-plan.json').articles;
const mode=process.argv.includes('--mode=full')?'full':'offline';
const reportArg=process.argv.find(x=>x.startsWith('--report='));
const pubs=state.published_ids.map(id=>{const row=plan.find(x=>x.id===id),a=json('content/articles/'+id+'.json');return {...row,title:a.title,intro:a.intro}});
const pages=site.pages.map(x=>({...x}));decorateTaxonomy(taxonomy,pages,pubs);pages.push(...pubs);
const records=[],routes=new Set(pages.map(p=>p.url));
const add=(level,rule,message,url='')=>records.push({level,rule,message,url});
if(site.site.base!=='https://ja.rentbikehanoi.com/')add('FAIL','domain','Expected exact Japanese canonical domain');
if(fs.existsSync(path.join(root,'CNAME'))&&read('CNAME').trim()!=='ja.rentbikehanoi.com')add('FAIL','CNAME','Incorrect Japanese domain configuration');
if(taxonomy.parents.length!==5||taxonomy.parents.reduce((n,p)=>n+p.children.length,0)!==20||taxonomy.parents.reduce((n,p)=>n+p.planned_capacity,0)!==200)add('FAIL','taxonomy','Expected 5 parents 20 children 200 planned capacity');
const seenTitles=new Map();
for(const page of pages){
 const file=page.url==='/'?'index.html':page.url.slice(1)+'index.html',filename=path.join(root,file);
 if(!fs.existsSync(filename)){add('FAIL','missing-html',file,page.url);continue}
 const html=read(file),expected=cfg.domain+page.url;
 if(!html.includes('href="'+expected+'"'))add('FAIL','canonical','Canonical missing '+file,page.url);
 if(!html.includes('<html lang="ja">'))add('FAIL','language','Japanese HTML lang missing',page.url);
 if(!/<meta name="robots" content="index,follow">/.test(html))add('FAIL','indexability','robots meta missing',page.url);
 if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)add('FAIL','h1','Wrong H1 count',page.url);
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
 if(!title||title.length<8)add('FAIL','title','Title missing or too short',page.url);
 if(seenTitles.has(title))add('FAIL','duplicate-title','Title also on '+seenTitles.get(title),page.url);
 seenTitles.set(title,page.url);
 const description=html.match(/<meta name="description" content="([^"]+)">/)?.[1];
 if(!description||description.length<35)add('FAIL','description','Missing/short description',page.url);
 const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 if(!blocks.length)add('FAIL','schema','JSON-LD missing',page.url);
 else for(const block of blocks)try{JSON.parse(block[1])}catch{add('FAIL','schema-json','JSON-LD parse failure',page.url)}
 if(!html.includes('"@type":"LocalBusiness"'))add('FAIL','business','LocalBusiness schema missing',page.url);
 if(!html.includes('name":"Cho Thuê Xe Máy Nguyễn Tú"'))add('FAIL','nap','Wrong business name',page.url);
 if((html.match(/class="nav-group"/g)||[]).length!==15)add('FAIL','nav-sync','Header/mobile/footer 5 categories not consistent',page.url);
 for(const m of html.matchAll(/<a\b[^>]*href="(\/[^"]+)"/g)){
  const href=m[1],dest=href.split('#')[0].split('?')[0];
  if(!routes.has(dest))add('FAIL','broken-internal','Unpublished route '+href,page.url);
 }
 if(page.type==='article'&&!html.includes('"@type":"Article"'))add('FAIL','article-schema','Article structured data missing',page.url);
}
const locations=[...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
if(locations.length!==routes.size||locations.some(x=>!routes.has(x.replace(cfg.domain,''))))add('FAIL','sitemap','Sitemap URL inventory mismatch');
if(!read('robots.txt').includes('Sitemap: '+cfg.domain+'/sitemap.xml'))add('FAIL','robots','Robots sitemap missing');
const collisions=[];
for(let i=0;i<plan.length;i++)for(let j=i+1;j<plan.length;j++){
 const a=plan[i],b=plan[j];if(a.category_id===b.category_id&&a.primary_keyword===b.primary_keyword)collisions.push([a.id,b.id]);
}
if(collisions.length)add('WARN','intent-map','Identical planned keywords: '+JSON.stringify(collisions));
async function live(){
 const sample=pages.slice(0,10);
 for(const p of sample){
  const target=cfg.domain+p.url;
  try{const ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),10000);
   const res=await fetch(target,{method:'GET',signal:ac.signal,redirect:'follow'});
   clearTimeout(timeout);
   if(res.status!==200)add('FAIL','live-status','HTTP '+res.status,p.url);
  }catch(e){add('WARN','live-unavailable',String(e).slice(0,100),p.url)}
 }
}
if(mode==='full')await live();
const summary={fail:records.filter(r=>r.level==='FAIL').length,warn:records.filter(r=>r.level==='WARN').length,pages:pages.length,published:pubs.length,planned:plan.length,content_target:cfg.target_articles,mode};
const report={timestamp:new Date().toISOString(),domain:cfg.domain,summary,verdict:summary.fail?'FAIL':'PASS',records,gsc:"NOT CONNECTED / NOT VERIFIED"};
if(reportArg){const file=reportArg.slice('--report='.length);fs.writeFileSync(path.join(root,file),JSON.stringify(report,null,2)+'\n')}
console.log('JAPAN_SEO_AUDIT '+JSON.stringify(report));
if(summary.fail)process.exit(1);

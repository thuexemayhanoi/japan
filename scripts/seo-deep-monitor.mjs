#!/usr/bin/env node
// Read-only SEO / GEO monitoring of published Japanese pages.
// No Google-indexing or CWV claims without external measurements.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {decorateTaxonomy,validateTaxonomy} from './taxonomy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const json=x=>JSON.parse(read(x));
const site=json('site/data.json'),tax=json('site/taxonomy.json'),plan=json('data/editorial-plan.json').articles;
const config=json('data/factory-config.json'),state=json('data/factory-state.json'),queue=json('data/writer-queue.json');
const domain='https://ja.rentbikehanoi.com';
const full=process.argv.includes('--mode=full'),outArg=process.argv.find(x=>x.startsWith('--report='));
const issues=[],inventory=[],edges=[],seenTitles=new Map(),seenMetas=new Map();
function issue(severity,category,kind,url,evidence,recommendedAction){
 issues.push({severity,category,kind,url,evidence,recommendedAction})
}
function validate(ok,severity,category,kind,url,evidence,action){
 if(!ok)issue(severity,category,kind,url,evidence,action);
}
function group(html,rx){return [...html.matchAll(rx)].map(x=>x[1])}
function meta(html,name,property=false){
 const tag=property?'property':'name';
 return html.match(new RegExp('<meta\\s+'+tag+'="'+name+'"\\s+content="([^"]*)"','i'))?.[1]||'';
}
function parseSchemas(html,url){
 const blocks=group(html,/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
 const nodes=[];
 if(!blocks.length)issue('P1','schema','missing-jsonld',url,'No JSON-LD','Review shared schema generator');
 for(const block of blocks){
  try{
   const s=JSON.parse(block);nodes.push(...(Array.isArray(s['@graph'])?s['@graph']:[s]));
  }catch(e){issue('P0','schema','invalid-jsonld',url,String(e),'Repair invalid JSON-LD generation')}
 }
 return nodes;
}
const accepted=state.published_ids.map(id=>{
 const planned=plan.find(a=>a.id===id);
 if(!planned){issue('P0','factory','unplanned-published-id','',id,'Restore approved editorial row');return null}
 const file='content/articles/'+id+'.json';
 if(!fs.existsSync(path.join(root,file))){issue('P0','factory','missing-published-source',planned.url,file,'Restore accepted article JSON');return null}
 const article=json(file);
 return {...planned,title:article.title,desc:article.description,article,type:'article'};
}).filter(Boolean);
const pages=site.pages.map(x=>({...x}));
try{validateTaxonomy(tax,plan,state.published_ids,pages);decorateTaxonomy(tax,pages,accepted);pages.push(...accepted)}
catch(e){issue('P0','architecture','invalid-taxonomy','',e.message,'Repair taxonomy without URL changes')}
const known=new Set(pages.map(p=>p.url)),incoming=new Map(pages.map(p=>[p.url,0]));
validate(known.size===pages.length,'P0','technical','duplicate-url','',pages.length-known.size+' duplicates','Resolve primary URL conflicts after review');
validate(config.domain===domain&&site.site.base===domain+'/','P0','technical','wrong-domain','',site.site.base,'Keep canonical Japanese origin');
validate(read('CNAME').trim()==='ja.rentbikehanoi.com','P0','technical','wrong-cname','/CNAME',read('CNAME').trim(),'Preserve DNS/CNAME');
validate(!(!state.enabled&&(queue.status!=='PAUSED'||queue.queue.length)),'P0','factory','unapproved-factory','',JSON.stringify({enabled:state.enabled,status:queue.status,queued:queue.queue.length}),'Writer queue must stay paused while factory is disabled');
const hasPendingDraft=plan.some(p=>fs.existsSync(path.join(root,'_factory/inbox/'+p.id+'.json')));
if(state.enabled&&!state.published_ids.length&&!hasPendingDraft)issue('P0','factory','missing-first-batch-drafts','',JSON.stringify({enabled:state.enabled,published:0}),'Enabled factory with zero published articles requires pending first-batch drafts');
validate(queue.published===state.published_ids.length&&queue.remaining===200-state.published_ids.length,'P1','factory','queue-count-drift','',JSON.stringify(queue).slice(0,160),'Reconcile writer queue counts');
const keywords=new Map();
for(const p of plan){
 const key=String(p.primary_keyword||'').normalize('NFKC').toLocaleLowerCase('ja').replace(/[\s\u3000\p{P}\p{S}]+/gu,'');
 if(keywords.has(key))issue('P1','content','duplicate-primary-keyword',p.url,p.id+' overlaps '+keywords.get(key),'Hold both; review search intent and primary URL');
 else keywords.set(key,p.id);
}
const sitemap=read('sitemap.xml'),robots=read('robots.txt');
const locs=group(sitemap,/<loc>([^<]+)<\/loc>/g);
validate(locs.length===known.size,'P0','technical','sitemap-size','/sitemap.xml',locs.length+' actual / '+known.size+' expected','Regenerate from published URL inventory');
for(const u of known)validate(locs.includes(domain+u),'P0','technical','missing-sitemap-url',u,u,'Rebuild sitemap');
for(const u of locs)validate(u.startsWith(domain+'/')&&known.has(u.slice(domain.length)),'P1','technical','unexpected-sitemap-url','/sitemap.xml',u,'Remove unapproved/unpublished URLs after checking');
validate(!/^\s*Disallow:\s*\/\s*$/mi.test(robots),'P0','technical','robots-block','/robots.txt','Root disallowed','Correct robots crawl policy');
validate(robots.includes('Sitemap: '+domain+'/sitemap.xml'),'P1','technical','robots-sitemap','/robots.txt','Sitemap directive missing','Add sitemap URL');
validate(read('404.html').includes('noindex'),'P1','technical','404-noindex','/404.html','Fallback noindex absent','Fix fallback');
for(const p of pages){
 const f=p.url==='/'?'index.html':p.url.slice(1)+'index.html';
 if(!fs.existsSync(path.join(root,f))){issue('P0','technical','missing-html',p.url,f,'Rebuild page');continue}
 const html=read(f),title=html.match(/<title>([^<]*)<\/title>/)?.[1]||'',desc=meta(html,'description');
 const canonical=html.match(/<link rel="canonical" href="([^"]*)"/)?.[1]||'';
 const headings=group(html,/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/g);
 const outgoing=[],anchors=group(html,/<a\b[^>]*href="(\/[^"]+)"/g);
 for(const href of anchors){
  const dest=href.split(/[?#]/)[0];
  if(dest===''||dest==='/')continue;
  if(known.has(dest)){outgoing.push(dest);edges.push({from:p.url,to:dest});incoming.set(dest,(incoming.get(dest)||0)+1)}
  else issue('P1','internal-link','broken-link',p.url,href,'Replace with related published URL after review');
 }
 validate(canonical===domain+p.url,'P0','technical','canonical',p.url,canonical,'Restore self canonical');
 validate(html.includes('<html lang="ja">'),'P1','technical','wrong-html-language',p.url,'lang not ja','Keep ja on all pages');
 validate(meta(html,'robots')==='index,follow','P0','technical','indexability',p.url,meta(html,'robots'),'Review robots meta');
 validate(title.length>=8&&title.length<=90,'P2','onpage','title-length',p.url,title,'Review only where intent is affected');
 validate(desc.length>=35,'P2','onpage','meta-description',p.url,desc,'Add clear description');
 validate(headings.length===1,'P1','onpage','h1-count',p.url,headings.length,'Repair heading template');
 validate(meta(html,'og:title',true)===title,'P2','onpage','og-title',p.url,title,'Sync social title');
 validate(meta(html,'og:url',true)===domain+p.url,'P2','onpage','og-url',p.url,p.url,'Sync OpenGraph URL');
 validate(meta(html,'twitter:card')==='summary','P3','onpage','twitter-card',p.url,'Twitter summary absent','Apply social card template');
 const nodes=parseSchemas(html,p.url);
 const business=nodes.find(x=>x['@type']==='LocalBusiness');
 const webpage=nodes.find(x=>x['@type']==='WebPage');
 validate(Boolean(business),'P1','schema','localbusiness',p.url,'Missing LocalBusiness','Sync brand entity');
 if(business){
  validate(business.name===site.business.name&&business.telephone===site.business.tel,'P0','local','nap-schema',p.url,JSON.stringify({name:business.name,tel:business.telephone}),'Restore canonical NAP');
  validate(business.hasMap===site.business.maps,'P2','local','maps-url',p.url,business.hasMap,'Use verified Google Maps CID');
 }
 validate(webpage?.url===domain+p.url,'P1','schema','webpage-url',p.url,webpage?.url,'Synchronize page schema ID');
 if(p.url!=='/')validate(nodes.some(x=>x['@type']==='BreadcrumbList'),'P1','schema','breadcrumbs',p.url,'Missing breadcrumb','Add meaningful BreadcrumbList');
 if(p.type==='article'){
  const article=nodes.find(x=>x['@type']==='Article'||x['@type']==='BlogPosting');
  validate(Boolean(article),'P0','schema','article-schema',p.url,'Article node missing','Repair shared article generator');
  if(article)validate(article.inLanguage==='ja'||article.inLanguage==='ja-JP','P0','schema','article-language',p.url,article.inLanguage,'Set inLanguage to ja');
 }
 if(p.type==='faq'&&!nodes.some(x=>x['@type']==='FAQPage'))issue('P2','schema','faq',p.url,'FAQ visible but schema absent','Only describe questions visible on page');
 validate(html.includes('tel:'+site.business.tel),'P2','local','phone-cta',p.url,'Quick Call not linked to NAP','Restore valid phone CTA');
 inventory.push({url:domain+p.url,type:p.type||'page',title,canonical,indexable:meta(html,'robots')==='index,follow',h1Count:headings.length,descriptionLength:desc.length,schemaTypes:nodes.map(x=>x['@type']).filter(Boolean),incoming:0,outgoing:[...new Set(outgoing)],htmlBytes:Buffer.byteLength(html,'utf8')});
 if(seenTitles.has(title))issue('P1','onpage','duplicate-title',p.url,seenTitles.get(title),'Confirm search intent before any title change');
 seenTitles.set(title,p.url);
 if(seenMetas.has(desc))issue('P2','onpage','duplicate-description',p.url,seenMetas.get(desc),'Review duplicates on a page-by-page basis');
 seenMetas.set(desc,p.url);
}
for(const item of inventory){
 item.incoming=incoming.get(new URL(item.url).pathname)||0;
 if(item.incoming===0&&new URL(item.url).pathname!=='/')issue('P1','architecture','orphan-page',item.url,'No internal link found','Link from a relevant parent/pillar page');
}
const hasExternalJS=/<script\s+[^>]*src="https?:\/\//i.test(read('index.html'));
if(hasExternalJS)issue('P2','performance','third-party-js','/','External JavaScript found','Audit impact on INP and LCP');
const assets=['assets/css/theme.css','assets/js/app.js','assets/js/rental-calculator.js'];
const assetSizes=Object.fromEntries(assets.map(p=>[p,fs.statSync(path.join(root,p)).size]));
if(assetSizes['assets/css/theme.css']>40000)issue('P2','performance','css-size','/',assetSizes['assets/css/theme.css']+' bytes','Reduce blocking CSS if field CWV confirms impact');
const measured={
 gsc:'UNCONNECTED_JAPAN_PROPERTY',bing:'UNCONNECTED_JAPAN_PROPERTY',
 cwv:'NO_FIELD_DATA',googleIndexCoverage:'NOT_VERIFIED',backlinkAuthority:'NOT_MEASURED',
 geo:'VIBESEO_PROJECT_FOR_ANOTHER_DOMAIN',
 lab:'NO_LIGHTHOUSE_OR_PAGESPEED_MEASUREMENT',
};
if(!site.site.googleSiteVerification)issue('P2','measurement','gsc-ownership','/', 'No Japanese GSC meta code in site config','Verify ja.rentbikehanoi.com via Search Console and submit sitemap');
if(!fs.existsSync(path.join(root,'assets/images')))issue('P2','trust','original-images','/','No original image library found in repo','Add real photographed motorcycles with permission and descriptive alt text');
if(!state.published_ids.length)issue('P3','content','no-published-articles','/', '0 JP articles; '+plan.length+' briefs are not live','Publish only reviewed Japanese articles after explicit approval');
async function checkLive(url,kind){
 try{
  const res=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:'manual',headers:{'user-agent':'JapanSiteSEOAudit/2.0 (read-only)'}});
  const code=res.status,location=res.headers.get('location');
  if(code!==200)issue(code>=300&&code<400?'P1':'P0','live',kind,url,'HTTP '+code+(location?' => '+location:''),'Investigate server and canonical destination');
  return {url,status:code,location};
 }catch(e){issue('P2','live','network-unavailable',url,String(e).slice(0,120),'Retry external crawl / no assumption of downtime');return {url,error:String(e).slice(0,100)}}
}
const live=[];
if(full){
 for(const p of inventory)live.push(await checkLive(p.url,'page-http'));
 live.push(await checkLive(domain+'/robots.txt','robots-http'));
 live.push(await checkLive(domain+'/sitemap.xml','sitemap-http'));
 try{
  const url=domain+'/__japan-seo-probe-nonexistent-404/';
  const res=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:'manual'});
  live.push({url,status:res.status});if(res.status!==404)issue('P1','live','soft-404',url,'Unexpected HTTP '+res.status,'Ensure unknown routes return real 404');
 }catch(e){issue('P2','live','404-check-unavailable','/',String(e).slice(0,120),'Retry when network available')}
}
const counts=Object.fromEntries(['P0','P1','P2','P3'].map(s=>[s,issues.filter(i=>i.severity===s).length]));
const report={schema:2,generatedAt:new Date().toISOString(),site:domain,mode:full?'full':'offline',
 summary:{indexableInventory:inventory.length,published:state.published_ids.length,planned:plan.length,target:config.target_articles,categoryParents:tax.parents.length,categoryChildren:tax.parents.reduce((n,p)=>n+p.children.length,0),sitemapURLs:locs.length,counts,status:counts.P0?'FAIL':'PASS_WITH_OBSERVATIONS'},
 measured,performanceHeuristics:{assetSizes,externalJS:hasExternalJS},inventory,edges,issues,live};
if(outArg){
 const file=outArg.split('=')[1];
 if(!/^[\w.-]+\.json$/.test(file))throw Error('Only root-level JSON report filenames are allowed');
 fs.writeFileSync(path.join(root,file),JSON.stringify(report,null,2)+'\n');
}
console.log('JAPAN_SEO_DEEP '+JSON.stringify({status:report.summary.status,pages:inventory.length,issues:counts,mode:report.mode}));
if(counts.P0)process.exitCode=1;

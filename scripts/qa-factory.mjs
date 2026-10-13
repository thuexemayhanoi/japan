import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {validateTaxonomy,decorateTaxonomy} from './taxonomy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const json=f=>JSON.parse(read(f)),data=json('site/data.json'),tax=json('site/taxonomy.json'),plan=json('data/editorial-plan.json').articles;
const cfg=json('data/factory-config.json'),state=json('data/factory-state.json'),queue=json('data/writer-queue.json'),issues=[];
if(cfg.target_articles!==200||cfg.domain!=='https://ja.rentbikehanoi.com')issues.push('Factory config target/domain mismatch');
validateTaxonomy(tax,plan,state.published_ids,data.pages);
const pub=state.published_ids.map(id=>{const p=plan.find(z=>z.id===id);if(!p)throw Error('Unknown published ID '+id);const article=json('content/articles/'+id+'.json');return {...p,title:article.title,intro:article.intro}});
const pages=data.pages.map(x=>({...x}));decorateTaxonomy(tax,pages,pub);
pages.push(...pub);
const urls=new Set(pages.map(p=>p.url));
if(urls.size!==pages.length)issues.push('Duplicate public URL');
if(plan.length>200||!plan.every(p=>/^JP-\d{4}$/.test(p.id)))issues.push('Invalid Japanese editorial ID/plan');
if(state.published_ids.length===0&&(state.enabled||queue.status!=='PAUSED'||queue.queue.length))issues.push('New factory must remain paused');
if(queue.published!==state.published_ids.length||queue.remaining!==200-state.published_ids.length)issues.push('Writer queue stats mismatch');
const sitemap=read('sitemap.xml'),locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
if(locs.length!==urls.size||locs.some(u=>!urls.has(u.replace('https://ja.rentbikehanoi.com',''))))issues.push('Sitemap does not match actual indexable HTML URLs');
const known=new Set([...urls]);
for(const page of pages){
 const file=page.url==='/'?'index.html':page.url.slice(1)+'index.html';
 if(!fs.existsSync(path.join(root,file))){issues.push('Missing '+file);continue}
 const html=read(file),expected=cfg.domain+page.url;
 if(!html.includes('rel="canonical" href="'+expected+'"'))issues.push('Incorrect canonical '+file);
 if(!html.includes('<html lang="ja">'))issues.push('Incorrect Japanese lang '+file);
 if(!html.includes('<meta name="robots" content="index,follow">'))issues.push('Noindex error '+file);
 if(data.site.googleSiteVerification){
  const verification='<meta name="google-site-verification" content="'+data.site.googleSiteVerification+'">';
  if(html.split(verification).length!==2)issues.push('Missing or repeated GSC meta '+file);
 }
 if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)issues.push('H1 count '+file);
 if((html.match(/class="nav-group"/g)||[]).length!==15)issues.push('Desktop/mobile/footer 5 category menu groups missing '+file);
 if(!html.includes('"@type":"LocalBusiness"'))issues.push('LocalBusiness schema missing '+file);
 if(!html.includes('tel:+84942467674'))issues.push('NAP phone missing '+file);
 if(!html.includes('/assets/css/theme.css'))issues.push('No stylesheet '+file);
 for(const x of html.matchAll(/<a\b[^>]*href="(\/[^"]+)"/g)){
  const url=x[1].split('#')[0].split('?')[0];if(!known.has(url))issues.push('Broken internal link '+file+' -> '+url);
 }
 if(page.type==='article'&&!html.includes('"@type":"Article"'))issues.push('Article schema missing '+file);
}
if(!read('robots.txt').includes('Sitemap: '+cfg.domain+'/sitemap.xml'))issues.push('Robots/sitemap mismatch');
if(!fs.existsSync(path.join(root,'404.html'))||!read('404.html').includes('noindex'))issues.push('404 must noindex');
if(!fs.existsSync(path.join(root,'CNAME'))||read('CNAME').trim()!=='ja.rentbikehanoi.com')issues.push('CNAME mutation');
if(issues.length){console.error(issues.slice(0,60).join('\n'));process.exit(1)}
console.log('JAPAN_QA_PASS pages='+pages.length+' published='+pub.length+' taxonomy=5/20 total=200 planned='+plan.length);

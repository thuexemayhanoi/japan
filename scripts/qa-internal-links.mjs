// Verify Japan Silo→Pillar→commercial internal links. No writing or AI API.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const tax=read('site/taxonomy.json'),matrix=read('site/nonpost-seo.json');
const source=read('site/data.json');
const plan=read('data/editorial-plan.json').articles;
const published=read('data/factory-state.json').published_ids;
const expected=source.pages.map(x=>x.url);
const count=new Map(tax.parents.flatMap(p=>p.children.map(c=>[p.id+'/'+c.id,0])));
for(const id of published){const row=plan.find(x=>x.id===id);if(!row)throw Error('Unknown published '+id);const key=row.parent_id+'/'+row.category_id;count.set(key,(count.get(key)||0)+1);}
for(const parent of tax.parents){const hasArticles=parent.children.some(child=>(count.get(parent.id+'/'+child.id)||0)>0);if(!expected.includes(parent.url)&&hasArticles)expected.push(parent.url);for(const child of parent.children){const url='/categories/'+parent.id+'/'+child.id+'/';if((count.get(parent.id+'/'+child.id)||0)>=tax.separate_archive_min_articles)expected.push(url);}}
const indexable=new Set(expected);
const effective=Object.entries(matrix.pages).filter(([url])=>indexable.has(url));
if(effective.length!==expected.length)throw Error('Non-post URL inventory mismatch '+effective.length+'/'+expected.length);
let inCluster=0,noHome=0;
for(const [url,entry] of effective){
 const destinations=new Set();
 const file=url==='/'?'index.html':url.slice(1)+'index.html';
 const html=fs.readFileSync(path.join(root,file),'utf8');
 for(const link of entry.links){
  if(!indexable.has(link.url))throw Error('Non-published target '+url+' -> '+link.url);
  if(link.url===url||destinations.has(link.url))throw Error('Duplicate/self target '+url+' -> '+link.url);
  if(link.url==='/'&&url!=='/')throw Error('Unjustified homepage CTA '+url);
  if(!link.label||link.label.length<5||/^詳しく見る|^こちら$/.test(link.label))throw Error('Generic anchor '+url);
  const needle='href="'+link.url+'">'+link.label+' ↗';
  if(!html.includes(needle))throw Error('Rendered link missing '+url+' -> '+link.url);
  destinations.add(link.url);
 }
 const category=url.match(/^\/categories\/([^/]+)\/([^/]+)\/$/);
 if(category){
  const pillar=tax.parents.find(p=>p.id===category[1]);
  if(!pillar||!destinations.has(pillar.url))throw Error('Silo must link to matching parent Pillar '+url);
  inCluster++;
 }
 if(url!=='/'&&!destinations.has('/'))noHome++;
}
for(const p of tax.parents){
 const row=matrix.pages[p.url];if(!row||!row.links?.some(l=>l.url.startsWith('/categories/'+p.id+'/')))throw Error('Pillar missing supporting Silo links '+p.url);
}
// The vehicle-selection card must lead to a published vehicle guide, not a price page.
if(indexable.has('/categories/motorbikes/semiautomatic/')){
 for(const file of ['index.html','bike-types/index.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  if(!/<h3>セミオート車<\/h3>[\s\S]{0,300}href="\/categories\/motorbikes\/semiautomatic\/"/.test(html))
   throw Error('Semiautomatic card target mismatch: '+file);
 }
}
const summary=read('reports/japan-internal-link-summary.json');
if(summary.non_posts!==effective.length||summary.articles!==published.length||summary.unresolved_internal_links!==0)throw Error('Graph does not represent current published snapshot');
if(summary.destination_home_from_nonpost_content.length)throw Error('Homepage receiving unjustified content backlinks');
console.log('JAPAN_INTERNAL_LINK_QA_PASS nonpost='+effective.length+' article='+published.length+' live_silos='+inCluster+' homepage_spam=0');

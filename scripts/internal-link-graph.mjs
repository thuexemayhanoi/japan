// Japan internal linking graph. Read-only crawler of generated HTML, no network or AI API.
// CLI: node scripts/internal-link-graph.mjs [--check] [--out reports]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {decorateTaxonomy,archiveUrl} from './taxonomy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const cfg=read('site/data.json'),tax=read('site/taxonomy.json');
const matrix=read('site/nonpost-seo.json');
const plan=read('data/editorial-plan.json').articles;
const published=read('data/factory-state.json').published_ids;
const pages=cfg.pages.map(p=>({...p}));const mapped=new Map(plan.map(p=>[p.id,p]));
const articles=published.map(id=>{
 const p=mapped.get(id);if(!p)throw Error('Unknown published article ID '+id);
 const a=read('content/articles/'+id+'.json');
 return {...p,type:'article',title:a.title,h1:a.h1};
});
decorateTaxonomy(tax,pages,articles);
pages.push(...articles);
const ordered=pages.sort((a,b)=>a.url.localeCompare(b.url,'en'));
const urls=new Set(ordered.map(p=>p.url));
const parents=new Map(tax.parents.map(p=>[p.id,p.url]));
const htmlUnescape=s=>String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const textOnly=s=>htmlUnescape(s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()).slice(0,180);
const csv=v=>'"'+String(v??'').replace(/"/g,'""').replace(/\s*\n\s*/g,' ').trim()+'"';
const toCSV=rows=>rows.map(row=>row.map(csv).join(',')).join('\n')+'\n';
const edges=[],seen=new Set(),unknown=[],bySource=new Map();
for(const p of ordered){
 const filename=p.url==='/'?'index.html':p.url.slice(1)+'index.html';
 const html=fs.readFileSync(path.join(root,filename),'utf8');
 const mainStart=html.indexOf('<main id="content">'),mainEnd=html.indexOf('</main>',mainStart);
 const headerEnd=html.indexOf('</header>'),footerStart=html.indexOf('<footer');
 const crumb=[...html.matchAll(/<nav class="crumb"[\s\S]*?<\/nav>/g)].map(m=>[m.index,m.index+m[0].length]);
 const links=[...html.matchAll(/<a\b([^>]*)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)];
 const mine=[];
 for(const match of links){
  let raw=htmlUnescape(match[2]);if(!raw.startsWith('/'))continue;
  const url=raw.split('#')[0].split('?')[0]||'/';if(!urls.has(url)){unknown.push({from:p.url,url,anchor:textOnly(match[4])});continue;}
  const loc=match.index,zone=loc<mainStart?'chrome':loc>=mainEnd?'chrome':crumb.some(([a,b])=>a<=loc&&loc<b)?'breadcrumb':'contextual';
  const anchor=textOnly(match[4])||'[icon]';
  const key=[p.url,url,anchor,zone].join('\t');if(seen.has(key))continue;seen.add(key);
  const edge={from:p.url,to:url,anchor,zone};edges.push(edge);mine.push(edge);
 }
 bySource.set(p.url,mine);
}
if(unknown.length)throw Error('Broken internal links '+JSON.stringify(unknown.slice(0,8)));
const inbound=new Map(ordered.map(p=>[p.url,[]]));
for(const e of edges)inbound.get(e.to).push(e);
const group=p=>p.type==='article'?p.parent_id:p.url.startsWith('/categories/')?p.parent_id:tax.parents.find(x=>x.url===p.url)?.id||p.url.startsWith('/bike-types/')?'motorbikes':p.url.startsWith('/rental-guide/')?'guide':p.url.startsWith('/rental-prices/')?'prices':p.url.startsWith('/hanoi-areas/')?'areas':p.url.startsWith('/routes-mobility/')?'routes':p.url==='/'?'commercial':'trust';
function recommendation(p){
 if(p.type==='article'){
  const parent=tax.parents.find(x=>x.id===p.parent_id),candidate=parent&&archiveUrl(parent,{id:p.category_id});
  const target=candidate&&urls.has(candidate)?candidate:parents.get(p.parent_id);
  return {url:target||'',anchor:parent?.label||'',action:'RECOMMEND_ONLY_POST_UNCHANGED'};
 }
 if(p.type==='taxonomy-archive'){
  const target=parents.get(p.parent_id);
  return {url:target,anchor:tax.parents.find(x=>x.id===p.parent_id)?.label||'',action:'SILO_TO_PILLAR'};
 }
 const priority=matrix.pages[p.url]?.links?.[0];
 return {url:priority?.url||'',anchor:priority?.label||'',action:p.url==='/'?'MONEY_TO_SUPPORT':'PILLAR_TO_RELEVANT_URL'};
}
const contextual=edges.filter(e=>e.zone==='contextual');
const fullRows=[['url','page_type','cluster','outgoing_unique_all','incoming_unique_all','outgoing_unique_contextual','incoming_unique_contextual','outgoing_contextual_links','incoming_contextual_links','anchor_texts_outgoing_contextual','recommended_link','recommended_anchor','recommended_action']];
const shortRows=[['url','page_type','cluster','outgoing_contextual','incoming_contextual','recommended_link','recommended_anchor','recommended_action']];
const toSet=(arr,field)=>[...new Set(arr.map(e=>e[field]))];
for(const p of ordered){
 const out=bySource.get(p.url),incoming=inbound.get(p.url),outCtx=out.filter(e=>e.zone==='contextual'),inCtx=incoming.filter(e=>e.zone==='contextual');
 const rec=recommendation(p);
 const listA=toSet(outCtx,'to'),listB=toSet(inCtx,'from'),anchors=toSet(outCtx,'anchor');
 fullRows.push([p.url,p.type||'page',group(p),toSet(out,'to').length,toSet(incoming,'from').length,listA.length,listB.length,listA.join(' | '),listB.join(' | '),anchors.join(' | '),rec.url,rec.anchor,rec.action]);
 if(p.type!=='article')shortRows.push([p.url,p.type||'page',group(p),listA.length,listB.length,rec.url,rec.anchor,rec.action]);
}
const contextEdges=[['source_url','target_url','anchor_text','zone','source_cluster','target_cluster'],...contextual.map(e=>[e.from,e.to,e.anchor,e.zone,group(ordered.find(p=>p.url===e.from)),group(ordered.find(p=>p.url===e.to))])];
const summary={domain:'https://ja.rentbikehanoi.com/',scope:'233 published pages, no drafts',pages:ordered.length,articles:articles.length,non_posts:ordered.length-articles.length,all_unique_edges:edges.length,contextual_edges:contextual.length,nonpost_contextual_edges:contextual.filter(e=>ordered.find(p=>p.url===e.from)?.type!=='article').length,destination_home_from_nonpost_content:contextual.filter(e=>e.to==='/'&&ordered.find(p=>p.url===e.from)?.type!=='article').map(e=>e.from),unresolved_internal_links:unknown.length,generated_from:'published HTML after node scripts/build.mjs'};
if(summary.non_posts!==33||summary.articles!==200)throw Error('Unexpected Japan publication snapshot '+JSON.stringify(summary));
if(summary.destination_home_from_nonpost_content.length)throw Error('Unexpected blanket homepage links '+JSON.stringify(summary.destination_home_from_nonpost_content));
const outputs={
 'reports/japan-internal-link-graph.csv':toCSV(fullRows),
 'reports/japan-internal-link-graph-nonpost.csv':toCSV(shortRows),
 'reports/japan-internal-link-context-edges.csv':toCSV(contextEdges),
 'reports/japan-internal-link-summary.json':JSON.stringify(summary,null,2)+'\n'
};
const check=process.argv.includes('--check');let drift=[];
for(const [rel,content] of Object.entries(outputs)){
 const target=path.join(root,rel);
 if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==content)drift.push(rel);}
 else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content,'utf8');}
}
if(drift.length)throw Error('INTERNAL_LINK_GRAPH_DRIFT '+drift.join(', '));
console.log('JAPAN_INTERNAL_LINK_GRAPH_PASS '+JSON.stringify(summary));

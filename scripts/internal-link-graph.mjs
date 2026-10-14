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
const group=p=>p.type==='article'?p.parent_id:p.url.startsWith('/categories/')?p.parent_id:(tax.parents.find(x=>x.url===p.url)?.id||(p.url.startsWith('/bike-types/')?'motorbikes':p.url.startsWith('/rental-guide/')?'guide':p.url.startsWith('/rental-prices/')?'prices':p.url.startsWith('/hanoi-areas/')?'areas':p.url.startsWith('/routes-mobility/')?'routes':p.url==='/'?'commercial':'trust'));
// Recommend only a genuinely *missing* contextual URL (never repeat a link).
// Commercial links are candidates only when content and user intent match.
const editorial={
 '/bike-types/':[['/bike-types/scooters/','スクーターレンタルの実際の条件']],
 '/rental-prices/':[['/rental-guide/documents-deposit/','必要書類と保証金の確認']],
 '/rental-guide/':[['/categories/prices/deposits/','保証金の支払・返金条件']],
 '/hanoi-areas/':[['/categories/routes/urban-routes/','市内の移動ルートと注意点']],
 '/routes-mobility/':[['/categories/guide/city-driving/','市内走行の安全情報']],
 '/faq/':[['/categories/prices/deposits/','保証金と返金に関する詳細']],
 '/contact/':[['/categories/prices/delivery/','車両受渡しと追加費用の案内']],
 '/bike-types/scooters/':[['/categories/prices/comparison/','スクーターを含む料金比較']],
 '/bike-types/50cc/':[['/categories/guide/procedure/','予約に必要な書類と手続き']],
 '/categories/motorbikes/electric/':[['/categories/guide/inspection/','レンタル車両の点検ガイド']],
 '/categories/areas/old-quarter/':[['/categories/routes/alternatives/','旧市街で使える代替交通手段']],
 '/categories/areas/longbien/':[['/categories/prices/delivery/','受取場所や費用の確認']],
 '/categories/prices/delivery/':[['/rental-guide/documents-deposit/','受渡し時の書類と保証金']],
 '/categories/guide/city-driving/':[['/categories/routes/alternatives/','運転以外の交通手段']]
};
const byUrl=new Map(ordered.map(p=>[p.url,p]));
function recommendation(p){
 const already=new Set((bySource.get(p.url)||[]).filter(e=>e.zone==='contextual').map(e=>e.to));
 const options=[];
 if(p.type==='article'){
  const parent=tax.parents.find(x=>x.id===p.parent_id);
  if(parent){
   const silo=archiveUrl(parent,{id:p.category_id});
   if(urls.has(silo))options.push([silo,'関連記事とカテゴリーへ']);
   if(urls.has(parent.url))options.push([parent.url,parent.label+'の関連記事']);
  }
 }else if(p.type==='taxonomy-parent'){
  const parent=tax.parents.find(x=>x.id===p.parent_id);
  if(parent)for(const child of parent.children){
   const u=archiveUrl(parent,child);
   if(urls.has(u))options.push([u,child.label+'の関連記事']);
  }
 }
 for(const row of editorial[p.url]||[])options.push(row);
 const match=options.find(([u])=>urls.has(u)&&u!==p.url&&!already.has(u));
 if(!match)return {url:'',anchor:'',action:'KEEP_NO_NEW_LINK',reason:'No unlinked topical target verified'};
 return {url:match[0],anchor:match[1],action:p.type==='article'?'REVIEW_POST_ONLY_NO_EDIT':'REVIEW_CONTEXTUAL_ADD',reason:'Topically related, published, and absent from existing contextual links'};
}
const contextual=edges.filter(e=>e.zone==='contextual');
const fullRows=[['url','page_type','cluster','outgoing_unique_all','incoming_unique_all','outgoing_unique_contextual','incoming_unique_contextual','outgoing_contextual_links','incoming_contextual_links','anchor_texts_outgoing_contextual','anchor_texts_incoming_contextual','recommended_missing_link','recommended_anchor','recommended_action','recommendation_reason']];
const shortRows=[['url','page_type','cluster','outgoing_contextual','incoming_contextual','outgoing_urls','incoming_urls','outgoing_anchors','incoming_source_anchor_pairs','recommended_missing_link','recommended_anchor','recommended_action','recommendation_reason']];
const toSet=(arr,field)=>[...new Set(arr.map(e=>e[field]))];
for(const p of ordered){
 const out=bySource.get(p.url),incoming=inbound.get(p.url),outCtx=out.filter(e=>e.zone==='contextual'),inCtx=incoming.filter(e=>e.zone==='contextual');
 const rec=recommendation(p);
 const listA=toSet(outCtx,'to'),listB=toSet(inCtx,'from'),anchors=toSet(outCtx,'anchor');
 const inAnchors=toSet(inCtx.map(e=>({value:e.from+' → '+e.anchor})),'value'),outAnchors=toSet(outCtx.map(e=>({value:e.to+' → '+e.anchor})),'value');
 fullRows.push([p.url,p.type||'page',group(p),toSet(out,'to').length,toSet(incoming,'from').length,listA.length,listB.length,listA.join(' | '),listB.join(' | '),anchors.join(' | '),inAnchors.join(' | '),rec.url,rec.anchor,rec.action,rec.reason]);
 if(p.type!=='article')shortRows.push([p.url,p.type||'page',group(p),listA.length,listB.length,listA.join(' | '),listB.join(' | '),outAnchors.join(' | '),inAnchors.join(' | '),rec.url,rec.anchor,rec.action,rec.reason]);
}
const role=e=>{
 const src=byUrl.get(e.from),dst=byUrl.get(e.to);
 if(src?.type==='article'&&dst?.type==='taxonomy-archive'&&src.parent_id===dst.parent_id&&src.category_id===dst.category_id)return 'SUPPORT_TO_SILO';
 if(src?.type==='article'&&src.parent_id===dst.parent_id&&dst.type==='taxonomy-parent')return 'SUPPORT_TO_PILLAR';
 if(src?.type==='taxonomy-archive'&&dst.type==='taxonomy-parent'&&src.parent_id===dst.parent_id)return 'SILO_TO_PILLAR';
 if(src?.type==='taxonomy-parent'&&dst.type==='taxonomy-archive'&&src.parent_id===dst.parent_id)return 'PILLAR_TO_SILO';
 if(src?.type==='taxonomy-parent'&&['/rental-prices/','/contact/'].includes(dst.url))return 'PILLAR_TO_COMMERCIAL';
 if(src?.type==='article'&&dst.type==='article')return 'SUPPORT_TO_SUPPORT';
 if(src?.type==='taxonomy-archive'&&dst.type==='article'&&src.category_id===dst.category_id)return 'SILO_TO_SUPPORT';
 return 'CONTEXTUAL_RELATED';
};
const contextEdges=[['source_url','target_url','anchor_text','zone','source_cluster','target_cluster','edge_role'],...contextual.map(e=>[e.from,e.to,e.anchor,e.zone,group(byUrl.get(e.from)),group(byUrl.get(e.to)),role(e)])];
const opportunityRows=[['priority','source_url','cluster','incoming_contextual_urls','outgoing_contextual_urls','recommended_missing_url','recommended_anchor','reason','action'],...ordered.filter(p=>p.type!=='article').map(p=>{
 const rec=recommendation(p);
 if(rec.action!=='REVIEW_CONTEXTUAL_ADD')return null;
 const incomingLinks=(inbound.get(p.url)||[]).filter(e=>e.zone==='contextual');
 const outgoingLinks=(bySource.get(p.url)||[]).filter(e=>e.zone==='contextual');
 const unique=arr=>new Set(arr.map(x=>x.from||x.to)).size;
 return [p.type==='taxonomy-parent'||['/bike-types/','/rental-prices/','/rental-guide/','/hanoi-areas/','/routes-mobility/'].includes(p.url)?'P1':'P2',p.url,group(p),unique(incomingLinks),new Set(outgoingLinks.map(x=>x.to)).size,rec.url,rec.anchor,rec.reason,rec.action];
}).filter(Boolean)];
const summary={domain:'https://ja.rentbikehanoi.com/',scope:'all currently published URLs; no drafts',pages:ordered.length,articles:articles.length,non_posts:ordered.length-articles.length,all_unique_edges:edges.length,contextual_edges:contextual.length,nonpost_contextual_edges:contextual.filter(e=>ordered.find(p=>p.url===e.from)?.type!=='article').length,destination_home_from_nonpost_content:contextual.filter(e=>e.to==='/'&&ordered.find(p=>p.url===e.from)?.type!=='article').map(e=>e.from),unresolved_internal_links:unknown.length,recommended_missing_nonpost_links:ordered.filter(p=>p.type!=='article'&&recommendation(p).action==='REVIEW_CONTEXTUAL_ADD').length,role_counts:contextual.reduce((a,e)=>(a[role(e)]=(a[role(e)]||0)+1,a),{}),generated_from:'published HTML after node scripts/build.mjs'};
if(summary.pages!==urls.size||summary.articles!==published.length)throw Error('Unexpected Japan publication snapshot '+JSON.stringify(summary));
if(summary.destination_home_from_nonpost_content.length)throw Error('Unexpected blanket homepage links '+JSON.stringify(summary.destination_home_from_nonpost_content));
const outputs={
 'reports/japan-internal-link-graph.csv':toCSV(fullRows),
 'reports/japan-internal-link-graph-nonpost.csv':toCSV(shortRows),
 'reports/japan-internal-link-context-edges.csv':toCSV(contextEdges),
 'reports/japan-internal-link-opportunities.csv':toCSV(opportunityRows),
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

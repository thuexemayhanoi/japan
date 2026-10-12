#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const at=file=>path.join(ROOT,file);
const get=file=>JSON.parse(fs.readFileSync(at(file),'utf8'));
const put=(file,obj)=>{fs.mkdirSync(path.dirname(at(file)),{recursive:true});fs.writeFileSync(at(file),JSON.stringify(obj,null,2)+'\n');};
const cfg=get('data/factory-config.json'),rows=get('data/editorial-plan.json').articles,state=get('data/factory-state.json');
const published=new Set(state.published_ids);
const command=process.argv[2]||'status';
const unique=arr=>new Set(arr).size===arr.length;
const wordCount=s=>Array.from(String(s).replace(/\s+/gu,'')).length; // JA: real Unicode character count, not whitespace words
function verifyPlan(){
 if(rows.length>cfg.target_articles||!unique(rows.map(r=>r.id))||!unique(rows.map(r=>r.url))||!unique(rows.map(r=>r.working_title.toLocaleLowerCase('ja'))))throw Error('Invalid or duplicate plan');
 for(const r of rows)if(!/^JP-\d{4}$/.test(r.id)||!cfg.allowed_hubs.includes(r.hub)||r.url!==r.hub+r.slug+'/'||!/^[a-z0-9-]+$/.test(r.slug))throw Error('Invalid route '+r.id);
 for(const id of published)if(!rows.some(r=>r.id===id))throw Error('Published ID missing from plan '+id);
}
function queue(){
 const next=rows.filter(r=>!published.has(r.id)).slice(0,cfg.batch_size);
 const status=state.blocked?'BLOCKED':!state.enabled?'PAUSED':!next.length?(published.size>=cfg.target_articles?'TARGET_REACHED':'PLAN_EXHAUSTED'):'READY';
 const snapshot={schema_version:1,status,target:cfg.target_articles,published:published.size,remaining:cfg.target_articles-published.size,
 planned:rows.length,unplanned:cfg.target_articles-rows.length,
 queue:status==='READY'?next.map(r=>({...r,draft_file:'_factory/inbox/'+r.id+'.json'})):[]};
 put('data/writer-queue.json',snapshot);return snapshot;
}
function normalizeTitle(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('ja').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function draftQA(r,d){
 const problems=[];
 if(d.id!==r.id)problems.push('ID mismatch');
 if(typeof d.title!=='string'||d.title.length<12||d.title.length>85)problems.push('title outside 12–85 characters');
 if(typeof d.description!=='string'||d.description.length<55||d.description.length>220)problems.push('description outside 55–220 characters');
 if(typeof d.h1!=='string'||d.h1.length<7||typeof d.intro!=='string'||d.intro.length<90)problems.push('H1/intro incomplete');
 if(!Array.isArray(d.sections)||d.sections.length<cfg.min_sections)problems.push('less than '+cfg.min_sections+' sections');
 let full=typeof d.intro==='string'?d.intro:'';
 const headings=new Set();
 for(const s of Array.isArray(d.sections)?d.sections:[]){
  if(!s||typeof s.heading!=='string'||s.heading.length<6||!Array.isArray(s.paragraphs)||s.paragraphs.length<2)problems.push('invalid section');
  else{
   const h=normalizeTitle(s.heading);if(headings.has(h))problems.push('duplicate section heading');headings.add(h);
   for(const p of s.paragraphs){if(typeof p!=='string'||p.length<90)problems.push('short paragraph');else full+=' '+p;}
  }
 }
 const words=wordCount(full);if(words<cfg.min_characters||words>cfg.max_characters)problems.push('character count '+words);
 if(!Array.isArray(d.faq)||d.faq.length>cfg.max_article_faq)problems.push('FAQ shape/count');
 else for(const q of d.faq)if(!q||typeof q.question!=='string'||typeof q.answer!=='string'||q.answer.length<50)problems.push('FAQ incomplete');
 if(/保証金不要|必ず無料配送|免許不要|24\s*\/\s*7|在庫保証/u.test(full))problems.push('unverified business promise');
 if(!Array.isArray(d.source_urls)||d.source_urls.some(u=>typeof u!=='string'||!/^https:\/\//i.test(u)))problems.push('invalid sources');
 if(/免許|保険|道路交通法|運転資格|法令|交通規則/u.test(r.working_title)&&(!Array.isArray(d.source_urls)||d.source_urls.length<1))problems.push('legal topic requires source');
 const base=get('site/data.json').pages.map(p=>p.url);
 const targets=new Set([...base,...rows.filter(x=>published.has(x.id)).map(x=>x.url)]);
 if(!Array.isArray(d.related)||d.related.length<2||d.related.length>8||d.related.some(u=>!targets.has(u)||u===r.url))problems.push('related must contain 2–8 existing URLs');
 if(d.status!=='READY_FOR_QA')problems.push('writer approval marker missing');
 if(rows.filter(x=>published.has(x.id)).some(x=>normalizeTitle(get('content/articles/'+x.id+'.json').title)===normalizeTitle(d.title)))problems.push('published title duplicate');
 return {problems,words};
}
verifyPlan();
if(command==='status'){console.log(JSON.stringify({enabled:state.enabled,blocked:state.blocked,published:published.size,planned:rows.length,remaining:cfg.target_articles-published.size,pending_drafts:rows.filter(r=>!published.has(r.id)&&fs.existsSync(at('_factory/inbox/'+r.id+'.json'))).length},null,2));process.exit(0);}
if(command==='pause'||command==='resume'){
 state.enabled=command==='resume';state.last_run=new Date().toISOString();put('data/factory-state.json',state);
 console.log('FACTORY '+queue().status);process.exit(0);
}
if(command==='refresh-queue'){console.log(JSON.stringify(queue(),null,2));process.exit(0);}
if(command==='process'){
 if(!state.enabled||state.blocked){console.log('SAFE_STOP '+(!state.enabled?'PAUSED':'BLOCKED'));process.exit(0);}
 const selected=rows.filter(r=>!published.has(r.id)&&fs.existsSync(at('_factory/inbox/'+r.id+'.json'))).slice(0,cfg.batch_size);
 if(!selected.length){console.log('NO_DRAFTS: no state changes or empty hourly commit');process.exit(0);}
 const checked=selected.map(r=>{const draft=get('_factory/inbox/'+r.id+'.json');const result=draftQA(r,draft);if(result.problems.length)throw Error(r.id+': '+result.problems.join('; '));return {r,draft,words:result.words};});
 for(const entry of checked){
  put('content/articles/'+entry.r.id+'.json',{...entry.draft,published_at:new Date().toISOString().slice(0,10),character_count:entry.words});
  fs.unlinkSync(at('_factory/inbox/'+entry.r.id+'.json'));state.published_ids.push(entry.r.id);published.add(entry.r.id);
 }
 state.last_error=null;state.last_run=new Date().toISOString();put('data/factory-state.json',state);
 const q=queue();put('reports/factory-last-run.json',{status:q.status,at:state.last_run,published:checked.map(x=>x.r.id),remaining:q.remaining});
 console.log('BATCH '+JSON.stringify(checked.map(x=>({id:x.r.id,characters:x.words}))));process.exit(0);
}
throw Error('Unknown action '+command);

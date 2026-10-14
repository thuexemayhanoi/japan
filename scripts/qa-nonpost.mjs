// Dedicated audit guard for Japan non-post SEO. This does not edit or publish anything.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {decorateTaxonomy} from './taxonomy.mjs';
import {validateNonPostSEO} from './nonpost-seo.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const conf=read('site/nonpost-seo.json'),data=read('site/data.json'),tax=read('site/taxonomy.json');
const plan=read('data/editorial-plan.json').articles,state=read('data/factory-state.json');
const pages=data.pages.map(p=>({...p}));
const published=state.published_ids.map(id=>{const row=plan.find(p=>p.id===id);if(!row)throw Error('Unplanned ID '+id);const draft=read('content/articles/'+id+'.json');return {...row,title:draft.title,intro:draft.intro};});
decorateTaxonomy(tax,pages,published);
pages.push(...published.map(x=>({...x,type:'article'})));
validateNonPostSEO(conf,pages);
const current=new Set(pages.map(p=>p.url));
const nonpost=pages.filter(p=>p.type!=='article');
for(const p of nonpost){
 const url=p.url,entry=conf.pages[url],file=url==='/'?'index.html':url.slice(1)+'index.html';
 const html=fs.readFileSync(path.join(root,file),'utf8');
 if(!html.includes('<title>'+entry.title+'</title>'))throw Error('Title not applied to '+url);
 if(!html.includes('<h2>このページの要点</h2>'))throw Error('Direct answer missing '+url);
 if(!html.includes(entry.answer.replaceAll('&','&amp;')))throw Error('Answer missing '+url);
 if((html.match(/class="nonpost-seo-section"/g)||[]).length!==entry.sections.length)throw Error('Content sections missing '+url);
 for(const l of entry.links)if(!current.has(l.url))throw Error('New broken link '+url+' -> '+l.url);
}
if(process.argv.includes('--guard-scope')){
 const changed=execFileSync('git',['diff','--name-only'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const allowed=new Set(nonpost.map(p=>p.url==='/'?'index.html':p.url.slice(1)+'index.html'));
 allowed.add('search-index.json');
 const forbidden=changed.filter(p=>!allowed.has(p));
 if(forbidden.length)throw Error('SCOPE_STOP modified generated article, Factory or protected file: '+forbidden.join(', '));
 console.log('JAPAN_NONPOST_SCOPE_PASS generated='+changed.length+' protected_articles='+published.length);
}
console.log('JAPAN_NONPOST_QA_PASS live_nonpost='+nonpost.length+' future_archives='+Object.keys(conf.pages).length-nonpost.length+' existing_posts='+published.length);

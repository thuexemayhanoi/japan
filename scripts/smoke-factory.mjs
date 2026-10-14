import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'japan-factory-smoke-'));
const read=p=>fs.readFileSync(path.join(tmp,p),'utf8');
const run=(file,args=[])=>execFileSync(process.execPath,[file,...args],{cwd:tmp,encoding:'utf8',stdio:'pipe'});
try{
 fs.cpSync(root,tmp,{recursive:true,filter:s=>!s.split(path.sep).includes('.git')&&!s.split(path.sep).includes('node_modules')});
 const s=JSON.parse(read('data/factory-state.json'));s.enabled=false;s.blocked=false;s.published_ids=[];s.last_error=null;s.last_run=null;
 fs.writeFileSync(path.join(tmp,'data/factory-state.json'),JSON.stringify(s,null,2)+'\n');
 const planned=JSON.parse(read('data/editorial-plan.json')).articles.length;
 fs.writeFileSync(path.join(tmp,'data/writer-queue.json'),JSON.stringify({schema_version:1,status:'PAUSED',target:200,published:0,remaining:200,planned,unplanned:200-planned,queue:[]},null,2)+'\n');
 fs.rmSync(path.join(tmp,'content/articles'),{force:true,recursive:true});
 fs.rmSync(path.join(tmp,'_factory/inbox'),{force:true,recursive:true});fs.mkdirSync(path.join(tmp,'_factory/inbox'),{recursive:true});
 run('scripts/build.mjs');
 run('scripts/qa-factory.mjs');
 run('scripts/factory.mjs',['resume']);
 run('scripts/factory.mjs',['refresh-queue']);
 const q=JSON.parse(read('data/writer-queue.json'));if(q.status!=='READY'||q.queue[0].id!=='JP-0001')throw Error('Queue generation failed');
 const body='レンタルする際は車両の状態と運転資格を確認し、契約書に記載された期間、費用、保証金、連絡方法を読み直してください。';
 const para=body.repeat(5);
 const sections=[1,2,3,4].map(n=>({heading:'安全な確認事項 '+n,paragraphs:[para,para]}));
 const draft={id:'JP-0001',title:'ハノイでバイクレンタルを準備する安全な手順と確認事項',description:'ハノイでバイクをレンタルする前に、車種の確認方法、必要書類、保証金、車両の点検、返却時に確認するべき具体的な事項を丁寧に説明します。',h1:'ハノイでバイクを借りる前に確認すること',intro:para,sections,faq:[],related:['/rental-prices/','/faq/'],source_urls:[],status:'READY_FOR_QA'};
 fs.writeFileSync(path.join(tmp,'_factory/inbox/JP-0001.json'),JSON.stringify(draft,null,2));
 run('scripts/factory.mjs',['process']);run('scripts/build.mjs');run('scripts/qa-factory.mjs');run('scripts/build.mjs',['--check']);
 if(!read('sitemap.xml').includes('/rental-guide/renting-motorbike-hanoi/'))throw Error('Published URL missing in sitemap');
 if(!read('rental-guide/renting-motorbike-hanoi/index.html').includes('"@type":"Article"'))throw Error('Published Article schema missing');
 if(!read('rental-guide/renting-motorbike-hanoi/index.html').includes('"inLanguage":"ja"'))throw Error('Japanese article structured-data language missing');
 console.log('JAPAN_FACTORY_SMOKE_PASS simulated_1_article; production untouched');
}finally{fs.rmSync(tmp,{force:true,recursive:true})}

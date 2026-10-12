// Rebuild all static HTML, canonical tags, breadcrumbs, schema and sitemap without dependencies.
// Usage: node scripts/build.mjs
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {validateTaxonomy,decorateTaxonomy,taxonomyMenu,parentCategorySection,categoryArchiveBody,articleCategoryTrail} from './taxonomy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'site/data.json'),'utf8'));
const bike="<svg viewBox=\"0 0 620 430\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"赤いバイクのイラスト\"><defs><linearGradient id=\"b\" x2=\"1\" y2=\"1\"><stop stop-color=\"#d9f6ff\"/><stop offset=\".6\" stop-color=\"#ed3744\"/><stop offset=\"1\" stop-color=\"#951421\"/></linearGradient></defs><ellipse cx=\"305\" cy=\"384\" rx=\"240\" ry=\"18\" fill=\"#02101e\" opacity=\".4\"/><circle cx=\"147\" cy=\"321\" r=\"80\" fill=\"#111b27\" stroke=\"#adc9dc\" stroke-width=\"9\"/><circle cx=\"147\" cy=\"321\" r=\"49\" fill=\"#273e55\" stroke=\"#79b2d1\" stroke-width=\"12\"/><circle cx=\"147\" cy=\"321\" r=\"17\" fill=\"#c9e8f7\"/><circle cx=\"477\" cy=\"321\" r=\"80\" fill=\"#111b27\" stroke=\"#adc9dc\" stroke-width=\"9\"/><circle cx=\"477\" cy=\"321\" r=\"49\" fill=\"#273e55\" stroke=\"#79b2d1\" stroke-width=\"12\"/><circle cx=\"477\" cy=\"321\" r=\"17\" fill=\"#c9e8f7\"/><path d=\"m147 318 61-94 136 14 133 82\" fill=\"none\" stroke=\"#c3eafc\" stroke-width=\"17\" stroke-linecap=\"round\"/><path d=\"M203 205q40-31 130-27l56 19 65 85-69 8-45-34-79 20-40 51-94-11z\" fill=\"url(#b)\" stroke=\"#dff6ff\" stroke-width=\"5\"/><path d=\"M206 201q35-29 145-23l11 22-133 24z\" fill=\"#101c2a\"/><path d=\"m341 180 49-63 25 8-9 29 46 80-36 5z\" fill=\"url(#b)\" stroke=\"#e6faff\" stroke-width=\"4\"/><path d=\"m404 123 35-32 45 0\" stroke=\"#d4ecfa\" stroke-width=\"9\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"m472 91 10-10\" stroke=\"#0b1825\" stroke-width=\"13\" stroke-linecap=\"round\"/><path d=\"m377 131-47-24-21-1\" stroke=\"#d2e9f5\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M423 228q26-8 39-2l25 40-53 12z\" fill=\"#fda0a8\" stroke=\"#e3faff\" stroke-width=\"4\"/><circle cx=\"453\" cy=\"232\" r=\"12\" fill=\"#fff\"/><path d=\"m279 274 100 9\" stroke=\"#66151c\" stroke-width=\"9\" stroke-linecap=\"round\"/></svg>";
function generate(c){
 const out={}, base=c.site.base, B=c.business, E=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"), abs=url=>base.slice(0,-1)+url, link=(url,label)=>`<a href="${E(url)}">${E(label)}</a>`;
 const get=url=>c.pages.find(x=>x.url===url);
 const nav=p=>taxonomyMenu(c.taxonomy,c.pages,c.liveCategories,p);
 const layoutHead=p=>`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${E(p.desc)}"><meta name="theme-color" content="#101820">${c.site.googleSiteVerification?'<meta name="google-site-verification" content="'+E(c.site.googleSiteVerification)+'">':''}<meta name="robots" content="index,follow"><link rel="canonical" href="${abs(p.url)}"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="stylesheet" href="/assets/css/theme.css"><meta property="og:type" content="website"><meta property="og:locale" content="ja_JP"><meta property="og:title" content="${E(p.title)}"><meta property="og:description" content="${E(p.desc)}"><meta property="og:url" content="${abs(p.url)}"><meta name="twitter:card" content="summary"><title>${E(p.title)}</title>${schema(p)}</head><body>`;
 function schema(p){const graph=[{"@type":"LocalBusiness","@id":base+"#organization",name:B.name,telephone:B.tel,url:base,hasMap:B.maps,openingHoursSpecification:[{"@type":"OpeningHoursSpecification",dayOfWeek:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],opens:B.hours.split("–")[0],closes:B.hours.split("–")[1]}],address:{"@type":"PostalAddress",streetAddress:"112 Nguyễn Văn Cừ",addressLocality:"Bồ Đề, Long Biên, Hanói",addressCountry:"VN"}},{"@type":"WebSite","@id":base+"#website",url:base,name:c.site.title,inLanguage:"ja",publisher:{"@id":base+"#organization"}},{"@type":"WebPage","@id":abs(p.url)+"#webpage",url:abs(p.url),name:p.title,description:p.desc,inLanguage:"ja",isPartOf:{"@id":base+"#website"}}];if(p.url!=="/"){const li=[{"@type":"ListItem",position:1,name:"ホーム",item:base}];if(p.type==="taxonomy-archive"){const parent=c.taxonomy.parents.find(x=>x.id===p.parent_id);if(!parent)throw Error("Archive parent not found");li.push({"@type":"ListItem",position:2,name:parent.label,item:abs(parent.url)},{"@type":"ListItem",position:3,name:p.h1,item:abs(p.url)});}else{let u="/";p.url.split("/").filter(Boolean).forEach((part,i)=>{u+=part+"/";li.push({"@type":"ListItem",position:i+2,name:get(u)?.h1||part,item:abs(u)})});}graph.push({"@type":"BreadcrumbList",itemListElement:li})}if(p.type==="faq"){graph.push({"@type":"FAQPage",mainEntity:c.faqs.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}}))})}return `<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@graph":graph}).replace(/</g,"\\u003c")}</script>`;}
 const header=p=>`<a class="skip" href="#content">本文へ移動</a><header class="header"><div class="wrap top"><a class="logo" href="/"><span class="mark">N</span><span>NGUYỄN TÚ<small>ハノイのバイクレンタル</small></span></a><nav class="nav" aria-label="メインメニュー">${nav(p)}</nav><div class="tools"><button id="theme-toggle" class="tool" type="button" aria-label="テーマ切替">◐</button><button id="menu-toggle" class="tool mobile-trigger" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="メニューを開く">☰</button></div></div><nav id="mobile-nav" class="wrap mobile-nav" aria-label="スマートフォンメニュー" hidden>${nav(p)}</nav></header>`;
 const footer=`<footer class="footer"><div class="wrap"><div class="foot-grid"><div><h3>NGUYỄN TÚ · ハノイ</h3><p>${E(B.address)}</p><p>${E(B.hours)} · 毎日</p></div><div><h3>Explorar</h3><nav class="foot-links" aria-label="Secciones">${nav({url:""})}${link("/about/","運営者情報")}</nav></div><div><h3>Información</h3><nav class="foot-links" aria-label="Datos y condiciones">${link("/privacy-policy/","プライバシー")}${link("/terms/","利用規約")}${link(B.maps,"Google Maps")}${link("tel:"+B.tel,B.phone)}</nav></div></div><div class="foot-bottom"><span>© ${new Date().getUTCFullYear()} ${E(B.name)}. 参考情報。</span><span>赤・黒・白 · 日本語</span></div></div></footer>`;
 const callout=`<section class="callout"><div class="wrap"><div><p class="eyebrow">次のステップ</p><h2>自分に合う車両を、条件を確かめて。</h2><p>料金・保証金・受取条件は予約前にご確認ください。</p></div><a class="btn btn-blue" href="tel:${B.tel}">電話する · ${E(B.phone)} ↗</a></div></section>`;
 const breadcrumbs=p=>{if(p.type==="taxonomy-archive"){const parent=c.taxonomy.parents.find(x=>x.id===p.parent_id);if(!parent)throw Error("Archive parent not found");return `<nav class="crumb" aria-label="パンくずリスト">${link("/","ホーム")} / ${link(parent.url,parent.label)} / ${E(p.h1)}</nav>`;}let u="/";return p.url==="/"? "" : `<nav class="crumb" aria-label="パンくずリスト">${link("/","ホーム")}${p.url.split("/").filter(Boolean).map(part=>{u+=part+"/";return ` / ${u===p.url?E(get(u)?.h1||part):link(u,get(u)?.h1||part)}`}).join("")}</nav>`};
 const top=p=>`<section class="page-top"><div class="wrap">${breadcrumbs(p)}<p class="eyebrow">${E(p.label)}</p><h1>${E(p.h1)}</h1><p class="lead">${E(p.intro)}</p></div></section>`;
 const groups=[["セミオート車","Honda Waveなどの車種と料金の目安。","/rental-prices/"],["スクーター","Honda Visionなどの車種と条件を比較。","/bike-types/scooters/"],["50ccクラス","料金・保証金・法令の確認。","/bike-types/50cc/"]];
 const steps=[["車両を選ぶ","運転経験、目的、車種に合わせて選択。","/bike-types/"],["料金を比較","期間・保証金・受取費用を確認。","/rental-prices/"],["条件を確認","書類・保証金・返却条件を確認。","/rental-guide/documents-deposit/"]];
 const cards=items=>`<div class="cards">${items.map(([h,t,u],i)=>`<article class="card"><span class="index">${String(i+1).padStart(2,"0")} / 見る</span><h3>${E(h)}</h3><p>${E(t)}</p>${link(u,"詳しく見る ↗")}</article>`).join("")}</div>`;
 const faq=list=>`<div class="faq">${list.map(([q,a])=>`<details><summary>${E(q)}</summary><p>${E(a)}</p></details>`).join("")}</div>`;
 const prices=()=>`<div class="table-scroll"><table><caption>参考料金（VND）</caption><thead><tr><th>車種</th><th>日額</th><th>週額</th><th>月額</th><th>保証金</th></tr></thead><tbody>${c.prices.map(r=>`<tr>${r.map((v,i)=>i===0?`<th scope="row">${E(v)}</th>`:`<td>${E(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="note">料金と保証金は参考情報です。最終金額や受け渡し、書類、返却条件を契約前に確認してください。</div>`;
 const home=()=>`<section class="hero"><div class="wrap hero-grid"><div><p class="eyebrow">ハノイのバイクレンタル</p><h1>ハノイを、<br><span style="color:#ff8e98">自分のペースで。</span></h1><p class="lead">${E(c.pages[0].intro)}</p><div class="actions"><a class="btn btn-blue" href="/bike-types/">車種を見る ↗</a><a class="btn" href="/rental-prices/" style="color:#fff;border-color:#7c9fb9">料金を見る</a></div></div><div class="art">${bike}</div></div><div class="wrap rail"><span><strong>01</strong> · Atención directa</span><span><strong>02</strong> · 車種s variados</span><span><strong>03</strong> · Precios orientativos</span><span><strong>04</strong> · Long Biên, Hanói</span></div></section><section class="section"><div class="wrap"><div class="section-head"><p class="eyebrow">車種を選ぶ</p><h2>目的に合った一台を選ぶ。</h2><p>車種の違いを比べ、実際の条件をご確認ください。</p></div>${cards(groups)}</div></section><section class="section alt"><div class="wrap split"><div><p class="eyebrow">ご利用前の情報</p><h2>走る前に、情報を。</h2></div><div><p>車両の選択だけでなく、利用期間、保証金、必要書類と契約内容を確認することが大切です。</p><p>Nguyễn Túの案内を日本語で整理し、相談前に必要な情報を確認できるようにしました。</p>${link("/rental-guide/","レンタルガイドを見る ↗")}</div></div></section><section class="section"><div class="wrap"><div class="section-head"><p class="eyebrow">予約の前に</p><h2>確認したい三つの項目。</h2></div>${cards(steps)}</div></section><section class="section alt"><div class="wrap split"><div><p class="eyebrow">よくあるご質問</p><h2>根拠のない約束はしません。</h2><p>保証金s, modelos, licencias y horarios.</p></div><div>${faq(c.faqs.slice(0,4))}<p style="margin-top:20px">${link("/faq/","よくある質問をすべて見る ↗")}</p></div></div></section>`;
 function body(p){if(p.type==="home")return home();let h=top(p);if(p.type==='taxonomy-parent')return h;if(p.type==='taxonomy-archive')return h+categoryArchiveBody(p,c.taxonomy,c.liveCategories);if(p.type==="models")return h+`<section class="section"><div class="wrap"><div class="section-head"><h2>移動目的から選ぶ。</h2><p>セミオート車とスクーターでは操作方法が異なります。</p></div>${cards(groups)}</div></section>`;
 if(p.type==="prices")return h+`<section class="section"><div class="wrap"><h2>車種別料金</h2>${prices()}<div class="prose" style="padding-top:45px"><h2>予約確定前に</h2><p>月額料金や電動車、50ccクラスの条件は車種や期間で異なるため、個別に確認してください。</p><p>週額が日額の7倍とは限りません。希望期間の合計金額をご確認ください。</p>${link("/rental-guide/documents-deposit/","必要書類と保証金 ↗")}</div></div></section>`;
 if(p.type==="guide")return h+`<section class="section"><div class="wrap"><h2>運転前に確認してください。</h2>${cards(steps)}<div class="prose" style="padding-top:50px"><h2>安全と運転資格</h2><p>運転資格、現地交通規則、ヘルメット、保険、車両状態を必ず確認してください。排気量だけで免許不要と判断しないでください。</p><p>受取時にはタイヤ、ブレーキ、ミラー、ライトを確認し、返却条件も確かめましょう。</p></div></div></section>`;
 if(p.type==="article"){
  const sections=p.article.sections.map(s=>'<section><h2>'+E(s.heading)+'</h2>'+s.paragraphs.map(t=>'<p>'+E(t)+'</p>').join('')+'</section>').join('');
  const faq=(p.article.faq||[]).map(t=>'<h3>'+E(t.question)+'</h3><p>'+E(t.answer)+'</p>').join('');
  const related=(p.article.related||[]).filter(u=>u!==p.url&&c.pages.some(v=>v.url===u)).slice(0,8).map(u=>link(u,get(u)?.title||u)).join(' ');
  return h+articleCategoryTrail(p,c.taxonomy,c.pages)+'<section class="section"><div class="wrap prose"><article>'+sections+(faq?'<section><h2>関連する質問</h2>'+faq+'</section>':'')+'<div class="more"><h2>関連記事</h2>'+related+'</div></article></div></section>';
 }
 if(p.type==="faq")return h+`<section class="section"><div class="wrap"><p class="eyebrow">20 PREGUNTAS Y RESPUESTAS</p>${faq(c.faqs)}</div></section>`;
 if(p.type==="contact")return h+`<section class="section"><div class="wrap split"><div><h2>来店前の確認を。</h2><p>希望の日程、車種、受渡し場所をお知らせください。</p></div><div class="box"><h3>Nguyễn Tú</h3><dl><dt>住所</dt><dd>${E(B.address)}</dd><dt>電話・Zalo</dt><dd>${link("tel:"+B.tel,B.phone)}</dd><dt>海外から</dt><dd>${link("tel:"+B.tel,B.international)}</dd><dt>営業時間</dt><dd>${E(B.hours)}, 毎日</dd></dl><div class="actions"><a class="btn btn-blue" href="tel:${B.tel}">電話する ↗</a><a class="btn btn-outline" href="${B.maps}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div></div></div></section>`;
 return h+`<section class="section"><div class="wrap prose">${p.sections.map(([title,content])=>`<section><h2>${E(title)}</h2><p>${E(content)}</p></section>`).join("")}<div class="more">${link("/rental-prices/","料金 ↗")}${link("/faq/","よくある質問 ↗")}${link("/contact/","お問い合わせ ↗")}</div></div></section>`;}
 for(const p of c.pages){const file=p.url==="/"? "index.html":p.url.slice(1)+"index.html";out[file]=layoutHead(p)+header(p)+`<main id="content">${body(p)}${callout}</main>`+footer+`<script src="/assets/js/app.js" defer></script></body></html>`;}
 out["404.html"]=`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>ページが見つかりません · Nguyễn Tú</title><link rel="stylesheet" href="/assets/css/theme.css"></head><body><main class="wrap section"><p class="eyebrow">ERROR 404</p><h1>ページが見つかりません。</h1><a class="btn btn-blue" href="/">ホームへ戻る ↗</a></main></body></html>`;
 out["robots.txt"]=`User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`;
 out["sitemap.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${c.pages.map(p=>`<url><loc>${abs(p.url)}</loc></url>`).join("")}</urlset>`;
 return out;
}

const registry=JSON.parse(fs.readFileSync(path.join(root,'data/editorial-plan.json'),'utf8')).articles;
const published=JSON.parse(fs.readFileSync(path.join(root,'data/factory-state.json'),'utf8')).published_ids;
const taxonomy=JSON.parse(fs.readFileSync(path.join(root,'site/taxonomy.json'),'utf8'));
validateTaxonomy(taxonomy,registry,published,data.pages);
const accepted=[];
for(const id of published){
 const row=registry.find(p=>p.id===id);
 if(!row)throw Error('Unplanned published article '+id);
 const article=JSON.parse(fs.readFileSync(path.join(root,'content/articles',id+'.json'),'utf8'));
 if(article.id!==row.id)throw Error('Bad article ID '+id);
 const page={url:row.url,type:'article',title:article.title,desc:article.description,h1:article.h1,intro:article.intro,
 label:'ARTÍCULO · '+row.primary_keyword,hub:row.hub,parent_id:row.parent_id,category_id:row.category_id,article};
 if(data.pages.some(p=>p.url===page.url))throw Error('Duplicate canonical '+page.url);
 data.pages.push(page);accepted.push(page);
}
data.taxonomy=taxonomy;
data.liveCategories=decorateTaxonomy(taxonomy,data.pages,accepted);
const files=generate(data);

const escapeHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
for(const page of accepted){
 const filename=page.url.slice(1)+'index.html';
 const schema={'@context':'https://schema.org','@type':'Article',headline:page.title,description:page.desc,inLanguage:'es',
  mainEntityOfPage:data.site.base.slice(0,-1)+page.url,datePublished:page.article.published_at,
  dateModified:page.article.published_at,author:{'@type':'Organization',name:data.business.name},
  publisher:{'@type':'Organization',name:data.business.name}};
 files[filename]=files[filename].replace('</head>','<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script></head>');
}
for(const page of data.pages.filter(p=>p.type!=='article'&&p.type!=='taxonomy-archive')){
 const html=parentCategorySection(page.url,taxonomy,data.liveCategories,data.pages);
 if(!html)continue;
 const filename=page.url==='/'?'index.html':page.url.slice(1)+'index.html';
 files[filename]=files[filename].replace('<section class="callout">',html+'<section class="callout">');
}
const check=process.argv.includes('--check');let stale=0;
for(const [p,s] of Object.entries(files)){
 const dest=path.join(root,p);
 if(check){if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==s){stale++;console.error('STALE '+p)}}
 else{fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,s,'utf8')}
}
if(check&&stale)process.exitCode=1;
else console.log((check?'Verified ':'Generated ')+Object.keys(files).length+' HTML/SEO files; articles='+accepted.length);

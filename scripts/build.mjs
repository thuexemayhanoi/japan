// Rebuild all static HTML, canonical tags, breadcrumbs, schema and sitemap without dependencies.
// Usage: node scripts/build.mjs
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {validateTaxonomy,decorateTaxonomy,taxonomyMenu,parentCategorySection,categoryArchiveBody,articleCategoryTrail} from './taxonomy.mjs';
import {validateNonPostSEO,applyNonPostSEO,renderNonPostSEO} from './nonpost-seo.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'site/data.json'),'utf8'));
const nonpostMatrix=JSON.parse(fs.readFileSync(path.join(root,'site/nonpost-seo.json'),'utf8'));

function generate(c){
 const out={}, base=c.site.base, B=c.business, E=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"), abs=url=>base.slice(0,-1)+url, link=(url,label)=>`<a href="${E(url)}">${E(label)}</a>`;
 const get=url=>c.pages.find(x=>x.url===url);
 const nav=p=>taxonomyMenu(c.taxonomy,c.pages,c.liveCategories,p);
 const layoutHead=p=>`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${E(p.desc)}"><meta name="theme-color" content="#c71929">${c.site.googleSiteVerification?'<meta name="google-site-verification" content="'+E(c.site.googleSiteVerification)+'">':''}<meta name="robots" content="index,follow"><link rel="canonical" href="${abs(p.url)}"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="stylesheet" href="/assets/css/theme.css"><meta property="og:type" content="website"><meta property="og:locale" content="ja_JP"><meta property="og:title" content="${E(p.title)}"><meta property="og:description" content="${E(p.desc)}"><meta property="og:url" content="${abs(p.url)}"><meta name="twitter:card" content="summary"><title>${E(p.title)}</title>${schema(p)}</head><body>`;
 function schema(p){const graph=[{"@type":"LocalBusiness","@id":base+"#organization",name:B.name,telephone:B.tel,url:base,hasMap:B.maps,openingHoursSpecification:[{"@type":"OpeningHoursSpecification",dayOfWeek:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],opens:B.hours.split("–")[0],closes:B.hours.split("–")[1]}],address:{"@type":"PostalAddress",streetAddress:"112 Nguyễn Văn Cừ",addressLocality:"Bồ Đề, ハノイ・ロンビエン",addressCountry:"VN"}},{"@type":"WebSite","@id":base+"#website",url:base,name:c.site.title,inLanguage:"ja",publisher:{"@id":base+"#organization"}},{"@type":"WebPage","@id":abs(p.url)+"#webpage",url:abs(p.url),name:p.title,description:p.desc,inLanguage:"ja",isPartOf:{"@id":base+"#website"}}];if(p.url!=="/"){const li=[{"@type":"ListItem",position:1,name:"ホーム",item:base}];if(p.type==="taxonomy-archive"){const parent=c.taxonomy.parents.find(x=>x.id===p.parent_id);if(!parent)throw Error("Archive parent not found");li.push({"@type":"ListItem",position:2,name:parent.label,item:abs(parent.url)},{"@type":"ListItem",position:3,name:p.h1,item:abs(p.url)});}else{let u="/";p.url.split("/").filter(Boolean).forEach((part,i)=>{u+=part+"/";li.push({"@type":"ListItem",position:i+2,name:get(u)?.h1||part,item:abs(u)})});}graph.push({"@type":"BreadcrumbList",itemListElement:li})}if(p.type==="faq"){graph.push({"@type":"FAQPage",mainEntity:c.faqs.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}}))})}return `<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@graph":graph}).replace(/</g,"\\u003c")}</script>`;}
 const header=p=>`<a class="skip" href="#content">本文へ移動</a><header class="header"><div class="wrap top"><a class="logo" href="/"><span class="mark">N</span><span>NGUYỄN TÚ<small>ハノイのバイクレンタル</small></span></a><nav class="nav" aria-label="メインメニュー">${nav(p)}</nav><div class="tools"><button id="search-toggle" class="tool" type="button" aria-label="記事を検索" aria-expanded="false" aria-controls="search-panel">⌕</button><button id="theme-toggle" class="tool" type="button" aria-label="テーマ切替">◐</button><button id="menu-toggle" class="tool mobile-trigger" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="メニューを開く">☰</button></div></div><nav id="mobile-nav" class="wrap mobile-nav" aria-label="スマートフォンメニュー" hidden>${nav(p)}</nav></header>`;
 const footer=`<footer class="footer"><div class="wrap"><div class="foot-grid"><div><h3>NGUYỄN TÚ · ハノイ</h3><p>${E(B.address)}</p><p>${E(B.hours)} · 毎日</p></div><div><h3>カテゴリー・メニュー</h3><nav class="foot-links" aria-label="フッターメニュー">${nav({url:""})}${link("/about/","運営者情報")}</nav></div><div><h3>ご案内</h3><nav class="foot-links" aria-label="サービス情報とご利用条件">${link("/privacy-policy/","プライバシー")}${link("/terms/","利用規約")}${link(B.maps,"Google Maps")}${link("tel:"+B.tel,B.phone)}</nav></div></div><div class="foot-bottom"><span>© ${new Date().getUTCFullYear()} ${E(B.name)}. 参考情報。</span><span>赤・黒・白 · 日本語</span></div></div></footer>`;
 const callout=`<section class="callout"><div class="wrap"><div><p class="eyebrow">次のステップ</p><h2>自分に合う車両を、条件を確かめて。</h2><p>料金・保証金・受取条件は予約前にご確認ください。</p></div><a class="btn btn-blue" href="tel:${B.tel}">電話する · ${E(B.phone)} ↗</a></div></section>`;
 const breadcrumbs=p=>{if(p.type==="taxonomy-archive"){const parent=c.taxonomy.parents.find(x=>x.id===p.parent_id);if(!parent)throw Error("Archive parent not found");return `<nav class="crumb" aria-label="パンくずリスト">${link("/","ホーム")} / ${link(parent.url,parent.label)} / ${E(p.h1)}</nav>`;}let u="/";return p.url==="/"? "" : `<nav class="crumb" aria-label="パンくずリスト">${link("/","ホーム")}${p.url.split("/").filter(Boolean).map(part=>{u+=part+"/";return ` / ${u===p.url?E(get(u)?.h1||part):link(u,get(u)?.h1||part)}`}).join("")}</nav>`};
 const top=p=>`<section class="page-top"><div class="wrap">${breadcrumbs(p)}<p class="eyebrow">${E(p.label)}</p><h1>${E(p.h1)}</h1><p class="lead">${E(p.intro)}</p></div></section>`;
 const groups=[["セミオート車","Honda Waveなどの車種と料金の目安。","/rental-prices/"],["スクーター","Honda Visionなどの車種と条件を比較。","/bike-types/scooters/"],["50ccクラス","料金・保証金・法令の確認。","/bike-types/50cc/"]];
 const steps=[["車両を選ぶ","運転経験、目的、車種に合わせて選択。","/bike-types/"],["料金を比較","期間・保証金・受取費用を確認。","/rental-prices/"],["条件を確認","書類・保証金・返却条件を確認。","/rental-guide/documents-deposit/"]];
 const cards=items=>`<div class="cards">${items.map(([h,t,u],i)=>`<article class="card"><span class="index">${String(i+1).padStart(2,"0")} / 見る</span><h3>${E(h)}</h3><p>${E(t)}</p>${link(u,"詳しく見る ↗")}</article>`).join("")}</div>`;
 const faq=list=>`<div class="faq">${list.map(([q,a])=>`<details><summary>${E(q)}</summary><p>${E(a)}</p></details>`).join("")}</div>`;
 const prices=()=>`<div class="table-scroll"><table><caption>参考料金（VND）</caption><thead><tr><th>車種</th><th>日額</th><th>週額</th><th>月額</th><th>保証金</th></tr></thead><tbody>${c.prices.map(r=>`<tr>${r.map((v,i)=>i===0?`<th scope="row">${E(v)}</th>`:`<td>${E(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="note">料金と保証金は参考情報です。最終金額や受け渡し、書類、返却条件を契約前に確認してください。</div>`;
 const calculator=()=>{
  const config=c.rentalCalculator;
  if(!config||!Array.isArray(config.models)||config.models.length!==2)throw Error('Calculator missing prices');
  const fmt=v=>new Intl.NumberFormat('ja-JP').format(v)+' VND';
  const options=config.models.map((m,i)=>'<label class="quote-choice">'+
    '<input type="radio" name="quote-model" value="'+E(m.id)+'" data-daily-vnd="'+m.dailyVnd+'"'+(i===0?' checked':'')+'>'+
    '<span class="quote-choice-content"><strong>'+E(m.label)+'</strong><small>'+E(m.example)+'</small>'+
    '<b>'+fmt(m.dailyVnd)+' <span>/ 日</span></b></span></label>').join('');
  return '<div class="quote-card" data-rental-calculator data-max-days="'+config.maxDays+
   '" data-daily-max="'+config.maxDailyEstimateDays+'" aria-labelledby="calculator-title">'+
   '<div class="quote-head"><span class="quote-kicker">QUICK ESTIMATE · VND</span><h2 id="calculator-title">料金シミュレーター</h2>'+
   '<p>車種と日数を選ぶと、参考料金を自動計算します。</p></div>'+
   '<fieldset class="quote-options"><legend>レンタルする車種</legend><div class="quote-choice-grid">'+options+'</div></fieldset>'+
   '<div class="quote-duration"><label for="quote-days">利用日数</label><div class="quote-stepper">'+
   '<button type="button" data-day-step="-1" aria-label="日数を1日減らす">−</button>'+
   '<input id="quote-days" type="number" min="1" max="'+config.maxDays+'" step="1" value="1" inputmode="numeric" aria-describedby="quote-days-help">'+
   '<button type="button" data-day-step="1" aria-label="日数を1日増やす">＋</button><span>日</span></div>'+
   '<small id="quote-days-help">7日以上は個別のお見積もりです。</small></div>'+
   '<div class="quote-result" aria-live="polite" aria-atomic="true"><span>参考レンタル料金</span>'+
   '<output id="quote-total">'+fmt(config.models[0].dailyVnd)+'</output>'+
   '<small id="quote-formula">'+fmt(config.models[0].dailyVnd)+' × 1日</small></div>'+
   '<p class="quote-disclaimer">'+E(config.disclaimer)+'</p>'+
   '<div class="quote-buttons"><a class="quote-call" href="tel:'+E(B.tel)+'">電話で確認する ↗</a>'+
   '<a class="quote-zalo" href="'+E(B.zalo)+'" target="_blank" rel="noopener noreferrer">Zaloで相談 ↗</a></div>'+
   '<p class="quote-trust">Nguyễn Tú · 09:00–21:00 · ハノイ・ロンビエン</p></div>';
 };
 const home=p=>`<section class="hero hero-calculator"><div class="wrap hero-grid"><div class="hero-copy"><p class="eyebrow">ハノイのバイクレンタル</p><h1>${E(p.h1).split('｜').map((v,i)=>i?'<span style="color:#ff8e98">'+v+'</span>':v).join('<br>')}</h1><p class="lead">${E(c.pages[0].intro)}</p><div class="actions"><a class="btn btn-blue" href="/bike-types/">車種を見る ↗</a><a class="btn" href="/rental-prices/" style="color:#fff;border-color:#7c9fb9">料金を見る</a></div></div><div class="hero-quote">${calculator()}</div></div><div class="wrap rail"><span><strong>01</strong> · 直接お問い合わせ</span><span><strong>02</strong> · さまざまな車種</span><span><strong>03</strong> · 料金の目安</span><span><strong>04</strong> · ハノイ・ロンビエン</span></div></section><section class="section"><div class="wrap"><div class="section-head"><p class="eyebrow">車種を選ぶ</p><h2>目的に合った一台を選ぶ。</h2><p>車種の違いを比べ、実際の条件をご確認ください。</p></div>${cards(groups)}</div></section><section class="section alt"><div class="wrap split"><div><p class="eyebrow">ご利用前の情報</p><h2>走る前に、情報を。</h2></div><div><p>車両の選択だけでなく、利用期間、保証金、必要書類と契約内容を確認することが大切です。</p><p>Nguyễn Túの案内を日本語で整理し、相談前に必要な情報を確認できるようにしました。</p>${link("/rental-guide/","レンタルガイドを見る ↗")}</div></div></section><section class="section"><div class="wrap"><div class="section-head"><p class="eyebrow">予約の前に</p><h2>確認したい三つの項目。</h2></div>${cards(steps)}</div></section><section class="section alt"><div class="wrap split"><div><p class="eyebrow">よくあるご質問</p><h2>根拠のない約束はしません。</h2><p>保証金、車種、運転資格、営業時間についてご案内します。</p></div><div>${faq(c.faqs.slice(0,4))}<p style="margin-top:20px">${link("/faq/","よくある質問をすべて見る ↗")}</p></div></div></section>`;
 function body(p){if(p.type==="home")return home(p);let h=top(p);if(p.type==='taxonomy-parent')return h;if(p.type==='taxonomy-archive')return h+categoryArchiveBody(p,c.taxonomy,c.liveCategories);if(p.type==="models")return h+`<section class="section"><div class="wrap"><div class="section-head"><h2>移動目的から選ぶ。</h2><p>セミオート車とスクーターでは操作方法が異なります。</p></div>${cards(groups)}</div></section>`;
 if(p.type==="prices")return h+`<section class="section"><div class="wrap"><h2>車種別料金</h2>${prices()}<div class="prose" style="padding-top:45px"><h2>予約確定前に</h2><p>月額料金や電動車、50ccクラスの条件は車種や期間で異なるため、個別に確認してください。</p><p>週額が日額の7倍とは限りません。希望期間の合計金額をご確認ください。</p>${link("/rental-guide/documents-deposit/","必要書類と保証金 ↗")}</div></div></section>`;
 if(p.type==="guide")return h+`<section class="section"><div class="wrap"><h2>運転前に確認してください。</h2>${cards(steps)}<div class="prose" style="padding-top:50px"><h2>安全と運転資格</h2><p>運転資格、現地交通規則、ヘルメット、保険、車両状態を必ず確認してください。排気量だけで免許不要と判断しないでください。</p><p>受取時にはタイヤ、ブレーキ、ミラー、ライトを確認し、返却条件も確かめましょう。</p></div></div></section>`;
 if(p.type==="article"){
  const sections=p.article.sections.map((s,i)=>'<section id="section-'+(i+1)+'"><h2>'+E(s.heading)+'</h2>'+s.paragraphs.map(t=>'<p>'+E(t)+'</p>').join('')+'</section>').join('');
  const toc='<details class="article-toc" open><summary>この記事の目次</summary><ol>'+
    p.article.sections.map((s,i)=>'<li><a href="#section-'+(i+1)+'">'+E(s.heading)+'</a></li>').join('')+'</ol></details>';
  const faq=(p.article.faq||[]).map(t=>'<h3>'+E(t.question)+'</h3><p>'+E(t.answer)+'</p>').join('');
  const siblings=c.liveCategories.get(p.category_id)||[],pos=siblings.findIndex(x=>x.url===p.url);
  const before=pos>0?siblings[pos-1]:null,after=pos>=0&&pos<siblings.length-1?siblings[pos+1]:null;
  const navigation='<nav class="article-prev-next" aria-label="前後の記事">'+
    (before?'<div><span>← 前の記事</span>'+link(before.url,before.title)+'</div>':'<div></div>')+
    (after?'<div><span>次の記事 →</span>'+link(after.url,after.title)+'</div>':'<div></div>')+'</nav>';
  const candidates=[...p.article.related,...siblings.filter(x=>x.url!==p.url).map(x=>x.url)];
  const related=[...new Set(candidates)].filter(u=>u!==p.url&&c.pages.some(v=>v.url===u)).slice(0,3)
    .map(u=>'<li>'+link(u,get(u)?.title||u)+'</li>').join('');
  const author='<aside class="author-box"><strong>記事の運営者：'+E(B.name)+'</strong><p>ハノイでのバイクレンタルに役立つ現地サービス情報をまとめています。記載の法令・料金・条件は最新情報を直接ご確認ください。</p></aside>';
  return h+articleCategoryTrail(p,c.taxonomy,c.pages)+'<section class="section"><div class="wrap prose"><article>'+
    toc+sections+(faq?'<section><h2>関連する質問</h2>'+faq+'</section>':'')+
    '<div class="more"><h2>関連記事</h2><ul>'+related+'</ul></div>'+navigation+author+'</article></div></section>';
 }
 if(p.type==="faq")return h+`<section class="section"><div class="wrap"><p class="eyebrow">よくある質問と回答</p>${faq(c.faqs)}</div></section>`;
 if(p.type==="contact")return h+`<section class="section"><div class="wrap split"><div><h2>来店前の確認を。</h2><p>希望の日程、車種、受渡し場所をお知らせください。</p></div><div class="box"><h3>Nguyễn Tú</h3><dl><dt>住所</dt><dd>${E(B.address)}</dd><dt>電話・Zalo</dt><dd>${link("tel:"+B.tel,B.phone)}</dd><dt>海外から</dt><dd>${link("tel:"+B.tel,B.international)}</dd><dt>営業時間</dt><dd>${E(B.hours)}, 毎日</dd></dl><div class="actions"><a class="btn btn-blue" href="tel:${B.tel}">電話する ↗</a><a class="btn btn-outline" href="${B.maps}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div></div></div></section>`;
 return h+`<section class="section"><div class="wrap prose">${p.sections.map(([title,content])=>`<section><h2>${E(title)}</h2><p>${E(content)}</p></section>`).join("")}<div class="more">${link("/rental-prices/","料金 ↗")}${link("/faq/","よくある質問 ↗")}${link("/contact/","お問い合わせ ↗")}</div></div></section>`;}
 for(const item of c.pages){const p=item.type==='article'?item:{...item};applyNonPostSEO(p,nonpostMatrix);const file=p.url==="/"? "index.html":p.url.slice(1)+"index.html";out[file]=layoutHead(p)+header(p)+`<section id="search-panel" class="search-panel" role="search" aria-label="サイト内検索" hidden><div class="wrap"><label for="search-input">記事と情報を検索</label><div class="search-input-row"><input id="search-input" type="search" autocomplete="off" placeholder="例：50cc・保証金・免許" /><button id="search-close" type="button" aria-label="検索を閉じる">✕</button></div><ul id="search-results" aria-live="polite"></ul></div></section><main id="content">${body(p)}${renderNonPostSEO(p,nonpostMatrix,c.pages)}${callout}</main><aside class="floating-contact" aria-label="お問い合わせ"><a href="tel:${B.tel}" aria-label="電話でお問い合わせ">☎ 電話</a><a href="${E(B.zalo)}" target="_blank" rel="noopener noreferrer" aria-label="Zaloでお問い合わせ">Zalo</a></aside>`+footer+`<script src="/assets/js/app.js" defer></script>${p.type==="home"?'<script src="/assets/js/rental-calculator.js" defer></script>':""}</body></html>`;}
 out["404.html"]=`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>ページが見つかりません · Nguyễn Tú</title><link rel="stylesheet" href="/assets/css/theme.css"></head><body><main class="wrap section"><p class="eyebrow">ERROR 404</p><h1>ページが見つかりません。</h1><a class="btn btn-blue" href="/">ホームへ戻る ↗</a></main></body></html>`;
 out["search-index.json"]=JSON.stringify(c.pages.map(p=>({title:p.title,description:p.desc||'',url:p.url,
 headings:p.type==='article'?(p.article.sections||[]).map(s=>s.heading):p.sections?.map(s=>s[0])||[]})))+'\n';
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
validateNonPostSEO(nonpostMatrix,data.pages);
const files=generate(data);

const escapeHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
for(const page of accepted){
 const filename=page.url.slice(1)+'index.html';
 const schema={'@context':'https://schema.org','@type':'Article',headline:page.title,description:page.desc,inLanguage:'ja',
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
else {
  // Publish the internal-link graph from the same generated HTML snapshot.
  // Keep every future factory batch consistent without editing Post content.
  execFileSync(process.execPath,[path.join(root,'scripts/internal-link-graph.mjs'),...(check?['--check']:[])],{stdio:'inherit'});
  console.log((check?'Verified ':'Generated ')+Object.keys(files).length+' HTML/SEO files; articles='+accepted.length);
}

// Non-post SEO layer. Render only currently existing public pages; never create archives or change article HTML.
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const normalize=s=>String(s).normalize('NFKC').toLocaleLowerCase('ja').replace(/[\\s\\p{P}\\p{S}]+/gu,'');
export function validateNonPostSEO(matrix,pages){
 if(matrix?.locale!=='ja-JP'||matrix?.domain!=='https://ja.rentbikehanoi.com')throw Error('Nonpost locale/domain mismatch');
 const all=new Set(pages.map(p=>p.url)),nonpost=pages.filter(p=>p.type!=='article'),seen=new Set(),keywords=new Set();
 for(const p of nonpost){
  const m=matrix.pages[p.url];if(!m)throw Error('Missing nonpost SEO matrix entry: '+p.url);
  if(!m.primary_keyword||!m.intent||!m.role||!m.title||!m.description||!m.h1||!m.answer||!Array.isArray(m.sections)||m.sections.length<2)throw Error('Incomplete nonpost SEO: '+p.url);
  if(m.title.length<12||m.description.length<45||m.h1.length<8||m.answer.length<45)throw Error('Thin nonpost metadata: '+p.url);
  const key=normalize(m.primary_keyword);if(keywords.has(key))throw Error('Nonpost keyword overlap: '+p.url);keywords.add(key);
  if(seen.has(m.title))throw Error('Duplicate nonpost title: '+p.url);seen.add(m.title);
  for(const x of m.sections){if(!x.heading||!x.text||x.text.length<60)throw Error('Thin nonpost section: '+p.url)}
  if(!Array.isArray(m.links)||m.links.length<2)throw Error('Missing contextual links: '+p.url);
  for(const l of m.links)if(!all.has(l.url)||l.url===p.url||!l.label)throw Error('Invalid nonpost internal link '+p.url+' -> '+l.url);
 }
}
export function applyNonPostSEO(p,matrix){
 if(p.type==='article')return;
 const e=matrix.pages[p.url];if(!e)return;
 p.title=e.title;p.desc=e.description;p.h1=e.h1;
}
export function renderNonPostSEO(p,matrix,pages){
 if(p.type==='article')return '';
 const info=matrix.pages[p.url];if(!info)return '';
 const allowed=new Set(pages.map(p=>p.url));
 const paragraphs=info.sections.map(s=>'<section class="nonpost-seo-section"><h2>'+esc(s.heading)+'</h2><p>'+esc(s.text)+'</p></section>').join('');
 const links=info.links.filter(x=>allowed.has(x.url)).map(x=>'<li><a href="'+esc(x.url)+'">'+esc(x.label)+' ↗</a></li>').join('');
 return '<section class="section nonpost-seo" aria-label="日本語のご利用案内"><div class="wrap prose"><div class="nonpost-answer"><h2>このページの要点</h2><p>'+esc(info.answer)+'</p></div>'+paragraphs+'<nav aria-label="関連するご案内"><h2>関連するご案内</h2><ul class="nonpost-seo-links">'+links+'</ul></nav></div></section>';
}

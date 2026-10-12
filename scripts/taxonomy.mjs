// A1–A3: taxonomy presentation helpers, no dependencies and no writer mutation.
export function validateTaxonomy(taxonomy,plan,publishedIds,originalPages){
 if(taxonomy.parents?.length!==5)throw Error('Expected exactly 5 parent categories');
 const parents=new Map(),children=new Map();
 let total=0;
 for(const p of taxonomy.parents){
  if(!p.id||parents.has(p.id)||!p.url?.startsWith('/')||p.children.length!==4)throw Error('Invalid parent taxonomy '+p.id);
  parents.set(p.id,p);total+=p.planned_capacity;
  const sum=p.children.reduce((n,c)=>n+c.planned_capacity,0);
  if(sum!==p.planned_capacity)throw Error('Category quota mismatch: '+p.id);
  for(const c of p.children){
   if(children.has(c.id)||!/^[a-z0-9-]+$/.test(c.id))throw Error('Duplicate/invalid category '+c.id);
   children.set(c.id,p);
  }
 }
 if(children.size!==20||total!==200)throw Error('Expected 20 children / 200 planning capacity');
 const ids=new Set(),urls=new Set();
 for(const a of plan){
  if(ids.has(a.id)||urls.has(a.url))throw Error('Duplicate article ID/URL '+a.id);
  ids.add(a.id);urls.add(a.url);
  const parent=parents.get(a.parent_id);
  if(!parent||children.get(a.category_id)?.id!==parent.id)throw Error('Invalid classification '+a.id);
  if(!a.url.startsWith(a.hub)||!a.url.endsWith('/'))throw Error('Protected article URL must remain hub+slug: '+a.id);
  if(!a.url.endsWith('/'+a.slug+'/'))throw Error('Slug conflict '+a.id);
 }
 for(const id of publishedIds)if(!ids.has(id))throw Error('Published ID missing from matrix '+id);
 for(const p of originalPages)if(!p.url.startsWith('/'))throw Error('Invalid original page');
 return {parents,children};
}
export function archiveUrl(parent,child){return '/categories/'+parent.id+'/'+child.id+'/';}
export function decorateTaxonomy(taxonomy,pages,accepted){
 const originals=new Set(pages.map(p=>p.url));
 const liveCategories=new Map(taxonomy.parents.flatMap(p=>p.children.map(c=>[c.id,[]])));
 const parents=new Map(taxonomy.parents.map(p=>[p.id,p]));
 for(const article of accepted){
  const parent=parents.get(article.parent_id);
  if(!parent||!parent.children.some(c=>c.id===article.category_id))throw Error('Published taxonomy mismatch '+article.url);
  liveCategories.get(article.category_id).push(article);
 }
 for(const parent of taxonomy.parents){
  const count=parent.children.reduce((n,ch)=>n+liveCategories.get(ch.id).length,0);
  if(count&&!originals.has(parent.url)){
   pages.push({url:parent.url,type:'taxonomy-parent',title:parent.label+' | ハノイのバイクレンタル',desc:parent.description,
      h1:parent.label,intro:parent.description,label:'ハノイのご案内',parent_id:parent.id});
   originals.add(parent.url);
  }
  for(const child of parent.children){
   const group=liveCategories.get(child.id);
   if(group.length>=taxonomy.separate_archive_min_articles){
    const url=archiveUrl(parent,child);
    if(originals.has(url))throw Error('Archive collides with existing URL '+url);
    pages.push({url,type:'taxonomy-archive',title:child.label+' | ハノイの関連記事',
       desc:child.description+' 現地で役立つ情報を紹介します。',
       h1:child.label,intro:child.description,label:parent.label.toUpperCase(),
       parent_id:parent.id,category_id:child.id});
    originals.add(url);
   }
  }
 }
 return liveCategories;
}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function taxonomyMenu(taxonomy,pages,categoryMap,current){
 const routes=new Set(pages.map(p=>p.url));
 const mainLink=(name,url)=>'<a href="'+esc(url)+'"'+(current.url===url?' aria-current="page"':'')+'>'+esc(name)+'</a>';
 let html=mainLink('ホーム','/');
 for(const parent of taxonomy.parents){
  const available=routes.has(parent.url);
  const items=parent.children.map(child=>{
   const count=categoryMap.get(child.id)?.length||0;
   const archive=archiveUrl(parent,child);
   const href=routes.has(archive)?archive:(available&&count>0?parent.url+'#category-'+child.id:null);
   return href?'<a href="'+esc(href)+'">'+esc(child.label)+' <span class="taxonomy-count">'+count+'</span></a>':
    '<span class="taxonomy-unavailable" aria-disabled="true">'+esc(child.label)+' <small>準備中</small></span>';
  }).join('');
  const landing=available?'<a class="taxonomy-all" href="'+esc(parent.url)+'">すべての'+esc(parent.label)+' ↗</a>':'';
  html+='<details class="nav-group"><summary>'+esc(parent.nav_label)+'</summary><div class="nav-panel">'+
    '<strong class="nav-panel-heading">'+esc(parent.label)+'</strong>'+landing+items+'</div></details>';
 }
 return html+mainLink('FAQ','/faq/')+mainLink('Contacto','/contacto/');
}
export function parentCategorySection(parentUrl,taxonomy,liveCategories,pages){
 const parent=taxonomy.parents.find(p=>p.url===parentUrl);if(!parent)return '';
 const published=parent.children.filter(c=>(liveCategories.get(c.id)||[]).length);
 if(!published.length)return '';
 const routes=new Set(pages.map(p=>p.url));
 const entries=published.map(child=>{
  const items=liveCategories.get(child.id);
  const archive=archiveUrl(parent,child);
  const heading=routes.has(archive)?'<a href="'+esc(archive)+'">'+esc(child.label)+' ↗</a>':esc(child.label);
  return '<section class="taxonomy-category" id="category-'+child.id+'"><h3>'+heading+
   '</h3><p>'+esc(child.description)+'</p><ul class="taxonomy-article-list">'+
   items.map(a=>'<li><a href="'+esc(a.url)+'">'+esc(a.title)+'</a></li>').join('')+'</ul></section>';
 }).join('');
 return '<section class="section alt taxonomy-section" aria-label="関連記事 por categorías"><div class="wrap">'+
 '<p class="eyebrow">EXPLORAR POR CATEGORÍA</p><h2>'+esc(parent.label)+': artículos organizados</h2>'+
 '<div class="taxonomy-grid">'+entries+'</div></div></section>';
}
export function categoryArchiveBody(page,taxonomy,liveCategories){
 const parent=taxonomy.parents.find(p=>p.id===page.parent_id);
 const child=parent?.children.find(c=>c.id===page.category_id);
 if(!parent||!child)throw Error('Archive classification missing '+page.url);
 const articles=liveCategories.get(child.id)||[];
 return '<section class="section"><div class="wrap"><p><a href="'+esc(parent.url)+'">← '+esc(parent.label)+'</a></p>'+
 '<h2>関連記事 · '+esc(child.label)+'</h2><p>'+esc(child.description)+'</p><ul class="taxonomy-article-list">'+
 articles.map(a=>'<li><a href="'+esc(a.url)+'">'+esc(a.title)+'</a><p>'+esc(a.intro.slice(0,180))+'…</p></li>').join('')+
 '</ul></div></section>';
}
export function articleCategoryTrail(page,taxonomy,pages){
 const parent=taxonomy.parents.find(p=>p.id===page.parent_id);
 const child=parent?.children.find(x=>x.id===page.category_id);
 if(!parent||!child||!pages.some(x=>x.url===parent.url))return '';
 const archive=archiveUrl(parent,child);
 const href=pages.some(p=>p.url===archive)?archive:parent.url+'#category-'+child.id;
 return '<nav class="article-category-trail" aria-label="記事カテゴリー"><a href="'+esc(href)+'">'+
 esc(parent.label)+' › '+esc(child.label)+'</a></nav>';
}

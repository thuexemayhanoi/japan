/* Homepage quote calculator; static HTML fallback displays default 1-day estimate. */
(function(){
  'use strict';
  function calculateQuote(rate,days,maxDailyDays,maxDays){
    const r=Number(rate),d=Number(days),cap=Number(maxDailyDays),limit=Number(maxDays);
    if(!Number.isSafeInteger(r)||r<=0||!Number.isSafeInteger(d)||d<1||d>limit||!Number.isSafeInteger(cap)||cap<1||cap>=limit){
      return {kind:'invalid',total:null};
    }
    if(d>cap)return {kind:'quote',total:null};
    const total=r*d;
    if(!Number.isSafeInteger(total))return {kind:'invalid',total:null};
    return {kind:'estimate',total};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={calculateQuote};
  if(typeof document==='undefined')return;
  const root=document.querySelector('[data-rental-calculator]');
  if(!root)return;
  const choices=[...root.querySelectorAll('input[name="quote-model"]')];
  const daysInput=root.querySelector('#quote-days');
  const output=root.querySelector('#quote-total'),formula=root.querySelector('#quote-formula');
  const steps=[...root.querySelectorAll('[data-day-step]')];
  const maxDays=Number(root.dataset.maxDays),dailyMax=Number(root.dataset.dailyMax);
  const format=v=>new Intl.NumberFormat('ja-JP').format(v)+' VND';
  function paint(){
    const choice=choices.find(x=>x.checked)||choices[0];
    const rate=Number(choice?.dataset.dailyVnd);
    const days=Number(daysInput.value);
    const result=calculateQuote(rate,days,dailyMax,maxDays);
    daysInput.setAttribute('aria-invalid',result.kind==='invalid'?'true':'false');
    if(result.kind==='invalid'){
      output.textContent='日数を確認してください';
      formula.textContent='1〜'+maxDays+'日の整数を入力してください。';
    }else if(result.kind==='quote'){
      output.textContent='お問い合わせください';
      formula.textContent=days+'日間：週・月など長期料金は個別見積もりです。';
    }else{
      output.textContent=format(result.total);
      formula.textContent=format(rate)+' × '+days+'日';
    }
    steps.forEach(b=>{const delta=Number(b.dataset.dayStep);b.disabled=result.kind!=='invalid'&&(delta<0?days<=1:days>=maxDays)});
  }
  choices.forEach(x=>x.addEventListener('change',paint));
  daysInput.addEventListener('input',paint);
  daysInput.addEventListener('change',paint);
  steps.forEach(b=>b.addEventListener('click',()=>{
    let n=Number(daysInput.value);
    if(!Number.isSafeInteger(n))n=1;
    daysInput.value=String(Math.min(maxDays,Math.max(1,n+Number(b.dataset.dayStep))));
    paint();
  }));
  paint();
})();

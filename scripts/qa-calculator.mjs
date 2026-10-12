// Checks calculator math, page semantics, source-of-truth and unaffected SEO inventory.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const config=JSON.parse(read('site/data.json')).rentalCalculator;
const {calculateQuote}=createRequire(import.meta.url)('../assets/js/rental-calculator.js');
const state=JSON.parse(read('data/factory-state.json')),queue=JSON.parse(read('data/writer-queue.json'));
const html=read('index.html'),css=read('assets/css/theme.css'),js=read('assets/js/rental-calculator.js');
const problems=[],check=(condition,message)=>{if(!condition)problems.push(message)};
check(config.models.length===2,'Expected two priced models');
const rates=Object.fromEntries(config.models.map(x=>[x.id,x.dailyVnd]));
check(rates.manual===150000&&rates.scooter===200000,'Price source differs from confirmed daily prices');
check(read('site/data.json').includes('"maxDailyEstimateDays": 6'),'Days 7+ must use request quote');
check(config.maxDays===30,'Rental length must be bounded by 30 days');
for(const model of config.models){
 check(html.includes('data-daily-vnd="'+model.dailyVnd+'"'),'Missing UI rate '+model.id);
 check(html.includes(model.label),'Missing Japanese model label '+model.id);
 for(let days=1;days<=6;days++){
  const result=calculateQuote(model.dailyVnd,days,6,30);
  check(result.kind==='estimate'&&result.total===model.dailyVnd*days,'Wrong math '+model.id+' day '+days);
 }
 for(const days of [7,14,30]){
  const result=calculateQuote(model.dailyVnd,days,6,30);
  check(result.kind==='quote'&&result.total===null,'Must ask for quote on day '+days);
 }
}
for(const days of [0,-1,31,1.5,NaN,Infinity])check(calculateQuote(150000,days,6,30).kind==='invalid','Unsafe day validation '+days);
check(html.includes('id="quote-total"')&&html.includes('150,000 VND × 1日'),'Server-rendered no-JS default missing');
check(html.includes('data-rental-calculator')&&html.includes('id="quote-days"'),'Semantic calculator UI missing');
check(html.includes('src="/assets/js/rental-calculator.js" defer'),'Calculator javascript not loaded on homepage');
check(!html.includes('class="art"')&&!html.includes('aria-label="赤いバイクのイラスト"'),'Old SVG hero still rendered');
check(html.includes('tel:+84942467674')&&html.includes('https://zalo.me/84942467674'),'Real NAP CTA not linked');
check(html.includes('料金シミュレーター')&&html.includes('保証金'),'Japanese UX or deposit notice missing');
check(css.includes('.hero-calculator')&&css.includes('@media(max-width:460px)'),'Responsive calculator styling absent');
check(js.includes('aria-invalid')&&js.includes('addEventListener'),'Calculator accessible update unavailable');
check(html.includes('rel="canonical" href="https://ja.rentbikehanoi.com/"'),'Home canonical drift');
check((read('sitemap.xml').match(/<url>/g)||[]).length===12,'Sitemap URL count changed');
check(state.enabled===false&&state.published_ids.length===0&&queue.status==='PAUSED','Factory must stay PAUSED, 0 articles');
const prices=read('rental-prices/index.html');
check(prices.includes('150,000 VND')&&prices.includes('200,000 VND'),'Home calculator should match prices page');
if(problems.length){console.error(problems.join('\n'));process.exit(1)}
console.log('JAPAN_CALCULATOR_QA_PASS models=2 daily=150000/200000 days=1-6 quote=7-30 sitemap=12 factory=PAUSED');

/* ---------- حساب العميل (يُحسب دائماً من السجل) ---------- */
const val=r=>{if(r.type==='pay')return 0;const v=rd2(r.total-r.prev);return Number.isFinite(v)?v:0},pd=r=>{const v=r.type==='pay'?r.amount:r.paid;return Number.isFinite(+v)?v:0};
/* دفع بأكتر من طريقة: r.pays = [{n:الطريقة,a:المبلغ,p:نسبة الخصم}]. pdBy بترجّع الصافي لكل طريقة (للتقارير) */
const PY=r=>Array.isArray(r.pays)&&r.pays.length>0;
/* v341: اسم الطريقة الحالي لأي اسم قديم بنفس اللوجو */
let PCK='',PCM={};const pmCanon=n=>{n=String(n||'').trim();if(!n||/^(كاش|نقدي)$/.test(n))return n;let k='';try{k=localStorage.getItem('pfPre2')||''}catch(_){}if(k!==PCK){PCK=k;PCM={}}if(n in PCM)return PCM[n];let L=[];try{L=pfAll()}catch(_){}let o=n;if(!L.some(x=>x.n===n)){const t=payTok(n)[0];if(t){const m=L.find(x=>payTok(x.n)[0]===t);if(m)o=m.n}}PCM[n]=o;return o};
const pdBy=r=>pdBy0(r).map(([k,v])=>[pmCanon(k),v]);
const pdBy0=r=>{if(!PY(r))return[[String(r.pfWhy||'').trim()||'كاش',pd(r)]];const a=r.pays.map(y=>[String(y.n||'').trim()||'كاش',rd2(y.a-fee(y.a,y.p))]),d=rd2(pd(r)-a.reduce((s,x)=>s+x[1],0));if(d)a[0][1]=rd2(a[0][1]+d);return a};
let DV=0,idxV=-1,ledMap=new Map(),balMap=new Map();
const net=r=>r.type==='pay'?-r.amount:val(r)-r.paid;
function idx(){if(idxV===DV)return;ledMap=new Map();S.invoices.forEach(r=>{let a=ledMap.get(r.cid);if(!a)ledMap.set(r.cid,a=[]);a.push(r)});
  balMap=new Map();S.customers.forEach(c=>{const v=rd2((c.open||0)+(ledMap.get(c.id)||[]).reduce((a,r)=>a+net(r),0));balMap.set(c.id,Math.abs(v)<1?0:v)});idxV=DV}
const ledger=c=>{idx();return ledMap.get(c.id)||[]};
const balOf=c=>{idx();const b=balMap.get(c.id);if(b!==undefined)return b;const v=rd2((c.open||0)+ledger(c).reduce((a,r)=>a+net(r),0));return Math.abs(v)<1?0:v};
/* v333: الحساب الحقيقي من غير تقريب (للتسوية) */
const balRaw=c=>rd2((c.open||0)+ledger(c).reduce((a,r)=>a+net(r),0));
const nextNo=c=>Math.max(0,...ledger(c).filter(r=>r.type==='inv').map(r=>r.no||0))+1;
const nextPayNo=c=>{const l=ledger(c).filter(r=>r.type==='pay');return Math.max(l.length,...l.map(r=>r.no||0))+1};
const cmax=r=>Math.max(+(r&&r.code)||0,+(r&&r.rcode)||0);
const codeHW=()=>{try{return +localStorage.getItem('codeHW')||0}catch(e){return 0}};
const noteCode=r=>{const m=cmax(r);if(m>codeHW())try{localStorage.setItem('codeHW',String(m))}catch(e){}};
const nextCode=x=>Math.max(1000,+x||0,codeHW(),...S.invoices.map(cmax),...lget('trash').map(cmax))+1;
const hasRet=r=>(r.rows||[]).some(x=>x.rt);
const pureRet=r=>{const a=(r.rows||[]).filter(x=>!x.cols);return a.length>0&&a.every(x=>x.rt)};
const hasMix=r=>hasRet(r)&&!pureRet(r);
const dropRc=r=>{r.oc=(r.oc||[]).concat(r.rcode);delete r.rcode};
const ensureRc=r=>{if(r.type==='pay')return;if(hasMix(r)){if(!r.rcode)r.rcode=nextCode(r.code)}else if(r.rcode)dropRc(r)};
const stTag=r=>r.type==='pay'?('دفعة'+(r.code?' '+r.code:'')+(r.no?' (إذن '+r.no+')':'')):((r.code?String(r.code)+(r.no?' (إذن '+r.no+')':''):'#'+r.no)+(hasRet(r)?' ↩'+(r.rcode?' '+r.rcode:''):''));
const numTag=r=>r.type==='pay'?('دفعة'+(r.code?' '+r.code:'')):(r.code?String(r.code):'#'+r.no);
const bal=c=>{const b=balOf(c);return b>0?'عليه '+f(b):b<0?'له '+f(-b):'0'};
const bcls=c=>{const b=balOf(c);return b>0?'dr':b<0?'cr':''};
const getC=id=>S.customers.find(c=>c.id===id);


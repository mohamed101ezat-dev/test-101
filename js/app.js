/* فواتير · التطبيق الأساسي (فواتير، عملاء، سجل، مديونين، إعدادات) */
/* رقم النسخة: غيّر الرقم ده مع كل تحديث، والـ service worker بياخده لوحده */
const APP_VER='265';
/* صفحة قديمة وصلت مع ملف أحدث منها (نت بطيء وقت التحديث): نعيد الفتح مرة بدل ما البرنامج يقع */
(function(){const s=document.querySelector('script[src*="js/app.js"]'),m=s&&/[?&]v=(\d+)/.exec(s.src);if(!m||m[1]===APP_VER)return;let seen=APP_VER;try{seen=sessionStorage.getItem('verFix');sessionStorage.setItem('verFix',APP_VER)}catch(e){}if(seen===APP_VER)return;window.__bootOK=true;location.reload();throw new Error('stale-page')})();
const $=id=>document.getElementById(id);
const f=n=>(rd2(+n||0)||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2,useGrouping:true});
const fq=n=>(+n||0).toLocaleString('en-US',{maximumFractionDigits:2,useGrouping:true});
const toEn0=s=>String(s==null?'':s).replace(/[٠-٩]/g,d=>d.charCodeAt(0)-1632).replace(/[۰-۹]/g,d=>d.charCodeAt(0)-1776).replace(/٫/g,'.').replace(/٬/g,'');
const toEn=s=>toEn0(s).replace(/,/g,'');
const nv=x=>parseFloat(toEn(x))||0;
const rd2=x=>Math.round(x*100)/100;
const esc=s=>String(s==null?'':s).replace(/[&<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
/* الأخطاء بتتسجل عندنا بس (آخر 30 في errLog)، والمستخدم بيشوف رسالة بسيطة */
const logErr=(e,w)=>{try{console.error('[فواتير]',w||'',e);const l=JSON.parse(localStorage.getItem('errLog')||'[]');l.push({at:Date.now(),w:w||'',m:String(e&&(e.code||e.message)||e).slice(0,300)});localStorage.setItem('errLog',JSON.stringify(l.slice(-30)))}catch(_){}};
window.addEventListener('error',e=>logErr(e.error||e.message,'win'));window.addEventListener('unhandledrejection',e=>logErr(e.reason,'promise'));
window.addEventListener('securitypolicyviolation',e=>logErr(e.blockedURI+' '+e.violatedDirective,'csp'));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const two=n=>String(n).padStart(2,'0');
/* v190: العدد مع المعدود بالعربي: 2 = مثنى (عميلين)، 3-10 = جمع (5 عملاء)، غير كده مفرد (11 عميل) */
const PLW={'عميل':['عميلين','عملاء'],'صنف':['صنفين','أصناف'],'معاملة':['معاملتين','معاملات'],'فاتورة':['فاتورتين','فواتير'],'مورد':['موردين','موردين'],'طريقة':['طريقتين','طرق'],'عملية':['عمليتين','عمليات']};
const plN=(n,k)=>{n=+n||0;const w=PLW[k],m=n%100;return !w?n+' '+k:n===2?w[0]:m>=3&&m<=10?n+' '+w[1]:n+' '+k};
/* v190: الرصيد بالسالب بيتكتب «له 500» بدل «-500» */
const fb=n=>(+n||0)<0?'له '+f(-n):f(n);
const dAgo=n=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-n);return d.getTime()};
const dEnd=a=>{const d=new Date(a);d.setDate(d.getDate()+1);return d.getTime()};
function stamp(t){const d=new Date(t);let h=d.getHours();const ap=h>=12?'م':'ص';h=h%12||12;return `${d.getFullYear()}/${two(d.getMonth()+1)}/${two(d.getDate())}  ${h}:${two(d.getMinutes())} ${ap}`}
const dshort=t=>{const d=new Date(t);return `${d.getFullYear()}/${two(d.getMonth()+1)}/${two(d.getDate())}`};
function lget(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}}
/* ===== مكان الحفظ: الفواتير والعملاء والأصناف في IndexedDB (مساحة كبيرة)، والإعدادات الصغيرة في localStorage ===== */
const BIG=['items','customers','invoices','cats','quotes','expenses','suppliers','purchases','stock'],BIGS=new Set(BIG),IDBN='tabakha-data';
let dataMode='ls',dataReady=false,ddb=null,instOff=false,pend={},pendQ=false,lsWarned=0;
const lsWarn=()=>{if(Date.now()-lsWarned>30000){lsWarned=Date.now();try{toast('⚠ الحفظ على الجهاز منفعش (المساحة اتملت). احفظ نسخة احتياطية حالاً.')}catch(_){}}};
function lset(k,x){if(instOff)return;
  if(BIGS.has(k)){if(!dataReady)return;/* قبل ما البيانات تتحمل منكتبش حاجة عشان ميتمسحش الموجود */
    if(dataMode==='idb'){pend[k]=x;if(!pendQ){pendQ=true;Promise.resolve().then(flushIDB)}return}
    try{if(localStorage.getItem('idbMig'))localStorage.setItem('lsDirty','1')}catch(e){}}
  try{localStorage.setItem(k,JSON.stringify(x))}catch(e){lsWarn()}}
function ddbOpen(ver){return new Promise((res,rej)=>{let q;try{q=ver?indexedDB.open(IDBN,ver):indexedDB.open(IDBN)}catch(e){rej(e);return}
  q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('kv'))q.result.createObjectStore('kv')};q.onblocked=()=>rej(new Error('blocked'));q.onerror=()=>rej(q.error);
  q.onsuccess=()=>{const d=q.result;if(d.objectStoreNames.contains('kv')){d.onversionchange=()=>d.close();res(d);return}const v=d.version+1;d.close();ddbOpen(v).then(res,rej)}})}
function kvGet(keys){return new Promise((res,rej)=>{const t=ddb.transaction('kv','readonly'),st=t.objectStore('kv'),o={};let n=keys.length;if(!n){res(o);return}
  keys.forEach(k=>{const r=st.get(k);r.onsuccess=()=>{o[k]=r.result;if(--n===0)res(o)};r.onerror=()=>rej(r.error)})})}
function kvPut(obj){return new Promise((res,rej)=>{const t=ddb.transaction('kv','readwrite'),st=t.objectStore('kv');Object.entries(obj).forEach(([k,v])=>st.put(v,k));
  t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('abort'))})}
function flushIDB(){pendQ=false;const o=pend;pend={};if(!ddb||!Object.keys(o).length)return Promise.resolve();
  return kvPut(o).catch(e=>{Object.keys(o).forEach(k=>{if(!(k in pend))pend[k]=o[k]});lsWarn()})}
const lsv=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}};
const nm=t=>String(t==null?'':t).toLowerCase().replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
/* بحث صوتي: حرف لاتيني يطابق نظيره العربي (m = م) عن طريق هيكل الحروف الساكنة */
const PH={'ب':'b','ت':'t','ث':'s','ج':'j','ح':'h','خ':'x','د':'d','ذ':'z','ر':'r','ز':'z','س':'s','ش':'x','ص':'s','ض':'d','ط':'t','ظ':'z','غ':'j','ف':'f','ق':'k','ك':'k','ل':'l','م':'m','ن':'n','ه':'h'};
const skel=t=>{let o=String(t==null?'':t).toLowerCase().replace(/sh|kh/g,'x').replace(/gh/g,'j');o=o.replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآ]/g,'ا');
  return o.split('').map(c=>PH[c]||(/[a-z0-9]/.test(c)?({c:'k',q:'k',g:'j',p:'b',v:'f'}[c]||c):'')).join('').replace(/[aeiouyw]/g,'')};
const qm=(t,q)=>{q=String(q==null?'':q).trim();if(!q)return true;if(nm(t).includes(nm(q)))return true;if(!/[a-z]/i.test(q))return false;const k=skel(q);return !!k&&skel(t).includes(k)};
const nkey=t=>nm(t).replace(/\s+/g,' ').trim();
const findCust=n=>{const k=nkey(n);return k?S.customers.find(c=>nkey(c.name)===k)||null:null};
const sfail=()=>{$('stor').textContent='تنبيه: الحفظ على السحابة منفعش، وبياناتك محفوظة على الجهاز ده.'};
const sf=fn=>{try{const p=fn();if(p&&p.catch)p.catch(sfail)}catch(e){sfail()}};
const S={items:[],customers:[],invoices:[],cats:[],quotes:[],expenses:[],suppliers:[],purchases:[],stock:[]};let db=null;

/* ---------- حساب العميل (يُحسب دائماً من السجل) ---------- */
const val=r=>r.type==='pay'?0:rd2(r.total-r.prev),pd=r=>r.type==='pay'?r.amount:r.paid;
/* دفع بأكتر من طريقة: r.pays = [{n:الطريقة,a:المبلغ,p:نسبة الخصم}]. pdBy بترجّع الصافي لكل طريقة (للتقارير) */
const PY=r=>Array.isArray(r.pays)&&r.pays.length>0;
const pdBy=r=>{if(!PY(r))return[[String(r.pfWhy||'').trim()||'كاش',pd(r)]];const a=r.pays.map(y=>[String(y.n||'').trim()||'كاش',rd2(y.a-fee(y.a,y.p))]),d=rd2(pd(r)-a.reduce((s,x)=>s+x[1],0));if(d)a[0][1]=rd2(a[0][1]+d);return a};
let DV=0,idxV=-1,ledMap=new Map(),balMap=new Map();
const net=r=>r.type==='pay'?-r.amount:val(r)-r.paid;
function idx(){if(idxV===DV)return;ledMap=new Map();S.invoices.forEach(r=>{let a=ledMap.get(r.cid);if(!a)ledMap.set(r.cid,a=[]);a.push(r)});
  balMap=new Map();S.customers.forEach(c=>balMap.set(c.id,rd2((c.open||0)+(ledMap.get(c.id)||[]).reduce((a,r)=>a+net(r),0))));idxV=DV}
const ledger=c=>{idx();return ledMap.get(c.id)||[]};
const balOf=c=>{idx();const b=balMap.get(c.id);return b===undefined?rd2((c.open||0)+ledger(c).reduce((a,r)=>a+net(r),0)):b};
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

/* ---------- التخزين ---------- */
const hs=t=>{let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h).toString(36)};
function migrate(codes=!fbCfg()||!!db){
  S.items=S.items.map(i=>{const v=i.v||{};return{id:i.id||'i'+hs((i.type||'')+i.name),u:i.u||0,type:i.type==='rd'?'rd':'mq',name:i.name,p:v.p!==undefined?v.p:(i.price||i.p||0),w:v.w!==undefined?v.w:(i.w||0),h:v.h!==undefined?v.h:(i.h||0),...(i.pc?{pc:i.pc}:{})}});
  let ch=false;S.customers.forEach(c=>{if(c.open===undefined){const rs=ledger(c).sort((a,b)=>a.ts-b.ts);c.open=rs.length?(rs[0].prev||0):(c.balance||0);ch=true}});
  if(ch){DV++;lset('customers',S.customers)}
  if(!codes)return;
  const nc=S.invoices.filter(r=>!r.code).sort((a,b)=>(a.ts||0)-(b.ts||0));
  if(nc.length){let n=nextCode();const t=Date.now();nc.forEach(r=>{r.code=n++;r.u=t;noteCode(r);pushDoc('invoices',r)});DV++;lset('invoices',S.invoices)}
  const pr=S.invoices.filter(r=>r.type!=='pay'&&r.rcode&&!hasMix(r));
  if(pr.length){const t=Date.now();pr.forEach(r=>{dropRc(r);r.u=t;pushDoc('invoices',r)});DV++;lset('invoices',S.invoices)}
  const nr=S.invoices.filter(r=>r.type!=='pay'&&hasMix(r)&&!r.rcode).sort((a,b)=>(a.ts||0)-(b.ts||0));
  if(nr.length){const t=Date.now();nr.forEach(r=>{r.rcode=nextCode();r.u=t;noteCode(r);pushDoc('invoices',r)});DV++;lset('invoices',S.invoices)}
  fixDupCodes()}
/* لو جهازين اداو نفس الكود (من غير نت): الأقدم يفضل بكوده، والتاني ياخد كود جديد ويتحفظ القديم للبحث */
function fixDupCodes(){const seen=new Set(),fix=[];
  S.invoices.slice().sort((a,b)=>(a.ts||0)-(b.ts||0)||(a.id<b.id?-1:a.id>b.id?1:0)).forEach(r=>['code','rcode'].forEach(k=>{const v=+r[k];if(!v)return;if(seen.has(v))fix.push([r,k]);else seen.add(v)}));
  if(!fix.length)return 0;const t=Date.now(),msg=[];
  fix.forEach(([r,k])=>{const old=+r[k];r[k]=nextCode();r.oc=(r.oc||[]).concat(old);r.u=t;noteCode(r);pushDoc('invoices',r);msg.push(old+' ← '+r[k]+' ('+r.cname+')')});
  DV++;lset('invoices',S.invoices);setTimeout(()=>{try{toast('كود اتكرر على جهازين واتصلح: '+msg.join('، '))}catch(e){}},800);return fix.length}
function syncNames(){const cm=new Map(S.customers.map(c=>[c.id,c])),l=S.invoices.filter(r=>{const c=cm.get(r.cid);return c&&c.name&&r.cname!==c.name});if(!l.length)return;DV++;const n=Date.now();l.forEach(r=>{r.cname=cm.get(r.cid).name;r.u=n;pushDoc('invoices',r)});lset('invoices',S.invoices)}
function loadFrom(get){DV++;const A=k=>{const v=get(k);return Array.isArray(v)?v:[]};S.items=A('items');S.customers=A('customers');S.invoices=A('invoices');S.cats=A('cats').filter(c=>c&&c.id&&c.name);S.quotes=A('quotes').filter(q=>q&&q.id);S.expenses=A('expenses').filter(x=>x&&x.id);S.suppliers=A('suppliers').filter(x=>x&&x.id);S.purchases=A('purchases').filter(x=>x&&x.id);S.stock=A('stock').filter(x=>x&&x.id);dataReady=true;migrate()}
function loadLocal(){loadFrom(lget)}
let migNote='';
const lsBigBytes=()=>{let n=0;try{BIG.forEach(k=>{const v=localStorage.getItem(k);if(v)n+=v.length*2})}catch(e){}return n};
const lsBytes=()=>{let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);n+=(k.length+(localStorage.getItem(k)||'').length)*2}}catch(e){}return n};
/* أول ما البرنامج يفتح: يقرا من IndexedDB. أول مرة بس بينقل البيانات من المكان القديم ويتأكد إن العدد مطابق قبل ما يعتمد على الجديد */
async function dataInit(){
  if(!window.indexedDB){loadLocal();return}
  try{ddb=await tmo(ddbOpen(),7000)}catch(e){ddb=null}
  const migAt=+lsv('idbMig','0');
  if(!ddb){if(migAt&&!lsBigBytes())throw new Error('idb-open');dataMode='ls';loadLocal();if(migAt)setTimeout(()=>toast('⚠ مكان الحفظ الجديد مش بيفتح دلوقتي، والبرنامج شغال من النسخة القديمة. قفل البرنامج وافتحه تاني'),1500);return}
  let got=await kvGet([...BIG,'mig']);
  /* اتنقلت قبل كده بس المكان الجديد فاضي = المتصفح مسحه: منبدأش فاضي من غير ما نقول */
  const lost=!got.mig&&migAt>0;
  if(!got.mig){const src={};BIG.forEach(k=>src[k]=lget(k));
    try{await kvPut({...src,premig:{at:Date.now(),...src}});const chk=await kvGet(BIG);
      if(BIG.some(k=>!Array.isArray(chk[k])||chk[k].length!==src[k].length))throw new Error('verify');
      await kvPut({mig:Date.now()});try{localStorage.setItem('idbMig',String(Date.now()))}catch(e){}got=chk;
      if(lost)migNote=src.invoices.length?'⚠ المتصفح مسح مكان الحفظ، ورجعنا لآخر نسخة قديمة على الجهاز ('+src.invoices.length+' فاتورة). لو المزامنة شغالة الباقي هيرجع لوحده':'⚠ المتصفح مسح بيانات البرنامج من الجهاز. لو المزامنة شغالة هترجع لوحدها، أو استرجع نسخة احتياطية من الإعدادات';
      else if(src.invoices.length||src.customers.length)migNote='✓ اتنقلت بياناتك للمكان الجديد: '+src.invoices.length+' فاتورة/دفعة · '+src.customers.length+' عميل'}
    catch(e){ddb=null;dataMode='ls';loadLocal();return}}
  else if(lsv('lsDirty','')==='1'){/* البرنامج اشتغل مرة من المكان القديم: ندمج اللي اتعمل فيه (الأحدث يكسب) */
    const up={};BIG.forEach(k=>{const m=new Map((got[k]||[]).map(x=>[x.id,x]));let ch=false;lget(k).forEach(x=>{const o=m.get(x.id);if(x&&x.id&&(!o||(x.u||0)>(o.u||0))){m.set(x.id,x);ch=true}});if(ch){got[k]=[...m.values()];up[k]=got[k]}});
    if(Object.keys(up).length)await kvPut(up);try{localStorage.removeItem('lsDirty')}catch(e){}}
  dataMode='idb';loadFrom(k=>got[k]);
  /* النسخة القديمة بتفضل احتياطي 30 يوم، إلا لو المكان القديم قرب يتملي فبنفضيه (في نسخة كاملة متشالة في IndexedDB) */
  try{if(lsBigBytes()&&(Date.now()-(+lsv('idbMig','0')||Date.now())>30*864e5||lsBytes()>0.6*5*1024*1024))BIG.forEach(k=>localStorage.removeItem(k))}catch(e){}}
const tmo=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);
function mergeK(k,remote,full){const m=new Map(S[k].map(x=>[x.id,x])),up=[],took=[],rid=new Set(remote.map(r=>r.id));
  remote.forEach(r=>{const l=m.get(r.id);if(!l||(r.u||0)>(l.u||0)){m.set(r.id,r);took.push(r)}else if((l.u||0)>(r.u||0))up.push(l)});
  if(full)S[k].forEach(l=>{if(!rid.has(l.id))up.push(l)});if(k==='invoices')took.forEach(noteCode);DV++;S[k]=[...m.values()];lset(k,S[k]);return{up,took}}
/* المزامنة: كل مرة بتقرا اللي اتغير بس (حقل su = وقت السيرفر). القراءة الكاملة مرة كل 30 يوم، أو لو عدّ المستندات اليومي لقى فرق.
   ده عشان الخطة المجانية: قراءة كل الفواتير كل يوم كانت هتخلّص الحصة بعدد قليل من المستخدمين */
const SYNC_LAP=2e4,FULL_MAX=30*864e5,FULL_BAD=3*864e5;
async function cloudAudit(d){if(!d.count||Date.now()-(+lsv('cntAt','0'))<864e5||pupGet().size||lget('pdel').length)return;
  try{localStorage.setItem('cntAt',String(Date.now()));let bad=false;for(const k of BIG){if(await tmo(d.count(k),8000)!==S[k].length){bad=true;break}}if(bad)localStorage.setItem('cntBad','1');else localStorage.removeItem('cntBad')}catch(e){}}
async function loadCloud(){const d=FBDB;
  if(d){try{
    const fullAt=+lsv('fullAt','0'),age=Date.now()-fullAt,full=!fullAt||age>FULL_MAX||(lsv('cntBad','')==='1'&&age>FULL_BAD);let cur={},at={};if(!full)try{cur=JSON.parse(lsv('syncCur','{}'))||{};at=JSON.parse(lsv('syncAt','{}'))||{}}catch(e){}const nc={...cur},na={...at},t0=Date.now();
    /* الهامش بيتقرا مرة واحدة بعد آخر تغيير بس، مش كل مزامنة، عشان رفع كبير ما يتقراش كل مرة */
    const rdc=async c=>{const m=cur[c]||0,r=(await tmo(d.collection(c).get(full?null:Math.max(0,(at[c]||0)>m+SYNC_LAP?m:m-SYNC_LAP)),15000)).docs||[];r.forEach(x=>{if(x.su>(nc[c]||0))nc[c]=x.su});na[c]=t0;return r.map(x=>x.data())};
    try{await tmo(flushDel(d),20000)}catch(e){}const pdl=new Set(lget('pdel').map(x=>x.k+':'+x.id));const [ri0,rc0,rv0,rt0,rk0,rq0,rx0,rs0,rp0,ro0]=await Promise.all([rdc('items'),rdc('customers'),rdc('invoices'),rdc('deleted').catch(()=>[]),rdc('cats').catch(()=>[]),rdc('quotes').catch(()=>[]),rdc('expenses').catch(()=>[]),rdc('suppliers').catch(()=>[]),rdc('purchases').catch(()=>[]),rdc('stock').catch(()=>[])]);
    const tmb=new Map(rt0.map(t=>[t.k+':'+t.tid,t.at||0])),dead=(k,x)=>{const t=tmb.get(k+':'+x.id);return t!==undefined&&(x.u||0)<=t};
    const fl=(k,a)=>a.filter(x=>!pdl.has(k+':'+x.id)&&!dead(k,x));
    ['items','customers','invoices','cats','quotes','expenses','suppliers','purchases','stock'].forEach(k=>{const n=S[k].length;S[k]=S[k].filter(x=>!dead(k,x));if(S[k].length!==n){DV++;lset(k,S[k])}});
    [['items',fl('items',ri0)],['customers',fl('customers',rc0)],['invoices',fl('invoices',rv0)],['cats',fl('cats',rk0)],['quotes',fl('quotes',rq0)],['expenses',fl('expenses',rx0)],['suppliers',fl('suppliers',rs0)],['purchases',fl('purchases',rp0)],['stock',fl('stock',ro0)]].forEach(([k,r])=>mergeK(k,r,full).up.forEach(o=>pupMark(k,o)));
    migrate(true);db=d;
    let pushOk=true;try{await tmo(pushPending(d),20000)}catch(e){pushOk=false}
    try{localStorage.setItem('syncCur',JSON.stringify(nc));localStorage.setItem('syncAt',JSON.stringify(na));if(full){localStorage.setItem('fullAt',String(Date.now()));localStorage.setItem('cntAt',String(Date.now()));localStorage.removeItem('cntBad')}}catch(e){}
    if(pushOk&&!full)await cloudAudit(d);
    /* متكتبش "تخزين سحابي" فوق تنبيه الفشل: لو في حاجات مترفعتش لازم تبان */
    $('stor').textContent=pushOk?'الحفظ: تخزين سحابي.':'تنبيه: في بيانات لسه مترفعتش على السحابة، هتترفع لوحدها لما النت يتحسن.';return true}catch(e){}}
  db=null;$('stor').textContent='الحفظ: على الجهاز ده بس.';return false}
/* اللي لسه مترفعش على السحابة بيفضل في قايمة لحد ما يترفع */
/* الحفظ بيتجمع في مرة واحدة: كتابة القايمة كلها مع كل مستند كانت بتهنّج البرنامج أول مزامنة لحساب جديد فيه فواتير كتير */
let pupS=null,pupT=0;const pupGet=()=>pupS||(pupS=new Set(lget('pup'))),pupSave=()=>{clearTimeout(pupT);pupT=0;lset('pup',[...pupGet()])},pupLater=()=>{if(!pupT)pupT=setTimeout(pupSave,400)};
function pupMark(k,o){if(!fbCfg())return false;const s=pupGet(),key=k+'|'+o.id;if(!s.has(key)){s.add(key);pupLater()}return true}
function pushDoc(k,o){if(!pupMark(k,o)||!db)return;const key=k+'|'+o.id,u0=o.u;
  sf(()=>db.collection(k).doc(o.id).set(o).then(()=>{if(o.u===u0){pupGet().delete(key);pupLater()}}))}
async function pushPending(d){const s=pupGet(),jobs=[],ix={},byId=k=>ix[k]||(ix[k]=new Map((S[k]||[]).map(x=>[x.id,x])));
  [...s].forEach(key=>{const i=key.indexOf('|'),k=key.slice(0,i),id=key.slice(i+1),o=byId(k).get(id);if(!o){s.delete(key);return}const u0=o.u;
    /* لو مستند واحد فيه مشكلة ميوقفش رفع الباقي */
    try{jobs.push(d.collection(k).doc(id).set(o).then(()=>{if(o.u===u0)s.delete(key)}))}catch(e){jobs.push(Promise.reject(e))}});
  pupSave();const r=await Promise.allSettled(jobs);pupSave();if(r.some(x=>x.status==='rejected'))throw new Error('push')}
function put(k,o){DV++;o.u=Date.now();if(k==='invoices')noteCode(o);lset(k,S[k]);pushDoc(k,o)}
/* إعادة حساب "رصيد سابق" لكل فواتير العميل بالترتيب (بعد تعديل أو حذف أو تغيير الرصيد الافتتاحي) */
function reflowC(c,ch){let run=c.open||0;
  ledger(c).slice().sort((a,b)=>a.ts-b.ts||(a.id<b.id?-1:a.id>b.id?1:0)).forEach(r=>{const p=up(run),old=+r.prev||0;
    if(Math.abs(p-old)>0.004){if(r.type==='pay'){r.prev=p;r.rest=rd2(p-(r.amount||0))}else{r.total=rd2(rndInv((r.total||0)-old+p));r.prev=p;r.rest=rd2(r.total-(r.paid||0))}ch.push(r)}
    run=rd2(run+net(r))})}
function reflowList(cs){const ch=[];cs.forEach(c=>{if(c)reflowC(c,ch)});if(!ch.length)return 0;const t=Date.now();ch.forEach(r=>r.u=t);DV++;lset('invoices',S.invoices);ch.forEach(r=>pushDoc('invoices',r));return ch.length}
const reflow=cid=>reflowList([getC(cid)]),reflowAll=()=>reflowList(S.customers);
let flushing=null;
function flushDel(d){if(!d)return Promise.resolve();if(flushing)return flushing;
  flushing=(async()=>{try{const l=lget('pdel');if(!l.length)return;const done=new Set();
    for(const x of l){try{const at=x.at||Date.now();await tmo(d.collection('deleted').doc(x.k+'_'+x.id).set({id:x.k+'_'+x.id,k:x.k,tid:x.id,at}),8000);await tmo(d.collection(x.k).doc(x.id).delete(),8000);done.add(x.k+':'+x.id)}catch(e){if(e&&e.message==='timeout')break}}
    if(done.size)lset('pdel',lget('pdel').filter(y=>!done.has(y.k+':'+y.id)))}finally{flushing=null}})();
  return flushing}
function del(k,id){DV++;S[k]=S[k].filter(x=>x.id!==id);lset(k,S[k]);const l=lget('pdel');l.push({k,id,at:Date.now()});lset('pdel',l);if(db)sf(()=>flushDel(db))}
/* ---------- تأكيد بضغطتين + استرجاع المحذوف ---------- */
function ok2(b){if(b.dataset.arm){clearTimeout(b._t);disarm(b);return true}b.dataset.lbl=b.textContent;b.dataset.arm='1';b.textContent='تأكيد: '+b.dataset.lbl;b.classList.add('arm');b._t=setTimeout(()=>disarm(b),4000);return false}
function disarm(b){clearTimeout(b._t);if(b.dataset.arm){b.dataset.arm='';b.textContent=b.dataset.lbl}b.classList.remove('arm')}
function undel(k,o){lset('pdel',lget('pdel').filter(x=>!(x.k===k&&x.id===o.id)));if(!S[k].some(x=>x.id===o.id))S[k].push(o);put(k,o)}
let tm;const dirty=new Map();
function touch(k,o){dirty.set(k+o.id,[k,o]);clearTimeout(tm);tm=setTimeout(flushTouch,500)}
function flushTouch(){clearTimeout(tm);dirty.forEach(([k,o])=>put(k,o));dirty.clear()}
addEventListener('pagehide',()=>{flushTouch();flushIDB();if(pupT)pupSave()});document.addEventListener('visibilitychange',()=>{if(document.hidden){flushTouch();if(pupT)pupSave()}});

/* ---------- التبويبات (Bottom Nav) ---------- */
let kbH=0;
const fixBar=()=>{const h=$('bnav').offsetHeight||56,sb=$('saveBar'),r=document.documentElement.style;r.setProperty('--nh',h+'px');sb.style.bottom=(kbH||h)+'px';r.setProperty('--sh',(sb.classList.contains('hide')?0:sb.offsetHeight)+'px')};
if(window.ResizeObserver){const ro=new ResizeObserver(()=>fixBar());ro.observe($('bnav'));ro.observe($('saveBar'))}
function kbFix(){const vv=window.visualViewport;let k=0;
  if(vv&&Math.abs((vv.scale||1)-1)<.01){const a=document.activeElement,ed=a&&(/^(TEXTAREA|SELECT)$/.test(a.tagName)||(a.tagName==='INPUT'&&!/^(checkbox|radio|file|button)$/.test(a.type)));
    const d=Math.round(innerHeight-vv.height-vv.offsetTop);if(ed&&d>80)k=d}
  if(k===kbH)return;kbH=k;document.body.classList.toggle('kb',k>0);fixBar()}
if(window.visualViewport){visualViewport.addEventListener('resize',kbFix);visualViewport.addEventListener('scroll',kbFix)}
document.addEventListener('focusin',()=>setTimeout(kbFix,300));document.addEventListener('focusout',()=>setTimeout(kbFix,300));
window.addEventListener('resize',fixBar);
let curTab='new',tabHist=[],navNoHist=false;
const navClick=e=>{const b=e.target.closest('button[data-t]');if(!b)return;const t=b.dataset.t;if(!navNoHist&&t!==curTab)tabHist.push(curTab);curTab=t;try{sessionStorage.setItem('lastTab',t)}catch(e){}
  document.querySelectorAll('#bnav button,#hdrSet').forEach(x=>x.classList.toggle('on',x===b));if(t==='it')$('hdrSet').classList.add('on');
  ['dash','new','cl','cu','it','st'].forEach(k=>$('t-'+k).classList.toggle('hide',k!==t));
  $('saveBar').classList.toggle('hide',t!=='new');document.body.classList.toggle('onNew',t==='new');fixBar();
  if(t==='new'){drawRecent();drawQS()}if(t==='st')stGo('');if(t==='dash')drawDash();if(t==='cu')drawCusts();if(t==='new'&&lastC&&!editId){$('prev').value=balOf(lastC)||'';calc()}};
$('bnav').onclick=navClick;$('hdrSet').onclick=navClick;
/* العملاء والأصناف بقوا جوه الإعدادات: زرار الإعدادات يفضل متعلّم وانت فيهم */
document.addEventListener('click',e=>{if(e.target.closest('[data-goset]')){$('hdrSet').click();window.scrollTo(0,0)}});
(function(){const nav=$('bnav'),ind=document.createElement('span');ind.className='nav-ind';nav.prepend(ind);let first=true;
function place(){const b=nav.querySelector('button.on');if(!b||!b.offsetWidth){nav.classList.remove('ready');return}
 if(first){ind.style.transition='none'}
 ind.style.width=(b.offsetWidth-6)+'px';ind.style.transform='translateX('+(b.offsetLeft+3)+'px)';nav.classList.add('ready');
 if(first){void ind.offsetWidth;ind.style.transition='';first=false}}
nav.addEventListener('click',()=>requestAnimationFrame(place));$('hdrSet').addEventListener('click',()=>requestAnimationFrame(place));
window.addEventListener('resize',place);window.addEventListener('load',place);if(window.ResizeObserver)new ResizeObserver(place).observe(nav);place()})();

setTimeout(()=>{try{syncNav()}catch(e){}},0);

/* ---------- رسم الصورة (بدون مكتبات) ---------- */
let lastSpec=null,curSpec=null;const logoImg=new Image();
const logoOK=()=>pget('logoOn',true)&&logoImg.complete&&logoImg.naturalWidth>0;
/* ---------- تصميم الفاتورة (قابل للتعديل من الإعدادات) ---------- */
const INV_G={bg:'#f7f3ea',marble:0,head:'#14233a',hfg:'#e5c675',ink:'#14233a',grid:'#d9cfb4',edge:'#b08d3c',totBg:'#14233a',totFg:'#e5c675',remBg:'#b08d3c',remFg:'#3a2a05',paidBg:'#ece7d4',paidFg:'#3d4a2c',sumA:'#efe8d4',sumB:'#f8f4ea',acc:['#b08d3c','#14233a','#8a7440','#5b6b82'],w:700,m:20,r:10,pad:10,fam:'sans',shop:18,title:22,sub:14,date:13,meta:15,th:14,tbl:15,sum:14,items:13,bold:0,sDate:1,sSub:1,sItems:1,hPrev:0,hSize:0,hCnt:0,hQty:0,hPrice:0,tint:17,sumH:30,sumW:40,sumBig:15,order:['tables','summary','notes'],topText:'',headText:'',footText:'',redNote:'',redColor:'#c0261b',xs:14,xal:'c',logoH:64,sumPos:'l',sumFit:1,shopC:'',sumV:0,hLine:1,sideSum:1,hdh:30,gw:1,ew:1.2,gap:10,tt:14,muteC:'#555555',retC:'#b42318',fTot:0,fRem:0,fPaid:0,hTot:0,hRem:0,hPaid:0,paidB:0,fTop:0,fHead:0,fFoot:0,fNote:0,rowCol:0,cw:null,ca:null,mtPos:'l',mtH:0,mtF:0,mtHide:0,sumR:8,gSep:2,gSepC:'#1f2937',gAlt:0,gAltC:'#dbe6f4'};
const INV_M={...INV_G,bg:'#eceef2',marble:1,head:'#1b2a41',hfg:'#e8cc86',ink:'#1b2a41',grid:'#cfd4dc',edge:'#c9a24d',totBg:'#1b2a41',totFg:'#e8cc86',remBg:'#d3b25e',remFg:'#1b2a41',paidBg:'#e4e8ee',paidFg:'#2f4a3a',sumA:'#e6e9ef',sumB:'#f4f5f8',acc:['#c9a24d','#1b2a41','#a8873a','#60708a']};
const INV_T={...INV_G,bg:'#ffffff',head:'#1f3a4d',hfg:'#ffffff',ink:'#111111',grid:'#c9d6d3',edge:'#6b7f7b',totBg:'#1f3a4d',totFg:'#ffffff',remBg:'#d4a537',remFg:'#3a2a05',paidBg:'#e3f1ea',paidFg:'#2e6b4f',sumA:'#e3eef0',sumB:'#f1f5f7',acc:['#4f9aa5','#d4a537','#8b6bb5','#d98282','#86b06a','#6d8fc2']};
const INV_B={...INV_G,bg:'#ffffff',marble:0,head:'#eeeeee',hfg:'#000000',ink:'#000000',grid:'#444444',edge:'#444444',totBg:'#e2f1ef',totFg:'#000000',remBg:'#e2f1ef',remFg:'#000000',paidBg:'#ffffff',paidFg:'#000000',sumA:'#ffffff',sumB:'#ffffff',acc:['#ffffff'],tint:0,r:0,shop:17,title:24,sub:14,date:13,meta:15,th:14,tbl:15,sum:15,sumBig:15,sumH:30,sumW:100,sumV:32,shopC:'#0f766e',xs:15,xal:'r',pad:10,hdh:30,gw:1,ew:1,gap:10,tt:14,muteC:'#555555',retC:'#b42318'};
const INV_MOB={...INV_G,mob:1,w:390,m:10,bg:'#ffffff',marble:0,head:'#4a76b0',hfg:'#ffffff',ink:'#111111',grid:'#1f2937',edge:'#1f2937',totBg:'#4a76b0',totFg:'#ffffff',remBg:'#4a76b0',remFg:'#ffffff',paidBg:'#dbe6f4',paidFg:'#111111',sumA:'#dbe6f4',sumB:'#ffffff',acc:['#ffffff'],tint:0,r:0,pad:4,shop:13,title:16,sub:10,date:10,meta:12,th:11,tbl:12,sum:12,sumBig:13,items:12,sumH:23,hdh:24,gw:1,ew:1.2,gap:7,tt:12,xs:11,xal:'c',logoH:36,shopC:'#16a34a',hNote:0,sideSum:1,itRow:0,itHead:0};
const MOB_KEYS=['mob','w','m','r','pad','shop','title','sub','date','meta','th','tbl','sum','sumBig','items','sumH','hdh','gw','ew','gap','tt','xs','xal','logoH','tint','sideSum','hLine','sumW','sumFit','sumPos','itRow','itHead'];
[INV_G,INV_M,INV_T,INV_B].forEach(t=>MOB_KEYS.forEach(k=>{t[k]=INV_MOB[k]}));
/* تحويل أي تصميم قديم (700 عرض) لتصميم الموبايل: بيحتفظ بالألوان والخط وإعدادات الإظهار، والأحجام من الموبايل */
function toMob(d){if(!d||d.mob)return d;const o={...INV_MOB};['bg','marble','head','hfg','ink','grid','edge','totBg','totFg','remBg','remFg','paidBg','paidFg','sumA','sumB','shopC','muteC','retC','redNote','redColor','topText','headText','footText','fam','sDate','sSub','sItems','hPrev','hNote','hSize','hCnt','hQty','hPrice','hLine','order','paidB','bold','fTot','fRem','fPaid','hTot','hRem','hPaid','fTop','fHead','fFoot','fNote'].forEach(k=>{if(d[k]!==undefined)o[k]=d[k]});if(!o.shopC)o.shopC=INV_MOB.shopC;return o}
const INV_BUILT=[{id:'b_mob',name:'موبايل (أزرق)',cfg:INV_MOB},{id:'b_g',name:'ذهبي على بيج',cfg:INV_G},{id:'b_m',name:'ذهبي على رخام',cfg:INV_M},{id:'b_t',name:'الأصلي (أخضر مزرق)',cfg:INV_T},{id:'b_b',name:'الأساسي (أبيض وأسود)',cfg:INV_B}];
/* v80: تطبيق شكل الموبايل مرة واحدة، والتصميم القديم بيتحفظ كقالب باسم «تصميمي السابق» */
try{if(!localStorage.getItem('mobMig80')){let old=null;try{old=JSON.parse(localStorage.getItem('invdesign')||'null')}catch(e){}
  if(old&&typeof old==='object'&&!old.mob){let t=[];try{t=JSON.parse(localStorage.getItem('invtpls')||'[]')||[]}catch(e){}if(!t.some(x=>x.name==='تصميمي السابق')){t.push({id:'u'+Date.now().toString(36)+'o',name:'تصميمي السابق',cfg:old});localStorage.setItem('invtpls',JSON.stringify(t))}}
  localStorage.setItem('invdesign',JSON.stringify({...INV_MOB,redNote:(old&&old.redNote)||'',redColor:(old&&old.redColor)||'#c0261b'}));localStorage.setItem('mobMig80','1')}}catch(e){}
/* v83: رجّع نوع الخط القديم بتاعك (من «تصميمي السابق») مرة واحدة */
try{if(!localStorage.getItem('fontMig83')){let t=[];try{t=JSON.parse(localStorage.getItem('invtpls')||'[]')||[]}catch(e){}const o=t.find(x=>x&&x.name==='تصميمي السابق');
  if(o&&o.cfg&&o.cfg.fam){let c=null;try{c=JSON.parse(localStorage.getItem('invdesign')||'null')}catch(e){}if(c&&typeof c==='object'){c.fam=o.cfg.fam;localStorage.setItem('invdesign',JSON.stringify(c))}}
  localStorage.setItem('fontMig83','1')}}catch(e){}
const INV_FAM={sans:'Tahoma, Arial, "Noto Naskh Arabic", sans-serif',naskh:'"Noto Naskh Arabic", Tahoma, serif',serif:'"Times New Roman", "Noto Naskh Arabic", serif'};
function invd(){let st=null;try{st=JSON.parse(localStorage.getItem('invdesign')||'null')}catch(e){}
  if(st&&typeof st==='object'&&!st.mob){st=toMob(st);try{localStorage.setItem('invdesign',JSON.stringify(st))}catch(e){}}
  if(!st){let o='';try{o=localStorage.getItem('invpal')}catch(e){}st=o==='m'?INV_M:o==='g'?INV_G:INV_MOB}
  /* v89: رجّع ترتيب الملخص/الإجماليات للوضع الأساسي مرة واحدة (إعدادات قديمة كانت بتنزّل الإجماليات تحت الملخص) */
  try{if(st&&typeof st==='object'&&localStorage.getItem('invfix89')!=='1'){localStorage.setItem('invfix89','1');if(st.sideSum!=null||st.sumPos!=null){delete st.sideSum;delete st.sumPos;localStorage.setItem('invdesign',JSON.stringify(st))}}}catch(e){}
  const c={...INV_G,...st};c.w=390;/* v81: عرض الصورة دايماً بعرض التليفون مهما كان القالب */if(!Array.isArray(c.acc)||!c.acc.length)c.acc=INV_G.acc;if(!Array.isArray(c.order)||['tables','summary','notes'].some(k=>!c.order.includes(k)))c.order=INV_G.order.slice();c.famCss=INV_FAM[c.fam]||INV_FAM.sans;
  /* السطور الثابتة (واتساب/عنوان/إنستا) بقت من بيانات المحل، فالقوالب مش بتغيّرها */
  let sx=null;try{sx=JSON.parse(localStorage.getItem('shopTxt')||'null')}catch(e){}
  if(!sx||typeof sx!=='object'){sx={top:c.topText||'',head:c.headText||'',foot:c.footText||''};try{localStorage.setItem('shopTxt',JSON.stringify(sx))}catch(e){}}
  c.topText=sx.top||'';c.headText=sx.head||'';c.footText=sx.foot||'';return c}
const hexMix=(a,b,t)=>{const g=h=>{h=String(h||'#fff').replace('#','');if(h.length===3)h=h.split('').map(z=>z+z).join('');return[0,2,4].map(i=>parseInt(h.substr(i,2),16)||0)},A=g(a),B=g(b);return'#'+A.map((v,i)=>Math.round(v*t+B[i]*(1-t)).toString(16).padStart(2,'0')).join('')};
/* ---------- العلامة المائية: لوجو باهت ملون في النص + ختم مائل حسب حالة الفاتورة ---------- */
const WM_D={logo:1,la:10,ls:60,st:1,sa:30,ss:100,sp:'c',paid:1,qt:1,ret:1,img:1,pdf:1,prn:0,gray:1,th:0};
const WM_ST={paid:['خالص','#15803d'],qt:['عرض سعر','#1d4ed8'],ret:['مرتجع','#b42318']};
function wmCfg(){let o=null;try{o=JSON.parse(localStorage.getItem('invWm')||'null')}catch(e){}return{...WM_D,...(o&&typeof o==='object'?o:{})}}
function drawWM(x,W,H,o,TH,col){if(!o||!o.wm)return;const M=wmCfg(),out=o.out||'img';
  if(!(TH?M.th:out==='print'?M.prn:out==='pdf'?M.pdf:M.img))return;
  const gray=TH||(out==='print'&&M.gray),FF='Tahoma, Arial, "Noto Naskh Arabic", sans-serif';
  x.save();try{x.globalCompositeOperation='multiply'}catch(e){}if(gray)try{x.filter='grayscale(1)'}catch(e){}
  if(M.logo&&M.la>0){x.save();x.globalAlpha=Math.min(1,M.la/100);const mw=W*M.ls/100;
    if(logoImg.complete&&logoImg.naturalWidth>0){const k=Math.min(mw/logoImg.naturalWidth,H*.85/logoImg.naturalHeight),w=logoImg.naturalWidth*k,h=logoImg.naturalHeight*k;x.drawImage(logoImg,(W-w)/2,(H-h)/2,w,h)}
    else{const sn=shopN();let fs=90;x.font='bold '+fs+'px '+FF;const tw=x.measureText(sn).width||1;fs=Math.max(16,Math.min(fs*mw/tw,H*.5));
      x.font='bold '+fs+'px '+FF;x.direction=/[؀-ۿ]/.test(sn)?'rtl':'ltr';x.textAlign='center';x.textBaseline='middle';x.fillStyle=gray?'#000':(col||'#0f766e');
      x.translate(W/2,H/2);x.rotate(-Math.PI/14);x.fillText(sn,0,0)}
    x.restore()}
  const sk=o.st&&M.st&&M[o.st]&&WM_ST[o.st];
  if(sk&&M.sa>0){const lab=sk[0],c=gray?'#000':sk[1];let fs=Math.min(W,760)*.085*M.ss/100;fs=Math.max(14,Math.min(fs,H*.26));
    x.save();x.globalAlpha=Math.min(1,M.sa/100);x.translate(W/2,M.sp==='t'?H*.3:M.sp==='b'?H*.72:H*.5);x.rotate(-Math.PI/11);
    x.font='bold '+fs+'px '+FF;x.direction='rtl';x.textAlign='center';x.textBaseline='alphabetic';
    const mt=x.measureText(lab),asc=mt.actualBoundingBoxAscent||fs*.75,dsc=mt.actualBoundingBoxDescent||fs*.3,bw=mt.width+fs*1.3,bh=asc+dsc+fs*.9,box=(i,r)=>{x.beginPath();if(x.roundRect)x.roundRect(-bw/2+i,-bh/2+i,bw-2*i,bh-2*i,r);else x.rect(-bw/2+i,-bh/2+i,bw-2*i,bh-2*i)};
    x.strokeStyle=c;x.fillStyle=c;x.lineWidth=Math.max(3,fs*.09);box(0,fs*.28);x.stroke();x.lineWidth=Math.max(1.5,fs*.035);box(fs*.17,fs*.18);x.stroke();
    x.fillText(lab,0,(asc-dsc)/2);x.restore()}
  x.restore()}
/* لوجو طريقة الدفع في الفاتورة: اسم الطريقة بيتكتب كرمز (حرفين من -) وبيترسم مكانه اللوجو.
   الحرفين بياخدوا مساحة قريبة من اللوجو، فحسابات عرض الجدول بتفضل مظبوطة */
var PAY_TOK={'':'كاش','':'فودافون كاش','':'إنستاباي'},payImgs=null;
function payTok(n){n=String(n||'').trim();
  const c=!n||n==='نقدي'||n==='كاش'?'':/محفظ|فودافون|كاش/.test(n)?'':/انستا|إنستا|instapay/i.test(n)?'':'';return c?c+c:''}
/* «المدفوع (لوجو)» أو «المدفوع (اسم الطريقة)» لو ملهاش لوجو */
const payLbl=(t,n,amt)=>{const k=amt>0?payTok(n):'';return t+(k?' '+k:n?' '+n:'')};
function drawRich(x,s,px,py,al,font,col){
  x.font=font;x.fillStyle=col;
  const segs=String(s).replace(/\(\s*([-]+)\s*\)/g,'$1').split(/([-]+)/).filter(v=>v.trim()),fz=+(String(font).match(/([\d.]+)px/)||[0,14])[1],h=fz*1.35,G=fz*.3;
  const it=segs.map(v=>{const im=/^[-]/.test(v)&&payImgs&&payImgs[v[0]];
    if(im&&im.complete&&im.naturalWidth)return{im,w:h*im.naturalWidth/im.naturalHeight};const t=im||/^[-]/.test(v)?PAY_TOK[v[0]]:v.trim();return{t,w:x.measureText(t).width}});
  const tw=it.reduce((a,v)=>a+v.w,0)+G*(it.length-1);let cx=al==='center'?px+tw/2:al==='left'?px+tw:px;
  x.textAlign='right';it.forEach(v=>{if(v.im)x.drawImage(v.im,cx-v.w,py-h/2,v.w,h);else x.fillText(v.t,cx,py);cx-=v.w+G})}
function sheet(o){lastSpec=o;const D=invd();
  const TH=o.paper==='t80'||o.paper==='t58',W=o.paper==='t58'?300:o.paper==='t80'?420:D.w,P=TH?8:D.m,IW=W-2*P,F=o.fancy&&!TH?D.famCss:'Tahoma, Arial, "Noto Naskh Arabic", sans-serif',mc=document.createElement('canvas').getContext('2d');
  const GR=TH?'#000':'#555',AC=TH?'#000':'#0f766e',nf=TH?13:15,nlh=TH?19:22;
  const wrap=(t,w,font)=>{mc.font=font;mc.direction='rtl';const out=[];let cur='';for(const wd of String(t==null?'':t).split(/\s+/)){const tr=cur?cur+' '+wd:wd;if(!cur||mc.measureText(tr).width<=w)cur=tr;else{out.push(cur);cur=wd}}out.push(cur);return out};
  /* v254: خانات الجدول سطر واحد دايمًا — الخط بيصغر شوية، ولو لسه مش مكفي الكلام بيتقص بـ… */
  const fit1=(t,w,z,bold)=>{let s=String(t==null?'':t).replace(/\s+/g,' ').trim(),zz=z;const mn=Math.max(8,z*.6),me=q=>{mc.font=(bold?'bold ':'')+zz+'px '+F;mc.direction='rtl';return mc.measureText(q).width};
    for(;zz>mn;zz-=.5)if(me(s)<=w)return{s,z:zz};zz=mn;if(me(s)<=w)return{s,z:zz};while(s.length>1&&me(s+'…')>w)s=s.slice(0,-1);return{s:s+'…',z:zz}};
  let _f,_ft;const fitF=(t,w,font)=>{const m=/^(bold )?([\d.]+)px (.*)$/.exec(font);if(!m)return{s:String(t==null?'':t),font};const q=fit1(t,w,+m[2],!!m[1]);return{s:q.s,font:(m[1]||'')+q.z+'px '+m[3]}};
  const paint=x=>{let y=10;x.direction='rtl';x.textBaseline='middle';
    const T=(s,px,py,al,font,col)=>{font=String(font).replace(/^bold /,'');if(/[-]/.test(s))return drawRich(x,s,px,py,al,font,col||'#000');x.font=font;x.textAlign=al;x.fillStyle=col||'#000';x.fillText(String(s),px,py)};
    let lg=false;
    if(logoOK()){const k=Math.min(IW*(TH?.6:.26)/logoImg.naturalWidth,(TH?44:52)/logoImg.naturalHeight,1),w=logoImg.naturalWidth*k,h=logoImg.naturalHeight*k;x.drawImage(logoImg,TH?(W-w)/2:W-P-w,y,w,h);
      if(TH)y+=h+4;else{lg=true;x.direction='ltr';T(shopN(),P,y+h/2-9,'left','bold 17px '+F,AC);x.direction='rtl';T(o.date,P,y+h/2+11,'left','13px '+F,GR);y+=h+6}}
    if(lg){}else if(TH){x.direction='ltr';T(shopN(),W/2,y+10,'center','bold 17px '+F,AC);x.direction='rtl';y+=22;T(o.date,W/2,y+8,'center','12px '+F);y+=20}
    else{x.direction='ltr';T(shopN(),W-P,y+10,'right','bold 17px '+F,AC);x.direction='rtl';T(o.date,P,y+10,'left','13px '+F,GR);y+=22}
    const tf=(TH?'bold 20px ':'bold 24px ')+F;
    wrap(o.title||((custW()?custW()+' / ':'')+o.name),IW,tf).forEach(s=>{T(s,W/2,y+13,'center',tf);y+=TH?26:28});
    wrap(o.sub||'',IW,'14px '+F).forEach(s=>{T(s,W/2,y+7,'center','14px '+F,GR);y+=20});
    (o.meta||[]).forEach(m=>wrap(m,IW,'15px '+F).forEach(s=>{T(s,W-P,y+10,'right','15px '+F);y+=22}));y+=2;
    (o.tables||[]).forEach(tb=>{
      const tf=TH&&tb.th.length>(o.paper==='t58'?3:4)?12:15,lh=tf===12?17:22,pad=TH?6:10;
      if(tb.title){T(tb.title,W-P,y+10,'right','bold 15px '+F);y+=24}
      const ws=tb.w.map(v=>v*IW),hh=TH?26:30;let xr=W-P;if(!TH){x.fillStyle='#eee';x.fillRect(P,y,IW,hh)}x.strokeStyle=TH?'#000':'#444';
      tb.th.forEach((h,i)=>{T(h,xr-ws[i]/2,y+hh/2,'center',fit1(h,ws[i]-6,tf-1,0).z+'px '+F);x.strokeRect(xr-ws[i],y,ws[i],hh);xr-=ws[i]});y+=hh;
      tb.rows.forEach(row=>{const fz=[],ln=row.map((c,i)=>{const q=fit1(c,ws[i]-pad,tf,0);fz[i]=q.z;return[q.s]}),n=Math.max(...ln.map(l=>l.length)),rh=n*lh+pad;let xr=W-P;
        row.forEach((c,i)=>{ln[i].forEach((s,k)=>T(s,xr-ws[i]/2,y+pad/2+lh*k+lh/2,'center',fz[i]+'px '+F));x.strokeRect(xr-ws[i],y,ws[i],rh);xr-=ws[i]});y+=rh});
      y+=8});
    if(o.sum){const lw=IW*.68,vw=IW-lw,sf=TH?14:15;o.sum.forEach(([a,b,bold])=>{const _g=fitF(a,lw-16,(bold?'bold ':'')+sf+'px '+F),fo=_g.font,ls=[_g.s],rh=Math.max(TH?26:30,ls.length*(sf+5)+8);
      if(bold&&!TH){x.fillStyle='#e2f1ef';x.fillRect(P,y,IW,rh)}
      ls.forEach((s,k)=>T(s,W-P-8,y+rh/2+(k-(ls.length-1)/2)*(sf+5),'right',fo));T(b,P+vw/2,y+rh/2,'center',fo);
      x.strokeStyle=TH?'#000':'#444';x.strokeRect(W-P-lw,y,lw,rh);x.strokeRect(P,y,vw,rh);y+=rh});y+=6}
    if(o.note){y+=6;wrap('ملاحظة: '+o.note,IW,nf+'px '+F).forEach(s=>{T(s,W-P,y+11,'right',nf+'px '+F);y+=nlh})}
    if(o.gn&&o.gn.length){y+=8;o.gn.forEach(n=>{const fo=(n.b?'bold ':'')+nf+'px '+F;String(n.t).split('\n').forEach(ln=>wrap(ln.trim()||' ',IW,fo).forEach(s=>{T(s,W-P,y+11,'right',fo,TH?'#000':(n.c||'#000'));y+=nlh}));y+=2})}
    else if(o.gnote){y+=8;String(o.gnote).split('\n').forEach(ln=>wrap(ln.trim()||' ',IW,nf+'px '+F).forEach(s=>{T(s,W-P,y+11,'right',nf+'px '+F);y+=nlh}))}
    return y+(TH?30:4)};
    const PL={bg:D.bg,mar:D.marble,head:D.head,hfg:D.hfg,ink:D.ink,grid:D.grid,edge:D.edge,tot:[D.totBg,D.totFg],gold:[D.remBg,D.remFg],paid:[D.paidBg,D.paidFg],lite:[D.sumA,D.ink],lite2:[D.sumB,D.ink],val:D.ink,rows:D.acc.map(c=>[hexMix(c,D.bg,D.tint/100),c])},PALF=PL.rows,HEADC=PL.head,GRIDC=PL.grid,EDGEC=PL.edge;
  const paintF=x=>{x.direction='rtl';x.textBaseline='middle';const LY=o.edit?[]:null,LR=r=>{if(LY)LY.push(r)},R=D.r,GR=D.muteC||'#555555',GP=D.gap==null?10:+D.gap;
    const T=(s,px,py,al,font,col)=>{font=String(font).replace(/^bold /,'');if(/[-]/.test(s))return drawRich(x,s,px,py,al,font,col||PL.ink);x.font=font;x.textAlign=al;x.fillStyle=col||PL.ink;x.fillText(String(s),px,py)};
    const rr=(X,Y,w,h,r)=>{x.beginPath();if(x.roundRect)x.roundRect(X,Y,w,h,r);else x.rect(X,Y,w,h)};
    const xt=(txt,bold,col,sz,k)=>{const z=+sz||D.xs,al=D.xal==='r'?'right':D.xal==='l'?'left':'center',px=D.xal==='r'?W-P:D.xal==='l'?P:W/2,fo=(bold?'bold ':'')+z+'px '+F,y0=y;
      String(txt||'').split('\n').forEach(ln=>{ln=ln.trim();if(!ln)return;wrap(ln,IW,fo).forEach(q=>{T(q,px,y+z/2+4,al,fo,col);y+=z+8})});if(k&&y>y0)LR({t:'txt',k,x:P,y:y0,w:IW,h:y-y0})};
    let y=8;xt(D.topText,0,null,D.fTop,'top');const dp=String(o.date||'').trim().split(/\s+/),d1=dp[0]||'',d2=dp.slice(1).join(' ');
    let lw=0,lh=0;
    if(logoOK()){const LH=+D.logoH||64,k=Math.min(IW*Math.min(.5,.3*LH/64)/logoImg.naturalWidth,LH/logoImg.naturalHeight,Math.max(1,LH/64));lw=logoImg.naturalWidth*k;lh=logoImg.naturalHeight*k;x.drawImage(logoImg,W-P-lw,y,lw,lh);LR({t:'logo',x:W-P-lw,y,w:lw,h:lh})}
    else{const sn=shopN();x.font='bold '+D.shop+'px '+F;lw=Math.min(x.measureText(sn).width,IW*.3);lh=Math.max(44,D.shop*2);T(sn,W-P,y+lh/2,'right','bold '+D.shop+'px '+F,D.shopC||PL.ink);LR({t:'txt',k:'shop',x:W-P-lw,y,w:lw,h:lh})}
    if(D.sDate){T(d1,P,y+(lh>=44?lh/2-10:20),'left',D.date+'px '+F,GR);T(d2,P,y+(lh>=44?lh/2+10:40),'left',D.date+'px '+F,GR);LR({t:'txt',k:'date',x:P,y,w:95,h:Math.max(lh,44)})}
    const awS=W-2*(P+Math.max(lw,95)+12),stk=logoOK()&&awS<120,aw=stk?IW:awS,tt=o.title||((custW()?custW()+' / ':'')+o.name),tf=D.title+'px '+F;
    const TL=D.mob?22:28,SL=D.mob?16:20,tl=[(_ft=fitF(tt,aw,tf)).s],sl=D.sSub?wrap(o.sub||'',aw,D.sub+'px '+F).filter(Boolean):[],bh=tl.length*TL+sl.length*SL,hh=stk?lh+6+bh+4:Math.max(lh,bh+4,D.mob?40:48);
    /* لو اللوجو كبير ومفيش مكان جنبه، اسم العميل ينزل تحته بعرض الفاتورة */
    let ty=stk?y+lh+6:y+(hh-bh)/2;tl.forEach(s=>{T(s,W/2,ty+TL/2,'center',_ft.font);ty+=TL});sl.forEach(s=>{T(s,W/2,ty+SL/2,'center',D.sub+'px '+F,GR);ty+=SL});
    {const t0=stk?y+lh+6:y+(hh-bh)/2;LR({t:'txt',k:'title',x:(W-aw)/2,y:t0,w:aw,h:tl.length*TL});if(sl.length)LR({t:'txt',k:'sub',x:(W-aw)/2,y:t0+tl.length*TL,w:aw,h:sl.length*SL})}
    y+=hh+8;xt(D.headText,0,null,D.fHead,'head');
    (o.meta||[]).forEach(m=>wrap(m,IW,D.meta+'px '+F).forEach(s=>{T(s,W-P,y+10,'right',D.meta+'px '+F);y+=24}));
    const tbl=(tb,xr0,w,opt)=>{opt=opt||{};const AL=i=>{const a=opt.al&&opt.al[i];return a==='r'?'right':a==='l'?'left':'center'},AX=(xr,c,i)=>{const a=AL(i),px=Math.max(4,D.pad/2+3);return a==='right'?xr-px-(tb.col&&PALF.length?6:0):a==='left'?xr-c+px:xr-c/2};const fs=opt.fs||D.tbl,lhh=fs+(D.mob?4:7),hdh=opt.hh>0?opt.hh:Math.max(+D.hdh||30,D.th+(D.mob?7:16)),cw=tb.w.map(v=>v*w),pad=D.pad;
      const FS=[],lines=tb.rows.map((r,k)=>r.map((c,i)=>{const q=fit1(c,cw[i]-pad,fs,(opt.bold&&opt.bold(i))||D.bold);(FS[k]=FS[k]||[])[i]=q.z;return[q.s]})),rh=lines.map(l=>Math.max(Math.max(...l.map(a=>a.length))*lhh+pad,opt.rh||0)),h=hdh+rh.reduce((a,b)=>a+b,0),X=xr0-w;
      x.save();rr(X,y,w,h,R);x.clip();x.fillStyle=HEADC;x.fillRect(X,y,w,hdh);
      let yy=y+hdh;tb.rows.forEach((r,k)=>{/* v258: صفوف الجدول واخدة نفس لون مربع الإجماليات بالتبادل */x.fillStyle=k%2?D.sumA:D.sumB;x.fillRect(X,yy,w,rh[k]);if(D.gAlt&&tb.grp&&tb.grp[k]%2){x.fillStyle=D.gAltC||D.sumA;x.fillRect(X,yy,w,rh[k])}const c=tb.col&&tb.col[k];if(c!=null&&PALF[c%PALF.length]){x.fillStyle=PALF[c%PALF.length][0];x.fillRect(X,yy,w,rh[k]);x.fillStyle=PALF[c%PALF.length][1];x.fillRect(xr0-6,yy,6,rh[k])}yy+=rh[k]});
      x.strokeStyle=GRIDC;x.lineWidth=+D.gw||1;let xx=xr0;cw.forEach((c,i)=>{xx-=c;if(i<cw.length-1){x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+h);x.stroke()}});
      if(D.hLine!==0){x.beginPath();x.moveTo(X,y+hdh);x.lineTo(xr0,y+hdh);x.stroke()}
      yy=y+hdh;rh.forEach((g,k)=>{yy+=g;if(k<rh.length-1){const sp=tb.grp&&tb.grp[k]!==tb.grp[k+1]&&+D.gSep>0;x.save();if(sp){x.strokeStyle=D.gSepC||EDGEC;x.lineWidth=+D.gSep}x.beginPath();x.moveTo(X,yy);x.lineTo(xr0,yy);x.stroke();x.restore()}});x.restore();
      let xr=xr0;tb.th.forEach((t,i)=>{T(t,AX(xr,cw[i],i),y+hdh/2,AL(i),fit1(t,cw[i]-4,opt.fs?fs-1:D.th,0).z+'px '+F,PL.hfg);xr-=cw[i]});
      yy=y+hdh;tb.rows.forEach((r,k)=>{let xr=xr0;r.forEach((c,i)=>{const bold=opt.bold&&opt.bold(i),col=tb.red&&tb.red[k]?(D.retC||'#b42318'):(opt.colr&&opt.colr(i))||PL.ink;const zz=D.mob&&AL(i)==='center'&&tb.th[i]==='المقاس'&&/^\s*[\d.]+\s*\/\s*[\d.]+\s*$/.test(String(c));if(zz){const q=String(c).split('/').map(v=>v.trim()),xc=xr-cw[i]/2,off=5+(cw[i]-10)/4,ff=(D.bold?'bold ':'')+fs+'px '+F,my=yy+rh[k]/2;const gp=Math.round(fs*.7);let mA=0,mB=0;x.save();x.font=ff;tb.rows.forEach(rr=>{const cc=String(rr[i]);if(/^\s*[\d.]+\s*\/\s*[\d.]+\s*$/.test(cc)){const z=cc.split('/').map(v=>v.trim());mA=Math.max(mA,x.measureText(z[0]).width);mB=Math.max(mB,x.measureText(z[1]).width)}});x.restore();x.save();x.font=(fs-2)+'px '+F;const xw=x.measureText('×').width;x.restore();const gp2=2,tot=mB+gp2+xw+gp2+mA,xs=xc-tot/2,dc=D.decC||col,TD=(v,xx)=>{const m=String(v).match(/^(\d*)(\.\d+)?$/);if(!m||!m[2]||dc===col){T(v,xx,my,'left',ff,col);return}T(m[1],xx,my,'left',ff,col);x.save();x.font=ff;const iw=x.measureText(m[1]).width;x.restore();T('\u200E'+m[2],xx+iw,my,'left',ff,dc)};TD(q[1],xs);T('×',xs+mB+gp2+xw/2,my,'center',(fs-2)+'px '+F,GR);TD(q[0],xs+mB+gp2+xw+gp2)}else lines[k][i].forEach((s,j)=>T(s,AX(xr,cw[i],i),yy+(rh[k]-lines[k][i].length*lhh)/2+lhh*j+lhh/2,AL(i),(bold||D.bold?'bold ':'')+FS[k][i]+'px '+F,col));xr-=cw[i]});yy+=rh[k]});
      x.strokeStyle=EDGEC;x.lineWidth=D.ew==null?1.2:+D.ew;rr(X,y,w,h,R);x.stroke();if(opt.lid)LR({t:'tbl',id:opt.lid,X,y,w,h,hdh,rows:rh.slice(),cw:cw.slice(),xr0,th:tb.th.slice()});return h};
    const tstyle=(a,b)=>a==='الإجمالي'?PL.tot:/^(المتبقي|الحساب بعد الدفعة)$/.test(a)?PL.gold:/^(المدفوع|صافي المدفوع|صافي الدفعة|المبلغ المدفوع)( \(.*\))?$/.test(a)?PL.paid:b?PL.lite:PL.lite2;
    const rowFont=(a,bold)=>{const kd=a==='الإجمالي'?'Tot':/^(المتبقي|الحساب بعد الدفعة)$/.test(a)?'Rem':/^(المدفوع|صافي المدفوع|صافي الدفعة|المبلغ المدفوع)( \(.*\))?$/.test(a)?'Paid':'',fz=+D['f'+kd]||(bold?D.sumBig:D.sum),bb=bold||(kd==='Paid'&&D.paidB);return{kd,fz,fo:(bb?'bold ':'')+fz+'px '+F}};
    /* مربع الإجماليات صغير على قد محتواه */
    const fitDims=()=>{let lw=0,vm=0;(o.sum||[]).filter(r=>!(D.hPrev&&r[0]==='رصيد سابق')).forEach(([a,b,bold])=>{x.font=rowFont(a,bold).fo;lw=Math.max(lw,x.measureText(String(a)).width);vm=Math.max(vm,x.measureText(String(b)).width)});
      const vwF=Math.max(64,vm+26);return{w:Math.min(IW*.62,Math.max(150,lw+vwF+30)),vw:vwF}};
    const totals=(X,w,vw)=>{const rows=(o.sum||[]).filter(r=>!(D.hPrev&&r[0]==='رصيد سابق')).map(([a,b,bold])=>{const q=rowFont(a,bold),fz=q.fz,fo=(_f=fitF(a,w-vw-16,q.fo)).font,kd=q.kd,ls=[_f.s];return{a,b,fo,fz,ls,st:tstyle(a,bold),rh:Math.max(+D['h'+kd]||D.sumH,ls.length*(fz+4)+10)}}),h=rows.reduce((q,r)=>q+r.rh,0);
      x.save();rr(X,y,w,h,R);x.clip();let yy=y;rows.forEach(r=>{x.fillStyle=r.st[0];x.fillRect(X,yy,w,r.rh);yy+=r.rh});
      x.strokeStyle=GRIDC;x.lineWidth=+D.gw||1;yy=y;rows.forEach((r,k)=>{yy+=r.rh;if(k<rows.length-1){x.beginPath();x.moveTo(X,yy);x.lineTo(X+w,yy);x.stroke()}});x.beginPath();x.moveTo(X+vw,y);x.lineTo(X+vw,y+h);x.stroke();x.restore();
      yy=y;rows.forEach(r=>{r.ls.forEach((s,j)=>T(s,X+w-10,yy+r.rh/2+(j-(r.ls.length-1)/2)*(r.fz+4),'right',r.fo,r.st[1]));T(r.b,X+vw/2,yy+r.rh/2,'center',r.fo,r.st[1]);yy+=r.rh});
      x.strokeStyle=EDGEC;x.lineWidth=D.ew==null?1.2:+D.ew;rr(X,y,w,h,R);x.stroke();return h};
    const HID={'المقاس':D.hSize,'العدد':D.hCnt,'الكمية':D.hQty,'السعر':D.hPrice},tws=(o.tables&&o.tables[0]&&o.tables[0].th[0]==='البيان')?o.tables[0]:null;
    const hc=tb=>{if(tb!==tws)return tb;const k=tb.th.map((t,i)=>i).filter(i=>!HID[tb.th[i]]);if(k.length===tb.th.length||k.length<2)return tb;const sm=k.reduce((q,i)=>q+tb.w[i],0);return{...tb,th:k.map(i=>tb.th[i]),w:k.map(i=>tb.w[i]/sm),rows:tb.rows.map(r=>k.map(i=>r[i]))}};
    const tabs=(o.tables||[]).map(hc);let lastF=tabs[0]&&tabs[0].w.length?tabs[0].w[tabs[0].w.length-1]:.14;const vw=D.sumV?IW*D.sumV/100:IW*lastF,tw=IW*D.sumW/100;
    const MW={'البيان':.25,'المقاس':.17,'العدد':.09,'الكمية':.13,'السعر':.15,'القيمة':.21},
      rowBox=(X,Y,cw,tx,fl,fg,h,fo,rad)=>{let xr=X+cw.reduce((a,b)=>a+b,0);x.save();if(rad){rr(X,Y,cw.reduce((a,b)=>a+b,0),h,rad);x.clip()}cw.forEach((c,i)=>{x.fillStyle=fl[i];x.fillRect(xr-c,Y,c,h);xr-=c});x.strokeStyle=GRIDC;x.lineWidth=+D.gw||1;xr=X+cw.reduce((a,b)=>a+b,0);cw.forEach((c,i)=>{xr-=c;if(i<cw.length-1){x.beginPath();x.moveTo(xr,Y);x.lineTo(xr,Y+h);x.stroke()}});x.restore();
        xr=X+cw.reduce((a,b)=>a+b,0);cw.forEach((c,i)=>{T(tx[i],xr-c/2,Y+h/2,'center',fo[i]||fo[0],fg[i]);xr-=c});x.strokeStyle=EDGEC;x.lineWidth=D.ew==null?1.2:+D.ew;if(rad){rr(X,Y,cw.reduce((a,b)=>a+b,0),h,rad);x.stroke()}else x.strokeRect(X,Y,cw.reduce((a,b)=>a+b,0),h);return h};
    const secT=()=>{tabs.forEach((tb0,ti)=>{let tb=tb0;if(tb.title){T(tb.title,W-P,y+8,'right','bold '+(D.tt||14)+'px '+F);y+=D.tt?D.tt+6:20}
      const first=D.mob&&ti===0&&tb===tabs[0]&&o.tables&&o.tables[0]&&o.tables[0].th[0]==='البيان';
      if(D.mob){tb={...tb};if(!D.rowCol)delete tb.col;if(first){const CW=D.cw||{},mw=tb.th.map(t=>+CW[t]>0?+CW[t]/100:(MW[t]||0));if(mw.every(v=>v>0)){const sm=mw.reduce((a,b)=>a+b,0);tb.w=mw.map(v=>v/sm)}}}
      const h=tbl(tb,W-P,IW,first?{al:tb.th.map(t=>(D.ca||{})[t]||'c'),lid:'main'}:{});y+=h;
      if(first&&!D.mtHide&&tb.w.length>=3&&o.sum&&o.sum[0]&&/^إجمالي الإذن/.test(o.sum[0][0])){const n=tb.w.length,wl=tb.w[n-2]*IW,wv=tb.w[n-1]*IW,fo=(+D.mtF||Math.max(7,D.tbl))+'px '+F,mh=+D.mtH||Math.min(22,Math.max(14,D.sumH)),mX=D.mtPos==='r'?W-P-wl-wv:D.mtPos==='c'?(W-wl-wv)/2:P;LR({t:'mt',x:mX,y,w:wl+wv,h:mh});y+=rowBox(mX,y,[wl,wv],['الإجمالي',o.sum[0][1]],[HEADC,D.sumA],[PL.hfg,PL.ink],mh,[fo,fo],+D.sumR)}
      y+=GP})};
    /* مربع الإجماليات لما يكون لوحده: وسط (الافتراضي) أو يمين أو شمال */
    const sX=w=>D.sumPos==='r'?W-P-w:D.sumPos==='c'?(W-w)/2:P;
    const secSM=()=>{const its=D.sItems&&o.items&&o.items.length?o.items:null,rows0=(o.sum||[]).filter((r,i)=>!(D.hPrev&&r[0]==='رصيد سابق')&&!(o.tables&&o.tables.length&&i===0&&/^إجمالي الإذن/.test(r[0])));
      const rk=(a,bold)=>{const kd=a==='الإجمالي'?'Tot':/^(المتبقي|الحساب بعد الدفعة)$/.test(a)?'Rem':/^(المدفوع|صافي المدفوع|صافي الدفعة|المبلغ المدفوع)( \(.*\))?$/.test(a)?'Paid':'',fz=+D['f'+kd]||((kd==='Tot'||kd==='Rem')?D.sumBig:D.sum),bb=kd==='Tot'||kd==='Rem'||bold||(kd==='Paid'&&D.paidB);return{kd,fz,ff:(bb?'bold ':'')+fz+'px '+F,rh0:+D['h'+kd]||D.sumH}};
      let lwm=60,vwm=50;rows0.forEach(([a,b,bold])=>{x.font=rk(a,bold).ff;lwm=Math.max(lwm,x.measureText(String(a)).width+16);vwm=Math.max(vwm,x.measureText(String(b)).width+16)});
      const fit=D.sumFit!==0,GAP=9,SS=D.sideSum==null?1:+D.sideSum,side=!!its&&SS!==0;let tw=fit?Math.min(lwm+vwm,IW*(side?.5:.7)):IW*Math.min(side?.5:1,Math.max(.3,(+D.sumW||40)/100)),vw=fit?Math.min(vwm,tw*.55):tw*.5,lw;
      if(+D.sumV>0){vw=IW*D.sumV/100;if(fit)tw=Math.min(IW*(side?.5:.95),Math.max(tw,vw+lwm));vw=Math.min(vw,tw-40)}lw=tw-vw;{const need=lwm-4;if(lw<need){tw=Math.min(IW*(side?.5:.95),vw+need);lw=tw-vw}}
      const sw=its?(side?Math.round(IW-tw-GAP):IW):0;let hS=0;
      if(its){const nq=its.every(r=>r[2]==='-'),st=nq?{th:['الصنف','العدد','القيمة'],w:[.44,.22,.34],rows:its.map(r=>[r[0],r[1],r[4]])}:{th:['الصنف','العدد','الأمتار','القيمة'],w:[.33,.17,.22,.28],rows:its.map(r=>[r[0],r[1],r[2],r[4]])},h1=tbl(st,W-P,sw,{fs:D.items,rh:+D.itRow||0,hh:+D.itHead||0,lid:'items'});const it=o.itemsTot||{},cw=st.w.map(v=>v*sw),fo2='bold '+D.items+'px '+F;
        hS=h1+rowBox(W-P-sw,y+h1,cw,nq?['الإجمالي',String(it.c==null?'':it.c),it.v==null?'':f(it.v)]:['الإجمالي',String(it.c==null?'':it.c),it.q?fq(it.q):'-',it.v==null?'':f(it.v)],nq?[HEADC,D.sumA,D.sumA]:[HEADC,D.sumA,D.sumA,D.sumA],nq?[PL.hfg,PL.ink,PL.ink]:[PL.hfg,PL.ink,PL.ink,PL.ink],+D.itRow||D.sumH,[fo2],[0,0,R,R])}
      if(its&&!side){y+=hS+GP;hS=0}
      const X=side?P:(D.sumPos==='r'?W-P-tw:D.sumPos==='c'?(W-tw)/2:P);let hT=0,yy=y,nI=0,RW=[];
      let hPre=0;rows0.forEach(([a,b,bold])=>{const q=rk(a,bold),ls=(_f=fitF(a,lw-8,q.ff),q.ff=_f.font,[_f.s]);hPre+=Math.max(q.rh0,ls.length*(q.fz+4)+4)});x.save();rr(X,y,tw,hPre,+D.sumR);x.clip();
      rows0.forEach(([a,b,bold])=>{const q=rk(a,bold),last=q.kd==='Rem',ls=(_f=fitF(a,lw-8,q.ff),q.ff=_f.font,[_f.s]),rh=Math.max(q.rh0,ls.length*(q.fz+4)+4),
          lc=last?PL.gold:q.kd==='Tot'?PL.tot:[HEADC,PL.hfg],vc=last?PL.gold:q.kd==='Paid'?PL.paid:q.kd==='Tot'?[D.sumA,PL.ink]:[(nI++%2?D.sumB:D.sumA),PL.ink];
        x.save();x.fillStyle=lc[0];x.fillRect(X+vw,yy,lw,rh);x.fillStyle=vc[0];x.fillRect(X,yy,vw,rh);x.restore();
        x.strokeStyle=GRIDC;x.lineWidth=+D.gw||1;x.beginPath();x.moveTo(X+vw,yy);x.lineTo(X+vw,yy+rh);x.stroke();x.beginPath();x.moveTo(X,yy+rh);x.lineTo(X+tw,yy+rh);x.stroke();
        RW.push({y:yy,h:rh,kd:q.kd});ls.forEach((t,j)=>T(t,X+vw+lw/2,yy+rh/2+(j-(ls.length-1)/2)*(q.fz+4),'center',q.ff,lc[1]));T(b,X+vw/2,yy+rh/2,'center',q.ff,vc[1]);yy+=rh});hT=yy-y;x.restore();
      if(hT){x.strokeStyle=EDGEC;x.lineWidth=D.ew==null?1.2:+D.ew;rr(X,y,tw,hT,+D.sumR);x.stroke();LR({t:'tot',X,y,w:tw,h:hT,vw,side,rows:RW})}
      y+=Math.max(hS,hT)+GP};
    const secS=()=>{if(D.mob)return secSM();const its=D.sItems?o.items:null;
      if(its&&its.length){T('ملخص الأصناف',W-P,y+8,'right','bold '+(D.tt||14)+'px '+F);y+=D.tt?D.tt+6:20;
        const FT=D.sumFit!==0,fd=FT?fitDims():null,SS=D.sideSum==null?1:+D.sideSum,fS=SS===2,tw1=FT?fd.w:tw,vw1=FT?fd.vw:vw,twS=fS&&!FT?Math.min(tw,IW*.45):tw1,vwS=fS&&!FT?Math.min(vw,twS*.5):vw1,side=SS!==0&&(fS||(its.length<=5&&(IW-tw1-12)>=IW*.35)),nq=its.every(r=>r[2]==='-'),st=nq?{th:['الصنف','العدد','السعر','القيمة'],w:[.4,.14,.2,.26],rows:its.map(r=>[r[0],r[1],r[3],r[4]]),col:its.map(r=>r[5])}:{th:['الصنف','العدد','الأمتار','السعر','القيمة'],w:[.34,.1,.16,.16,.24],rows:its.map(r=>r.slice(0,5)),col:its.map(r=>r[5])},lc=st.th.length-1;
        const sh=tbl(st,W-P,side?IW-twS-12:IW,{fs:D.items,bold:i=>i===0||i===lc,colr:i=>i===lc?PL.val:null});
        if(side){const th2=totals(P,twS,vwS);y+=Math.max(sh,th2)+GP}else{y+=sh+GP;y+=totals(sX(tw1),tw1,vw1)+GP}}
      else if(o.sum&&o.sum.length){const FT=D.sumFit!==0,fd=FT?fitDims():null,w=FT?fd.w:Math.min(IW,Math.max(IW*Math.max(.5,D.sumW/100),vw+130));y+=totals(sX(w),w,FT?fd.vw:vw)+GP}};
    const secN=()=>{if(D.hNote)return;
      if(o.note){y+=2;xt('ملاحظة: '+o.note,0,null,D.fNote,'note')}
      if(o.gn&&o.gn.length){y+=6;o.gn.forEach(n=>{xt(n.t,n.b,n.c||PL.ink,D.fNote,'notes');y+=2})}
      else{if(o.gnote){y+=8;xt(o.gnote,0,null,D.fNote,'notes')}
        if(String(D.redNote||'').trim()){y+=6;xt(D.redNote,1,D.redColor,D.fNote,'notes')}}};
    const secP=()=>{const ps=o.ps;if(!ps||!ps.length)return;const fz=Math.round(W/24),ih=fz*1.5,lh=ih+8,G=fz*.4;y+=8;let cx=W-P;x.save();x.font='bold '+fz+'px '+F;x.fillStyle=PL.ink;x.textAlign='right';x.textBaseline='middle';
      ps.forEach(([k,v])=>{const im=payImgs&&payImgs[String(k)[0]];if(im&&im.complete&&im.naturalWidth){const iw=ih*im.naturalWidth/im.naturalHeight;x.drawImage(im,cx-iw,y,iw,ih);cx-=iw+G}else if(k){const t=PAY_TOK[String(k)[0]]||k;x.fillText(t,cx,y+ih/2);cx-=x.measureText(t).width+G}x.fillText(v,cx,y+ih/2);cx-=x.measureText(v).width+fz*1.6});x.restore();y+=lh};
    const SEC={tables:secT,summary:()=>{secS();secP()},notes:secN};D.order.forEach(k=>SEC[k]&&SEC[k]());
    if(String(D.footText||'').trim()){y+=6;xt(D.footText,0,null,D.fFoot,'foot')}
    if(LY)window.__LAY={items:LY,W,H:y+8};return y+8};
  const pf=o.fancy&&!TH?paintF:paint;
  const H=Math.ceil(pf(mc)),cv=document.createElement('canvas');
  cv.width=W*2;cv.height=H*2;const x=cv.getContext('2d',{willReadFrequently:true});/* الرسم على المعالج: قراية الصورة من كارت الشاشة في الموبايل بطيئة */x.scale(2,2);if(pf===paintF){x.fillStyle=PL.bg;x.fillRect(0,0,W,H);if(PL.mar){const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#f4f5f7');g.addColorStop(.3,'#e6e9ee');g.addColorStop(.5,'#f6f7f9');g.addColorStop(.75,'#e3e6eb');g.addColorStop(1,'#f3f4f6');x.fillStyle=g;x.fillRect(0,0,W,H);x.strokeStyle='rgba(110,120,145,.08)';x.lineWidth=1;for(let i=-H;i<W;i+=58){x.beginPath();x.moveTo(i,0);x.lineTo(i+H*.45,H);x.stroke()}x.strokeStyle='rgba(110,120,145,.05)';for(let i=0;i<W+H;i+=140){x.beginPath();x.moveTo(i,0);x.lineTo(i-H*.7,H);x.stroke()}}}else{x.fillStyle='#fff';x.fillRect(0,0,W,H)}pf(x);drawWM(x,W,H,o,TH,pf===paintF?PL.head:AC);return cv}

/* [لوجو, المبلغ] لكل طريقة دفع، عشان تترسم تحت الإجماليات */
function payStrip(r,raw){if(PY(r))return r.pays.filter(y=>+y.a>0).map(y=>[payTok(y.n)||y.n,f(y.a)]);const v=+raw||0;return v>0?[[payTok(r.pfWhy)||r.pfWhy,f(v)]]:[]}
const nn=x=>x.rt?'مرتجع'+(x.src?' من فاتورة '+x.src:'')+' - '+x.n:x.n;
function invSheet(r,paper){const TH=paper==='t80'||paper==='t58',fancy=!TH&&pget('fancyInv',true)&&!(r.rows||[]).some(x=>x.cols),lbl=x=>nn(x)+(x.q>0?(+x.w>0&&+x.h>0&&+x.w>+x.h?' ('+x.h+'/'+x.w+')':' ('+x.w+'/'+x.h+')'):'');const base={name:r.cname,date:stamp(r.ts),note:r.note,wm:1};
  const cd=(pureRet(r)?'مرتجع · ':'')+(r.code?'كود '+r.code+' · ':'')+(r.rcode?'كود المرتجع '+r.rcode+' · ':'');
  if(r.type==='pay')return{...base,fancy,ps:payStrip(r,r.pfv?r.amtRaw:r.amount),st:(+r.rest||0)<=0?'paid':'',...(Array.isArray(r.gn)?{gn:r.gn,gnote:r.gnote||''}:noteSnap()),sub:cd+(isGen()?'إيصال دفعة':'إذن دفعة')+(r.no?' رقم '+r.no:''),sum:[['الحساب قبل الدفعة',fb(r.prev)],...(PY(r)?[...r.pays.map(y=>[(payTok(y.n)||y.n)+(y.p>0?' (خصم '+fq(y.p)+'%)':''),f(y.a)]),...(r.pfv?[['إجمالي خصم التحويلات',f(r.pfv)]]:[]),['صافي الدفعة',f(r.amount),1]]:r.pfv?[[payLbl('المبلغ المدفوع',r.pfWhy,r.amtRaw),f(r.amtRaw)],['خصم '+fq(r.pf)+'% '+(payTok(r.pfWhy)||'من المدفوع'),f(r.pfv)],['صافي الدفعة',f(r.amount),1]]:[[payLbl('المبلغ المدفوع',r.pfWhy,r.amount),f(r.amount),1]]),['الحساب بعد الدفعة',fb(r.rest),1]]};
  const RZ=/\s*(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*$/,rdz=x=>x.t==='rd'&&!(x.q>0)&&!x.rt?String(x.n).match(RZ):null,bn=x=>rdz(x)?String(x.n).replace(RZ,''):x.n,nb=x=>{const m=rdz(x);return m?nn(x).replace(RZ,''):nn(x)};
  const pl0=r.rows.filter(x=>!x.cols),pl=(()=>{const o={};let n=0;pl0.forEach(x=>{if(!(bn(x) in o))o[bn(x)]=n++});return pl0.map((x,i)=>[x,i]).sort((a,b)=>o[bn(a[0])]-o[bn(b[0])]||a[1]-b[1]).map(a=>a[0])})(),ar=pl.some(x=>x.q>0||(!TH&&rdz(x))),tables=[];
  const cmap={};let cn=0;pl.forEach(x=>{if(!(bn(x) in cmap))cmap[bn(x)]=cn++});
  const grp={},ord=[];pl.forEach(x=>{const k=bn(x)+'|'+(+x.p||0);if(!grp[k]){grp[k]={n:bn(x),p:+x.p||0,c:0,q:0,v:0,a:x.q>0};ord.push(k)}const sg=x.rt?-1:1;grp[k].c+=sg*(+x.c||0);grp[k].q+=sg*(+x.q||0);grp[k].v+=(+x.v||0)});
  const itemsTot=ord.reduce((a,k)=>{const y=grp[k];a.c+=y.c;a.q+=y.q;a.v+=y.v;return a},{c:0,q:0,v:0}),showSum=ord.length>=2||(ord.length===1&&pl.length>=3),items=showSum?ord.map(k=>{const y=grp[k];return[y.n,String(y.c),y.a?fq(y.q):'-',f(y.p),f(y.v),cmap[y.n]]}):[];
  if(pl.length)tables.push(TH?(paper==='t58'?{th:['البيان','العدد','القيمة'],w:[.5,.14,.36],rows:pl.map(x=>[lbl(x),x.c,f(x.v)])}:{th:['البيان','العدد','السعر','القيمة'],w:[.4,.12,.24,.24],rows:pl.map(x=>[lbl(x),x.c,f(x.p),f(x.v)])}):ar?{th:['البيان','المقاس','العدد','الكمية','السعر','القيمة'],w:[.3,.16,.1,.14,.14,.16],rows:pl.map(x=>{const a=x.q>0,m=rdz(x);return[nb(x),a?(+x.w>+x.h?x.h+'/'+x.w:x.w+'/'+x.h):m?(+m[1]>+m[2]?m[2]+'/'+m[1]:m[1]+'/'+m[2]):'-',x.c,a?fq(x.q):'-',f(x.p),f(x.v)]})}
    :{th:['البيان','العدد','السعر','القيمة'],w:[.46,.14,.2,.2],rows:pl.map(x=>[nn(x),x.c,f(x.p),f(x.v)])});
  const G={};r.rows.filter(x=>x.cols).forEach(x=>(G[x.t]=G[x.t]||[]).push(x));
  if(fancy&&tables[0]){tables[0].col=pl.map(x=>cmap[bn(x)]);tables[0].red=pl.map(x=>!!x.rt)}
  if(!TH&&tables[0]&&pl.length){const gm={};let gn=0;tables[0].grp=pl.map(x=>{const k=bn(x);if(!(k in gm))gm[k]=gn++;return gm[k]})}
  if(TH&&items.length)tables.push({title:'ملخص الأصناف',th:['الصنف','العدد','القيمة'],w:[.5,.14,.36],rows:items.map(i=>[i[0],i[1],i[4]])});
  Object.values(G).forEach(g=>{const k=g[0].cols.length;tables.push({title:g[0].tn||'',th:['البيان',...g[0].cols.map(c=>c.l)],w:[.3,...g[0].cols.map(()=>.7/k)],rows:g.map(x=>[x.n,...x.cols.map(c=>c.v)])})});
  const sum=[[(isGen()?'إجمالي الأصناف':'إجمالي الإذن')+(r.tq>0?' ('+fq(r.tq)+' م²)':''),f(r.sub)]];(r.sums||[]).forEach(x=>sum.push(['إجمالي '+x.l,f(x.v)]));
  if(r.nylon)sum.push(['نولون',f(r.nylon)]);if(r.disc)sum.push(['خصم'+(r.discWhy?' ('+r.discWhy+')':''),f(r.disc)]);if(r.dpv)sum.push(['خصم '+fq(r.dp)+'%',f(r.dpv)]);
  sum.push(['رصيد سابق',fb(r.prev)],['الإجمالي',fb(r.total),1]);if(PY(r)){r.pays.forEach(y=>sum.push(['مدفوع '+(payTok(y.n)||y.n)+(y.p>0?' (خصم '+fq(y.p)+'%)':''),f(y.a)]));if(r.pfv)sum.push(['إجمالي خصم التحويلات',f(r.pfv)]);sum.push([r.pfv?'صافي المدفوع':'إجمالي المدفوع',f(r.paid+(r.refund||0))])}else if(r.pfv)sum.push([payLbl('المبلغ المدفوع',r.pfWhy,r.paidRaw),f(r.paidRaw)],['خصم '+fq(r.pf)+'% '+(payTok(r.pfWhy)||'من المدفوع'),f(r.pfv)],['صافي المدفوع',f(r.paid+(r.refund||0))]);else sum.push([payLbl('المدفوع',r.pfWhy,r.paid+(r.refund||0)),f(r.paid+(r.refund||0))]);if(r.refund)sum.push(['رد كاش للعميل',f(-r.refund)]);sum.push(['المتبقي',fb(r.rest),1]);
  return{...base,fancy,ps:payStrip(r,r.pfv?r.paidRaw:r.paid+(r.refund||0)),st:pureRet(r)?'ret':(+r.rest||0)<=0?'paid':'',items:fancy?items:[],itemsTot,sub:cd+((lsv('docw','إذن صرف')?lsv('docw','إذن صرف')+' ':'')+'رقم '+r.no),tables,sum,gnote:r.gnote||'',gn:Array.isArray(r.gn)?r.gn:null}}

/* ---------- عرض/حفظ/مشاركة الصورة ---------- */
let curBlob=null,curName='',curPhone='',baseMsg='',curRec=null;
const dataBlob=u=>{const b=atob(u.slice(u.indexOf(',')+1)),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new Blob([a],{type:'image/png'})};
/* علامة "جاري الفتح" بتظهر قبل الرسم، عشان الضغطة تبان على طول حتى على موبايل بطيء */
const busyOn=t=>{const b=$('busy');b.textContent=t;b.classList.remove('hide');return new Promise(r=>{const z=setTimeout(r,80);requestAnimationFrame(()=>setTimeout(()=>{clearTimeout(z);r()},0))})},busyOff=()=>$('busy').classList.add('hide');
async function dl(blob,name){
  try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);return'anchor'}catch(e){return'fail'}}
async function downloadCur(){if(!curBlob)return;const s=await dl(curBlob,curName);
  $('resm').textContent=baseMsg+({ok:' · تم حفظ الصورة ✓',anchor:' · تم تنزيل الصورة ✓',declined:' · تم الإلغاء',fail:' · اضغط مطولاً على الصورة لحفظها'}[s]||'')}
async function showImg(cv,name,msg,auto,phone,rec){
  /* toBlob بيستنى وقت فراغ المتصفح (ثانية على الكمبيوتر وثواني على الموبايل)، فبنحوّل الصورة مباشرة */
  curSpec=lastSpec;paperLabels();const imgURL=cv.toDataURL('image/png');curBlob=dataBlob(imgURL);curName=name;curPhone=phone||'';baseMsg=msg||'';curRec=rec||null;
  $('resundo').classList.toggle('hide',!(rec&&lastSaved&&lastSaved.id===rec.id&&Date.now()-lastSaved.at<10*60e3));$('resdel').classList.toggle('hide',!rec);$('resedit').classList.toggle('hide',!(rec&&pget('editInv',true)&&!(rec.rows||[]).some(x=>x.cols)));$('resdup').classList.toggle('hide',!(rec&&rec.type==='inv'&&pget('dupInv',true)&&!(rec.rows||[]).some(x=>x.cols)));{const rc=$('rescut');if(rc)rc.classList.toggle('hide',!(rec&&rec.type==='inv'&&(rec.rows||[]).some(x=>!x.rt&&x.t!=='rd'&&+x.w>0&&+x.h>0)))}disarm($('resdel'));$('resdel').textContent='🗑️ حذف';$('restx').classList.toggle('hide',!rec);$('resTxtBox').classList.toggle('hide',!rec);if(rec){$('resTxt').value=txtOf(rec);syncTx()}
  let canS=false;try{canS=!!(navigator.canShare&&navigator.canShare({files:[new File([curBlob],name,{type:'image/png'})]}))}catch(e){}
  const hasN=!!waNum(curPhone),sh=$('ressh');
  sh.classList.toggle('hide',!canS);$('reswa').classList.toggle('hide',canS&&!hasN);
  sh.classList.toggle('main',!hasN);sh.classList.toggle('b-green',!hasN);sh.classList.toggle('alt',hasN);sh.textContent=hasN?'📤 مشاركة':'📤 إرسال للعميل';$('reswa').style.flex=hasN?'1 1 100%':'';if(hasN)$('resdl').before(sh);else $('reswa').before(sh);
  $('reshint').textContent=hasN?'بيفتح شات العميل والصورة متنسخة: دوس مطولاً في خانة الرسالة واختار «لصق». لو اللصق ما ظهرش، استخدم «📤 مشاركة».':canS?'لو عايز الزرار يفتح شات العميل على طول، اكتب رقمه في بياناته.':'الصورة بتتنسخ ويتفتح شات العميل. الصقها (اضغط مطولاً ثم لصق) وأرسل.';
  $('resimg').src=imgURL;$('resm').textContent=baseMsg;$('res').classList.remove('hide');
  $('res').scrollTop=0;ordUI();
  if(auto)await downloadCur()}
$('resdl').onclick=downloadCur;$('resx').onclick=()=>$('res').classList.add('hide');
$('resdel').onclick=async()=>{if(!curRec)return;if(!ok2($('resdel')))return;const rr=curRec;if(!await guard(rr,'اكتب الرقم السري لحذف الفاتورة'))return;if(curRec!==rr)return;
  const cid=curRec.cid;trashPut(curRec);del('invoices',curRec.id);reflow(cid);curRec=null;$('res').classList.add('hide');drawCusts();drawDash();drawTrash();if(lastC){$('prev').value=balOf(lastC)||'';calc()}};
$('ressh').onclick=async()=>{if(!curBlob)return;const file=new File([curBlob],curName,{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:curName,text:curText()});return}catch(e){if(e&&e.name==='AbortError')return}}
  $('resm').textContent=baseMsg+' · المتصفح ده مش بيشارك صور، بنحفظ الصورة...';
  const r=await dl(curBlob,curName);
  $('resm').textContent=baseMsg+({ok:' · تم حفظ الصورة: افتح واتساب وأرفقها من المعرض أو الملفات',anchor:' · تم تنزيل الصورة: أرفقها في واتساب',declined:' · تم الإلغاء',fail:' · اضغط مطولاً على الصورة وشاركها'}[r]||'')};
/* ---------- PDF والطباعة (A4 أو ورق حراري) ---------- */
const PAPERS={a4:{n:'A4',w:595.28,h:841.89,m:28},t80:{n:'حراري 80',w:226.77,m:11},t58:{n:'حراري 58',w:164.41,m:8}};
const paperKey=()=>PAPERS[lsv('paper','a4')]?lsv('paper','a4'):'a4';
function paperLabels(){const n=PAPERS[paperKey()].n;$('respdf').textContent='📄 PDF · '+n;$('resprint').textContent='🖨 طباعة · '+n}
const renderPaper=(p,out)=>curRec?sheet({...invSheet(curRec,p),paper:p,out}):sheet({...curSpec,paper:p,out});
const jpgBytes=cv=>{const b=atob(cv.toDataURL('image/jpeg',.92).split(',')[1]),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
function buildPdf(pages){const enc=new TextEncoder(),parts=[],offs=[];let len=0;
  const push=b=>{const u=typeof b==='string'?enc.encode(b):b;parts.push(u);len+=u.length};
  const obj=(n,arr)=>{offs[n]=len;push(n+' 0 obj\n');arr.forEach(b=>push(b));push('\nendobj\n')};
  push('%PDF-1.4\n');const N=2+pages.length*3;
  obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2,['<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>']);
  pages.forEach((p,i)=>{const pg=3+i*3,ct=pg+1,im=pg+2,cs='q '+p.w.toFixed(2)+' 0 0 '+p.h.toFixed(2)+' '+p.x.toFixed(2)+' '+(p.ph-p.y-p.h).toFixed(2)+' cm /Im0 Do Q';
    obj(pg,['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+p.pw.toFixed(2)+' '+p.ph.toFixed(2)+'] /Resources << /XObject << /Im0 '+im+' 0 R >> >> /Contents '+ct+' 0 R >>']);
    obj(ct,['<< /Length '+cs.length+' >>\nstream\n',cs,'\nendstream']);
    obj(im,['<< /Type /XObject /Subtype /Image /Width '+p.iw+' /Height '+p.ih+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.jpg.length+' >>\nstream\n',p.jpg,'\nendstream'])});
  const xr=len;push('xref\n0 '+(N+1)+'\n0000000000 65535 f \n');for(let n=1;n<=N;n++)push(String(offs[n]).padStart(10,'0')+' 00000 n \n');
  push('trailer\n<< /Size '+(N+1)+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF');return new Blob(parts,{type:'application/pdf'})}
function pdfFor(cv,pk){const P=PAPERS[pk],pages=[];
  if(pk==='a4'){const iw=P.w-2*P.m,sc=iw/cv.width,sh=Math.floor((P.h-2*P.m)/sc);
    for(let y0=0;y0<cv.height;y0+=sh){const hh=Math.min(sh,cv.height-y0),c=document.createElement('canvas');c.width=cv.width;c.height=hh;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,hh);x.drawImage(cv,0,y0,cv.width,hh,0,0,cv.width,hh);
      pages.push({pw:P.w,ph:P.h,x:P.m,y:P.m,w:iw,h:hh*sc,iw:c.width,ih:hh,jpg:jpgBytes(c)})}}
  else{const iw=P.w-2*P.m,sc=iw/cv.width,h=cv.height*sc;pages.push({pw:P.w,ph:h+2*P.m,x:P.m,y:P.m,w:iw,h,iw:cv.width,ih:cv.height,jpg:jpgBytes(cv)})}
  return buildPdf(pages)}
$('respdf').onclick=async()=>{if(!curBlob)return;const m=$('resm');
  try{const pk=paperKey(),blob=pdfFor(renderPaper(pk,'pdf'),pk),name=curName.replace(/\.png$/i,'')+'.pdf',file=new File([blob],name,{type:'application/pdf'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:name});return}catch(e){if(e&&e.name==='AbortError')return}}
    const r=await dl(blob,name);m.textContent=baseMsg+({ok:' · تم حفظ الـ PDF ✓',anchor:' · تم تنزيل الـ PDF ✓'}[r]||' · الـ PDF متعملش، جرّب تاني')}
  catch(e){m.textContent=baseMsg+' · الـ PDF متعملش، جرّب تاني'}};
$('resprint').onclick=()=>{if(!curBlob)return;
  try{const pk=paperKey(),url=renderPaper(pk,'print').toDataURL('image/png'),css=pk==='a4'?'@page{size:A4;margin:10mm}body{margin:0}img{width:100%}':'@page{size:'+(pk==='t80'?'80':'58')+'mm auto;margin:0}body{margin:0}img{display:block;width:'+(pk==='t80'?72:48)+'mm;margin:0 auto}',
      f=document.createElement('iframe');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(f);
    const d=f.contentWindow.document;d.open();d.write('<!doctype html><html><head><meta charset="utf-8"><style>'+css+'</style></head><body><img id="i" src="'+url+'"></body></html>');d.close();
    const go=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){$('resm').textContent=baseMsg+' · الطباعة منفعتش، جرّب تاني'}setTimeout(()=>f.remove(),120000)},im=d.getElementById('i');
    if(im.complete)go();else im.onload=go}
  catch(e){$('resm').textContent=baseMsg+' · الطباعة منفعتش، جرّب تاني'}};

const TPLD={inv:'{المحل}\n{اللقب} / {العميل}\n{الفاتورة} - {التاريخ}\nالإجمالي: {الإجمالي}\nالمدفوع: {المدفوع}\nالمتبقي: {المتبقي}',pay:'{المحل}\n{اللقب} / {العميل}\nإيصال دفعة كود {الكود}: {المبلغ}\nالحساب بعد الدفعة: {الحساب}',rem:'السلام عليكم {اللقب} {العميل}\nحسابك عندنا في {المحل}: {الحساب} جنيه.\n{ختام_السداد}. شكراً لتعاملك معنا.',rdy:'السلام عليكم {اللقب} {العميل}\nطلبك (كود {الكود}) جاهز للاستلام من {المحل}.\n{الحساب}\nفي انتظارك، شكراً لتعاملك معنا.'};
const tplOf=k=>{const v=lsv('tpl_'+k,'');return v.trim()?v:TPLD[k]},shopN=()=>lsv('shop',''),docW=()=>lsv('docw','إذن صرف'),custW=()=>lsv('custw','الأستاذ');
function fillTpl(k,m,tp){m['اللقب']=custW();return (tp||tplOf(k)).split('\n').map(l=>{const had=/\{[^}]+\}/.test(l),o=l.replace(/\{([^}]+)\}/g,(x,key)=>key in m?m[key]:x).replace(/ {2,}/g,' ').replace(/^\s*\/\s*/,'');return{o,skip:had&&!o.trim()}}).filter(x=>x.skip===false).map(x=>x.o).join('\n')}
function txtOf(r){const m={'المحل':shopN(),'العميل':r.cname,'التاريخ':dshort(r.ts),'طريقة_الدفع':r.pfWhy||'','عمولة_الدفع':r.pfv?f(r.pfv):'','الخصم':r.disc?f(r.disc):'','سبب_الخصم':r.discWhy||''};
  m['الكود']=r.code?String(r.code):'';
  if(r.type==='pay'){m['المبلغ']=f(r.amount);m['الحساب']=fb(r.rest);return fillTpl('pay',m)}
  m['كود_المرتجع']=r.rcode?String(r.rcode):'';
  m['الفاتورة']=(r.code?'كود '+r.code+' · ':'')+(docW()?docW()+' ':'')+'رقم '+r.no+(r.rcode?' · كود المرتجع '+r.rcode:'');m['الإجمالي']=fb(r.total);m['المدفوع']=f(r.paid);m['المتبقي']=fb(r.rest);return fillTpl('inv',m)}
/* رسالة التذكير: القالب + سطور بتتضاف لوحدها لو ليها قيمة (مدة عدم الدفع · أقدم فاتورة متأخرة · رصيد سابق · بيانات الدفع). كل صياغة بتتعدّل من الإعدادات، والصياغة بتتحزّم بعد عدد أيام وتبقى «تواصل معنا» بعد مدة أطول */
const dayW=d=>d===1?'يوم':d===2?'يومين':d<=10?d+' أيام':d+' يوم';
function lateInfo(c){let last=0,first=0;S.invoices.forEach(r=>{if(r.cid!==c.id)return;if(pd(r)>0&&r.ts>last)last=r.ts;if(!first||r.ts<first)first=r.ts});const t=last||first;return t?{d:Math.floor((Date.now()-t)/864e5),paid:!!last}:null}
const RT0={soft:'برجاء السداد في أقرب وقت',firm:'نرجو السداد خلال الأيام القادمة، لأن المبلغ متأخر من فترة',long:'برجاء التواصل معنا في أقرب وقت لترتيب السداد',paid:'مرّ {عدد} على آخر دفعة منك',never:'مرّ {عدد} من غير ما يتدفع حاجة',old:'أقدم فاتورة متأخرة: {التاريخ} · متبقي {المتبقي}',bal:'عليك رصيد سابق: {المبلغ}',pay:'للدفع: {البيانات}'};
const rt=k=>{const v=lsv('rt_'+k,'').trim();return v||RT0[k]},rtf=(s,o)=>s.replace(/\{([^}]+)\}/g,(x,k)=>k in o?o[k]:x);
const numSet=(k,d)=>{const v=parseInt(toEn(lsv(k,String(d))),10);return isNaN(v)?d:v},remFirmD=()=>numSet('remfirm',30),remLongD=()=>numSet('remlong',90);
const lateTxt=c=>{const li=lateInfo(c);return li&&li.d>=1?rtf(rt(li.paid?'paid':'never'),{'عدد':dayW(li.d)}):''};
const remPayTxt=()=>{const p=lsv('rempay','').trim();return p?rtf(rt('pay'),{'البيانات':p}):''};
const dueNow=r=>r.type==='inv'?Math.max(0,rd2(val(r)-(r.paid||0))):0;
const oldTxt=c=>{let o=null;S.invoices.forEach(r=>{if(r.cid!==c.id||dueNow(r)<=0||Date.now()-r.ts<864e5)return;if(!o||r.ts<o.ts)o=r});return o?rtf(rt('old'),{'التاريخ':dshort(o.ts),'المتبقي':f(dueNow(o))}):''};
const balTxt=c=>+c.open>0?rtf(rt('bal'),{'المبلغ':f(c.open)}):'';
function remMake(m,tone){let tp=tplOf('rem');const end=tone==='long'?rt('long'):tone==='firm'?rt('firm'):rt('soft');m['ختام_السداد']=end;
  if(!tp.includes('{ختام_السداد}'))tp=tp.split(RT0.soft).join(end);
  const ins=(v,after)=>{if(!m[v]||tp.includes('{'+v+'}'))return;const ls=tp.split('\n');let i=-1;for(const x of after||[]){i=ls.findIndex(l=>l.includes(x));if(i>=0)break}ls.splice(i<0?ls.length:i+1,0,'{'+v+'}');tp=ls.join('\n')};
  if(pget('remDays',true))ins('مدة_الدين',['{الحساب}']);if(pget('remOld',true))ins('أقدم_فاتورة',['{مدة_الدين}','{الحساب}']);if(pget('remBal',true))ins('رصيد_سابق',['{أقدم_فاتورة}','{مدة_الدين}','{الحساب}']);ins('بيانات_الدفع',null);
  return fillTpl('rem',m,tp)}
const remText=c=>{const li=lateInfo(c),fd=remFirmD(),ld=remLongD(),d=li?li.d:0;return remMake({'العميل':c.name,'المحل':shopN(),'الحساب':f(balOf(c)),'مدة_الدين':lateTxt(c),'أقدم_فاتورة':oldTxt(c),'رصيد_سابق':balTxt(c),'بيانات_الدفع':remPayTxt()},ld>0&&d>=ld?'long':fd>0&&d>=fd?'firm':'soft')};
/* ===== متابعة الطلبيات: st = p (تحت التجهيز) / r (جاهز) / d أو مفيش (اتسلّم). الفواتير القديمة كلها محسوبة اتسلّمت ===== */
const ordOn=()=>pget('ordOn',true),OST={p:'⏳ تحت التجهيز',r:'✅ جاهز',d:'📦 اتسلّم'};
const ordSt=r=>r&&r.type==='inv'&&(r.st==='p'||r.st==='r')?r.st:'d';
const ordTag=r=>{const s=ordSt(r);return ordOn()&&s!=='d'?` <span class="tag ost ${s}">${OST[s]}</span>`:''};
function rdyText(r){const c=getC(r.cid),b=c?balOf(c):0;return fillTpl('rdy',{'العميل':r.cname,'المحل':shopN(),'الكود':r.code?String(r.code):String(r.no||''),'الحساب':b>0?'حسابك: '+f(b)+' جنيه':''})}
function ordUI(){const r=curRec,on=!!(r&&r.type==='inv'&&ordOn()&&S.invoices.includes(r));$('resOrd').classList.toggle('hide',!on);if(!on)return;
  const s=ordSt(r),wa=$('resOrdWa'),n=waNum(r.phone||((getC(r.cid)||{}).phone));
  $('resOrdSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.os===s));
  wa.classList.toggle('hide',!(s==='r'&&n));if(n)wa.href='https://wa.me/'+n+'?text='+encodeURIComponent(rdyText(r))}
$('resOrdSeg').onclick=e=>{const b=e.target.closest('[data-os]'),r=curRec;if(!b||!r||ordSt(r)===b.dataset.os)return;
  r.st=b.dataset.os;r.stAt=Date.now();put('invoices',r);ordUI();drawDash();
  toast(r.st==='r'?'الطلب جاهز ✓'+(waNum(r.phone||((getC(r.cid)||{}).phone))?' — بلّغ العميل من الزرار':''):r.st==='d'?'الطلب اتسلّم ✓':'الطلب رجع تحت التجهيز')};
/* اختيار حالة الفاتورة الجديدة: البرنامج بيفتكر آخر اختيار */
const ordNew=()=>lsv('ordNew','d')==='p'?'p':'d';
function ordPickUI(){const on=ordOn()&&!editId&&!!(TOT.rows&&TOT.rows.some(x=>!x.rt));$('ordPick').classList.toggle('hide',!on);
  if(on)$('ordPick').querySelectorAll('[data-os]').forEach(b=>b.classList.toggle('on',b.dataset.os===ordNew()))}
$('ordPick').onclick=e=>{const b=e.target.closest('[data-os]');if(!b)return;try{localStorage.setItem('ordNew',b.dataset.os)}catch(_){}ordPickUI()};
const curText=()=>$('resTxtBox').classList.contains('hide')?'':$('resTxt').value;
const syncTx=()=>{$('restx').href='https://wa.me/'+waNum(curPhone)+'?text='+encodeURIComponent($('resTxt').value)};
function goTpl(){['res','rem'].forEach(i=>$(i).classList.add('hide'));$('hdrSet').click();stGo('msg')}
$('resTxt').oninput=syncTx;$('resTpl').onclick=goTpl;
$('reswa').onclick=async e=>{e.preventDefault();const n=waNum(curPhone);if(!curBlob||!n){$('resm').textContent=baseMsg+' · اكتب رقم واتساب العميل في بياناته الأول';return}
  const url='https://wa.me/'+n+(curText()?'?text='+encodeURIComponent(curText()):'');$('reswa').href=url;let ok=false;
  /* الصورة بتتنسخ الأول وبعدين الشات يتفتح، عشان النسخ ميتقطعش لما البرنامج يروح للخلفية */
  try{await Promise.race([navigator.clipboard.write([new ClipboardItem({'image/png':curBlob})]),new Promise((_,j)=>setTimeout(()=>j(new Error('t')),2000))]);ok=true}catch(err){}
  $('resm').textContent=baseMsg+(ok?' · ✅ الصورة اتنسخت: الصقها في شات العميل':' · مقدرتش أنسخ الصورة، ابعتها من «📤 مشاركة» أو «🖼️ حفظ الصورة»');
  if(!window.open(url,'_blank'))location.href=url};
const sfn=t=>String(t).replace(/[\\\/:*?"<>|]+/g,'-');
const fname=r=>'فاتورة-'+sfn(r.cname)+(r.code?'-'+r.code:(r.no?'-'+r.no:''))+'.png';
const showRec=async(r,auto,msg)=>{await busyOn('جاري فتح الفاتورة…');try{await showImg(sheet(invSheet(r)),fname(r),msg||'',auto,r.phone,r)}finally{busyOff()}};

/* ---------- العملاء ---------- */
let cuEd=false,cuPm=false,cuMode='all',cuSort='name',cuIdle=60,selC=null,per='all',pF='',pT='',editOpen=false,pMo=0,cdq='';
const PL={all:'الكل',mo:'شهر',c:'فترة'};
const moStart=t=>{const d=new Date(t||Date.now());return new Date(d.getFullYear(),d.getMonth(),1).getTime()};
const moLab=()=>{const d=new Date(pMo||moStart());return MN[d.getMonth()]+' '+d.getFullYear()};
const moVal=()=>{const d=new Date(pMo||moStart());return d.getFullYear()+'-'+two(d.getMonth()+1)};
function perRange(){const n=Date.now(),D=864e5;let a=0,b=Infinity;
  if(per==='mo'){const d=new Date(pMo||moStart());a=new Date(d.getFullYear(),d.getMonth(),1).getTime();b=new Date(d.getFullYear(),d.getMonth()+1,1).getTime()-1}
  else if(per==='w')a=dAgo(6);else if(per==='m')a=dAgo(29);
  else if(per==='c'){a=pF?new Date(pF+'T00:00:00').getTime():0;b=pT?new Date(pT+'T23:59:59').getTime():Infinity}
  return[a,b]}
const inPer=r=>{const[a,b]=perRange();return r.ts>=a&&r.ts<=b};
const bsg=x=>x>0?'عليه '+f(x):x<0?'له '+f(-x):'0';
function sumOf(c){const[a,b]=perRange();let open=c.open||0,inv=0,pay=0,n=0;
  ledger(c).forEach(r=>{if(r.ts<a)open=rd2(open+(r.type==='pay'?-r.amount:val(r)-r.paid));else if(r.ts<=b){if(r.type==='pay')pay+=r.amount;else{inv+=val(r);pay+=r.paid;n++}}});
  return{open,inv:rd2(inv),pay:rd2(pay),n,end:rd2(open+inv-pay)}}
function rowsOf(c){let run=c.open||0;const asc=ledger(c).sort((a,b)=>a.ts-b.ts).map(r=>{run=rd2(run+(r.type==='pay'?-r.amount:val(r)-r.paid));return{r,run}});
  return asc.filter(x=>inPer(x.r)).reverse()}
function lastPay(c){let t=0;ledger(c).forEach(r=>{if(((r.type==='pay'&&r.amount>0)||(r.type==='inv'&&r.paid>0))&&r.ts>t)t=r.ts});return t}
function aging(c){if(balOf(c)<=0)return null;const t=lastPay(c),now=Date.now(),first=Math.min(now,...ledger(c).map(r=>r.ts)),ref=Math.floor((now-(t||first))/864e5);
  return{d:t?ref:null,color:ref>60?'#dc2626':ref>30?'#f97316':'#f59e0b'}}
function lastTx(c){const l=ledger(c);if(!l.length)return'مفيش معاملات';const t=Math.max(...l.map(r=>r.ts)),d=new Date(t);return 'آخر معاملة '+(d.getFullYear()===new Date().getFullYear()?d.getDate()+'/'+(d.getMonth()+1):dshort(t))}
function cSub(c,np){const l=ledger(c),t=Math.max(0,...l.map(r=>r.ts)),a=aging(c);
  return [c.lim>0&&balOf(c)>c.lim?'⚠ عدّى الحد':'',np?'':c.phone,l.length?plN(l.length,'معاملة')+' · آخر '+(new Date(t).getFullYear()===new Date().getFullYear()?new Date(t).getDate()+'/'+(new Date(t).getMonth()+1):dshort(t)):'مفيش معاملات',a?(a.d===null?'مفيش دفعات':(a.d===0?'آخر دفعة النهارده':a.d===1?'آخر دفعة امبارح':'آخر دفعة من '+a.d+' يوم')):''].slice(0,np===1?3:4).filter(Boolean).join(' · ')}
const agStyle=c=>{const a=aging(c);return a?` style="border-right:4px solid ${a.color}"`:''};
const av=n=>{const s=String(n||"?").trim();let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return`<span class="av" style="--h:${h}">${esc([...s][0]||"?")}</span>`};
/* بحث العميل برقم التليفون: أرقام بس (عربي أو إنجليزي) ولازم 3 أرقام على الأقل */
const phoneHit=(c,q)=>{const d=String(q||'').replace(/[٠-٩]/g,x=>'٠١٢٣٤٥٦٧٨٩'.indexOf(x)).replace(/\D/g,'');return d.length>=3&&String(c.phone||'').replace(/[٠-٩]/g,x=>'٠١٢٣٤٥٦٧٨٩'.indexOf(x)).replace(/\D/g,'').includes(d)};
/* عملاء بنفس الاسم (ممكن يكونوا اتكتبوا غلط مرتين من جهازين مختلفين) */
/* أرقام العميل: ممكن أكتر من رقم في نفس الخانة بينهم / أو فاصلة. الأول هو اللي بيتبعتله الواتساب والتذكير */
const PH_SPLIT=/[\/،,;|]+/;
const phoneParts=p=>String(p||'').split(PH_SPLIT).map(x=>x.trim()).filter(Boolean);
const phoneKey=p=>{const d=String(p||'').replace(/[٠-٩]/g,x=>'٠١٢٣٤٥٦٧٨٩'.indexOf(x)).replace(/\D/g,'');return d.length>=9?d.slice(-10):''};
const phoneKeys=p=>phoneParts(p).map(phoneKey).filter(Boolean);
/* توحيد شكل الرقم: +20 / 0020 / 20 / من غير صفر بتتحول لـ 01xxxxxxxxx. الجزء اللي فيه حروف بيفضل زي ما هو */
const normPhone=p=>{p=String(p||'').trim();if(!p)return'';if(!/^[\d٠-٩۰-۹\s+\-().]+$/.test(p))return p;let s=toEn(p).replace(/[^\d+]/g,'');if(s.startsWith('+20'))s='0'+s.slice(3);else if(s.startsWith('0020'))s='0'+s.slice(4);else if(/^20\d{10}$/.test(s))s='0'+s.slice(2);else if(/^1\d{9}$/.test(s))s='0'+s;return s};
const normPhones=p=>phoneParts(p).map(normPhone).join(' / ');
/* تشابه الأسماء: حروف مكررة (ساااامي) أو حرف غلط واحد */
const squash=s=>nkey(s).replace(/(.)\1+/g,'$1').replace(/\s/g,'');
const lev1=(a,b)=>{if(a===b)return true;if(Math.abs(a.length-b.length)>1)return false;let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;const x=a.slice(i),y=b.slice(i);return x.slice(1)===y.slice(1)||x.slice(1)===y||x===y.slice(1)};
const similarCust=v=>{const k=squash(v);if(k.length<4)return null;return S.customers.find(c=>{const q=squash(c.name);return q&&nkey(c.name)!==nkey(v)&&(q===k||(q.length>=5&&lev1(q,k)))})||null};
function dupGroups(){const m=new Map(),pm=new Map(),out=[],seen=new Set();
  S.customers.filter(c=>!c.arch).forEach(c=>{const k=nkey(c.name);if(k)(m.get(k)||m.set(k,[]).get(k)).push(c);new Set(phoneKeys(c.phone)).forEach(p=>(pm.get(p)||pm.set(p,[]).get(p)).push(c))});
  const add=(g,lab)=>{if(g.length<2)return;const id=g.map(c=>c.id).sort().join('|');if(seen.has(id))return;seen.add(id);g.lab=lab;out.push(g)};
  m.forEach(g=>add(g,g[0].name));pm.forEach((g,p)=>add(g,'📞 '+g[0].phone));return out}
/* دمج عميل مكرر في التاني: فواتيره كلها بتتنقل، وبياناته الناقصة (تليفون/ملاحظة/عنوان) بتتضاف للباقي، والرصيد الافتتاحي بيتجمع */
function mergeCust(keepId,loseId){if(keepId===loseId)return;const k=getC(keepId),l=getC(loseId);if(!k||!l)return;
  S.invoices.forEach(r=>{if(r.cid===loseId){r.cid=keepId;r.cname=k.name;put('invoices',r)}});
  k.open=rd2((k.open||0)+(l.open||0));if(!k.phone&&l.phone)k.phone=l.phone;if(!k.addr&&l.addr)k.addr=l.addr;if(!k.note&&l.note)k.note=l.note;if(!k.due&&l.due)k.due=l.due;if(l.pfr)k.pfr={...l.pfr,...(k.pfr||{})};
  put('customers',k);del('customers',loseId);reflow(keepId)}
$('cuDup').addEventListener('click',e=>{const b=e.target.closest('[data-mg]');if(!b)return;const keepId=b.dataset.mg,g=dupGroups().find(gr=>gr.some(c=>c.id===keepId));if(!g)return;if(!ok2(b))return;g.forEach(c=>{if(c.id!==keepId)mergeCust(keepId,c.id)});drawCusts();drawDash()});
function drawCusts(){
  if(selC&&getC(selC)){$('cuMain').classList.add('hide');$('cuDet').classList.remove('hide');drawDet();return}
  selC=null;$('cuDet').classList.add('hide');$('cuMain').classList.remove('hide');
  const lastTs=c=>Math.max(0,...ledger(c).map(r=>r.ts)),idleCut=Date.now()-cuIdle*864e5;
  $('cuIdleBox').classList.toggle('hide',cuMode!=='idle');
  const q=$('cq').value.trim();let l=S.customers.filter(c=>(qm(c.name,q)||phoneHit(c,q))&&(cuMode==='arch'?!!c.arch:!c.arch)&&(cuMode==='debt'?balOf(c)>0:cuMode==='credit'?balOf(c)<0:cuMode==='idle'?(t=>t>0&&t<idleCut)(lastTs(c)):true));
  {const byName=(a,b)=>a.name.localeCompare(b.name,'ar');
   l.sort(cuSort==='bal'?(a,b)=>(cuMode==='credit'?balOf(a)-balOf(b):balOf(b)-balOf(a))||byName(a,b):cuSort==='last'?(a,b)=>(cuMode==='idle'?lastTs(a)-lastTs(b):lastTs(b)-lastTs(a))||byName(a,b):byName);$('cuTot').innerHTML='<span>👥 <b>'+plN(l.length,'عميل')+'</b></span><span>📒 مديونيات <b class="num" style="color:var(--danger)">'+f(l.reduce((s,c)=>s+Math.max(0,balOf(c)),0))+'</b></span>'+(()=>{const na=S.customers.filter(c=>c.arch).length;return na||cuMode==='arch'?'<button type="button" class="lnk" data-m="'+(cuMode==='arch'?'all':'arch')+'">'+(cuMode==='arch'?'→ كل العملاء':'🗄 '+na+' مؤرشف')+'</button>':''})()}
  {const dg=dupGroups();$('cuDup').classList.toggle('hide',!dg.length);if(dg.length)$('cuDup').innerHTML='<div class="card" style="border-color:var(--danger)"><b>⚠️ في عملاء بنفس الاسم أو الرقم</b><div class="mute" style="margin:2px 0 6px">يمكن يكونوا اتكتبوا غلط مرتين. اضغط «خليه الأساسي» على اللي عايز تحتفظ بيه، والباقي هيندمج فيه.</div>'+dg.map(g=>'<div style="margin:8px 0 4px;padding-top:8px;border-top:1px solid var(--line)"><b>'+esc(g.lab||g[0].name)+'</b></div>'+g.map(c=>'<div class="ro" style="color:var(--ink)"><span>'+esc(cSub(c,2))+' · <b class="num">'+bal(c)+'</b></span><button type="button" class="alt" data-mg="'+esc(c.id)+'">خليه الأساسي</button></div>').join('')).join('')+'</div>'}
  $('cuList').innerHTML=l.map(c=>`<div class="rec cr2" data-open="${c.id}"${agStyle(c)}>${av(c.name)}<div style="flex:1;min-width:0"><div class="cn">${esc(c.name)}</div><div class="mute">${esc(cSub(c,2))}</div></div><span class="cb ${bcls(c)} num">${bal(c)}</span></div>`).join('')||`<p class="mute">${S.customers.length?'مفيش عملاء بالبحث أو الفلتر ده. اضغط «📋 الكل» أو امسح البحث.':'لسه مفيش عملاء. اضغط «➕ عميل» أو احفظ فاتورة باسم جديد.'}</p>`}

/* كشف العميل: بحث (مبلغ / صنف / كود / مرتجع) + سطر الأصناف تحت كل فاتورة */
function itemsTxt(r){return r.type==='pay'?(r.pfWhy||''):(r.rows||[]).map(x=>(x.rt?'↩ ':'')+String(x.n||'').trim()+(x.c?'×'+f(x.c):'')).filter(Boolean).join('، ')}
function rowMatch(x,q){q=q.trim();if(!q)return true;const r=x.r,vals=[val(r),pd(r),x.run].filter(v=>v!=null&&!isNaN(+v)).map(v=>Math.abs(+v));
  if(q==='مرتجع'||q==='↩')return hasRet(r);
  const A=s=>String(s).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,،\s]/g,'');
  const z=A(q);let m;
  /* مبلغ تقريبي: 700 (±5%) · 600-800 (من/إلى) · 7000+ (من 7000 لحد +15%) */
  if(m=z.match(/^(\d+(?:\.\d+)?)[-~](\d+(?:\.\d+)?)$/)){const a=Math.min(+m[1],+m[2]),b=Math.max(+m[1],+m[2]);return vals.some(v=>v>=a&&v<=b)}
  if(m=z.match(/^(\d+(?:\.\d+)?)\+$/)){const a=+m[1];return vals.some(v=>v>=a&&v<=a*1.15)}
  if(m=z.match(/^\d+(?:\.\d+)?$/)){const n=+z;return vals.some(v=>v>0&&(Math.abs(v-n)<=n*.05||String(v).includes(z)))||[r.code,r.no].some(v=>v!=null&&String(v)===z)}
  return qm(itemsTxt(r),q)||qm(r.cname||'',q)||qm(r.note||'',q)}
function tblHtml(c){const all=rowsOf(c);if(!all.length)return'<p class="mute">مفيش فواتير في الفترة دي.</p>';
  const l=all.filter(x=>rowMatch(x,cdq));if(!l.length)return'<p class="mute">مفيش نتائج للبحث ده في الفترة دي.</p>';
  return`<table class="st"><thead><tr><th>التاريخ</th><th>الكود</th><th>القيمة</th><th>المدفوع</th><th>الحساب</th></tr></thead><tbody>${l.map(({r,run})=>{const it=itemsTxt(r);return`<tr data-rec="${r.id}"><td class="num">${dshort(r.ts)}</td><td>${stTag(r)}</td><td class="num">${r.type==='pay'?'-':f(val(r))}</td><td class="num">${f(pd(r))}</td><td class="num">${f(run)}</td></tr>`+(it?`<tr data-rec="${r.id}"><td colspan="5" class="mute" style="font-size:11px;padding:0 2px 5px;max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:start">${esc(it)}</td></tr>`:'')}).join('')}</tbody></table>
   <div class="mute" style="margin-top:4px">اضغط أي صف لعرض الفاتورة.${cdq.trim()?' (البحث بيصفّي الجدول بس، والملخص فوق للفترة كلها)':''}</div><div class="btns"><button class="main" data-stimg="1">🖼️ حفظ الملخص كصورة</button></div>`}
function drawDet(){const c=getC(selC),l=rowsOf(c);
  $('cuDet').innerHTML=`<button class="lnk" data-back="1">→ رجوع</button>
  <div class="card"><div class="ro" style="margin-bottom:6px;gap:6px"><b style="font-size:17px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.name)}</b><span class="cb ${bcls(c)} num">${bal(c)}</span><button class="ab" data-tg="ed" aria-label="تعديل بيانات العميل">✏️ تعديل</button></div>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">${phoneParts(c.phone).slice(0,3).map((p,i)=>{const n=i?' '+(i+1):'';return(telNum(p)?`<a class="ab" href="tel:${telNum(p)}">📞${i?n:' اتصال'}</a>`:'')+(waNum(p).length>=9?`<a class="ab" target="_blank" rel="noopener" href="https://wa.me/${waNum(p)}"><i class="wai"></i>${i?n:' واتساب'}</a>`:'')}).join('')}<button class="ab" data-inv="1">🧾 فاتورة</button>${!ledger(c).length&&waNum(c.phone).length>=9?`<a class="ab" target="_blank" rel="noopener" href="https://wa.me/${waNum(c.phone)}?text=${encodeURIComponent('أهلاً '+c.name+'، يسعدنا التعامل معاك 🌹'+(shopN()?' — '+shopN():''))}">👋 ترحيب</a>`:''}${balOf(c)>0?`<button class="ab b-out" data-rem="1"><i class="wai"></i> تذكير</button>`:''}</div>
   ${(()=>{const l=ledger(c).filter(r=>r.type!=='pay');if(!l.length)return'';const tot=rd2(l.reduce((s,r)=>s+val(r),0)),first=Math.min(...ledger(c).map(r=>r.ts));return`<div class="mute" style="margin:0 0 6px;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="من ${dshort(first)}">🧾 ${plN(l.length,'فاتورة')} · مشتريات <b class="num">${f(tot)}</b> · متوسط <b class="num">${f(Math.round(tot/l.length))}</b></div>`})()}
   ${c.lim>0&&balOf(c)>c.lim?`<div style="color:var(--danger);font-size:13px;margin:0 0 6px">⚠ عدّى حد الدين (${f(c.lim)})</div>`:''}
   ${cuPm?`${pwHtml('cu',c)}<div class="btns"><button class="main b-green" data-pay="1">✅ تسجيل الدفعة</button><button class="alt" data-tg="pm" style="flex:none">✖️ إلغاء</button></div>`:`<button class="main b-green" data-tg="pm" style="width:100%">💵 تسجيل دفعة</button>`}
   <div class="info" id="cdMsg" style="color:var(--danger)"></div>
   <div id="cdEdit" class="${cuEd?'':'hide'}" style="border-top:1px dashed var(--line);margin-top:6px;padding-top:6px">
    <div class="ro" style="margin-bottom:6px"><input data-f="name" value="${esc(c.name)}" aria-label="اسم العميل" style="font-weight:700;flex:1;min-width:0"><select data-f="cat" class="catsel" aria-label="الفئة">${catOpts(custCat(c))}</select></div>
    <div class="g2" style="grid-template-columns:1.8fr 1fr"><div><label>واتساب</label><input data-f="phone" type="tel" inputmode="tel" value="${esc(c.phone||'')}" style="direction:ltr;text-align:center;letter-spacing:.3px"></div><div><label>رصيد افتتاحي</label>${editOpen?`<input data-f="open" type="text" inputmode="decimal" value="${c.open||''}" placeholder="0">`:`<div class="ro" style="color:var(--ink);height:var(--ih);border:1px dashed var(--line);border-radius:7px;padding:0 8px"><b class="num">${f(c.open||0)}</b><button class="lnk" data-eo="1">تعديل</button></div>`}</div></div>
    ${phoneChipsHtml(c.phone,'data-ppe')?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 6px">${phoneChipsHtml(c.phone,'data-ppe')}</div>`:''}
    <div class="g2" style="grid-template-columns:1.3fr 1fr .8fr"><div><label>العنوان</label><input data-f="addr" value="${esc(c.addr||'')}"></div><div><label>ملاحظات</label><input data-f="note" value="${esc(c.note||'')}"></div><div><label>حد الدين</label><input data-f="lim" type="text" inputmode="decimal" value="${c.lim||''}" placeholder="0"></div></div>
    <div class="g2" style="grid-template-columns:1.8fr 1fr"><div><label>📍 مواقع / مشاريع (بفاصلة)</label><input data-f="sites" value="${esc((c.sites||[]).join('، '))}"></div><div><label>📅 ميعاد شهري (يوم)</label><input data-f="dd" type="text" inputmode="numeric" value="${c.dd||''}" placeholder="1-31"></div></div>
    <button class="main" data-esave="1" style="width:100%;margin-top:6px">💾 حفظ التعديل</button>
   </div></div>
  <div class="card"><div class="seg s">${Object.keys(PL).map(k=>`<button data-per="${k}" class="${per===k?'on':''}">${PL[k]}</button>`).join('')}</div>
   ${per==='mo'?`<div class="ro" style="margin:4px 0"><button class="ab" data-mo="-1" aria-label="الشهر السابق">→</button><button class="lnk" id="cdMoBtn" style="font-weight:700;text-decoration:none">📅 ${moLab()}</button><button class="ab" data-mo="1" aria-label="الشهر التالي">←</button></div><input type="month" id="cdMo" tabindex="-1" value="${moVal()}" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px">`:''}
   ${per==='c'?`<div class="g2"><div><label>من</label><input type="date" id="pf" value="${pF}"></div><div><label>إلى</label><input type="date" id="pt" value="${pT}"></div></div>`:''}
   ${(()=>{const q=sumOf(c);return`<div class="sumg"><div><label>الحساب أول الفترة</label><b class="num">${bsg(q.open)}</b></div><div><label>فواتير الفترة (${q.n})</label><b class="num">${f(q.inv)}</b></div><div><label>المدفوع في الفترة</label><b class="num">${f(q.pay)}</b></div><div><label>الحساب آخر الفترة</label><b class="num">${bsg(q.end)}</b></div></div>`})()}
   <input id="cdq" placeholder="ابحث: مبلغ تقريبي (700 · 600-800 · 7000+) أو صنف أو مرتجع" value="${esc(cdq)}" style="margin:6px 0 2px"><div id="cdTbl">${tblHtml(c)}</div></div>
  <div class="ro" style="justify-content:flex-start;gap:14px"><button class="lnk" data-arch="1">${c.arch?'↩ إلغاء الأرشفة':'📦 أرشفة'}</button><button class="lnk" data-delc="1" style="color:var(--danger)">🗑️ حذف العميل</button></div><div class="info" id="dcMsg" style="color:var(--danger)"></div>`;pwMount('cu')}
function stmtImg(){const c=getC(selC),l=rowsOf(c),ss=sumOf(c);const lab=per==='c'?(pF||'...')+' إلى '+(pT||'...'):per==='mo'?moLab():PL[per];
  const cv=sheet({wm:1,name:c.name,sub:'كشف حساب',date:dshort(Date.now()),meta:['الفترة: '+(per==='w'||per==='m'?'آخر ':'')+lab].concat(l.some(({r})=>hasRet(r))?['↩ = الفاتورة فيها مرتجع']:[]),
    tables:[{th:['التاريخ','الكود','القيمة','المدفوع','الحساب'],w:[.2,.3,.17,.17,.16],rows:l.map(({r,run})=>[dshort(r.ts),stTag(r),r.type==='pay'?'-':f(val(r)),f(pd(r)),f(run)])}],
    sum:[['الحساب أول الفترة',bsg(ss.open)],['فواتير الفترة ('+ss.n+')',f(ss.inv)],['المدفوع في الفترة',f(ss.pay)],['الحساب آخر الفترة',bsg(ss.end),1]]});
  showImg(cv,'كشف-'+sfn(c.name)+'.png','كشف حساب '+c.name,true,c.phone,null)}
$('t-cu').addEventListener('click',e=>{const t=e.target,d=t.dataset;
  if(d.m){if(d.m==='add'){$('cuAdd').classList.toggle('hide');return}cuMode=d.m;cuSort=d.m==='all'||d.m==='arch'?'name':d.m==='idle'?'last':'bal';$('cuSort').value=cuSort;document.querySelectorAll('#cuMode button').forEach(b=>b.classList.toggle('on',b.dataset.m===d.m));drawCusts();return}
  const op=t.closest('[data-open]');if(op){selC=op.dataset.open;delete PW.cu;per='all';cdq='';pMo=0;editOpen=false;cuEd=false;cuPm=false;drawCusts();window.scrollTo(0,0);return}
  if(d.tg){if(d.tg==='ed'){cuEd=!cuEd;$('cdEdit').classList.toggle('hide',!cuEd)}else{cuPm=!cuPm;delete PW.cu;drawDet();const i=document.querySelector('#cuDet [data-pw="cu"] .spa');if(i)i.focus()}return}
  if(d.eo){editOpen=true;cuEd=true;drawDet();return}
  {const pe=t.closest('[data-ppe]');if(pe){const c=getC(selC);if(c){c.phone=phoneMakePrimary(c.phone,+pe.dataset.ppe);put('customers',c);drawDet()}return}}
  if(d.esave){const c=getC(selC);if(!c)return;if(!c.name){$('cdMsg').textContent='الاسم لا يمكن أن يكون فاضي';return}c.phone=normPhones(c.phone);flushTouch();put('customers',c);syncNames();cuEd=false;editOpen=false;drawDet();toast('اتحفظ ✓');return}
  if(d.inv){const c=getC(selC);if(!c)return;document.querySelector('#bnav [data-t="new"]').click();$('cust').value=c.name;custInput();window.scrollTo(0,0);return}
  if(d.back){selC=null;drawCusts();return}
  if(d.per){per=d.per;if(per==='mo'&&!pMo)pMo=moStart();drawDet();return}
  if(d.mo){const x=new Date(pMo||moStart());pMo=new Date(x.getFullYear(),x.getMonth()+(+d.mo),1).getTime();drawDet();return}
  if(t.id==='cdMoBtn'){const i=$('cdMo');try{i.showPicker()}catch(_){i.click()}return}
  const rc=t.closest('[data-rec]');if(rc){const r=S.invoices.find(x=>x.id===rc.dataset.rec);if(r)showRec(r,false,'');return}
  if(d.rem){openRem(getC(selC));return}
  if(d.stimg){stmtImg();return}
  if(d.arch){const c=getC(selC);if(!c)return;c.arch=c.arch?false:true;if(!c.arch)delete c.arch;put('customers',c);selC=null;drawCusts();toast(c.arch?'اتأرشف: مش هيظهر في القايمة':'رجع للقايمة');return}
  if(d.delc){const c=getC(selC);if(ledger(c).length){$('dcMsg').textContent='العميل عنده فواتير. امسحها الأول أو سيبه.';return}
    if(!ok2(t))return;del('customers',c.id);selC=null;drawCusts();return}
  if(d.pay){const c=getC(selC),r=c&&pwRecord('cu',c);if(!r){$('cdMsg').textContent='اكتب مبلغ الدفعة';return}
    S.invoices.push(r);put('invoices',r);lastSaved={id:r.id,at:Date.now(),dueBak:payDone(c,r)};delete PW.cu;cuPm=false;drawDet();showRec(r,false,'تم تسجيل الدفعة ✓')}});
$('t-cu').addEventListener('change',e=>{if(e.target.id==='cuSort'){cuSort=e.target.value;drawCusts()}else if(e.target.dataset.f==='phone'){const c=getC(selC);if(c){e.target.value=normPhones(e.target.value);c.phone=e.target.value;DV++;touch('customers',c)}}else if(e.target.id==='cuIdle'){cuIdle=+e.target.value||60;drawCusts()}else if(e.target.id==='cdMo'){const v=e.target.value;if(v){const[y,m]=v.split('-').map(Number);pMo=new Date(y,m-1,1).getTime();drawDet()}}else if(e.target.id==='pf'){pF=e.target.value;drawDet()}else if(e.target.id==='pt'){pT=e.target.value;drawDet()}});
$('cuDet').addEventListener('input',e=>{if(e.target.id!=='cdq')return;cdq=e.target.value;const c=getC(selC);if(c)$('cdTbl').innerHTML=tblHtml(c)});
$('cuDet').addEventListener('input',e=>{const t=e.target,c=getC(selC);if(!c||!t.dataset.f)return;const k=t.dataset.f,v=k==='open'||k==='lim'?nv(t.value):t.value.trim(),mm=$('cdMsg');
  if(k==='name'){if(!v||S.customers.some(x=>x.id!==c.id&&nkey(x.name)===nkey(v))){if(mm)mm.textContent=!v?'الاسم لا يمكن أن يكون فاضي':'الاسم ده موجود قبل كده';return}if(mm)mm.textContent=''}
  if(k==='sites'){c.sites=t.value.split(/[,،]/).map(x=>x.trim()).filter(Boolean);if(!c.sites.length)delete c.sites;DV++;touch('customers',c);return}
  if(k==='dd'){const n=Math.round(nv(t.value));if(n>=1&&n<=31)c.dd=n;else delete c.dd;DV++;touch('customers',c);return}
  DV++;c[k]=v;touch('customers',c)});
$('cuDet').addEventListener('change',e=>{if(e.target.dataset.f==='open'){flushTouch();reflow(selC);editOpen=false;drawDet()}else if(e.target.dataset.f==='name'){syncNames();drawDet()}});
$('cq').oninput=drawCusts;
/* رقم أساسي: لو العميل عنده أكتر من رقم، الأول هو اللي بيتبعتله الواتساب والتذكير. الضغط على رقم بيخليه الأساسي */
const phoneChipsHtml=(p,a)=>{const l=phoneParts(p);return l.length<2?'':l.map((x,i)=>'<button type="button" class="ab'+(i?'':' on')+'" '+a+'="'+i+'">'+(i?'☆ ':'⭐ ')+esc(x)+'</button>').join('')};
const phoneMakePrimary=(p,i)=>{const l=phoneParts(p);if(i<=0||i>=l.length)return p;l.unshift(l.splice(i,1)[0]);return l.join(' / ')};
function ncChips(){const h=phoneChipsHtml($('nc_phone').value,'data-pp'),b=$('nc_pchips');b.innerHTML=h;b.classList.toggle('hide',!h)}
$('nc_pchips').onclick=e=>{const b=e.target.closest('[data-pp]');if(!b)return;$('nc_phone').value=phoneMakePrimary($('nc_phone').value,+b.dataset.pp);ncChips();ncWa()};
let ncCr=false;
function ncWa(){const a=$('nc_wa'),n=waNum($('nc_phone').value);a.classList.toggle('hide',n.length<11);if(n.length>=11)a.href='https://wa.me/'+n}
function addCust(more){const name=$('nc_name').value.trim().replace(/\s+/g,' '),m=$('cuMsg');m.textContent='';
  if(!name){m.textContent='اكتب اسم العميل';return}if(findCust(name)){m.textContent='الاسم ده موجود قبل كده: '+findCust(name).name;return}
  const bv=nv($('nc_bal').value);
  const c={id:uid(),name,phone:normPhones($('nc_phone').value),addr:$('nc_addr').value.trim(),note:$('nc_note').value.trim(),open:ncCr?-Math.abs(bv):bv,cat:$('nc_cat').value};
  {const lim=nv($('nc_lim').value);if(lim>0)c.lim=lim}
  S.customers.push(c);put('customers',c);['nc_name','nc_phone','nc_bal','nc_addr','nc_note','nc_lim'].forEach(i=>$(i).value='');ncCr=false;$('nc_dir').textContent='عليه';ncWa();ncChips();
  if(more){$('nc_name').focus();toast('اتحفظ: '+name)}else $('cuAdd').classList.add('hide');drawCusts()}
$('addCu').onclick=()=>addCust(false);$('addCu2').onclick=()=>addCust(true);
$('nc_dir').onclick=()=>{ncCr=!ncCr;$('nc_dir').textContent=ncCr?'له':'عليه'};
$('nc_phone').addEventListener('input',()=>{ncWa();ncChips()});
$('nc_phone').addEventListener('change',()=>{$('nc_phone').value=normPhones($('nc_phone').value);ncWa();ncChips();ncWarn()});
/* لصق من واتساب أو جهات الاتصال: «اسم + رقم» في خانة الاسم بيتفصلوا لوحدهم */
$('nc_name').addEventListener('paste',e=>{const t=(e.clipboardData||window.clipboardData).getData('text')||'',m=toEn(t).match(/\+?\d[\d\s\-().]{7,}\d/);if(!m)return;e.preventDefault();
  const nm=t.replace(/[0-9٠-٩+\s\-().]{8,}/,' ').replace(/[:：\-–—،,\/|]+/g,' ').replace(/\s+/g,' ').trim();$('nc_name').value=nm;$('nc_phone').value=normPhones(m[0]);ncWa();ncWarn()});
/* استيراد عملاء: كل سطر = الاسم، الرقم، الحساب (موجب عليه وسالب له). من إكسل (نسخ ولصق) أو ملف CSV */
function impPlan(txt){const add=[],seenN=new Set(),seenP=new Set();let skip=0;
  String(txt||'').split(/\r?\n/).forEach(line=>{if(!line.trim())return;const cells=(line.includes('\t')?line.split('\t'):line.split(/[,;،]/)).map(x=>x.trim().replace(/^"|"$/g,'').trim()),name=(cells[0]||'').replace(/\s+/g,' ');
    if(!name||/^(الاسم|اسم العميل|العميل|name)$/i.test(name))return;let phone='',bal=0;
    cells.slice(1).filter(Boolean).forEach(x=>{const t=toEn(x).trim(),dg=t.replace(/\D/g,'');if(!phone&&dg.length>=9&&/^[\d\s+\-().]+$/.test(t))phone=normPhone(x);else if(!bal&&/^-?[\d,.]+$/.test(t))bal=nv(t)});
    const k=nkey(name),pk=phoneKey(phone);if(!k||seenN.has(k)||findCust(name)||(pk&&(seenP.has(pk)||S.customers.some(c=>phoneKeys(c.phone).includes(pk))))){skip++;return}
    seenN.add(k);if(pk)seenP.add(pk);add.push({name,phone,open:bal})});
  return{add,skip}}
function impShow(){const p=impPlan($('cimpTxt').value);$('cimpInfo').textContent=p.add.length||p.skip?'هيتضاف '+plN(p.add.length,'عميل')+(p.skip?' · '+p.skip+' مكرر هيتخطى':''):'';$('cimpGo').disabled=!p.add.length}
$('cimpOpen').onclick=()=>{$('cimpTxt').value='';impShow();$('cimpOv').classList.remove('hide')};
$('cimpX').onclick=()=>$('cimpOv').classList.add('hide');
$('cimpOv').addEventListener('click',e=>{if(e.target===$('cimpOv'))$('cimpOv').classList.add('hide')});
$('cimpTxt').addEventListener('input',impShow);
$('cimpFile').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;let t='';const b=await f.arrayBuffer();try{t=new TextDecoder('utf-8',{fatal:true}).decode(b)}catch(_){t=new TextDecoder('windows-1256').decode(b)}$('cimpTxt').value=t.replace(/^﻿/,'');e.target.value='';impShow()});
$('cimpGo').onclick=()=>{const p=impPlan($('cimpTxt').value);if(!p.add.length)return;p.add.forEach(x=>{const c={id:uid(),name:x.name,phone:x.phone,addr:'',note:'',open:x.open,cat:'d'};S.customers.push(c);put('customers',c)});$('cimpOv').classList.add('hide');$('cuAdd').classList.add('hide');drawCusts();drawDash();toast('اتضاف '+plN(p.add.length,'عميل'))};

/* تذكير بالدين (نص قابل للتعديل قبل الإرسال) */
let remC=null;
const remSync=()=>{$('remGo').href='https://wa.me/'+waNum(remC&&remC.phone)+'?text='+encodeURIComponent($('remTxt').value)};
function openRem(c){remC=c;$('remT').innerHTML='<i class="wai"></i> تذكير '+esc(c.name);$('remTxt').value=remText(c);$('remMsg').textContent=waNum(c.phone)?'':'مفيش رقم واتساب للعميل: هيفتح واتساب وتختار المحادثة بنفسك';remSync();$('rem').classList.remove('hide')}
$('remTxt').oninput=remSync;$('remX').onclick=()=>$('rem').classList.add('hide');$('remTpl').onclick=goTpl;
$('rem').addEventListener('click',e=>{if(e.target===$('rem'))$('rem').classList.add('hide')});
$('remCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('remTxt').value);$('remMsg').textContent='تم النسخ ✓'}catch(e){$('remMsg').textContent='النسخ منفعش'}};
/* تذكير كل المديونين */
const bulkSent=new Set();
function drawBulk(){const l=S.customers.filter(c=>balOf(c)>0).sort((a,b)=>(bulkSent.has(a.id)-bulkSent.has(b.id))||balOf(b)-balOf(a)),wp=l.filter(c=>waNum(c.phone)).length;
  $('bulkInfo').textContent='تم '+l.filter(c=>bulkSent.has(c.id)).length+' من '+wp+' · واتساب بيحتاج ضغطة إرسال لكل عميل';
  $('bulkList').innerHTML=l.map(c=>`<div class="rec" style="${bulkSent.has(c.id)?'opacity:.5':''}"><div class="ro" style="color:var(--ink)"><span><b>${esc(c.name)}</b> <span class="mute num">${bal(c)}</span></span>${waNum(c.phone)?`<a class="ab b-green" style="background:#16a34a;border-color:#16a34a;color:#fff" data-bk="${c.id}" target="_blank" rel="noopener" href="${remLink(c)}">${bulkSent.has(c.id)?'✓ تم':'إرسال'}</a>`:'<span class="mute">مفيش رقم</span>'}</div></div>`).join('')||'<p class="mute">مفيش مديونين.</p>'}
$('bulkRem').onclick=()=>{drawBulk();$('bulk').classList.remove('hide')};
$('bulkX').onclick=()=>$('bulk').classList.add('hide');
$('bulk').addEventListener('click',e=>{if(e.target===$('bulk'))$('bulk').classList.add('hide')});
$('bulkList').addEventListener('click',e=>{const a=e.target.closest('a[data-bk]');if(a){bulkSent.add(a.dataset.bk);setTimeout(drawBulk,400)}});

/* ---------- فئات العملاء والأسعار ---------- */
const CATS=()=>{const l=S.cats.filter(c=>c&&c.id&&c.name&&c.id!=='rdy').slice().sort((a,b)=>(a.t||0)-(b.t||0));if(!l.some(c=>c.id==='d'))l.unshift({id:'d',name:'عام'});else{const k=l.findIndex(c=>c.id==='d');l.unshift(l.splice(k,1)[0])}l.splice(1,0,{id:'rdy',name:'جاهز'});return l};
const catOpts=(sel,noRdy)=>CATS().filter(c=>!(noRdy&&c.id==='rdy')).map(c=>`<option value="${c.id}"${c.id===sel?' selected':''}>${esc(c.name)}</option>`).join('');
const catName=id=>(CATS().find(c=>c.id===id)||{name:'عام'}).name;
const custCat=c=>c&&c.cat&&CATS().some(x=>x.id===c.cat)?c.cat:'d';
const priceOf=(it,cat)=>(it.type!=='mq'||cat==='d')?(it.p||0):((it.pc&&it.pc[cat])||0);
function setPrice(it,cat,v){if(it.type!=='mq'||cat==='d')it.p=v;else{it.pc=Object.assign({},it.pc);if(v)it.pc[cat]=v;else delete it.pc[cat]}}
let ucK='',ucM={};
function usageCat(cat){const k=DV+'|'+cat;if(ucK===k)return ucM;const names=[];
  S.invoices.forEach(r=>{if(r.type==='pay'||custCat(getC(r.cid))!==cat)return;(r.rows||[]).forEach(x=>{if(x.n)names.push(nm(x.n))})});
  ucM={};S.items.forEach(it=>{const n0=nm(it.name);let n=0;for(const x of names)if(x===n0||x.startsWith(n0+' '))n++;ucM[it.id]=n});ucK=k;return ucM}
let itCat='d';
function fillCatSelects(){if(!CATS().some(c=>c.id===itCat))itCat='d';
  $('icat').innerHTML=catOpts(itCat,true);const nc=$('nc_cat'),v=nc.value;nc.innerHTML=catOpts(CATS().some(c=>c.id===v)?v:'d')}
function drawCatMgr(){$('catMgr').innerHTML=CATS().map(c=>`<div class="ro" style="gap:6px;margin-bottom:6px"><input data-cr="${c.id}" value="${esc(c.name)}" ${c.id==='rdy'?'readonly':''} style="flex:${c.id==='rdy'?'none;width:90px':'1'}">${c.id==='rdy'?'<span class="mute" style="flex:1">عملاء بيشوفوا أصناف الجاهز</span>':c.id==='d'?'<span class="mute" style="flex:none;font-size:11px">الافتراضية</span>':`<button class="ab" data-cd="${c.id}" style="flex:none">حذف</button>`}</div>`).join('')+
  `<div class="ro" style="gap:6px;margin:0"><input id="cat_new" placeholder="فئة جديدة (نجار، حداد...)" style="flex:1"><button class="main" id="cat_add" style="flex:none">➕ إضافة</button></div><div class="info">حذف الفئة بيمسح أسعارها، والعملاء اللي عليها بيرجعوا للفئة الافتراضية.</div>`}
$('catMgrBtn').onclick=()=>{const b=$('catMgr');b.classList.toggle('hide');if(!b.classList.contains('hide'))drawCatMgr()};
$('catMgr').addEventListener('input',e=>{const id=e.target.dataset.cr;if(!id)return;const v=e.target.value.trim();if(!v)return;let c=S.cats.find(x=>x.id===id);if(!c){if(id!=='d')return;c={id:'d',t:0,name:v};S.cats.push(c)}c.name=v;DV++;touch('cats',c);fillCatSelects()});
$('catMgr').addEventListener('click',e=>{const t=e.target;
  if(t.id==='cat_add'){const v=$('cat_new').value.trim();if(!v)return;const l=CATS();if(l.some(c=>nm(c.name)===nm(v)))return toast('الفئة دي موجودة قبل كده');const o={id:uid(),name:v,t:Date.now()};S.cats.push(o);put('cats',o);fillCatSelects();drawCatMgr();return}
  const id=t.dataset.cd;if(!id)return;if(!ok2(t))return;
  del('cats',id);
  S.customers.forEach(c=>{if(c.cat===id){c.cat='d';put('customers',c)}});
  S.items.forEach(it=>{if(it.pc&&it.pc[id]!==undefined){it.pc=Object.assign({},it.pc);delete it.pc[id];put('items',it)}});
  if(itCat===id)itCat='d';fillCatSelects();drawCatMgr();drawItems();toast('اتحذفت الفئة: '+catName(id))});
$('icat').onchange=()=>{itCat=$('icat').value;drawItemList()};

/* ---------- الأصناف ---------- */
const COLS={mq:[['w','العرض'],['h','الطول'],['p','السعر'],['cp','شراء']],rd:[['w','العرض'],['h','الطول'],['p','السعر'],['cp','شراء']]};
let curIT='mq';const itCols=()=>{const a=isGen()?COLS[curIT].filter(x=>x[0]==='p'||x[0]==='cp'):COLS[curIT];return wkOn()?a.filter(x=>x[0]!=='cp'):a};
function drawItems(){if(isGen())curIT='rd';fillCatSelects();$('catBar').classList.toggle('hide',curIT!=='mq');if(curIT!=='mq')$('catMgr').classList.add('hide');const cf=itCols(),g='2fr '+cf.map(()=>'1fr').join(' ')+' 34px';
  $('nform').style.gridTemplateColumns=g;
  $('nform').innerHTML='<input id="ni_name" placeholder="اسم الصنف">'+cf.map(x=>`<input data-nf="${x[0]}" type="text" inputmode="decimal" placeholder="${x[1]}">`).join('')+'<button class="main" id="addIt" aria-label="إضافة">➕</button>';
  $('ihead').innerHTML=`<div class="it" style="grid-template-columns:${g}"><span>الاسم</span>${cf.map(x=>`<span style="text-align:center">${x[1]}</span>`).join('')}<span></span></div>`;
  drawItemList()}
function drawItemList(){const cf=itCols(),g='2fr '+cf.map(()=>'1fr').join(' ')+' 34px';
  $('items').innerHTML=itemsList().map(it=>`<div class="it" style="grid-template-columns:${g}"><input data-k="${it.id}" data-f="name" value="${esc(it.name)}">${cf.map(x=>`<input data-k="${it.id}" data-f="${x[0]}" type="text" inputmode="decimal" value="${(x[0]==='p'?priceOf(it,itCat):it[x[0]])||''}">`).join('')}<button class="del" data-d="${it.id}" aria-label="حذف">×</button></div>`).join('')||'<p class="mute">'+(S.items.length?'مفيش أصناف بالبحث ده.':'لسه مفيش أصناف. اكتب اسم الصنف وسعره فوق واضغط ➕، أو استوردهم من Excel في الإعدادات ← الحفظ والنسخ.')+'</p>'}
$('seg').onclick=e=>{const t=e.target.dataset.it;if(!t)return;curIT=t;document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on',b===e.target));drawItems()};
$('nform').addEventListener('click',e=>{if(e.target.id!=='addIt')return;const name=$('ni_name').value.trim();if(!name){toast('اكتب اسم الصنف الأول');$('ni_name').focus();return}
  /* v189: نفس الاسم بنفس النوع ميتكررش */
  if(S.items.some(x=>x.type===curIT&&nkey(x.name)===nkey(name))){toast('الصنف ده موجود قبل كده: '+name+'. عدّل سعره من القايمة تحت');$('iq').value=name;drawItemList();return}
  const o={id:uid(),type:curIT,name,p:0,w:0,h:0};
  document.querySelectorAll('#nform [data-nf]').forEach(i=>{if(i.dataset.nf==='p')setPrice(o,itCat,nv(i.value));else o[i.dataset.nf]=nv(i.value)});S.items.push(o);put('items',o);drawItems()});
$('items').addEventListener('input',e=>{const t=e.target,k=t.dataset.k;if(!k)return;const it=S.items.find(x=>x.id===k);if(!it)return;if(t.dataset.f==='p')setPrice(it,itCat,nv(t.value));else it[t.dataset.f]=t.dataset.f==='name'?t.value:nv(t.value);touch('items',it)});
$('items').addEventListener('click',e=>{const k=e.target.dataset.d;if(!k)return;const it=S.items.find(x=>x.id===k);del('items',k);drawItemList();
  if(it)toast('اتمسح الصنف: '+it.name,'تراجع',()=>{undel('items',it);drawItemList()})});

/* ---------- ترتيب الأصناف بالأكثر استخداماً ---------- */
let useV=-1,useMap={};
function usage(){if(useV===DV)return useMap;useMap={};const names=[];S.invoices.forEach(r=>(r.rows||[]).forEach(x=>{if(x.n)names.push(nm(x.n))}));
  S.items.forEach(it=>{const k=nm(it.name);let n=0;for(const x of names)if(x===k||x.startsWith(k+' '))n++;useMap[it.id]=n});useV=DV;return useMap}
function itemsList(){const q=$('iq').value.trim(),u=curIT==='mq'?usageCat(itCat):usage(),l=S.items.filter(it=>it.type===curIT&&qm(it.name,q));
  l.sort($('isort').value==='name'?(a,b)=>a.name.localeCompare(b.name,'ar'):(a,b)=>(u[b.id]||0)-(u[a.id]||0)||a.name.localeCompare(b.name,'ar'));return l}
$('iq').oninput=drawItemList;$('isort').onchange=drawItemList;

/* ---------- بحث الأصناف ---------- */
const dd=$('dd');let ddInp=null,ddRow=null;
const szOf=it=>it.h&&it.w?it.w+'×'+it.h:'';
function placeDD(){if(dd.style.display==='none'||!ddInp)return;const r=ddInp.getBoundingClientRect(),vh=window.visualViewport?visualViewport.height:innerHeight,h=Math.min(dd.scrollHeight,220);
  let top=r.bottom+2;if(top+h>vh-4&&r.top-h-2>4)top=r.top-h-2;
  dd.style.top=top+'px';dd.style.right=Math.max(4,innerWidth-r.right)+'px';dd.style.width=Math.max(230,r.width)+'px'}
function showDD(inp,tr){const q=inp.value.trim(),t=tr.dataset.t;const l=S.items.filter(it=>qm(it.name,q)),cu=custUsage(lastC);{const u=usageCat(invCat);const pt=invCat==='rdy'?'rd':'mq';l.sort((a,b)=>(cu[b.id]||0)-(cu[a.id]||0)||((b.type===pt)-(a.type===pt))||(u[b.id]||0)-(u[a.id]||0))}
  if(!l.length){dd.style.display='none';return}ddInp=inp;ddRow=tr;
  dd.innerHTML=l.map(it=>`<div data-k="${it.id}"><span style="flex:1">${cu[it.id]?'<b class="ucm">★</b> ':''}${esc(it.name)}${cu[it.id]?` <small class="num ucn">×${cu[it.id]}</small>`:''}</span><small class="num">${szOf(it)?'('+esc(szOf(it))+')':''}</small><small>${it.type==='rd'?'جاهز':'مقطع'}</small><b class="num">${priceOf(it,invCat)||''}</b></div>`).join('');
  dd.style.display='block';placeDD()}
dd.addEventListener('mousedown',e=>{e.preventDefault();const cd=e.target.closest('div[data-c]');if(cd){const c=getC(cd.dataset.c);if(c&&ddInp){ddInp.value=c.name;ddInp.dispatchEvent(new Event('input',{bubbles:true}))}dd.style.display='none';return}const d=e.target.closest('div[data-k]');if(!d)return;const it=S.items.find(x=>x.id===d.dataset.k),rd=it.type==='rd';
  if(it.type!==ddRow.dataset.t){const nd=addRow(it.type,ddRow.dataset.rt,ddRow.dataset.src);ddRow.after(nd);ddRow.remove();ddRow=nd;ddInp=nd.querySelector('.n')}
  ddRow.dataset.iid=it.id;ddInp.value=rd&&it.h&&it.w?`${it.name} ${it.w}×${it.h}`:it.name;
  const s=(c,v)=>{const x=ddRow.querySelector(c);if(x)x.value=v||''};s('.p',priceOf(it,invCat));s('.w',it.w);s('.h',it.h);
  dd.style.display='none';calc();const e0=[...ddRow.querySelectorAll('input.w,input.h,input.c,input.p')].find(i=>!i.value);if(e0)e0.focus()});
function showCD(inp){if(inp.readOnly)return;const q=inp.value.trim(),l=S.customers.filter(c=>!c.arch&&qm(c.name,q)).sort((a,b)=>a.name.localeCompare(b.name,'ar')).slice(0,40);
  if(!l.length){dd.style.display='none';return}ddInp=inp;
  dd.innerHTML=l.map(c=>`<div data-c="${c.id}"><span style="flex:1">${esc(c.name)}</span><small class="num">${bal(c)}</small></div>`).join('');
  dd.style.display='block';placeDD()}
['cust','hq'].forEach(id=>{const i=$(id);['focus','click','input'].forEach(ev=>i.addEventListener(ev,()=>showCD(i)))});
document.addEventListener('click',e=>{if(!dd.contains(e.target)&&e.target!==ddInp)dd.style.display='none'});
addEventListener('scroll',e=>{if(dd.contains(e.target))return;placeDD()},true);if(window.visualViewport)visualViewport.addEventListener('resize',placeDD);
document.addEventListener('input',e=>{const t=e.target;if(!t||t.tagName!=='INPUT'||!/^(decimal|numeric|tel)$/.test(t.getAttribute('inputmode')||''))return;const v=t.value,n=toEn0(v);if(n===v)return;let c=null;try{c=t.selectionStart}catch(_){}t.value=n;try{if(c!=null)t.setSelectionRange(c,c)}catch(_){}},true);
document.addEventListener('focusin',e=>{if(e.target.tagName==='INPUT'&&e.target.getAttribute('inputmode')==='decimal'&&!e.target.readOnly)try{e.target.select()}catch(_){}});

/* ---------- الفاتورة ---------- */
/* مقاس الحساب بيظهر فوق خانتي العرض والطول في نفس الصف، و📐✓ معناها إن البند ليه مقاس حساب */
function showB(d){const bt=d.querySelector('.bt');if(bt){bt.textContent='📐✓';bt.classList.add('on')}}
function bzClose(d){const bz=d.querySelector('.bz');if(!bz||bz.classList.contains('hide'))return;bz.classList.add('hide');const bt=d.querySelector('.bt'),has=!!(d.querySelector('.bw').value.trim()||d.querySelector('.bh').value.trim());bt.textContent=has?'📐✓':'📐';bt.classList.toggle('on',has);calc()}
const getVals=d=>{const o={};['n','w','h','c','p','bw','bh'].forEach(k=>{const i=d.querySelector('.'+k);if(i)o[k]=i.value});if(d.dataset.rt){o.rt=1;o.src=d.dataset.src||''}if(d.dataset.iid)o.i=d.dataset.iid;return o};
const setVals=(d,o)=>{if(o.i)d.dataset.iid=o.i;Object.keys(o).forEach(k=>{if(k==='rt'||k==='src'||k==='b'||k==='bd'||k==='i')return;const i=d.querySelector('.'+k);if(i)i.value=o[k]});if(o.b){const i=d.querySelector(o.bd==='h'?'.bh':'.bw');if(i)i.value=o.b}if(o.bw||o.bh||o.b)showB(d);if(o.rt)markRt(d,o.src)};
let toastT=0;
/* رسالة فوق الشاشة: لو ليها فعل، الضغط على الرسالة كلها بيفتحه، ومن غيره الضغط بيقفلها */
function toast(msg,label,fn){const t=$('toast'),sp=document.createElement('span');sp.textContent=msg;t.innerHTML='';t.appendChild(sp);
  if(label){const b=document.createElement('b');b.textContent=label+' ‹';t.appendChild(b)}
  t.onclick=()=>{clearTimeout(toastT);t.classList.add('hide');if(fn)fn()};
  t.classList.remove('hide');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add('hide'),fn?8000:4000)}
function delRow(d){const t=d.dataset.t,vals=getVals(d),idx=[...$('rows').children].indexOf(d);d.remove();calc();
  toast('اتمسح البند','تراجع',()=>{const d2=addRow(t);setVals(d2,vals);const ch=$('rows').children;if(idx>=0&&idx<ch.length-1)$('rows').insertBefore(d2,ch[idx]);calc()})}
function swipeDel(d){let x0=0,y0=0,dx=0,on=false;
  d.addEventListener('touchstart',e=>{const t=e.touches[0];x0=t.clientX;y0=t.clientY;dx=0;on=true},{passive:true});
  d.addEventListener('touchmove',e=>{if(!on)return;const t=e.touches[0];dx=t.clientX-x0;if(Math.abs(t.clientY-y0)>Math.abs(dx)){on=false;d.style.transform='';d.style.opacity='';return}
    if(Math.abs(dx)>12){d.style.transform='translateX('+dx+'px)';d.style.opacity=String(Math.max(.3,1-Math.abs(dx)/260))}},{passive:true});
  d.addEventListener('touchend',()=>{if(!on)return;on=false;if(Math.abs(dx)>110)delRow(d);else{d.style.transform='';d.style.opacity=''}})}
/* الصف الأخير دايماً فاضي: أول ما تكتب فيه أو تختار صنف بيتبني صف جديد تحته، والفاضي مبيتحفظش */
const rowBlank=d=>!d.dataset.rt&&['.n','.w','.h','.c','.p','.bw','.bh'].every(k=>{const i=d.querySelector(k);return !i||!i.value.trim()});
function rowTail(){const r=$('rows');let l=r.lastElementChild;if(!l||!rowBlank(l)){addRow(defT());return}
  while(l.previousElementSibling&&rowBlank(l.previousElementSibling)&&!l.contains(document.activeElement)){const p=l.previousElementSibling;l.remove();l=p}}
function addRow(t,rt,src){const rd=t==='rd',one=rd,d=document.createElement('div');d.className='row';d.dataset.t=t;
  const num=(c,l)=>`<div><label>${l}</label><input class="${c}" type="text" inputmode="decimal"></div>`;
  const cpB='<button class="cp" aria-label="نسخ البند" title="نسخ">⧉</button>';
  d.innerHTML=one?`${cpB}<div class="r1 one"><input class="n" placeholder="اسم الصنف" autocomplete="off"><input class="c" type="text" inputmode="decimal" placeholder="العدد"><input class="p" type="text" inputmode="decimal" placeholder="السعر"></div><span class="vc"><b class="val num"></b></span><button class="del" aria-label="حذف">×</button><span class="qq hide"></span>`:`${cpB}<div class="rg c5"><input class="n" placeholder="بحث" autocomplete="off" aria-label="اسم الصنف"><input class="w" type="text" inputmode="decimal" placeholder="عرض" aria-label="العرض"><input class="h" type="text" inputmode="decimal" placeholder="طول" aria-label="الطول"><input class="c" type="text" inputmode="decimal" placeholder="عدد" aria-label="العدد"><input class="p" type="text" inputmode="decimal" placeholder="سعر" aria-label="السعر"></div><div class="bz c5 hide"><span></span><input class="bw" type="text" inputmode="decimal" placeholder="حساب" aria-label="عرض اللوح للحساب"><input class="bh" type="text" inputmode="decimal" placeholder="حساب" aria-label="طول اللوح للحساب"></div><span class="vc"><b class="val num"></b></span><button class="del" aria-label="حذف">×</button><div class="rf"><button type="button" class="bt" title="مقاس مختلف للحساب (عرض وطول اللوح)" aria-label="مقاس مختلف للحساب">📐</button><button type="button" class="lpb hide"></button><span class="qq"></span></div>`;
  d.querySelector('.del').onclick=()=>delRow(d);d.querySelector('.cp').onclick=()=>{const v=getVals(d),d2=addRow(t),k={};['n','p','i'].forEach(q=>{if(v[q]!=null)k[q]=v[q]});setVals(d2,k);if(d.dataset.iid)d2.dataset.iid=d.dataset.iid;d.after(d2);calc();d2.querySelector('input.w,input.c').focus()};swipeDel(d);d.querySelectorAll('input').forEach(i=>i.oninput=calc);
  {const bt=d.querySelector('.bt');if(bt)bt.onclick=()=>{const bz=d.querySelector('.bz');if(bz.classList.contains('hide')){bz.classList.remove('hide');bt.textContent='📐';bt.classList.add('on');d.querySelector('.bw').focus()}else bzClose(d)}}
  const n=d.querySelector('.n');n.onfocus=()=>showDD(n,d);n.addEventListener('click',()=>showDD(n,d));n.addEventListener('input',()=>showDD(n,d));{const r=$('rows'),l=r.lastElementChild;if(l&&rowBlank(l))r.insertBefore(d,l);else r.appendChild(d)}if(rt)markRt(d,src);return d}
function markRt(d,src){d.dataset.rt='1';if(src)d.dataset.src=src;if(d.querySelector('.rtb'))return;const b=document.createElement('span');b.className='rtb';b.textContent='↩ مرتجع'+(src?' من فاتورة '+src:'');d.insertBefore(b,d.firstChild)}
let saveWarn='',editWarn='',repR=null,lpMap=null,TOT={},editId=null,editU=0,_pw='',dpOpen=false,qtFrom=null,fullK=null,lastSaved=null,dbFull=false,spOn=true,SP=[];
/* المبلغ اللي لو اتدفع بعد خصم النسبة يغطي t بالظبط */
/* مفيش قروش في أي مبلغ: كله بيتقرّب لأعلى جنيه صحيح. fee = خصم التحويل (مقرّب لفوق) */
const up=a=>Math.ceil(a-1e-9),fee=(a,p)=>up(a*p/100);
function grossFor(t,pf){t=up(t);if(!(pf>0)||pf>=100)return t;let g=up(t/(1-pf/100));while(g-fee(g,pf)<t)g++;return g}
const rndInv=a=>up(a);
function calc(){rowTail();let sub=0,tq=0;const rows=[];const CZ=pget('ceilSz',true),cz=v=>CZ&&v>0?Math.ceil(v-1e-9):v;/* رقم الصنف بيتحفظ مع البند لو اسمه لسه زي اسم الصنف بالظبط (اتختار من القايمة أو اتكتب زيه) */
  let exM=null;const itKeys=it=>{const k=nkey(it.name);return k?[k].concat(it.type==='rd'&&it.w&&it.h?[nkey(it.name+' '+it.w+'×'+it.h)]:[]):[]},itemOf=(d,t,n)=>{const k=nkey(n);if(!k)return null;const a=d.dataset.iid&&S.items.find(x=>x.id===d.dataset.iid);if(a&&a.type===t&&itKeys(a).includes(k))return a.id;if(!exM){exM=new Map();S.items.forEach(it=>itKeys(it).forEach(x=>{if(!exM.has(it.type+'|'+x))exM.set(it.type+'|'+x,it.id)}))}return exM.get(t+'|'+k)||null};
  document.querySelectorAll('#rows .row').forEach(d=>{const g=c=>d.querySelector(c),gv=c=>nv(g(c)&&g(c).value),rd=d.dataset.t==='rd';
    const w=gv('.w'),h=gv('.h'),c0=gv('.c'),p=gv('.p'),c=c0>0?c0:(((g('.c')||{}).value||'').trim()===''&&(p>0||(w>0&&h>0))?1:0),bw=gv('.bw'),bh=gv('.bh'),ew=cz(bw>0?bw:w),eh=cz(bh>0?bh:h),area=!rd&&ew>0&&eh>0;
    const sg=d.dataset.rt?-1:1,q=area?rd2(ew*eh/10000*c):0,v=up((area?q:c)*p)*sg;
    const bl=rowBlank(d);d.classList.toggle('blank',bl);{const ci=g('.c');if(ci){const one=c===1&&c0<=0&&!bl;if(!ci.dataset.ph)ci.dataset.ph=ci.placeholder;if(ci.classList.contains('c1')!==one){ci.classList.toggle('c1',one);ci.placeholder=one?'1':ci.dataset.ph}}}g('.qq').textContent=area?'الكمية: '+fq(q)+' م²'+'':'';g('.val').textContent=bl?'':f(v);
    {const hb=g('.lpb');if(hb){const lp=lpMap&&!d.dataset.rt?lpMap.get(nkey(g('.n').value)):0;if(lp&&lp!==p){hb.textContent='↵ '+f(lp);hb.title='آخر سعر له '+f(lp);hb.dataset.p=lp;hb.classList.remove('hide')}else hb.classList.add('hide')}}
    if(c>0){const o={t:d.dataset.t,n:g('.n').value,w,h,c,q,p,v};if(w>0&&h>0&&w>h){o.w=h;o.h=w;if(bw>0||bh>0){o.bw=bh;o.bh=bw}}{const ii=itemOf(d,o.t,o.n);if(ii){o.i=ii;const it0=S.items.find(x=>x.id===ii);if(it0&&+it0.cp>0)o.k=rd2((area?q:c)*(+it0.cp))*sg}}if(!o.bw)delete o.bw;if(!o.bh)delete o.bh;if(!o.bw&&!o.bh){if(bw>0)o.bw=bw;if(bh>0)o.bh=bh}if(sg<0){o.rt=1;if(d.dataset.src)o.src=d.dataset.src}rows.push(o);sub+=v;tq+=q*sg}});
  sub=up(sub);const prev=up(nv($('prev').value)),pf=spT().pf,refund=nv($('refund').value),invA=rd2(sub+nv($('nylon').value)-nv($('disc').value)),total=rd2(rndInv(invA+prev));
  /* "دفع كامل": المدفوع بيفضل ماشي مع الإجمالي والنسبة لحد ما تكتب مبلغ بإيدك */
  const paidRaw=spT().raw,pfv=spT().fv,paid=rd2(paidRaw-pfv-refund);
  /* المدفوع الآن = الصافي بعد خصم التحويل (1000 فودافون بخصم 1% = 990) */if(nv($('paid').value)!==rd2(paidRaw-pfv))$('paid').value=paidRaw?String(rd2(paidRaw-pfv)):'';$('paid').readOnly=true;
  {const pe=$('prev');if(pe.readOnly&&pe.value!==''&&nv(pe.value)!==prev)pe.value=String(prev)}
  $('tqw').textContent=tq>0?' ('+fq(tq)+' م²)':'';$('sub').textContent=f(sub);$('grand').textContent=fb(total);$('rest').textContent=fb(rndInv(rd2(total-paid)));{const pr=$('rest').parentNode;pr.classList.toggle('dr',total-paid>0);pr.classList.toggle('ok',total-paid<=0&&(total!==0||paid!==0))}
  $('r_sub').classList.toggle('hide',!rows.length);$('discWhy').classList.toggle('hide',!nv($('disc').value)&&!$('discWhy').value.trim());
  drawPayBar(total,prev,refund,pf,pfv,paidRaw);spUI();$('saveQt').classList.toggle('hide',!rows.length||!!editId);
  $('dpAmt').textContent=pfv?' = '+f(pfv):'';TOT={rows,sub,tq:rd2(tq),prev,pf,pfv,pfWhy:spWhy(),pays:spPays(),paidRaw,refund,total,paid,rest:rndInv(rd2(total-paid))};totExtra();pfLine();
  /* تنبيه حد الدين: لو الحساب بعد الفاتورة هيعدّي الحد اللي اتحدد للعميل */
  {const lc=invCust(),lw=$('limW');if(lw){const over=lc&&lc.lim>0&&!editId&&TOT.rest>lc.lim;lw.classList.toggle('hide',!over);if(over)lw.textContent='⚠ الحساب هيبقى '+f(TOT.rest)+' وده أكتر من حد الدين ('+f(lc.lim)+')'}}
  const pay=!rows.length&&paid>0;$('save').textContent=(editId?'💾 حفظ التعديل':pay?'💵 تسجيل دفعة':'💾 حفظ الفاتورة')+(rows.length?' · '+fb(total):pay?' · '+f(paid):'');$('saveImg').textContent=pay?'دفعة كصورة':'حفظ كصورة';$('repLast').classList.toggle('hide',!repR||rows.length>0||!!editId||!pget('repLastOn',true));fmtAll()}
['nylon','disc','dp','prev','paid','refund','discWhy','pfWhy'].forEach(i=>$(i).oninput=calc);
$('paid').oninput=()=>{fullK=null;calc()};
/* شريط الدفع: "دفع كامل" + طرق الدفع الجاهزة. الطريقة المختارة بتظهر في الفاتورة جنب المدفوع */
/* نسبة خصم التحويل لكل عميل: البرنامج بيفتكر آخر نسبة اتسجلت مع العميل لكل طريقة دفع ليها خصم */
function rateFor(c,x){return c&&c.pfr&&c.pfr[x.n]!=null?c.pfr[x.n]:x.p}
function rememberRate(c,why,pf){if(!c||!why)return;let x=null;try{x=pfPresets().find(p=>p.n===why)}catch(e){}if(!x||!(x.p>0))return;
  const m=c.pfr||{};if(m[why]===pf||(m[why]==null&&pf===x.p))return;c.pfr={...m,[why]:pf};put('customers',c)}
function invCust(){return findCust($('cust').value.trim())}
function drawPayBar(total,prev,refund,pf,pfv,paidRaw){
  const ia=rd2(total-prev),fa=rd2(total+refund);let fh='';
  const am=v=>pf>0?' '+f(grossFor(v,pf)):'';
  if(fa>0)fh=prev>0&&ia>0?`<button type="button" class="alt full" data-fk="inv">✓ الفاتورة كاملة${am(ia+refund)}</button><button type="button" class="alt full" data-fk="all">✓ الحساب كله${am(fa)}</button>`:`<button type="button" class="alt full" data-fk="all">✓ دفع كامل${am(fa)}</button>`;
  const pe=$('pfFull');if(pe.dataset.h!==fh){pe.innerHTML=fh;pe.dataset.h=fh}
  pe.querySelectorAll('button').forEach(b=>b.classList.toggle('on',fullK===b.dataset.fk));
  const pw=$('pfWhy').value.trim(),c=invCust();let ps=[],chip=false,feeOn=false;try{ps=pfPresets()}catch(e){}
  /* طريقة ليها خصم (زي المحفظة) تفضل متعلّمة مهما اتغيرت النسبة، والطريقة اللي من غير خصم لازم تفضل 0% */
  $('pfPre').querySelectorAll('button').forEach(b=>{const x=ps[+b.dataset.pre];if(!x)return;const fee=x.p>0,on=!!pw&&x.n===pw&&(fee||pf===0);if(on){chip=true;feeOn=fee}
    b.classList.toggle('on',on);const t=x.n+' '+fq(on?pf:rateFor(c,x))+'%';if(b.textContent!==t)b.textContent=t});
  const open=dpOpen||(!!(pw||$('dp').value.trim())&&!chip);$('r_dp').classList.toggle('hide',!open);$('pfOther').classList.toggle('on',open);
  $('pfStep').classList.toggle('hide',!feeOn);const si=$('pfStepIn');if(document.activeElement!==si)si.value=fq(pf);$('pfStepAmt').textContent=pfv?'= خصم '+f(pfv):'';
  $('pfInfo').textContent=pfv&&!open&&!feeOn?'خصم '+f(pfv):''}
$('payBar').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.fk){fullK=fullK===b.dataset.fk?null:b.dataset.fk;if(!fullK)$('paid').value='';calc();return}
  if(b.dataset.cash){spAdd({n:'نقدي',p:0});return}
  if(b.dataset.pre!==undefined){const x=pfPresets()[+b.dataset.pre];if(!x)return;if(b.classList.contains('on')){$('pfWhy').value='';$('dp').value='';calc()}else spAdd(x);return}
  if(b.id==='pfOther'){dpOpen=!dpOpen;if(!dpOpen&&$('r_dp').contains(document.activeElement))document.activeElement.blur();calc();if(dpOpen)$('pfWhy').focus()}};
/* طرق الدفع ثابتة قدامك دايماً (نقدي + طرق التحويل من الإعدادات): كل طريقة = مبلغ + نسبة خصم (للتحويل). اللي مبلغه فاضي مش بيتحسب */
const PYM=()=>{let p=[];try{p=pfPresets()}catch(e){}return[{n:'نقدي',p:0},...p.filter(x=>x.n!=='نقدي')]};
function spRate(x){if(x.n==='نقدي')return 0;let r=null;try{r=pfPresets().find(p=>p.n===x.n)}catch(e){}return r?rateFor(invCust(),r):x.p}
/* بيبني الصفوف من الطرق الحالية ويحافظ على المبالغ المكتوبة، وأي طريقة قديمة ليها مبلغ بتفضل */
function spRefresh(){const old=SP;SP=PYM().map(m=>{const o=old.find(x=>x.n===m.n);return o||{n:m.n,a:0,p:m.p,on:m.n==='نقدي'}});old.forEach(o=>{if(o.a>0&&!SP.some(x=>x.n===o.n))SP.push(o)});spDraw()}
function spInit(){SP=[];spOn=true;spRefresh()}
function spUsed(){return SP.filter(x=>x.a>0)}
function spT(){const u=spUsed();let raw=0,fv=0;u.forEach(x=>{raw+=x.a;fv+=fee(x.a,x.p)});raw=rd2(raw);fv=rd2(fv);return{raw,fv,pf:u.length===1?u[0].p:raw>0?rd2(fv*100/raw):0}}
function spWhy(){const u=spUsed();return u.length===1?(u[0].n==='نقدي'?'':u[0].n):u.map(x=>x.n+' '+f(x.a)).join(' + ')}
function spPays(){const u=spUsed();return u.length>1?u.map(x=>({n:x.n,a:x.a,p:x.p})):null}
/* الأيقونات جوه الملف نفسه (عشان تظهر حتى لو نسخت index.html لوحده) */
const IMG_VODA='data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM4MHB0IiB2aWV3Qm94PSItLjM5OCAtNC41OSAzNzguOTE4IDM4OC42MzMiIHdpZHRoPSI1MDQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0ibTExOS40NDEgMTQuMzI4YzQ3LjQ2NS0xOC45MTggMTAyLjc1NC0xNy42MSAxNDguOTU0IDQuMzYzLTEzLjE2NS0yLTI2LjU1NS0uNDkyLTM5LjU4NiAxLjcxMS0zNS4zOTEgNi42ODQtNjkuMDI0IDIzLjMzNi05NS4zMTMgNDguMDc1LTI1LjIwNyAyNC43NzctNDIuODcxIDU3LjY1Mi00Ny44NiA5Mi44MjQtMy4zIDI0LjkyMi0uMjQxIDUxLjA2MiAxMC45NDIgNzMuNzQ2IDExLjUyNCAyMy44IDMxLjgwOSA0My4zMiA1Ni4yNTggNTMuMzk0IDIzLjU1OSA5Ljk3IDUwLjg4NyA5Ljg2IDc0Ljc1Ljk2MSAzNS44MDUtMTMuMTQgNjEuNTMxLTQ4LjYyIDY0LjQ3My04Ni41MjcgMS44NTEtMjQuODQ0LTQuMTkyLTUxLjI3My0yMC44ODMtNzAuMzI4LTE1LjkzNC0xOC42NTItMzkuMjM4LTI4LjkyNi02Mi41NTktMzQuNzc0LTEuMjUtMjMgOS41ODYtNDUuNzIyIDI2Ljc3LTYwLjY4IDkuNTQzLTguNjA1IDIxLjM4Ni0xNC4wOSAzMy42MzMtMTcuNmwuOTMtLjMyMWMzNS4wNTggMTYuODEyIDY0Ljg0NyA0NC41MzkgODMuODI3IDc4LjU3OCAxNi4yNjIgMjguOTggMjQuNzQzIDYyLjM3NSAyMy45MDMgOTUuNjQtLjE2IDQzLjAxNi0xNi4yMzkgODUuNjA2LTQzLjgwMSAxMTguNDk3LTI2LjA2MyAzMS4zNjctNjIuNTE2IDUzLjkzLTEwMi4yNDYgNjIuOTY1LTM5LjgzNiA5LjE5MS04Mi42OTUgNS4yMjYtMTE5Ljk3Ny0xMS43MDQtMzYuNDgtMTYuMjkzLTY3LjM4Ni00NC42MTctODcuMDQ3LTc5LjQ1Ny0xNi4zNTUtMjguOTUzLTI1LjAwNy02Mi4zMzYtMjQuMjg5LTk1LjY0LjA3OC00MS40OTYgMTQuODEzLTgyLjY3MiA0MC41NC0xMTUuMTIxIDIwLjU1LTI1LjkxIDQ3LjgxMi00Ni41MTIgNzguNTgxLTU4LjYwMnptMCAwIiBmaWxsPSIjZTYwMDAwIi8+PHBhdGggZD0ibTIyOC44MDkgMjAuNDAyYzEzLjAzLTIuMjAzIDI2LjQyMS0zLjcxIDM5LjU4Ni0xLjcxbDEuODkuMzItMS4yNjUuNDhjLTEyLjI0NyAzLjUxMi0yNC4wOSA4Ljk5Ni0zMy42MzMgMTcuNjAyLTE3LjE4NCAxNC45NTctMjguMDIgMzcuNjgtMjYuNzcgNjAuNjggMjMuMzIgNS44NDcgNDYuNjI1IDE2LjEyIDYyLjU1OSAzNC43NzMgMTYuNjkxIDE5LjA1NSAyMi43MzQgNDUuNDg0IDIwLjg4MyA3MC4zMjgtMi45NDIgMzcuOTA2LTI4LjY2OCA3My4zODctNjQuNDczIDg2LjUyNy0yMy44NjMgOC44OTktNTEuMTkxIDkuMDA4LTc0Ljc1LS45Ni0yNC40NS0xMC4wNzUtNDQuNzM0LTI5LjU5NC01Ni4yNTgtNTMuMzk1LTExLjE4My0yMi42ODQtMTQuMjQyLTQ4LjgyNC0xMC45NDEtNzMuNzQ2IDQuOTg4LTM1LjE3MiAyMi42NTItNjguMDQ3IDQ3Ljg2LTkyLjgyNCAyNi4yODgtMjQuNzM5IDU5LjkyMS00MS4zOTEgOTUuMzEyLTQ4LjA3NXptMCAwIiBmaWxsPSIjZmZmIi8+PC9zdmc+',IMG_INSTA='data:image/png;base64,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';
/* أيقونة لكل طريقة بدل الاسم (الاسم بيظهر عند الضغط المطوّل وللقارئ الصوتي) */
/* صور لوجوهات الدفع للفاتورة (بتتحمل مرة واحدة أول ما البرنامج يفتح) */
setTimeout(()=>{const mk=s=>{const i=new Image();i.src=s;return i};payImgs={'':mk(IMG_CASH),'':mk(IMG_VODA),'':mk(IMG_INSTA)}},0);
const IMG_CASH='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 44"><rect x="6" y="2" width="60" height="34" rx="4" fill="#15803d" transform="rotate(-6 36 19)"/><rect x="2" y="8" width="60" height="34" rx="4" fill="#22a05a" stroke="#14632f" stroke-width="1.5"/><rect x="6" y="12" width="52" height="26" rx="2.5" fill="none" stroke="#c8f0d4" stroke-width="1.2"/><circle cx="32" cy="25" r="8.5" fill="#e8f8ed"/><text x="32" y="29.6" font-family="Arial,sans-serif" font-weight="700" font-size="12.5" text-anchor="middle" fill="#14632f">£</text><circle cx="13" cy="25" r="2.6" fill="#c8f0d4"/><circle cx="51" cy="25" r="2.6" fill="#c8f0d4"/></svg>');
function spIcon(n){const t=esc(n);
  if(n==='نقدي')return`<span class="mi" title="${t}" role="img" aria-label="${t}"><img src="${IMG_CASH}" alt="" draggable="false"></span>`;
  if(/محفظ|فودافون|كاش/.test(n))return`<span class="mi" title="${t}" role="img" aria-label="${t}"><img src="${IMG_VODA}" alt="" draggable="false"></span>`;
  if(/انستا|إنستا|instapay/i.test(n))return`<span class="mi" title="${t}" role="img" aria-label="${t}"><img src="${IMG_INSTA}" alt="" draggable="false"></span>`;
  return`<span class="mi" title="${t}" role="img" aria-label="${t}">💳</span>`}
const spShown=x=>x.n==='نقدي'||x.on||x.a>0;
/* صفوف طرق الدفع وأيقوناتها: مشتركة بين الفاتورة وتسجيل الدفعات (A = قايمة الطرق) */
const rowsHtml=A=>A.map((x,i)=>!spShown(x)?'':`<div class="sprow" data-i="${i}">${spIcon(x.n)}<input class="spa${x.a>=1e7?' lg':''}" type="text" inputmode="decimal" placeholder="0" aria-label="مبلغ ${esc(x.n)}" value="${x.a?esc(fq(x.a)):''}">${x.n==='نقدي'?'':`<span class="pin"><input class="spp" type="text" inputmode="decimal" aria-label="نسبة خصم ${esc(x.n)}" value="${esc(fq(x.p))}"><span>%</span></span>`}<button type="button" class="alt spk"></button><span class="mute num spf"></span></div>`).join('');
/* مربعات طرق الدفع باللوجو: كل الطرق ظاهرة. الضغطة بتحط المتبقي في الطريقة، والضغطة على المتعلّمة بتشيلها */
const tileOn=x=>x.a>0||(x.n!=='نقدي'&&!!x.on);
const chipsHtml=A=>A.map((x,i)=>`<button type="button" class="alt spc${tileOn(x)?' on':''}" data-i="${i}" title="${esc(x.n)}" aria-pressed="${tileOn(x)}">${spIcon(x.n)}<small>${esc(x.n==='نقدي'?'كاش':x.n.replace(/^تحويل\s+/,''))}</small></button>`).join('');
const tilesSync=(box,A)=>box.querySelectorAll('.spc').forEach(b=>{const x=A[+b.dataset.i];if(!x)return;const on=tileOn(x);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
/* بترجّع true لو الطريقة اتشالت، false لو لازم تتملي بالمتبقي */
function tileOff(x){if(!tileOn(x))return false;x.a=0;if(x.n!=='نقدي'){x.on=false;x.pe=0}return true}
function spDraw(){$('spRows').innerHTML=rowsHtml(SP);$('spChips').innerHTML=chipsHtml(SP);$('spChips').classList.toggle('hide',!$('spChips').children.length)}
function spUI(){$('payBar').classList.add('spmode');$('payBar').closest('.isum').classList.add('sp');$('spBox').classList.remove('hide');
  document.querySelectorAll('#spRows .sprow').forEach(r=>{const x=SP[+r.dataset.i];if(!x)return;
    if(!x.pe&&!(x.a>0)&&x.n!=='نقدي'){const p=spRate(x);if(p!==x.p){x.p=p;const pi=r.querySelector('.spp');if(pi&&document.activeElement!==pi)pi.value=fq(p)}}
    {const k=r.querySelector('.spk'),kl=!(x.a>0||x.n!=='نقدي');k.textContent=kl?'كله':'✕';k.classList.toggle('kl',kl)}r.querySelector('.spf').textContent=x.p>0&&x.a>0?'= خصم '+f(fee(x.a,x.p)):''});
  tilesSync($('spChips'),SP)}
/* "كله": بيكتب المتبقي كله في الطريقة دي (والخصم متحسوب عليه). "✕": بيمسح مبلغها */
function spFill(x){const net=x.a>0?x.a-fee(x.a,x.p):0,rest=Math.max(0,rd2((TOT.rest||0)+net));x.a=rest>0?grossFor(rest,x.p):0;spDraw();calc()}
function spAdd(x){const r=SP.find(s=>s.n===x.n);if(r)spFill(r)}
/* عميل عليه سابق: سطر «+ الفاتورة» في عمود الحساب، وزرارين: الفاتورة بس / الحساب كله بدل «كله» */
const fullNets=()=>{const{prev,total,refund,rows}=TOT,ia=rd2(total-prev);return prev>0&&ia>0&&rows.length?{inv:rd2(ia+refund),all:rd2(total+refund),ia}:null};
function totExtra(){const n=fullNets(),box=$('spFull');
  $('r_inv').classList.toggle('hide',!n);if(n)$('invAmt').textContent=f(n.ia);
  $('spBox').classList.toggle('twofull',!!n&&spOn);box.classList.toggle('hide',!n||!spOn);
  if(n&&spOn){const h=`<button type="button" class="alt" data-fk="inv"><small>الفاتورة بس</small><b class="num">${f(n.inv)}</b></button><button type="button" class="alt" data-fk="all"><small>الحساب كله</small><b class="num">${f(n.all)}</b></button>`;if(box.dataset.h!==h){box.innerHTML=h;box.dataset.h=h}
    const got=rd2(TOT.paid+TOT.refund);box.querySelectorAll('button').forEach(b=>b.classList.toggle('on',spUsed().length>0&&Math.abs(got-n[b.dataset.fk])<0.01))}
  ordPickUI();
  ['grand','rest','invAmt','prev','paid'].forEach(i=>{const e=$(i),s=(e.tagName==='INPUT'?e.value:e.textContent)||'';e.classList.toggle('lg',s.length>9)});draftSoon()}
/* بيحط المبلغ كله في طريقة واحدة: التحويل المفتوح لو فيه، غير كده الكاش */
$('spFull').onclick=e=>{const b=e.target.closest('button'),n=b&&fullNets();if(!n)return;
  const t=SP.find(x=>x.n!=='نقدي'&&x.on)||SP.find(x=>x.n==='نقدي');if(!t)return;
  SP.forEach(x=>{x.a=0});t.a=grossFor(n[b.dataset.fk],t.p);spDraw();calc()};
$('spRows').oninput=e=>{const r=e.target.closest('.sprow'),t=e.target,x=r&&SP[+r.dataset.i];if(!x)return;const v=toEn(t.value).replace(/[^\d.]/g,'').replace(/\.(?=.*\.)/g,'');if(v!==t.value.replace(/,/g,''))t.value=v;
  if(t.classList.contains('spa')){/* v189: النقطة بتفضل مكتوبة والقروش مش بتتحسب، بدل ما 700.5 تتقري 7005 */if(v!==t.value.replace(/,/g,''))t.value=v;x.a=nv(v.replace(/\..*$/,''));t.classList.toggle('lg',v.replace(/\..*$/,'').length>7)}else if(t.classList.contains('spp')){x.p=Math.min(100,nv(v));x.pe=1}calc()};
$('spRows').onclick=e=>{const b=e.target.closest('.spk'),r=b&&b.closest('.sprow'),x=r&&SP[+r.dataset.i];if(!x)return;
  if(x.n!=='نقدي'){x.a=0;x.on=false;x.pe=0;spDraw();calc();return}/* طريقة التحويل بتختفي لما تمسحها */
  if(x.a>0){x.a=0;r.querySelector('.spa').value='';calc()}else spFill(x)};
$('spChips').onclick=e=>{const b=e.target.closest('.spc'),x=b&&SP[+b.dataset.i];if(!x)return;if(tileOff(x)){spDraw();calc();return}x.on=true;spFill(x);const r=$('spRows').querySelector(`.sprow[data-i="${b.dataset.i}"]`);if(r)r.querySelector('.spa').focus()};
/* تعديل فاتورة محفوظة: بيرجّع المبالغ في صفوف الطرق */
function spLoad(r){spInit();const list=PY(r)?r.pays:[{n:String(r.pfWhy||'').trim()||'نقدي',a:+(r.type==='pay'?(r.amtRaw||r.amount):(r.paidRaw||r.paid))||0,p:+r.pf||0}];
  list.forEach(y=>{let x=SP.find(s=>s.n===y.n);if(!x){x={n:y.n,a:0,p:0};SP.push(x)}x.a=+y.a||0;x.p=+y.p||0;x.pe=1;x.on=true});$('pfWhy').value='';$('dp').value='';spDraw()}
/* ===== الأرقام بفواصل الآلاف وإنت بتكتب (1000 → 1,000) في خانات الفلوس. القروش مش مطلوبة بس النقطة مسموحة ===== */
const MONEY_Q='#paid,#prev,#nylon,#disc,#refund,.spa,.row .p';
function fmtIn(el){const v=el.value;if(!v)return;const m=toEn(v).match(/^(-?)(\d*)(\.\d*)?$/);if(!m)return;
  const n=m[1]+m[2].replace(/^0+(?=\d)/,'').replace(/\B(?=(\d{3})+(?!\d))/g,',')+(m[3]||'');if(n===v)return;
  const foc=document.activeElement===el;let c=null,dg=0;if(foc){try{c=el.selectionStart}catch(_){}if(c!=null)for(let i=0;i<c;i++)if(/\d/.test(v[i]))dg++}
  el.value=n;if(foc&&c!=null){let p=0,k=0;while(p<n.length&&k<dg){if(/\d/.test(n[p]))k++;p++}try{el.setSelectionRange(p,p)}catch(_){}}}
function fmtAll(){document.querySelectorAll(MONEY_Q).forEach(el=>{if(el!==document.activeElement)fmtIn(el)})}
document.addEventListener('input',e=>{const t=e.target;if(t&&t.matches&&t.matches(MONEY_Q))fmtIn(t)});
/* v189: أول ما تسيب خانة المبلغ القروش بتتشال من المكتوب (المبلغ المحسوب أصلاً من غيرها) */
document.addEventListener('focusout',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('spa')&&t.value.indexOf('.')>=0){t.value=t.value.replace(/\..*$/,'');fmtIn(t)}});
/* ===== تسجيل دفعة (من المديونين أو من صفحة العميل): نفس طرق الدفع بتاعة الفاتورة ===== */
const PW={};
function pwReset(k,c){PW[k]=PYM().map(m=>({n:m.n,a:0,p:m.n==='نقدي'?0:(c?rateFor(c,m):m.p),on:m.n==='نقدي'}))}
function pwHtml(k,c){if(!PW[k])pwReset(k,c);const b=up(balOf(c));
  return`<div class="pw pgrid" data-pw="${k}" data-bal="${b}"><div class="pcol"><div class="pwrows"></div><div class="pwchips"></div></div><div class="pcol"><div class="trow"><label>الحساب</label><b class="num">${f(b)}</b></div><div class="trow pd"><label>المدفوع الآن</label><b class="num pwp">0</b></div><div class="trow trm"><label>بعد الدفعة</label><b class="num pwr">0</b></div></div></div>`}
const pwEl=k=>document.querySelector(`[data-pw="${k}"]`);
function pwTot(W){let raw=0,fv=0;W.forEach(x=>{if(x.a>0){raw+=x.a;fv+=fee(x.a,x.p)}});return{raw,fv,net:raw-fv}}
function pwCalc(r){const W=PW[r.dataset.pw],bal=+r.dataset.bal,t=pwTot(W),rest=bal-t.net;
  r.querySelector('.pwp').textContent=f(t.net);const re=r.querySelector('.pwr');re.textContent=f(rest);const row=re.parentNode;row.classList.toggle('dr',rest>0);row.classList.toggle('ok',rest<=0&&t.raw>0);
  r.querySelectorAll('.sprow').forEach(e=>{const x=W[+e.dataset.i];if(!x)return;e.querySelector('.spk').textContent=x.a>0||x.n!=='نقدي'?'✕':'كله';e.querySelector('.spf').textContent=x.p>0&&x.a>0?'= خصم '+f(fee(x.a,x.p)):''});
  const ch=r.querySelector('.pwchips');if(ch)tilesSync(ch,W)}
function pwMount(k){const r=pwEl(k);if(!r||!PW[k])return;const W=PW[k];r.querySelector('.pwrows').innerHTML=rowsHtml(W);const ch=r.querySelector('.pwchips');ch.innerHTML=chipsHtml(W);ch.classList.toggle('hide',!ch.children.length);pwCalc(r)}
/* "كله": بيكتب المتبقي من الحساب في الطريقة دي (بعد اللي مكتوب في باقي الطرق) */
function pwFill(W,x,bal){const net=x.a>0?x.a-fee(x.a,x.p):0,rest=Math.max(0,bal-(pwTot(W).net-net));x.a=rest>0?grossFor(rest,x.p):0}
function pwOf(e){const r=e.target.closest&&e.target.closest('.pw');return r&&PW[r.dataset.pw]?{r,W:PW[r.dataset.pw]}:null}
document.addEventListener('input',e=>{const o=pwOf(e);if(!o)return;const row=e.target.closest('.sprow'),x=row&&o.W[+row.dataset.i],t=e.target;if(!x)return;
  const v=toEn(t.value).replace(/[^\d.]/g,'').replace(/\.(?=.*\.)/g,'');
  if(t.classList.contains('spa')){/* v189: النقطة بتفضل مكتوبة والقروش مش بتتحسب، بدل ما 700.5 تتقري 7005 */if(v!==t.value.replace(/,/g,''))t.value=v;x.a=nv(v.replace(/\..*$/,''));t.classList.toggle('lg',v.replace(/\..*$/,'').length>7)}else if(t.classList.contains('spp')){if(v!==t.value)t.value=v;x.p=Math.min(100,nv(v));x.pe=1}else return;{const pm=o.r.parentNode&&o.r.parentNode.querySelector('.info');if(pm)pm.textContent=''}pwCalc(o.r)});
document.addEventListener('click',e=>{const o=pwOf(e);if(!o)return;const k=o.r.dataset.pw,bal=+o.r.dataset.bal,chip=e.target.closest('.spc');
  if(chip){const x=o.W[+chip.dataset.i];if(x&&tileOff(x)){pwMount(k);return}if(x){x.on=true;pwFill(o.W,x,bal);pwMount(k);const a=o.r.querySelector(`.sprow[data-i="${chip.dataset.i}"] .spa`);if(a)a.focus()}return}
  const b=e.target.closest('.spk');if(b){const x=o.W[+b.closest('.sprow').dataset.i];if(!x)return;if(x.n!=='نقدي'){x.a=0;x.on=false;x.pe=0}else if(x.a>0)x.a=0;else pwFill(o.W,x,bal);pwMount(k)}});
/* بيبني إيصال الدفعة من الطرق المكتوبة. طريقة واحدة = شكل الإيصال القديم، أكتر من طريقة = pays */
function pwRecord(k,c){const W=PW[k];if(!W)return null;const u=W.filter(x=>x.a>0);if(!u.length)return null;const t=pwTot(W),prev=up(balOf(c));
  const pfWhy=u.length===1?(u[0].n==='نقدي'?'':u[0].n):u.map(x=>x.n+' '+f(x.a)).join(' + '),pf=u.length===1?u[0].p:rd2(t.fv*100/t.raw);
  u.forEach(x=>rememberRate(c,x.n,x.p));
  return{id:uid(),type:'pay',cid:c.id,cname:c.name,phone:c.phone||'',ts:Date.now(),amount:t.net,amtRaw:t.raw,pf,pfv:t.fv,pfWhy,pays:u.length>1?u.map(x=>({n:x.n,a:x.a,p:x.p})):null,prev,rest:rd2(prev-t.net),no:nextPayNo(c),code:nextCode(),...noteSnap(),...byTag()}}
/* سهم فوق/تحت بيغيّر النسبة نص في المية، أو اضغط على الرقم واكتبه بإيدك */
$('pfStep').onclick=e=>{const b=e.target.closest('[data-st]');if(!b)return;const v=Math.min(100,Math.max(0,rd2(nv($('dp').value)+(+b.dataset.st)*.5)));$('dp').value=v?String(v):'0';calc()};
$('pfStepIn').oninput=e=>{const v=toEn(e.target.value).replace(/[^\d.]/g,'').replace(/\.(?=.*\.)/g,'');if(v!==e.target.value)e.target.value=v;$('dp').value=v;calc()};
['focus','click'].forEach(k=>$('pfStepIn').addEventListener(k,e=>{setTimeout(()=>{try{e.target.select()}catch(_){}},0)}));
$('r_dp').addEventListener('focusin',()=>{dpOpen=true});
$('t-new').addEventListener('click',e=>{const x=e.target.dataset.x;if(x){const r=$(x);r.classList.remove('hide');const i=r.querySelector('input');if(i&&!i.readOnly)i.focus();return}const t=e.target.dataset.add;if(t){addRow(t==='mq'?defT():t).querySelector('.n').focus();calc()}});
$('t-new').addEventListener('click',e=>{const t=e.target.dataset.ret;if(!t)return;
  if(t==='free'){const d=addRow(defT(),1);d.querySelector('.n').focus();calc();return}
  const pn=$('retPane');pn.classList.toggle('hide');if(!pn.classList.contains('hide')){$('retRes').innerHTML='';$('retNo').focus()}});
(()=>{['cust','hq','dbq','cq','iq','retNo'].forEach(id=>{const i=$(id);if(!i)return;const w=document.createElement('span');w.className='xw';if(i.style.flex)w.style.flex=i.style.flex;i.parentNode.insertBefore(w,i);w.appendChild(i);
  const b=document.createElement('button');b.type='button';b.className='xclr';b.textContent='×';b.setAttribute('aria-label','مسح');w.appendChild(b);
  const up=()=>w.classList.toggle('has',!!i.value);i.addEventListener('input',up);up();
  i.addEventListener('focus',()=>{setTimeout(()=>{try{i.select()}catch(e){}},0)});
  const doClear=()=>{if(i.readOnly)return;i.value='';up();i.dispatchEvent(new Event('input',{bubbles:true}));i.focus()};
  b.addEventListener('mousedown',e=>e.preventDefault());
  /* لمس الموبايل: منع افتراضي الـtouchend بيلغي الـclick اللي بعده، فالمسح لازم يحصل هنا مش في onclick */
  b.addEventListener('touchend',e=>{e.preventDefault();doClear()});
  b.onclick=doClear})})();
let retInv=null;
const rkey=x=>nkey(x.n||'')+'|'+(+x.w||0)+'|'+(+x.h||0);
/* المتاح للإرجاع لكل بند = العدد الأصلي - اللي اترجع قبل كده (في فواتير محفوظة أو في الفاتورة الحالية) */
function retAvail(inv){const ids=new Set([inv.code,inv.no].concat(inv.oc||[]).filter(v=>v!=null&&v!=='').map(String)),used={};
  const add=x=>{if(!x.rt||!ids.has(String(x.src==null?'':x.src)))return;const k=rkey(x);used[k]=(used[k]||0)+(+x.c||0)};
  S.invoices.forEach(r=>{if(r.cid!==inv.cid||r.id===editId||r.type==='pay')return;(r.rows||[]).forEach(add)});
  document.querySelectorAll('#rows .row[data-rt]').forEach(d=>{const v=getVals(d);add({rt:1,src:d.dataset.src,n:v.n,w:nv(v.w),h:nv(v.h),c:nv(v.c)})});
  return (inv.rows||[]).filter(x=>!x.cols&&!x.rt).map(x=>{const k=rkey(x),take=Math.min(+x.c||0,used[k]||0);used[k]=(used[k]||0)-take;return{x,done:take,left:rd2((+x.c||0)-take)}})}
$('retNo').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('retGo').click()}});
$('retGo').onclick=()=>{const n=toEn($('retNo').value).trim(),box=$('retRes');retInv=null;
  if(!n){box.innerHTML='<div class="info">اكتب كود الفاتورة.</div>';return}
  let r=S.invoices.find(x=>x.type==='inv'&&String(x.code)===n)||S.invoices.find(x=>x.type==='inv'&&(x.oc||[]).some(y=>String(y)===n));
  if(r&&lastC&&r.cid!==lastC.id){box.innerHTML='<div class="info">الكود ده فاتورة عميل تاني: '+esc(r.cname)+'</div>';return}
  if(!r&&lastC)r=S.invoices.find(x=>x.cid===lastC.id&&x.type==='inv'&&!x.code&&String(x.no)===n);
  if(!r){box.innerHTML='<div class="info">مفيش فاتورة بالكود ده.</div>';return}
  if(!lastC){const c0=getC(r.cid);if(c0){$('cust').value=c0.name;custInput();dd.style.display='none'}}
  retInv=r;const av=retAvail(r);
  box.innerHTML=`<div class="mute" style="margin:6px 0">فاتورة ${r.code?'كود '+r.code:'رقم '+r.no} · ${dshort(r.ts)} · إجمالي ${f(r.sub)}</div>`+av.map(({x,done,left},i)=>`<div class="rtl"${left<=0?' style="opacity:.55"':''}><input type="checkbox" data-ri="${i}"${left<=0?' disabled':''}><span style="flex:1">${esc(x.n)}${x.q>0?` <small class="num">(${x.w}×${x.h})</small>`:''} <small class="num">× ${f(x.c)} · ${f(x.p)}</small>${left<=0?' <small style="color:var(--danger)">اترجع بالكامل</small>':done>0?` <small style="color:var(--danger)">اترجع ${f(done)} قبل كده</small>`:''}</span><input type="text" inputmode="decimal" data-rc="${i}" value="${left>0?left:0}"${left<=0?' disabled':''}></div>`).join('')+`<button class="main" id="retAdd" style="margin-top:8px;width:100%">إضافة للمرتجع</button>`};
$('retRes').addEventListener('click',e=>{if(e.target.id!=='retAdd'||!retInv)return;const av=retAvail(retInv);let n=0,cut=0;
  document.querySelectorAll('#retRes input[data-ri]').forEach(ch=>{if(!ch.checked)return;const i=+ch.dataset.ri,a=av[i];if(!a||a.left<=0){cut++;return}const x=a.x,want=nv(document.querySelector(`#retRes input[data-rc="${i}"]`).value)||a.left,c=Math.min(a.left,want);if(want>a.left)cut++;
    const d=addRow(x.t,1,retInv.code||retInv.no);setVals(d,{n:x.n,w:x.w||'',h:x.h||'',c:c,p:x.p,...(x.i?{i:x.i}:{}),...(x.bw?{bw:x.bw}:{}),...(x.bh?{bh:x.bh}:{}),...(x.b?{b:x.b,bd:x.bd}:{})});n++});
  if(!n){toast(cut?'الأصناف دي اترجعت بالكامل قبل كده':'اختار الأصناف اللي رجعت');return}
  $('retPane').classList.add('hide');calc();toast('اتضاف مرتجع من فاتورة '+(retInv.code||retInv.no)+(cut?' (اتظبط العدد على المتاح بس)':''))});
$('lessBtn').onclick=()=>{if((document.documentElement.classList.contains('xalw')?['note']:['nylon','disc','discWhy','refund','note']).some(i=>$(i).value.trim())){toast('في إضافات مكتوبة: امسحها الأول');return}
  ['r_nylon','r_disc','r_ref'].forEach(i=>$(i).classList.add('hide'));$('discWhy').classList.add('hide');if(!lastC&&!$('prev').value)$('r_prev').classList.add('hide');$('note').classList.add('hide');$('retBox').classList.add('hide');$('retPane').classList.add('hide');$('moreBtn').classList.remove('hide');calc()};
$('moreBtn').onclick=()=>{['r_nylon','r_disc','r_ref'].forEach(i=>$(i).classList.remove('hide'));$('discWhy').classList.remove('hide');if(!lastC)$('r_prev').classList.remove('hide');$('note').classList.remove('hide');$('retBox').classList.remove('hide');$('moreBtn').classList.add('hide');calc()};
let lastC=null,invCat='d';
let cuCache={k:'',m:{}};
/* اقتراحات العميل: الأصناف اللي اتختارت له فعلاً من قايمة الأصناف (محفوظ رقم الصنف مع البند) — مفيش تخمين بالاسم ولا أصناف عامة */
function custHist(c){if(!c)return{items:{},last:{}};const k=c.id+'|'+DV+'|'+(editId||'');if(cuCache.k===k)return cuCache.m;
  const ok=new Set(S.items.map(it=>it.id)),m={},ls={};
  S.invoices.forEach(r=>{if(r.cid!==c.id||r.type==='pay'||r.id===editId)return;const seen=new Set();
    (r.rows||[]).forEach(x=>{const id=x&&x.i;if(!id||x.rt||!ok.has(id)||seen.has(id))return;seen.add(id);m[id]=(m[id]||0)+1;if(!((ls[id]||0)>=(r.ts||0)))ls[id]=r.ts||0})});
  const v={items:m,last:ls};cuCache={k,m:v};return v}
function custUsage(c){return custHist(c).items}
function drawQS(){const w=$('qwrap'),q=$('qs'),ab=$('addbar');
  const H=custHist($('cust').value.trim()?lastC:null),cu=H.items,
    mine=S.items.filter(it=>cu[it.id]).sort((a,b)=>cu[b.id]-cu[a.id]||(H.last[b.id]||0)-(H.last[a.id]||0)||a.name.localeCompare(b.name,'ar'));
  if(!mine.length){q.innerHTML='';w.classList.add('hide');ab.classList.remove('hide');return}
  w.classList.remove('hide');ab.classList.add('hide');
  q.innerHTML=mine.map(it=>`<button class="alt ${it.type==='rd'?'b-rd':'b-blue'}" data-q="${it.id}" title="${it.type==='rd'?'جاهز':'مقطع'}">${esc(it.name)}${szOf(it)?` <small class="num sz">${esc(szOf(it))}</small>`:''}${priceOf(it,invCat)?` <small class="num pr">${priceOf(it,invCat)}</small>`:''}</button>`).join('');q.scrollLeft=0}
$('qs').onclick=e=>{const b=e.target.closest('button[data-q]');if(!b)return;const it=S.items.find(x=>x.id===b.dataset.q);if(!it)return;
  const rd=it.type==='rd',d=addRow(it.type);d.dataset.iid=it.id;setVals(d,rd?{n:it.h&&it.w?`${it.name} ${it.w}×${it.h}`:it.name,p:it.p||''}:{n:it.name,w:it.w||'',h:it.h||'',p:priceOf(it,invCat)||''});calc();const e0=['w','h','c','p'].map(k=>d.querySelector('input.'+k)).filter(Boolean).find(i=>!i.value)||d.querySelector('input.c');if(e0)e0.focus()};
/* صفين بيتملوا بالأكثر استخدامًا، وباقي العملاء يتوصلهم بسحبة لجنب (qs2 في الـCSS) */
function drawRecent(){const box=$('recentC');if($('cust').value.trim()||editId){box.innerHTML='';return}
  const cnt=new Map(),last=new Map();S.invoices.forEach(r=>{if(r.type!=='pay')cnt.set(r.cid,(cnt.get(r.cid)||0)+1);if(!last.has(r.cid)||r.ts>last.get(r.cid))last.set(r.cid,r.ts)});
  const l=[...last.keys()].map(getC).filter(c=>c&&!c.arch).sort((a,b)=>(cnt.get(b.id)||0)-(cnt.get(a.id)||0)||last.get(b.id)-last.get(a.id));
  const rec=l.slice().sort((a,b)=>last.get(b.id)-last.get(a.id))[0];
  const N=24;let list=l.slice(0,N);
  if(rec&&!list.some(c=>c.id===rec.id))list=list.slice(0,N-1).concat(rec);
  box.innerHTML=list.map(c=>`<button class="alt b-cu" data-rc="${c.id}">${esc(c.name)}</button>`).join('')}
/* حفظ الاسم المكتوب في الفاتورة كعميل دلوقتي (قبل الحفظ)، بالرقم والحساب السابق اللي كتبتهم */
$('saveNewC').onclick=()=>{const name=$('cust').value.trim().replace(/\s+/g,' ');if(!name||findCust(name))return;const c={id:uid(),name,phone:normPhones($('phone').value),addr:'',note:'',open:nv($('prev').value),cat:'d'};S.customers.push(c);put('customers',c);custInput();toast('اتحفظ في العملاء ✓')};
/* مواقع العميل: الضغط على موقع بيكتبه في ملاحظة الفاتورة */
$('siteC').onclick=e=>{const b=e.target.closest('[data-site]'),c=invCust();if(!b||!c)return;const s=(c.sites||[])[+b.dataset.site];if(!s)return;$('note').classList.remove('hide');$('note').value='📍 '+s;calc()};
$('recentC').onclick=e=>{const id=e.target.dataset.rc,c=id&&getC(id);if(!c)return;$('cust').value=c.name;custInput()};
function xSync(){document.querySelectorAll('.xw').forEach(w=>{const i=w.querySelector('input');w.classList.toggle('has',!!(i&&i.value))})}
$('repLast').onclick=()=>{if(repR)loadDup(repR)};
/* البند المفتوح: أزراره بتظهر هو بس، وبيفضل مفتوح لحد ما تختار بند تاني أو تدوس بره الجدول */
const rowAct=d=>{const o=$('rows').querySelector('.row.act');if(o&&o!==d){o.classList.remove('act');bzClose(o)}if(d)d.classList.add('act')};
$('rows').addEventListener('focusin',e=>rowAct(e.target.closest('.row')));
$('rows').addEventListener('click',e=>{if(!e.target.closest('.cp'))rowAct(e.target.closest('.row'))});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#rows,#dd'))rowAct(null)});
$('rows').addEventListener('click',e=>{const b=e.target.closest('.lpb');if(!b)return;const r=b.closest('.row'),pi=r&&r.querySelector('.p');if(pi&&b.dataset.p){pi.value=b.dataset.p;calc()}});
function custInput(){drawRecent();xSync();const name=$('cust').value.trim(),c=findCust(name);
  if(c&&(!lastC||lastC.id!==c.id)){$('prev').value=balOf(c)||'';$('phone').value=c.phone||''}
  else if(!c&&lastC){$('prev').value='';$('phone').value=''}
  const nc=custCat(c);if(nc!==invCat){const had=[...$('rows').children].some(d=>!rowBlank(d));invCat=nc;if(had)toast('الفئة اتغيرت لـ '+catName(nc)+': الأسعار اللي في الفاتورة لسه زي ما هي')}
  lastC=c;
  $('saveNewC').classList.toggle('hide',!(!c&&name));
  {const sb=$('siteC'),ss=c&&c.sites||[];sb.innerHTML=ss.map((s,i)=>'<button type="button" class="alt b-cu" data-site="'+i+'">📍 '+esc(s)+'</button>').join('');sb.classList.toggle('hide',!ss.length)}
  /* آخر فاتورة للعميل + آخر سعر اتباع بيه لكل صنف */
  {const iv=c?S.invoices.filter(r=>r.cid===c.id&&r.type==='inv').sort((a,b)=>b.ts-a.ts):[];repR=iv[0]||null;lpMap=new Map();iv.slice().reverse().forEach(r=>(r.rows||[]).forEach(x=>{if(!x.rt&&x.n&&+x.p>0)lpMap.set(nkey(x.n),+x.p)}))}
  $('phoneBox').classList.toggle('hide',!!c||!name);$('prev').readOnly=!!c;if((c&&balOf(c)!==0)||(!c&&name))$('r_prev').classList.remove('hide');else if(!nv($('prev').value))$('r_prev').classList.add('hide');
  drawQS();$('cinfo').textContent=c?(c.name!==name?'هيتسجل على: '+c.name+' · ':'')+`كود ${nextCode()} · إذن ${nextNo(c)} · ${catName(invCat)} · حسابه ${bal(c)}`:name?'عميل جديد: لو عليه حساب قديم يتكتب في (رصيد سابق)':'';calc()}
$('cust').addEventListener('input',custInput);
/* إضافة عميل: جهات الاتصال (لو المتصفح بيدعمها) + تنبيه لو الاسم موجود */
if('contacts' in navigator&&'ContactsManager' in window)$('pickC').classList.remove('hide');
/* جهة اتصال: بياخد كل أرقامها (من غير تكرار نفس الرقم بصيغتين)، والأول هو الأساسي للواتساب والتذكير */
function fillFromContact(r){const tels=[],seen=new Set();(r.tel||[]).forEach(t=>{const n=normPhone(t),k=phoneKey(n)||n;if(n&&!seen.has(k)){seen.add(k);tels.push(n)}});
  $('nc_name').value=(r.name||[])[0]||'';$('nc_phone').value=tels.join(' / ');$('nc_name').dispatchEvent(new Event('input'));ncChips();ncWa();ncWarn()}
$('pickC').onclick=async()=>{try{const r=await navigator.contacts.select(['name','tel'],{multiple:false});if(r&&r[0])fillFromContact(r[0])}catch(e){}};
/* تنبيه وقت كتابة عميل جديد: نفس الاسم، أو نفس الرقم، أو رقم شكله ناقص */
function ncWarn(){const v=$('nc_name').value,p=$('nc_phone').value.trim(),pks=phoneKeys(p),dn=v.trim()&&S.customers.find(c=>nkey(c.name)===nkey(v)),dp=pks.length&&S.customers.find(c=>phoneKeys(c.phone).some(k=>pks.includes(k))),short=phoneParts(p).some(x=>/^[\d٠-٩۰-۹\s+\-().]+$/.test(x)&&toEn(x).replace(/\D/g,'').length<9),sm=v.trim()&&!dn?similarCust(v):null;
  $('cuMsg').textContent=dn?'⚠ فيه عميل بنفس الاسم ده: '+dn.name+' ('+bal(dn)+')':dp?'⚠ الرقم ده متسجل للعميل: '+dp.name:sm?'⚠ شبه عميل موجود: '+sm.name:short?'⚠ الرقم شكله ناقص':''}
['nc_name','nc_phone'].forEach(i=>$(i).addEventListener('input',ncWarn));
function clearInv(){setTimeout(drawRecent,0);editId=null;dpOpen=false;qtFrom=null;fullK=null;spInit();$('editBar').classList.add('hide');$('cust').readOnly=false;$('rows').innerHTML='';['nylon','disc','dp','pfWhy','prev','paid','note','cust','phone','refund','discWhy'].forEach(i=>$(i).value='');$('note').classList.add('hide');$('prev').readOnly=false;['r_nylon','r_disc','r_dp','r_prev','r_ref','discWhy'].forEach(i=>$(i).classList.add('hide'));lastC=null;invCat='d';drawQS();xSync();$('cinfo').textContent='';$('phoneBox').classList.add('hide');$('moreBtn').classList.remove('hide');$('retBox').classList.add('hide');$('retPane').classList.add('hide');calc()}
const INVF=['nylon','disc','dp','pfWhy','prev','paid','note','refund','discWhy'];
function invSnap(){const rows=[...$('rows').children].filter(d=>!rowBlank(d)).map(d=>({t:d.dataset.t,v:getVals(d)}));if(editId||(!$('cust').value.trim()&&!rows.length&&INVF.every(i=>!$(i).value)))return null;
  const f={};INVF.forEach(i=>f[i]=$(i).value);return{cust:$('cust').value,phone:$('phone').value,rows,f,sp:SP.map(x=>({...x})),more:$('moreBtn').classList.contains('hide')}}
function invRestore(x){clearInv();$('cust').value=x.cust;custInput();$('phone').value=x.phone;x.rows.forEach(r=>setVals(addRow(r.t),r.v));if(x.more)$('moreBtn').click();INVF.forEach(i=>$(i).value=x.f[i]);if(x.sp){SP=x.sp;spDraw()}if(x.f.prev)$('r_prev').classList.remove('hide');calc()}
$('clear').onclick=()=>{const x=invSnap();clearInv();$('msg').textContent='';if(x)toast('اتمسحت الفاتورة','تراجع',()=>invRestore(x))};
async function doSave(img){const m=$('msg'),qf=qtFrom;m.textContent='';
  try{calc();const name=$('cust').value.trim().replace(/\s+/g,' ');
    if(!name){m.textContent='اكتب اسم العميل الأول.';return}
    /* العدد لو سايبه فاضي بيتحسب 1 (طالما فيه سعر أو مقاس) */
    const bad=[...document.querySelectorAll('#rows .row')].some(d=>{const g=c=>nv((d.querySelector(c)||{}).value),emp=String((d.querySelector('.c')||{}).value||'').trim()==='',eff=g('.c')>0||(emp&&(g('.p')>0||(g('.w')>0&&g('.h')>0)));return !eff&&(g('.p')>0||((d.querySelector('.n')||{}).value||'').trim())});
    if(bad){m.textContent='في بند من غير عدد: اكتب العدد أو احذف البند.';return}
    /* بند مقطع من غير مقاس أو قيمته صفر: بننبّه مرة، ولو ضغطت حفظ تاني من غير تعديل بيتحفظ */
    {const w=[];[...$('rows').children].forEach((d,i)=>{if(rowBlank(d))return;const g=c=>nv((d.querySelector(c)||{}).value);if(d.dataset.t==='mq'&&!(g('.w')>0&&g('.h')>0))w.push((i+1)+' من غير مقاس');else if(d.querySelector('.val').textContent==='0')w.push((i+1)+' قيمته صفر')});
      const k=w.join('|')+TOT.rows.length;if(w.length&&saveWarn!==k){saveWarn=k;m.textContent='راجع البند '+w.join('، البند ')+'. لو كده صح اضغط حفظ تاني.';return}saveWarn=''}
    const hasRows=TOT.rows.length>0;if(!hasRows&&TOT.paid<=0){m.textContent='ضيف بند واكتب العدد، أو اكتب المبلغ المدفوع بس عشان تسجّل دفعة.';return}
    const note=$('note').value.trim(),nyl=nv($('nylon').value),dsc=nv($('disc').value),dWhy=$('discWhy').value.trim(),rfd=TOT.refund||0;
    if(editId){const o=S.invoices.find(x=>x.id===editId);if(!o){m.textContent='الفاتورة الأصلية مش موجودة.';return}
      if((o.u||0)>editU){const ck='conflict:'+o.id+':'+o.u;if(editWarn!==ck){editWarn=ck;m.textContent='⚠️ البيانات دي اتغيرت من جهاز تاني وانت بتعدل فيها. لو متأكد إنك عايز تحفظ تعديلك فوقها اضغط حفظ تاني.';return}editWarn=''}
      if(o.type==='inv'&&!hasRows){m.textContent='الفاتورة لازم يكون فيها بند.';return}
      if(o.type==='pay'&&hasRows){m.textContent='ده إيصال دفعة: اكتب المبلغ المدفوع بس.';return}
      if(o.type==='inv'){const total=rd2(rndInv(rd2(TOT.sub+nyl-dsc+o.prev)));Object.assign(o,{rows:TOT.rows,tq:TOT.tq,sub:TOT.sub,nylon:nyl,disc:dsc,discWhy:dWhy,refund:rfd,dp:0,dpv:0,paidRaw:TOT.paidRaw,pf:TOT.pf,pfv:TOT.pfv,pfWhy:TOT.pfWhy,pays:TOT.pays,total,paid:TOT.paid,rest:rndInv(rd2(total-TOT.paid)),note})}
      else Object.assign(o,{amount:TOT.paid,amtRaw:TOT.paidRaw,pf:TOT.pf,pfv:TOT.pfv,pfWhy:TOT.pfWhy,pays:TOT.pays,rest:rd2(o.prev-TOT.paid),note});
      o.edited=Date.now();ensureRc(o);put('invoices',o);reflow(o.cid);clearInv();drawCusts();drawDash();
      await showRec(o,img,'تم حفظ التعديل ✓');return}
    let c=findCust(name),ncid=null;/* الرصيد السابق بيتقرّب لأعلى جنيه */const ph=$('phone').value.trim(),snap=invSnap(),qo=qf?S.quotes.find(x=>x.id===qf)||null:null;
    if(!c){c={id:uid(),name,phone:ph,addr:'',note:'',open:nv($('prev').value)};ncid=c.id;S.customers.push(c);put('customers',c)}
    else if(ph&&ph!==c.phone){c.phone=ph;put('customers',c)}
    if(TOT.pays)TOT.pays.forEach(y=>rememberRate(c,y.n,y.p));else rememberRate(c,TOT.pfWhy,TOT.pf);const prev=up(balOf(c));let r;
    if(hasRows){const total=rd2(rndInv(rd2(TOT.sub+nyl-dsc+prev)));
      r={id:uid(),type:'inv',cid:c.id,cname:c.name,phone:c.phone||'',no:nextNo(c),code:nextCode(),ts:Date.now(),rows:TOT.rows,tq:TOT.tq,sub:TOT.sub,nylon:nyl,disc:dsc,discWhy:dWhy,refund:rfd,paidRaw:TOT.paidRaw,pf:TOT.pf,pfv:TOT.pfv,pfWhy:TOT.pfWhy,pays:TOT.pays,prev,total,paid:TOT.paid,rest:rndInv(rd2(total-TOT.paid)),note,...noteSnap(),...byTag()}}
    else r={id:uid(),type:'pay',cid:c.id,cname:c.name,phone:c.phone||'',no:nextPayNo(c),code:nextCode(),ts:Date.now(),amount:TOT.paid,amtRaw:TOT.paidRaw,pf:TOT.pf,pfv:TOT.pfv,pfWhy:TOT.pfWhy,pays:TOT.pays,prev,rest:rd2(prev-TOT.paid),note,...noteSnap()};
    if(hasRows&&ordOn()&&ordNew()==='p'&&(r.rows||[]).some(x=>!x.rt)){r.st='p';r.stAt=r.ts}
    ensureRc(r);S.invoices.push(r);put('invoices',r);const dueBak=payDone(c,r);if(qf&&hasRows)qtDel(qf);
    lastSaved={id:r.id,at:Date.now(),snap,ncid,qt:hasRows?qo:null,dueBak};clearInv();drawCusts();drawDash();
    await showRec(r,img,hasRows?'تم حفظ الفاتورة ✓':'تم تسجيل الدفعة ✓');if(!img&&$('autoWa').checked)autoSend(r)}
  catch(e){logErr(e,'save');m.textContent='حصل خطأ ومقدرتش أحفظ. جرّب تاني.'}}
async function autoSend(r){let can=false,file=null;try{file=new File([curBlob],curName,{type:'image/png'});can=!!(navigator.canShare&&navigator.canShare({files:[file]}))}catch(e){}
  const ready=()=>{$('resm').textContent=baseMsg+' · الإرسال جاهز من زرار "إرسال للعميل"';const b=can&&!waNum(curPhone)?$('ressh'):$('reswa');b.classList.remove('pulse');void b.offsetWidth;b.classList.add('pulse')};
  if(waNum(r.phone)){$('reswa').click();ready();return}
  if(can){try{await navigator.share({files:[file],title:curName,text:curText()})}catch(e){if(!e||e.name!=='AbortError')ready()}}}
$('save').onclick=()=>doSave(false);$('saveImg').onclick=()=>doSave(true);
$('editCancel').onclick=()=>{clearInv();$('msg').textContent=''};
function fillRows(r){(r.rows||[]).forEach(x=>{const d=addRow(x.t,x.rt,x.src),set=(k,v)=>{const i=d.querySelector(k);if(i&&v)i.value=v};if(x.i)d.dataset.iid=x.i;set('.n',x.n);set('.w',x.w);set('.h',x.h);set('.c',x.c);set('.p',x.p);if(x.b)set(x.bd==='h'?'.bh':'.bw',x.b);set('.bw',x.bw);set('.bh',x.bh);if(x.b||x.bw||x.bh)showB(d)})}
function loadDup(r){const c=getC(r.cid);if(!c){$('resm').textContent='العميل مش موجود';return}
  if((r.rows||[]).some(x=>x.cols)){$('resm').textContent='الفاتورة دي بصيغة قديمة ومينفعش تتكرر';return}
  $('res').classList.add('hide');document.querySelector('#bnav button[data-t="new"]').click();
  clearInv();$('cust').value=r.cname;custInput();fillRows(r);
  $('nylon').value=r.nylon||'';$('disc').value=rd2((r.disc||0)+(r.dpv||0))||'';$('discWhy').value=r.discWhy||'';$('note').value=r.note||'';
  if(r.nylon||r.disc||r.dpv||r.note)$('moreBtn').click();
  calc();$('cinfo').textContent='اتنسخت بنود فاتورة '+(r.code?'كود '+r.code:'رقم '+r.no)+': راجع الأسعار قبل الحفظ';window.scrollTo(0,0)}
function loadEdit(r){const c=getC(r.cid);if(!c){$('resm').textContent='العميل مش موجود';return}
  if((r.rows||[]).some(x=>x.cols)){$('resm').textContent='الفاتورة دي بصيغة قديمة ومينفعش تتعدل';return}
  $('res').classList.add('hide');document.querySelector('#bnav button[data-t="new"]').click();
  clearInv();$('cust').value=r.cname;custInput();
  fillRows(r);
  $('nylon').value=r.nylon||'';$('disc').value=rd2((r.disc||0)+(r.dpv||0))||'';$('dp').value=r.pf||'';$('pfWhy').value=r.pfWhy||'';$('refund').value=r.refund||'';$('discWhy').value=r.discWhy||'';$('paid').value=(r.type==='pay'?(r.amtRaw||r.amount):(r.paidRaw||r.paid))||'';$('note').value=r.note||'';
  spLoad(r);
  $('moreBtn').click();$('prev').value=r.prev||'';$('prev').readOnly=true;if(r.prev)$('r_prev').classList.remove('hide');
  editU=r.u||0;editId=r.id;$('editBarT').textContent='✏️ تعديل '+(r.type==='pay'?'دفعة':'فاتورة')+' '+(r.code?'كود '+r.code:'رقم '+(r.no||''))+' · '+r.cname;$('editBar').classList.remove('hide');
  $('cust').readOnly=true;$('cinfo').textContent='';$('msg').textContent='';calc();window.scrollTo(0,0)}
$('resedit').onclick=async()=>{if(curRec&&await guard(curRec,'اكتب الرقم السري لتعديل الفاتورة'))loadEdit(curRec)};$('resdup').onclick=()=>{if(curRec)loadDup(curRec)};

/* تراجع عن آخر حفظ: بيمسح الفاتورة/الدفعة ويرجّع الفاتورة زي ما كانت قبل الحفظ عشان تصلّحها */
$('resundo').onclick=()=>{const L=lastSaved;if(!L)return;const r=S.invoices.find(x=>x.id===L.id);lastSaved=null;$('res').classList.add('hide');if(!r)return;
  const cid=r.cid;del('invoices',r.id);reflow(cid);
  if(L.dueBak){const c=getC(L.dueBak.cid);if(c){c.due=L.dueBak.due;put('customers',c)}}
  if(L.ncid){const c=getC(L.ncid);if(c&&!ledger(c).length)del('customers',c.id)}
  if(L.qt&&!S.quotes.some(x=>x.id===L.qt.id))undel('quotes',L.qt);
  if(L.snap){document.querySelector('#bnav button[data-t="new"]').click();invRestore(L.snap);if(L.qt)qtFrom=L.qt.id;calc()}
  qtBtn();drawCusts();drawDash();toast('اتلغى الحفظ ✓'+(L.snap?' والفاتورة رجعت زي ما كانت':''))};

/* ---------- عروض الأسعار: بتتحفظ على الجهاز ده بس ومش بتتسجل على حساب العميل ---------- */
function qtDel(id){del('quotes',id);qtBtn()}
function qtBtn(){const n=S.quotes.length,b=$('qtOpen');b.textContent='📝 عروض الأسعار ('+n+')';b.classList.toggle('hide',!n)}
function qtSheet(q){const o=invSheet({...q,type:'inv',prev:0,paid:0,paidRaw:0,refund:0,pf:0,pfv:0,pfWhy:'',rest:q.total,code:0,rcode:0});
  o.sub='عرض سعر رقم '+q.no;o.st='qt';o.sum=o.sum.filter(x=>!/^(رصيد سابق|المدفوع|المتبقي)/.test(x[0]));
  if(!q.nylon&&!q.disc)o.sum=o.sum.filter(x=>!/^إجمالي الإذن/.test(x[0]));return o}
const showQt=(q,msg)=>showImg(sheet(qtSheet(q)),'عرض-سعر-'+q.no+'-'+sfn(q.cname)+'.png',msg||'',false,q.phone,null);
$('saveQt').onclick=()=>{const m=$('msg');m.textContent='';if(editId)return;calc();
  const name=$('cust').value.trim().replace(/\s+/g,' ');if(!name){m.textContent='اكتب اسم العميل الأول.';return}
  const bad=[...document.querySelectorAll('#rows .row')].some(d=>{const g=c=>nv((d.querySelector(c)||{}).value),emp=String((d.querySelector('.c')||{}).value||'').trim()==='',eff=g('.c')>0||(emp&&(g('.p')>0||(g('.w')>0&&g('.h')>0)));return !eff&&(g('.p')>0||((d.querySelector('.n')||{}).value||'').trim())});
  if(bad){m.textContent='في بند من غير عدد: اكتب العدد أو احذف البند.';return}
  if(!TOT.rows.length){m.textContent='ضيف بند واكتب العدد.';return}
  const c=findCust(name),nyl=nv($('nylon').value),dsc=nv($('disc').value),no=Math.max(+lsv('qtNo','0')||0,...S.quotes.map(x=>x.no||0))+1;svk('qtNo',String(no));
  const q={id:uid(),no,ts:Date.now(),cname:c?c.name:name,phone:$('phone').value.trim()||(c&&c.phone)||'',rows:TOT.rows,tq:TOT.tq,sub:TOT.sub,nylon:nyl,disc:dsc,discWhy:$('discWhy').value.trim(),note:$('note').value.trim(),...noteSnap(),total:rd2(TOT.sub+nyl-dsc)};
  if(qtFrom)del('quotes',qtFrom);S.quotes.push(q);put('quotes',q);qtBtn();clearInv();showQt(q,'تم حفظ عرض السعر ✓ (مش متسجل على حساب العميل)')};
function drawQt(){const now=Date.now();
  $('qtList').innerHTML=S.quotes.slice().sort((a,b)=>b.ts-a.ts).map(q=>{const d=Math.floor((now-q.ts)/864e5);return`<div class="rec"><div class="ro" style="color:var(--ink)"><b>${esc(q.cname)}</b><b class="num">${f(q.total)}</b></div>
    <div class="mute">عرض سعر رقم ${q.no} · ${dshort(q.ts)}${d>0?' (من '+d+' يوم)':''} · ${q.rows.length} بند</div>
    <div class="btns"><button class="main b-green" data-qi="${q.id}">↪ تحويل لفاتورة</button><button class="alt" data-qv="${q.id}" style="flex:none">عرض</button><button class="alt b-red" data-qd="${q.id}" style="flex:none">حذف</button></div></div>`}).join('')||'<p class="mute">مفيش عروض أسعار.</p>'}
function qtToInv(q){$('qtOv').classList.add('hide');document.querySelector('#bnav button[data-t="new"]').click();
  clearInv();$('cust').value=q.cname;custInput();if(!findCust(q.cname)&&q.phone)$('phone').value=q.phone;fillRows(q);
  $('nylon').value=q.nylon||'';$('disc').value=q.disc||'';$('discWhy').value=q.discWhy||'';$('note').value=q.note||'';if(q.nylon||q.disc||q.note)$('moreBtn').click();
  qtFrom=q.id;calc();$('cinfo').textContent='📝 من عرض سعر رقم '+q.no+': اكتب المدفوع واحفظ (العرض هيتمسح لوحده بعد الحفظ) · '+$('cinfo').textContent;$('msg').textContent='';window.scrollTo(0,0)}
$('qtOpen').onclick=()=>{drawQt();$('qtOv').classList.remove('hide')};
$('qtX').onclick=()=>$('qtOv').classList.add('hide');
$('qtOv').addEventListener('click',e=>{const t=e.target,d=t.dataset;if(t===$('qtOv')){$('qtOv').classList.add('hide');return}
  const q=S.quotes.find(x=>x.id===(d.qi||d.qv||d.qd));if(!q)return;
  if(d.qi)qtToInv(q);else if(d.qv)showQt(q,'');else if(d.qd&&ok2(t)){qtDel(q.id);if(qtFrom===q.id)qtFrom=null;drawQt();if(!S.quotes.length)$('qtOv').classList.add('hide')}});
qtBtn();

/* ---------- أدوات واتساب (رقم العميل ونص التذكير) ---------- */
const waNum=p=>{let d=toEn(phoneParts(p)[0]||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);else if(d.startsWith('0'))d='20'+d.slice(1);return d};
/* الاتصال بنفس الرقم المتسجل بالظبط (بس من غير مسافات، والأرقام العربي تتحول إنجليزي) */
const telNum=p=>toEn(phoneParts(p)[0]||'').replace(/[^\d+]/g,'');
function remLink(c){return 'https://wa.me/'+waNum(c.phone)+'?text='+encodeURIComponent(remText(c))}

/* ---------- النسخة الاحتياطية ---------- */
function bkInfo(){let t=0;try{t=Math.max(+localStorage.getItem('lastBackup')||0,+localStorage.getItem('cbAt')||0)}catch(e){}$('bkInfo').textContent=t?'آخر نسخة: '+stamp(t)+(Date.now()-t>6048e5?' ⚠ عدّى أكتر من أسبوع، احفظ نسخة جديدة':''):'⚠ لسه مفيش نسخة احتياطية. بياناتك على الجهاز ده بس.'}
$('bkSave').onclick=async()=>{const data=bkFull();
  const r=await dl(new Blob([JSON.stringify(data)],{type:'application/json'}),'نسخة-فواتير-'+dshort(Date.now()).replace(/\//g,'-')+'.json');
  $('bkMsg').textContent={ok:'تم حفظ النسخة ✓',anchor:'تم تنزيل النسخة ✓',declined:'تم الإلغاء',fail:'الملف متحفظش'}[r]||'';
  if(r==='ok'||r==='anchor'){try{localStorage.setItem('lastBackup',Date.now())}catch(e){}bkInfo();bkBan()}};
$('bkLoad').onclick=()=>$('bkFile').click();
/* أي حاجة اتمسحت قبل كده (محليًا ولسه ما اترفعتش، أو على السحابة كـ«تومبستون») بترجع id بتاعها هنا، عشان نمنع استرجاع نسخة قديمة من إحيائها تاني */
async function deadIds(){const s=new Set(lget('pdel').map(x=>x.k+':'+x.id)),d=FBDB;
  if(d){try{const r=await tmo(d.collection('deleted').get(),15000);r.docs.forEach(x=>{const v=x.data();if(v&&v.k&&v.tid)s.add(v.k+':'+v.tid)})}catch(e){}}
  return s}
async function restoreData(d){if(!d||!Array.isArray(d.customers)||!Array.isArray(d.invoices))throw new Error('bad');
  const dd=await deadIds(),fresh=!S.invoices.length&&!S.customers.length;
  const up=[];[['items',Array.isArray(d.items)?d.items:[]],['customers',d.customers],['invoices',d.invoices],['cats',Array.isArray(d.cats)?d.cats:[]],['quotes',Array.isArray(d.quotes)?d.quotes:[]],['expenses',Array.isArray(d.expenses)?d.expenses:[]],['suppliers',Array.isArray(d.suppliers)?d.suppliers:[]],['purchases',Array.isArray(d.purchases)?d.purchases:[]],['stock',Array.isArray(d.stock)?d.stock:[]]].forEach(([k,r0])=>{const have=new Set(S[k].map(x=>x.id)),r=r0.filter(x=>have.has(x.id)||!dd.has(k+':'+x.id));r.forEach(x=>{if(!have.has(x.id))x.u=Date.now()});mergeK(k,r,false).took.forEach(o=>up.push([k,o]))});
  migrate();up.forEach(([k,o])=>pushDoc(k,o));reflowAll();
  /* v189: برنامج لسه فاضي (موبايل جديد) = إعدادات النسخة كلها بترجع. لو عليه شغل، الناقص بس واللي متظبط على الجهاز بيفضل زي ما هو */
  let sn=0;try{if(d.settings&&typeof d.settings==='object')SET_K.forEach(k=>{if(typeof d.settings[k]==='string'&&d.settings[k]!==lsv(k,null)&&(fresh||lsv(k,null)===null)){localStorage.setItem(k,d.settings[k]);sn++}})}catch(e){}
  if(sn){try{setApply();setSoon()}catch(e){}}
  refreshAll();return 'تم الاسترجاع ✓ ('+plN(d.customers.length,'عميل')+'، '+plN(d.invoices.length,'معاملة')+(sn?'، وإعدادات المحل':'')+'): بيضيف الناقص ومبيمسحش الموجود'}
$('bkFile').onchange=async e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;
  try{$('bkMsg').textContent=await restoreData(JSON.parse(await fl.text()))}catch(err){$('bkMsg').textContent='الملف ده مش نسخة سليمة.'}};

function bkBan(){let t=0,sn=0;try{t=Math.max(+localStorage.getItem('lastBackup')||0,+localStorage.getItem('cbAt')||0);sn=+localStorage.getItem('bkSnooze')}catch(e){}
  const old=t?Date.now()-t>6048e5:S.invoices.length+S.customers.length>0,show=pget('bkAl',true)&&old&&Date.now()-sn>864e5;
  $('bkBanner').classList.toggle('hide',!show);if(show)$('bkBTxt').textContent=t?'عدّى أكتر من أسبوع على آخر نسخة احتياطية':'لسه مفيش نسخة احتياطية محفوظة'}
$('bkNow').onclick=()=>$('bkSave').click();
$('bkLater').onclick=()=>{try{localStorage.setItem('bkSnooze',Date.now())}catch(e){}bkBan()};

/* ---------- نسخة احتياطية سحابية يومية (Firebase) ---------- */
const dayKey=t=>{const d=new Date(t);return d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate())};
async function gzip(str){if(!window.CompressionStream)return{enc:'raw',data:str};
  const buf=new Uint8Array(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());let bin='';
  for(let i=0;i<buf.length;i+=32768)bin+=String.fromCharCode.apply(null,buf.subarray(i,i+32768));return{enc:'gz',data:btoa(bin)}}
async function gunzip(enc,data){if(enc!=='gz')return data;const b=atob(data),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
  return await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
let cbBusy=false;
async function cloudBackup(){if(!FBDB)throw new Error('offline');if(cbBusy)return false;cbBusy=true;
  try{const day=dayKey(Date.now()),payload=JSON.stringify({app:'ElTabakha',v:1,at:Date.now(),items:S.items,customers:S.customers,invoices:S.invoices,cats:S.cats,quotes:S.quotes,expenses:S.expenses,suppliers:S.suppliers,purchases:S.purchases,stock:S.stock}),{enc,data}=await gzip(payload),CH=400000,parts=Math.max(1,Math.ceil(data.length/CH));
    for(let i=0;i<parts;i++)await tmo(FBDB.collection('backups_data').doc(day+'_'+i).set({day,i,parts,enc,data:data.slice(i*CH,(i+1)*CH)}),20000);
    await tmo(FBDB.collection('backups_meta').doc(day).set({id:day,day,at:Date.now(),parts,enc,size:payload.length,customers:S.customers.length,invoices:S.invoices.length,items:S.items.length}),15000);
    try{localStorage.setItem('cbDay',day);localStorage.setItem('cbAt',String(Date.now()))}catch(e){}bkInfo();bkBan();
    try{const ms=(await tmo(FBDB.collection('backups_meta').get(),12000)).docs.map(d=>d.data()).sort((a,b)=>a.day<b.day?1:-1);
      for(const m of ms.slice(14)){for(let i=0;i<m.parts;i++)try{await tmo(FBDB.collection('backups_data').doc(m.day+'_'+i).delete(),8000)}catch(e){}try{await tmo(FBDB.collection('backups_meta').doc(m.day).delete(),8000)}catch(e){}}}catch(e){}
    return true}finally{cbBusy=false}}
const cbErrText=e=>/permission|insufficient/i.test((e&&(e.code||e.message))||'')?'السحابة رافضة حفظ النسخة (صلاحيات Firestore).':e&&e.message==='timeout'?'النت بطيء، هتتكرر بعدين.':e&&e.message==='offline'?'مفيش اتصال بالسحابة.':'النسخة السحابية متحفظتش. جرّب تاني.';
function cbStatus(err){const at=+lsv('cbAt','0');$('cbStat').textContent=err||(!FBDB?'مش شغالة: محتاجة تسجيل دخول بحساب Google من "المزامنة السحابية".':at?'آخر نسخة سحابية: '+stamp(at):'لسه مفيش نسخة سحابية.')}
async function autoBackupMaybe(){if(!pget('autoBk',true)||!FBDB||lsv('cbDay','')===dayKey(Date.now())||S.invoices.length+S.customers.length===0)return;
  try{await cloudBackup();cbStatus()}catch(e){cbStatus(cbErrText(e))}}
$('cbNow').onclick=async()=>{const m=$('cbMsg');m.textContent='جاري الحفظ...';try{const ok=await cloudBackup();m.textContent=ok===false?'في نسخة شغالة دلوقتي':'تم حفظ النسخة السحابية ✓';cbStatus()}catch(e){m.textContent=cbErrText(e)}};
$('cbList').onclick=async()=>{const box=$('cbRows');if(!FBDB){$('cbMsg').textContent='محتاج تسجيل دخول الأول من "المزامنة السحابية".';return}
  box.innerHTML='<p class="mute">جاري التحميل...</p>';
  try{const ms=(await tmo(FBDB.collection('backups_meta').get(),12000)).docs.map(d=>d.data()).sort((a,b)=>a.day<b.day?1:-1);
    box.innerHTML=ms.map(m=>`<div class="rec"><div class="ro" style="color:var(--ink)"><b class="num">${m.day}</b><span class="num">${m.customers} عميل · ${m.invoices} فاتورة</span></div><div class="mute num">${stamp(m.at)} · ${Math.round(m.size/1024)} ك.ب</div><div class="btns"><button class="main b-green" data-cbr="${m.day}">استرجاع</button></div></div>`).join('')||'<p class="mute">مفيش نسخ سحابية لسه.</p>'}
  catch(e){box.innerHTML='';$('cbMsg').textContent=cbErrText(e)}};
$('cbRows').onclick=async e=>{const day=e.target.dataset.cbr;if(!day)return;const m=$('cbMsg');
  if(!ok2(e.target))return;
  e.target.textContent='جاري...';
  try{const meta=(await tmo(FBDB.collection('backups_meta').doc(day).get(),12000)).data(),ps=await Promise.all(Array.from({length:meta.parts},(_,i)=>tmo(FBDB.collection('backups_data').doc(day+'_'+i).get(),20000).then(x=>x.data().data)));
    m.textContent=await restoreData(JSON.parse(await gunzip(meta.enc,ps.join(''))))}
  catch(err){m.textContent='النسخة دي مرجعتش. جرّب تاني.'}e.target.textContent='استرجاع'};

/* ---------- المزامنة السحابية (Firebase) ---------- */
const FBCFG={apiKey:'AIzaSyAofNoMj8p2Ku2QK7FI9tL6uEh3Qobq6Mg',authDomain:'tabakha-glass-5b9a4.firebaseapp.com',projectId:'tabakha-glass-5b9a4',messagingSenderId:'184894291393',appId:'1:184894291393:web:3e552df9088a21471d0340'};
let FBDB=null,lastSync=0;
const loadScript=src=>new Promise((res,rej)=>{const e=document.createElement('script');e.src=src;e.onload=res;e.onerror=()=>rej(new Error('load'));document.head.appendChild(e)});
async function fbLoad(){if(!window.firebase){const b='https://www.gstatic.com/firebasejs/13.2.0/';await loadScript(b+'firebase-app-compat.js');await loadScript(b+'firebase-auth-compat.js');await loadScript(b+'firebase-firestore-compat.js')}
  if(!firebase.apps.length)firebase.initializeApp(FBCFG);const a=firebase.auth();a.languageCode='ar';return a}
async function fbStart(cfg,email,pass,google,create){
  const auth=await fbLoad();let user;
  if(google){try{user=(await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())).user}catch(e){if(e&&/popup-blocked|operation-not-supported|web-storage-unsupported/.test(e.code||'')){
      /* لازم نعلّم إن السحابة شغالة قبل التحويل، عشان لما الصفحة ترجع من جوجل fbBoot يكمّل الدخول */
      try{localStorage.setItem('fbOn','1');localStorage.removeItem('fbCfg')}catch(_){}await auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());return false}throw e}}
  else if(email&&pass){user=(await(create?auth.createUserWithEmailAndPassword(email,pass):auth.signInWithEmailAndPassword(email,pass))).user;if(create)try{await user.sendEmailVerification()}catch(e){}}
  else user=await new Promise(r=>{const u=auth.onAuthStateChanged(x=>{u();r(x)})});
  if(!user)throw new Error('no-user');if(!await acctGate(auth,user))return false;try{localStorage.setItem('fbUid',user.uid)}catch(e){}
  const base=firebase.firestore().collection('users').doc(user.uid);
  const FV=firebase.firestore.FieldValue,TS=firebase.firestore.Timestamp,clean=o=>{if(o)delete o.su;return o};
  const rdSn=sn=>({docs:sn.docs.map(x=>{const o=x.data(),t=o.su;delete o.su;return{data:()=>o,su:t&&t.toMillis?t.toMillis():0}})});
  /* عدّ مستندات مجموعة: بيتحسب قراءة واحدة لكل 1000 مستند، والمكتبة compat مفيهاش count فبيتعمل من REST */
  const count=async k=>{const r=await fetch('https://firestore.googleapis.com/v1/projects/'+FBCFG.projectId+'/databases/(default)/documents/users/'+user.uid+':runAggregationQuery',{method:'POST',headers:{Authorization:'Bearer '+await user.getIdToken(),'Content-Type':'application/json'},body:JSON.stringify({structuredAggregationQuery:{aggregations:[{alias:'n',count:{}}],structuredQuery:{from:[{collectionId:k}]}}})});if(!r.ok)throw new Error('count');return +(await r.json())[0].result.aggregateFields.n.integerValue};
  FBDB={base,count,collection:k=>({get:async since=>{let q=base.collection(k);if(since!=null)q=q.where('su','>',TS.fromMillis(since));return rdSn(await q.get())},
    /* Firestore بيرفض أي قيمة undefined: بننضف المستند قبل الرفع */
    doc:id=>({set:o=>base.collection(k).doc(id).set({...JSON.parse(JSON.stringify(o)),su:FV.serverTimestamp()}),delete:()=>base.collection(k).doc(id).delete(),get:async()=>{const d=await base.collection(k).doc(id).get();return{exists:d.exists,data:()=>clean(d.data())}}})})};
  return true}
const fbCfg=()=>{try{return(localStorage.getItem('fbOn')==='1'||localStorage.getItem('fbCfg'))?FBCFG:null}catch(e){return null}};
const fbStat=t=>{$('fbStat').textContent=t};
/* ---------- الجهاز بيشيل بيانات حساب واحد (fbUid = صاحبها): مفيش بيانات بتتنقل بين الحسابات من غير سؤال ---------- */
/* الأصناف والفئات مش في الفحص عشان الجهاز الجديد ممكن يبدأ بأصناف جاهزة */
const localHas=()=>['customers','invoices','quotes','expenses','suppliers','purchases','stock'].some(k=>S[k].length>0);
const ACCT_LS=['pup','pdel','trash','fullAt','syncCur','syncAt','cntAt','cntBad','closes','clStart','qtNo','ordNew','codeHW','lastBackup','cbAt','cbDay','bkSnooze','cloudNag','stkMin','dcSeen','wcSeen','mcSeen','welcDone','startOff','shopAskAt','setH','fbUid','fbCfg','fbOn','lkOn','lkHash','lkSalt','lkBio','lkRecHash'];
/* إعدادات المحل واللوجو وتصميم الفاتورة بتتحفظ مع الحساب (users/{uid}/settings/shop)، فكل حساب ليه محله */
/* نوع النشاط: gen = بيع بالعدد لأي محل. لو فاضي = بالمقاس (الحسابات القديمة بتفضل زي ما هي) */
const isGen=()=>lsv('biz','')==='gen',defT=()=>isGen()?'rd':'mq';
function applyBiz(){const g=isGen();document.documentElement.classList.toggle('biz-gen',g);curIT=g?'rd':'mq';document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.it===curIT));$('bizSel').value=g?'gen':'cut';
  $('subLbl').textContent=g?'إجمالي الأصناف':'إجمالي الإذن';const l=$('rows').lastElementChild;if(l&&rowBlank(l)&&l.dataset.t!==defT()){l.remove();calc()}if(curTab==='cl'&&g)document.querySelector('#bnav [data-t="new"]').click();try{drawItems()}catch(e){}}
function bizSet(v){svk('biz',v==='gen'?'gen':'cut');if(v==='gen'&&!lsv('docw',''))svk('docw','فاتورة');applyBiz();loadMsgUI()}
const SET_K=['biz','shop','logo','logoOn','shopTxt','custw','docw','tpl_inv','tpl_pay','tpl_rem','tpl_rdy','invdesign','invtpls','invWm','invpal','fancyInv','paper','gnote','invNotes','pfPre','remDays','remOld','remBal','remfirm','remlong','rempay','rt_soft','rt_firm','rt_long','rt_paid','rt_never','rt_old','rt_bal','rt_pay','exfix'],SET_S=new Set(SET_K);
const setGet=()=>{const o={};SET_K.forEach(k=>{const v=lsv(k,null);if(v!==null)o[k]=v});return o},setKey=o=>hs(JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]])));
function setApply(){try{applyBiz();loadLogo();if(!typing($('t-st'))){loadMsgUI();shopTxtLoad();$('paperSel').value=paperKey();$('logoOn').checked=pget('logoOn',true);$('fancyInv').checked=pget('fancyInv',true)}}catch(e){}}
let setBusy=null,setT=0,setAt=0;
/* البيانات اللي على السحابة بتكسب لو الجهاز ما اتغيرش من آخر مزامنة. لو الجهاز اتغير، هو اللي بيترفع */
function setSync(){if(!FBDB||instOff)return Promise.resolve();if(setBusy)return setBusy;clearTimeout(setT);
  /* من غير تغيير على الجهاز، بنقرا السحابة أول فتحة وكل 6 ساعات بس */
  if(setAt&&Date.now()-setAt<6*36e5&&setKey(setGet())===lsv('setH',''))return Promise.resolve();
  setBusy=(async()=>{try{const ref=FBDB.collection('settings').doc('shop'),d=await tmo(ref.get(),12000),rem=d.exists?d.data():null,loc=setGet(),lk=setKey(loc),last=lsv('setH','');
    if(rem&&rem.h&&rem.v&&rem.h!==last&&(lk===last||!last)){SET_K.forEach(k=>{try{if(k in rem.v)localStorage.setItem(k,rem.v[k]);else localStorage.removeItem(k)}catch(e){}});localStorage.setItem('setH',rem.h);setApply()}
    else if(lk!==last){await tmo(ref.set({h:lk,at:Date.now(),v:loc}),15000);localStorage.setItem('setH',lk)}setAt=Date.now()}
    catch(e){}finally{setBusy=null}})();return setBusy}
const setSoon=()=>{clearTimeout(setT);setT=setTimeout(setSync,2500)};
async function wipeLocal(){clearTimeout(setT);clearTimeout(pupT);pupT=0;BIG.forEach(k=>{S[k]=[];lset(k,[])});DV++;
  if(ddb){await flushIDB();await kvPut({alertNow:[]}).catch(()=>{})}
  try{[...BIG,...ACCT_LS,...SET_K,'invDraft'].forEach(k=>localStorage.removeItem(k));Object.keys(localStorage).filter(k=>k.indexOf('nfDay_')===0).forEach(k=>localStorage.removeItem(k))}catch(e){}
  try{await idbDo('readwrite',st=>st.clear())}catch(e){}
  pupS=null;instOff=true}
/* لو البيانات هتتشال ولسه مش متأكدين إنها على السحابة: ينزل ملف نسخة منها الأول */
async function keepCopy(){try{await dl(new Blob([JSON.stringify(bkFull())],{type:'application/json'}),'نسخة-قبل-تغيير-الحساب-'+dshort(Date.now()).replace(/\//g,'-')+'.json')}catch(e){}}
let acctP=null;
function acctAsk(prev,mail){if(acctP)return acctP;acctP=new Promise(res=>{const o=$('acctOv'),end=c=>{o.classList.add('hide');acctP=null;res(c)},who=mail||'الحساب ده';
  $('acctT').textContent=prev?'البيانات دي تخص حساب تاني':'فيه بيانات على الموبايل ده';
  $('acctM').textContent=prev?'البيانات اللي على الموبايل مش بتاعة '+who+'، فمش هتتضاف عليه. لو دخلت هتتشال من الموبايل، وهينزل ملف نسخة منها الأول.':'تحب تضيفها لحساب '+who+'؟ ولو دخلت من غيرها هتتشال من الموبايل، وهينزل ملف نسخة منها الأول.';
  $('acctAdd').classList.toggle('hide',!!prev);$('acctAdd').onclick=()=>end('add');$('acctSkip').onclick=()=>end('skip');$('acctNo').onclick=()=>end('no');o.classList.remove('hide')});return acctP}
async function acctGate(auth,user){const prev=lsv('fbUid','');if(prev===user.uid)return true;
  if(!localHas()){if(prev)try{[...SET_K,'setH'].forEach(k=>localStorage.removeItem(k))}catch(e){}return true}
  const c=await acctAsk(prev,user.email);if(c==='add')return true;
  if(c==='skip'){await keepCopy();await wipeLocal();try{localStorage.setItem('fbOn','1');localStorage.setItem('fbUid',user.uid)}catch(e){}location.reload();return false}
  try{await auth.signOut()}catch(e){}try{localStorage.removeItem('fbOn');localStorage.removeItem('fbCfg')}catch(e){}throw new Error('acct-cancel')}
async function acctLeave(){try{if(window.firebase&&firebase.auth)await firebase.auth().signOut()}catch(e){}await wipeLocal();location.reload()}
const fbErr=e=>{const c=(e&&e.code)||'',t=c?' ('+c.replace('auth/','')+')':'';if(e&&e.message==='acct-cancel')return'اتلغى تسجيل الدخول، وبياناتك زي ما هي على الجهاز.';if(/popup-closed|cancelled-popup/.test(c))return'اتلغى تسجيل الدخول.';if(/email-already-in-use/.test(c))return'الإيميل ده له حساب بالفعل. سجّل دخول، أو استخدم نسيت كلمة السر.';if(/weak-password|password-does-not-meet/.test(c))return'كلمة السر ضعيفة. اكتب 8 على الأقل، حروف وأرقام مع بعض.';if(/too-many-requests/.test(c))return'محاولات كتير. استنى شوية وجرّب تاني.';if(/user-mismatch/.test(c))return'الحساب اللي اخترته مش هو الحساب الداخل دلوقتي.';if(/requires-recent-login/.test(c))return'لازم تأكد دخولك تاني.';if(/unauthorized-domain/.test(c))return'تسجيل الدخول مش متاح من العنوان ده'+t;if(/operation-not-allowed/.test(c))return'طريقة الدخول دي مش متفعلة'+t;if(/invalid-credential|wrong-password|user-not-found|invalid-email/.test(c))return'الإيميل أو كلمة السر غلط.';if(/network/.test(c))return'مفيش إنترنت.';if(e&&e.message==='no-user')return'محتاج تسجيل دخول من جديد.';if(e&&e.message==='load')return'الاتصال بالسحابة منفعش: النت مش شغال.';logErr(e,'auth');return'الربط منفعش. جرّب تاني بعد شوية.'+t};
const typing=el=>{const a=document.activeElement;return!!(a&&el.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))};
function refreshAll(){DV++;try{exfRun()}catch(e){}syncNames();if(!typing($('t-cu')))drawCusts();if(!typing($('t-it')))drawItems();if(!typing($('t-dash')))drawDash();if(!typing($('t-new')))custInput();autoBan();drawTrash();try{qtBtn()}catch(e){}if(stCur==='exp'&&!typing($('t-st')))drawExp();if(stCur==='sup'&&!typing($('t-st')))drawSup();if(stCur==='stk'&&!typing($('t-st')))drawStk()}
let syncing=null,cloudOk=null;
function syncNow(){if(!dataReady||instOff)return Promise.resolve(false);if(syncing)return syncing;
  syncing=(async()=>{let ok=false;try{ok=await loadCloud();lastSync=Date.now();if(ok){reflowAll();refreshAll();autoBackupMaybe();await setSync()}return ok}finally{syncing=null;cloudOk=ok;cloudUI()}})();cloudUI();return syncing}
/* علامة السحابة فوق: ✓ محفوظ ومتزامن · ⏳ بيحفظ · ! مش متصل · ✗ مش مربوط بحساب (البيانات على الجهاز ده بس) */
function cloudUI(){const b=$('cloudSt');if(!b)return;let s,t;
  if(!fbCfg()){s='off';t='بياناتك على الموبايل ده بس. اربطها بحسابك عشان ترجع لو الموبايل ضاع أو اتغيّر'}
  else{/* ثابتة: بتفضل على آخر حالة معروفة ومش بترمش وهي بتتصل أو بتزامن في الخلفية. «!» بس لو الاتصال فشل فعلاً */
    const last=lsv('cloudLast',''),okNow=cloudOk===true||(cloudOk===null&&last==='ok'&&navigator.onLine!==false);
    if(okNow){s='ok';t='بياناتك محفوظة على حسابك ومتزامنة ✓'+(lastSync?' · آخر مزامنة '+hm(lastSync):'')}
    else if(syncing||cloudOk===null){s='busy';t='بيتصل بالسحابة…'}
    else{s='err';t='مش متصل بالسحابة دلوقتي. بياناتك محفوظة على الجهاز وهتتزامن لوحدها لما النت يرجع'}
    if(cloudOk!==null&&!syncing)try{localStorage.setItem('cloudLast',cloudOk?'ok':'err')}catch(e){}}
  b.className='hdr-cloud '+s;b.title=t;b.setAttribute('aria-label',t);b.dataset.s=s;acctUI()}
const fbUser=()=>{try{return window.firebase&&firebase.apps.length?firebase.auth().currentUser:null}catch(e){return null}};
function acctUI(){const on=!!fbCfg(),u=fbUser();$('fbAuth').classList.toggle('hide',on);$('fbOff').classList.toggle('hide',!on);$('fbDel').classList.toggle('hide',!on);$('fbWho').textContent=u&&u.email?'الحساب: '+u.email:'';$('fbVer').classList.toggle('hide',!(u&&hasPw(u)&&!u.emailVerified))}
/* الإيميل بيتأكد عشان نسيان كلمة السر يوصل لصاحبه. البرنامج شغال عادي لحد ما يتأكد */
$('fbVerB').onclick=async()=>{const u=fbUser(),m=$('fbVerM');if(!u)return;m.textContent='جاري…';try{await u.reload();if(u.emailVerified){m.textContent='';acctUI();toast('الإيميل اتأكد ✓');return}await u.sendEmailVerification();m.textContent='بعتنا رسالة تأكيد على إيميلك. افتح الرابط اللي فيها، ولو ما وصلتش بص في الرسايل المزعجة (Spam).'}catch(e){m.textContent=fbErr(e)}};
const goData=()=>{$('hdrSet').click();stGo('data');window.scrollTo(0,0)};
$('cloudSt').onclick=()=>{const s=$('cloudSt').dataset.s;toast($('cloudSt').title,s==='off'?'اربط حسابك':s==='err'?'جرّب تاني':'الإعدادات',s==='off'?()=>authOpen():s==='err'?()=>fbBoot():goData)};
addEventListener('offline',()=>{if(fbCfg()){cloudOk=false;cloudUI()}});
async function fbBoot(){const cfg=fbCfg();if(!cfg){await syncNow();return}
  fbStat('جاري الاتصال بالسحابة...');
  try{await fbStart(cfg);const ok=await syncNow();fbStat(ok?'متصل ✓ المزامنة والنسخ الاحتياطي تلقائيين.':'متصل بالحساب لكن قراءة البيانات فشلت (صلاحيات Firestore).');shopAsk()}
  catch(e){fbStat(e&&e.message==='acct-cancel'?fbErr(e):e&&e.message==='no-user'?'محتاج تسجيل دخول من جديد.':'مفيش اتصال حالياً: بياناتك على الجهاز وهتتزامن لما النت يرجع.');cloudOk=false;
    /* رجع من شاشة جوجل من غير ما يدخل وجهازه فاضي: يرجع لشاشة الدخول */
    if(e&&e.message==='no-user'&&!localHas()){try{localStorage.removeItem('fbOn')}catch(_){}welcMaybe()}cloudUI()}}
async function fbLogin(email,pass,google,create){fbStat('جاري الربط...');
  try{const r=await fbStart(FBCFG,email,pass,google,create);if(r===false)return;try{localStorage.setItem('fbOn','1');localStorage.removeItem('fbCfg')}catch(e){}
    const ok=await syncNow();fbStat(ok?'متصل ✓ المزامنة والنسخ الاحتياطي تلقائيين.':'تم تسجيل الدخول لكن قراءة البيانات فشلت (صلاحيات Firestore).')}
  catch(e){fbStat(fbErr(e));return e}}
$('fbAuth').onclick=()=>authOpen();
/* الخروج: بيرفع آخر التعديلات، وبعدين بيشيل بيانات الحساب من الجهاز ويرجع لشاشة الدخول */
$('fbOff').onclick=async e=>{const b=e.currentTarget;if(!fbCfg()){fbStat('مفيش حساب مربوط على الجهاز ده.');return}if(!ok2(b))return;
  b.disabled=true;fbStat('جاري رفع آخر التعديلات…');let safe=false;
  try{if(FBDB){await tmo(setSync(),15000);await tmo(flushDel(FBDB),20000);await tmo(pushPending(FBDB),20000);safe=+lsv('fullAt','0')>0&&!pupGet().size&&!lget('pdel').length}}catch(err){}
  b.disabled=false;if(safe){await acctLeave();return}
  const m='فيه تعديلات لسه ما اترفعتش على حسابك. وصّل النت وجرّب تاني، أو اخرج وهينزل ملف نسخة منها.';fbStat(m);toast(m,'اخرج برضه',async()=>{await keepCopy();await acctLeave()})};
/* شاشة الدخول: أول ما البرنامج يفتح على جهاز فاضي، وبعد الخروج من الحساب */
let auM='in';
function auMode(m){auM=m;const nw=m==='new',rs=m==='reset';$('auTab').classList.toggle('hide',rs);$('auTab').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  $('auShopB').classList.toggle('hide',!nw);$('auPassB').classList.toggle('hide',rs);$('auAlt').classList.toggle('hide',rs);$('auForgot').classList.toggle('hide',nw);$('auForgot').textContent=rs?'↩️ رجوع لتسجيل الدخول':'❓ نسيت كلمة السر؟';
  $('auGo').textContent=rs?'✉️ ابعت رابط تغيير كلمة السر':nw?'✨ إنشاء الحساب':'🔑 دخول';$('auSub').textContent=rs?'اكتب إيميلك وهيوصلك رابط تغيير كلمة السر.':nw?'حساب جديد لمحلك، وبياناتك هتتحفظ عليه.':'ادخل بحسابك وبياناتك هترجع لوحدها.';
  $('auPwHint').textContent=nw?'8 حروف وأرقام على الأقل':'';$('auPass').setAttribute('autocomplete',nw?'new-password':'current-password');$('welcMsg').textContent=''}
function authOpen(){auMode('in');$('auShop').value=shopN();$('welc').classList.remove('hide')}
function welcMaybe(){if(fbCfg()||lsv('welcDone','')==='1'||S.customers.length+S.invoices.length){shopAsk();return}authOpen()}
const welcEnd=()=>{svk('welcDone','1');$('welc').classList.add('hide')};
const auDone=(nw,sh)=>{const m=$('welcMsg');if(!FBDB){m.textContent=$('fbStat').textContent;return}$('auPass').value='';if(nw&&sh){svk('shop',sh);bizSet($('auBiz').value);loadMsgUI()}welcEnd();
  toast(nw?'اتعمل حسابك ✓ وبعتنا رسالة تأكيد على إيميلك':S.invoices.length+S.customers.length?'رجعت بياناتك ✓ '+S.customers.length+' عميل · '+S.invoices.length+' فاتورة':'اتربط حسابك ✓ وأي حاجة تعملها هتتحفظ عليه لوحدها');shopAsk()};
$('auTab').onclick=e=>{const b=e.target.closest('button[data-m]');if(b)auMode(b.dataset.m)};
$('auForgot').onclick=()=>auMode(auM==='reset'?'in':'reset');
$('auEye').onclick=()=>{const p=$('auPass'),s=p.type==='password';p.type=s?'text':'password';$('auEye').textContent=s?'إخفاء':'إظهار'};
/* كلمة السر: 8 على الأقل، حروف وأرقام، ومش سهلة التخمين */
const pwWeak=(p,em)=>{const u=String(em||'').split('@')[0].toLowerCase();return p.length<8?'كلمة السر لازم تكون 8 حروف أو أرقام على الأقل.':!/[A-Za-z\u0600-\u06FF]/.test(p)||!/[0-9\u0660-\u0669]/.test(p)?'خلّي كلمة السر فيها حروف وأرقام مع بعض.':/^(.)\1+$/.test(p)||/^(0?123456789?|12345678|password|qwerty|abcd1234|a1b2c3d4)/i.test(p)||(u.length>=4&&p.toLowerCase().includes(u))?'كلمة السر دي سهلة التخمين. اختار حاجة تانية.':''};
$('auPass').addEventListener('input',()=>{const x=$('auPwHint');if(auM!=='new'){x.textContent='';return}const p=$('auPass').value,w=p?pwWeak(p,$('auMail').value):'';x.textContent=!p?'8 حروف وأرقام على الأقل':w?'⚠️ '+w:'✅ كلمة سر قوية'});
/* بعد 5 محاولات غلط ورا بعض: استنى 30 ثانية، والمدة بتتضاعف لحد 15 دقيقة */
const auWaitLeft=()=>Math.max(0,Math.ceil(((+lsv('auWait','0'))-Date.now())/1000));
function auFail(){const n=(+lsv('auFn','0'))+1;svk('auFn',String(n));if(n>=5)svk('auWait',String(Date.now()+Math.min(900,30*2**(n-5))*1000))}
$('auForm').onsubmit=async e=>{e.preventDefault();const m=$('welcMsg'),b=$('auGo'),em=$('auMail').value.trim(),pw=$('auPass').value,sh=$('auShop').value.trim(),nw=auM==='new';
  if(!/^\S+@\S+\.\S+$/.test(em)){m.textContent='اكتب إيميل صحيح.';return}
  const wl=auWaitLeft();if(wl&&auM==='in'){m.textContent='محاولات غلط كتير. استنى '+(wl>90?Math.ceil(wl/60)+' دقيقة':wl+' ثانية')+' وجرّب تاني، أو استخدم «نسيت كلمة السر».';return}
  if(auM==='reset'){const rl=60-Math.floor((Date.now()-(+lsv('auRst','0')))/1000);if(rl>0){m.textContent='الرابط اتبعت من شوية. استنى '+rl+' ثانية قبل ما تطلبه تاني.';return}svk('auRst',String(Date.now()))}
  if(auM==='reset'){b.disabled=true;m.textContent='جاري الإرسال…';try{const a=await fbLoad();await a.sendPasswordResetEmail(em);m.textContent='لو الإيميل ده له حساب، هيوصلك رابط تغيير كلمة السر. لو ما وصلش، بص في الرسايل المزعجة (Spam).'}catch(err){m.textContent=fbErr(err)}b.disabled=false;return}
  if(nw&&!sh){m.textContent='اكتب اسم المحل.';return}if(!pw){m.textContent='اكتب كلمة السر.';return}if(nw){const pe=pwWeak(pw,em);if(pe){m.textContent=pe;return}}
  b.disabled=true;m.textContent=nw?'جاري إنشاء الحساب…':'جاري الدخول وتنزيل بياناتك…';const er=await fbLogin(em,pw,false,nw);b.disabled=false;if(er){if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(er.code||''))auFail()}else{svk('auFn','0');svk('auWait','0')}auDone(nw,sh)};
$('welcG').onclick=async()=>{const m=$('welcMsg');
  if(location.protocol==='file:'){m.textContent='الدخول بحساب Google بيشتغل من لينك البرنامج بس، مش من الملف اللي على الكمبيوتر.';return}
  m.textContent='جاري الدخول وتنزيل بياناتك…';await fbLogin(null,null,true);auDone(false,'')};
$('welcNew').onclick=()=>{welcEnd();toast('تقدر تربط حسابك في أي وقت من علامة ☁️ فوق');shopAsk()};
/* اسم المحل بيظهر على الفاتورة، فلو فاضي بنسأل عليه (مرة كل 3 أيام بالكتير) */
function shopAsk(){if(shopN()||!$('welc').classList.contains('hide')||Date.now()-(+lsv('shopAskAt','0'))<3*864e5)return;svk('shopAskAt',String(Date.now()));$('shopAskIn').value='';$('shopOv').classList.remove('hide')}
$('shopAskGo').onclick=()=>{const v=$('shopAskIn').value.trim();if(!v){$('shopAskIn').focus();return}svk('shop',v);bizSet($('shopAskBiz').value);$('shopOv').classList.add('hide');toast('تم حفظ اسم المحل ✓ واللوجو وباقي البيانات من الإعدادات','بيانات المحل',()=>{$('hdrSet').click();stGo('shop');window.scrollTo(0,0)})};
$('shopAskNo').onclick=()=>$('shopOv').classList.add('hide');
$('bizSel').onchange=()=>bizSet($('bizSel').value);
/* حذف الحساب: تأكيد الدخول، بعدين مسح كل بيانات users/{uid}، بعدين الحساب نفسه، وآخر حاجة الجهاز */
const hasPw=u=>(u.providerData||[]).some(p=>p&&p.providerId==='password');
async function acctPurge(){const fs=firebase.firestore();for(const k of[...BIG,'deleted','backups_meta','backups_data','settings']){const n=k==='backups_data'?20:300;
    for(;;){const sn=await FBDB.base.collection(k).limit(n).get();if(sn.empty)break;const b=fs.batch();sn.docs.forEach(d=>b.delete(d.ref));await b.commit();if(sn.docs.length<n)break}}}
const delChk=()=>{const u=fbUser();$('delGo').disabled=$('delCf').value.trim()!=='حذف'||(!!u&&hasPw(u)&&!$('delPw').value)};
$('fbDel').onclick=()=>{const u=fbUser();if(!u||!FBDB){fbStat('لازم تكون داخل بحسابك ومتصل بالنت عشان تحذفه.');return}$('delCf').value='';$('delPw').value='';$('delMsg').textContent='';$('delPwB').classList.toggle('hide',!hasPw(u));delChk();$('delOv').classList.remove('hide')};
$('delCf').oninput=delChk;$('delPw').oninput=delChk;$('delNo').onclick=()=>$('delOv').classList.add('hide');$('delBk').onclick=()=>keepCopy();
$('delGo').onclick=async()=>{const m=$('delMsg'),b=$('delGo'),u=fbUser();if(!u||!FBDB)return;b.disabled=true;$('delNo').disabled=true;
  try{m.textContent='جاري تأكيد حسابك…';if(hasPw(u))await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,$('delPw').value));else await u.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
    if(syncing)await syncing;instOff=true;db=null;clearTimeout(setT);m.textContent='جاري مسح بياناتك…';await tmo(acctPurge(),180000);await u.delete();FBDB=null;instOff=false;await wipeLocal();location.reload()}
  catch(e){instOff=false;if(FBDB)db=FBDB;b.disabled=false;$('delNo').disabled=false;m.textContent=e&&e.message==='timeout'?'النت بطيء ومسح البيانات ما خلصش. جرّب تاني.':fbErr(e)}};
/* تذكير كل 3 أيام لو فيه بيانات ومش مربوطة بحساب */
function cloudNag(){if(fbCfg()||!S.invoices.length)return;const l=+lsv('cloudNag','0');if(Date.now()-l<3*864e5)return;svk('cloudNag',String(Date.now()));
  toast('⚠ بياناتك على الموبايل ده بس. اربطها بحسابك عشان ما تضيعش','اربط حسابك',goData)}
addEventListener('online',()=>{if(fbCfg()&&dataReady&&!instOff)fbBoot()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(FBDB)setSync();return}if(FBDB&&Date.now()-lastSync>12e4)syncNow()});

/* ---------- تطبيق الموبايل (PWA) ---------- */
$('appVer').textContent='نسخة التطبيق: '+APP_VER;
$('hdrVer').textContent='v'+APP_VER;
/* لو البرنامج فاضل مفتوح: بنسأل السيرفر كل ساعة، ومبنعرضش التحديث وفي فاتورة بتتكتب عشان ما تضيعش */
let verAt=0;async function verCheck(){if(location.protocol.indexOf('http')||!navigator.onLine||Date.now()-verAt<36e5||[...$('rows').children].some(d=>!rowBlank(d)))return;verAt=Date.now();
  try{const m=/app\.js\?v=(\d+)/.exec(await(await fetch('index.html',{cache:'no-store'})).text());if(m&&+m[1]>+APP_VER)toast('فيه نسخة جديدة من البرنامج','تحديث',()=>location.reload())}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)verCheck()});
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0)navigator.serviceWorker.register('sw.js?v='+APP_VER).catch(()=>{});
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{})}catch(e){}

try{$('autoWa').checked=localStorage.getItem('autoWa')==='1'}catch(e){}
$('autoWa').onchange=()=>{try{localStorage.setItem('autoWa',$('autoWa').checked?'1':'0')}catch(e){}};

/* ========== الإعدادات ========== */
const pget=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v==='1'}catch(e){return d}};
const pset=(k,v)=>{try{localStorage.setItem(k,v?'1':'0')}catch(e){}};
const getGN=()=>{try{return localStorage.getItem('gnote')||''}catch(e){return''}};
const PALS=['sage','dusk','latte','lav','mono','teal','ocean','violet','rose','sand','forest','graphite','custom'];
const CVARS=['--bg','--line','--acc','--acc2','--h1','--h2','--accB','--accLight','--tot','--g1','--g2','--g3'];
function getCC(){try{return localStorage.getItem('cc')||'#0f766e'}catch(e){return'#0f766e'}}
function applyCustom(){const h=document.documentElement,st=h.style;CVARS.forEach(n=>st.removeProperty(n));if(h.getAttribute('data-pal')!=='custom')return;
 const hex=getCC(),r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let H=0;
 if(d){H=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;H=Math.round(H*60);if(H<0)H+=360}
 const L0=(mx+mn)/2,S0=d?d/(1-Math.abs(2*L0-1)):0,S=Math.max(35,Math.min(85,Math.round(S0*100))),H2=(H+35)%360,H3=(H+325)%360,dark=h.getAttribute('data-theme')==='dark',c=(a,s,l)=>'hsl('+a+' '+s+'% '+l+'%)',set=(n,v)=>st.setProperty(n,v);
 if(dark){set('--acc',c(H,S,58));set('--accB',c(H,S,58));set('--acc2',c(H2,S,42));set('--h1',c(H,S,30));set('--h2',c(H2,S,27));set('--accLight',c(H,40,24))}
 else{set('--bg',c(H,38,91));set('--line',c(H,25,80));set('--acc',c(H,S,32));set('--accB',c(H,S,32));set('--acc2',c(H2,S,40));set('--h1',c(H,S,32));set('--h2',c(H2,S,40));set('--accLight',c(H,42,87));set('--tot',c(H,32,89));set('--g1',c(H,80,78));set('--g2',c(H2,80,78));set('--g3',c(H3,70,80))}}
function metaTheme(){try{document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.documentElement).getPropertyValue('--h1').trim()||'#1f2328'}catch(e){}}
function swFade(){const h=document.documentElement;h.classList.add('tsw');clearTimeout(swFade.t);swFade.t=setTimeout(()=>h.classList.remove('tsw'),600)}
function setTheme(dark){swFade();document.documentElement.setAttribute('data-theme',dark?'dark':'light');try{localStorage.setItem('theme',dark?'dark':'light')}catch(e){}applyCustom();metaTheme()}
function setPal(p){if(!PALS.includes(p))p='mono';swFade();document.documentElement.setAttribute('data-pal',p);try{localStorage.setItem('pal',p)}catch(e){}applyCustom();document.querySelectorAll('#pals button,#palsCalm button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));$('pcLbl').classList.toggle('on',p==='custom');metaTheme()}
const animDef=()=>!(navigator.deviceMemory&&navigator.deviceMemory<=2);
function applyAnim(){const on=pget('anim',animDef());document.documentElement.classList.toggle('noanim',!on)}
/* لو الموبايل بيهنّج فعلاً مع الحركة (فريمات بتتأخر) ومحدش اختار يدوي: نوقفها مرة واحدة ونقول. وضع توفير البطارية (30 فريم ثابت) مش بيتحسب تهنيج */
function perfWatch(){try{if(localStorage.getItem('anim')!==null||document.documentElement.classList.contains('noanim'))return}catch(e){return}
  const probe=done=>{let n=0,t0=0,long=0,last=0;const step=t=>{if(document.hidden)return;if(!t0){t0=last=t}if(t-last>50)long++;last=t;n++;
    if(t-t0<2500)return requestAnimationFrame(step);done(n*1000/(t-t0)<24||long>=8)};requestAnimationFrame(step)};
  /* لازم قياسين ورا بعض يطلعوا تقال، عشان لحظة تقل عابرة (زي المزامنة أول ما يفتح) متوقفش الحركة */
  setTimeout(()=>probe(bad=>{if(bad)setTimeout(()=>probe(bad2=>{if(!bad2)return;pset('anim',false);applyAnim();$('animChk').checked=false}),3000)}),2000)}
function applyCalc(){const on=pget('calcOn',true);$('calcFab').classList.toggle('hide',!on);if(!on)$('calcModal').classList.add('hide')}
$('calcOn').checked=pget('calcOn',true);$('calcOn').onchange=()=>{pset('calcOn',$('calcOn').checked);applyCalc()};applyCalc();
try{if(localStorage.getItem('theme')==='dark'){$('themeChk').checked=true;setTheme(true)}}catch(e){}
$('themeChk').onchange=()=>setTheme($('themeChk').checked);
/* شكل 3D: اختيار مستقل عن اللون — بيتحفظ على الجهاز وشغّال مع أي لون */
{const ap=()=>document.documentElement.classList.toggle('d3',pget('d3',true));$('d3Chk').checked=pget('d3',true);$('d3Chk').onchange=()=>{pset('d3',$('d3Chk').checked);ap()};ap()}
(function(){let p='sage';try{p=localStorage.getItem('pal')||'sage'}catch(e){}setPal(p);
document.querySelectorAll('#pals button,#palsCalm button').forEach(b=>b.onclick=()=>setPal(b.dataset.p));$('palCustom').value=getCC();$('palCustom').oninput=()=>{try{localStorage.setItem('cc',$('palCustom').value)}catch(e){}setPal('custom')};
$('animChk').checked=pget('anim',animDef());$('animChk').onchange=()=>{pset('anim',$('animChk').checked);applyAnim()};applyAnim();perfWatch()})();
[['editInv','editInv'],['dupInv','dupInv'],['repLastOn','repLastOn'],['dayCl','dayCl'],['weekCl','weekCl'],['monCl','monCl'],['bulkRemChk','bulkRem'],['trashOn','trashOn'],['bkAl','bkAl'],['snapOn','snapOn'],['autoBk','autoBk'],['logoOn','logoOn'],['fancyInv','fancyInv'],['pdfOn','pdfOn'],['ceilSz','ceilSz'],['rndTot','rndTot'],['rndDn','rndDn'],['nfRem','nfRem'],['nfStk','nfStk'],['rcOn','rcOn'],['qtOn','qtOn'],['remDays','remDays'],['remOld','remOld'],['remBal','remBal']].forEach(([id,k])=>{$(id).checked=pget(k,true);$(id).onchange=()=>{pset(k,$(id).checked);applyFeatures();drawCusts();if(k==='ceilSz'||k==='rndTot'||k==='rndDn')calc()}});
/* متابعة الطلبيات: مفتوحة افتراضياً */
$('ordOn').checked=ordOn();$('ordOn').onchange=()=>{pset('ordOn',$('ordOn').checked);drawDash();calc()};
/* الإضافات ظاهرة دايماً: مقفولة افتراضياً لأنها مش في كل فاتورة */
{const xa=()=>{document.documentElement.classList.toggle('xalw',$('xAlw').checked);$('moreBtn').textContent=$('xAlw').checked?'➕ إضافات (مرتجع، ملاحظة)':'➕ إضافات (نولون، خصم، مرتجع، رد كاش، ملاحظة)'};
  $('xAlw').checked=pget('xAlw',false);xa();$('xAlw').onchange=()=>{pset('xAlw',$('xAlw').checked);xa()}}
const DEFPRE='تحويل محفظة=1\nتحويل انستا=0';
const pfPresets=()=>lsv('pfPre',DEFPRE).split('\n').map(l=>{const i=l.lastIndexOf('=');return i<0?null:{n:l.slice(0,i).trim(),p:nv(l.slice(i+1))}}).filter(x=>x&&x.n);
const preHtml=c=>'<button class="alt" data-cash="1">نقدي</button>'+pfPresets().map((x,i)=>`<button class="alt" data-pre="${i}">${esc(x.n)} ${fq(rateFor(c,x))}%</button>`).join('');
function applyFeatures(){cbStatus();document.body.classList.toggle('no-rc',!pget('rcOn',true));document.body.classList.toggle('no-qt',!pget('qtOn',true));$('saveImg').classList.toggle('hide',!pget('saveImgOn',false));$('pdfRow').classList.toggle('hide',!pget('pdfOn',true));$('paperBox').classList.toggle('hide',!pget('pdfOn',true));$('dayClose').classList.toggle('hide',!pget('dayCl',true));$('monRep').classList.toggle('hide',!pget('monCl',true));$('pfPre').innerHTML=preHtml();spRefresh();calc();bkBan();autoBan();drawDash()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoBan()});

/* رسائل الواتساب */
const svk=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}if(SET_S.has(k))setSoon()};
function loadMsgUI(){$('shopN').value=shopN();$('custW').value=custW();$('docW').value=docW();$('tplInv').value=tplOf('inv');$('tplPay').value=tplOf('pay');$('tplRem').value=tplOf('rem');$('remFirm').value=lsv('remfirm','30');$('remLong').value=lsv('remlong','90');$('remPay').value=lsv('rempay','');RTF.forEach(([id,k])=>{$(id).value=lsv('rt_'+k,'');$(id).placeholder=RT0[k]});$('tplRdy').value=tplOf('rdy')}
$('shopN').oninput=()=>svk('shop',$('shopN').value.trim());$('docW').oninput=()=>svk('docw',$('docW').value.trim());$('custW').oninput=()=>svk('custw',$('custW').value.trim());
[['tplInv','tpl_inv'],['tplPay','tpl_pay'],['tplRem','tpl_rem'],['tplRdy','tpl_rdy']].forEach(([i,k])=>$(i).oninput=()=>svk(k,$(i).value));
$('fzSel').value=lsv('fz','m')||'m';$('fzSel').onchange=()=>{const v=$('fzSel').value;svk('fz',v);document.documentElement.classList.remove('fz-x','fz-s','fz-l','fz-xl');if(v!=='m')document.documentElement.classList.add('fz-'+v);fixBar()};
$('paperSel').value=lsv('paper','a4');$('paperSel').onchange=()=>{svk('paper',$('paperSel').value);paperLabels()};
/* لوجو المحل */
const logoSrc=()=>lsv('logo','');
function loadLogo(){const u=logoSrc();const hl=$('hdrLogo');if(u){hl.src=u;hl.classList.remove('hide')}else{hl.removeAttribute('src');hl.classList.add('hide')}if(u)logoImg.src=u;else logoImg.removeAttribute('src');$('logoPrev').src=u||'';$('logoBox').classList.toggle('hide',!u)}
$('logoFile').onchange=e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;const rd=new FileReader();
  rd.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,420/im.naturalWidth,200/im.naturalHeight),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*k));c.height=Math.max(1,Math.round(im.naturalHeight*k));
      const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
      try{localStorage.setItem('logo',c.toDataURL('image/png'));$('logoMsg').textContent='تم حفظ اللوجو ✓'}catch(err){$('logoMsg').textContent='الصورة كبيرة، جرّب صورة أصغر'}loadLogo();setSoon();startUI()};
    im.onerror=()=>{$('logoMsg').textContent='الملف مش صورة صالحة'};im.src=rd.result};rd.readAsDataURL(fl)};
$('logoDel').onclick=e=>{if(!ok2(e.target))return;try{localStorage.removeItem('logo')}catch(e){}$('logoMsg').textContent='تم حذف اللوجو';loadLogo();setSoon()};

/* ===== البرنامج مفتوح في مكانين على نفس الجهاز: الأحدث يشتغل، والأقدم يحفظ اللي عنده ويقف ===== */
const INST=uid(),INST_AT=Date.now();let instBC=null;
function instInit(){return new Promise(res=>{let done=false,busy=false;const fin=()=>{if(!done){done=true;res()}};
  const post=m=>{m.id=INST;m.at=INST_AT;try{if(instBC)instBC.postMessage(m);else localStorage.setItem('instMsg',JSON.stringify({...m,n:Math.random()}))}catch(e){}};
  const on=d=>{if(!d||d.id===INST)return;
    if(d.t==='hello'&&!instOff&&(d.at>INST_AT||(d.at===INST_AT&&d.id>INST))){post({t:'busy',to:d.id});instStop().then(()=>post({t:'bye',to:d.id}))}
    else if(d.to===INST){if(d.t==='busy')busy=true;else if(d.t==='bye')fin()}};
  try{if('BroadcastChannel' in window){instBC=new BroadcastChannel('tabakha-inst');instBC.onmessage=e=>on(e.data)}}catch(e){instBC=null}
  if(!instBC)addEventListener('storage',e=>{if(e.key==='instMsg'&&e.newValue)try{on(JSON.parse(e.newValue))}catch(_){}});
  post({t:'hello'});setTimeout(()=>{if(!busy)fin()},150);setTimeout(fin,2500)})}
async function instStop(){if(instOff)return;try{flushTouch()}catch(e){}try{await flushIDB()}catch(e){}instOff=true;$('instOv').classList.add('on')}
$('instGo').onclick=()=>location.reload();
/* ===== مساحة التخزين ===== */
async function storStat(){let u=0,q=0;try{const e=await navigator.storage.estimate();u=e.usage||0;q=e.quota||0}catch(e){}return{u,q,ls:lsBytes(),lsCap:5*1024*1024}}
const mb=b=>b>=1073741824?(b/1073741824).toFixed(1)+' جيجا':(b/1048576).toFixed(b<10485760?1:0)+' ميجا';
const sbar=p=>`<div class="sbar"><i style="width:${Math.max(1,Math.min(100,p)).toFixed(1)}%;background:${p>=80?'var(--danger)':p>=60?'#f59e0b':'var(--acc)'}"></i></div>`;
async function storDraw(){const x=await storStat(),el=$('stMeter'),lsP=x.ls/x.lsCap*100,qP=x.q?x.u/x.q*100:0;
  el.innerHTML=(dataMode==='idb'?`<div class="smr"><span>📦 الفواتير والعملاء</span><b class="num">${mb(x.u)}${x.q?' من '+mb(x.q):''}</b></div>${x.q?sbar(qP):''}`:'<div class="info" style="color:var(--danger)">⚠ الفواتير لسه محفوظة في المكان القديم الصغير (5 ميجا)</div>')+
    `<div class="smr"><span>⚙️ الإعدادات واللوجو</span><b class="num">${mb(x.ls)} من 5 ميجا</b></div>${sbar(lsP)}
    <div class="mute" style="margin-top:4px">${plN(S.invoices.length,'معاملة')} · ${plN(S.customers.length,'عميل')} · ${plN(S.items.length,'صنف')}</div>`}
async function storCheck(){try{const x=await storStat(),top=Math.max(x.ls/x.lsCap,x.q?x.u/x.q:0,dataMode==='idb'?0:x.ls/x.lsCap),k=dkey(Date.now());
  if(top<0.8||lsv('storWarn','')===k)return;svk('storWarn',k);toast('⚠ مساحة الحفظ مستخدم منها '+Math.round(top*100)+'%','عرض',()=>{$('hdrSet').click();stGo('data')})}catch(e){}}
/* ========== الإعدادات: قايمة رئيسية وصفحة لكل قسم ========== */
let stCur='';
function stGo(k){stCur=k||'';$('stHome').classList.toggle('hide',!!stCur);document.querySelectorAll('#t-st .stp').forEach(p=>p.classList.toggle('hide',p.dataset.sp!==stCur));
  try{if(stCur==='des'&&window.invDesOpen)invDesOpen();else if(stCur==='msg'){loadMsgUI();msgPrev()}else if(stCur==='pay')pmDraw();else if(stCur==='notes')ntDraw();else if(stCur==='shop'){loadMsgUI();shopTxtLoad()}else if(stCur==='look')fzMark();else if(stCur==='rem')remUI();else if(stCur==='data')storDraw();else if(stCur==='exp')expOpen();else if(stCur==='sup')supOpen(null);else if(stCur==='stk')stkOpen();else if(stCur==='nf')nfUI();else if(!stCur)stSum()}catch(e){}
  window.scrollTo(0,0)}
function stSum(){const W_=(k,t)=>{const e=$('ss_'+k);if(e)e.textContent=t};$('ssIt').textContent=plN(S.items.length,'صنف');{const t=supTot();$('ssSup').textContent=plN(S.suppliers.length,'مورد')+(t>0?' · ليهم '+f(t):'')}{const m=stkAll(),n=stkLow(m);$('ssStk').textContent=m.size?plN(m.size,'صنف')+(n?' · '+(n>1?n+' قربوا يخلصوا':'واحد قرب يخلص'):''):'لسه فاضي'}let ps=[];try{ps=pfPresets()}catch(e){}
  W_('shop',shopN());W_('des',(pget('fancyInv',true)?'التصميم الملون':'تصميم بسيط')+' · '+PAPERS[paperKey()].n);
  const n=liveNotes().length;W_('notes',n?n+(n>1?' ملاحظات':' ملاحظة'):'مفيش ملاحظات');
  W_('inv',[pget('editInv',true)&&'تعديل',pget('dupInv',true)&&'تكرار',pget('pdfOn',true)&&'PDF وطباعة',pget('saveImgOn',false)&&'حفظ كصورة'].filter(Boolean).join(' · ')||'كل الخيارات مقفولة');
  W_('pay',ps.length?ps.map(x=>x.n+' '+fq(x.p)+'%').join(' · '):'مفيش طرق دفع');
  W_('msg','فاتورة · دفعة · تذكير'+($('autoWa').checked?' · إرسال تلقائي':''));
  W_('rem',pget('remOn',true)?'بعد '+dz(Math.round(+lsv('remDays','7'))||7)+' من غير دفع':'مقفول');
  W_('cl',[pget('dayCl',true)&&'يومي',pget('weekCl',true)&&'أسبوعي',pget('monCl',true)&&'تقرير شهري'].filter(Boolean).join(' · ')||'مقفول');
  {const[a,b]=monRange(Date.now()),t=exTot(exIn(a,b));W_('exp',t?f(t)+' الشهر ده':'مفيش الشهر ده')}
  W_('nf',nfState()==='on'?'شغالة':'مقفولة');
  W_('look',(document.documentElement.getAttribute('data-theme')==='dark'?'ليلي':'نهاري')+' · خط '+({x:'أصغر',s:'صغير',m:'وسط',l:'كبير',xl:'أكبر'}[lsv('fz','m')||'m']||'وسط'));
  W_('lock',lsv('lkOn','')==='1'?'مقفول برقم سري':'من غير قفل');
  W_('data',$('stor').textContent.replace(/^الحفظ:\s*/,'').replace(/\.$/,''))}
$('t-st').addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){document.querySelector('#bnav button[data-t="'+g.dataset.go+'"]').click();window.scrollTo(0,0);return}const b=e.target.closest('.sti,.stile[data-sp]');if(b){stGo(b.dataset.sp);return}if(e.target.closest('[data-stback]'))stGo('')});
/* ===== الربح ووضع العامل ===== */
const byTag=()=>{try{const n=localStorage.getItem('wkName');return n?{by:n}:{}}catch(e){return{}}};
const wkList=()=>{try{return JSON.parse(localStorage.getItem('wkList')||'[]')}catch(e){return[]}};
function hWa(r){if(wkOn())return'';const c=getC(r.cid),w=c&&waNum(c.phone);return w?`<a class="ab wa qa" target="_blank" rel="noopener" href="https://wa.me/${w}?text=${encodeURIComponent(remText(c))}"><i class="wai"></i></a>`:''}
function wkDraw(){const sel=localStorage.getItem('wkSel')||'';$('wkL').innerHTML=wkList().map(n=>`<span class="tag ${n===sel?'ok':''}" data-wn="${esc(n)}" style="cursor:pointer">👷 ${esc(n)}${n===sel?' ✓':''} <b data-wd="${esc(n)}" style="margin-inline-start:6px">×</b></span>`).join(' ')||'<span class="mute">مفيش عمال متسجلين. الاسم اختياري، بيتكتب على كل فاتورة.</span>'}
function wkOn(){try{return localStorage.getItem('wkMode')==='1'}catch(e){return false}}
function wkApply(){document.body.classList.toggle('wk',wkOn())}
function profitOf(recs){let pr=0,nk=0,has=0;recs.forEach(r=>{if(r.type!=='inv')return;let any=0;(r.rows||[]).forEach(x=>{if(x.k==null){nk=rd2(nk+(+x.v||0));return}any=1;pr=rd2(pr+(+x.v||0)-(+x.k||0))});if(any){has=1;pr=rd2(pr-(+r.disc||0))}});return{pr,nk,has}}
function pfLine(){const e=$('r_pf');if(!e)return;let pr=0,k=0,u=0;((TOT&&TOT.rows)||[]).forEach(o=>{if(o.k==null)u++;else{k++;pr+=(+o.v||0)-o.k}});
  if(!k||wkOn()){e.classList.add('hide');return}pr=rd2(pr-nv($('disc').value));e.textContent='📈 ربح الفاتورة: '+f(pr)+(u?' · '+u+' بند من غير سعر شراء':'');e.classList.remove('hide')}
function lateTag(c){let last=0,first=0;S.invoices.forEach(r=>{if(r.cid!==c.id)return;if(pd(r)>0&&r.ts>last)last=r.ts;if(!first||r.ts<first)first=r.ts});const t=last||first;if(!t)return'';const d=Math.floor((Date.now()-t)/864e5);
  return`<span class="tag ${d>=14?'dr':'ok'}" style="margin-inline-end:4px">${last?'آخر دفعة ':'أول فاتورة '}${d<1?'النهارده':'من '+d+' يوم'}</span>`}
[$('dbList'),$('hList')].forEach(b=>b.addEventListener('click',e=>{if(e.target.closest('a.qa'))e.stopPropagation()},true));
$('wkOut').onclick=async()=>{if(!lkReady()){localStorage.removeItem('wkMode');localStorage.removeItem('wkName');wkApply();drawDash();drawCusts();return}if(await askPin('🔓 اكتب الرقم السري للرجوع لوضع المالك')){localStorage.removeItem('wkMode');localStorage.removeItem('wkName');wkApply();drawItems();drawDash();drawCusts();calc();toast('رجعت لوضع المالك')}};
$('wkAdd').onclick=()=>{const v=$('wkNew').value.trim();if(!v)return;const l=wkList();if(!l.includes(v))l.push(v);localStorage.setItem('wkList',JSON.stringify(l));localStorage.setItem('wkSel',v);$('wkNew').value='';wkDraw()};
$('wkL').onclick=e=>{const d=e.target.dataset.wd;if(d){localStorage.setItem('wkList',JSON.stringify(wkList().filter(x=>x!==d)));if(localStorage.getItem('wkSel')===d)localStorage.removeItem('wkSel');wkDraw();return}const t=e.target.closest('[data-wn]');if(t){const n=t.dataset.wn;if(localStorage.getItem('wkSel')===n)localStorage.removeItem('wkSel');else localStorage.setItem('wkSel',n);wkDraw()}};wkDraw();
$('wkGo').onclick=()=>{const m=$('wkMsg');if(!lkReady()){m.textContent='فعّل «قفل البرنامج برقم سري» الأول، علشان العامل ما يقدرش يخرج من الوضع ده.';return}m.textContent='';localStorage.setItem('wkMode','1');{const s=localStorage.getItem('wkSel');if(s)localStorage.setItem('wkName',s);else localStorage.removeItem('wkName')}wkApply();drawItems();drawDash();drawCusts();stGo('');document.querySelector('#bnav button[data-t="new"]').click();toast('وضع العامل شغّال. للرجوع دوس 🔓 مالك فوق')};
$('phFix').onclick=()=>{let n=0;S.customers.forEach(c=>{const v=normPhones(c.phone);if(c.phone&&v&&v!==c.phone){c.phone=v;put('customers',c);n++}});$('phMsg').textContent=n?'اتوحّد رقم '+plN(n,'عميل')+'.':'كل الأرقام موحّدة بالفعل.';drawCusts()};
wkApply();
/* بحث الإعدادات: بيدوّر في كل الخيارات والشروحات ويفتح الصفحة ويظلل الخيار */
const arN=s=>String(s||'').toLowerCase().replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
const ST_SYN={exp:'مصروف مصاريف ايجار كهربا مرتبات صرف',sup:'مورد موردين شراء بضاعه فاتوره شراء',stk:'مخزون الواح كميه جرد',pay:'طرق الدفع محفظه فودافون انستا كاش نسبه عموله',msg:'واتساب رساله قالب نص',rem:'تذكير متاخر مديونين ديون ميعاد',cl:'اقفال تقرير يومي شهري ربح صافي',nf:'اشعار تنبيه',look:'شكل لون ليلي خط حجم',lock:'قفل رقم سري بصمه امان حذف تعديل',data:'نسخه احتياطي حفظ استيراد تصدير فايربيس سحابي مزامنه حساب',shop:'اسم المحل لوجو لقب عنوان',des:'تصميم الفاتوره الوان خط ختم علامه مائيه',notes:'ملاحظات الفاتوره',inv:'خيارات الفاتوره طباعه pdf تقريب تعديل تكرار طلبيات'};
let stIdx=null;
function stBuild(){stIdx=[];document.querySelectorAll('#t-st .stp').forEach(p=>{const pg=p.dataset.sp,pt=((p.querySelector('.sth b')||{}).textContent||'').trim();stIdx.push({pg,pt,t:pt,k:arN(pt+' '+(ST_SYN[pg]||'')),e:null});
  p.querySelectorAll('label.opt,.card>b,.card>label,summary,.card>.mute').forEach(e=>{const t=e.textContent.replace(/\s+/g,' ').trim();if(t.length>1&&t.length<150)stIdx.push({pg,pt,t,k:arN(t+' '+pt),e})})})}
function stFind(q){const w=arN(q).split(/\s+/).filter(Boolean);if(!w.length)return[];if(!stIdx)stBuild();const seen=new Set(),out=[];
  for(const r of stIdx){if(w.every(x=>r.k.includes(x))){const k=r.pg+'|'+r.t;if(!seen.has(k)){seen.add(k);out.push(r)}}if(out.length>=12)break}return out}
$('stSrch').oninput=()=>{const q=$('stSrch').value.trim(),box=$('stRes');if(!q){box.classList.add('hide');$('stMain').classList.remove('hide');return}
  const r=stFind(q);$('stMain').classList.add('hide');box.classList.remove('hide');window.stHits=r;
  box.innerHTML=r.length?r.map((x,i)=>`<button type="button" class="sti" data-rs="${i}"><span class="si">🔎</span><span class="stt"><b>${esc(x.t)}</b><small>${x.e?esc(x.pt):'صفحة كاملة'}</small></span><span class="sa">‹</span></button>`).join(''):'<div class="mute" style="padding:10px">مفيش إعداد بالاسم ده. جرّب كلمة تانية.</div>'};
$('stRes').onclick=e=>{const b=e.target.closest('[data-rs]');if(!b)return;const r=window.stHits[+b.dataset.rs];$('stSrch').value='';$('stRes').classList.add('hide');$('stMain').classList.remove('hide');stGo(r.pg);
  if(r.e)setTimeout(()=>{let d=r.e.closest('details');while(d){d.open=true;d=d.parentElement&&d.parentElement.closest('details')}r.e.scrollIntoView({block:'center'});r.e.classList.add('stflash');setTimeout(()=>r.e.classList.remove('stflash'),2200)},80)};
/* بيانات المحل: السطور الثابتة */
function shopTxtLoad(){const d=invd();$('stTop').value=d.topText||'';$('stHead').value=d.headText||'';$('stFoot').value=d.footText||''}
['stTop','stHead','stFoot'].forEach(id=>$(id).oninput=()=>{try{localStorage.setItem('shopTxt',JSON.stringify({top:$('stTop').value,head:$('stHead').value,foot:$('stFoot').value}))}catch(e){}setSoon()});
/* ملاحظات الفاتورة: أكتر من ملاحظة وكل واحدة بلونها (بتتحفظ مع كل فاتورة جديدة) */
function getNotes(){let l=null;try{l=JSON.parse(localStorage.getItem('invNotes')||'null')}catch(e){}
  if(!Array.isArray(l)){l=[];const g=lsv('gnote','').trim();if(g)l.push({t:g,c:'',b:0});let st=null;try{st=JSON.parse(localStorage.getItem('invdesign')||'null')}catch(e){}
    if(st&&String(st.redNote||'').trim())l.push({t:String(st.redNote).trim(),c:st.redColor||'#c0261b',b:1});try{localStorage.setItem('invNotes',JSON.stringify(l))}catch(e){}}
  return l.filter(n=>n&&typeof n==='object')}
function liveNotes(){return getNotes().filter(n=>String(n.t||'').trim()).map(n=>({t:String(n.t).trim(),c:n.c||'',b:n.b?1:0}))}
function noteSnap(){const l=liveNotes();return{gnote:l.map(n=>n.t).join('\n'),gn:l}}
const ntSave=l=>{try{localStorage.setItem('invNotes',JSON.stringify(l))}catch(e){}};
const NCOL=['','#c0261b','#15803d','#1d4ed8','#b08d3c','#c2410c'];
function ntDraw(){const l=getNotes(),ink=invd().ink||'#14233a';
  $('ntList').innerHTML=l.map((n,i)=>{const col=n.c||'',cust=!!col&&!NCOL.includes(col);return`<div class="ntr" data-i="${i}"><textarea data-nt="t" rows="2" placeholder="اكتب الملاحظة" style="color:${col||'var(--ink)'};font-weight:${n.b?700:400}">${esc(n.t||'')}</textarea>
    <div class="ntc">${NCOL.map(c=>`<button type="button" class="dot${c===col?' on':''}" data-nc="${c}" style="background:${c||ink}" aria-label="${c?'لون':'لون الكتابة العادي'}"></button>`).join('')}<label class="ncust${cust?' on':''}" title="لون تاني"><input type="color" data-nt="c" value="${col||'#14233a'}" aria-label="لون تاني"></label>
    <button type="button" class="alt nb${n.b?' on':''}" data-nbold="1" aria-label="خط عريض">B</button><span class="sp"></span>
    <button type="button" class="alt" data-nm="-1"${i?'':' disabled'} aria-label="لفوق">▲</button><button type="button" class="alt" data-nm="1"${i<l.length-1?'':' disabled'} aria-label="لتحت">▼</button><button type="button" class="del" data-nx="1" aria-label="حذف">×</button></div></div>`}).join('')||'<p class="mute" style="margin-top:8px">مفيش ملاحظات. اضغط (+ ملاحظة جديدة).</p>';
  ntPrev()}
let ntT=0;const ntPrevSoon=()=>{clearTimeout(ntT);ntT=setTimeout(ntPrev,300)};
function ntPrev(){const box=$('ntPrevBox');const keep=lastSpec;try{const cv=sheet({fancy:pget('fancyInv',true),paper:'a4',name:'محمد علي',date:stamp(Date.now()),sub:'كود 1001 · '+(docW()?docW()+' ':'')+'رقم 1',
    tables:[{th:['البيان','العدد','السعر','القيمة'],w:[.46,.14,.2,.2],rows:[['صنف تجريبي','2','300','600']],col:[0],red:[0]}],sum:[['الإجمالي','600',1],['المدفوع','600'],['المتبقي','0',1]],gn:liveNotes()});
    cv.style.cssText='width:100%;display:block;border-radius:6px';box.innerHTML='';box.appendChild(cv);box.scrollTop=box.scrollHeight}catch(e){}lastSpec=keep}
$('ntList').addEventListener('input',e=>{const r=e.target.closest('.ntr');if(!r)return;const l=getNotes(),i=+r.dataset.i,t=e.target;if(!l[i])return;
  if(t.dataset.nt==='t')l[i].t=t.value;else if(t.dataset.nt==='c'){l[i].c=t.value;r.querySelector('textarea').style.color=t.value}else return;ntSave(l);ntPrevSoon()});
$('ntList').addEventListener('change',e=>{if(e.target.dataset.nt==='c')ntDraw()});
$('ntList').addEventListener('click',e=>{const r=e.target.closest('.ntr'),b=e.target.closest('button');if(!r||!b)return;const l=getNotes(),i=+r.dataset.i;if(!l[i])return;
  if(b.dataset.nc!==undefined)l[i].c=b.dataset.nc;
  else if(b.dataset.nbold)l[i].b=l[i].b?0:1;
  else if(b.dataset.nm){const j=i+(+b.dataset.nm);if(j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]]}
  else if(b.dataset.nx){if(String(l[i].t||'').trim()&&!ok2(b))return;l.splice(i,1)}
  else return;ntSave(l);ntDraw()});
$('ntAdd').onclick=()=>{const l=getNotes();l.push({t:'',c:'',b:0});ntSave(l);ntDraw();const ts=$('ntList').querySelectorAll('textarea');if(ts.length)ts[ts.length-1].focus()};
/* طرق الدفع: قايمة اسم + نسبة بدل كتابة سطور */
const pmRow=(n,p)=>`<div class="pmr"><input data-pm="n" value="${esc(n)}" placeholder="اسم الطريقة (مثال: فودافون كاش)"><span class="pin"><input data-pm="p" type="text" inputmode="decimal" value="${esc(p)}" aria-label="نسبة الخصم"><span>%</span></span><button type="button" class="del" data-pmx="1" aria-label="حذف">×</button></div>`;
function pmDraw(){let ps=[];try{ps=pfPresets()}catch(e){}$('pmList').innerHTML=ps.map(x=>pmRow(x.n,String(x.p))).join('')||'<p class="mute" style="margin-top:8px">مفيش طرق دفع.</p>';pmCust()}
function pmSave(){const l=[...document.querySelectorAll('#pmList .pmr')].map(r=>{const n=r.querySelector('[data-pm=n]').value.replace(/[=\n]/g,' ').trim(),p=Math.min(100,Math.max(0,nv(r.querySelector('[data-pm=p]').value)));return n?n+'='+p:''}).filter(Boolean);
  svk('pfPre',l.join('\n'));$('pfPre').innerHTML=preHtml();spRefresh();calc()}
$('pmList').addEventListener('input',pmSave);
$('pmList').addEventListener('click',e=>{const b=e.target.closest('[data-pmx]');if(!b)return;const r=b.closest('.pmr');if(r.querySelector('[data-pm=n]').value.trim()&&!ok2(b))return;r.remove();pmSave();if(!$('pmList').querySelector('.pmr'))pmDraw()});
$('pmAdd').onclick=()=>{const p=$('pmList').querySelector('p');if(p)p.remove();$('pmList').insertAdjacentHTML('beforeend',pmRow('','0'));const ins=$('pmList').querySelectorAll('[data-pm=n]');ins[ins.length-1].focus()};
function pmCust(){const l=S.customers.filter(c=>c.pfr&&Object.keys(c.pfr).length).sort((a,b)=>a.name.localeCompare(b.name,'ar'));
  $('pmCust').innerHTML=l.map(c=>Object.entries(c.pfr).map(([n,p])=>`<div class="pmc"><span><b>${esc(c.name)}</b> <span class="mute">${esc(n)}</span></span><span style="display:flex;align-items:center;gap:6px"><b class="num">${fq(p)}%</b><button type="button" class="del" data-pcx="${c.id}" data-pcn="${esc(n)}" aria-label="مسح">×</button></span></div>`).join('')).join('')||'<p class="mute" style="margin-top:6px">لسه مفيش. أول ما تسجل دفعة لعميل بنسبة غير العامة هتظهر هنا.</p>'}
$('pmCust').addEventListener('click',e=>{const b=e.target.closest('[data-pcx]');if(!b)return;const c=getC(b.dataset.pcx);if(!c||!c.pfr)return;const m={...c.pfr};delete m[b.dataset.pcn];c.pfr=m;put('customers',c);pmCust();calc()});
/* رسايل الواتساب: زراير بتحط البيانات في الرسالة + معاينة زي الواتساب */
const VARS={tplInv:[['العميل','اسم العميل'],['اللقب','اللقب'],['المحل','اسم المحل'],['الفاتورة','رقم الفاتورة'],['الكود','الكود'],['التاريخ','التاريخ'],['الإجمالي','الإجمالي'],['المدفوع','المدفوع'],['المتبقي','المتبقي'],['الخصم','الخصم'],['سبب_الخصم','سبب الخصم'],['طريقة_الدفع','طريقة الدفع'],['عمولة_الدفع','عمولة الدفع']],
  tplPay:[['العميل','اسم العميل'],['اللقب','اللقب'],['المحل','اسم المحل'],['الكود','الكود'],['المبلغ','مبلغ الدفعة'],['الحساب','الحساب بعد الدفعة'],['التاريخ','التاريخ'],['طريقة_الدفع','طريقة الدفع'],['عمولة_الدفع','عمولة الدفع']],
  tplRem:[['العميل','اسم العميل'],['اللقب','اللقب'],['المحل','اسم المحل'],['الحساب','الحساب'],['مدة_الدين','مدة عدم الدفع'],['أقدم_فاتورة','أقدم فاتورة متأخرة'],['رصيد_سابق','رصيد سابق'],['بيانات_الدفع','بيانات الدفع'],['ختام_السداد','ختام السداد (يتحزّم بعد مدة)']],
  tplRdy:[['العميل','اسم العميل'],['اللقب','اللقب'],['المحل','اسم المحل'],['الكود','كود الفاتورة'],['الحساب','الحساب (لو عليه)']]};
document.querySelectorAll('.vch').forEach(d=>{d.innerHTML=VARS[d.dataset.for].map(([k,l])=>`<button type="button" data-v="${k}">+ ${l}</button>`).join('');
  d.addEventListener('mousedown',e=>{if(e.target.closest('[data-v]'))e.preventDefault()});
  d.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b)return;const t=$(d.dataset.for),a=t.selectionStart==null?t.value.length:t.selectionStart,z=t.selectionEnd==null?a:t.selectionEnd,ins='{'+b.dataset.v+'}';
    t.value=t.value.slice(0,a)+ins+t.value.slice(z);t.focus();try{t.setSelectionRange(a+ins.length,a+ins.length)}catch(_){}t.dispatchEvent(new Event('input'))})});
function msgPrev(){const now=Date.now();
  $('pvInv').textContent=txtOf({type:'inv',cname:'محمد علي',ts:now,code:1024,no:7,total:1569,paid:500,rest:1069,pfv:0,pfWhy:'فودافون كاش',disc:40,discWhy:'عميل قديم'});
  $('pvPay').textContent=txtOf({type:'pay',cname:'محمد علي',ts:now,code:1025,amount:1000,rest:569,pfv:0,pfWhy:'فودافون كاش'});
  $('pvRem').textContent=remMake({'العميل':'محمد علي','المحل':shopN(),'الحساب':f(1250),'مدة_الدين':rtf(rt('paid'),{'عدد':dayW(12)}),'أقدم_فاتورة':rtf(rt('old'),{'التاريخ':'12/10','المتبقي':'400'}),'رصيد_سابق':rtf(rt('bal'),{'المبلغ':'500'}),'بيانات_الدفع':remPayTxt()},$('remPvT').value||'soft');
  $('pvRdy').textContent=fillTpl('rdy',{'العميل':'محمد علي','المحل':shopN(),'الكود':'1024','الحساب':'حسابك: '+f(1069)+' جنيه'})}
['tplInv','tplPay','tplRem','tplRdy','shopN','custW','docW'].forEach(id=>$(id).addEventListener('input',msgPrev));
const RTF=[['rtSoft','soft'],['rtFirm','firm'],['rtLong','long'],['rtPaid','paid'],['rtNever','never'],['rtOld','old'],['rtBal','bal'],['rtPay','pay']];
RTF.forEach(([id,k])=>{$(id).oninput=()=>{svk('rt_'+k,$(id).value);msgPrev()}});$('rtReset').onclick=()=>{RTF.forEach(([id,k])=>{svk('rt_'+k,'');$(id).value=''});msgPrev()};$('remPvT').onchange=msgPrev;$('remLong').oninput=()=>svk('remlong',$('remLong').value.trim());$('remFirm').oninput=()=>svk('remfirm',$('remFirm').value.trim());$('remPay').oninput=()=>{svk('rempay',$('remPay').value);msgPrev()};['remDays','remOld','remBal'].forEach(id=>$(id).addEventListener('change',msgPrev));
/* حجم الخط: زراير بدل القايمة */
function fzMark(){const v=$('fzSel').value;document.querySelectorAll('#fzSeg button').forEach(b=>b.classList.toggle('on',b.dataset.z===v))}
$('saveImgOn').checked=pget('saveImgOn',false);$('saveImgOn').onchange=()=>{pset('saveImgOn',$('saveImgOn').checked);applyFeatures()};
$('fzSeg').onclick=e=>{const b=e.target.closest('[data-z]');if(!b)return;$('fzSel').value=b.dataset.z;$('fzSel').onchange();fzMark()};fzMark();
$('stClOpen').onclick=()=>{drawCl();$('clOv').classList.remove('hide')};

$('tplReset').onclick=e=>{if(!ok2(e.target))return;try{['tpl_inv','tpl_pay','tpl_rem','tpl_rdy'].forEach(k=>localStorage.removeItem(k))}catch(e){}loadMsgUI();msgPrev()};

/* سلة المحذوفات */
const trashList=()=>{const l=lget('trash'),k=l.filter(x=>x.delAt>Date.now()-30*864e5);if(k.length!==l.length)lset('trash',k);return k};
function trashPut(r){if(!r||!pget('trashOn',true))return;const l=trashList();l.push({...r,delAt:Date.now()});lset('trash',l)}
function drawTrash(){const l=trashList().sort((a,b)=>b.delAt-a.delAt);$('trCnt').textContent=l.length?'('+l.length+')':'';
  $('trList').innerHTML=l.map(r=>`<div class="rec"><div class="ro" style="color:var(--ink)"><b>${esc(r.cname)}</b><span>${(r.type==='pay'?'دفعة'+(r.code?' '+r.code:''):'فاتورة '+(r.code||'#'+r.no))+(hasRet(r)&&r.rcode?' ↩'+r.rcode:'')}</span></div><div class="mute num">${stamp(r.ts)} · ${f(r.type==='pay'?r.amount:r.total)}</div><div class="btns"><button class="main b-green" data-tr="${r.id}">استرجاع</button><button class="alt b-red" data-trx="${r.id}">حذف نهائي</button></div></div>`).join('')||'<p class="mute">السلة فاضية.</p>'}
$('trList').onclick=e=>{const d=e.target.dataset,l=trashList(),m=$('trMsg');m.textContent='';
  if(d.tr){const r=l.find(x=>x.id===d.tr);if(!r)return;if(!getC(r.cid)){m.textContent='عميل الفاتورة دي اتحذف، مينفعش ترجعيها';return}
    const o={...r};delete o.delAt;lset('pdel',lget('pdel').filter(x=>!(x.k==='invoices'&&x.id===o.id)));
    S.invoices.push(o);put('invoices',o);reflow(o.cid);syncNames();lset('trash',l.filter(x=>x.id!==o.id));drawTrash();drawDash();drawCusts();m.textContent='تم استرجاع الفاتورة ✓'}
  else if(d.trx){if(!ok2(e.target))return;lset('trash',l.filter(x=>x.id!==d.trx));drawTrash()}};

/* المصروفات: {id,ts,amt,cat,note}، بتتزامن وتتنسخ زي الفواتير */
function monRange(ts){const d=new Date(ts);return[new Date(d.getFullYear(),d.getMonth(),1).getTime(),new Date(d.getFullYear(),d.getMonth()+1,1).getTime()]}
function exIn(a,b){return S.expenses.filter(x=>x.ts>=a&&x.ts<b)}
function exTot(l){return rd2(l.reduce((s,x)=>s+(+x.amt||0),0))}
function exMonTs(){const m=/^(\d{4})-(\d{2})$/.exec($('exMon').value);return m?new Date(+m[1],+m[2]-1,1).getTime():Date.now()}
function puIn(a,b){const l=S.purchases.filter(x=>x.ts>=a&&x.ts<b);return{n:l.length,buy:exTot(l.filter(x=>x.type!=='pay')),pay:exTot(l.filter(x=>x.type==='pay'))}}
function drawExp(){const[a,b]=monRange(exMonTs()),l=exIn(a,b).sort((x,y)=>y.ts-x.ts),inv=S.invoices.filter(r=>r.ts>=a&&r.ts<b),s=inv.reduce((x,r)=>x+val(r),0),p=inv.reduce((x,r)=>x+pd(r),0),t=exTot(l),pu=puIn(a,b),PF=profitOf(inv);
  const ln=(n,v,bold)=>`<div class="ro" style="color:var(--ink)"><span>${n}</span>${bold?'<b':'<span'} class="num">${f(v)}${bold?'</b>':'</span>'}</div>`;
  $('exSum').innerHTML=ln('المبيعات',s)+ln('المصروفات',t)+(pu.n?ln('مشتريات الموردين',pu.buy):'')+ln('صافي الشهر (المبيعات − المصروفات)',s-t-pu.buy,1)+ln('الكاش بعد المصروفات',p-t-pu.pay)+(PF.has?ln('ربح الأصناف',PF.pr)+ln('صافي الربح بعد المصروفات',rd2(PF.pr-t),1)+(PF.nk?`<div class="mute" style="font-size:12px">مبيعات بقيمة ${f(PF.nk)} ملهاش سعر شراء.</div>`:''):'');
  $('exRep').classList.toggle('hide',!l.length&&!inv.length&&!pu.n);
  $('exList').innerHTML=l.map(x=>`<div class="rec"><div class="ro" style="color:var(--ink)"><b>${esc(x.cat)}</b><b class="num">${f(x.amt)}</b></div><div class="mute num">${dshort(x.ts)}${x.note?' · '+esc(x.note):''}</div><div class="btns"><button class="alt b-red" data-exd="${esc(x.id)}">حذف</button></div></div>`).join('')||'<p class="mute">مفيش مصروفات في الشهر ده.</p>'}
/* v250: مصروفات ثابتة {id,name,amt,per:'w'|'m',day,from,last} — بتتحفظ في الإعدادات (exfix) وبتتزامن. كل ميعاد بيتسجل مصروف عادي برقم ثابت fx<id>_<يوم> عشان ما يتكررش بين الأجهزة */
const EXWD=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
function exfLoad(){try{const l=JSON.parse(lsv('exfix','[]'));return Array.isArray(l)?l.filter(t=>t&&t.id&&t.amt>0):[]}catch(e){return[]}}
const exfSave=l=>svk('exfix',JSON.stringify(l));
const exfLab=t=>t.per==='d'?'كل يوم':t.per==='w'?'كل '+EXWD[t.day]:'يوم '+t.day+' كل شهر';
/* بترجع المصروفات المستحقة من آخر مرة لحد النهارده، وبتحدّث last في نفس القايمة. مفيش تسجيل بأثر رجعي قبل تاريخ الإضافة */
function exfDue(list,now){const out=[],t0=new Date(now);t0.setHours(0,0,0,0);const end=t0.getTime();let ch=false;
  list.forEach(t=>{const d=new Date(t.last?t.last:t.from);d.setHours(0,0,0,0);if(t.last)d.setDate(d.getDate()+1);let n=0;
    while(d.getTime()<=end&&n++<800){const dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
      if(t.per==='d'||(t.per==='w'?d.getDay()===t.day:d.getDate()===Math.min(t.day,dim)))out.push({id:'fx'+t.id+'_'+dayKey(d.getTime()),ts:new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTime(),amt:t.amt,cat:t.name,note:'ثابت · '+(t.per==='d'?'يومي':t.per==='w'?'أسبوعي':'شهري'),fx:t.id});
      d.setDate(d.getDate()+1)}
    if(t.last!==end){t.last=end;ch=true}});return{out,ch}}
function exfRun(){if(!dataReady)return 0;const l=exfLoad();if(!l.length)return 0;const r=exfDue(l,Date.now());let n=0;r.out.forEach(o=>{if(!S.expenses.some(x=>x.id===o.id)){S.expenses.push(o);put('expenses',o);n++}});if(r.ch)exfSave(l);return n}
function drawExf(list){const l=list||exfLoad(),mo=rd2(l.reduce((s,t)=>s+(t.per==='d'?t.amt*365/12:t.per==='w'?t.amt*52/12:t.amt),0));
  $('exfList').innerHTML=l.map(t=>'<div class="ro" style="color:var(--ink);gap:6px"><span style="flex:1;min-width:0">'+esc(t.name)+' <small class="mute">· '+exfLab(t)+'</small></span><b class="num">'+f(t.amt)+'</b><button class="del" data-exfd="'+esc(t.id)+'" aria-label="حذف '+esc(t.name)+'">×</button></div>').join('')+(l.length?'<div class="mute" style="font-size:12px">الثابت في الشهر تقريبًا '+f(Math.round(mo))+'</div>':'<div class="mute">مفيش. ضيف القبض الأسبوعي أو الإيجار الشهري من تحت.</div>')}
function exfDays(){const w=$('exfPer').value==='w',s=$('exfDay');s.classList.toggle('hide',$('exfPer').value==='d');s.innerHTML=w?EXWD.map((n,i)=>'<option value="'+i+'"'+(i===4?' selected':'')+'>يوم '+n+'</option>').join(''):Array.from({length:28},(_,i)=>'<option value="'+(i+1)+'">يوم '+(i+1)+' في الشهر</option>').join('')}
$('exfPer').onchange=exfDays;exfDays();
$('exfAdd').onclick=()=>{const name=$('exfName').value.trim(),amt=rd2(nv($('exfAmt').value)),m=$('exfMsg');if(!name){m.textContent='اكتب اسم المصروف';return}if(!(amt>0)){m.textContent='اكتب المبلغ';return}
  const l=exfLoad(),t0=new Date();t0.setHours(0,0,0,0);l.push({id:uid(),name,amt,per:$('exfPer').value,day:$('exfPer').value==='d'?0:+$('exfDay').value,from:t0.getTime(),last:0});exfSave(l);$('exfName').value='';$('exfAmt').value='';const n=exfRun();drawExf();drawExp();m.textContent=n?'اتضاف، واتسجل مصروف النهارده ✓':'اتضاف ✓ هيتسجل لوحده في ميعاده'};
$('exfList').onclick=e=>{const b=e.target.closest('[data-exfd]');if(!b||!ok2(b))return;const l=exfLoad(),t=l.find(x=>x.id===b.dataset.exfd);exfSave(l.filter(x=>x.id!==b.dataset.exfd));drawExf();if(t)toast('اتشال «'+t.name+'» من الثابت. اللي اتسجل قبل كده فاضل','تراجع',()=>{const k=exfLoad();k.push(t);exfSave(k);drawExf()})};
function expOpen(){exfRun();drawExf();const k=dayKey(Date.now());if(!$('exDate').value)$('exDate').value=k;if(!$('exMon').value)$('exMon').value=k.slice(0,7);$('exMsg').textContent='';drawExp()}
$('exMon').onchange=drawExp;
$('exRep').onclick=()=>showMonth(exMonTs());
$('exAdd').onclick=()=>{const amt=rd2(nv($('exAmt').value)),m=$('exMsg'),dv=$('exDate').value,dm=/^(\d{4})-(\d{2})-(\d{2})$/.exec(dv);if(!(amt>0)){m.textContent='اكتب المبلغ';return}if(!dm){m.textContent='اختار التاريخ';return}
  const o={id:uid(),ts:dv===dayKey(Date.now())?Date.now():new Date(+dm[1],+dm[2]-1,+dm[3],12).getTime(),amt,cat:$('exCat').value,note:$('exNote').value.trim()};
  S.expenses.push(o);put('expenses',o);$('exAmt').value='';$('exNote').value='';$('exMon').value=dv.slice(0,7);drawExp();m.textContent='اتسجل ✓'};
$('exList').onclick=e=>{const b=e.target.closest('[data-exd]');if(!b||!ok2(b))return;const id=b.dataset.exd,x=S.expenses.find(y=>y.id===id);del('expenses',id);drawExp();if(x)toast('اتمسح المصروف','تراجع',()=>{undel('expenses',x);drawExp()})};

/* الموردين: S.suppliers {id,name} · S.purchases {id,sid,ts,type:'buy'|'pay',amt,note}. الرصيد = اللي عليك للمورد */
let supCur=null;
function supBal(s){return rd2(S.purchases.filter(x=>x.sid===s.id).reduce((a,x)=>a+(x.type==='pay'?-1:1)*(+x.amt||0),0))}
function supTot(){return rd2(S.suppliers.reduce((a,s)=>a+supBal(s),0))}
function supOpen(id){supCur=id;$('supHome').classList.toggle('hide',!!id);$('supOne').classList.toggle('hide',!id);$('supMsg').textContent='';$('spMsg').textContent='';if(!$('spDate').value)$('spDate').value=dayKey(Date.now());drawSup();window.scrollTo(0,0)}
function drawSup(){const s=S.suppliers.find(x=>x.id===supCur);
  if(!s){if(supCur){supOpen(null);return}$('supTot').textContent=f(supTot());
    $('supList').innerHTML=S.suppliers.length?'<tr><th>#</th><th>المورد</th><th>عليك</th></tr>'+S.suppliers.slice().sort((a,b)=>supBal(b)-supBal(a)||a.name.localeCompare(b.name,'ar')).map((x,i)=>`<tr data-sup="${esc(x.id)}"><td class="num">${i+1}</td><td class="tn">${esc(x.name)}</td><td class="num"><b>${f(supBal(x))}</b></td></tr>`).join(''):'<tr><td class="tn mute">لسه مفيش موردين. اكتب اسم مورد فوق.</td></tr>';return}
  $('supNm').textContent=s.name;$('supB').textContent=f(supBal(s));let run=0;
  const l=S.purchases.filter(x=>x.sid===s.id).sort((a,b)=>a.ts-b.ts).map(x=>{const v=+x.amt||0,pay=x.type==='pay';run=rd2(run+(pay?-v:v));return`<tr><td class="num">${dshort(x.ts).slice(5)}</td><td class="tn">${esc(x.note||(pay?'دفعة':'شراء'))}</td><td class="num">${pay?'':f(v)}</td><td class="num">${pay?f(v):''}</td><td class="num"><b>${f(run)}</b></td><td><button type="button" class="xd" data-spd="${esc(x.id)}" aria-label="حذف">×</button></td></tr>`}).reverse().join('');
  $('spList').innerHTML=l?'<tr><th>التاريخ</th><th>البيان</th><th>شراء</th><th>دفع</th><th>الرصيد</th><th></th></tr>'+l:'<tr><td class="tn mute">لسه مفيش حركات للمورد ده.</td></tr>'}
$('supAdd').onclick=()=>{const n=$('supName').value.trim().replace(/\s+/g,' '),m=$('supMsg');if(!n){m.textContent='اكتب اسم المورد';return}if(S.suppliers.some(x=>nkey(x.name)===nkey(n))){m.textContent='المورد ده موجود';return}
  const o={id:uid(),name:n};S.suppliers.push(o);put('suppliers',o);$('supName').value='';m.textContent='';drawSup()};
$('supList').onclick=e=>{const r=e.target.closest('[data-sup]');if(r)supOpen(r.dataset.sup)};
$('supBack').onclick=()=>supOpen(null);
$('spAdd').onclick=()=>{const amt=rd2(nv($('spAmt').value)),m=$('spMsg'),dv=$('spDate').value,dm=/^(\d{4})-(\d{2})-(\d{2})$/.exec(dv);if(!(amt>0)){m.textContent='اكتب المبلغ';return}if(!dm){m.textContent='اختار التاريخ';return}
  const o={id:uid(),sid:supCur,ts:dv===dayKey(Date.now())?Date.now():new Date(+dm[1],+dm[2]-1,+dm[3],12).getTime(),type:$('spType').value,amt,note:$('spNote').value.trim()};
  S.purchases.push(o);put('purchases',o);$('spAmt').value='';$('spNote').value='';drawSup();m.textContent='اتسجل ✓'};
$('spList').onclick=e=>{const b=e.target.closest('[data-spd]');if(!b||!ok2(b))return;const id=b.dataset.spd,x=S.purchases.find(y=>y.id===id);del('purchases',id);drawSup();if(x)toast('اتمسحت الحركة','تراجع',()=>{undel('purchases',x);drawSup()})};
$('supDel').onclick=e=>{const m=$('spMsg');if(S.purchases.some(x=>x.sid===supCur)){m.textContent='احذف حركات المورد الأول';return}if(!ok2(e.target))return;const s=S.suppliers.find(x=>x.id===supCur);del('suppliers',supCur);supOpen(null);if(s)toast('اتمسح المورد: '+s.name,'تراجع',()=>{undel('suppliers',s);drawSup()})};

/* المخزون بعدد الألواح: S.stock {id,iid,ts,q}، q موجب وارد وسالب صرف.
   الصنف الجاهز بيتخصم لوحده من الفواتير من أول حركة ليه، والمقطع بيتصرف بإيدك لأن عدد القطع مش عدد ألواح */
function stkAll(){const m=new Map();S.stock.forEach(x=>{if(!S.items.some(i=>i.id===x.iid))return;const o=m.get(x.iid)||{from:x.ts,bal:0};o.from=Math.min(o.from,x.ts);o.bal=rd2(o.bal+(+x.q||0));m.set(x.iid,o)});
  const rd=new Set(S.items.filter(i=>i.type==='rd').map(i=>i.id));S.invoices.forEach(r=>{if(r.type==='pay')return;(r.rows||[]).forEach(x=>{const o=rd.has(x.i)&&m.get(x.i);if(o&&r.ts>=o.from)o.bal=rd2(o.bal-(x.rt?-1:1)*(+x.c||0))})});return m}
function stkMin(){return Math.max(0,nv(lsv('stkMin','3')))}
function stkLow(m){const n=stkMin();return[...m.values()].filter(o=>o.bal<=n).length}
function stkOpen(){$('stkLim').value=lsv('stkMin','3');$('stkMsg').textContent='';drawStk()}
/* شاشة المخزون: لكل صنف «عندك كام» وزرارين دخل/طلع بالكلام، وتحت آخر الحركات ومعاها البيع من الفواتير */
const stkUnit=i=>i.type==='rd'?'':' لوح';
function stkSales(m){const rd=new Set(S.items.filter(i=>i.type==='rd').map(i=>i.id)),o=[];
  S.invoices.forEach(r=>{if(r.type==='pay')return;(r.rows||[]).forEach(x=>{const t=rd.has(x.i)&&m.get(x.i);if(t&&r.ts>=t.from&&+x.c)o.push({inv:1,iid:x.i,ts:r.ts,q:(x.rt?1:-1)*(+x.c),code:r.code||('#'+r.no)})})});return o}
function drawStk(){const m=stkAll(),mn=stkMin(),q=$('stkQ').value,l=S.items.filter(i=>qm(i.name,q)).sort((a,b)=>(m.has(b.id)-m.has(a.id))||a.name.localeCompare(b.name,'ar'));
  $('stkList').innerHTML=l.length?'<tr><th>الصنف</th><th>عندك</th><th>الكمية</th><th></th><th></th></tr>'+l.map(i=>{const o=m.get(i.id),low=o&&o.bal<=mn;
    return`<tr data-it="${esc(i.id)}"${low?' class="stk-low"':''}><td class="tn">${esc(i.name)}${szOf(i)?' <small class="num">'+esc(szOf(i))+'</small>':''}${low?'<br><small class="stk-warn">⚠️ قرب يخلص</small>':''}</td><td class="num">${o?`<b>${f(o.bal)}</b><small class="mute">${stkUnit(i)}</small>`:'<small class="mute">لسه</small>'}</td><td class="tq"><input class="sq" inputmode="decimal" placeholder="1" aria-label="الكمية"></td><td class="tb"><button type="button" class="stk-b in" data-sd="1">➕ دخل</button></td><td class="tb"><button type="button" class="stk-b out" data-sd="-1">➖ طلع</button></td></tr>`}).join(''):'<tr><td class="tn mute">'+(q?'مفيش صنف بالاسم ده.':'مفيش أصناف لسه. ضيفها الأول من: الإعدادات ← الأصناف.')+'</td></tr>';
  const nm=id=>(S.items.find(i=>i.id===id)||{}).name||'';
  const g=S.stock.filter(x=>m.has(x.iid)).concat(stkSales(m)).sort((a,b)=>b.ts-a.ts).slice(0,25);
  $('stkLogH').classList.toggle('hide',!g.length);
  $('stkLog').innerHTML=g.length?'<tr><th>اليوم</th><th>الصنف</th><th>الحركة</th><th></th></tr>'+g.map(x=>`<tr><td class="num">${dshort(x.ts).slice(5)}</td><td class="tn">${esc(nm(x.iid))}</td><td>${x.inv?(x.q<0?'🧾 اتباع ':'↩️ مرتجع ')+'<b class="num">'+f(Math.abs(x.q))+'</b> <small class="mute">'+esc(x.code)+'</small>':x.q>0?'➕ دخل <b class="num">'+f(x.q)+'</b>':'➖ طلع <b class="num">'+f(-x.q)+'</b>'}</td><td>${x.inv?'':`<button type="button" class="xd" data-skd="${esc(x.id)}" aria-label="حذف الحركة">×</button>`}</td></tr>`).join(''):''}
$('stkQ').oninput=drawStk;
$('stkLim').onchange=e=>{svk('stkMin',String(Math.max(0,nv(e.target.value))));drawStk()};
$('stkList').onclick=e=>{const b=e.target.closest('[data-sd]');if(!b)return;const tr=b.closest('tr'),v=tr.querySelector('.sq').value.trim(),q=v?rd2(nv(v)):1,m=$('stkMsg');if(!(q>0)){m.textContent='اكتب الكمية صح';return}
  const it=S.items.find(i=>i.id===tr.dataset.it)||{};
  /* v189: مينفعش تطلّع أكتر من اللي عندك (كان الرصيد بينزل بالسالب) */
  if(+b.dataset.sd<0){const cur=stkAll().get(tr.dataset.it),have=cur?cur.bal:0;if(q>have+1e-9){m.textContent=have>0?'⚠️ عندك '+f(have)+stkUnit(it)+' بس من '+(it.name||'الصنف')+'، مينفعش تطلّع '+f(q):'⚠️ مفيش رصيد من '+(it.name||'الصنف')+'. سجّل اللي عندك بـ «دخل» الأول';return}}
  const o={id:uid(),iid:tr.dataset.it,ts:Date.now(),q:q*+b.dataset.sd};S.stock.push(o);put('stock',o);drawStk();
  const bal=(stkAll().get(o.iid)||{}).bal;m.textContent=(o.q>0?'✅ دخل ':'✅ طلع ')+f(q)+' '+(it.name||'')+' · بقى عندك '+f(bal)+stkUnit(it)};
$('stkLog').onclick=e=>{const b=e.target.closest('[data-skd]');if(!b||!ok2(b))return;del('stock',b.dataset.skd);drawStk()};

/* الإشعارات: رسالة فوق لو البرنامج قدامك، وإشعار من الموبايل لو في الخلفية، والضغط عليهم بيفتح الحاجة نفسها.
   nfSave بيسيب آخر تنبيهات في IndexedDB عشان sw.js يعرضها لوحده (periodicsync) والبرنامج مقفول */
function nfGo(k){({rem:openRemL,stk:()=>{$('hdrSet').click();stGo('stk')}}[k]||(()=>{}))()}
function nfList(){const a=[];try{const n=remList().length;if(n&&pget('nfRem',true))a.push({k:'rem',m:'🔔 '+n+(n>1?' مديونين محتاجين':' مديون محتاج')+' تذكير'})}catch(e){}
  try{const n=stkLow(stkAll());if(n&&pget('nfStk',true))a.push({k:'stk',m:'🧱 '+(n>1?n+' أصناف قربوا يخلصوا من المخزون':'صنف قرب يخلص من المخزون')})}catch(e){}return a}
function nfState(){if(!('Notification' in window)||!('serviceWorker' in navigator))return'no';return Notification.permission==='denied'?'denied':Notification.permission==='granted'&&pget('nfOn',false)?'on':'off'}
async function nfSys(a){if(nfState()!=='on')return;try{await(await navigator.serviceWorker.ready).showNotification('فواتير',{body:a.m,icon:'icon-192.png',badge:'icon-192.png',tag:a.k,lang:'ar',dir:'rtl',data:{go:a.k}})}catch(e){}}
function nfSave(){if(ddb)kvPut({alertNow:nfState()==='on'?nfList():[]}).catch(()=>{})}
function nfDaily(){const k=dkey(Date.now());nfList().filter(a=>lsv('nfDay_'+a.k,'')!==k).forEach((a,i)=>{svk('nfDay_'+a.k,k);setTimeout(()=>{if(document.hidden)nfSys(a)},i*8500)});nfSave();bellUI()}
async function nfBg(){try{const r=await navigator.serviceWorker.ready,p=await navigator.permissions.query({name:'periodic-background-sync'});if(r.periodicSync&&p.state==='granted')await r.periodicSync.register('tabakha-alerts',{minInterval:12*36e5})}catch(e){}}
/* بداية المستخدم الجديد: 3 خطوات فوق الفاتورة، وبتختفي لوحدها لما يخلصها أو يبدأ شغل فعلي */
function startUI(){try{const st=[['shop','🏪','اكتب اسم محلك (واللوجو لو عندك)',!!shopN()],['cu','👥','ضيف أول عميل، أو استورد القايمة من Excel',S.customers.length>0],['inv','🧾','اعمل أول فاتورة',S.invoices.some(r=>r.type==='inv')]],n=st.filter(x=>x[3]).length,off=lsv('startOff','')==='1'||n===3||S.invoices.length>3;
  $('startCard').classList.toggle('hide',off);if(!off)$('startRows').innerHTML=st.map(x=>`<button type="button" class="nfr${x[3]?' dn':''}" data-st="${x[0]}"><span>${x[3]?'✅':x[1]} ${x[2]}</span><span class="sa">‹</span></button>`).join('')}catch(e){}}
$('startX').onclick=()=>{svk('startOff','1');startUI()};
$('startRows').onclick=e=>{const b=e.target.closest('[data-st]');if(!b)return;const k=b.dataset.st;if(k==='shop'){$('hdrSet').click();stGo('shop');window.scrollTo(0,0)}else if(k==='cu'){document.querySelector('#bnav [data-t="cu"]').click();const m=document.querySelector('#t-cu [data-m="add"]');if(m)m.click()}else $('cust').focus()};
/* استيراد العملاء والأصناف: xlsx بيتفك هنا من غير مكتبات، وCSV بترميز UTF-8 أو ترميز Excel العربي */
async function zipOpen(buf){const u=new Uint8Array(buf),dv=new DataView(buf);let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error('zip');
  const n=dv.getUint16(e+10,true),files={},td=new TextDecoder();let p=dv.getUint32(e+16,true);
  for(let i=0;i<n;i++){const nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true);files[td.decode(u.subarray(p+46,p+46+nl))]={m:dv.getUint16(p+10,true),cs:dv.getUint32(p+20,true),lo:dv.getUint32(p+42,true)};p+=46+nl+xl+cl}
  const rd=async f0=>{const f=files[f0];if(!f)return'';const st=f.lo+30+dv.getUint16(f.lo+26,true)+dv.getUint16(f.lo+28,true),d=u.subarray(st,st+f.cs);return f.m===0?td.decode(d):new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()};return{rd,names:Object.keys(files)}}
async function xlsxRows(buf){const z=await zipOpen(buf),P=new DOMParser(),ss=P.parseFromString((await z.rd('xl/sharedStrings.xml'))||'<a/>','application/xml'),SS=[...ss.getElementsByTagName('si')].map(x=>[...x.getElementsByTagName('t')].map(t=>t.textContent).join(''));
  const sh=z.names.filter(n=>/^xl\/worksheets\/sheet\d*\.xml$/.test(n)).sort((x,y)=>x.length-y.length||(x<y?-1:1))[0];if(!sh)throw new Error('sheet');const d=P.parseFromString(await z.rd(sh),'application/xml');
  return[...d.getElementsByTagName('row')].map(r=>{const o=[];[...r.getElementsByTagName('c')].forEach(c=>{let ci=0;for(const ch of (c.getAttribute('r')||'').replace(/\d+/g,''))ci=ci*26+ch.charCodeAt(0)-64;const t=c.getAttribute('t'),v=c.getElementsByTagName('v')[0],is=c.getElementsByTagName('t')[0];o[(ci||o.length+1)-1]=t==='s'?(SS[+(v&&v.textContent)]||''):t==='inlineStr'?(is?is.textContent:''):(v?v.textContent:'')});return Array.from(o,x=>x==null?'':String(x).trim())})}
function csvRows(t){t=t.replace(/^\uFEFF/,'');const l1=t.split(/\r?\n/)[0]||'',sep=[',',';','\t'].map(s=>[s,l1.split(s).length]).sort((x,y)=>y[1]-x[1])[0][0],rows=[];let row=[],c='',q=false;
  for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===sep){row.push(c.trim());c=''}else if(ch==='\n'){row.push(c.replace(/\r$/,'').trim());rows.push(row);row=[];c=''}else c+=ch}
  if(c||row.length){row.push(c.trim());rows.push(row)}return rows}
async function impRead(fl){const buf=await fl.arrayBuffer(),u=new Uint8Array(buf);if(u[0]===0x50&&u[1]===0x4b)return xlsxRows(buf);if(u[0]===0xd0&&u[1]===0xcf)throw new Error('xls');
  let t;try{t=new TextDecoder('utf-8',{fatal:true}).decode(u)}catch(e){t=new TextDecoder('windows-1256').decode(u)}if(/^\s*<(html|table|\?xml|!doctype)/i.test(t)){const d=new DOMParser().parseFromString(t,'text/html');return[...d.querySelectorAll('tr')].map(r=>[...r.cells].map(c=>c.textContent.trim()))}return csvRows(t)}
const IMP_H=[['phone',/موبايل|تليفون|تلفون|هاتف|واتس|جوال|phone|mobile/i],['bal',/رصيد|مديون|عليه|balance/i],['price',/سعر|price/i],['addr',/عنوان|address/i],['note',/ملاحظ|note/i],['w',/عرض|width/i],['h',/طول|height/i],['type',/نوع|type/i],['name',/اسم|العميل|الصنف|البيان|name|customer|item/i]];
function impPrep(kind,rows){rows=rows.filter(r=>r.some(x=>x));const m={};(rows[0]||[]).forEach((t,i)=>{const f=IMP_H.find(([k,re])=>!(k in m)&&re.test(t));if(f)m[f[0]]=i});const hd='name' in m;if(!hd){m.name=0;if(kind==='customers'){m.phone=1;m.bal=2}else m.price=1}
  const seen=new Set(S[kind].map(x=>nkey(x.name))),list=[];let dup=0,bad=0;const g=(r,k)=>k in m?String(r[m[k]]==null?'':r[m[k]]).trim():'';
  rows.slice(hd?1:0).forEach(r=>{const name=g(r,'name'),k=nkey(name);if(!k){bad++;return}if(seen.has(k)){dup++;return}seen.add(k);if(kind==='customers'){let ph=toEn(g(r,'phone')).replace(/[^\d+]/g,'');if(/^1[0125]\d{8}$/.test(ph))ph='0'+ph;list.push({id:uid(),name,phone:ph,addr:g(r,'addr'),note:g(r,'note'),open:nv(g(r,'bal'))})}else list.push({id:uid(),u:0,type:/جاهز|عدد|قطعة|rd/i.test(g(r,'type'))?'rd':/مقطع|متر|مقاس|mq/i.test(g(r,'type'))?'mq':defT(),name,p:nv(g(r,'price')),w:nv(g(r,'w')),h:nv(g(r,'h'))})});return{list,dup,bad}}
let impK='',impL=null;
$('impBox').addEventListener('click',e=>{const k=e.target.dataset.imp;if(!k)return;impK=k;$('impMsg').textContent='';$('impAsk').classList.add('hide');$('impFile').click()});
$('impFile').onchange=async e=>{const fl=e.target.files[0],m=$('impMsg');e.target.value='';if(!fl)return;m.textContent='جاري قراءة الملف…';
  try{const r=impPrep(impK,await impRead(fl));impL=r.list;m.textContent='';if(!r.list.length){m.textContent='مفيش حاجة جديدة تتضاف'+(r.dup?': كلهم موجودين ('+r.dup+')':'.');return}const w=impK==='customers'?'عميل':'صنف',ex=r.list.slice(0,3).map(x=>x.name).join('، ');
    $('impPrev').textContent='هيتضاف '+plN(r.list.length,w)+(r.dup?' · '+r.dup+' موجودين قبل كده مش هيتكرروا':'')+(r.bad?' · '+r.bad+' صف من غير اسم هيتساب':'')+'. زي: '+ex;$('impAsk').classList.remove('hide')}
  catch(err){m.textContent=err&&err.message==='xls'?'ملف xls القديم مش مدعوم. من Excel اختار حفظ باسم، واحفظه xlsx أو CSV.':'الملف مش بيتقري. جرّب تحفظه xlsx أو CSV.'}};
$('impNo').onclick=()=>{impL=null;$('impAsk').classList.add('hide')};
$('impGo').onclick=()=>{if(!impL||!impL.length)return;const n=impL.length,t=Date.now();DV++;S[impK].push(...impL);impL.forEach(o=>{o.u=t;pushDoc(impK,o)});lset(impK,S[impK]);impL=null;$('impAsk').classList.add('hide');refreshAll();$('impMsg').textContent='اتضاف '+plN(n,impK==='customers'?'عميل':'صنف')+' ✓'};
/* جرس التنبيهات جنب السحابة: كل اللي مستني المستخدم في مكان واحد */
function bellUI(){let l=[];try{l=nfList()}catch(e){}const rem=!$('remBan').classList.contains('hide');if(rem)l=l.filter(x=>x.k!=='rem');$('nfRows').innerHTML=l.map(x=>`<button type="button" class="nfr" data-nk="${x.k}"><span>${esc(x.m)}</span><span class="sa">‹</span></button>`).join('');const n=l.length+['autoBan','remBan','ordBan','bkBanner'].filter(i=>!$(i).classList.contains('hide')).length,c=$('nfCnt');c.textContent=n>9?'9+':String(n);c.classList.toggle('hide',!n);$('nfNone').classList.toggle('hide',n>0);$('nfBell').setAttribute('aria-label',n?'التنبيهات: '+n:'التنبيهات')}
/* عمود القيمة: تدوس على عنوانه يصغر لشريط رفيع والجدول يوسع، وتدوس تاني يرجع. الاختيار بيتحفظ */
function vTogUI(){const off=lsv('vHide','')==='1',t=$('vTog'),w=$('rowsW');w.classList.toggle('v-off',off);w.style.setProperty('--vw',off?'22px':'62px');void w.offsetWidth;$('rows').style.transform='translateZ(0)';requestAnimationFrame(()=>requestAnimationFrame(()=>{$('rows').style.transform=''}));if(t){t.setAttribute('aria-label',off?'إظهار عمود القيمة':'إخفاء عمود القيمة');t.title=off?'إظهار القيمة':'إخفاء القيمة'}}
$('vTog').addEventListener('pointerdown',e=>e.preventDefault());
/* اسم الصنف: لما تسيب الخانة أو يتختار صنف، الاسم يرجع يبان من أوله بدل ما يفضل مقصوص */
const nTop=()=>requestAnimationFrame(()=>document.querySelectorAll('#rows .n').forEach(n=>{if(n!==document.activeElement)n.scrollLeft=0}));
$('rows').addEventListener('focusout',nTop);$('rows').addEventListener('change',nTop);$('rows').addEventListener('focusin',nTop);
$('vTog').onclick=()=>{svk('vHide',lsv('vHide','')==='1'?'':'1');vTogUI()};
$('vTog').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('vTog').click()}};
vTogUI();
/* شاشة واحدة بس مفتوحة: الجرس بيقفل قايمة «محتاجين تذكير» لو كانت مفتوحة، والعكس */
$('nfBell').onclick=()=>{$('remL').classList.add('hide');bellUI();$('nfOv').classList.remove('hide')};$('nfX').onclick=()=>$('nfOv').classList.add('hide');
$('nfOv').addEventListener('click',e=>{if(e.target===$('nfOv')){$('nfOv').classList.add('hide');return}const r=e.target.closest('[data-nk]');if(r){$('nfOv').classList.add('hide');nfGo(r.dataset.nk);return}if(e.target.closest('#autoBan button,#remBan button,#ordBan,#bkBanner button')&&e.target.id!=='nfX')setTimeout(()=>{$('nfOv').classList.add('hide');bellUI()},0)});
if(window.MutationObserver){const mo=new MutationObserver(()=>bellUI());['autoBan','remBan','ordBan','bkBanner'].forEach(i=>mo.observe($(i),{attributes:true,attributeFilter:['class']}))}
function nfBoot(){if(nfState()==='on')nfBg();const g=/^#go=(\w+)/.exec(location.hash);if(g){history.replaceState(null,'',location.pathname);setTimeout(()=>nfGo(g[1]),300)}}
function nfUI(){const s=nfState();$('nfStat').textContent={on:'شغالة ✓',off:'مقفولة',denied:'الإذن متمنع. افتح إذن الإشعارات للبرنامج من إعدادات المتصفح.',no:'الجهاز ده مش بيدعم الإشعارات. على الآيفون لازم تضيف البرنامج للشاشة الرئيسية الأول.'}[s];$('nfBtn').textContent=s==='on'?'إيقاف الإشعارات':'تفعيل الإشعارات';$('nfBtn').classList.toggle('hide',s==='no'||s==='denied');$('nfTest').classList.toggle('hide',s!=='on')}
$('nfBtn').onclick=async()=>{if(nfState()==='on')pset('nfOn',false);else if(await Notification.requestPermission()==='granted'){pset('nfOn',true);nfBg()}nfSave();nfUI()};
$('nfTest').onclick=()=>nfSys({k:'stk',m:'ده إشعار تجربة. دوس عليه يفتح المخزون'});
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.go)nfGo(e.data.go)});
document.addEventListener('visibilitychange',()=>{if(dataReady){if(document.hidden)nfSave();else nfDaily()}});
setInterval(()=>{if(dataReady)nfDaily()},36e5);

/* تصدير Excel: ملف CSV بعلامة BOM عشان العربي يفتح صح. الخانة اللي تبدأ بعلامة معادلة بتتكتب كنص */
const csvC=v=>{v=String(v==null?'':v);/* v189: رقم التليفون بيتكتب كنص عشان Excel ما يشيلش الصفر اللي في الأول */if(/^\+?0\d{6,}$/.test(v))return '"=""'+v+'"""';if(/^[=+\-@]/.test(v)&&isNaN(+v))v="'"+v;return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const XL={inv:['الفواتير',['الكود','التاريخ','العميل','النوع','القيمة','المدفوع','الباقي'],()=>S.invoices.slice().sort((a,b)=>a.ts-b.ts).map(r=>[r.code||'',dshort(r.ts),r.cname,r.type==='pay'?'دفعة':'فاتورة',val(r),pd(r),r.rest])],
  cu:['العملاء',['العميل','التليفون','الرصيد'],()=>S.customers.map(c=>[c.name,c.phone||'',balOf(c)])],
  it:['الأصناف',['الصنف','النوع','السعر'],()=>S.items.map(i=>[i.name,i.type==='rd'?'جاهز':'مقطع',i.p])],
  ex:['المصروفات',['التاريخ','النوع','المبلغ','ملاحظة'],()=>S.expenses.slice().sort((a,b)=>a.ts-b.ts).map(x=>[dshort(x.ts),x.cat,x.amt,x.note])],
  sp:['الموردين',['التاريخ','المورد','النوع','المبلغ','ملاحظة'],()=>S.purchases.slice().sort((a,b)=>a.ts-b.ts).map(x=>[dshort(x.ts),(S.suppliers.find(s=>s.id===x.sid)||{}).name||'',x.type==='pay'?'دفعة':'شراء',x.amt,x.note])],
  st:['المخزون',['الصنف','النوع','الرصيد'],()=>{const m=stkAll();return S.items.filter(i=>m.has(i.id)).map(i=>[i.name,i.type==='rd'?'جاهز':'مقطع',m.get(i.id).bal])}]};
$('xlBox').onclick=async e=>{const k=e.target.dataset.xl;if(!k)return;const[n,h,fn]=XL[k],rows=fn(),m=$('xlMsg');if(!rows.length){m.textContent='مفيش بيانات في '+n;return}
  const r=await dl(new Blob(['﻿'+[h,...rows].map(x=>x.map(csvC).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),n+'-'+dshort(Date.now()).replace(/\//g,'-')+'.csv');m.textContent=r==='fail'?'الملف متحفظش':'اتنزل ملف '+n+' ✓'};

/* ========== السجل (الفواتير والدفعات + الإقفال والتقارير) ========== */
const wkOf=t=>{const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+2)%7));return d.getTime()};
let hMo=1,hP='all',hLim=30,hTy='all',hN=1,hDay=0,hSort='new',hRF=0,hRT=0,hCur=[];
/* بحث السجل: اسم أو كود أو مبلغ (700 · 600-800 · 7000+) أو صنف أو موقع/ملاحظة أو طريقة دفع أو «مرتجع» */
function hMatch(r,q){q=q.trim();if(!q)return true;
  const z=String(q).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,،\s]/g,''),vals=r.type==='pay'?[Math.abs(r.amount||0)]:[val(r),pd(r),rd2(val(r)-(r.paid||0))].map(v=>Math.abs(+v)).filter(v=>v>0);let m;
  if(q==='مرتجع'||q==='↩')return hasRet(r);
  if(m=z.match(/^(\d+(?:\.\d+)?)[-~](\d+(?:\.\d+)?)$/)){const a=Math.min(+m[1],+m[2]),b=Math.max(+m[1],+m[2]);return vals.some(v=>v>=a&&v<=b)}
  if(m=z.match(/^(\d+(?:\.\d+)?)\+$/)){return vals.some(v=>v>=+m[1])}
  if(/^\d+(?:\.\d+)?$/.test(z)){const n=+z;return [r.code,r.rcode].some(v=>v!=null&&String(v).includes(z))||(r.oc||[]).some(x=>String(x)===z)||(z.length>=3&&vals.some(v=>Math.abs(v-n)<=n*.03))}
  return qm(r.cname,q)||qm(itemsTxt(r),q)||qm(r.note||'',q)||qm(r.pfWhy||'',q)||(PY(r)&&r.pays.some(y=>qm(y.n||'',q)))}
const WD=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],MN=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const hm=t=>{const d=new Date(t);let h=d.getHours();const ap=h>=12?'م':'ص';h=h%12||12;return h+':'+two(d.getMinutes())+' '+ap};
function dayLabel(t){const d=new Date(t),n=new Date(),a=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),b=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),full=WD[d.getDay()]+' '+d.getDate()+' '+MN[d.getMonth()];return a===b?'اليوم · '+full:a===dAgo(1)?'أمس · '+full:full}
const debtAll=()=>S.customers.reduce((a,c)=>a+Math.max(0,balOf(c)),0);
/* كارت المبيعات: مقارنة بأمس + نسبة التحصيل + رسم آخر 7 أيام */
const WS=['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
function drawHero(){const el=$('heroX');if(!el)return;
  const day=i=>S.invoices.filter(r=>r.type==='inv'&&r.ts>=dAgo(i)&&r.ts<dAgo(i-1)).reduce((a,r)=>a+val(r),0);
  const sales=[0,1,2,3,4,5,6].map(day),today=sales[0],yest=sales[1],max=Math.max(...sales,1);
  const paidT=S.invoices.filter(r=>r.ts>=dAgo(0)).reduce((a,r)=>a+(r.type==='pay'?r.amount:r.paid),0);
  const dl=yest>0?Math.round((today-yest)/yest*100):null,rate=today>0?Math.min(999,Math.round(paidT/today*100)):null;
  el.innerHTML=`<div class="hx-c"><span>أمس <b class="num">${f(yest)}</b>${dl==null?'':` <em class="${dl>=0?'up':'dn'}">${dl>=0?'▲':'▼'} ${Math.abs(dl)}%</em>`}</span>${rate==null?'':`<span>اتحصّل <b>${rate}%</b></span>`}</div>
  <div class="hx-b">${sales.map((v,i)=>`<div class="${i===0?'t':''}"><i style="height:${Math.max(3,Math.round(v/max*30))}px" title="${f(v)}"></i><small>${i===0?'النهارده':WS[new Date(dAgo(i)).getDay()]}</small></div>`).join('')}</div>`}
/* أكتر ناس عليهم فلوس: تذكير واتصال بضغطة من الرئيسية */
function drawTopDebt(){const box=$('topDebt');if(!box)return;const l=S.customers.filter(c=>balOf(c)>0).sort((a,b)=>balOf(b)-balOf(a)).slice(0,3);
  box.classList.toggle('hide',!l.length);if(!l.length)return;
  box.innerHTML=`<div class="td-h"><b>📒 أكتر ناس عليهم فلوس</b><button class="lnk" data-tdall="1">عرض الكل ›</button></div>`+l.map(c=>{const tn=telNum(c.phone);return`<div class="td" data-tdo="${c.id}">${av(c.name)}<div class="td-n"><b>${esc(c.name)}</b><small class="num">${bal(c)}</small></div><button class="ico" data-tdr="${c.id}" aria-label="تذكير بالواتساب"><i class="wai"></i></button>${tn?`<a class="ico" href="tel:${tn}" aria-label="اتصال">📞</a>`:''}</div>`}).join('')}
$('topDebt').onclick=e=>{const r=e.target.closest('[data-tdr]');if(r){const c=getC(r.dataset.tdr);if(c)openRem(c);return}if(e.target.closest('a'))return;
  if(e.target.closest('[data-tdall]')){infoMode=false;dbMode=true;dbSel=null;drawDebt();window.scrollTo(0,0);return}
  const o=e.target.closest('[data-tdo]');if(o){infoMode=false;dbMode=true;dbSel=o.dataset.tdo;dbPay=null;drawDebt();window.scrollTo(0,0)}};
function drawDash(){startUI();drawHero();drawTopDebt();
  const t0=new Date();t0.setHours(0,0,0,0);const todayTs=t0.getTime(),weekTs=dAgo(6);
  const inv=S.invoices.filter(r=>r.type==='inv'),tInvs=inv.filter(r=>r.ts>=todayTs);
  const tPay=S.invoices.filter(r=>r.type==='pay'&&r.ts>=todayTs).reduce((a,r)=>a+r.amount,0);
  $('d_today').textContent=f(tInvs.reduce((a,r)=>a+val(r),0));
  $('d_todayPaid').textContent=f(tInvs.reduce((a,r)=>a+r.paid,0)+tPay);
  $('d_info').textContent=f(inv.filter(r=>r.ts>=new Date(t0.getFullYear(),t0.getMonth(),1).getTime()).reduce((a,r)=>a+val(r),0));
  $('d_debt').textContent=f(debtAll());
  {const on=ordOn();if(!on&&hTy==='ord')hTy='all';
    const op=on?inv.filter(r=>ordSt(r)==='p').length:0,or=on?inv.filter(r=>ordSt(r)==='r').length:0,ob=$('ordBan');
    ob.classList.toggle('hide',!(op||or));if(op||or)ob.innerHTML=`<b>📦 طلبيات مفتوحة</b><span>${op?`<span class="tag ost p">⏳ ${op} تحت التجهيز</span>`:''}${or?` <span class="tag ost r">✅ ${or} جاهز للاستلام</span>`:''}</span><span class="mute">${hTy==='ord'?'✖ رجوع للسجل':'عرض ›'}</span>`}
  const win=hP==='all'&&hTy!=='ord'&&!$('hq').value.trim();/* البحث بيدوّر في كل الفواتير مش الأسبوع بس */
  const moW=hMo;/* السجل دايمًا بيبدأ من أسبوع النهارده (الجمعة 12 صباحًا) حتى لو فاضي */
  const q=$('hq').value.trim(),from=hP==='d'?todayTs:hP==='n'?dAgo(hN-1):hP==='x'?hDay:hP==='w'?weekTs:hP==='m'?dAgo(29):hP==='mo'?new Date(t0.getFullYear(),t0.getMonth(),1).getTime():hP==='rg'?hRF:win?(()=>{const d=new Date(wkOf(Date.now()));d.setDate(d.getDate()-7*(moW-1));return d.getTime()})():0,to=hP==='x'?dEnd(hDay):hP==='rg'&&hRT?dEnd(hRT):Infinity;
  const pm=hTy==='paid';/* المدفوع: أي فاتورة اتدفع فيها حاجة + أي دفعة (نفس حساب كارت "المدفوع اليوم") */
  const tyOk=r=>hTy==='all'||(hTy==='inv'&&r.type==='inv')||(hTy==='pay'&&r.type==='pay')||(pm&&(r.type==='pay'||rd2(r.paid||0)!==0))||(hTy==='ret'&&hasRet(r))||(hTy==='due'&&r.type==='inv'&&rd2(val(r)-r.paid)>0)||(hTy==='ord'&&ordSt(r)!=='d');
  const dueOf=r=>r.type==='inv'?Math.max(0,rd2(val(r)-(r.paid||0))):0;
  const l=S.invoices.filter(r=>r.ts>=from&&r.ts<to&&hMatch(r,q)&&tyOk(r)).sort((x,y)=>y.ts-x.ts);
  if(hSort==='amt')l.sort((x,y)=>Math.abs(y.type==='pay'?y.amount:val(y))-Math.abs(x.type==='pay'?x.amount:val(x))||y.ts-x.ts);else if(hSort==='due')l.sort((x,y)=>dueOf(y)-dueOf(x)||y.ts-x.ts);
  hCur=l;const flat=hSort!=='new';
  {const pr=hP==='n'||hP==='x',nm=hP==='x'?(hDay===dAgo(1)?'أمس':dshort(hDay)):hN===2?'يومين':'آخر '+hN+' أيام',rg=S.invoices.filter(r=>r.ts>=from&&r.ts<to),sOn=pr&&hTy==='inv',pOn=pr&&hTy==='paid';
    if(sOn)$('d_today').textContent=f(rg.filter(r=>r.type==='inv').reduce((a,r)=>a+val(r),0));
    if(pOn)$('d_todayPaid').textContent=f(rg.reduce((a,r)=>a+pd(r),0));
    $('l_today').textContent=sOn?'مبيعات '+nm+' ›':'مبيعات اليوم ›';$('l_paid').textContent=pOn?'المدفوع '+nm+' ›':'المدفوع اليوم ›'}
  const T={};l.forEach(r=>{const k=dshort(r.ts),t=T[k]=T[k]||{s:0,p:0};t.s+=val(r);t.p+=pd(r)});
  {const du=rd2(l.reduce((a,r)=>a+dueOf(r),0));$('hTot').textContent=pm?l.length+' عملية · المدفوع '+f(l.reduce((a,r)=>a+pd(r),0)):plN(l.length,'معاملة')+' · مبيعات '+f(l.reduce((a,r)=>a+val(r),0))+' · مدفوع '+f(l.reduce((a,r)=>a+pd(r),0))+(du>0&&!wkOn()?' · متبقي '+f(du):'')}
  {const bk=$('hBrk');if(pm&&l.length){const G=new Map();l.forEach(r=>pdBy(r).forEach(([k,v])=>G.set(k,rd2((G.get(k)||0)+v))));bk.textContent='💵 '+[...G].sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+f(v)).join(' · ');bk.classList.remove('hide')}else bk.classList.add('hide')}
  let last='',h='';
  l.slice(0,win?l.length:hLim).forEach(r=>{const k=dshort(r.ts);
    if(!flat&&k!==last){last=k;h+=`<div class="hday"><span>${dayLabel(r.ts)}</span><span class="num">${pm?'':'مبيعات '+f(T[k].s)+' · '}مدفوع ${f(T[k].p)}</span>${pget('dayCl',true)?`<button class="lnk" data-dc="${r.ts}" style="padding:1px 9px;font-size:calc(var(--fs) - 1px)">🧾 إقفال</button>`:''}</div>`}
    h+=`<div class="hrow" data-h="${r.id}"><div class="hl"><b>${esc(r.cname)}${ordTag(r)}</b><span class="mute">${(r.type==='pay'?'دفعة'+(r.code?' '+r.code:''):'فاتورة '+(r.code||'#'+r.no))+(hasRet(r)&&r.rcode?' ↩'+r.rcode:'')} · ${flat?dshort(r.ts)+' ':''}${hm(r.ts)}${r.by?' · 👷 '+esc(r.by):''}${pm&&r.pfWhy?' · '+esc(r.pfWhy):''}</span></div><div class="hr">${r.type==='pay'?`<b class="num">${f(r.amount)}</b><span class="tag ok">دفعة</span>`:pm?`<b class="num">${f(r.paid)}</b><span class="mute num">من ${f(val(r))}</span>`:`<b class="num">${f(val(r))}</b>${(()=>{const due=rd2(val(r)-r.paid);return pureRet(r)?`<span class="tag rt">↩ مرتجع</span>`:due>0?`<span class="tag dr">متبقي ${f(due)}</span>`+hWa(r):`<span class="tag ok">مدفوعة</span>`})()}`}</div></div>`});
  if(!win&&l.length>hLim)h+=`<button class="lnk" data-more="1">عرض المزيد (${l.length-hLim})</button>`;
  if(win){let pv=0;S.invoices.forEach(r=>{if(r.ts<from&&r.ts>pv)pv=r.ts});if(!l.length&&S.invoices.length)h='<p class="mute">مفيش معاملات في '+(moW===1?'الأسبوع ده':'الفترة دي')+'</p>';
    if(pv){const ws=wkOf(pv),we=new Date(ws);we.setDate(we.getDate()+6);const mo=moW+Math.round((from-ws)/(7*864e5));const wl=S.invoices.filter(r=>r.ts>=ws&&r.ts<ws+7*864e5),yr=new Date().getFullYear(),dm=t=>{const d=new Date(t);return d.getDate()+'/'+(d.getMonth()+1)+(d.getFullYear()!==yr?'/'+d.getFullYear():'')};h+=`<button class="lnk" data-mo="${mo}" style="width:100%;margin-top:6px;flex-direction:column;gap:2px"><span>⬇ المزيد: أسبوع ${dm(ws)} ← ${dm(we.getTime())}</span><small style="font-weight:500">${plN(wl.length,'معاملة')} · مبيعات ${f(wl.reduce((a,r)=>a+val(r),0))} · مدفوع ${f(wl.reduce((a,r)=>a+pd(r),0))}</small></button>`}}
  $('hList').innerHTML=h||(S.invoices.length?'<p class="mute">مفيش نتايج للبحث ده. جرّب كلمة تانية أو امسح البحث.</p>':'<p class="mute">لسه مفيش معاملات. أول فاتورة هتظهر هنا.</p>');drawDebt();try{remDraw()}catch(e){}}
$('hq').oninput=()=>{hLim=30;drawDash()};
/* كارت الطلبيات المفتوحة: بيفتح السجل على الطلبيات بس (من أي تاريخ) */
$('ordBan').onclick=$('ordBan').onkeydown=e=>{if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;hTy=hTy==='ord'?'all':'ord';hP='all';hMo=1;hLim=30;drawDash();if(hTy==='ord')$('hList').scrollIntoView({block:'start',behavior:'smooth'})};
$('hList').addEventListener('click',e=>{const bt=e.target.closest('[data-mo],[data-more],[data-dc]');const d=bt?bt.dataset:{};if(d.mo){hMo=+d.mo;drawDash()}else if(d.more){hLim+=30;drawDash()}else if(d.dc)showClose(+d.dc)});
function dayStart(ts){const d=new Date(ts);d.setHours(0,0,0,0);return d.getTime()}
function showClose(ts){const a=dayStart(ts),l=S.invoices.filter(r=>r.ts>=a&&r.ts<dEnd(a)).sort((x,y)=>x.ts-y.ts);
  if(!l.length){$('hTot').textContent='مفيش معاملات في اليوم ده';return}
  const inv=l.filter(r=>r.type==='inv');
  const cv=sheet({title:'إقفال اليوم',name:'',sub:dayLabel(a),date:stamp(Date.now()),
    tables:[{th:['العميل','النوع','القيمة','المدفوع'],w:[.38,.18,.22,.22],rows:l.map(r=>[r.cname,numTag(r),r.type==='pay'?'-':f(val(r)),f(pd(r))])}],
    sum:[['عدد الفواتير',String(inv.length)],['إجمالي المبيعات',f(l.reduce((x,r)=>x+val(r),0))],['إجمالي المدفوع',f(l.reduce((x,r)=>x+pd(r),0)),1],...clDiff('d'+dkey(a),l),['إجمالي المديونيات الآن',f(debtAll()),1]]});
  showImg(cv,'إقفال-'+dshort(a).replace(/\//g,'-')+'.png','إقفال '+dayLabel(a),false,'',null)}
function showMonth(ts){const d=new Date(ts),y=d.getFullYear(),mo=d.getMonth(),a=new Date(y,mo,1).getTime(),b=new Date(y,mo+1,1).getTime();
  const l=S.invoices.filter(r=>r.ts>=a&&r.ts<b),ex=exIn(a,b),pu=puIn(a,b);if(!l.length&&!ex.length&&!pu.n){$('hTot').textContent='مفيش معاملات في الشهر ده';return}
  const by={},cu={},ec={};ex.forEach(x=>{ec[x.cat]=rd2((ec[x.cat]||0)+(+x.amt||0))});
  l.forEach(r=>{const k=new Date(r.ts).getDate(),t=by[k]=by[k]||{n:0,s:0,p:0};if(r.type==='inv')t.n++;t.s+=val(r);t.p+=pd(r);const c=cu[r.cname]=cu[r.cname]||{s:0,p:0};c.s+=val(r);c.p+=pd(r)});
  const days=Object.keys(by).map(Number).sort((x,y)=>x-y).map(k=>[k+'/'+(mo+1),String(by[k].n),f(by[k].s),f(by[k].p)]);
  const best=Object.entries(cu).filter(x=>x[1].s>0).sort((x,y)=>y[1].s-x[1].s).slice(0,5).map(([n,v])=>[n,f(v.s),f(v.p)]);
  const tables=days.length?[{title:'اليوميات',th:['اليوم','فواتير','مبيعات','مدفوع'],w:[.22,.16,.31,.31],rows:days}]:[];
  if(best.length)tables.push({title:'أعلى العملاء شراءً',th:['العميل','مبيعات','مدفوع'],w:[.46,.27,.27],rows:best});
  if(ex.length)tables.push({title:'المصروفات',th:['النوع','المبلغ'],w:[.6,.4],rows:Object.entries(ec).sort((x,y)=>y[1]-x[1]).map(([n,v])=>[n,f(v)])});
  const sS=l.reduce((x,r)=>x+val(r),0),sP=l.reduce((x,r)=>x+pd(r),0),eT=exTot(ex);
  const cv=sheet({title:'تقرير شهر '+MN[mo]+' '+y,name:'',sub:'من أول الشهر لآخره',date:stamp(Date.now()),tables,
    sum:[['عدد الفواتير',String(l.filter(r=>r.type==='inv').length)],['إجمالي المبيعات',f(sS)],['إجمالي المدفوع',f(sP),1],...(ex.length||pu.n?[['إجمالي المصروفات',f(eT)],...(pu.n?[['مشتريات الموردين',f(pu.buy)],['دفعات الموردين',f(pu.pay)]]:[]),['الصافي بعد المصروفات',f(sS-eT-pu.buy),1],['الكاش بعد المصروفات',f(sP-eT-pu.pay)]]:[]),['إجمالي المديونيات الآن',f(debtAll()),1]]});
  showImg(cv,'تقرير-'+y+'-'+two(mo+1)+'.png','تقرير '+MN[mo]+' '+y,false,'',null)}
$('dayClose').onclick=()=>showClose(Date.now());
$('monRep').onclick=()=>showMonth(Date.now());
$('res').addEventListener('click',e=>{if(e.target===$('res'))$('res').classList.add('hide')});

/* النقر على المعاملات في الداشبورد */
let infoMode=false,dbMode=false,dbSel=null,dbPay=null;
/* دفعة من صفحة المديون: نفس حساب "خصم من المدفوع" اللي في الفاتورة */
function dbPayGo(btn){const c=getC(dbSel),m=$('dbp_msg');if(!c||!m)return;const r=pwRecord('db',c);
  if(!r){m.textContent='اكتب المبلغ المدفوع';const a=document.querySelector('[data-pw="db"] .spa');if(a)a.focus();return}
  if(btn.disabled)return;btn.disabled=true;
  S.invoices.push(r);put('invoices',r);lastSaved={id:r.id,at:Date.now(),dueBak:payDone(c,r)};dbPay=null;delete PW.db;try{document.activeElement.blur()}catch(e){}drawDash();showRec(r,false,'تم تسجيل الدفعة ✓')}
function drawDebt(){$('hMain').classList.toggle('hide',dbMode||infoMode);$('infoView').classList.toggle('hide',!infoMode||dbMode);$('infoCard').classList.toggle('on',infoMode&&!dbMode);$('dbView').classList.toggle('hide',!dbMode);$('dbCard').classList.toggle('on',dbMode);if(!dbMode)return;
  let c=dbSel&&getC(dbSel);if(dbSel&&!c)dbSel=null;
  $('dbList0').classList.toggle('hide',!!c);$('dbDet').classList.toggle('hide',!c);
  if(c){let run=c.open||0;const rows=ledger(c).slice().sort((a,b)=>a.ts-b.ts).map(r=>{run=rd2(run+(r.type==='pay'?-r.amount:val(r)-r.paid));return{r,run}}).reverse();
    const b=balOf(c),wn=waNum(c.phone),tn=telNum(c.phone);
    $('dbDet').innerHTML=`<div class="card"><div class="dbh"><button class="lnk" data-dback="1" aria-label="رجوع للمديونين">→</button><div class="cn">${esc(c.name)}</div><span class="dbamt ${bcls(c)}">${b?`<small>${b>0?'عليه':'له'}</small> <b class="num">${f(Math.abs(b))}</b>`:'<b>خالص</b>'}</span><button class="main b-green" data-dpay="1">💵 دفع</button></div>
      <div class="mute dbsub">${esc(cSub(c,2)+(c.remAt?' · آخر تذكير '+agoTxt(c.remAt):''))}</div>
      <div class="dbact"><button class="ab b-out" data-dfull="1">👤 صفحة العميل</button>${b>0?`<button class="ab b-out" data-drem="1"><i class="wai"></i> تذكير</button>`:''}${wn?`<a class="ab wa" target="_blank" rel="noopener" href="https://wa.me/${wn}"><i class="wai"></i> رسالة</a>`:''}${tn?`<a class="ab tel" href="tel:${tn}">📞 اتصال</a>`:''}</div>
      ${wn?'':'<div class="mute" style="margin-top:4px">مفيش رقم متسجل للعميل · يتضاف من صفحة العملاء</div>'}
      ${b>0?(c.due?`<div class="dbdue${dAgo(0)>=c.due?' late':''}">📅 ميعاد السداد: <b>${dueLabel(c.due)}</b>${dAgo(0)>c.due?` <span>(عدّى من ${dz(Math.round((dAgo(0)-c.due)/864e5))})</span>`:''}<button type="button" class="lnk" data-ddx="1">✖️ إلغاء</button></div>`:`<div class="dbdue"><span>📅 ميعاد سداد:</span><button type="button" class="ab" data-dd="1">بكرة</button><button type="button" class="ab" data-dd="2">بعد يومين</button><button type="button" class="ab" data-dd="7">بعد أسبوع</button><input type="date" data-ddate="1" aria-label="اختار تاريخ"></div>`):''}
      ${dbPay===c.id?`<div class="dbpay">
        ${pwHtml('db',c)}
        <div class="btns"><button class="main b-green" data-dpgo="1">✅ تسجيل الدفعة</button><button class="alt" data-dpx="1" style="flex:none">✖️ إلغاء</button></div>
        <div class="info" id="dbp_msg" style="color:var(--danger)"></div></div>`:''}</div>
      <div class="card">${rows.length?`<table class="st"><thead><tr><th>التاريخ</th><th>الكود</th><th>القيمة</th><th>المدفوع</th><th>الحساب</th></tr></thead><tbody>${rows.map(({r,run})=>`<tr data-rec="${r.id}"><td class="num">${dshort(r.ts)}</td><td>${stTag(r)}</td><td class="num">${r.type==='pay'?'-':f(val(r))}</td><td class="num">${f(pd(r))}</td><td class="num">${f(run)}</td></tr>`).join('')}</tbody></table><div class="mute" style="margin-top:4px">اضغط أي صف لعرض الفاتورة.</div>`:'<p class="mute">مفيش فواتير.</p>'}</div>`;if(dbPay===c.id)pwMount('db');return}
  const q=$('dbq').value.trim(),l=S.customers.filter(x=>balOf(x)>0&&qm(x.name,q)).sort((a,b)=>balOf(b)-balOf(a));
  $('dbTot').innerHTML='<small>إجمالي المديونيات · '+plN(l.length,'عميل')+'</small><span class="num">'+f(l.reduce((a,x)=>a+balOf(x),0))+'</span>';
  $('bulkRem').classList.toggle('hide',!(pget('bulkRem',true)&&l.length));
  $('dbList').innerHTML=l.map(x=>`<div class="rec cr2 dbr" data-dopen="${x.id}"${agStyle(x)}>${av(x.name)}<div class="dbm"><div class="cn">${esc(x.name)}</div>${lateTag(x)}<span class="mute lt">${esc(lastTx(x))}</span></div>${x.due?(dAgo(0)>=x.due?'<span class="tag dr">⚠ ميعاده جه</span>':`<span class="tag ok">📅 ${new Date(x.due).getDate()}/${new Date(x.due).getMonth()+1}</span>`):''}<div class="dbq">${waNum(x.phone)?`<a class="ab wa qa" target="_blank" rel="noopener" href="https://wa.me/${waNum(x.phone)}?text=${encodeURIComponent(remText(x))}"><i class="wai"></i> تذكير</a>`:''}${telNum(x.phone)?`<a class="ab tel qa" href="tel:${telNum(x.phone)}">📞 اتصال</a>`:''}<button type="button" class="ab b-green qa" data-dquick="${x.id}">💵 دفع</button><span class="cb ${bcls(x)} num">${bal(x)}</span></div></div>`).join('')||'<p class="mute">مفيش مديونين ✓</p>'}
$('dbq').oninput=drawDebt;
$('dbDet').addEventListener('change',e=>{const t=e.target;if(!t.dataset.ddate||!t.value)return;const c=getC(dbSel);if(!c)return;const[y,m,d]=t.value.split('-').map(Number);c.due=new Date(y,m-1,d).getTime();delete c.snz;put('customers',c);drawDebt();remDraw()});
$('bnav').addEventListener('click',e=>{if(e.target.closest('button[data-t="dash"]')&&(dbMode||infoMode)){dbMode=false;infoMode=false;dbSel=null;drawDebt()}});
$('t-dash').addEventListener('click',e=>{const t=e.target;
  const sc=t.closest('[data-sc]');if(sc){infoMode=true;dbMode=false;dbSel=null;dbPay=null;iPer='d';iSub=sc.dataset.sc==='paid'?'p':'s';drawInfo();drawDebt();window.scrollTo(0,0);return}
  if(t.closest('#infoCard')){infoMode=!infoMode;dbMode=false;dbSel=null;if(infoMode)drawInfo();drawDebt();window.scrollTo(0,0);return}
  if(t.closest('#infoBack')){infoMode=false;drawDebt();window.scrollTo(0,0);return}
  if(t.closest('#dbCard')){infoMode=false;dbMode=true;dbSel=null;drawDebt();window.scrollTo(0,0);return}
  if(t.closest('#dbBack')){dbMode=false;dbSel=null;drawDebt();window.scrollTo(0,0);return}
  {const dq=t.closest('[data-dquick]');if(dq){dbSel=dq.dataset.dquick;dbPay=dbSel;delete PW.db;drawDebt();window.scrollTo(0,0);const i=document.querySelector('[data-pw="db"] .spa');if(i)i.focus();return}}
  {const df=t.closest('[data-dfull]');if(df){const id=dbSel;document.querySelector('#bnav button[data-t="cu"]').click();selC=id;delete PW.cu;per='all';cdq='';pMo=0;editOpen=false;cuEd=false;cuPm=false;drawCusts();window.scrollTo(0,0);return}}
  const o=t.closest('[data-dopen]');if(o){dbSel=o.dataset.dopen;dbPay=null;drawDebt();window.scrollTo(0,0);return}
  if(t.closest('[data-dback]')){dbSel=null;dbPay=null;drawDebt();return}
  if(t.closest('[data-drem]')){const c=getC(dbSel);if(c)openRem(c);return}
  {const dd=t.closest('[data-dd]'),dx=t.closest('[data-ddx]');if(dd||dx){const c=getC(dbSel);if(!c)return;if(dd){c.due=dAgo(-(+dd.dataset.dd));delete c.snz}else delete c.due;put('customers',c);drawDebt();remDraw();return}}
  if(t.closest('[data-dpay]')){dbPay=dbPay===dbSel?null:dbSel;delete PW.db;drawDebt();const i=document.querySelector('[data-pw="db"] .spa');if(i)i.focus();return}
  if(t.closest('[data-dpx]')){dbPay=null;delete PW.db;drawDebt();return}
  const pg=t.closest('[data-dpgo]');if(pg){dbPayGo(pg);return}
  const rc=t.closest('[data-rec]');if(rc){const r=S.invoices.find(x=>x.id===rc.dataset.rec);if(r)showRec(r,false,'');return}
  const h=t.closest('[data-h]');if(h){const r=S.invoices.find(x=>x.id===h.dataset.h);if(r)showRec(r,false,'')}});


/* ========== تذكير المديونين: ميعاد سداد لكل عميل + تنبيه بعد مدة من غير دفع ========== */
const dz=n=>n===1?'يوم':n===2?'يومين':n>=3&&n<=10?n+' أيام':n+' يوم';
const agoTxt=t=>{const d=Math.floor((dAgo(0)-new Date(new Date(t).setHours(0,0,0,0)).getTime())/864e5);return d<=0?'النهارده':d===1?'امبارح':'من '+dz(d)};
const dueLabel=t=>{const d=new Date(t),n=Math.round((t-dAgo(0))/864e5);return(n===0?'النهارده · ':n===1?'بكرة · ':'')+WD[d.getDay()]+' '+d.getDate()+' '+MN[d.getMonth()]};
/* أي دفعة (أو فاتورة دفع فيها أكتر من قيمتها) بتلغي ميعاد السداد. بيرجّع القديم عشان "تراجع" */
function payDone(c,r){if(!c||!c.due)return null;const red=r.type==='pay'?r.amount>0:rd2((r.paid||0)-val(r))>0;if(!red&&balOf(c)>0)return null;const bak={cid:c.id,due:c.due};delete c.due;put('customers',c);return bak}
function remList(){if(!pget('remOn',true))return[];const D=Math.max(1,Math.round(+lsv('remDays','7'))||7),min=nv(lsv('remMin','0')),now=Date.now(),today=dAgo(0),out=[];
  S.customers.forEach(c=>{const b=balOf(c);if(b<=0||b<min)return;if(c.snz&&c.snz>now)return;const lr=c.remAt||0;
    if(c.due){if(today<c.due)return;if(lr<c.due){out.push({c,b,k:'due',d:Math.round((today-c.due)/864e5)});return}}
    /* ميعاد شهري ثابت (مثلاً يوم 5 من كل شهر): بيظهر لو عدّى اليوم ومفيش دفعة ولا تذكير من بعده */
    if(c.dd&&!c.due){const n=new Date(today),dueT=new Date(n.getFullYear(),n.getMonth(),Math.min(c.dd,new Date(n.getFullYear(),n.getMonth()+1,0).getDate())).getTime();if(today>=dueT&&lr<dueT&&lastPay(c)<dueT){out.push({c,b,k:'due',d:Math.round((today-dueT)/864e5),dueT});return}}
    const lp=lastPay(c),l=ledger(c),first=l.length?Math.min(...l.map(r=>r.ts)):0,from=lp||first,base=Math.max(from,lr);
    if(base&&Math.floor((now-base)/864e5)<D)return;out.push({c,b,k:'late',lp,from,lr})});
  return out.sort((x,y)=>(x.k==='due'?0:1)-(y.k==='due'?0:1)||y.b-x.b)}
function remWhy(x){if(x.k==='due')return'📅 وعد يدفع '+dueLabel(x.dueT||x.c.due)+(x.d>0?' · عدّى من '+dz(x.d):'');
  return(x.lp?'آخر دفعة '+agoTxt(x.lp):x.from?'مدفعش حاجة من أول تعامل ('+agoTxt(x.from)+')':'مفيش دفعات متسجلة')+(x.lr?' · آخر تذكير '+agoTxt(x.lr):'')}
function remDraw(){const l=remList(),bn=$('remBan'),dn=l.filter(x=>x.k==='due').length;
  bn.innerHTML=l.length?`<div class="abl"><span>🔔 <b class="num">${l.length}</b> ${l.length>1?'مديونين محتاجين':'مديون محتاج'} تذكير</span>${dn?`<span class="mute">(${dn} ميعادهم جه)</span>`:''}<button class="ab" data-rb="1">عرض</button></div>`:'';bn.classList.toggle('hide',!l.length);
  if(!$('remL').classList.contains('hide'))$('remLList').innerHTML=l.map(x=>`<div class="rec"><div class="ro" style="color:var(--ink)"><b>${esc(x.c.name)}</b><span class="cb dr num">${bal(x.c)}</span></div>
    <div class="mute" style="margin-top:2px">${esc(remWhy(x))}</div>
    <div class="btns"><button class="main b-green" data-rr="${x.c.id}"><i class="wai"></i> تذكير</button><button class="alt" data-rs="${x.c.id}" style="flex:none">⏰ بكرة</button><button class="alt" data-ro="${x.c.id}" style="flex:none">فتح</button></div></div>`).join('')||'<p class="mute">مفيش حد محتاج تذكير دلوقتي ✓</p>'}
const openRemL=()=>{$('nfOv').classList.add('hide');$('remL').classList.remove('hide');remDraw()};
$('remBan').onclick=e=>{if(e.target.closest('[data-rb]'))openRemL()};
$('remLX').onclick=()=>$('remL').classList.add('hide');
$('remL').addEventListener('click',e=>{const t=e.target;if(t===$('remL')){$('remL').classList.add('hide');return}
  const b=t.closest('button');if(!b)return;const c=getC(b.dataset.rr||b.dataset.rs||b.dataset.ro);
  if(b.dataset.rr&&c)openRem(c);
  else if(b.dataset.rs&&c){c.snz=dAgo(-1);put('customers',c);remDraw()}
  else if(b.dataset.ro&&c){$('remL').classList.add('hide');document.querySelector('#bnav button[data-t="dash"]').click();dbMode=true;dbSel=c.id;dbPay=null;drawDebt();window.scrollTo(0,0)}});
$('remLSet').onclick=()=>{$('remL').classList.add('hide');$('hdrSet').click();stGo('rem')};
/* لما تبعت التذكير فعلاً بيتسجل، فالعميل يختفي لحد ما المدة تعدّي تاني */
const remMark=c=>{if(!c)return;c.remAt=Date.now();delete c.snz;put('customers',c);remDraw()};
$('remGo').addEventListener('click',()=>remMark(remC));
$('bulkList').addEventListener('click',e=>{const a=e.target.closest('a[data-bk]');if(a)remMark(getC(a.dataset.bk))});
/* إعدادات التذكير */
function remUI(){$('remOn').checked=pget('remOn',true);const d=Math.round(+lsv('remDays','7'))||7;$('remDaysIn').value=d;document.querySelectorAll('#remDaysSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.rd===d));$('remMinIn').value=nv(lsv('remMin','0'))||''}
$('remOn').onchange=()=>{pset('remOn',$('remOn').checked);remDraw()};
$('remDaysSeg').onclick=e=>{const b=e.target.closest('[data-rd]');if(!b)return;svk('remDays',b.dataset.rd);remUI();remDraw()};
$('remDaysIn').oninput=()=>{const v=Math.round(nv($('remDaysIn').value));if(v>0){svk('remDays',String(v));document.querySelectorAll('#remDaysSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.rd===v));remDraw()}};
$('remMinIn').oninput=()=>{svk('remMin',String(nv($('remMinIn').value)));remDraw()};
/* ===== الإقفال التلقائي: يومي (12 بالليل) + أسبوعي (من الجمعة للخميس) ===== */
const clGet=()=>{try{return JSON.parse(localStorage.getItem('closes')||'{}')||{}}catch(e){return{}}};
const clSet=o=>{try{localStorage.setItem('closes',JSON.stringify(o))}catch(e){}};
const dkey=a=>{const d=new Date(a);return d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate())};
const addD=(a,n)=>{const d=new Date(a);d.setDate(d.getDate()+n);return d.getTime()};
const tot=l=>({n:l.filter(r=>r.type==='inv').length,s:rd2(l.reduce((x,r)=>x+val(r),0)),p:rd2(l.reduce((x,r)=>x+pd(r),0))});
const inRange=(a,b)=>S.invoices.filter(r=>r.ts>=a&&r.ts<b);
const clDiff=(k,l)=>{const c=clGet()[k];if(!c)return[];const t=tot(l);return(Math.abs(t.s-c.s)>.004||Math.abs(t.p-c.p)>.004)?[['⚠ اتعدّل بعد الإقفال (كان مبيعات '+f(c.s)+' · مدفوع '+f(c.p)+')','']]:[]};
function autoClose(){if(!S.invoices.length)return 0;
  const C=clGet(),now=Date.now(),t0=dayStart(now);let add=0,st=+lsv('clStart','0');if(!st){st=addD(t0,-7);svk('clStart',String(st))}
  if(pget('dayCl',true)){const by={};S.invoices.forEach(r=>{if(r.ts>=st&&r.ts<t0){const a=dayStart(r.ts);(by[a]=by[a]||[]).push(r)}});
    Object.keys(by).forEach(a=>{a=+a;const k='d'+dkey(a);if(C[k])return;C[k]={t:'d',a,at:now,...tot(by[a])};add++})}
  if(pget('weekCl',true)){const F=addD(t0,-((new Date(t0).getDay()-5+7)%7));for(let f=F,i=0;f>st&&i<60;f=addD(f,-7),i++){const a=addD(f,-7),k='w'+dkey(a);if(C[k])continue;const l=inRange(a,f);if(l.length){C[k]={t:'w',a,b:f,at:now,...tot(l)};add++}}}
  if(add)clSet(C);return add}
function showWeek(a){const b=addD(a,7),l=inRange(a,b);if(!l.length){toast('مفيش معاملات في الأسبوع ده');return}
  const days=[];for(let i=0;i<7;i++){const x=addD(a,i),y=addD(a,i+1),t=tot(inRange(x,y));if(t.n||t.s||t.p)days.push([WD[new Date(x).getDay()]+' '+new Date(x).getDate()+'/'+(new Date(x).getMonth()+1),String(t.n),f(t.s),f(t.p)])}
  const cu={};l.forEach(r=>{const c=cu[r.cname]=cu[r.cname]||{s:0,p:0};c.s+=val(r);c.p+=pd(r)});
  const best=Object.entries(cu).filter(x=>x[1].s>0).sort((x,y)=>y[1].s-x[1].s).slice(0,5).map(([n,v])=>[n,f(v.s),f(v.p)]);
  const tables=[{title:'اليوميات',th:['اليوم','فواتير','مبيعات','مدفوع'],w:[.34,.14,.26,.26],rows:days}];
  if(best.length)tables.push({title:'أعلى العملاء شراءً',th:['العميل','مبيعات','مدفوع'],w:[.46,.27,.27],rows:best});
  const t=tot(l),last=addD(b,-1);
  const cv=sheet({title:'إقفال الأسبوع',name:'',sub:'من '+WD[new Date(a).getDay()]+' '+dshort(a)+' إلى '+WD[new Date(last).getDay()]+' '+dshort(last),date:stamp(Date.now()),tables,
    sum:[['عدد الفواتير',String(t.n)],['إجمالي المبيعات',f(t.s)],['إجمالي المدفوع',f(t.p),1],...clDiff('w'+dkey(a),l),['إجمالي المديونيات الآن',f(debtAll()),1]]});
  showImg(cv,'إقفال-أسبوع-'+dkey(a)+'.png','إقفال الأسبوع',false,'',null)}
let clK='d';
function drawCl(){const C=clGet(),l=Object.values(C).filter(x=>x.t===clK).sort((x,y)=>y.a-x.a).slice(0,60);
  document.querySelectorAll('#clTab button').forEach(b=>b.classList.toggle('on',b.dataset.k===clK));
  $('clBody').innerHTML=l.length?l.map(x=>`<div class="hrow" data-cl="${x.t}" data-a="${x.a}"><div class="hl"><b>${x.t==='d'?dayLabel(x.a):'من '+dshort(x.a)+' إلى '+dshort(addD(x.b,-1))}</b><small class="mute">${x.n} فاتورة</small></div><div class="hr"><b class="num">${f(x.s)}</b><small class="mute num">مدفوع ${f(x.p)}</small></div></div>`).join(''):'<div class="info">لسه مفيش إقفالات. أول إقفال هيتعمل لوحده بعد آخر اليوم.</div>'}

/* معلومات: استعلام — إيه (مدفوع/مبيعات/أصناف/ديون/طرق دفع) × امتى × مقارنة */
let iSub='s',iPer='w',iCmp='prev',iMon=0,iRF=0,iRT=0;
const mS=(y,m)=>new Date(y,m,1).getTime();
const shiftT=(t,u,k)=>{const d=new Date(t);if(u==='d')d.setDate(d.getDate()+k);else if(u==='m')d.setMonth(d.getMonth()+k);else d.setFullYear(d.getFullYear()+k);return d.getTime()};
const labT=(a,u)=>{const d=new Date(a);return u==='d'?dshort(a):u==='m'?MN[d.getMonth()]+' '+d.getFullYear():String(d.getFullYear())};
function iRange(){const n=new Date(),Y=n.getFullYear(),M=n.getMonth();
  if(iPer==='d'){const a=dAgo(0);return{a,b:dEnd(a),u:'d'}}
  {const mm=/^d([2-6])$/.exec(iPer);if(mm){const a=dAgo(+mm[1]);return{a,b:dEnd(a),u:'d'}}}
  if(iPer==='w3')return{a:dAgo(2),b:dEnd(dAgo(0)),u:'g'};if(iPer==='w30')return{a:dAgo(29),b:dEnd(dAgo(0)),u:'g'};
  if(iPer==='m')return{a:mS(Y,M),b:mS(Y,M+1),u:'m'};
  if(iPer==='pm')return{a:mS(Y,M-1),b:mS(Y,M),u:'m'};
  if(iPer==='y')return{a:mS(Y,0),b:mS(Y+1,0),u:'y'};
  if(iPer==='ys'){const a=dAgo(1);return{a,b:dEnd(a),u:'d'}}
  if(iPer==='w')return{a:dAgo(6),b:dEnd(dAgo(0)),u:'g'};
  if(iPer==='g'){let a=iRF||dAgo(29),b=dEnd(iRT||dAgo(0));if(b<=a){const t=a;a=dEnd(b-1)-864e5;b=dEnd(t)}return{a,b,u:'g'}}
  const d=new Date(iMon||mS(Y,M));return{a:mS(d.getFullYear(),d.getMonth()),b:mS(d.getFullYear(),d.getMonth()+1),u:'m'}}
const rLab=R=>R.u==='g'?dshort(R.a)+' ← '+dshort(R.b-1):labT(R.a,R.u);
function iSum(a,b){const rs=S.invoices.filter(r=>r.ts>=a&&r.ts<b),iv=rs.filter(r=>r.type==='inv');let s=0,p=0,d=0,rt=0;const cs=new Set();rs.forEach(r=>{p=rd2(p+(pd(r)||0));if(r.type==='inv'){s=rd2(s+val(r));d=rd2(d+Math.max(0,val(r)-(r.paid||0)));cs.add(r.cid);if(hasRet(r))rt++}});return{s,p,d,n:iv.length,c:cs.size,rt,ex:exTot(exIn(a,b))}}
function iAgg(a,b){const recs=S.invoices.filter(r=>r.ts>=a&&r.ts<b),G=new Map();let tot=0,cnt=0,nk=0;
  const add=(k,v,c)=>{if(!k)return;const o=G.get(k)||{v:0,c:0};o.v=rd2(o.v+v);o.c+=c;G.set(k,o);tot=rd2(tot+v);cnt++};
  recs.forEach(r=>{
    if(iSub==='p'){const v=pd(r)||0;if(rd2(v)!==0)add(r.cname||'—',v,1)}
    else if(iSub==='t'){if(r.type==='inv'&&hasRet(r)){const v=rd2((r.rows||[]).reduce((a,x)=>a+(x.rt?Math.abs(+x.v||0):0),0));if(v)add(r.cname||'—',v,1)}}
    else if(iSub==='o'){if(r.type==='inv'&&ordSt(r)!=='d')add(r.cname||'—',val(r),1)}
    else if(iSub==='w'){pdBy(r).forEach(([k,v])=>{if(rd2(v||0)!==0)add(k,v,1)})}
    else if(iSub==='s'){if(r.type==='inv')add(r.cname||'—',val(r),1)}
    else if(iSub==='d'){if(r.type==='inv'){const u=rd2(val(r)-r.paid);if(u>0)add(r.cname||'—',u,1)}}
    else if(iSub==='r'){if(r.type==='inv')(r.rows||[]).forEach(x=>{if(x.k==null){nk=rd2(nk+(+x.v||0));return}add(String(x.n||'').trim(),rd2((+x.v||0)-(+x.k||0)),(x.rt?-1:1)*(+x.c||0))})}
    else if(iSub==='i'){if(r.type==='inv')(r.rows||[]).forEach(x=>{/* v189: المرتجع بيتخصم من مبيعات الصنف */add(String(x.n||'').trim(),+x.v||0,(x.rt?-1:1)*(+x.c||0))})}});
  return{G,tot,cnt,nk,n:recs.length,inv:recs.filter(r=>r.type==='inv').length}}
const PNAME={d:'النهارده',ys:'أمس',d2:'قبل أمس',d3:'قبل 3 أيام',d4:'قبل 4 أيام',d5:'قبل 5 أيام',d6:'قبل 6 أيام',w3:'آخر 3 أيام',w:'آخر 7 أيام',w30:'آخر 30 يوم'},SNAME={s:'المبيعات',p:'المدفوع',d:'الديون',t:'المرتجع',i:'الأصناف',w:'طرق الدفع',o:'الطلبيات',r:'الربح',x:'المصروفات والصافي'};
const perLab=R=>(PNAME[iPer]?PNAME[iPer]+' · ':'')+rLab(R);
let iMoreOpen=false;
/* v248: شاشة التقرير — الأرقام بتظهر على طول لكل فترة، وكل سطر بيفتح ورقة تفاصيله */
const iAggK=(k,a,b)=>{const o=iSub;iSub=k;try{return iAgg(a,b)}finally{iSub=o}};
function drawInfo(){
  const main=['d','ys','w','m'],oth=!main.includes(iPer);
  document.querySelectorAll('#iPer button[data-k]').forEach(x=>x.classList.toggle('on',x.dataset.k===iPer));
  {const mb=$('iMoreB'),ob=oth&&document.querySelector('#iMore button[data-k="'+iPer+'"]');mb.classList.toggle('on',oth);mb.textContent=(ob?ob.textContent.replace('📅 ',''):'غيره')+' ▾'}
  $('iMore').classList.toggle('hide',!iMoreOpen);$('iRgB').classList.toggle('hide',iPer!=='g');$('iMoB').classList.toggle('hide',iPer!=='c');
  const R=iRange(),T=iSum(R.a,R.b),recs=S.invoices.filter(r=>r.ts>=R.a&&r.ts<R.b);
  if(iPer==='c'){const d=new Date(R.a);$('iMonth').value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
  $('infoSum').textContent=R.u==='g'?'من '+dshort(R.a)+' إلى '+dshort(R.b-1):rLab(R);
  let rt=0;recs.forEach(r=>{if(r.type==='inv'&&hasRet(r))(r.rows||[]).forEach(x=>{if(x.rt)rt=rd2(rt+Math.abs(+x.v||0))})});
  const P=iAggK('r',R.a,R.b),I=iAggK('i',R.a,R.b),W=iAggK('w',R.a,R.b),top=G=>[...G].sort((x,y)=>y[1].v-x[1].v);
  const row=(k,em,l,sm,v,cls)=>'<button type="button" class="rrow" data-rk="'+k+'"><span class="rl">'+em+' '+l+(sm?' <small>· '+esc(sm)+'</small>':'')+'</span>'+(v!==''?'<b'+(cls?' class="'+cls+'"':'')+'>'+v+'</b>':'')+'<i>‹</i></button>';
  let m=row('s','💰','المبيعات',plN(T.n,'فاتورة'),f(T.s))+row('p','💵','المدفوع','',f(T.p),'cr')+row('t','↩️','المرتجع','',f(rt))
    +row('r','📈','الربح',P.cnt?'بعد المصروفات':'مفيش أسعار شراء',P.cnt?f(rd2(P.tot-T.ex)):'—');
  {const ex=exIn(R.a,R.b),fx=exTot(ex.filter(x=>x.fx)),pu=puIn(R.a,R.b).buy,net=rd2(T.s-T.ex-pu);
   m+=row('x','💸','المصروفات',(fx?'منها ثابت '+f(fx):'')+(pu?(fx?' · ':'')+'ومشتريات موردين '+f(pu):''),f(rd2(T.ex+pu)))+row('x','🧮','الصافي','المبيعات − المصروفات',f(net),net<0?'dr':'cr')}
  const ti=top(I.G)[0],tw=top(W.G).slice(0,2).map(([k,o])=>k+' '+f(o.v)).join(' · ');
  let d=row('i','📦','الأصناف',ti?'الأكتر: '+ti[0]:'مفيش',''),oc=0;d+=row('w','💳','طرق الدفع',tw||'مفيش','');
  if(ordOn()){oc=recs.filter(r=>r.type==='inv'&&ordSt(r)!=='d').length;d+=row('o','🧾','الطلبيات',oc?plN(oc,'طلبية')+' لسه ما اتسلمتش':'مفيش','')}
  $('iRows').innerHTML='<div class="rbox">'+m+'</div><div class="rstp">تفاصيل أكتر · دوس على أي سطر يفتح ورقته</div><div class="rbox">'+d+'</div>';
  {const now=Date.now(),part=R.b>now&&R.a<=now;let a2,b2;if(R.u==='g'){a2=R.a-(R.b-R.a);b2=R.a}else{a2=shiftT(R.a,R.u,-1);b2=shiftT(R.b,R.u,-1)}if(part)b2=Math.min(b2,a2+(now-R.a));
    const pv=iSum(a2,b2).s,pl=R.u==='g'||(part&&R.u!=='d')?dshort(a2)+' ← '+dshort(b2-1):labT(a2,R.u),df=rd2(T.s-pv);
    $('iCmpL').textContent=!pv?(T.s?'مفيش مبيعات في '+pl+' للمقارنة':''):!df?'المبيعات زي '+pl+' بالظبط':(df>0?'⬆ المبيعات زادت ':'⬇ المبيعات قلّت ')+Math.round(Math.abs(df)/pv*100)+'% عن '+pl+' ('+f(pv)+')'}}
$('iRows').addEventListener('click',e=>{const b=e.target.closest('[data-rk]');if(!b)return;iSub=b.dataset.rk;repGo()});
/* ورقة التقرير: جدول تفاصيل للفترة والنوع المختارين، بتفتح كصورة تتحفظ أو تتبعت */
function repGo(){
  const R=iRange(),sb=iSub,fm=t=>{const d=new Date(t);return d.getDate()+'/'+(d.getMonth()+1)},CAP=300,
    cd=r=>r.type==='pay'?'دفعة'+(r.code?' '+r.code:''):(r.code||'#'+r.no),
    recs=S.invoices.filter(r=>r.ts>=R.a&&r.ts<R.b).sort((x,y)=>y.ts-x.ts);
  let tb=null,sum=[],tot=0,note='',rows=[];
  if(sb==='s'){const l=recs.filter(r=>r.type==='inv');tot=rd2(l.reduce((a,r)=>a+val(r),0));rows=l.map(r=>[fm(r.ts),r.cname,r.code||'#'+r.no,f(val(r))]);
    tb={th:['التاريخ','العميل','فاتورة','القيمة'],w:[.17,.41,.17,.25]};sum=[['عدد الفواتير',String(l.length)],['إجمالي المبيعات',f(tot),1],['المدفوع',f(T0())]]}
  else if(sb==='p'){const l=recs.filter(r=>rd2(pd(r)||0)!==0),G=new Map();tot=rd2(l.reduce((a,r)=>a+pd(r),0));
    rows=l.map(r=>{const m=pdBy(r).filter(([k,v])=>rd2(v||0)!==0);m.forEach(([k,v])=>G.set(k,rd2((G.get(k)||0)+v)));return[fm(r.ts),r.cname,cd(r),f(pd(r)),m.map(([k,v])=>k+(m.length>1?' '+f(v):'')).join(' + ')]});
    tb={th:['التاريخ','العميل','الكود','المبلغ','طريقة الدفع'],w:[.13,.27,.21,.17,.22]};sum=[['عدد العمليات',String(l.length)],['إجمالي المدفوع',f(tot),1],...[...G].sort((x,y)=>y[1]-x[1]).map(([k,v])=>['منه '+k,f(v)])]}
  else if(sb==='d'){const lp={};S.invoices.forEach(r=>{if((r.type==='pay'||rd2(pd(r)||0)>0)&&r.ts>(lp[r.cid]||0))lp[r.cid]=r.ts});
    const l=S.customers.filter(x=>balOf(x)>0).sort((x,y)=>balOf(y)-balOf(x));tot=rd2(l.reduce((a,x)=>a+balOf(x),0));rows=l.map(x=>[x.name,f(balOf(x)),lp[x.id]?fm(lp[x.id]):'—']);
    tb={th:['العميل','المتبقي عليه','آخر دفعة'],w:[.46,.28,.26]};sum=[['عدد المديونين',String(l.length)],['إجمالي المديونيات',f(tot),1]]}
  else if(sb==='t'){let n=0;recs.filter(r=>r.type==='inv'&&hasRet(r)).forEach(r=>(r.rows||[]).filter(x=>x.rt).forEach(x=>{const v=rd2(Math.abs(+x.v||0));n++;tot=rd2(tot+v);rows.push([fm(r.ts),r.cname,String(x.n||'').trim()||'—',f(v)])}));
    tb={th:['التاريخ','العميل','الصنف','القيمة'],w:[.17,.33,.30,.20]};sum=[['عدد البنود',String(n)],['إجمالي المرتجع',f(tot),1]]}
  else if(sb==='x'){const l=exIn(R.a,R.b).sort((x,y)=>y.ts-x.ts),pu=puIn(R.a,R.b).buy,sl=rd2(recs.filter(r=>r.type==='inv').reduce((a,r)=>a+val(r),0));tot=exTot(l);rows=l.map(x=>[fm(x.ts),x.cat,x.note||'',f(x.amt)]);
    tb={th:['التاريخ','النوع','ملاحظة','المبلغ'],w:[.15,.3,.33,.22]};sum=[['المبيعات',f(sl)],['− المصروفات',f(tot)],...(pu?[['− مشتريات الموردين',f(pu)]]:[]),['= الصافي',f(rd2(sl-tot-pu)),1]]}
  else if(sb==='o'){const l=recs.filter(r=>r.type==='inv'&&ordSt(r)!=='d');tot=rd2(l.reduce((a,r)=>a+val(r),0));rows=l.map(r=>[fm(r.ts),r.cname,r.code||'#'+r.no,ordSt(r)==='p'?'تحت التجهيز':'جاهز',f(val(r))]);
    tb={th:['التاريخ','العميل','فاتورة','الحالة','القيمة'],w:[.14,.29,.15,.22,.20]};sum=[['عدد الطلبيات',String(l.length)],['إجمالي القيمة',f(tot),1]]}
  else{const A=iAgg(R.a,R.b);tot=A.tot;rows=[...A.G].sort((x,y)=>y[1].v-x[1].v).map(([k,o])=>[k,sb==='w'?String(o.c):f(o.c),f(o.v)]);
    tb={th:[sb==='w'?'الطريقة':'الصنف',sb==='w'?'عدد':'الكمية',sb==='r'?'الربح':sb==='w'?'المبلغ':'المبلغ'],w:[.5,.2,.3]};
    if(sb==='r'){const ex=exTot(exIn(R.a,R.b));sum=[['ربح الأصناف',f(tot)],['− مصروفات الفترة',f(ex)],['= صافي الربح',f(rd2(tot-ex)),1]];if(A.nk)note='مبيعات بقيمة '+f(A.nk)+' ملهاش سعر شراء، مش داخلة في الربح.'}
    else sum=[[sb==='w'?'إجمالي المدفوع':'إجمالي مبيعات الأصناف',f(tot),1]]}
  if(!rows.length){toast(sb==='d'?'مفيش مديونين ✓':sb==='x'?'مفيش مصروفات متسجلة في الفترة دي':'مفيش بيانات في الفترة دي');return}
  if(rows.length>CAP){note=(note?note+' ':'')+'ظهر أول '+CAP+' من '+rows.length+' بس. اضغط «تصدير Excel» للتفاصيل كاملة.';rows=rows.slice(0,CAP)}
  tb.rows=rows;
  if(iCmp!=='0'&&sb!=='d'){const now=Date.now(),part=R.b>now&&R.a<=now;let a2,b2,pl;
    if(R.u==='g'&&iCmp==='prev'){a2=R.a-(R.b-R.a);b2=R.a}else{const uu=R.u==='g'?'y':iCmp==='yoy'?'y':R.u;a2=shiftT(R.a,uu,-1);b2=shiftT(R.b,uu,-1)}
    if(part)b2=Math.min(b2,a2+(now-R.a));pl=R.u==='g'||(part&&R.u!=='d')?dshort(a2)+' ← '+dshort(b2-1):labT(a2,iCmp==='yoy'&&R.u==='d'?'d':R.u);
    const P=sb==='o'||sb==='t'||sb==='x'?null:iAgg(a2,b2);
    if(P){const dif=rd2(tot-P.tot),pc=P.tot?Math.round(Math.abs(dif)/Math.abs(P.tot)*100)+'%':'';sum.push(['مقارنة بـ '+pl,f(P.tot)]);sum.push(['الفرق',dif?(dif>0?'زيادة ':'نقص ')+f(Math.abs(dif))+(pc?' ('+pc+')':''):'زي بعض',1])}}
  const lab=perLab(R),cv=sheet({title:'تقرير '+SNAME[sb],name:'',sub:sb==='d'?'الأرصدة لحد دلوقتي':lab,date:stamp(Date.now()),tables:[tb],sum,note});
  showImg(cv,'تقرير-'+SNAME[sb]+'-'+dshort(R.a).replace(/\//g,'-')+'.png','تقرير '+SNAME[sb]+' · '+(sb==='d'?'لحد دلوقتي':lab),false,'',null);
  function T0(){return rd2(recs.reduce((a,r)=>a+(pd(r)||0),0))}}
/* تصدير فواتير الفترة المختارة في التقرير كملف CSV بيفتح في إكسل */
$('iExp').onclick=async()=>{const R=iRange(),l=S.invoices.filter(r=>r.ts>=R.a&&r.ts<R.b).sort((x,y)=>y.ts-x.ts);if(!l.length){toast('مفيش معاملات في الفترة دي');return}
  const q=v=>{v=String(v==null?'':v);return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v},ymd=t=>{const d=new Date(t);return d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate())+' '+two(d.getHours())+':'+two(d.getMinutes())};
  const rows=[['التاريخ','النوع','الكود','العميل','القيمة','المدفوع','المتبقي','طريقة الدفع','ملاحظة']].concat(l.map(r=>{const p=r.type==='pay';return[ymd(r.ts),p?'دفعة':pureRet(r)?'مرتجع':'فاتورة',r.code||r.no||'',r.cname,p?0:val(r),pd(r),p?0:Math.max(0,rd2(val(r)-(r.paid||0))),pdBy(r).filter(([k,v])=>v).map(([k,v])=>k+' '+v).join(' + '),r.note||'']}));
  const blob=new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  await dl(blob,'تقرير-'+dshort(R.a).replace(/\//g,'-')+'.csv');toast('اتنزّل ملف فيه '+plN(l.length,'معاملة'))};
$('iPer').onclick=e=>{if(e.target.closest('#iMoreB')){iMoreOpen=!iMoreOpen;drawInfo();return}const k=e.target.dataset.k;if(!k)return;iPer=k;iMoreOpen=k==='c'||k==='g'?iMoreOpen:false;if(k==='g'){const z=n=>String(n).padStart(2,'0'),y=t=>{const d=new Date(t);return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())};if(!$('iRF').value)$('iRF').value=y(dAgo(29));if(!$('iRT').value)$('iRT').value=y(dAgo(0))}if(k==='c'&&!iMon)iMon=mS(new Date().getFullYear(),new Date().getMonth());drawInfo()};
{const pdt=v=>{if(!v)return 0;const[y,m,d]=v.split('-').map(Number);return new Date(y,m-1,d).getTime()};$('iRF').onchange=()=>{iRF=pdt($('iRF').value);iPer='g';drawInfo()};$('iRT').onchange=()=>{iRT=pdt($('iRT').value);iPer='g';drawInfo()}}
$('iMonth').onchange=e=>{const v=e.target.value;if(!v)return;const[y,m]=v.split('-').map(Number);iMon=mS(y,m-1);iPer='c';drawInfo()};
$('clBtn').onclick=()=>{drawCl();$('clOv').classList.remove('hide')};
$('clX').onclick=()=>$('clOv').classList.add('hide');
$('clOv').addEventListener('click',e=>{if(e.target===$('clOv'))$('clOv').classList.add('hide')});
$('clTab').onclick=e=>{const k=e.target.dataset.k;if(!k)return;clK=k;drawCl()};
$('clBody').onclick=e=>{const r=e.target.closest('[data-cl]');if(!r)return;r.dataset.cl==='d'?showClose(+r.dataset.a):showWeek(+r.dataset.a)};
setInterval(()=>{if(!document.hidden)autoBan()},60000);
/* إقفال أمس / تقرير الشهر اللي فات (بيظهروا لوحدهم) */
/* شريط الإقفالات والتقرير: سطر واحد فيه زراير صغيرة، وزرار إخفاء واحد للكل */
let abSeen=[];
function autoBan(){const n=new Date(),it=[];abSeen=[];try{autoClose()}catch(e){}
  $('clBtn').classList.toggle('hide',!(pget('dayCl',true)||pget('weekCl',true)));
  const C=clGet(),lastOf=t=>Object.values(C).filter(x=>x.t===t).sort((x,y)=>y.a-x.a)[0];
  const ld=pget('dayCl',true)&&lastOf('d'),lw=pget('weekCl',true)&&lastOf('w');
  const sday=t=>{const d=new Date(t),a=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();return a===dAgo(1)?'أمس':a===dAgo(0)?'النهارده':d.getDate()+' '+MN[d.getMonth()]};
  if(ld){const k=dkey(ld.a);if(lsv('dcSeen','')!==k){abSeen.push(['dcSeen',k]);it.push(`<button class="ab" data-ab="d" data-ts="${ld.a}" data-k="${k}">🧾 إقفال ${sday(ld.a)}</button>`)}}
  if(lw){const k=dkey(lw.a);if(lsv('wcSeen','')!==k){abSeen.push(['wcSeen',k]);it.push(`<button class="ab" data-ab="w" data-ts="${lw.a}" data-k="${k}">🗓 إقفال الأسبوع</button>`)}}
  if(pget('monCl',true)){const ps=new Date(n.getFullYear(),n.getMonth()-1,1),pe=new Date(n.getFullYear(),n.getMonth(),1).getTime(),key=ps.getFullYear()+'-'+two(ps.getMonth()+1);
    if(lsv('mcSeen','')!==key&&S.invoices.some(r=>r.ts>=ps.getTime()&&r.ts<pe)){abSeen.push(['mcSeen',key]);it.push(`<button class="ab" data-ab="m" data-ts="${ps.getTime()}" data-k="${key}">📊 تقرير ${MN[ps.getMonth()]}</button>`)}}
  const h=it.length?`<div class="abl"><span class="mute">جاهز:</span>${it.join('')}<button class="lnk" data-abx="all">إخفاء</button></div>`:'';
  $('autoBan').innerHTML=h;$('autoBan').classList.toggle('hide',!h)}
$('autoBan').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.ab){svk(d.ab==='d'?'dcSeen':d.ab==='w'?'wcSeen':'mcSeen',d.k);autoBan();d.ab==='d'?showClose(+d.ts):d.ab==='w'?showWeek(+d.ts):showMonth(+d.ts)}
  else if(d.abx){abSeen.forEach(([k,v])=>svk(k,v));autoBan()}};

/* ========== حاسبة الزجاج ========== */
function toggleCalc(){$('calcModal').classList.toggle('hide')}
$('calcFab').onclick=toggleCalc;
$('calcClose').onclick=toggleCalc;
$('calcModal').addEventListener('click',e=>{if(e.target===$('calcModal'))toggleCalc()});
function calcGlass(){
  const CZ=pget('ceilSz',true),cz=v=>CZ&&v>0?Math.ceil(v-1e-9):v,w=cz(nv($('calc_w').value)),h=cz(nv($('calc_h').value)),c=nv($('calc_c').value)||1,p=nv($('calc_p').value);
  const area=rd2(w*h/10000),tarea=rd2(w*h/10000*c),total=rd2(tarea*p);
  $('calc_area').textContent=fq(area)+' م²';
  $('calc_tarea').textContent=fq(tarea)+' م²';
  $('calc_total').textContent=f(total)}
['calc_w','calc_h','calc_c','calc_p'].forEach(i=>$(i).oninput=calcGlass);
$('calcAdd').onclick=()=>{const v={w:$('calc_w').value,h:$('calc_h').value,c:$('calc_c').value||'1',p:$('calc_p').value};$('calcMsg').textContent='';
  if(!nv(v.w)||!nv(v.h)){$('calcMsg').textContent='العرض والطول مطلوبين';return}
  toggleCalc();document.querySelector('#bnav button[data-t="new"]').click();const d=addRow('mq');setVals(d,v);calc();d.querySelector('.n').focus()};
$('calcReset').onclick=()=>{['calc_w','calc_h','calc_p'].forEach(i=>$(i).value='');$('calc_c').value='1';calcGlass()};

/* ========== قفل التطبيق (رقم سري + بصمة) ========== */
const lkGet=k=>{try{return localStorage.getItem(k)||''}catch(e){return''}},lkSet=(k,v)=>{try{v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
const sha=async t=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return hs(t)}};
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=t=>Uint8Array.from(atob(t.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
let bioOK=false,lkFails=0,lkWait=0,hiddenAt=0;
async function bioAvail(){try{return!!(window.PublicKeyCredential&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch(e){return false}}
function lkUI(){const on=lkGet('lkOn')==='1';$('lkRecSet').classList.toggle('hide',!on);$('lkRecMake').textContent=lkGet('lkRecHash')?'🔑 اعمل كود استرجاع جديد (القديم هيبطل)':'🔑 اعمل كود استرجاع (لو نسيت الرقم السري)';if(!on)$('lkRecShow').classList.add('hide');$('lkChk').checked=on||!$('lkSet').classList.contains('hide');$('lkBioBox').classList.toggle('hide',!(on&&bioOK));$('lkBio').checked=!!lkGet('lkBio')}
function lockNow(){document.documentElement.classList.add('locked');$('lkIn').value='';$('lkErr').textContent='';$('lkBioBtn').classList.toggle('hide',!(lkGet('lkBio')&&bioOK))}
function unlock(){document.documentElement.classList.remove('locked');lkFails=0}
const lkW=()=>Math.max(lkWait,+lkGet('lkW')||0);
async function tryPin(){if(Date.now()<lkW()){$('lkErr').textContent='استنى شوية وحاول تاني';return}
  if(await sha(lkGet('lkSalt')+$('lkIn').value)===lkGet('lkHash')){unlock();return}
  $('lkIn').value='';if(++lkFails>=5){lkWait=Date.now()+30000;lkSet('lkW',String(lkWait));lkFails=0;$('lkErr').textContent='محاولات كتير، استنى 30 ثانية'}else $('lkErr').textContent='الرقم غلط'}
async function tryBio(){try{await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:unb64(lkGet('lkBio')),transports:['internal']}],userVerification:'required',timeout:60000}});unlock()}catch(e){$('lkErr').textContent='اكتب الرقم السري'}}
$('lkGo').onclick=tryPin;$('lkBioBtn').onclick=tryBio;
/* نسيت الرقم السري: بحساب Google المربوط بالمزامنة، أو بكود استرجاع اتعمل وقت ضبط القفل */
function lkRecover(){['lkOn','lkHash','lkSalt','lkBio','lkRecHash'].forEach(k=>lkSet(k,null));unlock();$('lkRec').classList.add('hide');lkUI();
  setTimeout(()=>toast('اتفتح ✓ والرقم السري اتلغى. اعمل رقم جديد من الإعدادات','الإعدادات',()=>{$('hdrSet').click();stGo('lock')}),300)}
$('lkForgot').onclick=()=>{const g=!!fbCfg(),c=!!lkGet('lkRecHash');$('lkRec').classList.remove('hide');$('lkRecG').classList.toggle('hide',!g);$('lkRecP').classList.toggle('hide',!g);$('lkRecC').classList.toggle('hide',!c);
  $('lkRecMsg').textContent=!g&&!c?'مفيش طريقة استرجاع متفعّلة على الجهاز ده: لا حساب Google مربوط ولا كود استرجاع.':''};
$('lkRecGo').onclick=async()=>{if(Date.now()<lkW()){$('lkRecMsg').textContent='محاولات كتير، استنى شوية وحاول تاني';return}const v=toEn($('lkRecIn').value).replace(/\D/g,'');if(v&&await sha(lkGet('lkSalt')+'#'+v)===lkGet('lkRecHash'))lkRecover();else{$('lkRecIn').value='';if(++lkFails>=5){lkWait=Date.now()+60000;lkSet('lkW',String(lkWait));lkFails=0;$('lkRecMsg').textContent='محاولات كتير، استنى دقيقة'}else $('lkRecMsg').textContent='الكود غلط'}};
$('lkRecG').onclick=async()=>{const m=$('lkRecMsg');m.textContent='جاري الاتصال بجوجل…';let app=null;
  try{if(!window.firebase){const b='https://www.gstatic.com/firebasejs/13.2.0/';await loadScript(b+'firebase-app-compat.js');await loadScript(b+'firebase-auth-compat.js')}
    let prev=lsv('fbUid','');if(!prev){if(!firebase.apps.length)firebase.initializeApp(FBCFG);prev=await new Promise(r=>{const u=firebase.auth().onAuthStateChanged(x=>{u();r(x?x.uid:'')})})}
    if(!prev){m.textContent='مش لاقي الحساب المربوط على الجهاز ده';return}
    /* تطبيق منفصل للتأكد بس، عشان دخول المزامنة الأصلي ميتأثرش */
    app=firebase.initializeApp(FBCFG,'lkcheck'+Date.now());const r=await app.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    if(r&&r.user&&r.user.uid===prev)lkRecover();else m.textContent='ده مش الحساب المربوط بالبرنامج'}
  catch(e){const c=(e&&e.code)||'';m.textContent=/popup|operation-not-supported|web-storage/.test(c)?'جوجل مش راضي يفتح هنا. جرّب كود الاسترجاع، أو افتح البرنامج من المتصفح':/network/.test(c)?'مفيش نت':'الدخول منفعش'+(c?' ('+c.replace('auth/','')+')':'')}
  finally{if(app)try{await app.auth().signOut();await app.delete()}catch(_){}}};
$('lkRecPwGo').onclick=async()=>{const m=$('lkRecMsg'),pw=$('lkRecPw').value;if(!pw){m.textContent='اكتب كلمة سر حسابك';return}m.textContent='جاري التأكد…';let app=null;
  try{if(!window.firebase){const b='https://www.gstatic.com/firebasejs/13.2.0/';await loadScript(b+'firebase-app-compat.js');await loadScript(b+'firebase-auth-compat.js')}
    if(!firebase.apps.length)firebase.initializeApp(FBCFG);const cu=await new Promise(r=>{const u=firebase.auth().onAuthStateChanged(x=>{u();r(x)})});
    const prev=lsv('fbUid','')||(cu&&cu.uid)||'';if(!cu||!cu.email||!prev||!hasPw(cu)){m.textContent='الحساب المربوط هنا مش بإيميل وكلمة سر. جرّب Google أو كود الاسترجاع';return}
    app=firebase.initializeApp(FBCFG,'lkpw'+Date.now());const r=await app.auth().signInWithEmailAndPassword(cu.email,pw);
    if(r&&r.user&&r.user.uid===prev){$('lkRecPw').value='';lkRecover()}else m.textContent='ده مش الحساب المربوط بالبرنامج'}
  catch(e){const c=(e&&e.code)||'';m.textContent=/wrong-password|invalid-credential|invalid-login/.test(c)?'كلمة السر غلط':/too-many/.test(c)?'محاولات كتير. استنى شوية وجرّب تاني':/network/.test(c)?'مفيش نت':'معرفناش نتأكد'+(c?' ('+c.replace('auth/','')+')':'')}
  finally{if(app)try{await app.auth().signOut();await app.delete()}catch(_){}}};
async function lkRecMake(){const a=new Uint32Array(1);crypto.getRandomValues(a);const code=String(a[0]%100000000).padStart(8,'0');
  lkSet('lkRecHash',await sha(lkGet('lkSalt')+'#'+code));const f=code.slice(0,4)+' '+code.slice(4);
  $('lkRecShow').innerHTML=`<div class="reccode num">${f}</div><div class="mute" style="line-height:1.7">اكتب الكود ده في ورقة وشيله في مكان آمن. لو نسيت الرقم السري، اكتبه في شاشة القفل ← «نسيت الرقم السري؟». الكود بيظهر مرة واحدة بس.</div><button type="button" class="alt" id="lkRecCopy" style="width:100%;margin-top:6px">📋 نسخ الكود</button>`;
  $('lkRecShow').classList.remove('hide');$('lkRecCopy').onclick=async()=>{try{await navigator.clipboard.writeText(code);$('lkRecCopy').textContent='اتنسخ ✓'}catch(e){}};lkUI()}
$('lkRecMake').onclick=e=>{if(lkGet('lkRecHash')&&!ok2(e.target))return;lkRecMake()};

$('lkIn').addEventListener('keydown',e=>{if(e.key==='Enter')tryPin()});$('lkIn').addEventListener('input',async()=>{const v=$('lkIn').value;if(v.length>=6){tryPin();return}if(v.length>=4&&Date.now()>=lkWait&&await sha(lkGet('lkSalt')+v)===lkGet('lkHash'))unlock()});
$('lkChk').onchange=async()=>{const on=lkGet('lkOn')==='1',m=$('lkMsg');m.textContent='';
  if($('lkChk').checked){if(!on)$('lkSet').classList.remove('hide');return}
  if(!on){$('lkSet').classList.add('hide');return}
  $('lkChk').checked=true;$('lkOff').classList.remove('hide');$('lkOffIn').value='';$('lkOffIn').focus()};
$('lkOffGo').onclick=async()=>{const m=$('lkMsg');
  if(await sha(lkGet('lkSalt')+$('lkOffIn').value)===lkGet('lkHash')){['lkOn','lkHash','lkSalt','lkBio','lkRecHash'].forEach(k=>lkSet(k,null));$('lkOff').classList.add('hide');lkUI();m.textContent='اتلغى القفل ✓'}
  else{$('lkOffIn').value='';m.textContent='الرقم غلط'}};
$('lkSave').onclick=async()=>{const a=$('lkP1').value,b=$('lkP2').value,m=$('lkMsg');
  if(!/^\d{4,6}$/.test(a)){m.textContent='الرقم السري لازم يكون من 4 لـ 6 أرقام';return}
  if(a!==b){m.textContent='الرقمين مش متطابقين';return}
  const salt=uid();lkSet('lkSalt',salt);lkSet('lkHash',await sha(salt+a));lkSet('lkOn','1');lkSet('lkRecHash',null);
  $('lkP1').value=$('lkP2').value='';$('lkSet').classList.add('hide');m.textContent='تم تفعيل القفل ✓';lkUI();lkRecMake()};
$('lkBio').onchange=async()=>{const m=$('lkMsg');m.textContent='';
  if(!$('lkBio').checked){lkSet('lkBio',null);return}
  try{const cr=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'فواتير'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'owner',displayName:'صاحب المحل'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000}});
    lkSet('lkBio',b64(cr.rawId));m.textContent='تم تفعيل البصمة ✓'}
  catch(e){$('lkBio').checked=false;m.textContent='البصمة متفعّلتش على الجهاز ده'}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(lkGet('lkOn')==='1'&&hiddenAt&&Date.now()-hiddenAt>60000){lockNow();if(lkGet('lkBio')&&bioOK)tryBio()}});
async function lockInit(){bioOK=await bioAvail();
  if(lkGet('lkOn')==='1'&&!lkGet('lkHash')){lkSet('lkOn',null);unlock()}
  lkUI();if(lkGet('lkOn')==='1'){lockNow();if(lkGet('lkBio')&&bioOK)tryBio()}}

/* ---------- حماية التعديل/الحذف بالرقم السري ---------- */
let pinOkAt=0,pinWait=0,pinFail=0,pinRes=null;
const lkReady=()=>lkGet('lkOn')==='1'&&!!lkGet('lkHash');
function askPin(why){return new Promise(res=>{if(pinRes)pinRes(false);pinRes=res;$('pinWhy').textContent=why||'اكتب الرقم السري';$('pinIn').value='';$('pinErr').textContent='';$('pinOv').classList.remove('hide');setTimeout(()=>$('pinIn').focus(),50)})}
const pinDone=v=>{$('pinOv').classList.add('hide');const r=pinRes;pinRes=null;if(r)r(v)};
async function pinTry(){if(Date.now()<pinWait){$('pinErr').textContent='استنى شوية وحاول تاني';return}
  if(await sha(lkGet('lkSalt')+$('pinIn').value)===lkGet('lkHash')){pinOkAt=Date.now();pinFail=0;pinDone(true)}
  else{$('pinIn').value='';if(++pinFail>=5){pinWait=Date.now()+30000;pinFail=0;$('pinErr').textContent='محاولات كتير، استنى 30 ثانية'}else $('pinErr').textContent='الرقم غلط'}}
$('pinOk').onclick=pinTry;$('pinNo').onclick=()=>pinDone(false);$('pinIn').addEventListener('keydown',e=>{if(e.key==='Enter')pinTry()});$('pinOv').addEventListener('click',e=>{if(e.target===$('pinOv'))pinDone(false)});
async function guard(r,why){if(wkOn()){toast('مش مسموح في وضع العامل');return false}if(!pget('editLk',false)||!lkReady())return true;const d=+lsv('editLkD','1');if(d>0&&r&&r.ts>Date.now()-d*864e5)return true;if(Date.now()-pinOkAt<12e4)return true;return askPin(why)}
(()=>{const c=$('editLk'),b=$('editLkBox'),sel=$('editLkD'),m=$('editLkMsg');const sync=()=>{c.checked=pget('editLk',false);b.classList.toggle('hide',!c.checked);sel.value=lsv('editLkD','1')};
  c.onchange=()=>{m.textContent='';if(c.checked&&!lkReady()){c.checked=false;m.textContent='فعّل القفل برقم سري الأول (في الأعلى).';return}pset('editLk',c.checked);sync()};
  sel.onchange=()=>svk('editLkD',sel.value);sync()})();
/* ---------- نسخ تلقائية على الجهاز + مشاركة نسخة ---------- */
const idb=()=>new Promise((res,rej)=>{const q=indexedDB.open('tabakha-bk',1);q.onupgradeneeded=()=>q.result.createObjectStore('snaps',{keyPath:'day'});q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
const idbDo=async(mode,fn)=>{const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction('snaps',mode),r=fn(tx.objectStore('snaps'));tx.oncomplete=()=>{db.close();res(r&&r.result)};tx.onerror=()=>rej(tx.error)})};
const bkData=()=>({app:'ElTabakha',v:1,at:Date.now(),items:S.items,customers:S.customers,invoices:S.invoices,cats:S.cats,quotes:S.quotes,expenses:S.expenses,suppliers:S.suppliers,purchases:S.purchases,stock:S.stock});
/* v189: ملف النسخة فيه كمان إعدادات المحل (الاسم واللوجو والتصميم والملاحظات وطرق الدفع والرسايل). النسخ اليومية على الجهاز من غيرها عشان المساحة */
function bkFull(){const d=bkData();try{d.settings=setGet()}catch(e){}return d}
async function snapMaybe(){if(!dataReady||!pget('snapOn',true)||!window.indexedDB||S.invoices.length+S.customers.length===0)return;const day=dayKey(Date.now());
  try{if(await idbDo('readonly',st=>st.get(day)))return;
    await idbDo('readwrite',st=>st.put({day,at:Date.now(),n:S.invoices.length,c:S.customers.length,json:JSON.stringify(bkData())}));
    const ks=(await idbDo('readonly',st=>st.getAllKeys())).sort();while(ks.length>14){const k=ks.shift();await idbDo('readwrite',st=>st.delete(k))}}catch(e){}}
async function drawSnaps(){const m=$('snapMsg');let l=[];try{l=(await idbDo('readonly',st=>st.getAll())).sort((a,b)=>b.day<a.day?-1:1)}catch(e){}
  $('snapRows').innerHTML=l.length?l.map(x=>`<div class="hrow" style="cursor:default"><div class="hl"><b>${x.day}</b><small class="mute">${plN(x.n,'معاملة')} · ${plN(x.c,'عميل')}</small></div><div style="display:flex;gap:6px"><button class="alt" data-sd="${x.day}">تنزيل</button><button class="alt b-red" data-sr="${x.day}">استرجاع</button></div></div>`).join(''):'<div class="info">لسه مفيش نسخ. أول نسخة هتتعمل أول ما تفتح التطبيق.</div>';m.textContent=''}
$('snapList').onclick=drawSnaps;
$('snapRows').onclick=async e=>{const d=e.target.dataset;if(!d.sd&&!d.sr)return;const k=d.sd||d.sr,x=await idbDo('readonly',st=>st.get(k));if(!x)return;
  if(d.sd){await dl(new Blob([x.json],{type:'application/json'}),'نسخة-فواتير-'+k+'.json');return}
  if(!ok2(e.target))return;try{$('snapMsg').textContent=await restoreData(JSON.parse(x.json))}catch(err){$('snapMsg').textContent='النسخة دي مش صالحة.'}};
$('bkShare').onclick=async()=>{const name='نسخة-فواتير-'+dshort(Date.now()).replace(/\//g,'-')+'.json',blob=new Blob([JSON.stringify(bkFull())],{type:'application/json'});
  try{const file=new File([blob],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});try{localStorage.setItem('lastBackup',Date.now())}catch(e){}bkInfo();bkBan();$('snapMsg').textContent='تمت المشاركة ✓ (اختار درايف أو ابعتها لنفسك على واتساب)';return}}catch(e){if(e&&e.name==='AbortError')return}
  $('bkSave').click()};
setTimeout(snapMaybe,4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)snapMaybe()});
/* v189: مسودة الفاتورة. اللي بتكتبه في الفاتورة بيتحفظ على الجهاز أول بأول، فلو الموبايل قفل البرنامج (مكالمة، واتساب، بطارية) بترجع زي ما سبتها.
   بتتمسح لوحدها بعد الحفظ أو «مسح الفاتورة»، ومش بتشتغل وانت بتعدّل فاتورة قديمة */
var drT=0,drOn=false;
function draftSave(){if(!drOn||instOff)return;try{const x=invSnap();if(x)localStorage.setItem('invDraft',JSON.stringify({at:Date.now(),x}));else localStorage.removeItem('invDraft')}catch(e){}}
function draftSoon(){if(!drOn)return;clearTimeout(drT);drT=setTimeout(draftSave,400)}
function draftBoot(){let d=null;try{d=JSON.parse(localStorage.getItem('invDraft')||'null')}catch(e){}
  if(d&&d.x&&Array.isArray(d.x.rows)&&Date.now()-(+d.at||0)<12*36e5){try{invRestore(d.x);setTimeout(()=>toast('رجّعنا الفاتورة اللي كنت بتكتبها','امسحها',()=>{clearInv();$('msg').textContent=''}),1200)}catch(e){logErr(e,'draft');try{clearInv()}catch(_){}}}
  else{try{localStorage.removeItem('invDraft')}catch(e){}}
  drOn=true;$('t-new').addEventListener('input',draftSoon);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(drT);draftSave()}});window.addEventListener('pagehide',()=>{clearTimeout(drT);draftSave()})}
/* ---------- بداية ---------- */
lockInit();loadMsgUI();loadLogo();paperLabels();fixBar();document.body.classList.add('onNew');
(async()=>{try{await instInit();await dataInit()}catch(e){if(window.__bootFail)window.__bootFail('storage: '+(e&&e.message||e));return}
  if(!fbCfg()){reflowAll();syncNames()}drawDash();drawCusts();drawItems();calc();bkInfo();applyFeatures();drawTrash();drawRecent();qtBtn();try{draftBoot()}catch(e){logErr(e,'draftBoot')}
  window.__bootOK=true;applyBiz();bellUI();startUI();try{const lt=sessionStorage.getItem('lastTab');if(lt&&lt!==curTab){const bt=lt==='st'?$('hdrSet'):document.querySelector('#bnav button[data-t="'+lt+'"]');if(bt&&!bt.closest('.hide')&&!bt.classList.contains('hide'))bt.click()}}catch(e){}fbBoot();cloudUI();welcMaybe();setTimeout(nfDaily,1800);nfBoot();setTimeout(storCheck,2500);setTimeout(cloudNag,6000);if(migNote)setTimeout(()=>toast(migNote),700)})();
/* ---------- زرار الرجوع في الموبايل ---------- */
const OVS=['res','rem','remL','bulk','calcModal','clOv','pinOv','qtOv','dzOv'],OVX={dzOv:'dzX',res:'resx',rem:'remX',remL:'remLX',bulk:'bulkX',calcModal:'calcClose',clOv:'clX',pinOv:'pinNo',qtOv:'qtX'};
let NS=[],navIgnore=false,exitArm=false,exitT=0,navOK=false;
const wantNav=()=>{const w=tabHist.map((t,i)=>'t'+i+':'+t);if(curTab==='cu'&&selC&&getC(selC))w.push('cu');if(curTab==='dash'&&dbMode){w.push('db');if(dbSel&&getC(dbSel))w.push('dbs')}if(curTab==='st'&&stCur)w.push('sp');OVS.forEach(id=>{const e=$(id);if(e&&!e.classList.contains('hide'))w.push('o:'+id)});return w};
function syncNav(){if(!navOK||navIgnore)return;const w=wantNav();let p=0;while(p<NS.length&&p<w.length&&NS[p]===w[p])p++;
  if(NS.length>p){const k=NS.length-p;NS=NS.slice(0,p);navIgnore=true;history.go(-k);return}
  for(let i=p;i<w.length;i++){NS.push(w[i]);history.pushState({d:NS.length},'')}}
function closeTop(l){
  if(l[0]==='t'){const t=tabHist.pop();navNoHist=true;try{(t==='st'?$('hdrSet'):document.querySelector('#bnav button[data-t="'+t+'"]')).click()}finally{navNoHist=false}}
  else if(l==='cu'){selC=null;drawCusts()}
  else if(l==='dbs'){dbSel=null;drawDebt()}
  else if(l==='db'){dbMode=false;dbSel=null;drawDebt()}
  else if(l==='sp'){stGo('')}
  else if(l[0]==='o'){const id=l.slice(2),x=$(OVX[id]);if(x)x.click();else if($(id))$(id).classList.add('hide');if($(id))$(id).classList.add('hide')}}
let _rz;window.addEventListener('resize',()=>{clearTimeout(_rz);_rz=setTimeout(()=>{if(curTab==='new'){drawRecent();drawQS()}},200)});
window.addEventListener('popstate',e=>{
  if(navIgnore){navIgnore=false;syncNav();return}
  const d=e.state&&e.state.d!==undefined?e.state.d:(e.state&&e.state.base?-1:0);
  if(d===-1){if(exitArm){exitArm=false;clearTimeout(exitT);navOK=false;history.back();return}
    exitArm=true;toast('اضغط رجوع تاني للخروج');exitT=setTimeout(()=>{exitArm=false},2000);history.pushState({d:0},'');NS=[];return}
  while(NS.length>d){const l=NS.pop();closeTop(l)}
  syncNav()});
try{history.replaceState({base:1},'');history.pushState({d:0},'');navOK=true}catch(e){}
new MutationObserver(()=>syncNav()).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
const _dc=drawCusts;drawCusts=function(){const r=_dc.apply(this,arguments);syncNav();return r};

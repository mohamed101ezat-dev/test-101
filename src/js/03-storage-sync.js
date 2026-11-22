/* ---------- التخزين ---------- */
const hs=t=>{let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h).toString(36)};
function migrate(codes=!fbCfg()||!!db){
  S.items=S.items.map(i=>{const v=i.v||{};return{id:i.id||'i'+hs((i.type||'')+i.name),u:i.u||0,type:i.type==='rd'?'rd':'mq',name:i.name,p:v.p!==undefined?v.p:(i.price||i.p||0),w:v.w!==undefined?v.w:(i.w||0),h:v.h!==undefined?v.h:(i.h||0),...(i.pc?{pc:i.pc}:{}),...(i.inv?{inv:i.inv}:{})}});
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
function loadFrom(get){DV++;const A=k=>{const v=get(k);return Array.isArray(v)?v:[]};S.items=A('items');S.customers=A('customers');S.invoices=A('invoices');S.cats=A('cats').filter(c=>c&&c.id&&c.name);S.quotes=A('quotes').filter(q=>q&&q.id);S.expenses=A('expenses').filter(x=>x&&x.id);S.suppliers=A('suppliers').filter(x=>x&&x.id);S.purchases=A('purchases').filter(x=>x&&x.id);S.stock=A('stock').filter(x=>x&&x.id);S.files=A('files').filter(x=>x&&x.id);dataReady=true;migrate()}
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
    try{await tmo(flushDel(d),20000)}catch(e){}const pdl=new Set(lget('pdel').map(x=>x.k+':'+x.id));const [ri0,rc0,rv0,rt0,rk0,rq0,rx0,rs0,rp0,ro0,rf0]=await Promise.all([rdc('items'),rdc('customers'),rdc('invoices'),rdc('deleted').catch(()=>[]),rdc('cats').catch(()=>[]),rdc('quotes').catch(()=>[]),rdc('expenses').catch(()=>[]),rdc('suppliers').catch(()=>[]),rdc('purchases').catch(()=>[]),rdc('stock').catch(()=>[]),rdc('files').catch(()=>[])]);
    const tmb=new Map(rt0.map(t=>[t.k+':'+t.tid,t.at||0])),dead=(k,x)=>{const t=tmb.get(k+':'+x.id);return t!==undefined&&(x.u||0)<=t};
    const fl=(k,a)=>a.filter(x=>!pdl.has(k+':'+x.id)&&!dead(k,x));
    ['items','customers','invoices','cats','quotes','expenses','suppliers','purchases','stock','files'].forEach(k=>{const n=S[k].length;S[k]=S[k].filter(x=>!dead(k,x));if(S[k].length!==n){DV++;lset(k,S[k])}});
    [['items',fl('items',ri0)],['customers',fl('customers',rc0)],['invoices',fl('invoices',rv0)],['cats',fl('cats',rk0)],['quotes',fl('quotes',rq0)],['expenses',fl('expenses',rx0)],['suppliers',fl('suppliers',rs0)],['purchases',fl('purchases',rp0)],['stock',fl('stock',ro0)],['files',fl('files',rf0)]].forEach(([k,r])=>mergeK(k,r,full).up.forEach(o=>pupMark(k,o)));
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
function accWarn(r){try{(r.accs||[]).forEach(z=>{const m=pfAll().find(v=>v.n===z.n),i=m?m.accs.findIndex(a=>a.id===z.id):-1,a=i>=0&&m.accs[i];if(!a)return;const u=accUse(a.id),nm=m.n+' · '+accLbl(a,m,i);
  if(accFull(a))toast('⛔ '+nm+' وصل الليميت، ومش هيتبعت في الرسايل لحد '+(+a.dl>0&&u.d>=+a.dl?'بكرة':'أول الشهر'));else if((+a.dl>0&&u.d>=a.dl*.8)||(+a.ml>0&&u.m>=a.ml*.8))toast('⚠ '+nm+' قرب يوصل الليميت')})}catch(e){}}
function put(k,o){DV++;o.u=Date.now();if(k==='invoices'&&o&&o.accs)setTimeout(()=>accWarn(o),900);if(k==='invoices')noteCode(o);lset(k,S[k]);pushDoc(k,o)}
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

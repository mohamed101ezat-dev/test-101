/* ===== الإقفال التلقائي: يومي (12 بالليل) + أسبوعي (من الجمعة للخميس) ===== */
const clGet=()=>{try{return JSON.parse(localStorage.getItem('closes')||'{}')||{}}catch(e){return{}}};
const clSet=o=>{try{svk('closes',JSON.stringify(o))}catch(e){}};
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
/* قفل اليوم: بعدها تعديل أو حذف فواتيره محتاج الرقم السري (أو تأكيد لو مفيش رقم سري) */
function clOffer(a){const k='d'+dkey(a),C=clGet();if(C[k]&&C[k].lk)return;toast('عايز تقفّل '+dayLabel(a)+'؟','🔒 قفّل اليوم',()=>{const C2=clGet(),l=S.invoices.filter(r=>r.ts>=a&&r.ts<dEnd(a));C2[k]=Object.assign(C2[k]||{t:'d',a,at:Date.now(),...tot(l)},{lk:1,lkAt:Date.now()});clSet(C2);toast('🔒 '+dayLabel(a)+' اتقفّل. تعديل فواتيره هيحتاج تأكيد'+(lkReady()?' بالرقم السري':''))})}
function clLocked(r){if(!r||!r.ts)return null;const k='d'+dkey(dayStart(r.ts)),C=clGet();return C[k]&&C[k].lk?k:null}
function clMark(k){const C=clGet();if(!C[k])return;C[k].ed=(C[k].ed||0)+1;C[k].edAt=Date.now();clSet(C)}
let clK='d';
function drawCl(){if(clK==='m'){document.querySelectorAll('#clTab button').forEach(b=>b.classList.toggle('on',b.dataset.k==='m'));const M={};S.invoices.forEach(r=>{const d=new Date(r.ts),a=new Date(d.getFullYear(),d.getMonth(),1).getTime(),o=M[a]||(M[a]={a,n:0,s:0,p:0});if(r.type==='inv')o.n++;o.s+=val(r);o.p+=pd(r)});const L=Object.values(M).sort((x,y)=>y.a-x.a).slice(0,24);$('clBody').innerHTML=L.length?L.map(x=>`<div class="hrow" data-cl="m" data-a="${x.a}"><div class="hl"><b>${MN[new Date(x.a).getMonth()]} ${new Date(x.a).getFullYear()}</b><small class="mute">${x.n} فاتورة</small></div><div class="hr"><b class="num">${f(rd2(x.s))}</b><small class="mute num">مدفوع ${f(rd2(x.p))}</small></div></div>`).join(''):'<div class="info">مفيش شهور لسه.</div>';return}
  const C=clGet(),l=Object.values(C).filter(x=>x.t===clK).sort((x,y)=>y.a-x.a).slice(0,60);
  document.querySelectorAll('#clTab button').forEach(b=>b.classList.toggle('on',b.dataset.k===clK));
  $('clBody').innerHTML=l.length?l.map(x=>`<div class="hrow" data-cl="${x.t}" data-a="${x.a}"><div class="hl"><b>${x.lk?'🔒 ':''}${x.t==='d'?dayLabel(x.a):'من '+dshort(x.a)+' إلى '+dshort(addD(x.b,-1))}</b><small class="mute">${x.n} فاتورة</small></div><div class="hr"><b class="num">${f(x.s)}</b><small class="mute num">مدفوع ${f(x.p)}</small></div></div>`).join(''):'<div class="info">لسه مفيش إقفالات. أول إقفال هيتعمل لوحده بعد آخر اليوم.</div>'}

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
/* v342: مفتاح دمج الصنف: الاسم من غير المقاسات (4م شفاف 85×85 ← 4م شفاف) والعجلة لوحدها. بيرجّع النوع (rd/mq) وهل هو مسجل في الأصناف */
const itDim=s=>{let t=String(s||'').trim().replace(/[×xX*]/g,' × ').split(/\s+/).filter(Boolean);while(t.length>1&&/^[\d.,٠-٩×\/]+$/.test(t[t.length-1]))t.pop();return t.join(' ').replace(/\s*×\s*/g,'×').trim()};
let ITK=null;function itKey(x){if(!ITK||ITK.v!==DV){const m=new Map();S.items.forEach(i=>{const k=nm(i.name)+'|'+i.type;if(!m.has(k))m.set(k,i)});ITK={v:DV,m,byId:new Map(S.items.map(i=>[i.id,i])),L:S.items.map(i=>({n:nm(i.name),t:i.type}))}}
  const raw=String(x.n||'').trim(),base=itDim(raw)||raw,it=x.i&&ITK.byId.get(x.i),ty=(it&&it.type)||(x.t==='rd'?'rd':x.t==='mq'?'mq':''),n0=nm(base);
  const ok=!!it||ITK.L.some(i=>(!ty||i.t===ty)&&i.n&&(n0===i.n||n0.startsWith(i.n+' ')));return{k:base||raw,ty:ok?(ty||'mq'):'',ok}}
/* v351: مقاس القطعة الجاهزة (من الصنف، أو من آخر الاسم) بالأصغر الأول */
let iAllZ=false;
function itSzKey(x){const it=x.i&&ITK&&ITK.byId.get(x.i);let a=0,b=0;if(it&&+it.w>0&&+it.h>0){a=+it.w;b=+it.h}else{const m=String(x.n||'').match(/(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*$/);if(m){a=+m[1];b=+m[2]}}return a>0&&b>0?fq(Math.min(a,b))+'×'+fq(Math.max(a,b)):''}
function iAgg(a,b){const recs=S.invoices.filter(r=>r.ts>=a&&r.ts<b),G=new Map();let tot=0,cnt=0,nk=0;
  const add=(k,v,c,ty,q,dn,sk,pr)=>{if(!k)return;const o=G.get(k)||{v:0,c:0,q:0,ty:ty||'',n:dn||k};o.v=rd2(o.v+v);o.c+=c;o.q=rd2(o.q+(q||0));if(pr!=null){o.pr=rd2((o.pr||0)+pr);o.hp=1}if(sk){const z=o.z||(o.z=new Map()),s=z.get(sk)||{c:0,v:0,pr:0};s.c+=c;s.v=rd2(s.v+v);if(pr!=null)s.pr=rd2(s.pr+pr);z.set(sk,s)}G.set(k,o);tot=rd2(tot+v);cnt++};
  recs.forEach(r=>{
    if(iSub==='p'){const v=pd(r)||0;if(rd2(v)!==0)add(r.cname||'—',v,1)}
    else if(iSub==='t'){if(r.type==='inv'&&hasRet(r)){const v=rd2((r.rows||[]).reduce((a,x)=>a+(x.rt?Math.abs(+x.v||0):0),0));if(v)add(r.cname||'—',v,1)}}
    else if(iSub==='o'){if(r.type==='inv'&&ordSt(r)!=='d')add(r.cname||'—',val(r),1)}
    else if(iSub==='w'){pdBy(r).forEach(([k,v])=>{if(rd2(v||0)!==0)add(k,v,1)})}
    else if(iSub==='s'){if(r.type==='inv')add(r.cname||'—',val(r),1)}
    else if(iSub==='d'){if(r.type==='inv'){const u=rd2(val(r)-r.paid);if(u>0)add(r.cname||'—',u,1)}}
    else if(iSub==='r'){if(r.type==='inv')(r.rows||[]).forEach(x=>{if(x.k==null){nk=rd2(nk+(+x.v||0));return}{const m=itKey(x),ty=m.ok?m.ty:'u';add(ty+'|'+m.k,rd2((+x.v||0)-(+x.k||0)),(x.rt?-1:1)*(+x.c||0),ty,(x.rt?-1:1)*(+x.q||0),m.k,ty==='rd'?itSzKey(x):'')}})}
    else if(iSub==='i'){if(r.type==='inv')(r.rows||[]).forEach(x=>{/* v189: المرتجع بيتخصم من مبيعات الصنف */{const m=itKey(x),ty=m.ok?m.ty:'u';add(ty+'|'+m.k,+x.v||0,(x.rt?-1:1)*(+x.c||0),ty,(x.rt?-1:1)*(+x.q||0),m.k,ty==='rd'?itSzKey(x):'',x.k!=null?rd2((+x.v||0)-(+x.k||0)):null)}})}});
  return{G,tot,cnt,nk,n:recs.length,inv:recs.filter(r=>r.type==='inv').length}}
const PNAME={d:'النهارده',ys:'أمس',d2:'قبل أمس',d3:'قبل 3 أيام',d4:'قبل 4 أيام',d5:'قبل 5 أيام',d6:'قبل 6 أيام',w3:'آخر 3 أيام',w:'آخر 7 أيام',w30:'آخر 30 يوم'},SNAME={s:'المبيعات',p:'المدفوع',d:'المديونيات',t:'المرتجع',i:'الأصناف',w:'طرق الدفع',o:'الطلبيات',r:'الربح',x:'المصروفات والصافي',z:'ملخص الفترة'};
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
  /* v295: ملخص واضح فوق (المبيعات كبيرة + مقارنة + 3 مربعات)، وتحت قايمة واحدة بالتفاصيل اللي ليها قيمة بس */
  let rt=0;recs.forEach(r=>{if(r.type==='inv'&&hasRet(r))(r.rows||[]).forEach(x=>{if(x.rt)rt=rd2(rt+Math.abs(+x.v||0))})});
  const P=iAggK('r',R.a,R.b),I=iAggK('i',R.a,R.b),W=iAggK('w',R.a,R.b),top=G=>[...G].sort((x,y)=>y[1].v-x[1].v);
  const pu=puIn(R.a,R.b).buy,exA=rd2(T.ex+pu),net=rd2(T.s-exA),WV0=skWasteRange(R.a,R.b).v;
  const cmp='',bd='';/* v354: مفيش مقارنات في التقارير إلا لو اتطلبت */
  $('infoSum').innerHTML='<div class="rhero"><small>'+esc(R.u==='g'?'من '+dshort(R.a)+' إلى '+dshort(R.b-1):rLab(R))+(R.b>Date.now()&&R.a<=Date.now()&&R.u!=='d'?' (لحد دلوقتي)':'')+'</small>'
    +'<div class="rbig"><b class="num">'+f(T.s)+'</b><span>مبيعات · '+plN(T.n,'فاتورة')+'</span>'+bd+'</div>'
    +(cmp?'<span class="rcmp">'+esc(cmp)+'</span>':'')
    +'<div class="rtiles"><div class="rt ok"><small>اتدفع</small><b class="num">'+f(T.p)+'</b></div><div class="rt'+(exA?' bad':'')+'"><small>المصروفات</small><b class="num">'+f(exA)+'</b></div>'+(P.cnt?'<div class="rt'+(rd2(P.tot-T.ex-WV0)<0?' bad':' ok')+'"><small>الربح</small><b class="num">'+f(rd2(P.tot-T.ex-WV0))+'</b></div>':'<div class="rt'+(net<0?' bad':'')+'"><small>الفرق (مش ربح)</small><b class="num">'+f(net)+'</b></div>')+'</div></div>';
  $('iCmpL').textContent='';
  const row=(k,em,l,sm,v,cls)=>'<button type="button" class="rrow" data-rk="'+k+'"><span class="rl">'+em+' '+l+(sm?' <small>· '+esc(sm)+'</small>':'')+'</span>'+(v!==''?'<b'+(cls?' class="'+cls+'"':'')+'>'+v+'</b>':'')+'<i>‹</i></button>';
  const ti=top(I.G)[0],tw=top(W.G).slice(0,2).map(([k,o])=>k+' '+f(o.v)).join(' · ');
  let m=(T.n||T.p||exA?row('z','📊','ملخص الفترة','بعت · دخل · صرفت · الصافي',''):'')+row('s','🧾','الفواتير',plN(T.n,'فاتورة')+(T.c?' · '+plN(T.c,'عميل'):''),f(T.s))+row('p','💵','الفلوس اللي دخلت',tw||'',f(T.p),'cr');
  if(exA)m+=row('x','💸','المصروفات',pu?'منها مشتريات موردين '+f(pu):'',f(exA),'dr');
  if(P.cnt)m+=row('r','📈','الربح',WV0>0?'بعد المصروفات والهادر':'بعد المصروفات',f(rd2(P.tot-T.ex-WV0)));
  if(rt)m+=row('t','↩️','المرتجع','',f(rt));
  if(ti)m+=row('i','📦','الأصناف','الأكتر: '+(ti[1].n||ti[0]),'');
  const dbl=dbRep(dbAsOf(R)),dbt=rd2(dbl.reduce((a,x)=>a+x.b,0));if(dbl.length)m+=row('d','📒','المديونيات',plN(dbl.length,'عميل')+(dbAsOf(R)<=Date.now()?' · لحد '+dshort(dbAsOf(R)-1):' · لحد دلوقتي'),f(dbt),'dr');
  if(ordOn()){const oc=recs.filter(r=>r.type==='inv'&&ordSt(r)!=='d').length;if(oc)m+=row('o','⏳','طلبيات لسه ما اتسلمتش',plN(oc,'طلبية'),'')}
  $('iRows').innerHTML=T.n||T.p||exA||dbl.length?'<div class="rstp">التفاصيل · دوس على أي سطر يفتح ورقته <button type="button" class="lnk" data-allz="1" style="font-size:12px">'+(iAllZ?'☑️':'☐')+' كل المقاسات المسجلة</button></div><div class="rbox">'+m+'</div>':'<div class="info" style="margin-top:8px">مفيش معاملات في الفترة دي.</div>'}
$('iRows').addEventListener('click',e=>{if(e.target.closest('[data-allz]')){iAllZ=!iAllZ;drawInfo();return}const b=e.target.closest('[data-rk]');if(!b)return;iSub=b.dataset.rk;repGo()});
/* ورقة التقرير: جدول تفاصيل للفترة والنوع المختارين، بتفتح كصورة تتحفظ أو تتبعت */
/* v361: المديونيات لحد تاريخ: كل عميل عليه فلوس ساعتها، وآخر دفعة وآخر معاملة قبل التاريخ ده */
function dbRep(asOf){const out=[];S.customers.forEach(c=>{let b=c.open||0,lp=0,lt=0;ledger(c).forEach(r=>{if(r.ts>=asOf)return;b=rd2(b+net(r));if(r.ts>lt)lt=r.ts;if(((r.type==='pay'&&r.amount>0)||(r.type==='inv'&&r.paid>0))&&r.ts>lp)lp=r.ts});if(b>=1)out.push({c,b:rd2(b),lp,lt})});return out.sort((x,y)=>y.b-x.b)}
const dbAsOf=R=>Math.min(R.b,Date.now()+1);
function repGo(){
  const R=iRange(),sb=iSub,fm=t=>{const d=new Date(t);return d.getDate()+'/'+(d.getMonth()+1)},CAP=300,
    cd=r=>r.type==='pay'?'دفعة'+(r.code?' '+r.code:''):(r.code||'#'+r.no),
    recs=S.invoices.filter(r=>r.ts>=R.a&&r.ts<R.b).sort((x,y)=>y.ts-x.ts);
  let tb=null,sum=[],tot=0,note='',rows=[],ITG=null,dLab='الأرصدة لحد دلوقتي';
  /* v363: تجميع بالأيام مع إجمالي كل يوم */
  const dk=t=>{const d=new Date(t);return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()},dl=t=>{const d=new Date(t);return WD[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1)},HB='#dbe7f5',
    byDay=l=>{const m=new Map();l.forEach(r=>{const k=dk(r.ts);(m.get(k)||m.set(k,[]).get(k)).push(r)});return[...m.values()]};
  if(sb==='s'){const l=recs.filter(r=>r.type==='inv'),rs=r=>Math.max(0,rd2(val(r)-pd(r)));tot=rd2(l.reduce((a,r)=>a+val(r),0));const rest=rd2(l.reduce((a,r)=>a+rs(r),0)),R2=[];
    byDay(l).forEach(g=>{R2.push(Object.assign([dl(g[0].ts),plN(g.length,'فاتورة'),f(g.reduce((a,r)=>a+val(r),0)),f(g.reduce((a,r)=>a+pd(r),0)),f(g.reduce((a,r)=>a+rs(r),0))],{bg:HB}));g.forEach(r=>R2.push(Object.assign([r.cname,r.code||'#'+r.no,f(val(r)),f(pd(r)),rs(r)>0?f(rs(r)):'—'],rs(r)>0?{bg:'#fde9e8'}:{})))});
    rows=l.length?[0]:[];tb={th:[],w:[]};ITG=[{th:['العميل','فاتورة','القيمة','المدفوع','المتبقي'],w:[.32,.17,.18,.17,.16],rows:R2}];
    sum=[['عدد الفواتير',String(l.length)],['إجمالي المبيعات',f(tot),1],['المدفوع',f(T0())],['لسه ما اتدفعش',f(rest)]]}
  else if(sb==='p'){const l=recs.filter(r=>rd2(pd(r)||0)!==0),G=new Map();tot=rd2(l.reduce((a,r)=>a+pd(r),0));let col=0;const R2=[];
    l.forEach(r=>{pdBy(r).filter(([k,v])=>rd2(v||0)!==0).forEach(([k,v])=>G.set(k,rd2((G.get(k)||0)+v)));if(r.type==='pay')col=rd2(col+pd(r))});
    byDay(l).forEach(g=>{R2.push(Object.assign([dl(g[0].ts),plN(g.length,'عملية'),'',f(g.reduce((a,r)=>a+pd(r),0))],{bg:HB}));g.forEach(r=>{const m=pdBy(r).filter(([k,v])=>rd2(v||0)!==0);R2.push([r.cname,cd(r),m.map(([k,v])=>k+(m.length>1?' '+f(v):'')).join(' + '),f(pd(r))])})});
    const T1=[['الإجمالي',f(tot)],...[...G].sort((x,y)=>y[1]-x[1]).map(([k,v])=>['منه '+k,f(v)])];if(col)T1.push(['منها تحصيل ديون (دفعات)',f(col)]);
    T1[0].bg='#dcefe1';rows=l.length?[0]:[];tb={th:[],w:[]};ITG=[{title:'💵 الفلوس اللي دخلت',th:['البند','المبلغ'],w:[.62,.38],rows:T1},{title:'التفاصيل بالأيام',th:['العميل','الكود','طريقة الدفع','المبلغ'],w:[.3,.2,.28,.22],rows:R2}];
    sum=[['عدد العمليات',String(l.length)],['إجمالي المدفوع',f(tot),1]]}
  else if(sb==='d'){const as=dbAsOf(R),l=dbRep(as);dLab=as<=Date.now()?'الأرصدة لحد '+dshort(as-1):'الأرصدة لحد دلوقتي';tot=rd2(l.reduce((a,x)=>a+x.b,0));
    rows=l.map(x=>[x.c.name,f(x.b),x.lp?fm(x.lp)+' · '+agoTxt(x.lp):'لسه ما دفعش',x.lt?fm(x.lt)+' · '+agoTxt(x.lt):'—']);
    tb={th:['العميل','عليه','آخر دفعة','آخر معاملة'],w:[.30,.16,.27,.27]};sum=[['عدد المديونين',String(l.length)],['إجمالي المديونيات',f(tot),1]]}
  else if(sb==='t'){let n=0;recs.filter(r=>r.type==='inv'&&hasRet(r)).forEach(r=>(r.rows||[]).filter(x=>x.rt).forEach(x=>{const v=rd2(Math.abs(+x.v||0));n++;tot=rd2(tot+v);rows.push([fm(r.ts),r.cname,String(x.n||'').trim()||'—',f(v)])}));
    tb={th:['التاريخ','العميل','الصنف','القيمة'],w:[.17,.33,.30,.20]};sum=[['عدد البنود',String(n)],['إجمالي المرتجع',f(tot),1]]}
  else if(sb==='x'){const l=exIn(R.a,R.b).sort((x,y)=>y.ts-x.ts),pu=puIn(R.a,R.b).buy,sl=rd2(recs.filter(r=>r.type==='inv').reduce((a,r)=>a+val(r),0));tot=exTot(l);const C=new Map(),R2=[];l.forEach(x=>{const o=C.get(x.cat)||{n:0,v:0};o.n++;o.v=rd2(o.v+(+x.amt||0));C.set(x.cat,o)});
    byDay(l).forEach(g=>{R2.push(Object.assign([dl(g[0].ts),'',f(g.reduce((a,x)=>a+(+x.amt||0),0))],{bg:HB}));g.forEach(x=>R2.push([x.cat,x.note||'',f(x.amt)]))});
    rows=l.length?[0]:[];tb={th:[],w:[]};ITG=[{title:'💸 المصروفات حسب النوع',th:['النوع','العدد','المبلغ'],w:[.5,.2,.3],rows:[...C].sort((x,y)=>y[1].v-x[1].v).map(([k,o])=>[k,String(o.n),f(o.v)])},{title:'التفاصيل بالأيام',th:['النوع','ملاحظة','المبلغ'],w:[.3,.45,.25],rows:R2}];
    sum=[['المبيعات',f(sl)],['− المصروفات',f(tot)],...(pu?[['− مشتريات الموردين',f(pu)]]:[]),['= الفرق (مش ربح: مش طارح تمن البضاعة)',f(rd2(sl-tot-pu)),1]]}
  else if(sb==='z'){const inv=recs.filter(r=>r.type==='inv'),sl=rd2(inv.reduce((a,r)=>a+val(r),0)),inc=rd2(recs.reduce((a,r)=>a+pd(r),0)),exv=exTot(exIn(R.a,R.b)),pu=puIn(R.a,R.b).buy,nd=rd2(inv.reduce((a,r)=>a+Math.max(0,val(r)-pd(r)),0));let cash=0;
    recs.forEach(r=>pdBy(r).forEach(([n,v])=>{if(/^(كاش|نقدي)$/.test(String(n).trim()))cash+=+v||0}));cash=rd2(cash);const net=rd2(inc-exv-pu);
    rows=[0];tb={th:['البند','المبلغ'],w:[.62,.38]};
    ITG=[{title:'📊 ملخص الفترة',th:['البند','المبلغ'],w:[.62,.38],rows:[Object.assign(['🧾 بعت ('+plN(inv.length,'فاتورة')+')',f(sl)],{bg:'#e8f1fb'}),Object.assign(['💵 دخل (مدفوع)',f(inc)],{bg:'#e6f4e6'}),['   منه كاش',f(cash)],['   منه تحويلات',f(rd2(inc-cash))],Object.assign(['💸 صرفت',f(exv)],{bg:'#fde9e8'}),...(pu?[['   منها مشتريات موردين',f(pu)]]:[]),['📒 اتضاف مديونيات جديدة',f(nd)]]}];
    sum=[['الصافي (دخل − مصروفات)',f(net),1]]}
  else if(sb==='o'){const l=recs.filter(r=>r.type==='inv'&&ordSt(r)!=='d');tot=rd2(l.reduce((a,r)=>a+val(r),0));rows=l.map(r=>[fm(r.ts),r.cname,r.code||'#'+r.no,ordSt(r)==='p'?'تحت التجهيز':'جاهز',f(val(r))]);
    tb={th:['التاريخ','العميل','فاتورة','الحالة','القيمة'],w:[.14,.29,.15,.22,.20]};sum=[['عدد الطلبيات',String(l.length)],['إجمالي القيمة',f(tot),1]]}
  else{const A=iAgg(R.a,R.b);tot=A.tot;rows=[...A.G].sort((x,y)=>y[1].v-x[1].v).map(([k,o])=>[o.n||k,sb==='w'?String(o.c):f(o.c),f(o.v)]);
    tb={th:[sb==='w'?'الطريقة':'الصنف',sb==='w'?'عدد':'الكمية',sb==='r'?'الربح':sb==='w'?'المبلغ':'المبلغ'],w:[.5,.2,.3]};
    if(sb==='i'||sb==='r'){/* v352: جاهز (بمقاساته: عدد، سعر القطعة، ربح، متبقي) ثم مقطع ثم غير مسجلة */const GR=[['rd','📦 شغل جاهز'],['mq','✂️ مقطع'],['u','❔ غير مسجلة في الأصناف']],SM=new Map();try{stkAll().forEach((o,id)=>SM.set(id,o))}catch(e){}
      const szk=i=>{const a=+i.w,b=+i.h;return a>0&&b>0?fq(Math.min(a,b))+'×'+fq(Math.max(a,b)):''},bal=(n0,sz)=>{let t=null;S.items.forEach(i=>{if(i.type!=='rd'||nm(i.name)!==nm(n0))return;if(sz&&szk(i)!==sz)return;const o=SM.get(i.id);if(o)t=(t||0)+o.bal});return t};
      const PAL=[['#e8f1fb','#cfe2f7'],['#fdf0dc','#f9deb5'],['#e6f4e6','#cde8cd'],['#f3e9fa','#e3cff2'],['#fde9e8','#f8cfcd'],['#e5f4f4','#c8e6e6']],WS={3:[.46,.24,.30],4:[.36,.14,.2,.30],5:[.30,.12,.17,.23,.18],6:[.26,.1,.14,.2,.16,.14]};
      /* v362: أعمدة ثابتة في كل الأقسام، واسم الصنف أول سطر ومقاساته تحته، والصنف بمقاس واحد سطر واحد */
      const all=[...A.G],pu=sb==='i',hasPr=pu&&all.some(([k,o])=>o.hp),hasSt=all.some(([k,o])=>(o.ty||'u')==='rd'&&bal(o.n)!=null),
        th=['الصنف','العدد',...(pu?['سعر الوحدة']:[]),sb==='r'?'الربح':'المبلغ',...(hasPr?['الربح']:[]),...(hasSt?['المخزن']:[])],
        W6={4:[.34,.2,.2,.26],5:[.3,.19,.15,.18,.18],6:[.26,.17,.12,.16,.15,.14]},
        cell=(n,c,q,v,pr,st,mq)=>[n,f(c)+(mq&&q?' · '+fq(q)+'م²':''),...(pu?[mq?(q>0?f(rd2(v/q)):'—'):(c>0?f(rd2(v/c)):'—')]:[]),f(v),...(hasPr?[pr!=null?f(pr):'—']:[]),...(hasSt?[st!=null?fq(rd2(st)):'—']:[])];
      ITG=GR.map(([t,ti])=>{const L=all.filter(([k,o])=>(o.ty||'u')===t).sort((x,y)=>y[1].v-x[1].v),rows=[];
        L.forEach(([k,o],gi)=>{const pl=PAL[gi%PAL.length],mk=(r,bg)=>{r.bg=bg;return r},mq=t==='mq';let zl=[];
          if(t==='rd'){const z=new Map(o.z||[]);if(iAllZ)S.items.forEach(i=>{if(i.type==='rd'&&nm(i.name)===nm(o.n)&&szk(i)&&!z.has(szk(i)))z.set(szk(i),{c:0,v:0,pr:0,z0:1})});zl=[...z].sort((p,q)=>(q[1].c-p[1].c)||(q[1].v-p[1].v))}
          const nmx=o.n||k;
          if(zl.length===1){const[s,v]=zl[0];rows.push(mk(cell(nmx+' ⁦'+s+'⁩',v.c,0,v.v,o.hp&&!v.z0?v.pr:null,bal(o.n,s),0),pl[1]));return}
          rows.push(mk(cell(nmx,o.c,o.q,o.v,o.hp?o.pr:null,t==='rd'?bal(o.n):null,mq),pl[1]));
          zl.forEach(([s,v])=>rows.push(mk(cell('      ↳ ⁦'+s+'⁩',v.c,0,v.v,o.hp&&!v.z0?v.pr:null,bal(o.n,s),0),pl[0])))});
        return{title:ti,th,w:W6[th.length]||[.46,.24,.30],rows}}).filter(g=>g.rows.length)}
    if(sb==='r'){const ex=exTot(exIn(R.a,R.b));{const WV=skWasteRange(R.a,R.b);sum=[['ربح الأصناف',f(tot)],['− مصروفات الفترة',f(ex)],...(WV.v>0?[['− خسارة هادر الألواح ('+fq(WV.m)+' م²)',f(WV.v)]]:[]),['= صافي الربح',f(rd2(tot-ex-WV.v)),1]]}if(A.nk)note='مبيعات بقيمة '+f(A.nk)+' ملهاش سعر شراء، مش داخلة في الربح.'}
    else{sum=[[sb==='w'?'إجمالي المدفوع':'إجمالي مبيعات الأصناف',f(tot),1]];if(sb==='i'){const ph=[...A.G].reduce((s,[k,o])=>s+(o.hp?o.pr:0),0);if(ph)sum.push(['إجمالي الربح',f(rd2(ph)),1])}}}
  if(!rows.length){toast(sb==='d'?'مفيش مديونين ✓':sb==='x'?'مفيش مصروفات متسجلة في الفترة دي':'مفيش بيانات في الفترة دي');return}
  if(rows.length>CAP){note=(note?note+' ':'')+'ظهر أول '+CAP+' من '+rows.length+' بس. اضغط «تصدير Excel» للتفاصيل كاملة.';rows=rows.slice(0,CAP)}
  tb.rows=rows;
  const lab=perLab(R),cv=sheet({title:'تقرير '+SNAME[sb],name:'',sub:sb==='d'?dLab:lab,date:stamp(Date.now()),tables:ITG&&ITG.length?ITG:[tb],sum,note});
  showImg(cv,'تقرير-'+SNAME[sb]+'-'+dshort(R.a).replace(/\//g,'-')+'.png','تقرير '+SNAME[sb]+' · '+(sb==='d'?dLab:lab),false,'',null);
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
/* v322: بيانات التحويل كرسالة لوحدها (مش مربوطة بفاتورة ولا عميل) */
const tfSel=new Set();let tfInit=false,tfCust=null;
/* v324: طرق الدفع اللي ليها رقم + نص الرسالة (مشترك بين النافذة والمديونين) */
const tfAmtOn=()=>pget('tfAmt',true);
/* v330: بيانات التحويل تظهر فين (فوق / المديون / العميل / الإعدادات) */
const TFP=['tfHdr','tfSet'],tfAt=k=>pget(k,true);
function tfPlaces(){try{$('tfBtn').classList.toggle('hide',!tfAt('tfHdr'));$('tfOpen2').classList.toggle('hide',!tfAt('tfSet'));TFP.forEach(k=>{const e=$(k);if(e)e.checked=tfAt(k)})}catch(e){}}
const tfNums=()=>pfAll().filter(x=>x.on!==false&&pmW(x,'tf')&&pmPick(x));
const tfLine=x=>{const a=pmPick(x);if(!a)return'';if(x.bank){const p=[a.bn&&'🏦 '+a.bn,a.holder&&'باسم: '+a.holder,a.acct&&'رقم الحساب: '+a.acct,a.iban&&'IBAN: '+a.iban,a.card&&'رقم الكارت: '+a.card].filter(Boolean).map(s=>String(s).trim());return'• '+x.n+':\n   '+p.join('\n   ')}return'• '+x.n+': '+String(a.num).trim()};
function tfMake(L,a,nm){let t=(nm?'أهلاً يا '+nm+' 👋\n':'')+'💳 بيانات التحويل'+(shopN()?' · '+shopN():'')+'\n';if(a>0)t+='المطلوب: '+f(a)+' جنيه\n';
  return t+L.map(tfLine).join('\n')+'\n\nبعد التحويل ابعتلنا صورة الإيصال 🙏'}
/* كارت صغير بطرق الدفع: دوسة على الطريقة تفتح واتساب العميل بالرقم بتاعها */
function tfStrip(c,det){const L=tfNums();if(!L.length)return'<div class="dbtf"><button type="button" class="lnk" data-tfset="1">💳 ضيف أرقام التحويل من الإعدادات ← طرق الدفع</button>'+(det?'':'<button type="button" class="ab" data-dopen="'+c.id+'">👤 التفاصيل</button>')+'</div>';
  return'<div class="dbtf"><span class="mute">💳 ابعتله:</span><button type="button" class="ab tfa'+(tfAmtOn()?' on':'')+'" data-tfamt="1" aria-pressed="'+tfAmtOn()+'">'+(tfAmtOn()?'💰 بالمبلغ ✓':'💰 من غير المبلغ')+'</button>'+L.map(x=>'<button type="button" class="ab tfm" data-tfc="'+c.id+'" data-tfm="'+esc(x.n)+'">'+(pmBadge(x.n)||'💳')+'<span>'+esc(x.n.replace(/^تحويل\s+/,''))+'</span></button>').join('')+(L.length>1?'<button type="button" class="ab tfm" data-tfc="'+c.id+'" data-tfm="*">الكل</button>':'')+(det?'':'<button type="button" class="ab" data-dopen="'+c.id+'">👤 التفاصيل</button>')+'</div>'}
function tfSendC(c,m){const L=m==='*'?tfNums():tfNums().filter(x=>x.n===m);if(!c||!L.length)return;const t=tfMake(L,tfAmtOn()?Math.max(0,balOf(c)):0,c.name),n=waNum(c.phone);
  window.open('https://wa.me/'+(n||'')+'?text='+encodeURIComponent(t),'_blank','noopener');if(!n)toast('العميل ملوش رقم، اختار الشات بنفسك')}
function tfBuild(){const on=$('tfAmtOn').checked;$('tfAmt').disabled=!on;const sel=tfNums().filter(x=>tfSel.has(x.n)),a=on?nv($('tfAmt').value):0;$('tfTxt').value=sel.length?tfMake(sel,a,tfCust&&tfCust.name):''}
function tfOpen(){const L=pfAll().filter(x=>x.on!==false);if(!tfInit){L.forEach(x=>{if(pmPick(x))tfSel.add(x.n)});tfInit=true}
  const has=L.filter(x=>pmPick(x));
  $('tfList').innerHTML=(L.map(x=>{const pk=pmPick(x),ok=!!pk;return'<label class="tfi'+(ok?'':' no')+'"><input type="checkbox" data-tfn="'+esc(x.n)+'"'+(ok&&tfSel.has(x.n)?' checked':'')+(ok?'':' disabled')+'><span class="tfl">'+(pmBadge(x.n)||'💳')+'</span><b>'+esc(x.n)+'</b><span class="mute num">'+(ok?esc(accShow(pk,x)):'مفيش رقم شغّال')+'</span></label>'}).join(''))
    +(has.length<L.length?'<button type="button" class="lnk" id="tfGo" style="font-size:12px">➕ ضيف الأرقام من الإعدادات ← طرق الدفع</button>':'');
  $('tfAmtOn').checked=tfAmtOn();tfCust=null;$('tfQ').value='';$('tfPh').value='';$('tfAmt').value='';$('tfSug').innerHTML='';$('tfMsg').textContent='';tfBuild();$('tfOv').classList.remove('hide')}
$('tfBtn').onclick=tfOpen;
/* v333: تسوية الكسور: بنعدّل الرصيد الافتتاحي بالفرق علشان الحساب يبقى رقم صحيح */
const fracList=()=>S.customers.map(c=>({c,b:balRaw(c)})).filter(x=>Math.abs(x.b-Math.round(x.b))>0.001||(x.b!==0&&Math.abs(x.b)<1));
/* v335: بنعدّل الرصيد الافتتاحي، وبعدين بنعيد حساب الفواتير (اللي بتتقرب لوحدها) ونعدّل تاني لو لسه فيه فرق */
function fracSettle(cs){for(let k=0;k<3;k++){let ch=false;cs.forEach(c=>{const b=balRaw(c),t=Math.abs(b)<1?0:Math.round(b);if(Math.abs(t-b)>0.001){c.open=rd2((c.open||0)+(t-b));put('customers',c);ch=true}try{reflow(c.id)}catch(_){}});DV++;if(!ch)break}}
function fracDraw(){const e=$('fracInfo');if(!e)return;const l=fracList();e.textContent=l.length?'حسابات فيها كسور: '+l.length:'مفيش كسور ✓';$('fracFix').disabled=!l.length}
$('fracFix').onclick=e=>{const l=fracList();if(!l.length)return;if(!ok2(e.currentTarget))return;fracSettle(l.map(x=>x.c));fracDraw();try{drawDash()}catch(_){}toast('✓ اتسوّت الكسور في '+l.length+' حساب')};tfPlaces();TFP.forEach(k=>$(k).addEventListener('change',()=>{svk(k,$(k).checked?'1':'0');tfPlaces();try{drawDebt()}catch(e){}try{drawCusts()}catch(e){}}));
/* v327: رابط احتياطي على Firebase Hosting (لو GitHub وقع أو الموبايل اتغير) */
$('mirCp').onclick=async()=>{try{await navigator.clipboard.writeText($('mirUrl').value);$('mirMsg').textContent='✅ اتنسخ. ابعته لنفسك على واتساب علشان يبقى معاك'}catch(e){$('mirUrl').select();$('mirMsg').textContent='الرابط متعلّم، انسخه بإيدك'}};$('tfOpen2').onclick=()=>{tfOpen();setTimeout(()=>$('tfQ').focus(),50)};
$('tfX').onclick=()=>$('tfOv').classList.add('hide');
$('tfOv').addEventListener('click',e=>{if(e.target===$('tfOv'))$('tfOv').classList.add('hide');
  if(e.target.closest('#tfGo')){$('tfOv').classList.add('hide');document.querySelector('#hdrSet').click();stGo('pay')}});
$('tfList').addEventListener('change',e=>{const i=e.target.closest('[data-tfn]');if(!i)return;i.checked?tfSel.add(i.dataset.tfn):tfSel.delete(i.dataset.tfn);tfBuild()});
$('tfAmt').addEventListener('input',tfBuild);$('tfAmtOn').addEventListener('change',()=>{pset('tfAmt',$('tfAmtOn').checked);tfBuild()});
$('tfQ').addEventListener('input',()=>{const q=$('tfQ').value.trim();tfCust=null;if(!q){$('tfSug').innerHTML='';tfBuild();return}
  const l=S.customers.filter(x=>qm(x.name,q)||(x.phone&&String(x.phone).includes(q))).sort((a,b)=>balOf(b)-balOf(a)).slice(0,6);
  $('tfSug').innerHTML=l.map(x=>'<button type="button" class="tfs" data-tfcu="'+x.id+'"><b>'+esc(x.name)+'</b><span class="mute num">'+(balOf(x)>0?'عليه '+f(balOf(x)):(x.phone?esc(x.phone):''))+'</span></button>').join('')||'<div class="mute" style="font-size:12px">مفيش عميل بالاسم ده</div>';tfBuild()});
$('tfSug').addEventListener('click',e=>{const b=e.target.closest('[data-tfcu]');if(!b)return;const x=getC(b.dataset.tfcu);if(!x)return;tfCust=x;$('tfQ').value=x.name;$('tfPh').value=x.phone||'';$('tfAmt').value=balOf(x)>0?fq(balOf(x)):'';$('tfSug').innerHTML='';$('tfMsg').textContent=x.phone?'':'⚠ العميل ده ملوش رقم، اكتبه تحت';tfBuild()});
const tfTx=()=>$('tfTxt').value.trim();
$('tfWa').onclick=()=>{const t=tfTx();if(!t){$('tfMsg').textContent='علّم طريقة واحدة على الأقل ليها رقم';return}const n=$('tfPh').value.trim()?waNum($('tfPh').value):'';window.open('https://wa.me/'+n+'?text='+encodeURIComponent(t),'_blank','noopener')};
$('tfCp').onclick=async()=>{const t=tfTx();if(!t){$('tfMsg').textContent='مفيش حاجة تتنسخ';return}try{await navigator.clipboard.writeText(t);$('tfMsg').textContent='✅ اتنسخت'}catch(e){$('tfTxt').select();$('tfMsg').textContent='النص متعلّم، انسخه بإيدك'}};
$('tfSh').onclick=async()=>{const t=tfTx();if(!t){$('tfMsg').textContent='مفيش حاجة تتبعت';return}if(navigator.share){try{await navigator.share({text:t})}catch(e){}}else $('tfCp').click()};
$('clOv').addEventListener('click',e=>{if(e.target===$('clOv'))$('clOv').classList.add('hide')});
$('clTab').onclick=e=>{const k=e.target.dataset.k;if(!k)return;clK=k;drawCl()};
$('clBody').onclick=e=>{const r=e.target.closest('[data-cl]');if(!r)return;r.dataset.cl==='d'?showClose(+r.dataset.a):r.dataset.cl==='m'?showMonth(+r.dataset.a):showWeek(+r.dataset.a)};
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


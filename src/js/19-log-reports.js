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
  {const du=rd2(l.reduce((a,r)=>a+dueOf(r),0));$('hTot').textContent='المعروض تحت: '+(pm?l.length+' عملية · المدفوع '+f(l.reduce((a,r)=>a+pd(r),0)):plN(l.length,'معاملة')+' · مبيعات '+f(l.reduce((a,r)=>a+val(r),0))+' · مدفوع '+f(l.reduce((a,r)=>a+pd(r),0))+(du>0&&!wkOn()?' · متبقي '+f(du):''))}
  {const bk=$('hBrk');if(pm&&l.length){const G=new Map();l.forEach(r=>pdBy(r).forEach(([k,v])=>G.set(k,rd2((G.get(k)||0)+v))));bk.textContent='💵 '+[...G].sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+f(v)).join(' · ');bk.classList.remove('hide')}else bk.classList.add('hide')}
  let last='',h='';
  l.slice(0,win?l.length:hLim).forEach(r=>{const k=dshort(r.ts);
    if(!flat&&k!==last){last=k;h+=`<div class="hday"><span>${dayLabel(r.ts)}</span><span class="num">${pm?'':'مبيعات '+f(T[k].s)+' · '}مدفوع ${f(T[k].p)}</span>${pget('dayCl',true)?`<button class="lnk" data-dc="${r.ts}" style="padding:1px 9px;font-size:calc(var(--fs) - 1px)">${clLocked(r)?'🔒 ':''}🧾 إقفال</button>`:''}</div>`}
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
/* v333: كشف المحافظ: كل رقم دخل عليه كام في اليوم ده وكام من أول الشهر (علشان تطابق مع رصيد المحفظة) */
function accDay(a){const b=dEnd(a),d=new Date(a),m0=new Date(d.getFullYear(),d.getMonth(),1).getTime(),M={};
  S.invoices.forEach(r=>{if(!r||!Array.isArray(r.accs)||r.ts<m0||r.ts>=b)return;r.accs.forEach(z=>{const k=z.n+'|'+z.id,o=M[k]||(M[k]={n:z.n,id:z.id,d:0,m:0});o.m+=+z.a||0;if(r.ts>=a)o.d+=+z.a||0})});
  const L=pfAll(),rows=Object.values(M).filter(o=>o.d>0||o.m>0).map(o=>{const x=L.find(v=>v.n===o.n),i=x?x.accs.findIndex(v=>v.id===o.id):-1,ac=i>=0&&x.accs[i];return[o.n+(ac&&x.accs.length>1?' · '+accLbl(ac,x,i):''),f(o.d),f(o.m)]});
  return rows.length?[{title:'💳 المحافظ والتحويلات',th:['الرقم','اليوم','من أول الشهر'],w:[.46,.24,.3],rows}]:[]}
/* v341: ملخص تقفيلة اليوم: المبيعات، الكاش والتحويلات، المصروفات، الخزنة، المديونيات */
function clSum(a,l,inv){let cash=0,tr=0;l.forEach(r=>pdBy(r).forEach(([n,v])=>{if(/^(كاش|نقدي)$/.test(String(n).trim()))cash+=+v||0;else tr+=+v||0}));
  const ex=S.expenses.filter(x=>x.ts>=a&&x.ts<dEnd(a)).reduce((s,x)=>s+(+x.amt||0),0),D=drwCalc(a),k='d'+dkey(a),C=clGet()[k];
  const o=[['عدد الفواتير',String(inv.length)],['إجمالي المبيعات',f(l.reduce((x,r)=>x+val(r),0))],['المدفوع كاش',f(rd2(cash))],['المدفوع تحويلات',f(rd2(tr))],['إجمالي المدفوع',f(l.reduce((x,r)=>x+pd(r),0)),1]];
  if(ex)o.push(['المصروفات',f(rd2(ex))]);o.push(['المفروض في الدرج',f(D.exp)]);
  if(D.act!=null){const d=rd2(D.act-D.exp);o.push(['اتعدّ في الدرج',f(D.act)]);o.push([Math.abs(d)<1?'الخزنة مظبوطة ✓':d<0?'⚠ عجز':'زيادة',Math.abs(d)<1?'0':f(Math.abs(d)),1])}
  o.push(...clDiff(k,l));if(C&&C.lk)o.push(['🔒 اليوم متقفّل'+(C.ed?' · اتعدّل بعده '+C.ed+' مرة':''),'']);o.push(['إجمالي المديونيات الآن',f(debtAll()),1]);return o}
function showClose(ts){const a=dayStart(ts),l=S.invoices.filter(r=>r.ts>=a&&r.ts<dEnd(a)).sort((x,y)=>x.ts-y.ts);setTimeout(()=>clOffer(a),700);
  if(!l.length){$('hTot').textContent='مفيش معاملات في اليوم ده';return}
  const inv=l.filter(r=>r.type==='inv');
  const cv=sheet({title:'إقفال اليوم',name:'',sub:dayLabel(a),date:stamp(Date.now()),
    tables:[{th:['العميل','النوع','القيمة','المدفوع'],w:[.38,.18,.22,.22],rows:l.map(r=>[r.cname,numTag(r),r.type==='pay'?'-':f(val(r)),f(pd(r))])},...accDay(a)],
    sum:clSum(a,l,inv)});
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
    sum:[['عدد الفواتير',String(l.filter(r=>r.type==='inv').length)],['إجمالي المبيعات',f(sS)],['إجمالي المدفوع',f(sP),1],...(ex.length||pu.n?[['إجمالي المصروفات',f(eT)],...(pu.n?[['مشتريات الموردين',f(pu.buy)],['دفعات الموردين',f(pu.pay)]]:[]),['الصافي بعد المصروفات',f(sS-eT-pu.buy),1],['الكاش بعد المصروفات',f(sP-eT-pu.pay)]]:[]),...(()=>{const W=skWasteRange(a,b);return W.m>0?[['🗑 هادر الألواح ('+fq(W.m)+' م²)',f(W.v)]]:[]})(),['إجمالي المديونيات الآن',f(debtAll()),1]]});
  showImg(cv,'تقرير-'+y+'-'+two(mo+1)+'.png','تقرير '+MN[mo]+' '+y,false,'',null)}
$('dayClose').onclick=()=>showClose(Date.now());
$('monRep').onclick=()=>showMonth(Date.now());
$('res').addEventListener('click',e=>{if(e.target===$('res'))$('res').classList.add('hide')});

/* النقر على المعاملات في الداشبورد */
let infoMode=false,dbMode=false,dbSel=null,dbPay=null,dbSt=null,iSc='',dbTf=null;
/* دفعة من صفحة المديون: نفس حساب "خصم من المدفوع" اللي في الفاتورة */
function dbPayGo(btn){const c=getC(dbSel),m=$('dbp_msg');if(!c||!m)return;const r=pwRecord('db',c);
  if(!r){m.textContent='اكتب المبلغ المدفوع';const a=document.querySelector('[data-pw="db"] .spa');if(a)a.focus();return}
  if(btn.disabled)return;btn.disabled=true;
  S.invoices.push(r);put('invoices',r);lastSaved={id:r.id,at:Date.now(),dueBak:payDone(c,r)};dbPay=null;delete PW.db;try{document.activeElement.blur()}catch(e){}drawDash();showRec(r,false,'تم تسجيل الدفعة ✓').then(()=>{if($('autoWa').checked)autoSend(r)})}
function drawDebt(){$('hMain').classList.toggle('hide',dbMode||infoMode);$('infoView').classList.toggle('hide',!infoMode||dbMode);$('infoCard').classList.toggle('on',infoMode&&!dbMode);$('dbView').classList.toggle('hide',!dbMode);$('dbCard').classList.toggle('on',dbMode);if(!dbMode)return;
  let c=dbSel&&getC(dbSel);if(dbSel&&!c)dbSel=null;
  $('dbList0').classList.toggle('hide',!!c);$('dbDet').classList.toggle('hide',!c);
  if(c){let run=c.open||0;const rows=ledger(c).slice().sort((a,b)=>a.ts-b.ts).map(r=>{run=rd2(run+(r.type==='pay'?-r.amount:val(r)-r.paid));return{r,run}}).reverse();
    const b=balOf(c),wn=waNum(c.phone),tn=telNum(c.phone);
    $('dbDet').innerHTML=`<div class="card"><div class="dbh"><button class="lnk" data-dback="1" aria-label="رجوع للمديونين">→</button><div class="cn" data-dfull="1" role="link" tabindex="0" style="cursor:pointer" title="صفحة العميل">👤 ${esc(c.name)}</div><span class="dbamt ${bcls(c)}">${b?`<small>${b>0?'عليه':'له'}</small> <b class="num">${f(Math.abs(b))}</b>`:'<b>خالص</b>'}</span><button class="main b-green" data-dpay="1">💵 دفع</button></div>
      <div class="mute dbsub">${esc(cSub(c,2)+(c.remAt?' · آخر تذكير '+agoTxt(c.remAt):''))}</div>
      <div class="dbact"><button class="ab b-out" data-dstmt="1">📑 كشف حساب</button>${b>0?`<button class="ab b-out" data-drem="1"><i class="wai"></i> تذكير</button>`:''}${wn?`<a class="ab wa" target="_blank" rel="noopener" href="https://wa.me/${wn}"><i class="wai"></i> رسالة</a>`:''}${tn?`<a class="ab tel" href="tel:${tn}">📞 اتصال</a>`:''}</div>
      
      ${wn?'':'<div class="mute" style="margin-top:4px">مفيش رقم متسجل للعميل · يتضاف من صفحة العملاء</div>'}
      ${b>0?(c.due?`<div class="dbdue${dAgo(0)>=c.due?' late':''}">📅 ميعاد السداد: <b>${dueLabel(c.due)}</b>${dAgo(0)>c.due?` <span>(عدّى من ${dz(Math.round((dAgo(0)-c.due)/864e5))})</span>`:''}<button type="button" class="lnk" data-ddx="1">✖️ إلغاء</button></div>`:''):''}
      ${dbSt===c.id?`<div class="dbst"><span>من</span><input type="date" id="dsf" aria-label="من تاريخ"><span>إلى</span><input type="date" id="dst" aria-label="إلى تاريخ"><button type="button" class="ab main" data-dsgo="1">عرض</button><button type="button" class="lnk" data-dsx="1" aria-label="إغلاق">✕</button><small class="mute">سيبهم فاضيين = من الأول لحد النهارده</small></div>`:''}
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
/* v357: البحث عدسة صغيرة، بتفتح الخانة لما تدوس عليها */
{const tp=$('dbq').closest('.dbtop');$('dbSb').onclick=()=>{tp.classList.add('open');$('dbq').focus()};$('dbq').addEventListener('blur',()=>{if(!$('dbq').value.trim())tp.classList.remove('open')})}
$('dbDet').addEventListener('change',e=>{const t=e.target;if(!t.dataset.ddate||!t.value)return;const c=getC(dbSel);if(!c)return;const[y,m,d]=t.value.split('-').map(Number);c.due=new Date(y,m-1,d).getTime();delete c.snz;put('customers',c);drawDebt();remDraw()});
$('bnav').addEventListener('click',e=>{if(e.target.closest('button[data-t="dash"]')&&(dbMode||infoMode)){dbMode=false;infoMode=false;dbSel=null;drawDebt()}});
$('t-dash').addEventListener('click',e=>{const t=e.target;
  const sc=t.closest('[data-sc]');if(sc){const k=sc.dataset.sc==='paid'?'p':'s';if(infoMode&&!dbMode&&iPer==='d'&&iSc===k){infoMode=false;iSc='';drawDebt();window.scrollTo(0,0);return}iSc=k;infoMode=true;dbMode=false;dbSel=null;dbPay=null;iPer='d';iSub=sc.dataset.sc==='paid'?'p':'s';drawInfo();drawDebt();window.scrollTo(0,0);return}
  if(t.closest('#infoCard')){const op=!(infoMode&&!dbMode&&!iSc);iSc='';infoMode=op;dbMode=false;dbSel=null;if(infoMode){iPer='m';iMoreOpen=false;drawInfo()}drawDebt();window.scrollTo(0,0);return}
  if(t.closest('#infoBack')){infoMode=false;drawDebt();window.scrollTo(0,0);return}
  /* v298: كارت المديونيات زي كارت التقرير: دوسة تفتح ودوسة تقفل */
  if(t.closest('#dbCard')){const op=!dbMode;infoMode=false;dbMode=op;dbSel=null;dbPay=null;dbTf=null;drawDebt();window.scrollTo(0,0);return}
  if(t.closest('#dbBack')){dbMode=false;dbSel=null;drawDebt();window.scrollTo(0,0);return}
  {const dq=t.closest('[data-dquick]');if(dq){dbSel=dq.dataset.dquick;dbPay=dbSel;delete PW.db;drawDebt();window.scrollTo(0,0);const i=document.querySelector('[data-pw="db"] .spa');if(i)i.focus();return}}
  if(t.closest('[data-dstmt]')){dbSt=dbSt===dbSel?null:dbSel;drawDebt();return}
  if(t.closest('[data-dsx]')){dbSt=null;drawDebt();return}
  if(t.closest('[data-dsgo]')){const a=$('dsf').value,b=$('dst').value,sv=[selC,per,pF,pT];selC=dbSel;per=a||b?'c':'all';pF=a;pT=b;try{stmtMerge()}finally{[selC,per,pF,pT]=sv}return}
  {const df=t.closest('[data-dfull]');if(df){const id=dbSel;document.querySelector('#bnav button[data-t="cu"]').click();selC=id;delete PW.cu;per='all';cdq='';pMo=0;editOpen=false;cuEd=false;cuPm=false;drawCusts();window.scrollTo(0,0);return}}
  {const tm=t.closest('[data-tfm]');if(tm){tfSendC(getC(tm.dataset.tfc),tm.dataset.tfm);return}}
  if(t.closest('[data-tfamt]')){pset('tfAmt',!tfAmtOn());drawDebt();return}
  if(t.closest('[data-tfset]')){document.querySelector('#hdrSet').click();stGo('pay');return}
  const o=t.closest('[data-dopen]');if(o){dbSel=o.dataset.dopen;dbPay=null;dbTf=null;drawDebt();window.scrollTo(0,0);return}
  if(t.closest('[data-dback]')){dbSel=null;dbPay=null;drawDebt();return}
  if(t.closest('[data-drem]')){const c=getC(dbSel);if(c)openRem(c);return}
  {const dd=t.closest('[data-dd]'),dx=t.closest('[data-ddx]');if(dd||dx){const c=getC(dbSel);if(!c)return;if(dd){c.due=dAgo(-(+dd.dataset.dd));delete c.snz}else delete c.due;put('customers',c);drawDebt();remDraw();return}}
  if(t.closest('[data-dpay]')){dbPay=dbPay===dbSel?null:dbSel;delete PW.db;drawDebt();const i=document.querySelector('[data-pw="db"] .spa');if(i)i.focus();return}
  if(t.closest('[data-dpx]')){dbPay=null;delete PW.db;drawDebt();return}
  const pg=t.closest('[data-dpgo]');if(pg){dbPayGo(pg);return}
  const rc=t.closest('[data-rec]');if(rc){const r=S.invoices.find(x=>x.id===rc.dataset.rec);if(r)showRec(r,false,'');return}
  const h=t.closest('[data-h]');if(h){const r=S.invoices.find(x=>x.id===h.dataset.h);if(r)showRec(r,false,'')}});



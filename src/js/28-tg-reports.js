/* ========== ✈️ تقارير تيليجرام الأوتوماتيك (v407) ==========
   أول ما البرنامج يتفتح، كل تقرير شغّال بيتبعت مرة واحدة في فترته:
   🧾 إقفال اليوم اللي فات (كل يوم) · 📊 الأسبوع اللي فات (كل أسبوع) · 🚚 الموردين (كل أسبوع) · 🧱 المخزن (كل أسبوع) · 📈 الشهر اللي فات (أول الشهر)
   و🗑️ تنبيه فوري لو فاتورة أو دفعة اتمسحت أو اتعدّلت على الجهاز ده. كل واحد ليه مفتاح في الإعدادات ← ✈️ تيليجرام.
   lsv('tgS_'+key) = آخر فترة اتبعتت · lsv('tgQ') = رسايل مستنية النت */
var tgBusy=false,tgSnap=null;
const tgOn=()=>!!(tgCfg().t&&tgCfg().c);
const tgE=s=>String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const tgDay=t=>{const d=new Date(t);return['الأحد','الاتنين','التلات','الأربع','الخميس','الجمعة','السبت'][d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1)};
const tgMon=t=>['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][new Date(t).getMonth()]+' '+new Date(t).getFullYear();
async function tgText(txt){const fd=new FormData();fd.append('chat_id',tgCfg().c);fd.append('text',txt);fd.append('parse_mode','HTML');fd.append('disable_web_page_preview','true');return tgApi('sendMessage',fd)}
/* رسايل التنبيه: لو النت فاصل بتستنى وتتبعت بعدين */
const tgQget=()=>{try{const a=JSON.parse(lsv('tgQ','[]'));return Array.isArray(a)?a:[]}catch(e){return[]}};
async function tgQueue(txt){if(!tgOn())return;try{await tgText(txt)}catch(e){const q=tgQget();q.push(txt);while(q.length>30)q.shift();svk('tgQ',JSON.stringify(q))}}
async function tgFlush(){const q=tgQget();if(!q.length||!tgOn())return;const left=[];for(const t of q){try{await tgText(t)}catch(e){left.push(t)}}svk('tgQ',JSON.stringify(left))}

/* ---- أرقام فترة ---- */
function tgSum(a,b){const R=S.invoices.filter(r=>r.ts>=a&&r.ts<b),inv=R.filter(r=>r.type==='inv'),sale=rd2(inv.reduce((s,r)=>s+val(r),0)),got=rd2(R.reduce((s,r)=>s+pd(r),0)),by=new Map();
  R.forEach(r=>pdBy(r).forEach(([k,v])=>{if(+v)by.set(k,rd2((by.get(k)||0)+(+v)))}));const ex=exTot(exIn(a,b)),pu=S.purchases.filter(x=>x.ts>=a&&x.ts<b&&!x.ob&&puSup(x.sid)),buy=rd2(pu.filter(x=>x.type==='buy').reduce((s,x)=>s+(+x.amt||0),0)),spay=rd2(pu.filter(x=>x.type==='pay').reduce((s,x)=>s+(+x.amt||0),0));
  const it=new Map();inv.forEach(r=>(r.rows||[]).forEach(x=>{if(x.rt||!x.n)return;const k=String(x.n).trim();it.set(k,rd2((it.get(k)||0)+(+x.v||0)))}));
  const cu=new Map();inv.forEach(r=>cu.set(r.cname||'—',rd2((cu.get(r.cname||'—')||0)+val(r))));
  const nw=new Set();inv.forEach(r=>{if(r.cid&&!S.invoices.some(y=>y.cid===r.cid&&y.ts<a))nw.add(r.cid)});
  return{n:inv.length,sale,got,by:[...by].sort((x,y)=>y[1]-x[1]),ex,buy,spay,top:[...it].sort((x,y)=>y[1]-x[1]).slice(0,5),tc:[...cu].sort((x,y)=>y[1]-x[1]).slice(0,3),nw:nw.size}}
const tgPct=(v,p)=>p>0?' <i>('+(v>=p?'↑':'↓')+Math.round(Math.abs(v-p)/p*100)+'%)</i>':'';
const tgDebt=()=>rd2(S.customers.reduce((s,c)=>{const b=balOf(c);return s+(b>0?b:0)},0));

/* ---- التقارير ---- */
function tgClTx(){const a=dAgo(1),b=dAgo(0),s=tgSum(a,b);if(!s.n&&!s.got&&!s.ex&&!s.buy&&!s.spay)return null;let t='🧾 <b>إقفال '+tgDay(a)+'</b>\n\n💰 المبيعات: <b>'+f(s.sale)+'</b> ('+plN(s.n,'فاتورة')+')\n💵 اتحصّل: <b>'+f(s.got)+'</b>';
  if(s.by.length)t+='\n'+s.by.map(([k,v])=>'   · '+tgE(k)+' '+f(v)).join('\n');if(s.ex)t+='\n💸 المصروفات: '+f(s.ex);if(s.buy)t+='\n🛒 مشتريات: '+f(s.buy);if(s.spay)t+='\n🚚 دفعت للموردين: '+f(s.spay);
  try{const d=drwCalc(a);t+='\n🗄 المتوقع في الدرج: '+f(d.exp)+(d.act!=null?(Math.abs(d.act-d.exp)<1?' ✓ مظبوط':d.act<d.exp?' · عجز '+f(rd2(d.exp-d.act)):' · زيادة '+f(rd2(d.act-d.exp))):'')}catch(e){}
  return t+'\n📒 إجمالي المديونيات دلوقتي: '+f(tgDebt())}
function tgPerTx(ttl,a,b,pa,pb){const s=tgSum(a,b),p=tgSum(pa,pb);let t=ttl+'\n\n💰 المبيعات: <b>'+f(s.sale)+'</b>'+tgPct(s.sale,p.sale)+' · '+plN(s.n,'فاتورة')+'\n💵 اتحصّل: <b>'+f(s.got)+'</b>'+tgPct(s.got,p.got);
  if(s.by.length)t+='\n'+s.by.map(([k,v])=>'   · '+tgE(k)+' '+f(v)).join('\n');t+='\n💸 المصروفات: '+f(s.ex)+'\n🛒 مشتريات: '+f(s.buy)+(s.spay?'\n🚚 دفعت للموردين: '+f(s.spay):'');
  if(s.top.length)t+='\n\n🏆 <b>أكتر الأصناف</b>\n'+s.top.map(([k,v],i)=>(i+1)+'. '+tgE(k)+' · '+f(v)).join('\n');
  if(s.tc.length)t+='\n\n👥 <b>أكتر العملاء</b>\n'+s.tc.map(([k,v],i)=>(i+1)+'. '+tgE(k)+' · '+f(v)).join('\n');
  if(s.nw)t+='\n\n🆕 '+plN(s.nw,'عميل')+' جديد';return t+'\n📒 إجمالي المديونيات دلوقتي: '+f(tgDebt())}
function tgWkTx(){const b=wkOf(Date.now()),a=b-7*864e5;return tgPerTx('📊 <b>الأسبوع '+tgDay(a)+' ← '+tgDay(b-864e5)+'</b>',a,b,a-7*864e5,a)}
function tgMoTx(){const[b]=monRange(Date.now()),[a]=monRange(b-864e5),[pa]=monRange(a-864e5);return tgPerTx('📈 <b>شهر '+tgMon(a)+'</b>',a,b,pa,a)}
function tgSpTx(){const l=S.suppliers.map(s=>({s,b:puBal(s.id),d:puDays(s.id)})).filter(o=>o.b>0).sort((x,y)=>y.b-x.b);if(!l.length)return'🚚 <b>الموردين</b>\n\n✅ مفيش عليك فلوس لأي مورد';
  return'🚚 <b>عليك للموردين: '+f(rd2(l.reduce((s,o)=>s+o.b,0)))+'</b>\n\n'+l.map(o=>(o.d!=null&&o.d>=30?'🔴':o.d!=null&&o.d>=7?'🟠':'▫️')+' '+tgE(o.s.name)+' · <b>'+f(o.b)+'</b>'+(o.d!=null?' · آخر دفعة '+puDTx(o.d):'')).join('\n')}
function tgSkTx(){const R=[...s2Calc().values()],tr=R.filter(o=>o.tr);if(!R.length)return null;const val=tr.reduce((s,o)=>s+Math.max(0,o.bal)*s2Cpm(o.t),0),low=tr.filter(o=>s2Mn(o.t)>0&&o.bal<=s2Mn(o.t)),un=R.filter(o=>!o.tr),lj=s2Jds().pop();
  let t='🧱 <b>المخزن</b>\n\n📐 '+fq(rd2(tr.reduce((s,o)=>s+Math.max(0,o.bal),0)))+' م²'+(val?' · قيمته '+f(Math.round(val)):'');
  if(tr.length)t+='\n'+tr.sort((x,y)=>x.t.name.localeCompare(y.t.name,'ar')).map(o=>'   · '+tgE(o.t.name)+' '+fq(o.bal)+' م²').join('\n');
  if(low.length)t+='\n\n⚠️ <b>قرب يخلص</b>\n'+low.map(o=>'   · '+tgE(o.t.name)+' '+fq(o.bal)+' م² (الحد '+fq(s2Mn(o.t))+')').join('\n');
  if(un.length)t+='\n\n➖ لسه ما اتعدّش: '+un.map(o=>tgE(o.t.name)).join('، ');
  const jd=lj?Math.floor((Date.now()-lj.ts)/864e5):null;t+='\n\n📋 '+(jd==null?'لسه ما عملتش جرد افتتاحي':'آخر جرد '+puDTx(jd)+(jd>=7?' — فاكر الجرد؟':''));return t}

/* ---- الجدولة: كل تقرير مرة في فترته ---- */
const TGJ=[{k:'tgCl',per:'d',tx:tgClTx},{k:'tgWk',per:'w',tx:tgWkTx},{k:'tgSp',per:'w',tx:tgSpTx},{k:'tgSk',per:'w',tx:tgSkTx},{k:'tgMo',per:'m',tx:tgMoTx}];
const tgPer=p=>{const n=Date.now();return p==='d'?dkey(n):p==='w'?'w'+dkey(wkOf(n)):'m'+dkey(monRange(n)[0])};
async function tgRun(){if(tgBusy||!tgOn()||!dataReady)return;tgBusy=true;try{tgSnapInit();await tgFlush();
    for(const j of TGJ){if(!pget(j.k,true))continue;const per=tgPer(j.per);if(lsv('tgS_'+j.k,'')===per)continue;      try{const t=j.tx();if(t)await tgText(t);svk('tgS_'+j.k,per)}catch(e){}}}finally{tgBusy=false}}
setTimeout(tgRun,9000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(tgRun,3500)});

/* ---- 🗑️ تنبيه الحذف والتعديل (اللي بيحصل على الجهاز ده) ---- */
const tgSig=r=>({t:r.type,v:r.type==='pay'?pd(r):val(r),p:pd(r),n:r.cname||'',c:r.code||r.no||''});
function tgSnapInit(){if(tgSnap||!dataReady)return;tgSnap=new Map(S.invoices.map(r=>[r.id,tgSig(r)]))}
const tgWho=()=>{try{const w=lsv('wkName','')||lsv('worker','');return w?' · 👷 '+tgE(w):''}catch(e){return''}};
const _tgPut=put,_tgDel=del;
put=function(k,o){const r=_tgPut(k,o);try{if(k==='invoices'&&o&&tgSnap){const old=tgSnap.get(o.id),nw=tgSig(o);tgSnap.set(o.id,nw);
  if(old&&pget('tgDel',true)&&(Math.abs(old.v-nw.v)>=.01||Math.abs(old.p-nw.p)>=.01||old.n!==nw.n))tgQueue('✏️ <b>'+(nw.t==='pay'?'دفعة':'فاتورة')+' '+tgE(nw.c)+' اتعدّلت</b>\n👤 '+tgE(nw.n)+(old.n!==nw.n?' (كانت '+tgE(old.n)+')':'')+'\nكانت: '+f(old.v)+(nw.t==='pay'?'':' · مدفوع '+f(old.p))+'\nبقت: <b>'+f(nw.v)+'</b>'+(nw.t==='pay'?'':' · مدفوع '+f(nw.p))+'\n🕘 '+stamp(Date.now())+tgWho())}}catch(e){}return r};
del=function(k,id){let r0=null;try{if(k==='invoices')r0=S.invoices.find(x=>x.id===id)||null}catch(e){}const r=_tgDel(k,id);
  try{if(r0&&pget('tgDel',true)){const s=tgSig(r0);if(tgSnap)tgSnap.delete(id);tgQueue('🗑️ <b>'+(s.t==='pay'?'دفعة':'فاتورة')+' '+tgE(s.c)+' اتمسحت</b>\n👤 '+tgE(s.n)+'\n💰 '+f(s.v)+(s.t==='pay'?'':' · مدفوع '+f(s.p))+'\n📅 كانت بتاريخ '+stamp(r0.ts)+'\n🕘 اتمسحت '+stamp(Date.now())+tgWho())}}catch(e){}return r};

/* ---- صفحة الإعدادات ---- */
function tgSumTx(){if(!tgOn())return'مش مربوط';const n=['dsTg','dbTg'].filter(k=>pget(k,false)).length+TGJ.filter(j=>pget(j.k,true)).length+(pget('tgDel',true)?1:0);return'مربوط · '+plN(n,'حاجة')+' بتتبعت'}
(()=>{const st=$('tgSt');const up=()=>{if(st)st.textContent=tgOn()?'✅ مربوط':'⚠ مش مربوط';const s=$('ss_tg');if(s)s.textContent=tgSumTx()};up();
  ['tgCl','tgWk','tgSp','tgSk','tgMo','tgDel'].forEach(k=>{const c=$(k);if(!c)return;c.checked=pget(k,true);c.onchange=()=>{svk(k,c.checked?'1':'0');up()}});
  ['dsTg','dbTg'].forEach(k=>{const c=$(k);if(c)c.addEventListener('change',up)});['tgTok','tgChat'].forEach(k=>{const c=$(k);if(c)c.addEventListener('change',up)});
  const pg=document.querySelector('.stp[data-sp="tg"]');if(pg)pg.addEventListener('click',async e=>{const b=e.target.closest('[data-tgnow]');if(!b)return;const m=$('tgAMsg'),k=b.dataset.tgnow;
    if(!tgOn()){m.textContent='⚠ اربط تيليجرام الأول (Token و Chat ID)';return}m.textContent='⏳ بيتبعت…';
    try{if(k==='bk'){$('bkShare').click();m.textContent='⏳ النسخة بتتبعت…';return}const t=({cl:tgClTx,wk:tgWkTx,sp:tgSpTx,sk:tgSkTx,mo:tgMoTx}[k]||(()=>null))();if(!t){m.textContent='مفيش حاجة تتبعت (مفيش حركة)';return}await tgText(t);m.textContent='✅ اتبعت على تيليجرام'}catch(err){m.textContent='⚠ '+err.message}});
  document.addEventListener('click',e=>{if(e.target.closest('[data-sp="tg"]'))setTimeout(up,50)})})();

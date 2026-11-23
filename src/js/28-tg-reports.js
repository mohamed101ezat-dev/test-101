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
  const M=v=>Math.round(+v||0),MM=l=>l.map(([k,v])=>[k,M(v)]);return{n:inv.length,sale:M(sale),got:M(got),by:MM([...by].sort((x,y)=>y[1]-x[1])),ex:M(ex),buy:M(buy),spay:M(spay),top:MM([...it].sort((x,y)=>y[1]-x[1]).slice(0,5)),tc:MM([...cu].sort((x,y)=>y[1]-x[1]).slice(0,3)),nw:nw.size}}
const tgDebt=()=>Math.round(S.customers.reduce((s,c)=>{const b=balOf(c);return s+(b>0?b:0)},0));
const tgPct=(v,p)=>p>0?(v>=p?'↑ ':'↓ ')+Math.round(Math.abs(v-p)/p*100)+'% عن اللي قبله':'';

/* ---- رسّام صورة التقرير: عنوان + مربعات أرقام كبيرة + جداول (كله بالعربي من اليمين) ----
   spec={title,sub,kpi:[[عنوان,رقم,ملاحظة?,لون?]],sec:[{h,rows:[[اسم,قيمة,ملاحظة?,لون?]]}],foot?} */
const TG_MKH=new Image();TG_MKH.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%2082%22%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%234f80e1%22%20stroke-width%3D%227.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M8%2078V38q0-4%204-7L46%207q4-3%208%200l34%2024q4%203%204%207v40%22%2F%3E%3Cpath%20d%3D%22M24%2078V46L50%2027l26%2019v32%22%2F%3E%3Cpath%20d%3D%22M40%2078V54l10-7%2010%207v24%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E';
const TGC={g:'#1f5f3f',red:'#b42318',or:'#b45309',grn:'#15803d',ink:'#111827',mu:'#6b7280',ln:'#e5e7eb'};
function tgDraw(sp){const W=1080,P=40,F=(s,w)=>(w||400)+' '+s+'px system-ui,"Segoe UI",Tahoma,Arial,sans-serif',KH=150,RH=62,SH=70;
  const kr=Math.ceil((sp.kpi||[]).length/2),secs=(sp.sec||[]).filter(s=>s&&s.rows&&s.rows.length);
  let H=170+(kr?kr*(KH+16)+20:0);secs.forEach(s=>{H+=SH+s.rows.reduce((a,r)=>a+(r[2]?RH+22:RH),0)+16});if(sp.foot)H+=70;H+=20;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.direction='rtl';
  x.fillStyle='#f6f8f7';x.fillRect(0,0,W,H);x.fillStyle=TGC.g;x.fillRect(0,0,W,150);
  x.fillStyle='#fff';x.textAlign='right';x.font=F(48,700);if(sp.logo&&TG_MKH.complete&&TG_MKH.naturalWidth){x.fillStyle='#fff';x.beginPath();if(x.roundRect)x.roundRect(W-P-78,18,78,70,14);else x.rect(W-P-78,18,78,70);x.fill();x.drawImage(TG_MKH,W-P-70,26,62,52);x.fillStyle='#fff';x.fillText(sp.title,W-P-96,70)}else x.fillText(sp.title,W-P,70);x.font=F(32);x.fillStyle='#d9e8df';x.fillText(sp.sub||'',W-P,122);
  const shop=lsv('shop','');if(shop){x.textAlign='left';x.font=F(30,600);x.fillStyle='#d9e8df';x.fillText(shop,P,70)}
  let y=170;const cw=(W-P*2-20)/2;
  (sp.kpi||[]).forEach((k,i)=>{const col=i%2,row=Math.floor(i/2),cx=W-P-cw-col*(cw+20),cy=y+row*(KH+16);
    x.fillStyle='#fff';x.strokeStyle=TGC.ln;x.lineWidth=2;x.beginPath();if(x.roundRect)x.roundRect(cx,cy,cw,KH,18);else x.rect(cx,cy,cw,KH);x.fill();x.stroke();
    x.textAlign='right';x.fillStyle=TGC.mu;x.font=F(30);x.fillText(k[0],cx+cw-24,cy+46);
    x.fillStyle=k[3]||TGC.ink;x.font=F(50,700);x.fillText(k[1],cx+cw-24,cy+104);
    if(k[2]){x.fillStyle=TGC.mu;x.font=F(24);x.fillText(k[2],cx+cw-24,cy+136)}});
  if(kr)y+=kr*(KH+16)+20;
  secs.forEach(s=>{x.fillStyle=TGC.ink;x.textAlign='right';x.font=F(36,700);x.fillText(s.h,W-P,y+48);y+=SH;
    s.rows.forEach((r,i)=>{const h=r[2]?RH+22:RH;x.fillStyle=i%2?'#ffffff':'#fbfcfb';x.fillRect(P,y,W-P*2,h);x.fillStyle=TGC.ln;x.fillRect(P,y+h-1,W-P*2,1);
      x.textAlign='right';x.fillStyle=TGC.ink;x.font=F(34,500);let nm=String(r[0]);while(x.measureText(nm).width>W-P*2-330&&nm.length>3)nm=nm.slice(0,-2);if(nm!==String(r[0]))nm+='…';x.fillText(nm,W-P-16,y+42);
      if(r[2]){x.fillStyle=r[3]||TGC.mu;x.font=F(26);x.fillText(r[2],W-P-16,y+76)}
      x.textAlign='left';x.fillStyle=r[3]||TGC.ink;x.font=F(36,700);x.fillText(String(r[1]),P+16,y+44);y+=h});y+=16});
  if(sp.foot){x.textAlign='right';x.fillStyle=sp.footC||TGC.mu;x.font=F(32,600);x.fillText(sp.foot,W-P,y+46);y+=70}
  return new Promise(r=>cv.toBlob(r,'image/png'))}
async function tgSendSpec(sp){const b=await tgDraw(sp),fd=new FormData();fd.append('chat_id',tgCfg().c);fd.append('caption',sp.cap||(sp.title+' · '+(sp.sub||'')));fd.append('photo',b,'report.png');return tgApi('sendPhoto',fd)}

/* ---- التقارير (كل واحد بيرجع وصف الصورة، أو null لو مفيش حاجة) ---- */
function tgClTx(){const a=dAgo(1),b=dAgo(0),s=tgSum(a,b);if(!s.n&&!s.got&&!s.ex&&!s.buy&&!s.spay)return null;let dr=null;try{dr=drwCalc(a)}catch(e){}
  const kpi=[['💰 المبيعات',f(s.sale),plN(s.n,'فاتورة')],['💵 اتحصّل',f(s.got),'',TGC.grn],['💸 المصروفات',f(s.ex),'',s.ex?TGC.red:''],['🗄 المتوقع في الدرج',dr?f(dr.exp):'—',dr&&dr.act!=null?(Math.abs(dr.act-dr.exp)<1?'✓ مظبوط':dr.act<dr.exp?'عجز '+f(rd2(dr.exp-dr.act)):'زيادة '+f(rd2(dr.act-dr.exp))):'']];
  const sec=[{h:'💵 اتحصّل بإيه',rows:s.by.map(([k,v])=>[k,f(v)])}];if(s.buy||s.spay)sec.push({h:'🚚 الموردين',rows:[s.buy?['🛒 مشتريات',f(s.buy)]:null,s.spay?['💵 دفعت للموردين',f(s.spay)]:null].filter(Boolean)});
  return{title:'🧾 إقفال اليوم',sub:tgDay(a),kpi,sec,foot:'📒 إجمالي المديونيات دلوقتي: '+f(tgDebt()),footC:TGC.red}}
function tgPerTx(ttl,sub,a,b,pa,pb){const s=tgSum(a,b),p=tgSum(pa,pb);
  const kpi=[['💰 المبيعات',f(s.sale),plN(s.n,'فاتورة')+(tgPct(s.sale,p.sale)?' · '+tgPct(s.sale,p.sale):'')],['💵 اتحصّل',f(s.got),tgPct(s.got,p.got),TGC.grn],['💸 المصروفات',f(s.ex),'',s.ex?TGC.red:''],['🛒 مشتريات',f(s.buy),s.spay?'دفعت للموردين '+f(s.spay):'']];
  const sec=[{h:'💵 اتحصّل بإيه',rows:s.by.map(([k,v])=>[k,f(v)])},{h:'🏆 أكتر الأصناف',rows:s.top.map(([k,v],i)=>[(i+1)+'. '+k,f(v)])},{h:'👥 أكتر العملاء',rows:s.tc.map(([k,v],i)=>[(i+1)+'. '+k,f(v)])}];
  return{title:ttl,sub,kpi,sec,foot:(s.nw?'🆕 '+plN(s.nw,'عميل')+' جديد · ':'')+'📒 المديونيات دلوقتي: '+f(tgDebt())}}
function tgWkTx(){const b=wkOf(Date.now()),a=b-7*864e5;return tgPerTx('📊 تقرير الأسبوع',tgDay(a)+' ← '+tgDay(b-864e5),a,b,a-7*864e5,a)}
function tgMoTx(){const[b]=monRange(Date.now()),[a]=monRange(b-864e5),[pa]=monRange(a-864e5);return tgPerTx('📈 تقرير الشهر',tgMon(a),a,b,pa,a)}
function tgSpTx(){const l=S.suppliers.map(s=>({s,b:puBal(s.id),d:puDays(s.id)})).filter(o=>o.b>0).sort((x,y)=>y.b-x.b),tot=rd2(l.reduce((s,o)=>s+o.b,0));
  return{title:'🚚 الموردين',sub:tgDay(Date.now()),kpi:[['عليك للموردين',f(tot),plN(l.length,'مورد'),tot?TGC.red:TGC.grn]],sec:[{h:'مين ليه عندك',rows:l.map(o=>[o.s.name,f(o.b),o.d!=null?'آخر دفعة '+puDTx(o.d):'',o.d!=null&&o.d>=30?TGC.red:o.d!=null&&o.d>=7?TGC.or:''])}],foot:l.length?'':'✅ مفيش عليك فلوس لأي مورد',footC:TGC.grn}}
function tgSkTx(){const R=[...s2Calc().values()],tr=R.filter(o=>o.tr);if(!R.length)return null;const v=tr.reduce((s,o)=>s+Math.max(0,o.bal)*s2Cpm(o.t),0),low=tr.filter(o=>s2Mn(o.t)>0&&o.bal<=s2Mn(o.t)),un=R.filter(o=>!o.tr),lj=s2Jds().pop(),jd=lj?Math.floor((Date.now()-lj.ts)/864e5):null;
  return{title:'المخزن',logo:1,sub:tgDay(Date.now()),kpi:[['📐 الأمتار',fq(rd2(tr.reduce((s,o)=>s+Math.max(0,o.bal),0)))+' م²'],['💰 قيمته',v?f(Math.round(v)):'—']],
    sec:[{h:'⚠️ قرب يخلص',rows:low.map(o=>[o.t.name,fq(o.bal)+' م²','الحد '+fq(s2Mn(o.t))+' م²',TGC.or])},{h:'📦 الأنواع',rows:tr.sort((a,b)=>a.t.name.localeCompare(b.t.name,'ar')).map(o=>[o.t.name,fq(o.bal)+' م²','≈ '+fq(s2Sh(Math.max(0,o.bal),o.ref))+' لوح',o.bal<0?TGC.red:''])},{h:'➖ لسه ما اتعدّش',rows:un.map(o=>[o.t.name,'—'])}],
    foot:'📋 '+(jd==null?'لسه ما عملتش جرد افتتاحي':'آخر جرد '+puDTx(jd)+(jd>=7?' — فاكر الجرد؟':'')),footC:jd==null||jd>=7?TGC.or:TGC.mu}}

/* ---- الجدولة: كل تقرير مرة في فترته ---- */
const TGJ=[{k:'tgCl',per:'d',tx:tgClTx},{k:'tgWk',per:'w',tx:tgWkTx},{k:'tgSp',per:'w',tx:tgSpTx},{k:'tgSk',per:'w',tx:tgSkTx},{k:'tgMo',per:'m',tx:tgMoTx}];
const tgPer=p=>{const n=Date.now();return p==='d'?dkey(n):p==='w'?'w'+dkey(wkOf(n)):'m'+dkey(monRange(n)[0])};
async function tgRun(){if(tgBusy||!tgOn()||!dataReady)return;tgBusy=true;try{tgSnapInit();await tgFlush();
    for(const j of TGJ){if(!pget(j.k,true))continue;const per=tgPer(j.per);if(lsv('tgS_'+j.k,'')===per)continue;      try{const t=j.tx();if(t)await tgSendSpec(t);svk('tgS_'+j.k,per)}catch(e){}}}finally{tgBusy=false}}
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
    try{if(k==='bk'){$('bkShare').click();m.textContent='⏳ النسخة بتتبعت…';return}const t=({cl:tgClTx,wk:tgWkTx,sp:tgSpTx,sk:tgSkTx,mo:tgMoTx}[k]||(()=>null))();if(!t){m.textContent='مفيش حاجة تتبعت (مفيش حركة)';return}await tgSendSpec(t);m.textContent='✅ اتبعت على تيليجرام'}catch(err){m.textContent='⚠ '+err.message}});
  document.addEventListener('click',e=>{if(e.target.closest('[data-sp="tg"]'))setTimeout(up,50)})})();

/* ========== 🛒 المشتريات والموردين (v395) ==========
   فاتورة الشراء بتتكتب من ورقة المورد: النوع · طول · عرض · عدد الألواح · سعر المتر ← البرنامج بيحسب مساحة اللوح وتمنه والإجمالي،
   ويقارنه بإجمالي ورقة المورد. البيانات في S.purchases (نفس الموردين وحساباتهم القديمة):
   {id,sid,ts,type:'buy'|'pay',amt,note,ln?:[{n,iid,w,h,q,p}],ref?,ret?,ob?,how?,pf?}  · الرصيد = مجموع الشراء − الدفعات (= اللي عليك)
   ret=مرتجع للمورد (مبلغه بالسالب) · ob=رصيد أول المدة · pf=دفعة اتعملت مع فاتورة الشراء */
var puV='home',puSid=null,puE=null,puP=null,puStack=[],puEdS=false;
const PUHOW=['كاش','فودافون كاش','انستا','تحويل بنكي','شيك'],PUD=864e5;
const puCm=v=>{v=nv(v);return v>0?(v>20?v:v*100):0};
const puLn=l=>{const w=puCm(l.w),h=puCm(l.h),ar=w>0&&h>0?rd2(w*h/1e4):0,q=nv(l.q),p=nv(l.p);return{ar,sheet:rd2(ar*p),tot:rd2(ar*p*q),m2:rd2(ar*q)}};
const puSum=e=>rd2(e.ln.reduce((a,l)=>a+puLn(l).tot,0));
const puNewLn=()=>({n:'',w:'',h:'',q:'',p:''});
const puSup=id=>S.suppliers.find(s=>s.id===id)||null;
const puOf=sid=>S.purchases.filter(x=>x.sid===sid).sort((a,b)=>a.ts-b.ts||(a.type==='pay')-(b.type==='pay'));
const puBal=sid=>rd2(S.purchases.filter(x=>x.sid===sid).reduce((a,x)=>a+(x.type==='pay'?-1:1)*(+x.amt||0),0));
/* بقالي كام يوم ما دفعتش: من آخر دفعة، ولو مفيش دفعات من أول شراء */
function puDays(sid){if(puBal(sid)<=0)return null;const l=puOf(sid),p=l.filter(x=>x.type==='pay').pop(),b=l.find(x=>x.type!=='pay');const t=p?p.ts:b?b.ts:0;return t?Math.max(0,Math.floor((Date.now()-t)/PUD)):null}
const puDTx=d=>d==null?'':d===0?'النهارده':d===1?'من يوم':d===2?'من يومين':'من '+d+' يوم';
const puDate=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const puTs=(v,old)=>{if(!v)return old||Date.now();if(old&&puDate(old)===v)return old;if(v===puDate(Date.now()))return Date.now();return new Date(v+'T12:00:00').getTime()};
const puDM=t=>{const d=new Date(t);return d.getDate()+'/'+(d.getMonth()+1)};
const puSupOpts=sel=>'<option value="">اختار المورد</option>'+S.suppliers.slice().sort((a,b)=>a.name.localeCompare(b.name,'ar')).map(s=>`<option value="${esc(s.id)}"${s.id===sel?' selected':''}>${esc(s.name)}</option>`).join('');
const puHowChips=on=>PUHOW.map(h=>`<button type="button" data-puh="${esc(h)}"${h===on?' class="on"':''}>${esc(h)}</button>`).join('');
function puGo(v){puStack.push([puV,puSid]);puV=v;puDraw();window.scrollTo(0,0);try{syncNav()}catch(e){}}
function puPop(){const p=puStack.pop();if(p){puV=p[0];puSid=p[1]}else{puV='home';puSid=null}puE=null;puP=null;puDraw()}
function puBack(){if(puStack.length)puPop();else{puV='home';puSid=null;puDraw()}try{syncNav()}catch(e){}}

function puDraw(){const b=$('pu');if(!b)return;if(puV==='inv'&&puE)b.innerHTML=puInvH();else if(puV==='pay'&&puP)b.innerHTML=puPayH();else if(puV==='sup'&&puSup(puSid))b.innerHTML=puSupH(puSup(puSid));else{puV='home';b.innerHTML=puHomeH()}}

/* ---- الصفحة الرئيسية: الموردين + آخر الفواتير ---- */
function puHomeH(){const now=new Date(),m0=new Date(now.getFullYear(),now.getMonth(),1).getTime();
  const tot=rd2(S.suppliers.reduce((a,s)=>a+puBal(s.id),0)),mo=rd2(S.purchases.filter(x=>x.type==='buy'&&!x.ob&&x.ts>=m0&&puSup(x.sid)).reduce((a,x)=>a+(+x.amt||0),0));
  const sups=S.suppliers.map(s=>({s,b:puBal(s.id),d:puDays(s.id)})).sort((a,b)=>(b.b>0)-(a.b>0)||b.b-a.b||a.s.name.localeCompare(b.s.name,'ar'));
  const last=S.purchases.filter(x=>x.type==='buy'&&!x.ob&&puSup(x.sid)).sort((a,b)=>b.ts-a.ts).slice(0,8);
  return`<div class="puk"><div><small>🚚 عليك للموردين</small><b class="num${tot>0?' dn':''}">${f(tot)}</b></div><div><small>🛒 اشتريت الشهر ده</small><b class="num">${f(mo)}</b></div></div>
  <div class="puact"><button type="button" class="main" data-pu="new">📥 فاتورة شراء</button><button type="button" class="alt" data-pu="pay">💵 دفعة</button><button type="button" class="alt" data-pu="addsup">➕ مورد</button></div>
  <div class="card puadd" id="puAdd" hidden><div class="purw"><input id="puNS" placeholder="اسم المورد" autocomplete="off" aria-label="اسم المورد"><input id="puNP" inputmode="tel" placeholder="تليفون" autocomplete="off" aria-label="التليفون"><button type="button" class="main" data-pu="savesup">✅</button></div><div class="info" id="puAM"></div></div>
  <div class="pusec">🚚 الموردين</div>
  ${sups.length?sups.map(({s,b,d})=>`<div class="purow" data-pusup="${esc(s.id)}" role="button" tabindex="0"><span class="pun">${esc(s.name)}</span>${d!=null?`<span class="pud${d>=7?' red':''}">⏰ ${puDTx(d)}</span>`:''}<b class="num${b>0?' dn':b<0?' ok':''}">${b?f(Math.abs(b)):'✓'}</b></div>`).join(''):'<div class="card mute">مفيش موردين لسه. دوس «➕ مورد».</div>'}
  ${last.length?`<div class="pusec">🧾 آخر فواتير الشراء</div>`+last.map(x=>{const s=puSup(x.sid);return`<div class="purow sm" data-puinv="${esc(x.id)}" role="button" tabindex="0"><span class="num mute">${puDM(x.ts)}</span><span class="pun">${esc(s?s.name:'—')}${x.ret?' <small class="tag rt">↩ مرتجع</small>':''}${x.ref?' <small class="mute">#'+esc(x.ref)+'</small>':''}</span><b class="num">${f(Math.abs(+x.amt||0))}</b></div>`}).join(''):''}`}

/* ---- صفحة المورد: حسابه + كشف ---- */
function puSupH(s){const b=puBal(s.id),d=puDays(s.id),l=puOf(s.id),tel=typeof spTel==='function'?spTel(s.phone):'',wa=s.phone?waNum(s.phone):'';let run=0;
  const rows=l.map(x=>{const v=+x.amt||0,pay=x.type==='pay';run=rd2(run+(pay?-v:v));return{x,v,pay,run}}).reverse();
  const ob=S.purchases.find(x=>x.sid===s.id&&x.ob);
  return`<div class="card pus"><div class="puh"><button type="button" class="lnk" data-pu="back" aria-label="رجوع">→</button><b class="pun">${esc(s.name)}</b><button type="button" class="xd" data-pu="edsup" aria-label="تعديل المورد">✏️</button><span class="pub"><small>${b<0?'ليك عنده':'عليك'}</small><b class="num${b>0?' dn':b<0?' ok':''}">${f(Math.abs(b))}</b></span></div>
  ${d!=null?`<div class="pudl${d>=7?' red':''}">⏰ ${l.some(x=>x.type==='pay')?'آخر دفعة':'ما دفعتش'} ${puDTx(d)}</div>`:''}
  <div class="puact"><button type="button" class="main" data-pu="new">📥 فاتورة</button><button type="button" class="alt" data-pu="pay">💵 دفعة</button><button type="button" class="alt" data-pu="ret">↩️ مرتجع</button>${tel?`<a class="alt" href="tel:${esc(tel)}">📞</a>`:''}${wa?`<a class="alt" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">💬</a>`:''}</div></div>
  <div class="card pued" ${puEdS?'':'hidden'}><div class="purw"><input id="puEN" value="${esc(s.name)}" placeholder="الاسم" autocomplete="off" aria-label="اسم المورد"><input id="puEP" inputmode="tel" value="${esc(s.phone||'')}" placeholder="تليفون" autocomplete="off" aria-label="التليفون"></div>
    <div class="purw"><span class="mute">عليّا له من قبل</span><input id="puOB" inputmode="decimal" value="${ob?esc(ob.amt):''}" placeholder="0" autocomplete="off" aria-label="رصيد أول المدة"></div>
    <div class="purw"><button type="button" class="main" data-pu="savedsup">✅ حفظ</button><button type="button" class="alt b-red" data-pu="delsup">🗑️ حذف المورد</button></div><div class="info" id="puEM"></div></div>
  <div class="card pul">${rows.length?`<table class="xl"><tr><th>اليوم</th><th>البيان</th><th>المبلغ</th><th>الرصيد</th></tr>${rows.map(({x,v,pay,run})=>`<tr data-pue="${esc(x.id)}"><td class="num">${puDM(x.ts)}</td><td class="tn">${esc(pay?'💵 دفعة'+(x.how?' · '+x.how:''):x.ob?'رصيد من قبل':x.ret?'↩️ مرتجع':'🧾 فاتورة'+(x.ref?' #'+x.ref:''))}${x.note&&!x.ln?'<small class="mute">'+esc(x.note)+'</small>':''}${x.ln?'<small class="mute">'+esc(x.ln.map(q=>q.n+' ×'+fq(q.q)).join('، '))+'</small>':''}</td><td class="num ${pay?'ok':'dn'}">${pay?'−':'+'}${f(Math.abs(v))}</td><td class="num"><b>${f(run)}</b></td></tr>`).join('')}</table>`:'<div class="mute">لسه مفيش حاجة. سجّل أول فاتورة.</div>'}</div>`}

/* ---- فاتورة شراء / مرتجع ---- */
function puNewInv(sid,ret){puE={id:null,sid:sid||'',date:puDate(Date.now()),ref:'',ret:!!ret,ln:[puNewLn()],paper:'',paid:'',how:'كاش',note:'',ts:0};puGo('inv')}
function puEditInv(x){const pp=S.purchases.find(y=>y.pf===x.id&&y.type==='pay');puE={id:x.id,sid:x.sid,date:puDate(x.ts),ref:x.ref||'',ret:!!x.ret,ln:(x.ln||[]).map(l=>({n:l.n,w:fq(l.w/100),h:fq(l.h/100),q:String(l.q),p:String(l.p)})),paper:x.paper!=null?String(x.paper):'',paid:pp?String(pp.amt):'',how:pp&&pp.how||'كاش',note:x.note||'',ts:x.ts};if(!puE.ln.length)puE.ln.push(puNewLn());puGo('inv')}
function puInvH(){const e=puE,names=S.items.filter(i=>i.type==='mq').map(i=>i.name),tot=puSum(e),m2=rd2(e.ln.reduce((a,l)=>a+puLn(l).m2,0));
  return`<div class="card puinv"><div class="puh"><button type="button" class="lnk" data-pu="back" aria-label="رجوع">→</button><b>${e.ret?'↩️ مرتجع للمورد':'📥 فاتورة شراء'}${e.id?' <small class="mute">(تعديل)</small>':''}</b></div>
  <div class="purw"><select id="puS" aria-label="المورد">${puSupOpts(e.sid)}</select><input type="date" id="puD" value="${esc(e.date)}" aria-label="التاريخ"><input id="puR" value="${esc(e.ref)}" placeholder="رقم فاتورته" autocomplete="off" aria-label="رقم فاتورة المورد"></div>
  <datalist id="puNames">${names.map(n=>'<option value="'+esc(n)+'">').join('')}</datalist>
  <div class="puhd"><span>النوع</span><span>طول</span><span>عرض</span><span>عدد</span><span>سعر/م</span><span>القيمة</span><span></span></div>
  <div id="puLns">${e.ln.map((l,i)=>puLnH(l,i)).join('')}</div>
  <button type="button" class="alt puplus" data-pu="addln">➕ سطر</button></div>
  <div class="card putot"><div class="purw"><span>الإجمالي <small class="mute" id="puM2">${m2?fq(m2)+' م²':''}</small></span><b class="num" id="puT">${f(tot)}</b></div>
  <div class="purw"><span>📄 إجمالي ورقة المورد</span><input id="puPaper" inputmode="decimal" value="${esc(e.paper)}" placeholder="اختياري" autocomplete="off" aria-label="إجمالي ورقة المورد"></div><div id="puChk">${puChkH()}</div>
  ${e.ret?'':`<div class="purw"><span>💵 دفعت دلوقتي</span><input id="puPd" inputmode="decimal" value="${esc(e.paid)}" placeholder="0" autocomplete="off" aria-label="المدفوع"><button type="button" class="alt" data-pu="paidall">كله</button></div><div class="spc puhow">${puHowChips(e.how)}</div>`}
  <input id="puNote" value="${esc(e.note)}" placeholder="ملاحظة (اختياري)" autocomplete="off" aria-label="ملاحظة">
  <div class="purw"><button type="button" class="main" data-pu="saveinv">✅ حفظ</button>${e.id?'<button type="button" class="alt b-red" data-pu="delinv">🗑️ حذف</button>':''}</div><div class="info" id="puMsg" aria-live="polite"></div></div>`}
const puLnH=(l,i)=>{const x=puLn(l);return`<div class="puln" data-i="${i}"><input class="pN" list="puNames" value="${esc(l.n)}" placeholder="4م مراية" autocomplete="off" aria-label="النوع"><input class="pW" inputmode="decimal" value="${esc(l.w)}" placeholder="3.21" autocomplete="off" aria-label="الطول"><input class="pH" inputmode="decimal" value="${esc(l.h)}" placeholder="2.25" autocomplete="off" aria-label="العرض"><input class="pQ" inputmode="decimal" value="${esc(l.q)}" placeholder="0" autocomplete="off" aria-label="عدد الألواح"><input class="pP" inputmode="decimal" value="${esc(l.p)}" placeholder="0" autocomplete="off" aria-label="سعر المتر"><b class="num pV">${x.tot?f(x.tot):''}</b><button type="button" class="xd" data-pux="${i}" aria-label="شيل السطر">×</button><small class="mute pS">${x.ar?'اللوح '+fq(x.ar)+' م²'+(x.sheet?' · '+f(x.sheet)+' ج':''):''}</small></div>`};
function puChkH(){const e=puE,pp=nv(e.paper),t=puSum(e);if(!(pp>0)||!(t>0))return'';const d=rd2(pp-t);return Math.abs(d)<1?'<div class="puok">✅ مطابقة لورقة المورد</div>':`<div class="pubad">⚠️ فرق ${f(Math.abs(d))} ج — ${d>0?'الورقة أكتر':'الورقة أقل'}</div>`}
function puLiveTot(){const e=puE,t=$('puT');if(t)t.textContent=f(puSum(e));const m=$('puM2');if(m){const v=rd2(e.ln.reduce((a,l)=>a+puLn(l).m2,0));m.textContent=v?fq(v)+' م²':''}const c=$('puChk');if(c)c.innerHTML=puChkH()}
function puSaveInv(){const e=puE,m=$('puMsg'),s=puSup(e.sid);if(!s){m.textContent='اختار المورد';return}
  const L=e.ln.map(l=>({n:String(l.n||'').trim(),w:puCm(l.w),h:puCm(l.h),q:rd2(nv(l.q)),p:rd2(nv(l.p))})).filter(l=>l.n||l.q);
  if(!L.length){m.textContent='اكتب سطر واحد على الأقل';return}
  const bad=L.find(l=>!l.n||!(l.q>0)||!(l.w>0&&l.h>0));if(bad){m.textContent=!bad.n?'اكتب النوع في كل سطر':!(bad.q>0)?'اكتب عدد الألواح لـ«'+bad.n+'»':'اكتب الطول والعرض لـ«'+bad.n+'»';return}
  L.forEach(l=>{let it=S.items.find(i=>i.type==='mq'&&nkey(i.name)===nkey(l.n));if(!it){it={id:uid(),type:'mq',name:l.n,p:0,w:0,h:0};S.items.push(it);put('items',it)}l.iid=it.id;l.n=it.name});
  const tot=rd2(L.reduce((a,l)=>a+rd2(rd2(l.w*l.h/1e4)*l.p)*l.q,0)),ts=puTs(e.date,e.ts),paper=nv(e.paper);
  let x=e.id&&S.purchases.find(y=>y.id===e.id);if(!x){x={id:uid()};S.purchases.push(x)}
  Object.assign(x,{sid:s.id,ts,type:'buy',amt:e.ret?-tot:tot,ln:L,note:e.note.trim()});if(e.ref.trim())x.ref=e.ref.trim();else delete x.ref;if(e.ret)x.ret=1;else delete x.ret;if(paper>0)x.paper=paper;else delete x.paper;put('purchases',x);
  const pd=e.ret?0:rd2(nv(e.paid));let pp=S.purchases.find(y=>y.pf===x.id&&y.type==='pay');
  if(pd>0){if(!pp){pp={id:uid(),pf:x.id};S.purchases.push(pp)}Object.assign(pp,{sid:s.id,ts:ts+1,type:'pay',amt:pd,how:e.how||'كاش',note:'مع فاتورة الشراء'});put('purchases',pp)}else if(pp)del('purchases',pp.id);
  const was=e.id;puSid=s.id;puE=null;{const tp=puStack[puStack.length-1];if(tp&&tp[0]==='sup')puStack.pop()}puV='sup';puDraw();window.scrollTo(0,0);try{syncNav()}catch(e){}toast((was?'✅ اتعدّلت ':'✅ اتسجّلت ')+(x.ret?'المرتجع':'الفاتورة')+' · '+f(tot)+(pd>0?' · دفعت '+f(pd):'')+' · عليك '+f(puBal(s.id)))}

/* ---- دفعة للمورد ---- */
function puNewPay(sid,x){puP=x?{id:x.id,sid:x.sid,amt:String(x.amt),how:x.how||'كاش',date:puDate(x.ts),note:x.note||'',ts:x.ts,buy:x.type!=='pay'}:{id:null,sid:sid||'',amt:'',how:'كاش',date:puDate(Date.now()),note:'',ts:0};puGo('pay')}
function puPayH(){const p=puP,b=p.sid?puBal(p.sid):0;
  return`<div class="card puinv"><div class="puh"><button type="button" class="lnk" data-pu="back" aria-label="رجوع">→</button><b>${p.buy?'🧾 مبلغ شراء':'💵 دفعة للمورد'}${p.id?' <small class="mute">(تعديل)</small>':''}</b></div>
  <div class="purw"><select id="puS" aria-label="المورد">${puSupOpts(p.sid)}</select><input type="date" id="puD" value="${esc(p.date)}" aria-label="التاريخ"></div>
  <div class="purw"><input id="puA" inputmode="decimal" value="${esc(p.amt)}" placeholder="المبلغ" autocomplete="off" aria-label="المبلغ">${!p.buy&&b>0?`<button type="button" class="alt" data-pu="payall">كله ${f(b)}</button>`:''}</div>
  ${p.buy?'':`<div class="spc puhow">${puHowChips(p.how)}</div>`}
  <input id="puNote" value="${esc(p.note)}" placeholder="ملاحظة (اختياري)" autocomplete="off" aria-label="ملاحظة">
  <div class="purw"><button type="button" class="main" data-pu="savepay">✅ حفظ</button>${p.id?'<button type="button" class="alt b-red" data-pu="delpay">🗑️ حذف</button>':''}</div><div class="info" id="puMsg" aria-live="polite"></div></div>`}
function puSavePay(){const p=puP,m=$('puMsg'),s=puSup(p.sid),a=rd2(nv(p.amt));if(!s){m.textContent='اختار المورد';return}if(!(a>0)){m.textContent='اكتب المبلغ';return}
  let x=p.id&&S.purchases.find(y=>y.id===p.id);if(!x){x={id:uid(),type:'pay'};S.purchases.push(x)}
  Object.assign(x,{sid:s.id,ts:puTs(p.date,p.ts),amt:a,note:p.note.trim()});if(x.type==='pay')x.how=p.how||'كاش';put('purchases',x);
  puSid=s.id;puP=null;{const tp=puStack[puStack.length-1];if(tp&&tp[0]==='sup')puStack.pop()}puV='sup';puDraw();window.scrollTo(0,0);try{syncNav()}catch(e){}toast('✅ اتسجّل · عليك '+f(puBal(s.id)))}

/* ---- الأحداث ---- */
$('pu').addEventListener('click',e=>{const t=e.target,r=t.closest('[data-pusup],[data-puinv],[data-pue]');
  const b=t.closest('[data-pu],[data-pux],[data-puh]');
  if(b&&b.dataset.puh){const h=b.dataset.puh;if(puE)puE.how=h;if(puP)puP.how=h;b.parentNode.querySelectorAll('[data-puh]').forEach(x=>x.classList.toggle('on',x===b));return}
  if(b&&b.dataset.pux!=null){puE.ln.splice(+b.dataset.pux,1);if(!puE.ln.length)puE.ln.push(puNewLn());$('puLns').innerHTML=puE.ln.map((l,i)=>puLnH(l,i)).join('');puLiveTot();return}
  if(b){const k=b.dataset.pu,s=puSup(puSid);
    if(k==='back')return puBack();
    if(k==='new')return puNewInv(puV==='sup'?puSid:'',false);
    if(k==='ret')return puNewInv(puSid,true);
    if(k==='pay')return puNewPay(puV==='sup'?puSid:'');
    if(k==='addsup'){const a=$('puAdd');a.hidden=!a.hidden;if(!a.hidden)$('puNS').focus();return}
    if(k==='savesup'){const n=$('puNS').value.trim();if(!n){$('puAM').textContent='اكتب الاسم';return}if(S.suppliers.some(x=>nkey(x.name)===nkey(n))){$('puAM').textContent='المورد ده موجود';return}const o={id:uid(),name:n,phone:$('puNP').value.trim()};S.suppliers.push(o);put('suppliers',o);puSid=o.id;puGo('sup');toast('✅ اتضاف '+n);return}
    if(k==='edsup'){puEdS=!puEdS;puDraw();return}
    if(k==='savedsup'&&s){const n=$('puEN').value.trim();if(!n){$('puEM').textContent='اكتب الاسم';return}s.name=n;s.phone=$('puEP').value.trim();put('suppliers',s);
      const v=rd2(nv($('puOB').value));let ob=S.purchases.find(x=>x.sid===s.id&&x.ob);
      if(v>0){if(!ob){const l=puOf(s.id);ob={id:uid(),sid:s.id,type:'buy',ob:1,ts:l.length?l[0].ts-1:Date.now(),note:'رصيد من قبل'};S.purchases.push(ob)}ob.amt=v;put('purchases',ob)}else if(ob)del('purchases',ob.id);
      puEdS=false;puDraw();toast('✅ اتحفظ');return}
    if(k==='delsup'&&s){if(S.purchases.some(x=>x.sid===s.id)){$('puEM').textContent='المورد ليه حركات، احذفها الأول';return}if(!ok2(b))return;del('suppliers',s.id);puEdS=false;puBack();toast('اتحذف المورد');return}
    if(k==='addln'){puE.ln.push(puNewLn());$('puLns').insertAdjacentHTML('beforeend',puLnH(puE.ln[puE.ln.length-1],puE.ln.length-1));const r=$('puLns').lastElementChild;r.querySelector('.pN').focus();try{r.scrollIntoView({block:'center'})}catch(_){}return}
    if(k==='paidall'){puE.paid=String(puSum(puE));$('puPd').value=puE.paid;return}
    if(k==='payall'){puP.amt=String(puBal(puP.sid));$('puA').value=puP.amt;return}
    if(k==='saveinv')return puSaveInv();
    if(k==='savepay')return puSavePay();
    if(k==='delinv'||k==='delpay'){if(!ok2(b))return;const id=(puE||puP).id,pp=S.purchases.find(y=>y.pf===id&&y.type==='pay');del('purchases',id);if(pp)del('purchases',pp.id);puE=null;puP=null;puBack();toast('اتحذفت');return}
    return}
  if(r){if(r.dataset.pusup){puSid=r.dataset.pusup;puEdS=false;return puGo('sup')}
    const x=S.purchases.find(y=>y.id===(r.dataset.puinv||r.dataset.pue));if(!x)return;puSid=x.sid;
    if(x.type==='buy'&&x.ln)return puEditInv(x);return puNewPay(x.sid,x)}});
$('pu').addEventListener('input',e=>{const t=e.target;
  if(puE){const ln=t.closest('.puln');if(ln){const l=puE.ln[+ln.dataset.i];if(!l)return;const K={pN:'n',pW:'w',pH:'h',pQ:'q',pP:'p'};for(const k in K)if(t.classList.contains(k))l[K[k]]=t.value;const x=puLn(l);ln.querySelector('.pV').textContent=x.tot?f(x.tot):'';ln.querySelector('.pS').textContent=x.ar?'اللوح '+fq(x.ar)+' م²'+(x.sheet?' · '+f(x.sheet)+' ج':''):'';puLiveTot();return}
    if(t.id==='puR')puE.ref=t.value;if(t.id==='puPaper'){puE.paper=t.value;puLiveTot()}if(t.id==='puPd')puE.paid=t.value;if(t.id==='puNote')puE.note=t.value;if(t.id==='puD')puE.date=t.value}
  if(puP){if(t.id==='puA')puP.amt=t.value;if(t.id==='puNote')puP.note=t.value;if(t.id==='puD')puP.date=t.value}});
$('pu').addEventListener('change',e=>{const t=e.target;if(t.id==='puS'){if(puE)puE.sid=t.value;if(puP){puP.sid=t.value;puDraw()}}if(t.id==='puD'){if(puE)puE.date=t.value;if(puP)puP.date=t.value}
  /* لما تختار نوع اشتريته قبل كده: آخر مقاس وسعر متر اتشرى بيه يتحطوا لوحدهم */
  if(puE&&t.classList.contains('pN')){const ln=t.closest('.puln'),l=puE.ln[+ln.dataset.i];if(!l||l.w||l.p)return;const k=nkey(l.n),pv=S.purchases.filter(x=>x.ln&&!x.ret).sort((a,b)=>b.ts-a.ts).flatMap(x=>x.ln).find(q=>nkey(q.n)===k);if(!pv)return;l.w=fq(pv.w/100);l.h=fq(pv.h/100);l.p=String(pv.p);ln.outerHTML=puLnH(l,+ln.dataset.i);puLiveTot();const n=$('puLns').children[+ln.dataset.i];if(n)n.querySelector('.pQ').focus()}});

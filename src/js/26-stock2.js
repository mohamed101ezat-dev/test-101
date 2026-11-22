/* ========== 🧱 المخزن + 📋 الجرد بالمتر (v396/v397) ==========
   كل نوع زجاج (صنف مقطع) ليه رصيد بالمتر المربع:
   + فواتير الشراء (أسطرها) · − فواتير البيع (المقطع بأمتاره، والجاهز بمساحته من نوعه) · المرتجعات بالعكس
   والجرد بيحط الرصيد على اللي اتعدّ فعلًا (ألواح كاملة × مساحة كل مقاس)، وبعده الحساب يكمّل من جديد.
   الجرد بيتحفظ في S.stock كمستند {id,jd:1,ts,rows:[{iid,sz:[{w,h,c}],m2,exp?,p?}],first?,one?}
   (من غير iid فالمحرك القديم بيتجاهله) · one=1 يعني تعديل رصيد نوع واحد من صفحته (مش جرد كامل) */
var s2V='home',s2Id=null,jdV='home',jdE=null,jdId=null;
const S2REF=[321,225];
const s2Types=()=>S.items.filter(i=>i.type==='mq').sort((a,b)=>a.name.localeCompare(b.name,'ar'));
const s2A=(w,h)=>rd2((+w||0)*(+h||0)/1e4);
const s2JdsAll=()=>S.stock.filter(x=>x&&x.jd).sort((a,b)=>a.ts-b.ts);
const s2Jds=()=>s2JdsAll().filter(x=>!x.one);
/* كل حركات كل نوع: شراء/مرتجع للمورد/بيع/مرتجع من عميل/جرد */
function s2Calc(){const T=s2Types(),byId=new Map(S.items.map(i=>[i.id,i])),byN=new Map(T.map(t=>[nkey(t.name),t])),E=new Map(T.map(t=>[t.id,[]]));
  const add=(t,o)=>{if(t&&E.has(t.id))E.get(t.id).push(o)};
  S.purchases.forEach(p=>{if(p.type!=='buy'||!p.ln||p.ob)return;const s=S.suppliers.find(y=>y.id===p.sid);p.ln.forEach(l=>{const t=(l.iid&&byId.get(l.iid))||byN.get(nkey(l.n));const m=rd2(s2A(l.w,l.h)*(+l.q||0));if(m)add(t&&t.type==='mq'?t:byN.get(nkey(l.n)),{ts:p.ts,d:p.ret?-m:m,k:p.ret?'ret':'buy',tx:(p.ret?'↩️ مرتجع للمورد':'📥 شراء')+(s?' · '+s.name:'')+' · '+fq(l.q)+' لوح '+fq(l.w/100)+'×'+fq(l.h/100),pid:p.id})})});
  S.invoices.forEach(r=>{if(r.type==='pay')return;(r.rows||[]).forEach(x=>{let it=x.i&&byId.get(x.i),t=null,m=0;
      if(it&&it.type==='rd'){t=skPar(it);const w=+x.w||+it.w||0,h=+x.h||+it.h||0;m=s2A(w,h)*(+x.c||0)}
      else{t=it&&it.type==='mq'?it:byN.get(nkey(x.n));if(!t){const pi=byN.size&&S.items.find(i=>i.type==='rd'&&nkey(i.name)===nkey(String(x.n||'').replace(/\s*\d+(\.\d+)?\s*[×x*]\s*\d+(\.\d+)?\s*$/,'')));if(pi){t=skPar(pi);m=s2A(+x.w||+pi.w,+x.h||+pi.h)*(+x.c||0)}}else m=+x.q>0?+x.q:s2A(x.w,x.h)*(+x.c||0)}
      m=rd2(m);if(t&&m)add(t,{ts:r.ts,d:x.rt?m:-m,k:x.rt?'rt':'sale',tx:(x.rt?'↩️ مرتجع من ':'🧾 ')+(r.cname||'')+' · '+(r.code||'#'+r.no),iv:r.id})})});
  s2JdsAll().forEach(j=>(j.rows||[]).forEach(o=>{const t=byId.get(o.iid);if(t)add(t,{ts:j.ts,k:'jd',one:!!j.one,set:rd2(+o.m2||0),exp:o.exp,tx:j.one?'✍️ تعديل الرصيد':'📋 جرد',jid:j.id})}));
  const R=new Map();T.forEach(t=>{const ev=E.get(t.id).sort((a,b)=>a.ts-b.ts||(a.k==='jd')-(b.k==='jd'));const lj=ev.filter(e=>e.k==='jd'&&!e.one).pop(),fj=ev.find(e=>e.k==='jd'),fb=ev.find(e=>e.k==='buy');
    const st=fj&&fb?Math.min(fj.ts,fb.ts):fj?fj.ts:fb?fb.ts:null;let bal=0;const used=[];
    if(st!=null)ev.forEach(e=>{if(e.ts<st)return;if(e.k==='jd'){bal=e.set;used.push({...e,bal});return}bal=rd2(bal+e.d);used.push({...e,bal})});
    R.set(t.id,{t,tr:st!=null,bal:rd2(bal),ev:used,lj,ref:s2Ref(t)})});return R}
/* مساحة اللوح المرجعية للنوع: آخر مقاس اشتريته أو عدّيته */
function s2Ref(t){const k=nkey(t.name);const pl=S.purchases.filter(p=>p.ln&&!p.ret).sort((a,b)=>b.ts-a.ts).flatMap(p=>p.ln).find(l=>l.iid===t.id||nkey(l.n)===k);if(pl)return s2A(pl.w,pl.h);const jz=s2JdsAll().reverse().flatMap(j=>j.rows||[]).find(o=>o.iid===t.id&&o.sz&&o.sz.length);if(jz)return s2A(jz.sz[0].w,jz.sz[0].h);return s2A(S2REF[0],S2REF[1])}
/* سعر المتر: آخر مصدر كتبته بإيدك (جرد أو تعديل) لو أحدث من آخر شراء، وإلا متوسط سعر المشتريات */
function s2Cpm(t){let m=0,v=0,lp=0;const k=nkey(t.name);S.purchases.forEach(p=>{if(!p.ln||p.ret||p.ob)return;p.ln.forEach(l=>{if(l.iid===t.id||nkey(l.n)===k){const a=s2A(l.w,l.h)*(+l.q||0);m+=a;v+=a*(+l.p||0);if(p.ts>lp)lp=p.ts}})});
  let mp=null;s2JdsAll().forEach(j=>(j.rows||[]).forEach(o=>{if(o.iid===t.id&&+o.p>0&&(!mp||j.ts>=mp.ts))mp={ts:j.ts,p:+o.p}}));const inv=t.inv||{};if(+inv.cpm2>0&&(!mp||(+inv.cpm2t||0)>=mp.ts))mp={ts:+inv.cpm2t||0,p:+inv.cpm2};
  if(mp&&(mp.ts>=lp||m<=0))return mp.p;return m>0?v/m:0}
/* المقاسات المعروفة للنوع: من آخر جرد + المشتريات */
function s2Sizes(t){const k=nkey(t.name),Z=[],has=(w,h)=>Z.some(z=>(Math.abs(z.w-w)<1&&Math.abs(z.h-h)<1)||(Math.abs(z.w-h)<1&&Math.abs(z.h-w)<1));
  s2JdsAll().reverse().forEach(j=>(j.rows||[]).forEach(o=>{if(o.iid===t.id)(o.sz||[]).forEach(z=>{if(!has(z.w,z.h))Z.push({w:z.w,h:z.h})})}));
  S.purchases.filter(p=>p.ln).sort((a,b)=>b.ts-a.ts).forEach(p=>p.ln.forEach(l=>{if((l.iid===t.id||nkey(l.n)===k)&&!has(l.w,l.h))Z.push({w:l.w,h:l.h})}));return Z}
const s2Sh=(m2,ref)=>ref>0?Math.round(m2/ref*10)/10:0;
const s2ZN=z=>'⁦'+fq(z.w/100)+' × '+fq(z.h/100)+'⁩';
const s2Mn=t=>+((t.inv||{}).mn2)||0;
function s2Go(v,id){s2V=v;s2Id=id||null;s2Draw();window.scrollTo(0,0);try{syncNav()}catch(e){}}
function jdGo(v){jdV=v;jdDraw();window.scrollTo(0,0);try{syncNav()}catch(e){}}

/* ---- صفحة المخزن: ليستة الأنواع بس، كل واحد بياناته واضحة وتدوس عليه تعدّله ---- */
function s2Draw(){const b=$('sk2');if(!b)return;const R=s2Calc();if(s2V==='one'&&R.get(s2Id)){b.innerHTML=s2OneH(R.get(s2Id));return}s2V='home';
  const A=[...R.values()].sort((a,b)=>(b.tr-a.tr)||a.t.name.localeCompare(b.t.name,'ar'));
  b.innerHTML=A.length?A.map(o=>{const t=o.t,cpm=s2Cpm(t),lw=o.tr&&s2Mn(t)>0&&o.bal<=s2Mn(t),ng=o.tr&&o.bal<0;
    return`<div class="s2r${lw?' lw':''}" data-s2one="${esc(t.id)}" role="button" tabindex="0"><div class="s2t"><span class="s2n">${lw?'⚠️ ':''}${esc(t.name)}</span>${o.tr?`<b class="s2m num${ng?' dn':''}">${fq(o.bal)} م²</b>`:'<b class="s2m s2no">لسه ما اتعدّش</b>'}</div>
      ${o.tr?`<div class="s2d"><span>≈ ${fq(s2Sh(Math.max(0,o.bal),o.ref))} لوح</span>${cpm?`<span>💰 ${f(Math.round(cpm))} للمتر</span><span>قيمته ${f(Math.round(Math.max(0,o.bal)*cpm))}</span>`:'<span>من غير سعر</span>'}${s2Mn(t)>0?`<span>⚠️ تحت ${fq(s2Mn(t))}</span>`:''}</div>`:`<div class="s2d"><span>دوس وسجّل رصيده</span></div>`}</div>`}).join(''):'<div class="card mute">مفيش أنواع. الأنواع بتتضاف من الأصناف (مقطع) أو من فاتورة شراء.</div>'}
/* ---- صفحة النوع: كلها قابلة للتعديل ---- */
function s2OneH(o){const t=o.t,ev=o.ev.slice().reverse().slice(0,60),cpm=s2Cpm(t);
  return`<div class="card s2one"><div class="puh"><button type="button" class="lnk" data-s2="back" aria-label="رجوع">→</button><b class="pun">${esc(t.name)}</b><span class="pub"><b class="num${o.bal<0?' dn':''}">${o.tr?fq(o.bal)+' م²':'—'}</b></span></div>
  ${o.tr?`<div class="s2sub">≈ ${fq(s2Sh(Math.max(0,o.bal),o.ref))} لوح${cpm?' · قيمته '+f(Math.round(Math.max(0,o.bal)*cpm)):''}${o.lj?' · آخر جرد '+puDTx(Math.floor((Date.now()-o.lj.ts)/864e5)):''}</div>`:''}
  <div class="s2f"><label>الاسم<input id="s2N" value="${esc(t.name)}" autocomplete="off" aria-label="اسم النوع"></label></div>
  <div class="s2g"><label>الرصيد م²<input id="s2B" inputmode="decimal" value="${o.tr?esc(String(o.bal)):''}" placeholder="0" autocomplete="off" aria-label="الرصيد بالمتر"></label><label>سعر المتر<input id="s2P" inputmode="decimal" value="${cpm?esc(String(rd2(cpm))):''}" placeholder="0" autocomplete="off" aria-label="سعر المتر"></label><label>تنبيه تحت م²<input id="s2M" inputmode="decimal" value="${s2Mn(t)||''}" placeholder="—" autocomplete="off" aria-label="نبّهني لما يقل عن"></label></div>
  <div class="purw"><button type="button" class="main" data-s2="save">✅ حفظ</button></div><div class="info" id="s2Msg" aria-live="polite"></div></div>
  ${ev.length?`<div class="card pul"><table class="xl"><tr><th>اليوم</th><th>الحركة</th><th>م²</th><th>الرصيد</th><th></th></tr>${ev.map(e=>`<tr${e.pid?` data-s2p="${esc(e.pid)}"`:''}><td class="num">${puDM(e.ts)}</td><td class="tn">${esc(e.tx)}${e.k==='jd'&&e.exp!=null&&!e.one?'<small class="mute">كان المفروض '+fq(e.exp)+'</small>':''}</td><td class="num ${e.k==='jd'?'':e.d<0?'dn':'ok'}">${e.k==='jd'?'=':e.d>0?'+'+fq(e.d):'−'+fq(-e.d)}</td><td class="num"><b>${fq(e.bal)}</b></td><td class="nw">${e.one?`<button type="button" class="xd" data-s2x="${esc(e.jid)}" aria-label="شيل التعديل">×</button>`:''}</td></tr>`).join('')}</table></div>`:''}`}
function s2Save(){const t=S.items.find(i=>i.id===s2Id),m=$('s2Msg');if(!t)return;
  const n=$('s2N').value.trim();if(!n){m.textContent='اكتب الاسم';return}if(S.items.some(i=>i.id!==t.id&&i.type==='mq'&&nkey(i.name)===nkey(n))){m.textContent='في نوع بنفس الاسم';return}
  const R=s2Calc().get(t.id),bv=$('s2B').value.trim(),pv=rd2(nv($('s2P').value)),mn=rd2(nv($('s2M').value));
  if(n!==t.name){t.name=n;put('items',t)}
  const inv={};if(pv>0&&Math.abs(pv-rd2(s2Cpm(t)))>=.01){inv.cpm2=pv;inv.cpm2t=Date.now()}else if(!(pv>0)&&(t.inv||{}).cpm2){inv.cpm2='';inv.cpm2t=0}inv.mn2=mn>0?mn:'';skSet(t,inv);
  if(bv!==''){const b=rd2(nv(bv));if(!R.tr||Math.abs(b-R.bal)>=.01){const j={id:uid(),jd:1,one:1,ts:Date.now(),rows:[{iid:t.id,sz:[],m2:b,...(R.tr?{exp:R.bal}:{})}]};S.stock.push(j);put('stock',j)}}
  s2Draw();toast('✅ اتحفظ')}

/* ---- صفحة الجرد ---- */
function jdDraw(){const b=$('jd');if(!b)return;if(jdV==='new'&&jdE){b.innerHTML=jdNewH();return}if(jdV==='view'){const j=S.stock.find(x=>x.id===jdId);if(j){b.innerHTML=jdViewH(j);return}}jdV='home';
  const J=s2Jds().reverse();
  b.innerHTML=`<div class="puact"><button type="button" class="main" data-jd="new">📝 ${jdE?'كمّل الجرد اللي بدأته':J.length?'جرد جديد':'جرد افتتاحي'}</button></div>
  ${J.length?`<div class="pudl">📋 آخر جرد ${puDTx(Math.floor((Date.now()-J[0].ts)/864e5))}</div>`:'<div class="card mute s2hint">أول جرد هو الافتتاحي: عدّ الألواح الكاملة من كل نوع ومقاس، والرقم ده يبقى رصيد المخزن. بعد كده كل جرد بيقارن اللي عدّيته باللي المفروض يكون.</div>'}
  ${J.map(j=>{const n=(j.rows||[]).length,df=rd2((j.rows||[]).reduce((a,o)=>a+(o.exp!=null?(+o.m2||0)-o.exp:0),0));return`<div class="purow sm" data-jdv="${esc(j.id)}" role="button" tabindex="0"><span class="num mute">${puDM(j.ts)}</span><span class="pun">${plN(n,'نوع')}</span>${j.first?'<small class="tag">افتتاحي</small>':`<b class="num ${Math.abs(df)<.01?'':df<0?'dn':'ok'}">${Math.abs(df)<.01?'✓':(df>0?'+':'−')+fq(Math.abs(df))+' م²'}</b>`}</div>`}).join('')}`}
function jdStart(){const R=s2Calc(),first=!s2Jds().length;jdE={first,rows:s2Types().map(t=>{const o=R.get(t.id),Z=s2Sizes(t),cp=s2Cpm(t);if(!Z.length)Z.push({w:S2REF[0],h:S2REF[1]});return{iid:t.id,exp:o&&o.tr?o.bal:null,p:cp>0?String(rd2(cp)):'',sz:Z.map(z=>({w:z.w,h:z.h,c:''}))}})};jdGo('new')}
const jdM2=r=>rd2(r.sz.reduce((a,z)=>a+s2A(z.w,z.h)*(nv(z.c)||0),0));
const jdDone=r=>r.sz.some(z=>String(z.c).trim()!=='');
function jdNewH(){const e=jdE,T=new Map(S.items.map(i=>[i.id,i]));
  return`<div class="card puinv"><div class="puh"><button type="button" class="lnk" data-jd="back" aria-label="رجوع">→</button><b>📝 ${e.first?'جرد افتتاحي':'جرد'}</b><small class="mute">اكتب عدد الألواح الكاملة · اللي تسيبه فاضي مش هيتجرد</small></div></div>
  <div id="jdL">${e.rows.map((r,i)=>{const t=T.get(r.iid);if(!t)return'';return`<div class="card jdt" data-r="${i}"><div class="jdh"><b>${esc(t.name)}</b><span class="jdx" id="jdx${i}">${jdLineTx(r)}</span></div>
    ${r.sz.map((z,k)=>`<div class="jdz" data-k="${k}"><span class="num">${s2ZN(z)}<small class="mute"> = ${fq(s2A(z.w,z.h))} م²</small></span><input class="jdc" inputmode="decimal" value="${esc(z.c)}" placeholder="0" autocomplete="off" aria-label="عدد ألواح ${esc(t.name)} ${fq(z.w/100)}×${fq(z.h/100)}"><small class="mute">لوح</small><button type="button" class="xd" data-jdzx="${i}:${k}" aria-label="شيل المقاس">×</button></div>`).join('')}
    <div class="jdb"><button type="button" class="lnk jdadd" data-jdaz="${i}">➕ مقاس</button><label class="jdp">💰 سعر المتر<input class="jdpr" inputmode="decimal" value="${esc(r.p)}" placeholder="0" autocomplete="off" aria-label="سعر المتر"></label></div>
    <div class="jdnz" hidden><input class="jdw" inputmode="decimal" placeholder="طول 3.21" aria-label="الطول"><input class="jdh2" inputmode="decimal" placeholder="عرض 2.25" aria-label="العرض"><button type="button" class="alt" data-jdzok="${i}">✅</button></div></div>`}).join('')}</div>
  <div class="card"><div class="purw"><button type="button" class="main" data-jd="save">✅ حفظ الجرد</button></div><div class="info" id="jdMsg" aria-live="polite"></div></div>`}
function jdLineTx(r){if(!jdDone(r)){if(r.exp==null)return'';const t=S.items.find(i=>i.id===r.iid),rf=t?s2Ref(t):0;return'<small class="mute">المفروض '+fq(r.exp)+' م²'+(rf>0&&r.exp>0?' ≈ '+fq(s2Sh(r.exp,rf))+' لوح':'')+'</small>'}const m=jdM2(r);if(r.exp==null)return'<b class="num">'+fq(m)+' م²</b>';const d=rd2(m-r.exp);return'<b class="num">'+fq(m)+' م²</b> <small class="'+(Math.abs(d)<.01?'mute':d<0?'dn':'ok')+'">'+(Math.abs(d)<.01?'✓ مظبوط':(d>0?'+':'−')+fq(Math.abs(d))+' م² عن المفروض')+'</small>'}
function jdSave(){const e=jdE,m=$('jdMsg'),rows=e.rows.filter(jdDone).map(r=>{const p=rd2(nv(r.p));return{iid:r.iid,sz:r.sz.filter(z=>nv(z.c)>0).map(z=>({w:z.w,h:z.h,c:rd2(nv(z.c))})),m2:jdM2(r),...(r.exp!=null?{exp:r.exp}:{}),...(p>0?{p}:{})}});
  if(!rows.length){m.textContent='اكتب عدد الألواح لنوع واحد على الأقل';return}
  const j={id:uid(),jd:1,ts:Date.now(),rows,...(e.first?{first:1}:{})};S.stock.push(j);put('stock',j);jdE=null;jdId=j.id;jdGo('view');toast('✅ اتحفظ الجرد · '+plN(rows.length,'نوع'))}
function jdViewH(j){const T=new Map(S.items.map(i=>[i.id,i]));
  return`<div class="card puinv"><div class="puh"><button type="button" class="lnk" data-jd="back" aria-label="رجوع">→</button><b>📋 ${j.first?'جرد افتتاحي':'جرد'} ${puDM(j.ts)}</b></div>
  <table class="xl jdtb"><tr><th>النوع</th><th>اتعدّ</th><th>المفروض</th><th>الفرق</th></tr>${(j.rows||[]).map(o=>{const t=T.get(o.iid),d=o.exp!=null?rd2(o.m2-o.exp):null;return`<tr><td class="tn">${esc(t?t.name:'—')}<small class="mute">${(o.sz||[]).map(z=>fq(z.c)+' × '+s2ZN(z)).join(' · ')}</small></td><td class="num">${fq(o.m2)}</td><td class="num">${o.exp!=null?fq(o.exp):'—'}</td><td class="num ${d==null||Math.abs(d)<.01?'':d<0?'dn':'ok'}">${d==null?'—':Math.abs(d)<.01?'✓':(d>0?'+':'−')+fq(Math.abs(d))}</td></tr>`}).join('')}</table>
  <div class="purw"><button type="button" class="alt b-red" data-jd="del">🗑️ حذف الجرد ده</button></div></div>`}

/* ---- الأحداث ---- */
$('sk2').addEventListener('click',e=>{const x=e.target.closest('[data-s2x]');
  if(x){const id=x.dataset.s2x;del('stock',id);s2Draw();toast('اتشال التعديل');return}
  const pr=e.target.closest('[data-s2p]');if(pr){const p=S.purchases.find(y=>y.id===pr.dataset.s2p);if(p&&p.ln){skHist.push('m:'+skM);skM='buy';skMainUI();puSid=p.sid;puEditInv(p)}return}
  const b=e.target.closest('[data-s2],[data-s2one]');if(!b)return;
  if(b.dataset.s2one)return s2Go('one',b.dataset.s2one);const k=b.dataset.s2;
  if(k==='back')return s2Go('home');
  if(k==='save')return s2Save()});
$('jd').addEventListener('click',e=>{const b=e.target.closest('[data-jd],[data-jdv],[data-jdaz],[data-jdzok],[data-jdzx]');if(!b)return;const d=b.dataset;
  if(d.jdv){jdId=d.jdv;return jdGo('view')}
  if(d.jdzx!=null){const[i,k]=d.jdzx.split(':').map(Number);jdE.rows[i].sz.splice(k,1);const y=window.scrollY;jdDraw();window.scrollTo(0,y);return}
  if(d.jdaz!=null){const c=b.closest('.jdt'),z=c.querySelector('.jdnz');z.hidden=!z.hidden;if(!z.hidden)z.querySelector('.jdw').focus();return}
  if(d.jdzok!=null){const i=+d.jdzok,c=b.closest('.jdt'),w=puCm(c.querySelector('.jdw').value),h=puCm(c.querySelector('.jdh2').value);if(!(w>0&&h>0))return;jdE.rows[i].sz.push({w,h,c:''});const y=window.scrollY;jdDraw();window.scrollTo(0,y);const n=document.querySelector('#jdL [data-r="'+i+'"] .jdz:last-of-type .jdc');if(n)n.focus();return}
  const k=d.jd;if(k==='new')return jdE?jdGo('new'):jdStart();if(k==='back')return jdGo('home');if(k==='save')return jdSave();
  if(k==='del'){if(!ok2(b))return;del('stock',jdId);jdId=null;jdGo('home');toast('اتحذف الجرد');return}});
$('jd').addEventListener('input',e=>{const t=e.target;if(!jdE)return;const c=t.closest('.jdt');if(!c)return;const i=+c.dataset.r;
  if(t.classList.contains('jdc')){const k=+t.closest('.jdz').dataset.k;jdE.rows[i].sz[k].c=t.value;const x=$('jdx'+i);if(x)x.innerHTML=jdLineTx(jdE.rows[i])}
  else if(t.classList.contains('jdpr'))jdE.rows[i].p=t.value});

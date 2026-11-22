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
  return [c.lim>0&&balOf(c)>c.lim?'⚠ عدّى الحد':'',np?'':c.phone,l.length?plN(l.length,'معاملة')+' · آخر '+(new Date(t).getFullYear()===new Date().getFullYear()?new Date(t).getDate()+'/'+(new Date(t).getMonth()+1):dshort(t)):'مفيش معاملات',a?(a.d===null?'مفيش دفعات':(a.d<=0?'آخر دفعة النهارده':a.d===1?'آخر دفعة امبارح':'آخر دفعة من '+a.d+' يوم')):''].slice(0,np===1?3:4).filter(Boolean).join(' · ')}
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
const dupIgnGet=()=>{try{const a=JSON.parse(localStorage.getItem('dupIgn')||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}};
function dupGroups(){const m=new Map(),pm=new Map(),out=[],seen=new Set();
  S.customers.filter(c=>!c.arch).forEach(c=>{const k=nkey(c.name);if(k)(m.get(k)||m.set(k,[]).get(k)).push(c);new Set(phoneKeys(c.phone)).forEach(p=>(pm.get(p)||pm.set(p,[]).get(p)).push(c))});
  const ign=dupIgnGet(),add=(g,lab,why)=>{if(g.length<2)return;const id=g.map(c=>c.id).sort().join('|');if(seen.has(id)||ign.includes(id))return;seen.add(id);g.lab=lab;g.why=why;g.gid=id;out.push(g)};
  m.forEach(g=>add(g,g[0].name,'n'));pm.forEach((g,p)=>add(g,g[0].phone,'p'));return out}
/* دمج عميل مكرر في التاني: فواتيره كلها بتتنقل، وبياناته الناقصة (تليفون/ملاحظة/عنوان) بتتضاف للباقي، والرصيد الافتتاحي بيتجمع */
function mergeCust(keepId,loseId){if(keepId===loseId)return;const k=getC(keepId),l=getC(loseId);if(!k||!l)return;
  S.invoices.forEach(r=>{if(r.cid===loseId){r.cid=keepId;r.cname=k.name;put('invoices',r)}});
  k.open=rd2((k.open||0)+(l.open||0));if(!k.phone&&l.phone)k.phone=l.phone;if(!k.addr&&l.addr)k.addr=l.addr;if(!k.note&&l.note)k.note=l.note;if(!k.due&&l.due)k.due=l.due;if(l.pfr)k.pfr={...l.pfr,...(k.pfr||{})};
  S.files.forEach(x=>{if(x.sid===loseId){x.sid=keepId;put('files',x)}});put('customers',k);del('customers',loseId);reflow(keepId)}
$('cuDup').addEventListener('click',e=>{const n=e.target.closest('[data-dupno]');if(n){const a=dupIgnGet();a.push(n.dataset.dupno);try{localStorage.setItem('dupIgn',JSON.stringify(a))}catch(e){}if(window.saveSettings)try{saveSettings()}catch(e){}drawCusts();return}const b=e.target.closest('[data-mg]');if(!b)return;const keepId=b.dataset.mg,g=dupGroups().find(gr=>gr.some(c=>c.id===keepId));if(!g)return;if(!ok2(b))return;g.forEach(c=>{if(c.id!==keepId)mergeCust(keepId,c.id)});drawCusts();drawDash()});
function drawCusts(){
  if(selC&&getC(selC)){$('cuMain').classList.add('hide');$('cuDet').classList.remove('hide');drawDet();return}
  selC=null;$('cuDet').classList.add('hide');$('cuMain').classList.remove('hide');
  const lastTs=c=>Math.max(0,...ledger(c).map(r=>r.ts)),idleCut=Date.now()-cuIdle*864e5;
  $('cuIdleBox').classList.toggle('hide',cuMode!=='idle');
  const q=$('cq').value.trim();let l=S.customers.filter(c=>(qm(c.name,q)||phoneHit(c,q))&&(cuMode==='arch'?!!c.arch:!c.arch)&&(cuMode==='debt'?balOf(c)>0:cuMode==='credit'?balOf(c)<0:cuMode==='idle'?(t=>t>0&&t<idleCut)(lastTs(c)):true));
  {const byName=(a,b)=>a.name.localeCompare(b.name,'ar');
   l.sort(cuSort==='bal'?(a,b)=>(cuMode==='credit'?balOf(a)-balOf(b):balOf(b)-balOf(a))||byName(a,b):cuSort==='last'?(a,b)=>(cuMode==='idle'?lastTs(a)-lastTs(b):lastTs(b)-lastTs(a))||byName(a,b):byName);$('cuTot').innerHTML='<span>👥 <b>'+plN(l.length,'عميل')+'</b></span><span>📒 مديونيات <b class="num" style="color:var(--danger)">'+f(l.reduce((s,c)=>s+Math.max(0,balOf(c)),0))+'</b></span>'+(()=>{const na=S.customers.filter(c=>c.arch).length;return na||cuMode==='arch'?'<button type="button" class="lnk" data-m="'+(cuMode==='arch'?'all':'arch')+'">'+(cuMode==='arch'?'→ كل العملاء':'🗄 '+na+' مؤرشف')+'</button>':''})()}
  {const dg=dupGroups();$('cuDup').classList.toggle('hide',!dg.length);if(dg.length)$('cuDup').innerHTML='<details class="card dupc"><summary><b>⚠️ عملاء ممكن يكونوا متسجلين مرتين ('+dg.length+')</b><span class="mute"> · افتح وشوف</span></summary><div class="mute" style="margin:4px 0">لو هو نفس الشخص: دوس «✓ ده الصح» على الاسم اللي يفضل، والتاني فواتيره وحسابه يتنقلوا له ويتمسح. لو مش نفس الشخص: دوس «مش هو».</div>'+dg.map(g=>'<div class="dupg"><div class="duph"><span>'+(g.why==='p'?'📞 نفس الرقم <b class="num">'+esc(g.lab)+'</b>':'👤 نفس الاسم <b>'+esc(g.lab)+'</b>')+'</span><button type="button" class="alt dupno" data-dupno="'+esc(g.gid)+'">مش هو ✕</button></div>'+g.map(c=>'<div class="ro dupr"><span><b>'+esc(c.name)+'</b><small class="mute"> · '+esc(cSub(c,2))+' · الحساب <b class="num">'+bal(c)+'</b></small></span><button type="button" class="alt" data-mg="'+esc(c.id)+'">✓ ده الصح</button></div>').join('')+'</div>').join('')+'</details>'}
  $('cuList').innerHTML=l.map(c=>`<div class="rec cr2" data-open="${c.id}"${agStyle(c)}>${av(c.name)}<div style="flex:1;min-width:0"><div class="cn">${esc(c.name)}</div><div class="mute">${esc(cSub(c,2))}</div></div><span class="cb ${bcls(c)} num">${bal(c)}</span></div>`).join('')||`<p class="mute">${S.customers.length?'مفيش عملاء بالاسم أو الرقم ده. امسح البحث.':'لسه مفيش عملاء. اضغط «➕ عميل» أو احفظ فاتورة باسم جديد.'}</p>`}

let cuFK='أخرى';const CUK=[['📄','عقد / اتفاق'],['📐','مقاسات'],['🧾','فاتورة قديمة'],['💳','شيك / إيصال'],['🖼','أخرى']];
const cuFiles=c=>S.files.filter(f=>f.sid===c.id).sort((a,b)=>b.ts-a.ts);
function cuFilesHtml(c){const l=cuFiles(c);return`<div class="card" id="cuFiles"><div class="ro" style="color:var(--ink)"><b>📎 الصور والمستندات</b><small class="mute">${l.length?l.length+' مستند':''}</small></div><div class="spc" style="margin-top:6px">${CUK.map(([i,k])=>`<button type="button" data-cfk="${k}">${i} ${k}</button>`).join('')}</div><div class="spth">${l.map((f,i)=>`<button type="button" class="spt" data-cfv="${i}"><img src="${f.d}" alt=""><small>${esc(f.title||f.kind||'')}</small></button>`).join('')}</div><input type="file" id="cuFI" accept="image/*" multiple class="vh"></div>`}
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
   <div class="mute" style="margin-top:4px">اضغط أي صف لعرض الفاتورة.${cdq.trim()?' (البحث بيصفّي الجدول بس، والملخص فوق للفترة كلها)':''}</div><div class="btns"><button class="main" data-stmg="1">📑 كشف حساب مفصّل (الفترة كلها في ورقة)</button><button class="alt" data-stimg="1">🖼️ حفظ الملخص كصورة</button></div>`}
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
   <input id="cdq" placeholder="ابحث: مبلغ أو صنف أو كود أو مرتجع" title="المبلغ ممكن تقريبي: 700 · 600-800 · 7000+" value="${esc(cdq)}" style="margin:6px 0 2px"><div id="cdTbl">${tblHtml(c)}</div></div>
  ${cuFilesHtml(c)}
  <div class="ro" style="justify-content:flex-start;gap:14px"><button class="lnk" data-arch="1">${c.arch?'↩ إلغاء الأرشفة':'📦 أرشفة'}</button><button class="lnk" data-delc="1" style="color:var(--danger)">🗑️ حذف العميل</button></div><div class="info" id="dcMsg" style="color:var(--danger)"></div>`;pwMount('cu')}
/* v360: كشف حساب زي كشف البنك: جدول واحد بالتاريخ (عليه / دفع / رصيد جاري) وأصناف كل فاتورة تحتها + إجمالي الأصناف + الرصيد دلوقتي */
function stmtMerge(){const c=getC(selC);if(!c)return;const[a,b]=perRange(),all=ledger(c).slice().sort((x,y)=>x.ts-y.ts),ss=sumOf(c),L=all.filter(r=>r.ts>=a&&r.ts<=b);
  if(!L.length){toast('مفيش معاملات في الفترة دي');return}
  const lab=per==='c'?(pF||'...')+' إلى '+(pT||'...'):per==='mo'?moLab():'من الأول لحد النهارده',G=new Map(),rows=[];let run=ss.open,lastP=0;
  rows.push(Object.assign(['','رصيد أول الفترة','','',bsg(run)],{bg:'#eceff3'}));
  L.forEach(r=>{
    if(r.type==='inv'){const v=val(r),p=pd(r);run=rd2(run+v-p);let s=0;const its=[];
      (r.rows||[]).forEach(x=>{const sg=x.rt?-1:1,vv=sg*(+x.v||0),sz=(+x.w>0&&+x.h>0&&x.t!=='mq')?' '+fq(Math.min(+x.w,+x.h))+'×'+fq(Math.max(+x.w,+x.h)):'',nm0=String(x.n||'').trim()+sz,cn=sg*(+x.c||0),qq=sg*(+x.q||0);
        its.push(['','   '+(x.rt?'↩ ':'')+f(cn)+' × '+nm0+(qq?' ('+fq(qq)+' م²)':'')+' = '+f(vv),'','','']);
        const k=(x.rt?'↩ ':'')+nm0,o=G.get(k)||{c:0,q:0,v:0};o.c+=cn;o.q=rd2(o.q+qq);o.v=rd2(o.v+vv);G.set(k,o);s+=vv});
      const d=rd2(v-s);if(Math.abs(d)>=1){its.push(['','   خصم / إضافات / رسوم = '+f(d),'','','']);const o=G.get('خصم / إضافات / رسوم')||{c:0,q:0,v:0};o.v=rd2(o.v+d);G.set('خصم / إضافات / رسوم',o)}
      rows.push(Object.assign([dshort(r.ts),'🧾 فاتورة '+stTag(r),f(v),p>0?f(p):'',bsg(run)],{bg:'#e8f1fb'}));its.forEach(x=>rows.push(x));
      if(p>0){lastP=r.ts;rows.push(['','   💵 دفع: '+pdBy(r).filter(y=>y[1]>0).map(y=>y[0]+' '+f(y[1])).join(' + '),'','',''])}}
    else{const p=pd(r);run=rd2(run-p);if(p>0)lastP=r.ts;rows.push(Object.assign([dshort(r.ts),'💵 دفعة · '+pdBy(r).filter(y=>y[1]>0).map(y=>y[0]).join(' + '),'',f(p),bsg(run)],{bg:'#e6f4e6'}))}});
  rows.push(Object.assign(['','الحساب آخر الفترة','','',bsg(ss.end)],{bg:'#fde9e8'}));
  const T=[{th:['التاريخ','البيان','عليه','دفع','الرصيد'],w:[.17,.39,.14,.14,.16],rows}],top=[...G].sort((x,y)=>Math.abs(y[1].v)-Math.abs(x[1].v)),tr=top.slice(0,6).map(([k,o])=>[k,f(o.c)+(o.q?' ('+fq(o.q)+' م²)':''),f(o.v)]),rest=top.slice(6);
  if(rest.length)tr.push(['باقي الأصناف ('+rest.length+')','',f(rest.reduce((s,x)=>s+x[1].v,0))]);
  if(tr.length)T.push({title:'📦 إجمالي الأصناف في الفترة',th:['الصنف','العدد','القيمة'],w:[.5,.26,.24],rows:tr});
  const meta=['الفترة: '+lab];if(lastP)meta.push('آخر دفعة: '+dshort(lastP));if(c.due&&ss.end>0)meta.push('ميعاد السداد: '+dueLabel(c.due));
  const cv=sheet({wm:1,name:c.name,sub:'كشف حساب',date:dshort(Date.now()),meta,tables:T,
    sum:[['كان عليه أول الفترة',bsg(ss.open)],['طلب ('+ss.n+' فاتورة)',f(ss.inv)],['دفع',f(ss.pay)],['الحساب دلوقتي',bsg(ss.end),1]]});
  showImg(cv,'كشف-'+sfn(c.name)+'.png','كشف حساب '+c.name,true,c.phone,null)}
function stmtImg(){const c=getC(selC),l=rowsOf(c),ss=sumOf(c);const lab=per==='c'?(pF||'...')+' إلى '+(pT||'...'):per==='mo'?moLab():PL[per];
  const cv=sheet({wm:1,name:c.name,sub:'كشف حساب',date:dshort(Date.now()),meta:['الفترة: '+(per==='w'||per==='m'?'آخر ':'')+lab].concat(l.some(({r})=>hasRet(r))?['↩ = الفاتورة فيها مرتجع']:[]),
    tables:[{th:['التاريخ','الكود','القيمة','المدفوع','الحساب'],w:[.2,.3,.17,.17,.16],rows:l.map(({r,run})=>[dshort(r.ts),stTag(r),r.type==='pay'?'-':f(val(r)),f(pd(r)),f(run)])}],
    sum:[['الحساب أول الفترة',bsg(ss.open)],['فواتير الفترة ('+ss.n+')',f(ss.inv)],['المدفوع في الفترة',f(ss.pay)],['الحساب آخر الفترة',bsg(ss.end),1]]});
  showImg(cv,'كشف-'+sfn(c.name)+'.png','كشف حساب '+c.name,true,c.phone,null)}
$('t-cu').addEventListener('click',e=>{const t=e.target,d=t.dataset;
  {const tm=t.closest('[data-tfm]');if(tm){tfSendC(getC(tm.dataset.tfc),tm.dataset.tfm);return}if(t.closest('[data-tfamt]')){pset('tfAmt',!tfAmtOn());drawCusts();return}if(t.closest('[data-tfset]')){document.querySelector('#hdrSet').click();stGo('pay');return}}  {const fk=t.closest('[data-cfk]');if(fk){cuFK=fk.dataset.cfk;$('cuFI').value='';$('cuFI').click();return}const fv=t.closest('[data-cfv]');if(fv){const c=getC(selC);if(c)spView(cuFiles(c),+fv.dataset.cfv,CUK);return}}

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
  if(d.stimg){stmtImg();return}if(d.stmg){stmtMerge();return}
  if(d.arch){const c=getC(selC);if(!c)return;c.arch=c.arch?false:true;if(!c.arch)delete c.arch;put('customers',c);selC=null;drawCusts();toast(c.arch?'اتأرشف: مش هيظهر في القايمة':'رجع للقايمة');return}
  if(d.delc){const c=getC(selC);if(ledger(c).length){$('dcMsg').textContent='العميل عنده فواتير. امسحها الأول أو سيبه.';return}if(cuFiles(c).length){$('dcMsg').textContent='العميل عنده صور. امسحها الأول أو سيبه.';return}
    if(!ok2(t))return;del('customers',c.id);selC=null;drawCusts();return}
  if(d.pay){const c=getC(selC),r=c&&pwRecord('cu',c);if(!r){$('cdMsg').textContent='اكتب مبلغ الدفعة';return}
    S.invoices.push(r);put('invoices',r);lastSaved={id:r.id,at:Date.now(),dueBak:payDone(c,r)};delete PW.cu;cuPm=false;drawDet();showRec(r,false,'تم تسجيل الدفعة ✓').then(()=>{if($('autoWa').checked)autoSend(r)})}});
$('t-cu').addEventListener('change',e=>{if(e.target.id==='cuFI'){const c=getC(selC),fs=[...e.target.files];if(!c||!fs.length)return;(async()=>{try{for(const file of fs){const d=await spShrink(file),o={id:uid(),sid:c.id,kind:cuFK,ts:Date.now(),d};S.files.push(o);put('files',o)}toast('✅ اتحفظ '+(fs.length>1?fs.length+' صور':'الصورة')+' (أبيض وأسود)');drawDet()}catch(er){toast('⚠️ معرفتش أحفظ الصورة')}})();return}if(e.target.id==='cuSort'){cuSort=e.target.value;drawCusts()}else if(e.target.dataset.f==='phone'){const c=getC(selC);if(c){e.target.value=normPhones(e.target.value);c.phone=e.target.value;DV++;touch('customers',c)}}else if(e.target.id==='cuIdle'){cuIdle=+e.target.value||60;drawCusts()}else if(e.target.id==='cdMo'){const v=e.target.value;if(v){const[y,m]=v.split('-').map(Number);pMo=new Date(y,m-1,1).getTime();drawDet()}}else if(e.target.id==='pf'){pF=e.target.value;drawDet()}else if(e.target.id==='pt'){pT=e.target.value;drawDet()}});
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


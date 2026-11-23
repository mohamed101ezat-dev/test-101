/* ---------- تطبيق الموبايل (PWA) ---------- */
$('appVer').textContent='نسخة التطبيق: '+APP_VER;
/* v334: بيجيب آخر نسخة على طول (لو فيه نت) */
/* v334: الفحص السريع */
function chkItems(){const now=Date.now(),day=864e5,ag=t=>t?Math.floor((now-t)/day):null,L=[];const add=(ok,t,go)=>L.push({ok,t,go});
  const cb=+lsv('cbAt','0');add(!!FBDB&&cb&&ag(cb)<=2,FBDB?(cb?'☁️ آخر نسخة سحابية: '+stamp(cb):'☁️ لسه مفيش نسخة سحابية'):'☁️ مش داخل بحساب، فمفيش مزامنة ولا نسخ سحابية','data');
  const mb=+lsv('lastBackup','0');add(mb&&ag(mb)<=7,mb?'💾 آخر نسخة بإيدك: '+stamp(mb)+(ag(mb)>7?' (من أكتر من أسبوع)':''):'💾 عمرك ما حفظت نسخة بإيدك','data');
  const nf=nfState();add(nf==='on',nf==='on'?'🔔 إشعارات الموبايل شغّالة':nf==='no'?'🔔 الجهاز ده مش بيدعم الإشعارات':'🔔 إشعارات الموبايل مقفولة، فالتنبيهات مش بتوصلك','nf');
  let lk=false;try{lk=lkReady()}catch(_){}add(lk,lk?'🔒 البرنامج عليه رقم سري':'🔒 مفيش رقم سري: أي حد ماسك الموبايل يقدر يمسح أو يعدّل','lock');
  const pm=pfAll().filter(x=>x.on!==false);const full=[];pm.forEach(x=>x.accs.forEach((a,i)=>{if(a.on!==false&&accFull(a))full.push(x.n+' · '+accLbl(a,x,i))}));const nonum=pm.filter(x=>!pmPick(x));
  add(!full.length&&!nonum.length,full.length?'💳 وصلت الليميت: '+full.join('، '):nonum.length?'💳 طرق مالهاش رقم شغّال: '+nonum.map(x=>x.n).join('، '):'💳 أرقام التحويل كلها تمام','pay');
  const np=S.customers.filter(c=>!c.phone&&balOf(c)>0).length;add(!np,np?'👥 مديونين من غير رقم: '+np+'، فمش هتعرف تبعتلهم تذكير':'👥 كل المديونين ليهم رقم',null);
  const fr=fracList().length;add(!fr,fr?'🧮 حسابات فيها كسور: '+fr+' (سوّيها من الحفظ والنسخ)':'🧮 مفيش كسور في الحسابات','data');
  return L}
function chkDraw(){const L=chkItems();$('chkList').innerHTML=L.map(x=>'<div class="chk '+(x.ok?'ok':'bad')+'"'+(x.go?' data-chkgo="'+x.go+'"':'')+'><span>'+(x.ok?'✅':'⚠️')+'</span><span>'+esc(x.t)+'</span>'+(x.go?'<span class="sa">‹</span>':'')+'</div>').join('')}
document.addEventListener('click',e=>{const g=e.target.closest&&e.target.closest('[data-chkgo]');if(g)stGo(g.dataset.chkgo)});
$('idReset2').onclick=()=>{const b=$('idReset');if(b)b.click()};
/* v336: الخزنة: الكاش المتوقع في الدرج والعجز أو الزيادة */
let drwTs=dAgo(0);const drwAll=()=>{try{const o=JSON.parse(lsv('drawer','{}'));return o&&typeof o==='object'?o:{}}catch(_){return{}}};
function drwCalc(a){const b=dEnd(a),K=dayKey(a),D=drwAll(),cur=D[K]||{};let cin=0;S.invoices.forEach(r=>{if(r.ts<a||r.ts>=b)return;pdBy(r).forEach(([n,v])=>{if(/^(كاش|نقدي)$/.test(String(n).trim()))cin+=+v||0})});
  const ex=S.expenses.filter(x=>x.ts>=a&&x.ts<b).reduce((s,x)=>s+(+x.amt||0),0),sp=S.purchases.filter(x=>x.type==='pay'&&x.ts>=a&&x.ts<b&&(!x.how||/^(كاش|نقدي)$/.test(x.how))).reduce((s,x)=>s+(+x.amt||0),0);
  const prevK=dayKey(dAgo(Math.round((dAgo(0)-a)/864e5)+1)),pv=D[prevK],open=cur.open!=null?+cur.open:(pv&&pv.act!=null?+pv.act:0);
  return{K,open,cin:rd2(cin),ex:rd2(ex),sp:rd2(sp),exp:rd2(open+cin-ex-sp),act:cur.act!=null?+cur.act:null}}
function drwDraw(){const r=drwCalc(drwTs),ln=(n,v,cl)=>'<div class="ro" style="color:var(--ink)"><span>'+n+'</span><b class="num'+(cl?' '+cl:'')+'">'+f(v)+'</b></div>';
  $('drwDay').textContent=dayLabel(drwTs);$('drwNext').disabled=drwTs>=dAgo(0);$('drwOpen').value=r.open?fq(r.open):'';$('drwAct').value=r.act!=null?fq(r.act):'';
  $('drwBody').innerHTML=ln('كاش أول اليوم',r.open)+ln('➕ كاش دخل (فواتير ودفعات)',r.cin)+ln('➖ مصروفات',r.ex)+(r.sp?ln('➖ اتدفع لموردين كاش',r.sp):'')+'<div class="ro" style="color:var(--ink);border-top:1px dashed var(--line);padding-top:4px;margin-top:4px"><b>المفروض يكون في الدرج</b><b class="num">'+f(r.exp)+'</b></div>';
  const d=r.act!=null?rd2(r.act-r.exp):null;$('drwRes').innerHTML=d==null?'':Math.abs(d)<1?'<div class="drr ok">✅ مظبوط، مفيش عجز ولا زيادة</div>':d<0?'<div class="drr bad">⚠️ عجز '+f(-d)+' جنيه</div>':'<div class="drr up">➕ زيادة '+f(d)+' جنيه</div>'}
function drwSet(k,v){const D=drwAll(),K=dayKey(drwTs),o=D[K]||{};if(v==null||v==='')delete o[k];else o[k]=rd2(nv(v));D[K]=o;const ks=Object.keys(D).sort();while(ks.length>120)delete D[ks.shift()];svk('drawer',JSON.stringify(D))}
$('drwSave').onclick=()=>{drwSet('act',$('drwAct').value.trim());drwDraw();try{stSum()}catch(_){}};$('drwOpen').onchange=()=>{drwSet('open',$('drwOpen').value.trim());drwDraw()};
$('drwPrev').onclick=()=>{drwTs=dAgo(Math.round((dAgo(0)-drwTs)/864e5)+1);drwDraw()};$('drwNext').onclick=()=>{if(drwTs<dAgo(0)){drwTs=dAgo(Math.round((dAgo(0)-drwTs)/864e5)-1);drwDraw()}};
$('appUpd').onclick=async()=>{const b=$('appUpd');b.disabled=true;b.textContent='⏳ بدوّر على تحديث…';try{flushTouch()}catch(_){}try{await flushIDB()}catch(_){}
  try{const r=await fetch('js/app.js?chk='+Date.now(),{cache:'no-store'}).then(x=>x.text()),m=r.match(/APP_VER='(\d+)'/),nv2=m&&m[1];if(!nv2){b.textContent='مفيش نت، جرّب تاني';b.disabled=false;return}
    if(nv2===APP_VER){b.textContent='✓ إنت على آخر نسخة ('+APP_VER+')';setTimeout(()=>{b.textContent='🔄 حدّث البرنامج دلوقتي';b.disabled=false},3000);return}
    b.textContent='⬇️ بنزّل نسخة '+nv2+'…';const g=await navigator.serviceWorker.getRegistration();if(g)await g.update();for(const k of await caches.keys())if(k.startsWith('eltabakha-'))await caches.delete(k);location.reload()}catch(e){b.textContent='معرفتش أحدّث، جرّب تاني';b.disabled=false}};
$('hdrVer').textContent='v'+APP_VER;
/* لو البرنامج فاضل مفتوح: بنسأل السيرفر كل ساعة، ومبنعرضش التحديث وفي فاتورة بتتكتب عشان ما تضيعش */
let verAt=0;async function verCheck(){if(location.protocol.indexOf('http')||!navigator.onLine||Date.now()-verAt<36e5||[...$('rows').children].some(d=>!rowBlank(d)))return;verAt=Date.now();
  try{const m=/app\.js\?v=(\d+)/.exec(await(await fetch('index.html',{cache:'no-store'})).text());if(m&&+m[1]>+APP_VER)toast('فيه نسخة جديدة من البرنامج','تحديث',()=>location.reload())}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)verCheck()});
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0)navigator.serviceWorker.register('sw.js?v='+APP_VER).catch(()=>{});
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{})}catch(e){}

try{$('autoWa').checked=localStorage.getItem('autoWa')==='1'}catch(e){}
$('autoWa').onchange=()=>{try{localStorage.setItem('autoWa',$('autoWa').checked?'1':'0')}catch(e){}};


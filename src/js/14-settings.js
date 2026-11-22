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
/* v336: إخفاء المخزن */
const applyStk=()=>{const t=document.querySelector('.stile[data-sp="stk"]');if(t)t.classList.toggle('hide',!pget('stkShow',true));$('stkShow').checked=pget('stkShow',true)};$('stkShow').onchange=()=>{pset('stkShow',$('stkShow').checked);applyStk()};applyStk();
try{if(localStorage.getItem('theme')==='dark'){$('themeChk').checked=true;setTheme(true)}}catch(e){}
$('themeChk').onchange=()=>setTheme($('themeChk').checked);
/* شكل 3D: اختيار مستقل عن اللون — بيتحفظ على الجهاز وشغّال مع أي لون */
{const ap=()=>document.documentElement.classList.toggle('d3',pget('d3',true));$('d3Chk').checked=pget('d3',true);$('d3Chk').onchange=()=>{pset('d3',$('d3Chk').checked);ap()};ap()}
(function(){let p='sage';try{p=localStorage.getItem('pal')||'sage'}catch(e){}setPal(p);
document.querySelectorAll('#pals button,#palsCalm button').forEach(b=>b.onclick=()=>setPal(b.dataset.p));$('palCustom').value=getCC();$('palCustom').oninput=()=>{try{localStorage.setItem('cc',$('palCustom').value)}catch(e){}setPal('custom')};
$('animChk').checked=pget('anim',animDef());$('animChk').onchange=()=>{pset('anim',$('animChk').checked);applyAnim()};applyAnim();perfWatch()})();
[['xlOn','xlOn'],['editInv','editInv'],['dupInv','dupInv'],['repLastOn','repLastOn'],['dayCl','dayCl'],['weekCl','weekCl'],['monCl','monCl'],['bulkRemChk','bulkRem'],['trashOn','trashOn'],['bkAl','bkAl'],['snapOn','snapOn'],['autoBk','autoBk'],['logoOn','logoOn'],['fancyInv','fancyInv'],['qrOn','qrOn'],['pdfOn','pdfOn'],['ceilSz','ceilSz'],['nfRem','nfRem'],['nfStk','nfStk'],['nfSup','nfSup'],['rcOn','rcOn'],['qtOn','qtOn'],['remDays','remDays'],['remOld','remOld'],['remBal','remBal']].forEach(([id,k])=>{$(id).checked=pget(k,true);$(id).onchange=()=>{pset(k,$(id).checked);applyFeatures();drawCusts();if(k==='ceilSz')calc()}});
/* متابعة الطلبيات: مفتوحة افتراضياً */
$('ordOn').checked=ordOn();$('ordOn').onchange=()=>{pset('ordOn',$('ordOn').checked);drawDash();calc()};
/* الإضافات ظاهرة دايماً: مقفولة افتراضياً لأنها مش في كل فاتورة */
{const xa=()=>{document.documentElement.classList.toggle('xalw',$('xAlw').checked);$('moreBtn').textContent=$('xAlw').checked?'➕ إضافات (مرتجع، ملاحظة)':'➕ إضافات (نولون، خصم، مرتجع، رد كاش، ملاحظة)'};
  $('xAlw').checked=pget('xAlw',false);xa();$('xAlw').onchange=()=>{pset('xAlw',$('xAlw').checked);xa()}}
const DEFPRE='تحويل محفظة=1\nتحويل انستا=0';
const pfAll0=()=>{try{const a=JSON.parse(lsv('pfPre2','')||'null');if(Array.isArray(a))return a.filter(x=>x&&x.n)}catch(e){}
  return lsv('pfPre',DEFPRE).split('\n').map(l=>{const i=l.lastIndexOf('=');return i<0?null:{n:l.slice(0,i).trim(),p:nv(l.slice(i+1)),num:'',ic:'',on:true}}).filter(x=>x&&x.n)};
/* v331: كل طريقة فيها أكتر من رقم/حساب، ولكل رقم: اسم اختياري، نسبة، شغّال/مقفول، ليميت يومي وشهري */
const pmIsBank=x=>x.t==='bank'||/بنك|bank/i.test(x.n||'');
const accId=()=>'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function pmNorm(x){if(!Array.isArray(x.accs)||!x.accs.length)x.accs=[{id:'a0',lb:'',num:x.num||'',p:+x.p||0,on:true}];x.accs.forEach((a,i)=>{if(!a.id)a.id='a'+i});x.bank=pmIsBank(x);return x}
const pfAll=()=>pfAll0().map(pmNorm);
let AU={k:-1,m:{}};
function accUseAll(){if(AU.k===DV)return AU.m;const m={},d0=dAgo(0),n=new Date(),m0=new Date(n.getFullYear(),n.getMonth(),1).getTime();
  S.invoices.forEach(r=>{if(!r||!Array.isArray(r.accs)||r.ts<m0)return;r.accs.forEach(z=>{if(!z||!z.id)return;const o=m[z.id]||(m[z.id]={d:0,m:0});o.m+=+z.a||0;if(r.ts>=d0)o.d+=+z.a||0})});AU={k:DV,m};return m}
const accUse=id=>accUseAll()[id]||{d:0,m:0};
const accFull=a=>{const u=accUse(a.id);return(+a.dl>0&&u.d>=+a.dl)||(+a.ml>0&&u.m>=+a.ml)};
const accHas=(a,x)=>x.bank?!!String(a.acct||a.iban||a.card||'').trim():!!String(a.num||'').trim();
const accShow=(a,x)=>String(x.bank?(a.acct||a.iban||a.card||''):(a.num||'')).trim();
const accLbl=(a,x,i)=>String(a.lb||'').trim()||(x.bank?String(a.bn||'').trim():'')||accShow(a,x)||('رقم '+((i||0)+1));
const accOn=x=>x.accs.filter(a=>a.on!==false);
const accFirst=x=>accOn(x).find(a=>!accFull(a))||accOn(x)[0]||x.accs[0];
/* الرقم اللي بيتبعت في الرسايل: أول رقم شغّال ومكتوب وموصلش الليميت */
const pmPick=x=>accOn(x).find(a=>!accFull(a)&&accHas(a,x))||null;
const pfPresets=()=>pfAll().filter(x=>x.on!==false).map(x=>{const a=accFirst(x);return{n:x.n,p:+(a?a.p:x.p)||0,acc:a&&a.id}});
/* v329: كل طريقة تختار تظهر فين: الفاتورة / تسجيل دفعة / رسالة التحويل / رسايل الواتساب (من غير اختيار = ظاهرة) */
const PM_W=[['inv','🧾 الفاتورة (والدفعات)'],['tf','💳 رسالة التحويل'],['msg','💬 رسايل الواتساب']];
const pmW=(x,k)=>!(x&&x.w&&x.w[k]===0);
const pfPresetsAt=k=>pfAll().filter(x=>x.on!==false&&pmW(x,k)).map(x=>{const a=accFirst(x);return{n:x.n,p:+(a?a.p:x.p)||0,acc:a&&a.id}});
const pmIc=n=>{const x=pfAll().find(v=>v.n===n);return x&&x.ic||''};
const preHtml=c=>'<button class="alt" data-cash="1">نقدي</button>'+pfPresetsAt('inv').map((x,i)=>`<button class="alt" data-pre="${i}">${pmBadge(x.n)?pmBadge(x.n)+' ':''}${esc(x.n)} ${fq(rateFor(c,x))}%</button>`).join('');
function applyFeatures(){cbStatus();{const x=pget('xlOn',true);['iExp','xlBox'].forEach(i=>{const e=$(i);if(e)e.classList.toggle('hide',!x)})}document.body.classList.toggle('no-rc',!pget('rcOn',true));document.body.classList.toggle('no-qt',!pget('qtOn',true));$('saveImg').classList.toggle('hide',!pget('saveImgOn',false));$('pdfRow').classList.toggle('hide',!pget('pdfOn',true));$('paperBox').classList.toggle('hide',!pget('pdfOn',true));$('dayClose').classList.add('hide');$('monRep').classList.toggle('hide',!pget('monCl',true));$('pfPre').innerHTML=preHtml();spRefresh();calc();bkBan();autoBan();drawDash()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoBan()});

/* رسائل الواتساب */
const svk=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}if(SET_S.has(k))setSoon()};
function remPayAutoShow(){const e=$('remPayAuto');if(!e)return;const man=lsv('rempay','').trim();e.innerHTML=man?'⚠ مكتوبة بإيدك، فالأرقام التلقائية مش شغّالة. <button type="button" class="lnk" id="remPayClr" style="font-size:12px">امسحها وارجع للتلقائي</button>':'التلقائي دلوقتي: '+esc(pfAll().filter(x=>x.on!==false&&pmW(x,'msg')&&pmPick(x)).map(x=>x.n+' '+accShow(pmPick(x),x)).join(' · ')||'مفيش أرقام في طرق الدفع')}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#remPayClr')){$('remPay').value='';svk('rempay','');remPayAutoShow();try{msgPrev()}catch(_){}}});
function loadMsgUI(){setTimeout(remPayAutoShow,0);$('shopN').value=shopN();$('custW').value=custW();$('docW').value=docW();$('tplInv').value=tplOf('inv');$('tplPay').value=tplOf('pay');$('tplRem').value=tplOf('rem');$('remFirm').value=lsv('remfirm','30');$('remLong').value=lsv('remlong','90');$('remPay').value=lsv('rempay','');RTF.forEach(([id,k])=>{$(id).value=lsv('rt_'+k,'');$(id).placeholder=rtDef(k)});$('tplRdy').value=tplOf('rdy');msUI()}
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
function stGo(k){if(k==='stk'||k==='sup'){skCur=k;document.querySelector('#bnav [data-t="sk"]').click();return}stCur=k||'';$('stHome').classList.toggle('hide',!!stCur);document.querySelectorAll('#t-st .stp').forEach(p=>p.classList.toggle('hide',p.dataset.sp!==(stCur==='desc'?'des':stCur)));{const dz=$('invDes');if(dz)dz.dataset.dm=stCur==='desc'?'col':'sz';const dt=$('desT');if(dt)dt.textContent=stCur==='desc'?'🎨 شكل الفاتورة والألوان':'📐 تصميم ومقاسات الفاتورة'}
  try{if((stCur==='des'||stCur==='desc')&&window.invDesOpen)invDesOpen();else if(stCur==='msg'){loadMsgUI();msgPrev()}else if(stCur==='pay')pmDraw();else if(stCur==='notes')ntDraw();else if(stCur==='shop'){loadMsgUI();shopTxtLoad()}else if(stCur==='look')fzMark();else if(stCur==='rem')remUI();else if(stCur==='data'){storDraw();fracDraw();try{cbStatus()}catch(_){}}else if(stCur==='chk')chkDraw();else if(stCur==='drw'){drwTs=dAgo(0);drwDraw()}else if(stCur==='exp')expOpen();else if(stCur==='sup')supOpen(null);else if(stCur==='stk')stkOpen();else if(stCur==='nf')nfUI();else if(!stCur)stSum()}catch(e){}
  window.scrollTo(0,0)}
function stSum(){const W_=(k,t)=>{const e=$('ss_'+k);if(e)e.textContent=t};$('ssIt').textContent=plN(S.items.length,'صنف');{const t=supTot();$('ssSup').textContent=plN(S.suppliers.length,'مورد')+(t>0?' · ليهم '+f(t)+(supOv()>0?' ⏰':''):'')}{const m=stkAll(),n=stkLow(m);$('ssStk').textContent=m.size?plN(m.size,'صنف')+(n?' · ⚠️ '+n:''):'لسه فاضي'}let ps=[];try{ps=pfPresets()}catch(e){}
  W_('shop',shopN());W_('des','المقاسات والخطوط والأعمدة · '+PAPERS[paperKey()].n);W_('desc',(pget('fancyInv',true)?'التصميم الملون':'تصميم بسيط')+' · الألوان والقوالب');
  const n=liveNotes().length;W_('notes',n?n+(n>1?' ملاحظات':' ملاحظة'):'مفيش ملاحظات');
  try{const L=chkItems(),b=L.filter(x=>!x.ok).length;W_('chk',b?'⚠️ محتاج منك: '+b:'✅ كله تمام')}catch(_){}
  try{const r=drwCalc(dAgo(0));W_('drw','المتوقع في الدرج: '+f(r.exp)+(r.act!=null?(Math.abs(r.act-r.exp)<1?' · مظبوط ✓':r.act<r.exp?' · عجز '+f(rd2(r.exp-r.act)):' · زيادة '+f(rd2(r.act-r.exp))):''))}catch(_){}
  W_('inv',[pget('autoWa',false)&&'واتساب بعد الحفظ',pget('editInv',true)&&'تعديل',pget('dupInv',true)&&'تكرار',pget('qtOn',true)&&'عروض أسعار',pget('pdfOn',true)&&'PDF وطباعة',pget('qrOn',true)&&'QR',pget('saveImgOn',false)&&'حفظ كصورة'].filter(Boolean).join(' · ')||'كل الخيارات مقفولة');
  W_('pay',ps.length?ps.map(x=>x.n+' '+fq(x.p)+'%').join(' · '):'مفيش طرق دفع');
  W_('msg','فاتورة · دفعة · تذكير'+($('autoWa').checked?' · إرسال تلقائي':''));
  W_('rem',pget('remOn',true)?'بعد '+dz(Math.round(+lsv('remDays','7'))||7)+' من غير دفع':'مقفول');
  W_('cl',[pget('dayCl',true)&&'يومي',pget('weekCl',true)&&'أسبوعي',pget('monCl',true)&&'تقرير شهري',pget('xlOn',true)&&'Excel'].filter(Boolean).join(' · ')||'مقفول');
  {const[a,b]=monRange(Date.now()),t=exTot(exIn(a,b));W_('exp',t?f(t)+' الشهر ده':'مفيش الشهر ده')}
  W_('nf',nfState()==='on'?'شغالة':'مقفولة');
  W_('look',(document.documentElement.getAttribute('data-theme')==='dark'?'ليلي':'نهاري')+' · خط '+({x:'أصغر',s:'صغير',m:'وسط',l:'كبير',xl:'أكبر'}[lsv('fz','m')||'m']||'وسط'));
  W_('lock',lsv('lkOn','')==='1'?'مقفول برقم سري':'من غير قفل');
  W_('data',$('stor').textContent.replace(/^الحفظ:\s*/,'').replace(/\.$/,''))}
$('t-st').addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){document.querySelector('#bnav button[data-t="'+g.dataset.go+'"]').click();window.scrollTo(0,0);return}const b=e.target.closest('.sti[data-sp],.stile[data-sp]');if(b){stGo(b.dataset.sp);return}if(e.target.closest('[data-stback]')){if(stkFromIt&&stCur==='stk'){stkFromIt=false;stGo('');document.querySelector('#bnav button[data-t="it"]').click();window.scrollTo(0,0)}else{stkFromIt=false;stGo('')}}});
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
const ST_SYN={exp:'مصروف مصاريف ايجار كهربا مرتبات صرف',sup:'مورد موردين شراء بضاعه فاتوره شراء',stk:'مخزون الواح كميه جرد',pay:'طرق الدفع محفظه فودافون انستا كاش نسبه عموله',msg:'واتساب رساله قالب نص صياغه',rem:'تذكير متاخر مديونين ديون ميعاد تذكير الكل',cl:'اقفال تقرير يومي شهري ربح صافي',nf:'اشعار تنبيه',look:'شكل لون ليلي خط حجم',lock:'قفل رقم سري بصمه امان حذف تعديل',data:'نسخه احتياطي حفظ استيراد تصدير فايربيس سحابي مزامنه حساب',shop:'اسم المحل لوجو لقب اسم الفاتوره طريقه البيع',des:'تصميم الفاتوره الوان خط ختم علامه مائيه',notes:'ملاحظات الفاتوره سطور ثابته عنوان واتساب انستا فودافون ارقام تحويل',inv:'خيارات الفاتوره ارسال واتساب بعد الحفظ طباعه pdf qr كود تقريب تعديل تكرار طلبيات حفظ صوره نولون خصم'};
let stIdx=null;
function stBuild(){stIdx=[];document.querySelectorAll('#t-st .stp').forEach(p=>{const pg=p.dataset.sp,pt=((p.querySelector('.sth b')||{}).textContent||'').trim();stIdx.push({pg,pt,t:pt,k:arN(pt+' '+(ST_SYN[pg]||'')),e:null});
  p.querySelectorAll('label.opt,.card>b,.card>label,summary,.card>.mute').forEach(e=>{const t=e.textContent.replace(/\s+/g,' ').trim();if(t.length>1&&t.length<150)stIdx.push({pg,pt,t,k:arN(t+' '+pt),e})})})}
function stFind(q){const w=arN(q).split(/\s+/).filter(Boolean);if(!w.length)return[];if(!stIdx)stBuild();const seen=new Set(),out=[];
  for(const r of stIdx){if(w.every(x=>r.k.includes(x))){const k=r.pg+'|'+r.t;if(!seen.has(k)){seen.add(k);out.push(r)}}if(out.length>=12)break}return out}
$('stSrch').oninput=()=>{const q=$('stSrch').value.trim(),box=$('stRes');if(!q){box.classList.add('hide');$('stMain').classList.remove('hide');return}
  const r=stFind(q);$('stMain').classList.add('hide');box.classList.remove('hide');window.stHits=r;
  box.innerHTML=r.length?r.map((x,i)=>`<button type="button" class="sti" data-rs="${i}"><span class="si">🔎</span><span class="stt"><b>${esc(x.t)}</b><small>${x.e?esc(x.pt):'صفحة كاملة'}</small></span><span class="sa">‹</span></button>`).join(''):'<div class="mute" style="padding:10px">مفيش إعداد بالاسم ده. جرّب كلمة تانية.</div>'};
$('stRes').onclick=e=>{const b=e.target.closest('[data-rs]');if(!b)return;const r=window.stHits[+b.dataset.rs];$('stSrch').value='';$('stRes').classList.add('hide');$('stMain').classList.remove('hide');stGo(r.pg);
  if(r.e)setTimeout(()=>{let d=r.e.closest('details');while(d){d.open=true;d=d.parentElement&&d.parentElement.closest('details')}const t=r.e.getClientRects().length?r.e:(r.e.closest('.card')||r.e);t.scrollIntoView({block:'center'});t.classList.add('stflash');setTimeout(()=>t.classList.remove('stflash'),2200)},80)};
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
  $('ntList').innerHTML=l.map((n,i)=>{const col=n.c||'',cust=!!col&&!NCOL.includes(col);return`<div class="ntr" data-i="${i}"><textarea data-nt="t" rows="2" placeholder="اكتب الملاحظة" style="color:${col||'var(--ink)'};font-weight:400">${esc(n.t||'')}</textarea>
    <div class="ntc">${NCOL.map(c=>`<button type="button" class="dot${c===col?' on':''}" data-nc="${c}" style="background:${c||ink}" aria-label="${c?'لون':'لون الكتابة العادي'}"></button>`).join('')}<label class="ncust${cust?' on':''}" title="لون تاني"><input type="color" data-nt="c" value="${col||'#14233a'}" aria-label="لون تاني"></label>
    <span class="sp"></span>
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
/* طرق الدفع (v314): كارت لكل طريقة: أيقونة · اسم · شغّالة · نسبة · رقم · ترتيب */
const PM_IC=['💳','📱','🏦','🧾','💵','🪙','🏧','🔁'],PM_Q=[['فودافون كاش','📱',1],['إنستا باي','🏦',0],['فوري','🧾',0],['فيزا','💳',2],['تحويل بنكي','🏦',0],['شيك','🧾',0]];
const pmEx=p=>p>0?'1000 ← '+f(1000-fee(1000,p)):'بدون خصم';
/* سطر لكل رقم: شغّال · اسم · رقم (أو خانات البنك) · نسبة · حذف، وتحته الليميت واللي دخل عليه */
const accRow=(a,x,i)=>{const u=accUse(a.id),full=accFull(a),bk=x.bank,inp=(k,ph,w)=>'<input data-ac="'+k+'" value="'+esc(String(a[k]==null?'':a[k]))+'" placeholder="'+ph+'" aria-label="'+ph+'"'+(w?' inputmode="'+w+'"':'')+'>';
  return'<div class="pma2'+(a.on===false?' off':'')+(full?' full':'')+'" data-aid="'+esc(a.id)+'"><div class="pmh"><label class="opt" title="الرقم ده شغّال"><input type="checkbox" data-ac="on"'+(a.on===false?'':' checked')+' aria-label="شغّال"></label>'+inp('lb','اسم (اختياري)')+(bk?inp('bn','اسم البنك'):inp('num',x.n&&/انستا|إنستا|insta/i.test(x.n)?'الرقم أو العنوان':'الرقم','tel'))+'<span class="pin">'+inp('p','%','decimal')+'</span><button type="button" class="del" data-accx="1" aria-label="حذف الرقم">✕</button></div>'
   +(bk?'<div class="pmh">'+inp('holder','اسم صاحب الحساب')+inp('acct','رقم الحساب','numeric')+'</div><div class="pmh">'+inp('iban','IBAN (EG…)')+inp('card','رقم الكارت','numeric')+'</div>':'')
   +'<div class="pml"><span>ليميت:</span><label>يومي '+inp('dl','0','numeric')+'</label><label>شهري '+inp('ml','0','numeric')+'</label><span class="mute pme">'+pmEx(+a.p||0)+'</span></div>'
   +((+a.dl>0||+a.ml>0||u.m>0)?'<div class="pmu'+(full?' full':'')+'">'+(full?'⛔ وصل الليميت، مش هيتبعت في الرسايل · ':'')+'النهارده '+f(u.d)+(+a.dl>0?' من '+f(+a.dl):'')+' · الشهر '+f(u.m)+(+a.ml>0?' من '+f(+a.ml):'')+'</div>':'')+'</div>'};
const pmCard=x=>{pmNorm(x);const lg=pmLogo(x.n),bk=pmIsBank(x);return`<div class="pmc2${x.on===false?' off':''}" data-bank="${bk?1:0}"><div class="pmh">${lg?spIcon(x.n):''}<select data-pm="ic" aria-label="أيقونة"${lg?' hidden':''}>${PM_IC.map(i=>'<option'+((x.ic||'💳')===i?' selected':'')+'>'+i+'</option>').join('')}</select><input data-pm="n" value="${esc(x.n)}" placeholder="اسم الطريقة" aria-label="اسم الطريقة"><label class="opt" title="الطريقة كلها شغّالة"><input type="checkbox" data-pm="on"${x.on===false?'':' checked'} aria-label="شغّالة"></label><button type="button" class="alt pma" data-pmu="1" aria-label="فوق">⬆</button><button type="button" class="alt pma" data-pmd="1" aria-label="تحت">⬇</button><button type="button" class="del" data-pmx="1" aria-label="حذف">🗑</button></div>
<div class="pmal">${x.accs.map((a,i)=>accRow(a,x,i)).join('')}</div><button type="button" class="lnk pmadd" data-accadd="1">➕ ${bk?'حساب تاني':'رقم تاني'}</button>
<div class="pmw"><span class="mute">تظهر في:</span>${PM_W.map(([k,l])=>'<label class="'+(pmW(x,k)?'on':'')+'"><input type="checkbox" data-pmw="'+k+'"'+(pmW(x,k)?' checked':'')+'>'+l+'</label>').join('')}</div></div>`};
function pmDraw(){$('pmList').innerHTML=pfAll().map(pmCard).join('')||'<p class="mute" style="margin-top:8px">مفيش طرق دفع.</p>';$('pmQ').innerHTML=PM_Q.filter(q=>!pfAll().some(x=>x.n===q[0])).map((q,i)=>'<button type="button" class="alt" data-pq="'+PM_Q.indexOf(q)+'">'+(pmLogo(q[0])?'<span class="mi"><img src="'+pmLogo(q[0])+'" alt="" draggable="false"></span>':'<span class="mi">'+q[1]+'</span>')+' '+q[0]+'</button>').join('');pmCust()}
function pmSave(){const l=[...document.querySelectorAll('#pmList .pmc2')].map(r=>{const g=k=>r.querySelector('[data-pm='+k+']'),n=g('n').value.replace(/[=\n]/g,' ').trim();if(!n)return null;const bk=pmIsBank({n});
  const accs=[...r.querySelectorAll('.pma2')].map(e=>{const v=k=>{const i=e.querySelector('[data-ac='+k+']');return i?i.value.trim():''},o={id:e.dataset.aid||accId(),lb:v('lb'),p:Math.min(100,Math.max(0,nv(v('p')))),on:e.querySelector('[data-ac=on]').checked,dl:nv(v('dl'))||0,ml:nv(v('ml'))||0};
    if(bk){o.bn=v('bn');o.holder=v('holder');o.acct=v('acct');o.iban=v('iban').toUpperCase();o.card=v('card')}else o.num=v('num');return o});
  const a0=accs[0]||{p:0,num:''};
  return{n,t:bk?'bank':undefined,p:+a0.p||0,num:a0.num||a0.acct||'',accs,w:Object.fromEntries(PM_W.map(([k])=>{const i=r.querySelector('[data-pmw='+k+']');return[k,i&&!i.checked?0:1]})),ic:g('ic').value==='💳'?'':g('ic').value,on:g('on').checked}}).filter(Boolean);
  svk('pfPre2',JSON.stringify(l));$('pfPre').innerHTML=preHtml();spRefresh();calc()}
$('pmList').addEventListener('input',e=>{const r=e.target.closest('.pmc2');if(r){r.classList.toggle('off',!r.querySelector('[data-pm=on]').checked);r.querySelectorAll('[data-pmw]').forEach(i=>i.parentNode.classList.toggle('on',i.checked));
  const ar=e.target.closest('.pma2');if(ar){ar.classList.toggle('off',!ar.querySelector('[data-ac=on]').checked);const pe=ar.querySelector('.pme');if(pe)pe.textContent=pmEx(nv(ar.querySelector('[data-ac=p]').value))}}pmSave()});
$('pmList').addEventListener('click',e=>{const r=e.target.closest('.pmc2');if(!r)return;
  if(e.target.closest('[data-pmu]')){if(r.previousElementSibling){r.parentNode.insertBefore(r,r.previousElementSibling);pmSave()}return}
  if(e.target.closest('[data-pmd]')){if(r.nextElementSibling){r.parentNode.insertBefore(r.nextElementSibling,r);pmSave()}return}
  if(e.target.closest('[data-accadd]')){const n=r.querySelector('[data-pm=n]').value,x=pmNorm({n,accs:[{id:accId(),lb:'',num:'',p:0,on:true}]});r.querySelector('.pmal').insertAdjacentHTML('beforeend',accRow(x.accs[0],x,r.querySelectorAll('.pma2').length));pmSave();const l=r.querySelectorAll('.pma2');const i=l[l.length-1].querySelector('[data-ac=num],[data-ac=bn]');if(i)i.focus();return}
  {const ax=e.target.closest('[data-accx]');if(ax){const ar=ax.closest('.pma2');if(r.querySelectorAll('.pma2').length<2){toast('لازم يفضل رقم واحد على الأقل. اقفل الطريقة كلها لو مش عايزها');return}if([...ar.querySelectorAll('input:not([type=checkbox])')].some(i=>i.value.trim()&&i.dataset.ac!=='p'&&i.dataset.ac!=='dl'&&i.dataset.ac!=='ml')&&!ok2(ax))return;ar.remove();pmSave();return}}
  const b=e.target.closest('[data-pmx]');if(!b)return;if(r.querySelector('[data-pm=n]').value.trim()&&!ok2(b))return;r.remove();pmSave();pmDraw()});
$('pmAdd').onclick=()=>{$('pmList').insertAdjacentHTML('beforeend',pmCard({n:'',p:0,num:'',ic:'',on:true}));const ins=$('pmList').querySelectorAll('[data-pm=n]');ins[ins.length-1].focus()};
$('pmQ').addEventListener('click',e=>{const b=e.target.closest('[data-pq]');if(!b)return;const q=PM_Q[+b.dataset.pq];const a=pfAll();a.push(pmNorm({n:q[0],p:q[2],num:'',ic:q[1]==='💳'?'':q[1],on:true,accs:[{id:accId(),lb:'',num:'',p:q[2],on:true}]}));svk('pfPre2',JSON.stringify(a));pmDraw();$('pfPre').innerHTML=preHtml();spRefresh();calc()});
function pmCust(){const l=S.customers.filter(c=>c.pfr&&Object.keys(c.pfr).length).sort((a,b)=>a.name.localeCompare(b.name,'ar'));const names=new Set(pfAll().map(x=>x.n)),orph=l.reduce((s,c)=>s+Object.keys(c.pfr).filter(n=>!names.has(n)).length,0);setTimeout(()=>{const e=$('pmOrph');if(e){e.classList.toggle('hide',!orph);e.textContent='🧹 امسح نسب الطرق اللي اتمسحت أو اتغير اسمها ('+orph+')'}},0);
  $('pmCust').innerHTML=l.map(c=>Object.entries(c.pfr).map(([n,p])=>`<div class="pmc"><span><b>${esc(c.name)}</b> <span class="mute">${esc(n)}${pfAll().some(x=>x.n===n)?'':' <b style="color:var(--danger)">(الطريقة دي مش موجودة)</b>'}</span></span><span style="display:flex;align-items:center;gap:6px"><b class="num">${fq(p)}%</b><button type="button" class="del" data-pcx="${c.id}" data-pcn="${esc(n)}" aria-label="مسح">×</button></span></div>`).join('')).join('')||'<p class="mute" style="margin-top:6px">لسه مفيش. أول ما تسجل دفعة لعميل بنسبة غير العامة هتظهر هنا.</p>'}
$('pmOrph').onclick=()=>{const names=new Set(pfAll().map(x=>x.n));let n=0;S.customers.forEach(c=>{if(!c.pfr)return;const m={...c.pfr};let ch=false;Object.keys(m).forEach(k=>{if(!names.has(k)){delete m[k];ch=true;n++}});if(ch){c.pfr=m;put('customers',c)}});pmCust();toast('✓ اتمسحت '+plN(n,'نسبة'))};
$('pmCust').addEventListener('click',e=>{const b=e.target.closest('[data-pcx]');if(!b)return;const c=getC(b.dataset.pcx);if(!c||!c.pfr)return;const m={...c.pfr};delete m[b.dataset.pcn];c.pfr=m;put('customers',c);pmCust();calc()});
/* رسايل الواتساب: زراير بتحط البيانات في الرسالة + معاينة زي الواتساب */
const VARS={tplInv:[['بيانات_الدفع','بيانات الدفع'],['العميل','اسم العميل'],['اللقب','اللقب'],['المحل','اسم المحل'],['الفاتورة','رقم الفاتورة'],['الكود','الكود'],['التاريخ','التاريخ'],['الإجمالي','الإجمالي'],['المدفوع','المدفوع'],['المتبقي','المتبقي'],['الخصم','الخصم'],['سبب_الخصم','سبب الخصم'],['طريقة_الدفع','طريقة الدفع'],['عمولة_الدفع','عمولة الدفع']],
  tplPay:[['بيانات_الدفع','بيانات الدفع'],['العميل','اسم العميل'],['اللقب','اللقب'],['المحل','اسم المحل'],['الكود','الكود'],['المبلغ','مبلغ الدفعة'],['الحساب','الحساب بعد الدفعة'],['التاريخ','التاريخ'],['طريقة_الدفع','طريقة الدفع'],['عمولة_الدفع','عمولة الدفع']],
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

$('tplReset').onclick=e=>{if(!ok2(e.target))return;try{['tpl_inv','tpl_pay','tpl_rem','tpl_rdy'].forEach(k=>localStorage.removeItem(k))}catch(e){}['inv','pay','rem','rdy'].forEach(k=>svk('ms_'+k,'f'));['inv','pay','rem','rdy'].forEach(k=>{[...'ndtxmpcse'].forEach(x=>{try{localStorage.removeItem('mo_'+k+'_'+x)}catch(_){}});['mg_','mc_'].forEach(p=>svk(p+k,''))});loadMsgUI();msgPrev()};
/* v312: تابات الرسائل + الأسلوب + اللي يظهر */
const MOP={inv:[['n','التحية واسم العميل'],['d','رقم الفاتورة والتاريخ'],['x','الخصم وسببه'],['t','الإجمالي والمدفوع والباقي'],['m','طريقة الدفع'],['p','طرق الدفع (إنستا باي / فودافون)'],['c','جملة الختام والشكر'],['s','اسم المحل'],['e','الإيموجي 😊']],
 pay:[['n','التحية واسم العميل'],['m','طريقة الدفع'],['t','الحساب بعد الدفعة'],['p','طرق الدفع (لو لسه عليه فلوس)'],['c','جملة الختام والشكر'],['s','اسم المحل'],['e','الإيموجي 😊']],
 rem:[['n','التحية واسم العميل'],['t','المبلغ المستحق'],['p','طرق الدفع (إنستا باي / فودافون)'],['c','جملة الختام والشكر'],['s','اسم المحل'],['e','الإيموجي 😊']],
 rdy:[['n','التحية واسم العميل'],['t','حسابه (لو عليه فلوس)'],['c','جملة الختام'],['s','اسم المحل'],['e','الإيموجي 😊']]};
function msUI(){document.querySelectorAll('.mpane').forEach(p=>{const k=p.dataset.mp,custom=!!lsv('tpl_'+k,'').trim();
  p.querySelectorAll('[data-ms]').forEach(b=>b.classList.toggle('on',!custom&&b.dataset.ms===msSt(k)));p.querySelector('.mcust').classList.toggle('hide',!custom);
  p.querySelector('.mopts').innerHTML=MOP[k].map(([fl,lb])=>'<label class="opt"><input type="checkbox" data-mo="'+fl+'"'+(mo(k,fl)?' checked':'')+'> '+lb+'</label>').join('');
  const g=p.querySelector('[data-mg]'),cl=p.querySelector('[data-mc]'),L=TPLG[k][msSt(k)];
  [[g,'mg_','n'],[cl,'mc_','c']].forEach(([i,pre,fl])=>{if(!i)return;const v=lsv(pre+k,'');if(i.value!==v)i.value=v;const d=L.find(x=>x[0]===fl);i.placeholder=d?d[1]:''})})}
let mTab='inv';
$('mTabs').onclick=e=>{const b=e.target.closest('[data-mt]');if(!b)return;mTab=b.dataset.mt;$('mTabs').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('.mpane').forEach(p=>p.classList.toggle('hide',p.dataset.mp!==mTab))};
const msBack=k=>{try{localStorage.removeItem('tpl_'+k)}catch(_){}};
document.querySelectorAll('.mst').forEach(d=>d.addEventListener('click',e=>{const b=e.target.closest('[data-ms]');if(!b)return;const k=d.dataset.for;msBack(k);svk('ms_'+k,b.dataset.ms);loadMsgUI();msgPrev()}));
document.querySelectorAll('.mopts').forEach(d=>d.addEventListener('change',e=>{const i=e.target.closest('[data-mo]');if(!i)return;const k=d.dataset.for;msBack(k);svk('mo_'+k+'_'+i.dataset.mo,i.checked?'1':'0');loadMsgUI();msgPrev()}));
document.querySelectorAll('[data-mg],[data-mc]').forEach(i=>i.addEventListener('input',()=>{const mg=i.dataset.mg,k=mg||i.dataset.mc;msBack(k);svk((mg?'mg_':'mc_')+k,i.value.trim());$('tpl'+{inv:'Inv',pay:'Pay',rem:'Rem',rdy:'Rdy'}[k]).value=tplOf(k);msgPrev()}));
/* لو الرسالة القديمة هي النص الافتراضي القديم بالظبط، نشيلها عشان النماذج الجديدة تشتغل */
try{if(!localStorage.getItem('msMig312')){['inv','pay','rem','rdy'].forEach(k=>{if(lsv('tpl_'+k,'').trim()===TPLD[k])localStorage.removeItem('tpl_'+k)});localStorage.setItem('msMig312','1')}}catch(e){}

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


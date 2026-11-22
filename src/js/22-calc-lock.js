/* ========== حاسبة الزجاج ========== */
function toggleCalc(){$('calcModal').classList.toggle('hide')}
$('calcFab').onclick=toggleCalc;
$('calcClose').onclick=toggleCalc;
$('calcModal').addEventListener('click',e=>{if(e.target===$('calcModal'))toggleCalc()});
function calcGlass(){
  const CZ=pget('ceilSz',true),cz=v=>CZ&&v>0?Math.ceil(v-1e-9):v,w=cz(nv($('calc_w').value)),h=cz(nv($('calc_h').value)),c=nv($('calc_c').value)||1,p=nv($('calc_p').value);
  const area=rd2(w*h/10000),tarea=rd2(w*h/10000*c),total=rd2(tarea*p);
  $('calc_area').textContent=fq(area)+' م²';
  $('calc_tarea').textContent=fq(tarea)+' م²';
  $('calc_total').textContent=f(total)}
['calc_w','calc_h','calc_c','calc_p'].forEach(i=>$(i).oninput=calcGlass);
$('calcAdd').onclick=()=>{const v={w:$('calc_w').value,h:$('calc_h').value,c:$('calc_c').value||'1',p:$('calc_p').value};$('calcMsg').textContent='';
  if(!nv(v.w)||!nv(v.h)){$('calcMsg').textContent='العرض والطول مطلوبين';return}
  toggleCalc();document.querySelector('#bnav button[data-t="new"]').click();const d=addRow('mq');setVals(d,v);calc();d.querySelector('.n').focus()};
$('calcReset').onclick=()=>{['calc_w','calc_h','calc_p'].forEach(i=>$(i).value='');$('calc_c').value='1';calcGlass()};

/* ========== قفل التطبيق (رقم سري + بصمة) ========== */
const lkGet=k=>{try{return localStorage.getItem(k)||''}catch(e){return''}},lkSet=(k,v)=>{try{v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
const sha=async t=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return hs(t)}};
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=t=>Uint8Array.from(atob(t.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
let bioOK=false,lkFails=0,lkWait=0,hiddenAt=0;
async function bioAvail(){try{return!!(window.PublicKeyCredential&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch(e){return false}}
function lkUI(){const on=lkGet('lkOn')==='1';$('lkRecSet').classList.toggle('hide',!on);$('lkRecMake').textContent=lkGet('lkRecHash')?'🔑 اعمل كود استرجاع جديد (القديم هيبطل)':'🔑 اعمل كود استرجاع (لو نسيت الرقم السري)';if(!on)$('lkRecShow').classList.add('hide');$('lkChk').checked=on||!$('lkSet').classList.contains('hide');$('lkBioBox').classList.toggle('hide',!(on&&bioOK));$('lkBio').checked=!!lkGet('lkBio')}
function lockNow(){document.documentElement.classList.add('locked');$('lkIn').value='';$('lkErr').textContent='';$('lkBioBtn').classList.toggle('hide',!(lkGet('lkBio')&&bioOK))}
function unlock(){document.documentElement.classList.remove('locked');lkFails=0}
const lkW=()=>Math.max(lkWait,+lkGet('lkW')||0);
async function tryPin(){if(Date.now()<lkW()){$('lkErr').textContent='استنى شوية وحاول تاني';return}
  if(await sha(lkGet('lkSalt')+$('lkIn').value)===lkGet('lkHash')){unlock();return}
  $('lkIn').value='';if(++lkFails>=5){lkWait=Date.now()+30000;lkSet('lkW',String(lkWait));lkFails=0;$('lkErr').textContent='محاولات كتير، استنى 30 ثانية'}else $('lkErr').textContent='الرقم غلط'}
async function tryBio(){try{await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:unb64(lkGet('lkBio')),transports:['internal']}],userVerification:'required',timeout:60000}});unlock()}catch(e){$('lkErr').textContent='اكتب الرقم السري'}}
$('lkGo').onclick=tryPin;$('lkBioBtn').onclick=tryBio;
/* نسيت الرقم السري: بحساب Google المربوط بالمزامنة، أو بكود استرجاع اتعمل وقت ضبط القفل */
function lkRecover(){['lkOn','lkHash','lkSalt','lkBio','lkRecHash'].forEach(k=>lkSet(k,null));unlock();$('lkRec').classList.add('hide');lkUI();
  setTimeout(()=>toast('اتفتح ✓ والرقم السري اتلغى. اعمل رقم جديد من الإعدادات','الإعدادات',()=>{$('hdrSet').click();stGo('lock')}),300)}
$('lkForgot').onclick=()=>{const g=!!fbCfg(),c=!!lkGet('lkRecHash');$('lkRec').classList.remove('hide');$('lkRecG').classList.toggle('hide',!g);$('lkRecP').classList.toggle('hide',!g);$('lkRecC').classList.toggle('hide',!c);
  $('lkRecMsg').textContent=!g&&!c?'مفيش طريقة استرجاع متفعّلة على الجهاز ده: لا حساب Google مربوط ولا كود استرجاع.':''};
$('lkRecGo').onclick=async()=>{if(Date.now()<lkW()){$('lkRecMsg').textContent='محاولات كتير، استنى شوية وحاول تاني';return}const v=toEn($('lkRecIn').value).replace(/\D/g,'');if(v&&await sha(lkGet('lkSalt')+'#'+v)===lkGet('lkRecHash'))lkRecover();else{$('lkRecIn').value='';if(++lkFails>=5){lkWait=Date.now()+60000;lkSet('lkW',String(lkWait));lkFails=0;$('lkRecMsg').textContent='محاولات كتير، استنى دقيقة'}else $('lkRecMsg').textContent='الكود غلط'}};
$('lkRecG').onclick=async()=>{const m=$('lkRecMsg');m.textContent='جاري الاتصال بجوجل…';let app=null;
  try{if(!window.firebase){const b='https://www.gstatic.com/firebasejs/13.2.0/';await loadScript(b+'firebase-app-compat.js');await loadScript(b+'firebase-auth-compat.js')}
    let prev=lsv('fbUid','');if(!prev){if(!firebase.apps.length)firebase.initializeApp(FBCFG);prev=await new Promise(r=>{const u=firebase.auth().onAuthStateChanged(x=>{u();r(x?x.uid:'')})})}
    if(!prev){m.textContent='مش لاقي الحساب المربوط على الجهاز ده';return}
    /* تطبيق منفصل للتأكد بس، عشان دخول المزامنة الأصلي ميتأثرش */
    app=firebase.initializeApp(FBCFG,'lkcheck'+Date.now());const r=await app.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    if(r&&r.user&&r.user.uid===prev)lkRecover();else m.textContent='ده مش الحساب المربوط بالبرنامج'}
  catch(e){const c=(e&&e.code)||'';m.textContent=/popup|operation-not-supported|web-storage/.test(c)?'جوجل مش راضي يفتح هنا. جرّب كود الاسترجاع، أو افتح البرنامج من المتصفح':/network/.test(c)?'مفيش نت':'الدخول منفعش'+(c?' ('+c.replace('auth/','')+')':'')}
  finally{if(app)try{await app.auth().signOut();await app.delete()}catch(_){}}};
$('lkRecPwGo').onclick=async()=>{const m=$('lkRecMsg'),pw=$('lkRecPw').value;if(!pw){m.textContent='اكتب كلمة سر حسابك';return}m.textContent='جاري التأكد…';let app=null;
  try{if(!window.firebase){const b='https://www.gstatic.com/firebasejs/13.2.0/';await loadScript(b+'firebase-app-compat.js');await loadScript(b+'firebase-auth-compat.js')}
    if(!firebase.apps.length)firebase.initializeApp(FBCFG);const cu=await new Promise(r=>{const u=firebase.auth().onAuthStateChanged(x=>{u();r(x)})});
    const prev=lsv('fbUid','')||(cu&&cu.uid)||'';if(!cu||!cu.email||!prev||!hasPw(cu)){m.textContent='الحساب المربوط هنا مش بإيميل وكلمة سر. جرّب Google أو كود الاسترجاع';return}
    app=firebase.initializeApp(FBCFG,'lkpw'+Date.now());const r=await app.auth().signInWithEmailAndPassword(cu.email,pw);
    if(r&&r.user&&r.user.uid===prev){$('lkRecPw').value='';lkRecover()}else m.textContent='ده مش الحساب المربوط بالبرنامج'}
  catch(e){const c=(e&&e.code)||'';m.textContent=/wrong-password|invalid-credential|invalid-login/.test(c)?'كلمة السر غلط':/too-many/.test(c)?'محاولات كتير. استنى شوية وجرّب تاني':/network/.test(c)?'مفيش نت':'معرفناش نتأكد'+(c?' ('+c.replace('auth/','')+')':'')}
  finally{if(app)try{await app.auth().signOut();await app.delete()}catch(_){}}};
async function lkRecMake(){const a=new Uint32Array(1);crypto.getRandomValues(a);const code=String(a[0]%100000000).padStart(8,'0');
  lkSet('lkRecHash',await sha(lkGet('lkSalt')+'#'+code));const f=code.slice(0,4)+' '+code.slice(4);
  $('lkRecShow').innerHTML=`<div class="reccode num">${f}</div><div class="mute" style="line-height:1.7">اكتب الكود ده في ورقة وشيله في مكان آمن. لو نسيت الرقم السري، اكتبه في شاشة القفل ← «نسيت الرقم السري؟». الكود بيظهر مرة واحدة بس.</div><button type="button" class="alt" id="lkRecCopy" style="width:100%;margin-top:6px">📋 نسخ الكود</button>`;
  $('lkRecShow').classList.remove('hide');$('lkRecCopy').onclick=async()=>{try{await navigator.clipboard.writeText(code);$('lkRecCopy').textContent='اتنسخ ✓'}catch(e){}};lkUI()}
$('lkRecMake').onclick=e=>{if(lkGet('lkRecHash')&&!ok2(e.target))return;lkRecMake()};

$('lkIn').addEventListener('keydown',e=>{if(e.key==='Enter')tryPin()});$('lkIn').addEventListener('input',async()=>{const v=$('lkIn').value;if(v.length>=6){tryPin();return}if(v.length>=4&&Date.now()>=lkWait&&await sha(lkGet('lkSalt')+v)===lkGet('lkHash'))unlock()});
$('lkChk').onchange=async()=>{const on=lkGet('lkOn')==='1',m=$('lkMsg');m.textContent='';
  if($('lkChk').checked){if(!on)$('lkSet').classList.remove('hide');return}
  if(!on){$('lkSet').classList.add('hide');return}
  $('lkChk').checked=true;$('lkOff').classList.remove('hide');$('lkOffIn').value='';$('lkOffIn').focus()};
$('lkOffGo').onclick=async()=>{const m=$('lkMsg');
  if(await sha(lkGet('lkSalt')+$('lkOffIn').value)===lkGet('lkHash')){['lkOn','lkHash','lkSalt','lkBio','lkRecHash'].forEach(k=>lkSet(k,null));$('lkOff').classList.add('hide');lkUI();m.textContent='اتلغى القفل ✓'}
  else{$('lkOffIn').value='';m.textContent='الرقم غلط'}};
$('lkSave').onclick=async()=>{const a=$('lkP1').value,b=$('lkP2').value,m=$('lkMsg');
  if(!/^\d{4,6}$/.test(a)){m.textContent='الرقم السري لازم يكون من 4 لـ 6 أرقام';return}
  if(a!==b){m.textContent='الرقمين مش متطابقين';return}
  const salt=uid();lkSet('lkSalt',salt);lkSet('lkHash',await sha(salt+a));lkSet('lkOn','1');lkSet('lkRecHash',null);
  $('lkP1').value=$('lkP2').value='';$('lkSet').classList.add('hide');m.textContent='تم تفعيل القفل ✓';lkUI();lkRecMake()};
$('lkBio').onchange=async()=>{const m=$('lkMsg');m.textContent='';
  if(!$('lkBio').checked){lkSet('lkBio',null);return}
  try{const cr=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'فواتير'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'owner',displayName:'صاحب المحل'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000}});
    lkSet('lkBio',b64(cr.rawId));m.textContent='تم تفعيل البصمة ✓'}
  catch(e){$('lkBio').checked=false;m.textContent='البصمة متفعّلتش على الجهاز ده'}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(lkGet('lkOn')==='1'&&hiddenAt&&Date.now()-hiddenAt>60000){lockNow();if(lkGet('lkBio')&&bioOK)tryBio()}});
async function lockInit(){bioOK=await bioAvail();
  if(lkGet('lkOn')==='1'&&!lkGet('lkHash')){lkSet('lkOn',null);unlock()}
  lkUI();if(lkGet('lkOn')==='1'){lockNow();if(lkGet('lkBio')&&bioOK)tryBio()}}

/* ---------- حماية التعديل/الحذف بالرقم السري ---------- */
let pinOkAt=0,pinWait=0,pinFail=0,pinRes=null;
const lkReady=()=>lkGet('lkOn')==='1'&&!!lkGet('lkHash');
function askPin(why){return new Promise(res=>{if(pinRes)pinRes(false);pinRes=res;$('pinWhy').textContent=why||'اكتب الرقم السري';$('pinIn').value='';$('pinErr').textContent='';$('pinOv').classList.remove('hide');setTimeout(()=>$('pinIn').focus(),50)})}
const pinDone=v=>{$('pinOv').classList.add('hide');const r=pinRes;pinRes=null;if(r)r(v)};
async function pinTry(){if(Date.now()<pinWait){$('pinErr').textContent='استنى شوية وحاول تاني';return}
  if(await sha(lkGet('lkSalt')+$('pinIn').value)===lkGet('lkHash')){pinOkAt=Date.now();pinFail=0;pinDone(true)}
  else{$('pinIn').value='';if(++pinFail>=5){pinWait=Date.now()+30000;pinFail=0;$('pinErr').textContent='محاولات كتير، استنى 30 ثانية'}else $('pinErr').textContent='الرقم غلط'}}
$('pinOk').onclick=pinTry;$('pinNo').onclick=()=>pinDone(false);$('pinIn').addEventListener('keydown',e=>{if(e.key==='Enter')pinTry()});$('pinOv').addEventListener('click',e=>{if(e.target===$('pinOv'))pinDone(false)});
async function guard(r,why){if(wkOn()){toast('مش مسموح في وضع العامل');return false}
  {const k=clLocked(r);if(k){if(lkReady()){if(Date.now()-pinOkAt<12e4||await askPin('اليوم ده متقفّل · '+why)){clMark(k);return true}return false}if(!confirm('🔒 يوم '+dayLabel(dayStart(r.ts))+' متقفّل. متأكد إنك عايز '+why+'؟ (هيتسجل إنه اتعدّل)'))return false;clMark(k);return true}}if(!pget('editLk',false)||!lkReady())return true;const d=+lsv('editLkD','1');if(d>0&&r&&r.ts>Date.now()-d*864e5)return true;if(Date.now()-pinOkAt<12e4)return true;return askPin(why)}
(()=>{const c=$('editLk'),b=$('editLkBox'),sel=$('editLkD'),m=$('editLkMsg');const sync=()=>{c.checked=pget('editLk',false);b.classList.toggle('hide',!c.checked);sel.value=lsv('editLkD','1')};
  c.onchange=()=>{m.textContent='';if(c.checked&&!lkReady()){c.checked=false;m.textContent='فعّل القفل برقم سري الأول (في الأعلى).';return}pset('editLk',c.checked);sync()};
  sel.onchange=()=>svk('editLkD',sel.value);sync()})();

/* ---------- المزامنة السحابية (Firebase) ---------- */
const FBCFG={apiKey:'AIzaSyAofNoMj8p2Ku2QK7FI9tL6uEh3Qobq6Mg',authDomain:'tabakha-glass-5b9a4.firebaseapp.com',projectId:'tabakha-glass-5b9a4',messagingSenderId:'184894291393',appId:'1:184894291393:web:3e552df9088a21471d0340'};
let FBDB=null,lastSync=0;
const loadScript=src=>new Promise((res,rej)=>{const e=document.createElement('script');e.src=src;e.onload=res;e.onerror=()=>rej(new Error('load'));document.head.appendChild(e)});
async function fbLoad(){if(!window.firebase){const b='https://www.gstatic.com/firebasejs/13.2.0/';await loadScript(b+'firebase-app-compat.js');await loadScript(b+'firebase-auth-compat.js');await loadScript(b+'firebase-firestore-compat.js')}
  if(!firebase.apps.length)firebase.initializeApp(FBCFG);const a=firebase.auth();a.languageCode='ar';return a}
async function fbStart(cfg,email,pass,google,create){
  const auth=await fbLoad();let user;
  if(google){try{user=(await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())).user}catch(e){if(e&&/popup-blocked|operation-not-supported|web-storage-unsupported/.test(e.code||'')){
      /* لازم نعلّم إن السحابة شغالة قبل التحويل، عشان لما الصفحة ترجع من جوجل fbBoot يكمّل الدخول */
      try{localStorage.setItem('fbOn','1');localStorage.removeItem('fbCfg')}catch(_){}await auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());return false}throw e}}
  else if(email&&pass){user=(await(create?auth.createUserWithEmailAndPassword(email,pass):auth.signInWithEmailAndPassword(email,pass))).user;if(create)try{await user.sendEmailVerification()}catch(e){}}
  else user=await new Promise(r=>{const u=auth.onAuthStateChanged(x=>{u();r(x)})});
  if(!user)throw new Error('no-user');if(!await acctGate(auth,user))return false;try{localStorage.setItem('fbUid',user.uid)}catch(e){}
  const base=firebase.firestore().collection('users').doc(user.uid);
  const FV=firebase.firestore.FieldValue,TS=firebase.firestore.Timestamp,clean=o=>{if(o)delete o.su;return o};
  const rdSn=sn=>({docs:sn.docs.map(x=>{const o=x.data(),t=o.su;delete o.su;return{data:()=>o,su:t&&t.toMillis?t.toMillis():0}})});
  /* عدّ مستندات مجموعة: بيتحسب قراءة واحدة لكل 1000 مستند، والمكتبة compat مفيهاش count فبيتعمل من REST */
  const count=async k=>{const r=await fetch('https://firestore.googleapis.com/v1/projects/'+FBCFG.projectId+'/databases/(default)/documents/users/'+user.uid+':runAggregationQuery',{method:'POST',headers:{Authorization:'Bearer '+await user.getIdToken(),'Content-Type':'application/json'},body:JSON.stringify({structuredAggregationQuery:{aggregations:[{alias:'n',count:{}}],structuredQuery:{from:[{collectionId:k}]}}})});if(!r.ok)throw new Error('count');return +(await r.json())[0].result.aggregateFields.n.integerValue};
  FBDB={base,count,collection:k=>({get:async since=>{let q=base.collection(k);if(since!=null)q=q.where('su','>',TS.fromMillis(since));return rdSn(await q.get())},
    /* Firestore بيرفض أي قيمة undefined: بننضف المستند قبل الرفع */
    doc:id=>({set:o=>base.collection(k).doc(id).set({...JSON.parse(JSON.stringify(o)),su:FV.serverTimestamp()}),delete:()=>base.collection(k).doc(id).delete(),get:async()=>{const d=await base.collection(k).doc(id).get();return{exists:d.exists,data:()=>clean(d.data())}}})})};
  return true}
const fbCfg=()=>{try{return(localStorage.getItem('fbOn')==='1'||localStorage.getItem('fbCfg'))?FBCFG:null}catch(e){return null}};
const fbStat=t=>{$('fbStat').textContent=t};
/* ---------- الجهاز بيشيل بيانات حساب واحد (fbUid = صاحبها): مفيش بيانات بتتنقل بين الحسابات من غير سؤال ---------- */
/* الأصناف والفئات مش في الفحص عشان الجهاز الجديد ممكن يبدأ بأصناف جاهزة */
const localHas=()=>['customers','invoices','quotes','expenses','suppliers','purchases','stock'].some(k=>S[k].length>0);
const ACCT_LS=['pup','pdel','trash','fullAt','syncCur','syncAt','cntAt','cntBad','closes','clStart','qtNo','ordNew','codeHW','lastBackup','cbAt','cbDay','bkSnooze','cloudNag','stkMin','dcSeen','wcSeen','mcSeen','welcDone','startOff','shopAskAt','setH','fbUid','fbCfg','fbOn','lkOn','lkHash','lkSalt','lkBio','lkRecHash'];
/* إعدادات المحل واللوجو وتصميم الفاتورة بتتحفظ مع الحساب (users/{uid}/settings/shop)، فكل حساب ليه محله */
/* نوع النشاط: gen = بيع بالعدد لأي محل. لو فاضي = بالمقاس (الحسابات القديمة بتفضل زي ما هي) */
const isGen=()=>lsv('biz','')==='gen',defT=()=>isGen()?'rd':'mq';
function applyBiz(){const g=isGen();document.documentElement.classList.toggle('biz-gen',g);curIT=g?'rd':'mq';document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.it===curIT));$('bizSel').value=g?'gen':'cut';
  $('subLbl').textContent=g?'إجمالي الأصناف':'إجمالي الإذن';const l=$('rows').lastElementChild;if(l&&rowBlank(l)&&l.dataset.t!==defT()){l.remove();calc()}if(curTab==='cl'&&g)document.querySelector('#bnav [data-t="new"]').click();try{drawItems()}catch(e){}}
function bizSet(v){svk('biz',v==='gen'?'gen':'cut');if(v==='gen'&&!lsv('docw',''))svk('docw','فاتورة');applyBiz();loadMsgUI()}
const SET_K=['bkWa','bkWaOn','dsOn','dsTg','wasteMax','closes','excats','drawer','tfHdr','tfDb','tfCu','tfSet','biz','shop','logo','logoOn','shopTxt','custw','docw','tpl_inv','tpl_pay','tpl_rem','tpl_rdy','invdesign','invtpls','invWm','invpal','fancyInv','qrOn','backFab','dupIgn','ms_inv','ms_pay','ms_rem','ms_rdy',...['inv','pay','rem','rdy'].flatMap(k=>[...'ndtxmpcse'].map(x=>'mo_'+k+'_'+x).concat(['mg_'+k,'mc_'+k])),'paper','gnote','invNotes','pfPre','pfPre2','remDays','remOld','remBal','remfirm','remlong','rempay','rt_soft','rt_firm','rt_long','rt_paid','rt_never','rt_old','rt_bal','rt_pay','exfix'],SET_S=new Set(SET_K);
const setGet=()=>{const o={};SET_K.forEach(k=>{const v=lsv(k,null);if(v!==null)o[k]=v});return o},setKey=o=>hs(JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]])));
function setApply(){try{tfPlaces()}catch(e){}try{applyBiz();loadLogo();if(!typing($('t-st'))){loadMsgUI();shopTxtLoad();$('paperSel').value=paperKey();$('logoOn').checked=pget('logoOn',true);$('fancyInv').checked=pget('fancyInv',true);if($('backFab'))$('backFab').checked=pget('backFab',false);$('qrOn').checked=pget('qrOn',true)}}catch(e){}}
let setBusy=null,setT=0,setAt=0;
/* البيانات اللي على السحابة بتكسب لو الجهاز ما اتغيرش من آخر مزامنة. لو الجهاز اتغير، هو اللي بيترفع */
function setSync(){if(!FBDB||instOff)return Promise.resolve();if(setBusy)return setBusy;clearTimeout(setT);
  /* من غير تغيير على الجهاز، بنقرا السحابة أول فتحة وكل 6 ساعات بس */
  if(setAt&&Date.now()-setAt<6*36e5&&setKey(setGet())===lsv('setH',''))return Promise.resolve();
  setBusy=(async()=>{try{const ref=FBDB.collection('settings').doc('shop'),d=await tmo(ref.get(),12000),rem=d.exists?d.data():null,loc=setGet(),lk=setKey(loc),last=lsv('setH','');
    if(rem&&rem.h&&rem.v&&rem.h!==last&&(lk===last||!last)){SET_K.forEach(k=>{try{if(k in rem.v)localStorage.setItem(k,rem.v[k]);else localStorage.removeItem(k)}catch(e){}});localStorage.setItem('setH',rem.h);setApply()}
    else if(lk!==last){await tmo(ref.set({h:lk,at:Date.now(),v:loc}),15000);localStorage.setItem('setH',lk)}setAt=Date.now()}
    catch(e){}finally{setBusy=null}})();return setBusy}
const setSoon=()=>{clearTimeout(setT);setT=setTimeout(setSync,2500)};
async function wipeLocal(){clearTimeout(setT);clearTimeout(pupT);pupT=0;BIG.forEach(k=>{S[k]=[];lset(k,[])});DV++;
  if(ddb){await flushIDB();await kvPut({alertNow:[]}).catch(()=>{})}
  try{[...BIG,...ACCT_LS,...SET_K,'invDraft'].forEach(k=>localStorage.removeItem(k));Object.keys(localStorage).filter(k=>k.indexOf('nfDay_')===0).forEach(k=>localStorage.removeItem(k))}catch(e){}
  try{await idbDo('readwrite',st=>st.clear())}catch(e){}
  pupS=null;instOff=true}
/* لو البيانات هتتشال ولسه مش متأكدين إنها على السحابة: ينزل ملف نسخة منها الأول */
async function keepCopy(){try{await dl(new Blob([JSON.stringify(bkFull())],{type:'application/json'}),'نسخة-قبل-تغيير-الحساب-'+dshort(Date.now()).replace(/\//g,'-')+'.json')}catch(e){}}
let acctP=null;
function acctAsk(prev,mail){if(acctP)return acctP;acctP=new Promise(res=>{const o=$('acctOv'),end=c=>{o.classList.add('hide');acctP=null;res(c)},who=mail||'الحساب ده';
  $('acctT').textContent=prev?'البيانات دي تخص حساب تاني':'فيه بيانات على الموبايل ده';
  $('acctM').textContent=prev?'البيانات اللي على الموبايل مش بتاعة '+who+'، فمش هتتضاف عليه. لو دخلت هتتشال من الموبايل، وهينزل ملف نسخة منها الأول.':'تحب تضيفها لحساب '+who+'؟ ولو دخلت من غيرها هتتشال من الموبايل، وهينزل ملف نسخة منها الأول.';
  $('acctAdd').classList.toggle('hide',!!prev);$('acctAdd').onclick=()=>end('add');$('acctSkip').onclick=()=>end('skip');$('acctNo').onclick=()=>end('no');o.classList.remove('hide')});return acctP}
async function acctGate(auth,user){const prev=lsv('fbUid','');if(prev===user.uid)return true;
  if(!localHas()){if(prev)try{[...SET_K,'setH'].forEach(k=>localStorage.removeItem(k))}catch(e){}return true}
  const c=await acctAsk(prev,user.email);if(c==='add')return true;
  if(c==='skip'){await keepCopy();await wipeLocal();try{localStorage.setItem('fbOn','1');localStorage.setItem('fbUid',user.uid)}catch(e){}location.reload();return false}
  try{await auth.signOut()}catch(e){}try{localStorage.removeItem('fbOn');localStorage.removeItem('fbCfg')}catch(e){}throw new Error('acct-cancel')}
async function acctLeave(){try{if(window.firebase&&firebase.auth)await firebase.auth().signOut()}catch(e){}await wipeLocal();location.reload()}
const fbErr=e=>{const c=(e&&e.code)||'',t=c?' ('+c.replace('auth/','')+')':'';if(e&&e.message==='acct-cancel')return'اتلغى تسجيل الدخول، وبياناتك زي ما هي على الجهاز.';if(/popup-closed|cancelled-popup/.test(c))return'اتلغى تسجيل الدخول.';if(/email-already-in-use/.test(c))return'الإيميل ده له حساب بالفعل. سجّل دخول، أو استخدم نسيت كلمة السر.';if(/weak-password|password-does-not-meet/.test(c))return'كلمة السر ضعيفة. اكتب 8 على الأقل، حروف وأرقام مع بعض.';if(/too-many-requests/.test(c))return'محاولات كتير. استنى شوية وجرّب تاني.';if(/user-mismatch/.test(c))return'الحساب اللي اخترته مش هو الحساب الداخل دلوقتي.';if(/requires-recent-login/.test(c))return'لازم تأكد دخولك تاني.';if(/unauthorized-domain/.test(c))return'تسجيل الدخول مش متاح من العنوان ده'+t;if(/operation-not-allowed/.test(c))return'طريقة الدخول دي مش متفعلة'+t;if(/invalid-credential|wrong-password|user-not-found|invalid-email/.test(c))return'الإيميل أو كلمة السر غلط.';if(/network/.test(c))return'مفيش إنترنت.';if(e&&e.message==='no-user')return'محتاج تسجيل دخول من جديد.';if(e&&e.message==='load')return'الاتصال بالسحابة منفعش: النت مش شغال.';logErr(e,'auth');return'الربط منفعش. جرّب تاني بعد شوية.'+t};
const typing=el=>{const a=document.activeElement;return!!(a&&el.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))};
function refreshAll(){DV++;try{exfRun()}catch(e){}syncNames();if(!typing($('t-cu')))drawCusts();if(!typing($('t-it')))drawItems();if(!typing($('t-dash')))drawDash();if(!typing($('t-new')))custInput();autoBan();drawTrash();try{qtBtn()}catch(e){}if(stCur==='exp'&&!typing($('t-st')))drawExp();if(stCur==='sup'&&!typing($('t-st')))drawSup();if(stCur==='stk'&&!typing($('t-st')))drawStk()}
let syncing=null,cloudOk=null;
function syncNow(){if(!dataReady||instOff)return Promise.resolve(false);if(syncing)return syncing;
  syncing=(async()=>{let ok=false;try{ok=await loadCloud();lastSync=Date.now();if(ok){reflowAll();refreshAll();autoBackupMaybe();await setSync()}return ok}finally{syncing=null;cloudOk=ok;cloudUI()}})();cloudUI();return syncing}
/* علامة السحابة فوق: ✓ محفوظ ومتزامن · ⏳ بيحفظ · ! مش متصل · ✗ مش مربوط بحساب (البيانات على الجهاز ده بس) */
function cloudUI(){const b=$('cloudSt');if(!b)return;let s,t;
  if(!fbCfg()){s='off';t='بياناتك على الموبايل ده بس. اربطها بحسابك عشان ترجع لو الموبايل ضاع أو اتغيّر'}
  else{/* ثابتة: بتفضل على آخر حالة معروفة ومش بترمش وهي بتتصل أو بتزامن في الخلفية. «!» بس لو الاتصال فشل فعلاً */
    const last=lsv('cloudLast',''),okNow=cloudOk===true||(cloudOk===null&&last==='ok'&&navigator.onLine!==false);
    if(okNow){s='ok';t='بياناتك محفوظة على حسابك ومتزامنة ✓'+(lastSync?' · آخر مزامنة '+hm(lastSync):'')}
    else if(syncing||cloudOk===null){s='busy';t='بيتصل بالسحابة…'}
    else{s='err';t='مش متصل بالسحابة دلوقتي. بياناتك محفوظة على الجهاز وهتتزامن لوحدها لما النت يرجع'}
    if(cloudOk!==null&&!syncing)try{localStorage.setItem('cloudLast',cloudOk?'ok':'err')}catch(e){}}
  b.className='hdr-cloud '+s;b.title=t;b.setAttribute('aria-label',t);b.dataset.s=s;acctUI()}
const fbUser=()=>{try{return window.firebase&&firebase.apps.length?firebase.auth().currentUser:null}catch(e){return null}};
function acctUI(){const on=!!fbCfg(),u=fbUser();$('fbAuth').classList.toggle('hide',on);$('fbOff').classList.toggle('hide',!on);$('fbDel').classList.toggle('hide',!on);$('fbWho').textContent=u&&u.email?'الحساب: '+u.email:'';$('fbVer').classList.toggle('hide',!(u&&hasPw(u)&&!u.emailVerified))}
/* الإيميل بيتأكد عشان نسيان كلمة السر يوصل لصاحبه. البرنامج شغال عادي لحد ما يتأكد */
$('fbVerB').onclick=async()=>{const u=fbUser(),m=$('fbVerM');if(!u)return;m.textContent='جاري…';try{await u.reload();if(u.emailVerified){m.textContent='';acctUI();toast('الإيميل اتأكد ✓');return}await u.sendEmailVerification();m.textContent='بعتنا رسالة تأكيد على إيميلك. افتح الرابط اللي فيها، ولو ما وصلتش بص في الرسايل المزعجة (Spam).'}catch(e){m.textContent=fbErr(e)}};
const goData=()=>{$('hdrSet').click();stGo('data');window.scrollTo(0,0)};
$('cloudSt').onclick=()=>{const s=$('cloudSt').dataset.s;toast($('cloudSt').title,s==='off'?'اربط حسابك':s==='err'?'جرّب تاني':'الإعدادات',s==='off'?()=>authOpen():s==='err'?()=>fbBoot():goData)};
addEventListener('offline',()=>{if(fbCfg()){cloudOk=false;cloudUI()}});
async function fbBoot(){const cfg=fbCfg();if(!cfg){await syncNow();return}
  fbStat('جاري الاتصال بالسحابة...');
  try{await fbStart(cfg);const ok=await syncNow();fbStat(ok?'متصل ✓ المزامنة والنسخ الاحتياطي تلقائيين.':'متصل بالحساب لكن قراءة البيانات فشلت (صلاحيات Firestore).');shopAsk()}
  catch(e){fbStat(e&&e.message==='acct-cancel'?fbErr(e):e&&e.message==='no-user'?'محتاج تسجيل دخول من جديد.':'مفيش اتصال حالياً: بياناتك على الجهاز وهتتزامن لما النت يرجع.');cloudOk=false;
    /* رجع من شاشة جوجل من غير ما يدخل وجهازه فاضي: يرجع لشاشة الدخول */
    if(e&&e.message==='no-user'&&!localHas()){try{localStorage.removeItem('fbOn')}catch(_){}welcMaybe()}cloudUI()}}
async function fbLogin(email,pass,google,create){fbStat('جاري الربط...');
  try{const r=await fbStart(FBCFG,email,pass,google,create);if(r===false)return;try{localStorage.setItem('fbOn','1');localStorage.removeItem('fbCfg')}catch(e){}
    const ok=await syncNow();fbStat(ok?'متصل ✓ المزامنة والنسخ الاحتياطي تلقائيين.':'تم تسجيل الدخول لكن قراءة البيانات فشلت (صلاحيات Firestore).')}
  catch(e){fbStat(fbErr(e));return e}}
$('fbAuth').onclick=()=>authOpen();
/* الخروج: بيرفع آخر التعديلات، وبعدين بيشيل بيانات الحساب من الجهاز ويرجع لشاشة الدخول */
$('fbOff').onclick=async e=>{const b=e.currentTarget;if(!fbCfg()){fbStat('مفيش حساب مربوط على الجهاز ده.');return}if(!ok2(b))return;
  b.disabled=true;fbStat('جاري رفع آخر التعديلات…');let safe=false;
  try{if(FBDB){await tmo(setSync(),15000);await tmo(flushDel(FBDB),20000);await tmo(pushPending(FBDB),20000);safe=+lsv('fullAt','0')>0&&!pupGet().size&&!lget('pdel').length}}catch(err){}
  b.disabled=false;if(safe){await acctLeave();return}
  const m='فيه تعديلات لسه ما اترفعتش على حسابك. وصّل النت وجرّب تاني، أو اخرج وهينزل ملف نسخة منها.';fbStat(m);toast(m,'اخرج برضه',async()=>{await keepCopy();await acctLeave()})};
/* شاشة الدخول: أول ما البرنامج يفتح على جهاز فاضي، وبعد الخروج من الحساب */
let auM='in';
function auMode(m){auM=m;const nw=m==='new',rs=m==='reset';$('auTab').classList.toggle('hide',rs);$('auTab').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  $('auShopB').classList.toggle('hide',!nw);$('auPassB').classList.toggle('hide',rs);$('auAlt').classList.toggle('hide',rs);$('auForgot').classList.toggle('hide',nw);$('auForgot').textContent=rs?'↩️ رجوع لتسجيل الدخول':'❓ نسيت كلمة السر؟';
  $('auGo').textContent=rs?'✉️ ابعت رابط تغيير كلمة السر':nw?'✨ إنشاء الحساب':'🔑 دخول';$('auSub').textContent=rs?'اكتب إيميلك وهيوصلك رابط تغيير كلمة السر.':nw?'حساب جديد لمحلك، وبياناتك هتتحفظ عليه.':'ادخل بحسابك وبياناتك هترجع لوحدها.';
  $('auPwHint').textContent=nw?'8 حروف وأرقام على الأقل':'';$('auPass').setAttribute('autocomplete',nw?'new-password':'current-password');$('welcMsg').textContent=''}
function authOpen(){auMode('in');$('auShop').value=shopN();$('welc').classList.remove('hide')}
function welcMaybe(){if(fbCfg()||lsv('welcDone','')==='1'||S.customers.length+S.invoices.length){shopAsk();return}authOpen()}
const welcEnd=()=>{svk('welcDone','1');$('welc').classList.add('hide')};
const auDone=(nw,sh)=>{const m=$('welcMsg');if(!FBDB){m.textContent=$('fbStat').textContent;return}$('auPass').value='';if(nw&&sh){svk('shop',sh);bizSet($('auBiz').value);loadMsgUI()}welcEnd();
  toast(nw?'اتعمل حسابك ✓ وبعتنا رسالة تأكيد على إيميلك':S.invoices.length+S.customers.length?'رجعت بياناتك ✓ '+S.customers.length+' عميل · '+S.invoices.length+' فاتورة':'اتربط حسابك ✓ وأي حاجة تعملها هتتحفظ عليه لوحدها');shopAsk()};
$('auTab').onclick=e=>{const b=e.target.closest('button[data-m]');if(b)auMode(b.dataset.m)};
$('auForgot').onclick=()=>auMode(auM==='reset'?'in':'reset');
$('auEye').onclick=()=>{const p=$('auPass'),s=p.type==='password';p.type=s?'text':'password';$('auEye').textContent=s?'إخفاء':'إظهار'};
/* كلمة السر: 8 على الأقل، حروف وأرقام، ومش سهلة التخمين */
const pwWeak=(p,em)=>{const u=String(em||'').split('@')[0].toLowerCase();return p.length<8?'كلمة السر لازم تكون 8 حروف أو أرقام على الأقل.':!/[A-Za-z\u0600-\u06FF]/.test(p)||!/[0-9\u0660-\u0669]/.test(p)?'خلّي كلمة السر فيها حروف وأرقام مع بعض.':/^(.)\1+$/.test(p)||/^(0?123456789?|12345678|password|qwerty|abcd1234|a1b2c3d4)/i.test(p)||(u.length>=4&&p.toLowerCase().includes(u))?'كلمة السر دي سهلة التخمين. اختار حاجة تانية.':''};
$('auPass').addEventListener('input',()=>{const x=$('auPwHint');if(auM!=='new'){x.textContent='';return}const p=$('auPass').value,w=p?pwWeak(p,$('auMail').value):'';x.textContent=!p?'8 حروف وأرقام على الأقل':w?'⚠️ '+w:'✅ كلمة سر قوية'});
/* بعد 5 محاولات غلط ورا بعض: استنى 30 ثانية، والمدة بتتضاعف لحد 15 دقيقة */
const auWaitLeft=()=>Math.max(0,Math.ceil(((+lsv('auWait','0'))-Date.now())/1000));
function auFail(){const n=(+lsv('auFn','0'))+1;svk('auFn',String(n));if(n>=5)svk('auWait',String(Date.now()+Math.min(900,30*2**(n-5))*1000))}
$('auForm').onsubmit=async e=>{e.preventDefault();const m=$('welcMsg'),b=$('auGo'),em=$('auMail').value.trim(),pw=$('auPass').value,sh=$('auShop').value.trim(),nw=auM==='new';
  if(!/^\S+@\S+\.\S+$/.test(em)){m.textContent='اكتب إيميل صحيح.';return}
  const wl=auWaitLeft();if(wl&&auM==='in'){m.textContent='محاولات غلط كتير. استنى '+(wl>90?Math.ceil(wl/60)+' دقيقة':wl+' ثانية')+' وجرّب تاني، أو استخدم «نسيت كلمة السر».';return}
  if(auM==='reset'){const rl=60-Math.floor((Date.now()-(+lsv('auRst','0')))/1000);if(rl>0){m.textContent='الرابط اتبعت من شوية. استنى '+rl+' ثانية قبل ما تطلبه تاني.';return}svk('auRst',String(Date.now()))}
  if(auM==='reset'){b.disabled=true;m.textContent='جاري الإرسال…';try{const a=await fbLoad();await a.sendPasswordResetEmail(em);m.textContent='لو الإيميل ده له حساب، هيوصلك رابط تغيير كلمة السر. لو ما وصلش، بص في الرسايل المزعجة (Spam).'}catch(err){m.textContent=fbErr(err)}b.disabled=false;return}
  if(nw&&!sh){m.textContent='اكتب اسم المحل.';return}if(!pw){m.textContent='اكتب كلمة السر.';return}if(nw){const pe=pwWeak(pw,em);if(pe){m.textContent=pe;return}}
  b.disabled=true;m.textContent=nw?'جاري إنشاء الحساب…':'جاري الدخول وتنزيل بياناتك…';const er=await fbLogin(em,pw,false,nw);b.disabled=false;if(er){if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(er.code||''))auFail()}else{svk('auFn','0');svk('auWait','0')}auDone(nw,sh)};
$('welcG').onclick=async()=>{const m=$('welcMsg');
  if(location.protocol==='file:'){m.textContent='الدخول بحساب Google بيشتغل من لينك البرنامج بس، مش من الملف اللي على الكمبيوتر.';return}
  m.textContent='جاري الدخول وتنزيل بياناتك…';await fbLogin(null,null,true);auDone(false,'')};
$('welcNew').onclick=()=>{welcEnd();toast('تقدر تربط حسابك في أي وقت من علامة ☁️ فوق');shopAsk()};
/* اسم المحل بيظهر على الفاتورة، فلو فاضي بنسأل عليه (مرة كل 3 أيام بالكتير) */
function shopAsk(){if(shopN()||!$('welc').classList.contains('hide')||Date.now()-(+lsv('shopAskAt','0'))<3*864e5)return;svk('shopAskAt',String(Date.now()));$('shopAskIn').value='';$('shopOv').classList.remove('hide')}
$('shopAskGo').onclick=()=>{const v=$('shopAskIn').value.trim();if(!v){$('shopAskIn').focus();return}svk('shop',v);bizSet($('shopAskBiz').value);$('shopOv').classList.add('hide');toast('تم حفظ اسم المحل ✓ واللوجو وباقي البيانات من الإعدادات','بيانات المحل',()=>{$('hdrSet').click();stGo('shop');window.scrollTo(0,0)})};
$('shopAskNo').onclick=()=>$('shopOv').classList.add('hide');
$('bizSel').onchange=()=>bizSet($('bizSel').value);
/* حذف الحساب: تأكيد الدخول، بعدين مسح كل بيانات users/{uid}، بعدين الحساب نفسه، وآخر حاجة الجهاز */
const hasPw=u=>(u.providerData||[]).some(p=>p&&p.providerId==='password');
async function acctPurge(){const fs=firebase.firestore();for(const k of[...BIG,'deleted','backups_meta','backups_data','settings']){const n=k==='backups_data'?20:300;
    for(;;){const sn=await FBDB.base.collection(k).limit(n).get();if(sn.empty)break;const b=fs.batch();sn.docs.forEach(d=>b.delete(d.ref));await b.commit();if(sn.docs.length<n)break}}}
const delChk=()=>{const u=fbUser();$('delGo').disabled=$('delCf').value.trim()!=='حذف'||(!!u&&hasPw(u)&&!$('delPw').value)};
(()=>{const p=$('dataPg');if(p&&!$('fbDel')){p.insertAdjacentHTML('beforeend','<div class="card dz"><b>⚠️ منطقة خطر</b><div class="mute" style="font-size:12px">حذف الحساب بيمسح كل بياناتك من السحابة نهائيًا، وبيطلب منك تأكيد.</div><button class="lnk hide" id="fbDel" style="color:var(--danger);margin-top:6px">🗑️ حذف الحساب</button></div>')}})();
$('fbDel').onclick=()=>{const u=fbUser();if(!u||!FBDB){fbStat('لازم تكون داخل بحسابك ومتصل بالنت عشان تحذفه.');return}$('delCf').value='';$('delPw').value='';$('delMsg').textContent='';$('delPwB').classList.toggle('hide',!hasPw(u));delChk();$('delOv').classList.remove('hide')};
$('delCf').oninput=delChk;$('delPw').oninput=delChk;$('delNo').onclick=()=>$('delOv').classList.add('hide');$('delBk').onclick=()=>keepCopy();
$('delGo').onclick=async()=>{const m=$('delMsg'),b=$('delGo'),u=fbUser();if(!u||!FBDB)return;b.disabled=true;$('delNo').disabled=true;
  try{m.textContent='جاري تأكيد حسابك…';if(hasPw(u))await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,$('delPw').value));else await u.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
    if(syncing)await syncing;instOff=true;db=null;clearTimeout(setT);m.textContent='جاري مسح بياناتك…';await tmo(acctPurge(),180000);await u.delete();FBDB=null;instOff=false;await wipeLocal();location.reload()}
  catch(e){instOff=false;if(FBDB)db=FBDB;b.disabled=false;$('delNo').disabled=false;m.textContent=e&&e.message==='timeout'?'النت بطيء ومسح البيانات ما خلصش. جرّب تاني.':fbErr(e)}};
/* تذكير كل 3 أيام لو فيه بيانات ومش مربوطة بحساب */
function cloudNag(){if(fbCfg()||!S.invoices.length)return;const l=+lsv('cloudNag','0');if(Date.now()-l<3*864e5)return;svk('cloudNag',String(Date.now()));
  toast('⚠ بياناتك على الموبايل ده بس. اربطها بحسابك عشان ما تضيعش','اربط حسابك',goData)}
addEventListener('online',()=>{if(fbCfg()&&dataReady&&!instOff)fbBoot()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(FBDB)setSync();return}if(FBDB&&Date.now()-lastSync>12e4)syncNow()});


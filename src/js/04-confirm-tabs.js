/* ---------- تأكيد بضغطتين + استرجاع المحذوف ---------- */
function ok2(b){if(b.dataset.arm){clearTimeout(b._t);disarm(b);return true}b.dataset.lbl=b.textContent;b.dataset.arm='1';b.textContent='تأكيد: '+b.dataset.lbl;b.classList.add('arm');b._t=setTimeout(()=>disarm(b),4000);return false}
function disarm(b){clearTimeout(b._t);if(b.dataset.arm){b.dataset.arm='';b.textContent=b.dataset.lbl}b.classList.remove('arm')}
function undel(k,o){lset('pdel',lget('pdel').filter(x=>!(x.k===k&&x.id===o.id)));if(!S[k].some(x=>x.id===o.id))S[k].push(o);put(k,o)}
let tm;const dirty=new Map();
function touch(k,o){dirty.set(k+o.id,[k,o]);clearTimeout(tm);tm=setTimeout(flushTouch,500)}
function flushTouch(){clearTimeout(tm);dirty.forEach(([k,o])=>put(k,o));dirty.clear()}
addEventListener('pagehide',()=>{flushTouch();flushIDB();if(pupT)pupSave()});document.addEventListener('visibilitychange',()=>{if(document.hidden){flushTouch();if(pupT)pupSave()}});

/* ---------- التبويبات (Bottom Nav) ---------- */
let kbH=0;
const fixBar=()=>{const h=$('bnav').offsetHeight||56,sb=$('saveBar'),r=document.documentElement.style;r.setProperty('--nh',h+'px');sb.style.bottom=(kbH||h)+'px';r.setProperty('--sh',(sb.classList.contains('hide')?0:sb.offsetHeight)+'px')};
if(window.ResizeObserver){const ro=new ResizeObserver(()=>fixBar());ro.observe($('bnav'));ro.observe($('saveBar'))}
function kbFix(){const vv=window.visualViewport;let k=0;
  if(vv&&Math.abs((vv.scale||1)-1)<.01){const a=document.activeElement,ed=a&&(/^(TEXTAREA|SELECT)$/.test(a.tagName)||(a.tagName==='INPUT'&&!/^(checkbox|radio|file|button)$/.test(a.type)));
    const d=Math.round(innerHeight-vv.height-vv.offsetTop);if(ed&&d>80)k=d}
  if(k===kbH)return;kbH=k;document.body.classList.toggle('kb',k>0);fixBar()}
if(window.visualViewport){visualViewport.addEventListener('resize',kbFix);visualViewport.addEventListener('scroll',kbFix)}
document.addEventListener('focusin',()=>setTimeout(kbFix,300));document.addEventListener('focusout',()=>setTimeout(kbFix,300));
window.addEventListener('resize',fixBar);
let curTab='new',tabHist=[],navNoHist=false;
const navClick=e=>{const b=e.target.closest('button[data-t]');if(!b)return;let t=b.dataset.t;if(t==='it'){skCur='it';skM='it';t='sk'}const hb=t==='sk'?document.querySelector('#bnav [data-t="sk"]'):t==='cu'?$('hdrCu'):t==='cl'?$('hdrCl'):b;if(!navNoHist&&t!==curTab)tabHist.push(curTab);if(t==='sk'&&curTab!=='sk'&&!navNoHist)skHist=[];curTab=t;try{sessionStorage.setItem('lastTab',t)}catch(e){}
  document.querySelectorAll('#bnav button,#hdrSet,#hdrCu,#hdrCl').forEach(x=>x.classList.toggle('on',x===hb));
  ['dash','new','cl','cu','it','st','sk'].forEach(k=>$('t-'+k).classList.toggle('hide',k!==t));
  $('saveBar').classList.toggle('hide',t!=='new');document.body.classList.toggle('onNew',t==='new');fixBar();
  if(t==='new'){drawRecent();drawQS()}if(t==='st')stGo('');if(t==='dash')drawDash();if(t==='cu')drawCusts();if(t==='sk')skShow();if(t==='new'&&lastC&&!editId){$('prev').value=balOf(lastC)||'';calc()}};
$('bnav').onclick=navClick;$('hdrSet').onclick=navClick;$('hdrCu').onclick=navClick;$('hdrCl').onclick=navClick;
/* v380: تاب المخزن فيه الأصناف والمخزن والموردين، كل واحد في تبويب */
let skCur='it',skM='it',skHist=[];
function skShow(){skCur='it';skMainUI();const P={it:$('t-it'),stk:$('stkPanel'),sup:document.querySelector('.stp[data-sp="sup"]')};Object.keys(P).forEach(k=>{if(P[k])P[k].classList.toggle('hide',k!==skCur)});
  document.querySelectorAll('#skSeg [data-skt]').forEach(x=>x.classList.toggle('on',x.dataset.skt===skCur));
  try{if(skCur==='it')drawItems();else if(skCur==='stk')stkOpen();else supOpen(null)}catch(e){}try{skTopDraw();skTopVis()}catch(e){}}
/* v391: المخزن والموردين تاب واحد: ملخص صغير فوق (قيمة المخزن · الناقص · عليك للموردين) وأزرار الشغل اليومي */
function skTopDraw(){const A=skInfo(),val=A.reduce((a,x)=>a+x.val,0),nL=A.filter(x=>x.st==='low'||x.st==='out').length,ow=supTot(),ov=supOv();
  $('skSum').innerHTML='<div class="skk"><button type="button" data-skt2="stk"><small>🧱 قيمة المخزن</small><b class="num">'+f(Math.round(val))+'</b></button><button type="button" data-sg="ord"'+(nL?' class="lw"':'')+'><small>📋 ناقص</small><b class="num">'+nL+'</b></button><button type="button" data-skt2="sup"'+(ov>0?' class="dn"':'')+'><small>🚚 عليك للموردين</small><b class="num">'+f(ow)+'</b></button></div>'}
function skTopVis(){$('skTop').classList.toggle('hide',skCur==='it');if(skCur==='it'){$('skSeg').classList.remove('hide');return}const sub=(skCur==='stk'&&typeof stkV!=='undefined'&&stkV!=='home')||(skCur==='sup'&&!!supCur);$('skTop').classList.toggle('hide',sub);$('skSeg').classList.toggle('hide',sub)}
$('skTop').onclick=e=>{const b=e.target.closest('[data-sg],[data-skt2]');if(!b)return;
  if(b.dataset.skt2){const k=b.dataset.skt2;if(k!==skCur){skHist.push(skCur);skCur=k;skShow()}window.scrollTo(0,0);return}
  if(skCur!=='stk'){skHist.push(skCur);skCur='stk';skShow()}stkV=b.dataset.sg;stkAct=null;drawStk();window.scrollTo(0,0)};
/* v392: تابات المخزن فوق: الأصناف (النظام الحالي) · المخزن · المشتريات · الجرد (هنبنيهم واحدة واحدة) */
function skMainUI(){document.querySelectorAll('#skMain [data-skm]').forEach(x=>x.classList.toggle('on',x.dataset.skm===skM));$('skOld').classList.toggle('hide',skM!=='it');$('skNew').classList.toggle('hide',skM==='it'||skM==='buy');$('pu').classList.toggle('hide',skM!=='buy');if(skM==='buy')try{puDraw()}catch(e){}}
$('skMain').onclick=e=>{const b=e.target.closest('[data-skm]');if(!b||b.dataset.skm===skM)return;skHist.push('m:'+skM);skM=b.dataset.skm;skMainUI();if(skM==='it')skShow();window.scrollTo(0,0)};
$('skSeg').onclick=e=>{const b=e.target.closest('[data-skt]');if(!b)return;if(b.dataset.skt!==skCur)skHist.push(skCur);skCur=b.dataset.skt;skShow();window.scrollTo(0,0)};
/* العملاء والأصناف بقوا جوه الإعدادات: زرار الإعدادات يفضل متعلّم وانت فيهم */
document.addEventListener('click',e=>{if(e.target.closest('[data-goset]')){$('hdrSet').click();window.scrollTo(0,0)}});
(function(){const nav=$('bnav'),ind=document.createElement('span');ind.className='nav-ind';nav.prepend(ind);let first=true;
function place(){const b=nav.querySelector('button.on');if(!b||!b.offsetWidth){nav.classList.remove('ready');return}
 if(first){ind.style.transition='none'}
 ind.style.width=(b.offsetWidth-6)+'px';ind.style.transform='translateX('+(b.offsetLeft+3)+'px)';nav.classList.add('ready');
 if(first){void ind.offsetWidth;ind.style.transition='';first=false}}
nav.addEventListener('click',()=>requestAnimationFrame(place));$('hdrSet').addEventListener('click',()=>requestAnimationFrame(place));
window.addEventListener('resize',place);window.addEventListener('load',place);if(window.ResizeObserver)new ResizeObserver(place).observe(nav);place()})();

setTimeout(()=>{try{syncNav()}catch(e){}},0);


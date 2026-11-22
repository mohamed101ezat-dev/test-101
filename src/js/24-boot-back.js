/* ---------- بداية ---------- */
lockInit();loadMsgUI();loadLogo();paperLabels();fixBar();document.body.classList.add('onNew');
(async()=>{try{await instInit();await dataInit()}catch(e){if(window.__bootFail)window.__bootFail('storage: '+(e&&e.message||e));return}
  if(!fbCfg()){reflowAll();syncNames()}drawDash();drawCusts();drawItems();calc();bkInfo();applyFeatures();drawTrash();drawRecent();qtBtn();try{draftBoot()}catch(e){logErr(e,'draftBoot')}
  try{$('skBody').append($('t-it'),$('stkPanel'),document.querySelector('.stp[data-sp="sup"]'))}catch(e){}window.__bootOK=true;applyBiz();bellUI();startUI();try{const lt=sessionStorage.getItem('lastTab');if(lt&&lt!==curTab){const bt=lt==='st'?$('hdrSet'):lt==='cu'?$('hdrCu'):lt==='cl'?$('hdrCl'):document.querySelector('#bnav button[data-t="'+lt+'"]');if(bt&&!bt.closest('.hide')&&!bt.classList.contains('hide'))bt.click()}}catch(e){}fbBoot();cloudUI();welcMaybe();setTimeout(nfDaily,1800);nfBoot();setTimeout(storCheck,2500);setTimeout(cloudNag,6000);if(migNote)setTimeout(()=>toast(migNote),700)})();
/* ---------- زرار الرجوع في الموبايل ---------- */
const OVS=['res','rem','remL','bulk','calcModal','clOv','pinOv','qtOv','dzOv'],OVX={dzOv:'dzX',res:'resx',rem:'remX',remL:'remLX',bulk:'bulkX',calcModal:'calcClose',clOv:'clX',pinOv:'pinNo',qtOv:'qtX'};
let NS=[],navIgnore=false,exitArm=false,exitT=0,navOK=false;
const wantNav=()=>{const w=tabHist.map((t,i)=>'t'+i+':'+t);if(curTab==='cu'&&selC&&getC(selC))w.push('cu');if(curTab==='dash'&&dbMode){w.push('db');if(dbSel&&getC(dbSel))w.push('dbs')}if(curTab==='st'&&stCur)w.push('sp');if(curTab==='dash'&&infoMode&&!dbMode)w.push('info');if(curTab==='sk'){skHist.forEach((s,i)=>w.push('k'+i+':'+s));if(skCur==='stk'&&stkV!=='home')w.push('sv');if(skCur==='sup'&&supCur)w.push('su')}OVS.forEach(id=>{const e=$(id);if(e&&!e.classList.contains('hide'))w.push('o:'+id)});return w};
function syncNav(){if(!navOK||navIgnore)return;const w=wantNav();let p=0;while(p<NS.length&&p<w.length&&NS[p]===w[p])p++;
  if(NS.length>p){const k=NS.length-p;NS=NS.slice(0,p);navIgnore=true;history.go(-k);return}
  for(let i=p;i<w.length;i++){NS.push(w[i]);history.pushState({d:NS.length},'')}}
function closeTop(l){
  if(l[0]==='t'){const t=tabHist.pop();navNoHist=true;try{(t==='st'?$('hdrSet'):document.querySelector('#bnav button[data-t="'+t+'"]')).click()}finally{navNoHist=false}}
  else if(l==='cu'){selC=null;drawCusts()}
  else if(l==='dbs'){dbSel=null;drawDebt()}
  else if(l==='db'){dbMode=false;dbSel=null;drawDebt()}
  else if(l==='sp'){stGo('')}
  else if(l==='info'){infoMode=false;iSc='';drawDebt()}
  else if(l[0]==='k'){const v=skHist.pop()||'it';if(v.slice(0,2)==='m:'){skM=v.slice(2);skMainUI()}else{skCur=v;skShow()}}
  else if(l==='sv'){stkV='home';stkAct=null;drawStk()}
  else if(l==='su'){supOpen(null)}
  else if(l[0]==='o'){const id=l.slice(2),x=$(OVX[id]);if(x)x.click();else if($(id))$(id).classList.add('hide');if($(id))$(id).classList.add('hide')}}
let _rz;window.addEventListener('resize',()=>{clearTimeout(_rz);_rz=setTimeout(()=>{if(curTab==='new'){drawRecent();drawQS()}},200)});
window.addEventListener('popstate',e=>{
  if(navIgnore){navIgnore=false;syncNav();return}
  const d=e.state&&e.state.d!==undefined?e.state.d:(e.state&&e.state.base?-1:0);
  if(d===-1){if(exitArm){exitArm=false;clearTimeout(exitT);navOK=false;history.back();return}
    exitArm=true;toast('اضغط رجوع تاني للخروج');exitT=setTimeout(()=>{exitArm=false},2000);history.pushState({d:0},'');NS=[];return}
  while(NS.length>d){const l=NS.pop();closeTop(l)}
  syncNav()});
try{history.replaceState({base:1},'');history.pushState({d:0},'');navOK=true}catch(e){}
new MutationObserver(()=>syncNav()).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
const _dc=drawCusts;drawCusts=function(){const r=_dc.apply(this,arguments);syncNav();return r};

/* v299: زرار رجوع تحت جنب الصباع في كل صفحات الإعدادات (والأصناف والمخزون والموردين) بدل ما تطلع لفوق */
(function(){const fb=document.createElement('button');fb.type='button';fb.id='stFab';fb.className='hide';fb.setAttribute('aria-label','رجوع');fb.textContent='→';document.body.appendChild(fb);
  const vis=e=>e&&e.offsetParent!==null&&!e.closest('.hide');
  const pick=()=>{for(const s of ['#stkSub [data-sg="home"]','#supOne #supBack','#t-st .stp [data-stback]','#t-it [data-goset]']){const l=[...document.querySelectorAll(s)].find(vis);if(l)return l}return null};
  let tg=null,away=false,ly=window.scrollY;window.addEventListener('scroll',()=>{const y=window.scrollY,a=y>ly+4?true:y<ly-4?false:away;ly=y;if(a!==away){away=a;fb.classList.toggle('away',away)}},{passive:true});
  const upd=()=>{tg=pget('backFab',false)?pick():null;fb.classList.toggle('hide',!tg);if(tg){const n=$('bnav'),r=n?n.getBoundingClientRect():null;fb.style.bottom=(r&&r.height?Math.max(0,innerHeight-r.top)+10:16)+'px'}};
  fb.onclick=()=>{const t=pick();if(t){t.click();window.scrollTo(0,0)}setTimeout(upd,60)};
  document.addEventListener('click',()=>setTimeout(upd,60));window.addEventListener('resize',upd);setInterval(upd,800);upd()})();

/* v306: زرار الرجوع العايم اختياري (مقفول من الأول) */
(function(){const b=$('backFab');if(!b)return;b.checked=pget('backFab',false);b.onchange=()=>{pset('backFab',b.checked)}})();

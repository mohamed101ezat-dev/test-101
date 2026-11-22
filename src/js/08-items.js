/* ---------- الأصناف ---------- */
const COLS={mq:[['w','العرض'],['h','الطول'],['p','السعر'],['cp','شراء']],rd:[['w','العرض'],['h','الطول'],['p','السعر'],['cp','شراء']]};
let curIT='mq';const itCols=()=>{const a=isGen()?COLS[curIT].filter(x=>x[0]==='p'||x[0]==='cp'):COLS[curIT];return wkOn()?a.filter(x=>x[0]!=='cp'):a};
function drawItems(){if(isGen())curIT='rd';fillCatSelects();$('catBar').classList.toggle('hide',curIT!=='mq');if(curIT!=='mq')$('catMgr').classList.add('hide');const cf=itCols(),g=cf.map(()=>'1fr').join(' ');const gF='2fr '+g+' 34px';
  $('nform').style.gridTemplateColumns=gF;
  $('nform').innerHTML='<input id="ni_name" placeholder="اسم الصنف">'+cf.map(x=>`<input data-nf="${x[0]}" type="text" inputmode="decimal" placeholder="${x[1]}">`).join('')+'<button class="main" id="addIt" aria-label="إضافة">➕</button>';
  $('ihead').innerHTML=`<div class="it" style="grid-template-columns:${itG(cf)}">${itSelOn?'<span></span>':''}<span>الاسم</span>${cf.map(x=>`<span style="text-align:center">${x[1]}</span>`).join('')}<span></span><span></span></div>`;
  drawItemList()}
/* v342: أصناف بالشكل القديم، وزيادة الأسعار لصنف أو لأصناف معلّمة أو للكل */
let itSelOn=false;const itSel=new Set();
const itG=cf=>(itSelOn?'28px ':'')+'2fr '+cf.map(()=>'1fr').join(' ')+' 30px 34px';
function drawItemList(){const cf=itCols(),g=itG(cf);
  $('items').innerHTML=itemsList().map(it=>`<div class="itw" data-id="${it.id}"><div class="it" style="grid-template-columns:${g}">${itSelOn?'<input type="checkbox" class="itck" data-ck="'+it.id+'"'+(itSel.has(it.id)?' checked':'')+' aria-label="تحديد">':''}<input data-k="${it.id}" data-f="name" value="${esc(it.name)}">${cf.map(x=>`<input data-k="${it.id}" data-f="${x[0]}" type="text" inputmode="decimal" value="${(x[0]==='p'?priceOf(it,itCat):it[x[0]])||''}">`).join('')}<button type="button" class="alt itpm" data-pm="${it.id}" aria-label="تغيير سعر الصنف ده بنسبة">±</button><button class="del" data-d="${it.id}" aria-label="حذف">×</button></div><div class="itpc hide" data-pc="${it.id}"><span class="mute">غيّر سعر الصنف ده</span><input inputmode="decimal" placeholder="10" aria-label="النسبة"><span>%</span><button type="button" class="alt" data-pcu="${it.id}">⬆ زوّد</button><button type="button" class="alt" data-pcd="${it.id}">⬇ قلّل</button></div></div>`).join('')||'<p class="mute">'+(S.items.length?'مفيش أصناف بالبحث ده.':'لسه مفيش أصناف. اكتب اسم الصنف وسعره فوق واضغط ➕، أو استوردهم من Excel في الإعدادات ← الحفظ والنسخ.')+'</p>';itSelN()}
const itSelN=()=>{const e=$('itSelN');if(e)e.textContent=itSelOn?'معلّم '+itSel.size+' صنف':''};
let stkFromIt=false;
$('seg').onclick=e=>{const t=e.target.dataset.it;if(!t)return;curIT=t;document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on',b===e.target));drawItems()};
$('nform').addEventListener('click',e=>{if(e.target.id!=='addIt')return;const name=$('ni_name').value.trim();if(!name){toast('اكتب اسم الصنف الأول');$('ni_name').focus();return}
  /* v189: نفس الاسم بنفس النوع ميتكررش */
  /* v353: نفس الاسم بمقاس مختلف مسموح؛ المكرر هو نفس الاسم + نفس المقاس */
  const szN=(w,h)=>{w=+w||0;h=+h||0;return Math.min(w,h)+'x'+Math.max(w,h)},wI=document.querySelector('#nform [data-nf="w"]'),hI=document.querySelector('#nform [data-nf="h"]'),nsz=szN(wI?nv(wI.value):0,hI?nv(hI.value):0);
  if(curIT==='mq'&&S.items.some(x=>x.type==='mq'&&nkey(x.name)===nkey(name))){if(!confirm('الصنف ده موجود قبل كده: '+name+'. تضيفه برضه؟'))return}
  else if(S.items.some(x=>x.type===curIT&&nkey(x.name)===nkey(name)&&szN(x.w,x.h)===nsz)){toast('الصنف ده موجود قبل كده بنفس المقاس: '+name+'. عدّل سعره من القايمة تحت أو غيّر المقاس');$('iq').value=name;drawItemList();return}
  const o={id:uid(),type:curIT,name,p:0,w:0,h:0};
  document.querySelectorAll('#nform [data-nf]').forEach(i=>{if(i.dataset.nf==='p')setPrice(o,itCat,nv(i.value));else o[i.dataset.nf]=nv(i.value)});S.items.push(o);put('items',o);drawItems()});
$('items').addEventListener('input',e=>{const t=e.target,k=t.dataset.k;if(!k)return;const it=S.items.find(x=>x.id===k);if(!it)return;if(t.dataset.f==='p')setPrice(it,itCat,nv(t.value));else it[t.dataset.f]=t.dataset.f==='name'?t.value:nv(t.value);touch('items',it)});
$('items').addEventListener('click',e=>{{const ck=e.target.closest('[data-ck]');if(ck){ck.checked?itSel.add(ck.dataset.ck):itSel.delete(ck.dataset.ck);itSelN();return}
  const pm=e.target.closest('[data-pm]');if(pm){const p=document.querySelector('#items [data-pc="'+pm.dataset.pm+'"]');if(p){const o=p.classList.contains('hide');document.querySelectorAll('#items .itpc').forEach(x=>x.classList.add('hide'));p.classList.toggle('hide',!o);if(o){const i=p.querySelector('input');if(i)i.focus()}}return}
  const pu=e.target.closest('[data-pcu],[data-pcd]');if(pu){const id=pu.dataset.pcu||pu.dataset.pcd,it=S.items.find(x=>x.id===id),inp=pu.parentNode.querySelector('input'),p=nv(inp.value);if(!it)return;if(!(p>0)||(p>=100&&pu.dataset.pcd)){toast('اكتب النسبة (مثلًا 10)');inp.focus();return}const o=priceOf(it,itCat)||0;if(!(o>0)){toast('الصنف ده مالوش سعر');return}const dir=pu.dataset.pcu?1:-1,n=Math.round(o*(1+dir*p/100));setPrice(it,itCat,n);put('items',it);drawItemList();toast('✓ «'+it.name+'»: '+f(o)+' ← '+f(n));return}}
const k=e.target.dataset.d;if(!k)return;const it=S.items.find(x=>x.id===k);del('items',k);drawItemList();
  if(it)toast('اتمسح الصنف: '+it.name,'تراجع',()=>{undel('items',it);drawItemList()})});

/* ---------- ترتيب الأصناف بالأكثر استخداماً ---------- */
let useV=-1,useMap={};
function usage(){if(useV===DV)return useMap;useMap={};const names=[];S.invoices.forEach(r=>(r.rows||[]).forEach(x=>{if(x.n)names.push(nm(x.n))}));
  S.items.forEach(it=>{const k=nm(it.name);let n=0;for(const x of names)if(x===k||x.startsWith(k+' '))n++;useMap[it.id]=n});useV=DV;return useMap}
function itemsList(){const q=$('iq').value.trim(),u=curIT==='mq'?usageCat(itCat):usage(),l=S.items.filter(it=>it.type===curIT&&qm(it.name,q));
  l.sort($('isort').value==='name'?(a,b)=>a.name.localeCompare(b.name,'ar'):(a,b)=>(u[b.id]||0)-(u[a.id]||0)||a.name.localeCompare(b.name,'ar'));return l}
$('iq').oninput=drawItemList;$('isort').onchange=drawItemList;
/* v342: زيادة/نقص الأسعار على المحدد (لو فيه تعليم) أو على كل الظاهر */
function itBulk(dir,ev){const p=nv($('itPct').value),m=$('itToolMsg'),pc=$('itUnit').value==='p';if(!(p>0)||pc&&p>=100&&dir<0){m.textContent=pc?'اكتب النسبة (مثلًا 10)':'اكتب المبلغ (مثلًا 10)';return}
  const sel=itSelOn&&itSel.size?itemsList().filter(x=>itSel.has(x.id)):null,l=sel||itemsList();if(!l.length){m.textContent='مفيش أصناف';return}
  const b=ev&&ev.currentTarget;if(b&&!ok2(b))return;let n=0;l.forEach(it=>{const o=priceOf(it,itCat)||0;if(!(o>0))return;setPrice(it,itCat,Math.max(0,Math.round(pc?o*(1+dir*p/100):o+dir*p)));put('items',it);n++});drawItemList();m.textContent='✓ اتغيّر سعر '+n+' صنف '+(dir>0?'بزيادة':'بنقص')+' '+p+(pc?'%':' ج')+(sel?' (المعلّمين)':' (كل الظاهرين)')}
$('itToolB').onclick=()=>{const t=$('itTool');t.classList.toggle('hide');$('itToolB').classList.toggle('on',!t.classList.contains('hide'));if(!t.classList.contains('hide'))$('itPct').focus()};
$('itUp').onclick=e=>itBulk(1,e);$('itDn').onclick=e=>itBulk(-1,e);
$('itSelB').onclick=()=>{itSelOn=!itSelOn;if(!itSelOn)itSel.clear();$('itSelB').classList.toggle('on',itSelOn);$('itSelB').textContent=itSelOn?'✖ إلغاء التحديد':'☑️ حدّد أصناف';drawItems()};
$('itSelAll').onclick=()=>{itSelOn=true;itemsList().forEach(x=>itSel.add(x.id));$('itSelB').textContent='✖ إلغاء التحديد';drawItems()};
$('itCpGo').onclick=e=>{const p=nv($('itCpPct').value),m=$('itToolMsg');if(!(p>0&&p<100)){m.textContent='اكتب نسبة بين 1 و99 (مثلًا 70)';return}const l=itemsList().filter(it=>!(+it.cp>0)&&(priceOf(it,itCat)||0)>0);if(!l.length){m.textContent='كل الأصناف الظاهرة ليها سعر شراء ✓';return}if(!ok2(e.currentTarget))return;l.forEach(it=>{it.cp=Math.round(priceOf(it,itCat)*p/100);put('items',it)});drawItemList();m.textContent='✓ اتكتب سعر شراء لـ'+l.length+' صنف (تقدر تعدّل أي واحد بإيدك)'};

/* ---------- بحث الأصناف ---------- */
const dd=$('dd');let ddInp=null,ddRow=null;
const szOf=it=>it.h&&it.w?it.w+'×'+it.h:'';
function placeDD(){if(dd.style.display==='none'||!ddInp)return;const r=ddInp.getBoundingClientRect(),vh=window.visualViewport?visualViewport.height:innerHeight,h=Math.min(dd.scrollHeight,220);
  let top=r.bottom+2;if(top+h>vh-4&&r.top-h-2>4)top=r.top-h-2;
  dd.style.top=top+'px';dd.style.right=Math.max(4,innerWidth-r.right)+'px';dd.style.width=Math.max(230,r.width)+'px'}
function showDD(inp,tr){const q=inp.value.trim(),t=tr.dataset.t;const l=S.items.filter(it=>qm(it.name,q)),cu=custUsage(lastC);{const u=usageCat(invCat);const pt=invCat==='rdy'?'rd':'mq';l.sort((a,b)=>(cu[b.id]||0)-(cu[a.id]||0)||((b.type===pt)-(a.type===pt))||(u[b.id]||0)-(u[a.id]||0))}
  if(!l.length){dd.style.display='none';return}ddInp=inp;ddRow=tr;
  dd.innerHTML=l.map(it=>`<div data-k="${it.id}"><span style="flex:1">${cu[it.id]?'<b class="ucm">★</b> ':''}${esc(it.name)}${cu[it.id]?` <small class="num ucn">×${cu[it.id]}</small>`:''}</span><small class="num">${szOf(it)?'('+esc(szOf(it))+')':''}</small><small>${it.type==='rd'?'جاهز':'مقطع'}</small><b class="num">${priceOf(it,invCat)||''}</b></div>`).join('');
  dd.style.display='block';placeDD()}
dd.addEventListener('mousedown',e=>{e.preventDefault();const cd=e.target.closest('div[data-c]');if(cd){const c=getC(cd.dataset.c);if(c&&ddInp){ddInp.value=c.name;ddInp.dispatchEvent(new Event('input',{bubbles:true}))}dd.style.display='none';return}const d=e.target.closest('div[data-k]');if(!d)return;const it=S.items.find(x=>x.id===d.dataset.k),rd=it.type==='rd';
  if(it.type!==ddRow.dataset.t){const nd=addRow(it.type,ddRow.dataset.rt,ddRow.dataset.src);ddRow.after(nd);ddRow.remove();ddRow=nd;ddInp=nd.querySelector('.n')}
  ddRow.dataset.iid=it.id;ddInp.value=rd&&it.h&&it.w?`${it.name} ${it.w}×${it.h}`:it.name;
  const s=(c,v)=>{const x=ddRow.querySelector(c);if(x)x.value=v||''};s('.p',priceOf(it,invCat));s('.w',it.w);s('.h',it.h);
  dd.style.display='none';calc();const e0=[...ddRow.querySelectorAll('input.w,input.h,input.c,input.p')].find(i=>!i.value);if(e0)e0.focus()});
function showCD(inp){if(inp.readOnly)return;const q=inp.value.trim(),l=S.customers.filter(c=>!c.arch&&qm(c.name,q)).sort((a,b)=>a.name.localeCompare(b.name,'ar')).slice(0,40);
  if(!l.length){dd.style.display='none';return}ddInp=inp;
  dd.innerHTML=l.map(c=>`<div data-c="${c.id}"><span style="flex:1">${esc(c.name)}</span><small class="num">${bal(c)}</small></div>`).join('');
  dd.style.display='block';placeDD()}
['cust','hq'].forEach(id=>{const i=$(id);['focus','click','input'].forEach(ev=>i.addEventListener(ev,()=>showCD(i)))});
document.addEventListener('click',e=>{if(!dd.contains(e.target)&&e.target!==ddInp)dd.style.display='none'});
addEventListener('scroll',e=>{if(dd.contains(e.target))return;placeDD()},true);if(window.visualViewport)visualViewport.addEventListener('resize',placeDD);
document.addEventListener('input',e=>{const t=e.target;if(!t||t.tagName!=='INPUT'||!/^(decimal|numeric|tel)$/.test(t.getAttribute('inputmode')||''))return;const v=t.value,n=toEn0(v);if(n===v)return;let c=null;try{c=t.selectionStart}catch(_){}t.value=n;try{if(c!=null)t.setSelectionRange(c,c)}catch(_){}},true);
document.addEventListener('focusin',e=>{if(e.target.tagName==='INPUT'&&e.target.getAttribute('inputmode')==='decimal'&&!e.target.readOnly)try{e.target.select()}catch(_){}});


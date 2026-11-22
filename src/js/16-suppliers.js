/* الموردين: S.suppliers {id,name,phone,cat,terms,note} · S.purchases {id,sid,ts,type:'buy'|'pay',amt,note,due?,how?,iid?,q?,sk?,pf?}. الرصيد = اللي عليك للمورد.
   الدفعات بتتوزّع على أقدم شراء الأول (FIFO) عشان نعرف أنهي فاتورة لسه مدفوعة جزء منها وأنهي متأخرة */
let supCur=null,spSort='owed',spFil='all',spTy='buy',spDay=0,spDue=null,spHow='كاش',spAll=false,spNewCat='',spEid=null,spLF='all';
const SPC=[['gl','🪟','زجاج'],['ac','🔩','إكسسوار'],['al','🧱','خامات'],['tr','🚚','نقل'],['mt','🛠','صيانة'],['ot','📦','أخرى']],SPDAY=864e5;
const spCat=k=>SPC.find(c=>c[0]===k),spIc=s=>(spCat(s.cat)||[0,'🚚'])[1];
const spAgo=t=>{const d=Math.floor((Date.now()-t)/SPDAY);return d<=0?'النهارده':d===1?'امبارح':d===2?'من يومين':d<=10?'من '+d+' أيام':'من '+d+' يوم'};
const spIn=d=>d<=0?'النهارده':d===1?'بكرة':d===2?'بعد يومين':d<=10?'بعد '+d+' أيام':'بعد '+d+' يوم';
const spTel=p=>toEn(phoneParts(p)[0]||'').replace(/[^\d+]/g,'');
function spAge(s){const l=S.purchases.filter(x=>x.sid===s.id).sort((a,b)=>a.ts-b.ts),now=Date.now();const pf=new Set(l.filter(x=>x.pf).map(x=>x.pf));let pool=0;l.forEach(x=>{if(x.type==='pay'&&!x.pf)pool+=+x.amt||0});
  const rem={};let bal=0,ov=0,nx=null,buy=0,pay=0,nb=0,last=0;
  l.forEach(x=>{const v=+x.amt||0;last=Math.max(last,x.ts);if(x.type==='pay'){bal-=v;pay+=v;return}bal+=v;buy+=v;nb++;if(pf.has(x.id)){rem[x.id]=0;return}const u=Math.min(pool,v);pool-=u;const r=rd2(v-u);rem[x.id]=r;
    if(r>0&&x.due){if(x.due<now)ov+=r;else if(!nx||x.due<nx.ts)nx={ts:x.due,amt:r}}});
  return{bal:rd2(bal),ov:rd2(ov),nx,rem,l,buy:rd2(buy),pay:rd2(pay),nb,last}}
function supBal(s){return rd2(S.purchases.filter(x=>x.sid===s.id).reduce((a,x)=>a+(x.type==='pay'?-1:1)*(+x.amt||0),0))}
function supTot(){return rd2(S.suppliers.reduce((a,s)=>a+supBal(s),0))}
function supOv(){return rd2(S.suppliers.reduce((a,s)=>a+spAge(s).ov,0))}
const spChips=(arr,on,att)=>arr.map(([v,t])=>`<button type="button" ${att}="${esc(String(v))}"${String(v)===String(on)?' class="on"':''}>${t}</button>`).join('');
function supOpen(id){supCur=id;$('supHome').classList.toggle('hide',!!id);$('supOne').classList.toggle('hide',!id);$('supMsg').textContent='';$('spMsg').textContent='';
  if(id){spTy='buy';spDay=0;spAll=false;const s=S.suppliers.find(x=>x.id===id);spDue=s&&s.terms>0?+s.terms:null;spHow='كاش';$('spAmt').value='';$('spNote').value='';$('spQty').value='';$('spIt').value='';$('spStk').open=false;$('supEdit').open=false;$('spXtra').open=false;spFl=[];spPend=[];spEid=null;spLF='all';$('spAttN').textContent='';spLoadF(id).then(()=>{if(supCur===id)drawSup()})}
  drawSup();window.scrollTo(0,0)}
function spMonth(a){const d=new Date(a),x=new Date(d.getFullYear(),d.getMonth(),1).getTime();return[x,new Date(d.getFullYear(),d.getMonth()+1,1).getTime()]}
function drawSup(){try{drawSup0()}finally{try{if(curTab==='sk'){skTopVis();if(!supCur)skTopDraw()}}catch(e){}}}
function drawSup0(){const s=S.suppliers.find(x=>x.id===supCur);
  if(!s){if(supCur){supOpen(null);return}spHome();return}
  spOne(s)}
let spMig=0;function spHome(){if(!spMig){spMig=1;spMigFiles().then(()=>{if(!supCur)drawSup()})}const now=Date.now(),[a,b]=spMonth(now),pm=puIn(a,b),q=$('supQ').value.trim();
  $('supTot').textContent=f(supTot());{const o=supOv();$('spkOv').textContent=f(o);$('spkOv').parentNode.classList.toggle('bad',o>0)}$('spkMo').textContent=f(pm.buy);$('spkPm').textContent=f(pm.pay);
  const info=S.suppliers.map(s=>({s,g:spAge(s)})),cats=SPC.filter(c=>S.suppliers.some(s=>s.cat===c[0]));
  $('supFil').innerHTML=spChips([['all','الكل'],['owe','عليّا فلوس'],['late','⏰ متأخر'],...cats.map(c=>[c[0],c[1]+' '+c[2]])],spFil,'data-sf');
  $('supSort').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.so===spSort));
  $('supNewCat').innerHTML=spChips([['','بدون نوع'],...SPC.map(c=>[c[0],c[1]+' '+c[2]])],spNewCat,'data-nc');
  let l=info.filter(o=>(!q||qm(o.s.name,q))&&(spFil==='all'||(spFil==='owe'?o.g.bal>0:spFil==='late'?o.g.ov>0:o.s.cat===spFil)));
  l.sort((x,y)=>spSort==='name'?x.s.name.localeCompare(y.s.name,'ar'):spSort==='recent'?(y.g.last-x.g.last)||x.s.name.localeCompare(y.s.name,'ar'):(y.g.bal-x.g.bal)||x.s.name.localeCompare(y.s.name,'ar'));
  {const nx=$('spkNext'),od=info.filter(o=>o.g.ov>0).sort((x,y)=>y.g.ov-x.g.ov)[0],up=info.filter(o=>o.g.nx).sort((x,y)=>x.g.nx.ts-y.g.nx.ts)[0];
    if(od){nx.className='spdue bad';nx.textContent='⏰ متأخر: '+od.s.name+' · '+f(od.g.ov);nx.dataset.sup=od.s.id}else if(up){nx.className='spdue';nx.textContent='⏰ أقرب ميعاد: '+up.s.name+' · '+f(up.g.nx.amt)+' '+spIn(Math.ceil((up.g.nx.ts-now)/SPDAY));nx.dataset.sup=up.s.id}else nx.className='spdue hide'}
  $('supRows').innerHTML=l.length?l.map(({s,g})=>{const w=waNum(s.phone),t=spTel(s.phone),dd=g.nx?Math.ceil((g.nx.ts-now)/SPDAY):0;
    const bd=g.ov>0?`<span class="tag dr">⏰ متأخر ${f(g.ov)}</span>`:g.nx&&dd<=7?`<span class="tag">⏰ ${spIn(dd)}</span>`:'';
    return`<div class="sprow" data-sup="${esc(s.id)}"><span class="spi">${spIc(s)}</span><div class="spm"><div class="spn">${esc(s.name)}</div><div class="spd2">${g.l.length?'آخر حركة '+spAgo(g.last)+' · '+(g.l.length===1?'حركة':g.l.length===2?'حركتين':g.l.length<=10?g.l.length+' حركات':g.l.length+' حركة'):'لسه مفيش حركات'}${S.files.some(q=>q.sid===s.id)?' · 📎 '+S.files.filter(q=>q.sid===s.id).length:''} ${bd}</div></div><div class="spv num ${g.bal>0?'dr':g.bal<0?'ok':'mu'}">${g.bal<0?'له '+f(-g.bal):f(g.bal)}</div><span class="spx">${t?`<a href="tel:${esc(t)}" aria-label="اتصل">📞</a>`:''}${w?`<a href="https://wa.me/${w}" target="_blank" rel="noopener" aria-label="واتساب"><i class="wai"></i></a>`:''}</span></div>`}).join(''):`<div class="card mute">${S.suppliers.length?'مفيش مورد بالشكل ده.':'لسه مفيش موردين. اكتب اسم مورد تحت.'}</div>`}
function spOne(s){const now=Date.now(),g=spAge(s);
  $('supNm').textContent=s.name;$('supCatB').textContent=s.cat&&spCat(s.cat)?spCat(s.cat)[1]+' '+spCat(s.cat)[2]:'';
  $('supB').textContent=f(Math.abs(g.bal));$('supB').className='num '+(g.bal>0?'dr':g.bal<0?'ok':'');$('supBL').textContent=g.bal<0?'ليك عنده':'عليك';
  const du=$('supDue');if(g.ov>0){du.className='spdue bad';du.textContent='⏰ متأخر '+f(g.ov)+(g.l.length?'':'')}else if(g.nx){const dd=Math.ceil((g.nx.ts-now)/SPDAY);du.className='spdue';du.textContent='⏰ أقرب ميعاد: '+f(g.nx.amt)+' '+spIn(dd)}else du.className='spdue hide';
  {const t=spTel(s.phone),w=waNum(s.phone),c=$('supCall'),a=$('supWa');c.classList.toggle('hide',!t);if(t)c.href='tel:'+t;a.classList.toggle('hide',!w);if(w)a.href='https://wa.me/'+w}
  const [m0,m1]=spMonth(now),mb=g.l.filter(x=>x.type==='buy'&&x.ts>=m0&&x.ts<m1).reduce((a,x)=>a+(+x.amt||0),0),lp=g.l.filter(x=>x.type==='pay').pop();
  const st=[['المشتريات',f(g.buy)],['المدفوع',f(g.pay)],['الشهر ده',f(mb)],['الفواتير',String(g.nb)],['المتوسط',g.nb?f(Math.round(g.buy/g.nb)):'-'],['آخر دفعة',lp?f(lp.amt):'-'],['من',g.l.length?dshort(g.l[0].ts).slice(2):'-'],['آخر حركة',g.l.length?spAgo(g.last).replace('من ',''):'-']];
  $('supStats').innerHTML=st.map(([k,v])=>`<div><small>${k}</small><span class="num">${v}</span></div>`).join('');
  /* أعمدة آخر 6 شهور */
  const bars=[];for(let i=5;i>=0;i--){const d=new Date(now);d.setDate(1);d.setMonth(d.getMonth()-i);const [a,b]=spMonth(d.getTime());bars.push({a,v:g.l.filter(x=>x.type==='buy'&&x.ts>=a&&x.ts<b).reduce((q,x)=>q+(+x.amt||0),0)})}
  const mx=Math.max(1,...bars.map(x=>x.v));$('supBars').classList.toggle('hide',!g.nb);
  $('supBars').innerHTML=bars.map(x=>`<div><i style="height:${Math.round(x.v/mx*100)}%"></i><small>${new Date(x.a).getMonth()+1}</small></div>`).join('');
  /* أكتر الأصناف اللي بتشتريها منه */
  const it=new Map();g.l.forEach(x=>{if(x.type==='buy'&&x.iid&&+x.q>0){const o=it.get(x.iid)||{q:0};o.q+=+x.q;o.p=(+x.amt||0)/x.q;it.set(x.iid,o)}});const top=[...it.entries()].map(([i,o])=>({n:(S.items.find(y=>y.id===i)||{}).name,q:o.q,p:o.p})).filter(x=>x.n).sort((a,b)=>b.q-a.q).slice(0,4);
  $('supTop').classList.toggle('hide',!top.length);$('supTop').innerHTML=top.length?'<small>بتشتري منه:</small> '+top.map(x=>`<span class="tag">${esc(x.n)} · ${f(x.q)} · ≈${f(Math.round(x.p))}/وحدة</span>`).join(' '):'';
  spEntry(s,g);spLedger(s,g);spEditFill(s);spFilesDraw();spSchedDraw(g);if($('supSched').children.length)$('supDue').classList.add('hide')}
/* خانة التسجيل: أزرار جاهزة بدل الكتابة */
function spEntry(s,g){const buy=spTy==='buy';$('spEd').classList.toggle('hide',!spEid);$('spTy').classList.toggle('hide',!!spEid);$('spTy').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.ty===spTy));
  const q=[];if(!buy&&g.bal>0){q.push(['all','كله '+f(g.bal)]);if(g.bal>=2)q.push(['half','النص '+f(Math.ceil(g.bal/2))]);if(g.ov>0&&g.ov<g.bal)q.push(['ov','المتأخر '+f(g.ov)])}
  const seen=new Set();g.l.slice().reverse().forEach(x=>{if(x.type===spTy&&!seen.has(x.amt)&&seen.size<3){seen.add(x.amt);q.push(['v'+x.amt,f(x.amt)])}});
  [100,500,1000].forEach(n=>q.push(['+'+n,'+'+f(n)]));
  $('spQuick').innerHTML=q.map(([v,t])=>`<button type="button" data-q="${esc(v)}">${t}</button>`).join('');
  $('spDays').innerHTML=spChips([[0,'النهارده'],[1,'امبارح'],[2,'من يومين'],['x','📅 تاريخ تاني']],spDay,'data-dy');$('spDate').classList.toggle('hide',spDay!=='x');
  $('spDueRow').classList.toggle('hide',!buy);$('spHowRow').classList.toggle('hide',buy);
  $('spDueRow').innerHTML='<small class="mute">السداد:</small>'+spChips([['','من غير ميعاد'],...(spEid?(spDue==='keep'?[['keep','📅 زي ما هو']]:[]):[['paid','✅ اتدفع كله']]),[7,'أسبوع'],[15,'15 يوم'],[30,'شهر'],[45,'45 يوم'],[60,'شهرين']],spDue===null?'':spDue,'data-du');
  $('spHowRow').innerHTML='<small class="mute">دفعت:</small>'+spChips(['كاش','فودافون كاش','انستا','تحويل بنكي','شيك'].map(x=>[x,x]),spHow,'data-hw');
  const notes=[];g.l.slice().reverse().forEach(x=>{if(x.note&&x.type===spTy&&!notes.includes(x.note)&&notes.length<5)notes.push(x.note)});
  $('spNotes').innerHTML=notes.map(n=>`<button type="button" data-nt="${esc(n)}">${esc(n)}</button>`).join('');
  $('spStk').classList.toggle('hide',!buy||!!spEid);
  const cur=$('spIt').value;$('spIt').innerHTML='<option value="">اختار الصنف</option>'+S.items.slice().sort((a,b)=>a.name.localeCompare(b.name,'ar')).map(i=>`<option value="${esc(i.id)}">${esc(i.name)}${szOf(i)?' '+esc(szOf(i)):''}</option>`).join('');$('spIt').value=cur;
  $('spAdd').textContent=spEid?'💾 حفظ':'✅ سجّل';if(spEid)$('spXtra').open=true}
function spLedger(s,g){let run=0;const all=g.l.map(x=>{const v=+x.amt||0,pay=x.type==='pay';run=rd2(run+(pay?-v:v));return{x,v,pay,run}}).reverse(),rows=all.filter(o=>spLF==='buy'?!o.pay:spLF==='pay'?o.pay:spLF==='pic'?spFl.some(q=>q.pid===o.x.id):true),lim=spAll?rows.length:15;
  $('spLF').classList.toggle('hide',all.length<4);$('spLF').innerHTML=spChips([['all','الكل'],['buy','🛒 شراء'],['pay','💵 دفع'],['pic','📎 بصور']],spLF,'data-lf');
  $('spList').innerHTML=rows.length?'<tr><th>اليوم</th><th>البيان</th><th>المبلغ</th><th>الرصيد</th><th></th></tr>'+rows.slice(0,lim).map(({x,v,pay,run})=>{
    let sub='';if(pay&&x.how)sub=x.how;else if(!pay){const r=g.rem[x.id];if(r===0)sub='✅ مدفوعة';else if(x.due)sub=(x.due<Date.now()?'⏰ متأخرة ':'⏰ ')+dshort(x.due).slice(5)+(r<v?' · باقي '+f(r):'');else if(r<v)sub='باقي '+f(r)}
    const fc=spFl.filter(q=>q.pid===x.id).length;
    return`<tr><td class="num">${dshort(x.ts).slice(5)}${fc?`<small data-spf="${esc(x.id)}" style="cursor:pointer">📎${fc>1?fc:''}</small>`:''}</td><td class="tn">${esc(x.note||(pay?'دفعة':'شراء'))}${sub?`<small class="mute">${esc(sub)}</small>`:''}</td><td class="num ${pay?'spp':'spq'}">${pay?'−':'+'}${f(v)}</td><td class="num"><b>${f(run)}</b></td><td class="nw"><button type="button" class="xd" data-spe="${esc(x.id)}" aria-label="تعديل">✏️</button><button type="button" class="xd" data-spd="${esc(x.id)}" aria-label="حذف">×</button></td></tr>`}).join(''):'<tr><td class="tn mute">'+(all.length?'مفيش حركات بالشكل ده.':'لسه مفيش حركات للمورد ده. سجّل أول شراء من فوق.')+'</td></tr>';
  $('spMore').classList.toggle('hide',rows.length<=15||spAll)}
function spEditFill(s){const ae=document.activeElement;if(!($('supEdit').contains(ae)&&/INPUT/.test(ae.tagName))){$('supEN').value=s.name;$('supPh').value=s.phone||'';$('supENote').value=s.note||''}
  $('supEC').innerHTML=spChips([['','بدون'],...SPC.map(c=>[c[0],c[1]+' '+c[2]])],s.cat||'','data-ec');
  $('supET').innerHTML=spChips([[0,'من غير'],[7,'أسبوع'],[15,'15 يوم'],[30,'شهر'],[45,'45 يوم'],[60,'شهرين']],+s.terms||0,'data-et')}
const spSave=(s,k,v)=>{if(v===''||v==null||v===0)delete s[k];else s[k]=v;put('suppliers',s)};
/* الصفحة الرئيسية */
$('supAdd').onclick=()=>{const n=$('supName').value.trim().replace(/\s+/g,' '),m=$('supMsg');if(!n){m.textContent='اكتب اسم المورد';return}if(S.suppliers.some(x=>nkey(x.name)===nkey(n))){m.textContent='المورد ده موجود';return}
  const o={id:uid(),name:n};if(spNewCat)o.cat=spNewCat;S.suppliers.push(o);put('suppliers',o);$('supName').value='';m.textContent='✅ اتضاف، دوس عليه وكمّل بياناته';drawSup()};
$('supName').onkeydown=e=>{if(e.key==='Enter')$('supAdd').click()};
$('supQ').oninput=drawSup;
$('supFil').onclick=e=>{const b=e.target.closest('[data-sf]');if(b){spFil=b.dataset.sf;drawSup()}};
$('supSort').onclick=e=>{const b=e.target.closest('[data-so]');if(b){spSort=b.dataset.so;drawSup()}};
$('supNewCat').onclick=e=>{const b=e.target.closest('[data-nc]');if(b){spNewCat=b.dataset.nc;drawSup()}};
$('supRows').onclick=e=>{if(e.target.closest('a'))return;const r=e.target.closest('[data-sup]');if(r)supOpen(r.dataset.sup)};
$('supBack').onclick=()=>supOpen(null);
/* التسجيل */
$('spTy').onclick=e=>{const b=e.target.closest('[data-ty]');if(!b)return;spTy=b.dataset.ty;drawSup()};
$('spQuick').onclick=e=>{const b=e.target.closest('[data-q]');if(!b)return;const s=S.suppliers.find(x=>x.id===supCur),g=spAge(s),k=b.dataset.q,cur=nv($('spAmt').value);
  $('spAmt').value=k==='all'?g.bal:k==='half'?Math.ceil(g.bal/2):k==='ov'?g.ov:k[0]==='+'?rd2(cur+(+k.slice(1))):k.slice(1);fmtAll&&fmtAll();$('spAmt').focus()};
$('spDays').onclick=e=>{const b=e.target.closest('[data-dy]');if(!b)return;spDay=b.dataset.dy==='x'?'x':+b.dataset.dy;if(spDay==='x'&&!$('spDate').value)$('spDate').value=dayKey(Date.now());drawSup()};
$('spDueRow').onclick=e=>{const b=e.target.closest('[data-du]');if(!b)return;const v=b.dataset.du;spDue=v===''?null:v==='paid'?'paid':v==='keep'?'keep':+v;drawSup()};
$('spHowRow').onclick=e=>{const b=e.target.closest('[data-hw]');if(b){spHow=b.dataset.hw;drawSup()}};
$('spNotes').onclick=e=>{const b=e.target.closest('[data-nt]');if(b){$('spNote').value=b.dataset.nt}};
function spStartEdit(id){const x=S.purchases.find(y=>y.id===id);if(!x)return;spEid=id;spTy=x.type;spDay='x';$('spDate').value=dayKey(x.ts);$('spAmt').value=x.amt;$('spNote').value=x.note||'';spHow=x.how||'كاش';
  if(x.type==='buy'){const d=x.due?Math.round((x.due-x.ts)/SPDAY):0;spDue=[7,15,30,45,60].includes(d)?d:(x.due?'keep':null)}$('spMsg').textContent='';drawSup();$('spNew').scrollIntoView({block:'start'})}
function spEditEnd(){spEid=null;spDay=0;const s=spCur();spDue=s&&s.terms>0?+s.terms:null;$('spAmt').value='';$('spNote').value='';drawSup()}
$('spEdX').onclick=spEditEnd;
$('spAdd').onclick=()=>{const s=S.suppliers.find(x=>x.id===supCur);if(!s)return;const amt=rd2(nv($('spAmt').value)),m=$('spMsg');if(!(amt>0)){m.textContent='اكتب المبلغ أو دوس على زرار جاهز';return}
  let ts=Date.now();if(spDay!==0){const dv=spDay==='x'?$('spDate').value:dayKey(Date.now()-spDay*SPDAY),dm=/^(\d{4})-(\d{2})-(\d{2})$/.exec(dv);if(!dm){m.textContent='اختار التاريخ';return}ts=dv===dayKey(Date.now())?Date.now():new Date(+dm[1],+dm[2]-1,+dm[3],12).getTime()}
  if(spEid){const x=S.purchases.find(y=>y.id===spEid);if(!x){spEditEnd();return}const t2=dayKey(x.ts)===dayKey(ts)?x.ts:ts;x.ts=t2;x.amt=amt;x.note=$('spNote').value.trim();
    if(x.type==='buy'){if(spDue!=='keep'){if(spDue>0)x.due=t2+spDue*SPDAY;else delete x.due}S.purchases.filter(y=>y.pf===x.id).forEach(y=>{y.amt=amt;y.ts=t2;put('purchases',y)})}else x.how=spHow;put('purchases',x);
    if(spPend.length){const pend=spPend;spPend=[];$('spAttN').textContent='';for(const d of pend){const fo={id:uid(),sid:s.id,pid:x.id,kind:x.type==='buy'?'فاتورة':'إيصال دفع',ts:t2,d};S.files.push(fo);put('files',fo)}spLoadF(s.id)}
    spEditEnd();$('spMsg').textContent='✅ اتعدّلت الحركة · '+(supBal(s)<0?'ليك عنده ':'عليك ')+f(Math.abs(supBal(s)));return}
  const buy=spTy==='buy',o={id:uid(),sid:s.id,ts,type:spTy,amt,note:$('spNote').value.trim()},add=[o];
  if(buy){const iid=$('spIt').value,q=rd2(nv($('spQty').value));
    if(iid&&q>0){const it=S.items.find(i=>i.id===iid)||{},st={id:uid(),iid,ts,q};S.stock.push(st);put('stock',st);o.iid=iid;o.q=q;o.sk=st.id;if(!o.note)o.note=(it.name||'صنف')+' × '+f(q)}
    if(spDue==='paid')add.push({id:uid(),sid:s.id,ts,type:'pay',amt,how:'كاش',note:'سداد '+(o.note||'شراء'),pf:o.id});else if(spDue>0)o.due=ts+spDue*SPDAY}
  else o.how=spHow;
  add.forEach(x=>{S.purchases.push(x);put('purchases',x)});
  if(spPend.length){const pend=spPend;spPend=[];$('spAttN').textContent='';(async()=>{try{for(const d of pend){const fo={id:uid(),sid:s.id,pid:o.id,kind:buy?'فاتورة':'إيصال دفع',ts,d};S.files.push(fo);put('files',fo)}await spLoadF(s.id);if(supCur===s.id)drawSup()}catch(e){$('spMsg').textContent='⚠️ الحركة اتسجلت بس الصورة معرفتش أحفظها'}})()}
  $('spAmt').value='';$('spNote').value='';$('spQty').value='';$('spIt').value='';spDay=0;drawSup();m.textContent=(buy?'✅ اتسجل الشراء':'✅ اتسجلت الدفعة')+(add.length>1?' واتدفع':'')+' · '+(supBal(s)<0?'ليك عنده ':'عليك ')+f(Math.abs(supBal(s)))};
$('spMore').onclick=()=>{spAll=true;drawSup()};
$('spLF').onclick=e=>{const b=e.target.closest('[data-lf]');if(b){spLF=b.dataset.lf;spAll=false;drawSup()}};
$('spList').onclick=e=>{const eb=e.target.closest('[data-spe]');if(eb){spStartEdit(eb.dataset.spe);return}const b=e.target.closest('[data-spd]');if(!b||!ok2(b))return;const x=S.purchases.find(y=>y.id===b.dataset.spd);if(!x)return;
  const rel=S.purchases.filter(y=>y.pf===x.id),sk=S.stock.filter(y=>y.id===x.sk||(x.sks||[]).includes(y.id));[x,...rel].forEach(y=>del('purchases',y.id));sk.forEach(y=>del('stock',y.id));drawSup();
  toast('اتمسحت الحركة'+(rel.length||sk.length?' ومعاها '+(rel.length?'السداد':'')+(rel.length&&sk.length?' و':'')+(sk.length?'المخزون':''):''),'تراجع',()=>{[x,...rel].forEach(y=>undel('purchases',y));sk.forEach(y=>undel('stock',y));drawSup()})};
/* بيانات المورد */
const spCur=()=>S.suppliers.find(x=>x.id===supCur);
$('supEN').onchange=()=>{const s=spCur(),n=$('supEN').value.trim().replace(/\s+/g,' '),m=$('supEM');if(!s)return;if(!n){m.textContent='الاسم مينفعش يبقى فاضي';$('supEN').value=s.name;return}if(S.suppliers.some(x=>x.id!==s.id&&nkey(x.name)===nkey(n))){m.textContent='فيه مورد بنفس الاسم';$('supEN').value=s.name;return}m.textContent='';s.name=n;put('suppliers',s);drawSup()};
$('supPh').onchange=()=>{const s=spCur();if(s){spSave(s,'phone',$('supPh').value.trim());drawSup()}};
$('supENote').onchange=()=>{const s=spCur();if(s)spSave(s,'note',$('supENote').value.trim())};
$('supEC').onclick=e=>{const b=e.target.closest('[data-ec]'),s=spCur();if(b&&s){spSave(s,'cat',b.dataset.ec);drawSup()}};
$('supET').onclick=e=>{const b=e.target.closest('[data-et]'),s=spCur();if(b&&s){spSave(s,'terms',+b.dataset.et);spDue=+b.dataset.et>0?+b.dataset.et:null;drawSup()}};
/* كشف حساب بصورة */
$('supStm').onclick=()=>{const s=spCur();if(!s)return;const g=spAge(s);if(!g.l.length){$('spMsg').textContent='مفيش حركات تتعمل لها كشف';return}
  let run=0;const all=g.l.map(x=>{const v=+x.amt||0,pay=x.type==='pay';run=rd2(run+(pay?-v:v));return[dshort(x.ts).slice(5),x.note||(pay?'دفعة':'شراء'),pay?'':f(v),pay?f(v):'',f(run)]}),rows=all.slice(-30);
  const cv=sheet({title:'كشف حساب',name:s.name,sub:'مورد · '+shopN(),date:stamp(Date.now()),tables:[{th:['اليوم','البيان','شراء','دفع','الرصيد'],w:[.16,.34,.17,.16,.17],rows}],
    sum:[['إجمالي المشتريات',f(g.buy)],['إجمالي المدفوع',f(g.pay)],...(g.ov>0?[['متأخر',f(g.ov)]]:[]),[g.bal<0?'ليك عنده':'الرصيد',f(Math.abs(g.bal)),1]]});
  showImg(cv,'كشف-'+s.name.replace(/\s+/g,'-')+'.png','كشف حساب '+s.name,false,s.phone||'',null)};
/* صور ومستندات المورد: بتتصغّر لأبيض وأسود صغير (حوالي 50 كيلو) وبتتحفظ زي أي بيانات: على الجهاز وعلى السحابة (S.files) */
const FDB=(()=>{let p=null;const open=()=>p||(p=new Promise((ok,no)=>{const r=indexedDB.open('tabakha-files',1);r.onupgradeneeded=()=>{r.result.createObjectStore('f',{keyPath:'id'}).createIndex('sid','sid')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
  const run=async(mode,fn)=>{const d=await open();return new Promise((ok,no)=>{const t=d.transaction('f',mode);let q;try{q=fn(t.objectStore('f'))}catch(e){no(e);return}t.oncomplete=()=>ok(q&&q.result);t.onerror=t.onabort=()=>no(t.error)})};
  return{all:()=>run('readonly',s=>s.getAll()),del:id=>run('readwrite',s=>s.delete(id))}})();
let spFl=[],spPend=[],spFK2='فاتورة',spVl=[],spVi=0,spVK=null;const spAfter=()=>{if(selC&&getC(selC)&&!$('cuDet').classList.contains('hide'))drawDet()};
const SPK=[['📄','فاتورة'],['🧾','كشف حساب'],['💵','إيصال دفع'],['📋','عرض سعر'],['🖼','أخرى']];
/* رمادي + تمطيط التباين (الورقة تبقى بيضا والكتابة سودا) + JPEG لحد ما الحجم يبقى صغير */
async function spShrink(file){const bmp=await createImageBitmap(file);let side=1400,q=.5,url='';
  for(let i=0;i<8;i++){const k=Math.min(1,side/Math.max(bmp.width,bmp.height)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(bmp.width*k));cv.height=Math.max(1,Math.round(bmp.height*k));const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.drawImage(bmp,0,0,cv.width,cv.height);
    const im=x.getImageData(0,0,cv.width,cv.height),d=im.data,h=new Uint32Array(256);for(let j=0;j<d.length;j+=4){const g=(d[j]*299+d[j+1]*587+d[j+2]*114)/1000|0;d[j]=g;h[g]++}
    const n=d.length/4;let lo=0,hi=255,a=0;for(;lo<254;lo++){a+=h[lo];if(a>n*.01)break}a=0;for(;hi>lo+1;hi--){a+=h[hi];if(a>n*.02)break}const sc=255/Math.max(1,hi-lo);
    for(let j=0;j<d.length;j+=4){const g=Math.max(0,Math.min(255,(d[j]-lo)*sc))|0;d[j]=d[j+1]=d[j+2]=g}x.putImageData(im,0,0);
    url=cv.toDataURL('image/jpeg',q);if(url.length*.75<=60e3||i===7)break;if(q>.34)q-=.08;else side=Math.max(900,side*.88)}
  if(bmp.close)bmp.close();return url}
function spLoadF(sid){spFl=S.files.filter(f=>f.sid===sid).sort((a,b)=>b.ts-a.ts);return Promise.resolve()}
const spKB=d=>Math.max(1,Math.round(d.length*.75/1024));
function spFilesDraw(){$('spFK').innerHTML=SPK.map(([i,k])=>`<button type="button" data-fk="${k}">${i} ${k}</button>`).join('');$('spFN').textContent=spFl.length?spFl.length+' مستند':'';
  $('spTh').innerHTML=spFl.map((f,i)=>`<button type="button" class="spt" data-fv="${i}"><img src="${f.d}" alt=""><small>${esc(f.title||f.kind||'')}</small></button>`).join('')}
$('spFK').onclick=e=>{const b=e.target.closest('[data-fk]');if(!b)return;spFK2=b.dataset.fk;$('spFI').value='';$('spFI').click()};
$('spFI').onchange=async()=>{const s=spCur(),fs=[...$('spFI').files],m=$('spMsg');if(!s||!fs.length)return;m.textContent='جاري الحفظ…';
  try{let kb=0;for(const file of fs){const d=await spShrink(file),o={id:uid(),sid:s.id,kind:spFK2,ts:Date.now(),d};kb+=spKB(d);S.files.push(o);put('files',o)}await spLoadF(s.id);drawSup();m.textContent='✅ اتحفظ '+(fs.length>1?fs.length+' صور':'الصورة')+' (أبيض وأسود · '+kb+' ك.ب)'}catch(err){m.textContent='⚠️ معرفتش أحفظ الصورة'}};
$('spAtt').onclick=()=>{$('spEI').value='';$('spEI').click()};
$('spEI').onchange=async()=>{const fs=[...$('spEI').files];try{for(const f of fs)spPend.push(await spShrink(f))}catch(e){$('spMsg').textContent='⚠️ معرفتش أقرا الصورة'}$('spAttN').textContent=spPend.length?'✅ '+spPend.length+' صورة هتتحفظ مع الحركة':''};
$('spTh').onclick=e=>{const b=e.target.closest('[data-fv]');if(b)spView(spFl,+b.dataset.fv)};
/* صور قديمة اتحفظت على الجهاز بس (نسخة 268): بتتنقل لنفس مكان باقي البيانات وبتتصغّر */
async function spMigFiles(){try{const old=await FDB.all();for(const r of old){if(!S.suppliers.some(s=>s.id===r.sid)){await FDB.del(r.id);continue}
    const d=await spShrink(new File([r.blob],'x.jpg',{type:r.blob.type||'image/jpeg'})),o={id:r.id,sid:r.sid,kind:r.kind,ts:r.ts,d};if(r.pid)o.pid=r.pid;if(r.title)o.title=r.title;S.files.push(o);put('files',o);await FDB.del(r.id)}}catch(e){}}
/* شاشة عرض الصورة: تكبير بالضغط، تقليب، عنوان ونوع، مشاركة وحذف */
function spViewShow(){const fl=spVl[spVi],v=$('spView');if(!fl){v.classList.add('hide');return}
  $('svP').src=fl.d;v.querySelector('#svI').classList.remove('z');$('svT').value=fl.title||'';
  const p=fl.pid&&S.purchases.find(x=>x.id===fl.pid);$('svM').textContent=dshort(fl.ts)+(p?' · '+(p.type==='pay'?'دفعة ':'شراء ')+f(p.amt):'')+(spVl.length>1?' · '+(spVi+1)+'/'+spVl.length:'');
  $('svK').innerHTML=(spVK||SPK).map(([i,k])=>`<button type="button" data-sk="${k}"${k===fl.kind?' class="on"':''}>${i} ${k}</button>`).join('');$('svPrev').disabled=$('svNext').disabled=spVl.length<2;disarm($('svDel'));$('svDel').textContent='🗑️ حذف'}
function spView(list,i,kinds){spVl=list;spVi=i;spVK=kinds||null;let v=$('spView');
  if(!v){v=document.createElement('div');v.id='spView';v.className='spv-ov hide';
    v.innerHTML='<div class="spv-top"><button type="button" class="alt" id="svX" aria-label="إغلاق">✕</button><div class="spv-tt"><input id="svT" placeholder="عنوان (اختياري)" aria-label="عنوان المستند" autocomplete="off"><small id="svM" class="mute"></small></div></div><div class="spc" id="svK" style="padding:0 8px"></div><div class="spv-img" id="svI"><img id="svP" alt=""></div><div class="spv-bot"><button type="button" class="alt" id="svPrev" aria-label="اللي قبله">›</button><button type="button" class="alt" id="svSh">📤 مشاركة</button><button type="button" class="alt b-red" id="svDel">🗑️ حذف</button><button type="button" class="alt" id="svNext" aria-label="اللي بعده">‹</button></div>';
    document.body.appendChild(v);
    $('svX').onclick=()=>v.classList.add('hide');
    $('svI').onclick=e=>{const c=$('svI'),im=$('svP');if(c.classList.contains('z')){c.classList.remove('z');return}const r=im.getBoundingClientRect(),fx=(e.clientX-r.left)/Math.max(1,r.width),fy=(e.clientY-r.top)/Math.max(1,r.height);c.classList.add('z');c.scrollLeft=Math.max(0,fx*im.offsetWidth-c.clientWidth/2);c.scrollTop=Math.max(0,fy*im.offsetHeight-c.clientHeight/2)};
    $('svPrev').onclick=()=>{spVi=(spVi-1+spVl.length)%spVl.length;spViewShow()};$('svNext').onclick=()=>{spVi=(spVi+1)%spVl.length;spViewShow()};
    $('svT').onchange=()=>{const x=spVl[spVi];if(!x)return;x.title=$('svT').value.trim();if(!x.title)delete x.title;put('files',x);spFilesDraw();spAfter()};
    $('svK').onclick=e=>{const b=e.target.closest('[data-sk]'),x=spVl[spVi];if(!b||!x)return;x.kind=b.dataset.sk;put('files',x);spViewShow();spFilesDraw();spAfter()};
    $('svSh').onclick=async()=>{const x=spVl[spVi];if(!x)return;const s=spCur(),nm=((s&&s.name)||'مستند')+' - '+(x.title||x.kind||'صورة')+'.jpg',file=new File([dataBlob(x.d)],nm,{type:'image/jpeg'});
      try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:nm});return}}catch(e){if(e&&e.name==='AbortError')return}
      const a=document.createElement('a');a.href=x.d;a.download=nm;document.body.appendChild(a);a.click();a.remove()};
    $('svDel').onclick=()=>{const x=spVl[spVi];if(!x||!ok2($('svDel')))return;del('files',x.id);spLoadF(x.sid);spVl=spVl.filter(y=>y.id!==x.id);spFilesDraw();drawSup();spAfter();if(!spVl.length){v.classList.add('hide');return}spVi=Math.min(spVi,spVl.length-1);spViewShow()}}
  v.classList.remove('hide');spViewShow()}
/* المواعيد: كل شراء لسه عليه فلوس وميعاده، ودوس على أي ميعاد تغيّره */
function spSchedDraw(g){const now=Date.now(),l=g.l.filter(x=>x.type==='buy'&&g.rem[x.id]>0).sort((a,b)=>(a.due||9e15)-(b.due||9e15)||a.ts-b.ts).slice(0,5);
  $('supSched').innerHTML=l.map(x=>{const dd=x.due?Math.ceil((x.due-now)/SPDAY):null,late=x.due&&x.due<now;
    return`<div class="spsr${late?' bad':''}" data-sd="${esc(x.id)}"><span>${x.due?'📅 '+dshort(x.due).slice(5):'📅 من غير ميعاد'}</span><span class="num">${f(g.rem[x.id])}</span><span class="mute">${x.due?(late?'متأخر '+Math.abs(dd)+' يوم':spIn(dd)):'دوس وحدد'}</span><span>✏️</span></div>`}).join('')}
$('supSched').onclick=e=>{const r=e.target.closest('[data-sd]');if(!r)return;const x=S.purchases.find(y=>y.id===r.dataset.sd);if(!x)return;
  const i=document.createElement('input');i.type='date';i.style.cssText='position:fixed;opacity:0;top:50%;left:0;width:1px;height:1px';i.value=dayKey(x.due||Date.now());document.body.appendChild(i);
  i.onchange=()=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(i.value);if(m){x.due=new Date(+m[1],+m[2]-1,+m[3],12).getTime();put('purchases',x);drawSup()}i.remove()};i.onblur=()=>setTimeout(()=>i.remove(),400);
  try{i.showPicker()}catch(er){i.focus();i.click()}};
$('spList').addEventListener('click',e=>{const b=e.target.closest('[data-spf]');if(!b)return;const l=spFl.filter(f=>f.pid===b.dataset.spf);if(l.length)spView(l,0)});
$('spkNext').onclick=()=>{const id=$('spkNext').dataset.sup;if(id)supOpen(id)};
$('supPen').onclick=()=>{const d=$('supEdit');d.open=!d.open;if(d.open){d.scrollIntoView({block:'nearest'})}};
$('supDel').onclick=e=>{const m=$('spMsg');if(S.purchases.some(x=>x.sid===supCur)){m.textContent='احذف حركات المورد الأول';return}if(spFl.length){m.textContent='احذف صور المورد الأول';return}if(!ok2(e.target))return;const s=S.suppliers.find(x=>x.id===supCur);del('suppliers',supCur);supOpen(null);if(s)toast('اتمسح المورد: '+s.name,'تراجع',()=>{undel('suppliers',s);drawSup()})};


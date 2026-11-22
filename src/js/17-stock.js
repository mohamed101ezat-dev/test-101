/* المخزون الكامل: S.stock {id,iid,ts,q,t?,why?,sid?,cost?,note?}، q موجب وارد وسالب صرف، t='adj' يعني تسوية جرد.
   الصنف الجاهز بيتخصم لوحده من الفواتير من أول حركة ليه، والمقطع بيتصرف بإيدك لأن عدد القطع مش عدد ألواح.
   بيانات المخزون لكل صنف على الصنف نفسه: item.inv = {mn حد التنبيه, cost سعر الشراء, loc المكان, sid المورد} */
const SKD=864e5;let stkV='home',stkId=null,stkF='all',stkTy='',stkAct=null,stkRs='قطّعت',stkMF='all';
function stkAll(){const m=new Map();S.stock.forEach(x=>{const it=S.items.find(i=>i.id===x.iid);if(!it)return;const o=m.get(x.iid)||{from:x.ts,bal:0,it};o.from=Math.min(o.from,x.ts);o.bal=rd2(o.bal+(+x.q||0));m.set(x.iid,o)});
  const IT=new Map(S.items.map(i=>[i.id,i])),PM=new Map(),par=it=>{if(!PM.has(it.id))PM.set(it.id,skPar(it));return PM.get(it.id)};
  S.invoices.forEach(r=>{if(r.type==='pay')return;(r.rows||[]).forEach(x=>{const it=IT.get(x.i);if(!it)return;const sg=x.rt?-1:1,o=m.get(x.i);
    if(it.type==='rd'){if(o){if(r.ts>=o.from)o.bal=rd2(o.bal-sg*(+x.c||0));return}const g=par(it),og=g&&m.get(g.id);if(og&&r.ts>=og.from)og.bal=rd2(og.bal-sg*(+x.c||0)/skYield(it,g));return}
    if(it.type==='mq'&&o&&r.ts>=o.from){const q=+x.q>0?+x.q:(+x.w||0)*(+x.h||0)/1e4*(+x.c||0);if(q)o.bal=rd2(o.bal-sg*q/skArea(it))}})});
  S.items.forEach(it=>{if(it.type==='mq'&&skInv(it).szOn&&skSizes(it).length){const s=skSzSim(it);m.set(it.id,{from:s.from,bal:s.bal,it,zs:s.zs,area:s.area})}});return m}
function stkMin(){return Math.max(0,nv(lsv('stkMin','3')))}
const skInv=it=>it.inv||{};
const skMn=it=>{if(it.type==='mq'&&skInv(it).szOn&&skSizes(it).length){const m=+skInv(it).mnm;return m>0?m/skArea(it):stkMin()}const v=skInv(it).mn;return v!=null&&v!==''?+v:stkMin()};
function stkLow(m){return[...m.values()].filter(o=>o.bal<=skMn(o.it)).length}
const skUn=it=>it.type==='rd'?'قطعة':'لوح';
const skCost=it=>+skInv(it).cost||0;
/* v304: كل نوع زجاج بيتحسب بالألواح. البيع بالمتر والقطع الجاهزة اللي بتتقطع منه بيتخصموا منه لوحدهم كجزء من لوح */
const SKSW=225,SKSH=321;
const skSheet=g=>{const v=skInv(g);return[+v.sw>0?+v.sw:SKSW,+v.sh>0?+v.sh:SKSH]};
const skArea=g=>{const[a,b]=skSheet(g);return a*b/1e4};
/* v380: الجاهز اللي له جرد بيتخصم من رصيده هو، واللي ما اتعدّش بيتخصم مترات من نوع اللوح بتاعه */
function skPar(it){const v=skInv(it).par;if(v==='-')return null;if(v)return S.items.find(x=>x.id===v&&x.type==='mq')||null;const k=nkey(it.name);return k?S.items.find(x=>x.type==='mq'&&nkey(x.name)===k)||null:null}
function skYieldAuto(it,g){const[a,b]=skSheet(g),w=+it.w||0,hh=+it.h||0;if(!(w>0&&hh>0))return 1;return Math.max(1,Math.floor(a/w)*Math.floor(b/hh),Math.floor(a/hh)*Math.floor(b/w))}
const skYield=(it,g)=>+skInv(it).y>0?+skInv(it).y:skYieldAuto(it,g);
const skKids=g=>S.items.filter(k=>k.type==='rd'&&(p=>p&&p.id===g.id)(skPar(k)));
const sk1=v=>Math.round(v*10)/10;
const skNm=it=>esc(it.name)+(szOf(it)?' <small class="num">'+esc(szOf(it))+'</small>':'');
const skTx=it=>it.name+(szOf(it)?' '+szOf(it):'');
const skAgo=t=>{if(!t)return'';const d=Math.floor((Date.now()-t)/SKD);return d<=0?'النهارده':d===1?'امبارح':'من '+d+' يوم'};
function skSet(it,o){it.inv=Object.assign({},it.inv,o);put('items',it)}
function stkOpen(){$('stkLim').value=lsv('stkMin','3');$('stkWmax').value=lsv('wasteMax','15');$('stkMsg').textContent='';stkV='home';stkId=null;stkAct=null;drawStk()}
function skSales(){const rd=new Set(S.items.filter(i=>i.type==='rd').map(i=>i.id)),m=new Map();
  S.invoices.forEach(r=>{if(r.type==='pay')return;(r.rows||[]).forEach(x=>{if(!rd.has(x.i)||!+x.c)return;let a=m.get(x.i);if(!a)m.set(x.i,a=[]);a.push({inv:1,iid:x.i,ts:r.ts,q:(x.rt?1:-1)*(+x.c),code:r.code||('#'+r.no)})})});return m}
function skMovesOf(iid,m,sal){const o=m.get(iid),a=S.stock.filter(x=>x.iid===iid),s=o?(sal.get(iid)||[]).filter(x=>x.ts>=o.from):[];return a.concat(s).sort((x,y)=>y.ts-x.ts)}
/* حالة كل صنف: new مش مسجل · out خلص · low قرب يخلص · idle راكد (60 يوم من غير حركة) · ok تمام */
function skInfo(){const m=stkAll(),sal=skSales(),now=Date.now(),last=new Map(),use=new Map(),add=x=>{const q=+x.q||0;if(!last.has(x.iid)||x.ts>last.get(x.iid))last.set(x.iid,x.ts);if(q<0&&x.t!=='adj'&&now-x.ts<=30*SKD)use.set(x.iid,(use.get(x.iid)||0)-q)};
  S.stock.forEach(add);sal.forEach((a,id)=>{const o=m.get(id);a.forEach(x=>{if(o&&x.ts>=o.from)add(x)})});
  return S.items.map(it=>{const o=m.get(it.id),tr=!!o,bal=o?o.bal:0,mn=skMn(it),u=use.get(it.id)||0,lt=last.get(it.id)||0,per=u/30;
    const st=!tr?'new':bal<=0?'out':bal<=mn?'low':(now-lt>60*SKD?'idle':'ok');
    return{it,tr,bal,mn,use:u,last:lt,left:per>0&&bal>0?Math.floor(bal/per):null,st,val:bal>0?(o&&o.zs?skSzVal(it,o):bal*skCost(it)):0}})}
const SKI={out:'❌',low:'⚠️',ok:'✅',idle:'🕸',new:'➕'},SKO={out:0,low:1,ok:2,idle:3,new:4};
const SKR=[['قطّعت','🔨 قطّعت منه'],['اتكسر','💥 اتكسر'],['عينة','🎁 عينة / هدية'],['من غير فاتورة','📤 بعته من غير فاتورة'],['غير كده','✍️ غير كده']];
/* v302: صفحة المخزن ببساطة: سطر واحد بالحال، زرارين كبار، وكل صنف قدامه عنده كام */
function skHome(){const A=skInfo(),q=$('stkQ').value,c=k=>A.filter(x=>x.st===k).length,val=A.reduce((a,x)=>a+x.val,0),nNew=c('new'),nLow=c('low'),nOut=c('out');
  const st=[nOut?'<b class="dn">❌ '+plN(nOut,'صنف')+' خلص</b>':'',nLow?'<b class="lw">⚠️ '+plN(nLow,'صنف')+' قرب يخلص</b>':''].filter(Boolean).join(' · ');
  skTopDraw();const _skOld='<div class="skh">'+(A.length?'عندك '+plN(A.length,'صنف'):'مفيش أصناف لسه')+(val>0?' <small>· قيمتهم حوالي '+f(Math.round(val))+' ج</small>':'')+'</div>'+(st?'<div class="skst">'+st+'</div>':(A.length&&nNew<A.length?'<div class="skst ok">✅ كله تمام</div>':''));
  const sb=$('skStart');sb.classList.add('hide');
  if(!sb.classList.contains('hide'))sb.innerHTML='<b>👋 ابدأ من هنا</b><div class="mute" style="margin:4px 0 8px">'+plN(nNew,'صنف')+' لسه ما اتعدّوش. دوس «✍️ عدّ المخزن» واكتب عندك كام لوح أو قطعة من كل صنف مرة واحدة، وبعد كده البرنامج بيحسب لوحده.</div><button type="button" class="main" data-sg="cnt" style="width:100%">✍️ عدّ المخزن دلوقتي</button>';
  /* v364: المخزن نفس جدول الأصناف: تبويب للجاهز وتبويب للمقطع، وكل واحد بحاله */
  const nR=A.filter(x=>x.it.type==='rd').length,nM=A.filter(x=>x.it.type==='mq').length;if(stkTy!=='rd'&&stkTy!=='mq'||(stkTy==='rd'&&!nR&&nM)||(stkTy==='mq'&&!nM&&nR))stkTy=nR||!nM?'rd':'mq';
  $('stkTy').innerHTML='<button type="button" data-sty="rd" class="'+(stkTy==='rd'?'on':'')+'">📦 جاهز <small>'+nR+'</small></button><button type="button" data-sty="mq" class="'+(stkTy==='mq'?'on':'')+'">✂️ مقطع <small>'+nM+'</small></button>';
  const AT=A.filter(x=>x.it.type===stkTy),cT=k=>AT.filter(x=>x.st===k).length;
  const F=[['all','الكل',AT.length],['out','❌ خلص',cT('out')],['low','⚠️ قرب يخلص',cT('low')]].filter(x=>x[0]==='all'||x[2]||x[0]===stkF);
  if(!F.some(x=>x[0]===stkF))stkF='all';
  $('stkFil').innerHTML=F.length>1?F.map(([k,l,n])=>`<button type="button" data-sf="${k}"${k===stkF?' class="on"':''}>${l} <small>${n}</small></button>`).join(''):'';
  const O={out:0,low:1,ok:2,idle:2,new:3},l=AT.filter(x=>(stkF==='all'||x.st===stkF||(stkF==='ok'&&x.st==='idle'))&&qm(x.it.name,q)).sort((a,b)=>a.it.name.localeCompare(b.it.name,'ar')||((+a.it.w||0)*(+a.it.h||0))-((+b.it.w||0)*(+b.it.h||0)));
  $('stkRows').innerHTML=l.length?l.map(x=>{const kd=x.it.type==='mq'?skKids(x.it):[],sub=[x.tr&&x.left!=null?'يكفي حوالي '+x.left+' يوم':'',skInv(x.it).loc?'📍 '+esc(skInv(x.it).loc):''].filter(Boolean).join(' · ');
    const ic=x.st==='out'?'❌':x.st==='low'?'⚠️':'';
    return`<div class="skr ${x.st==='idle'?'ok':x.st}" data-sg="one" data-id="${esc(x.it.id)}" role="button" tabindex="0">${ic?'<span class="sks">'+ic+'</span>':''}<div class="skn"><span>${skNm(x.it)}</span>${sub?'<small>'+sub+'</small>':''}${(()=>{const l=skSzLine(x);return l?'<div class="skzs">'+esc(l)+'</div>':''})()}</div><div class="skb">${x.tr?skBalTx(x.it,x):'<small class="skz">—</small>'}</div></div>`}).join(''):`<div class="card mute">${S.items.length?'مفيش صنف بالشكل ده.':'مفيش أصناف لسه. ضيفها الأول من: الإعدادات ← الأصناف.'}</div>`}
function skMvRow(x,nm){const it=S.items.find(i=>i.id===x.iid)||{},t=x.inv?'sale':(x.t==='adj'?'adj':(x.q>0?'in':'out')),sup=x.sid&&S.suppliers.find(s=>s.id===x.sid);
  const d=t==='sale'?(x.q<0?'🧾 اتباع ':'↩️ مرتجع ')+'<small class="mute">'+esc(x.code)+'</small>':t==='adj'?'✍️ عدّ <small class="mute">'+(x.q>0?'زاد':'نقص')+'</small>':t==='in'?'➕ دخل'+(x.tc?' <small class="mute">بـ'+f(x.tc)+'</small>':(x.cost?' <small class="mute">بـ'+f(x.cost)+'</small>':''))+(sup?' <small class="mute">· '+esc(sup.name)+'</small>':''):'➖ '+esc(x.why||'صرف');
  return`<tr><td class="num">${dshort(x.ts).slice(5)}</td>${nm?`<td class="tn">${esc(it.name||'')}</td>`:''}<td>${d}${x.note?'<br><small class="mute">'+esc(x.note)+'</small>':''}${skMvX(x)}</td><td class="num">${x.q>0?'+':'−'}${f(Math.abs(x.q))}</td><td>${x.inv?'':`<button type="button" class="xd" data-skd="${esc(x.id)}" aria-label="حذف الحركة">×</button>`}</td></tr>`}
function skSub(h){$('stkHome').classList.toggle('hide',!!h);$('stkSub').classList.toggle('hide',!h);if(h)$('stkSub').innerHTML=h}
const skBack='<div class="ro" style="color:var(--ink);margin:0 0 6px"><button type="button" class="lnk" data-sg="home">→ رجوع</button></div>';
/* v344: النوع+السمك صنف واحد، ومقاسات ألواحه جواه. بعد «الجرد الافتتاحي» كل مقاس ليه رصيده الحقيقي (بالألواح، وممكن يبقى كسر لو اتفتح لوح). المتر والجاهز بيتخصموا من أصغر مقاس يكفي القطعة (أو من المقاس اللي اخترته في سطر الفاتورة) */
const skSizes=it=>{const a=skInv(it).sizes;return Array.isArray(a)?a.filter(z=>z&&z.id&&+z.w>0&&+z.h>0):[]};
const skZA=z=>(+z.w)*(+z.h)/1e4,skZEq=(it,z)=>skZA(z)/skArea(it),skZN=z=>'\u2066'+fq(+z.w)+'×'+fq(+z.h)+'\u2069',eq3=v=>Math.round(v*1000)/1000,rd3=eq3;
const skSzOn=it=>!!it&&it.type==='mq'&&!!skInv(it).szOn&&skSizes(it).length>0;
const skFits=(z,w,h)=>{const a=+z.w,b=+z.h;return(a>=w&&b>=h)||(a>=h&&b>=w)};
const skCpm=it=>{const v=skInv(it);return +v.cpm>0?+v.cpm:(skCost(it)>0?skCost(it)/skArea(it):0)};
/* محاكاة رصيد كل مقاس بالترتيب الزمني: الحركات + مبيعات المتر + الجاهز اللي ملوش مخزن لوحده */
function skSzSim(it){const inv=skInv(it),T=+inv.szT||0,Z=skSizes(it),zs=new Map(Z.map(z=>[z.id,{z,n:0}])),IT=new Map(S.items.map(i=>[i.id,i])),own=new Set(S.stock.map(y=>y.iid)),ev=[];
  S.stock.forEach(x=>{if(x.iid===it.id&&x.ts>=T)ev.push([x.ts,0,x])});
  S.invoices.forEach(r=>{if(r.type==='pay'||r.ts<T)return;(r.rows||[]).forEach(x=>{const rd=x.i&&IT.get(x.i);if(!rd)return;if(x.i===it.id)ev.push([r.ts,1,x,rd]);else if(rd.type==='rd'&&!own.has(rd.id)){const g=skPar(rd);if(g&&g.id===it.id)ev.push([r.ts,1,x,rd])}})});
  ev.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const av=c=>Math.max(0,c.n)*skZA(c.z),sub=(c,a)=>{c.n=rd3(c.n-a/skZA(c.z))};
  const take=(area,w,h,pref)=>{if(!(Math.abs(area)>1e-9))return;const all=[...zs.values()];if(!all.length)return;
    if(area<0){const t=zs.get(pref)||all.slice().sort((a,b)=>av(b)-av(a))[0];sub(t,area);return}
    let need=area;const pr=zs.get(pref);if(pr){const a=Math.min(need,av(pr));sub(pr,a);need-=a}
    const fit=all.filter(c=>c!==pr&&av(c)>1e-9&&(!(w>0&&h>0)||skFits(c.z,w,h)));
    const one=need>1e-9?fit.filter(c=>av(c)>=need-1e-9).sort((a,b)=>skZA(a.z)-skZA(b.z))[0]:null;
    if(one){sub(one,need);need=0}
    if(need>1e-9){fit.sort((a,b)=>av(b)-av(a));for(const c of fit){if(need<=1e-9)break;const a=Math.min(need,av(c));sub(c,a);need-=a}}
    if(need>1e-9){const rest=all.filter(c=>av(c)>1e-9).sort((a,b)=>av(b)-av(a));for(const c of rest){if(need<=1e-9)break;const a=Math.min(need,av(c));sub(c,a);need-=a}}
    if(need>1e-9){const t=pr||fit[0]||all.slice().sort((a,b)=>skZA(a.z)-skZA(b.z))[0];sub(t,need)}};
  for(const e of ev){if(e[1]===0){const x=e[2],c=x.sz&&zs.get(x.sz);if(c)c.n=rd3(c.n+(+x.q||0));continue}
    const x=e[2],rd=e[3],sg=x.rt?-1:1,cn=+x.c||0;let area,w=0,h=0;
    if(rd.type==='mq'){area=+x.q>0?+x.q:(+x.w||0)*(+x.h||0)/1e4*cn;w=+x.w||0;h=+x.h||0}
    else{w=+rd.w||0;h=+rd.h||0;area=(w>0&&h>0)?w*h/1e4*cn:cn*skArea(it)/skYield(rd,it)}
    take(sg*area,w,h,x.sz)}
  let area=0;zs.forEach(c=>{area+=c.n*skZA(c.z)});return{zs,area:rd3(area),bal:rd3(area/skArea(it)),from:T}}
function skSzVal(it,o){let v=0;if(o&&o.zs)o.zs.forEach(c=>{if(c.n>0)v+=c.n*(+c.z.c>0?+c.z.c:skCpm(it)*skZA(c.z))});return v}
const skMnTx=(it,x)=>skSzOn(it)?fq(rd2(x.mn*skArea(it)))+' م²':f(x.mn);
const skBalTx=(it,x)=>skSzOn(it)?'<span class="num">'+fq(rd2(x.bal*skArea(it)))+'</span><small>م²</small>':'<span class="num">'+f(sk1(x.bal))+'</span><small>'+skUn(it)+'</small>';
function skSzLine(x){if(!skSzOn(x.it)||!x.tr)return'';const o=stkAll().get(x.it.id);if(!o||!o.zs)return'';return[...o.zs.values()].filter(c=>c.n>0.0005).map(c=>skZN(c.z)+': '+fq(rd2(c.n))).join(' · ')}
/* الهادر: بيتسجل على حركة «قطّعت»، وقيمته بسعر المتر */
function skWasteRange(a,b,iid){let m=0,v=0;S.stock.forEach(y=>{if(!y.w||!(y.w.m>0)||y.ts<a||y.ts>=b||(iid&&y.iid!==iid))return;const it=S.items.find(i=>i.id===y.iid);m=rd2(m+y.w.m);if(it)v+=y.w.m*skCpm(it)});return{m,v:Math.round(v)}}
const skWasteSum=(days,iid)=>skWasteRange(Date.now()-days*SKD,Date.now()+1,iid);
function skUseArea(it,a,b){let s=0;const own=new Set(S.stock.map(y=>y.iid)),IT=new Map(S.items.map(i=>[i.id,i]));S.invoices.forEach(r=>{if(r.type==='pay'||r.ts<a||r.ts>=b)return;(r.rows||[]).forEach(x=>{const rd=x.i&&IT.get(x.i);if(!rd||x.rt)return;const cn=+x.c||0;if(x.i===it.id)s+=+x.q>0?+x.q:(+x.w||0)*(+x.h||0)/1e4*cn;else if(rd.type==='rd'&&!own.has(rd.id)){const g=skPar(rd);if(g&&g.id===it.id){const w=+rd.w||0,h=+rd.h||0;s+=(w>0&&h>0)?w*h/1e4*cn:cn*skArea(it)/skYield(rd,it)}}})});return rd2(s)}
const wasteMax=()=>Math.max(1,nv(lsv('wasteMax','15'))||15);
function skWasteWarn(){const d=new Date(),a=new Date(d.getFullYear(),d.getMonth(),1).getTime(),b=Date.now()+1,mx=wasteMax(),o=[];S.items.forEach(it=>{if(it.type!=='mq')return;const w=skWasteRange(a,b,it.id);if(!(w.m>0))return;const t=skUseArea(it,a,b)+w.m,p=t>0?Math.round(w.m/t*100):0;if(p>mx)o.push(it.name+' '+p+'%')});return o}
const skMvX=x=>{const p=[];if(x.sz||(x.szs&&x.szs.length)){const it=S.items.find(i=>i.id===x.iid),zs=it?skSizes(it):[],one=x.sz?[{id:x.sz,n:null}]:x.szs;p.push(one.map(s=>{const z=zs.find(v=>v.id===s.id);return(z?skZN(z):'مقاس')+(s.n!=null?' ×'+fq(s.n):'')}).join('، '))}
  if(x.rn){const r=S.items.find(i=>i.id===x.rd);p.push('← جاهز '+(r?skTx(r):'')+' ×'+fq(x.rn))}if(x.w&&x.w.m>0)p.push('هادر '+fq(x.w.m)+' م²'+(x.w.p?' ('+fq(x.w.p)+'%)':''));
  return p.length?'<br><small class="mute">'+esc(p.join(' · '))+'</small>':''};
const skSzRow=z=>'<div class="ro skszr" style="gap:4px;margin:2px 0" data-sid="'+esc(z.id)+'"><input class="szw" inputmode="decimal" value="'+(z.w||'')+'" placeholder="عرض" aria-label="عرض"><span>×</span><input class="szh" inputmode="decimal" value="'+(z.h||'')+'" placeholder="طول" aria-label="طول"><input class="szc" inputmode="decimal" value="'+(z.c||'')+'" placeholder="سعر اللوح" aria-label="سعر اللوح"><button type="button" class="xd" data-szx="1" aria-label="شيل المقاس">×</button></div>';
const skSizesUI=it=>'<label style="margin-top:6px">📏 مقاسات الألواح اللي بتشتريها (سم) وآخر سعر اللوح</label><div id="skSzs">'+skSizes(it).map(skSzRow).join('')+'</div><button type="button" class="alt" data-sz="add" style="margin-top:4px">➕ مقاس</button><div class="mute">بعد ما تضيف المقاسات، اعمل «✍️ عدّ» مرة واحدة (جرد افتتاحي) عشان كل مقاس يبقى ليه رصيده. بعدها الدخول والصرف والقطع بتتسجل بالمقاس.</div>';
function skSzSave(it){const w=$('skSzs');if(!w)return true;const a=[...w.querySelectorAll('.skszr')].map(r=>({id:r.dataset.sid||uid(),w:nv(r.querySelector('.szw').value),h:nv(r.querySelector('.szh').value),c:nv(r.querySelector('.szc').value)||0})).filter(z=>z.w>0&&z.h>0);
  const gone=skSizes(it).filter(z=>!a.some(v=>v.id===z.id)&&S.stock.some(y=>y.iid===it.id&&y.sz===z.id));if(gone.length){skMsg('⚠️ مقاس '+skZN(gone[0])+' عليه حركات، مينفعش يتمسح');return false}
  skSet(it,{sizes:a.length?a:null});return true}
const skQz=(sel,id)=>document.querySelector('#stkSub '+sel+'[data-z="'+id+'"]');
function skZRead(szs){const pm=$('skPm')&&$('skPm').checked;return szs.map(z=>{const n=rd2(nv((skQz('.skzn',z.id)||{}).value)),cv=nv((skQz('.skzc',z.id)||{}).value);return{z,n,c:cv>0?(pm?rd2(cv*skZA(z)):cv):0}}).filter(l=>l.n>0)}
function skZTot(it,szs){const L=skZRead(szs),eq=eq3(L.reduce((a,l)=>a+l.n*skZEq(it,l.z),0)),tc=rd2(L.reduce((a,l)=>a+l.n*l.c,0)),m2=rd2(L.reduce((a,l)=>a+l.n*skZA(l.z),0));return{L,eq,tc,m2}}
const skZRows=(szs,kind,zs)=>szs.map(z=>{const c=zs&&zs.get(z.id);return'<div class="ro skzr2" style="gap:6px;margin:2px 0"><span class="num" style="flex:1.2">'+skZN(z)+'</span><input class="skzn" data-z="'+esc(z.id)+'" inputmode="decimal" placeholder="'+(c?'الحالي '+fq(rd2(c.n)):'عدد')+'" autocomplete="off" aria-label="عدد '+skZN(z)+'">'+(kind==='in'?'<input class="skzc" data-z="'+esc(z.id)+'" inputmode="decimal" placeholder="سعر اللوح" value="'+(z.c||'')+'" autocomplete="off" aria-label="سعر اللوح">':'')+'</div>'}).join('');
const skFormIn=(it,szs,so,inv)=>'<div class="skf"><div class="mute">اكتب عدد الألواح من كل مقاس وسعر اللوح، وسيب المقاس اللي مدخلش فاضي.</div>'+skZRows(szs,'in')+'<label class="opt"><input type="checkbox" id="skPm"> السعر بالمتر (مش باللوح)</label><select id="skSup" aria-label="المورد">'+so(inv.sid)+'</select><label class="opt"><input type="checkbox" id="skPaid"> دفعت كاش دلوقتي (بيتسجل في حساب المورد)</label><input id="skNote" placeholder="ملاحظة (اختياري)" autocomplete="off" aria-label="ملاحظة"><div class="mute" id="skTot"></div><button type="button" class="main" data-do="in" style="width:100%">✅ سجّل الدخول</button></div>';
const skFormCnt=(it,szs,x,on)=>{const o=on?stkAll().get(it.id):null;return'<div class="skf"><div class="mute">'+(on?'عدّ كل مقاس عندك فعلًا دلوقتي (الألواح الكاملة). اللي هتكتبه هو اللي هيبقى رصيد المقاس، والفرق بيتسجل حركة جرد.':'<b>جرد افتتاحي:</b> عدّ الألواح اللي عندك من كل مقاس مرة واحدة، وسيب اللي مش عندك فاضي. من بعدها كل مقاس ليه رصيده، والمتر والجاهز بيتخصموا منهم لوحدهم.')+'</div>'+skZRows(szs,'cnt',o&&o.zs)+'<button type="button" class="main" data-do="cnt" style="width:100%">'+(on?'✅ اعتمد العدّ':'✅ ابدأ الرصيد بالمقاسات')+'</button></div>'};
const skFormOut=(it,szs,x)=>'<div class="skf"><select id="skOz" aria-label="المقاس">'+szs.map(z=>{const c=x.zs&&x.zs.get(z.id);return'<option value="'+esc(z.id)+'">'+skZN(z)+(c?' · '+fq(rd2(c.n))+' لوح':'')+'</option>'}).join('')+'</select><input id="skQty" inputmode="decimal" placeholder="عدد الألواح" autocomplete="off" aria-label="الكمية"><div class="spc">'+SKR.map(([k,l])=>'<button type="button" data-rs="'+k+'"'+(k===stkRs?' class="on"':'')+'>'+l+'</button>').join('')+'</div><input id="skNote" placeholder="ملاحظة (اختياري)" autocomplete="off" aria-label="ملاحظة"><button type="button" class="main" data-do="out" style="width:100%">✅ سجّل الصرف</button></div>';
const skFormCutSz=(it,szs,x)=>'<div class="skf"><div class="mute">القطع اللي اتباعت بتتخصم لوحدها من الفواتير. هنا سجّل اللي <b>باقي من اللوح</b> بعد القطع: الهادر (اختياري، ويتغير كل مرة) والفضلة اللي تنفع تتستخدم تاني (بتدخل المخزن مقاس جديد).</div><select id="skCz" aria-label="مقاس اللوح اللي اتقطع">'+szs.map(z=>{const c=x.zs&&x.zs.get(z.id);return'<option value="'+esc(z.id)+'">'+skZN(z)+(c?' · '+fq(rd2(c.n))+' لوح':'')+'</option>'}).join('')+'</select><div class="rowc"><input id="skCn" inputmode="decimal" placeholder="عدد الألواح اللي اتقطعت" value="1" autocomplete="off" aria-label="عدد الألواح"></div><div class="rowc"><input id="skWp" inputmode="decimal" placeholder="هادر % (اختياري)" autocomplete="off" aria-label="هادر بالنسبة"><input id="skWm" inputmode="decimal" placeholder="هادر م² (اختياري)" autocomplete="off" aria-label="هادر بالمتر"></div><div class="mute" style="font-size:12px">الهادر بالنسبة بيتحسب من مساحة الألواح اللي اتقطعت. لو كتبت الاتنين، المتر هو اللي بيتحسب.</div><div class="mute" style="margin-top:4px">🧩 فضلة صالحة (اختياري)</div><div class="rowc"><input id="skRw" inputmode="decimal" placeholder="عرض سم" autocomplete="off" aria-label="عرض الفضلة"><input id="skRh" inputmode="decimal" placeholder="طول سم" autocomplete="off" aria-label="طول الفضلة"><input id="skRc" inputmode="decimal" placeholder="عدد" value="1" autocomplete="off" aria-label="عدد الفضلة"></div><input id="skNote" placeholder="ملاحظة (اختياري)" autocomplete="off" aria-label="ملاحظة"><button type="button" class="main" data-do="cut" style="width:100%">✅ سجّل</button></div>';
const skFormCut=(it,szs,x)=>{const kd=skKids(it);return'<div class="skf"><div class="mute">سجّل لوح اتقطّع. الهادر اختياري: سيبه فاضي لو مفيش، وكل مرة ممكن يبقى مختلف.</div><div class="rowc"><input id="skCn" inputmode="decimal" placeholder="عدد الألواح" value="1" autocomplete="off" aria-label="عدد الألواح"></div><div class="rowc"><input id="skWp" inputmode="decimal" placeholder="هادر % (اختياري)" autocomplete="off" aria-label="هادر بالنسبة"><input id="skWm" inputmode="decimal" placeholder="هادر م² (اختياري)" autocomplete="off" aria-label="هادر بالمتر"></div><div class="mute" style="font-size:12px">لو كتبت الاتنين، المتر هو اللي بيتحسب.</div><select id="skRd" aria-label="الجاهز اللي طلع"><option value="">طلع منه جاهز؟ (اختياري)</option>'+kd.map(k=>'<option value="'+esc(k.id)+'">'+esc(skTx(k))+'</option>').join('')+'</select><input id="skRn" inputmode="decimal" placeholder="عدد القطع الجاهزة اللي طلعت" autocomplete="off" aria-label="عدد القطع"><input id="skNote" placeholder="ملاحظة (اختياري)" autocomplete="off" aria-label="ملاحظة"><button type="button" class="main" data-do="cut" style="width:100%">✅ سجّل القطع</button></div>'};
function skMqInfo(it,x){const w=skWasteSum(30,it.id),zs=skSizes(it),on=skSzOn(it);let a='';
  if(on){const o=stkAll().get(it.id);a='<div class="mute" style="margin-top:4px">📏 حوالي '+fq(rd2(x.bal*skArea(it)))+' م²</div><div class="skzl">'+zs.map(z=>{const c=o&&o.zs&&o.zs.get(z.id),n=c?rd2(c.n):0;return'<div class="skzi'+(n<=0.0005?' z0':'')+'"><span class="num">'+skZN(z)+'</span><b class="num">'+fq(n)+'</b><small>لوح · '+fq(rd2(n*skZA(z)))+' م²</small></div>'}).join('')+'</div>'}
  else if(zs.length)a='<div class="skbn">📏 عندك '+zs.length+' مقاسات متسجلة. دوس «✍️ عدّ» واكتب عدد كل مقاس (جرد افتتاحي) علشان يبقى لكل مقاس رصيد.</div>';
  return a+(w.m>0?'<div class="mute">🗑 هادر آخر 30 يوم: '+fq(w.m)+' م²'+(w.v?' (حوالي '+f(w.v)+' ج)':'')+'</div>':'')}
function skCut(it){const m=skMsg,n=rd2(nv($('skCn').value)||0),q=eq3(n),cur=stkAll().get(it.id),have=cur?cur.bal:0,ts=Date.now(),note=$('skNote').value.trim();
  if(!(n>0)){m('اكتب عدد الألواح');return}
  if(q>have+1e-9){m(have>0?'⚠️ عندك '+f(sk1(have))+' لوح بس':'⚠️ مفيش رصيد. اعمل «عدّ» الأول');return}
  const area=n*skArea(it),wm0=nv($('skWm').value),wp=nv($('skWp').value),wm=wm0>0?wm0:(wp>0?rd2(area*wp/100):0),rid=$('skRd').value,rn=rd2(nv($('skRn').value)),rdIt=rid&&S.items.find(v=>v.id===rid);
  if(rid&&!(rn>0)){m('اكتب عدد القطع الجاهزة اللي طلعت');return}
  const cutId=uid();skPush({id:cutId,iid:it.id,ts,q:-q,t:'out',why:'قطّعت',...(wm>0?{w:{m:wm,...(wp>0&&!(wm0>0)?{p:wp}:{})}}:{}),...(rdIt?{rd:rid,rn}:{}),...(note?{note}:{})});
  let msg='✅ اتسجل قطع '+fq(n)+' لوح';
  if(rdIt){const unit=skCost(it)>0?rd2(q*skCost(it)/rn):0;skPush({id:uid(),iid:rid,ts,q:rn,t:'in',why:'من قطع',lk:cutId,...(unit?{cost:unit}:{})});if(unit&&+rdIt.cp!==unit){rdIt.cp=unit;put('items',rdIt)}msg+=' · دخل جاهز '+fq(rn)+(unit?' (القطعة بـ'+f(unit)+')':'')}
  if(wm>0)msg+=' · هادر '+fq(wm)+' م²';stkAct=null;skOne();skMsg(msg)}
/* v344: قطع في وضع المقاسات: اللي اتباع بيتخصم من الفواتير، وده بيشيل «الباقي» من اللوح: هادر + فضلة بتدخل مقاس جديد */
function skCutSz(it){const m=skMsg,szs=skSizes(it),z=szs.find(v=>v.id===($('skCz')||{}).value),n=rd2(nv($('skCn').value)||1),ts=Date.now(),note=$('skNote').value.trim();
  if(!z){m('اختار مقاس اللوح');return}
  const cur=stkAll().get(it.id),have=cur&&cur.zs&&cur.zs.get(z.id)?cur.zs.get(z.id).n:0,area=n*skZA(z),wm0=nv($('skWm').value),wp=nv($('skWp').value),wm=wm0>0?wm0:(wp>0?rd2(area*wp/100):0);
  const rw=nv($('skRw').value),rh=nv($('skRh').value),rc=rd2(nv($('skRc').value)||1),rem=rw>0&&rh>0?rd2(rw*rh/1e4*rc):0;
  if(!(wm>0)&&!(rem>0)){m('اكتب الهادر أو الفضلة (واحد على الأقل)');return}
  const take=rd3((wm+rem)/skZA(z));if(take>have+1e-6){m('⚠️ الباقي من المقاس ده '+fq(rd2(have))+' لوح بس ('+fq(rd2(have*skZA(z)))+' م²)، والهادر+الفضلة '+fq(rd2(wm+rem))+' م²');return}
  const cutId=uid();skPush({id:cutId,iid:it.id,ts,q:-take,t:'out',why:'قطّعت',sz:z.id,cn:n,...(wm>0?{w:{m:wm,...(wp>0&&!(wm0>0)?{p:wp}:{})}}:{}),...(note?{note}:{})});
  let msg='✅ اتسجل';if(wm>0)msg+=' · هادر '+fq(wm)+' م²';
  if(rem>0){let zr=szs.find(v=>(+v.w===rw&&+v.h===rh)||(+v.w===rh&&+v.h===rw));if(!zr){zr={id:uid(),w:rw,h:rh,c:0};skSet(it,{sizes:[...skInv(it).sizes,zr]})}
    const cp=skCpm(it),unit=cp>0?rd2(cp*skZA(zr)):0;skPush({id:uid(),iid:it.id,ts,q:rc,t:'in',why:'فضلة',sz:zr.id,lk:cutId,...(unit?{cost:unit}:{})});msg+=' · فضلة '+skZN(zr)+' ×'+fq(rc)+' دخلت المخزن'}
  stkAct=null;skOne();skMsg(msg)}
/* عدّ بالمقاسات: افتتاحي (أول مرة) أو تعديل رصيد كل مقاس */
function skSzCount(it,pairs){const ts=Date.now(),on=skSzOn(it);let n=0;
  if(!on){skSet(it,{szOn:true,szT:ts});skSizes(it).forEach(z=>{const p=pairs.find(v=>v.id===z.id),q=p?rd2(p.n):0;skPush({id:uid(),iid:it.id,ts,q,t:'adj',why:'جرد افتتاحي',sz:z.id});n++});return n}
  const cur=stkAll().get(it.id),zs=cur&&cur.zs;pairs.forEach(p=>{const have=zs&&zs.get(p.id)?zs.get(p.id).n:0,d=rd3(rd2(p.n)-have);if(Math.abs(d)>=0.001){skPush({id:uid(),iid:it.id,ts,q:d,t:'adj',why:'جرد',sz:p.id});n++}});return n}
function skSzDo(k,it){const szs=skSizes(it),m=skMsg,ts=Date.now(),note=$('skNote')?$('skNote').value.trim():'',cur=stkAll().get(it.id);
  if(k==='cnt'){const pairs=szs.map(z=>({id:z.id,v:(skQz('.skzn',z.id)||{}).value})).filter(l=>String(l.v||'').trim()!=='').map(l=>({id:l.id,n:nv(l.v)}));
    if(!pairs.length){m('اكتب عدد من مقاس واحد على الأقل');return}
    const on=skSzOn(it),n=skSzCount(it,pairs);if(on&&!n){m('✅ الأرقام مطابقة');return}
    stkAct=null;skOne();skMsg(on?'✅ اتعدّلت أرصدة '+n+' مقاس':'✅ بدأ الرصيد لكل مقاس. من دلوقتي الدخول والصرف والقطع بالمقاس');return}
  if(k==='out'){const z=szs.find(v=>v.id===$('skOz').value),q=rd2(nv($('skQty').value)),have=cur&&cur.zs&&z&&cur.zs.get(z.id)?cur.zs.get(z.id).n:0;
    if(!z||!(q>0)){m('اختار المقاس واكتب العدد');return}if(q>have+1e-9){m('⚠️ عندك '+fq(rd2(have))+' لوح بس من '+skZN(z));return}
    skPush({id:uid(),iid:it.id,ts,q:-q,t:'out',why:stkRs,sz:z.id,...(note?{note}:{})});stkAct=null;skOne();skMsg('✅ اتصرف '+fq(q)+' لوح '+skZN(z));return}
  /* in */
  const T=skZTot(it,szs);if(!T.L.length){m('اكتب عدد الألواح');return}
  const sid=$('skSup').value,s=sid&&S.suppliers.find(y=>y.id===sid),tc=T.tc,ids=[],o=s&&tc>0?{id:uid(),sid,ts,type:'buy',amt:tc,note:skTx(it)+' · '+T.L.map(l=>skZN(l.z)+' ×'+fq(l.n)).join('، '),iid:it.id,sks:ids}:null;
  T.L.forEach(l=>{const st={id:uid(),iid:it.id,ts,q:l.n,t:'in',sz:l.z.id,...(l.c?{cost:l.c}:{}),...(s?{sid}:{}),...(o?{pk:o.id}:{}),...(note?{note}:{})};ids.push(st.id);skPush(st)});
  let msg='✅ دخل '+T.L.map(l=>skZN(l.z)+' ×'+fq(l.n)).join('، ')+' (حوالي '+fq(T.m2)+' م²)';
  if(o){const add=[o];if($('skPaid').checked)add.push({id:uid(),sid,ts,type:'pay',amt:o.amt,how:'كاش',note:'سداد '+o.note,pf:o.id});else if(s.terms>0)o.due=ts+s.terms*SKD;add.forEach(y=>{S.purchases.push(y);put('purchases',y)});msg+=' · اتسجل على '+s.name+(add.length>1?' واتدفع':' ('+f(o.amt)+')')}
  skAfterIn(it,T.L.map(l=>({z:l.z,c:l.c})),sid);stkAct=null;skOne();skMsg(msg)}
/* بعد أي دخول بسعر: آخر سعر كل مقاس، وسعر المتر (آخر شراء) وسعر شراء الصنف للربح */
function skAfterIn(it,L,sid){const inv0=skInv(it),priced=L.filter(l=>l.c>0);const nz=(inv0.sizes||[]).map(z=>{const l=priced.find(v=>v.z.id===z.id);return l?{...z,c:l.c}:z});
  const last=priced[priced.length-1],cpm=last?last.c/skZA(last.z):0;skSet(it,{...(cpm?{cpm:Math.round(cpm*100)/100,cost:Math.round(cpm*skArea(it)*100)/100}:{}),...(sid?{sid}:{}),sizes:nz});if(cpm>0){it.cp=Math.round(cpm*100)/100;put('items',it)}}
function skOne(){const x=skInfo().find(y=>y.it.id===stkId);if(!x){stkV='home';drawStk();return}
  const it=x.it,inv=skInv(it),mv=skMovesOf(it.id,stkAll(),skSales()),lastIn=mv.find(y=>!y.inv&&y.q>0&&y.t!=='adj'),brk=S.stock.filter(y=>y.iid===it.id&&y.why==='اتكسر'&&Date.now()-y.ts<=30*SKD).reduce((a,y)=>a-y.q,0);
  const sT={out:'❌ خلص',low:'⚠️ قرب يخلص (الحد '+skMnTx(it,x)+')',idle:'🕸 راكد من أكتر من شهرين',ok:'✅ تمام',new:'لسه ما اتسجلش رصيد. اضغط «✍️ عدّ» واكتب اللي عندك'}[x.st];
  const sups=S.suppliers.slice().sort((a,b)=>a.name.localeCompare(b.name,'ar')),so=(sel)=>'<option value="">من غير مورد</option>'+sups.map(s=>`<option value="${esc(s.id)}"${s.id===sel?' selected':''}>${esc(s.name)}</option>`).join('');
  let form='';const szs=it.type==='mq'?skSizes(it):[],sz=szs.length>0,on=sz&&skSzOn(it),xo=on?stkAll().get(it.id):null;
  if(sz&&!on&&stkAct&&stkAct!=='cnt')form='<div class="skf"><div class="mute">ابدأ الأول بالجرد الافتتاحي: دوس «✍️ عدّ» واكتب عدد كل مقاس.</div></div>';
  else if(stkAct==='in'&&on)form=skFormIn(it,szs,so,inv);
  else if(stkAct==='cnt'&&sz)form=skFormCnt(it,szs,x,on);
  else if(stkAct==='out'&&on)form=skFormOut(it,szs,xo);
  else if(stkAct==='cut'&&it.type==='mq')form=on?skFormCutSz(it,szs,xo):skFormCut(it,szs,x);
  else if(stkAct==='in')form=`<div class="skf"><div class="rowc"><input id="skQty" inputmode="decimal" placeholder="الكمية" autocomplete="off" aria-label="الكمية"><input id="skCost" inputmode="decimal" placeholder="سعر الوحدة" value="${skCost(it)||''}" autocomplete="off" aria-label="سعر الوحدة"></div><div class="spc">${[1,5,10,20,50].map(n=>`<button type="button" data-qq="${n}">${n}</button>`).join('')}</div><select id="skSup" aria-label="المورد">${so(inv.sid)}</select><label class="opt"><input type="checkbox" id="skPaid"> دفعت كاش دلوقتي (بيتسجل في حساب المورد)</label><input id="skNote" placeholder="ملاحظة (اختياري)" autocomplete="off" aria-label="ملاحظة"><div class="mute" id="skTot"></div><button type="button" class="main" data-do="in" style="width:100%">✅ سجّل الدخول</button></div>`;
  else if(stkAct==='out')form=`<div class="skf"><input id="skQty" inputmode="decimal" placeholder="الكمية" autocomplete="off" aria-label="الكمية"><div class="spc">${SKR.map(([k,l])=>`<button type="button" data-rs="${k}"${k===stkRs?' class="on"':''}>${l}</button>`).join('')}</div><input id="skNote" placeholder="ملاحظة (اختياري)" autocomplete="off" aria-label="ملاحظة"><button type="button" class="main" data-do="out" style="width:100%">✅ سجّل الصرف</button></div>`;
  else if(stkAct==='cnt')form=`<div class="skf"><input id="skQty" inputmode="decimal" placeholder="اللي عندك فعلاً دلوقتي" autocomplete="off" aria-label="الرصيد الفعلي"><div class="mute">البرنامج شايف ${f(x.bal)} ${skUn(it)}. اللي هتكتبه هو اللي هيبقى الرصيد، والفرق بيتسجل حركة جرد.</div><button type="button" class="main" data-do="cnt" style="width:100%">✅ اعتمد العدّ</button></div>`;
  skSub(skBack+`<div class="card spd"><div class="sph"><span class="spn2">${skNm(it)}</span><span class="spb"><small>عندك</small><span class="num">${x.tr?(on?fq(rd2(x.bal*skArea(it)))+' م²':f(x.bal)+' '+skUn(it)):'—'}</span></span></div>
  <div class="spdue${x.st==='ok'?' hide':''}">${sT}</div>
  ${it.type==='mq'?(k=>`<div class="mute" style="margin-top:4px">📐 اللوح ${skSheet(it).join('×')} سم. بيتخصم منه لوحده: المتر من الفواتير${k.length?'، والجاهز ('+k.map(q=>esc(szOf(q)||q.name)+': '+skYield(q,it)+' في اللوح').join('، ')+')':''}.</div>`)(skKids(it)):''}
  ${it.type==='mq'?skMqInfo(it,x):''}
  <div class="spst"><div><small>اتصرف 30 يوم</small><span class="num">${f(x.use)}</span></div><div><small>يكفي</small><span class="num">${x.left!=null?x.left+' يوم':'—'}</span></div><div><small>قيمته</small><span class="num">${skCost(it)&&x.bal>0?f(Math.round(x.val)):'—'}</span></div><div><small>آخر دخول</small><span class="num">${lastIn?dshort(lastIn.ts).slice(5):'—'}</span></div></div>
  ${brk?`<div class="mute" style="margin-top:4px">💥 اتكسر آخر 30 يوم: ${f(brk)} ${skUn(it)}${skCost(it)?' (خسارة '+f(Math.round(brk*skCost(it)))+')':''}</div>`:''}
  <div class="spc" style="margin:8px 0 4px"><button type="button" data-ac="in"${stkAct==='in'?' class="on"':''}>➕ دخل</button><button type="button" data-ac="out"${stkAct==='out'?' class="on"':''}>➖ صرف</button><button type="button" data-ac="cnt"${stkAct==='cnt'?' class="on"':''}>✍️ عدّ</button>${it.type==='mq'?'<button type="button" data-ac="cut"'+(stkAct==='cut'?' class="on"':'')+'>🔨 قطّعت</button>':''}</div>${form}<div class="info" id="skMsg" aria-live="polite"></div></div>
  <details class="card spdt"><summary>⚙️ إعدادات الصنف</summary><div class="g2" style="margin-top:6px"><div><label for="skMn">حد التنبيه${on?' (م²)':''}</label><input id="skMn" inputmode="decimal" placeholder="${on?fq(rd2(stkMin()*skArea(it))):f(stkMin())} (العام)" value="${on?(inv.mnm>0?inv.mnm:''):(inv.mn!=null&&inv.mn!==''?inv.mn:'')}" autocomplete="off"></div><div><label for="skCs">سعر الشراء</label><input id="skCs" inputmode="decimal" value="${inv.cost||''}" autocomplete="off"></div></div><div class="g2"><div><label for="skLc">المكان (رف / مخزن)</label><input id="skLc" value="${esc(inv.loc||'')}" autocomplete="off"></div><div><label for="skSs">المورد المعتاد</label><select id="skSs">${so(inv.sid)}</select></div></div>${it.type==='mq'?`<label style="margin-top:6px">📐 مقاس اللوح (سم)</label><div class="g2"><input id="skSw" inputmode="decimal" value="${skSheet(it)[0]}" aria-label="عرض اللوح"><input id="skSh" inputmode="decimal" value="${skSheet(it)[1]}" aria-label="طول اللوح"></div>${skSizesUI(it)}${skKids(it).length?'<label>اللوح بيطلع كام حتة من كل مقاس جاهز</label>'+skKids(it).map(q=>`<div class="ro" style="gap:6px;margin:2px 0"><span style="flex:1">${skNm(q)}</span><input class="sky" data-id="${esc(q.id)}" inputmode="numeric" value="${skYield(q,it)}" aria-label="عدد الحتت في اللوح" style="width:64px;flex:none;text-align:center"></div>`).join('')+'<div class="mute">الرقم بيتحسب لوحده من المقاس. لو الحقيقي غير كده عدّله.</div>':''}`:''}<button type="button" class="main" data-do="set" style="width:100%;margin-top:6px">💾 حفظ الإعدادات</button></details>
  <div class="card" style="padding:6px 8px"><div class="mute" style="margin:2px 4px">🕘 حركات الصنف</div><table class="xl">${mv.length?mv.slice(0,40).map(y=>skMvRow(y,false)).join(''):'<tr><td class="tn mute">مفيش حركات لسه.</td></tr>'}</table></div>`)}
function skCnt(){const A=skInfo().sort((a,b)=>(b.tr-a.tr)||a.it.name.localeCompare(b.it.name,'ar'));
  skSub(skBack+`<div class="seg s" id="cntTy" style="margin:0 0 6px"><button type="button" data-cty="rd" class="${stkTy==='rd'?'on':''}">📦 جاهز <small>${A.filter(x=>x.it.type==='rd').length}</small></button><button type="button" data-cty="mq" class="${stkTy==='mq'?'on':''}">✂️ ألواح ومقطع <small>${A.filter(x=>x.it.type==='mq').length}</small></button></div><div class="card" style="padding:6px 8px"><table class="xl"><tr><th>الصنف</th><th>في البرنامج</th><th>الفعلي</th></tr>${A.length?(stkTy==='mq'?['mq','rd']:['rd','mq']).map(ty=>{const GL=A.filter(x=>x.it.type===ty);return GL.length?'<tbody class="skg'+(ty===stkTy?'':' hide')+'" data-g="'+ty+'">'+GL.map(x=>`<tr><td class="tn">${skNm(x.it)}</td><td class="num">${x.tr?f(x.bal):'—'}</td><td class="tq">${x.it.type==='mq'&&skSizes(x.it).length?'<small class="mute">'+(skSzOn(x.it)?'عدّ المقاسات ↓':'جرد افتتاحي ↓')+'</small>':`<input class="skc" data-id="${esc(x.it.id)}" inputmode="decimal" autocomplete="off" aria-label="الفعلي"${x.it.type==='mq'?' placeholder="ألواح"':''}>`}</td></tr>${x.it.type==='mq'?skSizes(x.it).map(z=>{const o=skSzOn(x.it)?stkAll().get(x.it.id):null,c=o&&o.zs&&o.zs.get(z.id);return`<tr class="skcr"><td class="tn"><small>↳ مقاس ${skZN(z)}</small></td><td class="mute"><small>${c?'لوح ('+fq(rd2(c.n))+')':'لوح'}</small></td><td class="tq"><input class="skcz" data-par="${esc(x.it.id)}" data-z="${esc(z.id)}" inputmode="decimal" autocomplete="off" aria-label="ألواح ${skZN(z)}"></td></tr>`}).join(''):''}`).join('')+'</tbody>':''}).join(''):'<tr><td class="tn mute">مفيش أصناف.</td></tr>'}</table></div><button type="button" class="main" data-do="apply" style="width:100%">✅ اعتمد الجرد</button><div class="info" id="skMsg" aria-live="polite"></div>`)}
function skOrdTx(sid){const l=[...document.querySelectorAll('#stkSub .sko[data-s="'+sid+'"]')].map(i=>{const q=rd2(nv(i.value)),it=S.items.find(y=>y.id===i.dataset.id);return q>0&&it?'- '+skTx(it)+' × '+f(q):''}).filter(Boolean);return l.length?'محتاج الأصناف دي:\n'+l.join('\n'):''}
function skOrd(){const A=skInfo().filter(x=>x.st==='low'||x.st==='out'),g=new Map();A.forEach(x=>{const k=skInv(x.it).sid&&S.suppliers.some(s=>s.id===skInv(x.it).sid)?skInv(x.it).sid:'';(g.get(k)||g.set(k,[]).get(k)).push(x)});
  skSub(skBack+(A.length?[...g.entries()].sort((a,b)=>!a[0]-!b[0]).map(([sid,l])=>{const s=S.suppliers.find(y=>y.id===sid);return`<div class="card"><div class="ro" style="color:var(--ink)"><span>${s?'🚚 '+esc(s.name):'📦 من غير مورد محدد'}</span></div><table class="xl">${l.map(x=>`<tr><td class="tn">${skNm(x.it)}<br><small class="mute">${x.st==='out'?'❌ خلص':'عندك '+f(x.bal)}</small></td><td class="tq"><input class="sko" data-s="${esc(sid)}" data-id="${esc(x.it.id)}" inputmode="decimal" value="${Math.max(1,Math.ceil(x.mn*2-x.bal))}" aria-label="الكمية المطلوبة"></td></tr>`).join('')}</table><div class="spact" style="margin-top:6px">${s&&waNum(s.phone)?`<button type="button" class="alt" data-og="${esc(sid)}">📲 ابعت واتساب</button>`:''}<button type="button" class="alt" data-oc="${esc(sid)}">📋 انسخ القايمة</button></div></div>`}).join(''):'<div class="card mute">✅ مفيش حاجة ناقصة دلوقتي.</div>')+'<div class="mute" style="margin:4px 2px">الكميات المقترحة تكفي ضعف حد التنبيه. عدّلها قبل ما تبعت.</div><div class="info" id="skMsg" aria-live="polite"></div>')}
let stkWM=0;
/* v344: هادر كل نوع في الشهر: متر ونسبة وفلوس */
function skWst(){const d=new Date(),a=new Date(d.getFullYear(),d.getMonth()-stkWM,1).getTime(),b=new Date(d.getFullYear(),d.getMonth()-stkWM+1,1).getTime(),mx=wasteMax();
  const R=S.items.filter(i=>i.type==='mq').map(it=>{const w=skWasteRange(a,b,it.id),u=skUseArea(it,a,b),t=rd2(u+w.m);return{it,w,u,p:t>0?Math.round(w.m/t*100):0}}).filter(r=>r.w.m>0||r.u>0).sort((x,y)=>y.w.v-x.w.v||y.u-x.u);
  const T=R.reduce((s,r)=>({m:rd2(s.m+r.w.m),v:s.v+r.w.v,u:rd2(s.u+r.u)}),{m:0,v:0,u:0}),tp=T.u+T.m>0?Math.round(T.m/(T.u+T.m)*100):0;
  skSub(skBack+'<div class="card"><div class="ro" style="gap:6px"><button type="button" class="alt" data-wm="1" style="flex:none">→ الشهر اللي قبله</button><b style="flex:1;text-align:center">'+MN[new Date(a).getMonth()]+' '+new Date(a).getFullYear()+'</b><button type="button" class="alt" data-wm="-1" style="flex:none"'+(stkWM<=0?' disabled':'')+'>الشهر اللي بعده ←</button></div>'+(R.length?'<table class="xl"><tr><th>النوع</th><th>اتباع م²</th><th>هادر م²</th><th>%</th><th>خسارة</th></tr>'+R.map(r=>'<tr><td class="tn">'+esc(r.it.name)+'</td><td class="num">'+fq(r.u)+'</td><td class="num">'+fq(r.w.m)+'</td><td class="num'+(r.p>mx?' dn':'')+'">'+(r.w.m>0?r.p+'%':'—')+'</td><td class="num">'+(r.w.v?f(r.w.v):'—')+'</td></tr>').join('')+'<tr><td class="tn"><b>الإجمالي</b></td><td class="num">'+fq(T.u)+'</td><td class="num">'+fq(T.m)+'</td><td class="num">'+(T.m>0?tp+'%':'—')+'</td><td class="num"><b>'+f(T.v)+'</b></td></tr></table><div class="mute" style="font-size:12px;margin-top:4px">النسبة = الهادر ÷ (اللي اتباع + الهادر). الهادر بيتسجل من «🔨 قطّعت» في صفحة الصنف، وخسارته بسعر المتر (آخر شراء). الحد '+mx+'%.</div>':'<div class="mute" style="margin-top:8px">مفيش هادر ولا مبيعات ألواح في الشهر ده.</div>')+'</div>')}
function skMv(){const m=stkAll(),sal=skSales(),a=S.stock.filter(x=>m.has(x.iid)),s=[];sal.forEach((l,id)=>{const o=m.get(id);l.forEach(x=>{if(o&&x.ts>=o.from)s.push(x)})});
  const T=x=>x.inv?'sale':x.t==='adj'?'adj':x.q>0?'in':'out',all=a.concat(s).sort((x,y)=>y.ts-x.ts),l=all.filter(x=>stkMF==='all'||T(x)===stkMF).slice(0,80);
  skSub(skBack+`<div class="spc">${[['all','الكل'],['in','➕ دخل'],['out','➖ صرف'],['adj','⚖️ جرد'],['sale','🧾 بيع']].map(([k,t])=>`<button type="button" data-mf="${k}"${k===stkMF?' class="on"':''}>${t}</button>`).join('')}</div><div class="card" style="padding:6px 8px"><table class="xl">${l.length?l.map(x=>skMvRow(x,true)).join(''):'<tr><td class="tn mute">مفيش حركات.</td></tr>'}</table></div>`)}
function drawStk(){try{skDraw0()}finally{try{skTopVis();if(stkV==='home')skTopDraw()}catch(e){}}}
function skDraw0(){if(stkV==='rcv')skRcv();else if(stkV==='home'){skSub('');skHome()}else if(stkV==='one')skOne();else if(stkV==='cnt')skCnt();else if(stkV==='ord')skOrd();else if(stkV==='mv')skMv();else if(stkV==='wst')skWst();else{stkV='home';skSub('');skHome()}}
$('stkQ').oninput=drawStk;
$('stkWmax').onchange=e=>{svk('wasteMax',String(Math.max(1,nv(e.target.value)||15)));drawStk()};
$('stkLim').onchange=e=>{svk('stkMin',String(Math.max(0,nv(e.target.value))));drawStk()};
function skMsg(t){const e=$('skMsg')||$('stkMsg');if(e)e.textContent=t}
function skPush(o){S.stock.push(o);put('stock',o)}
function skDo(k){const it=S.items.find(i=>i.id===stkId),A=k==='apply'?null:it;
  if(k==='set'){{const mv=$('skMn').value.trim()===''?null:Math.max(0,nv($('skMn').value));if(skSzOn(it)){skSet(it,{mnm:mv})}else skSet(it,{mn:mv})}skSet(it,{cost:$('skCs').value.trim()===''?null:Math.max(0,nv($('skCs').value)),loc:$('skLc').value.trim()||null,sid:$('skSs').value||null});if(it.type==='mq'&&$('skSw')){const sw=nv($('skSw').value),sh=nv($('skSh').value);skSet(it,{sw:sw>0&&sw!==SKSW?sw:null,sh:sh>0&&sh!==SKSH?sh:null});if(!skSzSave(it))return;document.querySelectorAll('#stkSub .sky').forEach(i=>{const k=S.items.find(y=>y.id===i.dataset.id);if(!k)return;const v=Math.round(nv(i.value));skSet(k,{y:v>0&&v!==skYieldAuto(k,it)?v:null})})}stkAct=null;skOne();skMsg('✅ اتحفظت إعدادات الصنف');return}
  if(k==='apply'){const m=stkAll();let n=0;document.querySelectorAll('#stkSub .skc').forEach(i=>{if(i.value.trim()==='')return;const ex=[...document.querySelectorAll('#stkSub .skcp')].filter(p=>p.dataset.par===i.dataset.id).reduce((s,p)=>s+(nv(p.value)||0)/(+p.dataset.y||1),0),a=Math.max(0,rd2(nv(i.value)+ex)),o=m.get(i.dataset.id),d=rd2(a-(o?o.bal:0));if(d!==0){skPush({id:uid(),iid:i.dataset.id,ts:Date.now(),q:d,t:'adj',why:'جرد'});n++}});
    {const par=new Set([...document.querySelectorAll('#stkSub .skcz')].map(p=>p.dataset.par));par.forEach(pid=>{const it=S.items.find(x=>x.id===pid);if(!it)return;const pairs=[...document.querySelectorAll('#stkSub .skcz')].filter(p=>p.dataset.par===pid&&p.value.trim()!=='').map(p=>({id:p.dataset.z,n:nv(p.value)||0}));if(!pairs.length)return;if(skSzCount(it,pairs))n++})}
    if(!n){skMsg('مفيش فرق. كله مطابق أو لسه ما كتبتش أرقام');return}stkV='home';drawStk();toast('✅ الجرد اتعتمد · اتعدّل '+plN(n,'صنف'));return}
  if(it&&it.type==='mq'&&skSizes(it).length){if(k==='cut'&&skSzOn(it)){skCutSz(it);return}if(k==='cnt'||(skSzOn(it)&&(k==='in'||k==='out'))){skSzDo(k,it);return}}
  if(k==='cut'&&it&&it.type==='mq'){skCut(it);return}
  const q=rd2(nv($('skQty').value)),cur=stkAll().get(it.id),have=cur?cur.bal:0,note=$('skNote')?$('skNote').value.trim():'',ts=Date.now();
  if(k==='cnt'){if($('skQty').value.trim()===''||q<0){skMsg('اكتب الرصيد الفعلي');return}const d=rd2(q-have);if(!d){skMsg('✅ الرصيد مطابق');return}skPush({id:uid(),iid:it.id,ts,q:d,t:'adj',why:'جرد'});stkAct=null;skOne();skMsg('✅ الرصيد بقى '+f(q)+' '+skUn(it));return}
  if(!(q>0)){skMsg('اكتب الكمية');return}
  if(k==='out'){if(q>have+1e-9){skMsg(have>0?'⚠️ عندك '+f(have)+' '+skUn(it)+' بس، مينفعش تصرف '+f(q):'⚠️ مفيش رصيد. سجّل اللي عندك بـ «جرد» الأول');return}
    skPush({id:uid(),iid:it.id,ts,q:-q,t:'out',why:stkRs,...(note?{note}:{})});stkAct=null;skOne();skMsg('✅ اتصرف '+f(q)+' · بقى عندك '+f(rd2(have-q))+' '+skUn(it));return}
  if(k==='in'){const c=Math.max(0,rd2(nv($('skCost').value))),sid=$('skSup').value,s=sid&&S.suppliers.find(y=>y.id===sid),st={id:uid(),iid:it.id,ts,q,t:'in',...(c?{cost:c}:{}),...(s?{sid}:{}),...(note?{note}:{})};
    let msg='✅ دخل '+f(q)+' '+skUn(it)+' · بقى عندك '+f(rd2(have+q));
    if(s&&c){const o={id:uid(),sid,ts,type:'buy',amt:rd2(q*c),note:skTx(it)+' × '+f(q),iid:it.id,q,sk:st.id};st.pk=o.id;const add=[o];
      if($('skPaid').checked)add.push({id:uid(),sid,ts,type:'pay',amt:o.amt,how:'كاش',note:'سداد '+o.note,pf:o.id});else if(s.terms>0)o.due=ts+s.terms*SKD;
      add.forEach(y=>{S.purchases.push(y);put('purchases',y)});msg+=' · اتسجل على '+s.name+(add.length>1?' واتدفع':' ('+f(o.amt)+')')}
    skPush(st);skSet(it,{...(c?{cost:c}:{}),...(sid?{sid}:{})});stkAct=null;skOne();skMsg(msg)}}
$('stkPanel').addEventListener('click',e=>{const t=e.target;let b;
  if(t.closest('[data-szx]')){t.closest('.skszr').remove();return}
  if(b=t.closest('[data-sz]')){const w=$('skSzs');if(w)w.insertAdjacentHTML('beforeend',skSzRow({id:uid(),w:'',h:'',c:''}));return}
  if(b=t.closest('[data-cty]')){stkTy=b.dataset.cty;document.querySelectorAll('#cntTy button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('#stkSub tbody.skg').forEach(x=>x.classList.toggle('hide',x.dataset.g!==stkTy));return}
  if(b=t.closest('[data-sty]')){stkTy=b.dataset.sty;stkF='all';drawStk();return}
  if(b=t.closest('[data-sf]')){stkF=b.dataset.sf;drawStk();return}
  if(b=t.closest('[data-sg]')){const k=b.dataset.sg;if(k==='rcAdd'){skRc.lines.push(rcNew());skRcv();{const r=document.querySelectorAll('#rcRows .row'),l=r[r.length-1],i=l&&l.querySelector('.rcN');if(i){i.focus();try{l.scrollIntoView({block:'center'})}catch(e){}}}return}if(k==='one'){stkId=b.dataset.id;stkAct=null}stkV=k;drawStk();$('stkPanel').scrollIntoView({block:'start'});return}
  if(b=t.closest('[data-ac]')){stkAct=stkAct===b.dataset.ac?null:b.dataset.ac;skOne();return}
  if(b=t.closest('[data-qq]')){const i=$('skQty');i.value=rd2((nv(i.value)||0)+ +b.dataset.qq);i.dispatchEvent(new Event('input'));return}
  if(b=t.closest('[data-rs]')){stkRs=b.dataset.rs;t.closest('.spc').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));return}
  if(b=t.closest('[data-wm]')){stkWM=Math.max(0,stkWM+(+b.dataset.wm));skWst();return}
  if(b=t.closest('[data-mf]')){stkMF=b.dataset.mf;skMv();return}
  if(b=t.closest('[data-do]')){if(b.dataset.do==='rcv')skRcSave();else skDo(b.dataset.do);return}
  if(b=t.closest('[data-og]')){const s=S.suppliers.find(y=>y.id===b.dataset.og),tx=skOrdTx(b.dataset.og);if(!s||!tx){skMsg('اكتب كمية لصنف واحد على الأقل');return}window.open('https://wa.me/'+waNum(s.phone)+'?text='+encodeURIComponent(tx),'_blank','noopener');return}
  if(b=t.closest('[data-oc]')){const tx=skOrdTx(b.dataset.oc);if(!tx){skMsg('اكتب كمية لصنف واحد على الأقل');return}(navigator.clipboard?navigator.clipboard.writeText(tx):Promise.reject()).then(()=>skMsg('✅ اتنسخت القايمة'),()=>skMsg('معرفتش أنسخ. اكتبها بإيدك'));return}
  if(b=t.closest('[data-skd]')){const x=S.stock.find(y=>y.id===b.dataset.skd);if(!x)return;{const o=stkAll().get(x.iid);if(x.q>0&&o&&o.bal-x.q<-1e-9){toast('⚠️ مينفعش تمسح الدخول ده: الرصيد هيبقى بالسالب. امسح الحركات اللي بعده الأول');return}}if(!ok2(b))return;const pk=S.purchases.filter(y=>y.sk===x.id),mp=S.purchases.find(y=>(y.sks||[]).includes(x.id)&&y.sks.length>1),old=mp&&{...mp},rel0=S.purchases.filter(y=>mp&&y.pf===mp.id).map(y=>({...y})),mp1=S.purchases.find(y=>(y.sks||[]).includes(x.id)&&y.sks.length===1);if(mp1)pk.push(mp1);const rel=S.purchases.filter(y=>pk.some(p=>p.id===y.pf));
    const lkd=S.stock.filter(y=>y.lk===x.id);lkd.forEach(y=>del('stock',y.id));del('stock',x.id);
    if(mp){const d=x.tc!=null?x.tc:rd2((+x.q||0)*(+x.cost||0));mp.sks=mp.sks.filter(k=>k!==x.id);mp.amt=Math.max(0,rd2(mp.amt-d));put('purchases',mp);S.purchases.filter(y=>y.pf===mp.id).forEach(y=>{y.amt=mp.amt;put('purchases',y)})}
    [...pk,...rel].forEach(y=>del('purchases',y.id));drawStk();toast('اتمسحت الحركة'+(pk.length?' ومعاها شراء المورد':mp?' واتخصمت من شراء المورد':''),'تراجع',()=>{undel('stock',x);lkd.forEach(y=>undel('stock',y));[...pk,...rel].forEach(y=>undel('purchases',y));if(mp){Object.assign(mp,old);put('purchases',mp);rel0.forEach(o=>{const y=S.purchases.find(z=>z.id===o.id);if(y){Object.assign(y,o);put('purchases',y)}})}drawStk()})}});
$('stkPanel').addEventListener('change',e=>{if(e.target.id!=='skPm')return;const it=S.items.find(i=>i.id===stkId);if(!it)return;skSizes(it).forEach(z=>{const i=skQz('.skzc',z.id);if(!i||!i.value)return;const v=nv(i.value);i.value=e.target.checked?String(Math.round(v/skZA(z)*100)/100):String(Math.round(v*skZA(z)*100)/100)});const t=$('skTot');if(t)t.textContent=''});
$('stkPanel').addEventListener('input',e=>{if(e.target.classList&&(e.target.classList.contains('skzn')||e.target.classList.contains('skzc')||e.target.id==='skPm')){const it=S.items.find(i=>i.id===stkId),t=$('skTot');if(!it||!t)return;const T=skZTot(it,skSizes(it));t.textContent=T.L.length?'حوالي '+fq(T.m2)+' م²'+(T.tc>0?' · الإجمالي '+f(T.tc)+(T.m2>0?' · المتر بـ'+f(Math.round(T.tc/T.m2*100)/100):''):''):'';return}
  if(e.target.id==='skQty'||e.target.id==='skCost'){const q=rd2(nv(($('skQty')||{}).value)),c=rd2(nv(($('skCost')||{}).value)),t=$('skTot');if(t)t.textContent=q>0&&c>0?'الإجمالي '+f(rd2(q*c)):''}});
/* v367: وصلت بضاعة زي الفاتورة: النوع والسمك + عدد الألواح + الطول × العرض (متر) + سعر المتر. النوع الجديد بيتسجل لوحده، والمقاس بيتسجل ويتعدّ بعدين بالأرقام بس */
const rcNew=()=>({n:'',q:'',w:'',h:'',p:''});
let skRc={sid:'',lines:[rcNew()],pay:'',note:''};
const rcCm=v=>{v=nv(v);return v>0?(v>20?v:v*100):0},rcArea=l=>{const w=rcCm(l.w),h=rcCm(l.h);return w>0&&h>0?w*h/1e4:0},rcLine=l=>{const ar=rcArea(l),q=rd2(nv(l.q)),p=rd2(nv(l.p));return{ar,m2:rd2(ar*q),sheet:rd2(ar*p),tot:rd2(ar*q*p)}};
function skRcTot(){return rd2(skRc.lines.reduce((a,l)=>a+rcLine(l).tot,0))}
const rcRestTx=()=>{const t=skRcTot(),p=Math.min(t,Math.max(0,rd2(nv(skRc.pay))));return t>0?(p>=t?'✅ مدفوع كله':'الباقي على المورد: '+f(rd2(t-p))+(skRc.sid?'':' (اختار المورد علشان يتسجل عليه)')):''};
const rcPrevTx=l=>{const x=rcLine(l);return x.ar>0?'اللوح '+fq(rd2(x.ar))+' م²'+(rd2(nv(l.q))>0?' · '+fq(x.m2)+' م² كلهم':'')+(x.tot>0?' · '+f(x.tot)+' ج':''):''};
function skRcv(){const sups=S.suppliers.slice().sort((a,b)=>a.name.localeCompare(b.name,'ar')),names=S.items.filter(i=>i.type==='mq').map(i=>i.name);
  skSub(skBack+`<div class="card" style="padding:6px 8px"><select id="rcSup" aria-label="المورد (اختياري)" style="margin:0;height:34px"><option value="">🚚 من غير مورد</option>${sups.map(s=>`<option value="${esc(s.id)}"${s.id===skRc.sid?' selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
  <datalist id="rcNames">${names.map(n=>'<option value="'+esc(n)+'">').join('')}</datalist>
  <div class="card" id="rcW"><div id="rcHd" class="c5"><span>الصنف</span><span>عرض</span><span>طول</span><span>عدد</span><span>سعر المتر</span><span class="hv"><b class="hv-t">القيمة</b></span></div><div id="rcRows">${skRc.lines.map((l,i)=>`<div class="row rcl" data-i="${i}"><div class="rg c5"><input class="rcN" list="rcNames" placeholder="النوع والسمك" value="${esc(l.n)}" autocomplete="off" aria-label="النوع والسمك"><input class="rcW" type="text" inputmode="decimal" placeholder="عرض" value="${esc(l.w)}" autocomplete="off" aria-label="العرض بالمتر"><input class="rcH" type="text" inputmode="decimal" placeholder="طول" value="${esc(l.h)}" autocomplete="off" aria-label="الطول بالمتر"><input class="rcQ" type="text" inputmode="decimal" placeholder="عدد" value="${esc(l.q)}" autocomplete="off" aria-label="عدد الألواح"><input class="rcP" type="text" inputmode="decimal" placeholder="سعر" value="${esc(l.p)}" autocomplete="off" aria-label="سعر المتر"></div><span class="vc"><b class="val num rcVal">${rcLine(l).tot?f(rcLine(l).tot):''}</b></span><button type="button" class="del" data-rx="${i}" aria-label="حذف">×</button><div class="mute rcv" style="flex:1 0 100%;position:static;font-size:11px;padding:2px 6px;text-align:start${rcPrevTx(l)?'':';display:none'}">${rcPrevTx(l)}</div></div>`).join('')}</div><button type="button" class="alt" data-sg="rcAdd" style="width:100%;margin-top:6px">➕ صنف تاني</button></div>
  <div class="card"><div class="ro" style="color:var(--ink)"><span>الإجمالي</span><span class="num" id="rcTot">${f(skRcTot())}</span></div><div class="ro" style="gap:6px;margin-top:6px"><label for="rcPay" style="flex:none;margin:0">💵 دفعت كاش دلوقتي</label><input id="rcPay" inputmode="decimal" placeholder="0" value="${esc(skRc.pay)}" autocomplete="off" style="flex:1;height:34px;margin:0"><button type="button" class="alt" id="rcAll" style="flex:none;height:34px">كله</button></div><div class="mute" id="rcRest" style="font-size:12px">${rcRestTx()}</div><input id="rcNote" placeholder="ملاحظة (اختياري)" value="${esc(skRc.note)}" autocomplete="off" aria-label="ملاحظة" style="margin-top:4px"><button type="button" class="main" data-do="rcv" style="width:100%;margin-top:6px">✅ سجّل الاستلام</button><div class="info" id="skMsg" aria-live="polite"></div></div>`)}
function skRcSave(){const m=$('skMsg'),s=S.suppliers.find(y=>y.id===skRc.sid)||null;
  const L=skRc.lines.map(l=>({n:String(l.n||'').trim(),q:rd2(nv(l.q)),w:rcCm(l.w),h:rcCm(l.h),p:Math.max(0,rd2(nv(l.p)))})).filter(l=>l.n&&l.q>0);
  if(!L.length){m.textContent='اكتب اسم النوع وعدد الألواح';return}
  {const bad=L.find(l=>!(l.w>0&&l.h>0));if(bad){m.textContent='اكتب طول وعرض اللوح لـ«'+bad.n+'» (بالمتر)';return}}
  const ts=Date.now(),ids=[],notes=[];let tot=0;
  const done=L.map(l=>{let it=S.items.find(i=>i.type==='mq'&&nkey(i.name)===nkey(l.n));if(!it){it={id:uid(),type:'mq',name:l.n,p:0,w:0,h:0};S.items.push(it);put('items',it)}
    let z=skSizes(it).find(v=>(Math.abs(+v.w-l.w)<1&&Math.abs(+v.h-l.h)<1)||(Math.abs(+v.w-l.h)<1&&Math.abs(+v.h-l.w)<1));
    if(!z){z={id:uid(),w:l.w,h:l.h,c:0};skSet(it,{sizes:[...(skInv(it).sizes||[]),z]})}
    if(!skSzOn(it)){const old=S.stock.some(y=>y.iid===it.id),was=old?stkAll().get(it.id):null;skSet(it,{szOn:true,szT:ts});
      if(old&&was&&was.bal>0){skPush({id:uid(),iid:it.id,ts,q:rd2(was.bal),t:'adj',why:'نقل الرصيد القديم',sz:z.id});notes.push('رصيد «'+it.name+'» القديم اتنقل على المقاس ده، راجعه من عدّ المخزن')}}
    const ar=z.w*z.h/1e4,c=rd2(ar*l.p);tot=rd2(tot+c*l.q);return{it,z,q:l.q,c}});
  const o=s&&tot>0?{id:uid(),sid:s.id,ts,type:'buy',amt:tot,note:(skRc.note?skRc.note+' · ':'')+done.map(d=>skTx(d.it)+' '+skZN(d.z)+' × '+f(d.q)).join('، '),sks:ids}:null;
  done.forEach(d=>{const st={id:uid(),iid:d.it.id,ts,q:d.q,t:'in',sz:d.z.id,...(d.c?{cost:d.c}:{}),...(s?{sid:s.id}:{}),...(o?{pk:o.id}:{})};ids.push(st.id);skPush(st);skAfterIn(d.it,[{z:d.z,c:d.c}],s?s.id:'')});
  if(o){const add=[o];const pp=Math.min(tot,Math.max(0,rd2(nv(skRc.pay))));if(pp>0)add.push({id:uid(),sid:s.id,ts,type:'pay',amt:pp,how:'كاش',note:'سداد استلام بضاعة'+(pp<tot?' (جزء)':''),pf:o.id});if(pp<tot&&s.terms>0)o.due=ts+s.terms*SKD;add.forEach(y=>{S.purchases.push(y);put('purchases',y)})}
  skRc={sid:s?s.id:'',lines:[rcNew()],pay:'',note:''};stkV='home';stkTy='mq';drawStk();toast('✅ استلمت '+plN(done.length,'صنف')+(s?' من '+s.name:'')+(tot>0?' · '+f(tot):'')+(notes.length?' · '+notes[0]:''))}
$('stkPanel').addEventListener('input',e=>{const t=e.target,ln=t.closest('.rcl');if(t.id==='rcNote')skRc.note=t.value;if(t.id==='rcPay'){skRc.pay=t.value;const r=$('rcRest');if(r)r.textContent=rcRestTx()}if(!ln||!ln.classList.contains('rcl'))return;const l=skRc.lines[+ln.dataset.i];if(!l)return;
  const K={rcN:'n',rcQ:'q',rcW:'w',rcH:'h',rcP:'p'};for(const k in K)if(t.classList.contains(k))l[K[k]]=t.value;const pv=ln.querySelector('.rcv');if(pv){pv.textContent=rcPrevTx(l);pv.style.display=pv.textContent?'':'none'}const vv=ln.querySelector('.rcVal');if(vv){const x=rcLine(l).tot;vv.textContent=x?f(x):''}const e2=$('rcTot');if(e2)e2.textContent=f(skRcTot());{const r=$('rcRest');if(r)r.textContent=rcRestTx()}});
$('stkPanel').addEventListener('change',e=>{const t=e.target;if(t.id==='rcSup')skRc.sid=t.value;if(t.id==='rcSup'){const r=$('rcRest');if(r)r.textContent=rcRestTx()}});
$('stkPanel').addEventListener('click',e=>{if(e.target.id==='rcAll'){skRc.pay=String(skRcTot());const i=$('rcPay');if(i)i.value=skRc.pay;const r=$('rcRest');if(r)r.textContent=rcRestTx()}});
$('stkPanel').addEventListener('click',e=>{const b=e.target.closest('[data-rx]');if(!b)return;skRc.lines.splice(+b.dataset.rx,1);if(!skRc.lines.length)skRc.lines.push(rcNew());skRcv()});
$('supRcv').onclick=()=>{skRc.sid=supCur||'';stGo('stk');stkV='rcv';drawStk()};
$('stkPanel').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('skr')){e.preventDefault();e.target.click()}});


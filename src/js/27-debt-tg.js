/* ========== 📒 صورة المديونين على تيليجرام (v406) ==========
   كل يوم أول ما البرنامج يتفتح (لو المفتاح شغال وتيليجرام مربوط) بتتبعت صورة فيها كل اللي عليهم فلوس:
   الاسم · عليه كام · آخر دفعة من كام يوم · آخر معاملة، مترتبين من الأكبر. 25 اسم في الصفحة.
   lsv('dbTg') = شغال/لأ · lsv('dbTgSent') = يوم آخر إرسال أوتوماتيك */
var dtgBusy=false;
function dtgList(){const now=Date.now();return S.customers.map(c=>({c,b:balOf(c)})).filter(o=>o.b>0).map(o=>{const l=ledger(o.c),lp=lastPay(o.c),first=l.length?Math.min(...l.map(r=>r.ts)):now,lt=l.length?Math.max(...l.map(r=>r.ts)):0;return{...o,lp,lt,d:Math.max(0,Math.floor((now-(lp||first))/864e5))}}).sort((a,b)=>b.b-a.b)}
const dtgDM=t=>{if(!t)return'—';const d=new Date(t);return d.getDate()+'/'+(d.getMonth()+1)};
/* بترسم صفحة واحدة بالكانفاس وترجّع Blob صورة */
function dtgPage(L,pg,pages,tot,n){const W=1080,RH=66,HD=200,FT=pages>1?60:24,H=HD+56+L.length*RH+FT,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const F=(s,w)=>(w||400)+' '+s+'px system-ui,"Segoe UI",Tahoma,Arial,sans-serif';x.direction='rtl';
  x.fillStyle='#ffffff';x.fillRect(0,0,W,H);x.fillStyle='#1f5f3f';x.fillRect(0,0,W,HD);
  x.fillStyle='#fff';x.textAlign='right';x.font=F(46,700);x.fillText('📒 المديونين'+(lsv('shop','')?' · '+lsv('shop',''):''),W-40,72);
  x.font=F(32);x.fillText(dshort(Date.now()).split('/').reverse().join('/')+' · '+plN(n,'عميل'),W-40,124);
  x.textAlign='left';x.font=F(30);x.fillText('الإجمالي',40,70);x.font=F(52,700);x.fillText(f(tot),40,140);
  const C={n:W-40,b:470,d:280,t:110};x.fillStyle='#eef3f0';x.fillRect(0,HD,W,56);x.fillStyle='#4b5563';x.font=F(28,600);
  x.textAlign='right';x.fillText('العميل',C.n,HD+38);x.textAlign='center';x.fillText('عليه',C.b,HD+38);x.fillText('آخر دفعة',C.d,HD+38);x.fillText('آخر معاملة',C.t,HD+38);
  L.forEach((o,i)=>{const y=HD+56+i*RH,red=o.d>=30;x.fillStyle=red?'#fdecec':(i%2?'#f8faf9':'#ffffff');x.fillRect(0,y,W,RH);x.fillStyle='#e5e7eb';x.fillRect(0,y+RH-1,W,1);
    x.textAlign='right';x.fillStyle='#111827';x.font=F(34,600);let nm=o.c.name;while(x.measureText(nm).width>W-40-600&&nm.length>3)nm=nm.slice(0,-2);if(nm!==o.c.name)nm+='…';x.fillText(nm,C.n,y+44);
    x.textAlign='center';x.fillStyle='#b42318';x.font=F(36,700);x.fillText(f(o.b),C.b,y+45);
    x.fillStyle=red?'#b42318':'#374151';x.font=F(30,red?700:400);x.fillText(o.lp?(o.d===0?'النهارده':'من '+o.d+' يوم'):'ما دفعش',C.d,y+44);
    x.fillStyle='#6b7280';x.font=F(30);x.fillText(dtgDM(o.lt),C.t,y+44)});
  if(pages>1){x.fillStyle='#6b7280';x.font=F(26);x.textAlign='center';x.fillText('صفحة '+(pg+1)+' من '+pages,W/2,H-22)}
  return new Promise(r=>cv.toBlob(r,'image/png'))}
async function dtgImages(){const A=dtgList(),tot=rd2(A.reduce((a,o)=>a+o.b,0)),P=25,pages=Math.max(1,Math.ceil(A.length/P)),out=[];
  for(let p=0;p<pages;p++)out.push(await dtgPage(A.slice(p*P,(p+1)*P),p,pages,tot,A.length));return{n:A.length,tot,imgs:out}}
async function dtgSend(){if(dtgBusy)return'busy';dtgBusy=true;try{const r=await dtgImages();if(!r.n)return'none';
    for(let i=0;i<r.imgs.length;i++){const fd=new FormData();fd.append('chat_id',tgCfg().c);if(i===0)fd.append('caption','📒 المديونين '+dshort(Date.now())+' · '+plN(r.n,'عميل')+' · الإجمالي '+f(r.tot));fd.append('photo',r.imgs[i],'مديونين-'+(i+1)+'.png');await tgApi('sendPhoto',fd,'db')}
    return'ok'}finally{dtgBusy=false}}
async function dtgAuto(){if(!pget('dbTg',false)||!tgCfg().t||!tgCfg().c||!dataReady||!S.customers.length)return;const k=dkey(Date.now());if(lsv('dbTgSent','')===k)return;
  try{const r=await dtgSend();if(r==='ok'||r==='none')svk('dbTgSent',k)}catch(e){}}
(()=>{const on=$('dbTg'),now=$('dbTgNow'),m=$('tgMsg');if(!on)return;on.checked=pget('dbTg',false);
  on.onchange=()=>{svk('dbTg',on.checked?'1':'0');m.textContent=on.checked?(tgCfg().t&&tgCfg().c?'✅ صورة المديونين هتتبعت كل يوم أول ما تفتح البرنامج':'⚠ اربط تيليجرام الأول (Token و Chat ID)'):'اتقفل إرسال صورة المديونين'};
  now.onclick=async()=>{if(!tgCfg().t||!tgCfg().c){m.textContent='⚠ اربط تيليجرام الأول (Token و Chat ID)';return}m.textContent='⏳ بتتبعت…';try{const r=await dtgSend();m.textContent=r==='none'?'مفيش مديونين دلوقتي ✓':r==='busy'?'⏳ لسه بتتبعت…':'✅ صورة المديونين وصلت تيليجرام'}catch(e){m.textContent='⚠ '+e.message}}})();
setTimeout(dtgAuto,7000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(dtgAuto,2500)});

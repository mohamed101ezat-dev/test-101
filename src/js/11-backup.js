/* ---------- النسخة الاحتياطية ---------- */
function bkInfo(){let t=0;try{t=Math.max(+localStorage.getItem('lastBackup')||0,+localStorage.getItem('cbAt')||0)}catch(e){}$('bkInfo').textContent=t?'آخر نسخة: '+stamp(t)+(Date.now()-t>6048e5?' ⚠ عدّى أكتر من أسبوع، احفظ نسخة جديدة':''):'⚠ لسه مفيش نسخة احتياطية. بياناتك على الجهاز ده بس.'}
$('bkSave').onclick=async()=>{const data=bkFull();
  const r=await dl(new Blob([JSON.stringify(data)],{type:'application/json'}),'نسخة-فواتير-'+dshort(Date.now()).replace(/\//g,'-')+'.json');
  $('bkMsg').textContent={ok:'تم حفظ النسخة ✓',anchor:'تم تنزيل النسخة ✓',declined:'تم الإلغاء',fail:'الملف متحفظش'}[r]||'';
  if(r==='ok'||r==='anchor'){try{localStorage.setItem('lastBackup',Date.now())}catch(e){}bkInfo();bkBan()}};
$('bkLoad').onclick=()=>$('bkFile').click();
/* أي حاجة اتمسحت قبل كده (محليًا ولسه ما اترفعتش، أو على السحابة كـ«تومبستون») بترجع id بتاعها هنا، عشان نمنع استرجاع نسخة قديمة من إحيائها تاني */
async function deadIds(){const s=new Set(lget('pdel').map(x=>x.k+':'+x.id)),d=FBDB;
  if(d){try{const r=await tmo(d.collection('deleted').get(),15000);r.docs.forEach(x=>{const v=x.data();if(v&&v.k&&v.tid)s.add(v.k+':'+v.tid)})}catch(e){}}
  return s}
async function restoreData(d){if(!d||!Array.isArray(d.customers)||!Array.isArray(d.invoices))throw new Error('bad');
  const dd=await deadIds(),fresh=!S.invoices.length&&!S.customers.length;
  const up=[];[['items',Array.isArray(d.items)?d.items:[]],['customers',d.customers],['invoices',d.invoices],['cats',Array.isArray(d.cats)?d.cats:[]],['quotes',Array.isArray(d.quotes)?d.quotes:[]],['expenses',Array.isArray(d.expenses)?d.expenses:[]],['suppliers',Array.isArray(d.suppliers)?d.suppliers:[]],['purchases',Array.isArray(d.purchases)?d.purchases:[]],['stock',Array.isArray(d.stock)?d.stock:[]],['files',Array.isArray(d.files)?d.files:[]]].forEach(([k,r0])=>{const have=new Set(S[k].map(x=>x.id)),r=r0.filter(x=>have.has(x.id)||!dd.has(k+':'+x.id));r.forEach(x=>{if(!have.has(x.id))x.u=Date.now()});mergeK(k,r,false).took.forEach(o=>up.push([k,o]))});
  migrate();up.forEach(([k,o])=>pushDoc(k,o));reflowAll();
  /* v189: برنامج لسه فاضي (موبايل جديد) = إعدادات النسخة كلها بترجع. لو عليه شغل، الناقص بس واللي متظبط على الجهاز بيفضل زي ما هو */
  let sn=0;try{if(d.settings&&typeof d.settings==='object')SET_K.forEach(k=>{if(typeof d.settings[k]==='string'&&d.settings[k]!==lsv(k,null)&&(fresh||lsv(k,null)===null)){localStorage.setItem(k,d.settings[k]);sn++}})}catch(e){}
  if(sn){try{setApply();setSoon()}catch(e){}}
  refreshAll();return 'تم الاسترجاع ✓ ('+plN(d.customers.length,'عميل')+'، '+plN(d.invoices.length,'معاملة')+(sn?'، وإعدادات المحل':'')+'): بيضيف الناقص ومبيمسحش الموجود'}
$('bkFile').onchange=async e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;
  try{$('bkMsg').textContent=await restoreData(JSON.parse(await fl.text()))}catch(err){$('bkMsg').textContent='الملف ده مش نسخة سليمة.'}};

function bkBan(){let t=0,sn=0;try{t=Math.max(+localStorage.getItem('lastBackup')||0,+localStorage.getItem('cbAt')||0);sn=+localStorage.getItem('bkSnooze')}catch(e){}
  const old=t?Date.now()-t>6048e5:S.invoices.length+S.customers.length>0,show=pget('bkAl',true)&&old&&Date.now()-sn>864e5;
  $('bkBanner').classList.toggle('hide',!show);if(show)$('bkBTxt').textContent=t?'عدّى أكتر من أسبوع على آخر نسخة احتياطية':'لسه مفيش نسخة احتياطية محفوظة'}
$('bkNow').onclick=()=>$('bkSave').click();
$('bkLater').onclick=()=>{try{localStorage.setItem('bkSnooze',Date.now())}catch(e){}bkBan()};

/* ---------- نسخة احتياطية سحابية يومية (Firebase) ---------- */
const dayKey=t=>{const d=new Date(t);return d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate())};
async function gzip(str){if(!window.CompressionStream)return{enc:'raw',data:str};
  const buf=new Uint8Array(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());let bin='';
  for(let i=0;i<buf.length;i+=32768)bin+=String.fromCharCode.apply(null,buf.subarray(i,i+32768));return{enc:'gz',data:btoa(bin)}}
async function gunzip(enc,data){if(enc!=='gz')return data;const b=atob(data),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
  return await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
let cbBusy=false;
async function cloudBackup(){if(!FBDB)throw new Error('offline');if(cbBusy)return false;cbBusy=true;
  try{const day=dayKey(Date.now()),payload=JSON.stringify({app:'ElTabakha',v:1,at:Date.now(),items:S.items,customers:S.customers,invoices:S.invoices,cats:S.cats,quotes:S.quotes,expenses:S.expenses,suppliers:S.suppliers,purchases:S.purchases,stock:S.stock,files:S.files}),{enc,data}=await gzip(payload),CH=400000,parts=Math.max(1,Math.ceil(data.length/CH));
    for(let i=0;i<parts;i++)await tmo(FBDB.collection('backups_data').doc(day+'_'+i).set({day,i,parts,enc,data:data.slice(i*CH,(i+1)*CH)}),20000);
    await tmo(FBDB.collection('backups_meta').doc(day).set({id:day,day,at:Date.now(),parts,enc,size:payload.length,customers:S.customers.length,invoices:S.invoices.length,items:S.items.length}),15000);
    try{localStorage.setItem('cbDay',day);localStorage.setItem('cbAt',String(Date.now()))}catch(e){}bkInfo();bkBan();
    try{const ms=(await tmo(FBDB.collection('backups_meta').get(),12000)).docs.map(d=>d.data()).sort((a,b)=>a.day<b.day?1:-1);
      for(const m of ms.slice(14)){for(let i=0;i<m.parts;i++)try{await tmo(FBDB.collection('backups_data').doc(m.day+'_'+i).delete(),8000)}catch(e){}try{await tmo(FBDB.collection('backups_meta').doc(m.day).delete(),8000)}catch(e){}}}catch(e){}
    return true}finally{cbBusy=false}}
const cbErrText=e=>/permission|insufficient/i.test((e&&(e.code||e.message))||'')?'السحابة رافضة حفظ النسخة (صلاحيات Firestore).':e&&e.message==='timeout'?'النت بطيء، هتتكرر بعدين.':e&&e.message==='offline'?'مفيش اتصال بالسحابة.':'النسخة السحابية متحفظتش. جرّب تاني.';
function cbStatus(err){const at=+lsv('cbAt','0');$('cbStat').textContent=err||(!FBDB?'مش شغالة: محتاجة تسجيل دخول بحساب Google من "المزامنة السحابية".':at?'آخر نسخة سحابية: '+stamp(at):'لسه مفيش نسخة سحابية.')}
async function autoBackupMaybe(){if(!pget('autoBk',true)||!FBDB||lsv('cbDay','')===dayKey(Date.now())||S.invoices.length+S.customers.length===0)return;
  try{await cloudBackup();cbStatus()}catch(e){cbStatus(cbErrText(e))}}
$('cbNow').onclick=async()=>{const m=$('cbMsg');m.textContent='جاري الحفظ...';try{const ok=await cloudBackup();m.textContent=ok===false?'في نسخة شغالة دلوقتي':'تم حفظ النسخة السحابية ✓';cbStatus()}catch(e){m.textContent=cbErrText(e)}};
$('cbList').onclick=async()=>{const box=$('cbRows');if(!FBDB){$('cbMsg').textContent='محتاج تسجيل دخول الأول من "المزامنة السحابية".';return}
  box.innerHTML='<p class="mute">جاري التحميل...</p>';
  try{const ms=(await tmo(FBDB.collection('backups_meta').get(),12000)).docs.map(d=>d.data()).sort((a,b)=>a.day<b.day?1:-1);
    box.innerHTML=ms.map(m=>`<div class="rec"><div class="ro" style="color:var(--ink)"><b class="num">${m.day}</b><span class="num">${m.customers} عميل · ${m.invoices} فاتورة</span></div><div class="mute num">${stamp(m.at)} · ${Math.round(m.size/1024)} ك.ب</div><div class="btns"><button class="main b-green" data-cbr="${m.day}">استرجاع</button></div></div>`).join('')||'<p class="mute">مفيش نسخ سحابية لسه.</p>'}
  catch(e){box.innerHTML='';$('cbMsg').textContent=cbErrText(e)}};
$('cbRows').onclick=async e=>{const day=e.target.dataset.cbr;if(!day)return;const m=$('cbMsg');
  if(!ok2(e.target))return;
  e.target.textContent='جاري...';
  try{const meta=(await tmo(FBDB.collection('backups_meta').doc(day).get(),12000)).data(),ps=await Promise.all(Array.from({length:meta.parts},(_,i)=>tmo(FBDB.collection('backups_data').doc(day+'_'+i).get(),20000).then(x=>x.data().data)));
    m.textContent=await restoreData(JSON.parse(await gunzip(meta.enc,ps.join(''))))}
  catch(err){m.textContent='النسخة دي مرجعتش. جرّب تاني.'}e.target.textContent='استرجاع'};


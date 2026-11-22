/* ---------- نسخ تلقائية على الجهاز + مشاركة نسخة ---------- */
const idb=()=>new Promise((res,rej)=>{const q=indexedDB.open('tabakha-bk',1);q.onupgradeneeded=()=>q.result.createObjectStore('snaps',{keyPath:'day'});q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
const idbDo=async(mode,fn)=>{const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction('snaps',mode),r=fn(tx.objectStore('snaps'));tx.oncomplete=()=>{db.close();res(r&&r.result)};tx.onerror=()=>rej(tx.error)})};
const bkData=()=>({app:'ElTabakha',v:1,at:Date.now(),items:S.items,customers:S.customers,invoices:S.invoices,cats:S.cats,quotes:S.quotes,expenses:S.expenses,suppliers:S.suppliers,purchases:S.purchases,stock:S.stock,files:S.files});
/* v189: ملف النسخة فيه كمان إعدادات المحل (الاسم واللوجو والتصميم والملاحظات وطرق الدفع والرسايل). النسخ اليومية على الجهاز من غيرها عشان المساحة */
function bkFull(){const d=bkData();try{d.settings=setGet()}catch(e){}return d}
async function snapMaybe(){if(!dataReady||!pget('snapOn',true)||!window.indexedDB||S.invoices.length+S.customers.length===0)return;const day=dayKey(Date.now());
  try{if(await idbDo('readonly',st=>st.get(day)))return;
    await idbDo('readwrite',st=>st.put({day,at:Date.now(),n:S.invoices.length,c:S.customers.length,json:JSON.stringify(bkData())}));
    const ks=(await idbDo('readonly',st=>st.getAllKeys())).sort();while(ks.length>14){const k=ks.shift();await idbDo('readwrite',st=>st.delete(k))}}catch(e){}}
async function drawSnaps(){const m=$('snapMsg');let l=[];try{l=(await idbDo('readonly',st=>st.getAll())).sort((a,b)=>b.day<a.day?-1:1)}catch(e){}
  $('snapRows').innerHTML=l.length?l.map(x=>`<div class="hrow" style="cursor:default"><div class="hl"><b>${x.day}</b><small class="mute">${plN(x.n,'معاملة')} · ${plN(x.c,'عميل')}</small></div><div style="display:flex;gap:6px"><button class="alt" data-sd="${x.day}">تنزيل</button><button class="alt b-red" data-sr="${x.day}">استرجاع</button></div></div>`).join(''):'<div class="info">لسه مفيش نسخ. أول نسخة هتتعمل أول ما تفتح التطبيق.</div>';m.textContent=''}
$('snapList').onclick=drawSnaps;
$('snapRows').onclick=async e=>{const d=e.target.dataset;if(!d.sd&&!d.sr)return;const k=d.sd||d.sr,x=await idbDo('readonly',st=>st.get(k));if(!x)return;
  if(d.sd){await dl(new Blob([x.json],{type:'application/json'}),'نسخة-فواتير-'+k+'.json');return}
  if(!ok2(e.target))return;try{$('snapMsg').textContent=await restoreData(JSON.parse(x.json))}catch(err){$('snapMsg').textContent='النسخة دي مش صالحة.'}};
/* v346: إرسال النسخة لتيليجرام لوحده (Bot API مجاني). الـToken بيتخزن على الجهاز ده بس */
const tgCfg=()=>({t:lsv('tgTok','').trim(),c:lsv('tgChat','').trim()}),tgApi=async(m,body)=>{const{t}=tgCfg();const r=await fetch('https://api.telegram.org/bot'+t+'/'+m,{method:'POST',body});const d=await r.json().catch(()=>({}));if(!d.ok)throw new Error(d.description||'فشل الإرسال');return d.result};
const tgSend=(blob,name,cap)=>{const fd=new FormData();fd.append('chat_id',tgCfg().c);fd.append('caption',cap||name);fd.append('document',blob,name);return tgApi('sendDocument',fd)};
(()=>{const t=$('tgTok'),c=$('tgChat'),m=$('tgMsg');if(!t)return;t.value=lsv('tgTok','');c.value=lsv('tgChat','');const sv=()=>{svk('tgTok',t.value.trim());svk('tgChat',c.value.trim())};t.onchange=sv;c.onchange=sv;
  $('tgFind').onclick=async()=>{sv();if(!t.value.trim()){m.textContent='الصق الـToken الأول';return}m.textContent='⏳ بدوّر…';try{const r=await tgApi('getUpdates',new FormData()),ch=r.map(u=>(u.message||u.channel_post||{}).chat).filter(Boolean).pop();if(!ch){m.textContent='مفيش رسايل للبوت. ابعتله أي رسالة من تيليجرام وجرّب تاني';return}c.value=String(ch.id);sv();m.textContent='✅ لقيته: '+(ch.first_name||ch.title||ch.id)}catch(e){m.textContent='⚠ '+e.message}};
  $('tgTest').onclick=async()=>{sv();if(!tgCfg().t||!tgCfg().c){m.textContent='اكتب الـToken والـChat ID';return}m.textContent='⏳ بيتبعت…';try{const fd=new FormData();fd.append('chat_id',tgCfg().c);fd.append('text','✅ فواتير: الربط شغّال، والنسخ الاحتياطية هتوصلك هنا');await tgApi('sendMessage',fd);m.textContent='✅ اتبعتت رسالة تجربة على تيليجرام'}catch(e){m.textContent='⚠ '+e.message}};
  $('tgOff').onclick=()=>{t.value='';c.value='';sv();m.textContent='اتوقف. المشاركة رجعت عادية'}})();
/* v348: تذكير النسخة اليومية: شريط فوق بزرار واحد يبعت ملف النسخة (واتساب/جيميل/درايف من قايمة المشاركة)، وتيليجرام لوحده لو مفعّل */
const bkToday=()=>{const t=+lsv('lastBackup','0');return t>=dAgo(0)};
function dsBar(){const e=$('dsBar');if(!e)return;const k=dkey(Date.now());if(!pget('dsOn',true)||lsv('dsHide','')===k||bkToday()||!(S.invoices.length||S.customers.length)){e.classList.add('hide');return}
  const lb=+lsv('lastBackup','0');e.innerHTML='<div class="dsr"><b>💾 نسخة النهارده لسه ما اتبعتتش</b></div><div class="dsr dsb"><small>'+(lb?'آخر نسخة: '+esc(stamp(lb)):'مفيش نسخة بإيدك لسه')+'</small><span class="dsa"><button type="button" class="ab" data-dswa="1">📤 ابعتها</button><button type="button" class="ab" data-dsx="1" aria-label="اخفاء لحد بكرة">✕</button></span></div>';e.classList.remove('hide')}
async function dsAuto(){if(!pget('dsTg',false)||!tgCfg().t||!tgCfg().c||!S.invoices.length||bkToday()||lsv('dsSent','')===dkey(Date.now()))return;try{const name='نسخة-فواتير-'+dshort(Date.now()).replace(/\//g,'-')+'.json',blob=new Blob([JSON.stringify(bkFull())],{type:'application/json'});await tgSend(blob,name,'نسخة فواتير · '+stamp(Date.now()));try{localStorage.setItem('lastBackup',Date.now())}catch(e){}svk('dsSent',dkey(Date.now()));try{bkInfo();bkBan()}catch(e){}dsBar()}catch(e){}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-dswa],[data-dsx]');if(!b)return;if(b.dataset.dswa)$('bkShare').click();else{svk('dsHide',dkey(Date.now()));dsBar()}});
(()=>{const on=$('dsOn'),tg=$('dsTg'),m=$('dsMsg');if(!on)return;on.checked=pget('dsOn',true);tg.checked=pget('dsTg',false);
  on.onchange=()=>{svk('dsOn',on.checked?'1':'0');dsBar()};tg.onchange=()=>{svk('dsTg',tg.checked?'1':'0');m.textContent=tg.checked&&!(tgCfg().t&&tgCfg().c)?'⚠ فعّل تيليجرام من الكارت اللي تحت الأول':''}})();
setTimeout(()=>{dsBar();dsAuto()},3500);document.addEventListener('visibilitychange',()=>{if(!document.hidden){dsBar();dsAuto()}});setInterval(dsBar,5*60*1000);
/* v354: لو رقم الواتساب الثابت مكتوب، بيفتح شات الرقم ده على طول (الملف بيتحمّل في التنزيلات وانت بترفقه) بدل قايمة المشاركة */
/* v349: مشاركة النسخة: واتساب مفعّل افتراضي والملف مرفق (والرقم الثابت بيتعرضلك)، وتيليجرام بيتبعتله في الخلفية لو مظبوط */
(()=>{const on=$('bkWaOn'),w=$('bkWa');if(!on)return;on.checked=pget('bkWaOn',true);w.value=lsv('bkWa','');on.onchange=()=>{svk('bkWaOn',on.checked?'1':'0')};w.onchange=()=>{const v=w.value.trim(),n=waNum(v);svk('bkWa',n?v:'');$('bkMsg').textContent=v&&!n?'⚠ رقم الواتساب مش مظبوط':n?'✅ اتحفظ رقم الواتساب: '+n:''}})();
$('bkShare').onclick=async()=>{const name='نسخة-فواتير-'+dshort(Date.now()).replace(/\//g,'-')+'.json',blob=new Blob([JSON.stringify(bkFull())],{type:'application/json'}),waN=pget('bkWaOn',true)?waNum(lsv('bkWa','')):'',mark=()=>{try{localStorage.setItem('lastBackup',Date.now())}catch(e){}bkInfo();bkBan();try{dsBar()}catch(e){}};let tgOk=false,tgErr='';
  if(tgCfg().t&&tgCfg().c){try{$('snapMsg').textContent='⏳ بيتبعت لتيليجرام…';await tgSend(blob,name,'نسخة فواتير · '+stamp(Date.now()));tgOk=true}catch(e){tgErr=' · ⚠ تيليجرام: '+e.message}}
  if(!pget('bkWaOn',true)&&tgOk){mark();$('snapMsg').textContent='✅ النسخة وصلت على تيليجرام';return}
  try{const file=new File([blob],name.replace(/.json$/,'.txt'),{type:'text/plain'});if(!waN&&navigator.canShare&&navigator.canShare({files:[file]})){$('snapMsg').textContent=(waN?'📲 اختار واتساب وابعتها لرقمك: '+lsv('bkWa',''):'اختار واتساب أو درايف أو جيميل')+(tgOk?' · ✅ اتبعتت على تيليجرام كمان':tgErr);await navigator.share({files:[file],title:file.name,text:'نسخة احتياطية من برنامج فواتير'});mark();$('snapMsg').textContent='تمت المشاركة ✓'+(tgOk?' · ووصلت تيليجرام':'');return}}catch(e){if(e&&e.name==='AbortError')return}
  $('bkSave').click();if(tgOk)mark();
  if(waN)setTimeout(()=>{window.open('https://wa.me/'+waN+'?text='+encodeURIComponent('نسخة فواتير الاحتياطية اتحمّلت على الموبايل (في التنزيلات). ارفقها هنا وابعتها.'),'_blank','noopener')},900)};
setTimeout(snapMaybe,4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)snapMaybe()});
/* v189: مسودة الفاتورة. اللي بتكتبه في الفاتورة بيتحفظ على الجهاز أول بأول، فلو الموبايل قفل البرنامج (مكالمة، واتساب، بطارية) بترجع زي ما سبتها.
   بتتمسح لوحدها بعد الحفظ أو «مسح الفاتورة»، ومش بتشتغل وانت بتعدّل فاتورة قديمة */
var drT=0,drOn=false;
function draftSave(){if(!drOn||instOff)return;try{const x=invSnap();if(x)localStorage.setItem('invDraft',JSON.stringify({at:Date.now(),x}));else localStorage.removeItem('invDraft')}catch(e){}}
function draftSoon(){if(!drOn)return;clearTimeout(drT);drT=setTimeout(draftSave,400)}
function draftBoot(){let d=null;try{d=JSON.parse(localStorage.getItem('invDraft')||'null')}catch(e){}
  if(d&&d.x&&Array.isArray(d.x.rows)&&Date.now()-(+d.at||0)<12*36e5){try{invRestore(d.x);setTimeout(()=>toast('رجّعنا الفاتورة اللي كنت بتكتبها','امسحها',()=>{clearInv();$('msg').textContent=''}),1200)}catch(e){logErr(e,'draft');try{clearInv()}catch(_){}}}
  else{try{localStorage.removeItem('invDraft')}catch(e){}}
  drOn=true;$('t-new').addEventListener('input',draftSoon);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(drT);draftSave()}});window.addEventListener('pagehide',()=>{clearTimeout(drT);draftSave()})}

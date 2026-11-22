/* ===== متابعة الطلبيات: st = p (تحت التجهيز) / r (جاهز) / d أو مفيش (اتسلّم). الفواتير القديمة كلها محسوبة اتسلّمت ===== */
const ordOn=()=>pget('ordOn',true),OST={p:'⏳ تحت التجهيز',r:'✅ جاهز',d:'📦 اتسلّم'};
const ordSt=r=>r&&r.type==='inv'&&(r.st==='p'||r.st==='r')?r.st:'d';
const ordTag=r=>{const s=ordSt(r);return ordOn()&&s!=='d'?` <span class="tag ost ${s}">${OST[s]}</span>`:''};
function rdyText(r){const c=getC(r.cid),b=c?balOf(c):0;return fillTpl('rdy',{'العميل':r.cname,'المحل':shopN(),'الكود':r.code?String(r.code):String(r.no||''),'الحساب':b>0?'حسابك: '+f(b)+' جنيه':''})}
function ordUI(){const r=curRec,on=!!(r&&r.type==='inv'&&ordOn()&&S.invoices.includes(r));$('resOrd').classList.toggle('hide',!on);if(!on)return;
  const s=ordSt(r),wa=$('resOrdWa'),n=waNum(r.phone||((getC(r.cid)||{}).phone));
  $('resOrdSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.os===s));
  wa.classList.toggle('hide',!(s==='r'&&n));if(n)wa.href='https://wa.me/'+n+'?text='+encodeURIComponent(rdyText(r))}
$('resOrdSeg').onclick=e=>{const b=e.target.closest('[data-os]'),r=curRec;if(!b||!r||ordSt(r)===b.dataset.os)return;
  r.st=b.dataset.os;r.stAt=Date.now();put('invoices',r);ordUI();drawDash();
  toast(r.st==='r'?'الطلب جاهز ✓'+(waNum(r.phone||((getC(r.cid)||{}).phone))?' — بلّغ العميل من الزرار':''):r.st==='d'?'الطلب اتسلّم ✓':'الطلب رجع تحت التجهيز')};
/* اختيار حالة الفاتورة الجديدة: البرنامج بيفتكر آخر اختيار */
const ordNew=()=>lsv('ordNew','d')==='p'?'p':'d';
function ordPickUI(){const on=ordOn()&&!editId&&!!(TOT.rows&&TOT.rows.some(x=>!x.rt));$('ordPick').classList.toggle('hide',!on);
  if(on)$('ordPick').querySelectorAll('[data-os]').forEach(b=>b.classList.toggle('on',b.dataset.os===ordNew()))}
$('ordPick').onclick=e=>{const b=e.target.closest('[data-os]');if(!b)return;try{localStorage.setItem('ordNew',b.dataset.os)}catch(_){}ordPickUI()};
const curText=()=>$('resTxtBox').classList.contains('hide')?'':$('resTxt').value;
const syncTx=()=>{$('restx').href='https://wa.me/'+waNum(curPhone)+'?text='+encodeURIComponent($('resTxt').value)};
function goTpl(){['res','rem'].forEach(i=>$(i).classList.add('hide'));$('hdrSet').click();stGo('msg')}
$('resTxt').oninput=syncTx;$('resTpl').onclick=goTpl;
$('reswa').onclick=async e=>{e.preventDefault();const n=waNum(curPhone);if(!curBlob||!n){$('resm').textContent=baseMsg+' · اكتب رقم واتساب العميل في بياناته الأول';return}
  const url='https://wa.me/'+n+(curText()?'?text='+encodeURIComponent(curText()):'');$('reswa').href=url;let ok=false;
  /* الصورة بتتنسخ الأول وبعدين الشات يتفتح، عشان النسخ ميتقطعش لما البرنامج يروح للخلفية */
  try{await Promise.race([navigator.clipboard.write([new ClipboardItem({'image/png':curBlob})]),new Promise((_,j)=>setTimeout(()=>j(new Error('t')),2000))]);ok=true}catch(err){}
  $('resm').textContent=baseMsg+(ok?' · ✅ الصورة اتنسخت: الصقها في شات العميل':' · مقدرتش أنسخ الصورة، ابعتها من «📤 مشاركة» أو «🖼️ حفظ الصورة»');
  if(!window.open(url,'_blank'))location.href=url};
const sfn=t=>String(t).replace(/[\\\/:*?"<>|]+/g,'-');
const fname=r=>'فاتورة-'+sfn(r.cname)+(r.code?'-'+r.code:(r.no?'-'+r.no:''))+'.png';
const showRec=async(r,auto,msg)=>{await busyOn('جاري فتح الفاتورة…');try{await showImg(sheet(invSheet(r)),fname(r),msg||'',auto,r.phone,r)}finally{busyOff()}};


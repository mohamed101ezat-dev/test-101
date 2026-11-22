/* الإشعارات: رسالة فوق لو البرنامج قدامك، وإشعار من الموبايل لو في الخلفية، والضغط عليهم بيفتح الحاجة نفسها.
   nfSave بيسيب آخر تنبيهات في IndexedDB عشان sw.js يعرضها لوحده (periodicsync) والبرنامج مقفول */
function nfGo(k){({sup:()=>{$('hdrSet').click();stGo('sup')},rem:openRemL,stk:()=>{$('hdrSet').click();stGo('stk')}}[k]||(()=>{}))()}
function nfList(){const a=[];try{const n=remList().length;if(n&&pget('nfRem',true))a.push({k:'rem',m:'🔔 '+n+(n>1?' مديونين محتاجين':' مديون محتاج')+' تذكير'})}catch(e){}
  try{const n=stkLow(stkAll());if(n&&pget('nfStk',true))a.push({k:'stk',m:'🧱 '+(n>1?n+' أصناف قربوا يخلصوا من المخزون':'صنف قرب يخلص من المخزون')})}catch(e){}
  try{if(pget('nfSup',true)){const now=Date.now(),l=S.suppliers.map(s=>({s,g:spAge(s)})).filter(o=>o.g.ov>0||(o.g.nx&&o.g.nx.ts-now<=2*SPDAY)),ov=l.filter(o=>o.g.ov>0).length;if(l.length)a.push({k:'sup',m:'🚚 '+(ov?(ov>1?ov+' موردين ميعاد سدادهم عدّى':'مورد ميعاد سداده عدّى'):(l.length>1?l.length+' موردين ميعاد سدادهم قرب':'مورد ميعاد سداده قرب'))})}}catch(e){}return a}
function nfState(){if(!('Notification' in window)||!('serviceWorker' in navigator))return'no';return Notification.permission==='denied'?'denied':Notification.permission==='granted'&&pget('nfOn',false)?'on':'off'}
async function nfSys(a){if(nfState()!=='on')return;try{await(await navigator.serviceWorker.ready).showNotification('فواتير',{body:a.m,icon:'icon-192.png',badge:'icon-192.png',tag:a.k,lang:'ar',dir:'rtl',data:{go:a.k}})}catch(e){}}
function nfSave(){if(ddb)kvPut({alertNow:nfState()==='on'?nfList():[]}).catch(()=>{})}
function nfDaily(){const k=dkey(Date.now());nfList().filter(a=>lsv('nfDay_'+a.k,'')!==k).forEach((a,i)=>{svk('nfDay_'+a.k,k);setTimeout(()=>{if(document.hidden)nfSys(a)},i*8500)});nfSave();bellUI()}
async function nfBg(){try{const r=await navigator.serviceWorker.ready,p=await navigator.permissions.query({name:'periodic-background-sync'});if(r.periodicSync&&p.state==='granted')await r.periodicSync.register('tabakha-alerts',{minInterval:12*36e5})}catch(e){}}
/* بداية المستخدم الجديد: 3 خطوات فوق الفاتورة، وبتختفي لوحدها لما يخلصها أو يبدأ شغل فعلي */
function startUI(){try{const st=[['shop','🏪','اكتب اسم محلك (واللوجو لو عندك)',!!shopN()],['cu','👥','ضيف أول عميل، أو استورد القايمة من Excel',S.customers.length>0],['inv','🧾','اعمل أول فاتورة',S.invoices.some(r=>r.type==='inv')]],n=st.filter(x=>x[3]).length,off=lsv('startOff','')==='1'||n===3||S.invoices.length>3;
  $('startCard').classList.toggle('hide',off);if(!off)$('startRows').innerHTML=st.map(x=>`<button type="button" class="nfr${x[3]?' dn':''}" data-st="${x[0]}"><span>${x[3]?'✅':x[1]} ${x[2]}</span><span class="sa">‹</span></button>`).join('')}catch(e){}}
$('startX').onclick=()=>{svk('startOff','1');startUI()};
$('startRows').onclick=e=>{const b=e.target.closest('[data-st]');if(!b)return;const k=b.dataset.st;if(k==='shop'){$('hdrSet').click();stGo('shop');window.scrollTo(0,0)}else if(k==='cu'){document.querySelector('#bnav [data-t="cu"]').click();const m=document.querySelector('#t-cu [data-m="add"]');if(m)m.click()}else $('cust').focus()};
/* استيراد العملاء والأصناف: xlsx بيتفك هنا من غير مكتبات، وCSV بترميز UTF-8 أو ترميز Excel العربي */
async function zipOpen(buf){const u=new Uint8Array(buf),dv=new DataView(buf);let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error('zip');
  const n=dv.getUint16(e+10,true),files={},td=new TextDecoder();let p=dv.getUint32(e+16,true);
  for(let i=0;i<n;i++){const nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true);files[td.decode(u.subarray(p+46,p+46+nl))]={m:dv.getUint16(p+10,true),cs:dv.getUint32(p+20,true),lo:dv.getUint32(p+42,true)};p+=46+nl+xl+cl}
  const rd=async f0=>{const f=files[f0];if(!f)return'';const st=f.lo+30+dv.getUint16(f.lo+26,true)+dv.getUint16(f.lo+28,true),d=u.subarray(st,st+f.cs);return f.m===0?td.decode(d):new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()};return{rd,names:Object.keys(files)}}
async function xlsxRows(buf){const z=await zipOpen(buf),P=new DOMParser(),ss=P.parseFromString((await z.rd('xl/sharedStrings.xml'))||'<a/>','application/xml'),SS=[...ss.getElementsByTagName('si')].map(x=>[...x.getElementsByTagName('t')].map(t=>t.textContent).join(''));
  const sh=z.names.filter(n=>/^xl\/worksheets\/sheet\d*\.xml$/.test(n)).sort((x,y)=>x.length-y.length||(x<y?-1:1))[0];if(!sh)throw new Error('sheet');const d=P.parseFromString(await z.rd(sh),'application/xml');
  return[...d.getElementsByTagName('row')].map(r=>{const o=[];[...r.getElementsByTagName('c')].forEach(c=>{let ci=0;for(const ch of (c.getAttribute('r')||'').replace(/\d+/g,''))ci=ci*26+ch.charCodeAt(0)-64;const t=c.getAttribute('t'),v=c.getElementsByTagName('v')[0],is=c.getElementsByTagName('t')[0];o[(ci||o.length+1)-1]=t==='s'?(SS[+(v&&v.textContent)]||''):t==='inlineStr'?(is?is.textContent:''):(v?v.textContent:'')});return Array.from(o,x=>x==null?'':String(x).trim())})}
function csvRows(t){t=t.replace(/^\uFEFF/,'');const l1=t.split(/\r?\n/)[0]||'',sep=[',',';','\t'].map(s=>[s,l1.split(s).length]).sort((x,y)=>y[1]-x[1])[0][0],rows=[];let row=[],c='',q=false;
  for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===sep){row.push(c.trim());c=''}else if(ch==='\n'){row.push(c.replace(/\r$/,'').trim());rows.push(row);row=[];c=''}else c+=ch}
  if(c||row.length){row.push(c.trim());rows.push(row)}return rows}
async function impRead(fl){const buf=await fl.arrayBuffer(),u=new Uint8Array(buf);if(u[0]===0x50&&u[1]===0x4b)return xlsxRows(buf);if(u[0]===0xd0&&u[1]===0xcf)throw new Error('xls');
  let t;try{t=new TextDecoder('utf-8',{fatal:true}).decode(u)}catch(e){t=new TextDecoder('windows-1256').decode(u)}if(/^\s*<(html|table|\?xml|!doctype)/i.test(t)){const d=new DOMParser().parseFromString(t,'text/html');return[...d.querySelectorAll('tr')].map(r=>[...r.cells].map(c=>c.textContent.trim()))}return csvRows(t)}
const IMP_H=[['phone',/موبايل|تليفون|تلفون|هاتف|واتس|جوال|phone|mobile/i],['bal',/رصيد|مديون|عليه|balance/i],['price',/سعر|price/i],['addr',/عنوان|address/i],['note',/ملاحظ|note/i],['w',/عرض|width/i],['h',/طول|height/i],['type',/نوع|type/i],['name',/اسم|العميل|الصنف|البيان|name|customer|item/i]];
function impPrep(kind,rows){rows=rows.filter(r=>r.some(x=>x));const m={};(rows[0]||[]).forEach((t,i)=>{const f=IMP_H.find(([k,re])=>!(k in m)&&re.test(t));if(f)m[f[0]]=i});const hd='name' in m;if(!hd){m.name=0;if(kind==='customers'){m.phone=1;m.bal=2}else m.price=1}
  const seen=new Set(S[kind].map(x=>nkey(x.name))),list=[];let dup=0,bad=0;const g=(r,k)=>k in m?String(r[m[k]]==null?'':r[m[k]]).trim():'';
  rows.slice(hd?1:0).forEach(r=>{const name=g(r,'name'),k=nkey(name);if(!k){bad++;return}if(seen.has(k)){dup++;return}seen.add(k);if(kind==='customers'){let ph=toEn(g(r,'phone')).replace(/[^\d+]/g,'');if(/^1[0125]\d{8}$/.test(ph))ph='0'+ph;list.push({id:uid(),name,phone:ph,addr:g(r,'addr'),note:g(r,'note'),open:nv(g(r,'bal'))})}else list.push({id:uid(),u:0,type:/جاهز|عدد|قطعة|rd/i.test(g(r,'type'))?'rd':/مقطع|متر|مقاس|mq/i.test(g(r,'type'))?'mq':defT(),name,p:nv(g(r,'price')),w:nv(g(r,'w')),h:nv(g(r,'h'))})});return{list,dup,bad}}
let impK='',impL=null;
$('impBox').addEventListener('click',e=>{const k=e.target.dataset.imp;if(!k)return;impK=k;$('impMsg').textContent='';$('impAsk').classList.add('hide');$('impFile').click()});
$('impFile').onchange=async e=>{const fl=e.target.files[0],m=$('impMsg');e.target.value='';if(!fl)return;m.textContent='جاري قراءة الملف…';
  try{const r=impPrep(impK,await impRead(fl));impL=r.list;m.textContent='';if(!r.list.length){m.textContent='مفيش حاجة جديدة تتضاف'+(r.dup?': كلهم موجودين ('+r.dup+')':'.');return}const w=impK==='customers'?'عميل':'صنف',ex=r.list.slice(0,3).map(x=>x.name).join('، ');
    $('impPrev').textContent='هيتضاف '+plN(r.list.length,w)+(r.dup?' · '+r.dup+' موجودين قبل كده مش هيتكرروا':'')+(r.bad?' · '+r.bad+' صف من غير اسم هيتساب':'')+'. زي: '+ex;$('impAsk').classList.remove('hide')}
  catch(err){m.textContent=err&&err.message==='xls'?'ملف xls القديم مش مدعوم. من Excel اختار حفظ باسم، واحفظه xlsx أو CSV.':'الملف مش بيتقري. جرّب تحفظه xlsx أو CSV.'}};
$('impNo').onclick=()=>{impL=null;$('impAsk').classList.add('hide')};
$('impGo').onclick=()=>{if(!impL||!impL.length)return;const n=impL.length,t=Date.now();DV++;S[impK].push(...impL);impL.forEach(o=>{o.u=t;pushDoc(impK,o)});lset(impK,S[impK]);impL=null;$('impAsk').classList.add('hide');refreshAll();$('impMsg').textContent='اتضاف '+plN(n,impK==='customers'?'عميل':'صنف')+' ✓'};
/* جرس التنبيهات جنب السحابة: كل اللي مستني المستخدم في مكان واحد */
function bellUI(){let l=[];try{l=nfList()}catch(e){}const rem=!$('remBan').classList.contains('hide');if(rem)l=l.filter(x=>x.k!=='rem');$('nfRows').innerHTML=l.map(x=>`<button type="button" class="nfr" data-nk="${x.k}"><span>${esc(x.m)}</span><span class="sa">‹</span></button>`).join('');const n=l.length+['autoBan','remBan','ordBan','bkBanner'].filter(i=>!$(i).classList.contains('hide')).length,c=$('nfCnt');c.textContent=n>9?'9+':String(n);c.classList.toggle('hide',!n);$('nfNone').classList.toggle('hide',n>0);$('nfBell').setAttribute('aria-label',n?'التنبيهات: '+n:'التنبيهات')}
/* عمود القيمة: تدوس على عنوانه يصغر لشريط رفيع والجدول يوسع، وتدوس تاني يرجع. الاختيار بيتحفظ */
function vTogUI(){const off=lsv('vHide','')==='1',t=$('vTog'),w=$('rowsW');w.classList.toggle('v-off',off);w.style.setProperty('--vw',off?'22px':'62px');void w.offsetWidth;$('rows').style.transform='translateZ(0)';requestAnimationFrame(()=>requestAnimationFrame(()=>{$('rows').style.transform=''}));if(t){t.setAttribute('aria-label',off?'إظهار عمود القيمة':'إخفاء عمود القيمة');t.title=off?'إظهار القيمة':'إخفاء القيمة'}}
$('vTog').addEventListener('pointerdown',e=>e.preventDefault());
/* اسم الصنف: لما تسيب الخانة أو يتختار صنف، الاسم يرجع يبان من أوله بدل ما يفضل مقصوص */
const nTop=()=>requestAnimationFrame(()=>document.querySelectorAll('#rows .n').forEach(n=>{if(n!==document.activeElement)n.scrollLeft=0}));
$('rows').addEventListener('focusout',nTop);$('rows').addEventListener('change',nTop);$('rows').addEventListener('focusin',nTop);
$('vTog').onclick=()=>{svk('vHide',lsv('vHide','')==='1'?'':'1');vTogUI()};
$('vTog').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('vTog').click()}};
vTogUI();
/* شاشة واحدة بس مفتوحة: الجرس بيقفل قايمة «محتاجين تذكير» لو كانت مفتوحة، والعكس */
$('nfBell').onclick=()=>{$('remL').classList.add('hide');bellUI();$('nfOv').classList.remove('hide')};$('nfX').onclick=()=>$('nfOv').classList.add('hide');
$('nfOv').addEventListener('click',e=>{if(e.target===$('nfOv')){$('nfOv').classList.add('hide');return}const r=e.target.closest('[data-nk]');if(r){$('nfOv').classList.add('hide');nfGo(r.dataset.nk);return}if(e.target.closest('#autoBan button,#remBan button,#ordBan,#bkBanner button')&&e.target.id!=='nfX')setTimeout(()=>{$('nfOv').classList.add('hide');bellUI()},0)});
if(window.MutationObserver){const mo=new MutationObserver(()=>bellUI());['autoBan','remBan','ordBan','bkBanner'].forEach(i=>mo.observe($(i),{attributes:true,attributeFilter:['class']}))}
function nfBoot(){if(nfState()==='on')nfBg();const g=/^#go=(\w+)/.exec(location.hash);if(g){history.replaceState(null,'',location.pathname);setTimeout(()=>nfGo(g[1]),300)}}
function nfUI(){const s=nfState();try{const w=$('nfWarn');if(w)w.classList.toggle('hide',s==='on'||s==='no')}catch(_){}$('nfStat').textContent={on:'شغالة ✓',off:'مقفولة',denied:'الإذن متمنع. افتح إذن الإشعارات للبرنامج من إعدادات المتصفح.',no:'الجهاز ده مش بيدعم الإشعارات. على الآيفون لازم تضيف البرنامج للشاشة الرئيسية الأول.'}[s];$('nfBtn').textContent=s==='on'?'إيقاف الإشعارات':'تفعيل الإشعارات';$('nfBtn').classList.toggle('hide',s==='no'||s==='denied');$('nfTest').classList.toggle('hide',s!=='on')}
$('nfBtn').onclick=async()=>{if(nfState()==='on')pset('nfOn',false);else if(await Notification.requestPermission()==='granted'){pset('nfOn',true);nfBg()}nfSave();nfUI()};
$('nfTest').onclick=()=>nfSys({k:'stk',m:'ده إشعار تجربة. دوس عليه يفتح المخزون'});
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.go)nfGo(e.data.go)});
document.addEventListener('visibilitychange',()=>{if(dataReady){if(document.hidden)nfSave();else nfDaily()}});
setInterval(()=>{if(dataReady)nfDaily()},36e5);

/* تصدير Excel: ملف CSV بعلامة BOM عشان العربي يفتح صح. الخانة اللي تبدأ بعلامة معادلة بتتكتب كنص */
const csvC=v=>{v=String(v==null?'':v);/* v189: رقم التليفون بيتكتب كنص عشان Excel ما يشيلش الصفر اللي في الأول */if(/^\+?0\d{6,}$/.test(v))return '"=""'+v+'"""';if(/^[=+\-@]/.test(v)&&isNaN(+v))v="'"+v;return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const XL={inv:['الفواتير',['الكود','التاريخ','العميل','النوع','القيمة','المدفوع','الباقي'],()=>S.invoices.slice().sort((a,b)=>a.ts-b.ts).map(r=>[r.code||'',dshort(r.ts),r.cname,r.type==='pay'?'دفعة':'فاتورة',val(r),pd(r),r.rest])],
  cu:['العملاء',['العميل','التليفون','الرصيد'],()=>S.customers.map(c=>[c.name,c.phone||'',balOf(c)])],
  it:['الأصناف',['الصنف','النوع','السعر'],()=>S.items.map(i=>[i.name,i.type==='rd'?'جاهز':'مقطع',i.p])],
  ex:['المصروفات',['التاريخ','النوع','المبلغ','ملاحظة'],()=>S.expenses.slice().sort((a,b)=>a.ts-b.ts).map(x=>[dshort(x.ts),x.cat,x.amt,x.note])],
  sp:['الموردين',['التاريخ','المورد','النوع','المبلغ','ملاحظة','استحقاق','طريقة الدفع'],()=>S.purchases.slice().sort((a,b)=>a.ts-b.ts).map(x=>[dshort(x.ts),(S.suppliers.find(s=>s.id===x.sid)||{}).name||'',x.type==='pay'?'دفعة':'شراء',x.amt,x.note,x.due?dshort(x.due):'',x.how||''])],
  st:['المخزون',['الصنف','النوع','الرصيد'],()=>{const m=stkAll();return S.items.filter(i=>m.has(i.id)).map(i=>[i.name,i.type==='rd'?'جاهز':'مقطع',m.get(i.id).bal])}]};
$('xlBox').onclick=async e=>{const k=e.target.dataset.xl;if(!k)return;const[n,h,fn]=XL[k],rows=fn(),m=$('xlMsg');if(!rows.length){m.textContent='مفيش بيانات في '+n;return}
  const r=await dl(new Blob(['﻿'+[h,...rows].map(x=>x.map(csvC).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),n+'-'+dshort(Date.now()).replace(/\//g,'-')+'.csv');m.textContent=r==='fail'?'الملف متحفظش':'اتنزل ملف '+n+' ✓'};


/* فواتير · التطبيق الأساسي (فواتير، عملاء، سجل، مديونين، إعدادات) */
/* رقم النسخة: غيّر الرقم ده مع كل تحديث، والـ service worker بياخده لوحده */
const APP_VER='397';
/* صفحة قديمة وصلت مع ملف أحدث منها (نت بطيء وقت التحديث): نعيد الفتح مرة بدل ما البرنامج يقع */
(function(){const s=document.querySelector('script[src*="js/app.js"]'),m=s&&/[?&]v=(\d+)/.exec(s.src);if(!m||m[1]===APP_VER)return;let seen=APP_VER;try{seen=sessionStorage.getItem('verFix');sessionStorage.setItem('verFix',APP_VER)}catch(e){}if(seen===APP_VER)return;window.__bootOK=true;location.reload();throw new Error('stale-page')})();
const $=id=>document.getElementById(id);
const f=n=>(rd2(+n||0)||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2,useGrouping:true});
const fq=n=>(+n||0).toLocaleString('en-US',{maximumFractionDigits:2,useGrouping:true});
const toEn0=s=>String(s==null?'':s).replace(/[٠-٩]/g,d=>d.charCodeAt(0)-1632).replace(/[۰-۹]/g,d=>d.charCodeAt(0)-1776).replace(/٫/g,'.').replace(/٬/g,'');
const toEn=s=>toEn0(s).replace(/,/g,'');
const nv=x=>parseFloat(toEn(x))||0;
const rd2=x=>Math.round(x*100)/100;
const esc=s=>String(s==null?'':s).replace(/[&<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
/* الأخطاء بتتسجل عندنا بس (آخر 30 في errLog)، والمستخدم بيشوف رسالة بسيطة */
const logErr=(e,w)=>{try{console.error('[فواتير]',w||'',e);const l=JSON.parse(localStorage.getItem('errLog')||'[]');l.push({at:Date.now(),w:w||'',m:String(e&&(e.code||e.message)||e).slice(0,300)});localStorage.setItem('errLog',JSON.stringify(l.slice(-30)))}catch(_){}};
window.addEventListener('error',e=>logErr(e.error||e.message,'win'));window.addEventListener('unhandledrejection',e=>logErr(e.reason,'promise'));
window.addEventListener('securitypolicyviolation',e=>logErr(e.blockedURI+' '+e.violatedDirective,'csp'));
/* لون ثابت لكل عميل ومن غير تكرار: كل عميل جديد ياخد أول لون لسه ما اتاخدش (متحفوظ على الجهاز). 22 درجة هادية من غير أحمر عشان الأحمر للديون */
const CUST_HUES=Array.from({length:22},(_,i)=>25+i*15);
const custHue=id=>{let m={};try{m=JSON.parse(localStorage.getItem('custHueMap')||'{}')}catch(e){}
  if(m[id]==null){const used=new Set(Object.values(m));let k=0;while(used.has(k)&&k<CUST_HUES.length)k++;if(k>=CUST_HUES.length)k=Object.keys(m).length%CUST_HUES.length;m[id]=k;try{localStorage.setItem('custHueMap',JSON.stringify(m))}catch(e){}}
  return CUST_HUES[(m[id]*7)%CUST_HUES.length]};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const two=n=>String(n).padStart(2,'0');
/* v190: العدد مع المعدود بالعربي: 2 = مثنى (عميلين)، 3-10 = جمع (5 عملاء)، غير كده مفرد (11 عميل) */
const PLW={'عميل':['عميلين','عملاء'],'صنف':['صنفين','أصناف'],'معاملة':['معاملتين','معاملات'],'فاتورة':['فاتورتين','فواتير'],'مورد':['موردين','موردين'],'طريقة':['طريقتين','طرق'],'عملية':['عمليتين','عمليات']};
const plN=(n,k)=>{n=+n||0;const w=PLW[k],m=n%100;return !w?n+' '+k:n===2?w[0]:m>=3&&m<=10?n+' '+w[1]:n+' '+k};
/* v190: الرصيد بالسالب بيتكتب «له 500» بدل «-500» */
const fb=n=>(+n||0)<0?'له '+f(-n):f(n);
const dAgo=n=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-n);return d.getTime()};
const dEnd=a=>{const d=new Date(a);d.setDate(d.getDate()+1);return d.getTime()};
function stamp(t){const d=new Date(t);let h=d.getHours();const ap=h>=12?'م':'ص';h=h%12||12;return `${d.getFullYear()}/${two(d.getMonth()+1)}/${two(d.getDate())}  ${h}:${two(d.getMinutes())} ${ap}`}
const dshort=t=>{const d=new Date(t);return `${d.getFullYear()}/${two(d.getMonth()+1)}/${two(d.getDate())}`};
function lget(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}}
/* ===== مكان الحفظ: الفواتير والعملاء والأصناف في IndexedDB (مساحة كبيرة)، والإعدادات الصغيرة في localStorage ===== */
const BIG=['items','customers','invoices','cats','quotes','expenses','suppliers','purchases','stock','files'],BIGS=new Set(BIG),IDBN='tabakha-data';
let dataMode='ls',dataReady=false,ddb=null,instOff=false,pend={},pendQ=false,lsWarned=0;
const lsWarn=()=>{if(Date.now()-lsWarned>30000){lsWarned=Date.now();try{toast('⚠ الحفظ على الجهاز منفعش (المساحة اتملت). احفظ نسخة احتياطية حالاً.')}catch(_){}}};
function lset(k,x){if(instOff)return;
  if(BIGS.has(k)){if(!dataReady)return;/* قبل ما البيانات تتحمل منكتبش حاجة عشان ميتمسحش الموجود */
    if(dataMode==='idb'){pend[k]=x;if(!pendQ){pendQ=true;Promise.resolve().then(flushIDB)}return}
    try{if(localStorage.getItem('idbMig'))localStorage.setItem('lsDirty','1')}catch(e){}}
  try{localStorage.setItem(k,JSON.stringify(x))}catch(e){lsWarn()}}
function ddbOpen(ver){return new Promise((res,rej)=>{let q;try{q=ver?indexedDB.open(IDBN,ver):indexedDB.open(IDBN)}catch(e){rej(e);return}
  q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('kv'))q.result.createObjectStore('kv')};q.onblocked=()=>rej(new Error('blocked'));q.onerror=()=>rej(q.error);
  q.onsuccess=()=>{const d=q.result;if(d.objectStoreNames.contains('kv')){d.onversionchange=()=>d.close();res(d);return}const v=d.version+1;d.close();ddbOpen(v).then(res,rej)}})}
function kvGet(keys){return new Promise((res,rej)=>{const t=ddb.transaction('kv','readonly'),st=t.objectStore('kv'),o={};let n=keys.length;if(!n){res(o);return}
  keys.forEach(k=>{const r=st.get(k);r.onsuccess=()=>{o[k]=r.result;if(--n===0)res(o)};r.onerror=()=>rej(r.error)})})}
function kvPut(obj){return new Promise((res,rej)=>{const t=ddb.transaction('kv','readwrite'),st=t.objectStore('kv');Object.entries(obj).forEach(([k,v])=>st.put(v,k));
  t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('abort'))})}
function flushIDB(){pendQ=false;const o=pend;pend={};if(!ddb||!Object.keys(o).length)return Promise.resolve();
  return kvPut(o).catch(e=>{Object.keys(o).forEach(k=>{if(!(k in pend))pend[k]=o[k]});lsWarn()})}
const lsv=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}};
const nm=t=>String(t==null?'':t).toLowerCase().replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
/* بحث صوتي: حرف لاتيني يطابق نظيره العربي (m = م) عن طريق هيكل الحروف الساكنة */
const PH={'ب':'b','ت':'t','ث':'s','ج':'j','ح':'h','خ':'x','د':'d','ذ':'z','ر':'r','ز':'z','س':'s','ش':'x','ص':'s','ض':'d','ط':'t','ظ':'z','غ':'j','ف':'f','ق':'k','ك':'k','ل':'l','م':'m','ن':'n','ه':'h'};
const skel=t=>{let o=String(t==null?'':t).toLowerCase().replace(/sh|kh/g,'x').replace(/gh/g,'j');o=o.replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآ]/g,'ا');
  return o.split('').map(c=>PH[c]||(/[a-z0-9]/.test(c)?({c:'k',q:'k',g:'j',p:'b',v:'f'}[c]||c):'')).join('').replace(/[aeiouyw]/g,'')};
const qm=(t,q)=>{q=String(q==null?'':q).trim();if(!q)return true;if(nm(t).includes(nm(q)))return true;if(!/[a-z]/i.test(q))return false;const k=skel(q);return !!k&&skel(t).includes(k)};
const nkey=t=>nm(t).replace(/\s+/g,' ').trim();
const findCust=n=>{const k=nkey(n);return k?S.customers.find(c=>nkey(c.name)===k)||null:null};
const sfail=()=>{$('stor').textContent='تنبيه: الحفظ على السحابة منفعش، وبياناتك محفوظة على الجهاز ده.'};
const sf=fn=>{try{const p=fn();if(p&&p.catch)p.catch(sfail)}catch(e){sfail()}};
const S={items:[],customers:[],invoices:[],cats:[],quotes:[],expenses:[],suppliers:[],purchases:[],stock:[],files:[]};let db=null;


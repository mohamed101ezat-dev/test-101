/* ========== تذكير المديونين: ميعاد سداد لكل عميل + تنبيه بعد مدة من غير دفع ========== */
const dz=n=>n===1?'يوم':n===2?'يومين':n>=3&&n<=10?n+' أيام':n+' يوم';
const agoTxt=t=>{const d=Math.floor((dAgo(0)-new Date(new Date(t).setHours(0,0,0,0)).getTime())/864e5);return d<=0?'النهارده':d===1?'امبارح':'من '+dz(d)};
const dueLabel=t=>{const d=new Date(t),n=Math.round((t-dAgo(0))/864e5);return(n===0?'النهارده · ':n===1?'بكرة · ':'')+WD[d.getDay()]+' '+d.getDate()+' '+MN[d.getMonth()]};
/* أي دفعة (أو فاتورة دفع فيها أكتر من قيمتها) بتلغي ميعاد السداد. بيرجّع القديم عشان "تراجع" */
function payDone(c,r){if(!c||!c.due)return null;const red=r.type==='pay'?r.amount>0:rd2((r.paid||0)-val(r))>0;if(!red&&balOf(c)>0)return null;const bak={cid:c.id,due:c.due};delete c.due;put('customers',c);return bak}
function remList(){if(!pget('remOn',true))return[];const D=Math.max(1,Math.round(+lsv('remDays','7'))||7),min=nv(lsv('remMin','0')),now=Date.now(),today=dAgo(0),out=[];
  S.customers.forEach(c=>{const b=balOf(c);if(b<=0||b<min)return;if(c.snz&&c.snz>now)return;const lr=c.remAt||0;
    if(c.due){if(today<c.due)return;if(lr<c.due){out.push({c,b,k:'due',d:Math.round((today-c.due)/864e5)});return}}
    /* ميعاد شهري ثابت (مثلاً يوم 5 من كل شهر): بيظهر لو عدّى اليوم ومفيش دفعة ولا تذكير من بعده */
    if(c.dd&&!c.due){const n=new Date(today),dueT=new Date(n.getFullYear(),n.getMonth(),Math.min(c.dd,new Date(n.getFullYear(),n.getMonth()+1,0).getDate())).getTime();if(today>=dueT&&lr<dueT&&lastPay(c)<dueT){out.push({c,b,k:'due',d:Math.round((today-dueT)/864e5),dueT});return}}
    const lp=lastPay(c),l=ledger(c),first=l.length?Math.min(...l.map(r=>r.ts)):0,from=lp||first,base=Math.max(from,lr);
    if(base&&Math.floor((now-base)/864e5)<D)return;out.push({c,b,k:'late',lp,from,lr})});
  return out.sort((x,y)=>(x.k==='due'?0:1)-(y.k==='due'?0:1)||y.b-x.b)}
function remWhy(x){if(x.k==='due')return'📅 وعد يدفع '+dueLabel(x.dueT||x.c.due)+(x.d>0?' · عدّى من '+dz(x.d):'');
  return(x.lp?'آخر دفعة '+agoTxt(x.lp):x.from?'مدفعش حاجة من أول تعامل ('+agoTxt(x.from)+')':'مفيش دفعات متسجلة')+(x.lr?' · آخر تذكير '+agoTxt(x.lr):'')}
function remDraw(){const l=remList(),bn=$('remBan'),dn=l.filter(x=>x.k==='due').length;
  bn.innerHTML=l.length?`<div class="abl"><span>🔔 <b class="num">${l.length}</b> ${l.length>1?'مديونين محتاجين':'مديون محتاج'} تذكير</span>${dn?`<span class="mute">(${dn} ميعادهم جه)</span>`:''}<button class="ab" data-rb="1">عرض</button></div>`:'';bn.classList.toggle('hide',!l.length);
  if(!$('remL').classList.contains('hide'))$('remLList').innerHTML=l.map(x=>`<div class="rec"><div class="ro" style="color:var(--ink)"><b>${esc(x.c.name)}</b><span class="cb dr num">${bal(x.c)}</span></div>
    <div class="mute" style="margin-top:2px">${esc(remWhy(x))}</div>
    <div class="btns"><button class="main b-green" data-rr="${x.c.id}"><i class="wai"></i> تذكير</button><button class="alt" data-rs="${x.c.id}" style="flex:none">⏰ بكرة</button><button class="alt" data-ro="${x.c.id}" style="flex:none">فتح</button></div></div>`).join('')||'<p class="mute">مفيش حد محتاج تذكير دلوقتي ✓</p>'}
const openRemL=()=>{$('nfOv').classList.add('hide');$('remL').classList.remove('hide');remDraw()};
$('remBan').onclick=e=>{if(e.target.closest('[data-rb]'))openRemL()};
$('remLX').onclick=()=>$('remL').classList.add('hide');
$('remL').addEventListener('click',e=>{const t=e.target;if(t===$('remL')){$('remL').classList.add('hide');return}
  const b=t.closest('button');if(!b)return;const c=getC(b.dataset.rr||b.dataset.rs||b.dataset.ro);
  if(b.dataset.rr&&c)openRem(c);
  else if(b.dataset.rs&&c){c.snz=dAgo(-1);put('customers',c);remDraw()}
  else if(b.dataset.ro&&c){$('remL').classList.add('hide');document.querySelector('#bnav button[data-t="dash"]').click();dbMode=true;dbSel=c.id;dbPay=null;drawDebt();window.scrollTo(0,0)}});
$('remLSet').onclick=()=>{$('remL').classList.add('hide');$('hdrSet').click();stGo('rem')};
/* لما تبعت التذكير فعلاً بيتسجل، فالعميل يختفي لحد ما المدة تعدّي تاني */
const remMark=c=>{if(!c)return;c.remAt=Date.now();delete c.snz;put('customers',c);remDraw()};
$('remGo').addEventListener('click',()=>remMark(remC));
$('bulkList').addEventListener('click',e=>{const a=e.target.closest('a[data-bk]');if(a)remMark(getC(a.dataset.bk))});
/* إعدادات التذكير */
function remUI(){$('remOn').checked=pget('remOn',true);const d=Math.round(+lsv('remDays','7'))||7;$('remDaysIn').value=d;document.querySelectorAll('#remDaysSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.rd===d));$('remMinIn').value=nv(lsv('remMin','0'))||''}
$('remOn').onchange=()=>{pset('remOn',$('remOn').checked);remDraw()};
$('remDaysSeg').onclick=e=>{const b=e.target.closest('[data-rd]');if(!b)return;svk('remDays',b.dataset.rd);remUI();remDraw()};
$('remDaysIn').oninput=()=>{const v=Math.round(nv($('remDaysIn').value));if(v>0){svk('remDays',String(v));document.querySelectorAll('#remDaysSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.rd===v));remDraw()}};
$('remMinIn').oninput=()=>{svk('remMin',String(nv($('remMinIn').value)));remDraw()};

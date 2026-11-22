/* ---------- عروض الأسعار: بتتحفظ على الجهاز ده بس ومش بتتسجل على حساب العميل ---------- */
function qtDel(id){del('quotes',id);qtBtn()}
function qtBtn(){const n=S.quotes.length,b=$('qtOpen');b.textContent='📝 عروض الأسعار ('+n+')';b.classList.toggle('hide',!n)}
function qtSheet(q){const o=invSheet({...q,type:'inv',prev:0,paid:0,paidRaw:0,refund:0,pf:0,pfv:0,pfWhy:'',rest:q.total,code:0,rcode:0});
  o.sub='عرض سعر رقم '+q.no;o.st='qt';o.sum=o.sum.filter(x=>!/^(رصيد سابق|المدفوع|المتبقي)/.test(x[0]));
  if(!q.nylon&&!q.disc)o.sum=o.sum.filter(x=>!/^إجمالي الإذن/.test(x[0]));return o}
const showQt=(q,msg)=>showImg(sheet(qtSheet(q)),'عرض-سعر-'+q.no+'-'+sfn(q.cname)+'.png',msg||'',false,q.phone,null);
$('saveQt').onclick=()=>{const m=$('msg');m.textContent='';if(editId)return;calc();
  const name=$('cust').value.trim().replace(/\s+/g,' ');if(!name){m.textContent='اكتب اسم العميل الأول.';return}
  const bad=[...document.querySelectorAll('#rows .row')].some(d=>{const g=c=>nv((d.querySelector(c)||{}).value),emp=String((d.querySelector('.c')||{}).value||'').trim()==='',eff=g('.c')>0||(emp&&(g('.p')>0||(g('.w')>0&&g('.h')>0)));return !eff&&(g('.p')>0||((d.querySelector('.n')||{}).value||'').trim())});
  if(bad){m.textContent='في بند من غير عدد: اكتب العدد أو احذف البند.';return}
  if(!TOT.rows.length){m.textContent='ضيف بند واكتب العدد.';return}
  const c=findCust(name),nyl=nv($('nylon').value),dsc=nv($('disc').value),no=Math.max(+lsv('qtNo','0')||0,...S.quotes.map(x=>x.no||0))+1;svk('qtNo',String(no));
  const q={id:uid(),no,ts:Date.now(),cname:c?c.name:name,phone:$('phone').value.trim()||(c&&c.phone)||'',rows:TOT.rows,tq:TOT.tq,sub:TOT.sub,nylon:nyl,disc:dsc,discWhy:$('discWhy').value.trim(),note:$('note').value.trim(),...noteSnap(),total:rd2(TOT.sub+nyl-dsc)};
  if(qtFrom)del('quotes',qtFrom);S.quotes.push(q);put('quotes',q);qtBtn();clearInv();showQt(q,'تم حفظ عرض السعر ✓ (مش متسجل على حساب العميل)')};
function drawQt(){const now=Date.now();
  $('qtList').innerHTML=S.quotes.slice().sort((a,b)=>b.ts-a.ts).map(q=>{const d=Math.floor((now-q.ts)/864e5);return`<div class="rec"><div class="ro" style="color:var(--ink)"><b>${esc(q.cname)}</b><b class="num">${f(q.total)}</b></div>
    <div class="mute">عرض سعر رقم ${q.no} · ${dshort(q.ts)}${d>0?' (من '+d+' يوم)':''} · ${q.rows.length} بند</div>
    <div class="btns"><button class="main b-green" data-qi="${q.id}">↪ تحويل لفاتورة</button><button class="alt" data-qv="${q.id}" style="flex:none">عرض</button><button class="alt b-red" data-qd="${q.id}" style="flex:none">حذف</button></div></div>`}).join('')||'<p class="mute">مفيش عروض أسعار.</p>'}
function qtToInv(q){$('qtOv').classList.add('hide');document.querySelector('#bnav button[data-t="new"]').click();
  clearInv();$('cust').value=q.cname;custInput();if(!findCust(q.cname)&&q.phone)$('phone').value=q.phone;fillRows(q);
  $('nylon').value=q.nylon||'';$('disc').value=q.disc||'';$('discWhy').value=q.discWhy||'';$('note').value=q.note||'';if(q.nylon||q.disc||q.note)$('moreBtn').click();
  qtFrom=q.id;calc();$('cinfo').textContent='📝 من عرض سعر رقم '+q.no+': اكتب المدفوع واحفظ (العرض هيتمسح لوحده بعد الحفظ) · '+$('cinfo').textContent;$('msg').textContent='';window.scrollTo(0,0)}
$('qtOpen').onclick=()=>{drawQt();$('qtOv').classList.remove('hide')};
$('qtX').onclick=()=>$('qtOv').classList.add('hide');
$('qtOv').addEventListener('click',e=>{const t=e.target,d=t.dataset;if(t===$('qtOv')){$('qtOv').classList.add('hide');return}
  const q=S.quotes.find(x=>x.id===(d.qi||d.qv||d.qd));if(!q)return;
  if(d.qi)qtToInv(q);else if(d.qv)showQt(q,'');else if(d.qd&&ok2(t)){qtDel(q.id);if(qtFrom===q.id)qtFrom=null;drawQt();if(!S.quotes.length)$('qtOv').classList.add('hide')}});
qtBtn();

/* ---------- أدوات واتساب (رقم العميل ونص التذكير) ---------- */
const waNum=p=>{let d=toEn(phoneParts(p)[0]||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);else if(d.startsWith('0'))d='20'+d.slice(1);return d};
/* الاتصال بنفس الرقم المتسجل بالظبط (بس من غير مسافات، والأرقام العربي تتحول إنجليزي) */
const telNum=p=>toEn(phoneParts(p)[0]||'').replace(/[^\d+]/g,'');
function remLink(c){return 'https://wa.me/'+waNum(c.phone)+'?text='+encodeURIComponent(remText(c))}


/* v282: QR لكل فاتورة (بيشتغل من غير نت) + مسح QR للتحقق من الفاتورة */
(function(){
'use strict';
/* ---------- مولّد QR: وضع البايتات، تصحيح M، إصدارات 1 → 20 ---------- */
const ECC=[10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26],NB=[1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16];
const rawMods=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
const gmul=(a,b)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((b>>>i)&1)*a}return z&255};
const rsDiv=d=>{const r=new Array(d-1).fill(0);r.push(1);let root=1;for(let i=0;i<d;i++){for(let j=0;j<r.length;j++){r[j]=gmul(r[j],root);if(j+1<r.length)r[j]^=r[j+1]}root=gmul(root,2)}return r};
const rsRem=(data,div)=>{const r=div.map(()=>0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>{r[i]^=gmul(c,f)})}return r};
const utf8=s=>Array.from(new TextEncoder().encode(s));
function build(text){
  const bytes=utf8(text);let ver=1;
  for(;ver<=20;ver++){const cap=Math.floor(rawMods(ver)/8)-ECC[ver-1]*NB[ver-1],need=Math.ceil((4+(ver<10?8:16)+bytes.length*8)/8);if(need<=cap)break}
  if(ver>20)return null;
  const size=ver*4+17,raw=rawMods(ver),eccLen=ECC[ver-1],nb=NB[ver-1],dataCw=Math.floor(raw/8)-eccLen*nb;
  const bits=[],put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push((v>>>i)&1)};
  put(4,4);put(bytes.length,ver<10?8:16);bytes.forEach(b=>put(b,8));
  put(0,Math.min(4,dataCw*8-bits.length));while(bits.length%8)bits.push(0);
  for(let p=0xEC;bits.length<dataCw*8;p^=0xEC^0x11)put(p,8);
  const data=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b)}
  /* تقسيم لكتل + تصحيح الأخطاء + تداخل */
  const nShort=nb-Math.floor(raw/8)%nb,shortLen=Math.floor(Math.floor(raw/8)/nb),div=rsDiv(eccLen),blocks=[];
  for(let i=0,k=0;i<nb;i++){const d=data.slice(k,k+shortLen-eccLen+(i<nShort?0:1));k+=d.length;const e=rsRem(d,div);if(i<nShort)d.push(0);blocks.push(d.concat(e))}
  const all=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((bl,j)=>{if(i!==shortLen-eccLen||j>=nShort)all.push(bl[i])});
  /* الرسم */
  const M=Array.from({length:size},()=>new Array(size).fill(false)),FN=Array.from({length:size},()=>new Array(size).fill(false));
  const set=(x,y,v)=>{M[y][x]=!!v;FN[y][x]=true},bit=(n,i)=>((n>>>i)&1)!==0;
  for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
  const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<size&&y>=0&&y<size)set(x,y,d!==2&&d!==4)}};
  finder(3,3);finder(size-4,3);finder(3,size-4);
  const ap=[];if(ver>1){const n=Math.floor(ver/7)+2,st=Math.ceil((ver*4+4)/(n*2-2))*2;ap.push(6);for(let pos=size-7;ap.length<n;pos-=st)ap.splice(1,0,pos)}
  ap.forEach((ax,i)=>ap.forEach((ay,j)=>{if((i===0&&j===0)||(i===0&&j===ap.length-1)||(i===ap.length-1&&j===0))return;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ax+dx,ay+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}));
  const fmt=mask=>{const d=mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=((d<<10)|r)^0x5412;
    for(let i=0;i<=5;i++)set(8,i,bit(b,i));set(8,7,bit(b,6));set(8,8,bit(b,7));set(7,8,bit(b,8));for(let i=9;i<15;i++)set(14-i,8,bit(b,i));
    for(let i=0;i<8;i++)set(size-1-i,8,bit(b,i));for(let i=8;i<15;i++)set(8,size-15+i,bit(b,i));set(8,size-8,true)};
  fmt(0);
  if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=(ver<<12)|r;for(let i=0;i<18;i++){const c=bit(b,i),a=size-11+i%3,q=Math.floor(i/3);set(a,q,c);set(q,a,c)}}
  let k=0;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let v=0;v<size;v++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-v:v;if(!FN[y][x]&&k<all.length*8){M[y][x]=bit(all[k>>>3],7-(k&7));k++}}}
  const inv=(m,x,y)=>[(x+y)%2===0,y%2===0,x%3===0,(x+y)%3===0,(Math.floor(x/3)+Math.floor(y/2))%2===0,x*y%2+x*y%3===0,(x*y%2+x*y%3)%2===0,((x+y)%2+x*y%3)%2===0][m];
  const apply=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!FN[y][x]&&inv(m,x,y))M[y][x]=!M[y][x]};
  const penalty=()=>{let s=0,dark=0;
    for(let t=0;t<2;t++)for(let a=0;a<size;a++){let run=1,str='';for(let b=0;b<size;b++){const c=t?M[b][a]:M[a][b];str+=c?'1':'0';if(c)dark++;if(b>0){const p=t?M[b-1][a]:M[a][b-1];if(p===c){run++;if(run===5)s+=3;else if(run>5)s++}else run=1}}
      for(const pat of['00001011101','10111010000']){let i=-1;while((i=str.indexOf(pat,i+1))>=0)s+=40}}
    for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])s+=3}
    dark/=2;const tot=size*size;s+=(Math.ceil(Math.abs(dark*20-tot*10)/tot)-1)*10;return s};
  let best=0,bp=1e9;for(let m=0;m<8;m++){apply(m);fmt(m);const p=penalty();if(p<bp){bp=p;best=m}apply(m)}
  apply(best);fmt(best);return M}
window.qrMatrix=build;
/* بيرسم QR أسود على خلفية بيضا (حتى لو ألوان الفاتورة غامقة) ويرجّع الحجم */
window.qrDraw=function(ctx,text,x,y,size){const M=build(text);if(!M)return 0;const n=M.length,q=2,u=size/(n+2*q);ctx.save();ctx.fillStyle='#fff';ctx.fillRect(x,y,size,size);ctx.fillStyle='#000';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(M[r][c])ctx.fillRect(x+(c+q)*u,y+(r+q)*u,Math.ceil(u*100)/100+.2,Math.ceil(u*100)/100+.2);ctx.restore();return size};
/* ---------- محتوى الـQR: ملخص مقروء + توقيع قصير بيكشف أي تعديل بالقلم ---------- */
const qh=s=>{let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return((h2>>>0).toString(36)+(h1>>>0).toString(36)).slice(0,6)};
const R0=v=>Math.round(+v||0),sigOf=(id,ts,t,p,r)=>qh([id,ts,t,p,r,'g1'].join('|'));
window.qrText=function(r){const t=R0(r.total),p=R0(r.paid),re=R0(r.rest);
  return 'فاتورة '+r.no+'\nإجمالي '+t+' · مدفوع '+p+' · باقي '+re+'\n#'+[r.id,(+r.ts).toString(36),t,p,re,sigOf(r.id,r.ts,t,p,re)].join('|')};
/* بيرسم QR تحت الفاتورة (على قد الورقة) ويرجّع الارتفاع اللي خده */
window.qrFoot=function(x,o,W,P,y,TH,F){if(!o.qr)return 0;const sz=TH?104:96,xx=TH?(W-sz)/2:W-P-sz;if(!qrDraw(x,o.qr,xx,y+6,sz))return 0;
  if(!TH){x.save();x.direction='rtl';x.textBaseline='middle';x.textAlign='right';x.font='13px '+F;x.fillStyle='#666';x.fillText('امسح الكود للتحقق من الفاتورة',W-P-sz-10,y+6+sz/2);x.restore()}
  return sz+12};
/* ---------- مسح QR ---------- */
function toast(m){const s=document.getElementById('qrToast')||(()=>{const d=document.createElement('div');d.id='qrToast';d.style.cssText='position:fixed;left:12px;right:12px;bottom:76px;z-index:10050;background:#222;color:#fff;border-radius:10px;padding:10px 12px;text-align:center;font-weight:700';document.body.appendChild(d);return d})();s.textContent=m;s.style.display='block';clearTimeout(s._t);s._t=setTimeout(()=>{s.style.display='none'},4000)}
function found(txt){const ln=String(txt).split('\n').pop().trim();if(ln[0]!=='#'){toast('الكود ده مش من فواتيرك');return false}
  const p=ln.slice(1).split('|');if(p.length<6){toast('الكود ده مش من فواتيرك');return false}
  const [id,ts36,t,pd,re,sig]=p,ts=parseInt(ts36,36);if(sigOf(id,ts,t,pd,re)!==sig){toast('⚠ الكود متعدّل أو مش سليم');return false}
  const r=(S.invoices||[]).find(x=>x.id===id);if(!r){toast('الفاتورة دي مش موجودة على الجهاز ده');return false}
  const same=R0(r.total)===+t&&R0(r.paid)===+pd&&R0(r.rest)===+re;
  showRec(r,false,same?'✓ مطابقة للمسجل':'⚠ الأرقام اتغيّرت بعد الطباعة (على الورقة: إجمالي '+t+' · مدفوع '+pd+' · متبقي '+re+')');return true}
window.qrScan=async function(){
  if(!('BarcodeDetector' in window)||!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){toast('الكاميرا مش بتدعم مسح QR هنا. اكتب رقم الفاتورة في البحث');return}
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(e){toast('محتاج تسمح للتطبيق بالكاميرا');return}
  const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:10040;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center';
  ov.innerHTML='<video playsinline muted style="width:100%;max-height:78%;object-fit:cover"></video><div style="color:#fff;margin:10px 0;font-weight:700">وجّه الكاميرا على QR الفاتورة</div><button type="button" class="alt" style="min-height:40px;padding:0 24px">إغلاق</button>';
  document.body.appendChild(ov);const v=ov.querySelector('video');v.srcObject=stream;try{await v.play()}catch(e){}
  const det=new BarcodeDetector({formats:['qr_code']});let on=true;
  const stop=()=>{on=false;stream.getTracks().forEach(t=>t.stop());ov.remove()};ov.querySelector('button').onclick=stop;
  (async function loop(){while(on){try{const r=await det.detect(v);if(r&&r[0]&&on){const ok=found(r[0].rawValue);if(ok){stop();return}await new Promise(z=>setTimeout(z,1500))}}catch(e){}await new Promise(z=>setTimeout(z,250))}})()};
})();

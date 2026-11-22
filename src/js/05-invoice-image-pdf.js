/* ---------- رسم الصورة (بدون مكتبات) ---------- */
let lastSpec=null,curSpec=null;const logoImg=new Image();
const logoOK=()=>pget('logoOn',true)&&logoImg.complete&&logoImg.naturalWidth>0;
/* ---------- تصميم الفاتورة (قابل للتعديل من الإعدادات) ---------- */
const INV_G={bg:'#f7f3ea',marble:0,head:'#14233a',hfg:'#e5c675',ink:'#14233a',grid:'#d9cfb4',edge:'#b08d3c',totBg:'#14233a',totFg:'#e5c675',remBg:'#b08d3c',remFg:'#3a2a05',paidBg:'#ece7d4',paidFg:'#3d4a2c',sumA:'#efe8d4',sumB:'#f8f4ea',acc:['#b08d3c','#14233a','#8a7440','#5b6b82'],w:700,m:20,r:10,pad:10,fam:'sans',shop:18,title:22,sub:14,date:13,meta:15,th:14,tbl:15,sum:14,items:13,bold:0,sDate:1,sSub:1,sItems:1,hPrev:0,hSize:0,hCnt:0,hQty:0,hPrice:0,tint:17,sumH:30,sumW:40,sumBig:15,order:['tables','summary','notes'],topText:'',headText:'',footText:'',redNote:'',redColor:'#c0261b',xs:14,xal:'c',logoH:64,sumPos:'l',sumFit:1,shopC:'',sumV:0,hLine:1,sideSum:1,hdh:30,gw:1,ew:1.2,gap:10,tt:14,muteC:'#555555',retC:'#b42318',fTot:0,fRem:0,fPaid:0,hTot:0,hRem:0,hPaid:0,paidB:0,fTop:0,fHead:0,fFoot:0,fNote:0,rowCol:0,cw:null,ca:null,mtPos:'l',mtH:0,mtF:0,mtHide:0,sumR:8,gSep:2,gSepC:'#1f2937',gAlt:0,gAltC:'#dbe6f4'};
const INV_M={...INV_G,bg:'#eceef2',marble:1,head:'#1b2a41',hfg:'#e8cc86',ink:'#1b2a41',grid:'#cfd4dc',edge:'#c9a24d',totBg:'#1b2a41',totFg:'#e8cc86',remBg:'#d3b25e',remFg:'#1b2a41',paidBg:'#e4e8ee',paidFg:'#2f4a3a',sumA:'#e6e9ef',sumB:'#f4f5f8',acc:['#c9a24d','#1b2a41','#a8873a','#60708a']};
const INV_T={...INV_G,bg:'#ffffff',head:'#1f3a4d',hfg:'#ffffff',ink:'#111111',grid:'#c9d6d3',edge:'#6b7f7b',totBg:'#1f3a4d',totFg:'#ffffff',remBg:'#d4a537',remFg:'#3a2a05',paidBg:'#e3f1ea',paidFg:'#2e6b4f',sumA:'#e3eef0',sumB:'#f1f5f7',acc:['#4f9aa5','#d4a537','#8b6bb5','#d98282','#86b06a','#6d8fc2']};
const INV_B={...INV_G,bg:'#ffffff',marble:0,head:'#eeeeee',hfg:'#000000',ink:'#000000',grid:'#444444',edge:'#444444',totBg:'#e2f1ef',totFg:'#000000',remBg:'#e2f1ef',remFg:'#000000',paidBg:'#ffffff',paidFg:'#000000',sumA:'#ffffff',sumB:'#ffffff',acc:['#ffffff'],tint:0,r:0,shop:17,title:24,sub:14,date:13,meta:15,th:14,tbl:15,sum:15,sumBig:15,sumH:30,sumW:100,sumV:32,shopC:'#0f766e',xs:15,xal:'r',pad:10,hdh:30,gw:1,ew:1,gap:10,tt:14,muteC:'#555555',retC:'#b42318'};
const INV_MOB={...INV_G,mob:1,w:390,m:10,bg:'#ffffff',marble:0,head:'#4a76b0',hfg:'#ffffff',ink:'#111111',grid:'#1f2937',edge:'#1f2937',totBg:'#4a76b0',totFg:'#ffffff',remBg:'#4a76b0',remFg:'#ffffff',paidBg:'#dbe6f4',paidFg:'#111111',sumA:'#dbe6f4',sumB:'#ffffff',acc:['#ffffff'],tint:0,r:0,pad:4,shop:13,title:16,sub:10,date:10,meta:12,th:11,tbl:12,sum:12,sumBig:13,items:12,sumH:23,hdh:24,gw:1,ew:1.2,gap:7,tt:12,xs:11,xal:'c',logoH:36,shopC:'#16a34a',hNote:0,sideSum:1,itRow:0,itHead:0};
const MOB_KEYS=['mob','w','m','r','pad','shop','title','sub','date','meta','th','tbl','sum','sumBig','items','sumH','hdh','gw','ew','gap','tt','xs','xal','logoH','tint','sideSum','hLine','sumW','sumFit','sumPos','itRow','itHead'];
[INV_G,INV_M,INV_T,INV_B].forEach(t=>MOB_KEYS.forEach(k=>{t[k]=INV_MOB[k]}));
/* تحويل أي تصميم قديم (700 عرض) لتصميم الموبايل: بيحتفظ بالألوان والخط وإعدادات الإظهار، والأحجام من الموبايل */
function toMob(d){if(!d||d.mob)return d;const o={...INV_MOB};['bg','marble','head','hfg','ink','grid','edge','totBg','totFg','remBg','remFg','paidBg','paidFg','sumA','sumB','shopC','muteC','retC','redNote','redColor','topText','headText','footText','fam','sDate','sSub','sItems','hPrev','hNote','hSize','hCnt','hQty','hPrice','hLine','order','paidB','bold','fTot','fRem','fPaid','hTot','hRem','hPaid','fTop','fHead','fFoot','fNote'].forEach(k=>{if(d[k]!==undefined)o[k]=d[k]});if(!o.shopC)o.shopC=INV_MOB.shopC;return o}
const INV_BUILT=[{id:'b_mob',name:'موبايل (أزرق)',cfg:INV_MOB},{id:'b_g',name:'ذهبي على بيج',cfg:INV_G},{id:'b_m',name:'ذهبي على رخام',cfg:INV_M},{id:'b_t',name:'الأصلي (أخضر مزرق)',cfg:INV_T},{id:'b_b',name:'الأساسي (أبيض وأسود)',cfg:INV_B}];
/* v80: تطبيق شكل الموبايل مرة واحدة، والتصميم القديم بيتحفظ كقالب باسم «تصميمي السابق» */
try{if(!localStorage.getItem('mobMig80')){let old=null;try{old=JSON.parse(localStorage.getItem('invdesign')||'null')}catch(e){}
  if(old&&typeof old==='object'&&!old.mob){let t=[];try{t=JSON.parse(localStorage.getItem('invtpls')||'[]')||[]}catch(e){}if(!t.some(x=>x.name==='تصميمي السابق')){t.push({id:'u'+Date.now().toString(36)+'o',name:'تصميمي السابق',cfg:old});localStorage.setItem('invtpls',JSON.stringify(t))}}
  localStorage.setItem('invdesign',JSON.stringify({...INV_MOB,redNote:(old&&old.redNote)||'',redColor:(old&&old.redColor)||'#c0261b'}));localStorage.setItem('mobMig80','1')}}catch(e){}
/* v83: رجّع نوع الخط القديم بتاعك (من «تصميمي السابق») مرة واحدة */
try{if(!localStorage.getItem('fontMig83')){let t=[];try{t=JSON.parse(localStorage.getItem('invtpls')||'[]')||[]}catch(e){}const o=t.find(x=>x&&x.name==='تصميمي السابق');
  if(o&&o.cfg&&o.cfg.fam){let c=null;try{c=JSON.parse(localStorage.getItem('invdesign')||'null')}catch(e){}if(c&&typeof c==='object'){c.fam=o.cfg.fam;localStorage.setItem('invdesign',JSON.stringify(c))}}
  localStorage.setItem('fontMig83','1')}}catch(e){}
const INV_FAM={sans:'Tahoma, Arial, "Noto Naskh Arabic", sans-serif',naskh:'"Noto Naskh Arabic", Tahoma, serif',serif:'"Times New Roman", "Noto Naskh Arabic", serif'};
function invd(){let st=null;try{st=JSON.parse(localStorage.getItem('invdesign')||'null')}catch(e){}
  if(st&&typeof st==='object'&&!st.mob){st=toMob(st);try{localStorage.setItem('invdesign',JSON.stringify(st))}catch(e){}}
  if(!st){let o='';try{o=localStorage.getItem('invpal')}catch(e){}st=o==='m'?INV_M:o==='g'?INV_G:INV_MOB}
  /* v89: رجّع ترتيب الملخص/الإجماليات للوضع الأساسي مرة واحدة (إعدادات قديمة كانت بتنزّل الإجماليات تحت الملخص) */
  try{if(st&&typeof st==='object'&&localStorage.getItem('invfix89')!=='1'){localStorage.setItem('invfix89','1');if(st.sideSum!=null||st.sumPos!=null){delete st.sideSum;delete st.sumPos;localStorage.setItem('invdesign',JSON.stringify(st))}}}catch(e){}
  const c={...INV_G,...st};c.w=390;/* v81: عرض الصورة دايماً بعرض التليفون مهما كان القالب */if(!Array.isArray(c.acc)||!c.acc.length)c.acc=INV_G.acc;if(!Array.isArray(c.order)||['tables','summary','notes'].some(k=>!c.order.includes(k)))c.order=INV_G.order.slice();c.famCss=INV_FAM[c.fam]||INV_FAM.sans;
  /* السطور الثابتة (واتساب/عنوان/إنستا) بقت من بيانات المحل، فالقوالب مش بتغيّرها */
  let sx=null;try{sx=JSON.parse(localStorage.getItem('shopTxt')||'null')}catch(e){}
  if(!sx||typeof sx!=='object'){sx={top:c.topText||'',head:c.headText||'',foot:c.footText||''};try{localStorage.setItem('shopTxt',JSON.stringify(sx))}catch(e){}}
  c.topText=sx.top||'';c.headText=sx.head||'';c.footText=sx.foot||'';return c}
const hexMix=(a,b,t)=>{const g=h=>{h=String(h||'#fff').replace('#','');if(h.length===3)h=h.split('').map(z=>z+z).join('');return[0,2,4].map(i=>parseInt(h.substr(i,2),16)||0)},A=g(a),B=g(b);return'#'+A.map((v,i)=>Math.round(v*t+B[i]*(1-t)).toString(16).padStart(2,'0')).join('')};
/* ---------- العلامة المائية: لوجو باهت ملون في النص + ختم مائل حسب حالة الفاتورة ---------- */
const WM_D={logo:1,la:10,ls:60,st:1,sa:30,ss:100,sp:'c',paid:1,qt:1,ret:1,img:1,pdf:1,prn:0,gray:1,th:0};
const WM_ST={paid:['خالص','#15803d'],qt:['عرض سعر','#1d4ed8'],ret:['مرتجع','#b42318']};
function wmCfg(){let o=null;try{o=JSON.parse(localStorage.getItem('invWm')||'null')}catch(e){}return{...WM_D,...(o&&typeof o==='object'?o:{})}}
function drawWM(x,W,H,o,TH,col){if(!o||!o.wm)return;const M=wmCfg(),out=o.out||'img';
  if(!(TH?M.th:out==='print'?M.prn:out==='pdf'?M.pdf:M.img))return;
  const gray=TH||(out==='print'&&M.gray),FF='Tahoma, Arial, "Noto Naskh Arabic", sans-serif';
  x.save();try{x.globalCompositeOperation='multiply'}catch(e){}if(gray)try{x.filter='grayscale(1)'}catch(e){}
  if(M.logo&&M.la>0){x.save();x.globalAlpha=Math.min(1,M.la/100);const mw=W*M.ls/100;
    if(logoImg.complete&&logoImg.naturalWidth>0){const k=Math.min(mw/logoImg.naturalWidth,H*.85/logoImg.naturalHeight),w=logoImg.naturalWidth*k,h=logoImg.naturalHeight*k;x.drawImage(logoImg,(W-w)/2,(H-h)/2,w,h)}
    else{const sn=shopN();let fs=90;x.font='bold '+fs+'px '+FF;const tw=x.measureText(sn).width||1;fs=Math.max(16,Math.min(fs*mw/tw,H*.5));
      x.font='bold '+fs+'px '+FF;x.direction=/[؀-ۿ]/.test(sn)?'rtl':'ltr';x.textAlign='center';x.textBaseline='middle';x.fillStyle=gray?'#000':(col||'#0f766e');
      x.translate(W/2,H/2);x.rotate(-Math.PI/14);x.fillText(sn,0,0)}
    x.restore()}
  const sk=o.st&&M.st&&M[o.st]&&WM_ST[o.st];
  if(sk&&M.sa>0){const lab=sk[0],c=gray?'#000':sk[1];let fs=Math.min(W,760)*.085*M.ss/100;fs=Math.max(14,Math.min(fs,H*.26));
    x.save();x.globalAlpha=Math.min(1,M.sa/100);x.translate(W/2,M.sp==='t'?H*.3:M.sp==='b'?H*.72:H*.5);x.rotate(-Math.PI/11);
    x.font='bold '+fs+'px '+FF;x.direction='rtl';x.textAlign='center';x.textBaseline='alphabetic';
    const mt=x.measureText(lab),asc=mt.actualBoundingBoxAscent||fs*.75,dsc=mt.actualBoundingBoxDescent||fs*.3,bw=mt.width+fs*1.3,bh=asc+dsc+fs*.9,box=(i,r)=>{x.beginPath();if(x.roundRect)x.roundRect(-bw/2+i,-bh/2+i,bw-2*i,bh-2*i,r);else x.rect(-bw/2+i,-bh/2+i,bw-2*i,bh-2*i)};
    x.strokeStyle=c;x.fillStyle=c;x.lineWidth=Math.max(3,fs*.09);box(0,fs*.28);x.stroke();x.lineWidth=Math.max(1.5,fs*.035);box(fs*.17,fs*.18);x.stroke();
    x.fillText(lab,0,(asc-dsc)/2);x.restore()}
  x.restore()}
/* لوجو طريقة الدفع في الفاتورة: اسم الطريقة بيتكتب كرمز (حرفين من -) وبيترسم مكانه اللوجو.
   الحرفين بياخدوا مساحة قريبة من اللوجو، فحسابات عرض الجدول بتفضل مظبوطة */
var PAY_TOK={'':'كاش','':'فودافون كاش','':'إنستاباي','\ue004':'فوري','\ue005':'فيزا','\ue006':'ماستركارد','\ue007':'ميزة'},payImgs=null;
/* v321: لوجوهات حقيقية لكل طريقة دفع معروفة (الأخص الأول) */
var PAY_LG=[['\ue004',/فوري|fawry/i],['\ue005',/فيزا|visa/i],['\ue006',/ماستر|master/i],['\ue007',/ميز[ةه]|meeza/i],['\ue003',/انستا|إنستا|insta/i],['',/محفظ|فودافون|vodafone|كاش/i]];
function payTok(n){n=String(n||'').trim();
  let c=!n||n==='نقدي'||n==='كاش'?'':'';if(!c){const m=PAY_LG.find(v=>v[1].test(n));if(m)c=m[0]}return c?c+c:''}
/* «المدفوع (لوجو)» أو «المدفوع (اسم الطريقة)» لو ملهاش لوجو */
const payLbl=(t,n,amt)=>{const k=amt>0?payTok(n):'';return t+(k?' '+k:n?' '+n:'')};
function drawRich(x,s,px,py,al,font,col){
  x.font=font;x.fillStyle=col;
  const segs=String(s).replace(/\(\s*([\ue001-\ue00f]+)\s*\)/g,'$1').split(/([\ue001-\ue00f]+)/).filter(v=>v.trim()),fz=+(String(font).match(/([\d.]+)px/)||[0,14])[1],h=fz*1.35,G=fz*.3;
  const it=segs.map(v=>{const im=/^[\ue001-\ue00f]/.test(v)&&payImgs&&payImgs[v[0]];
    if(im&&im.complete&&im.naturalWidth)return{im,w:h*im.naturalWidth/im.naturalHeight};const t=im||/^[\ue001-\ue00f]/.test(v)?PAY_TOK[v[0]]:v.trim();return{t,w:x.measureText(t).width}});
  const tw=it.reduce((a,v)=>a+v.w,0)+G*(it.length-1);let cx=al==='center'?px+tw/2:al==='left'?px+tw:px;
  x.textAlign='right';it.forEach(v=>{if(v.im)x.drawImage(v.im,cx-v.w,py-h/2,v.w,h);else x.fillText(v.t,cx,py);cx-=v.w+G})}
function sheet(o){lastSpec=o;const D=invd();
  const TH=o.paper==='t80'||o.paper==='t58',W=o.paper==='t58'?300:o.paper==='t80'?420:D.w,P=TH?8:D.m,IW=W-2*P,F=o.fancy&&!TH?D.famCss:'Tahoma, Arial, "Noto Naskh Arabic", sans-serif',mc=document.createElement('canvas').getContext('2d');
  const GR=TH?'#000':'#555',AC=TH?'#000':'#0f766e',nf=TH?13:15,nlh=TH?19:22;
  const wrap=(t,w,font)=>{mc.font=font;mc.direction='rtl';const out=[];let cur='';for(const wd of String(t==null?'':t).split(/\s+/)){const tr=cur?cur+' '+wd:wd;if(!cur||mc.measureText(tr).width<=w)cur=tr;else{out.push(cur);cur=wd}}out.push(cur);return out};
  /* v254: خانات الجدول سطر واحد دايمًا — الخط بيصغر شوية، ولو لسه مش مكفي الكلام بيتقص بـ… */
  const fit1=(t,w,z,bold)=>{let s=String(t==null?'':t).replace(/\s+/g,' ').trim(),zz=z;const mn=Math.max(8,z*.6),me=q=>{mc.font=(bold?'bold ':'')+zz+'px '+F;mc.direction='rtl';return mc.measureText(q).width};
    for(;zz>mn;zz-=.5)if(me(s)<=w)return{s,z:zz};zz=mn;if(me(s)<=w)return{s,z:zz};while(s.length>1&&me(s+'…')>w)s=s.slice(0,-1);return{s:s+'…',z:zz}};
  let _f,_ft;const fitF=(t,w,font)=>{const m=/^(bold )?([\d.]+)px (.*)$/.exec(font);if(!m)return{s:String(t==null?'':t),font};const q=fit1(t,w,+m[2],!!m[1]);return{s:q.s,font:(m[1]||'')+q.z+'px '+m[3]}};
  const paint=x=>{let y=10;x.direction='rtl';x.textBaseline='middle';
    const T=(s,px,py,al,font,col)=>{font=String(font).replace(/^bold /,'');if(/[\ue001-\ue00f]/.test(s))return drawRich(x,s,px,py,al,font,col||'#000');x.font=font;x.textAlign=al;x.fillStyle=col||'#000';x.fillText(String(s),px,py)};
    let lg=false;
    if(logoOK()){const k=Math.min(IW*(TH?.6:.26)/logoImg.naturalWidth,(TH?44:52)/logoImg.naturalHeight,1),w=logoImg.naturalWidth*k,h=logoImg.naturalHeight*k;x.drawImage(logoImg,TH?(W-w)/2:W-P-w,y,w,h);
      if(TH)y+=h+4;else{lg=true;x.direction='ltr';T(shopN(),P,y+h/2-9,'left','bold 17px '+F,AC);x.direction='rtl';T(o.date,P,y+h/2+11,'left','13px '+F,GR);y+=h+6}}
    if(lg){}else if(TH){x.direction='ltr';T(shopN(),W/2,y+10,'center','bold 17px '+F,AC);x.direction='rtl';y+=22;T(o.date,W/2,y+8,'center','12px '+F);y+=20}
    else{x.direction='ltr';T(shopN(),W-P,y+10,'right','bold 17px '+F,AC);x.direction='rtl';T(o.date,P,y+10,'left','13px '+F,GR);y+=22}
    const tf=(TH?'bold 20px ':'bold 24px ')+F;
    wrap(o.title||((custW()?custW()+' / ':'')+o.name),IW,tf).forEach(s=>{T(s,W/2,y+13,'center',tf);y+=TH?26:28});
    wrap(o.sub||'',IW,'14px '+F).forEach(s=>{T(s,W/2,y+7,'center','14px '+F,GR);y+=20});
    (o.meta||[]).forEach(m=>wrap(m,IW,'15px '+F).forEach(s=>{T(s,W-P,y+10,'right','15px '+F);y+=22}));y+=2;
    (o.tables||[]).forEach(tb=>{
      const tf=TH&&tb.th.length>(o.paper==='t58'?3:4)?12:15,lh=tf===12?17:22,pad=TH?6:10;
      if(tb.title){T(tb.title,W-P,y+10,'right','bold 15px '+F);y+=24}
      const ws=tb.w.map(v=>v*IW),hh=TH?26:30;let xr=W-P;if(!TH){x.fillStyle='#eee';x.fillRect(P,y,IW,hh)}x.strokeStyle=TH?'#000':'#444';
      tb.th.forEach((h,i)=>{T(h,xr-ws[i]/2,y+hh/2,'center',fit1(h,ws[i]-6,tf-1,0).z+'px '+F);x.strokeRect(xr-ws[i],y,ws[i],hh);xr-=ws[i]});y+=hh;
      tb.rows.forEach(row=>{const fz=[],ln=row.map((c,i)=>{const q=fit1(c,ws[i]-pad,tf,0);fz[i]=q.z;return[q.s]}),n=Math.max(...ln.map(l=>l.length)),rh=n*lh+pad;let xr=W-P;if(row.bg&&!TH){x.fillStyle=row.bg;x.fillRect(P,y,IW,rh)}
        row.forEach((c,i)=>{ln[i].forEach((s,k)=>T(s,xr-ws[i]/2,y+pad/2+lh*k+lh/2,'center',fz[i]+'px '+F));x.strokeRect(xr-ws[i],y,ws[i],rh);xr-=ws[i]});y+=rh});
      y+=8});
    if(o.sum){const lw=IW*.68,vw=IW-lw,sf=TH?14:15;o.sum.forEach(([a,b,bold])=>{const _g=fitF(a,lw-16,(bold?'bold ':'')+sf+'px '+F),fo=_g.font,ls=[_g.s],rh=Math.max(TH?26:30,ls.length*(sf+5)+8);
      if(bold&&!TH){x.fillStyle='#e2f1ef';x.fillRect(P,y,IW,rh)}
      ls.forEach((s,k)=>T(s,W-P-8,y+rh/2+(k-(ls.length-1)/2)*(sf+5),'right',fo));T(b,P+vw/2,y+rh/2,'center',fo);
      x.strokeStyle=TH?'#000':'#444';x.strokeRect(W-P-lw,y,lw,rh);x.strokeRect(P,y,vw,rh);y+=rh});y+=6}
    if(o.note){y+=6;wrap('ملاحظة: '+o.note,IW,nf+'px '+F).forEach(s=>{T(s,W-P,y+11,'right',nf+'px '+F);y+=nlh})}
    if(o.gn&&o.gn.length){y+=8;o.gn.forEach(n=>{const fo=(n.b?'bold ':'')+nf+'px '+F;String(n.t).split('\n').forEach(ln=>wrap(ln.trim()||' ',IW,fo).forEach(s=>{T(s,W-P,y+11,'right',fo,TH?'#000':(n.c||'#000'));y+=nlh}));y+=2})}
    else if(o.gnote){y+=8;String(o.gnote).split('\n').forEach(ln=>wrap(ln.trim()||' ',IW,nf+'px '+F).forEach(s=>{T(s,W-P,y+11,'right',nf+'px '+F);y+=nlh}))}
    if(typeof qrFoot==='function')y+=qrFoot(x,o,W,P,y,TH,F);return y+(TH?30:4)};
    const PL={bg:D.bg,mar:D.marble,head:D.head,hfg:D.hfg,ink:D.ink,grid:D.grid,edge:D.edge,tot:[D.totBg,D.totFg],gold:[D.remBg,D.remFg],paid:[D.paidBg,D.paidFg],lite:[D.sumA,D.ink],lite2:[D.sumB,D.ink],val:D.ink,rows:D.acc.map(c=>[hexMix(c,D.bg,D.tint/100),c])},PALF=PL.rows,HEADC=PL.head,GRIDC=PL.grid,EDGEC=PL.edge;
  const paintF=x=>{x.direction='rtl';x.textBaseline='middle';const LY=o.edit?[]:null,LR=r=>{if(LY)LY.push(r)},R=D.r,GR=D.muteC||'#555555',GP=D.gap==null?10:+D.gap;
    const T=(s,px,py,al,font,col)=>{font=String(font).replace(/^bold /,'');if(/[\ue001-\ue00f]/.test(s))return drawRich(x,s,px,py,al,font,col||PL.ink);x.font=font;x.textAlign=al;x.fillStyle=col||PL.ink;x.fillText(String(s),px,py)};
    const rr=(X,Y,w,h,r)=>{x.beginPath();if(x.roundRect)x.roundRect(X,Y,w,h,r);else x.rect(X,Y,w,h)};
    const xt=(txt,bold,col,sz,k)=>{const z=+sz||D.xs,al=D.xal==='r'?'right':D.xal==='l'?'left':'center',px=D.xal==='r'?W-P:D.xal==='l'?P:W/2,fo=(bold?'bold ':'')+z+'px '+F,y0=y;
      String(txt||'').split('\n').forEach(ln=>{ln=ln.trim();if(!ln)return;wrap(ln,IW,fo).forEach(q=>{T(q,px,y+z/2+4,al,fo,col);y+=z+8})});if(k&&y>y0)LR({t:'txt',k,x:P,y:y0,w:IW,h:y-y0})};
    let y=8;xt(D.topText,0,null,D.fTop,'top');const dp=String(o.date||'').trim().split(/\s+/),d1=dp[0]||'',d2=dp.slice(1).join(' ');
    let lw=0,lh=0;
    if(logoOK()){const LH=+D.logoH||64,k=Math.min(IW*Math.min(.5,.3*LH/64)/logoImg.naturalWidth,LH/logoImg.naturalHeight,Math.max(1,LH/64));lw=logoImg.naturalWidth*k;lh=logoImg.naturalHeight*k;x.drawImage(logoImg,W-P-lw,y,lw,lh);LR({t:'logo',x:W-P-lw,y,w:lw,h:lh})}
    else{const sn=shopN();x.font='bold '+D.shop+'px '+F;lw=Math.min(x.measureText(sn).width,IW*.3);lh=Math.max(44,D.shop*2);T(sn,W-P,y+lh/2,'right','bold '+D.shop+'px '+F,D.shopC||PL.ink);LR({t:'txt',k:'shop',x:W-P-lw,y,w:lw,h:lh})}
    if(D.sDate){T(d1,P,y+(lh>=44?lh/2-10:20),'left',D.date+'px '+F,GR);T(d2,P,y+(lh>=44?lh/2+10:40),'left',D.date+'px '+F,GR);LR({t:'txt',k:'date',x:P,y,w:95,h:Math.max(lh,44)})}
    const awS=W-2*(P+Math.max(lw,95)+12),stk=logoOK()&&awS<120,aw=stk?IW:awS,tt=o.title||((custW()?custW()+' / ':'')+o.name),tf=D.title+'px '+F;
    const TL=D.mob?22:28,SL=D.mob?16:20,tl=[(_ft=fitF(tt,aw,tf)).s],sl=D.sSub?wrap(o.sub||'',aw,D.sub+'px '+F).filter(Boolean):[],bh=tl.length*TL+sl.length*SL,hh=stk?lh+6+bh+4:Math.max(lh,bh+4,D.mob?40:48);
    /* لو اللوجو كبير ومفيش مكان جنبه، اسم العميل ينزل تحته بعرض الفاتورة */
    let ty=stk?y+lh+6:y+(hh-bh)/2;tl.forEach(s=>{T(s,W/2,ty+TL/2,'center',_ft.font);ty+=TL});sl.forEach(s=>{T(s,W/2,ty+SL/2,'center',D.sub+'px '+F,GR);ty+=SL});
    {const t0=stk?y+lh+6:y+(hh-bh)/2;LR({t:'txt',k:'title',x:(W-aw)/2,y:t0,w:aw,h:tl.length*TL});if(sl.length)LR({t:'txt',k:'sub',x:(W-aw)/2,y:t0+tl.length*TL,w:aw,h:sl.length*SL})}
    y+=hh+8;xt(D.headText,0,null,D.fHead,'head');
    (o.meta||[]).forEach(m=>wrap(m,IW,D.meta+'px '+F).forEach(s=>{T(s,W-P,y+10,'right',D.meta+'px '+F);y+=24}));
    const tbl=(tb,xr0,w,opt)=>{opt=opt||{};const AL=i=>{const a=opt.al&&opt.al[i];return a==='r'?'right':a==='l'?'left':'center'},AX=(xr,c,i)=>{const a=AL(i),px=Math.max(4,D.pad/2+3);return a==='right'?xr-px-(tb.col&&PALF.length?6:0):a==='left'?xr-c+px:xr-c/2};const fs=opt.fs||D.tbl,lhh=fs+(D.mob?4:7),hdh=opt.hh>0?opt.hh:Math.max(+D.hdh||30,D.th+(D.mob?7:16)),cw=tb.w.map(v=>v*w),pad=D.pad;
      const FS=[],lines=tb.rows.map((r,k)=>r.map((c,i)=>{const q=fit1(c,cw[i]-pad,fs,(opt.bold&&opt.bold(i))||D.bold);(FS[k]=FS[k]||[])[i]=q.z;return[q.s]})),rh=lines.map(l=>Math.max(Math.max(...l.map(a=>a.length))*lhh+pad,opt.rh||0)),h=hdh+rh.reduce((a,b)=>a+b,0),X=xr0-w;
      x.save();rr(X,y,w,h,R);x.clip();x.fillStyle=HEADC;x.fillRect(X,y,w,hdh);
      let yy=y+hdh;tb.rows.forEach((r,k)=>{/* v258: صفوف الجدول واخدة نفس لون مربع الإجماليات بالتبادل */x.fillStyle=k%2?D.sumA:D.sumB;x.fillRect(X,yy,w,rh[k]);if(D.gAlt&&tb.grp&&tb.grp[k]%2){x.fillStyle=D.gAltC||D.sumA;x.fillRect(X,yy,w,rh[k])}const c=tb.col&&tb.col[k];if(c!=null&&PALF[c%PALF.length]){x.fillStyle=PALF[c%PALF.length][0];x.fillRect(X,yy,w,rh[k]);x.fillStyle=PALF[c%PALF.length][1];x.fillRect(xr0-6,yy,6,rh[k])}yy+=rh[k]});
      x.strokeStyle=GRIDC;x.lineWidth=+D.gw||1;let xx=xr0;cw.forEach((c,i)=>{xx-=c;if(i<cw.length-1){x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+h);x.stroke()}});
      if(D.hLine!==0){x.beginPath();x.moveTo(X,y+hdh);x.lineTo(xr0,y+hdh);x.stroke()}
      yy=y+hdh;rh.forEach((g,k)=>{yy+=g;if(k<rh.length-1){const sp=tb.grp&&tb.grp[k]!==tb.grp[k+1]&&+D.gSep>0;x.save();if(sp){x.strokeStyle=D.gSepC||EDGEC;x.lineWidth=+D.gSep}x.beginPath();x.moveTo(X,yy);x.lineTo(xr0,yy);x.stroke();x.restore()}});x.restore();
      let xr=xr0;tb.th.forEach((t,i)=>{T(t,AX(xr,cw[i],i),y+hdh/2,AL(i),fit1(t,cw[i]-4,opt.fs?fs-1:D.th,0).z+'px '+F,PL.hfg);xr-=cw[i]});
      yy=y+hdh;tb.rows.forEach((r,k)=>{let xr=xr0;r.forEach((c,i)=>{const bold=opt.bold&&opt.bold(i),col=tb.red&&tb.red[k]?(D.retC||'#b42318'):(opt.colr&&opt.colr(i))||PL.ink;const zz=D.mob&&AL(i)==='center'&&tb.th[i]==='المقاس'&&/^\s*[\d.]+\s*\/\s*[\d.]+\s*$/.test(String(c));if(zz){const q=String(c).split('/').map(v=>v.trim()),xc=xr-cw[i]/2,off=5+(cw[i]-10)/4,ff=(D.bold?'bold ':'')+fs+'px '+F,my=yy+rh[k]/2;const gp=Math.round(fs*.7);let mA=0,mB=0;x.save();x.font=ff;tb.rows.forEach(rr=>{const cc=String(rr[i]);if(/^\s*[\d.]+\s*\/\s*[\d.]+\s*$/.test(cc)){const z=cc.split('/').map(v=>v.trim());mA=Math.max(mA,x.measureText(z[0]).width);mB=Math.max(mB,x.measureText(z[1]).width)}});x.restore();x.save();x.font=(fs-2)+'px '+F;const xw=x.measureText('×').width;x.restore();const gp2=2,tot=mB+gp2+xw+gp2+mA,xs=xc-tot/2,dc=D.decC||col,TD=(v,xx)=>{const m=String(v).match(/^(\d*)(\.\d+)?$/);if(!m||!m[2]||dc===col){T(v,xx,my,'left',ff,col);return}T(m[1],xx,my,'left',ff,col);x.save();x.font=ff;const iw=x.measureText(m[1]).width;x.restore();T('\u200E'+m[2],xx+iw,my,'left',ff,dc)};TD(q[1],xs);T('×',xs+mB+gp2+xw/2,my,'center',(fs-2)+'px '+F,GR);TD(q[0],xs+mB+gp2+xw+gp2)}else lines[k][i].forEach((s,j)=>T(s,AX(xr,cw[i],i),yy+(rh[k]-lines[k][i].length*lhh)/2+lhh*j+lhh/2,AL(i),(bold||D.bold?'bold ':'')+FS[k][i]+'px '+F,col));xr-=cw[i]});yy+=rh[k]});
      x.strokeStyle=EDGEC;x.lineWidth=D.ew==null?1.2:+D.ew;rr(X,y,w,h,R);x.stroke();if(opt.lid)LR({t:'tbl',id:opt.lid,X,y,w,h,hdh,rows:rh.slice(),cw:cw.slice(),xr0,th:tb.th.slice()});return h};
    const tstyle=(a,b)=>a==='الإجمالي'?PL.tot:/^(المتبقي|الحساب بعد الدفعة)$/.test(a)?PL.gold:/^(المدفوع|صافي المدفوع|صافي الدفعة|المبلغ المدفوع)( \(.*\))?$/.test(a)?PL.paid:b?PL.lite:PL.lite2;
    const rowFont=(a,bold)=>{const kd=a==='الإجمالي'?'Tot':/^(المتبقي|الحساب بعد الدفعة)$/.test(a)?'Rem':/^(المدفوع|صافي المدفوع|صافي الدفعة|المبلغ المدفوع)( \(.*\))?$/.test(a)?'Paid':'',fz=+D['f'+kd]||(bold?D.sumBig:D.sum),bb=bold||(kd==='Paid'&&D.paidB);return{kd,fz,fo:(bb?'bold ':'')+fz+'px '+F}};
    /* مربع الإجماليات صغير على قد محتواه */
    const fitDims=()=>{let lw=0,vm=0;(o.sum||[]).filter(r=>!(D.hPrev&&r[0]==='رصيد سابق')).forEach(([a,b,bold])=>{x.font=rowFont(a,bold).fo;lw=Math.max(lw,x.measureText(String(a)).width);vm=Math.max(vm,x.measureText(String(b)).width)});
      const vwF=Math.max(64,vm+26);return{w:Math.min(IW*.62,Math.max(150,lw+vwF+30)),vw:vwF}};
    const totals=(X,w,vw)=>{const rows=(o.sum||[]).filter(r=>!(D.hPrev&&r[0]==='رصيد سابق')).map(([a,b,bold])=>{const q=rowFont(a,bold),fz=q.fz,fo=(_f=fitF(a,w-vw-16,q.fo)).font,kd=q.kd,ls=[_f.s];return{a,b,fo,fz,ls,st:tstyle(a,bold),rh:Math.max(+D['h'+kd]||D.sumH,ls.length*(fz+4)+10)}}),h=rows.reduce((q,r)=>q+r.rh,0);
      x.save();rr(X,y,w,h,R);x.clip();let yy=y;rows.forEach(r=>{x.fillStyle=r.st[0];x.fillRect(X,yy,w,r.rh);yy+=r.rh});
      x.strokeStyle=GRIDC;x.lineWidth=+D.gw||1;yy=y;rows.forEach((r,k)=>{yy+=r.rh;if(k<rows.length-1){x.beginPath();x.moveTo(X,yy);x.lineTo(X+w,yy);x.stroke()}});x.beginPath();x.moveTo(X+vw,y);x.lineTo(X+vw,y+h);x.stroke();x.restore();
      yy=y;rows.forEach(r=>{r.ls.forEach((s,j)=>T(s,X+w-10,yy+r.rh/2+(j-(r.ls.length-1)/2)*(r.fz+4),'right',r.fo,r.st[1]));T(r.b,X+vw/2,yy+r.rh/2,'center',r.fo,r.st[1]);yy+=r.rh});
      x.strokeStyle=EDGEC;x.lineWidth=D.ew==null?1.2:+D.ew;rr(X,y,w,h,R);x.stroke();return h};
    const HID={'المقاس':D.hSize,'العدد':D.hCnt,'الكمية':D.hQty,'السعر':D.hPrice},tws=(o.tables&&o.tables[0]&&o.tables[0].th[0]==='البيان')?o.tables[0]:null;
    const hc=tb=>{if(tb!==tws)return tb;const k=tb.th.map((t,i)=>i).filter(i=>!HID[tb.th[i]]);if(k.length===tb.th.length||k.length<2)return tb;const sm=k.reduce((q,i)=>q+tb.w[i],0);return{...tb,th:k.map(i=>tb.th[i]),w:k.map(i=>tb.w[i]/sm),rows:tb.rows.map(r=>k.map(i=>r[i]))}};
    const tabs=(o.tables||[]).map(hc);let lastF=tabs[0]&&tabs[0].w.length?tabs[0].w[tabs[0].w.length-1]:.14;const vw=D.sumV?IW*D.sumV/100:IW*lastF,tw=IW*D.sumW/100;
    const MW={'البيان':.25,'المقاس':.17,'العدد':.09,'الكمية':.13,'السعر':.15,'القيمة':.21},
      rowBox=(X,Y,cw,tx,fl,fg,h,fo,rad)=>{let xr=X+cw.reduce((a,b)=>a+b,0);x.save();if(rad){rr(X,Y,cw.reduce((a,b)=>a+b,0),h,rad);x.clip()}cw.forEach((c,i)=>{x.fillStyle=fl[i];x.fillRect(xr-c,Y,c,h);xr-=c});x.strokeStyle=GRIDC;x.lineWidth=+D.gw||1;xr=X+cw.reduce((a,b)=>a+b,0);cw.forEach((c,i)=>{xr-=c;if(i<cw.length-1){x.beginPath();x.moveTo(xr,Y);x.lineTo(xr,Y+h);x.stroke()}});x.restore();
        xr=X+cw.reduce((a,b)=>a+b,0);cw.forEach((c,i)=>{T(tx[i],xr-c/2,Y+h/2,'center',fo[i]||fo[0],fg[i]);xr-=c});x.strokeStyle=EDGEC;x.lineWidth=D.ew==null?1.2:+D.ew;if(rad){rr(X,Y,cw.reduce((a,b)=>a+b,0),h,rad);x.stroke()}else x.strokeRect(X,Y,cw.reduce((a,b)=>a+b,0),h);return h};
    const secT=()=>{tabs.forEach((tb0,ti)=>{let tb=tb0;if(tb.title){T(tb.title,W-P,y+8,'right','bold '+(D.tt||14)+'px '+F);y+=D.tt?D.tt+6:20}
      const first=D.mob&&ti===0&&tb===tabs[0]&&o.tables&&o.tables[0]&&o.tables[0].th[0]==='البيان';
      if(D.mob){tb={...tb};if(!D.rowCol)delete tb.col;if(first){const CW=D.cw||{},mw=tb.th.map(t=>+CW[t]>0?+CW[t]/100:(MW[t]||0));if(mw.every(v=>v>0)){const sm=mw.reduce((a,b)=>a+b,0);tb.w=mw.map(v=>v/sm)}}}
      const h=tbl(tb,W-P,IW,first?{al:tb.th.map(t=>(D.ca||{})[t]||'c'),lid:'main'}:{});y+=h;
      if(first&&!D.mtHide&&tb.w.length>=3&&o.sum&&o.sum[0]&&/^إجمالي الإذن/.test(o.sum[0][0])){const n=tb.w.length,wl=tb.w[n-2]*IW,wv=tb.w[n-1]*IW,fo=(+D.mtF||Math.max(7,D.tbl))+'px '+F,mh=+D.mtH||Math.min(22,Math.max(14,D.sumH)),mX=D.mtPos==='r'?W-P-wl-wv:D.mtPos==='c'?(W-wl-wv)/2:P;LR({t:'mt',x:mX,y,w:wl+wv,h:mh});y+=rowBox(mX,y,[wl,wv],['الإجمالي',o.sum[0][1]],[HEADC,D.sumA],[PL.hfg,PL.ink],mh,[fo,fo],+D.sumR)}
      y+=GP})};
    /* مربع الإجماليات لما يكون لوحده: وسط (الافتراضي) أو يمين أو شمال */
    const sX=w=>D.sumPos==='r'?W-P-w:D.sumPos==='c'?(W-w)/2:P;
    const secSM=()=>{const its=D.sItems&&o.items&&o.items.length?o.items:null,rows0=(o.sum||[]).filter((r,i)=>!(D.hPrev&&r[0]==='رصيد سابق')&&!(o.tables&&o.tables.length&&i===0&&/^إجمالي الإذن/.test(r[0])));
      const rk=(a,bold)=>{const kd=a==='الإجمالي'?'Tot':/^(المتبقي|الحساب بعد الدفعة)$/.test(a)?'Rem':/^(المدفوع|صافي المدفوع|صافي الدفعة|المبلغ المدفوع)( \(.*\))?$/.test(a)?'Paid':'',fz=+D['f'+kd]||((kd==='Tot'||kd==='Rem')?D.sumBig:D.sum),bb=kd==='Tot'||kd==='Rem'||bold||(kd==='Paid'&&D.paidB);return{kd,fz,ff:(bb?'bold ':'')+fz+'px '+F,rh0:+D['h'+kd]||D.sumH}};
      let lwm=60,vwm=50;rows0.forEach(([a,b,bold])=>{x.font=rk(a,bold).ff;lwm=Math.max(lwm,x.measureText(String(a)).width+16);vwm=Math.max(vwm,x.measureText(String(b)).width+16)});
      const fit=D.sumFit!==0,GAP=9,SS=D.sideSum==null?1:+D.sideSum,side=!!its&&SS!==0;let tw=fit?Math.min(lwm+vwm,IW*(side?.5:.7)):IW*Math.min(side?.5:1,Math.max(.3,(+D.sumW||40)/100)),vw=fit?Math.min(vwm,tw*.55):tw*.5,lw;
      if(+D.sumV>0){vw=IW*D.sumV/100;if(fit)tw=Math.min(IW*(side?.5:.95),Math.max(tw,vw+lwm));vw=Math.min(vw,tw-40)}lw=tw-vw;{const need=lwm-4;if(lw<need){tw=Math.min(IW*(side?.5:.95),vw+need);lw=tw-vw}}
      const sw=its?(side?Math.round(IW-tw-GAP):IW):0;let hS=0;
      if(its){const nq=its.every(r=>r[2]==='-'),st=nq?{th:['الصنف','العدد','القيمة'],w:[.44,.22,.34],rows:its.map(r=>[r[0],r[1],r[4]])}:{th:['الصنف','العدد','الأمتار','القيمة'],w:[.33,.17,.22,.28],rows:its.map(r=>[r[0],r[1],r[2],r[4]])},h1=tbl(st,W-P,sw,{fs:D.items,rh:+D.itRow||0,hh:+D.itHead||0,lid:'items'});const it=o.itemsTot||{},cw=st.w.map(v=>v*sw),fo2='bold '+D.items+'px '+F;
        hS=h1+rowBox(W-P-sw,y+h1,cw,nq?['الإجمالي',String(it.c==null?'':it.c),it.v==null?'':f(it.v)]:['الإجمالي',String(it.c==null?'':it.c),it.q?fq(it.q):'-',it.v==null?'':f(it.v)],nq?[HEADC,D.sumA,D.sumA]:[HEADC,D.sumA,D.sumA,D.sumA],nq?[PL.hfg,PL.ink,PL.ink]:[PL.hfg,PL.ink,PL.ink,PL.ink],+D.itRow||D.sumH,[fo2],[0,0,R,R])}
      if(its&&!side){y+=hS+GP;hS=0}
      const X=side?P:(D.sumPos==='r'?W-P-tw:D.sumPos==='c'?(W-tw)/2:P);let hT=0,yy=y,nI=0,RW=[];
      let hPre=0;rows0.forEach(([a,b,bold])=>{const q=rk(a,bold),ls=(_f=fitF(a,lw-8,q.ff),q.ff=_f.font,[_f.s]);hPre+=Math.max(q.rh0,ls.length*(q.fz+4)+4)});x.save();rr(X,y,tw,hPre,+D.sumR);x.clip();
      rows0.forEach(([a,b,bold])=>{const q=rk(a,bold),last=q.kd==='Rem',ls=(_f=fitF(a,lw-8,q.ff),q.ff=_f.font,[_f.s]),rh=Math.max(q.rh0,ls.length*(q.fz+4)+4),
          lc=last?PL.gold:q.kd==='Tot'?PL.tot:[HEADC,PL.hfg],vc=last?PL.gold:q.kd==='Paid'?PL.paid:q.kd==='Tot'?[D.sumA,PL.ink]:[(nI++%2?D.sumB:D.sumA),PL.ink];
        x.save();x.fillStyle=lc[0];x.fillRect(X+vw,yy,lw,rh);x.fillStyle=vc[0];x.fillRect(X,yy,vw,rh);x.restore();
        x.strokeStyle=GRIDC;x.lineWidth=+D.gw||1;x.beginPath();x.moveTo(X+vw,yy);x.lineTo(X+vw,yy+rh);x.stroke();x.beginPath();x.moveTo(X,yy+rh);x.lineTo(X+tw,yy+rh);x.stroke();
        RW.push({y:yy,h:rh,kd:q.kd});ls.forEach((t,j)=>T(t,X+vw+lw/2,yy+rh/2+(j-(ls.length-1)/2)*(q.fz+4),'center',q.ff,lc[1]));T(b,X+vw/2,yy+rh/2,'center',q.ff,vc[1]);yy+=rh});hT=yy-y;x.restore();
      if(hT){x.strokeStyle=EDGEC;x.lineWidth=D.ew==null?1.2:+D.ew;rr(X,y,tw,hT,+D.sumR);x.stroke();LR({t:'tot',X,y,w:tw,h:hT,vw,side,rows:RW})}
      y+=Math.max(hS,hT)+GP};
    const secS=()=>{if(D.mob)return secSM();const its=D.sItems?o.items:null;
      if(its&&its.length){T('ملخص الأصناف',W-P,y+8,'right','bold '+(D.tt||14)+'px '+F);y+=D.tt?D.tt+6:20;
        const FT=D.sumFit!==0,fd=FT?fitDims():null,SS=D.sideSum==null?1:+D.sideSum,fS=SS===2,tw1=FT?fd.w:tw,vw1=FT?fd.vw:vw,twS=fS&&!FT?Math.min(tw,IW*.45):tw1,vwS=fS&&!FT?Math.min(vw,twS*.5):vw1,side=SS!==0&&(fS||(its.length<=5&&(IW-tw1-12)>=IW*.35)),nq=its.every(r=>r[2]==='-'),st=nq?{th:['الصنف','العدد','السعر','القيمة'],w:[.4,.14,.2,.26],rows:its.map(r=>[r[0],r[1],r[3],r[4]]),col:its.map(r=>r[5])}:{th:['الصنف','العدد','الأمتار','السعر','القيمة'],w:[.34,.1,.16,.16,.24],rows:its.map(r=>r.slice(0,5)),col:its.map(r=>r[5])},lc=st.th.length-1;
        const sh=tbl(st,W-P,side?IW-twS-12:IW,{fs:D.items,bold:i=>i===0||i===lc,colr:i=>i===lc?PL.val:null});
        if(side){const th2=totals(P,twS,vwS);y+=Math.max(sh,th2)+GP}else{y+=sh+GP;y+=totals(sX(tw1),tw1,vw1)+GP}}
      else if(o.sum&&o.sum.length){const FT=D.sumFit!==0,fd=FT?fitDims():null,w=FT?fd.w:Math.min(IW,Math.max(IW*Math.max(.5,D.sumW/100),vw+130));y+=totals(sX(w),w,FT?fd.vw:vw)+GP}};
    const secN=()=>{if(D.hNote)return;
      if(o.note){y+=2;xt('ملاحظة: '+o.note,0,null,D.fNote,'note')}
      if(o.gn&&o.gn.length){y+=6;o.gn.forEach(n=>{xt(n.t,n.b,n.c||PL.ink,D.fNote,'notes');y+=2})}
      else{if(o.gnote){y+=8;xt(o.gnote,0,null,D.fNote,'notes')}
        if(String(D.redNote||'').trim()){y+=6;xt(D.redNote,1,D.redColor,D.fNote,'notes')}}};
    const secP=()=>{const ps=o.ps;if(!ps||!ps.length)return;const fz=Math.round(W/24),ih=fz*1.5,lh=ih+8,G=fz*.4;y+=8;let cx=W-P;x.save();x.font='bold '+fz+'px '+F;x.fillStyle=PL.ink;x.textAlign='right';x.textBaseline='middle';
      ps.forEach(([k,v])=>{const im=payImgs&&payImgs[String(k)[0]];if(im&&im.complete&&im.naturalWidth){const iw=ih*im.naturalWidth/im.naturalHeight;x.drawImage(im,cx-iw,y,iw,ih);cx-=iw+G}else if(k){const t=PAY_TOK[String(k)[0]]||k;x.fillText(t,cx,y+ih/2);cx-=x.measureText(t).width+G}x.fillText(v,cx,y+ih/2);cx-=x.measureText(v).width+fz*1.6});x.restore();y+=lh};
    const SEC={tables:secT,summary:()=>{secS();secP()},notes:secN};D.order.forEach(k=>SEC[k]&&SEC[k]());
    if(String(D.footText||'').trim()){y+=6;xt(D.footText,0,null,D.fFoot,'foot')}
    if(typeof qrFoot==='function')y+=qrFoot(x,o,W,P,y,false,F);if(LY)window.__LAY={items:LY,W,H:y+8};return y+8};
  const pf=o.fancy&&!TH?paintF:paint;
  const H=Math.ceil(pf(mc)),cv=document.createElement('canvas');
  cv.width=W*2;cv.height=H*2;const x=cv.getContext('2d',{willReadFrequently:true});/* الرسم على المعالج: قراية الصورة من كارت الشاشة في الموبايل بطيئة */x.scale(2,2);if(pf===paintF){x.fillStyle=PL.bg;x.fillRect(0,0,W,H);if(PL.mar){const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#f4f5f7');g.addColorStop(.3,'#e6e9ee');g.addColorStop(.5,'#f6f7f9');g.addColorStop(.75,'#e3e6eb');g.addColorStop(1,'#f3f4f6');x.fillStyle=g;x.fillRect(0,0,W,H);x.strokeStyle='rgba(110,120,145,.08)';x.lineWidth=1;for(let i=-H;i<W;i+=58){x.beginPath();x.moveTo(i,0);x.lineTo(i+H*.45,H);x.stroke()}x.strokeStyle='rgba(110,120,145,.05)';for(let i=0;i<W+H;i+=140){x.beginPath();x.moveTo(i,0);x.lineTo(i-H*.7,H);x.stroke()}}}else{x.fillStyle='#fff';x.fillRect(0,0,W,H)}pf(x);drawWM(x,W,H,o,TH,pf===paintF?PL.head:AC);return cv}

/* [لوجو, المبلغ] لكل طريقة دفع، عشان تترسم تحت الإجماليات */
function payStrip(r,raw){if(PY(r))return r.pays.filter(y=>+y.a>0).map(y=>[payTok(y.n)||y.n,f(y.a)]);const v=+raw||0;return v>0?[[payTok(r.pfWhy)||r.pfWhy,f(v)]]:[]}
const nn=x=>x.rt?'مرتجع'+(x.src?' من فاتورة '+x.src:'')+' - '+x.n:x.n;
/* v284: الـQR بيتحط في الطباعة بس (qr=true)، مش في صورة الواتس ولا المعاينة ولا الـPDF */
function invSheet(r,paper,qr){const o=invSheet0(r,paper);if(qr&&r.type==='inv'&&pget('qrOn',true)&&window.qrText){try{o.qr=qrText(r)}catch(e){}}return o}
function invSheet0(r,paper){const TH=paper==='t80'||paper==='t58',fancy=!TH&&pget('fancyInv',true)&&!(r.rows||[]).some(x=>x.cols),lbl=x=>nn(x)+(x.q>0?(+x.w>0&&+x.h>0&&+x.w>+x.h?' ('+x.h+'/'+x.w+')':' ('+x.w+'/'+x.h+')'):'');const base={name:r.cname,date:stamp(r.ts),note:r.note,wm:1};
  const cd=(pureRet(r)?'مرتجع · ':'')+(r.code?'كود '+r.code+' · ':'')+(r.rcode?'كود المرتجع '+r.rcode+' · ':'');
  if(r.type==='pay')return{...base,fancy,ps:payStrip(r,r.pfv?r.amtRaw:r.amount),st:(+r.rest||0)<=0?'paid':'',...(Array.isArray(r.gn)?{gn:r.gn,gnote:r.gnote||''}:noteSnap()),sub:cd+(isGen()?'إيصال دفعة':'إذن دفعة')+(r.no?' رقم '+r.no:''),sum:[['الحساب قبل الدفعة',fb(r.prev)],...(PY(r)?[...r.pays.map(y=>[(payTok(y.n)||y.n)+(y.p>0?' (خصم '+fq(y.p)+'%)':''),f(y.a)]),...(r.pfv?[['إجمالي خصم التحويلات',f(r.pfv)]]:[]),['صافي الدفعة',f(r.amount),1]]:r.pfv?[[payLbl('المبلغ المدفوع',r.pfWhy,r.amtRaw),f(r.amtRaw)],['خصم '+fq(r.pf)+'% '+(payTok(r.pfWhy)||'من المدفوع'),f(r.pfv)],['صافي الدفعة',f(r.amount),1]]:[[payLbl('المبلغ المدفوع',r.pfWhy,r.amount),f(r.amount),1]]),['الحساب بعد الدفعة',fb(r.rest),1]]};
  const RZ=/\s*(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*$/,rdz=x=>x.t==='rd'&&!(x.q>0)&&!x.rt?String(x.n).match(RZ):null,bn=x=>rdz(x)?String(x.n).replace(RZ,''):x.n,nb=x=>{const m=rdz(x);return m?nn(x).replace(RZ,''):nn(x)};
  const pl0=r.rows.filter(x=>!x.cols),pl=(()=>{const o={};let n=0;pl0.forEach(x=>{if(!(bn(x) in o))o[bn(x)]=n++});return pl0.map((x,i)=>[x,i]).sort((a,b)=>o[bn(a[0])]-o[bn(b[0])]||a[1]-b[1]).map(a=>a[0])})(),ar=pl.some(x=>x.q>0||(!TH&&rdz(x))),tables=[];
  const cmap={};let cn=0;pl.forEach(x=>{if(!(bn(x) in cmap))cmap[bn(x)]=cn++});
  const grp={},ord=[];pl.forEach(x=>{const k=bn(x)+'|'+(+x.p||0);if(!grp[k]){grp[k]={n:bn(x),p:+x.p||0,c:0,q:0,v:0,a:x.q>0};ord.push(k)}const sg=x.rt?-1:1;grp[k].c+=sg*(+x.c||0);grp[k].q+=sg*(+x.q||0);grp[k].v+=(+x.v||0)});
  const itemsTot=ord.reduce((a,k)=>{const y=grp[k];a.c+=y.c;a.q+=y.q;a.v+=y.v;return a},{c:0,q:0,v:0}),showSum=ord.length>=1,items=showSum?ord.map(k=>{const y=grp[k];return[y.n,String(y.c),y.a?fq(y.q):'-',f(y.p),f(y.v),cmap[y.n]]}):[];
  if(pl.length)tables.push(TH?(paper==='t58'?{th:['البيان','العدد','القيمة'],w:[.5,.14,.36],rows:pl.map(x=>[lbl(x),x.c,f(x.v)])}:{th:['البيان','العدد','السعر','القيمة'],w:[.4,.12,.24,.24],rows:pl.map(x=>[lbl(x),x.c,f(x.p),f(x.v)])}):ar?{th:['البيان','المقاس','العدد','الكمية','السعر','القيمة'],w:[.3,.16,.1,.14,.14,.16],rows:pl.map(x=>{const a=x.q>0,m=rdz(x);return[nb(x),a?(+x.w>+x.h?x.h+'/'+x.w:x.w+'/'+x.h):m?(+m[1]>+m[2]?m[2]+'/'+m[1]:m[1]+'/'+m[2]):'-',x.c,a?fq(x.q):'-',f(x.p),f(x.v)]})}
    :{th:['البيان','العدد','السعر','القيمة'],w:[.46,.14,.2,.2],rows:pl.map(x=>[nn(x),x.c,f(x.p),f(x.v)])});
  const G={};r.rows.filter(x=>x.cols).forEach(x=>(G[x.t]=G[x.t]||[]).push(x));
  if(fancy&&tables[0]){tables[0].col=pl.map(x=>cmap[bn(x)]);tables[0].red=pl.map(x=>!!x.rt)}
  if(!TH&&tables[0]&&pl.length){const gm={};let gn=0;tables[0].grp=pl.map(x=>{const k=bn(x);if(!(k in gm))gm[k]=gn++;return gm[k]})}
  if(TH&&items.length)tables.push({title:'ملخص الأصناف',th:['الصنف','العدد','القيمة'],w:[.5,.14,.36],rows:items.map(i=>[i[0],i[1],i[4]])});
  Object.values(G).forEach(g=>{const k=g[0].cols.length;tables.push({title:g[0].tn||'',th:['البيان',...g[0].cols.map(c=>c.l)],w:[.3,...g[0].cols.map(()=>.7/k)],rows:g.map(x=>[x.n,...x.cols.map(c=>c.v)])})});
  const sum=[[(isGen()?'إجمالي الأصناف':'إجمالي الإذن')+(r.tq>0?' ('+fq(r.tq)+' م²)':''),f(r.sub)]];(r.sums||[]).forEach(x=>sum.push(['إجمالي '+x.l,f(x.v)]));
  if(r.nylon)sum.push(['نولون',f(r.nylon)]);if(r.disc)sum.push(['خصم'+(r.discWhy?' ('+r.discWhy+')':''),f(r.disc)]);if(r.dpv)sum.push(['خصم '+fq(r.dp)+'%',f(r.dpv)]);
  sum.push(['رصيد سابق',fb(r.prev)],['الإجمالي',fb(r.total),1]);if(PY(r)){r.pays.forEach(y=>sum.push(['مدفوع '+(payTok(y.n)||y.n)+(y.p>0?' (خصم '+fq(y.p)+'%)':''),f(y.a)]));if(r.pfv)sum.push(['إجمالي خصم التحويلات',f(r.pfv)]);sum.push([r.pfv?'صافي المدفوع':'إجمالي المدفوع',f(r.paid+(r.refund||0))])}else if(r.pfv)sum.push([payLbl('المبلغ المدفوع',r.pfWhy,r.paidRaw),f(r.paidRaw)],['خصم '+fq(r.pf)+'% '+(payTok(r.pfWhy)||'من المدفوع'),f(r.pfv)],['صافي المدفوع',f(r.paid+(r.refund||0))]);else sum.push([payLbl('المدفوع',r.pfWhy,r.paid+(r.refund||0)),f(r.paid+(r.refund||0))]);if(r.refund)sum.push(['رد كاش للعميل',f(-r.refund)]);sum.push(['المتبقي',fb(r.rest),1]);
  return{...base,fancy,ps:payStrip(r,r.pfv?r.paidRaw:r.paid+(r.refund||0)),st:pureRet(r)?'ret':(+r.rest||0)<=0?'paid':'',items:fancy?items:[],itemsTot,sub:cd+((lsv('docw','إذن صرف')?lsv('docw','إذن صرف')+' ':'')+'رقم '+r.no),tables,sum,gnote:r.gnote||'',gn:Array.isArray(r.gn)?r.gn:null}}

/* ---------- عرض/حفظ/مشاركة الصورة ---------- */
let curBlob=null,curName='',curPhone='',baseMsg='',curRec=null;
const dataBlob=u=>{const b=atob(u.slice(u.indexOf(',')+1)),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new Blob([a],{type:'image/png'})};
/* علامة "جاري الفتح" بتظهر قبل الرسم، عشان الضغطة تبان على طول حتى على موبايل بطيء */
const busyOn=t=>{const b=$('busy');b.textContent=t;b.classList.remove('hide');return new Promise(r=>{const z=setTimeout(r,80);requestAnimationFrame(()=>setTimeout(()=>{clearTimeout(z);r()},0))})},busyOff=()=>$('busy').classList.add('hide');
async function dl(blob,name){
  try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);return'anchor'}catch(e){return'fail'}}
async function downloadCur(){if(!curBlob)return;const s=await dl(curBlob,curName);
  $('resm').textContent=baseMsg+({ok:' · تم حفظ الصورة ✓',anchor:' · تم تنزيل الصورة ✓',declined:' · تم الإلغاء',fail:' · اضغط مطولاً على الصورة لحفظها'}[s]||'')}
async function showImg(cv,name,msg,auto,phone,rec){
  /* toBlob بيستنى وقت فراغ المتصفح (ثانية على الكمبيوتر وثواني على الموبايل)، فبنحوّل الصورة مباشرة */
  curSpec=lastSpec;paperLabels();const imgURL=cv.toDataURL('image/png');curBlob=dataBlob(imgURL);curName=name;curPhone=phone||'';baseMsg=msg||'';curRec=rec||null;
  $('resundo').classList.toggle('hide',!(rec&&lastSaved&&lastSaved.id===rec.id&&Date.now()-lastSaved.at<10*60e3));$('resdel').classList.toggle('hide',!rec);$('resedit').classList.toggle('hide',!(rec&&pget('editInv',true)&&!(rec.rows||[]).some(x=>x.cols)));$('resdup').classList.toggle('hide',!(rec&&rec.type==='inv'&&pget('dupInv',true)&&!(rec.rows||[]).some(x=>x.cols)));{const rc=$('rescut');if(rc)rc.classList.toggle('hide',!(rec&&rec.type==='inv'&&(rec.rows||[]).some(x=>!x.rt&&x.t!=='rd'&&+x.w>0&&+x.h>0)))}disarm($('resdel'));$('resdel').textContent='🗑️ حذف';$('restx').classList.toggle('hide',!rec);$('resTxtBox').classList.toggle('hide',!rec);if(rec){$('resTxt').value=txtOf(rec);syncTx()}
  let canS=false;try{canS=!!(navigator.canShare&&navigator.canShare({files:[new File([curBlob],name,{type:'image/png'})]}))}catch(e){}
  const hasN=!!waNum(curPhone),sh=$('ressh');
  sh.classList.toggle('hide',!canS);$('reswa').classList.toggle('hide',canS&&!hasN);
  sh.classList.toggle('main',!hasN);sh.classList.toggle('b-green',!hasN);sh.classList.toggle('alt',hasN);sh.textContent=hasN?'📤 مشاركة':'📤 إرسال للعميل';$('reswa').style.flex=hasN?'1 1 100%':'';if(hasN)$('resdl').before(sh);else $('reswa').before(sh);
  $('reshint').textContent=hasN?'بيفتح شات العميل والصورة متنسخة: دوس مطولاً في خانة الرسالة واختار «لصق». لو اللصق ما ظهرش، استخدم «📤 مشاركة».':canS?'لو عايز الزرار يفتح شات العميل على طول، اكتب رقمه في بياناته.':'الصورة بتتنسخ ويتفتح شات العميل. الصقها (اضغط مطولاً ثم لصق) وأرسل.';
  $('resimg').src=imgURL;$('resm').textContent=baseMsg;$('res').classList.remove('hide');
  $('res').scrollTop=0;ordUI();
  if(auto)await downloadCur()}
$('resdl').onclick=downloadCur;$('resx').onclick=()=>$('res').classList.add('hide');
$('resdel').onclick=async()=>{if(!curRec)return;if(!ok2($('resdel')))return;const rr=curRec;if(!await guard(rr,'اكتب الرقم السري لحذف الفاتورة'))return;if(curRec!==rr)return;
  const cid=curRec.cid;trashPut(curRec);del('invoices',curRec.id);reflow(cid);curRec=null;$('res').classList.add('hide');drawCusts();drawDash();drawTrash();if(lastC){$('prev').value=balOf(lastC)||'';calc()}};
$('ressh').onclick=async()=>{if(!curBlob)return;const file=new File([curBlob],curName,{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:curName,text:curText()});return}catch(e){if(e&&e.name==='AbortError')return}}
  $('resm').textContent=baseMsg+' · المتصفح ده مش بيشارك صور، بنحفظ الصورة...';
  const r=await dl(curBlob,curName);
  $('resm').textContent=baseMsg+({ok:' · تم حفظ الصورة: افتح واتساب وأرفقها من المعرض أو الملفات',anchor:' · تم تنزيل الصورة: أرفقها في واتساب',declined:' · تم الإلغاء',fail:' · اضغط مطولاً على الصورة وشاركها'}[r]||'')};
/* ---------- PDF والطباعة (A4 أو ورق حراري) ---------- */
const PAPERS={a4:{n:'A4',w:595.28,h:841.89,m:28},t80:{n:'حراري 80',w:226.77,m:11},t58:{n:'حراري 58',w:164.41,m:8}};
const paperKey=()=>PAPERS[lsv('paper','a4')]?lsv('paper','a4'):'a4';
function paperLabels(){const n=PAPERS[paperKey()].n;$('respdf').textContent='📄 PDF · '+n;$('resprint').textContent='🖨 طباعة · '+n}
const renderPaper=(p,out)=>curRec?sheet({...invSheet(curRec,p,out==='print'),paper:p,out}):sheet({...curSpec,paper:p,out});
const jpgBytes=cv=>{const b=atob(cv.toDataURL('image/jpeg',.92).split(',')[1]),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
function buildPdf(pages){const enc=new TextEncoder(),parts=[],offs=[];let len=0;
  const push=b=>{const u=typeof b==='string'?enc.encode(b):b;parts.push(u);len+=u.length};
  const obj=(n,arr)=>{offs[n]=len;push(n+' 0 obj\n');arr.forEach(b=>push(b));push('\nendobj\n')};
  push('%PDF-1.4\n');const N=2+pages.length*3;
  obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2,['<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>']);
  pages.forEach((p,i)=>{const pg=3+i*3,ct=pg+1,im=pg+2,cs='q '+p.w.toFixed(2)+' 0 0 '+p.h.toFixed(2)+' '+p.x.toFixed(2)+' '+(p.ph-p.y-p.h).toFixed(2)+' cm /Im0 Do Q';
    obj(pg,['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+p.pw.toFixed(2)+' '+p.ph.toFixed(2)+'] /Resources << /XObject << /Im0 '+im+' 0 R >> >> /Contents '+ct+' 0 R >>']);
    obj(ct,['<< /Length '+cs.length+' >>\nstream\n',cs,'\nendstream']);
    obj(im,['<< /Type /XObject /Subtype /Image /Width '+p.iw+' /Height '+p.ih+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.jpg.length+' >>\nstream\n',p.jpg,'\nendstream'])});
  const xr=len;push('xref\n0 '+(N+1)+'\n0000000000 65535 f \n');for(let n=1;n<=N;n++)push(String(offs[n]).padStart(10,'0')+' 00000 n \n');
  push('trailer\n<< /Size '+(N+1)+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF');return new Blob(parts,{type:'application/pdf'})}
function pdfFor(cv,pk){const P=PAPERS[pk],pages=[];
  if(pk==='a4'){const iw=P.w-2*P.m,sc=iw/cv.width,sh=Math.floor((P.h-2*P.m)/sc);
    for(let y0=0;y0<cv.height;y0+=sh){const hh=Math.min(sh,cv.height-y0),c=document.createElement('canvas');c.width=cv.width;c.height=hh;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,hh);x.drawImage(cv,0,y0,cv.width,hh,0,0,cv.width,hh);
      pages.push({pw:P.w,ph:P.h,x:P.m,y:P.m,w:iw,h:hh*sc,iw:c.width,ih:hh,jpg:jpgBytes(c)})}}
  else{const iw=P.w-2*P.m,sc=iw/cv.width,h=cv.height*sc;pages.push({pw:P.w,ph:h+2*P.m,x:P.m,y:P.m,w:iw,h,iw:cv.width,ih:cv.height,jpg:jpgBytes(cv)})}
  return buildPdf(pages)}
$('respdf').onclick=async()=>{if(!curBlob)return;const m=$('resm');
  try{const pk=paperKey(),blob=pdfFor(renderPaper(pk,'pdf'),pk),name=curName.replace(/\.png$/i,'')+'.pdf',file=new File([blob],name,{type:'application/pdf'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:name});return}catch(e){if(e&&e.name==='AbortError')return}}
    const r=await dl(blob,name);m.textContent=baseMsg+({ok:' · تم حفظ الـ PDF ✓',anchor:' · تم تنزيل الـ PDF ✓'}[r]||' · الـ PDF متعملش، جرّب تاني')}
  catch(e){m.textContent=baseMsg+' · الـ PDF متعملش، جرّب تاني'}};
$('resprint').onclick=()=>{if(!curBlob)return;
  try{const pk=paperKey(),url=renderPaper(pk,'print').toDataURL('image/png'),css=pk==='a4'?'@page{size:A4;margin:10mm}body{margin:0}img{width:100%}':'@page{size:'+(pk==='t80'?'80':'58')+'mm auto;margin:0}body{margin:0}img{display:block;width:'+(pk==='t80'?72:48)+'mm;margin:0 auto}',
      f=document.createElement('iframe');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(f);
    const d=f.contentWindow.document;d.open();d.write('<!doctype html><html><head><meta charset="utf-8"><style>'+css+'</style></head><body><img id="i" src="'+url+'"></body></html>');d.close();
    const go=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){$('resm').textContent=baseMsg+' · الطباعة منفعتش، جرّب تاني'}setTimeout(()=>f.remove(),120000)},im=d.getElementById('i');
    if(im.complete)go();else im.onload=go}
  catch(e){$('resm').textContent=baseMsg+' · الطباعة منفعتش، جرّب تاني'}};

const TPLD={inv:'{المحل}\n{اللقب} / {العميل}\n{الفاتورة} - {التاريخ}\nالإجمالي: {الإجمالي}\nالمدفوع: {المدفوع}\nالمتبقي: {المتبقي}',pay:'{المحل}\n{اللقب} / {العميل}\nإيصال دفعة كود {الكود}: {المبلغ}\nالحساب بعد الدفعة: {الحساب}',rem:'السلام عليكم {اللقب} {العميل}\nحسابك عندنا في {المحل}: {الحساب} جنيه.\n{ختام_السداد}. شكراً لتعاملك معنا.',rdy:'السلام عليكم {اللقب} {العميل}\nطلبك (كود {الكود}) جاهز للاستلام من {المحل}.\n{الحساب}\nفي انتظارك، شكراً لتعاملك معنا.'};
/* v313: رسائل جاهزة بـ3 أساليب. كل رسالة (فاتورة/دفع/تذكير/جاهز) ليها اختياراتها لوحدها: n تحية واسم · d تفاصيل · x خصم · t أرقام · m طريقة الدفع · p بيانات الدفع · c ختام · s محل · e إيموجي */
const TPLG={
inv:{f:[['n','أهلاً {اللقب} {العميل} 👋'],['d','{الفاتورة} · {التاريخ}'],['x','الخصم: {الخصم} {سبب_الخصم}'],['t','الإجمالي: {الإجمالي}'],['t','المدفوع: {المدفوع}'],['t','الباقي عليك: {المتبقي}'],['m','طريقة الدفع: {طريقة_الدفع}'],['p','{بيانات_الدفع}'],['c','شكراً لتعاملك معنا 🙏'],['s','{المحل}']],
 o:[['n','{اللقب} {العميل} المحترم'],['d','{الفاتورة} بتاريخ {التاريخ}'],['x','الخصم: {الخصم} {سبب_الخصم}'],['t','إجمالي الفاتورة: {الإجمالي}'],['t','المبلغ المسدد: {المدفوع}'],['t','المبلغ المتبقي: {المتبقي}'],['m','طريقة السداد: {طريقة_الدفع}'],['p','{بيانات_الدفع}'],['c','نشكركم على ثقتكم.'],['s','{المحل}']],
 s:[['n','{اللقب} {العميل}'],['d','{الفاتورة} · {التاريخ}'],['x','خصم {الخصم} {سبب_الخصم}'],['t','إجمالي {الإجمالي} · مدفوع {المدفوع} · باقي {المتبقي}'],['m','{طريقة_الدفع}'],['p','{بيانات_الدفع}'],['c','شكراً 🙏'],['s','{المحل}']]},
pay:{f:[['n','أهلاً {اللقب} {العميل} 👋'],['','وصلتنا دفعتك {المبلغ} ✅ (إيصال كود {الكود})'],['m','طريقة الدفع: {طريقة_الدفع}'],['t','الحساب بعد الدفعة: {الحساب}'],['p','{بيانات_الدفع}'],['c','شكراً ليك 🙏'],['s','{المحل}']],
 o:[['n','{اللقب} {العميل} المحترم'],['','نفيدكم باستلام دفعة بمبلغ {المبلغ} (إيصال كود {الكود}).'],['m','طريقة السداد: {طريقة_الدفع}'],['t','رصيد الحساب بعد الدفعة: {الحساب}'],['p','{بيانات_الدفع}'],['c','نشكركم على حسن تعاونكم.'],['s','{المحل}']],
 s:[['n','{اللقب} {العميل}'],['','دفعة {المبلغ} ✅ (إيصال {الكود})'],['m','{طريقة_الدفع}'],['t','الحساب بعد الدفعة {الحساب}'],['p','{بيانات_الدفع}'],['c','شكراً 🙏'],['s','{المحل}']]},
rem:{f:[['n','أهلاً {اللقب} {العميل} 👋'],['t','حسابك عندنا {الحساب} جنيه.'],['','{ختام_السداد}'],['p','{بيانات_الدفع}'],['c','شكراً لتعاملك معنا 🙏'],['s','{المحل}']],
 o:[['n','{اللقب} {العميل} المحترم'],['t','نفيدكم بأن رصيد حسابكم لدينا {الحساب} جنيه.'],['','{ختام_السداد}'],['p','{بيانات_الدفع}'],['c','مع خالص الشكر.'],['s','{المحل}']],
 s:[['n','{اللقب} {العميل}'],['t','باقي عليك {الحساب} جنيه'],['','{ختام_السداد}'],['p','{بيانات_الدفع}'],['c','شكراً 🙏'],['s','{المحل}']]},
rdy:{f:[['n','أهلاً {اللقب} {العميل} 👋'],['','طلبك (كود {الكود}) جاهز تستلمه 🎉'],['t','{الحساب}'],['c','في انتظارك'],['s','{المحل}']],
 o:[['n','{اللقب} {العميل} المحترم'],['','نفيدكم بأن طلبكم (كود {الكود}) جاهز للاستلام.'],['t','{الحساب}'],['c','في انتظاركم.'],['s','{المحل}']],
 s:[['n','{اللقب} {العميل}'],['','طلبك (كود {الكود}) جاهز ✅'],['t','{الحساب}'],['c','في انتظارك'],['s','{المحل}']]}};
const MDEF={n:1,d:1,t:1,x:0,m:0,p:1,c:1,s:1,e:1},mo=(k,fl)=>pget('mo_'+k+'_'+fl,!!MDEF[fl]),EMO=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?/gu;
const msSt=k=>{const v=lsv('ms_'+k,'f');return TPLG[k][v]?v:'f'};
const tplGen=k=>{const mg=lsv('mg_'+k,'').trim(),mc=lsv('mc_'+k,'').trim();let s=TPLG[k][msSt(k)].filter(([fl])=>!fl||mo(k,fl)).map(([fl,t])=>fl==='n'&&mg?mg:fl==='c'&&mc?mc:t).join('\n');if(!mo(k,'e'))s=s.replace(EMO,'').replace(/ +\n/g,'\n').replace(/ +$/,'');return s};
const tplOf=k=>{const v=lsv('tpl_'+k,'');return v.trim()?v:tplGen(k)},shopN=()=>lsv('shop',''),docW=()=>lsv('docw','إذن صرف'),custW=()=>lsv('custw','الأستاذ');
function fillTpl(k,m,tp){m['اللقب']=custW();tp=tp||tplOf(k);if(!m['المحل'])tp=tp.replace(/\s(?:في|من|عند|لدى)\s\{المحل\}/g,'');return tp.split('\n').map(l=>{const had=/\{[^}]+\}/.test(l),o=l.replace(/\{([^}]+)\}/g,(x,key)=>key in m?m[key]:x).replace(/ {2,}/g,' ').replace(/^\s*\/\s*/,'');return{o,skip:had&&!o.trim()}}).filter(x=>x.skip===false).map(x=>x.o).join('\n')}
function txtOf(r){const m={'المحل':shopN(),'العميل':r.cname,'التاريخ':dshort(r.ts),'طريقة_الدفع':r.pfWhy||'','عمولة_الدفع':r.pfv?f(r.pfv):'','الخصم':r.disc?f(r.disc):'','سبب_الخصم':r.discWhy||''};
  m['الكود']=r.code?String(r.code):'';
  m['بيانات_الدفع']=r.rest>0?remPayTxt():'';
  if(r.type==='pay'){m['المبلغ']=f(r.amount);m['الحساب']=fb(r.rest);return fillTpl('pay',m)}
  m['كود_المرتجع']=r.rcode?String(r.rcode):'';
  m['الفاتورة']=(r.code?'كود '+r.code+' · ':'')+(docW()?docW()+' ':'')+'رقم '+r.no+(r.rcode?' · كود المرتجع '+r.rcode:'');m['الإجمالي']=fb(r.total);m['المدفوع']=f(r.paid);m['المتبقي']=fb(r.rest);return fillTpl('inv',m)}
/* رسالة التذكير: القالب + سطور بتتضاف لوحدها لو ليها قيمة (مدة عدم الدفع · أقدم فاتورة متأخرة · رصيد سابق · بيانات الدفع). كل صياغة بتتعدّل من الإعدادات، والصياغة بتتحزّم بعد عدد أيام وتبقى «تواصل معنا» بعد مدة أطول */
const dayW=d=>d===1?'يوم':d===2?'يومين':d<=10?d+' أيام':d+' يوم';
function lateInfo(c){let last=0,first=0;S.invoices.forEach(r=>{if(r.cid!==c.id)return;if(pd(r)>0&&r.ts>last)last=r.ts;if(!first||r.ts<first)first=r.ts});const t=last||first;return t?{d:Math.floor((Date.now()-t)/864e5),paid:!!last}:null}
const RT0={soft:'برجاء السداد في أقرب وقت',firm:'نرجو السداد خلال الأيام القادمة، لأن المبلغ متأخر من فترة',long:'برجاء التواصل معنا في أقرب وقت لترتيب السداد',paid:'مرّ {عدد} على آخر دفعة منك',never:'مرّ {عدد} من غير ما يتدفع حاجة',old:'أقدم فاتورة متأخرة: {التاريخ} · متبقي {المتبقي}',bal:'عليك رصيد سابق: {المبلغ}',pay:'للدفع: {البيانات}'};
const RTS={f:{soft:'لو تقدر تسدد في أقرب وقت يبقى تسلم إيدك',firm:'المبلغ متأخر من فترة، يا ريت نرتب السداد خلال الأيام الجاية',long:'يا ريت تكلمنا نرتب السداد مع بعض في أقرب وقت'},o:{soft:'نرجو التكرم بالسداد في أقرب وقت',firm:'نود التنويه بتأخر المبلغ، ونرجو السداد خلال الأيام القادمة',long:'نرجو التواصل معنا في أقرب وقت لترتيب سداد المستحقات'},s:{soft:'ياريت السداد قريب',firm:'المبلغ متأخر، ياريت السداد خلال أيام',long:'ياريت تتواصل معنا لترتيب السداد'}};
const rtDef=k=>(RTS[msSt('rem')]||RTS.f)[k]||RT0[k];
const rt=k=>{const v=lsv('rt_'+k,'').trim();return v||rtDef(k)},rtf=(s,o)=>s.replace(/\{([^}]+)\}/g,(x,k)=>k in o?o[k]:x);
const numSet=(k,d)=>{const v=parseInt(toEn(lsv(k,String(d))),10);return isNaN(v)?d:v},remFirmD=()=>numSet('remfirm',30),remLongD=()=>numSet('remlong',90);
const lateTxt=c=>{const li=lateInfo(c);return li&&li.d>=1?rtf(rt(li.paid?'paid':'never'),{'عدد':dayW(li.d)}):''};
const remPayTxt=()=>{const p=lsv('rempay','').trim()||pfAll().filter(x=>x.on!==false&&pmW(x,'msg')&&pmPick(x)).map(x=>x.n+' '+accShow(pmPick(x),x)).join(' · ');return p?rtf(rt('pay'),{'البيانات':p}):''};
const dueNow=r=>r.type==='inv'?Math.max(0,rd2(val(r)-(r.paid||0))):0;
const oldTxt=c=>{const l=S.invoices.filter(r=>r.cid===c.id);let pool=l.filter(r=>r.type==='pay').reduce((a,r)=>a+(+r.amount||0),0)+Math.max(0,-(+c.open||0)),o=null,rm=0;
  l.filter(r=>dueNow(r)>0).sort((a,b)=>a.ts-b.ts).forEach(r=>{const d=dueNow(r),u=Math.min(pool,d);pool-=u;if(!o&&d-u>0.004&&Date.now()-r.ts>=864e5){o=r;rm=rd2(d-u)}});return o?rtf(rt('old'),{'التاريخ':dshort(o.ts),'المتبقي':f(rm)}):''};
const balTxt=c=>+c.open>0?rtf(rt('bal'),{'المبلغ':f(c.open)}):'';
function remMake(m,tone){let tp=tplOf('rem');const end=tone==='long'?rt('long'):tone==='firm'?rt('firm'):rt('soft');m['ختام_السداد']=end;
  if(!tp.includes('{ختام_السداد}'))tp=tp.split(RT0.soft).join(end);
  const ins=(v,after)=>{if(!m[v]||tp.includes('{'+v+'}'))return;const ls=tp.split('\n');let i=-1,pre=false;for(const x of after||[]){i=ls.findIndex(l=>l.includes(x));if(i>=0){pre=x==='{ختام_السداد}';break}}ls.splice(i<0?ls.length:pre?i:i+1,0,'{'+v+'}');tp=ls.join('\n')};
  if(pget('remDays',true))ins('مدة_الدين',['{الحساب}','{ختام_السداد}']);if(pget('remOld',true))ins('أقدم_فاتورة',['{مدة_الدين}','{الحساب}','{ختام_السداد}']);if(pget('remBal',true))ins('رصيد_سابق',['{أقدم_فاتورة}','{مدة_الدين}','{الحساب}','{ختام_السداد}']);if(!tp.includes('{بيانات_الدفع}')&&mo('rem','p'))ins('بيانات_الدفع',null);
  return fillTpl('rem',m,tp)}
const remText=c=>{const li=lateInfo(c),fd=remFirmD(),ld=remLongD(),d=li?li.d:0;return remMake({'العميل':c.name,'المحل':shopN(),'الحساب':f(balOf(c)),'مدة_الدين':lateTxt(c),'أقدم_فاتورة':oldTxt(c),'رصيد_سابق':balTxt(c),'بيانات_الدفع':remPayTxt()},ld>0&&d>=ld?'long':fd>0&&d>=fd?'firm':'soft')};

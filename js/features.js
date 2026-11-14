/* إضافات بتتحمّل بعد التطبيق: ربط CutList بالفواتير · تصميم الفاتورة · منتقي الألوان · قفل المصحح الإملائي */
/* ===== CutList: ربط مخطط التقطيع بالفواتير ===== */
(function () {
  var host = document.getElementById('clHost');
  if (!host || !window.CutlistPlanner) return;
  // زرار الحاسبة العايم بيتخبى في صفحة CutList عشان ما يغطيش أزرار الرسم
  try { var st0 = document.createElement('style'); st0.textContent = 'body:has(#t-cl:not(.hide)) #calcFab{display:none!important}'; document.head.appendChild(st0); } catch (e) {}
  var SHEETS_KEY = 'cutlistSheets';   // مقاسات الشيتات اللي اتعلّمت لكل صنف
  var sheetsMap = function () { try { return JSON.parse(localStorage.getItem(SHEETS_KEY)) || {}; } catch (e) { return {}; } };
  var invList = function () { try { return (S && S.invoices) || []; } catch (e) { return []; } };
  var dateOf = function (ts) { try { return dshort(ts); } catch (e) { return ''; } };

  // فاتورة التطبيق → شكل CutList: الطول = h ، العرض = w (سم) ، العدد = c. البنود المرتجعة مش بتتحسب.
  function toCut(r) {
    return {
      code: r.code != null ? r.code : ('#' + (r.no || '')),
      customer: r.cname || '',
      date: dateOf(r.ts),
      items: (r.rows || []).filter(function (x) { return !x.rt && (+x.c || 0) > 0; }).map(function (x) {
        var cut = x.t !== 'rd' && +x.w > 0 && +x.h > 0;
        return { name: x.n || 'بدون اسم', l: cut ? +x.h : 0, w: cut ? +x.w : 0, q: +x.c || 0 };
      })
    };
  }
  function findByCode(code) {
    var n = String(code).trim(), l = invList();
    var r = l.find(function (x) { return x.type === 'inv' && String(x.code) === n; }) ||
            l.find(function (x) { return x.type === 'inv' && (x.oc || []).some(function (y) { return String(y) === n; }); });
    return r ? toCut(r) : null;
  }

  var appTheme = function () { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; };
  var cl = window.cutlist = CutlistPlanner.mount(host, {
    lang: 'ar',
    theme: appTheme(),
    storageKey: 'cutlistState',
    findInvoice: findByCode,
    exportPdf: function (cv, name) { dl(pdfFor(cv, 'a4'), name + '.pdf'); },
    stockFor: function (name) { var m = sheetsMap()[name]; return m && m.length ? m : null; },
    searchHint: 'اكتب كود الفاتورة عشان تنقل مقاسات البنود المقطعة',
    onResult: function () {
      // أول ما تحسب لصنف جاي من فاتورة، الشيتات اللي استخدمتها تتحفظ للصنف ده وتتقترح المرة الجاية
      try {
        var st = cl && cl.getState(); if (!st || !st.src || !st.src.name) return;
        var rows = st.stock.filter(function (r) { return r.on !== false && +toEn(r.l) > 0 && +toEn(r.w) > 0; })
          .map(function (r) { return { l: +toEn(r.l), w: +toEn(r.w), q: r.q === '' ? 1 : +toEn(r.q) || 1 }; });
        if (!rows.length) return;
        var m = sheetsMap(); m[st.src.name] = rows; localStorage.setItem(SHEETS_KEY, JSON.stringify(m));
      } catch (e) {}
    }
  });

  // الوضع الليلي: CutList يمشي مع ثيم التطبيق أول ما يتغير
  try {
    new MutationObserver(function () { var r = host.querySelector('.cl'); if (r) r.setAttribute('data-theme', appTheme()); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) {}

  // زرار «📐 تقطيع» في شاشة الفاتورة المحفوظة: يفتح CutList ويعرض أصناف الفاتورة على طول
  var btn = document.getElementById('rescut');
  if (btn) btn.onclick = function () {
    var r = (typeof curRec !== 'undefined') ? curRec : null; if (!r) return;
    document.getElementById('res').classList.add('hide');
    var tab = document.querySelector('#bnav button[data-t="cl"]'); if (tab) tab.click();
    cl.openInvoice(toCut(r));
  };
})();

/* ========== تصميم الفاتورة ========== */
(function(){
  const COLS=[['bg','لون الخلفية'],['head','هيدر الجدول'],['hfg','كلام الهيدر'],['ink','لون الكتابة'],['grid','خطوط الجدول'],['edge','الإطار'],['totBg','الإجمالي · خلفية'],['totFg','الإجمالي · كتابة'],['remBg','المتبقي · خلفية'],['remFg','المتبقي · كتابة'],['paidBg','المدفوع · خلفية'],['paidFg','المدفوع · كتابة'],['sumA','صفوف الملخص (1)'],['sumB','صفوف الملخص (2)'],['shopC','لون اسم المحل'],['muteC','لون التاريخ وسطر الكود'],['retC','لون بنود المرتجع'],['decC','لون الكسور في المقاس (.5)'],['gSepC','لون الفاصل بين الأصناف'],['gAltC','لون تظليل الصنف التاني']];
  const SIZES=[['logoH','حجم اللوجو',20,120,2],['m','الهوامش',2,50,1],['r','تدوير الزوايا',0,24,1],['pad','ارتفاع الصفوف',0,24,1],['hdh','ارتفاع هيدر الجدول',14,50,1],['itRow','ارتفاع صفوف ملخص الأصناف (0 = تلقائي)',0,60,1],['itHead','ارتفاع هيدر ملخص الأصناف (0 = تلقائي)',0,60,1],['gw','سمك خطوط الجدول',.5,4,.5],['sumR','تدوير زوايا مربعات الإجماليات',0,20,1],['gSep','سمك الفاصل بين الأصناف المختلفة (0 = بدون)',0,8,.5],['ew','سمك الإطار',0,4,.5],['gap','المسافة بين الأقسام',2,30,1],['sumV','عرض عمود الأرقام في الإجماليات (0 = تلقائي)',0,50,2]];
  const COLN=['البيان','المقاس','العدد','الكمية','السعر','القيمة'];
  const FONTS=[['shop','اسم المحل',8,34],['title','اسم العميل',9,36],['sub','سطر الكود',7,22],['date','التاريخ',7,22],['th','عناوين الجدول',7,22],['tbl','نص الجدول',7,24],['sum','الإجماليات',7,22],['items','ملخص الأصناف',7,22]];
  let cfg=invd(),cur='',tpls=[];
  const E=id=>document.getElementById(id);
  const loadT=()=>{try{tpls=JSON.parse(localStorage.getItem('invtpls')||'[]')||[]}catch(e){tpls=[]}};
  const saveT=()=>{try{localStorage.setItem('invtpls',JSON.stringify(tpls))}catch(e){}};
  const saveC=(chk)=>{try{const j=JSON.stringify(cfg);localStorage.setItem('invdesign',j);return !chk||localStorage.getItem('invdesign')===j}catch(e){return false}};
  const norm=c=>JSON.stringify(Object.keys(INV_G).sort().map(k=>c[k]===undefined?INV_G[k]:c[k]));
  const pvGen=()=>({fancy:true,paper:'a4',name:'محمد علي',date:'2026/10/25 3:02 م',sub:'كود 1001 · '+(lsv('docw','فاتورة')||'فاتورة')+' رقم 1',
        tables:[{th:['البيان','العدد','السعر','القيمة'],w:[.46,.14,.2,.2],rows:[['صنف أول','2','150','300'],['صنف تاني','1','864','864'],['صنف تالت','3','135','405']],col:[0,1,2],red:[0,0,0]}],
        items:[['صنف أول','2','-','150','300',0],['صنف تاني','1','-','864','864',1],['صنف تالت','3','-','135','405',2]],
        sum:[['إجمالي الأصناف','1,569'],['رصيد سابق','0'],['الإجمالي','1,569',1],['المدفوع','1,569'],['المتبقي','0',1]],gn:(typeof liveNotes==='function'?liveNotes():[]),wm:1,st:wmPrevSt(),note:'مثال لملاحظة الفاتورة',itemsTot:{c:6,q:0,v:1569}});
  const pvSpec=()=>isGen()?pvGen():({fancy:true,paper:'a4',name:'محمد علي',date:'2026/10/25 3:02 م',sub:'كود 1001 · إذن صرف رقم 1',
        tables:[{th:['البيان','المقاس','العدد','الكمية','السعر','القيمة'],w:[.3,.16,.1,.14,.14,.16],rows:[['زجاج سادة 6مم','100/50','2','1','300','300'],['سيكوريت 10مم','120/80','1','0.96','900','864'],['مرآة 5مم','90/60','3','1.62','250','405']],col:[0,1,2],red:[0,0,0]}],
        items:[['زجاج سادة 6مم','2','1','300','300',0],['سيكوريت 10مم','1','0.96','900','864',1],['مرآة 5مم','3','1.62','250','405',2]],
        sum:[['إجمالي الإذن (3.58 م²)','1,569'],['رصيد سابق','0'],['الإجمالي','1,569',1],['المدفوع','1,569'],['المتبقي','0',1]],gn:(typeof liveNotes==='function'?liveNotes():[]),wm:1,st:wmPrevSt(),note:'مثال لملاحظة الفاتورة',itemsTot:{c:6,q:3.58,v:1569}});
  let raf=0;
  const preview=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{
    const keep=lastSpec;try{
      const cv=sheet(pvSpec());
      const box=E('idPrev');box.innerHTML='';box.appendChild(cv)}catch(e){}lastSpec=keep})};
  /* إعدادات العلامة المائية (منفصلة عن القوالب زي اللوجو) */
  let wmPv='paid';const wmPrevSt=()=>wmPv;
  const wmSave=m=>{try{localStorage.setItem('invWm',JSON.stringify(m))}catch(e){}};
  function wmBuild(){const M=wmCfg(),has=logoImg.complete&&logoImg.naturalWidth>0,
      ck=(k,l)=>'<label class="idr"><span>'+l+'</span><input type="checkbox" data-wm="'+k+'"'+(M[k]?' checked':'')+'></label>',
      rg=(k,l,mn,mx,st,u)=>'<label class="idr"><span>'+l+'</span><input type="range" data-wm="'+k+'" min="'+mn+'" max="'+mx+'" step="'+(st||1)+'" value="'+M[k]+'"><span class="v">'+M[k]+(u||'')+'</span></label>',
      hd=t=>'<div class="idr" style="margin-top:12px"><b>'+t+'</b></div>';
    E('idWm').innerHTML=hd('اللوجو في نص الفاتورة')+ck('logo','إظهار اللوجو باهت في النص')+
      (has?'':'<div class="mute">مفيش لوجو مرفوع، فهيظهر اسم المحل مكانه. ارفع اللوجو من: الإعدادات ← بيانات المحل.</div>')+
      rg('la','الشفافية (كل ما يقل يبقى أخف)',2,40,1,'%')+rg('ls','الحجم من عرض الفاتورة',30,95,5,'%')+
      hd('الختم المائل')+ck('st','إظهار الختم حسب حالة الفاتورة')+ck('paid','«خالص» لما الحساب يبقى صفر')+ck('qt','«عرض سعر» على عروض الأسعار')+ck('ret','«مرتجع» على فواتير المرتجع')+
      rg('sa','الشفافية',10,80,5,'%')+rg('ss','الحجم',60,160,10,'%')+
      '<label class="idr"><span>مكانه</span><select data-wm="sp" style="flex:1.4"><option value="c">في النص</option><option value="t">فوق</option><option value="b">تحت</option></select></label>'+
      '<div class="idr"><span>شكل الختم في المعاينة</span></div><div class="qs" style="margin:4px 0 0">'+Object.keys(WM_ST).map(k=>'<button type="button" class="alt'+(k===wmPv?' b-acc':'')+'" data-wmp="'+k+'">'+WM_ST[k][0]+'</button>').join('')+'</div>'+
      hd('تظهر فين')+ck('img','الصورة ورسالة الواتساب')+ck('pdf','ملف الـ PDF')+ck('prn','الطباعة على ورق A4')+ck('gray','في الطباعة: بالرمادي بدل الألوان (توفير حبر)')+ck('th','الطابعة الحرارية (الإيصالات)')+
      '<div class="mute" style="margin-top:4px">الطابعة الحرارية مبتطبعش رمادي، فالعلامة ممكن تطلع نقط. الأحسن تفضل مقفولة.</div>';
    E('idWm').querySelector('select[data-wm="sp"]').value=M.sp}
  E('idWm').addEventListener('input',e=>{const t=e.target,k=t.dataset.wm;if(!k)return;const M=wmCfg();
    if(t.type==='checkbox')M[k]=t.checked?1:0;else if(t.type==='range'){M[k]=+t.value;const v=t.parentNode.querySelector('.v');if(v)v.textContent=t.value+'%'}else M[k]=t.value;
    wmSave(M);preview()});
  E('idWm').addEventListener('click',e=>{const b=e.target.closest('button[data-wmp]');if(!b)return;wmPv=b.dataset.wmp;wmBuild();preview()});
  function label(){E('idCur').textContent=cur?'القالب الحالي: '+cur:'تعديلات غير محفوظة كقالب';drawT()}
  const set=(k,v)=>{cfg[k]=v;cur='';saveC();label();preview()};
  const row=(lab,inner)=>'<label class="idr"><span>'+lab+'</span>'+inner+'</label>';
  function build(){
    E('idCol').innerHTML=COLS.map(([k,l])=>row(l,'<input type="color" data-c="'+k+'" value="'+(cfg[k]||cfg.ink)+'">')).join('')+
      '<div class="idr"><span>ألوان بنود الجدول (شريط جنب كل صنف)</span></div><div class="idr idacc">'+cfg.acc.map((c,i)=>'<input type="color" data-a="'+i+'" value="'+c+'">').join('')+'</div>'+
      row('تلوين صفوف الأصناف بالألوان دي','<input type="checkbox" data-b="rowCol"'+(cfg.rowCol?' checked':'')+'>')+'<div class="mute" style="margin-top:2px">شريط على جنب كل صنف وخلفية خفيفة بلونه. درجة الخلفية من: المحتوى والترتيب ← وضوح ألوان الصفوف.</div>'+
      row('خلفية رخام','<input type="checkbox" data-b="marble"'+(cfg.marble?' checked':'')+'>');
    E('idSize').innerHTML=SIZES.map(([k,l,mn,mx,st])=>row(l,'<input type="range" data-n="'+k+'" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+cfg[k]+'"><span class="v">'+cfg[k]+'</span>')).join('')+'<div class="mute" style="margin-top:6px">عرض أكبر = خط أصغر على الورق، وعرض أقل = خط أكبر.</div>';
    E('idFont').innerHTML=row('نوع الخط','<select data-f="fam" style="flex:1.4"><option value="sans">عادي (Tahoma)</option><option value="naskh">نسخ</option><option value="serif">كلاسيك</option></select>')+
      FONTS.map(([k,l,mn,mx])=>row(l,'<input type="range" data-n="'+k+'" min="'+mn+'" max="'+mx+'" value="'+cfg[k]+'"><span class="v">'+cfg[k]+'</span>')).join('');
    E('idFont').querySelector('select').value=cfg.fam;
    const ck=(k,l)=>row(l,'<input type="checkbox" data-b="'+k+'"'+(cfg[k]?' checked':'')+'>'),
      NAMES={tables:'جدول البنود',summary:'ملخص الأصناف والإجماليات',notes:'الملاحظات'};
    E('idCont').innerHTML=ck('sDate','إظهار التاريخ')+ck('sSub','إظهار سطر الكود ورقم الإذن')+ck('sItems','إظهار «ملخص الأصناف»')+ck('hPrev','إخفاء صف «رصيد سابق»')+ck('hNote','إخفاء الملاحظات (جملة التحويل وغيرها) من الفاتورة')+ck('hLine','خط تحت هيدر الجدول')+ck('mtHide','إخفاء صف «الإجمالي» اللي تحت الجدول')+ck('gAlt','تظليل كل صنف تاني بلون مختلف')+row('مكان صف «الإجمالي» تحت الجدول','<select data-f="mtPos" style="flex:1.4"><option value="l">شمال</option><option value="c">في النص</option><option value="r">يمين</option></select>')+row('مكان ملخص الأصناف','<select data-f="sideSum" style="flex:1.6"><option value="1">جنب الإجماليات</option><option value="0">فوق الإجماليات (بعرض كامل)</option></select>')+
      '<div class="idr"><span>إخفاء أعمدة من جدول البنود</span></div>'+ck('hSize','عمود المقاس')+ck('hCnt','عمود العدد')+ck('hQty','عمود الكمية')+ck('hPrice','عمود السعر')+
      row('وضوح ألوان الصفوف','<input type="range" data-n="tint" min="0" max="45" value="'+cfg.tint+'"><span class="v">'+cfg.tint+'</span>')+
      '<div class="idr"><span>ترتيب الأقسام (من فوق لتحت)</span></div>'+cfg.order.map((k,i)=>'<div class="idr"><span>'+(i+1)+' · '+NAMES[k]+'</span><button class="alt" data-o="'+k+'" data-d="-1"'+(i?'':' disabled')+'>↑</button><button class="alt" data-o="'+k+'" data-d="1"'+(i<cfg.order.length-1?'':' disabled')+'>↓</button></div>').join('');
    E('idCont').querySelector('select[data-f="mtPos"]').value=cfg.mtPos||'l';E('idCont').querySelector('select[data-f="sideSum"]').value=+cfg.sideSum===0?'0':'1';
    {const CW=cfg.cw||{},CA=cfg.ca||{},AO=[['c','وسط'],['r','يمين'],['l','شمال']];
    E('idCols').innerHTML='<div class="mute" style="margin:6px 0">العرض نسبة من عرض الجدول (0 = تلقائي). الأعمدة اللي على «تلقائي» بتاخد الباقي، والمجموع بيتظبط لوحده. الأعمدة المخفية من «المحتوى والترتيب» مش بتظهر.</div>'+
      COLN.map(n=>'<label class="idr"><span>'+n+'</span><input type="range" data-cw="'+n+'" min="0" max="90" value="'+(+CW[n]||0)+'"><span class="v">'+(+CW[n]?CW[n]+'%':'تلقائي')+'</span><select data-ca="'+n+'" style="flex:none;width:auto">'+AO.map(([v,l])=>'<option value="'+v+'"'+((CA[n]||'c')===v?' selected':'')+'>'+l+'</option>').join('')+'</select></label>').join('')+
      '<button type="button" class="alt" data-colreset="1" style="width:100%;margin-top:8px">رجّع كل الأعمدة تلقائي ووسط</button>'}
    E('idTot').innerHTML=row('ارتفاع كل مربع','<input type="range" data-n="sumH" min="14" max="64" value="'+cfg.sumH+'"><span class="v">'+cfg.sumH+'</span>')+
      row('عرض مربع الإجماليات','<input type="range" data-n="sumW" min="30" max="100" step="2" value="'+cfg.sumW+'"><span class="v">'+cfg.sumW+'</span>')+
      row('خط الإجمالي والمتبقي (الافتراضي)','<input type="range" data-n="sumBig" min="8" max="28" value="'+cfg.sumBig+'"><span class="v">'+cfg.sumBig+'</span>')+
      '<div class="idr" style="margin-top:12px"><b>حجم كل مربع لوحده (0 = زي الافتراضي)</b></div>'+
      [['fTot','خط «الإجمالي»',0,40],['hTot','ارتفاع «الإجمالي»',0,90],['fPaid','خط «المدفوع»',0,40],['hPaid','ارتفاع «المدفوع»',0,90],['fRem','خط «المتبقي»',0,40],['hRem','ارتفاع «المتبقي»',0,90]].map(([k,l,mn,mx])=>row(l,'<input type="range" data-n="'+k+'" min="'+mn+'" max="'+mx+'" value="'+(cfg[k]||0)+'"><span class="v">'+(cfg[k]||0)+'</span>')).join('')+
      row('خط باقي صفوف الإجماليات','<input type="range" data-n="sum" min="7" max="22" value="'+cfg.sum+'"><span class="v">'+cfg.sum+'</span>')+
      row('مكان مربع الإجماليات','<select data-f="sumPos" style="flex:1.4"><option value="l">شمال</option><option value="c">في النص</option><option value="r">يمين</option></select>')+
      row('عرض المربع تلقائي (صغير على قد الأرقام)','<input type="checkbox" data-b="sumFit"'+(cfg.sumFit!==0?' checked':'')+'>')+'<div class="mute" style="margin-top:4px">لو قفلت «تلقائي» بيمشي على «عرض مربع الإجماليات» اللي فوق. لما ملخص الأصناف يكون جنبه، المربع بيفضل على الشمال.</div>';
    E('idTot').querySelector('select').value=cfg.sumPos||'l';
    E('idTxt').innerHTML='<div class="mute" style="margin-top:6px">الملاحظات نفسها من: الإعدادات ← ملاحظات الفاتورة، والسطور الثابتة من: بيانات المحل.</div>'+
      row('حجم الخط (الافتراضي)','<input type="range" data-n="xs" min="7" max="26" value="'+cfg.xs+'"><span class="v">'+cfg.xs+'</span>')+
      [['fTop','حجم «فوق اللوجو»'],['fHead','حجم «تحت اللوجو»'],['fNote','حجم الملاحظات'],['fFoot','حجم «آخر الفاتورة»']].map(([k,l])=>row(l+' (0 = زي الافتراضي)','<input type="range" data-n="'+k+'" min="0" max="34" value="'+(cfg[k]||0)+'"><span class="v">'+(cfg[k]||0)+'</span>')).join('')+
      row('المحاذاة','<select data-f="xal" style="flex:1.4"><option value="c">وسط</option><option value="r">يمين</option><option value="l">شمال</option></select>');
    E('idTxt').querySelector('select').value=cfg.xal}
  function drawT(){loadT();const all=INV_BUILT.map(t=>({...t,b:1})).concat(tpls);
    E('idTpls').innerHTML=all.map(t=>'<button class="alt b-blue'+(t.name===cur?' on':'')+'" data-t="'+t.id+'">'+String(t.name).replace(/</g,'&lt;')+(t.b?'':'<span class="x" data-d="'+t.id+'">×</span>')+'</button>').join('')}
  E('idTpls').onclick=e=>{const d=e.target.dataset.d;
    if(d){e.stopPropagation();const t=tpls.find(x=>x.id===d);if(t&&confirm('تمسح قالب «'+t.name+'»؟')){tpls=tpls.filter(x=>x.id!==d);saveT();if(cur===t.name)cur='';label()}return}
    const b=e.target.closest('button[data-t]');if(!b)return;const t=INV_BUILT.concat(tpls).find(x=>x.id===b.dataset.t);if(!t)return;
    cfg={...INV_G,...toMob(JSON.parse(JSON.stringify(t.cfg)))};cur=t.name;saveC();build();label();preview()};
  E('idSave').onclick=()=>{const n=E('idName').value.trim();if(!n){E('idName').focus();return}loadT();
    if(INV_BUILT.some(t=>t.name===n)){E('idName').value='';E('idName').placeholder='الاسم ده محجوز، اختار اسم تاني';return}
    const ex=tpls.find(x=>x.name===n),o={id:ex?ex.id:'u'+Date.now().toString(36),name:n,cfg:JSON.parse(JSON.stringify(cfg))};
    if(ex)tpls[tpls.indexOf(ex)]=o;else tpls.push(o);saveT();cur=n;E('idName').value='';label()};
  E('idReset').onclick=()=>{cfg={...INV_G,acc:INV_G.acc.slice()};cur=INV_BUILT[0].name;saveC();build();label();preview()};
  const root=E('invDes');
  root.addEventListener('input',e=>{const t=e.target;
    if(t.dataset.c)set(t.dataset.c,t.value);
    else if(t.dataset.a!==undefined){const a=cfg.acc.slice();a[+t.dataset.a]=t.value;set('acc',a)}
    else if(t.dataset.cw){const v=+t.value,o={...(cfg.cw||{})};t.parentNode.querySelector('.v').textContent=v?v+'%':'تلقائي';o[t.dataset.cw]=v;set('cw',o)}
    else if(t.dataset.ca){const o={...(cfg.ca||{})};o[t.dataset.ca]=t.value;set('ca',o)}
    else if(t.dataset.n){const v=+t.value;t.parentNode.querySelector('.v').textContent=v;
      /* تحريك «عرض مربع الإجماليات» بيقفل «العرض التلقائي» عشان يبان أثره */
      if(t.dataset.n==='sumW'&&cfg.sumFit!==0){cfg.sumFit=0;const c=root.querySelector('[data-b="sumFit"]');if(c)c.checked=false}
      set(t.dataset.n,v)}
    else if(t.dataset.b)set(t.dataset.b,t.checked?1:0);
    else if(t.dataset.f)set(t.dataset.f,t.value);
    else if(t.dataset.x)set(t.dataset.x,t.value)});
  root.addEventListener('click',e=>{if(e.target.closest('[data-colreset]')){cfg.cw=null;cfg.ca=null;cur='';saveC();build();label();preview();return}const b=e.target.closest('button[data-o]');if(!b||b.disabled)return;const o=cfg.order.slice(),i=o.indexOf(b.dataset.o),j=i+(+b.dataset.d);if(i<0||j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];cfg.order=o;cur='';saveC();build();label();preview()});
  const msg=t=>{E('idMsg').textContent=t};
  E('idExp').onclick=()=>{loadT();const blob=new Blob([JSON.stringify({app:'eltabakha-invoice-templates',v:1,current:cfg,templates:tpls})],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='قوالب-الفاتورة.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);msg('تم تصدير '+tpls.length+' قالب (والتصميم الحالي)')};
  E('idImp').onclick=()=>E('idImpF').click();
  E('idImpF').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!o||o.app!=='eltabakha-invoice-templates'||!Array.isArray(o.templates))throw 0;loadT();let n=0;
      o.templates.forEach(t=>{if(!t||!t.name||!t.cfg||typeof t.cfg!=='object')return;let nm=String(t.name).slice(0,40);if(INV_BUILT.some(b=>b.name===nm))nm+=' (مستورد)';const ex=tpls.find(x=>x.name===nm),r={id:ex?ex.id:'u'+Date.now().toString(36)+n,name:nm,cfg:{...INV_G,...t.cfg}};if(ex)tpls[tpls.indexOf(ex)]=r;else tpls.push(r);n++});
      saveT();label();msg('اتضاف '+n+' قالب')}catch(x){msg('الملف مش قوالب فاتورة صالحة')}};rd.readAsText(f)};
  function open(){cfg=invd();cur='';loadT();const m=INV_BUILT.concat(tpls).find(t=>norm({...INV_G,...t.cfg})===norm(cfg));if(m)cur=m.name;
    root.classList.remove('hide');build();wmBuild();label();preview()}
  /* ===== ✋ صمّم بإيدك: تعديل الفاتورة بالسحب واللمس على المعاينة ===== */
  const DZ_SEL={
    shop:{n:'اسم المحل',f:['shop',8,34],c:[['shopC','اللون']]},
    title:{n:'اسم العميل',f:['title',9,36],c:[['ink','لون الكتابة (كل الفاتورة)']]},
    sub:{n:'سطر الكود',f:['sub',7,22],c:[['muteC','اللون (مع التاريخ)']]},
    date:{n:'التاريخ',f:['date',7,22],c:[['muteC','اللون (مع سطر الكود)']]},
    top:{n:'السطر اللي فوق',f:['fTop',6,34,'xs'],c:[['ink','لون الكتابة (كل الفاتورة)']]},
    head:{n:'السطر اللي تحت اللوجو',f:['fHead',6,34,'xs'],c:[['ink','لون الكتابة (كل الفاتورة)']]},
    foot:{n:'السطر الأخير',f:['fFoot',6,34,'xs'],c:[['ink','لون الكتابة (كل الفاتورة)']]},
    notes:{n:'الملاحظات',f:['fNote',6,34,'xs']},
    note:{n:'ملاحظة الفاتورة',f:['fNote',6,34,'xs'],c:[['ink','لون الكتابة (كل الفاتورة)']]},
    mainHead:{n:'عناوين الجدول',f:['th',7,22],c:[['head','الخلفية'],['hfg','الكتابة']]},
    mainBody:{n:'بنود الجدول',f:['tbl',7,24],c:[['ink','الكتابة'],['grid','الخطوط'],['edge','الإطار']]},
    itemsHead:{n:'عناوين ملخص الأصناف',f:['items',7,22],c:[['head','الخلفية'],['hfg','الكتابة']]},
    itemsBody:{n:'ملخص الأصناف',f:['items',7,22],c:[['ink','الكتابة'],['sumA','خلفية صف الإجمالي'],['grid','الخطوط']]},
    'tot:Tot':{n:'الإجمالي',f:['fTot',8,40,'sumBig'],c:[['totBg','خلفية العنوان'],['totFg','كتابة العنوان'],['sumA','خلفية الرقم']]},
    'tot:Rem':{n:'المتبقي',f:['fRem',8,40,'sumBig'],c:[['remBg','الخلفية'],['remFg','الكتابة']]},
    'tot:Paid':{n:'المدفوع',f:['fPaid',8,40,'sum'],c:[['paidBg','خلفية الرقم'],['paidFg','كتابة الرقم']]},
    'tot:':{n:'باقي صفوف الإجماليات',f:['sum',7,22],c:[['head','خلفية العنوان'],['hfg','كتابة العنوان'],['sumA','خلفية الرقم'],['sumB','خلفية الرقم (2)']]},
    mt:{n:'صف الإجمالي تحت الجدول',f:['mtF',7,30,'tbl'],c:[['head','خلفية العنوان'],['hfg','كتابة العنوان'],['sumA','خلفية الرقم']],b:['mtHide','إخفاء الصف ده']},
    logo:{n:'اللوجو',f:['logoH',20,120,null,4]},
    bg:{n:'خلفية الفاتورة',c:[['bg','لون الخلفية'],['edge','لون الإطارات']]}};
  const DZ_COLN=['البيان','المقاس','العدد','الكمية','السعر','القيمة'];
  let dzOv=null,dzLay=null,dzSel=null,dzDrag=null,dzRaf=0,dzHist=[];
  const dzCl=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dzPush=()=>{dzHist.push(JSON.stringify(cfg));if(dzHist.length>60)dzHist.shift();E('dzUndo').disabled=false};
  const dzSet=(k,v)=>{cfg[k]=v;cur='';saveC();label();dzDraw()};
  function dzMake(){dzOv=document.createElement('div');dzOv.id='dzOv';dzOv.className='dz-ov hide';
    dzOv.innerHTML='<div class="dz-top"><button type="button" class="alt" id="dzUndo" disabled aria-label="تراجع">↩ تراجع</button><div class="dz-tt"><b>✋ صمّم بإيدك</b><small>اسحب الخطوط المتقطعة · دوس على أي جزء عشان تكبّره أو تغيّر لونه</small></div><button type="button" class="main" id="dzX">💾 حفظ التعديل</button></div>'+
      '<div class="dz-wrap" id="dzWrap"><div class="dz-stage"><canvas id="dzCv"></canvas><canvas id="dzOl"></canvas></div><div style="height:46vh"></div></div><div class="dz-bar" id="dzBar" style="display:none"></div><div class="dz-tip" id="dzTip"></div>';
    document.body.appendChild(dzOv);
    E('dzX').onclick=()=>{const ok=saveC(true);dzClose();toast(ok?'اتحفظ ✓ التصميم ثابت ومش هيتغيّر':'⚠ مقدرتش أحفظ التصميم على الجهاز')};E('dzUndo').onclick=()=>{const p=dzHist.pop();if(p){cfg=JSON.parse(p);cur='';saveC();label();dzDraw();dzBar()}E('dzUndo').disabled=!dzHist.length};
    const ol=E('dzOl');
    ol.addEventListener('touchstart',e=>{const t=e.touches[0];if(e.touches.length===1&&dzHit(dzPt(t)))e.preventDefault()},{passive:false});
    ol.addEventListener('pointerdown',dzDown);ol.addEventListener('pointermove',dzMove);ol.addEventListener('pointerup',dzUp);ol.addEventListener('pointercancel',()=>{dzDrag=null;dzOver()});
    E('dzBar').addEventListener('click',dzBarClick);E('dzBar').addEventListener('input',dzBarInput)}
  function dzOpen(){if(!dzOv)dzMake();dzHist=[];E('dzUndo').disabled=true;dzSel=null;dzOv.classList.remove('hide');document.body.style.overflow='hidden';dzDraw();dzBar();
    dzTip('اسحب الخطوط المتقطعة عشان تغيّر المقاسات، ودوس على أي كلام عشان تكبّره أو تغيّر لونه')}
  function dzClose(){if(dzOv.classList.contains('hide'))return;dzOv.classList.add('hide');document.body.style.overflow='';build();label();preview()}
  let dzTipT=0;function dzTip(t){const el=E('dzTip');el.textContent=t;el.classList.add('on');clearTimeout(dzTipT);dzTipT=setTimeout(()=>el.classList.remove('on'),2600)}
  /* بنرسم نفس الفاتورة اللي في المعاينة بالظبط، مع تسجيل أماكن كل جزء */
  function dzDraw(){cancelAnimationFrame(dzRaf);dzRaf=requestAnimationFrame(()=>{const keep=lastSpec;try{
      const src=sheet({...pvSpec(),edit:1}),cv=E('dzCv');dzLay=window.__LAY||null;cv.width=src.width;cv.height=src.height;cv.getContext('2d').drawImage(src,0,0)}catch(e){}lastSpec=keep;dzOver();preview()})}
  const dzScale=()=>{const cv=E('dzCv');return dzLay?cv.getBoundingClientRect().width/dzLay.W:1};
  const dzPt=ev=>{const r=E('dzOl').getBoundingClientRect(),s=dzScale();return{x:(ev.clientX-r.left)/s,y:(ev.clientY-r.top)/s}};
  /* كل الخطوط اللي ينفع تتسحب */
  function dzHandles(){const H=[];if(!dzLay)return H;dzLay.items.forEach(it=>{
      if(it.t==='tbl'){let xx=it.xr0;it.cw.forEach((c,i)=>{xx-=c;if(it.id==='main'&&i<it.cw.length-1)H.push({k:'col',it,i,v:1,x:xx,y1:it.y,y2:it.y+it.h})});
        H.push({k:'hdr',it,v:0,y:it.y+it.hdh,x1:it.X,x2:it.X+it.w});let yy=it.y+it.hdh;it.rows.forEach((g,j)=>{yy+=g;H.push({k:'row',it,j,v:0,y:yy,x1:it.X,x2:it.X+it.w})})}
      else if(it.t==='tot'){H.push({k:'totV',it,v:1,x:it.X+it.vw,y1:it.y,y2:it.y+it.h});H.push({k:'totL',it,v:1,x:it.X,y1:it.y,y2:it.y+it.h});H.push({k:'totR',it,v:1,x:it.X+it.w,y1:it.y,y2:it.y+it.h});
        it.rows.forEach(r=>H.push({k:'totRow',it,r,v:0,y:r.y+r.h,x1:it.X,x2:it.X+it.w}))}
      else if(it.t==='mt')H.push({k:'mtRow',it,v:0,y:it.y+it.h,x1:it.x,x2:it.x+it.w});
      else if(it.t==='logo')H.push({k:'logo',it,pt:1,x:it.x,y:it.y+it.h})});return H}
  function dzHit(p){const tol=12/dzScale();let best=null,bd=1e9;const own=dzLay&&dzLay.items.find(it=>it.t==='mt'&&p.x>=it.x&&p.x<=it.x+it.w&&p.y>it.y+4&&p.y<=it.y+it.h+tol);dzHandles().forEach(h=>{if(own&&h.it!==own)return;let d;
      if(h.pt)d=Math.hypot(p.x-h.x,p.y-h.y)<=tol*1.6?Math.hypot(p.x-h.x,p.y-h.y)/2:1e9;
      else if(h.v)d=p.y>=h.y1-4&&p.y<=h.y2+4?Math.abs(p.x-h.x):1e9;else d=p.x>=h.x1-4&&p.x<=h.x2+4?Math.abs(p.y-h.y):1e9;
      if(d<=tol&&d<bd){bd=d;best=h}});return best}
  /* اللي اتداس عليه (للتكبير والألوان) */
  function dzPick(p){if(!dzLay)return'bg';let out='bg';const inn=(x,y,w,h)=>p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h;
    dzLay.items.forEach(it=>{if(it.t==='txt'&&inn(it.x,it.y,it.w,it.h))out=it.k;else if(it.t==='logo'&&inn(it.x,it.y,it.w,it.h))out='logo';else if(it.t==='mt'&&inn(it.x,it.y,it.w,it.h))out='mt';
      else if(it.t==='tbl'&&inn(it.X,it.y,it.w,it.h))out=(it.id==='main'?'main':'items')+(p.y<it.y+it.hdh?'Head':'Body');
      else if(it.t==='tot'&&inn(it.X,it.y,it.w,it.h)){const r=it.rows.find(r=>p.y>=r.y&&p.y<=r.y+r.h);out='tot:'+(r?r.kd:'')}});return out}
  function dzDown(e){const p=dzPt(e),h=dzHit(p);E('dzOl').setPointerCapture(e.pointerId);
    let body=null;if(!h&&dzLay)body=dzLay.items.find(it=>(it.t==='tot'&&p.x>=it.X&&p.x<=it.X+it.w&&p.y>=it.y&&p.y<=it.y+it.h)||(it.t==='mt'&&p.x>=it.x&&p.x<=it.x+it.w&&p.y>=it.y&&p.y<=it.y+it.h))||null;
    dzDrag={h,body,p0:p,moved:false,pushed:false,st:h?dzStart(h):body?{cx:(body.t==='mt'?body.x:body.X)+body.w/2}:null};dzOv.dataset.last=h?h.k:body?'body':'';if(h)dzOver(h)}
  function dzStart(h){const it=h.it;
    if(h.k==='col'){const th=it.th,tot=it.cw.reduce((a,b)=>a+b,0);return{fr:it.cw.map(c=>c/tot),th}}
    if(h.k==='hdr')return{v:it.id==='main'?+cfg.hdh||24:(+cfg.itHead||it.hdh)};
    if(h.k==='row')return{v:it.id==='main'?+cfg.pad||0:(+cfg.itRow||it.rows[h.j])};
    if(h.k==='totRow')return{v:h.r.h};if(h.k==='mtRow')return{v:it.h};
    if(h.k==='totV')return{v:it.vw};
    if(h.k==='totL'||h.k==='totR')return{v:it.w};
    if(h.k==='logo')return{v:+cfg.logoH||36};return{}}
  function dzMove(e){if(!dzDrag){const h=dzHit(dzPt(e));E('dzOl').style.cursor=h?(h.pt?'nwse-resize':h.v?'ew-resize':'ns-resize'):'pointer';return}
    const p=dzPt(e),dx=p.x-dzDrag.p0.x,dy=p.y-dzDrag.p0.y;if(!dzDrag.moved&&Math.hypot(dx,dy)*dzScale()<6)return;dzDrag.moved=true;
    const h=dzDrag.h,st=dzDrag.st;if(!h&&!dzDrag.body)return;if(!dzDrag.pushed){dzPush();dzDrag.pushed=true}
    if(dzDrag.body){const W=dzLay.W,cx=st.cx+dx,pos=cx<W*.38?'l':cx>W*.62?'r':'c';if(dzDrag.body.t==='mt'){if((cfg.mtPos||'l')!==pos){dzSet('mtPos',pos);dzTip('صف الإجمالي: '+({l:'شمال',c:'في النص',r:'يمين'})[pos])}return}if(pos!=='l'&&dzDrag.body.side&&+cfg.sideSum!==0){cfg.sideSum=0;dzTip('ملخص الأصناف اتنقل فوق الإجماليات عشان المربع يتحرك')}if(cfg.sumPos!==pos)dzSet('sumPos',pos);return}
    const it=h.it;
    if(h.k==='col'){const fr=st.fr.slice(),i=h.i,d=dx/it.w,m=.07;let a=fr[i]-d,b=fr[i+1]+d;if(a<m){b-=m-a;a=m}if(b<m){a-=m-b;b=m}fr[i]=a;fr[i+1]=b;
      const o={...(cfg.cw||{})};st.th.forEach((t,j)=>{o[t]=Math.round(fr[j]*100)});dzSet('cw',o);dzTip(st.th[i]+' '+Math.round(fr[i]*100)+'% · '+st.th[i+1]+' '+Math.round(fr[i+1]*100)+'%');return}
    if(h.k==='hdr'){const v=Math.round(dzCl(st.v+dy,12,60));dzSet(it.id==='main'?'hdh':'itHead',v);dzTip('ارتفاع العناوين: '+v);return}
    if(h.k==='row'){if(it.id==='main'){const v=Math.round(dzCl(st.v+dy,0,30));dzSet('pad',v);dzTip('ارتفاع الصفوف: '+v)}else{const v=Math.round(dzCl(st.v+dy,12,60));dzSet('itRow',v);dzTip('ارتفاع صفوف الملخص: '+v)}return}
    if(h.k==='totRow'){const k=h.r.kd?'h'+h.r.kd:'sumH',v=Math.round(dzCl(st.v+dy,14,90));dzSet(k,v);dzTip('ارتفاع الصف: '+v);return}
    if(h.k==='mtRow'){const v=Math.round(dzCl(st.v+dy,12,60));dzSet('mtH',v);dzTip('ارتفاع صف الإجمالي: '+v);return}
    if(h.k==='totV'){const IW=dzLay.W-2*(+cfg.m||10),v=Math.round(dzCl((st.v+dx)/IW*100,5,50));dzSet('sumV',v);dzTip('عرض عمود الأرقام: '+v+'%');return}
    if(h.k==='totL'||h.k==='totR'){const IW=dzLay.W-2*(+cfg.m||10),c=(cfg.sumPos==='c'&&!it.side)?2:1,w=st.v+(h.k==='totR'?dx:-dx)*c,v=Math.round(dzCl(w/IW*100,30,100));cfg.sumFit=0;dzSet('sumW',v);dzTip('عرض مربع الإجماليات: '+v+'%');return}
    if(h.k==='logo'){const v=Math.round(dzCl(st.v+(dy-dx)/2,20,120));dzSet('logoH',v);dzTip('حجم اللوجو: '+v)}}
  function dzUp(e){const d=dzDrag;dzDrag=null;if(!d)return;if(d.pushed)preview();if(!d.moved){dzSel=dzPick(d.p0);dzBar()}dzOver()}
  /* الخطوط المتقطعة اللي بتتسحب + تحديد الجزء المختار */
  function dzOver(act){const ol=E('dzOl'),cv=E('dzCv'),r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;ol.width=Math.round(r.width*dpr);ol.height=Math.round(r.height*dpr);
    const x=ol.getContext('2d'),s=dzScale();x.setTransform(dpr*s,0,0,dpr*s,0,0);x.clearRect(0,0,ol.width,ol.height);if(!dzLay)return;const lw=1/s;
    if(dzSel){const rs=[];dzLay.items.forEach(it=>{if(it.t==='txt'&&it.k===dzSel||(it.t==='logo'&&dzSel==='logo')||(it.t==='mt'&&dzSel==='mt'))rs.push([it.x,it.y,it.w,it.h]);
        if(it.t==='tbl'&&dzSel.startsWith(it.id))rs.push(dzSel.endsWith('Head')?[it.X,it.y,it.w,it.hdh]:[it.X,it.y+it.hdh,it.w,it.h-it.hdh]);
        if(it.t==='tot'&&dzSel.startsWith('tot:'))it.rows.forEach(r=>{if('tot:'+r.kd===dzSel)rs.push([it.X,r.y,it.w,r.h])})});
      if(dzSel==='bg')rs.push([2,2,dzLay.W-4,dzLay.H-4]);x.save();x.strokeStyle='#f59e0b';x.lineWidth=2.5*lw;x.fillStyle='rgba(245,158,11,.12)';rs.forEach(q=>{x.fillRect(q[0]-2*lw,q[1]-2*lw,q[2]+4*lw,q[3]+4*lw);x.strokeRect(q[0]-2*lw,q[1]-2*lw,q[2]+4*lw,q[3]+4*lw)});x.restore()}
    dzHandles().forEach(h=>{const on=act&&act.k===h.k&&act.it===h.it&&act.i===h.i&&act.j===h.j&&act.r===h.r;x.save();x.strokeStyle=on?'#f59e0b':'rgba(236,72,153,.85)';x.fillStyle=x.strokeStyle;x.lineWidth=(on?3:1.6)*lw;x.setLineDash(on?[]:[4*lw,3*lw]);
      if(h.pt){x.setLineDash([]);x.beginPath();x.arc(h.x,h.y,7*lw,0,7);x.fillStyle='#ec4899';x.fill();x.strokeStyle='#fff';x.lineWidth=2*lw;x.stroke()}
      else if(h.v){x.beginPath();x.moveTo(h.x,h.y1);x.lineTo(h.x,h.y2);x.stroke();x.setLineDash([]);x.beginPath();x.arc(h.x,(h.y1+h.y2)/2,4.5*lw,0,7);x.fill()}
      else{x.beginPath();x.moveTo(h.x1,h.y);x.lineTo(h.x2,h.y);x.stroke();x.setLineDash([]);x.beginPath();x.arc(h.x1+12*lw,h.y,4*lw,0,7);x.fill()}x.restore()})}
  /* الشريط اللي تحت: حجم الخط والألوان للجزء المختار */
  function dzBar(){const b=E('dzBar'),S0=dzSel&&DZ_SEL[dzSel];if(!S0){b.style.display='none';return}b.style.display='';
    let h='<div class="dz-bh"><b>'+S0.n+'</b><button type="button" class="lnk" data-dz="x" aria-label="إغلاق">✕</button></div><div class="dz-br">';
    if(S0.f){const[k,mn,mx,df]=S0.f,v=+cfg[k]||(df?+cfg[df]:0)||mn;h+='<div class="dz-fz"><button type="button" class="alt" data-dz="fm" aria-label="أصغر">A−</button><span class="num">'+v+'</span><button type="button" class="alt" data-dz="fp" aria-label="أكبر">A+</button></div>'}
    (S0.c||[]).forEach(([k,l])=>{h+='<label class="dz-c"><input type="color" data-dzc="'+k+'" value="'+(/^#[0-9a-f]{6}$/i.test(cfg[k]||'')?cfg[k]:(k==='shopC'?'#16a34a':'#111111'))+'"><span>'+l+'</span></label>'});
    if(S0.b)h+='<label class="dz-c"><input type="checkbox" data-dzb="'+S0.b[0]+'"'+(cfg[S0.b[0]]?' checked':'')+'><span>'+S0.b[1]+'</span></label>';
    if(dzSel==='mainHead'||dzSel==='mainBody')h+='<button type="button" class="alt" data-dz="al" style="flex-basis:100%">محاذاة الأعمدة: '+dzAlLbl()+'</button>';
    b.innerHTML=h+'</div>';dzOver()}
  const DZ_AL=['c','r','l'],DZ_ALN={c:'وسط',r:'يمين',l:'شمال'};
  const dzAlLbl=()=>{const a=cfg.ca||{},v=DZ_COLN.map(n=>a[n]||'c');return v.every(q=>q===v[0])?DZ_ALN[v[0]]:'مختلفة'};
  function dzBarClick(e){const b=e.target.closest('[data-dz]');if(!b)return;const S0=DZ_SEL[dzSel],a=b.dataset.dz;
    if(a==='x'){dzSel=null;dzBar();return}
    if(a==='fp'||a==='fm'){const[k,mn,mx,df,stp]=S0.f,v0=+cfg[k]||(df?+cfg[df]:0)||mn,v=dzCl(v0+(a==='fp'?1:-1)*(stp||1),mn,mx);dzPush();dzSet(k,v);dzBar();return}
    if(a==='al'){const a0=cfg.ca||{},c=a0[DZ_COLN[0]]||'c',n=DZ_AL[(DZ_AL.indexOf(c)+1)%3],o={};DZ_COLN.forEach(k=>o[k]=n);dzPush();dzSet('ca',o);dzBar();dzTip('محاذاة كل الأعمدة: '+DZ_ALN[n]+' (ولكل عمود لوحده من «أعمدة جدول البنود»)')}}
  let dzCP=0;function dzBarInput(e){const t=e.target;if(t.dataset.dzc){if(Date.now()-dzCP>1500)dzPush();dzCP=Date.now();dzSet(t.dataset.dzc,t.value)}else if(t.dataset.dzb){dzPush();dzSet(t.dataset.dzb,t.checked?1:0)}}
  addEventListener('resize',()=>{if(dzOv&&!dzOv.classList.contains('hide'))dzOver()});
  E('dzOpen').onclick=dzOpen;E('idPrev').addEventListener('click',dzOpen);
  window.invDesOpen=()=>{open();root.classList.toggle('off',!pget('fancyInv',true))};
  E('fancyInv').addEventListener('change',()=>root.classList.toggle('off',!E('fancyInv').checked));
})();

/* منتقي ألوان بمربع كبير (بدل منتقي الأندرويد الأصلي): بيشتغل على كل خانات اللون في البرنامج */
(function(){
  const $=id=>document.getElementById(id);let ov=null,tgt=null,orig='',h=0,sa=1,v=1,live=true;
  const hex2=n=>Math.round(n).toString(16).padStart(2,'0');
  const hsv2hex=(h,s,v)=>{const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return'#'+[f(5),f(3),f(1)].map(x=>hex2(x*255)).join('')};
  const hex2hsv=hx=>{hx=String(hx||'').trim().replace('#','');if(hx.length===3)hx=hx.split('').map(c=>c+c).join('');if(!/^[0-9a-f]{6}$/i.test(hx))return null;
    const r=parseInt(hx.substr(0,2),16)/255,g=parseInt(hx.substr(2,2),16)/255,b=parseInt(hx.substr(4,2),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let H=0;
    if(d){H=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;H*=60;if(H<0)H+=360}return{h:H,s:mx?d/mx:0,v:mx}};
  const PRE=['#ffffff','#000000','#14233a','#1f3a4d','#0f766e','#0e7490','#1d4ed8','#6d28d9','#be123c','#b42318','#c2410c','#b08d3c','#d4a537','#15803d','#86b06a','#6b7280'];
  function build(){ov=document.createElement('div');ov.className='cp-ov hide';ov.innerHTML=
    '<div class="cp-box" dir="rtl"><div class="cp-t"><span>اختيار اللون</span><small id="cpLab"></small></div>'+
    '<div class="cp-sv" id="cpSV"><div class="cp-k" id="cpSVk"></div></div>'+
    '<div class="cp-h" id="cpH"><div class="cp-k2" id="cpHk"></div></div>'+
    '<div class="cp-row"><div class="cp-sw"><span id="cpOld"></span><span id="cpNew"></span></div><input id="cpHex" maxlength="7" placeholder="#RRGGBB" autocomplete="off" spellcheck="false"></div>'+
    '<div id="cpUsedW"><div class="cp-lab">ألوان التصميم الحالي</div><div class="cp-pre" id="cpUsed"></div></div>'+
    '<div class="cp-lab">ألوان جاهزة</div><div class="cp-pre" id="cpPre"></div>'+
    '<div class="cp-btns"><button type="button" class="main" id="cpOk">تعيين</button><button type="button" class="alt" id="cpNo">✖️ إلغاء</button></div></div>';
    document.body.appendChild(ov);
    const drag=(el,fn)=>{let on=false;const mv=e=>{const r=el.getBoundingClientRect();fn(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)))};
      el.addEventListener('pointerdown',e=>{on=true;try{el.setPointerCapture(e.pointerId)}catch(_){}mv(e);e.preventDefault()});
      el.addEventListener('pointermove',e=>{if(on)mv(e)});['pointerup','pointercancel'].forEach(k=>el.addEventListener(k,()=>{on=false}))};
    drag($('cpSV'),(x,y)=>{sa=x;v=1-y;upd(1)});drag($('cpH'),x=>{h=x*360;upd(1)});
    $('cpHex').addEventListener('input',e=>{let t=e.target.value.trim();if(t&&t[0]!=='#')t='#'+t;const o=hex2hsv(t);if(o){h=o.h;sa=o.s;v=o.v;upd(0)}});
    $('cpPre').addEventListener('click',pick);$('cpUsed').addEventListener('click',pick);
    $('cpOk').onclick=()=>close(1);$('cpNo').onclick=()=>close(0);
    ov.addEventListener('pointerdown',e=>{if(e.target===ov)close(0)});
    document.addEventListener('keydown',e=>{if(ov&&!ov.classList.contains('hide')){if(e.key==='Escape')close(0);else if(e.key==='Enter'&&e.target.id==='cpHex')close(1)}})}
  function pick(e){const b=e.target.closest('button[data-c]');if(!b)return;const o=hex2hsv(b.dataset.c);if(o){h=o.h;sa=o.s;v=o.v;upd(1)}}
  function apply(hx){if(!tgt||tgt.value===hx)return;tgt.value=hx;tgt.dispatchEvent(new Event('input',{bubbles:true}));tgt.dispatchEvent(new Event('change',{bubbles:true}))}
  function upd(setHex){const hx=hsv2hex(h,sa,v);$('cpSV').style.setProperty('--cph',hsv2hex(h,1,1));
    $('cpSVk').style.left=(sa*100)+'%';$('cpSVk').style.top=((1-v)*100)+'%';$('cpSVk').style.background=hx;
    $('cpHk').style.left=(h/360*100)+'%';$('cpHk').style.background=hsv2hex(h,1,1);
    $('cpNew').style.background=hx;if(setHex)$('cpHex').value=hx;
    document.querySelectorAll('#cpPre button,#cpUsed button').forEach(b=>b.classList.toggle('on',b.dataset.c===hx));
    apply(hx)}
  function open(inp){if(!ov)build();tgt=inp;orig=inp.value||'#000000';const o=hex2hsv(orig)||{h:0,s:0,v:0};h=o.h;sa=o.s;v=o.v;
    const lb=inp.closest('label'),sp=lb&&lb.querySelector('span');$('cpLab').textContent=(sp&&sp.textContent.trim().slice(0,28))||inp.getAttribute('aria-label')||inp.title||'';
    $('cpOld').style.background=orig;
    const sw=c=>'<button type="button" data-c="'+c+'" style="background:'+c+'" aria-label="'+c+'"></button>';
    $('cpPre').innerHTML=PRE.map(sw).join('');
    const used=[...new Set([...document.querySelectorAll('#invDes input[type=color]')].map(i=>i.value.toLowerCase()))].filter(c=>c&&c!==orig.toLowerCase());
    $('cpUsed').innerHTML=used.map(sw).join('');$('cpUsedW').style.display=used.length?'':'none';
    ov.classList.remove('hide');upd(1)}
  function close(ok){if(!tgt)return;if(!ok)apply(orig);ov.classList.add('hide');tgt=null}
  /* نمنع منتقي الأندرويد الأصلي ونفتح بتاعنا */
  document.addEventListener('click',e=>{const i=e.target.closest&&e.target.closest('input[type=color]');if(!i||i.disabled)return;e.preventDefault();e.stopPropagation();open(i)},true);
})();

/* من غير خط أحمر ولا «إضافة للقاموس»: نقفل المصحح الإملائي والتصحيح التلقائي في كل الخانات */
(function(){const ok=/^(text|search|tel|email|url|)$/;
  const f=e=>{if(e.tagName==='TEXTAREA'||(e.tagName==='INPUT'&&ok.test(e.type||''))){e.setAttribute('spellcheck','false');e.setAttribute('autocorrect','off');e.setAttribute('autocapitalize','off');if(!e.hasAttribute('autocomplete'))e.setAttribute('autocomplete','off')}};
  const all=r=>{if(r.nodeType!==1)return;f(r);r.querySelectorAll&&r.querySelectorAll('input,textarea').forEach(f)};
  all(document.documentElement);
  try{new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(all))).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}})();

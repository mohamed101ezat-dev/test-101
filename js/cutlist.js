/* CutList · مخطط التقطيع (ويدجت مستقل) */
/* CutList — مخطط التقطيع (نفس ملف cutlist-widget.js بدون التعليق اللي فوق). لتحديثه: استبدل محتوى الـ script ده بالنسخة الجديدة. */
(function (global) {
  'use strict';

  /* ================= نصوص ================= */
  var T = {
    ar: {
      title: 'مخطط التقطيع', save: 'حفظ', sure: 'اضغط تاني للتأكيد',
      shapesOpt: 'إظهار الدائرة والبيضاوي',
      invLabel: 'بحث بكود الفاتورة', invPh: 'ابحث بكود الفاتورة', invGo: 'بحث', invBusy: 'بدوّر…', invNone: 'مفيش فاتورة بالكود ده.', invErr: 'حصلت مشكلة في البحث. جرّب تاني.',
      invTitle: function (c) { return 'فاتورة #' + c; }, invPick: 'اختار الصنف اللي هتنقل مقاساته:',
      invPieces: function (n, m) { return n + ' قطعة · ' + m + (m === 1 ? ' مقاس' : ' مقاسات'); },
      invReady: 'أصناف جاهزة (من غير مقاسات، مش هتتنقل):', invNoCut: 'الفاتورة دي كلها أصناف جاهزة، مفيش مقاسات تتنقل.',
      invReplace: 'استبدال القطع الحالية', invAppend: 'إضافة للقطع الحالية',
      invStock: function (t) { return 'استخدم شيتات الصنف ده (' + t + ')'; },
      invDo: function (n) { return 'نقل ' + n + ' قطعة واحسب'; }, invCancel: 'إلغاء', invDone: function (n) { return 'اتنقل ' + n + ' قطعة'; },
      invFrom: function (c, g) { return 'من فاتورة #' + c + ' · ' + g; }, invClose: 'قفل', all: 'الكل', calc: 'احسب', example: 'مثال', clear: 'مشروع جديد فاضي',
      tIn: 'المدخلات', tLay: 'الرسم', tRes: 'النتائج',
      panels: 'القطع المطلوبة', stock: 'الشيتات المتاحة', opts: 'الخيارات',
      len: 'الطول', wid: 'العرض', qty: 'العدد', mat: 'الخامة',
      kerf: 'سُمك الشفرة (الفاصل)', labels: 'ترقيم القطع', one: 'استخدام شيت واحد فقط',
      material: 'مراعاة الخامة', grain: 'منع تدوير القطع',
      g: 'الإحصائيات العامة', s: 'إحصائيات الشيت', c: 'القطعات',
      usedSheets: 'الشيتات المستخدمة', usedArea: 'المساحة المستخدمة', sUsed: 'المساحة المستخدمة', sWaste: 'المساحة الهالكة', wastedArea: 'المساحة الهالكة',
      totalCuts: 'عدد القطعات', totalLen: 'إجمالي طول القص', kerfRow: 'سُمك الشفرة', prio: 'الأولوية',
      prioV: 'أقل هالك', unplaced: 'قطع لم تتسع',
      sheet: 'الشيت', cuts: 'القطعات', cutLen: 'طول القص', panelsN: 'عدد القطع', wastedN: 'قطع الهالك',
      cNo: '#', cPanel: 'القطعة', cCut: 'القص', cRes: 'الناتج', vert: 'رأسي', horiz: 'أفقي', surplus: 'هالك',
      sheetOf: function (i, n) { return 'شيت ' + i + ' من ' + n; },
      sheetTab: function (i) { return 'شيت ' + i; },
      empty1: 'أضف القطع المطلوبة والشيتات ثم اضغط «احسب».',
      empty2: 'أضف شيت واحد على الأقل.',
      none: 'لا توجد نتائج بعد.',
      hint: 'اسحب القطعة لتحريكها (القطع الصغيرة ممكن تتحط في أركان مربع الدائرة). اضغط عليها للتدوير أو التثبيت.', rot90: 'تدوير 90°', pin: 'تثبيت', unpin: 'إلغاء التثبيت', rearr: 'أعد ترتيب الباقي', chg: 'غيّر التقسيمة', compact: 'ضغط الفوارغ', compacted: 'تم ضغط الفوارغ', alreadyCompact: 'القطع مضغوطة بالفعل.', layoutN: function (i, n) { return 'التقسيمة ' + i + ' / ' + n; }, noAlt: 'لا توجد تقسيمة بديلة لهذه القطع.',
      more: '🔍 دوّر أكتر', moreStop: '⏹ وقّف', moreBusy: function (n) { return 'بدوّر على ترتيب أحسن… جرّبت ' + n; },
      moreBetter: function (a, b) { return a < b ? 'لقيت ترتيب أحسن ✓ ' + a + ' شيت بدل ' + b : 'لقيت ترتيب أحسن ✓ فضلة أكبر'; },
      moreNone: 'ده أحسن ترتيب لقيته.', moreMin: 'ده أقل عدد شيتات ممكن ✓', morePins: 'فك تثبيت القطع الأول.', hintOne: 'خيار «استخدام شيت واحد فقط» شغال. أوقفه لاستخدام باقي الشيتات.', hintMat: 'خيار «مراعاة الخامة» شغال: القطعة تتحط فقط على شيت من نفس الخامة. راجع عمود الخامة.', hintMore: 'أضف شيتات أكثر (أو زوّد عدد الشيتات).', cantDrop: 'لا يمكن وضعها هنا: تتداخل مع قطعة أخرى أو لا يمكن قصها بقصات مستقيمة. حول الدائرة لازم القطعة تبقى جوه مربع الدائرة نفسها، في ركن.', cantRot: 'لا توجد مساحة للتدوير هنا.', needPin: 'ثبّت قطعة واحدة على الأقل ثم أعد ترتيب الباقي.', rearranged: 'تم تحديث الترتيب', cantPack: 'لا يمكن قص القطع المثبتة بقصات مستقيمة.', pinned: 'مثبتة',
      gaps: 'استخدام الفراغات حول الدوائر', gapN: 'قطع داخل الفراغات', gapNote: 'القطع ذات الإطار الأحمر المتقطع بتطلع من أركان مربع الدائرة/البيضاوي: اقطع المربع حسب القائمة، وبعدين اقطع الدائرة منه، وبعدين اقطع القطع دي من الأركان اللي فضلت. المكان محسوب من الركن العلوي الشمال للشيت.', shape: 'الشكل', shapeR: 'مستطيل', shapeC: 'دائرة (القطر)', shapeO: 'بيضاوي',
      copy: 'نسخ قائمة القطع', copied: 'تم النسخ', saved: 'تم الحفظ في المتصفح', copyFail: 'تعذر النسخ',
      warn: function (n, list) { return '⚠️ ' + n + ' قطعة ملقتش مكان — ' + list + ' ·'; }, hintBig: 'فيه قطع أكبر من كل الشيتات المتاحة.',
      zin: 'تكبير', zout: 'تصغير', zfit: 'ملائمة العرض', fup: 'تكبير الخط', fdn: 'تصغير الخط', col: 'الألوان', dim: 'أبعاد الشيت',
      enable: 'تفعيل / إيقاف', del: 'حذف', rot: 'مُدوَّرة', panel: 'قطعة', menu: 'القائمة', settings: 'الإعدادات', mSave: 'حفظ المشروع', mLoad: 'تحميل مشروع', mPdf: 'تصدير PDF', mImg: 'تصدير صورة', setDim: 'ترتيب الأبعاد', dimLW: 'الطول × العرض', dimWL: 'العرض × الطول', setDec: 'عدد الأرقام العشرية', setTrim: 'أقل مقاس هالك (الأصغر منه يتحسب هالك)', setOrient: 'اتجاه القص', oOpt: 'الأفضل', oV: 'رأسي أولاً', oH: 'أفقي أولاً', setUnit: 'الوحدة', uGen: 'عام', uCm: 'سم', uMm: 'مم', uM: 'متر', uIn: 'بوصة', ok: 'تمام', tOn: 'تفعيل الكل', tOff: 'إيقاف الكل', tSort: 'ترتيب بالأكبر', tClear: 'مسح الجدول', badFile: 'الملف مش صالح', loaded: 'تم تحميل المشروع', exported: 'تم التصدير', calcBtn: 'احسب'
    },
    en: {
      title: 'Cutlist Planner', save: 'Save', sure: 'Tap again to confirm',
      shapesOpt: 'Show circle and oval',
      invLabel: 'Search by invoice code', invPh: 'Invoice code', invGo: 'Search', invBusy: 'Searching…', invNone: 'No invoice with this code.', invErr: 'The search failed. Try again.',
      invTitle: function (c) { return 'Invoice #' + c; }, invPick: 'Choose the product whose sizes you want to bring in:',
      invPieces: function (n, m) { return n + ' pcs · ' + m + (m === 1 ? ' size' : ' sizes'); },
      invReady: 'Ready-made items (no sizes, not imported):', invNoCut: 'Every item on this invoice is ready-made, so there are no sizes to bring in.',
      invReplace: 'Replace current panels', invAppend: 'Add to current panels',
      invStock: function (t) { return 'Use this product\u2019s sheets (' + t + ')'; },
      invDo: function (n) { return 'Bring in ' + n + ' pcs and calculate'; }, invCancel: 'Cancel', invDone: function (n) { return n + ' pcs brought in'; },
      invFrom: function (c, g) { return 'From invoice #' + c + ' · ' + g; }, invClose: 'Close', all: 'All', calc: 'Calculate', example: 'Example', clear: 'Clear all',
      tIn: 'Inputs', tLay: 'Layout', tRes: 'Results',
      panels: 'Panels', stock: 'Stock sheets', opts: 'Options',
      len: 'Length', wid: 'Width', qty: 'Qty', mat: 'Material',
      kerf: 'Cut / blade / kerf thickness', labels: 'Labels on panels', one: 'Use only one sheet from stock',
      material: 'Consider material', grain: 'Consider grain direction',
      g: 'Global statistics', s: 'Sheet statistics', c: 'Cuts',
      usedSheets: 'Used stock sheets', usedArea: 'Total used area', sUsed: 'Used area', sWaste: 'Wasted area', wastedArea: 'Total wasted area',
      totalCuts: 'Total cuts', totalLen: 'Total cut length', kerfRow: 'Kerf thickness', prio: 'Optimization priority',
      prioV: 'Least wasted area', unplaced: 'Unplaced panels',
      sheet: 'Stock sheet', cuts: 'Cuts', cutLen: 'Cut length', panelsN: 'Panels', wastedN: 'Wasted panels',
      cNo: '#', cPanel: 'Panel', cCut: 'Cut', cRes: 'Result', vert: 'vertical', horiz: 'horizontal', surplus: 'surplus',
      sheetOf: function (i, n) { return 'Sheet ' + i + ' of ' + n; },
      sheetTab: function (i) { return 'Sheet ' + i; },
      empty1: 'Add panels and stock sheets, then press Calculate.',
      empty2: 'Add at least one stock sheet.',
      none: 'No results yet.',
      hint: 'Drag a panel to move it (small panels can also go into the corners around a circle). Tap a panel to rotate or pin it.', rot90: 'Rotate 90°', pin: 'Pin', unpin: 'Unpin', rearr: 'Re-arrange others', chg: 'Change layout', compact: 'Compact leftovers', compacted: 'Leftovers compacted', alreadyCompact: 'Already compact.', layoutN: function (i, n) { return 'Layout ' + i + ' / ' + n; }, noAlt: 'No other layout for these panels.',
      more: '🔍 Search more', moreStop: '⏹ Stop', moreBusy: function (n) { return 'Searching for a better layout… tried ' + n; },
      moreBetter: function (a, b) { return a < b ? 'Found a better layout ✓ ' + a + ' sheets instead of ' + b : 'Found a better layout ✓ bigger offcut'; },
      moreNone: 'This is the best layout found.', moreMin: 'This is the fewest sheets possible ✓', morePins: 'Unpin the pieces first.', hintOne: 'The option \u201cUse only one sheet from stock\u201d is on. Turn it off to use the other sheets.', hintMat: 'The option \u201cConsider material\u201d is on: panels only go on sheets of the same material. Check the Material column.', hintMore: 'Add more stock sheets (or raise their Qty).', cantDrop: 'Can\u2019t drop it there: it overlaps another panel or can\u2019t be cut with straight cuts. Around a circle, a piece must sit fully inside that circle\u2019s square, in a corner.', cantRot: 'No room to rotate it here.', needPin: 'Pin at least one panel first, then re-arrange the rest.', rearranged: 'Layout updated', cantPack: 'The pinned panels can\u2019t be cut with straight cuts.', pinned: 'pinned',
      gaps: 'Use gaps around circles', gapN: 'Pieces in gaps', gapNote: 'Pieces with a dashed red outline come from the corners of a circle/oval blank. Cut the square blank as listed, cut the circle out of it, then cut these pieces from the leftover corners. Position is from the sheet\u2019s top-left.', shape: 'Shape', shapeR: 'Rectangle', shapeC: 'Circle (diameter)', shapeO: 'Oval',
      copy: 'Copy cut list', copied: 'Copied', saved: 'Saved in this browser', copyFail: 'Could not copy',
      warn: function (n, list) { return n + ' panel(s) do not fit on the available stock: ' + list + '.'; }, hintBig: 'Some panels are bigger than every stock sheet.',
      zin: 'Zoom in', zout: 'Zoom out', zfit: 'Fit width', fup: 'Larger text', fdn: 'Smaller text', col: 'Colours', dim: 'Sheet dimensions',
      enable: 'Enable / disable', del: 'Remove', rot: 'rotated', panel: 'Panel', menu: 'Menu', settings: 'Settings', mSave: 'Save project', mLoad: 'Load project', mPdf: 'Export to PDF', mImg: 'Export to image', setDim: 'Dimensions order', dimLW: 'Length × Width', dimWL: 'Width × Length', setDec: 'Decimal places', setTrim: 'Minimum trim dimension', setOrient: 'Cut orientation', oOpt: 'Optimal', oV: 'Vertical first', oH: 'Horizontal first', setUnit: 'Units', uGen: 'Generic', uCm: 'cm', uMm: 'mm', uM: 'm', uIn: 'in', ok: 'Ok', tOn: 'Enable all', tOff: 'Disable all', tSort: 'Sort by largest', tClear: 'Clear table', badFile: 'Invalid file', loaded: 'Project loaded', exported: 'Exported', calcBtn: 'Calculate'
    }
  };

  /* ================= CSS (كله تحت .cl عشان ما يتعارضش مع التطبيق) ================= */
  var CSS = [
    '.cl{--bg:#eef1f4;--surface:#fff;--side:#f6f7f9;--bar:#1e2830;--bar-fg:#f1f4f6;--hd:#587286;--hd-fg:#fff;--hd2:#dde3e8;--hd2-fg:#3a4650;',
    '--line:#d6dce1;--stripe:#f1f4f6;--fg:#1c2329;--muted:#66737e;--ok:#2e9b4d;--bad:#d1352b;--dimline:#d9534f;--sheet:#f7f7f8;--sheet-line:#2b333a;',
    '--freefg:#8fa5b8;--freeline:#c8ced4;--g1:95%;--g2:83%;--btn:#3a4852;--btn-hover:#4a5964;--btn-fg:#fff;--focus:#2f7fc1;--accent:#2f7d4f;',
    'color-scheme:light;container-type:inline-size;display:block;position:relative;background:var(--bg);color:var(--fg);',
    'font:13px/1.4 "IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;-webkit-text-size-adjust:100%;box-sizing:border-box}',
    '.cl[data-theme="dark"]{--bg:#12171b;--surface:#181e23;--side:#161c20;--bar:#0b0f12;--bar-fg:#e6ebef;--hd:#3f5566;--hd-fg:#eef2f5;--hd2:#232c33;--hd2-fg:#c3ccd3;',
    '--line:#2b353d;--stripe:#1c2329;--fg:#e3e8ec;--muted:#8d9aa5;--ok:#4cc16d;--bad:#ff6b5f;--dimline:#e0645c;--sheet:#1f272d;--sheet-line:#8d9aa5;--freefg:#8d9aa5;--freeline:#3a4650;--g1:36%;--g2:27%;--btn:#34424d;--btn-hover:#425361;--focus:#5aa9e6;color-scheme:dark}',
    /* عزل عن تنسيقات تطبيق الفاتورة: أي تنسيق عام عندك (button, table, input, .card…) ما يأثرش هنا */
    '.cl.cl :where(:not(svg):not(svg *)),.cl.cl :where(:not(svg):not(svg *))::before,.cl.cl :where(:not(svg):not(svg *))::after{all:revert}',
    '.cl{margin:0;padding:0;border:0;box-shadow:none;text-align:start;line-height:1.4;letter-spacing:normal;text-transform:none}',
    '.cl.cl *,.cl.cl *::before,.cl.cl *::after{box-sizing:border-box}',
    '.cl.cl :where(button,input){font:inherit;color:inherit}',
    '.cl.cl :where(table){font-size:inherit}',
    '.cl.cl :where(button){-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
    '.cl.cl :focus-visible{outline:2px solid var(--focus);outline-offset:1px}',

    '.cl .bar{background:var(--bar);color:var(--bar-fg);display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-height:40px;padding:4px max(12px,env(safe-area-inset-right,0px)) 6px max(12px,env(safe-area-inset-left,0px))}',
    '.cl .brand{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:500;margin-inline-end:auto}',
    '.cl .brand svg{width:20px;height:20px}',
    '.cl .btn{background:var(--btn);color:var(--btn-fg);border:0;border-radius:3px;padding:0 12px;min-height:32px;cursor:pointer;display:inline-flex;gap:6px;align-items:center;font-size:13px;font-weight:500}',
    '.cl .btn:hover{background:var(--btn-hover)}',
    '.cl .btn svg{width:12px;height:12px;fill:currentColor}',
    '.cl .btn.go{background:var(--accent)}',
    '.cl .btn[data-armed]{background:var(--bad)}',

    '.cl .main{display:grid;grid-template-columns:minmax(0,1fr);align-items:start}',
    '.cl .left{background:var(--side);border-bottom:1px solid var(--line)}',
    '.cl .center{padding:10px 12px 18px;min-width:0}',
    '.cl .right{padding:10px 12px 16px;display:flex;flex-direction:column;gap:10px;min-width:0}',
    '@container (min-width:720px){.cl .main{grid-template-columns:minmax(280px,380px) minmax(0,1fr)}.cl .left{grid-row:span 2;border-bottom:0;border-inline-end:1px solid var(--line);align-self:stretch}.cl .right{flex-direction:row;flex-wrap:wrap}.cl .right>*{flex:1 1 300px}}',
    '@container (min-width:1100px){.cl .main{grid-template-columns:minmax(260px,380px) minmax(0,1fr) minmax(280px,400px)}.cl .left{grid-row:auto}.cl .right{flex-direction:column;flex-wrap:nowrap}.cl .right>*{flex:none}}',

    '.cl .sec>.hd2{display:flex;align-items:center;gap:8px;width:100%;background:var(--hd2);color:var(--hd2-fg);border:0;padding:6px 12px;font-weight:600;font-size:13px;text-align:start;cursor:pointer}',
    '.cl .sec>.hd2 svg.chev{margin-inline-start:auto;width:12px;height:12px;transition:transform .15s}',
    '.cl .sec.closed>.hd2 svg.chev,.cl .card.closed>.hd svg.chev{transform:rotate(-90deg)}',
    '.cl .sec.closed>.body,.cl .card.closed>.cb,.cl .card.closed>.chipsrow{display:none}',
    '.cl .tw{overflow-x:auto}',
    '.cl table.t{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}',
    '.cl .t th{text-align:center;font-weight:600;font-size:12px;padding:4px 6px;border-bottom:1px solid var(--line);background:var(--side);white-space:nowrap}',
    '.cl .t td{padding:0;border:1px solid var(--line);border-top:0}',
    '.cl .t td:first-child{border-inline-start:0}.cl .t td:last-child{border-inline-end:0}',
    '.cl .t tr:nth-child(even) td{background:var(--stripe)}',
    '.cl .t input{width:100%;min-width:40px;height:26px;border:0;background:transparent;padding:0 6px;font-size:13px;text-align:center}',
    '.cl .t input:focus{background:var(--surface);outline:2px solid var(--focus);outline-offset:-2px}',
    '.cl .t tr.off input{opacity:.4;text-decoration:line-through}',
    '.cl .t td.shp{width:30px;text-align:center}',
    '.cl .ic.shape{color:var(--hd)}',
    '.cl .t input[readonly]{opacity:.55}',
    '.cl .t td.act{width:52px;text-align:center;white-space:nowrap}',
    '.cl .ic{background:none;border:0;cursor:pointer;width:22px;height:22px;padding:0;display:inline-grid;place-items:center;border-radius:4px}',
    '.cl .ic svg{width:14px;height:14px}',
    '.cl .ic.ok{color:var(--ok)}.cl .ic.ok.off{color:var(--muted)}.cl .ic.del{color:var(--bad)}',

    '.cl .opts{padding:6px 12px 8px;display:grid;gap:0}',
    '.cl .opt{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;min-height:28px;font-size:13px}',
    '.cl .opt label{text-align:end}',
    '.cl .opt input.k{width:56px;height:24px;border:1px solid var(--line);background:var(--surface);padding:0 8px;border-radius:2px;font-size:14px}',
    '.cl .sw{position:relative;width:34px;height:19px;display:inline-block}',
    '.cl .sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1;width:100%;height:100%}',
    '.cl .sw i{position:absolute;inset:0;border-radius:10px;background:var(--line);transition:background .15s}',
    '.cl .sw i::after{content:"";position:absolute;inset-inline-start:2px;top:2px;width:15px;height:15px;border-radius:50%;background:var(--surface);box-shadow:0 1px 2px #0004;transition:transform .15s}',
    '.cl .sw input:checked+i{background:var(--ok)}',
    '.cl .sw input:checked+i::after{transform:translateX(15px)}',
    '.cl[dir="rtl"] .sw input:checked+i::after{transform:translateX(-15px)}',
    '.cl .sw input:focus-visible+i{outline:2px solid var(--focus);outline-offset:2px}',

    '.cl .tool{display:flex;gap:2px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:6px;margin-bottom:12px}',
    '.cl .tool button{background:none;border:0;min-width:30px;height:28px;border-radius:3px;cursor:pointer;color:var(--hd);display:inline-grid;place-items:center;font-weight:600}',
    '.cl .tool button:hover{background:var(--stripe)}',
    '.cl .tool button.on{background:var(--stripe);box-shadow:inset 0 -2px 0 var(--hd)}',
    '.cl .tool svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}',
    '.cl .tool .sp{width:1px;background:var(--line);margin:4px 4px}',
    '.cl .cv-wrap{direction:ltr;overflow-x:auto;min-width:0}',
    '.cl .sheetbox{margin-bottom:20px}',
    '.cl .sheetbox h4{margin:0 0 4px;font-size:13px;font-weight:500;color:var(--muted)}',
    '.cl svg.cv{display:block;max-width:none}',
    '.cl svg.cv text{font-family:inherit;font-variant-numeric:tabular-nums}',
    '.cl svg.cv{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}',
    '.cl svg.cv g.pn{cursor:grab}.cl svg.cv.dragging g.pn{cursor:grabbing}',
    '.cl.cl [hidden]{display:none!important}',
    '.cl .hint{margin:0 0 8px;font-size:12px;color:var(--muted)}',
    '.cl .selbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:0 0 10px;padding:8px 10px;background:var(--surface);border:1px solid var(--line);border-radius:3px}',
    '.cl .selbar b{margin-inline-end:auto;font-weight:600}',
    '.cl .selbar button{min-height:30px;padding:0 10px;font-size:12px;border:1px solid var(--line);background:var(--stripe);border-radius:3px;cursor:pointer;font-weight:500}',
    '.cl .tool button.txt{width:auto;padding:0 10px;font-size:12px;margin-inline-start:auto;border:1px solid var(--line);gap:6px;display:inline-flex;align-items:center;color:var(--fg)}',
    '.cl .tool button.txt+button.txt{margin-inline-start:0}',
    '.cl .empty{padding:50px 10px;text-align:center;color:var(--muted)}',
    '.cl .card.unfit{border-color:color-mix(in srgb,var(--bad) 55%,var(--line));margin:0 0 14px}.cl .card.unfit>.hd{background:color-mix(in srgb,var(--bad) 55%,var(--surface));color:#fff}.cl .unfit table{width:100%;border-collapse:collapse}.cl .unfit th,.cl .unfit td{padding:8px 12px;text-align:start;font-size:14px}.cl .unfit th{border-bottom:2px solid var(--line);font-weight:400}.cl .unfit tbody tr:nth-child(even){background:var(--stripe)}',
    '.cl .notice{margin:0 0 14px;padding:10px 12px;border:1px solid var(--bad);color:var(--bad);border-radius:3px;font-size:13px}',

    '.cl .card{background:var(--surface);border:1px solid var(--line);border-radius:2px}',
    '.cl .card>.hd{display:flex;align-items:center;gap:8px;width:100%;background:var(--hd);color:var(--hd-fg);border:0;padding:7px 12px;font-size:14px;cursor:pointer;text-align:start}',
    '.cl .card>.hd .chev{margin-inline-start:auto;width:12px;height:12px;transition:transform .15s}',
    '.cl .cb{padding:4px 12px 8px;overflow-x:auto}',
    '.cl table.kv{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}',
    '.cl .kv th{text-align:start;font-weight:600;padding:3px 6px;white-space:nowrap;padding-inline-end:18px}',
    '.cl .kv td{padding:3px 6px}',
    '.cl .kv tr:nth-child(even){background:var(--stripe)}',
    '.cl .kv small{color:var(--muted);margin:0 6px;font-weight:400;display:inline-block}',
    '.cl .bad{color:var(--bad)!important}',
    '.cl .chips{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px 0}',
    '.cl .chips button{border:1px solid var(--line);background:var(--surface);border-radius:14px;min-height:28px;padding:0 12px;cursor:pointer;font-size:12px}',
    '.cl .chips button[aria-pressed="true"]{background:var(--hd);color:var(--hd-fg);border-color:var(--hd)}',
    '.cl table.cuts{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:13px}',
    '.cl .cuts th{text-align:start;padding:5px 6px;border-bottom:1px solid var(--line);font-weight:600}',
    '.cl .cuts td{padding:3px 6px;white-space:nowrap}',
    '.cl .cuts tr:nth-child(even) td{background:var(--stripe)}',
    '.cl .cuts .sur{color:var(--muted)}',
    '.cl .n{direction:ltr;unicode-bidi:isolate;display:inline-block}',
    '.cl .copy{margin:0 12px 10px;width:calc(100% - 24px);min-height:32px;border:1px solid var(--line);background:var(--surface);border-radius:3px;cursor:pointer;font-weight:500}',
    '.cl .toast{position:fixed;left:50%;bottom:calc(var(--nh,0px) + 20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--bar);color:var(--bar-fg);padding:9px 16px;border-radius:4px;opacity:0;pointer-events:none;transition:opacity .2s;z-index:50;font-size:13px}',
    '.cl .toast.show{opacity:1}',
    '.cl .inv{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px max(12px,env(safe-area-inset-right,0px)) 8px max(12px,env(safe-area-inset-left,0px));background:var(--hd2);color:var(--hd2-fg);border-bottom:1px solid var(--line)}',
    '.cl .inv label{font-weight:600;font-size:13px}',
    '.cl .inv input{flex:1 1 140px;max-width:240px;height:32px;border:1px solid var(--line);border-radius:3px;padding:0 10px;background:var(--surface);color:var(--fg);font-size:14px}',
    '.cl .inv .btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.4}',
    '.cl .invmsg{font-size:12px;color:var(--muted)}',
    '.cl .src{display:flex;align-items:center;gap:6px;margin:6px 8px;padding:4px 6px 4px 10px;background:var(--surface);border:1px solid var(--line);border-inline-start:3px solid var(--accent);border-radius:3px;font-size:12px}',
    '.cl .src span{flex:1;min-width:0}',
    '.cl .ov{position:fixed;inset:0;z-index:60;background:rgba(15,20,25,.45);display:flex;align-items:center;justify-content:center;padding:16px}',
    '.cl .dlg{background:var(--surface);color:var(--fg);width:min(560px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;border-radius:6px;box-shadow:0 12px 32px rgba(0,0,0,.3);overflow:hidden}',
    '.cl .dh{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:var(--hd);color:var(--hd-fg)}',
    '.cl .dh>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}',
    '.cl .dh b{font-size:16px}.cl .dh span{font-size:12px;opacity:.85}',
    '.cl .dh .ic{color:var(--hd-fg)}',
    '.cl .db{padding:12px 14px;overflow:auto;display:flex;flex-direction:column;gap:10px}',
    '.cl .dq{margin:0;font-weight:600}',
    '.cl .grps{display:flex;flex-direction:column;gap:8px}',
    '.cl .grp{border:1px solid var(--line);border-radius:5px;overflow:hidden}',
    '.cl .grp.on{border:2px solid var(--accent)}',
    '.cl .gh{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;background:var(--surface);cursor:pointer;text-align:start;min-height:44px}',
    '.cl .grp.on .gh{background:var(--stripe)}',
    '.cl .gh .rd{width:16px;height:16px;border-radius:50%;border:2px solid var(--muted);flex:none}',
    '.cl .grp.on .gh .rd{border:5px solid var(--accent)}',
    '.cl .gh .gn{flex:1;font-weight:600}.cl .gh .gm{font-size:12px;color:var(--muted);white-space:nowrap}',
    '.cl .its{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:2px 12px;padding:8px 12px 10px;border-top:1px solid var(--line)}',
    '.cl .it{display:flex;align-items:center;gap:8px;min-height:30px;cursor:pointer;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.cl .it.all{grid-column:1/-1;font-weight:600;border-bottom:1px solid var(--line)}',
    '.cl .it input{width:16px;height:16px;margin:0;accent-color:var(--accent)}',
    '.cl .it .iq{color:var(--muted)}.cl .it .shp{font-size:11px;color:var(--hd)}',
    '.cl .rdy{margin:0;font-size:12px;color:var(--muted)}',
    '.cl .dopts{display:flex;flex-direction:column;gap:6px;font-size:13px}',
    '.cl .dopts label{display:flex;align-items:center;gap:8px;cursor:pointer}',
    '.cl .dopts input{margin:0;accent-color:var(--accent)}',
    '.cl .df{display:flex;gap:8px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid var(--line);background:var(--side)}',
    '.cl .df .btn{min-height:38px}',
    '.cl .btn[disabled]{opacity:.5;cursor:default}',
    '@media (max-width:560px){.cl .ov{padding:0;align-items:flex-end}.cl .dlg{width:100%;max-height:92vh;border-radius:10px 10px 0 0}.cl .df{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}}',
    '@media (pointer:coarse){.cl .t input{height:32px;font-size:16px}.cl .ic{width:28px;height:28px}.cl .t td.act{width:62px}.cl .opt input.k{height:28px;font-size:16px}.cl .tool button{min-width:34px;height:32px}}',
    '.cl{--rowsel:#cfe8d3}.cl[data-theme="dark"]{--rowsel:#22402d}',
    '.cl .bar{background:var(--hd);color:var(--hd-fg);flex-wrap:nowrap;gap:6px;min-height:46px;padding:5px max(8px,env(safe-area-inset-right,0px)) 5px max(8px,env(safe-area-inset-left,0px));position:relative}',
    '.cl .bar .brand{margin-inline-end:auto;font-size:15px;white-space:nowrap}',
    '.cl .btn.ic2{min-width:36px;width:36px;padding:0;justify-content:center;background:transparent;flex:none}',
    '.cl .btn.ic2 svg{width:20px;height:20px}.cl .btn.ic2:hover{background:var(--btn)}',
    '.cl form.invf{display:flex;flex:1 1 auto;min-width:0;gap:6px;margin:0}',
    '.cl form.invf input{flex:1 1 auto;min-width:0;height:34px;border:1px solid transparent;border-radius:4px;padding:0 10px;background:rgba(255,255,255,.14);color:var(--bar-fg);font-size:15px}',
    '.cl form.invf input::placeholder{color:rgba(255,255,255,.65)}',
    '.cl form.invf .btn{flex:none;width:38px;padding:0;justify-content:center}.cl form.invf .btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.4}',
    '.cl .invmsg{margin:0;padding:3px 12px;font-size:12px;background:var(--hd2);color:var(--muted)}.cl .invmsg:empty{display:none}',
    '.cl .menu{position:absolute;top:calc(100% - 2px);inset-inline-end:8px;z-index:45;min-width:210px;padding:4px 0;background:var(--surface);color:var(--fg);border:1px solid var(--line);border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.35)}',
    '.cl .menu.tmenu{position:fixed;inset-inline-end:auto;min-width:170px}',
    '.cl .menu button{display:flex;align-items:center;gap:12px;width:100%;min-height:44px;padding:0 16px;border:0;background:transparent;color:inherit;font-size:14px;cursor:pointer;text-align:start}',
    '.cl .menu button::before{content:attr(data-i);width:20px;text-align:center;color:var(--hd);font-size:16px}',
    '.cl .menu button:hover,.cl .menu button:focus-visible{background:var(--stripe)}',
    '.cl .menu button[data-armed]{background:var(--bad);color:#fff}.cl .menu button[data-armed]::before{color:#fff}',
    '.cl .menu hr{border:0;border-top:1px solid var(--line);margin:4px 0}',
    '.cl .fab{position:fixed;right:16px;bottom:calc(var(--nh,0px) + 14px + env(safe-area-inset-bottom,0px));width:56px;height:56px;border-radius:50%;border:0;padding:0;background:var(--accent);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.4);z-index:30}',
    '.cl .fab svg{width:26px;height:26px;fill:currentColor}.cl .fab:active{transform:scale(.94)}',
    '.cl .sov{position:fixed;inset:0;z-index:60;background:rgba(15,20,25,.45);display:flex;align-items:center;justify-content:center;padding:16px}',
    '.cl .sov .opts{padding:0}.cl .srow{display:grid;grid-template-columns:1fr minmax(110px,45%);gap:10px;align-items:center;min-height:42px}.cl .srow label{font-size:14px}',
    '.cl .sov select,.cl .sov input.k{width:100%;height:36px;border:1px solid var(--line);border-radius:4px;background:var(--surface);color:var(--fg);padding:0 8px;font-size:15px}',
    '@media (max-width:560px){.cl .sov{padding:0;align-items:flex-end}.cl .sov .dlg{width:100%;max-height:92vh;border-radius:10px 10px 0 0}}',
    '.cl .tool{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-bottom:6px;padding-bottom:4px}.cl .tool::-webkit-scrollbar{display:none}.cl .tool>*{flex:none}',
    '.cl .hint{font-size:11px;margin:0 0 4px}',
    '.cl .center{padding:6px 8px 2px}.cl .right{padding:6px 8px 8px;gap:6px}.cl .sheetbox{margin-bottom:6px}',
    '.cl .cb{padding:2px 10px 4px}.cl .sec>.hd2{padding:5px 10px}',
    '.cl .t tr:focus-within td{background:var(--rowsel)}',
    '.cl .ic.ok.off svg path{display:none}',
    '.cl .t th.tm{width:52px;text-align:center;padding:0}.cl .tmb{width:32px;height:26px;color:var(--fg)}.cl .tmb svg{width:18px;height:18px}',
    '@media (prefers-reduced-motion:reduce){.cl *{transition:none!important}}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('cl-widget-css')) return;
    var st = document.createElement('style');
    st.id = 'cl-widget-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ================= أدوات ================= */
  var EPS = 1e-9;
  // بيقبل الأرقام العربي (٠١٢٣) والفارسي (۰۱۲۳) والفاصلة العشرية العربي (٫) أو العادية (, .)
  var normNum = function (v) {
    return String(v == null ? '' : v)
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
      .replace(/\u066C/g, '').replace(/[\u066B,]/g, '.').trim();
  };
  var num = function (v) { var n = parseFloat(normNum(v)); return isFinite(n) && n > 0 ? n : 0; };
  // العدد: فاضي = 1 ، صفر أو سالب = القطعة مش داخلة في الحساب
  var qtyOf = function (v) { var t = normNum(v); if (!t) return 1; var n = parseFloat(t); if (!isFinite(n)) return 1; return Math.max(0, Math.floor(n)); };
  var DEC = 2, DIMWL = false, MINTRIM = 0;
  var fmt = function (n) { var p = Math.pow(10, DEC); return String(Math.round(n * p) / p); };
  var pair = function (a, b) { return DIMWL ? fmt(b) + '×' + fmt(a) : fmt(a) + '×' + fmt(b); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
  var isBlank = function (r) { return !String(r.l).trim() && !String(r.w).trim() && !String(r.q).trim(); };
  var blank = function () { return { l: '', w: '', q: '', on: true, m: '', s: 'r' }; };
  var dim = function (a, b) { return '<span class="n">' + pair(a, b) + '</span>'; };
  var pct = function (a, b) { return b ? Math.round(a / b * 100) : 0; };
  var now = function () { return (global.performance && performance.now) ? performance.now() : Date.now(); };
  // وحدة تقريب مناسبة لمقاس الشيت (سم أو مم أو متر): 321 → 1 ، 3210 → 10 ، 3.21 → 0.01
  var quantum = function (W, H, extra) { var m = Math.max(W, H); if (!(m > 0)) return 1; return Math.pow(10, Math.floor(Math.log(m) / Math.LN10) - 2 - (extra || 0)); };
  var roundQ = function (v, q) { return Number((Math.round(v / q) * q).toFixed(6)); };
  var isRoundIt = function (it) { return !!it && (it.s === 'c' || it.s === 'o'); };
  var strRow = function (r) {
    var o = { l: r.l == null ? '' : String(r.l), w: r.w == null ? '' : String(r.w), q: r.q == null ? '' : String(r.q), on: r.on !== false, m: r.m ? String(r.m) : '', s: (r.s === 'c' || r.s === 'o') ? r.s : 'r' };
    if (o.s === 'c') o.w = o.l;
    if (!o.q.trim() && num(o.l) && num(o.w)) o.q = '1';
    return o;
  };
  var EXAMPLE = function () {
    return {
      panels: [{ l: '50', w: '100', q: '2', on: true, m: '' }, { l: '25', w: '50', q: '6', on: true, m: '' }],
      stock: [{ l: '321', w: '225', q: '1', on: true, m: '' }],
      opts: { kerf: '0', labels: false, one: false, material: false, grain: false, gaps: true, shapes: false, dimOrder: 'lw', dec: '2', trim: '0', orient: 'o', unit: '' }
    };
  };

  var ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="17" height="17" rx="3"/><path d="M8 12l3.5 3.5L21 6"/></svg>';
  var ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var ICON_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  /* ================= الحل (قص مستقيم guillotine) ================= */
  function solve(S) {
    var k = Math.max(0, parseFloat(normNum(S.opts.kerf)) || 0);
    var items = [], stock = [];
    S.panels.forEach(function (r, ri) {
      if (!r.on) return;
      var shp = S.opts.shapes && (r.s === 'c' || r.s === 'o') ? r.s : 'r';
      var l = num(r.l), w = shp === 'c' ? num(r.l) : num(r.w); if (!l || !w) return;
      var q = qtyOf(r.q);
      for (var j = 0; j < q; j++) items.push({ w: l, h: w, ri: ri, s: shp, m: S.opts.material ? String(r.m).trim() : '' });
    });
    S.stock.forEach(function (r, ri) {
      if (!r.on) return; var l = num(r.l), w = num(r.w); if (!l || !w) return;
      var q = qtyOf(r.q);
      // الطول على المحور الأفقي زي القطع بالظبط، عشان «منع تدوير القطع» يحط طول القطعة على طول الشيت
      for (var j = 0; j < q; j++) stock.push({ W: l, H: w, ri: ri, m: S.opts.material ? String(r.m).trim() : '' });
    });
    if (!items.length || !stock.length) return { sheets: [], unplaced: items, k: k, nItems: items.length, nStock: stock.length };
    var best = bestPack(S, items, stock, k, null);
    best.k = k; best.nItems = items.length; best.nStock = stock.length; best.stock = stock; best.items = items;
    finalize(best);
    return best;
  }
  function rulesOf(S) { return S.opts.orient === 'h' ? ['H'] : S.opts.orient === 'v' ? ['V'] : ['SAS', 'LAS', 'H', 'V']; }
  function bestPack(S, items, stock, k, makeInitial, collect) {
    MINTRIM = num(S.opts.trim);
    var sorts = {
      area: function (a, b) { return b.w * b.h - a.w * a.h; },
      side: function (a, b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h; },
      w: function (a, b) { return b.w - a.w || b.h - a.h; },
      h: function (a, b) { return b.h - a.h || b.w - a.w; }
    };
    var best = null;
    Object.keys(sorts).forEach(function (sn) {
      rulesOf(S).forEach(function (rule) {
        var list = items.map(function (it, n) { return Object.assign({ n: n }, it); }).sort(sorts[sn]);
        var res = pack(S, list, stock, rule, k, makeInitial ? makeInitial() : null);
        res.score = scoreOf(res);
        if (collect) collect.push(res);
        if (!best || cmp(res.score, best.score) < 0) { best = res; }
      });
    });
    if (collect) {
      var seed = 12345, rnd = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      var rules = rulesOf(S);
      for (var t = 0; t < 40; t++) {
        var lst = items.map(function (it, n) { var o = Object.assign({ n: n }, it); o.key = o.w * o.h * (1 + (rnd() - .5) * .9); return o; })
          .sort(function (a, b) { return b.key - a.key; });
        var r2 = pack(S, lst, stock, rules[Math.floor(rnd() * rules.length)], k, makeInitial ? makeInitial() : null);
        r2.score = scoreOf(r2);
        collect.push(r2);
      }
    }
    // التقطيع بالشرايح: المقاسات المتشابهة جنب بعض في صفوف، وبيتجرب بكذا طريقة وبيتاخد الأحسن
    if (!makeInitial) {
      var t0 = now(), dirs = S.opts.orient === 'h' ? ['H'] : S.opts.orient === 'v' ? ['V'] : ['H', 'V'];
      dirs.concat(['*']).forEach(function (dir) {
        (dir === '*' ? ['pilot'] : ['eff', 'big', 'fill', 'greedy']).forEach(function (pol) {
          var r3 = stripPack(S, items, stock, k, dir, pol);
          if (!r3) return;
          r3.score = scoreOf(r3);
          if (collect) collect.push(r3);
          if (!best || cmp(r3.score, best.score) < 0) best = r3;
        });
      });
      // محاولات زيادة لو لسه ممكن نوفّر شيت: بتقف أول ما نوصل لأقل عدد شيتات ممكن،
      // أو لما الحساب كله يقرّب من ثلث ثانية (المحاولة الجاية مش هتلحق)
      var lb = minSheets(items, stock), one = 0;
      for (var sd = 1; sd <= 60; sd++) {
        if (best && !best.unplaced.length && best.sheets.length <= lb) break;
        var t1 = now(); if (t1 - t0 + one > 350) break;
        var r4 = retryStep(S, items, stock, k, sd, collect);
        one = now() - t1;
        if (!r4) break;
        if (!best || cmp(r4.score, best.score) < 0) best = r4;
      }
    }
    return best;
  }
  // أقل عدد شيتات ممكن نظرياً (مساحة القطع ÷ أكبر شيت): لو وصلناله يبقى مفيش أحسن
  function minSheets(items, stock) {
    var need = items.reduce(function (a, it) { return a + it.w * it.h; }, 0),
      maxA = stock.reduce(function (a, s) { return Math.max(a, s.W * s.H); }, 0);
    return maxA ? Math.ceil(need / maxA - 1e-9) : 0;
  }
  /* محاولة واحدة زيادة برقم sd: الشرايح مع بص لقدام بتغيير بسيط، ومعاها الطريقة القديمة (أحسن فراغ)
     بترتيب عشوائي للقطع (بتطلع ترتيبات مختلفة عن الشرايح). بترجّع أحسنهم */
  function retryStep(S, items, stock, k, sd, collect) {
    var best = stripPack(S, items, stock, k, '*', 'pilot', sd * 7919);
    if (best) { best.score = scoreOf(best); if (collect) collect.push(best); }
    var rs = sd * 104729, rr = function () { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; }, rl = rulesOf(S);
    for (var q = 0; q < 6; q++) {
      var lq = items.map(function (it, n) { var o = Object.assign({ n: n }, it); o.key = o.w * o.h * (1 + (rr() - .5) * 1.2); return o; })
        .sort(function (a, b) { return b.key - a.key; });
      var r5 = pack(S, lq, stock, rl[Math.floor(rr() * rl.length)], k, null);
      r5.score = scoreOf(r5);
      if (!best || cmp(r5.score, best.score) < 0) best = r5;
    }
    return best;
  }

  /* ================= التقطيع بالشرايح (strip packing) =================
     كل شيت بيتقسم شرايح بعرض الشيت كله (أو بطوله)، وكل شريحة بتتملي بصف من نفس المقاس جنب بعض،
     واللي يفضل من الشريحة بيتملي بأعمدة من مقاسات أصغر (وهكذا جوه الأعمدة). ده بيدّي قصات مستقيمة
     قليلة ومقاسات متشابهة جنب بعض، والفضلة بتتجمع في حتة واحدة كبيرة آخر الشيت.
     dir: H = شرايح أفقية، V = رأسية. pol: طريقة اختيار المقاس اللي يبدأ بيه كل شريحة. */
  function stripPack(S, items, stock, k, dir, pol, seed) {
    var grain = !!S.opts.grain, useM = !!S.opts.material;
    // seed: محاولة تانية بتغيير بسيط في الاختيار، عشان نجرب ترتيبات مختلفة لنفس الطلبية
    var sd = seed || 0, jit = function () { if (!seed) return 1; sd = (sd * 1103515245 + 12345) & 0x7fffffff; return 1 + (sd / 0x7fffffff - .5) * .12; };
    var types = [], byKey = {};
    items.forEach(function (it, n) {
      var o = Object.assign({ n: n }, it), key = o.w + '|' + o.h + '|' + o.s + '|' + o.m;
      if (!byKey[key]) { byKey[key] = { w: o.w, h: o.h, m: o.m, q: [] }; types.push(byKey[key]); }
      byKey[key].q.push(o);
    });
    types.sort(function (a, b) { return b.w * b.h - a.w * a.h; });
    var cnt = types.map(function (t) { return t.q.length; });
    var left = items.length;
    // كل صف ممكن يبدأ بيه الشريحة: نوع القطعة + اتجاهها + كام واحدة تدخل جنب بعض
    function candsOf(r, c, d, sm) {
      var L = d === 'H' ? r.w : r.h, Tk = d === 'H' ? r.h : r.w, cands = [];
      for (var ti = 0; ti < types.length; ti++) {
        if (!c[ti]) continue; var t = types[ti];
        if (useM && sm && t.m && sm !== t.m) continue;
        var os = grain || t.w === t.h ? [[t.w, t.h, false]] : [[t.w, t.h, false], [t.h, t.w, true]];
        for (var oi = 0; oi < os.length; oi++) {
          var pw = os[oi][0], ph = os[oi][1], a = d === 'H' ? pw : ph, b = d === 'H' ? ph : pw;
          if (a > L + EPS || b > Tk + EPS) continue;
          var n = Math.min(c[ti], Math.floor((L + k + EPS) / (a + k)));
          if (n > 0) cands.push({ ti: ti, pw: pw, ph: ph, rot: os[oi][2], a: a, b: b, n: n });        }
      }
      return cands;
    }
    // الصف بيقسم المساحة لـ: الباقي جنب الصف جوه الشريحة (side) والباقي بعد الشريحة (rest)
    function cutOf(r, cd, d) {
      var rl = cd.n * cd.a + (cd.n - 1) * k;
      return d === 'H'
        ? { side: { x: r.x + rl + k, y: r.y, w: r.w - rl - k, h: cd.b }, rest: { x: r.x, y: r.y + cd.b + k, w: r.w, h: r.h - cd.b - k } }
        : { side: { x: r.x, y: r.y + rl + k, w: cd.b, h: r.h - rl - k }, rest: { x: r.x + cd.b + k, y: r.y, w: r.w - cd.b - k, h: r.h } };
    }
    var ok2 = function (q) { return q.w > EPS && q.h > EPS; };
    function putRow(r, cd, d, out) {
      for (var j = 0; j < cd.n; j++) {
        var off = j * (cd.a + k);
        if (out) out.push({ ti: cd.ti, x: r.x + (d === 'H' ? off : 0), y: r.y + (d === 'H' ? 0 : off), w: cd.pw, h: cd.ph, rot: cd.rot });
      }
    }
    /* بيبص لقدام: كل صف ممكن (أفقي أو رأسي) بيتجرب لحد آخر الشيت، والصف اللي يخلّي الشيت يشيل أكتر هو اللي بيتحط.
       وبعد كل صف الاتجاه بيتختار من جديد (شريحة رأسية وبعدها أفقية مثلاً) زي ما الصنايعي بيقطع */
    function pilot(r, c, out, sm, dirs) {
      var area = 0, guard = 0;
      while (ok2(r) && guard++ < 500) {
        var pick = null;
        dirs.forEach(function (d) {
          candsOf(r, c, d, sm).forEach(function (cd) {
            var c2 = c.slice(); c2[cd.ti] -= cd.n;
            var p = cutOf(r, cd, d), A = cd.n * cd.pw * cd.ph;
            if (ok2(p.side)) A += fill(p.side, c2, d === 'H' ? 'V' : 'H', false, null, sm);
            var tot = A;
            if (ok2(p.rest)) tot += Math.max.apply(null, dirs.map(function (d2) { return fill(p.rest, c2.slice(), d2, false, null, sm); }));
            tot *= jit();
            var e = A / ((d === 'H' ? r.w : r.h) * cd.b);
            if (!pick || tot > pick.tot + EPS || (Math.abs(tot - pick.tot) <= EPS && (e > pick.e + EPS || (Math.abs(e - pick.e) <= EPS && cd.b > pick.cd.b + EPS))))
              pick = { cd: cd, d: d, tot: tot, e: e };
          });
        });
        if (!pick) break;
        var cd = pick.cd, d = pick.d, p = cutOf(r, cd, d);
        putRow(r, cd, d, out); c[cd.ti] -= cd.n; area += cd.n * cd.pw * cd.ph;
        if (ok2(p.side)) {
          // الباقي جنب الصف: بالطريقة السريعة، أو بالبص لقدام لو ده هيحط أكتر (للطلبيات الصغيرة)
          var cg = c.slice(), og = [], ag = fill(p.side, cg, d === 'H' ? 'V' : 'H', false, og, sm);
          if (items.length <= 80) {
            var cp = c.slice(), op = [], ap = pilot(p.side, cp, op, sm, ['H', 'V']);
            if (ap > ag + EPS) { cg = cp; og = op; ag = ap; }
          }
          for (var ci = 0; ci < c.length; ci++) c[ci] = cg[ci];
          if (out) og.forEach(function (q) { out.push(q); });
          area += ag;
        }
        r = p.rest;
      }
      return area;
    }
    // الشريحة: صف من مقاس واحد على طول المحور، والباقي من الشريحة بيتملي بالاتجاه التاني
    function fill(r, c, d, deep, out, sm) {
      var area = 0, guard = 0;
      while (r.w > EPS && r.h > EPS && guard++ < 500) {
        var L = d === 'H' ? r.w : r.h, cands = candsOf(r, c, d, sm);
        if (!cands.length) break;
        var pick = null;
        if (deep) {
          // كل اختيار بيتجرب: الصف + اللي يتملي جنبه، ونسبة الملو في الشريحة هي الحكم
          var maxE = 0;
          cands.forEach(function (cd) {
            var c2 = c.slice(); c2[cd.ti] -= cd.n;
            var rl = cd.n * cd.a + (cd.n - 1) * k;
            var sub = d === 'H' ? { x: 0, y: 0, w: r.w - rl - k, h: cd.b } : { x: 0, y: 0, w: cd.b, h: r.h - rl - k };
            cd.A = cd.n * cd.pw * cd.ph + (sub.w > EPS && sub.h > EPS ? fill(sub, c2, d === 'H' ? 'V' : 'H', false, null, sm) : 0);
            cd.e = cd.A / (L * cd.b); if (cd.e > maxE) maxE = cd.e;
          });
          cands.forEach(function (cd) {
            var better;
            if (!pick) better = true;
            else if (pol === 'big') {
              var okA = cd.e >= maxE * 0.85 - EPS, okB = pick.e >= maxE * 0.85 - EPS;
              better = okA !== okB ? okA : cd.b > pick.b + EPS || (Math.abs(cd.b - pick.b) <= EPS && cd.e > pick.e + EPS);
            } else if (pol === 'fill') {
              better = cd.A > pick.A + EPS || (Math.abs(cd.A - pick.A) <= EPS && cd.e > pick.e + EPS);
            } else {
              better = cd.e > pick.e + EPS || (Math.abs(cd.e - pick.e) <= EPS && (cd.b > pick.b + EPS || (Math.abs(cd.b - pick.b) <= EPS && cd.A > pick.A + EPS)));
            }
            if (better) pick = cd;
          });
        } else {
          // جوه الشريحة: أكبر قطعة الأول، وبعدها اللي يملا الصف أكتر
          cands.forEach(function (cd) {
            var s = cd.pw * cd.ph, f = cd.n * cd.a;
            if (!pick || s > pick.pw * pick.ph + EPS || (Math.abs(s - pick.pw * pick.ph) <= EPS && f > pick.n * pick.a + EPS)) pick = cd;
          });
        }
        var rowLen = pick.n * pick.a + (pick.n - 1) * k;
        for (var j = 0; j < pick.n; j++) {
          var off = j * (pick.a + k);
          if (out) out.push({ ti: pick.ti, x: r.x + (d === 'H' ? off : 0), y: r.y + (d === 'H' ? 0 : off), w: pick.pw, h: pick.ph, rot: pick.rot });
        }
        c[pick.ti] -= pick.n; area += pick.n * pick.pw * pick.ph;
        var sr = d === 'H' ? { x: r.x + rowLen + k, y: r.y, w: r.w - rowLen - k, h: pick.b } : { x: r.x, y: r.y + rowLen + k, w: pick.b, h: r.h - rowLen - k };
        if (sr.w > EPS && sr.h > EPS) area += fill(sr, c, d === 'H' ? 'V' : 'H', false, out, sm);
        r = d === 'H' ? { x: r.x, y: r.y + pick.b + k, w: r.w, h: r.h - pick.b - k } : { x: r.x + pick.b + k, y: r.y, w: r.w - pick.b - k, h: r.h };
      }
      return area;
    }
    // البص لقدام تقيل مع الطلبيات الكبيرة جداً، فبيتجرب لحد 300 قطعة بس
    if (pol === 'pilot' && items.length > 300) return null;
    var pdirs = S.opts.orient === 'h' ? ['H'] : S.opts.orient === 'v' ? ['V'] : ['H', 'V'];
    var deepTop = pol !== 'greedy', used = stock.map(function () { return false; }), sheets = [];
    while (left > 0) {
      if (S.opts.one && sheets.length >= 1) break;
      // الشيت الجاي: لو فيه شيت يشيل كل الباقي ناخد أصغرهم، غير كده الشيت اللي يتملي أكتر
      var best = null, tried = {};
      for (var si = 0; si < stock.length; si++) {
        if (used[si]) continue; var st = stock[si], sk = st.W + '|' + st.H + '|' + st.m;
        if (tried[sk]) continue; tried[sk] = 1;
        var c3 = cnt.slice(), out = [];
        var A = pol === 'pilot' ? pilot({ x: 0, y: 0, w: st.W, h: st.H }, c3, out, useM ? st.m : '', pdirs)
          : fill({ x: 0, y: 0, w: st.W, h: st.H }, c3, dir, deepTop, out, useM ? st.m : '');
        if (!out.length) continue;
        var all = c3.every(function (v) { return !v; }), u = A / (st.W * st.H);
        if (!best || (all && (!best.all || st.W * st.H < best.st.W * best.st.H - EPS)) || (!all && !best.all && u > best.u + EPS)) best = { si: si, st: st, out: out, c: c3, all: all, u: u };
      }
      if (!best) break;
      used[best.si] = true;
      var sh = { W: best.st.W, H: best.st.H, m: best.st.m, ri: best.st.ri, si: best.si, k: k, free: [], placed: [], cuts: [] };
      best.out.forEach(function (p) { sh.placed.push({ x: p.x, y: p.y, w: p.w, h: p.h, it: types[p.ti].q.shift(), rot: p.rot }); });
      left -= best.out.length; cnt = best.c;
      if (!derive(sh, k)) return null;
      sheets.push(sh);
    }
    var unplaced = [];
    types.forEach(function (t) { unplaced = unplaced.concat(t.q); });
    return { sheets: sheets, unplaced: unplaced };
  }
  function cmp(a, b) { for (var i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] - b[i]; } return 0; }
  /* ترتيب الحلول: أقل قطع مش متحطة، أقل مساحة شيتات، أقل عدد شيتات، أكبر فضلة سليمة (حتة واحدة تنفع تتباع أو تتشغل)،
     أقل فضلات متقطعة، أقل قصات. الفضلة بتتقرّب لـ 5% من الشيت عشان الفروق الصغيرة ما تغلبش ترتيب القطع وعدد القصات */
  function scoreOf(res) {
    var big = 0;
    res.sheets.forEach(function (s) {
      var m = s.free.reduce(function (a, f) { return Math.max(a, f.w * f.h); }, 0);
      big += Math.floor(m / (s.W * s.H) * 20);
    });
    return [res.unplaced.length, res.sheets.reduce(function (a, s) { return a + s.W * s.H; }, 0), res.sheets.length, -big,
      res.sheets.reduce(function (a, s) { return a + s.free.length; }, 0), res.sheets.reduce(function (a, s) { return a + s.cuts.length; }, 0)];
  }

  function pack(S, list, stock, rule, k, initial) {
    var open = initial || [], used = stock.map(function () { return false; }), unplaced = [];
    open.forEach(function (sh) { if (sh.si != null) used[sh.si] = true; });
    var orients = function (it) { return S.opts.grain ? [[it.w, it.h, false]] : [[it.w, it.h, false], [it.h, it.w, true]]; };
    function find(sheets, it) {
      var b = null;
      sheets.forEach(function (sh) {
        if (S.opts.material && sh.m && it.m && sh.m !== it.m) return;
        sh.free.forEach(function (f, fi) {
          orients(it).forEach(function (o) {
            var pw = o[0], ph = o[1];
            if (pw <= f.w + EPS && ph <= f.h + EPS) {
              var s = f.w * f.h - pw * ph, t = Math.min(f.w - pw, f.h - ph);
              if (!b || s < b.s - EPS || (Math.abs(s - b.s) <= EPS && t < b.t)) b = { sh: sh, fi: fi, pw: pw, ph: ph, rot: o[2], s: s, t: t };
            }
          });
        });
      });
      return b;
    }
    list.forEach(function (it) {
      var b = find(open, it);
      if (!b) {
        if (S.opts.one && open.length >= 1) { unplaced.push(it); return; }
        var found = -1;
        for (var j = 0; j < stock.length && found < 0; j++) {
          if (used[j]) continue; var st = stock[j];
          if (S.opts.material && st.m && it.m && st.m !== it.m) continue;
          if (orients(it).some(function (o) { return o[0] <= st.W + EPS && o[1] <= st.H + EPS; })) found = j;
        }
        if (found < 0) { unplaced.push(it); return; }
        used[found] = true; var s0 = stock[found];
        var sh = { W: s0.W, H: s0.H, m: s0.m, ri: s0.ri, si: found, k: k, free: [{ x: 0, y: 0, w: s0.W, h: s0.H }], placed: [], cuts: [] };
        open.push(sh); b = find([sh], it);
      }
      place(b.sh, b.fi, it, b.pw, b.ph, b.rot, rule, k);
    });
    return { sheets: open, unplaced: unplaced };
  }
  function place(sh, fi, it, pw, ph, rot, rule, k) {
    var f = sh.free[fi]; sh.free.splice(fi, 1);
    var dw = f.w - pw, dh = f.h - ph;
    var horiz = rule === 'H' ? true : rule === 'V' ? false : rule === 'LAS' ? dw >= dh : dw < dh;
    if (dh <= EPS) horiz = false; else if (dw <= EPS) horiz = true;
    var mk = function (x, y, w, h) { return (w > EPS && h > EPS && Math.min(w, h) >= MINTRIM - EPS) ? { x: x, y: y, w: w, h: h } : null; };
    sh.placed.push({ x: f.x, y: f.y, w: pw, h: ph, it: it, rot: rot });
    var A, B;
    if (horiz) {
      if (dh > EPS) { A = { x: f.x, y: f.y, w: f.w, h: ph }; B = mk(f.x, f.y + ph + k, f.w, dh - k); sh.cuts.push({ rw: f.w, rh: f.h, axis: 'y', pos: ph, len: f.w, A: A, B: B }); if (B) sh.free.push(B); }
      if (dw > EPS) { A = { x: f.x, y: f.y, w: pw, h: ph }; B = mk(f.x + pw + k, f.y, dw - k, ph); sh.cuts.push({ rw: f.w, rh: ph, axis: 'x', pos: pw, len: ph, A: A, B: B }); if (B) sh.free.push(B); }
    } else {
      if (dw > EPS) { A = { x: f.x, y: f.y, w: pw, h: f.h }; B = mk(f.x + pw + k, f.y, dw - k, f.h); sh.cuts.push({ rw: f.w, rh: f.h, axis: 'x', pos: pw, len: f.h, A: A, B: B }); if (B) sh.free.push(B); }
      if (dh > EPS) { A = { x: f.x, y: f.y, w: pw, h: ph }; B = mk(f.x, f.y + ph + k, pw, dh - k); sh.cuts.push({ rw: pw, rh: f.h, axis: 'y', pos: ph, len: pw, A: A, B: B }); if (B) sh.free.push(B); }
    }
  }
  function finalize(res) {
    var same = function (a, b) { return a && Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.w - b.w) < 1e-6 && Math.abs(a.h - b.h) < 1e-6; };
    res.sheets.forEach(function (sh) {
      var lab = function (p) {
        if (!p) return { t: '-', s: false, w: 0, h: 0 };
        if (sh.placed.some(function (q) { return same(p, q); })) return { t: 'p', s: false, w: p.w, h: p.h };
        if (sh.free.some(function (q) { return same(p, q); })) return { t: 's', s: true, w: p.w, h: p.h };
        return { t: '-', s: false, w: 0, h: 0 };
      };
      sh.cuts.forEach(function (c) { c.la = lab(c.A); c.lb = lab(c.B); });
      sh.used = sh.placed.reduce(function (a, p) { var ell = p.it && (p.it.s === 'c' || p.it.s === 'o'); return a + (ell ? Math.PI / 4 : 1) * p.w * p.h; }, 0);
      sh.waste = sh.W * sh.H - sh.used;
      sh.cutLen = sh.cuts.reduce(function (a, c) { return a + c.len; }, 0);
    });
  }

  /* استنتاج قصات مستقيمة (guillotine) من أماكن القطع الحالية — بتتستخدم بعد التحريك اليدوي */
  function derive(sh, k) {
    var cuts = [], free = [], ok = true;
    var close = function (a, b) { return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.w - b.w) < 1e-6 && Math.abs(a.h - b.h) < 1e-6; };
    // كل قصة بتشيل شريحة [s,e] عرضها سُمك الشفرة (أو أقل لو جنب حافة القطعة)
    function rec(r, ps) {
      if (!ps.length) { if (Math.min(r.w, r.h) >= MINTRIM - EPS) free.push(r); return; }
      if (ps.length === 1 && close(ps[0], r)) return;
      var best = null;
      ['x', 'y'].forEach(function (ax) {
        var len = ax === 'x' ? 'w' : 'h', r0 = r[ax], r1 = r[ax] + r[len], cands = [];
        ps.forEach(function (p) {
          cands.push([p[ax] + p[len], Math.min(p[ax] + p[len] + k, r1), p[ax] + p[len]]);   // قصة على يمين/تحت القطعة
          cands.push([Math.max(p[ax] - k, r0), p[ax], p[ax]]);                               // قصة على شمال/فوق القطعة
        });
        cands.forEach(function (cd) {
          var s0 = cd[0], e0 = cd[1];
          if (s0 >= r1 - EPS || e0 <= r0 + EPS) return;                 // القصة لازم تبقى جوه القطعة
          if (s0 <= r0 + EPS && e0 >= r1 - EPS) return;
          var A = [], B = [], bad = false;
          ps.forEach(function (p) {
            if (p[ax] + p[len] <= s0 + EPS) A.push(p); else if (p[ax] >= e0 - EPS) B.push(p); else bad = true;
          });
          if (bad) return;
          var aw = s0 - r0, bw = r1 - e0;
          var trim = !(A.length && B.length);
          var ea = trim ? (A.length ? Math.max(0, bw) : Math.max(0, aw)) * (ax === 'x' ? r.h : r.w) : 0;
          var sc = trim ? 0 : 1;
          if (!best || sc < best.sc || (sc === best.sc && trim && ea > best.ea + EPS)) best = { ax: ax, s: s0, e: e0, pos: cd[2], A: A, B: B, sc: sc, ea: ea, aw: aw, bw: bw };
        });
      });
      if (!best) { ok = false; return; }
      var Ar = null, Br = null;
      if (best.ax === 'x') {
        if (best.aw > EPS) Ar = { x: r.x, y: r.y, w: best.aw, h: r.h };
        if (best.bw > EPS) Br = { x: best.e, y: r.y, w: best.bw, h: r.h };
        cuts.push({ rw: r.w, rh: r.h, axis: 'x', pos: best.pos - r.x, len: r.h, A: Ar, B: Br });
      } else {
        if (best.aw > EPS) Ar = { x: r.x, y: r.y, w: r.w, h: best.aw };
        if (best.bw > EPS) Br = { x: r.x, y: best.e, w: r.w, h: best.bw };
        cuts.push({ rw: r.w, rh: r.h, axis: 'y', pos: best.pos - r.y, len: r.w, A: Ar, B: Br });
      }
      if (Ar) rec(Ar, best.A); else if (best.A.length) { ok = false; return; }
      if (Br) rec(Br, best.B); else if (best.B.length) { ok = false; return; }
    }
    rec({ x: 0, y: 0, w: sh.W, h: sh.H }, sh.placed.filter(function (p) { return !p.free; }));
    sh.cuts = ok ? cuts : []; sh.free = ok ? free : []; sh.ok = ok; sh.k = k;
    return ok;
  }
  function repack(S, R) {
    var k = R.k, items = [], bad = false;
    R.sheets.forEach(function (sh) { sh.placed.forEach(function (p) { if (!p.locked || p.free) items.push(p.it); }); });
    items = items.concat(R.unplaced);
    var make = function () {
      var out = [];
      R.sheets.forEach(function (sh) {
        var pins = sh.placed.filter(function (p) { return p.locked && !p.free; });
        if (!pins.length) return;
        var t = { W: sh.W, H: sh.H, m: sh.m, ri: sh.ri, si: sh.si, placed: pins.map(function (p) { return Object.assign({}, p); }), free: [], cuts: [] };
        if (!derive(t, k)) bad = true;
        t.cuts = [];
        out.push(t);
      });
      return out;
    };
    make(); if (bad) return null;
    var best = bestPack(S, items, R.stock, k, make);
    best.sheets.forEach(function (sh) { derive(sh, k); });
    best.sheets = best.sheets.filter(function (sh) { return sh.placed.length; });
    best.k = k; best.nItems = R.nItems; best.nStock = R.nStock; best.stock = R.stock; best.items = R.items;
    finalize(best);
    return best;
  }

  /* ملء الفراغات حول الدوائر/البيضاوي بقطع مستطيلة (خارج القصات المستقيمة) */
  function ellOverlap(rx, ry, rw, rh, e, k) {
    var cx = e.x + e.w / 2, cy = e.y + e.h / 2, a = e.w / 2 + k, b = e.h / 2 + k;
    var u0 = (rx - cx) / a, u1 = (rx + rw - cx) / a, v0 = (ry - cy) / b, v1 = (ry + rh - cy) / b;
    var u = Math.max(u0, Math.min(0, u1)), v = Math.max(v0, Math.min(0, v1));
    return u * u + v * v < 1 - 1e-9;
  }
  function pieceClash(x, y, w, h, q, k) {
    var sh = q.it && q.it.s;
    if (sh === 'c' || sh === 'o') return ellOverlap(x, y, w, h, q, k);
    return x < q.x + q.w + k - EPS && q.x < x + w + k - EPS && y < q.y + q.h + k - EPS && q.y < y + h + k - EPS;
  }
  function hasRound(R) { return R.sheets.some(function (sh) { return sh.placed.some(function (p) { return isRoundIt(p.it); }); }); }
  // هل القطعة المستطيلة (x,y,w,h) ممكن تطلع من ركن مربع دائرة/بيضاوي؟
  // لازم تبقى جوه مربع دائرة واحدة بالكامل (عشان القصات المستقيمة ما تقطعهاش)، وبره الدائرة نفسها.
  function gapSpotOk(sh, others, x, y, w, h, k) {
    if (x < -EPS || y < -EPS || x + w > sh.W + EPS || y + h > sh.H + EPS) return false;
    var host = null;
    for (var i = 0; i < others.length; i++) {
      var q = others[i];
      if (!q.free && isRoundIt(q.it) && x >= q.x - EPS && y >= q.y - EPS && x + w <= q.x + q.w + EPS && y + h <= q.y + q.h + EPS) { host = q; break; }
    }
    if (!host) return false;
    for (var j = 0; j < others.length; j++) { if (pieceClash(x, y, w, h, others[j], k)) return false; }
    return true;
  }
  function gapFill(S, R) {
    if (!R || !R.sheets.length || !hasRound(R)) return;
    var k = R.k, t0 = now(), BUDGET = 1200, out = false, ticks = 0;
    function tryPlace(sh, it, fails) {
      if (out || isRoundIt(it)) return null;
      if (S.opts.material && sh.m && it.m && sh.m !== it.m) return null;
      var rot = !S.opts.grain;
      var a0 = rot ? Math.min(it.w, it.h) : it.w, b0 = rot ? Math.max(it.w, it.h) : it.h;
      for (var f = 0; f < fails.length; f++) { if (a0 >= fails[f][0] - EPS && b0 >= fails[f][1] - EPS) return null; }
      var os = rot ? [[it.w, it.h, false], [it.h, it.w, true]] : [[it.w, it.h, false]];
      var q3 = quantum(sh.W, sh.H, 1), st = Math.max(q3, roundQ(Math.max(sh.W, sh.H) / 250, q3));
      var rounds = sh.placed.filter(function (q) { return isRoundIt(q.it); });
      for (var oi = 0; oi < os.length; oi++) {
        var w = os[oi][0], h = os[oi][1];
        if (w > sh.W + EPS || h > sh.H + EPS) continue;
        for (var ri = 0; ri < rounds.length; ri++) {
          var rb = rounds[ri];
          if (w > rb.w + EPS || h > rb.h + EPS) continue;
          var x0 = rb.x, x1 = rb.x + rb.w - w, y0 = rb.y, y1 = rb.y + rb.h - h;
          // الأركان الأربعة الأول، وبعدين باقي الأماكن
          var corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
          for (var cI = 0; cI < 4; cI++) {
            if (gapSpotOk(sh, sh.placed, corners[cI][0], corners[cI][1], w, h, k)) return { x: corners[cI][0], y: corners[cI][1], w: w, h: h, it: it, rot: os[oi][2], free: true };
          }
          for (var y = y0; y <= y1 + EPS; y += st) {
            for (var x = x0; x <= x1 + EPS; x += st) {
              if ((++ticks & 255) === 0 && now() - t0 > BUDGET) { out = true; return null; }
              var xr = Math.max(x0, Math.min(x1, roundQ(x, q3))), yr = Math.max(y0, Math.min(y1, roundQ(y, q3)));
              if (gapSpotOk(sh, sh.placed, xr, yr, w, h, k)) return { x: xr, y: yr, w: w, h: h, it: it, rot: os[oi][2], free: true };
            }
          }
        }
      }
      fails.push([a0, b0]);
      return null;
    }
    var changed = false;
    // 1) القطع اللي ملقتش مكان (الأكبر الأول)
    var still = [], fails = R.sheets.map(function () { return []; });
    R.unplaced.slice().sort(function (a, b) { return b.w * b.h - a.w * a.h; }).forEach(function (it) {
      var put = null;
      for (var i = 0; i < R.sheets.length && !put; i++) { put = tryPlace(R.sheets[i], it, fails[i]); if (put) R.sheets[i].placed.push(put); }
      if (put) changed = true; else still.push(it);
    });
    R.unplaced = still;
    // 2) نقل قطع آخر شيت لفراغات الشيتات اللي قبله، ولو نجحت كلها يتشال الشيت
    var guard = 0;
    while (R.sheets.length > 1 && guard++ < 4 && !out) {
      var last = R.sheets[R.sheets.length - 1], added = [], ok = true, f2 = R.sheets.map(function () { return []; });
      last.placed.slice().sort(function (a, b) { return b.w * b.h - a.w * a.h; }).forEach(function (p) {
        if (!ok) return;
        var put = null;
        for (var i = 0; i < R.sheets.length - 1 && !put; i++) { put = tryPlace(R.sheets[i], p.it, f2[i]); if (put) { R.sheets[i].placed.push(put); added.push([R.sheets[i], put]); } }
        if (!put) ok = false;
      });
      if (ok) { R.sheets.pop(); changed = true; }
      else { added.forEach(function (a) { a[0].placed.splice(a[0].placed.indexOf(a[1]), 1); }); break; }
    }
    if (changed) { R.sheets.forEach(function (sh) { derive(sh, k); }); finalize(R); }
  }

  /* ================= الـ widget ================= */
  function mount(el, options) {
    options = options || {};
    injectCss();
    var lang = options.lang === 'en' ? 'en' : 'ar';
    var L = T[lang];
    var storageKey = options.storageKey === undefined ? 'cutlist-widget-v1' : options.storageKey;
    var S = EXAMPLE();
    var view = { zoom: 1, font: 11, color: true, dims: true, sheet: 0, tab: 'in', sel: null };
    var R = null;
    var geo = { s: 1, ml: 0, mt: 0 };
    var drag = null;

    if (storageKey) {
      try {
        var raw = localStorage.getItem(storageKey);
        if (raw) {
          var o = JSON.parse(raw);
          if (o && Array.isArray(o.panels) && Array.isArray(o.stock) && o.opts && typeof o.opts === 'object') {
            S = { panels: o.panels.map(strRow), stock: o.stock.map(strRow), opts: Object.assign(EXAMPLE().opts, o.opts), src: o.src || null };
            S.opts.kerf = String(S.opts.kerf == null ? '0' : S.opts.kerf);
            // بيانات قديمة فيها دواير ومفيهاش الخيار → نسيبه ظاهر
            if (o.opts.shapes === undefined) S.opts.shapes = S.panels.some(function (r) { return r.s === 'c' || r.s === 'o'; });
          }
        }
      } catch (e) {}
    }
    if (S.opts.gaps === undefined) S.opts.gaps = true;
    if (options.state) applyState(options.state);

    el.innerHTML = '';
    var root = document.createElement('div');
    root.className = 'cl';
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    if (options.theme === 'light' || options.theme === 'dark') root.setAttribute('data-theme', options.theme);
    var CHEV = '<svg class="chev" viewBox="0 0 12 12"><path d="M1 3l5 6 5-6z" fill="currentColor"/></svg>';
    root.innerHTML =
      '<header class="bar">' +
        (options.findInvoice ? '<form class="invf" role="search" data-r="invf">' +
          '<input id="clinv' + uid + '" data-r="invq" type="search" placeholder="' + L.invPh + '" aria-label="' + L.invLabel + '" autocomplete="off" enterkeyhint="search">' +
          '<button class="btn" type="submit" aria-label="' + L.invGo + '"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></button></form>'
          : '<div class="brand"><span>' + L.title + '</span></div>') +
        '<button class="btn ic2" data-a="settings" title="' + L.settings + '" aria-label="' + L.settings + '"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.4 13a7.6 7.6 0 000-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 00-1.7-1L15 3h-4l-.4 2.9a7.4 7.4 0 00-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 000 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 001.7 1L11 21h4l.4-2.9a7.4 7.4 0 001.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1113 8.5a3.5 3.5 0 010 7z"/></svg></button>' +
        '<button class="btn ic2" data-a="menu" title="' + L.menu + '" aria-label="' + L.menu + '"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2.1"/><circle cx="12" cy="12" r="2.1"/><circle cx="12" cy="19" r="2.1"/></svg></button>' +
        '<div class="menu" data-r="menu" hidden>' +
          '<button data-a="clear" data-i="＋">' + L.clear + '</button>' +
          '<button data-a="msave" data-i="⭳">' + L.mSave + '</button>' +
          '<button data-a="mload" data-i="⭱">' + L.mLoad + '</button><hr>' +
          '<button data-a="mpdf" data-i="▤">' + L.mPdf + '</button>' +
          '<button data-a="mimg" data-i="▣">' + L.mImg + '</button><hr>' +
          '<button data-a="example" data-i="★">' + L.example + '</button></div></header>' +
      '<div class="invmsg" data-r="invmsg" role="status"></div>' +
      '<div class="main">' +
      '<aside class="left">' +
        '<section class="sec"><button class="hd2"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h4v14H3zM9 5h12v6H9zM9 13h12v6H9z"/></svg>' + L.panels + CHEV + '</button><div class="body"><div data-r="src"></div><div class="tw"><table class="t" data-t="panels"><thead></thead><tbody></tbody></table></div></div></section>' +
        '<section class="sec"><button class="hd2"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l10 5-10 5L2 7zM2 12l10 5 10-5-2-1-8 4-8-4zM2 16l10 5 10-5-2-1-8 4-8-4z"/></svg>' + L.stock + CHEV + '</button><div class="body tw"><table class="t" data-t="stock"><thead></thead><tbody></tbody></table></div></section>' +
      '</aside>' +
      '<main class="center">' +
        '<div class="tool" role="toolbar">' +
          '<button data-a="zin" title="' + L.zin + '" aria-label="' + L.zin + '"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="M15 15l6 6M10 7v6M7 10h6"/></svg></button>' +
          '<button data-a="zout" title="' + L.zout + '" aria-label="' + L.zout + '"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="M15 15l6 6M7 10h6"/></svg></button>' +
          '<button data-a="zfit" title="' + L.zfit + '" aria-label="' + L.zfit + '"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>' +
          '<span class="sp"></span>' +
          '<button data-a="fup" title="' + L.fup + '" aria-label="' + L.fup + '"><span style="font-size:17px">A</span><span style="font-size:11px">A</span></button>' +
          '<button data-a="fdn" title="' + L.fdn + '" aria-label="' + L.fdn + '"><span style="font-size:13px">A</span><span style="font-size:9px">A</span></button>' +
          '<span class="sp"></span>' +
          '<button data-a="tcol" class="on" title="' + L.col + '" aria-label="' + L.col + '"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.4-2-.6-1 0-2.2 1.3-2.2H17a4 4 0 004-4c0-5-4-9.8-9-9.8z"/></svg></button>' +
          '<button data-a="tdim" class="on" title="' + L.dim + '" aria-label="' + L.dim + '"><svg viewBox="0 0 24 24"><path d="M3 8h18v8H3zM7 8v4M11 8v3M15 8v4M19 8v3"/></svg></button>' +
        '<button class="txt" data-a="compact">' + L.compact + '</button><button class="txt" data-a="chg">' + L.chg + '</button><button class="txt" data-a="more">' + L.more + '</button><button class="txt" data-a="rearr">' + L.rearr + '</button></div>' +
        '<p class="hint">' + L.hint + '</p><div class="selbar" data-r="selbar" hidden></div>' +
        '<div data-r="notice"></div><div class="cv-wrap" data-r="canvas"></div>' +
      '</main>' +
      '<aside class="right">' +
        '<section class="card"><button class="hd">' + L.g + CHEV + '</button><div class="cb" data-r="g"></div></section>' +
        '<section class="card"><button class="hd">' + L.s + CHEV + '</button><div class="chipsrow" data-r="chips1"></div><div class="cb" data-r="s"></div></section>' +
        '<section class="card"><button class="hd">' + L.c + CHEV + '</button><div class="chipsrow" data-r="chips2"></div><div class="cb" data-r="c"></div><button class="copy" data-a="copy">' + L.copy + '</button></section>' +
      '</aside>' +
      '</div><div class="toast" role="status"></div>' +
      '<button class="fab" data-a="calc" title="' + L.calc + '" aria-label="' + L.calc + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l14 8-14 8z"/></svg></button>' +
      '<div class="menu tmenu" data-r="tmenu" hidden><button data-a="tact" data-t="on" data-i="☑">' + L.tOn + '</button><button data-a="tact" data-t="off" data-i="☐">' + L.tOff + '</button><button data-a="tact" data-t="sort" data-i="⇅">' + L.tSort + '</button><button data-a="tact" data-t="clear" data-i="✕">' + L.tClear + '</button></div>' +
      '<input type="file" data-r="file" accept=".json,application/json" hidden>' +
      '<div class="sov" data-r="sov" hidden><div class="dlg" role="dialog" aria-modal="true" aria-label="' + L.settings + '">' +
        '<div class="dh"><div><b>' + L.settings + '</b></div><button class="ic x" data-a="setx" aria-label="' + L.invClose + '">' + ICON_DEL + '</button></div>' +
        '<div class="db"><div class="opts">' +
          '<div class="srow"><label for="clk' + uid + '">' + L.kerf + '</label><input class="k" id="clk' + uid + '" data-o="kerf" inputmode="decimal"></div>' +
          '<div class="srow"><label>' + L.setOrient + '</label><select data-o="orient"><option value="o">' + L.oOpt + '</option><option value="v">' + L.oV + '</option><option value="h">' + L.oH + '</option></select></div>' +
          '<div class="srow"><label>' + L.setUnit + '</label><select data-o="unit"><option value="">' + L.uGen + '</option><option value="cm">' + L.uCm + '</option><option value="mm">' + L.uMm + '</option><option value="m">' + L.uM + '</option><option value="in">' + L.uIn + '</option></select></div>' +
          '<div class="srow"><label>' + L.setDim + '</label><select data-o="dimOrder"><option value="lw">' + L.dimLW + '</option><option value="wl">' + L.dimWL + '</option></select></div>' +
          '<div class="srow"><label for="cld' + uid + '">' + L.setDec + '</label><input class="k" id="cld' + uid + '" data-o="dec" inputmode="numeric"></div>' +
          '<div class="srow"><label for="clt' + uid + '">' + L.setTrim + '</label><input class="k" id="clt' + uid + '" data-o="trim" inputmode="decimal"></div>' +
          opt('labels', L.labels) + opt('one', L.one) + opt('material', L.material) + opt('grain', L.grain) + opt('shapes', L.shapesOpt) + opt('gaps', L.gaps) +
        '</div></div><div class="df"><button class="btn go" data-a="setx">' + L.ok + '</button></div></div></div>';
    el.appendChild(root);

    function opt(key, label) {
      var id = 'clo' + key + uid;
      return '<div class="opt" data-row="' + key + '"><label for="' + id + '">' + label + '</label><span class="sw"><input type="checkbox" id="' + id + '" data-o="' + key + '"><i></i></span></div>';
    }
    var $ = function (s) { return root.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
    var rr = function (n) { return root.querySelector('[data-r="' + n + '"]'); };

    /* ---- state ---- */
    function unitSfx() { var u = { cm: L.uCm, mm: L.uMm, m: L.uM, 'in': L.uIn }[S.opts.unit]; return u ? ' (' + u + ')' : ''; }
    function syncOpts() {
      var d = parseInt(normNum(S.opts.dec), 10); DEC = isNaN(d) ? 2 : Math.max(0, Math.min(4, d));
      DIMWL = S.opts.dimOrder === 'wl'; MINTRIM = num(S.opts.trim);
    }
    function normalize(kind) {
      var a = S[kind], min = 1;
      while (a.length && isBlank(a[a.length - 1])) a.pop();
      var target = Math.max(min, a.length + 1); while (a.length < target) a.push(blank());
    }
    function applyState(st) {
      if (st.panels) S.panels = st.panels.map(strRow);
      if (st.stock) S.stock = st.stock.map(strRow);
      if (st.opts) { for (var k in st.opts) if (k in S.opts) S.opts[k] = /^(kerf|dec|trim|dimOrder|orient|unit)$/.test(k) ? String(st.opts[k]) : !!st.opts[k]; }
      if (st.src !== undefined) S.src = st.src;
      syncOpts();
    }
    function persist() {
      var clean = JSON.parse(JSON.stringify(S));
      if (storageKey) { try { localStorage.setItem(storageKey, JSON.stringify(clean)); } catch (e) {} }
      if (options.onChange) { try { options.onChange(clean); } catch (e) {} }
    }

    /* ---- tables ---- */
    var SHAPE_ICON = {
      r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="6.5" width="16" height="11" rx="1"/></svg>',
      c: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>',
      o: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="9.5" ry="6"/></svg>'
    };
    function shapeName(k) { return k === 'c' ? L.shapeC : k === 'o' ? L.shapeO : L.shapeR; }
    function actHtml(r) {
      return isBlank(r) ? '' : '<button class="ic ok' + (r.on ? '' : ' off') + '" data-a="tog" title="' + L.enable + '" aria-label="' + L.enable + '">' + ICON_OK + '</button><button class="ic del" data-a="del" title="' + L.del + '" aria-label="' + L.del + '">' + ICON_DEL + '</button>';
    }
    function rowHtml(r, i, kind) {
      var mat = S.opts.material;
      return '<tr class="' + (r.on ? '' : 'off') + '" data-i="' + i + '">' +
        '<td><input data-k="l" inputmode="decimal" aria-label="' + L.len + '" value="' + esc(r.l) + '"></td>' +
        '<td><input data-k="w" inputmode="decimal" aria-label="' + L.wid + '" value="' + esc(r.w) + '"' + (S.opts.shapes && r.s === 'c' ? ' readonly' : '') + '></td>' +
        '<td><input data-k="q" inputmode="numeric" aria-label="' + L.qty + '" value="' + esc(r.q) + '"></td>' +
        (mat ? '<td><input data-k="m" aria-label="' + L.mat + '" value="' + esc(r.m) + '"></td>' : '') +
        (kind === 'panels' && S.opts.shapes ? '<td class="shp"><button class="ic shape" data-a="shape" title="' + L.shape + ': ' + shapeName(r.s) + '" aria-label="' + L.shape + ': ' + shapeName(r.s) + '">' + SHAPE_ICON[r.s || 'r'] + '</button></td>' : '') +
        '<td class="act">' + actHtml(r) + '</td></tr>';
    }
    function renderTable(kind) {
      var tb = $('[data-t="' + kind + '"]');
      tb.querySelector('thead').innerHTML = '<tr><th>' + L.len + unitSfx() + '</th><th>' + L.wid + unitSfx() + '</th><th>' + L.qty + '</th>' + (S.opts.material ? '<th>' + L.mat + '</th>' : '') + (kind === 'panels' && S.opts.shapes ? '<th></th>' : '') + '<th class="tm"><button class="ic tmb" data-a="tmenu" aria-label="' + L.menu + '">' + ICON_MENU + '</button></th></tr>';
      tb.querySelector('tbody').innerHTML = S[kind].map(function (r, i) { return rowHtml(r, i, kind); }).join('');
    }
    function renderAllInputs() {
      normalize('panels'); normalize('stock');
      syncOpts();
      ['kerf', 'dec', 'trim', 'dimOrder', 'orient', 'unit'].forEach(function (k) { var el = $('[data-o="' + k + '"]'); if (el) el.value = S.opts[k] == null ? '' : S.opts[k]; });
      ['labels', 'one', 'material', 'grain', 'shapes', 'gaps'].forEach(function (k) { $('[data-o="' + k + '"]').checked = !!S.opts[k]; });
      $('[data-row="gaps"]').hidden = !S.opts.shapes;
      renderSrc();
      renderTable('panels'); renderTable('stock');
    }

    /* ---- rendering ---- */
    var HUES = [320, 5, 205, 150, 35, 265];
    function hueFor(it) { return HUES[it.ri % HUES.length]; }
    var gid = uid;
    function unplacedNotice() {
      var m = {}; R.unplaced.forEach(function (u) { var k = pair(u.w, u.h); m[k] = (m[k] || 0) + 1; });
      var ar = lang === 'ar';
      return '<section class="card unfit"><button class="hd">' + (ar ? 'مش داخلة في الشيتات' : 'Unable to fit') + CHEV + '</button><div class="cb"><table><thead><tr><th>' + (ar ? 'المقاس' : 'Panel') + '</th><th>' + (ar ? 'العدد' : 'Qty') + '</th></tr></thead><tbody>' +
        Object.keys(m).map(function (k) { return '<tr><td><span class="n">' + k + '</span></td><td>' + m[k] + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    }
    function draw() {
      var cv = rr('canvas'), nt = rr('notice');
      nt.innerHTML = R && R.unplaced.length ? unplacedNotice() : '';
      if (!R || !R.sheets.length) {
        view.sel = null; rr('selbar').hidden = true;
        cv.innerHTML = '<div class="empty" style="direction:' + (lang === 'ar' ? 'rtl' : 'ltr') + '">' + (R && R.nItems > 0 && R.nStock === 0 ? L.empty2 : L.empty1) + '</div>';
        return;
      }
      var maxW = Math.max.apply(null, R.sheets.map(function (s) { return s.W; }));
      var ml = 4, mr = view.dims ? 46 : 4, mt = 6, mb = view.dims ? 40 : 6;
      var avail = Math.max(200, cv.clientWidth - 18 - ml - mr);
      var s = Math.min(avail / maxW, 8) * view.zoom, fs = view.font, html = '';
      geo = { s: s, ml: ml, mt: mt };
      R.sheets.forEach(function (sh, si) {
        var W = sh.W * s, H = sh.H * s, tw = ml + W + mr, th = mt + H + mb, g = '', usedHues = {};
        g += '<rect x="' + ml + '" y="' + mt + '" width="' + W + '" height="' + H + '" fill="var(--sheet)" style="filter:drop-shadow(2px 2px 2px rgba(0,0,0,.35))"/>';
        sh.free.forEach(function (f) {
          var x = ml + f.x * s, y = mt + f.y * s, w = f.w * s, h = f.h * s;
          g += '<g fill="var(--freefg)" font-size="' + fs + '"><title>' + L.surplus + ' ' + pair(f.w, f.h) + '</title><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="var(--freeline)" stroke-width="1.2"/>';
          var ftf = w > fs * String(fmt(f.w)).length * .6 + 8, flf = h > fs * String(fmt(f.h)).length * .6 + 10;
          var fTop = ftf && (h > fs * 2.2 || !flf);
          if (fTop) g += '<text x="' + (x + w / 2) + '" y="' + (y + fs + 3) + '" text-anchor="middle">' + fmt(f.w) + '</text>';
          if (flf && w > fs * 2.2 && (!fTop || h > fs * 2 + 12 + fs * String(fmt(f.h)).length * .6)) g += '<text transform="translate(' + (x + fs + 3) + ' ' + (y + h / 2) + ') rotate(-90)" text-anchor="middle">' + fmt(f.h) + '</text>';
          else if (flf && !fTop) g += '<text transform="translate(' + (x + w / 2 + fs / 3) + ' ' + (y + h / 2) + ') rotate(-90)" text-anchor="middle">' + fmt(f.h) + '</text>';
          g += '</g>';
        });
        sh.placed.forEach(function (p, pi) {
          var x = ml + p.x * s, y = mt + p.y * s, w = p.w * s, h = p.h * s;
          var hu = hueFor(p.it); usedHues[hu] = 1;
          var fill = view.color ? 'url(#clg' + gid + '-' + hu + ')' : 'var(--stripe)';
          var shp = p.it && p.it.s, nonRect = shp === 'c' || shp === 'o';
          var isSel = view.sel && view.sel.si === si && view.sel.pi === pi;
          var stroke = isSel ? 'stroke="var(--focus)" stroke-width="3"' : p.free ? 'stroke="var(--dimline)" stroke-width="1.6" stroke-dasharray="4 2"' : p.locked ? 'stroke="var(--hd)" stroke-width="2"' : 'stroke="var(--sheet-line)" stroke-width="1"';
          g += '<g class="pn" data-si="' + si + '" data-pi="' + pi + '" style="touch-action:none"><title>' + L.panel + ' ' + pair(p.w, p.h) + (p.rot ? ' (' + L.rot + ')' : '') + (nonRect ? ' · ' + (shp === 'c' ? L.shapeC : L.shapeO) : '') + (p.locked ? ' · ' + L.pinned : '') + '</title>' +
            '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (nonRect ? ' fill-opacity=".28"' : '') + ' ' + stroke + '/>' +
            (nonRect ? '<ellipse cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" rx="' + (w / 2) + '" ry="' + (h / 2) + '" fill="' + fill + '" stroke="var(--sheet-line)" stroke-width="1.2"/>' : '') +
            '<g fill="var(--fg)" font-size="' + fs + '">';
          var tfit = w > fs * String(fmt(p.w)).length * .6 + 8, lfit = h > fs * String(fmt(p.h)).length * .6 + 10;
          var pTop = tfit && (h > fs * 2.2 || !lfit);
          if (pTop) g += '<text x="' + (x + w / 2) + '" y="' + (y + fs + 3) + '" text-anchor="middle">' + fmt(p.w) + '</text>';
          if (lfit && w > fs * 2.2 && (!pTop || h > fs * 2 + 12 + fs * String(fmt(p.h)).length * .6)) g += '<text transform="translate(' + (x + fs + 3) + ' ' + (y + h / 2) + ') rotate(-90)" text-anchor="middle">' + fmt(p.h) + '</text>';
          else if (lfit && !pTop) g += '<text transform="translate(' + (x + w / 2 + fs / 3) + ' ' + (y + h / 2) + ') rotate(-90)" text-anchor="middle">' + fmt(p.h) + '</text>';
          if (S.opts.labels && w > fs * 3 && h > fs * 2.2) g += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + fs / 3) + '" text-anchor="middle" font-weight="700" opacity=".75">#' + (pi + 1) + '</text>';
          g += '</g>';
          if (p.locked && w > 30 && h > 30) g += '<path transform="translate(' + (x + w - 15) + ' ' + (y + h - 16) + ')" d="M3 7V5a3 3 0 016 0v2h1v6H2V7zM4.5 7h3V5a1.5 1.5 0 00-3 0z" fill="var(--fg)" opacity=".75"/>';
          g += '</g>';
        });
        g += '<rect x="' + ml + '" y="' + mt + '" width="' + W + '" height="' + H + '" fill="none" stroke="var(--sheet-line)" stroke-width="2" pointer-events="none"/>';
        if (view.dims) {
          var rx = ml + W + 14, by = mt + H + 14;
          g += '<g stroke="var(--dimline)" fill="var(--dimline)" font-size="' + (fs + 1) + '">' +
            '<path d="M' + rx + ' ' + mt + 'V' + (mt + H) + 'M' + (rx - 4) + ' ' + mt + 'h8M' + (rx - 4) + ' ' + (mt + H) + 'h8" fill="none"/>' +
            '<text stroke="none" transform="translate(' + (rx + 15) + ' ' + (mt + H / 2) + ') rotate(-90)" text-anchor="middle">' + fmt(sh.H) + '</text>' +
            '<path d="M' + ml + ' ' + by + 'H' + (ml + W) + 'M' + ml + ' ' + (by - 4) + 'v8M' + (ml + W) + ' ' + (by - 4) + 'v8" fill="none"/>' +
            '<text stroke="none" x="' + (ml + W / 2) + '" y="' + (by + 18) + '" text-anchor="middle">' + fmt(sh.W) + '</text></g>';
        }
        html += '<div class="sheetbox">' +
          (R.sheets.length > 1 ? '<h4 style="direction:' + (lang === 'ar' ? 'rtl' : 'ltr') + '">' + L.sheetOf(si + 1, R.sheets.length) + ' · ' + pair(sh.W, sh.H) + '</h4>' : '') +
          '<svg class="cv" width="' + tw + '" height="' + th + '" viewBox="0 0 ' + tw + ' ' + th + '" role="img" aria-label="' + L.sheetTab(si + 1) + '"><defs>' + Object.keys(usedHues).map(function (h) {
            return '<linearGradient id="clg' + gid + '-' + h + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:hsl(' + h + ' 22% var(--g1))"/><stop offset="1" style="stop-color:hsl(' + h + ' 30% var(--g2))"/></linearGradient>';
          }).join('') + '</defs>' + g + '</svg></div>';
      });
      cv.innerHTML = html;
      renderSel();
    }
    function renderSel() {
      var bar = rr('selbar'), p = selPanel();
      if (!p) { view.sel = null; bar.hidden = true; bar.innerHTML = ''; return; }
      bar.hidden = false;
      bar.innerHTML = '<b>' + L.panel + ' ' + pair(p.w, p.h) + (p.free ? ' · ' + L.gapN : '') + '</b><button data-a="rot">' + L.rot90 + '</button>' + (p.free ? '' : '<button data-a="pin">' + (p.locked ? L.unpin : L.pin) + '</button>');
    }
    function selPanel() {
      if (!R || !view.sel) return null;
      var sh = R.sheets[view.sel.si]; return sh ? sh.placed[view.sel.pi] || null : null;
    }
    function cutText(c) {
      var lab = function (l) { return l.t === 'p' ? pair(l.w, l.h) : l.t === 's' ? L.surplus + ' ' + pair(l.w, l.h) : '-'; };
      return { a: lab(c.la), b: lab(c.lb) };
    }
    function stats() {
      var g = rr('g'), s = rr('s'), c = rr('c'), c1 = rr('chips1'), c2 = rr('chips2');
      if (!R || !R.sheets.length) { g.innerHTML = s.innerHTML = c.innerHTML = '<div class="empty" style="padding:18px 0">' + L.none + '</div>'; c1.innerHTML = c2.innerHTML = ''; return; }
      var tot = R.sheets.reduce(function (a, x) { return a + x.W * x.H; }, 0), used = R.sheets.reduce(function (a, x) { return a + x.used; }, 0);
      var cuts = R.sheets.reduce(function (a, x) { return a + x.cuts.length; }, 0), len = R.sheets.reduce(function (a, x) { return a + x.cutLen; }, 0);
      var grp = {}; R.sheets.forEach(function (x) { var k = pair(x.W, x.H); grp[k] = (grp[k] || 0) + 1; });
      var row = function (a, b, sm, cls) { return '<tr><th' + (cls ? ' class="' + cls + '"' : '') + '>' + a + '</th><td' + (cls ? ' class="' + cls + '"' : '') + '>' + (sm ? '<span class="n">' + b + '</span><small class="n">' + sm + '</small>' : b) + '</td></tr>'; };
      g.innerHTML = '<table class="kv">' +
        row(L.usedSheets, Object.keys(grp).map(function (k) { return '<span class="n">' + k + '</span> <small>×' + grp[k] + '</small>'; }).join('، ')) +
        row(L.usedArea, fmt(Math.round(used)), pct(used, tot) + '%') + row(L.wastedArea, fmt(Math.round(tot - used)), pct(tot - used, tot) + '%') +
        row(L.totalCuts, cuts) + row(L.totalLen, fmt(len)) + row(L.kerfRow, fmt(R.k)) + row(L.prio, L.prioV) +
        (R.unplaced.length ? row(L.unplaced, R.unplaced.length, '', 'bad') : '') + '</table>';
      if (view.sheet >= R.sheets.length) view.sheet = 0;
      var sh = R.sheets[view.sheet];
      var chips = R.sheets.length > 1 ? '<div class="chips">' + R.sheets.map(function (_, i) { return '<button data-s="' + i + '" aria-pressed="' + (i === view.sheet) + '">' + L.sheetTab(i + 1) + '</button>'; }).join('') + '</div>' : '';
      c1.innerHTML = chips; c2.innerHTML = chips;
      s.innerHTML = '<table class="kv">' + row(L.sheet, dim(sh.W, sh.H)) +
        row(L.sUsed, fmt(Math.round(sh.used)), pct(sh.used, sh.W * sh.H) + '%') + row(L.sWaste, fmt(Math.round(sh.waste)), pct(sh.waste, sh.W * sh.H) + '%') +
        row(L.cuts, sh.cuts.length) + row(L.cutLen, fmt(sh.cutLen)) + row(L.panelsN, sh.placed.length) + row(L.wastedN, sh.free.length) + (gapCount(sh) ? row(L.gapN, gapCount(sh)) : '') + '</table>';
      c.innerHTML = '<table class="cuts"><thead><tr><th>' + L.cNo + '</th><th>' + L.cPanel + '</th><th>' + L.cCut + '</th><th>' + L.cRes + '</th></tr></thead><tbody>' +
        sh.cuts.map(function (x, i) {
          var piece = function (l) { return l.t === 'p' ? dim(l.w, l.h) : l.t === 's' ? '<span class="sur">' + L.surplus + ' ' + dim(l.w, l.h) + '</span>' : '-'; };
          return '<tr><td>' + (i + 1) + '</td><td>' + dim(x.rw, x.rh) + '</td><td>' + (lang === 'en' ? x.axis + '=' : (x.axis === 'x' ? L.vert : L.horiz) + ' ') + '<span class="n">' + fmt(x.pos) + '</span></td>' +
            '<td class="res">' + piece(x.la) + (lang === 'en' ? ' \\ ' : '<br>') + piece(x.lb) + '</td></tr>';
        }).join('') + '</tbody></table>' + (gapCount(sh) ? '<p style="margin:8px 0 0;font-size:12px;color:var(--muted)">' + L.gapNote + '<br>' + sh.placed.filter(function (p) { return p.free; }).map(function (p) { return '<span class="n">' + pair(p.w, p.h) + '</span> (' + fmt(p.x) + ', ' + fmt(p.y) + ')'; }).join(' · ') + '</p>' : '');
    }
    function gapCount(sh) { return sh.placed.filter(function (p) { return p.free; }).length; }
    function summaryText() {
      if (!R || !R.sheets.length) return '';
      var out = [];
      R.sheets.forEach(function (sh, si) {
        out.push(L.sheetOf(si + 1, R.sheets.length) + ' ' + pair(sh.W, sh.H));
        sh.cuts.forEach(function (c, i) {
          var t = cutText(c);
          out.push((i + 1) + ') ' + pair(c.rw, c.rh) + ' — ' + (c.axis === 'x' ? L.vert : L.horiz) + ' ' + fmt(c.pos) + ' → ' + t.a + ' | ' + t.b);
        });
        var gp = sh.placed.filter(function (p) { return p.free; });
        if (gp.length) out.push(L.gapN + ': ' + gp.map(function (p) { return pair(p.w, p.h) + ' (' + fmt(p.x) + ', ' + fmt(p.y) + ')'; }).join(' · '));
        out.push('');
      });
      if (R.unplaced.length) out.push(L.unplaced + ': ' + R.unplaced.map(function (u) { return pair(u.w, u.h); }).join(', '));
      return out.join('\n');
    }
    function toast(t) {
      var e = $('.toast'); e.textContent = t; e.classList.add('show');
      clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('show'); }, 1800);
    }
    function calculate() {
      syncOpts();
      var filled = false;
      ['panels', 'stock'].forEach(function (kind) {
        S[kind].forEach(function (r) { if (!String(r.q).trim() && num(r.l) && num(r.w)) { r.q = '1'; filled = true; } });
      });
      if (filled) { renderTable('panels'); renderTable('stock'); persist(); }
      R = solve(S); if (S.opts.gaps && S.opts.shapes) gapFill(S, R); view.sheet = 0; view.sel = null; draw(); stats();
      if (options.onResult) { try { options.onResult(getResult()); } catch (e) {} }
      return R;
    }
    function getResult() {
      if (!R) return null;
      var tot = R.sheets.reduce(function (a, x) { return a + x.W * x.H; }, 0), used = R.sheets.reduce(function (a, x) { return a + x.used; }, 0);
      return {
        sheetsUsed: R.sheets.length, totalArea: tot, usedArea: used, wastedArea: tot - used, wastePercent: pct(tot - used, tot),
        unplaced: R.unplaced.map(function (u) { return { length: u.w, width: u.h }; }),
        sheets: R.sheets.map(function (sh) {
          return {
            length: sh.W, width: sh.H,
            panels: sh.placed.map(function (p) { return { x: p.x, y: p.y, w: p.w, h: p.h, rotated: p.rot, inGap: !!p.free, shape: p.it && p.it.s === 'c' ? 'circle' : p.it && p.it.s === 'o' ? 'oval' : 'rect' }; }),
            cuts: sh.cuts.map(function (c) { return { axis: c.axis, position: c.pos, length: c.len, piece: { w: c.rw, h: c.rh }, a: c.la && c.la.t === 'p' ? { w: c.la.w, h: c.la.h } : null, b: c.lb && c.lb.t === 'p' ? { w: c.lb.w, h: c.lb.h } : null }; }),
            leftovers: sh.free.map(function (f) { return { x: f.x, y: f.y, w: f.w, h: f.h }; })
          };
        }),
        summary: summaryText()
      };
    }

    /* ---- مشروع: حفظ / تحميل / تصدير ---- */
    function closeMenus() { var m = rr('menu'), t = rr('tmenu'); if (m) m.hidden = true; if (t) t.hidden = true; }
    function dlBlob(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000); }
    function dayStamp() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
    function saveProject() {
      var data = { app: 'cutlist', v: 1, at: Date.now(), state: JSON.parse(JSON.stringify(S)) };
      dlBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), 'cutlist-' + dayStamp() + '.json'); toast(L.exported);
    }
    rr('file').addEventListener('change', function (e) {
      var f = e.target.files[0]; e.target.value = ''; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var o = JSON.parse(rd.result), st = o && o.state ? o.state : o;
          if (!st || !Array.isArray(st.panels) || !Array.isArray(st.stock)) throw new Error('bad');
          S = { panels: st.panels.map(strRow), stock: st.stock.map(strRow), opts: Object.assign(EXAMPLE().opts, st.opts || {}), src: st.src || null };
          S.opts.kerf = String(S.opts.kerf == null ? '0' : S.opts.kerf);
          renderAllInputs(); persist(); calculate(); toast(L.loaded);
        } catch (x) { toast(L.badFile); }
      };
      rd.readAsText(f);
    });
    /* يرسم الشيتات + قايمة القص على كانفاس واحد (للصورة والـ PDF) */
    function exportCanvas(cb) {
      var svgs = $$('svg.cv'); if (!R || !svgs.length) { toast(L.none); return; }
      var cs = getComputedStyle(root), cv0 = function (n) { return cs.getPropertyValue(n).trim(); }, imgs = [], left = svgs.length;
      var fin = function () {
        var sc = 2, pad = 16, th = 26, lh = 20, lines = summaryText().split('\n');
        var wd = function (sv) { return +sv.getAttribute('width'); }, ht = function (sv) { return +sv.getAttribute('height'); };
        var w = Math.max.apply(null, svgs.map(wd)) + pad * 2, h = pad;
        svgs.forEach(function (sv) { h += th + ht(sv) + 8; }); h += 8 + lines.length * lh + pad;
        var cv = document.createElement('canvas'); cv.width = Math.ceil(w * sc); cv.height = Math.ceil(h * sc);
        var x = cv.getContext('2d'), fg = cv0('--fg') || '#000', F = 'Tahoma, Arial, sans-serif';
        x.scale(sc, sc); x.fillStyle = cv0('--surface') || '#fff'; x.fillRect(0, 0, w, h);
        x.textBaseline = 'middle'; x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = fg;
        var y = pad;
        svgs.forEach(function (sv, i) {
          x.font = 'bold 15px ' + F; x.fillText(L.sheetOf(i + 1, R.sheets.length) + ' · ' + pair(R.sheets[i].W, R.sheets[i].H), w - pad, y + th / 2); y += th;
          if (imgs[i] && imgs[i].width) x.drawImage(imgs[i], pad, y, wd(sv), ht(sv)); y += ht(sv) + 8;
        });
        y += 8; x.font = '13px ' + F;
        lines.forEach(function (ln) { x.fillText(ln, w - pad, y + lh / 2); y += lh; });
        cb(cv);
      };
      svgs.forEach(function (sv, i) {
        var str = new XMLSerializer().serializeToString(sv).replace(/var\((--[\w-]+)\)/g, function (m, n) { return cv0(n) || '#000'; }).replace('<svg ', '<svg font-family="Tahoma, Arial, sans-serif" ');
        var im = new Image(); im.onload = im.onerror = function () { imgs[i] = im; if (--left === 0) fin(); };
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str);
      });
    }
    function exportView(pdf) {
      exportCanvas(function (cv) {
        var name = 'cutlist-' + dayStamp();
        if (pdf && options.exportPdf) { try { options.exportPdf(cv, name); toast(L.exported); } catch (x) { toast(L.badFile); } return; }
        cv.toBlob(function (b) { if (b) { dlBlob(b, name + '.png'); toast(L.exported); } }, 'image/png');
      });
    }

    /* ---- events ---- */
    root.addEventListener('input', function (e) {
      var inp = e.target.closest('input'); if (!inp) return;
      if (inp.dataset.o && inp.type !== 'checkbox') { S.opts[inp.dataset.o] = inp.value; syncOpts(); persist(); if (inp.dataset.o === 'dec' && R) { draw(); stats(); } return; }
      if (!inp.dataset.k) return;
      var tbl = inp.closest('table'), kind = tbl.dataset.t, tr = inp.closest('tr'), i = +tr.dataset.i, r = S[kind][i];
      r[inp.dataset.k] = inp.value;
      if (S.opts.shapes && r.s === 'c' && inp.dataset.k === 'l') { r.w = r.l; tr.querySelector('input[data-k="w"]').value = r.l; }
      if ((inp.dataset.k === 'l' || inp.dataset.k === 'w') && !String(r.q).trim() && num(r.l) && num(r.w)) {
        r.q = '1'; tr.querySelector('input[data-k="q"]').value = '1';
      }
      tr.querySelector('.act').innerHTML = actHtml(r);
      var a = S[kind], trail = 0;
      for (var j = a.length - 1; j >= 0 && isBlank(a[j]); j--) trail++;
      var body = tbl.querySelector('tbody');
      while (trail < 1) { a.push(blank()); body.insertAdjacentHTML('beforeend', rowHtml(a[a.length - 1], a.length - 1, kind)); trail++; }
      persist();
    });
    root.addEventListener('focusin', function (e) {
      var inp = e.target; if (inp && inp.matches && inp.matches('.t input[data-k="q"]')) { try { inp.select(); } catch (x) {} }
    });
    root.addEventListener('change', function (e) {
      var sel = e.target.closest('select[data-o]');
      if (sel) {
        S.opts[sel.dataset.o] = sel.value; syncOpts(); persist();
        if (sel.dataset.o !== 'orient') { renderTable('panels'); renderTable('stock'); if (R) { draw(); stats(); } }
        return;
      }
      var inp = e.target.closest('input[type="checkbox"][data-o]'); if (!inp) return;
      S.opts[inp.dataset.o] = inp.checked;
      if (inp.dataset.o === 'material') { renderTable('panels'); renderTable('stock'); }
      if (inp.dataset.o === 'shapes') { renderTable('panels'); $('[data-row="gaps"]').hidden = !S.opts.shapes; persist(); calculate(); return; }
      if (inp.dataset.o === 'labels' && R) draw();
      persist();
    });
    root.addEventListener('click', function (e) {
      if (!e.target.closest('.menu, [data-a="menu"], [data-a="tmenu"]')) closeMenus();
      var hd = e.target.closest('.hd2, .card>.hd');
      if (hd) { hd.parentElement.classList.toggle('closed'); return; }
      var ch = e.target.closest('.chips button');
      if (ch) { view.sheet = +ch.dataset.s; stats(); return; }
      var b = e.target.closest('button[data-a]'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'menu') { var mm = rr('menu'); mm.hidden = !mm.hidden; rr('tmenu').hidden = true; return; }
      if (a === 'tmenu') {
        var tm = rr('tmenu'), kd0 = b.closest('table').dataset.t, was = !tm.hidden && tm.dataset.k === kd0;
        closeMenus(); if (was) return;
        tm.dataset.k = kd0; tm.hidden = false;
        var rc = b.getBoundingClientRect(); tm.style.top = (rc.bottom + 2) + 'px';
        tm.style.left = Math.max(8, Math.min(rc.left, innerWidth - tm.offsetWidth - 8)) + 'px';
        return;
      }
      if (a === 'tact') {
        var tk = rr('tmenu').dataset.k, ta = b.dataset.t, rows = S[tk];
        if (ta === 'clear') {
          if (b.getAttribute('data-armed') !== '1') { b.setAttribute('data-armed', '1'); b.textContent = L.sure; clearTimeout(b._t); b._t = setTimeout(function () { b.removeAttribute('data-armed'); b.textContent = L.tClear; }, 3000); return; }
          S[tk] = [];
        } else if (ta === 'sort') {
          var fl = rows.filter(function (r) { return !isBlank(r); }).sort(function (x, y) { return num(y.l) * num(y.w) - num(x.l) * num(x.w); }); S[tk] = fl;
        } else rows.forEach(function (r) { if (!isBlank(r)) r.on = ta === 'on'; });
        closeMenus(); b.removeAttribute('data-armed'); normalize(tk); renderTable(tk); persist(); return;
      }
      if (a === 'settings') { closeMenus(); rr('sov').hidden = false; return; }
      if (a === 'setx') { rr('sov').hidden = true; return; }
      if (a === 'msave') { closeMenus(); saveProject(); return; }
      if (a === 'mload') { closeMenus(); rr('file').click(); return; }
      if (a === 'mpdf' || a === 'mimg') { closeMenus(); exportView(a === 'mpdf'); return; }
      if (a === 'shape') {
        var kd = b.closest('table').dataset.t, ix = +b.closest('tr').dataset.i, rw = S[kd][ix];
        rw.s = rw.s === 'c' ? 'o' : rw.s === 'o' ? 'r' : 'c';
        if (rw.s === 'c') rw.w = rw.l;
        renderTable(kd); persist(); return;
      }
      if (a === 'tog' || a === 'del') {
        var kind = b.closest('table').dataset.t, i = +b.closest('tr').dataset.i;
        if (a === 'tog') S[kind][i].on = !S[kind][i].on; else S[kind].splice(i, 1);
        normalize(kind); renderTable(kind); persist(); return;
      }
      if (a === 'calc') { calculate(); if (root.offsetWidth < 720) { try { root.querySelector('.center').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) {} } return; }
      if (a === 'save') { persist(); toast(L.saved); return; }
      if (a === 'example' || a === 'clear') {
        // ضغطة أولى = تأكيد، التانية خلال 3 ثواني = تنفيذ (عشان ما تتمسحش البيانات بالغلط)
        if (b.getAttribute('data-armed') !== '1') {
          b.setAttribute('data-armed', '1'); b.textContent = L.sure;
          clearTimeout(b._t); b._t = setTimeout(function () { b.removeAttribute('data-armed'); b.textContent = a === 'clear' ? L.clear : L.example; }, 3000);
          return;
        }
        clearTimeout(b._t); b.removeAttribute('data-armed'); b.textContent = a === 'clear' ? L.clear : L.example;
        closeMenus();
        if (a === 'example') { var o0 = S.opts; S = EXAMPLE(); ['dimOrder', 'dec', 'unit', 'orient'].forEach(function (k) { S.opts[k] = o0[k]; }); renderAllInputs(); persist(); calculate(); }
        else { S.panels = []; S.stock = []; S.src = null; renderAllInputs(); R = null; draw(); stats(); persist(); }
        return;
      }
      if (a === 'rot') { rotateSel(); return; }
      if (a === 'pin') { pinSel(); return; }
      if (a === 'rearr') { rearrange(); return; }
      if (a === 'chg') { changeLayout(); return; }
      if (a === 'more') { searchMore(b); return; }
      if (a === 'compact') { compactAll(); return; }
      if (a === 'zin') { view.zoom = Math.min(4, view.zoom * 1.25); draw(); return; }
      if (a === 'zout') { view.zoom = Math.max(.4, view.zoom / 1.25); draw(); return; }
      if (a === 'zfit') { view.zoom = 1; draw(); return; }
      if (a === 'fup') { view.font = Math.min(24, view.font + 1); draw(); return; }
      if (a === 'fdn') { view.font = Math.max(7, view.font - 1); draw(); return; }
      if (a === 'tcol') { view.color = !view.color; b.classList.toggle('on', view.color); draw(); return; }
      if (a === 'tdim') { view.dims = !view.dims; b.classList.toggle('on', view.dims); draw(); return; }
      if (a === 'copy') {
        var txt = summaryText(); if (!txt) return;
        var ok = function () { toast(L.copied); };
        var fallback = function () {
          try {
            var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', '');
            ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            var done = document.execCommand && document.execCommand('copy');
            document.body.removeChild(ta); toast(done ? L.copied : L.copyFail);
          } catch (x) { toast(L.copyFail); }
        };
        try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback(); } catch (x) { fallback(); }
      }
    });
    /* ---- ربط الفاتورة ---- */
    var dlg = null;
    function renderSrc() {
      var box = rr('src'); if (!box) return;
      box.innerHTML = S.src && S.src.code ? '<div class="src"><span>' + esc(L.invFrom(S.src.code, S.src.name || '')) + '</span><button class="ic del" data-a="srcx" title="' + L.invClose + '" aria-label="' + L.invClose + '">' + ICON_DEL + '</button></div>' : '';
    }
    function groupInvoice(inv) {
      var map = {}, order = [], ready = [];
      (inv && inv.items || []).forEach(function (it) {
        if (!it) return;
        var name = String(it.group || it.name || it.type || '—');
        var sh = it.s || it.shape; sh = (sh === 'c' || sh === 'circle') ? 'c' : (sh === 'o' || sh === 'oval') ? 'o' : 'r';
        var l = num(it.l != null ? it.l : it.length), w = num(it.w != null ? it.w : it.width);
        if (sh === 'c' && l && !w) w = l;
        var q = qtyOf(it.q != null ? it.q : it.qty);
        if (!l || !w) { ready.push({ name: String(it.name || name), q: q || 1 }); return; }
        if (!q) return;
        if (!map[name]) { map[name] = { name: name, items: [], idx: {} }; order.push(map[name]); }
        var key = l + 'x' + w + sh, g = map[name];
        if (g.idx[key] != null) g.items[g.idx[key]].q += q;
        else { g.idx[key] = g.items.length; g.items.push({ l: l, w: w, q: q, s: sh, sel: true }); }
      });
      order.forEach(function (g) { g.pcs = g.items.reduce(function (a, it) { return a + it.q; }, 0); });
      order.sort(function (a, b) { return b.pcs - a.pcs; });
      return { groups: order, ready: ready };
    }
    function stockForGroup(g) {
      if (!g || !options.stockFor) return null;
      try { var st = options.stockFor(g.name); return Array.isArray(st) && st.length ? st : null; } catch (e) { return null; }
    }
    function openInvoice(inv) {
      var gr = groupInvoice(inv);
      dlg = { inv: inv || {}, groups: gr.groups, ready: gr.ready, gi: 0, mode: 'replace', useStock: true };
      dlg.stock = stockForGroup(dlg.groups[0]);
      renderDlg();
      var f = root.querySelector('.ov .gh, .ov .btn'); if (f) { try { f.focus(); } catch (x) {} }
    }
    function closeDlg() { dlg = null; renderDlg(); var q = rr('invq'); if (q) { try { q.focus(); } catch (x) {} } }
    function dlgCount() {
      var g = dlg && dlg.groups[dlg.gi]; if (!g) return 0;
      return g.items.reduce(function (a, it) { return a + (it.sel ? it.q : 0); }, 0);
    }
    function renderDlg() {
      var ov = root.querySelector('.ov');
      if (!dlg) { if (ov) ov.parentNode.removeChild(ov); return; }
      if (!ov) { ov = document.createElement('div'); ov.className = 'ov'; root.appendChild(ov); }
      var inv = dlg.inv, g = dlg.groups[dlg.gi], code = inv.code == null ? '' : String(inv.code);
      var sub = [inv.customer, inv.date].filter(function (x) { return x; }).map(esc).join(' · ');
      var h = '<div class="dlg" role="dialog" aria-modal="true" aria-label="' + esc(L.invTitle(code)) + '">' +
        '<div class="dh"><div><b>' + esc(L.invTitle(code)) + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>' +
        '<button class="ic x" data-a="dlgx" title="' + L.invClose + '" aria-label="' + L.invClose + '">' + ICON_DEL + '</button></div><div class="db">';
      if (!dlg.groups.length) h += '<p class="dq">' + L.invNoCut + '</p>';
      else {
        h += '<p class="dq">' + L.invPick + '</p><div class="grps">';
        dlg.groups.forEach(function (gr, i) {
          var on = i === dlg.gi;
          h += '<div class="grp' + (on ? ' on' : '') + '"><button class="gh" data-a="dlgg" data-g="' + i + '" aria-pressed="' + on + '"><i class="rd"></i><span class="gn">' + esc(gr.name) + '</span><span class="gm">' + L.invPieces(gr.pcs, gr.items.length) + '</span></button>';
          if (on) {
            var allSel = gr.items.every(function (it) { return it.sel; });
            h += '<div class="its">' + (gr.items.length > 1 ? '<label class="it all"><input type="checkbox" data-dlg="all"' + (allSel ? ' checked' : '') + '>' + L.all + '</label>' : '');
            gr.items.forEach(function (it, j) {
              h += '<label class="it"><input type="checkbox" data-dlg="it" data-j="' + j + '"' + (it.sel ? ' checked' : '') + '><span class="n">' + fmt(it.l) + ' × ' + fmt(it.w) + '</span><span class="iq">×' + it.q + '</span>' + (it.s !== 'r' ? '<span class="shp">' + shapeName(it.s) + '</span>' : '') + '</label>';
            });
            h += '</div>';
          }
          h += '</div>';
        });
        h += '</div>';
      }
      if (dlg.ready.length) h += '<p class="rdy">' + L.invReady + ' ' + dlg.ready.map(function (r) { return esc(r.name) + ' ×' + r.q; }).join(lang === 'ar' ? '، ' : ', ') + '</p>';
      if (g) {
        var hasRows = S.panels.some(function (r) { return !isBlank(r); }), nm = 'clmode' + gid;
        h += '<div class="dopts">';
        if (hasRows) h += '<label><input type="radio" name="' + nm + '" data-dlg="mode" value="replace"' + (dlg.mode === 'replace' ? ' checked' : '') + '>' + L.invReplace + '</label>' +
          '<label><input type="radio" name="' + nm + '" data-dlg="mode" value="append"' + (dlg.mode === 'append' ? ' checked' : '') + '>' + L.invAppend + '</label>';
        if (dlg.stock) h += '<label><input type="checkbox" data-dlg="stock"' + (dlg.useStock ? ' checked' : '') + '>' + esc(L.invStock(dlg.stock.map(function (x) { return fmt(num(x.l)) + '×' + fmt(num(x.w)) + (x.q ? ' ×' + x.q : ''); }).join(lang === 'ar' ? '، ' : ', '))) + '</label>';
        h += '</div>';
      }
      var n = dlgCount();
      h += '</div><div class="df">' + (g ? '<button class="btn go" data-a="dlgok"' + (n ? '' : ' disabled') + '>' + L.invDo(n) + '</button>' : '') +
        '<button class="btn" data-a="dlgx">' + (g ? L.invCancel : L.invClose) + '</button></div></div>';
      ov.innerHTML = h;
    }
    function importDlg() {
      var g = dlg && dlg.groups[dlg.gi]; if (!g) return;
      var items = g.items.filter(function (it) { return it.sel; }); if (!items.length) return;
      var rows = items.map(function (it) { return { l: String(it.l), w: String(it.w), q: String(it.q), on: true, m: g.name, s: it.s }; });
      if (items.some(function (it) { return it.s !== 'r'; })) S.opts.shapes = true;
      var keep = dlg.mode === 'append' ? S.panels.filter(function (r) { return !isBlank(r); }) : [];
      S.panels = keep.concat(rows);
      if (dlg.useStock && dlg.stock) S.stock = dlg.stock.map(function (x) { return strRow({ l: x.l, w: x.w, q: x.q == null ? '' : x.q }); });
      S.src = { code: String(dlg.inv.code == null ? '' : dlg.inv.code), name: g.name };
      var n = dlgCount();
      dlg = null; renderDlg(); renderAllInputs(); persist(); calculate(); toast(L.invDone(n));
      if (root.offsetWidth < 720) { try { root.querySelector('.center').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) {} }
    }
    function doSearch() {
      var inp = rr('invq'), msg = rr('invmsg'); if (!inp || !options.findInvoice) return;
      var code = normNum(inp.value); if (!code) { inp.focus(); return; }
      msg.textContent = L.invBusy; msg.className = 'invmsg';
      var done = function (inv) {
        if (!inv) { msg.textContent = L.invNone; msg.className = 'invmsg bad'; return; }
        msg.textContent = ''; if (inv.code == null) inv.code = code; openInvoice(inv);
      };
      var fail = function () { msg.textContent = L.invErr; msg.className = 'invmsg bad'; };
      try { var r = options.findInvoice(code); if (r && typeof r.then === 'function') r.then(done, fail); else done(r); } catch (e) { fail(); }
    }
    root.addEventListener('submit', function (e) { if (e.target.matches && e.target.matches('[data-r="invf"]')) { e.preventDefault(); doSearch(); } });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Esc') { if (!rr('sov').hidden) { e.preventDefault(); rr('sov').hidden = true; return; } if (dlg) { e.preventDefault(); closeDlg(); } } });
    root.addEventListener('click', function (e) { if (e.target === rr('sov')) rr('sov').hidden = true; });
    root.addEventListener('change', function (e) {
      var t = e.target; if (!dlg || !t.dataset || !t.dataset.dlg) return;
      var g = dlg.groups[dlg.gi];
      if (t.dataset.dlg === 'it') g.items[+t.dataset.j].sel = t.checked;
      else if (t.dataset.dlg === 'all') g.items.forEach(function (it) { it.sel = t.checked; });
      else if (t.dataset.dlg === 'mode') dlg.mode = t.value;
      else if (t.dataset.dlg === 'stock') dlg.useStock = t.checked;
      renderDlg();
      var sel = '.ov [data-dlg="' + t.dataset.dlg + '"]' + (t.dataset.j != null ? '[data-j="' + t.dataset.j + '"]' : '') + (t.type === 'radio' ? '[value="' + t.value + '"]' : '');
      var again = root.querySelector(sel); if (again) { try { again.focus(); } catch (x) {} }
    });
    root.addEventListener('click', function (e) {
      if (dlg && e.target.classList && e.target.classList.contains('ov')) { closeDlg(); return; }
      var b = e.target.closest && e.target.closest('button[data-a]'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'dlgx') closeDlg();
      else if (a === 'dlgok') importDlg();
      else if (a === 'dlgg') { dlg.gi = +b.dataset.g; dlg.stock = stockForGroup(dlg.groups[dlg.gi]); renderDlg(); var f = root.querySelector('.ov .grp.on .gh'); if (f) { try { f.focus(); } catch (x) {} } }
      else if (a === 'srcx') { S.src = null; renderSrc(); persist(); }
    });
    function notify() { if (options.onResult) { try { options.onResult(getResult()); } catch (e) {} } }
    function fits(sh, others, x, y, w, h) {
      var k = R.k;
      if (w > sh.W + EPS || h > sh.H + EPS || x < -EPS || y < -EPS || x + w > sh.W + EPS || y + h > sh.H + EPS) return false;
      for (var i = 0; i < others.length; i++) {
        var q = others[i];
        if (x < q.x + q.w + k - EPS && q.x < x + w + k - EPS && y < q.y + q.h + k - EPS && q.y < y + h + k - EPS) return false;
      }
      return derive({ W: sh.W, H: sh.H, placed: others.filter(function (q) { return !q.free; }).concat([{ x: x, y: y, w: w, h: h }]) }, k);
    }
    function snap(sh, others, x, y, w, h) {
      var th = 10 / geo.s, k = R.k, cx = [0, sh.W - w], cy = [0, sh.H - h];
      others.forEach(function (q) {
        cx.push(q.x + q.w + k, q.x - w - k, q.x, q.x + q.w - w);
        cy.push(q.y + q.h + k, q.y - h - k, q.y, q.y + q.h - h);
      });
      var bx = x, by = y, dx = th, dy = th;
      var gx = false, gy = false;
      cx.forEach(function (c) { var d = Math.abs(c - x); if (d < dx) { dx = d; bx = c; gx = true; } });
      cy.forEach(function (c) { var d = Math.abs(c - y); if (d < dy) { dy = d; by = c; gy = true; } });
      var qq = quantum(sh.W, sh.H);
      if (!gx) bx = roundQ(x, qq); if (!gy) by = roundQ(y, qq);
      return { x: Math.max(0, Math.min(sh.W - w, bx)), y: Math.max(0, Math.min(sh.H - h, by)) };
    }
    function clearGhost() {
      $$('svg.cv rect.ghost').forEach(function (r) { r.parentNode.removeChild(r); });
    }
    root.addEventListener('pointerdown', function (e) {
      var g = e.target.closest && e.target.closest('g.pn');
      if (!g || !R || (e.button && e.button > 0)) return;
      var si = +g.dataset.si, pi = +g.dataset.pi, p = R.sheets[si].placed[pi];
      var rect = g.ownerSVGElement.getBoundingClientRect();
      drag = { si: si, pi: pi, p: p, g: g, sx: e.clientX, sy: e.clientY, moved: false, ti: -1, x: 0, y: 0, ok: false,
        offX: (e.clientX - rect.left - geo.ml) / geo.s - p.x, offY: (e.clientY - rect.top - geo.mt) / geo.s - p.y };
      try { g.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault();
    });
    // على الموبايل: اللمسة اللي بتبدأ على قطعة ما تعملش scroll للصفحة، عشان السحب يشتغل
    // (اللمسة على أي مكان تاني بتعمل scroll عادي)
    var onTouch = function (e) { if (drag || (e.target.closest && e.target.closest('g.pn'))) e.preventDefault(); };
    root.addEventListener('touchstart', onTouch, { passive: false });
    root.addEventListener('touchmove', onTouch, { passive: false });
    var onMove = function (e) {
      if (!drag) return;
      if (!drag.moved && Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 5) return;
      drag.moved = true; drag.g.setAttribute('opacity', '.35');
      var svgs = $$('svg.cv'), ti = -1, rect = null;
      svgs.forEach(function (sv, i) {
        var r = sv.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { ti = i; rect = r; }
      });
      clearGhost(); drag.ti = ti; drag.ok = false;
      if (ti < 0) return;
      var sh = R.sheets[ti], p = drag.p, w = p.w, h = p.h;
      var others = sh.placed.filter(function (q) { return q !== p; });
      var x = (e.clientX - rect.left - geo.ml) / geo.s - drag.offX, y = (e.clientY - rect.top - geo.mt) / geo.s - drag.offY;
      x = Math.max(0, Math.min(sh.W - w, x)); y = Math.max(0, Math.min(sh.H - h, y));
      var sp = snap(sh, others, x, y, w, h); drag.x = sp.x; drag.y = sp.y;
      var matBad = S.opts.material && sh.m && p.it && p.it.m && sh.m !== p.it.m;
      drag.gap = false;
      drag.ok = !matBad && fits(sh, others, sp.x, sp.y, w, h);
      if (!drag.ok && !matBad && !isRoundIt(p.it)) {
        // مكان مش بقص مستقيم: ينفع لو في فراغ حول دائرة/بيضاوي
        var qg = quantum(sh.W, sh.H, 1), gxp = Math.max(0, Math.min(sh.W - w, roundQ(x, qg))), gyp = Math.max(0, Math.min(sh.H - h, roundQ(y, qg)));
        if (gapSpotOk(sh, others, gxp, gyp, w, h, R.k)) { drag.ok = true; drag.gap = true; drag.x = gxp; drag.y = gyp; sp = { x: gxp, y: gyp }; }
      }
      var gh = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      gh.setAttribute('class', 'ghost'); gh.setAttribute('pointer-events', 'none');
      gh.setAttribute('x', geo.ml + sp.x * geo.s); gh.setAttribute('y', geo.mt + sp.y * geo.s);
      gh.setAttribute('width', w * geo.s); gh.setAttribute('height', h * geo.s);
      gh.setAttribute('fill', drag.ok ? 'var(--ok)' : 'var(--bad)'); gh.setAttribute('fill-opacity', '.25');
      gh.setAttribute('stroke', drag.ok ? 'var(--ok)' : 'var(--bad)'); gh.setAttribute('stroke-width', '2'); gh.setAttribute('stroke-dasharray', '5 3');
      svgs[ti].appendChild(gh);
      svgs.forEach(function (sv) { sv.classList.add('dragging'); });
    };
    function endDrag(e, cancel) {
      if (!drag) return;
      var d = drag; drag = null; clearGhost();
      if (!d.moved) {
        if (cancel) return;
        view.sel = (view.sel && view.sel.si === d.si && view.sel.pi === d.pi) ? null : { si: d.si, pi: d.pi };
        draw(); return;
      }
      if (!cancel && d.ok && d.ti >= 0) {
        var from = R.sheets[d.si], to = R.sheets[d.ti], p = d.p;
        from.placed.splice(from.placed.indexOf(p), 1);
        p.x = d.x; p.y = d.y; p.free = !!d.gap; p.locked = !d.gap; to.placed.push(p);
        [from, to].forEach(function (sh) { derive(sh, R.k); finalize({ sheets: [sh] }); });
        R.sheets = R.sheets.filter(function (sh) { return sh.placed.length; });
        var ni = R.sheets.indexOf(to);
        view.sel = { si: ni, pi: R.sheets[ni].placed.indexOf(p) };
        draw(); stats(); persist(); notify();
      } else {
        draw();
        if (!cancel) toast(L.cantDrop);
      }
    }
    // على مستوى الصفحة كلها: لو الإصبع/الماوس اتساب بره الـ widget السحب يخلص برضه
    var onUp = function (e) { endDrag(e, false); }, onCancel = function (e) { endDrag(e, true); };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
    function rotateSel() {
      var p = selPanel(); if (!p) return;
      var sh = R.sheets[view.sel.si];
      var others = sh.placed.filter(function (q) { return q !== p; });
      if (S.opts.grain && !(p.it && p.it.s === 'c')) { toast(L.cantRot); return; }
      var okNormal = fits(sh, others, p.x, p.y, p.h, p.w);
      var okGap = !okNormal && p.free && gapSpotOk(sh, others, p.x, p.y, p.h, p.w, R.k);
      if (!okNormal && !okGap) { toast(L.cantRot); return; }
      var t = p.w; p.w = p.h; p.h = t; p.rot = !p.rot;
      if (okNormal) { p.free = false; p.locked = true; }
      derive(sh, R.k); finalize({ sheets: [sh] });
      draw(); stats(); notify();
    }
    function pinSel() { var p = selPanel(); if (!p) return; p.locked = !p.locked; draw(); }
    function compactAll() {
      if (!R || !R.sheets.length) return;
      var any = false, t0 = now();
      R.sheets.forEach(function (sh) {
        var moved = true, guard = 0;
        while (moved && guard++ < 60 && now() - t0 < 1500) {
          moved = false;
          sh.placed.slice().sort(function (a, b) { return a.x - b.x || a.y - b.y; }).forEach(function (p) {
            if (p.locked || p.free) return;
            ['x', 'y'].forEach(function (ax) {
              var len = ax === 'x' ? 'w' : 'h', others = sh.placed.filter(function (q) { return q !== p; });
              var cands = [0].concat(others.map(function (q) { return q[ax] + q[len] + R.k; }))
                .filter(function (c) { return c < p[ax] - EPS; }).sort(function (a, b) { return a - b; });
              for (var i = 0; i < cands.length; i++) {
                var nx = ax === 'x' ? cands[i] : p.x, ny = ax === 'y' ? cands[i] : p.y;
                if (fits(sh, others, nx, ny, p.w, p.h)) { p.x = nx; p.y = ny; moved = true; any = true; break; }
              }
            });
          });
        }
        derive(sh, R.k); finalize({ sheets: [sh] });
      });
      view.sel = null; draw(); stats();
      toast(any ? L.compacted : L.alreadyCompact);
      if (any) { persist(); notify(); }
    }
    function changeLayout() {
      if (!R || !R.sheets.length || !R.items) return;
      if (!R.alts) {
        var col = []; bestPack(S, R.items, R.stock, R.k, null, col);
        col.sort(function (a, b) { return cmp(a.score, b.score); });
        var top = col[0], variants = [], seen = {};
        var sig = function (c, fx, fy) {
          return c.sheets.map(function (sh) {
            return sh.placed.map(function (p) {
              var x = fx ? sh.W - p.x - p.w : p.x, y = fy ? sh.H - p.y - p.h : p.y;
              return [x, y, p.w, p.h].map(function (v) { return Math.round(v * 100); }).join(',');
            }).sort().join(';');
          }).join('|');
        };
        [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(function (f) {
          col.forEach(function (c) {
            if (variants.length >= 30 || c.score[0] !== top.score[0] || c.score[1] !== top.score[1] || c.score[4] > top.score[4] + 1) return;
            var sg = sig(c, f[0], f[1]); if (seen[sg]) return; seen[sg] = 1;
            variants.push({ c: c, fx: f[0], fy: f[1] });
          });
        });
        R.alts = { list: variants, idx: 0 };
      }
      var A = R.alts, n = A.list.length;
      if (n < 2) { toast(L.noAlt); return; }
      A.idx = (A.idx + 1) % n;
      var v = A.list[A.idx];
      var sheets = v.c.sheets.map(function (sh) {
        var t = { W: sh.W, H: sh.H, m: sh.m, ri: sh.ri, si: sh.si, free: [], cuts: [], placed: sh.placed.map(function (p) {
          return { x: v.fx ? sh.W - p.x - p.w : p.x, y: v.fy ? sh.H - p.y - p.h : p.y, w: p.w, h: p.h, it: p.it, rot: p.rot };
        }) };
        derive(t, R.k); return t;
      });
      var nr = { sheets: sheets, unplaced: v.c.unplaced, k: R.k, nItems: R.nItems, nStock: R.nStock, stock: R.stock, items: R.items, alts: A };
      finalize(nr);
      if (S.opts.gaps && S.opts.shapes) gapFill(S, nr);
      R = nr; view.sel = null; view.sheet = 0; draw(); stats(); toast(L.layoutN(A.idx + 1, n)); notify();
    }
    /* «دوّر أكتر»: بيجرب ترتيبات كتير (لحد 8 ثواني) على دفعات صغيرة عشان الشاشة ما تهنجش،
       وبيقف لوحده أول ما يوصل لأقل عدد شيتات ممكن. الضغطة التانية بتوقفه وبتاخد أحسن اللي لقاه */
    var moreRun = null;
    function searchMore(btn) {
      if (moreRun) { moreRun.stop = true; return; }
      if (!R || !R.sheets.length || !R.items) return;
      if (R.sheets.some(function (sh) { return sh.placed.some(function (p) { return p.locked; }); })) { toast(L.morePins); return; }
      var R0 = R, lb = minSheets(R.items, R.stock), n0 = R.sheets.length;
      if (!R.unplaced.length && n0 <= lb) { toast(L.moreMin); return; }
      MINTRIM = num(S.opts.trim);
      var run = moreRun = { stop: false, n: 0, best: null, score: scoreOf(R) }, t0 = now(), sd = 1000;
      btn.textContent = L.moreStop;
      function finish() {
        moreRun = null; btn.textContent = L.more;
        if (R !== R0) return;                       // الحساب اتعاد أثناء البحث: النتيجة دي قديمة
        var b = run.best;
        if (!b) { toast(L.moreNone); return; }
        b.k = R.k; b.nItems = R.nItems; b.nStock = R.nStock; b.stock = R.stock; b.items = R.items;
        finalize(b); if (S.opts.gaps && S.opts.shapes) gapFill(S, b);
        R = b; view.sel = null; view.sheet = 0; draw(); stats(); notify();
        toast(L.moreBetter(b.sheets.length, n0));
      }
      (function tick() {
        if (run.stop || R !== R0 || now() - t0 > 8000) { finish(); return; }
        var t1 = now();
        while (now() - t1 < 120) {
          var r = retryStep(S, R0.items, R0.stock, R0.k, sd++); run.n++;
          if (r && cmp(r.score, run.score) < 0) { run.best = r; run.score = r.score; }
          if (run.best && !run.best.unplaced.length && run.best.sheets.length <= lb) { finish(); return; }
        }
        toast(L.moreBusy(run.n * 7));
        setTimeout(tick, 0);
      })();
    }
    function rearrange() {
      if (!R || !R.sheets.length) return;
      var any = R.sheets.some(function (sh) { return sh.placed.some(function (p) { return p.locked; }); });
      if (!any) { toast(L.needPin); return; }
      var nr = repack(S, R);
      if (!nr) { toast(L.cantPack); return; }
      if (S.opts.gaps && S.opts.shapes) gapFill(S, nr);
      R = nr; view.sel = null; view.sheet = 0; draw(); stats(); toast(L.rearranged); notify();
    }
    var rt, onResize = function () { clearTimeout(rt); rt = setTimeout(function () { draw(); }, 120); };
    window.addEventListener('resize', onResize);
    // لو الـ widget اتفتح وهو مستخبي (تاب تاني في التطبيق) يترسم صح أول ما يظهر
    var ro = null, lastW = -1;
    if (global.ResizeObserver) {
      ro = new ResizeObserver(function () { var w = root.clientWidth; if (w && Math.abs(w - lastW) > 1) { lastW = w; onResize(); } });
      lastW = root.clientWidth; ro.observe(root);
    }

    renderAllInputs();
    R = solve(S); if (S.opts.gaps && S.opts.shapes) gapFill(S, R); stats();
    draw();

    return {
      calculate: calculate,
      getResult: getResult,
      getState: function () { return JSON.parse(JSON.stringify(S)); },
      openInvoice: function (inv) { openInvoice(inv); },
      setState: function (st, run) { applyState(st || {}); renderAllInputs(); persist(); if (run) { calculate(); } },
      destroy: function () { window.removeEventListener('resize', onResize); document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onCancel); if (ro) ro.disconnect(); clearTimeout(rt); el.innerHTML = ''; }
    };
  }
  var uid = 0;
  var _mount = mount;
  mount = function (el, o) { uid++; return _mount(el, o); };

  global.CutlistPlanner = { mount: function (el, o) { return mount(el, o); } };
})(window);

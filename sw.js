/* رقم النسخة بييجي من التطبيق نفسه (sw.js?v=APP_VER)، فكل تحديث بيعمل كاش جديد ويمسح القديم */
const V = new URL(self.location.href).searchParams.get('v') || '0';
const C = 'eltabakha-v' + V;
const Q = '?v=' + V;
const A = ['./', './index.html', './privacy.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './vodafone.svg', './instapay.png', './css/style.css' + Q, './js/app.js' + Q, './js/qr.js' + Q, './js/cutlist.js' + Q, './js/features.js' + Q];
const NAV_TIMEOUT = 4000; // لو النت بطيء أكتر من كده افتح النسخة المحفوظة على طول

self.addEventListener('install', e => {
  // كل ملف لوحده: لو ملف واحد ناقص (زي أيقونة) التثبيت ميفشلش كله
  e.waitUntil(caches.open(C).then(c => Promise.all(A.map(u =>
    fetch(u, { cache: 'reload' }).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {})
  ))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x.startsWith('eltabakha-') && x !== C).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});

// البرنامج مقفول: بنعرض آخر تنبيهات سابها البرنامج في IndexedDB (nfSave). المتصفح هو اللي بيحدد التوقيت
function alertsNow() {
  return new Promise(res => {
    const q = indexedDB.open('tabakha-data');
    q.onerror = () => res([]);
    q.onsuccess = () => {
      const db = q.result;
      if (!db.objectStoreNames.contains('kv')) { db.close(); res([]); return; }
      const g = db.transaction('kv', 'readonly').objectStore('kv').get('alertNow');
      g.onerror = () => { db.close(); res([]); };
      g.onsuccess = () => { db.close(); res(Array.isArray(g.result) ? g.result : []); };
    };
  });
}

self.addEventListener('periodicsync', e => {
  if (e.tag !== 'tabakha-alerts') return;
  e.waitUntil(alertsNow().then(l => Promise.all(l.map(a => self.registration.showNotification('فواتير', {
    body: a.m, icon: 'icon-192.png', badge: 'icon-192.png', tag: a.k, lang: 'ar', dir: 'rtl', data: { go: a.k }
  })))));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const go = (e.notification.data || {}).go || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    if (l[0]) { l[0].postMessage({ go }); return l[0].focus(); }
    return self.clients.openWindow('./index.html' + (go ? '#go=' + go : ''));
  }));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isNav = req.mode === 'navigate';
  // ignoreSearch: لو رقم النسخة مش موجود من غير نت، أي نسخة محفوظة أحسن من صفحة فاضية
  const fromCache = () => caches.match(req, { ignoreSearch: true }).then(m => m || (isNav ? caches.match('./index.html') : undefined));

  // الملف اللي برقم نسخة مبيتغيرش: المحفوظ بنفس الرقم أولاً، عشان الصفحة وملفاتها يفضلوا من نفس النسخة
  if (!isNav && new URL(req.url).searchParams.has('v')) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => {
      if (r && r.ok && r.type === 'basic') { const cp = r.clone(); caches.open(C).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => fromCache().then(x => x || Response.error()))));
    return;
  }

  e.respondWith(new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done && r) { done = true; resolve(r); } };

    const net = fetch(req, { cache: 'no-cache' }).then(r => {
      // بنحفظ الردود السليمة بس، عشان صفحة خطأ ما تتحفظش مكان النسخة الكويسة
      if (r && r.ok && r.type === 'basic') { const cp = r.clone(); caches.open(C).then(c => c.put(req, cp)); }
      return r;
    });

    const timer = isNav ? setTimeout(() => { fromCache().then(finish); }, NAV_TIMEOUT) : null;

    net.then(r => { clearTimeout(timer); finish(r); })
      .catch(() => {
        clearTimeout(timer);
        fromCache().then(m => finish(m || Response.error()));
      });
  }));
});

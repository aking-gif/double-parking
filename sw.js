/* ============================================================
   Arsan Service Worker — Network-first strategy
   - يطلب من الشبكة دائماً
   - يستخدم الـ cache فقط لو انقطعت الشبكة
   - يحذف الكاش القديم عند التفعيل
   ============================================================ */

const CACHE_NAME = 'arsan-v' + Date.now();
const STATIC_CACHE = 'arsan-static-v1';

// ملفات يُسمح بتخزينها (لو انقطعت الشبكة فقط)
const CACHEABLE = /\.(css|png|jpg|jpeg|svg|woff2?|ttf|ico)$/i;

self.addEventListener('install', (event) => {
  // تفعيل فوري بدون انتظار الـ tabs المفتوحة
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // حذف كل الكاش القديم
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k))
    );
    // السيطرة على كل الـ tabs المفتوحة فوراً
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // فقط same-origin
  if (url.origin !== self.location.origin) return;
  // فقط GET
  if (req.method !== 'GET') return;

  // لا تتدخل في استدعاءات API
  if (url.pathname.includes('/api/')) return;

  // Network-first: جرّب الشبكة أولاً، ثم الكاش احتياطي
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-cache' });
      // خزّن فقط الملفات الثابتة (CSS/صور/خطوط)
      if (fresh.ok && CACHEABLE.test(url.pathname)) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(req, fresh.clone()).catch(()=>{});
      }
      return fresh;
    } catch (err) {
      // انقطعت الشبكة — جرّب الكاش
      const cached = await caches.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});

// استقبال رسالة "skip waiting" من الصفحة (للتحديث الفوري)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

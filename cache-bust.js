/* ============================================================
   Arsan Cache Buster
   حل جذري لمشكلة: الفريق لا يرى التحديثات بدون Ctrl+Shift+R

   يفعل:
   1. يسجّل Service Worker بسيط يأخذ استراتيجية "network-first"
      → المتصفح يطلب من الشبكة أولاً، الـ cache فقط احتياطي
   2. يفحص نسخة التطبيق كل 5 دقائق + كل ما عاد المستخدم للـ tab
   3. يظهر زر "نسخة جديدة متاحة — تحديث" عند وجود تحديث
   4. يضيف زر يدوي "🔄 تحديث" في الأعلى (بجانب اللغة/المظهر)
   ============================================================ */

(function(){
  'use strict';
  if (window.__ARSAN_CACHE_BUST) return;
  window.__ARSAN_CACHE_BUST = true;

  const VERSION_URL = 'version.json?t=' + Date.now();
  const CHECK_INTERVAL = 5 * 60 * 1000; // 5 دقائق
  const STORAGE_KEY = 'arsan_app_version';

  // ============================================================
  // 1. تسجيل Service Worker (network-first)
  // ============================================================
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('[Arsan] SW register failed:', err);
    });

    // عند تحديث الـ SW → اعرض إشعار
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.__arsan_sw_reloading) return;
      window.__arsan_sw_reloading = true;
      showUpdateToast('تم تحديث النسخة تلقائياً');
      setTimeout(() => location.reload(), 1500);
    });
  }

  // ============================================================
  // 2. فحص دوري للنسخة
  // ============================================================
  async function checkVersion(){
    try {
      const r = await fetch(VERSION_URL.replace(/t=\d+/, 't=' + Date.now()), {
        cache: 'no-store',
        credentials: 'omit'
      });
      if (!r.ok) return;
      const j = await r.json();
      const latest = j.version || j.build || j.hash;
      if (!latest) return;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, latest);
        return;
      }
      if (stored !== latest) {
        showUpdateBanner(latest, j.notes || '');
      }
    } catch(_) { /* ignore */ }
  }

  // ============================================================
  // 3. لافتة "نسخة جديدة متاحة"
  // ============================================================
  function showUpdateBanner(newVersion, notes){
    if (document.getElementById('arsan-update-banner')) return;
    const bar = document.createElement('div');
    bar.id = 'arsan-update-banner';
    bar.innerHTML = `
      <style>
        #arsan-update-banner{
          position:fixed; top:0; left:0; right:0; z-index:99998;
          background:linear-gradient(135deg,#8B6F00,#B48B2A);
          color:#fff; padding:12px 20px;
          display:flex; align-items:center; justify-content:center; gap:16px;
          font-family:'IBM Plex Sans Arabic',system-ui,sans-serif;
          font-size:14px; font-weight:500;
          box-shadow:0 4px 12px rgba(0,0,0,.2);
          animation:aub-slide-in .4s ease;
        }
        @keyframes aub-slide-in { from{transform:translateY(-100%)} to{transform:translateY(0)} }
        #arsan-update-banner button{
          padding:6px 18px; border-radius:6px; border:0;
          background:#fff; color:#8B6F00; font-weight:700;
          cursor:pointer; font-family:inherit; font-size:13px;
          transition:transform .15s;
        }
        #arsan-update-banner button:hover{ transform:scale(1.05); }
        #arsan-update-banner .aub-dismiss{
          background:transparent; color:#fff; opacity:.7;
          border:1px solid rgba(255,255,255,.3);
        }
        body.has-update-banner { padding-top:52px; }
      </style>
      <span>✨ نسخة جديدة متاحة — اضغط "تحديث الآن" للحصول على آخر الميزات</span>
      <button id="aub-apply">🔄 تحديث الآن</button>
      <button class="aub-dismiss" id="aub-later">لاحقاً</button>
    `;
    document.body.appendChild(bar);
    document.body.classList.add('has-update-banner');

    bar.querySelector('#aub-apply').onclick = () => {
      localStorage.setItem(STORAGE_KEY, newVersion);
      hardReload();
    };
    bar.querySelector('#aub-later').onclick = () => {
      bar.remove();
      document.body.classList.remove('has-update-banner');
      // تذكير بعد 30 دقيقة
      setTimeout(() => showUpdateBanner(newVersion, notes), 30 * 60 * 1000);
    };
  }

  // ============================================================
  // 4. Toast بسيط (للإشعارات اللحظية)
  // ============================================================
  function showUpdateToast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `
      position:fixed; bottom:20px; right:20px; z-index:99999;
      background:#8B6F00; color:#fff; padding:12px 20px;
      border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,.25);
      font-family:'IBM Plex Sans Arabic',system-ui,sans-serif;
      font-size:13px; font-weight:500;
      animation:aut-slide-up .3s ease;
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // ============================================================
  // 5. Hard reload مع تنظيف الـ cache
  // ============================================================
  async function hardReload(){
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    } catch(_) {}
    // إضافة timestamp للـ URL لإجبار refresh كامل
    const u = new URL(location.href);
    u.searchParams.set('_v', Date.now());
    location.href = u.toString();
  }

  // كشف دالّة الـ hard reload عالمياً
  window.ArsanHardReload = hardReload;

  // ============================================================
  // 6. زر "تحديث يدوي" في الـ header
  // ============================================================
  function injectRefreshButton(){
    if (document.getElementById('arsanRefresh')) return;
    // نحاول إضافته بجانب زر اللغة / المظهر
    const langToggle = document.getElementById('langToggle');
    const themeToggle = document.getElementById('themeToggle');
    const anchor = langToggle || themeToggle;
    if (!anchor || !anchor.parentNode) {
      setTimeout(injectRefreshButton, 500);
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'arsanRefresh';
    btn.type = 'button';
    btn.title = 'تحديث النسخة — يمسح الـ cache ويحمّل آخر إصدار';
    btn.setAttribute('aria-label', 'تحديث');
    // نحاول مطابقة نفس class الأزرار المجاورة
    btn.className = anchor.className;
    btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
      </svg>
      <span>تحديث</span>
    </span>`;
    btn.onclick = async () => {
      btn.disabled = true;
      btn.querySelector('svg').style.animation = 'aspin 1s linear infinite';
      const style = document.createElement('style');
      style.textContent = '@keyframes aspin{to{transform:rotate(-360deg)}}';
      document.head.appendChild(style);
      await hardReload();
    };
    anchor.parentNode.insertBefore(btn, anchor);
  }

  // ============================================================
  // 7. فحص عند الرجوع للصفحة (بعد وضع sleep مثلاً)
  // ============================================================
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkVersion();
  });

  // ============================================================
  // 8. Boot
  // ============================================================
  function boot(){
    injectRefreshButton();
    // فحص أولي بعد 2 ثانية من تحميل الصفحة
    setTimeout(checkVersion, 2000);
    // فحص دوري
    setInterval(checkVersion, CHECK_INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

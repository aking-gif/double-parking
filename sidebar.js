/* Arsan Sidebar — replaces the bottom floating toolbar with a clean slide-out menu
 * Mounts automatically after dashboard injectTopBar() runs.
 * Converts .arsan-topbar into a hidden slide-in panel triggered by a FAB.
 */
(function(){
  'use strict';

  function injectStyles(){
    if (document.getElementById('arsan-sidebar-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-sidebar-styles';
    s.textContent = `
      /* Hide the old bottom bar completely */
      .arsan-topbar{
        position:fixed !important;
        top:0 !important;
        inset-inline-end:0 !important;
        inset-inline-start:auto !important;
        bottom:auto !important;
        left:auto !important;
        right:0 !important;
        height:100vh !important;
        width:280px !important;
        max-width:85vw !important;
        background:linear-gradient(180deg, #1a1510 0%, #231a10 100%) !important;
        border:none !important;
        border-inline-start:1px solid rgba(133,113,77,.2) !important;
        border-radius:0 !important;
        box-shadow:-8px 0 30px rgba(0,0,0,.3) !important;
        backdrop-filter:none !important;
        padding:80px 16px 20px !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:stretch !important;
        gap:6px !important;
        flex-wrap:nowrap !important;
        overflow-y:auto !important;
        transform:translateX(var(--inline-dir, 100%)) !important;
        transition:transform .3s cubic-bezier(.4,0,.2,1) !important;
        z-index:9000 !important;
        max-width:none !important;
      }
      html[dir="rtl"] .arsan-topbar{ --inline-dir: 100%; }
      html[dir="ltr"] .arsan-topbar{
        inset-inline-end:auto !important;
        inset-inline-start:0 !important;
        right:auto !important;
        left:0 !important;
        border-inline-start:none !important;
        border-inline-end:1px solid rgba(133,113,77,.2) !important;
        box-shadow:8px 0 30px rgba(0,0,0,.3) !important;
        --inline-dir: -100%;
      }
      html[data-theme="light"] .arsan-topbar{
        background:linear-gradient(180deg, #faf6ea 0%, #f3ead0 100%) !important;
        border-color:rgba(133,113,77,.3) !important;
      }
      body.arsan-sidebar-open .arsan-topbar{
        transform:translateX(0) !important;
      }

      /* Reshape buttons as menu items */
      .arsan-topbar-btn{
        width:100% !important;
        justify-content:flex-start !important;
        padding:12px 14px !important;
        font-size:14px !important;
        border-radius:10px !important;
        border:1px solid transparent !important;
        background:rgba(255,255,255,.03) !important;
        color:#f3e9c9 !important;
        text-align:start !important;
        white-space:nowrap !important;
        transition:background .15s, transform .05s !important;
      }
      html[data-theme="light"] .arsan-topbar-btn{
        background:rgba(255,255,255,.7) !important;
        color:#3a2f15 !important;
      }
      .arsan-topbar-btn:hover{
        background:rgba(133,113,77,.15) !important;
        border-color:rgba(133,113,77,.3) !important;
      }
      .arsan-topbar-btn.primary{
        background:linear-gradient(180deg, #85714D, #5E4F36) !important;
        color:#fff !important;
        border-color:#85714D !important;
        font-weight:600 !important;
      }
      .arsan-topbar .arsan-role,
      .arsan-topbar span:not(.dot){
        font-size:12px !important;
        padding:6px 10px !important;
        opacity:.7 !important;
      }

      /* ===== FAB trigger ===== */
      #arsan-fab{
        position:fixed;
        top:16px;
        inset-inline-end:16px;
        right:16px;
        left:auto;
        z-index:9100;
        width:44px;height:44px;
        border-radius:12px;
        background:linear-gradient(135deg, #85714D, #5E4F36);
        border:none;
        color:#fff;
        cursor:pointer;
        display:grid;
        place-items:center;
        box-shadow:0 4px 14px rgba(133,113,77,.35), 0 2px 6px rgba(0,0,0,.15);
        transition:transform .15s, box-shadow .15s;
      }
      html[dir="ltr"] #arsan-fab{
        inset-inline-end:auto;
        inset-inline-start:16px;
        right:auto; left:16px;
      }
      #arsan-fab:hover{
        transform:scale(1.05);
        box-shadow:0 6px 20px rgba(133,113,77,.45), 0 3px 10px rgba(0,0,0,.2);
      }
      #arsan-fab:active{ transform:scale(.96); }
      #arsan-fab svg{ width:22px; height:22px; stroke:#fff; stroke-width:2.4; fill:none; stroke-linecap:round; stroke-linejoin:round; }
      #arsan-fab .bars line{
        transition:all .25s cubic-bezier(.4,0,.2,1);
        transform-origin:center;
      }
      body.arsan-sidebar-open #arsan-fab .bars line:nth-child(1){
        transform:translate(0,6px) rotate(45deg);
      }
      body.arsan-sidebar-open #arsan-fab .bars line:nth-child(2){
        opacity:0;
      }
      body.arsan-sidebar-open #arsan-fab .bars line:nth-child(3){
        transform:translate(0,-6px) rotate(-45deg);
      }

      /* ===== Backdrop ===== */
      #arsan-sidebar-bd{
        position:fixed;inset:0;z-index:8999;
        background:rgba(0,0,0,.45);
        opacity:0;pointer-events:none;
        transition:opacity .25s ease;
      }
      body.arsan-sidebar-open #arsan-sidebar-bd{
        opacity:1;pointer-events:auto;
      }

      /* ===== Sidebar header (brand) ===== */
      .arsan-sb-head{
        position:absolute;top:0;inset-inline-start:0;inset-inline-end:0;
        padding:20px 20px 14px;
        border-bottom:1px solid rgba(133,113,77,.15);
        display:flex;align-items:center;gap:10px;
        pointer-events:auto;
      }
      .arsan-sb-head .brand-wrap{
        display:flex;align-items:center;gap:10px;
        flex:1; pointer-events:none;
      }
      .arsan-sb-head .logo{
        width:auto;height:48px;
        background:transparent;
        display:grid;place-items:center;
        filter: drop-shadow(0 2px 6px rgba(133,113,77,.3));
      }
      .arsan-sb-head .logo img{ width:auto; height:100%; display:block; }
      .arsan-sb-head .title{
        font-size:14px;font-weight:600;color:#f3e9c9;
      }
      html[data-theme="light"] .arsan-sb-head .title{ color:#3a2f15; }
      .arsan-sb-head .title small{
        display:block;font-size:11px;opacity:.6;font-weight:400;
      }
      /* Refresh button — force latest version */
      .arsan-sb-refresh{
        margin-top:auto;
        padding-top:14px;
        border-top:1px solid rgba(133,113,77,.15);
      }
      .arsan-sb-refresh button{
        width:100%;
        padding:10px 12px;
        border-radius:8px;
        border:1px solid rgba(133,113,77,.25);
        background:rgba(255,255,255,.03);
        color:#f3e9c9;
        font-size:13px;
        font-weight:500;
        cursor:pointer;
        display:flex;align-items:center;justify-content:center;gap:8px;
        transition:background .15s, border-color .15s;
      }
      html[data-theme="light"] .arsan-sb-refresh button{
        background:rgba(255,255,255,.7);
        color:#3a2f15;
      }
      .arsan-sb-refresh button:hover{
        background:rgba(133,113,77,.15);
        border-color:rgba(133,113,77,.5);
      }
      .arsan-sb-refresh button .spin{
        display:inline-block;width:14px;height:14px;
        transition:transform .4s;
      }
      .arsan-sb-refresh button.loading .spin{
        animation:arsanSpin .8s linear infinite;
      }
      @keyframes arsanSpin{ to{ transform:rotate(360deg); } }
      .arsan-sb-refresh .ver{
        display:block;text-align:center;
        font-size:10px;opacity:.5;margin-top:6px;
        font-variant-numeric:tabular-nums;
      }

      /* Embedded language switch at the bottom of the sidebar */
      .arsan-sb-lang{
        padding-top:10px;
        border-top:1px solid rgba(133,113,77,.15);
        display:flex;gap:6px;
      }
      .arsan-sb-lang button{
        flex:1;
        padding:10px 12px;
        border-radius:10px;
        border:1px solid rgba(133,113,77,.25);
        background:rgba(255,255,255,.04);
        color:#f3e9c9;
        font:inherit;font-size:13px;font-weight:600;
        cursor:pointer;
        transition:background .15s, color .15s, border-color .15s;
      }
      html[data-theme="light"] .arsan-sb-lang button{
        background:rgba(255,255,255,.7);
        color:#3a2f15;
      }
      .arsan-sb-lang button:hover{
        background:rgba(133,113,77,.15);
      }
      .arsan-sb-lang button.active{
        background:linear-gradient(180deg, #85714D, #5E4F36);
        color:#fff;
        border-color:#85714D;
      }

      /* Respect mobile */
      @media (max-width: 700px){
        .arsan-topbar{ width:85vw !important; }
      }
    `;
    document.head.appendChild(s);
  }

  function createFab(){
    if (document.getElementById('arsan-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'arsan-fab';
    fab.setAttribute('aria-label', 'Menu');
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" class="bars">
        <line x1="4" y1="6" x2="20" y2="6"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
        <line x1="4" y1="18" x2="20" y2="18"/>
      </svg>
    `;
    fab.addEventListener('click', toggleSidebar);
    document.body.appendChild(fab);
  }

  function createBackdrop(){
    if (document.getElementById('arsan-sidebar-bd')) return;
    const bd = document.createElement('div');
    bd.id = 'arsan-sidebar-bd';
    bd.addEventListener('click', closeSidebar);
    document.body.appendChild(bd);
  }

  function addSidebarHeader(topbar){
    if (topbar.querySelector('.arsan-sb-head')) return;
    const head = document.createElement('div');
    head.className = 'arsan-sb-head';
    head.innerHTML = `
      <div class="brand-wrap">
        <div class="logo" id="arsan-sb-logo">${(window.ArsanBrand && window.ArsanBrand.logo) ? window.ArsanBrand.logo(48) : ''}</div>
        <div class="title">Arsann SOPs<small>منصة الإجراءات التشغيلية</small></div>
      </div>
    `;
    topbar.appendChild(head);
  }

  function addRefreshButton(topbar){
    if (topbar.querySelector('.arsan-sb-refresh')) return;
    const wrap = document.createElement('div');
    wrap.className = 'arsan-sb-refresh';
    const lang = (localStorage.getItem('arsan_lang') || 'ar');
    const label = (lang === 'en') ? 'Check for updates' : 'تحقق من التحديثات';
    wrap.innerHTML = `
      <button type="button" data-i18n="sb.refresh">
        <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>
        <span class="lbl">${label}</span>
      </button>
      <span class="ver"></span>
    `;
    const btn = wrap.querySelector('button');
    const ver = wrap.querySelector('.ver');
    // Show current version timestamp from build or last-modified
    const buildTs = (window.ArsanBuildTime || document.lastModified || '');
    try {
      const d = new Date(buildTs);
      if (!isNaN(d.getTime())) {
        const pad = n => String(n).padStart(2,'0');
        ver.textContent = `v ${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    } catch(e) {}

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (btn.classList.contains('loading')) return;
      btn.classList.add('loading');
      const lbl = btn.querySelector('.lbl');
      const curLang = (localStorage.getItem('arsan_lang') || 'ar');
      lbl.textContent = (curLang === 'en') ? 'Refreshing…' : 'جاري التحديث…';

      // Cache-busting: unregister service workers + clear caches, then hard-reload
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
      } catch(err) {}
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch(err) {}

      // Pre-warm all <script src> and <link rel=stylesheet> with fresh query so browser discards the stale ones
      const stamp = Date.now().toString(36);
      try {
        const assets = [...document.querySelectorAll('script[src], link[rel="stylesheet"][href]')];
        await Promise.all(assets.map(node => {
          const attr = node.tagName === 'SCRIPT' ? 'src' : 'href';
          const u = new URL(node.getAttribute(attr), location.href);
          // only same-origin
          if (u.origin !== location.origin) return Promise.resolve();
          u.searchParams.set('_rb', stamp);
          return fetch(u.toString(), { cache:'reload', mode:'no-cors' }).catch(()=>{});
        }));
      } catch(err) {}

      // Force a hard reload with a global cache-buster that the page itself reads
      // (we intercept this in boot to append _rb to every script/link)
      localStorage.setItem('arsan_cache_bust', stamp);
      const url = new URL(location.href);
      url.searchParams.set('_r', stamp);
      // Use location.reload(true) on older browsers, but location.replace is more reliable
      location.replace(url.toString());
    });

    topbar.appendChild(wrap);
  }

  function addLangSwitch(topbar){
    if (topbar.querySelector('.arsan-sb-lang')) return;
    const wrap = document.createElement('div');
    wrap.className = 'arsan-sb-lang';
    wrap.innerHTML = `
      <button type="button" data-lang="ar">عربي</button>
      <button type="button" data-lang="en">English</button>
    `;
    wrap.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = b.dataset.lang;
        if (window.ArsanI18n && window.ArsanI18n.setLang) {
          window.ArsanI18n.setLang(lang);
        } else {
          localStorage.setItem('arsan_lang', lang);
          location.reload();
        }
        updateLangActive(wrap);
      });
    });
    topbar.appendChild(wrap);
    updateLangActive(wrap);
  }

  function updateLangActive(wrap){
    const cur = (window.ArsanI18n && window.ArsanI18n.getLang && window.ArsanI18n.getLang()) || localStorage.getItem('arsan_lang') || 'ar';
    wrap.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === cur);
    });
  }

  window.addEventListener('arsan-lang-change', () => {
    const wrap = document.querySelector('.arsan-sb-lang');
    if (wrap) updateLangActive(wrap);
  });

  function openSidebar(){
    document.body.classList.add('arsan-sidebar-open');
  }
  function closeSidebar(){
    document.body.classList.remove('arsan-sidebar-open');
  }
  function toggleSidebar(){
    document.body.classList.toggle('arsan-sidebar-open');
  }

  // Close when a menu item inside is clicked
  function wireAutoClose(topbar){
    topbar.querySelectorAll('.arsan-topbar-btn').forEach(btn => {
      if (btn.__arsanWired) return;
      btn.__arsanWired = true;
      btn.addEventListener('click', () => {
        // Delay so the original click handler runs first
        setTimeout(closeSidebar, 150);
      });
    });
  }

  // Escape key closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  function init(){
    injectStyles();
    createFab();
    createBackdrop();

    // Watch for the .arsan-topbar to appear (created dynamically after login)
    const run = () => {
      const tb = document.querySelector('.arsan-topbar');
      if (tb) {
        addSidebarHeader(tb);
        addRefreshButton(tb);
        addLangSwitch(tb);
        wireAutoClose(tb);
      }
    };
    run();
    const obs = new MutationObserver(() => {
      run();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ArsanSidebar = { open: openSidebar, close: closeSidebar, toggle: toggleSidebar };
})();

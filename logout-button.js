/* ================================================================
   Arsan Logout Button — header pill, sits to the LEFT of:
     [تغيير الإدارة] [EN] [المظهر] → [خروج]
   Matches the .theme-toggle pill style on the dark header so it
   reads as part of the same control group. Works on dashboard.html
   and any page that uses the same header pattern.
   Falls back to a subtle floating FAB if no header slot is found
   (e.g. plain index.html before the toggles mount).
   ================================================================ */
(function(){
  if (window.__arsanLogoutBtnInit) return;
  window.__arsanLogoutBtnInit = true;

  function me(){
    try {
      return JSON.parse(
        localStorage.getItem('arsan_me_v1') ||
        localStorage.getItem('arsan_me') || 'null'
      );
    } catch(_){ return null; }
  }
  function loggedIn(){ const m = me(); return !!(m && m.email); }

  function injectStyles(){
    if (document.getElementById('arsan-logout-btn-styles')) return;
    const css = `
      /* Header pill — inherits the dark header look (.theme-toggle) */
      .arsan-logout-inline{
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:6px 12px;
        border:1px solid rgba(255,255,255,.14);
        border-radius:999px;
        font-size:12px;
        color:var(--header-ink, #F7F6F2);
        background:rgba(255,255,255,.04);
        font:inherit;
        font-size:12px;
        cursor:pointer;
        transition: background .15s ease, border-color .15s ease, color .15s ease;
        vertical-align:middle;
        margin-inline-start:0;
      }
      .arsan-logout-inline:hover{
        background:rgba(255,120,120,.14);
        border-color:rgba(255,150,150,.45);
        color:#ffdada;
      }
      .arsan-logout-inline svg{ opacity:.85 }

      /* Light-themed host pages (index.html brandline with light bg) */
      html[data-theme="light"] .arsan-logout-inline,
      .brandline.is-light .arsan-logout-inline{
        color:#5a4a2e;
        background:rgba(0,0,0,.03);
        border-color:rgba(0,0,0,.10);
      }
      html[data-theme="light"] .arsan-logout-inline:hover,
      .brandline.is-light .arsan-logout-inline:hover{
        background:rgba(180,66,60,.10);
        border-color:rgba(180,66,60,.40);
        color:#b4423c;
      }

      .arsan-logout-inline .arsan-logout-email{
        max-width:140px;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        font-weight:400;
        opacity:.7;
        font-size:11px;
        border-inline-start:1px solid currentColor;
        padding-inline-start:8px;
        margin-inline-start:2px;
      }
      @media (max-width: 720px){
        .arsan-logout-inline .arsan-logout-email{ display:none }
        .arsan-logout-inline .arsan-logout-label{ display:none }
        .arsan-logout-inline{ padding:6px 9px }
      }

      /* Fallback floating pill (pages without a header) */
      #arsan-logout-fab{
        position:fixed;
        top:14px;
        inset-inline-start:14px;
        z-index:9998;
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:8px 14px;
        border-radius:999px;
        border:1px solid rgba(0,0,0,.08);
        background:rgba(255,255,255,.9);
        backdrop-filter:blur(8px);
        color:#5a4a2e;
        font-size:13px;
        font-weight:500;
        font-family:inherit;
        cursor:pointer;
        box-shadow:0 2px 8px rgba(0,0,0,.08);
        transition:all .15s ease;
      }
      #arsan-logout-fab:hover{
        background:#b4423c;
        color:#fff;
        border-color:#b4423c;
        transform:translateY(-1px);
        box-shadow:0 4px 12px rgba(180,66,60,.25);
      }
      html[data-theme="dark"] #arsan-logout-fab{
        background:rgba(40,35,30,.9);
        color:#e0a7af;
        border-color:rgba(224,167,175,.25);
      }

      @keyframes arsan-logout-fade {
        from { opacity:0 }
        to { opacity:1 }
      }
      @keyframes arsan-logout-pop {
        from { opacity:0; transform:scale(.92) translateY(8px) }
        to   { opacity:1; transform:none }
      }
    `;
    const s = document.createElement('style');
    s.id = 'arsan-logout-btn-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  let __logoutBusy = false;
  async function doLogout(btn){
    if (__logoutBusy) return;
    // Non-blocking confirm via micro-popover to avoid UI freeze
    if (!(await confirmLogout(btn))) return;
    __logoutBusy = true;
    if (btn) { btn.disabled = true; btn.style.opacity = '.6'; btn.style.pointerEvents = 'none'; }
    // Clear client state FIRST so UI unfreezes even if backend hangs
    try {
      localStorage.removeItem('arsan_token_v1');
      localStorage.removeItem('arsan_token');
      localStorage.removeItem('arsan_me_v1');
      localStorage.removeItem('arsan_me');
    } catch(_){}
    // Fire backend logout but don't block navigation on it
    try {
      const token = (window.ArsanAPI && window.ArsanAPI.getToken && window.ArsanAPI.getToken()) ||
                    localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token');
      const base = window.API_BASE || '';
      if (token && base) {
        // keepalive = request survives navigation; 1s timeout
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 1000);
        fetch(base + '/api/logout', {
          method:'POST',
          headers:{ 'Authorization': 'Bearer ' + token },
          keepalive:true,
          signal: ctrl.signal,
        }).catch(()=>{});
      }
    } catch(_){}
    // Navigate immediately — don't wait
    const onIndex = /index\.html?$|\/$/.test(location.pathname);
    if (onIndex) location.reload();
    else location.replace('index.html');
  }

  /* Lightweight non-blocking confirmation popover near the button */
  function confirmLogout(anchor){
    return new Promise(resolve => {
      document.getElementById('arsan-logout-confirm')?.remove();
      // Backdrop + centered card (replaces old corner popover)
      const bd = document.createElement('div');
      bd.id = 'arsan-logout-confirm';
      bd.style.cssText = `
        position:fixed; inset:0; z-index:100000;
        background:rgba(20,20,22,.55);
        backdrop-filter:blur(6px);
        display:flex; align-items:center; justify-content:center;
        padding:20px; direction:rtl;
        font-family:"IBM Plex Sans Arabic", system-ui, sans-serif;
        animation: arsan-logout-fade .18s ease;
      `;
      const m = (function(){ try { return JSON.parse(localStorage.getItem('arsan_me_v1') || localStorage.getItem('arsan_me') || 'null'); } catch(_) { return null; } })();
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const cardBg = isDark ? '#1a1a1c' : '#fff';
      const cardFg = isDark ? '#F3F1EA' : '#111';
      const cardBd = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
      const subFg  = isDark ? '#a8a89e' : '#6B7280';
      const cancelBg = isDark ? 'transparent' : '#fff';
      const cancelBd = isDark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.12)';
      const cancelFg = isDark ? '#D7D3C7' : '#374151';

      bd.innerHTML =
        '<div style="' +
          'background:' + cardBg + '; color:' + cardFg + ';' +
          'border:1px solid ' + cardBd + ';' +
          'border-radius:18px; padding:24px 22px;' +
          'box-shadow:0 24px 60px rgba(0,0,0,.35), 0 8px 20px rgba(0,0,0,.18);' +
          'min-width:300px; max-width:420px; width:100%;' +
          'animation:arsan-logout-pop .22s cubic-bezier(.34,1.56,.64,1);' +
        '">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
            '<div style="width:44px;height:44px;border-radius:50%;background:rgba(180,66,60,.12);display:flex;align-items:center;justify-content:center;color:#b4423c;flex-shrink:0">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
                '<polyline points="16 17 21 12 16 7"/>' +
                '<line x1="21" y1="12" x2="9" y2="12"/>' +
              '</svg>' +
            '</div>' +
            '<div>' +
              '<div style="font-weight:700;font-size:16px;margin-bottom:2px">تسجيل الخروج</div>' +
              (m?.email ? '<div style="font-size:12px;color:' + subFg + '">' + m.email + '</div>' : '') +
            '</div>' +
          '</div>' +
          '<div style="font-size:14px;color:' + subFg + ';line-height:1.55;margin-bottom:18px">هل تريد فعلاً تسجيل الخروج من حسابك؟ ستحتاج لإعادة تسجيل الدخول للوصول إلى الإدارات والإجراءات.</div>' +
          '<div style="display:flex;gap:10px;justify-content:flex-end">' +
            '<button type="button" data-a="cancel" style="padding:9px 18px;border:1px solid ' + cancelBd + ';background:' + cancelBg + ';color:' + cancelFg + ';border-radius:10px;cursor:pointer;font:inherit;font-size:13.5px;font-weight:500">إلغاء</button>' +
            '<button type="button" data-a="ok" style="padding:9px 20px;border:0;background:#b4423c;color:#fff;border-radius:10px;cursor:pointer;font:inherit;font-size:13.5px;font-weight:600;box-shadow:0 4px 12px rgba(180,66,60,.3)">نعم، خروج</button>' +
          '</div>' +
        '</div>';

      const cleanup = (val) => { bd.remove(); document.removeEventListener('keydown', onKey); resolve(val); };
      const onKey = (e) => { if (e.key==='Escape') cleanup(false); if (e.key==='Enter') cleanup(true); };
      bd.addEventListener('click', (e) => {
        if (e.target === bd) { cleanup(false); return; }
        const a = e.target.closest('[data-a]'); if (!a) return;
        cleanup(a.dataset.a === 'ok');
      });
      document.body.appendChild(bd);
      // Focus the confirm button so Enter works
      setTimeout(() => {
        bd.querySelector('[data-a="ok"]')?.focus();
        document.addEventListener('keydown', onKey);
      }, 50);
    });
  }

  /* Find the right spot: after themeToggle, falling back to langToggle,
     changeDeptBtn, or any sibling of a .theme-toggle pill. The goal is
     that the button appears at the END of the toggles cluster — which
     in an RTL layout means the visually LEFTMOST position. */
  function findInlineAnchor(){
    const ids = ['themeToggle', 'langToggle', 'changeDeptBtn'];
    for (const id of ids) {
      const n = document.getElementById(id);
      if (n && n.parentElement) return { host: n.parentElement, after: n };
    }
    // Generic: any .theme-toggle pill
    const pill = document.querySelector('.theme-toggle');
    if (pill && pill.parentElement) return { host: pill.parentElement, after: pill };
    // index.html brandline fallback
    const brand = document.querySelector('.brandline');
    if (brand) return { host: brand, after: brand.lastElementChild };
    return null;
  }

  /* If an earlier build of the dashboard put a logout in the bottom
     .arsan-topbar, strip it — logout now lives in the header only. */
  function removeLegacyTopbarLogout(){
    const btns = document.querySelectorAll('.arsan-topbar .arsan-topbar-btn');
    btns.forEach(b => {
      const t = (b.textContent || '').trim();
      if (/^🚪|خروج|logout|log out/i.test(t)) b.remove();
    });
  }

  function buildBtn(){
    const m = me();
    const btn = document.createElement('button');
    btn.id = 'arsan-logout-inline';
    btn.type = 'button';
    btn.className = 'arsan-logout-inline';
    btn.title = 'تسجيل الخروج';
    btn.setAttribute('aria-label', 'تسجيل الخروج');
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
        '<polyline points="16 17 21 12 16 7"/>' +
        '<line x1="21" y1="12" x2="9" y2="12"/>' +
      '</svg>' +
      '<span class="arsan-logout-label">خروج</span>' +
      (m?.email ? '<span class="arsan-logout-email">' + m.email + '</span>' : '');
    btn.addEventListener('click', (e) => { e.preventDefault(); doLogout(btn); });
    return btn;
  }

  function render(){
    injectStyles();
    const logged = loggedIn();

    const oldFab = document.getElementById('arsan-logout-fab');
    const oldInline = document.getElementById('arsan-logout-inline');

    if (!logged) {
      if (oldFab) oldFab.remove();
      if (oldInline) oldInline.remove();
      return;
    }

    removeLegacyTopbarLogout();

    const slot = findInlineAnchor();
    if (slot) {
      if (oldFab) oldFab.remove();
      // If already mounted in the right place, keep it.
      if (oldInline && oldInline.parentElement === slot.host) return;
      if (oldInline) oldInline.remove();
      const btn = buildBtn();
      if (slot.after && slot.after.nextSibling) {
        slot.host.insertBefore(btn, slot.after.nextSibling);
      } else if (slot.after) {
        slot.host.appendChild(btn);
      } else {
        slot.host.appendChild(btn);
      }
      return;
    }

    // No anchor found — do NOT fall back to a floating FAB
    // (the user explicitly asked to remove that). The logout
    // button is also reachable from the avatar dropdown menu
    // (auth-gate.js), so we leave it at that.
    if (oldFab) oldFab.remove();
    if (oldInline) oldInline.remove();
    return;
  }

  function boot(){
    render();
    // Observe DOM mutations instead of polling — stops as soon as the
    // button lands in its final slot, and avoids the CPU/UI jank of a
    // recurring setInterval.
    let mounted = !!document.getElementById('arsan-logout-inline');
    const obs = new MutationObserver(() => {
      // Cheap early-exit: if our button is where we want it, disconnect.
      const el = document.getElementById('arsan-logout-inline');
      const anchor = document.getElementById('themeToggle') ||
                     document.getElementById('langToggle') ||
                     document.getElementById('changeDeptBtn');
      if (el && anchor && el.parentElement === anchor.parentElement) {
        mounted = true;
        return; // keep observing briefly for login/logout swaps
      }
      render();
    });
    obs.observe(document.body, { childList:true, subtree:true });
    // Stop observing after 10s — the dashboard has definitely mounted by then.
    setTimeout(() => obs.disconnect(), 10000);
    window.addEventListener('storage', render);
    window.addEventListener('arsan:login', render);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

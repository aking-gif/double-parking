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
      const pop = document.createElement('div');
      pop.id = 'arsan-logout-confirm';
      pop.style.cssText = `
        position:fixed; z-index:10000;
        background:#fff; color:#111;
        border:1px solid rgba(0,0,0,.12);
        border-radius:12px;
        box-shadow:0 12px 40px rgba(0,0,0,.18);
        padding:14px 16px; font:inherit; font-size:13px;
        min-width:240px; max-width:300px;
        animation: arsan-logout-pop .14s ease;
      `;
      pop.innerHTML =
        '<div style="margin-bottom:10px;font-weight:600">تسجيل الخروج من الحساب؟</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
          '<button type="button" data-a="cancel" style="padding:6px 12px;border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:8px;cursor:pointer;font:inherit;font-size:12.5px">إلغاء</button>' +
          '<button type="button" data-a="ok" style="padding:6px 12px;border:1px solid #b4423c;background:#b4423c;color:#fff;border-radius:8px;cursor:pointer;font:inherit;font-size:12.5px;font-weight:600">خروج</button>' +
        '</div>';
      // Position under the anchor (or center if no anchor)
      try {
        const r = anchor?.getBoundingClientRect?.();
        if (r) {
          pop.style.top = Math.min(window.innerHeight - 120, r.bottom + 8) + 'px';
          pop.style.insetInlineStart = Math.max(8, r.left - 8) + 'px';
        } else {
          pop.style.top = '80px';
          pop.style.insetInlineStart = '24px';
        }
      } catch(_){
        pop.style.top = '80px'; pop.style.insetInlineStart = '24px';
      }
      const cleanup = (val) => { pop.remove(); document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDoc, true); resolve(val); };
      const onKey = (e) => { if (e.key==='Escape') cleanup(false); if (e.key==='Enter') cleanup(true); };
      const onDoc = (e) => { if (!pop.contains(e.target) && e.target !== anchor) cleanup(false); };
      pop.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]'); if (!a) return;
        cleanup(a.dataset.a === 'ok');
      });
      document.body.appendChild(pop);
      // Defer global listeners a tick to avoid catching the same click
      setTimeout(() => {
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDoc, true);
      }, 0);
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

    // Fallback: floating pill
    if (oldInline) oldInline.remove();
    if (oldFab) return;
    const fab = document.createElement('button');
    fab.id = 'arsan-logout-fab';
    fab.type = 'button';
    fab.title = 'تسجيل الخروج';
    const m = me();
    fab.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
        '<polyline points="16 17 21 12 16 7"/>' +
        '<line x1="21" y1="12" x2="9" y2="12"/>' +
      '</svg>' +
      '<span>خروج</span>' +
      (m?.email ? '<span class="arsan-logout-email">' + m.email + '</span>' : '');
    fab.addEventListener('click', (e) => { e.preventDefault(); doLogout(fab); });
    document.body.appendChild(fab);
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

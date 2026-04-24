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

  async function doLogout(){
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    try {
      if (window.ArsanAPI?.logout) await window.ArsanAPI.logout();
      else if (window.API?.logout) await window.API.logout();
      else if (window.API_BASE) {
        const token = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token');
        if (token) {
          await fetch(window.API_BASE + '/api/logout', {
            method:'POST',
            headers:{ 'Authorization': 'Bearer ' + token },
          }).catch(()=>{});
        }
      }
    } catch(_){}
    try {
      localStorage.removeItem('arsan_token_v1');
      localStorage.removeItem('arsan_token');
      localStorage.removeItem('arsan_me_v1');
      localStorage.removeItem('arsan_me');
    } catch(_){}
    const onIndex = /index\.html?$|\/$/.test(location.pathname);
    if (onIndex) location.reload();
    else location.href = 'index.html';
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
    btn.addEventListener('click', doLogout);
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
    fab.addEventListener('click', doLogout);
    document.body.appendChild(fab);
  }

  function boot(){
    render();
    // Retry a few times — the dashboard injects its topbar after bootstrap,
    // which may run after this script.
    let tries = 0;
    const iv = setInterval(() => {
      render();
      if (++tries > 30) clearInterval(iv);
    }, 400);
    window.addEventListener('storage', render);
    window.addEventListener('arsan:login', render);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

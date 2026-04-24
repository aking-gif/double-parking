/* ================================================================
   Arsan Logout Button — floating logout visible to any logged-in user
   Appears on pages that don't already have it (e.g. index.html).
   Safe to include on dashboard.html too — it auto-hides if a logout
   button already exists in the topbar.
   ================================================================ */
(function(){
  if (window.__arsanLogoutBtnInit) return;
  window.__arsanLogoutBtnInit = true;

  function me(){
    try {
      return JSON.parse(localStorage.getItem('arsan_me_v1') || localStorage.getItem('arsan_me') || 'null');
    } catch(_){ return null; }
  }
  function loggedIn(){ const m = me(); return !!(m && m.email); }

  function injectStyles(){
    if (document.getElementById('arsan-logout-btn-styles')) return;
    const css = `
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
        border:1px solid rgba(139,45,60,.25);
        background:rgba(255,255,255,.9);
        backdrop-filter:blur(8px);
        color:#8b2d3c;
        font-size:13px;
        font-weight:600;
        font-family:inherit;
        cursor:pointer;
        box-shadow:0 2px 8px rgba(0,0,0,.08);
        transition:all .15s ease;
      }
      #arsan-logout-fab:hover{
        background:#8b2d3c;
        color:#fff;
        border-color:#8b2d3c;
        transform:translateY(-1px);
        box-shadow:0 4px 12px rgba(139,45,60,.25);
      }
      #arsan-logout-fab .arsan-logout-email{
        max-width:140px;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        font-weight:400;
        opacity:.75;
        font-size:11px;
        border-inline-start:1px solid currentColor;
        padding-inline-start:8px;
        margin-inline-start:2px;
      }
      html[data-theme="dark"] #arsan-logout-fab{
        background:rgba(40,35,30,.9);
        color:#e0a7af;
        border-color:rgba(224,167,175,.3);
      }
      html[data-theme="dark"] #arsan-logout-fab:hover{
        background:#8b2d3c;
        color:#fff;
      }
      @media (max-width: 640px){
        #arsan-logout-fab .arsan-logout-email{ display:none; }
      }
    `;
    const s = document.createElement('style');
    s.id = 'arsan-logout-btn-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function existingLogoutInTopbar(){
    // If dashboard's own topbar already has a logout button, skip this FAB.
    const btns = document.querySelectorAll('.arsan-topbar-btn, .topbar button, header button');
    for (const b of btns) {
      const t = (b.textContent || '').trim();
      if (/خروج|logout|log out/i.test(t)) return true;
    }
    return false;
  }

  async function doLogout(){
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    // Try API logout
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
    // Clear client state
    try {
      localStorage.removeItem('arsan_token_v1');
      localStorage.removeItem('arsan_token');
      localStorage.removeItem('arsan_me_v1');
      localStorage.removeItem('arsan_me');
    } catch(_){}
    // Go home
    const onIndex = /index\.html?$|\/$/.test(location.pathname);
    if (onIndex) location.reload();
    else location.href = 'index.html';
  }

  function render(){
    injectStyles();
    const old = document.getElementById('arsan-logout-fab');
    const logged = loggedIn();
    console.log('[logout-fab] render()  loggedIn=', logged, '  me=', me());
    if (!logged) {
      if (old) old.remove();
      return;
    }
    if (existingLogoutInTopbar()) {
      console.log('[logout-fab] topbar already has a logout — skipping FAB');
      if (old) old.remove();
      return;
    }
    if (old) return; // already rendered
    const m = me();
    const btn = document.createElement('button');
    btn.id = 'arsan-logout-fab';
    btn.type = 'button';
    btn.title = 'تسجيل الخروج';
    btn.innerHTML =
      '<span aria-hidden="true">🚪</span>' +
      '<span>خروج</span>' +
      '<span class="arsan-logout-email">' + (m?.email || '') + '</span>';
    btn.addEventListener('click', doLogout);
    document.body.appendChild(btn);
    console.log('[logout-fab] button injected ✓');
  }

  function boot(){
    render();
    // re-check periodically in case dashboard's topbar mounts later
    let tries = 0;
    const iv = setInterval(() => {
      render();
      if (++tries > 20) clearInterval(iv);
    }, 500);
    window.addEventListener('storage', render);
    window.addEventListener('arsan:login', render);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

/* ================================================================
   Arsan Quick Actions  —  Floating action button (speed-dial)
   ----------------------------------------------------------------
   Adds a prominent "+" button bottom-end that expands into:
     - ➕ إجراء جديد       → window.showNewSopModal()
     - 📥 استيراد إجراء     → window.showImportModal()
     - ⭐ المفضلة           → toggle favorites filter
   Only visible to logged-in users on dashboard.html (when a dept is open).
   ================================================================ */
(function(){
  if (window.__arsanQuickActionsInit) return;
  window.__arsanQuickActionsInit = true;

  function loggedIn(){
    try {
      const m = JSON.parse(localStorage.getItem('arsan_me_v1') || localStorage.getItem('arsan_me') || 'null');
      return !!(m && m.email);
    } catch(_){ return false; }
  }
  function inDeptPage(){
    return !!window.CURRENT_DEPT_ID;
  }

  function injectStyles(){
    if (document.getElementById('arsan-quick-actions-styles')) return;
    const css = `
      #arsan-qa{
        position:fixed;
        bottom:22px;
        inset-inline-end:22px;
        z-index:9500;
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        gap:10px;
      }
      #arsan-qa-menu{
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        gap:8px;
        opacity:0;
        transform:translateY(8px) scale(.96);
        pointer-events:none;
        transition:opacity .18s ease, transform .18s ease;
      }
      #arsan-qa.open #arsan-qa-menu{
        opacity:1;
        transform:translateY(0) scale(1);
        pointer-events:auto;
      }
      .arsan-qa-item{
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:9px 14px;
        border-radius:999px;
        border:1px solid rgba(0,0,0,.08);
        background:#ffffff;
        color:#2a2419;
        font:inherit;
        font-size:13px;
        font-weight:600;
        cursor:pointer;
        box-shadow:0 6px 18px rgba(0,0,0,.12);
        transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
      }
      .arsan-qa-item:hover{
        transform:translateY(-1px);
        background:#faf6ea;
        border-color:rgba(180,140,80,.4);
        box-shadow:0 8px 22px rgba(0,0,0,.15);
      }
      .arsan-qa-item .arsan-qa-ic{
        width:22px; height:22px;
        display:inline-flex; align-items:center; justify-content:center;
        font-size:15px;
      }

      #arsan-qa-fab{
        width:56px; height:56px;
        border-radius:50%;
        border:none;
        background:linear-gradient(135deg,#b48c50 0%,#8b2d3c 100%);
        color:#fff;
        font-size:28px;
        line-height:1;
        cursor:pointer;
        box-shadow:0 8px 24px rgba(139,45,60,.35), 0 2px 6px rgba(0,0,0,.12);
        transition:transform .18s ease, box-shadow .18s ease;
        display:inline-flex; align-items:center; justify-content:center;
      }
      #arsan-qa-fab:hover{
        transform:translateY(-2px) scale(1.04);
        box-shadow:0 12px 32px rgba(139,45,60,.45), 0 4px 10px rgba(0,0,0,.14);
      }
      #arsan-qa.open #arsan-qa-fab{
        transform:rotate(45deg);
        background:linear-gradient(135deg,#8b2d3c 0%,#5a1e28 100%);
      }

      html[data-theme="dark"] .arsan-qa-item{
        background:#2a2419;
        color:#f0ebdc;
        border-color:rgba(255,255,255,.08);
        box-shadow:0 6px 18px rgba(0,0,0,.4);
      }
      html[data-theme="dark"] .arsan-qa-item:hover{
        background:#3a3224;
        border-color:rgba(212,168,60,.35);
      }

      @media (max-width: 640px){
        #arsan-qa{ bottom:16px; inset-inline-end:16px; }
        #arsan-qa-fab{ width:52px; height:52px; font-size:26px; }
      }

      /* Hide when chat / modal overlays are open (avoid stacking) */
      body.arsan-modal-open #arsan-qa,
      body.arsan-chat-open  #arsan-qa{ display:none !important; }
    `;
    const s = document.createElement('style');
    s.id = 'arsan-quick-actions-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function canUseNewSop(){ return typeof window.showNewSopModal === 'function'; }
  function canUseImport(){ return typeof window.showImportModal  === 'function'; }

  function render(){
    const wantsFab = loggedIn() && inDeptPage() && (canUseNewSop() || canUseImport());
    const existing = document.getElementById('arsan-qa');
    if (!wantsFab) { if (existing) existing.remove(); return; }
    if (existing) return;

    injectStyles();

    const root = document.createElement('div');
    root.id = 'arsan-qa';

    // Menu
    const menu = document.createElement('div');
    menu.id = 'arsan-qa-menu';
    menu.setAttribute('role','menu');

    function addItem(icon, label, onClick){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'arsan-qa-item';
      b.setAttribute('role','menuitem');
      b.innerHTML = `<span class="arsan-qa-ic" aria-hidden="true">${icon}</span><span>${label}</span>`;
      b.addEventListener('click', () => {
        root.classList.remove('open');
        try { onClick(); } catch(e){ console.error('[qa]', e); }
      });
      menu.appendChild(b);
    }

    // === Section 1: Create ===
    if (canUseNewSop()) addItem('➕','إجراء جديد', () => window.showNewSopModal());
    if (canUseImport())  addItem('📥','استيراد إجراء', () => window.showImportModal());

    // === Section 2: Browse ===
    addSeparator();
    addItem('⭐','المفضلة', () => {
      if (window.ArsanFeatures?.showFavorites) window.ArsanFeatures.showFavorites();
      else {
        const chip = document.getElementById('arsan-fav-chip');
        const current = chip && chip.getAttribute('aria-pressed') === 'true';
        window.ArsanFavorites?.setFilter(!current);
      }
    });
    addItem('🕒','شوهد مؤخراً', () => window.ArsanFeatures?.showRecent?.());
    addItem('📊','الإحصائيات', () => window.ArsanFeatures?.showStats?.());

    // === Section 3: Tools ===
    addSeparator();
    addItem('🔍','بحث عام', () => window.ArsanFeatures?.openSearch?.() || window.ArsanCmdK?.open?.());
    addItem('🖨️','طباعة الإجراء', () => window.ArsanFeatures?.printCurrentSOP?.());
    addItem('⌨️','اختصارات لوحة المفاتيح', () => window.ArsanFeatures?.showShortcuts?.());

    function addSeparator(){
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;width:160px;background:rgba(61,90,128,.2);margin:2px 0;align-self:flex-end;';
      menu.appendChild(sep);
    }

    // FAB
    const fab = document.createElement('button');
    fab.id = 'arsan-qa-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label','إجراءات سريعة');
    fab.setAttribute('aria-haspopup','menu');
    fab.setAttribute('aria-expanded','false');
    fab.innerHTML = '+';
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = root.classList.toggle('open');
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // close on outside click / Esc
    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) {
        root.classList.remove('open');
        fab.setAttribute('aria-expanded','false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        root.classList.remove('open');
        fab.setAttribute('aria-expanded','false');
      }
    });

    root.appendChild(menu);
    root.appendChild(fab);
    document.body.appendChild(root);
  }

  function boot(){
    render();
    // poll briefly while dashboard wires up window.CURRENT_DEPT_ID / showNewSopModal
    let tries = 0;
    const iv = setInterval(() => {
      render();
      if (++tries > 30) clearInterval(iv);
    }, 400);
    window.addEventListener('storage', render);
    window.addEventListener('arsan:login', render);
    window.addEventListener('arsan:deptChanged', render);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

/* ================================================================
   Arsan Favorites  —  ⭐ مفضلة الإجراءات (per user, KV-backed)
   ----------------------------------------------------------------
   - Star button on every .card in the grid (auto-injected)
   - Star button inside the open SOP modal (card .arsan-sop-head)
   - Chip "⭐ المفضلة" in the phase filter bar
   - Optional "⭐" shortcut on index.html dept cards (pin a dept)
   Storage: Cloudflare Worker KV via /api/favorites  +  localStorage fallback
   ================================================================ */
(function(){
  if (window.ArsanFavorites) return;

  const LOCAL_KEY = 'arsan_favorites_v1';
  const DEPT_PIN_KEY = 'arsan_favorite_depts_v1';

  /* ---------- state ---------- */
  // set of strings "dept/code" for SOP favs
  let favSet = new Set();
  let deptFavSet = new Set();
  let filterOn = false;   // show only favorites
  let syncing = false;

  /* ---------- helpers ---------- */
  const key = (dept, code) => `${dept}/${code}`;
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch(_){ return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(_){} };

  function apiBase(){ return (window.API_BASE || '').replace(/\/$/,''); }
  function token(){ return localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token') || ''; }
  function me(){ try { return JSON.parse(localStorage.getItem('arsan_me_v1') || localStorage.getItem('arsan_me') || 'null'); } catch(_){ return null; } }
  function loggedIn(){ const m = me(); return !!(m && m.email); }

  async function apiCall(method, path, body){
    if (!apiBase() || !token()) throw new Error('no-backend');
    const res = await fetch(apiBase() + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('api-' + res.status));
    return data;
  }

  /* ---------- load ---------- */
  async function load(){
    // start from local
    const local = lsGet(LOCAL_KEY, []);
    favSet = new Set(local);
    deptFavSet = new Set(lsGet(DEPT_PIN_KEY, []));

    if (!loggedIn()) { render(); return; }
    try {
      const r = await apiCall('GET', '/api/favorites');
      const remote = Array.isArray(r.sops) ? r.sops : (r.favorites || []);
      const remoteDepts = Array.isArray(r.depts) ? r.depts : [];
      favSet = new Set(remote);
      deptFavSet = new Set(remoteDepts);
      lsSet(LOCAL_KEY, [...favSet]);
      lsSet(DEPT_PIN_KEY, [...deptFavSet]);
    } catch(e){
      // Worker may not have the endpoint yet — silently use local
      console.info('[Favorites] using local store (worker endpoint missing):', e.message);
    }
    render();
  }

  async function pushRemote(){
    if (!loggedIn() || syncing) return;
    syncing = true;
    try {
      await apiCall('PUT', '/api/favorites', { sops: [...favSet], depts: [...deptFavSet] });
    } catch(e){
      console.info('[Favorites] remote save failed, kept local:', e.message);
    } finally {
      syncing = false;
    }
  }

  /* ---------- public API ---------- */
  function isFav(dept, code){ return favSet.has(key(dept, code)); }
  function isDeptFav(deptId){ return deptFavSet.has(deptId); }
  function list(){ return [...favSet]; }

  async function toggle(dept, code){
    const k = key(dept, code);
    if (favSet.has(k)) favSet.delete(k); else favSet.add(k);
    lsSet(LOCAL_KEY, [...favSet]);
    render();
    pushRemote();
  }
  async function toggleDept(deptId){
    if (deptFavSet.has(deptId)) deptFavSet.delete(deptId); else deptFavSet.add(deptId);
    lsSet(DEPT_PIN_KEY, [...deptFavSet]);
    render();
    pushRemote();
  }

  function setFilter(on){
    filterOn = !!on;
    applyGridFilter();
    const chip = document.getElementById('arsan-fav-chip');
    if (chip) chip.setAttribute('aria-pressed', filterOn ? 'true' : 'false');
  }

  /* ---------- styles (once) ---------- */
  function injectStyles(){
    if (document.getElementById('arsan-fav-styles')) return;
    const css = `
      .arsan-fav-star{
        position:absolute; top:10px; inset-inline-start:10px;
        width:30px; height:30px; border-radius:50%;
        background:rgba(255,255,255,.85); backdrop-filter:blur(4px);
        border:1px solid rgba(0,0,0,.08); color:#b8a05e;
        display:inline-flex; align-items:center; justify-content:center;
        cursor:pointer; font-size:16px; line-height:1;
        transition:transform .15s ease, background .15s ease, color .15s ease;
        z-index:2; padding:0;
      }
      .arsan-fav-star:hover{ transform:scale(1.12); }
      .arsan-fav-star.is-fav{ color:#e0a41a; background:#fffbe9; border-color:#e9d07a; }
      .arsan-fav-star.is-fav::before{ content:"★"; }
      .arsan-fav-star:not(.is-fav)::before{ content:"☆"; }

      /* within the modal header */
      .arsan-fav-modal-btn{
        width:36px; height:36px; border-radius:50%;
        border:1px solid var(--line, #e5e1d8); background:var(--surface, #fff);
        color:#b8a05e; font-size:20px; cursor:pointer; line-height:1;
        display:inline-flex; align-items:center; justify-content:center;
        margin-inline-start:8px; transition:all .15s ease;
      }
      .arsan-fav-modal-btn:hover{ transform:scale(1.08); }
      .arsan-fav-modal-btn.is-fav{ color:#e0a41a; background:#fffbe9; border-color:#e9d07a; }
      .arsan-fav-modal-btn.is-fav::before{ content:"★"; }
      .arsan-fav-modal-btn:not(.is-fav)::before{ content:"☆"; }

      /* chip */
      #arsan-fav-chip{
        display:inline-flex; align-items:center; gap:6px;
      }
      #arsan-fav-chip[aria-pressed="true"]{
        background: linear-gradient(180deg,#fff6d6,#f5e4a0);
        border-color:#e0c352; color:#7a5a00;
      }

      /* dept card pin (index.html) */
      .arsan-deptpin{
        position:absolute; top:8px; inset-inline-start:8px;
        width:28px; height:28px; border-radius:50%;
        background:rgba(255,255,255,.85); border:1px solid rgba(0,0,0,.06);
        color:#b8a05e; font-size:15px; line-height:1; cursor:pointer;
        display:inline-flex; align-items:center; justify-content:center;
        z-index:3; padding:0;
      }
      .arsan-deptpin.is-fav{ color:#e0a41a; background:#fffbe9; border-color:#e9d07a; }
      .arsan-deptpin.is-fav::before{ content:"★"; }
      .arsan-deptpin:not(.is-fav)::before{ content:"☆"; }

      /* a card must be position:relative for the star to anchor */
      .card, .dept-card{ position:relative; }
    `;
    const s = document.createElement('style');
    s.id = 'arsan-fav-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------- inject stars into cards ---------- */
  function currentDept(){
    return window.CURRENT_DEPT_ID
      || (new URLSearchParams(location.search)).get('dept')
      || '';
  }

  function decorateCards(){
    const dept = currentDept();
    if (!dept) return;
    document.querySelectorAll('#grid .card').forEach(card => {
      if (card.querySelector('.arsan-fav-star')) {
        // keep state in sync (re-render replaces node, but guard anyway)
        const code = card.querySelector('.sop-code')?.textContent?.trim();
        const btn = card.querySelector('.arsan-fav-star');
        btn.classList.toggle('is-fav', isFav(dept, code));
        return;
      }
      const code = card.querySelector('.sop-code')?.textContent?.trim();
      if (!code) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'arsan-fav-star' + (isFav(dept, code) ? ' is-fav' : '');
      btn.setAttribute('aria-label', 'إضافة للمفضلة');
      btn.title = 'مفضلة';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(dept, code);
      });
      card.appendChild(btn);
    });
  }

  /* ---------- inject filter chip ---------- */
  function injectChip(){
    const chips = document.getElementById('chips');
    if (!chips) return;
    if (document.getElementById('arsan-fav-chip')) return;
    const b = document.createElement('button');
    b.id = 'arsan-fav-chip';
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<span>⭐ المفضلة</span><span class="count" id="arsan-fav-count">0</span>';
    b.addEventListener('click', () => setFilter(!filterOn));
    chips.appendChild(b);
    updateChipCount();
  }
  function updateChipCount(){
    const el = document.getElementById('arsan-fav-count');
    if (!el) return;
    const dept = currentDept();
    let n = 0;
    if (dept && Array.isArray(window.SOPS)) {
      window.SOPS.forEach(s => { if (isFav(dept, s.code)) n++; });
    }
    el.textContent = n;
  }

  /* ---------- filter grid (hides non-favs) ---------- */
  function applyGridFilter(){
    const dept = currentDept();
    document.querySelectorAll('#grid .card').forEach(card => {
      if (!filterOn) { card.style.display = ''; return; }
      const code = card.querySelector('.sop-code')?.textContent?.trim();
      card.style.display = isFav(dept, code) ? '' : 'none';
    });
  }

  /* ---------- inject into open SOP modal ---------- */
  function decorateModal(){
    const dept = currentDept();
    if (!dept) return;
    // The dashboard modal shows the code in #m-code (or similar). We search
    // for the first element with data-sop-code OR a .sop-code inside .arsan-modal/.modal.
    const modal = document.querySelector('.modal.open, .arsan-modal-backdrop.open, [data-sop-open]');
    if (!modal) return;
    if (modal.querySelector('.arsan-fav-modal-btn')) return;

    const codeEl = modal.querySelector('#m-code, .sop-code, [data-sop-code]');
    const code = codeEl?.textContent?.trim() || modal.getAttribute('data-sop-code');
    if (!code) return;

    // Find a reasonable place to drop it — prefer a header area
    const head = modal.querySelector('.modal-head, .arsan-sop-head, header, h2, .m-head') || modal.firstElementChild;
    if (!head) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'arsan-fav-modal-btn' + (isFav(dept, code) ? ' is-fav' : '');
    btn.title = 'مفضلة';
    btn.setAttribute('aria-label', 'إضافة للمفضلة');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle(dept, code);
      btn.classList.toggle('is-fav', isFav(dept, code));
    });
    head.appendChild(btn);
  }

  /* ---------- inject into dept cards on index.html ---------- */
  function decorateDeptCards(){
    document.querySelectorAll('.dept-card[data-id]').forEach(card => {
      if (card.querySelector('.arsan-deptpin')) return;
      const id = card.getAttribute('data-id');
      if (!id) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'arsan-deptpin' + (isDeptFav(id) ? ' is-fav' : '');
      btn.title = 'تثبيت في المفضلة';
      btn.setAttribute('aria-label', 'تثبيت');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleDept(id);
        btn.classList.toggle('is-fav', isDeptFav(id));
        // reorder: pinned first
        reorderDeptGrid();
      });
      card.appendChild(btn);
    });
    reorderDeptGrid();
  }
  function reorderDeptGrid(){
    const grid = document.getElementById('deptGrid') || document.querySelector('.dept-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.dept-card[data-id]')];
    cards
      .sort((a,b) => {
        const af = isDeptFav(a.getAttribute('data-id')) ? 0 : 1;
        const bf = isDeptFav(b.getAttribute('data-id')) ? 0 : 1;
        return af - bf;
      })
      .forEach(c => grid.appendChild(c));
  }

  /* ---------- master render ---------- */
  function render(){
    injectStyles();
    decorateCards();
    decorateDeptCards();
    decorateModal();
    injectChip();
    updateChipCount();
    applyGridFilter();
  }

  /* ---------- observe DOM to auto-decorate new cards / modals ---------- */
  function setupObserver(){
    const root = document.body;
    if (!root) return;
    const mo = new MutationObserver((muts) => {
      let touched = false;
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          if (n.matches?.('.card, .dept-card, .modal, .arsan-modal-backdrop') ||
              n.querySelector?.('.card, .dept-card, .modal, .arsan-modal-backdrop, #chips')) {
            touched = true; break;
          }
        }
        if (touched) break;
      }
      if (touched) {
        // debounce
        clearTimeout(setupObserver._t);
        setupObserver._t = setTimeout(render, 50);
      }
    });
    mo.observe(root, { childList: true, subtree: true });
  }

  /* ---------- boot ---------- */
  function boot(){
    injectStyles();
    setupObserver();
    load();
    // re-render on login (user changed)
    window.addEventListener('arsan:login', load);
    window.addEventListener('storage', (e) => {
      if (e.key === 'arsan_me_v1' || e.key === 'arsan_me') load();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ---------- expose ---------- */
  window.ArsanFavorites = {
    load, list, isFav, isDeptFav, toggle, toggleDept,
    setFilter, render,
  };
})();

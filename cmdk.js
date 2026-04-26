/* =====================================================================
   Arsann — Cmd+K Universal Search
   --------------------------------------------------------------------
   - Cmd+K (Mac) / Ctrl+K (Win) opens a global search palette
   - Searches: SOPs, Departments, Users, Pages
   - Keyboard navigation (↑↓ Enter Esc)
   - Recent searches in localStorage
   - Loads after ArsanAPI is available
   ===================================================================== */
(function(){
  if (window.__ArsanCmdK) return;
  window.__ArsanCmdK = true;

  const RECENT_KEY = 'arsan_cmdk_recent_v1';
  const MAX_RECENT = 5;

  /* ---------- Cache for SOPs (refreshed on open) ---------- */
  let cache = { sops: [], depts: [], users: [], ts: 0 };
  const CACHE_TTL = 60 * 1000; // 1 min

  async function refreshCache(force){
    const now = Date.now();
    if (!force && cache.ts && (now - cache.ts) < CACHE_TTL) return;
    try {
      if (!window.ArsanAPI || !window.ArsanAPI.hasBackend()) return;
      const data = await window.ArsanAPI.bootstrap();
      // SOPs
      const sops = [];
      if (data && data.sops && typeof data.sops === 'object') {
        for (const [deptId, list] of Object.entries(data.sops)) {
          if (!Array.isArray(list)) continue;
          for (const s of list) {
            sops.push({ ...s, deptId });
          }
        }
      }
      cache.sops = sops;
      // Departments — read from window.DEPARTMENTS_CONFIG if available
      const depts = [];
      if (window.DEPARTMENTS_CONFIG) {
        for (const [id, cfg] of Object.entries(window.DEPARTMENTS_CONFIG)) {
          depts.push({ id, name: cfg.name || id, icon: cfg.icon || '🏢' });
        }
      }
      // Add custom depts from data if present
      if (data && Array.isArray(data.customDepts)) {
        for (const d of data.customDepts) {
          if (!depts.find(x => x.id === d.id)) {
            depts.push({ id: d.id, name: d.name || d.id, icon: d.icon || '🏢' });
          }
        }
      }
      cache.depts = depts;
      // Users (admin only)
      if (window.ArsanAPI.isAdmin && window.ArsanAPI.isAdmin()) {
        try {
          const users = await window.ArsanAPI.getUsers();
          cache.users = Array.isArray(users) ? users : [];
        } catch(e) { cache.users = []; }
      }
      cache.ts = now;
    } catch(e) {
      console.warn('[CmdK] cache refresh failed', e);
    }
  }

  /* ---------- Recent searches ---------- */
  function getRecent(){
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
    catch { return []; }
  }
  function pushRecent(item){
    try {
      const cur = getRecent();
      const filtered = cur.filter(x => !(x.type === item.type && x.id === item.id));
      filtered.unshift(item);
      localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
    } catch{}
  }

  /* ---------- Fuzzy match score (simple) ---------- */
  function score(text, q){
    if (!text || !q) return 0;
    const t = String(text).toLowerCase();
    const query = q.toLowerCase().trim();
    if (!query) return 0;
    if (t === query) return 1000;
    if (t.startsWith(query)) return 500;
    if (t.includes(query)) return 200;
    // Word-level match
    const words = query.split(/\s+/);
    let matched = 0;
    for (const w of words) if (t.includes(w)) matched++;
    if (matched === words.length) return 100 + matched * 10;
    if (matched > 0) return 50 + matched * 5;
    return 0;
  }

  /* ---------- Search ---------- */
  function searchAll(q){
    if (!q || !q.trim()) return [];
    const results = [];
    // SOPs
    for (const s of cache.sops) {
      const sc = Math.max(
        score(s.title, q),
        score(s.code, q) * 1.2,
        score(s.purpose, q) * 0.5
      );
      if (sc > 0) {
        const dept = cache.depts.find(d => d.id === s.deptId);
        results.push({
          type: 'sop',
          id: s.code || s.id,
          title: s.title || s.code,
          subtitle: `${dept?.icon || '📋'} ${dept?.name || s.deptId} · ${s.code || ''}`,
          score: sc,
          action: () => {
            const url = `dashboard.html?dept=${encodeURIComponent(s.deptId)}#${encodeURIComponent(s.code || s.id || '')}`;
            window.location.href = url;
          }
        });
      }
    }
    // Departments
    for (const d of cache.depts) {
      const sc = Math.max(score(d.name, q), score(d.id, q) * 0.7);
      if (sc > 0) {
        results.push({
          type: 'dept',
          id: d.id,
          title: d.name,
          subtitle: `إدارة · ${d.id}`,
          icon: d.icon,
          score: sc + 50, // boost depts a bit
          action: () => {
            window.location.href = `dashboard.html?dept=${encodeURIComponent(d.id)}`;
          }
        });
      }
    }
    // Users
    for (const u of cache.users) {
      const sc = Math.max(score(u.email, q), score(u.name, q));
      if (sc > 0) {
        results.push({
          type: 'user',
          id: u.email,
          title: u.name || u.email,
          subtitle: `👤 ${u.email}${u.role ? ` · ${u.role}` : ''}`,
          score: sc,
          action: () => { window.location.href = 'users.html'; }
        });
      }
    }
    // Pages
    const pages = [
      { id: 'home',      title: 'الصفحة الرئيسية',     subtitle: '🏠 الإدارات', url: 'index.html' },
      { id: 'people',    title: 'الفريق',                subtitle: '👥 صفحة الفريق', url: 'people.html' },
      { id: 'profile',   title: 'ملفي الشخصي',          subtitle: '👤 الإعدادات الشخصية', url: 'profile.html' },
      { id: 'users',     title: 'إدارة المستخدمين',     subtitle: '🛡️ للأدمن فقط', url: 'users.html', adminOnly: true },
    ];
    for (const p of pages) {
      if (p.adminOnly && !(window.ArsanAPI?.isAdmin?.())) continue;
      const sc = score(p.title, q);
      if (sc > 0) {
        results.push({
          type: 'page',
          id: p.id,
          title: p.title,
          subtitle: p.subtitle,
          score: sc - 20,
          action: () => { window.location.href = p.url; }
        });
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 12);
  }

  /* ---------- UI ---------- */
  let palette, input, listEl, isOpen = false, activeIdx = 0, currentResults = [];

  function injectStyles(){
    if (document.getElementById('arsan-cmdk-style')) return;
    const s = document.createElement('style');
    s.id = 'arsan-cmdk-style';
    s.textContent = `
      .arsan-cmdk-bd{
        position:fixed; inset:0;
        background:rgba(15,12,8,.62);
        backdrop-filter:blur(8px);
        -webkit-backdrop-filter:blur(8px);
        z-index:99800;
        display:none;
        align-items:flex-start; justify-content:center;
        padding-top:14vh;
        font-family:"IBM Plex Sans Arabic","Cairo",system-ui,sans-serif;
        animation:arsanCmdkFade .14s ease-out;
      }
      .arsan-cmdk-bd.is-open{ display:flex; }
      @keyframes arsanCmdkFade{from{opacity:0}to{opacity:1}}
      .arsan-cmdk{
        width:min(640px, 92vw);
        background:linear-gradient(180deg, rgba(28,22,15,.96), rgba(35,27,18,.94));
        border:1px solid rgba(212,178,74,.28);
        border-radius:16px;
        box-shadow:0 30px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(212,178,74,.08);
        overflow:hidden;
        direction:rtl;
        animation:arsanCmdkPop .18s cubic-bezier(.4,.6,.3,1.2);
      }
      [data-theme="light"] .arsan-cmdk{
        background:linear-gradient(180deg,#fffaee,#fff5e0);
        border-color:rgba(133,113,77,.32);
      }
      @keyframes arsanCmdkPop{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:none}}
      .arsan-cmdk-search{
        display:flex; align-items:center; gap:12px;
        padding:14px 18px;
        border-bottom:1px solid rgba(212,178,74,.18);
      }
      [data-theme="light"] .arsan-cmdk-search{ border-color:rgba(133,113,77,.18); }
      .arsan-cmdk-search svg{ width:20px;height:20px;color:#c9a85a;flex-shrink:0; }
      .arsan-cmdk-search input{
        flex:1; background:transparent; border:none; outline:none;
        font-size:16px; font-family:inherit; color:#f3e9c9;
        padding:4px 0;
      }
      [data-theme="light"] .arsan-cmdk-search input{ color:#2b2416; }
      .arsan-cmdk-search input::placeholder{ color:rgba(212,178,74,.45); }
      .arsan-cmdk-kbd{
        font-size:10px; padding:3px 7px; border-radius:5px;
        background:rgba(212,178,74,.14); color:#c9a85a;
        font-family:ui-monospace,monospace; letter-spacing:.5px;
        border:1px solid rgba(212,178,74,.22);
      }
      .arsan-cmdk-list{
        max-height:50vh; overflow-y:auto; padding:8px;
      }
      .arsan-cmdk-section{
        font-size:11px; font-weight:700; color:rgba(212,178,74,.65);
        padding:8px 12px 6px; letter-spacing:.5px;
        text-transform:uppercase;
      }
      .arsan-cmdk-item{
        display:flex; align-items:center; gap:12px;
        padding:10px 12px; border-radius:9px;
        cursor:pointer; user-select:none;
        color:#e8dfc6;
        transition:background .08s;
      }
      [data-theme="light"] .arsan-cmdk-item{ color:#2b2416; }
      .arsan-cmdk-item.active,
      .arsan-cmdk-item:hover{
        background:linear-gradient(90deg, rgba(212,178,74,.18), rgba(212,178,74,.08));
      }
      [data-theme="light"] .arsan-cmdk-item.active,
      [data-theme="light"] .arsan-cmdk-item:hover{
        background:linear-gradient(90deg, rgba(212,178,74,.22), rgba(212,178,74,.10));
      }
      .arsan-cmdk-item .icon{
        width:32px; height:32px; border-radius:8px;
        display:flex;align-items:center;justify-content:center;
        background:rgba(212,178,74,.12);
        font-size:16px; flex-shrink:0;
      }
      .arsan-cmdk-item .body{ flex:1; min-width:0; }
      .arsan-cmdk-item .ttl{
        font-size:14px; font-weight:600; line-height:1.3;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      .arsan-cmdk-item .sub{
        font-size:11.5px; opacity:.65; margin-top:2px;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      .arsan-cmdk-item .type-tag{
        font-size:10px; padding:2px 7px; border-radius:5px;
        background:rgba(212,178,74,.18); color:#c9a85a;
        flex-shrink:0; letter-spacing:.3px;
      }
      .arsan-cmdk-empty{
        padding:32px 18px; text-align:center;
        color:rgba(212,178,74,.55); font-size:13px;
      }
      .arsan-cmdk-foot{
        display:flex; justify-content:space-between; align-items:center;
        padding:8px 16px;
        border-top:1px solid rgba(212,178,74,.15);
        font-size:11px; color:rgba(212,178,74,.55);
      }
      [data-theme="light"] .arsan-cmdk-foot{ border-color:rgba(133,113,77,.15); color:rgba(90,70,30,.55); }
      .arsan-cmdk-foot .keys{ display:flex; gap:10px; }
      .arsan-cmdk-foot .keys span{ display:inline-flex; align-items:center; gap:4px; }
      .arsan-cmdk-foot kbd{
        font-size:10px; padding:1px 5px; border-radius:3px;
        background:rgba(212,178,74,.12); border:1px solid rgba(212,178,74,.2);
        font-family:ui-monospace,monospace; color:inherit;
      }
    `;
    document.head.appendChild(s);
  }

  function buildPalette(){
    if (palette) return;
    injectStyles();
    palette = document.createElement('div');
    palette.className = 'arsan-cmdk-bd';
    palette.innerHTML = `
      <div class="arsan-cmdk" role="dialog" aria-label="بحث شامل">
        <div class="arsan-cmdk-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="ابحث عن إجراء، إدارة، شخص…" autocomplete="off" spellcheck="false"/>
          <span class="arsan-cmdk-kbd">ESC</span>
        </div>
        <div class="arsan-cmdk-list" role="listbox"></div>
        <div class="arsan-cmdk-foot">
          <span>منصة أرسان</span>
          <span class="keys">
            <span><kbd>↑</kbd><kbd>↓</kbd> تنقّل</span>
            <span><kbd>Enter</kbd> فتح</span>
          </span>
        </div>
      </div>
    `;
    document.body.appendChild(palette);
    input = palette.querySelector('input');
    listEl = palette.querySelector('.arsan-cmdk-list');
    // Click backdrop to close
    palette.addEventListener('click', (e) => {
      if (e.target === palette) close();
    });
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeyDown);
  }

  function render(results, header){
    listEl.innerHTML = '';
    if (!results.length) {
      const q = input.value.trim();
      if (header) {
        listEl.innerHTML = `
          <div class="arsan-cmdk-section">${header}</div>
          <div class="arsan-cmdk-empty">${q ? 'لا توجد نتائج' : 'ابدأ الكتابة للبحث…'}</div>
        `;
      } else {
        listEl.innerHTML = `<div class="arsan-cmdk-empty">${q ? 'لا توجد نتائج' : 'ابدأ الكتابة للبحث…'}</div>`;
      }
      return;
    }
    const frag = document.createDocumentFragment();
    if (header) {
      const h = document.createElement('div');
      h.className = 'arsan-cmdk-section';
      h.textContent = header;
      frag.appendChild(h);
    }
    const typeLabels = { sop:'إجراء', dept:'إدارة', user:'مستخدم', page:'صفحة' };
    const typeIcons  = { sop:'📋', dept:'🏢', user:'👤', page:'📄' };
    results.forEach((r, i) => {
      const it = document.createElement('div');
      it.className = 'arsan-cmdk-item' + (i === activeIdx ? ' active' : '');
      it.setAttribute('role','option');
      it.dataset.idx = i;
      it.innerHTML = `
        <div class="icon">${r.icon || typeIcons[r.type] || '•'}</div>
        <div class="body">
          <div class="ttl"></div>
          <div class="sub"></div>
        </div>
        <div class="type-tag">${typeLabels[r.type] || r.type}</div>
      `;
      it.querySelector('.ttl').textContent = r.title || '';
      it.querySelector('.sub').textContent = r.subtitle || '';
      it.addEventListener('click', () => choose(i));
      it.addEventListener('mouseenter', () => { activeIdx = i; updateActive(); });
      frag.appendChild(it);
    });
    listEl.appendChild(frag);
  }

  function updateActive(){
    listEl.querySelectorAll('.arsan-cmdk-item').forEach((el, i) => {
      el.classList.toggle('active', i === activeIdx);
    });
    const el = listEl.querySelector('.arsan-cmdk-item.active');
    if (el) el.scrollIntoView({ block:'nearest' });
  }

  function onInput(){
    const q = input.value;
    if (!q.trim()) {
      // Show recent
      const rec = getRecent();
      currentResults = rec;
      activeIdx = 0;
      render(rec, rec.length ? 'الأخيرة' : null);
      return;
    }
    currentResults = searchAll(q);
    activeIdx = 0;
    render(currentResults);
  }

  function onKeyDown(e){
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentResults.length) {
        activeIdx = (activeIdx + 1) % currentResults.length;
        updateActive();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentResults.length) {
        activeIdx = (activeIdx - 1 + currentResults.length) % currentResults.length;
        updateActive();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentResults[activeIdx]) choose(activeIdx);
    }
  }

  function choose(i){
    const r = currentResults[i];
    if (!r) return;
    pushRecent({ type: r.type, id: r.id, title: r.title, subtitle: r.subtitle, icon: r.icon });
    close();
    setTimeout(() => { try { r.action(); } catch(e){ console.warn(e); } }, 30);
  }

  async function open(){
    buildPalette();
    isOpen = true;
    palette.classList.add('is-open');
    input.value = '';
    activeIdx = 0;
    // Show recent immediately, refresh in background
    const rec = getRecent();
    currentResults = rec;
    render(rec, rec.length ? 'الأخيرة' : null);
    setTimeout(() => input.focus(), 30);
    await refreshCache();
  }

  function close(){
    if (!palette) return;
    isOpen = false;
    palette.classList.remove('is-open');
  }

  function toggleGlobal(e){
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      isOpen ? close() : open();
    }
  }

  document.addEventListener('keydown', toggleGlobal);

  // Expose
  window.ArsanCmdK = { open, close };
})();

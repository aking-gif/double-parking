/* =================================================================
   Notifications Center — Universal Notification Panel for Arsann OS
   Sources: tasks_v1, sops_v1, announcements_v1, meetings_v1, mentions
   Storage: notifications_v1 (read state) + sse stream future
   ================================================================= */
(function(){
  if (window.__notifCenterLoaded) return;
  window.__notifCenterLoaded = true;

  const API = window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const TOK_KEYS = ['arsan_token_v1','arsan_token'];
  const getTok = () => { for (const k of TOK_KEYS){ const v = localStorage.getItem(k); if (v) return v; } return ''; };
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me') || 'null'); } catch { return null; } };

  const READ_KEY = 'arsan_notif_read_v1';
  const getRead = () => { try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); } };
  const saveRead = (set) => localStorage.setItem(READ_KEY, JSON.stringify([...set]));

  // ===== Styles =====
  const css = `
  .nc-bell{
    position: relative; width: 36px; height: 36px; border-radius: 10px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,.85); transition: all .15s;
  }
  .nc-bell:hover{ background: rgba(255,255,255,.08); color: #fff }
  .nc-bell svg{ width: 18px; height: 18px; stroke-width: 1.8 }
  .nc-bell .nc-badge{
    position: absolute; top: -3px; right: -3px;
    min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px;
    background: #E85060; color: #fff; font-size: 9.5px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #14161c; font-family: 'IBM Plex Mono', monospace;
    transform: scale(0); transition: transform .2s cubic-bezier(.2,.9,.3,1.4);
  }
  .nc-bell .nc-badge.show{ transform: scale(1) }

  .nc-panel{
    position: fixed; top: 64px; right: 16px; z-index: 9997;
    width: 380px; max-height: calc(100vh - 90px);
    background: rgba(20,22,28,.92); backdrop-filter: blur(40px) saturate(140%);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04) inset;
    display: flex; flex-direction: column; overflow: hidden;
    transform: translateY(-8px) scale(.96); opacity: 0; pointer-events: none;
    transform-origin: top right;
    transition: transform .2s cubic-bezier(.2,.9,.3,1.4), opacity .15s;
    font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif;
  }
  [dir="rtl"] .nc-panel{ right: auto; left: 16px; transform-origin: top left }
  .nc-panel.open{ transform: translateY(0) scale(1); opacity: 1; pointer-events: auto }

  .nc-head{
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .nc-title{ font-size: 14px; font-weight: 600; color: #fff }
  .nc-actions{ display: flex; gap: 6px }
  .nc-act{
    background: transparent; border: none; padding: 4px 8px; font-size: 11px;
    color: rgba(255,255,255,.5); cursor: pointer; border-radius: 5px;
    font-family: inherit; transition: all .15s;
  }
  .nc-act:hover{ background: rgba(255,255,255,.06); color: #fff }

  .nc-tabs{
    display: flex; padding: 0 8px; border-bottom: 1px solid rgba(255,255,255,.06);
    gap: 2px;
  }
  .nc-tab{
    background: transparent; border: none; padding: 10px 12px; font-size: 12px;
    color: rgba(255,255,255,.55); cursor: pointer;
    font-family: inherit; transition: all .15s;
    border-bottom: 2px solid transparent;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .nc-tab:hover{ color: #fff }
  .nc-tab.active{ color: #E8A860; border-bottom-color: #E8A860 }
  .nc-tab .count{
    font-size: 10px; padding: 1px 6px; border-radius: 8px;
    background: rgba(255,255,255,.08); font-family: 'IBM Plex Mono', monospace;
  }
  .nc-tab.active .count{ background: rgba(232,168,96,.18); color: #E8A860 }

  .nc-list{
    flex: 1; overflow-y: auto; padding: 6px 0;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent;
  }
  .nc-list::-webkit-scrollbar{ width: 6px }
  .nc-list::-webkit-scrollbar-thumb{ background: rgba(255,255,255,.15); border-radius: 3px }

  .nc-item{
    display: flex; gap: 10px; padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,.04);
    cursor: pointer; transition: background .15s;
    position: relative;
  }
  .nc-item:hover{ background: rgba(255,255,255,.03) }
  .nc-item.unread::before{
    content: ''; position: absolute; right: 8px; top: 18px;
    width: 6px; height: 6px; border-radius: 50%; background: #60A0E8;
    box-shadow: 0 0 8px rgba(96,160,232,.6);
  }
  [dir="rtl"] .nc-item.unread::before{ right: auto; left: 8px }
  .nc-item .nc-icon{
    flex: 0 0 32px; width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,.05);
  }
  .nc-item .nc-icon svg{ width: 14px; height: 14px; stroke-width: 2 }
  .nc-icon.task{ background: rgba(96,160,232,.15); color: #87C0FF }
  .nc-icon.sop{ background: rgba(232,168,96,.15); color: #E8A860 }
  .nc-icon.meeting{ background: rgba(168,232,168,.15); color: #87E0A8 }
  .nc-icon.announce{ background: rgba(232,96,160,.15); color: #FF87C0 }
  .nc-icon.mention{ background: rgba(168,128,232,.15); color: #C087FF }
  .nc-icon.approval{ background: rgba(232,200,96,.15); color: #FFD060 }

  .nc-body{ flex: 1; min-width: 0 }
  .nc-text{ font-size: 13px; color: rgba(255,255,255,.9); line-height: 1.45; margin-bottom: 4px }
  .nc-text .actor{ font-weight: 600; color: #E8A860 }
  .nc-text .target{ color: #87C0FF }
  .nc-meta{ font-size: 11px; color: rgba(255,255,255,.4); font-family: 'IBM Plex Mono', monospace; display: flex; gap: 8px }
  .nc-meta .time::before{ content: '· '; opacity: .5 }
  .nc-meta .time:first-child::before{ content: '' }

  .nc-empty{
    padding: 60px 20px; text-align: center; color: rgba(255,255,255,.4);
    font-size: 13px;
  }
  .nc-empty svg{ width: 48px; height: 48px; opacity: .25; margin-bottom: 12px }

  .nc-foot{
    padding: 10px 16px; border-top: 1px solid rgba(255,255,255,.06);
    text-align: center;
  }
  .nc-foot a{
    font-size: 12px; color: rgba(255,255,255,.6); text-decoration: none;
    transition: color .15s;
  }
  .nc-foot a:hover{ color: #E8A860 }

  .nc-overlay{
    position: fixed; inset: 0; z-index: 9996; background: transparent;
    display: none;
  }
  .nc-overlay.open{ display: block }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ===== Build DOM =====
  const overlay = document.createElement('div');
  overlay.className = 'nc-overlay';
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.className = 'nc-panel';
  panel.innerHTML = `
    <div class="nc-head">
      <div class="nc-title">الإشعارات</div>
      <div class="nc-actions">
        <button class="nc-act" id="ncMarkAll">قراءة الكل</button>
        <button class="nc-act" id="ncSettings">⚙</button>
      </div>
    </div>
    <div class="nc-tabs">
      <button class="nc-tab active" data-tab="all">الكل <span class="count" id="cntAll">0</span></button>
      <button class="nc-tab" data-tab="mentions">إشارات <span class="count" id="cntMentions">0</span></button>
      <button class="nc-tab" data-tab="approvals">اعتمادات <span class="count" id="cntApprovals">0</span></button>
      <button class="nc-tab" data-tab="updates">تحديثات <span class="count" id="cntUpdates">0</span></button>
    </div>
    <div class="nc-list" id="ncList"></div>
    <div class="nc-foot"><a href="#" id="ncViewAll">عرض كل النشاطات</a></div>
  `;
  document.body.appendChild(panel);

  // ===== State =====
  let notifications = [];
  let activeTab = 'all';
  let bell = null;

  // ===== Find or create bell =====
  function findBell(){
    // Try to find existing bell in topbar
    const candidates = document.querySelectorAll('[id*="bell" i], [class*="bell" i], [class*="notif" i]');
    for (const c of candidates){
      if (c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE' && c.offsetParent !== null){
        return c;
      }
    }
    return null;
  }

  function createFloatingBell(){
    const fb = document.createElement('button');
    fb.className = 'nc-bell';
    fb.id = 'ncBellFloating';
    fb.style.cssText = 'position:fixed;top:14px;right:64px;z-index:9995';
    if (document.documentElement.dir === 'rtl' || document.body.dir === 'rtl'){
      fb.style.right = 'auto';
      fb.style.left = '64px';
    }
    fb.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span class="nc-badge" id="ncBadge">0</span>
    `;
    document.body.appendChild(fb);
    return fb;
  }

  // ===== Mock notifications until backend supports it =====
  // Aggregates from existing endpoints
  async function loadNotifications(){
    const tok = getTok();
    const headers = tok ? { 'Authorization': 'Bearer ' + tok } : {};
    const out = [];

    // 1. Recent tasks assigned to me
    try {
      const r = await fetch(API + '/api/tasks', { headers });
      if (r.ok){
        const tasks = await r.json();
        const myEmail = me()?.email;
        (Array.isArray(tasks) ? tasks : []).slice(0, 20).forEach(t => {
          if (t.assignee === myEmail || (!t.assignee && t.createdBy !== myEmail)){
            out.push({
              id: 'task_' + t.id,
              type: 'task',
              icon: 'task',
              text: `<span class="actor">${t.createdBy?.split('@')[0] || 'النظام'}</span> كلّفك بـ <span class="target">${t.title}</span>`,
              time: t.createdAt || Date.now(),
              link: 'spine.html#tasks/' + t.id,
              priority: t.priority,
            });
          }
        });
      }
    } catch {}

    // 2. Recent announcements
    try {
      const r = await fetch(API + '/api/announcements', { headers });
      if (r.ok){
        const items = await r.json();
        (Array.isArray(items) ? items : []).slice(0, 10).forEach(a => {
          out.push({
            id: 'ann_' + a.id,
            type: 'announce',
            icon: 'announce',
            text: `إعلان جديد: <span class="target">${a.title || a.text?.slice(0,60) || 'إعلان'}</span>`,
            time: a.createdAt || a.ts || Date.now(),
            link: 'announcements.html',
          });
        });
      }
    } catch {}

    // 3. Recent SOP updates
    try {
      const r = await fetch(API + '/api/kv/sops_v1', { headers });
      if (r.ok){
        const sops = await r.json();
        const list = Array.isArray(sops) ? sops : Object.values(sops || {});
        list.filter(s => s && s.updatedAt).sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0)).slice(0, 5).forEach(s => {
          out.push({
            id: 'sop_' + s.id,
            type: 'sop',
            icon: 'sop',
            text: `تحديث على إجراء <span class="target">${s.title || s.code}</span>`,
            time: s.updatedAt,
            link: 'dashboard.html?dept=' + (s.dept || ''),
          });
        });
      }
    } catch {}

    // 4. Mentions from inbox (look for @me)
    try {
      const r = await fetch(API + '/api/kv/inbox_v1', { headers });
      if (r.ok){
        const inbox = await r.json();
        const myEmail = me()?.email;
        const myName = myEmail?.split('@')[0];
        (Array.isArray(inbox) ? inbox : []).slice(0, 30).forEach(item => {
          if (myName && (item.description || '').includes('@' + myName)){
            out.push({
              id: 'men_' + item.id,
              type: 'mention',
              icon: 'mention',
              text: `أشار إليك في <span class="target">${item.title}</span>`,
              time: item.createdAt,
              link: 'spine.html',
            });
          }
        });
      }
    } catch {}

    notifications = out.sort((a,b) => (b.time||0) - (a.time||0));
    render();
  }

  // ===== Render =====
  function fmtTime(ts){
    if (!ts) return '';
    const d = Date.now() - ts;
    if (d < 60000) return 'الآن';
    if (d < 3600000) return Math.floor(d/60000) + ' د';
    if (d < 86400000) return Math.floor(d/3600000) + ' س';
    if (d < 604800000) return Math.floor(d/86400000) + ' يوم';
    return new Date(ts).toLocaleDateString('ar-SA', { month:'short', day:'numeric' });
  }

  const ICONS = {
    task:     '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    sop:      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    meeting:  '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    announce: '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    mention:  '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9"/>',
    approval: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  };

  function filterByTab(items){
    if (activeTab === 'all') return items;
    if (activeTab === 'mentions') return items.filter(i => i.type === 'mention');
    if (activeTab === 'approvals') return items.filter(i => i.type === 'approval');
    if (activeTab === 'updates') return items.filter(i => i.type === 'sop' || i.type === 'announce');
    return items;
  }

  function render(){
    const read = getRead();
    const filtered = filterByTab(notifications);
    const list = document.getElementById('ncList');

    // Counts
    document.getElementById('cntAll').textContent = notifications.length;
    document.getElementById('cntMentions').textContent = notifications.filter(n => n.type === 'mention').length;
    document.getElementById('cntApprovals').textContent = notifications.filter(n => n.type === 'approval').length;
    document.getElementById('cntUpdates').textContent = notifications.filter(n => n.type === 'sop' || n.type === 'announce').length;

    // Badge
    const unread = notifications.filter(n => !read.has(n.id)).length;
    const badges = document.querySelectorAll('.nc-badge');
    badges.forEach(b => {
      b.textContent = unread > 99 ? '99+' : unread;
      b.classList.toggle('show', unread > 0);
    });

    if (filtered.length === 0){
      list.innerHTML = `
        <div class="nc-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          </svg>
          <div>لا توجد إشعارات</div>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(n => `
      <div class="nc-item ${read.has(n.id)?'':'unread'}" data-id="${n.id}" data-link="${n.link||''}">
        <div class="nc-icon ${n.icon}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICONS[n.icon]||ICONS.task}</svg>
        </div>
        <div class="nc-body">
          <div class="nc-text">${n.text}</div>
          <div class="nc-meta">
            <span class="time">${fmtTime(n.time)}</span>
            ${n.priority ? `<span>· ${n.priority==='urgent'?'⚠ عاجلة':n.priority==='high'?'عالية':''}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // ===== Open / Close =====
  function open(){
    panel.classList.add('open');
    overlay.classList.add('open');
    loadNotifications();
  }
  function close(){
    panel.classList.remove('open');
    overlay.classList.remove('open');
  }
  function toggle(){ panel.classList.contains('open') ? close() : open(); }

  overlay.addEventListener('click', close);

  // ===== Item click =====
  document.getElementById('ncList').addEventListener('click', (e) => {
    const item = e.target.closest('.nc-item');
    if (!item) return;
    const read = getRead();
    read.add(item.dataset.id);
    saveRead(read);
    item.classList.remove('unread');
    render();
    if (item.dataset.link){
      close();
      // Anchor links navigate
      if (item.dataset.link.startsWith('#') || item.dataset.link.includes('.html')){
        location.href = item.dataset.link;
      }
    }
  });

  // ===== Tabs =====
  panel.querySelectorAll('.nc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      panel.querySelectorAll('.nc-tab').forEach(t => t.classList.toggle('active', t === tab));
      render();
    });
  });

  // ===== Mark all =====
  document.getElementById('ncMarkAll').addEventListener('click', () => {
    const read = getRead();
    notifications.forEach(n => read.add(n.id));
    saveRead(read);
    render();
  });

  // ===== Init bell =====
  function attachBell(){
    bell = findBell() || createFloatingBell();

    // If we found an existing bell, add badge to it
    if (bell.id !== 'ncBellFloating' && !bell.querySelector('.nc-badge')){
      const badge = document.createElement('span');
      badge.className = 'nc-badge';
      badge.style.cssText = 'position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#E85060;color:#fff;font-size:9.5px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #14161c;font-family:IBM Plex Mono,monospace;transform:scale(0);transition:transform .2s';
      bell.style.position = bell.style.position || 'relative';
      bell.appendChild(badge);
    }

    bell.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }, true);
  }

  // Wait for DOM
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => { attachBell(); loadNotifications(); });
  } else {
    setTimeout(() => { attachBell(); loadNotifications(); }, 100);
  }

  // Auto-refresh every 60s
  setInterval(loadNotifications, 60000);

  // ===== Public API =====
  window.NotificationCenter = { open, close, toggle, refresh: loadNotifications };
})();

/* Arsan Notifications + Announcements
 * - Bell icon in sidebar header with unread badge
 * - Click opens a glass panel listing announcements + SOP updates
 * - Admin composer tab (injected into admin panel)
 * Storage: backend if window.ArsanAPI has endpoints, else localStorage.
 */
(function(){
  'use strict';

  const STORE_KEY = 'arsan_announcements_v1';
  const READ_KEY  = 'arsan_notif_read_v1';

  function getAPI(){ return window.ArsanAPI || null; }
  function hasBackend(){ return !!(getAPI() && getAPI().hasBackend && getAPI().hasBackend()); }
  function me(){ return (getAPI() && getAPI().me) ? getAPI().me() : { email:'', role:'guest' }; }
  function isAdmin(){ const u = me(); return u && (u.role === 'admin' || u.email === 'a.king@arsann.com'); }

  function lang(){ return (localStorage.getItem('arsan_lang') || 'ar'); }
  function t(ar, en){ return lang() === 'en' ? en : ar; }

  // ============ Storage ============
  // Normalize announcements from mixed sources (backend uses text/kind,
  // local/composer uses body/priority). This is why items sometimes looked
  // blank — the renderer reads body/priority, but backend responses were
  // returning text/kind only.
  function normalizeAnn(a){
    if (!a || typeof a !== 'object') return null;
    const kind = a.priority || a.kind || 'normal';
    return {
      id: a.id || ('a-' + (a.ts || Date.now()) + '-' + Math.random().toString(36).slice(2,6)),
      ts: a.ts || Date.now(),
      author: a.author || '',
      title: a.title || '',
      body: a.body || a.text || '',
      priority: kind === 'urgent' || kind === 'warn' || kind === 'success' ? kind : 'normal',
    };
  }
  async function loadAnnouncements(){
    let list = null;
    if (hasBackend() && getAPI().getAnnouncements) {
      try { list = await getAPI().getAnnouncements(); } catch(_){ list = null; }
    }
    if (!Array.isArray(list)) {
      try { list = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
      catch(_){ list = []; }
    }
    // Always normalize so renderers see the same shape no matter the source.
    return list.map(normalizeAnn).filter(Boolean);
  }
  async function saveAnnouncement(a){
    if (hasBackend() && getAPI().addAnnouncement) {
      try {
        const saved = await getAPI().addAnnouncement(a);
        return normalizeAnn(saved || a);
      } catch(_){}
    }
    const list = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    list.unshift(a);
    localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 50)));
    return a;
  }
  async function removeAnnouncement(id){
    if (hasBackend() && getAPI().deleteAnnouncement) {
      try { return await getAPI().deleteAnnouncement(id); } catch(_){}
    }
    const list = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    const next = list.filter(x => x.id !== id);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }

  function getReadIds(){
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
    catch(_){ return new Set(); }
  }
  function setReadIds(set){
    localStorage.setItem(READ_KEY, JSON.stringify([...set]));
  }
  function markAllRead(list){
    const s = new Set(list.map(a => a.id));
    setReadIds(s);
    updateBadge();
  }

  // ============ Styles ============
  function injectStyles(){
    if (document.getElementById('arsan-notif-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-notif-styles';
    s.textContent = `
      #arsan-notif-bell-host{
        position:fixed;
        top:16px;
        /* RTL default: sidebar FAB is on the right → bell on the left */
        inset-inline-start:16px;
        inset-inline-end:auto;
        z-index:9100;
      }
      html[dir="ltr"] #arsan-notif-bell-host{
        inset-inline-start:auto;
        inset-inline-end:16px;
      }
      .arsan-notif-btn{
        position:relative;
        width:44px;height:44px;border-radius:12px;
        display:grid;place-items:center;
        background:rgba(26,21,16,.75);
        backdrop-filter:blur(16px) saturate(180%);
        -webkit-backdrop-filter:blur(16px) saturate(180%);
        border:1px solid rgba(133,113,77,.3);
        color:#f3e9c9;
        cursor:pointer;
        box-shadow:0 4px 16px rgba(0,0,0,.25);
        transition:background .15s, border-color .15s, transform .15s;
      }
      html[data-theme="light"] .arsan-notif-btn{
        background:rgba(255,255,255,.75);
        color:#3a2f15;
        border-color:rgba(133,113,77,.35);
      }
      .arsan-notif-btn:hover{
        background:rgba(133,113,77,.2);
        border-color:rgba(133,113,77,.6);
        transform:translateY(-1px);
      }
      .arsan-notif-btn svg{ width:20px;height:20px; }
      .arsan-notif-btn .badge{
        position:absolute; top:-5px; inset-inline-end:-5px;
        min-width:18px; height:18px; padding:0 5px;
        border-radius:999px;
        background:#e63946; color:#fff;
        font-size:10px; font-weight:700;
        display:none; align-items:center; justify-content:center;
        box-shadow:0 0 0 2px #1a1510;
      }
      html[data-theme="light"] .arsan-notif-btn .badge{ box-shadow:0 0 0 2px #faf6ea; }
      .arsan-notif-btn.has-unread .badge{ display:flex; }
      .arsan-notif-btn.has-unread svg{ animation:arsanBellShake 1.2s ease-in-out 2; }
      @keyframes arsanBellShake {
        0%,100%{ transform:rotate(0); }
        20%{ transform:rotate(-12deg); }
        40%{ transform:rotate(10deg); }
        60%{ transform:rotate(-6deg); }
        80%{ transform:rotate(4deg); }
      }

      /* Panel — anchored to same side as bell */
      .arsan-notif-panel{
        position:fixed;
        top:70px;
        inset-inline-start:16px;
        inset-inline-end:auto;
        width:380px; max-width:calc(100vw - 32px);
        max-height:70vh;
        background:linear-gradient(180deg, rgba(26,21,16,.92) 0%, rgba(35,26,16,.88) 100%);
        backdrop-filter:blur(24px) saturate(180%);
        -webkit-backdrop-filter:blur(24px) saturate(180%);
        border:1px solid rgba(133,113,77,.25);
        border-radius:14px;
        box-shadow:0 20px 60px rgba(0,0,0,.4);
        display:none;
        flex-direction:column;
        z-index:9500;
        overflow:hidden;
      }
      html[dir="ltr"] .arsan-notif-panel{
        inset-inline-start:auto;
        inset-inline-end:16px;
      }
      html[data-theme="light"] .arsan-notif-panel{
        background:linear-gradient(180deg, rgba(250,246,234,.92) 0%, rgba(243,234,208,.88) 100%);
        border-color:rgba(133,113,77,.35);
      }
      .arsan-notif-panel.open{ display:flex; }
      .arsan-notif-head{
        padding:14px 16px;
        border-bottom:1px solid rgba(133,113,77,.15);
        display:flex; align-items:center; justify-content:space-between;
        color:#f3e9c9;
      }
      html[data-theme="light"] .arsan-notif-head{ color:#3a2f15; border-bottom-color:rgba(133,113,77,.25); }
      .arsan-notif-head h3{
        margin:0; font-size:15px; font-weight:600;
      }
      .arsan-notif-head button{
        background:transparent; border:none;
        color:inherit; font-size:12px;
        cursor:pointer; padding:4px 8px; border-radius:6px;
        opacity:.7;
      }
      .arsan-notif-head button:hover{ opacity:1; background:rgba(133,113,77,.15); }
      .arsan-notif-body{
        flex:1; overflow-y:auto;
        padding:8px;
        display:flex; flex-direction:column; gap:6px;
      }
      .arsan-notif-empty{
        padding:40px 20px;
        text-align:center;
        color:#8a7d5d; font-size:13px;
      }
      .arsan-notif-item{
        padding:12px 14px;
        border-radius:10px;
        background:rgba(255,255,255,.03);
        border:1px solid rgba(133,113,77,.12);
        color:#f3e9c9;
        position:relative;
        transition:background .15s;
      }
      html[data-theme="light"] .arsan-notif-item{
        background:rgba(255,255,255,.4);
        color:#3a2f15;
        border-color:rgba(133,113,77,.2);
      }
      .arsan-notif-item.unread{
        background:rgba(133,113,77,.12);
        border-color:rgba(133,113,77,.35);
      }
      .arsan-notif-item.urgent{
        border-inline-start:3px solid #e63946;
      }
      .arsan-notif-item .ttl{
        font-size:13px; font-weight:600; margin-bottom:4px;
        display:flex; align-items:center; gap:6px;
      }
      .arsan-notif-item .urg-tag{
        font-size:10px; font-weight:700;
        padding:1px 6px; border-radius:3px;
        background:#e63946; color:#fff;
      }
      .arsan-notif-item .body{
        font-size:12px; opacity:.85; line-height:1.5;
        white-space:pre-wrap;
      }
      .arsan-notif-item .meta{
        margin-top:6px;
        font-size:10px; opacity:.55;
        display:flex; justify-content:space-between;
      }
      .arsan-notif-item .del{
        position:absolute; top:8px; inset-inline-end:8px;
        background:transparent; border:none;
        color:inherit; opacity:0; cursor:pointer;
        font-size:14px; width:22px; height:22px;
        border-radius:5px;
      }
      .arsan-notif-item:hover .del{ opacity:.5; }
      .arsan-notif-item .del:hover{ opacity:1; background:rgba(230,57,70,.2); color:#e63946; }
      .arsan-notif-foot{
        padding:10px 14px;
        border-top:1px solid rgba(133,113,77,.15);
        text-align:center;
      }
      .arsan-notif-foot a{
        color:#85714D; font-size:12px; font-weight:600;
        text-decoration:none;
      }
      .arsan-notif-foot a:hover{ text-decoration:underline; }
      html[data-theme="light"] .arsan-notif-foot{ border-top-color:rgba(133,113,77,.25); }
    `;
    document.head.appendChild(s);
  }

  // ============ Bell button ============
  let bellBtn = null;
  let panel = null;

  function createBell(){
    if (bellBtn) return bellBtn;
    bellBtn = document.createElement('button');
    bellBtn.className = 'arsan-notif-btn';
    bellBtn.type = 'button';
    bellBtn.setAttribute('aria-label', t('الإشعارات','Notifications'));
    bellBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
      <span class="badge">0</span>
    `;
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });
    return bellBtn;
  }

  async function updateBadge(){
    if (!bellBtn) return;
    const list = await loadAnnouncements();
    const read = getReadIds();
    const unread = list.filter(a => !read.has(a.id)).length;
    const badge = bellBtn.querySelector('.badge');
    if (unread > 0) {
      bellBtn.classList.add('has-unread');
      badge.textContent = unread > 9 ? '9+' : String(unread);
    } else {
      bellBtn.classList.remove('has-unread');
    }
  }

  // ============ Panel ============
  async function togglePanel(){
    if (!panel) panel = createPanel();
    const open = panel.classList.toggle('open');
    if (open) {
      await renderPanel();
      // Mark all as read after short delay
      setTimeout(async () => {
        const list = await loadAnnouncements();
        markAllRead(list);
        await renderPanel();
      }, 600);
    }
  }

  function createPanel(){
    panel = document.createElement('div');
    panel.className = 'arsan-notif-panel';
    panel.innerHTML = `
      <div class="arsan-notif-head">
        <h3>${t('الإشعارات','Notifications')}</h3>
        <button type="button" class="close">${t('إغلاق','Close')} ✕</button>
      </div>
      <div class="arsan-notif-body"></div>
      <div class="arsan-notif-foot">
        <a href="announcements.html">${t('عرض كل الإعلانات →','View all announcements →')}</a>
      </div>
    `;
    panel.querySelector('.close').addEventListener('click', () => panel.classList.remove('open'));
    document.body.appendChild(panel);
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !bellBtn.contains(e.target)) {
        panel.classList.remove('open');
      }
    });
    return panel;
  }

  async function renderPanel(){
    const body = panel.querySelector('.arsan-notif-body');
    const list = await loadAnnouncements();
    const read = getReadIds();
    if (!list.length) {
      body.innerHTML = `<div class="arsan-notif-empty">${t('لا توجد إشعارات حالياً','No notifications yet')}</div>`;
      return;
    }
    body.innerHTML = '';
    list.forEach(a => {
      const item = document.createElement('div');
      item.className = 'arsan-notif-item' + (a.priority === 'urgent' ? ' urgent' : '') + (!read.has(a.id) ? ' unread' : '');
      const when = new Date(a.ts || Date.now());
      const pad = n => String(n).padStart(2,'0');
      const whenStr = `${when.getFullYear()}-${pad(when.getMonth()+1)}-${pad(when.getDate())} ${pad(when.getHours())}:${pad(when.getMinutes())}`;
      item.innerHTML = `
        ${isAdmin() ? '<button class="del" title="'+t('حذف','Delete')+'">✕</button>' : ''}
        <div class="ttl">
          ${a.priority === 'urgent' ? '<span class="urg-tag">'+t('عاجل','URGENT')+'</span>' : ''}
          <span>${escapeHtml(a.title || '')}</span>
        </div>
        <div class="body">${escapeHtml(a.body || '')}</div>
        <div class="meta">
          <span>${escapeHtml(a.author || '')}</span>
          <span>${whenStr}</span>
        </div>
      `;
      if (isAdmin()) {
        item.querySelector('.del').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm(t('حذف هذا الإعلان؟','Delete this announcement?'))) return;
          await removeAnnouncement(a.id);
          await renderPanel();
          await updateBadge();
        });
      }
      body.appendChild(item);
    });
  }

  function escapeHtml(s){
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ============ Admin composer (exposed) ============
  async function postAnnouncement({title, body, priority='normal', notifyAll=true}){
    if (!title || !title.trim()) throw new Error(t('العنوان مطلوب','Title required'));
    const a = {
      id: 'a-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
      ts: Date.now(),
      author: me().email || 'admin',
      title: title.trim(),
      body: (body || '').trim(),
      priority,
      notifyAll
    };
    const res = await saveAnnouncement(a);
    await updateBadge();
    // Return the server response (with .slack info) if available, else the local object
    return (res && typeof res === 'object') ? res : a;
  }

  // ============ Inject bell into sidebar header ============
  function mountBell(){
    if (document.getElementById('arsan-notif-bell-host')) return true;
    // Floating host — positions bell opposite the sidebar FAB.
    // RTL: sidebar FAB is top-right (inset-inline-end:16px), so bell sits top-LEFT.
    // LTR: sidebar FAB is top-left, bell sits top-RIGHT.
    const host = document.createElement('div');
    host.id = 'arsan-notif-bell-host';
    const bell = createBell();
    host.appendChild(bell);
    document.body.appendChild(host);
    updateBadge();
    return true;
  }

  function init(){
    injectStyles();
    const tryMount = () => {
      if (mountBell()) return;
    };
    tryMount();
    const obs = new MutationObserver(() => tryMount());
    obs.observe(document.body, { childList: true, subtree: true });

    // Refresh badge periodically
    setInterval(() => updateBadge(), 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API for admin composer
  window.ArsanNotify = {
    post: postAnnouncement,
    refresh: updateBadge,
    loadAll: loadAnnouncements,
    remove: removeAnnouncement
  };
})();

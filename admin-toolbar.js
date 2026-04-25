/* ============================================================
   ARSAN — شريط أدوات الأدمن المشترك
   يعمل في index.html و dashboard.html
   ============================================================ */
(function() {
  'use strict';

  // إذا تم تحميله مسبقاً، تجاهل
  if (window.__ARSAN_ADMIN_TOOLBAR_LOADED) return;
  window.__ARSAN_ADMIN_TOOLBAR_LOADED = true;

  const API_BASE = window.API_BASE || "https://arsan-api.a-king-6e1.workers.dev";

  // -------- isAdmin --------
  function isAdmin() {
    const sources = [
      window.ArsanCurrentUser,
      (() => { try { return JSON.parse(localStorage.getItem('arsan_me') || 'null'); } catch(_) { return null; } })(),
      (() => { try { return JSON.parse(localStorage.getItem('arsan_me_v1') || 'null'); } catch(_) { return null; } })()
    ];
    for (const me of sources) {
      if (!me) continue;
      if (me.role === 'admin') return true;
      if ((me.email || '').toLowerCase() === 'a.king@arsann.com') return true;
    }
    return false;
  }

  // -------- inject CSS --------
  const css = `
  .arsan-at{
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:#141414; color:#F7F6F2;
    border-radius:999px; padding:8px;
    box-shadow:0 12px 40px rgba(0,0,0,.25), 0 4px 12px rgba(0,0,0,.18);
    display:none; align-items:center; gap:4px;
    z-index:99000;
    border:1px solid rgba(255,255,255,.08);
    backdrop-filter:blur(20px);
    max-width:calc(100vw - 32px);
    overflow-x:auto; scrollbar-width:none;
    font-family:"IBM Plex Sans Arabic", system-ui, sans-serif;
    direction:rtl;
  }
  .arsan-at::-webkit-scrollbar{ display:none }
  .arsan-at.is-visible{ display:flex }
  .arsan-at .at-label{
    display:inline-flex; align-items:center; gap:6px;
    padding:0 14px 0 10px;
    font-size:11px; font-weight:600;
    color:#D4B24A;
    border-right:1px solid rgba(255,255,255,.10);
    white-space:nowrap; height:36px; letter-spacing:.3px;
  }
  .arsan-at .at-label::before{ content:'⭐'; font-size:13px }
  .arsan-at button{
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 14px; height:36px;
    border-radius:999px;
    background:transparent; color:#F7F6F2;
    font-size:13px; font-weight:500; transition:.15s;
    white-space:nowrap; border:0; cursor:pointer;
    font-family:inherit;
  }
  .arsan-at button:hover{ background:rgba(255,255,255,.10) }
  .arsan-at button.is-primary{ background:#8B6F00; color:#fff }
  .arsan-at button.is-primary:hover{ filter:brightness(1.15) }
  .arsan-at button svg{ width:14px; height:14px; flex-shrink:0 }
  .arsan-at .at-divider{
    width:1px; height:20px;
    background:rgba(255,255,255,.10);
    margin:0 2px;
  }
  @media (max-width:600px){
    .arsan-at{ bottom:12px; padding:6px; gap:2px }
    .arsan-at button{ padding:7px 10px; font-size:12px }
    .arsan-at button span.at-text{ display:none }
    .arsan-at .at-label{ padding:0 10px 0 8px; font-size:10px }
  }

  /* Modals */
  .arsan-md-bd{
    position:fixed; inset:0; background:rgba(0,0,0,.55);
    backdrop-filter:blur(4px); z-index:99001;
    display:flex; align-items:center; justify-content:center;
    padding:20px; direction:rtl;
    font-family:"IBM Plex Sans Arabic", system-ui, sans-serif;
  }
  .arsan-md{
    background:#fff; color:#111827;
    border-radius:14px; padding:24px;
    max-width:520px; width:100%;
    box-shadow:0 16px 40px rgba(17,24,39,.25);
    max-height:85vh; overflow-y:auto;
  }
  html[data-theme="dark"] .arsan-md{ background:#18191B; color:#F3F1EA }
  .arsan-md h2{ margin:0 0 6px; font-size:18px; color:#8B6F00 }
  .arsan-md p.muted{ margin:0 0 18px; color:#6B7280; font-size:13px }
  .arsan-md label{
    display:block; font-size:12px; font-weight:600;
    margin:12px 0 6px; color:#374151;
  }
  html[data-theme="dark"] .arsan-md label{ color:#D7D3C7 }
  .arsan-md input, .arsan-md textarea, .arsan-md select{
    width:100%; padding:9px 10px;
    border:1px solid #E7E3D8; border-radius:8px;
    font-family:inherit; font-size:14px;
    background:#fff; color:#111827;
    box-sizing:border-box;
  }
  html[data-theme="dark"] .arsan-md input,
  html[data-theme="dark"] .arsan-md textarea,
  html[data-theme="dark"] .arsan-md select{ background:#141517; color:#F3F1EA; border-color:#262729 }
  .arsan-md input:focus, .arsan-md textarea:focus, .arsan-md select:focus{
    border-color:#8B6F00; outline:none;
  }
  .arsan-md-err{ color:#c43; font-size:12px; min-height:16px; margin-top:8px }
  .arsan-md-actions{
    display:flex; gap:8px; justify-content:flex-end; margin-top:18px;
  }
  .arsan-md .btn{
    padding:9px 18px; border-radius:8px;
    font-weight:600; font-size:13px;
    transition:.15s; border:0; cursor:pointer;
    font-family:inherit;
  }
  .arsan-md .btn-primary{ background:#8B6F00; color:#fff }
  .arsan-md .btn-primary:hover{ filter:brightness(1.1) }
  .arsan-md .btn-ghost{ background:transparent; color:#374151; border:1px solid #E7E3D8 }
  html[data-theme="dark"] .arsan-md .btn-ghost{ color:#D7D3C7; border-color:#262729 }
  .arsan-md .btn-ghost:hover{ background:#FBFAF6 }
  html[data-theme="dark"] .arsan-md .btn-ghost:hover{ background:#1E1F21 }
  `;
  const styleEl = document.createElement('style');
  styleEl.id = 'arsan-admin-toolbar-css';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // -------- Modal helper --------
  function openModal(title, bodyHTML, opts) {
    opts = opts || {};
    const bd = document.createElement('div');
    bd.className = 'arsan-md-bd';
    bd.innerHTML = `
      <div class="arsan-md" style="max-width:${opts.width || 520}px">
        <h2>${title}</h2>
        ${opts.subtitle ? `<p class="muted">${opts.subtitle}</p>` : ''}
        <div id="mdBody">${bodyHTML}</div>
        <div class="arsan-md-err" id="mdErr"></div>
        <div class="arsan-md-actions">
          <button class="btn btn-ghost" id="mdClose">إغلاق</button>
          ${opts.saveLabel ? `<button class="btn btn-primary" id="mdSave">${opts.saveLabel}</button>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(bd);
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };
    bd.querySelector('#mdClose').onclick = () => bd.remove();
    if (opts.saveLabel && opts.onSave) {
      bd.querySelector('#mdSave').onclick = () => opts.onSave(bd);
    }
    if (opts.onMount) opts.onMount(bd);
    return bd;
  }

  // -------- API helper --------
  async function apiCall(path, opts) {
    opts = opts || {};
    const token = localStorage.getItem('arsan_token_v1')
               || localStorage.getItem('arsan_token')
               || '';
    const res = await fetch(API_BASE + path, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  // -------- Add Department --------
  function showAddDeptModal() {
    openModal('+ إضافة إدارة جديدة', `
      <p class="muted">ستُضاف للمنصّة وتظهر لجميع المستخدمين فوراً.</p>
      <label>المعرّف (إنجليزي بدون مسافات) *</label>
      <input id="dId" type="text" placeholder="hr / finance / it" style="font-family:monospace;direction:ltr">
      <label>الاسم بالعربية *</label>
      <input id="dName" type="text" placeholder="إدارة الموارد البشرية">
      <label>أيقونة (Emoji اختياري)</label>
      <input id="dIcon" type="text" placeholder="🏢" style="font-size:18px">
      <label>وصف قصير (اختياري)</label>
      <input id="dDesc" type="text" placeholder="مثال: التوظيف والرواتب">
    `, {
      saveLabel: 'حفظ ونشر',
      onSave: async (bd) => {
        const id = bd.querySelector('#dId').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
        const name = bd.querySelector('#dName').value.trim();
        const icon = bd.querySelector('#dIcon').value.trim() || '🏢';
        const desc = bd.querySelector('#dDesc').value.trim();
        const err = bd.querySelector('#mdErr');
        if (!id || !name) { err.textContent = 'المعرّف والاسم مطلوبان.'; return; }
        try {
          await apiCall('/api/custom-depts', { method: 'POST', body: { id, name, icon, desc } });
          bd.remove();
          alert('✅ تمت الإضافة. جارٍ تحديث الصفحة...');
          location.reload();
        } catch(e) { err.textContent = 'خطأ: ' + e.message; }
      }
    });
  }

  // -------- Announcement --------
  function showAnnounceModal() {
    openModal('📢 إعلان جديد', `
      <label>عنوان الإعلان *</label>
      <input id="aTitle" type="text" placeholder="مثال: اجتماع طارئ يوم الأحد">
      <label>المحتوى *</label>
      <textarea id="aBody" rows="4" placeholder="تفاصيل الإعلان..."></textarea>
      <label>الأهمية</label>
      <select id="aPriority">
        <option value="info">عادي</option>
        <option value="warning">مهم</option>
        <option value="urgent">عاجل</option>
      </select>
    `, {
      saveLabel: 'نشر الإعلان',
      onSave: async (bd) => {
        const title = bd.querySelector('#aTitle').value.trim();
        const body = bd.querySelector('#aBody').value.trim();
        const priority = bd.querySelector('#aPriority').value;
        const err = bd.querySelector('#mdErr');
        if (!title || !body) { err.textContent = 'العنوان والمحتوى مطلوبان.'; return; }
        try {
          await apiCall('/api/announcements', { method: 'POST', body: { title, body, priority, ts: Date.now() } });
          bd.remove();
          alert('✅ تم نشر الإعلان');
        } catch(e) { err.textContent = 'خطأ: ' + e.message; }
      }
    });
  }

  // -------- Updates URL --------
  function showUpdatesModal() {
    openModal('💬 شريط التحديثات', `
      <p class="muted">رابط Google Doc يُعرَض كشريط تحديثات في dashboard.</p>
      <label>رابط المستند</label>
      <input id="uUrl" type="url" placeholder="https://docs.google.com/document/d/..." style="direction:ltr">
      <p class="muted" style="font-size:11px;margin-top:8px">اتركه فارغاً لإيقاف الشريط.</p>
    `, {
      saveLabel: 'حفظ',
      onMount: async (bd) => {
        try { const d = await apiCall('/api/updates-url'); bd.querySelector('#uUrl').value = d.url || ''; } catch(_) {}
      },
      onSave: async (bd) => {
        const url = bd.querySelector('#uUrl').value.trim();
        const err = bd.querySelector('#mdErr');
        try {
          await apiCall('/api/updates-url', { method: 'POST', body: { url } });
          bd.remove(); alert('✅ تم الحفظ');
        } catch(e) { err.textContent = 'خطأ: ' + e.message; }
      }
    });
  }

  // -------- Activity --------
  function showActivityModal() {
    const bd = openModal('📊 سجل النشاط', '<div id="actList" style="max-height:50vh;overflow:auto;font-size:13px">جارٍ التحميل...</div>', { width: 640 });
    apiCall('/api/activity?limit=50').then(data => {
      const list = bd.querySelector('#actList');
      if (!Array.isArray(data) || data.length === 0) {
        list.innerHTML = '<p class="muted">لا يوجد نشاط.</p>'; return;
      }
      list.innerHTML = data.map(a => `
        <div style="padding:10px 12px;border-bottom:1px solid #E7E3D8;display:flex;justify-content:space-between;gap:10px">
          <div>
            <div style="font-weight:600">${a.action || '—'}</div>
            <div style="color:#6B7280;font-size:12px">${a.user || ''} · ${a.target || ''}</div>
          </div>
          <div style="color:#6B7280;font-size:11px;white-space:nowrap">${new Date(a.ts || 0).toLocaleString('ar')}</div>
        </div>
      `).join('');
    }).catch(e => {
      bd.querySelector('#actList').innerHTML = '<p class="muted">خطأ: ' + e.message + '</p>';
    });
  }

  // -------- Slack --------
  function showSlackModal() {
    openModal('🔗 ربط Slack', `
      <p class="muted">سترسل إشعارات الإعلانات والتحديثات لـ Slack.</p>
      <label>Webhook URL</label>
      <input id="sUrl" type="url" placeholder="https://hooks.slack.com/services/..." style="direction:ltr">
      <p class="muted" style="font-size:11px;margin-top:8px">من Slack: Apps → Incoming Webhooks.</p>
    `, {
      saveLabel: 'حفظ + اختبار',
      onMount: async (bd) => {
        try { const d = await apiCall('/api/slack-webhook'); bd.querySelector('#sUrl').value = d.url || ''; } catch(_) {}
      },
      onSave: async (bd) => {
        const url = bd.querySelector('#sUrl').value.trim();
        const err = bd.querySelector('#mdErr');
        try {
          await apiCall('/api/slack-webhook', { method: 'POST', body: { url } });
          if (url) {
            await apiCall('/api/debug/slack-test', { method: 'POST' });
            alert('✅ تم الحفظ. تحقق من Slack.');
          } else { alert('✅ تمت الإزالة'); }
          bd.remove();
        } catch(e) { err.textContent = 'خطأ: ' + e.message; }
      }
    });
  }

  // -------- Maintenance --------
  function showMaintenanceModal() {
    openModal('🔧 وكيل الصيانة', `
      <p class="muted">يفحص المنصّة ويصلح المشاكل تلقائياً.</p>
      <div id="mResult" style="margin-top:14px;padding:14px;background:#FBFAF6;border-radius:8px;font-size:13px;min-height:80px">اضغط "تشغيل الفحص" للبدء.</div>
    `, {
      saveLabel: 'تشغيل الفحص',
      onSave: async (bd) => {
        const r = bd.querySelector('#mResult');
        r.innerHTML = '⏳ جارٍ الفحص...';
        try {
          const data = await apiCall('/api/maintenance/run', { method: 'POST' });
          const checks = data.checks || [];
          r.innerHTML = checks.length
            ? checks.map(c => `<div style="padding:6px 0">${c.ok ? '✅' : '⚠️'} ${c.name}: ${c.message || ''}</div>`).join('')
            : '<p>تم الفحص — كل شيء سليم.</p>';
        } catch(e) { r.innerHTML = '❌ خطأ: ' + e.message; }
      }
    });
  }

  // -------- Settings hub --------
  function showSettingsModal() {
    openModal('⚙️ إعدادات المنصّة', `
      <p class="muted">روابط سريعة:</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
        <a href="users.html" style="padding:12px;background:#FBFAF6;border:1px solid #E7E3D8;border-radius:8px;text-decoration:none;color:#111827;display:flex;justify-content:space-between;align-items:center"><span>👥 إدارة المستخدمين</span><span>←</span></a>
        <button data-act="announce" style="padding:12px;background:#FBFAF6;border:1px solid #E7E3D8;border-radius:8px;text-align:right;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:inherit;font-size:14px;color:#111827"><span>📢 نشر إعلان</span><span>+</span></button>
        <button data-act="updates" style="padding:12px;background:#FBFAF6;border:1px solid #E7E3D8;border-radius:8px;text-align:right;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:inherit;font-size:14px;color:#111827"><span>💬 شريط التحديثات</span><span>+</span></button>
        <button data-act="slack" style="padding:12px;background:#FBFAF6;border:1px solid #E7E3D8;border-radius:8px;text-align:right;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:inherit;font-size:14px;color:#111827"><span>🔗 ربط Slack</span><span>+</span></button>
        <button data-act="activity" style="padding:12px;background:#FBFAF6;border:1px solid #E7E3D8;border-radius:8px;text-align:right;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:inherit;font-size:14px;color:#111827"><span>📊 سجل النشاط</span><span>←</span></button>
      </div>
    `, {
      width: 480,
      onMount: (bd) => {
        bd.querySelectorAll('[data-act]').forEach(b => {
          b.onclick = () => {
            const act = b.getAttribute('data-act');
            bd.remove();
            if (act === 'announce') showAnnounceModal();
            else if (act === 'updates') showUpdatesModal();
            else if (act === 'slack') showSlackModal();
            else if (act === 'activity') showActivityModal();
          };
        });
      }
    });
  }

  // -------- Build the toolbar --------
  function buildToolbar() {
    if (document.getElementById('arsanAdminToolbar')) return;
    const tb = document.createElement('div');
    tb.id = 'arsanAdminToolbar';
    tb.className = 'arsan-at';
    tb.setAttribute('role', 'toolbar');
    tb.innerHTML = `
      <span class="at-label">أدوات الأدمن</span>
      <button class="is-primary" data-act="add-dept" title="إضافة إدارة جديدة">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span class="at-text">إدارة جديدة</span>
      </button>
      <span class="at-divider"></span>
      <button data-act="users" title="إدارة المستخدمين">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span class="at-text">المستخدمون</span>
      </button>
      <button data-act="announce" title="إعلان جديد">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/></svg>
        <span class="at-text">إعلان</span>
      </button>
      <button data-act="updates" title="شريط التحديثات">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="at-text">التحديثات</span>
      </button>
      <button data-act="activity" title="سجل النشاط">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span class="at-text">النشاط</span>
      </button>
      <span class="at-divider"></span>
      <button data-act="slack" title="ربط Slack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
        <span class="at-text">Slack</span>
      </button>
      <button data-act="maintenance" title="وكيل الصيانة">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        <span class="at-text">الصيانة</span>
      </button>
      <button data-act="settings" title="الإعدادات">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span class="at-text">الإعدادات</span>
      </button>
    `;
    document.body.appendChild(tb);

    tb.querySelectorAll('button[data-act]').forEach(b => {
      b.onclick = () => {
        const act = b.getAttribute('data-act');
        if (act === 'add-dept') showAddDeptModal();
        else if (act === 'users') location.href = 'users.html';
        else if (act === 'announce') showAnnounceModal();
        else if (act === 'updates') showUpdatesModal();
        else if (act === 'activity') showActivityModal();
        else if (act === 'slack') showSlackModal();
        else if (act === 'maintenance') showMaintenanceModal();
        else if (act === 'settings') showSettingsModal();
      };
    });
  }

  function refresh() {
    const tb = document.getElementById('arsanAdminToolbar');
    if (!tb) return;
    if (isAdmin()) tb.classList.add('is-visible');
    else tb.classList.remove('is-visible');
  }

  function init() {
    buildToolbar();
    refresh();
    // أعد التحقق دورياً (لو auth-gate حدّث arsan_me متأخراً)
    let retries = 0;
    const t = setInterval(() => {
      retries++;
      refresh();
      if (isAdmin() || retries > 12) clearInterval(t);
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('arsan:login', refresh);
  window.addEventListener('storage', (e) => {
    if (e.key === 'arsan_me' || e.key === 'arsan_me_v1') refresh();
  });

  // Expose for manual triggering / debugging
  window.ArsanAdminToolbar = {
    refresh, isAdmin,
    show: () => { const tb = document.getElementById('arsanAdminToolbar'); if (tb) tb.classList.add('is-visible'); },
    hide: () => { const tb = document.getElementById('arsanAdminToolbar'); if (tb) tb.classList.remove('is-visible'); },
    addDept: showAddDeptModal,
    announce: showAnnounceModal,
    updates: showUpdatesModal,
    activity: showActivityModal,
    slack: showSlackModal,
    maintenance: showMaintenanceModal,
    settings: showSettingsModal
  };
})();

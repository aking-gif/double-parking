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

  // -------- isLoggedIn (any role) --------
  function isLoggedIn() {
    if (!localStorage.getItem('arsan_token')) return false;
    const sources = [
      window.ArsanCurrentUser,
      (() => { try { return JSON.parse(localStorage.getItem('arsan_me') || 'null'); } catch(_) { return null; } })(),
      (() => { try { return JSON.parse(localStorage.getItem('arsan_me_v1') || 'null'); } catch(_) { return null; } })()
    ];
    return sources.some(me => me && me.email);
  }

  // -------- inDashboard (page is dashboard.html with a department) --------
  function inDashboard() {
    return !!window.CURRENT_DEPT_ID || /dashboard\.html/i.test(location.pathname);
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
  .arsan-at button .at-badge{
    display:inline-flex; align-items:center; justify-content:center;
    min-width:16px; height:16px; padding:0 5px;
    background:#ef4444; color:#fff; border-radius:8px;
    font-size:10px; font-weight:700; line-height:1;
    margin-right:2px;
  }
  .arsan-at .at-divider{
    width:1px; height:20px;
    background:rgba(255,255,255,.10);
    margin:0 2px;
  }
  /* Admin drawer toggle */
  .arsan-at .at-admin-toggle{
    background:rgba(255,255,255,.06)!important;
    border:1px dashed rgba(255,255,255,.20)!important;
    margin-right:4px;
  }
  .arsan-at .at-admin-toggle:hover{ background:rgba(255,255,255,.14)!important }
  .arsan-at .at-admin-toggle .at-caret{ font-size:10px; opacity:.7; transition:transform .2s }
  .arsan-at .at-admin-toggle[aria-expanded="true"] .at-caret{ transform:rotate(180deg) }
  .arsan-at .at-admin-toggle[aria-expanded="true"]{
    background:rgba(212,166,74,.20)!important;
    border-color:rgba(212,166,74,.50)!important;
  }
  .arsan-at .at-admin-group{ display:contents }
  .arsan-at .at-admin-group[data-collapsed="1"]{ display:none }
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
    showManageDeptsModal();
  }

  // -------- Manage Departments (list + add + edit + delete) --------
  async function showManageDeptsModal() {
    const bd = openModal('🗂️ إدارة الإدارات', `
      <p class="muted">يمكنك إضافة، تعديل، أو حذف الإدارات المخصّصة. الإدارات الافتراضية لا يمكن حذفها.</p>
      <div id="dList" style="max-height:50vh;overflow:auto;margin-top:12px">جارٍ التحميل...</div>
      <div style="margin-top:18px;padding-top:14px;border-top:1px solid #E7E3D8">
        <button id="dShowAdd" class="btn btn-primary" style="width:100%">+ إضافة إدارة جديدة</button>
      </div>
    `, { width: 600 });

    const BUILTIN = [
      { id: 'executive',   name: 'الإدارة التنفيذية',     icon: '🏛️' },
      { id: 'projects',    name: 'إدارة المشاريع',         icon: '🏗️' },
      { id: 'finance',     name: 'الإدارة المالية',         icon: '💰' },
      { id: 'procurement', name: 'إدارة المشتريات',         icon: '🛒' },
      { id: 'operations',  name: 'الإدارة التشغيلية',       icon: '⚙️' },
      { id: 'hr',          name: 'إدارة الموارد البشرية',   icon: '👥' },
      { id: 'bizdev',      name: 'إدارة تطوير الأعمال',     icon: '📈' }
    ];

    async function refreshList() {
      const listEl = bd.querySelector('#dList');
      listEl.innerHTML = '⏳ جارٍ التحميل...';
      let custom = [];
      let overrides = {};
      try { custom = await apiCall('/api/custom-depts'); } catch(_) {}
      try { overrides = await apiCall('/api/dept-overrides'); } catch(_) {}
      // Apply overrides to BUILTIN
      const builtinMerged = BUILTIN.map(d => {
        const ov = overrides[d.id] || {};
        return { ...d, ...ov, id: d.id, builtin: true };
      });
      const all = [
        ...builtinMerged,
        ...custom.map(d => ({ ...d, builtin: false }))
      ];
      listEl.innerHTML = all.map(d => `
        <div class="dept-row" data-id="${d.id}" style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #E7E3D8;border-radius:10px;margin-bottom:8px;background:#fff">
          <span style="font-size:22px;width:38px;height:38px;display:inline-flex;align-items:center;justify-content:center;background:${d.color||'#F4EFD9'};border-radius:8px">${d.icon || '🏢'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600">${d.name}</div>
            <div style="font-size:11px;color:#6B7280;font-family:monospace;direction:ltr;text-align:right">${d.id}${d.builtin ? ' · افتراضية' : ''}${d.head ? ' · '+d.head : ''}</div>
            ${d.desc ? `<div style="font-size:11px;color:#9CA3AF;margin-top:2px">${d.desc}</div>` : ''}
          </div>
          <button class="btn-edit" data-id="${d.id}" data-builtin="${d.builtin?1:0}" title="تعديل" style="border:1px solid #E7E3D8;background:#fff;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;color:#374151">تعديل</button>
          ${d.builtin ? '' : `
            <button class="btn-del" data-id="${d.id}" title="حذف" style="border:1px solid #E7E3D8;background:#fff;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;color:#c43">حذف</button>
          `}
        </div>
      `).join('');

      // bind edit/delete
      listEl.querySelectorAll('.btn-edit').forEach(b => {
        b.onclick = () => {
          const id = b.getAttribute('data-id');
          const isBuiltin = b.getAttribute('data-builtin') === '1';
          const dept = isBuiltin
            ? builtinMerged.find(x => x.id === id)
            : custom.find(x => x.id === id);
          if (dept) showEditDeptModal(dept, refreshList);
        };
      });
      listEl.querySelectorAll('.btn-del').forEach(b => {
        b.onclick = async () => {
          const id = b.getAttribute('data-id');
          if (!confirm('هل أنت متأكد من حذف هذه الإدارة؟ كل إجراءاتها ستبقى لكن لن تظهر الإدارة في القائمة.')) return;
          try {
            await apiCall('/api/custom-depts/' + encodeURIComponent(id), { method: 'DELETE' });
            window.dispatchEvent(new CustomEvent('arsan:depts-changed'));
            await refreshList();
          } catch(e) { alert('خطأ: ' + e.message); }
        };
      });
    }

    bd.querySelector('#dShowAdd').onclick = () => showAddNewDeptModal(refreshList);
    refreshList();
  }

  // -------- Add New Department (sub-modal) --------
  function showAddNewDeptModal(onDone) {
    openModal('+ إدارة جديدة', `
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
      saveLabel: 'حفظ',
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
          window.dispatchEvent(new CustomEvent('arsan:depts-changed'));
          if (onDone) onDone(); else location.reload();
        } catch(e) { err.textContent = 'خطأ: ' + e.message; }
      }
    });
  }

  // -------- Edit Department --------
  function showEditDeptModal(dept, onDone) {
    const isBuiltin = !!dept.builtin;
    openModal((isBuiltin?'✏️ تعديل (إدارة افتراضية): ':'✏️ تعديل: ') + dept.name, `
      <label>المعرّف</label>
      <input id="dId" type="text" value="${dept.id}" disabled style="font-family:monospace;direction:ltr;opacity:.6">
      <label>الاسم بالعربية *</label>
      <input id="dName" type="text" value="${(dept.name||'').replace(/"/g,'&quot;')}">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><label>أيقونة (Emoji)</label>
        <input id="dIcon" type="text" value="${dept.icon || '🏢'}" style="font-size:18px"></div>
        <div><label>لون الخلفية</label>
        <input id="dColor" type="color" value="${dept.color || '#F4EFD9'}" style="height:38px;padding:2px"></div>
      </div>
      <label>وصف قصير</label>
      <input id="dDesc" type="text" value="${(dept.desc||'').replace(/"/g,'&quot;')}" placeholder="مثال: التوظيف والرواتب">
      <label>رئيس الإدارة</label>
      <input id="dHead" type="text" value="${(dept.head||'').replace(/"/g,'&quot;')}" placeholder="اسم رئيس الإدارة">
      <label>البريد الإلكتروني للإدارة</label>
      <input id="dEmail" type="email" value="${(dept.email||'').replace(/"/g,'&quot;')}" placeholder="hr@arsann.com" style="direction:ltr">
      <label>أعضاء الفريق (إيميلات مفصولة بفاصلة)</label>
      <textarea id="dMembers" rows="2" style="direction:ltr">${(dept.members||[]).join(', ')}</textarea>
      <label>ملاحظات / تفاصيل إضافية</label>
      <textarea id="dNotes" rows="3" placeholder="رؤية الإدارة، أهدافها، KPIs...">${(dept.notes||'').replace(/</g,'&lt;')}</textarea>
    `, {
      width: 560,
      saveLabel: 'حفظ التعديلات',
      onSave: async (bd) => {
        const name = bd.querySelector('#dName').value.trim();
        const icon = bd.querySelector('#dIcon').value.trim() || '🏢';
        const color = bd.querySelector('#dColor').value;
        const desc = bd.querySelector('#dDesc').value.trim();
        const head = bd.querySelector('#dHead').value.trim();
        const email = bd.querySelector('#dEmail').value.trim();
        const members = bd.querySelector('#dMembers').value.split(',').map(s=>s.trim()).filter(Boolean);
        const notes = bd.querySelector('#dNotes').value.trim();
        const err = bd.querySelector('#mdErr');
        if (!name) { err.textContent = 'الاسم مطلوب.'; return; }
        const payload = { name, icon, color, desc, head, email, members, notes };
        try {
          if (isBuiltin) {
            // Save as override
            await apiCall('/api/dept-overrides/' + encodeURIComponent(dept.id), {
              method: 'PUT',
              body: payload
            });
          } else {
            await apiCall('/api/custom-depts/' + encodeURIComponent(dept.id), {
              method: 'PATCH',
              body: payload
            });
          }
          bd.remove();
          window.dispatchEvent(new CustomEvent('arsan:depts-changed'));
          if (onDone) onDone();
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

  // -------- Maintenance (client-side health check) --------
  function showMaintenanceModal() {
    openModal('🔧 وكيل الصيانة', `
      <p class="muted">يفحص حالة الـ Worker، الـ KV، وصلاحياتك.</p>
      <div id="mResult" style="margin-top:14px;padding:14px;background:#FBFAF6;border-radius:8px;font-size:13px;min-height:80px;line-height:1.9">اضغط "تشغيل الفحص" للبدء.</div>
    `, {
      saveLabel: 'تشغيل الفحص',
      onSave: async (bd) => {
        const r = bd.querySelector('#mResult');
        r.innerHTML = '⏳ جارٍ الفحص...';
        const out = [];
        const log = (ok, label, detail) => {
          out.push(`<div style="padding:4px 0">${ok ? '✅' : '⚠️'} <strong>${label}</strong> ${detail ? `<span style="color:#6B7280">— ${detail}</span>` : ''}</div>`);
          r.innerHTML = out.join('');
        };

        // 1) Worker reachable
        try {
          const res = await fetch(API_BASE + '/api/health').catch(() => null);
          if (res) {
            const ok = res.ok;
            log(ok, 'الـ Worker يستجيب', `HTTP ${res.status}`);
          } else {
            // /api/health may not exist; try /api/me
            const t = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token') || '';
            const r2 = await fetch(API_BASE + '/api/me', { headers: { Authorization: 'Bearer ' + t } });
            log(r2.status !== 0, 'الـ Worker يستجيب', `HTTP ${r2.status}`);
          }
        } catch(e) { log(false, 'الـ Worker يستجيب', e.message); }

        // 2) /api/me
        try {
          const me = await apiCall('/api/me');
          log(true, 'الجلسة صالحة', `${me.email} (${me.role})`);
        } catch(e) { log(false, 'الجلسة صالحة', e.message); }

        // 3) Custom depts
        try {
          const list = await apiCall('/api/custom-depts');
          log(true, 'الإدارات المخصّصة', `${list.length} إدارة`);
        } catch(e) { log(false, 'الإدارات المخصّصة', e.message); }

        // 4) Activity (admin only)
        try {
          const list = await apiCall('/api/activity?limit=5');
          log(true, 'سجل النشاط', `${list.length} حدث (آخر 5)`);
        } catch(e) { log(false, 'سجل النشاط', e.message); }

        // 5) Slack
        try {
          const d = await apiCall('/api/slack-webhook');
          log(true, 'إعدادات Slack', d.url ? 'مربوط' : 'غير مربوط');
        } catch(e) { log(false, 'إعدادات Slack', e.message); }

        // 6) Updates URL
        try {
          const d = await apiCall('/api/updates-url');
          log(true, 'شريط التحديثات', d.url ? 'مفعّل' : 'معطّل');
        } catch(e) { log(false, 'شريط التحديثات', e.message); }

        // 7) localStorage
        try {
          const t = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token');
          const me = localStorage.getItem('arsan_me_v1');
          log(!!(t && me), 'localStorage', `token: ${t ? '✓' : '✗'} · me: ${me ? '✓' : '✗'}`);
        } catch(e) { log(false, 'localStorage', e.message); }

        // 8) Orphan SOPs (under "undefined" dept) — admin-only feature
        try {
          const data = await apiCall('/api/bootstrap');
          const orphans = (data && data.sops && data.sops.undefined) || {};
          const count = Object.keys(orphans).length;
          if (count > 0) {
            out.push(`<div style="padding:10px;margin-top:8px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;color:#78350F">
              ⚠️ <strong>${count} إجراء يتيم</strong> (تحت dept = "undefined")
              <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
                <button id="moveOrphans" style="padding:6px 12px;background:#D4A64A;color:#000;border:0;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">نقل لـ archive</button>
                <button id="deleteOrphans" style="padding:6px 12px;background:#dc2626;color:#fff;border:0;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">حذف نهائي</button>
              </div>
            </div>`);
            r.innerHTML = out.join('');
            document.getElementById('moveOrphans').onclick = async () => {
              if (!confirm(`نقل ${count} إجراء إلى إدارة "archive"؟`)) return;
              try {
                const res = await apiCall('/api/admin/cleanup-undefined-dept', { method: 'POST', body: { targetDept: 'archive' } });
                alert(`✅ تم نقل ${res.moved} إجراء إلى archive`);
                location.reload();
              } catch(e) { alert('فشل: ' + e.message); }
            };
            document.getElementById('deleteOrphans').onclick = async () => {
              if (!confirm(`حذف ${count} إجراء نهائياً؟ لا يمكن التراجع.`)) return;
              try {
                const res = await apiCall('/api/admin/cleanup-undefined-dept', { method: 'POST', body: { delete: true } });
                alert(`✅ تم حذف ${res.deleted} إجراء`);
                location.reload();
              } catch(e) { alert('فشل: ' + e.message); }
            };
          } else {
            log(true, 'الإجراءات اليتيمة', 'لا توجد');
          }
        } catch(e) { log(false, 'الإجراءات اليتيمة', e.message); }

        out.push('<hr style="border:none;border-top:1px solid #E7E3D8;margin:10px 0">');
        out.push('<div style="color:#6B7280;font-size:12px">انتهى الفحص.</div>');
        r.innerHTML = out.join('');
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
    const showAddSopBtn = isLoggedIn() && inDashboard();
    const showMapBtns = inDashboard();
    const mapBtnsHTML = showMapBtns ? `
      <button data-act="unified-map" title="🌐 الخريطة الشاملة — كل الإدارات والتبعيات">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span class="at-text">الخريطة</span>
      </button>
      <button data-act="deps-editor" title="🔗 محرر التبعيّات">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span class="at-text">التبعيّات</span>
      </button>
      <span class="at-divider"></span>
    ` : '';
    const sopBtnsHTML = showAddSopBtn ? `
      <button class="is-primary" data-act="new-sop" title="إضافة إجراء جديد">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span class="at-text">إجراء جديد</span>
      </button>
      <button data-act="import-sop" title="استيراد إجراء من ملف">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span class="at-text">استيراد</span>
      </button>
      <span class="at-divider"></span>
    ` : '';
    const adminToggleHTML = isAdmin() ? (
      '<button class="at-admin-toggle" data-act="toggle-admin" title="أدوات الأدمن" aria-expanded="false">' +
        '<span style="font-size:14px">⭐</span>' +
        '<span class="at-text">أدوات الأدمن</span>' +
        '<span class="at-caret">▾</span>' +
      '</button>' +
      '<span class="at-admin-group" data-collapsed="1">'
    ) : '';
    const adminGroupCloseHTML = isAdmin() ? '</span>' : '';

    tb.innerHTML = `
      <span class="at-label">${isAdmin() ? 'أرسان' : 'أدوات سريعة'}</span>
      ${mapBtnsHTML}
      ${sopBtnsHTML}
      ${adminToggleHTML}
      <button class="is-primary" data-act="add-dept" title="إدارة الإدارات">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span class="at-text">الإدارات</span>
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
      <button data-act="messages" title="مركز الرسائل بين الإدارات">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="at-text">الرسائل</span>
        <span class="at-badge" id="atBadgeMessages" style="display:none"></span>
      </button>
      <button data-act="audit" title="سجل التعديلات">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        <span class="at-text">السجل</span>
      </button>
      <button data-act="webhooks" title="Webhooks">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 10v6m11-11h-6m-10 0H1"/></svg>
        <span class="at-text">تكامل</span>
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
      ${adminGroupCloseHTML}
    `;
    document.body.appendChild(tb);

    tb.querySelectorAll('button[data-act]').forEach(b => {
      b.onclick = () => {
        const act = b.getAttribute('data-act');
        if (act === 'toggle-admin') {
          const grp = tb.querySelector('.at-admin-group');
          const expanded = b.getAttribute('aria-expanded') === 'true';
          if (expanded) {
            b.setAttribute('aria-expanded','false');
            if (grp) grp.setAttribute('data-collapsed','1');
          } else {
            b.setAttribute('aria-expanded','true');
            if (grp) grp.removeAttribute('data-collapsed');
          }
          return;
        }
        if (act === 'add-dept') showManageDeptsModal();
        else if (act === 'users') location.href = 'users.html';
        else if (act === 'announce') showAnnounceModal();
        else if (act === 'updates') showUpdatesModal();
        else if (act === 'activity') showActivityModal();
        else if (act === 'messages') { if (window.ArsanMessaging) window.ArsanMessaging.open(); else alert('messaging.js لم يُحمَّل'); }
        else if (act === 'audit') { if (window.ArsanAudit) window.ArsanAudit.open(); else alert('audit-viewer.js لم يُحمَّل'); }
        else if (act === 'webhooks') { if (window.ArsanWebhooks) window.ArsanWebhooks.open(); else alert('webhooks-admin.js لم يُحمَّل'); }
        else if (act === 'slack') showSlackModal();
        else if (act === 'maintenance') showMaintenanceModal();
        else if (act === 'settings') showSettingsModal();
        else if (act === 'new-sop') openNewSopModal();
        else if (act === 'import-sop') openImportSopModal();
        else if (act === 'unified-map') {
          if (typeof window.showUnifiedMap === 'function') window.showUnifiedMap();
          else alert('الخريطة الشاملة غير جاهزة — حدّث الصفحة');
        }
        else if (act === 'deps-editor') {
          if (typeof window.showDepsEditor === 'function') window.showDepsEditor();
          else alert('محرر التبعيّات غير جاهز — حدّث الصفحة');
        }
      };
    });
  }

  // ============================================================
  // ➕ NEW SOP MODAL — لكل المستخدمين المسجّلين (admin/editor/viewer)
  // ============================================================
  async function openNewSopModal() {
    if (!isLoggedIn()) { alert('سجّل الدخول أولاً'); return; }
    const deptId = window.CURRENT_DEPT_ID;
    if (!deptId) { alert('افتح إدارة أولاً'); return; }

    const DEPT = (window.DEPARTMENTS_CONFIG && window.DEPARTMENTS_CONFIG[deptId]) || window.DEPT || {};
    const deptName = DEPT.name || deptId;
    const groups = Array.isArray(DEPT.groups) && DEPT.groups.length ? DEPT.groups : [
      { id:'general', label:'عام' },
      { id:'planning', label:'تخطيط' },
      { id:'execution', label:'تنفيذ' },
      { id:'review', label:'مراجعة' },
      { id:'closure', label:'إقفال' }
    ];

    const bd = document.createElement('div');
    bd.className = 'arsan-md-bd';
    bd.innerHTML = `
      <div class="arsan-md" style="max-width:560px">
        <h2>➕ إجراء جديد</h2>
        <p class="muted">في إدارة: <b>${deptName}</b></p>
        <label>الكود <span style="color:#9ca3af;font-weight:400">(مثال: SOP-001)</span></label>
        <input id="ns_code" placeholder="SOP-001" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #d1d5db;border-radius:8px;font-family:inherit"/>
        <label>العنوان</label>
        <input id="ns_title" placeholder="مثال: إجراء استلام البضائع" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #d1d5db;border-radius:8px;font-family:inherit"/>
        <label>المرحلة</label>
        <select id="ns_phase" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #d1d5db;border-radius:8px;font-family:inherit">
          ${groups.map(g => `<option value="${g.id}">${g.label}</option>`).join('')}
        </select>
        <label>الغرض</label>
        <textarea id="ns_purpose" rows="3" placeholder="ما الهدف من هذا الإجراء؟" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #d1d5db;border-radius:8px;font-family:inherit;resize:vertical"></textarea>
        <div id="ns_err" style="color:#dc2626;font-size:13px;margin-bottom:8px"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button id="ns_cancel" style="padding:10px 18px;border:1px solid #d1d5db;background:#fff;border-radius:8px;cursor:pointer;font-family:inherit">إلغاء</button>
          <button id="ns_save" style="padding:10px 18px;background:#8B6F00;color:#fff;border:0;border-radius:8px;cursor:pointer;font-weight:600;font-family:inherit">حفظ</button>
        </div>
      </div>`;
    document.body.appendChild(bd);
    bd.querySelector('#ns_cancel').onclick = () => bd.remove();
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };

    bd.querySelector('#ns_save').onclick = async () => {
      const code = bd.querySelector('#ns_code').value.trim();
      const title = bd.querySelector('#ns_title').value.trim();
      const phase = bd.querySelector('#ns_phase').value;
      const purpose = bd.querySelector('#ns_purpose').value.trim() || 'بانتظار التعبئة';
      const err = bd.querySelector('#ns_err');
      if (!code) { err.textContent = 'الكود مطلوب'; return; }
      if (!title) { err.textContent = 'العنوان مطلوب'; return; }
      try {
        const tok = localStorage.getItem('arsan_token');
        const res = await fetch(API_BASE + '/api/sops/' + encodeURIComponent(deptId), {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+tok },
          body: JSON.stringify({ code, title, phase, purpose, scope:'', responsibilities:'', steps:[], inputs:[], outputs:[], kpis:[], references:[] })
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          err.textContent = j.error || ('فشل الحفظ — ' + res.status);
          return;
        }
        bd.remove();
        location.reload();
      } catch(e) {
        err.textContent = 'خطأ في الاتصال — ' + e.message;
      }
    };
  }

  // ============================================================
  // 📥 IMPORT MODAL
  // ============================================================
  function openImportSopModal() {
    if (!isLoggedIn()) { alert('سجّل الدخول أولاً'); return; }
    if (!window.CURRENT_DEPT_ID) { alert('افتح إدارة أولاً'); return; }
    // delegate to existing dashboard import flow if available
    if (typeof window.showImportModal === 'function') {
      window.showImportModal();
    } else {
      alert('ميزة الاستيراد ستفتح بعد لحظة — حدّث الصفحة لو لم تظهر');
    }
  }

  function refresh() {
    let tb = document.getElementById('arsanAdminToolbar');
    // إعادة بناء كاملة لو CURRENT_DEPT_ID تغيّر بعد التهيئة
    if (tb) {
      const hasNewSop = !!tb.querySelector('[data-act="new-sop"]');
      const shouldHaveNewSop = isLoggedIn() && inDashboard();
      if (hasNewSop !== shouldHaveNewSop) {
        tb.remove();
        tb = null;
      }
    }
    if (!tb) {
      buildToolbar();
      tb = document.getElementById('arsanAdminToolbar');
    }
    if (!tb) return;
    // الظهور: أدمن دائماً، أو أي مستخدم مسجّل داخل dashboard
    const shouldShow = isAdmin() || (isLoggedIn() && inDashboard());
    if (shouldShow) tb.classList.add('is-visible');
    else tb.classList.remove('is-visible');
  }

  function init() {
    buildToolbar();
    refresh();
    // أعد التحقق دورياً (لو auth-gate حدّث arsan_me متأخراً، أو CURRENT_DEPT_ID جاء بعد التحميل)
    let retries = 0;
    const t = setInterval(() => {
      retries++;
      refresh();
      if (retries > 20) clearInterval(t);
    }, 600);
    // 🔁 راقب CURRENT_DEPT_ID — لو اتعرّف بعد init، أعد بناء الـ toolbar
    let lastDeptId = window.CURRENT_DEPT_ID;
    const watcher = setInterval(() => {
      if (window.CURRENT_DEPT_ID !== lastDeptId) {
        lastDeptId = window.CURRENT_DEPT_ID;
        const tb = document.getElementById('arsanAdminToolbar');
        if (tb) tb.remove();
        buildToolbar();
        refresh();
      }
    }, 500);
    setTimeout(() => clearInterval(watcher), 30000);
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
    openManageDepts: showManageDeptsModal,
    announce: showAnnounceModal,
    updates: showUpdatesModal,
    activity: showActivityModal,
    slack: showSlackModal,
    maintenance: showMaintenanceModal,
    settings: showSettingsModal
  };

  // ===== polling: badge للرسائل =====
  async function refreshMessagesBadge(){
    try {
      const badge = document.getElementById('atBadgeMessages');
      if (!badge) return;
      if (!window.ArsanMessaging?.getUnreadCount) { badge.style.display='none'; return; }
      const me = window.ArsanAPI?.me?.();
      if (!me?.email) { badge.style.display='none'; return; }
      const deptId = window.CURRENT_DEPT_ID || (me.departments||[])[0];
      if (!deptId) { badge.style.display='none'; return; }
      const n = await window.ArsanMessaging.getUnreadCount(deptId);
      if (n > 0) { badge.textContent = n > 99 ? '99+' : String(n); badge.style.display='inline-flex'; }
      else { badge.style.display='none'; }
    } catch(e){}
  }
  // run every 30s + once after 2s
  setTimeout(refreshMessagesBadge, 2000);
  setInterval(refreshMessagesBadge, 30000);
  // refresh after closing the messaging modal
  document.addEventListener('click', (e)=>{
    if (e.target.closest('.amsg-overlay') || e.target.closest('[data-act="messages"]')) {
      setTimeout(refreshMessagesBadge, 1500);
    }
  });
})();

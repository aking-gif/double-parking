/**
 * messaging.js — مركز الرسائل بين الإدارات
 * يستخدمه: dashboard.html (يفتح modal من شريط الأدوات أو زر مخصص)
 *
 * يعتمد على window.ArsanAPI للاتصال بالـ Worker
 * Endpoints:
 *   GET  /api/messages?dept=...        — صندوق وارد
 *   GET  /api/messages/sent?dept=...   — مرسلة
 *   POST /api/messages                 — إرسال جديد
 *   POST /api/messages/:id/read        — قراءة
 */
(function(){
  'use strict';
  if (window.ArsanMessaging) return;

  const API = () => window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me  = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch { return null; } };

  async function api(path, opts={}) {
    const res = await fetch(API()+path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(tok() ? { Authorization: 'Bearer '+tok() } : {}),
        ...(opts.headers||{})
      }
    });
    return res.json();
  }

  // ===== styles (one-time) =====
  function injectStyles(){
    if (document.getElementById('arsan-msg-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-msg-styles';
    s.textContent = `
.amsg-bd{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(8px);z-index:99990;display:flex;align-items:center;justify-content:center;padding:20px;animation:amsgIn .2s ease}
@keyframes amsgIn{from{opacity:0}to{opacity:1}}
.amsg-modal{background:#fff;border-radius:18px;box-shadow:0 25px 60px rgba(0,0,0,.3);width:min(960px,100%);max-height:90vh;display:grid;grid-template-rows:auto 1fr;overflow:hidden;font-family:inherit}
.amsg-head{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #eef2f7;background:linear-gradient(135deg,#f8fafc,#fff)}
.amsg-title{font-size:18px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:10px}
.amsg-x{background:none;border:0;font-size:24px;cursor:pointer;color:#64748b;width:32px;height:32px;border-radius:8px}
.amsg-x:hover{background:#f1f5f9}
.amsg-tabs{display:flex;gap:4px;padding:8px 16px 0;border-bottom:1px solid #eef2f7;background:#f8fafc}
.amsg-tab{padding:10px 18px;background:none;border:0;cursor:pointer;font-size:14px;font-weight:600;color:#64748b;border-bottom:2px solid transparent;display:flex;align-items:center;gap:6px}
.amsg-tab.active{color:#0ea5e9;border-color:#0ea5e9}
.amsg-tab .badge{background:#ef4444;color:#fff;border-radius:10px;padding:0 6px;font-size:11px;min-width:18px;text-align:center}
.amsg-body{display:grid;grid-template-columns:1fr 1.4fr;overflow:hidden}
.amsg-list{border-left:1px solid #eef2f7;overflow-y:auto;background:#fafbfc}
.amsg-row{padding:12px 16px;border-bottom:1px solid #eef2f7;cursor:pointer;display:grid;gap:4px}
.amsg-row:hover{background:#f1f5f9}
.amsg-row.active{background:#e0f2fe;border-right:3px solid #0ea5e9}
.amsg-row.unread{font-weight:600}
.amsg-row.unread::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:#0ea5e9;margin-left:6px;vertical-align:middle}
.amsg-row .from{font-size:13px;color:#0ea5e9;font-weight:600}
.amsg-row .subj{font-size:14px;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.amsg-row .meta{font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
.amsg-detail{padding:20px 24px;overflow-y:auto;display:flex;flex-direction:column;gap:14px}
.amsg-detail .subj{font-size:18px;font-weight:700;color:#0f172a}
.amsg-detail .meta-line{font-size:12px;color:#64748b;display:flex;gap:14px;flex-wrap:wrap}
.amsg-detail .meta-line b{color:#0f172a}
.amsg-detail .body{background:#f8fafc;border-radius:12px;padding:16px;line-height:1.7;color:#1e293b;white-space:pre-wrap;border:1px solid #eef2f7}
.amsg-detail .actions{display:flex;gap:8px;margin-top:8px}
.amsg-empty{padding:60px 20px;text-align:center;color:#94a3b8}
.amsg-compose{padding:20px;display:grid;gap:12px;overflow-y:auto}
.amsg-compose label{font-size:12px;color:#64748b;font-weight:600}
.amsg-compose input,.amsg-compose select,.amsg-compose textarea{padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box}
.amsg-compose textarea{min-height:200px;resize:vertical}
.amsg-compose input:focus,.amsg-compose textarea:focus,.amsg-compose select:focus{outline:none;border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.1)}
.amsg-btn{background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;border:0;padding:10px 18px;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px}
.amsg-btn:hover{filter:brightness(1.1)}
.amsg-btn.ghost{background:#f1f5f9;color:#0f172a}
.amsg-priority{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600}
.amsg-priority.high{background:#fee2e2;color:#dc2626}
.amsg-priority.normal{background:#dbeafe;color:#2563eb}
.amsg-priority.low{background:#f1f5f9;color:#64748b}
@media(max-width:768px){.amsg-body{grid-template-columns:1fr}.amsg-list{display:none}.amsg-list.show{display:block}}
`;
    document.head.appendChild(s);
  }

  function fmtTime(ts){
    const d = new Date(ts), now = Date.now();
    const diff = (now-ts)/1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return Math.floor(diff/60)+' د';
    if (diff < 86400) return Math.floor(diff/3600)+' س';
    if (diff < 604800) return Math.floor(diff/86400)+' ي';
    return d.toLocaleDateString('ar-SA');
  }

  function deptName(id){
    if (!id) return '';
    const cfg = window.DEPARTMENTS_CONFIG || {};
    const d = cfg[id];
    if (d) return d.icon ? d.icon+' '+(d.name || id) : (d.name || id);
    // try custom depts cache
    try {
      const custom = JSON.parse(localStorage.getItem('arsan_custom_depts_v1') || '[]');
      const c = Array.isArray(custom) && custom.find(x => x.id === id);
      if (c) return (c.icon ? c.icon+' ' : '') + (c.name || id);
    } catch(_){}
    return id;
  }
  
  function getAllDepts(){
    const cfg = window.DEPARTMENTS_CONFIG || {};
    // 1) base depts (object → entries)
    const base = Object.keys(cfg).filter(k => k && k !== 'undefined').map(id => ({
      id,
      name: cfg[id].icon ? cfg[id].icon+' '+(cfg[id].name||id) : (cfg[id].name||id)
    }));
    // 2) custom depts from localStorage (kept in sync by index.html)
    let custom = [];
    try {
      const arr = JSON.parse(localStorage.getItem('arsan_custom_depts_v1') || '[]');
      if (Array.isArray(arr)) custom = arr.filter(d => d && d.id).map(d => ({
        id: d.id,
        name: (d.icon ? d.icon+' ' : '') + (d.name || d.id)
      }));
    } catch(_){}
    // merge unique
    const seen = new Set(base.map(d => d.id));
    custom.forEach(c => { if (!seen.has(c.id)) { base.push(c); seen.add(c.id); } });
    return base;
  }

  // ===== state =====
  let state = {
    open: false,
    tab: 'inbox', // inbox | sent | compose
    selectedDept: null,
    inbox: [],
    sent: [],
    selected: null,
    composing: { toDept:'', subject:'', body:'', priority:'normal' }
  };

  // ===== render =====
  function render(){
    if (!state.open) return;
    let modal = document.querySelector('.amsg-bd');
    if (!modal){
      modal = document.createElement('div');
      modal.className = 'amsg-bd';
      modal.addEventListener('click', e => { if (e.target === modal) close(); });
      document.body.appendChild(modal);
    }
    const unread = state.inbox.filter(m => !m.read).length;
    const myDepts = (me()?.departments || []);
    const allDepts = getAllDepts();

    modal.innerHTML = `
      <div class="amsg-modal" onclick="event.stopPropagation()">
        <div class="amsg-head">
          <div class="amsg-title">📬 مركز الرسائل بين الإدارات
            ${state.selectedDept ? `<select onchange="ArsanMessaging._switchDept(this.value)" style="margin-right:12px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px">
              ${allDepts.map(d=>`<option value="${d.id}" ${d.id===state.selectedDept?'selected':''}>${d.name}</option>`).join('')}
            </select>`:''}
          </div>
          <button class="amsg-x" onclick="ArsanMessaging.close()">×</button>
        </div>
        <div class="amsg-tabs">
          <button class="amsg-tab ${state.tab==='inbox'?'active':''}" onclick="ArsanMessaging._setTab('inbox')">📥 الوارد ${unread?`<span class="badge">${unread}</span>`:''}</button>
          <button class="amsg-tab ${state.tab==='sent'?'active':''}" onclick="ArsanMessaging._setTab('sent')">📤 المرسلة</button>
          <button class="amsg-tab ${state.tab==='compose'?'active':''}" onclick="ArsanMessaging._setTab('compose')">✏️ رسالة جديدة</button>
        </div>
        <div class="amsg-body">
          ${state.tab === 'compose' ? renderCompose(allDepts) : renderListView()}
        </div>
      </div>`;
  }

  function renderListView(){
    const list = state.tab === 'inbox' ? state.inbox : state.sent;
    const sel = state.selected;
    return `
      <div class="amsg-list">
        ${list.length === 0 ? `<div class="amsg-empty">لا توجد رسائل</div>` :
          list.map(m => `
            <div class="amsg-row ${sel?.id===m.id?'active':''} ${!m.read && state.tab==='inbox'?'unread':''}" onclick="ArsanMessaging._select('${m.id}')">
              <div class="from">${state.tab==='inbox' ? 'من: '+deptName(m.fromDept) : 'إلى: '+deptName(m.toDept)}</div>
              <div class="subj">${escapeHtml(m.subject)}</div>
              <div class="meta">
                <span>${m.fromEmail||''}</span>
                <span>${fmtTime(m.ts)}</span>
              </div>
            </div>`).join('')}
      </div>
      <div class="amsg-detail">
        ${sel ? `
          <div class="subj">${escapeHtml(sel.subject)}</div>
          <div class="meta-line">
            <span>من <b>${deptName(sel.fromDept)}</b> (${sel.fromEmail||''})</span>
            <span>إلى <b>${deptName(sel.toDept)}</b></span>
            <span>${new Date(sel.ts).toLocaleString('ar-SA')}</span>
            <span class="amsg-priority ${sel.priority||'normal'}">${({high:'عاجل',normal:'عادي',low:'منخفض'})[sel.priority||'normal']}</span>
          </div>
          ${sel.sopRef ? `<div class="meta-line">📎 مرتبطة بإجراء: <b>${escapeHtml(sel.sopRef)}</b></div>` : ''}
          <div class="body">${escapeHtml(sel.body||'')}</div>
          ${state.tab==='inbox' ? `<div class="actions">
            <button class="amsg-btn" onclick="ArsanMessaging._reply()">↩️ رد</button>
          </div>`:''}
        ` : `<div class="amsg-empty">اختر رسالة لعرضها</div>`}
      </div>`;
  }

  function renderCompose(allDepts){
    const c = state.composing;
    return `
      <div class="amsg-compose" style="grid-column:1/-1">
        <div>
          <label>من إدارة:</label>
          <select id="amsg-from" disabled style="background:#f1f5f9">
            <option>${deptName(state.selectedDept || (me()?.departments?.[0]) || '')}</option>
          </select>
        </div>
        <div>
          <label>إلى إدارة: *</label>
          <select id="amsg-to">
            <option value="">-- اختر إدارة --</option>
            ${allDepts.filter(d=>d.id!==state.selectedDept).map(d=>`<option value="${d.id}" ${c.toDept===d.id?'selected':''}>${d.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>الأولوية:</label>
          <select id="amsg-pri">
            <option value="normal" ${c.priority==='normal'?'selected':''}>عادي</option>
            <option value="high" ${c.priority==='high'?'selected':''}>عاجل</option>
            <option value="low" ${c.priority==='low'?'selected':''}>منخفض</option>
          </select>
        </div>
        <div>
          <label>الموضوع: *</label>
          <input id="amsg-subj" value="${escapeAttr(c.subject)}" placeholder="موضوع الرسالة">
        </div>
        <div>
          <label>الرسالة: *</label>
          <textarea id="amsg-body" placeholder="اكتب رسالتك هنا...&#10;&#10;يمكنك استخدام @إدارة-اسم لإشارة إدارة أخرى&#10;أو @بريد@arsann.com لإشارة شخص">${escapeHtml(c.body)}</textarea>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="amsg-btn ghost" onclick="ArsanMessaging._setTab('inbox')">إلغاء</button>
          <button class="amsg-btn" onclick="ArsanMessaging._send()">📨 إرسال</button>
        </div>
      </div>`;
  }

  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function escapeAttr(s){return escapeHtml(s);}

  // ===== actions =====
  async function open(deptId){
    injectStyles();
    state.open = true;
    state.selectedDept = deptId || window.CURRENT_DEPT_ID || (me()?.departments?.[0]) || 'executive';
    state.tab = 'inbox';
    state.selected = null;
    render();
    await refresh();
  }
  function close(){
    state.open = false;
    document.querySelector('.amsg-bd')?.remove();
  }
  async function refresh(){
    if (!state.selectedDept) return;
    try {
      const [inbox, sent] = await Promise.all([
        api('/api/messages?dept='+encodeURIComponent(state.selectedDept)),
        api('/api/messages/sent?dept='+encodeURIComponent(state.selectedDept))
      ]);
      state.inbox = Array.isArray(inbox) ? inbox : [];
      state.sent  = Array.isArray(sent)  ? sent  : [];
    } catch(e) {
      console.warn('messaging refresh failed', e);
    }
    render();
  }

  async function _select(id){
    const list = state.tab==='inbox' ? state.inbox : state.sent;
    const m = list.find(x => x.id === id);
    if (!m) return;
    state.selected = m;
    if (state.tab==='inbox' && !m.read){
      m.read = true;
      try { await api('/api/messages/'+id+'/read', {method:'POST', body:JSON.stringify({dept:state.selectedDept})}); } catch(_){}
    }
    render();
  }
  function _setTab(t){
    state.tab = t;
    state.selected = null;
    if (t==='compose') state.composing = { toDept:'', subject:'', body:'', priority:'normal' };
    render();
  }
  async function _switchDept(id){
    state.selectedDept = id;
    await refresh();
  }
  async function _send(){
    const to = document.getElementById('amsg-to')?.value;
    const subj = document.getElementById('amsg-subj')?.value?.trim();
    const body = document.getElementById('amsg-body')?.value?.trim();
    const pri = document.getElementById('amsg-pri')?.value || 'normal';
    if (!to) return alert('اختر الإدارة المستقبلة');
    if (!subj) return alert('أدخل الموضوع');
    if (!body) return alert('أدخل الرسالة');
    try {
      const res = await api('/api/messages', {
        method:'POST',
        body: JSON.stringify({ fromDept: state.selectedDept, toDept: to, subject: subj, body, priority: pri })
      });
      if (res.ok){
        alert('✅ أُرسلت الرسالة');
        state.tab = 'sent';
        await refresh();
      } else {
        alert('فشل الإرسال: '+(res.error||'خطأ'));
      }
    } catch(e) { alert('خطأ في الاتصال'); }
  }
  function _reply(){
    if (!state.selected) return;
    state.composing = {
      toDept: state.selected.fromDept,
      subject: 'رد: '+state.selected.subject,
      body: '\n\n--- الرسالة الأصلية ---\n'+state.selected.body,
      priority: 'normal'
    };
    state.tab = 'compose';
    render();
  }

  // ===== badge على شريط الأدوات =====
  async function getUnreadCount(deptId){
    if (!deptId) return 0;
    try {
      const inbox = await api('/api/messages?dept='+encodeURIComponent(deptId));
      return Array.isArray(inbox) ? inbox.filter(m=>!m.read).length : 0;
    } catch { return 0; }
  }

  window.ArsanMessaging = { open, close, refresh, getUnreadCount, _select, _setTab, _switchDept, _send, _reply };
})();

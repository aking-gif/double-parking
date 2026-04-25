/**
 * audit-viewer.js — عارض سجل التعديلات (للأدمن)
 * يفتح modal كامل بكل تعديلات SOPs مع تفاصيل before/after
 */
(function(){
  'use strict';
  if (window.ArsanAudit) return;

  const API = () => window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const tok = () => localStorage.getItem('arsan_token') || '';
  async function api(path){
    const r = await fetch(API()+path, { headers: tok()?{Authorization:'Bearer '+tok()}:{} });
    return r.json();
  }

  function injectStyles(){
    if (document.getElementById('aaud-styles')) return;
    const s = document.createElement('style');
    s.id = 'aaud-styles';
    s.textContent = `
.aaud-bd{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(8px);z-index:99990;display:flex;align-items:center;justify-content:center;padding:20px}
.aaud-modal{background:#fff;border-radius:18px;box-shadow:0 25px 60px rgba(0,0,0,.3);width:min(1100px,100%);max-height:90vh;display:grid;grid-template-rows:auto auto 1fr;overflow:hidden}
.aaud-head{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #eef2f7;background:linear-gradient(135deg,#f8fafc,#fff)}
.aaud-title{font-size:18px;font-weight:700;color:#0f172a}
.aaud-x{background:none;border:0;font-size:24px;cursor:pointer;color:#64748b;width:32px;height:32px;border-radius:8px}
.aaud-x:hover{background:#f1f5f9}
.aaud-filters{display:flex;gap:8px;padding:12px 22px;border-bottom:1px solid #eef2f7;background:#f8fafc;flex-wrap:wrap}
.aaud-filters input,.aaud-filters select{padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px}
.aaud-body{overflow-y:auto;padding:0}
.aaud-row{padding:14px 22px;border-bottom:1px solid #eef2f7;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center}
.aaud-row:hover{background:#f8fafc}
.aaud-action{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;display:inline-block}
.aaud-action.create{background:#dcfce7;color:#15803d}
.aaud-action.update{background:#dbeafe;color:#2563eb}
.aaud-action.delete{background:#fee2e2;color:#dc2626}
.aaud-action.message{background:#fef3c7;color:#a16207}
.aaud-action.backup{background:#e9d5ff;color:#6b21a8}
.aaud-action.mention{background:#cffafe;color:#0e7490}
.aaud-info{display:grid;gap:2px}
.aaud-info .top{font-size:13px;color:#0f172a}
.aaud-info .top b{color:#0ea5e9}
.aaud-info .meta{font-size:11px;color:#94a3b8}
.aaud-time{font-size:11px;color:#64748b;text-align:left;white-space:nowrap}
.aaud-empty{padding:60px 20px;text-align:center;color:#94a3b8}
.aaud-detail{padding:10px 22px 16px;background:#f8fafc;border-bottom:1px solid #eef2f7;font-size:12px;color:#475569;font-family:monospace;white-space:pre-wrap;max-height:240px;overflow:auto;border-radius:8px;margin:0 22px 14px}
`;
    document.head.appendChild(s);
  }

  function fmtTime(ts){
    return new Date(ts).toLocaleString('ar-SA');
  }
  function actionLabel(a){
    return ({
      'sop-create':'إنشاء',
      'sop-update':'تعديل',
      'sop-delete':'حذف',
      'message-sent':'رسالة',
      'backup-created':'نسخة احتياطية',
      'mention-dept':'إشارة'
    })[a] || a;
  }
  function actionClass(a){
    if (a.includes('create')) return 'create';
    if (a.includes('update')) return 'update';
    if (a.includes('delete')) return 'delete';
    if (a.includes('message')) return 'message';
    if (a.includes('backup')) return 'backup';
    if (a.includes('mention')) return 'mention';
    return '';
  }
  function escape(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  let state = { items: [], filter: { action:'', dept:'', actor:'' }, expanded: null };

  async function open(){
    injectStyles();
    let m = document.querySelector('.aaud-bd');
    if (!m){
      m = document.createElement('div');
      m.className = 'aaud-bd';
      m.addEventListener('click', e => { if (e.target===m) close(); });
      document.body.appendChild(m);
    }
    render(m);
    await refresh();
  }
  function close(){ document.querySelector('.aaud-bd')?.remove(); }

  async function refresh(){
    const q = new URLSearchParams();
    if (state.filter.action) q.set('action', state.filter.action);
    if (state.filter.dept) q.set('dept', state.filter.dept);
    if (state.filter.actor) q.set('actor', state.filter.actor);
    q.set('limit', '300');
    try {
      const r = await api('/api/audit?'+q.toString());
      state.items = Array.isArray(r) ? r : [];
    } catch(_){ state.items = []; }
    const m = document.querySelector('.aaud-bd');
    if (m) render(m);
  }

  function render(m){
    const allDepts = (window.DEPARTMENTS_CONFIG||[]).map(d=>d.id);
    m.innerHTML = `
      <div class="aaud-modal" onclick="event.stopPropagation()">
        <div class="aaud-head">
          <div class="aaud-title">📜 سجل التعديلات (Audit Trail)</div>
          <button class="aaud-x" onclick="ArsanAudit.close()">×</button>
        </div>
        <div class="aaud-filters">
          <select onchange="ArsanAudit._setFilter('action', this.value)">
            <option value="">كل العمليات</option>
            <option value="sop-create">إنشاء SOP</option>
            <option value="sop-update">تعديل SOP</option>
            <option value="sop-delete">حذف SOP</option>
            <option value="message-sent">رسائل</option>
            <option value="backup-created">نسخ احتياطية</option>
          </select>
          <select onchange="ArsanAudit._setFilter('dept', this.value)">
            <option value="">كل الإدارات</option>
            ${allDepts.map(d=>`<option value="${d}" ${state.filter.dept===d?'selected':''}>${d}</option>`).join('')}
          </select>
          <input placeholder="بحث بالإيميل..." value="${escape(state.filter.actor)}" onchange="ArsanAudit._setFilter('actor', this.value)">
          <button onclick="ArsanAudit.refresh()" style="background:#0ea5e9;color:#fff;border:0;padding:8px 14px;border-radius:8px;cursor:pointer">🔄 تحديث</button>
        </div>
        <div class="aaud-body">
          ${state.items.length === 0 ? '<div class="aaud-empty">لا توجد سجلات</div>' :
            state.items.map(it => renderRow(it)).join('')}
        </div>
      </div>`;
  }

  function renderRow(it){
    const expanded = state.expanded === it.id;
    return `
      <div class="aaud-row" onclick="ArsanAudit._toggle('${it.id}')">
        <span class="aaud-action ${actionClass(it.action)}">${actionLabel(it.action)}</span>
        <div class="aaud-info">
          <div class="top">
            <b>${escape(it.actor||'?')}</b>
            ${it.dept?` على <b>${escape(it.dept)}</b>`:''}
            ${it.code?` / <b>${escape(it.code)}</b>`:''}
            ${it.title?` — ${escape(it.title)}`:''}
            ${it.subject?` — "${escape(it.subject)}"`:''}
          </div>
          <div class="meta">
            ${it.fields?'الحقول: '+it.fields.join(', '):''}
            ${it.fromDept?'من: '+escape(it.fromDept):''}
          </div>
        </div>
        <div class="aaud-time">${fmtTime(it.ts)}</div>
      </div>
      ${expanded && (it.before || it.after) ? `<div class="aaud-detail">${escape(JSON.stringify({before:it.before, after:it.after}, null, 2))}</div>` : ''}
    `;
  }

  function _setFilter(k, v){ state.filter[k] = v; refresh(); }
  function _toggle(id){ state.expanded = state.expanded===id?null:id; const m=document.querySelector('.aaud-bd'); if(m) render(m); }

  window.ArsanAudit = { open, close, refresh, _setFilter, _toggle };
})();

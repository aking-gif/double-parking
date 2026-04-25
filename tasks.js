/**
 * tasks.js — نظام المهام
 * يفتح modal: قائمة مهام + إنشاء + تحديث حالة + ربط بإجراء
 */
(function(){
  'use strict';
  if (window.ArsanTasks) return;

  const API = () => window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me  = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch { return null; } };
  async function api(p, opts={}){
    const r = await fetch(API()+p, {
      ...opts,
      headers:{'Content-Type':'application/json',...(tok()?{Authorization:'Bearer '+tok()}:{}),...(opts.headers||{})}
    });
    return r.json();
  }

  function injectStyles(){
    if (document.getElementById('atsk-styles')) return;
    const s = document.createElement('style');
    s.id='atsk-styles';
    s.textContent = `
.atsk-bd{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(8px);z-index:99990;display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif}
.atsk-modal{background:#fff;border-radius:18px;box-shadow:0 25px 60px rgba(0,0,0,.3);width:min(1000px,100%);max-height:90vh;display:flex;flex-direction:column;overflow:hidden}
.atsk-head{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #eef2f7;background:linear-gradient(135deg,#f8fafc,#fff)}
.atsk-title{font-size:18px;font-weight:700;color:#0f172a}
.atsk-x{background:none;border:0;font-size:24px;cursor:pointer;color:#64748b;width:32px;height:32px;border-radius:8px}
.atsk-x:hover{background:#f1f5f9}
.atsk-tabs{display:flex;gap:4px;padding:8px 16px 0;border-bottom:1px solid #eef2f7;background:#f8fafc}
.atsk-tab{padding:10px 18px;background:none;border:0;cursor:pointer;font-size:14px;font-weight:600;color:#64748b;border-bottom:2px solid transparent;font-family:inherit}
.atsk-tab.active{color:#0ea5e9;border-color:#0ea5e9}
.atsk-tab .badge{background:#ef4444;color:#fff;border-radius:10px;padding:0 6px;font-size:11px;margin-right:4px}
.atsk-body{flex:1;overflow-y:auto;padding:16px 22px}
.atsk-row{display:grid;grid-template-columns:auto 1fr auto auto;gap:12px;align-items:center;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff}
.atsk-row:hover{box-shadow:0 2px 8px rgba(0,0,0,.05)}
.atsk-row.done{opacity:.6}
.atsk-cb{width:20px;height:20px;cursor:pointer;accent-color:#0ea5e9}
.atsk-info .t{font-weight:600;color:#0f172a;font-size:14px}
.atsk-info .t.strike{text-decoration:line-through}
.atsk-info .meta{font-size:11px;color:#94a3b8;display:flex;gap:10px;flex-wrap:wrap;margin-top:3px}
.atsk-info .meta b{color:#475569}
.atsk-pri{padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600}
.atsk-pri.high{background:#fee2e2;color:#dc2626}
.atsk-pri.normal{background:#dbeafe;color:#2563eb}
.atsk-pri.low{background:#f1f5f9;color:#64748b}
.atsk-status{padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;border:0;cursor:pointer;font-family:inherit}
.atsk-status.open{background:#fef3c7;color:#a16207}
.atsk-status.in-progress{background:#dbeafe;color:#1e40af}
.atsk-status.done{background:#dcfce7;color:#15803d}
.atsk-status.cancelled{background:#f1f5f9;color:#64748b}
.atsk-empty{padding:50px 20px;text-align:center;color:#94a3b8}
.atsk-form{display:grid;gap:10px;padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:16px}
.atsk-form label{font-size:12px;color:#64748b;font-weight:600}
.atsk-form input,.atsk-form select,.atsk-form textarea{padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;width:100%;box-sizing:border-box}
.atsk-form .row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.atsk-btn{background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;border:0;padding:9px 16px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;font-family:inherit}
.atsk-btn.ghost{background:#f1f5f9;color:#0f172a}
.atsk-del{background:none;border:0;color:#dc2626;cursor:pointer;padding:4px 8px;border-radius:6px;font-size:12px}
.atsk-del:hover{background:#fee2e2}
`;
    document.head.appendChild(s);
  }
  function escape(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function fmtDate(ts){ if(!ts)return ''; return new Date(ts).toLocaleDateString('ar-SA'); }

  let state = { tab:'mine', list:[], showForm:false, sopRef:null };

  async function open(opts={}){
    injectStyles();
    state.sopRef = opts.sopRef || null;
    state.tab = state.sopRef ? 'sop' : 'mine';
    let m = document.querySelector('.atsk-bd');
    if (!m){
      m = document.createElement('div'); m.className='atsk-bd';
      m.addEventListener('click', e => { if(e.target===m) close(); });
      document.body.appendChild(m);
    }
    render(m); await refresh();
  }
  function close(){ document.querySelector('.atsk-bd')?.remove(); }

  async function refresh(){
    const u = me();
    let q = '';
    if (state.tab === 'mine' && u) q = '?assignee='+encodeURIComponent(u.email);
    else if (state.tab === 'created' && u) q = '';  // need extra filter
    else if (state.tab === 'sop' && state.sopRef) q = '?sopRef='+encodeURIComponent(state.sopRef);
    else if (state.tab === 'all') q = '';
    try {
      let list = await api('/api/tasks'+q);
      if (!Array.isArray(list)) list = [];
      if (state.tab === 'created' && u) list = list.filter(t => t.createdBy === u.email);
      state.list = list;
    } catch(_){ state.list = []; }
    const m = document.querySelector('.atsk-bd'); if (m) render(m);
  }

  function render(m){
    const myEmail = me()?.email;
    const myMine = state.list.filter(t => t.assignee === myEmail && t.status !== 'done').length;
    m.innerHTML = `
      <div class="atsk-modal" onclick="event.stopPropagation()">
        <div class="atsk-head">
          <div class="atsk-title">✅ المهام ${state.sopRef?` — ${escape(state.sopRef)}`:''}</div>
          <button class="atsk-x" onclick="ArsanTasks.close()">×</button>
        </div>
        <div class="atsk-tabs">
          ${state.sopRef?`<button class="atsk-tab active" onclick="ArsanTasks._tab('sop')">📎 لهذا الإجراء</button>`:''}
          <button class="atsk-tab ${state.tab==='mine'?'active':''}" onclick="ArsanTasks._tab('mine')">👤 مهامي ${myMine?`<span class="badge">${myMine}</span>`:''}</button>
          <button class="atsk-tab ${state.tab==='created'?'active':''}" onclick="ArsanTasks._tab('created')">✏️ التي أنشأتها</button>
          <button class="atsk-tab ${state.tab==='all'?'active':''}" onclick="ArsanTasks._tab('all')">📋 الكل</button>
        </div>
        <div class="atsk-body">
          ${state.showForm ? renderForm() : `<button class="atsk-btn" onclick="ArsanTasks._showForm()">+ مهمة جديدة</button>`}
          <div style="margin-top:14px">
            ${state.list.length === 0 ? '<div class="atsk-empty">لا توجد مهام</div>' :
              state.list.map(t => renderTask(t)).join('')}
          </div>
        </div>
      </div>`;
  }

  function renderTask(t){
    const isDone = t.status === 'done';
    const overdue = t.dueDate && new Date(t.dueDate) < new Date() && !isDone;
    return `
      <div class="atsk-row ${isDone?'done':''}">
        <input type="checkbox" class="atsk-cb" ${isDone?'checked':''} onchange="ArsanTasks._toggle('${t.id}', this.checked)">
        <div class="atsk-info">
          <div class="t ${isDone?'strike':''}">${escape(t.title)}</div>
          <div class="meta">
            ${t.assignee?`<span>👤 <b>${escape(t.assignee)}</b></span>`:''}
            ${t.dueDate?`<span style="${overdue?'color:#dc2626;font-weight:600':''}">📅 ${fmtDate(new Date(t.dueDate).getTime())}${overdue?' متأخر':''}</span>`:''}
            ${t.sopRef?`<span>📎 ${escape(t.sopRef)}</span>`:''}
            ${t.dept?`<span>🗂️ ${escape(t.dept)}</span>`:''}
            <span class="atsk-pri ${t.priority||'normal'}">${({high:'عاجل',normal:'عادي',low:'منخفض'})[t.priority||'normal']}</span>
          </div>
        </div>
        <select class="atsk-status ${t.status}" onchange="ArsanTasks._setStatus('${t.id}', this.value)">
          <option value="open" ${t.status==='open'?'selected':''}>مفتوح</option>
          <option value="in-progress" ${t.status==='in-progress'?'selected':''}>جارٍ</option>
          <option value="done" ${t.status==='done'?'selected':''}>منجز</option>
          <option value="cancelled" ${t.status==='cancelled'?'selected':''}>ملغى</option>
        </select>
        <button class="atsk-del" onclick="ArsanTasks._del('${t.id}')">🗑️</button>
      </div>`;
  }

  function renderForm(){
    const allDepts = (window.DEPARTMENTS_CONFIG||[]).map(d=>({id:d.id,name:d.name}));
    return `
      <div class="atsk-form">
        <div><label>عنوان المهمة *</label><input id="atsk-title" placeholder="مثال: مراجعة العقد قبل التوقيع"></div>
        <div class="row">
          <div><label>المسؤول (إيميل)</label><input id="atsk-asg" placeholder="user@arsann.com" value="${state.sopRef?(me()?.email||''):''}"></div>
          <div><label>تاريخ الاستحقاق</label><input id="atsk-due" type="date"></div>
          <div><label>الأولوية</label>
            <select id="atsk-pri">
              <option value="normal">عادي</option><option value="high">عاجل</option><option value="low">منخفض</option>
            </select>
          </div>
        </div>
        ${!state.sopRef?`<div><label>إدارة (اختياري)</label>
          <select id="atsk-dept"><option value="">--</option>${allDepts.map(d=>`<option value="${d.id}">${escape(d.name)}</option>`).join('')}</select>
        </div>`:''}
        <div><label>وصف (اختياري)</label><textarea id="atsk-desc" rows="2"></textarea></div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="atsk-btn ghost" onclick="ArsanTasks._cancelForm()">إلغاء</button>
          <button class="atsk-btn" onclick="ArsanTasks._save()">حفظ</button>
        </div>
      </div>`;
  }

  function _tab(t){ state.tab = t; refresh(); }
  function _showForm(){ state.showForm = true; const m=document.querySelector('.atsk-bd');if(m)render(m); }
  function _cancelForm(){ state.showForm = false; const m=document.querySelector('.atsk-bd');if(m)render(m); }
  async function _save(){
    const title = document.getElementById('atsk-title')?.value?.trim();
    if (!title) return alert('العنوان مطلوب');
    const body = {
      title,
      assignee: document.getElementById('atsk-asg')?.value?.trim() || null,
      dueDate: document.getElementById('atsk-due')?.value || null,
      priority: document.getElementById('atsk-pri')?.value || 'normal',
      description: document.getElementById('atsk-desc')?.value || '',
      dept: document.getElementById('atsk-dept')?.value || (state.sopRef?state.sopRef.split('/')[0]:null),
      sopRef: state.sopRef
    };
    const r = await api('/api/tasks', {method:'POST', body:JSON.stringify(body)});
    if (r.ok){ state.showForm=false; await refresh(); }
    else alert('فشل: '+(r.error||''));
  }
  async function _toggle(id, checked){
    await api('/api/tasks/'+id, {method:'PATCH', body:JSON.stringify({status: checked?'done':'open'})});
    await refresh();
  }
  async function _setStatus(id, status){
    await api('/api/tasks/'+id, {method:'PATCH', body:JSON.stringify({status})});
    await refresh();
  }
  async function _del(id){
    if (!confirm('حذف المهمة؟')) return;
    await api('/api/tasks/'+id, {method:'DELETE'});
    await refresh();
  }

  window.ArsanTasks = { open, close, refresh, _tab, _showForm, _cancelForm, _save, _toggle, _setStatus, _del };
})();

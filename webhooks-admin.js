/**
 * webhooks-admin.js — لوحة إدارة Webhooks (للأدمن)
 * تكامل خارجي مع Slack/Teams/Trello/أي نظام
 */
(function(){
  'use strict';
  if (window.ArsanWebhooks) return;

  const API = () => window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const tok = () => localStorage.getItem('arsan_token') || '';
  async function api(path, opts={}){
    const r = await fetch(API()+path, {
      ...opts,
      headers:{'Content-Type':'application/json',...(tok()?{Authorization:'Bearer '+tok()}:{}),...(opts.headers||{})}
    });
    return r.json();
  }

  const EVENTS = [
    {id:'sop.created', name:'إنشاء إجراء جديد'},
    {id:'sop.updated', name:'تعديل إجراء'},
    {id:'sop.deleted', name:'حذف إجراء'},
    {id:'message.sent', name:'إرسال رسالة بين الإدارات'},
    {id:'task.assigned', name:'إسناد مهمة'},
    {id:'comment.added', name:'إضافة تعليق'}
  ];

  function injectStyles(){
    if (document.getElementById('awh-styles')) return;
    const s = document.createElement('style');
    s.id='awh-styles';
    s.textContent = `
.awh-bd{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(8px);z-index:99990;display:flex;align-items:center;justify-content:center;padding:20px}
.awh-modal{background:#fff;border-radius:18px;box-shadow:0 25px 60px rgba(0,0,0,.3);width:min(900px,100%);max-height:90vh;display:flex;flex-direction:column;overflow:hidden}
.awh-head{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #eef2f7;background:linear-gradient(135deg,#f8fafc,#fff)}
.awh-title{font-size:18px;font-weight:700;color:#0f172a}
.awh-x{background:none;border:0;font-size:24px;cursor:pointer;color:#64748b;width:32px;height:32px;border-radius:8px}
.awh-x:hover{background:#f1f5f9}
.awh-body{padding:18px 22px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:14px}
.awh-card{border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff}
.awh-card.new{border-style:dashed;background:#f8fafc}
.awh-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}
.awh-name{font-weight:700;color:#0f172a}
.awh-url{font-size:12px;color:#64748b;font-family:monospace;word-break:break-all}
.awh-events{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.awh-event{background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:6px;font-size:11px}
.awh-status{font-size:11px;color:#94a3b8;margin-top:6px}
.awh-status.err{color:#dc2626}
.awh-actions{display:flex;gap:6px}
.awh-btn{background:#f1f5f9;border:0;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;color:#0f172a}
.awh-btn:hover{background:#e2e8f0}
.awh-btn.primary{background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff}
.awh-btn.danger{background:#fee2e2;color:#dc2626}
.awh-form{display:grid;gap:10px}
.awh-form label{font-size:12px;color:#64748b;font-weight:600}
.awh-form input{padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;width:100%;box-sizing:border-box}
.awh-form .events{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.awh-form .events label{display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#1e293b;font-weight:500}
.awh-empty{text-align:center;color:#94a3b8;padding:30px}
`;
    document.head.appendChild(s);
  }

  let state = { list: [], composing: null };

  async function open(){
    injectStyles();
    let m = document.querySelector('.awh-bd');
    if (!m){
      m = document.createElement('div');
      m.className = 'awh-bd';
      m.addEventListener('click', e => { if (e.target===m) close(); });
      document.body.appendChild(m);
    }
    render(m);
    await refresh();
  }
  function close(){ document.querySelector('.awh-bd')?.remove(); }

  async function refresh(){
    try { state.list = (await api('/api/webhooks')) || []; if(!Array.isArray(state.list))state.list=[]; } catch(_){ state.list=[]; }
    const m = document.querySelector('.awh-bd'); if (m) render(m);
  }
  function escape(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  function render(m){
    m.innerHTML = `
      <div class="awh-modal" onclick="event.stopPropagation()">
        <div class="awh-head">
          <div class="awh-title">🔌 Webhooks — تكامل خارجي</div>
          <button class="awh-x" onclick="ArsanWebhooks.close()">×</button>
        </div>
        <div class="awh-body">
          ${state.composing ? renderForm() : ''}
          ${!state.composing ? `<button class="awh-btn primary" onclick="ArsanWebhooks._new()" style="align-self:flex-start">+ إضافة Webhook جديد</button>` : ''}
          ${state.list.length === 0 && !state.composing ?
            '<div class="awh-empty">لا توجد webhooks مسجّلة بعد.<br>أضف واحداً للتكامل مع Slack أو Teams أو أي تطبيق.</div>' :
            state.list.map(w => renderCard(w)).join('')}
        </div>
      </div>`;
  }

  function renderCard(w){
    return `
      <div class="awh-card">
        <div class="awh-row">
          <div>
            <div class="awh-name">${escape(w.name)} ${!w.active?'<span style="color:#94a3b8">(معطّل)</span>':''}</div>
            <div class="awh-url">${escape(w.url)}</div>
            <div class="awh-events">
              ${(w.events||[]).map(e => {
                const ev = EVENTS.find(x=>x.id===e);
                return `<span class="awh-event">${ev?ev.name:e}</span>`;
              }).join('')}
            </div>
            ${w.dept?`<div class="awh-status">📌 إدارة: ${escape(w.dept)}</div>`:''}
            <div class="awh-status ${w.lastError?'err':''}">
              ${w.lastFired?'آخر تشغيل: '+new Date(w.lastFired).toLocaleString('ar-SA'):'لم يُشغّل بعد'}
              ${w.lastError?' • خطأ: '+escape(w.lastError):''}
            </div>
          </div>
          <div class="awh-actions">
            <button class="awh-btn" onclick="ArsanWebhooks._test('${w.id}')">🧪 اختبار</button>
            <button class="awh-btn" onclick="ArsanWebhooks._toggle('${w.id}')">${w.active?'⏸️':'▶️'}</button>
            <button class="awh-btn danger" onclick="ArsanWebhooks._delete('${w.id}')">🗑️</button>
          </div>
        </div>
      </div>`;
  }

  function renderForm(){
    const c = state.composing;
    return `
      <div class="awh-card new">
        <div class="awh-form">
          <div><label>الاسم</label><input id="awh-name" value="${escape(c.name||'')}" placeholder="مثال: Slack #operations"></div>
          <div><label>الرابط (Webhook URL)</label><input id="awh-url" value="${escape(c.url||'')}" placeholder="https://hooks.slack.com/..."></div>
          <div>
            <label>الأحداث</label>
            <div class="events">
              ${EVENTS.map(e => `
                <label><input type="checkbox" value="${e.id}" ${(c.events||[]).includes(e.id)?'checked':''}> ${e.name}</label>
              `).join('')}
            </div>
          </div>
          <div><label>إدارة محددة (اختياري)</label>
            <select id="awh-dept" style="padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;width:100%">
              <option value="">كل الإدارات</option>
              ${(window.DEPARTMENTS_CONFIG||[]).map(d=>`<option value="${d.id}" ${c.dept===d.id?'selected':''}>${d.icon||''} ${d.name}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="awh-btn" onclick="ArsanWebhooks._cancel()">إلغاء</button>
            <button class="awh-btn primary" onclick="ArsanWebhooks._save()">حفظ</button>
          </div>
        </div>
      </div>`;
  }

  function _new(){ state.composing = { name:'', url:'', events:[], dept:'', active:true }; const m=document.querySelector('.awh-bd');if(m)render(m); }
  function _cancel(){ state.composing = null; const m=document.querySelector('.awh-bd');if(m)render(m); }
  async function _save(){
    const name = document.getElementById('awh-name')?.value?.trim();
    const url = document.getElementById('awh-url')?.value?.trim();
    const dept = document.getElementById('awh-dept')?.value || null;
    const events = [...document.querySelectorAll('.awh-form .events input:checked')].map(i=>i.value);
    if (!name || !url || !events.length) return alert('الاسم والرابط وحدث واحد على الأقل مطلوبة');
    try {
      const r = await api('/api/webhooks', {method:'POST', body:JSON.stringify({name,url,events,dept,active:true})});
      if (r.ok){ state.composing = null; await refresh(); }
      else alert('فشل: '+(r.error||''));
    } catch(e){ alert('خطأ في الاتصال'); }
  }
  async function _test(id){
    const r = await api('/api/webhooks/'+id+'/test', {method:'POST'});
    alert(r.ok?'✅ نجح الاختبار':'❌ فشل: '+(r.error||r.status||''));
    await refresh();
  }
  async function _toggle(id){
    const w = state.list.find(x=>x.id===id);
    if (!w) return;
    await api('/api/webhooks/'+id, {method:'PATCH', body:JSON.stringify({active:!w.active})});
    await refresh();
  }
  async function _delete(id){
    if (!confirm('هل تريد حذف هذا الـ Webhook؟')) return;
    await api('/api/webhooks/'+id, {method:'DELETE'});
    await refresh();
  }

  window.ArsanWebhooks = { open, close, refresh, _new, _cancel, _save, _test, _toggle, _delete };
})();

/**
 * approval-flow.js — لوحة طلبات الاعتماد
 */
(function(){
  'use strict';
  if (window.ArsanApprovals) return;
  const API = () => window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const tok = () => localStorage.getItem('arsan_token')||'';
  const me  = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch { return null; } };
  async function api(p, opts={}){
    const r = await fetch(API()+p, {...opts, headers:{'Content-Type':'application/json',...(tok()?{Authorization:'Bearer '+tok()}:{}),...(opts.headers||{})}});
    return r.json();
  }
  function injectStyles(){
    if (document.getElementById('aapp-styles')) return;
    const s=document.createElement('style');s.id='aapp-styles';
    s.textContent=`
.aapp-bd{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(8px);z-index:99990;display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;font-family:inherit}
.aapp-modal{background:#fff;border-radius:18px;box-shadow:0 25px 60px rgba(0,0,0,.3);width:min(900px,100%);max-height:90vh;display:flex;flex-direction:column;overflow:hidden}
.aapp-head{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #eef2f7;background:linear-gradient(135deg,#f8fafc,#fff)}
.aapp-tabs{display:flex;gap:4px;padding:8px 16px 0;border-bottom:1px solid #eef2f7;background:#f8fafc}
.aapp-tab{padding:10px 18px;background:none;border:0;cursor:pointer;font-size:14px;font-weight:600;color:#64748b;border-bottom:2px solid transparent;font-family:inherit}
.aapp-tab.active{color:#0ea5e9;border-color:#0ea5e9}
.aapp-tab .badge{background:#ef4444;color:#fff;border-radius:10px;padding:0 6px;font-size:11px;margin-right:4px}
.aapp-body{flex:1;overflow-y:auto;padding:16px 22px;display:flex;flex-direction:column;gap:10px}
.aapp-card{border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff}
.aapp-card .top{display:flex;justify-content:space-between;align-items:start;gap:12px}
.aapp-card .ref{font-weight:700;color:#0f172a}
.aapp-card .meta{font-size:12px;color:#64748b;margin-top:4px}
.aapp-card .note{font-size:13px;color:#1e293b;background:#f8fafc;border-radius:8px;padding:8px;margin-top:8px}
.aapp-status{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap}
.aapp-status.pending{background:#fef3c7;color:#a16207}
.aapp-status.approved{background:#dcfce7;color:#15803d}
.aapp-status.rejected{background:#fee2e2;color:#dc2626}
.aapp-actions{display:flex;gap:6px;margin-top:10px}
.aapp-btn{padding:8px 14px;border-radius:8px;border:0;cursor:pointer;font-weight:600;font-size:12px;font-family:inherit}
.aapp-btn.approve{background:#16a34a;color:#fff}
.aapp-btn.reject{background:#dc2626;color:#fff}
.aapp-x{background:none;border:0;font-size:24px;cursor:pointer;color:#64748b;width:32px;height:32px;border-radius:8px}
.aapp-empty{text-align:center;color:#94a3b8;padding:40px}
`;document.head.appendChild(s);
  }
  function escape(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  let state = { tab:'pending', list:[] };
  async function open(){
    injectStyles();
    let m=document.querySelector('.aapp-bd');
    if(!m){m=document.createElement('div');m.className='aapp-bd';m.addEventListener('click',e=>{if(e.target===m)close();});document.body.appendChild(m);}
    render(m); await refresh();
  }
  function close(){ document.querySelector('.aapp-bd')?.remove(); }
  async function refresh(){
    try { const r = await api('/api/approvals?status='+state.tab); state.list = Array.isArray(r)?r:[]; } catch(_){ state.list=[]; }
    const m=document.querySelector('.aapp-bd'); if(m) render(m);
  }
  function render(m){
    const pendingCount = state.tab==='pending'?state.list.length:'';
    const isAdmin = me()?.role === 'admin';
    m.innerHTML = `
      <div class="aapp-modal" onclick="event.stopPropagation()">
        <div class="aapp-head">
          <div style="font-size:18px;font-weight:700">📋 طلبات الاعتماد</div>
          <button class="aapp-x" onclick="ArsanApprovals.close()">×</button>
        </div>
        <div class="aapp-tabs">
          <button class="aapp-tab ${state.tab==='pending'?'active':''}" onclick="ArsanApprovals._tab('pending')">⏳ معلّقة ${pendingCount?`<span class="badge">${pendingCount}</span>`:''}</button>
          <button class="aapp-tab ${state.tab==='approved'?'active':''}" onclick="ArsanApprovals._tab('approved')">✅ معتمدة</button>
          <button class="aapp-tab ${state.tab==='rejected'?'active':''}" onclick="ArsanApprovals._tab('rejected')">❌ مرفوضة</button>
        </div>
        <div class="aapp-body">
          ${state.list.length===0?'<div class="aapp-empty">لا توجد طلبات</div>':
            state.list.map(a=>`
              <div class="aapp-card">
                <div class="top">
                  <div>
                    <div class="ref">📎 ${escape(a.sopRef)}</div>
                    <div class="meta">طلب من <b>${escape(a.requestedBy)}</b> · ${new Date(a.requestedAt).toLocaleString('ar-SA')}</div>
                  </div>
                  <span class="aapp-status ${a.status}">${({pending:'معلّق',approved:'معتمد',rejected:'مرفوض'})[a.status]}</span>
                </div>
                ${a.note?`<div class="note">${escape(a.note)}</div>`:''}
                ${a.decisionNote?`<div class="note" style="background:#fef3c7">قرار: ${escape(a.decisionNote)} — بواسطة ${escape(a.decidedBy||'')}</div>`:''}
                ${(state.tab==='pending' && isAdmin)?`<div class="aapp-actions">
                  <button class="aapp-btn approve" onclick="ArsanApprovals._decide('${a.id}','approved')">✅ اعتماد</button>
                  <button class="aapp-btn reject" onclick="ArsanApprovals._decide('${a.id}','rejected')">❌ رفض</button>
                </div>`:''}
              </div>`).join('')}
        </div>
      </div>`;
  }
  function _tab(t){ state.tab=t; refresh(); }
  async function _decide(id, decision){
    const note = prompt(decision==='approved'?'ملاحظة الاعتماد (اختياري):':'سبب الرفض:') || '';
    const r = await api('/api/approvals/'+id+'/decide',{method:'POST',body:JSON.stringify({decision,note})});
    if (r.ok) await refresh(); else alert('فشل: '+(r.error||''));
  }
  async function request(sopRef){
    const note = prompt('ملاحظة لطلب الاعتماد (اختياري):') || '';
    const r = await api('/api/approvals',{method:'POST',body:JSON.stringify({sopRef, note})});
    if (r.ok) alert('✅ أُرسل طلب الاعتماد'); else alert('فشل: '+(r.error||''));
  }
  window.ArsanApprovals = { open, close, refresh, request, _tab, _decide };
})();

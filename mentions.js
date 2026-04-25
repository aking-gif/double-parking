/**
 * mentions.js — جرس الإشعارات الحقيقي (mentions + system notifications)
 * يستبدل أو يكمّل notifications.js القديم.
 *
 * Endpoints:
 *   GET  /api/mentions
 *   POST /api/mentions/:id/read
 *   POST /api/mentions/read-all
 */
(function(){
  'use strict';
  if (window.ArsanMentions) return;

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

  function injectStyles(){
    if (document.getElementById('amen-styles')) return;
    const s = document.createElement('style');
    s.id = 'amen-styles';
    s.textContent = `
.amen-bell{position:fixed;top:14px;left:20px;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);box-shadow:0 4px 14px rgba(0,0,0,.1);border:1px solid rgba(0,0,0,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:9998;font-size:18px;transition:transform .2s}
.amen-bell:hover{transform:scale(1.08)}
.amen-bell .dot{position:absolute;top:6px;right:6px;background:#ef4444;color:#fff;border-radius:10px;font-size:10px;font-weight:700;min-width:18px;height:18px;padding:0 5px;display:flex;align-items:center;justify-content:center;border:2px solid #fff}
.amen-panel{position:fixed;top:64px;left:20px;width:360px;max-height:520px;background:#fff;border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.18);z-index:9999;overflow:hidden;display:flex;flex-direction:column;animation:amenIn .2s ease}
@keyframes amenIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.amen-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eef2f7;background:linear-gradient(135deg,#f8fafc,#fff)}
.amen-head .t{font-weight:700;color:#0f172a;font-size:15px}
.amen-mark{background:none;border:0;color:#0ea5e9;cursor:pointer;font-size:12px;font-weight:600}
.amen-list{overflow-y:auto;flex:1}
.amen-item{padding:12px 16px;border-bottom:1px solid #eef2f7;cursor:pointer;display:grid;gap:4px}
.amen-item:hover{background:#f8fafc}
.amen-item.unread{background:#f0f9ff;border-right:3px solid #0ea5e9}
.amen-item .head{display:flex;justify-content:space-between;align-items:center}
.amen-item .from{font-size:12px;color:#0ea5e9;font-weight:600}
.amen-item .time{font-size:11px;color:#94a3b8}
.amen-item .msg{font-size:13px;color:#1e293b;line-height:1.5}
.amen-item .ref{font-size:11px;color:#64748b;background:#f1f5f9;padding:2px 6px;border-radius:6px;display:inline-block;width:fit-content}
.amen-empty{padding:40px 16px;text-align:center;color:#94a3b8;font-size:13px}
`;
    document.head.appendChild(s);
  }

  function fmtTime(ts){
    const diff = (Date.now()-ts)/1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return Math.floor(diff/60)+' د';
    if (diff < 86400) return Math.floor(diff/3600)+' س';
    return new Date(ts).toLocaleDateString('ar-SA');
  }

  let state = { items: [], open: false, polling: null };

  async function fetchAll(){
    if (!tok()) return;
    try {
      const r = await api('/api/mentions');
      state.items = Array.isArray(r) ? r : [];
      renderBell();
      if (state.open) renderPanel();
    } catch(_){}
  }

  function renderBell(){
    let bell = document.querySelector('.amen-bell');
    if (!bell){
      bell = document.createElement('button');
      bell.className = 'amen-bell';
      bell.title = 'الإشعارات';
      bell.innerHTML = '🔔';
      bell.onclick = togglePanel;
      document.body.appendChild(bell);
    }
    const unread = state.items.filter(i => !i.read).length;
    let dot = bell.querySelector('.dot');
    if (unread > 0){
      if (!dot){ dot = document.createElement('span'); dot.className = 'dot'; bell.appendChild(dot); }
      dot.textContent = unread > 99 ? '99+' : unread;
    } else if (dot) dot.remove();
  }

  function renderPanel(){
    let p = document.querySelector('.amen-panel');
    if (!state.open){ p?.remove(); return; }
    if (!p){
      p = document.createElement('div');
      p.className = 'amen-panel';
      document.body.appendChild(p);
    }
    p.innerHTML = `
      <div class="amen-head">
        <span class="t">🔔 الإشعارات</span>
        <button class="amen-mark" onclick="ArsanMentions.markAll()">تحديد الكل كمقروء</button>
      </div>
      <div class="amen-list">
        ${state.items.length === 0 ? '<div class="amen-empty">لا توجد إشعارات</div>' :
          state.items.map(i => `
            <div class="amen-item ${!i.read?'unread':''}" onclick="ArsanMentions._click('${i.id}', ${i.sopRef?`'${i.sopRef}'`:'null'})">
              <div class="head">
                <span class="from">${escape(i.from||'النظام')}</span>
                <span class="time">${fmtTime(i.ts)}</span>
              </div>
              <div class="msg">${escape(i.message||'')}</div>
              ${i.sopRef?`<span class="ref">📎 ${escape(i.sopRef)}</span>`:''}
            </div>`).join('')}
      </div>`;
  }
  function escape(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  function togglePanel(){
    state.open = !state.open;
    renderPanel();
    if (state.open){
      setTimeout(() => {
        document.addEventListener('click', closeOnOutside, { once: true });
      }, 0);
    }
  }
  function closeOnOutside(e){
    if (e.target.closest('.amen-panel') || e.target.closest('.amen-bell')) {
      document.addEventListener('click', closeOnOutside, { once: true });
      return;
    }
    state.open = false;
    renderPanel();
  }
  async function _click(id, sopRef){
    const item = state.items.find(x => x.id === id);
    if (item && !item.read){
      item.read = true;
      try { await api('/api/mentions/'+id+'/read', {method:'POST'}); } catch(_){}
      renderBell();
      renderPanel();
    }
    if (sopRef && sopRef !== 'null'){
      const [dept, code] = String(sopRef).split('/');
      if (dept && code){
        // حاول فتح الإجراء
        if (window.openSop) window.openSop(code);
        else if (location.pathname.endsWith('/index.html') || location.pathname === '/' || location.pathname.endsWith('/')) {
          location.href = 'dashboard.html?dept='+dept+'&open='+code;
        }
      }
    }
  }
  async function markAll(){
    state.items.forEach(i => i.read = true);
    try { await api('/api/mentions/read-all', {method:'POST'}); } catch(_){}
    renderBell();
    renderPanel();
  }

  function init(){
    if (!me()) return;
    injectStyles();
    fetchAll();
    // poll كل 60 ثانية
    if (state.polling) clearInterval(state.polling);
    state.polling = setInterval(fetchAll, 60000);
  }

  window.ArsanMentions = { init, fetchAll, markAll, _click };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

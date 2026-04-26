/* ============================================================
   Action Required Feed — يجمع كل ما يحتاج اهتمام المستخدم
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } };
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(p,o){o=o||{};const r=await fetch(API_BASE+p,{method:o.method||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok()},body:o.body?JSON.stringify(o.body):undefined});if(!r.ok)throw new Error(await r.text()||'HTTP '+r.status);return r.json();}

  async function gather(){
    const u = me(); if (!u) return { items:[], total:0 };
    const items = [];
    try {
      // SOPs awaiting approval
      const b = await api('/api/bootstrap');
      Object.keys(b.sops||{}).forEach(dept => Object.keys(b.sops[dept]||{}).forEach(code => {
        const s = b.sops[dept][code];
        if (s.status === 'review' && ((s.reviewer||'').toLowerCase() === (u.email||'').toLowerCase() || u.role==='admin'))
          items.push({ kind:'approval', label:`اعتمد ${dept}/${code}`, sub: s.title, ts: s.statusUpdatedAt, action: ()=>{ window.location.href = `dashboard.html?dept=${dept}#${code}`; } });
      }));
    } catch(_){}
    try {
      const tasks = (await api('/api/tasks?assignee='+encodeURIComponent(u.email))).tasks || [];
      tasks.filter(t => t.status !== 'done').forEach(t => items.push({ kind:'task', label:t.title, sub:'مهمة مسندة', ts:t.dueAt, action:null }));
    } catch(_){}
    try {
      const ms = (await api('/api/mentions')).mentions || [];
      ms.filter(m=>!m.read).slice(0,10).forEach(m => items.push({ kind:'mention', label:m.message, sub:'@إشارة', ts:m.at, action:null }));
    } catch(_){}
    items.sort((a,b)=>(b.ts||0)-(a.ts||0));
    return { items, total: items.length };
  }

  let badge = null;
  async function tick(){
    const { total } = await gather();
    if (!badge) injectFab();
    if (badge) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = total > 0 ? 'flex' : 'none';
    }
  }

  function injectFab(){
    if (document.getElementById('action-feed-fab')) { badge = document.querySelector('#action-feed-fab .badge'); return; }
    const fab = document.createElement('button');
    fab.id = 'action-feed-fab';
    fab.title = 'الإجراءات المطلوبة منك';
    fab.style.cssText = 'position:fixed;bottom:74px;inset-inline-end:20px;width:48px;height:48px;border-radius:50%;background:var(--brand,#bf9b30);color:#fff;border:0;font-size:18px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3);z-index:9998;display:flex;align-items:center;justify-content:center;position:fixed';
    fab.innerHTML = '🔔<span class="badge" style="position:absolute;top:-4px;inset-inline-end:-4px;background:#e03131;color:#fff;font-size:10px;border-radius:10px;padding:1px 5px;display:none;align-items:center;justify-content:center;font-weight:700;min-width:16px;height:16px">0</span>';
    fab.onclick = openFeed;
    document.body.appendChild(fab);
    badge = fab.querySelector('.badge');
  }

  async function openFeed(){
    const { items } = await gather();
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    bd.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink);border-radius:12px;max-width:480px;width:100%;max-height:80vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)">
      <div style="padding:16px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">🔔 يحتاج اهتمامك (${items.length})</h3>
        <button data-x style="background:none;border:0;font-size:22px;cursor:pointer">×</button>
      </div>
      <div data-list>
        ${items.length ? items.map((it,i)=>{
          const colors = { approval:'#fff3bf', task:'#d3f9d8', mention:'#dbe4ff' };
          const fg = { approval:'#8a6d00', task:'#2b7a3a', mention:'#364fc7' };
          return `<div data-idx="${i}" style="padding:12px 16px;border-bottom:1px solid var(--line);cursor:pointer;display:flex;gap:10px;align-items:flex-start">
            <span style="background:${colors[it.kind]||'#eee'};color:${fg[it.kind]||'#333'};padding:3px 9px;border-radius:10px;font-size:10.5px;font-weight:600;flex-shrink:0">${it.kind}</span>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:13px">${esc(it.label||'')}</div>
              <div style="font-size:11.5px;color:var(--ink-3);margin-top:2px">${esc(it.sub||'')}</div>
            </div>
          </div>`;
        }).join('') : '<div style="padding:30px;text-align:center;color:var(--ink-3)">كل شيء على ما يرام ✨</div>'}
      </div>
    </div>`;
    document.body.appendChild(bd);
    bd.querySelector('[data-x]').onclick = () => bd.remove();
    bd.addEventListener('click', e => { if(e.target===bd) bd.remove(); });
    bd.querySelectorAll('[data-idx]').forEach(el => {
      el.onclick = () => { const i = +el.dataset.idx; if (items[i].action) items[i].action(); else bd.remove(); };
    });
  }

  function init(){
    injectFab();
    tick();
    setInterval(tick, 30000);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

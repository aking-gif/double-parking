/* ============================================================
   Product Layer (v1) — Command Bar (/) + Smart Builder + Diff
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(p,o){o=o||{};const r=await fetch(API_BASE+p,{method:o.method||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok()},body:o.body?JSON.stringify(o.body):undefined});if(!r.ok)throw new Error(await r.text()||'HTTP '+r.status);return r.json();}

  /* Command Bar — press '/' to open */
  let bar = null;
  function openCmdBar(){
    if (bar) { bar.querySelector('input').focus(); return; }
    bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);width:560px;max-width:90vw;background:var(--card,#fff);color:var(--ink);border:1px solid var(--line);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.4);z-index:99999;overflow:hidden';
    bar.innerHTML = `<input type="text" placeholder="/ — ابحث، أنشئ مهمة، أرسل رسالة، أو افتح إجراءً…" style="width:100%;padding:14px 18px;border:0;background:transparent;color:var(--ink);font-size:15px;outline:none">
      <div data-results style="max-height:340px;overflow:auto;border-top:1px solid var(--line)"></div>`;
    document.body.appendChild(bar);
    const input = bar.querySelector('input');
    const results = bar.querySelector('[data-results]');
    input.focus();

    function close(){ bar.remove(); bar = null; }
    bar.addEventListener('click', e => { if(e.target===bar) close(); });
    document.addEventListener('keydown', function ek(e){
      if (e.key==='Escape' && bar) { close(); document.removeEventListener('keydown', ek); }
    });

    function render(q){
      results.innerHTML = '';
      if (!q) {
        results.innerHTML = `<div style="padding:14px;color:var(--ink-3);font-size:12.5px">
          <div style="margin-bottom:6px"><b>أوامر سريعة:</b></div>
          <div>• <code>/sop عنوان</code> — افتح إجراءً</div>
          <div>• <code>/task عنوان</code> — أنشئ مهمة جديدة</div>
          <div>• <code>/msg إدارة محتوى</code> — أرسل رسالة للإدارة</div>
          <div>• <code>/new</code> — إنشاء إجراء جديد</div>
        </div>`;
        return;
      }
      // commands
      if (q.startsWith('/task ')) {
        const t = q.slice(6).trim();
        results.innerHTML = `<div data-act="task" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--line)"><b>+ إنشاء مهمة:</b> ${esc(t)}</div>`;
        results.querySelector('[data-act="task"]').onclick = async () => {
          try { await api('/api/tasks',{method:'POST',body:{title:t,dept:window.CURRENT_DEPT_ID,status:'pending',dueAt:Date.now()+86400000}}); close(); }
          catch(e){ alert(e.message); }
        };
        return;
      }
      if (q.startsWith('/new')) {
        results.innerHTML = `<div data-act="new" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--line)"><b>+ إنشاء إجراء جديد</b></div>`;
        results.querySelector('[data-act="new"]').onclick = () => { close(); if (typeof window.openSmartBuilder==='function') window.openSmartBuilder(); else if (typeof window.addNewSop==='function') window.addNewSop(); };
        return;
      }
      if (q.startsWith('/msg ')) {
        const txt = q.slice(5);
        results.innerHTML = `<div data-act="msg" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--line)"><b>📨 رسالة:</b> ${esc(txt)}</div>`;
        results.querySelector('[data-act="msg"]').onclick = () => { close(); alert('استخدم تبويب الرسائل من إدارة المنصّة'); };
        return;
      }
      // search SOPs (cross-dept)
      const ql = q.toLowerCase();
      const matches = (window.SOPS||[]).filter(s=>(s.code+' '+s.title+' '+(s.desc||'')).toLowerCase().includes(ql)).slice(0,8);
      if (!matches.length) {
        results.innerHTML = `<div style="padding:14px;color:var(--ink-3)">لا نتائج محلية. اضغط Enter للبحث الكامل…</div>`;
        return;
      }
      results.innerHTML = matches.map((s,i)=>`<div data-idx="${i}" style="padding:10px 16px;cursor:pointer;border-bottom:1px solid var(--line);display:flex;justify-content:space-between">
        <span><b>${esc(s.code)}</b> ${esc(s.title)}</span>
        <span style="color:var(--ink-3);font-size:11.5px">${esc(s.phase||'')}</span>
      </div>`).join('');
      results.querySelectorAll('[data-idx]').forEach(el => {
        el.onclick = () => {
          const i = +el.dataset.idx;
          const code = matches[i].code;
          const realIdx = (window.SOPS||[]).findIndex(s=>s.code===code);
          close();
          if (realIdx>=0 && typeof window.openModal==='function') window.openModal(realIdx);
        };
      });
    }
    input.addEventListener('input', () => render(input.value.trim()));
    render('');
  }

  document.addEventListener('keydown', e => {
    if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable){
      e.preventDefault();
      openCmdBar();
    }
  });

  /* Floating "/" hint button */
  function injectHint(){
    if (document.getElementById('cmd-hint-fab')) return;
    const b = document.createElement('button');
    b.id = 'cmd-hint-fab';
    b.title = 'اضغط / للأوامر السريعة';
    b.textContent = '/';
    b.style.cssText = 'position:fixed;bottom:20px;inset-inline-end:20px;width:42px;height:42px;border-radius:50%;background:#0F1B2D;color:#fff;border:0;font-size:18px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3);z-index:9998';
    b.onclick = openCmdBar;
    document.body.appendChild(b);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', injectHint);
  else injectHint();

  window.ArsanCmdBar = { open: openCmdBar };
})();

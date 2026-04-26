/* ============================================================
   Command Bar (/) — نفس تصميم زر الجولة، فوق زر الجولة (RTL)
   اضغط / في أي مكان لفتحه
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(p,o){o=o||{};const r=await fetch(API_BASE+p,{method:o.method||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok()},body:o.body?JSON.stringify(o.body):undefined});if(!r.ok)throw new Error(await r.text()||'HTTP '+r.status);return r.json();}

  /* === Inject button styled like #at-launch, stacked above it === */
  function injectStyles(){
    if (document.getElementById('arsan-cmdbar-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-cmdbar-styles';
    s.textContent = `
      #ac-launch{
        position:fixed;
        bottom:136px;                /* 80 (tour) + 44 + 12 gap */
        inset-inline-end:24px;
        inset-inline-start:auto;
        z-index:9450;
        width:44px;height:44px;padding:0;
        background:rgba(26,21,16,.55);
        backdrop-filter:blur(14px) saturate(180%);
        -webkit-backdrop-filter:blur(14px) saturate(180%);
        color:#E8EEF5;
        border:1px solid rgba(61,90,128,.35);
        border-radius:12px;
        cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 14px rgba(0,0,0,.22);
        transition:background .15s, border-color .15s, transform .15s, opacity .15s;
        opacity:.85;
        font-family:"IBM Plex Sans Arabic", system-ui, sans-serif;
        font-weight:700;font-size:18px;
      }
      html[data-theme="light"] #ac-launch{
        background:rgba(255,255,255,.55);
        color:#1A2942;
        border-color:rgba(61,90,128,.35);
      }
      #ac-launch:hover{
        opacity:1;
        background:rgba(61,90,128,.25);
        border-color:rgba(61,90,128,.6);
        transform:translateY(-1px);
      }
      #ac-launch .ic{
        width:22px;height:22px;display:inline-flex;
        align-items:center;justify-content:center;
        font-weight:700;font-size:18px;
      }

      /* Command bar overlay */
      .ac-bd{position:fixed;inset:0;z-index:9700;display:flex;align-items:flex-start;justify-content:center;padding:80px 20px;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);}
      .ac-card{background:rgba(15,27,45,.92);backdrop-filter:blur(20px) saturate(180%);color:#E8EEF5;border:1px solid rgba(61,90,128,.4);border-radius:14px;width:560px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;}
      html[data-theme="light"] .ac-card{background:rgba(250,246,234,.95);color:#1A2942;border-color:rgba(61,90,128,.4);}
      .ac-card input{width:100%;padding:14px 18px;border:0;background:transparent;color:inherit;font-size:15px;outline:none;font-family:inherit;}
      .ac-results{max-height:340px;overflow:auto;border-top:1px solid rgba(61,90,128,.25);}
      .ac-results>*{padding:11px 16px;border-bottom:1px solid rgba(61,90,128,.15);cursor:pointer;font-size:13px;}
      .ac-results>*:hover{background:rgba(61,90,128,.18);}
      .ac-hint{padding:14px 18px;font-size:12.5px;opacity:.7;line-height:1.8;}
      .ac-hint code{background:rgba(61,90,128,.25);padding:1px 6px;border-radius:4px;font-family:monospace;}
    `;
    document.head.appendChild(s);
  }

  let bar = null;
  function open(){
    if (bar) { bar.querySelector('input').focus(); return; }
    injectStyles();
    bar = document.createElement('div');
    bar.className = 'ac-bd';
    bar.innerHTML = `<div class="ac-card" dir="rtl">
      <input type="text" placeholder="/ — ابحث، أنشئ مهمة، أو افتح إجراءً…">
      <div class="ac-results"></div>
    </div>`;
    document.body.appendChild(bar);
    const input = bar.querySelector('input');
    const results = bar.querySelector('.ac-results');
    input.focus();

    function close(){ bar.remove(); bar = null; }
    bar.addEventListener('click', e => { if(e.target===bar) close(); });
    document.addEventListener('keydown', function ek(e){
      if (e.key==='Escape' && bar) { close(); document.removeEventListener('keydown', ek); }
    });

    function render(q){
      results.innerHTML = '';
      if (!q) {
        results.innerHTML = `<div class="ac-hint" style="cursor:default">
          <div><b>الأوامر السريعة:</b></div>
          <div>• <code>/sop عنوان</code> — افتح إجراءً</div>
          <div>• <code>/task عنوان</code> — أنشئ مهمة</div>
          <div>• <code>/new</code> — إجراء جديد</div>
        </div>`;
        return;
      }
      if (q.startsWith('/task ')) {
        const t = q.slice(6).trim();
        const el = document.createElement('div');
        el.innerHTML = `<b>+ مهمة جديدة:</b> ${esc(t)}`;
        el.onclick = async () => {
          try {
            await api('/api/tasks',{method:'POST',body:{title:t,dept:window.CURRENT_DEPT_ID,status:'pending',dueAt:Date.now()+86400000}});
            close();
          } catch(e){ alert('فشل: '+e.message); }
        };
        results.appendChild(el);
        return;
      }
      if (q.startsWith('/new')) {
        const el = document.createElement('div');
        el.innerHTML = `<b>+ إنشاء إجراء جديد</b>`;
        el.onclick = () => {
          close();
          if (typeof window.openSmartBuilder==='function') window.openSmartBuilder();
          else if (typeof window.addNewSop==='function') window.addNewSop();
        };
        results.appendChild(el);
        return;
      }
      // search SOPs
      const ql = q.toLowerCase();
      const matches = (window.SOPS||[]).filter(s=>(s.code+' '+s.title+' '+(s.desc||'')).toLowerCase().includes(ql)).slice(0,8);
      if (!matches.length) {
        const el = document.createElement('div');
        el.style.cssText = 'cursor:default;opacity:.6';
        el.textContent = 'لا نتائج محلية.';
        results.appendChild(el);
        return;
      }
      matches.forEach(s => {
        const el = document.createElement('div');
        el.style.cssText = 'display:flex;justify-content:space-between;gap:10px';
        el.innerHTML = `<span><b>${esc(s.code)}</b> ${esc(s.title)}</span><span style="opacity:.6;font-size:11.5px">${esc(s.phase||'')}</span>`;
        el.onclick = () => {
          const realIdx = (window.SOPS||[]).findIndex(x=>x.code===s.code);
          close();
          if (realIdx>=0 && typeof window.openModal==='function') window.openModal(realIdx);
        };
        results.appendChild(el);
      });
    }
    input.addEventListener('input', () => render(input.value.trim()));
    render('');
  }

  /* / hotkey */
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable){
      e.preventDefault();
      open();
    }
  });

  /* Floating button (matches tour pill) */
  function injectBtn(){
    if (document.getElementById('ac-launch')) return;
    injectStyles();
    const b = document.createElement('button');
    b.id = 'ac-launch';
    b.type = 'button';
    b.title = 'أوامر سريعة (اضغط /)';
    b.setAttribute('aria-label','Command bar');
    b.innerHTML = '<span class="ic">/</span>';
    b.onclick = open;
    document.body.appendChild(b);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', injectBtn);
  else injectBtn();

  window.ArsanCmdBar = { open };
})();

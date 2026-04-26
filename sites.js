/* ============================================================
   Sites Layer (v1) — إدارة المواقع التشغيلية
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } };
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(p,o){o=o||{};const r=await fetch(API_BASE+p,{method:o.method||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok()},body:o.body?JSON.stringify(o.body):undefined});if(!r.ok)throw new Error(await r.text()||'HTTP '+r.status);return r.json();}
  function toast(m,k){const e=document.createElement('div');e.textContent=m;e.style.cssText=`position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${k==='err'?'#c92a2a':'#2b7a3a'};color:#fff;padding:10px 20px;border-radius:8px;z-index:99999;font-size:14px`;document.body.appendChild(e);setTimeout(()=>e.remove(),2500);}

  async function listSites(){ try { return (await api('/api/sites')).sites || []; } catch(_){ return []; } }

  async function openSitesUI(){
    const u = me(); const isAdmin = u && u.role === 'admin';
    const sites = await listSites();
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    bd.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink);border-radius:12px;padding:20px;max-width:680px;width:100%;max-height:85vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)" dir="rtl">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 style="margin:0">📍 المواقع التشغيلية (${sites.length})</h3>
        <button data-x style="background:none;border:0;font-size:22px;cursor:pointer">×</button>
      </div>
      ${isAdmin ? `<div style="background:var(--surface);padding:12px;border-radius:8px;margin-bottom:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px">
          <input data-id placeholder="ID (via-riyadh)" style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
          <input data-name placeholder="الاسم" style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
          <input data-city placeholder="المدينة" style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
          <select data-type style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
            <option value="mall">مول</option><option value="airport">مطار</option><option value="hospital">مستشفى</option><option value="hotel">فندق</option><option value="other">أخرى</option>
          </select>
        </div>
        <div style="display:flex;gap:6px;margin-top:6px">
          <input data-mgr placeholder="مدير الموقع (إيميل)" style="flex:1;padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
          <button data-add style="background:var(--brand,#bf9b30);color:#fff;border:0;padding:6px 16px;border-radius:5px;cursor:pointer;font-weight:600">+ موقع</button>
        </div>
      </div>` : ''}
      <div data-list style="display:flex;flex-direction:column;gap:8px">
        ${sites.length ? sites.map(s => `<div data-row="${esc(s.id)}" style="display:flex;justify-content:space-between;align-items:center;background:var(--surface);padding:10px;border-radius:8px;border:1px solid var(--line)">
          <div>
            <div style="font-weight:600">${esc(s.name)} <span style="font-size:11px;color:var(--ink-3);font-weight:400">(${esc(s.id)})</span></div>
            <div style="font-size:11.5px;color:var(--ink-3)">${esc(s.city||'—')} · ${esc(s.type||'—')} · ${esc(s.manager||'—')}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="background:${s.status==='active'?'#d3f9d8':'#ffe3e3'};color:${s.status==='active'?'#2b7a3a':'#a61e1e'};padding:2px 9px;border-radius:10px;font-size:10.5px;font-weight:600">${esc(s.status||'active')}</span>
            ${isAdmin ? `<button data-del="${esc(s.id)}" style="background:none;border:0;color:#c33;cursor:pointer;font-size:14px">×</button>` : ''}
          </div>
        </div>`).join('') : '<div style="text-align:center;color:var(--ink-3);padding:30px">لا توجد مواقع. ${isAdmin?"أضف الموقع الأول أعلاه.":""}</div>'}
      </div>
    </div>`;
    document.body.appendChild(bd);
    bd.querySelector('[data-x]').onclick = () => bd.remove();
    bd.addEventListener('click', e => { if(e.target===bd) bd.remove(); });
    if (isAdmin) {
      bd.querySelector('[data-add]').onclick = async () => {
        const id = bd.querySelector('[data-id]').value.trim();
        const name = bd.querySelector('[data-name]').value.trim();
        if (!id || !name) return toast('ID والاسم مطلوبان','err');
        try {
          await api('/api/sites',{method:'POST',body:{id,name,city:bd.querySelector('[data-city]').value.trim(),type:bd.querySelector('[data-type]').value,manager:bd.querySelector('[data-mgr]').value.trim()}});
          toast('✓ أُضيف');
          bd.remove(); openSitesUI();
        } catch(e){ toast('فشل: '+e.message,'err'); }
      };
      bd.querySelectorAll('[data-del]').forEach(b => {
        b.onclick = async () => {
          if (!confirm('حذف الموقع؟')) return;
          try { await api('/api/sites/'+b.dataset.del,{method:'DELETE'}); bd.remove(); openSitesUI(); }
          catch(e){ toast('فشل: '+e.message,'err'); }
        };
      });
    }
  }

  /* Inject button into topbar */
  function injectBtn(){
    if (document.getElementById('sites-btn')) return;
    const slot = document.querySelector('.topbar-actions') || document.querySelector('.topbar') || document.querySelector('.header');
    if (!slot) return;
    const b = document.createElement('button');
    b.id = 'sites-btn'; b.type = 'button'; b.textContent = '📍 المواقع'; b.title = 'المواقع التشغيلية';
    b.style.cssText = 'background:transparent;border:1px solid var(--line,#ddd);color:var(--ink-2);padding:5px 10px;border-radius:5px;font-size:12px;cursor:pointer;margin-inline-start:6px';
    b.onclick = openSitesUI;
    slot.appendChild(b);
  }
  function init(){ injectBtn(); setInterval(injectBtn, 3000); }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.ArsanSites = { listSites, openSitesUI };
})();

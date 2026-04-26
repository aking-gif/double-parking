/* ============================================================
   Auto-Triggers (v1) — مشغّلات تلقائية cron-like
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } };
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(p,o){o=o||{};const r=await fetch(API_BASE+p,{method:o.method||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok()},body:o.body?JSON.stringify(o.body):undefined});if(!r.ok)throw new Error(await r.text()||'HTTP '+r.status);return r.json();}
  function toast(m,k){const e=document.createElement('div');e.textContent=m;e.style.cssText=`position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${k==='err'?'#c92a2a':'#2b7a3a'};color:#fff;padding:10px 20px;border-radius:8px;z-index:99999;font-size:14px`;document.body.appendChild(e);setTimeout(()=>e.remove(),2500);}

  async function openTriggersUI(){
    const u = me(); const isAdmin = u && u.role === 'admin';
    if (!isAdmin) return toast('للأدمن فقط','err');
    const [trg, sites] = await Promise.all([
      api('/api/triggers').then(r=>r.triggers||[]).catch(()=>[]),
      api('/api/sites').then(r=>r.sites||[]).catch(()=>[])
    ]);
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    bd.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink);border-radius:12px;padding:20px;max-width:720px;width:100%;max-height:85vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)" dir="rtl">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 style="margin:0">⏰ المشغّلات التلقائية (${trg.length})</h3>
        <div style="display:flex;gap:8px">
          <button data-run style="background:#0F1B2D;color:#fff;border:0;padding:6px 12px;border-radius:5px;cursor:pointer;font-size:12px">▶ تشغيل الآن</button>
          <button data-x style="background:none;border:0;font-size:22px;cursor:pointer">×</button>
        </div>
      </div>
      <div style="background:var(--surface);padding:12px;border-radius:8px;margin-bottom:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
          <input data-sopref placeholder="مرجع الإجراء (operations/SOP-001)" style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
          <select data-site style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
            <option value="">-- اختر موقع --</option>
            ${sites.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px">
          <select data-type style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
            <option value="daily">يومياً</option><option value="weekly">أسبوعياً</option>
          </select>
          <select data-dow style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
            ${days.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}
          </select>
          <input data-time type="time" value="08:00" style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
          <input data-assignee type="email" placeholder="مسؤول" style="padding:6px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12px">
        </div>
        <button data-add style="background:var(--brand,#bf9b30);color:#fff;border:0;padding:6px 16px;border-radius:5px;cursor:pointer;font-weight:600;margin-top:8px;width:100%">+ إضافة مشغّل</button>
      </div>
      <div data-list style="display:flex;flex-direction:column;gap:8px">
        ${trg.length ? trg.map(t=>{
          const site = sites.find(x=>x.id===t.site);
          return `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface);padding:10px;border-radius:8px;border:1px solid var(--line)">
            <div>
              <div style="font-weight:600;font-size:13px">${esc(t.sopRef)}</div>
              <div style="font-size:11.5px;color:var(--ink-3)">${esc(t.type)} · ${esc(t.time||'')} ${t.type==='weekly'?('· '+(days[t.dayOfWeek]||'')):''} ${site?'· 📍 '+esc(site.name):''} ${t.assignee?'· '+esc(t.assignee):''}</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="background:${t.enabled?'#d3f9d8':'#ffe3e3'};color:${t.enabled?'#2b7a3a':'#a61e1e'};padding:2px 9px;border-radius:10px;font-size:10.5px;font-weight:600">${t.enabled?'مفعّل':'متوقف'}</span>
              <button data-toggle="${esc(t.id)}" style="background:none;border:1px solid var(--line);padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px">${t.enabled?'إيقاف':'تفعيل'}</button>
              <button data-del="${esc(t.id)}" style="background:none;border:0;color:#c33;cursor:pointer;font-size:14px">×</button>
            </div>
          </div>`;
        }).join('') : '<div style="text-align:center;color:var(--ink-3);padding:30px">لا مشغّلات</div>'}
      </div>
    </div>`;
    document.body.appendChild(bd);
    bd.querySelector('[data-x]').onclick = () => bd.remove();
    bd.addEventListener('click', e => { if(e.target===bd) bd.remove(); });
    bd.querySelector('[data-run]').onclick = async () => {
      try { const r = await api('/api/triggers/run',{method:'POST',body:{}}); toast('✓ أُنشئت '+r.created+' مهمة'); }
      catch(e){ toast('فشل: '+e.message,'err'); }
    };
    bd.querySelector('[data-add]').onclick = async () => {
      const sopRef = bd.querySelector('[data-sopref]').value.trim();
      if (!sopRef) return toast('مرجع الإجراء مطلوب','err');
      try {
        await api('/api/triggers',{method:'POST',body:{
          sopRef, site: bd.querySelector('[data-site]').value,
          type: bd.querySelector('[data-type]').value,
          dayOfWeek: +bd.querySelector('[data-dow]').value,
          time: bd.querySelector('[data-time]').value,
          assignee: bd.querySelector('[data-assignee]').value.trim()
        }});
        toast('✓ أُضيف'); bd.remove(); openTriggersUI();
      } catch(e){ toast('فشل: '+e.message,'err'); }
    };
    bd.querySelectorAll('[data-toggle]').forEach(b=>{
      b.onclick = async () => {
        const t = trg.find(x=>x.id===b.dataset.toggle);
        try { await api('/api/triggers/'+b.dataset.toggle,{method:'PATCH',body:{enabled:!t.enabled}}); bd.remove(); openTriggersUI(); }
        catch(e){ toast('فشل: '+e.message,'err'); }
      };
    });
    bd.querySelectorAll('[data-del]').forEach(b=>{
      b.onclick = async () => {
        if (!confirm('حذف المشغّل؟')) return;
        try { await api('/api/triggers/'+b.dataset.del,{method:'DELETE'}); bd.remove(); openTriggersUI(); }
        catch(e){ toast('فشل: '+e.message,'err'); }
      };
    });
  }

  /* Auto-run check on page load (best-effort if user is logged in) */
  async function autoRunCheck(){
    const u = me(); if (!u) return;
    const last = localStorage.getItem('arsan_triggers_last_check');
    const today = new Date().toISOString().slice(0,10);
    if (last === today) return;
    try { await api('/api/triggers/run',{method:'POST',body:{}}); localStorage.setItem('arsan_triggers_last_check', today); } catch(_){}
  }

  function injectBtn(){
    const u = me(); if (!u || u.role !== 'admin') return;
    if (document.getElementById('triggers-btn')) return;
    const slot = document.querySelector('.topbar-actions') || document.querySelector('.topbar') || document.querySelector('.header');
    if (!slot) return;
    const b = document.createElement('button');
    b.id = 'triggers-btn'; b.type='button'; b.textContent='⏰ المشغّلات';
    b.style.cssText = 'background:transparent;border:1px solid var(--line,#ddd);color:var(--ink-2);padding:5px 10px;border-radius:5px;font-size:12px;cursor:pointer;margin-inline-start:6px';
    b.onclick = openTriggersUI;
    slot.appendChild(b);
  }
  function init(){ injectBtn(); setInterval(injectBtn,3000); setTimeout(autoRunCheck, 3000); }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.ArsanTriggers = { openTriggersUI };
})();

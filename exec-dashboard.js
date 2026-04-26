/* ============================================================
   Executive Dashboard — لوحة COO
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } };
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(p,o){o=o||{};const r=await fetch(API_BASE+p,{method:o.method||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok()},body:o.body?JSON.stringify(o.body):undefined});if(!r.ok)throw new Error(await r.text()||'HTTP '+r.status);return r.json();}

  async function open(){
    let s; try { s = await api('/api/exec/summary'); } catch(e){ alert('فشل تحميل الملخص: '+e.message); return; }
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    const compColor = s.tasks.compliance >= 80 ? '#37b24d' : s.tasks.compliance >= 60 ? '#f59f00' : '#e03131';
    const card = (label, value, color) => `<div style="background:var(--surface);border-radius:10px;padding:14px;text-align:center"><div style="font-size:28px;font-weight:700;color:${color||'var(--ink)'};margin-bottom:4px">${value}</div><div style="font-size:11.5px;color:var(--ink-3)">${label}</div></div>`;
    bd.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink);border-radius:14px;padding:24px;max-width:880px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.5)" dir="rtl">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <h2 style="margin:0;font-size:20px">📊 لوحة التحكم التنفيذية</h2>
        <button data-x style="background:none;border:0;font-size:24px;cursor:pointer">×</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">
        ${card('المواقع النشطة', s.sites.active+'/'+s.sites.total)}
        ${card('الإجراءات النشطة', s.sops.active+'/'+s.sops.total, '#37b24d')}
        ${card('درجة الامتثال', s.tasks.compliance+'%', compColor)}
        ${card('اعتمادات معلّقة', s.approvals.pending, s.approvals.pending>0?'#f59f00':'var(--ink)')}
      </div>

      <h3 style="font-size:14px;margin:18px 0 10px">دورة حياة الإجراءات</h3>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:18px">
        ${card('Draft', s.sops.draft, '#868e96')}
        ${card('Review', s.sops.review, '#f59f00')}
        ${card('Approved', s.sops.approved, '#3b5bdb')}
        ${card('Active', s.sops.active, '#37b24d')}
        ${card('Deprecated', s.sops.deprecated, '#c92a2a')}
      </div>

      <h3 style="font-size:14px;margin:18px 0 10px">المهام (${s.tasks.total} مهمة)</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px">
        ${card('مكتمل', s.tasks.completed, '#2b7a3a')}
        ${card('متأخر', s.tasks.late, '#8a6d00')}
        ${card('فائت', s.tasks.missed, '#a61e1e')}
      </div>

      <h3 style="font-size:14px;margin:18px 0 10px">أداء المواقع</h3>
      ${s.perSite.length ? `<div style="border:1px solid var(--line);border-radius:8px;overflow:hidden">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;background:var(--surface);padding:10px;font-size:11.5px;font-weight:700;color:var(--ink-2)">
          <div>الموقع</div><div>المهام</div><div>مكتمل</div><div>فائت</div><div>الدرجة</div>
        </div>
        ${s.perSite.map(p=>{
          const sc = p.score==null?'—':p.score+'%';
          const sCol = p.score==null?'var(--ink-3)':(p.score>=80?'#37b24d':p.score>=60?'#f59f00':'#e03131');
          return `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:10px;border-top:1px solid var(--line);font-size:12.5px">
            <div><b>${esc(p.name)}</b><div style="font-size:10.5px;color:var(--ink-3)">${esc(p.city||'—')}</div></div>
            <div>${p.tasks}</div><div>${p.completed}</div><div style="color:${p.missed>0?'#a61e1e':'var(--ink)'}">${p.missed}</div>
            <div style="font-weight:700;color:${sCol}">${sc}</div>
          </div>`;
        }).join('')}
      </div>` : '<div style="text-align:center;color:var(--ink-3);padding:20px;font-size:13px">لا مواقع مسجّلة</div>'}
    </div>`;
    document.body.appendChild(bd);
    bd.querySelector('[data-x]').onclick = () => bd.remove();
    bd.addEventListener('click', e => { if(e.target===bd) bd.remove(); });
  }

  function injectBtn(){
    const u = me(); if (!u || u.role !== 'admin') return;
    if (document.getElementById('exec-dash-btn')) return;
    const slot = document.querySelector('.topbar-actions') || document.querySelector('.topbar') || document.querySelector('.header');
    if (!slot) return;
    const b = document.createElement('button');
    b.id = 'exec-dash-btn'; b.type='button'; b.textContent='📊 التنفيذية';
    b.style.cssText = 'background:#0F1B2D;color:#E8C547;border:0;padding:5px 12px;border-radius:5px;font-size:12px;cursor:pointer;margin-inline-start:6px;font-weight:600';
    b.onclick = open;
    slot.appendChild(b);
  }
  function init(){ injectBtn(); setInterval(injectBtn,3000); }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.ArsanExecDash = { open };
})();

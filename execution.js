/* ============================================================
   Execution Layer (v1) — SOP → Checklist → Tasks
   - Convert SOP steps into actionable daily/shift tasks
   - Track completion + compliance score
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } };
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(p,o){o=o||{};const r=await fetch(API_BASE+p,{method:o.method||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok()},body:o.body?JSON.stringify(o.body):undefined});if(!r.ok)throw new Error(await r.text()||'HTTP '+r.status);return r.json();}
  function toast(m,k){const e=document.createElement('div');e.textContent=m;e.style.cssText=`position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${k==='err'?'#c92a2a':'#2b7a3a'};color:#fff;padding:10px 20px;border-radius:8px;z-index:99999;font-size:14px`;document.body.appendChild(e);setTimeout(()=>e.remove(),2500);}

  /* Convert SOP → Checklist (creates one task per step) */
  async function sopToChecklist(sop, opts){
    opts = opts || {};
    const steps = (sop.steps||[]).filter(s => {
      const t = typeof s === 'string' ? s : (s && s.text) || '';
      return t && t.trim().length > 0;
    });
    if (!steps.length) { toast('لا توجد خطوات في هذا الإجراء','err'); return; }
    const assignee = opts.assignee || '';
    const dueAt = opts.dueAt || (Date.now() + 24*3600*1000);
    const shift = opts.shift || 'day';
    const created = [];
    for (let i=0; i<steps.length; i++){
      const txt = typeof steps[i] === 'string' ? steps[i] : steps[i].text;
      try {
        const r = await api('/api/tasks', { method:'POST', body: {
          title: `[${sop.code}] ${txt}`,
          description: `من إجراء: ${sop.title}`,
          assignee,
          dueAt,
          dept: window.CURRENT_DEPT_ID,
          sopRef: window.CURRENT_DEPT_ID + '/' + sop.code,
          shift,
          stepIndex: i,
          checklistOf: sop.code,
          status: 'pending'
        }});
        created.push(r.task);
      } catch(e){ console.warn('task err', e); }
    }
    toast(`✓ أُنشئت ${created.length} مهمة من الإجراء`);
    return created;
  }

  /* Open conversion dialog */
  function openConvertDialog(sop){
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    bd.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink);border-radius:12px;padding:20px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.4)">
      <h3 style="margin:0 0 12px;font-size:17px">📋 تحويل إلى قائمة مهام تنفيذية</h3>
      <div style="font-size:12.5px;color:var(--ink-2);margin-bottom:14px">سيتم إنشاء مهمة لكل خطوة من خطوات الإجراء (${(sop.steps||[]).length} خطوة).</div>
      <div style="display:grid;gap:10px">
        <div><label style="font-size:12px;color:var(--ink-3)">المسؤول (إيميل)</label><input type="email" data-assignee placeholder="email@arsann.com" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:13px"></div>
        <div><label style="font-size:12px;color:var(--ink-3)">تاريخ الاستحقاق</label><input type="date" data-due value="${new Date(Date.now()+86400000).toISOString().slice(0,10)}" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:13px"></div>
        <div><label style="font-size:12px;color:var(--ink-3)">الوردية</label>
          <select data-shift style="width:100%;padding:7px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:13px">
            <option value="day">صباحية</option><option value="night">مسائية</option><option value="full">كاملة</option>
          </select></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button data-cancel style="background:none;border:1px solid var(--line);padding:7px 14px;border-radius:5px;cursor:pointer">إلغاء</button>
        <button data-go style="background:var(--brand,#bf9b30);color:#fff;border:0;padding:7px 16px;border-radius:5px;cursor:pointer;font-weight:600">إنشاء المهام</button>
      </div>
    </div>`;
    document.body.appendChild(bd);
    bd.querySelector('[data-cancel]').onclick = () => bd.remove();
    bd.addEventListener('click', e => { if(e.target===bd) bd.remove(); });
    bd.querySelector('[data-go]').onclick = async () => {
      const assignee = bd.querySelector('[data-assignee]').value.trim();
      const dueStr = bd.querySelector('[data-due]').value;
      const shift = bd.querySelector('[data-shift]').value;
      const dueAt = dueStr ? new Date(dueStr).getTime() : Date.now()+86400000;
      bd.querySelector('[data-go]').disabled = true;
      bd.querySelector('[data-go]').textContent = '… جارٍ الإنشاء';
      await sopToChecklist(sop, { assignee, dueAt, shift });
      bd.remove();
    };
  }

  /* Compliance score widget */
  async function computeCompliance(){
    try {
      const tasks = (await api('/api/tasks')).tasks || [];
      const total = tasks.length;
      if (!total) return { total:0, completed:0, score:100, late:0, missed:0 };
      const now = Date.now();
      let completed=0, late=0, missed=0;
      tasks.forEach(t=>{
        if (t.status==='done') {
          completed++;
          if (t.completedAt && t.dueAt && t.completedAt > t.dueAt) late++;
        } else if (t.dueAt && t.dueAt < now) missed++;
      });
      const score = Math.round(((completed - late*0.3 - missed*0.5) / total) * 100);
      return { total, completed, score: Math.max(0, score), late, missed };
    } catch(e){ return { total:0, completed:0, score:0, late:0, missed:0, err:e.message }; }
  }
  async function showCompliance(){
    const c = await computeCompliance();
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    const color = c.score >= 80 ? '#37b24d' : c.score >= 60 ? '#f59f00' : '#e03131';
    bd.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink);border-radius:12px;padding:24px;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)">
      <h3 style="margin:0 0 8px">📊 لوحة الامتثال (Compliance Score)</h3>
      <div style="font-size:64px;font-weight:700;color:${color};margin:14px 0">${c.score}%</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;font-size:12.5px;margin:18px 0">
        <div style="background:var(--surface);padding:10px;border-radius:8px"><div style="font-size:20px;font-weight:600">${c.total}</div><div style="color:var(--ink-3)">الكل</div></div>
        <div style="background:#d3f9d8;padding:10px;border-radius:8px;color:#2b7a3a"><div style="font-size:20px;font-weight:600">${c.completed}</div><div>مكتمل</div></div>
        <div style="background:#fff3bf;padding:10px;border-radius:8px;color:#8a6d00"><div style="font-size:20px;font-weight:600">${c.late}</div><div>متأخر</div></div>
        <div style="background:#ffe3e3;padding:10px;border-radius:8px;color:#a61e1e"><div style="font-size:20px;font-weight:600">${c.missed}</div><div>فائت</div></div>
      </div>
      <button data-x style="background:var(--brand,#bf9b30);color:#fff;border:0;padding:8px 20px;border-radius:6px;cursor:pointer">إغلاق</button>
    </div>`;
    document.body.appendChild(bd);
    bd.querySelector('[data-x]').onclick = () => bd.remove();
    bd.addEventListener('click', e => { if(e.target===bd) bd.remove(); });
  }

  /* Inject "Convert to Checklist" button into SOP modal */
  function injectChecklistBtn(){
    const modal = document.getElementById('modal');
    if (!modal || modal._execHooked) return;
    modal._execHooked = true;
    new MutationObserver(() => {
      if (!modal.classList.contains('open')) return;
      if (modal.querySelector('[data-exec-checklist]')) return;
      const idx = window.state && window.state.openIdx;
      if (typeof idx !== 'number') return;
      const sop = (window.SOPS||[])[idx];
      if (!sop) return;
      const anchor = modal.querySelector('.modal-actions') || modal.querySelector('.modal-header') || modal.querySelector('.modal-content');
      if (!anchor || anchor.querySelector('[data-exec-checklist]')) return;
      const btn = document.createElement('button');
      btn.dataset.execChecklist = '1';
      btn.type = 'button';
      btn.textContent = '📋 إلى قائمة مهام';
      btn.style.cssText = 'background:#0F1B2D;color:#fff;border:0;padding:6px 14px;border-radius:5px;font-size:12px;cursor:pointer;margin-inline-start:6px;font-weight:600';
      btn.onclick = () => openConvertDialog(sop);
      anchor.appendChild(btn);
    }).observe(modal, { attributes:true, attributeFilter:['class','style'] });
  }

  function injectComplianceBtn(){
    if (document.getElementById('exec-compliance-btn')) return;
    const slot = document.querySelector('.topbar-actions') || document.querySelector('.topbar') || document.querySelector('.header');
    if (!slot) return;
    const b = document.createElement('button');
    b.id = 'exec-compliance-btn';
    b.type = 'button';
    b.textContent = '📊 الامتثال';
    b.title = 'لوحة درجة الامتثال';
    b.style.cssText = 'background:transparent;border:1px solid var(--line,#ddd);color:var(--ink-2);padding:5px 10px;border-radius:5px;font-size:12px;cursor:pointer;margin-inline-start:6px';
    b.onclick = showCompliance;
    slot.appendChild(b);
  }

  function init(){
    injectChecklistBtn();
    injectComplianceBtn();
    setInterval(() => { injectChecklistBtn(); injectComplianceBtn(); }, 3000);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.ArsanExec = { sopToChecklist, computeCompliance, showCompliance, openConvertDialog };
})();

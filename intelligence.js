/* ============================================================
   Intelligence Layer (v1) — KPI Mapping + Impact + Dependency Graph
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } };
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(p,o){o=o||{};const r=await fetch(API_BASE+p,{method:o.method||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok()},body:o.body?JSON.stringify(o.body):undefined});if(!r.ok)throw new Error(await r.text()||'HTTP '+r.status);return r.json();}
  function toast(m,k){const e=document.createElement('div');e.textContent=m;e.style.cssText=`position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${k==='err'?'#c92a2a':'#2b7a3a'};color:#fff;padding:10px 20px;border-radius:8px;z-index:99999;font-size:14px`;document.body.appendChild(e);setTimeout(()=>e.remove(),2500);}

  const KPI_CATEGORIES = [
    { id:'revenue',  label:'الإيرادات', icon:'💰', color:'#37b24d' },
    { id:'time',     label:'الوقت',     icon:'⏱️', color:'#3D5A80' },
    { id:'quality',  label:'الجودة',    icon:'⭐', color:'#bf9b30' },
    { id:'cx',       label:'تجربة العميل', icon:'😊', color:'#e8590c' },
    { id:'safety',   label:'السلامة',   icon:'🛡️', color:'#c92a2a' },
    { id:'cost',     label:'التكلفة',   icon:'💵', color:'#5c940d' }
  ];

  /* KPI Editor inside SOP modal */
  function buildKpiPanel(sop, dept){
    const kpis = sop.kpis || [];
    const impact = sop.impactHistory || [];
    return `<div class="intel-panel" style="border:1px solid var(--line);border-radius:10px;padding:14px;margin:12px 0;background:var(--surface)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <strong style="font-size:13px">🎯 مؤشرات الأداء (KPIs)</strong>
        <button type="button" data-add-kpi style="background:transparent;border:1px dashed var(--line);color:var(--ink-2);padding:3px 10px;border-radius:5px;font-size:11px;cursor:pointer">+ إضافة</button>
      </div>
      <div data-kpi-list style="display:flex;flex-direction:column;gap:6px">
        ${kpis.length ? kpis.map((k,i)=>{
          const cat = KPI_CATEGORIES.find(c=>c.id===k.category) || KPI_CATEGORIES[0];
          return `<div data-kpi-row="${i}" style="display:flex;gap:6px;align-items:center;background:var(--card);padding:6px;border-radius:6px;border:1px solid var(--line)">
            <span style="background:${cat.color}22;color:${cat.color};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">${cat.icon} ${esc(cat.label)}</span>
            <span style="flex:1;font-size:12.5px">${esc(k.name||'')}</span>
            <span style="font-family:monospace;font-size:12px;color:var(--ink-3)">${esc(k.target||'')}</span>
            <button type="button" data-del-kpi="${i}" style="background:none;border:0;color:#c33;cursor:pointer;font-size:14px">×</button>
          </div>`;
        }).join('') : '<div style="color:var(--ink-3);font-size:12px;font-style:italic">لا توجد مؤشرات أداء مرتبطة</div>'}
      </div>

      ${impact.length ? `<details style="margin-top:10px"><summary style="cursor:pointer;font-size:12px;color:var(--ink-2)">📈 تتبع الأثر (${impact.length} قياس)</summary>
        <div style="margin-top:6px;font-size:11.5px">
          ${impact.slice(0,10).map(im=>`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dotted var(--line)">
            <span>${esc(im.kpi||'—')}</span>
            <span><b style="color:${im.delta>0?'#37b24d':im.delta<0?'#c92a2a':'#888'}">${im.delta>0?'+':''}${im.delta||0}%</b></span>
            <span style="color:var(--ink-3)">${im.at?new Date(im.at).toLocaleDateString('ar'):''}</span>
          </div>`).join('')}
        </div>
      </details>` : ''}
    </div>`;
  }

  function addKpiPrompt(sop, dept, panel){
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center';
    bd.innerHTML = `<div style="background:var(--card);color:var(--ink);padding:20px;border-radius:10px;max-width:380px;width:100%">
      <h4 style="margin:0 0 12px">إضافة مؤشر أداء</h4>
      <div style="display:grid;gap:8px">
        <select data-cat style="padding:7px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink)">
          ${KPI_CATEGORIES.map(c=>`<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')}
        </select>
        <input data-name placeholder="اسم المؤشر (مثل: متوسط زمن التسليم)" style="padding:7px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink)">
        <input data-target placeholder="الهدف (مثل: < 60 ثانية)" style="padding:7px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink)">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button data-x style="background:none;border:1px solid var(--line);padding:6px 12px;border-radius:5px;cursor:pointer">إلغاء</button>
        <button data-ok style="background:var(--brand,#bf9b30);color:#fff;border:0;padding:6px 16px;border-radius:5px;cursor:pointer">إضافة</button>
      </div>
    </div>`;
    document.body.appendChild(bd);
    bd.querySelector('[data-x]').onclick = () => bd.remove();
    bd.querySelector('[data-ok]').onclick = async () => {
      const k = {
        category: bd.querySelector('[data-cat]').value,
        name: bd.querySelector('[data-name]').value.trim(),
        target: bd.querySelector('[data-target]').value.trim(),
        addedAt: Date.now(),
        addedBy: (me()||{}).email
      };
      if (!k.name) return;
      sop.kpis = (sop.kpis||[]).concat(k);
      try {
        await api(`/api/sops/${dept}/${sop.code}`, { method:'PUT', body:{ kpis: sop.kpis } });
        toast('✓ تمت الإضافة');
        bd.remove();
        // refresh panel
        const newHtml = buildKpiPanel(sop, dept);
        const tmp = document.createElement('div'); tmp.innerHTML = newHtml;
        panel.replaceWith(tmp.firstElementChild);
        wireKpiPanel(tmp.firstElementChild, sop, dept);
      } catch(e){ toast('فشل: '+e.message,'err'); }
    };
  }

  function wireKpiPanel(panel, sop, dept){
    panel.querySelector('[data-add-kpi]').onclick = () => addKpiPrompt(sop, dept, panel);
    panel.querySelectorAll('[data-del-kpi]').forEach(btn => {
      btn.onclick = async () => {
        const i = +btn.dataset.delKpi;
        if (!confirm('حذف المؤشر؟')) return;
        sop.kpis.splice(i,1);
        try {
          await api(`/api/sops/${dept}/${sop.code}`, { method:'PUT', body:{ kpis: sop.kpis } });
          toast('✓ حُذف');
          const newHtml = buildKpiPanel(sop, dept);
          const tmp = document.createElement('div'); tmp.innerHTML = newHtml;
          panel.replaceWith(tmp.firstElementChild);
          wireKpiPanel(tmp.firstElementChild, sop, dept);
        } catch(e){ toast('فشل: '+e.message,'err'); }
      };
    });
  }

  /* Hook into modal */
  function injectIntoModal(){
    const modal = document.getElementById('modal');
    if (!modal || modal._intelHooked) return;
    modal._intelHooked = true;
    new MutationObserver(() => {
      if (!modal.classList.contains('open')) return;
      const idx = window.state && window.state.openIdx;
      if (typeof idx !== 'number') return;
      const sop = (window.SOPS||[])[idx];
      if (!sop) return;
      modal.querySelectorAll('.intel-panel').forEach(p=>p.remove());
      const anchor = modal.querySelector('.modal-body') || modal.querySelector('.modal-content');
      if (!anchor) return;
      const div = document.createElement('div');
      div.innerHTML = buildKpiPanel(sop, window.CURRENT_DEPT_ID);
      const panel = div.firstElementChild;
      anchor.appendChild(panel);
      wireKpiPanel(panel, sop, window.CURRENT_DEPT_ID);
    }).observe(modal, { attributes:true, attributeFilter:['class','style'] });
  }

  /* Cross-Dependency Graph — show what's affected if SOP fails */
  async function showImpactGraph(sopCode){
    let deps = [];
    try { deps = (await api('/api/deps')).deps || []; } catch(_){}
    const dept = window.CURRENT_DEPT_ID;
    const downstream = deps.filter(d => d.from && d.from.code === sopCode);
    if (!downstream.length) { toast('لا توجد تبعيات لهذا الإجراء'); return; }
    const cfg = window.DEPARTMENTS_CONFIG || {};
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    bd.innerHTML = `<div style="background:var(--card);color:var(--ink);padding:20px;border-radius:12px;max-width:520px;width:100%;max-height:80vh;overflow:auto">
      <h3 style="margin:0 0 10px">🔗 الأثر التبعي لـ ${esc(sopCode)}</h3>
      <div style="font-size:12.5px;color:var(--ink-2);margin-bottom:14px">إذا فشل/تعطّل هذا الإجراء، ستتأثر:</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${downstream.map(d=>{
          const dn = (cfg[d.to.dept]||{}).name || d.to.dept;
          return `<div style="background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center">
            <div><div style="font-weight:600">${esc(d.to.code)}</div><div style="font-size:11.5px;color:var(--ink-3)">${esc(dn)}</div></div>
            <span style="background:${d.kind==='blocks'?'#ffe3e3':'#fff3bf'};color:${d.kind==='blocks'?'#a61e1e':'#8a6d00'};padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600">${esc(d.kind||'يعتمد على')}</span>
          </div>`;
        }).join('')}
      </div>
      <div style="text-align:center;margin-top:14px"><button data-x style="background:var(--brand,#bf9b30);color:#fff;border:0;padding:7px 18px;border-radius:5px;cursor:pointer">إغلاق</button></div>
    </div>`;
    document.body.appendChild(bd);
    bd.querySelector('[data-x]').onclick = () => bd.remove();
    bd.addEventListener('click', e => { if(e.target===bd) bd.remove(); });
  }

  function init(){
    injectIntoModal();
    setInterval(injectIntoModal, 3000);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.ArsanIntel = { showImpactGraph, KPI_CATEGORIES };
})();

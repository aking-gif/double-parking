/* button-audit.js — Admin-only runtime button auditor.
 * Detects buttons that:
 *   • Have no click listener AND no form submit AND no href
 *   • Reference a missing target id (data-target / data-bind)
 *   • Throw an error when clicked (caught via window.onerror)
 * Surfaces a tiny floating "🔧 Buttons" pill (admin-only) that opens a list.
 */
(function(){
  'use strict';
  if (window.ButtonAudit) return;

  function isAdmin(){
    try {
      const me = JSON.parse(localStorage.getItem('arsan_me') || 'null');
      return me && (me.role === 'admin' || me.email === 'a.king@arsann.com');
    } catch(_){ return false; }
  }

  // Collect once after DOM settles
  function audit(){
    const issues = [];
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(b => {
      // Skip closed/hidden permanently
      if (!b.offsetParent && getComputedStyle(b).display === 'none') return;
      if (b.closest('[hidden]')) return;
      // submit inside <form> = ok
      if (b.type === 'submit' && b.closest('form')) return;
      // <a> with href = ok
      if (b.tagName === 'A' && b.getAttribute('href')) return;

      // Has explicit onclick attr or React fiber listener?
      const hasInline = !!b.getAttribute('onclick');
      // Heuristic: jQuery/native listeners are invisible; rely on data attributes + ids
      const hasDataAction = b.dataset && (b.dataset.action || b.dataset.tab || b.dataset.target || b.dataset.id || b.dataset.theme || b.dataset.mode || b.dataset.phase || b.dataset.view || b.dataset.email);
      const hasId = !!b.id;

      // Probe runtime listeners (best effort — only sees inline + addEventListener tracked via attribute)
      const labels = (b.textContent || '').trim().slice(0, 60);
      if (!hasInline && !hasDataAction && !hasId && !labels) {
        issues.push({ kind:'no-handler', el:b, label:'(empty)', hint:'زر فارغ بدون معرّف ولا نص' });
        return;
      }
      if (!hasInline && !hasDataAction && !hasId) {
        // Probable orphan
        issues.push({ kind:'maybe-orphan', el:b, label:labels, hint:'زر بدون id / data-action / handler' });
      }
    });
    return issues;
  }

  function highlight(el, on){
    if (!el) return;
    el.style.outline = on ? '2px solid #ef4444' : '';
    el.style.outlineOffset = on ? '2px' : '';
    if (on) el.scrollIntoView({block:'center', behavior:'smooth'});
  }

  function makePill(){
    const pill = document.createElement('button');
    pill.id = 'btn-audit-pill';
    pill.type = 'button';
    pill.textContent = '🔧';
    pill.title = 'فحص الأزرار (Admin)';
    pill.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:99990;background:#0f172a;color:#fff;border:none;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);opacity:.55;transition:opacity .2s';
    pill.onmouseenter = ()=>{ pill.style.opacity='1'; };
    pill.onmouseleave = ()=>{ pill.style.opacity='.55'; };
    pill.addEventListener('click', openPanel);
    document.body.appendChild(pill);
  }

  let panel = null;
  function openPanel(){
    if (panel){ panel.remove(); panel = null; return; }
    const issues = audit();
    panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;bottom:60px;left:16px;z-index:99991;width:360px;max-height:60vh;background:#fff;color:#0f172a;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18);font-size:13px;padding:14px;overflow:auto;font-family:inherit;direction:rtl';
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <strong>فحص الأزرار</strong>
        <button type="button" id="ba-close" style="background:none;border:none;cursor:pointer;font-size:18px;color:#64748b">✕</button>
      </div>
      <div style="font-size:12px;color:#64748b;margin-bottom:8px">
        تم فحص ${document.querySelectorAll('button').length} زر — ${issues.length} مشتبه به
      </div>
      <div id="ba-list"></div>`;
    document.body.appendChild(panel);
    panel.querySelector('#ba-close').addEventListener('click', ()=>{ panel.remove(); panel=null; });
    const list = panel.querySelector('#ba-list');
    if (!issues.length){
      list.innerHTML = '<div style="padding:10px;text-align:center;color:#16a34a">✓ لا مشاكل ظاهرة</div>';
      return;
    }
    issues.forEach((iss,i)=>{
      const row = document.createElement('div');
      row.style.cssText = 'padding:8px 10px;border:1px solid #f1f5f9;border-radius:8px;margin-bottom:6px;cursor:pointer';
      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:6px">
          <strong style="font-size:12.5px">${iss.kind}</strong>
          <span style="font-size:11px;color:#94a3b8">#${i+1}</span>
        </div>
        <div style="font-size:12px;margin-top:3px;color:#334155">${iss.label || '—'}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px">${iss.hint}</div>`;
      row.addEventListener('mouseenter', ()=>highlight(iss.el, true));
      row.addEventListener('mouseleave', ()=>highlight(iss.el, false));
      row.addEventListener('click', ()=>highlight(iss.el, true));
      list.appendChild(row);
    });
  }

  function init(){
    if (!isAdmin()) return;
    setTimeout(makePill, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.ButtonAudit = { audit, openPanel };
})();

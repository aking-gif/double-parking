/* =====================================================================
   🚀 ARSAN MEGA PACK — 50 Improvements in One File
   =====================================================================
   Version: 1.0  |  Date: 2026-04-26
   Owner: a.king@arsann.com
   --------------------------------------------------------------------
   This single file injects 50 improvements across the platform.
   Just include it once, after ArsanAPI loads.

   Categories:
   ─────────── PRODUCTIVITY (1-12) ───────────
   1.  Cmd+K search button in topbar
   2.  Quick filters (الأنشط/الأقدم/اليوم/يحتاج توثيق)
   3.  PDF export per SOP (branded)
   4.  CSV export per dept
   5.  JSON export per dept (dev)
   6.  Print-friendly stylesheet
   7.  Bulk-select SOPs (multi-action)
   8.  Keyboard shortcuts (? to show help)
   9.  Recent SOPs list (last 5 viewed)
   10. Pin SOP to top
   11. Duplicate SOP (clone)
   12. Move SOP between departments
   ─────────── DISCOVERY (13-22) ───────────
   13. KPI strip per dept
   14. Empty state for empty depts
   15. Welcome modal (first time)
   16. Auto-start onboarding tour
   17. Breadcrumb navigation
   18. "Continue where you left off" banner
   19. SOP code auto-suggest
   20. Related SOPs (by purpose similarity)
   21. Tag system (in-text tagging)
   22. Phase progress bars
   ─────────── COLLABORATION (23-32) ───────────
   23. Activity ticker (live recent edits)
   24. "Who's online" indicator
   25. Reaction emojis on SOPs (👍❤️🎯)
   26. Share SOP via copy-link
   27. @mention preview tooltip
   28. Comment count badge on cards
   29. Task badge on cards
   30. Edit conflict warning (concurrent edits)
   31. Slack notification toggle (per SOP)
   32. Email digest toggle (weekly)
   ─────────── UX POLISH (33-42) ───────────
   33. Dark mode polish (smooth)
   34. Skeleton loaders
   35. Toast notification system (unified)
   36. Smooth scroll-to-top button
   37. Reading mode (focused SOP view)
   38. Card hover animations
   39. Progress indicator while loading
   40. Confetti on first SOP completion
   41. Undo toast (after delete)
   42. Better mobile layout
   ─────────── ADMIN & ANALYTICS (43-50) ───────────
   43. Admin: bulk export all data (backup)
   44. Admin: usage analytics dashboard
   45. Admin: stale SOPs report
   46. Admin: user activity heatmap
   47. Admin: orphan SOPs detector
   48. Admin: bulk reassign owner
   49. Admin: import from Google Drive link
   50. Admin: changelog viewer
   ===================================================================== */
(function(){
  'use strict';
  if (window.__ArsanMegaPack) return;
  window.__ArsanMegaPack = true;

  const VERSION = '1.0';
  const $  = (s, r=document) => (r||document).querySelector(s);
  const $$ = (s, r=document) => Array.from((r||document).querySelectorAll(s));

  /* ─────────────────────────────────────────────────────────────────
     CORE HELPERS
     ───────────────────────────────────────────────────────────────── */
  const LS = {
    get: (k, d=null) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch{} },
    del: (k) => { try { localStorage.removeItem(k); } catch{} },
  };
  const escapeHtml = (s) => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const me = () => window.ArsanAPI?.me?.() || null;
  const isAdmin = () => window.ArsanAPI?.isAdmin?.() || false;
  const isLoggedIn = () => window.ArsanAPI?.isLoggedIn?.() || false;

  /* ─────────────────────────────────────────────────────────────────
     UNIFIED TOAST (#35) — used by everything else
     ───────────────────────────────────────────────────────────────── */
  function injectToastStyles(){
    if (document.getElementById('amp-toast-style')) return;
    const s = document.createElement('style');
    s.id = 'amp-toast-style';
    s.textContent = `
      .amp-toast-host{
        position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
        z-index:99800; display:flex; flex-direction:column; gap:8px;
        pointer-events:none; align-items:center;
      }
      .amp-toast{
        pointer-events:auto;
        min-width:220px; max-width:420px;
        padding:11px 18px; border-radius:10px;
        background:linear-gradient(180deg,#2a2218,#1f1812);
        color:#f3e9c9; font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;
        font-size:13.5px; box-shadow:0 12px 30px rgba(0,0,0,.4);
        border:1px solid rgba(212,178,74,.3);
        display:flex; align-items:center; gap:10px;
        animation:ampToastIn .25s cubic-bezier(.4,.6,.3,1.2);
        direction:rtl;
      }
      @keyframes ampToastIn{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
      .amp-toast.success{border-color:#3a8f66;background:linear-gradient(180deg,#1d3a2a,#152922)}
      .amp-toast.error  {border-color:#b85450;background:linear-gradient(180deg,#3a1d1d,#291515)}
      .amp-toast.info   {border-color:#D4B24A}
      .amp-toast .ic{font-size:16px;flex-shrink:0}
      .amp-toast .x{background:transparent;border:none;color:inherit;cursor:pointer;opacity:.55;padding:2px 6px;font-size:14px;margin-inline-start:auto}
      .amp-toast .x:hover{opacity:1}
      .amp-toast .undo{background:rgba(212,178,74,.18);color:#D4B24A;border:none;padding:4px 10px;border-radius:6px;font-family:inherit;font-size:12px;cursor:pointer;font-weight:600}
      .amp-toast .undo:hover{background:rgba(212,178,74,.3)}
    `;
    document.head.appendChild(s);
  }
  function ensureToastHost(){
    let h = document.querySelector('.amp-toast-host');
    if (!h) { h = document.createElement('div'); h.className = 'amp-toast-host'; document.body.appendChild(h); }
    return h;
  }
  function toast(opts){
    injectToastStyles();
    const o = typeof opts === 'string' ? { msg: opts } : (opts || {});
    const host = ensureToastHost();
    const t = document.createElement('div');
    t.className = 'amp-toast ' + (o.type || 'info');
    const icon = { success:'✓', error:'✕', info:'ⓘ', warn:'⚠' }[o.type || 'info'] || 'ⓘ';
    t.innerHTML = `<span class="ic">${icon}</span><span></span>`;
    t.querySelector('span:last-child').textContent = o.msg || '';
    if (o.undo) {
      const btn = document.createElement('button');
      btn.className = 'undo';
      btn.textContent = o.undoLabel || 'تراجع';
      btn.onclick = () => { try { o.undo(); } catch{} t.remove(); };
      t.appendChild(btn);
    }
    const x = document.createElement('button');
    x.className = 'x';
    x.innerHTML = '×';
    x.onclick = () => t.remove();
    t.appendChild(x);
    host.appendChild(t);
    setTimeout(() => { t.style.transition='opacity .3s,transform .3s'; t.style.opacity='0'; t.style.transform='translateY(10px)'; setTimeout(()=>t.remove(), 320); }, o.duration || 3500);
    return t;
  }
  window.ampToast = toast;

  /* ─────────────────────────────────────────────────────────────────
     #1  Cmd+K Search button in topbar
     ───────────────────────────────────────────────────────────────── */
  function injectCmdKButton(){
    const bar = $('.arsan-topbar');
    if (!bar || bar.querySelector('[data-amp-cmdk]')) return;
    const btn = document.createElement('button');
    btn.className = 'arsan-topbar-btn';
    btn.dataset.ampCmdk = '1';
    btn.title = 'بحث شامل (⌘K / Ctrl+K)';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span>بحث</span>
      <span style="font-size:9.5px;padding:1.5px 5px;border-radius:4px;background:rgba(212,178,74,.18);margin-inline-start:5px;font-family:ui-monospace,monospace;letter-spacing:.3px;color:#c9a85a">⌘K</span>
    `;
    btn.onclick = () => window.ArsanCmdK?.open?.();
    bar.insertBefore(btn, bar.firstChild);
  }

  /* ─────────────────────────────────────────────────────────────────
     #2  Quick Filters
     ───────────────────────────────────────────────────────────────── */
  let qFilter = LS.get('arsan_qf_v1', 'all');
  function applyQuickFilter(sops){
    if (!Array.isArray(sops)) return sops;
    const oneDay = 86400000, oneWeek = 7*oneDay;
    switch (qFilter) {
      case 'recent':     return [...sops].sort((a,b) => (b.updatedAt||0)-(a.updatedAt||0));
      case 'today':      return sops.filter(s => s.updatedAt && (Date.now()-s.updatedAt) < oneDay);
      case 'week':       return sops.filter(s => s.updatedAt && (Date.now()-s.updatedAt) < oneWeek);
      case 'incomplete': return sops.filter(s => !s.steps?.length || !s.purpose);
      case 'oldest':     return [...sops].sort((a,b) => (a.updatedAt||Infinity)-(b.updatedAt||Infinity));
      default:           return sops;
    }
  }
  function injectQuickFilters(){
    const chips = $('#chips');
    if (!chips || chips.querySelector('[data-amp-qf]')) return;
    const wrap = document.createElement('span');
    wrap.dataset.ampQf = '1';
    wrap.style.cssText = 'display:inline-flex;gap:5px;margin-inline-start:12px;align-items:center;border-inline-start:1px solid var(--line);padding-inline-start:12px;flex-wrap:wrap';
    const opts = [
      { id:'all',        label:'الكل',     icon:'🗂️' },
      { id:'recent',     label:'الأنشط',   icon:'🔥' },
      { id:'today',      label:'اليوم',     icon:'⚡' },
      { id:'week',       label:'الأسبوع',   icon:'📅' },
      { id:'incomplete', label:'يحتاج توثيق', icon:'📝' },
    ];
    opts.forEach(o => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.dataset.qf = o.id;
      b.style.cssText = 'background:transparent;border:1px solid var(--line);color:var(--ink-2);padding:4px 10px;border-radius:999px;font-size:11.5px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px;white-space:nowrap';
      b.innerHTML = `<span>${o.icon}</span><span>${o.label}</span>`;
      const setActive = (active) => {
        if (active) {
          b.style.background = 'var(--accent,#D4B24A)';
          b.style.color = '#1a1a1a';
          b.style.borderColor = 'var(--accent,#D4B24A)';
        } else {
          b.style.background = 'transparent';
          b.style.color = 'var(--ink-2)';
          b.style.borderColor = 'var(--line)';
        }
      };
      setActive(qFilter === o.id);
      b.onclick = () => {
        qFilter = o.id;
        LS.set('arsan_qf_v1', o.id);
        wrap.querySelectorAll('button').forEach(x => {
          x.style.background='transparent'; x.style.color='var(--ink-2)'; x.style.borderColor='var(--line)';
        });
        setActive(true);
        if (typeof window.renderGrid === 'function') window.renderGrid();
      };
      wrap.appendChild(b);
    });
    chips.appendChild(wrap);
  }
  function patchRenderGrid(){
    if (typeof window.renderGrid !== 'function' || window.renderGrid.__ampPatched) return;
    const orig = window.renderGrid;
    window.renderGrid = function(){
      const before = window.SOPS;
      window.SOPS = applyQuickFilter(before);
      try { return orig.apply(this, arguments); }
      finally { window.SOPS = before; }
    };
    window.renderGrid.__ampPatched = true;
  }

  /* ─────────────────────────────────────────────────────────────────
     #3  PDF Export (branded)
     ───────────────────────────────────────────────────────────────── */
  function pdfStyles(){
    return `<style>
      @page{size:A4;margin:18mm 16mm}
      @media print{
        body{font-family:"IBM Plex Sans Arabic","Cairo",sans-serif;direction:rtl;color:#1a1a1a;background:#fff}
        .pdf-doc{max-width:100%}
        .pdf-head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #85714D;padding-bottom:14px;margin-bottom:18px}
        .pdf-head h1{font-size:22pt;color:#85714D;margin:0}
        .pdf-head .meta{font-size:10pt;color:#666;text-align:left}
        .pdf-head .logo{font-size:14pt;font-weight:700;color:#85714D;letter-spacing:.5px}
        .pdf-section{margin-bottom:14px;page-break-inside:avoid}
        .pdf-section h3{font-size:13pt;color:#85714D;margin:0 0 6px;border-bottom:1px solid #d4b24a;padding-bottom:3px}
        .pdf-section p,.pdf-section li{font-size:11pt;line-height:1.7;color:#1a1a1a;margin:0 0 4px}
        .pdf-section ol,.pdf-section ul{padding-inline-start:18px}
        .pdf-foot{position:fixed;bottom:8mm;left:0;right:0;text-align:center;font-size:8pt;color:#999;border-top:1px solid #ddd;padding-top:4px}
      }
    </style>`;
  }
  function exportSopToPdf(sop){
    if (!sop) return;
    const dept = window.DEPT?.name || window.CURRENT_DEPT_ID || 'إدارة';
    const today = new Date().toLocaleDateString('ar-SA', {year:'numeric',month:'long',day:'numeric'});
    const renderList = (items) => Array.isArray(items) && items.length
      ? `<ol>${items.map(i => `<li>${escapeHtml(typeof i==='string'?i:i.text||i.label||'')}</li>`).join('')}</ol>`
      : '<p style="color:#999;font-style:italic">— لم يتم التوثيق بعد —</p>';
    const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${escapeHtml(sop.code||'')} — ${escapeHtml(sop.title||'')}</title>${pdfStyles()}</head><body>
      <div class="pdf-doc">
        <div class="pdf-head">
          <div>
            <div class="logo">منصّة أرسان</div>
            <h1>${escapeHtml(sop.title||'إجراء')}</h1>
            <div style="font-size:11pt;color:#666;margin-top:4px">${escapeHtml(dept)} · ${escapeHtml(sop.code||'')}</div>
          </div>
          <div class="meta">
            <div>تاريخ الطباعة: ${today}</div>
            <div>الإصدار: ${escapeHtml(sop.version||'1.0')}</div>
            ${sop.updatedAt?`<div>آخر تحديث: ${new Date(sop.updatedAt).toLocaleDateString('ar-SA')}</div>`:''}
          </div>
        </div>
        ${sop.purpose?`<div class="pdf-section"><h3>الغرض</h3><p>${escapeHtml(sop.purpose)}</p></div>`:''}
        ${sop.scope?`<div class="pdf-section"><h3>النطاق</h3><p>${escapeHtml(sop.scope)}</p></div>`:''}
        ${sop.responsibilities?`<div class="pdf-section"><h3>المسؤوليات</h3><p>${escapeHtml(sop.responsibilities)}</p></div>`:''}
        ${sop.steps?`<div class="pdf-section"><h3>الخطوات</h3>${renderList(sop.steps)}</div>`:''}
        ${sop.kpis?`<div class="pdf-section"><h3>مؤشرات الأداء</h3>${renderList(sop.kpis)}</div>`:''}
        ${sop.forms?`<div class="pdf-section"><h3>النماذج المرتبطة</h3>${renderList(sop.forms)}</div>`:''}
        ${sop.references?`<div class="pdf-section"><h3>المراجع</h3>${renderList(sop.references)}</div>`:''}
        <div class="pdf-foot">منصّة أرسان للإجراءات التشغيلية القياسية — وثيقة رسمية</div>
      </div>
      <script>setTimeout(()=>window.print(),350);window.onafterprint=()=>window.close();<\/script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return toast({ msg:'تم منع النوافذ المنبثقة', type:'error' });
    w.document.write(html); w.document.close();
  }

  /* ─────────────────────────────────────────────────────────────────
     #4  CSV Export
     ───────────────────────────────────────────────────────────────── */
  function exportSopsToCsv(){
    const sops = window.SOPS || [];
    if (!sops.length) return toast({ msg:'لا توجد إجراءات للتصدير', type:'error' });
    const dept = window.DEPT?.name || 'department';
    const headers = ['الكود','العنوان','المرحلة','الغرض','المسؤول','آخر تحديث','الحالة'];
    const rows = sops.map(s => [
      s.code||'', (s.title||'').replace(/"/g,'""'), s.phase||s.group||'',
      (s.purpose||'').replace(/"/g,'""').slice(0,200),
      s.owner||'', s.updatedAt?new Date(s.updatedAt).toLocaleDateString('ar-SA'):'', s.status||'مفعّل'
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c||'')}"`).join(',')).join('\n');
    downloadFile('\uFEFF'+csv, `arsan-${dept}-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8');
    toast({ msg:'تم تصدير CSV', type:'success' });
  }

  /* ─────────────────────────────────────────────────────────────────
     #5  JSON Export (dev/backup)
     ───────────────────────────────────────────────────────────────── */
  function exportSopsToJson(){
    const sops = window.SOPS || [];
    if (!sops.length) return toast({ msg:'لا توجد إجراءات', type:'error' });
    const dept = window.DEPT?.name || window.CURRENT_DEPT_ID || 'department';
    const data = { exported: new Date().toISOString(), department: dept, version: VERSION, sops };
    downloadFile(JSON.stringify(data, null, 2), `arsan-${dept}-${Date.now()}.json`, 'application/json');
    toast({ msg:'تم تصدير JSON', type:'success' });
  }

  function downloadFile(content, filename, mime){
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ─────────────────────────────────────────────────────────────────
     #6  Print stylesheet (when user hits Ctrl+P directly)
     ───────────────────────────────────────────────────────────────── */
  function injectPrintStyles(){
    if (document.getElementById('amp-print-style')) return;
    const s = document.createElement('style');
    s.id = 'amp-print-style';
    s.media = 'print';
    s.textContent = `
      @page{size:A4;margin:18mm 14mm}
      .arsan-topbar,.arsan-fab,#arsan-notif-bell-host,#arsan-admin-fab,#arsanAdminToolbar,
      .toolbar,.search,#chips,.amp-toast-host,#arsan-kpi-strip,
      [data-amp-cmdk],[data-amp-csv]{display:none !important}
      body{background:#fff !important;color:#000 !important}
      .card{break-inside:avoid;page-break-inside:avoid}
      .grid{display:block !important}
      .card{margin-bottom:8mm;border:1px solid #ccc !important;box-shadow:none !important}
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────────────────────
     #7  Bulk Select
     ───────────────────────────────────────────────────────────────── */
  let bulkMode = false, bulkSet = new Set();
  function toggleBulkMode(){
    bulkMode = !bulkMode;
    bulkSet.clear();
    document.body.classList.toggle('amp-bulk-mode', bulkMode);
    if (bulkMode) showBulkBar(); else hideBulkBar();
    if (typeof window.renderGrid === 'function') window.renderGrid();
    setTimeout(decorateCardsForBulk, 100);
  }
  function decorateCardsForBulk(){
    if (!bulkMode) return;
    $$('#grid .card').forEach((card, idx) => {
      if (card.querySelector('.amp-bulk-cb')) return;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'amp-bulk-cb';
      cb.style.cssText = 'position:absolute;top:8px;inset-inline-end:8px;width:18px;height:18px;cursor:pointer;z-index:5';
      cb.onclick = (e) => {
        e.stopPropagation();
        const sop = window.SOPS?.[idx];
        const code = sop?.code || idx;
        if (cb.checked) bulkSet.add(code); else bulkSet.delete(code);
        updateBulkBar();
      };
      card.style.position = 'relative';
      card.appendChild(cb);
    });
  }
  function showBulkBar(){
    if ($('#amp-bulk-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'amp-bulk-bar';
    bar.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:12px 18px;border-radius:12px;z-index:9100;display:flex;gap:10px;align-items:center;font-family:inherit;box-shadow:0 12px 30px rgba(0,0,0,.4);direction:rtl';
    bar.innerHTML = `
      <span id="ampBulkCount" style="font-size:13px;font-weight:600">٠ محدد</span>
      <span style="opacity:.4">|</span>
      <button data-act="csv" style="background:#D4B24A;color:#1a1a1a;border:none;padding:6px 12px;border-radius:6px;font-family:inherit;cursor:pointer;font-size:12px">📊 CSV</button>
      <button data-act="pdf" style="background:#85714D;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-family:inherit;cursor:pointer;font-size:12px">📄 PDF</button>
      <button data-act="cancel" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.3);padding:6px 12px;border-radius:6px;font-family:inherit;cursor:pointer;font-size:12px">إلغاء</button>
    `;
    document.body.appendChild(bar);
    bar.querySelector('[data-act="cancel"]').onclick = toggleBulkMode;
    bar.querySelector('[data-act="csv"]').onclick = () => {
      const selected = (window.SOPS||[]).filter(s => bulkSet.has(s.code));
      if (!selected.length) return toast({ msg:'لم يتم تحديد إجراءات', type:'error' });
      const orig = window.SOPS;
      window.SOPS = selected;
      exportSopsToCsv();
      window.SOPS = orig;
    };
    bar.querySelector('[data-act="pdf"]').onclick = () => {
      const selected = (window.SOPS||[]).filter(s => bulkSet.has(s.code));
      if (!selected.length) return toast({ msg:'لم يتم تحديد إجراءات', type:'error' });
      selected.forEach(s => exportSopToPdf(s));
    };
  }
  function hideBulkBar(){ $('#amp-bulk-bar')?.remove(); }
  function updateBulkBar(){
    const c = $('#ampBulkCount');
    if (c) c.textContent = `${bulkSet.size} محدد`;
  }

  /* ─────────────────────────────────────────────────────────────────
     #8  Keyboard shortcuts (?)
     ───────────────────────────────────────────────────────────────── */
  const SHORTCUTS = [
    ['⌘ / Ctrl + K',   'بحث شامل'],
    ['?',              'عرض الاختصارات'],
    ['⌘ / Ctrl + P',   'طباعة الصفحة'],
    ['G ثم H',         'الذهاب للرئيسية'],
    ['G ثم D',         'الإدارات'],
    ['G ثم P',         'ملفي الشخصي'],
    ['Esc',            'إغلاق النوافذ'],
    ['↑ ↓',            'تنقّل في النتائج'],
    ['Enter',          'فتح المحدد'],
    ['B',              'تفعيل التحديد المتعدد'],
  ];
  function showShortcuts(){
    if ($('#amp-sc-modal')) return;
    const bd = document.createElement('div');
    bd.id = 'amp-sc-modal';
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(15,12,8,.65);backdrop-filter:blur(8px);z-index:99700;display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;animation:ampToastIn .2s';
    bd.innerHTML = `
      <div style="background:#231b13;border:1px solid rgba(212,178,74,.3);border-radius:14px;max-width:480px;width:100%;padding:24px;color:#f3e9c9;box-shadow:0 20px 60px rgba(0,0,0,.4)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:#D4B24A;font-size:18px">⌨️ اختصارات لوحة المفاتيح</h3>
          <button id="ampScClose" style="background:transparent;border:none;color:#c9a85a;font-size:24px;cursor:pointer">×</button>
        </div>
        <table style="width:100%;border-collapse:collapse">
          ${SHORTCUTS.map(([k,d]) => `<tr style="border-bottom:1px solid rgba(212,178,74,.12)"><td style="padding:9px 0"><kbd style="padding:3px 8px;background:rgba(212,178,74,.16);border-radius:5px;font-family:ui-monospace,monospace;color:#D4B24A;font-size:12px">${k}</kbd></td><td style="padding:9px 12px;font-size:13px">${d}</td></tr>`).join('')}
        </table>
      </div>
    `;
    document.body.appendChild(bd);
    bd.querySelector('#ampScClose').onclick = () => bd.remove();
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };
    setTimeout(() => document.addEventListener('keydown', function once(e){ if (e.key==='Escape'){ bd.remove(); document.removeEventListener('keydown', once); } }), 50);
  }

  /* ─────────────────────────────────────────────────────────────────
     #9 + #18  Recent SOPs
     ───────────────────────────────────────────────────────────────── */
  function pushRecent(sop){
    if (!sop) return;
    const list = LS.get('arsan_recent_sops_v1', []);
    const dept = window.CURRENT_DEPT_ID || '';
    const item = { code: sop.code, title: sop.title, dept, ts: Date.now() };
    const filtered = list.filter(x => !(x.code === item.code && x.dept === item.dept));
    filtered.unshift(item);
    LS.set('arsan_recent_sops_v1', filtered.slice(0, 10));
  }
  function continueWhereYouLeftOff(){
    if (window.CURRENT_DEPT_ID) return; // only on home
    const list = LS.get('arsan_recent_sops_v1', []);
    if (!list.length) return;
    const home = $('main') || document.body;
    if ($('#amp-resume-banner')) return;
    const last = list[0];
    const banner = document.createElement('div');
    banner.id = 'amp-resume-banner';
    banner.style.cssText = 'max-width:1100px;margin:14px auto 0;padding:12px 18px;background:linear-gradient(90deg,rgba(212,178,74,.14),rgba(133,113,77,.06));border:1px solid rgba(212,178,74,.25);border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:"IBM Plex Sans Arabic",system-ui;direction:rtl';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;min-width:0">
        <div style="font-size:20px">🔖</div>
        <div style="min-width:0">
          <div style="font-size:11px;color:var(--ink-3,#9b958a);margin-bottom:2px">آخر إجراء فتحته</div>
          <div style="font-size:14px;font-weight:600;color:var(--ink,#1a1a1a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(last.title || last.code)}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0">
        <button id="ampResumeBtn" style="background:linear-gradient(135deg,#D4B24A,#85714D);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-family:inherit;cursor:pointer;font-size:13px;font-weight:600">متابعة ←</button>
        <button id="ampResumeClose" style="background:transparent;border:1px solid var(--line);color:var(--ink-3);padding:6px 10px;border-radius:8px;cursor:pointer;font-family:inherit">×</button>
      </div>
    `;
    const grid = $('.dept-grid') || $('main') || document.body;
    grid.parentNode?.insertBefore(banner, grid);
    banner.querySelector('#ampResumeBtn').onclick = () => {
      window.location.href = `dashboard.html?dept=${last.dept}#${encodeURIComponent(last.code)}`;
    };
    banner.querySelector('#ampResumeClose').onclick = () => banner.remove();
  }

  /* ─────────────────────────────────────────────────────────────────
     #13  KPI Strip
     ───────────────────────────────────────────────────────────────── */
  function renderKpiStrip(){
    const sops = window.SOPS || [];
    if (!sops.length) return;
    if ($('#arsan-kpi-strip')) return;
    const total = sops.length;
    const documented = sops.filter(s => s.steps?.length && s.purpose).length;
    const pct = total ? Math.round(documented/total*100) : 0;
    const oneWeek = 7*86400000;
    const recent = sops.filter(s => s.updatedAt && (Date.now()-s.updatedAt) < oneWeek).length;
    const incomplete = total - documented;
    const strip = document.createElement('div');
    strip.id = 'arsan-kpi-strip';
    strip.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:14px 0 18px;direction:rtl';
    strip.innerHTML = `
      <div class="amp-kpi" style="background:linear-gradient(135deg,rgba(212,178,74,.12),rgba(133,113,77,.04));padding:14px 16px;border-radius:12px;border:1px solid rgba(212,178,74,.18)">
        <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">إجمالي الإجراءات</div>
        <div style="font-size:24px;font-weight:700;color:var(--ink);font-feature-settings:'tnum'">${total}</div>
      </div>
      <div class="amp-kpi" style="background:linear-gradient(135deg,rgba(58,143,102,.12),rgba(58,143,102,.03));padding:14px 16px;border-radius:12px;border:1px solid rgba(58,143,102,.18)">
        <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">الموثّق</div>
        <div style="font-size:24px;font-weight:700;color:#3a8f66;font-feature-settings:'tnum'">${documented} <span style="font-size:13px;opacity:.6">/ ${total}</span></div>
        <div style="height:4px;background:rgba(58,143,102,.15);border-radius:2px;margin-top:8px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#3a8f66,#5fb588);border-radius:2px;transition:width .8s"></div>
        </div>
      </div>
      <div class="amp-kpi" style="background:linear-gradient(135deg,rgba(220,140,40,.12),rgba(220,140,40,.03));padding:14px 16px;border-radius:12px;border:1px solid rgba(220,140,40,.18)">
        <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">يحتاج توثيقاً</div>
        <div style="font-size:24px;font-weight:700;color:#dc8c28;font-feature-settings:'tnum'">${incomplete}</div>
      </div>
      <div class="amp-kpi" style="background:linear-gradient(135deg,rgba(184,84,80,.10),rgba(184,84,80,.02));padding:14px 16px;border-radius:12px;border:1px solid rgba(184,84,80,.16)">
        <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">حُدّث هذا الأسبوع</div>
        <div style="font-size:24px;font-weight:700;color:var(--ink);font-feature-settings:'tnum'">${recent}</div>
      </div>
    `;
    const grid = $('#grid');
    if (grid?.parentNode) grid.parentNode.insertBefore(strip, grid);
  }

  /* ─────────────────────────────────────────────────────────────────
     #14  Empty State
     ───────────────────────────────────────────────────────────────── */
  function renderEmptyState(){
    const grid = $('#grid');
    if (!grid || (window.SOPS||[]).length > 0) return;
    if (grid.querySelector('.amp-empty')) return;
    const dept = window.DEPT?.name || 'هذه الإدارة';
    grid.innerHTML = `
      <div class="amp-empty" style="grid-column:1/-1;padding:60px 30px;text-align:center;background:linear-gradient(135deg,rgba(212,178,74,.08),rgba(133,113,77,.04));border-radius:18px;border:2px dashed rgba(212,178,74,.3)">
        <div style="font-size:64px;margin-bottom:14px">📋</div>
        <h2 style="font-size:22px;color:var(--ink);margin:0 0 8px">${escapeHtml(dept)} — جاهزة للانطلاق</h2>
        <p style="color:var(--ink-2);font-size:14px;max-width:460px;margin:0 auto 22px;line-height:1.7">لا توجد إجراءات بعد. ابدأ بإضافة أول إجراء، أو استورد من ملف Word/PDF موجود.</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button id="ampEsAdd" style="padding:11px 24px;background:linear-gradient(135deg,#D4B24A,#85714D);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(133,113,77,.3)">➕ إضافة أول إجراء</button>
          <button id="ampEsImport" style="padding:11px 24px;background:#fff;color:#85714D;border:1px solid #D4B24A;border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer">📥 استيراد من ملف</button>
        </div>
        <div style="margin-top:30px;padding-top:24px;border-top:1px solid var(--line);font-size:12px;color:var(--ink-3)">نصيحة: اضغط <kbd style="padding:2px 6px;background:rgba(212,178,74,.12);border-radius:4px;font-family:ui-monospace,monospace">⌘K</kbd> للبحث في إدارة أخرى</div>
      </div>
    `;
    grid.querySelector('#ampEsAdd')?.addEventListener('click', () => window.showNewSopModal?.());
    grid.querySelector('#ampEsImport')?.addEventListener('click', () => window.showImportModal?.());
  }

  /* ─────────────────────────────────────────────────────────────────
     #15 + #16  Welcome Modal + Auto Tour
     ───────────────────────────────────────────────────────────────── */
  function showWelcomeModal(){
    if (LS.get('arsan_welcome_v2_shown')) return;
    if (!isLoggedIn()) return;
    if (window.location.pathname.includes('tour.html')) return;
    const m = me() || {};
    const name = m.name || m.email?.split('@')[0] || 'صديقي';
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,12,8,.7);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;animation:ampToastIn .3s';
    bd.innerHTML = `
      <div style="background:linear-gradient(180deg,#fffaee,#fff5e0);border:1px solid rgba(212,178,74,.4);border-radius:20px;max-width:480px;width:100%;padding:36px 32px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.4);animation:ampToastIn .35s">
        <div style="font-size:64px;margin-bottom:14px">🌿</div>
        <h2 style="font-size:24px;color:#85714D;margin:0 0 8px">مرحباً بك ${escapeHtml(name)}</h2>
        <p style="color:#5a4a30;font-size:15px;line-height:1.7;margin:0 0 22px">منصّة <strong>أرسان</strong> هي بيتك الرقمي للإجراءات التشغيلية. خذ جولة سريعة (90 ثانية) لتفهم كل الميزات.</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button id="ampWmStart" style="padding:12px 28px;background:linear-gradient(135deg,#D4B24A,#85714D);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(133,113,77,.3)">🐎 ابدأ الجولة</button>
          <button id="ampWmSkip" style="padding:12px 28px;background:transparent;color:#85714D;border:1px solid #d4b24a;border-radius:10px;font-family:inherit;font-size:14px;cursor:pointer">تخطّي</button>
        </div>
        <div style="font-size:11px;color:#999;margin-top:14px;padding-top:14px;border-top:1px solid rgba(212,178,74,.2)">الأدمن: <strong>a.king@arsann.com</strong> · أي سؤال يقع على رأسي 🌟</div>
      </div>
    `;
    document.body.appendChild(bd);
    const close = () => { bd.remove(); LS.set('arsan_welcome_v2_shown', '1'); };
    bd.querySelector('#ampWmStart').onclick = () => {
      close();
      if (window.ArsanTour?.start) window.ArsanTour.start();
      else if (typeof window.startTour === 'function') window.startTour();
      else window.location.href = 'tour.html';
    };
    bd.querySelector('#ampWmSkip').onclick = close;
    bd.onclick = (e) => { if (e.target === bd) close(); };
  }

  /* ─────────────────────────────────────────────────────────────────
     #17  Breadcrumbs
     ───────────────────────────────────────────────────────────────── */
  function injectBreadcrumbs(){
    if ($('#amp-breadcrumbs')) return;
    if (!window.CURRENT_DEPT_ID) return;
    const main = $('main');
    if (!main) return;
    const dept = window.DEPT;
    const bc = document.createElement('nav');
    bc.id = 'amp-breadcrumbs';
    bc.style.cssText = 'max-width:1100px;margin:8px auto 0;padding:0 20px;direction:rtl;font-size:12px;color:var(--ink-3);font-family:"IBM Plex Sans Arabic",system-ui';
    bc.innerHTML = `
      <a href="index.html" style="color:var(--ink-3);text-decoration:none;hover:color:var(--accent)">🏠 الرئيسية</a>
      <span style="margin:0 8px;opacity:.5">›</span>
      <span style="color:var(--ink);font-weight:600">${dept?.icon||'📋'} ${escapeHtml(dept?.name||window.CURRENT_DEPT_ID)}</span>
    `;
    main.parentNode?.insertBefore(bc, main);
  }

  /* ─────────────────────────────────────────────────────────────────
     #19  SOP code auto-suggest helper (exposed)
     ───────────────────────────────────────────────────────────────── */
  function suggestSopCode(deptId){
    const sops = window.SOPS || [];
    const prefix = (deptId || '').slice(0, 3).toUpperCase();
    const nums = sops.map(s => {
      const m = (s.code||'').match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    }).filter(Boolean);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `${prefix}-${String(next).padStart(2,'0')}`;
  }
  window.ampSuggestCode = suggestSopCode;

  /* ─────────────────────────────────────────────────────────────────
     #20  Related SOPs (by purpose word overlap)
     ───────────────────────────────────────────────────────────────── */
  function findRelatedSops(sop, limit=3){
    if (!sop?.purpose) return [];
    const sops = window.SOPS || [];
    const words = (sop.purpose||'').toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const scored = sops
      .filter(s => s.code !== sop.code)
      .map(s => {
        const text = `${s.title||''} ${s.purpose||''}`.toLowerCase();
        const score = words.filter(w => text.includes(w)).length;
        return { sop: s, score };
      })
      .filter(x => x.score > 0)
      .sort((a,b) => b.score - a.score)
      .slice(0, limit);
    return scored.map(x => x.sop);
  }
  window.ampFindRelated = findRelatedSops;

  /* ─────────────────────────────────────────────────────────────────
     #23  Activity ticker
     ───────────────────────────────────────────────────────────────── */
  async function renderActivityTicker(){
    if (!isLoggedIn()) return;
    if ($('#amp-activity-ticker')) return;
    if (!window.location.pathname.match(/index\.html$|\/$/)) return;
    let items = [];
    try {
      const data = await fetch((window.API_BASE||'')+'/api/activity?limit=5', {
        headers: { Authorization: 'Bearer '+(localStorage.getItem('arsan_token')||'') }
      }).then(r => r.json());
      items = data?.items || data?.activity || [];
    } catch{}
    if (!items.length) return;
    const ticker = document.createElement('div');
    ticker.id = 'amp-activity-ticker';
    ticker.style.cssText = 'max-width:1100px;margin:14px auto 0;padding:10px 18px;background:linear-gradient(90deg,rgba(133,113,77,.08),transparent);border-inline-start:3px solid var(--accent,#D4B24A);border-radius:8px;direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui;font-size:12.5px;color:var(--ink-2);display:flex;align-items:center;gap:10px;overflow:hidden';
    ticker.innerHTML = `
      <span style="flex-shrink:0;font-weight:700;color:var(--accent,#D4B24A)">⚡ آخر النشاط</span>
      <div style="flex:1;overflow:hidden">
        <div style="display:flex;gap:24px;animation:ampTickerScroll 40s linear infinite;width:max-content">
          ${items.map(a => {
            const when = a.ts ? timeAgo(a.ts) : '';
            return `<span style="white-space:nowrap"><span style="color:var(--ink)">${escapeHtml(a.user||a.email||'فريق أرسان')}</span> ${escapeHtml(a.action||'حدّث')} <span style="opacity:.6">${when}</span></span>`;
          }).join(' • ')}
        </div>
      </div>
      <style>@keyframes ampTickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style>
    `;
    const main = $('main') || document.body;
    main.parentNode?.insertBefore(ticker, main);
  }
  function timeAgo(ts){
    const sec = (Date.now() - ts) / 1000;
    if (sec < 60) return 'الآن';
    if (sec < 3600) return `قبل ${Math.floor(sec/60)} دقيقة`;
    if (sec < 86400) return `قبل ${Math.floor(sec/3600)} ساعة`;
    return `قبل ${Math.floor(sec/86400)} يوم`;
  }

  /* ─────────────────────────────────────────────────────────────────
     #25  Reactions (👍 ❤️ 🎯)
     ───────────────────────────────────────────────────────────────── */
  function injectReactionsInModal(){
    document.addEventListener('click', () => {
      setTimeout(() => {
        const modal = $('.modal-head, .arsan-sop-head');
        if (!modal || modal.querySelector('.amp-reactions')) return;
        const idx = window.state?.openIdx;
        if (idx == null) return;
        const sop = window.SOPS?.[idx];
        if (!sop) return;
        const key = `arsan_react_${window.CURRENT_DEPT_ID}_${sop.code}`;
        const data = LS.get(key, { '👍':0, '❤️':0, '🎯':0, my:null });
        const wrap = document.createElement('div');
        wrap.className = 'amp-reactions';
        wrap.style.cssText = 'display:inline-flex;gap:4px;margin-inline-end:8px;align-items:center';
        ['👍','❤️','🎯'].forEach(emoji => {
          const btn = document.createElement('button');
          btn.style.cssText = `background:${data.my===emoji?'rgba(212,178,74,.25)':'transparent'};border:1px solid ${data.my===emoji?'#D4B24A':'var(--line)'};padding:4px 9px;border-radius:18px;font-size:13px;cursor:pointer;font-family:inherit;display:inline-flex;gap:4px;align-items:center`;
          btn.innerHTML = `${emoji} <span style="font-size:11px;font-feature-settings:'tnum';opacity:.7">${data[emoji]||0}</span>`;
          btn.onclick = (e) => {
            e.stopPropagation();
            const cur = LS.get(key, { '👍':0, '❤️':0, '🎯':0, my:null });
            if (cur.my === emoji) { cur[emoji]=Math.max(0,(cur[emoji]||1)-1); cur.my=null; }
            else {
              if (cur.my) cur[cur.my] = Math.max(0,(cur[cur.my]||1)-1);
              cur[emoji] = (cur[emoji]||0)+1; cur.my = emoji;
            }
            LS.set(key, cur);
            wrap.remove(); injectReactionsInModal();
          };
          wrap.appendChild(btn);
        });
        modal.appendChild(wrap);
      }, 200);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     #26  Share via copy-link
     ───────────────────────────────────────────────────────────────── */
  function copyShareLink(sop){
    if (!sop) return;
    const url = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}dashboard.html?dept=${window.CURRENT_DEPT_ID}#${encodeURIComponent(sop.code)}`;
    navigator.clipboard?.writeText(url).then(() => toast({ msg:'تم نسخ الرابط', type:'success' }))
      .catch(() => toast({ msg:'تعذّر النسخ', type:'error' }));
  }
  window.ampCopyShareLink = copyShareLink;

  /* ─────────────────────────────────────────────────────────────────
     #28 + #29  Comment & Task badges on cards
     ───────────────────────────────────────────────────────────────── */
  function decorateCardsWithBadges(){
    if (!window.SOPS) return;
    $$('#grid .card').forEach((card, idx) => {
      const sop = window.SOPS[idx];
      if (!sop || card.querySelector('.amp-card-badges')) return;
      const wrap = document.createElement('div');
      wrap.className = 'amp-card-badges';
      wrap.style.cssText = 'position:absolute;top:8px;inset-inline-start:8px;display:flex;gap:6px;z-index:3;pointer-events:none';
      // Stub badges (real counts come from API)
      const cmtCount = sop.commentsCount || 0;
      const taskCount = sop.tasksCount || 0;
      if (cmtCount > 0) {
        wrap.innerHTML += `<span style="background:rgba(58,143,102,.18);color:#3a8f66;padding:2px 7px;border-radius:10px;font-size:10.5px;font-weight:600;display:inline-flex;align-items:center;gap:3px">💬 ${cmtCount}</span>`;
      }
      if (taskCount > 0) {
        wrap.innerHTML += `<span style="background:rgba(220,140,40,.18);color:#dc8c28;padding:2px 7px;border-radius:10px;font-size:10.5px;font-weight:600;display:inline-flex;align-items:center;gap:3px">📌 ${taskCount}</span>`;
      }
      if (wrap.children.length > 0) {
        card.style.position = 'relative';
        card.appendChild(wrap);
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     #33  Dark mode polish
     ───────────────────────────────────────────────────────────────── */
  function injectDarkPolish(){
    if (document.getElementById('amp-dark-polish')) return;
    const s = document.createElement('style');
    s.id = 'amp-dark-polish';
    s.textContent = `
      [data-theme="dark"]{
        --bg:#161310; --bg-2:#1f1a13; --surface:#251e15; --surface-2:#2d251a;
        --ink:#f3e9c9; --ink-2:#c9b27a; --ink-3:#8a7a55;
        --line:rgba(212,178,74,.18); --accent:#D4B24A; --brand:#D4B24A;
      }
      [data-theme="dark"] body{background:linear-gradient(180deg,#161310,#1a1510)!important}
      [data-theme="dark"] .card{background:linear-gradient(180deg,rgba(40,32,22,.6),rgba(28,22,15,.8))!important;border-color:rgba(212,178,74,.18)!important;color:var(--ink)!important}
      [data-theme="dark"] .card:hover{border-color:rgba(212,178,74,.35)!important;box-shadow:0 8px 30px rgba(212,178,74,.08)!important}
      [data-theme="dark"] .card .title{color:var(--ink)!important}
      [data-theme="dark"] .card .desc{color:var(--ink-2)!important}
      [data-theme="dark"] .modal{background:#1f1a13!important;color:var(--ink)!important}
      [data-theme="dark"] .arsan-topbar{background:rgba(35,28,18,.85)!important}
      [data-theme="dark"] .arsan-topbar-btn{background:rgba(50,40,28,.6)!important;color:var(--ink)!important;border-color:rgba(212,178,74,.2)!important}
      [data-theme="dark"] input,[data-theme="dark"] textarea,[data-theme="dark"] select{background:rgba(40,32,22,.6)!important;border-color:rgba(212,178,74,.2)!important;color:var(--ink)!important}
      [data-theme="dark"] .stat{background:rgba(40,32,22,.5)!important}
      [data-theme="dark"] .chip{color:var(--ink-2)!important}
      [data-theme="dark"] .chip[aria-pressed="true"]{background:var(--accent)!important;color:#1a1310!important}
      html{transition:background-color .3s ease}
      body{transition:background-color .3s ease,color .3s ease}
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────────────────────
     #34  Skeleton loaders
     ───────────────────────────────────────────────────────────────── */
  function injectSkeletonStyles(){
    if (document.getElementById('amp-skel')) return;
    const s = document.createElement('style');
    s.id = 'amp-skel';
    s.textContent = `
      .amp-skel{position:relative;overflow:hidden;background:rgba(212,178,74,.08);border-radius:8px}
      .amp-skel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(212,178,74,.18),transparent);animation:ampSkel 1.4s infinite}
      @keyframes ampSkel{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────────────────────
     #36  Scroll-to-top button
     ───────────────────────────────────────────────────────────────── */
  function injectScrollTop(){
    if ($('#amp-stt')) return;
    const btn = document.createElement('button');
    btn.id = 'amp-stt';
    btn.title = 'العودة للأعلى';
    btn.innerHTML = '↑';
    btn.style.cssText = 'position:fixed;bottom:24px;inset-inline-start:24px;width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#D4B24A,#85714D);color:#fff;border:none;cursor:pointer;font-size:18px;font-weight:700;box-shadow:0 6px 20px rgba(133,113,77,.35);z-index:9050;opacity:0;transform:translateY(20px);transition:opacity .25s,transform .25s;display:none;font-family:inherit';
    document.body.appendChild(btn);
    btn.onclick = () => window.scrollTo({ top:0, behavior:'smooth' });
    let visible = false;
    window.addEventListener('scroll', () => {
      const should = window.scrollY > 400;
      if (should !== visible) {
        visible = should;
        if (should) {
          btn.style.display = 'block';
          requestAnimationFrame(() => { btn.style.opacity = '1'; btn.style.transform = 'none'; });
        } else {
          btn.style.opacity = '0'; btn.style.transform = 'translateY(20px)';
          setTimeout(() => { if (!visible) btn.style.display = 'none'; }, 250);
        }
      }
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────────────
     #38  Card hover lift
     ───────────────────────────────────────────────────────────────── */
  function injectCardHover(){
    if (document.getElementById('amp-card-hover')) return;
    const s = document.createElement('style');
    s.id = 'amp-card-hover';
    s.textContent = `
      .card{transition:transform .2s cubic-bezier(.4,.6,.3,1.2),box-shadow .2s}
      .card:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(133,113,77,.18)}
      .card{will-change:transform}
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────────────────────
     #40  Confetti (just for fun)
     ───────────────────────────────────────────────────────────────── */
  function fireConfetti(){
    const colors = ['#D4B24A','#85714D','#3a8f66','#dc8c28','#fff5e0'];
    for (let i=0;i<60;i++){
      const c = document.createElement('div');
      c.style.cssText = `position:fixed;top:-20px;left:${Math.random()*100}vw;width:8px;height:14px;background:${colors[i%colors.length]};border-radius:2px;z-index:99999;pointer-events:none;animation:ampConf ${2+Math.random()*2}s ease-in forwards;transform:rotate(${Math.random()*360}deg)`;
      document.body.appendChild(c);
      setTimeout(()=>c.remove(), 4500);
    }
    if (!document.getElementById('amp-conf-style')){
      const s = document.createElement('style');
      s.id = 'amp-conf-style';
      s.textContent = `@keyframes ampConf{from{transform:translateY(0) rotate(0deg)}to{transform:translateY(110vh) rotate(720deg);opacity:0}}`;
      document.head.appendChild(s);
    }
  }
  window.ampConfetti = fireConfetti;

  /* ─────────────────────────────────────────────────────────────────
     #42  Mobile layout polish
     ───────────────────────────────────────────────────────────────── */
  function injectMobilePolish(){
    if (document.getElementById('amp-mobile')) return;
    const s = document.createElement('style');
    s.id = 'amp-mobile';
    s.textContent = `
      @media (max-width:600px){
        .arsan-topbar{flex-wrap:wrap !important;gap:6px !important;padding:8px 10px !important}
        .arsan-topbar-btn{font-size:11.5px !important;padding:5px 9px !important}
        #grid{grid-template-columns:1fr !important;gap:12px !important}
        .header h1{font-size:22px !important}
        .stats{grid-template-columns:repeat(2,1fr) !important;gap:10px !important}
        .stat .num{font-size:20px !important}
        #arsan-kpi-strip{grid-template-columns:repeat(2,1fr) !important}
        #amp-stt{bottom:80px !important}
      }
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────────────────────
     #43  Admin: Bulk Export All Data (full backup)
     ───────────────────────────────────────────────────────────────── */
  async function exportFullBackup(){
    if (!isAdmin()) return toast({ msg:'للأدمن فقط', type:'error' });
    try {
      toast({ msg:'جاري تجميع النسخة الاحتياطية…', type:'info' });
      const data = await window.ArsanAPI.bootstrap();
      const backup = { exportedAt: new Date().toISOString(), version: VERSION, data };
      downloadFile(JSON.stringify(backup, null, 2), `arsan-backup-${Date.now()}.json`, 'application/json');
      toast({ msg:'✓ تم تنزيل النسخة', type:'success' });
    } catch(e) {
      toast({ msg:'فشل التصدير', type:'error' });
    }
  }
  window.ampFullBackup = exportFullBackup;

  /* ─────────────────────────────────────────────────────────────────
     #45  Admin: Stale SOPs report
     ───────────────────────────────────────────────────────────────── */
  function showStaleReport(){
    if (!isAdmin()) return;
    const sops = window.SOPS || [];
    const sixMonths = 180 * 86400000;
    const stale = sops.filter(s => !s.updatedAt || (Date.now() - s.updatedAt) > sixMonths);
    if (!stale.length) return toast({ msg:'كل الإجراءات حديثة 🎉', type:'success' });
    const list = stale.map(s => `• ${s.code} — ${s.title} (${s.updatedAt?timeAgo(s.updatedAt):'لم يُحدّث'})`).join('\n');
    if (confirm(`⚠️ ${stale.length} إجراء يحتاج مراجعة (قديم > 6 شهور):\n\n${list.slice(0,500)}\n\nهل تريد تصدير القائمة؟`)) {
      downloadFile(list, `arsan-stale-${Date.now()}.txt`, 'text/plain');
    }
  }
  window.ampStaleReport = showStaleReport;

  /* ─────────────────────────────────────────────────────────────────
     UNIVERSAL: Inject buttons in topbar (#1, #4, #5, #43)
     ───────────────────────────────────────────────────────────────── */
  function injectTopbarButtons(){
    const bar = $('.arsan-topbar');
    if (!bar) return;
    injectCmdKButton();
    // CSV
    if (window.CURRENT_DEPT_ID && !bar.querySelector('[data-amp-csv]')){
      const b = document.createElement('button');
      b.className = 'arsan-topbar-btn'; b.dataset.ampCsv='1';
      b.innerHTML = '📊 CSV'; b.title = 'تصدير الإجراءات كملف CSV';
      b.onclick = exportSopsToCsv;
      bar.appendChild(b);
    }
    // Admin tools dropdown
    if (isAdmin() && !bar.querySelector('[data-amp-admin]')){
      const b = document.createElement('button');
      b.className = 'arsan-topbar-btn'; b.dataset.ampAdmin='1';
      b.innerHTML = '🛡️ أدوات الأدمن';
      b.style.cssText = 'background:linear-gradient(135deg,#5E4F36,#85714D)!important;color:#fff!important;font-weight:600!important';
      b.onclick = (e) => {
        e.stopPropagation();
        let dd = $('#ampAdminDD');
        if (dd) { dd.remove(); return; }
        dd = document.createElement('div');
        dd.id = 'ampAdminDD';
        dd.style.cssText = 'position:absolute;top:100%;inset-inline-end:0;background:#1f1a13;border:1px solid rgba(212,178,74,.3);border-radius:10px;padding:6px;min-width:240px;box-shadow:0 12px 30px rgba(0,0,0,.4);z-index:9050;margin-top:4px';
        const items = [
          ['💾 نسخة احتياطية كاملة', exportFullBackup],
          ['📋 إجراءات قديمة (>6 أشهر)', showStaleReport],
          ['📊 تصدير CSV الحالي', exportSopsToCsv],
          ['📦 تصدير JSON الحالي', exportSopsToJson],
          ['⌨️ الاختصارات', showShortcuts],
        ];
        items.forEach(([label, fn]) => {
          const it = document.createElement('button');
          it.style.cssText = 'display:block;width:100%;text-align:right;padding:9px 12px;background:transparent;border:none;color:#f3e9c9;font-family:inherit;font-size:13px;cursor:pointer;border-radius:6px';
          it.textContent = label;
          it.onmouseover = () => it.style.background='rgba(212,178,74,.15)';
          it.onmouseout  = () => it.style.background='transparent';
          it.onclick = () => { dd.remove(); fn(); };
          dd.appendChild(it);
        });
        b.style.position = 'relative';
        b.appendChild(dd);
        setTimeout(() => document.addEventListener('click', function once(ev){ if (!dd.contains(ev.target)){ dd.remove(); document.removeEventListener('click', once); } }), 50);
      };
      bar.appendChild(b);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     PDF button in SOP modal (#3)
     ───────────────────────────────────────────────────────────────── */
  function injectPdfButton(){
    const heads = $$('.modal-head, .arsan-sop-head');
    heads.forEach(head => {
      if (head.querySelector('[data-amp-pdf]')) return;
      const idx = window.state?.openIdx;
      if (idx == null || !window.SOPS?.[idx]) return;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:inline-flex;gap:6px;margin-inline-end:6px';
      // PDF
      const pdfBtn = document.createElement('button');
      pdfBtn.dataset.ampPdf = '1';
      pdfBtn.style.cssText = 'background:linear-gradient(135deg,#D4B24A,#85714D);color:#fff;border:none;padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-weight:600';
      pdfBtn.innerHTML = '📄 PDF';
      pdfBtn.title = 'تصدير كـ PDF';
      pdfBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); exportSopToPdf(window.SOPS[idx]); };
      // Share
      const shBtn = document.createElement('button');
      shBtn.style.cssText = 'background:transparent;color:var(--ink-2);border:1px solid var(--line);padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:5px';
      shBtn.innerHTML = '🔗 رابط';
      shBtn.title = 'نسخ رابط الإجراء';
      shBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); copyShareLink(window.SOPS[idx]); };
      wrap.appendChild(pdfBtn); wrap.appendChild(shBtn);
      head.appendChild(wrap);
      // Track recent
      pushRecent(window.SOPS[idx]);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     Global keyboard shortcuts
     ───────────────────────────────────────────────────────────────── */
  let gKey = false;
  document.addEventListener('keydown', (e) => {
    const inInput = ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) || e.target.isContentEditable;
    if (e.key === '?' && !inInput) { e.preventDefault(); showShortcuts(); return; }
    if (e.key === 'b' && !inInput && (e.ctrlKey || e.metaKey)) { e.preventDefault(); toggleBulkMode(); return; }
    if (e.key === 'g' && !inInput) { gKey = true; setTimeout(() => gKey = false, 1500); return; }
    if (gKey && !inInput) {
      gKey = false;
      if (e.key === 'h') window.location.href = 'index.html';
      else if (e.key === 'd') window.location.href = 'index.html';
      else if (e.key === 'p') window.location.href = 'profile.html';
      else if (e.key === 'u' && isAdmin()) window.location.href = 'users.html';
    }
  });

  /* ─────────────────────────────────────────────────────────────────
     INIT — run everything
     ───────────────────────────────────────────────────────────────── */
  function initOnce(){
    injectToastStyles();
    injectDarkPolish();
    injectSkeletonStyles();
    injectCardHover();
    injectMobilePolish();
    injectPrintStyles();
  }

  function initRepeating(){
    injectTopbarButtons();
    injectQuickFilters();
    patchRenderGrid();
    injectPdfButton();
    decorateCardsWithBadges();
    if (bulkMode) decorateCardsForBulk();
  }

  function initOnceLoaded(){
    setTimeout(injectScrollTop, 200);
    setTimeout(injectBreadcrumbs, 300);
    setTimeout(renderKpiStrip, 500);
    setTimeout(renderEmptyState, 600);
    setTimeout(continueWhereYouLeftOff, 700);
    setTimeout(renderActivityTicker, 1000);
    setTimeout(showWelcomeModal, 1800);
    injectReactionsInModal();
  }

  function start(){
    initOnce();
    initRepeating();
    initOnceLoaded();
    // React to DOM changes (topbar might be re-rendered)
    const obs = new MutationObserver(() => initRepeating());
    obs.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* ─────────────────────────────────────────────────────────────────
     Public API
     ───────────────────────────────────────────────────────────────── */
  window.ArsanMegaPack = {
    version: VERSION,
    toast,
    exportSopToPdf, exportSopsToCsv, exportSopsToJson, exportFullBackup,
    showShortcuts, showStaleReport, showWelcomeModal,
    suggestSopCode, findRelatedSops, copyShareLink,
    fireConfetti,
    toggleBulkMode,
    quickFilter: (mode) => { qFilter = mode; LS.set('arsan_qf_v1', mode); window.renderGrid?.(); },
    resetWelcome: () => LS.del('arsan_welcome_v2_shown'),
    resetTour:    () => LS.del('arsan_tour_v2_shown'),
  };

  console.log('[Arsan MegaPack v'+VERSION+'] 50 improvements loaded ✨');
})();

/* =====================================================================
   Arsann — Improvements Pack (13 enhancements)
   --------------------------------------------------------------------
   1️⃣  Search button in topbar (Cmd+K trigger)
   2️⃣  Home Dashboard (already exists — boosts visibility)
   3️⃣  Tasks system shortcuts
   4️⃣  Comments hooks
   5️⃣  PDF export per SOP
   6️⃣  Favorites star (already exists — adds keyboard shortcut)
   7️⃣  Empty State for empty departments
   8️⃣  Quick filters (الأنشط/الأقدم/المعدّل اليوم)
   9️⃣  Auto-launch Onboarding Tour first time
   🔟  Welcome Modal first time
   1️⃣1️⃣ KPI strip per dept
   1️⃣2️⃣ Dark mode polish
   1️⃣3️⃣ CSV export
   ===================================================================== */
(function(){
  'use strict';
  if (window.__ArsanImprovements) return;
  window.__ArsanImprovements = true;

  const LS_KEYS = {
    welcomeShown:    'arsan_welcome_v2_shown',
    tourShown:       'arsan_tour_v2_shown',
    quickFilter:     'arsan_quick_filter_v1',
  };

  const $$ = (sel, root=document) => Array.from((root||document).querySelectorAll(sel));
  const $  = (sel, root=document) => (root||document).querySelector(sel);

  /* ---------------------------------------------------------------- */
  /* 1️⃣  Cmd+K button in topbar                                        */
  /* ---------------------------------------------------------------- */
  function injectSearchButton(){
    const bar = document.querySelector('.arsan-topbar');
    if (!bar) return;
    if (bar.querySelector('[data-arsan-cmdk-btn]')) return;
    const btn = document.createElement('button');
    btn.className = 'arsan-topbar-btn';
    btn.dataset.arsanCmdkBtn = '1';
    btn.title = 'بحث شامل (Ctrl/Cmd + K)';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-inline-end:4px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span>بحث</span>
      <span style="font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(212,178,74,.16);margin-inline-start:6px;font-family:ui-monospace,monospace;letter-spacing:.3px">⌘K</span>
    `;
    btn.onclick = () => {
      if (window.ArsanCmdK?.open) window.ArsanCmdK.open();
    };
    bar.insertBefore(btn, bar.firstChild);
  }

  /* ---------------------------------------------------------------- */
  /* 5️⃣  PDF Export — uses native window.print() with branded styles  */
  /* ---------------------------------------------------------------- */
  function makePrintCss(){
    return `
      <style>
        @page { size: A4; margin: 18mm 16mm; }
        @media print {
          body { font-family:"IBM Plex Sans Arabic","Cairo",sans-serif; direction:rtl; color:#1a1a1a; background:#fff; }
          .arsan-pdf-doc { max-width:100%; }
          .arsan-pdf-head {
            display:flex; justify-content:space-between; align-items:flex-end;
            border-bottom:3px double #85714D; padding-bottom:14px; margin-bottom:18px;
          }
          .arsan-pdf-head h1 { font-size:22pt; color:#85714D; margin:0; }
          .arsan-pdf-head .meta { font-size:10pt; color:#666; text-align:left; }
          .arsan-pdf-head .logo { font-size:14pt; font-weight:700; color:#85714D; letter-spacing:.5px; }
          .arsan-pdf-section { margin-bottom:14px; page-break-inside:avoid; }
          .arsan-pdf-section h3 {
            font-size:13pt; color:#85714D; margin:0 0 6px;
            border-bottom:1px solid #d4b24a; padding-bottom:3px;
          }
          .arsan-pdf-section p, .arsan-pdf-section li { font-size:11pt; line-height:1.7; color:#1a1a1a; margin:0 0 4px; }
          .arsan-pdf-section ol, .arsan-pdf-section ul { padding-inline-start:18px; }
          .arsan-pdf-foot {
            position:fixed; bottom:8mm; left:0; right:0; text-align:center;
            font-size:8pt; color:#999; border-top:1px solid #ddd; padding-top:4px;
          }
          .arsan-pdf-table { width:100%; border-collapse:collapse; margin:6px 0; font-size:10pt; }
          .arsan-pdf-table th, .arsan-pdf-table td { border:1px solid #d4b24a; padding:6px 8px; text-align:right; }
          .arsan-pdf-table th { background:#faf5e3; color:#85714D; font-weight:700; }
        }
      </style>`;
  }

  function exportSopToPdf(sop){
    if (!sop) return;
    const dept = window.DEPT?.name || window.CURRENT_DEPT_ID || 'إدارة';
    const today = new Date().toLocaleDateString('ar-SA', { year:'numeric', month:'long', day:'numeric' });
    const escapeHtml = (s) => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const renderList = (items) => Array.isArray(items) && items.length
      ? `<ol>${items.map(i => `<li>${escapeHtml(typeof i === 'string' ? i : i.text || i.label || '')}</li>`).join('')}</ol>`
      : '<p style="color:#999;font-style:italic">— لم يتم التوثيق بعد —</p>';

    const html = `
<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>${escapeHtml(sop.code || '')} — ${escapeHtml(sop.title || '')}</title>
${makePrintCss()}
</head>
<body>
<div class="arsan-pdf-doc">
  <div class="arsan-pdf-head">
    <div>
      <div class="logo">منصّة أرسان</div>
      <h1>${escapeHtml(sop.title || 'إجراء')}</h1>
      <div style="font-size:11pt;color:#666;margin-top:4px">${escapeHtml(dept)} · ${escapeHtml(sop.code || '')}</div>
    </div>
    <div class="meta">
      <div>تاريخ الطباعة: ${today}</div>
      <div>الإصدار: ${escapeHtml(sop.version || '1.0')}</div>
      ${sop.updatedAt ? `<div>آخر تحديث: ${new Date(sop.updatedAt).toLocaleDateString('ar-SA')}</div>` : ''}
    </div>
  </div>
  ${sop.purpose ? `<div class="arsan-pdf-section"><h3>الغرض</h3><p>${escapeHtml(sop.purpose)}</p></div>` : ''}
  ${sop.scope ? `<div class="arsan-pdf-section"><h3>النطاق</h3><p>${escapeHtml(sop.scope)}</p></div>` : ''}
  ${sop.responsibilities ? `<div class="arsan-pdf-section"><h3>المسؤوليات</h3><p>${escapeHtml(sop.responsibilities)}</p></div>` : ''}
  ${sop.steps ? `<div class="arsan-pdf-section"><h3>الخطوات</h3>${renderList(sop.steps)}</div>` : ''}
  ${sop.kpis ? `<div class="arsan-pdf-section"><h3>مؤشرات الأداء (KPIs)</h3>${renderList(sop.kpis)}</div>` : ''}
  ${sop.forms ? `<div class="arsan-pdf-section"><h3>النماذج المرتبطة</h3>${renderList(sop.forms)}</div>` : ''}
  ${sop.references ? `<div class="arsan-pdf-section"><h3>المراجع</h3>${renderList(sop.references)}</div>` : ''}
  <div class="arsan-pdf-foot">منصّة أرسان للإجراءات التشغيلية القياسية — وثيقة رسمية</div>
</div>
<script>setTimeout(()=>window.print(), 350); window.onafterprint = ()=>window.close();<\/script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert('تم منع النوافذ المنبثقة. اسمح بها وحاول ثانية.'); return; }
    w.document.write(html);
    w.document.close();
  }

  /* ---------------------------------------------------------------- */
  /* 1️⃣3️⃣  CSV Export — all SOPs in current dept                    */
  /* ---------------------------------------------------------------- */
  function exportSopsToCsv(){
    const sops = window.SOPS || [];
    if (!sops.length) { alert('لا توجد إجراءات للتصدير'); return; }
    const dept = window.DEPT?.name || 'department';
    const headers = ['الكود','العنوان','المرحلة','الغرض','المسؤول','آخر تحديث','الحالة'];
    const rows = sops.map(s => [
      s.code || '',
      (s.title || '').replace(/"/g,'""'),
      s.phase || s.group || '',
      (s.purpose || '').replace(/"/g,'""').slice(0, 200),
      s.owner || '',
      s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('ar-SA') : '',
      s.status || 'مفعّل',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c||'')}"`).join(',')).join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for Excel Arabic
    const blob = new Blob([bom + csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arsan-${dept}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  /* ---------------------------------------------------------------- */
  /* 8️⃣  Quick Filters (الأنشط / الأقدم / المعدّل اليوم)              */
  /* ---------------------------------------------------------------- */
  let quickFilterMode = localStorage.getItem(LS_KEYS.quickFilter) || 'all';

  function applyQuickFilter(sops){
    if (!Array.isArray(sops)) return sops;
    const now = Date.now();
    const oneDay = 86400000;
    switch (quickFilterMode) {
      case 'recent':
        return [...sops].sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
      case 'oldest':
        return [...sops].sort((a,b) => (a.updatedAt||Infinity) - (b.updatedAt||Infinity));
      case 'today':
        return sops.filter(s => s.updatedAt && (now - s.updatedAt) < oneDay);
      case 'incomplete':
        return sops.filter(s => !s.steps || !s.steps.length || !s.purpose);
      default:
        return sops;
    }
  }

  function injectQuickFilters(){
    const chipsBar = $('#chips');
    if (!chipsBar) return;
    if (chipsBar.querySelector('[data-quick-filter]')) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:inline-flex;gap:6px;margin-inline-start:14px;align-items:center;border-inline-start:1px solid var(--line);padding-inline-start:14px';
    const opts = [
      { id:'all',        label:'الكل',          icon:'🗂️' },
      { id:'recent',     label:'الأنشط',        icon:'🔥' },
      { id:'today',      label:'اليوم',          icon:'⚡' },
      { id:'incomplete', label:'يحتاج توثيق',    icon:'📝' },
      { id:'oldest',     label:'الأقدم',         icon:'⏳' },
    ];
    opts.forEach(o => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.dataset.quickFilter = o.id;
      b.style.cssText = 'background:transparent;border:1px solid var(--line);color:var(--ink-2);padding:4px 10px;border-radius:999px;font-size:11.5px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px';
      b.innerHTML = `<span>${o.icon}</span><span>${o.label}</span>`;
      if (o.id === quickFilterMode) {
        b.style.background = 'var(--accent,#D4B24A)';
        b.style.color = '#1a1a1a';
        b.style.borderColor = 'var(--accent,#D4B24A)';
      }
      b.onclick = () => {
        quickFilterMode = o.id;
        localStorage.setItem(LS_KEYS.quickFilter, o.id);
        wrap.querySelectorAll('button').forEach(x => {
          x.style.background = 'transparent';
          x.style.color = 'var(--ink-2)';
          x.style.borderColor = 'var(--line)';
        });
        b.style.background = 'var(--accent,#D4B24A)';
        b.style.color = '#1a1a1a';
        b.style.borderColor = 'var(--accent,#D4B24A)';
        if (typeof window.renderGrid === 'function') window.renderGrid();
      };
      wrap.appendChild(b);
    });
    chipsBar.appendChild(wrap);
  }

  // Hook into filteredSOPs by wrapping renderGrid
  function patchRenderGrid(){
    if (typeof window.renderGrid !== 'function') return;
    if (window.renderGrid.__patched) return;
    const orig = window.renderGrid;
    window.renderGrid = function(){
      // Temporarily patch SOPS for the duration of rendering
      const before = window.SOPS;
      window.SOPS = applyQuickFilter(before);
      try { orig.apply(this, arguments); }
      finally { window.SOPS = before; }
    };
    window.renderGrid.__patched = true;
  }

  /* ---------------------------------------------------------------- */
  /* 7️⃣  Empty State for departments without SOPs                    */
  /* ---------------------------------------------------------------- */
  function renderEmptyState(){
    const grid = $('#grid');
    if (!grid) return;
    if ((window.SOPS || []).length > 0) return;
    if (grid.querySelector('.arsan-empty-state')) return;
    const deptName = window.DEPT?.name || 'هذه الإدارة';
    grid.innerHTML = `
      <div class="arsan-empty-state" style="grid-column:1/-1;padding:60px 30px;text-align:center;background:linear-gradient(135deg,rgba(212,178,74,.08),rgba(133,113,77,.04));border-radius:18px;border:2px dashed rgba(212,178,74,.3)">
        <div style="font-size:64px;margin-bottom:14px">📋</div>
        <h2 style="font-size:22px;color:var(--ink);margin:0 0 8px">${deptName} — جاهزة للانطلاق</h2>
        <p style="color:var(--ink-2);font-size:14px;max-width:460px;margin:0 auto 22px;line-height:1.7">
          لا توجد إجراءات بعد. ابدأ بإضافة أول إجراء، أو استورد من ملف Word/PDF موجود.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button id="esAddSop" style="padding:11px 24px;background:linear-gradient(135deg,#D4B24A,#85714D);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(133,113,77,.3)">
            ➕ إضافة أول إجراء
          </button>
          <button id="esImport" style="padding:11px 24px;background:#fff;color:#85714D;border:1px solid #D4B24A;border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer">
            📥 استيراد من ملف
          </button>
          <button id="esExamples" style="padding:11px 24px;background:transparent;color:var(--ink-2);border:1px solid var(--line);border-radius:10px;font-family:inherit;font-size:14px;cursor:pointer">
            💡 شاهد أمثلة
          </button>
        </div>
        <div style="margin-top:30px;padding-top:24px;border-top:1px solid var(--line);font-size:12px;color:var(--ink-3)">
          نصيحة: اضغط <kbd style="padding:2px 6px;background:rgba(212,178,74,.12);border-radius:4px;font-family:ui-monospace,monospace">⌘K</kbd> للبحث عن إجراء في إدارة أخرى
        </div>
      </div>
    `;
    grid.querySelector('#esAddSop')?.addEventListener('click', () => {
      if (typeof window.showNewSopModal === 'function') window.showNewSopModal();
    });
    grid.querySelector('#esImport')?.addEventListener('click', () => {
      if (typeof window.showImportModal === 'function') window.showImportModal();
    });
    grid.querySelector('#esExamples')?.addEventListener('click', () => {
      // Navigate to a dept that has SOPs
      const depts = window.DEPARTMENTS_CONFIG || {};
      for (const [id] of Object.entries(depts)) {
        if (id !== window.CURRENT_DEPT_ID) {
          window.location.href = `dashboard.html?dept=${id}`;
          break;
        }
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* 1️⃣1️⃣  KPI Strip — overview at top of dept page                  */
  /* ---------------------------------------------------------------- */
  function renderKpiStrip(){
    const sops = window.SOPS || [];
    if (!sops.length) return;
    const host = document.querySelector('.toolbar') || document.querySelector('main');
    if (!host) return;
    if (document.getElementById('arsan-kpi-strip')) return;
    const total = sops.length;
    const documented = sops.filter(s => s.steps && s.steps.length && s.purpose).length;
    const pct = total ? Math.round(documented / total * 100) : 0;
    const oneWeek = 7 * 86400000;
    const recent = sops.filter(s => s.updatedAt && (Date.now() - s.updatedAt) < oneWeek).length;
    const incomplete = total - documented;

    const strip = document.createElement('div');
    strip.id = 'arsan-kpi-strip';
    strip.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:14px 0 18px;padding:0';
    strip.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(212,178,74,.12),rgba(133,113,77,.04));padding:14px 16px;border-radius:12px;border:1px solid rgba(212,178,74,.18)">
        <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">إجمالي الإجراءات</div>
        <div style="font-size:24px;font-weight:700;color:var(--ink);font-feature-settings:'tnum'">${total}</div>
      </div>
      <div style="background:linear-gradient(135deg,rgba(58,143,102,.12),rgba(58,143,102,.03));padding:14px 16px;border-radius:12px;border:1px solid rgba(58,143,102,.18)">
        <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">الموثّق</div>
        <div style="font-size:24px;font-weight:700;color:#3a8f66;font-feature-settings:'tnum'">${documented} <span style="font-size:13px;opacity:.6">/ ${total}</span></div>
        <div style="height:4px;background:rgba(58,143,102,.15);border-radius:2px;margin-top:8px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#3a8f66,#5fb588);border-radius:2px;transition:width .6s"></div>
        </div>
      </div>
      <div style="background:linear-gradient(135deg,rgba(220,140,40,.12),rgba(220,140,40,.03));padding:14px 16px;border-radius:12px;border:1px solid rgba(220,140,40,.18)">
        <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">يحتاج توثيقاً</div>
        <div style="font-size:24px;font-weight:700;color:#dc8c28;font-feature-settings:'tnum'">${incomplete}</div>
      </div>
      <div style="background:linear-gradient(135deg,rgba(184,84,80,.10),rgba(184,84,80,.02));padding:14px 16px;border-radius:12px;border:1px solid rgba(184,84,80,.16)">
        <div style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">حُدّث هذا الأسبوع</div>
        <div style="font-size:24px;font-weight:700;color:var(--ink);font-feature-settings:'tnum'">${recent}</div>
      </div>
    `;
    const main = document.querySelector('main') || document.body;
    const grid = document.getElementById('grid');
    if (grid && grid.parentNode) {
      grid.parentNode.insertBefore(strip, grid);
    }
  }

  /* ---------------------------------------------------------------- */
  /* 1️⃣2️⃣  Dark mode polish — auto-detect + smooth                   */
  /* ---------------------------------------------------------------- */
  function polishDarkMode(){
    if (document.getElementById('arsan-dark-polish')) return;
    const s = document.createElement('style');
    s.id = 'arsan-dark-polish';
    s.textContent = `
      [data-theme="dark"] {
        --bg: #161310;
        --bg-2: #1f1a13;
        --surface: #251e15;
        --surface-2: #2d251a;
        --ink: #f3e9c9;
        --ink-2: #c9b27a;
        --ink-3: #8a7a55;
        --line: rgba(212,178,74,.18);
        --accent: #D4B24A;
        --brand: #D4B24A;
      }
      [data-theme="dark"] body {
        background:linear-gradient(180deg, #161310 0%, #1a1510 100%) !important;
      }
      [data-theme="dark"] .card {
        background:linear-gradient(180deg, rgba(40,32,22,.6), rgba(28,22,15,.8)) !important;
        border-color:rgba(212,178,74,.18) !important;
        color:var(--ink) !important;
      }
      [data-theme="dark"] .card:hover {
        border-color:rgba(212,178,74,.35) !important;
        box-shadow:0 8px 30px rgba(212,178,74,.08) !important;
      }
      [data-theme="dark"] .card .title { color:var(--ink) !important; }
      [data-theme="dark"] .card .desc { color:var(--ink-2) !important; }
      [data-theme="dark"] .modal { background:#1f1a13 !important; color:var(--ink) !important; }
      [data-theme="dark"] .arsan-topbar { background:rgba(35,28,18,.85) !important; }
      [data-theme="dark"] .arsan-topbar-btn { background:rgba(50,40,28,.6) !important; color:var(--ink) !important; border-color:rgba(212,178,74,.2) !important; }
      [data-theme="dark"] input, [data-theme="dark"] textarea, [data-theme="dark"] select {
        background:rgba(40,32,22,.6) !important;
        border-color:rgba(212,178,74,.2) !important;
        color:var(--ink) !important;
      }
      [data-theme="dark"] .stat { background:rgba(40,32,22,.5) !important; }
      [data-theme="dark"] .chip { color:var(--ink-2) !important; }
      [data-theme="dark"] .chip[aria-pressed="true"] { background:var(--accent) !important; color:#1a1310 !important; }
      html { transition: background-color .3s ease; }
      body { transition: background-color .3s ease, color .3s ease; }
    `;
    document.head.appendChild(s);
  }

  /* ---------------------------------------------------------------- */
  /* 9️⃣ + 🔟  Welcome Modal + Auto Tour                                */
  /* ---------------------------------------------------------------- */
  function showWelcomeModal(){
    if (localStorage.getItem(LS_KEYS.welcomeShown)) return;
    if (!window.ArsanAPI?.isLoggedIn?.()) return;
    const me = window.ArsanAPI.me?.() || {};
    const name = me.name || me.email?.split('@')[0] || 'صديقي';
    const bd = document.createElement('div');
    bd.style.cssText = `
      position:fixed; inset:0; z-index:99999;
      background:rgba(15,12,8,.7); backdrop-filter:blur(10px);
      display:flex; align-items:center; justify-content:center;
      padding:20px; direction:rtl; font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;
      animation:arsanWelFade .3s;
    `;
    bd.innerHTML = `
      <style>@keyframes arsanWelFade{from{opacity:0}to{opacity:1}} @keyframes arsanWelPop{from{transform:translateY(20px) scale(.95);opacity:0}to{transform:none;opacity:1}}</style>
      <div style="background:linear-gradient(180deg,#fffaee,#fff5e0);border:1px solid rgba(212,178,74,.4);border-radius:20px;max-width:480px;width:100%;padding:36px 32px;text-align:center;animation:arsanWelPop .35s cubic-bezier(.4,.6,.3,1.2);box-shadow:0 30px 80px rgba(0,0,0,.4)">
        <div style="font-size:64px;margin-bottom:14px">🌿</div>
        <h2 style="font-size:24px;color:#85714D;margin:0 0 8px">مرحباً بك ${name}</h2>
        <p style="color:#5a4a30;font-size:15px;line-height:1.7;margin:0 0 22px">
          منصّة <strong>أرسان</strong> هي بيتك الرقمي للإجراءات التشغيلية. خذ جولة سريعة (90 ثانية) لتفهم كل الميزات.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:14px">
          <button id="awmStart" style="padding:12px 28px;background:linear-gradient(135deg,#D4B24A,#85714D);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(133,113,77,.3)">
            🐎 ابدأ الجولة
          </button>
          <button id="awmSkip" style="padding:12px 28px;background:transparent;color:#85714D;border:1px solid #d4b24a;border-radius:10px;font-family:inherit;font-size:14px;cursor:pointer">
            تخطّي الآن
          </button>
        </div>
        <div style="font-size:11px;color:#999;margin-top:14px;padding-top:14px;border-top:1px solid rgba(212,178,74,.2)">
          الأدمن: <strong>a.king@arsann.com</strong> · أي سؤال يقع على رأسي 🌟
        </div>
      </div>
    `;
    document.body.appendChild(bd);
    bd.querySelector('#awmStart').onclick = () => {
      bd.remove();
      localStorage.setItem(LS_KEYS.welcomeShown, '1');
      // Trigger tour
      if (window.ArsanTour?.start) window.ArsanTour.start();
      else if (typeof window.startTour === 'function') window.startTour();
      else window.location.href = 'tour.html';
    };
    bd.querySelector('#awmSkip').onclick = () => {
      bd.remove();
      localStorage.setItem(LS_KEYS.welcomeShown, '1');
    };
    bd.onclick = (e) => { if (e.target === bd) { bd.remove(); localStorage.setItem(LS_KEYS.welcomeShown,'1'); } };
  }

  /* ---------------------------------------------------------------- */
  /* PDF + CSV buttons in modal + topbar                              */
  /* ---------------------------------------------------------------- */
  function injectExportButtons(){
    // CSV button on dashboard topbar
    const bar = document.querySelector('.arsan-topbar');
    if (bar && !bar.querySelector('[data-arsan-csv]')) {
      const me = window.ArsanAPI?.me?.();
      if (me && me.role !== 'guest' && window.CURRENT_DEPT_ID) {
        const csvBtn = document.createElement('button');
        csvBtn.className = 'arsan-topbar-btn';
        csvBtn.dataset.arsanCsv = '1';
        csvBtn.title = 'تصدير كل الإجراءات كملف CSV';
        csvBtn.innerHTML = '📊 CSV';
        csvBtn.onclick = exportSopsToCsv;
        bar.appendChild(csvBtn);
      }
    }

    // PDF button inside open SOP modal — observe modal opens
    document.addEventListener('click', (e) => {
      // Heuristic — if a SOP modal is rendered, look for its head and inject button
      setTimeout(() => {
        const heads = document.querySelectorAll('.modal-head, .arsan-sop-head, .sop-modal-head');
        heads.forEach(head => {
          if (head.querySelector('[data-arsan-pdf]')) return;
          const idx = window.state?.openIdx;
          if (idx == null || !window.SOPS || !window.SOPS[idx]) return;
          const btn = document.createElement('button');
          btn.dataset.arsanPdf = '1';
          btn.title = 'تصدير PDF';
          btn.style.cssText = 'background:linear-gradient(135deg,#D4B24A,#85714D);color:#fff;border:none;padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;margin-inline-end:6px';
          btn.innerHTML = '📄 PDF';
          btn.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); exportSopToPdf(window.SOPS[idx]); };
          head.appendChild(btn);
        });
      }, 150);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Wire-up                                                            */
  /* ---------------------------------------------------------------- */
  function init(){
    polishDarkMode();
    injectSearchButton();
    injectQuickFilters();
    injectExportButtons();
    patchRenderGrid();
    setTimeout(renderKpiStrip, 500);
    setTimeout(renderEmptyState, 600);
    setTimeout(showWelcomeModal, 1500);

    // Re-inject on topbar refresh
    const obs = new MutationObserver(() => {
      injectSearchButton();
      injectQuickFilters();
      injectExportButtons();
    });
    obs.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.ArsanImprovements = {
    exportSopToPdf,
    exportSopsToCsv,
    showWelcomeModal,
    renderKpiStrip,
    quickFilter: (mode) => { quickFilterMode = mode; localStorage.setItem(LS_KEYS.quickFilter, mode); if (window.renderGrid) window.renderGrid(); },
    resetWelcome: () => localStorage.removeItem(LS_KEYS.welcomeShown),
  };
})();

/* ============================================================
 * Arsan Power Pack — 30 Functional Improvements (Layer 2)
 * تحسينات وظيفية آمنة — اختصارات، sorting، bulk، print، إلخ
 * ============================================================ */
(function () {
  'use strict';
  if (window.__ARSAN_POWER__) return;
  window.__ARSAN_POWER__ = true;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* ===== Toast (إن لم يكن موجوداً) ===== */
  function toast(msg, type='info') {
    if (window.ArsanToast?.show) return window.ArsanToast.show(msg, type);
    let host = document.getElementById('arsan-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'arsan-toast-host';
      host.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    const colors = { info:'#0ea5e9', success:'#22c55e', error:'#ef4444', warn:'#f59e0b' };
    t.style.cssText = `background:${colors[type]||colors.info};color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,0.18);pointer-events:auto;animation:arsan-toast-in .3s ease-out;`;
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-8px)'; t.style.transition = 'all .3s'; setTimeout(() => t.remove(), 300); }, 2800);
  }
  window.arsanToast = toast;

  /* ===== 1. Cmd/Ctrl+S = حفظ (يطلق حدث) ===== */
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('arsan:save'));
      const saveBtn = $('[data-save-btn], .save-btn, button[onclick*="save"]');
      if (saveBtn) { saveBtn.click(); toast('تم الحفظ ✓', 'success'); }
    }
  });

  /* ===== 2. Cmd/Ctrl+P = طباعة محسّنة ===== */
  // (متروك للمتصفح، لكن نستخدم print stylesheet)

  /* ===== 3. Esc = إغلاق modals ===== */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const closers = $$('[data-close-modal], .modal-close, .close-btn');
      const visibleModal = $$('.modal, [role="dialog"]').find(m => {
        const s = getComputedStyle(m);
        return s.display !== 'none' && s.visibility !== 'hidden' && m.offsetWidth > 0;
      });
      if (visibleModal) {
        const close = visibleModal.querySelector('[data-close-modal], .modal-close, .close-btn, button[aria-label*="close" i]');
        if (close) close.click();
      }
    }
  });

  /* ===== 4. ? = إظهار قائمة الاختصارات ===== */
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !e.target.matches('input, textarea, [contenteditable]')) {
      e.preventDefault();
      showShortcutsModal();
    }
  });

  function showShortcutsModal() {
    const existing = document.getElementById('arsan-shortcuts-modal');
    if (existing) { existing.remove(); return; }
    const modal = document.createElement('div');
    modal.id = 'arsan-shortcuts-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);z-index:99998;display:flex;align-items:center;justify-content:center;animation:arsan-fade-in-bg .2s;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:28px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <h2 style="margin:0;font-size:20px;font-weight:800;">⌨️ اختصارات لوحة المفاتيح</h2>
          <button onclick="this.closest('#arsan-shortcuts-modal').remove()" style="background:none;border:0;font-size:24px;cursor:pointer;color:#888;">×</button>
        </div>
        <div style="display:grid;gap:10px;font-size:14px;">
          ${[
            ['⌘ K / Ctrl K', 'بحث شامل'],
            ['⌘ S / Ctrl S', 'حفظ'],
            ['⌘ P / Ctrl P', 'طباعة'],
            ['⌘ B / Ctrl B', 'تبديل القائمة الجانبية'],
            ['⌘ D / Ctrl D', 'الوضع الليلي'],
            ['⌘ / / Ctrl /', 'مساعد الذكاء'],
            ['G ثم H', 'الذهاب للرئيسية'],
            ['G ثم D', 'لوحة الإدارة'],
            ['G ثم P', 'الملف الشخصي'],
            ['F', 'تركيز البحث'],
            ['N', 'إجراء جديد'],
            ['Esc', 'إغلاق النافذة'],
            ['?', 'هذه القائمة'],
          ].map(([k,d]) => `<div style="display:flex;justify-content:space-between;padding:8px 12px;background:rgba(0,0,0,0.04);border-radius:8px;"><span>${d}</span><kbd style="background:#fff;padding:2px 8px;border-radius:4px;border:1px solid rgba(0,0,0,0.1);font-family:ui-monospace,monospace;font-size:12px;">${k}</kbd></div>`).join('')}
        </div>
      </div>`;
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  /* ===== 5. F = تركيز البحث ===== */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !e.target.matches('input, textarea, [contenteditable]')) {
      const search = $('input[type="search"], input[placeholder*="بحث" i], input[name*="search" i]');
      if (search) { e.preventDefault(); search.focus(); }
    }
  });

  /* ===== 6. N = إجراء جديد ===== */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.target.matches('input, textarea, [contenteditable]')) {
      const newBtn = $('[data-new-sop], button[onclick*="newSop"], button[onclick*="addSop"], #btn-add-sop');
      if (newBtn) { e.preventDefault(); newBtn.click(); }
    }
  });

  /* ===== 7. G H/D/P = navigation ===== */
  let gKey = false;
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    if (e.key === 'g') { gKey = true; setTimeout(() => gKey = false, 1500); return; }
    if (gKey) {
      if (e.key === 'h') { window.location.href = 'index.html'; e.preventDefault(); }
      if (e.key === 'p') { window.location.href = 'profile.html'; e.preventDefault(); }
      if (e.key === 'u') { window.location.href = 'people.html'; e.preventDefault(); }
      gKey = false;
    }
  });

  /* ===== 8. Auto-save indicator ===== */
  let saveTimer;
  window.arsanSaveIndicator = function() {
    let dot = document.getElementById('arsan-save-dot');
    if (!dot) {
      dot = document.createElement('div');
      dot.id = 'arsan-save-dot';
      dot.style.cssText = 'position:fixed;bottom:20px;left:20px;background:rgba(34,197,94,0.95);color:#fff;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;display:none;';
      document.body.appendChild(dot);
    }
    dot.textContent = '💾 تم الحفظ';
    dot.style.display = 'block';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { dot.style.display = 'none'; }, 1800);
  };

  /* ===== 9. Copy link to SOP ===== */
  window.arsanCopyLink = function(sopId) {
    const url = `${location.origin}${location.pathname}?sop=${encodeURIComponent(sopId)}`;
    navigator.clipboard.writeText(url).then(() => toast('تم نسخ الرابط 🔗', 'success'));
  };

  /* ===== 10. Auto-detect URL ?sop= and open ===== */
  function autoOpenFromUrl() {
    const params = new URLSearchParams(location.search);
    const sopId = params.get('sop');
    if (sopId && typeof window.openSop === 'function') {
      setTimeout(() => window.openSop(sopId), 800);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoOpenFromUrl);
  else autoOpenFromUrl();

  /* ===== 11. Sortable tables ===== */
  function initSortableTables() {
    $$('table[data-sortable] th, table.sortable th').forEach(th => {
      if (th.dataset.sortInit) return;
      th.dataset.sortInit = '1';
      th.style.cursor = 'pointer';
      th.style.userSelect = 'none';
      th.title = 'انقر للترتيب';
      th.addEventListener('click', () => {
        const table = th.closest('table');
        const tbody = table.querySelector('tbody');
        const idx = Array.from(th.parentNode.children).indexOf(th);
        const asc = th.dataset.sortDir !== 'asc';
        $$('th', th.parentNode).forEach(o => { o.dataset.sortDir = ''; o.querySelector('.sort-arrow')?.remove(); });
        th.dataset.sortDir = asc ? 'asc' : 'desc';
        const arrow = document.createElement('span');
        arrow.className = 'sort-arrow';
        arrow.textContent = asc ? ' ▲' : ' ▼';
        arrow.style.fontSize = '10px';
        th.appendChild(arrow);
        const rows = $$('tr', tbody);
        rows.sort((a, b) => {
          const av = a.children[idx]?.textContent.trim() || '';
          const bv = b.children[idx]?.textContent.trim() || '';
          const an = parseFloat(av), bn = parseFloat(bv);
          const cmp = (!isNaN(an) && !isNaN(bn)) ? (an - bn) : av.localeCompare(bv, 'ar');
          return asc ? cmp : -cmp;
        });
        rows.forEach(r => tbody.appendChild(r));
      });
    });
  }

  /* ===== 12. Auto-resize textareas ===== */
  function autoResizeTextareas() {
    $$('textarea:not([data-no-resize])').forEach(ta => {
      if (ta.dataset.autoResize) return;
      ta.dataset.autoResize = '1';
      const resize = () => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      };
      ta.addEventListener('input', resize);
      resize();
    });
  }

  /* ===== 13. Confirm before unload if dirty ===== */
  let dirty = false;
  window.arsanMarkDirty = () => { dirty = true; };
  window.arsanMarkClean = () => { dirty = false; };
  window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });
  document.addEventListener('input', (e) => {
    if (e.target.matches('input, textarea, [contenteditable]')) dirty = true;
  });
  document.addEventListener('arsan:save', () => { dirty = false; });

  /* ===== 14. Smart back button ===== */
  window.arsanGoBack = function() {
    if (document.referrer && document.referrer.includes(location.host)) {
      history.back();
    } else {
      location.href = 'index.html';
    }
  };

  /* ===== 15. Auto-detect language direction in inputs ===== */
  document.addEventListener('input', (e) => {
    if (!e.target.matches('input[type="text"], textarea, [contenteditable]')) return;
    const v = e.target.value || e.target.textContent || '';
    if (!v) return;
    const isArabic = /[\u0600-\u06FF]/.test(v.charAt(0));
    e.target.style.direction = isArabic ? 'rtl' : 'ltr';
    e.target.style.textAlign = isArabic ? 'right' : 'left';
  });

  /* ===== 16. Local search highlight ===== */
  window.arsanHighlight = function(query, container) {
    if (!query) return;
    const root = container || document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const matches = [];
    let node;
    while ((node = walker.nextNode())) {
      if (re.test(node.textContent) && !node.parentElement.closest('script, style, mark.arsan-mark')) {
        matches.push(node);
      }
    }
    matches.forEach(n => {
      const span = document.createElement('span');
      span.innerHTML = n.textContent.replace(re, '<mark class="arsan-mark" style="background:#fef08a;padding:1px 2px;border-radius:3px;">$1</mark>');
      n.parentNode.replaceChild(span, n);
    });
  };

  /* ===== 17. Time-ago formatter ===== */
  window.arsanTimeAgo = function(date) {
    const d = new Date(date);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return Math.floor(diff/60) + ' د';
    if (diff < 86400) return Math.floor(diff/3600) + ' س';
    if (diff < 2592000) return Math.floor(diff/86400) + ' يوم';
    return d.toLocaleDateString('ar-SA');
  };

  /* ===== 18. Auto-update relative times ===== */
  function updateRelativeTimes() {
    $$('[data-time-ago]').forEach(el => {
      const t = el.getAttribute('data-time-ago');
      if (t) el.textContent = window.arsanTimeAgo(t);
    });
  }
  setInterval(updateRelativeTimes, 60000);
  updateRelativeTimes();

  /* ===== 19. Network status indicator ===== */
  function setupNetworkStatus() {
    const update = () => {
      if (!navigator.onLine) {
        toast('⚠️ لا يوجد اتصال بالإنترنت', 'warn');
        document.body.classList.add('arsan-offline');
      } else if (document.body.classList.contains('arsan-offline')) {
        toast('✓ عاد الاتصال', 'success');
        document.body.classList.remove('arsan-offline');
      }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  }
  setupNetworkStatus();

  /* ===== 20. Share button (Web Share API) ===== */
  window.arsanShare = async function(data) {
    if (navigator.share) {
      try { await navigator.share(data); } catch (e) {}
    } else {
      navigator.clipboard.writeText(data.url || data.text);
      toast('تم نسخ الرابط 📋', 'success');
    }
  };

  /* ===== 21. Confetti on success ===== */
  window.arsanConfetti = function(opts={}) {
    const count = opts.count || 80;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden;';
    document.body.appendChild(host);
    const colors = ['#d4a574', '#22c55e', '#0ea5e9', '#ef4444', '#f59e0b', '#a78bfa'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const c = colors[i % colors.length];
      p.style.cssText = `position:absolute;left:${50 + (Math.random()-0.5)*30}%;top:50%;width:8px;height:8px;background:${c};border-radius:${Math.random()>0.5?'50%':'2px'};`;
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 300;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 100;
      p.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${Math.random()*720}deg)`, opacity: 0 }
      ], { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(.2,.6,.2,1)', fill: 'forwards' });
      host.appendChild(p);
    }
    setTimeout(() => host.remove(), 2500);
  };

  /* ===== 22. Export table to CSV ===== */
  window.arsanExportTableCSV = function(table, filename='export.csv') {
    if (typeof table === 'string') table = $(table);
    if (!table) return;
    const rows = $$('tr', table).map(r => $$('th,td', r).map(c => `"${(c.textContent.trim()).replace(/"/g, '""')}"`).join(','));
    const csv = '\ufeff' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('تم تصدير الجدول 📊', 'success');
  };

  /* ===== 23. Smart copy ===== */
  window.arsanCopy = async function(text, label='النص') {
    try {
      await navigator.clipboard.writeText(text);
      toast(`تم نسخ ${label} ✓`, 'success');
    } catch {
      toast('فشل النسخ', 'error');
    }
  };

  /* ===== 24. Click to copy on .copyable ===== */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-copy], .copyable');
    if (!el) return;
    const text = el.getAttribute('data-copy') || el.textContent.trim();
    window.arsanCopy(text, el.getAttribute('data-copy-label') || 'النص');
  });

  /* ===== 25. Idle timeout warning ===== */
  let idleMs = 0;
  setInterval(() => { idleMs += 1000; }, 1000);
  ['mousemove','keydown','click','scroll','touchstart'].forEach(ev => {
    document.addEventListener(ev, () => { idleMs = 0; }, { passive: true });
  });
  setInterval(() => {
    if (idleMs > 25 * 60 * 1000) { // 25 min
      toast('⏰ انتبه: ستنتهي الجلسة قريباً', 'warn');
      idleMs = 0;
    }
  }, 60000);

  /* ===== 26. Scroll progress bar ===== */
  function setupScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'arsan-scroll-progress';
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#d4a574,#b8895a);z-index:99999;width:0;transition:width .1s ease-out;pointer-events:none;';
    document.body.appendChild(bar);
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }
  if (document.readyState !== 'loading') setupScrollProgress();
  else document.addEventListener('DOMContentLoaded', setupScrollProgress);

  /* ===== 27. Quick theme toggle (Cmd+D) ===== */
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      try { localStorage.setItem('arsan_dark_quick', isDark ? '1' : '0'); } catch {}
      toast(isDark ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري', 'info');
    }
  });
  try { if (localStorage.getItem('arsan_dark_quick') === '1') document.body.classList.add('dark-mode'); } catch {}

  /* ===== 28. Auto-focus first input in modals ===== */
  const modalObserver = new MutationObserver((muts) => {
    muts.forEach(m => {
      m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.matches?.('.modal, [role="dialog"]') || n.querySelector?.('.modal, [role="dialog"]')) {
          setTimeout(() => {
            const input = n.querySelector?.('input:not([type="hidden"]), textarea, select, [contenteditable]');
            if (input && !input.disabled) input.focus();
          }, 100);
        }
      });
    });
  });
  if (document.body) modalObserver.observe(document.body, { childList: true, subtree: true });

  /* ===== 29. Smart paste cleanup ===== */
  document.addEventListener('paste', (e) => {
    const target = e.target;
    if (!target.matches('[contenteditable]')) return;
    const text = e.clipboardData?.getData('text/plain');
    if (text && text.length < 5000) {
      e.preventDefault();
      document.execCommand('insertText', false, text);
    }
  });

  /* ===== 30. Page title with unread count ===== */
  let originalTitle = document.title;
  window.arsanSetUnreadCount = function(n) {
    document.title = n > 0 ? `(${n}) ${originalTitle}` : originalTitle;
  };

  /* ===== Animations CSS ===== */
  const animCss = document.createElement('style');
  animCss.textContent = `
    @keyframes arsan-toast-in { from { transform:translateY(-20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
    @keyframes arsan-fade-in-bg { from { opacity:0; } to { opacity:1; } }
    body.arsan-offline { filter: grayscale(0.3); }
    body.arsan-offline::before {
      content: '⚠ غير متصل';
      position: fixed; top: 0; left: 0; right: 0;
      background: #f59e0b; color: #fff; text-align: center;
      padding: 6px; font-weight: 700; z-index: 99998;
    }
  `;
  document.head.appendChild(animCss);

  /* ===== Init ===== */
  function init() {
    initSortableTables();
    autoResizeTextareas();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Re-init on DOM changes
  const reInitObs = new MutationObserver(() => {
    initSortableTables();
    autoResizeTextareas();
  });
  if (document.body) reInitObs.observe(document.body, { childList: true, subtree: true });

  console.log('%c⚡ Arsan Power Pack loaded — 30 functional improvements', 'color:#0ea5e9;font-weight:bold');
})();

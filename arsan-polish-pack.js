/* ============================================================
 * Arsan Polish Pack — 50 Visual Improvements
 * طبقة بصرية بحتة — لا تكسر أي وظيفة موجودة
 * تعمل في: index.html, dashboard.html, profile.html, people.html, users.html
 * ============================================================ */
(function () {
  'use strict';
  if (window.__ARSAN_POLISH__) return;
  window.__ARSAN_POLISH__ = true;

  const css = `
/* ===== 1. Smooth font rendering ===== */
* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }

/* ===== 2. Better focus ring ===== */
:focus-visible {
  outline: 2px solid var(--brand, #d4a574) !important;
  outline-offset: 2px !important;
  border-radius: 6px;
  transition: outline-offset .15s ease;
}
button:focus-visible, a:focus-visible { outline-offset: 3px !important; }

/* ===== 3. Selection color ===== */
::selection { background: var(--brand, #d4a574); color: #fff; }
::-moz-selection { background: var(--brand, #d4a574); color: #fff; }

/* ===== 4. Smooth scrolling ===== */
html { scroll-behavior: smooth; }

/* ===== 5. Custom scrollbar ===== */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: rgba(0,0,0,0.04); border-radius: 10px; }
::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.28));
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--brand, #d4a574), #b8895a);
  background-clip: padding-box;
  border: 2px solid transparent;
}

/* ===== 6-10. Card hover lift ===== */
.dept-card, .sop-card, .um-card, .person-card, [data-card] {
  transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, border-color .2s ease !important;
  will-change: transform;
}
.dept-card:hover, .sop-card:hover, .um-card:hover, .person-card:hover, [data-card]:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px -8px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.06) !important;
}

/* ===== 11. Button shine effect ===== */
.btn, button[class*="btn"], .arsan-btn {
  position: relative;
  overflow: hidden;
}
.btn::after, button[class*="btn"]::after, .arsan-btn::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left .6s ease;
  pointer-events: none;
}
.btn:hover::after, button[class*="btn"]:hover::after, .arsan-btn:hover::after { left: 100%; }

/* ===== 12. Input focus glow ===== */
input:focus, textarea:focus, select:focus {
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.18) !important;
  border-color: var(--brand, #d4a574) !important;
  transition: box-shadow .2s ease, border-color .2s ease;
}

/* ===== 13. Link underline animation ===== */
a:not([class]):not([data-no-polish]) {
  background-image: linear-gradient(currentColor, currentColor);
  background-size: 0% 1.5px;
  background-repeat: no-repeat;
  background-position: right bottom;
  transition: background-size .3s ease;
  text-decoration: none;
}
a:not([class]):not([data-no-polish]):hover {
  background-size: 100% 1.5px;
  background-position: left bottom;
}

/* ===== 14. Skeleton loader ===== */
.arsan-skeleton {
  background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.06) 75%);
  background-size: 200% 100%;
  animation: arsan-skel 1.4s ease-in-out infinite;
  border-radius: 6px;
}
@keyframes arsan-skel {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== 15. Pulse animation for live indicators ===== */
.arsan-pulse, [data-pulse] {
  position: relative;
}
.arsan-pulse::before, [data-pulse]::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  background: var(--brand, #d4a574);
  opacity: .4;
  animation: arsan-ping 1.6s cubic-bezier(0,0,0.2,1) infinite;
  z-index: -1;
}
@keyframes arsan-ping {
  0% { transform: scale(.95); opacity: .5; }
  75%, 100% { transform: scale(1.4); opacity: 0; }
}

/* ===== 16. Topbar glass enhancement ===== */
.topbar, .arsan-topbar, [data-topbar] {
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  background: rgba(255,255,255,0.78) !important;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

/* ===== 17. Modal backdrop blur ===== */
.modal-backdrop, [class*="modal"] [class*="backdrop"], [class*="overlay"]:not(body) {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ===== 18. Smooth tab switching ===== */
[role="tab"], .tab, [data-tab] {
  transition: color .2s, background .2s, border-color .2s !important;
}

/* ===== 19. Loading spinner upgrade ===== */
.arsan-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(212, 165, 116, 0.18);
  border-top-color: var(--brand, #d4a574);
  border-radius: 50%;
  animation: arsan-spin .8s linear infinite;
}
@keyframes arsan-spin { to { transform: rotate(360deg); } }

/* ===== 20. Tooltip system ===== */
[data-tooltip] { position: relative; }
[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: rgba(20,20,20,0.94);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity .18s ease, transform .18s ease;
  z-index: 9999;
  font-family: inherit;
}
[data-tooltip]:hover::after { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ===== 21. Card subtle gradient ===== */
.dept-card, .sop-card {
  background-image: linear-gradient(180deg, rgba(255,255,255,0.5), transparent 40%) !important;
}

/* ===== 22. Section title accents ===== */
h2[data-section]::before, .section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, var(--brand, #d4a574), transparent);
  margin-inline-end: 10px;
  vertical-align: middle;
  border-radius: 2px;
}

/* ===== 23. Smooth disabled state ===== */
button:disabled, input:disabled, select:disabled {
  opacity: .55;
  cursor: not-allowed !important;
  filter: grayscale(.3);
  transition: opacity .2s, filter .2s;
}

/* ===== 24. Image lazy fade-in ===== */
img:not([data-no-fade]) {
  transition: opacity .4s ease;
}
img.arsan-loading { opacity: 0; }
img.arsan-loaded { opacity: 1; }

/* ===== 25. Better blockquote ===== */
blockquote {
  border-inline-start: 3px solid var(--brand, #d4a574);
  padding-inline-start: 14px;
  color: rgba(0,0,0,0.7);
  font-style: italic;
}

/* ===== 26. Code/pre styling ===== */
code, pre {
  font-family: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;
  background: rgba(0,0,0,0.04);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: .92em;
}
pre { padding: 12px 16px; overflow-x: auto; line-height: 1.6; }

/* ===== 27. Table polish ===== */
table { border-collapse: separate; border-spacing: 0; }
table tr { transition: background .15s ease; }
table tbody tr:hover { background: rgba(212, 165, 116, 0.05); }

/* ===== 28. Badge gradients ===== */
.badge, [class*="badge"], [class*="chip"] {
  background-image: linear-gradient(135deg, rgba(255,255,255,0.18), transparent) !important;
}

/* ===== 29. Page transitions ===== */
body {
  animation: arsan-page-in .4s ease-out;
}
@keyframes arsan-page-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 30. Smooth list reveal ===== */
.arsan-stagger > * {
  opacity: 0;
  animation: arsan-fade-in .4s ease-out forwards;
}
.arsan-stagger > *:nth-child(1) { animation-delay: .05s; }
.arsan-stagger > *:nth-child(2) { animation-delay: .1s; }
.arsan-stagger > *:nth-child(3) { animation-delay: .15s; }
.arsan-stagger > *:nth-child(4) { animation-delay: .2s; }
.arsan-stagger > *:nth-child(5) { animation-delay: .25s; }
.arsan-stagger > *:nth-child(6) { animation-delay: .3s; }
.arsan-stagger > *:nth-child(7) { animation-delay: .35s; }
.arsan-stagger > *:nth-child(8) { animation-delay: .4s; }
@keyframes arsan-fade-in {
  to { opacity: 1; transform: translateY(0); }
}
.arsan-stagger > * { transform: translateY(8px); }

/* ===== 31. Topbar logo hover ===== */
.topbar img, [data-topbar] img, .topbar-logo {
  transition: transform .3s cubic-bezier(.2,.8,.2,1);
}
.topbar img:hover, [data-topbar] img:hover, .topbar-logo:hover {
  transform: scale(1.06) rotate(-2deg);
}

/* ===== 32. Ripple effect on buttons ===== */
.arsan-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  transform: scale(0);
  animation: arsan-ripple-anim .5s ease-out;
  pointer-events: none;
}
@keyframes arsan-ripple-anim {
  to { transform: scale(2.5); opacity: 0; }
}

/* ===== 33. Empty state polish ===== */
.empty-state, [data-empty] {
  text-align: center;
  padding: 40px 20px;
  color: rgba(0,0,0,0.55);
}
.empty-state svg, [data-empty] svg { opacity: .4; }

/* ===== 34. Number counter style ===== */
[data-stat-value], .stat-value, .kpi-value {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

/* ===== 35. Sticky shadow on scroll ===== */
.topbar.scrolled, [data-topbar].scrolled {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

/* ===== 36. Print polish ===== */
@media print {
  body { background: #fff !important; }
  .topbar, .sidebar, .fab, [data-no-print], button { display: none !important; }
  .sop-card, .dept-card { box-shadow: none !important; border: 1px solid #ddd !important; break-inside: avoid; }
}

/* ===== 37. Reduce motion ===== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ===== 38. Dark mode polish ===== */
@media (prefers-color-scheme: dark) {
  body[data-auto-dark] {
    background: #0f1115 !important;
    color: #e7e9ee !important;
  }
}
body.dark-mode ::selection,
[data-theme="dark"] ::selection {
  background: var(--brand, #d4a574); color: #0f1115;
}

/* ===== 39. Highlight new items ===== */
.arsan-new, [data-new]::after {
  content: 'جديد';
  display: inline-block;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  margin-inline-start: 6px;
  vertical-align: middle;
  animation: arsan-bounce .8s ease-in-out infinite alternate;
}
@keyframes arsan-bounce {
  to { transform: translateY(-2px); }
}

/* ===== 40. Status dots ===== */
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-inline-end: 6px; }
.status-dot.online { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }
.status-dot.away { background: #f59e0b; }
.status-dot.offline { background: #94a3b8; }
.status-dot.draft { background: #64748b; }
.status-dot.review { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.18); }
.status-dot.approved { background: #22c55e; }

/* ===== 41. Glassmorphism cards ===== */
.glass {
  background: rgba(255,255,255,0.65) !important;
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgba(255,255,255,0.8);
}

/* ===== 42. Floating action button polish ===== */
.fab, [data-fab] {
  box-shadow: 0 8px 24px rgba(212, 165, 116, 0.4), 0 4px 8px rgba(0,0,0,0.1) !important;
  transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s !important;
}
.fab:hover, [data-fab]:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 12px 32px rgba(212, 165, 116, 0.55), 0 6px 12px rgba(0,0,0,0.12) !important;
}
.fab:active, [data-fab]:active { transform: translateY(0) scale(.98); }

/* ===== 43. Better divider ===== */
hr, .divider {
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent);
  margin: 16px 0;
}

/* ===== 44. Chip groups ===== */
.chip, [class*="chip"] {
  transition: transform .15s ease, background .15s ease !important;
}
.chip:hover, [class*="chip"]:hover { transform: translateY(-1px); }

/* ===== 45. Progress bar shimmer ===== */
.progress, [role="progressbar"] {
  background: rgba(0,0,0,0.06);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}
.progress > *, [role="progressbar"] > * {
  background: linear-gradient(90deg, var(--brand, #d4a574), #b8895a);
  position: relative;
}
.progress > *::after, [role="progressbar"] > *::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: arsan-shimmer 1.6s linear infinite;
}
@keyframes arsan-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* ===== 46. Avatar polish ===== */
.avatar, [class*="avatar"] {
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: transform .2s ease;
}
.avatar:hover, [class*="avatar"]:hover { transform: scale(1.08); }

/* ===== 47. Notification badge bounce ===== */
.notification-badge, [data-notify-count]:not(:empty) {
  animation: arsan-pop .3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes arsan-pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* ===== 48. Better date/time text ===== */
time, [datetime] {
  color: rgba(0,0,0,0.6);
  font-variant-numeric: tabular-nums;
}

/* ===== 49. Highlight on demand ===== */
.arsan-highlight {
  animation: arsan-highlight 2s ease-out;
}
@keyframes arsan-highlight {
  0% { background: rgba(212, 165, 116, 0.5); }
  100% { background: transparent; }
}

/* ===== 50. Smooth detail/summary ===== */
details summary {
  cursor: pointer;
  list-style: none;
  padding: 8px 0;
  transition: color .15s ease;
}
details summary::-webkit-details-marker { display: none; }
details summary::before {
  content: '▸';
  display: inline-block;
  margin-inline-end: 8px;
  transition: transform .2s ease;
}
details[open] summary::before { transform: rotate(90deg); }
[dir="rtl"] details summary::before { content: '◂'; }
[dir="rtl"] details[open] summary::before { transform: rotate(-90deg); }
`;

  // Inject CSS
  try {
    const style = document.createElement('style');
    style.id = 'arsan-polish-pack';
    style.textContent = css;
    document.head.appendChild(style);
  } catch (e) { console.warn('[polish-pack] css inject failed', e); }

  // Image fade-in
  function setupImageFade() {
    document.querySelectorAll('img:not([data-no-fade]):not(.arsan-loaded)').forEach(img => {
      if (img.complete && img.naturalWidth) {
        img.classList.add('arsan-loaded');
      } else {
        img.classList.add('arsan-loading');
        img.addEventListener('load', () => {
          img.classList.remove('arsan-loading');
          img.classList.add('arsan-loaded');
        }, { once: true });
        img.addEventListener('error', () => img.classList.remove('arsan-loading'), { once: true });
      }
    });
  }

  // Topbar shadow on scroll
  function setupTopbarShadow() {
    const bars = document.querySelectorAll('.topbar, [data-topbar]');
    if (!bars.length) return;
    const onScroll = () => {
      const scrolled = window.scrollY > 8;
      bars.forEach(b => b.classList.toggle('scrolled', scrolled));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Ripple on .btn
  function setupRipple() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn, button[class*="btn"], .arsan-btn, .fab');
      if (!btn || btn.disabled) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'arsan-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      const prevPos = getComputedStyle(btn).position;
      if (prevPos === 'static') btn.style.position = 'relative';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    }, { passive: true });
  }

  // Stagger fade-in on lists
  function setupStagger() {
    document.querySelectorAll('.dept-grid, .sop-grid, .um-grid, [data-stagger]').forEach(el => {
      if (!el.classList.contains('arsan-stagger')) el.classList.add('arsan-stagger');
    });
  }

  // Number counter animation
  function setupCounters() {
    const counters = document.querySelectorAll('[data-counter]:not([data-counter-done])');
    counters.forEach(el => {
      const target = parseFloat(el.getAttribute('data-counter')) || 0;
      const duration = parseInt(el.getAttribute('data-counter-duration')) || 800;
      const start = performance.now();
      const startVal = 0;
      el.setAttribute('data-counter-done', '1');
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(startVal + (target - startVal) * eased).toLocaleString('ar-SA');
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // Auto-tooltip from title
  function autoTooltip() {
    document.querySelectorAll('[title]:not([data-tooltip]):not([data-no-tooltip])').forEach(el => {
      const t = el.getAttribute('title');
      if (t && t.length < 80) {
        el.setAttribute('data-tooltip', t);
        el.setAttribute('data-original-title', t);
        el.removeAttribute('title');
      }
    });
  }

  // Init
  function init() {
    setupImageFade();
    setupTopbarShadow();
    setupRipple();
    setupStagger();
    setupCounters();
    autoTooltip();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run on DOM changes (for dynamically added cards)
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      setupImageFade();
      setupCounters();
      autoTooltip();
    });
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  console.log('%c✨ Arsan Polish Pack loaded — 50 visual improvements', 'color:#d4a574;font-weight:bold');
})();

/* Arsan Updates Banner
 * Renders a dismissible announcement banner at the top of the page.
 * Content is fetched from /api/updates (which proxies a configured Google Doc).
 * Admin can set the source URL via the settings panel.
 */
(function(){
  'use strict';

  const LS_DISMISS = 'arsan_updates_dismissed_at';
  const LS_LAST_HASH = 'arsan_updates_last_hash';
  const FETCH_INTERVAL = 5 * 60 * 1000; // 5 min

  // Simple hash for change detection
  function hash(s){
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h.toString(36);
  }

  function isDismissedForCurrentContent(contentHash){
    const lastHash = localStorage.getItem(LS_LAST_HASH);
    const dismissedAt = parseInt(localStorage.getItem(LS_DISMISS) || '0', 10);
    // If content changed since last dismiss, show again
    if (lastHash !== contentHash) return false;
    // Auto-reshow after 7 days
    if (Date.now() - dismissedAt > 7 * 24 * 60 * 60 * 1000) return false;
    return dismissedAt > 0;
  }

  function injectStyles(){
    if (document.getElementById('arsan-updates-banner-styles')) return;
    const style = document.createElement('style');
    style.id = 'arsan-updates-banner-styles';
    style.textContent = `
      .arsan-updates-banner{
        position:sticky;top:0;z-index:900;
        background:linear-gradient(90deg, #2a3d52 0%, #1f3045 100%);
        color:#fff;
        border-bottom:1px solid rgba(212,168,60,.3);
        overflow:hidden;
        transition:max-height .35s ease, opacity .25s ease;
      }
      html[data-theme="light"] .arsan-updates-banner{
        background:linear-gradient(90deg,#f6efd9 0%,#f0e5c0 100%);
        color:#2a2218;
        border-bottom-color:rgba(139,45,60,.25);
      }
      .arsan-updates-banner.closing{max-height:0;opacity:0;border:none}
      .arsan-ub-inner{
        max-width:1280px;margin:0 auto;padding:10px 20px;
        display:flex;align-items:center;gap:14px;
      }
      .arsan-ub-icon{
        flex-shrink:0;width:28px;height:28px;border-radius:50%;
        background:rgba(212,168,60,.22);display:grid;place-items:center;
        font-size:14px;
      }
      html[data-theme="light"] .arsan-ub-icon{background:rgba(139,45,60,.12)}
      .arsan-ub-content{flex:1;min-width:0;position:relative;height:22px}
      .arsan-ub-item{
        position:absolute;inset:0;
        display:flex;align-items:center;gap:8px;
        font-size:13.5px;line-height:1.4;
        opacity:0;transform:translateY(6px);
        transition:opacity .35s ease, transform .35s ease;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      }
      .arsan-ub-item.active{opacity:1;transform:translateY(0)}
      .arsan-ub-dot{
        display:inline-block;width:6px;height:6px;border-radius:50%;
        background:#d4a83c;flex-shrink:0;
      }
      .arsan-ub-controls{display:flex;align-items:center;gap:6px;flex-shrink:0}
      .arsan-ub-nav{
        background:rgba(255,255,255,.1);border:none;color:inherit;
        width:24px;height:24px;border-radius:50%;cursor:pointer;
        display:grid;place-items:center;font-size:12px;
        transition:background .15s;
      }
      html[data-theme="light"] .arsan-ub-nav{background:rgba(0,0,0,.08)}
      .arsan-ub-nav:hover{background:rgba(212,168,60,.3)}
      .arsan-ub-counter{
        font-size:11px;opacity:.7;min-width:28px;text-align:center;
        font-variant-numeric:tabular-nums;
      }
      .arsan-ub-close{
        background:transparent;border:none;color:inherit;
        width:26px;height:26px;border-radius:50%;cursor:pointer;
        font-size:16px;opacity:.7;transition:opacity .15s,background .15s;
      }
      .arsan-ub-close:hover{opacity:1;background:rgba(255,255,255,.1)}
      html[data-theme="light"] .arsan-ub-close:hover{background:rgba(0,0,0,.08)}
      .arsan-ub-view-all{
        font-size:12px;color:inherit;text-decoration:underline;
        opacity:.8;cursor:pointer;background:none;border:none;
        font-family:inherit;padding:0;
      }
      .arsan-ub-view-all:hover{opacity:1}
      @media (max-width:640px){
        .arsan-ub-inner{padding:8px 14px;gap:10px}
        .arsan-ub-icon{width:24px;height:24px;font-size:12px}
        .arsan-ub-item{font-size:12.5px}
        .arsan-ub-counter{display:none}
      }

      /* "View all" modal */
      .arsan-ub-modal-bd{
        position:fixed;inset:0;background:rgba(0,0,0,.5);
        z-index:9999;display:grid;place-items:center;padding:20px;
      }
      .arsan-ub-modal{
        background:var(--bg-1,#fff);color:var(--ink-1,#000);
        border:1px solid var(--line,#ddd);border-radius:14px;
        max-width:640px;width:100%;max-height:80vh;overflow:auto;
        padding:24px;
      }
      .arsan-ub-modal h2{margin:0 0 12px;font-size:20px;color:var(--brand,#d4a83c)}
      .arsan-ub-modal .muted{font-size:12px;color:var(--ink-3);margin-bottom:16px}
      .arsan-ub-modal .gdoc-content{line-height:1.7;font-size:14px}
      .arsan-ub-modal .gdoc-content h1,
      .arsan-ub-modal .gdoc-content h2,
      .arsan-ub-modal .gdoc-content h3{margin:16px 0 8px;color:var(--brand,#d4a83c)}
      .arsan-ub-modal .gdoc-content ul,
      .arsan-ub-modal .gdoc-content ol{padding-inline-start:24px;margin:8px 0}
      .arsan-ub-modal .gdoc-content li{margin:4px 0}
      .arsan-ub-modal .gdoc-content a{color:var(--brand,#d4a83c)}
      .arsan-ub-modal-close{
        float:inline-end;background:none;border:none;cursor:pointer;
        color:var(--ink-2);font-size:22px;line-height:1;padding:0;
      }
    `;
    document.head.appendChild(style);
  }

  function createBanner(items, html, source){
    const isEn = (typeof CURRENT_LANG !== 'undefined' && CURRENT_LANG === 'en');
    const bar = document.createElement('div');
    bar.className = 'arsan-updates-banner';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', isEn ? 'Announcements' : 'إعلانات');

    const inner = document.createElement('div');
    inner.className = 'arsan-ub-inner';

    const icon = document.createElement('div');
    icon.className = 'arsan-ub-icon';
    icon.textContent = '📣';

    const content = document.createElement('div');
    content.className = 'arsan-ub-content';

    items.forEach((text, i) => {
      const el = document.createElement('div');
      el.className = 'arsan-ub-item' + (i === 0 ? ' active' : '');
      const dot = document.createElement('span');
      dot.className = 'arsan-ub-dot';
      const span = document.createElement('span');
      span.textContent = text;
      el.appendChild(dot);
      el.appendChild(span);
      content.appendChild(el);
    });

    const controls = document.createElement('div');
    controls.className = 'arsan-ub-controls';

    let current = 0;
    const go = (dir) => {
      const nodes = content.querySelectorAll('.arsan-ub-item');
      nodes[current].classList.remove('active');
      current = (current + dir + nodes.length) % nodes.length;
      nodes[current].classList.add('active');
      updateCounter();
    };

    const counter = document.createElement('span');
    counter.className = 'arsan-ub-counter';
    const updateCounter = () => {
      counter.textContent = `${current + 1} / ${items.length}`;
    };

    if (items.length > 1) {
      const prev = document.createElement('button');
      prev.className = 'arsan-ub-nav';
      prev.innerHTML = isEn ? '‹' : '›';
      prev.setAttribute('aria-label', isEn ? 'Previous' : 'السابق');
      prev.onclick = () => { go(-1); pauseAutoRotate(); };

      const next = document.createElement('button');
      next.className = 'arsan-ub-nav';
      next.innerHTML = isEn ? '›' : '‹';
      next.setAttribute('aria-label', isEn ? 'Next' : 'التالي');
      next.onclick = () => { go(1); pauseAutoRotate(); };

      controls.appendChild(prev);
      controls.appendChild(counter);
      controls.appendChild(next);
      updateCounter();
    }

    if (html && html.trim()) {
      const viewAll = document.createElement('button');
      viewAll.className = 'arsan-ub-view-all';
      viewAll.textContent = isEn ? 'View all' : 'عرض الكل';
      viewAll.onclick = () => openModal(html, source);
      controls.appendChild(viewAll);
    }

    const close = document.createElement('button');
    close.className = 'arsan-ub-close';
    close.innerHTML = '×';
    close.setAttribute('aria-label', isEn ? 'Dismiss' : 'إغلاق');
    close.onclick = () => {
      const contentHash = hash(items.join('|') + (html || ''));
      localStorage.setItem(LS_DISMISS, Date.now().toString());
      localStorage.setItem(LS_LAST_HASH, contentHash);
      bar.classList.add('closing');
      setTimeout(() => bar.remove(), 400);
    };
    controls.appendChild(close);

    inner.appendChild(icon);
    inner.appendChild(content);
    inner.appendChild(controls);
    bar.appendChild(inner);

    // Auto-rotate every 6s
    let rotateTimer = null;
    const startAutoRotate = () => {
      if (items.length < 2) return;
      rotateTimer = setInterval(() => go(1), 6000);
    };
    const pauseAutoRotate = () => {
      if (rotateTimer) { clearInterval(rotateTimer); rotateTimer = null; }
      setTimeout(startAutoRotate, 15000); // resume after 15s of inactivity
    };
    startAutoRotate();

    return bar;
  }

  function openModal(html, source){
    const isEn = (typeof CURRENT_LANG !== 'undefined' && CURRENT_LANG === 'en');
    const bd = document.createElement('div');
    bd.className = 'arsan-ub-modal-bd';
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };

    const m = document.createElement('div');
    m.className = 'arsan-ub-modal';

    const close = document.createElement('button');
    close.className = 'arsan-ub-modal-close';
    close.innerHTML = '×';
    close.onclick = () => bd.remove();
    m.appendChild(close);

    const title = document.createElement('h2');
    title.textContent = isEn ? '📣 Latest updates' : '📣 آخر التحديثات';
    m.appendChild(title);

    if (source) {
      const muted = document.createElement('div');
      muted.className = 'muted';
      muted.textContent = (isEn ? 'Source: ' : 'المصدر: ') + source;
      m.appendChild(muted);
    }

    const content = document.createElement('div');
    content.className = 'gdoc-content';
    content.innerHTML = html;
    m.appendChild(content);

    bd.appendChild(m);
    document.body.appendChild(bd);
  }

  async function fetchAndRender(){
    try {
      const res = await fetch('/api/updates', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.items || data.items.length === 0) return;

      const contentHash = hash(data.items.join('|') + (data.html || ''));
      if (isDismissedForCurrentContent(contentHash)) return;

      // Remove any existing banner
      const existing = document.querySelector('.arsan-updates-banner');
      if (existing) existing.remove();

      injectStyles();
      const banner = createBanner(data.items, data.html || '', data.source);
      // Insert at the very top of body
      document.body.insertBefore(banner, document.body.firstChild);
    } catch (e) {
      console.warn('[updates-banner]', e);
    }
  }

  // Initial fetch + periodic refresh
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndRender);
  } else {
    fetchAndRender();
  }
  setInterval(fetchAndRender, FETCH_INTERVAL);

  // Expose for admin settings panel
  window.ArsanUpdatesBanner = {
    refresh: fetchAndRender,
    clearDismiss: () => {
      localStorage.removeItem(LS_DISMISS);
      localStorage.removeItem(LS_LAST_HASH);
      fetchAndRender();
    }
  };
})();

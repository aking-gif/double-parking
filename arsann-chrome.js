/* =====================================================================
   ARSANN OS — Chrome Components (Status Bar + Mini-map + Helpers)
   Vanilla JS — drop in any page after arsann-theme.css
   ===================================================================== */
(function(){
  'use strict';

  /* === SESSION TIMER === */
  const SESS_KEY = 'arsann_session_start_v1';
  function sessionStart() {
    let t = parseInt(localStorage.getItem(SESS_KEY) || '0', 10);
    if (!t || Date.now() - t > 8 * 3600 * 1000) {
      t = Date.now();
      localStorage.setItem(SESS_KEY, String(t));
    }
    return t;
  }
  function fmtDuration(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return (h ? h + 'H ' : '') + String(m).padStart(2,'0') + 'M';
  }
  function fmtTime(d) {
    return d.toTimeString().slice(0,5);
  }
  function fmtDateLine(d) {
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    return days[d.getDay()] + ' · ' + d.toISOString().slice(0,10);
  }

  /* === BUILD STATUS BAR === */
  function buildStatusBar(opts) {
    opts = opts || {};
    const moduleName = opts.module || 'OS';
    const breadcrumb = opts.breadcrumb || [];

    if (document.querySelector('.os-status')) return;

    const bar = document.createElement('div');
    bar.className = 'os-status';
    bar.innerHTML = `
      <div class="seg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        <span class="v" id="os-clock">--:--</span>
        <span style="opacity:.5">·</span>
        <span id="os-date">—</span>
      </div>
      <div class="seg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2 L4 6 V12 C4 17 8 21 12 22 C16 21 20 17 20 12 V6 Z"/>
        </svg>
        <span class="v">SESSION</span>
        <span id="os-session">0M</span>
      </div>
      <div class="seg">
        <span class="pulse-dot"></span>
        <span class="v">${moduleName.toUpperCase()}</span>
      </div>
      <div class="spacer"></div>
      <div class="seg" style="opacity:.7">
        ${breadcrumb.length ? breadcrumb.map((b,i)=>{
          const isLast = i === breadcrumb.length - 1;
          return `<span class="${isLast?'v':''}" style="${isLast?'color:var(--accent)':''}">${b}</span>${isLast?'':'<span style="opacity:.4">//</span>'}`;
        }).join('') : ''}
      </div>
      <div class="seg">
        <span class="v" id="os-user">${(opts.user || 'GUEST').toUpperCase()}</span>
      </div>
    `;
    document.body.insertBefore(bar, document.body.firstChild);

    // Push body down
    if (!document.body.dataset.statusOffset) {
      document.body.style.paddingTop = 'var(--status-h)';
      document.body.dataset.statusOffset = '1';
    }

    // Tick clock + session
    const start = sessionStart();
    function tick() {
      const now = new Date();
      const c = document.getElementById('os-clock');
      const dt = document.getElementById('os-date');
      const ses = document.getElementById('os-session');
      if (c) c.textContent = fmtTime(now);
      if (dt) dt.textContent = fmtDateLine(now);
      if (ses) ses.textContent = fmtDuration(Date.now() - start);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* === BUILD MINI-MAP === */
  function buildMiniMap(opts) {
    opts = opts || {};
    if (document.querySelector('.mini-map')) return;
    if (opts.disable) return;

    const mm = document.createElement('div');
    mm.className = 'mini-map';
    mm.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>VIEWPORT</span>
        <span class="amber" id="mm-zone">${(opts.zone || 'A.01').toUpperCase()}</span>
      </div>
      <div class="mm-grid">
        <div class="mm-marker"></div>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span>X 0.${Math.floor(Math.random()*99)}</span>
        <span>Y 0.${Math.floor(Math.random()*99)}</span>
      </div>
    `;
    document.body.appendChild(mm);
  }

  /* === BRACKET HELPERS === */
  // Auto-decorate any .bracket-card with bottom corners (top corners come from CSS)
  function decorateBrackets() {
    document.querySelectorAll('.bracket-card').forEach(el => {
      if (!el.querySelector('.br-bl')) {
        const bl = document.createElement('span'); bl.className = 'br-bl';
        const br = document.createElement('span'); br.className = 'br-br';
        el.appendChild(bl); el.appendChild(br);
      }
    });
  }

  /* === BREADCRUMB BUILDER === */
  function buildBreadcrumb(items) {
    return items.map((t, i) => {
      const isLast = i === items.length - 1;
      return `<span class="${isLast ? 'current' : ''}">${t.toUpperCase()}</span>${isLast ? '' : '<span class="sep">//</span>'}`;
    }).join('');
  }

  /* === EXPORT === */
  window.ArsannChrome = {
    statusBar: buildStatusBar,
    miniMap: buildMiniMap,
    decorate: decorateBrackets,
    breadcrumb: buildBreadcrumb,
    init: function(opts) {
      buildStatusBar(opts);
      if (!opts || !opts.noMiniMap) buildMiniMap(opts);
      decorateBrackets();
      // Re-decorate when DOM changes
      const mo = new MutationObserver(() => decorateBrackets());
      mo.observe(document.body, { childList: true, subtree: true });
    }
  };

  // Auto-decorate on DOM ready
  if (document.readyState !== 'loading') decorateBrackets();
  else document.addEventListener('DOMContentLoaded', decorateBrackets);
})();

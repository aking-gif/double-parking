/* Arsan Dashboard — In-Page Tab Panes (v2 — live Worker API)
 *
 * Intercepts the topbar nav (إجراءات / التقويم / البريد) on dashboard.html
 * and opens an overlay pane with rich content backed by the Worker API:
 *   - الإجراءات → GET /api/tasks
 *   - التقويم   → GET /api/calendar/events
 *   - البريد    → GET /api/mail
 *
 * Each pane has its own state: { data, isLoading, isLoaded, hasError, errMsg, mockMode }
 * - First open: shimmer skeleton → fetch → render data | error | empty
 * - Repeat open: render cached data instantly (no refetch)
 * - Manual ↻ refresh button in header re-fetches
 * - On failure + navigator.onLine === false: fall back to mock data with offline banner
 * - On failure online: error card with retry button
 *
 * Mock data is preserved verbatim from v1 as the offline fallback.
 */
(function(){
  'use strict';

  const API_BASE = (window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev').replace(/\/+$/,'');

  // ===== Tab state =====
  // tab → { data, isLoading, isLoaded, hasError, errMsg, mockMode }
  const TAB_STATE = {
    actions:  { data:null, isLoading:false, isLoaded:false, hasError:false, errMsg:'', mockMode:false },
    calendar: { data:null, isLoading:false, isLoaded:false, hasError:false, errMsg:'', mockMode:false },
    mail:     { data:null, isLoading:false, isLoaded:false, hasError:false, errMsg:'', mockMode:false },
  };

  if (!document.body) document.addEventListener('DOMContentLoaded', init);
  else init();

  function init(){
    injectStyles();
    wireNav();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePane(); });
  }

  // ===================== STYLES =====================
  function injectStyles(){
    if (document.getElementById('arsan-tabs-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-tabs-styles';
    s.textContent = `
      .atab-pane{
        position: fixed; inset: 0;
        background: rgba(10,11,13,0.6);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        z-index: 800;
        display: flex; align-items: flex-start; justify-content: center;
        padding: 88px 20px 40px;
        opacity: 0; pointer-events: none;
        transition: opacity .25s ease;
      }
      .atab-pane.open{ opacity: 1; pointer-events: auto }
      .atab-card{
        width: 100%; max-width: 1100px;
        max-height: calc(100vh - 130px);
        background: #15171C;
        border: 1px solid rgba(201,169,97,0.18);
        border-radius: 16px;
        box-shadow: 0 30px 80px rgba(0,0,0,0.5);
        display: flex; flex-direction: column; overflow: hidden;
        transform: translateY(-10px) scale(0.99);
        transition: transform .25s cubic-bezier(.4,0,.2,1);
        font-family: "IBM Plex Sans Arabic", system-ui, sans-serif;
        color: #EDEEF0;
      }
      .atab-pane.open .atab-card{ transform: translateY(0) scale(1) }
      .atab-head{
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 24px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        background: rgba(0,0,0,0.2);
        gap: 12px;
      }
      .atab-head h2{ margin:0; font-size:16px; font-weight:600; color:#EDEEF0; letter-spacing:-0.01em }
      .atab-head .sub{
        font-family: "IBM Plex Mono", monospace;
        font-size: 10.5px; letter-spacing: 2px;
        color: #6B7180; text-transform: uppercase;
        margin-top: 3px;
      }
      .atab-head-right{ display:flex; align-items:center; gap:8px }
      .atab-refresh{
        width: 32px; height: 32px;
        border-radius: 8px;
        background: rgba(255,255,255,0.04);
        color: #A8ADB8;
        border: 1px solid rgba(255,255,255,0.06);
        font-size: 14px;
        cursor: pointer;
        transition: all .15s;
        display: inline-flex; align-items: center; justify-content: center;
      }
      .atab-refresh:hover{ background: rgba(201,169,97,0.10); color:#C9A961; border-color: rgba(201,169,97,0.25) }
      .atab-refresh:disabled{ opacity:.5; cursor:wait }
      .atab-refresh svg{ width:14px; height:14px; transition: transform .4s ease }
      .atab-refresh.spinning svg{ animation: atabSpin .9s linear infinite }
      @keyframes atabSpin{ to{ transform: rotate(-360deg) } }
      .atab-head .closex{
        width: 32px; height: 32px; border-radius: 8px;
        background: rgba(255,255,255,0.04);
        color: #A8ADB8;
        border: 1px solid rgba(255,255,255,0.06);
        font-size: 16px; line-height: 1; cursor: pointer; transition: all .15s;
      }
      .atab-head .closex:hover{ background: rgba(224,100,100,0.12); color: #E06464; border-color: rgba(224,100,100,0.3) }
      .atab-body{ flex:1; overflow-y:auto; padding: 22px 24px }

      /* offline banner */
      .atab-offline-banner{
        background: rgba(232,163,92,0.10);
        border: 1px solid rgba(232,163,92,0.25);
        color: #E8A35C;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 12px;
        font-family: "IBM Plex Mono", monospace;
        letter-spacing: 0.5px;
        margin-bottom: 16px;
        display: flex; align-items: center; gap: 10px;
      }
      .atab-offline-banner::before{
        content: '⚠';
        font-size: 14px;
      }

      /* error card */
      .atab-error{
        padding: 60px 30px;
        text-align: center;
        background: rgba(224,100,100,0.04);
        border: 1px dashed rgba(224,100,100,0.25);
        border-radius: 12px;
      }
      .atab-error .ic{
        width: 48px; height: 48px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: rgba(224,100,100,0.10);
        border: 1px solid rgba(224,100,100,0.3);
        display: flex; align-items: center; justify-content: center;
        color: #E06464; font-size: 24px;
      }
      .atab-error .ttl{
        font-size: 16px; font-weight: 600;
        color: #EDEEF0; margin-bottom: 6px;
      }
      .atab-error .msg{
        font-size: 13px; color: #A8ADB8;
        margin-bottom: 4px;
      }
      .atab-error .detail{
        font-family: "IBM Plex Mono", monospace;
        font-size: 10.5px;
        color: #6B7180;
        letter-spacing: 0.5px;
        margin-bottom: 18px;
      }
      .atab-retry{
        padding: 9px 18px;
        border-radius: 8px;
        background: #C9A961;
        color: #1a1300;
        font-weight: 600; font-size: 13px;
        border: 0;
        cursor: pointer;
        font-family: inherit;
        transition: all .15s;
        display: inline-flex; align-items: center; gap: 8px;
      }
      .atab-retry:hover{ background: #B89548; transform: translateY(-1px) }
      .atab-retry svg{ width:13px; height:13px }

      /* empty state */
      .atab-empty{
        padding: 60px 30px;
        text-align: center;
      }
      .atab-empty .ic{
        width: 48px; height: 48px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        display: flex; align-items: center; justify-content: center;
        color: #6B7180;
      }
      .atab-empty .ic svg{ width:22px; height:22px; stroke-width:1.6 }
      .atab-empty .ttl{
        font-size: 14px; color: #A8ADB8;
        margin-bottom: 4px;
      }
      .atab-empty .sub{
        font-family: "IBM Plex Mono", monospace;
        font-size: 10.5px;
        color: #6B7180;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      /* shimmer skeletons */
      .atab-skel{
        background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%);
        background-size: 200% 100%;
        animation: atabShimmer 1.4s ease-in-out infinite;
        border-radius: 6px;
      }
      @keyframes atabShimmer{
        0%{ background-position: -100% 0 }
        100%{ background-position: 100% 0 }
      }
      .atab-skel-row{
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        gap: 14px; align-items: center;
        padding: 14px 16px;
        background: #1A1D24;
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 10px;
        margin-bottom: 10px;
      }
      .atab-skel-dot{ width:10px; height:10px; border-radius:50% }
      .atab-skel-block-1{ height: 14px; width: 60% }
      .atab-skel-block-2{ height: 11px; width: 40%; margin-top: 6px }
      .atab-skel-pri{ height: 18px; width: 56px; border-radius: 5px }
      .atab-skel-due{ height: 14px; width: 64px }

      /* ----- Actions/Decisions list ----- */
      .atab-actions{ display: flex; flex-direction: column; gap: 10px }
      .atab-act{
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        gap: 14px; align-items: center;
        padding: 14px 16px;
        background: #1A1D24;
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 10px;
        transition: all .15s; cursor: pointer;
      }
      .atab-act:hover{ border-color: rgba(201,169,97,0.25); background: #20242C }
      .atab-act .dot{ width:8px; height:8px; border-radius:50%; background:#C9A961; flex-shrink:0 }
      .atab-act .dot.red{ background:#E06464; box-shadow:0 0 8px #E06464 }
      .atab-act .dot.orange{ background:#E8A35C }
      .atab-act .dot.blue{ background:#6789C5 }
      .atab-act .dot.green{ background:#4FB477 }
      .atab-act .body .ttl{ font-size:14px; font-weight:500; color:#EDEEF0; margin-bottom:4px }
      .atab-act .body .sub{ font-family:"IBM Plex Mono",monospace; font-size:11px; color:#6B7180; letter-spacing:.5px }
      .atab-act .pri{
        font-family: "IBM Plex Mono", monospace;
        font-size: 10px; font-weight: 600;
        padding: 3px 8px; border-radius: 5px;
        letter-spacing: 1px; text-transform: uppercase;
      }
      .atab-act .pri.urgent{ background: rgba(224,100,100,0.14); color:#E06464; border:1px solid rgba(224,100,100,0.3) }
      .atab-act .pri.high{ background: rgba(201,169,97,0.12); color:#C9A961; border:1px solid rgba(201,169,97,0.25) }
      .atab-act .pri.normal{ background: rgba(255,255,255,0.04); color:#A8ADB8; border:1px solid rgba(255,255,255,0.06) }
      .atab-act .due{
        font-family: "IBM Plex Mono", monospace;
        font-size: 11px; color:#6B7180;
        font-variant-numeric: tabular-nums; white-space: nowrap;
      }
      .atab-act .due.overdue{ color:#E06464; font-weight:600 }

      /* ----- Calendar weekly grid ----- */
      .atab-week{
        display: grid;
        grid-template-columns: 56px repeat(7, 1fr);
        gap: 1px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px; overflow: hidden;
      }
      .atab-week .hdr{
        padding: 10px 8px; background: #1A1D24; text-align: center;
        font-family: "IBM Plex Mono", monospace;
        font-size: 10px; letter-spacing: 1.5px;
        color: #6B7180; text-transform: uppercase;
      }
      .atab-week .hdr.today{ color:#C9A961; background: rgba(201,169,97,0.06) }
      .atab-week .hdr .d{
        font-family: "IBM Plex Sans Arabic", sans-serif;
        font-size: 11px; font-weight: 500;
        color: #A8ADB8; letter-spacing: 0;
        margin-bottom: 2px;
      }
      .atab-week .hdr.today .d{ color:#C9A961 }
      .atab-week .hdr .n{
        font-family: "Inter", sans-serif;
        font-size: 18px; font-weight: 600;
        color: #EDEEF0; line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .atab-week .hdr.today .n{ color:#C9A961 }
      .atab-week .timecol{
        padding: 6px 8px; background: #15171C; text-align: center;
        font-family: "IBM Plex Mono", monospace;
        font-size: 9.5px; color: #6B7180;
        letter-spacing: 0.5px;
        font-variant-numeric: tabular-nums;
        border-top: 1px solid rgba(255,255,255,0.04);
      }
      .atab-week .cell{
        background: #15171C; min-height: 44px; padding: 4px;
        border-top: 1px solid rgba(255,255,255,0.04);
        position: relative;
      }
      .atab-week .cell.today{ background: rgba(201,169,97,0.03) }
      .atab-week .evt{
        font-size: 10.5px;
        padding: 3px 6px; border-radius: 4px;
        background: rgba(103,137,197,0.18);
        border-inline-start: 2px solid #6789C5;
        color: #EDEEF0; margin-bottom: 2px; cursor: pointer;
        line-height: 1.3;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .atab-week .evt.gold{ background: rgba(201,169,97,0.18); border-color:#C9A961 }
      .atab-week .evt.red{ background: rgba(224,100,100,0.18); border-color:#E06464 }
      .atab-week .evt.green{ background: rgba(79,180,119,0.18); border-color:#4FB477 }

      /* calendar skeleton */
      .atab-week-skel{ height: 380px; border-radius: 10px }

      /* ----- Mail inbox ----- */
      .atab-mail{
        display: flex; flex-direction: column;
        background: #1A1D24;
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 10px; overflow: hidden;
      }
      .atab-mail-row{
        display: grid;
        grid-template-columns: 32px auto 1fr auto;
        gap: 14px; align-items: center;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.04);
        transition: background .15s; cursor: pointer;
      }
      .atab-mail-row:last-child{ border-bottom: 0 }
      .atab-mail-row:hover{ background: #20242C }
      .atab-mail-row.unread{ background: rgba(201,169,97,0.03) }
      .atab-mail-row.unread .from, .atab-mail-row.unread .subj{ font-weight: 600; color:#EDEEF0 }
      .atab-mail-ava{
        width:32px; height:32px; border-radius:50%;
        background: rgba(201,169,97,0.12);
        border: 1px solid rgba(201,169,97,0.25);
        color:#C9A961;
        display:flex; align-items:center; justify-content:center;
        font-family:"Inter", sans-serif; font-size:12px; font-weight:600;
      }
      .atab-mail-row .from{ font-size:13px; color:#A8ADB8; white-space:nowrap; min-width:130px }
      .atab-mail-row .subj-wrap{ min-width:0; display:flex; align-items:center; gap:8px }
      .atab-mail-row .subj{ font-size:13px; color:#A8ADB8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
      .atab-mail-row .snippet{ font-size:12.5px; color:#6B7180; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
      .atab-mail-row .when{
        font-family:"IBM Plex Mono",monospace;
        font-size:11px; color:#6B7180;
        font-variant-numeric:tabular-nums; white-space:nowrap;
      }
      .atab-mail-row .tag{
        font-family:"IBM Plex Mono",monospace;
        font-size:9.5px; font-weight:600;
        padding:2px 6px; border-radius:4px; letter-spacing:1px;
      }
      .atab-mail-row .tag.urgent{ background: rgba(224,100,100,0.16); color:#E06464 }
      .atab-mail-row .tag.action{ background: rgba(201,169,97,0.16); color:#C9A961 }

      .atab-foot{
        padding: 12px 24px;
        border-top: 1px solid rgba(255,255,255,0.06);
        background: rgba(0,0,0,0.2);
        display: flex; justify-content: space-between; align-items: center;
        font-family: "IBM Plex Mono", monospace;
        font-size: 10.5px; color:#6B7180;
        letter-spacing: 1px; text-transform: uppercase;
      }
      .atab-foot a{ color:#C9A961; text-decoration: none }
      .atab-foot a:hover{ color:#E5C988 }

      @media(max-width:760px){
        .atab-week{ grid-template-columns: 44px repeat(7, 1fr); font-size: 10px }
        .atab-mail-row{ grid-template-columns: 28px 1fr auto; gap: 10px }
        .atab-mail-row .from{ display: none }
      }
    `;
    document.head.appendChild(s);
  }

  // ===================== NAV WIRING =====================
  function wireNav(){
    const navLinks = document.querySelectorAll('a[href$="calendar.html"], a[href$="mail.html"], a[href$="dashboard.html"]');
    navLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      let kind = null;
      if (href.endsWith('calendar.html')) kind = 'calendar';
      else if (href.endsWith('mail.html')) kind = 'mail';
      else if (href.endsWith('dashboard.html') && a.closest('nav')) kind = 'actions';
      if (!kind) return;
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        openPane(kind);
      });
    });
  }

  function setActiveTab(target){
    document.querySelectorAll('header nav a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const isActive =
        (target === 'actions' && href.endsWith('dashboard.html')) ||
        (target === 'calendar' && href.endsWith('calendar.html')) ||
        (target === 'mail' && href.endsWith('mail.html'));
      if (isActive) {
        a.style.color = '#C9A961';
        a.style.background = 'rgba(201,169,97,0.1)';
      } else if (href.endsWith('spine.html') || href.endsWith('today.html') ||
                 href.endsWith('calendar.html') || href.endsWith('mail.html') ||
                 href.endsWith('dashboard.html')) {
        a.style.color = 'rgba(255,255,255,0.5)';
        a.style.background = '';
      }
    });
  }

  // ===================== PANE LIFECYCLE =====================
  let _pane = null;
  let _currentKind = null;

  function openPane(kind){
    closePane();
    _currentKind = kind;
    _pane = document.createElement('div');
    _pane.className = 'atab-pane';
    _pane.dataset.kind = kind;
    _pane.innerHTML = paneShell(kind);
    document.body.appendChild(_pane);

    _pane.addEventListener('click', (e) => { if (e.target === _pane) closePane(); });
    _pane.querySelector('.closex').addEventListener('click', closePane);
    _pane.querySelector('.atab-refresh').addEventListener('click', () => refreshTab(kind, true));

    requestAnimationFrame(() => _pane.classList.add('open'));
    setActiveTab(kind);

    // Lazy load: only fetch on first open this session
    const st = TAB_STATE[kind];
    if (st.isLoaded && !st.hasError) {
      renderTabBody(kind);
    } else {
      refreshTab(kind, false);
    }
  }

  function closePane(){
    if (!_pane) return;
    _pane.classList.remove('open');
    const dead = _pane;
    setTimeout(() => { if (dead) dead.remove(); }, 220);
    _pane = null; _currentKind = null;
    setActiveTab('actions');
  }

  // ===================== PANE SHELL =====================
  // Head + empty body. Body is filled by renderTabBody().
  function paneShell(kind){
    const titles = {
      actions:  { ar:'الإجراءات المعلّقة', en:'PENDING ACTIONS &amp; DECISIONS' },
      calendar: { ar:'تقويم الأسبوع',      en:'WEEKLY CALENDAR' },
      mail:     { ar:'صندوق الوارد',       en:'INBOX' },
    };
    const t = titles[kind] || { ar:'', en:'' };
    return `
      <div class="atab-card">
        <div class="atab-head">
          <div>
            <h2>${t.ar}</h2>
            <div class="sub" data-role="head-sub">${t.en}</div>
          </div>
          <div class="atab-head-right">
            <button class="atab-refresh" title="تحديث" aria-label="تحديث">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></svg>
            </button>
            <button class="closex" aria-label="إغلاق">✕</button>
          </div>
        </div>
        <div class="atab-body" data-role="body"></div>
        <div class="atab-foot" data-role="foot"></div>
      </div>
    `;
  }

  // ===================== FETCH LAYER =====================
  function authHeaders(){
    const tok = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token') || '';
    return tok ? { 'Authorization': 'Bearer ' + tok } : {};
  }

  async function apiFetch(path, signal){
    const url = API_BASE + path;
    const r = await fetch(url, { headers: authHeaders(), signal });
    if (!r.ok) {
      let detail = '';
      try { const j = await r.json(); detail = j.error || ''; } catch(_){ }
      const err = new Error(detail || ('HTTP ' + r.status));
      err.status = r.status;
      throw err;
    }
    const data = await r.json();
    return data;
  }

  // ===================== REFRESH / FETCH PER TAB =====================
  async function refreshTab(kind, manual){
    const st = TAB_STATE[kind];
    if (st.isLoading) return;
    st.isLoading = true; st.hasError = false; st.errMsg = ''; st.mockMode = false;

    // Show skeleton (unless we have cached data we want to keep visible during refresh)
    if (manual && st.isLoaded) {
      // Keep current view, but spin the button
      spinRefresh(true);
    } else {
      renderSkeleton(kind);
      spinRefresh(true);
    }

    const endpointMap = {
      actions:  '/api/tasks',
      calendar: '/api/calendar/events',
      mail:     '/api/mail',
    };
    const path = endpointMap[kind];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      let data = await apiFetch(path, controller.signal);
      clearTimeout(timer);

      // Normalize: workers sometimes wrap in {items:[]} or {tasks:[]}
      if (Array.isArray(data)) { /* ok */ }
      else if (data && Array.isArray(data.items)) data = data.items;
      else if (data && Array.isArray(data[kind])) data = data[kind];
      else if (data && Array.isArray(data.events)) data = data.events;
      else if (data && Array.isArray(data.tasks)) data = data.tasks;
      else if (data && Array.isArray(data.messages)) data = data.messages;
      else data = [];

      st.data = data;
      st.isLoaded = true;
      st.hasError = false;
    } catch (e) {
      st.hasError = true;
      st.errMsg = (e && e.message) ? e.message : 'network error';
      // Offline fallback to mock data
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        st.data = mockFor(kind);
        st.isLoaded = true;
        st.mockMode = true;
      }
    } finally {
      st.isLoading = false;
      spinRefresh(false);
      if (_currentKind === kind) renderTabBody(kind);
    }
  }

  function spinRefresh(on){
    if (!_pane) return;
    const btn = _pane.querySelector('.atab-refresh');
    if (!btn) return;
    btn.classList.toggle('spinning', !!on);
    btn.disabled = !!on;
  }

  // ===================== RENDER =====================
  function renderTabBody(kind){
    if (!_pane || _currentKind !== kind) return;
    const st = TAB_STATE[kind];
    const body = _pane.querySelector('[data-role="body"]');
    const foot = _pane.querySelector('[data-role="foot"]');
    const sub  = _pane.querySelector('[data-role="head-sub"]');

    if (st.hasError && !st.isLoaded) {
      body.innerHTML = errorHTML(kind, st.errMsg);
      foot.innerHTML = footError();
      wireRetry(kind);
      return;
    }

    const items = st.data || [];
    if (items.length === 0) {
      body.innerHTML = emptyHTML(kind) + (st.mockMode ? '' : '');
      foot.innerHTML = footEmpty();
      return;
    }

    if (kind === 'actions')  { body.innerHTML = (st.mockMode ? offlineBanner() : '') + renderActions(items);  foot.innerHTML = footActions(items);  sub.innerHTML = `PENDING ACTIONS · ${items.length} ITEMS`; wireActions(); }
    if (kind === 'calendar') { body.innerHTML = (st.mockMode ? offlineBanner() : '') + renderCalendar(items); foot.innerHTML = footCalendar(items); sub.innerHTML = `WEEKLY · ${items.length} EVENTS`; }
    if (kind === 'mail')     { body.innerHTML = (st.mockMode ? offlineBanner() : '') + renderMail(items);     foot.innerHTML = footMail(items);     sub.innerHTML = `INBOX · ${items.filter(m=>!isMailRead(m)).length} UNREAD · ${items.length} TOTAL`; wireMail(); }
  }

  function offlineBanner(){
    return `<div class="atab-offline-banner">وضع غير متصل · بيانات تجريبية · OFFLINE FALLBACK</div>`;
  }

  // ----- Skeletons -----
  function renderSkeleton(kind){
    if (!_pane || _currentKind !== kind) return;
    const body = _pane.querySelector('[data-role="body"]');
    const foot = _pane.querySelector('[data-role="foot"]');
    if (kind === 'actions' || kind === 'mail') {
      body.innerHTML = Array.from({length:6}).map(()=>`
        <div class="atab-skel-row">
          <span class="atab-skel atab-skel-dot"></span>
          <div>
            <div class="atab-skel atab-skel-block-1"></div>
            <div class="atab-skel atab-skel-block-2"></div>
          </div>
          <span class="atab-skel atab-skel-pri"></span>
          <span class="atab-skel atab-skel-due"></span>
        </div>
      `).join('');
    } else if (kind === 'calendar') {
      body.innerHTML = `<div class="atab-skel atab-week-skel"></div>`;
    }
    foot.innerHTML = `<span>جارٍ التحميل…</span><span>LOADING</span>`;
  }

  // ----- Error -----
  function errorHTML(kind, msg){
    return `
      <div class="atab-error">
        <div class="ic">!</div>
        <div class="ttl">تعذّر تحميل البيانات</div>
        <div class="msg">يُرجى المحاولة مرة أخرى.</div>
        <div class="detail">${escapeHtml(msg || 'network error')} · ${kind.toUpperCase()}</div>
        <button class="atab-retry" data-retry="${kind}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/></svg>
          إعادة المحاولة
        </button>
      </div>
    `;
  }
  function wireRetry(kind){
    const btn = _pane && _pane.querySelector('.atab-retry');
    if (btn) btn.addEventListener('click', () => refreshTab(kind, true));
  }

  // ----- Empty -----
  function emptyHTML(kind){
    const map = {
      actions:  { ttl:'لا توجد بيانات حالياً', sub:'NO PENDING ACTIONS' },
      calendar: { ttl:'لا توجد بيانات حالياً', sub:'NO EVENTS THIS WEEK' },
      mail:     { ttl:'لا توجد بيانات حالياً', sub:'INBOX ZERO' },
    };
    const m = map[kind] || { ttl:'لا توجد بيانات حالياً', sub:'EMPTY' };
    return `
      <div class="atab-empty">
        <div class="ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="ttl">${m.ttl}</div>
        <div class="sub">${m.sub}</div>
      </div>
    `;
  }

  // ----- Foot variants -----
  function footError(){ return `<span>تعذّر التحميل</span><span>RETRY ABOVE</span>`; }
  function footEmpty(){ return `<span>لا توجد بيانات</span><span>EMPTY</span>`; }
  function footActions(items){
    const u = items.filter(a => normPri(a) === 'urgent').length;
    const h = items.filter(a => normPri(a) === 'high').length;
    return `<span>${u} URGENT · ${h} HIGH PRIORITY</span><a href="spine.html#approvals">عرض في المنصة ←</a>`;
  }
  function footCalendar(items){ return `<span>${items.length} EVENTS SCHEDULED</span><a href="calendar.html">فتح التقويم الكامل ←</a>`; }
  function footMail(items){ const f = items.filter(m => m.flagged || m.urgent || /urgent|action/i.test(m.tag||'')).length; return `<span>${f} FLAGGED FOR ACTION</span><a href="mail.html">فتح البريد الكامل ←</a>`; }

  // ===================== ACTIONS (TASKS) =====================
  function normPri(t){ return (t && (t.priority || t.pri || 'normal')).toLowerCase(); }
  function dueLabel(s){
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(d); target.setHours(0,0,0,0);
    const diff = Math.round((target - today) / 86400000);
    if (diff < 0) return Math.abs(diff) + ' ي متأخّر';
    if (diff === 0) return 'اليوم';
    if (diff === 1) return 'غداً';
    if (diff < 7) return 'خلال ' + diff + ' ي';
    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return d.getDate() + ' ' + months[d.getMonth()];
  }
  function isOverdue(s){
    if (!s) return false;
    const d = new Date(s); if (isNaN(d.getTime())) return false;
    d.setHours(23,59,59,999);
    return d.getTime() < Date.now();
  }
  function dotForPri(p){ if (p==='urgent') return 'red'; if (p==='high') return 'orange'; return 'blue'; }
  function priLabel(p){ if (p==='urgent') return 'عاجل'; if (p==='high') return 'عالٍ'; return 'عادي'; }

  function renderActions(items){
    return `
      <div class="atab-actions">
        ${items.map(t => {
          const p = normPri(t);
          const dot = t.dot || dotForPri(p);
          const due = t.due || t.dueDate || t.due_at || '';
          const dueLbl = due ? dueLabel(due) : '';
          const overdue = due && isOverdue(due);
          return `
            <div class="atab-act" data-id="${escapeAttr(t.id || '')}">
              <span class="dot ${dot}"></span>
              <div class="body">
                <div class="ttl">${escapeHtml(t.title || t.name || '(بدون عنوان)')}</div>
                <div class="sub">${escapeHtml(t.project || t.sopRef || t.dept || t.source || '')}${t.status ? ' · ' + escapeHtml(t.status).toUpperCase() : ''}</div>
              </div>
              <span class="pri ${p}">${priLabel(p)}</span>
              <span class="due ${overdue?'overdue':''}">${escapeHtml(dueLbl)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  function wireActions(){
    if (!_pane) return;
    _pane.querySelectorAll('.atab-act').forEach(row => {
      row.addEventListener('click', () => {
        row.style.background = '#252932'; row.style.transform = 'scale(0.99)';
        setTimeout(() => { row.style.background=''; row.style.transform=''; }, 200);
      });
    });
  }

  // ===================== CALENDAR =====================
  function renderCalendar(items){
    const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
    const todayIdx = now.getDay();
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

    // Group events by day-hour
    const evMap = {};
    items.forEach(ev => {
      const s = ev.start || ev.startsAt || ev.start_at || ev.dateTime || null;
      if (!s) return;
      const d = new Date(s); if (isNaN(d.getTime())) return;
      const dayIdx = d.getDay();
      const hr = d.getHours();
      const key = `${dayIdx}-${hr}`;
      if (!evMap[key]) evMap[key] = [];
      evMap[key].push({
        title: ev.title || ev.subject || ev.summary || 'حدث',
        kind: kindForEvent(ev),
      });
    });

    const headers = days.map((d, i) => {
      const date = new Date(start); date.setDate(start.getDate() + i);
      const isToday = i === todayIdx;
      return `<div class="hdr ${isToday?'today':''}"><div class="d">${d}</div><div class="n">${date.getDate()}</div></div>`;
    }).join('');

    let rows = '';
    hours.forEach(h => {
      rows += `<div class="timecol">${String(h).padStart(2,'0')}:00</div>`;
      for (let d = 0; d < 7; d++) {
        const isToday = d === todayIdx;
        const evts = evMap[`${d}-${h}`] || [];
        rows += `<div class="cell ${isToday?'today':''}">${evts.map(e=>`<div class="evt ${e.kind}">${escapeHtml(e.title)}</div>`).join('')}</div>`;
      }
    });

    const monthName = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][now.getMonth()];
    return `
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#6B7180;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px">
        ${monthName} ${now.getFullYear()} · WEEK ${getWeekNum(now)} · 7-DAY GRID
      </div>
      <div class="atab-week">
        <div class="hdr" style="background:transparent;border:0"></div>
        ${headers}
        ${rows}
      </div>
    `;
  }
  function kindForEvent(ev){
    const t = (ev.tag || ev.kind || ev.color || '').toLowerCase();
    if (/urgent|red|meeting/.test(t)) return 'red';
    if (/gold|important/.test(t)) return 'gold';
    if (/green|done|ok/.test(t)) return 'green';
    return '';
  }
  function getWeekNum(d){
    const first = new Date(d.getFullYear(), 0, 1);
    const diff = Math.floor((d - first) / 86400000);
    return Math.ceil((diff + first.getDay() + 1) / 7);
  }

  // ===================== MAIL =====================
  function isMailRead(m){ return !!(m.read || m.isRead || m.status === 'read'); }
  function avatarFor(s){
    if (!s) return '?';
    const parts = String(s).trim().split(/\s+/);
    const a = (parts[0]||'')[0] || '';
    const b = (parts[1]||'')[0] || '';
    return (a+b).toUpperCase() || s[0].toUpperCase();
  }
  function renderMail(items){
    return `
      <div class="atab-mail">
        ${items.map(m => {
          const from = m.from || m.fromName || m.sender || 'unknown';
          const subj = m.subject || m.subj || m.title || '(بدون موضوع)';
          const snip = m.preview || m.snippet || m.body || '';
          const when = m.time || m.when || m.timestamp || m.ts || '';
          const tag = (m.tag || (m.urgent?'urgent':'') || (m.flagged?'action':'')).toLowerCase();
          const unread = !isMailRead(m);
          return `
            <div class="atab-mail-row ${unread?'unread':''}" data-id="${escapeAttr(m.id || '')}">
              <div class="atab-mail-ava">${escapeHtml(avatarFor(from))}</div>
              <div class="from">${escapeHtml(from)}</div>
              <div class="subj-wrap">
                <span class="subj">${escapeHtml(subj)}</span>
                <span class="snippet"> — ${escapeHtml(snip).slice(0,140)}</span>
                ${tag ? `<span class="tag ${tag}">${tag==='urgent'?'عاجل':'يتطلّب إجراء'}</span>` : ''}
              </div>
              <div class="when">${escapeHtml(formatWhen(when))}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  function formatWhen(s){
    if (!s) return '';
    const d = (typeof s === 'number') ? new Date(s) : new Date(s);
    if (isNaN(d.getTime())) return String(s);
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff/60000);
    if (min < 1) return 'الآن';
    if (min < 60) return min + 'د';
    const h = Math.floor(min/60);
    if (h < 24) return h + 'س';
    const day = Math.floor(h/24);
    if (day === 1) return 'أمس';
    if (day < 7) return day + ' ي';
    return d.getDate() + '/' + (d.getMonth()+1);
  }
  function wireMail(){
    if (!_pane) return;
    _pane.querySelectorAll('.atab-mail-row').forEach(row => {
      row.addEventListener('click', () => {
        row.classList.remove('unread');
        row.style.background = '#252932';
        setTimeout(() => { row.style.background=''; }, 200);
      });
    });
  }

  // ===================== MOCK FALLBACK DATA =====================
  function mockFor(kind){
    if (kind === 'actions') return [
      { id:'AC1', dot:'red',    title:'اعتماد عقد توريد المواد — Q2',     project:'APPROVAL · SAR 420K · بانتظار توقيعك ٣ أيام', priority:'urgent', dueDate: yesterday(2) },
      { id:'AC2', dot:'orange', title:'قرار توسعة موقع الخبر',             project:'DEC-104 · بانتظار تقييم قانوني',              priority:'high',   dueDate: future(2) },
      { id:'AC3', dot:'red',    title:'تصعيد مخاطر تأخير تسليم Q2',        project:'RISK · مشروع الرياض-الشرق · غرامة محتملة',     priority:'urgent', dueDate: future(0) },
      { id:'AC4', dot:'orange', title:'اعتماد ميزانية تشغيل قسم الصيانة',  project:'BUDGET · SAR 85K · مراجعة سنوية',              priority:'high',   dueDate: future(4) },
      { id:'AC5', dot:'blue',   title:'مراجعة أجندة اجتماع المجلس · الخميس', project:'MEETING · ٥ بنود تحتاج موافقتك',             priority:'high',   dueDate: future(1) },
      { id:'AC6', dot:'green',  title:'توقيع عقد توظيف · مدير عمليات الخبر', project:'HR · المرشّح اجتاز ٣ مقابلات',               priority:'normal', dueDate: future(5) },
      { id:'AC7', dot:'orange', title:'اعتماد التقرير ربع السنوي للمجلس',  project:'REPORT · مسوّدة ٦٠٪ · يحتاج إدخالات نهائية',  priority:'high',   dueDate: future(7) },
      { id:'AC8', dot:'blue',   title:'مراجعة طلب إجازة · م. سعد القحطاني', project:'HR · ١٠ أيام · ٢٧ مايو',                      priority:'normal', dueDate: future(3) },
    ];
    if (kind === 'calendar') {
      const now = new Date();
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
      const at = (dayOffset, hr) => { const d = new Date(start); d.setDate(start.getDate()+dayOffset); d.setHours(hr,0,0,0); return d.toISOString(); };
      return [
        { id:'E1', title:'مراجعة المشاريع', start: at(1,9),  tag:'gold' },
        { id:'E2', title:'٢:٠٠ — مالية',    start: at(1,14), tag:'' },
        { id:'E3', title:'مقاولين',         start: at(2,10), tag:'' },
        { id:'E4', title:'اجتماع المجلس',   start: at(3,11), tag:'urgent' },
        { id:'E5', title:'تقارير Q1',       start: at(3,15), tag:'gold' },
        { id:'E6', title:'لقاء فريق العمليات', start: at(4,9), tag:'green' },
        { id:'E7', title:'م. سعد',          start: at(4,14), tag:'' },
        { id:'E8', title:'مراجعة الموردين', start: at(5,10), tag:'' },
        { id:'E9', title:'مراجعة الأسبوع',  start: at(0,16), tag:'gold' },
      ];
    }
    if (kind === 'mail') {
      const ago = m => new Date(Date.now() - m*60000).toISOString();
      return [
        { id:'M1', from:'م. عبدالله العتيبي',          subject:'تحديث مشروع الرياض-الشرق',         preview:'مرفق التقرير الأسبوعي مع الصور...', time: ago(0),    read:false, tag:'urgent' },
        { id:'M2', from:'مجموعة الخليج للمقاولات',     subject:'عرض سعر معدّل — توريد المواد',     preview:'نتشرّف بتقديم العرض المعدّل بعد المفاوضات...', time: ago(30),   read:false, tag:'action' },
        { id:'M3', from:'الإدارة المالية',              subject:'تقرير المصروفات الشهري — أبريل',   preview:'يرجى مراجعة التقرير قبل ٢٠ مايو...', time: ago(120),  read:false },
        { id:'M4', from:'م. سعد القحطاني',              subject:'طلب إجازة سنوية',                  preview:'أتقدّم بطلب إجازة ١٠ أيام بدءاً من ٢٧ مايو...', time: ago(180),  read:true  },
        { id:'M5', from:'سكرتارية المجلس',              subject:'تذكير: اجتماع المجلس · الخميس ١٠:٠٠', preview:'مرفق الأجندة المبدئية...',   time: ago(300),  read:true  },
        { id:'M6', from:'أ. نورة الراشد',               subject:'مراجعة عقد التوظيف — مدير عمليات الخبر', preview:'تم مراجعة العقد قانونياً، يمكن المضي قدماً...', time: ago(60*24), read:true },
        { id:'M7', from:'إدارة المشتريات',              subject:'موافقة على طلب الشراء PO-2451',    preview:'تم اعتماد الطلب وإصداره للمورّد...', time: ago(60*26), read:true },
        { id:'M8', from:'فريق التطوير',                 subject:'تحديث المنصّة v2.7 جاهز للنشر',    preview:'تم إغلاق ١٤ تذكرة في هذه الدفعة...', time: ago(60*28), read:true },
      ];
    }
    return [];
  }
  function yesterday(n){ const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString(); }
  function future(n){ const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString(); }

  // ===================== UTIL =====================
  function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s){ return String(s ?? '').replace(/"/g,'&quot;'); }

  // Re-fetch on online/offline transitions if a pane is open & errored
  window.addEventListener('online', () => {
    if (!_currentKind) return;
    const st = TAB_STATE[_currentKind];
    if (st && (st.hasError || st.mockMode)) refreshTab(_currentKind, true);
  });

  // Expose for debugging
  window.__arsanTabs = { state: TAB_STATE, refresh: refreshTab };
})();

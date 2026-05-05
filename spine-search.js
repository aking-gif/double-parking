/* =================================================================
   THE SPINE — Universal Search Orb
   Glowing circular search button, top-end of the page.
   Click → goes to spine.html and auto-opens Cmd+K palette.
   ================================================================= */
(function(){
  'use strict';
  if (window.__spineSearchInjected) return;
  window.__spineSearchInjected = true;

  // Don't inject on the spine itself — it has its own in-topbar orb
  const path = (location.pathname || '').toLowerCase();
  if (path.endsWith('/spine.html') || path.endsWith('spine.html')) return;

  function inject(){
    if (document.getElementById('spine-search-orb')) return;

    const css = document.createElement('style');
    css.textContent = `
      #spine-search-orb{
        position: fixed;
        top: 14px;
        inset-inline-end: 14px;
        z-index: 9998;
        width: 42px; height: 42px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: #C9A961;
        background: rgba(20,20,20,0.55);
        border: 1px solid rgba(201,169,97,0.4);
        cursor: pointer;
        transition: transform .2s, background .2s, border-color .2s, color .2s;
        backdrop-filter: blur(14px) saturate(140%);
        -webkit-backdrop-filter: blur(14px) saturate(140%);
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        text-decoration: none;
        line-height: 0;
      }
      #spine-search-orb svg{
        width: 17px; height: 17px;
        stroke-width: 2;
        position: relative; z-index: 2;
      }
      #spine-search-orb::before{
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 1px solid rgba(201,169,97,0.4);
        opacity: .55;
        animation: spineOrbPulse 2.4s ease-in-out infinite;
        pointer-events: none;
      }
      #spine-search-orb::after{
        content: '';
        position: absolute;
        inset: -11px;
        border-radius: 50%;
        border: 1px solid rgba(201,169,97,0.2);
        opacity: 0;
        animation: spineOrbPulse2 2.4s ease-in-out infinite;
        pointer-events: none;
      }
      @keyframes spineOrbPulse{
        0%,100%{ transform: scale(1); opacity: .55; }
        50%{ transform: scale(1.15); opacity: .15; }
      }
      @keyframes spineOrbPulse2{
        0%,100%{ transform: scale(1); opacity: 0; }
        50%{ transform: scale(1.3); opacity: .4; }
      }
      #spine-search-orb:hover{
        background: rgba(201,169,97,0.95);
        color: #1a1300;
        border-color: #C9A961;
        transform: scale(1.06);
      }
      #spine-search-orb:hover::before{ border-color: rgba(201,169,97,0.7); }

      /* tooltip */
      #spine-search-orb .so-tip{
        position: absolute;
        top: 50%;
        inset-inline-end: calc(100% + 10px);
        transform: translateY(-50%) translateX(8px);
        background: rgba(20,20,20,0.95);
        color: #EDEEF0;
        font-family: "IBM Plex Sans Arabic","Inter",system-ui,sans-serif;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.08);
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity .15s, transform .15s;
      }
      #spine-search-orb .so-tip .kbd{
        margin-inline-start: 6px;
        padding: 1px 5px;
        border-radius: 3px;
        background: rgba(255,255,255,0.08);
        font-family: ui-monospace,SFMono-Regular,Menlo,monospace;
        font-size: 10px;
        color: #C9A961;
      }
      #spine-search-orb:hover .so-tip{
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }

      @media (max-width: 640px){
        #spine-search-orb .so-tip{ display: none }
        #spine-search-orb{ width: 38px; height: 38px; top: 12px; inset-inline-end: 12px }
      }
      @media print{ #spine-search-orb{ display: none } }
    `;
    document.head.appendChild(css);

    const btn = document.createElement('a');
    btn.id = 'spine-search-orb';
    btn.href = 'spine.html?search=1';
    btn.setAttribute('aria-label', 'بحث شامل');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="7"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <span class="so-tip">ابحث في كل المنصّة <span class="kbd">⌘K</span></span>
    `;
    document.body.appendChild(btn);

    // Keyboard shortcut: Cmd/Ctrl+K → jump to spine search
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
        e.preventDefault();
        location.href = 'spine.html?search=1';
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

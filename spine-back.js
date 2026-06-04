/* =================================================================
   THE SPINE — Back-to-Spine floating button
   Inject this script in every page to add a "Back to Spine" button.
   ================================================================= */
(function(){
  'use strict';
  if (window.__spineBackInjected) return;
  window.__spineBackInjected = true;

  // Don't show on the spine itself or login pages
  const path = (location.pathname || '').toLowerCase();
  if (path.endsWith('/spine.html') || path.endsWith('spine.html')) return;

  function inject(){
    if (document.getElementById('spine-back-btn')) return;

    const css = document.createElement('style');
    css.textContent = `
      #spine-back-btn{
        position:fixed;
        top:14px;
        inset-inline-start:14px;
        z-index:9998;
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:8px 14px 8px 12px;
        background:rgba(20,20,20,0.92);
        color:#EDEEF0;
        border:1px solid rgba(201,169,97,0.35);
        border-radius:999px;
        font-family:"IBM Plex Sans Arabic","Inter",system-ui,sans-serif;
        font-size:12.5px;
        font-weight:500;
        cursor:pointer;
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
        box-shadow:0 8px 24px rgba(0,0,0,0.25);
        transition:transform .15s, background .15s, border-color .15s;
        text-decoration:none;
        line-height:1;
      }
      #spine-back-btn:hover{
        background:rgba(201,169,97,0.95);
        color:#1a1300;
        border-color:#C9A961;
        transform:translateY(-1px);
      }
      #spine-back-btn .sb-mark{
        width:20px; height:20px;
        border:1px solid currentColor;
        border-radius:5px;
        display:flex; align-items:center; justify-content:center;
        font-family:"Inter",sans-serif;
        font-weight:700;
        font-size:11px;
        letter-spacing:-0.5px;
      }
      #spine-back-btn .sb-arrow{
        font-family:"Inter",sans-serif;
        font-size:14px;
        line-height:1;
        opacity:.7;
      }
      #spine-back-btn .sb-label{ white-space:nowrap }
      #spine-back-btn .sb-sub{
        font-family:"Inter",sans-serif;
        font-size:9.5px;
        letter-spacing:1px;
        text-transform:uppercase;
        opacity:.55;
        font-weight:600;
      }
      @media (max-width:640px){
        #spine-back-btn .sb-sub{ display:none }
        #spine-back-btn{ padding:7px 11px 7px 9px; font-size:12px }
      }
      @media print{ #spine-back-btn{ display:none } }
    `;
    document.head.appendChild(css);

    const btn = document.createElement('a');
    btn.id = 'spine-back-btn';
    btn.href = 'spine.html';
    btn.title = 'العودة للعمود الفقري';
    btn.innerHTML = `
      <span class="sb-mark">A</span>
      <span class="sb-label">المنصة</span>
      <span class="sb-sub">SPINE</span>
      <span class="sb-arrow">←</span>
    `;
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

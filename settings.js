/* Arsan System Settings Modal — redesigned to match dashboard design system
 * Uses the same CSS variables (--surface, --ink, --accent, --line, --radius…)
 * Supports light/dark automatically via html[data-theme].
 *
 * Admin-only panel for:
 *   - Updates banner source URL (Google Doc pub?embedded=true)
 *   - Slack webhook URL
 *   - Custom departments (add/edit/delete)
 *   - Updates banner preview + reset
 * Mounts on #btn-settings click (users.html) + window.openArsanSettings().
 */
(function(){
  'use strict';

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function el(tag, attrs={}, ...children){
    const n = document.createElement(tag);
    for (const k in attrs) {
      if (attrs[k] == null) continue;
      if (k === 'class') n.className = attrs[k];
      else if (k === 'style') n.style.cssText = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    for (const c of children) {
      if (c == null) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  /* ------------------------------------------------------------------
     Styles — use dashboard design tokens (var(--surface) … var(--accent))
     so the panel inherits the app's theme (light + dark) automatically.
     ------------------------------------------------------------------ */
  function injectStyles(){
    if (document.getElementById('arsan-settings-styles')) return;
    const style = document.createElement('style');
    style.id = 'arsan-settings-styles';
    style.textContent = `
      /* Backdrop — blurred, neutral, consistent with app modals */
      .asst-bd{
        position:fixed; inset:0; z-index:9998;
        background:color-mix(in oklab, var(--ink, #111) 55%, transparent);
        backdrop-filter: blur(6px) saturate(120%);
        -webkit-backdrop-filter: blur(6px) saturate(120%);
        display:grid; place-items:center; padding:24px;
        animation: asst-fade .18s ease;
      }
      @keyframes asst-fade { from{opacity:0} to{opacity:1} }
      @keyframes asst-pop  { from{opacity:0; transform:translateY(8px) scale(.985)} to{opacity:1; transform:none} }

      /* Modal shell */
      .asst-modal{
        background:var(--surface, #fff);
        color:var(--ink, #111827);
        border:1px solid var(--line, #E7E3D8);
        border-radius:16px;
        max-width:760px; width:100%;
        max-height:90vh; overflow:hidden;
        display:flex; flex-direction:column;
        box-shadow: var(--arsan-shadow-lg, 0 20px 60px rgba(40,30,20,.18));
        animation: asst-pop .22s cubic-bezier(.2,.8,.2,1);
        font-family: inherit;
      }

      /* Header — soft accent wash, mirrors .modal-head in dashboard */
      .asst-head{
        padding:18px 24px 16px;
        border-bottom:1px solid var(--line, #E7E3D8);
        background:
          linear-gradient(180deg,
            color-mix(in oklab, var(--accent, #8B6F00) 8%, var(--surface, #fff)),
            transparent 85%),
          var(--surface, #fff);
        display:flex; align-items:center; justify-content:space-between; gap:16px;
        position:relative;
      }
      .asst-head h2{
        margin:0;
        font-size:20px;
        font-weight:700;
        color:var(--ink, #111827);
        letter-spacing:-.01em;
        display:flex; align-items:center; gap:10px;
      }
      .asst-head h2 .dot{
        width:8px; height:8px; border-radius:50%;
        background:var(--accent, #8B6F00);
        box-shadow:0 0 0 4px color-mix(in oklab, var(--accent, #8B6F00) 18%, transparent);
      }
      .asst-close{
        width:34px; height:34px; border-radius:10px;
        display:inline-flex; align-items:center; justify-content:center;
        background:var(--surface, #fff);
        border:1px solid var(--line, #E7E3D8);
        color:var(--ink-2, #374151);
        font:inherit; font-size:20px; line-height:1;
        cursor:pointer;
        transition: background .15s ease, color .15s ease, transform .12s ease;
      }
      .asst-close:hover{
        background:var(--ink, #111827);
        color:var(--surface, #fff);
        transform:translateY(-1px);
      }

      /* Tabs — match chips / segmented-control language */
      .asst-tabs{
        display:flex; gap:6px;
        padding:10px 18px 0;
        border-bottom:1px solid var(--line, #E7E3D8);
        background:var(--surface-2, #FBFAF6);
        overflow-x:auto;
        scrollbar-width:none;
      }
      .asst-tabs::-webkit-scrollbar{ display:none }
      .asst-tab{
        padding:10px 14px 12px;
        cursor:pointer;
        background:none; border:none;
        color:var(--ink-3, #6B7280);
        font:inherit; font-size:13.5px; font-weight:600;
        border-bottom:2px solid transparent;
        white-space:nowrap;
        transition: color .15s ease, border-color .15s ease;
        display:inline-flex; align-items:center; gap:6px;
      }
      .asst-tab:hover{ color:var(--accent-ink, #5E4B00) }
      .asst-tab.active{
        color:var(--accent-ink, #5E4B00);
        border-bottom-color:var(--accent, #8B6F00);
      }
      html[data-theme="dark"] .asst-tab.active{ color:var(--accent, #5C7A9C) }

      /* Panes */
      .asst-body{ overflow:auto; flex:1; background:var(--surface, #fff) }
      .asst-pane{ display:none; padding:22px 24px }
      .asst-pane.active{ display:block; animation: asst-fade .2s ease }

      /* Fields */
      .asst-field{ margin-bottom:16px }
      .asst-field label{
        display:block;
        font-size:12.5px; font-weight:600;
        margin-bottom:6px;
        color:var(--ink-2, #374151);
        letter-spacing:.01em;
      }
      .asst-field input[type="text"],
      .asst-field input[type="url"],
      .asst-field input[type="email"],
      .asst-field textarea,
      .asst-field select{
        width:100%;
        padding:10px 12px;
        border:1px solid var(--line, #E7E3D8);
        border-radius:10px;
        background:var(--surface, #fff);
        color:var(--ink, #111827);
        font:inherit; font-size:13.5px;
        box-sizing:border-box;
        transition: border-color .15s ease, box-shadow .15s ease;
      }
      .asst-field textarea{ min-height:72px; resize:vertical; line-height:1.55 }
      .asst-field input:focus,
      .asst-field textarea:focus,
      .asst-field select:focus{
        outline:none;
        border-color:var(--accent, #8B6F00);
        box-shadow:0 0 0 4px color-mix(in oklab, var(--accent, #8B6F00) 18%, transparent);
      }
      .asst-field input[readonly]{
        background:var(--surface-2, #FBFAF6);
        color:var(--ink-3, #6B7280);
        cursor:not-allowed;
      }
      .asst-hint{
        font-size:12px;
        color:var(--ink-3, #6B7280);
        margin-top:6px;
        line-height:1.65;
      }
      .asst-hint code{
        background:var(--accent-softer, #FBF7E6);
        color:var(--accent-ink, #5E4B00);
        padding:1px 6px; border-radius:5px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size:11.5px;
      }
      .asst-hint strong{ color:var(--ink-2, #374151) }

      /* Inline action row */
      .asst-row{
        display:flex; gap:8px; align-items:center; flex-wrap:wrap;
        margin-top:4px;
      }

      /* Buttons — mirror .btn in dashboard */
      .asst-btn{
        padding:9px 16px;
        border:1px solid var(--line, #E7E3D8);
        background:var(--surface, #fff);
        color:var(--ink, #111827);
        border-radius:10px;
        cursor:pointer;
        font:inherit; font-size:13px; font-weight:500;
        display:inline-flex; align-items:center; gap:6px;
        transition: background .15s ease, border-color .15s ease, transform .12s ease, opacity .15s;
      }
      .asst-btn:hover{
        background:var(--accent-softer, #FBF7E6);
        border-color:color-mix(in oklab, var(--accent, #8B6F00) 35%, var(--line, #E7E3D8));
        transform:translateY(-1px);
      }
      .asst-btn:active{ transform:translateY(0) }
      .asst-btn[disabled]{ opacity:.55; cursor:wait; transform:none }

      .asst-btn.primary{
        background:var(--ink, #111827);
        color:var(--surface, #fff);
        border-color:var(--ink, #111827);
        font-weight:600;
      }
      .asst-btn.primary:hover{
        background:color-mix(in oklab, var(--ink, #111827) 88%, var(--accent, #8B6F00));
        border-color:transparent;
      }
      html[data-theme="dark"] .asst-btn.primary{
        background:var(--accent, #5C7A9C); color:#111; border-color:var(--accent, #5C7A9C);
      }
      html[data-theme="dark"] .asst-btn.primary:hover{
        background:color-mix(in oklab, var(--accent, #5C7A9C) 85%, white);
      }

      .asst-btn.danger{
        background:transparent;
        color:#B4423C;
        border-color:color-mix(in oklab, #B4423C 35%, var(--line, #E7E3D8));
      }
      .asst-btn.danger:hover{
        background:color-mix(in oklab, #B4423C 10%, var(--surface, #fff));
        border-color:#B4423C;
      }

      .asst-btn .ic{ font-size:14px; line-height:1 }
      .asst-btn.ghost{ background:transparent }

      /* Status pill */
      .asst-status{
        padding:10px 12px;
        border-radius:10px;
        font-size:13px;
        margin-top:12px;
        display:none;
        line-height:1.5;
        border:1px solid transparent;
      }
      .asst-status.ok{
        background:color-mix(in oklab, #3E8E41 12%, var(--surface, #fff));
        color:#2E7D32;
        border-color:color-mix(in oklab, #3E8E41 30%, var(--line, #E7E3D8));
        display:block;
      }
      .asst-status.err{
        background:color-mix(in oklab, #B4423C 10%, var(--surface, #fff));
        color:#B4423C;
        border-color:color-mix(in oklab, #B4423C 30%, var(--line, #E7E3D8));
        display:block;
      }

      /* Department list */
      .asst-dept-list{
        border:1px solid var(--line, #E7E3D8);
        border-radius:12px;
        overflow:hidden;
        background:var(--surface, #fff);
      }
      .asst-dept-row{
        display:grid;
        grid-template-columns:44px 1fr auto auto;
        gap:12px;
        align-items:center;
        padding:12px 14px;
        border-bottom:1px solid var(--line-2, #EFEBE0);
        transition: background .15s ease;
      }
      .asst-dept-row:last-child{ border-bottom:none }
      .asst-dept-row:hover{ background:var(--surface-2, #FBFAF6) }
      .asst-dept-row .icon{
        width:36px; height:36px; border-radius:10px;
        display:flex; align-items:center; justify-content:center;
        font-size:18px;
        background:var(--accent-softer, #FBF7E6);
        border:1px solid color-mix(in oklab, var(--accent, #8B6F00) 20%, var(--line, #E7E3D8));
      }
      .asst-dept-row .name{
        font-weight:600;
        color:var(--ink, #111827);
        font-size:14px;
      }
      .asst-dept-row .id{
        font-size:11px;
        color:var(--ink-3, #6B7280);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        margin-top:2px;
      }
      .asst-dept-row .row-btn{
        padding:6px 11px;
        font-size:12px;
        font-weight:500;
        border-radius:8px;
        border:1px solid var(--line, #E7E3D8);
        background:var(--surface, #fff);
        color:var(--ink-2, #374151);
        cursor:pointer;
        transition: background .15s ease, border-color .15s ease, color .15s ease;
      }
      .asst-dept-row .row-btn:hover{
        background:var(--accent-softer, #FBF7E6);
        border-color:color-mix(in oklab, var(--accent, #8B6F00) 40%, var(--line, #E7E3D8));
        color:var(--accent-ink, #5E4B00);
      }
      .asst-dept-row .row-btn.danger{ color:#B4423C }
      .asst-dept-row .row-btn.danger:hover{
        background:color-mix(in oklab, #B4423C 8%, var(--surface, #fff));
        border-color:#B4423C;
        color:#B4423C;
      }

      .asst-empty{
        padding:28px 20px;
        text-align:center;
        color:var(--ink-3, #6B7280);
        font-size:13.5px;
        background:var(--surface-2, #FBFAF6);
      }
      .asst-empty .big{ font-size:28px; display:block; margin-bottom:6px; opacity:.7 }

      /* Preview box */
      .asst-preview-box{
        background:var(--accent-softer, #FBF7E6);
        border:1px dashed color-mix(in oklab, var(--accent, #8B6F00) 35%, var(--line, #E7E3D8));
        color:var(--ink-2, #374151);
        border-radius:12px;
        padding:14px 16px;
        margin-top:12px;
        max-height:220px; overflow:auto;
        font-size:13px; line-height:1.7;
      }
      .asst-preview-box strong{ color:var(--accent-ink, #5E4B00) }
      .asst-preview-box ul{ padding-inline-start:22px; margin:6px 0 }
      .asst-preview-box li{ margin:4px 0 }
      .asst-preview-box em{ color:var(--ink-3, #6B7280) }

      /* Section header inside a pane */
      .asst-section-head{
        display:flex; justify-content:space-between; align-items:center;
        margin-bottom:14px; gap:12px;
      }
      .asst-section-head .lead{
        font-size:13px;
        color:var(--ink-2, #374151);
        line-height:1.55;
        max-width:440px;
      }

      /* Grid for icon + color on dept form */
      .asst-grid-2{
        display:grid;
        grid-template-columns:1fr 120px;
        gap:14px;
      }
      .asst-color{
        width:100%; height:42px;
        padding:3px;
        border:1px solid var(--line, #E7E3D8);
        border-radius:10px;
        background:var(--surface, #fff);
        cursor:pointer;
      }

      /* Footer actions — sticky on tall panes */
      .asst-actions{
        display:flex; gap:8px; justify-content:flex-end;
        margin-top:20px;
        padding-top:14px;
        border-top:1px solid var(--line-2, #EFEBE0);
      }

      /* Toggle switch */
      .asst-toggle{
        display:flex; align-items:flex-start; gap:12px;
        padding:12px 14px;
        border:1px solid var(--line, #E7E3D8);
        border-radius:10px;
        background:var(--surface, #fff);
        cursor:pointer;
        transition: background .15s ease, border-color .15s ease;
      }
      .asst-toggle:hover{ background:var(--surface-2, #FBFAF6); border-color:color-mix(in oklab, var(--accent, #8B6F00) 30%, var(--line, #E7E3D8)); }
      .asst-toggle .tg-sw{
        flex-shrink:0; width:38px; height:22px; border-radius:999px;
        background:var(--line, #E7E3D8); position:relative; transition:background .2s ease;
        margin-top:2px;
      }
      .asst-toggle .tg-sw::after{
        content:""; position:absolute; top:2px; inset-inline-start:2px;
        width:18px; height:18px; border-radius:50%; background:#fff;
        box-shadow:0 1px 3px rgba(0,0,0,.2); transition:transform .2s ease;
      }
      .asst-toggle.on .tg-sw{ background:var(--accent, #8B6F00); }
      .asst-toggle.on .tg-sw::after{ transform:translateX(16px); }
      html[dir="rtl"] .asst-toggle.on .tg-sw::after{ transform:translateX(-16px); }
      .asst-toggle .tg-body{ flex:1; min-width:0 }
      .asst-toggle .tg-title{ font-weight:600; font-size:13.5px; color:var(--ink, #111827); }
      .asst-toggle .tg-desc{ font-size:12px; color:var(--ink-3, #6B7280); margin-top:3px; line-height:1.5 }
      .asst-toggle input{ position:absolute; opacity:0; pointer-events:none }
      .asst-toggle-list{ display:flex; flex-direction:column; gap:8px }

      /* Mobile tweaks */
      @media (max-width:560px){
        .asst-bd{ padding:0 }
        .asst-modal{
          max-height:100vh; height:100vh;
          border-radius:0;
          border:none;
        }
        .asst-grid-2{ grid-template-columns:1fr }
        .asst-dept-row{ grid-template-columns:40px 1fr; grid-auto-flow:row }
        .asst-dept-row .row-btn{ grid-column:2; justify-self:end; margin-top:4px }
      }
    `;
    document.head.appendChild(style);
  }

  /* ------------------------------------------------------------------
     API helpers (unchanged — same endpoints)
     ------------------------------------------------------------------ */
  function showStatus(node, msg, kind){
    node.className = 'asst-status ' + (kind || '');
    node.textContent = msg;
    setTimeout(() => { if (node.textContent === msg) { node.className = 'asst-status'; } }, 4000);
  }

  async function loadUpdatesUrl(){
    try {
      const res = await fetch((window.API_BASE||'') + '/api/updates-url', { credentials: 'include' });
      if (res.ok) { const d = await res.json(); return d.url || ''; }
    } catch(e){}
    return '';
  }
  async function saveUpdatesUrl(url){
    const res = await fetch((window.API_BASE||'') + '/api/updates-url', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'save-failed');
    return true;
  }
  async function loadUpdatesPreview(){
    try {
      const res = await fetch((window.API_BASE||'') + '/api/updates', { credentials: 'include' });
      if (res.ok) return await res.json();
    } catch(e){}
    return null;
  }
  async function loadDepts(){
    try {
      const res = await fetch((window.API_BASE||'') + '/api/custom-depts', { credentials: 'include' });
      if (res.ok) return await res.json();
    } catch(e){}
    return [];
  }
  async function addDept(data){
    const res = await fetch((window.API_BASE||'') + '/api/custom-depts', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'add-failed');
    return (await res.json()).dept;
  }
  async function updateDept(id, data){
    const res = await fetch((window.API_BASE||'') + '/api/custom-depts/' + encodeURIComponent(id), {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'update-failed');
    return true;
  }
  async function deleteDept(id){
    const res = await fetch((window.API_BASE||'') + '/api/custom-depts/' + encodeURIComponent(id), {
      method: 'DELETE', credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json()).error || 'delete-failed');
    return true;
  }
  async function getSlackWebhook(){
    try {
      const res = await fetch((window.API_BASE||'') + '/api/slack-webhook', { credentials: 'include' });
      if (res.ok) return (await res.json()).url || '';
    } catch(e){}
    return '';
  }
  async function saveSlackWebhook(url){
    const res = await fetch((window.API_BASE||'') + '/api/slack-webhook', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'save-failed');
    return true;
  }

  /* --- Feature flags / permissions / templates / imports ---
     Tries Worker /api/platform-config first (if available), falls back to
     localStorage for pure-client persistence. Shape:
     {
       perms:    { viewerCreate:bool, viewerImport:bool, viewerEdit:bool, viewerDelete:bool, viewerDeps:bool },
       template: { codePrefix:string, autoCode:bool, startingNumber:int, requirePurpose:bool, requireSteps:bool, defaultPhase:string },
       imports:  { pdf:bool, docx:bool, gdoc:bool, paste:bool, ai:bool }
     }
  */
  const LS_CFG_KEY = 'arsan_platform_cfg_v1';
  const DEFAULT_CFG = {
    perms: { viewerCreate:true, viewerImport:true, viewerEdit:true, viewerDelete:false, viewerDeps:true },
    template: { codePrefix:'', autoCode:true, startingNumber:1, requirePurpose:false, requireSteps:false, defaultPhase:'' },
    imports: { pdf:true, docx:true, gdoc:true, paste:true, ai:true }
  };
  function mergeCfg(a, b){
    const out = {};
    for (const k of Object.keys(a)) {
      out[k] = (b && typeof b[k]==='object' && b[k]!==null) ? Object.assign({}, a[k], b[k]) : a[k];
    }
    return out;
  }
  async function loadPlatformCfg(){
    try {
      const res = await fetch((window.API_BASE||'') + '/api/platform-config', { credentials:'include' });
      if (res.ok) { const d = await res.json(); return mergeCfg(DEFAULT_CFG, d||{}); }
    } catch(_){}
    try {
      const raw = localStorage.getItem(LS_CFG_KEY);
      if (raw) return mergeCfg(DEFAULT_CFG, JSON.parse(raw));
    } catch(_){}
    return mergeCfg(DEFAULT_CFG, {});
  }
  async function savePlatformCfg(cfg){
    try { localStorage.setItem(LS_CFG_KEY, JSON.stringify(cfg)); } catch(_){}
    try {
      const res = await fetch((window.API_BASE||'') + '/api/platform-config', {
        method:'POST', credentials:'include',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(cfg),
      });
      // If the endpoint isn't implemented yet on Worker, that's fine —
      // localStorage already persisted the change for this browser.
      if (res.ok) return true;
    } catch(_){}
    return true;
  }

  /* ------------------------------------------------------------------
     Rendering helpers
     ------------------------------------------------------------------ */
  function renderDeptList(container, depts, onEdit, onDelete){
    container.innerHTML = '';
    if (!depts.length) {
      container.appendChild(el('div', { class: 'asst-empty' },
        el('span', { class:'big' }, '🏢'),
        'لا توجد إدارات مخصّصة بعد. ابدأ بإضافة واحدة.'
      ));
      return;
    }
    depts.forEach(d => {
      const iconWrap = el('div', { class: 'icon', style: `color:${d.color||'var(--accent)'}` }, d.icon || '📂');
      const row = el('div', { class: 'asst-dept-row' },
        iconWrap,
        el('div', {},
          el('div', { class: 'name' }, d.name),
          el('div', { class: 'id' }, d.id)
        ),
        el('button', { class: 'row-btn', onclick: () => onEdit(d) }, 'تعديل'),
        el('button', { class: 'row-btn danger', onclick: () => onDelete(d) }, 'حذف')
      );
      container.appendChild(row);
    });
  }

  function showDeptForm(existing, onSave){
    const isEdit = !!existing;
    const bd = el('div', { class: 'asst-bd', style: 'z-index:9999' });
    bd.addEventListener('click', (e) => { if (e.target === bd) bd.remove(); });

    const nameIn = el('input', { type: 'text', placeholder: 'مثال: العلاقات العامة', value: existing?.name || '' });
    const idIn = el('input', { type: 'text', placeholder: 'pr', value: existing?.id || '', readonly: isEdit ? 'readonly' : null });

    if (!isEdit) {
      const arToIdMap = [
        [/خدم.*عملاء|عملاء/, 'customers'],
        [/موارد.*بشر|بشر/, 'hr'],
        [/ماليه?|محاسب/, 'finance'],
        [/تقنيه?|معلومات|it\b/i, 'it'],
        [/تسويق/, 'marketing'],
        [/مبيع/, 'sales'],
        [/قانون|شؤون.*قانون/, 'legal'],
        [/عام[هة]?|علاقات/, 'pr'],
        [/مشتريات/, 'procurement'],
        [/تشغيل|عمليات/, 'operations'],
        [/جوده?|ضبط/, 'quality'],
        [/امن|أمن/, 'security'],
        [/تدريب|تطوير/, 'training'],
        [/انتاج|إنتاج/, 'production'],
        [/مستودع|مخزون/, 'warehouse'],
        [/اكاديم|أكاديم/, 'academy'],
      ];
      let userEditedId = false;
      idIn.addEventListener('input', () => { userEditedId = true; });
      nameIn.addEventListener('input', () => {
        if (userEditedId) return;
        const name = nameIn.value.trim();
        if (!name) { idIn.value = ''; return; }
        for (const [re, id] of arToIdMap) {
          if (re.test(name)) { idIn.value = id; return; }
        }
        const ascii = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().split(/\s+/)[0];
        if (ascii) idIn.value = ascii;
      });
    }

    const iconIn = el('input', { type: 'text', placeholder: '📢', value: existing?.icon || '📂', maxlength: '4' });
    const colorIn = el('input', { type: 'color', value: existing?.color || '#8B6F00', class: 'asst-color' });
    const status = el('div', { class: 'asst-status' });

    const saveBtn = el('button', { class: 'asst-btn primary', onclick: async () => {
      const name = nameIn.value.trim();
      const id = idIn.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (!name) { showStatus(status, '❌ الاسم مطلوب', 'err'); return; }
      if (!id) { showStatus(status, '❌ المعرّف مطلوب', 'err'); return; }
      saveBtn.disabled = true;
      saveBtn.textContent = 'جاري الحفظ…';
      try {
        await onSave({ id, name, icon: iconIn.value || '📂', color: colorIn.value });
        bd.remove();
      } catch(e) {
        showStatus(status, '❌ ' + (e.message || 'فشل'), 'err');
        saveBtn.disabled = false;
        saveBtn.textContent = 'حفظ';
      }
    } }, 'حفظ');

    const modal = el('div', { class: 'asst-modal', style: 'max-width:460px' },
      el('div', { class: 'asst-head' },
        el('h2', {}, el('span', { class:'dot' }), isEdit ? 'تعديل إدارة' : 'إضافة إدارة جديدة'),
        el('button', { class: 'asst-close', onclick: () => bd.remove(), 'aria-label':'إغلاق' }, '×')
      ),
      el('div', { class: 'asst-body' },
        el('div', { class: 'asst-pane active' },
          el('div', { class: 'asst-field' },
            el('label', {}, 'اسم الإدارة'),
            nameIn
          ),
          el('div', { class: 'asst-field' },
            el('label', {}, 'المعرّف (id) — بالإنجليزية'),
            idIn,
            el('div', { class: 'asst-hint' }, isEdit ? 'لا يمكن تعديل المعرّف بعد الإنشاء.' : 'حروف إنجليزية صغيرة، أرقام، شرطات فقط. مثال: pr, legal, it')
          ),
          el('div', { class: 'asst-grid-2' },
            el('div', { class: 'asst-field', style:'margin-bottom:0' },
              el('label', {}, 'الأيقونة (إيموجي)'),
              iconIn
            ),
            el('div', { class: 'asst-field', style:'margin-bottom:0' },
              el('label', {}, 'اللون'),
              colorIn
            )
          ),
          status,
          el('div', { class: 'asst-actions' },
            el('button', { class: 'asst-btn', onclick: () => bd.remove() }, 'إلغاء'),
            saveBtn
          )
        )
      )
    );

    bd.appendChild(modal);
    document.body.appendChild(bd);
    nameIn.focus();
  }

  /* ------------------------------------------------------------------
     Main settings modal
     ------------------------------------------------------------------ */
  async function openSettingsModal(){
    injectStyles();
    const existing = $('#asst-modal-bd');
    if (existing) existing.remove();

    const bd = el('div', { class: 'asst-bd', id: 'asst-modal-bd' });
    bd.addEventListener('click', (e) => { if (e.target === bd) bd.remove(); });
    const escHandler = (e) => { if (e.key === 'Escape') { bd.remove(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);

    /* ===== Pane 1: Updates banner ===== */
    const updUrlIn = el('input', { type: 'url', placeholder: 'https://docs.google.com/document/d/XXXX/pub?embedded=true' });
    const updStatus = el('div', { class: 'asst-status' });
    const updPreview = el('div', { class: 'asst-preview-box', style: 'display:none' });

    const updRefreshBtn = el('button', { class: 'asst-btn', onclick: async () => {
      updRefreshBtn.disabled = true;
      updRefreshBtn.innerHTML = '<span class="ic">⏳</span> جاري التحديث…';
      try {
        localStorage.removeItem('arsan_updates_dismissed_at');
        localStorage.removeItem('arsan_updates_last_hash');
        const data = await loadUpdatesPreview();
        if (data && data.items && data.items.length) {
          updPreview.innerHTML = '<strong>معاينة:</strong><ul>' + data.items.map(it => `<li>${esc(it)}</li>`).join('') + '</ul>';
          updPreview.style.display = 'block';
        } else if (data && data.error) {
          showStatus(updStatus, '❌ ' + data.error, 'err');
        } else {
          updPreview.innerHTML = '<em>لا توجد عناصر. تحقّق من الرابط.</em>';
          updPreview.style.display = 'block';
        }
        if (window.ArsanUpdatesBanner) window.ArsanUpdatesBanner.refresh();
      } catch(e){
        showStatus(updStatus, '❌ ' + e.message, 'err');
      } finally {
        updRefreshBtn.disabled = false;
        updRefreshBtn.innerHTML = '<span class="ic">🔄</span> تحديث المعاينة';
      }
    } }, el('span',{class:'ic'},'🔄'), ' تحديث المعاينة');

    const updSaveBtn = el('button', { class: 'asst-btn primary', onclick: async () => {
      updSaveBtn.disabled = true;
      updSaveBtn.textContent = 'جاري الحفظ…';
      try {
        await saveUpdatesUrl(updUrlIn.value.trim());
        showStatus(updStatus, '✓ تم الحفظ. جاري تحديث المعاينة…', 'ok');
        setTimeout(() => updRefreshBtn.click(), 500);
      } catch(e){
        showStatus(updStatus, '❌ ' + e.message, 'err');
      } finally {
        updSaveBtn.disabled = false;
        updSaveBtn.textContent = 'حفظ الرابط';
      }
    } }, 'حفظ الرابط');

    const updRepublishBtn = el('button', { class: 'asst-btn ghost', style:'margin-inline-start:auto', onclick: () => {
      localStorage.removeItem('arsan_updates_dismissed_at');
      localStorage.removeItem('arsan_updates_last_hash');
      if (window.ArsanUpdatesBanner) window.ArsanUpdatesBanner.refresh();
      showStatus(updStatus, '✓ تم إعادة عرض الشريط للجميع عند التحديث', 'ok');
    } }, el('span',{class:'ic'},'🔔'), ' إعادة عرض الشريط');

    const pane1 = el('div', { class: 'asst-pane active', id: 'asst-pane-updates' },
      el('div', { class: 'asst-field' },
        el('label', {}, 'رابط مصدر التحديثات'),
        updUrlIn,
        el('div', { class: 'asst-hint' },
          'الصق رابط Google Doc المنشور على الويب. خطوات: افتح المستند → ملف → مشاركة → ',
          el('strong', {}, 'النشر على الويب'),
          ' → Embed → انسخ URL. يجب أن ينتهي بـ ',
          el('code', {}, 'pub?embedded=true'),
          '. كل عنصر في القائمة (•) سيظهر كتحديث دوري في الشريط العلوي.'
        )
      ),
      el('div', { class: 'asst-row' },
        updSaveBtn,
        updRefreshBtn,
        updRepublishBtn
      ),
      updStatus,
      updPreview
    );

    /* ===== Pane 2: Custom departments ===== */
    const deptList = el('div', { class: 'asst-dept-list' });
    const deptStatus = el('div', { class: 'asst-status' });
    const refreshDepts = async () => {
      const depts = await loadDepts();
      renderDeptList(deptList, depts,
        (d) => showDeptForm(d, async (data) => {
          await updateDept(d.id, { name: data.name, icon: data.icon, color: data.color });
          showStatus(deptStatus, '✓ تم التحديث', 'ok');
          refreshDepts();
        }),
        async (d) => {
          if (!confirm(`حذف إدارة "${d.name}"؟`)) return;
          try {
            await deleteDept(d.id);
            showStatus(deptStatus, '✓ حُذفت', 'ok');
            refreshDepts();
          } catch(e) { showStatus(deptStatus, '❌ ' + e.message, 'err'); }
        }
      );
    };

    const pane2 = el('div', { class: 'asst-pane', id: 'asst-pane-depts' },
      el('div', { class: 'asst-section-head' },
        el('div', { class: 'lead' },
          'إدارات مخصّصة تُضاف فوق الإدارات الافتراضية. ستظهر للجميع بعد الحفظ مباشرة.'
        ),
        el('button', { class: 'asst-btn primary', onclick: () => showDeptForm(null, async (data) => {
          await addDept(data);
          showStatus(deptStatus, '✓ تمت الإضافة', 'ok');
          refreshDepts();
        }) }, el('span',{class:'ic'},'+'), ' إضافة إدارة')
      ),
      deptList,
      deptStatus
    );

    /* ===== Pane 3: Slack webhook ===== */
    const slackIn = el('input', { type: 'url', placeholder: 'https://hooks.slack.com/services/...' });
    const slackStatus = el('div', { class: 'asst-status' });
    const slackSaveBtn = el('button', { class: 'asst-btn primary', onclick: async () => {
      slackSaveBtn.disabled = true;
      slackSaveBtn.textContent = 'جاري الحفظ…';
      try {
        await saveSlackWebhook(slackIn.value.trim());
        showStatus(slackStatus, '✓ تم الحفظ', 'ok');
      } catch(e){ showStatus(slackStatus, '❌ ' + e.message, 'err'); }
      finally {
        slackSaveBtn.disabled = false;
        slackSaveBtn.textContent = 'حفظ';
      }
    } }, 'حفظ');

    const pane3 = el('div', { class: 'asst-pane', id: 'asst-pane-slack' },
      el('div', { class: 'asst-field' },
        el('label', {}, 'Slack Webhook (قناة عامة للإشعارات)'),
        slackIn,
        el('div', { class: 'asst-hint' },
          'يُستخدم كـ fallback إذا لم يكن المستخدم في Slack workspace. لـ DM مباشر، يحتاج Worker متغيّر ',
          el('code', {}, 'SLACK_BOT_TOKEN'),
          ' كـ Secret.'
        )
      ),
      el('div', { class: 'asst-row' }, slackSaveBtn),
      slackStatus
    );

    /* ===== Helpers for permissions/templates/imports panes ===== */
    let cfgCache = null;
    async function getCfg(){ if (!cfgCache) cfgCache = await loadPlatformCfg(); return cfgCache; }

    function makeToggle(title, desc, checked, onChange){
      const tg = el('label', { class: 'asst-toggle' + (checked ? ' on' : '') },
        el('div', { class:'tg-sw' }),
        el('div', { class:'tg-body' },
          el('div', { class:'tg-title' }, title),
          el('div', { class:'tg-desc' }, desc)
        )
      );
      tg.addEventListener('click', (e) => {
        e.preventDefault();
        const next = !tg.classList.contains('on');
        tg.classList.toggle('on', next);
        onChange(next);
      });
      return tg;
    }

    /* ===== Pane 4: Permissions ===== */
    const permStatus = el('div', { class:'asst-status' });
    const permList = el('div', { class:'asst-toggle-list' });
    async function buildPermsPane(){
      const cfg = await getCfg();
      permList.innerHTML = '';
      const items = [
        ['viewerCreate','السماح بإنشاء إجراءات','أي مستخدم مسجّل (viewer) يستطيع إضافة إجراء جديد.'],
        ['viewerImport','السماح باستيراد الإجراءات','رفع PDF / DOCX / رابط Google Doc / لصق نص.'],
        ['viewerEdit','السماح بالتعديل Inline','النقر المباشر على الحقول لتعديلها.'],
        ['viewerDelete','السماح بالحذف','حذف الإجراءات من اللوحة (يُنصح بإبقائه للأدمن فقط).'],
        ['viewerDeps','السماح بتعديل التبعيّات','إضافة وإزالة العلاقات بين الإجراءات.'],
      ];
      items.forEach(([k, t, d]) => {
        permList.appendChild(makeToggle(t, d, !!cfg.perms[k], async (v) => {
          cfg.perms[k] = v;
          await savePlatformCfg(cfg);
          window.dispatchEvent(new CustomEvent('arsan:platform-cfg-changed', { detail: cfg }));
          showStatus(permStatus, '✓ تم التحديث', 'ok');
        }));
      });
    }
    const pane4 = el('div', { class:'asst-pane', id:'asst-pane-perms' },
      el('div', { class:'asst-section-head' },
        el('div', { class:'lead' },
          'تحكّم في ما يستطيع المستخدمون المسجّلون فعله. الأدمن يملك كل الصلاحيات دائماً.'
        )
      ),
      permList,
      permStatus
    );

    /* ===== Pane 5: Templates ===== */
    const tplStatus = el('div', { class:'asst-status' });
    const tplPrefixIn = el('input', { type:'text', placeholder:'مثال: PR', maxlength:'6', style:'text-transform:uppercase;max-width:160px' });
    const tplStartIn = el('input', { type:'number', min:'1', max:'9999', style:'max-width:120px' });
    const tplPhaseIn = el('input', { type:'text', placeholder:'اختياري — مرحلة افتراضية' });
    const tplAutoCode = el('div');
    const tplReqPurpose = el('div');
    const tplReqSteps = el('div');

    async function buildTplPane(){
      const cfg = await getCfg();
      tplPrefixIn.value = cfg.template.codePrefix || '';
      tplStartIn.value = cfg.template.startingNumber || 1;
      tplPhaseIn.value = cfg.template.defaultPhase || '';
      tplAutoCode.innerHTML = '';
      tplReqPurpose.innerHTML = '';
      tplReqSteps.innerHTML = '';
      tplAutoCode.appendChild(makeToggle(
        'توليد الكود تلقائياً', 'استخدام البادئة والرقم التالي عند إنشاء إجراء جديد.',
        !!cfg.template.autoCode, async (v) => { cfg.template.autoCode = v; await savePlatformCfg(cfg); showStatus(tplStatus,'✓ تم التحديث','ok'); }
      ));
      tplReqPurpose.appendChild(makeToggle(
        'الغرض مطلوب', 'يجب تعبئة حقل الغرض قبل حفظ إجراء جديد.',
        !!cfg.template.requirePurpose, async (v) => { cfg.template.requirePurpose = v; await savePlatformCfg(cfg); showStatus(tplStatus,'✓ تم التحديث','ok'); }
      ));
      tplReqSteps.appendChild(makeToggle(
        'الخطوات مطلوبة', 'يجب إدخال خطوة واحدة على الأقل.',
        !!cfg.template.requireSteps, async (v) => { cfg.template.requireSteps = v; await savePlatformCfg(cfg); showStatus(tplStatus,'✓ تم التحديث','ok'); }
      ));
    }
    const tplSaveBtn = el('button', { class:'asst-btn primary', onclick: async () => {
      tplSaveBtn.disabled = true; tplSaveBtn.textContent = 'جاري الحفظ…';
      try {
        const cfg = await getCfg();
        cfg.template.codePrefix = tplPrefixIn.value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
        cfg.template.startingNumber = Math.max(1, parseInt(tplStartIn.value,10) || 1);
        cfg.template.defaultPhase = tplPhaseIn.value.trim();
        await savePlatformCfg(cfg);
        showStatus(tplStatus, '✓ تم الحفظ', 'ok');
      } catch(e){ showStatus(tplStatus, '❌ ' + e.message, 'err'); }
      finally { tplSaveBtn.disabled = false; tplSaveBtn.textContent = 'حفظ'; }
    } }, 'حفظ');

    const pane5 = el('div', { class:'asst-pane', id:'asst-pane-template' },
      el('div', { class:'asst-section-head' },
        el('div', { class:'lead' }, 'الإعدادات الافتراضية عند إنشاء إجراء جديد.')
      ),
      el('div', { class:'asst-grid-2' },
        el('div', { class:'asst-field', style:'margin-bottom:0' },
          el('label', {}, 'بادئة الكود الافتراضية'),
          tplPrefixIn,
          el('div', { class:'asst-hint' }, 'مثال: ', el('code',{},'PR'), ' → ينتج PR-01, PR-02…')
        ),
        el('div', { class:'asst-field', style:'margin-bottom:0' },
          el('label', {}, 'الرقم الابتدائي'),
          tplStartIn
        )
      ),
      el('div', { class:'asst-field' },
        el('label', {}, 'المرحلة الافتراضية (اختياري)'),
        tplPhaseIn,
        el('div', { class:'asst-hint' }, 'سيتم اختيارها تلقائياً في نموذج "إجراء جديد".')
      ),
      el('div', { class:'asst-toggle-list' }, tplAutoCode, tplReqPurpose, tplReqSteps),
      el('div', { class:'asst-row', style:'margin-top:14px' }, tplSaveBtn),
      tplStatus
    );

    /* ===== Pane 6: Import sources ===== */
    const impStatus = el('div', { class:'asst-status' });
    const impList = el('div', { class:'asst-toggle-list' });
    async function buildImpPane(){
      const cfg = await getCfg();
      impList.innerHTML = '';
      const items = [
        ['pdf','ملفات PDF','يتطلب تحميل مكتبة pdf.js من cdnjs عند أول استخدام.'],
        ['docx','ملفات Word (DOCX)','يستخدم mammoth.js لاستخراج النص.'],
        ['gdoc','رابط Google Doc','يستورد مباشرة من رابط منشور.'],
        ['paste','لصق نص مباشرة','للإجراءات السريعة من أي مصدر.'],
        ['ai','تحليل بالذكاء الاصطناعي','يستخرج الخطوات والـ KPIs تلقائياً. (يحتاج Worker)'],
      ];
      items.forEach(([k, t, d]) => {
        impList.appendChild(makeToggle(t, d, !!cfg.imports[k], async (v) => {
          cfg.imports[k] = v;
          await savePlatformCfg(cfg);
          window.dispatchEvent(new CustomEvent('arsan:platform-cfg-changed', { detail: cfg }));
          showStatus(impStatus, '✓ تم التحديث', 'ok');
        }));
      });
    }
    const pane6 = el('div', { class:'asst-pane', id:'asst-pane-imports' },
      el('div', { class:'asst-section-head' },
        el('div', { class:'lead' }, 'تفعيل وتعطيل مصادر استيراد الإجراءات التي تظهر في نافذة الاستيراد.')
      ),
      impList,
      impStatus
    );

    /* ===== Pane 7: Onboarding tour ===== */
    const tourStartBtn = el('button', {
      class: 'asst-btn asst-btn-primary',
      onclick: () => {
        if (window.ArsanTour && window.ArsanTour.start) {
          // close settings modal first
          const bdEl = document.querySelector('.asst-bd');
          if (bdEl) bdEl.remove();
          setTimeout(() => window.ArsanTour.start(), 200);
        } else {
          alert('الجولة غير محمّلة. حدّث الصفحة وأعد المحاولة.');
        }
      }
    }, '▶ بدء الجولة الآن');

    const tourResetBtn = el('button', {
      class: 'asst-btn',
      style: 'margin-inline-start:8px;',
      onclick: () => {
        if (window.ArsanTour && window.ArsanTour.reset) window.ArsanTour.reset();
        try { localStorage.removeItem('arsan_tour_seen_v1'); } catch(_){}
        const s = document.getElementById('asst-tour-status');
        if (s) { s.textContent = '✓ تمت إعادة التعيين — الجولة ستظهر تلقائياً للمستخدمين الجدد.'; s.style.color = '#2a8c3a'; }
      }
    }, '↻ إعادة تعيين (إظهارها للجميع)');

    const pane7 = el('div', { class:'asst-pane', id:'asst-pane-tour' },
      el('div', { class:'asst-section-head' },
        el('div', { class:'lead' },
          el('strong', {}, '🎓 الجولة التعريفية — '),
          'جولة سريعة (~٢ دقيقة) تعرّف المستخدم على ميزات المنصّة الأساسية مع الأدهم.'
        )
      ),
      el('div', { style:'background:var(--surface-soft,#faf9f6); border:1px solid var(--border,rgba(0,0,0,.08)); border-radius:14px; padding:18px 20px; margin-bottom:18px;' },
        el('div', { style:'display:flex; align-items:center; gap:14px; margin-bottom:14px;' },
          el('div', { style:'width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,#3D5A80,#293F5C); display:flex; align-items:center; justify-content:center; padding:8px; box-sizing:border-box; flex-shrink:0;' },
            el('img', { src:'./adham.png', alt:'', style:'width:100%; height:100%; object-fit:contain; filter:invert(1) brightness(2);' })
          ),
          el('div', {},
            el('div', { style:'font-weight:700; font-size:15px; margin-bottom:2px;' }, 'الأدهم سيرشد المستخدم'),
            el('div', { style:'font-size:13px; color:var(--ink-2,#555); line-height:1.6;' }, '12 خطوة • spotlight + شرح • شريط تقدم • إمكانية التخطي')
          )
        ),
        el('ul', { style:'color:var(--ink-2,#555); font-size:13px; line-height:1.9; margin:0; padding-inline-start:20px;' },
          el('li', {}, 'تظهر تلقائياً للمستخدم الجديد أول مرة فقط'),
          el('li', {}, 'تتضمّن: رأس الصفحة، البحث، الإدارات، الإجراءات، الخريطة الشاملة، الأدهم، ذاكرته، الثيمات…'),
          el('li', {}, 'متاحة بالعربية والإنجليزية حسب اللغة الحالية'),
          el('li', {}, 'المستخدم يقدر يتخطّاها (مع تأكيد) ويرجع لها لاحقاً')
        )
      ),
      el('div', {}, tourStartBtn, tourResetBtn),
      el('div', { id:'asst-tour-status', style:'margin-top:10px; min-height:20px; font-size:13px;' }),
      el('div', { style: 'margin-top:24px; padding:14px 16px; background:rgba(61,90,128,.08); border-radius:12px; border:1px solid rgba(61,90,128,.18);' },
        el('div', { style:'font-weight:700; margin-bottom:8px; color:#3D5A80;' }, '💡 ملاحظة'),
        el('div', { style:'color:var(--ink-2,#555); font-size:13px; line-height:1.8;' },
          'لتغذية الأدهم بمعلومات شركتك (السياسات، المصطلحات، إلخ)، افتح نافذة الأدهم من الزر الطافي ثم اضغط ⚙ في رأسها.'
        )
      )
    );

    /* ===== Tabs ===== */
    const tabs = el('div', { class: 'asst-tabs', role:'tablist' },
      el('button', { class: 'asst-tab active', 'data-tab': 'updates', role:'tab', onclick: (e) => switchTab(e, 'updates') },
        el('span',{class:'ic'},'📣'), ' شريط التحديثات'),
      el('button', { class: 'asst-tab', 'data-tab': 'depts', role:'tab', onclick: (e) => switchTab(e, 'depts') },
        el('span',{class:'ic'},'🏢'), ' الإدارات'),
      el('button', { class: 'asst-tab', 'data-tab': 'tour', role:'tab', onclick: (e) => switchTab(e, 'tour') },
        el('span',{class:'ic'},'🎓'), ' الجولة التعريفية'),
      el('button', { class: 'asst-tab', 'data-tab': 'perms', role:'tab', onclick: (e) => switchTab(e, 'perms') },
        el('span',{class:'ic'},'🔐'), ' الصلاحيات'),
      el('button', { class: 'asst-tab', 'data-tab': 'template', role:'tab', onclick: (e) => switchTab(e, 'template') },
        el('span',{class:'ic'},'📋'), ' قوالب الإجراءات'),
      el('button', { class: 'asst-tab', 'data-tab': 'imports', role:'tab', onclick: (e) => switchTab(e, 'imports') },
        el('span',{class:'ic'},'📥'), ' مصادر الاستيراد'),
      el('button', { class: 'asst-tab', 'data-tab': 'slack', role:'tab', onclick: (e) => switchTab(e, 'slack') },
        el('span',{class:'ic'},'🔔'), ' Slack')
    );

    function switchTab(evt, name){
      $$('.asst-tab', modal).forEach(b => b.classList.toggle('active', b.dataset.tab === name));
      $$('.asst-pane', modal).forEach(p => p.classList.toggle('active', p.id === 'asst-pane-' + name));
      if (name === 'depts') refreshDepts();
      if (name === 'slack' && !slackIn.value) getSlackWebhook().then(v => slackIn.value = v);
      if (name === 'perms') buildPermsPane();
      if (name === 'template') buildTplPane();
      if (name === 'imports') buildImpPane();
    }

    const modal = el('div', { class: 'asst-modal', role:'dialog', 'aria-modal':'true', 'aria-label':'إعدادات النظام' },
      el('div', { class: 'asst-head' },
        el('h2', {}, el('span', { class:'dot' }), 'إعدادات النظام'),
        el('button', { class: 'asst-close', onclick: () => bd.remove(), 'aria-label':'إغلاق' }, '×')
      ),
      tabs,
      el('div', { class: 'asst-body' }, pane1, pane2, pane7, pane4, pane5, pane6, pane3)
    );

    bd.appendChild(modal);
    document.body.appendChild(bd);

    // Load initial values
    updUrlIn.value = await loadUpdatesUrl();
    if (updUrlIn.value) {
      updRefreshBtn.click();
    }
  }

  /* ------------------------------------------------------------------
     Wire up
     ------------------------------------------------------------------ */
  function wire(){
    const btn = document.getElementById('btn-settings');
    if (btn) btn.addEventListener('click', openSettingsModal);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  window.openArsanSettings = openSettingsModal;

  /* Expose helper so other scripts (dashboard/quick-actions) can read flags */
  window.ArsanPlatformCfg = {
    async get(){ return await loadPlatformCfg(); },
    DEFAULT: DEFAULT_CFG,
  };
})();

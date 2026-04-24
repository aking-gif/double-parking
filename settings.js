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
      html[data-theme="dark"] .asst-tab.active{ color:var(--accent, #D4B24A) }

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
        background:var(--accent, #D4B24A); color:#111; border-color:var(--accent, #D4B24A);
      }
      html[data-theme="dark"] .asst-btn.primary:hover{
        background:color-mix(in oklab, var(--accent, #D4B24A) 85%, white);
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

    /* ===== Tabs ===== */
    const tabs = el('div', { class: 'asst-tabs', role:'tablist' },
      el('button', { class: 'asst-tab active', 'data-tab': 'updates', role:'tab', onclick: (e) => switchTab(e, 'updates') },
        el('span',{class:'ic'},'📣'), ' شريط التحديثات'),
      el('button', { class: 'asst-tab', 'data-tab': 'depts', role:'tab', onclick: (e) => switchTab(e, 'depts') },
        el('span',{class:'ic'},'🏢'), ' الإدارات المخصّصة'),
      el('button', { class: 'asst-tab', 'data-tab': 'slack', role:'tab', onclick: (e) => switchTab(e, 'slack') },
        el('span',{class:'ic'},'🔔'), ' Slack')
    );

    function switchTab(evt, name){
      $$('.asst-tab', modal).forEach(b => b.classList.toggle('active', b.dataset.tab === name));
      $$('.asst-pane', modal).forEach(p => p.classList.toggle('active', p.id === 'asst-pane-' + name));
      if (name === 'depts') refreshDepts();
      if (name === 'slack' && !slackIn.value) getSlackWebhook().then(v => slackIn.value = v);
    }

    const modal = el('div', { class: 'asst-modal', role:'dialog', 'aria-modal':'true', 'aria-label':'إعدادات النظام' },
      el('div', { class: 'asst-head' },
        el('h2', {}, el('span', { class:'dot' }), 'إعدادات النظام'),
        el('button', { class: 'asst-close', onclick: () => bd.remove(), 'aria-label':'إغلاق' }, '×')
      ),
      tabs,
      el('div', { class: 'asst-body' }, pane1, pane2, pane3)
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
})();

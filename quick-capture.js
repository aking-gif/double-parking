/* =================================================================
   Quick Capture (⌘N / Ctrl+N) — Universal Inbox for Arsann OS
   Captures: Task | Decision | Note | Idea | Meeting | Risk
   Storage:  POST /api/kv/inbox_v1 (append) + auto-route to module
   ================================================================= */
(function(){
  if (window.__quickCaptureLoaded) return;
  window.__quickCaptureLoaded = true;

  const API = window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const TOK_KEYS = ['arsan_token_v1','arsan_token'];
  const getTok = () => { for (const k of TOK_KEYS){ const v = localStorage.getItem(k); if (v) return v; } return ''; };

  // ===== Styles =====
  const css = `
  .qc-trigger{
    position: fixed; bottom: 24px; left: 24px; z-index: 9998;
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(232,168,96,.95), rgba(201,143,71,.95));
    box-shadow: 0 8px 24px rgba(232,168,96,.35), 0 0 0 1px rgba(255,255,255,.1) inset;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: none; color: #1a1410;
    transition: all .2s ease; backdrop-filter: blur(20px);
  }
  .qc-trigger:hover{ transform: translateY(-2px) scale(1.05); box-shadow: 0 12px 32px rgba(232,168,96,.5) }
  .qc-trigger svg{ width: 22px; height: 22px; stroke-width: 2.2 }
  .qc-trigger .kbd-hint{
    position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%);
    font-size: 9px; font-family: 'IBM Plex Mono',monospace; color: rgba(255,255,255,.6);
    letter-spacing: 1px; opacity: 0; transition: opacity .2s;
    background: rgba(0,0,0,.7); padding: 3px 8px; border-radius: 4px; white-space: nowrap;
  }
  .qc-trigger:hover .kbd-hint{ opacity: 1 }

  .qc-overlay{
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(8,10,14,.6); backdrop-filter: blur(12px);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 12vh; opacity: 0; pointer-events: none;
    transition: opacity .2s ease;
    font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif;
  }
  .qc-overlay.open{ opacity: 1; pointer-events: auto }
  .qc-modal{
    width: 92%; max-width: 580px;
    background: rgba(20,22,28,.85); backdrop-filter: blur(40px) saturate(140%);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 18px;
    box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.05) inset;
    overflow: hidden;
    transform: translateY(-8px) scale(.98); transition: transform .25s cubic-bezier(.2,.9,.3,1.4);
  }
  .qc-overlay.open .qc-modal{ transform: translateY(0) scale(1) }

  .qc-types{
    display: flex; gap: 4px; padding: 14px 16px 0; flex-wrap: wrap;
  }
  .qc-type{
    padding: 6px 12px; border-radius: 8px; font-size: 12px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
    color: rgba(255,255,255,.7); cursor: pointer; transition: all .15s;
    display: inline-flex; align-items: center; gap: 6px;
    font-family: inherit;
  }
  .qc-type:hover{ background: rgba(255,255,255,.08); color: #fff }
  .qc-type.active{
    background: rgba(232,168,96,.18); border-color: rgba(232,168,96,.4);
    color: #E8A860;
  }
  .qc-type svg{ width: 14px; height: 14px; stroke-width: 1.8 }

  .qc-body{ padding: 14px 16px 6px }
  .qc-title{
    width: 100%; background: transparent; border: none; outline: none;
    color: #fff; font-size: 22px; font-weight: 500; padding: 4px 0;
    font-family: inherit;
  }
  .qc-title::placeholder{ color: rgba(255,255,255,.3) }
  .qc-desc{
    width: 100%; background: transparent; border: none; outline: none;
    color: rgba(255,255,255,.85); font-size: 14px; padding: 8px 0;
    font-family: inherit; resize: none; min-height: 60px;
  }
  .qc-desc::placeholder{ color: rgba(255,255,255,.3) }

  .qc-meta{
    display: flex; gap: 8px; padding: 10px 16px; flex-wrap: wrap;
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .qc-chip{
    padding: 5px 10px; border-radius: 6px; font-size: 11.5px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
    color: rgba(255,255,255,.7); cursor: pointer; transition: all .15s;
    font-family: 'IBM Plex Mono', monospace; letter-spacing: .3px;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .qc-chip:hover{ background: rgba(255,255,255,.08); color: #fff }
  .qc-chip.set{ background: rgba(96,160,232,.15); border-color: rgba(96,160,232,.35); color: #87C0FF }

  .qc-foot{
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 16px;
    background: rgba(0,0,0,.25);
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .qc-hints{ font-size: 11px; color: rgba(255,255,255,.4); font-family: 'IBM Plex Mono', monospace }
  .qc-hints kbd{
    background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 3px;
    border: 1px solid rgba(255,255,255,.12); font-size: 10px; margin: 0 2px;
  }
  .qc-save{
    background: linear-gradient(135deg, #E8A860, #C98F47);
    color: #1a1410; font-weight: 600; font-size: 13px;
    border: none; padding: 8px 18px; border-radius: 8px;
    cursor: pointer; transition: all .15s;
    font-family: inherit;
  }
  .qc-save:hover{ transform: translateY(-1px); box-shadow: 0 4px 12px rgba(232,168,96,.4) }
  .qc-save:disabled{ opacity: .5; cursor: not-allowed; transform: none; box-shadow: none }

  .qc-toast{
    position: fixed; bottom: 90px; left: 24px; z-index: 10000;
    background: rgba(20,40,30,.92); backdrop-filter: blur(20px);
    color: #87E0A8; border: 1px solid rgba(135,224,168,.3);
    padding: 10px 16px; border-radius: 10px; font-size: 13px;
    font-family: 'IBM Plex Sans Arabic', sans-serif;
    transform: translateY(20px); opacity: 0; transition: all .25s;
    pointer-events: none;
  }
  .qc-toast.show{ transform: translateY(0); opacity: 1 }

  [dir="rtl"] .qc-trigger{ left: auto; right: 24px }
  [dir="rtl"] .qc-toast{ left: auto; right: 24px }
  `;

  // ===== Type definitions =====
  const TYPES = [
    { id:'task',     name:'مهمّة',     icon:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', module:'tasks' },
    { id:'note',     name:'ملاحظة',    icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', module:'notes' },
    { id:'idea',     name:'فكرة',      icon:'<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.9.7 1.5 1.7 1.5 2.8V18h5v-.5c0-1.1.6-2.1 1.5-2.8A7 7 0 0 0 12 2z"/>', module:'inbox' },
    { id:'decision', name:'قرار',      icon:'<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>', module:'decisions' },
    { id:'meeting',  name:'اجتماع',    icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>', module:'meetings' },
    { id:'risk',     name:'مخاطرة',    icon:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', module:'risks' },
  ];

  // ===== State =====
  let activeType = 'task';
  let priority = null;
  let dueDate = null;

  // ===== Build DOM =====
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Floating + button removed — Quick Capture now opens via:
  //   1) ⌘N / Ctrl+N keyboard shortcut
  //   2) Search bar "+" button (injected below if a search input is found)
  //   3) window.QuickCapture.open() programmatic API
  const trigger = { addEventListener: () => {} }; // no-op stub for legacy code below

  // Try to inject a "+" button INSIDE the topbar search field
  function injectIntoSearch(){
    const searches = document.querySelectorAll('input[type="search"], input[placeholder*="بحث" i], input[placeholder*="search" i], #globalSearch, .search-input, [class*="search" i] input');
    for (const inp of searches){
      if (!inp || inp.dataset.qcInjected) continue;
      const parent = inp.parentElement;
      if (!parent) continue;
      const cs = getComputedStyle(parent);
      if (cs.position === 'static') parent.style.position = 'relative';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = 'التقاط سريع (⌘N)';
      btn.setAttribute('aria-label', 'Quick Capture');
      const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';
      btn.style.cssText = `
        position: absolute; top: 50%; ${isRTL?'left':'right'}: 8px;
        transform: translateY(-50%); width: 24px; height: 24px;
        border-radius: 6px; border: 1px solid rgba(255,255,255,.12);
        background: rgba(232,168,96,.15); color: #E8A860;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; z-index: 5; transition: all .15s;
        padding: 0;
      `;
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(232,168,96,.3)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(232,168,96,.15)'; });
      btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); open(); });
      parent.appendChild(btn);
      // Add padding to input so text doesn't overlap
      inp.style[isRTL?'paddingLeft':'paddingRight'] = '38px';
      inp.dataset.qcInjected = '1';
    }
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(injectIntoSearch, 200));
  } else {
    setTimeout(injectIntoSearch, 200);
  }

  const overlay = document.createElement('div');
  overlay.className = 'qc-overlay';
  overlay.innerHTML = `
    <div class="qc-modal">
      <div class="qc-types" id="qcTypes">
        ${TYPES.map(t => `
          <button class="qc-type ${t.id===activeType?'active':''}" data-type="${t.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${t.icon}</svg>
            ${t.name}
          </button>
        `).join('')}
      </div>
      <div class="qc-body">
        <input class="qc-title" id="qcTitle" placeholder="عنوان مختصر…" autocomplete="off"/>
        <textarea class="qc-desc" id="qcDesc" placeholder="تفاصيل (اختياري) — استخدم @ لتعيين شخص، # لإدارة، ! للأولوية"></textarea>
      </div>
      <div class="qc-meta">
        <button class="qc-chip" id="qcPriority">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          الأولوية
        </button>
        <button class="qc-chip" id="qcDate">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          الموعد
        </button>
        <button class="qc-chip" id="qcAssign">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          مُعيّن إلى
        </button>
      </div>
      <div class="qc-foot">
        <div class="qc-hints"><kbd>↵</kbd> حفظ <kbd>Esc</kbd> إلغاء <kbd>⌘↵</kbd> حفظ + جديد</div>
        <button class="qc-save" id="qcSave">حفظ</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const $ = (id) => document.getElementById(id);
  const titleEl = $('qcTitle');
  const descEl = $('qcDesc');
  const saveBtn = $('qcSave');

  // ===== Open / Close =====
  function open(presetType){
    if (presetType) {
      activeType = presetType;
      $('qcTypes').querySelectorAll('.qc-type').forEach(b => b.classList.toggle('active', b.dataset.type === activeType));
    }
    overlay.classList.add('open');
    setTimeout(() => titleEl.focus(), 50);
  }
  function close(){
    overlay.classList.remove('open');
    titleEl.value = ''; descEl.value = '';
    priority = null; dueDate = null;
    $('qcPriority').classList.remove('set');
    $('qcDate').classList.remove('set');
  }

  trigger.addEventListener('click', () => open());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // ===== Type switch =====
  $('qcTypes').addEventListener('click', (e) => {
    const btn = e.target.closest('.qc-type');
    if (!btn) return;
    activeType = btn.dataset.type;
    $('qcTypes').querySelectorAll('.qc-type').forEach(b => b.classList.toggle('active', b === btn));
    titleEl.focus();
  });

  // ===== Meta chips =====
  $('qcPriority').addEventListener('click', () => {
    const opts = ['low','normal','high','urgent'];
    const labels = { low:'منخفضة', normal:'عادية', high:'عالية', urgent:'عاجلة' };
    const cur = opts.indexOf(priority);
    priority = opts[(cur + 1) % opts.length];
    const btn = $('qcPriority');
    btn.classList.add('set');
    btn.lastChild.nodeValue = ' ' + labels[priority];
  });
  $('qcDate').addEventListener('click', () => {
    const v = prompt('تاريخ الاستحقاق (YYYY-MM-DD أو "غدا"، "الأسبوع القادم"):', dueDate || '');
    if (v === null) return;
    if (!v){ dueDate = null; $('qcDate').classList.remove('set'); $('qcDate').lastChild.nodeValue = ' الموعد'; return; }
    let d = v;
    const t = v.trim().toLowerCase();
    if (t === 'غدا' || t === 'tomorrow'){ const x = new Date(); x.setDate(x.getDate()+1); d = x.toISOString().slice(0,10); }
    else if (t.includes('اسبوع') || t.includes('week')){ const x = new Date(); x.setDate(x.getDate()+7); d = x.toISOString().slice(0,10); }
    dueDate = d;
    $('qcDate').classList.add('set');
    $('qcDate').lastChild.nodeValue = ' ' + d;
  });
  $('qcAssign').addEventListener('click', () => {
    const v = prompt('إيميل المُعيّن:', '');
    if (!v) return;
    $('qcAssign').classList.add('set');
    $('qcAssign').lastChild.nodeValue = ' ' + v.split('@')[0];
    $('qcAssign').dataset.email = v;
  });

  // ===== Save =====
  async function save(keepOpen){
    const title = titleEl.value.trim();
    if (!title){ titleEl.focus(); return; }
    saveBtn.disabled = true;

    const type = TYPES.find(t => t.id === activeType);
    const item = {
      id: 'qc_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
      type: activeType,
      title,
      description: descEl.value.trim(),
      priority: priority || 'normal',
      dueDate,
      assignee: $('qcAssign').dataset.email || null,
      sourceUrl: location.pathname,
      createdAt: Date.now(),
    };

    try {
      // Append to inbox
      const tok = getTok();
      const headers = { 'Content-Type': 'application/json' };
      if (tok) headers['Authorization'] = 'Bearer ' + tok;

      // Get existing inbox
      const r = await fetch(API + '/api/kv/inbox_v1', { headers }).catch(() => null);
      let inbox = [];
      if (r && r.ok){ try { inbox = await r.json(); if (!Array.isArray(inbox)) inbox = []; } catch{} }
      inbox.unshift(item);
      // Save back (cap at 500)
      await fetch(API + '/api/kv/inbox_v1', {
        method: 'PUT', headers, body: JSON.stringify(inbox.slice(0, 500)),
      });

      // Auto-route to module endpoint when it's a known type
      if (activeType === 'task'){
        await fetch(API + '/api/tasks', {
          method: 'POST', headers,
          body: JSON.stringify({
            title, description: item.description,
            priority: item.priority, dueDate: item.dueDate,
            assignee: item.assignee, status: 'todo', source: 'quick-capture',
          }),
        }).catch(() => {});
      }

      toast(`تم حفظ ${type.name}`);
      if (keepOpen){ titleEl.value = ''; descEl.value = ''; titleEl.focus(); }
      else close();
    } catch (e) {
      toast('فشل الحفظ — حاول مجدداً', true);
    } finally {
      saveBtn.disabled = false;
    }
  }
  saveBtn.addEventListener('click', () => save(false));

  // ===== Keyboard =====
  document.addEventListener('keydown', (e) => {
    const meta = e.metaKey || e.ctrlKey;
    // ⌘N — open (but don't override browser's "new window" without modal context)
    if (meta && e.key.toLowerCase() === 'n' && !overlay.classList.contains('open')){
      // Only intercept if we're inside an Arsann page (has trigger visible)
      e.preventDefault();
      open();
      return;
    }
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape'){ e.preventDefault(); close(); }
    if (e.key === 'Enter' && (meta)){ e.preventDefault(); save(true); }
    else if (e.key === 'Enter' && !e.shiftKey && document.activeElement === titleEl){
      e.preventDefault(); save(false);
    }
  });

  // ===== Toast =====
  let toastEl;
  function toast(msg, isError){
    if (!toastEl){
      toastEl = document.createElement('div');
      toastEl.className = 'qc-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = (isError ? '⚠️ ' : '✓ ') + msg;
    toastEl.style.background = isError ? 'rgba(60,20,20,.92)' : 'rgba(20,40,30,.92)';
    toastEl.style.color = isError ? '#FF8888' : '#87E0A8';
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // ===== Public API =====
  window.QuickCapture = { open, close };
})();

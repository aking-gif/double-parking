/* ============================================================
   Governance Layer (v1) — Lifecycle + Approval Chains + Ownership
   يعتمد على: window.ArsanAPI, window.SOPS, window.CURRENT_DEPT_ID,
              window.DEPARTMENTS_CONFIG, renderGrid, renderChips
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } };
  const isAdmin = () => { const u = me(); return u && u.role === 'admin'; };
  const isEditor = () => { const u = me(); return u && (u.role === 'admin' || u.role === 'editor' || (u.email||'').toLowerCase().endsWith('@arsann.com')); };

  const STATES = ['draft','review','approved','active','deprecated'];
  const STATE_LABELS = {
    ar: { draft:'مسودّة', review:'قيد المراجعة', approved:'معتمَد', active:'مُفعَّل', deprecated:'متقادم' },
    en: { draft:'Draft', review:'In Review', approved:'Approved', active:'Active', deprecated:'Deprecated' }
  };
  const STATE_COLORS = {
    draft:      { bg:'#e9ecef', fg:'#495057', dot:'#868e96' },
    review:     { bg:'#fff3bf', fg:'#8a6d00', dot:'#f59f00' },
    approved:   { bg:'#d3f9d8', fg:'#2b7a3a', dot:'#37b24d' },
    active:     { bg:'#0F1B2D', fg:'#ffffff', dot:'#37b24d' },
    deprecated: { bg:'#ffe3e3', fg:'#a61e1e', dot:'#e03131' }
  };
  function lang(){ return (typeof window.CURRENT_LANG!=='undefined' ? window.CURRENT_LANG : (localStorage.getItem('arsan_lang')||'ar')); }
  function stateLabel(s){ return (STATE_LABELS[lang()]||STATE_LABELS.ar)[s] || s; }

  async function api(path, opts){
    opts = opts || {};
    const r = await fetch(API_BASE + path, {
      method: opts.method || 'GET',
      headers: Object.assign({ 'Content-Type':'application/json', 'Authorization':'Bearer '+tok() }, opts.headers||{}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!r.ok) throw new Error((await r.text()) || ('HTTP '+r.status));
    return r.json();
  }
  function toast(msg, kind){
    const el = document.createElement('div');
    el.textContent = msg;
    const bg = kind==='err' ? '#c92a2a' : kind==='warn' ? '#f59f00' : '#2b7a3a';
    el.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;padding:10px 20px;border-radius:8px;z-index:99999;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,.3)`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 3000);
  }
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = ts => { if(!ts) return '—'; try { return new Date(ts).toLocaleDateString(lang()==='ar'?'ar':'en'); } catch(_){ return '—'; } };

  /* ============= 1) Status Badge on cards ============= */
  function badge(status){
    const s = status || 'draft';
    const c = STATE_COLORS[s] || STATE_COLORS.draft;
    return `<span class="gov-badge" data-status="${s}" style="display:inline-flex;align-items:center;gap:5px;background:${c.bg};color:${c.fg};padding:2px 9px;border-radius:11px;font-size:11px;font-weight:600;letter-spacing:.2px">
      <span style="width:6px;height:6px;border-radius:50%;background:${c.dot}"></span>${esc(stateLabel(s))}
    </span>`;
  }
  function overdueBadge(sop){
    if (!sop.nextReviewDue) return '';
    const now = Date.now();
    if (sop.nextReviewDue >= now) return '';
    const days = Math.floor((now - sop.nextReviewDue)/86400000);
    return `<span class="gov-overdue" title="مراجعة متأخرة" style="display:inline-flex;align-items:center;gap:4px;background:#ffe3e3;color:#a61e1e;padding:2px 8px;border-radius:11px;font-size:11px;font-weight:600">⚠️ ${days}د</span>`;
  }

  /* Hook into card rendering — observe grid mutations and inject badges */
  function injectBadgesIntoGrid(){
    try {
      const grid = document.getElementById('grid');
      if (!grid) return;
      const cards = grid.querySelectorAll('.card[data-idx], .card');
      cards.forEach(card => {
        if (card.querySelector('.gov-badge')) return;
        const codeEl = card.querySelector('.sop-code');
        const code = codeEl ? codeEl.textContent.trim() : null;
        if (!code) return;
        const sop = (window.SOPS||[]).find(s=>s.code===code);
        if (!sop) return;
        const top = card.querySelector('.card-top');
        if (!top) return;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:inline-flex;gap:4px;margin-inline-start:6px;align-items:center';
        wrap.innerHTML = badge(sop.status) + overdueBadge(sop);
        top.appendChild(wrap);
        // dim non-active for viewer
        const u = me();
        if (u && u.role === 'viewer'){
          if (sop.status !== 'active' && sop.status !== 'approved'){
            card.style.opacity = '.45';
            card.style.pointerEvents = 'none';
            card.title = 'هذا الإجراء غير متاح للعرض (ليس Active/Approved)';
          }
        }
      });
    } catch(_){}
  }

  /* Visibility filter for viewers — hide non-active+approved cards */
  function filterViewerVisibility(){
    const u = me();
    if (!u || u.role !== 'viewer') return;
    if (!Array.isArray(window.SOPS)) return;
    // Don't mutate SOPS — just dim via CSS post-render (handled in injectBadges)
  }

  /* ============= 2) Status filter chips ============= */
  let activeStatusFilter = 'all';
  function injectStatusFilter(){
    if (document.getElementById('status-filter')) return;
    const chips = document.getElementById('chips');
    if (!chips || !chips.parentNode) return;
    const wrap = document.createElement('div');
    wrap.id = 'status-filter';
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0;align-items:center';
    const items = [
      { id:'all', label: lang()==='ar'?'كل الحالات':'All statuses' },
      ...STATES.map(s => ({ id:s, label: stateLabel(s) }))
    ];
    wrap.innerHTML = `<span style="font-size:12px;color:var(--ink-3,#888);margin-inline-end:4px">${lang()==='ar'?'حالة':'Status'}:</span>` +
      items.map(it=>{
        const c = STATE_COLORS[it.id] || { bg:'transparent', fg:'var(--ink)' };
        const isActive = activeStatusFilter === it.id;
        return `<button type="button" class="gov-status-chip" data-st="${it.id}"
          style="background:${isActive?(c.bg||'var(--brand,#bf9b30)'):'transparent'};color:${isActive?(c.fg||'#fff'):'var(--ink-2,#888)'};border:1px solid ${isActive?'transparent':'var(--line,#ddd)'};padding:3px 10px;border-radius:14px;font-size:11.5px;cursor:pointer;font-weight:${isActive?'600':'500'}">
          ${esc(it.label)}
        </button>`;
      }).join('');
    chips.parentNode.insertBefore(wrap, chips.nextSibling);
    wrap.addEventListener('click', e => {
      const b = e.target.closest('.gov-status-chip');
      if (!b) return;
      activeStatusFilter = b.dataset.st;
      // re-render chips wrap
      const old = wrap; old.remove();
      injectStatusFilter();
      applyStatusFilter();
    });
  }
  function applyStatusFilter(){
    const grid = document.getElementById('grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.card');
    cards.forEach(card => {
      if (activeStatusFilter === 'all') { card.style.display = ''; return; }
      const codeEl = card.querySelector('.sop-code');
      const code = codeEl ? codeEl.textContent.trim() : null;
      const sop = (window.SOPS||[]).find(s=>s.code===code);
      const st = (sop && sop.status) || 'draft';
      card.style.display = (st === activeStatusFilter) ? '' : 'none';
    });
  }

  /* ============= 3) Lifecycle/Ownership editor in SOP modal ============= */
  function buildLifecyclePanel(sop, dept){
    const u = me();
    const isOwner = u && (sop.owner||'').toLowerCase() === (u.email||'').toLowerCase();
    const isReviewer = u && (sop.reviewer||'').toLowerCase() === (u.email||'').toLowerCase();
    const _isAdmin = isAdmin();

    const transitions = [];
    const cur = sop.status || 'draft';
    // Determine allowed transitions per role
    if (cur === 'draft' && (isOwner || _isAdmin || isEditor())) transitions.push({to:'review', label:'إرسال للمراجعة', primary:true});
    if (cur === 'review' && (_isAdmin || isReviewer)) {
      transitions.push({to:'approved', label:'اعتماد', primary:true, color:'#37b24d'});
      transitions.push({to:'draft', label:'إعادة (طلب تعديل)', color:'#f59f00'});
    }
    if (cur === 'approved' && (_isAdmin || isOwner)) transitions.push({to:'active', label:'تفعيل', primary:true, color:'#0F1B2D'});
    if (cur === 'active' && (_isAdmin || isOwner)) {
      transitions.push({to:'review', label:'إعادة مراجعة'});
      transitions.push({to:'deprecated', label:'إلغاء التفعيل', color:'#e03131'});
    }
    if (cur === 'deprecated' && _isAdmin) transitions.push({to:'draft', label:'إعادة فتح'});

    const c = STATE_COLORS[cur] || STATE_COLORS.draft;
    const reviewDueStr = sop.nextReviewDue ? new Date(sop.nextReviewDue).toISOString().slice(0,10) : '';
    const lastAuditStr = sop.lastAudit ? new Date(sop.lastAudit).toISOString().slice(0,10) : '';

    return `<div class="gov-panel" style="border:1px solid var(--line,#e5d6a8);border-radius:10px;padding:14px;margin:14px 0;background:var(--surface,#faf6e8)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <strong style="font-size:13px;color:var(--ink-2)">حالة الإجراء:</strong>
          <span style="background:${c.bg};color:${c.fg};padding:4px 12px;border-radius:14px;font-size:12px;font-weight:600">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${c.dot};margin-inline-end:6px"></span>${esc(stateLabel(cur))}
          </span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${transitions.map(t=>`<button type="button" data-gov-to="${t.to}" data-dept="${esc(dept)}" data-code="${esc(sop.code)}"
            style="background:${t.primary?(t.color||'var(--brand,#bf9b30)'):'transparent'};color:${t.primary?'#fff':(t.color||'var(--ink)')};border:1px solid ${t.primary?'transparent':(t.color||'var(--line)')};padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600">
            ${esc(t.label)}
          </button>`).join('')}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;font-size:12.5px">
        <div>
          <label style="display:block;color:var(--ink-3);font-size:11px;margin-bottom:3px">المالك (Owner)</label>
          <input type="email" data-gov-field="owner" value="${esc(sop.owner||'')}" placeholder="email@arsann.com"
            style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12.5px" ${(_isAdmin||isOwner)?'':'readonly'}>
        </div>
        <div>
          <label style="display:block;color:var(--ink-3);font-size:11px;margin-bottom:3px">المراجِع (Reviewer)</label>
          <input type="email" data-gov-field="reviewer" value="${esc(sop.reviewer||'')}" placeholder="email@arsann.com"
            style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12.5px" ${(_isAdmin||isOwner)?'':'readonly'}>
        </div>
        <div>
          <label style="display:block;color:var(--ink-3);font-size:11px;margin-bottom:3px">آخر تدقيق</label>
          <input type="date" data-gov-field="lastAudit" value="${lastAuditStr}"
            style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12.5px" ${(_isAdmin||isOwner||isReviewer)?'':'readonly'}>
        </div>
        <div>
          <label style="display:block;color:var(--ink-3);font-size:11px;margin-bottom:3px">المراجعة القادمة</label>
          <input type="date" data-gov-field="nextReviewDue" value="${reviewDueStr}"
            style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:5px;background:var(--card);color:var(--ink);font-size:12.5px" ${(_isAdmin||isOwner)?'':'readonly'}>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;justify-content:flex-end">
        <button type="button" data-gov-save data-dept="${esc(dept)}" data-code="${esc(sop.code)}" style="background:var(--brand,#bf9b30);color:#fff;border:0;padding:6px 14px;border-radius:5px;font-size:12px;cursor:pointer;font-weight:600">
          💾 حفظ الملكية
        </button>
      </div>

      ${sop.history && sop.history.length ? `
      <details style="margin-top:12px">
        <summary style="cursor:pointer;font-size:12px;color:var(--ink-2);user-select:none">📜 سجل الحالات (${sop.history.length})</summary>
        <div style="margin-top:8px;border-top:1px dashed var(--line);padding-top:8px;max-height:200px;overflow:auto">
          ${sop.history.map(h=>`<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11.5px;border-bottom:1px dotted var(--line);gap:8px;flex-wrap:wrap">
            <span><b>${esc(stateLabel(h.from)||'—')}</b> → <b>${esc(stateLabel(h.to))}</b> ${h.note?`<span style="color:var(--ink-3)">· ${esc(h.note)}</span>`:''}</span>
            <span style="color:var(--ink-3)">${esc(h.by||'')} · ${fmtDate(h.at)}</span>
          </div>`).join('')}
        </div>
      </details>` : ''}
    </div>`;
  }

  /* Hook into modal — wait for it to open and append panel */
  function injectIntoModal(){
    const modal = document.getElementById('modal');
    if (!modal || modal._govHooked) return;
    modal._govHooked = true;
    const obs = new MutationObserver(() => {
      if (modal.style.display === 'none' || !modal.classList.contains('open')) return;
      try {
        const idx = window.state && typeof window.state.openIdx === 'number' ? window.state.openIdx : -1;
        if (idx < 0) return;
        const sop = (window.SOPS||[])[idx];
        if (!sop) return;
        // remove old panel
        modal.querySelectorAll('.gov-panel').forEach(p=>p.remove());
        // find anchor: meta row
        const anchor = modal.querySelector('.modal-meta') || modal.querySelector('#m-code')?.closest('.modal-header') || modal.querySelector('.modal-body') || modal.querySelector('.modal-content');
        if (!anchor) return;
        const div = document.createElement('div');
        div.innerHTML = buildLifecyclePanel(sop, window.CURRENT_DEPT_ID);
        const panel = div.firstElementChild;
        // insert at top of body
        if (anchor.classList.contains('modal-body') || anchor.classList.contains('modal-content')){
          anchor.insertBefore(panel, anchor.firstChild);
        } else {
          anchor.parentNode.insertBefore(panel, anchor.nextSibling);
        }
        // wire transition buttons
        panel.querySelectorAll('[data-gov-to]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const to = btn.dataset.govTo;
            const dept = btn.dataset.dept;
            const code = btn.dataset.code;
            let note = '';
            if (to === 'draft' || to === 'deprecated') {
              note = prompt(to==='draft'?'سبب الإعادة (اختياري):':'سبب إلغاء التفعيل (اختياري):') || '';
            }
            try {
              btn.disabled = true; btn.textContent = '…';
              const r = await api(`/api/sops/${dept}/${code}/transition`, { method:'POST', body:{ to, note } });
              toast('✓ ' + (lang()==='ar'?'تم تحديث الحالة':'Status updated'));
              // update local
              const i = (window.SOPS||[]).findIndex(s=>s.code===code);
              if (i>=0) Object.assign(window.SOPS[i], r.sop);
              if (typeof window.renderGrid==='function') window.renderGrid();
              // re-open modal to refresh
              if (typeof window.openModal==='function') window.openModal(i);
              else { obs.disconnect(); modal.classList.remove('open'); modal.style.display='none'; }
            } catch(e){
              toast('فشل: '+e.message, 'err');
              btn.disabled = false;
            }
          });
        });
        // wire ownership save
        const saveBtn = panel.querySelector('[data-gov-save]');
        if (saveBtn){
          saveBtn.addEventListener('click', async () => {
            const dept = saveBtn.dataset.dept, code = saveBtn.dataset.code;
            const owner = panel.querySelector('[data-gov-field="owner"]').value.trim().toLowerCase();
            const reviewer = panel.querySelector('[data-gov-field="reviewer"]').value.trim().toLowerCase();
            const lastAuditStr = panel.querySelector('[data-gov-field="lastAudit"]').value;
            const nextReviewStr = panel.querySelector('[data-gov-field="nextReviewDue"]').value;
            const body = { owner, reviewer };
            if (lastAuditStr) body.lastAudit = new Date(lastAuditStr).getTime();
            if (nextReviewStr) body.nextReviewDue = new Date(nextReviewStr).getTime();
            try {
              saveBtn.disabled = true; saveBtn.textContent = '…';
              await api(`/api/sops/${dept}/${code}`, { method:'PUT', body });
              toast('✓ ' + (lang()==='ar'?'تم حفظ الملكية':'Ownership saved'));
              const i = (window.SOPS||[]).findIndex(s=>s.code===code);
              if (i>=0) Object.assign(window.SOPS[i], body);
              saveBtn.disabled = false; saveBtn.textContent = '💾 حفظ الملكية';
            } catch(e){
              toast('فشل: '+e.message, 'err');
              saveBtn.disabled = false; saveBtn.textContent = '💾 حفظ الملكية';
            }
          });
        }
      } catch(e){ console.warn('[Gov] modal hook err', e); }
    });
    obs.observe(modal, { attributes:true, attributeFilter:['style','class'] });
  }

  /* ============= 4) Approval Chains config (admin tools) ============= */
  async function openApprovalChainsEditor(){
    if (!isAdmin()) { toast('للأدمن فقط', 'err'); return; }
    let chains = {};
    try { chains = await api('/api/approval-chains'); } catch(_){}
    const cfg = window.DEPARTMENTS_CONFIG || {};
    const deptIds = Object.keys(cfg);
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    bd.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:20px;max-width:680px;width:100%;max-height:85vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0;font-size:18px">🔗 سلاسل الاعتماد لكل إدارة</h3>
        <button type="button" data-x style="background:none;border:0;font-size:22px;cursor:pointer;color:var(--ink-2)">×</button>
      </div>
      <div style="font-size:12.5px;color:var(--ink-2);margin-bottom:14px">عرّف خطوات الاعتماد لكل إدارة. كل خطوة = دور أو إيميل محدّد.</div>
      <div data-list></div>
    </div>`;
    document.body.appendChild(bd);
    const list = bd.querySelector('[data-list]');
    deptIds.forEach(id => {
      const dept = cfg[id];
      const ch = chains[id] || { steps: [] };
      const block = document.createElement('div');
      block.style.cssText = 'border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--surface)';
      block.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>${esc(dept.name||id)}</strong>
          <button type="button" data-add style="background:transparent;border:1px dashed var(--line);color:var(--ink-2);padding:3px 10px;border-radius:5px;font-size:12px;cursor:pointer">+ خطوة</button>
        </div>
        <div data-steps style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"></div>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" data-save style="background:var(--brand,#bf9b30);color:#fff;border:0;padding:5px 14px;border-radius:5px;font-size:12px;cursor:pointer">حفظ</button>
        </div>`;
      const stepsEl = block.querySelector('[data-steps]');
      const steps = [...(ch.steps||[])];
      function renderSteps(){
        stepsEl.innerHTML = '';
        if (!steps.length){ stepsEl.innerHTML = '<div style="color:var(--ink-3);font-size:12px;font-style:italic">لا توجد خطوات (افتراضي: الأدمن)</div>'; return; }
        steps.forEach((st, i) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;gap:6px;align-items:center';
          row.innerHTML = `<span style="color:var(--ink-3);font-size:11px;min-width:18px">${i+1}.</span>
            <select data-role style="padding:5px;border:1px solid var(--line);border-radius:4px;background:var(--card);color:var(--ink);font-size:12px">
              <option value="reviewer" ${st.role==='reviewer'?'selected':''}>المراجِع المحدّد</option>
              <option value="owner" ${st.role==='owner'?'selected':''}>المالك</option>
              <option value="dept_head" ${st.role==='dept_head'?'selected':''}>رئيس الإدارة</option>
              <option value="admin" ${st.role==='admin'?'selected':''}>الأدمن</option>
              <option value="email" ${st.role==='email'?'selected':''}>إيميل محدّد</option>
            </select>
            <input data-email type="email" placeholder="email (لو role=email)" value="${esc(st.email||'')}" style="flex:1;padding:5px;border:1px solid var(--line);border-radius:4px;background:var(--card);color:var(--ink);font-size:12px">
            <button type="button" data-del style="background:none;border:0;color:#c33;font-size:16px;cursor:pointer">×</button>`;
          row.querySelector('[data-role]').onchange = e => { steps[i].role = e.target.value; };
          row.querySelector('[data-email]').oninput = e => { steps[i].email = e.target.value.trim(); };
          row.querySelector('[data-del]').onclick = () => { steps.splice(i,1); renderSteps(); };
          stepsEl.appendChild(row);
        });
      }
      renderSteps();
      block.querySelector('[data-add]').onclick = () => { steps.push({ role:'reviewer' }); renderSteps(); };
      block.querySelector('[data-save]').onclick = async () => {
        try { await api('/api/approval-chains/'+encodeURIComponent(id), { method:'PUT', body:{ steps } }); toast('✓ تم الحفظ'); }
        catch(e){ toast('فشل: '+e.message,'err'); }
      };
      list.appendChild(block);
    });
    bd.querySelector('[data-x]').onclick = () => bd.remove();
    bd.addEventListener('click', e => { if (e.target===bd) bd.remove(); });
  }

  /* ============= 5) My Approvals (notifications) ============= */
  async function openMyApprovals(){
    const u = me(); if (!u) return;
    let allSops = {};
    try { const b = await api('/api/bootstrap'); allSops = b.sops||{}; } catch(_){}
    const pending = [];
    Object.keys(allSops).forEach(dept => {
      Object.keys(allSops[dept]||{}).forEach(code => {
        const s = allSops[dept][code];
        if (s.status === 'review' && (
            (s.reviewer||'').toLowerCase() === (u.email||'').toLowerCase() ||
            isAdmin()
          )){
          pending.push(Object.assign({}, s, { _dept: dept, _code: code }));
        }
      });
    });
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    bd.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:20px;max-width:640px;width:100%;max-height:85vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0;font-size:18px">📥 الإجراءات المنتظرة لاعتمادك (${pending.length})</h3>
        <button type="button" data-x style="background:none;border:0;font-size:22px;cursor:pointer;color:var(--ink-2)">×</button>
      </div>
      ${pending.length ? pending.map(s => {
        const cfg = (window.DEPARTMENTS_CONFIG||{})[s._dept] || {};
        return `<div style="border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:8px;background:var(--surface)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
            <div>
              <div style="font-weight:600">${esc(s.title||s._code)}</div>
              <div style="font-size:11.5px;color:var(--ink-3)">${esc(cfg.name||s._dept)} · ${esc(s._code)} · المالك: ${esc(s.owner||'—')}</div>
            </div>
            ${badge(s.status)}
          </div>
          <div style="display:flex;gap:6px;justify-content:flex-end">
            <button type="button" data-act="reject" data-dept="${esc(s._dept)}" data-code="${esc(s._code)}" style="background:transparent;border:1px solid #f59f00;color:#8a6d00;padding:4px 12px;border-radius:5px;font-size:12px;cursor:pointer">↩ إعادة</button>
            <button type="button" data-act="approve" data-dept="${esc(s._dept)}" data-code="${esc(s._code)}" style="background:#37b24d;color:#fff;border:0;padding:4px 14px;border-radius:5px;font-size:12px;cursor:pointer;font-weight:600">✓ اعتماد</button>
          </div>
        </div>`;
      }).join('') : '<div style="text-align:center;padding:30px;color:var(--ink-3)">لا توجد إجراءات تنتظر اعتمادك ✨</div>'}
    </div>`;
    document.body.appendChild(bd);
    bd.querySelector('[data-x]').onclick = () => bd.remove();
    bd.addEventListener('click', e => { if (e.target===bd) bd.remove(); });
    bd.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const act = btn.dataset.act, dept=btn.dataset.dept, code=btn.dataset.code;
        const note = act==='reject' ? (prompt('سبب الإعادة:')||'') : '';
        try {
          btn.disabled = true; btn.textContent = '…';
          await api(`/api/sops/${dept}/${code}/transition`, { method:'POST', body:{ to: act==='approve'?'approved':'draft', note } });
          toast(act==='approve'?'✓ تم الاعتماد':'↩ أعيد إلى Draft');
          btn.closest('div[style*="border:1px"]').remove();
        } catch(e){ toast('فشل: '+e.message,'err'); btn.disabled = false; btn.textContent = act==='approve'?'✓ اعتماد':'↩ إعادة'; }
      });
    });
  }

  /* ============= 6) Migration prompt (admin) ============= */
  async function checkMigration(){
    if (!isAdmin()) return;
    try {
      const st = await api('/api/admin/governance/status');
      if (st.migrated) return;
      // show one-time banner
      if (sessionStorage.getItem('gov_mig_dismissed')) return;
      const b = document.createElement('div');
      b.style.cssText = 'position:fixed;bottom:20px;inset-inline-start:20px;background:#0F1B2D;color:#fff;padding:14px 18px;border-radius:10px;z-index:9999;max-width:380px;box-shadow:0 8px 24px rgba(0,0,0,.4);font-size:13px';
      b.innerHTML = `<div style="font-weight:600;margin-bottom:6px">🔧 ترقية الحوكمة</div>
        <div style="opacity:.85;margin-bottom:10px;line-height:1.5">حوّل جميع الإجراءات الحالية إلى حالة <b>Draft</b> ليبدأ مسار الاعتماد الرسمي.</div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button data-skip style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.3);padding:5px 12px;border-radius:5px;font-size:12px;cursor:pointer">لاحقاً</button>
          <button data-go style="background:var(--brand,#bf9b30);color:#fff;border:0;padding:5px 14px;border-radius:5px;font-size:12px;cursor:pointer;font-weight:600">ابدأ الترقية</button>
        </div>`;
      document.body.appendChild(b);
      b.querySelector('[data-skip]').onclick = () => { sessionStorage.setItem('gov_mig_dismissed','1'); b.remove(); };
      b.querySelector('[data-go]').onclick = async () => {
        if (!confirm('سيتم تحويل جميع الإجراءات إلى Draft. متابعة؟')) return;
        try {
          const r = await api('/api/admin/governance/migrate', { method:'POST', body:{} });
          toast('✓ تم تحويل '+(r.migrated||0)+' إجراء إلى Draft');
          b.remove();
          setTimeout(()=>location.reload(), 1200);
        } catch(e){ toast('فشل: '+e.message,'err'); }
      };
    } catch(_){}
  }

  /* ============= 7) Topbar buttons ============= */
  function injectTopbarButtons(){
    if (document.getElementById('gov-topbar-btns')) return;
    // find a good slot — try .topbar or .header
    const slot = document.querySelector('.topbar-actions') || document.querySelector('.topbar') || document.querySelector('.header');
    if (!slot) return;
    const wrap = document.createElement('div');
    wrap.id = 'gov-topbar-btns';
    wrap.style.cssText = 'display:inline-flex;gap:6px;align-items:center;margin-inline-start:8px';
    let html = `<button type="button" id="gov-my-approvals" title="الإجراءات المنتظرة لاعتمادك" style="background:transparent;border:1px solid var(--line,#ddd);color:var(--ink-2);padding:5px 10px;border-radius:5px;font-size:12px;cursor:pointer">📥 اعتماداتي</button>`;
    if (isAdmin()){
      html += `<button type="button" id="gov-chains" title="سلاسل الاعتماد" style="background:transparent;border:1px solid var(--line,#ddd);color:var(--ink-2);padding:5px 10px;border-radius:5px;font-size:12px;cursor:pointer">🔗 السلاسل</button>`;
    }
    wrap.innerHTML = html;
    slot.appendChild(wrap);
    wrap.querySelector('#gov-my-approvals').onclick = openMyApprovals;
    const ch = wrap.querySelector('#gov-chains');
    if (ch) ch.onclick = openApprovalChainsEditor;
  }

  /* ============= INIT ============= */
  function tick(){
    injectStatusFilter();
    injectBadgesIntoGrid();
    applyStatusFilter();
    injectIntoModal();
    injectTopbarButtons();
  }
  function init(){
    tick();
    // re-run after grid renders
    const grid = document.getElementById('grid');
    if (grid){
      const obs = new MutationObserver(() => { setTimeout(tick, 50); });
      obs.observe(grid, { childList:true, subtree:false });
    }
    setInterval(tick, 2500);
    setTimeout(checkMigration, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Expose
  window.ArsanGovernance = {
    openMyApprovals,
    openApprovalChainsEditor,
    badge,
    stateLabel,
    STATES
  };
})();

/* =====================================================================
   🚀 ARSAN MEGA PACK — Part 2: Favorites + Tasks + Comments + Tour
   --------------------------------------------------------------------
   Completes the 50-improvement set by layering interactive features
   on top of arsan-mega-pack.js. Include AFTER the main pack.
   ===================================================================== */
(function(){
  'use strict';
  if (window.__ArsanMegaPack2) return;
  window.__ArsanMegaPack2 = true;

  const $  = (s, r=document) => (r||document).querySelector(s);
  const $$ = (s, r=document) => Array.from((r||document).querySelectorAll(s));
  const LS = {
    get: (k, d=null) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch{} },
    del: (k) => { try { localStorage.removeItem(k); } catch{} },
  };
  const escapeHtml = (s) => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = (o) => window.ampToast?.(o);
  const me = () => window.ArsanAPI?.me?.() || null;

  /* ─────────────────────────────────────────────────────────────────
     #47  FAVORITES — star toggle on every card + favorites view
     ───────────────────────────────────────────────────────────────── */
  function getFavs(){ return LS.get('arsan_favs_v1', {}); }
  function setFavs(o){ LS.set('arsan_favs_v1', o); }
  function isFav(deptId, code){ return !!getFavs()[`${deptId}::${code}`]; }
  function toggleFav(deptId, code, sop){
    const all = getFavs();
    const key = `${deptId}::${code}`;
    if (all[key]) { delete all[key]; toast({ msg:'تمت إزالة المفضلة', type:'info' }); }
    else { all[key] = { dept: deptId, code, title: sop?.title||code, ts: Date.now() }; toast({ msg:'تمت الإضافة للمفضلة ⭐', type:'success' }); }
    setFavs(all);
    decorateFavStars();
  }
  function decorateFavStars(){
    if (!window.SOPS || !window.CURRENT_DEPT_ID) return;
    $$('#grid .card').forEach((card, idx) => {
      const sop = window.SOPS[idx];
      if (!sop) return;
      let star = card.querySelector('.amp-fav-star');
      const active = isFav(window.CURRENT_DEPT_ID, sop.code);
      if (!star) {
        star = document.createElement('button');
        star.className = 'amp-fav-star';
        star.style.cssText = 'position:absolute;bottom:8px;inset-inline-end:8px;background:transparent;border:none;font-size:18px;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:4;transition:transform .15s';
        star.onmouseover = () => star.style.transform = 'scale(1.2)';
        star.onmouseout  = () => star.style.transform = 'none';
        star.onclick = (e) => { e.stopPropagation(); toggleFav(window.CURRENT_DEPT_ID, sop.code, sop); };
        card.style.position = 'relative';
        card.appendChild(star);
      }
      star.innerHTML = active ? '⭐' : '☆';
      star.title = active ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة';
      star.style.color = active ? '#D4B24A' : 'var(--ink-3)';
    });
  }

  function showFavoritesPanel(){
    const all = Object.values(getFavs()).sort((a,b) => b.ts - a.ts);
    if (!all.length) return toast({ msg:'لا توجد مفضلات بعد. اضغط ⭐ على أي إجراء', type:'info' });
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(15,12,8,.7);backdrop-filter:blur(8px);z-index:99500;display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui';
    bd.innerHTML = `
      <div style="background:#fffaee;border-radius:16px;max-width:520px;width:100%;max-height:80vh;overflow:auto;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.4)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:#85714D;font-size:18px">⭐ المفضّلة (${all.length})</h3>
          <button id="ampFavClose" style="background:transparent;border:none;font-size:24px;cursor:pointer;color:#85714D">×</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${all.map(f => `
            <a href="dashboard.html?dept=${encodeURIComponent(f.dept)}#${encodeURIComponent(f.code)}" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:rgba(212,178,74,.08);border:1px solid rgba(212,178,74,.2);border-radius:10px;text-decoration:none;color:#1a1a1a">
              <div style="min-width:0;flex:1">
                <div style="font-weight:600;font-size:14px;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(f.title)}</div>
                <div style="font-size:11px;color:#85714D;margin-top:2px">${escapeHtml(f.code)} · ${escapeHtml(f.dept)}</div>
              </div>
              <span style="color:#D4B24A;font-size:18px">⭐</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(bd);
    bd.querySelector('#ampFavClose').onclick = () => bd.remove();
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };
  }
  window.ampShowFavorites = showFavoritesPanel;

  function injectFavButton(){
    const bar = $('.arsan-topbar');
    if (!bar || bar.querySelector('[data-amp-fav]')) return;
    const b = document.createElement('button');
    b.className = 'arsan-topbar-btn'; b.dataset.ampFav='1';
    b.innerHTML = '⭐ المفضّلة'; b.title = 'عرض المفضلة';
    b.onclick = showFavoritesPanel;
    bar.appendChild(b);
  }

  /* ─────────────────────────────────────────────────────────────────
     #44  TASKS — local-first per-SOP task list
     ───────────────────────────────────────────────────────────────── */
  function getTasks(deptId, code){
    const all = LS.get('arsan_tasks_v1', {});
    return all[`${deptId}::${code}`] || [];
  }
  function setTasks(deptId, code, tasks){
    const all = LS.get('arsan_tasks_v1', {});
    all[`${deptId}::${code}`] = tasks;
    LS.set('arsan_tasks_v1', all);
  }
  function renderTasksUI(deptId, code){
    const wrap = document.createElement('div');
    wrap.style.cssText = 'border:1px solid rgba(212,178,74,.2);border-radius:10px;padding:14px;background:rgba(212,178,74,.04);margin-top:14px;direction:rtl';
    const renderList = () => {
      const tasks = getTasks(deptId, code);
      const completed = tasks.filter(t => t.done).length;
      wrap.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h4 style="margin:0;color:#85714D;font-size:14px">📌 المهام (${completed}/${tasks.length})</h4>
          <button id="ampAddTask" style="background:#D4B24A;color:#1a1a1a;border:none;padding:4px 10px;border-radius:6px;font-family:inherit;font-size:11px;cursor:pointer;font-weight:600">+ مهمة</button>
        </div>
        <div id="ampTaskList" style="display:flex;flex-direction:column;gap:6px">
          ${tasks.length ? tasks.map((t,i) => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,.5);border-radius:6px">
              <input type="checkbox" data-tid="${i}" ${t.done?'checked':''} style="cursor:pointer">
              <span style="flex:1;font-size:13px;${t.done?'text-decoration:line-through;opacity:.6':''}">${escapeHtml(t.text)}</span>
              ${t.due?`<span style="font-size:10.5px;color:#dc8c28;background:rgba(220,140,40,.12);padding:2px 6px;border-radius:4px">${escapeHtml(t.due)}</span>`:''}
              ${t.assignee?`<span style="font-size:10.5px;color:#3a8f66;background:rgba(58,143,102,.12);padding:2px 6px;border-radius:4px">@${escapeHtml(t.assignee)}</span>`:''}
              <button data-del="${i}" style="background:transparent;border:none;color:#b85450;cursor:pointer;font-size:14px">×</button>
            </div>
          `).join('') : '<div style="color:#999;font-size:12px;font-style:italic;padding:8px">لا توجد مهام بعد</div>'}
        </div>
      `;
      wrap.querySelector('#ampAddTask').onclick = () => {
        const text = prompt('عنوان المهمة:');
        if (!text) return;
        const due = prompt('تاريخ الاستحقاق (اختياري، YYYY-MM-DD):') || '';
        const assignee = prompt('مسؤول المهمة (إيميل/اسم، اختياري):') || '';
        const tasks = getTasks(deptId, code);
        tasks.push({ text, due, assignee, done:false, ts: Date.now() });
        setTasks(deptId, code, tasks);
        renderList();
      };
      wrap.querySelectorAll('[data-tid]').forEach(cb => {
        cb.onchange = () => {
          const tasks = getTasks(deptId, code);
          tasks[+cb.dataset.tid].done = cb.checked;
          setTasks(deptId, code, tasks);
          renderList();
        };
      });
      wrap.querySelectorAll('[data-del]').forEach(b => {
        b.onclick = () => {
          if (!confirm('حذف هذه المهمة؟')) return;
          const tasks = getTasks(deptId, code);
          tasks.splice(+b.dataset.del, 1);
          setTasks(deptId, code, tasks);
          renderList();
        };
      });
    };
    renderList();
    return wrap;
  }

  /* ─────────────────────────────────────────────────────────────────
     #45  COMMENTS — local-first per-SOP comments
     ───────────────────────────────────────────────────────────────── */
  function getComments(deptId, code){
    const all = LS.get('arsan_comments_v1', {});
    return all[`${deptId}::${code}`] || [];
  }
  function addComment(deptId, code, text){
    const all = LS.get('arsan_comments_v1', {});
    const k = `${deptId}::${code}`;
    all[k] = all[k] || [];
    const u = me() || {};
    all[k].push({ text, by: u.email || 'مجهول', name: u.name || u.email?.split('@')[0] || 'مستخدم', ts: Date.now() });
    LS.set('arsan_comments_v1', all);
  }
  function timeAgo(ts){
    const sec = (Date.now() - ts) / 1000;
    if (sec < 60) return 'الآن';
    if (sec < 3600) return `قبل ${Math.floor(sec/60)} د`;
    if (sec < 86400) return `قبل ${Math.floor(sec/3600)} س`;
    return new Date(ts).toLocaleDateString('ar-SA');
  }
  function renderCommentsUI(deptId, code){
    const wrap = document.createElement('div');
    wrap.style.cssText = 'border:1px solid rgba(212,178,74,.2);border-radius:10px;padding:14px;background:rgba(255,255,255,.4);margin-top:14px;direction:rtl';
    const renderList = () => {
      const comments = getComments(deptId, code);
      wrap.innerHTML = `
        <h4 style="margin:0 0 10px;color:#85714D;font-size:14px">💬 التعليقات (${comments.length})</h4>
        <div id="ampCmtList" style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow:auto;margin-bottom:10px">
          ${comments.length ? comments.map(c => `
            <div style="padding:9px 11px;background:rgba(212,178,74,.06);border-inline-start:3px solid #D4B24A;border-radius:6px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-weight:600;font-size:12px;color:#85714D">${escapeHtml(c.name)}</span>
                <span style="font-size:10.5px;color:#999">${timeAgo(c.ts)}</span>
              </div>
              <div style="font-size:13px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap">${escapeHtml(c.text)}</div>
            </div>
          `).join('') : '<div style="color:#999;font-size:12px;font-style:italic;padding:8px">لا توجد تعليقات بعد</div>'}
        </div>
        <div style="display:flex;gap:6px">
          <input id="ampCmtInput" placeholder="اكتب تعليقاً…" style="flex:1;padding:8px 10px;border:1px solid rgba(212,178,74,.3);border-radius:6px;font-family:inherit;font-size:13px;background:#fff">
          <button id="ampCmtBtn" style="background:#D4B24A;color:#1a1a1a;border:none;padding:8px 14px;border-radius:6px;font-family:inherit;cursor:pointer;font-weight:600">نشر</button>
        </div>
      `;
      const input = wrap.querySelector('#ampCmtInput');
      const submit = () => {
        const t = input.value.trim();
        if (!t) return;
        addComment(deptId, code, t);
        renderList();
        toast({ msg:'تم نشر التعليق', type:'success' });
      };
      wrap.querySelector('#ampCmtBtn').onclick = submit;
      input.onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); };
    };
    renderList();
    return wrap;
  }

  /* ─────────────────────────────────────────────────────────────────
     Inject Tasks + Comments + Related into open SOP modal
     ───────────────────────────────────────────────────────────────── */
  function injectModalAddons(){
    const modals = $$('.modal:not([data-amp-addons]), .arsan-sop-modal:not([data-amp-addons])');
    modals.forEach(modal => {
      const idx = window.state?.openIdx;
      if (idx == null) return;
      const sop = window.SOPS?.[idx];
      if (!sop || !window.CURRENT_DEPT_ID) return;
      modal.dataset.ampAddons = '1';
      const body = modal.querySelector('.modal-body, .arsan-sop-body') || modal;
      // Tasks
      body.appendChild(renderTasksUI(window.CURRENT_DEPT_ID, sop.code));
      // Comments
      body.appendChild(renderCommentsUI(window.CURRENT_DEPT_ID, sop.code));
      // Related
      const related = window.ampFindRelated?.(sop, 3);
      if (related?.length) {
        const rWrap = document.createElement('div');
        rWrap.style.cssText = 'border:1px solid rgba(212,178,74,.2);border-radius:10px;padding:14px;background:linear-gradient(135deg,rgba(212,178,74,.06),transparent);margin-top:14px;direction:rtl';
        rWrap.innerHTML = `
          <h4 style="margin:0 0 10px;color:#85714D;font-size:14px">🔗 إجراءات ذات صلة</h4>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${related.map(r => `
              <a href="#${encodeURIComponent(r.code)}" data-related="${escapeHtml(r.code)}" style="display:block;padding:8px 10px;background:rgba(255,255,255,.5);border:1px solid rgba(212,178,74,.18);border-radius:6px;text-decoration:none;color:#1a1a1a">
                <div style="font-weight:600;font-size:13px">${escapeHtml(r.title)}</div>
                <div style="font-size:11px;color:#85714D;margin-top:2px">${escapeHtml(r.code)}</div>
              </a>
            `).join('')}
          </div>
        `;
        body.appendChild(rWrap);
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     #50  Auto-launch interactive Tour (first-time)
     ───────────────────────────────────────────────────────────────── */
  const TOUR_STEPS = [
    {
      title: '👋 أهلاً بك في أرسان',
      body: 'نحن مرتاحون لانضمامك. هذه جولة سريعة (8 خطوات) للأهم في المنصة.',
      target: null,
    },
    {
      title: '🏠 الصفحة الرئيسية',
      body: 'هنا تختار الإدارة التي تريد العمل عليها. كل بطاقة = إدارة كاملة بإجراءاتها.',
      target: '.dept-grid, main',
    },
    {
      title: '🔍 البحث الشامل (⌘K)',
      body: 'اضغط ⌘K (أو Ctrl+K) في أي صفحة لتفتح البحث الفوري عبر كل الإدارات.',
      target: '[data-amp-cmdk]',
    },
    {
      title: '⭐ المفضّلة',
      body: 'كل إجراء له نجمة. اضغطها لإضافته لمفضلتك ووصول سريع من أي مكان.',
      target: '[data-amp-fav]',
    },
    {
      title: '📊 إحصائيات الإدارة',
      body: 'في كل إدارة تشاهد KPIs حية: العدد الإجمالي، الموثّق، ما يحتاج توثيقاً.',
      target: '#arsan-kpi-strip, .stats',
    },
    {
      title: '📄 تصدير PDF',
      body: 'افتح أي إجراء، اضغط زر PDF، تحصل على وثيقة احترافية بهوية أرسان.',
      target: null,
    },
    {
      title: '💬 تعليقات + 📌 مهام',
      body: 'كل إجراء فيه قسم تعليقات وقسم مهام مع مسؤول وتاريخ استحقاق.',
      target: null,
    },
    {
      title: '🌟 جاهز للانطلاق',
      body: 'إذا احتجت أي شيء: a.king@arsann.com — اضغط ? في أي وقت لرؤية الاختصارات.',
      target: null,
    },
  ];

  function startTour(){
    if ($('#amp-tour-overlay')) return;
    let step = 0;
    const ov = document.createElement('div');
    ov.id = 'amp-tour-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,12,8,.78);z-index:99800;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui;animation:ampToastIn .25s';

    const render = () => {
      const s = TOUR_STEPS[step];
      ov.innerHTML = `
        <div style="background:linear-gradient(180deg,#fffaee,#fff5e0);border:1px solid rgba(212,178,74,.4);border-radius:18px;max-width:440px;width:90%;padding:28px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);position:relative">
          <div style="position:absolute;top:14px;inset-inline-end:14px;font-size:11px;color:#85714D;background:rgba(212,178,74,.15);padding:3px 9px;border-radius:10px;font-weight:600">${step+1}/${TOUR_STEPS.length}</div>
          <div style="font-size:46px;margin-bottom:12px">🐎</div>
          <h2 style="font-size:20px;color:#85714D;margin:0 0 8px">${escapeHtml(s.title)}</h2>
          <p style="color:#5a4a30;font-size:14px;line-height:1.7;margin:0 0 20px">${escapeHtml(s.body)}</p>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
            ${step > 0 ? `<button id="ampTourBack" style="padding:9px 18px;background:transparent;color:#85714D;border:1px solid #d4b24a;border-radius:8px;font-family:inherit;cursor:pointer;font-size:13px">← السابق</button>` : ''}
            ${step < TOUR_STEPS.length-1
              ? `<button id="ampTourNext" style="padding:9px 22px;background:linear-gradient(135deg,#D4B24A,#85714D);color:#fff;border:none;border-radius:8px;font-family:inherit;cursor:pointer;font-size:13px;font-weight:600">التالي →</button>`
              : `<button id="ampTourEnd" style="padding:9px 22px;background:linear-gradient(135deg,#3a8f66,#5fb588);color:#fff;border:none;border-radius:8px;font-family:inherit;cursor:pointer;font-size:13px;font-weight:600">🎉 انطلق!</button>`}
            <button id="ampTourSkip" style="padding:9px 14px;background:transparent;color:#999;border:none;font-family:inherit;cursor:pointer;font-size:12px">تخطّي</button>
          </div>
        </div>
      `;
      ov.querySelector('#ampTourBack')?.addEventListener('click', () => { step--; render(); });
      ov.querySelector('#ampTourNext')?.addEventListener('click', () => { step++; render(); });
      ov.querySelector('#ampTourEnd')?.addEventListener('click', () => { ov.remove(); LS.set('arsan_tour_v2_done','1'); window.ampConfetti?.(); });
      ov.querySelector('#ampTourSkip')?.addEventListener('click', () => { ov.remove(); LS.set('arsan_tour_v2_done','1'); });
    };
    render();
    document.body.appendChild(ov);
  }

  function autoStartTour(){
    if (LS.get('arsan_tour_v2_done')) return;
    if (!window.ArsanAPI?.isLoggedIn?.()) return;
    if (LS.get('arsan_welcome_v2_shown')) return; // welcome modal handles it
    setTimeout(startTour, 2500);
  }
  window.ArsanTour = { start: startTour };

  /* ─────────────────────────────────────────────────────────────────
     INIT
     ───────────────────────────────────────────────────────────────── */
  function tick(){
    injectFavButton();
    decorateFavStars();
    injectModalAddons();
  }
  function init(){
    tick();
    autoStartTour();
    new MutationObserver(tick).observe(document.body, { childList:true, subtree:true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.ArsanMegaPack2 = {
    showFavorites: showFavoritesPanel,
    isFav, toggleFav,
    getTasks, setTasks,
    getComments, addComment,
    startTour,
  };
  console.log('[Arsan MegaPack 2] Favorites + Tasks + Comments + Tour loaded ✨');
})();

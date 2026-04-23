/* Arsan Admin FAB
 * Embedded bottom-corner admin pill — subtle, contextual, admin-only.
 * Opens the admin panel + exposes announcement composer.
 * Appears only for admins; hidden during editing/modals.
 */
(function(){
  'use strict';

  const BTN_ID = 'arsan-admin-fab';

  function isAdmin(){
    const API = window.ArsanAPI;
    return !!(API && API.isAdmin && API.isAdmin());
  }

  function lang(){ return (localStorage.getItem('arsan_lang') || 'ar'); }
  function t(ar, en){ return lang() === 'en' ? en : ar; }

  function injectStyles(){
    if (document.getElementById('arsan-admin-fab-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-admin-fab-styles';
    s.textContent = `
      #${BTN_ID}{
        position:fixed;
        bottom:20px;
        /* RTL: bottom-LEFT (since sidebar FAB is top-right).
           LTR: bottom-RIGHT (sidebar FAB is top-left). */
        inset-inline-start:20px;
        inset-inline-end:auto;
        z-index:9200;
        display:none;
        align-items:center;
        justify-content:center;
        width:38px;
        height:38px;
        padding:0;
        border-radius:50%;
        background:rgba(26,21,16,.55);
        backdrop-filter:blur(12px) saturate(160%);
        -webkit-backdrop-filter:blur(12px) saturate(160%);
        border:1px solid rgba(255,255,255,.08);
        color:rgba(243,233,201,.72);
        font-family:inherit;
        font-size:16px;
        line-height:1;
        cursor:pointer;
        box-shadow:0 4px 12px rgba(0,0,0,.2);
        transition:all .18s ease;
        user-select:none;
        opacity:.55;
      }
      html[dir="ltr"] #${BTN_ID}{
        inset-inline-start:auto;
        inset-inline-end:20px;
      }
      html[data-theme="light"] #${BTN_ID}{
        background:rgba(255,255,255,.5);
        color:rgba(58,47,21,.65);
        border-color:rgba(90,70,30,.12);
      }
      #${BTN_ID}:hover{
        opacity:1;
        color:#f3e9c9;
        border-color:rgba(212,168,60,.4);
        background:rgba(26,21,16,.78);
      }
      html[data-theme="light"] #${BTN_ID}:hover{
        color:#3a2f15;
        background:rgba(255,255,255,.85);
        border-color:rgba(212,168,60,.45);
      }
      #${BTN_ID}.visible{ display:inline-flex; }

      #${BTN_ID} .ico{
        display:block;
        transition:transform .2s ease;
      }
      #${BTN_ID}:hover .ico{ transform:rotate(20deg); }
      #${BTN_ID} .label{ display:none; }
      #${BTN_ID} .dot{ display:none; }
      #${BTN_ID} .count{
        position:absolute;
        top:-4px;
        inset-inline-end:-4px;
        min-width:16px;
        padding:0 4px;
        height:16px;
        border-radius:999px;
        background:#e63946;
        color:#fff;
        font-size:9px;
        font-weight:700;
        display:none;
        align-items:center;
        justify-content:center;
        border:2px solid rgba(26,21,16,1);
      }
      html[data-theme="light"] #${BTN_ID} .count{ border-color:#faf6ea; }
      #${BTN_ID}.has-alerts .count{ display:flex; }

      /* Announcement composer modal */
      .arsan-ann-overlay{
        position:fixed;inset:0;z-index:9600;
        background:rgba(0,0,0,.55);
        backdrop-filter:blur(6px);
        display:none;align-items:center;justify-content:center;
        padding:20px;
      }
      .arsan-ann-overlay.open{ display:flex; }
      .arsan-ann-card{
        width:100%;max-width:560px;
        background:linear-gradient(180deg, rgba(26,21,16,.96) 0%, rgba(35,26,16,.94) 100%);
        backdrop-filter:blur(24px) saturate(180%);
        border:1px solid rgba(212,168,60,.3);
        border-radius:16px;
        box-shadow:0 30px 80px rgba(0,0,0,.5);
        color:#f3e9c9;
        overflow:hidden;
      }
      html[data-theme="light"] .arsan-ann-card{
        background:linear-gradient(180deg, rgba(250,246,234,.98) 0%, rgba(243,234,208,.96) 100%);
        color:#3a2f15;
      }
      .arsan-ann-head{
        padding:18px 22px 14px;
        border-bottom:1px solid rgba(212,168,60,.2);
        display:flex;align-items:center;justify-content:space-between;
      }
      .arsan-ann-head h2{
        margin:0;font-size:17px;font-weight:600;
        display:flex;align-items:center;gap:10px;
      }
      .arsan-ann-head h2::before{
        content:'';
        width:8px;height:8px;border-radius:50%;
        background:radial-gradient(circle at 30% 30%, #ffcb4e, #d4a83c);
        box-shadow:0 0 10px rgba(212,168,60,.5);
      }
      .arsan-ann-head .x{
        background:transparent;border:none;color:inherit;
        font-size:22px;cursor:pointer;opacity:.6;
        width:30px;height:30px;border-radius:6px;
      }
      .arsan-ann-head .x:hover{ opacity:1;background:rgba(212,168,60,.15); }
      .arsan-ann-body{ padding:20px 22px; }
      .arsan-ann-body label{
        display:block;
        font-size:12px;font-weight:500;opacity:.75;
        margin-bottom:6px;
      }
      .arsan-ann-body input,
      .arsan-ann-body textarea{
        width:100%;
        padding:11px 14px;
        border-radius:9px;
        background:rgba(255,255,255,.04);
        border:1px solid rgba(212,168,60,.2);
        color:inherit;
        font:inherit;
        font-size:13px;
        resize:vertical;
        outline:none;
        transition:border-color .15s, background .15s;
      }
      html[data-theme="light"] .arsan-ann-body input,
      html[data-theme="light"] .arsan-ann-body textarea{
        background:rgba(255,255,255,.6);
        border-color:rgba(212,168,60,.3);
      }
      .arsan-ann-body input:focus,
      .arsan-ann-body textarea:focus{
        border-color:rgba(212,168,60,.6);
        background:rgba(212,168,60,.06);
      }
      .arsan-ann-body textarea{ min-height:100px; }
      .arsan-ann-row{ display:flex;gap:12px;margin-bottom:14px; }
      .arsan-ann-row > *{ flex:1; }
      .arsan-ann-priority{
        display:flex;gap:8px;
      }
      .arsan-ann-priority button{
        flex:1;
        padding:9px 10px;
        border-radius:7px;
        background:rgba(255,255,255,.03);
        border:1px solid rgba(212,168,60,.2);
        color:inherit;
        font:inherit;font-size:12px;
        cursor:pointer;
        transition:all .15s;
      }
      .arsan-ann-priority button.active{
        background:linear-gradient(135deg,#d4a83c,#b89030);
        color:#fff;
        border-color:transparent;
      }
      .arsan-ann-priority button.urgent.active{
        background:linear-gradient(135deg,#e63946,#c5303c);
      }
      .arsan-ann-foot{
        padding:14px 22px 20px;
        display:flex;gap:10px;justify-content:flex-end;
        border-top:1px solid rgba(212,168,60,.15);
      }
      .arsan-ann-foot button{
        padding:10px 20px;
        border-radius:9px;
        font:inherit;font-size:13px;font-weight:500;
        cursor:pointer;border:none;
      }
      .arsan-ann-foot .cancel{
        background:transparent;
        color:inherit;opacity:.7;
      }
      .arsan-ann-foot .cancel:hover{ opacity:1; }
      .arsan-ann-foot .send{
        background:linear-gradient(135deg,#d4a83c,#b89030);
        color:#fff;
        box-shadow:0 4px 12px rgba(212,168,60,.35);
      }
      .arsan-ann-foot .send:hover{ box-shadow:0 6px 16px rgba(212,168,60,.5); }
      .arsan-ann-foot .send:disabled{ opacity:.5;cursor:not-allowed;box-shadow:none; }

      .arsan-ann-existing{
        margin-top:10px;
        max-height:200px;
        overflow-y:auto;
        border-top:1px dashed rgba(212,168,60,.2);
        padding-top:14px;
      }
      .arsan-ann-existing h4{
        margin:0 0 10px;font-size:12px;font-weight:600;opacity:.7;
        text-transform:uppercase;letter-spacing:.5px;
      }
      .arsan-ann-li{
        padding:9px 12px;
        border-radius:7px;
        background:rgba(255,255,255,.03);
        border:1px solid rgba(212,168,60,.12);
        margin-bottom:6px;
        display:flex;align-items:flex-start;gap:10px;
        font-size:12px;
      }
      html[data-theme="light"] .arsan-ann-li{ background:rgba(255,255,255,.4); }
      .arsan-ann-li .txt{ flex:1; line-height:1.5; }
      .arsan-ann-li .txt .t{ font-weight:600;display:block;margin-bottom:2px; }
      .arsan-ann-li .txt .b{ opacity:.8;display:block; }
      .arsan-ann-li .txt .m{ opacity:.5;font-size:10px;margin-top:3px;display:block; }
      .arsan-ann-li .del{
        background:transparent;border:none;color:inherit;
        opacity:.4;cursor:pointer;font-size:14px;
        width:24px;height:24px;border-radius:5px;
      }
      .arsan-ann-li .del:hover{ opacity:1;background:rgba(230,57,70,.2);color:#e63946; }
    `;
    document.head.appendChild(s);
  }

  function createBtn(){
    if (document.getElementById(BTN_ID)) return;
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.title = t('إدارة المنصّة','Platform Admin');
    btn.setAttribute('aria-label', t('إدارة المنصّة','Platform Admin'));
    btn.innerHTML = `
      <span class="ico" aria-hidden="true">⚙︎</span>
      <span class="count" aria-label="alerts">0</span>
    `;
    btn.addEventListener('click', openMenu);
    document.body.appendChild(btn);
    updateVisibility();
  }

  function updateVisibility(){
    const btn = document.getElementById(BTN_ID);
    if (!btn) return;
    btn.classList.toggle('visible', isAdmin());
  }

  // Mini menu popover
  let menuEl = null;
  function openMenu(e){
    e?.stopPropagation?.();
    if (menuEl) { menuEl.remove(); menuEl = null; return; }
    menuEl = document.createElement('div');
    menuEl.id = 'arsan-admin-menu';
    menuEl.style.cssText = `
      position:fixed;bottom:62px;
      inset-inline-start:18px;inset-inline-end:auto;
      z-index:9300;
      min-width:230px;
      background:linear-gradient(180deg, rgba(26,21,16,.95) 0%, rgba(35,26,16,.92) 100%);
      backdrop-filter:blur(20px) saturate(180%);
      border:1px solid rgba(212,168,60,.3);
      border-radius:12px;
      box-shadow:0 20px 50px rgba(0,0,0,.4);
      padding:6px;
      color:#f3e9c9;
      overflow:hidden;
    `;
    if (document.documentElement.getAttribute('data-theme') === 'light') {
      menuEl.style.background = 'linear-gradient(180deg, rgba(250,246,234,.96), rgba(243,234,208,.94))';
      menuEl.style.color = '#3a2f15';
    }
    if (document.dir === 'ltr' || document.documentElement.dir === 'ltr') {
      menuEl.style.insetInlineStart = 'auto';
      menuEl.style.insetInlineEnd = '18px';
    }
    const items = [
      { icon:'📢', label:t('إرسال إعلان','Post Announcement'), action: showComposer },
      { icon:'🛡️', label:t('لوحة التحكم','Admin Panel'), action: () => window.ArsanUI?.showAdmin?.() },
      { icon:'👥', label:t('المستخدمون','Users'), action: () => { location.href = 'users.html'; } },
      { icon:'🩺', label:t('وكيل الصيانة','Maintenance Agent'), action: () => window.ArsanMaintenance?.showPanel?.() },
    ];
    items.forEach(it => {
      const row = document.createElement('button');
      row.type = 'button';
      row.style.cssText = `
        display:flex;align-items:center;gap:10px;width:100%;
        padding:10px 12px;border-radius:8px;
        background:transparent;border:none;color:inherit;
        font:inherit;font-size:13px;cursor:pointer;
        text-align:start;
        transition:background .12s;
      `;
      row.innerHTML = `<span style="font-size:16px;width:22px;text-align:center">${it.icon}</span><span>${it.label}</span>`;
      row.addEventListener('mouseenter', () => row.style.background='rgba(212,168,60,.15)');
      row.addEventListener('mouseleave', () => row.style.background='transparent');
      row.addEventListener('click', () => {
        menuEl?.remove(); menuEl = null;
        try { it.action(); } catch(err){ console.warn('admin menu action failed', err); }
      });
      menuEl.appendChild(row);
    });
    document.body.appendChild(menuEl);
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeMenuOutside, { once:true });
    }, 10);
  }
  function closeMenuOutside(e){
    const btn = document.getElementById(BTN_ID);
    if (menuEl && !menuEl.contains(e.target) && !btn?.contains(e.target)) {
      menuEl.remove(); menuEl = null;
    } else if (menuEl) {
      document.addEventListener('click', closeMenuOutside, { once:true });
    }
  }

  // ============ Announcement Composer ============
  async function showComposer(){
    let overlay = document.getElementById('arsan-ann-overlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'arsan-ann-overlay';
    overlay.className = 'arsan-ann-overlay open';
    overlay.innerHTML = `
      <div class="arsan-ann-card" role="dialog" aria-modal="true">
        <div class="arsan-ann-head">
          <h2>${t('إعلان جديد','New Announcement')}</h2>
          <button class="x" type="button" aria-label="Close">✕</button>
        </div>
        <div class="arsan-ann-body">
          <div class="arsan-ann-row">
            <div>
              <label>${t('العنوان','Title')}</label>
              <input id="arsan-ann-title" type="text" placeholder="${t('مثال: تحديث سياسة الأسبوع','e.g. Policy update this week')}" maxlength="120" />
            </div>
          </div>
          <div>
            <label>${t('المحتوى','Message')}</label>
            <textarea id="arsan-ann-body" placeholder="${t('اكتب التفاصيل هنا…','Type the details here…')}" maxlength="600"></textarea>
          </div>
          <div style="margin-top:14px">
            <label>${t('الأولوية','Priority')}</label>
            <div class="arsan-ann-priority" id="arsan-ann-prio">
              <button type="button" data-p="normal" class="active">${t('عادي','Normal')}</button>
              <button type="button" data-p="urgent" class="urgent">${t('عاجل','Urgent')}</button>
            </div>
          </div>
          <div class="arsan-ann-existing" id="arsan-ann-existing">
            <h4>${t('الإعلانات السابقة','Previous Announcements')}</h4>
            <div class="arsan-ann-list"></div>
          </div>
        </div>
        <div class="arsan-ann-foot">
          <button class="cancel" type="button">${t('إلغاء','Cancel')}</button>
          <button class="send" type="button">${t('نشر الإعلان','Publish')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => { overlay.remove(); };
    overlay.querySelector('.x').addEventListener('click', close);
    overlay.querySelector('.cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Priority toggle
    const prioBtns = overlay.querySelectorAll('#arsan-ann-prio button');
    let priority = 'normal';
    prioBtns.forEach(b => b.addEventListener('click', () => {
      prioBtns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      priority = b.dataset.p;
    }));

    // Publish
    overlay.querySelector('.send').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const title = overlay.querySelector('#arsan-ann-title').value.trim();
      const body = overlay.querySelector('#arsan-ann-body').value.trim();
      if (!title) { alert(t('العنوان مطلوب','Title required')); return; }
      btn.disabled = true; btn.textContent = t('جاري النشر…','Publishing…');
      try {
        await window.ArsanNotify.post({ title, body, priority });
        close();
      } catch(err){
        btn.disabled = false; btn.textContent = t('نشر الإعلان','Publish');
        alert(t('تعذّر النشر: ','Failed: ') + (err.message || err));
      }
    });

    // Load existing
    try {
      const list = await (window.ArsanNotify?.loadAll?.() || Promise.resolve([]));
      const wrap = overlay.querySelector('.arsan-ann-list');
      if (!list.length) {
        wrap.innerHTML = `<div style="opacity:.5;font-size:12px;padding:10px 0">${t('لا توجد إعلانات بعد','No announcements yet')}</div>`;
      } else {
        wrap.innerHTML = '';
        list.slice(0,10).forEach(a => {
          const li = document.createElement('div');
          li.className = 'arsan-ann-li';
          const when = new Date(a.ts || Date.now());
          const pad = n => String(n).padStart(2,'0');
          const whenStr = `${when.getFullYear()}-${pad(when.getMonth()+1)}-${pad(when.getDate())} ${pad(when.getHours())}:${pad(when.getMinutes())}`;
          li.innerHTML = `
            <div class="txt">
              <span class="t">${esc(a.title||'')}${a.priority==='urgent'?' <span style="color:#e63946;font-size:10px">●</span>':''}</span>
              <span class="b">${esc(a.body||'')}</span>
              <span class="m">${esc(a.author||'')} · ${whenStr}</span>
            </div>
            <button class="del" title="${t('حذف','Delete')}">✕</button>
          `;
          li.querySelector('.del').addEventListener('click', async () => {
            if (!confirm(t('حذف هذا الإعلان؟','Delete this announcement?'))) return;
            await window.ArsanNotify.remove(a.id);
            li.remove();
          });
          wrap.appendChild(li);
        });
      }
    } catch(_){}
  }

  function esc(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function init(){
    injectStyles();
    createBtn();
    // Re-check visibility periodically (after login)
    setInterval(updateVisibility, 1000);
    // React immediately to auth changes across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'arsan_me' || e.key === 'arsan_token') updateVisibility();
    });
    // React to custom event if app emits one
    window.addEventListener('arsan-auth-change', updateVisibility);
    // Update tooltip on language change
    window.addEventListener('arsan-lang-change', () => {
      const btn = document.getElementById(BTN_ID);
      if (btn) {
        btn.title = t('إدارة المنصّة','Platform Admin');
        btn.setAttribute('aria-label', t('إدارة المنصّة','Platform Admin'));
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ArsanAdminFab = { updateVisibility, showComposer };
})();

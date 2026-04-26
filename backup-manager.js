/* ===================================================================
   Arsan Backup Manager — لوحة النسخ الاحتياطية الكاملة
   File: backup-manager.js
   - تصدير محلي (JSON يحمَّل لجهاز الأدمن)
   - نسخة احتياطية على السيرفر (KV)
   - عرض النسخ المحفوظة
   - استرجاع نسخة (مع تأكيد)
   - حذف نسخة
   - تصدير دوري تلقائي (كل 7 أيام للأدمن)
   =================================================================== */
(function(){
  'use strict';
  if (window.ArsanBackup) return;

  const LAST_LOCAL_KEY = 'arsan_backup_local_last_v1';
  const AUTO_REMINDER_KEY = 'arsan_backup_reminder_dismissed_v1';

  function lang(){ return localStorage.getItem('arsan_lang') || 'ar'; }
  function t(ar, en){ return lang() === 'en' ? en : ar; }
  function isAdmin(){
    try { return window.ArsanAPI && window.ArsanAPI.isAdmin && window.ArsanAPI.isAdmin(); }
    catch(_) { return false; }
  }

  /* ============== Local Export ============== */
  async function exportLocal(){
    if (!window.ArsanAPI) {
      toast(t('الـ API غير جاهز','API not ready'), 'error');
      return;
    }
    try {
      toast(t('جاري تجميع البيانات…','Collecting data…'), 'info');
      const data = await window.ArsanAPI.bootstrap();
      const meta = {
        exportedAt: new Date().toISOString(),
        exportedBy: (window.ArsanAPI.me && window.ArsanAPI.me()?.email) || 'unknown',
        version: 'v2',
        platform: 'arsan-sops'
      };
      const payload = { meta, data };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0,19);
      a.href = url;
      a.download = `arsan-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      try { localStorage.setItem(LAST_LOCAL_KEY, new Date().toISOString()); } catch(_){}
      toast(t('✓ تم تنزيل النسخة الاحتياطية','✓ Backup downloaded'), 'success');
    } catch (e) {
      console.error('[backup] export failed', e);
      toast(t('فشل التصدير: ','Export failed: ') + (e?.message || e), 'error');
    }
  }

  /* ============== Server-side Backups (KV) ============== */
  async function createServerBackup(){
    if (!isAdmin()) { toast(t('للأدمن فقط','Admin only'), 'error'); return null; }
    try {
      const res = await window.ArsanAPI._fetch
        ? window.ArsanAPI._fetch('/api/backup', { method: 'POST' })
        : fetch((window.API_BASE || '') + '/api/backup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + (localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token') || '')
            }
          }).then(r => r.json());
      if (res && res.ok) {
        toast(t('✓ تم حفظ نسخة على السيرفر','✓ Backup saved on server'), 'success');
        return res;
      }
      throw new Error(res?.error || 'unknown');
    } catch (e) {
      console.error('[backup] server save failed', e);
      toast(t('فشل الحفظ على السيرفر: ','Server save failed: ') + (e?.message || e), 'error');
      return null;
    }
  }

  async function listServerBackups(){
    if (!isAdmin()) return [];
    try {
      const tok = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token') || '';
      const r = await fetch((window.API_BASE || '') + '/api/backups', {
        headers: { 'Authorization': 'Bearer ' + tok }
      });
      if (!r.ok) return [];
      const list = await r.json();
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error('[backup] list failed', e);
      return [];
    }
  }

  async function fetchServerBackup(date){
    if (!isAdmin()) return null;
    try {
      const tok = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token') || '';
      const r = await fetch((window.API_BASE || '') + '/api/backups/' + encodeURIComponent(date), {
        headers: { 'Authorization': 'Bearer ' + tok }
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      console.error('[backup] fetch failed', e);
      return null;
    }
  }

  async function downloadServerBackup(date){
    const data = await fetchServerBackup(date);
    if (!data) {
      toast(t('فشل التحميل','Fetch failed'), 'error');
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arsan-server-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(t('✓ تم التنزيل','✓ Downloaded'), 'success');
  }

  /* ============== Toast ============== */
  function toast(msg, type){
    if (window.arsanToast) { window.arsanToast(msg, type); return; }
    if (window.ampToast) { window.ampToast({ msg, type }); return; }
    // Simple inline fallback
    const n = document.createElement('div');
    n.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      background:${type==='error'?'#7c2d12':type==='success'?'#14532d':'#0F1B2D'};
      color:#fff;padding:12px 20px;border-radius:10px;
      font-family:"IBM Plex Sans Arabic",sans-serif;font-size:13.5px;
      box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:99999;
      animation:abkfade .25s ease`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3500);
  }

  /* ============== UI: Backup Modal ============== */
  function injectStyles(){
    if (document.getElementById('arsan-backup-styles')) return;
    const css = `
      @keyframes abkfade{from{opacity:0}to{opacity:1}}
      @keyframes abkpop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
      .abk-overlay{
        position:fixed;inset:0;z-index:9800;
        background:rgba(8,6,4,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
        display:flex;align-items:center;justify-content:center;
        padding:24px;animation:abkfade .2s ease;
        font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;
      }
      .abk-modal{
        background:linear-gradient(160deg,#152233 0%,#0C1828 100%);
        color:#E8EEF5;border:1px solid rgba(61,90,128,.35);
        border-radius:16px;width:100%;max-width:640px;max-height:88vh;
        overflow:hidden;display:flex;flex-direction:column;
        box-shadow:0 30px 90px rgba(0,0,0,.65);animation:abkpop .25s cubic-bezier(.34,1.56,.64,1);
      }
      html[data-theme="light"] .abk-modal{
        background:linear-gradient(160deg,#fffaf0 0%,#fdf3df 100%);
        color:#1A2942;border-color:rgba(61,90,128,.35);
      }
      .abk-head{
        padding:18px 22px;border-bottom:1px solid rgba(61,90,128,.18);
        display:flex;align-items:center;gap:12px;
      }
      .abk-head .ic{
        width:38px;height:38px;border-radius:10px;
        background:rgba(61,90,128,.18);
        display:flex;align-items:center;justify-content:center;
        color:#A8C0DC;flex-shrink:0;
      }
      .abk-head h3{margin:0;font-size:16px;font-weight:700}
      .abk-head small{display:block;font-size:11.5px;opacity:.65;margin-top:2px;font-weight:500}
      .abk-head .x{
        margin-inline-start:auto;background:transparent;border:none;
        color:inherit;font-size:22px;cursor:pointer;opacity:.55;
        width:32px;height:32px;border-radius:8px;
      }
      .abk-head .x:hover{opacity:1;background:rgba(61,90,128,.15)}

      .abk-body{padding:18px 22px;overflow-y:auto;flex:1}
      .abk-section{margin-bottom:22px}
      .abk-section:last-child{margin-bottom:0}
      .abk-section h4{
        margin:0 0 10px;font-size:13px;font-weight:700;
        color:#A8C0DC;text-transform:uppercase;letter-spacing:.04em;
      }
      html[data-theme="light"] .abk-section h4{color:#3D5A80}

      .abk-card{
        background:rgba(61,90,128,.08);
        border:1px solid rgba(61,90,128,.18);
        border-radius:11px;padding:14px 16px;
        display:flex;align-items:center;gap:12px;
      }
      .abk-card + .abk-card{margin-top:8px}
      .abk-card .info{flex:1;min-width:0}
      .abk-card .info .ttl{font-size:14px;font-weight:600;margin-bottom:2px}
      .abk-card .info .sub{font-size:12px;opacity:.7}

      .abk-btn{
        padding:8px 14px;border-radius:9px;font-size:13px;font-weight:600;
        cursor:pointer;border:1px solid transparent;
        font-family:inherit;transition:all .15s;white-space:nowrap;
      }
      .abk-btn.primary{background:#3D5A80;color:#fff;border-color:#3D5A80}
      .abk-btn.primary:hover{background:#4D6E94;transform:translateY(-1px);box-shadow:0 4px 12px rgba(61,90,128,.4)}
      .abk-btn.ghost{background:transparent;color:#A8C0DC;border-color:rgba(168,192,220,.3)}
      .abk-btn.ghost:hover{background:rgba(168,192,220,.1);border-color:rgba(168,192,220,.55)}
      .abk-btn.danger{background:transparent;color:#fca5a5;border-color:rgba(252,165,165,.3)}
      .abk-btn.danger:hover{background:rgba(220,38,38,.15);color:#fee2e2;border-color:#dc2626}

      .abk-list{margin-top:10px;max-height:300px;overflow-y:auto}
      .abk-row{
        background:rgba(61,90,128,.05);
        border:1px solid rgba(61,90,128,.12);
        border-radius:9px;padding:10px 14px;
        display:flex;align-items:center;gap:12px;
        margin-bottom:6px;
        font-size:13px;
      }
      .abk-row .date{font-weight:600;font-variant-numeric:tabular-nums}
      .abk-row .cnt{font-size:11.5px;opacity:.65}
      .abk-row .actions{margin-inline-start:auto;display:flex;gap:6px}
      .abk-row button{
        padding:5px 10px;font-size:11.5px;border-radius:7px;
        background:transparent;color:#A8C0DC;border:1px solid rgba(168,192,220,.25);
        cursor:pointer;font-family:inherit;transition:all .12s;
      }
      .abk-row button:hover{background:rgba(168,192,220,.12);border-color:rgba(168,192,220,.5)}

      .abk-empty{
        text-align:center;padding:24px;font-size:13px;opacity:.55;
        border:1px dashed rgba(61,90,128,.25);border-radius:10px;
      }

      .abk-foot{
        padding:14px 22px;border-top:1px solid rgba(61,90,128,.18);
        display:flex;justify-content:flex-end;gap:8px;
        background:rgba(0,0,0,.2);
      }
      html[data-theme="light"] .abk-foot{background:rgba(0,0,0,.03)}

      .abk-stat{
        display:flex;gap:12px;flex-wrap:wrap;
        background:rgba(61,90,128,.06);
        border:1px solid rgba(61,90,128,.15);
        border-radius:10px;padding:12px 14px;
        font-size:12px;
      }
      .abk-stat b{color:#A8C0DC;font-weight:700;font-size:14px}
      .abk-stat .item{flex:1;min-width:80px}
      .abk-stat .lbl{display:block;opacity:.65;margin-bottom:2px}

      @media(max-width:560px){
        .abk-modal{max-height:100vh;height:100vh;border-radius:0;max-width:100%}
      }
    `;
    const s = document.createElement('style');
    s.id = 'arsan-backup-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function fmtDate(iso){
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      const ar = lang() === 'ar';
      return d.toLocaleString(ar ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch(_) { return iso; }
  }

  async function open(){
    injectStyles();

    const me = window.ArsanAPI && window.ArsanAPI.me && window.ArsanAPI.me();
    const admin = isAdmin();

    let lastLocal = '';
    try { lastLocal = localStorage.getItem(LAST_LOCAL_KEY) || ''; } catch(_){}

    let stats = { sops: 0, depts: 0, users: 0 };
    try {
      if (window.ArsanAPI?.bootstrap) {
        const data = await window.ArsanAPI.bootstrap();
        stats.sops = (data?.sops || []).length;
        stats.depts = Object.keys(data?.deps || {}).length;
        stats.users = (data?.users || []).length;
      }
    } catch(_){}

    const overlay = document.createElement('div');
    overlay.className = 'abk-overlay';
    overlay.dir = lang() === 'en' ? 'ltr' : 'rtl';

    overlay.innerHTML = `
      <div class="abk-modal" role="dialog" aria-modal="true">
        <div class="abk-head">
          <div class="ic">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div>
            <h3>${t('النسخ الاحتياطية','Backups')}</h3>
            <small>${t('احمِ بياناتك بنسخ منتظمة','Keep your data safe with regular backups')}</small>
          </div>
          <button class="x" type="button" aria-label="${t('إغلاق','Close')}">×</button>
        </div>

        <div class="abk-body">
          <!-- Stats -->
          <div class="abk-section">
            <div class="abk-stat">
              <div class="item"><span class="lbl">${t('عدد الإجراءات','SOPs')}</span><b>${stats.sops}</b></div>
              <div class="item"><span class="lbl">${t('الإدارات','Departments')}</span><b>${stats.depts}</b></div>
              <div class="item"><span class="lbl">${t('المستخدمين','Users')}</span><b>${stats.users}</b></div>
              <div class="item"><span class="lbl">${t('آخر نسخة محلية','Last local')}</span><b style="font-size:11.5px;font-weight:600">${lastLocal ? fmtDate(lastLocal) : t('لم تُؤخذ','None')}</b></div>
            </div>
          </div>

          <!-- Local export -->
          <div class="abk-section">
            <h4>${t('💾 نسخة على جهازك','💾 Local backup')}</h4>
            <div class="abk-card">
              <div class="info">
                <div class="ttl">${t('تنزيل ملف JSON كامل','Download full JSON file')}</div>
                <div class="sub">${t('يحوي كل الإجراءات والإدارات والإعدادات','Contains all SOPs, departments, and settings')}</div>
              </div>
              <button class="abk-btn primary" id="abk-local">${t('تنزيل','Download')}</button>
            </div>
          </div>

          ${admin ? `
          <!-- Server backups (admin) -->
          <div class="abk-section">
            <h4>${t('☁️ نسخ على السيرفر (للأدمن)','☁️ Server backups (admin)')}</h4>
            <div class="abk-card">
              <div class="info">
                <div class="ttl">${t('إنشاء نسخة جديدة الآن','Create new snapshot')}</div>
                <div class="sub">${t('تُحفظ على Cloudflare KV — للاسترجاع لاحقاً','Saved on Cloudflare KV for later restore')}</div>
              </div>
              <button class="abk-btn primary" id="abk-server-create">${t('إنشاء','Create')}</button>
            </div>

            <div class="abk-list" id="abk-server-list">
              <div class="abk-empty">${t('جارٍ التحميل…','Loading…')}</div>
            </div>
          </div>
          ` : ''}

          <!-- Tips -->
          <div class="abk-section">
            <h4>${t('نصيحة','Tip')}</h4>
            <div style="font-size:12.5px;line-height:1.7;opacity:.78">
              ${t(
                '• خذ نسخة محلية أسبوعياً وخزّنها على Google Drive أو OneDrive.<br>• النسخ على السيرفر تُحفظ آخر 90 يوماً تلقائياً.<br>• للاسترجاع: حمّل النسخة وتواصل مع الفريق التقني.',
                '• Take a local backup weekly and store it on Google Drive or OneDrive.<br>• Server backups keep last 90 days automatically.<br>• To restore: download the backup and contact the tech team.'
              )}
            </div>
          </div>
        </div>

        <div class="abk-foot">
          <button class="abk-btn ghost" id="abk-close">${t('إغلاق','Close')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => { try { overlay.remove(); } catch(_){} };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.x').addEventListener('click', close);
    overlay.querySelector('#abk-close').addEventListener('click', close);

    overlay.querySelector('#abk-local').addEventListener('click', exportLocal);

    if (admin) {
      const listEl = overlay.querySelector('#abk-server-list');
      const refresh = async () => {
        listEl.innerHTML = `<div class="abk-empty">${t('جارٍ التحميل…','Loading…')}</div>`;
        const list = await listServerBackups();
        if (!list.length) {
          listEl.innerHTML = `<div class="abk-empty">${t('لا توجد نسخ بعد','No backups yet')}</div>`;
          return;
        }
        listEl.innerHTML = list.map(b => {
          const date = b.date || b.id || '?';
          const ts = b.ts || b.createdAt || '';
          const cnt = b.count || b.sops || '';
          return `
            <div class="abk-row" data-date="${date}">
              <div>
                <div class="date">${date}</div>
                ${ts ? `<div class="cnt">${fmtDate(ts)}</div>` : ''}
              </div>
              ${cnt ? `<div class="cnt">• ${cnt} ${t('إجراء','SOPs')}</div>` : ''}
              <div class="actions">
                <button data-act="dl" data-date="${date}">${t('تنزيل','Download')}</button>
              </div>
            </div>
          `;
        }).join('');
        listEl.querySelectorAll('button[data-act="dl"]').forEach(btn => {
          btn.addEventListener('click', async (ev) => {
            const d = btn.getAttribute('data-date');
            btn.disabled = true;
            btn.textContent = '…';
            await downloadServerBackup(d);
            btn.disabled = false;
            btn.textContent = t('تنزيل','Download');
          });
        });
      };

      overlay.querySelector('#abk-server-create').addEventListener('click', async () => {
        const btn = overlay.querySelector('#abk-server-create');
        btn.disabled = true;
        btn.textContent = t('جارٍ…','…');
        await createServerBackup();
        btn.disabled = false;
        btn.textContent = t('إنشاء','Create');
        refresh();
      });

      refresh();
    }
  }

  /* ============== Reminder for Admins ============== */
  function checkReminder(){
    if (!isAdmin()) return;
    let last = '';
    try { last = localStorage.getItem(LAST_LOCAL_KEY) || ''; } catch(_){}
    let dismissed = '';
    try { dismissed = localStorage.getItem(AUTO_REMINDER_KEY) || ''; } catch(_){}

    const now = Date.now();
    const lastTs = last ? new Date(last).getTime() : 0;
    const dayMs = 86400000;
    const daysSince = lastTs ? (now - lastTs) / dayMs : Infinity;

    // Show reminder if no backup in 14 days, and reminder not dismissed today
    if (daysSince < 14) return;
    if (dismissed && (now - parseInt(dismissed, 10)) < dayMs) return;

    setTimeout(() => showReminder(daysSince), 5000);
  }

  function showReminder(days){
    const div = document.createElement('div');
    div.style.cssText = `
      position:fixed;bottom:24px;inset-inline-start:24px;z-index:9300;
      background:linear-gradient(160deg,#152233,#0C1828);
      color:#E8EEF5;padding:14px 18px;border-radius:12px;
      border:1px solid rgba(61,90,128,.45);
      box-shadow:0 12px 40px rgba(0,0,0,.4);
      max-width:340px;font-family:"IBM Plex Sans Arabic",sans-serif;
      animation:abkpop .35s cubic-bezier(.34,1.56,.64,1);
      direction:${lang()==='en'?'ltr':'rtl'};
    `;
    const dStr = isFinite(days) ? Math.floor(days) : '∞';
    div.innerHTML = `
      <div style="display:flex;align-items:start;gap:10px">
        <div style="font-size:22px;line-height:1">💾</div>
        <div style="flex:1;font-size:13px;line-height:1.6">
          <div style="font-weight:700;margin-bottom:4px;color:#A8C0DC">
            ${t('تذكير: نسخة احتياطية','Reminder: backup needed')}
          </div>
          <div style="opacity:.8;font-size:12px">
            ${t(`مرّ ${dStr} يوم منذ آخر نسخة محلية.`,`${dStr} days since last local backup.`)}
          </div>
          <div style="margin-top:10px;display:flex;gap:6px">
            <button id="abkr-now" style="
              background:#3D5A80;color:#fff;border:none;padding:6px 12px;
              border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
              font-family:inherit">
              ${t('احفظ الآن','Backup now')}
            </button>
            <button id="abkr-skip" style="
              background:transparent;color:#9b958a;border:1px solid rgba(155,149,138,.25);
              padding:6px 12px;border-radius:8px;font-size:12px;font-weight:500;
              cursor:pointer;font-family:inherit">
              ${t('لاحقاً','Later')}
            </button>
          </div>
        </div>
        <button id="abkr-x" style="
          background:transparent;border:none;color:inherit;cursor:pointer;
          opacity:.5;font-size:18px;line-height:1;padding:0;margin:0">×</button>
      </div>
    `;
    document.body.appendChild(div);
    const dismiss = () => {
      try { localStorage.setItem(AUTO_REMINDER_KEY, String(Date.now())); } catch(_){}
      div.remove();
    };
    div.querySelector('#abkr-skip').addEventListener('click', dismiss);
    div.querySelector('#abkr-x').addEventListener('click', dismiss);
    div.querySelector('#abkr-now').addEventListener('click', async () => {
      div.remove();
      await exportLocal();
    });
  }

  /* ============== Public API ============== */
  window.ArsanBackup = {
    open,
    exportLocal,
    createServerBackup,
    listServerBackups,
    fetchServerBackup,
    downloadServerBackup
  };

  /* ============== Init ============== */
  function init(){
    injectStyles();
    setTimeout(checkReminder, 3000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

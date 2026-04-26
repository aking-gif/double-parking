/**
 * home-dashboard.js — لوحة إحصائيات للصفحة الرئيسية
 * يضيف بطاقة موجزة فوق شبكة الإدارات
 */
(function(){
  'use strict';
  if (window.ArsanHomeDash) return;
  const API = () => window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const tok = () => localStorage.getItem('arsan_token')||'';
  const me  = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch { return null; } };
  async function api(p){
    const r = await fetch(API()+p, {headers: tok()?{Authorization:'Bearer '+tok()}:{}});
    return r.json();
  }
  // Lucide-style icons (stroke-only)
  const ICON = {
    docs:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>`,
    check:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    mail:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    stamp:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17h16v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.66 0-3 1-3 3s1 1.5 1 3.5V13"/></svg>`,
    search:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
  };

  function injectStyles(){
    if (document.getElementById('ahd-styles')) return;
    const s=document.createElement('style');s.id='ahd-styles';
    s.textContent=`
.ahd{margin:18px auto 6px;max-width:1100px;padding:0 20px;direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif}
.ahd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.ahd-card .lbl{font-size:11px;color:var(--ink-2,#9b958a);font-weight:600;letter-spacing:.5px;margin-bottom:8px;display:flex;align-items:center;gap:7px}
.ahd-card .lbl svg{width:14px;height:14px;flex-shrink:0;opacity:.85}
.ahd-card{background:linear-gradient(135deg, rgba(61,90,128,.10), rgba(152,180,212,.04));backdrop-filter:blur(10px);border-radius:14px;padding:16px;border:1px solid var(--line,rgba(61,90,128,.18));box-shadow:0 4px 14px rgba(0,0,0,.04)}
html[data-theme="dark"] .ahd-card{background:linear-gradient(135deg, rgba(61,90,128,.16), rgba(26,21,16,.4));border-color:rgba(61,90,128,.25)}
.ahd-card .num{font-size:28px;font-weight:800;color:var(--ink-1,#0f172a);line-height:1}
.ahd-card .sub{font-size:11px;color:var(--ink-2,#94a3b8);margin-top:6px}
.ahd-card.clickable{cursor:pointer;transition:transform .15s}
.ahd-card.clickable:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
.ahd-quick{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;justify-content:flex-start}
.ahd-quick button{background:linear-gradient(135deg, rgba(61,90,128,.10), rgba(152,180,212,.04));border:1px solid var(--line,rgba(61,90,128,.22));padding:8px 14px;border-radius:999px;cursor:pointer;font-size:13px;font-weight:600;color:var(--ink-1,#0f172a);font-family:inherit;display:inline-flex;align-items:center;gap:7px;transition:transform .15s, box-shadow .15s, border-color .15s}
html[data-theme="dark"] .ahd-quick button{background:linear-gradient(135deg, rgba(61,90,128,.16), rgba(26,21,16,.4));border-color:rgba(61,90,128,.3);color:#E8EEF5}
.ahd-quick button svg{width:14px;height:14px;opacity:.85}
.ahd-quick button:hover{transform:translateY(-1px);border-color:var(--brand,rgba(61,90,128,.5));box-shadow:0 4px 12px rgba(0,0,0,.08)}
.ahd-quick button kbd{background:var(--bg,rgba(0,0,0,.06));padding:2px 7px;border-radius:5px;font-family:"SFMono-Regular",ui-monospace,monospace;font-size:10.5px;font-weight:700;letter-spacing:.5px;color:var(--ink-2,#64748b);border:1px solid var(--line,rgba(0,0,0,.05))}
.ahd-tip{margin-top:14px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:10px;padding:10px 14px;font-size:12px;color:#92400e}
.ahd-tip kbd{background:rgba(0,0,0,.08);padding:1px 6px;border-radius:4px;font-family:monospace;font-size:11px}
`;document.head.appendChild(s);
  }
  async function mount(){
    if (!me()) return;
    injectStyles();
    // ابحث عن مكان الإدراج
    const grid = document.querySelector('.dept-grid, #deptGrid, [data-dept-grid]');
    if (!grid) return;
    if (document.querySelector('.ahd')) return;
    const wrap = document.createElement('div');
    wrap.className='ahd';
    wrap.innerHTML = `
      <div class="ahd-grid">
        <div class="ahd-card"><div class="lbl">${ICON.docs} إجمالي الإجراءات</div><div class="num" id="ahd-sops">…</div><div class="sub">عبر كل الإدارات</div></div>
        <div class="ahd-card clickable" onclick="window.ArsanTasks?.open()"><div class="lbl">${ICON.check} مهامي المفتوحة</div><div class="num" id="ahd-tasks">…</div><div class="sub">انقر للعرض</div></div>
        <div class="ahd-card clickable" onclick="window.ArsanMessaging?.open()"><div class="lbl">${ICON.mail} رسائل غير مقروءة</div><div class="num" id="ahd-msgs">…</div><div class="sub">من إدارات أخرى</div></div>
        <div class="ahd-card clickable" onclick="window.ArsanApprovals?.open()"><div class="lbl">${ICON.stamp} طلبات اعتماد</div><div class="num" id="ahd-app">…</div><div class="sub">معلّقة</div></div>
      </div>
      <div class="ahd-quick">
        <button onclick="window.ArsanCmdK?.open()">${ICON.search} <span>بحث شامل</span> <kbd>Ctrl+K</kbd></button>
        <button onclick="window.ArsanTasks?.open()">${ICON.check} <span>المهام</span></button>
        <button onclick="window.ArsanMessaging?.open()">${ICON.mail} <span>الرسائل</span></button>
        <button onclick="window.ArsanApprovals?.open()">${ICON.stamp} <span>الاعتماد</span></button>
      </div>
    `;
    grid.parentNode.insertBefore(wrap, grid);
    // اجلب الأرقام
    try {
      const boot = await api('/api/bootstrap');
      let total = 0;
      Object.values(boot.sops||{}).forEach(d => total += Object.keys(d||{}).length);
      document.getElementById('ahd-sops').textContent = total;
    } catch { document.getElementById('ahd-sops').textContent='—'; }
    try {
      const myEmail = me().email;
      const tasks = await api('/api/tasks?assignee='+encodeURIComponent(myEmail));
      const open = (Array.isArray(tasks)?tasks:[]).filter(t=>t.status!=='done'&&t.status!=='cancelled').length;
      document.getElementById('ahd-tasks').textContent = open;
    } catch { document.getElementById('ahd-tasks').textContent='—'; }
    try {
      const myDepts = me().departments || [];
      let unread = 0;
      for (const d of myDepts){
        const inbox = await api('/api/messages?dept='+encodeURIComponent(d));
        if (Array.isArray(inbox)) unread += inbox.filter(m=>!m.read).length;
      }
      document.getElementById('ahd-msgs').textContent = unread;
    } catch { document.getElementById('ahd-msgs').textContent='—'; }
    try {
      const apps = await api('/api/approvals?status=pending');
      document.getElementById('ahd-app').textContent = Array.isArray(apps)?apps.length:0;
    } catch { document.getElementById('ahd-app').textContent='—'; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 600));
  else setTimeout(mount, 600);
  window.ArsanHomeDash = { mount };
})();

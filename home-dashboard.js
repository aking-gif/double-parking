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
  function injectStyles(){
    if (document.getElementById('ahd-styles')) return;
    const s=document.createElement('style');s.id='ahd-styles';
    s.textContent=`
.ahd{margin:18px auto 6px;max-width:1100px;padding:0 20px;direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif}
.ahd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.ahd-card{background:rgba(255,255,255,.94);backdrop-filter:blur(10px);border-radius:14px;padding:16px;border:1px solid rgba(0,0,0,.05);box-shadow:0 4px 14px rgba(0,0,0,.04)}
.ahd-card .lbl{font-size:11px;color:#64748b;font-weight:600;letter-spacing:.5px;margin-bottom:6px;display:flex;align-items:center;gap:5px}
.ahd-card .num{font-size:28px;font-weight:800;color:#0f172a;line-height:1}
.ahd-card .sub{font-size:11px;color:#94a3b8;margin-top:4px}
.ahd-card.clickable{cursor:pointer;transition:transform .15s}
.ahd-card.clickable:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
.ahd-quick{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.ahd-quick button{background:rgba(255,255,255,.85);border:1px solid rgba(0,0,0,.06);padding:8px 14px;border-radius:999px;cursor:pointer;font-size:13px;font-weight:600;color:#0f172a;font-family:inherit;display:flex;align-items:center;gap:6px}
.ahd-quick button:hover{background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.06)}
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
        <div class="ahd-card"><div class="lbl">📋 إجمالي الإجراءات</div><div class="num" id="ahd-sops">…</div><div class="sub">عبر كل الإدارات</div></div>
        <div class="ahd-card clickable" onclick="window.ArsanTasks?.open()"><div class="lbl">✅ مهامي المفتوحة</div><div class="num" id="ahd-tasks">…</div><div class="sub">انقر للعرض</div></div>
        <div class="ahd-card clickable" onclick="window.ArsanMessaging?.open()"><div class="lbl">📨 رسائل غير مقروءة</div><div class="num" id="ahd-msgs">…</div><div class="sub">من إدارات أخرى</div></div>
        <div class="ahd-card clickable" onclick="window.ArsanApprovals?.open()"><div class="lbl">📋 طلبات اعتماد</div><div class="num" id="ahd-app">…</div><div class="sub">معلّقة</div></div>
      </div>
      <div class="ahd-quick">
        <button onclick="window.ArsanCmdK?.open()">🔍 بحث شامل <kbd style="font-size:10px;background:#f1f5f9;padding:1px 5px;border-radius:3px;margin-right:4px">Ctrl+K</kbd></button>
        <button onclick="window.ArsanTasks?.open()">✅ المهام</button>
        <button onclick="window.ArsanMessaging?.open()">📨 الرسائل</button>
        <button onclick="window.ArsanApprovals?.open()">📋 الاعتماد</button>
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

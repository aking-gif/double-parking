/**
 * cmdk.js — بحث شامل (Cmd+K / Ctrl+K)
 * يبحث في: SOPs (كل الإدارات) + المستخدمين + المهام + الإدارات
 */
(function(){
  'use strict';
  if (window.ArsanCmdK) return;
  const API = () => window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const tok = () => localStorage.getItem('arsan_token')||'';
  async function api(p){
    const r = await fetch(API()+p, {headers: tok()?{Authorization:'Bearer '+tok()}:{}});
    return r.json();
  }
  function injectStyles(){
    if (document.getElementById('ack-styles')) return;
    const s=document.createElement('style');s.id='ack-styles';
    s.textContent=`
.ack-bd{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(8px);z-index:99995;display:flex;align-items:flex-start;justify-content:center;padding:80px 20px 20px;direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif}
.ack-modal{background:#fff;border-radius:14px;box-shadow:0 25px 60px rgba(0,0,0,.3);width:min(640px,100%);max-height:70vh;display:flex;flex-direction:column;overflow:hidden}
.ack-search{padding:14px 18px;border-bottom:1px solid #eef2f7;display:flex;align-items:center;gap:10px}
.ack-search input{flex:1;border:0;outline:none;font-size:16px;font-family:inherit}
.ack-kbd{background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:6px;font-size:11px;font-family:monospace}
.ack-list{flex:1;overflow-y:auto;padding:6px}
.ack-section{padding:8px 14px 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
.ack-row{padding:10px 14px;border-radius:8px;cursor:pointer;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center}
.ack-row:hover,.ack-row.active{background:#f1f5f9}
.ack-row .ic{font-size:18px}
.ack-row .t{font-size:14px;color:#0f172a;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ack-row .meta{font-size:11px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ack-row .tag{font-size:10px;color:#64748b;background:#f1f5f9;padding:2px 6px;border-radius:4px}
.ack-empty{padding:30px;text-align:center;color:#94a3b8;font-size:13px}
`;document.head.appendChild(s);
  }
  function escape(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  let state = { open:false, query:'', results:[], idx:0, allSops:null };

  async function loadAll(){
    if (state.allSops) return;
    try {
      const boot = await api('/api/bootstrap');
      state.allSops = boot.sops || {};
      state.allUsers = Array.isArray(boot.users) ? boot.users : [];
    } catch { state.allSops = {}; state.allUsers = []; }
  }

  function search(q){
    q = q.toLowerCase().trim();
    const out = [];
    if (!q){ state.results = []; return; }
    // SOPs
    Object.keys(state.allSops||{}).forEach(dept => {
      const sops = state.allSops[dept] || {};
      Object.keys(sops).forEach(code => {
        const sop = sops[code];
        const blob = (code+' '+(sop.title||'')+' '+(sop.purpose||'')).toLowerCase();
        if (blob.includes(q)) {
          out.push({ kind:'sop', icon:'📋', t:sop.title||code, meta:`${dept} / ${code}`, action:()=>{
            close();
            location.href = `dashboard.html?dept=${dept}&open=${encodeURIComponent(code)}`;
          }});
        }
      });
    });
    // Departments
    (window.DEPARTMENTS_CONFIG||[]).forEach(d => {
      if ((d.name+' '+d.id).toLowerCase().includes(q)) {
        out.push({ kind:'dept', icon:d.icon||'🗂️', t:d.name, meta:'إدارة', action:()=>{
          close(); location.href=`dashboard.html?dept=${d.id}`;
        }});
      }
    });
    // Users
    (state.allUsers||[]).forEach(u => {
      if ((u.email+' '+(u.name||'')).toLowerCase().includes(q)){
        out.push({ kind:'user', icon:'👤', t:u.email, meta:u.role||'', action:()=>{ close(); location.href='users.html'; }});
      }
    });
    // Quick actions
    const quick = [
      {t:'إدارة المستخدمين', icon:'👥', q:['user','مستخدم'], a:()=>location.href='users.html'},
      {t:'فتح المهام', icon:'✅', q:['task','مهام','مهمة'], a:()=>window.ArsanTasks?.open()},
      {t:'مركز الرسائل', icon:'📨', q:['message','رسائل','رسالة'], a:()=>window.ArsanMessaging?.open()},
      {t:'سجل التعديلات', icon:'📜', q:['audit','سجل','تعديل'], a:()=>window.ArsanAudit?.open()},
      {t:'طلبات الاعتماد', icon:'📋', q:['approval','اعتماد'], a:()=>window.ArsanApprovals?.open()},
      {t:'Webhooks', icon:'🔌', q:['webhook','تكامل'], a:()=>window.ArsanWebhooks?.open()}
    ];
    quick.forEach(qa => {
      if (qa.q.some(k=>q.includes(k.toLowerCase())) || qa.t.toLowerCase().includes(q)){
        out.push({kind:'action', icon:qa.icon, t:qa.t, meta:'إجراء سريع', action:()=>{close();qa.a();}});
      }
    });
    state.results = out.slice(0, 30);
    state.idx = 0;
  }

  function render(){
    let m = document.querySelector('.ack-bd');
    if (!state.open){ m?.remove(); return; }
    if (!m){
      m = document.createElement('div'); m.className='ack-bd';
      m.addEventListener('click', e => { if(e.target===m) close(); });
      document.body.appendChild(m);
    }
    const groups = { sop:[], dept:[], user:[], action:[] };
    state.results.forEach(r => groups[r.kind]?.push(r));
    let idx = 0;
    const renderGroup = (label, list) => {
      if (!list.length) return '';
      return `<div class="ack-section">${label}</div>` + list.map(r => {
        const i = idx++;
        return `<div class="ack-row ${i===state.idx?'active':''}" data-i="${i}">
          <span class="ic">${r.icon}</span>
          <div><div class="t">${escape(r.t)}</div><div class="meta">${escape(r.meta)}</div></div>
          <span class="tag">↵</span>
        </div>`;
      }).join('');
    };
    m.innerHTML = `
      <div class="ack-modal" onclick="event.stopPropagation()">
        <div class="ack-search">
          <span style="font-size:18px">🔍</span>
          <input id="ack-q" placeholder="ابحث في الإجراءات، الإدارات، المستخدمين..." value="${escape(state.query)}">
          <span class="ack-kbd">Esc</span>
        </div>
        <div class="ack-list">
          ${state.results.length===0 ? (state.query?'<div class="ack-empty">لا توجد نتائج</div>':'<div class="ack-empty">ابدأ بالكتابة...</div>') :
            renderGroup('الإجراءات', groups.sop) +
            renderGroup('الإدارات', groups.dept) +
            renderGroup('المستخدمون', groups.user) +
            renderGroup('إجراءات سريعة', groups.action)
          }
        </div>
      </div>`;
    const inp = m.querySelector('#ack-q');
    setTimeout(()=>inp?.focus(), 10);
    inp.oninput = e => { state.query=e.target.value; search(state.query); render(); setTimeout(()=>m.querySelector('#ack-q')?.focus(),0); };
    inp.onkeydown = e => {
      if (e.key==='ArrowDown'){ e.preventDefault(); state.idx=Math.min(state.idx+1,state.results.length-1); render(); setTimeout(()=>m.querySelector('#ack-q')?.focus(),0); }
      else if (e.key==='ArrowUp'){ e.preventDefault(); state.idx=Math.max(state.idx-1,0); render(); setTimeout(()=>m.querySelector('#ack-q')?.focus(),0); }
      else if (e.key==='Enter'){ e.preventDefault(); state.results[state.idx]?.action?.(); }
      else if (e.key==='Escape'){ close(); }
    };
    m.querySelectorAll('.ack-row').forEach(row => {
      row.onclick = () => { state.results[+row.dataset.i]?.action?.(); };
    });
  }
  async function open(){
    injectStyles();
    state.open=true; state.query=''; state.results=[]; state.idx=0;
    render();
    await loadAll();
  }
  function close(){ state.open=false; render(); }
  // hotkey
  document.addEventListener('keydown', e => {
    if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){
      e.preventDefault();
      state.open ? close() : open();
    }
  });
  window.ArsanCmdK = { open, close };
})();

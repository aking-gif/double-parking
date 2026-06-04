/* =================================================================
   ARSANN — INTEGRATIONS HUB LOGIC
   ================================================================= */
(function(){
'use strict';

const STORAGE_KEY = 'arsan_integrations_v1';
const FLOWS_KEY = 'arsan_flows_v1';
const API = window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';

/* ----------------------------------------------------------------
   CATALOG — كل التكاملات المتاحة
---------------------------------------------------------------- */
const CATALOG = [
  // ===== الإنتاجية =====
  {
    id:'gmail', cat:'prod',
    name:'Gmail', sub:'GOOGLE WORKSPACE',
    color:'#EA4335', logo:'gmail',
    desc:'اربط حسابك في Gmail لإرسال إيميلات من المنصة، تحويل الإيميلات لمهام، وتوليد ملخصات تلقائية.',
    tags:['Email','OAuth','Personal'],
    auth:'oauth', scope:'personal',
    events:['mail.received','mail.sent','mail.starred'],
    capabilities:['قراءة وإرسال','تحويل إلى مهام','تنبيهات ذكية','قوالب جاهزة']
  },
  {
    id:'gcal', cat:'prod',
    name:'Google Calendar', sub:'GOOGLE WORKSPACE',
    color:'#4285F4', logo:'gcal',
    desc:'مزامنة الاجتماعات والمواعيد. كل اجتماع في الـ Spine يصبح حدث في Google Calendar تلقائياً.',
    tags:['Calendar','OAuth','Personal'],
    auth:'oauth', scope:'personal',
    events:['event.created','event.updated','event.starting'],
    capabilities:['مزامنة ثنائية','إرسال دعوات','تذكيرات تلقائية','مواعيد متكررة']
  },
  {
    id:'gdrive', cat:'store',
    name:'Google Drive', sub:'GOOGLE WORKSPACE',
    color:'#0F9D58', logo:'gdrive',
    desc:'استخدم Drive كمستودع وثائق للـ Vault. روابط آمنة، صلاحيات تلقائية، ومعاينة داخل المنصة.',
    tags:['Storage','OAuth','Personal'],
    auth:'oauth', scope:'personal',
    capabilities:['رفع ومشاركة','مزامنة Vault','معاينة Inline','صلاحيات حسب الإدارة']
  },
  {
    id:'gdocs', cat:'prod',
    name:'Google Docs', sub:'GOOGLE WORKSPACE',
    color:'#4285F4', logo:'gdocs',
    desc:'تحرير الإجراءات (SOPs) في Google Docs مباشرة. التغييرات تُحفظ تلقائياً في الـ Spine.',
    tags:['Documents','OAuth','Personal'],
    auth:'oauth', scope:'personal',
    capabilities:['تحرير مباشر','مزامنة عكسية','نسخ وقوالب','تتبع التغييرات']
  },

  // ===== الاتصال =====
  {
    id:'outlook', cat:'comm',
    name:'Outlook + Calendar', sub:'MICROSOFT 365',
    color:'#0078D4', logo:'outlook',
    desc:'تكامل كامل مع Outlook 365 — البريد، التقويم، والاجتماعات في Teams. بديل Google Workspace.',
    tags:['Email','Calendar','OAuth'],
    auth:'oauth', scope:'personal',
    events:['mail.received','event.created','meeting.scheduled'],
    capabilities:['Outlook Mail','Calendar','Teams Meeting','OneDrive Files']
  },
  {
    id:'slack', cat:'comm',
    name:'Slack', sub:'TEAM CHAT',
    color:'#4A154B', logo:'slack',
    desc:'إشعارات لحظية لكل حدث مهم. اعتمادات، مهام، تغييرات SOPs — كلها في قنواتك.',
    tags:['Notifications','Webhook','Org-wide'],
    auth:'webhook', scope:'org',
    events:['*'],
    capabilities:['قناة لكل إدارة','رسائل مباشرة','تنبيهات حرجة','ردود سريعة']
  },
  {
    id:'zoom', cat:'comm',
    name:'Zoom', sub:'MEETINGS',
    color:'#2D8CFF', logo:'zoom',
    desc:'كل اجتماع في الـ Spine يحصل على رابط Zoom تلقائياً. تسجيلات تُحفظ في Vault.',
    tags:['Meetings','OAuth','Personal'],
    auth:'oauth', scope:'personal',
    events:['meeting.started','meeting.ended','recording.ready'],
    capabilities:['روابط تلقائية','تسجيل في Vault','محاضر AI','تنبيهات بداية']
  },
  {
    id:'teams', cat:'comm',
    name:'Microsoft Teams', sub:'MICROSOFT 365',
    color:'#5059C9', logo:'teams',
    desc:'بديل Zoom للمؤسسات على Microsoft 365. اجتماعات، دردشة، وإشعارات في القنوات.',
    tags:['Meetings','Chat','OAuth'],
    auth:'oauth', scope:'org',
    capabilities:['اجتماعات Teams','إشعارات قنوات','ملفات مشتركة','مكالمات']
  },

  // ===== التخزين =====
  {
    id:'onedrive', cat:'store',
    name:'OneDrive', sub:'MICROSOFT 365',
    color:'#0078D4', logo:'onedrive',
    desc:'تخزين الوثائق على OneDrive مع SharePoint. مناسب للمنظمات على Microsoft 365.',
    tags:['Storage','OAuth','Personal'],
    auth:'oauth', scope:'personal',
    capabilities:['رفع ومشاركة','SharePoint','صلاحيات Group','مزامنة فورية']
  },
  {
    id:'dropbox', cat:'store',
    name:'Dropbox', sub:'CLOUD STORAGE',
    color:'#0061FF', logo:'dropbox',
    desc:'تخزين بديل للوثائق الكبيرة والوسائط. تكامل بسيط مع API Token.',
    tags:['Storage','API Key','Personal'],
    auth:'apikey', scope:'personal',
    capabilities:['رفع كبير','مشاركة','نسخ احتياطي','معاينة']
  },

  // ===== AI =====
  {
    id:'claude', cat:'ai',
    name:'Claude', sub:'ANTHROPIC AI',
    color:'#D97706', logo:'claude',
    desc:'مساعد AI داخل المنصة — تلخيص الإجراءات، توليد محاضر اجتماعات، اقتراح خطوات تنفيذية.',
    tags:['AI','Built-in','Free'],
    auth:'builtin', scope:'org',
    builtin:true,
    capabilities:['تلخيص SOPs','توليد محاضر','اقتراح مهام','ترجمة عربي/إنجليزي']
  },
  {
    id:'openai', cat:'ai',
    name:'OpenAI / GPT', sub:'OPENAI',
    color:'#10A37F', logo:'openai',
    desc:'بديل Claude. اربط API Key الخاص بك للوصول لـ GPT-4 و GPT-4o في الميزات الذكية.',
    tags:['AI','API Key','Optional'],
    auth:'apikey', scope:'org',
    capabilities:['كل ميزات Claude','نماذج متعددة','صور وصوت','تخصيص أعمق']
  }
];

/* ----------------------------------------------------------------
   FLOWS — التدفقات الداخلية
---------------------------------------------------------------- */
const FLOWS = [
  { id:'mail2task', from:{name:'البريد', icon:'i-mail'}, to:{name:'المهام', icon:'i-task'},
    label:'تحويل البريد إلى مهمة', desc:'forward أي إيميل إلى inbox@arsann ينشئ مهمة تلقائياً' },
  { id:'meeting2decisions', from:{name:'الاجتماعات', icon:'i-cal'}, to:{name:'سجل القرارات', icon:'i-doc'},
    label:'محضر → قرارات', desc:'AI يستخرج القرارات من المحضر ويسجلها' },
  { id:'sop2tasks', from:{name:'SOPs', icon:'i-doc'}, to:{name:'المهام', icon:'i-task'},
    label:'إجراء → مهام مع مسؤولين', desc:'كل خطوة في الإجراء تصبح مهمة قابلة للتعيين' },
  { id:'approval2log', from:{name:'الاعتمادات', icon:'i-task'}, to:{name:'سجل النشاط', icon:'i-doc'},
    label:'اعتماد → سجل تدقيق', desc:'كل قرار اعتماد يُسجَّل مع التوقيت والمسؤول' },
  { id:'budget2alert', from:{name:'الميزانية', icon:'i-zap'}, to:{name:'الإشعارات', icon:'i-bolt'},
    label:'تجاوز الميزانية → تنبيه', desc:'عند تجاوز 90% يُرسل تنبيه فوري للمدير المالي' },
  { id:'cal2reminder', from:{name:'التقويم', icon:'i-cal'}, to:{name:'الإشعارات', icon:'i-bolt'},
    label:'موعد → تذكير + ملخص', desc:'تذكير قبل 15 دقيقة + ملخص بعد الاجتماع' },
  { id:'risk2task', from:{name:'المخاطر', icon:'i-zap'}, to:{name:'المهام', icon:'i-task'},
    label:'مخاطرة حرجة → مهمة عاجلة', desc:'كل مخاطرة جديدة بمستوى حرج تنشئ مهمة فورية' },
  { id:'contract2cal', from:{name:'العقود', icon:'i-doc'}, to:{name:'التقويم', icon:'i-cal'},
    label:'عقد → موعد تجديد', desc:'تواريخ انتهاء العقود تُضاف للتقويم تلقائياً' }
];

/* ----------------------------------------------------------------
   STATE
---------------------------------------------------------------- */
let connected = {};
let flows = {};

function loadState(){
  try { connected = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(_){ connected = {}; }
  try { flows = JSON.parse(localStorage.getItem(FLOWS_KEY) || '{}'); } catch(_){ flows = {}; }
  // Claude is built-in, always connected
  if (!connected.claude) connected.claude = { connected:true, since: Date.now(), builtin:true };
}
function saveState(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(connected)); } catch(_){}
}
function saveFlows(){
  try { localStorage.setItem(FLOWS_KEY, JSON.stringify(flows)); } catch(_){}
}

/* Bearer token for worker calls (non-disruptive — no login redirect). */
function getAuthToken(){
  return localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token') || '';
}

/* ----------------------------------------------------------------
   LOGOS — SVG inline
---------------------------------------------------------------- */
function logoHTML(it){
  const svgs = {
    gmail: `<svg viewBox="0 0 24 24" fill="${it.color}"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>`,
    gcal:  `<svg viewBox="0 0 24 24" fill="${it.color}"><path d="M19 4h-1V2h-2v2H8V2H6v2H5C3.9 4 3 4.9 3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/><text x="12" y="17" font-size="7" font-weight="700" fill="${it.color}" text-anchor="middle" stroke="white" stroke-width="0.3">${new Date().getDate()}</text></svg>`,
    gdrive:`<svg viewBox="0 0 24 24"><path fill="#FFC107" d="M9 4l3 6h10l-3-6z"/><path fill="#1976D2" d="M2 18l3 4h12l-3-4z"/><path fill="#43A047" d="M2 18l3-6 3 6L5 22z M14 4L9 4l5 10 6-3z"/></svg>`,
    gdocs: `<svg viewBox="0 0 24 24" fill="${it.color}"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" opacity="0.85"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" stroke="white" stroke-width="1.4" fill="none"/></svg>`,
    outlook:`<svg viewBox="0 0 24 24" fill="${it.color}"><path d="M2 6v12h12V6H2zm6 9c-2.2 0-3.5-1.5-3.5-3s1.3-3 3.5-3 3.5 1.5 3.5 3-1.3 3-3.5 3zm14-7l-6 4V8l6-2v10l-6-2v-2l6 4z"/></svg>`,
    slack: `<svg viewBox="0 0 24 24"><path fill="#E01E5A" d="M5 14a2 2 0 110-4h2v4H5zm3 0a2 2 0 014 0v5a2 2 0 11-4 0v-5z"/><path fill="#36C5F0" d="M10 5a2 2 0 110 4H5a2 2 0 110-4h5zm0 3a2 2 0 014 0v2h-4V8z"/><path fill="#2EB67D" d="M19 10a2 2 0 110 4h-2v-4h2zm-3 0a2 2 0 01-4 0V5a2 2 0 014 0v5z"/><path fill="#ECB22E" d="M14 19a2 2 0 110-4h5a2 2 0 110 4h-5zm0-3a2 2 0 01-4 0v-2h4v2z"/></svg>`,
    zoom:  `<svg viewBox="0 0 24 24" fill="${it.color}"><rect x="3" y="7" width="13" height="10" rx="2"/><path d="M21 9l-5 3 5 3z"/></svg>`,
    teams: `<svg viewBox="0 0 24 24" fill="${it.color}"><circle cx="17" cy="7" r="3"/><rect x="2" y="6" width="13" height="13" rx="2"/><text x="8.5" y="16" font-size="9" font-weight="700" fill="white" text-anchor="middle">T</text></svg>`,
    onedrive:`<svg viewBox="0 0 24 24" fill="${it.color}"><path d="M14 12a4 4 0 00-8 .5C3.8 13 2 14.5 2 17s2 4 4 4h13c2 0 4-1.5 4-4 0-2-1.5-3.7-3.5-4-.3-3-2.5-5-5.5-5-2 0-3.7.9-4.7 2.4z"/></svg>`,
    dropbox:`<svg viewBox="0 0 24 24" fill="${it.color}"><path d="M6 2l6 4-6 4-6-4 6-4zm12 0l6 4-6 4-6-4 6-4zM0 14l6-4 6 4-6 4-6-4zm12 0l6-4 6 4-6 4-6-4zM6 20l6-4 6 4-6 4-6-4z"/></svg>`,
    claude:`<svg viewBox="0 0 24 24" fill="${it.color}"><path d="M12 2L9.5 8.5 3 11l6.5 2.5L12 20l2.5-6.5L21 11l-6.5-2.5z"/></svg>`,
    openai:`<svg viewBox="0 0 24 24" fill="${it.color}"><path d="M21 9.4a4.6 4.6 0 00-5.5-5.9A4.6 4.6 0 008 3a4.6 4.6 0 00-5.4 5.4 4.6 4.6 0 000 7.2A4.6 4.6 0 008.5 21a4.6 4.6 0 007.5-.5 4.6 4.6 0 005.4-5.4 4.6 4.6 0 00-.4-5.7zM12 18.4l-5-2.9V9.5L12 6.6l5 2.9v6L12 18.4z"/></svg>`
  };
  return svgs[it.logo] || `<svg viewBox="0 0 24 24" fill="${it.color}"><circle cx="12" cy="12" r="10"/></svg>`;
}

/* ----------------------------------------------------------------
   RENDER — SERVICES
---------------------------------------------------------------- */
function tileHTML(it){
  const isConnected = !!(connected[it.id] && connected[it.id].connected);
  const status = isConnected ? 'connected' : (it.status === 'beta' ? 'beta' : '');
  const since = isConnected && connected[it.id].since
    ? new Date(connected[it.id].since).toLocaleDateString('ar-EG', {year:'numeric', month:'short', day:'numeric'})
    : '';
  return `
    <div class="icard ${isConnected?'connected':''}" data-id="${it.id}">
      <div class="icard-head">
        <div class="ilogo">${logoHTML(it)}</div>
        <div class="itxt">
          <div class="nm">${it.name}</div>
          <div class="sub">${it.sub}</div>
        </div>
        ${isConnected ? '<span class="istatus connected">● متصل</span>' :
          (it.builtin ? '<span class="istatus connected">● مدمج</span>' : '')}
      </div>
      <div class="idesc">${it.desc}</div>
      <div class="itags">
        ${it.tags.map(t=>`<span class="itag">${t}</span>`).join('')}
      </div>
      <div class="icard-foot">
        <span class="icard-meta">${since ? 'منذ ' + since : (it.builtin ? 'جاهز للاستخدام' : 'غير متصل')}</span>
        <button class="btn ${isConnected?'':'primary'}" onclick="event.stopPropagation();openConnect('${it.id}')">
          ${isConnected ? 'إدارة' : (it.builtin ? 'استخدام' : 'ربط')}
          ${!isConnected ? '<svg width="12" height="12"><use href="#i-link"/></svg>' : ''}
        </button>
      </div>
    </div>`;
}

function renderServices(){
  const groups = { prod:'grid-prod', comm:'grid-comm', store:'grid-store', ai:'grid-ai' };
  const counts = { prod:'prodCount', comm:'commCount', store:'storeCount' };
  Object.entries(groups).forEach(([cat, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const items = CATALOG.filter(x => x.cat === cat);
    el.innerHTML = items.map(tileHTML).join('');
    if (counts[cat]) document.getElementById(counts[cat]).textContent = items.length + ' خدمة';
    el.querySelectorAll('.icard').forEach(c => c.onclick = () => openConnect(c.dataset.id));
  });
}

/* ----------------------------------------------------------------
   RENDER — FLOWS
---------------------------------------------------------------- */
function flowHTML(f){
  const on = !!flows[f.id];
  return `
    <div class="flow-card">
      <div class="flow-from">
        <div class="flow-ic"><svg><use href="#${f.from.icon}"/></svg></div>
        <div class="flow-lbl">${f.from.name}</div>
      </div>
      <div class="flow-arrow">
        <div class="line"></div>
        <div class="label">${f.label}</div>
      </div>
      <div class="flow-to">
        <div class="flow-ic"><svg><use href="#${f.to.icon}"/></svg></div>
        <div class="flow-lbl">${f.to.name}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0">
        <span style="font-size:9px;font-family:var(--font-mono);letter-spacing:0.5px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);padding:1px 7px;border-radius:5px">قريباً</span>
        <div class="flow-toggle ${on?'on':''}" data-flow="${f.id}" title="${f.desc}"></div>
      </div>
    </div>`;
}

function renderFlows(){
  const grid = document.getElementById('flowsGrid');
  grid.innerHTML = FLOWS.map(flowHTML).join('');
  grid.querySelectorAll('.flow-toggle').forEach(t => {
    t.onclick = () => {
      const id = t.dataset.flow;
      flows[id] = !flows[id];
      saveFlows();
      t.classList.toggle('on');
      updateStats();
    };
  });
}

/* ----------------------------------------------------------------
   RENDER — WEBHOOKS
---------------------------------------------------------------- */
let webhooksList = [];

async function loadWebhooks(){
  try {
    const tok = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token');
    if (!tok) { webhooksList = []; renderWebhooks(); return; }
    const r = await fetch(API + '/api/webhooks', { headers: { 'Authorization': 'Bearer ' + tok } });
    if (r.ok) {
      webhooksList = await r.json();
      if (!Array.isArray(webhooksList)) webhooksList = [];
    } else {
      webhooksList = [];
    }
  } catch(e) {
    webhooksList = [];
  }
  renderWebhooks();
}

function renderWebhooks(){
  const list = document.getElementById('whList');
  if (!webhooksList.length) {
    list.innerHTML = `
      <div class="wh-empty">
        <div class="ic"><svg width="22" height="22"><use href="#i-bolt"/></svg></div>
        <div class="t">لا توجد webhooks مسجّلة بعد</div>
        <div class="d">أضف webhook لبعث events لـ Slack أو Discord أو أي نظام خارجي</div>
        <button class="btn primary" onclick="openWebhookModal()"><svg width="12" height="12"><use href="#i-plus"/></svg> إضافة أول webhook</button>
      </div>`;
    document.getElementById('webhooksCount').textContent = '0';
    return;
  }
  list.innerHTML = webhooksList.map(w => `
    <div class="wh-row">
      <div class="dot ${w.active?'live':''}"></div>
      <div>
        <div class="nm">${w.name || 'بلا اسم'}</div>
        <div class="url">${(w.url || '').replace(/^https?:\/\//,'')}</div>
      </div>
      <div class="wh-events">
        ${(w.events || []).map(e => `<span class="wh-ev">${e}</span>`).join('')}
      </div>
      <button class="btn ghost" onclick="deleteWebhook('${w.id}')" title="حذف">
        <svg width="14" height="14"><use href="#i-x"/></svg>
      </button>
    </div>`).join('');
  document.getElementById('webhooksCount').textContent = webhooksList.length;
}

window.openWebhookModal = function(){
  document.getElementById('whName').value = '';
  document.getElementById('whUrl').value = '';
  document.getElementById('whDept').value = '';
  document.querySelectorAll('#whEvents .ev-chip').forEach(c => c.classList.remove('on'));
  document.getElementById('webhookModal').classList.add('open');
};

window.saveWebhook = async function(){
  const name = document.getElementById('whName').value.trim();
  const url = document.getElementById('whUrl').value.trim();
  const dept = document.getElementById('whDept').value;
  const events = [...document.querySelectorAll('#whEvents .ev-chip.on')].map(c => c.dataset.ev);
  if (!name || !url) { alert('الاسم والـ URL مطلوبان'); return; }
  if (!events.length) { alert('اختر حدثاً واحداً على الأقل'); return; }
  try {
    const tok = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token');
    const r = await fetch(API + '/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + tok },
      body: JSON.stringify({ name, url, events, dept, active: true })
    });
    if (!r.ok) {
      const e = await r.json().catch(()=>({}));
      alert(e.error || 'فشل حفظ الـ webhook — تأكد أنك أدمن');
      return;
    }
    closeModal('webhookModal');
    await loadWebhooks();
  } catch(e) {
    alert('خطأ في الاتصال: ' + e.message);
  }
};

window.deleteWebhook = async function(id){
  if (!confirm('حذف هذا الـ webhook؟')) return;
  try {
    const tok = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token');
    await fetch(API + '/api/webhooks/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + tok }
    });
    await loadWebhooks();
  } catch(e) {}
};

/* events chip toggle */
document.addEventListener('click', e => {
  if (e.target.classList && e.target.classList.contains('ev-chip')) {
    e.target.classList.toggle('on');
  }
});

window.copyInbound = function(){
  const url = `${API}/api/inbound/${getInboundToken()}`;
  navigator.clipboard.writeText(url);
  const btn = event.target;
  const old = btn.textContent;
  btn.textContent = '✓ تم النسخ';
  setTimeout(()=>btn.textContent = old, 1500);
};

function getInboundToken(){
  let tok = localStorage.getItem('arsan_inbound_token');
  if (!tok) {
    tok = 'in_' + Math.random().toString(36).slice(2, 14);
    localStorage.setItem('arsan_inbound_token', tok);
  }
  return tok;
}

/* ----------------------------------------------------------------
   CONNECT MODAL
---------------------------------------------------------------- */
window.openConnect = function(id){
  const it = CATALOG.find(x => x.id === id);
  if (!it) return;
  const isConnected = !!(connected[id] && connected[id].connected);
  document.getElementById('connectName').textContent = it.name;
  document.getElementById('connectSub').textContent = it.sub;
  document.getElementById('connectLogo').innerHTML = logoHTML(it);

  let body = `<p>${it.desc}</p>`;

  body += `<div style="margin:18px 0">
    <div style="font-size:11px;color:var(--ink-3);font-family:var(--font-mono);letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px">القدرات</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${it.capabilities.map(c => `
        <div style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink-2)">
          <div style="width:18px;height:18px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
          </div>
          <span>${c}</span>
        </div>
      `).join('')}
    </div>
  </div>`;

  if (it.builtin) {
    body += `<div class="note"><strong style="color:var(--accent)">مدمج</strong> — هذه الخدمة جاهزة للاستخدام مباشرة بدون إعدادات.</div>`;
  } else if (it.auth === 'oauth') {
    body += `<div class="note warn">
      <span class="lbl">OAuth — قريباً</span>
      OAuth الآمن تحت التطوير. نسخة Beta متاحة الآن لإدخال API Key يدوياً.
    </div>`;
    if (!isConnected) {
      body += `<div class="field" style="margin-top:14px">
        <label>API Key (مؤقتاً)</label>
        <input id="connectKey" placeholder="أدخل المفتاح..." type="password">
      </div>`;
    }
  } else if (it.auth === 'webhook') {
    body += `<div class="field">
      <label>Webhook URL</label>
      <input id="connectKey" placeholder="https://hooks.slack.com/services/..." value="${isConnected ? (connected[id].value || '') : ''}">
    </div>
    <div class="note">
      احصل على الرابط من Slack: Apps → Incoming Webhooks → Add → اختر القناة.
    </div>`;
  } else if (it.auth === 'apikey') {
    body += `<div class="field">
      <label>API Key</label>
      <input id="connectKey" placeholder="sk-..." type="password" value="${isConnected ? '••••••••' : ''}">
    </div>`;
  }

  if (isConnected) {
    body += `<div class="note" style="margin-top:16px">
      <strong style="color:var(--green)">✓ متصل</strong> منذ
      ${new Date(connected[id].since).toLocaleString('ar-EG')}
    </div>`;
  }

  document.getElementById('connectBody').innerHTML = body;

  const foot = document.getElementById('connectFoot');
  if (it.builtin) {
    foot.innerHTML = `<button class="btn ghost" onclick="closeModal('connectModal')">إغلاق</button>`;
  } else if (isConnected) {
    foot.innerHTML = `
      <button class="btn ghost" onclick="closeModal('connectModal')">إلغاء</button>
      <button class="btn danger" onclick="disconnect('${id}')">قطع الاتصال</button>
      ${it.auth !== 'oauth' ? `<button class="btn primary" onclick="connect('${id}')">حفظ التغييرات</button>` : ''}
    `;
  } else {
    foot.innerHTML = `
      <button class="btn ghost" onclick="closeModal('connectModal')">إلغاء</button>
      <button class="btn primary" onclick="connect('${id}')">
        <svg width="14" height="14"><use href="#i-link"/></svg>
        ${it.auth === 'oauth' ? 'ربط (Beta)' : 'ربط'}
      </button>
    `;
  }

  document.getElementById('connectModal').classList.add('open');
};

window.connect = async function(id){
  const it = CATALOG.find(x => x.id === id);
  let value = '';
  const inp = document.getElementById('connectKey');
  if (inp) value = inp.value.trim();
  if (it.auth !== 'builtin' && !value) { alert('أدخل المفتاح أو الـ URL'); return; }
  connected[id] = { connected: true, since: Date.now(), value: value };
  saveState();

  // Slack: persist the webhook URL to the worker (key: slack_webhook_v1) so
  // server-side notifications actually fire. The worker's dedicated admin-only
  // endpoint /api/slack-webhook writes to that exact key (the generic
  // /api/kv/slack_webhook_v1 route is blocked by the KV allowlist).
  if (id === 'slack' && value) {
    try {
      const tok = getAuthToken();
      const r = await fetch(API + '/api/slack-webhook', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + tok },
        body: JSON.stringify({ url: value })
      });
      if (r.ok) {
        toast('✓ Slack — تم الربط والحفظ على الخادم');
      } else {
        const e = await r.json().catch(()=>({}));
        toast('⚠ حُفظ محلياً، لكن تعذّر الحفظ على الخادم' + (e.error ? ' ('+e.error+')' : ' — يتطلّب صلاحية أدمن'));
      }
    } catch(err) {
      toast('⚠ Slack حُفظ محلياً — تعذّر الاتصال بالخادم');
    }
    closeModal('connectModal');
    renderServices();
    updateStats();
    return;
  }

  closeModal('connectModal');
  renderServices();
  updateStats();
  // Toast
  toast(`✓ ${it.name} تم ربطها بنجاح`);
};

window.disconnect = function(id){
  if (!confirm('قطع الاتصال؟')) return;
  delete connected[id];
  saveState();
  closeModal('connectModal');
  renderServices();
  updateStats();
};

window.closeModal = function(id){
  document.getElementById(id).classList.remove('open');
};

/* ----------------------------------------------------------------
   TOAST
---------------------------------------------------------------- */
function toast(msg){
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:var(--surface-2);border:1px solid var(--accent-line);padding:12px 22px;border-radius:12px;color:var(--ink);font-size:13px;font-weight:500;z-index:300;box-shadow:0 12px 36px rgba(0,0,0,0.5);opacity:0;transition:opacity 0.25s,transform 0.25s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._t);
  t._t = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(8px)';
  }, 2200);
}

/* ----------------------------------------------------------------
   STATS + TABS
---------------------------------------------------------------- */
function updateStats(){
  const conn = Object.values(connected).filter(x => x.connected).length;
  document.getElementById('connectedCount').textContent = conn;
  document.getElementById('availableCount').textContent = CATALOG.length;
  document.getElementById('flowsCount').textContent = Object.values(flows).filter(Boolean).length;
}

function setupTabs(){
  document.querySelectorAll('#tabs button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('#tabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.hidden = p.dataset.panel !== b.dataset.tab;
      });
      if (b.dataset.tab === 'webhooks') loadWebhooks();
    };
  });
}

/* ----------------------------------------------------------------
   BOOT
---------------------------------------------------------------- */
function boot(){
  loadState();
  document.getElementById('inboundToken').textContent = getInboundToken();
  renderServices();
  renderFlows();
  setupTabs();
  updateStats();
  // Pre-fetch webhooks count
  loadWebhooks();
  // Close modal on backdrop click
  document.querySelectorAll('.modal-bd').forEach(m => {
    m.onclick = e => { if (e.target === m) m.classList.remove('open'); };
  });
  // ESC closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-bd.open').forEach(m => m.classList.remove('open'));
  });
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);

})();

/* Arsan AI Assistant
 * Floating button + chat panel.
 * Uses window.callAI() if available (defined in dashboard.html), else falls back to ArsanAPI.ai or claude.complete.
 */
(function(){
  'use strict';

  // --- Don't double-load
  if (window.__arsanAIAssistantLoaded) return;
  window.__arsanAIAssistantLoaded = true;

  const LANG = () => (localStorage.getItem('arsan_lang') || 'ar');
  const t = (ar, en) => LANG() === 'en' ? en : ar;
  const isRTL = () => LANG() === 'ar';

  // --- Black horse SVG logo (Arsan brand mark)
  const HORSE_SVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="ah-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a1510"/>
        <stop offset="100%" stop-color="#0a0806"/>
      </linearGradient>
      <linearGradient id="ah-mane" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#85714D"/>
        <stop offset="100%" stop-color="#5E4F36"/>
      </linearGradient>
    </defs>
    <!-- Horse silhouette: arched neck, alert ears, flowing mane -->
    <path d="M44 16 L46 10 L48 16 L50 10 L52 17 Q54 22 52 28 Q56 32 56 38 Q56 48 50 52 L48 50 Q47 46 48 42 L42 40 Q36 38 32 34 Q28 32 24 36 Q20 40 18 46 Q16 48 14 46 Q12 44 14 38 Q16 30 22 26 Q28 22 34 22 Q40 20 44 16 Z"
          fill="url(#ah-grad)" stroke="#85714D" stroke-width="0.8"/>
    <!-- Mane flowing back -->
    <path d="M44 16 Q40 14 36 18 Q32 22 30 26 Q28 28 30 30 Q34 28 38 26 Q42 22 44 18 Z"
          fill="url(#ah-mane)" opacity="0.85"/>
    <!-- Eye -->
    <circle cx="42" cy="24" r="1.2" fill="#85714D"/>
    <!-- Nostril -->
    <ellipse cx="50" cy="22" rx="0.8" ry="1.2" fill="#85714D" opacity="0.7"/>
  </svg>`;

  // --- AI caller (resilient)
  async function ask(prompt){
    // 1) ArsanAPI.ai (uses /api/ai with token)
    if (window.ArsanAPI && typeof window.ArsanAPI.ai === 'function') {
      try { return await window.ArsanAPI.ai(prompt); } catch(e) { console.warn('ArsanAPI.ai failed:', e); }
    }
    // 2) Direct Worker call with stored token (works on any page)
    const token = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token');
    const apiBase = window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
    if (token && apiBase) {
      try {
        const res = await fetch(apiBase.replace(/\/$/,'') + '/api/ai', {
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'Authorization':'Bearer ' + token
          },
          body: JSON.stringify({ message: prompt, history: [] })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.reply) return data.reply;
        if (res.status === 401) throw new Error(t('انتهت الجلسة. سجّل الدخول مجدداً.','Session expired. Please log in again.'));
        if (data.error) throw new Error(data.error);
      } catch(e){ console.warn('Direct AI call failed:', e); if (e.message) throw e; }
    }
    // 3) dashboard.html's callAI
    if (typeof window.callAI === 'function') {
      return await window.callAI(prompt);
    }
    // 4) Built-in claude (artifact only)
    if (window.claude && typeof window.claude.complete === 'function') {
      return await window.claude.complete(prompt);
    }
    throw new Error(t('يلزم تسجيل الدخول لاستخدام الذكاء الاصطناعي.', 'Please log in to use the AI assistant.'));
  }

  // --- Styles
  function injectStyles(){
    if (document.getElementById('arsan-ai-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-ai-styles';
    s.textContent = `
      .arsan-ai-fab{
        position:fixed;
        inset-inline-end:24px;
        bottom:24px;
        z-index:9500;
        width:56px;height:56px;
        border-radius:50%;
        border:none;
        background:linear-gradient(135deg, #85714D 0%, #5E4F36 100%);
        color:#fff;
        font-size:24px;
        cursor:pointer;
        box-shadow:0 6px 20px rgba(133,113,77,.45), 0 2px 6px rgba(0,0,0,.2);
        transition:transform .2s, box-shadow .2s;
        display:flex;align-items:center;justify-content:center;
      }
      .arsan-ai-fab:hover{
        transform:translateY(-2px) scale(1.05);
        box-shadow:0 10px 28px rgba(133,113,77,.55), 0 4px 10px rgba(0,0,0,.25);
      }
      .arsan-ai-fab:active{ transform:translateY(0) scale(.98); }
      .arsan-ai-fab .pulse{
        position:absolute;inset:0;border-radius:50%;
        box-shadow:0 0 0 0 rgba(133,113,77,.6);
        animation:arsan-ai-pulse 2.4s infinite;
      }
      @keyframes arsan-ai-pulse{
        0%{ box-shadow:0 0 0 0 rgba(133,113,77,.45); }
        70%{ box-shadow:0 0 0 16px rgba(133,113,77,0); }
        100%{ box-shadow:0 0 0 0 rgba(133,113,77,0); }
      }
      .arsan-ai-fab .arsan-ai-fab-mark{
        position:relative;
        width:32px;height:32px;
        display:flex;align-items:center;justify-content:center;
      }
      .arsan-ai-fab .arsan-ai-fab-mark svg{
        width:100%;height:100%;
        filter:drop-shadow(0 1px 2px rgba(0,0,0,.3));
      }
      .arsan-ai-fab.hidden{ display:none; }

      .arsan-ai-panel{
        position:fixed;
        inset-inline-end:24px;
        bottom:96px;
        z-index:9550;
        width:380px;
        max-width:calc(100vw - 48px);
        height:560px;
        max-height:calc(100vh - 140px);
        background:linear-gradient(180deg, rgba(26,21,16,.98), rgba(35,26,16,.96));
        backdrop-filter:blur(24px);
        border:1px solid rgba(133,113,77,.35);
        border-radius:16px;
        box-shadow:0 30px 80px rgba(0,0,0,.5);
        color:#f3e9c9;
        display:none;
        flex-direction:column;
        overflow:hidden;
        transform:translateY(20px) scale(.96);
        opacity:0;
        transition:transform .25s cubic-bezier(.2,.9,.3,1.2), opacity .2s;
      }
      .arsan-ai-panel.open{
        display:flex;
        transform:translateY(0) scale(1);
        opacity:1;
      }
      html[data-theme="light"] .arsan-ai-panel{
        background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(250,246,234,.96));
        color:#3a2f15;
        border-color:rgba(133,113,77,.25);
      }
      .arsan-ai-head{
        padding:14px 16px;
        border-bottom:1px solid rgba(133,113,77,.2);
        display:flex;align-items:center;gap:10px;
      }
      .arsan-ai-head .avatar{
        width:40px;height:40px;border-radius:50%;
        background:linear-gradient(135deg, #2a2014, #1a1510);
        border:1.5px solid rgba(133,113,77,.5);
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;
        overflow:hidden;
      }
      .arsan-ai-head .avatar svg{
        width:28px;height:28px;
      }
      .arsan-ai-head .info{ flex:1; min-width:0; }
      .arsan-ai-head .info h3{
        margin:0;font-size:14px;font-weight:600;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      }
      .arsan-ai-head .info .status{
        font-size:11px;opacity:.65;
        display:flex;align-items:center;gap:4px;
      }
      .arsan-ai-head .info .status::before{
        content:''; width:7px;height:7px;border-radius:50%;
        background:#5ec28b; box-shadow:0 0 6px #5ec28b;
      }
      .arsan-ai-head .x{
        background:transparent;border:none;color:inherit;
        font-size:20px;cursor:pointer;opacity:.6;
        width:30px;height:30px;border-radius:6px;
        display:flex;align-items:center;justify-content:center;
      }
      .arsan-ai-head .x:hover{ opacity:1; background:rgba(133,113,77,.15); }

      .arsan-ai-body{
        flex:1;
        overflow-y:auto;
        padding:14px;
        display:flex;flex-direction:column;gap:10px;
        scroll-behavior:smooth;
      }
      .arsan-ai-msg{
        max-width:85%;
        padding:10px 14px;
        border-radius:14px;
        line-height:1.55;
        font-size:13.5px;
        white-space:pre-wrap;
        word-wrap:break-word;
        animation:arsan-ai-in .25s ease-out;
      }
      @keyframes arsan-ai-in{
        from{ opacity:0; transform:translateY(6px); }
        to{ opacity:1; transform:translateY(0); }
      }
      .arsan-ai-msg.user{
        align-self:flex-end;
        background:#85714D;
        color:#fff;
        border-bottom-right-radius:4px;
      }
      html[dir="rtl"] .arsan-ai-msg.user,
      [dir="rtl"] .arsan-ai-msg.user{
        border-bottom-right-radius:14px;
        border-bottom-left-radius:4px;
      }
      .arsan-ai-msg.bot{
        align-self:flex-start;
        background:rgba(133,113,77,.12);
        border:1px solid rgba(133,113,77,.18);
        border-bottom-left-radius:4px;
      }
      html[dir="rtl"] .arsan-ai-msg.bot,
      [dir="rtl"] .arsan-ai-msg.bot{
        border-bottom-left-radius:14px;
        border-bottom-right-radius:4px;
      }
      html[data-theme="light"] .arsan-ai-msg.bot{
        background:rgba(133,113,77,.08);
      }
      .arsan-ai-msg.error{
        align-self:flex-start;
        background:rgba(230,57,70,.12);
        border:1px solid rgba(230,57,70,.3);
        color:#e63946;
      }
      .arsan-ai-typing{
        align-self:flex-start;
        padding:10px 14px;
        background:rgba(133,113,77,.12);
        border:1px solid rgba(133,113,77,.18);
        border-radius:14px;
        border-bottom-left-radius:4px;
        display:flex;gap:4px;align-items:center;
      }
      .arsan-ai-typing span{
        width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.4;
        animation:arsan-ai-bounce 1.2s infinite;
      }
      .arsan-ai-typing span:nth-child(2){ animation-delay:.15s; }
      .arsan-ai-typing span:nth-child(3){ animation-delay:.3s; }
      @keyframes arsan-ai-bounce{
        0%,60%,100%{ transform:translateY(0); opacity:.4; }
        30%{ transform:translateY(-4px); opacity:1; }
      }

      .arsan-ai-suggest{
        padding:0 14px 8px;
        display:flex;flex-wrap:wrap;gap:6px;
      }
      .arsan-ai-suggest button{
        font-size:11.5px;
        padding:6px 11px;
        border-radius:14px;
        background:rgba(133,113,77,.1);
        border:1px solid rgba(133,113,77,.25);
        color:inherit;
        cursor:pointer;
        transition:background .15s;
        font-family:inherit;
      }
      .arsan-ai-suggest button:hover{
        background:rgba(133,113,77,.2);
      }

      .arsan-ai-foot{
        padding:10px 12px;
        border-top:1px solid rgba(133,113,77,.2);
        display:flex;gap:8px;align-items:flex-end;
      }
      .arsan-ai-foot textarea{
        flex:1;
        background:rgba(133,113,77,.08);
        border:1px solid rgba(133,113,77,.25);
        border-radius:10px;
        color:inherit;
        padding:9px 12px;
        font-size:13px;
        font-family:inherit;
        resize:none;
        min-height:38px;
        max-height:120px;
        line-height:1.5;
        outline:none;
        transition:border-color .15s;
      }
      .arsan-ai-foot textarea:focus{
        border-color:#85714D;
      }
      .arsan-ai-foot textarea::placeholder{
        color:inherit;opacity:.45;
      }
      .arsan-ai-send{
        background:linear-gradient(135deg, #85714D, #5E4F36);
        border:none;color:#fff;
        width:40px;height:38px;
        border-radius:10px;
        cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        font-size:16px;
        flex-shrink:0;
        transition:transform .15s, opacity .15s;
      }
      .arsan-ai-send:hover{ transform:translateY(-1px); }
      .arsan-ai-send:disabled{
        opacity:.4;cursor:not-allowed;transform:none;
      }

      @media (max-width:480px){
        .arsan-ai-panel{
          inset-inline-end:12px;
          inset-inline-start:12px;
          width:auto;
          bottom:88px;
        }
        .arsan-ai-fab{
          inset-inline-end:16px;
          bottom:16px;
        }
      }
    `;
    document.head.appendChild(s);
  }

  // --- DOM build
  let panel, body, textarea, sendBtn, fab;
  let history = [];
  let isThinking = false;

  function build(){
    injectStyles();

    // FAB
    fab = document.createElement('button');
    fab.className = 'arsan-ai-fab';
    fab.id = 'arsan-ai-fab';
    fab.setAttribute('aria-label', t('الأدهم — مساعد أرسان','Al-Adham — Arsan Assistant'));
    fab.title = t('اسأل الأدهم','Ask Al-Adham');
    fab.innerHTML = `<span class="pulse"></span><span class="arsan-ai-fab-mark">${HORSE_SVG}</span>`;
    fab.addEventListener('click', toggle);
    document.body.appendChild(fab);

    // Panel
    panel = document.createElement('div');
    panel.className = 'arsan-ai-panel';
    panel.id = 'arsan-ai-panel';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','false');
    panel.innerHTML = `
      <div class="arsan-ai-head">
        <div class="avatar">${HORSE_SVG}</div>
        <div class="info">
          <h3>${t('الأدهم','Al-Adham')}</h3>
          <div class="status">${t('مساعد أرسان الذكي','Arsan AI Assistant')}</div>
        </div>
        <button class="x" type="button" aria-label="Close">✕</button>
      </div>
      <div class="arsan-ai-body" id="arsan-ai-body"></div>
      <div class="arsan-ai-suggest" id="arsan-ai-suggest"></div>
      <div class="arsan-ai-foot">
        <textarea id="arsan-ai-input" rows="1" placeholder="${t('اكتب سؤالك للأدهم…','Ask Al-Adham…')}"></textarea>
        <button class="arsan-ai-send" id="arsan-ai-send" type="button" aria-label="Send">↑</button>
      </div>
    `;
    document.body.appendChild(panel);

    body = panel.querySelector('#arsan-ai-body');
    textarea = panel.querySelector('#arsan-ai-input');
    sendBtn = panel.querySelector('#arsan-ai-send');

    panel.querySelector('.x').addEventListener('click', close);
    sendBtn.addEventListener('click', send);
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });

    // Suggestions
    renderSuggest();

    // Greeting — Al-Adham introduces himself
    addBot(t(
      'السلام عليكم 🐎\nأنا **الأدهم** — مساعدك الذكي في منصّة أرسان.\n\n"الأدهم" في العربية يعني الحصان الأسود الفاره، رمز القوة والوفاء والسرعة. هكذا أحبّ أن أكون: سريع الاستجابة، أمين على معرفتك، وقوي عند الحاجة.\n\nأستطيع:\n• شرح الإجراءات وتلخيصها\n• صياغة خطوات وKPIs جديدة\n• اقتراح تحسينات تشغيلية\n• الإجابة على أي سؤال يخصّ عملك في أرسان\n\nمن أين نبدأ؟',
      'Greetings 🐎\nI am **Al-Adham** — your AI assistant on the Arsan platform.\n\n"Al-Adham" in Arabic means a noble black horse — a symbol of strength, loyalty, and speed. That is how I aim to be: quick to answer, faithful to your knowledge, and strong when you need me.\n\nI can:\n• Explain & summarize SOPs\n• Draft new steps & KPIs\n• Suggest operational improvements\n• Answer any question about your work in Arsan\n\nWhere shall we start?'
    ));
  }

  function renderSuggest(){
    const sug = panel.querySelector('#arsan-ai-suggest');
    if (!sug) return;
    const items = LANG() === 'en' ? [
      'Suggest 3 KPIs for procurement',
      'Summarize the open SOP',
      'Draft a new onboarding SOP'
    ] : [
      'اقترح 3 مؤشرات أداء للمشتريات',
      'لخّص الإجراء المفتوح',
      'صُغ إجراءً لتأهيل موظف جديد'
    ];
    sug.innerHTML = items.map(x => `<button type="button">${x}</button>`).join('');
    sug.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        textarea.value = b.textContent;
        textarea.focus();
        send();
      });
    });
  }

  function renderMd(txt){
    // light markdown: **bold** + line breaks
    const esc = String(txt).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    return esc.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  // --- Messaging
  function addBot(txt){
    const div = document.createElement('div');
    div.className = 'arsan-ai-msg bot';
    div.innerHTML = renderMd(txt);
    body.appendChild(div);
    scroll();
    history.push({ role:'assistant', content: txt });
  }
  function addUser(txt){
    const div = document.createElement('div');
    div.className = 'arsan-ai-msg user';
    div.textContent = txt;
    body.appendChild(div);
    scroll();
    history.push({ role:'user', content: txt });
  }
  function addError(txt){
    const div = document.createElement('div');
    div.className = 'arsan-ai-msg error';
    div.textContent = txt;
    body.appendChild(div);
    scroll();
  }
  function showTyping(){
    const div = document.createElement('div');
    div.className = 'arsan-ai-typing';
    div.id = 'arsan-ai-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(div);
    scroll();
  }
  function hideTyping(){
    const x = document.getElementById('arsan-ai-typing');
    if (x) x.remove();
  }
  function scroll(){
    requestAnimationFrame(() => {
      body.scrollTop = body.scrollHeight;
    });
  }

  async function send(){
    if (isThinking) return;
    const q = textarea.value.trim();
    if (!q) return;
    textarea.value = '';
    textarea.style.height = 'auto';
    addUser(q);
    isThinking = true;
    sendBtn.disabled = true;
    showTyping();

    // Build prompt with light context
    let context = '';
    try {
      if (window.SOPS && Array.isArray(window.SOPS) && window.DEPT) {
        context = `أنت مساعد لمنصة أرسان لإدارة الإجراءات (SOPs).
الإدارة الحالية: ${window.DEPT.name || ''}
عدد الإجراءات: ${window.SOPS.length}
أجب باللغة ${LANG()==='en'?'الإنجليزية':'العربية'} باختصار وعملياً.

`;
      }
    } catch(_){}
    const prompt = context + q;

    try {
      const res = await ask(prompt);
      hideTyping();
      addBot(String(res || '').trim() || t('لا رد.','No response.'));
    } catch(err){
      hideTyping();
      addError(err.message || t('تعذّر الاتصال بالمساعد.','Failed to reach assistant.'));
    } finally {
      isThinking = false;
      sendBtn.disabled = false;
      textarea.focus();
    }
  }

  // --- open/close
  function open(){
    if (!panel) build();
    panel.classList.add('open');
    setTimeout(() => textarea && textarea.focus(), 100);
  }
  function close(){
    if (panel) panel.classList.remove('open');
  }
  function toggle(){
    if (panel && panel.classList.contains('open')) close();
    else open();
  }

  // --- Public API
  window.ArsanAI = {
    open, close, toggle, ask
  };

  // --- Auto-init when DOM ready
  function init(){
    // Don't show on login screen / before auth
    // Wait briefly so auth-gate can decide
    setTimeout(() => {
      try {
        // Hide if a login overlay is showing
        const loginOverlay = document.querySelector('.arsan-login-wrap, [data-arsan-login], #arsan-auth-overlay');
        if (loginOverlay && loginOverlay.offsetParent !== null) {
          // Re-check after login
          window.addEventListener('arsan-login-success', () => build(), { once:true });
          return;
        }
        build();
      } catch(e){ console.warn('AI assistant init:', e); }
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

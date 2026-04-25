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

  // --- AI caller (resilient)
  async function ask(prompt){
    // 1) Use dashboard.html's callAI if it exists
    if (typeof window.callAI === 'function') {
      return await window.callAI(prompt);
    }
    // 2) ArsanAPI
    if (window.ArsanAPI && typeof window.ArsanAPI.ai === 'function' && window.ArsanAPI.getToken && window.ArsanAPI.getToken()) {
      return await window.ArsanAPI.ai(prompt);
    }
    // 3) Built-in claude (artifact only)
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
        width:36px;height:36px;border-radius:50%;
        background:linear-gradient(135deg, #85714D, #5E4F36);
        display:flex;align-items:center;justify-content:center;
        font-size:18px;color:#fff;
        flex-shrink:0;
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
    fab.setAttribute('aria-label', t('مساعد الذكاء','AI Assistant'));
    fab.title = t('اسأل المساعد','Ask the assistant');
    fab.innerHTML = `<span class="pulse"></span><span style="position:relative">🤖</span>`;
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
        <div class="avatar">🤖</div>
        <div class="info">
          <h3>${t('مساعد أرسان الذكي','Arsan AI Assistant')}</h3>
          <div class="status">${t('جاهز للمساعدة','Ready to help')}</div>
        </div>
        <button class="x" type="button" aria-label="Close">✕</button>
      </div>
      <div class="arsan-ai-body" id="arsan-ai-body"></div>
      <div class="arsan-ai-suggest" id="arsan-ai-suggest"></div>
      <div class="arsan-ai-foot">
        <textarea id="arsan-ai-input" rows="1" placeholder="${t('اكتب سؤالك…','Type your question…')}"></textarea>
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

    // Greeting
    addBot(t(
      'مرحباً 👋\nأنا مساعدك الذكي. أستطيع شرح الإجراءات، صياغة خطوات جديدة، اقتراح KPIs، وتلخيص المحتوى. اسأل ما شئت!',
      'Hi 👋\nI am your AI helper. I can explain SOPs, draft new steps, suggest KPIs, and summarize content. Ask me anything!'
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

  // --- Messaging
  function addBot(txt){
    const div = document.createElement('div');
    div.className = 'arsan-ai-msg bot';
    div.textContent = txt;
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

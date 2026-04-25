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
  const HORSE_SVG = `<img src="./adham.png" alt="Adham" style="width:100%;height:100%;object-fit:contain;display:block"/>`;

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
        background:radial-gradient(circle at 30% 30%, #EFE7D5 0%, #C9B58A 50%, #A89066 100%);
        color:#5E4F36;
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
        background:radial-gradient(circle at 30% 30%, #EFE7D5, #C9B58A 70%, #A89066 100%);
        border:1px solid rgba(133,113,77,.45);
        box-shadow:0 0 0 2px rgba(133,113,77,.18), inset 0 1px 2px rgba(255,255,255,.4);
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;
        overflow:hidden;
        padding:4px;
        box-sizing:border-box;
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
      .arsan-ai-head .kb{
        background:transparent;border:1px solid rgba(133,113,77,.3);color:inherit;
        font-size:14px;cursor:pointer;opacity:.7;
        width:32px;height:32px;border-radius:8px;
        display:flex;align-items:center;justify-content:center;
        transition:all .15s;
      }
      .arsan-ai-head .kb:hover{ opacity:1; background:rgba(133,113,77,.18); border-color:rgba(133,113,77,.55); }

      /* === Adham Memory inline modal === */
      .arsan-kb-bd{
        position:fixed; inset:0; z-index:9700;
        background:rgba(10,8,6,.55); backdrop-filter:blur(8px);
        display:flex; align-items:center; justify-content:center;
        padding:24px; animation:arsan-ai-fade .18s ease;
      }
      .arsan-kb-modal{
        background:#1a1510; color:#f3e9c9;
        border:1px solid rgba(133,113,77,.35); border-radius:16px;
        max-width:720px; width:100%; max-height:85vh;
        display:flex; flex-direction:column;
        box-shadow:0 30px 80px rgba(0,0,0,.6);
        font-family:"IBM Plex Sans Arabic", system-ui, sans-serif;
      }
      .arsan-kb-modal h2{
        margin:0; padding:18px 20px; font-size:16px; font-weight:700;
        border-bottom:1px solid rgba(133,113,77,.2);
        display:flex; align-items:center; gap:10px;
      }
      .arsan-kb-modal h2 .x{
        margin-inline-start:auto; background:transparent; border:none; color:inherit;
        font-size:20px; cursor:pointer; opacity:.6; width:30px; height:30px; border-radius:8px;
      }
      .arsan-kb-modal h2 .x:hover{ opacity:1; background:rgba(133,113,77,.15); }
      .arsan-kb-body{ padding:20px; overflow-y:auto; flex:1; }
      .arsan-kb-body p.lead{ margin:0 0 12px; font-size:13px; opacity:.78; line-height:1.7; }
      .arsan-kb-body textarea{
        width:100%; min-height:280px; box-sizing:border-box;
        background:#0e0a08; color:#f3e9c9;
        border:1px solid rgba(133,113,77,.3); border-radius:10px;
        padding:14px; font-family:"IBM Plex Sans Arabic", system-ui, monospace;
        font-size:13px; line-height:1.7; resize:vertical;
        direction:rtl;
      }
      .arsan-kb-body textarea:focus{ outline:none; border-color:#85714D; box-shadow:0 0 0 3px rgba(133,113,77,.15); }
      .arsan-kb-foot{
        padding:14px 20px; border-top:1px solid rgba(133,113,77,.2);
        display:flex; gap:10px; align-items:center;
      }
      .arsan-kb-foot .status{ flex:1; font-size:12px; opacity:.7; }
      .arsan-kb-foot button{
        padding:9px 18px; border-radius:9px; font-size:13px; font-weight:600;
        cursor:pointer; border:1px solid transparent; font-family:inherit;
      }
      .arsan-kb-foot .save{ background:#85714D; color:#fff; border-color:#85714D; }
      .arsan-kb-foot .save:hover{ background:#9a8559; }
      .arsan-kb-foot .clear{ background:transparent; color:#d97757; border-color:rgba(217,119,87,.4); }
      .arsan-kb-foot .clear:hover{ background:rgba(217,119,87,.1); }
      .arsan-kb-info{
        margin-top:14px; padding:12px 14px;
        background:rgba(133,113,77,.08); border:1px solid rgba(133,113,77,.18);
        border-radius:9px; font-size:12px; line-height:1.8; opacity:.85;
      }
      .arsan-kb-info strong{ color:#c9b27a; }

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
        <button class="kb" id="arsan-ai-kb" type="button" aria-label="${t('ذاكرة الأدهم','Adham Memory')}" title="${t('ذاكرة الأدهم','Adham Memory')}">⚙</button>
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
    panel.querySelector('#arsan-ai-kb').addEventListener('click', openKB);
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

    // Build prompt with rich context (Adham's "feed")
    let context = '';
    try {
      const lang = LANG()==='en'?'English':'العربية';
      const parts = [];
      parts.push(`أنت "الأدهم" — المساعد الذكي لمنصّة أرسان لإدارة الإجراءات التشغيلية القياسية (SOPs).`);
      parts.push(`أجب باللغة ${lang} بأسلوب واضح وعملي ومختصر. استخدم نقاطاً بدل الفقرات الطويلة.`);

      // 1. Custom knowledge base (admin-fed)
      try {
        const kb = localStorage.getItem('arsan_adham_knowledge_v1');
        if (kb && kb.trim()) {
          parts.push(`\n=== معرفة خاصة بأرسان (يُعتمد عليها أولاً) ===\n${kb.slice(0, 8000)}`);
        }
      } catch(_){}

      // 2. Live SOPs context
      if (window.SOPS && Array.isArray(window.SOPS) && window.SOPS.length) {
        const dept = window.DEPT?.name || (window.DEPARTMENTS_CONFIG?.find(d => d.id === window.CURRENT_DEPT_ID)?.name) || '';
        parts.push(`\n=== السياق الحالي ===\nالإدارة: ${dept}\nعدد الإجراءات: ${window.SOPS.length}`);
        // Top 20 SOP titles + codes
        const sample = window.SOPS.slice(0, 20).map(s => `- ${s.code || ''} ${s.title || ''} ${s.phase ? `[${s.phase}]` : ''}`).join('\n');
        if (sample) parts.push(`\nقائمة الإجراءات (أول 20):\n${sample}`);
      }

      // 3. Open SOP details (if a modal is open)
      try {
        const openModal = document.querySelector('.modal[style*="display: flex"], #sopModal[style*="flex"]');
        if (openModal && window.__openSopId) {
          const sop = (window.SOPS || []).find(s => s.id === window.__openSopId);
          if (sop) {
            parts.push(`\n=== الإجراء المفتوح حالياً ===\nالكود: ${sop.code}\nالعنوان: ${sop.title}\nالغرض: ${sop.purpose || '—'}\nالنطاق: ${sop.scope || '—'}\nعدد الخطوات: ${(sop.steps||[]).length}`);
          }
        }
      } catch(_){}

      // 4. Departments overview
      if (window.DEPARTMENTS_CONFIG && Array.isArray(window.DEPARTMENTS_CONFIG)) {
        parts.push(`\n=== الإدارات (${window.DEPARTMENTS_CONFIG.length}) ===\n${window.DEPARTMENTS_CONFIG.map(d => `- ${d.id}: ${d.name}`).join('\n')}`);
      }

      context = parts.join('\n') + '\n\n=== سؤال المستخدم ===\n';
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

  // --- Adham Memory (Knowledge Base) modal
  function openKB(){
    document.getElementById('arsan-kb-bd')?.remove();
    const KB_KEY = 'arsan_adham_knowledge_v1';
    const initial = (() => {
      try { return localStorage.getItem(KB_KEY) || ''; } catch(_) { return ''; }
    })();

    const bd = document.createElement('div');
    bd.id = 'arsan-kb-bd';
    bd.className = 'arsan-kb-bd';
    bd.innerHTML = `
      <div class="arsan-kb-modal" role="dialog" aria-modal="true">
        <h2>
          <span style="width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center"><img src="./adham.png" style="width:100%;height:100%;object-fit:contain"/></span>
          ${t('ذاكرة الأدهم','Adham Memory')}
          <button class="x" type="button" aria-label="Close">✕</button>
        </h2>
        <div class="arsan-kb-body">
          <p class="lead">${t(
            'كل ما تكتبه هنا يصبح جزءاً من معرفة الأدهم. استخدمه لتغذيته بمعلومات شركتك، سياساتك، مصطلحاتك، أو أي شيء يجب أن يعرفه.',
            'Anything you write here becomes part of Al-Adham\'s knowledge. Use it to teach him about your company, policies, terminology, or anything else he should know.'
          )}</p>
          <textarea id="arsan-kb-text" placeholder="${t('مثال:\nشركة أرسان متخصّصة في حلول مواقف السيارات الذكية.\nنستخدم نظام KPIs ربعي.\nلا نسمح بالعمل خارج الدوام بدون موافقة المدير المباشر.\n…','Example: Arsan specializes in smart parking solutions...')}">${initial.replace(/</g,'&lt;')}</textarea>
          <div class="arsan-kb-info">
            <strong>${t('ما يعرفه الأدهم تلقائياً','What Adham already knows')}:</strong><br>
            • ${t('كل الإجراءات (SOPs) في كل الإدارات','All SOPs across all departments')}<br>
            • ${t('الإدارة الحالية والإجراء المفتوح','Current department & open SOP')}<br>
            • ${t('قائمة الإدارات وأرقامها','Departments & their codes')}<br>
            • ${t('اللغة الحالية (عربي/إنجليزي)','Current language')}
          </div>
        </div>
        <div class="arsan-kb-foot">
          <span class="status" id="arsan-kb-status"></span>
          <button class="clear" type="button" id="arsan-kb-clear">${t('مسح','Clear')}</button>
          <button class="save" type="button" id="arsan-kb-save">${t('حفظ','Save')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(bd);

    const txt = bd.querySelector('#arsan-kb-text');
    const status = bd.querySelector('#arsan-kb-status');
    const close = () => bd.remove();

    bd.addEventListener('click', e => { if (e.target === bd) close(); });
    bd.querySelector('.x').addEventListener('click', close);
    bd.querySelector('#arsan-kb-save').addEventListener('click', () => {
      try {
        localStorage.setItem(KB_KEY, txt.value || '');
        if (window.ArsanAPI && window.ArsanAPI.put) {
          window.ArsanAPI.put('adham_kb_v1', { text: txt.value || '', updatedAt: Date.now() }).catch(()=>{});
        }
        status.textContent = '✓ ' + t('تم الحفظ. الأدهم يتذكّر الآن.','Saved. Adham will remember.');
        status.style.color = '#5ec28b';
        setTimeout(close, 900);
      } catch(e){
        status.textContent = '⚠ ' + t('فشل الحفظ','Save failed');
        status.style.color = '#d97757';
      }
    });
    bd.querySelector('#arsan-kb-clear').addEventListener('click', () => {
      if (!confirm(t('مسح كل ذاكرة الأدهم؟ هذا لا يمكن التراجع عنه.','Clear all Adham memory? This cannot be undone.'))) return;
      txt.value = '';
      try { localStorage.removeItem(KB_KEY); } catch(_){}
      if (window.ArsanAPI && window.ArsanAPI.put) {
        window.ArsanAPI.put('adham_kb_v1', { text:'', updatedAt: Date.now() }).catch(()=>{});
      }
      status.textContent = t('تم المسح.','Cleared.');
      status.style.color = '#9b958a';
    });
    setTimeout(() => txt.focus(), 50);
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

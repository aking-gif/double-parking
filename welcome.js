/* welcome.js — First-login onboarding sequence
 *
 * Flow:
 *   1. New user logs in → a welcome announcement is added locally
 *   2. Bell pulses with a tooltip "افتح الإشعار" pointing at it
 *   3. User opens bell, reads the welcome → tooltip dismisses
 *   4. After 1.5s → welcome modal appears with horse icon
 *   5. User clicks "Take the tour" → tour.js starts
 *      Or "Skip" → done forever
 */
(function(){
  if (window.__arsanWelcomeLoaded) return;
  window.__arsanWelcomeLoaded = true;

  const SEEN_KEY = 'arsan_welcome_seen_v1';
  const NOTIF_INJECTED_KEY = 'arsan_welcome_notif_injected_v1';
  const NOTIF_READ_KEY = 'arsan_notif_read_v1';
  const STORE_KEY = 'arsan_announcements_v1';
  const TOUR_SEEN_KEY = 'arsan_tour_seen_v1';
  const WELCOME_NOTIF_ID = 'welcome-greeting-v1';

  function lang(){ return localStorage.getItem('arsan_lang') || 'ar'; }
  function t(ar, en){ return lang() === 'en' ? en : ar; }
  function me(){ try { return JSON.parse(localStorage.getItem('arsan_me_v1')||localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } }
  function isSeen(k){ try { return localStorage.getItem(k) === '1'; } catch(_){ return false; } }
  function markSeen(k){ try { localStorage.setItem(k, '1'); } catch(_){} }

  /* ---------- Step 1: Inject welcome announcement locally ---------- */
  function injectWelcomeNotif(){
    if (isSeen(NOTIF_INJECTED_KEY)) return;
    const u = me();
    if (!u || !u.email) return;
    const firstName = u.email.split('@')[0].split('.')[0];
    const cap = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    const notif = {
      id: WELCOME_NOTIF_ID,
      ts: Date.now(),
      author: t('الأدهم','Al-Adham'),
      title: t(
        `🐎 أهلاً ${cap} في منصّة أرسان`,
        `🐎 Welcome ${cap} to Arsan Platform`
      ),
      body: t(
        `أنا الأدهم — مساعدك الذكي. اقرأ هذه الرسالة الترحيبية ثم ابدأ بجولة سريعة لتتعرف على المنصة.\n\n• تصفّح وإضافة وتعديل الإجراءات\n• التواصل مع الإدارات الأخرى\n• متابعة المهام والاعتمادات\n• استخدام الذكاء الاصطناعي\n\nبعد قراءتك لهذه الرسالة، ستظهر لك دعوة الجولة التعريفية.`,
        `I am Al-Adham — your AI assistant. Read this welcome message, then start a quick tour to get to know the platform.\n\n• Browse, add, and edit SOPs\n• Communicate with other departments\n• Track tasks and approvals\n• Use AI assistance\n\nAfter you read this, the tour invitation will appear.`
      ),
      priority: 'normal',
      notifyAll: false,
      _local: true
    };

    try {
      const list = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      // Don't duplicate
      const has = list.some(a => a.id === WELCOME_NOTIF_ID);
      if (!has) {
        list.unshift(notif);
        localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 50)));
      }
      markSeen(NOTIF_INJECTED_KEY);
      // Refresh the bell badge
      if (window.ArsanNotify && window.ArsanNotify.refresh) {
        window.ArsanNotify.refresh();
      }
    } catch(_){}
  }

  /* ---------- Step 2: Tooltip pointing at bell ---------- */
  function injectStyles(){
    if (document.getElementById('arsan-welcome-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-welcome-styles';
    s.textContent = `
      /* Bell tooltip */
      .aw-bell-tip{
        position:fixed; z-index:9300;
        max-width:260px;
        background:linear-gradient(160deg,#1a1510 0%,#241c14 100%);
        color:#f3e9c9;
        padding:14px 16px;
        border-radius:12px;
        border:1px solid rgba(201,178,122,.32);
        box-shadow:0 12px 32px rgba(0,0,0,.45);
        font-size:13.5px; line-height:1.6;
        animation:awTipIn .35s ease forwards;
        pointer-events:auto;
      }
      @keyframes awTipIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      .aw-bell-tip strong{color:#c9b27a;display:block;margin-bottom:4px;font-size:14px}
      .aw-bell-tip .arrow{
        position:absolute; width:14px;height:14px;
        background:inherit;
        border-right:1px solid rgba(201,178,122,.32);
        border-bottom:1px solid rgba(201,178,122,.32);
        transform:rotate(-45deg);
      }
      .aw-bell-tip .x{
        position:absolute; top:6px; inset-inline-end:8px;
        background:none; border:none; color:rgba(243,233,201,.5); cursor:pointer;
        font-size:14px; padding:2px 6px;
      }
      .aw-bell-tip .x:hover{ color:#f3e9c9; }

      /* Pulse on bell */
      @keyframes awBellPulse{
        0%,100%{ box-shadow:0 4px 16px rgba(0,0,0,.25), 0 0 0 0 rgba(201,178,122,.6); }
        50%{ box-shadow:0 4px 16px rgba(0,0,0,.25), 0 0 0 12px rgba(201,178,122,0); }
      }
      .arsan-notif-btn.aw-pulse{
        animation:awBellPulse 2s infinite;
      }

      /* Welcome modal */
      .aw-bd{position:fixed;inset:0;z-index:10000;background:rgba(10,8,6,.78);backdrop-filter:blur(8px);
        display:flex;align-items:center;justify-content:center;padding:20px;
        animation:awFadeIn .4s ease forwards}
      @keyframes awFadeIn{from{opacity:0}to{opacity:1}}
      .aw-modal{
        max-width:520px;width:100%;
        background:linear-gradient(160deg,#1a1510 0%,#241c14 100%);
        border:1px solid rgba(201,178,122,.32);
        border-radius:20px;padding:36px 32px 28px;
        box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 1px rgba(201,178,122,.15);
        text-align:center;color:#f3e9c9;
        animation:awSlide .5s cubic-bezier(.2,.8,.2,1) forwards;
        font-family:inherit;
      }
      @keyframes awSlide{from{transform:translateY(20px) scale(.96);opacity:0}to{transform:none;opacity:1}}
      .aw-icon{
        width:88px;height:88px;margin:0 auto 18px;
        background:radial-gradient(circle at 30% 30%,#EFE7D5,#C9B58A 70%,#A89066 100%);
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        padding:18px;box-sizing:border-box;color:#1a1510;
        box-shadow:0 8px 24px rgba(133,113,77,.4),inset 0 1px 2px rgba(255,255,255,.4);
        border:1px solid rgba(133,113,77,.45);
      }
      .aw-icon svg{width:100%;height:100%}
      .aw-title{font-size:24px;font-weight:800;color:#fff;margin:0 0 8px;letter-spacing:-.01em}
      .aw-name{color:#c9b27a;font-weight:700}
      .aw-sub{font-size:14.5px;line-height:1.7;color:#d4c9aa;margin:0 0 22px}
      .aw-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
      .aw-btn{padding:11px 22px;border-radius:10px;cursor:pointer;font-size:14px;
        font-weight:700;font-family:inherit;border:none;
        transition:transform .15s,box-shadow .15s}
      .aw-btn-primary{background:linear-gradient(135deg,#c9b27a,#a89066);color:#1a1510;
        box-shadow:0 4px 14px rgba(201,178,122,.3)}
      .aw-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(201,178,122,.45)}
      .aw-btn-ghost{background:transparent;color:#c9b27a;border:1px solid rgba(201,178,122,.4)}
      .aw-btn-ghost:hover{background:rgba(201,178,122,.1)}
    `;
    document.head.appendChild(s);
  }

  const HORSE = `<svg viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M58.4,17c-0.5-0.2-1-0.5-1.6-0.7c-0.1,0-0.2-0.1-0.4-0.1c-0.1,0-0.1-0.1-0.2-0.1c-1-0.4-1.9-0.7-1.9-0.7c-10.5-3.8-25.1-3.8-38.2-4.1c3.8,3.6,9.2,5.7,13.3,9.1c-6.8,9.2-13,18.9-19.2,28.6c0,0,9.6,7.3,15.1,12.3c3.8-3.5,7.4-8.5,11.6-12c4.9-3.2,5.6,1,5.6,1.8c0.7,9.4-4.1,25.1,1,32.9c16.4,0,28.1,0,44.5,0C78.9,58.3,81.8,27.4,58.4,17z"/><path d="M8,51.9c-1.1,1.8-2.2,3.4-3.4,5.1c0,0-3.4,5-3.2,5.5c0.2,0.4,2.2,2.3,3.3,2.9c1.1,0.6,2.2,0.9,2.9,0.8c2.3-0.5,4.1-2.1,5.9-3.6c0.2-0.2,1.3-0.3,1.3,0.8c0,0.6-4.1,5.9-4.1,5.9c0.8,1,1.8,1.9,2.7,2.7c2.8-2.7,5.9-5,8.4-8C17.9,59.4,13,55.6,8,51.9z"/></svg>`;

  /* ---------- Tooltip arrow positioning ---------- */
  function positionTooltip(tip, bellRect){
    // Tooltip sits ABOVE the bell, anchored to its right edge
    const tipW = tip.offsetWidth || 260;
    const tipH = tip.offsetHeight || 90;
    const margin = 12;
    let top = bellRect.top - tipH - margin;
    let left = bellRect.right - tipW;
    // Ensure on-screen
    if (top < 8) top = bellRect.bottom + margin;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';

    // Position the arrow under the tip, pointing at the bell
    const arrow = tip.querySelector('.arrow');
    if (arrow) {
      const bellCenterX = bellRect.left + bellRect.width/2;
      const arrowLeft = Math.max(12, Math.min(tipW - 22, bellCenterX - left - 7));
      arrow.style.left = arrowLeft + 'px';
      // Arrow at bottom if tip is above bell, top if below
      if (top + tipH <= bellRect.top) {
        arrow.style.bottom = '-7px';
        arrow.style.top = 'auto';
        arrow.style.transform = 'rotate(45deg)';
      } else {
        arrow.style.top = '-7px';
        arrow.style.bottom = 'auto';
        arrow.style.transform = 'rotate(-135deg)';
      }
    }
  }

  let activeTip = null;
  function showBellTooltip(){
    const bellHost = document.getElementById('arsan-notif-bell-host');
    const bellBtn = bellHost && bellHost.querySelector('.arsan-notif-btn');
    if (!bellBtn) {
      // bell not mounted yet, retry
      setTimeout(showBellTooltip, 600);
      return;
    }
    bellBtn.classList.add('aw-pulse');

    const tip = document.createElement('div');
    tip.className = 'aw-bell-tip';
    tip.innerHTML = `
      <button class="x" aria-label="إغلاق">×</button>
      <strong>${t('🔔 لديك إشعار جديد','🔔 You have a new notification')}</strong>
      <div>${t('اضغط على الجرس لقراءة رسالة الترحيب من الأدهم.','Tap the bell to read the welcome message from Al-Adham.')}</div>
      <div class="arrow"></div>
    `;
    document.body.appendChild(tip);
    activeTip = tip;
    requestAnimationFrame(() => positionTooltip(tip, bellBtn.getBoundingClientRect()));

    const reposition = () => {
      if (!activeTip) return;
      const r = bellBtn.getBoundingClientRect();
      positionTooltip(tip, r);
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    tip.querySelector('.x').addEventListener('click', () => {
      dismissTip();
      // User dismissed without reading → still show modal after a bit
      setTimeout(triggerModal, 800);
    });

    // Watch for the bell being clicked (panel opens) → mark notif read → fire modal
    const onBellClick = () => {
      dismissTip();
      // Wait a moment for them to actually read, then fire modal
      // Mark welcome notif as read explicitly
      try {
        const read = new Set(JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || '[]'));
        read.add(WELCOME_NOTIF_ID);
        localStorage.setItem(NOTIF_READ_KEY, JSON.stringify([...read]));
      } catch(_){}
      // Wait for user to actually close the panel before showing the modal
      waitForPanelClose();
    };
    bellBtn.addEventListener('click', onBellClick, { once: true });

    function dismissTip(){
      if (!activeTip) return;
      activeTip.remove();
      activeTip = null;
      bellBtn.classList.remove('aw-pulse');
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    }
  }

  function waitForPanelClose(){
    // Poll until panel is hidden again (user closed it)
    const start = Date.now();
    const check = () => {
      const panel = document.querySelector('.arsan-notif-panel');
      const open = panel && (panel.style.display === 'flex' || getComputedStyle(panel).display === 'flex');
      const elapsed = Date.now() - start;
      // If panel is closed (or never opened, after 8s give up and show modal anyway)
      if (!open || elapsed > 12000) {
        // Give a small breath after they close before modal pops
        setTimeout(triggerModal, elapsed > 12000 ? 0 : 700);
        return;
      }
      setTimeout(check, 400);
    };
    setTimeout(check, 1500); // give them at least 1.5s to read
  }

  /* ---------- Step 3: Welcome modal ---------- */
  function triggerModal(){
    if (isSeen(SEEN_KEY)) return;
    const u = me();
    const firstName = (u && u.email) ? u.email.split('@')[0].split('.')[0] : '';
    const cap = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : '';

    const bd = document.createElement('div');
    bd.className = 'aw-bd';
    bd.innerHTML = `
      <div class="aw-modal" role="dialog" aria-modal="true">
        <div class="aw-icon">${HORSE}</div>
        <h2 class="aw-title">${t(
          (cap ? `شكراً ${cap}!` : 'شكراً لك!'),
          (cap ? `Thanks ${cap}!` : 'Thank you!')
        )}</h2>
        <p class="aw-sub">${t(
          'الآن خلّيني آخذك في <span class="aw-name">جولة سريعة</span> (~دقيقة) أعرّفك فيها على أهم الأماكن في المنصة.',
          'Now let me take you on a <span class="aw-name">quick tour</span> (~1 min) through the most important spots.'
        )}</p>
        <div class="aw-actions">
          <button class="aw-btn aw-btn-primary" id="aw-tour">${t('🚀 ابدأ الجولة','🚀 Start the tour')}</button>
          <button class="aw-btn aw-btn-ghost" id="aw-skip">${t('لاحقاً','Later')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(bd);

    function close(){ markSeen(SEEN_KEY); bd.remove(); }
    bd.querySelector('#aw-tour').addEventListener('click', () => {
      close();
      setTimeout(() => {
        if (window.ArsanTour && window.ArsanTour.start) window.ArsanTour.start();
      }, 250);
    });
    bd.querySelector('#aw-skip').addEventListener('click', () => {
      markSeen(TOUR_SEEN_KEY);
      close();
    });
  }

  /* ---------- Orchestrator ---------- */
  function start(){
    if (isSeen(SEEN_KEY)) return;
    const u = me();
    if (!u || !u.email) return;
    injectStyles();
    injectWelcomeNotif();
    // Wait for bell to mount, then show tip
    setTimeout(showBellTooltip, 1200);
  }

  window.ArsanWelcome = {
    start,
    triggerModal,
    reset(){
      try {
        localStorage.removeItem(SEEN_KEY);
        localStorage.removeItem(NOTIF_INJECTED_KEY);
        localStorage.removeItem(TOUR_SEEN_KEY);
        // Also remove the welcome notif itself
        const list = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
        const filtered = list.filter(a => a.id !== WELCOME_NOTIF_ID);
        localStorage.setItem(STORE_KEY, JSON.stringify(filtered));
        const read = new Set(JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || '[]'));
        read.delete(WELCOME_NOTIF_ID);
        localStorage.setItem(NOTIF_READ_KEY, JSON.stringify([...read]));
      } catch(_){}
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

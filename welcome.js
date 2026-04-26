/* welcome.js — One-time welcome modal for new users
 * Shows on FIRST login. Dismissed = never shown again.
 * Provides 2 actions: "Start Tour" or "Skip"
 */
(function(){
  if (window.__arsanWelcomeLoaded) return;
  window.__arsanWelcomeLoaded = true;

  const SEEN_KEY = 'arsan_welcome_seen_v1';
  const TOUR_SEEN_KEY = 'arsan_tour_seen_v1';

  function lang(){ return localStorage.getItem('arsan_lang') || 'ar'; }
  function t(ar, en){ return lang() === 'en' ? en : ar; }
  function me(){ try { return JSON.parse(localStorage.getItem('arsan_me_v1')||localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } }

  function injectStyles(){
    if (document.getElementById('arsan-welcome-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-welcome-styles';
    s.textContent = `
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
      .aw-sub{font-size:14.5px;line-height:1.7;color:#d4c9aa;margin:0 0 20px}
      .aw-card{background:rgba(133,113,77,.10);border:1px solid rgba(201,178,122,.22);
        border-radius:12px;padding:14px 16px;margin:0 0 22px;text-align:start;
        font-size:13.5px;line-height:1.7;color:#e8dfc8}
      .aw-card strong{color:#c9b27a}
      .aw-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
      .aw-btn{padding:11px 22px;border-radius:10px;cursor:pointer;font-size:14px;
        font-weight:700;font-family:inherit;border:none;
        transition:transform .15s,box-shadow .15s}
      .aw-btn-primary{background:linear-gradient(135deg,#c9b27a,#a89066);color:#1a1510;
        box-shadow:0 4px 14px rgba(201,178,122,.3)}
      .aw-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(201,178,122,.45)}
      .aw-btn-ghost{background:transparent;color:#c9b27a;border:1px solid rgba(201,178,122,.4)}
      .aw-btn-ghost:hover{background:rgba(201,178,122,.1)}
      html[lang="en"] .aw-modal{text-align:center}
    `;
    document.head.appendChild(s);
  }

  const HORSE = `<svg viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M58.4,17c-0.5-0.2-1-0.5-1.6-0.7c-0.1,0-0.2-0.1-0.4-0.1c-0.1,0-0.1-0.1-0.2-0.1c-1-0.4-1.9-0.7-1.9-0.7c-10.5-3.8-25.1-3.8-38.2-4.1c3.8,3.6,9.2,5.7,13.3,9.1c-6.8,9.2-13,18.9-19.2,28.6c0,0,9.6,7.3,15.1,12.3c3.8-3.5,7.4-8.5,11.6-12c4.9-3.2,5.6,1,5.6,1.8c0.7,9.4-4.1,25.1,1,32.9c16.4,0,28.1,0,44.5,0C78.9,58.3,81.8,27.4,58.4,17z"/><path d="M8,51.9c-1.1,1.8-2.2,3.4-3.4,5.1c0,0-3.4,5-3.2,5.5c0.2,0.4,2.2,2.3,3.3,2.9c1.1,0.6,2.2,0.9,2.9,0.8c2.3-0.5,4.1-2.1,5.9-3.6c0.2-0.2,1.3-0.3,1.3,0.8c0,0.6-4.1,5.9-4.1,5.9c0.8,1,1.8,1.9,2.7,2.7c2.8-2.7,5.9-5,8.4-8C17.9,59.4,13,55.6,8,51.9z"/></svg>`;

  function show(){
    injectStyles();
    const u = me();
    const firstName = (u && u.email) ? u.email.split('@')[0].split('.')[0] : '';
    const cap = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : '';

    const bd = document.createElement('div');
    bd.className = 'aw-bd';
    bd.innerHTML = `
      <div class="aw-modal" role="dialog" aria-modal="true">
        <div class="aw-icon">${HORSE}</div>
        <h2 class="aw-title">${t(
          (cap ? `أهلاً ${cap}، ` : '') + 'مرحباً بك في منصّة أرسان',
          (cap ? `Hi ${cap}, ` : '') + 'Welcome to the Arsan Platform'
        )}</h2>
        <p class="aw-sub">${t(
          'أنا <span class="aw-name">الأدهم</span> — مساعدك الذكي. سأرشدك لكل ما تحتاج معرفته.',
          'I am <span class="aw-name">Al-Adham</span> — your AI assistant. I will guide you through everything.'
        )}</p>
        <div class="aw-card">
          ${t(
            '<strong>ماذا يمكنني لك هنا؟</strong><br>• تصفّح وإضافة وتعديل الإجراءات التشغيلية<br>• التواصل مع الإدارات الأخرى عبر الرسائل<br>• متابعة المهام واعتماد الإجراءات<br>• استخدام الذكاء الاصطناعي للمساعدة',
            '<strong>What can you do here?</strong><br>• Browse, add, and edit SOPs<br>• Communicate with other departments via messages<br>• Track tasks and approve procedures<br>• Use AI assistance'
          )}
        </div>
        <div class="aw-actions">
          <button class="aw-btn aw-btn-primary" id="aw-tour">${t('🚀 خذني في جولة (دقيقتين)','🚀 Take the tour (2 min)')}</button>
          <button class="aw-btn aw-btn-ghost" id="aw-skip">${t('تخطّي','Skip')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(bd);

    function close(){
      try { localStorage.setItem(SEEN_KEY, '1'); } catch(_){}
      bd.remove();
    }
    bd.querySelector('#aw-tour').addEventListener('click', () => {
      close();
      setTimeout(() => {
        if (window.ArsanTour && window.ArsanTour.start) window.ArsanTour.start();
      }, 200);
    });
    bd.querySelector('#aw-skip').addEventListener('click', () => {
      // Mark tour as seen too — user explicitly skipped
      try { localStorage.setItem(TOUR_SEEN_KEY, '1'); } catch(_){}
      close();
    });
    bd.addEventListener('click', e => { if (e.target === bd) { /* don't close on backdrop, force a choice */ }});
  }

  function maybeShow(){
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch(_){}
    if (seen) return;
    const u = me();
    if (!u || !u.email) return;
    setTimeout(show, 900);
  }

  window.ArsanWelcome = {
    show,
    reset(){ try { localStorage.removeItem(SEEN_KEY); localStorage.removeItem(TOUR_SEEN_KEY); } catch(_){} }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeShow);
  } else {
    maybeShow();
  }
})();

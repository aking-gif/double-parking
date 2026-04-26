/* Arsan Welcome Popup
 * Shows a motivational message after login — once per session.
 * Rotates through a curated list of Arabic quotes.
 */
(function(){
  'use strict';

  const SHOWN_KEY = 'arsan_welcome_shown_session';  // sessionStorage — shows once per browser session (i.e. each fresh login)
  const LAST_QUOTE_KEY = 'arsan_welcome_last_idx';
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const QUOTES = [
    { t: 'صباح الإنجاز 🌅', s: 'كل إجراء تُتقنه اليوم، يبني أرسان الغد.' },
    { t: 'نحو التميّز ⭐', s: 'الجودة ليست صدفة، بل نتيجة جهد ذكيّ ومستمر.' },
    { t: 'فريق واحد 🤝', s: 'معاً نصنع معايير تُحتذى، لا مجرد إجراءات تُنفّذ.' },
    { t: 'ابدأ بقوة 💪', s: 'أفضل إجراء هو الذي تكتبه اليوم، لا الذي تنتظره غداً.' },
    { t: 'النظام يبني المستقبل 🏗️', s: 'كل خطوة موثّقة هي لبنة في صرح أرسان.' },
    { t: 'التحسين رحلة 🚀', s: 'لا يوجد إجراء مثالي، بل إجراء يتطوّر مع فريقه.' },
    { t: 'التفاصيل تصنع الفارق 🔍', s: 'ما تكتبه اليوم، يوفّر على زملائك ساعات غداً.' },
    { t: 'أنت تُحدث فرقاً 🌟', s: 'مساهمتك في المنصّة اليوم تُلهم من سيأتي بعدك.' },
    { t: 'المعرفة تُشارك 📚', s: 'خبرتك ثروة — دوّنها، ليستفيد منها الجميع.' },
    { t: 'نحو الاحتراف 🎯', s: 'الإجراء الجيد لا يُنسى، والعمل المنظّم لا يُهزم.' },
    { t: 'أهلاً بك 🌿', s: 'أرسان تنمو معك، وأنت جزء من كل إنجاز.' },
    { t: 'انطلاقة موفّقة ✨', s: 'اليوم فرصة جديدة لبناء شيء يدوم.' },
    { t: 'ثقة وإتقان 🏛️', s: 'الاحترافية عادة يومية، لا إنجاز لحظي.' },
    { t: 'خطوة بخطوة 🪜', s: 'أرسان تُبنى بجهد الجميع، وأنت عنصر أساسي فيها.' },
    { t: 'كن الفارق 🌱', s: 'مساهمتك الصغيرة اليوم قد تصبح مرجع الغد.' },
  ];

  function lang(){ return (localStorage.getItem('arsan_lang') || 'ar'); }
  function me(){
    try { return JSON.parse(localStorage.getItem('arsan_me') || '{}'); } catch(_){ return {}; }
  }
  function profileCache(){
    try { return JSON.parse(localStorage.getItem('arsan_profile_v1') || '{}'); } catch(_){ return {}; }
  }
  function firstName(email){
    // 1) من البروفايل المحفوظ (اسم حقيقي)
    const prof = profileCache();
    if (prof.firstName && String(prof.firstName).trim()) {
      return String(prof.firstName).trim();
    }
    // 2) fallback: من الإيميل
    if (!email) return '';
    const local = String(email).split('@')[0] || '';
    return local.split('.')[0].replace(/^./, c => c.toUpperCase());
  }
  function fullName(email){
    const prof = profileCache();
    if (prof.firstName) {
      return (prof.firstName + (prof.lastName ? ' ' + prof.lastName : '')).trim();
    }
    return firstName(email);
  }
  function hasProfile(){
    const prof = profileCache();
    return !!(prof.firstName && String(prof.firstName).trim());
  }

  // جلب البروفايل من السيرفر وتخزينه (لمرة واحدة)
  async function ensureProfile(){
    if (hasProfile()) return;
    try {
      const tok = localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token');
      if (!tok) return;
      const base = window.API_BASE || '';
      const r = await fetch(base + '/api/profile', {
        headers: { 'Authorization': 'Bearer ' + tok }
      });
      if (!r.ok) return;
      const prof = await r.json();
      if (prof && prof.firstName !== undefined) {
        localStorage.setItem('arsan_profile_v1', JSON.stringify({
          firstName: prof.firstName || '',
          lastName: prof.lastName || '',
          phone: prof.phone || ''
        }));
      }
    } catch(_) {}
  }

  function pickQuote(){
    let lastIdx = parseInt(sessionStorage.getItem(LAST_QUOTE_KEY) || '-1', 10);
    let idx = Math.floor(Math.random() * QUOTES.length);
    if (idx === lastIdx && QUOTES.length > 1) idx = (idx + 1) % QUOTES.length;
    sessionStorage.setItem(LAST_QUOTE_KEY, String(idx));
    return QUOTES[idx];
  }

  function injectStyles(){
    if (document.getElementById('arsan-welcome-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-welcome-styles';
    s.textContent = `
      .arsan-welcome-bd{
        position:fixed; inset:0; z-index:99999;
        background:rgba(20,15,8,.65);
        backdrop-filter:blur(8px);
        -webkit-backdrop-filter:blur(8px);
        display:flex; align-items:center; justify-content:center;
        padding:20px;
        opacity:0;
        transition:opacity .35s ease;
      }
      .arsan-welcome-bd.open{ opacity:1; }
      .arsan-welcome-card{
        position:relative;
        max-width:460px; width:100%;
        background:linear-gradient(145deg, #fff9ec 0%, #f6ecc8 100%);
        border:1px solid rgba(61,90,128,.35);
        border-radius:20px;
        padding:40px 32px 32px;
        box-shadow:0 30px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.1) inset;
        text-align:center;
        font-family:'IBM Plex Sans Arabic','Segoe UI',sans-serif;
        direction:rtl;
        transform:translateY(20px) scale(.95);
        transition:transform .5s cubic-bezier(.2,.8,.2,1);
      }
      .arsan-welcome-bd.open .arsan-welcome-card{
        transform:translateY(0) scale(1);
      }
      html[data-theme="light"] .arsan-welcome-card{
        background:linear-gradient(145deg, #fff9ec 0%, #f6ecc8 100%);
      }
      .arsan-welcome-card::before{
        content:'';
        position:absolute; top:-2px; inset-inline:-2px;
        height:4px;
        background:linear-gradient(90deg, transparent, #3D5A80, #98B4D4, #3D5A80, transparent);
        border-radius:20px 20px 0 0;
        opacity:.8;
      }
      .arsan-welcome-logo{
        width:54px; height:54px;
        margin:0 auto 14px;
        border-radius:14px;
        background:linear-gradient(135deg, #3D5A80, #293F5C);
        display:grid; place-items:center;
        color:#fff; font-size:26px; font-weight:700;
        box-shadow:0 8px 24px rgba(61,90,128,.4);
      }
      .arsan-welcome-hello{
        font-size:14px; color:#293F5C; margin-bottom:6px;
        letter-spacing:.3px;
      }
      .arsan-welcome-title{
        font-size:24px; font-weight:700; color:#1A2942;
        margin:0 0 14px;
        line-height:1.3;
      }
      .arsan-welcome-sub{
        font-size:15px; color:#5a4820; line-height:1.7;
        margin:0 0 24px;
      }
      .arsan-welcome-btn{
        background:linear-gradient(135deg, #3D5A80, #293F5C);
        color:#fff;
        border:none;
        padding:12px 32px;
        border-radius:10px;
        font:inherit; font-size:14px; font-weight:600;
        cursor:pointer;
        box-shadow:0 6px 16px rgba(61,90,128,.4);
        transition:transform .15s, box-shadow .15s;
      }
      .arsan-welcome-btn:hover{
        transform:translateY(-1px);
        box-shadow:0 8px 20px rgba(61,90,128,.55);
      }
      .arsan-welcome-x{
        position:absolute; top:12px; inset-inline-start:12px;
        background:transparent; border:none;
        width:32px; height:32px; border-radius:8px;
        color:#293F5C; opacity:.5;
        cursor:pointer; font-size:18px;
      }
      .arsan-welcome-x:hover{ opacity:1; background:rgba(61,90,128,.15); }
      .arsan-welcome-date{
        font-size:11px; color:#9a8550; margin-top:18px;
        letter-spacing:.3px;
      }
    `;
    document.head.appendChild(s);
  }

  async function show(){
    if (sessionStorage.getItem(SHOWN_KEY) === "1") return;

    const user = me();
    if (!user || !user.email) return; // only logged-in

    // ⏳ جلب البروفايل من الـ API قبل البناء (لو أول مرة)
    await ensureProfile();

    sessionStorage.setItem(SHOWN_KEY, "1");
    injectStyles();

    const q = pickQuote();
    const name = firstName(user.email);
    const noProfile = !hasProfile();
    const isEn = lang() === 'en';
    const greeting = isEn
      ? (name ? `Welcome back, ${name}` : 'Welcome back')
      : (name ? `أهلاً بعودتك، ${name}` : 'أهلاً بعودتك');

    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const bd = document.createElement('div');
    bd.className = 'arsan-welcome-bd';
    const profileNudge = noProfile
      ? (isEn
          ? '<div style="margin-top:14px;padding:10px 14px;background:rgba(61,90,128,.08);border:1px dashed rgba(61,90,128,.3);border-radius:10px;font-size:12.5px;color:#293F5C">💡 Add your name in your <a href="profile.html" style="color:#3D5A80;font-weight:600;text-decoration:none;border-bottom:1px solid currentColor">profile</a> for personalized greetings.</div>'
          : '<div style="margin-top:14px;padding:10px 14px;background:rgba(61,90,128,.08);border:1px dashed rgba(61,90,128,.3);border-radius:10px;font-size:12.5px;color:#293F5C">💡 أضف اسمك من <a href="profile.html" style="color:#3D5A80;font-weight:600;text-decoration:none;border-bottom:1px solid currentColor">صفحة البروفايل</a> لتظهر التحيات باسمك الحقيقي.</div>')
      : '';
    bd.innerHTML = `
      <div class="arsan-welcome-card" role="dialog" aria-modal="true">
        <button class="arsan-welcome-x" type="button" aria-label="إغلاق">✕</button>
        <div class="arsan-welcome-logo" id="arsan-welcome-logo-mark"></div>
        <div class="arsan-welcome-hello">${greeting}</div>
        <h2 class="arsan-welcome-title">${q.t}</h2>
        <p class="arsan-welcome-sub">${q.s}</p>
        ${profileNudge}
        <button class="arsan-welcome-btn" type="button">${isEn ? 'Let\'s go' : 'لنبدأ اليوم'}</button>
        <div class="arsan-welcome-date">${dateStr}</div>
      </div>
    `;
    document.body.appendChild(bd);
    // حقن شعار أرسان
    try {
      const logoEl = bd.querySelector('#arsan-welcome-logo-mark');
      if (logoEl && window.ArsanBrand && window.ArsanBrand.logo) {
        logoEl.innerHTML = window.ArsanBrand.logo(64);
        logoEl.style.background = 'transparent';
        logoEl.style.boxShadow = 'none';
        logoEl.style.display = 'flex';
        logoEl.style.alignItems = 'center';
        logoEl.style.justifyContent = 'center';
      }
    } catch(e) {}
    requestAnimationFrame(() => bd.classList.add('open'));

    const close = () => {
      bd.classList.remove('open');
      setTimeout(() => bd.remove(), 350);
    };
    bd.querySelector('.arsan-welcome-x').addEventListener('click', close);
    bd.querySelector('.arsan-welcome-btn').addEventListener('click', close);
    bd.addEventListener('click', (e) => { if (e.target === bd) close(); });

    // ESC to close
    const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
  }

  function init(){
    // Wait a moment for auth to settle
    setTimeout(show, 600);
    // Retry multiple times in case auth is slow to populate
    setTimeout(show, 1500);
    setTimeout(show, 3000);
    // Also listen for login events (if app emits one)
    window.addEventListener('arsan-auth-change', () => {
      if (me().email) {
        sessionStorage.removeItem(SHOWN_KEY);
        setTimeout(show, 300);
      }
    });
    // Console helper for testing
    window.showWelcome = () => {
      sessionStorage.removeItem(SHOWN_KEY);
      show();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ArsanWelcome = { show, quotes: QUOTES };
})();

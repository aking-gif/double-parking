/* Arsan Index Auth Gate
 * - Blocks index.html behind a login screen
 * - Filters department cards based on the user's `departments[]` (admins see all)
 * - Reuses /api/login, /api/me, /api/custom-depts endpoints on the Worker
 *
 * Load this AFTER the main inline <script> that defines DEPARTMENTS and renders cards.
 * Set window.API_BASE (optional) if the Worker is on a different origin.
 */
(function(){
  'use strict';

  const API = (typeof API_BASE !== 'undefined' && API_BASE)
    || (window.API_BASE || '');
  const TOKEN_KEY = 'arsan_token_v1';
  const LS_LAST_EMAIL = 'arsan_last_email';

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  function el(tag, attrs={}, ...children){
    const n = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'style') n.style.cssText = attrs[k];
      else if (k === 'innerHTML') n.innerHTML = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    }
    for (const c of children) {
      if (c == null) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  function getToken(){ return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('arsan_token') || ''; }
  function setToken(t){
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem('arsan_token', t); // ✅ توافق مع dashboard.html القديم
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('arsan_token');
    }
  }

  async function api(path, opts={}){
    const token = getToken();
    const headers = Object.assign({ 'Content-Type':'application/json' }, opts.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers,
      credentials: 'include',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    let data;
    try { data = await res.json(); } catch(e){ data = {}; }
    if (!res.ok) throw new Error(data.error || ('http-' + res.status));
    return data;
  }

  function injectStyles(){
    if (document.getElementById('arsan-gate-styles')) return;
    const style = document.createElement('style');
    style.id = 'arsan-gate-styles';
    style.textContent = `
      .ag-bd{
        position:fixed;inset:0;z-index:9999;
        background:
          radial-gradient(circle at 15% 25%, rgba(133,113,77,.25) 0%, transparent 40%),
          radial-gradient(circle at 85% 75%, rgba(100,70,180,.18) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(180,120,60,.15) 0%, transparent 60%),
          linear-gradient(135deg, #0a0612 0%, #140a1e 30%, #1a0f0a 70%, #0f0a06 100%);
        display:grid;place-items:center;padding:20px;
        overflow:hidden;
      }
      /* Animated aurora layer */
      .ag-bd::before{
        content:'';position:absolute;inset:-20%;
        background:
          radial-gradient(ellipse 40% 30% at 20% 30%, rgba(133,113,77,.35), transparent 60%),
          radial-gradient(ellipse 45% 35% at 75% 20%, rgba(160,100,200,.25), transparent 55%),
          radial-gradient(ellipse 50% 40% at 60% 80%, rgba(220,140,80,.22), transparent 60%);
        filter:blur(40px);
        animation: ag-aurora 20s ease-in-out infinite alternate;
        pointer-events:none;
      }
      @keyframes ag-aurora{
        0%   { transform:translate(0,0) scale(1); }
        50%  { transform:translate(-5%, 3%) scale(1.08); }
        100% { transform:translate(3%,-2%) scale(1.02); }
      }
      /* Arabic calligraphy watermark */
      .ag-bd::after{
        content:'';position:absolute;inset:0;
        background-image:
          linear-gradient(rgba(133,113,77,.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(133,113,77,.05) 1px, transparent 1px);
        background-size: 60px 60px;
        mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
        pointer-events:none;
        opacity:.5;
      }
      html[data-theme="light"] .ag-bd{
        background:
          radial-gradient(circle at 15% 25%, rgba(133,113,77,.3) 0%, transparent 40%),
          radial-gradient(circle at 85% 75%, rgba(140,110,200,.2) 0%, transparent 45%),
          linear-gradient(135deg, #faf6ea 0%, #f0e5c9 40%, #e6d8a8 80%, #dbc88a 100%);
      }
      html[data-theme="light"] .ag-bd::before{
        background:
          radial-gradient(ellipse 40% 30% at 20% 30%, rgba(133,113,77,.4), transparent 60%),
          radial-gradient(ellipse 45% 35% at 75% 20%, rgba(180,140,220,.3), transparent 55%),
          radial-gradient(ellipse 50% 40% at 60% 80%, rgba(230,180,120,.3), transparent 60%);
        filter:blur(50px);
      }

      /* GLASS card */
      .ag-card{
        position:relative;
        background:rgba(255,255,255,.08);
        backdrop-filter:blur(30px) saturate(180%);
        -webkit-backdrop-filter:blur(30px) saturate(180%);
        border:1px solid rgba(255,255,255,.18);
        border-radius:24px;
        padding:40px 36px;
        max-width:440px;width:100%;
        box-shadow:
          0 30px 80px rgba(0,0,0,.45),
          inset 0 1px 0 rgba(255,255,255,.15),
          inset 0 -1px 0 rgba(0,0,0,.1);
        animation:ag-in .5s cubic-bezier(.2,.9,.3,1.1) both;
        color:#f3e9c9;
        overflow:hidden;
      }
      /* Subtle gold highlight along the top edge */
      .ag-card::before{
        content:'';position:absolute;top:0;left:0;right:0;height:1px;
        background:linear-gradient(90deg, transparent, rgba(133,113,77,.6), transparent);
      }
      html[data-theme="light"] .ag-card{
        background:rgba(255,255,255,.45);
        border-color:rgba(255,255,255,.6);
        color:#2a1f10;
        box-shadow:
          0 30px 80px rgba(0,0,0,.12),
          inset 0 1px 0 rgba(255,255,255,.8),
          inset 0 -1px 0 rgba(133,113,77,.15);
      }
      @keyframes ag-in{
        from{opacity:0;transform:translateY(12px) scale(.98)}
        to{opacity:1;transform:none}
      }
      .ag-logo{
        text-align:center;margin-bottom:22px;
      }
      .ag-logo-mark{
        display:inline-grid;place-items:center;
        width:auto;height:110px;
        background:transparent;
        filter: drop-shadow(0 6px 18px rgba(133,113,77,.45));
      }
      .ag-logo-mark img{
        width:auto; height:100%;
        display:block;
      }
      .ag-title{
        text-align:center;font-size:24px;font-weight:700;
        color:inherit;
        margin:0 0 6px;letter-spacing:-.01em;
      }
      .ag-sub{
        text-align:center;font-size:13px;opacity:.65;margin:0 0 26px;
        font-weight:400;
      }
      .ag-field{margin-bottom:14px}
      .ag-field label{
        display:block;font-size:12px;font-weight:500;
        opacity:.75;margin-bottom:6px;letter-spacing:.2px;
      }
      .ag-field input{
        width:100%;padding:13px 15px;box-sizing:border-box;
        border:1px solid rgba(133,113,77,.25);
        border-radius:11px;
        font:inherit;font-size:14px;
        color:inherit;
        background:rgba(255,255,255,.06);
        backdrop-filter:blur(10px);
        transition:border-color .15s, box-shadow .15s, background .15s;
      }
      html[data-theme="light"] .ag-field input{
        background:rgba(255,255,255,.5);
        border-color:rgba(133,113,77,.35);
      }
      .ag-field input::placeholder{ opacity:.4; }
      .ag-field input:focus{
        outline:none;
        border-color:rgba(133,113,77,.65);
        background:rgba(133,113,77,.08);
        box-shadow:0 0 0 3px rgba(133,113,77,.18);
      }
      .ag-err{
        background:rgba(230,57,70,.12);
        border:1px solid rgba(230,57,70,.35);
        color:#ff8a95;
        padding:10px 12px;border-radius:9px;font-size:13px;
        margin-bottom:12px;display:none;
      }
      html[data-theme="light"] .ag-err{ color:#c5303c; }
      .ag-err.show{display:block}
      .ag-btn{
        width:100%;padding:13px 16px;
        background:linear-gradient(180deg,#A89066 0%, #85714D 45%, #5E4F36 100%);
        color:#fff;border:none;border-radius:11px;
        font:inherit;font-size:14px;font-weight:600;
        cursor:pointer;
        transition:filter .15s, transform .05s, box-shadow .2s;
        box-shadow:
          0 6px 20px rgba(133,113,77,.35),
          inset 0 1px 0 rgba(255,255,255,.25);
        letter-spacing:.3px;
      }
      .ag-btn:hover:not(:disabled){
        filter:brightness(1.08);
        box-shadow:
          0 10px 28px rgba(133,113,77,.5),
          inset 0 1px 0 rgba(255,255,255,.3);
      }
      .ag-btn:active{transform:translateY(1px)}
      .ag-btn:disabled{opacity:.6;cursor:not-allowed}
      .ag-forgot{
        text-align:center;margin-top:16px;
        font-size:12.5px;
      }
      .ag-forgot a{color:inherit;opacity:.6;text-decoration:underline;cursor:pointer}
      .ag-forgot a:hover{opacity:1}
      .ag-footer{
        text-align:center;margin-top:24px;padding-top:18px;
        border-top:1px solid rgba(133,113,77,.15);
        font-size:11px;opacity:.5;letter-spacing:.3px;
      }

      /* User badge on index — embedded glass pill, bottom-opposite from sidebar */
      .ag-userbadge{
        position:fixed;
        bottom:18px;
        /* RTL default: sidebar FAB is top-right → badge sits bottom-LEFT */
        inset-inline-start:18px;
        inset-inline-end:auto;
        z-index:500;
        display:flex;align-items:center;gap:10px;
        padding:8px 12px 8px 8px;
        border-radius:999px;
        background:linear-gradient(135deg, rgba(250,246,234,.9) 0%, rgba(243,234,208,.9) 100%);
        backdrop-filter:blur(16px) saturate(180%);
        -webkit-backdrop-filter:blur(16px) saturate(180%);
        border:1px solid rgba(133,113,77,.3);
        color:#3a2f15;
        font-size:12px;
        box-shadow:0 8px 24px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.5);
        transition:all .2s ease;
      }
      html[dir="ltr"] .ag-userbadge{
        inset-inline-start:auto;
        inset-inline-end:18px;
      }
      .ag-userbadge:hover{
        transform:translateY(-2px);
        box-shadow:0 12px 28px rgba(0,0,0,.12);
      }
      html[data-theme="dark"] .ag-userbadge{
        background:linear-gradient(135deg, rgba(26,21,16,.85) 0%, rgba(42,32,20,.85) 100%);
        color:#f3e9c9;
        border-color:rgba(133,113,77,.35);
        box-shadow:0 8px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.05);
      }
      .ag-userbadge .avatar{
        width:30px;height:30px;border-radius:50%;
        background:linear-gradient(135deg,#85714D,#5E4F36);
        display:grid;place-items:center;color:#fff;
        font-weight:700;font-size:13px;
        box-shadow:0 2px 6px rgba(133,113,77,.4);
        flex-shrink:0;
      }
      .ag-userbadge .meta{line-height:1.25; min-width:0;}
      .ag-userbadge .meta strong{
        display:block;font-size:12.5px;font-weight:600;
        max-width:140px;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      }
      .ag-userbadge .meta small{font-size:10.5px;color:#8a7c55;display:flex;align-items:center;gap:3px}
      html[data-theme="dark"] .ag-userbadge .meta small{color:#c4b58a}
      .ag-userbadge .meta small .star{color:#85714D}
      .ag-userbadge .caret{
        background:none;border:none;cursor:pointer;color:inherit;
        opacity:.5;padding:4px 2px;
        display:grid;place-items:center;
        transition:opacity .15s, transform .2s;
      }
      .ag-userbadge .caret:hover{opacity:1}
      .ag-userbadge.menu-open .caret{ transform:rotate(180deg); opacity:1; }

      /* Dropdown menu for user badge */
      .ag-userbadge-menu{
        position:fixed;
        bottom:70px;
        inset-inline-start:18px;
        inset-inline-end:auto;
        z-index:501;
        min-width:220px;
        padding:6px;
        border-radius:12px;
        background:linear-gradient(180deg, rgba(250,246,234,.96) 0%, rgba(243,234,208,.94) 100%);
        backdrop-filter:blur(20px) saturate(180%);
        border:1px solid rgba(133,113,77,.3);
        color:#3a2f15;
        box-shadow:0 20px 50px rgba(0,0,0,.15);
        display:none;
        flex-direction:column;
        gap:2px;
      }
      html[dir="ltr"] .ag-userbadge-menu{
        inset-inline-start:auto;
        inset-inline-end:18px;
      }
      html[data-theme="dark"] .ag-userbadge-menu{
        background:linear-gradient(180deg, rgba(26,21,16,.95) 0%, rgba(35,26,16,.92) 100%);
        color:#f3e9c9;
        border-color:rgba(133,113,77,.35);
        box-shadow:0 20px 50px rgba(0,0,0,.45);
      }
      .ag-userbadge-menu.open{ display:flex; }
      .ag-userbadge-menu button{
        display:flex;align-items:center;gap:10px;width:100%;
        padding:9px 12px;border-radius:8px;
        background:transparent;border:none;color:inherit;
        font:inherit;font-size:13px;cursor:pointer;
        text-align:start;
      }
      .ag-userbadge-menu button:hover{ background:rgba(133,113,77,.15); }
      .ag-userbadge-menu .icn{ font-size:15px; width:22px; text-align:center; flex-shrink:0; }
      .ag-userbadge-menu .divider{
        height:1px; margin:4px 8px;
        background:rgba(133,113,77,.2);
      }
      .ag-userbadge-menu button.danger{ color:#c5303c; }
      html[data-theme="dark"] .ag-userbadge-menu button.danger{ color:#ff7081; }

      /* Locked department card */
      .dept-card.ag-locked{
        opacity:.45;pointer-events:none;position:relative;
      }
      .dept-card.ag-locked::after{
        content:'🔒';position:absolute;top:12px;inset-inline-end:12px;
        font-size:14px;
      }
    `;
    document.head.appendChild(style);
  }

  function showLoginScreen(){
    injectStyles();
    // Hide page body so login is the only thing visible
    const pageMain = document.querySelector('main, .container, body > *:not(script):not(style):not(.ag-bd)');
    // Instead, just overlay — simpler
    if (document.getElementById('ag-bd')) return;

    const bd = el('div', { class: 'ag-bd', id: 'ag-bd' });
    const err = el('div', { class: 'ag-err' });
    const emailIn = el('input', {
      type: 'email',
      placeholder: 'name@arsann.com',
      autocomplete: 'email',
      value: localStorage.getItem(LS_LAST_EMAIL) || ''
    });
    const passIn = el('input', { type: 'password', placeholder: '••••••••', autocomplete: 'current-password' });

    const submitBtn = el('button', { class: 'ag-btn', type: 'submit' }, 'تسجيل الدخول');

    async function doLogin(e){
      if (e) e.preventDefault();
      err.classList.remove('show');
      const email = emailIn.value.trim().toLowerCase();
      const password = passIn.value;
      if (!email || !password) {
        err.textContent = 'الرجاء إدخال البريد الإلكتروني وكلمة السر للمتابعة.';
        err.classList.add('show');
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'جاري التحقق…';
      try {
        const data = await api('/api/login', { method: 'POST', body: { email, password } });
        setToken(data.token);
        localStorage.setItem(LS_LAST_EMAIL, email);
        // Also cache the user object so dashboard.html can read it on load
        if (data.user || (data.email && data.role)) {
          const u = data.user || { email: data.email, role: data.role, departments: data.departments || [] };
          try { localStorage.setItem('arsan_me_v1', JSON.stringify(u)); } catch(_){}
          // 🔁 ضمان توافق dashboard القديم مع المفتاح بدون _v1
          try { localStorage.setItem('arsan_me', JSON.stringify(u)); } catch(_){}
        }
        // 🔁 إعادة لـ المسار الأصلي إن وُجد (حُفظ بواسطة hard-guard في dashboard)
        try {
          const ret = sessionStorage.getItem('arsan_return_to');
          if (ret && ret !== location.href) {
            sessionStorage.removeItem('arsan_return_to');
            location.replace(ret);
            return;
          }
        } catch(_){}
        // Close gate and re-run filtering
        bd.style.animation = 'ag-in .25s reverse';
        setTimeout(() => bd.remove(), 250);
        await hydrateUser();
      } catch(ex) {
        const msg = (ex.message || '').toLowerCase();
        if (msg.includes('invalid-credentials') || msg.includes('401')) {
          err.textContent = 'البريد الإلكتروني أو كلمة السر غير صحيحة. يرجى المحاولة مرة أخرى.';
        } else if (msg.includes('user-disabled')) {
          err.textContent = 'هذا الحساب معطّل حالياً. يرجى التواصل مع مسؤول المنصّة.';
        } else if (msg.includes('domain-not-allowed')) {
          err.textContent = 'الوصول مقتصر على بريد @arsann.com المؤسّسي.';
        } else {
          err.textContent = 'تعذّر إتمام تسجيل الدخول:\n' + (ex.message || 'خطأ غير معروف');
        }
        err.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الدخول';
      }
    }

    const form = el('form', { onsubmit: doLogin },
      el('div', { class: 'ag-logo' },
        el('div', { class: 'ag-logo-mark', innerHTML: (window.ArsanBrand && window.ArsanBrand.logo) ? window.ArsanBrand.logo(110) : '' })
      ),
      el('h1', { class: 'ag-title' }, 'منصّة أرسان التنفيذيّة'),
      el('p', { class: 'ag-sub' }, 'يرجى تسجيل الدخول للمتابعة'),
      err,
      el('div', { class: 'ag-field' },
        el('label', {}, 'البريد الإلكتروني'),
        emailIn
      ),
      el('div', { class: 'ag-field' },
        el('label', {}, 'كلمة السر'),
        passIn
      ),
      submitBtn,
      el('div', { class: 'ag-forgot' },
        el('a', { onclick: (e) => { e.preventDefault(); showForgot(emailIn.value); } }, 'نسيت كلمة السر؟')
      ),
      el('div', { class: 'ag-footer' }, 'arsann.com • جميع الحقوق محفوظة © 2026')
    );

    const card = el('div', { class: 'ag-card' }, form);
    bd.appendChild(card);
    document.body.appendChild(bd);

    setTimeout(() => {
      (emailIn.value ? passIn : emailIn).focus();
    }, 100);
  }

  async function showForgot(prefillEmail){
    const email = prompt('أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين:', prefillEmail || '');
    if (!email) return;
    try {
      await api('/api/forgot-password', { method: 'POST', body: { email: email.trim().toLowerCase() } });
      alert('✓ تم إرسال الطلب بنجاح.\n\nإذا كان البريد الإلكتروني مسجّلاً لدينا، ستصلك رسالة تحتوي على رابط إعادة تعيين كلمة السر خلال دقائق.\n\nإن لم تصلك الرسالة، تحقّق من مجلد الرسائل غير المرغوب فيها أو تواصل مع المسؤول.');
    } catch(e) {
      alert('تعذّر إرسال الطلب:\n' + (e.message || 'خطأ في الاتصال بالخادم'));
    }
  }

  function showUserBadge(me){
    // Hidden on the first/landing page per user request — admin actions live in the admin FAB + dashboard.
    return;
    if (document.querySelector('.ag-userbadge')) return;
    const lang = localStorage.getItem('arsan_lang') || 'ar';
    const t = (ar, en) => lang === 'en' ? en : ar;

    const initial = (me.email || '?').slice(0,1).toUpperCase();
    const shortEmail = (me.email || '').split('@')[0];
    const isAdmin = me.role === 'admin' || (me.email || '').toLowerCase() === 'a.king@arsann.com';

    const subtitle = isAdmin
      ? el('small', {}, el('span', { class:'star' }, '⭐ '), t('مسؤول المنصّة', 'Platform Admin'))
      : el('small', {},
          (me.departments && me.departments.length
            ? (me.departments.length + ' ' + t('إدارة', 'departments'))
            : t('عضو', 'Member'))
        );

    const badge = el('div', { class: 'ag-userbadge' },
      el('div', { class: 'avatar' }, initial),
      el('div', { class: 'meta' },
        el('strong', {}, shortEmail),
        subtitle
      ),
      el('button', {
        class: 'caret',
        title: t('القائمة', 'Menu'),
        'aria-label': 'Menu',
      },
        // chevron-down icon
        (() => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width','12'); svg.setAttribute('height','12');
          svg.setAttribute('viewBox','0 0 12 12'); svg.setAttribute('fill','none');
          svg.innerHTML = '<path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
          return svg;
        })()
      )
    );
    document.body.appendChild(badge);

    // Build dropdown menu
    const menu = el('div', { class: 'ag-userbadge-menu' });
    const items = [];

    items.push({
      icon: '🗂',
      label: t('فتح لوحة الإدارة', 'Open Dashboard'),
      action: () => {
        // Go to first dept to land in dashboard
        const firstCard = document.querySelector('.dept-card:not(.ag-locked) a, .dept-card:not(.ag-locked)');
        if (firstCard) firstCard.click();
      }
    });

    if (isAdmin) {
      items.push({
        icon: '👥',
        label: t('المستخدمون والصلاحيات', 'Users & Access'),
        action: () => { location.href = 'users.html'; }
      });
      items.push({
        icon: '🛡',
        label: t('لوحة تحكم المسؤول', 'Admin Panel'),
        action: () => {
          // Navigate to dashboard with a hash; dashboard's boot will open admin panel
          localStorage.setItem('arsan_open_admin', '1');
          const firstCard = document.querySelector('.dept-card:not(.ag-locked) a, .dept-card:not(.ag-locked)');
          if (firstCard) firstCard.click();
          else location.href = 'dashboard.html?dept=executive';
        }
      });
    }

    items.push({
      icon: '🎨',
      label: t('الثيمات', 'Themes'),
      action: () => window.ArsanThemes?.openPicker?.()
    });

    const curLang = lang;
    items.push({
      icon: curLang === 'en' ? '🇸🇦' : '🇬🇧',
      label: curLang === 'en' ? 'العربية' : 'English',
      action: () => {
        const newLang = curLang === 'en' ? 'ar' : 'en';
        localStorage.setItem('arsan_lang', newLang);
        location.reload();
      }
    });

    items.forEach(it => {
      const b = el('button', {
        type: 'button',
        onclick: () => {
          closeMenu();
          try { it.action(); } catch(e){ console.warn(e); }
        }
      },
        el('span', { class: 'icn' }, it.icon),
        el('span', {}, it.label)
      );
      menu.appendChild(b);
    });

    // Divider + logout
    const divider = el('div', { class: 'divider' });
    menu.appendChild(divider);
    const logoutBtn = el('button', {
      type: 'button',
      class: 'danger',
      onclick: () => {
        if (!confirm(t('تسجيل خروج؟', 'Sign out?'))) return;
        setToken('');
        try {
          localStorage.removeItem('arsan_me_v1');
          localStorage.removeItem('arsan_me');
          localStorage.removeItem('arsan_token');
          localStorage.removeItem('arsan_department');
        } catch(_){}
        location.reload();
      }
    },
      el('span', { class: 'icn' }, '↩'),
      el('span', {}, t('تسجيل خروج', 'Sign Out'))
    );
    menu.appendChild(logoutBtn);
    document.body.appendChild(menu);

    function openMenu(){
      menu.classList.add('open');
      badge.classList.add('menu-open');
      setTimeout(() => document.addEventListener('click', outsideClick, { once:true }), 10);
    }
    function closeMenu(){
      menu.classList.remove('open');
      badge.classList.remove('menu-open');
    }
    function outsideClick(e){
      if (!menu.contains(e.target) && !badge.contains(e.target)) closeMenu();
      else if (menu.classList.contains('open')) setTimeout(() => document.addEventListener('click', outsideClick, { once:true }), 10);
    }

    // Clicking anywhere on badge opens menu
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menu.classList.contains('open')) closeMenu();
      else openMenu();
    });
  }

  function filterDepartments(me){
    // ⚠️ تم تعطيل هذه الدالة عمداً — كل مستخدم مسجّل يرى كل الإدارات.
    // الصلاحيات الفعلية تُطبَّق على مستوى dashboard.html (تعديل/حذف/إضافة).
    const cards = $$('.dept-card');
    cards.forEach(card => {
      card.style.display = '';
      card.classList.remove('ag-locked');
      card.removeAttribute('title');
    });
    return; // الكود القديم بالأسفل لم يعد يُنفّذ

    /* OLD LOGIC — disabled
    const isAdmin = me.role === 'admin';
    const allowed = new Set((me.departments || []).map(d => String(d).toLowerCase()));
    let visibleCount = 0;
    cards.forEach(card => {
      const id = (card.getAttribute('data-id') || '').toLowerCase();
      if (isAdmin || allowed.has(id)) {
        card.style.display = '';
        card.classList.remove('ag-locked');
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    */
  }

  async function hydrateUser(){
    const token = getToken();
    if (!token) {
      showLoginScreen();
      return;
    }
    try {
      const me = await api('/api/me');
      if (!me || !me.email) {
        // Token invalid / expired
        setToken('');
        showLoginScreen();
        return;
      }
      showUserBadge(me);
      filterDepartments(me);
      window.ArsanCurrentUser = me;
      try { localStorage.setItem('arsan_me_v1', JSON.stringify(me)); } catch(_){}
    } catch(e) {
      console.warn('[ag] /api/me failed:', e);
      // If unauthorized, show login. Otherwise let the page render ungated (so a Worker outage doesn't lock out admins)
      if (String(e.message).includes('401') || String(e.message).includes('unauthorized')) {
        setToken('');
        showLoginScreen();
      }
    }
  }

  // Kick off
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateUser);
  } else {
    hydrateUser();
  }

  window.ArsanAuthGate = {
    logout: () => {
      setToken('');
      try {
        localStorage.removeItem('arsan_me_v1');
        localStorage.removeItem('arsan_me');
        localStorage.removeItem('arsan_token');
        localStorage.removeItem('arsan_department');
      } catch(_){}
      location.reload();
    },
    hydrate: hydrateUser
  };
})();

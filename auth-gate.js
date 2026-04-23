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
  const TOKEN_KEY = 'arsan_token';
  const LS_LAST_EMAIL = 'arsan_last_email';

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  function el(tag, attrs={}, ...children){
    const n = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'style') n.style.cssText = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    }
    for (const c of children) {
      if (c == null) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  function getToken(){ return localStorage.getItem(TOKEN_KEY) || ''; }
  function setToken(t){ if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }

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
          radial-gradient(circle at 20% 30%, rgba(212,168,60,.12) 0%, transparent 45%),
          radial-gradient(circle at 80% 70%, rgba(184,144,48,.08) 0%, transparent 50%),
          linear-gradient(135deg, #1a1510 0%, #2a1f14 40%, #1f1810 100%);
        display:grid;place-items:center;padding:20px;
        overflow:hidden;
      }
      .ag-bd::before{
        content:'';position:absolute;inset:0;
        background-image:
          linear-gradient(rgba(212,168,60,.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212,168,60,.04) 1px, transparent 1px);
        background-size: 40px 40px;
        mask-image: radial-gradient(circle at center, black, transparent 70%);
        pointer-events:none;
      }
      html[data-theme="light"] .ag-bd{
        background:
          radial-gradient(circle at 20% 30%, rgba(212,168,60,.2) 0%, transparent 45%),
          radial-gradient(circle at 80% 70%, rgba(184,144,48,.15) 0%, transparent 50%),
          linear-gradient(135deg, #faf6ea 0%, #f3e9c9 50%, #eadda5 100%);
      }
      .ag-card{
        background:rgba(255,255,255,.96);backdrop-filter:blur(12px);
        border:1px solid rgba(212,168,60,.25);
        border-radius:20px;padding:36px 32px;
        max-width:420px;width:100%;
        box-shadow:0 30px 80px rgba(0,0,0,.4);
        animation:ag-in .3s ease both;
      }
      @keyframes ag-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      .ag-logo{
        text-align:center;margin-bottom:20px;
      }
      .ag-logo-mark{
        display:inline-grid;place-items:center;
        width:60px;height:60px;border-radius:14px;
        background:linear-gradient(135deg,#d4a83c,#b89030);
        color:#fff;font-size:28px;font-weight:700;
        box-shadow:0 8px 20px rgba(212,168,60,.3);
      }
      .ag-title{
        text-align:center;font-size:22px;font-weight:700;color:#23211c;
        margin:0 0 4px;letter-spacing:-.01em;
      }
      .ag-sub{
        text-align:center;font-size:13.5px;color:#8a7c55;margin:0 0 24px;
      }
      .ag-field{margin-bottom:14px}
      .ag-field label{
        display:block;font-size:12.5px;font-weight:600;
        color:#5a4e30;margin-bottom:6px;
      }
      .ag-field input{
        width:100%;padding:12px 14px;box-sizing:border-box;
        border:1px solid #d6ccaa;border-radius:10px;
        font:inherit;font-size:14px;color:#23211c;
        background:#fefcf5;transition:border-color .15s, box-shadow .15s;
      }
      .ag-field input:focus{
        outline:none;border-color:#d4a83c;
        box-shadow:0 0 0 3px rgba(212,168,60,.15);
      }
      .ag-err{
        background:#fff2f0;border:1px solid #ffccc7;color:#c23;
        padding:10px 12px;border-radius:8px;font-size:13px;
        margin-bottom:12px;display:none;
      }
      .ag-err.show{display:block}
      .ag-btn{
        width:100%;padding:12px 16px;
        background:linear-gradient(180deg,#d4a83c,#b89030);
        color:#fff;border:none;border-radius:10px;
        font:inherit;font-size:14px;font-weight:600;
        cursor:pointer;transition:filter .15s, transform .05s;
        box-shadow:0 4px 12px rgba(212,168,60,.3);
      }
      .ag-btn:hover:not(:disabled){filter:brightness(1.08)}
      .ag-btn:active{transform:translateY(1px)}
      .ag-btn:disabled{opacity:.6;cursor:not-allowed}
      .ag-forgot{
        text-align:center;margin-top:14px;
        font-size:12.5px;
      }
      .ag-forgot a{color:#8a7c55;text-decoration:underline;cursor:pointer}
      .ag-forgot a:hover{color:#6d5a1e}
      .ag-footer{
        text-align:center;margin-top:22px;padding-top:16px;
        border-top:1px solid #eee;font-size:11.5px;color:#a39877;
      }

      /* User badge on index */
      .ag-userbadge{
        position:fixed;top:16px;inset-inline-end:16px;z-index:500;
        display:flex;align-items:center;gap:10px;
        background:rgba(255,255,255,.9);backdrop-filter:blur(8px);
        border:1px solid rgba(212,168,60,.25);
        padding:8px 12px 8px 8px;border-radius:999px;
        font-size:13px;color:#23211c;
        box-shadow:0 2px 8px rgba(0,0,0,.05);
      }
      html[data-theme="dark"] .ag-userbadge{background:rgba(40,32,22,.85);color:#f3e9c9;border-color:rgba(212,168,60,.4)}
      .ag-userbadge .avatar{
        width:28px;height:28px;border-radius:50%;
        background:linear-gradient(135deg,#d4a83c,#b89030);
        color:#fff;display:grid;place-items:center;
        font-weight:700;font-size:12px;
      }
      .ag-userbadge .meta{line-height:1.2}
      .ag-userbadge .meta strong{display:block;font-size:12.5px}
      .ag-userbadge .meta small{font-size:10.5px;color:#8a7c55}
      html[data-theme="dark"] .ag-userbadge .meta small{color:#c4b58a}
      .ag-userbadge button{
        background:none;border:none;cursor:pointer;color:inherit;
        opacity:.6;padding:4px;
      }
      .ag-userbadge button:hover{opacity:1}

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
        err.textContent = 'يجب إدخال البريد وكلمة السر';
        err.classList.add('show');
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'جاري التحقق…';
      try {
        const data = await api('/api/login', { method: 'POST', body: { email, password } });
        setToken(data.token);
        localStorage.setItem(LS_LAST_EMAIL, email);
        // Close gate and re-run filtering
        bd.style.animation = 'ag-in .25s reverse';
        setTimeout(() => bd.remove(), 250);
        await hydrateUser();
      } catch(ex) {
        const msg = (ex.message || '').toLowerCase();
        if (msg.includes('invalid-credentials') || msg.includes('401')) {
          err.textContent = '❌ البريد أو كلمة السر غير صحيحة';
        } else if (msg.includes('user-disabled')) {
          err.textContent = '❌ الحساب معطّل. تواصل مع الأدمن.';
        } else if (msg.includes('domain-not-allowed')) {
          err.textContent = '❌ يُسمح فقط لبريد @arsann.com';
        } else {
          err.textContent = '❌ تعذّر تسجيل الدخول: ' + ex.message;
        }
        err.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الدخول';
      }
    }

    const form = el('form', { onsubmit: doLogin },
      el('div', { class: 'ag-logo' },
        el('div', { class: 'ag-logo-mark' }, 'A')
      ),
      el('h1', { class: 'ag-title' }, 'منصة أرسان SOPs'),
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
      alert('✓ إذا كان الإيميل مسجّلاً، سيصلك رابط إعادة التعيين قريباً.\n\nإن لم يصل، تحقّق من Slack أو تواصل مع الأدمن.');
    } catch(e) {
      alert('تعذّر إرسال الطلب: ' + e.message);
    }
  }

  function showUserBadge(me){
    if (document.querySelector('.ag-userbadge')) return;
    const initial = (me.email || '?').slice(0,1).toUpperCase();
    const shortEmail = (me.email || '').split('@')[0];
    const badge = el('div', { class: 'ag-userbadge' },
      el('div', { class: 'avatar' }, initial),
      el('div', { class: 'meta' },
        el('strong', {}, shortEmail),
        el('small', {},
          me.role === 'admin' ? '⭐ مسؤول' : (me.departments && me.departments.length
            ? (me.departments.length + ' إدارة')
            : 'عضو')
        )
      ),
      el('button', {
        title: 'خروج',
        onclick: () => {
          if (!confirm('تسجيل خروج؟')) return;
          setToken('');
          location.reload();
        }
      }, el('span', { style: 'font-size:16px' }, '↩'))
    );
    document.body.appendChild(badge);
  }

  function filterDepartments(me){
    const isAdmin = me.role === 'admin';
    const allowed = new Set((me.departments || []).map(d => String(d).toLowerCase()));

    const cards = $$('.dept-card');
    if (cards.length === 0) {
      // Cards not rendered yet — retry shortly
      setTimeout(() => filterDepartments(me), 150);
      return;
    }

    let visibleCount = 0;
    cards.forEach(card => {
      const id = (card.getAttribute('data-id') || '').toLowerCase();
      if (isAdmin || allowed.has(id)) {
        card.style.display = '';
        card.classList.remove('ag-locked');
        visibleCount++;
      } else {
        // Option A: hide completely
        card.style.display = 'none';
        // Option B (alternative): show locked — uncomment the two lines below and remove the display:none above
        // card.classList.add('ag-locked');
        // card.setAttribute('title', 'ليس لديك صلاحية الوصول إلى هذه الإدارة');
      }
    });

    // If no visible depts, show a message
    const grid = document.querySelector('.dept-grid');
    let emptyMsg = document.getElementById('ag-no-access');
    if (!isAdmin && visibleCount === 0 && grid) {
      if (!emptyMsg) {
        emptyMsg = el('div', {
          id: 'ag-no-access',
          style: 'grid-column:1/-1;padding:40px 20px;text-align:center;color:#8a7c55;font-size:14px;line-height:1.7;border:1px dashed #d6ccaa;border-radius:12px'
        },
          el('div', { style: 'font-size:32px;margin-bottom:8px' }, '🔒'),
          el('div', { style: 'font-weight:600;color:#5a4e30;margin-bottom:6px' }, 'لم يتم تعيين إدارات لحسابك'),
          el('div', {}, 'تواصل مع الأدمن (a.king@arsann.com) لمنحك صلاحية الوصول.')
        );
        grid.appendChild(emptyMsg);
      }
    } else if (emptyMsg) {
      emptyMsg.remove();
    }
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

  window.ArsanAuthGate = { logout: () => { setToken(''); location.reload(); }, hydrate: hydrateUser };
})();

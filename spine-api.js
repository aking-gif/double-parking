/* =================================================================
   THE SPINE — Shared API client + helpers
   Used by all module pages.
   ================================================================= */
(function(){
  'use strict';

  const API_BASE = 'https://arsan-api.a-king-6e1.workers.dev';
  const TOKEN_KEY = 'arsan_token_v1';
  const ME_KEY    = 'arsan_me_v1';

  function getToken(){ return localStorage.getItem(TOKEN_KEY) || ''; }
  function getMe(){
    try { return JSON.parse(localStorage.getItem(ME_KEY) || 'null'); }
    catch{ return null; }
  }
  function setMe(me, token){
    if (me) localStorage.setItem(ME_KEY, JSON.stringify(me));
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }
  function clearAuth(){
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ME_KEY);
  }

  async function api(path, opts = {}){
    const t = getToken();
    const headers = Object.assign({}, opts.headers || {});
    if (opts.body && !(opts.body instanceof FormData)){
      headers['Content-Type'] = 'application/json';
      if (typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    }
    if (t) headers['Authorization'] = 'Bearer ' + t;
    const url = path.startsWith('http') ? path : API_BASE + path;
    const r = await fetch(url, Object.assign({}, opts, { headers }));
    let data = null;
    try { data = await r.json(); } catch{ /* */ }
    if (!r.ok){
      const err = new Error((data && (data.error||data.message)) || r.statusText || 'request failed');
      err.status = r.status; err.data = data;
      throw err;
    }
    return data;
  }

  // ===== Toast =====
  function toast(msg, type = 'ok', ms = 2800){
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap){
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity .25s';
      setTimeout(() => el.remove(), 260);
    }, ms);
  }

  // ===== Modal helpers =====
  function modal({title, body, footer, onClose}){
    const bd = document.createElement('div');
    bd.className = 'modal-bd open';
    bd.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <div class="ttl">${title || ''}</div>
          <button class="x" data-x>✕</button>
        </div>
        <div class="modal-body"></div>
        ${footer ? `<div class="modal-foot"></div>` : ''}
      </div>`;
    document.body.appendChild(bd);
    const bodyEl = bd.querySelector('.modal-body');
    const footEl = bd.querySelector('.modal-foot');
    if (typeof body === 'string') bodyEl.innerHTML = body;
    else if (body) bodyEl.appendChild(body);
    if (footEl){
      if (typeof footer === 'string') footEl.innerHTML = footer;
      else if (footer) footEl.appendChild(footer);
    }
    const close = () => { bd.remove(); if (onClose) onClose(); };
    bd.querySelector('[data-x]').onclick = close;
    bd.addEventListener('click', e => { if (e.target === bd) close(); });
    return { el: bd, body: bodyEl, footer: footEl, close };
  }

  // ===== Auth gate (redirect to login if needed) =====
  async function ensureAuth(){
    const t = getToken();
    if (!t){ requireLogin(); return null; }
    try {
      const me = await api('/api/me');
      if (!me || me.role === 'viewer'){ requireLogin(); return null; }
      setMe(me);
      return me;
    } catch(e){
      if (e.status === 401){ requireLogin(); return null; }
      // network error → use cached me
      return getMe();
    }
  }

  function requireLogin(){
    if (document.getElementById('arsan-login-bd')) return;
    clearAuth();
    const bd = document.createElement('div');
    bd.id = 'arsan-login-bd';
    bd.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,11,13,0.95);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center';
    bd.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--line-2);border-radius:16px;padding:32px;width:380px;max-width:92vw">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:22px">
          <div class="brand-mark">A</div>
          <div><div style="font-size:14px;font-weight:600">THE SPINE</div><div style="font-size:11px;color:var(--ink-3);font-family:var(--font-en);letter-spacing:1px">ARSANN OPERATIONS</div></div>
        </div>
        <div style="font-size:18px;font-weight:600;margin-bottom:4px">تسجيل الدخول</div>
        <div style="font-size:12px;color:var(--ink-3);margin-bottom:20px">استخدم حسابك في @arsann.com</div>
        <div class="field"><label class="label">الإيميل</label><input id="li-em" class="input" type="email" placeholder="you@arsann.com"/></div>
        <div class="field"><label class="label">كلمة السر</label><input id="li-pw" class="input" type="password" placeholder="••••••••"/></div>
        <div id="li-err" style="color:var(--red);font-size:12px;min-height:18px;margin-bottom:8px"></div>
        <button id="li-go" class="btn primary" style="width:100%;justify-content:center;padding:11px">دخول</button>
      </div>`;
    document.body.appendChild(bd);
    const em = bd.querySelector('#li-em');
    const pw = bd.querySelector('#li-pw');
    const err = bd.querySelector('#li-err');
    const go = bd.querySelector('#li-go');
    setTimeout(() => em.focus(), 100);
    async function submit(){
      err.textContent = ''; go.disabled = true; go.innerHTML = '<span class="loader"></span>';
      try {
        const r = await fetch(API_BASE + '/api/login', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({email: em.value.trim(), password: pw.value})
        });
        const d = await r.json();
        if (!r.ok){ throw new Error(d.error || 'فشل الدخول'); }
        setMe(d.user || {email: em.value.trim()}, d.token);
        location.reload();
      } catch(e){
        err.textContent = e.message || 'فشل الدخول';
        go.disabled = false; go.innerHTML = 'دخول';
      }
    }
    go.onclick = submit;
    [em, pw].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
  }

  // ===== Date helpers =====
  function fmtDate(d, lang = 'ar'){
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return '';
    return dt.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {year:'numeric', month:'short', day:'numeric'});
  }
  function fmtTime(d){
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return '';
    return dt.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12:true});
  }
  function fmtRel(d){
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    const diff = (Date.now() - dt.getTime()) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return Math.floor(diff/60) + 'د';
    if (diff < 86400) return Math.floor(diff/3600) + 'س';
    if (diff < 604800) return Math.floor(diff/86400) + 'ي';
    return fmtDate(dt);
  }

  // ===== Common SVG icons =====
  const ICONS = {
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    drag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>'
  };

  // Initials helper
  function initials(name){
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0,2).map(s => s[0]).join('').toUpperCase();
  }

  // Escape HTML
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Export
  window.SpineAPI = {
    API_BASE, api, getToken, getMe, setMe, clearAuth,
    ensureAuth, requireLogin,
    toast, modal,
    fmtDate, fmtTime, fmtRel,
    ICONS, initials, esc
  };
})();

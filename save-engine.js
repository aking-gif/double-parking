/* save-engine.js — Atomic, reliable SOP save with retry + toasts.
 * Wraps window.ArsanAPI.updateSOP / addSOP and adds:
 *   • debounced batching when multiple fields change in <400ms
 *   • automatic retry (3x) with exp-backoff on transient failures
 *   • localStorage shadow-write so no edit is ever lost
 *   • visual toast (success / error / saving)
 *   • activity log
 * Loaded after dashboard.html sets up window.ArsanAPI.
 */
(function(){
  'use strict';
  if (window.SaveEngine) return;

  const PENDING = new Map();           // dept|code -> { patch, timer, attempts }
  const SHADOW_PREFIX = 'arsan_shadow_'; // shadow copy survives crashes
  const DEBOUNCE_MS = 400;
  const MAX_ATTEMPTS = 3;

  function shadowKey(dept, code){ return SHADOW_PREFIX + dept + '__' + code; }

  function saveShadow(dept, code, patch){
    try {
      const k = shadowKey(dept, code);
      const cur = JSON.parse(localStorage.getItem(k) || '{}');
      Object.assign(cur, patch, { _dept: dept, _code: code, _at: Date.now() });
      localStorage.setItem(k, JSON.stringify(cur));
    } catch(_){}
  }
  function clearShadow(dept, code){
    try { localStorage.removeItem(shadowKey(dept, code)); } catch(_){}
  }
  function listShadows(){
    const out = [];
    for (let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if (k && k.startsWith(SHADOW_PREFIX)){
        try { out.push(JSON.parse(localStorage.getItem(k))); } catch(_){}
      }
    }
    return out;
  }

  /* ---------- Toast ---------- */
  function ensureToastHost(){
    let h = document.getElementById('save-toast-host');
    if (!h){
      h = document.createElement('div');
      h.id = 'save-toast-host';
      h.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;font-family:inherit';
      document.body.appendChild(h);
    }
    return h;
  }
  function toast(text, kind){
    kind = kind || 'info';
    const colors = {
      success: { bg:'rgba(34,197,94,.96)', fg:'#fff' },
      error:   { bg:'rgba(220,38,38,.96)', fg:'#fff' },
      saving:  { bg:'rgba(15,23,42,.92)',  fg:'#fff' },
      info:    { bg:'rgba(15,23,42,.92)',  fg:'#fff' }
    };
    const c = colors[kind] || colors.info;
    const el = document.createElement('div');
    el.className = 'save-toast save-toast-' + kind;
    el.style.cssText = `background:${c.bg};color:${c.fg};padding:10px 18px;border-radius:999px;font-size:13.5px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.18);opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s;backdrop-filter:blur(8px);pointer-events:auto;max-width:90vw`;
    el.textContent = text;
    ensureToastHost().appendChild(el);
    requestAnimationFrame(()=>{ el.style.opacity='1'; el.style.transform='translateY(0)'; });
    const ttl = kind === 'error' ? 4500 : (kind === 'saving' ? 1800 : 2200);
    setTimeout(()=>{
      el.style.opacity='0'; el.style.transform='translateY(8px)';
      setTimeout(()=>el.remove(), 280);
    }, ttl);
    return el;
  }

  /* ---------- Activity log ---------- */
  function logEdit(dept, code, fields){
    try {
      const key = 'arsan_local_activity_v1';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const me_ = (window.ArsanAPI && window.ArsanAPI.me && window.ArsanAPI.me()) || {};
      arr.unshift({
        actor: me_.email || 'anon',
        action: 'edit-sop',
        target: dept + '/' + code,
        fields,
        ts: Date.now()
      });
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 200)));
    } catch(_){}
  }

  /* ---------- Slack notify (best-effort, non-blocking) ---------- */
  async function notifySlack(dept, code, fields){
    try {
      if (!window.API_BASE) return;
      const tok = localStorage.getItem('arsan_token');
      if (!tok) return;
      // Worker decides which channel based on dept's webhook setting
      fetch(window.API_BASE + '/api/slack/notify', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+tok },
        body: JSON.stringify({
          kind: 'sop-edit',
          dept,
          code,
          fields: Array.isArray(fields) ? fields : Object.keys(fields || {}),
          actor: ((window.ArsanAPI && window.ArsanAPI.me && window.ArsanAPI.me()) || {}).email || ''
        })
      }).catch(()=>{});
    } catch(_){}
  }

  /* ---------- Core: queue + flush ---------- */
  async function flushOne(key){
    const slot = PENDING.get(key);
    if (!slot) return;
    PENDING.delete(key);
    const [dept, code] = key.split('|');
    const patch = slot.patch;
    const fields = Object.keys(patch);
    saveShadow(dept, code, patch);
    let attempt = 0, lastErr = null;
    while (attempt < MAX_ATTEMPTS){
      attempt++;
      try {
        if (window.ArsanAPI && window.ArsanAPI.updateSOP){
          await window.ArsanAPI.updateSOP(dept, code, patch);
        } else {
          // pure-local fallback
          const lk = 'arsan_sops_' + dept;
          const arr = JSON.parse(localStorage.getItem(lk) || '{}');
          arr[code] = Object.assign({}, arr[code]||{}, patch, { updatedAt: Date.now() });
          localStorage.setItem(lk, JSON.stringify(arr));
        }
        clearShadow(dept, code);
        logEdit(dept, code, fields);
        notifySlack(dept, code, fields);
        toast('✓ تم الحفظ', 'success');
        // emit event so UI can refresh
        try { window.dispatchEvent(new CustomEvent('sop-saved', { detail:{ dept, code, patch } })); } catch(_){}
        return true;
      } catch(e){
        lastErr = e;
        // backoff
        await new Promise(r => setTimeout(r, 300 * attempt * attempt));
      }
    }
    toast('⚠ تعذّر الحفظ — احتُفظ بنسخة محلية', 'error');
    console.warn('[save-engine] failed after retries', dept, code, lastErr);
    return false;
  }

  /** Public: queue a patch for an SOP. Auto-flushes after debounce. */
  function queueSave(dept, code, patch, opts){
    opts = opts || {};
    if (!dept || !code || !patch) return;
    const key = dept + '|' + code;
    let slot = PENDING.get(key);
    if (!slot){ slot = { patch:{}, timer:null }; PENDING.set(key, slot); }
    Object.assign(slot.patch, patch);
    saveShadow(dept, code, slot.patch);
    if (slot.timer) clearTimeout(slot.timer);
    if (opts.immediate){
      flushOne(key);
    } else {
      toast('… جاري الحفظ', 'saving');
      slot.timer = setTimeout(()=> flushOne(key), DEBOUNCE_MS);
    }
  }

  /** Public: synchronous save (e.g. on form submit) — returns Promise<bool>. */
  async function saveNow(dept, code, patch){
    queueSave(dept, code, patch, { immediate:true });
    // wait one tick; flushOne above is async but kicked off immediately
    return new Promise((resolve)=>{
      const onSaved = (e)=>{
        if (e.detail && e.detail.dept===dept && e.detail.code===code){
          window.removeEventListener('sop-saved', onSaved);
          resolve(true);
        }
      };
      window.addEventListener('sop-saved', onSaved);
      setTimeout(()=>{ window.removeEventListener('sop-saved', onSaved); resolve(false); }, 8000);
    });
  }

  /** Recover any unsaved shadow copies on page load. */
  async function recoverShadows(){
    const shadows = listShadows();
    if (!shadows.length) return;
    let recovered = 0;
    for (const sh of shadows){
      const { _dept, _code, _at } = sh;
      if (!_dept || !_code) continue;
      // older than 7 days? drop
      if (_at && Date.now() - _at > 7*86400e3){ clearShadow(_dept, _code); continue; }
      const clean = Object.assign({}, sh);
      delete clean._dept; delete clean._code; delete clean._at;
      try {
        if (window.ArsanAPI && window.ArsanAPI.updateSOP){
          await window.ArsanAPI.updateSOP(_dept, _code, clean);
        }
        clearShadow(_dept, _code);
        recovered++;
      } catch(_){ /* retry next session */ }
    }
    if (recovered) toast(`✓ تم استرداد ${recovered} تعديل غير محفوظ`, 'success');
  }

  // Auto-recover on load (after 2s — give backend time to come up)
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(recoverShadows, 2000));
  } else {
    setTimeout(recoverShadows, 2000);
  }

  window.SaveEngine = { queueSave, saveNow, toast, recoverShadows, listShadows };
})();

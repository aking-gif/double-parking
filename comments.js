/**
 * comments.js — تعليقات داخل الإجراء
 * استخدامه: ArsanComments.mount(containerEl, sopRef)
 */
(function(){
  'use strict';
  if (window.ArsanComments) return;
  const API = () => window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const tok = () => localStorage.getItem('arsan_token')||'';
  const me  = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch { return null; } };
  async function api(p, opts={}){
    const r = await fetch(API()+p, {...opts, headers:{'Content-Type':'application/json',...(tok()?{Authorization:'Bearer '+tok()}:{}),...(opts.headers||{})}});
    return r.json();
  }
  function injectStyles(){
    if (document.getElementById('acmt-styles')) return;
    const s=document.createElement('style');s.id='acmt-styles';
    s.textContent=`
.acmt{margin-top:14px;border-top:1px solid #e2e8f0;padding-top:14px;direction:rtl;font-family:inherit}
.acmt h4{margin:0 0 10px;font-size:14px;color:#0f172a;display:flex;align-items:center;gap:6px}
.acmt .list{display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;margin-bottom:10px}
.acmt .item{background:#f8fafc;border-radius:10px;padding:10px 12px;border:1px solid #eef2f7}
.acmt .head{display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:4px}
.acmt .author{font-weight:600;color:#0ea5e9}
.acmt .text{font-size:13px;color:#1e293b;line-height:1.6;white-space:pre-wrap}
.acmt .form{display:flex;gap:6px}
.acmt textarea{flex:1;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:13px;resize:vertical;min-height:60px}
.acmt button{background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;border:0;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;font-family:inherit;align-self:flex-end}
.acmt .empty{text-align:center;color:#94a3b8;font-size:12px;padding:14px}
.acmt .del{background:none;border:0;color:#dc2626;cursor:pointer;font-size:11px}
`;document.head.appendChild(s);
  }
  function escape(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function fmtTime(ts){const d=(Date.now()-ts)/1000;if(d<60)return'الآن';if(d<3600)return Math.floor(d/60)+'د';if(d<86400)return Math.floor(d/3600)+'س';return new Date(ts).toLocaleDateString('ar-SA');}

  async function mount(container, sopRef){
    if (!container || !sopRef) return;
    injectStyles();
    container.innerHTML = `<div class="acmt">
      <h4>💬 التعليقات</h4>
      <div class="list" data-list>جارٍ التحميل...</div>
      <div class="form">
        <textarea data-input placeholder="اكتب تعليقاً... استخدم @بريد@arsann.com لإشارة شخص"></textarea>
        <button data-send>إرسال</button>
      </div>
    </div>`;
    const listEl = container.querySelector('[data-list]');
    const input = container.querySelector('[data-input]');
    const send = container.querySelector('[data-send]');
    async function refresh(){
      const list = await api('/api/comments?sopRef='+encodeURIComponent(sopRef));
      const arr = Array.isArray(list)?list:[];
      const myEmail = me()?.email;
      listEl.innerHTML = arr.length===0 ? '<div class="empty">لا توجد تعليقات بعد</div>' :
        arr.map(c=>`<div class="item">
          <div class="head"><span class="author">${escape(c.author)}</span>
          <span>${fmtTime(c.ts)} ${(c.author===myEmail||me()?.role==='admin')?`<button class="del" onclick="ArsanComments._del('${sopRef}','${c.id}',this)">حذف</button>`:''}</span></div>
          <div class="text">${escape(c.text)}</div>
        </div>`).join('');
    }
    send.onclick = async () => {
      const text = input.value.trim();
      if (!text) return;
      send.disabled=true;
      const r = await api('/api/comments',{method:'POST',body:JSON.stringify({sopRef,text})});
      send.disabled=false;
      if (r.ok){ input.value=''; await refresh(); }
    };
    window.ArsanComments._refresh = refresh;
    await refresh();
  }
  async function _del(sopRef, id, btn){
    if (!confirm('حذف التعليق؟')) return;
    const [d,c] = sopRef.split('/');
    await api(`/api/comments/${d}/${c}/${id}`, {method:'DELETE'});
    if (window.ArsanComments._refresh) await window.ArsanComments._refresh();
  }
  window.ArsanComments = { mount, _del };
})();

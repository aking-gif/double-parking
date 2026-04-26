/* ============================================================
   Action Required Feed — يدمج مع الجرس الرئيسي (notifications.js)
   لا يضع جرساً منفصلاً. يحقن العناصر في القائمة الموجودة.
   ============================================================ */
(function(){
  'use strict';
  const API_BASE = window.API_BASE || '';
  const tok = () => localStorage.getItem('arsan_token') || '';
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'null'); } catch(_){ return null; } };
  async function api(p,o){o=o||{};const r=await fetch(API_BASE+p,{method:o.method||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok()},body:o.body?JSON.stringify(o.body):undefined});if(!r.ok)throw new Error(await r.text()||'HTTP '+r.status);return r.json();}

  /* Build pseudo-announcements from action items so they appear in the existing bell */
  async function gatherAsAnnouncements(){
    const u = me(); if (!u) return [];
    const items = [];
    const now = Date.now();

    // SOPs awaiting your approval
    try {
      const b = await api('/api/bootstrap');
      Object.keys(b.sops||{}).forEach(dept => Object.keys(b.sops[dept]||{}).forEach(code => {
        const s = b.sops[dept][code];
        if (s.status === 'review' && ((s.reviewer||'').toLowerCase() === (u.email||'').toLowerCase() || u.role==='admin')) {
          items.push({
            id: 'action-approval-'+dept+'-'+code,
            ts: s.statusUpdatedAt || now,
            author: 'النظام',
            title: '🔔 يحتاج اعتمادك: ' + (s.title || code),
            body: 'إجراء بحالة "مراجعة" — ' + dept + '/' + code + '\nاضغط لفتح الإجراء',
            priority: 'urgent',
            _action: true,
            _link: 'dashboard.html?dept=' + encodeURIComponent(dept) + '#' + encodeURIComponent(code)
          });
        }
      }));
    } catch(_){}

    // Tasks assigned to you
    try {
      const tasks = (await api('/api/tasks?assignee='+encodeURIComponent(u.email))).tasks || [];
      tasks.filter(t => t.status !== 'done').slice(0,5).forEach(t => {
        items.push({
          id: 'action-task-'+(t.id||t.title),
          ts: t.dueAt || now,
          author: 'مهامك',
          title: '📋 مهمة: ' + (t.title||''),
          body: (t.description || '') + (t.dueAt ? '\nالاستحقاق: ' + new Date(t.dueAt).toLocaleDateString('ar-SA') : ''),
          priority: (t.dueAt && t.dueAt < now) ? 'urgent' : 'normal',
          _action: true
        });
      });
    } catch(_){}

    // Mentions
    try {
      const ms = (await api('/api/mentions')).mentions || [];
      ms.filter(m => !m.read).slice(0,5).forEach(m => items.push({
        id: 'action-mention-'+(m.id||m.at),
        ts: m.at || now,
        author: m.from || 'إشارة',
        title: '@ ' + (m.from || 'مستخدم') + ' أشار إليك',
        body: m.message || '',
        priority: 'normal',
        _action: true
      }));
    } catch(_){}

    return items;
  }

  /* Merge into local announcements store so notifications.js picks them up */
  const STORE_KEY = 'arsan_announcements_v1';

  async function syncIntoBell(){
    try {
      const fresh = await gatherAsAnnouncements();
      let existing = [];
      try { existing = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch(_){}
      // Remove old action items, keep non-action announcements
      const kept = existing.filter(a => !(a && a._action));
      // Add fresh action items
      const merged = kept.concat(fresh);
      // Cap to 50
      merged.sort((a,b)=>(b.ts||0)-(a.ts||0));
      localStorage.setItem(STORE_KEY, JSON.stringify(merged.slice(0,50)));
      // Tell notifications.js to refresh badge
      if (window.ArsanNotif && typeof window.ArsanNotif.refresh === 'function') {
        window.ArsanNotif.refresh();
      } else {
        // best-effort: dispatch event
        window.dispatchEvent(new CustomEvent('arsan:announcements-updated'));
      }
    } catch(e){ console.warn('action-feed sync', e); }
  }

  function init(){
    syncIntoBell();
    setInterval(syncIntoBell, 60000); // every minute
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 1500);

  window.ArsanActionFeed = { syncIntoBell, gather: gatherAsAnnouncements };
})();

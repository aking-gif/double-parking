/* ============================================================
 * Arsan Mega Features Pack — 20 Major Features (Layer 3)
 * ميزات كبرى — قابلة للتعطيل بسطر واحد
 * ============================================================ */
(function () {
  'use strict';
  if (window.__ARSAN_MEGA__) return;
  window.__ARSAN_MEGA__ = true;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const toast = window.arsanToast || ((m) => console.log(m));
  const LS = {
    get: (k, d=null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* ===== 1. Recently Viewed (آخر ما زرته) ===== */
  window.arsanTrackView = function(id, title, dept) {
    const list = LS.get('arsan_recent', []);
    const filtered = list.filter(x => x.id !== id);
    filtered.unshift({ id, title, dept, at: Date.now() });
    LS.set('arsan_recent', filtered.slice(0, 12));
  };
  window.arsanGetRecent = () => LS.get('arsan_recent', []);

  /* ===== 2. Bookmarks (مرجعيات سريعة) ===== */
  window.arsanBookmark = {
    add: (item) => {
      const list = LS.get('arsan_bookmarks', []);
      if (!list.find(x => x.id === item.id)) {
        list.push({ ...item, at: Date.now() });
        LS.set('arsan_bookmarks', list);
        toast('✓ أُضيف إلى المرجعيات', 'success');
      }
    },
    remove: (id) => {
      const list = LS.get('arsan_bookmarks', []).filter(x => x.id !== id);
      LS.set('arsan_bookmarks', list);
    },
    has: (id) => !!LS.get('arsan_bookmarks', []).find(x => x.id === id),
    list: () => LS.get('arsan_bookmarks', []),
  };

  /* ===== 3. Smart Filters Memory (حفظ الفلاتر) ===== */
  window.arsanFilterMemory = {
    save: (key, filters) => LS.set('arsan_filter_' + key, filters),
    load: (key) => LS.get('arsan_filter_' + key, null),
    clear: (key) => { try { localStorage.removeItem('arsan_filter_' + key); } catch {} },
  };

  /* ===== 4. Quick Add Menu (إضافة سريعة) ===== */
  function setupQuickAdd() {
    if ($('#arsan-quick-add')) return;
    const fab = document.createElement('button');
    fab.id = 'arsan-quick-add';
    fab.innerHTML = '+';
    fab.title = 'إضافة سريعة (N)';
    fab.style.cssText = `
      position: fixed; bottom: 24px; left: 24px; z-index: 9990;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #d4a574, #b8895a);
      color: #fff; border: 0; font-size: 28px; font-weight: 300;
      box-shadow: 0 8px 24px rgba(212,165,116,0.4);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform .25s cubic-bezier(.2,.8,.2,1);
    `;
    fab.addEventListener('mouseenter', () => fab.style.transform = 'scale(1.08) rotate(90deg)');
    fab.addEventListener('mouseleave', () => fab.style.transform = '');
    fab.addEventListener('click', () => {
      const newBtn = $('[data-new-sop], button[onclick*="newSop"], #btn-add-sop');
      if (newBtn) { newBtn.click(); return; }
      // generic menu
      const menu = document.createElement('div');
      menu.style.cssText = 'position:fixed;bottom:90px;left:24px;background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,0.18);padding:8px;z-index:9991;min-width:200px;animation:arsan-fade-in .2s;';
      menu.innerHTML = `
        ${[
          ['📄', 'إجراء جديد', () => location.href = 'dashboard.html'],
          ['💬', 'رسالة جديدة', () => location.href = 'announcements.html'],
          ['👤', 'الملف الشخصي', () => location.href = 'profile.html'],
          ['🔍', 'بحث (Cmd+K)', () => window.dispatchEvent(new CustomEvent('arsan:open-cmdk'))],
        ].map((r,i) => `<button data-idx="${i}" style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;padding:10px 12px;border-radius:8px;cursor:pointer;text-align:start;font-size:14px;font-family:inherit;"><span style="font-size:18px;">${r[0]}</span>${r[1]}</button>`).join('')}
      `;
      menu.querySelectorAll('button').forEach((b,i) => {
        b.addEventListener('mouseenter', () => b.style.background = 'rgba(212,165,116,0.1)');
        b.addEventListener('mouseleave', () => b.style.background = 'none');
        b.addEventListener('click', () => { menu.remove(); ([
          () => location.href = 'dashboard.html',
          () => location.href = 'announcements.html',
          () => location.href = 'profile.html',
          () => window.dispatchEvent(new CustomEvent('arsan:open-cmdk')),
        ])[i](); });
      });
      document.body.appendChild(menu);
      setTimeout(() => {
        document.addEventListener('click', function close(e) {
          if (!menu.contains(e.target) && e.target !== fab) { menu.remove(); document.removeEventListener('click', close); }
        });
      }, 0);
    });
    document.body.appendChild(fab);
  }

  /* ===== 5. Notification Center (مركز الإشعارات الموحّد) ===== */
  window.arsanNotifyCenter = {
    push: (n) => {
      const list = LS.get('arsan_notifications', []);
      list.unshift({ id: Date.now(), read: false, at: Date.now(), ...n });
      LS.set('arsan_notifications', list.slice(0, 50));
      window.dispatchEvent(new CustomEvent('arsan:notification', { detail: n }));
    },
    unreadCount: () => LS.get('arsan_notifications', []).filter(x => !x.read).length,
    markAllRead: () => {
      const list = LS.get('arsan_notifications', []).map(x => ({ ...x, read: true }));
      LS.set('arsan_notifications', list);
    },
    list: () => LS.get('arsan_notifications', []),
  };

  /* ===== 6. Activity Feed (تتبّع النشاط محلياً) ===== */
  window.arsanActivityLog = function(action, details) {
    const log = LS.get('arsan_activity', []);
    log.unshift({ at: Date.now(), action, details });
    LS.set('arsan_activity', log.slice(0, 100));
  };

  /* ===== 7. Drafts auto-save (مسودات تلقائية) ===== */
  window.arsanDrafts = {
    save: (key, data) => LS.set('arsan_draft_' + key, { data, at: Date.now() }),
    load: (key) => LS.get('arsan_draft_' + key, null),
    clear: (key) => { try { localStorage.removeItem('arsan_draft_' + key); } catch {} },
    list: () => Object.keys(localStorage).filter(k => k.startsWith('arsan_draft_')).map(k => ({ key: k.replace('arsan_draft_', ''), ...LS.get(k, {}) })),
  };

  /* ===== 8. Smart Search (بحث محلي فوري) ===== */
  window.arsanLocalSearch = function(items, query, fields=['title','code','desc']) {
    if (!query) return items;
    const q = query.toLowerCase().trim();
    return items.filter(item => {
      return fields.some(f => {
        const v = item[f];
        return v && String(v).toLowerCase().includes(q);
      });
    });
  };

  /* ===== 9. Stats Calculator (إحصائيات سريعة) ===== */
  window.arsanStats = function(items) {
    if (!items || !items.length) return { total: 0 };
    const byStatus = {};
    const byStage = {};
    let recent = 0;
    const week = 7 * 86400 * 1000;
    items.forEach(it => {
      const s = it.status || 'unknown';
      byStatus[s] = (byStatus[s] || 0) + 1;
      const st = it.stage || 'unknown';
      byStage[st] = (byStage[st] || 0) + 1;
      if (it.updatedAt && (Date.now() - new Date(it.updatedAt).getTime()) < week) recent++;
    });
    return { total: items.length, byStatus, byStage, recent };
  };

  /* ===== 10. Smart Sort (ترتيب ذكي) ===== */
  window.arsanSort = function(items, key, dir='asc') {
    const sorted = [...items].sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number') return av - bv;
      if (av instanceof Date || (typeof av === 'string' && /^\d{4}-/.test(av))) {
        return new Date(av) - new Date(bv);
      }
      return String(av).localeCompare(String(bv), 'ar');
    });
    return dir === 'desc' ? sorted.reverse() : sorted;
  };

  /* ===== 11. Theme variations (5 ثيمات إضافية) ===== */
  const themes = {
    arsan: { brand: '#d4a574', accent: '#b8895a', bg: '#f8f5f0' },
    midnight: { brand: '#6366f1', accent: '#4338ca', bg: '#0f172a' },
    forest: { brand: '#16a34a', accent: '#15803d', bg: '#f0fdf4' },
    ocean: { brand: '#0ea5e9', accent: '#0284c7', bg: '#f0f9ff' },
    rose: { brand: '#e11d48', accent: '#be123c', bg: '#fff1f2' },
  };
  window.arsanApplyTheme = function(name) {
    const t = themes[name];
    if (!t) return;
    const root = document.documentElement;
    root.style.setProperty('--brand', t.brand);
    root.style.setProperty('--accent', t.accent);
    LS.set('arsan_theme_quick', name);
    toast('🎨 تم تغيير الثيم: ' + name, 'success');
  };
  const savedTheme = LS.get('arsan_theme_quick');
  if (savedTheme && themes[savedTheme]) window.arsanApplyTheme(savedTheme);

  /* ===== 12. Read time estimator (وقت القراءة المتوقع) ===== */
  window.arsanReadTime = function(text) {
    const words = (text || '').trim().split(/\s+/).length;
    const min = Math.ceil(words / 200);
    return min < 1 ? '< 1 د' : `${min} د قراءة`;
  };

  /* ===== 13. Image lightbox ===== */
  document.addEventListener('click', (e) => {
    const img = e.target.closest('img[data-lightbox], .arsan-img-zoom img, figure img');
    if (!img || img.dataset.noLightbox) return;
    if (img.naturalWidth < 200) return;
    e.preventDefault();
    const lb = document.createElement('div');
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;animation:arsan-fade-in-bg .2s;';
    lb.innerHTML = `<img src="${img.src}" style="max-width:92%;max-height:92%;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.5);" />`;
    lb.addEventListener('click', () => lb.remove());
    document.addEventListener('keydown', function esc(ev) { if (ev.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(lb);
  });

  /* ===== 14. Drag & Drop file upload (universal) ===== */
  window.arsanSetupDropZone = function(el, onFiles) {
    if (!el) return;
    ['dragenter','dragover'].forEach(ev => el.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      el.style.outline = '2px dashed #d4a574';
      el.style.outlineOffset = '4px';
    }));
    ['dragleave','drop'].forEach(ev => el.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      el.style.outline = '';
    }));
    el.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    });
  };

  /* ===== 15. Voice input (where supported) ===== */
  window.arsanVoiceInput = function(targetInput) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('المتصفح لا يدعم الإدخال الصوتي', 'warn'); return; }
    const r = new SR();
    r.lang = 'ar-SA';
    r.interimResults = false;
    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      if (targetInput) targetInput.value += (targetInput.value ? ' ' : '') + text;
      toast('✓ تم التعرّف', 'success');
    };
    r.onerror = () => toast('فشل التعرّف الصوتي', 'error');
    r.start();
    toast('🎤 تكلّم الآن...', 'info');
  };

  /* ===== 16. Auto-link URLs in text ===== */
  window.arsanAutoLink = function(html) {
    return String(html).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:#0ea5e9;text-decoration:underline;">$1</a>');
  };

  /* ===== 17. Markdown lite renderer ===== */
  window.arsanMD = function(text) {
    if (!text) return '';
    let html = String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    return window.arsanAutoLink('<p>' + html + '</p>');
  };

  /* ===== 18. PWA install prompt ===== */
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
      if (!LS.get('arsan_pwa_dismissed')) {
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#fff;padding:14px 18px;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,0.18);z-index:9991;display:flex;gap:12px;align-items:center;animation:arsan-toast-in .3s;';
        banner.innerHTML = `
          <span style="font-size:24px;">📱</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:14px;">ثبّت التطبيق</div>
            <div style="font-size:12px;color:#666;">للوصول السريع</div>
          </div>
          <button id="pwa-install" style="background:#d4a574;color:#fff;border:0;padding:6px 14px;border-radius:8px;cursor:pointer;font-weight:600;">ثبّت</button>
          <button id="pwa-cancel" style="background:none;border:0;font-size:20px;cursor:pointer;color:#999;">×</button>
        `;
        document.body.appendChild(banner);
        $('#pwa-install', banner).onclick = async () => {
          deferredPrompt?.prompt();
          banner.remove();
        };
        $('#pwa-cancel', banner).onclick = () => {
          LS.set('arsan_pwa_dismissed', 1);
          banner.remove();
        };
      }
    }, 30000);
  });

  /* ===== 19. Smart suggestions (اقتراحات حسب السلوك) ===== */
  window.arsanSuggest = function() {
    const recent = window.arsanGetRecent();
    if (!recent.length) return null;
    const byDept = {};
    recent.forEach(r => { byDept[r.dept] = (byDept[r.dept] || 0) + 1; });
    const top = Object.entries(byDept).sort((a,b) => b[1]-a[1])[0];
    return { topDept: top?.[0], recentItems: recent.slice(0, 5) };
  };

  /* ===== 20. Global keyboard mode (Vim-like) ===== */
  let kMode = false;
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    if (e.key === 'j') window.scrollBy({ top: 100, behavior: 'smooth' });
    if (e.key === 'k') window.scrollBy({ top: -100, behavior: 'smooth' });
    if (e.key === 'G' && e.shiftKey) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  /* ===== Init ===== */
  function init() {
    setupQuickAdd();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  console.log('%c🚀 Arsan Mega Pack loaded — 20 major features', 'color:#ef4444;font-weight:bold');
})();

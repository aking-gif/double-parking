/* Arsan Feature Pack V3 — 7 new features */
(function(){
  'use strict';

  const lang = () => localStorage.getItem('arsan_lang') || 'ar';
  const t = (ar, en) => lang() === 'en' ? en : ar;
  const me = () => { try { return JSON.parse(localStorage.getItem('arsan_me')||'{}'); } catch(_){ return {}; } };
  const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ============ FEATURE 1: Global Search (Cmd+K / Ctrl+K) ============
  function buildSearchIndex(){
    const idx = [];
    try {
      // Search across all depts in localStorage
      Object.keys(localStorage).forEach(k => {
        if (!k.startsWith('arsan_sops_')) return;
        const dept = k.replace('arsan_sops_','');
        try {
          const arr = JSON.parse(localStorage.getItem(k) || '{}');
          Object.values(arr).forEach(s => {
            idx.push({
              dept, code: s.code, title: s.title||'',
              purpose: s.purpose||'', scope: s.scope||'',
              text: `${s.code} ${s.title||''} ${s.purpose||''} ${s.scope||''}`.toLowerCase()
            });
          });
        } catch(_){}
      });
      // Include current loaded SOPS
      if (window.SOPS && window.CURRENT_DEPT_ID) {
        window.SOPS.forEach(s => {
          if (!idx.find(x => x.dept === window.CURRENT_DEPT_ID && x.code === s.code)) {
            idx.push({
              dept: window.CURRENT_DEPT_ID, code: s.code, title: s.title||'',
              purpose: s.purpose||'', scope: s.scope||'',
              text: `${s.code} ${s.title||''} ${s.purpose||''}`.toLowerCase()
            });
          }
        });
      }
    } catch(e){ console.warn('index build failed', e); }
    return idx;
  }

  function openGlobalSearch(){
    if (document.getElementById('arsan-gs-bd')) return;
    const idx = buildSearchIndex();
    const bd = document.createElement('div');
    bd.id = 'arsan-gs-bd';
    bd.innerHTML = `
      <div class="arsan-gs-card">
        <input type="text" class="arsan-gs-input" placeholder="${t('ابحث في جميع الإجراءات…','Search all SOPs…')}" autofocus>
        <div class="arsan-gs-results"></div>
        <div class="arsan-gs-hint">
          <kbd>↑↓</kbd> ${t('تنقّل','navigate')} <kbd>↵</kbd> ${t('فتح','open')} <kbd>Esc</kbd> ${t('إغلاق','close')}
        </div>
      </div>`;
    document.body.appendChild(bd);
    const input = bd.querySelector('.arsan-gs-input');
    const results = bd.querySelector('.arsan-gs-results');
    let sel = 0;
    let filtered = idx.slice(0, 20);

    const render = () => {
      if (!filtered.length) {
        results.innerHTML = `<div class="arsan-gs-empty">${t('لا نتائج','No results')}</div>`;
        return;
      }
      results.innerHTML = filtered.slice(0, 15).map((r, i) => `
        <div class="arsan-gs-item ${i===sel?'sel':''}" data-i="${i}">
          <span class="arsan-gs-code">${esc(r.code)}</span>
          <span class="arsan-gs-title">${esc(r.title)}</span>
          <span class="arsan-gs-dept">${esc(r.dept)}</span>
        </div>`).join('');
      results.querySelectorAll('.arsan-gs-item').forEach(el => {
        el.onclick = () => goto(filtered[+el.dataset.i]);
      });
    };

    const goto = (r) => {
      close();
      const curDept = window.CURRENT_DEPT_ID;
      if (curDept === r.dept) {
        // Try to find and open the SOP modal
        const match = (window.SOPS||[]).find(s => s.code === r.code);
        if (match && window.openModal) {
          window.openModal(window.SOPS.indexOf(match));
          return;
        }
      }
      location.href = `dashboard.html?dept=${encodeURIComponent(r.dept)}&sop=${encodeURIComponent(r.code)}`;
    };

    const close = () => bd.remove();

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { filtered = idx.slice(0, 20); sel = 0; render(); return; }
      filtered = idx.filter(r => r.text.includes(q)).slice(0, 20);
      sel = 0; render();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel+1, filtered.length-1); render(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel-1, 0); render(); }
      if (e.key === 'Enter' && filtered[sel]) { goto(filtered[sel]); }
    });

    bd.addEventListener('click', (e) => { if (e.target === bd) close(); });
    render();
  }

  // ============ FEATURE 2: Favorites (star SOPs) ============
  const FAV_KEY = 'arsan_favorites_v1';
  function getFavs(){ try { return JSON.parse(localStorage.getItem(FAV_KEY)||'{}'); } catch(_){ return {}; } }
  function setFavs(f){ localStorage.setItem(FAV_KEY, JSON.stringify(f)); }
  function toggleFav(dept, code){
    const f = getFavs();
    const k = `${dept}/${code}`;
    if (f[k]) delete f[k]; else f[k] = Date.now();
    setFavs(f);
    updateFavStars();
  }
  function isFav(dept, code){ return !!getFavs()[`${dept}/${code}`]; }

  function injectFavStars(){
    document.querySelectorAll('article.sop-card').forEach(card => {
      if (card.querySelector('.arsan-fav-star')) return;
      const code = card.querySelector('.code')?.textContent?.trim();
      if (!code) return;
      const dept = window.CURRENT_DEPT_ID || '';
      const star = document.createElement('button');
      star.className = 'arsan-fav-star';
      star.type = 'button';
      star.innerHTML = isFav(dept, code) ? '★' : '☆';
      star.title = t('المفضلة','Favorite');
      if (isFav(dept, code)) star.classList.add('active');
      star.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFav(dept, code);
        star.innerHTML = isFav(dept, code) ? '★' : '☆';
        star.classList.toggle('active', isFav(dept, code));
      });
      card.appendChild(star);
    });
  }

  function updateFavStars(){
    document.querySelectorAll('article.sop-card').forEach(card => {
      const code = card.querySelector('.code')?.textContent?.trim();
      const dept = window.CURRENT_DEPT_ID || '';
      const star = card.querySelector('.arsan-fav-star');
      if (!star || !code) return;
      star.innerHTML = isFav(dept, code) ? '★' : '☆';
      star.classList.toggle('active', isFav(dept, code));
    });
  }

  // ============ FEATURE 3: Stats Dashboard Widget ============
  function showStats(){
    if (document.getElementById('arsan-stats-bd')) return;
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('arsan_sops_'));
    let totalSops = 0, filled = 0, recent = 0, byDept = {};
    const weekAgo = Date.now() - 7*24*60*60*1000;
    allKeys.forEach(k => {
      const dept = k.replace('arsan_sops_','');
      try {
        const arr = JSON.parse(localStorage.getItem(k)||'{}');
        const items = Object.values(arr);
        byDept[dept] = items.length;
        totalSops += items.length;
        items.forEach(s => {
          if (s.purpose && s.scope) filled++;
          if ((s.updatedAt||0) > weekAgo) recent++;
        });
      } catch(_){}
    });
    const favs = Object.keys(getFavs()).length;
    const bd = document.createElement('div');
    bd.id = 'arsan-stats-bd';
    bd.className = 'arsan-modal-bd';
    const completion = totalSops ? Math.round((filled/totalSops)*100) : 0;
    bd.innerHTML = `
      <div class="arsan-stats-card">
        <button class="arsan-x">✕</button>
        <h2>📊 ${t('إحصائيات المنصّة','Platform Stats')}</h2>
        <div class="arsan-stat-grid">
          <div class="arsan-stat-box"><div class="n">${totalSops}</div><div class="l">${t('إجراء','SOPs')}</div></div>
          <div class="arsan-stat-box"><div class="n">${filled}</div><div class="l">${t('مكتمل','Filled')}</div></div>
          <div class="arsan-stat-box"><div class="n">${allKeys.length}</div><div class="l">${t('إدارة','Depts')}</div></div>
          <div class="arsan-stat-box"><div class="n">${recent}</div><div class="l">${t('حُدّث هذا الأسبوع','Updated this week')}</div></div>
          <div class="arsan-stat-box"><div class="n">${favs}</div><div class="l">${t('مفضلة','Favorites')}</div></div>
          <div class="arsan-stat-box"><div class="n">${completion}%</div><div class="l">${t('نسبة الاكتمال','Completion')}</div></div>
        </div>
        <div class="arsan-bar-wrap">
          <div class="arsan-bar" style="width:${completion}%"></div>
        </div>
        <h3>${t('حسب الإدارة','By Department')}</h3>
        <div class="arsan-dept-list">
          ${Object.entries(byDept).sort((a,b)=>b[1]-a[1]).map(([d,n]) => `
            <div class="arsan-dept-row">
              <span>${esc(d)}</span>
              <span class="arsan-dept-bar"><span style="width:${totalSops?(n/totalSops*100):0}%"></span></span>
              <span class="arsan-dept-n">${n}</span>
            </div>`).join('')}
        </div>
      </div>`;
    document.body.appendChild(bd);
    bd.querySelector('.arsan-x').onclick = () => bd.remove();
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };
  }

  // ============ FEATURE 4: Keyboard Shortcuts Help (?) ============
  function showShortcuts(){
    if (document.getElementById('arsan-sc-bd')) return;
    const shortcuts = [
      ['Ctrl/Cmd + K', t('بحث عام','Global search')],
      ['Ctrl/Cmd + /', t('هذه القائمة','This menu')],
      ['Ctrl/Cmd + B', t('فتح/إغلاق القائمة الجانبية','Toggle sidebar')],
      ['G then S', t('عرض الإحصائيات','Show stats')],
      ['G then F', t('عرض المفضلة','Show favorites')],
      ['N', t('إجراء جديد','New SOP')],
      ['?', t('هذه القائمة','This menu')],
      ['Esc', t('إغلاق النوافذ','Close dialogs')],
    ];
    const bd = document.createElement('div');
    bd.id = 'arsan-sc-bd';
    bd.className = 'arsan-modal-bd';
    bd.innerHTML = `
      <div class="arsan-sc-card">
        <button class="arsan-x">✕</button>
        <h2>⌨️ ${t('اختصارات لوحة المفاتيح','Keyboard Shortcuts')}</h2>
        <div class="arsan-sc-list">
          ${shortcuts.map(([k,l]) => `
            <div class="arsan-sc-row">
              <span class="arsan-sc-label">${esc(l)}</span>
              <span class="arsan-sc-keys">${k.split(' + ').map(x=>`<kbd>${esc(x)}</kbd>`).join('<span class="plus">+</span>')}</span>
            </div>`).join('')}
        </div>
      </div>`;
    document.body.appendChild(bd);
    bd.querySelector('.arsan-x').onclick = () => bd.remove();
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };
  }

  // ============ FEATURE 5: Recently Viewed ============
  const RECENT_KEY = 'arsan_recent_sops_v1';
  function getRecent(){ try { return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]'); } catch(_){ return []; } }
  function pushRecent(dept, code, title){
    if (!code) return;
    let list = getRecent().filter(r => !(r.dept===dept && r.code===code));
    list.unshift({ dept, code, title, ts: Date.now() });
    list = list.slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  }
  function showRecent(){
    if (document.getElementById('arsan-recent-bd')) return;
    const list = getRecent();
    const bd = document.createElement('div');
    bd.id = 'arsan-recent-bd';
    bd.className = 'arsan-modal-bd';
    bd.innerHTML = `
      <div class="arsan-recent-card">
        <button class="arsan-x">✕</button>
        <h2>🕒 ${t('شوهد مؤخراً','Recently Viewed')}</h2>
        ${list.length ? `<div class="arsan-recent-list">
          ${list.map(r => `
            <div class="arsan-recent-row" data-dept="${esc(r.dept)}" data-code="${esc(r.code)}">
              <span class="arsan-recent-code">${esc(r.code)}</span>
              <span class="arsan-recent-title">${esc(r.title||'')}</span>
              <span class="arsan-recent-dept">${esc(r.dept)}</span>
            </div>`).join('')}
        </div>` : `<div class="arsan-empty">${t('لا يوجد نشاط حديث','No recent activity')}</div>`}
      </div>`;
    document.body.appendChild(bd);
    bd.querySelector('.arsan-x').onclick = () => bd.remove();
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };
    bd.querySelectorAll('.arsan-recent-row').forEach(row => {
      row.onclick = () => {
        const d = row.dataset.dept, c = row.dataset.code;
        if (window.CURRENT_DEPT_ID === d) {
          const match = (window.SOPS||[]).find(s => s.code === c);
          if (match && window.openModal) { bd.remove(); window.openModal(window.SOPS.indexOf(match)); return; }
        }
        location.href = `dashboard.html?dept=${encodeURIComponent(d)}&sop=${encodeURIComponent(c)}`;
      };
    });
  }

  // ============ FEATURE 6: Print / Export PDF ============
  function printCurrentSOP(){
    const modal = document.querySelector('.modal[aria-hidden="false"]') || document.querySelector('#modal');
    if (!modal || modal.getAttribute('aria-hidden') === 'true') {
      alert(t('افتح إجراءً أولاً للطباعة','Open an SOP first'));
      return;
    }
    const clone = modal.cloneNode(true);
    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(`
      <!DOCTYPE html><html lang="ar" dir="rtl"><head>
      <meta charset="UTF-8"><title>${t('طباعة إجراء','Print SOP')}</title>
      <style>
        body{font-family:'IBM Plex Sans Arabic',Arial,sans-serif;padding:40px;color:#222;line-height:1.7}
        h1,h2,h3{color:#3a5a40;margin:16px 0 8px}
        h1{font-size:22px;border-bottom:2px solid #d4a83c;padding-bottom:8px}
        .code{color:#b89030;font-weight:bold;font-size:14px}
        button,.modal-close,.arsan-fav-star{display:none!important}
        img{max-width:100%}
        @media print { @page { margin: 1.5cm; } }
      </style></head><body>${clone.innerHTML}
      <script>window.onload=()=>window.print();<\/script>
      </body></html>`);
    w.document.close();
  }

  // ============ FEATURE 7: Quick Launcher (Command Palette) ============
  function openLauncher(){
    if (document.getElementById('arsan-cmd-bd')) return;
    const commands = [
      { icon:'🔍', label:t('بحث عام','Global search'), action: openGlobalSearch, keys:'Ctrl+K' },
      { icon:'📊', label:t('الإحصائيات','Statistics'), action: showStats },
      { icon:'⭐', label:t('المفضلة','Favorites'), action: showFavorites },
      { icon:'🕒', label:t('شوهد مؤخراً','Recently viewed'), action: showRecent },
      { icon:'⌨️', label:t('اختصارات لوحة المفاتيح','Shortcuts'), action: showShortcuts, keys:'?' },
      { icon:'🖨️', label:t('طباعة الإجراء الحالي','Print current SOP'), action: printCurrentSOP },
      { icon:'📢', label:t('مركز الإعلانات','Announcements'), action: () => location.href = 'announcements.html' },
      { icon:'🎨', label:t('تغيير الثيم','Change theme'), action: () => window.ArsanThemes?.showPicker?.() || window.ArsanThemes?.openPicker?.() },
    ];
    const bd = document.createElement('div');
    bd.id = 'arsan-cmd-bd';
    bd.innerHTML = `
      <div class="arsan-cmd-card">
        <input type="text" class="arsan-cmd-input" placeholder="${t('اكتب أمراً أو ابحث…','Type a command or search…')}" autofocus>
        <div class="arsan-cmd-list"></div>
      </div>`;
    document.body.appendChild(bd);
    const input = bd.querySelector('.arsan-cmd-input');
    const list = bd.querySelector('.arsan-cmd-list');
    let sel = 0, filtered = commands;
    const render = () => {
      list.innerHTML = filtered.map((c, i) => `
        <div class="arsan-cmd-row ${i===sel?'sel':''}" data-i="${i}">
          <span class="ico">${c.icon}</span>
          <span class="lbl">${esc(c.label)}</span>
          ${c.keys ? `<span class="kb">${esc(c.keys)}</span>` : ''}
        </div>`).join('');
      list.querySelectorAll('.arsan-cmd-row').forEach(el => {
        el.onclick = () => { bd.remove(); filtered[+el.dataset.i].action(); };
      });
    };
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      filtered = commands.filter(c => c.label.toLowerCase().includes(q));
      sel = 0; render();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') bd.remove();
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel+1, filtered.length-1); render(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel-1, 0); render(); }
      if (e.key === 'Enter' && filtered[sel]) { bd.remove(); filtered[sel].action(); }
    });
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };
    render();
  }

  function showFavorites(){
    if (document.getElementById('arsan-fav-bd')) return;
    const favs = getFavs();
    const entries = Object.entries(favs).sort((a,b) => b[1] - a[1]);
    const bd = document.createElement('div');
    bd.id = 'arsan-fav-bd';
    bd.className = 'arsan-modal-bd';
    bd.innerHTML = `
      <div class="arsan-fav-card">
        <button class="arsan-x">✕</button>
        <h2>⭐ ${t('المفضلة','Favorites')}</h2>
        ${entries.length ? `<div class="arsan-fav-list">
          ${entries.map(([k,ts]) => {
            const [dept, code] = k.split('/');
            return `<div class="arsan-fav-row" data-dept="${esc(dept)}" data-code="${esc(code)}">
              <span class="star">★</span>
              <span class="code">${esc(code)}</span>
              <span class="dept">${esc(dept)}</span>
              <button class="rm" data-k="${esc(k)}">✕</button>
            </div>`;
          }).join('')}
        </div>` : `<div class="arsan-empty">${t('لا توجد مفضلات بعد. اضغط ☆ على أي إجراء لإضافته.','No favorites yet. Click ☆ on any SOP to add it.')}</div>`}
      </div>`;
    document.body.appendChild(bd);
    bd.querySelector('.arsan-x').onclick = () => bd.remove();
    bd.onclick = (e) => { if (e.target === bd) bd.remove(); };
    bd.querySelectorAll('.arsan-fav-row').forEach(row => {
      row.onclick = (e) => {
        if (e.target.classList.contains('rm')) return;
        const d = row.dataset.dept, c = row.dataset.code;
        location.href = `dashboard.html?dept=${encodeURIComponent(d)}&sop=${encodeURIComponent(c)}`;
      };
    });
    bd.querySelectorAll('.rm').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        const f = getFavs();
        delete f[b.dataset.k];
        setFavs(f);
        b.closest('.arsan-fav-row').remove();
        updateFavStars();
      };
    });
  }

  // ============ STYLES ============
  function injectStyles(){
    if (document.getElementById('arsan-feat-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-feat-styles';
    s.textContent = `
      #arsan-gs-bd, #arsan-cmd-bd {
        position:fixed;inset:0;z-index:99000;
        background:rgba(10,8,4,.6);backdrop-filter:blur(8px);
        display:flex;align-items:flex-start;justify-content:center;
        padding-top:15vh;
      }
      .arsan-gs-card, .arsan-cmd-card {
        width:min(640px,90vw);
        background:linear-gradient(180deg,#fff9ec,#f6ecc8);
        border:1px solid rgba(212,168,60,.35);
        border-radius:14px;
        box-shadow:0 30px 80px rgba(0,0,0,.45);
        overflow:hidden;
        direction:rtl;
        font-family:'IBM Plex Sans Arabic',sans-serif;
      }
      .arsan-gs-input, .arsan-cmd-input {
        width:100%;padding:18px 22px;
        border:none;outline:none;
        background:transparent;
        font-size:18px;font-family:inherit;
        color:#3a2f15;
        border-bottom:1px solid rgba(212,168,60,.25);
      }
      .arsan-gs-results, .arsan-cmd-list {
        max-height:50vh;overflow-y:auto;padding:8px;
      }
      .arsan-gs-item, .arsan-cmd-row {
        padding:12px 16px;border-radius:8px;cursor:pointer;
        display:flex;align-items:center;gap:12px;
        transition:background .1s;
      }
      .arsan-gs-item:hover, .arsan-gs-item.sel,
      .arsan-cmd-row:hover, .arsan-cmd-row.sel {
        background:rgba(212,168,60,.2);
      }
      .arsan-gs-code { font-weight:700;color:#b89030;font-size:13px; }
      .arsan-gs-title { flex:1;color:#3a2f15; }
      .arsan-gs-dept { font-size:11px;color:#888;background:rgba(212,168,60,.15);padding:2px 8px;border-radius:4px; }
      .arsan-gs-empty, .arsan-empty { padding:40px;text-align:center;color:#aaa; }
      .arsan-gs-hint {
        padding:10px 16px;font-size:11px;color:#7a5b2e;
        border-top:1px solid rgba(212,168,60,.2);
        display:flex;gap:16px;justify-content:center;
      }
      kbd {
        background:#fff;border:1px solid #d4a83c;
        padding:2px 6px;border-radius:4px;font-size:10px;font-family:monospace;
        box-shadow:0 1px 2px rgba(0,0,0,.1);
      }
      .arsan-cmd-row .ico { font-size:18px;width:24px;text-align:center; }
      .arsan-cmd-row .lbl { flex:1;color:#3a2f15; }
      .arsan-cmd-row .kb { font-size:11px;color:#7a5b2e; }

      .arsan-fav-star {
        position:absolute;top:10px;inset-inline-end:10px;
        background:transparent;border:none;cursor:pointer;
        font-size:20px;color:#c9b37e;opacity:.5;
        width:32px;height:32px;border-radius:6px;
        transition:all .15s;z-index:2;
      }
      .arsan-fav-star:hover { opacity:1;background:rgba(212,168,60,.15); }
      .arsan-fav-star.active { color:#d4a83c;opacity:1; }

      .arsan-modal-bd {
        position:fixed;inset:0;z-index:99000;
        background:rgba(10,8,4,.55);backdrop-filter:blur(6px);
        display:flex;align-items:center;justify-content:center;
        padding:20px;
      }
      .arsan-stats-card, .arsan-sc-card, .arsan-recent-card, .arsan-fav-card {
        position:relative;
        max-width:560px;width:100%;
        max-height:85vh;overflow-y:auto;
        background:linear-gradient(180deg,#fff9ec,#f6ecc8);
        border:1px solid rgba(212,168,60,.35);
        border-radius:16px;padding:28px;
        direction:rtl;
        font-family:'IBM Plex Sans Arabic',sans-serif;
        color:#3a2f15;
        box-shadow:0 30px 80px rgba(0,0,0,.45);
      }
      .arsan-x {
        position:absolute;top:14px;inset-inline-start:14px;
        background:transparent;border:none;width:32px;height:32px;
        border-radius:8px;cursor:pointer;opacity:.5;font-size:16px;
      }
      .arsan-x:hover { opacity:1;background:rgba(212,168,60,.15); }
      .arsan-stats-card h2, .arsan-sc-card h2, .arsan-recent-card h2, .arsan-fav-card h2 {
        margin:0 0 20px;font-size:20px;color:#3a5a40;
      }
      .arsan-stat-grid {
        display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;
      }
      .arsan-stat-box {
        background:rgba(255,255,255,.5);border:1px solid rgba(212,168,60,.25);
        border-radius:10px;padding:16px 10px;text-align:center;
      }
      .arsan-stat-box .n { font-size:26px;font-weight:700;color:#3a5a40; }
      .arsan-stat-box .l { font-size:11px;color:#7a5b2e;margin-top:4px; }
      .arsan-bar-wrap {
        height:8px;background:rgba(212,168,60,.15);border-radius:4px;overflow:hidden;margin-bottom:20px;
      }
      .arsan-bar { height:100%;background:linear-gradient(90deg,#d4a83c,#3a5a40);transition:width .4s; }
      .arsan-dept-list { display:flex;flex-direction:column;gap:8px; }
      .arsan-dept-row {
        display:grid;grid-template-columns:120px 1fr 40px;gap:10px;align-items:center;
        font-size:13px;
      }
      .arsan-dept-bar {
        height:6px;background:rgba(212,168,60,.15);border-radius:3px;overflow:hidden;display:block;
      }
      .arsan-dept-bar span { display:block;height:100%;background:#d4a83c; }
      .arsan-dept-n { text-align:end;font-weight:600;color:#3a5a40; }

      .arsan-sc-list { display:flex;flex-direction:column;gap:10px; }
      .arsan-sc-row {
        display:flex;justify-content:space-between;align-items:center;
        padding:10px 14px;background:rgba(255,255,255,.4);
        border-radius:8px;border:1px solid rgba(212,168,60,.2);
      }
      .arsan-sc-label { font-size:13px; }
      .arsan-sc-keys { display:flex;align-items:center;gap:6px; }
      .arsan-sc-keys .plus { opacity:.5;font-size:10px; }

      .arsan-recent-list, .arsan-fav-list { display:flex;flex-direction:column;gap:6px; }
      .arsan-recent-row, .arsan-fav-row {
        display:flex;align-items:center;gap:12px;
        padding:10px 14px;background:rgba(255,255,255,.4);
        border-radius:8px;border:1px solid rgba(212,168,60,.2);
        cursor:pointer;transition:background .1s;
      }
      .arsan-recent-row:hover, .arsan-fav-row:hover { background:rgba(212,168,60,.2); }
      .arsan-recent-code, .arsan-fav-row .code { font-weight:700;color:#b89030;font-size:12px;min-width:60px; }
      .arsan-recent-title { flex:1;font-size:13px; }
      .arsan-recent-dept, .arsan-fav-row .dept {
        font-size:11px;color:#888;background:rgba(212,168,60,.15);padding:2px 8px;border-radius:4px;
      }
      .arsan-fav-row .star { color:#d4a83c;font-size:16px; }
      .arsan-fav-row .rm {
        background:transparent;border:none;opacity:.4;cursor:pointer;
        width:24px;height:24px;border-radius:5px;
      }
      .arsan-fav-row .rm:hover { opacity:1;background:rgba(230,57,70,.2);color:#e63946; }

      /* Quick launcher FAB */
      #arsan-launcher-fab {
        position:fixed;bottom:20px;inset-inline-end:20px;z-index:9000;
        width:48px;height:48px;border-radius:50%;
        background:linear-gradient(135deg,#d4a83c,#b89030);
        color:#fff;font-size:20px;border:none;cursor:pointer;
        box-shadow:0 6px 20px rgba(212,168,60,.4);
        display:grid;place-items:center;
        transition:all .15s;
      }
      #arsan-launcher-fab:hover { transform:scale(1.1);box-shadow:0 8px 25px rgba(212,168,60,.55); }
    `;
    document.head.appendChild(s);
  }

  // ============ INIT ============
  function init(){
    injectStyles();

    // Track SOP opens for Recent
    const origOpen = window.openModal;
    if (typeof origOpen === 'function') {
      window.openModal = function(i){
        const s = (window.SOPS||[])[i];
        if (s) pushRecent(window.CURRENT_DEPT_ID||'', s.code, s.title);
        return origOpen.apply(this, arguments);
      };
    }

    // Inject fav stars on cards
    const tryInject = () => injectFavStars();
    tryInject();
    const obs = new MutationObserver(tryInject);
    obs.observe(document.body, { childList:true, subtree:true });

    // Keyboard shortcuts
    let gKey = false, gTimer;
    document.addEventListener('keydown', (e) => {
      // Skip if typing in input
      if (e.target.matches('input, textarea, [contenteditable]')) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); openGlobalSearch();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault(); showShortcuts();
      } else if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); showShortcuts();
      } else if (e.key.toLowerCase() === 'g') {
        gKey = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => { gKey = false; }, 800);
      } else if (gKey && e.key.toLowerCase() === 's') {
        e.preventDefault(); showStats(); gKey = false;
      } else if (gKey && e.key.toLowerCase() === 'f') {
        e.preventDefault(); showFavorites(); gKey = false;
      }
    });

    // Launcher FAB
    if (!document.getElementById('arsan-launcher-fab')) {
      const fab = document.createElement('button');
      fab.id = 'arsan-launcher-fab';
      fab.title = t('مركز الأوامر (Ctrl+K)','Command Center (Ctrl+K)');
      fab.innerHTML = '⌘';
      fab.onclick = openLauncher;
      document.body.appendChild(fab);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ArsanFeatures = {
    openSearch: openGlobalSearch,
    openLauncher, showStats, showShortcuts, showRecent, showFavorites,
    toggleFav, printCurrentSOP
  };
})();

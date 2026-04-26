/* ===================================================================
   Arsan Onboarding Tour — الجولة التعريفية مع الأدهم
   File: tour.js
   - 12 steps with spotlight + Adham chat bubble
   - Bilingual AR/EN
   - Progress bar
   - Skip with confirmation
   - Auto-trigger first visit + manual button
   =================================================================== */
(function(){
  'use strict';
  if (window.__arsanTourLoaded) return;
  window.__arsanTourLoaded = true;

  const SEEN_KEY = 'arsan_tour_seen_v1';
  const HORSE_SVG = `<svg viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><path d="M58.4,17c-0.5-0.2-1-0.5-1.6-0.7c-0.1,0-0.2-0.1-0.4-0.1c-0.1,0-0.1-0.1-0.2-0.1c-1-0.4-1.9-0.7-1.9-0.7c-10.5-3.8-25.1-3.8-38.2-4.1c3.8,3.6,9.2,5.7,13.3,9.1c-6.8,9.2-13,18.9-19.2,28.6c0,0,9.6,7.3,15.1,12.3c3.8-3.5,7.4-8.5,11.6-12c4.9-3.2,5.6,1,5.6,1.8c0.7,9.4-4.1,25.1,1,32.9c16.4,0,28.1,0,44.5,0C78.9,58.3,81.8,27.4,58.4,17z"/><path d="M8,51.9c-1.1,1.8-2.2,3.4-3.4,5.1c0,0-3.4,5-3.2,5.5c0.2,0.4,2.2,2.3,3.3,2.9c1.1,0.6,2.2,0.9,2.9,0.8c2.3-0.5,4.1-2.1,5.9-3.6c0.2-0.2,1.3-0.3,1.3,0.8c0,0.6-4.1,5.9-4.1,5.9c0.8,1,1.8,1.9,2.7,2.7c2.8-2.7,5.9-5,8.4-8C17.9,59.4,13,55.6,8,51.9z"/></svg>`;

  function lang(){ return localStorage.getItem('arsan_lang') || 'ar'; }
  function t(ar, en){ return lang() === 'en' ? en : ar; }
  function isAdmin(){
    try { return window.ArsanAPI && window.ArsanAPI.isAdmin && window.ArsanAPI.isAdmin(); }
    catch(_) { return false; }
  }

  /* ===== STEPS ===== */
  function getSteps(){
    const steps = [
      {
        target: null, // intro modal
        title: t('السلام عليكم 🐎', 'Greetings 🐎'),
        body: t(
          'أنا **الأدهم**، مرشدك في منصّة أرسان.\nخلّيني آخذك في جولة سريعة (~٢ دقيقة) أعرّفك فيها على كل شيء تحتاج تعرفه.\n\nجاهز؟',
          'I am **Al-Adham**, your guide on the Arsan platform.\nLet me take you on a quick (~2-minute) tour through everything you need to know.\n\nReady?'
        ),
        side: 'center'
      },
      {
        target: '.brandline',
        title: t('هذا رأس الصفحة', 'This is the header'),
        body: t(
          'هنا تشوف **الإدارة الحالية** اللي تعمل عليها، وزر تغيير اللغة، والمظهر، والخروج.\nنبدأ من هنا في كل تنقّل.',
          'Here you see the **current department**, language toggle, theme switcher, and logout.\nThis is your home base for navigation.'
        ),
        side: 'bottom'
      },
      {
        target: '#searchInput, .search-wrap, .topbar-search',
        title: t('البحث الذكي', 'Smart search'),
        body: t(
          'اكتب أي كلمة هنا تلقى الإجراءات والخطوات والمستخدمين فوراً.\n💡 جرّب **Cmd+K** (Mac) أو **Ctrl+K** (Windows) للبحث الشامل من أي صفحة.',
          'Type any word here to instantly find SOPs, steps, and users.\n💡 Try **Cmd+K** (Mac) or **Ctrl+K** (Windows) for global search from anywhere.'
        ),
        side: 'bottom'
      },
      {
        target: '#chips',
        title: t('فلترة حسب المرحلة', 'Filter by stage'),
        body: t(
          'كل إجراء له مرحلة (مسوّدة، قيد المراجعة، معتمد…).\nاضغط أي شريحة تشوف الإجراءات في هذه المرحلة فقط.',
          'Every SOP has a stage (draft, in review, approved…).\nTap any chip to filter by that stage.'
        ),
        side: 'bottom'
      },
      {
        target: '#deptBreadcrumb, .brandline',
        title: t('اختيار الإدارة', 'Choose department'),
        body: t(
          'تقدر ترجع للصفحة الرئيسية وتدخل أي إدارة (المشاريع، الموارد البشرية، المالية…).\nكل إدارة فيها إجراءاتها الخاصة.',
          'You can go back home and enter any department (Projects, HR, Finance…).\nEach has its own SOPs.'
        ),
        side: 'bottom'
      },
      {
        target: '.sop-card, .card, [class*="sop"]',
        title: t('عرض إجراء', 'Open an SOP'),
        body: t(
          'اضغط أي بطاقة إجراء تشوف:\n• الغرض والنطاق\n• الخطوات التفصيلية\n• مؤشرات الأداء (KPIs)\n• النماذج والمراجع\n\nالمحرّر يقدر يعدّل أي حقل بنقرة واحدة.',
          'Click any SOP card to see:\n• Purpose & scope\n• Detailed steps\n• KPIs\n• Forms & references\n\nEditors can update any field with one click.'
        ),
        side: 'auto'
      },
      {
        target: '#addSopBtn, [data-action="add-sop"], button.primary',
        title: t('إضافة إجراء جديد', 'Add a new SOP'),
        body: t(
          'تقدر تضيف إجراء بـ ٣ طرق:\n1. **يدوياً** — تكتب الخطوات بنفسك\n2. **استيراد** PDF أو Word\n3. **رابط Google Doc**\n\nوالأدهم يحوّل النص لإجراء منظّم تلقائياً.',
          'Add an SOP in 3 ways:\n1. **Manually** — write steps yourself\n2. **Import** PDF or Word\n3. **Google Doc link**\n\nAl-Adham auto-structures it into a clean SOP.'
        ),
        side: 'auto'
      },
      {
        target: '#mapBtn, [data-action="map"], button[title*="خريطة"], button[title*="map"]',
        title: t('الخريطة الشاملة', 'Global map'),
        body: t(
          'تشوف **كل الإجراءات في كل الإدارات** كشبكة متّصلة.\nالخطوط بين الإجراءات تمثّل التبعيّات: من يعتمد على من؟',
          'See **all SOPs across all departments** as a connected network.\nLines show dependencies: what depends on what?'
        ),
        side: 'auto'
      },
      {
        target: '#arsan-ai-fab',
        title: t('الأدهم — مساعدك الذكي', 'Al-Adham — your AI assistant'),
        body: t(
          'هذا أنا 🐎 موجود دائماً في الزاوية.\nاسألني عن أي إجراء، اطلب تلخيص، اقتراح KPIs، أو أي سؤال يخصّ شغلك في أرسان.',
          'That\'s me 🐎 always in the corner.\nAsk me about any SOP, request summaries, suggest KPIs, or any question about your work at Arsan.'
        ),
        side: 'left'
      },
      {
        target: '#arsan-ai-fab',
        title: t('ذاكرة الأدهم', 'Adham\'s memory'),
        body: t(
          'افتح نافذتي واضغط **⚙** فوق.\nهناك تقدر تغذّيني بمعرفة شركتك: السياسات، المصطلحات، أي شيء تبيني أتذكّره.\nكل ما كتبته يدخل في إجاباتي.',
          'Open my window and click the **⚙** at top.\nThere you can feed me your company\'s knowledge: policies, terminology, anything you want me to remember.\nIt becomes part of my answers.'
        ),
        side: 'left'
      },
      {
        target: '.theme-toggle, [data-action="theme"], #themeBtn',
        title: t('المظهر واللغة', 'Theme & language'),
        body: t(
          'بدّل بين الثيمات (٥ ثيمات: ربيع، صيف، شتاء، خريف، افتراضي) واللغات من شريط الرأس.\nكل تغيير يحفظ تلقائياً.',
          'Switch between themes (5 themes: Spring, Summer, Winter, Autumn, Default) and languages from the header bar.\nEvery change is saved automatically.'
        ),
        side: 'bottom'
      }
    ];

    if (isAdmin()){
      steps.push({
        target: 'a[href*="users.html"], [data-action="users"]',
        title: t('إدارة المستخدمين', 'User management'),
        body: t(
          'بصفتك أدمن، تقدر تدعو مستخدمين جدد، تغيّر صلاحياتهم، تعيد تعيين كلمات السر، وتشوف سجل النشاط الكامل.',
          'As an admin, you can invite new users, change roles, reset passwords, and view the full activity log.'
        ),
        side: 'auto'
      });
    }

    steps.push({
      target: null,
      title: t('انتهت الجولة 🎉', 'Tour complete 🎉'),
      body: t(
        'الحين أنت جاهز.\nأي وقت تبي تعيد الجولة، تلقاها في **الإعدادات → بدء الجولة**.\nوأنا (الأدهم) موجود دايماً لو احتجت أي شيء.',
        'You\'re all set.\nReplay anytime from **Settings → Start tour**.\nAnd I (Al-Adham) am always here when you need me.'
      ),
      side: 'center'
    });

    return steps;
  }

  /* ===== STYLES ===== */
  function injectStyles(){
    if (document.getElementById('arsan-tour-styles')) return;
    const css = `
      .at-bd{
        position:fixed; inset:0; z-index:99000;
        pointer-events:auto;
        animation:at-fade .25s ease;
      }
      @keyframes at-fade{ from{opacity:0} to{opacity:1} }
      @keyframes at-pop{ from{opacity:0;transform:translateY(8px) scale(.96)} to{opacity:1;transform:none} }
      @keyframes at-pulse{
        0%{ box-shadow:0 0 0 0 rgba(133,113,77,.55), 0 0 0 4px rgba(255,255,255,.1) }
        70%{ box-shadow:0 0 0 22px rgba(133,113,77,0), 0 0 0 4px rgba(255,255,255,.1) }
        100%{ box-shadow:0 0 0 0 rgba(133,113,77,0), 0 0 0 4px rgba(255,255,255,.1) }
      }
      .at-mask{
        position:fixed; inset:0;
        background:rgba(8,6,4,.78);
        backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px);
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        transition:clip-path .35s cubic-bezier(.4,0,.2,1);
      }
      .at-spotlight{
        position:fixed;
        border-radius:14px;
        box-shadow:0 0 0 4px rgba(255,255,255,.15), 0 0 0 99999px rgba(8,6,4,.78);
        pointer-events:none;
        animation:at-pulse 2.4s infinite;
        transition:all .35s cubic-bezier(.4,0,.2,1);
        z-index:99001;
      }

      .at-bubble{
        position:fixed; z-index:99002;
        max-width:380px; min-width:300px;
        background:#1a1510;
        color:#f3e9c9;
        border:1px solid rgba(133,113,77,.5);
        border-radius:18px;
        padding:0;
        box-shadow:0 30px 80px rgba(0,0,0,.6), 0 8px 20px rgba(0,0,0,.3);
        font-family:"IBM Plex Sans Arabic", system-ui, sans-serif;
        animation:at-pop .3s cubic-bezier(.34,1.56,.64,1);
        transition:all .35s cubic-bezier(.4,0,.2,1);
      }
      .at-bubble.center{
        top:50%; left:50%; transform:translate(-50%,-50%);
        max-width:480px;
      }
      .at-bubble[dir="rtl"] *{ direction:rtl; text-align:right }

      .at-head{
        display:flex; align-items:center; gap:12px;
        padding:16px 20px 12px;
        border-bottom:1px solid rgba(133,113,77,.18);
      }
      .at-avatar{
        width:44px; height:44px; flex-shrink:0;
        background:radial-gradient(circle at 30% 30%, #EFE7D5, #C9B58A 70%, #A89066 100%);
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        padding:8px; box-sizing:border-box;
        color:#1a1510;
        box-shadow:0 4px 12px rgba(133,113,77,.4), inset 0 1px 2px rgba(255,255,255,.4);
        border:1px solid rgba(133,113,77,.45);
      }
      .at-avatar svg{ width:100%; height:100%; }
      .at-name{ font-size:13px; font-weight:700; color:#c9b27a; line-height:1.2; }
      .at-name small{ display:block; font-size:11px; opacity:.6; font-weight:500; margin-top:2px; }

      .at-body{ padding:18px 20px 20px; font-size:14px; line-height:1.75; }
      .at-body h3{ margin:0 0 10px; font-size:16px; font-weight:700; color:#fff; letter-spacing:-.01em; }
      .at-body p{ margin:0; white-space:pre-wrap; color:#e8dfc8; }
      .at-body strong{ color:#c9b27a; font-weight:700; }

      .at-foot{
        padding:12px 20px 16px;
        border-top:1px solid rgba(133,113,77,.15);
        display:flex; align-items:center; gap:10px;
      }
      .at-progress{
        flex:1; min-width:0;
        height:5px; background:rgba(133,113,77,.18);
        border-radius:3px; overflow:hidden;
      }
      .at-progress > i{
        display:block; height:100%;
        background:linear-gradient(90deg,#85714D,#c9b27a);
        border-radius:3px;
        transition:width .35s cubic-bezier(.4,0,.2,1);
      }
      .at-counter{ font-size:11px; opacity:.65; min-width:38px; text-align:center; font-variant-numeric:tabular-nums; }
      .at-actions{ display:flex; gap:8px; }
      .at-btn{
        padding:8px 14px;
        border-radius:9px; font-size:13px; font-weight:600;
        cursor:pointer; border:1px solid transparent;
        font-family:inherit; transition:all .15s;
        white-space:nowrap;
      }
      .at-btn.skip{ background:transparent; color:#9b958a; border-color:rgba(155,149,138,.25); }
      .at-btn.skip:hover{ color:#f3e9c9; border-color:rgba(155,149,138,.5); }
      .at-btn.next{ background:#85714D; color:#fff; border-color:#85714D; min-width:80px; }
      .at-btn.next:hover{ background:#9a8559; transform:translateY(-1px); box-shadow:0 4px 12px rgba(133,113,77,.4); }
      .at-btn.back{ background:transparent; color:#c9b27a; border-color:rgba(201,178,122,.25); }
      .at-btn.back:hover{ background:rgba(201,178,122,.08); border-color:rgba(201,178,122,.5); }

      /* skip-confirm popover */
      .at-confirm{
        position:fixed; inset:0; z-index:99500;
        background:rgba(0,0,0,.5);
        display:flex; align-items:center; justify-content:center;
        padding:24px;
        animation:at-fade .15s ease;
      }
      .at-confirm-card{
        background:#1a1510; color:#f3e9c9;
        border:1px solid rgba(133,113,77,.4);
        border-radius:14px; padding:22px;
        max-width:380px; width:100%;
        animation:at-pop .22s cubic-bezier(.34,1.56,.64,1);
        font-family:"IBM Plex Sans Arabic", system-ui, sans-serif;
      }
      .at-confirm-card h4{ margin:0 0 8px; font-size:16px; font-weight:700; }
      .at-confirm-card p{ margin:0 0 18px; font-size:13.5px; line-height:1.7; opacity:.85; }
      .at-confirm-actions{ display:flex; gap:10px; justify-content:flex-end; }

      /* manual-trigger button — square icon, sits ABOVE the Adham FAB */
      #at-launch{
        position:fixed;
        bottom:80px;                 /* 24 (FAB bottom) + 44 (FAB height) + 12 gap */
        inset-inline-end:24px;       /* aligned with FAB */
        inset-inline-start:auto;
        z-index:9450;                /* below FAB so panel can overlay both */
        width:44px; height:44px;
        padding:0;
        background:rgba(26,21,16,.55);
        backdrop-filter:blur(14px) saturate(180%);
        -webkit-backdrop-filter:blur(14px) saturate(180%);
        color:#f3e9c9;
        border:1px solid rgba(133,113,77,.35);
        border-radius:12px;
        cursor:pointer;
        display:none;
        align-items:center; justify-content:center;
        box-shadow:0 4px 14px rgba(0,0,0,.22);
        transition:background .15s, border-color .15s, transform .15s, opacity .15s;
        opacity:.85;
      }
      html[data-theme="light"] #at-launch{
        background:rgba(255,255,255,.55);
        color:#3a2f15;
        border-color:rgba(133,113,77,.35);
      }
      #at-launch:hover{
        opacity:1;
        background:rgba(133,113,77,.25);
        border-color:rgba(133,113,77,.6);
        transform:translateY(-1px);
      }
      #at-launch.show{ display:inline-flex; }
      /* Hide the text label — icon-only button */
      #at-launch > span:not(.ic){ display:none; }
      #at-launch .ic{
        width:22px; height:22px;
        display:inline-flex;
        align-items:center; justify-content:center;
      }
      #at-launch .ic svg{ width:100%; height:100%; }

      @media (max-width:560px){
        .at-bubble{ max-width:calc(100vw - 32px); min-width:0; }
      }
    `;
    const s = document.createElement('style');
    s.id = 'arsan-tour-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ===== STATE ===== */
  let steps = [];
  let idx = 0;
  let bd, mask, spot, bubble;

  /* ===== POSITIONING ===== */
  function findTarget(selector){
    if (!selector) return null;
    const sels = selector.split(',').map(s => s.trim());
    for (const s of sels){
      const el = document.querySelector(s);
      if (el && el.offsetWidth && el.offsetHeight) return el;
    }
    return null;
  }

  function positionFor(step){
    const target = step.target ? findTarget(step.target) : null;

    if (!target || step.side === 'center'){
      bubble.classList.add('center');
      bubble.style.top = bubble.style.left = bubble.style.transform = '';
      spot.style.opacity = '0';
      return;
    }

    bubble.classList.remove('center');
    spot.style.opacity = '1';

    const r = target.getBoundingClientRect();
    const pad = 10;
    spot.style.top = (r.top - pad) + 'px';
    spot.style.left = (r.left - pad) + 'px';
    spot.style.width = (r.width + pad*2) + 'px';
    spot.style.height = (r.height + pad*2) + 'px';

    // bubble placement
    const bubH = bubble.offsetHeight || 280;
    const bubW = bubble.offsetWidth || 360;
    const vpW = window.innerWidth, vpH = window.innerHeight;
    const margin = 18;

    let side = step.side || 'auto';
    if (side === 'auto'){
      if (vpH - r.bottom > bubH + margin) side = 'bottom';
      else if (r.top > bubH + margin) side = 'top';
      else if (vpW - r.right > bubW + margin) side = 'right';
      else side = 'left';
    }

    let top, left;
    if (side === 'bottom'){
      top = r.bottom + margin;
      left = Math.max(16, Math.min(vpW - bubW - 16, r.left + r.width/2 - bubW/2));
    } else if (side === 'top'){
      top = r.top - bubH - margin;
      left = Math.max(16, Math.min(vpW - bubW - 16, r.left + r.width/2 - bubW/2));
    } else if (side === 'right'){
      left = r.right + margin;
      top = Math.max(16, Math.min(vpH - bubH - 16, r.top + r.height/2 - bubH/2));
    } else { // left
      left = Math.max(16, r.left - bubW - margin);
      top = Math.max(16, Math.min(vpH - bubH - 16, r.top + r.height/2 - bubH/2));
    }

    bubble.style.top = top + 'px';
    bubble.style.left = left + 'px';
    bubble.style.transform = '';
  }

  /* ===== RENDER ===== */
  function render(){
    const step = steps[idx];
    const dir = lang() === 'en' ? 'ltr' : 'rtl';
    bubble.setAttribute('dir', dir);

    const isFirst = idx === 0;
    const isLast = idx === steps.length - 1;
    const pct = Math.round(((idx + 1) / steps.length) * 100);

    bubble.innerHTML = `
      <div class="at-head">
        <div class="at-avatar">${HORSE_SVG}</div>
        <div class="at-name">
          ${t('الأدهم','Al-Adham')}
          <small>${t('مرشدك في أرسان','Your Arsan guide')}</small>
        </div>
      </div>
      <div class="at-body">
        <h3>${escapeHtml(step.title)}</h3>
        <p>${renderMd(step.body)}</p>
      </div>
      <div class="at-foot">
        <div class="at-progress"><i style="width:${pct}%"></i></div>
        <span class="at-counter">${idx+1}/${steps.length}</span>
        <div class="at-actions">
          ${!isFirst ? `<button class="at-btn back" type="button">${t('السابق','Back')}</button>` : ''}
          <button class="at-btn skip" type="button">${t('تخطّي','Skip')}</button>
          <button class="at-btn next" type="button">${isLast ? t('إنهاء','Finish') : t('التالي','Next')}</button>
        </div>
      </div>
    `;

    bubble.querySelector('.at-btn.next').addEventListener('click', next);
    bubble.querySelector('.at-btn.skip').addEventListener('click', skipConfirm);
    const back = bubble.querySelector('.at-btn.back');
    if (back) back.addEventListener('click', prev);

    requestAnimationFrame(() => positionFor(step));
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function renderMd(s){
    const esc = escapeHtml(s);
    return esc
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  /* ===== NAVIGATION ===== */
  function next(){
    if (idx >= steps.length - 1){ finish(); return; }
    idx++;
    render();
  }
  function prev(){
    if (idx <= 0) return;
    idx--;
    render();
  }

  function skipConfirm(){
    const card = document.createElement('div');
    card.className = 'at-confirm';
    card.innerHTML = `
      <div class="at-confirm-card" dir="${lang()==='en'?'ltr':'rtl'}">
        <h4>${t('تخطّي الجولة؟','Skip the tour?')}</h4>
        <p>${t('متأكد؟ تقدر ترجع لها أي وقت من الإعدادات → بدء الجولة.','Are you sure? You can replay it anytime from Settings → Start tour.')}</p>
        <div class="at-confirm-actions">
          <button class="at-btn back" type="button">${t('متابعة الجولة','Continue tour')}</button>
          <button class="at-btn next" type="button">${t('نعم، تخطّي','Yes, skip')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(card);
    card.querySelector('.back').addEventListener('click', () => card.remove());
    card.querySelector('.next').addEventListener('click', () => { card.remove(); finish(); });
    card.addEventListener('click', e => { if (e.target === card) card.remove(); });
  }

  function finish(){
    try { if (bd) bd.remove(); } catch(_){}
    try { if (spot) spot.remove(); } catch(_){}
    try { if (bubble) bubble.remove(); } catch(_){}
    // Remove any leftover skip-confirm cards too
    document.querySelectorAll('.at-confirm').forEach(c => { try { c.remove(); } catch(_){} });
    bd = mask = spot = bubble = null;
    window.removeEventListener('resize', repositionCurrent);
    window.removeEventListener('scroll', repositionCurrent, true);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch(_){}
  }

  /* ===== START ===== */
  function start(){
    injectStyles();
    steps = getSteps();
    idx = 0;

    bd = document.createElement('div');
    bd.className = 'at-bd';

    spot = document.createElement('div');
    spot.className = 'at-spotlight';
    spot.style.opacity = '0';

    bubble = document.createElement('div');
    bubble.className = 'at-bubble';

    document.body.appendChild(bd);
    document.body.appendChild(spot);
    document.body.appendChild(bubble);

    // The bd itself acts as the dimmed overlay (when no spotlight)
    bd.style.background = 'rgba(8,6,4,.78)';
    bd.style.backdropFilter = 'blur(2px)';

    render();

    // Reposition on resize/scroll
    window.addEventListener('resize', repositionCurrent);
    window.addEventListener('scroll', repositionCurrent, true);
  }

  function repositionCurrent(){
    if (!bubble || !steps[idx]) return;
    positionFor(steps[idx]);
  }

  /* ===== LAUNCHER BUTTON ===== */
  function injectLauncher(){
    if (document.getElementById('at-launch')) return;
    const btn = document.createElement('button');
    btn.id = 'at-launch';
    btn.type = 'button';
    btn.title = t('بدء الجولة','Start tour');
    btn.setAttribute('aria-label', t('بدء الجولة','Start tour'));
    btn.innerHTML = `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z"/></svg></span><span>${t('بدء الجولة','Start tour')}</span>`;
    btn.addEventListener('click', () => {
      if (bd) finish();
      setTimeout(start, 100);
    });
    document.body.appendChild(btn);
    // Show only when logged in
    setTimeout(() => {
      const me = (() => { try { return JSON.parse(localStorage.getItem('arsan_me_v1')||localStorage.getItem('arsan_me')||'null'); } catch(_) { return null; } })();
      if (me && me.email) btn.classList.add('show');
    }, 600);
  }

  /* ===== AUTO-TRIGGER ===== */
  function maybeAutoStart(){
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch(_){}
    if (seen) return;
    // If welcome modal hasn't been seen yet, let it handle the tour launch
    let welcomeSeen = false;
    try { welcomeSeen = localStorage.getItem('arsan_welcome_seen_v1') === '1'; } catch(_){}
    if (!welcomeSeen) return;
    const me = (() => { try { return JSON.parse(localStorage.getItem('arsan_me_v1')||localStorage.getItem('arsan_me')||'null'); } catch(_) { return null; } })();
    if (!me || !me.email) return;
    // Wait for UI to settle
    setTimeout(start, 1800);
  }

  /* ===== PUBLIC API ===== */
  window.ArsanTour = {
    start: () => { if (bd) finish(); setTimeout(start, 50); },
    finish,
    reset(){ try { localStorage.removeItem(SEEN_KEY); } catch(_){} }
  };

  /* ===== INIT ===== */
  function init(){
    injectStyles();
    injectLauncher();
    maybeAutoStart();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

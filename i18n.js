/* Arsan i18n for index.html and users.html
 * Adds a language toggle (🌐 EN/ع) to the top-right, switches RTL/LTR,
 * and applies English translations to department cards + static UI strings.
 */
(function(){
  'use strict';

  const LS_KEY = 'arsan_lang';
  const getLang = () => localStorage.getItem(LS_KEY) || 'ar';

  // Department name/desc translations
  const DEPT_EN = {
    projects:   { name: 'Project Management', desc: 'Design, planning, procurement, maintenance, and execution.' },
    executive:  { name: 'Executive Management', desc: 'Strategic decisions, governance, overall performance.' },
    finance:    { name: 'Finance', desc: 'Budgets, payments, claims, and financial reporting.' },
    operations: { name: 'Operations', desc: 'Day-to-day operations, scheduling, and performance tracking.' },
    legal:      { name: 'Legal', desc: 'Contracts, compliance, and legal review.' },
    hr:         { name: 'Human Resources', desc: 'Hiring, performance, training, and employee journey.' },
    bizdev:     { name: 'Business Development', desc: 'Commercial opportunities, proposals, and strategic relations.' },
    // Also translate common sub-departments that may appear as custom
    design:      { name: 'Design', desc: 'Architectural and engineering design phase.' },
    planning:    { name: 'Planning', desc: 'Schedules, timelines, and delivery planning.' },
    procurement: { name: 'Procurement', desc: 'Suppliers, tenders, and purchase orders.' },
    maintenance: { name: 'Maintenance', desc: 'Preventive and corrective maintenance.' },
    execution:   { name: 'Execution', desc: 'On-site delivery and quality assurance.' }
  };

  // Static UI strings (keyed)
  const STR = {
    ar: {
      // index.html
      brand: 'منصة أرسان SOPs',
      tagline: 'الإدارات ذات الإجراءات التشغيلية',
      chooseDept: 'اختر الإدارة',
      continue: 'متابعة',
      // users.html
      usersTitle: 'الصلاحيات والمستخدمون',
      usersSub: 'إدارة مستخدمي منصة Arsan، ربط كل مستخدم بقسم (أو أكثر)، والتحكم في الصلاحيات.',
      backToDash: 'العودة للرئيسية',
      refresh: 'تحديث',
      matrix: 'مصفوفة الصلاحيات',
      settings: 'إعدادات النظام',
      inviteUser: 'دعوة مستخدم جديد',
      // auth-gate
      signIn: 'تسجيل الدخول',
      email: 'البريد الإلكتروني',
      password: 'كلمة السر',
      forgot: 'نسيت كلمة السر؟',
      signInTagline: 'يرجى تسجيل الدخول للمتابعة',
      noAccess: 'لم يتم تعيين إدارات لحسابك',
      noAccessSub: 'تواصل مع الأدمن (a.king@arsann.com) لمنحك صلاحية الوصول.',
      member: 'عضو',
      admin: '⭐ مسؤول',
      deptsSuffix: 'إدارة',
      logoutConfirm: 'تسجيل خروج؟',
      // footer
      footer: 'arsann.com • جميع الحقوق محفوظة © 2026'
    },
    en: {
      brand: 'Arsan SOPs Platform',
      tagline: 'Departments with operating procedures',
      chooseDept: 'Choose a department',
      continue: 'Continue',
      usersTitle: 'Users & Permissions',
      usersSub: 'Manage Arsan platform users, assign departments, and control permissions.',
      backToDash: 'Back to dashboard',
      refresh: 'Refresh',
      matrix: 'Permissions matrix',
      settings: 'System settings',
      inviteUser: 'Invite new user',
      signIn: 'Sign in',
      email: 'Email',
      password: 'Password',
      forgot: 'Forgot password?',
      signInTagline: 'Please sign in to continue',
      noAccess: 'No departments assigned to your account',
      noAccessSub: 'Contact the admin (a.king@arsann.com) to grant access.',
      member: 'Member',
      admin: '⭐ Admin',
      deptsSuffix: 'depts',
      logoutConfirm: 'Sign out?',
      footer: 'arsann.com • All rights reserved © 2026'
    }
  };

  function t(key){
    const lang = getLang();
    return (STR[lang] && STR[lang][key]) || STR.ar[key] || key;
  }
  window.ArsanI18n = { t, getLang };

  // ====== Translation appliers ======
  function applyIndexTranslations(lang){
    // Dept cards — they may render AFTER this runs, so retry a few times
    const run = () => {
      const cards = document.querySelectorAll('.dept-card');
      if (cards.length === 0) return false;
      cards.forEach(card => {
        const id = (card.getAttribute('data-id') || '').toLowerCase();
        const name = card.querySelector('.dept-name');
        const desc = card.querySelector('.dept-desc');
        // Stash Arabic originals on first run
        if (name && !name.dataset.arOrig) name.dataset.arOrig = name.textContent;
        if (desc && !desc.dataset.arOrig) desc.dataset.arOrig = desc.textContent;
        if (lang === 'en' && DEPT_EN[id]) {
          if (name) name.textContent = DEPT_EN[id].name;
          if (desc) desc.textContent = DEPT_EN[id].desc;
        } else {
          if (name && name.dataset.arOrig) name.textContent = name.dataset.arOrig;
          if (desc && desc.dataset.arOrig) desc.textContent = desc.dataset.arOrig;
        }
      });
      return true;
    };
    if (!run()) {
      let tries = 0;
      const iv = setInterval(() => {
        if (run() || ++tries > 20) clearInterval(iv);
      }, 150);
    }

    // Static strings in index.html (brand, tagline, choose dept, etc.)
    translateTextContent('.brand-text, [data-i18n="brand"]', t('brand'));
    translateTextContent('.tagline, [data-i18n="tagline"]', t('tagline'));
    translateTextContent('[data-i18n="chooseDept"]', t('chooseDept'));
    translateTextContent('[data-i18n="continue"]', t('continue'));
    translateTextContent('[data-i18n="footer"]', t('footer'));

    // "Choose a department" heading is typically in .choose-title or similar
    const heading = document.querySelector('.choose-title, .page-title, h1');
    if (heading && !heading.dataset.i18nSkip && !heading.dataset.arOrig) {
      heading.dataset.arOrig = heading.textContent;
    }

    // Selected label
    const sel = document.getElementById('selectedLabel');
    if (sel && sel.textContent.trim()) {
      // Clean up "تم اختيار:" label when switching to English
      const strong = sel.querySelector('strong');
      if (strong) {
        const deptName = strong.textContent;
        const cards = document.querySelectorAll('.dept-card');
        let newName = deptName;
        cards.forEach(c => {
          if (c.getAttribute('aria-pressed') === 'true') {
            newName = c.querySelector('.dept-name')?.textContent || deptName;
          }
        });
        sel.innerHTML = (lang === 'en' ? 'Selected: ' : 'تم اختيار: ') + '<strong>' + newName + '</strong>';
      }
    }
  }

  function applyUsersTranslations(lang){
    translateTextContent('[data-i18n="usersTitle"]', t('usersTitle'));
    translateTextContent('[data-i18n="usersSub"]', t('usersSub'));
    translateTextContent('[data-i18n="refresh"]', t('refresh'));
    translateTextContent('[data-i18n="matrix"]', t('matrix'));
    translateTextContent('[data-i18n="settings"]', t('settings'));
    translateTextContent('[data-i18n="inviteUser"]', t('inviteUser'));

    // Direct overrides by button id (backward-compat where data-i18n isn't added)
    const byIdMap = {
      'btn-refresh': t('refresh'),
      'btn-matrix':  t('matrix'),
      'btn-settings': t('settings'),
      'btn-invite':  t('inviteUser')
    };
    for (const id in byIdMap) {
      const btn = document.getElementById(id);
      if (btn) {
        // Preserve SVG, replace only text nodes
        const textNode = [...btn.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
        if (textNode) {
          if (!btn.dataset.arOrig) btn.dataset.arOrig = textNode.textContent;
          textNode.textContent = lang === 'en' ? ' ' + byIdMap[id] + ' ' : ' ' + btn.dataset.arOrig.trim() + ' ';
        } else {
          // No trailing text — append one
          if (!btn.dataset.arOrig) btn.dataset.arOrig = btn.textContent.trim();
          btn.appendChild(document.createTextNode(' ' + byIdMap[id]));
        }
      }
    }

    // Page title + subtitle
    const title = document.querySelector('.page-title');
    if (title) {
      if (!title.dataset.arOrig) title.dataset.arOrig = title.textContent;
      title.textContent = lang === 'en' ? t('usersTitle') : title.dataset.arOrig;
    }
    const sub = document.querySelector('.page-sub');
    if (sub) {
      if (!sub.dataset.arOrig) sub.dataset.arOrig = sub.textContent;
      sub.textContent = lang === 'en' ? t('usersSub') : sub.dataset.arOrig;
    }

    // Breadcrumbs: "الرئيسية / الصلاحيات والمستخدمون"
    document.querySelectorAll('a[href="dashboard.html"]').forEach(a => {
      if (a.textContent.trim() === 'الرئيسية' || a.textContent.trim() === 'Home') {
        if (!a.dataset.arOrig) a.dataset.arOrig = a.textContent;
        a.textContent = lang === 'en' ? 'Home' : 'الرئيسية';
      }
      // Back button
      if (a.classList.contains('back-btn')) {
        if (!a.dataset.arOrig) a.dataset.arOrig = a.textContent.trim();
        // Keep SVG if present
        const svg = a.querySelector('svg');
        a.textContent = '';
        if (svg) a.appendChild(svg);
        a.appendChild(document.createTextNode(' ' + t('backToDash')));
      }
    });
  }

  function translateTextContent(selector, newText){
    document.querySelectorAll(selector).forEach(n => {
      if (!n.dataset.arOrig) n.dataset.arOrig = n.textContent.trim();
      n.textContent = (getLang() === 'en') ? newText : n.dataset.arOrig;
    });
  }

  // ====== Language toggle button ======
  function injectToggleButton(){
    if (document.getElementById('arsan-lang-toggle')) return;
    const style = document.createElement('style');
    style.textContent = `
      #arsan-lang-toggle{
        position:fixed;top:16px;inset-inline-start:16px;z-index:500;
        background:rgba(255,255,255,.95);backdrop-filter:blur(8px);
        border:1px solid rgba(212,168,60,.3);
        padding:8px 14px;border-radius:999px;
        font:inherit;font-size:12.5px;font-weight:600;color:#6d5a1e;
        cursor:pointer;display:flex;align-items:center;gap:6px;
        transition:background .15s, transform .05s;
        box-shadow:0 2px 8px rgba(0,0,0,.05);
      }
      html[data-theme="dark"] #arsan-lang-toggle{background:rgba(40,32,22,.9);color:#f3e9c9;border-color:rgba(212,168,60,.4)}
      #arsan-lang-toggle:hover{background:#f9f5e6}
      html[data-theme="dark"] #arsan-lang-toggle:hover{background:rgba(60,48,30,.95)}
      #arsan-lang-toggle:active{transform:scale(.96)}
      #arsan-lang-toggle .globe{font-size:14px}
    `;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'arsan-lang-toggle';
    btn.setAttribute('aria-label', 'Toggle language');
    btn.innerHTML = '<span class="globe">🌐</span><span class="label">EN</span>';
    btn.onclick = () => {
      const next = getLang() === 'ar' ? 'en' : 'ar';
      localStorage.setItem(LS_KEY, next);
      applyLang(next);
    };
    document.body.appendChild(btn);
    updateToggleLabel();
  }

  function updateToggleLabel(){
    const btn = document.getElementById('arsan-lang-toggle');
    if (!btn) return;
    const label = btn.querySelector('.label');
    if (label) label.textContent = getLang() === 'ar' ? 'EN' : 'عربي';
  }

  function applyLang(lang){
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'en') ? 'ltr' : 'rtl';
    updateToggleLabel();

    // Detect page and apply appropriate translations
    const path = location.pathname.toLowerCase();
    const isUsersPage = path.endsWith('users.html') || document.body.id === 'users-page' || document.querySelector('#usersTable') || document.getElementById('btn-invite');
    const isIndex = path.endsWith('/') || path.endsWith('index.html') || document.querySelector('.dept-grid');

    if (isUsersPage) applyUsersTranslations(lang);
    if (isIndex) applyIndexTranslations(lang);
  }

  // ====== Init ======
  function init(){
    injectToggleButton();
    applyLang(getLang());
    // Re-apply after delays to catch late-rendered content
    setTimeout(() => applyLang(getLang()), 300);
    setTimeout(() => applyLang(getLang()), 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ArsanApplyLang = applyLang;
})();

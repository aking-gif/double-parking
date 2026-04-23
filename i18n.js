/* Arsan i18n v2 — Comprehensive Arabic/English toggle
 * Walks the entire DOM and translates known Arabic strings to English.
 * Works on index.html, users.html, and dashboard.html.
 */
(function(){
  'use strict';

  const LS_KEY = 'arsan_lang';
  const getLang = () => localStorage.getItem(LS_KEY) || 'ar';

  // ===== Arabic → English dictionary =====
  // Keep keys exact (Arabic as-is). Order doesn't matter.
  const DICT = {
    // Common UI
    'تسجيل الدخول': 'Sign In',
    'تسجيل خروج': 'Sign Out',
    'تسجيل خروج؟': 'Sign out?',
    'خروج': 'Sign Out',
    'البريد الإلكتروني': 'Email',
    'كلمة السر': 'Password',
    'نسيت كلمة السر؟': 'Forgot password?',
    'يرجى تسجيل الدخول للمتابعة': 'Please sign in to continue',
    'منصّة أرسان التنفيذيّة': 'Arsann Executive Platform',
    'منصة أرسان SOPs': 'Arsann Executive Platform',
    'منصة أرسان': 'Arsann Platform',
    'arsann.com • جميع الحقوق محفوظة © 2026': 'arsann.com · All rights reserved © 2026',
    'جميع الحقوق محفوظة': 'All rights reserved',

    // index.html
    'اختر الإدارة': 'Select a Department',
    'الإدارات ذات الإجراءات التشغيلية': 'Departments with Operating Procedures',
    'تم اختيار:': 'Selected:',
    'متابعة': 'Continue',
    'الوضع الفاتح': 'Light Mode',
    'الوضع الداكن': 'Dark Mode',

    // Departments
    'إدارة المشاريع': 'Project Management',
    'الإدارة التنفيذية': 'Executive Management',
    'الإدارة المالية': 'Finance',
    'الإدارة التشغيلية': 'Operations',
    'الإدارة القانونية': 'Legal',
    'إدارة الموارد البشرية': 'Human Resources',
    'إدارة تطوير الأعمال': 'Business Development',
    'التصميم، التخطيط، المشتريات، الصيانة، والتنفيذ.': 'Design, planning, procurement, maintenance, and execution.',
    'القرارات الاستراتيجية، الحوكمة، متابعة الأداء الكلي.': 'Strategic decisions, governance, overall performance.',
    'الموازنات، الصرف، المطالبات، والتقارير المالية.': 'Budgets, payments, claims, and financial reporting.',
    'العمليات اليومية، الجدولة، ومتابعة الأداء.': 'Day-to-day operations, scheduling, and performance tracking.',
    'العقود، الامتثال، والمراجعات القانونية.': 'Contracts, compliance, and legal review.',
    'التوظيف، الأداء، التدريب، ورحلة الموظف.': 'Hiring, performance, training, and employee journey.',
    'الفرص التجارية، العروض، والعلاقات الاستراتيجية.': 'Commercial opportunities, proposals, and strategic relations.',

    // users.html
    'الصلاحيات والمستخدمون': 'Users & Access',
    'إدارة مستخدمي منصة Arsan، ربط كل مستخدم بقسم (أو أكثر)، والتحكم في الصلاحيات.': 'Manage team members, assign departments, and control access levels.',
    'الرئيسية': 'Home',
    'العودة للرئيسية': 'Back to Home',
    'تحديث': 'Refresh',
    'مصفوفة الصلاحيات': 'Permissions Matrix',
    'إعدادات النظام': 'System Settings',
    'دعوة مستخدم جديد': 'Invite New User',
    'جدول': 'Table',
    'بطاقات': 'Cards',
    'لوحة': 'Dashboard',
    'الاسم': 'Name',
    'البريد': 'Email',
    'الدور': 'Role',
    'الإدارات': 'Departments',
    'الحالة': 'Status',
    'آخر دخول': 'Last Login',
    'إجراءات': 'Actions',
    'نشط': 'Active',
    'معطّل': 'Disabled',
    'بانتظار': 'Pending',
    'مسؤول': 'Admin',
    'محرّر': 'Editor',
    'مشاهد': 'Viewer',
    '⭐ مسؤول': '⭐ Admin',
    'عضو': 'Member',
    'المستخدمون': 'Users',
    'المستخدمين': 'Users',

    // dashboard.html common
    'استيراد': 'Import',
    'إجراء جديد': 'New SOP',
    'Admin': 'Admin',
    'الإجراءات': 'Procedures',
    'المحاور': 'Sections',
    'التبعيّات': 'Dependencies',
    'الخريطة': 'Process Map',
    'المساعد': 'AI Assistant',
    'النشاط': 'Activity Log',
    'صياغة الخطة الاستراتيجية': 'Strategy Formulation',
    'الغرض من الإجراء': 'Purpose',
    'المعلومات الأساسية': 'Basic Information',
    'الجهة المالكة': 'Owner',
    'الإطار الزمني (SLA)': 'Timeline (SLA)',
    'النطاق': 'Scope',
    'المدخلات': 'Inputs',
    'المخرجات': 'Outputs',
    'خطوات التنفيذ': 'Steps',
    'مؤشرات الأداء': 'KPIs',
    '— يُكمل لاحقاً': '— To be filled',
    '— يُعبَّأ لاحقاً': '— To be filled',
    '— اِشرح هنا لماذا هذا الإجراء موجود وما المشكلة التي يحلّها.': '— Explain here why this SOP exists and what problem it solves.',
    'وضع التحرير:': 'Edit Mode:',
    'تحرير مباشر': 'Direct Edit',
    'رفع ملف': 'Upload File',
    'توليد بالذكاء': 'Generate with AI',
    'حفظ': 'Save',
    'إلغاء': 'Cancel',
    'حذف': 'Delete',
    'تعديل': 'Edit',
    'إضافة': 'Add',
    'بحث…': 'Search…',
    'جاري التحميل…': 'Loading…',
    'جاري الحفظ…': 'Saving…',
    'جاري التوليد بالذكاء…': 'Generating with AI…',
    'جاري استخراج الحقول بالذكاء…': 'Extracting fields…',
    'جاري قراءة الملف…': 'Reading file…',
    'جاري استخراج النص من PDF…': 'Extracting text from PDF…',
    'جاري استخراج النص من DOCX…': 'Extracting text from DOCX…',
    'جاري تحميل محرك PDF…': 'Loading PDF engine…',
    'جاري تحميل محرك DOCX…': 'Loading DOCX engine…',

    // Settings modal
    '📣 شريط التحديثات': '📣 Updates Banner',
    '🏢 الإدارات المخصّصة': '🏢 Custom Departments',
    '🔔 Slack': '🔔 Slack',
    'شريط التحديثات': 'Updates Banner',
    'الإدارات المخصّصة': 'Custom Departments',
    'رابط مصدر التحديثات': 'Updates source URL',
    'حفظ الرابط': 'Save URL',
    '🔄 تحديث المعاينة': '🔄 Refresh Preview',
    '🔔 إعادة عرض الشريط': '🔔 Re-show Banner',
    '+ إضافة إدارة': '+ Add Department',
    'إضافة إدارة جديدة': 'Add New Department',
    'تعديل إدارة': 'Edit Department',
    'اسم الإدارة': 'Department Name',
    'المعرّف (id) — بالإنجليزية': 'ID (English)',
    'الأيقونة (إيموجي)': 'Icon (Emoji)',
    'اللون': 'Color',
    'لا توجد إدارات مخصّصة. أضف أولى.': 'No custom departments yet. Add one.',
    '✓ تم الحفظ': '✓ Saved',
    '✓ تم الحفظ. جاري تحديث المعاينة…': '✓ Saved. Refreshing preview…',
    '✓ تم التحديث': '✓ Updated',
    '✓ تمت الإضافة': '✓ Added',
    '✓ حُذفت': '✓ Deleted',
    '✓ تم إعادة عرض الشريط للجميع عند التحديث': '✓ Banner reset for everyone on next refresh',

    // Auth gate specific
    'لم يتم تعيين إدارات لحسابك': 'No departments assigned to your account',
    'تواصل مع الأدمن (a.king@arsann.com) لمنحك صلاحية الوصول.': 'Contact the admin (a.king@arsann.com) to grant access.',
    '❌ البريد أو كلمة السر غير صحيحة': '❌ Invalid email or password',
    '❌ الحساب معطّل. تواصل مع الأدمن.': '❌ Account disabled. Contact admin.',
    '❌ يُسمح فقط لبريد @arsann.com': '❌ Only @arsann.com emails allowed',
    'يجب إدخال البريد وكلمة السر': 'Email and password required',
    'جاري التحقق…': 'Verifying…',
  };

  // Dept name → description (for cards) — also used when dept name is in data-id
  const DEPT_DESC_BY_ID = {
    projects:   'Design, planning, procurement, maintenance, and execution.',
    executive:  'Strategic decisions, governance, overall performance.',
    finance:    'Budgets, payments, claims, and financial reporting.',
    operations: 'Day-to-day operations, scheduling, and performance tracking.',
    legal:      'Contracts, compliance, and legal review.',
    hr:         'Hiring, performance, training, and employee journey.',
    bizdev:     'Commercial opportunities, proposals, and strategic relations.'
  };
  const DEPT_NAME_BY_ID = {
    projects:   'Project Management',
    executive:  'Executive Management',
    finance:    'Finance',
    operations: 'Operations',
    legal:      'Legal',
    hr:         'Human Resources',
    bizdev:     'Business Development'
  };

  // ===== Walk DOM and replace text =====
  function walkAndTranslate(lang){
    // Save original Arabic once (on <body>)
    if (!document.body.dataset.i18nStashed) {
      // Already handled per-node via data-arOrig
    }

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node){
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          const tag = p.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
          if (p.closest('#arsan-lang-toggle')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let n;
    while (n = walker.nextNode()) nodes.push(n);

    nodes.forEach(node => {
      // Stash original
      if (!node.__arOrig) node.__arOrig = node.textContent;

      if (lang === 'en') {
        let text = node.__arOrig;
        // Try exact match first
        const trimmed = text.trim();
        if (DICT[trimmed]) {
          node.textContent = text.replace(trimmed, DICT[trimmed]);
          return;
        }
        // Otherwise, do partial replacements (for strings with embedded interpolations)
        let replaced = text;
        for (const [ar, en] of Object.entries(DICT)) {
          if (replaced.includes(ar)) {
            replaced = replaced.split(ar).join(en);
          }
        }
        if (replaced !== text) node.textContent = replaced;
      } else {
        // Restore
        if (node.__arOrig && node.textContent !== node.__arOrig) {
          node.textContent = node.__arOrig;
        }
      }
    });

    // Translate placeholder + value attributes on inputs
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      if (!el.__arPlaceholder) el.__arPlaceholder = el.placeholder;
      if (lang === 'en' && DICT[el.__arPlaceholder]) {
        el.placeholder = DICT[el.__arPlaceholder];
      } else if (lang === 'ar' && el.__arPlaceholder) {
        el.placeholder = el.__arPlaceholder;
      }
    });

    // Translate button titles and aria-labels
    document.querySelectorAll('[title], [aria-label]').forEach(el => {
      ['title', 'aria-label'].forEach(attr => {
        const cur = el.getAttribute(attr);
        if (!cur) return;
        const stashKey = '__arAttr_' + attr;
        if (!el[stashKey]) el[stashKey] = cur;
        if (lang === 'en' && DICT[el[stashKey]]) {
          el.setAttribute(attr, DICT[el[stashKey]]);
        } else if (lang === 'ar' && el[stashKey]) {
          el.setAttribute(attr, el[stashKey]);
        }
      });
    });
  }

  // ===== Public API (no floating button — sidebar hosts the toggle) =====
  function toggleLang(){
    const next = getLang() === 'ar' ? 'en' : 'ar';
    localStorage.setItem(LS_KEY, next);
    applyLang(next);
    return next;
  }
  function setLang(lang){
    if (lang !== 'ar' && lang !== 'en') return;
    localStorage.setItem(LS_KEY, lang);
    applyLang(lang);
  }
  // Remove any previously-injected floating button (from older versions)
  function removeOldToggle(){
    const old = document.getElementById('arsan-lang-toggle');
    if (old) old.remove();
  }

  function applyLang(lang){
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'en') ? 'ltr' : 'rtl';
    walkAndTranslate(lang);
    // Notify listeners (sidebar updates its label)
    try { window.dispatchEvent(new CustomEvent('arsan-lang-change', { detail: { lang } })); } catch(_){}
  }

  function init(){
    removeOldToggle();
    applyLang(getLang());
    // Re-apply on DOM mutations (new modals, cards, etc.)
    const obs = new MutationObserver(() => {
      clearTimeout(window.__i18nRerun);
      window.__i18nRerun = setTimeout(() => { removeOldToggle(); applyLang(getLang()); }, 100);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ArsanI18n = { apply: applyLang, getLang, setLang, toggle: toggleLang, dict: DICT };
})();

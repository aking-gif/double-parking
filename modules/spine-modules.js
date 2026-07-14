/* =================================================================
   THE SPINE — Module renderers
   Each module returns { body, actions, mount? }.
   SOPs and Meetings are functional shells with sample data.
   The rest are detailed placeholder shells with feature lists.
   ================================================================= */
'use strict';

window.SpineModules = (function(){

  /* =========== Sample data =========== */
  const SAMPLE_SOPS = [
    { code:'OPS-001', dept:'العمليات', title:'استلام وتسليم المناوبة اليومية', updated:'منذ يومين', status:'active', edits:14 },
    { code:'OPS-002', dept:'العمليات', title:'إغلاق الموقع آخر اليوم', updated:'منذ أسبوع', status:'active', edits:8 },
    { code:'PROC-014', dept:'المشتريات', title:'سير اعتماد طلبات الشراء فوق ٥٠٬٠٠٠ ر.س', updated:'أمس', status:'review', edits:22 },
    { code:'HR-007', dept:'الموارد البشرية', title:'إجراء التوظيف الكامل من الإعلان للعرض', updated:'منذ ٣ أيام', status:'active', edits:11 },
    { code:'FIN-021', dept:'المالية', title:'إقفال الشهر المحاسبي', updated:'منذ ٥ أيام', status:'active', edits:6 },
    { code:'PRJ-033', dept:'المشاريع', title:'بدء مشروع جديد — Stage Gate 0', updated:'منذ يوم', status:'active', edits:18 },
    { code:'EXEC-002', dept:'التنفيذية', title:'دورة التخطيط الاستراتيجي السنوية', updated:'منذ شهر', status:'active', edits:4 },
    { code:'BIZ-009', dept:'تطوير الأعمال', title:'قياس وتأهيل الفرص التجارية', updated:'منذ أسبوعين', status:'review', edits:9 },
  ];

  const SAMPLE_MEETINGS = [
    { day:'29', month:'APR', time:'10:00', title:'اجتماع المجلس التنفيذي — الربع الثاني', type:'مجلس', attendees:7, status:'upcoming' },
    { day:'29', month:'APR', time:'14:00', title:'مراجعة أداء قسم المشاريع — الأسبوعية', type:'مراجعة', attendees:5, status:'upcoming' },
    { day:'30', month:'APR', time:'09:30', title:'اجتماع تخطيط ميزانية Q3', type:'تخطيط', attendees:4, status:'upcoming' },
    { day:'01', month:'MAY', time:'11:00', title:'اجتماع موردين — العقد الإطاري', type:'خارجي', attendees:8, status:'upcoming' },
    { day:'28', month:'APR', time:'15:00', title:'فريق العمليات — التسليم اليومي', type:'تشغيلي', attendees:12, status:'past' },
    { day:'27', month:'APR', time:'10:00', title:'مراجعة سياسة الامتثال السنوية', type:'حوكمة', attendees:6, status:'past' },
  ];

  function tag(label, klass){ return `<span class="tag ${klass||''}">${label}</span>`; }

  /* =========== SOPs (live) =========== */
  function sops(){
    return {
      actions: `<button>استيراد</button><button>تصدير</button><button class="primary">+ إجراء جديد</button>`,
      body: `
        <div class="stat-row">
          <div class="stat"><div class="k">Total SOPs</div><div class="v">427</div><div class="delta up">+12 this month</div></div>
          <div class="stat"><div class="k">Departments</div><div class="v">7</div><div class="delta">across the org</div></div>
          <div class="stat"><div class="k">Pending Review</div><div class="v" style="color:var(--orange)">8</div><div class="delta">needs approval</div></div>
          <div class="stat"><div class="k">Last Edit</div><div class="v" style="font-size:18px">منذ ساعتين</div><div class="delta">PROC-014 by m.salem</div></div>
        </div>

        <div class="two-col-3">
          <div class="card">
            <div class="card-head"><h3>أحدث الإجراءات</h3><span class="meta mono">8 of 427</span></div>
            <table class="tbl">
              <thead><tr><th>الكود</th><th>العنوان</th><th>الإدارة</th><th>الحالة</th><th>آخر تحديث</th></tr></thead>
              <tbody>
                ${SAMPLE_SOPS.map(s => `
                  <tr>
                    <td><span class="mono" style="color:var(--accent);font-size:11px">${s.code}</span></td>
                    <td class="name">${s.title}</td>
                    <td>${s.dept}</td>
                    <td>${tag(s.status==='active'?'نشط':'مراجعة', s.status==='active'?'green':'orange')}</td>
                    <td><span class="mono">${s.updated}</span></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-head"><h3>التوزيع حسب الإدارة</h3></div>
            <div class="bars">
              ${[
                ['العمليات', 92], ['المشاريع', 78], ['المالية', 64],
                ['المشتريات', 58], ['الموارد البشرية', 51], ['التنفيذية', 48], ['تطوير الأعمال', 36]
              ].map(([n,v])=>`
                <div class="bar-r"><span class="lbl">${n}</span><div class="track"><div class="fill" style="width:${v}%"></div></div><span class="v">${v}</span></div>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="margin-top:24px">
          <div class="card">
            <div class="card-head"><h3>روابط سريعة</h3></div>
            <div style="padding:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
              <a href="dashboard.html" style="background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:14px;display:block">
                <div style="font-size:11px;letter-spacing:1px;color:var(--ink-3);text-transform:uppercase;font-family:var(--font-en)">منصّة SOPs الكاملة</div>
                <div style="font-size:13px;color:var(--ink);margin-top:6px;font-weight:500">افتح dashboard التفصيلي →</div>
              </a>
              <a href="dashboard.html?dept=operations" style="background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:14px;display:block">
                <div style="font-size:11px;letter-spacing:1px;color:var(--ink-3);text-transform:uppercase;font-family:var(--font-en)">إدارة العمليات</div>
                <div style="font-size:13px;color:var(--ink);margin-top:6px;font-weight:500">٩٢ إجراء →</div>
              </a>
              <a href="dashboard.html?dept=projects" style="background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:14px;display:block">
                <div style="font-size:11px;letter-spacing:1px;color:var(--ink-3);text-transform:uppercase;font-family:var(--font-en)">إدارة المشاريع</div>
                <div style="font-size:13px;color:var(--ink);margin-top:6px;font-weight:500">٧٨ إجراء →</div>
              </a>
            </div>
          </div>
        </div>
      `
    };
  }

  /* =========== Meetings (live) =========== */
  function meetings(){
    const upcoming = SAMPLE_MEETINGS.filter(m => m.status==='upcoming');
    const past = SAMPLE_MEETINGS.filter(m => m.status==='past');

    return {
      actions: `<button>التقويم</button><button>المحاضر</button><button class="primary">+ اجتماع جديد</button>`,
      body: `
        <div class="stat-row">
          <div class="stat"><div class="k">This Week</div><div class="v">12</div><div class="delta up">+3 vs last wk</div></div>
          <div class="stat"><div class="k">Decisions Made</div><div class="v">7</div><div class="delta">in last 30d</div></div>
          <div class="stat"><div class="k">Action Items</div><div class="v" style="color:var(--orange)">28</div><div class="delta">11 overdue</div></div>
          <div class="stat"><div class="k">Avg Duration</div><div class="v" style="font-size:22px">52<span style="font-size:13px;color:var(--ink-3)"> min</span></div><div class="delta down">↓ 8 min vs Q1</div></div>
        </div>

        <div class="two-col-3">
          <div class="card">
            <div class="card-head"><h3>الاجتماعات القادمة</h3><span class="meta mono">${upcoming.length} upcoming</span></div>
            <div>
              ${upcoming.map(m=>`
                <div class="item-row">
                  <div class="when">
                    <div class="day">${m.day}</div>
                    <div class="month">${m.month} · ${m.time}</div>
                  </div>
                  <div class="body">
                    <div class="ttl">${m.title}</div>
                    <div class="meta">${m.attendees} attendees · ${m.type}</div>
                  </div>
                  <div class="right">
                    ${tag(m.type, 'accent')}
                    <button style="background:var(--surface-3);color:var(--ink-2);border-radius:6px;padding:5px 10px;font-size:11px">انضم</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h3>المحاضر الأخيرة</h3></div>
            <div>
              ${past.map(m=>`
                <div class="item-row">
                  <div class="when">
                    <div class="day" style="color:var(--ink-3)">${m.day}</div>
                    <div class="month">${m.month}</div>
                  </div>
                  <div class="body">
                    <div class="ttl" style="font-size:12.5px">${m.title}</div>
                    <div class="meta">${m.attendees} حضروا · محضر مكتمل</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="margin-top:24px" class="two-col">
          <div class="card">
            <div class="card-head"><h3>قرارات اتُّخذت في آخر اجتماع</h3><span class="meta mono">3 decisions</span></div>
            <div style="padding:0">
              ${[
                ['DEC-104','اعتماد توسعة موقع الخبر — مرحلة أولى','accept'],
                ['DEC-105','تأجيل قرار الموردين الجدد للأسبوع القادم','defer'],
                ['DEC-106','الموافقة على ميزانية تدريب الموارد البشرية','accept'],
              ].map(([code,ttl,kind])=>`
                <div class="item-row">
                  <div class="when" style="width:60px"><span class="mono" style="color:var(--accent);font-size:11px">${code}</span></div>
                  <div class="body"><div class="ttl" style="font-size:12.5px">${ttl}</div></div>
                  <div class="right">${tag(kind==='accept'?'معتمد':'مؤجّل', kind==='accept'?'green':'orange')}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h3>مهام الإجراء (Action Items)</h3><span class="meta mono">11 overdue</span></div>
            <div>
              ${[
                ['تحديث وثيقة العقد الإطاري للمورد رقم ٣','m.salem','2d overdue','red'],
                ['إعداد تقرير المخاطر للمراجعة','a.fahad','due tomorrow','orange'],
                ['حجز قاعة اجتماع المجلس القادم','noor.k','done','green'],
                ['تواصل مع المراجع الخارجي','o.zaid','due in 3d','blue'],
              ].map(([t,who,when,k])=>`
                <div class="item-row">
                  <div class="body">
                    <div class="ttl" style="font-size:12.5px">${t}</div>
                    <div class="meta">${who}</div>
                  </div>
                  <div class="right">${tag(when, k)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `
    };
  }

  /* =========== Feature lists for placeholder shells =========== */
  const _features = {
    tasks: [
      'لوحة Kanban + List + Timeline',
      'مهام مرتبطة بالإجراءات والاجتماعات',
      'تتبّع الأداء حسب المسؤول',
      'تكامل مع التقويم والإشعارات',
      'مشاريع متعدّدة المراحل (Stage Gate)',
      'تقارير الإنجاز الأسبوعية تلقائياً'
    ],
    approvals: [
      'سير اعتمادات قابل للتخصيص (متسلسل/متوازي)',
      'حدود مالية لكل مستوى',
      'توقيع رقمي + تتبّع كامل',
      'ربط مع المالية والمشتريات',
      'تنبيهات للاعتمادات المعلّقة',
      'سجل تدقيق للقرار وأسبابه'
    ],
    decisions: [
      'سجل قرارات قابل للبحث',
      'ربط القرار بالاجتماع والإجراء',
      'تصنيف: استراتيجي / تشغيلي / مالي',
      'تتبّع نتائج كل قرار بعد التنفيذ',
      'مصفوفة RACI لكل قرار',
      'تقرير القرارات الربعي للمجلس'
    ],
    risks: [
      'سجل المخاطر بمصفوفة الأثر × الاحتمالية',
      'خطط الاستجابة (تجنّب/تخفيف/نقل/قبول)',
      'تصعيد آلي عند تجاوز العتبات',
      'ربط المخاطر بالإجراءات والمشاريع',
      'تحديثات دورية للحالة',
      'لوحة حرارية تنفيذية'
    ],
    kpis: [
      'مؤشرات تنفيذية حسب الإدارة',
      'بطاقات أداء قابلة للسحب والترتيب',
      'مقارنات Year-over-Year',
      'أهداف ربعية + تنبيه عند الانحراف',
      'تصدير PDF للمجلس',
      'تكامل مع المالية والعمليات'
    ],
    compliance: [
      'مكتبة سياسات والتزامات تنظيمية',
      'تدقيق ذاتي دوري + تقارير',
      'سجل المخالفات والإجراءات التصحيحية',
      'جدول مراجعات داخلية',
      'ملف الجاهزية للتدقيق الخارجي',
      'تنبيهات تحديث اللوائح'
    ],
    reports: [
      'مكتبة قوالب تقارير المجلس',
      'تجميع تلقائي من باقي الوحدات',
      'محرّر تقرير ربعي مع PDF احترافي',
      'مكتبة الرسوم البيانية',
      'إصدارات مع موافقات',
      'مشاركة مؤمّنة مع أعضاء المجلس'
    ],
    people: [
      'الهيكل التنظيمي التفاعلي',
      'الأدوار والصلاحيات (RBAC)',
      'بطاقات موظفين تفصيلية',
      'تتبّع الأداء والترقيات',
      'مهام التطوير والتدريب',
      'تكامل مع HR ونظام الرواتب'
    ],
    vault: [
      'مستودع وثائق آمن مع تشفير',
      'تصنيف ذكي + بحث كامل النص',
      'إدارة الإصدارات (Version Control)',
      'صلاحيات وصول دقيقة',
      'سجل تدقيق لكل تحميل/فتح',
      'تكامل مع SOPs والعقود'
    ],
    calendar: [
      'تقويم المراجعات الدورية',
      'مراجعات شهرية / ربعية / سنوية',
      'تذكيرات قبل الاستحقاق',
      'ربط بالاجتماعات والقرارات',
      'تقويم مشترك للمدراء',
      'تصدير iCal للأدوات الخارجية'
    ],
    budget: [
      'ميزانية سنوية مقسّمة على الإدارات',
      'تتبّع الإنفاق الفعلي vs المخطط',
      'تنبيهات عند تجاوز الحدود',
      'لوحة Burn Rate ربعية',
      'موافقات المصاريف فوق العتبة',
      'تكامل مع نظام المحاسبة'
    ],
    vendors: [
      'سجل موردين مع تقييم أداء',
      'مكتبة عقود مع تواريخ التجديد',
      'تنبيهات انتهاء العقود',
      'تتبّع الالتزام والتسليم',
      'مكتبة قوالب عقود قانونية',
      'ربط مع المشتريات والمالية'
    ]
  };

  /* =========== Tasks (LIVE — connected to Worker) =========== */
  function tasks(){
    const PRIORITIES = { low:'منخفض', normal:'عادي', high:'عالٍ', critical:'حرج' };
    const STATUSES = { open:'مفتوح', 'in-progress':'قيد التنفيذ', done:'مكتمل', cancelled:'ملغي' };

    return {
      actions: `
        <button id="taskFilterBtn">تصفية</button>
        <button id="taskRefreshBtn">تحديث</button>
        <button class="primary" id="taskNewBtn">+ مهمة جديدة</button>
      `,
      body: `
        <div class="stat-row">
          <div class="stat"><div class="k">Total Open</div><div class="v" id="ts-open">—</div><div class="delta" id="ts-open-d">across all</div></div>
          <div class="stat"><div class="k">In Progress</div><div class="v" id="ts-prog" style="color:var(--blue)">—</div><div class="delta">active work</div></div>
          <div class="stat"><div class="k">Overdue</div><div class="v" id="ts-over" style="color:var(--red)">—</div><div class="delta">need attention</div></div>
          <div class="stat"><div class="k">Done (7d)</div><div class="v" id="ts-done" style="color:var(--green)">—</div><div class="delta" id="ts-done-d">last week</div></div>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>قائمة المهام</h3>
            <div style="display:flex;gap:6px" id="ts-tabs">
              <button class="ts-tab active" data-f="all" style="background:var(--surface-3);color:var(--ink);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">الكل</button>
              <button class="ts-tab" data-f="open" style="background:transparent;color:var(--ink-3);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">Open</button>
              <button class="ts-tab" data-f="in-progress" style="background:transparent;color:var(--ink-3);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">In Progress</button>
              <button class="ts-tab" data-f="done" style="background:transparent;color:var(--ink-3);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">Done</button>
            </div>
          </div>
          <div id="ts-list">
            <div style="padding:40px;text-align:center;color:var(--ink-3);font-size:13px">جارٍ التحميل...</div>
          </div>
        </div>
      `,
      mount(){
        const API = window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
        const tok = () => localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token') || '';
        const esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        let allTasks = [], currentFilter = 'all';

        async function api(p, opts){
          opts = opts || {};
          const r = await fetch(API+p, {
            method: opts.method || 'GET',
            headers: {'Content-Type':'application/json','Authorization':'Bearer '+tok()},
            body: opts.body ? JSON.stringify(opts.body) : undefined
          });
          if (!r.ok) throw new Error(await r.text() || ('HTTP '+r.status));
          return r.json();
        }

        function fmtDue(ts){
          if (!ts) return '<span style="color:var(--ink-3)">—</span>';
          const d = ts - Date.now();
          const days = Math.ceil(d / 86400000);
          if (days < 0) return `<span style="color:var(--red)">متأخرة ${Math.abs(days)} يوم</span>`;
          if (days === 0) return `<span style="color:var(--orange)">اليوم</span>`;
          if (days <= 3) return `<span style="color:var(--orange)">${days} أيام</span>`;
          return `<span style="color:var(--ink-2)">${new Date(ts).toLocaleDateString('ar-SA',{day:'numeric',month:'short'})}</span>`;
        }

        function statusTag(s){
          const k = s==='done'?'green':s==='in-progress'?'blue':s==='cancelled'?'red':'orange';
          return `<span class="tag ${k}">${STATUSES[s]||s}</span>`;
        }
        function prioTag(p){
          const k = p==='critical'?'red':p==='high'?'orange':p==='low'?'':'accent';
          return `<span class="tag ${k}">${PRIORITIES[p]||p}</span>`;
        }

        function render(){
          const list = currentFilter==='all' ? allTasks : allTasks.filter(t => t.status === currentFilter);
          const el = document.getElementById('ts-list');
          if (!el) return;

          // Stats
          const open = allTasks.filter(t=>t.status==='open').length;
          const prog = allTasks.filter(t=>t.status==='in-progress').length;
          const over = allTasks.filter(t=>t.dueDate && t.dueDate < Date.now() && t.status!=='done' && t.status!=='cancelled').length;
          const wk = Date.now() - 7*86400000;
          const done = allTasks.filter(t=>t.status==='done' && (t.updatedAt||0) >= wk).length;
          const setIf = (id,v) => { const x = document.getElementById(id); if (x) x.textContent = v; };
          setIf('ts-open', open);
          setIf('ts-prog', prog);
          setIf('ts-over', over);
          setIf('ts-done', done);
          setIf('ts-open-d', `${allTasks.length} total`);

          if (!list.length){
            el.innerHTML = `<div style="padding:60px 20px;text-align:center;color:var(--ink-3);font-size:13px">لا توجد مهام في هذا الفلتر.<br/><button id="ts-empty-new" style="background:var(--accent);color:#1a1300;padding:8px 18px;border-radius:8px;margin-top:14px;font-weight:600">+ أنشئ أول مهمة</button></div>`;
            const btn = document.getElementById('ts-empty-new');
            if (btn) btn.onclick = openNewModal;
            return;
          }

          el.innerHTML = `<table class="tbl">
            <thead><tr><th>المهمة</th><th>المسؤول</th><th>الأولوية</th><th>الحالة</th><th>الاستحقاق</th><th></th></tr></thead>
            <tbody>${list.map(t=>`
              <tr data-id="${esc(t.id)}">
                <td class="name">${esc(t.title)}<div style="font-size:10px;color:var(--ink-3);font-family:var(--font-mono);margin-top:2px">${esc(t.dept||'—')}${t.sopRef?' · '+esc(t.sopRef):''}</div></td>
                <td><span style="font-size:11px;font-family:var(--font-en);color:var(--ink-2)">${esc((t.assignee||'').split('@')[0]||'—')}</span></td>
                <td>${prioTag(t.priority||'normal')}</td>
                <td>${statusTag(t.status||'open')}</td>
                <td>${fmtDue(t.dueDate)}</td>
                <td style="text-align:end">
                  <button class="ts-toggle" data-id="${esc(t.id)}" data-status="${esc(t.status)}" style="background:var(--surface-3);color:var(--ink-2);border-radius:5px;padding:4px 10px;font-size:11px;font-family:var(--font-en)">
                    ${t.status==='done'?'↻ فتح':t.status==='open'?'▶ ابدأ':t.status==='in-progress'?'✓ أنهِ':'—'}
                  </button>
                </td>
              </tr>`).join('')}</tbody></table>`;

          el.querySelectorAll('.ts-toggle').forEach(b => b.onclick = async (ev) => {
            ev.stopPropagation();
            const id = b.dataset.id, st = b.dataset.status;
            const next = st==='open'?'in-progress':st==='in-progress'?'done':st==='done'?'open':'open';
            try {
              await api('/api/tasks/'+id, { method:'PATCH', body:{status:next} });
              await load();
            } catch(e){ alert('فشل التحديث: '+e.message); }
          });
        }

        function openNewModal(){
          const bd = document.createElement('div');
          bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
          bd.innerHTML = `
            <div style="background:var(--surface);border:1px solid var(--line-2);border-radius:14px;padding:24px;max-width:480px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,.6)">
              <h3 style="font-size:16px;margin-bottom:6px;color:var(--ink)">+ مهمة جديدة</h3>
              <p style="font-size:12px;color:var(--ink-3);margin-bottom:18px">ستُسجَّل في الـ Worker وتظهر للمسؤول فوراً.</p>
              <label style="font-size:11px;color:var(--ink-3);text-transform:uppercase;font-family:var(--font-en);letter-spacing:1px;display:block;margin-bottom:5px">العنوان</label>
              <input id="nt-title" type="text" placeholder="مثال: مراجعة عقد المورد X" style="width:100%;padding:10px 12px;background:var(--bg-2);border:1px solid var(--line);border-radius:8px;color:var(--ink);font-family:inherit;font-size:13.5px;margin-bottom:12px"/>
              <label style="font-size:11px;color:var(--ink-3);text-transform:uppercase;font-family:var(--font-en);letter-spacing:1px;display:block;margin-bottom:5px">الإدارة</label>
              <input id="nt-dept" type="text" placeholder="operations / projects / hr ..." style="width:100%;padding:10px 12px;background:var(--bg-2);border:1px solid var(--line);border-radius:8px;color:var(--ink);font-family:var(--font-mono);font-size:12px;margin-bottom:12px;direction:ltr"/>
              <label style="font-size:11px;color:var(--ink-3);text-transform:uppercase;font-family:var(--font-en);letter-spacing:1px;display:block;margin-bottom:5px">المسؤول (إيميل)</label>
              <input id="nt-assignee" type="email" placeholder="m.salem@arsann.com" style="width:100%;padding:10px 12px;background:var(--bg-2);border:1px solid var(--line);border-radius:8px;color:var(--ink);font-family:var(--font-mono);font-size:12px;margin-bottom:12px;direction:ltr"/>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
                <div>
                  <label style="font-size:11px;color:var(--ink-3);text-transform:uppercase;font-family:var(--font-en);letter-spacing:1px;display:block;margin-bottom:5px">الأولوية</label>
                  <select id="nt-prio" style="width:100%;padding:10px 12px;background:var(--bg-2);border:1px solid var(--line);border-radius:8px;color:var(--ink);font-family:inherit;font-size:13px">
                    <option value="low">منخفض</option>
                    <option value="normal" selected>عادي</option>
                    <option value="high">عالٍ</option>
                    <option value="critical">حرج</option>
                  </select>
                </div>
                <div>
                  <label style="font-size:11px;color:var(--ink-3);text-transform:uppercase;font-family:var(--font-en);letter-spacing:1px;display:block;margin-bottom:5px">تاريخ الاستحقاق</label>
                  <input id="nt-due" type="date" style="width:100%;padding:10px 12px;background:var(--bg-2);border:1px solid var(--line);border-radius:8px;color:var(--ink);font-family:inherit;font-size:13px"/>
                </div>
              </div>
              <div id="nt-err" style="color:var(--red);font-size:12px;min-height:16px;margin-bottom:8px"></div>
              <div style="display:flex;gap:8px;justify-content:flex-end">
                <button id="nt-cancel" style="background:var(--surface-2);color:var(--ink-2);padding:9px 16px;border-radius:8px;font-size:13px">إلغاء</button>
                <button id="nt-save" style="background:var(--accent);color:#1a1300;padding:9px 18px;border-radius:8px;font-weight:600;font-size:13px">حفظ</button>
              </div>
            </div>`;
          document.body.appendChild(bd);
          bd.onclick = e => { if (e.target === bd) bd.remove(); };
          bd.querySelector('#nt-cancel').onclick = () => bd.remove();
          bd.querySelector('#nt-save').onclick = async () => {
            const title = bd.querySelector('#nt-title').value.trim();
            const dept = bd.querySelector('#nt-dept').value.trim();
            const assignee = bd.querySelector('#nt-assignee').value.trim();
            const priority = bd.querySelector('#nt-prio').value;
            const due = bd.querySelector('#nt-due').value;
            const err = bd.querySelector('#nt-err');
            if (!title){ err.textContent = 'العنوان مطلوب.'; return; }
            try {
              await api('/api/tasks', { method:'POST', body:{ title, dept:dept||null, assignee:assignee||null, priority, dueDate: due ? new Date(due).getTime() : null } });
              bd.remove();
              await load();
            } catch(e){ err.textContent = 'فشل الحفظ: '+e.message; }
          };
        }

        async function load(){
          try {
            const list = await api('/api/tasks');
            allTasks = Array.isArray(list) ? list : (list.tasks || []);
            render();
          } catch(e){
            const el = document.getElementById('ts-list');
            if (el) el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--red);font-size:13px">⚠️ ${e.message}<br/><span style="color:var(--ink-3);font-size:12px">تأكد من تسجيل الدخول</span></div>`;
          }
        }

        // wire actions
        const refresh = document.getElementById('taskRefreshBtn');
        if (refresh) refresh.onclick = load;
        const nb = document.getElementById('taskNewBtn');
        if (nb) nb.onclick = openNewModal;
        document.querySelectorAll('.ts-tab').forEach(b => b.onclick = () => {
          document.querySelectorAll('.ts-tab').forEach(x => {
            x.classList.remove('active');
            x.style.background = 'transparent';
            x.style.color = 'var(--ink-3)';
          });
          b.classList.add('active');
          b.style.background = 'var(--surface-3)';
          b.style.color = 'var(--ink)';
          currentFilter = b.dataset.f;
          render();
        });

        load();
      }
    };
  }

  /* =================================================================
     SHARED helpers for live KV-backed modules
     ================================================================= */
  const _API = () => window.API_BASE || 'https://arsan-api.a-king-6e1.workers.dev';
  const _tok = () => localStorage.getItem('arsan_token_v1') || localStorage.getItem('arsan_token') || '';
  const _esc = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function _kvGet(key){
    const r = await fetch(_API()+'/api/kv/'+encodeURIComponent(key), {
      headers: {'Authorization':'Bearer '+_tok()}
    });
    if (!r.ok) throw new Error('GET '+key+' → HTTP '+r.status);
    return r.json();
  }
  async function _kvPut(key, value){
    const r = await fetch(_API()+'/api/kv/'+encodeURIComponent(key), {
      method:'PUT',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+_tok()},
      body: JSON.stringify(value)
    });
    if (!r.ok) throw new Error('PUT '+key+' → HTTP '+r.status);
    return r.json();
  }

  function _toast(msg, kind){
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${kind==='err'?'rgba(224,100,100,0.95)':'rgba(79,180,119,0.95)'};color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;z-index:1000;box-shadow:0 8px 24px rgba(0,0,0,.4);font-family:var(--font-ar)`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(), 300); }, 2400);
  }

  function _fmtDate(ts){
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('ar-SA', {day:'numeric', month:'short', year:'numeric'});
  }
  function _fmtDT(ts){
    if (!ts) return '—';
    return new Date(ts).toLocaleString('ar-SA', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
  }
  function _uid(){ return Math.random().toString(36).slice(2,11) + Date.now().toString(36).slice(-4); }

  // Reusable input style
  const INP = `style="width:100%;padding:9px 11px;background:var(--bg-2);border:1px solid var(--line);border-radius:8px;color:var(--ink);font-family:inherit;font-size:13px"`;
  const LBL = `style="font-size:10.5px;color:var(--ink-3);text-transform:uppercase;font-family:var(--font-en);letter-spacing:1px;display:block;margin-bottom:5px;margin-top:11px"`;

  /* =========== Calendar (LIVE) =========== */
  function calendar(){
    return {
      actions: `
        <button id="calOauthBtn" style="background:var(--surface-2);border:1px solid var(--line-2);color:var(--ink-2);font-size:12px;display:inline-flex;align-items:center;gap:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          ربط Google Calendar
        </button>
        <button class="primary" id="calNewBtn">+ موعد جديد</button>
      `,
      body: `
        <div class="stat-row">
          <div class="stat"><div class="k">This Week</div><div class="v" id="cal-wk">—</div><div class="delta">events scheduled</div></div>
          <div class="stat"><div class="k">Today</div><div class="v" id="cal-td" style="color:var(--accent)">—</div><div class="delta">happening today</div></div>
          <div class="stat"><div class="k">Conflicts</div><div class="v" id="cal-conf" style="color:var(--orange)">—</div><div class="delta">overlapping events</div></div>
          <div class="stat"><div class="k">Sync Status</div><div class="v" id="cal-sync" style="font-size:14px;color:var(--ink-3)">غير مربوط</div><div class="delta" id="cal-sync-d">قابل للربط مع Google/MS</div></div>
        </div>

        <div class="two-col-3">
          <div class="card">
            <div class="card-head"><h3>الأحداث القادمة</h3><span class="meta mono" id="cal-count">—</span></div>
            <div id="cal-list" style="padding:8px"><div style="padding:30px;text-align:center;color:var(--ink-3);font-size:13px">جارٍ التحميل…</div></div>
          </div>
          <div class="card">
            <div class="card-head"><h3>الأسبوع</h3></div>
            <div id="cal-week" style="padding:14px;display:flex;flex-direction:column;gap:6px"></div>
          </div>
        </div>
      `,
      mount(){
        const KEY = 'calendar_events_v1';
        let events = [];   // platform events — persisted to KV
        let gevents = [];  // live Google events — never persisted (see save())
        let gstate = null; // null = unknown, 'ok' | 'not-connected' | 'error'

        async function load(){
          try {
            const data = await _kvGet(KEY);
            events = Array.isArray(data) ? data : [];
            render();
            updateOAuthStatus();
            loadGoogle();
          } catch(e){
            const el = document.getElementById('cal-list');
            if (el) el.innerHTML = `<div style="padding:30px;text-align:center;color:var(--red);font-size:13px">⚠️ ${e.message}</div>`;
          }
        }

        // Live Google events. Kept out of `events` so save() can never write
        // them into KV — they'd duplicate against the next fetch and go stale.
        async function loadGoogle(){
          try {
            const r = await fetch(_API()+'/api/gcal/events?days=7', {headers:{'Authorization':'Bearer '+_tok()}});
            if (r.status === 428){ gstate = 'not-connected'; gevents = []; render(); return; }
            if (!r.ok){ gstate = 'error'; gevents = []; render(); return; }
            const raw = await r.json();
            // Google sends all-day events as a bare date ("2026-07-17"), which
            // Date parses as UTC midnight — in Riyadh (+3) that would render as
            // 03:00. Parse those as local midnight instead.
            const toTs = (v) => {
              if (!v) return 0;
              const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
              return m ? new Date(+m[1], +m[2]-1, +m[3]).getTime() : new Date(v).getTime();
            };
            // The worker returns ISO strings for start/end and an array of
            // attendee emails; this module works in epoch ms with a count.
            gevents = (Array.isArray(raw) ? raw : []).map(e => ({
              id: e.id,
              title: e.title,
              location: e.location || '',
              start: toTs(e.start),
              end: toTs(e.end),
              kind: 'google',
              attendees: Array.isArray(e.attendees) ? e.attendees.length : 0,
              link: e.link || '',
              source: 'google'
            })).filter(e => e.start);
            gstate = 'ok';
            render();
          } catch(_){ gstate = 'error'; gevents = []; render(); }
        }

        // Local + Google, deduped by id (local wins).
        function allEvents(){
          const seen = new Set(events.map(e => e.id));
          return events.concat(gevents.filter(e => !seen.has(e.id)));
        }

        async function save(){
          await _kvPut(KEY, events);
        }

        async function updateOAuthStatus(){
          try {
            const r = await fetch(_API()+'/api/oauth/status', {headers:{'Authorization':'Bearer '+_tok()}});
            if (!r.ok) return;
            const st = await r.json();
            const el = document.getElementById('cal-sync');
            const dl = document.getElementById('cal-sync-d');
            const btn = document.getElementById('calOauthBtn');
            if (st.google && st.google.connected){
              if (el){ el.textContent = 'Google ✓'; el.style.color = 'var(--green)'; }
              if (dl) dl.textContent = (st.google.email||'').split('@')[0];
              if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Google مربوط';
            } else if (st.microsoft && st.microsoft.connected){
              if (el){ el.textContent = 'Microsoft ✓'; el.style.color = 'var(--green)'; }
            }
          } catch(_){}
        }

        function render(){
          const all = allEvents();
          const now = Date.now(), wkEnd = now + 7*86400000, dayEnd = now + 86400000;
          const upcoming = all.filter(e => (e.start||0) >= now - 3600000).sort((a,b)=>(a.start||0)-(b.start||0));
          const wkCount = all.filter(e => (e.start||0) >= now && (e.start||0) <= wkEnd).length;
          const tdCount = all.filter(e => {
            const s = e.start || 0;
            return s >= now - 3600000 && s <= dayEnd;
          }).length;
          // Conflicts: events that overlap
          let conflicts = 0;
          const sorted = [...all].sort((a,b)=>(a.start||0)-(b.start||0));
          for (let i=1; i<sorted.length; i++){
            if ((sorted[i].start||0) < ((sorted[i-1].end||sorted[i-1].start+3600000))) conflicts++;
          }
          const set = (id,v)=>{ const x = document.getElementById(id); if (x) x.textContent = v; };
          set('cal-wk', wkCount);
          set('cal-td', tdCount);
          set('cal-conf', conflicts);
          set('cal-count', upcoming.length + ' upcoming');

          const list = document.getElementById('cal-list');
          if (!upcoming.length){
            const gHint = gstate === 'not-connected'
              ? `<br/><span style="font-size:12px;color:var(--ink-3)">اربط Google لعرض أحداث تقويمك.</span>`
              : (gstate === 'error' ? `<br/><span style="font-size:12px;color:var(--orange)">تعذّر جلب أحداث Google.</span>` : '');
            list.innerHTML = `<div style="padding:50px 20px;text-align:center;color:var(--ink-3);font-size:13px">لا أحداث قادمة.${gHint}<br/><button id="cal-empty" style="background:var(--accent);color:#1a1300;padding:8px 18px;border-radius:8px;margin-top:14px;font-weight:600;font-size:12px">+ أنشئ أول حدث</button></div>`;
            const b = document.getElementById('cal-empty'); if (b) b.onclick = openNewModal;
          } else {
            list.innerHTML = upcoming.slice(0,12).map(e => {
              const d = new Date(e.start);
              const day = d.getDate();
              const mon = d.toLocaleString('en-US',{month:'short'}).toUpperCase();
              const time = d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
              const kindClr = {meeting:'accent', deadline:'red', review:'orange', sync:'blue', google:'blue', external:''}[e.kind||'meeting'] || 'accent';
              const isG = e.source === 'google';
              // Google events are read-only here: deleting would only drop them
              // until the next fetch. Link out to Google instead.
              const right = isG
                ? (e.link ? `<a href="${_esc(e.link)}" target="_blank" rel="noopener" style="color:var(--ink-3);padding:4px 8px;font-size:11px">↗</a>` : '')
                : `<button class="cal-del" data-id="${_esc(e.id)}" style="background:transparent;color:var(--ink-3);padding:4px 8px;font-size:11px">✕</button>`;
              return `
                <div class="item-row" data-id="${_esc(e.id)}">
                  <div class="when">
                    <div class="day">${day}</div>
                    <div class="month">${mon} · ${time}</div>
                  </div>
                  <div class="body">
                    <div class="ttl">${_esc(e.title)}</div>
                    <div class="meta">${_esc(e.location||'—')}${e.attendees?' · '+e.attendees+' حضور':''}</div>
                  </div>
                  <div class="right">
                    <span class="tag ${kindClr}">${isG ? 'Google' : _esc(e.kind||'meeting')}</span>
                    ${right}
                  </div>
                </div>`;
            }).join('');
            list.querySelectorAll('.cal-del').forEach(b => b.onclick = async () => {
              if (!confirm('حذف الحدث؟')) return;
              events = events.filter(e => e.id !== b.dataset.id);
              try { await save(); _toast('حُذف الحدث'); render(); }
              catch(e){ _toast('فشل: '+e.message,'err'); }
            });
          }

          // Mini week view
          const wk = document.getElementById('cal-week');
          if (wk){
            const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
            const startWk = new Date(); startWk.setHours(0,0,0,0);
            wk.innerHTML = '';
            for (let i=0; i<7; i++){
              const d0 = startWk.getTime() + i*86400000;
              const d1 = d0 + 86400000;
              const cnt = all.filter(e => (e.start||0) >= d0 && (e.start||0) < d1).length;
              const dt = new Date(d0);
              const isToday = i === 0;
              wk.innerHTML += `
                <div style="display:flex;align-items:center;gap:10px;padding:7px 9px;background:${isToday?'var(--accent-soft)':'transparent'};border:1px solid ${isToday?'var(--accent-line)':'var(--line)'};border-radius:7px">
                  <div style="font-size:11px;color:var(--ink-3);width:60px">${days[dt.getDay()]}</div>
                  <div class="mono" style="font-size:11px;color:var(--ink-2);width:50px">${dt.getDate()} ${dt.toLocaleString('en-US',{month:'short'})}</div>
                  <div style="margin-inline-start:auto;font-size:11px;color:${cnt?'var(--accent)':'var(--ink-3)'};font-family:var(--font-mono)">${cnt} ev</div>
                </div>`;
            }
          }
        }

        function openNewModal(){
          const bd = document.createElement('div');
          bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
          bd.innerHTML = `
            <div style="background:var(--surface);border:1px solid var(--line-2);border-radius:14px;padding:22px;max-width:460px;width:100%">
              <h3 style="font-size:16px;margin-bottom:4px">+ موعد جديد</h3>
              <p style="font-size:11.5px;color:var(--ink-3);margin-bottom:6px">يُحفَظ في الـ Worker لكل المستخدمين.</p>
              <label ${LBL}>العنوان</label>
              <input id="ce-title" type="text" placeholder="اجتماع المراجعة الأسبوعية" ${INP}/>
              <label ${LBL}>الموقع / الرابط</label>
              <input id="ce-loc" type="text" placeholder="قاعة ١ أو رابط Zoom" ${INP}/>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                  <label ${LBL}>التاريخ والوقت</label>
                  <input id="ce-start" type="datetime-local" ${INP}/>
                </div>
                <div>
                  <label ${LBL}>المدة (دقيقة)</label>
                  <input id="ce-dur" type="number" value="60" min="15" step="15" ${INP}/>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                  <label ${LBL}>النوع</label>
                  <select id="ce-kind" ${INP}>
                    <option value="meeting">اجتماع</option>
                    <option value="deadline">موعد نهائي</option>
                    <option value="review">مراجعة</option>
                    <option value="sync">تنسيق</option>
                    <option value="external">خارجي</option>
                  </select>
                </div>
                <div>
                  <label ${LBL}>عدد الحضور</label>
                  <input id="ce-att" type="number" value="3" min="1" ${INP}/>
                </div>
              </div>
              <div id="ce-err" style="color:var(--red);font-size:12px;min-height:16px;margin:10px 0"></div>
              <div style="display:flex;gap:8px;justify-content:flex-end">
                <button id="ce-cancel" style="background:var(--surface-2);color:var(--ink-2);padding:9px 16px;border-radius:8px;font-size:13px">إلغاء</button>
                <button id="ce-save" style="background:var(--accent);color:#1a1300;padding:9px 18px;border-radius:8px;font-weight:600;font-size:13px">حفظ</button>
              </div>
            </div>`;
          document.body.appendChild(bd);
          bd.onclick = e => { if (e.target === bd) bd.remove(); };
          bd.querySelector('#ce-cancel').onclick = () => bd.remove();
          bd.querySelector('#ce-save').onclick = async () => {
            const title = bd.querySelector('#ce-title').value.trim();
            const start = bd.querySelector('#ce-start').value;
            const dur = parseInt(bd.querySelector('#ce-dur').value)||60;
            const err = bd.querySelector('#ce-err');
            if (!title){ err.textContent = 'العنوان مطلوب.'; return; }
            if (!start){ err.textContent = 'التاريخ والوقت مطلوبان.'; return; }
            const sTs = new Date(start).getTime();
            events.push({
              id: _uid(),
              title,
              location: bd.querySelector('#ce-loc').value.trim(),
              start: sTs,
              end: sTs + dur*60000,
              kind: bd.querySelector('#ce-kind').value,
              attendees: parseInt(bd.querySelector('#ce-att').value)||0,
              createdAt: Date.now(),
              createdBy: (JSON.parse(localStorage.getItem('arsan_me_v1')||'{}').email)||''
            });
            try { await save(); bd.remove(); _toast('أُضيف الحدث'); render(); }
            catch(e){ err.textContent = 'فشل: '+e.message; }
          };
        }

        // OAuth button
        const oauthBtn = document.getElementById('calOauthBtn');
        if (oauthBtn) oauthBtn.onclick = async () => {
          try {
            const r = await fetch(_API()+'/api/oauth/google/start', {headers:{'Authorization':'Bearer '+_tok()}});
            const d = await r.json();
            if (!r.ok){
              if (d.error === 'not-configured'){
                _toast('OAuth غير مفعّل في الـ Worker — راجع SETUP.md','err');
              } else { _toast(d.error||'فشل','err'); }
              return;
            }
            window.open(d.authUrl, 'oauth', 'width=520,height=640');
            window.addEventListener('message', function handler(ev){
              if (ev.data && ev.data.type === 'oauth-success'){
                window.removeEventListener('message', handler);
                _toast('تم الربط ✓');
                updateOAuthStatus();
                loadGoogle();
              }
            });
          } catch(e){ _toast('فشل: '+e.message,'err'); }
        };

        const newBtn = document.getElementById('calNewBtn');
        if (newBtn) newBtn.onclick = openNewModal;

        load();
      }
    };
  }

  /* =========== Mail (LIVE — drafts + outbox) =========== */
  function mail(){
    return {
      actions: `
        <button id="mailOauthBtn" style="background:var(--surface-2);border:1px solid var(--line-2);color:var(--ink-2);font-size:12px">ربط Gmail</button>
        <button class="primary" id="mailComposeBtn">✏️ تأليف</button>
      `,
      body: `
        <div class="stat-row">
          <div class="stat"><div class="k">Drafts</div><div class="v" id="ml-draft">—</div><div class="delta">قيد التحرير</div></div>
          <div class="stat"><div class="k">Sent (today)</div><div class="v" id="ml-sent" style="color:var(--green)">—</div><div class="delta">تم إرسالها</div></div>
          <div class="stat"><div class="k">Templates</div><div class="v" id="ml-tpl">4</div><div class="delta">قوالب جاهزة</div></div>
          <div class="stat"><div class="k">Sync</div><div class="v" id="ml-sync" style="font-size:14px;color:var(--ink-3)">غير مربوط</div><div class="delta">Gmail / Outlook</div></div>
        </div>

        <div class="two-col-3">
          <div class="card">
            <div class="card-head"><h3>المسودّات</h3><span class="meta mono" id="ml-count">—</span></div>
            <div id="ml-list" style="padding:8px"><div style="padding:30px;text-align:center;color:var(--ink-3)">جارٍ التحميل…</div></div>
          </div>
          <div class="card">
            <div class="card-head"><h3>قوالب جاهزة</h3></div>
            <div style="padding:14px;display:flex;flex-direction:column;gap:8px">
              ${[
                ['تأكيد اجتماع','meeting-confirm'],
                ['اعتذار عن موعد','meeting-decline'],
                ['طلب موافقة','approval-request'],
                ['متابعة مهمة','task-followup']
              ].map(([t,id])=>`
                <button class="ml-tpl" data-id="${id}" data-title="${_esc(t)}" style="text-align:start;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:12.5px;color:var(--ink-2)">
                  <div style="font-weight:500;color:var(--ink)">${_esc(t)}</div>
                  <div style="font-size:10.5px;color:var(--ink-3);font-family:var(--font-mono);margin-top:2px">${_esc(id)}</div>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `,
      mount(){
        const KEY = 'mail_drafts_v1';
        let drafts = [];

        async function load(){
          try {
            const data = await _kvGet(KEY);
            drafts = Array.isArray(data) ? data : [];
            render();
            updateOAuthStatus();
          } catch(e){
            document.getElementById('ml-list').innerHTML = `<div style="padding:30px;text-align:center;color:var(--red);font-size:13px">⚠️ ${e.message}</div>`;
          }
        }
        async function save(){ await _kvPut(KEY, drafts); }

        async function updateOAuthStatus(){
          try {
            const r = await fetch(_API()+'/api/oauth/status', {headers:{'Authorization':'Bearer '+_tok()}});
            if (!r.ok) return;
            const st = await r.json();
            const el = document.getElementById('ml-sync');
            const btn = document.getElementById('mailOauthBtn');
            if (st.google && st.google.connected){
              if (el){ el.textContent = 'Gmail ✓'; el.style.color = 'var(--green)'; }
              if (btn) btn.textContent = 'Gmail مربوط ✓';
            }
          } catch(_){}
        }

        function render(){
          const today = new Date(); today.setHours(0,0,0,0);
          const sent = drafts.filter(d => d.status === 'sent' && (d.sentAt||0) >= today.getTime()).length;
          const dr = drafts.filter(d => d.status !== 'sent');
          const set = (id,v)=>{ const x = document.getElementById(id); if(x) x.textContent = v; };
          set('ml-draft', dr.length);
          set('ml-sent', sent);
          set('ml-count', dr.length+' مسوّدة');
          const list = document.getElementById('ml-list');
          if (!dr.length){
            list.innerHTML = `<div style="padding:50px 20px;text-align:center;color:var(--ink-3);font-size:13px">لا مسودّات.<br/><button id="ml-empty" style="background:var(--accent);color:#1a1300;padding:8px 18px;border-radius:8px;margin-top:14px;font-weight:600;font-size:12px">✏️ ابدأ مسوّدة</button></div>`;
            const b = document.getElementById('ml-empty'); if (b) b.onclick = openCompose;
            return;
          }
          list.innerHTML = dr.slice(0,15).map(d => `
            <div class="item-row" data-id="${_esc(d.id)}">
              <div class="body" style="cursor:pointer" data-edit="${_esc(d.id)}">
                <div class="ttl">${_esc(d.subject||'(بدون عنوان)')}</div>
                <div class="meta">إلى: ${_esc(d.to||'—')} · ${_fmtDT(d.updatedAt||d.createdAt)}</div>
              </div>
              <div class="right">
                <button class="ml-send" data-id="${_esc(d.id)}" style="background:var(--accent);color:#1a1300;padding:5px 11px;border-radius:6px;font-size:11px;font-weight:600">إرسال</button>
                <button class="ml-del" data-id="${_esc(d.id)}" style="background:transparent;color:var(--ink-3);padding:4px 8px;font-size:11px">✕</button>
              </div>
            </div>
          `).join('');

          list.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => {
            const d = drafts.find(x => x.id === el.dataset.edit);
            if (d) openCompose(d);
          });
          list.querySelectorAll('.ml-del').forEach(b => b.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm('حذف المسوّدة؟')) return;
            drafts = drafts.filter(d => d.id !== b.dataset.id);
            await save(); _toast('حُذفت'); render();
          });
          list.querySelectorAll('.ml-send').forEach(b => b.onclick = async (e) => {
            e.stopPropagation();
            const d = drafts.find(x => x.id === b.dataset.id);
            if (!d) return;
            // For now: mark as sent locally (real send needs OAuth + Gmail API call)
            d.status = 'sent';
            d.sentAt = Date.now();
            try { await save(); _toast('أُرسل (محلياً) — للإرسال الحقيقي اربط Gmail'); render(); }
            catch(err){ _toast('فشل: '+err.message,'err'); }
          });
        }

        function openCompose(existing){
          const d = existing || { id: _uid(), to:'', cc:'', subject:'', body:'', createdAt:Date.now() };
          const bd = document.createElement('div');
          bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
          bd.innerHTML = `
            <div style="background:var(--surface);border:1px solid var(--line-2);border-radius:14px;padding:22px;max-width:560px;width:100%;max-height:90vh;overflow:auto">
              <h3 style="font-size:16px;margin-bottom:14px">${existing?'✏️ تحرير مسوّدة':'✏️ مسوّدة جديدة'}</h3>
              <label ${LBL}>إلى</label>
              <input id="m-to" type="email" placeholder="recipient@arsann.com" value="${_esc(d.to)}" ${INP} style="${INP.replace('style="','')} direction:ltr;font-family:var(--font-mono);font-size:12px"/>
              <label ${LBL}>نسخة (Cc)</label>
              <input id="m-cc" type="text" placeholder="فرعي" value="${_esc(d.cc||'')}" ${INP} style="${INP.replace('style="','')} direction:ltr;font-family:var(--font-mono);font-size:12px"/>
              <label ${LBL}>الموضوع</label>
              <input id="m-sub" type="text" value="${_esc(d.subject||'')}" ${INP}/>
              <label ${LBL}>الرسالة</label>
              <textarea id="m-body" rows="9" ${INP} style="${INP.replace('style="','')} resize:vertical;font-family:inherit">${_esc(d.body||'')}</textarea>
              <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
                <button id="m-cancel" style="background:var(--surface-2);color:var(--ink-2);padding:9px 16px;border-radius:8px;font-size:13px">إلغاء</button>
                <button id="m-save" style="background:var(--accent);color:#1a1300;padding:9px 18px;border-radius:8px;font-weight:600;font-size:13px">حفظ مسوّدة</button>
              </div>
            </div>`;
          document.body.appendChild(bd);
          bd.onclick = e => { if (e.target === bd) bd.remove(); };
          bd.querySelector('#m-cancel').onclick = () => bd.remove();
          bd.querySelector('#m-save').onclick = async () => {
            d.to = bd.querySelector('#m-to').value.trim();
            d.cc = bd.querySelector('#m-cc').value.trim();
            d.subject = bd.querySelector('#m-sub').value.trim();
            d.body = bd.querySelector('#m-body').value;
            d.updatedAt = Date.now();
            d.status = 'draft';
            const idx = drafts.findIndex(x => x.id === d.id);
            if (idx >= 0) drafts[idx] = d; else drafts.unshift(d);
            try { await save(); bd.remove(); _toast('حُفظت المسوّدة'); render(); }
            catch(e){ _toast('فشل: '+e.message,'err'); }
          };
        }

        // Templates
        document.querySelectorAll('.ml-tpl').forEach(b => b.onclick = () => {
          const TPL = {
            'meeting-confirm': { subject:'تأكيد الاجتماع', body:'مرحباً،\n\nأؤكّد حضوري الاجتماع المحدّد بإذن الله.\n\nمع التحية،' },
            'meeting-decline': { subject:'اعتذار عن الاجتماع', body:'مرحباً،\n\nأعتذر عن عدم استطاعتي حضور الاجتماع. هل يمكن إعادة الجدولة؟\n\nمع التحية،' },
            'approval-request': { subject:'طلب موافقة', body:'مرحباً،\n\nأرغب في طلب موافقتكم على [...].\n\nشكراً،' },
            'task-followup': { subject:'متابعة', body:'مرحباً،\n\nمتابعةً لطلبي السابق بخصوص [...].\n\nشكراً،' },
          }[b.dataset.id];
          if (!TPL) return;
          openCompose({ id:_uid(), to:'', subject:TPL.subject, body:TPL.body, createdAt:Date.now() });
        });

        document.getElementById('mailComposeBtn').onclick = () => openCompose();

        const oauthBtn = document.getElementById('mailOauthBtn');
        if (oauthBtn) oauthBtn.onclick = async () => {
          try {
            const r = await fetch(_API()+'/api/oauth/google/start', {headers:{'Authorization':'Bearer '+_tok()}});
            const dt = await r.json();
            if (!r.ok){ _toast(dt.message||dt.error||'فشل','err'); return; }
            window.open(dt.authUrl, 'oauth', 'width=520,height=640');
          } catch(e){ _toast(e.message,'err'); }
        };

        load();
      }
    };
  }

  /* =========== CRM (LIVE — clients + pipeline) =========== */
  function crm(){
    return {
      actions: `
        <button id="crmStagesBtn" style="background:var(--surface-2);border:1px solid var(--line-2);color:var(--ink-2);font-size:12px">عرض الـ Pipeline</button>
        <button class="primary" id="crmNewBtn">+ عميل جديد</button>
      `,
      body: `
        <div class="stat-row">
          <div class="stat"><div class="k">Active Clients</div><div class="v" id="cr-active">—</div><div class="delta" id="cr-active-d">in pipeline</div></div>
          <div class="stat"><div class="k">Pipeline Value</div><div class="v" id="cr-val" style="color:var(--accent);font-size:22px">—</div><div class="delta">SAR estimated</div></div>
          <div class="stat"><div class="k">Won (30d)</div><div class="v" id="cr-won" style="color:var(--green)">—</div><div class="delta">closed deals</div></div>
          <div class="stat"><div class="k">At Risk</div><div class="v" id="cr-risk" style="color:var(--red)">—</div><div class="delta">need follow-up</div></div>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>قائمة العملاء</h3>
            <div style="display:flex;gap:6px" id="cr-tabs">
              <button class="cr-tab active" data-f="all" style="background:var(--surface-3);color:var(--ink);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">الكل</button>
              <button class="cr-tab" data-f="lead" style="background:transparent;color:var(--ink-3);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">Lead</button>
              <button class="cr-tab" data-f="qualified" style="background:transparent;color:var(--ink-3);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">Qualified</button>
              <button class="cr-tab" data-f="proposal" style="background:transparent;color:var(--ink-3);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">Proposal</button>
              <button class="cr-tab" data-f="won" style="background:transparent;color:var(--ink-3);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">Won</button>
              <button class="cr-tab" data-f="lost" style="background:transparent;color:var(--ink-3);border-radius:6px;padding:5px 12px;font-size:11px;font-family:var(--font-en)">Lost</button>
            </div>
          </div>
          <div id="cr-list"><div style="padding:40px;text-align:center;color:var(--ink-3)">جارٍ التحميل…</div></div>
        </div>
      `,
      mount(){
        const KEY = 'crm_clients_v1';
        const STAGES = { lead:'محتمل', qualified:'مؤهَّل', proposal:'عرض', negotiation:'تفاوض', won:'فُزنا', lost:'خسرناها' };
        const STG_CLR = { lead:'', qualified:'blue', proposal:'accent', negotiation:'orange', won:'green', lost:'red' };
        let clients = [], filter = 'all';

        async function load(){
          try {
            const data = await _kvGet(KEY);
            clients = Array.isArray(data) ? data : [];
            render();
          } catch(e){
            document.getElementById('cr-list').innerHTML = `<div style="padding:30px;text-align:center;color:var(--red);font-size:13px">⚠️ ${e.message}</div>`;
          }
        }
        async function save(){ await _kvPut(KEY, clients); }

        function fmtMoney(n){
          if (!n) return '—';
          if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
          if (n >= 1000) return (n/1000).toFixed(0)+'K';
          return String(n);
        }

        function render(){
          const set = (id,v)=>{ const x = document.getElementById(id); if(x) x.textContent = v; };
          const active = clients.filter(c => !['won','lost'].includes(c.stage));
          const totalVal = active.reduce((s,c)=>s+(parseFloat(c.value)||0),0);
          const won30 = clients.filter(c => c.stage==='won' && (c.updatedAt||0) >= Date.now()-30*86400000).length;
          const risk = clients.filter(c => c.lastContact && (Date.now()-c.lastContact) > 14*86400000 && !['won','lost'].includes(c.stage)).length;
          set('cr-active', active.length);
          set('cr-active-d', clients.length+' total');
          set('cr-val', fmtMoney(totalVal));
          set('cr-won', won30);
          set('cr-risk', risk);

          const list = filter==='all' ? clients : clients.filter(c => c.stage === filter);
          const el = document.getElementById('cr-list');
          if (!list.length){
            el.innerHTML = `<div style="padding:60px 20px;text-align:center;color:var(--ink-3);font-size:13px">لا عملاء في هذا الفلتر.<br/><button id="cr-empty" style="background:var(--accent);color:#1a1300;padding:8px 18px;border-radius:8px;margin-top:14px;font-weight:600;font-size:12px">+ أضف عميل</button></div>`;
            const b = document.getElementById('cr-empty'); if(b) b.onclick = ()=>openModal();
            return;
          }
          el.innerHTML = `<table class="tbl">
            <thead><tr><th>العميل</th><th>القطاع</th><th>المرحلة</th><th>القيمة</th><th>آخر تواصل</th><th></th></tr></thead>
            <tbody>${list.map(c=>`
              <tr>
                <td class="name"><div>${_esc(c.name)}</div><div style="font-size:10.5px;color:var(--ink-3);font-family:var(--font-mono);margin-top:2px">${_esc(c.contact||'—')}</div></td>
                <td><span style="font-size:11.5px;color:var(--ink-2)">${_esc(c.industry||'—')}</span></td>
                <td><span class="tag ${STG_CLR[c.stage]||''}">${STAGES[c.stage]||c.stage}</span></td>
                <td><span class="mono" style="color:var(--accent);font-size:12px">${fmtMoney(parseFloat(c.value)||0)} ر.س</span></td>
                <td><span style="font-size:11px;color:var(--ink-2)">${_fmtDate(c.lastContact)}</span></td>
                <td style="text-align:end">
                  <button class="cr-edit" data-id="${_esc(c.id)}" style="background:var(--surface-3);color:var(--ink-2);padding:4px 9px;border-radius:5px;font-size:11px">تحرير</button>
                  <button class="cr-del" data-id="${_esc(c.id)}" style="background:transparent;color:var(--ink-3);padding:4px 8px;font-size:11px">✕</button>
                </td>
              </tr>`).join('')}</tbody></table>`;

          el.querySelectorAll('.cr-edit').forEach(b => b.onclick = () => {
            const c = clients.find(x => x.id === b.dataset.id);
            if (c) openModal(c);
          });
          el.querySelectorAll('.cr-del').forEach(b => b.onclick = async () => {
            if (!confirm('حذف العميل؟')) return;
            clients = clients.filter(c => c.id !== b.dataset.id);
            await save(); _toast('حُذف'); render();
          });
        }

        function openModal(existing){
          const c = existing || { id:_uid(), name:'', contact:'', industry:'', stage:'lead', value:0, notes:'', lastContact:Date.now(), createdAt:Date.now() };
          const bd = document.createElement('div');
          bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
          bd.innerHTML = `
            <div style="background:var(--surface);border:1px solid var(--line-2);border-radius:14px;padding:22px;max-width:480px;width:100%;max-height:90vh;overflow:auto">
              <h3 style="font-size:16px;margin-bottom:12px">${existing?'تحرير عميل':'+ عميل جديد'}</h3>
              <label ${LBL}>اسم العميل / الشركة</label>
              <input id="cl-name" type="text" value="${_esc(c.name)}" ${INP}/>
              <label ${LBL}>جهة الاتصال (إيميل/هاتف)</label>
              <input id="cl-contact" type="text" value="${_esc(c.contact)}" ${INP}/>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                  <label ${LBL}>القطاع</label>
                  <input id="cl-ind" type="text" value="${_esc(c.industry)}" placeholder="عقاري / صحة / …" ${INP}/>
                </div>
                <div>
                  <label ${LBL}>المرحلة</label>
                  <select id="cl-stage" ${INP}>
                    ${Object.entries(STAGES).map(([k,v])=>`<option value="${k}" ${c.stage===k?'selected':''}>${v}</option>`).join('')}
                  </select>
                </div>
              </div>
              <label ${LBL}>قيمة الفرصة (ر.س)</label>
              <input id="cl-value" type="number" value="${c.value||0}" min="0" step="1000" ${INP}/>
              <label ${LBL}>ملاحظات</label>
              <textarea id="cl-notes" rows="3" ${INP} style="${INP.replace('style="','')} resize:vertical">${_esc(c.notes||'')}</textarea>
              <div id="cl-err" style="color:var(--red);font-size:12px;min-height:16px;margin:10px 0"></div>
              <div style="display:flex;gap:8px;justify-content:flex-end">
                <button id="cl-cancel" style="background:var(--surface-2);color:var(--ink-2);padding:9px 16px;border-radius:8px;font-size:13px">إلغاء</button>
                <button id="cl-save" style="background:var(--accent);color:#1a1300;padding:9px 18px;border-radius:8px;font-weight:600;font-size:13px">حفظ</button>
              </div>
            </div>`;
          document.body.appendChild(bd);
          bd.onclick = e => { if (e.target === bd) bd.remove(); };
          bd.querySelector('#cl-cancel').onclick = () => bd.remove();
          bd.querySelector('#cl-save').onclick = async () => {
            const name = bd.querySelector('#cl-name').value.trim();
            const err = bd.querySelector('#cl-err');
            if (!name){ err.textContent = 'اسم العميل مطلوب.'; return; }
            c.name = name;
            c.contact = bd.querySelector('#cl-contact').value.trim();
            c.industry = bd.querySelector('#cl-ind').value.trim();
            c.stage = bd.querySelector('#cl-stage').value;
            c.value = parseFloat(bd.querySelector('#cl-value').value) || 0;
            c.notes = bd.querySelector('#cl-notes').value;
            c.updatedAt = Date.now();
            c.lastContact = Date.now();
            const idx = clients.findIndex(x => x.id === c.id);
            if (idx >= 0) clients[idx] = c; else clients.unshift(c);
            try { await save(); bd.remove(); _toast(existing?'حُدّث':'أُضيف'); render(); }
            catch(e){ err.textContent = 'فشل: '+e.message; }
          };
        }

        document.getElementById('crmNewBtn').onclick = () => openModal();
        document.querySelectorAll('.cr-tab').forEach(b => b.onclick = () => {
          document.querySelectorAll('.cr-tab').forEach(x => {
            x.classList.remove('active');
            x.style.background = 'transparent'; x.style.color = 'var(--ink-3)';
          });
          b.classList.add('active');
          b.style.background = 'var(--surface-3)'; b.style.color = 'var(--ink)';
          filter = b.dataset.f;
          render();
        });

        load();
      }
    };
  }

  return {
    sops, meetings, tasks,
    calendar, mail, crm,
    _features
  };
})();

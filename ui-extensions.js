/* ================================================================
   Arsan UI Extensions
   - Auth modal
   - Admin panel (activity log, users, slack webhook)
   - Team chat
   - Dependencies editor
   - Unified cross-department map
   - Inline SOP editing
   يعتمد على window.ArsanAPI و window.DEPARTMENTS_CONFIG
   ================================================================ */

(function(){
  const API = window.ArsanAPI;
  if (!API) { console.error("[Arsan UI] ArsanAPI not loaded"); return; }

  // ================= STYLE =================
  const css = `
    .arsan-topbar-btn{
      display:inline-flex;align-items:center;gap:6px;padding:7px 12px;
      border:1px solid var(--line);border-radius:8px;background:var(--bg-1);
      color:var(--ink-1);font:inherit;font-size:13px;cursor:pointer;transition:all .15s;
    }
    .arsan-topbar-btn:hover{background:var(--bg-2);border-color:var(--brand)}
    .arsan-topbar-btn.primary{background:var(--brand);color:#fff;border-color:var(--brand)}
    .arsan-topbar-btn.primary:hover{filter:brightness(1.1)}
    .arsan-topbar-btn .dot{width:7px;height:7px;border-radius:50%;background:#3a8f66;display:inline-block}
    .arsan-topbar-btn .dot.offline{background:#aaa}

    /* Modal base */
    .arsan-modal-backdrop{
      position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);
      display:none;align-items:center;justify-content:center;z-index:1000;padding:16px;
    }
    .arsan-modal-backdrop.open{display:flex}
    .arsan-modal{
      background:var(--bg-0);border:1px solid var(--line);border-radius:14px;
      width:100%;max-width:520px;max-height:90vh;overflow:auto;
      box-shadow:0 20px 60px rgba(0,0,0,.35);padding:24px;
    }
    .arsan-modal.wide{max-width:920px}
    .arsan-modal h2{margin:0 0 4px;font-size:20px}
    .arsan-modal .sub{color:var(--ink-3);font-size:13px;margin-bottom:20px}
    .arsan-field{margin-bottom:14px}
    .arsan-field label{display:block;font-size:13px;margin-bottom:4px;color:var(--ink-2)}
    .arsan-field input,.arsan-field textarea,.arsan-field select{
      width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;
      background:var(--bg-1);color:var(--ink-1);font:inherit;
    }
    .arsan-field input:focus,.arsan-field textarea:focus{outline:2px solid var(--brand);border-color:transparent}
    .arsan-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
    .arsan-btn{padding:9px 16px;border:1px solid var(--line);background:var(--bg-1);border-radius:8px;cursor:pointer;font:inherit;color:var(--ink-1)}
    .arsan-btn.primary{background:var(--brand);color:#fff;border-color:var(--brand)}
    .arsan-btn.danger{background:#b85450;color:#fff;border-color:#b85450}
    .arsan-btn:hover{filter:brightness(1.08)}
    .arsan-err{color:#b85450;font-size:13px;margin-top:8px;min-height:18px}

    /* Tabs */
    .arsan-tabs{display:flex;gap:2px;border-bottom:1px solid var(--line);margin-bottom:16px}
    .arsan-tab{padding:10px 14px;cursor:pointer;border:none;background:none;color:var(--ink-2);font:inherit;border-bottom:2px solid transparent}
    .arsan-tab.active{color:var(--brand);border-bottom-color:var(--brand);font-weight:600}
    .arsan-pane{display:none}
    .arsan-pane.active{display:block}

    /* Activity log */
    .arsan-log{max-height:60vh;overflow:auto;border:1px solid var(--line);border-radius:8px}
    .arsan-log-row{padding:10px 12px;border-bottom:1px solid var(--line);font-size:13px;display:grid;grid-template-columns:140px 1fr;gap:10px}
    .arsan-log-row:last-child{border:none}
    .arsan-log-time{color:var(--ink-3);font-variant-numeric:tabular-nums;font-size:12px}
    .arsan-log-actor{font-weight:600}
    .arsan-log-action{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;background:var(--bg-2);margin-inline-end:6px}

    /* Chat */
    .arsan-chat-panel{
      position:fixed;bottom:20px;left:20px;width:340px;height:480px;
      background:var(--bg-0);border:1px solid var(--line);border-radius:14px;
      box-shadow:0 12px 40px rgba(0,0,0,.3);display:none;flex-direction:column;z-index:900;
    }
    [dir="ltr"] .arsan-chat-panel{left:auto;right:20px}
    .arsan-chat-panel.open{display:flex}
    .arsan-chat-head{padding:12px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px}
    .arsan-chat-head select{flex:1;padding:5px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg-1);color:var(--ink-1);font:inherit;font-size:13px}
    .arsan-chat-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
    .arsan-msg{padding:8px 10px;border-radius:10px;background:var(--bg-2);font-size:13px;line-height:1.5;max-width:90%;align-self:flex-start}
    .arsan-msg.mine{align-self:flex-end;background:var(--brand);color:#fff}
    .arsan-msg .author{font-size:11px;opacity:.8;margin-bottom:2px;font-weight:600}
    .arsan-msg .time{font-size:10px;opacity:.6;margin-top:2px}
    .arsan-chat-form{padding:10px;border-top:1px solid var(--line);display:flex;gap:6px}
    .arsan-chat-form input{flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg-1);color:var(--ink-1);font:inherit;font-size:13px}
    .arsan-chat-form button{padding:8px 14px;background:var(--brand);color:#fff;border:none;border-radius:8px;cursor:pointer;font:inherit;font-size:13px}
    .arsan-chat-guest{padding:30px 16px;text-align:center;color:var(--ink-3);font-size:13px}

    /* Unified Map */
    .arsan-unified{width:100%;height:70vh;min-height:500px;border:1px solid var(--line);border-radius:12px;background:var(--bg-1);position:relative;overflow:hidden}
    .arsan-unified svg{width:100%;height:100%}
    .arsan-unified .legend{position:absolute;top:12px;inset-inline-start:12px;background:var(--bg-0);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:12px;display:flex;flex-direction:column;gap:4px;z-index:2}
    .arsan-unified .legend .ent{display:flex;align-items:center;gap:6px}
    .arsan-unified .legend .sw{width:16px;height:3px;border-radius:2px}

    /* Deps editor */
    .arsan-deps-table{width:100%;border-collapse:collapse;font-size:13px}
    .arsan-deps-table th,.arsan-deps-table td{padding:8px;border-bottom:1px solid var(--line);text-align:start}
    .arsan-deps-table th{background:var(--bg-2);font-weight:600}
    .arsan-dep-type{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;color:#fff}

    /* Inline edit */
    .arsan-editable{cursor:pointer;position:relative;padding:2px 4px;border-radius:4px;transition:background .15s}
    body.editor-mode .arsan-editable:hover{background:rgba(var(--brand-rgb,139,45,60),.08);outline:1px dashed var(--brand);outline-offset:2px}
    body.editor-mode .arsan-editable::after{
      content:"✎";position:absolute;top:-4px;inset-inline-end:-4px;font-size:11px;
      opacity:0;transition:opacity .15s;color:var(--brand);
    }
    body.editor-mode .arsan-editable:hover::after{opacity:1}

    /* Badge role */
    .arsan-role{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
    .arsan-role.admin{background:#b85450;color:#fff}
    .arsan-role.editor{background:#3a8f66;color:#fff}
    .arsan-role.viewer{background:var(--bg-2);color:var(--ink-2)}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ================= UTIL =================
  const h = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  };
  const fmt = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('ar-SA', { dateStyle:'short', timeStyle:'short' });
  };
  const esc = (s) => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function openModal(node) {
    const bd = h('div', { class: 'arsan-modal-backdrop open' });
    bd.appendChild(node);
    bd.addEventListener('click', e => { if (e.target === bd) bd.remove(); });
    document.body.appendChild(bd);
    return bd;
  }

  // ================= AUTH UI =================
  function showLogin() {
    const err = h('div', { class: 'arsan-err' });
    const emailInput = h('input', { type:'email', placeholder:'name@arsann.com', autocomplete:'email' });
    const pwInput = h('input', { type:'password', placeholder:'كلمة السر', autocomplete:'current-password' });
    const submit = h('button', { class:'arsan-btn primary', onclick: async () => {
      err.textContent = '';
      try {
        await API.login(emailInput.value, pwInput.value);
        bd.remove();
        location.reload();
      } catch(e) {
        err.textContent = e.message === 'invalid-domain' ? 'البريد يجب أن ينتهي بـ @arsann.com' :
                          e.message === 'wrong-password' ? 'كلمة السر غير صحيحة' :
                          e.message === 'no-backend' ? 'الوضع المحلي مفعّل' :
                          'خطأ: ' + (e.message || e);
      }
    }}, 'تسجيل دخول');

    [emailInput, pwInput].forEach(i => i.addEventListener('keydown', e => { if (e.key==='Enter') submit.click(); }));

    const modal = h('div', { class:'arsan-modal' },
      h('h2', {}, 'تسجيل دخول'),
      h('div', { class:'sub' }, 'للمحررين والمسؤول فقط. البريد يجب أن ينتهي بـ @arsann.com'),
      h('div', { class:'arsan-field' }, h('label', {}, 'البريد الإلكتروني'), emailInput),
      h('div', { class:'arsan-field' }, h('label', {}, 'كلمة السر'), pwInput),
      err,
      h('div', { class:'arsan-actions' },
        h('button', { class:'arsan-btn', onclick: () => bd.remove() }, 'إلغاء'),
        submit
      ),
      API.hasBackend() ? null : h('div', { class:'sub', style:'margin-top:12px;padding:10px;background:var(--bg-2);border-radius:8px' },
        '⚠️ لم يتم ربط Worker — يعمل في الوضع المحلي فقط (لن يتم مزامنة التعديلات).')
    );
    const bd = openModal(modal);
    setTimeout(() => emailInput.focus(), 50);
  }

  // ================= ADMIN PANEL =================
  function showAdmin() {
    if (!API.isAdmin()) return alert('صلاحيات المسؤول فقط');

    const logPane   = h('div', { class:'arsan-pane active' });
    const usersPane = h('div', { class:'arsan-pane' });
    const slackPane = h('div', { class:'arsan-pane' });

    const tabs = [
      { id:'log',    label:'سجل النشاط',       pane: logPane   },
      { id:'users',  label:'المستخدمون',        pane: usersPane },
      { id:'slack',  label:'Slack',            pane: slackPane },
    ];
    const tabBar = h('div', { class:'arsan-tabs' });
    tabs.forEach(t => {
      const b = h('button', { class: 'arsan-tab' + (t.id==='log'?' active':''), onclick: () => {
        tabs.forEach(x => { x.pane.classList.remove('active'); });
        tabBar.querySelectorAll('.arsan-tab').forEach(x => x.classList.remove('active'));
        t.pane.classList.add('active'); b.classList.add('active');
      }}, t.label);
      tabBar.appendChild(b);
    });

    // Activity log
    logPane.appendChild(h('div', { class:'sub' }, 'آخر 1000 نشاط على النظام.'));
    const logList = h('div', { class:'arsan-log' });
    logPane.appendChild(logList);
    logPane.appendChild(h('div', { class:'arsan-actions' },
      h('button', { class:'arsan-btn', onclick: () => exportActivityCSV() }, 'تصدير CSV')
    ));
    (async () => {
      try {
        const items = await API.getActivity();
        if (!items.length) { logList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--ink-3)">لا توجد أنشطة بعد.</div>'; return; }
        logList.innerHTML = items.map(it => `
          <div class="arsan-log-row">
            <div class="arsan-log-time">${fmt(it.ts)}</div>
            <div>
              <span class="arsan-log-action">${esc(it.action)}</span>
              <span class="arsan-log-actor">${esc(it.actor || '—')}</span>
              ${it.target ? ` <span style="color:var(--ink-3)">→ ${esc(it.target)}</span>` : ''}
              ${it.preview ? `<div style="color:var(--ink-3);margin-top:2px">${esc(it.preview)}</div>` : ''}
            </div>
          </div>`).join('');
        logPane._items = items;
      } catch(e) {
        logList.innerHTML = `<div style="padding:20px;text-align:center;color:#b85450">خطأ: ${esc(e.message||e)}</div>`;
      }
    })();
    async function exportActivityCSV() {
      const items = logPane._items || await API.getActivity();
      const rows = [['time','actor','action','target','preview','fields']];
      items.forEach(it => rows.push([fmt(it.ts), it.actor||'', it.action||'', it.target||'', it.preview||'', (it.fields||[]).join('|')]));
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob(['\ufeff'+csv], { type:'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `arsan-activity-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    }

    // Users
    const emailI = h('input', { type:'email', placeholder:'user@arsann.com' });
    const pwI    = h('input', { type:'text', placeholder:'كلمة سر (اختياري — الافتراضية arsan2026)' });
    const usersList = h('div', { class:'arsan-log' });
    async function reloadUsers(){
      try {
        const users = await API.getUsers();
        usersList.innerHTML = users.length ? users.map(u => `
          <div class="arsan-log-row">
            <div>${esc(u.email)}</div>
            <div>
              <span class="arsan-log-time">أضيف ${u.addedAt?fmt(u.addedAt):'—'}</span>
              <button class="arsan-btn danger" style="padding:4px 10px;font-size:12px;margin-inline-start:8px" data-email="${esc(u.email)}">حذف</button>
            </div>
          </div>`).join('') : '<div style="padding:20px;text-align:center;color:var(--ink-3)">لا مستخدمون مُخصّصون. أي بريد @arsann.com يدخل بكلمة السر الافتراضية.</div>';
        usersList.querySelectorAll('button[data-email]').forEach(b => b.addEventListener('click', async () => {
          if (!confirm('حذف ' + b.dataset.email + '؟')) return;
          await API.removeUser(b.dataset.email); reloadUsers();
        }));
      } catch(e){ usersList.innerHTML = `<div style="padding:20px;color:#b85450">${esc(e.message||e)}</div>`; }
    }
    usersPane.appendChild(h('div', { class:'sub' }, 'أضف مستخدمين معتمدين بكلمات سر مخصصة. أي بريد @arsann.com يدخل افتراضياً بالكلمة العامة.'));
    usersPane.appendChild(h('div', { class:'arsan-field' }, h('label',{},'البريد'), emailI));
    usersPane.appendChild(h('div', { class:'arsan-field' }, h('label',{},'كلمة السر'), pwI));
    usersPane.appendChild(h('div', { class:'arsan-actions' },
      h('button', { class:'arsan-btn primary', onclick: async () => {
        try { await API.addUser(emailI.value.trim(), pwI.value.trim() || undefined); emailI.value=''; pwI.value=''; reloadUsers(); }
        catch(e){ alert('خطأ: ' + e.message); }
      }}, 'إضافة')));
    usersPane.appendChild(usersList);
    reloadUsers();

    // Slack
    const slackI = h('input', { type:'url', placeholder:'https://hooks.slack.com/services/...' });
    slackPane.appendChild(h('div', { class:'sub' }, 'إن أضفت Incoming Webhook URL من Slack، كل نشاط (تسجيل دخول، تعديل، رسالة...) سيُرسل تلقائياً للقناة.'));
    slackPane.appendChild(h('div', { class:'arsan-field' }, h('label',{},'Webhook URL'), slackI));
    slackPane.appendChild(h('div', { class:'arsan-actions' },
      h('button', { class:'arsan-btn primary', onclick: async () => {
        try { await API.setSlackWebhook(slackI.value.trim()); alert('تم الحفظ ✓'); }
        catch(e){ alert('خطأ: ' + e.message); }
      }}, 'حفظ')));
    (async()=>{ try { slackI.value = await API.getSlackWebhook(); } catch(_){} })();

    const modal = h('div', { class:'arsan-modal wide' },
      h('h2', {}, '🛡️ لوحة المسؤول'),
      h('div', { class:'sub' }, 'المستخدم الحالي: ' + API.me().email + ' (admin)'),
      tabBar, logPane, usersPane, slackPane,
      h('div', { class:'arsan-actions' },
        h('button', { class:'arsan-btn', onclick: () => bd.remove() }, 'إغلاق'))
    );
    const bd = openModal(modal);
  }

  // ================= CHAT =================
  const channels = [
    { id:'general',    label:'عام' },
    { id:'executive',  label:'الإدارة التنفيذية' },
    { id:'projects',   label:'إدارة المشاريع' },
    { id:'finance',    label:'المالية' },
    { id:'operations', label:'التشغيل' },
    { id:'legal',      label:'القانونية' },
    { id:'hr',         label:'الموارد البشرية' },
    { id:'bizdev',     label:'تطوير الأعمال' },
  ];
  let chatPanel = null, currentChannel = 'general', chatPoll = null;

  function buildChat() {
    if (chatPanel) return chatPanel;
    const sel = h('select', {});
    channels.forEach(c => sel.appendChild(h('option', { value: c.id }, '#' + c.label)));
    sel.value = currentChannel;
    sel.addEventListener('change', () => { currentChannel = sel.value; loadMessages(); });
    const closeBtn = h('button', { class:'arsan-btn', style:'padding:4px 10px;font-size:13px', onclick: () => chatPanel.classList.remove('open') }, '✕');
    const body = h('div', { class:'arsan-chat-body' });
    const input = h('input', { type:'text', placeholder:'اكتب رسالة...' });
    const sendBtn = h('button', { type:'submit' }, 'إرسال');
    const form = h('form', { class:'arsan-chat-form', onsubmit: async e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      if (!API.isEditor()) { alert('يجب تسجيل الدخول للكتابة في الشات.'); return; }
      input.value = '';
      try { await API.postChat(currentChannel, text); loadMessages(); }
      catch(err) { alert('خطأ: ' + err.message); }
    }}, input, sendBtn);

    chatPanel = h('div', { class:'arsan-chat-panel' },
      h('div', { class:'arsan-chat-head' }, sel, closeBtn),
      body, form);
    document.body.appendChild(chatPanel);

    async function loadMessages(){
      try {
        const msgs = await API.getChat(currentChannel);
        body.innerHTML = '';
        const myEmail = API.me().email;
        if (!msgs.length) body.appendChild(h('div', { class:'arsan-chat-guest' }, 'لا رسائل بعد. كُن أول من يكتب.'));
        msgs.forEach(m => {
          const mine = m.author === myEmail;
          body.appendChild(h('div', { class: 'arsan-msg' + (mine?' mine':'') },
            h('div', { class:'author' }, m.author),
            h('div', {}, m.text),
            h('div', { class:'time' }, fmt(m.ts))));
        });
        body.scrollTop = body.scrollHeight;
      } catch(e){}
    }
    chatPanel._load = loadMessages;
    loadMessages();
    // poll every 10s while open
    setInterval(() => { if (chatPanel.classList.contains('open')) loadMessages(); }, 10000);
    return chatPanel;
  }
  function toggleChat() {
    const p = buildChat();
    p.classList.toggle('open');
    if (p.classList.contains('open')) p._load();
  }

  // ================= DEPS EDITOR =================
  function showDepsEditor() {
    const tbody = h('tbody');
    const addBtn = h('button', { class:'arsan-btn primary', onclick: () => showAddDep(reload) }, '+ إضافة تبعية');
    async function reload(){
      try {
        const deps = await API.getDeps();
        tbody.innerHTML = '';
        if (!deps.length) { tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--ink-3)">لا توجد تبعيات.</td></tr>'; return; }
        const DEPT_CFG = window.DEPARTMENTS_CONFIG || {};
        deps.forEach(d => {
          const fromName = (DEPT_CFG[d.from.dept]||{}).name || d.from.dept;
          const toName   = (DEPT_CFG[d.to.dept]||{}).name   || d.to.dept;
          const typeInfo = (window.DEP_TYPES_UI || {})[d.type] || { ar: d.type, color:'#6b7280' };
          const tr = h('tr');
          tr.innerHTML = `
            <td>${esc(fromName)}<br><small style="color:var(--ink-3)">${esc(d.from.code)}</small></td>
            <td style="text-align:center;font-size:18px;color:var(--brand)">←</td>
            <td>${esc(toName)}<br><small style="color:var(--ink-3)">${esc(d.to.code)}</small></td>
            <td><span class="arsan-dep-type" style="background:${typeInfo.color}">${esc(typeInfo.ar)}</span><br><small style="color:var(--ink-3)">${esc(d.note||'')}</small></td>
            <td></td>`;
          if (API.isEditor()) {
            const delBtn = h('button', { class:'arsan-btn danger', style:'padding:4px 10px;font-size:12px', onclick: async () => {
              if (!confirm('حذف هذه التبعية؟')) return;
              await API.removeDep(d.id); reload();
            }}, 'حذف');
            tr.lastElementChild.appendChild(delBtn);
          }
          tbody.appendChild(tr);
        });
      } catch(e){ tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;color:#b85450">${esc(e.message||e)}</td></tr>`; }
    }
    const modal = h('div', { class:'arsan-modal wide' },
      h('h2', {}, 'التبعيّات بين الإدارات'),
      h('div', { class:'sub' }, 'جميع الروابط والاعتمادات بين إجراءات الإدارات.'),
      API.isEditor() ? h('div', { style:'margin-bottom:12px' }, addBtn) : null,
      h('table', { class:'arsan-deps-table' },
        h('thead', {}, h('tr', {},
          h('th',{},'المصدر'), h('th',{}), h('th',{},'الهدف'), h('th',{},'النوع / ملاحظة'), h('th',{},''))),
        tbody),
      h('div', { class:'arsan-actions' }, h('button', { class:'arsan-btn', onclick: () => bd.remove() }, 'إغلاق'))
    );
    const bd = openModal(modal);
    reload();
  }

  function showAddDep(onDone) {
    const DEPT_CFG = window.DEPARTMENTS_CONFIG || {};
    const deptIds = Object.keys(DEPT_CFG);

    const mkDeptSel = (selected) => {
      const s = h('select', {});
      deptIds.forEach(id => s.appendChild(h('option', { value:id }, DEPT_CFG[id].name)));
      if (selected) s.value = selected;
      return s;
    };
    const mkSopSel = (deptId) => {
      const s = h('select', {});
      const cfg = DEPT_CFG[deptId];
      if (cfg && Array.isArray(cfg.sops)) {
        cfg.sops.forEach(([code, _phase, title]) => s.appendChild(h('option', { value:code }, code + ' — ' + title)));
      }
      return s;
    };

    const fromDept = mkDeptSel();
    let fromSop = mkSopSel(fromDept.value);
    fromDept.addEventListener('change', () => {
      const n = mkSopSel(fromDept.value);
      fromSop.replaceWith(n); fromSop = n;
    });
    const toDept = mkDeptSel();
    let toSop = mkSopSel(toDept.value);
    toDept.addEventListener('change', () => {
      const n = mkSopSel(toDept.value);
      toSop.replaceWith(n); toSop = n;
    });

    const typeSel = h('select', {});
    ['approval','review','budget','contract','input','other'].forEach(t => {
      const info = (window.DEP_TYPES_UI||{})[t] || { ar: t };
      typeSel.appendChild(h('option', { value:t }, info.ar));
    });
    const noteI = h('input', { type:'text', placeholder:'ملاحظة قصيرة' });

    const modal = h('div', { class:'arsan-modal' },
      h('h2', {}, 'إضافة تبعية'),
      h('div', { class:'arsan-field' }, h('label',{},'إدارة المصدر'), fromDept),
      h('div', { class:'arsan-field' }, h('label',{},'إجراء المصدر'), fromSop),
      h('div', { class:'arsan-field' }, h('label',{},'إدارة الهدف (تعتمد عليه)'), toDept),
      h('div', { class:'arsan-field' }, h('label',{},'إجراء الهدف'), toSop),
      h('div', { class:'arsan-field' }, h('label',{},'نوع التبعية'), typeSel),
      h('div', { class:'arsan-field' }, h('label',{},'ملاحظة'), noteI),
      h('div', { class:'arsan-actions' },
        h('button', { class:'arsan-btn', onclick: () => bd.remove() }, 'إلغاء'),
        h('button', { class:'arsan-btn primary', onclick: async () => {
          try {
            await API.addDep({
              from: { dept: fromDept.value, code: fromSop.value },
              to:   { dept: toDept.value,   code: toSop.value   },
              type: typeSel.value,
              note: noteI.value.trim()
            });
            bd.remove(); onDone && onDone();
          } catch(e) { alert('خطأ: ' + e.message); }
        }}, 'إضافة'))
    );
    const bd = openModal(modal);
  }

  window.DEP_TYPES_UI = {
    approval: { ar:"موافقة",   color:"#b85450" },
    review:   { ar:"مراجعة",   color:"#ea9a3e" },
    budget:   { ar:"ميزانية",  color:"#5b8def" },
    contract: { ar:"عقد",      color:"#7c5ab8" },
    input:    { ar:"مدخلات",   color:"#3a8f66" },
    other:    { ar:"أخرى",     color:"#6b7280" }
  };

  // ================= UNIFIED MAP =================
  function showUnifiedMap() {
    const DEPT_CFG = window.DEPARTMENTS_CONFIG || {};
    const deptIds = Object.keys(DEPT_CFG);
    const W = 1200, H = 700;
    const cx = W/2, cy = H/2;
    const R_DEPT = 260; // distance from center for department hubs
    const R_SOP  = 90;  // distance of SOPs around their dept hub

    const container = h('div', { class:'arsan-unified' });
    const legend = h('div', { class:'legend' });
    Object.entries(window.DEP_TYPES_UI).forEach(([_,info]) => {
      legend.appendChild(h('div', { class:'ent' },
        h('span', { class:'sw', style:`background:${info.color}` }), info.ar));
    });
    container.appendChild(legend);

    // Positions
    const positions = {}; // deptId → {x,y}
    deptIds.forEach((id, i) => {
      const a = (i / deptIds.length) * Math.PI * 2 - Math.PI/2;
      positions[id] = { x: cx + R_DEPT * Math.cos(a), y: cy + R_DEPT * Math.sin(a), angle: a };
    });
    // SOP positions around each dept
    const sopPos = {}; // `${dept}/${code}` → {x,y}
    deptIds.forEach(id => {
      const cfg = DEPT_CFG[id];
      const center = positions[id];
      const sops = cfg.sops || [];
      sops.forEach(([code], j) => {
        const a = (j / sops.length) * Math.PI * 2;
        sopPos[`${id}/${code}`] = { x: center.x + R_SOP * Math.cos(a), y: center.y + R_SOP * Math.sin(a) };
      });
    });

    (async () => {
      const deps = await API.getDeps();
      const svg = [];
      svg.push(`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`);
      svg.push(`<defs>
        ${Object.entries(window.DEP_TYPES_UI).map(([k,v]) => `
          <marker id="arrow-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="${v.color}"/>
          </marker>`).join('')}
      </defs>`);

      // dependency lines
      deps.forEach(d => {
        const f = sopPos[`${d.from.dept}/${d.from.code}`];
        const t = sopPos[`${d.to.dept}/${d.to.code}`];
        if (!f || !t) return;
        const color = (window.DEP_TYPES_UI[d.type]||{}).color || '#6b7280';
        const mx = (f.x+t.x)/2, my = (f.y+t.y)/2 - 30;
        svg.push(`<path d="M ${f.x} ${f.y} Q ${mx} ${my} ${t.x} ${t.y}" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.6" marker-end="url(#arrow-${d.type||'other'})"/>`);
      });

      // dept hubs + SOPs
      deptIds.forEach(id => {
        const cfg = DEPT_CFG[id];
        const p = positions[id];
        const isExec = id === 'executive';
        // dept node
        svg.push(`<circle cx="${p.x}" cy="${p.y}" r="42" fill="${isExec?'#b85450':'var(--bg-0)'}" stroke="${isExec?'#b85450':'var(--brand)'}" stroke-width="${isExec?3:2}"/>`);
        svg.push(`<text x="${p.x}" y="${p.y+4}" text-anchor="middle" font-size="12" font-weight="700" fill="${isExec?'#fff':'var(--ink-1)'}">${esc(cfg.name.split(' ')[0])}</text>`);
        svg.push(`<text x="${p.x}" y="${p.y+18}" text-anchor="middle" font-size="10" fill="${isExec?'#fff':'var(--ink-3)'}">${cfg.sops.length}</text>`);

        // SOP mini nodes
        (cfg.sops||[]).forEach(([code]) => {
          const sp = sopPos[`${id}/${code}`];
          svg.push(`<circle cx="${sp.x}" cy="${sp.y}" r="10" fill="var(--bg-0)" stroke="var(--line)" stroke-width="1"/>`);
          svg.push(`<text x="${sp.x}" y="${sp.y+3}" text-anchor="middle" font-size="7" fill="var(--ink-2)">${esc(code.split('-')[1]||code)}</text>`);
          // line from SOP to dept hub
          svg.push(`<line x1="${sp.x}" y1="${sp.y}" x2="${p.x}" y2="${p.y}" stroke="var(--line)" stroke-width="0.5"/>`);
        });
      });

      svg.push('</svg>');
      container.insertAdjacentHTML('beforeend', svg.join(''));
    })();

    const modal = h('div', { class:'arsan-modal wide', style:'max-width:1280px' },
      h('h2', {}, '🌐 الخريطة الشاملة — كل الإدارات'),
      h('div', { class:'sub' }, 'النقاط الحمراء = الإدارة التنفيذية. الخطوط تمثّل التبعيات بين الإجراءات. الألوان في الأسفل.'),
      container,
      h('div', { class:'arsan-actions' },
        h('button', { class:'arsan-btn', onclick: () => showDepsEditor() }, 'محرر التبعيات'),
        h('button', { class:'arsan-btn primary', onclick: () => bd.remove() }, 'إغلاق'))
    );
    const bd = openModal(modal);
  }

  // ================= TOPBAR BUTTONS =================
  function injectTopBar() {
    const header = document.querySelector('header .top-right, header .topbar-actions, .topbar-actions');
    const fallback = document.querySelector('header') || document.body;
    const host = header || fallback;

    const me = API.me();
    const bar = h('div', { class:'arsan-topbar', style:'display:inline-flex;gap:6px;margin-inline-start:8px;flex-wrap:wrap' });

    // Unified map button (visible to all)
    bar.appendChild(h('button', { class:'arsan-topbar-btn', onclick: showUnifiedMap }, '🌐 الخريطة الشاملة'));
    // Deps editor
    bar.appendChild(h('button', { class:'arsan-topbar-btn', onclick: showDepsEditor }, '🔗 التبعيّات'));
    // Chat
    bar.appendChild(h('button', { class:'arsan-topbar-btn', onclick: toggleChat }, '💬 التواصل'));

    if (me.role === 'viewer') {
      bar.appendChild(h('button', { class:'arsan-topbar-btn primary', onclick: showLogin }, '🔑 دخول'));
    } else {
      bar.appendChild(h('span', { class:`arsan-role ${me.role}`, style:'align-self:center' }, me.role === 'admin' ? 'مسؤول' : 'محرر'));
      bar.appendChild(h('span', { style:'align-self:center;font-size:12px;color:var(--ink-3);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, me.email));
      if (me.role === 'admin') {
        bar.appendChild(h('button', { class:'arsan-topbar-btn', onclick: showAdmin }, '🛡️ Admin'));
      }
      bar.appendChild(h('button', { class:'arsan-topbar-btn', onclick: async () => { await API.logout(); location.reload(); }}, 'خروج'));

      document.body.classList.add('editor-mode');
    }

    host.appendChild(bar);
  }

  // ================= INLINE EDITING =================
  // wrap modal fields with editable markers
  function enableInlineEditing() {
    if (!API.isEditor()) return;
    // Find m-purpose, m-kpis, m-steps, etc, once modal is opened
    const observer = new MutationObserver(() => {
      ['m-purpose','m-kpis'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('arsan-editable') && el.textContent) {
          el.classList.add('arsan-editable');
          el.addEventListener('click', () => editField(id));
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function editField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el || !window.SOPS || window.state == null) return;
    const sop = window.SOPS[window.state.openIdx];
    if (!sop) return;
    const labelMap = { 'm-purpose':'الغرض','m-kpis':'مؤشرات الأداء' };
    const keyMap = { 'm-purpose':'purpose','m-kpis':'kpis' };
    const ta = h('textarea', { rows:'5', style:'width:100%' }, sop[keyMap[fieldId]] === '— يُكمل لاحقاً —' ? '' : (sop[keyMap[fieldId]] || ''));
    const modal = h('div', { class:'arsan-modal' },
      h('h2', {}, 'تعديل: ' + labelMap[fieldId]),
      h('div', { class:'sub' }, sop.code + ' — ' + sop.title),
      h('div', { class:'arsan-field' }, ta),
      h('div', { class:'arsan-actions' },
        h('button', { class:'arsan-btn', onclick: () => bd.remove() }, 'إلغاء'),
        h('button', { class:'arsan-btn primary', onclick: async () => {
          const patch = {}; patch[keyMap[fieldId]] = ta.value.trim();
          try {
            await API.updateSOP(window.CURRENT_DEPT_ID, sop.code, patch);
            Object.assign(sop, patch);
            el.textContent = patch[keyMap[fieldId]] || '— يُكمل لاحقاً —';
            bd.remove();
          } catch(e){ alert('خطأ: ' + e.message); }
        }}, 'حفظ'))
    );
    const bd = openModal(modal);
    setTimeout(() => ta.focus(), 50);
  }

  // ================= BOOT =================
  function boot() {
    injectTopBar();
    enableInlineEditing();

    // load server data and merge with local SOPs
    (async () => {
      try {
        const data = await API.bootstrap();
        if (data && data.sops && window.SOPS && window.CURRENT_DEPT_ID) {
          const deptData = data.sops[window.CURRENT_DEPT_ID];
          if (deptData) {
            window.SOPS.forEach(s => {
              if (deptData[s.code]) Object.assign(s, deptData[s.code]);
            });
            if (typeof window.renderGrid === 'function') window.renderGrid();
          }
        }
      } catch(e) { /* offline ok */ }
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 50);

  window.ArsanUI = { showLogin, showAdmin, showUnifiedMap, showDepsEditor, toggleChat };
})();

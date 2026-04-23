/* Arsan System Settings Modal
 * Admin-only panel for:
 *   - Updates banner source URL (Google Doc pub?embedded=true)
 *   - Slack webhook URL
 *   - Custom departments (add/edit/delete)
 *   - Updates banner preview + reset
 * Mounts on #btn-settings click (users.html).
 */
(function(){
  'use strict';

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function el(tag, attrs={}, ...children){
    const n = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'style') n.style.cssText = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    for (const c of children) {
      if (c == null) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  function injectStyles(){
    if (document.getElementById('arsan-settings-styles')) return;
    const style = document.createElement('style');
    style.id = 'arsan-settings-styles';
    style.textContent = `
      .asst-bd{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:grid;place-items:center;padding:20px}
      .asst-modal{background:#fff;color:#23211c;border-radius:16px;max-width:720px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}
      .asst-head{padding:20px 24px 12px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between}
      .asst-head h2{margin:0;font-size:22px;color:#6d5a1e}
      .asst-close{background:none;border:none;cursor:pointer;font-size:26px;line-height:1;color:#888;padding:0 4px}
      .asst-close:hover{color:#333}
      .asst-tabs{display:flex;border-bottom:1px solid #eee;padding:0 24px;gap:4px}
      .asst-tab{padding:12px 14px;cursor:pointer;background:none;border:none;color:#8a7c55;font:inherit;font-size:13.5px;border-bottom:2px solid transparent;font-weight:600}
      .asst-tab.active{color:#6d5a1e;border-bottom-color:#d4a83c}
      .asst-pane{display:none;padding:20px 24px}
      .asst-pane.active{display:block}
      .asst-field{margin-bottom:16px}
      .asst-field label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#5a4e30}
      .asst-field input,.asst-field textarea,.asst-field select{
        width:100%;padding:10px 12px;border:1px solid #d6ccaa;border-radius:8px;
        background:#fff;color:#23211c;font:inherit;font-size:13.5px;box-sizing:border-box;
      }
      .asst-field textarea{min-height:70px;resize:vertical}
      .asst-field input:focus,.asst-field textarea:focus{outline:2px solid #d4a83c;border-color:transparent}
      .asst-hint{font-size:12px;color:#8a7c55;margin-top:4px;line-height:1.5}
      .asst-hint code{background:#f6efd9;padding:2px 5px;border-radius:4px;font-size:11px}
      .asst-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:18px;padding-top:14px;border-top:1px solid #eee}
      .asst-btn{padding:9px 16px;border:1px solid #d6ccaa;background:#fff;border-radius:8px;cursor:pointer;font:inherit;font-size:13px;color:#5a4e30}
      .asst-btn.primary{background:#d4a83c;color:#fff;border-color:#d4a83c;font-weight:600}
      .asst-btn.primary:hover{filter:brightness(1.08)}
      .asst-btn.danger{background:#b85450;color:#fff;border-color:#b85450}
      .asst-btn:hover{background:#f9f5e6}
      .asst-btn.primary:hover,.asst-btn.danger:hover{background:inherit}
      .asst-status{padding:10px 12px;border-radius:8px;font-size:13px;margin-top:10px;display:none}
      .asst-status.ok{background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;display:block}
      .asst-status.err{background:#ffebee;color:#c62828;border:1px solid #ef9a9a;display:block}
      .asst-dept-list{border:1px solid #eee;border-radius:8px;overflow:hidden}
      .asst-dept-row{display:grid;grid-template-columns:40px 1fr auto auto;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #f0f0f0}
      .asst-dept-row:last-child{border-bottom:none}
      .asst-dept-row .icon{font-size:20px;text-align:center}
      .asst-dept-row .name{font-weight:600;color:#23211c}
      .asst-dept-row .id{font-size:11px;color:#8a7c55;font-family:monospace}
      .asst-dept-row .row-btn{padding:5px 10px;font-size:12px;border-radius:6px;border:1px solid #d6ccaa;background:#fff;cursor:pointer}
      .asst-dept-row .row-btn:hover{background:#f9f5e6}
      .asst-empty{padding:20px;text-align:center;color:#8a7c55;font-size:13px}
      .asst-preview-box{background:#faf6ea;border:1px dashed #d6ccaa;border-radius:8px;padding:12px;margin-top:10px;max-height:200px;overflow:auto;font-size:13px;line-height:1.6}
      .asst-preview-box ul{padding-inline-start:22px;margin:6px 0}
      .asst-preview-box li{margin:3px 0}
      .asst-color-swatch{width:30px;height:30px;border-radius:6px;border:1px solid #d6ccaa;display:inline-block;vertical-align:middle}
    `;
    document.head.appendChild(style);
  }

  function showStatus(el, msg, kind){
    el.className = 'asst-status ' + (kind || '');
    el.textContent = msg;
    setTimeout(() => { if (el.textContent === msg) { el.className = 'asst-status'; } }, 4000);
  }

  async function loadUpdatesUrl(){
    try {
      const res = await fetch('/api/updates-url', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        return d.url || '';
      }
    } catch(e){}
    return '';
  }

  async function saveUpdatesUrl(url){
    const res = await fetch('/api/updates-url', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'save-failed');
    return true;
  }

  async function loadUpdatesPreview(){
    try {
      const res = await fetch('/api/updates', { credentials: 'include' });
      if (res.ok) return await res.json();
    } catch(e){}
    return null;
  }

  async function loadDepts(){
    try {
      const res = await fetch('/api/custom-depts', { credentials: 'include' });
      if (res.ok) return await res.json();
    } catch(e){}
    return [];
  }

  async function addDept(data){
    const res = await fetch('/api/custom-depts', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'add-failed');
    return (await res.json()).dept;
  }

  async function updateDept(id, data){
    const res = await fetch('/api/custom-depts/' + encodeURIComponent(id), {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'update-failed');
    return true;
  }

  async function deleteDept(id){
    const res = await fetch('/api/custom-depts/' + encodeURIComponent(id), {
      method: 'DELETE', credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json()).error || 'delete-failed');
    return true;
  }

  async function getSlackWebhook(){
    try {
      const res = await fetch('/api/slack-webhook', { credentials: 'include' });
      if (res.ok) return (await res.json()).url || '';
    } catch(e){}
    return '';
  }

  async function saveSlackWebhook(url){
    const res = await fetch('/api/slack-webhook', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'save-failed');
    return true;
  }

  function renderDeptList(container, depts, onEdit, onDelete){
    container.innerHTML = '';
    if (!depts.length) {
      container.appendChild(el('div', { class: 'asst-empty' }, 'لا توجد إدارات مخصّصة. أضف أولى.'));
      return;
    }
    depts.forEach(d => {
      const row = el('div', { class: 'asst-dept-row' },
        el('div', { class: 'icon', style: `color:${d.color||'#d4a83c'}` }, d.icon || '📂'),
        el('div', {},
          el('div', { class: 'name' }, d.name),
          el('div', { class: 'id' }, d.id)
        ),
        el('button', { class: 'row-btn', onclick: () => onEdit(d) }, 'تعديل'),
        el('button', { class: 'row-btn', style: 'color:#b85450', onclick: () => onDelete(d) }, 'حذف')
      );
      container.appendChild(row);
    });
  }

  function showDeptForm(existing, onSave){
    const isEdit = !!existing;
    const bd = el('div', { class: 'asst-bd', style: 'z-index:9999' });
    bd.addEventListener('click', (e) => { if (e.target === bd) bd.remove(); });

    const nameIn = el('input', { type: 'text', placeholder: 'مثال: العلاقات العامة', value: existing?.name || '' });
    const idIn = el('input', { type: 'text', placeholder: 'pr', value: existing?.id || '', readonly: isEdit ? 'readonly' : null });
    if (isEdit) idIn.style.background = '#f6f2e4';
    const iconIn = el('input', { type: 'text', placeholder: '📢', value: existing?.icon || '📂', maxlength: '4' });
    const colorIn = el('input', { type: 'color', value: existing?.color || '#d4a83c', style: 'width:60px;height:38px;padding:2px' });
    const status = el('div', { class: 'asst-status' });

    const saveBtn = el('button', { class: 'asst-btn primary', onclick: async () => {
      const name = nameIn.value.trim();
      const id = idIn.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (!name) { showStatus(status, '❌ الاسم مطلوب', 'err'); return; }
      if (!id) { showStatus(status, '❌ المعرّف مطلوب', 'err'); return; }
      saveBtn.disabled = true;
      saveBtn.textContent = 'جاري الحفظ…';
      try {
        await onSave({ id, name, icon: iconIn.value || '📂', color: colorIn.value });
        bd.remove();
      } catch(e) {
        showStatus(status, '❌ ' + (e.message || 'فشل'), 'err');
        saveBtn.disabled = false;
        saveBtn.textContent = 'حفظ';
      }
    } }, 'حفظ');

    const modal = el('div', { class: 'asst-modal', style: 'max-width:440px' },
      el('div', { class: 'asst-head' },
        el('h2', {}, isEdit ? 'تعديل إدارة' : 'إضافة إدارة جديدة'),
        el('button', { class: 'asst-close', onclick: () => bd.remove() }, '×')
      ),
      el('div', { class: 'asst-pane active' },
        el('div', { class: 'asst-field' },
          el('label', {}, 'اسم الإدارة'),
          nameIn
        ),
        el('div', { class: 'asst-field' },
          el('label', {}, 'المعرّف (id) — بالإنجليزية'),
          idIn,
          el('div', { class: 'asst-hint' }, isEdit ? 'لا يمكن تعديل المعرّف بعد الإنشاء.' : 'حروف إنجليزية صغيرة، أرقام، شرطات فقط. مثال: pr, legal, it')
        ),
        el('div', { style: 'display:grid;grid-template-columns:1fr auto;gap:12px' },
          el('div', { class: 'asst-field' },
            el('label', {}, 'الأيقونة (إيموجي)'),
            iconIn
          ),
          el('div', { class: 'asst-field' },
            el('label', {}, 'اللون'),
            colorIn
          )
        ),
        status,
        el('div', { class: 'asst-actions' },
          el('button', { class: 'asst-btn', onclick: () => bd.remove() }, 'إلغاء'),
          saveBtn
        )
      )
    );

    bd.appendChild(modal);
    document.body.appendChild(bd);
    nameIn.focus();
  }

  async function openSettingsModal(){
    injectStyles();
    const existing = $('#asst-modal-bd');
    if (existing) existing.remove();

    const bd = el('div', { class: 'asst-bd', id: 'asst-modal-bd' });
    bd.addEventListener('click', (e) => { if (e.target === bd) bd.remove(); });

    // ==== Pane 1: Updates banner ====
    const updUrlIn = el('input', { type: 'url', placeholder: 'https://docs.google.com/document/d/XXXX/pub?embedded=true' });
    const updStatus = el('div', { class: 'asst-status' });
    const updPreview = el('div', { class: 'asst-preview-box', style: 'display:none' });
    const updRefreshBtn = el('button', { class: 'asst-btn', onclick: async () => {
      updRefreshBtn.disabled = true;
      updRefreshBtn.textContent = 'جاري التحديث…';
      try {
        // clear local dismiss so admin can test
        localStorage.removeItem('arsan_updates_dismissed_at');
        localStorage.removeItem('arsan_updates_last_hash');
        const data = await loadUpdatesPreview();
        if (data && data.items && data.items.length) {
          updPreview.innerHTML = '<strong>معاينة:</strong><ul>' + data.items.map(it => `<li>${esc(it)}</li>`).join('') + '</ul>';
          updPreview.style.display = 'block';
        } else if (data && data.error) {
          showStatus(updStatus, '❌ ' + data.error, 'err');
        } else {
          updPreview.innerHTML = '<em>لا توجد عناصر. تحقّق من الرابط.</em>';
          updPreview.style.display = 'block';
        }
        if (window.ArsanUpdatesBanner) window.ArsanUpdatesBanner.refresh();
      } catch(e){
        showStatus(updStatus, '❌ ' + e.message, 'err');
      } finally {
        updRefreshBtn.disabled = false;
        updRefreshBtn.textContent = '🔄 تحديث المعاينة';
      }
    } }, '🔄 تحديث المعاينة');

    const updSaveBtn = el('button', { class: 'asst-btn primary', onclick: async () => {
      updSaveBtn.disabled = true;
      updSaveBtn.textContent = 'جاري الحفظ…';
      try {
        await saveUpdatesUrl(updUrlIn.value.trim());
        showStatus(updStatus, '✓ تم الحفظ. جاري تحديث المعاينة…', 'ok');
        setTimeout(() => updRefreshBtn.click(), 500);
      } catch(e){
        showStatus(updStatus, '❌ ' + e.message, 'err');
      } finally {
        updSaveBtn.disabled = false;
        updSaveBtn.textContent = 'حفظ الرابط';
      }
    } }, 'حفظ الرابط');

    const pane1 = el('div', { class: 'asst-pane active', id: 'asst-pane-updates' },
      el('div', { class: 'asst-field' },
        el('label', {}, 'رابط مصدر التحديثات'),
        updUrlIn,
        el('div', { class: 'asst-hint' },
          'الصق رابط Google Doc المنشور على الويب. خطوات: افتح المستند → ملف → مشاركة → ',
          el('strong', {}, 'النشر على الويب'),
          ' → Embed → انسخ URL. يجب أن ينتهي بـ ',
          el('code', {}, 'pub?embedded=true'),
          '. كل عنصر في القائمة (•) سيظهر كتحديث دوري في الشريط العلوي.'
        )
      ),
      el('div', { style: 'display:flex;gap:8px;align-items:center' },
        updSaveBtn,
        updRefreshBtn,
        el('button', { class: 'asst-btn', style: 'margin-inline-start:auto', onclick: () => {
          localStorage.removeItem('arsan_updates_dismissed_at');
          localStorage.removeItem('arsan_updates_last_hash');
          if (window.ArsanUpdatesBanner) window.ArsanUpdatesBanner.refresh();
          showStatus(updStatus, '✓ تم إعادة عرض الشريط للجميع عند التحديث', 'ok');
        } }, '🔔 إعادة عرض الشريط')
      ),
      updStatus,
      updPreview
    );

    // ==== Pane 2: Custom departments ====
    const deptList = el('div', { class: 'asst-dept-list' });
    const deptStatus = el('div', { class: 'asst-status' });
    const refreshDepts = async () => {
      const depts = await loadDepts();
      renderDeptList(deptList, depts,
        (d) => showDeptForm(d, async (data) => {
          await updateDept(d.id, { name: data.name, icon: data.icon, color: data.color });
          showStatus(deptStatus, '✓ تم التحديث', 'ok');
          refreshDepts();
        }),
        async (d) => {
          if (!confirm(`حذف إدارة "${d.name}"؟`)) return;
          try {
            await deleteDept(d.id);
            showStatus(deptStatus, '✓ حُذفت', 'ok');
            refreshDepts();
          } catch(e) { showStatus(deptStatus, '❌ ' + e.message, 'err'); }
        }
      );
    };

    const pane2 = el('div', { class: 'asst-pane', id: 'asst-pane-depts' },
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px' },
        el('div', { class: 'asst-hint', style: 'font-size:13px;color:#5a4e30' },
          'إضافة إدارات مخصّصة (غير الإدارات الافتراضية). ستظهر للجميع بعد الحفظ.'
        ),
        el('button', { class: 'asst-btn primary', onclick: () => showDeptForm(null, async (data) => {
          await addDept(data);
          showStatus(deptStatus, '✓ تمت الإضافة', 'ok');
          refreshDepts();
        }) }, '+ إضافة إدارة')
      ),
      deptList,
      deptStatus
    );

    // ==== Pane 3: Slack webhook ====
    const slackIn = el('input', { type: 'url', placeholder: 'https://hooks.slack.com/services/...' });
    const slackStatus = el('div', { class: 'asst-status' });
    const slackSaveBtn = el('button', { class: 'asst-btn primary', onclick: async () => {
      slackSaveBtn.disabled = true;
      slackSaveBtn.textContent = 'جاري الحفظ…';
      try {
        await saveSlackWebhook(slackIn.value.trim());
        showStatus(slackStatus, '✓ تم الحفظ', 'ok');
      } catch(e){ showStatus(slackStatus, '❌ ' + e.message, 'err'); }
      finally {
        slackSaveBtn.disabled = false;
        slackSaveBtn.textContent = 'حفظ';
      }
    } }, 'حفظ');

    const pane3 = el('div', { class: 'asst-pane', id: 'asst-pane-slack' },
      el('div', { class: 'asst-field' },
        el('label', {}, 'Slack Webhook (قناة عامة للإشعارات)'),
        slackIn,
        el('div', { class: 'asst-hint' },
          'يُستخدم كـ fallback إذا لم يكن المستخدم في Slack workspace. لـ DM مباشر، يحتاج Worker متغيّر ',
          el('code', {}, 'SLACK_BOT_TOKEN'),
          ' كـ Secret.'
        )
      ),
      slackSaveBtn,
      slackStatus
    );

    // Tabs
    const tabs = el('div', { class: 'asst-tabs' },
      el('button', { class: 'asst-tab active', 'data-tab': 'updates', onclick: (e) => switchTab(e, 'updates') }, '📣 شريط التحديثات'),
      el('button', { class: 'asst-tab', 'data-tab': 'depts', onclick: (e) => switchTab(e, 'depts') }, '🏢 الإدارات المخصّصة'),
      el('button', { class: 'asst-tab', 'data-tab': 'slack', onclick: (e) => switchTab(e, 'slack') }, '🔔 Slack')
    );

    function switchTab(evt, name){
      $$('.asst-tab', modal).forEach(b => b.classList.toggle('active', b.dataset.tab === name));
      $$('.asst-pane', modal).forEach(p => p.classList.toggle('active', p.id === 'asst-pane-' + name));
      if (name === 'depts') refreshDepts();
      if (name === 'slack' && !slackIn.value) getSlackWebhook().then(v => slackIn.value = v);
    }

    const modal = el('div', { class: 'asst-modal' },
      el('div', { class: 'asst-head' },
        el('h2', {}, '⚙️ إعدادات النظام'),
        el('button', { class: 'asst-close', onclick: () => bd.remove() }, '×')
      ),
      tabs,
      pane1, pane2, pane3
    );

    bd.appendChild(modal);
    document.body.appendChild(bd);

    // Load initial values
    updUrlIn.value = await loadUpdatesUrl();
    if (updUrlIn.value) {
      updRefreshBtn.click();
    }
  }

  // Wire button
  function wire(){
    const btn = document.getElementById('btn-settings');
    if (btn) btn.addEventListener('click', openSettingsModal);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  window.openArsanSettings = openSettingsModal;
})();

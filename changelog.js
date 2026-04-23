/* ============================================================
   Arsann — Changelog Modal
   ============================================================
   Click the version label anywhere in the app → open a modal
   with a readable list of recent updates.
   Exposes: window.ArsanChangelog.show()
   ============================================================ */

(function () {
  "use strict";

  const VERSION = "2.0";

  /* --- release notes (newest first) --- */
  const RELEASES = [
    {
      version: "2.0",
      date: "أبريل 2026",
      title: "إطلاق الإصدار الثاني",
      highlights: [
        { icon: "🩺", title: "وكيل الصيانة", body: "نظام مراقبة ذكي يعمل في الخلفية — يفحص الخدمات كل 5 دقائق، يُصلح البيانات التالفة تلقائياً، ويُنبّه مسؤول المنصّة عند أي خلل." },
        { icon: "🎨", title: "لوحة السمات", body: "اختيار من خمس سمات بصرية (فاتحة، داكنة، مُجنّح، شتائية، كلاسيكية)." },
        { icon: "🔔", title: "مركز الإشعارات", body: "جرس إشعارات في الزاوية يعرض الإعلانات والتحديثات الجديدة." },
        { icon: "📢", title: "لوحة الإعلانات", body: "أداة مخصّصة للمسؤول لنشر إعلانات للفريق مع تحديد الأولوية." },
        { icon: "🛡️", title: "إعادة تصميم زر الإدارة", body: "زر دائري هادئ يفتح قائمة الأدمن دون إزعاج بصري." },
        { icon: "📝", title: "صياغة احترافية موحّدة", body: "تدقيق شامل لنصوص الواجهة باللغتين العربية والإنجليزية." },
        { icon: "👥", title: "إدارة المستخدمين المحسّنة", body: "ثلاث طرق عرض (جدول، بطاقات، لوحة معلومات) مع إجراءات أسرع." },
        { icon: "🌐", title: "دعم ثنائي اللغة", body: "تبديل فوري بين العربية والإنجليزية في كل صفحات المنصّة." },
      ],
    },
    {
      version: "1.5",
      date: "فبراير 2026",
      title: "التكاملات والدعوات",
      highlights: [
        { icon: "✉️", title: "دعوات البريد الإلكتروني", body: "إرسال دعوات تلقائية عبر Resend + إشعارات Slack." },
        { icon: "🔑", title: "استعادة كلمة السر", body: "روابط إعادة تعيين آمنة للمستخدمين." },
        { icon: "🏢", title: "الإدارات المخصّصة", body: "إضافة إدارات جديدة خارج الهيكل الافتراضي." },
      ],
    },
    {
      version: "1.0",
      date: "يناير 2026",
      title: "الإطلاق الأول",
      highlights: [
        { icon: "📚", title: "مرجع الإجراءات التشغيلية", body: "نظام موحّد لتوثيق ومشاركة SOPs عبر كل الإدارات." },
        { icon: "🔗", title: "خريطة التبعيّات", body: "عرض مرئي للعلاقات بين الإدارات والإجراءات." },
        { icon: "✨", title: "مساعد الذكاء الاصطناعي", body: "استخراج وتوليد الإجراءات من ملفات PDF وDOCX ومستندات Google." },
        { icon: "💬", title: "التواصل الداخلي", body: "قنوات محادثة مدمجة لكل إدارة." },
      ],
    },
  ];

  const RELEASES_EN = {
    "2.0": {
      date: "April 2026",
      title: "Version 2.0 Release",
      highlights: [
        { icon: "🩺", title: "Maintenance Agent", body: "Intelligent background monitor — checks services every 5 minutes, auto-repairs corrupt data, and alerts the admin on failures." },
        { icon: "🎨", title: "Theme Gallery", body: "Five polished themes (Light, Dark, Winged, Winter, Classic)." },
        { icon: "🔔", title: "Notification Center", body: "Corner bell surfacing announcements and new updates." },
        { icon: "📢", title: "Announcement Composer", body: "Dedicated admin tool for publishing team announcements with priority levels." },
        { icon: "🛡️", title: "Redesigned Admin Button", body: "Quiet circular pill that opens the admin menu without visual clutter." },
        { icon: "📝", title: "Unified Professional Copy", body: "Comprehensive copy audit across Arabic and English UI." },
        { icon: "👥", title: "Enhanced User Management", body: "Three viewing modes (Table, Cards, Dashboard) with faster actions." },
        { icon: "🌐", title: "Bilingual Support", body: "Instant toggle between Arabic and English on every page." },
      ],
    },
    "1.5": {
      date: "February 2026",
      title: "Integrations & Invites",
      highlights: [
        { icon: "✉️", title: "Email Invites", body: "Automated invites via Resend plus Slack notifications." },
        { icon: "🔑", title: "Password Recovery", body: "Secure reset links for users." },
        { icon: "🏢", title: "Custom Departments", body: "Extend beyond the default organizational tree." },
      ],
    },
    "1.0": {
      date: "January 2026",
      title: "Initial Release",
      highlights: [
        { icon: "📚", title: "SOPs Reference", body: "Unified system for documenting and sharing SOPs across departments." },
        { icon: "🔗", title: "Dependency Map", body: "Visual layout of relationships between departments and procedures." },
        { icon: "✨", title: "AI Assistant", body: "Extract and generate procedures from PDF, DOCX, and Google docs." },
        { icon: "💬", title: "Internal Chat", body: "Embedded channels for each department." },
      ],
    },
  };

  const isEn = () => (localStorage.getItem("arsan_lang") || "ar") === "en";
  const t = (ar, en) => isEn() ? en : ar;

  function injectStyles() {
    if (document.getElementById("arsan-cl-styles")) return;
    const s = document.createElement("style");
    s.id = "arsan-cl-styles";
    s.textContent = `
      .arsan-cl-overlay{
        position:fixed;inset:0;z-index:9800;
        background:rgba(8,10,18,.55);backdrop-filter:blur(6px);
        display:flex;align-items:center;justify-content:center;padding:24px;
        animation:arsanClFade .22s ease-out;
      }
      @keyframes arsanClFade { from{opacity:0} to{opacity:1} }
      @keyframes arsanClSlide { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
      .arsan-cl-card{
        width:100%;max-width:620px;max-height:88vh;display:flex;flex-direction:column;
        background:linear-gradient(180deg, rgba(22,24,36,.98), rgba(16,18,28,.97));
        color:#e9ecf3;border:1px solid rgba(255,255,255,.08);
        border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.55);
        overflow:hidden;
        animation:arsanClSlide .28s ease-out;
      }
      [data-theme="light"] .arsan-cl-card{
        background:linear-gradient(180deg, rgba(250,246,234,.99), rgba(243,234,208,.97));
        color:#3a2f15;border-color:rgba(90,70,30,.14);
      }
      .arsan-cl-head{
        padding:20px 24px 16px;
        border-bottom:1px solid rgba(255,255,255,.07);
        display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
      }
      [data-theme="light"] .arsan-cl-head{ border-color:rgba(90,70,30,.1); }
      .arsan-cl-head h2{
        margin:0 0 4px;font-size:20px;font-weight:700;letter-spacing:-.2px;
        display:flex;align-items:center;gap:10px;
      }
      .arsan-cl-head .sub{
        font-size:12px;opacity:.55;font-weight:500;
      }
      .arsan-cl-head .x{
        background:none;border:none;color:inherit;font-size:20px;cursor:pointer;
        opacity:.5;padding:4px 10px;border-radius:8px;flex-shrink:0;
      }
      .arsan-cl-head .x:hover{ opacity:1;background:rgba(255,255,255,.06) }
      [data-theme="light"] .arsan-cl-head .x:hover{ background:rgba(90,70,30,.08) }
      .arsan-cl-body{
        padding:20px 24px 24px;overflow-y:auto;flex:1;
      }
      .arsan-cl-release{ margin-bottom:28px; }
      .arsan-cl-release:last-child{ margin-bottom:0; }
      .arsan-cl-release-head{
        display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;
        margin-bottom:4px;
      }
      .arsan-cl-tag{
        display:inline-block;padding:2px 9px;border-radius:999px;
        background:linear-gradient(135deg,#d4a83c,#b89030);
        color:#fff;font-size:11px;font-weight:700;letter-spacing:.4px;
      }
      .arsan-cl-release.old .arsan-cl-tag{
        background:rgba(255,255,255,.08);color:inherit;opacity:.7;
      }
      [data-theme="light"] .arsan-cl-release.old .arsan-cl-tag{
        background:rgba(90,70,30,.12);
      }
      .arsan-cl-release h3{
        margin:0;font-size:15px;font-weight:700;
      }
      .arsan-cl-date{
        font-size:11px;opacity:.5;
      }
      .arsan-cl-items{
        list-style:none;margin:10px 0 0;padding:0;
        display:grid;gap:8px;
      }
      .arsan-cl-item{
        display:flex;gap:12px;padding:12px 14px;
        border-radius:12px;
        background:rgba(255,255,255,.03);
        border:1px solid rgba(255,255,255,.05);
      }
      [data-theme="light"] .arsan-cl-item{
        background:rgba(255,255,255,.5);
        border-color:rgba(90,70,30,.08);
      }
      .arsan-cl-item .ico{
        font-size:20px;flex-shrink:0;line-height:1.2;
      }
      .arsan-cl-item .txt{ min-width:0; }
      .arsan-cl-item .t{
        font-weight:600;font-size:13.5px;margin-bottom:2px;
      }
      .arsan-cl-item .b{
        font-size:12.5px;opacity:.72;line-height:1.55;
      }
      .arsan-cl-foot{
        padding:12px 20px;border-top:1px solid rgba(255,255,255,.07);
        background:rgba(255,255,255,.02);
        font-size:11px;opacity:.5;text-align:center;
      }
      [data-theme="light"] .arsan-cl-foot{
        border-color:rgba(90,70,30,.1);background:rgba(255,255,255,.4);
      }

      /* Make existing version chip interactive */
      .version[role="button"]{
        cursor:pointer;
        transition:background .18s, transform .18s;
      }
      .version[role="button"]:hover{
        background:rgba(212,168,60,.15);
      }
      .version[role="button"]:active{ transform:scale(.96); }
    `;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[c]));
  }

  function render() {
    const en = isEn();
    return RELEASES.map((r, idx) => {
      const data = en ? { ...r, ...(RELEASES_EN[r.version] || {}) } : r;
      const cls = idx === 0 ? "" : "old";
      const items = (data.highlights || []).map(h => `
        <li class="arsan-cl-item">
          <div class="ico">${h.icon}</div>
          <div class="txt">
            <div class="t">${esc(h.title)}</div>
            <div class="b">${esc(h.body)}</div>
          </div>
        </li>
      `).join("");
      return `
        <section class="arsan-cl-release ${cls}">
          <div class="arsan-cl-release-head">
            <span class="arsan-cl-tag">v${r.version}</span>
            <h3>${esc(data.title)}</h3>
            <span class="arsan-cl-date">· ${esc(data.date)}</span>
          </div>
          <ul class="arsan-cl-items">${items}</ul>
        </section>
      `;
    }).join("");
  }

  let overlayEl = null;
  function show() {
    if (overlayEl && document.body.contains(overlayEl)) {
      overlayEl.remove(); overlayEl = null; return;
    }
    injectStyles();
    overlayEl = document.createElement("div");
    overlayEl.className = "arsan-cl-overlay";
    overlayEl.innerHTML = `
      <div class="arsan-cl-card" role="dialog" aria-modal="true" aria-labelledby="arsan-cl-title">
        <div class="arsan-cl-head">
          <div>
            <h2 id="arsan-cl-title">✨ ${t("ما الجديد","What's New")}</h2>
            <div class="sub">${t("سجل التحديثات والتحسينات","Release notes & improvements")}</div>
          </div>
          <button class="x" type="button" aria-label="Close">✕</button>
        </div>
        <div class="arsan-cl-body">${render()}</div>
        <div class="arsan-cl-foot">
          ${t("نقدّر اقتراحاتكم لتحسين المنصّة","We welcome your suggestions for improvement")}
        </div>
      </div>
    `;
    const close = () => { overlayEl?.remove(); overlayEl = null; };
    overlayEl.addEventListener("click", (e) => { if (e.target === overlayEl) close(); });
    overlayEl.querySelector(".x").addEventListener("click", close);
    document.addEventListener("keydown", function onEsc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onEsc); }
    });
    document.body.appendChild(overlayEl);
  }

  function attachToVersionLabels() {
    const labels = document.querySelectorAll(".version, [data-arsan-version]");
    labels.forEach(el => {
      if (el.dataset.arsanClHooked) return;
      el.dataset.arsanClHooked = "1";
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.title = t("عرض تفاصيل التحديثات","View release notes");
      el.addEventListener("click", show);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); }
      });
    });

    // Also: footer text with "الإصدار" — make the version substring clickable
    document.querySelectorAll(".site-foot .muted").forEach(el => {
      if (el.dataset.arsanClHooked) return;
      const txt = el.textContent || "";
      if (!/الإصدار|v2\.|v1\./i.test(txt)) return;
      el.dataset.arsanClHooked = "1";
      el.style.cursor = "pointer";
      el.title = t("عرض تفاصيل التحديثات","View release notes");
      el.addEventListener("click", show);
    });
  }

  function boot() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", attachToVersionLabels);
    } else {
      attachToVersionLabels();
    }
    // Re-attach if DOM changes (for dynamically rendered pages)
    setInterval(attachToVersionLabels, 2500);
  }

  window.ArsanChangelog = { show, VERSION };
  boot();
})();

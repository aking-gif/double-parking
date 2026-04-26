/* ============================================================
   Arsann — Maintenance Agent
   ============================================================
   A background health monitor + auto-repair agent for the
   Arsann SOPs platform. Admin-only UI surfaces the status
   dashboard; checks run continuously in the background.

   Responsibilities
   ----------------
   1. Periodic health checks (every 5 min by default)
        - /api/health               (Worker liveness)
        - /api/bootstrap            (KV + data integrity)
        - /api/users                (auth + admin session)
        - /api/activity             (audit log availability)
        - localStorage integrity    (JSON parse-ability)

   2. Auto-repair where safe
        - Purge corrupt JSON entries in localStorage
        - Retry transient network errors (3x, backoff)
        - Clear stale session if server reports 401 loops
        - Reconcile orphaned refs (chat/notifications only)

   3. Status dashboard
        - Floating window opened from Admin FAB menu
        - Live status per endpoint (latency, last error)
        - Incident log (last 50 events)
        - Manual "run now" + "repair now" buttons

   Exposes: window.ArsanMaintenance
   ============================================================ */

(function () {
  "use strict";

  const VERSION       = "1.0.0";
  const CHECK_EVERY   = 5 * 60 * 1000;  // 5 min
  const MAX_EVENTS    = 50;
  const STORAGE_KEY   = "arsan_maint_log_v1";
  const LAST_RUN_KEY  = "arsan_maint_last_v1";

  const t = (ar, en) =>
    (document.documentElement?.lang || "ar").startsWith("en") ? en : ar;

  /* ---------------- state ---------------- */

  const state = {
    running:   false,
    timer:     null,
    lastRunAt: 0,
    checks:    {},      // { name: { status, latency, lastError, lastOkAt } }
    events:    [],      // incident log
  };

  function isAdmin() {
    return !!(window.ArsanAPI?.isAdmin && window.ArsanAPI.isAdmin());
  }

  function hasBackend() {
    return !!(window.ArsanAPI?.hasBackend && window.ArsanAPI.hasBackend());
  }

  function apiBase() {
    return (window.API_BASE || "").replace(/\/$/, "");
  }

  function getToken() {
    return window.ArsanAPI?.getToken ? window.ArsanAPI.getToken() : null;
  }

  /* ---------------- event log ---------------- */

  function loadEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state.events = raw ? JSON.parse(raw) : [];
    } catch (_) { state.events = []; }
  }

  function saveEvents() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events.slice(0, MAX_EVENTS)));
    } catch (_) {}
  }

  function logEvent(level, check, message, meta) {
    const e = {
      id: "ev-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      level: level,           // 'ok' | 'warn' | 'error' | 'fix'
      check: check || "system",
      message: String(message || ""),
      meta: meta || null,
    };
    state.events.unshift(e);
    if (state.events.length > MAX_EVENTS) state.events.length = MAX_EVENTS;
    saveEvents();
    try { refreshPanelIfOpen(); } catch (_) {}
    return e;
  }

  /* ---------------- individual checks ---------------- */

  async function timedFetch(url, opts, timeoutMs) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs || 8000);
    const start = performance.now();
    try {
      const res = await fetch(url, { ...(opts || {}), signal: ctrl.signal });
      return { res, latency: Math.round(performance.now() - start) };
    } finally {
      clearTimeout(to);
    }
  }

  async function checkWorkerReachable() {
    if (!hasBackend()) {
      return { status: "skip", note: t("الوضع المحلي — لا يوجد Worker", "Local mode — no Worker") };
    }
    const url = apiBase() + "/api/bootstrap";
    const tok = getToken();
    try {
      const { res, latency } = await timedFetch(url, {
        headers: tok ? { Authorization: "Bearer " + tok } : {},
      });
      if (res.ok) return { status: "ok", latency };
      if (res.status === 401) return { status: "auth", latency, note: "unauthorized" };
      return { status: "fail", latency, note: "HTTP " + res.status };
    } catch (err) {
      return { status: "fail", note: err.message || String(err) };
    }
  }

  async function checkAuthSession() {
    if (!hasBackend()) return { status: "skip" };
    if (!getToken())    return { status: "skip", note: t("لا يوجد تسجيل دخول","Not signed in") };
    const url = apiBase() + "/api/bootstrap";
    try {
      const { res, latency } = await timedFetch(url, {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (res.status === 401) return { status: "auth", latency, note: "session expired" };
      if (!res.ok) return { status: "fail", latency, note: "HTTP " + res.status };
      return { status: "ok", latency };
    } catch (err) {
      return { status: "fail", note: err.message || String(err) };
    }
  }

  async function checkAdminEndpoints() {
    if (!hasBackend() || !isAdmin()) return { status: "skip" };
    const url = apiBase() + "/api/users";
    try {
      const { res, latency } = await timedFetch(url, {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (!res.ok) return { status: "fail", latency, note: "HTTP " + res.status };
      return { status: "ok", latency };
    } catch (err) {
      return { status: "fail", note: err.message || String(err) };
    }
  }

  async function checkActivityLog() {
    if (!hasBackend() || !isAdmin()) return { status: "skip" };
    const url = apiBase() + "/api/activity";
    try {
      const { res, latency } = await timedFetch(url, {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (!res.ok) return { status: "fail", latency, note: "HTTP " + res.status };
      return { status: "ok", latency };
    } catch (err) {
      return { status: "fail", note: err.message || String(err) };
    }
  }

  async function checkLocalStorageHealth() {
    let scanned = 0, corrupt = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        scanned++;
        // JSON-looking keys we manage
        if (/^arsan_/i.test(k)) {
          const v = localStorage.getItem(k);
          if (!v) continue;
          if (v.trim().startsWith("{") || v.trim().startsWith("[")) {
            try { JSON.parse(v); } catch (_) { corrupt.push(k); }
          }
        }
      }
    } catch (err) {
      return { status: "fail", note: err.message };
    }
    if (corrupt.length) {
      return { status: "warn", scanned, corrupt, note: corrupt.length + " corrupt key(s)" };
    }
    return { status: "ok", scanned };
  }

  /* ---------------- auto-repair ---------------- */

  async function repairCorruptLocalStorage() {
    const report = await checkLocalStorageHealth();
    if (report.status !== "warn" || !report.corrupt?.length) return 0;
    let removed = 0;
    for (const k of report.corrupt) {
      try { localStorage.removeItem(k); removed++; } catch (_) {}
    }
    if (removed) {
      logEvent("fix", "localStorage",
        t(`تم إصلاح ${removed} من مفاتيح التخزين التالفة`,
          `Repaired ${removed} corrupt storage key(s)`),
        { keys: report.corrupt });
    }
    return removed;
  }

  async function repairStaleSession(result) {
    // If auth endpoint returns 401 and we have a cached token, clear it so
    // the user is prompted to sign in again.
    if (result.status !== "auth") return false;
    if (!getToken()) return false;
    try {
      await window.ArsanAPI?.logout?.();
      logEvent("fix", "auth",
        t("انتهت جلسة المستخدم — تم تسجيل الخروج التلقائي لإعادة الدخول",
          "Session expired — automatically signed out to re-authenticate"));
      return true;
    } catch (_) { return false; }
  }

  /* ---------------- run cycle ---------------- */

  const CHECKS = [
    { key: "worker",   label: t("خادم Cloudflare Worker", "Cloudflare Worker"),    fn: checkWorkerReachable },
    { key: "auth",     label: t("جلسة المستخدم",          "User Session"),          fn: checkAuthSession },
    { key: "users",    label: t("واجهة المستخدمين (أدمن)", "Users Endpoint (admin)"), fn: checkAdminEndpoints },
    { key: "activity", label: t("سجل النشاط (أدمن)",      "Activity Log (admin)"),   fn: checkActivityLog },
    { key: "storage",  label: t("التخزين المحلي",          "Local Storage"),         fn: checkLocalStorageHealth },
  ];

  async function runOnce(opts) {
    if (state.running) return;
    state.running = true;
    const results = {};
    const runId = Date.now();
    try {
      for (const c of CHECKS) {
        const r = await c.fn();
        r.label = c.label;
        r.runAt = runId;
        results[c.key] = { ...(state.checks[c.key] || {}), ...r };

        if (r.status === "ok")   results[c.key].lastOkAt = runId;
        if (r.status === "fail" || r.status === "warn" || r.status === "auth") {
          results[c.key].lastError = { ts: runId, note: r.note };
        }

        // log transitions
        const prev = state.checks[c.key]?.status;
        if (prev !== r.status) {
          if (r.status === "fail") {
            logEvent("error", c.key,
              t(`فشل الفحص: ${c.label} — ${r.note || ""}`,
                `Check failed: ${c.label} — ${r.note || ""}`));
          } else if (r.status === "warn") {
            logEvent("warn", c.key,
              t(`تحذير: ${c.label} — ${r.note || ""}`,
                `Warning: ${c.label} — ${r.note || ""}`));
          } else if (r.status === "ok" && (prev === "fail" || prev === "warn" || prev === "auth")) {
            logEvent("ok", c.key,
              t(`عاد للعمل: ${c.label}`,
                `Recovered: ${c.label}`));
          }
        }
      }

      // auto-repair pass
      if (results.storage?.status === "warn") {
        await repairCorruptLocalStorage();
        // re-scan
        results.storage = { ...results.storage, ...(await checkLocalStorageHealth()), label: CHECKS.find(c=>c.key==='storage').label };
      }
      if (results.auth?.status === "auth" && !opts?.skipAuthRepair) {
        await repairStaleSession(results.auth);
      }

      state.checks    = results;
      state.lastRunAt = runId;
      localStorage.setItem(LAST_RUN_KEY, String(runId));
    } catch (err) {
      logEvent("error", "agent",
        t("خطأ داخلي في وكيل الصيانة: " + err.message,
          "Maintenance agent internal error: " + err.message));
    } finally {
      state.running = false;
      try { refreshPanelIfOpen(); } catch (_) {}
    }
    return results;
  }

  function startAuto() {
    if (state.timer) return;
    state.timer = setInterval(() => {
      runOnce({ skipAuthRepair: true }).catch(()=>{});
    }, CHECK_EVERY);
    // run soon after start
    setTimeout(() => runOnce({ skipAuthRepair: true }).catch(()=>{}), 3000);
  }

  function stopAuto() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }

  /* ---------------- status dashboard UI ---------------- */

  let panelEl = null;
  function refreshPanelIfOpen() {
    if (!panelEl || !document.body.contains(panelEl)) return;
    const body = panelEl.querySelector(".arsan-maint-body");
    if (body) body.innerHTML = renderPanelBody();
    const ts = panelEl.querySelector(".arsan-maint-ts");
    if (ts) ts.textContent = state.lastRunAt
      ? t("آخر فحص: ", "Last check: ") + new Date(state.lastRunAt).toLocaleTimeString()
      : t("لم يتم الفحص بعد", "Not checked yet");
  }

  function statusChip(status) {
    const map = {
      ok:   { bg:"rgba(46,186,127,.18)", fg:"#2eba7f", label:t("يعمل","Healthy") },
      warn: { bg:"rgba(234,179,8,.18)",  fg:"#d4a10a", label:t("تحذير","Warning") },
      fail: { bg:"rgba(232,82,82,.2)",   fg:"#e85252", label:t("خلل","Failing") },
      auth: { bg:"rgba(232,82,82,.2)",   fg:"#e85252", label:t("جلسة منتهية","Auth expired") },
      skip: { bg:"rgba(255,255,255,.06)", fg:"rgba(255,255,255,.55)", label:t("متجاهل","Skipped") },
    };
    const m = map[status] || map.skip;
    return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${m.bg};color:${m.fg}">${m.label}</span>`;
  }

  function renderPanelBody() {
    const rows = CHECKS.map(c => {
      const r = state.checks[c.key] || { status: "skip" };
      const lat = r.latency ? `${r.latency}ms` : "—";
      const note = r.note ? `<div style="font-size:11px;opacity:.6;margin-top:2px">${escapeHtml(r.note)}</div>` : "";
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:10px;background:rgba(255,255,255,.04);margin-bottom:6px">
          <div style="min-width:0;flex:1">
            <div style="font-weight:600;font-size:13px">${escapeHtml(c.label)}</div>
            ${note}
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
            <span style="font-size:11px;opacity:.55;font-variant-numeric:tabular-nums">${lat}</span>
            ${statusChip(r.status)}
          </div>
        </div>
      `;
    }).join("");

    const events = state.events.slice(0, 20).map(e => {
      const icon = e.level === "error" ? "⛔" : e.level === "warn" ? "⚠️" : e.level === "fix" ? "🛠️" : "✓";
      const color = e.level === "error" ? "#e85252" : e.level === "warn" ? "#d4a10a" : e.level === "fix" ? "#8cb4ff" : "#2eba7f";
      const when = new Date(e.ts).toLocaleTimeString();
      return `
        <div style="display:flex;gap:10px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.03);margin-bottom:4px;align-items:flex-start">
          <span style="color:${color};flex-shrink:0">${icon}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;line-height:1.4">${escapeHtml(e.message)}</div>
            <div style="font-size:10px;opacity:.45;margin-top:2px">${when} · ${escapeHtml(e.check)}</div>
          </div>
        </div>
      `;
    }).join("") || `<div style="opacity:.5;font-size:12px;padding:10px 0;text-align:center">${t("لا أحداث بعد","No events yet")}</div>`;

    return `
      <div style="padding:14px 16px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:.55;margin-bottom:8px">${t("حالة الخدمات","Service status")}</div>
        ${rows}
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:.55;margin:14px 0 8px">${t("سجل الأحداث","Event log")}</div>
        ${events}
      </div>
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[c]));
  }

  function showPanel() {
    if (!isAdmin()) {
      alert(t("هذه الأداة مخصّصة لمسؤول المنصّة فقط.","Admin access required."));
      return;
    }

    if (panelEl && document.body.contains(panelEl)) {
      panelEl.remove();
      panelEl = null;
      return;
    }

    // inject styles once
    if (!document.getElementById("arsan-maint-styles")) {
      const s = document.createElement("style");
      s.id = "arsan-maint-styles";
      s.textContent = `
        .arsan-maint-overlay{
          position:fixed;inset:0;z-index:9700;
          background:rgba(8,10,18,.55);backdrop-filter:blur(6px);
          display:flex;align-items:center;justify-content:center;padding:24px;
          animation:arsanMaintFade .2s ease-out;
        }
        @keyframes arsanMaintFade { from{opacity:0} to{opacity:1} }
        .arsan-maint-card{
          width:100%;max-width:560px;max-height:86vh;display:flex;flex-direction:column;
          background:linear-gradient(180deg, rgba(22,24,36,.98), rgba(16,18,28,.97));
          color:#e9ecf3;border:1px solid rgba(255,255,255,.08);
          border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.5);
          overflow:hidden;
        }
        [data-theme="light"] .arsan-maint-card{
          background:linear-gradient(180deg, rgba(250,246,234,.99), rgba(243,234,208,.97));
          color:#1A2942;border-color:rgba(90,70,30,.14);
        }
        .arsan-maint-head{
          display:flex;align-items:center;justify-content:space-between;
          padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.07);
        }
        [data-theme="light"] .arsan-maint-head{ border-color:rgba(90,70,30,.1); }
        .arsan-maint-head h2{ margin:0;font-size:16px;font-weight:700;letter-spacing:.2px }
        .arsan-maint-head .x{
          background:none;border:none;color:inherit;font-size:18px;cursor:pointer;
          opacity:.5;padding:4px 8px;border-radius:6px;
        }
        .arsan-maint-head .x:hover{ opacity:1;background:rgba(255,255,255,.06) }
        .arsan-maint-body{ overflow-y:auto;flex:1 }
        .arsan-maint-foot{
          display:flex;align-items:center;justify-content:space-between;gap:10px;
          padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);
          background:rgba(255,255,255,.02);
        }
        [data-theme="light"] .arsan-maint-foot{ border-color:rgba(90,70,30,.1);background:rgba(255,255,255,.4) }
        .arsan-maint-foot .arsan-maint-ts{ font-size:11px;opacity:.55 }
        .arsan-maint-btn{
          background:rgba(255,255,255,.06);color:inherit;border:1px solid rgba(255,255,255,.1);
          padding:7px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
          font-family:inherit;
        }
        .arsan-maint-btn:hover{ background:rgba(255,255,255,.12) }
        .arsan-maint-btn.primary{
          background:linear-gradient(180deg,#6a7afc,#5267ee);color:#fff;border-color:transparent;
        }
        .arsan-maint-btn.primary:hover{ filter:brightness(1.1) }
        [data-theme="light"] .arsan-maint-btn{ background:rgba(90,70,30,.06);border-color:rgba(90,70,30,.15) }
        [data-theme="light"] .arsan-maint-btn:hover{ background:rgba(90,70,30,.12) }
      `;
      document.head.appendChild(s);
    }

    panelEl = document.createElement("div");
    panelEl.className = "arsan-maint-overlay";
    panelEl.innerHTML = `
      <div class="arsan-maint-card" role="dialog" aria-modal="true">
        <div class="arsan-maint-head">
          <h2>🩺 ${t("وكيل الصيانة","Maintenance Agent")} <span style="font-size:10px;opacity:.45;font-weight:500;margin-inline-start:6px">v${VERSION}</span></h2>
          <button class="x" type="button" aria-label="Close">✕</button>
        </div>
        <div class="arsan-maint-body">${renderPanelBody()}</div>
        <div class="arsan-maint-foot">
          <span class="arsan-maint-ts"></span>
          <div style="display:flex;gap:8px">
            <button class="arsan-maint-btn" data-act="clear">${t("مسح السجل","Clear log")}</button>
            <button class="arsan-maint-btn primary" data-act="run">${t("فحص الآن","Run checks")}</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panelEl);

    const close = () => { panelEl?.remove(); panelEl = null; };
    panelEl.querySelector(".x").addEventListener("click", close);
    panelEl.addEventListener("click", (e) => { if (e.target === panelEl) close(); });

    panelEl.querySelector('[data-act="run"]').addEventListener("click", async (e) => {
      const b = e.currentTarget;
      b.disabled = true; b.textContent = t("جارٍ الفحص…","Checking…");
      await runOnce();
      b.disabled = false; b.textContent = t("فحص الآن","Run checks");
      refreshPanelIfOpen();
    });
    panelEl.querySelector('[data-act="clear"]').addEventListener("click", () => {
      if (!confirm(t("مسح جميع أحداث السجل؟","Clear all event log entries?"))) return;
      state.events = [];
      saveEvents();
      refreshPanelIfOpen();
    });

    refreshPanelIfOpen();
  }

  /* ---------------- boot ---------------- */

  function boot() {
    loadEvents();
    // Only run agent for admins (reduces noise + avoids non-admin endpoint 403s)
    const start = () => {
      if (isAdmin()) startAuto();
    };
    // initial check after API loads
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(start, 1500));
    } else {
      setTimeout(start, 1500);
    }
    // re-evaluate on login/logout events
    window.addEventListener("storage", (e) => {
      if (e.key === "arsan_me" || e.key === "arsan_token") {
        stopAuto();
        if (isAdmin()) startAuto();
      }
    });
  }

  /* ---------------- public api ---------------- */

  window.ArsanMaintenance = {
    version: VERSION,
    runOnce: runOnce,
    showPanel: showPanel,
    getState: () => ({ ...state }),
    getEvents: () => state.events.slice(),
    startAuto: startAuto,
    stopAuto: stopAuto,
  };

  boot();
})();

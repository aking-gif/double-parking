/**
 * Arsan Foundation Layer (v1)
 * ----------------------------
 * Bundle: Telemetry + Friction Tracker + Offline Queue + Validation + Logs
 *
 * Loaded on every page after api.js. Auto-initializes on DOMContentLoaded.
 *
 * Public API: window.ArsanFoundation
 *   .telemetry.track(event, data)        — manual event capture
 *   .friction.report()                   — get current friction stats
 *   .offline.queue(req)                  — queue an API call for sync later
 *   .offline.sync()                      — flush queue when back online
 *   .validate.sop(sop)                   — { ok, errors[], warnings[] }
 *   .validate.task(t)                    — same shape
 *   .logs.error(err, ctx)                — log an error to KV
 *   .logs.slow(endpoint, ms)             — log a slow request
 */
(function () {
  'use strict';

  if (window.ArsanFoundation) return; // singleton

  // ===========================================================
  // 1. CONFIG
  // ===========================================================
  const CONFIG = {
    flushIntervalMs: 30_000,        // post buffered events every 30s
    maxBufferSize: 50,              // or when buffer reaches 50 events
    slowThresholdMs: 1500,          // requests >1.5s = "slow"
    sessionTimeoutMs: 30 * 60_000,  // 30min idle = new session
    heatmapSampleRate: 0.25,        // 25% of clicks captured for heatmap
    storageKey: 'arsan_telemetry_v1',
    sessionKey: 'arsan_session_v1',
    offlineQueueKey: 'arsan_offline_queue_v1',
    apiBase: window.API_BASE || '',
  };

  const me = () => (window.ArsanAPI && window.ArsanAPI.me && window.ArsanAPI.me()) || { email: null, role: 'guest' };

  // ===========================================================
  // 2. SESSION ID
  // ===========================================================
  function getSessionId() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG.sessionKey) || 'null');
      if (saved && (Date.now() - saved.lastActive) < CONFIG.sessionTimeoutMs) {
        saved.lastActive = Date.now();
        localStorage.setItem(CONFIG.sessionKey, JSON.stringify(saved));
        return saved.id;
      }
    } catch {}
    const fresh = {
      id: 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36),
      startedAt: Date.now(),
      lastActive: Date.now(),
    };
    localStorage.setItem(CONFIG.sessionKey, JSON.stringify(fresh));
    return fresh.id;
  }

  // ===========================================================
  // 3. TELEMETRY ENGINE
  // ===========================================================
  const buffer = [];
  let flushTimer = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]'); }
    catch { return []; }
  }
  function save(events) {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(events.slice(-500))); }
    catch {}
  }

  function track(event, data) {
    const user = me();
    const evt = {
      event,
      data: data || {},
      ts: Date.now(),
      session: getSessionId(),
      email: user.email || 'guest',
      role: user.role || 'guest',
      page: location.pathname.split('/').pop() || 'index.html',
      ua: navigator.userAgent.slice(0, 120),
    };
    buffer.push(evt);
    const all = load();
    all.push(evt);
    save(all);
    if (buffer.length >= CONFIG.maxBufferSize) flush();
  }

  async function flush() {
    if (!buffer.length) return;
    const batch = buffer.splice(0, buffer.length);
    try {
      const res = await fetch(`${CONFIG.apiBase}/api/telemetry`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(window.ArsanAPI && window.ArsanAPI._authHeader ? window.ArsanAPI._authHeader() : {}),
        },
        body: JSON.stringify({ events: batch }),
      });
      if (!res.ok) buffer.unshift(...batch); // requeue on fail
    } catch {
      buffer.unshift(...batch);
    }
  }

  function startFlushTimer() {
    if (flushTimer) return;
    flushTimer = setInterval(flush, CONFIG.flushIntervalMs);
    window.addEventListener('beforeunload', () => {
      if (buffer.length) {
        navigator.sendBeacon &&
          navigator.sendBeacon(
            `${CONFIG.apiBase}/api/telemetry`,
            JSON.stringify({ events: buffer })
          );
      }
    });
  }

  // ===========================================================
  // 4. FRICTION TRACKER (auto-capture)
  // ===========================================================
  let pageEnterTs = Date.now();
  let clicksOnPage = 0;
  let lastClickTs = 0;
  let rapidClickCount = 0;

  function initFriction() {
    pageEnterTs = Date.now();
    clicksOnPage = 0;

    document.addEventListener('click', (e) => {
      clicksOnPage++;
      const now = Date.now();
      if (now - lastClickTs < 500) {
        rapidClickCount++;
        if (rapidClickCount >= 3) {
          track('friction:rapid_clicks', {
            target: describeEl(e.target),
            count: rapidClickCount,
          });
          rapidClickCount = 0;
        }
      } else {
        rapidClickCount = 0;
      }
      lastClickTs = now;

      // Heatmap sample
      if (Math.random() < CONFIG.heatmapSampleRate) {
        track('click', {
          target: describeEl(e.target),
          x: e.clientX,
          y: e.clientY,
          vw: window.innerWidth,
          vh: window.innerHeight,
        });
      }
    }, true);

    // Track page-leave duration
    window.addEventListener('beforeunload', () => {
      const duration = Date.now() - pageEnterTs;
      track('page:leave', {
        duration_ms: duration,
        clicks: clicksOnPage,
      });
    });

    // Track page visibility (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        track('page:hidden', { duration_ms: Date.now() - pageEnterTs });
      } else {
        pageEnterTs = Date.now();
        track('page:visible', {});
      }
    });

    // Track on load
    track('page:enter', { url: location.href });
  }

  function describeEl(el) {
    if (!el || !el.tagName) return 'unknown';
    const t = el.tagName.toLowerCase();
    const id = el.id ? '#' + el.id : '';
    const cls = el.className && typeof el.className === 'string'
      ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.')
      : '';
    const txt = (el.textContent || '').trim().slice(0, 30);
    return `${t}${id}${cls}${txt ? ` "${txt}"` : ''}`;
  }

  function frictionReport() {
    const events = load();
    const recent = events.filter(e => e.ts > Date.now() - 7 * 86400_000);

    const pageDurations = {};
    const slowestActions = [];
    const rapidClicks = [];

    recent.forEach(e => {
      if (e.event === 'page:leave') {
        pageDurations[e.page] = pageDurations[e.page] || [];
        pageDurations[e.page].push(e.data.duration_ms || 0);
      }
      if (e.event === 'friction:rapid_clicks') {
        rapidClicks.push(e);
      }
      if (e.event === 'action:duration' && e.data.ms > 3000) {
        slowestActions.push(e);
      }
    });

    return {
      totalEvents: recent.length,
      uniqueSessions: new Set(recent.map(e => e.session)).size,
      pageDurations,
      rapidClicks: rapidClicks.length,
      slowestActions: slowestActions.sort((a, b) => b.data.ms - a.data.ms).slice(0, 10),
    };
  }

  // ===========================================================
  // 5. OFFLINE QUEUE (IndexedDB-lite via localStorage for now)
  // ===========================================================
  function loadQueue() {
    try { return JSON.parse(localStorage.getItem(CONFIG.offlineQueueKey) || '[]'); }
    catch { return []; }
  }
  function saveQueue(q) {
    localStorage.setItem(CONFIG.offlineQueueKey, JSON.stringify(q));
  }
  function queue(req) {
    const q = loadQueue();
    q.push({ ...req, queuedAt: Date.now(), id: 'q_' + Math.random().toString(36).slice(2) });
    saveQueue(q);
    track('offline:queued', { method: req.method, path: req.path });
    showOfflineToast();
  }
  async function sync() {
    if (!navigator.onLine) return { ok: false, reason: 'offline' };
    const q = loadQueue();
    if (!q.length) return { ok: true, synced: 0 };
    let synced = 0, failed = [];
    for (const item of q) {
      try {
        const res = await fetch(`${CONFIG.apiBase}${item.path}`, {
          method: item.method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(window.ArsanAPI && window.ArsanAPI._authHeader ? window.ArsanAPI._authHeader() : {}),
          },
          body: item.body ? JSON.stringify(item.body) : null,
        });
        if (res.ok) synced++;
        else failed.push(item);
      } catch {
        failed.push(item);
      }
    }
    saveQueue(failed);
    track('offline:synced', { count: synced, remaining: failed.length });
    if (synced > 0) showSyncedToast(synced);
    return { ok: true, synced, remaining: failed.length };
  }
  function showOfflineToast() {
    if (document.getElementById('arsan-offline-toast')) return;
    const t = document.createElement('div');
    t.id = 'arsan-offline-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:10000;padding:10px 14px;background:#b3261e;color:#fff;border-radius:8px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    t.textContent = '⚠️ غير متصل — تم حفظ التغيير محلياً وسيُرفع عند عودة الاتصال';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }
  function showSyncedToast(n) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:10000;padding:10px 14px;background:#1c6c3a;color:#fff;border-radius:8px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    t.textContent = `✅ تم رفع ${n} تغيير معلّق`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // Auto-sync on reconnect
  window.addEventListener('online', () => sync());

  // ===========================================================
  // 6. VALIDATION LAYER
  // ===========================================================
  function validateSop(s) {
    const errors = [];
    const warnings = [];
    if (!s) { errors.push('SOP فارغ'); return { ok: false, errors, warnings }; }
    if (!s.code || !s.code.trim()) errors.push('الكود مطلوب');
    if (!s.title || !s.title.trim()) errors.push('العنوان مطلوب');
    if (!s.dept) errors.push('الإدارة مطلوبة');
    if (!s.status) warnings.push('بدون حالة (الافتراضي: مسودّة)');
    if (!s.owner) warnings.push('بدون مسؤول معيّن');
    if (!s.steps || !Array.isArray(s.steps) || s.steps.length === 0)
      warnings.push('بدون خطوات');
    if (!s.purpose || !s.purpose.trim())
      warnings.push('بدون وصف الغرض');
    return { ok: errors.length === 0, errors, warnings };
  }

  function validateTask(t) {
    const errors = [];
    const warnings = [];
    if (!t) { errors.push('المهمة فارغة'); return { ok: false, errors, warnings }; }
    if (!t.title || !t.title.trim()) errors.push('العنوان مطلوب');
    if (!t.assignee) errors.push('المسؤول مطلوب');
    if (!t.dueDate) errors.push('تاريخ الاستحقاق مطلوب');
    if (!t.site) warnings.push('بدون موقع محدّد');
    if (!t.sopRef) warnings.push('غير مرتبطة بإجراء');
    return { ok: errors.length === 0, errors, warnings };
  }

  // ===========================================================
  // 7. ERROR + SLOW LOGS
  // ===========================================================
  function logError(err, ctx) {
    const entry = {
      kind: 'error',
      message: (err && err.message) || String(err),
      stack: (err && err.stack) || null,
      ctx: ctx || {},
      url: location.href,
    };
    track('log:error', entry);
  }

  function logSlow(endpoint, ms, extra) {
    if (ms < CONFIG.slowThresholdMs) return;
    track('log:slow', {
      endpoint,
      ms,
      ...(extra || {}),
    });
  }

  // Auto-capture global errors
  window.addEventListener('error', (e) => {
    logError(e.error || e.message, { type: 'window.error', filename: e.filename, line: e.lineno });
  });
  window.addEventListener('unhandledrejection', (e) => {
    logError(e.reason, { type: 'unhandledrejection' });
  });

  // Auto-instrument fetch for slow detection
  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const start = Date.now();
    const url = (args[0] && args[0].url) || String(args[0] || '');
    try {
      const res = await _fetch.apply(this, args);
      const ms = Date.now() - start;
      if (url.includes('/api/')) logSlow(url, ms, { status: res.status });
      return res;
    } catch (err) {
      const ms = Date.now() - start;
      if (url.includes('/api/')) logError(err, { endpoint: url, ms });
      throw err;
    }
  };

  // ===========================================================
  // 8. PUBLIC API
  // ===========================================================
  window.ArsanFoundation = {
    telemetry: { track, flush, load },
    friction:  { report: frictionReport },
    offline:   { queue, sync, getQueue: loadQueue },
    validate:  { sop: validateSop, task: validateTask },
    logs:      { error: logError, slow: logSlow },
    sessionId: getSessionId,
    config:    CONFIG,
  };

  // ===========================================================
  // 9. AUTO-INIT
  // ===========================================================
  function init() {
    initFriction();
    startFlushTimer();
    // Try sync on init in case there's a queue
    setTimeout(() => sync().catch(() => {}), 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

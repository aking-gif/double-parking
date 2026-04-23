/**
 * Arsan SOPs — Cloudflare Worker (Backend)
 * =========================================
 * ينسخ هذا الملف كاملاً في Cloudflare Worker جديد.
 * تعليمات الإعداد في README.md.
 *
 * Endpoints:
 *   GET  /api/bootstrap               — جلب كل البيانات (sops, deps, chat, users)
 *   POST /api/login                   — تسجيل دخول (email, password)
 *   POST /api/logout                  — خروج
 *   GET  /api/sops/:dept              — جلب SOPs إدارة
 *   PUT  /api/sops/:dept/:code        — تحديث SOP واحد (editors only)
 *   POST /api/sops/:dept              — إضافة SOP جديد (editors only)
 *   DELETE /api/sops/:dept/:code      — حذف (admin only)
 *   GET  /api/deps                    — كل التبعيات
 *   POST /api/deps                    — إضافة تبعية
 *   DELETE /api/deps/:id              — حذف تبعية
 *   GET  /api/chat/:channel           — رسائل قناة
 *   POST /api/chat/:channel           — إرسال رسالة
 *   GET  /api/activity                — Activity log (admin only)
 *   GET  /api/users                   — (admin only)
 *   POST /api/users                   — إضافة مستخدم معتمد (admin only)
 *   DELETE /api/users/:email          — حذف (admin only)
 *   POST /api/slack-webhook           — حفظ webhook (admin only)
 *
 * KV binding name: ARSAN (في Worker Settings → Variables → KV Namespace Bindings)
 * Environment Variables:
 *   ADMIN_EMAIL      = a.king@arsann.com
 *   EDITOR_DOMAIN    = @arsann.com
 *   DEFAULT_PASSWORD = arsan2026
 */

const KEYS = {
  sops:     "sops_v1",
  deps:     "deps_v1",
  chat:     (ch) => `chat_${ch}_v1`,
  activity: "activity_v1",
  users:    "users_v1",
  slack:    "slack_webhook_v1",
  sessions: (token) => `sess_${token}`,
  customDepts: "custom_depts_v1",
  updatesUrl:  "updates_url_v1",
  updatesCache:"updates_cache_v1",
  announcements: "announcements_v1",
};

function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status = 200, req) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

function rand(n = 24) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
}

async function getSession(req, env) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const raw = await env.ARSAN.get(KEYS.sessions(token));
  return raw ? JSON.parse(raw) : null;
}

async function requireEditor(req, env) {
  const s = await getSession(req, env);
  if (!s) return { error: "unauthorized" };
  const editorDomain = (env.EDITOR_DOMAIN || "@arsann.com").toLowerCase();
  if (!s.email.toLowerCase().endsWith(editorDomain)) return { error: "forbidden" };
  return { session: s };
}
async function requireAdmin(req, env) {
  const s = await getSession(req, env);
  if (!s) return { error: "unauthorized" };
  const adminEmail = (env.ADMIN_EMAIL || "a.king@arsann.com").toLowerCase();
  if (s.email.toLowerCase() !== adminEmail) return { error: "admin-only" };
  return { session: s };
}

async function logActivity(env, entry) {
  const raw = await env.ARSAN.get(KEYS.activity);
  const list = raw ? JSON.parse(raw) : [];
  list.unshift({ ts: Date.now(), ...entry });
  // keep last 1000
  if (list.length > 1000) list.length = 1000;
  await env.ARSAN.put(KEYS.activity, JSON.stringify(list));

  // optional Slack notification
  try {
    const webhook = await env.ARSAN.get(KEYS.slack);
    if (webhook) {
      const text = `*[Arsan SOPs]* ${entry.actor || "?"} → *${entry.action}* ${entry.target || ""}`;
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    }
  } catch (e) { /* ignore */ }
}

/**
 * إرسال إشعار موجّه لمستخدم عبر Slack (قناة مشتركة) + Email (Resend)
 * @param {object} env - Worker env
 * @param {object} opts - { email, subject, bodyText, actionUrl, actionLabel }
 */
async function sendUserNotification(env, opts) {
  const results = { slack: null, email: null };
  const { email, subject, bodyText, actionUrl, actionLabel } = opts;

  // Try Slack DM first if SLACK_BOT_TOKEN is configured
  if (env.SLACK_BOT_TOKEN) {
    try {
      // 1) Look up user by email
      const lookupRes = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}` }
      });
      const lookupJson = await lookupRes.json();
      if (lookupJson.ok && lookupJson.user?.id) {
        // 2) Send DM
        const dmRes = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify({
            channel: lookupJson.user.id,
            text: `*${subject}*\n\n${bodyText}\n\n<${actionUrl}|${actionLabel || 'اضغط هنا'}>`,
            unfurl_links: false
          })
        });
        const dmJson = await dmRes.json();
        if (dmJson.ok) {
          results.slack = { ok: true, method: 'dm', channel: lookupJson.user.id };
        } else {
          results.slack = { ok: false, method: 'dm-failed', error: dmJson.error };
        }
      } else {
        results.slack = { ok: false, method: 'lookup-failed', error: lookupJson.error || 'user-not-found' };
      }
    } catch (e) {
      results.slack = { ok: false, method: 'dm-exception', error: e.message };
    }
  }

  // Fallback to channel webhook if DM failed or Bot Token not set
  if (!results.slack?.ok) {
    const webhookUrl = env.SLACK_WEBHOOK_URL || await env.ARSAN.get(KEYS.slack);
    if (webhookUrl) {
      try {
        const msg = `*${subject}*\n\n👤 للمستخدم: \`${email}\`\n${bodyText}\n\n<${actionUrl}|${actionLabel || 'افتح الرابط'}>`;
        const r = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: msg }),
        });
        results.slack = { ok: r.ok, method: 'channel', status: r.status, fallback: true };
      } catch (e) {
        results.slack = { ok: false, method: 'channel-exception', error: e.message };
      }
    } else if (!results.slack) {
      results.slack = { ok: false, method: 'not-configured' };
    }
  }

  // 2) Email via Resend
  try {
    const apiKey = env.RESEND_API_KEY;
    const fromEmail = env.FROM_EMAIL || "noreply@arsann.com";
    if (apiKey) {
      const htmlBody = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9f6ef;border-radius:12px;direction:rtl">
          <div style="background:#fff;border-radius:10px;padding:28px;border:1px solid #e5dcc0">
            <div style="font-size:22px;font-weight:700;color:#6d5a1e;margin-bottom:16px">${subject}</div>
            <div style="font-size:15px;line-height:1.7;color:#333;white-space:pre-wrap">${bodyText}</div>
            ${actionUrl ? `
              <div style="margin-top:24px;text-align:center">
                <a href="${actionUrl}" style="display:inline-block;background:#d4a83c;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px">${actionLabel || "فتح الرابط"}</a>
              </div>
              <div style="margin-top:20px;font-size:12px;color:#888;text-align:center;word-break:break-all">
                أو انسخ الرابط: <br/><span style="color:#6d5a1e">${actionUrl}</span>
              </div>
            ` : ''}
          </div>
          <div style="text-align:center;margin-top:16px;font-size:12px;color:#999">
            أرسان للتشغيل · Arsan Operations
          </div>
        </div>
      `;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Arsan Operations <${fromEmail}>`,
          to: [email],
          subject: subject,
          html: htmlBody,
        }),
      });
      const data = await r.json().catch(() => ({}));
      results.email = r.ok ? "sent" : `failed-${r.status}: ${JSON.stringify(data).slice(0,160)}`;
    } else {
      results.email = "no-api-key-configured";
    }
  } catch (e) { results.email = "error: " + (e.message || e); }

  return results;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    if (method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

    try {
      // ---------- AUTH ----------
      if (path === "/api/login" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const email = (body.email || "").trim().toLowerCase();
        const password = body.password || "";
        const editorDomain = (env.EDITOR_DOMAIN || "@arsann.com").toLowerCase();
        const adminEmail = (env.ADMIN_EMAIL || "a.king@arsann.com").toLowerCase();
        const defaultPw = env.DEFAULT_PASSWORD || "arsan2026";

        if (!email) return json({ error: "email-required" }, 400, req);
        if (!email.endsWith(editorDomain)) {
          return json({ error: "invalid-domain", message: `البريد يجب أن ينتهي بـ ${editorDomain}` }, 403, req);
        }

        // check extra users whitelist (admin can add custom passwords)
        const usersRaw = await env.ARSAN.get(KEYS.users);
        const users = usersRaw ? JSON.parse(usersRaw) : [];
        const userIdx = users.findIndex(u => u.email.toLowerCase() === email);
        const customUser = userIdx >= 0 ? users[userIdx] : null;

        // Admin always uses default pw unless explicitly set
        const isAdmin = email === adminEmail;
        const validPw = (customUser && customUser.password) ? customUser.password : defaultPw;

        if (customUser && customUser.status === "disabled") {
          return json({ error: "account-disabled", message: "هذا الحساب معطّل. راجع المسؤول." }, 403, req);
        }
        if (customUser && customUser.status === "pending") {
          return json({ error: "account-pending", message: "الحساب لم يُفعّل بعد. افتح رابط الدعوة لتعيين كلمة السر." }, 403, req);
        }

        if (password !== validPw) {
          return json({ error: "wrong-password" }, 401, req);
        }

        const token = rand(24);
        const role = isAdmin ? "admin" : ((customUser && customUser.role) || "editor");
        const departments = customUser ? (customUser.departments || []) : [];
        const permissions = customUser ? (customUser.permissions || null) : null;
        const session = { token, email, role, departments, permissions, createdAt: Date.now() };
        await env.ARSAN.put(KEYS.sessions(token), JSON.stringify(session), { expirationTtl: 60 * 60 * 24 * 30 });

        // update lastLogin on user record
        if (userIdx >= 0) {
          users[userIdx].lastLogin = Date.now();
          users[userIdx].loginCount = (users[userIdx].loginCount || 0) + 1;
          await env.ARSAN.put(KEYS.users, JSON.stringify(users));
        }

        await logActivity(env, { actor: email, action: "login", target: role });

        return json({ token, email, role, departments, permissions }, 200, req);
      }

      if (path === "/api/logout" && method === "POST") {
        const s = await getSession(req, env);
        if (s) {
          await env.ARSAN.delete(KEYS.sessions(s.token));
          await logActivity(env, { actor: s.email, action: "logout" });
        }
        return json({ ok: true }, 200, req);
      }

      if (path === "/api/me" && method === "GET") {
        const s = await getSession(req, env);
        if (!s) return json({ role: "viewer" }, 200, req);
        return json({
          email: s.email,
          role: s.role,
          departments: s.departments || [],
          permissions: s.permissions || null
        }, 200, req);
      }

      // ---------- BOOTSTRAP ----------
      if (path === "/api/bootstrap" && method === "GET") {
        const [sopsRaw, depsRaw, deptsRaw] = await Promise.all([
          env.ARSAN.get(KEYS.sops),
          env.ARSAN.get(KEYS.deps),
          env.ARSAN.get(KEYS.customDepts),
        ]);
        const sops = sopsRaw ? JSON.parse(sopsRaw) : {};
        const deps = depsRaw ? JSON.parse(depsRaw) : [];
        const customDepts = deptsRaw ? JSON.parse(deptsRaw) : [];
        return json({ sops, deps, customDepts }, 200, req);
      }

      // ---------- SOPs ----------
      if (path.match(/^\/api\/sops\/[^\/]+$/) && method === "GET") {
        const dept = path.split("/")[3];
        const raw = await env.ARSAN.get(KEYS.sops);
        const all = raw ? JSON.parse(raw) : {};
        return json(all[dept] || {}, 200, req);
      }

      if (path.match(/^\/api\/sops\/[^\/]+\/[^\/]+$/) && method === "PUT") {
        const ed = await requireEditor(req, env);
        if (ed.error) return json(ed, 403, req);
        const [_, __, ___, dept, code] = path.split("/");
        const body = await req.json();
        const raw = await env.ARSAN.get(KEYS.sops);
        const all = raw ? JSON.parse(raw) : {};
        all[dept] = all[dept] || {};
        all[dept][code] = { ...all[dept][code], ...body, updatedAt: Date.now(), updatedBy: ed.session.email };
        await env.ARSAN.put(KEYS.sops, JSON.stringify(all));
        await logActivity(env, { actor: ed.session.email, action: "edit-sop", target: `${dept}/${code}`, dept, code, fields: Object.keys(body) });
        return json({ ok: true, sop: all[dept][code] }, 200, req);
      }

      if (path.match(/^\/api\/sops\/[^\/]+$/) && method === "POST") {
        const ed = await requireEditor(req, env);
        if (ed.error) return json(ed, 403, req);
        const dept = path.split("/")[3];
        const body = await req.json();
        const raw = await env.ARSAN.get(KEYS.sops);
        const all = raw ? JSON.parse(raw) : {};
        all[dept] = all[dept] || {};
        all[dept][body.code] = { ...body, createdAt: Date.now(), createdBy: ed.session.email };
        await env.ARSAN.put(KEYS.sops, JSON.stringify(all));
        await logActivity(env, { actor: ed.session.email, action: "add-sop", target: `${dept}/${body.code}`, dept, code: body.code, title: body.title });
        return json({ ok: true }, 200, req);
      }

      if (path.match(/^\/api\/sops\/[^\/]+\/[^\/]+$/) && method === "DELETE") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const [_, __, ___, dept, code] = path.split("/");
        const raw = await env.ARSAN.get(KEYS.sops);
        const all = raw ? JSON.parse(raw) : {};
        if (all[dept]) delete all[dept][code];
        await env.ARSAN.put(KEYS.sops, JSON.stringify(all));
        await logActivity(env, { actor: ad.session.email, action: "delete-sop", target: `${dept}/${code}` });
        return json({ ok: true }, 200, req);
      }

      // ---------- DEPS ----------
      if (path === "/api/deps" && method === "GET") {
        const raw = await env.ARSAN.get(KEYS.deps);
        return json(raw ? JSON.parse(raw) : [], 200, req);
      }
      if (path === "/api/deps" && method === "POST") {
        const ed = await requireEditor(req, env);
        if (ed.error) return json(ed, 403, req);
        const body = await req.json();
        const raw = await env.ARSAN.get(KEYS.deps);
        const deps = raw ? JSON.parse(raw) : [];
        body.id = body.id || "d-" + Date.now();
        body.createdBy = ed.session.email;
        body.createdAt = Date.now();
        deps.push(body);
        await env.ARSAN.put(KEYS.deps, JSON.stringify(deps));
        await logActivity(env, { actor: ed.session.email, action: "add-dep", target: `${body.from.dept}/${body.from.code} → ${body.to.dept}/${body.to.code}` });
        return json({ ok: true, dep: body }, 200, req);
      }
      if (path.match(/^\/api\/deps\/[^\/]+$/) && method === "DELETE") {
        const ed = await requireEditor(req, env);
        if (ed.error) return json(ed, 403, req);
        const id = path.split("/")[3];
        const raw = await env.ARSAN.get(KEYS.deps);
        const deps = raw ? JSON.parse(raw) : [];
        const filtered = deps.filter(d => d.id !== id);
        await env.ARSAN.put(KEYS.deps, JSON.stringify(filtered));
        await logActivity(env, { actor: ed.session.email, action: "delete-dep", target: id });
        return json({ ok: true }, 200, req);
      }

      // ---------- CHAT ----------
      if (path.match(/^\/api\/chat\/[^\/]+$/) && method === "GET") {
        const ch = path.split("/")[3];
        const raw = await env.ARSAN.get(KEYS.chat(ch));
        return json(raw ? JSON.parse(raw) : [], 200, req);
      }
      if (path.match(/^\/api\/chat\/[^\/]+$/) && method === "POST") {
        const s = await getSession(req, env);
        if (!s) return json({ error: "unauthorized" }, 401, req);
        const ch = path.split("/")[3];
        const body = await req.json();
        const msg = {
          id: "m-" + Date.now() + "-" + rand(4),
          ts: Date.now(),
          author: s.email,
          role: s.role,
          text: (body.text || "").slice(0, 2000),
        };
        const raw = await env.ARSAN.get(KEYS.chat(ch));
        const list = raw ? JSON.parse(raw) : [];
        list.push(msg);
        if (list.length > 500) list.splice(0, list.length - 500);
        await env.ARSAN.put(KEYS.chat(ch), JSON.stringify(list));
        await logActivity(env, { actor: s.email, action: "chat", target: `#${ch}`, preview: msg.text.slice(0, 80) });
        return json({ ok: true, msg }, 200, req);
      }

      // ---------- ACTIVITY (admin only) ----------
      if (path === "/api/activity" && method === "GET") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const raw = await env.ARSAN.get(KEYS.activity);
        return json(raw ? JSON.parse(raw) : [], 200, req);
      }

      // ---------- USERS (admin only) ----------
      if (path === "/api/users" && method === "GET") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const raw = await env.ARSAN.get(KEYS.users);
        const list = raw ? JSON.parse(raw) : [];
        // hide passwords but include department/role/status/lastLogin
        return json(list.map(u => ({
          email: u.email,
          role: u.role || "editor",
          departments: u.departments || (u.department ? [u.department] : []),
          status: u.status || "active",
          lastLogin: u.lastLogin || null,
          addedAt: u.addedAt,
          addedBy: u.addedBy,
          permissions: u.permissions || null,
          hasPassword: !!u.password,
          pendingInvite: !!u.inviteToken,
        })), 200, req);
      }
      if (path === "/api/users" && method === "POST") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const body = await req.json();
        const email = (body.email || "").trim().toLowerCase();
        if (!email) return json({ error: "email-required" }, 400, req);
        const editorDomain = (env.EDITOR_DOMAIN || "@arsann.com").toLowerCase();
        if (!email.endsWith(editorDomain)) return json({ error: "invalid-domain" }, 400, req);
        const raw = await env.ARSAN.get(KEYS.users);
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(u => u.email.toLowerCase() === email);
        const existing = idx >= 0 ? list[idx] : {};
        const entry = {
          ...existing,
          email,
          password: body.password !== undefined ? body.password : (existing.password || env.DEFAULT_PASSWORD || "arsan2026"),
          role: body.role || existing.role || "editor",
          departments: Array.isArray(body.departments) ? body.departments : (existing.departments || []),
          status: body.status || existing.status || "active",
          permissions: body.permissions || existing.permissions || null,
          addedAt: existing.addedAt || Date.now(),
          addedBy: existing.addedBy || ad.session.email,
          updatedAt: Date.now(),
          updatedBy: ad.session.email,
        };
        if (idx >= 0) list[idx] = entry; else list.push(entry);
        await env.ARSAN.put(KEYS.users, JSON.stringify(list));
        await logActivity(env, { actor: ad.session.email, action: idx >= 0 ? "update-user" : "add-user", target: email });
        return json({ ok: true }, 200, req);
      }
      // PATCH: update user (role, departments, status, permissions) without touching password
      if (path.match(/^\/api\/users\/[^\/]+$/) && method === "PATCH") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const email = decodeURIComponent(path.split("/")[3]).toLowerCase();
        const body = await req.json().catch(() => ({}));
        const raw = await env.ARSAN.get(KEYS.users);
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(u => u.email.toLowerCase() === email);
        if (idx < 0) return json({ error: "not-found" }, 404, req);
        const cur = list[idx];
        const patch = {};
        if (body.role !== undefined) patch.role = body.role;
        if (Array.isArray(body.departments)) patch.departments = body.departments;
        if (body.status !== undefined) patch.status = body.status;
        if (body.permissions !== undefined) patch.permissions = body.permissions;
        list[idx] = { ...cur, ...patch, updatedAt: Date.now(), updatedBy: ad.session.email };
        await env.ARSAN.put(KEYS.users, JSON.stringify(list));
        await logActivity(env, { actor: ad.session.email, action: "update-user", target: email, fields: Object.keys(patch) });
        return json({ ok: true }, 200, req);
      }
      if (path.match(/^\/api\/users\/[^\/]+$/) && method === "DELETE") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const email = decodeURIComponent(path.split("/")[3]).toLowerCase();
        const raw = await env.ARSAN.get(KEYS.users);
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter(u => u.email.toLowerCase() !== email);
        await env.ARSAN.put(KEYS.users, JSON.stringify(filtered));
        await logActivity(env, { actor: ad.session.email, action: "remove-user", target: email });
        return json({ ok: true }, 200, req);
      }

      // ---------- INVITE: admin creates, user accepts via token ----------
      if (path === "/api/users/invite" && method === "POST") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const body = await req.json().catch(() => ({}));
        const email = (body.email || "").trim().toLowerCase();
        if (!email) return json({ error: "email-required" }, 400, req);
        const editorDomain = (env.EDITOR_DOMAIN || "@arsann.com").toLowerCase();
        if (!email.endsWith(editorDomain)) return json({ error: "invalid-domain" }, 400, req);
        const token = rand(20);
        const raw = await env.ARSAN.get(KEYS.users);
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(u => u.email.toLowerCase() === email);
        const existing = idx >= 0 ? list[idx] : {};
        const entry = {
          ...existing,
          email,
          role: body.role || existing.role || "editor",
          departments: Array.isArray(body.departments) ? body.departments : (existing.departments || []),
          status: "pending",
          inviteToken: token,
          inviteExpires: Date.now() + 7 * 24 * 3600 * 1000,
          password: existing.password || null, // invalid until accepted
          addedAt: existing.addedAt || Date.now(),
          addedBy: existing.addedBy || ad.session.email,
        };
        if (idx >= 0) list[idx] = entry; else list.push(entry);
        await env.ARSAN.put(KEYS.users, JSON.stringify(list));
        await logActivity(env, { actor: ad.session.email, action: "invite-user", target: email });

        // Build full invite URL
        const origin = (env.PUBLIC_URL || req.headers.get("origin") || "").replace(/\/$/, "");
        const inviteUrl = `${origin}/dashboard.html?invite=${token}&email=${encodeURIComponent(email)}`;
        const notify = await sendUserNotification(env, {
          email,
          subject: "دعوة للانضمام إلى لوحة إجراءات أرسان",
          bodyText: `مرحباً،\n\nتمت دعوتك للانضمام إلى لوحة إجراءات أرسان التشغيلية بصلاحية "${entry.role}".\n\nاضغط على الزر أدناه لقبول الدعوة وتعيين كلمة السر الخاصة بك.\n\nالدعوة صالحة لمدة 7 أيام.`,
          actionUrl: inviteUrl,
          actionLabel: "قبول الدعوة وتعيين كلمة السر",
        });
        return json({ ok: true, token, inviteUrl, notify }, 200, req);
      }
      // Accept invite: sets password, activates account
      if (path === "/api/users/accept-invite" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const token = (body.token || "").toString();
        const password = (body.password || "").toString();
        if (!token || password.length < 6) return json({ error: "invalid" }, 400, req);
        const raw = await env.ARSAN.get(KEYS.users);
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(u => u.inviteToken === token);
        if (idx < 0) return json({ error: "invalid-token" }, 404, req);
        const u = list[idx];
        if (u.inviteExpires && u.inviteExpires < Date.now()) return json({ error: "token-expired" }, 410, req);
        u.password = password;
        u.status = "active";
        delete u.inviteToken;
        delete u.inviteExpires;
        u.activatedAt = Date.now();
        list[idx] = u;
        await env.ARSAN.put(KEYS.users, JSON.stringify(list));
        await logActivity(env, { actor: u.email, action: "accept-invite", target: u.email });
        return json({ ok: true, email: u.email }, 200, req);
      }
      // Reset password: admin issues a reset token
      if (path.match(/^\/api\/users\/[^\/]+\/reset$/) && method === "POST") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const email = decodeURIComponent(path.split("/")[3]).toLowerCase();
        const body = await req.json().catch(() => ({}));
        const raw = await env.ARSAN.get(KEYS.users);
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(u => u.email.toLowerCase() === email);
        if (idx < 0) return json({ error: "not-found" }, 404, req);
        if (body.newPassword) {
          // direct set
          list[idx].password = body.newPassword;
          delete list[idx].resetToken;
          await env.ARSAN.put(KEYS.users, JSON.stringify(list));
          await logActivity(env, { actor: ad.session.email, action: "reset-password-direct", target: email });
          return json({ ok: true, mode: "direct" }, 200, req);
        }
        const token = rand(20);
        list[idx].resetToken = token;
        list[idx].resetExpires = Date.now() + 2 * 24 * 3600 * 1000;
        await env.ARSAN.put(KEYS.users, JSON.stringify(list));
        await logActivity(env, { actor: ad.session.email, action: "reset-password-invite", target: email });

        const origin = (env.PUBLIC_URL || req.headers.get("origin") || "").replace(/\/$/, "");
        const resetUrl = `${origin}/dashboard.html?reset=${token}&email=${encodeURIComponent(email)}`;
        const notify = await sendUserNotification(env, {
          email,
          subject: "إعادة تعيين كلمة السر — لوحة أرسان",
          bodyText: `تم طلب إعادة تعيين كلمة السر لحسابك في لوحة إجراءات أرسان.\n\nاضغط على الزر أدناه لاختيار كلمة سر جديدة.\n\nهذا الرابط صالح لمدة 48 ساعة.\n\nإذا لم تطلب ذلك، تجاهل هذه الرسالة.`,
          actionUrl: resetUrl,
          actionLabel: "إعادة تعيين كلمة السر",
        });
        return json({ ok: true, mode: "token", token, resetUrl, notify }, 200, req);
      }

      // Forgot password: any user requests reset; admin gets notified in Slack
      if (path === "/api/users/forgot-password" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const email = (body.email || "").toLowerCase().trim();
        if (!email) return json({ error: "email-required" }, 400, req);
        const raw = await env.ARSAN.get(KEYS.users);
        const list = raw ? JSON.parse(raw) : [];
        const user = list.find(u => u.email === email);
        // Don't reveal if user exists — always return ok to prevent enumeration
        if (!user) {
          await logActivity(env, { actor: email, action: "forgot-password-unknown", target: email });
          return json({ ok: true, queued: true }, 200, req);
        }
        // Notify admins via Slack channel
        const webhookUrl = env.SLACK_WEBHOOK_URL || await env.ARSAN.get(KEYS.slack);
        if (webhookUrl) {
          try {
            const msg = `🔑 *طلب إعادة تعيين كلمة السر*\n\n👤 المستخدم: \`${email}\`\n📅 التوقيت: ${new Date().toLocaleString("ar-SA")}\n\n_يرجى من المسؤول الدخول إلى لوحة المستخدمين وإعادة تعيين كلمة السر._`;
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: msg }),
            });
          } catch (e) { /* non-fatal */ }
        }
        await logActivity(env, { actor: email, action: "forgot-password-request", target: email });
        return json({ ok: true, queued: true }, 200, req);
      }

      // Apply reset: user submits new password with token
      if (path === "/api/users/apply-reset" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const token = (body.token || "").toString();
        const newPassword = (body.newPassword || "").toString();
        if (!token || !newPassword) return json({ error: "token-and-password-required" }, 400, req);
        if (newPassword.length < 6) return json({ error: "password-too-short" }, 400, req);
        const raw = await env.ARSAN.get(KEYS.users);
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(u => u.resetToken === token);
        if (idx < 0) return json({ error: "invalid-token" }, 404, req);
        if (list[idx].resetExpires && list[idx].resetExpires < Date.now()) return json({ error: "token-expired" }, 410, req);
        list[idx].password = newPassword;
        list[idx].status = "active";
        delete list[idx].resetToken;
        delete list[idx].resetExpires;
        await env.ARSAN.put(KEYS.users, JSON.stringify(list));
        await logActivity(env, { actor: list[idx].email, action: "apply-reset", target: list[idx].email });
        return json({ ok: true, email: list[idx].email }, 200, req);
      }

      // ---------- SLACK WEBHOOK (admin only) ----------
      if (path === "/api/slack-webhook" && method === "GET") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const url = await env.ARSAN.get(KEYS.slack);
        return json({ url: url || "" }, 200, req);
      }
      if (path === "/api/slack-webhook" && method === "POST") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const body = await req.json();
        await env.ARSAN.put(KEYS.slack, body.url || "");
        await logActivity(env, { actor: ad.session.email, action: "set-slack-webhook" });
        return json({ ok: true }, 200, req);
      }

      // ---------- UPDATES BANNER ----------
      // GET /api/updates-url → admin only, returns current source URL
      if (path === "/api/updates-url" && method === "GET") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const url = await env.ARSAN.get(KEYS.updatesUrl);
        return json({ url: url || "" }, 200, req);
      }
      // POST /api/updates-url { url } → admin sets the Google Doc (pub?embedded) URL
      if (path === "/api/updates-url" && method === "POST") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const body = await req.json().catch(() => ({}));
        await env.ARSAN.put(KEYS.updatesUrl, body.url || "");
        await env.ARSAN.delete(KEYS.updatesCache); // invalidate cache
        await logActivity(env, { actor: ad.session.email, action: "set-updates-url" });
        return json({ ok: true }, 200, req);
      }
      // GET /api/updates → public, returns { html, fetchedAt, items[] }
      // Caches for 5 minutes. Fetches the configured URL (Google Doc published-to-web, or any URL returning HTML/text)
      if (path === "/api/updates" && method === "GET") {
        const s = await getSession(req, env);
        if (!s) return json({ error: "unauthorized" }, 401, req);

        const cacheRaw = await env.ARSAN.get(KEYS.updatesCache);
        const now = Date.now();
        if (cacheRaw) {
          const cache = JSON.parse(cacheRaw);
          if (now - cache.fetchedAt < 5 * 60 * 1000) {
            return json(cache, 200, req);
          }
        }

        const srcUrl = await env.ARSAN.get(KEYS.updatesUrl);
        if (!srcUrl) {
          return json({ html: "", items: [], fetchedAt: now, source: null }, 200, req);
        }

        try {
          const res = await fetch(srcUrl, {
            headers: { "User-Agent": "ArsanSOPs/1.0" },
            cf: { cacheTtl: 60, cacheEverything: true }
          });
          if (!res.ok) throw new Error(`fetch-failed-${res.status}`);
          let text = await res.text();

          // Strip Google Docs wrapper (if it's a pub?embedded=true)
          const isGoogleDoc = /docs\.google\.com/.test(srcUrl);
          let html = text;
          let items = [];

          if (isGoogleDoc) {
            // Extract the body contents from Google's HTML
            const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) html = bodyMatch[1];
            // Remove Google's inline styles & scripts
            html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
            html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
            // Strip class/id attrs (Google's c1, c2…)
            html = html.replace(/\s(class|id)="[^"]*"/gi, "");
            // Strip inline style="..."
            html = html.replace(/\sstyle="[^"]*"/gi, "");
          }

          // Extract list items as "items" (for banner rotation)
          const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
          items = liMatches.map(m => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean);
          // Fallback: paragraph-split
          if (items.length === 0) {
            const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
            items = pMatches.map(m => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean);
          }

          const payload = { html, items, fetchedAt: now, source: srcUrl };
          await env.ARSAN.put(KEYS.updatesCache, JSON.stringify(payload), { expirationTtl: 600 });
          return json(payload, 200, req);
        } catch (e) {
          return json({ html: "", items: [], fetchedAt: now, error: e.message }, 200, req);
        }
      }

      // ---------- CUSTOM DEPARTMENTS (admin only) ----------
      // GET /api/custom-depts → returns array of { id, name, icon, color, addedAt, addedBy }
      if (path === "/api/custom-depts" && method === "GET") {
        const s = await getSession(req, env);
        if (!s) return json({ error: "unauthorized" }, 401, req);
        const raw = await env.ARSAN.get(KEYS.customDepts);
        return json(raw ? JSON.parse(raw) : [], 200, req);
      }
      // POST /api/custom-depts  { id, name, icon?, color? } — admin only
      if (path === "/api/custom-depts" && method === "POST") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const body = await req.json().catch(() => ({}));
        const id = (body.id || "").toString().trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
        const name = (body.name || "").toString().trim();
        if (!id || !name) return json({ error: "id-and-name-required" }, 400, req);
        const raw = await env.ARSAN.get(KEYS.customDepts);
        const list = raw ? JSON.parse(raw) : [];
        if (list.find(d => d.id === id)) return json({ error: "id-exists" }, 409, req);
        // also block if it clashes with built-in ids
        const builtins = ["projects","executive","finance","hr","design","planning","procurement","maintenance","execution"];
        if (builtins.includes(id)) return json({ error: "id-reserved" }, 409, req);
        const entry = {
          id, name,
          icon: body.icon || "📂",
          color: body.color || "#d4a83c",
          addedAt: Date.now(),
          addedBy: ad.session.email
        };
        list.push(entry);
        await env.ARSAN.put(KEYS.customDepts, JSON.stringify(list));
        await logActivity(env, { actor: ad.session.email, action: "add-dept", target: id, name });
        return json({ ok: true, dept: entry }, 200, req);
      }
      // PATCH /api/custom-depts/:id  { name?, icon?, color? } — admin only
      if (path.match(/^\/api\/custom-depts\/[^\/]+$/) && method === "PATCH") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const id = decodeURIComponent(path.split("/")[3]);
        const body = await req.json().catch(() => ({}));
        const raw = await env.ARSAN.get(KEYS.customDepts);
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(d => d.id === id);
        if (idx < 0) return json({ error: "not-found" }, 404, req);
        if (body.name !== undefined) list[idx].name = body.name;
        if (body.icon !== undefined) list[idx].icon = body.icon;
        if (body.color !== undefined) list[idx].color = body.color;
        list[idx].updatedAt = Date.now();
        list[idx].updatedBy = ad.session.email;
        await env.ARSAN.put(KEYS.customDepts, JSON.stringify(list));
        await logActivity(env, { actor: ad.session.email, action: "update-dept", target: id });
        return json({ ok: true, dept: list[idx] }, 200, req);
      }
      // DELETE /api/custom-depts/:id — admin only
      if (path.match(/^\/api\/custom-depts\/[^\/]+$/) && method === "DELETE") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const id = decodeURIComponent(path.split("/")[3]);
        const raw = await env.ARSAN.get(KEYS.customDepts);
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter(d => d.id !== id);
        if (filtered.length === list.length) return json({ error: "not-found" }, 404, req);
        await env.ARSAN.put(KEYS.customDepts, JSON.stringify(filtered));
        await logActivity(env, { actor: ad.session.email, action: "delete-dept", target: id });
        return json({ ok: true }, 200, req);
      }

      // ---------- DEBUG: Slack test (admin only) ----------
      // POST /api/debug/slack-test  { email: "a.kurdi@arsann.com" }
      // Returns the raw Slack API responses so we can see exactly what's happening.
      if (path === "/api/debug/slack-test" && method === "POST") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const body = await req.json().catch(() => ({}));
        const email = (body.email || ad.session.email || "").toString().toLowerCase();
        if (!email) return json({ error: "email required" }, 400, req);
        const diag = {
          botTokenConfigured: !!env.SLACK_BOT_TOKEN,
          botTokenPrefix: env.SLACK_BOT_TOKEN ? env.SLACK_BOT_TOKEN.slice(0, 5) + "…" : null,
          email,
          steps: []
        };

        if (!env.SLACK_BOT_TOKEN) {
          diag.steps.push({ step: "check-token", ok: false, error: "SLACK_BOT_TOKEN not set in Worker secrets" });
          return json(diag, 200, req);
        }

        // Step 1: auth.test — verify the token itself
        try {
          const r = await fetch("https://slack.com/api/auth.test", {
            headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}` }
          });
          const j = await r.json();
          diag.steps.push({ step: "auth.test", httpStatus: r.status, response: j });
          if (!j.ok) {
            return json({ ...diag, verdict: "Token invalid — fix this first" }, 200, req);
          }
        } catch (e) {
          diag.steps.push({ step: "auth.test", error: e.message });
          return json(diag, 200, req);
        }

        // Step 2: users.lookupByEmail
        let userId = null;
        try {
          const r = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
            headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}` }
          });
          const j = await r.json();
          diag.steps.push({ step: "users.lookupByEmail", httpStatus: r.status, response: j });
          if (!j.ok) {
            return json({ ...diag, verdict: `Lookup failed: ${j.error}` }, 200, req);
          }
          userId = j.user?.id;
        } catch (e) {
          diag.steps.push({ step: "users.lookupByEmail", error: e.message });
          return json(diag, 200, req);
        }

        // Step 3: conversations.open — open a DM channel explicitly
        let dmChannel = null;
        try {
          const r = await fetch("https://slack.com/api/conversations.open", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
              "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ users: userId })
          });
          const j = await r.json();
          diag.steps.push({ step: "conversations.open", httpStatus: r.status, response: j });
          if (!j.ok) {
            return json({ ...diag, verdict: `Cannot open DM: ${j.error}` }, 200, req);
          }
          dmChannel = j.channel?.id;
        } catch (e) {
          diag.steps.push({ step: "conversations.open", error: e.message });
          return json(diag, 200, req);
        }

        // Step 4: chat.postMessage — send a test message
        try {
          const r = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
              "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({
              channel: dmChannel,
              text: `🧪 *اختبار Slack من Arsan SOPs*\n\nإذا وصلتك هذه الرسالة، نظام الإشعارات يعمل بنجاح.\n\nالوقت: ${new Date().toISOString()}`
            })
          });
          const j = await r.json();
          diag.steps.push({ step: "chat.postMessage", httpStatus: r.status, response: j });
          diag.verdict = j.ok
            ? "✅ تم الإرسال بنجاح — تفقّد Slack الآن"
            : `❌ فشل الإرسال: ${j.error}`;
        } catch (e) {
          diag.steps.push({ step: "chat.postMessage", error: e.message });
        }

        return json(diag, 200, req);
      }

      // ---------- SOP: rename/move (change code, dept, or title) ----------
      if (path.match(/^\/api\/sops\/[^\/]+\/[^\/]+\/rename$/) && method === "POST") {
        const ed = await requireEditor(req, env);
        if (ed.error) return json(ed, 403, req);
        const [_, __, ___, dept, code] = path.split("/");
        const body = await req.json();
        const raw = await env.ARSAN.get(KEYS.sops);
        const all = raw ? JSON.parse(raw) : {};
        if (!all[dept] || !all[dept][code]) return json({ error: "not-found" }, 404, req);
        const cur = all[dept][code];
        const newDept = (body.newDept || dept).toString();
        const newCode = (body.newCode || code).toString();
        const newTitle = body.newTitle !== undefined ? body.newTitle : cur.title;
        // Validate: if target exists and isn't the same slot, refuse
        if ((newDept !== dept || newCode !== code) && all[newDept] && all[newDept][newCode]) {
          return json({ error: "target-exists", message: `الكود ${newCode} موجود مسبقاً في ${newDept}` }, 409, req);
        }
        const moved = { ...cur, code: newCode, title: newTitle, updatedAt: Date.now(), updatedBy: ed.session.email };
        all[newDept] = all[newDept] || {};
        all[newDept][newCode] = moved;
        if (newDept !== dept || newCode !== code) {
          delete all[dept][code];
        }
        await env.ARSAN.put(KEYS.sops, JSON.stringify(all));
        // also update any deps that reference the old identity
        if (newDept !== dept || newCode !== code) {
          const drraw = await env.ARSAN.get(KEYS.deps);
          const deps = drraw ? JSON.parse(drraw) : [];
          let changed = false;
          for (const d of deps) {
            if (d.from && d.from.dept === dept && d.from.code === code) { d.from.dept = newDept; d.from.code = newCode; changed = true; }
            if (d.to   && d.to.dept   === dept && d.to.code   === code) { d.to.dept   = newDept; d.to.code   = newCode; changed = true; }
          }
          if (changed) await env.ARSAN.put(KEYS.deps, JSON.stringify(deps));
        }
        await logActivity(env, {
          actor: ed.session.email, action: "rename-sop",
          target: `${dept}/${code} → ${newDept}/${newCode}`,
          titleChanged: newTitle !== cur.title,
        });
        return json({ ok: true, sop: moved, dept: newDept, code: newCode }, 200, req);
      }

      // ---------- ANNOUNCEMENTS (shared notifications) ----------
      if (path === "/api/announcements" && method === "GET") {
        const raw = await env.ARSAN.get(KEYS.announcements);
        const list = raw ? JSON.parse(raw) : [];
        return json(list, 200, req);
      }
      if (path === "/api/announcements" && method === "POST") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const body = await req.json().catch(() => ({}));
        const text = (body.text || "").toString().trim();
        if (!text) return json({ error: "empty" }, 400, req);
        const raw = await env.ARSAN.get(KEYS.announcements);
        const list = raw ? JSON.parse(raw) : [];
        const a = {
          id: "ann-" + Date.now(),
          text: text.slice(0, 500),
          kind: (body.kind || "info").toString(),
          author: ad.session.email,
          ts: Date.now(),
        };
        list.unshift(a);
        // cap at 50
        await env.ARSAN.put(KEYS.announcements, JSON.stringify(list.slice(0, 50)));
        await logActivity(env, { actor: ad.session.email, action: "add-announcement", target: a.id, preview: a.text.slice(0, 80) });
        return json({ ok: true, announcement: a }, 200, req);
      }
      if (path.match(/^\/api\/announcements\/[^\/]+$/) && method === "DELETE") {
        const ad = await requireAdmin(req, env);
        if (ad.error) return json(ad, 403, req);
        const id = path.split("/")[3];
        const raw = await env.ARSAN.get(KEYS.announcements);
        const list = raw ? JSON.parse(raw) : [];
        const next = list.filter(x => x.id !== id);
        await env.ARSAN.put(KEYS.announcements, JSON.stringify(next));
        await logActivity(env, { actor: ad.session.email, action: "delete-announcement", target: id });
        return json({ ok: true }, 200, req);
      }

      // ---------- AI: parse raw text into a structured SOP ----------
      if (path === "/api/ai/parse-sop" && method === "POST") {
        const me = await getSession(req, env);
        if (!me) return json({ error: "unauthorized" }, 401, req);
        if (!env.ANTHROPIC_API_KEY) return json({ error: "ai-not-configured" }, 503, req);
        const body = await req.json().catch(() => ({}));
        const raw = (body.text || "").toString().trim();
        const sourceHint = (body.source || "").toString().slice(0, 200);
        const deptHint = (body.dept || "").toString();
        if (!raw) return json({ error: "empty" }, 400, req);
        // clip to ~20k chars to stay within token budget
        const clipped = raw.slice(0, 20000);

        // rate-limit (same bucket as /api/ai)
        const rlKey = `ratelimit_ai_${me.email}_${Math.floor(Date.now()/3600000)}`;
        const count = parseInt(await env.ARSAN.get(rlKey) || "0", 10);
        if (count >= 20) return json({ error: "rate-limited", message: "تجاوزت الحد (20/ساعة)" }, 429, req);
        await env.ARSAN.put(rlKey, String(count+1), { expirationTtl: 3700 });

        const system = `أنت مساعد يحوّل نص خام (إجراء، نموذج، محضر...) إلى هيكل JSON لإجراء تشغيلي في منصة Arsan.
أعد JSON فقط (بدون أي نص قبله أو بعده) بالبنية التالية بالضبط:
{
  "title": "string عنوان واضح",
  "code": "string كود مقترح مثل PM-03 (حرفان لاتينيان + رقم)",
  "purpose": "string الغرض بجملة أو جملتين",
  "scope": "string النطاق",
  "steps": ["string خطوة 1", "..."],
  "kpis": ["string KPI مع رقم/معيار"],
  "roles": [{"name":"الدور","duties":"المسؤوليات"}],
  "inputs": ["string"],
  "outputs": ["string"],
  "tools": ["string"],
  "risks": ["string"],
  "notes": "string ملاحظات إضافية أو فارغ"
}
- كل الحقول النصية بالعربية.
- إذا كان الحقل غير موجود في النص، اترك قيمة افتراضية معقولة أو [] أو "".
- steps يجب أن تكون 3-10 خطوات عملية قابلة للتنفيذ.
- title مختصر (<60 حرف).`;

        const userMsg = `الإدارة المقترحة: ${deptHint || "غير محددة"}
المصدر: ${sourceHint || "نص مستورد"}

النص الخام:
---
${clipped}
---

حوّله إلى JSON الهيكل المطلوب.`;

        try {
          const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5",
              max_tokens: 2048,
              system,
              messages: [{ role: "user", content: userMsg }]
            })
          });
          const data = await aiRes.json();
          if (!aiRes.ok) {
            return json({ error: "ai-error", status: aiRes.status, message: data?.error?.message || "Upstream error" }, 502, req);
          }
          const txt = (data.content || []).map(b => b.text || "").join("").trim();
          // extract JSON (tolerant — strip leading/trailing fences)
          const jsonMatch = txt.match(/\{[\s\S]*\}/);
          let parsed = null;
          if (jsonMatch) {
            try { parsed = JSON.parse(jsonMatch[0]); } catch(e) { /* fallthrough */ }
          }
          if (!parsed) {
            return json({ error: "parse-failed", rawReply: txt.slice(0, 500) }, 502, req);
          }
          await logActivity(env, { actor: me.email, action: "ai-parse-sop", target: (parsed.title || "").slice(0,120), source: sourceHint });
          return json({ ok: true, sop: parsed, usage: data.usage }, 200, req);
        } catch (e) {
          return json({ error: "ai-fetch-failed", message: String(e && e.message || e) }, 502, req);
        }
      }

      // ---------- AI (Anthropic Claude) ----------
      if (path === "/api/ai" && method === "POST") {
        const me = await getSession(req, env);
        if (!me) return json({ error: "unauthorized" }, 401, req);
        if (!env.ANTHROPIC_API_KEY) return json({ error: "ai-not-configured", message: "ANTHROPIC_API_KEY secret is not set on this Worker." }, 503, req);

        const body = await req.json().catch(() => ({}));
        const userMsg = (body.message || "").toString().trim();
        const systemMsg = (body.system || "أنت مساعد ذكي لمنصة Arsan لإدارة الإجراءات التشغيلية. أجب باختصار ووضوح بنفس لغة سؤال المستخدم (عربي أو إنجليزي). ساعد في صياغة الإجراءات، KPIs، والخطوات التشغيلية.").toString();
        const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

        if (!userMsg) return json({ error: "empty-message" }, 400, req);

        // Rate-limit: 20 calls/user/hour
        const rlKey = `ratelimit_ai_${me.email}_${Math.floor(Date.now()/3600000)}`;
        const count = parseInt(await env.ARSAN.get(rlKey) || "0", 10);
        if (count >= 20) return json({ error: "rate-limited", message: "تجاوزت الحد (20 طلب/ساعة). حاول لاحقاً." }, 429, req);
        await env.ARSAN.put(rlKey, String(count+1), { expirationTtl: 3700 });

        const messages = [...history, { role: "user", content: userMsg }];

        try {
          const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5",
              max_tokens: 1024,
              system: systemMsg,
              messages
            })
          });
          const data = await aiRes.json();
          if (!aiRes.ok) {
            await logActivity(env, { actor: me.email, action: "ai-error", status: aiRes.status, err: data?.error?.message });
            return json({ error: "ai-error", status: aiRes.status, message: data?.error?.message || "Upstream error" }, 502, req);
          }
          const reply = (data.content || []).map(b => b.text || "").join("").trim();
          await logActivity(env, { actor: me.email, action: "ai-query", target: userMsg.slice(0,120), tokens: data.usage });
          return json({ ok: true, reply, usage: data.usage }, 200, req);
        } catch (e) {
          return json({ error: "ai-fetch-failed", message: String(e && e.message || e) }, 502, req);
        }
      }

      // ---------- HEALTH ----------
      if (path === "/api/health") return json({ ok: true, time: Date.now() }, 200, req);

      return json({ error: "not-found", path }, 404, req);
    } catch (e) {
      return json({ error: "server-error", message: String(e && e.message || e) }, 500, req);
    }
  },
};

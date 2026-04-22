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
        return json({ email: s.email, role: s.role }, 200, req);
      }

      // ---------- BOOTSTRAP ----------
      if (path === "/api/bootstrap" && method === "GET") {
        const [sopsRaw, depsRaw] = await Promise.all([
          env.ARSAN.get(KEYS.sops),
          env.ARSAN.get(KEYS.deps),
        ]);
        const sops = sopsRaw ? JSON.parse(sopsRaw) : {};
        const deps = depsRaw ? JSON.parse(depsRaw) : [];
        return json({ sops, deps }, 200, req);
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
        return json({ ok: true, token, inviteUrl: `?invite=${token}&email=${encodeURIComponent(email)}` }, 200, req);
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
        return json({ ok: true, mode: "token", token, resetUrl: `?reset=${token}&email=${encodeURIComponent(email)}` }, 200, req);
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

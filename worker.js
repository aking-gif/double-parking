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
        const customUser = users.find(u => u.email.toLowerCase() === email);

        const validPw = customUser ? customUser.password : defaultPw;
        if (password !== validPw) {
          return json({ error: "wrong-password" }, 401, req);
        }

        const token = rand(24);
        const role = email === adminEmail ? "admin" : "editor";
        const session = { token, email, role, createdAt: Date.now() };
        await env.ARSAN.put(KEYS.sessions(token), JSON.stringify(session), { expirationTtl: 60 * 60 * 24 * 30 });

        await logActivity(env, { actor: email, action: "login", target: role });

        return json({ token, email, role }, 200, req);
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
        // hide passwords
        return json(list.map(u => ({ email: u.email, addedAt: u.addedAt, addedBy: u.addedBy })), 200, req);
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
        const entry = { email, password: body.password || env.DEFAULT_PASSWORD || "arsan2026", addedAt: Date.now(), addedBy: ad.session.email };
        if (idx >= 0) list[idx] = entry; else list.push(entry);
        await env.ARSAN.put(KEYS.users, JSON.stringify(list));
        await logActivity(env, { actor: ad.session.email, action: "add-user", target: email });
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

      // ---------- HEALTH ----------
      if (path === "/api/health") return json({ ok: true, time: Date.now() }, 200, req);

      return json({ error: "not-found", path }, 404, req);
    } catch (e) {
      return json({ error: "server-error", message: String(e && e.message || e) }, 500, req);
    }
  },
};

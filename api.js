/* ================================================================
   Arsan API Layer
   يتصل بـ Cloudflare Worker. لو ما فيه API_BASE، كل شيء محلي.
   ================================================================ */

// ضع رابط Cloudflare Worker هنا بعد نشره (أو اتركه فارغاً للوضع المحلي)
window.API_BASE = window.API_BASE || "";

(function(){
  const TOKEN_KEY = "arsan_token_v1";
  const ME_KEY    = "arsan_me_v1";
  const ADMIN_EMAIL = "a.king@arsann.com";
  const EDITOR_DOMAIN = "@arsann.com";
  const DEFAULT_PASSWORD = "arsan2026";

  function getToken(){ return localStorage.getItem(TOKEN_KEY); }
  function setToken(t){ t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }
  function getMe(){ try { return JSON.parse(localStorage.getItem(ME_KEY) || 'null'); } catch(_){ return null; } }
  function setMe(m){ m ? localStorage.setItem(ME_KEY, JSON.stringify(m)) : localStorage.removeItem(ME_KEY); }
  function hasBackend(){ return !!window.API_BASE; }

  async function apiFetch(path, opts = {}) {
    if (!hasBackend()) throw new Error("no-backend");
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(window.API_BASE.replace(/\/$/,"") + path, {
      ...opts, headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "api-error"), { status: res.status, data });
    return data;
  }

  /* ---------- Auth (local fallback if no backend) ---------- */
  async function login(email, password) {
    email = (email || "").trim().toLowerCase();
    if (!email.endsWith(EDITOR_DOMAIN)) throw new Error("invalid-domain");
    if (hasBackend()) {
      const r = await apiFetch("/api/login", { method: "POST", body: { email, password } });
      setToken(r.token); setMe({ email: r.email, role: r.role });
      return r;
    }
    // local fallback
    if (password !== DEFAULT_PASSWORD) throw new Error("wrong-password");
    const role = email === ADMIN_EMAIL ? "admin" : "editor";
    const me = { email, role };
    setToken("local-" + Date.now()); setMe(me);
    return me;
  }
  async function logout() {
    if (hasBackend() && getToken()) {
      try { await apiFetch("/api/logout", { method: "POST" }); } catch(_) {}
    }
    setToken(null); setMe(null);
  }
  function me() { return getMe() || { role: "viewer" }; }
  function isEditor() { const m = me(); return m.role === "editor" || m.role === "admin"; }
  function isAdmin()  { return me().role === "admin"; }

  /* ---------- Remote + Local merge helpers ---------- */
  async function bootstrap() {
    if (!hasBackend()) return { sops:{}, deps: loadLocalDeps() };
    try { return await apiFetch("/api/bootstrap"); }
    catch(e) { console.warn("bootstrap failed, using local:", e); return { sops:{}, deps: loadLocalDeps() }; }
  }

  /* ---------- SOP edits ---------- */
  async function updateSOP(dept, code, patch) {
    const me_ = me();
    if (!isEditor()) throw new Error("forbidden");
    if (hasBackend()) return apiFetch(`/api/sops/${dept}/${code}`, { method: "PUT", body: patch });
    // local: store in arsan_sops_<dept>
    const key = `arsan_sops_${dept}`;
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : {};
    arr[code] = { ...(arr[code]||{}), ...patch, updatedAt: Date.now(), updatedBy: me_.email };
    localStorage.setItem(key, JSON.stringify(arr));
    logLocalActivity({ actor: me_.email, action: "edit-sop", target: `${dept}/${code}`, fields: Object.keys(patch) });
    return { ok: true };
  }

  async function addSOP(dept, sop) {
    if (!isEditor()) throw new Error("forbidden");
    if (hasBackend()) return apiFetch(`/api/sops/${dept}`, { method: "POST", body: sop });
    const key = `arsan_sops_${dept}`;
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : {};
    arr[sop.code] = { ...sop, createdAt: Date.now(), createdBy: me().email };
    localStorage.setItem(key, JSON.stringify(arr));
    logLocalActivity({ actor: me().email, action: "add-sop", target: `${dept}/${sop.code}`, title: sop.title });
    return { ok: true };
  }

  /* ---------- Dependencies ---------- */
  const DEPS_LOCAL_KEY = "arsan_deps_v1";
  function loadLocalDeps(){ try { return JSON.parse(localStorage.getItem(DEPS_LOCAL_KEY) || '[]'); } catch(_){ return []; } }
  function saveLocalDeps(deps){ localStorage.setItem(DEPS_LOCAL_KEY, JSON.stringify(deps)); }

  async function getDeps() {
    if (hasBackend()) { try { return await apiFetch("/api/deps"); } catch(_) { return loadLocalDeps(); } }
    return loadLocalDeps();
  }
  async function addDep(dep) {
    if (!isEditor()) throw new Error("forbidden");
    if (hasBackend()) return apiFetch("/api/deps", { method: "POST", body: dep });
    const deps = loadLocalDeps();
    dep.id = dep.id || ("d-" + Date.now());
    dep.createdBy = me().email; dep.createdAt = Date.now();
    deps.push(dep); saveLocalDeps(deps);
    logLocalActivity({ actor: me().email, action: "add-dep", target: `${dep.from.dept}/${dep.from.code} → ${dep.to.dept}/${dep.to.code}` });
    return { ok: true, dep };
  }
  async function removeDep(id) {
    if (!isEditor()) throw new Error("forbidden");
    if (hasBackend()) return apiFetch(`/api/deps/${id}`, { method: "DELETE" });
    const deps = loadLocalDeps().filter(d => d.id !== id);
    saveLocalDeps(deps);
    logLocalActivity({ actor: me().email, action: "delete-dep", target: id });
    return { ok: true };
  }

  /* ---------- Chat ---------- */
  const CHAT_LOCAL_PREFIX = "arsan_chat_";
  async function getChat(channel) {
    if (hasBackend()) { try { return await apiFetch(`/api/chat/${channel}`); } catch(_){} }
    try { return JSON.parse(localStorage.getItem(CHAT_LOCAL_PREFIX + channel) || '[]'); } catch(_){ return []; }
  }
  async function postChat(channel, text) {
    if (!isEditor()) throw new Error("login-required");
    if (hasBackend()) return apiFetch(`/api/chat/${channel}`, { method: "POST", body: { text } });
    const msg = { id: "m-" + Date.now(), ts: Date.now(), author: me().email, role: me().role, text };
    const raw = localStorage.getItem(CHAT_LOCAL_PREFIX + channel);
    const list = raw ? JSON.parse(raw) : [];
    list.push(msg);
    localStorage.setItem(CHAT_LOCAL_PREFIX + channel, JSON.stringify(list));
    logLocalActivity({ actor: me().email, action: "chat", target: `#${channel}`, preview: text.slice(0,80) });
    return { ok: true, msg };
  }

  /* ---------- Activity Log (admin only sees all) ---------- */
  const ACT_LOCAL_KEY = "arsan_activity_local";
  function logLocalActivity(entry){
    try {
      const list = JSON.parse(localStorage.getItem(ACT_LOCAL_KEY) || '[]');
      list.unshift({ ts: Date.now(), ...entry });
      if (list.length > 500) list.length = 500;
      localStorage.setItem(ACT_LOCAL_KEY, JSON.stringify(list));
    } catch(_){}
  }
  async function getActivity() {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) { try { return await apiFetch("/api/activity"); } catch(_){} }
    try { return JSON.parse(localStorage.getItem(ACT_LOCAL_KEY) || '[]'); } catch(_){ return []; }
  }

  /* ---------- Users (admin only) ---------- */
  async function getUsers() {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch("/api/users");
    return [];
  }
  async function addUser(email, password) {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch("/api/users", { method:"POST", body: { email, password } });
    return { ok: true, note: "local mode — no shared users" };
  }
  async function removeUser(email) {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch(`/api/users/${encodeURIComponent(email)}`, { method:"DELETE" });
    return { ok: true };
  }

  /* ---------- Slack webhook (admin only) ---------- */
  const SLACK_LOCAL_KEY = "arsan_slack_webhook";
  async function getSlackWebhook() {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) { const r = await apiFetch("/api/slack-webhook"); return r.url || ""; }
    return localStorage.getItem(SLACK_LOCAL_KEY) || "";
  }
  async function setSlackWebhook(url) {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch("/api/slack-webhook", { method:"POST", body: { url } });
    localStorage.setItem(SLACK_LOCAL_KEY, url || "");
    return { ok: true };
  }

  /* ---------- Expose ---------- */
  window.ArsanAPI = {
    hasBackend, getToken, me, isEditor, isAdmin,
    login, logout,
    bootstrap,
    updateSOP, addSOP,
    getDeps, addDep, removeDep,
    getChat, postChat,
    getActivity,
    getUsers, addUser, removeUser,
    getSlackWebhook, setSlackWebhook,
    ADMIN_EMAIL, EDITOR_DOMAIN, DEFAULT_PASSWORD
  };
})();

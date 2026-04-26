/* ================================================================
   Arsan API Layer  (shared by dashboard.html + users.html + index.html)
   يتصل بـ Cloudflare Worker. لو ما فيه API_BASE، كل شيء محلي.
   ================================================================ */

window.API_BASE = window.API_BASE || "https://arsan-api.a-king-6e1.workers.dev";

(function(){
  if (window.ArsanAPI && window.ArsanAPI.__loaded) return; // avoid double-load

  const TOKEN_KEY = "arsan_token_v1";
  const ME_KEY    = "arsan_me_v1";
  const ADMIN_EMAIL = "a.king@arsann.com";
  const EDITOR_DOMAIN = "@arsann.com";

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

  /* ---------- Auth (backend-only) ---------- */
  async function login(email, password) {
    email = (email || "").trim().toLowerCase();
    if (!email.endsWith(EDITOR_DOMAIN)) throw new Error("invalid-domain");
    if (!password) throw new Error("password-required");
    if (!hasBackend()) throw new Error("backend-required");
    const r = await apiFetch("/api/login", { method: "POST", body: { email, password } });
    setToken(r.token); setMe({ email: r.email, role: r.role, name: r.name, departments: r.departments });
    try { window.dispatchEvent(new CustomEvent('arsan:login', { detail: { email: r.email, role: r.role } })); } catch(_){}
    return r;
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
  function isLoggedIn() { const m = me(); return !!(m && m.email); }

  /* ---------- Bootstrap ---------- */
  const DEPS_LOCAL_KEY = "arsan_deps_v1";
  function loadLocalDeps(){ try { return JSON.parse(localStorage.getItem(DEPS_LOCAL_KEY) || '[]'); } catch(_){ return []; } }
  function saveLocalDeps(deps){ localStorage.setItem(DEPS_LOCAL_KEY, JSON.stringify(deps)); }

  async function bootstrap() {
    if (!hasBackend()) return { sops:{}, deps: loadLocalDeps() };
    try { return await apiFetch("/api/bootstrap"); }
    catch(e) { console.warn("bootstrap failed, using local:", e); return { sops:{}, deps: loadLocalDeps() }; }
  }

  /* ---------- SOPs ---------- */
  async function updateSOP(dept, code, patch) {
    const me_ = me();
    if (!me_ || !me_.email) throw new Error("login-required");
    if (hasBackend()) return apiFetch(`/api/sops/${dept}/${code}`, { method: "PUT", body: patch });
    const key = `arsan_sops_${dept}`;
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : {};
    arr[code] = { ...(arr[code]||{}), ...patch, updatedAt: Date.now(), updatedBy: me_.email };
    localStorage.setItem(key, JSON.stringify(arr));
    logLocalActivity({ actor: me_.email, action: "edit-sop", target: `${dept}/${code}`, fields: Object.keys(patch) });
    return { ok: true };
  }
  async function addSOP(dept, sop) {
    if (!me() || !me().email) throw new Error("login-required");
    if (hasBackend()) return apiFetch(`/api/sops/${dept}`, { method: "POST", body: sop });
    const key = `arsan_sops_${dept}`;
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : {};
    arr[sop.code] = { ...sop, createdAt: Date.now(), createdBy: me().email };
    localStorage.setItem(key, JSON.stringify(arr));
    logLocalActivity({ actor: me().email, action: "add-sop", target: `${dept}/${sop.code}`, title: sop.title });
    return { ok: true };
  }
  async function renameSOP(dept, code, changes) {
    if (!me() || !me().email) throw new Error("login-required");
    if (hasBackend()) return apiFetch(`/api/sops/${dept}/${code}/rename`, { method: "POST", body: changes });
    const key = `arsan_sops_${dept}`;
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : {};
    if (!arr[code]) throw new Error("not-found");
    const cur = arr[code];
    const newDept = changes.newDept || dept;
    const newCode = changes.newCode || code;
    const newTitle = changes.newTitle !== undefined ? changes.newTitle : cur.title;
    const moved = { ...cur, code: newCode, title: newTitle, updatedAt: Date.now(), updatedBy: me().email };
    if (newDept === dept) {
      delete arr[code]; arr[newCode] = moved;
      localStorage.setItem(key, JSON.stringify(arr));
    } else {
      delete arr[code]; localStorage.setItem(key, JSON.stringify(arr));
      const newKey = `arsan_sops_${newDept}`;
      const dst = JSON.parse(localStorage.getItem(newKey) || '{}');
      dst[newCode] = moved;
      localStorage.setItem(newKey, JSON.stringify(dst));
    }
    logLocalActivity({ actor: me().email, action: "rename-sop", target: `${dept}/${code} → ${newDept}/${newCode}` });
    return { ok: true, sop: moved, dept: newDept, code: newCode };
  }
  async function aiParseSOP(text, opts = {}) {
    if (!hasBackend() || !getToken()) throw new Error("backend-required");
    return apiFetch("/api/ai/parse-sop", { method: "POST", body: { text, source: opts.source || "", dept: opts.dept || "" } });
  }

  /* ---------- Deps ---------- */
  async function getDeps() {
    if (hasBackend()) { try { return await apiFetch("/api/deps"); } catch(_) { return loadLocalDeps(); } }
    return loadLocalDeps();
  }
  async function addDep(dep) {
    if (!me() || !me().email) throw new Error("login-required");
    if (hasBackend()) return apiFetch("/api/deps", { method: "POST", body: dep });
    const deps = loadLocalDeps();
    dep.id = dep.id || ("d-" + Date.now());
    dep.createdBy = me().email; dep.createdAt = Date.now();
    deps.push(dep); saveLocalDeps(deps);
    return { ok: true, dep };
  }
  async function removeDep(id) {
    if (!me() || !me().email) throw new Error("login-required");
    if (hasBackend()) return apiFetch(`/api/deps/${id}`, { method: "DELETE" });
    const deps = loadLocalDeps().filter(d => d.id !== id);
    saveLocalDeps(deps);
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
    return { ok: true, msg };
  }

  /* ---------- Activity ---------- */
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

  /* ---------- Users ---------- */
  async function getUsers() {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch("/api/users");
    return [];
  }
  async function addUser(email, password, opts = {}) {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch("/api/users", { method:"POST", body: {
      email, password,
      role: opts.role || "editor",
      departments: opts.departments || [],
      status: opts.status || "active",
      permissions: opts.permissions || null
    }});
    return { ok: true, note: "local mode" };
  }
  async function updateUser(email, patch) {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch(`/api/users/${encodeURIComponent(email)}`, { method:"PATCH", body: patch });
    return { ok: true };
  }
  async function disableUser(email)  { return updateUser(email, { status: "disabled" }); }
  async function enableUser(email)   { return updateUser(email, { status: "active" }); }
  async function removeUser(email) {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch(`/api/users/${encodeURIComponent(email)}`, { method:"DELETE" });
    return { ok: true };
  }
  async function inviteUser(email, opts = {}) {
    if (!isAdmin()) throw new Error("admin-only");
    // Support both signatures: inviteUser({email, role, ...}) or inviteUser(email, {role,...})
    if (typeof email === 'object' && email) { opts = email; email = opts.email; }
    if (hasBackend()) return apiFetch("/api/users/invite", { method:"POST", body: {
      email, role: opts.role || "editor", departments: opts.departments || []
    }});
    return { ok: false, note: "local mode" };
  }
  async function acceptInvite(token, password) {
    if (hasBackend()) return apiFetch("/api/users/accept-invite", { method:"POST", body: { token, password }});
    throw new Error("backend-required");
  }
  async function resetUserPassword(email, opts = {}) {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch(`/api/users/${encodeURIComponent(email)}/reset`, {
      method:"POST", body: opts.newPassword ? { newPassword: opts.newPassword } : {}
    });
    return { ok: false, note: "local mode" };
  }
  async function applyReset(token, newPassword) {
    if (hasBackend()) return apiFetch("/api/users/apply-reset", { method:"POST", body: { token, newPassword }});
    throw new Error("backend-required");
  }
  async function forgotPassword(email) {
    if (hasBackend()) return apiFetch("/api/users/forgot-password", { method:"POST", body: { email }});
    throw new Error("backend-required");
  }

  /* ---------- Slack ---------- */
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

  /* ---------- Announcements ---------- */
  async function getAnnouncements() {
    if (hasBackend()) {
      try { return await apiFetch("/api/announcements"); }
      catch(_) { return []; }
    }
    return [];
  }
  async function addAnnouncement(a) {
    if (!isAdmin()) throw new Error("admin-only");
    // Map composer shape → Worker payload. Keep `body` for backwards compat.
    const payload = {
      title: a.title || "",
      text:  a.body || a.text || "",
      kind:  a.priority === "urgent" ? "urgent" : (a.kind || "info"),
      notifyAll: a.notifyAll !== false
    };
    if (hasBackend()) return apiFetch("/api/announcements", { method: "POST", body: payload });
    return { ok: false, note: "local-only" };
  }
  async function deleteAnnouncement(id) {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch(`/api/announcements/${encodeURIComponent(id)}`, { method: "DELETE" });
    return { ok: true };
  }

  /* ---------- Announcements ---------- */
  async function getAnnouncements() {
    if (hasBackend()) {
      try {
        const r = await apiFetch("/api/announcements");
        // Worker returns either an array or {list:[...]}
        return Array.isArray(r) ? r : (r.list || r.announcements || []);
      } catch (e) { /* fallthrough to local */ }
    }
    try { return JSON.parse(localStorage.getItem("arsan_announcements_v1") || "[]"); }
    catch (_) { return []; }
  }
  async function addAnnouncement(a) {
    if (!isAdmin()) throw new Error("admin-only");
    // Normalize payload for the Worker. Also surface notification prefs
    // (notifyAll=true → DM every user via Bot Token when configured).
    const payload = {
      title: a.title || "",
      text: a.body || a.text || "",
      kind: a.priority === "urgent" ? "urgent"
          : a.priority === "warn"   ? "warn"
          : a.priority === "success"? "success"
          : "info",
      // Always broadcast to the Slack channel (if a webhook is configured);
      // optionally DM each user (if a Bot Token is configured).
      notifyAll: a.notifyAll !== false,
    };
    if (hasBackend()) {
      const r = await apiFetch("/api/announcements", { method:"POST", body: payload });
      return r.announcement || r;
    }
    // Local fallback
    const list = JSON.parse(localStorage.getItem("arsan_announcements_v1") || "[]");
    list.unshift({ ...a, id: a.id || ("a-" + Date.now()) });
    localStorage.setItem("arsan_announcements_v1", JSON.stringify(list.slice(0, 50)));
    return a;
  }
  async function deleteAnnouncement(id) {
    if (!isAdmin()) throw new Error("admin-only");
    if (hasBackend()) return apiFetch(`/api/announcements/${encodeURIComponent(id)}`, { method:"DELETE" });
    const list = JSON.parse(localStorage.getItem("arsan_announcements_v1") || "[]");
    localStorage.setItem("arsan_announcements_v1", JSON.stringify(list.filter(x => x.id !== id)));
    return { ok: true };
  }

  /* ---------- AI ---------- */
  /* ---------- KV (generic store) ---------- */
  async function kvGet(key){
    if (!hasBackend()) {
      try { return JSON.parse(localStorage.getItem('arsan_kv_'+key) || 'null'); }
      catch(_){ return null; }
    }
    try {
      return await apiFetch('/api/kv/' + encodeURIComponent(key));
    } catch(e){
      // fallback to local cache
      try { return JSON.parse(localStorage.getItem('arsan_kv_'+key) || 'null'); }
      catch(_){ return null; }
    }
  }
  async function kvPut(key, value){
    // always cache locally so reload on same browser still has it
    try { localStorage.setItem('arsan_kv_'+key, JSON.stringify(value)); } catch(_){}
    if (!hasBackend()) return { ok: true, local: true };
    return await apiFetch('/api/kv/' + encodeURIComponent(key), { method:'PUT', body: value });
  }

  async function ai(message, opts = {}) {
    const history = opts.history || [];
    const system  = opts.system;
    if (hasBackend() && getToken()) {
      try {
        const r = await apiFetch("/api/ai", { method:"POST", body: { message, history, system } });
        return r.reply || "";
      } catch (e) { console.warn("worker AI failed:", e); }
    }
    if (window.claude && typeof window.claude.complete === "function") {
      try {
        const msgs = [...history, { role: "user", content: message }];
        return await window.claude.complete({ messages: msgs, system });
      } catch (e) { console.warn("window.claude fallback failed:", e); }
    }
    throw new Error("ai-unavailable");
  }

  /* ---------- Expose ---------- */
  window.ArsanAPI = {
    __loaded: true,
    hasBackend, getToken, me, isEditor, isAdmin, isLoggedIn,
    login, logout,
    bootstrap,
    updateSOP, addSOP, renameSOP, aiParseSOP,
    getDeps, addDep, removeDep,
    getChat, postChat,
    getActivity,
    getUsers, addUser, updateUser, disableUser, enableUser, removeUser,
    inviteUser, acceptInvite, resetUserPassword, applyReset, forgotPassword,
    getSlackWebhook, setSlackWebhook,
    getAnnouncements, addAnnouncement, deleteAnnouncement,
    get: kvGet, put: kvPut,
    ai,
    ADMIN_EMAIL, EDITOR_DOMAIN
  };
})();

/* ================================================================
   Auth + Edit Mode + Dependencies + Unified Map
   ملحق جديد — يعتمد على المتغيرات العالمية:
   DEPARTMENTS_CONFIG, DEPT_EN, DEPT, CURRENT_DEPT_ID, SOPS, STORAGE_KEY
   renderGrid, renderChips, updateStats, renderBrainMap
   ================================================================ */

/* ---------- AUTH ---------- */
const AUTH_PASSWORD = "arsan2026"; // كلمة السر المطلوبة للتحرير
const AUTH_DOMAIN   = "@arsann.com";
const AUTH_KEY      = "arsan_auth_v1";

function loadAuth(){
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
  catch(_){ return null; }
}
function saveAuth(obj){
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(obj)); } catch(_){}
}
function isEditor(){
  const a = loadAuth();
  return !!(a && a.email && a.email.toLowerCase().endsWith(AUTH_DOMAIN) && a.ok);
}
function currentEditor(){
  const a = loadAuth();
  return a ? a.email : null;
}
function logout(){
  localStorage.removeItem(AUTH_KEY);
  location.reload();
}

/* ---------- DEPENDENCIES ---------- */
/* كل تبعية: { id, from:{dept,code}, to:{dept,code}, type, note } */
const DEPS_KEY = "arsan_deps_v1";

// التبعيات المبدئية — أوامر Senior Management: كل مشتريات → موافقة التنفيذي + المالية
const DEFAULT_DEPS = [
  // كل المشتريات تتطلب موافقة التنفيذي والمالية
  { id:"d-001", from:{dept:"projects", code:"SOP-06"}, to:{dept:"executive", code:"EXE-05"}, type:"approval", note:"موافقة الرئيس التنفيذي على قرارات المشتريات" },
  { id:"d-002", from:{dept:"projects", code:"SOP-06"}, to:{dept:"finance",   code:"FIN-04"}, type:"approval", note:"موافقة المالية على صرف المشتريات" },
  { id:"d-003", from:{dept:"projects", code:"SOP-07"}, to:{dept:"executive", code:"EXE-05"}, type:"approval", note:"موافقة الرئيس التنفيذي" },
  { id:"d-004", from:{dept:"projects", code:"SOP-07"}, to:{dept:"finance",   code:"FIN-04"}, type:"approval", note:"إقرار الميزانية للمشتريات" },

  // مراجعة قانونية لعقود المشتريات
  { id:"d-010", from:{dept:"projects", code:"SOP-06"}, to:{dept:"legal",     code:"LGL-02"}, type:"review",   note:"مراجعة عقود الموردين" },

  // تعيين HR يحتاج ميزانية مالية
  { id:"d-020", from:{dept:"hr",       code:"HR-01"},  to:{dept:"finance",   code:"FIN-01"}, type:"budget",   note:"يتطلب إقرار الميزانية السنوية" },
  { id:"d-021", from:{dept:"hr",       code:"HR-02"},  to:{dept:"executive", code:"EXE-05"}, type:"approval", note:"موافقة التنفيذي على التعيين" },

  // تطوير الأعمال: الشراكات تحتاج قانوني + تنفيذي
  { id:"d-030", from:{dept:"bizdev",   code:"BD-06"},  to:{dept:"legal",     code:"LGL-01"}, type:"contract", note:"صياغة عقد الشراكة" },
  { id:"d-031", from:{dept:"bizdev",   code:"BD-06"},  to:{dept:"executive", code:"EXE-05"}, type:"approval", note:"موافقة التنفيذي على الشراكة" },
  { id:"d-032", from:{dept:"bizdev",   code:"BD-03"},  to:{dept:"finance",   code:"FIN-01"}, type:"budget",   note:"تسعير العرض يتطلب مدخلات مالية" },

  // التشغيل: الخطة الأسبوعية تغذّي المشاريع
  { id:"d-040", from:{dept:"operations", code:"OPS-01"}, to:{dept:"projects", code:"SOP-10"}, type:"input", note:"الخطة الأسبوعية مدخل للتنفيذ" },

  // المشاريع: التخطيط يحتاج ميزانية
  { id:"d-050", from:{dept:"projects", code:"SOP-03"}, to:{dept:"finance",   code:"FIN-01"}, type:"budget", note:"خطة المشروع تتطلب ميزانية" },

  // التنفيذية: مراجعة الأداء تعتمد على تقارير المالية
  { id:"d-060", from:{dept:"executive", code:"EXE-06"}, to:{dept:"finance",  code:"FIN-07"}, type:"input",    note:"تقارير مالية شهرية لمراجعة الأداء" },
];

function loadDeps(){
  try {
    const raw = localStorage.getItem(DEPS_KEY);
    if (!raw) return [...DEFAULT_DEPS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_DEPS];
  } catch(_){ return [...DEFAULT_DEPS]; }
}
function saveDeps(deps){
  try { localStorage.setItem(DEPS_KEY, JSON.stringify(deps)); } catch(_){}
}
function addDep(dep){
  const deps = loadDeps();
  dep.id = dep.id || ('d-' + Date.now());
  deps.push(dep);
  saveDeps(deps);
  return dep;
}
function removeDep(id){
  const deps = loadDeps().filter(d => d.id !== id);
  saveDeps(deps);
}
function depsForDept(deptId){
  return loadDeps().filter(d => d.from.dept === deptId || d.to.dept === deptId);
}

const DEP_TYPES = {
  approval: { ar:"موافقة",   en:"Approval", color:"#b85450" },
  review:   { ar:"مراجعة",   en:"Review",   color:"#ea9a3e" },
  budget:   { ar:"ميزانية",  en:"Budget",   color:"#5b8def" },
  contract: { ar:"عقد",      en:"Contract", color:"#7c5ab8" },
  input:    { ar:"مدخلات",   en:"Input",    color:"#3a8f66" },
  other:    { ar:"أخرى",     en:"Other",    color:"#6b7280" }
};

/* ---------- Expose as window.Arsan ---------- */
window.Arsan = Object.assign(window.Arsan || {}, {
  AUTH_PASSWORD, AUTH_DOMAIN, AUTH_KEY,
  loadAuth, saveAuth, isEditor, currentEditor, logout,
  DEPS_KEY, DEFAULT_DEPS,
  loadDeps, saveDeps, addDep, removeDep, depsForDept,
  DEP_TYPES
});

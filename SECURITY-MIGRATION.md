# 🔒 Security Migration — V3

تم إصلاح ٣ مشاكل أمنية حرجة:

## ١. كلمات السر الآن مُجزّأة (Hashed)

**قبل:** `password: "arsan2026"` نص صريح في KV.
**الآن:** `passwordHash: "pbkdf2$100000$<salt>$<hash>"` — PBKDF2-SHA256 + salt + 100k iterations.

- الـ login يستخدم `verifyPassword()` بمقارنة constant-time.
- الكلمات القديمة (نص صريح) تُرَحَّل تلقائياً إلى الصيغة الجديدة عند أول تسجيل دخول ناجح.

## ٢. لا توجد كلمة سر افتراضية

**قبل:** أي إيميل في `@arsann.com` يدخل بـ `arsan2026`.
**الآن:**
- المستخدم بدون حساب → **مرفوض** (`no-account`).
- الحساب pending أو بدون `passwordHash` → **مرفوض** (`account-pending`).
- الأدمن لأول مرة → استخدم `ADMIN_BOOTSTRAP_PASSWORD` (متغيّر بيئة) ثم احذفه.

### خطوات الترقية للأدمن:

1. **في Cloudflare Workers → Settings → Variables**:
   - أضف `ADMIN_BOOTSTRAP_PASSWORD` بقيمة قوية مؤقتة.
   - **احذف** `DEFAULT_PASSWORD` (لم يعد مستخدماً).

2. ادخل بإيميل الأدمن + الباسوورد المؤقت → سيُنشأ حسابك بـ hash آمن.

3. **في Cloudflare** → **احذف** `ADMIN_BOOTSTRAP_PASSWORD` فوراً.

4. لإضافة مستخدمين جدد: استخدم **Invite** من لوحة Users (سيختارون كلمة سرهم بأنفسهم).

## ٣. صلاحيات الإدارات صارت محترمة

**قبل:** أي مستخدم مسجّل يقدر يعدّل/يضيف SOPs في **أي إدارة**.
**الآن:** `requireDeptWrite(dept)` — المستخدم يحتاج:
- `role` ≥ editor، **و**
- الإدارة مذكورة في `user.departments` (الأدمن مستثنى).

تطبّق على:
- `PUT /api/sops/:dept/:code` (تعديل SOP)
- `POST /api/sops/:dept` (إضافة SOP)
- `POST /api/sops/:dept/:code/rename` (نقل SOP — يحتاج صلاحية على المصدر **والوجهة**)

`viewer` أو editor بدون إدارات معيّنة = قراءة فقط.

## ٤. شكل بيانات المستخدم موحّد

كل user record يمرّ على `normalizeUser()` يضمن:

```js
{
  email,
  name,                      // مشتق إذا فاضي
  role,                      // admin | editor | viewer
  departments: [],           // مصفوفة دائماً (ترحيل من department المفرد)
  passwordHash: null|string, // pbkdf2 string أو null
  status: "active" | "pending" | "disabled",
  permissions: object|null,
  addedAt, addedBy, lastLogin,
  inviteToken, inviteExpires,
  resetToken, resetExpires,
  profile,
}
```

helpers جديدة:
- `loadUsers(env)` و `saveUsers(env, list)` — كل القراءة/الكتابة تمرّ خلالها.

## ما تغيّر في الواجهة

- إزالة `DEFAULT_PASSWORD` من `dashboard.html` و `api.js`.
- إزالة `local fallback` في login (لا يدخل بدون backend الآن).
- placeholder لكلمة السر في "إضافة مستخدم": "كلمة سر (٦ أحرف على الأقل) — اتركها فارغة لإرسال دعوة".
- إضافة `isLegacyPassword: true` في GET /api/users لتعرف المستخدمين الذين يحتاجون reset.

## نشر

1. ارفع `worker.js` على Cloudflare Workers (Quick edit → Save & Deploy).
2. ارفع `dashboard.html`, `api.js`, `README.md`, `SECURITY-MIGRATION.md` على GitHub.
3. اتبع خطوات "ترقية الأدمن" أعلاه.

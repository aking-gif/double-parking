# 📦 Arsan SOPs — Deployment Bundle (ليلة 23 أبريل 2026)

## الملفات الجديدة/المحدّثة

### 1. Cloudflare Worker
- ✅ `worker.js` — **جديد:** أضيفت endpoints:
  - `/api/custom-depts` (GET/POST/PATCH/DELETE) — الإدارات المخصّصة
  - `/api/updates-url` (GET/POST) — ضبط مصدر التحديثات (Google Doc)
  - `/api/updates` (GET) — يجلب التحديثات من Google Doc مع cache 5 دقائق
  - `/api/me` — الآن يعيد `departments[]` + `permissions`
  - `/api/bootstrap` — الآن يُرجع `customDepts[]` أيضاً

### 2. GitHub Pages
انسخ هذه الملفات كما هي:
- ✅ `index.html` — **مُحدّث:** أضيف Login Gate + فلترة الإدارات + Language Toggle
- ✅ `dashboard.html` — **مُحدّث:** إصلاح AI (router صحيح) + إصلاح رفع الملفات (PDF/DOCX) + banner
- ✅ `users.html` — **مُحدّث:** زر "إعدادات النظام" + banner + i18n
- ✅ `updates-banner.js` — **جديد:** شريط التحديثات الدوّار في أعلى الصفحة
- ✅ `auth-gate.js` — **جديد:** شاشة تسجيل الدخول لصفحة index + فلترة الإدارات
- ✅ `settings.js` — **جديد:** Modal إعدادات النظام (Updates / Depts / Slack)
- ✅ `i18n.js` — **جديد:** زر تبديل اللغة عربي/EN + ترجمات

---

## 🔧 خطوات النشر

### على Cloudflare (Workers):
1. افتح Dashboard → Workers → `arsan-api`
2. اضغط **Quick Edit** (أو حدّث `worker.js` عبر Wrangler)
3. الصق محتويات `worker.js` كاملة
4. اضغط **Save and Deploy**

**متغيرات البيئة المطلوبة** (إن لم تكن مضبوطة سابقاً):
- `SLACK_BOT_TOKEN` — Secret (للـ DM المباشر)
- `SLACK_WEBHOOK_URL` — Variable (للـ fallback القناة العامة)
- `RESEND_API_KEY` — Secret (للإيميل)
- `FROM_EMAIL` — Variable (مثل `noreply@arsann.com`)

### على GitHub (Pages):
ارفع الملفات التالية من مجلد `github-publish/` إلى repo الخاص بـ GitHub Pages:

```
index.html
dashboard.html
users.html
updates-banner.js
auth-gate.js
settings.js
i18n.js
README.md
worker.js (للمرجع — لا يُرفع على Pages)
```

---

## 🧪 اختبار ما بعد النشر

### 1. تسجيل الدخول
- افتح `https://<your-pages-domain>/index.html`
- يجب أن تظهر شاشة تسجيل دخول مباشرة
- سجّل بـ `a.king@arsann.com` → ترى **كل الإدارات**
- سجّل بمستخدم عادي لديه إدارات محدودة → يرى **فقط إداراته**

### 2. شريط التحديثات
- افتح `users.html` بصفة Admin
- اضغط زر **"إعدادات النظام"** (ترس الإعدادات)
- تاب **"شريط التحديثات"** → الصق رابط Google Doc
  - افتح Google Doc → ملف → مشاركة → **النشر على الويب** → Embed → انسخ الرابط المنتهي بـ `pub?embedded=true`
- اضغط **"حفظ الرابط"**
- يجب أن يظهر شريط 📣 في أعلى كل الصفحات بعد لحظات

### 3. الإدارات المخصّصة
- نفس الـ Settings Modal → تاب **"الإدارات المخصّصة"**
- اضغط **"+ إضافة إدارة"** → مثال: `pr` / العلاقات العامة / 📢
- (Frontend لاستخدامها داخل `index.html` لم يُدمج بعد — هذا عمل مستقبلي)

### 4. رفع ملف SOP
- `dashboard.html` → افتح أي إجراء → **✏️ وضع التحرير** → **📎 رفع ملف**
- جرّب PDF أو DOCX → يجب أن يستخرج الحقول ويعرضها للمراجعة

### 5. توليد بالذكاء
- نفس الـ modal → اضغط **"✨ توليد بالذكاء"**
- يجب أن يولّد Purpose/Owner/Steps/KPIs ويعرضها للمراجعة

### 6. تبديل اللغة
- أي صفحة → اضغط 🌐 **EN** (أعلى اليسار)
- يجب أن تنقلب الواجهة إلى English LTR
- اضغط 🌐 **عربي** للرجوع

---

## ⚠️ ملاحظات مهمة

1. **نقطة ضعف معروفة:** صفحة `index.html` لم تعد تعرض الإدارات المخصّصة (`custom-depts`) في القائمة — تعرض فقط الـ 7 الافتراضية. إضافة ذلك تتطلب تعديل الـ `DEPARTMENTS` array في `index.html` لتدمج مع `customDepts` من `/api/bootstrap`. أخبرني إن أردت ذلك.

2. **رفع الملفات يحتاج الوصول إلى `cdnjs.cloudflare.com`** لتحميل مكتبات pdf.js و mammoth.js عند أول استخدام. لو شبكتك تحظر ذلك، قل لي لاستضيفها بدلاً منها.

3. **خدمة `/api/debug/slack-test` ما زالت مفتوحة للجميع** (بدون auth). لأسباب أمنية، أعد إدراج `requireAdmin` أو احذفها نهائياً لما يناسبك.

4. **شريط التحديثات يتحدّث كل 5 دقائق** من الكاش، وكل 10 دقائق من المصدر. للتحديث الفوري: Settings → "إعادة عرض الشريط".

5. **تجاهل المستخدم (Dismiss):** عند إغلاق الشريط، يختفي 7 أيام أو حتى يتغيّر محتوى المصدر. Admin يستطيع إعادة عرضه للجميع من Settings.

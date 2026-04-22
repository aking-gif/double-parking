# Arsan SOPs — Deployment Guide

## ما الموجود
- `dashboard.html` — الواجهة (جاهزة للنشر على GitHub Pages الآن)
- `worker.js` — Cloudflare Worker backend (يحتاج إعداد)
- `auth-edit.js` — ملحق auth + dependencies (مُضمَّن)

## النشر السريع (Frontend فقط، بدون backend)
1. ارفع `dashboard.html` إلى GitHub Pages.
2. يعمل بالكامل محلياً — كل موظف يعدّل على جهازه (بدون مزامنة).

## النشر الكامل مع Backend (مزامنة + Slack + Activity Log)

### الخطوة 1 — حساب Cloudflare مجاني
1. https://dash.cloudflare.com/sign-up
2. Workers & Pages → Create → Create Worker → سمِّه `arsan-sops`.

### الخطوة 2 — KV Namespace
1. Workers & Pages → KV → Create Namespace → اسم: `ARSAN`.
2. افتح Worker `arsan-sops` → Settings → Variables → **KV Namespace Bindings** → Add:
   - Variable name: `ARSAN`
   - KV namespace: `ARSAN`

### الخطوة 3 — Environment Variables
في نفس صفحة Settings → Variables → **Environment Variables**:
```
ADMIN_EMAIL       = a.king@arsann.com
EDITOR_DOMAIN     = @arsann.com
DEFAULT_PASSWORD  = arsan2026
```

### الخطوة 4 — الكود
1. افتح Worker `arsan-sops` → **Quick edit** (أو Edit code).
2. احذف كل المحتوى والصق محتوى `worker.js` بالكامل.
3. **Save and Deploy**.
4. انسخ رابط الـ Worker (مثل: `https://arsan-sops.xxx.workers.dev`).

### الخطوة 5 — ربط الواجهة بالـ Worker
افتح `dashboard.html` وابحث عن:
```js
const API_BASE = ""; // ضع رابط الـ Worker هنا
```
ضع رابط الـ Worker. احفظ وارفع مرة أخرى إلى GitHub Pages.

### الخطوة 6 (اختياري) — Slack Integration
1. Slack → Create new app → Incoming Webhooks → Add to channel.
2. انسخ الـ Webhook URL.
3. افتح dashboard → سجّل دخول كـ admin (a.king@arsann.com / arsan2026) → افتح Admin Panel → الصق الـ URL → Save.

من هذه اللحظة: كل تعديل، إضافة، تبعية، رسالة شات، وتسجيل دخول → يُرسَل إلى Slack تلقائياً.

## الأدوار

| الدور | الصلاحيات |
|---|---|
| `viewer` (أي شخص) | قراءة فقط |
| `editor` (`@arsann.com` + كلمة سر) | تعديل الأوصاف، إضافة محاور/إجراءات/تبعيات، شات |
| `admin` (`a.king@arsann.com` فقط) | كل ما سبق + Activity Log + إدارة المستخدمين + Slack webhook + حذف |

## كلمة السر الافتراضية
`arsan2026` — غيّرها من الـ Worker Environment Variables (`DEFAULT_PASSWORD`).
الـ admin يقدر يضيف مستخدمين جدد بكلمات سر مخصصة من لوحة Admin.

## النسخ الاحتياطي
البيانات كلها في Cloudflare KV. لعمل نسخة:
- افتح Worker → KV → ARSAN → Export (يصدّر JSON).

## الدعم
لأي مشكلة في الإعداد، افتح console المتصفح (F12) — الأخطاء ستظهر واضحة.

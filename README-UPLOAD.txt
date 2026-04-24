# حزمة الرفع — 2026-04-24

## الملفات

1. **favorites.js** — (جديد) نظام المفضلة ⭐
2. **dashboard.html** — لوحة الإدارة (مع ربط favorites.js + توسيع أزرار الإضافة/الاستيراد لكل مستخدم مسجّل + تصحيح نص الـ footer)
3. **index.html** — الصفحة الرئيسية (مع ربط favorites.js لتثبيت الإدارات)
4. **worker.js** — الـ Cloudflare Worker (endpoint جديد /api/favorites)

## خطوات الرفع

### 1) GitHub Pages (الملفات الثلاثة الأولى)
- افتح مستودع الـ GitHub
- ارفع/استبدل: favorites.js, dashboard.html, index.html
- Commit
- انتظر 1-2 دقيقة لانتشار GitHub Pages
- في المتصفح: **Ctrl+Shift+R**

### 2) Cloudflare Worker (worker.js)
- افتح Cloudflare Dashboard
- Workers & Pages → اختر الـ Worker الخاص بك (arsan-api)
- Quick Edit (أو Deploy → Paste)
- استبدل كامل المحتوى بمحتوى worker.js المرفق
- Save & Deploy

## ملاحظة
- إن لم تنشر worker.js، المفضلة ستعمل محلياً فقط (localStorage). بعد نشر الـ Worker، تتزامن عبر الأجهزة.

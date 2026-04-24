# حزمة الرفع — زر الخروج v2

## الإصلاح
- زر الخروج الآن مضمون الظهور لأي مستخدم مسجّل:
  1. في dashboard.html topbar: "🚪 خروج" بعد أزرار الأدمن
  2. كـ FAB عائم احتياطي (logout-button.js) يظهر إن لم يكن في الـ topbar
- تمت إضافة console.log في logout-button.js للتشخيص
  افتح F12 وابحث عن: [logout-fab] render()

## الأسباب المحتملة لعدم ظهور الزر حالياً:
1. **الملفات لم تُرفع بعد على GitHub** — ارفع كل الحزمة
2. **cache المتصفح** — Ctrl+Shift+R (أو افتح tab خاص/incognito)
3. **شريط الأدوات مقصوص** على شاشة صغيرة — الزر موجود لكن خارج الإطار. شاهد الصفحة على شاشة عريضة.

## الملفات
- favorites.js
- logout-button.js (جديد — FAB احتياطي)
- dashboard.html
- index.html
- worker.js → Cloudflare

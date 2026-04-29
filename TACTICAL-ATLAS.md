# Arsann OS — Tactical Atlas Refresh

تحديث بصري شامل للمنصّة. الـ DNA الجديد مستوحى من **Game Settings UI** + **RENON's cinematic dark map** + بقيّة العناصر التي اخترتها.

---

## ما الذي تغيّر

### الفلسفة البصرية
- **Tactical Atlas**: شعور أداة قيادة (Mission Control) بدل لوحة إدارة كلاسيكية.
- **Topographic background**: خلفية خرائط طبوغرافية رفيعة جداً (SVG) لتعطي إحساس عمق.
- **Glass + Brackets**: كل بطاقة لها أركان `⌐ ¬ ⌐ ¬` دقيقة، تتوهّج بالأمبر عند التفاعل.
- **HUD Status Bar**: شريط أعلى يعرض الوقت + التاريخ + مدة الجلسة + breadcrumbs الحالية.
- **Mini-map**: مؤشّر viewport في الزاوية يعطي إحساس "أنت داخل نظام أكبر".

### الألوان
| Token | القيمة | الاستخدام |
|---|---|---|
| `--bg-1` | `#0b0e10` | الخلفية |
| `--ink-0` | `#f4efe4` | عناوين warm white |
| `--accent` | `#E8A547` | الأمبر — للحالات النشطة |
| `--sage` | `#9CB57A` | للنجاح / live |
| `--danger` | `#D86B5C` | للخطأ |

> الأمبر **#E8A547** هو الـ single source للحركة البصرية. لا أكثر من لون accent واحد على الشاشة.

### الخطوط
- **Display / EN**: `Space Grotesk` (هندسي، حادّ)
- **Mono / labels**: `JetBrains Mono` مع tracking عالي 0.16em–0.24em
- **Arabic**: `Cairo` (نظيف، حديث)

### العناصر الجديدة
1. **Status bar** أعلى الشاشة (`arsann-chrome.js` يبنيه تلقائياً)
2. **Breadcrumbs** بصيغة `ARSANN // CORE // CALENDAR`
3. **Corner brackets** على كل البطاقات (CSS pseudo-elements)
4. **Mini-map** زاوية يمين-سفلى مع نقطة amber pulsing
5. **Glass panels** بـ backdrop-filter blur(20px)
6. **X-marked checkboxes** بدل الـ ✓ التقليدي
7. **Topographic SVG** texture خلف كل شي

---

## الملفات الجديدة

| الملف | الدور |
|---|---|
| `arsann-theme.css` | Design tokens + base components (drop-in في أي صفحة جديدة) |
| `arsann-chrome.js` | Status bar + mini-map + bracket helpers (vanilla JS) |
| `arsann-spine-skin.css` | Skin layer فوق spine.html (لا يُعدّل الـ HTML الأصلي) |
| `spine-shared.css` | محدّث بالكامل بالـ palette الجديد + tactical typography |

---

## الملفات المحدّثة

كل واحدة الآن تحمّل `arsann-chrome.js` وتظهر بـ status bar أعلى الشاشة:

- `spine.html` (الصفحة الرئيسية)
- `calendar.html`
- `mail.html`
- `crm.html`
- `hr.html`
- `depts-admin.html`

---

## كيف ترفع التحديث

1. نزّل الـ zip المرفق (`arsann-tactical-atlas.zip`)
2. فكّ الضغط واستبدل **كل** الملفات الموجودة بهذه (أو فقط هذه):
   - `arsann-theme.css` (جديد)
   - `arsann-chrome.js` (جديد)
   - `arsann-spine-skin.css` (جديد)
   - `spine-shared.css` (محدّث)
   - `spine.html` (محدّث)
   - `calendar.html`, `mail.html`, `crm.html`, `hr.html`, `depts-admin.html` (محدّثة)
3. **Ctrl+Shift+R** على المتصفح (يجب لـ كسر الـ cache)

---

## ما يبقى للمستقبل (إن أردت)

- تطبيق نفس الـ DNA على `dashboard.html`, `users.html`, `index.html`
- إضافة scan-line effect خفيف على البطاقات النشطة
- ربط الـ mini-map بالموقع الفعلي للـ scroll position
- إضافة sound effects خفيفة للنقرات (cinematic)

---

**التاريخ**: 2026-04-30
**الإصدار**: V3 — Tactical Atlas

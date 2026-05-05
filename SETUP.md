# SETUP — Arsann Executive OS

دليل تكوين الـ Worker لتفعيل التكاملات (OAuth + Email + Slack).

---

## 1) متغيّرات البيئة (Cloudflare Worker → Settings → Variables)

افتح Cloudflare Dashboard → Workers → `arsan-api` → **Settings → Variables and Secrets**، ثم أضف:

### أساسي (يشتغل من غيرها لكن بدون ميزات)
| اسم المتغيّر | القيمة | ملاحظة |
|---|---|---|
| `ADMIN_EMAIL` | `a.king@arsann.com` | للـ admin elevation |
| `EDITOR_DOMAIN` | `arsann.com` | المحرّرون |
| `FRONTEND_URL` | `https://arsann.com` | للـ OAuth redirect back |

### Email (لإرسال الدعوات + reset)
| اسم المتغيّر | المصدر |
|---|---|
| `RESEND_API_KEY` | من [resend.com](https://resend.com) → API Keys |
| `FROM_EMAIL` | `noreply@arsann.com` (verified domain) |

### Slack (للإشعارات)
| اسم المتغيّر | المصدر |
|---|---|
| `SLACK_WEBHOOK_URL` | Slack App → Incoming Webhooks |
| `SLACK_BOT_TOKEN` | (اختياري) للـ DMs المباشرة |

---

## 2) ربط Google (Calendar + Gmail)

### A) أنشئ مشروع OAuth في Google Cloud
1. اذهب [console.cloud.google.com](https://console.cloud.google.com) → New Project → اسمه `Arsann OS`.
2. **APIs & Services → Library** فعّل:
   - Google Calendar API
   - Gmail API
3. **APIs & Services → OAuth consent screen** → Internal (إذا Workspace) أو External.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://arsan-api.a-king-6e1.workers.dev/api/oauth/google/callback
     ```
5. انسخ `Client ID` و `Client Secret`.

### B) أضِف الـ secrets للـ Worker
| اسم المتغيّر | القيمة |
|---|---|
| `GOOGLE_CLIENT_ID` | الـ Client ID من الخطوة A5 |
| `GOOGLE_CLIENT_SECRET` | الـ Secret من نفس المكان |
| `OAUTH_REDIRECT_URI` | `https://arsan-api.a-king-6e1.workers.dev/api/oauth/google/callback` (اختياري؛ يُحسب تلقائياً) |

---

## 3) ربط Microsoft (Outlook + Teams)

### A) Azure AD App Registration
1. [portal.azure.com](https://portal.azure.com) → Azure Active Directory → App registrations → New.
2. اسم: `Arsann OS`، Account types: Single tenant (Arsann) أو Multi-tenant.
3. Redirect URI (Web):
   ```
   https://arsan-api.a-king-6e1.workers.dev/api/oauth/microsoft/callback
   ```
4. **Certificates & secrets** → New client secret → احتفظ بالقيمة (تظهر مرّة واحدة).
5. **API permissions** → Add → Microsoft Graph → Delegated:
   - `Calendars.ReadWrite`
   - `Mail.Send`
   - `Mail.Read`
   - `User.Read`
   - `offline_access`
6. **Grant admin consent**.

### B) أضِف الـ secrets للـ Worker
| اسم المتغيّر | القيمة |
|---|---|
| `MS_CLIENT_ID` | Application (client) ID |
| `MS_CLIENT_SECRET` | Client secret value |
| `MS_TENANT` | Directory (tenant) ID — أو `common` للـ multi-tenant |

---

## 4) نشر الـ Worker

بعد إضافة المتغيّرات:

1. افتح Cloudflare Dashboard → Workers → `arsan-api` → **Edit Code**.
2. الصق محتوى `worker.js` (من هذه الحزمة).
3. **Save and Deploy**.

أو من CLI (إذا تستخدم wrangler):
```bash
wrangler deploy worker.js
```

---

## 5) اختبار

من المنصّة:
1. سجّل دخول كـ `a.king@arsann.com`.
2. افتح **التقويم** → اضغط "ربط Google Calendar".
3. سيفتح popup يطلب الموافقة → بعد القبول يقول "تم الربط ✓".
4. الـ status بأعلى يصبح "Google ✓".

من API مباشرةً:
```bash
# يجب يرجع 200 مع {google:{connected:true},...}
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://arsan-api.a-king-6e1.workers.dev/api/oauth/status
```

---

## 6) الـ KV Store الجديد (للوحدات الجديدة)

كل البيانات الجماعية تُخزّن في keys عامّة:

| الـ Key | الوحدة | الكتابة |
|---|---|---|
| `meetings_v1` | الاجتماعات | أي مستخدم |
| `calendar_events_v1` | التقويم | أي مستخدم |
| `mail_drafts_v1` | البريد | أي مستخدم |
| `crm_clients_v1` | العملاء | أي مستخدم |
| `crm_pipeline_v1` | خط البيع | أي مستخدم |
| `hr_employees_v1` | الموظّفون | أدمن فقط |
| `hr_leaves_v1` | الإجازات | أي مستخدم |
| `docs_v1` | الوثائق | أي مستخدم |
| `audits_v1` | التدقيقات | أي مستخدم |
| `incidents_v1` | الحوادث | أي مستخدم |
| `risks_v1` | المخاطر | أدمن فقط |
| `kpis_v1` | المؤشّرات | أي مستخدم |
| `vendors_v1` | الموردون | أي مستخدم |
| `expenses_v1` | المصاريف | أي مستخدم |

تُقرأ كلّها من `GET /api/kv/:key`، تُكتب بـ `PUT /api/kv/:key` body=JSON.

---

## مشاكل شائعة

- **"OAuth غير مفعّل"** → نسيت `GOOGLE_CLIENT_ID` أو `MS_CLIENT_ID`. أضفها وأعد deploy.
- **redirect_uri_mismatch** → الـ URI في Google Console ≠ الـ Worker URL. تأكّد متطابقة بالضبط.
- **invalid_client** → الـ secret خطأ أو منتهي. أعد إنشاءه.
- **CORS error** → الـ Worker يُرجع `Access-Control-Allow-Origin` تلقائياً؛ تأكّد من نشر آخر نسخة.

---

**آخر تحديث: 2026-04-29**

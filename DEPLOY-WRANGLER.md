# Deploying the worker with wrangler

`worker.js` does **not** ship when you push. GitHub Pages serves the frontend;
the API is a separate Cloudflare Worker (`arsan-api`). This file replaces the
copy-paste-into-the-dashboard ritual.

The machine is already authenticated (`npm run whoami` to confirm).

## Read this before the first deploy

`wrangler deploy` makes the Worker match `wrangler.toml`. That is the point, and
it is also the trap: **it replaces the Worker's plaintext vars and cron triggers
with whatever the file declares.** Anything configured only in the dashboard and
not written down here is removed on the first deploy.

Two things this repo had to fix before that was safe:

1. **`RESEND_API_KEY` is not a secret.** As of 2026-07-15 the secrets on
   `arsan-api` are `ADMIN_BOOTSTRAP_PASSWORD`, `ANTHROPIC_API_KEY`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SLACK_BOT_TOKEN`,
   `SLACK_WEBHOOK_URL`. `RESEND_API_KEY` is missing from that list but the code
   uses it, so it is a plaintext dashboard var — and `[vars]` does not list it.
   Deploying without migrating it removes it, and outbound email fails
   **silently**: `processAutomationsCron` guards on
   `if (r.channels?.includes("email") && env.RESEND_API_KEY)`, so mail simply
   stops with no error. An API key should be a secret regardless.

       npx wrangler secret put RESEND_API_KEY --name arsan-api
       # paste the key when prompted; it is never written to the repo

2. **`FROM_EMAIL`** is likewise absent from `[vars]`. It is not sensitive, so if
   the dashboard has one, copy its real value into `[vars]` in `wrangler.toml`.
   If it is dropped, the code falls back to `Arsann <noreply@arsann.com>`, which
   may not be a verified Resend sender — in which case sends fail.

Confirm the secret list before deploying:

    npm run secrets

## Deploy

    npm run build     # dry run: bundles and prints the exact bindings to be uploaded
    npm run deploy    # real deploy (runs node --check first via predeploy)

`npm run build` is the safety net — it prints every binding wrangler will
upload. If a var you expect is missing from that list, it is about to be
deleted. Check it, then deploy.

## Cron

`wrangler.toml` declares `crons = ["*/15 * * * *"]` explicitly so a deploy cannot
drop the schedule. The scheduled jobs each gate themselves on a Riyadh window
plus a KV day-stamp, so the shared 15-minute tick is safe:

| Job                    | Window (Asia/Riyadh) | Gate                                  |
|------------------------|----------------------|---------------------------------------|
| `processAutomationsCron` | every tick         | per-item `fireAt` / `nextRun`          |
| `archiveCron`          | 03:00                | `archive` template live                |
| `gmailAutoSyncCron`    | 06:00                | `mail` template not paused             |
| `dailyDigestCron`      | 07:00                | `daily` template live                  |
| `weeklyDigestCron`     | Monday 08:00         | always                                 |

Each claims its KV day-stamp **before** doing the work, so a crash skips the day
rather than double-sending to staff.

## Watch it run

    npm run tail

## Rollback

    npx wrangler rollback --name arsan-api

## Why bother

The repo has been drifting from production because files go up through the
GitHub web UI. `worker.js` in git was missing the entire Google Calendar/Gmail
block that was already live. Deploying from a checkout keeps source and
production honest.

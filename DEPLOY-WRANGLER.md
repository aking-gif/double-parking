# Deploying the worker with wrangler

`worker.js` does **not** ship when you push. GitHub Pages serves the frontend;
the API is a separate Cloudflare Worker (`arsan-api`). This file replaces the
copy-paste-into-the-dashboard ritual.

The machine is already authenticated (`npm run whoami` to confirm).

## The trap, and why it is now closed

`wrangler deploy` makes the Worker match `wrangler.toml`. That is the point, and
it is also the trap: **it replaces the Worker's plaintext vars and cron triggers
with whatever the file declares.** Anything configured only in the dashboard and
not written down here is removed on deploy.

Two config values were sitting in exactly that blast radius and have since been
migrated to secrets (2026-07-15), which are stored separately and survive every
deploy:

- **`RESEND_API_KEY`** — used by the code, absent from both `[vars]` and the
  secret list, so it was a plaintext dashboard var. A deploy would have deleted
  it and outbound email would have failed **silently**: the send paths guard on
  `&& env.RESEND_API_KEY` rather than erroring, so mail just stops. It is an API
  key and belonged in secrets regardless.
- **`FROM_EMAIL`** — same shape, but with a code fallback to
  `Arsann <noreply@arsann.com>`, so it degraded rather than broke.

Both are now secrets. Nothing else is at risk today, but the rule stands: if a
new config value is sensitive, or must survive a deploy, put it in secrets — not
in the dashboard.

    npx wrangler secret put SOME_NAME --name arsan-api
    # value is prompted, never written to the repo

`wrangler secret put` publishes a new version by itself — no `npm run deploy`
needed afterward.

Confirm the secret list before deploying:

    npm run secrets

Expected as of 2026-07-15: `ADMIN_BOOTSTRAP_PASSWORD`, `ANTHROPIC_API_KEY`,
`FROM_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`,
`SLACK_BOT_TOKEN`, `SLACK_WEBHOOK_URL`.

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

# Self-hosting DeclineKit

Self-hosted DeclineKit is free under the AGPL-3.0 license, with no plans or limits. It's also unsupported: issues and pull requests are welcome, but there's no guaranteed help. If you'd rather not run it yourself, [DeclineKit Cloud](https://declinekit.com) is the same code, hosted.

Every option needs the same few settings:

| Variable | What it's for |
|---|---|
| `APP_URL` | The public address of your install, e.g. `https://declinekit.example.com`. Used in emails and card-update links. Must be HTTPS in production. |
| `DATABASE_URL` | Postgres 14 or newer. Vercel's Neon integration and Railway/Render set this for you. |
| `ENCRYPTION_KEY` | 32-byte hex key (`openssl rand -hex 32`) that encrypts stored Stripe keys and webhook secrets. Back it up: without it, stored keys can't be read. |
| `CRON_SECRET` | Random string that protects the scheduled jobs (`openssl rand -hex 24`). |
| `SMTP_URL` | Your SMTP server, e.g. `smtp://user:pass@email-smtp.us-east-1.amazonaws.com:587`. Amazon SES, Postmark, Resend, Mailgun and others all offer SMTP. |
| `MAIL_DOMAIN` | Domain your emails come from (`billing@`, `login@`, `alerts@`). Set up SPF and DKIM for it with your SMTP provider, or recovery emails will land in spam. |
| `FOUNDER_EMAIL` | Optional. Receives alerts about signups, connections and recoveries. |
| `ALLOW_TEST_KEYS` | Optional. `true` accepts Stripe test-mode keys, for trying it out. |

Leave `DECLINEKIT_CLOUD` unset. It turns on the hosted service's marketing site, billing and analytics.

## 1. Deploy to Vercel

The quickest way, with nothing to run yourself.

1. Click the **Deploy with Vercel** button in the [README](README.md#self-hosting). Vercel copies the code to your GitHub account and asks for `APP_URL`, `ENCRYPTION_KEY`, `CRON_SECRET`, `SMTP_URL` and `MAIL_DOMAIN`. For `APP_URL`, use the address Vercel shows for the project (e.g. `https://declinekit-yourname.vercel.app`) or your own domain once you've added it.
2. The first deploy finishes without a database. In the project, open **Storage → Create Database → Neon** (the free plan is plenty) and connect it to the project. This sets `DATABASE_URL`.
3. **Redeploy** (Deployments → ⋯ → Redeploy). The build creates the tables.
4. Continue with [Connect Stripe](#connect-stripe).

**Scheduled jobs on Vercel.** `vercel.json` runs the recovery-email job and the card-expiry check once a day, which works on Vercel's free Hobby plan. Hourly runs send the first recovery email sooner after a failure. For hourly runs, either upgrade to Pro and change the `/api/cron/dunning` schedule in `vercel.json` to `0 * * * *`, or point a free external scheduler (cron-job.org, GitHub Actions, or anything that can send an HTTP request) at:

```
GET https://<your-app>/api/cron/dunning
Authorization: Bearer <CRON_SECRET>
```

## 2. Railway or Render

Both build straight from the repository and offer managed Postgres, with no Docker knowledge needed.

1. Create a new project from your fork of this repository and add a Postgres database. The platform sets `DATABASE_URL`.
2. Add the other variables from the table above.
3. Build command: `npm ci && npm run migrate && npm run build`. Start command: `npm start`.
4. Add two scheduled jobs (both platforms have cron jobs) that request the URLs in [Scheduled jobs](#scheduled-jobs).

## 3. Your own server

Any machine with Node 22 and Postgres 14 or newer.

```bash
git clone https://github.com/jmcbca04/declinekit.git
cd declinekit
npm ci
export DATABASE_URL=postgres://...   # plus the variables above
npm run migrate
npm run build
npm start                            # listens on port 3000
```

Run it under a process manager (systemd, pm2), put a reverse proxy with HTTPS in front of port 3000 (Caddy, nginx), and add the [scheduled jobs](#scheduled-jobs) to cron.

## 4. Docker

If you prefer containers: `cp .env.example .env`, fill it in, then `docker compose up -d`. This starts Postgres, the app on port 3000 (which creates and upgrades its tables on start), and a scheduler for both jobs. Put an HTTPS reverse proxy in front of port 3000.

## Scheduled jobs

Two endpoints, each protected by `CRON_SECRET`:

```
0 * * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/cron/dunning
0 14 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/cron/expiring
```

`dunning` sends the next recovery email for each failed invoice that's due; run it hourly if you can, at least daily. `expiring` warns customers before their card expires; daily is right.

## Connect Stripe

1. Open your `APP_URL` and sign in with your email. A 6-digit code is sent through your SMTP server.
2. Follow the prompt to create a **restricted key** in Stripe with the listed permissions, and paste it in. DeclineKit registers its own webhook on your Stripe account and imports any invoices that are failing right now. (Stripe only sends webhooks to HTTPS addresses.)
3. Set your sender name and reply-to address, preview the four emails, and switch recovery on.
4. Turn off Stripe's own failed-payment emails (Stripe Dashboard → Revenue recovery → Emails) so customers don't get two. Keep Smart Retries on.

The one-click Stripe App install and the in-Dashboard drawers are part of DeclineKit Cloud: the Stripe App is published under DeclineKit's own Stripe account, so self-hosted installs connect with a key instead.

## Upgrading

Pull the latest code and redeploy (or `docker compose up -d --build`). On Vercel and Docker, new database migrations are applied automatically; elsewhere, run `npm run migrate` before `npm start`.

## Notes

- `npm run migrate` sets up an empty database from `db/schema.sql`, then applies anything new in `db/migrations` on later runs.
- `DB_DRIVER=neon` uses Neon's serverless HTTP driver; it's picked automatically for `*.neon.tech` URLs. Everything else uses a standard Postgres connection.
- Sign-in codes and session tokens are stored only as SHA-256 hashes. Stripe keys and webhook secrets are encrypted with AES-256-GCM using `ENCRYPTION_KEY`.

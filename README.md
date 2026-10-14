# Dynamic Skill Graph & Internal Talent Marketplace

A full-stack internal mobility demo built with HTML, CSS, JavaScript, Node.js, Express and Supabase. Fictional employee profiles connect proficiency, projects, certifications, domain experience and workload to explainable candidate matches and personalized learning.

## Run locally

```powershell
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Demo accounts (both use `DemoPass!23`):

- HR / Manager: `hr@skillgraph.test`
- Employee: `employee@skillgraph.test`

The first start generates up to 100 fictional sample employee profiles and persists changes to `data/store.json`. Existing account-linked employee profiles are retained separately from the 100 unlinked sample profiles. Local demo mode needs no database server.

## Supabase

Create a Supabase project, then run `database/supabase.sql` in its SQL Editor. Configure the project URL and server-only service-role key before starting the app:

```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-server-only-service-role-key"
$env:SESSION_SECRET = "replace-with-a-long-random-secret"
npm start
```

Supabase mode stores the complete application state as JSON in the `public.app_state` table. Row-level security is enabled and access is revoked from `anon` and `authenticated`; only the backend service-role key can read or change this row. Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or commit it. This project currently uses Supabase as durable snapshot storage, not as a normalized relational model for each feature.

Existing MySQL `app_state` data and local `data/store.json` data are not migrated automatically. Export the current JSON payload and import it into `public.app_state` before switching a live deployment; otherwise, Supabase initializes a new workspace and bootstrap HR account.

## Walkthrough

1. Sign in as HR and search: `Find employees capable of building a React + Node.js fintech application`. Candidate matches are deterministic and explain their skill findings and gaps.
2. Sign in as the employee. Complete course modules and the application creates a persisted evidence task when all modules are completed. Open **Notifications** in the top bar to see notifications and submit a project, certificate, portfolio link, assessment or other evidence.
3. Sign in as HR, open **Notifications**, review submitted evidence and approve it, reject it with a reason, or request changes. Decisions create employee notifications and an audit entry. Approval records evidence verification metadata but does not automatically change skill proficiency.
4. HR can use **Invite employee** to create a one-time invitation. Invitations expire after 72 hours and accepted employees receive a clean profile. In local mode, the API returns a development acceptance link; production invitations require the email provider below.
5. HR can open **Notifications** to configure approved email domains and a default evidence deadline. Blank deadline disables deadlines; no deadline is invented. Reminders are persisted against task state and checked hourly by the server. The reminder process currently supports 7-day, 3-day, 24-hour and overdue notices.

The demo assessment is automatically scored. Practical-project evidence uses an explicitly labeled employee self-reported, four-criterion rubric; it is not an external project grader. Matching is deterministic and rule-based, with skill synonyms and phrase matching rather than an LLM.

## Configuration

Local demo mode needs no database or email provider. To configure the optional Resend-compatible email delivery:

```powershell
$env:RESEND_API_KEY = "your-provider-api-key"
$env:EMAIL_FROM = "TalentGraph <noreply@your-verified-domain.com>"
$env:APP_BASE_URL = "https://your-deployment.example"
```

For production, also set `NODE_ENV=production`, a random `SESSION_SECRET` of at least 32 characters, and `COMPANY_EMAIL_DOMAINS` (comma-separated domains). Production startup intentionally fails if a strong session secret is missing. Public registration remains employee-only and requires email verification; HR accounts are not created by public signup.

## Deploy to Vercel

Vercel auto-detects the root `server.js` Express app and serves files under `public/` from its CDN. `vercel.json` configures the daily reminder job. Vercel deployments must use Supabase; the local `data/store.json` fallback is intentionally disabled because Vercel function filesystems are not durable.

1. Create a Supabase project and run `database/supabase.sql` in its SQL Editor.
2. Import this GitHub repository into Vercel. The project root is the repository root; no frontend build command is needed.
3. Add the environment variables below in Vercel Project Settings. Set them for Production, and use separate database credentials and secrets for Preview if you enable preview deployments.
4. Deploy, then sign in using the bootstrap HR account and confirm `/api/session`, signup email verification, and invitation email delivery.

Required environment variables:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL from **Project Settings → API**. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key from **Project Settings → API**. Never expose it to the browser. |
| `SESSION_SECRET` | Random secret, at least 32 characters. |
| `COMPANY_EMAIL_DOMAINS` | Comma-separated allowed registration/invitation domains. |
| `BOOTSTRAP_HR_EMAIL` | Initial verified HR account, used only when `app_state` is first created. |
| `BOOTSTRAP_HR_PASSWORD` | Initial HR password, at least 14 characters; remove it after the first successful database initialization. |
| `RESEND_API_KEY` | Resend API key for signup verification and invitations. |
| `EMAIL_FROM` | Sender on a domain verified with Resend, for example `TalentGraph <noreply@example.com>`. |
| `APP_BASE_URL` | Public HTTPS origin, without a trailing slash, used to build email links. |
| `CRON_SECRET` | Random secret used to authorize Vercel's scheduled reminder request. |

Vercel sets `VERCEL`; set `NODE_ENV=production` for the production environment so production security checks and email requirements are enabled. Do not commit these values or put secrets in `vercel.json`. The Supabase table must exist before the first request. On the first cold start with an empty `app_state` table, the app creates the initial app state and bootstrap HR account. It will not create the table automatically.

Vercel Cron runs `/api/internal/reminders` daily at 09:00 UTC and authenticates with `CRON_SECRET`. The app no longer starts a timer in a Vercel function. Signup verification and invitations require working Resend configuration; without it, those production flows return an error rather than creating unusable accounts.

Important production limit: this app currently loads the whole application state into each Node process and writes a complete snapshot to Supabase on mutations. Serverless instances can hold stale copies, and concurrent writes can overwrite one another. Supabase makes the snapshot durable, but does not make this snapshot model concurrency-safe. Treat this deployment as a demo or low-concurrency preview; before using real employee data or relying on concurrent users, replace snapshot persistence with transactional database operations and move rate limiting to a shared store. Review the remaining security and privacy limits below as well.

## Security and implementation limits

- Passwords use salted `scrypt` hashes. Sessions use signed, HTTP-only, SameSite cookies; protected endpoints check roles and employee ownership.
- Login, signup and invitation acceptance have per-process rate limits. These limits are not distributed across multiple app instances.
- Email verification and invitations use expiring, hashed, single-use tokens. Real email delivery requires a configured provider.
- Evidence submissions currently store a title, description and optional HTTPS link; binary file uploads and malware scanning are not implemented.
- The JSON file remains the local demo source of truth. Supabase mode persists the application state as one `jsonb` row; application data is not yet modeled as normalized tables, and this mode needs integration testing against a configured Supabase project before deployment.
- No MFA/SSO, external identity provider, distributed job queue, formal CSRF token scheme, or production-grade object storage is included. The hourly reminder loop is persisted-data-based but runs inside the application process; use a dedicated durable worker for multi-instance production.
- Demo accounts and synthetic employee data are for local evaluation only. Review all security and privacy controls before using real employee data.

## Upgrade status

The current ZIP builds on the existing project and preserves the existing UI styling and main pages. It adds employee-specific data access, a maximum of 100 unlinked seeded demo employees, approved-domain registration, email verification, employee invitations, evidence submission and review, in-app notifications, configurable evidence deadlines, reminders, and audit events. It also serializes persistence writes and enforces a strong session secret in production mode.

Remaining production work: execute browser-based desktop/mobile regression tests, verify Supabase behavior against a real configured project, add binary evidence upload with safe object storage, move reminders to a durable worker/queue for multi-instance deployment, add CSRF protection and distributed rate limiting, and complete security review before real employee data is used.

## Tests

Run the included smoke/integration tests with:

```powershell
npm test
```

The tests exercise the seeded employee cap, employee-specific dashboard data, cross-employee graph authorization, approved-domain registration, verification-before-login, and empty initial profiles for newly verified employees.

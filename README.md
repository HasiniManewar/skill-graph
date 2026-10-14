# Dynamic Skill Graph & Internal Talent Marketplace

A full-stack internal mobility demo built with HTML, CSS, JavaScript, Node.js, Express and MySQL. Fictional employee profiles connect proficiency, projects, certifications, domain experience and workload to explainable candidate matches and personalized learning.

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

## MySQL

Install MySQL 8 and create the relational schema before starting the application. From a terminal with the MySQL client available, import `database/schema.sql`:

```text
mysql -u root -p < database/schema.sql
```

Set the connection URL and a private session secret before running the server:

```powershell
$env:MYSQL_URL = "mysql://user:password@localhost:3306/skillgraph_talent"
$env:SESSION_SECRET = "replace-with-a-long-random-secret"
npm start
```

MySQL mode stores the current application state in `app_state` and transactionally rebuilds its normalized relational snapshot on each change. The snapshot populates the users, employees, skills and synonyms, projects, certifications, workload, openings, interests, courses, learning progress, assessments, evaluations, skill gaps and upskilling-path tables. Import the schema first; MySQL is not silently replaced by local-file storage when a database connection is configured.

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

## Security and implementation limits

- Passwords use salted `scrypt` hashes. Sessions use signed, HTTP-only, SameSite cookies; protected endpoints check roles and employee ownership.
- Login, signup and invitation acceptance have per-process rate limits. These limits are not distributed across multiple app instances.
- Email verification and invitations use expiring, hashed, single-use tokens. Real email delivery requires a configured provider.
- Evidence submissions currently store a title, description and optional HTTPS link; binary file uploads and malware scanning are not implemented.
- The JSON file remains the local demo source of truth. MySQL mode persists the application state in `app_state` and rebuilds the existing relational snapshot. This does not yet make every new workflow a first-class normalized SQL model, and MySQL mode needs environment-specific integration testing before deployment.
- No MFA/SSO, external identity provider, distributed job queue, formal CSRF token scheme, or production-grade object storage is included. The hourly reminder loop is persisted-data-based but runs inside the application process; use a dedicated durable worker for multi-instance production.
- Demo accounts and synthetic employee data are for local evaluation only. Review all security and privacy controls before using real employee data.

## Upgrade status

The current ZIP builds on the existing project and preserves the existing UI styling and main pages. It adds employee-specific data access, a maximum of 100 unlinked seeded demo employees, approved-domain registration, email verification, employee invitations, evidence submission and review, in-app notifications, configurable evidence deadlines, reminders, and audit events. It also serializes persistence writes and enforces a strong session secret in production mode.

Remaining production work: execute browser-based desktop/mobile regression tests, verify MySQL behavior against a real configured database, add binary evidence upload with safe object storage, move reminders to a durable worker/queue for multi-instance deployment, add CSRF protection and distributed rate limiting, and complete security review before real employee data is used.

## Tests

Run the included smoke/integration tests with:

```powershell
npm test
```

The tests exercise the seeded employee cap, employee-specific dashboard data, cross-employee graph authorization, approved-domain registration, verification-before-login, and empty initial profiles for newly verified employees.

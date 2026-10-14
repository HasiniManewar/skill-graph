# TalentGraph Upgrade Report

## Summary

This upgrade continues from the supplied TalentGraph Node.js/Express project. Existing navigation, styles, candidate search, employee profile, learning path and project marketplace were retained; new controls use the existing modal and surface patterns.

## Implemented in this upgrade

- Persisted employee-specific evidence tasks created when all course modules are completed.
- Employee evidence submission for project, certificate, portfolio, assessment, reviewer feedback or other evidence; optional links must use HTTPS.
- HR review decisions: approve, reject with reason, or request changes with reason.
- In-app notifications with read/unread state, mark-read and mark-all-read.
- Notifications for evidence creation, reviewer work, submissions and decisions.
- Configurable approved company email domains and optional evidence deadline policy.
- Persisted reminder state for 7-day, 3-day, 24-hour and overdue notifications, checked hourly by the app process.
- HR employee invitations with 72-hour expiry, single-use acceptance, revocation endpoint and clean employee profiles.
- Optional Resend-compatible email delivery using `RESEND_API_KEY` and `EMAIL_FROM`.
- HR audit log for evidence decisions, invitations and company settings.
- Serialized persistence writes and production startup validation for a 32-character session secret.
- Existing employee cap, domain validation, email verification and employee-specific graph authorization retained.

## Verification performed

- `node --check server.js` — passed.
- `node --check public/app.js` — passed.
- `npm test` — 6/6 tests passed, covering sample-data limits, employee-specific profile/graph access, signup verification, course-to-evidence workflow, HR review notifications/audit, single-use invitations and company settings.

Tests run in isolated temporary copies with local JSON storage. A real MySQL instance and a browser automation environment were not configured, so those checks were not run.

## Known remaining production work

- Browser-based desktop/mobile UI regression and accessibility testing.
- Real MySQL integration/concurrency testing; new workflow records currently live in the application-state JSON payload, not dedicated normalized SQL tables.
- Binary evidence uploads, object storage and malware scanning.
- Move reminder processing into a durable external worker/queue for multi-instance deployment.
- Add formal CSRF protection and distributed rate limiting.
- Security/privacy review before using real employee data.
- MFA/SSO are not implemented.

## Run locally

```powershell
npm install
npm test
npm start
```

Open `http://localhost:3000`.

Demo HR: `hr@skillgraph.test` / `DemoPass!23`

Demo employee: `employee@skillgraph.test` / `DemoPass!23`

For production, configure `NODE_ENV=production`, `SESSION_SECRET` (at least 32 characters), `COMPANY_EMAIL_DOMAINS`, `APP_BASE_URL`, `RESEND_API_KEY`, and `EMAIL_FROM`. Do not use demo credentials or synthetic records in a real employee environment.

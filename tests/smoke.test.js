const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
let tempDir, child, baseUrl;
function request(url, { method = 'GET', body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) } }, (res) => {
      let data = ''; res.setEncoding('utf8'); res.on('data', (chunk) => data += chunk); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: data, json: (() => { try { return JSON.parse(data); } catch { return null; } })() }));
    });
    req.on('error', reject); if (body) req.write(JSON.stringify(body)); req.end();
  });
}
test.before(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'talentgraph-test-'));
  for (const name of ['server.js', 'package.json', 'public', 'database', 'data']) fs.cpSync(path.join(root, name), path.join(tempDir, name), { recursive: true });
  const port = 32000 + Math.floor(Math.random() * 1000); baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], { cwd: tempDir, env: { ...process.env, PORT: String(port), COMPANY_EMAIL_DOMAINS: 'skillgraph.test', SESSION_SECRET: 'test-secret-that-is-long-enough', NODE_PATH: path.join(root, 'node_modules') }, stdio: 'ignore' });
  let ready = false;
  for (let i = 0; i < 60; i++) { try { const r = await request(`${baseUrl}/api/session`); if (r.status === 200) { ready = true; break; } } catch {} await new Promise((resolve) => setTimeout(resolve, 100)); }
  assert.equal(ready, true, 'server should start');
});
test.after(() => { if (child) child.kill(); if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true }); });
test('retains at most 100 unlinked sample employees and account-linked profiles', () => {
  const state = JSON.parse(fs.readFileSync(path.join(tempDir, 'data/store.json'), 'utf8'));
  assert.ok(state.employees.filter((e) => !e.userId).length <= 100);
  assert.ok(state.employees.some((e) => e.userId === 'demo-employee'));
});
test('demo employee sees their own HR-backed profile and cannot inspect another employee graph', async () => {
  const login = await request(`${baseUrl}/api/login`, { method: 'POST', body: { email: 'employee@skillgraph.test', password: 'DemoPass!23' } });
  assert.equal(login.status, 200);
  const cookie = login.headers['set-cookie'][0].split(';')[0];
  const dashboard = await request(`${baseUrl}/api/dashboard`, { cookie });
  assert.equal(dashboard.status, 200); assert.equal(dashboard.json.employee.id, 'emp-001'); assert.equal(dashboard.json.employee.name, 'Priya Shah');
  const denied = await request(`${baseUrl}/api/employees/emp-002/graph`, { cookie }); assert.equal(denied.status, 403);
});
test('public signup rejects unapproved domains and verifies accounts before login', async () => {
  const denied = await request(`${baseUrl}/api/register`, { method: 'POST', body: { name: 'Test User', email: 'test@gmail.com', password: 'StrongPass!23', confirmPassword: 'StrongPass!23', role: 'hr' } }); assert.equal(denied.status, 403);
  const accepted = await request(`${baseUrl}/api/register`, { method: 'POST', body: { name: 'Test User', email: 'test-new@skillgraph.test', password: 'StrongPass!23', confirmPassword: 'StrongPass!23', role: 'hr' } });
  assert.equal(accepted.status, 201); assert.equal(accepted.json.requiresVerification, true); assert.ok(accepted.json.developmentVerificationUrl);
  const prematureLogin = await request(`${baseUrl}/api/login`, { method: 'POST', body: { email: 'test-new@skillgraph.test', password: 'StrongPass!23' } }); assert.equal(prematureLogin.status, 403);
  const verified = await request(accepted.json.developmentVerificationUrl); assert.equal(verified.status, 200);
  const login = await request(`${baseUrl}/api/login`, { method: 'POST', body: { email: 'test-new@skillgraph.test', password: 'StrongPass!23' } }); assert.equal(login.status, 200);
  const cookie = login.headers['set-cookie'][0].split(';')[0]; const dashboard = await request(`${baseUrl}/api/dashboard`, { cookie });
  assert.equal(dashboard.json.employee.skills.length, 0); assert.equal(dashboard.json.employee.projects.length, 0);
});
test('course completion creates persisted evidence task; submission and HR review notify the right employee', async () => {
  const employeeLogin = await request(`${baseUrl}/api/login`, { method: 'POST', body: { email: 'employee@skillgraph.test', password: 'DemoPass!23' } });
  const employeeCookie = employeeLogin.headers['set-cookie'][0].split(';')[0];
  const hrLogin = await request(`${baseUrl}/api/login`, { method: 'POST', body: { email: 'hr@skillgraph.test', password: 'DemoPass!23' } });
  const hrCookie = hrLogin.headers['set-cookie'][0].split(';')[0];
  let task;
  for (let index = 0; index < 5; index++) {
    const completed = await request(`${baseUrl}/api/learning/modules/${index}`, { method: 'POST', body: {}, cookie: employeeCookie });
    assert.equal(completed.status, 200);
    if (completed.json.evidenceTask) task = completed.json.evidenceTask;
  }
  assert.ok(task, 'completing all modules should create an evidence task');
  assert.equal(task.dueAt, null, 'no deadline is invented when company policy is unset');
  const notifications = await request(`${baseUrl}/api/notifications`, { cookie: employeeCookie });
  assert.ok(notifications.json.notifications.some((n) => n.entityId === task.id && n.type === 'evidence_required'));
  const denied = await request(`${baseUrl}/api/evidence`, { cookie: hrCookie });
  assert.equal(denied.status, 200);
  const submitted = await request(`${baseUrl}/api/evidence/${task.id}/submit`, { method: 'POST', body: { evidenceType: 'Project', title: 'API project demo', description: 'Implemented routes, validation and tests.', url: 'https://example.com/demo' }, cookie: employeeCookie });
  assert.equal(submitted.status, 201);
  const reviewed = await request(`${baseUrl}/api/hr/evidence/${task.id}/review`, { method: 'POST', body: { decision: 'Approved' }, cookie: hrCookie });
  assert.equal(reviewed.status, 200); assert.equal(reviewed.json.task.status, 'Approved');
  const employeeNotifications = await request(`${baseUrl}/api/notifications`, { cookie: employeeCookie });
  assert.ok(employeeNotifications.json.notifications.some((n) => n.type === 'evidence_approved' && n.entityId === task.id));
  const audit = await request(`${baseUrl}/api/hr/audit-log`, { cookie: hrCookie });
  assert.ok(audit.json.entries.some((entry) => entry.action === 'evidence_reviewed' && entry.entityId === task.id));
});
test('HR invitations are single-use and create a clean employee profile', async () => {
  const login = await request(`${baseUrl}/api/login`, { method: 'POST', body: { email: 'hr@skillgraph.test', password: 'DemoPass!23' } });
  const cookie = login.headers['set-cookie'][0].split(';')[0];
  const invite = await request(`${baseUrl}/api/hr/invitations`, { method: 'POST', body: { name: 'Invited User', email: 'invited@skillgraph.test' }, cookie });
  assert.equal(invite.status, 201); assert.ok(invite.json.invitation.developmentAcceptanceUrl);
  const accepted = await request(invite.json.invitation.developmentAcceptanceUrl, { method: 'POST', body: { password: 'InvitePass!23' } });
  assert.equal(accepted.status, 201); assert.equal(accepted.json.employee.skills.length, 0);
  const replay = await request(invite.json.invitation.developmentAcceptanceUrl, { method: 'POST', body: { password: 'InvitePass!23' } });
  assert.equal(replay.status, 400);
});
test('HR can configure approved company domains and evidence deadline policy', async () => {
  const login = await request(`${baseUrl}/api/login`, { method: 'POST', body: { email: 'hr@skillgraph.test', password: 'DemoPass!23' } });
  const cookie = login.headers['set-cookie'][0].split(';')[0];
  const updated = await request(`${baseUrl}/api/hr/settings`, { method: 'PUT', body: { evidenceDueDays: 14, allowedEmailDomains: ['skillgraph.test', 'example.org'] }, cookie });
  assert.equal(updated.status, 200); assert.equal(updated.json.evidenceDueDays, 14); assert.ok(updated.json.allowedEmailDomains.includes('example.org'));
  const rejected = await request(`${baseUrl}/api/hr/settings`, { method: 'PUT', body: { evidenceDueDays: 0 }, cookie });
  assert.equal(rejected.status, 400);
  const register = await request(`${baseUrl}/api/register`, { method: 'POST', body: { name: 'Company User', email: 'new@example.org', password: 'StrongPass!23', confirmPassword: 'StrongPass!23' } });
  assert.equal(register.status, 201);
});

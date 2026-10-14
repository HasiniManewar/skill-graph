const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT || 3000);
const secret = process.env.SESSION_SECRET || 'local-demo-secret-change-before-deploying';
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 || secret === 'local-demo-secret-change-before-deploying')) throw new Error('Production requires SESSION_SECRET with at least 32 characters.');
const allowedEmailDomains = new Set((process.env.COMPANY_EMAIL_DOMAINS || (isProduction ? '' : 'skillgraph.test')).split(',').map((domain) => domain.trim().toLowerCase().replace(/^@/, '')).filter(Boolean));
const dataFile = path.join(__dirname, 'data', 'store.json');
const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const skillsCatalog = ['React', 'Node.js', 'SQL', 'TypeScript', 'Express', 'Python', 'AWS', 'Docker', 'Java', 'Spring Boot', 'Product Design', 'Figma', 'Data Analysis', 'Machine Learning', 'Cybersecurity', 'Terraform', 'Kubernetes', 'GraphQL', 'MongoDB', 'MySQL', 'Redis', 'CI/CD', 'Agile', 'FinTech', 'Healthcare', 'E-commerce', 'Payments', 'Leadership', 'Communication', 'Project Management', 'Go', 'C#', '.NET', 'PHP', 'Ruby', 'Kotlin', 'Swift', 'API Design', 'Microservices', 'System Design', 'Data Engineering', 'Tableau', 'Power BI', 'Azure', 'Google Cloud', 'Git', 'Linux', 'OAuth', 'Automated Testing', 'Accessibility'];
const synonyms = { react: ['react', 'react.js', 'reactjs'], 'node.js': ['node.js', 'nodejs', 'node'], sql: ['sql', 'mysql', 'postgres', 'relational database'], typescript: ['typescript', 'ts'], aws: ['aws', 'amazon web services'], 'spring boot': ['spring boot', 'spring'], 'machine learning': ['machine learning', 'ml', 'predictive modeling'], fintech: ['fintech', 'financial technology', 'financial services', 'banking', 'payments'], healthcare: ['healthcare', 'health', 'medical'], 'e-commerce': ['e-commerce', 'ecommerce', 'commerce', 'retail'] };
const course = { id: 'node-advanced', title: 'Building Production-Ready Node.js APIs', provider: 'OpenLearn Academy', durationHours: 30, certification: true, modules: ['Node.js runtime & event loop', 'Express architecture & middleware', 'Database design with MySQL', 'Authentication & API security', 'Testing, observability & deployment'], moduleVideos: ['https://www.youtube.com/watch?v=8aGhZQkoFbQ', 'https://www.youtube.com/watch?v=Oe421EPjeBE', 'https://www.youtube.com/watch?v=7S_tz1z_5bA', 'https://www.youtube.com/watch?v=mbsmsi7l3r4', 'https://www.youtube.com/watch?v=F6k8t0VZHFk'], resources: [{ title: 'Node.js Documentation', type: 'Documentation', url: 'https://nodejs.org/docs/latest/api/' }, { title: 'Express Guide', type: 'Guide', url: 'https://expressjs.com/en/guide/routing.html' }, { title: 'SQLBolt interactive lessons', type: 'Practice', url: 'https://sqlbolt.com/' }, { title: 'Node.js Design Patterns', type: 'Video series', url: 'https://www.youtube.com/results?search_query=node.js+architecture+tutorial' }], project: 'Build an e-commerce REST API using Node.js, Express and MySQL.', questions: [{ prompt: 'Which Node.js mechanism handles asynchronous I/O without blocking the main thread?', options: ['Worker pool only', 'Event loop', 'Garbage collector', 'HTTP router'], answer: 1 }, { prompt: 'Where should an Express authentication middleware run?', options: ['After the route sends its response', 'Before protected route handlers', 'Only in the database', 'In the browser'], answer: 1 }, { prompt: 'Which SQL constraint guarantees a unique row identifier?', options: ['CHECK', 'DEFAULT', 'PRIMARY KEY', 'INDEX ONLY'], answer: 2 }, { prompt: 'What is the safest default for storing passwords?', options: ['Plain text', 'Reversible encryption', 'A salted password hash', 'A browser cookie'], answer: 2 }, { prompt: 'What does a database transaction provide?', options: ['Atomic changes', 'Faster CSS', 'Client-side routing', 'Password recovery'], answer: 0 }] };

function passwordHash(password, salt = crypto.randomBytes(16).toString('hex')) { return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') }; }
function userRecord(id, name, email, password, role) { return { id, name, email, role, ...passwordHash(password) }; }
function createEmployee(i) {
  const names = ['Priya Shah', 'Marcus Chen', 'Elena Rodriguez', 'Jordan Williams', 'Amara Okafor', 'Theo Martin', 'Sofia Patel', 'David Kim', 'Aisha Rahman', 'Leo Fischer', 'Nina Kapoor', 'Sam Rivera'];
  const name = i === 0 ? 'Priya Shah' : names[i % names.length].replace(/^(.*)$/, (n) => i < names.length ? n : `${n.split(' ')[0]} ${String.fromCharCode(65 + (i % 26))}.`);
  const special = i % 10;
  const skills = [
    { name: 'React', level: special < 6 ? 'Advanced' : 'Intermediate', years: special < 6 ? 5 : 3 },
    { name: 'Node.js', level: special < 4 ? 'Advanced' : special < 8 ? 'Intermediate' : 'Beginner', years: special < 4 ? 4 : 2 },
    { name: 'SQL', level: special < 5 ? 'Intermediate' : 'Advanced', years: 3 },
    { name: 'TypeScript', level: special < 6 ? 'Advanced' : 'Intermediate', years: 3 },
    { name: 'AWS', level: special < 3 ? 'Advanced' : 'Intermediate', years: 2 },
    { name: 'Express', level: special < 4 ? 'Advanced' : 'Intermediate', years: 3 },
    { name: 'FinTech', level: i === 0 || special < 5 ? 'Intermediate' : special === 5 ? 'Beginner' : 'Missing', years: i === 0 ? 3 : special < 5 ? 2 : 0 },
    { name: 'Docker', level: 'Intermediate', years: 2 },
    { name: 'Python', level: 'Intermediate', years: 2 }
  ];
  const additionalSkills = skillsCatalog.slice(30);
  for (let offset = 0; offset < 5; offset++) {
    const name = additionalSkills[(i * 3 + offset * 7) % additionalSkills.length];
    if (!skills.some((skill) => skill.name === name)) skills.push({ name, level: ['Beginner', 'Intermediate', 'Advanced'][((i + offset) % 3)], years: 1 + ((i + offset) % 5) });
  }
  if (i === 0) skills[1] = { name: 'Node.js', level: 'Intermediate', years: 2 };
  const workload = i === 0 ? 40 : i === 1 ? 100 : i === 2 ? 85 : i === 3 ? 10 : 20 + ((i * 17) % 61);
  const domain = skills.find((s) => s.name === 'FinTech')?.level !== 'Missing' && skills.find((s) => s.name === 'FinTech')?.level !== 'Beginner' ? 'FinTech' : ['E-commerce', 'Healthcare'][i % 2];
  const tech = skills.filter((s) => !['FinTech'].includes(s.name) && s.level !== 'Missing').slice(0, 4).map((s) => s.name);
  const projects = [{ name: domain === 'FinTech' ? 'Digital Banking Platform' : `${domain} Insights Portal`, domain, technologies: [...new Set([...tech, domain === 'FinTech' ? 'Payments' : 'SQL'])], year: 2024 + (i % 3) }];
  if (i === 0) projects.push({ name: 'Real-time Payment Orchestration', domain: 'FinTech', technologies: ['React', 'Node.js', 'SQL', 'Payments'], year: 2025 });
  if (special < 5 && i !== 0) projects.push({ name: 'Customer Account Services', domain: 'FinTech', technologies: ['React', 'Node.js', 'MySQL'], year: 2025 });
  return { id: `emp-${String(i + 1).padStart(3, '0')}`, name, title: ['Senior Software Engineer', 'Product Engineer', 'Platform Developer', 'Full-stack Engineer'][i % 4], department: ['Engineering', 'Product', 'Data', 'Platform'][i % 4], location: ['New York', 'London', 'Toronto', 'Singapore'][i % 4], email: i === 0 ? 'employee@skillgraph.test' : `employee${i + 1}@skillgraph.test`, experienceYears: 3 + (i % 10), skills, projects, certifications: [{ name: i % 2 === 0 ? 'AWS Cloud Practitioner' : 'Secure Software Foundations', year: 2025 }].concat(special < 6 ? [{ name: 'React Developer Certificate', year: 2024 }] : []), workload, availability: workload >= 85 ? 'At capacity' : workload <= 50 ? 'Available' : 'Limited', userId: i === 0 ? 'demo-employee' : null, evidence: 'Skills verified through project delivery and manager review.' };
}
function initialState() {
  const employees = Array.from({ length: 100 }, (_, i) => createEmployee(i));
  return { users: [userRecord('demo-hr', 'Morgan Lee', 'hr@skillgraph.test', 'DemoPass!23', 'hr'), userRecord('demo-employee', 'Priya Shah', 'employee@skillgraph.test', 'DemoPass!23', 'employee')], employees, course, notifications: [], evidenceTasks: [], invitations: [], auditLog: [], companySettings: { evidenceDueDays: process.env.EVIDENCE_DUE_DAYS ? Number(process.env.EVIDENCE_DUE_DAYS) : null, allowedEmailDomains: [...allowedEmailDomains] }, openings: [{ id: 'opening-1', title: 'FinTech Payment Application', domain: 'FinTech', duration: '3 months', description: 'Build secure payment workflows for our next-generation banking platform.', requirements: [{ name: 'React', level: 'Advanced' }, { name: 'Node.js', level: 'Advanced' }, { name: 'SQL', level: 'Intermediate' }], published: true, createdAt: new Date().toISOString() }, { id: 'opening-2', title: 'Customer Data Insights', domain: 'E-commerce', duration: '6 weeks', description: 'Shape customer analytics experiences for our commerce teams.', requirements: [{ name: 'React', level: 'Intermediate' }, { name: 'SQL', level: 'Intermediate' }], published: true, createdAt: new Date().toISOString() }], interests: [], learning: {}, evaluations: {}, seedVersion: 4, initialized: true };
}
let state;
let mysqlPool = null;

async function syncRelationalSnapshot(connection) {
  const insert = async (table, columns, rows) => {
    for (let offset = 0; offset < rows.length; offset += 200) {
      const batch = rows.slice(offset, offset + 200);
      const rowPlaceholders = `(${columns.map(() => '?').join(',')})`;
      const placeholders = batch.map(() => rowPlaceholders).join(',');
      await connection.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`, batch.flat());
    }
  };
  const tables = ['course_module_completions', 'assessment_attempts', 'project_evaluations', 'upskilling_paths', 'skill_gaps', 'required_project_skills', 'project_interests', 'employee_certifications', 'employee_projects', 'workload', 'employee_course_progress', 'assessment_questions', 'assessments', 'learning_resources', 'course_modules', 'suggested_projects', 'internal_project_openings', 'project_skills', 'certifications', 'projects', 'employee_skills', 'skill_synonyms', 'skills', 'employees', 'users', 'courses'];
  for (const table of tables) await connection.query(`DELETE FROM ${table}`);

  await insert('users', ['id', 'name', 'email', 'password_hash', 'role'], state.users.map((user) => [user.id, user.name, user.email, `${user.salt}:${user.hash}`, user.role]));
  await insert('employees', ['id', 'user_id', 'title', 'department', 'location', 'experience_years'], state.employees.map((person) => [person.id, person.userId, person.title, person.department, person.location, person.experienceYears]));

  const skillNames = new Set([...skillsCatalog, ...state.employees.flatMap((person) => person.skills.map((skill) => skill.name)), ...state.openings.flatMap((opening) => opening.requirements.map((skill) => skill.name))]);
  const skillRows = [...skillNames].map((name) => [name, ['FinTech', 'Healthcare', 'E-commerce', 'Payments'].includes(name) ? 'Domain' : ['Leadership', 'Communication', 'Project Management'].includes(name) ? 'Professional' : 'Technical']);
  await insert('skills', ['name', 'category'], skillRows);
  const [skillRecords] = await connection.query('SELECT id, name FROM skills');
  const skillIds = new Map(skillRecords.map((skill) => [skill.name, skill.id]));
  const skillAliases = { fintech: 'FinTech', healthcare: 'Healthcare', 'e-commerce': 'E-commerce', 'machine learning': 'Machine Learning', 'spring boot': 'Spring Boot', sql: 'SQL', react: 'React', 'node.js': 'Node.js', typescript: 'TypeScript', aws: 'AWS' };
  const synonymRows = [];
  for (const [name, terms] of Object.entries(synonyms)) for (const term of terms) {
    const skillName = skillAliases[name] || name;
    if (skillIds.has(skillName)) synonymRows.push([skillIds.get(skillName), term]);
  }
  await insert('skill_synonyms', ['skill_id', 'synonym'], synonymRows);
  await insert('employee_skills', ['employee_id', 'skill_id', 'proficiency', 'years_experience', 'evidence'], state.employees.flatMap((person) => person.skills.filter((skill) => skill.level !== 'Missing').map((skill) => [person.id, skillIds.get(skill.name), skill.level, skill.years, person.evidence])));

  const projects = [];
  const employeeProjectRows = [];
  const projectSkillRows = [];
  state.employees.forEach((person) => person.projects.forEach((project) => {
    projects.push([person.id, project.name, project.domain, '', project.year]);
    const projectIndex = projects.length;
    employeeProjectRows.push([person.id, projectIndex, 'Contributor']);
    for (const name of project.technologies) if (skillIds.has(name)) projectSkillRows.push([projectIndex, skillIds.get(name)]);
  }));
  await insert('projects', ['name', 'domain', 'description', 'started_year'], projects.map((row) => row.slice(1)));
  const [projectRecords] = await connection.query('SELECT id FROM projects ORDER BY id');
  const projectIds = projectRecords.map((project) => project.id);
  await insert('employee_projects', ['employee_id', 'project_id', 'contribution'], employeeProjectRows.map(([employeeId, index, contribution]) => [employeeId, projectIds[index - 1], contribution]));
  await insert('project_skills', ['project_id', 'skill_id'], [...new Map(projectSkillRows.map(([index, skillId]) => [`${projectIds[index - 1]}:${skillId}`, [projectIds[index - 1], skillId]])).values()]);

  const certificationNames = [...new Set(state.employees.flatMap((person) => person.certifications.map((cert) => cert.name)))];
  await insert('certifications', ['name', 'provider'], certificationNames.map((name) => [name, 'skillGraph Partner Network']));
  const [certificationRecords] = await connection.query('SELECT id, name FROM certifications');
  const certificationIds = new Map(certificationRecords.map((cert) => [cert.name, cert.id]));
  await insert('employee_certifications', ['employee_id', 'certification_id', 'earned_at'], state.employees.flatMap((person) => person.certifications.map((cert) => [person.id, certificationIds.get(cert.name), `${cert.year}-01-01`])));
  await insert('workload', ['employee_id', 'workload_percent'], state.employees.map((person) => [person.id, person.workload]));

  await insert('internal_project_openings', ['id', 'title', 'domain', 'duration', 'description', 'published', 'created_by'], state.openings.map((opening) => [opening.id, opening.title, opening.domain, opening.duration, opening.description, opening.published, state.users.find((user) => user.role === 'hr')?.id || null]));
  await insert('required_project_skills', ['opening_id', 'skill_id', 'proficiency'], state.openings.flatMap((opening) => opening.requirements.map((skill) => [opening.id, skillIds.get(skill.name), skill.level])));
  await insert('project_interests', ['opening_id', 'employee_id', 'status', 'created_at'], state.interests.map((interest) => [interest.openingId, interest.employeeId, interest.status, new Date(interest.createdAt)]));

  await insert('courses', ['id', 'title', 'provider', 'estimated_hours', 'certification_available'], [[state.course.id, state.course.title, state.course.provider, state.course.durationHours, state.course.certification]]);
  await insert('course_modules', ['course_id', 'title', 'position', 'estimated_hours'], state.course.modules.map((title, index) => [state.course.id, title, index + 1, [4, 6, 7, 6, 7][index]]));
  await insert('learning_resources', ['course_id', 'title', 'resource_type', 'url'], state.course.resources.map((resource) => [state.course.id, resource.title, resource.type, resource.url]));
  const [moduleRecords] = await connection.query('SELECT id, position FROM course_modules WHERE course_id = ?', [state.course.id]);
  const moduleIds = new Map(moduleRecords.map((module) => [module.position - 1, module.id]));
  const userEmployees = new Map(state.employees.filter((person) => person.userId).map((person) => [person.userId, person]));
  const learningEntries = Object.entries(state.learning).filter(([userId]) => userEmployees.has(userId));
  await insert('employee_course_progress', ['employee_id', 'course_id', 'actual_seconds', 'session_started_at', 'certified'], learningEntries.map(([userId, learning]) => [userEmployees.get(userId).id, state.course.id, Math.floor(learning.accumulatedSeconds), learning.sessionStartedAt ? new Date(learning.sessionStartedAt) : null, learning.certified]));
  await insert('course_module_completions', ['employee_id', 'module_id'], learningEntries.flatMap(([userId, learning]) => learning.completed.map((index) => [userEmployees.get(userId).id, moduleIds.get(index)])));
  await insert('assessments', ['course_id', 'title'], [[state.course.id, `${state.course.title} knowledge check`]]);
  const [assessmentRecords] = await connection.query('SELECT id FROM assessments WHERE course_id = ?', [state.course.id]);
  const assessmentId = assessmentRecords[0].id;
  await insert('assessment_questions', ['assessment_id', 'prompt', 'options_json', 'answer_index'], state.course.questions.map((question) => [assessmentId, question.prompt, JSON.stringify(question.options), question.answer]));
  await insert('assessment_attempts', ['assessment_id', 'employee_id', 'score', 'answers_json'], learningEntries.filter(([, learning]) => learning.assessmentScore !== null).map(([userId, learning]) => [assessmentId, userEmployees.get(userId).id, learning.assessmentScore, JSON.stringify({ recordedScore: learning.assessmentScore })]));
  await insert('suggested_projects', ['course_id', 'title', 'description'], [[state.course.id, state.course.project, state.course.project]]);
  const [suggestedProjects] = await connection.query('SELECT id FROM suggested_projects WHERE course_id = ?', [state.course.id]);
  const nodeSkillId = skillIds.get('Node.js');
  const nodeSkillRows = state.employees.map((person) => ({ person, skill: person.skills.find((skill) => skill.name === 'Node.js') })).filter(({ skill }) => skill && levels.indexOf(skill.level) < levels.indexOf('Advanced'));
  await insert('skill_gaps', ['employee_id', 'skill_id', 'current_proficiency', 'target_proficiency', 'status'], nodeSkillRows.map(({ person, skill }) => [person.id, nodeSkillId, skill.level === 'Missing' ? null : skill.level, 'Advanced', person.userId && state.evaluations[person.userId] ? 'Demonstrated' : 'Open']));
  await insert('upskilling_paths', ['employee_id', 'skill_id', 'course_id', 'status'], nodeSkillRows.map(({ person }) => [person.id, nodeSkillId, state.course.id, person.userId && state.evaluations[person.userId] ? 'Completed' : 'Suggested']));
  await insert('project_evaluations', ['project_id', 'employee_id', 'score', 'evidence_json'], learningEntries.filter(([, learning]) => learning.projectScore !== null).map(([userId, learning]) => [suggestedProjects[0].id, userEmployees.get(userId).id, learning.projectScore, JSON.stringify({ rubricPoints: learning.projectScore, selfReported: true })]));
}

let persistQueue = Promise.resolve();
function persist() {
  persistQueue = persistQueue.then(async () => {
  const serialized = JSON.stringify(state);
  if (mysqlPool) {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('INSERT INTO app_state (id, payload) VALUES (1, ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)', [serialized]);
      await syncRelationalSnapshot(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  } else {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, serialized);
  }
  });
  return persistQueue;
}
function addNotification(userId, { type, title, message, entityType = null, entityId = null, dueAt = null, dedupeKey = null }) {
  state.notifications ||= [];
  if (dedupeKey && state.notifications.some((n) => n.dedupeKey === dedupeKey && n.userId === userId)) return null;
  const notification = { id: `ntf-${crypto.randomUUID()}`, userId, type, title, message, entityType, entityId, dueAt, createdAt: new Date().toISOString(), readAt: null, dedupeKey };
  state.notifications.unshift(notification);
  return notification;
}
function addAudit(actor, action, entityType, entityId, details = {}) {
  state.auditLog ||= [];
  state.auditLog.unshift({ id: `audit-${crypto.randomUUID()}`, actorUserId: actor?.id || 'system', action, entityType, entityId, details, createdAt: new Date().toISOString() });
  if (state.auditLog.length > 5000) state.auditLog.length = 5000;
}
function createEvidenceTask(user, reason = 'Course completion evidence') {
  const existing = state.evidenceTasks.find((task) => task.userId === user.id && task.courseId === state.course.id && !['Cancelled'].includes(task.status));
  if (existing) return existing;
  const dueDays = Number(state.companySettings?.evidenceDueDays);
  const dueAt = Number.isFinite(dueDays) && dueDays > 0 ? new Date(Date.now() + dueDays * 86400000).toISOString() : null;
  const task = { id: `ev-${crypto.randomUUID()}`, userId: user.id, employeeId: employeeFor(user)?.id || null, courseId: state.course.id, title: `${state.course.title}: evidence submission`, reason, requiredEvidence: ['Project description or demonstration', 'GitHub or portfolio link (optional)', 'Certificate or assessment evidence (optional)'], status: 'Awaiting submission', dueAt, createdAt: new Date().toISOString(), submissions: [], reviewerUserId: null, reviewedAt: null, decisionReason: null, remindersSent: [] };
  state.evidenceTasks.unshift(task);
  addNotification(user.id, { type: 'evidence_required', title: 'Evidence submission required', message: `Submit supporting evidence for ${state.course.title}.`, entityType: 'evidenceTask', entityId: task.id, dueAt, dedupeKey: `evidence-required:${task.id}` });
  for (const reviewer of state.users.filter((u) => u.role === 'hr')) addNotification(reviewer.id, { type: 'review_required', title: 'Evidence task created', message: `${user.name} has a new evidence task to complete.`, entityType: 'evidenceTask', entityId: task.id, dueAt, dedupeKey: `review-required:${task.id}:${reviewer.id}` });
  return task;
}
function employeeOwnsTask(user, task) { return user.role === 'hr' || task.userId === user.id; }
async function sendConfiguredEmail(to, subject, html) {
  // Optional Resend-compatible API delivery; in-app notifications remain the reliable baseline.
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return { sent: false, reason: 'Email provider is not configured; in-app notification retained.' };
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html }) });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return { sent: true };
}
async function initialize() {
  if (process.env.MYSQL_URL) {
    mysqlPool = require('mysql2/promise').createPool(process.env.MYSQL_URL);
    await mysqlPool.query('CREATE TABLE IF NOT EXISTS app_state (id TINYINT PRIMARY KEY, payload JSON NOT NULL)');
    const [rows] = await mysqlPool.query('SELECT payload FROM app_state WHERE id = 1');
    state = rows.length ? (typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload) : initialState();
    if (!rows.length) await persist();
  } else {
    try { state = JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { state = initialState(); await persist(); }
  }
  let migrated = false;
  state.notifications ||= []; state.evidenceTasks ||= []; state.invitations ||= []; state.auditLog ||= [];
  state.companySettings ||= { evidenceDueDays: process.env.EVIDENCE_DUE_DAYS ? Number(process.env.EVIDENCE_DUE_DAYS) : null, allowedEmailDomains: [...allowedEmailDomains] };
  if (Array.isArray(state.companySettings.allowedEmailDomains) && state.companySettings.allowedEmailDomains.length) { allowedEmailDomains.clear(); for (const domain of state.companySettings.allowedEmailDomains) if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) allowedEmailDomains.add(domain.toLowerCase()); }
  // Keep all account-linked employee profiles; cap only fictional, unlinked seed profiles at 100.
  const linkedEmployees = state.employees.filter((employee) => employee.userId && state.users.some((user) => user.id === employee.userId));
  const unlinkedDemoEmployees = state.employees.filter((employee) => !employee.userId || !state.users.some((user) => user.id === employee.userId));
  if (unlinkedDemoEmployees.length > 100) {
    const keptDemoIds = new Set(unlinkedDemoEmployees.slice(0, 100).map((employee) => employee.id));
    const keptIds = new Set([...linkedEmployees.map((employee) => employee.id), ...keptDemoIds]);
    state.employees = [...unlinkedDemoEmployees.filter((employee) => keptDemoIds.has(employee.id)), ...linkedEmployees];
    state.interests = (state.interests || []).filter((interest) => keptIds.has(interest.employeeId));
    migrated = true;
  }
  for (const employee of state.employees) {
    for (const project of employee.projects) {
      if (Array.isArray(project.domain)) { project.domain = project.domain[0] || ''; migrated = true; }
    }
  }
  if ((state.seedVersion || 0) < 2) {
    const starter = state.employees.find((employee) => employee.email === 'employee@skillgraph.test');
    if (starter && !state.evaluations?.[starter.userId]) {
      const nodeSkill = starter.skills.find((skill) => skill.name === 'Node.js');
      if (nodeSkill) Object.assign(nodeSkill, { level: 'Intermediate', years: 2 });
      starter.workload = 40;
      starter.availability = 'Available';
      migrated = true;
    }
    state.seedVersion = 2;
    migrated = true;
  }
  if ((state.seedVersion || 0) < 3) {
    for (const [index, employee] of state.employees.entries()) {
      const additionalSkills = createEmployee(index).skills.slice(9);
      for (const skill of additionalSkills) if (!employee.skills.some((existing) => existing.name === skill.name)) employee.skills.push(skill);
    }
    state.seedVersion = 3;
    migrated = true;
  }
  if ((state.seedVersion || 0) < 4) {
    const starter = state.employees.find((employee) => employee.email === 'employee@skillgraph.test');
    if (starter) {
      const nodeSkill = starter.skills.find((skill) => skill.name === 'Node.js');
      if (nodeSkill) Object.assign(nodeSkill, { level: 'Intermediate', years: 2 });
      starter.workload = 40;
      starter.availability = 'Available';
      starter.evidence = 'Skills verified through project delivery and manager review.';
      starter.certifications = starter.certifications.filter((certification) => certification.name !== `${state.course.title} Certificate`);
      delete state.learning[starter.userId];
      delete state.evaluations[starter.userId];
      state.interests = state.interests.filter((interest) => interest.employeeId !== starter.id);
    }
    state.users = state.users.filter((user) => !(user.name === 'Flow Check' && user.email.startsWith('flow-')));
    state.seedVersion = 4;
    migrated = true;
  }
  if (migrated) await persist();
}
function tokenFor(user) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 12 })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function auth(requiredRole) {
  return (req, res, next) => {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
    const [payload, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(payload || '').digest('base64url');
    const signatureBytes = Buffer.from(signature || '');
    const expectedBytes = Buffer.from(expected);
    if (signatureBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(signatureBytes, expectedBytes)) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    let claims;
    try { claims = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return res.status(401).json({ error: 'Invalid session.' }); }
    if (claims.exp < Date.now()) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    const user = state.users.find((entry) => entry.id === claims.sub);
    if (!user || (requiredRole && user.role !== requiredRole)) return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    req.user = user;
    next();
  };
}
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role }; }
function employeeFor(user) { return state.employees.find((person) => person.userId === user.id) || null; }
function learningFor(user) { return state.learning[user.id] ||= { completed: [], accumulatedSeconds: 0, sessionStartedAt: null, assessmentScore: null, projectScore: null, certified: false }; }
function levelValue(level) { return levels.indexOf(level); }
function queryRequirements(query) {
  const normalized = String(query || '').toLowerCase();
  const required = [];
  for (const skill of skillsCatalog) {
    const phrases = synonyms[skill.toLowerCase()] || [skill.toLowerCase()];
    if (phrases.some((phrase) => new RegExp(`(^|[^a-z0-9])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(normalized))) required.push(skill);
  }
  const unique = [...new Set(required)];
  const targetLevel = /beginner|entry.level|foundational/i.test(normalized) ? 'Beginner' : /intermediate|working knowledge|familiar/i.test(normalized) ? 'Intermediate' : 'Advanced';
  const requirements = unique.filter((skill) => !['FinTech', 'Healthcare', 'E-commerce'].includes(skill)).map((name) => ({ name, level: targetLevel }));
  const domain = unique.find((skill) => ['FinTech', 'Healthcare', 'E-commerce'].includes(skill)) || null;
  if (!requirements.length && !domain) return { requirements: [{ name: 'React', level: 'Advanced' }, { name: 'Node.js', level: 'Advanced' }], domain: 'FinTech', parsed: ['React', 'Node.js', 'FinTech'] };
  return { requirements, domain, parsed: [...requirements.map((item) => item.name), ...(domain ? [domain] : [])] };
}
function matchEmployee(person, parsed) {
  const skillFindings = parsed.requirements.map((required) => {
    const skill = person.skills.find((item) => item.name === required.name);
    const actual = skill?.level && skill.level !== 'Missing' ? skill.level : 'Missing';
    const projectCount = person.projects.filter((project) => project.technologies.some((technology) => technology.toLowerCase() === required.name.toLowerCase())).length;
    const meets = levelValue(actual) >= levelValue(required.level);
    return { ...required, actual, meets, projectCount, years: skill?.years || 0, certification: person.certifications.some((cert) => cert.name.toLowerCase().includes(required.name.toLowerCase())) };
  });
  const domainProjectCount = parsed.domain ? person.projects.filter((project) => project.domain.toLowerCase() === parsed.domain.toLowerCase() || project.technologies.some((technology) => technology.toLowerCase() === parsed.domain.toLowerCase())).length : 0;
  const domainSkill = parsed.domain ? person.skills.find((skill) => skill.name.toLowerCase() === parsed.domain.toLowerCase()) : null;
  const domainMeets = !parsed.domain || domainProjectCount > 0 || levelValue(domainSkill?.level || 'Missing') >= levelValue('Intermediate');
  const gaps = skillFindings.filter((skill) => !skill.meets).map((skill) => ({ name: skill.name, from: skill.actual, to: skill.level }));
  if (parsed.domain && !domainMeets) gaps.push({ name: parsed.domain, from: 'Missing', to: 'Intermediate' });
  const skillCoverage = skillFindings.length ? skillFindings.filter((item) => item.meets).length / skillFindings.length : 1;
  const projectEvidence = skillFindings.reduce((sum, item) => sum + Math.min(item.projectCount, 2), 0) + domainProjectCount;
  const score = Math.min(99, Math.round(skillCoverage * 48 + Math.min(projectEvidence, 5) * 6 + (person.experienceYears >= 4 ? 9 : 4) + (person.certifications.length ? 5 : 0) + Math.max(0, (100 - person.workload) / 100 * 8) + (domainMeets ? 8 : 0)));
  const qualified = skillFindings.every((item) => item.meets) && domainMeets;
  return { ...person, score, status: qualified ? 'Qualified' : gaps.length <= 2 && score >= 45 ? 'Near qualified' : 'Skill gaps', findings: skillFindings, gaps, domainProjectCount, domainMeets, matchReasons: [`${skillFindings.filter((item) => item.meets).length} of ${skillFindings.length} required skills meet proficiency`, `${projectEvidence} relevant project evidence point${projectEvidence === 1 ? '' : 's'}`, parsed.domain ? `${domainProjectCount} ${parsed.domain} domain project${domainProjectCount === 1 ? '' : 's'}` : `${person.experienceYears} years of experience`, `${person.certifications.length} active certification${person.certifications.length === 1 ? '' : 's'}`, `${100 - person.workload}% available capacity`] };
}
function safeEmployee(person) { const { userId, ...safe } = person; return safe; }

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use((req, res, next) => {
  req.cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((part) => { const index = part.indexOf('='); return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())]; }));
  next();
});
const requestBuckets = new Map();
function rateLimit({ limit, windowMs }) {
  return (req, res, next) => {
    const key = `${req.ip || req.socket.remoteAddress}:${req.path}`; const now = Date.now();
    const bucket = requestBuckets.get(key) || { count: 0, resetAt: now + windowMs };
    if (bucket.resetAt <= now) { bucket.count = 0; bucket.resetAt = now + windowMs; }
    bucket.count++; requestBuckets.set(key, bucket);
    if (bucket.count > limit) return res.status(429).json({ error: 'Too many requests. Please wait and try again.' });
    if (requestBuckets.size > 5000) for (const [k, v] of requestBuckets) if (v.resetAt < now) requestBuckets.delete(k);
    next();
  };
}
const authRateLimit = rateLimit({ limit: 10, windowMs: 15 * 60 * 1000 });
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/session', (req, res) => {
  const token = req.cookies.session;
  if (!token) return res.json({ user: null });
  const [payload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(payload || '').digest('base64url');
  const a = Buffer.from(signature || ''); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.json({ user: null });
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const user = state.users.find((entry) => entry.id === claims.sub);
    if (!user || claims.exp < Date.now() || user.verified === false) return res.json({ user: null });
    return res.json({ user: publicUser(user) });
  } catch { return res.json({ user: null }); }
});
app.post('/api/register', authRateLimit, async (req, res) => {
  const { name, email, password, confirmPassword } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const domain = normalizedEmail.split('@')[1] || '';
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || !password || password.length < 8 || password !== confirmPassword) return res.status(400).json({ error: 'Enter a name, valid work email, matching password (8+ characters).' });
  if (!allowedEmailDomains.has(domain)) return res.status(403).json({ error: `This email domain is not approved for registration. Approved domains: ${[...allowedEmailDomains].join(', ') || 'none configured'}.` });
  if (state.users.some((user) => user.email.toLowerCase() === normalizedEmail)) return res.status(409).json({ error: 'An account with that email already exists.' });
  // Public registration is employee-only. HR access must be provisioned by an authorized administrator.
  const userId = crypto.randomUUID();
  const verificationToken = crypto.randomBytes(32).toString('base64url');
  const user = { ...userRecord(userId, name.trim(), normalizedEmail, password, 'employee'), verified: false, verificationTokenHash: crypto.createHash('sha256').update(verificationToken).digest('hex'), verificationExpiresAt: Date.now() + 30 * 60 * 1000 };
  state.users.push(user);
  await persist();
  const baseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;
  const response = { ok: true, requiresVerification: true, message: 'Account created. Verify your email before signing in.' };
  // Local demo has no email provider, so expose a short-lived verification link only outside production.
  if (!isProduction) response.developmentVerificationUrl = `${baseUrl}/api/verify-email?token=${encodeURIComponent(verificationToken)}`;
  res.status(201).json(response);
});
app.get('/api/verify-email', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token || token.length > 256) return res.status(400).send('Invalid or expired verification link.');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = state.users.find((entry) => entry.verified === false && entry.verificationTokenHash === tokenHash);
  if (!user || user.verificationExpiresAt < Date.now()) return res.status(400).send('Invalid or expired verification link. Please register again or contact your administrator.');
  user.verified = true; delete user.verificationTokenHash; delete user.verificationExpiresAt;
  const employee = createEmployee(state.employees.length);
  Object.assign(employee, { id: `emp-${crypto.randomUUID().slice(0, 8)}`, name: user.name, email: user.email, userId: user.id, skills: [], projects: [], certifications: [], workload: 0, availability: 'Available', evidence: 'New profile — no skills or evidence verified yet.' });
  state.employees.push(employee);
  await persist();
  res.status(200).send('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Email verified</title></head><body style="font-family:system-ui;max-width:560px;margin:12vh auto;padding:24px;color:#183b28"><h1>Email verified</h1><p>Your employee account is verified. Return to the skillGraph sign-in page and log in.</p><a href="/">Go to sign in</a></body></html>');
});
app.post('/api/login', authRateLimit, async (req, res) => {
  const { email, password } = req.body || {};
  const user = state.users.find((entry) => entry.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !crypto.timingSafeEqual(Buffer.from(crypto.scryptSync(password || '', user.salt, 64).toString('hex')), Buffer.from(user.hash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  if (user.verified === false) return res.status(403).json({ error: 'Please verify your email before signing in.' });
  res.cookie('session', tokenFor(user), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 12 * 60 * 60 * 1000 });
  res.json({ user: publicUser(user) });
});
app.post('/api/logout', (req, res) => { res.clearCookie('session', { httpOnly: true, sameSite: 'lax' }); res.json({ ok: true }); });
app.get('/api/dashboard', auth(), (req, res) => {
  const person = employeeFor(req.user);
  if (req.user.role === 'hr') return res.json({ user: publicUser(req.user), employees: state.employees.slice(0, 8).map(safeEmployee), employeeCount: state.employees.length, openings: state.openings.filter((opening) => opening.published), interests: state.interests.map((interest) => ({ ...interest, employee: safeEmployee(state.employees.find((entry) => entry.id === interest.employeeId) || {}) })), mode: mysqlPool ? 'mysql' : 'local' });
  const learning = learningFor(req.user);
  const seconds = learning.accumulatedSeconds + (learning.sessionStartedAt ? Math.max(0, (Date.now() - learning.sessionStartedAt) / 1000) : 0);
  res.json({ user: publicUser(req.user), employee: person ? safeEmployee(person) : null, course: state.course, learning: { ...learning, timeSpentHours: seconds / 3600, remainingHours: Math.max(0, state.course.durationHours - seconds / 3600), progress: Math.round(learning.completed.length / state.course.modules.length * 100), achievement: state.evaluations[req.user.id] || null }, openings: state.openings.filter((opening) => opening.published), interests: state.interests.filter((interest) => interest.employeeId === person?.id), mode: mysqlPool ? 'mysql' : 'local' });
});
app.post('/api/hr/search', auth('hr'), (req, res) => {
  const parsed = queryRequirements(req.body?.query);
  const ranked = state.employees.map((person) => matchEmployee(person, parsed)).sort((a, b) => b.score - a.score);
  const qualified = ranked.filter((person) => person.status === 'Qualified');
  const nearQualified = ranked.filter((person) => person.status === 'Near qualified');
  const withGaps = ranked.filter((person) => person.status === 'Skill gaps');
  const matches = ranked.map((person) => ({ ...safeEmployee(person), score: person.score, status: person.status, findings: person.findings, gaps: person.gaps, domainProjectCount: person.domainProjectCount, matchReasons: person.matchReasons }));
  res.json({ query: parsed, matches, totals: { qualified: qualified.length, nearQualified: nearQualified.length, withGaps: withGaps.length } });
});
app.get('/api/employees/:id/graph', auth(), (req, res) => {
  const person = state.employees.find((entry) => entry.id === req.params.id);
  if (!person) return res.status(404).json({ error: 'Employee not found.' });
  if (req.user.role === 'employee' && person.userId !== req.user.id) return res.status(403).json({ error: 'You can only view your own skill graph.' });
  res.json({ employee: safeEmployee(person), nodes: person.skills.filter((skill) => skill.level !== 'Missing').map((skill, index) => ({ ...skill, x: 70 + (index % 3) * 155, y: 50 + Math.floor(index / 3) * 110 })), projects: person.projects, certifications: person.certifications });
});
app.post('/api/employee/skill-evidence', auth('employee'), async (req, res) => {
  const person = employeeFor(req.user);
  if (!person) return res.status(404).json({ error: 'Employee profile not found.' });
  const rawProjects = Array.isArray(req.body?.projects) ? req.body.projects : [];
  const rawCertifications = Array.isArray(req.body?.certifications) ? req.body.certifications : [];
  const rawSkills = Array.isArray(req.body?.skills) ? req.body.skills : [];

  const projects = rawProjects
    .map((project) => ({
      name: String(project?.name || '').trim(),
      domain: String(project?.domain || 'General').trim() || 'General',
      year: Number(project?.year) || new Date().getFullYear(),
      link: String(project?.link || '').trim(),
      technologies: Array.isArray(project?.technologies) ? project.technologies.map((skill) => String(skill).trim()).filter(Boolean) : []
    }))
    .filter((project) => project.name);

  for (const project of projects) {
    const existing = person.projects.find((entry) => entry.name.toLowerCase() === project.name.toLowerCase());
    if (existing) {
      if (project.link && !existing.link) existing.link = project.link;
      if (project.domain && !existing.domain) existing.domain = project.domain;
      if (project.year) existing.year = project.year;
      existing.technologies = Array.from(new Set([...(existing.technologies || []), ...project.technologies]));
      continue;
    }
    person.projects.push({ name: project.name, domain: project.domain, year: project.year, link: project.link, technologies: project.technologies.length ? project.technologies : ['Project Delivery'] });
  }

  const certifications = rawCertifications
    .map((cert) => ({
      name: String(cert?.name || '').trim(),
      year: Number(cert?.year) || new Date().getFullYear(),
      issuer: String(cert?.issuer || 'Self-reported').trim() || 'Self-reported'
    }))
    .filter((cert) => cert.name);

  for (const cert of certifications) {
    if (!person.certifications.some((entry) => entry.name.toLowerCase() === cert.name.toLowerCase())) {
      person.certifications.push({ name: cert.name, year: cert.year, issuer: cert.issuer });
    }
  }

  const skills = [...new Set([...rawSkills.map((skill) => String(skill).trim()).filter(Boolean), ...projects.flatMap((project) => project.technologies)])];
  for (const skillName of skills) {
    const skill = person.skills.find((entry) => entry.name.toLowerCase() === skillName.toLowerCase());
    if (skill) {
      // Submitted links/projects are self-reported until an authorized reviewer verifies them.
      skill.evidenceStatus = skill.evidenceStatus || 'Self-reported';
    } else {
      person.skills.push({ name: skillName, level: 'Beginner', years: 1, evidenceStatus: 'Self-reported' });
    }
  }

  person.evidence = `Updated with project evidence and certifications on ${new Date().toISOString().slice(0, 10)}.`;
  await persist();
  res.json({ employee: safeEmployee(person), ok: true });
});
app.post('/api/learning/session', auth('employee'), async (req, res) => {
  const learning = learningFor(req.user);
  if (req.body?.action === 'start') { if (!learning.sessionStartedAt) learning.sessionStartedAt = Date.now(); }
  else if (req.body?.action === 'pause') { if (learning.sessionStartedAt) { learning.accumulatedSeconds += Math.max(0, (Date.now() - learning.sessionStartedAt) / 1000); learning.sessionStartedAt = null; } }
  else return res.status(400).json({ error: 'Choose start or pause.' });
  await persist();
  res.json({ running: Boolean(learning.sessionStartedAt), timeSpentHours: (learning.accumulatedSeconds + (learning.sessionStartedAt ? (Date.now() - learning.sessionStartedAt) / 1000 : 0)) / 3600 });
});
app.post('/api/learning/modules/:index', auth('employee'), async (req, res) => {
  const index = Number(req.params.index); const learning = learningFor(req.user);
  if (!Number.isInteger(index) || index < 0 || index >= state.course.modules.length) return res.status(400).json({ error: 'Invalid module.' });
  if (!learning.completed.includes(index)) learning.completed.push(index);
  let evidenceTask = null;
  if (learning.completed.length >= state.course.modules.length) evidenceTask = createEvidenceTask(req.user, 'All course modules completed');
  await persist();
  res.json({ completed: learning.completed, progress: Math.round(learning.completed.length / state.course.modules.length * 100), evidenceTask });
});
app.post('/api/learning/assessment', auth('employee'), async (req, res) => {
  const answers = req.body?.answers;
  if (!Array.isArray(answers) || answers.length !== state.course.questions.length) return res.status(400).json({ error: 'Answer every assessment question.' });
  const correct = answers.reduce((sum, answer, index) => sum + (Number(answer) === state.course.questions[index].answer ? 1 : 0), 0);
  const learning = learningFor(req.user); learning.assessmentScore = Math.round(correct / answers.length * 100);
  await persist();
  res.json({ score: learning.assessmentScore, correct, total: answers.length });
});
app.post('/api/learning/project', auth('employee'), async (req, res) => {
  const score = Math.max(0, Math.min(100, Math.round(Number(req.body?.score))));
  if (!Number.isFinite(score)) return res.status(400).json({ error: 'Enter a project score from 0 to 100.' });
  const learning = learningFor(req.user); learning.projectScore = score; await persist();
  res.json({ score });
});
app.post('/api/learning/evaluate', auth('employee'), async (req, res) => {
  const learning = learningFor(req.user);
  if (learning.completed.length < state.course.modules.length || learning.assessmentScore === null || learning.projectScore === null) return res.status(400).json({ error: 'Complete all modules, the assessment, and the practical project before evaluation.' });
  const achievement = Math.round(learning.assessmentScore * 0.4 + learning.projectScore * 0.3 + (learning.completed.length / state.course.modules.length * 100) * 0.2 + (learning.certified ? 100 : 0) * 0.1);
  state.evaluations[req.user.id] = { achievement, assessmentScore: learning.assessmentScore, projectScore: learning.projectScore, courseCompletion: 100, certified: learning.certified, evidence: `Assessment ${learning.assessmentScore}% (40%), practical project ${learning.projectScore}% (30%), all modules completed (20%), certification ${learning.certified ? 'earned' : 'not earned'} (${learning.certified ? '10%' : '0%'}).` };
  const person = employeeFor(req.user);
  // Learning scores are recorded as assessment evidence; they do not silently change verified proficiency.
  await persist(); res.json({ evaluation: state.evaluations[req.user.id], employee: person ? safeEmployee(person) : null });
});
app.post('/api/learning/certification', auth('employee'), async (req, res) => { const learning = learningFor(req.user); if (learning.assessmentScore < 70) return res.status(400).json({ error: 'Score at least 70% on the assessment to earn the course certificate.' }); learning.certified = true; const person = employeeFor(req.user); if (person && !person.certifications.some((certification) => certification.name === `${state.course.title} Certificate`)) person.certifications.push({ name: `${state.course.title} Certificate`, year: new Date().getFullYear() }); await persist(); res.json({ certified: true }); });
app.get('/api/notifications', auth(), (req, res) => {
  const items = state.notifications.filter((item) => item.userId === req.user.id).slice(0, 200);
  res.json({ notifications: items, unreadCount: items.filter((item) => !item.readAt).length });
});
app.post('/api/notifications/:id/read', auth(), async (req, res) => {
  const item = state.notifications.find((n) => n.id === req.params.id && n.userId === req.user.id);
  if (!item) return res.status(404).json({ error: 'Notification not found.' });
  item.readAt ||= new Date().toISOString(); await persist(); res.json({ ok: true, notification: item });
});
app.post('/api/notifications/read-all', auth(), async (req, res) => {
  const now = new Date().toISOString(); let updated = 0;
  for (const item of state.notifications.filter((n) => n.userId === req.user.id && !n.readAt)) { item.readAt = now; updated++; }
  await persist(); res.json({ ok: true, updated });
});
app.get('/api/evidence', auth(), (req, res) => {
  const tasks = state.evidenceTasks.filter((task) => req.user.role === 'hr' || task.userId === req.user.id);
  res.json({ tasks });
});
app.post('/api/evidence/:id/submit', auth('employee'), async (req, res) => {
  const task = state.evidenceTasks.find((item) => item.id === req.params.id && item.userId === req.user.id);
  if (!task) return res.status(404).json({ error: 'Evidence task not found.' });
  if (!['Awaiting submission', 'Changes requested'].includes(task.status)) return res.status(409).json({ error: 'This task is not accepting submissions.' });
  const { evidenceType, title, description, url } = req.body || {};
  const allowedTypes = ['Certificate', 'Project', 'GitHub/Portfolio', 'Assessment', 'Reviewer feedback', 'Other'];
  if (!allowedTypes.includes(evidenceType) || !String(title || '').trim() || !String(description || '').trim()) return res.status(400).json({ error: 'Provide an evidence type, title, and description.' });
  const safeUrl = String(url || '').trim();
  if (safeUrl && !/^https:\/\//i.test(safeUrl)) return res.status(400).json({ error: 'Evidence links must use HTTPS.' });
  const submission = { id: `sub-${crypto.randomUUID()}`, evidenceType, title: String(title).trim().slice(0, 160), description: String(description).trim().slice(0, 3000), url: safeUrl.slice(0, 1000), submittedAt: new Date().toISOString(), status: 'Under review' };
  task.submissions.push(submission); task.status = 'Under review'; task.decisionReason = null;
  addAudit(req.user, 'evidence_submitted', 'evidenceTask', task.id, { submissionId: submission.id, evidenceType });
  for (const reviewer of state.users.filter((u) => u.role === 'hr')) addNotification(reviewer.id, { type: 'evidence_submitted', title: 'Evidence ready for review', message: `${req.user.name} submitted ${submission.title}.`, entityType: 'evidenceTask', entityId: task.id, dedupeKey: `evidence-submitted:${submission.id}:${reviewer.id}` });
  await persist(); res.status(201).json({ ok: true, task });
});
app.post('/api/hr/evidence/:id/review', auth('hr'), async (req, res) => {
  const task = state.evidenceTasks.find((item) => item.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Evidence task not found.' });
  const decision = String(req.body?.decision || ''); const reason = String(req.body?.reason || '').trim();
  if (!['Approved', 'Rejected', 'Changes requested'].includes(decision)) return res.status(400).json({ error: 'Choose Approved, Rejected, or Changes requested.' });
  if (decision !== 'Approved' && !reason) return res.status(400).json({ error: 'Provide a reason for rejection or requested changes.' });
  const submission = task.submissions[task.submissions.length - 1];
  if (!submission || task.status !== 'Under review') return res.status(409).json({ error: 'There is no submission awaiting review.' });
  submission.status = decision; submission.reviewedAt = new Date().toISOString(); submission.reviewerUserId = req.user.id; submission.reviewReason = reason || null;
  task.status = decision; task.reviewerUserId = req.user.id; task.reviewedAt = submission.reviewedAt; task.decisionReason = reason || null;
  addAudit(req.user, 'evidence_reviewed', 'evidenceTask', task.id, { decision, submissionId: submission.id, reason });
  addNotification(task.userId, { type: `evidence_${decision.toLowerCase().replaceAll(' ', '_')}`, title: `Evidence ${decision.toLowerCase()}`, message: reason || `Your evidence for ${state.course.title} was approved.`, entityType: 'evidenceTask', entityId: task.id, dedupeKey: `evidence-decision:${submission.id}:${decision}` });
  // Approval records verification metadata, but never infers a new proficiency level from the submission alone.
  if (decision === 'Approved') {
    const employee = state.employees.find((e) => e.id === task.employeeId);
    if (employee) employee.evidenceRecords = [...(employee.evidenceRecords || []), { taskId: task.id, submissionId: submission.id, verifiedBy: req.user.id, verifiedAt: submission.reviewedAt, evidenceType: submission.evidenceType, title: submission.title }];
  }
  await persist(); res.json({ ok: true, task });
});
app.get('/api/hr/audit-log', auth('hr'), (req, res) => res.json({ entries: state.auditLog.slice(0, 500) }));
app.get('/api/hr/settings', auth('hr'), (req, res) => res.json({ allowedEmailDomains: [...allowedEmailDomains], evidenceDueDays: state.companySettings?.evidenceDueDays ?? null, emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) }));
app.put('/api/hr/settings', auth('hr'), async (req, res) => {
  const days = req.body?.evidenceDueDays;
  if (days !== undefined && days !== null && days !== '' && (!Number.isInteger(Number(days)) || Number(days) < 1 || Number(days) > 365)) return res.status(400).json({ error: 'Evidence due days must be between 1 and 365, or null to disable deadlines.' });
  if (days !== undefined) state.companySettings.evidenceDueDays = days === null || days === '' ? null : Number(days);
  if (req.body?.allowedEmailDomains !== undefined) {
    const rawDomains = req.body.allowedEmailDomains;
    if (!Array.isArray(rawDomains) || rawDomains.length > 50 || rawDomains.some((d) => typeof d !== 'string' || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d.trim()) || d.includes('@'))) return res.status(400).json({ error: 'Provide a list of valid company email domains, without @ signs.' });
    const domains = [...new Set(rawDomains.map((d) => d.trim().toLowerCase()))];
    if (!domains.length) return res.status(400).json({ error: 'At least one approved email domain is required.' });
    allowedEmailDomains.clear(); for (const domain of domains) allowedEmailDomains.add(domain);
    state.companySettings.allowedEmailDomains = domains;
  }
  addAudit(req.user, 'company_settings_updated', 'companySettings', 'settings', { evidenceDueDays: state.companySettings.evidenceDueDays, allowedEmailDomains: [...allowedEmailDomains] });
  await persist(); res.json({ ok: true, evidenceDueDays: state.companySettings.evidenceDueDays, allowedEmailDomains: [...allowedEmailDomains] });
});
app.post('/api/hr/invitations', auth('hr'), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase(); const name = String(req.body?.name || '').trim();
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a name and valid company email.' });
  if (!allowedEmailDomains.has(email.split('@')[1])) return res.status(403).json({ error: 'Email domain is not approved.' });
  if (state.users.some((u) => u.email.toLowerCase() === email) || state.invitations.some((i) => i.email === email && !i.acceptedAt && !i.revokedAt && new Date(i.expiresAt).getTime() > Date.now())) return res.status(409).json({ error: 'An account or active invitation already exists for this email.' });
  if (isProduction && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) return res.status(503).json({ error: 'Configure RESEND_API_KEY and EMAIL_FROM before creating production invitations.' });
  const rawToken = crypto.randomBytes(32).toString('base64url'); const invite = { id: `inv-${crypto.randomUUID()}`, name, email, tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'), invitedBy: req.user.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 72 * 3600000).toISOString(), acceptedAt: null, revokedAt: null };
  state.invitations.unshift(invite); addAudit(req.user, 'invitation_created', 'invitation', invite.id, { email });
  let emailResult = { sent: false, reason: 'Email provider is not configured; invitation is available to HR in local mode.' };
  try { emailResult = await sendConfiguredEmail(email, 'Your TalentGraph employee invitation', `<p>Hello ${name.replace(/[&<>\"']/g, '')},</p><p>You have been invited to join TalentGraph. Use this one-time invitation link:</p><p><a href="${(process.env.APP_BASE_URL || `http://localhost:${port}`).replace(/&/g, '&amp;')}/invite?token=${rawToken}">Accept invitation</a></p><p>This link expires in 72 hours.</p>`); } catch (error) { emailResult = { sent: false, reason: 'Email delivery failed; retry after checking provider configuration.' }; }
  if (isProduction && !emailResult.sent) { invite.revokedAt = new Date().toISOString(); await persist(); return res.status(502).json({ error: 'Invitation email could not be delivered. Check provider configuration and retry.' }); }
  await persist(); res.status(201).json({ invitation: { id: invite.id, email, name, expiresAt: invite.expiresAt, emailSent: emailResult.sent, emailMessage: emailResult.reason, ...(!isProduction ? { developmentAcceptanceUrl: `${process.env.APP_BASE_URL || `http://localhost:${port}`}/api/invitations/accept?token=${encodeURIComponent(rawToken)}` } : {}) } });
});
app.post('/api/hr/invitations/:id/revoke', auth('hr'), async (req, res) => {
  const invite = state.invitations.find((i) => i.id === req.params.id && !i.acceptedAt);
  if (!invite) return res.status(404).json({ error: 'Active invitation not found.' });
  invite.revokedAt = new Date().toISOString(); addAudit(req.user, 'invitation_revoked', 'invitation', invite.id); await persist(); res.json({ ok: true });
});
app.get('/invite', (req, res) => {
  const token = String(req.query.token || '');
  if (!token || token.length > 256 || !/^[A-Za-z0-9_-]+$/.test(token)) return res.status(400).send('Invalid invitation link.');
  res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Accept TalentGraph invitation</title><style>body{font-family:system-ui;max-width:520px;margin:8vh auto;padding:24px;color:#183b28}label,input,button{display:block;width:100%;box-sizing:border-box;margin:10px 0}input,button{padding:12px;border:1px solid #ccd5ce;border-radius:8px}button{background:#d6f46a;border:0;font-weight:700;cursor:pointer}p{color:#53665a}</style></head><body><h1>Join TalentGraph</h1><p>Set a password to activate your employee account. Invitation links are single-use and expire after 72 hours.</p><form method="post" action="/api/invitations/accept"><input type="hidden" name="token" value="${token}"><label for="password">Password (at least 8 characters)</label><input id="password" name="password" type="password" minlength="8" required autocomplete="new-password"><button type="submit">Accept invitation</button></form></body></html>`);
});
app.post('/api/invitations/accept', authRateLimit, async (req, res) => {
  const token = String(req.body?.token || req.query?.token || '');
  if (!token || token.length > 256) return res.status(400).json({ error: 'Invalid invitation.' });
  const hash = crypto.createHash('sha256').update(token).digest('hex'); const invite = state.invitations.find((i) => i.tokenHash === hash);
  if (!invite || invite.acceptedAt || invite.revokedAt || new Date(invite.expiresAt).getTime() < Date.now()) return res.status(400).json({ error: 'Invitation is invalid, expired, or already used.' });
  const password = String(req.body?.password || '');
  if (password.length < 8) return res.status(400).json({ error: 'Set a password with at least 8 characters.' });
  const userId = crypto.randomUUID(); const user = { ...userRecord(userId, invite.name, invite.email, password, 'employee'), verified: true, invitedAt: new Date().toISOString() };
  state.users.push(user); const employee = { id: `emp-${crypto.randomUUID().slice(0, 8)}`, name: invite.name, email: invite.email, userId, title: 'Employee', department: 'Unassigned', location: '', experienceYears: 0, skills: [], projects: [], certifications: [], workload: 0, availability: 'Available', evidence: 'New profile — no skills or evidence verified yet.' };
  state.employees.push(employee); invite.acceptedAt = new Date().toISOString(); delete invite.tokenHash; addAudit({ id: invite.invitedBy }, 'invitation_accepted', 'invitation', invite.id, { userId }); await persist(); res.status(201).json({ ok: true, user: publicUser(user), employee: safeEmployee(employee) });
});
app.post('/api/openings', auth('hr'), async (req, res) => {
  const { title, domain, duration, description, requirements } = req.body || {};
  if (!title?.trim() || !duration?.trim() || !Array.isArray(requirements) || !requirements.length) return res.status(400).json({ error: 'Add a title, duration, and at least one required skill.' });
  const opening = { id: `opening-${crypto.randomUUID().slice(0, 8)}`, title: title.trim(), domain: domain || '', duration: duration.trim(), description: description || '', requirements: requirements.map((item) => ({ name: String(item.name), level: levels.includes(item.level) ? item.level : 'Intermediate' })), published: true, createdAt: new Date().toISOString() };
  state.openings.unshift(opening); await persist(); res.status(201).json({ opening });
});
app.post('/api/openings/:id/interest', auth('employee'), async (req, res) => {
  const person = employeeFor(req.user); const opening = state.openings.find((item) => item.id === req.params.id && item.published);
  if (!person || !opening) return res.status(404).json({ error: 'Opening not found.' });
  if (!state.interests.some((item) => item.openingId === opening.id && item.employeeId === person.id)) state.interests.push({ openingId: opening.id, employeeId: person.id, createdAt: new Date().toISOString(), status: 'Interested' });
  await persist(); res.json({ ok: true });
});

async function processEvidenceReminders() {
  if (!state) return;
  const now = Date.now(); let changed = false;
  for (const task of state.evidenceTasks || []) {
    if (!task.dueAt || !['Awaiting submission', 'Changes requested'].includes(task.status)) continue;
    const due = new Date(task.dueAt).getTime(); const remaining = due - now;
    const candidates = [{ key: '7d', offset: 7 * 86400000, title: 'Evidence deadline in 7 days' }, { key: '3d', offset: 3 * 86400000, title: 'Evidence deadline in 3 days' }, { key: '24h', offset: 86400000, title: 'Evidence deadline in 24 hours' }, { key: 'overdue', offset: 0, title: 'Evidence submission overdue' }];
    for (const candidate of candidates) {
      const shouldSend = candidate.key === 'overdue' ? remaining < 0 : remaining >= candidate.offset && remaining < candidate.offset + 86400000;
      if (!shouldSend || (task.remindersSent || []).includes(candidate.key)) continue;
      addNotification(task.userId, { type: `evidence_${candidate.key}`, title: candidate.title, message: candidate.key === 'overdue' ? 'Your evidence task is overdue. Submit it or contact HR.' : `Your evidence task is due ${candidate.key === '24h' ? 'within 24 hours' : `in ${candidate.key === '7d' ? '7 days' : '3 days'}`}.`, entityType: 'evidenceTask', entityId: task.id, dueAt: task.dueAt, dedupeKey: `reminder:${task.id}:${candidate.key}` });
      task.remindersSent ||= []; task.remindersSent.push(candidate.key); changed = true;
    }
  }
  if (changed) await persist();
}
initialize().then(() => {
  processEvidenceReminders().catch((error) => console.error('Reminder processing failed:', error.message));
  const reminderTimer = setInterval(() => processEvidenceReminders().catch((error) => console.error('Reminder processing failed:', error.message)), 60 * 60 * 1000);
  if (reminderTimer.unref) reminderTimer.unref();
  app.listen(port, () => console.log(`Skill Graph running at http://localhost:${port} (${mysqlPool ? 'MySQL' : 'local demo'} mode)`));
}).catch((error) => { console.error('Could not initialize application storage:', error.message); process.exitCode = 1; });

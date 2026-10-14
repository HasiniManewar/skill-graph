CREATE DATABASE IF NOT EXISTS skillgraph_talent CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE skillgraph_talent;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY, name VARCHAR(160) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, role ENUM('hr','employee') NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(64) UNIQUE, title VARCHAR(160) NOT NULL DEFAULT '', department VARCHAR(120) NOT NULL DEFAULT '',
  location VARCHAR(120) NOT NULL DEFAULT '', experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS skills (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, category VARCHAR(80) NOT NULL DEFAULT 'Technical'
);
CREATE TABLE IF NOT EXISTS skill_synonyms (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, skill_id BIGINT UNSIGNED NOT NULL, synonym VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_skill_synonym (skill_id, synonym), FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS employee_skills (
  employee_id VARCHAR(64) NOT NULL, skill_id BIGINT UNSIGNED NOT NULL,
  proficiency ENUM('Beginner','Intermediate','Advanced','Expert') NOT NULL, years_experience DECIMAL(4,1) NOT NULL DEFAULT 0,
  evidence TEXT, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id, skill_id), FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(180) NOT NULL, domain VARCHAR(100) NOT NULL DEFAULT '',
  description TEXT, started_year SMALLINT UNSIGNED
);
CREATE TABLE IF NOT EXISTS employee_projects (
  employee_id VARCHAR(64) NOT NULL, project_id BIGINT UNSIGNED NOT NULL, contribution VARCHAR(180) NOT NULL DEFAULT '',
  PRIMARY KEY (employee_id, project_id), FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS project_skills (
  project_id BIGINT UNSIGNED NOT NULL, skill_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (project_id, skill_id), FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS certifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(180) NOT NULL UNIQUE, provider VARCHAR(120) NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS employee_certifications (
  employee_id VARCHAR(64) NOT NULL, certification_id BIGINT UNSIGNED NOT NULL, earned_at DATE,
  PRIMARY KEY (employee_id, certification_id), FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (certification_id) REFERENCES certifications(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS workload (
  employee_id VARCHAR(64) PRIMARY KEY, workload_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CHECK (workload_percent <= 100), FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS internal_project_openings (
  id VARCHAR(64) PRIMARY KEY, title VARCHAR(180) NOT NULL, domain VARCHAR(100) NOT NULL DEFAULT '', duration VARCHAR(80) NOT NULL,
  description TEXT, published BOOLEAN NOT NULL DEFAULT TRUE, created_by VARCHAR(64), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS required_project_skills (
  opening_id VARCHAR(64) NOT NULL, skill_id BIGINT UNSIGNED NOT NULL, proficiency ENUM('Beginner','Intermediate','Advanced','Expert') NOT NULL,
  PRIMARY KEY (opening_id, skill_id), FOREIGN KEY (opening_id) REFERENCES internal_project_openings(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS project_interests (
  opening_id VARCHAR(64) NOT NULL, employee_id VARCHAR(64) NOT NULL, status ENUM('Interested','Reviewed','Shortlisted','Declined') NOT NULL DEFAULT 'Interested',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (opening_id, employee_id),
  FOREIGN KEY (opening_id) REFERENCES internal_project_openings(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(64) PRIMARY KEY, title VARCHAR(220) NOT NULL, provider VARCHAR(160) NOT NULL, estimated_hours DECIMAL(6,1) NOT NULL,
  certification_available BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS course_modules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, course_id VARCHAR(64) NOT NULL, title VARCHAR(220) NOT NULL,
  position SMALLINT UNSIGNED NOT NULL, estimated_hours DECIMAL(5,1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_course_module (course_id, position), FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS learning_resources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, course_id VARCHAR(64) NOT NULL, title VARCHAR(220) NOT NULL,
  resource_type VARCHAR(60) NOT NULL, url VARCHAR(600) NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS employee_course_progress (
  employee_id VARCHAR(64) NOT NULL, course_id VARCHAR(64) NOT NULL, actual_seconds BIGINT UNSIGNED NOT NULL DEFAULT 0,
  session_started_at DATETIME(3) NULL, certified BOOLEAN NOT NULL DEFAULT FALSE, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id, course_id), FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS course_module_completions (
  employee_id VARCHAR(64) NOT NULL, module_id BIGINT UNSIGNED NOT NULL, completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id, module_id), FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS assessments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, course_id VARCHAR(64) NOT NULL, title VARCHAR(180) NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS assessment_questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, assessment_id BIGINT UNSIGNED NOT NULL, prompt TEXT NOT NULL,
  options_json JSON NOT NULL, answer_index TINYINT UNSIGNED NOT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, assessment_id BIGINT UNSIGNED NOT NULL, employee_id VARCHAR(64) NOT NULL,
  score DECIMAL(5,2) NOT NULL, answers_json JSON NOT NULL, attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE, FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS suggested_projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, course_id VARCHAR(64) NOT NULL, title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL, FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS project_evaluations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, project_id BIGINT UNSIGNED NOT NULL, employee_id VARCHAR(64) NOT NULL,
  score DECIMAL(5,2) NOT NULL, evidence_json JSON NOT NULL, evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES suggested_projects(id) ON DELETE CASCADE, FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS skill_gaps (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, employee_id VARCHAR(64) NOT NULL, skill_id BIGINT UNSIGNED NOT NULL,
  current_proficiency ENUM('Beginner','Intermediate','Advanced','Expert') NULL,
  target_proficiency ENUM('Beginner','Intermediate','Advanced','Expert') NOT NULL, status ENUM('Open','In progress','Demonstrated') NOT NULL DEFAULT 'Open',
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE, FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS upskilling_paths (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, employee_id VARCHAR(64) NOT NULL, skill_id BIGINT UNSIGNED NOT NULL,
  course_id VARCHAR(64) NOT NULL, status ENUM('Suggested','In progress','Completed') NOT NULL DEFAULT 'Suggested',
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE, FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS app_state (
  id TINYINT PRIMARY KEY, payload JSON NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

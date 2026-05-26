-- School Lesson Plan Generation Platform — MySQL Schema

CREATE DATABASE IF NOT EXISTS prayag_lplan;
USE prayag_lplan;

-- Drop existing tables to ensure schema updates are applied
DROP TABLE IF EXISTS plan_instances;
DROP TABLE IF EXISTS schools;

-- Schools (tenants)
CREATE TABLE IF NOT EXISTS schools (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  domain      TEXT,
  code        VARCHAR(50),
  api_key     VARCHAR(256) UNIQUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plan Instances (also serves as the task queue)
CREATE TABLE IF NOT EXISTS plan_instances (
  id                  VARCHAR(36) PRIMARY KEY,
  school_id           INT NOT NULL,
  name                VARCHAR(255),
  textbook_url        TEXT NOT NULL,
  syllabus_url        TEXT NOT NULL,
  routine_url         TEXT NOT NULL,
  holiday_calendar_url TEXT NOT NULL,
  session_start       DATE NOT NULL,
  session_end         DATE NOT NULL,
  status              ENUM('pending','processing','completed','failed', 'callback_sent', 'callback_failed') NOT NULL DEFAULT 'pending',
  is_callback         BOOLEAN DEFAULT 0,
  response_url        TEXT,
  result_json         LONGTEXT,
  error_message       TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  INDEX idx_status_created (status, created_at)
);

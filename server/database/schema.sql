-- =======================================================================
-- SignBridge AI Database Architecture (MySQL 8.0+)
-- "Connecting People Beyond Language"
-- =======================================================================

CREATE DATABASE IF NOT EXISTS `signbridge_db`
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `signbridge_db`;

-- -----------------------------------------------------------------------
-- 1. Users Table
-- Supports Email/Password (bcrypt-hashed) & Google OAuth 2.0 social sign-in.
-- Role-based access for deaf users, hearing users, and platform admins.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL COMMENT 'Null for Google OAuth-only accounts',
  `google_id` VARCHAR(255) DEFAULT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `role` ENUM('deaf_user', 'hearing_user', 'admin') NOT NULL DEFAULT 'deaf_user',
  `preferred_language` VARCHAR(20) DEFAULT 'en-US',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  UNIQUE KEY `idx_users_google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 2. Sessions Table
-- Stores two-way communication sessions between deaf and hearing users.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL DEFAULT 'Two-Way Conversation',
  `status` ENUM('active', 'ended') NOT NULL DEFAULT 'active',
  `metadata` JSON DEFAULT NULL COMMENT 'Session configuration, e.g. TTS voice, gestures detected count',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user_id` (`user_id`),
  KEY `idx_sessions_status` (`status`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 3. Messages Table
-- Stores conversation turns: Sign-to-Speech (AI reconstructed) & Voice-to-Text.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NOT NULL,
  `session_id` VARCHAR(36) NOT NULL,
  `sender_role` ENUM('deaf_user', 'hearing_user', 'system') NOT NULL,
  `input_type` ENUM('sign_ai', 'voice_stt', 'text') NOT NULL,
  `raw_content` TEXT DEFAULT NULL COMMENT 'Extracted sign gloss tokens (e.g., ["HELP", "DOCTOR"]) or raw audio transcript',
  `final_content` TEXT NOT NULL COMMENT 'Natural, grammatically reconstructed sentence or verified text',
  `confidence_score` FLOAT DEFAULT NULL COMMENT 'Confidence score (0.00 to 1.00) from ML classifier or STT engine',
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_session_id` (`session_id`),
  KEY `idx_messages_timestamp` (`timestamp`),
  CONSTRAINT `fk_messages_session` FOREIGN KEY (`session_id`) 
    REFERENCES `sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- Seed Initial Demo Data for Instant Verification & Testing
-- Passwords below are hashed with bcrypt (cost=10) for 'Password123!'
-- -----------------------------------------------------------------------
INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`)
VALUES 
  ('usr-demo-deaf-001', 'Alex Rivera', 'alex.deaf@signbridge.ai', '$2a$10$pIELCaycj9YQd6uBOlKNJOOCMldhddFnDpzzjc5k.7UjYiyZlUZqG', 'deaf_user'),
  ('usr-demo-hearing-002', 'Sarah Chen', 'sarah.hearing@signbridge.ai', '$2a$10$pIELCaycj9YQd6uBOlKNJOOCMldhddFnDpzzjc5k.7UjYiyZlUZqG', 'hearing_user')
ON DUPLICATE KEY UPDATE `email` = `email`;

INSERT INTO `sessions` (`id`, `user_id`, `title`, `status`)
VALUES 
  ('sess-demo-welcome-001', 'usr-demo-deaf-001', 'Welcome Demonstration Dialogue', 'active')
ON DUPLICATE KEY UPDATE `title` = `title`;

INSERT INTO `messages` (`id`, `session_id`, `sender_role`, `input_type`, `raw_content`, `final_content`, `confidence_score`)
VALUES 
  ('msg-demo-001', 'sess-demo-welcome-001', 'system', 'text', 'Session initialized', 'SignBridge AI session started. Ready for two-way communication.', 1.00),
  ('msg-demo-002', 'sess-demo-welcome-001', 'deaf_user', 'sign_ai', 'HELLO MEET NICE', 'Hello! It is very nice to meet you.', 0.94),
  ('msg-demo-003', 'sess-demo-welcome-001', 'hearing_user', 'voice_stt', 'Hello! Nice to meet you too. How can I help you today?', 'Hello! Nice to meet you too. How can I help you today?', 0.98),
  ('msg-demo-004', 'sess-demo-welcome-001', 'deaf_user', 'sign_ai', 'NEED DIRECTIONS TRAIN STATION', 'Could you please give me directions to the nearest train station?', 0.92)
ON DUPLICATE KEY UPDATE `final_content` = `final_content`;

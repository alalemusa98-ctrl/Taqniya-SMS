-- ==============================================================================
-- TAQNIYA SCHOOL MANAGEMENT SYSTEM (Taqniya-SMS)
-- Database Migration (UP): Initial Schema
-- Target Dialect: MySQL 8.0 (InnoDB / utf8mb4 / utf8mb4_unicode_ci)
-- Governed by: PROJECT/MD/database.md (Authoritative SSoT Blueprint)
-- Total Tables: 25 Tables across 9 Functional Phases
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 📦 Phase 01: Authentication, Identity & Audit (3 Tables)
-- ------------------------------------------------------------------------------

-- 1. users
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_code` VARCHAR(30) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role_type` ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_user_code` (`user_code`),
  INDEX `idx_users_role_type` (`role_type`),
  INDEX `idx_users_is_active` (`is_active`),
  INDEX `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. personal_access_tokens
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `device_name` VARCHAR(255) NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tokens_token_hash` (`token_hash`),
  INDEX `idx_tokens_user_id` (`user_id`),
  INDEX `idx_tokens_expires_at` (`expires_at`),
  CONSTRAINT `fk_tokens_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `old_values` JSON NULL DEFAULT NULL,
  `new_values` JSON NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_user_id` (`user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_created_at` (`created_at`),
  CONSTRAINT `fk_audit_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 📦 Phase 02: Academic Hierarchy & Curriculum (9 Tables)
-- ------------------------------------------------------------------------------

-- 4. academic_years
CREATE TABLE IF NOT EXISTS `academic_years` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_academic_years_name` (`name`),
  INDEX `idx_academic_years_is_active` (`is_active`),
  INDEX `idx_academic_years_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. academic_terms (Master Catalog)
CREATE TABLE IF NOT EXISTS `academic_terms` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `term_number` TINYINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_terms_name` (`name`),
  UNIQUE KEY `uq_terms_number` (`term_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. academic_stages
CREATE TABLE IF NOT EXISTS `academic_stages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `order_index` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stages_name` (`name`),
  INDEX `idx_stages_order_index` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. classes
CREATE TABLE IF NOT EXISTS `classes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `stage_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `grade_level` SMALLINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_classes_stage_level` (`stage_id`, `grade_level`),
  INDEX `idx_classes_stage_id` (`stage_id`),
  INDEX `idx_classes_grade_level` (`grade_level`),
  CONSTRAINT `fk_classes_stage_id` FOREIGN KEY (`stage_id`)
    REFERENCES `academic_stages` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. class_academic_terms
CREATE TABLE IF NOT EXISTS `class_academic_terms` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `academic_term_id` BIGINT UNSIGNED NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `is_closed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_class_term` (`class_id`, `academic_term_id`),
  INDEX `idx_class_terms_class` (`class_id`),
  INDEX `idx_class_terms_term` (`academic_term_id`),
  INDEX `idx_class_terms_active` (`is_active`),
  INDEX `idx_class_terms_closed` (`is_closed`),
  CONSTRAINT `fk_class_terms_class_id` FOREIGN KEY (`class_id`)
    REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_class_terms_term_id` FOREIGN KEY (`academic_term_id`)
    REFERENCES `academic_terms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. sections
CREATE TABLE IF NOT EXISTS `sections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sections_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. class_sections
CREATE TABLE IF NOT EXISTS `class_sections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `section_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_class_sections` (`class_id`, `section_id`),
  INDEX `idx_class_sections_class` (`class_id`),
  INDEX `idx_class_sections_section` (`section_id`),
  CONSTRAINT `fk_class_sections_class_id` FOREIGN KEY (`class_id`)
    REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_class_sections_section_id` FOREIGN KEY (`section_id`)
    REFERENCES `sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. subjects (Master Catalog)
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(30) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subjects_name` (`name`),
  UNIQUE KEY `uq_subjects_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. class_subjects
CREATE TABLE IF NOT EXISTS `class_subjects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `subject_id` BIGINT UNSIGNED NOT NULL,
  `class_academic_term_id` BIGINT UNSIGNED NOT NULL,
  `passing_score` DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  `max_score` DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_class_term_subject` (`class_academic_term_id`, `subject_id`),
  INDEX `idx_class_subjects_class` (`class_id`),
  INDEX `idx_class_subjects_subject` (`subject_id`),
  INDEX `idx_class_subjects_class_term` (`class_academic_term_id`),
  CONSTRAINT `fk_class_subjects_class_id` FOREIGN KEY (`class_id`)
    REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_class_subjects_subject_id` FOREIGN KEY (`subject_id`)
    REFERENCES `subjects` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_class_subjects_term_id` FOREIGN KEY (`class_academic_term_id`)
    REFERENCES `class_academic_terms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 📦 Phase 03: Teachers & Teaching Assignments (2 Tables)
-- ------------------------------------------------------------------------------

-- 13. teachers
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `specialization` VARCHAR(100) NULL DEFAULT NULL,
  `hire_date` DATE NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teachers_user_id` (`user_id`),
  INDEX `idx_teachers_full_name` (`full_name`),
  CONSTRAINT `fk_teachers_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. teaching_assignments
CREATE TABLE IF NOT EXISTS `teaching_assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `academic_year_id` BIGINT UNSIGNED NOT NULL,
  `class_section_id` BIGINT UNSIGNED NOT NULL,
  `subject_id` BIGINT UNSIGNED NOT NULL,
  `teacher_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teaching_assignment` (`academic_year_id`, `class_section_id`, `subject_id`),
  INDEX `idx_teaching_teacher` (`teacher_id`),
  INDEX `idx_teaching_class_section` (`class_section_id`),
  INDEX `idx_teaching_subject` (`subject_id`),
  CONSTRAINT `fk_teaching_year_id` FOREIGN KEY (`academic_year_id`)
    REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_teaching_class_section_id` FOREIGN KEY (`class_section_id`)
    REFERENCES `class_sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_teaching_subject_id` FOREIGN KEY (`subject_id`)
    REFERENCES `subjects` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_teaching_teacher_id` FOREIGN KEY (`teacher_id`)
    REFERENCES `teachers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 📦 Phase 04: Students, Guardians & Enrollments (4 Tables)
-- ------------------------------------------------------------------------------

-- 15. students
CREATE TABLE IF NOT EXISTS `students` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `birth_date` DATE NULL DEFAULT NULL,
  `gender` ENUM('male', 'female') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_students_user_id` (`user_id`),
  INDEX `idx_students_full_name` (`full_name`),
  CONSTRAINT `fk_students_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. guardians
CREATE TABLE IF NOT EXISTS `guardians` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `relationship` ENUM('father', 'mother', 'brother', 'uncle', 'other') NOT NULL DEFAULT 'father',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_guardians_user_id` (`user_id`),
  UNIQUE KEY `uq_guardians_phone` (`phone`),
  INDEX `idx_guardians_full_name` (`full_name`),
  CONSTRAINT `fk_guardians_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. guardian_students
CREATE TABLE IF NOT EXISTS `guardian_students` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guardian_id` BIGINT UNSIGNED NOT NULL,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_guardian_student` (`guardian_id`, `student_id`),
  INDEX `idx_guardian_students_guardian` (`guardian_id`),
  INDEX `idx_guardian_students_student` (`student_id`),
  CONSTRAINT `fk_guardian_students_guardian_id` FOREIGN KEY (`guardian_id`)
    REFERENCES `guardians` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_guardian_students_student_id` FOREIGN KEY (`student_id`)
    REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. student_enrollments
CREATE TABLE IF NOT EXISTS `student_enrollments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `academic_year_id` BIGINT UNSIGNED NOT NULL,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `grade_level` SMALLINT UNSIGNED NOT NULL,
  `class_section_id` BIGINT UNSIGNED NOT NULL,
  `seating_number` VARCHAR(50) NULL DEFAULT NULL,
  `status` ENUM('enrolled', 'passed', 'second_round', 'failed', 'graduated') NOT NULL DEFAULT 'enrolled',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_year_enrollment` (`academic_year_id`, `student_id`),
  INDEX `idx_enrollments_class_id` (`class_id`),
  INDEX `idx_enrollments_grade_level` (`academic_year_id`, `grade_level`),
  INDEX `idx_enrollments_class_section` (`class_section_id`),
  INDEX `idx_enrollments_status` (`status`),
  INDEX `idx_enrollments_seating` (`seating_number`),
  CONSTRAINT `fk_enrollments_year_id` FOREIGN KEY (`academic_year_id`)
    REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_enrollments_student_id` FOREIGN KEY (`student_id`)
    REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_enrollments_class_id` FOREIGN KEY (`class_id`)
    REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_enrollments_class_section_id` FOREIGN KEY (`class_section_id`)
    REFERENCES `class_sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 📦 Phase 05: Timetables & Daily Period Slots (2 Tables)
-- ------------------------------------------------------------------------------

-- 19. period_slots
CREATE TABLE IF NOT EXISTS `period_slots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `slot_number` TINYINT UNSIGNED NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `is_break` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_period_slots_number` (`slot_number`),
  INDEX `idx_period_slots_times` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. timetable_slots
CREATE TABLE IF NOT EXISTS `timetable_slots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `academic_year_id` BIGINT UNSIGNED NOT NULL,
  `class_section_id` BIGINT UNSIGNED NOT NULL,
  `day_of_week` ENUM('saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday') NOT NULL,
  `period_slot_id` BIGINT UNSIGNED NOT NULL,
  `teaching_assignment_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_timetable_section_slot` (`academic_year_id`, `class_section_id`, `day_of_week`, `period_slot_id`),
  INDEX `idx_timetable_teacher_conflict` (`academic_year_id`, `day_of_week`, `period_slot_id`, `teaching_assignment_id`),
  INDEX `idx_timetable_class_section` (`class_section_id`),
  CONSTRAINT `fk_timetable_year_id` FOREIGN KEY (`academic_year_id`)
    REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_timetable_class_section_id` FOREIGN KEY (`class_section_id`)
    REFERENCES `class_sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_timetable_period_slot_id` FOREIGN KEY (`period_slot_id`)
    REFERENCES `period_slots` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_timetable_teaching_assignment_id` FOREIGN KEY (`teaching_assignment_id`)
    REFERENCES `teaching_assignments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 📦 Phase 06: Homework & Assignments (1 Table)
-- ------------------------------------------------------------------------------

-- 21. assignments
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `academic_year_id` BIGINT UNSIGNED NOT NULL,
  `academic_term_id` BIGINT UNSIGNED NOT NULL,
  `class_section_id` BIGINT UNSIGNED NOT NULL,
  `teaching_assignment_id` BIGINT UNSIGNED NOT NULL,
  `created_by_user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `attachments` JSON NULL DEFAULT NULL,
  `assigned_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_assignments_section_term` (`class_section_id`, `academic_term_id`),
  INDEX `idx_assignments_teaching` (`teaching_assignment_id`),
  INDEX `idx_assignments_academic_year` (`academic_year_id`),
  INDEX `idx_assignments_due_date` (`due_date`),
  CONSTRAINT `fk_assignments_year_id` FOREIGN KEY (`academic_year_id`)
    REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_term_id` FOREIGN KEY (`academic_term_id`)
    REFERENCES `academic_terms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_class_section_id` FOREIGN KEY (`class_section_id`)
    REFERENCES `class_sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_teaching_assignment_id` FOREIGN KEY (`teaching_assignment_id`)
    REFERENCES `teaching_assignments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_created_by_user_id` FOREIGN KEY (`created_by_user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 📦 Phase 07: Class Quizzes & Tests (1 Table)
-- ------------------------------------------------------------------------------

-- 22. quizzes
CREATE TABLE IF NOT EXISTS `quizzes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `academic_year_id` BIGINT UNSIGNED NOT NULL,
  `academic_term_id` BIGINT UNSIGNED NOT NULL,
  `class_section_id` BIGINT UNSIGNED NOT NULL,
  `teaching_assignment_id` BIGINT UNSIGNED NOT NULL,
  `created_by_user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `attachments` JSON NULL DEFAULT NULL,
  `quiz_date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_quizzes_section_term` (`class_section_id`, `academic_term_id`),
  INDEX `idx_quizzes_teaching` (`teaching_assignment_id`),
  INDEX `idx_quizzes_academic_year` (`academic_year_id`),
  INDEX `idx_quizzes_date` (`quiz_date`),
  CONSTRAINT `fk_quizzes_year_id` FOREIGN KEY (`academic_year_id`)
    REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_quizzes_term_id` FOREIGN KEY (`academic_term_id`)
    REFERENCES `academic_terms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_quizzes_class_section_id` FOREIGN KEY (`class_section_id`)
    REFERENCES `class_sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_quizzes_teaching_assignment_id` FOREIGN KEY (`teaching_assignment_id`)
    REFERENCES `teaching_assignments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_quizzes_created_by_user_id` FOREIGN KEY (`created_by_user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 📦 Phase 08: Official Exams Schedule (1 Table)
-- ------------------------------------------------------------------------------

-- 23. official_exams
CREATE TABLE IF NOT EXISTS `official_exams` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `academic_year_id` BIGINT UNSIGNED NOT NULL,
  `academic_term_id` BIGINT UNSIGNED NOT NULL,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `subject_id` BIGINT UNSIGNED NOT NULL,
  `exam_type` ENUM('midterm', 'final', 'second_round') NOT NULL DEFAULT 'final',
  `exam_date` DATE NOT NULL,
  `notes` VARCHAR(255) NULL DEFAULT NULL,
  `attachments` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_official_exam_schedule` (`academic_year_id`, `academic_term_id`, `class_id`, `subject_id`, `exam_type`),
  INDEX `idx_official_exams_lookup` (`academic_year_id`, `academic_term_id`, `class_id`),
  INDEX `idx_official_exams_date` (`exam_date`),
  CONSTRAINT `fk_official_exams_year_id` FOREIGN KEY (`academic_year_id`)
    REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_official_exams_term_id` FOREIGN KEY (`academic_term_id`)
    REFERENCES `academic_terms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_official_exams_class_id` FOREIGN KEY (`class_id`)
    REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_official_exams_subject_id` FOREIGN KEY (`subject_id`)
    REFERENCES `subjects` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 📦 Phase 09: Promotion & Transcripts Archiving (2 Tables)
-- ------------------------------------------------------------------------------

-- 24. student_transcripts
CREATE TABLE IF NOT EXISTS `student_transcripts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `transcript_type` ENUM('term', 'annual') NOT NULL DEFAULT 'annual',
  `class_academic_term_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `academic_year_name` VARCHAR(50) NOT NULL,
  `class_name` VARCHAR(50) NOT NULL,
  `section_name` VARCHAR(50) NOT NULL,
  `grade_level` SMALLINT UNSIGNED NOT NULL,
  `total_score` DECIMAL(7,2) NOT NULL,
  `percentage` DECIMAL(5,2) NOT NULL,
  `final_status` ENUM('passed', 'second_round', 'failed', 'graduated') NOT NULL,
  `rank` SMALLINT UNSIGNED NULL DEFAULT NULL,
  `transcript_data` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_transcript_term` (`student_id`, `academic_year_name`, `transcript_type`, `class_academic_term_id`),
  INDEX `idx_transcripts_year_class` (`academic_year_name`, `class_name`),
  INDEX `idx_transcripts_status` (`final_status`),
  CONSTRAINT `fk_transcripts_student_id` FOREIGN KEY (`student_id`)
    REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_transcripts_class_term_id` FOREIGN KEY (`class_academic_term_id`)
    REFERENCES `class_academic_terms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. promotion_batches
CREATE TABLE IF NOT EXISTS `promotion_batches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_academic_year_id` BIGINT UNSIGNED NOT NULL,
  `to_academic_year_id` BIGINT UNSIGNED NOT NULL,
  `executed_by_user_id` BIGINT UNSIGNED NOT NULL,
  `total_students` INT UNSIGNED NOT NULL,
  `total_promoted` INT UNSIGNED NOT NULL,
  `total_second_round` INT UNSIGNED NOT NULL,
  `total_retained` INT UNSIGNED NOT NULL,
  `total_graduated` INT UNSIGNED NOT NULL,
  `overall_passing_rate` DECIMAL(5,2) NOT NULL,
  `class_statistics` JSON NOT NULL,
  `execution_notes` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promotion_batch_years` (`from_academic_year_id`, `to_academic_year_id`),
  INDEX `idx_promotion_executed_by` (`executed_by_user_id`),
  INDEX `idx_promotion_created_at` (`created_at`),
  CONSTRAINT `fk_promotion_from_year_id` FOREIGN KEY (`from_academic_year_id`)
    REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_promotion_to_year_id` FOREIGN KEY (`to_academic_year_id`)
    REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_promotion_executed_by_user_id` FOREIGN KEY (`executed_by_user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

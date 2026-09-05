-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_code` VARCHAR(30) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role_type` ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `last_login_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_users_user_code`(`user_code`),
    INDEX `idx_users_role_type`(`role_type`),
    INDEX `idx_users_is_active`(`is_active`),
    INDEX `idx_users_deleted_at`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `device_name` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NULL,
    `expires_at` TIMESTAMP(0) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_used_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_tokens_token_hash`(`token_hash`),
    INDEX `idx_tokens_user_id`(`user_id`),
    INDEX `idx_tokens_expires_at`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(50) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_audit_user_id`(`user_id`),
    INDEX `idx_audit_action`(`action`),
    INDEX `idx_audit_entity`(`entity_type`, `entity_id`),
    INDEX `idx_audit_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_years` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_active` TINYINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_academic_years_name`(`name`),
    INDEX `idx_academic_years_is_active`(`is_active`),
    INDEX `idx_academic_years_deleted_at`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_terms` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `term_number` TINYINT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_terms_name`(`name`),
    UNIQUE INDEX `uq_terms_number`(`term_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_stages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `order_index` SMALLINT NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_stages_name`(`name`),
    INDEX `idx_stages_order_index`(`order_index`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `stage_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `grade_level` SMALLINT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_classes_stage_id`(`stage_id`),
    INDEX `idx_classes_grade_level`(`grade_level`),
    UNIQUE INDEX `uq_classes_stage_level`(`stage_id`, `grade_level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_academic_terms` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `class_id` BIGINT UNSIGNED NOT NULL,
    `academic_term_id` BIGINT UNSIGNED NOT NULL,
    `is_active` TINYINT NOT NULL DEFAULT 0,
    `is_closed` TINYINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_class_terms_class`(`class_id`),
    INDEX `idx_class_terms_term`(`academic_term_id`),
    INDEX `idx_class_terms_active`(`is_active`),
    INDEX `idx_class_terms_closed`(`is_closed`),
    UNIQUE INDEX `uq_class_term`(`class_id`, `academic_term_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_sections_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_sections` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `class_id` BIGINT UNSIGNED NOT NULL,
    `section_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_class_sections_class`(`class_id`),
    INDEX `idx_class_sections_section`(`section_id`),
    UNIQUE INDEX `uq_class_sections`(`class_id`, `section_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(30) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_subjects_name`(`name`),
    UNIQUE INDEX `uq_subjects_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_subjects` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `class_id` BIGINT UNSIGNED NOT NULL,
    `subject_id` BIGINT UNSIGNED NOT NULL,
    `class_academic_term_id` BIGINT UNSIGNED NOT NULL,
    `passing_score` DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    `max_score` DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_class_subjects_class`(`class_id`),
    INDEX `idx_class_subjects_subject`(`subject_id`),
    INDEX `idx_class_subjects_class_term`(`class_academic_term_id`),
    UNIQUE INDEX `uq_class_term_subject`(`class_academic_term_id`, `subject_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teachers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `specialization` VARCHAR(100) NULL,
    `hire_date` DATE NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_teachers_user_id`(`user_id`),
    INDEX `idx_teachers_full_name`(`full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teaching_assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `academic_year_id` BIGINT UNSIGNED NOT NULL,
    `class_section_id` BIGINT UNSIGNED NOT NULL,
    `subject_id` BIGINT UNSIGNED NOT NULL,
    `teacher_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_teaching_teacher`(`teacher_id`),
    INDEX `idx_teaching_class_section`(`class_section_id`),
    INDEX `idx_teaching_subject`(`subject_id`),
    UNIQUE INDEX `uq_teaching_assignment`(`academic_year_id`, `class_section_id`, `subject_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `birth_date` DATE NULL,
    `gender` ENUM('male', 'female') NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_students_user_id`(`user_id`),
    INDEX `idx_students_full_name`(`full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guardians` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `relationship` ENUM('father', 'mother', 'brother', 'uncle', 'other') NOT NULL DEFAULT 'father',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_guardians_user_id`(`user_id`),
    UNIQUE INDEX `uq_guardians_phone`(`phone`),
    INDEX `idx_guardians_full_name`(`full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guardian_students` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `guardian_id` BIGINT UNSIGNED NOT NULL,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `is_primary` TINYINT NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_guardian_students_guardian`(`guardian_id`),
    INDEX `idx_guardian_students_student`(`student_id`),
    UNIQUE INDEX `uq_guardian_student`(`guardian_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_enrollments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `academic_year_id` BIGINT UNSIGNED NOT NULL,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `class_id` BIGINT UNSIGNED NOT NULL,
    `grade_level` SMALLINT NOT NULL,
    `class_section_id` BIGINT UNSIGNED NOT NULL,
    `seating_number` VARCHAR(50) NULL,
    `status` ENUM('enrolled', 'passed', 'second_round', 'failed', 'graduated') NOT NULL DEFAULT 'enrolled',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_enrollments_class_id`(`class_id`),
    INDEX `idx_enrollments_grade_level`(`academic_year_id`, `grade_level`),
    INDEX `idx_enrollments_class_section`(`class_section_id`),
    INDEX `idx_enrollments_status`(`status`),
    INDEX `idx_enrollments_seating`(`seating_number`),
    UNIQUE INDEX `uq_student_year_enrollment`(`academic_year_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `period_slots` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `slot_number` TINYINT NOT NULL,
    `start_time` TIME(0) NOT NULL,
    `end_time` TIME(0) NOT NULL,
    `is_break` TINYINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_period_slots_number`(`slot_number`),
    INDEX `idx_period_slots_times`(`start_time`, `end_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timetable_slots` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `academic_year_id` BIGINT UNSIGNED NOT NULL,
    `class_section_id` BIGINT UNSIGNED NOT NULL,
    `day_of_week` ENUM('saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday') NOT NULL,
    `period_slot_id` BIGINT UNSIGNED NOT NULL,
    `teaching_assignment_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_timetable_teacher_conflict`(`academic_year_id`, `day_of_week`, `period_slot_id`, `teaching_assignment_id`),
    INDEX `idx_timetable_class_section`(`class_section_id`),
    UNIQUE INDEX `uq_timetable_section_slot`(`academic_year_id`, `class_section_id`, `day_of_week`, `period_slot_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `academic_year_id` BIGINT UNSIGNED NOT NULL,
    `academic_term_id` BIGINT UNSIGNED NOT NULL,
    `class_section_id` BIGINT UNSIGNED NOT NULL,
    `teaching_assignment_id` BIGINT UNSIGNED NOT NULL,
    `created_by_user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `attachments` JSON NULL,
    `assigned_date` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_assignments_section_term`(`class_section_id`, `academic_term_id`),
    INDEX `idx_assignments_teaching`(`teaching_assignment_id`),
    INDEX `idx_assignments_academic_year`(`academic_year_id`),
    INDEX `idx_assignments_due_date`(`due_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quizzes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `academic_year_id` BIGINT UNSIGNED NOT NULL,
    `academic_term_id` BIGINT UNSIGNED NOT NULL,
    `class_section_id` BIGINT UNSIGNED NOT NULL,
    `teaching_assignment_id` BIGINT UNSIGNED NOT NULL,
    `created_by_user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `attachments` JSON NULL,
    `quiz_date` DATE NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_quizzes_section_term`(`class_section_id`, `academic_term_id`),
    INDEX `idx_quizzes_teaching`(`teaching_assignment_id`),
    INDEX `idx_quizzes_academic_year`(`academic_year_id`),
    INDEX `idx_quizzes_date`(`quiz_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `official_exams` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `academic_year_id` BIGINT UNSIGNED NOT NULL,
    `academic_term_id` BIGINT UNSIGNED NOT NULL,
    `class_id` BIGINT UNSIGNED NOT NULL,
    `subject_id` BIGINT UNSIGNED NOT NULL,
    `exam_type` ENUM('midterm', 'final', 'second_round') NOT NULL DEFAULT 'final',
    `exam_date` DATE NOT NULL,
    `notes` VARCHAR(255) NULL,
    `attachments` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_official_exams_lookup`(`academic_year_id`, `academic_term_id`, `class_id`),
    INDEX `idx_official_exams_date`(`exam_date`),
    UNIQUE INDEX `uq_official_exam_schedule`(`academic_year_id`, `academic_term_id`, `class_id`, `subject_id`, `exam_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_transcripts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `transcript_type` ENUM('term', 'annual') NOT NULL DEFAULT 'annual',
    `class_academic_term_id` BIGINT UNSIGNED NULL,
    `academic_year_name` VARCHAR(50) NOT NULL,
    `class_name` VARCHAR(50) NOT NULL,
    `section_name` VARCHAR(50) NOT NULL,
    `grade_level` SMALLINT NOT NULL,
    `total_score` DECIMAL(7, 2) NOT NULL,
    `percentage` DECIMAL(5, 2) NOT NULL,
    `final_status` ENUM('enrolled', 'passed', 'second_round', 'failed', 'graduated') NOT NULL,
    `rank` SMALLINT NULL,
    `transcript_data` JSON NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_transcripts_year_class`(`academic_year_name`, `class_name`),
    INDEX `idx_transcripts_status`(`final_status`),
    UNIQUE INDEX `uq_student_transcript_term`(`student_id`, `academic_year_name`, `transcript_type`, `class_academic_term_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion_batches` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `from_academic_year_id` BIGINT UNSIGNED NOT NULL,
    `to_academic_year_id` BIGINT UNSIGNED NOT NULL,
    `executed_by_user_id` BIGINT UNSIGNED NOT NULL,
    `total_students` INT UNSIGNED NOT NULL,
    `total_promoted` INT UNSIGNED NOT NULL,
    `total_second_round` INT UNSIGNED NOT NULL,
    `total_retained` INT UNSIGNED NOT NULL,
    `total_graduated` INT UNSIGNED NOT NULL,
    `overall_passing_rate` DECIMAL(5, 2) NOT NULL,
    `class_statistics` JSON NOT NULL,
    `execution_notes` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_promotion_executed_by`(`executed_by_user_id`),
    INDEX `idx_promotion_created_at`(`created_at`),
    UNIQUE INDEX `uq_promotion_batch_years`(`from_academic_year_id`, `to_academic_year_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `personal_access_tokens` ADD CONSTRAINT `fk_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `fk_audit_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `fk_classes_stage_id` FOREIGN KEY (`stage_id`) REFERENCES `academic_stages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_academic_terms` ADD CONSTRAINT `fk_class_terms_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_academic_terms` ADD CONSTRAINT `fk_class_terms_term_id` FOREIGN KEY (`academic_term_id`) REFERENCES `academic_terms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sections` ADD CONSTRAINT `fk_class_sections_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sections` ADD CONSTRAINT `fk_class_sections_section_id` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_subjects` ADD CONSTRAINT `fk_class_subjects_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_subjects` ADD CONSTRAINT `fk_class_subjects_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_subjects` ADD CONSTRAINT `fk_class_subjects_term_id` FOREIGN KEY (`class_academic_term_id`) REFERENCES `class_academic_terms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachers` ADD CONSTRAINT `fk_teachers_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teaching_assignments` ADD CONSTRAINT `fk_teaching_year_id` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teaching_assignments` ADD CONSTRAINT `fk_teaching_class_section_id` FOREIGN KEY (`class_section_id`) REFERENCES `class_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teaching_assignments` ADD CONSTRAINT `fk_teaching_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teaching_assignments` ADD CONSTRAINT `fk_teaching_teacher_id` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `fk_students_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guardians` ADD CONSTRAINT `fk_guardians_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guardian_students` ADD CONSTRAINT `fk_guardian_students_guardian_id` FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guardian_students` ADD CONSTRAINT `fk_guardian_students_student_id` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `fk_enrollments_year_id` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `fk_enrollments_student_id` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `fk_enrollments_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `fk_enrollments_class_section_id` FOREIGN KEY (`class_section_id`) REFERENCES `class_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `fk_timetable_year_id` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `fk_timetable_class_section_id` FOREIGN KEY (`class_section_id`) REFERENCES `class_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `fk_timetable_period_slot_id` FOREIGN KEY (`period_slot_id`) REFERENCES `period_slots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `fk_timetable_teaching_assignment_id` FOREIGN KEY (`teaching_assignment_id`) REFERENCES `teaching_assignments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `fk_assignments_year_id` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `fk_assignments_term_id` FOREIGN KEY (`academic_term_id`) REFERENCES `academic_terms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `fk_assignments_class_section_id` FOREIGN KEY (`class_section_id`) REFERENCES `class_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `fk_assignments_teaching_assignment_id` FOREIGN KEY (`teaching_assignment_id`) REFERENCES `teaching_assignments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `fk_assignments_created_by_user_id` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizzes` ADD CONSTRAINT `fk_quizzes_year_id` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizzes` ADD CONSTRAINT `fk_quizzes_term_id` FOREIGN KEY (`academic_term_id`) REFERENCES `academic_terms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizzes` ADD CONSTRAINT `fk_quizzes_class_section_id` FOREIGN KEY (`class_section_id`) REFERENCES `class_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizzes` ADD CONSTRAINT `fk_quizzes_teaching_assignment_id` FOREIGN KEY (`teaching_assignment_id`) REFERENCES `teaching_assignments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizzes` ADD CONSTRAINT `fk_quizzes_created_by_user_id` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `official_exams` ADD CONSTRAINT `fk_official_exams_year_id` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `official_exams` ADD CONSTRAINT `fk_official_exams_term_id` FOREIGN KEY (`academic_term_id`) REFERENCES `academic_terms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `official_exams` ADD CONSTRAINT `fk_official_exams_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `official_exams` ADD CONSTRAINT `fk_official_exams_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_transcripts` ADD CONSTRAINT `fk_transcripts_student_id` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_transcripts` ADD CONSTRAINT `fk_transcripts_class_term_id` FOREIGN KEY (`class_academic_term_id`) REFERENCES `class_academic_terms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_batches` ADD CONSTRAINT `fk_promotion_from_year_id` FOREIGN KEY (`from_academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_batches` ADD CONSTRAINT `fk_promotion_to_year_id` FOREIGN KEY (`to_academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_batches` ADD CONSTRAINT `fk_promotion_executed_by_user_id` FOREIGN KEY (`executed_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

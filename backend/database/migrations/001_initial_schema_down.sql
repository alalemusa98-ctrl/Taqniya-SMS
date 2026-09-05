-- ==============================================================================
-- TAQNIYA SCHOOL MANAGEMENT SYSTEM (Taqniya-SMS)
-- Database Migration (DOWN / Rollback): Reverse Initial Schema
-- Target Dialect: MySQL 8.0
-- Governed by: PROJECT/MD/database.md (Authoritative SSoT Blueprint)
-- Total Tables Dropped: 25 Tables in Strict Reverse Dependency Order
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Drop Promotion & Transcripts
DROP TABLE IF EXISTS `promotion_batches`;
DROP TABLE IF EXISTS `student_transcripts`;

-- 2. Drop Official Exams
DROP TABLE IF EXISTS `official_exams`;

-- 3. Drop Quizzes
DROP TABLE IF EXISTS `quizzes`;

-- 4. Drop Assignments
DROP TABLE IF EXISTS `assignments`;

-- 5. Drop Timetables & Slots
DROP TABLE IF EXISTS `timetable_slots`;
DROP TABLE IF EXISTS `period_slots`;

-- 6. Drop Students, Guardians & Enrollments
DROP TABLE IF EXISTS `student_enrollments`;
DROP TABLE IF EXISTS `guardian_students`;
DROP TABLE IF EXISTS `guardians`;
DROP TABLE IF EXISTS `students`;

-- 7. Drop Teachers & Assignments
DROP TABLE IF EXISTS `teaching_assignments`;
DROP TABLE IF EXISTS `teachers`;

-- 8. Drop Academic Hierarchy, Terms, Sections & Subjects
DROP TABLE IF EXISTS `class_subjects`;
DROP TABLE IF EXISTS `subjects`;
DROP TABLE IF EXISTS `class_sections`;
DROP TABLE IF EXISTS `sections`;
DROP TABLE IF EXISTS `class_academic_terms`;
DROP TABLE IF EXISTS `classes`;
DROP TABLE IF EXISTS `academic_stages`;
DROP TABLE IF EXISTS `academic_terms`;
DROP TABLE IF EXISTS `academic_years`;

-- 9. Drop Auth, Tokens & Audit Logs
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `personal_access_tokens`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

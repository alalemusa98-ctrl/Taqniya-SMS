# 🗄️ مواصفات البيانات وهياكل الملفات — المرحلة 10: النسخ الاحتياطي (Data Specs)

> **الهدف:** توثيق بنية حزمة النسخ الاحتياطي، تركيبة ملفات الـ ZIP، المخططات البيانية لهياكل JSON، وتنسيقات التخزين.

---

## 1. مواصفات أرشيف النسخ الاحتياطي (ZIP Package Archive Spec)

### 📦 محتويات ملف الأرشيف المضغوط:
```text
backup_2026-09-26_22-30-00_database.zip
├── database.sql       # ملف تفريغ SQL المعياري الشامل (الهيكل + البيانات)
└── note.txt           # ملف نصي اختياري يحمل الملاحظة الوصفية المكتوبة عند الإنشاء
```

---

## 2. بنية ملف التفريغ SQL المعياري (`database.sql`)

```sql
-- ========================================================
-- Taqniya SMS Database Backup Archive
-- Filename: backup_2026-09-26_22-30-00_database.zip
-- Generated At: 2026-09-26 22:30:00
-- Server: MySQL 8.0 / Prisma ORM
-- ========================================================

SET FOREIGN_KEY_CHECKS=0;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(191) NOT NULL,
  `user_code` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(191) NOT NULL,
  `role_type` ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_users_user_code`(`user_code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Dumping data for table `users`
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `user_code`, `password_hash`, `role_type`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
('usr_1', 'ADM-1001', '$2a$10$...', 'admin', 'active', '2026-09-01 00:00:00.000', '2026-09-01 00:00:00.000', NULL);

... [باقي الجداول والبيانات] ...

SET FOREIGN_KEY_CHECKS=1;
```

---

## 3. نماذج البيانات وكائنات الـ DTO (Data Transfer Objects)

```typescript
export interface BackupItem {
  filename: string;
  size: string;
  size_bytes: number;
  created_at: string;
  note: string | null;
}

export interface BackupSummary {
  total_backups: number;
  total_size: string;
  storage_directory: string;
}

export interface BackupListResponse {
  summary: BackupSummary;
  backups: BackupItem[];
}
```

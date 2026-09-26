# 🗄️ مواصفات البيانات وهياكل الملفات — المرحلة 10: النسخ الاحتياطي (Data Specs)

> **الهدف:** توثيق بنية حزم النسخ الاحتياطي الثلاث، تركيبة ملفات الـ ZIP، المخططات البيانية لهياكل JSON، وتنسيقات التخزين الشجري.

---

## 1. مواصفات وتصنيفات أرشيف النسخ الاحتياطي (Backup Types & ZIP Specs)

يدعم النظام 3 أنواع محددة من الأرشيفات المضغوطة:

### 📦 أ. النسخة الشاملة الكاملة (`full`):
- **مسار التخزين بالسيرفر:** `storage/backups/full/`
- **نمط اسم الملف:** `backup_YYYY-MM-DD_HH-mm-ss_full.zip`
- **المحتويات الداخلية:**
```text
backup_2026-09-26_22-30-00_full.zip
├── database.sql       # تفريغ قاعدة البيانات الشامل (الهيكل + البيانات)
├── note.txt           # ملف نصي بالملاحظة الوصفية (اختياري)
└── storage/           # شجرة مجلد المرفقات والملفات كاملة
    ├── assignments/
    ├── quizzes/
    ├── official_exams/
    └── submissions/
```

### 🗄️ ب. نسخة قاعدة البيانات فقط (`database`):
- **مسار التخزين بالسيرفر:** `storage/backups/database/`
- **نمط اسم الملف:** `backup_YYYY-MM-DD_HH-mm-ss_database.zip`
- **المحتويات الداخلية:**
```text
backup_2026-09-26_22-30-00_database.zip
├── database.sql       # تفريغ قاعدة البيانات الشامل (الهيكل + البيانات)
└── note.txt           # ملف نصي بالملاحظة الوصفية (اختياري)
```

### 📁 ج. نسخة الملفات والمرفقات فقط (`files`):
- **مسار التخزين بالسيرفر:** `storage/backups/files/`
- **نمط اسم الملف:** `backup_YYYY-MM-DD_HH-mm-ss_files.zip`
- **المحتويات الداخلية:**
```text
backup_2026-09-26_22-30-00_files.zip
├── note.txt           # ملف نصي بالملاحظة الوصفية (اختياري)
└── storage/           # شجرة مجلد المرفقات والملفات كاملة
    ├── assignments/
    ├── quizzes/
    ├── official_exams/
    └── submissions/
```

---

## 2. سياسة مسارات التخزين الفيزيائي للمرفقات (Physical Storage Policy)

```text
storage/uploads/
├── assignments/
│   └── {assignment_id}/
│       └── {uuid_or_hash}-{original_name}.{ext}
├── quizzes/
│   └── {quiz_id}/
│       └── {uuid_or_hash}-{original_name}.{ext}
├── official_exams/
│   └── {exam_id}/
│       └── {uuid_or_hash}-{original_name}.{ext}
└── submissions/
    └── {submission_id}/
        └── {uuid_or_hash}-{original_name}.{ext}
```

### 📋 تمثيل المرفق داخل أعمدة قاعدة البيانات (`attachments Json?`):
```json
[
  {
    "file_name": "ورقة_العمل_رقم_1.pdf",
    "file_path": "assignments/42/a7f1-ورقة_العمل_رقم_1.pdf",
    "file_size": 184520,
    "mime_type": "application/pdf",
    "uploaded_at": "2026-09-26T22:30:00Z"
  }
]
```

---

## 3. نماذج البيانات وكائنات الـ TypeScript DTOs

```typescript
export type BackupType = 'full' | 'database' | 'files';

export interface BackupItem {
  filename: string;
  type: BackupType;
  size: string;
  size_bytes: number;
  created_at: string;
  note: string | null;
}

export interface BackupSummary {
  total_backups: number;
  total_size: string;
  full_count: number;
  database_count: number;
  files_count: number;
  storage_directory: string;
}

export interface BackupListResponse {
  summary: BackupSummary;
  backups: BackupItem[];
}

export interface CreateBackupDto {
  type?: BackupType; // default: 'full'
  note?: string;     // max: 500 chars
}
```

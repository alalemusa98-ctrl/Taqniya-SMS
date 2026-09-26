# 🌐 مرجع مسارات وعقود الـ API — المرحلة 10: النسخ الاحتياطي (Network & Routes SSoT)

> **العقد المعتمد لجميع نقاط النهاية (Endpoints) ومواصفات الطلبات والاستجابات.**

---

## 1. مسار استعراض النسخ الاحتياطية والإحصائيات

- **المسار:** `GET /api/v1/backups`
- **Query Params (اختياري):** `type=full | database | files`
- **الصلاحية:** `role_type = 'admin'`
- **الاستجابة الناجحة (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_backups": 3,
      "total_size": "12.45 MB",
      "full_count": 1,
      "database_count": 1,
      "files_count": 1,
      "storage_directory": "storage/backups"
    },
    "backups": [
      {
        "filename": "backup_2026-09-26_23-00-00_full.zip",
        "type": "full",
        "size": "8.50 MB",
        "size_bytes": 8912896,
        "created_at": "2026-09-26 23:00:00",
        "note": "نسخة شاملة قبل بداية الفصل الدراسي"
      },
      {
        "filename": "backup_2026-09-26_22-30-00_database.zip",
        "type": "database",
        "size": "450.20 KB",
        "size_bytes": 461005,
        "created_at": "2026-09-26 22:30:00",
        "note": "نسخة لقاعدة البيانات فقط قبل تعديل الهيكل"
      },
      {
        "filename": "backup_2026-09-26_21-00-00_files.zip",
        "type": "files",
        "size": "3.50 MB",
        "size_bytes": 3670016,
        "created_at": "2026-09-26 21:00:00",
        "note": "أرشفة ملفات ومرفقات الواجبات"
      }
    ]
  }
}
```

---

## 2. مسار إنشاء نسخة احتياطية جديدة

- **المسار:** `POST /api/v1/backups/create`
- **الصلاحية:** `role_type = 'admin'`
- **Request Body (JSON):**
```json
{
  "type": "database",
  "note": "نسخة احتياطية لقاعدة البيانات قبل رصد درجات الدور الثاني"
}
```
- **حقول الطلب:**
  - `type` (اختياري، القيمة الافتراضية `full`، الخيارات: `full` | `database` | `files`).
  - `note` (اختياري، نص حتى 500 حرف).
- **الاستجابة الناجحة (201 Created):**
```json
{
  "success": true,
  "message": "تم إنشاء النسخة الاحتياطية بنجاح.",
  "data": {
    "filename": "backup_2026-09-26_23-15-00_database.zip",
    "type": "database",
    "size": "452.10 KB",
    "size_bytes": 462950,
    "created_at": "2026-09-26 23:15:00",
    "note": "نسخة احتياطية لقاعدة البيانات قبل رصد درجات الدور الثاني"
  }
}
```

---

## 3. مسار رفع واستيراد نسخة احتياطية

- **المسار:** `POST /api/v1/backups/upload`
- **Content-Type:** `multipart/form-data`
- **حقل الملف:** `backup_file` (ملف ZIP مضغوط حتى 512MB).
- **الاستجابة الناجحة (201 Created):**
```json
{
  "success": true,
  "message": "تم رفع واستيراد النسخة الاحتياطية بنجاح.",
  "data": {
    "filename": "backup_2026-09-26_20-00-00_files.zip",
    "type": "files",
    "size": "3.50 MB",
    "size_bytes": 3670016,
    "created_at": "2026-09-26 20:00:00",
    "note": "أرشيف ملفات مستورد"
  }
}
```

---

## 4. مسار استعادة النسخة الاحتياطية

- **المسار:** `POST /api/v1/backups/restore/:filename`
- **الصلاحية:** `role_type = 'admin'`
- **الاستجابة الناجحة (200 OK):**
```json
{
  "success": true,
  "message": "تمت استعادة النسخة الاحتياطية وتطبيق البيانات والملفات بنجاح."
}
```

---

## 5. مسار تنزيل ملف النسخة الاحتياطية

- **المسار:** `GET /api/v1/backups/download/:filename`
- **الاستجابة:** تدفق ملف ثنائي بصيغة `application/zip`.

---

## 6. مسار حذف النسخة الاحتياطية

- **المسار:** `DELETE /api/v1/backups/:filename`
- **الاستجابة الناجحة (200 OK):**
```json
{
  "success": true,
  "message": "تم حذف ملف النسخة الاحتياطية بنجاح."
}
```

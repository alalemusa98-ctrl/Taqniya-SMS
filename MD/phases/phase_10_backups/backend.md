# ⚙️ مواصفات المعالجة الخلفية — المرحلة 10: النسخ الاحتياطي (Backend Engine Specs)

> **المواصفات الفنية للخدمات ووحدات المعالجة (`BackupService` و `BackupController`) في NestJS.**

---

## 1. محرك النسخ الاحتياطي الثلاثي (`BackupService`)

يقدم محرك النسخ الاحتياطي في NestJS فصلاً دقيقاً بين العمليات وفق مسارات التخزين المنفصلة:

### 📥 1. إنشاء النسخة الاحتياطية (`createBackup(dto: CreateBackupDto)`):
- **المدخلات:** `type?: 'full' | 'database' | 'files'` و `note?: string`.
- **خطوات المعالجة:**
  1. إنشاء مجلد النوع المخصص (`storage/backups/{type}/`) في حال لم يكن موجوداً.
  2. إنشاء حزمة ZIP باستخدام `adm-zip`.
  3. **في حال كان النوع `full` أو `database`:**
     - تفريغ جداول قاعدة البيانات MySQL عبر الدفعات المجزأة (`chunk(500)`).
     - تصدير DDL والجداول مع `SET FOREIGN_KEY_CHECKS=0;`.
     - إضافة ملف `database.sql` إلى جذر حزمة الـ ZIP.
  4. **في حال كان النوع `full` أو `files`:**
     - مسح المجلد `storage/uploads` بشكل تكراري وإضافته إلى المجلد الداخلي `storage/` في حزمة الـ ZIP مع الحفاظ التام على شجرة المجلدات الفرعية.
  5. **إضافة الملاحظة الوصفية:** كتابة نص الملاحظة في ملف `note.txt` داخل حزمة الـ ZIP.
  6. حفظ الأرشيف في `storage/backups/{type}/backup_YYYY-MM-DD_HH-mm-ss_{type}.zip`.
  7. تسجيل العملية في سجل التدقيق (`audit_logs`).

---

### 📤 2. استعراض النسخ الاحتياطية (`listBackups(type?: BackupType)`):
- مسح المجلدات الثلاثة:
  - `storage/backups/full/`
  - `storage/backups/database/`
  - `storage/backups/files/`
- قراءة بيانات كل ملف مضغوط (الاسم، الحجم، تاريخ التعديل، والملاحظة من `note.txt`).
- إرجاع إحصائيات تفصيلية ومجمعة (`total_backups`, `total_size`, `full_count`, `database_count`, `files_count`).

---

### 🔄 3. استعادة النسخة الاحتياطية (`restoreBackup(filename: string)`):
1. **تحديد مسار الملف:** فحص المجلدات الثلاثة (`full`, `database`, `files`) للعثور على الملف المطلوب.
2. **فك الضغط الآمن:** استخراج محتويات الـ ZIP إلى مجلد مؤقت `storage/restore_temp`.
3. **استعادة قاعدة البيانات (إذا وجد `database.sql`):**
   - قراءة وتجزئة أوامر SQL المنفصلة وتنفيذها ضمن معاملة آمنة مع `SET FOREIGN_KEY_CHECKS=0;`.
4. **استعادة الملفات (إذا وجد مجلد `storage/`):**
   - نقل واستبدال مجلدات المرفقات المسترجعة في مسارها الحقيقي `storage/uploads/`.
5. **تنظيف المؤقتات:** حذف مجلد `storage/restore_temp`.
6. توثيق عملية الاستعادة الحرجة في `audit_logs`.

---

### 📥 4. رفع واستيراد نسخة احتياطية (`uploadBackup(file)`):
- التحقق من امتداد الملف (`.zip`) وصحة هيكل الأرشيف.
- **الكشف التلقائي عن النوع:**
  - إذا احتوى الاسم على `_database` يوجه إلى `storage/backups/database/`.
  - إذا احتوى الاسم على `_files` يوجه إلى `storage/backups/files/`.
  - خلاف ذلك يوجه إلى `storage/backups/full/`.
- حفظ الملف واستخراج ملاحظته وبياناته.

---

### 🗑️ 5. حذف وتحميل النسخ:
- **التنزيل (`downloadBackup`):** إرجاع `StreamableFile` من مسار النسخة المطابق.
- **الحذف (`deleteBackup`):** إزالة الملف فيزيائياً من مجلده الخاص بالسيرفر.

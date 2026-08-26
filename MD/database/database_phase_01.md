# 📦 المرحلة 01: جداول الهوية والمصادقة والتدقيق (Authentication, Identity & Audit)

---

## 1. جدول حسابات المستخدمين (`users`)

> **الوصف:**  
> الجدول الأساسي لهويات ومصادقة كافة مستخدمي النظام (الإدارة، المعلم، الطالب، ولي الأمر) بالاعتماد الحصري على الرمز المؤسسي الموحد.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الداخلي الفريد للسجل. |
| `user_code` | `VARCHAR(30)` | `NOT NULL`, `UNIQUE` | الرمز المؤسسي الموحد لتسجيل الدخول (`ADM-1001`, `TCH-2005`, `STU-3042`, `PAR-4010`). |
| `password` | `VARCHAR(255)` | `NOT NULL` | كلمة المرور المشفرة بخوارزمية آمنة (`bcrypt` أو `argon2id`). |
| `role_type` | `ENUM('admin', 'teacher', 'student', 'parent')` | `NOT NULL` | الدور الأساسي للمستخدم لتحديد لوحة التحكم والصلاحيات. |
| `is_active` | `TINYINT(1)` | `NOT NULL`, `DEFAULT 1` | حالة تفعيل الحساب (`1 = نشط`, `0 = معطل/موقوف`). |
| `last_login_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | تاريخ وتوقيت آخر عملية تسجيل دخول ناجحة. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء الحساب. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث لبيانات الحساب. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي (Soft Delete). |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* *لا يحتوي على مفاتيح خارجية (جدول أساسي جذري Root Entity).*

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_users_user_code (user_code)`
* `INDEX idx_users_role_type (role_type)`
* `INDEX idx_users_is_active (is_active)`
* `INDEX idx_users_deleted_at (deleted_at)`

---

## 2. جدول جلسات التوكن (`personal_access_tokens`)

> **الوصف:**  
> جدول حفظ وإدارة توكنات المصادقة النشطة (JWT / Bearer Tokens) وتتبع الجلسات وإلغائها عند تسجيل الخروج.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الداخلي للجلسة. |
| `user_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف المستخدم صاحب الجلسة المرتبط بجدول `users`. |
| `token_hash` | `VARCHAR(64)` | `NOT NULL`, `UNIQUE` | التجزئة الآمنة للتوكن (`SHA-256 Hash`) للتحقق السريع. |
| `device_name` | `VARCHAR(255)` | `NULL DEFAULT NULL` | اسم الجهاز أو المتصفح المستخدم في الدخول. |
| `ip_address` | `VARCHAR(45)` | `NULL DEFAULT NULL` | عنوان الـ IP لمسجل الدخول (يدعم IPv4 و IPv6). |
| `expires_at` | `TIMESTAMP` | `NOT NULL` | تاريخ وتوقيت انتهاء صلاحية التوكن. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | تاريخ وتوقيت إنشاء الجلسة. |
| `last_used_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | توقيت آخر نشاط تم استخدامه بهذا التوكن. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `user_id` يرتبط بجدول `users(id)` مع سلوك:
  * `ON DELETE CASCADE` (عند حذف حساب المستخدم نهائياً يتم شطب كافة جلساته تلقائياً).
  * `ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_tokens_token_hash (token_hash)`
* `INDEX idx_tokens_user_id (user_id)`
* `INDEX idx_tokens_expires_at (expires_at)`

---

## 3. جدول سجل التدقيق وتتبع العمليات (`audit_logs`)

> **الوصف:**  
> جدول تسجيل وتتبع كافة العمليات الحساسة (إنشاء، تعديل، حذف، ترحيل، رصد درجات) مع توثيق القيم السابقة والجديدة لضمان الشفافية والأمان.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد للحركة. |
| `user_id` | `BIGINT UNSIGNED` | `NULL DEFAULT NULL` | معرف المستخدم منفذ العملية (يرتبط بـ `users.id`). |
| `action` | `VARCHAR(50)` | `NOT NULL` | نوع الحركة (`login`, `create`, `update`, `delete`, `promote`, `export`). |
| `entity_type` | `VARCHAR(100)` | `NOT NULL` | اسم الكيان/الجدول المتأثر (مثل: `Assignment`, `StudentEnrollment`, `Grade`). |
| `entity_id` | `BIGINT UNSIGNED` | `NULL DEFAULT NULL` | رقم السجل المتأثر داخل الكيان. |
| `old_values` | `JSON` | `NULL DEFAULT NULL` | القيم السابقة قبل التعديل بصيغة JSON. |
| `new_values` | `JSON` | `NULL DEFAULT NULL` | القيم الجديدة بعد التعديل بصيغة JSON. |
| `ip_address` | `VARCHAR(45)` | `NULL DEFAULT NULL` | عنوان الـ IP لمنفذ الحركة. |
| `user_agent` | `VARCHAR(255)` | `NULL DEFAULT NULL` | بيانات المتصفح ونظام التشغيل المستخدم. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت حدوث الحركة بدقة. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `user_id` يرتبط بجدول `users(id)` مع سلوك:
  * `ON DELETE SET NULL` (للحفاظ على السجل التاريخي للتدقيق حتى لو حُذف المستخدم).
  * `ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `INDEX idx_audit_user_id (user_id)`
* `INDEX idx_audit_action (action)`
* `INDEX idx_audit_entity (entity_type, entity_id)`
* `INDEX idx_audit_created_at (created_at)`

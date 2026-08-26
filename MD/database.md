# 🗄️ مخطط قاعدة البيانات المعتمد (Database Schema Specification — SSoT)

> **المصدر الحقيقي والوحيد لمخطط قاعدة بيانات MySQL 8.0 لنظام إدارة المدارس (Taqniya-SMS).**  
> ⚠️ **تنبيه حوكمة الذكاء الاصطناعي:** يمنع منعاً باتاً إنشاء أو تعديل أي جدول أو عمود في الكود ما لم يكن موثقاً هنا أولاً بنسبة تطابق 1:1.

---

## 🌐 المعايير العامة لقاعدة البيانات (MySQL 8.0 Standards)
* **محرك التخزين الافتراضي:** `ENGINE=InnoDB`
* **ترميز الحروف والمحاذاة:** `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
* **المفاتيح الأساسية:** `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`
* **الحذف المنطقي الإلزامي:** `deleted_at TIMESTAMP NULL DEFAULT NULL`
* **الطوابع الزمنية:** `created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP` و `updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

---

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

---

# 📦 المرحلة 02: الهيكل الأكاديمي والمناهج (Academic Hierarchy & Curriculum)

---

## 4. جدول الأعوام الدراسية (`academic_years`)

> **الوصف:**  
> جدول إدارة السنوات الدراسية في المدرسة، وتحديد تواريخ البدء والانتهاء، والتحكم في العام الدراسي النشط.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد للعام الدراسي. |
| `name` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | المسمى الرسمي للعام الدراسي (مثال: `2025/2026`). |
| `start_date` | `DATE` | `NOT NULL` | تاريخ بداية العام الدراسي. |
| `end_date` | `DATE` | `NOT NULL` | تاريخ نهاية العام الدراسي. |
| `is_active` | `TINYINT(1)` | `NOT NULL`, `DEFAULT 0` | حالة العام (`1 = العام النشط حالياً`, `0 = مغلق/سابق/قادم`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* *لا يحتوي على مفاتيح خارجية (جدول هيكلي أساسي).*

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_academic_years_name (name)`
* `INDEX idx_academic_years_is_active (is_active)`
* `INDEX idx_academic_years_deleted_at (deleted_at)`

---

## 5. جدول المراحل الدراسية (`academic_stages`)

> **الوصف:**  
> جدول المراحل التعليمية الكبرى في الهيكل المدرسي (مثل: المرحلة الابتدائية، الإعدادية/المتوسطة، الثانوية).

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد للمرحلة. |
| `name` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | اسم المرحلة (مثال: `المرحلة الابتدائية`). |
| `order_index` | `SMALLINT UNSIGNED` | `NOT NULL`, `DEFAULT 1` | ترتيب المرحلة الأكاديمي للعرض والفرز. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* *لا يحتوي على مفاتيح خارجية.*

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_stages_name (name)`
* `INDEX idx_stages_order_index (order_index)`

---

## 6. جدول الفصول الدراسية (`classes`)

> **الوصف:**  
> جدول الفصول/الصفوف المدرسية (مستقل تماماً عن الشعب) وربطها بالمرحلة التعليمية لتحديد التدرج السنوي.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد للفصل/الصف. |
| `stage_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف المرحلة الدراسية التابع لها (يرتبط بـ `academic_stages.id`). |
| `name` | `VARCHAR(50)` | `NOT NULL` | اسم الفصل الدراسي (مثال: `الصف الخامس`, `الصف السادس`). |
| `grade_level` | `SMALLINT UNSIGNED` | `NOT NULL` | الترتيب الرقمي الأكاديمي (`1` إلى `12`) لحساب الترحيل التلقائي للصف الأعلى. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `stage_id` يرتبط بجدول `academic_stages(id)` مع سلوك:
  * `ON DELETE RESTRICT` (يمنع حذف المرحلة إذا كانت تحتوي على فصول دراسية).
  * `ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_classes_stage_level (stage_id, grade_level)`
* `INDEX idx_classes_stage_id (stage_id)`
* `INDEX idx_classes_grade_level (grade_level)`

---

## 7. جدول الشعب الدراسية (`sections`)

> **الوصف:**  
> جدول الشعب المدرسية (مستقل تماماً عن الفصول) لتعريف أسماء الشعب المعتمدة في المدرسة دون تكرار.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي للشعبة. |
| `name` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | مسمى الشعبة العام (مثال: `شعبة أ`, `شعبة ب`, `شعبة ج`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* *لا يحتوي على مفاتيح خارجية (جدول مرجعي عام Master Sections).*

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_sections_name (name)`

---

## 8. جدول ربط الفصول بالشعب (`class_sections`)

> **الوصف:**  
> جدول الربط متعدد لمتعدد يربط كل فصل دراسي بالشعب المفتوحة له (مثل: خامس/أ، خامس/ب).

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي لسجل ربط الفصل بالشعبة. |
| `class_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل الدراسي (يرتبط بـ `classes.id`). |
| `section_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الشعبة (يرتبط بـ `sections.id`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `class_id` يرتبط بجدول `classes(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `section_id` يرتبط بجدول `sections(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_class_sections (class_id, section_id)`
* `INDEX idx_class_sections_class (class_id)`
* `INDEX idx_class_sections_section (section_id)`

---

## 9. جدول كتالوج المواد العام (`subjects`)

> **الوصف:**  
> السجل العام النظيف لكافة المواد والمناهج الدراسية في المدرسة لمرة واحدة فقط كمرجع مستقل.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد للمادة. |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | مسمى المادة التعليمية (مثال: `الرياضيات`, `اللغة العربية`, `العلوم`). |
| `code` | `VARCHAR(30)` | `NULL DEFAULT NULL`, `UNIQUE` | الكود الرمزي للمادة (مثال: `MATH`, `ARAB`, `SCI`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* *لا يحتوي على مفاتيح خارجية (جدول مرجعي عام Master Catalog).*

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_subjects_name (name)`
* `UNIQUE INDEX uq_subjects_code (code)`

---

## 10. جدول مقررات الفصول والدرجات (`class_subjects`)

> **الوصف:**  
> جدول الربط متعدد لمتعدد يربط كل فصل دراسي بالمواد المقررة له مع تحديد درجة النجاح والدرجة العظمى المخصصة لكل مادة في هذا الفصل.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي لمقرر المادة بالفصل. |
| `class_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل الدراسي (يرتبط بـ `classes.id`). |
| `subject_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف المادة العامة (يرتبط بـ `subjects.id`). |
| `passing_score` | `DECIMAL(5,2)` | `NOT NULL`, `DEFAULT 50.00` | درجة النجاح الصغرى المقررة للمادة في هذا الفصل. |
| `max_score` | `DECIMAL(5,2)` | `NOT NULL`, `DEFAULT 100.00` | الدرجة الكلية العظمى للمادة في هذا الفصل. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `class_id` يرتبط بجدول `classes(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `subject_id` يرتبط بجدول `subjects(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_class_subjects (class_id, subject_id)`
* `INDEX idx_class_subjects_class (class_id)`
* `INDEX idx_class_subjects_subject (subject_id)`

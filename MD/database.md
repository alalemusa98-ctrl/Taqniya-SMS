# 🗄️ مخطط قاعدة البيانات المعتمد (Database Schema Specification — SSoT)

> **المصدر الحقيقي والوحيد لمخطط قاعدة بيانات MySQL 8.0 لنظام إدارة المدارس (Taqniya-SMS).**  
> **Schema Status: APPROVED**  
> ⚠️ **تنبيه حوكمة الذكاء الاصطناعي:** يمنع منعاً باتاً إنشاء أو تعديل أي جدول أو عمود في الكود ما لم يكن موثقاً هنا أولاً بنسبة تطابق 1:1.

---

## 🌐 المعايير العامة لقاعدة البيانات (MySQL 8.0 Standards)
* **محرك التخزين الافتراضي:** `ENGINE=InnoDB`
* **ترميز الحروف والمحاذاة:** `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
* **المفاتيح الأساسية:** `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`
* **الحذف المنطقي الإلزامي:** `deleted_at TIMESTAMP NULL DEFAULT NULL`
* **الطوابع الزمنية:** `created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP` و `updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

---

## 📊 الفهرس الإجمالي لتوزيع الجداول على المراحل (24 جدولاً)

| رقم المرحلة | اسم المرحلة ومجالها الوظيفي | عدد الجداول | أسماء الجداول في المرحلة |
| :---: | :--- | :---: | :--- |
| **01** | الهوية والمصادقة والتدقيق (Auth & Audit) | **3** جداول | `users`, `personal_access_tokens`, `audit_logs` |
| **02** | الهيكل الأكاديمي والمناهج (Curriculum) | **9** جداول | `academic_years`, `academic_terms`, `academic_stages`, `classes`, `class_academic_terms`, `sections`, `class_sections`, `subjects`, `class_subjects` |
| **03** | الكادر التعليمي والإسناد (Teachers) | **جدولان (2)** | `teachers`, `teaching_assignments` |
| **04** | الطلاب وأولياء الأمور والتسكين (Students) | **4** جداول | `students`, `guardians`, `guardian_students`, `student_enrollments` |
| **05** | أوقات الحصص والجداول الأسبوعية (Timetables) | **جدولان (2)** | `period_slots`, `timetable_slots` |
| **06** | الواجبات المدرسية (Homework) | **جدول واحد (1)** | `assignments` |
| **07** | التطبيقات والاختبارات الدورية (Quizzes) | **جدول واحد (1)** | `quizzes` |
| **08** | جدول الامتحانات الرسمية (Official Exams) | **جدول واحد (1)** | `official_exams` |
| **09** | الترحيل والأرشفة النهائية للصحائف (Promotion) | **جدولان (2)** | `student_transcripts`, `promotion_batches` |
| 🏆 | **الإجمالي الكلي للنظام** | **25 جدولاً** | **موزعة ومحكومة بالكامل بنمط SSoT** |

---

# 📦 المرحلة 01: الهوية والمصادقة والتدقيق (Authentication, Identity & Audit) — [3 جداول]

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

# 📦 المرحلة 02: الهيكل الأكاديمي والمناهج (Academic Hierarchy & Curriculum) — [8 جداول]

---

## 1. جدول الأعوام الدراسية (`academic_years`)

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

## 2. جدول كتالوج الفترات المرجعي (`academic_terms` - Master Catalog)

> **الوصف:**  
> الكتالوج المرجعي العام لتعريف الفترات والسمسترات المعتمدة في الدولة لمرة واحدة فقط دون ربطها بتواريخ ثابتة (مثل: الفصل الأول، الفصل الثاني، الفصل الثالث).

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد للفصل الدراسي/السمستر. |
| `name` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | مسمى الفترة المعياري (مثال: `الفصل الأول`, `الفصل الثاني`, `الفصل الثالث`). |
| `term_number` | `TINYINT UNSIGNED` | `NOT NULL`, `UNIQUE` | ترتيب الفصل المعتمد (`1`, `2`, `3`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* *لا يحتوي على مفاتيح خارجية (جدول كتالوج مرجعي عام Master Catalog).*

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_terms_name (name)`
* `UNIQUE INDEX uq_terms_number (term_number)`

---

## 3. جدول المراحل الدراسية (`academic_stages`)

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

## 4. جدول الفصول الدراسية (`classes`)

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
* `stage_id` يرتبط بجدول `academic_stages(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_classes_stage_level (stage_id, grade_level)`
* `INDEX idx_classes_stage_id (stage_id)`
* `INDEX idx_classes_grade_level (grade_level)`

---

## 5. جدول فترات وحالات الصفوف الدراسية (`class_academic_terms`)

> **الوصف:**  
> جدول إدارة وتخصيص فترات/سمسترات الصفوف الدراسية وحالتها النشطة والمغلقة لكل صف دراسي كقالب عام مستقل عن السنوات والتواريخ لتلبية التفاوت بين الصفوف العادية والانتقالية والشهادات.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد لربط فترة الصف. |
| `class_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الصف الدراسي (يرتبط بـ `classes.id`). |
| `academic_term_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفترة المرجعية (يرتبط بـ `academic_terms.id`). |
| `is_active` | `TINYINT(1)` | `NOT NULL`, `DEFAULT 0` | هل هي الفترة النشطة حالياً لهذا الصف لعمليات التدريس والدرجات؟ (`1 = نشطة`, `0 = غير نشطة`). |
| `is_closed` | `TINYINT(1)` | `NOT NULL`, `DEFAULT 0` | هل تم إغلاق درجات هذه الفترة نهائياً لهذا الصف؟ (`1 = مغلقة للأرشفة`, `0 = مفتوحة`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `class_id` يرتبط بجدول `classes(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `academic_term_id` يرتبط بجدول `academic_terms(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_class_term (class_id, academic_term_id)`
* `INDEX idx_class_terms_class (class_id)`
* `INDEX idx_class_terms_term (academic_term_id)`
* `INDEX idx_class_terms_active (is_active)`
* `INDEX idx_class_terms_closed (is_closed)`

---

## 6. جدول الشعب الدراسية (`sections`)

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

## 7. جدول ربط الفصول بالشعب (`class_sections`)

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

## 8. جدول كتالوج المواد العام (`subjects`)

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

## 9. جدول مقررات الفصول والدرجات بالفصل الدراسي (`class_subjects`)

> **الوصف:**  
> جدول الربط الثلاثي المحكم يربط كل صف دراسي بالمادة المقررة في تخصيص فترة الصف المحمية بجدول `class_academic_terms` لضمان صحة النزاهة 100%، مع تحديد توزيع درجات المادة (أعمال سنة + امتحان نهائي)، الدرجة الكلية العظمى، وشرط النجاح المزدوج (درجة النجاح الكلية الصغرى + درجة النجاح الصغرى للامتحان النهائي) المخصصة لكل سمستر بدقة متناهية.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي لمقرر المادة بالفصل الدراسي. |
| `class_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الصف الدراسي (يرتبط بـ `classes.id`). |
| `subject_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف المادة العامة (يرتبط بـ `subjects.id`). |
| `class_academic_term_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف تخصيص فترة الصف (يرتبط بـ `class_academic_terms.id`). |
| `max_coursework_score` | `DECIMAL(5,2)` | `NOT NULL`, `DEFAULT 40.00` | الدرجة العظمى لأعمال السنة للمادة في هذا السمستر. |
| `max_exam_score` | `DECIMAL(5,2)` | `NOT NULL`, `DEFAULT 60.00` | الدرجة العظمى للامتحان النهائي للمادة في هذا السمستر. |
| `exam_passing_score` | `DECIMAL(5,2)` | `NOT NULL`, `DEFAULT 30.00` | درجة النجاح الصغرى للامتحان النهائي المقررة للمادة في هذا السمستر (شرط اجتياز الامتحان). |
| `passing_score` | `DECIMAL(5,2)` | `NOT NULL`, `DEFAULT 50.00` | درجة النجاح الصغرى الإجمالية المقررة للمادة في هذا السمستر. |
| `max_score` | `DECIMAL(5,2)` | `NOT NULL`, `DEFAULT 100.00` | الدرجة الكلية العظمى للمادة في هذا السمستر (`max_coursework_score + max_exam_score`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `class_id` يرتبط بجدول `classes(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `subject_id` يرتبط بجدول `subjects(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_academic_term_id` يرتبط بجدول `class_academic_terms(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_class_term_subject (class_academic_term_id, subject_id)`
* `INDEX idx_class_subjects_class (class_id)`
* `INDEX idx_class_subjects_subject (subject_id)`
* `INDEX idx_class_subjects_class_term (class_academic_term_id)`

### 📐 قيود النزاهة والحسابات الأكاديمية (Integrity & Academic Rules):
* `max_score = max_coursework_score + max_exam_score` (الدرجة الكلية هي حاصل جمع أعمال السنة والامتحان).
* `passing_score <= max_score` (درجة النجاح الكلية لا تتجاوز الدرجة الكلية العظمى).
* `exam_passing_score <= max_exam_score` (درجة نجاح الامتحان لا تتجاوز عظمى الامتحان).
* **قاعدة النجاح المزدوج للمادة (Dual-Criterion Subject Passing Rule):**  
  يعتبر الطالب ناجحاً في المادة حصراً إذا حقق الشرطين معاً:  
  1. `total_score >= passing_score` (المجموع الكلي لا يقل عن درجة النجاح الكلية).  
  2. `exam_score >= exam_passing_score` (درجة الامتحان النهائي لا تقل عن درجة نجاح الامتحان).  
  *إذا لم يستوفِ الطالب شرط الامتحان حتى وإن تجاوز المجموع الكلي درجة النجاح، يعتبر راسباً / دور ثانٍ في المادة.*

---

# 📦 المرحلة 03: الكادر التعليمي وإسناد التدريس (Teachers & Teaching Assignments) — [جدولان (2)]

---

## 1. جدول المعلمين (`teachers`)

> **الوصف:**  
> جدول ملفات المعلمين وبياناتهم الشخصية والمهنية وتخصصاتهم العلمية وربطهم بحسابات الدخول الموحدة.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الداخلي للمعلم. |
| `user_id` | `BIGINT UNSIGNED` | `NOT NULL`, `UNIQUE` | معرف حساب الدخول الموحد (يرتبط بـ `users.id` صاحب كود `TCH-XXXX`). |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | الاسم الرباعي واللقب للمعلم. |
| `phone` | `VARCHAR(20)` | `NULL DEFAULT NULL` | رقم هاتف المعلم للتواصل. |
| `specialization` | `VARCHAR(100)` | `NULL DEFAULT NULL` | التخصص العلمي (مثال: رياضيات، لغة إنجليزية، علوم). |
| `hire_date` | `DATE` | `NULL DEFAULT NULL` | تاريخ التعيين والمباشرة بالمدرسة. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_teachers_user_id (user_id)`
* `INDEX idx_teachers_full_name (full_name)`

---

## 2. جدول إسناد التدريس الأكاديمي (`teaching_assignments`)

> **الوصف:**  
> حلقة الوصل المحورية التي تحدد المعلم المسؤول عن تدريس مادة دراسية محددة لشعبة وفصل محدد خلال عام دراسي محدد.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي لسجل الإسناد الأكاديمي. |
| `academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي النشط (يرتبط بـ `academic_years.id`). |
| `class_section_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل والشعبة المحددة (يرتبط بـ `class_sections.id`). |
| `subject_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف المادة الدراسية المسندة (يرتبط بـ `subjects.id`). |
| `teacher_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف المعلم المكلف بالتدريس (يرتبط بـ `teachers.id`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_section_id` يرتبط بجدول `class_sections(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `subject_id` يرتبط بجدول `subjects(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `teacher_id` يرتبط بجدول `teachers(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_teaching_assignment (academic_year_id, class_section_id, subject_id)`  
  *(قيد الحوكمة المحوري: يضمن تعيين معلم مسؤول أساسي واحد فقط لكل مادة في الشعبة الواحدة خلال العام الدراسي لمنع تضارب رصد الدرجات والواجبات، مع إمكانية تكرار المعلم الواحد لتدريس مواد وفصول وشعب متعددة).*
* `INDEX idx_teaching_teacher (teacher_id)`
* `INDEX idx_teaching_class_section (class_section_id)`
* `INDEX idx_teaching_subject (subject_id)`

---

# 📦 المرحلة 04: شؤون الطلاب وتسكين الفصول وأولياء الأمور (Students, Guardians & Enrollments) — [4 جداول]

---

## 1. جدول الطلاب (`students`)

> **الوصف:**  
> جدول ملفات الطلاب وبياناتهم الشخصية الأساسية (الاسم، تاريخ الميلاد، الجنس، رقم الهاتف) وربطهم بحسابات الدخول الموحدة.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الداخلي الفريد للطالب. |
| `user_id` | `BIGINT UNSIGNED` | `NOT NULL`, `UNIQUE` | معرف حساب الدخول الموحد (يرتبط بـ `users.id` صاحب كود `STU-XXXX`). |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | الاسم الرباعي واللقب للطالب. |
| `phone` | `VARCHAR(20)` | `NULL DEFAULT NULL` | رقم هاتف الطالب للتواصل (اختياري). |
| `birth_date` | `DATE` | `NULL DEFAULT NULL` | تاريخ ميلاد الطالب. |
| `gender` | `ENUM('male', 'female')` | `NOT NULL` | جنس الطالب (`male = ذكر`, `female = أنثى`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_students_user_id (user_id)`
* `INDEX idx_students_full_name (full_name)`

---

## 2. جدول أولياء الأمور (`guardians`)

> **الوصف:**  
> جدول ملفات أولياء الأمور وبيانات الاتصال وصلة القرابة وربطهم بحسابات الدخول الموحدة للدخول في سياق الأبناء.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الداخلي لولي الأمر. |
| `user_id` | `BIGINT UNSIGNED` | `NOT NULL`, `UNIQUE` | معرف حساب الدخول الموحد (يرتبط بـ `users.id` صاحب كود `PAR-XXXX`). |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | الاسم الكامل لولي الأمر. |
| `phone` | `VARCHAR(20)` | `NOT NULL` | رقم هاتف التواصل مع ولي الأمر. |
| `relationship` | `ENUM('father', 'mother', 'brother', 'uncle', 'other')` | `NOT NULL`, `DEFAULT 'father'` | صلة القرابة بالطالب. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_guardians_user_id (user_id)`
* `UNIQUE INDEX uq_guardians_phone (phone)`
* `INDEX idx_guardians_full_name (full_name)`

---

## 3. جدول وصاية أولياء الأمور على الطلاب (`guardian_students`)

> **الوصف:**  
> جدول ربط علاقة متعدد لمتعدد (M:N) بين أولياء الأمور والأبناء، يتيح لولي الأمر متابعة أكثر من طالب، ويتيح للطالب الارتباط بأكثر من وصي.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي لسجل الوصاية. |
| `guardian_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف ولي الأمر (يرتبط بـ `guardians.id`). |
| `student_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الطالب الابن (يرتبط بـ `students.id`). |
| `is_primary` | `TINYINT(1)` | `NOT NULL`, `DEFAULT 1` | هل هو الوصي الرئيسي المعتمد للطالب (`1 = نعم`, `0 = إضافي`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `guardian_id` يرتبط بجدول `guardians(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `student_id` يرتبط بجدول `students(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_guardian_student (guardian_id, student_id)`
* `INDEX idx_guardian_students_guardian (guardian_id)`
* `INDEX idx_guardian_students_student (student_id)`

---

## 4. جدول تسكين الطلاب الأكاديمي (`student_enrollments`)

> **الوصف:**  
> جدول تسكين الطلاب في الفصول والشعب للعام الدراسي النشط، وتتبع أرقام الجلوس والمستوى الأكاديمي وحالات نهاية العام (قيد، نجاح، دور ثانٍ، رسوب، تخرج).

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي لسجل التسكين. |
| `academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي (يرتبط بـ `academic_years.id`). |
| `student_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الطالب (يرتبط بـ `students.id`). |
| `class_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الصف الدراسي (يرتبط بـ `classes.id` لضمان النزاهة العلائقية). |
| `grade_level` | `SMALLINT UNSIGNED` | `NOT NULL` | المستوى الأكاديمي الرقمي (`1` إلى `12`) لتسريع التقارير وحسابات الترحيل. |
| `class_section_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل والشعبة المسكن بها (يرتبط بـ `class_sections.id`). |
| `seating_number` | `VARCHAR(50)` | `NULL DEFAULT NULL` | رقم جلوس الطالب في الامتحانات للعام الدراسي. |
| `status` | `ENUM('enrolled', 'passed', 'second_round', 'failed', 'graduated')` | `NOT NULL`, `DEFAULT 'enrolled'` | حالة الطالب الأكاديمية ونهاية العام. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `student_id` يرتبط بجدول `students(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_id` يرتبط بجدول `classes(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_section_id` يرتبط بجدول `class_sections(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_student_year_enrollment (academic_year_id, student_id)`  
  *(قيد الحوكمة المحوري: يضمن تسكين الطالب في فصل وشعبة واحدة فقط خلال العام الدراسي الواحد لمنع التكرار).*
* `INDEX idx_enrollments_class_id (class_id)`
* `INDEX idx_enrollments_grade_level (academic_year_id, grade_level)`
* `INDEX idx_enrollments_class_section (class_section_id)`
* `INDEX idx_enrollments_status (status)`
* `INDEX idx_enrollments_seating (seating_number)`

---

# 📦 المرحلة 05: أوقات الحصص والجداول الأسبوعية (Timetables & Daily Period Slots) — [جدولان (2)]

---

## 1. جدول أوقات الحصص اليومية (`period_slots`)

> **الوصف:**  
> جدول تحديد مواعيد الحصص المدرسية اليومية والفسحة/الاستراحة المنظمة لليوم المدرسي والمحددة مركزياً من الإدارة.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي للحصة اليومية. |
| `name` | `VARCHAR(50)` | `NOT NULL` | مسمى الحصة (مثال: `الحصة الأولى`, `الحصة الثانية`, `الفسحة / الاستراحة`). |
| `slot_number` | `TINYINT UNSIGNED` | `NOT NULL`, `UNIQUE` | الرقم التسلسلي للحصة خلال اليوم (`1, 2, 3...`). |
| `start_time` | `TIME` | `NOT NULL` | وقت بداية الحصة (مثال: `08:00:00`). |
| `end_time` | `TIME` | `NOT NULL` | وقت نهاية الحصة (مثال: `08:45:00`). |
| `is_break` | `TINYINT(1)` | `NOT NULL`, `DEFAULT 0` | هل هي فترة راحة/فسحة لا تتطلب تدريساً (`1 = استراحة`, `0 = حصة دراسية`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* *لا يحتوي على مفاتيح خارجية.*

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_period_slots_number (slot_number)`
* `INDEX idx_period_slots_times (start_time, end_time)`

---

## 2. جدول الحصص بالجدول الأسبوعي (`timetable_slots`)

> **الوصف:**  
> جدول توزيع الحصص الدراسية على أيام الأسبوع (السبت إلى الخميس) لكل شعبة للعام الدراسي، وربطها بالمادة والمعلم المكلف مع منع التعارضات.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي لسجل الحصة في الجدول الأسبوعي. |
| `academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي النشط (يرتبط بـ `academic_years.id`). |
| `class_section_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل والشعبة المحددة (يرتبط بـ `class_sections.id`). |
| `day_of_week` | `ENUM('saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday')` | `NOT NULL` | يوم الحصة في الأسبوع. |
| `period_slot_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف توقيت الحصة اليومية (يرتبط بـ `period_slots.id`). |
| `teaching_assignment_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف إسناد التدريس (يرتبط بـ `teaching_assignments.id` لتحديد المادة والمعلم). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_section_id` يرتبط بجدول `class_sections(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `period_slot_id` يرتبط بجدول `period_slots(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `teaching_assignment_id` يرتبط بجدول `teaching_assignments(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس وقيود منع التعارض (Indexes & Anti-Conflict Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_timetable_section_slot (academic_year_id, class_section_id, day_of_week, period_slot_id)`  
  *(قيد الحوكمة ومنع التعارض للشعبة: يمنع وجود حصتين لنفس الشعبة في نفس اليوم والتوقيت خلال العام الدراسي).*
* `INDEX idx_timetable_teacher_conflict (academic_year_id, day_of_week, period_slot_id, teaching_assignment_id)`  
  *(فهرس استعلام فحص تضارب المعلم: يمنع إسناد المعلم لتدريس شعبتين في نفس التوقيت واليوم).*
* `INDEX idx_timetable_class_section (class_section_id)`

---

# 📦 المرحلة 06: الواجبات المدرسية (Homework & Assignments) — [جدول واحد (1)]

---

## 1. جدول الواجبات المدرسية (`assignments`)

> **الوصف:**  
> جدول إدارة الواجبات المدرسية والتكاليف المنزلية التي ينشئها المعلم (أو الإدارة بصفة وكيل) ومتابعة مواعيد استحقاقها من قِبل الطلاب وأولياء الأمور لكل عام دراسي وسمستر وشعبة.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد للواجب. |
| `academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي النشط (يرتبط بـ `academic_years.id`). |
| `academic_term_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل الدراسي/السمستر (يرتبط بـ `academic_terms.id`). |
| `class_section_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل والشعبة الموجه لها الواجب (يرتبط بـ `class_sections.id`). |
| `teaching_assignment_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف إسناد التدريس (يرتبط بـ `teaching_assignments.id` لتحديد المادة والمعلم بدقة). |
| `created_by_user_id` | `BIGINT UNSIGNED` | `NOT NULL` | المستخدم الفعلي الذي أنشأ السجل (يرتبط بـ `users.id` لتوثيق المنشئ سواء كان المعلم أو الإدارة). |
| `title` | `VARCHAR(200)` | `NOT NULL` | عنوان وموضوع الواجب (مثال: `حل تمارين ص 45 - الجبر`). |
| `description` | `TEXT` | `NULL DEFAULT NULL` | التفاصيل والتعليمات الإضافية للواجب. |
| `attachments` | `JSON` | `NULL DEFAULT NULL` | مصفوفة ملفات وصور مرفقة بالواجب بصيغة JSON (تدعم عدة صور وملفات PDF). |
| `assigned_date` | `DATE` | `NOT NULL` | تاريخ نشر الواجب للطلاب. |
| `due_date` | `DATE` | `NOT NULL` | تاريخ الاستحقاق وموعد التسليم النهائي. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `academic_term_id` يرتبط بجدول `academic_terms(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_section_id` يرتبط بجدول `class_sections(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `teaching_assignment_id` يرتبط بجدول `teaching_assignments(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `created_by_user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `INDEX idx_assignments_section_term (class_section_id, academic_term_id)`  
  *(فهرس استعلام فائق السرعة لعرض جدول واجبات الطالب وولي الأمر في السمستر الحالي).*
* `INDEX idx_assignments_teaching (teaching_assignment_id)`
* `INDEX idx_assignments_academic_year (academic_year_id)`
* `INDEX idx_assignments_due_date (due_date)`

---

# 📦 المرحلة 07: التطبيقات والاختبارات الدورية (Class Quizzes & Tests) — [جدول واحد (1)]

---

## 1. جدول التطبيقات والاختبارات الدورية (`quizzes`)

> **الوصف:**  
> جدول جدولة وإعلان مواعيد وتفاصيل الاختبارات الدورية والتطبيقات الشهرية التي ينشئها المعلم (أو الإدارة بصفة وكيل) لتمكين الطلاب وأولياء الأمور من الاطلاع عليها والاستعداد لها لكل عام دراسي وسمستر وشعبة.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد للتطبيق. |
| `academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي النشط (يرتبط بـ `academic_years.id`). |
| `academic_term_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل الدراسي/السمستر (يرتبط بـ `academic_terms.id`). |
| `class_section_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل والشعبة الموجه لها التطبيق (يرتبط بـ `class_sections.id`). |
| `teaching_assignment_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف إسناد التدريس (يرتبط بـ `teaching_assignments.id` لتحديد المادة والمعلم بدقة). |
| `created_by_user_id` | `BIGINT UNSIGNED` | `NOT NULL` | المستخدم الفعلي الذي أنشأ السجل (يرتبط بـ `users.id` لتوثيق المنشئ سواء كان المعلم أو الإدارة). |
| `title` | `VARCHAR(200)` | `NOT NULL` | عنوان التطبيق (مثال: `تطبيق شهري 1 - الجبر`). |
| `description` | `TEXT` | `NULL DEFAULT NULL` | مواضيع الاختبار المقررة والتعليمات الإرشادية للطلاب. |
| `attachments` | `JSON` | `NULL DEFAULT NULL` | مصفوفة ملفات وصور مرفقة بالتطبيق بصيغة JSON (نماذج أسئلة، ملخصات، مراجعات). |
| `quiz_date` | `DATE` | `NOT NULL` | تاريخ وموعد إجراء التطبيق في الفصل. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `academic_term_id` يرتبط بجدول `academic_terms(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_section_id` يرتبط بجدول `class_sections(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `teaching_assignment_id` يرتبط بجدول `teaching_assignments(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `created_by_user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `INDEX idx_quizzes_section_term (class_section_id, academic_term_id)`  
  *(فهرس استعلام فائق السرعة لعرض جدول مواعيد تطبيقات الطالب في السمستر الحالي).*
* `INDEX idx_quizzes_teaching (teaching_assignment_id)`
* `INDEX idx_quizzes_academic_year (academic_year_id)`
* `INDEX idx_quizzes_date (quiz_date)`

---

# 📦 المرحلة 08: جدول الامتحانات الرسمية (Official Exams Schedule) — [جدول واحد (1)]

---

## 1. جدول الامتحانات الرسمية (`official_exams`)

> **الوصف:**  
> جدول جدولة ونشر مواعيد الامتحانات الرسمية (النصفية، النهائية، وامتحانات الدور الثاني) الصادرة مركزياً من إدارة المدرسة لكل صف دراسي ومادة في السمستر، ليطّلع عليها الطلاب والمعلمون وأولياء الأمور.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد لسجل الامتحان. |
| `academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي النشط (يرتبط بـ `academic_years.id`). |
| `academic_term_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل الدراسي/السمستر (يرتبط بـ `academic_terms.id`). |
| `class_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الصف الدراسي الموجه له الامتحان (يرتبط بـ `classes.id`). |
| `subject_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف المادة الدراسية (يرتبط بـ `subjects.id`). |
| `exam_type` | `ENUM('midterm', 'final', 'second_round')` | `NOT NULL`, `DEFAULT 'final'` | نوع الامتحان الرسمي (`midterm = نصفي`, `final = نهائي`, `second_round = دور ثانٍ`). |
| `exam_date` | `DATE` | `NOT NULL` | تاريخ يوم الامتحان. |
| `notes` | `VARCHAR(255)` | `NULL DEFAULT NULL` | تعليمات وإرشادات إضافية للطلاب بخصوص الامتحان. |
| `attachments` | `JSON` | `NULL DEFAULT NULL` | مصفوفة ملفات وصور مرفقة بالامتحان الرسمي بصيغة JSON (دليل المراجعة، جدول المواصفات، ونماذج استرشادية). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `academic_term_id` يرتبط بجدول `academic_terms(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_id` يرتبط بجدول `classes(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `subject_id` يرتبط بجدول `subjects(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس وقيود التفرد (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_official_exam_schedule (academic_year_id, academic_term_id, class_id, subject_id, exam_type)`  
  *(يمنع تكرار جدولة امتحان لنفس المادة والصف في نفس السمستر والنوع).*
* `INDEX idx_official_exams_lookup (academic_year_id, academic_term_id, class_id)`  
  *(فهرس استعلام سريع لجلب جدول امتحانات صف معين في سمستر معين).*
* `INDEX idx_official_exams_date (exam_date)`

---

# 📦 المرحلة 09: محرك الترحيل والأرشفة النهائية للصحائف (Promotion & Transcripts Archiving) — [جدولان (2)]

---

## 1. جدول الصحائف المدرسية المؤرشفة (`student_transcripts`)

> **الوصف:**  
> جدول أرشفة وتجميد الصحيفة المدرسية (سواء صحيفة سمستر دراسي معين أو الصحيفة السنوية النهائية) للطالب، متضمناً تفاصيل الفصول والدرجات وأعمال السنة والامتحانات والدور الثاني كلقطة بيانات نهائية ثابتة (Immutable JSON Snapshot) لا تتأثر ببدء العام الجديد أو مسح الحركات التشغيلية السابقة.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد لسجل الصحيفة. |
| `student_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الطالب الدائم (يرتبط بـ `students.id` كالمفتاح الخارجي الوحيد). |
| `transcript_type` | `ENUM('term', 'annual')` | `NOT NULL`, `DEFAULT 'annual'` | نوع الصحيفة المؤرشفة (`term = صحيفة فصل/سمستر محدد`, `annual = صحيفة تجميعية سنوية`). |
| `class_academic_term_id` | `BIGINT UNSIGNED` | `NULL DEFAULT NULL` | معرف فترة الصف المرتبطة بالصحيفة إذا كانت سمستر محدد (يرتبط بـ `class_academic_terms.id`). |
| `academic_year_name` | `VARCHAR(50)` | `NOT NULL` | مسمى العام الدراسي كنص صلب (مثال: `2024/2025`). |
| `class_name` | `VARCHAR(50)` | `NOT NULL` | اسم الصف الدراسي كنص صلب (مثال: `الصف الخامس`). |
| `section_name` | `VARCHAR(50)` | `NOT NULL` | اسم الشعبة كنص صلب (مثال: `شعبة أ`). |
| `grade_level` | `SMALLINT UNSIGNED` | `NOT NULL` | المستوى الأكاديمي الرقمي وقت التخرج من السنة (`1` إلى `12`). |
| `total_score` | `DECIMAL(7,2)` | `NOT NULL` | المجموع الكلي للدرجات التي تحصل عليها الطالب. |
| `percentage` | `DECIMAL(5,2)` | `NOT NULL` | النسبة المئوية العامة للطالب (مثال: `94.50%`). |
| `final_status` | `ENUM('passed', 'second_round', 'failed', 'graduated')` | `NOT NULL` | النتيجة والقرار النهائي للطالب بنهاية الفصل أو العام. |
| `rank` | `SMALLINT UNSIGNED` | `NULL DEFAULT NULL` | الترتيب على مستوى الصف أو الشعبة (مثال: `الأول`, `الثاني`). |
| `transcript_data` | `JSON` | `NOT NULL` | اللقطة الكاملة للصحيفة: يتم رصد وإدخال درجات المواد عبر واجهة شيت رصد الدرجات (Grade Entry Sheet UI) وتخزينها بصيغة JSON متضمنة لقطة كل مادة (`coursework_score`, `max_coursework_score`, `exam_score`, `max_exam_score`, `total_score`, `passing_score`, `max_score`, `status`, `second_round_details`). |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت تجميد وإصدار الصحيفة. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `student_id` يرتبط بجدول `students(id)` مع سلوك `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_academic_term_id` يرتبط بجدول `class_academic_terms(id)` مع سلوك `ON DELETE SET NULL, ON UPDATE CASCADE`.

### ⚡ الفهارس وقيود التفرد (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_student_transcript_term (student_id, academic_year_name, transcript_type, class_academic_term_id)`  
  *(يضمن حفظ صحيفة سمستر واحدة أو صحيفة سنوية واحدة معتمدة لكل طالب بالعام).*
* `INDEX idx_transcripts_year_class (academic_year_name, class_name)`
* `INDEX idx_transcripts_status (final_status)`

---

## 2. جدول سجل وإحصائيات دفعات الترحيل السنوي (`promotion_batches`)

> **الوصف:**  
> جدول توثيق وتتبع كل دفعة ترحيل سنوي جماعي تنفذها الإدارة، مع حفظ الإحصائيات الشاملة ونسب النجاح والرسوب وأعداد الطلاب لكل صف دراسي.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي لسجل دفعة الترحيل. |
| `from_academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي المُنتهى المرحل منه (يرتبط بـ `academic_years.id`). |
| `to_academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي الجديد المرحل إليه (يرتبط بـ `academic_years.id`). |
| `executed_by_user_id` | `BIGINT UNSIGNED` | `NOT NULL` | المدير الذي قام باعتماد وتنفيذ عملية الترحيل (يرتبط بـ `users.id`). |
| `total_students` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد طلاب المدرسة المشمولين بالترحيل. |
| `total_promoted` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد الطلاب الناجحين المنقولين للمستوى الأعلى. |
| `total_second_round` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد طلاب الدور الثاني/الملاحق. |
| `total_retained` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد الراسبين الباقين للإعادة في نفس الصف. |
| `total_graduated` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد الخريجين من المرحلة النهائية. |
| `overall_passing_rate` | `DECIMAL(5,2)` | `NOT NULL` | النسبة المئوية العامة لنجاح المدرسة في ذلك العام (مثال: `88.50%`). |
| `class_statistics` | `JSON` | `NOT NULL` | إحصائيات تفصيلية لكل صف دراسي بصيغة JSON (اسم الصف، عدد الطلاب، عدد الناجحين، عدد الراسبين، ونسبة النجاح الخاصة بكل صف). |
| `execution_notes` | `VARCHAR(255)` | `NULL DEFAULT NULL` | ملاحظات الإدارة على دفعة الترحيل. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت تنفيذ عملية الترحيل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `from_academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `to_academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `executed_by_user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس وقيود التفرد (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_promotion_batch_years (from_academic_year_id, to_academic_year_id)`  
  *(يضمن تسجيل دفعة ترحيل واحدة معتمدة بين كل عامين دراسيين).*
* `INDEX idx_promotion_executed_by (executed_by_user_id)`
* `INDEX idx_promotion_created_at (created_at)`

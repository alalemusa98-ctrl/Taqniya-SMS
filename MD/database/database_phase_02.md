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

# 📦 المرحلة 04: شؤون الطلاب وتسكين الفصول وأولياء الأمور (Students, Guardians & Enrollments)

---

## 13. جدول الطلاب (`students`)

> **الوصف:**  
> جدول ملفات الطلاب وبياناتهم الشخصية الأساسية (الاسم، تاريخ الميلاد، الجنس) وربطهم بحسابات الدخول الموحدة.

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
* `user_id` يرتبط بجدول `users(id)` مع سلوك:
  * `ON DELETE RESTRICT` (يمنع حذف الحساب طالما هناك سجل طالب مرتبط به دون حذف صريح).
  * `ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_students_user_id (user_id)`
* `INDEX idx_students_full_name (full_name)`

---

## 14. جدول أولياء الأمور (`guardians`)

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

## 15. جدول وصاية أولياء الأمور على الطلاب (`guardian_students`)

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

## 16. جدول تسكين الطلاب الأكاديمي (`student_enrollments`)

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

# 📦 المرحلة 03: الكادر التعليمي وإسناد التدريس (Teachers & Teaching Assignments)

---

## 11. جدول المعلمين (`teachers`)

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
* `user_id` يرتبط بجدول `users(id)` مع سلوك:
  * `ON DELETE RESTRICT` (يمنع حذف الحساب طالما هناك سجل معلم مرتبط به دون إلغاء صريح).
  * `ON UPDATE CASCADE`.

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_teachers_user_id (user_id)`
* `INDEX idx_teachers_full_name (full_name)`

---

## 12. جدول إسناد التدريس الأكاديمي (`teaching_assignments`)

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

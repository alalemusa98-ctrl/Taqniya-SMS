# 📦 المرحلة 08: جدول الامتحانات الرسمية (Official Exams Schedule)

---

## 21. جدول الامتحانات الرسمية (`official_exams`)

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

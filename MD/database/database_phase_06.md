# 📦 المرحلة 06: الواجبات المدرسية (Homework & Assignments)

---

## 19. جدول الواجبات المدرسية (`assignments`)

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

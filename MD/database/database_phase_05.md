# 📦 المرحلة 05: أوقات الحصص والجداول الأسبوعية (Timetables & Daily Period Slots)

---

## 17. جدول أوقات الحصص اليومية (`period_slots`)

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
* *لا يحتوي على مفاتيح خارجية (جدول هيكلي عام لتوقيتات اليوم المدرسي).*

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_period_slots_number (slot_number)`
* `INDEX idx_period_slots_times (start_time, end_time)`

---

## 18. جدول الحصص بالجدول الأسبوعي (`timetable_slots`)

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

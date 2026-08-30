# 📊 مواصفات البيانات والكيانات — المرحلة 06 (Data Specification)

> **الهدف:** توثيق المخطط الهيكلي لجدول الواجبات المدرسية (`assignments`) المطابق بنسبة 100% للمصدر الرئيسي والحصري للحقيقة: [`MD/database.md`](../../database.md).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** ملف [`routes.md`](./routes.md) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. هيكل جدول الواجبات المدرسية (`assignments`)

> **الوصف:** جدول إدارة الواجبات المدرسية والتكاليف المنزلية التي ينشئها المعلم (أو الإدارة بصفة وكيل) ومتابعة مواعيد استحقاقها من قِبل الطلاب وأولياء الأمور لكل عام دراسي وسمستر وشعبة.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود والخصائص (Constraints) | الوصف والدلالة الوظيفية |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | المعرف الرقمي الفريد للواجب. |
| `academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL, INDEXED` | معرف العام الدراسي النشط (يرتبط بـ `academic_years.id`). |
| `academic_term_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الفصل الدراسي/السمستر (يرتبط بـ `academic_terms.id`). |
| `class_section_id` | `BIGINT UNSIGNED` | `NOT NULL, INDEXED` | معرف الفصل والشعبة الموجه لها الواجب (يرتبط بـ `class_sections.id`). |
| `teaching_assignment_id` | `BIGINT UNSIGNED` | `NOT NULL, INDEXED` | معرف إسناد التدريس (يرتبط بـ `teaching_assignments.id` لتحديد المادة والمعلم بدقة). |
| `created_by_user_id` | `BIGINT UNSIGNED` | `NOT NULL` | المستخدم الفعلي الذي أنشأ السجل (يرتبط بـ `users.id` لتوثيق المنشئ سواء كان المعلم أو الإدارة). |
| `title` | `VARCHAR(200)` | `NOT NULL` | عنوان وموضوع الواجب (مثال: `حل تمارين ص 45 - الجبر`). |
| `description` | `TEXT` | `NULL DEFAULT NULL` | التفاصيل والتعليمات الإضافية للواجب. |
| `attachments` | `JSON` | `NULL DEFAULT NULL` | مصفوفة ملفات وصور مرفقة بالواجب بصيغة JSON (تدعم عدة صور وملفات PDF). |
| `assigned_date` | `DATE` | `NOT NULL` | تاريخ نشر الواجب للطلاب. |
| `due_date` | `DATE` | `NOT NULL, INDEXED` | تاريخ الاستحقاق وموعد التسليم النهائي. |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

---

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `academic_term_id` يرتبط بجدول `academic_terms(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `class_section_id` يرتبط بجدول `class_sections(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `teaching_assignment_id` يرتبط بجدول `teaching_assignments(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `created_by_user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

---

### ⚡ الفهارس والقيود (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `INDEX idx_assignments_section_term (class_section_id, academic_term_id)`  
  *(فهرس استعلام فائق السرعة لعرض جدول واجبات الطالب وولي الأمر في السمستر الحالي).*
* `INDEX idx_assignments_teaching (teaching_assignment_id)`
* `INDEX idx_assignments_academic_year (academic_year_id)`
* `INDEX idx_assignments_due_date (due_date)`

---

## 2. مخطط الكيانات والعلاقات لـ Phase 06 (ERD)

```mermaid
erDiagram
    academic_years ||--o{ assignments : "context of academic year"
    academic_terms ||--o{ assignments : "belongs to term"
    class_sections ||--o{ assignments : "assigned to section"
    teaching_assignments ||--o{ assignments : "subject & teacher assignment"
    users ||--o{ assignments : "created by user"

    assignments {
        bigint id PK
        bigint academic_year_id FK
        bigint academic_term_id FK
        bigint class_section_id FK
        bigint teaching_assignment_id FK
        bigint created_by_user_id FK
        varchar title
        text description
        json attachments
        date assigned_date
        date due_date
    }
```

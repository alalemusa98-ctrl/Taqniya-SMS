# 📊 مواصفات البيانات والكيانات — المرحلة 04-A (Data Specification)

> **الهدف:** توثيق المخطط الهيكلي لجداول الطلاب (`students`)، أولياء الأمور (`guardians`)، وروابط الوصاية (`guardian_students`) المطابق بنسبة 100% للمصدر الرئيسي والحصري للحقيقة: [`MD/database.md`](../../database.md).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** ملف [`routes.md`](./routes.md) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. هيكل الجداول والكيانات (Tables Matrix)

---

### 1.1 [الخطوة 1] جدول الطلاب (`students`)

> **الوصف:** جدول ملفات الطلاب وبياناتهم الشخصية الأساسية (الاسم، تاريخ الميلاد، الجنس، رقم الهاتف) وربطهم بحسابات الدخول الموحدة.

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود والخصائص (Constraints) | الوصف والدلالة الوظيفية |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | المعرف الرقمي الداخلي الفريد للطالب. |
| `user_id` | `BIGINT UNSIGNED` | `NOT NULL, UNIQUE` | معرف حساب الدخول الموحد (يرتبط بـ `users.id` صاحب كود `STU-XXXX`). |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | الاسم الرباعي واللقب للطالب. |
| `phone` | `VARCHAR(20)` | `NULL DEFAULT NULL` | رقم هاتف الطالب للتواصل (اختياري). |
| `birth_date` | `DATE` | `NULL DEFAULT NULL` | تاريخ ميلاد الطالب. |
| `gender` | `ENUM('male', 'female')` | `NOT NULL` | جنس الطالب (`male = ذكر`, `female = أنثى`). |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي (Soft Delete). |

#### 🔗 العلاقات والمفاتيح الخارجية:
* `user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

#### ⚡ الفهارس والقيود:
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_students_user_id (user_id)`
* `INDEX idx_students_full_name (full_name)`
* `INDEX idx_students_deleted_at (deleted_at)`

---

### 1.2 [الخطوة 2] جدول أولياء الأمور (`guardians`)

> **الوصف:** جدول ملفات أولياء الأمور وبيانات الاتصال وصلة القرابة وربطهم بحسابات الدخول الموحدة للدخول في سياق الأبناء.

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود والخصائص (Constraints) | الوصف والدلالة الوظيفية |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | المعرف الرقمي الداخلي لولي الأمر. |
| `user_id` | `BIGINT UNSIGNED` | `NOT NULL, UNIQUE` | معرف حساب الدخول الموحد (يرتبط بـ `users.id` صاحب كود `PAR-XXXX`). |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | الاسم الكامل لولي الأمر. |
| `phone` | `VARCHAR(20)` | `NOT NULL` | رقم هاتف التواصل مع ولي الأمر (فريد). |
| `relationship` | `ENUM('father', 'mother', 'brother', 'uncle', 'other')` | `NOT NULL, DEFAULT 'father'` | صلة القرابة الافتراضية بالطالب. |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي (Soft Delete). |

#### 🔗 العلاقات والمفاتيح الخارجية:
* `user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

#### ⚡ الفهارس والقيود:
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_guardians_user_id (user_id)`
* `UNIQUE INDEX uq_guardians_phone (phone)`
* `INDEX idx_guardians_full_name (full_name)`
* `INDEX idx_guardians_deleted_at (deleted_at)`

---

### 1.3 [الخطوة 3] جدول وصاية أولياء الأمور على الطلاب (`guardian_students`)

> **الوصف:** جدول ربط علاقة متعدد لمتعدد (M:N) بين أولياء الأمور والأبناء، يتيح لولي الأمر متابعة أكثر من طالب، ويتيح للطالب الارتباط بأكثر من وصي.

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود والخصائص (Constraints) | الوصف والدلالة الوظيفية |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | المعرف الرقمي لسجل الوصاية. |
| `guardian_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف ولي الأمر (يرتبط بـ `guardians.id`). |
| `student_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الطالب الابن (يرتبط بـ `students.id`). |
| `is_primary` | `TINYINT(1)` | `NOT NULL, DEFAULT 1` | هل هو الوصي الرئيسي المعتمد للطالب (`1 = نعم`, `0 = إضافي`). |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | توقيت إنشاء السجل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي (Soft Delete). |

#### 🔗 العلاقات والمفاتيح الخارجية:
* `guardian_id` يرتبط بجدول `guardians(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `student_id` يرتبط بجدول `students(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

#### ⚡ الفهارس والقيود:
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_guardian_student (guardian_id, student_id)`
* `INDEX idx_guardian_students_guardian (guardian_id)`
* `INDEX idx_guardian_students_student (student_id)`
* `INDEX idx_guardian_students_deleted_at (deleted_at)`

---

## 2. مخطط الكيانات والعلاقات لـ 04-A (ERD)

```mermaid
erDiagram
    users ||--o| students : "authenticates as (STU-XXXX)"
    users ||--o| guardians : "authenticates as (PAR-XXXX)"
    guardians ||--o{ guardian_students : "has custody of"
    students ||--o{ guardian_students : "guarded by"

    students {
        bigint id PK
        bigint user_id FK
        varchar full_name
        varchar phone
        date birth_date
        enum gender
        timestamp deleted_at
    }

    guardians {
        bigint id PK
        bigint user_id FK
        varchar full_name
        varchar phone
        enum relationship
        timestamp deleted_at
    }

    guardian_students {
        bigint id PK
        bigint guardian_id FK
        bigint student_id FK
        tinyint is_primary
        timestamp deleted_at
    }
```

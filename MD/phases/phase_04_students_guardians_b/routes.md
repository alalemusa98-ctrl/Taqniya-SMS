# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 04-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 6 كاملة لإدارة تسكين الطلاب بالفصول والشعب وتوليد أرقام الجلوس وحالات التسجيل الأكاديمية مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف (`routes.md`) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Accept: application/json`, `Content-Type: application/json`

### 📋 نمط الاستجابات العامة والأخطاء الشائعة (Standard Error Responses)

```json
// 401 Unauthorized
{
  "success": false,
  "message": "غير مصرح بالوصول. التوكن غير صالح أو منتهي الصلاحية."
}

// 403 Forbidden
{
  "success": false,
  "message": "ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء."
}

// 500 Server Error
{
  "success": false,
  "message": "حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً."
}
```

---

## 🏫 الخطوة 1: إدارة تسكين وسجل تسجيل الطلاب الأكاديمي (`student_enrollments`) — [6 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لتسكين الطلاب:**
> 1. **قيد التسكين السنوي الفريد:** يمنع تسكين الطالب أكثر من مرة في نفس العام الدراسي (`uq_student_enrollment_year: student_id, academic_year_id`). عند محاولة تسكين طالب مسكن مسبقاً، يرجع الخادم خطأ `409 Conflict`.
> 2. **استخراج المستوى الأكاديمي تلقائياً:** يقوم الخادم بتلقيم حقل `grade_level` تلقائياً من الصف التابع له `classes.grade_level` دون الحاجة لإدخاله يدوياً.
> 3. **حماية التسكين المرجعي:** يمنع إزالة وتجريد تسكين طالب لديه درجات مرصودة بجدول `student_grades` (`ON DELETE RESTRICT`).

---

### 1.1 `GET /api/v1/student-enrollments` — عرض وتصفية وسجل تسكين الطلاب بالعام الدراسي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع مصفوفة تسكين الطلاب بالفصول والشعب للعام الدراسي النشط مع تصفية حسب الصف، الشعبة، حالة التسجيل، وأرقام الجلوس والترتيب والصفحات (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم الطالب، الكود الموحد `STU-XXXX`، أو رقم الجلوس `seating_number`.
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `class_id` (optional, bigint): تصفية حسب الصف الدراسي.
  - `class_section_id` (optional, bigint): تصفية حسب الشعبة الدراسية المحددة.
  - `status` (optional, string, enum: `enrolled`, `passed`, `second_round`, `failed`, `graduated`): تصفية بحسب الحالة الأكاديمية.
  - `sort_by` (optional, string, enum: `id`, `student_id`, `seating_number`, `created_at`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/student-enrollments?class_section_id=5&status=enrolled&sort_by=seating_number&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب مصفوفة تسكين الطلاب بنجاح.",
      "data": [
        {
          "id": 1,
          "academic_year_id": 1,
          "academic_year_name": "2025/2026",
          "student_id": 1,
          "student_code": "STU-3001",
          "student_name": "محمد علي الفيتوري",
          "class_id": 3,
          "class_name": "الصف الخامس",
          "grade_level": 5,
          "class_section_id": 5,
          "section_name": "شعبة أ",
          "seating_number": "SEAT-5001",
          "status": "enrolled",
          "created_at": "2026-08-29T10:00:00Z"
        },
        {
          "id": 2,
          "academic_year_id": 1,
          "academic_year_name": "2025/2026",
          "student_id": 2,
          "student_code": "STU-3002",
          "student_name": "فاطمة أحمد سالم",
          "class_id": 3,
          "class_name": "الصف الخامس",
          "grade_level": 5,
          "class_section_id": 5,
          "section_name": "شعبة أ",
          "seating_number": "SEAT-5002",
          "status": "enrolled",
          "created_at": "2026-08-29T10:05:00Z"
        }
      ],
      "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 2,
        "last_page": 1
      }
    }
    ```

---

### 1.2 `GET /api/v1/students/:student_id/enrollments` — عرض سجل التسكين والأرشيف الأكاديمي لطالب محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع السجل التاريخي لتسكين طالب محدد عبر كافة الأعوام الدراسية وتتبع ترفيعه وحالات النجاح والرسوب.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب السجل التسكيني للطالب بنجاح.",
      "data": [
        {
          "id": 25,
          "academic_year_id": 2,
          "academic_year_name": "2025/2026",
          "class_name": "الصف الخامس",
          "grade_level": 5,
          "section_name": "شعبة أ",
          "seating_number": "SEAT-5001",
          "status": "enrolled",
          "created_at": "2025-09-01T08:00:00Z"
        },
        {
          "id": 1,
          "academic_year_id": 1,
          "academic_year_name": "2024/2025",
          "class_name": "الصف الرابع",
          "grade_level": 4,
          "section_name": "شعبة ب",
          "seating_number": "SEAT-4015",
          "status": "passed",
          "created_at": "2024-09-01T08:00:00Z"
        }
      ]
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "سجل الطالب أو التسكين غير موجود."}`

---

### 1.3 `POST /api/v1/student-enrollments` — تسكين وتسجيل طالب في صف وشعبة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تسكين طالب في شعبة بالعام النشط وتوليد/إسناد رقم الجلوس، مع الفحص الذري بعدم تكرار التسكين للعام الحسابي (`uq_student_enrollment_year`).

- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "student_id": 3,
    "class_section_id": 5,
    "seating_number": "SEAT-5003"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم تسكين وتنسيق الطالب بالفصل والشعبة بنجاح.",
      "data": {
        "id": 3,
        "academic_year_id": 1,
        "student_id": 3,
        "student_code": "STU-3003",
        "student_name": "طارق زياد الورفلي",
        "class_id": 3,
        "class_name": "الصف الخامس",
        "grade_level": 5,
        "class_section_id": 5,
        "section_name": "شعبة أ",
        "seating_number": "SEAT-5003",
        "status": "enrolled",
        "created_at": "2026-08-29T12:00:00Z"
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "الطالب مسكن مسبقاً في هذا العام الدراسي (uq_student_enrollment_year)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "بيانات التسكين غير صالحة."}`

---

### 1.4 `PUT /api/v1/student-enrollments/:id` — تعديل بيانات التسكين ورقم الجلوس والحالة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** نقل الطالب لشعبة أخرى في نفس الصف، أو تحديث رقم الجلوس أو تحديث الحالة الأكاديمية (`enrolled`, `passed`, `second_round`, `failed`, `graduated`).

- **Request Body:**
  ```json
  {
    "class_section_id": 6,
    "seating_number": "SEAT-5003-UPDATED",
    "status": "enrolled"
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث بيانات التسكين ورقم الجلوس بنجاح.",
      "data": {
        "id": 3,
        "class_section_id": 6,
        "section_name": "شعبة ب",
        "seating_number": "SEAT-5003-UPDATED",
        "status": "enrolled"
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "سجل التسكين غير موجود."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "بيانات التعديل المدخلة غير صالحة."}`

---

### 1.5 `POST /api/v1/student-enrollments/bulk-enroll` — التسكين والتوزيع الجماعي للطلاب

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تسكين وتنسيق مجموعة طلاب دفعة واحدة في شعبة دراسية مخصصة بالعام النشط.

- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "class_section_id": 5,
    "student_ids": [4, 5, 6]
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم التسكين الجماعي لـ 3 طلاب بنجاح بالحدث الذري.",
      "data": {
        "enrolled_count": 3,
        "class_section_id": 5,
        "academic_year_id": 1
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "أحد الطلاب المسجلين بالدفعة مسكن مسبقاً بالعام الحالي."}`

---

### 1.6 `DELETE /api/v1/student-enrollments/:id` — إلغاء وتجريد تسكين طالب

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إلغاء سجل تسكين الطالب وحذف تخصيص الشعبة بشرط عدم وجود درجات مرصودة.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم إلغاء سجل التسكين وتجريد الطالب بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن إلغاء التسكين لارتباط الطالب بدرجات مرصودة بالسجل الأكاديمي (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل التسكين غير موجود."}`

# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 08 (Network SSoT)

> **الهدف:** توثيق المسارات الـ 6 كاملة لإدارة وتصفية جدول الامتحانات الرسمية (النصفية والنهائية والدور الثاني) مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
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

## 📝 الخطوة 1: إدارة جدول الامتحانات الرسمية (`official_exams`) — [6 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لـ الامتحانات الرسمية:**
> 1. **صلاحية الإدارة الحصرية (Strict Admin RBAC):** جدولة وإضافة وتعديل وحذف الامتحانات الرسمية (النصفية والنهائية والدور الثاني) مقتصرة **حصراً على مدير النظام** (`role_type = 'admin'`).
> 2. **القراءة العامة المقيدة (Read-Only Context):** يستعرض الطلاب والمعلمون وأولياء الأمور جدول الامتحانات الرسمية المخصص لصفوفهم وأبنائهم على نمط القراءة فقط دون إمكانية التعديل.
> 3. **قيد تفرد المادة بالنوع والسمستر (`uq_official_exam_schedule`):** يمنع تكرار جدولة امتحان رسمي لنفس المادة والصف والسمستر والنوع (مثال: يمنع وجود امتحانين نهائيين لنفس المادة للصف الخامس بالسمستر الأول). عند المخالفة يرجِع الخادم خطأ `409 Conflict`.

---

### 1.1 `GET /api/v1/official-exams` — عرض وتصفية قائمة الامتحانات الرسمية

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة سجلات جدول الامتحانات الرسمية بالمنظومة مع دعم الفلترة بالصف الدراسي `class_id` والمادة والسمستر ونوع الامتحان والتاريخ (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم المادة أو نوتس الامتحان (مثال: `الرياضيات` أو `القاعة الكبرى`).
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `academic_term_id` (optional, bigint): تصفية حسب الفصل الدراسي / السمستر.
  - `class_id` (optional, bigint): تصفية الامتحانات حسب الصف الدراسي (مثال: `الصف الخامس`).
  - `subject_id` (optional, bigint): تصفية الامتحانات حسب المادة الدراسية.
  - `exam_type` (optional, string, enum: `midterm`, `final`, `second_round`): تصفية حسب نوع الامتحان الرسمي.
  - `exam_date` (optional, date): تصفية حسب تاريخ اليوم الخادمي للامتحان (`YYYY-MM-DD`).
  - `sort_by` (optional, string, enum: `id`, `exam_date`, `created_at`, default `exam_date`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/official-exams?class_id=3&academic_term_id=1&exam_type=midterm&sort_by=exam_date&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب جدول الامتحانات الرسمية بنجاح.",
      "data": [
        {
          "id": 1,
          "academic_year_id": 1,
          "academic_term_id": 1,
          "term_name": "الفصل الدراسي الأول",
          "class_id": 3,
          "class_name": "الصف الخامس",
          "subject_id": 2,
          "subject_name": "الرياضيات",
          "exam_type": "midterm",
          "exam_type_ar": "امتحان نصفي",
          "exam_date": "2026-11-15",
          "notes": "الامتحان من الساعة 09:00 إلى 11:00 في القاعة الكبرى (ممنوع الآلة الحاسبة).",
          "created_at": "2026-10-20T08:00:00Z"
        },
        {
          "id": 2,
          "academic_year_id": 1,
          "academic_term_id": 1,
          "term_name": "الفصل الدراسي الأول",
          "class_id": 3,
          "class_name": "الصف الخامس",
          "subject_id": 4,
          "subject_name": "اللغة العربية",
          "exam_type": "midterm",
          "exam_type_ar": "امتحان نصفي",
          "exam_date": "2026-11-17",
          "notes": "الامتحان من الساعة 09:00 إلى 11:00 بقاعات الصف الخامس.",
          "created_at": "2026-10-20T08:30:00Z"
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

### 1.2 `GET /api/v1/official-exams/:id` — عرض تفاصيل امتحان رسمي محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع البيانات التفصيلية والتوجيهات الخاصة بسجل امتحان رسمي محدد.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تفاصيل الامتحان الرسمي بنجاح.",
      "data": {
        "id": 1,
        "academic_year_id": 1,
        "academic_term_id": 1,
        "term_name": "الفصل الدراسي الأول",
        "class_id": 3,
        "class_name": "الصف الخامس",
        "subject_id": 2,
        "subject_name": "الرياضيات",
        "exam_type": "midterm",
        "exam_type_ar": "امتحان نصفي",
        "exam_date": "2026-11-15",
        "notes": "الامتحان من الساعة 09:00 إلى 11:00 في القاعة الكبرى (ممنوع الآلة الحاسبة).",
        "created_at": "2026-10-20T08:00:00Z"
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "سجل الامتحان الرسمي غير موجود."}`

---

### 1.3 `GET /api/v1/classes/:class_id/official-exams` — عرض جدول الامتحانات الرسمية لصف دراسي محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع جدول الامتحانات المعتمد بالكامل لصف دراسي محدد (مثل: جدول امتحانات الصف الخامس النصفية) بالسمستر النشط مع إرجاع 3 أمثلة حقيقية متكاملة.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب جدول امتحانات الصف الدراسي بنجاح.",
      "data": {
        "class_id": 3,
        "class_name": "الصف الخامس",
        "academic_term_name": "الفصل الدراسي الأول",
        "total_exams": 3,
        "exams": [
          {
            "id": 1,
            "subject_id": 2,
            "subject_name": "الرياضيات",
            "exam_type": "midterm",
            "exam_type_ar": "امتحان نصفي",
            "exam_date": "2026-11-15",
            "notes": "الامتحان من 09:00 إلى 11:00 بالقاعة الكبرى."
          },
          {
            "id": 2,
            "subject_id": 4,
            "subject_name": "اللغة العربية",
            "exam_type": "midterm",
            "exam_type_ar": "امتحان نصفي",
            "exam_date": "2026-11-17",
            "notes": "الامتحان من 09:00 إلى 11:00 بالقاعة 5أ و 5ب."
          },
          {
            "id": 3,
            "subject_id": 6,
            "subject_name": "العلوم العامة",
            "exam_type": "midterm",
            "exam_type_ar": "امتحان نصفي",
            "exam_date": "2026-11-19",
            "notes": "الامتحان يشمل الجانب النظري والتجريبي المختبري."
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`

---

### 1.4 `POST /api/v1/official-exams` — إضافة وجدولة امتحان رسمي جديد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** اعتماد وجدولة موعد امتحان رسمي جديد مخصص لصف ومادة بالسمستر (مقتصر على الإدارة)، مع التحقق من عدم تكرار `uq_official_exam_schedule`.

- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "academic_term_id": 1,
    "class_id": 3,
    "subject_id": 2,
    "exam_type": "midterm",
    "exam_date": "2026-11-15",
    "notes": "الامتحان من الساعة 09:00 إلى 11:00 في القاعة الكبرى (ممنوع الآلة الحاسبة)."
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إضافة وجدولة الامتحان الرسمي بنجاح.",
      "data": {
        "id": 1,
        "academic_year_id": 1,
        "academic_term_id": 1,
        "class_id": 3,
        "subject_id": 2,
        "exam_type": "midterm",
        "exam_date": "2026-11-15",
        "notes": "الامتحان من الساعة 09:00 إلى 11:00 في القاعة الكبرى (ممنوع الآلة الحاسبة).",
        "created_at": "2026-10-20T08:00:00Z"
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "يوجد امتحان رسمي مجدول مسبقاً لهذه المادة والصف بنفس السمستر ونوع الامتحان (uq_official_exam_schedule)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من مدخلات جدولة الامتحان الرسمي."}`

---

### 1.5 `PUT /api/v1/official-exams/:id` — تعديل موعد أو تعليمات امتحان رسمي قائم

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث تاريخ يوم الامتحان أو النوتس والتعليمات الخاصة بالامتحان الرسمي.

- **Request Body:**
  ```json
  {
    "exam_date": "2026-11-16",
    "notes": "تم تعديل الموعد إلى يوم الاثنين من الساعة 09:00 إلى 11:00 بالقاعة الكبرى."
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث موعد الامتحان الرسمي بنجاح.",
      "data": {
        "id": 1,
        "exam_date": "2026-11-16",
        "notes": "تم تعديل الموعد إلى يوم الاثنين من الساعة 09:00 إلى 11:00 بالقاعة الكبرى."
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "سجل الامتحان الرسمي غير موجود."}`
  - **`409 Conflict`:** `{"success": false, "message": "تعارض؛ الموعد أو المادة مجدولة مسبقاً بسجل آخر."}`

---

### 1.6 `DELETE /api/v1/official-exams/:id` — إلغاء وحذف امتحان رسمي من الجدول

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** حذف وإلغاء امتحان رسمي منطقياً من الجدول المعتمد مع توثيق العملية بسجل التدقيق `audit_logs`.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الامتحان الرسمي من الجدول بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "غير مصرح لك بحذف الامتحانات الرسمية (مقتصر على مدير النظام)."}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل الامتحان الرسمي غير موجود."}`

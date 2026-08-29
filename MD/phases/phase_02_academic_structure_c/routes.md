# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-C (Network SSoT)

> **الهدف:** توثيق المسارات الـ 11 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دعم البحث والتصفية والفرز والتقسيم الصفحي (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف (`routes.md`) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/academic`
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

## 🗓️ الخطوة 1: إدارة تواريخ وتخطيط فترات الصفوف (`class_academic_terms`) — [4 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لخطوة فترات الصفوف:**
> 1. **التواريخ المستقلة للصفوف:** يُحدد تقويم الوزارة وتواريخ الفترات (`start_date`, `end_date`) لكل صف دراسي بشكل مستقل لتلبية تفاوت تقويم الصفوف الانتقالية وصفوف الشهادات (الصف 9 والصف 12).
> 2. **الفترة النشطة الوحيدة:** يضم كل صف بالعام فترة نشطة واحدة فقط (`is_active = 1`) لتوجيه العمليات اليومية وإدخال الدرجات.
> 3. **إغلاق الفترات للأرشفة:** عند انتهاء الفترة وإغلاق درجاتها (`is_closed = 1`) تُحفظ الدرجات نهائياً وتصبح للأرشفة والعرض فقط دون تداخل مع الفترات التالية.

---

### 1.1 `GET /api/v1/academic/years/:academic_year_id/classes/:class_id/terms` — عرض قائمة وبحث فترات وتواريخ صف بالعام

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع فترات وتواريخ وتقويم صف دراسي محدد بالعام الدراسي مع دعم البحث باسم الفترة، التصفية بالحالة النشطة والمغلقة، الترتيب والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي بمسمى الفترة (مثال: `الفصل الأول`).
  - `is_active` (optional, integer: `0` أو `1`): فلترة حسب الفترة النشطة حالياً.
  - `is_closed` (optional, integer: `0` أو `1`): فلترة حسب الفترة المغلقة.
  - `sort_by` (optional, string, enum: `id`, `start_date`, `end_date`, `academic_term_id`, default `start_date`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/academic/years/1/classes/9/terms?search=الفصل&is_active=1&sort_by=start_date&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب فترات الصف الدراسي بالعام بنجاح.",
      "data": [
        { "id": 10, "academic_year_id": 1, "academic_year_name": "2025/2026", "class_id": 9, "class_name": "الصف التاسع", "academic_term_id": 1, "term_name": "الفصل الأول", "start_date": "2025-09-01", "end_date": "2025-12-31", "is_active": 1, "is_closed": 0 },
        { "id": 11, "academic_year_id": 1, "academic_year_name": "2025/2026", "class_id": 9, "class_name": "الصف التاسع", "academic_term_id": 2, "term_name": "الفصل الثاني", "start_date": "2026-01-05", "end_date": "2026-04-15", "is_active": 0, "is_closed": 0 },
        { "id": 12, "academic_year_id": 1, "academic_year_name": "2025/2026", "class_id": 9, "class_name": "الصف التاسع", "academic_term_id": 3, "term_name": "الفصل الثالث", "start_date": "2026-04-20", "end_date": "2026-07-15", "is_active": 0, "is_closed": 0 }
      ],
      "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 3,
        "last_page": 1
      }
    }
    ```

---

### 1.2 `POST /api/v1/academic/class-academic-terms` — تخصيص وتخطيط فترة وتواريخ لصف

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تخصيص فترة وتواريخ رسمية لصف بالعام الدراسي طبق تقويم الوزارة (مثال: 3 فترات لصف 9 و 12، وفترتان لصف 5 و 6).

- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "class_id": 9,
    "academic_term_id": 1,
    "start_date": "2025-09-01",
    "end_date": "2025-12-31"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم تخصيص الفترة وتواريخ التقويم للصف بنجاح.",
      "data": {
        "id": 10,
        "academic_year_id": 1,
        "academic_year_name": "2025/2026",
        "class_id": 9,
        "class_name": "الصف التاسع",
        "academic_term_id": 1,
        "term_name": "الفصل الأول",
        "start_date": "2025-09-01",
        "end_date": "2025-12-31",
        "is_active": 0,
        "is_closed": 0
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "هذه الفترة مخصصة مسبقاً لهذا الصف بالعام الدراسي (uq_class_term_year)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "تاريخ بداية ونهاية الفترة يجب أن يكون ضمن النطاق الزمني للعام الدراسي."}`

---

### 1.3 `POST /api/v1/academic/class-academic-terms/:id/activate` — تفعيل الفترة النشطة للصف

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تفعيل الفترة الحالية النشطة لهذا الصف بالذات وإلغاء تفعيل الفترات الأخرى لنفس الصف بالعام بحركة ذرية atomic.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تفعيل الفترة النشطة للصف الدراسي بنجاح.",
      "data": { "id": 10, "class_id": 9, "is_active": 1 }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "تخصيص فترة الصف غير موجود."}`

---

### 1.4 `POST /api/v1/academic/class-academic-terms/:id/close` — إغلاق/فتح درجات الفترة للصف

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تغيير حالة إغلاق درجات الفترة للصف (`is_closed = 1`).

- **Request Body:**
  ```json
  {
    "is_closed": 1
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تمت تغيير حالة إغلاق درجات الفترة للصف بنجاح.",
      "data": { "id": 10, "is_closed": 1 }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "تخصيص فترة الصف غير موجود."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "حقل is_closed يجب أن يكون 0 أو 1."}`

---

## 🧩 الخطوة 2: إدارة ربط وتسكين الشُعب بالصفوف (`class_sections`) — [3 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لخطوة تسكين الشعب:**
> 1. **فتح الشعب بصفوف العام:** يتم تسكين الشعب المعتمدة من بنك الشعب العامة (مثل شعبة أ، شعبة ب) لكل صف دراسي مفتوح بالعام.
> 2. **حظر الحذف المرتبط:** يمنع فك ربط الشعبة من صف إذا وجد طلاب مسجلون بتلك الشعبة في جدول تسكين الطلاب (`student_enrollments`).

---

### 2.1 `GET /api/v1/academic/classes/:class_id/sections` — عرض قائمة وبحث شعب صف مفتوحة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة كافة الشعب المفتوحة والمخصصة لصف دراسي محدد مع دعم البحث النصي باسم الشعبة، الترتيب، والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم الشعبة (مثال: `شعبة أ`).
  - `sort_by` (optional, string, enum: `id`, `section_id`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/academic/classes/5/sections?search=أ&sort_by=id&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب الشعب المفتوحة للصف بنجاح.",
      "data": [
        { "id": 1, "class_id": 5, "class_name": "الصف الخامس", "section_id": 1, "section_name": "شعبة أ" },
        { "id": 2, "class_id": 5, "class_name": "الصف الخامس", "section_id": 2, "section_name": "شعبة ب" }
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

### 2.2 `POST /api/v1/academic/class-sections` — تسكين/ربط شعبة بصف

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** فتح وتسكين شعبة عامة لصف دراسي بالعام الدراسي.

- **Request Body:**
  ```json
  {
    "class_id": 5,
    "section_id": 1
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم فتح وتسكين الشعبة للصف بنجاح.",
      "data": { "id": 1, "class_id": 5, "class_name": "الصف الخامس", "section_id": 1, "section_name": "شعبة أ" }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "الشعبة مفتوحة ومسندة مسبقاً لهذا الصف."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "الصف الدراسي أو الشعبة غير موجودة."}`

---

### 2.3 `DELETE /api/v1/academic/class-sections/:id` — فك ربط شعبة من صف

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إلغاء تسكين شعبة من صف بشرط عدم وجود طلاب تسكين مسبق بها.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم فك ربط الشعبة من الصف بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن فك ربط الشعبة لوجود طلاب مسجلين بها (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل تسكين الشعبة غير موجود."}`

---

## 📝 الخطوة 3: إدارة مناهج الصفوف والدرجات لكل فترة (`class_subjects`) — [4 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لخطوة مناهج الصفوف:**
> 1. **استقلالية درجات السمستر:** يتم تعيين درجة النجاح الصغرى `passing_score` والدرجة العظمى `max_score` لكل مادة في كل فصل دراسي على حدة.
> 2. **قيد قياس الدرجات:** يجب استيفاء قيد النزاهة الإجباري (`passing_score <= max_score`).
> 3. **حماية التغييرات بالفصل المغلق:** يمنع تعديل أو إزالة المناهج والدرجات إذا كانت الفترة مقفلة للأرشفة (`is_closed = 1`).

---

### 3.1 `GET /api/v1/academic/classes/:class_id/subjects` — عرض قائمة وبحث منهج الصف بالفترة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع تفاصيل منهج الصف الدراسي والمواد المقررة بالفترة مع دعم البحث باسم المادة أو الكود، الترتيب، والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `class_academic_term_id` (required, bigint): معرف تخصيص فترة الصف الحالية.
  - `search` (optional, string): البحث النصي باسم المادة أو كود المادة (مثال: `الرياضيات` أو `MATH`).
  - `sort_by` (optional, string, enum: `id`, `passing_score`, `max_score`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/academic/classes/5/subjects?class_academic_term_id=10&search=MATH&sort_by=id&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب منهج الصف بالفترة الدراسية بنجاح.",
      "data": [
        { "id": 12, "class_id": 5, "class_name": "الصف الخامس", "subject_id": 1, "subject_name": "الرياضيات", "subject_code": "MATH", "class_academic_term_id": 10, "term_name": "الفصل الأول", "academic_year_name": "2025/2026", "passing_score": "50.00", "max_score": "100.00" },
        { "id": 13, "class_id": 5, "class_name": "الصف الخامس", "subject_id": 2, "subject_name": "العلوم", "subject_code": "SCI", "class_academic_term_id": 10, "term_name": "الفصل الأول", "academic_year_name": "2025/2026", "passing_score": "50.00", "max_score": "100.00" }
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

### 3.2 `POST /api/v1/academic/classes/:class_id/subjects` — إسناد مادة لصف وتحديد درجات الفترة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إسناد مادة تعليمية لمنهج صف دراسي محدد وتعيين الدرجة الكلية العظمى ودرجة النجاح الخاصة بالسمستر.

- **Request Body:**
  ```json
  {
    "subject_id": 1,
    "class_academic_term_id": 10,
    "passing_score": 50.00,
    "max_score": 100.00
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إسناد المادة وتحديد درجات الفصل الدراسي بنجاح.",
      "data": { "id": 12, "class_id": 5, "subject_id": 1, "class_academic_term_id": 10, "passing_score": "50.00", "max_score": "100.00" }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "المادة مضافة ومقررة مسبقاً لهذا الصف في هذا الفصل الدراسي (uq_class_term_subject)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "درجة النجاح يجب أن تكون أقل من أو تساوي الدرجة العظمى."}`

---

### 3.3 `PUT /api/v1/academic/classes/:class_id/subjects/:id` — تعديل درجات مادة بالفترة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث الدرجة الكلية العظمى أو درجة النجاح المقررة للمادة في هذا السمستر.

- **Request Body:**
  ```json
  {
    "passing_score": 60.00,
    "max_score": 100.00
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث درجات المادة للفترة بنجاح.",
      "data": { "id": 12, "passing_score": "60.00", "max_score": "100.00" }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "سجل مادة الصف غير موجود."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من مدخلات الدرجات."}`

---

### 3.4 `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id` — إزالة مادة من منهج فترة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إلغاء مقرر مادة من منهج فترة الصف بالعام الدراسي.

- **Query Parameters:** `class_academic_term_id` (required, bigint)
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تمت إزالة المادة من منهج الفصل الدراسي بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن إزالة المادة لوجود درجات أو تكليفات مرتبطة (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "المادة غير موجودة بملاحظات منهج الصف."}`

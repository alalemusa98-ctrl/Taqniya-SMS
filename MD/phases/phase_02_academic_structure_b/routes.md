# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 12 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دعم البحث والتصفية والفرز والتقسيم الصفحي (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
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

## 🏫 الخطوة 1: إدارة الصفوف وتحديد تبعيتها للمراحل (`classes`) — [4 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لخطوة الصفوف الدراسية:**
> 1. **تسكين الصف بمرحلة:** يقوم المستخدم باختيار المرحلة التعليمية (`stage_id`) وتحديد اسم الصف والترتيب الرقمي للترحيل (`grade_level` من 1 إلى 12).
> 2. **قيد التوافق:** يمنع تكرار `grade_level` بنفس المرحلة التعليمية (`uq_classes_stage_level`).
> 3. **إرجاع الـ API:** يتضمن كائن الـ `data` في الاستجابة اسم المرحلة `stage_name` لتسهيل العرض المباشر بالواجهات.

---

### 1.1 `GET /api/v1/academic/classes` — عرض قائمة وبحث صفوف المراحل

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة الصفوف الدراسية المضافة بالمنظومة مع دعم البحث النصي باسم الصف، التصفية بالمرحلة التعليمية (`stage_id`) والمستوى الرقمي (`grade_level`)، الترتيب والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم الصف (مثال: `الخامس`).
  - `stage_id` (optional, integer): تصفية الصفوف التابعة لمرحلة تعليمية معينة.
  - `grade_level` (optional, integer): تصفية الصفوف بحسب الترتيب الأكاديمي الرقمي (مثال: `5`, `6`).
  - `sort_by` (optional, string, enum: `id`, `name`, `grade_level`, `stage_id`, default `grade_level`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/academic/classes?search=الخامس&stage_id=1&sort_by=grade_level&sort_order=asc&page=1&per_page=15`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة الصفوف الدراسية بنجاح.",
      "data": [
        { "id": 5, "stage_id": 1, "stage_name": "المرحلة الابتدائية", "name": "الصف الخامس", "grade_level": 5 },
        { "id": 6, "stage_id": 1, "stage_name": "المرحلة الابتدائية", "name": "الصف السادس", "grade_level": 6 }
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

### 1.2 `POST /api/v1/academic/classes` — إنشاء صف دراسي وتسكينه بمرحلة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إضافة صف دراسي جديد وتحديد تبعيته للمرحلة التعليمية والترتيب الرقمي للترحيل (`grade_level`).

- **Request Body:**
  ```json
  {
    "stage_id": 1,
    "name": "الصف الخامس",
    "grade_level": 5
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إنشاء الصف الدراسي وتسكينه بالمرحلة بنجاح.",
      "data": { "id": 5, "stage_id": 1, "stage_name": "المرحلة الابتدائية", "name": "الصف الخامس", "grade_level": 5, "created_at": "2026-08-29T12:00:00Z" }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "ترتيب grade_level مكرر داخل نفس المرحلة التعليمية (uq_classes_stage_level)."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من البيانات.",
      "errors": { "stage_id": ["المرحلة التعليمية المختارة غير موجودة."] }
    }
    ```

---

### 1.3 `PUT /api/v1/academic/classes/:id` — تعديل بيانات صف دراسي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث مسمى الصف الدراسي أو المرحلة المرتبط بها أو الترتيب الرقمي.

- **Request Body:**
  ```json
  {
    "stage_id": 1,
    "name": "الصف الخامس الابتدائي",
    "grade_level": 5
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث الصف الدراسي بنجاح.",
      "data": { "id": 5, "stage_id": 1, "stage_name": "المرحلة الابتدائية", "name": "الصف الخامس الابتدائي", "grade_level": 5 }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`
  - **`409 Conflict`:** `{"success": false, "message": "تضارب في الترتيب الأكاديمي لمجموعات الصفوف."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من بيانات الصف المدخلة."}`

---

### 1.4 `DELETE /api/v1/academic/classes/:id` — حذف صف دراسي غير مرتبط

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** حذف صف دراسي بشرط عدم وجود شعب مفتوحة أو فترات أو مناهج مرتبطة به.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الصف الدراسي بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف الصف الدراسي لارتباطه بشعب مفتوحة أو مناهج مسندة (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي المراد حذفه غير موجود."}`

---

## 🔠 الخطوة 2: إدارة بنك الشُعب العامة (`sections`) — [4 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لخطوة بنك الشعب:**
> 1. **كتالوج الشعب العامة:** مسميات الشعب المعتمدة بالمدرسة تُعرف لمرة واحدة في بنك الشعب العامة (مثل شعبة أ، شعبة ب).
> 2. **حماية الحذف:** يمنع حذف الشعبة العامة إذا كانت مسندة لصفوف في `class_sections` (`ON DELETE RESTRICT`).

---

### 2.1 `GET /api/v1/academic/sections` — عرض قائمة وبحث بنك الشعب العامة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع كتالوج أسماء الشعب المعيارية العامة (Master Sections) مع دعم البحث النصي، الترتيب، والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي بمسمى الشعبة (مثال: `شعبة أ`).
  - `sort_by` (optional, string, enum: `id`, `name`, default `name`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/academic/sections?search=أ&sort_by=name&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب بنك الشعب العامة بنجاح.",
      "data": [
        { "id": 1, "name": "شعبة أ" },
        { "id": 2, "name": "شعبة ب" },
        { "id": 3, "name": "شعبة ج" }
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

### 2.2 `POST /api/v1/academic/sections` — إنشاء شعبة عامة جديدة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إضافة مسمى شعبة عامة جديدة لكتالوج الشعب بالمدرسة.

- **Request Body:**
  ```json
  {
    "name": "شعبة أ"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إنشاء الشعبة العامة بنجاح.",
      "data": { "id": 1, "name": "شعبة أ" }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "مسمى الشعبة العامة مسجل مسبقاً (uq_sections_name)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "حقل اسم الشعبة مطلوب."}`

---

### 2.3 `PUT /api/v1/academic/sections/:id` — تعديل مسمى شعبة عامة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث مسمى الشعبة العامة في كتالوج الشعب.

- **Request Body:**
  ```json
  {
    "name": "شعبة أ العامة"
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث مسمى الشعبة العامة بنجاح.",
      "data": { "id": 1, "name": "شعبة أ العامة" }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الشعبة العامة غير موجودة."}`
  - **`409 Conflict`:** `{"success": false, "message": "مسمى الشعبة العامة مستخدم مسبقاً."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "بيانات التحديث غير صالحة."}`

---

### 2.4 `DELETE /api/v1/academic/sections/:id` — حذف شعبة عامة غير مستخدمة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** حذف مسمى شعبة عامة بشرط عدم تسكينها بصف في `class_sections`.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الشعبة العامة بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف الشعبة العامة لاستخدامها في صفوف دراسية (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "الشعبة العامة المراد حذفها غير موجودة."}`

---

## 📖 الخطوة 3: إدارة بنك المواد الدراسية العامة (`subjects`) — [4 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لخطوة بنك المواد:**
> 1. **كتالوج المواد العام:** المواد التعليمية وكودها الرمزي تُعرف لمرة واحدة ببنك مواد المدرسة (مثل الرياضيات `MATH`).
> 2. **حماية الحذف:** يمنع حذف المادة العامة من البنك إذا كانت مسندة بمناهج الصفوف في `class_subjects` (`ON DELETE RESTRICT`).

---

### 3.1 `GET /api/v1/academic/subjects` — عرض قائمة وبحث بنك المواد العامة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع الكتالوج العام لكافة المواد والمناهج المعتمدة في بنك مواد المدرسة (Master Catalog) مع دعم البحث النصي باسم المادة أو الكود، الترتيب، والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم المادة أو كود المادة (مثال: `الرياضيات` أو `MATH`).
  - `code` (optional, string): فلترة مباشرة بحسب الكود الرمزي للمادة.
  - `sort_by` (optional, string, enum: `id`, `name`, `code`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/academic/subjects?search=MATH&sort_by=name&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب بنك المواد العامة بنجاح.",
      "data": [
        { "id": 1, "name": "الرياضيات", "code": "MATH" },
        { "id": 2, "name": "العلوم", "code": "SCI" },
        { "id": 3, "name": "اللغة العربية", "code": "ARAB" }
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

### 3.2 `POST /api/v1/academic/subjects` — إضافة مادة جديدة لبنك المواد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إضافة مادة جديدة وكودها الرمزي لكتالوج المواد العام بالمدرسة.

- **Request Body:**
  ```json
  {
    "name": "الرياضيات",
    "code": "MATH"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تمت إضافة المادة لبنك المواد بنجاح.",
      "data": { "id": 1, "name": "الرياضيات", "code": "MATH" }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "اسم المادة أو الرمز الكودي مسجل مسبقاً."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من مدخلات المادة."}`

---

### 3.3 `PUT /api/v1/academic/subjects/:id` — تعديل مادة ببنك المواد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث بيانات مادة قائمة في بنك المواد (الاسم أو الكود).

- **Request Body:**
  ```json
  {
    "name": "الرياضيات العامة",
    "code": "MATH-GEN"
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث المادة بنجاح.",
      "data": { "id": 1, "name": "الرياضيات العامة", "code": "MATH-GEN" }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "المادة غير موجودة."}`
  - **`409 Conflict`:** `{"success": false, "message": "اسم المادة أو الكود الرمزي مستخدم مسبقاً."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "بيانات التحديث المدخلة غير صالحة."}`

---

### 3.4 `DELETE /api/v1/academic/subjects/:id` — حذف مادة عامة غير مسندة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** حذف مادة من الكتالوج العام بشرط عدم تسكينها بصفوف في `class_subjects`.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف المادة من البنك بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف المادة لإسنادها في مناهج وصفوف دراسية (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "المادة المراد حذفها غير موجودة بالبنك."}`

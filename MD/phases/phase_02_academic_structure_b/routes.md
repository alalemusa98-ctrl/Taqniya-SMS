# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 12 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) كأمثلة صريحة لتوضيح شكل المصفوفة مع الترقيم المالي القياسي (`Pagination Meta`).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف (`routes.md`) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/academic`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Accept: application/json`, `Content-Type: application/json`

---

## 🏫 الخطوة 1: إدارة الصفوف وتحديد تبعيتها للمراحل (`classes`) — [4 مسارات]

---

### 1.1 `GET /api/v1/academic/classes` — عرض صفوف مرحلة معينة
- **الوصف الوظيفي للرابط:** استرجاع قائمة كافة الصفوف الدراسية المضافة بالمنظومة أو تصفيتها بحسب المرحلة التعليمية (`stage_id`) مع أسماء المراحل التابعة لها.
- **Query Parameters:** `stage_id` (optional, bigint), `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
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
  - **`401 Unauthorized`:** `{"success": false, "message": "Unauthenticated access."}`
  - **`500 Server Error`:** `{"success": false, "message": "خطأ خادم داخلي."}`

---

### 1.2 `POST /api/v1/academic/classes` — إنشاء صف دراسي وتسكينه بمرحلة
- **الوصف الوظيفي للرابط:** إضافة صف دراسي جديد وتحديد تبعيته للمرحلة التعليمية والترتيب الرقمي للترحيل (`grade_level`).
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
      "data": { "id": 5, "stage_id": 1, "name": "الصف الخامس", "grade_level": 5, "created_at": "2026-08-29T12:00:00Z" }
    }
    ```
  - **`400 Bad Request`:** `{"success": false, "message": "Malformed JSON payload."}`
  - **`401 Unauthorized`:** `{"success": false, "message": "Unauthenticated access."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا تملك صلاحية الإدارة."}`
  - **`409 Conflict`:** `{"success": false, "message": "ترتيب grade_level مكرر داخل نفس المرحلة التعليمية (uq_classes_stage_level)."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من البيانات.",
      "errors": { "stage_id": ["المرحلة التعليمية المختارة غير موجودة."] }
    }
    ```
  - **`500 Server Error`:** `{"success": false, "message": "خطأ خادم داخلي."}`

---

### 1.3 `PUT /api/v1/academic/classes/:id` — تعديل بيانات صف دراسي
- **الوصف الوظيفي للرابط:** تحديث مسمى الصف الدراسي أو المرحلية المرتبط بها أو الترتيب الرقمي.
- **Request Body:**
  ```json
  { "stage_id": 1, "name": "الصف الخامس الابتدائي", "grade_level": 5 }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث الصف الدراسي بنجاح.", "data": { "id": 5, "stage_id": 1, "name": "الصف الخامس الابتدائي", "grade_level": 5 }}`
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`
  - **`409 Conflict`:** `{"success": false, "message": "تضارب في الترتيب الأكاديمي لمجموعات الصفوف."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق."}`

---

### 1.4 `DELETE /api/v1/academic/classes/:id` — حذف صف دراسي غير مرتبط
- **الوصف الوظيفي للرابط:** حذف صف دراسي بشرط عدم وجود شعب مفتوحة أو فترات أو مناهج مرتبطة به.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الصف الدراسي بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف الصف الدراسي لارتباطه بشعب مفتوحة أو مناهج مسندة (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`

---

## 🔠 الخطوة 2: إدارة بنك الشُعب العامة (`sections`) — [4 مسارات]

---

### 2.1 `GET /api/v1/academic/sections` — عرض بنك الشعب العامة
- **الوصف الوظيفي للرابط:** استرجاع كتالوج أسماء الشعب المعيارية العامة لمرة واحدة (Master Sections) بصيغة موجزة متعددة العناصر.
- **Query Parameters:** `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
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
- **الوصف الوظيفي للرابط:** إضافة مسمى شعبة عامة جديدة لكتالوج الشعب بالمدرسة.
- **Request Body:**
  ```json
  { "name": "شعبة أ" }
  ```
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تم إنشاء الشعبة العامة بنجاح.", "data": { "id": 1, "name": "شعبة أ" }}`
  - **`409 Conflict`:** `{"success": false, "message": "مسمى الشعبة العامة مسجل مسبقاً (uq_sections_name)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "حقل الاسم مطلوب."}`

---

### 2.3 `PUT /api/v1/academic/sections/:id` — تعديل مسمى شعبة عامة
- **الوصف الوظيفي للرابط:** تحديث مسمى الشعبة العامة في كتالوج الشعب.
- **Request Body:**
  ```json
  { "name": "شعبة أ العامة" }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث مسمى الشعبة العامة بنجاح."}`
  - **`404 Not Found`:** `{"success": false, "message": "الشعبة العامة غير موجودة."}`

---

### 2.4 `DELETE /api/v1/academic/sections/:id` — حذف شعبة عامة غير مستخدمة
- **الوصف الوظيفي للرابط:** حذف مسمى شعبة عامة بشرط عدم تسكينها بصف في `class_sections`.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الشعبة العامة بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف الشعبة العامة لاستخدامها في صفوف دراسية (RESTRICT)."}`

---

## 📖 الخطوة 3: إدارة بنك المواد الدراسية العامة (`subjects`) — [4 مسارات]

---

### 3.1 `GET /api/v1/academic/subjects` — عرض بنك المواد العامة
- **الوصف الوظيفي للرابط:** استرجاع الكتالوج العام لكافة المواد والمناهج المعتمدة في بنك مواد المدرسة (Master Catalog) بصيغة موجزة متعددة العناصر.
- **Query Parameters:** `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
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
- **الوصف الوظيفي للرابط:** إضافة مادة جديدة وكودها الرمزي لكتالوج المواد العام بالمدرسة.
- **Request Body:**
  ```json
  {
    "name": "الرياضيات",
    "code": "MATH"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تمت إضافة المادة لبنك المواد بنجاح.", "data": { "id": 1, "name": "الرياضيات", "code": "MATH" }}`
  - **`409 Conflict`:** `{"success": false, "message": "اسم المادة أو الرمز الكودي مسجل مسبقاً."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من مدخلات المادة."}`

---

### 3.3 `PUT /api/v1/academic/subjects/:id` — تعديل مادة ببنك المواد
- **الوصف الوظيفي للرابط:** تحديث بيانات مادة قائمة في بنك المواد (الاسم أو الكود).
- **Request Body:**
  ```json
  { "name": "الرياضيات العامة", "code": "MATH-GEN" }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث المادة بنجاح."}`
  - **`404 Not Found`:** `{"success": false, "message": "المادة غير موجودة."}`

---

### 3.4 `DELETE /api/v1/academic/subjects/:id` — حذف مادة عامة غير مسندة
- **الوصف الوظيفي للرابط:** حذف مادة من الكتالوج العام بشرط عدم تسكينها بصفوف في `class_subjects`.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف المادة من البنك بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف المادة لإسنادها في مناهج وصفوف دراسية (RESTRICT)."}`

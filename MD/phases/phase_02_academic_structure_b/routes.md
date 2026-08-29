# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 12 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطلوب، بما يطابق حقول قاعدة البيانات في [`MD/database/database_phase_02.md`](../../database/database_phase_02.md) (`stage_id`, `grade_level`).

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/academic`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Accept: application/json`, `Content-Type: application/json`

---

## 🏫 الخطوة 4: إدارة الصفوف وتحديد تبعيتها للمراحل (`classes`) — [4 مسارات]

---

### 4.1 `GET /api/v1/academic/classes` — عرض صفوف مرحلة معينة
- **Query Parameters:** `stage_id` (optional, bigint), `per_page` (optional, default 15)
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة الصفوف الدراسية بنجاح.",
      "data": [
        { "id": 5, "stage_id": 1, "name": "الصف الخامس", "grade_level": 5, "created_at": "2025-08-01T10:00:00Z" }
      ],
      "meta": { "total": 1, "page": 1, "per_page": 15 }
    }
    ```
  - **`401 Unauthorized`:** `{"success": false, "message": "Unauthenticated access."}`
  - **`500 Server Error`:** `{"success": false, "message": "خطأ خادم داخلي."}`

---

### 4.2 `POST /api/v1/academic/classes` — إنشاء صف دراسي وتسكينه بمرحلة
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

### 4.3 `PUT /api/v1/academic/classes/:id` — تعديل بيانات صف دراسي
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

### 4.4 `DELETE /api/v1/academic/classes/:id` — حذف صف دراسي غير مرتبط
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الصف الدراسي بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف الصف الدراسي لارتباطه بشعب مفتوحة أو مناهج مسندة (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`

---

## 🔠 الخطوة 5: إدارة بنك الشُعب العامة (`sections`) — [4 مسارات]

---

### 5.1 `GET /api/v1/academic/sections` — عرض بنك الشعب العامة
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب بنك الشعب العامة بنجاح.",
      "data": [
        { "id": 1, "name": "شعبة أ" },
        { "id": 2, "name": "شعبة ب" }
      ]
    }
    ```

---

### 5.2 `POST /api/v1/academic/sections` — إنشاء شعبة عامة جديدة
- **Request Body:**
  ```json
  { "name": "شعبة أ" }
  ```
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تم إنشاء الشعبة العامة بنجاح.", "data": { "id": 1, "name": "شعبة أ" }}`
  - **`409 Conflict`:** `{"success": false, "message": "مسمى الشعبة العامة مسجل مسبقاً (uq_sections_name)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "حقل الاسم مطلوب."}`

---

### 5.3 `PUT /api/v1/academic/sections/:id` — تعديل مسمى شعبة عامة
- **Request Body:**
  ```json
  { "name": "شعبة أ العامة" }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث مسمى الشعبة العامة بنجاح."}`
  - **`404 Not Found`:** `{"success": false, "message": "الشعبة العامة غير موجودة."}`

---

### 5.4 `DELETE /api/v1/academic/sections/:id` — حذف شعبة عامة غير مستخدمة
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الشعبة العامة بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف الشعبة العامة لاستخدامها في صفوف دراسية (RESTRICT)."}`

---

## 📖 الخطوة 6: إدارة بنك المواد الدراسية العامة (`subjects`) — [4 مسارات]

---

### 6.1 `GET /api/v1/academic/subjects` — عرض بنك المواد العامة
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب بنك المواد العامة بنجاح.",
      "data": [
        { "id": 1, "name": "الرياضيات", "code": "MATH" },
        { "id": 2, "name": "العلوم", "code": "SCI" }
      ]
    }
    ```

---

### 6.2 `POST /api/v1/academic/subjects` — إضافة مادة جديدة لبنك المواد
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

### 6.3 `PUT /api/v1/academic/subjects/:id` — تعديل مادة ببنك المواد
- **Request Body:**
  ```json
  { "name": "الرياضيات العامة", "code": "MATH-GEN" }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث المادة بنجاح."}`
  - **`404 Not Found`:** `{"success": false, "message": "المادة غير موجودة."}`

---

### 6.4 `DELETE /api/v1/academic/subjects/:id` — حذف مادة عامة غير مسندة
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف المادة من البنك بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف المادة لإسنادها في مناهج وصفوف دراسية (RESTRICT)."}`

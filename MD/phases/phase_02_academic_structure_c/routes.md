# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-C (Network SSoT)

> **الهدف:** توثيق المسارات الـ 7 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطلوب، بما يطابق حقول قاعدة البيانات في [`MD/database/database_phase_02.md`](../../database/database_phase_02.md) (`passing_score`, `max_score`, `academic_term_id`).

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/academic`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Accept: application/json`, `Content-Type: application/json`

---

## 🧩 الخطوة 7: إدارة ربط وتسكين الشُعب بالصفوف (`class_sections`) — [3 مسارات]

---

### 7.1 `GET /api/v1/academic/classes/:class_id/sections` — عرض شعب صف مفتوحة
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب الشعب المفتوحة للصف بنجاح.",
      "data": [
        { "id": 1, "class_id": 5, "section_id": 1, "section_name": "شعبة أ" },
        { "id": 2, "class_id": 5, "section_id": 2, "section_name": "شعبة ب" }
      ]
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`

---

### 7.2 `POST /api/v1/academic/class-sections` — تسكين/ربط شعبة بصف
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
      "data": { "id": 1, "class_id": 5, "section_id": 1, "created_at": "2026-08-29T12:00:00Z" }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "الشعبة مفتوحة ومسندة مسبقاً لهذا الصف (uq_class_sections)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "الصف أو الشعبة غير موجودة."}`

---

### 7.3 `DELETE /api/v1/academic/class-sections/:id` — فك ربط شعبة من صف
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم فك ربط الشعبة من الصف بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن فك ربط الشعبة لوجود طلاب مسجلين بها في هذا العام (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل الربط غير موجود."}`

---

## 📝 الخطوة 8: إدارة مناهج الصفوف والدرجات لكل فترة (`class_subjects`) — [4 مسارات]

---

### 8.1 `GET /api/v1/academic/classes/:class_id/subjects` — عرض منهج الصف بالفترة
- **Query Parameters:** `academic_term_id` (required, bigint)
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب منهج الصف بالفترة الدراسية بنجاح.",
      "data": [
        {
          "id": 12,
          "class_id": 5,
          "subject_id": 1,
          "subject_name": "الرياضيات",
          "subject_code": "MATH",
          "academic_term_id": 1,
          "passing_score": "50.00",
          "max_score": "100.00"
        }
      ]
    }
    ```
  - **`422 Unprocessable`:** `{"success": false, "message": "حقل academic_term_id مطلوب."}`

---

### 8.2 `POST /api/v1/academic/classes/:class_id/subjects` — إسناد مادة لصف وتحديد درجات الفترة
- **Request Body:**
  ```json
  {
    "subject_id": 1,
    "academic_term_id": 1,
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
      "data": {
        "id": 12,
        "class_id": 5,
        "subject_id": 1,
        "academic_term_id": 1,
        "passing_score": "50.00",
        "max_score": "100.00"
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "المادة مضافة ومقررة مسبقاً لهذا الصف في هذا الفصل الدراسي (uq_class_subject_term)."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من مدخلات الدرجات.",
      "errors": { "passing_score": ["درجة النجاح passing_score يجب أن تكون أقل من أو تساوي الدرجة العظمى max_score."] }
    }
    ```
  - **`500 Server Error`:** `{"success": false, "message": "خطأ خادم داخلي."}`

---

### 8.3 `PUT /api/v1/academic/classes/:class_id/subjects/:id` — تعديل درجات مادة بالفترة
- **Request Body:**
  ```json
  {
    "passing_score": 60.00,
    "max_score": 100.00
  }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث درجات المادة للفترة بنجاح.", "data": { "id": 12, "passing_score": "60.00", "max_score": "100.00" }}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن تعديل درجات مادة في فصل مغلق نهائياً (is_closed = 1)."}`
  - **`404 Not Found`:** `{"success": false, "message": "مقرر المادة غير موجود."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "درجة النجاح يجب أن تكون أقل من أو تساوي الدرجة العظمى."}`

---

### 8.4 `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id` — إزالة مادة من منهج فترة
- **Query Parameters:** `academic_term_id` (required, bigint)
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تمت إزالة المادة من منهج الفصل الدراسي بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن إزالة المادة من المنهج لارتباطها باختبارات رسمية أو حصص جدول (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "المادة غير مسندة لهذا الصف بالفترة."}`

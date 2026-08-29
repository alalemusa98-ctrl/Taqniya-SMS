# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-C (Network SSoT)

> **الهدف:** توثيق المسارات الـ 11 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** ملف [`routes.md`](./routes.md) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/academic`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Accept: application/json`, `Content-Type: application/json`

---

## 🗓️ الخطوة 7: إدارة تواريخ وتخطيط فترات الصفوف (`class_academic_terms`) — [4 مسارات]

---

### 7.1 `GET /api/v1/academic/years/:academic_year_id/classes/:class_id/terms` — عرض فترات وتواريخ صف بالعام
- **الوصف الوظيفي للرابط:** استرجاع فترات وتواريخ وتقويم صف دراسي محدد في عام دراسي بالمنظومة.
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب فترات الصف الدراسي بالعام بنجاح.",
      "data": [
        {
          "id": 10,
          "academic_year_id": 1,
          "class_id": 9,
          "academic_term_id": 1,
          "term_name": "الفصل الأول",
          "start_date": "2025-09-01",
          "end_date": "2025-12-31",
          "is_active": 1,
          "is_closed": 0
        }
      ]
    }
    ```

---

### 7.2 `POST /api/v1/academic/class-academic-terms` — تخصيص وتخبيط فترة وتواريخ لصف
- **الوصف الوظيفي للرابط:** تخصيص فترة وتواريخ رسمية لصف بالعام الدراسي طبق تقويم الوزارة (مثل: 3 فترات لصف 9 و 12، وفترتان لصف 5 و 6).
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
        "class_id": 9,
        "academic_term_id": 1,
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

### 7.3 `POST /api/v1/academic/class-academic-terms/:id/activate` — تفعيل الفترة النشطة للصف
- **الوصف الوظيفي للرابط:** تفعيل الفترة الحالية النشطة لهذا الصف بالذات وإلغاء تفعيل الفترات الأخرى لنفس الصف بالعام بحركة ذرية atomic.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تفعيل الفترة النشطة للصف الدراسي بنجاح."}`

---

### 7.4 `POST /api/v1/academic/class-academic-terms/:id/close` — إغلاق/فتح درجات الفترة للصف
- **الوصف الوظيفي للرابط:** تغيير حالة إغلاق درجات الفترة للصف (`is_closed = 1`).
- **Request Body:** `{"is_closed": 1}`
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تمت تغيير حالة إغلاق درجات الفترة للصف بنجاح."}`

---

## 🧩 الخطوة 8: إدارة ربط وتسكين الشُعب بالصفوف (`class_sections`) — [3 مسارات]

---

### 8.1 `GET /api/v1/academic/classes/:class_id/sections` — عرض شعب صف مفتوحة
- **الوصف الوظيفي للرابط:** استرجاع قائمة كافة الشعب المفتوحة والمخصصة لصف دراسي محدد.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم جلب الشعب المفتوحة للصف بنجاح.", "data": [{ "id": 1, "class_id": 5, "section_id": 1, "section_name": "شعبة أ" }]}`

---

### 8.2 `POST /api/v1/academic/class-sections` — تسكين/ربط شعبة بصف
- **Request Body:** `{"class_id": 5, "section_id": 1}`
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تم فتح وتسكين الشعبة للصف بنجاح."}`
  - **`409 Conflict`:** `{"success": false, "message": "الشعبة مفتوحة ومسندة مسبقاً لهذا الصف."}`

---

### 8.3 `DELETE /api/v1/academic/class-sections/:id` — فك ربط شعبة من صف
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم فك ربط الشعبة من الصف بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن فك ربط الشعبة لوجود طلاب مسجلين بها (RESTRICT)."}`

---

## 📝 الخطوة 9: إدارة مناهج الصفوف والدرجات لكل فترة (`class_subjects`) — [4 مسارات]

---

### 9.1 `GET /api/v1/academic/classes/:class_id/subjects` — عرض منهج الصف بالفترة
- **Query Parameters:** `class_academic_term_id` (required, bigint)
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
          "class_academic_term_id": 10,
          "passing_score": "50.00",
          "max_score": "100.00"
        }
      ]
    }
    ```

---

### 9.2 `POST /api/v1/academic/classes/:class_id/subjects` — إسناد مادة لصف وتحديد درجات الفترة
- **Request Body:** `{"subject_id": 1, "class_academic_term_id": 10, "passing_score": 50.00, "max_score": 100.00}`
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تم إسناد المادة وتحديد درجات الفصل الدراسي بنجاح."}`
  - **`409 Conflict`:** `{"success": false, "message": "المادة مضافة ومقررة مسبقاً لهذا الصف في هذا الفصل الدراسي (uq_class_term_subject)."}`

---

### 9.3 `PUT /api/v1/academic/classes/:class_id/subjects/:id` — تعديل درجات مادة بالفترة
- **Request Body:** `{"passing_score": 60.00, "max_score": 100.00}`
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث درجات المادة للفترة بنجاح."}`

---

### 9.4 `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id` — إزالة مادة من منهج فترة
- **Query Parameters:** `class_academic_term_id` (required, bigint)
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تمت إزالة المادة من منهج الفصل الدراسي بنجاح."}`

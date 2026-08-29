# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-C (Network SSoT)

> **الهدف:** توثيق المسارات الـ 11 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) كأمثلة صريحة لتوضيح شكل المصفوفة مع الترقيم المالي القياسي (`Pagination Meta`).  
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

## 🗓️ الخطوة 1: إدارة تواريخ وتخطيط فترات الصفوف (`class_academic_terms`) — [4 مسارات]

---

### 1.1 `GET /api/v1/academic/years/:academic_year_id/classes/:class_id/terms` — عرض فترات وتواريخ صف بالعام
- **الوصف الوظيفي للرابط:** استرجاع فترات وتواريخ وتقويم صف دراسي محدد بالعام الدراسي مدمجةً بالمعلومات الأكاديمية الصريحة بصيغة موجزة متعددة العناصر.
- **Query Parameters:** `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
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

### 1.3 `POST /api/v1/academic/class-academic-terms/:id/activate` — تفعيل الفترة النشطة للصف
- **الوصف الوظيفي للرابط:** تفعيل الفترة الحالية النشطة لهذا الصف بالذات وإلغاء تفعيل الفترات الأخرى لنفس الصف بالعام بحركة ذرية atomic.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تفعيل الفترة النشطة للصف الدراسي بنجاح."}`

---

### 1.4 `POST /api/v1/academic/class-academic-terms/:id/close` — إغلاق/فتح درجات الفترة للصف
- **الوصف الوظيفي للرابط:** تغيير حالة إغلاق درجات الفترة للصف (`is_closed = 1`).
- **Request Body:** `{"is_closed": 1}`
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تمت تغيير حالة إغلاق درجات الفترة للصف بنجاح."}`

---

## 🧩 الخطوة 2: إدارة ربط وتسكين الشُعب بالصفوف (`class_sections`) — [3 مسارات]

---

### 2.1 `GET /api/v1/academic/classes/:class_id/sections` — عرض شعب صف مفتوحة
- **الوصف الوظيفي للرابط:** استرجاع قائمة كافة الشعب المفتوحة والمخصصة لصف دراسي محدد بصيغة موجزة متعددة العناصر.
- **Query Parameters:** `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
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
- **Request Body:** `{"class_id": 5, "section_id": 1}`
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تم فتح وتسكين الشعبة للصف بنجاح."}`
  - **`409 Conflict`:** `{"success": false, "message": "الشعبة مفتوحة ومسندة مسبقاً لهذا الصف."}`

---

### 2.3 `DELETE /api/v1/academic/class-sections/:id` — فك ربط شعبة من صف
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم فك ربط الشعبة من الصف بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن فك ربط الشعبة لوجود طلاب مسجلين بها (RESTRICT)."}`

---

## 📝 الخطوة 3: إدارة مناهج الصفوف والدرجات لكل فترة (`class_subjects`) — [4 مسارات]

---

### 3.1 `GET /api/v1/academic/classes/:class_id/subjects` — عرض منهج الصف بالفترة
- **الوصف الوظيفي للرابط:** استرجاع تفاصيل منهج الصف الدراسي والمواد المقررة بالفترة ببيانات موجزة ذات معنى صريح تضم أكثر من مادة كمثال عملي للمصفوفة.
- **Query Parameters:** `class_academic_term_id` (required, bigint), `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
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
- **Request Body:** `{"subject_id": 1, "class_academic_term_id": 10, "passing_score": 50.00, "max_score": 100.00}`
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تم إسناد المادة وتحديد درجات الفصل الدراسي بنجاح."}`
  - **`409 Conflict`:** `{"success": false, "message": "المادة مضافة ومقررة مسبقاً لهذا الصف في هذا الفصل الدراسي (uq_class_term_subject)."}`

---

### 3.3 `PUT /api/v1/academic/classes/:class_id/subjects/:id` — تعديل درجات مادة بالفترة
- **Request Body:** `{"passing_score": 60.00, "max_score": 100.00}`
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث درجات المادة للفترة بنجاح."}`

---

### 3.4 `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id` — إزالة مادة من منهج فترة
- **Query Parameters:** `class_academic_term_id` (required, bigint)
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تمت إزالة المادة من منهج الفصل الدراسي بنجاح."}`

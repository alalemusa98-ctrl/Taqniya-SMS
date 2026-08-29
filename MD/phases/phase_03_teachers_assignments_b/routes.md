# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 03-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 5 كاملة لإدارة وتوزيع جدول إسناد التدريس الأكاديمي والنصاب التدريسي للمعلمين مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف (`routes.md`) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/teaching-assignments`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Accept: application/json`, `Content-Type: application/json`

---

## 📚 الخطوة 1: إدارة سجل وجدول إسناد التدريس الأكاديمي (`teaching_assignments`) — [5 مسارات]

---

### 1.1 `GET /api/v1/teaching-assignments` — عرض وتصفية جدول إسناد التدريس بالعام الدراسي
- **الوصف الوظيفي للرابط:** استرجاع قائمة كافة إسنادات التدريس المعتمدة بالعام الدراسي مدمجة بأسماء الصفوف والشعب والمواد والمعلمين بحجم بيانات موجز وعرض عنصرين كأمثلة صريحة للمصفوفة.
- **Query Parameters:** `academic_year_id` (optional, bigint), `class_section_id` (optional, bigint), `teacher_id` (optional, bigint), `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب جدول إسناد التدريس بنجاح.",
      "data": [
        { "id": 101, "academic_year_id": 1, "academic_year_name": "2025/2026", "class_section_id": 5, "class_name": "الصف الخامس", "section_name": "شعبة أ", "subject_id": 1, "subject_name": "الرياضيات", "subject_code": "MATH", "teacher_id": 1, "teacher_name": "أحمد محمود سالم" },
        { "id": 102, "academic_year_id": 1, "academic_year_name": "2025/2026", "class_section_id": 5, "class_name": "الصف الخامس", "section_name": "شعبة أ", "subject_id": 2, "subject_name": "العلوم", "subject_code": "SCI", "teacher_id": 2, "teacher_name": "خالد عبد السلام الفيتوري" }
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

### 1.2 `GET /api/v1/teachers/:teacher_id/assignments` — عرض النصاب التدريسي والمواد لمعلم محدد
- **الوصف الوظيفي للرابط:** استرجاع قائمة كافة الصفوف والشعب والمواد المكلف بها معلم محدد بالعام الدراسي النشط.
- **Query Parameters:** `academic_year_id` (optional, bigint), `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب النصاب الأكاديمي للمعلم بنجاح.",
      "data": [
        { "id": 101, "academic_year_name": "2025/2026", "class_name": "الصف الخامس", "section_name": "شعبة أ", "subject_name": "الرياضيات", "subject_code": "MATH" },
        { "id": 105, "academic_year_name": "2025/2026", "class_name": "الصف السادس", "section_name": "شعبة ب", "subject_name": "الرياضيات", "subject_code": "MATH" }
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

### 1.3 `POST /api/v1/teaching-assignments` — تعيين وإسناد تدريس مادة لشعبة ومعلم
- **الوصف الوظيفي للرابط:** تعيين معلم مسؤول عن تدريس مادة دراسية لشعبة محددة في عام دراسي محدد.
- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "class_section_id": 5,
    "subject_id": 1,
    "teacher_id": 1
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إسناد التدريس وتعيين المعلم للشعبة بنجاح.",
      "data": {
        "id": 101,
        "academic_year_id": 1,
        "class_section_id": 5,
        "subject_id": 1,
        "teacher_id": 1,
        "created_at": "2026-08-29T12:00:00Z"
      }
    }
    ```
  - **`400 Bad Request`:** `{"success": false, "message": "Malformed JSON payload."}`
  - **`401 Unauthorized`:** `{"success": false, "message": "Unauthenticated access."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا تملك صلاحية الإدارة."}`
  - **`409 Conflict`:** `{"success": false, "message": "هذه المادة مسندة مسبقاً لمعلم آخر بنفس الشعبة والعام (uq_teaching_assignment)."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من مدخلات إسناد التدريس.",
      "errors": { "teacher_id": ["المعلم المختار غير موجود."] }
    }
    ```
  - **`500 Server Error`:** `{"success": false, "message": "خطأ خادم داخلي."}`

---

### 1.4 `PUT /api/v1/teaching-assignments/:id` — تعديل وتكليف معلم آخر بالمادة والشعبة
- **الوصف الوظيفي للرابط:** تغيير وتكليف معلم جديد بتدريس مادة قائمة لشعبة بالعام الدراسي.
- **Request Body:**
  ```json
  {
    "teacher_id": 3
  }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث المعلم المكلف بالتدريس بنجاح.", "data": { "id": 101, "teacher_id": 3 }}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل إسناد التدريس غير موجود."}`

---

### 1.5 `DELETE /api/v1/teaching-assignments/:id` — فك وإزالة إسناد التدريس
- **الوصف الوظيفي للرابط:** فك وإزالة إسناد التدريس بشرط عدم وجود درجات تطبيقات أو واجبات مسجلة باسم هذا الإسناد.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم فك إسناد التدريس بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن فك إسناد التدريس لرصد واجبات أو درجات امتحانات على السجل (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل إسناد التدريس غير موجود."}`

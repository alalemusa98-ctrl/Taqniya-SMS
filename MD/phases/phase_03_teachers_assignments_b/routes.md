# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 03-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 6 كاملة لإدارة وتوزيع جدول إسناد التدريس الأكاديمي والنصاب التدريسي للمعلمين مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف (`routes.md`) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/teaching-assignments`
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

## 📚 الخطوة 1: إدارة سجل وجدول إسناد التدريس الأكاديمي (`teaching_assignments`) — [6 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لإسناد التدريس:**
> 1. **المعلم المسؤول الوحيد لكل مادة بالشعبة:** تضمن المنظومة وجود معلم مسؤول واحد فقط عن تدريس المادة الواحدة للشعبة المحددة بالعام الدراسي عبر قيد التفرد المركب (`uq_teaching_assignment: academic_year_id, class_section_id, subject_id`).
> 2. **صلاحيات التكليف والتعديل:** تعديل وإسناد الجداول مقتصر حصراً على مدير النظام (`role_type = 'admin'`).
> 3. **شرط الشغور عند التعديل:** عند تغيير الشعبة أو المادة في طلب التحديث `PUT` يتأكد الخادم من أن المستهدف شاغر ولا يوجد به معلم آخر مسبقاً.
> 4. **حماية فك الربط:** يمنع إلغاء أو فك إسناد مادة لمعلم إذا مررت لها واجبات يومية أو درجات امتحانات رسمية بجدول `student_grades` (`ON DELETE RESTRICT`).

---

### 1.1 `GET /api/v1/teaching-assignments` — عرض وتصفية وبحث جدول إسناد التدريس بالعام الدراسي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة كافة إسنادات التدريس المعتمدة بالعام الدراسي مدمجة بأسماء الصفوف والشعب والمواد والمعلمين مع دعم البحث النصي والتصفية بالعام والشعبة والمادة والمعلم، الترتيب والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم المعلم، الصف، الشعبة، أو اسم المادة (مثال: `أحمد` أو `خامس` أو `رياضيات`).
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي.
  - `class_section_id` (optional, bigint): تصفية حسب الشعبة الدراسية المحددة.
  - `teacher_id` (optional, bigint): تصفية حسب معلم محدد.
  - `subject_id` (optional, bigint): تصفية حسب المادة التعليمية.
  - `sort_by` (optional, string, enum: `id`, `academic_year_id`, `class_section_id`, `subject_id`, `teacher_id`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/teaching-assignments?search=رياضيات&academic_year_id=1&sort_by=id&sort_order=desc`
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

---

### 1.2 `GET /api/v1/teachers/:teacher_id/assignments` — عرض وبحث النصاب التدريسي والمواد لمعلم محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة كافة الصفوف والشعب والمواد المكلف بها معلم محدد بالعام الدراسي النشط مع دعم البحث والفلترة.

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم الصف، الشعبة، أو المادة المكلف بها (مثال: `السادس` أو `MATH`).
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي.
  - `sort_by` (optional, string, enum: `id`, `subject_id`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
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
  - **`404 Not Found`:** `{"success": false, "message": "ملف المعلم غير موجود."}`

---

### 1.3 `GET /api/v1/classes/:class_id/assignments` — عرض وبحث معلمي ومناهج الصف الدراسي والمعاينة حسب الشعبة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة معلمي المواد والمناهج المخصصة لصف دراسي محدد بالعام الدراسي مع إمكانية التصفية والمعاينة بحسب الشعبة (`section_id`).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (الافتراضي العام النشط).
  - `section_id` (optional, bigint): تصفية وتضييق المعاينة بحسب شعبة محددة داخل الصف (مثل: `شعبة أ` أو `شعبة ب`).
  - `search` (optional, string): البحث النصي باسم المادة أو اسم المعلم أو كود المادة (مثال: `الرياضيات` أو `أحمد`).
  - `sort_by` (optional, string, enum: `id`, `section_id`, `subject_id`, `teacher_id`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/classes/5/assignments?section_id=1&search=رياضيات&sort_by=id&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب جدول معلمي ومناهج الصف بنجاح.",
      "data": [
        { "id": 101, "academic_year_id": 1, "academic_year_name": "2025/2026", "class_id": 5, "class_name": "الصف الخامس", "class_section_id": 5, "section_id": 1, "section_name": "شعبة أ", "subject_id": 1, "subject_name": "الرياضيات", "subject_code": "MATH", "teacher_id": 1, "teacher_code": "TCH-2001", "teacher_name": "أحمد محمود سالم" },
        { "id": 102, "academic_year_id": 1, "academic_year_name": "2025/2026", "class_id": 5, "class_name": "الصف الخامس", "class_section_id": 5, "section_id": 1, "section_name": "شعبة أ", "subject_id": 2, "subject_name": "العلوم", "subject_code": "SCI", "teacher_id": 2, "teacher_code": "TCH-2002", "teacher_name": "خالد عبد السلام الفيتوري" }
      ],
      "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 2,
        "last_page": 1
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`

---

### 1.4 `POST /api/v1/teaching-assignments` — تعيين وإسناد تدريس مادة لشعبة ومعلم

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تعيين معلم مسؤول عن تدريس مادة دراسية لشعبة محددة في عام دراسي محدد.

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
        "academic_year_name": "2025/2026",
        "class_section_id": 5,
        "class_name": "الصف الخامس",
        "section_name": "شعبة أ",
        "subject_id": 1,
        "subject_name": "الرياضيات",
        "teacher_id": 1,
        "teacher_name": "أحمد محمود سالم",
        "created_at": "2026-08-29T12:00:00Z"
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "هذه المادة مسندة مسبقاً لمعلم آخر بنفس الشعبة والعام (uq_teaching_assignment)."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من مدخلات إسناد التدريس.",
      "errors": { "teacher_id": ["المعلم المختار غير موجود."] }
    }
    ```

---

### 1.5 `PUT /api/v1/teaching-assignments/:id` — تعديل وتكليف إسناد التدريس (تعديل المعلم، الشعبة، أو المادة)

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تعديل وتحديث سجل إسناد التدريس القائم بتمكين تعديل المعلم المكلف (`teacher_id`) أو نقل التكليف لشعبة جديدة (`class_section_id`) أو تعديل المادة (`subject_id`) بشرط شغور الشعبة والمادة وعدم وجود إسناد مسبق لمعلم آخر بها بنفس العام الدراسي (`uq_teaching_assignment`).

- **Request Body:**
  ```json
  {
    "class_section_id": 5,
    "subject_id": 1,
    "teacher_id": 3
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث وتعديل إسناد التدريس بنجاح.",
      "data": {
        "id": 101,
        "academic_year_id": 1,
        "class_section_id": 5,
        "class_name": "الصف الخامس",
        "section_name": "شعبة أ",
        "subject_id": 1,
        "subject_name": "الرياضيات",
        "teacher_id": 3,
        "teacher_name": "علي مصطفى الورفلي"
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "سجل إسناد التدريس غير موجود."}`
  - **`409 Conflict`:** `{"success": false, "message": "الشعبة والمادة المراد النقل إليها مخصصة ومسندة مسبقاً لمعلم آخر بنفس العام (uq_teaching_assignment)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "بيانات التحديث المدخلة غير صالحة."}`

---

### 1.6 `DELETE /api/v1/teaching-assignments/:id` — فك وإزالة إسناد التدريس

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** فك وإزالة إسناد التدريس بشرط عدم وجود درجات تطبيقات أو واجبات مسجلة باسم هذا الإسناد.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم فك إسناد التدريس بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن فك إسناد التدريس لرصد واجبات أو درجات امتحانات على السجل (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل إسناد التدريس غير موجود."}`

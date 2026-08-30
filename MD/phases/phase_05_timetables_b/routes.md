# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 05-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 7 كاملة لإدارة تسكين وتوزيع جدول الحصص الأسبوعي وحظر تضارب الشعب والمعلمين مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
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

## 🗓️ الخطوة 1: إدارة جدول الحصص الأسبوعي وحظر التعارضات الزمانية (`timetable_slots`) — [7 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لـ جدول الحصص الأسبوعي:**
> 1. **قيد تفرد حصة الشعبة الزمني:** يمنع تسكين حصتين لنفس الشعبة في نفس اليوم والحصة بالعام النشط (`uq_timetable_section_slot`). عند محاولة التسكين المزدوج، يرجع الخادم خطأ `409 Conflict`.
> 2. **قيد تفرد جدول المعلم (مفهوم حظر التداخل):** يمنع الخادم إسناد المعلم نفسه لتدريس شعبتين مختلفتين في نفس اليوم والحصة بالعام النشط، ويرجع الخادم خطأ `409 Conflict`.
> 3. **صلاحيات الإدارة:** إضافة وتعديل وحذف الجدول الأسبوعي مقتصر حصراً على مدير النظام (`role_type = 'admin'`).

---

### 1.1 `GET /api/v1/timetable-slots` — عرض وتصفية سجلات الجدول الأسبوعي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة سجلات جدول الحصص الأسبوعية بالمنظومة مع دعم الفلترة بالشعبة، المعلم، المادة، اليوم، الحصة والترتيب والترقيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم المادة أو معلم المادة أو اسم الشعبة.
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `class_section_id` (optional, bigint): تصفية حسب الشعبة الدراسية.
  - `teacher_id` (optional, bigint): تصفية الحصص الموكلة لمعلم محدد.
  - `subject_id` (optional, bigint): تصفية حسب المادة التعليمية.
  - `day_of_week` (optional, string, enum: `saturday`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`): تصفية حسب اليوم.
  - `period_slot_id` (optional, bigint): تصفية حسب الحصة اليومية.
  - `sort_by` (optional, string, enum: `id`, `day_of_week`, `period_slot_id`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/timetable-slots?class_section_id=5&day_of_week=sunday&sort_by=period_slot_id&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب مصفوفة الجدول الأسبوعي بنجاح.",
      "data": [
        {
          "id": 1,
          "academic_year_id": 1,
          "class_section_id": 5,
          "class_name": "الصف الخامس",
          "section_name": "شعبة أ",
          "day_of_week": "sunday",
          "day_of_week_ar": "الأحد",
          "period_slot_id": 1,
          "period_name": "الحصة الأولى",
          "start_time": "08:00:00",
          "end_time": "08:45:00",
          "teaching_assignment_id": 10,
          "subject_name": "الرياضيات",
          "teacher_id": 3,
          "teacher_name": "أحمد عبد السلام",
          "created_at": "2026-08-29T10:00:00Z"
        },
        {
          "id": 2,
          "academic_year_id": 1,
          "class_section_id": 5,
          "class_name": "الصف الخامس",
          "section_name": "شعبة أ",
          "day_of_week": "sunday",
          "day_of_week_ar": "الأحد",
          "period_slot_id": 2,
          "period_name": "الحصة الثانية",
          "start_time": "08:45:00",
          "end_time": "09:30:00",
          "teaching_assignment_id": 12,
          "subject_name": "اللغة العربية",
          "teacher_id": 4,
          "teacher_name": "سالم خليفة",
          "created_at": "2026-08-29T10:05:00Z"
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

### 1.2 `GET /api/v1/sections/:section_id/timetable` — عرض مصفوفة الجدول الأسبوعي لشعبة محددة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع الشبكة الجدولية الحصريّة للشعبة بالكامل مقسمة بحسب أيام الأسبوع الـ 6 والفترات الزمنية للجدول المدرسي.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب جدول الحصص الأسبوعي للشعبة بنجاح.",
      "data": {
        "class_section_id": 5,
        "class_name": "الصف الخامس",
        "section_name": "شعبة أ",
        "timetable": [
          {
            "day_of_week": "sunday",
            "day_of_week_ar": "الأحد",
            "slots": [
              { "period_slot_id": 1, "period_name": "الحصة الأولى", "subject_name": "الرياضيات", "teacher_name": "أحمد عبد السلام" },
              { "period_slot_id": 2, "period_name": "الحصة الثانية", "subject_name": "اللغة العربية", "teacher_name": "سالم خليفة" }
            ]
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الشعبة الدراسية غير موجودة."}`

---

### 1.3 `GET /api/v1/teachers/:teacher_id/timetable` — عرض جدول الحصص الأسبوعي لمعلم محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع جدول نصاب الحصص الأسبوعي الخريطي الخاص بمعلم محدد لمعرفة توزيع حصصه وشعبه على أيام الأسبوع.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب جدول الحصص الأسبوعي للمعلم بنجاح.",
      "data": {
        "teacher_id": 3,
        "teacher_name": "أحمد عبد السلام",
        "timetable": [
          {
            "day_of_week": "sunday",
            "day_of_week_ar": "الأحد",
            "slots": [
              { "period_slot_id": 1, "period_name": "الحصة الأولى", "class_name": "الصف الخامس", "section_name": "شعبة أ", "subject_name": "الرياضيات" }
            ]
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "المعلم غير موجود."}`

---

### 1.4 `GET /api/v1/classes/:class_id/timetable` — عرض مصفوفة جدول الحصص المجمع لكافة شعب الصف الدراسي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع مصفوفة جدول الحصص اليومي أو الأسبوعي المجمع لكافة شُعب الصف الدراسي لعرض جدول الناظر الشامل لجميع الشُعب والحصص في شاشة واحدة.

- **Query Parameters:**
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `day_of_week` (optional, string, enum: `saturday`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`): تصفية حسب اليوم (مثلاً: `sunday`).
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب مصفوفة جدول حصص الصف بنجاح.",
      "data": {
        "class_id": 5,
        "class_name": "الصف الخامس",
        "day_of_week": "sunday",
        "day_of_week_ar": "الأحد",
        "sections": [
          {
            "class_section_id": 5,
            "section_name": "شعبة أ",
            "slots": [
              {
                "period_slot_id": 1,
                "period_name": "الحصة الأولى",
                "start_time": "08:00:00",
                "end_time": "08:45:00",
                "subject_name": "الرياضيات",
                "teacher_id": 1,
                "teacher_name": "أحمد محمود سالم"
              },
              {
                "period_slot_id": 2,
                "period_name": "الحصة الثانية",
                "start_time": "08:45:00",
                "end_time": "09:30:00",
                "subject_name": "الرياضيات",
                "teacher_id": 1,
                "teacher_name": "أحمد محمود سالم"
              },
              {
                "period_slot_id": 3,
                "period_name": "الحصة الثالثة",
                "start_time": "09:45:00",
                "end_time": "10:30:00",
                "subject_name": "العلوم",
                "teacher_id": 2,
                "teacher_name": "خالد عبد السلام"
              }
            ]
          },
          {
            "class_section_id": 6,
            "section_name": "شعبة ب",
            "slots": [
              {
                "period_slot_id": 1,
                "period_name": "الحصة الأولى",
                "start_time": "08:00:00",
                "end_time": "08:45:00",
                "subject_name": "العلوم",
                "teacher_id": 2,
                "teacher_name": "خالد عبد السلام"
              },
              {
                "period_slot_id": 2,
                "period_name": "الحصة الثانية",
                "start_time": "08:45:00",
                "end_time": "09:30:00",
                "subject_name": "اللغة العربية",
                "teacher_id": 3,
                "teacher_name": "علي مصطفى الورفلي"
              }
            ]
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`

---

### 1.5 `POST /api/v1/timetable-slots` — إضافة وتسكين حصة بالجدول الأسبوعي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إدراج حصة جديدة بالجدول الأسبوعي مع الفحص الذري ومنع تضارب شعبة الفصل (`uq_timetable_section_slot`) وتضارب جدول المعلم.

- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "class_section_id": 5,
    "day_of_week": "sunday",
    "period_slot_id": 1,
    "teaching_assignment_id": 10
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إضافة وتسكين الحصة بالجدول الأسبوعي بنجاح.",
      "data": {
        "id": 1,
        "academic_year_id": 1,
        "class_section_id": 5,
        "day_of_week": "sunday",
        "period_slot_id": 1,
        "teaching_assignment_id": 10,
        "created_at": "2026-08-29T10:00:00Z"
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "يوجد تضارب؛ هذه الشعبة لديها حصة مسجلة مسبقاً بنفس اليوم والتوقيت (uq_timetable_section_slot)، أو أن المعلم مكلف بتدريس شعبة أخرى بنفس الوقت."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "بيانات التسكين الزمني غير صالحة."}`

---

### 1.5 `PUT /api/v1/timetable-slots/:id` — تعديل موعد أو مادة/معلم الحصة بالجدول الأسبوعي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تعديل توقيت اليوم أو الحصة أو تغيير إسناد المادة والمعلم للحصة.

- **Request Body:**
  ```json
  {
    "day_of_week": "monday",
    "period_slot_id": 2,
    "teaching_assignment_id": 10
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث موعد الحصة بالجدول الأسبوعي بنجاح.",
      "data": {
        "id": 1,
        "day_of_week": "monday",
        "period_slot_id": 2,
        "teaching_assignment_id": 10
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "سجل الحصة بالجدول غير موجود."}`
  - **`409 Conflict`:** `{"success": false, "message": "تعارض زمني؛ الشعبة أو المعلم مرتبط بحصة أخرى بالتوقيت الجديد."}`

---

### 1.6 `POST /api/v1/timetable-slots/bulk-schedule` — التوزيع والجدولة الجماعية لحصص الشعبة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** جدولة وتعبئة مصفوفة الحصص الأسبوعية لشعبة كاملة دفعة واحدة بالحدث الذري (`DB::transaction`).

- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "class_section_id": 5,
    "slots": [
      { "day_of_week": "sunday", "period_slot_id": 1, "teaching_assignment_id": 10 },
      { "day_of_week": "sunday", "period_slot_id": 2, "teaching_assignment_id": 12 }
    ]
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم الجدولة الجماعية لـ 2 حصة للشعبة بنجاح.",
      "data": {
        "scheduled_count": 2,
        "class_section_id": 5
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "يوجد تضارب في أحد المواعيد المدخلة بالدفعة الجماعية."}`

---

### 1.7 `DELETE /api/v1/timetable-slots/:id` — إلغاء وتفريغ حصة من الجدول الأسبوعي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** حذف وإلغاء حصة مخصصة من الجدول الأسبوعي للشعبة.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم إلغاء وتفريغ الحصة من الجدول الأسبوعي بنجاح."}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل الحصة بالجدول غير موجود."}`

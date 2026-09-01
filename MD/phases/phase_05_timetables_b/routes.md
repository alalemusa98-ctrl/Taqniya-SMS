# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 05-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 6 كاملة لإدارة وتوزيع جدول الحصص الأسبوعي، ومصفوفة الحصص المجمعة للصفوف والشعب، وحظر تضارب الشعب والمعلمين مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة ومنع التكرار، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم القياسي (`Pagination Meta`).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف ([`routes.md`](./routes.md)) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1`
- **Protocol:** `HTTPS`
- **Data Format:** `JSON` (`application/json`)
- **Required Headers:**
  ```http
  Authorization: Bearer <TOKEN>
  Accept: application/json
  Content-Type: application/json
  Accept-Language: ar
  ```

### 📋 مصفوفة المسارات الـ 6 الموحدة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `timetable_slots` | `GET` | `/api/v1/timetable-slots` | `admin` | استعراض وتصفية وبحث جدول الحصص الأسبوعي بالترقيم والفلترة |
| **2** | `timetable_slots` | `GET` | `/api/v1/class-sections/:class_section_id/timetable` | `admin` / `teacher` / `student` / `parent` | استعراض مصفوفة جدول الحصص الأسبوعي لشعبة محددة |
| **3** | `timetable_slots` | `GET` | `/api/v1/teachers/:teacher_id/timetable` | `admin` / `teacher (own)` | استعراض جدول الحصص الأسبوعي لمعلم محدد |
| **4** | `timetable_slots` | `GET` | `/api/v1/classes/:class_id/timetable` | `admin` | استعراض مصفوفة جدول الحصص المجمع لكافة شعب الصف الدراسي |
| **5** | `timetable_slots` | `POST` | `/api/v1/timetable-slots` | `admin` | تسكين وإدراج حصة جديدة بالجدول الأسبوعي (مع فحص التضارب) |
| **6** | `timetable_slots` | `PUT` | `/api/v1/timetable-slots/:id` | `admin` | تعديل وتحديث توقيت أو معلم/شعبة الحصة الأسبوعية |
| **7** | `timetable_slots` | `DELETE` | `/api/v1/timetable-slots/:id` | `admin` | حذف وإلغاء حصة من الجدول الأسبوعي |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API الـ 6** بالمرحلة:

```json
// 401 Unauthorized (غياب أو تلف التوكن)
{
  "success": false,
  "message": "غير مصرح بالوصول. التوكن غير صالح أو منتهي الصلاحية."
}

// 403 Forbidden (نقص الصلاحيات ومخالفة مصفوفة RBAC)
{
  "success": false,
  "message": "ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء."
}

// 500 Internal Server Error (خطأ غير متوقع في الخادم)
{
  "success": false,
  "message": "حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً."
}
```

---

## 🗓️ الخطوة 1: إدارة جدول الحصص الأسبوعي وحظر التعارضات الزمانية (`timetable_slots`) — [مواصفات المسارات]

---

### 1.1 `GET /api/v1/timetable-slots` — استعراض وتصفية سجلات الجدول الأسبوعي

> **الوصف الوظيفي:** استرجاع مصفوفة سجلات جدول الحصص الأسبوعية مجمعة هرمياً (`classes -> sections -> days -> slots`)؛ حيث يتيح تحديد معامل الصف الدراسي (`class_id`) جلب واستعراض جدول الحصص الأسبوعي الشامل لكافة الشُعب التابعة لذلك الصف في استجابة واحدة منظمة، مع دعم الفلترة بالشعبة المحددة، المعلم، المادة، اليوم، والبحث.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم المادة أو المعلم أو الشعبة.
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `class_id` (optional, bigint): تصفية حسب الصف الدراسي لجلب جدول كافة شُعبه.
  - `class_section_id` (optional, bigint): تصفية حسب الشعبة الدراسية المحددة.
  - `teacher_id` (optional, bigint): تصفية الحصص الموكلة لمعلم محدد.
  - `subject_id` (optional, bigint): تصفية حسب المادة التعليمية.
  - `day_of_week` (optional, string, enum: `saturday`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`): تصفية حسب اليوم.
  - `period_slot_id` (optional, bigint): تصفية حسب الحصة اليومية.
  - `sort_by` (optional, string, enum: `id`, `day_of_week`, `period_slot_id`, default `id`): حقل الفرز.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/timetable-slots?class_id=5&day_of_week=sunday&sort_by=period_slot_id&sort_order=asc`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب مصفوفة الجدول الأسبوعي الهرمية):
```json
{
  "success": true,
  "message": "تم جلب مصفوفة الجدول الأسبوعي بنجاح.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "classes": [
      {
        "class_id": 5,
        "class_name": "الصف الخامس",
        "grade_level": 5,
        "sections_count": 2,
        "sections": [
          {
            "class_section_id": 5,
            "section_name": "شعبة أ",
            "days": [
              {
                "day_of_week": "sunday",
                "day_of_week_ar": "الأحد",
                "slots": [
                  {
                    "id": 1,
                    "period_slot_id": 1,
                    "period_name": "الحصة الأولى",
                    "subject_name": "الرياضيات",
                    "teacher_name": "أحمد عبد السلام"
                  },
                  {
                    "id": 2,
                    "period_slot_id": 2,
                    "period_name": "الحصة الثانية",
                    "subject_name": "اللغة العربية",
                    "teacher_name": "سالم خليفة"
                  }
                ]
              },
              {
                "day_of_week": "monday",
                "day_of_week_ar": "الإثنين",
                "slots": [
                  {
                    "id": 3,
                    "period_slot_id": 1,
                    "period_name": "الحصة الأولى",
                    "subject_name": "العلوم",
                    "teacher_name": "منى الهوني"
                  }
                ]
              }
            ]
          },
          {
            "class_section_id": 6,
            "section_name": "شعبة ب",
            "days": [
              {
                "day_of_week": "sunday",
                "day_of_week_ar": "الأحد",
                "slots": [
                  {
                    "id": 6,
                    "period_slot_id": 1,
                    "period_name": "الحصة الأولى",
                    "subject_name": "اللغة العربية",
                    "teacher_name": "سالم خليفة"
                  },
                  {
                    "id": 7,
                    "period_slot_id": 2,
                    "period_name": "الحصة الثانية",
                    "subject_name": "الرياضيات",
                    "teacher_name": "أحمد عبد السلام"
                  }
                ]
              },
              {
                "day_of_week": "monday",
                "day_of_week_ar": "الإثنين",
                "slots": [
                  {
                    "id": 8,
                    "period_slot_id": 1,
                    "period_name": "الحصة الأولى",
                    "subject_name": "التربية الإسلامية",
                    "teacher_name": "خالد القمودي"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "class_id": 9,
        "class_name": "الصف التاسع",
        "grade_level": 9,
        "sections_count": 1,
        "sections": [
          {
            "class_section_id": 12,
            "section_name": "شعبة أ",
            "days": [
              {
                "day_of_week": "sunday",
                "day_of_week_ar": "الأحد",
                "slots": [
                  {
                    "id": 4,
                    "period_slot_id": 1,
                    "period_name": "الحصة الأولى",
                    "subject_name": "اللغة الإنجليزية",
                    "teacher_name": "فاطمة الزهراء"
                  },
                  {
                    "id": 5,
                    "period_slot_id": 2,
                    "period_name": "الحصة الثانية",
                    "subject_name": "التاريخ",
                    "teacher_name": "عمر المختار التاورغي"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 2,
    "last_page": 1
  }
}
```

##### ⚪ `200 OK` (القائمة فارغة):
```json
{
  "success": true,
  "message": "لا توجد حصص مسجلة تطابق محددات البحث.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "classes": []
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 0,
    "last_page": 1
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.2 `GET /api/v1/class-sections/:class_section_id/timetable` — استعراض مصفوفة الجدول الأسبوعي لشعبة محددة

> **الوصف الوظيفي:** استرجاع جدول الحصص الأسبوعي الكامل لشعبة محددة مقسماً بحسب أيام الأسبوع والفترات الزمنية.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
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
          {
            "period_slot_id": 1,
            "period_name": "الحصة الأولى",
            "subject_name": "الرياضيات",
            "teacher_name": "أحمد عبد السلام"
          },
          {
            "period_slot_id": 2,
            "period_name": "الحصة الثانية",
            "subject_name": "اللغة العربية",
            "teacher_name": "سالم خليفة"
          },
          {
            "period_slot_id": 3,
            "period_name": "الحصة الثالثة",
            "subject_name": "التربية الإسلامية",
            "teacher_name": "عمر المختار التاورغي"
          }
        ]
      },
      {
        "day_of_week": "monday",
        "day_of_week_ar": "الإثنين",
        "slots": [
          {
            "period_slot_id": 1,
            "period_name": "الحصة الأولى",
            "subject_name": "العلوم",
            "teacher_name": "منى الهوني"
          },
          {
            "period_slot_id": 2,
            "period_name": "الحصة الثانية",
            "subject_name": "اللغة الإنجليزية",
            "teacher_name": "فاطمة الزهراء"
          },
          {
            "period_slot_id": 4,
            "period_name": "الحصة الرابعة",
            "subject_name": "الرياضيات",
            "teacher_name": "أحمد عبد السلام"
          }
        ]
      },
      {
        "day_of_week": "tuesday",
        "day_of_week_ar": "الثلاثاء",
        "slots": [
          {
            "period_slot_id": 1,
            "period_name": "الحصة الأولى",
            "subject_name": "التاريخ والجغرافيا",
            "teacher_name": "علي مصطفى الورفلي"
          },
          {
            "period_slot_id": 2,
            "period_name": "الحصة الثانية",
            "subject_name": "اللغة العربية",
            "teacher_name": "سالم خليفة"
          }
        ]
      }
    ]
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الشعبة الدراسية غير موجودة."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `GET /api/v1/teachers/:teacher_id/timetable` — استعراض جدول الحصص الأسبوعي لمعلم محدد

> **الوصف الوظيفي:** استرجاع جدول نصاب الحصص الأسبوعي لمعلم محدد لمعرفة توزيع حصصه وشعبه على أيام الأسبوع.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
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
          {
            "period_slot_id": 1,
            "period_name": "الحصة الأولى",
            "class_name": "الصف الخامس",
            "section_name": "شعبة أ",
            "subject_name": "الرياضيات"
          },
          {
            "period_slot_id": 2,
            "period_name": "الحصة الثانية",
            "class_name": "الصف الخامس",
            "section_name": "شعبة ب",
            "subject_name": "الرياضيات"
          }
        ]
      },
      {
        "day_of_week": "monday",
        "day_of_week_ar": "الإثنين",
        "slots": [
          {
            "period_slot_id": 1,
            "period_name": "الحصة الأولى",
            "class_name": "الصف السادس",
            "section_name": "شعبة أ",
            "subject_name": "الرياضيات"
          },
          {
            "period_slot_id": 3,
            "period_name": "الحصة الثالثة",
            "class_name": "الصف التاسع",
            "section_name": "شعبة أ",
            "subject_name": "الرياضيات"
          }
        ]
      },
      {
        "day_of_week": "tuesday",
        "day_of_week_ar": "الثلاثاء",
        "slots": [
          {
            "period_slot_id": 2,
            "period_name": "الحصة الثانية",
            "class_name": "الصف الخامس",
            "section_name": "شعبة أ",
            "subject_name": "الرياضيات"
          },
          {
            "period_slot_id": 4,
            "period_name": "الحصة الرابعة",
            "class_name": "الصف السادس",
            "section_name": "شعبة ب",
            "subject_name": "الرياضيات"
          }
        ]
      }
    ]
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "المعلم غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `GET /api/v1/classes/:class_id/timetable` — استعراض مصفوفة جدول الحصص المجمع لكافة شعب الصف الدراسي

> **الوصف الوظيفي:** استرجاع مصفوفة جدول الحصص المجمع لكافة شُعب الصف الدراسي ليوم محدد لعرض جدول الناظر الشامل لجميع الشُعب والحصص في شاشة واحدة.

- **Query Parameters:**
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `day_of_week` (optional, string, enum: `saturday`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, default `sunday`): تصفية حسب اليوم.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
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
            "subject_name": "الرياضيات",
            "teacher_id": 1,
            "teacher_name": "أحمد محمود سالم"
          },
          {
            "period_slot_id": 2,
            "period_name": "الحصة الثانية",
            "subject_name": "الرياضيات",
            "teacher_id": 1,
            "teacher_name": "أحمد محمود سالم"
          },
          {
            "period_slot_id": 3,
            "period_name": "الحصة الثالثة",
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
            "subject_name": "العلوم",
            "teacher_id": 2,
            "teacher_name": "خالد عبد السلام"
          },
          {
            "period_slot_id": 2,
            "period_name": "الحصة الثانية",
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

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الصف الدراسي غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.5 `POST /api/v1/timetable-slots` & `PUT /api/v1/timetable-slots/:id` — تسكين وتعديل حصة بالجدول الأسبوعي (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** إدراج حصة جديدة بالجدول الأسبوعي مع الفحص الذري ومنع تضارب شعبة الفصل (`uq_timetable_section_slot`) وتضارب جدول المعلم.
> * **في التعديل (`PUT`):** تحديث وتعديل توقيت أو شعبة أو مادة/معلم الحصة الأسبوعية مع التحقق من عدم التضارب.

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "academic_year_id": 1,
    "class_section_id": 5,
    "day_of_week": "sunday",
    "period_slot_id": 1,
    "teaching_assignment_id": 10
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
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

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث وتعديل الحصة بالجدول الأسبوعي بنجاح.",
  "data": {
    "id": 1,
    "academic_year_id": 1,
    "class_section_id": 5,
    "day_of_week": "sunday",
    "period_slot_id": 2,
    "teaching_assignment_id": 10
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "سجل الحصة بالجدول غير موجود."
}
```

##### ⚡ `409 Conflict` (تضارب حصة الشعبة أو تضارب جدول المعلم):
```json
{
  "success": false,
  "message": "تعارض في الجدول: الشعبة أو المعلم مرتبط بحصة أخرى في نفس اليوم والتوقيت (uq_timetable_section_slot)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات تسكين الحصة غير صالحة.",
  "errors": {
    "teaching_assignment_id": ["إسناد التدريس المختار غير صالح."],
    "period_slot_id": ["توقيت الحصة المختار غير موجود."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.6 `DELETE /api/v1/timetable-slots/:id` — حذف وإلغاء حصة من الجدول الأسبوعي

> **الوصف الوظيفي:** حذف الحصة من الجدول الأسبوعي وإخلاء التوقيت الزمني.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف وإلغاء الحصة من الجدول الأسبوعي بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل الحصة بالجدول غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

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

### 📋 مصفوفة المسارات الـ 7 الموحدة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة | سياق وتوقيت الاستخدام |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `timetable_slots` | `GET` | `/api/v1/timetable-slots` | `admin` / `teacher` | استعراض هيكل الصفوف والشعب العام للجدول الأسبوعي | **الوضع اليومي الافتراضي:** يُستدعى فورياً عند فتح الشاشة لتجهيز الكروت دون أي أحمال أو استعلامات تجميعية. |
| **2** | `timetable_slots` | `GET` | `/api/v1/timetable-slots/completion-status` | `admin` | كشف تدقيق واكتمال الجداول وحصر الحصص الشاغرة | **وضع التخطيط والتدقيق:** يُستدعى عند النقر على زر "تدقيق اكتمال الجدول والشواغر" لإبراز النواقص. |
| **3** | `timetable_slots` | `GET` | `/api/v1/class-sections/:class_section_id/timetable` | `admin` / `teacher` / `student` / `parent` | استعراض مصفوفة جدول الحصص الأسبوعي لشعبة محددة | **عند النقر على الشعبة:** جلب مصفوفة الحصص التفصيلية للشعبة المحددة بنمط التحميل عند الطلب (Lazy Loading). |
| **4** | `timetable_slots` | `GET` | `/api/v1/teachers/:teacher_id/timetable` | `admin` / `teacher (own)` | استعراض جدول الحصص الأسبوعي لمعلم محدد | كشف النصاب الأسبوعي وجدول حصص المعلم. |
| **5** | `timetable_slots` | `POST` | `/api/v1/timetable-slots` | `admin` | تسكين وإدراج حصة جديدة بالجدول الأسبوعي | عند إضافة وتسكين مادة ومعلم في فترة زمنية شاغرة. |
| **6** | `timetable_slots` | `PUT` | `/api/v1/timetable-slots/:id` | `admin` | تعديل وتحديث توقيت أو معلم/شعبة الحصة الأسبوعية | عند تعديل موعد الحصة أو تبديل المعلم/المادة. |
| **7** | `timetable_slots` | `DELETE` | `/api/v1/timetable-slots/:id` | `admin` | حذف وإلغاء حصة من الجدول الأسبوعي | عند تفريغ وإلغاء حصة من الجدول الأسبوعي. |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API الـ 7** بالمرحلة:

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

### 1.1 `GET /api/v1/timetable-slots` — استعراض هيكل الصفوف والشعب العام للجدول (الوضع التشغيلي الخفيف)

> **الوصف الوظيفي:** استرجاع الهيكل الصافي للصفوف الدراسية والشُعب التابعة لها للعام الدراسي النشط بصورة فائقة السرعة والخفة؛ حيث يقتصر هذا المسار على جلب المعرفات والأسماء الأساسية لتمكين الواجهة من رسم كروت الصفوف وتبويبات الشعب فور فتح الصفحة، بدون تنفيذ أي استعلامات تجميعية ثقيلة (`COUNT` أو `GROUP BY`) على جدول الحصص.  
> 👤 **الصلاحية المطلوبة:** `admin` / `teacher`.  
> ⏱️ **سياق وتوقيت الاستخدام:** يُستدعى تلقائياً عند فتح شاشة جدول الحصص الرئيسية في الاستخدام اليومي المعتاد.

- **Query Parameters:**
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `class_id` (optional, bigint): تصفية لجلب شُعب صف دراسي محدد فقط.
- **Example Request URL:** `/api/v1/timetable-slots?academic_year_id=1`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب الهيكل الصافي للصفوف والشعب):
```json
{
  "success": true,
  "message": "تم جلب هيكل الصفوف والشعب للجدول الأسبوعي بنجاح.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "classes": [
      {
        "class_id": 5,
        "class_name": "الصف الخامس",
        "grade_level": 5,
        "sections": [
          {
            "class_section_id": 5,
            "section_name": "شعبة أ"
          },
          {
            "class_section_id": 6,
            "section_name": "شعبة ب"
          }
        ]
      },
      {
        "class_id": 6,
        "class_name": "الصف السادس",
        "grade_level": 6,
        "sections": [
          {
            "class_section_id": 7,
            "section_name": "شعبة أ"
          }
        ]
      }
    ]
  }
}
```

##### ⚪ `200 OK` (لا توجد صفوف أو شعب):
```json
{
  "success": true,
  "message": "لا توجد صفوف أو شُعب مسجلة بالعام الدراسي المحدد.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "classes": []
  }
}
```

---

### 1.2 `GET /api/v1/timetable-slots/completion-status` — كشف تدقيق واكتمال الجداول وحصر الحصص الشاغرة (وضع التخطيط)

> **الوصف الوظيفي:** مسار تحليلي وتدقيقي مخصص لحساب إحصائيات اكتمال جدول الحصص الأسبوعي لكل صف وشعبة؛ يقوم بمطابقة الحصص المسكنة فعلياً مع السعة الإجمالية المطلوبة، وتحديد عدد الحصص الشاغرة/الناقصة الإجمالية على مستوى كل صف دراسي ولكل شعبة دراسية على حدة.  
> 👤 **الصلاحية المطلوبة:** `admin` حصراً (إجراء إداري تخطيطي).  
> ⏱️ **سياق وتوقيت الاستخدام:** يُستدعى حصراً وبشكل مستقل عند نقر مدير النظام على زر **`📊 تدقيق اكتمال الجدول والشواغر`** في أعلى الصفحة أثناء مرحلة بناء وتجهيز الجدول، لتمييز الصفوف والشعب الناقصة بإطارات وشارات تحذيرية ملونة.

- **Query Parameters:**
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `class_id` (optional, bigint): تصفية حسب صف محدد.
- **Example Request URL:** `/api/v1/timetable-slots/completion-status?academic_year_id=1`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب تقرير التدقيق والشواغر):
```json
{
  "success": true,
  "message": "تم جلب تقرير تدقيق واكتمال جداول الحصص بنجاح.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "total_unscheduled_school_slots": 5,
    "classes": [
      {
        "class_id": 5,
        "class_name": "الصف الخامس",
        "grade_level": 5,
        "total_unscheduled_slots": 5,
        "is_fully_scheduled": false,
        "sections": [
          {
            "class_section_id": 5,
            "section_name": "شعبة أ",
            "total_slots": 30,
            "scheduled_slots_count": 28,
            "unscheduled_slots_count": 2,
            "is_fully_scheduled": false
          },
          {
            "class_section_id": 6,
            "section_name": "شعبة ب",
            "total_slots": 30,
            "scheduled_slots_count": 27,
            "unscheduled_slots_count": 3,
            "is_fully_scheduled": false
          }
        ]
      },
      {
        "class_id": 6,
        "class_name": "الصف السادس",
        "grade_level": 6,
        "total_unscheduled_slots": 0,
        "is_fully_scheduled": true,
        "sections": [
          {
            "class_section_id": 7,
            "section_name": "شعبة أ",
            "total_slots": 30,
            "scheduled_slots_count": 30,
            "unscheduled_slots_count": 0,
            "is_fully_scheduled": true
          }
        ]
      }
    ]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---


### 1.3 `GET /api/v1/class-sections/:class_section_id/timetable` — استعراض مصفوفة الجدول الأسبوعي لشعبة محددة

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

### 1.4 `GET /api/v1/teachers/:teacher_id/timetable` — استعراض جدول الحصص الأسبوعي لمعلم محدد

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
    "academic_year_name": "2025/2026",
    "class_id": 5,
    "class_name": "الصف الخامس",
    "class_section_id": 5,
    "section_name": "شعبة أ",
    "subject_id": 1,
    "subject_name": "الرياضيات",
    "teacher_id": 3,
    "teacher_name": "أحمد عبد السلام",
    "day_of_week": "sunday",
    "day_of_week_ar": "الأحد",
    "period_slot_id": 1,
    "period_name": "الحصة الأولى",
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
    "academic_year_name": "2025/2026",
    "class_id": 5,
    "class_name": "الصف الخامس",
    "class_section_id": 5,
    "section_name": "شعبة أ",
    "subject_id": 1,
    "subject_name": "الرياضيات",
    "teacher_id": 3,
    "teacher_name": "أحمد عبد السلام",
    "day_of_week": "sunday",
    "day_of_week_ar": "الأحد",
    "period_slot_id": 2,
    "period_name": "الحصة الثانية"
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

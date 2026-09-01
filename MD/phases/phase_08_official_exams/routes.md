# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 08 (Network SSoT)

> **الهدف:** توثيق المسارات الـ 7 كاملة لإدارة وتصفية جدول الامتحانات الرسمية (النصفية والنهائية والدور الثاني) واستعراض جداول الصفوف وجداول مواد المعلمين مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة ومنع التكرار، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم القياسي (`Pagination Meta`) ودعم البحث والترتيب والتصفية.  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف ([`routes.md`](./routes.md)) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Internal Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في هذا الملف حصراً بدون أي اجتهاد شخصي.

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

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `official_exams` | `GET` | `/api/v1/official-exams` | الجميع | استعراض وتصفية وبحث جدول الامتحانات الرسمية بالترقيم والفلترة بالصف والمادة والمعلم |
| **2** | `official_exams` | `GET` | `/api/v1/official-exams/:id` | الجميع | استعراض تفاصيل امتحان رسمي محدد والتعليمات والقاعة |
| **3** | `official_exams` | `GET` | `/api/v1/classes/:class_id/official-exams` | الجميع | استعراض جدول امتحانات الصف الدراسي المعتمد بالسمستر (للعرض والطباعة) |
| **4** | `official_exams` | `GET` | `/api/v1/teachers/:teacher_id/official-exams` | `admin` / `teacher` | استعراض جدول الامتحانات الرسمية لمواد وصفوف معلم محدد |
| **5** | `official_exams` | `POST` | `/api/v1/official-exams` | `admin` | إضافة وجدولة موعد امتحان رسمي لصف ومادة بالسمستر |
| **6** | `official_exams` | `PUT` | `/api/v1/official-exams/:id` | `admin` | تعديل موعد أو تعليمات الامتحان الرسمي القائم |
| **7** | `official_exams` | `DELETE` | `/api/v1/official-exams/:id` | `admin` | حذف وإلغاء امتحان رسمي من الجدول المعتمد |

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

## 📝 الخطوة 1: إدارة جدول الامتحانات الرسمية (`official_exams`) — [مواصفات المسارات]

---

### 1.1 `GET /api/v1/official-exams` — عرض وتصفية قائمة الامتحانات الرسمية

> **الوصف الوظيفي:** استرجاع قائمة سجلات جدول الامتحانات الرسمية بالمنظومة مع دعم الفلترة بالصف الدراسي `class_id` والمادة والسمستر ونوع الامتحان والمعلم والتاريخ والبحث والترقيم (CRUDS - Search & Filter Engine).

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم المادة أو التعليمات (مثال: `الرياضيات` أو `القاعة الكبرى`).
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `academic_term_id` (optional, bigint): تصفية حسب الفصل الدراسي / السمستر.
  - `class_id` (optional, bigint): تصفية الامتحانات حسب الصف الدراسي (مثال: `class_id=3`).
  - `subject_id` (optional, bigint): تصفية الامتحانات حسب المادة الدراسية.
  - `teacher_id` (optional, bigint): تصفية الامتحانات للمواد والصفوف المسندة لمعلم محدد.
  - `exam_type` (optional, string, enum: `midterm`, `final`, `second_round`): تصفية حسب نوع الامتحان الرسمي.
  - `exam_date` (optional, date): تصفية حسب تاريخ يوم الامتحان (`YYYY-MM-DD`).
  - `sort_by` (optional, string, enum: `id`, `exam_date`, `created_at`, default `exam_date`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/official-exams?class_id=3&academic_term_id=1&exam_type=midterm&sort_by=exam_date&sort_order=asc`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة بالهيكل الهرمي الرشيق):
```json
{
  "success": true,
  "message": "تم جلب جدول الامتحانات الرسمية بنجاح.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "academic_term_id": 1,
    "academic_term_name": "الفصل الدراسي الأول",
    "classes": [
      {
        "class_id": 3,
        "class_name": "الصف الخامس",
        "exam_types": [
          {
            "exam_type": "midterm",
            "exam_type_ar": "امتحان نصفي",
            "total_subjects": 2,
            "subjects": [
              {
                "id": 1,
                "subject_id": 2,
                "subject_name": "الرياضيات",
                "exam_date": "2026-11-15",
                "created_at": "2026-10-20T08:00:00Z"
              },
              {
                "id": 2,
                "subject_id": 4,
                "subject_name": "اللغة العربية",
                "exam_date": "2026-11-17",
                "created_at": "2026-10-20T08:30:00Z"
              }
            ]
          },
          {
            "exam_type": "final",
            "exam_type_ar": "امتحان نهائي",
            "total_subjects": 1,
            "subjects": [
              {
                "id": 10,
                "subject_id": 2,
                "subject_name": "الرياضيات",
                "exam_date": "2027-01-10",
                "created_at": "2026-10-20T08:00:00Z"
              }
            ]
          }
        ]
      },
      {
        "class_id": 4,
        "class_name": "الصف السادس",
        "exam_types": [
          {
            "exam_type": "midterm",
            "exam_type_ar": "امتحان نصفي",
            "total_subjects": 1,
            "subjects": [
              {
                "id": 15,
                "subject_id": 2,
                "subject_name": "الرياضيات",
                "exam_date": "2026-11-16",
                "created_at": "2026-10-20T08:00:00Z"
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
  "message": "لا توجد امتحانات رسمية مسجلة تطابق محددات البحث.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "academic_term_id": 1,
    "academic_term_name": "الفصل الدراسي الأول",
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

### 1.2 `GET /api/v1/official-exams/:id` — عرض تفاصيل امتحان رسمي محدد

> **الوصف الوظيفي:** استرجاع البيانات التفصيلية والتوجيهات الخاصة بسجل امتحان رسمي محدد بالمعرف.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب تفاصيل الامتحان الرسمي بنجاح.",
  "data": {
    "id": 1,
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "academic_term_id": 1,
    "term_name": "الفصل الدراسي الأول",
    "class_id": 3,
    "class_name": "الصف الخامس",
    "subject_id": 2,
    "subject_name": "الرياضيات",
    "exam_type": "midterm",
    "exam_type_ar": "امتحان نصفي",
    "exam_date": "2026-11-15",
    "notes": "الامتحان من الساعة 09:00 إلى 11:00 في القاعة الكبرى (ممنوع الآلة الحاسبة).",
    "created_at": "2026-10-20T08:00:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل الامتحان الرسمي غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `GET /api/v1/classes/:class_id/official-exams` — عرض جدول الامتحانات الرسمية لصف دراسي محدد

> **الوصف الوظيفي:** استرجاع جدول الامتحانات المعتمد بالكامل لصف دراسي محدد بالسمستر النشط؛ مخصص للطلاب والمعلمين وأولياء الأمور لعرض وطباعة جدول الامتحانات المجمع للصف.

- **Query Parameters:**
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي.
  - `academic_term_id` (optional, bigint): تصفية حسب الفصل الدراسي / السمستر.
  - `exam_type` (optional, string, enum: `midterm`, `final`, `second_round`): تصفية حسب نوع الامتحان.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب جدول امتحانات الصف الدراسي بنجاح.",
  "data": {
    "class_id": 3,
    "class_name": "الصف الخامس",
    "academic_term_id": 1,
    "academic_term_name": "الفصل الدراسي الأول",
    "exam_types": [
      {
        "exam_type": "midterm",
        "exam_type_ar": "امتحان نصفي",
        "total_exams": 2,
        "exams": [
          {
            "id": 1,
            "subject_id": 2,
            "subject_name": "الرياضيات",
            "exam_date": "2026-11-15",
            "notes": "الامتحان من 09:00 إلى 11:00 بالقاعة الكبرى."
          },
          {
            "id": 2,
            "subject_id": 4,
            "subject_name": "اللغة العربية",
            "exam_date": "2026-11-17",
            "notes": "الامتحان من 09:00 إلى 11:00 بقاعات الصف الخامس."
          }
        ]
      },
      {
        "exam_type": "final",
        "exam_type_ar": "امتحان نهائي",
        "total_exams": 2,
        "exams": [
          {
            "id": 10,
            "subject_id": 2,
            "subject_name": "الرياضيات",
            "exam_date": "2027-01-10",
            "notes": "الامتحان من 09:00 إلى 12:00 بالقاعة الكبرى."
          },
          {
            "id": 11,
            "subject_id": 4,
            "subject_name": "اللغة العربية",
            "exam_date": "2027-01-12",
            "notes": "الامتحان من 09:00 إلى 12:00 بقاعات الصف الخامس."
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

### 1.4 `GET /api/v1/teachers/:teacher_id/official-exams` — عرض جدول الامتحانات الرسمية لمواد معلم محدد

> **الوصف الوظيفي:** استرجاع مواعيد الامتحانات الرسمية للمواد والصفوف المسندة لتدريس المعلم المختار في السمستر النشط (عبر الربط بسجلات `teaching_assignments`).

- **Query Parameters:**
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي.
  - `academic_term_id` (optional, bigint): تصفية حسب الفصل الدراسي / السمستر.
  - `exam_type` (optional, string, enum: `midterm`, `final`, `second_round`): تصفية حسب نوع الامتحان.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب جدول الامتحانات الرسمية لمواد المعلم بنجاح.",
  "data": {
    "teacher_id": 3,
    "teacher_name": "أحمد عبد السلام",
    "total_exams": 2,
    "exams": [
      {
        "id": 1,
        "class_id": 3,
        "class_name": "الصف الخامس",
        "subject_id": 2,
        "subject_name": "الرياضيات",
        "academic_term_name": "الفصل الدراسي الأول",
        "exam_type": "midterm",
        "exam_type_ar": "امتحان نصفي",
        "exam_date": "2026-11-15",
        "notes": "الامتحان من 09:00 إلى 11:00 بالقاعة الكبرى."
      },
      {
        "id": 5,
        "class_id": 4,
        "class_name": "الصف السادس",
        "subject_id": 2,
        "subject_name": "الرياضيات",
        "academic_term_name": "الفصل الدراسي الأول",
        "exam_type": "midterm",
        "exam_type_ar": "امتحان نصفي",
        "exam_date": "2026-11-18",
        "notes": "الامتحان من 09:00 إلى 11:00 بالقاعة 6."
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

### 1.5 `POST /api/v1/official-exams` & `PUT /api/v1/official-exams/:id` — إضافة وتعديل جدولة امتحان رسمي (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** اعتماد وجدولة موعد امتحان رسمي جديد مخصص لصف ومادة بالسمستر (مقتصر على الإدارة)، مع التحقق من عدم تكرار `uq_official_exam_schedule`.
> * **في التعديل (`PUT`):** تحديث موعد الامتحان أو التاريخ أو الملاحظات والإرشادات.

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "academic_year_id": 1,
    "academic_term_id": 1,
    "class_id": 3,
    "subject_id": 2,
    "exam_type": "midterm",
    "exam_date": "2026-11-15",
    "notes": "الامتحان من الساعة 09:00 إلى 11:00 في القاعة الكبرى (ممنوع الآلة الحاسبة)."
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
```json
{
  "success": true,
  "message": "تم إضافة وجدولة الامتحان الرسمي بنجاح.",
  "data": {
    "id": 1,
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "academic_term_id": 1,
    "term_name": "الفصل الدراسي الأول",
    "class_id": 3,
    "class_name": "الصف الخامس",
    "subject_id": 2,
    "subject_name": "الرياضيات",
    "exam_type": "midterm",
    "exam_type_ar": "امتحان نصفي",
    "exam_date": "2026-11-15",
    "notes": "الامتحان من الساعة 09:00 إلى 11:00 في القاعة الكبرى (ممنوع الآلة الحاسبة).",
    "created_at": "2026-10-20T08:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث موعد الامتحان الرسمي بنجاح.",
  "data": {
    "id": 1,
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "academic_term_id": 1,
    "term_name": "الفصل الدراسي الأول",
    "class_id": 3,
    "class_name": "الصف الخامس",
    "subject_id": 2,
    "subject_name": "الرياضيات",
    "exam_type": "midterm",
    "exam_type_ar": "امتحان نصفي",
    "exam_date": "2026-11-16",
    "notes": "تم تعديل الموعد إلى يوم الإثنين من الساعة 09:00 إلى 11:00 بالقاعة الكبرى."
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "سجل الامتحان الرسمي غير موجود."
}
```

##### ⚡ `409 Conflict` (تكرار جدولة المادة بالنوع نفسه):
```json
{
  "success": false,
  "message": "يوجد امتحان رسمي مجدول مسبقاً لهذه المادة والصف بنفس السمستر ونوع الامتحان (uq_official_exam_schedule)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات جدولة الامتحان الرسمي غير صالحة.",
  "errors": {
    "exam_date": ["تاريخ الامتحان مطلوب ويجب أن يكون تاريخاً صحيحاً."],
    "subject_id": ["المادة المحددة غير موجودة أو غير مسندة للصف الدراسي."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.6 `DELETE /api/v1/official-exams/:id` — إلغاء وحذف امتحان رسمي من الجدول

> **الوصف الوظيفي:** حذف وإلغاء امتحان رسمي منطقياً من الجدول المعتمد مع توثيق العملية بسجل التدقيق `audit_logs`.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف الامتحان الرسمي من الجدول بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل الامتحان الرسمي غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

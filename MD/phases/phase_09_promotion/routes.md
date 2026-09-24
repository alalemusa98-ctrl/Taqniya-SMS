# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 09 (Network SSoT)

> **الهدف:** توثيق المسارات الـ 8 كاملة لإدارة أرشفة الصحائف المدرسية (سواء الفترات الدراسية أو الصحيفة السنوية النهائية) ومحرك الترحيل السنوي الجماعي وتنبيهات الشعب المنخفضة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم القياسي (`Pagination Meta`) ودعم البحث والترتيب والتصفية.  
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

### 📋 مصفوفة المسارات الـ 8 الموحدة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `student_transcripts` | `GET` | `/api/v1/transcripts` | `admin` | استعراض وتصفية الصحائف المدرسية المؤرشفة بالترقيم والفلترة |
| **2** | `student_transcripts` | `GET` | `/api/v1/transcripts/:id` | `admin`, `student`, `parent` | استعراض تفاصيل لقطة الصحيفة التجميدية الكاملة وتفاصيل درجات المواد |
| **3** | `student_transcripts` | `GET` | `/api/v1/students/:student_id/transcripts` | `admin`, `student (own)`, `parent (child)` | استعراض السجل التاريخي لكافة صحائف طالب محدد |
| **4** | `student_transcripts` | `POST` | `/api/v1/transcripts/freeze` | `admin` | تجميد وإصدار صحيفة دراسية (فصلية/سنوية) عبر شيت رصد الدرجات |
| **5** | `promotion_batches` | `GET` | `/api/v1/promotions/batches` | `admin` | استعراض سجل دفعات الترحيل السنوي المنفذة بالترقيم |
| **6** | `promotion_batches` | `GET` | `/api/v1/promotions/batches/:id` | `admin` | استعراض تفاصيل وإحصائيات ورسوم بيانية لدفعة ترحيل محددة |
| **7** | `promotion_batches` | `POST` | `/api/v1/promotions/preview` | `admin` | محاكاة ومعاينة نتائج الترحيل وتنبيهات الشعب المنخفضة قبل التنفيذ |
| **8** | `promotion_batches` | `POST` | `/api/v1/promotions/execute` | `admin` | اعتماد وتنفيذ الترحيل السنوي الجماعي وتسكين الطلاب بالعام الجديد |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API الـ 8** بالمرحلة:

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

## 📄 الخطوة 1: أرشفة وتصفح الصحائف المدرسية المؤرشفة (`student_transcripts`) — [4 مسارات]

---

### 1.1 `GET /api/v1/transcripts` — عرض وتصفية الصحائف المدرسية وبطاقات الصفوف التنفيذية

> **الوصف الوظيفي:** استرجاع شبكة بطاقات مؤشرات الصفوف التنفيذية (نسب النجاح، عدادات الناجحين والراسبين والدور الثاني) مع كشف تفصيلي لترتيب طلاب الصف المختار من الأعلى تقييماً إلى الأقل تقييماً عبر كافة الشعب مع دعم الفرز والترقيم الصفحي والفلترة بـ `grade_level` و `class_section_id`.

- **Query Parameters:**
  - `academic_year_name` (optional, string): فلترة باسم العام الدراسي (مثل: `2024/2025`).
  - `transcript_type` (optional, string, enum: `term`, `annual`, default `annual`): تصفية حسب نوع الصحيفة (فصلية أم سنوية).
  - `grade_level` (optional, integer): فلترة مباشرة وسريعة بالمستوى الأكاديمي الرقمي للصف الدراسي المختار (مثل: `5` للصف الخامس لجلب كشف ترتيب طلابه).
  - `class_name` (optional, string): فلترة باسم الصف (مثل: `الصف الخامس`).
  - `class_section_id` (optional, bigint): فلترة اختيارية بمعرف ربط الصف بالشعبة `class_sections.id`.
  - `section_name` (optional, string): فلترة باسم الشعبة الدراسية (مثل: `شعبة أ` أو `شعبة ب`).
  - `class_academic_term_id` (optional, bigint): تصفية حسب الفترة/الفصل الدراسي الخاص بالصف (يرتبط بـ `class_academic_terms.id`، لجلب نتائج فترة محددة للصف مثل الفترة 1 أو 2 أو 3).
  - `final_status` (optional, string, enum: `passed`, `second_round`, `failed`, `graduated`): فلترة حسب قرار النتيجة.
  - `search` (optional, string): البحث النصي باسم الطالب أو رمزه الموحد (`STU-3001`).
  - `sort_by` (optional, string, enum: `percentage`, `total_score`, `rank`, `id`, default `percentage`): حقل الفرز (افتراضياً `percentage` للترتيب التنازلي للمتفوقين).
  - `sort_order` (optional, string, enum: `desc`, `asc`, default `desc`): اتجاه الفرز (افتراضياً `desc` من الأعلى تقييماً إلى الأقل).
  - `page` (optional, integer, default `1`): رقم الصفحة.
  - `per_page` (optional, integer, default `15`): عدد السجلات بالصفحة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب بطاقات مؤشرات الصفوف التنفيذية وكشف ترتيب طلاب الصف المختار):
```json
{
  "success": true,
  "message": "تم جلب مصفوفة الصحائف المدرسية المؤرشفة بنجاح.",
  "data": {
    "academic_year_name": "2024/2025",
    "transcript_type": "annual",
    "transcript_type_ar": "صحيفة سنوية نهائية",
    "classes_summary": [
      {
        "grade_level": 5,
        "class_name": "الصف الخامس",
        "total_students": 97,
        "pass_rate_percentage": 94.85,
        "passed_count": 92,
        "second_round_count": 3,
        "failed_count": 2
      },
      {
        "grade_level": 6,
        "class_name": "الصف السادس",
        "total_students": 88,
        "pass_rate_percentage": 88.64,
        "passed_count": 78,
        "second_round_count": 6,
        "failed_count": 4
      }
    ],
    "selected_class": {
      "grade_level": 5,
      "class_name": "الصف الخامس",
      "total_students": 97
    },
    "transcripts": [
      {
        "id": 1,
        "student_id": 101,
        "student_code": "STU-3001",
        "student_name": "محمد علي الفيتوري",
        "class_section_id": 12,
        "section_name": "شعبة أ",
        "total_score": 985.00,
        "percentage": 98.50,
        "final_status": "passed",
        "final_status_ar": "ناجح ومرحل",
        "rank": 1,
        "created_at": "2025-06-30T10:00:00Z"
      },
      {
        "id": 14,
        "student_id": 114,
        "student_code": "STU-3014",
        "student_name": "فاطمة أحمد التاجوري",
        "class_section_id": 13,
        "section_name": "شعبة ب",
        "total_score": 978.00,
        "percentage": 97.80,
        "final_status": "passed",
        "final_status_ar": "ناجح ومرحل",
        "rank": 2,
        "created_at": "2025-06-30T10:00:00Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 97,
    "last_page": 7
  }
}
```

##### ⚪ `200 OK` (القائمة فارغة):
```json
{
  "success": true,
  "message": "لا توجد صحائف مدرسية مؤرشفة تطابق محددات البحث.",
  "data": {
    "academic_year_name": "2024/2025",
    "transcript_types": []
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

### 1.2 `GET /api/v1/transcripts/:id` — عرض تفاصيل لقطة الصحيفة المؤرشفة الكاملة

> **الوصف الوظيفي:** استرجاع لقطة البيانات التجميدية الكاملة لدرجات الطالب مع درجات أعمال السنة والحد الأقصى لأعمال السنة والامتحان النهائي والدور الثاني.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب لقطة الصحيفة المدرسية بنجاح.",
  "data": {
    "id": 1,
    "student_id": 101,
    "student_code": "STU-3001",
    "student_name": "محمد علي الفيتوري",
    "transcript_type": "term",
    "transcript_type_ar": "صحيفة الفصل الدراسي الأول",
    "class_academic_term_id": 10,
    "academic_year_name": "2024/2025",
    "class_name": "الصف الخامس",
    "section_name": "شعبة أ",
    "grade_level": 5,
    "total_score": 475.00,
    "percentage": 95.00,
    "final_status": "passed",
    "rank": 1,
    "transcript_data": {
      "term_name": "الفصل الدراسي الأول",
      "subjects": [
        {
          "subject_id": 2,
          "subject_name": "الرياضيات",
          "coursework_score": 35.00,
          "max_coursework_score": 40.00,
          "exam_score": 55.00,
          "max_exam_score": 60.00,
          "total_score": 90.00,
          "passing_score": 50.00,
          "max_score": 100.00,
          "status": "passed",
          "second_round_details": null
        },
        {
          "subject_id": 4,
          "subject_name": "اللغة العربية",
          "coursework_score": 38.00,
          "max_coursework_score": 40.00,
          "exam_score": 57.00,
          "max_exam_score": 60.00,
          "total_score": 95.00,
          "passing_score": 50.00,
          "max_score": 100.00,
          "status": "passed",
          "second_round_details": null
        }
      ]
    },
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الصحيفة المؤرشفة غير موجودة."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `GET /api/v1/students/:student_id/transcripts` — عرض جميع الصحائف التاريخية لطالب محدد

> **الوصف الوظيفي:** استرجاع السجل الأكاديمي التاريخي الكامل للطالب عبر جميع الأعوام الدراسية والفصول السابقة مع دعم الفلترة بالسنة الدراسية ونوع الصحيفة والصف الدراسي.

- **Query Parameters:**
  - `academic_year_name` (optional, string): فلترة حسب العام الدراسي (مثل: `2024/2025`).
  - `transcript_type` (optional, string, enum: `term`, `annual`): تصفية حسب نوع الصحيفة (فصلية أم سنوية).
  - `class_name` (optional, string): فلترة حسب الصف الدراسي (مثل: `الصف الخامس`).
  - `sort_by` (optional, string, enum: `id`, `created_at`, `percentage`, default `id`): حقل الفرز.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب السجل التاريخي لصحائف الطالب بنجاح.",
  "data": {
    "student_id": 101,
    "student_name": "محمد علي الفيتوري",
    "total_transcripts": 3,
    "transcripts": [
      {
        "id": 1,
        "transcript_type": "annual",
        "transcript_type_ar": "صحيفة سنوية نهائية",
        "academic_year_name": "2024/2025",
        "class_name": "الصف الخامس",
        "section_name": "شعبة أ",
        "percentage": 95.00,
        "final_status": "passed"
      },
      {
        "id": 2,
        "transcript_type": "term",
        "transcript_type_ar": "صحيفة الفصل الثاني",
        "academic_year_name": "2024/2025",
        "class_name": "الصف الخامس",
        "section_name": "شعبة أ",
        "percentage": 96.00,
        "final_status": "passed"
      },
      {
        "id": 3,
        "transcript_type": "term",
        "transcript_type_ar": "صحيفة الفصل الأول",
        "academic_year_name": "2024/2025",
        "class_name": "الصف الخامس",
        "section_name": "شعبة أ",
        "percentage": 94.00,
        "final_status": "passed"
      }
    ]
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الطالب غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `POST /api/v1/transcripts/freeze` — تجميد وإصدار صحيفة دراسية (فصلية أو سنوية)

> **الوصف الوظيفي:** اعتماد وتجميد نتيجة طالب لفصل محدد أو لعام كامل وحفظ لقطة الدرجات JSON التي تتضمن الحد الأقصى لأعمال السنة والامتحان النهائي والدور الثاني.

- **Request Body (مثال صحيفة فصل دراسي مع مادة دور ثاني):**
  ```json
  {
    "student_id": 101,
    "transcript_type": "term",
    "class_academic_term_id": 10,
    "academic_year_name": "2024/2025",
    "class_name": "الصف الخامس",
    "section_name": "شعبة أ",
    "grade_level": 5,
    "total_score": 380.00,
    "percentage": 76.00,
    "final_status": "second_round",
    "rank": 15,
    "transcript_data": {
      "term_name": "الفصل الدراسي الأول",
      "subjects": [
        {
          "subject_id": 2,
          "subject_name": "الرياضيات",
          "coursework_score": 15.00,
          "max_coursework_score": 40.00,
          "exam_score": 25.00,
          "max_exam_score": 60.00,
          "total_score": 40.00,
          "passing_score": 50.00,
          "max_score": 100.00,
          "status": "second_round",
          "second_round_details": {
            "second_round_exam_score": 35.00,
            "max_second_round_score": 60.00,
            "new_total_score": 50.00,
            "second_round_status": "passed",
            "exam_date": "2025-02-10"
          }
        }
      ]
    }
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تم تجميد وإصدار الصحيفة المدرسية بنجاح.",
  "data": {
    "id": 1,
    "student_id": 101,
    "transcript_type": "term",
    "academic_year_name": "2024/2025",
    "final_status": "second_round",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "تم إصدار وتجميد صحيفة معتمدة مسبقاً لهذا الطالب بنفس النوع والفترة (uq_student_transcript_term)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات إصدار الصحيفة غير صالحة.",
  "errors": {
    "transcript_data": ["بيانات درجات المواد مطلوبة ويجب أن تكون مصفوفة صالحة."],
    "total_score": ["المجموع الكلي مطلوب وقيمة رقمية صحيحة."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

## 🚀 الخطوة 2: محرك الترحيل الأكاديمي الجماعي (`promotion_batches`) — [4 مسارات]

---

### 2.1 `GET /api/v1/promotions/batches` — عرض سجل ودفعات الترحيل السنوي المنفذة

> **الوصف الوظيفي:** استرجاع سجل دفعات الترحيل السنوي المعتمدة بالإدارة مع الترقيم القياسي.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب سجل دفعات الترحيل بنجاح.",
  "data": [
    {
      "id": 1,
      "from_academic_year_id": 1,
      "from_academic_year_name": "2024/2025",
      "to_academic_year_id": 2,
      "to_academic_year_name": "2025/2026",
      "executed_by_name": "مدير النظام",
      "total_students": 500,
      "total_promoted": 450,
      "total_second_round": 30,
      "total_retained": 20,
      "total_graduated": 0,
      "overall_passing_rate": 90.00,
      "created_at": "2025-07-01T12:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 1,
    "last_page": 1
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.2 `GET /api/v1/promotions/batches/:id` — عرض تفاصيل وإحصائيات دفعة ترحيل محددة

> **الوصف الوظيفي:** استرجاع الإحصائيات الشاملة ونسب نجاح الصفوف لدفعة ترحيل معينة بالمعرف.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب تفاصيل دفعة الترحيل بنجاح.",
  "data": {
    "id": 1,
    "from_academic_year_id": 1,
    "from_academic_year_name": "2024/2025",
    "to_academic_year_id": 2,
    "to_academic_year_name": "2025/2026",
    "executed_by_name": "مدير النظام",
    "total_students": 500,
    "total_promoted": 450,
    "total_second_round": 30,
    "total_retained": 20,
    "total_graduated": 0,
    "overall_passing_rate": 90.00,
    "class_statistics": [
      {
        "class_name": "الصف الرابع",
        "total": 100,
        "promoted": 95,
        "retained": 5,
        "pass_rate": 95.00
      },
      {
        "class_name": "الصف الخامس",
        "total": 120,
        "promoted": 110,
        "retained": 10,
        "pass_rate": 91.66
      }
    ],
    "execution_notes": "تم الترحيل السنوي بنجاح.",
    "created_at": "2025-07-01T12:00:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل دفعة الترحيل غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.3 `POST /api/v1/promotions/preview` — معاينة واختبار نتائج الترحيل وتنبيهات الشعب قبل التنفيذ

> **الوصف الوظيفي:** محاكاة عملية الترحيل وعرض توزيع الطلاب وتحديد الشعب ذات السعة المنخفضة (أقل من 10 طلاب) وإرجاع مصفوفة التنبيهات `low_enrollment_warnings` بناءً على خيار التعويض التراكمي السنوي المختار.

- **Request Body:**
  ```json
  {
    "from_academic_year_id": 1,
    "to_academic_year_id": 2,
    "enable_annual_exam_compensation": false
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم معاينة نتائج الترحيل وتوليد تنبيهات الشعب بنجاح.",
  "data": {
    "summary": {
      "total_students": 500,
      "to_be_promoted": 450,
      "second_round": 30,
      "retained": 20
    },
    "promotion_mapping_examples": [
      { "source": "الصف الخامس - شعبة أ", "target": "الصف السادس - شعبة أ", "students_count": 25 },
      { "source": "الصف الخامس - شعبة ب", "target": "الصف السادس - شعبة ب", "students_count": 28 },
      { "source": "الصف الخامس - شعبة ج", "target": "الصف السادس - شعبة ج", "students_count": 28 }
    ],
    "low_enrollment_warnings": [
      {
        "class_name": "الصف السادس",
        "section_name": "شعبة د",
        "students_count": 7,
        "warning_message": "الشعبة (السادس/د) تحتوي على عدد طلاب منخفض جداً (7 طلاب - أقل من الحد الأدنى المقترح 10 طلاب). تتيح المنظومة خيار الإبقاء أو الدمج اليدوي."
      }
    ]
  }
}
```

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "العام الدراسي المختار مرحل مسبقاً أو غير صالح للترحيل."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات المعاينة غير صالحة.",
  "errors": {
    "from_academic_year_id": ["العام الدراسي المرحل منه مطلوب."],
    "to_academic_year_id": ["العام الدراسي المرحل إليه مطلوب."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.4 `POST /api/v1/promotions/execute` — اعتماد وتنفيذ الترحيل السنوي الجماعي

> **الوصف الوظيفي:** التنفيذ الذري الحازم للترحيل الجماعي وتسكين الطلاب بالعام الجديد طبقاً لسياسة الاحتساب المعتمدة.

- **Request Body:**
  ```json
  {
    "from_academic_year_id": 1,
    "to_academic_year_id": 2,
    "enable_annual_exam_compensation": false,
    "execution_notes": "تم الترحيل الجماعي السنوي بنجاح طبق قرار لجنة الامتحانات."
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تنفيذ واكتمال عملية الترحيل الأكاديمي الجماعي بنجاح.",
  "data": {
    "batch_id": 1,
    "total_processed": 500,
    "executed_at": "2025-07-01T12:00:00Z"
  }
}
```

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "تم تنفيذ دفعة ترحيل معتمدة مسبقاً بين هذين العامين (uq_promotion_batch_years)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "فشل التحقق من مدخلات تنفيذ الترحيل الجماعي.",
  "errors": {
    "from_academic_year_id": ["العام الدراسي المرحل منه غير موجود أو مغلق مسبقاً."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

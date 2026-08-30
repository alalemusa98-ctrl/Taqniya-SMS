# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 09 (Network SSoT)

> **الهدف:** توثيق المسارات الـ 8 كاملة لإدارة أرشفة الصحائف المدرسية (سواء الفترات الدراسية أو الصحيفة السنوية النهائية) ومحرك الترحيل السنوي الجماعي وتنبيهات الشعب المنخفضة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
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

## 📄 الخطوة 1: أرشفة وتصفح الصحائف المدرسية المؤرشفة (`student_transcripts`) — [4 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لـ أرشفة الصحائف:**
> 1. **دعم صحائف السمسترات والصحيفة السنوية (`transcript_type`):** يدعم النظام تجميد وأرشفة صحيفة فصل دراسي محدد (`transcript_type = 'term'`) أو صحيفة سنوية مجمعة نهائية (`transcript_type = 'annual'`).
> 2. **الدقة الكاملة للـ JSON (`max_coursework_score` & `max_exam_score`):** تتضمن لقطة كل مادة بالـ JSON درجة أعمال السنة، المجموع الأقصى لأعمال السنة (مثل 35 من 40)، درجة الامتحان النهائي، المجموع الأقصى للامتحان النهائي (مثل 55 من 60)، وتفاصيل امتحانات الدور الثاني عند وجودها.
> 3. **قيد التفرد السنوي للفترة (`uq_student_transcript_term`):** يضمن تجميد صحيفة واحدة فقط لكل طالب بالسمستر أو السنة.

---

### 1.1 `GET /api/v1/transcripts` — عرض وتصفية الصحائف المدرسية المؤرشفة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع سجلات الصحائف المدرسية المؤرشفة بالمنظومة مع دعم الفلترة بنوع الصحيفة (`transcript_type`)، اسم العام الدراسي، اسم الصف، حالة النتيجة النهائية، والترتيب والترقيم الصفحي (CRUDS Engine).

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم الطالب أو رمزه الموحد (`STU-3001`).
  - `transcript_type` (optional, string, enum: `term`, `annual`): تصفية حسب نوع الصحيفة (فصلية أم سنوية).
  - `academic_year_name` (optional, string): فلترة باسم العام الدراسي (مثل: `2024/2025`).
  - `class_name` (optional, string): فلترة باسم الصف (مثل: `الصف الخامس`).
  - `final_status` (optional, string, enum: `passed`, `second_round`, `failed`, `graduated`): فلترة حسب قرار النتيجة.
  - `sort_by` (optional, string, enum: `id`, `total_score`, `percentage`, default `id`): حقل الفرز.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة.
  - `per_page` (optional, integer, default `15`): عدد السجلات بالصفحة.
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة الصحائف المدرسية بنجاح.",
      "data": [
        {
          "id": 1,
          "student_id": 101,
          "student_code": "STU-3001",
          "student_name": "محمد علي الفيتوري",
          "transcript_type": "annual",
          "transcript_type_ar": "صحيفة سنوية نهائية",
          "class_academic_term_id": null,
          "academic_year_name": "2024/2025",
          "class_name": "الصف الخامس",
          "section_name": "شعبة أ",
          "grade_level": 5,
          "total_score": 950.00,
          "percentage": 95.00,
          "final_status": "passed",
          "final_status_ar": "ناجح ومرحل",
          "rank": 1,
          "created_at": "2025-06-30T10:00:00Z"
        },
        {
          "id": 2,
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
          "final_status_ar": "ناجح بالفصل",
          "rank": 1,
          "created_at": "2025-01-15T10:00:00Z"
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

### 1.2 `GET /api/v1/transcripts/:id` — عرض تفاصيل لقطة الصحيفة المؤرشفة الكاملة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع لقطة البيانات التجميدية الكاملة لدرجات الطالب مع درجات أعمال السنة والحد الأقصى لأعمال السنة والامتحان النهائي والدور الثاني.

- **Response Payloads:**
  - **`200 OK`:**
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
  - **`404 Not Found`:** `{"success": false, "message": "الصحيفة المؤرشفة غير موجودة."}`

---

### 1.3 `GET /api/v1/students/:student_id/transcripts` — عرض جميع الصحائف التاريخية لطالب محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع السجل الأكاديمي التاريخي الكامل للطالب عبر جميع الأعوام الدراسية والفصول السابقة مع إرجاع أمثلة لصحائف فصلية وسنوية.

- **Response Payloads:**
  - **`200 OK`:**
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
  - **`404 Not Found`:** `{"success": false, "message": "الطالب غير موجود."}`

---

### 1.4 `POST /api/v1/transcripts/freeze` — تجميد وإصدار صحيفة دراسية (فصلية أو سنوية)

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** اعتماد وتجميد نتيجة طالب لفصل محدد أو لعام كامل وحفظ لقطة الدرجات JSON التي تتضمن الحد الأقصى لأعمال السنة والامتحان النهائي والدور الثاني.

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
- **Response Payloads:**
  - **`201 Created`:**
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
  - **`409 Conflict`:** `{"success": false, "message": "تم إصدار وتجميد صحيفة معتمدة مسبقاً لهذا الطالب بنفس النوع والفترة (uq_student_transcript_term)."}`

---

## 🚀 الخطوة 2: محرك الترحيل الأكاديمي الجماعي (`promotion_batches`) — [4 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لـ الترحيل الجماعي:**
> 1. **سياسة النقل المباشر لرموز الشعب (Direct Section Mapping):** الناجحون من (5/أ) يتسكنون بـ (6/أ)، و (5/ب) بـ (6/ب)، و (5/ج) بـ (6/ج).
> 2. **تنبيه السعة المنخفضة لشعب الراسبين (Low Enrollment Alert):** إذا كانت هناك شعبة تحتوي على عدد طلاب قليل جداً (مثل 7 طلاب راسبين في 6/د)، تُبقى الشعبة كما هي مع إصدار إشعار تنبيه برتقالي للإدارة في نتائج المعاينة.

---

### 2.1 `GET /api/v1/promotions/batches` — عرض سجل ودفعات الترحيل السنوي المنفذة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع سجل دفعات الترحيل السنوي المعتمدة بالإدارة مع إرجاع مثالين محددين لدفعتين تاريخيتين.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب سجل دفعات الترحيل بنجاح.",
      "data": [
        {
          "id": 1,
          "from_academic_year_name": "2024/2025",
          "to_academic_year_name": "2025/2026",
          "executed_by_name": "مدير النظام",
          "total_students": 500,
          "total_promoted": 450,
          "total_second_round": 30,
          "total_retained": 20,
          "overall_passing_rate": 90.00,
          "created_at": "2025-07-01T12:00:00Z"
        },
        {
          "id": 2,
          "from_academic_year_name": "2023/2024",
          "to_academic_year_name": "2024/2025",
          "executed_by_name": "مدير النظام",
          "total_students": 480,
          "total_promoted": 440,
          "total_second_round": 25,
          "total_retained": 15,
          "overall_passing_rate": 91.66,
          "created_at": "2024-07-01T12:00:00Z"
        }
      ]
    }
    ```

---

### 2.2 `GET /api/v1/promotions/batches/:id` — عرض تفاصيل وإحصائيات دفعة ترحيل محددة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع الإحصائيات الشاملة ونسب نجاح الصفوف لدفعة ترحيل معينة.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تفاصيل دفعة الترحيل بنجاح.",
      "data": {
        "id": 1,
        "from_academic_year_name": "2024/2025",
        "to_academic_year_name": "2025/2026",
        "executed_by_name": "مدير النظام",
        "total_students": 500,
        "total_promoted": 450,
        "overall_passing_rate": 90.00,
        "class_statistics": [
          {
            "class_name": "الصف الرابع",
            "total": 100,
            "promoted": 95,
            "retained": 5,
            "pass_rate": 95.00
          }
        ]
      }
    }
    ```

---

### 2.3 `POST /api/v1/promotions/preview` — معاينة واختبار نتائج الترحيل وتنبيهات الشعب قبل التنفيذ

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** محاكاة عملية الترحيل وعرض قائمة توزيع الطلاب وتحديد الشعب ذات السعة المنخفضة (أقل من 10 طلاب) وإرجاع مصفوفة التنبيهات `low_enrollment_warnings`.

- **Request Body:**
  ```json
  {
    "from_academic_year_id": 1,
    "to_academic_year_id": 2
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
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

---

### 2.4 `POST /api/v1/promotions/execute` — اعتماد وتنفيذ الترحيل السنوي الجماعي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** التنفيذ الذري الحازم للترحيل الجماعي وتسكين الطلاب بالعام الجديد.

- **Request Body:**
  ```json
  {
    "from_academic_year_id": 1,
    "to_academic_year_id": 2,
    "execution_notes": "تم الترحيل الجماعي السنوي بنجاح طبق قرار لجنة الامتحانات."
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
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
  - **`409 Conflict`:** `{"success": false, "message": "تم تنفيذ دفعة ترحيل معتمدة مسبقاً بين هذين العامين (uq_promotion_batch_years)."}`

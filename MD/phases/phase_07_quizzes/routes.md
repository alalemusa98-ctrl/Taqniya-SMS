# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 07 (Network SSoT)

> **الهدف:** توثيق المسارات الـ 8 كاملة لإدارة وتصفية الاختبارات الدورية والتطبيقات الشهرية والمرفقات مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
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

## 📝 الخطوة 1: إدارة التطبيقات والاختبارات الدورية (`quizzes`) — [8 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لـ التطبيقات والاختبارات الدورية:**
> 1. **تقييد صلاحيات المعلم (Scoped RBAC):** ينشئ ويعدل المعلم التطبيقات الشهرية حصراً للمواد والشعب الموكلة إليه بإسناد التدريس (`teaching_assignments`).
> 2. **المساندة الإدارية:** يحق لمدير النظام (`role_type = 'admin'`) إنشاء وتعديل التطبيقات نيابة عن المعلمين، ويسجل حقل `created_by_user_id` معرف الفاعل الحقيقي للتدقيق بسجل `audit_logs`.
> 3. **تصفية الصفوف والشعب:** يدعم النظام تصفية التطبيقات على مستوى الصف الدراسي `class_id` (بغض النظر عن الشعبة) لتسهيل استعراض جدول الاختبارات الدورية للمستوى كامل، وعلى مستوى الشعبة المحددة `class_section_id`.
> 4. **دعم المرفقات الرقمية (`JSON Attachments`):** يتضمن كائن التطبيق مصفوفة مرفقات JSON لرفع نماذج الأسئلة وملخصات المراجعة المسبقة.

---

### 1.1 `GET /api/v1/quizzes` — عرض وتصفية قائمة التطبيقات والاختبارات الدورية

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة التطبيقات والاختبارات الدورية المسجلة بالمنظومة مع دعم الفلترة بالصف الدراسي `class_id` والشعبة والسمستر والمادة والمعلم وتاريخ التطبيق (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي بعنوان التطبيق أو وصف الموضوعات (مثال: `تطبيق شهري 1`).
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `academic_term_id` (optional, bigint): تصفية حسب الفصل الدراسي / السمستر.
  - `class_id` (optional, bigint): تصفية التطبيقات حسب الصف الدراسي (مثال: `الصف الخامس` بغض النظر عن الشعبة).
  - `class_section_id` (optional, bigint): تصفية حسب الشعبة الدراسية المحددة.
  - `teaching_assignment_id` (optional, bigint): تصفية حسب إسناد مادة ومعلم محدد.
  - `teacher_id` (optional, bigint): تصفية التطبيقات الصادرة عن معلم محدد.
  - `quiz_date` (optional, date): تصفية التطبيقات المقررة في تاريخ محدد (`YYYY-MM-DD`).
  - `sort_by` (optional, string, enum: `id`, `quiz_date`, `created_at`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/quizzes?class_id=3&academic_term_id=1&sort_by=quiz_date&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة التطبيقات والاختبارات الدورية بنجاح.",
      "data": [
        {
          "id": 1,
          "academic_year_id": 1,
          "academic_term_id": 1,
          "term_name": "الفصل الدراسي الأول",
          "class_id": 3,
          "class_name": "الصف الخامس",
          "class_section_id": 5,
          "section_name": "شعبة أ",
          "teaching_assignment_id": 10,
          "subject_name": "الرياضيات",
          "teacher_name": "أحمد عبد السلام",
          "created_by_user_id": 3,
          "created_by_name": "أحمد عبد السلام",
          "title": "تطبيق شهري 1 - الجبر والمعادلات",
          "description": "اختبار تحريري مدته 20 دقيقة يشمل الوحدة الأولى من صفحة 5 إلى 25.",
          "attachments": [
            {
              "file_name": "quiz_1_review_summary.pdf",
              "file_url": "https://storage.taqniya.ly/quizzes/rev_101.pdf",
              "file_type": "application/pdf"
            }
          ],
          "quiz_date": "2026-10-05",
          "created_at": "2026-09-28T09:00:00Z"
        },
        {
          "id": 2,
          "academic_year_id": 1,
          "academic_term_id": 1,
          "term_name": "الفصل الدراسي الأول",
          "class_id": 3,
          "class_name": "الصف الخامس",
          "class_section_id": 6,
          "section_name": "شعبة ب",
          "teaching_assignment_id": 12,
          "subject_name": "اللغة العربية",
          "teacher_name": "سالم خليفة",
          "created_by_user_id": 4,
          "created_by_name": "سالم خليفة",
          "title": "تطبيق النحو والقواعد الشهر الأول",
          "description": "اختبار قصير في الإعراب والجملة الاسمية والفعلية.",
          "attachments": [],
          "quiz_date": "2026-10-06",
          "created_at": "2026-09-29T10:00:00Z"
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

### 1.2 `GET /api/v1/quizzes/:id` — عرض تفاصيل تطبيق/اختبار دوري محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع البيانات التفصيلية والمناطق المقررة للتطبيق والمرفقات.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تفاصيل التطبيق الدوري بنجاح.",
      "data": {
        "id": 1,
        "academic_year_id": 1,
        "academic_term_id": 1,
        "term_name": "الفصل الدراسي الأول",
        "class_id": 3,
        "class_name": "الصف الخامس",
        "class_section_id": 5,
        "section_name": "شعبة أ",
        "teaching_assignment_id": 10,
        "subject_name": "الرياضيات",
        "teacher_name": "أحمد عبد السلام",
        "created_by_user_id": 3,
        "created_by_name": "أحمد عبد السلام",
        "title": "تطبيق شهري 1 - الجبر والمعادلات",
        "description": "اختبار تحريري مدته 20 دقيقة يشمل الوحدة الأولى من صفحة 5 إلى 25.",
        "attachments": [
          {
            "file_name": "quiz_1_review_summary.pdf",
            "file_url": "https://storage.taqniya.ly/quizzes/rev_101.pdf",
            "file_type": "application/pdf"
          }
        ],
        "quiz_date": "2026-10-05",
        "created_at": "2026-09-28T09:00:00Z"
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "التطبيق الدوري غير موجود."}`

---

### 1.3 `GET /api/v1/sections/:section_id/quizzes` — عرض جميع تطبيقات شعبة محددة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع جدول وقائمة التطبيقات الشهرية المحددة لشعبة دراسية بالسمستر النشط مع إرجاع 3 أمثلة حقيقية متنوعة.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تطبيقات الشعبة بنجاح.",
      "data": {
        "class_section_id": 5,
        "class_name": "الصف الخامس",
        "section_name": "شعبة أ",
        "total_quizzes": 3,
        "quizzes": [
          {
            "id": 1,
            "teaching_assignment_id": 10,
            "subject_name": "الرياضيات",
            "teacher_name": "أحمد عبد السلام",
            "title": "تطبيق شهري 1 - الجبر والمعادلات",
            "description": "اختبار تحريري مدته 20 دقيقة يشمل الوحدة الأولى.",
            "quiz_date": "2026-10-05"
          },
          {
            "id": 3,
            "teaching_assignment_id": 12,
            "subject_name": "اللغة العربية",
            "teacher_name": "سالم خليفة",
            "title": "تطبيق النحو والقواعد الشهر الأول",
            "description": "اختبار في الإعراب والمبتدأ والخبر.",
            "quiz_date": "2026-10-07"
          },
          {
            "id": 5,
            "teaching_assignment_id": 15,
            "subject_name": "العلوم العامة",
            "teacher_name": "فاطمة المهدي",
            "title": "تطبيق أحياء 1 - أجزاء الخلية",
            "description": "اختبار في أسس رسم ووظائف أعضاء الخلية.",
            "quiz_date": "2026-10-10"
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الشعبة الدراسية غير موجودة."}`

---

### 1.4 `GET /api/v1/classes/:class_id/quizzes` — عرض جميع تطبيقات صف دراسي محدد (بغض النظر عن الشعبة)

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** مسار مخصص يتيح للإدارة والواجهات استرجاع جدول التطبيقات الشهري الشامل لجميع شعب صف دراسي محدد (مثل: الصف الخامس) بالسمستر النشط.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تطبيقات الصف الدراسي بنجاح.",
      "data": {
        "class_id": 3,
        "class_name": "الصف الخامس",
        "total_quizzes": 3,
        "quizzes": [
          {
            "id": 1,
            "class_section_id": 5,
            "section_name": "شعبة أ",
            "subject_name": "الرياضيات",
            "teacher_name": "أحمد عبد السلام",
            "title": "تطبيق شهري 1 - الجبر والمعادلات",
            "quiz_date": "2026-10-05"
          },
          {
            "id": 2,
            "class_section_id": 6,
            "section_name": "شعبة ب",
            "subject_name": "اللغة العربية",
            "teacher_name": "سالم خليفة",
            "title": "تطبيق النحو والقواعد الشهر الأول",
            "quiz_date": "2026-10-06"
          },
          {
            "id": 4,
            "class_section_id": 5,
            "section_name": "شعبة أ",
            "subject_name": "اللغة الإنجليزية",
            "teacher_name": "مريم الفيتوري",
            "title": "Quiz 1 - Grammar & Vocabulary",
            "quiz_date": "2026-10-08"
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`

---

### 1.5 `GET /api/v1/teachers/:teacher_id/quizzes` — عرض التطبيقات المنشأة بواسطة معلم محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع جميع التطبيقات والاختبارات الدورية الصادرة عن معلم محدد عبر الشعب والصفوف المختلفة التي يدرسها، مع إرجاع 3 أمثلة حقيقية في الـ Payload.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تطبيقات المعلم بنجاح.",
      "data": {
        "teacher_id": 3,
        "teacher_name": "أحمد عبد السلام",
        "total_quizzes": 3,
        "quizzes": [
          {
            "id": 1,
            "class_section_id": 5,
            "class_name": "الصف الخامس",
            "section_name": "شعبة أ",
            "teaching_assignment_id": 10,
            "subject_name": "الرياضيات",
            "title": "تطبيق شهري 1 - الجبر والمعادلات",
            "quiz_date": "2026-10-05"
          },
          {
            "id": 6,
            "class_section_id": 6,
            "class_name": "الصف الخامس",
            "section_name": "شعبة ب",
            "teaching_assignment_id": 11,
            "subject_name": "الرياضيات",
            "title": "تطبيق شهري 1 - الجبر والمعادلات",
            "quiz_date": "2026-10-05"
          },
          {
            "id": 9,
            "class_section_id": 9,
            "class_name": "الصف السادس",
            "section_name": "شعبة أ",
            "teaching_assignment_id": 18,
            "subject_name": "الهندسة والقياس",
            "title": "تطبيق هندسة 1 - مساحات الأشكال الهندسية",
            "quiz_date": "2026-10-12"
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "المعلم غير موجود."}`

---

### 1.6 `POST /api/v1/quizzes` — إنشاء ونشر تطبيق/اختبار دوري جديد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** جدولة وإدراج تطبيق دوري جديد وتحديد تفاصيله ومواضيعه وموعد إجرائه بالفصل، مع التحقق من أن المعلم مسند له تدريس الشعبة والمادة.

- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "academic_term_id": 1,
    "class_section_id": 5,
    "teaching_assignment_id": 10,
    "title": "تطبيق شهري 1 - الجبر والمعادلات",
    "description": "اختبار تحريري مدته 20 دقيقة يشمل الوحدة الأولى من صفحة 5 إلى 25.",
    "attachments": [
      {
        "file_name": "quiz_1_review_summary.pdf",
        "file_url": "https://storage.taqniya.ly/quizzes/rev_101.pdf",
        "file_type": "application/pdf"
      }
    ],
    "quiz_date": "2026-10-05"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إنشاء ونشر التطبيق الدوري بنجاح.",
      "data": {
        "id": 1,
        "academic_year_id": 1,
        "academic_term_id": 1,
        "class_section_id": 5,
        "teaching_assignment_id": 10,
        "created_by_user_id": 3,
        "title": "تطبيق شهري 1 - الجبر والمعادلات",
        "description": "اختبار تحريري مدته 20 دقيقة يشمل الوحدة الأولى من صفحة 5 إلى 25.",
        "attachments": [
          {
            "file_name": "quiz_1_review_summary.pdf",
            "file_url": "https://storage.taqniya.ly/quizzes/rev_101.pdf",
            "file_type": "application/pdf"
          }
        ],
        "quiz_date": "2026-10-05",
        "created_at": "2026-09-28T09:00:00Z"
      }
    }
    ```
  - **`403 Forbidden`:** `{"success": false, "message": "غير مصرح لك بنشر تطبيق لشعبة أو مادة غير موكلة إليك بالإسناد الرسمي."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من مدخلات التطبيق الدوري.",
      "errors": { "quiz_date": ["تاريخ إجراء التطبيق يجب أن يكون تاريخاً مستقبلياً أو يطابق اليوم."] }
    }
    ```

---

### 1.7 `PUT /api/v1/quizzes/:id` — تعديل مواضيع ومرفقات وموعد إجراء تطبيق/اختبار دوري

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث عنوان أو تفاصيل أو مرفقات أو موعد إجراء تطبيق دوري قائمة.

- **Request Body:**
  ```json
  {
    "title": "تطبيق شهري 1 المحدث - الجبر والهندسة",
    "description": "تم تعديل الموعد وإضافة تمارين الهندسة للاختبار.",
    "attachments": [
      {
        "file_name": "quiz_1_updated_review.pdf",
        "file_url": "https://storage.taqniya.ly/quizzes/rev_102.pdf",
        "file_type": "application/pdf"
      }
    ],
    "quiz_date": "2026-10-07"
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث بيانات التطبيق الدوري بنجاح.",
      "data": {
        "id": 1,
        "title": "تطبيق شهري 1 المحدث - الجبر والهندسة",
        "description": "تم تعديل الموعد وإضافة تمارين الهندسة للاختبار.",
        "quiz_date": "2026-10-07"
      }
    }
    ```
  - **`403 Forbidden`:** `{"success": false, "message": "ليس لديك الصلاحية لتعديل هذا التطبيق."}`
  - **`404 Not Found`:** `{"success": false, "message": "التطبيق الدوري غير موجود."}`

---

### 1.8 `DELETE /api/v1/quizzes/:id` — إلغاء وحذف تطبيق/اختبار دوري من المنظومة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إلغاء وحذف التطبيق الدوري منطقياً مع توثيق العملية بسجل التدقيق `audit_logs`.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف التطبيق الدوري بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "ليس لديك الصلاحية لحذف هذا التطبيق."}`
  - **`404 Not Found`:** `{"success": false, "message": "التطبيق الدوري غير موجود."}`

# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 07 (Network SSoT)

> **الهدف:** توثيق المسارات الـ 4 الأساسية والمركزية لإدارة وجدولة ونشر الاختبارات والتطبيقات الدورية والشهرية (`quizzes`) والمرفقات والمراجعات مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة ومنع التكرار، وتزويد مسارات جلب القوائم باستجابات هرمية منظمة وموجزة (`classes -> sections -> quizzes`) ومحصورة بالترقيم القياسي (`Pagination Meta`) والفصل الدراسي النشط لحماية أداء الخادم وقاعدة البيانات.  
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

### 📋 مصفوفة المسارات الـ 4 الموحدة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `quizzes` | `GET` | `/api/v1/quizzes` | `admin` / `teacher` / `student` / `parent` | استعراض وتصفية وبحث قائمة الاختبارات والتطبيقات بالترقيم والهيكلة الهرمية |
| **2** | `quizzes` | `GET` | `/api/v1/quizzes/:id` | `admin` / `teacher` / `student` / `parent` | استعراض التفاصيل الكاملة والمرفقات والمواضيع لاختبار/تطبيق محدد |
| **3** | `quizzes` | `POST` | `/api/v1/quizzes` | `admin` / `teacher` | جدولة ونشر اختبار/تطبيق دوري جديد مع المرفقات وتاريخ الإجراء |
| **4** | `quizzes` | `PUT` | `/api/v1/quizzes/:id` | `admin` / `teacher (creator/assigned)` | تعديل وتحديث تفاصيل أو موعد أو مرفقات اختبار/تطبيق دوري |
| **5** | `quizzes` | `DELETE` | `/api/v1/quizzes/:id` | `admin` / `teacher (creator/assigned)` | حذف وإلغاء اختبار/تطبيق دوري من المنظومة (Soft Delete) |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API** بالمرحلة:

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

## 📝 الخطوة 1: إدارة الاختبارات والتطبيقات الدورية (`quizzes`) — [مواصفات المسارات]

---

### 1.1 `GET /api/v1/quizzes` — عرض وتصفية قائمة الاختبارات والتطبيقات بالترقيم والهيكلة الهرمية

> **الوصف الوظيفي:** استرجاع مصفوفة الاختبارات والتطبيقات الدورية بالترقيم المحصور والفرز والبحث، مجمعة هرمياً (`classes -> sections -> quizzes`)، مع دعم الفلترة الدقيقة بالصف الدراسي `class_id` والشعبة `class_section_id` والمعلم `teacher_id` والمادة `subject_id` وحالة الموعد `status`، مع حصر الاستعلام افتراضياً بالفصل الدراسي النشط.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي بعنوان التطبيق أو موضوع الاختبار.
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `academic_term_id` (optional, bigint): تصفية حسب الفصل الدراسي / السمستر (افتراضياً السمستر النشط).
  - `class_id` (optional, bigint): تصفية الاختبارات حسب الصف الدراسي (لكافة شُعبه).
  - `class_section_id` (optional, bigint): تصفية حسب الشعبة الدراسية المحددة.
  - `teacher_id` (optional, bigint): تصفية الاختبارات المجدولة بواسطة معلم محدد.
  - `subject_id` (optional, bigint): تصفية حسب المادة التعليمية.
  - `teaching_assignment_id` (optional, bigint): تصفية حسب إسناد تدريس محدد.
  - `status` (optional, string, enum: `upcoming`, `completed`, `all`, default `upcoming`): تصفية التطبيقات القادمة أو المنفذة.
  - `quiz_date` (optional, date): تصفية التطبيقات المجدولة في تاريخ محدد (`YYYY-MM-DD`).
  - `sort_by` (optional, string, enum: `id`, `quiz_date`, default `quiz_date`): حقل الترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/quizzes?class_id=5&status=upcoming&sort_by=quiz_date&sort_order=asc&page=1&per_page=15`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب مصفوفة التطبيقات الهرمية بالترقيم):
```json
{
  "success": true,
  "message": "تم جلب مصفوفة الاختبارات والتطبيقات الدورية بنجاح.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "academic_term_id": 1,
    "academic_term_name": "الفصل الدراسي الأول",
    "classes": [
      {
        "class_id": 5,
        "class_name": "الصف الخامس",
        "grade_level": 5,
        "sections": [
          {
            "class_section_id": 5,
            "section_name": "شعبة أ",
            "quizzes": [
              {
                "id": 1,
                "subject_name": "الرياضيات",
                "teacher_name": "أحمد عبد السلام",
                "title": "تطبيق شهري 1 - الجبر والمعادلات",
                "attachments_count": 1,
                "quiz_date": "2026-09-20",
                "status": "upcoming"
              },
              {
                "id": 2,
                "subject_name": "اللغة العربية",
                "teacher_name": "سالم خليفة",
                "title": "تطبيق قواعد النحو والإعراب",
                "attachments_count": 0,
                "quiz_date": "2026-09-22",
                "status": "upcoming"
              }
            ]
          },
          {
            "class_section_id": 6,
            "section_name": "شعبة ب",
            "quizzes": [
              {
                "id": 4,
                "subject_name": "العلوم العامة",
                "teacher_name": "منى الهوني",
                "title": "تطبيق الوحدة الأولى - الخلية الحية",
                "attachments_count": 1,
                "quiz_date": "2026-09-24",
                "status": "upcoming"
              }
            ]
          }
        ]
      },
      {
        "class_id": 9,
        "class_name": "الصف التاسع",
        "grade_level": 9,
        "sections": [
          {
            "class_section_id": 12,
            "section_name": "شعبة أ",
            "quizzes": [
              {
                "id": 5,
                "subject_name": "اللغة الإنجليزية",
                "teacher_name": "فاطمة الزهراء",
                "title": "Monthly Quiz 1 - Grammar & Vocabulary",
                "attachments_count": 0,
                "quiz_date": "2026-09-21",
                "status": "upcoming"
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
    "total": 4,
    "last_page": 1
  }
}
```

##### ⚪ `200 OK` (القائمة فارغة):
```json
{
  "success": true,
  "message": "لا توجد اختبارات أو تطبيقات دورية تطابق محددات البحث.",
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

### 1.2 `GET /api/v1/quizzes/:id` — عرض تفاصيل اختبار/تطبيق محدد

> **الوصف الوظيفي:** استرجاع البيانات التفصيلية والمرفقات ونماذج المراجعة ومواضيع اختبار دوري محدد.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب تفاصيل الاختبار الدوري بنجاح.",
  "data": {
    "id": 1,
    "academic_year_id": 1,
    "academic_term_id": 1,
    "term_name": "الفصل الدراسي الأول",
    "class_id": 5,
    "class_name": "الصف الخامس",
    "class_section_id": 5,
    "section_name": "شعبة أ",
    "teaching_assignment_id": 10,
    "subject_id": 1,
    "subject_name": "الرياضيات",
    "teacher_id": 3,
    "teacher_name": "أحمد عبد السلام",
    "created_by_user_id": 3,
    "created_by_name": "أحمد عبد السلام",
    "title": "تطبيق شهري 1 - الجبر والمعادلات",
    "description": "يشمل الاختبار الدروس من الصفحة 10 إلى الصفحة 35، مع التركيز على حل المعادلات الخطية والتمارين الإثرائية.",
    "attachments": [
      {
        "file_name": "quiz_revision_guide.pdf",
        "file_url": "https://storage.taqniya.ly/quizzes/rev_101.pdf",
        "file_type": "application/pdf",
        "file_size": 1572864
      }
    ],
    "quiz_date": "2026-09-20",
    "status": "upcoming",
    "created_at": "2026-09-10T08:00:00Z",
    "updated_at": "2026-09-10T08:00:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الاختبار الدوري غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `POST /api/v1/quizzes` & `PUT /api/v1/quizzes/:id` — إنشاء وتعديل اختبار/تطبيق دوري (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** جدولة ونشر اختبار أو تطبيق شهري جديد وتحديد مواضيعه ومرفقاته وتاريخ إجرائه، مع التحقق من أن المعلم مسند له تدريس الشعبة والمادة.
> * **في التعديل (`PUT`):** تحديث وتعديل تفاصيل أو مواضيع أو مرفقات أو تاريخ إجراء اختبار قائم.

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "academic_year_id": 1,
    "academic_term_id": 1,
    "class_section_id": 5,
    "teaching_assignment_id": 10,
    "title": "تطبيق شهري 1 - الجبر والمعادلات",
    "description": "يشمل الاختبار الدروس من الصفحة 10 إلى الصفحة 35، مع التركيز على حل المعادلات الخطية.",
    "attachments": [
      {
        "file_name": "quiz_revision_guide.pdf",
        "file_url": "https://storage.taqniya.ly/quizzes/rev_101.pdf",
        "file_type": "application/pdf",
        "file_size": 1572864
      }
    ],
    "quiz_date": "2026-09-20"
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
```json
{
  "success": true,
  "message": "تم جدولة ونشر الاختبار الدوري بنجاح.",
  "data": {
    "id": 1,
    "academic_year_id": 1,
    "academic_term_id": 1,
    "class_section_id": 5,
    "teaching_assignment_id": 10,
    "created_by_user_id": 3,
    "title": "تطبيق شهري 1 - الجبر والمعادلات",
    "description": "يشمل الاختبار الدروس من الصفحة 10 إلى الصفحة 35، مع التركيز على حل المعادلات الخطية.",
    "attachments": [
      {
        "file_name": "quiz_revision_guide.pdf",
        "file_url": "https://storage.taqniya.ly/quizzes/rev_101.pdf",
        "file_type": "application/pdf",
        "file_size": 1572864
      }
    ],
    "quiz_date": "2026-09-20",
    "created_at": "2026-09-10T08:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث موعد وتفاصيل الاختبار الدوري بنجاح.",
  "data": {
    "id": 1,
    "academic_year_id": 1,
    "academic_term_id": 1,
    "class_section_id": 5,
    "teaching_assignment_id": 10,
    "title": "تطبيق شهري 1 - الجبر والمعادلات (موعد معدل)",
    "description": "تم تأجيل موعد الاختبار ليوم 22 سبتمبر بناءً على طلب الطلاب.",
    "attachments": [
      {
        "file_name": "quiz_revision_guide_v2.pdf",
        "file_url": "https://storage.taqniya.ly/quizzes/rev_102.pdf",
        "file_type": "application/pdf",
        "file_size": 1850000
      }
    ],
    "quiz_date": "2026-09-22",
    "updated_at": "2026-09-12T10:00:00Z"
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "الاختبار الدوري غير موجود."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "فشل التحقق من مدخلات الاختبار الدوري.",
  "errors": {
    "quiz_date": [
      "تاريخ إجراء الاختبار يجب أن يكون تاريخاً صالحاً ومستقبلياً."
    ],
    "teaching_assignment_id": [
      "إسناد التدريس المختار غير صالح للشعبة المحددة."
    ]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `DELETE /api/v1/quizzes/:id` — حذف اختبار/تطبيق دوري من المنظومة

> **الوصف الوظيفي:** حذف وإلغاء الاختبار الدوري منطقياً (Soft Delete) مع توثيق العملية في سجل التدقيق `audit_logs`.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف الاختبار الدوري بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الاختبار الدوري غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

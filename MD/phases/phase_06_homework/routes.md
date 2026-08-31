# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 06 (Network SSoT)

> **الهدف:** توثيق المسارات الـ 4 الأساسية والمركزية لإدارة ونشر ومتابعة الواجبات المدرسية والتكاليف المنزلية والمرفقات مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة ومنع التكرار، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) محصورة بالترقيم القياسي (`Pagination Meta`) والفصل الدراسي النشط لحماية أداء الخادم وقاعدة البيانات.  
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
| **1** | `assignments` | `GET` | `/api/v1/assignments` | `admin` / `teacher` / `student` / `parent` | استعراض وتصفية وبحث قائمة الواجبات المدرسية بالترقيم والفلترة المحصورة |
| **2** | `assignments` | `GET` | `/api/v1/assignments/:id` | `admin` / `teacher` / `student` / `parent` | استعراض التفاصيل الكاملة والمرفقات لواجب مدرسي محدد |
| **3** | `assignments` | `POST` | `/api/v1/assignments` | `admin` / `teacher` | إنشاء ونشر واجب مدرسي جديد مع المرفقات وتاريخ الاستحقاق |
| **4** | `assignments` | `PUT` | `/api/v1/assignments/:id` | `admin` / `teacher (creator/assigned)` | تعديل وتحديث بيانات ومرفقات وموعد استحقاق واجب مدرسي |
| **5** | `assignments` | `DELETE` | `/api/v1/assignments/:id` | `admin` / `teacher (creator/assigned)` | حذف وإلغاء واجب مدرسي من المنظومة (Soft Delete) |

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

## 📚 الخطوة 1: إدارة الواجبات والتكاليف المنزلية (`assignments`) — [مواصفات المسارات]

---

### 1.1 `GET /api/v1/assignments` — عرض وتصفية قائمة الواجبات المدرسية بالترقيم والفلترة

> **الوصف الوظيفي:** استرجاع قائمة الواجبات المدرسية بالترقيم المحصور والفرز والبحث، مع دعم الفلترة الدقيقة بالصف الدراسي `class_id` والشعبة `class_section_id` والمعلم `teacher_id` والمادة `subject_id` وحالة الاستحقاق `status`، مع حصر الاستعلام افتراضياً بالفصل الدراسي النشط لضمان السرعة الفائقة.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي بعنوان الواجب أو وصف التكليف.
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `academic_term_id` (optional, bigint): تصفية حسب الفصل الدراسي / السمستر (افتراضياً السمستر النشط).
  - `class_id` (optional, bigint): تصفية الواجبات حسب الصف الدراسي (لكافة شُعبه).
  - `class_section_id` (optional, bigint): تصفية حسب الشعبة الدراسية المحددة.
  - `teacher_id` (optional, bigint): تصفية الواجبات الصادرة عن معلم محدد.
  - `subject_id` (optional, bigint): تصفية حسب المادة التعليمية.
  - `teaching_assignment_id` (optional, bigint): تصفية حسب إسناد تدريس محدد (مادة + شعبة + معلم).
  - `status` (optional, string, enum: `active`, `expired`, `all`, default `active`): تصفية الواجبات السارية أو المنتهية.
  - `due_date` (optional, date): تصفية الواجبات المستحقة في تاريخ محدد (`YYYY-MM-DD`).
  - `sort_by` (optional, string, enum: `id`, `assigned_date`, `due_date`, default `due_date`): حقل الترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة (بحد أقصى `50`).
- **Example Request URL:** `/api/v1/assignments?class_id=5&status=active&sort_by=due_date&sort_order=asc&page=1&per_page=15`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب مصفوفة الواجبات المدرسية الهرمية):
```json
{
  "success": true,
  "message": "تم جلب مصفوفة الواجبات المدرسية بنجاح.",
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
            "assignments": [
              {
                "id": 1,
                "subject_name": "الرياضيات",
                "teacher_name": "أحمد عبد السلام",
                "title": "حل تمارين ص 45 - الجبر",
                "attachments_count": 1,
                "assigned_date": "2026-09-10",
                "due_date": "2026-09-15"
              },
              {
                "id": 2,
                "subject_name": "اللغة العربية",
                "teacher_name": "سالم خليفة",
                "title": "قراءة ونقل نص الإعراب ص 12",
                "attachments_count": 0,
                "assigned_date": "2026-09-11",
                "due_date": "2026-09-16"
              }
            ]
          },
          {
            "class_section_id": 6,
            "section_name": "شعبة ب",
            "assignments": [
              {
                "id": 4,
                "subject_name": "العلوم العامة",
                "teacher_name": "منى الهوني",
                "title": "رسم مخطط الخلية النباتية",
                "attachments_count": 1,
                "assigned_date": "2026-09-12",
                "due_date": "2026-09-17"
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
            "assignments": [
              {
                "id": 5,
                "subject_name": "اللغة الإنجليزية",
                "teacher_name": "فاطمة الزهراء",
                "title": "حل تمارين Unit 2 Workbook",
                "attachments_count": 0,
                "assigned_date": "2026-09-10",
                "due_date": "2026-09-16"
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
  "message": "لا توجد واجبات مدرسية تطابق محددات البحث.",
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

### 1.2 `GET /api/v1/assignments/:id` — عرض تفاصيل واجب مدرسي محدد

> **الوصف الوظيفي:** استرجاع البيانات التفصيلية والمرفقات الكاملة والتعليمات لواجب مدرسي محدد.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب تفاصيل الواجب المدرسي بنجاح.",
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
    "title": "حل تمارين ص 45 - الجبر",
    "description": "يرجى حل التمارين من السؤال 1 إلى 5 في كراسة الواجب المنزلية ومراجعة أمثلة الدرس.",
    "attachments": [
      {
        "file_name": "exercise_page_45.pdf",
        "file_url": "https://storage.taqniya.ly/assignments/att_101.pdf",
        "file_type": "application/pdf",
        "file_size": 1048576
      }
    ],
    "assigned_date": "2026-09-10",
    "due_date": "2026-09-15",
    "status": "active",
    "created_at": "2026-09-10T08:00:00Z",
    "updated_at": "2026-09-10T08:00:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الواجب المدرسي غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `POST /api/v1/assignments` & `PUT /api/v1/assignments/:id` — إنشاء وتعديل واجب مدرسي (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** إنشاء ونشر واجب مدرسي جديد وتحديد تفاصيله ومرفقاته وتاريخ التكليف والاستحقاق، مع التحقق من أن المعلم مسند له تدريس الشعبة والمادة.
> * **في التعديل (`PUT`):** تحديث وتعديل تفاصيل أو مرفقات أو تاريخ استحقاق واجب مدرسي قائم.

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "academic_year_id": 1,
    "academic_term_id": 1,
    "class_section_id": 5,
    "teaching_assignment_id": 10,
    "title": "حل تمارين ص 45 - الجبر",
    "description": "يرجى حل التمارين من السؤال 1 إلى 5 في كراسة الواجب المنزلية.",
    "attachments": [
      {
        "file_name": "exercise_page_45.pdf",
        "file_url": "https://storage.taqniya.ly/assignments/att_101.pdf",
        "file_type": "application/pdf",
        "file_size": 1048576
      }
    ],
    "assigned_date": "2026-09-10",
    "due_date": "2026-09-15"
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
```json
{
  "success": true,
  "message": "تم إنشاء ونشر الواجب المدرسي بنجاح.",
  "data": {
    "id": 1,
    "academic_year_id": 1,
    "academic_term_id": 1,
    "class_section_id": 5,
    "teaching_assignment_id": 10,
    "created_by_user_id": 3,
    "title": "حل تمارين ص 45 - الجبر",
    "description": "يرجى حل التمارين من السؤال 1 إلى 5 في كراسة الواجب المنزلية.",
    "attachments": [
      {
        "file_name": "exercise_page_45.pdf",
        "file_url": "https://storage.taqniya.ly/assignments/att_101.pdf",
        "file_type": "application/pdf",
        "file_size": 1048576
      }
    ],
    "assigned_date": "2026-09-10",
    "due_date": "2026-09-15",
    "created_at": "2026-09-10T08:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث الواجب المدرسي بنجاح.",
  "data": {
    "id": 1,
    "academic_year_id": 1,
    "academic_term_id": 1,
    "class_section_id": 5,
    "teaching_assignment_id": 10,
    "title": "حل تمارين ص 45 و 46 - الجبر المحدث",
    "description": "تم إضافة السؤال 6 إلى الواجب المطلوب.",
    "attachments": [
      {
        "file_name": "exercise_page_45_46.pdf",
        "file_url": "https://storage.taqniya.ly/assignments/att_102.pdf",
        "file_type": "application/pdf",
        "file_size": 1250000
      }
    ],
    "assigned_date": "2026-09-10",
    "due_date": "2026-09-17",
    "updated_at": "2026-09-12T10:00:00Z"
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "الواجب المدرسي غير موجود."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "فشل التحقق من مدخلات الواجب المدرسي.",
  "errors": {
    "due_date": [
      "تاريخ الاستحقاق يجب أن يكون بعد أو يطابق تاريخ النشر والتكليف (assigned_date)."
    ],
    "teaching_assignment_id": [
      "إسناد التدريس المختار غير صالح للشعبة المحددة."
    ]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `DELETE /api/v1/assignments/:id` — حذف واجب مدرسي من المنظومة

> **الوصف الوظيفي:** حذف وإلغاء الواجب المدرسي منطقياً (Soft Delete) مع توثيق العملية في سجل التدقيق `audit_logs`.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف الواجب المدرسي بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الواجب المدرسي غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

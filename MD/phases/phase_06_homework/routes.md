# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 06 (Network SSoT)

> **الهدف:** توثيق المسارات الـ 6 كاملة لإدارة ونشر ومتابعة الواجبات المدرسية والتكاليف المنزلية والمرفقات مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة ومنع التكرار، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم القياسي (`Pagination Meta`).  
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
| **1** | `assignments` | `GET` | `/api/v1/assignments` | `admin` / `teacher` | استعراض وتصفية وبحث قائمة الواجبات المدرسية بالترقيم والفلترة |
| **2** | `assignments` | `GET` | `/api/v1/assignments/:id` | `admin` / `teacher` / `student` / `parent` | استعراض التفاصيل الكاملة والمرفقات لواجب مدرسي محدد |
| **3** | `assignments` | `GET` | `/api/v1/class-sections/:class_section_id/assignments` | `admin` / `teacher` / `student` / `parent` | استعراض كراس واجبات شعبة دراسية محددة في الفصل الدراسي |
| **4** | `assignments` | `GET` | `/api/v1/classes/:class_id/assignments` | `admin` / `teacher` | استعراض كراس واجبات صف دراسي كامل بكافة شعبه |
| **5** | `assignments` | `GET` | `/api/v1/teachers/:teacher_id/assignments` | `admin` / `teacher (own)` | استعراض الواجبات والتكاليف الصادرة عن معلم محدد |
| **6** | `assignments` | `POST` | `/api/v1/assignments` | `admin` / `teacher` | إنشاء ونشر واجب مدرسي جديد مع المرفقات وتاريخ الاستحقاق |
| **7** | `assignments` | `PUT` | `/api/v1/assignments/:id` | `admin` / `teacher (creator/assigned)` | تعديل وتحديث بيانات ومرفقات وموعد استحقاق واجب مدرسي |
| **8** | `assignments` | `DELETE` | `/api/v1/assignments/:id` | `admin` / `teacher (creator/assigned)` | حذف وإلغاء واجب مدرسي من المنظومة (Soft Delete) |

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

## 📚 الخطوة 1: إدارة الواجبات والتكاليف المنزلية (`assignments`) — [مواصفات المسارات]

---

### 1.1 `GET /api/v1/assignments` — عرض وتصفية قائمة الواجبات المدرسية

> **الوصف الوظيفي:** استرجاع قائمة الواجبات المدرسية المسجلة بالمنظومة مع دعم الفلترة بالصف الدراسي `class_id` والشعبة والسمستر والمادة والمعلم وتاريخ الاستحقاق والبحث والترقيم.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي بعنوان الواجب أو وصف التكليف.
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `academic_term_id` (optional, bigint): تصفية حسب الفصل الدراسي / السمستر.
  - `class_id` (optional, bigint): تصفية الواجبات حسب الصف الدراسي (لكافة شُعبه).
  - `class_section_id` (optional, bigint): تصفية حسب الشعبة الدراسية المحددة.
  - `teaching_assignment_id` (optional, bigint): تصفية حسب إسناد تدريس محدد.
  - `teacher_id` (optional, bigint): تصفية الواجبات الصادرة عن معلم محدد.
  - `due_date` (optional, date): تصفية الواجبات المستحقة في تاريخ محدد (`YYYY-MM-DD`).
  - `sort_by` (optional, string, enum: `id`, `assigned_date`, `due_date`, default `id`): حقل الترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/assignments?class_id=5&academic_term_id=1&sort_by=due_date&sort_order=asc`

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
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.2 `GET /api/v1/assignments/:id` — عرض تفاصيل واجب مدرسي محدد

> **الوصف الوظيفي:** استرجاع البيانات التفصيلية والمرفقات الكاملة لواجب مدرسي محدد.

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
    "subject_name": "الرياضيات",
    "teacher_name": "أحمد عبد السلام",
    "created_by_user_id": 3,
    "created_by_name": "أحمد عبد السلام",
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

### 1.3 `GET /api/v1/class-sections/:class_section_id/assignments` — عرض جميع واجبات شعبة محددة

> **الوصف الوظيفي:** استرجاع كراس ومستجدات الواجبات الخاصة بشعبة دراسية محددة في الفصل الدراسي النشط لعرضها للطلاب والمعلمين وأولياء الأمور.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب واجبات الشعبة الدراسية بنجاح.",
  "data": {
    "class_section_id": 5,
    "class_name": "الصف الخامس",
    "section_name": "شعبة أ",
    "total_assignments": 3,
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
      },
      {
        "id": 3,
        "subject_name": "العلوم العامة",
        "teacher_name": "منى الهوني",
        "title": "رسم مخطط الخلية النباتية والحيوانية",
        "attachments_count": 1,
        "assigned_date": "2026-09-12",
        "due_date": "2026-09-17"
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

### 1.4 `GET /api/v1/classes/:class_id/assignments` — عرض واجبات صف دراسي كامل

> **الوصف الوظيفي:** استرجاع كافة الواجبات والتكاليف المسجلة لصف دراسي محدد (لكافة الشُعب) في الفصل الدراسي النشط.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب واجبات الصف الدراسي بنجاح.",
  "data": {
    "class_id": 5,
    "class_name": "الصف الخامس",
    "grade_level": 5,
    "total_assignments": 3,
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

### 1.5 `GET /api/v1/teachers/:teacher_id/assignments` — عرض الواجبات المنشأة بواسطة معلم محدد

> **الوصف الوظيفي:** استرجاع جميع الواجبات والتكاليف الصادرة عن معلم محدد عبر مختلف الشعب والصفوف التي يدرسها.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب واجبات المعلم بنجاح.",
  "data": {
    "teacher_id": 3,
    "teacher_name": "أحمد عبد السلام",
    "total_assignments": 3,
    "assignments": [
      {
        "id": 1,
        "class_section_id": 5,
        "class_name": "الصف الخامس",
        "section_name": "شعبة أ",
        "subject_name": "الرياضيات",
        "title": "حل تمارين ص 45 - الجبر",
        "assigned_date": "2026-09-10",
        "due_date": "2026-09-15"
      },
      {
        "id": 4,
        "class_section_id": 6,
        "class_name": "الصف الخامس",
        "section_name": "شعبة ب",
        "subject_name": "الرياضيات",
        "title": "حل تمارين ص 45 و 46 - الجبر",
        "assigned_date": "2026-09-10",
        "due_date": "2026-09-15"
      },
      {
        "id": 8,
        "class_section_id": 12,
        "class_name": "الصف التاسع",
        "section_name": "شعبة أ",
        "subject_name": "الهندسة والقياس",
        "title": "رسم وحساب مساحة المثلث المتساوي الساقين",
        "assigned_date": "2026-09-12",
        "due_date": "2026-09-18"
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

### 1.6 `POST /api/v1/assignments` & `PUT /api/v1/assignments/:id` — إنشاء وتعديل واجب مدرسي (Combined Specification)

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

### 1.7 `DELETE /api/v1/assignments/:id` — حذف واجب مدرسي من المنظومة

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

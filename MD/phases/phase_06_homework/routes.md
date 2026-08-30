# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 06 (Network SSoT)

> **الهدف:** توثيق المسارات الـ 8 كاملة لإدارة الواجبات المدرسية والتكاليف المنزلية والمرفقات مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
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

## 📚 الخطوة 1: إدارة الواجبات المدرسية والتكاليف المنزلية (`assignments`) — [8 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لـ الواجبات المدرسية:**
> 1. **تقييد صلاحيات المعلم (Scoped RBAC):** ينشئ ويعدل المعلم الواجبات المدرسية حصراً للمواد والشعب الموكلة إليه بإسناد التدريس (`teaching_assignments`).
> 2. **المساندة الإدارية:** يحق لمدير النظام (`role_type = 'admin'`) إنشاء الواجبات نيابة عن المعلمين، ويسجل حقل `created_by_user_id` معرف مدير النظام الفعلي للتدقيق `audit_logs`.
> 3. **تصفية الصفوف والشعب:** يدعم النظام تصفية الواجبات على مستوى الصف الدراسي `class_id` (بغض النظر عن الشعبة) لتسهيل استعراض التكاليف الشاملة للمستوى، وكذلك على مستوى الشعبة المحددة `class_section_id`.
> 4. **حوكمة تواريخ التكليف والاستحقاق:** يلزم منطقياً ألا يكون تاريخ الاستحقاق `due_date` سابقاً لتاريخ النشر والتكليف `assigned_date`. عند مخالفة ذلك ترجع خدمة التحقق خطأ `422 Unprocessable`.
> 5. **دعم المرفقات المتعددة (`JSON Attachments`):** يتضمن كائن الواجب مصفوفة ملفات وصور JSON تدعم روابط التحميل للمستندات والواجبات.

---

### 1.1 `GET /api/v1/assignments` — عرض وتصفية قائمة الواجبات المدرسية

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة الواجبات المدرسية المسجلة بالمنظومة مع دعم الفلترة بالصف الدراسي `class_id` والشعبة والسمستر والمادة والمعلم وتاريخ الاستحقاق (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي بعنوان الواجب أو وصف التكليف (مثال: `حل تمارين الجبر`).
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `academic_term_id` (optional, bigint): تصفية حسب الفصل الدراسي / السمستر.
  - `class_id` (optional, bigint): تصفية الواجبات حسب الصف الدراسي (مثال: `الصف الخامس` بغض النظر عن الشعبة).
  - `class_section_id` (optional, bigint): تصفية حسب الشعبة الدراسية المحددة.
  - `teaching_assignment_id` (optional, bigint): تصفية حسب إسناد مادة ومعلم محدد.
  - `teacher_id` (optional, bigint): تصفية الواجبات الصادرة عن معلم محدد.
  - `due_date` (optional, date): تصفية الواجبات المستحقة في تاريخ محدد (`YYYY-MM-DD`).
  - `sort_by` (optional, string, enum: `id`, `assigned_date`, `due_date`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/assignments?class_id=3&academic_term_id=1&sort_by=due_date&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة الواجبات المدرسية بنجاح.",
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
          "title": "حل تمارين ص 45 - الجبر",
          "description": "يرجى حل التمارين من السؤال 1 إلى 5 في كراسة الواجب المنزلية.",
          "attachments": [
            {
              "file_name": "exercise_page_45.pdf",
              "file_url": "https://storage.taqniya.ly/assignments/att_101.pdf",
              "file_type": "application/pdf"
            }
          ],
          "assigned_date": "2026-09-10",
          "due_date": "2026-09-15",
          "created_at": "2026-09-10T08:00:00Z"
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
          "teaching_assignment_id": 14,
          "subject_name": "اللغة العربية",
          "teacher_name": "سالم خليفة",
          "created_by_user_id": 4,
          "created_by_name": "سالم خليفة",
          "title": "قراءة ونقل نص الإعراب ص 12",
          "description": "قراءة الدرس ونقل فقرة الإعراب بخط واضح.",
          "attachments": [],
          "assigned_date": "2026-09-11",
          "due_date": "2026-09-16",
          "created_at": "2026-09-11T09:00:00Z"
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

### 1.2 `GET /api/v1/assignments/:id` — عرض تفاصيل واجب مدرسي محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع البيانات التفصيلية والمرفقات الكاملة لواجب مدرسي محدد.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تفاصيل الواجب المدرسي بنجاح.",
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
        "title": "حل تمارين ص 45 - الجبر",
        "description": "يرجى حل التمارين من السؤال 1 إلى 5 في كراسة الواجب المنزلية.",
        "attachments": [
          {
            "file_name": "exercise_page_45.pdf",
            "file_url": "https://storage.taqniya.ly/assignments/att_101.pdf",
            "file_type": "application/pdf"
          }
        ],
        "assigned_date": "2026-09-10",
        "due_date": "2026-09-15",
        "created_at": "2026-09-10T08:00:00Z"
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الواجب المدرسي غير موجود."}`

---

### 1.3 `GET /api/v1/sections/:section_id/assignments` — عرض جميع واجبات شعبة محددة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع كراس ومستجدات الواجبات الخاصة بشعبة دراسية محددة في السمستر النشط مع تفاصيل المواد والمدرسين والتاريخ المخصص لكل واجب.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب واجبات الشعبة بنجاح.",
      "data": {
        "class_section_id": 5,
        "class_name": "الصف الخامس",
        "section_name": "شعبة أ",
        "total_assignments": 3,
        "assignments": [
          {
            "id": 1,
            "teaching_assignment_id": 10,
            "subject_name": "الرياضيات",
            "teacher_name": "أحمد عبد السلام",
            "title": "حل تمارين ص 45 - الجبر",
            "description": "يرجى حل التمارين من السؤال 1 إلى 5 في كراسة الواجب المنزلية.",
            "attachments": [
              {
                "file_name": "exercise_page_45.pdf",
                "file_url": "https://storage.taqniya.ly/assignments/att_101.pdf",
                "file_type": "application/pdf"
              }
            ],
            "assigned_date": "2026-09-10",
            "due_date": "2026-09-15"
          },
          {
            "id": 2,
            "teaching_assignment_id": 12,
            "subject_name": "اللغة العربية",
            "teacher_name": "سالم خليفة",
            "title": "قراءة ونقل نص الإعراب ص 12",
            "description": "قراءة الدرس ونقل فقرة الإعراب بخط واضح ومراجعة القواعد.",
            "attachments": [],
            "assigned_date": "2026-09-11",
            "due_date": "2026-09-16"
          },
          {
            "id": 3,
            "teaching_assignment_id": 15,
            "subject_name": "العلوم العامة",
            "teacher_name": "فاطمة المهدي",
            "title": "رسم مخطط الخلية النباتية والحيوانية",
            "description": "رسم المخطط التوضيحي للخلية وتحديد أجزائها الرئيسية في كراسة الرسم.",
            "attachments": [
              {
                "file_name": "cell_diagram_guide.png",
                "file_url": "https://storage.taqniya.ly/assignments/cell_guide.png",
                "file_type": "image/png"
              }
            ],
            "assigned_date": "2026-09-12",
            "due_date": "2026-09-17"
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الشعبة الدراسية غير موجودة."}`

---

### 1.4 `GET /api/v1/classes/:class_id/assignments` — عرض جميع واجبات صف دراسي محدد (بغض النظر عن الشعبة)

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** مسار مخصص مريح يتيح للمطور والواجهة استرجاع كافة الواجبات والتكاليف المسجلة لصف دراسي محدد (مثل: كافة شعب الصف الخامس) بالسمستر النشط.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب واجبات الصف الدراسي بنجاح.",
      "data": {
        "class_id": 3,
        "class_name": "الصف الخامس",
        "total_assignments": 2,
        "assignments": [
          {
            "id": 1,
            "class_section_id": 5,
            "section_name": "شعبة أ",
            "subject_name": "الرياضيات",
            "teacher_name": "أحمد عبد السلام",
            "title": "حل تمارين ص 45 - الجبر",
            "due_date": "2026-09-15"
          },
          {
            "id": 2,
            "class_section_id": 6,
            "section_name": "شعبة ب",
            "subject_name": "اللغة العربية",
            "teacher_name": "سالم خليفة",
            "title": "قراءة ونقل نص الإعراب ص 12",
            "due_date": "2026-09-16"
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "الصف الدراسي غير موجود."}`

---

### 1.5 `GET /api/v1/teachers/:teacher_id/assignments` — عرض الواجبات المنشأة بواسطة معلم محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع جميع الواجبات والتكاليف الصادرة عن معلم محدد لمتابعة إنتاجيته ومواعيد تسليم طلابه عبر الشعب والصفوف المختلفة التي يدرسها.

- **Response Payloads:**
  - **`200 OK`:**
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
            "teaching_assignment_id": 10,
            "subject_name": "الرياضيات",
            "title": "حل تمارين ص 45 - الجبر",
            "description": "يرجى حل التمارين من السؤال 1 إلى 5 في كراسة الواجب المنزلية.",
            "assigned_date": "2026-09-10",
            "due_date": "2026-09-15"
          },
          {
            "id": 4,
            "class_section_id": 6,
            "class_name": "الصف الخامس",
            "section_name": "شعبة ب",
            "teaching_assignment_id": 11,
            "subject_name": "الرياضيات",
            "title": "حل تمارين ص 45 و 46 - الجبر",
            "description": "حل التمارين الفردية ص 45 وتدريب 2 ص 46.",
            "assigned_date": "2026-09-10",
            "due_date": "2026-09-15"
          },
          {
            "id": 8,
            "class_section_id": 9,
            "class_name": "الصف السادس",
            "section_name": "شعبة أ",
            "teaching_assignment_id": 18,
            "subject_name": "الهندسة والقياس",
            "title": "رسم وحساب مساحة المثلث المتساوي الساقين",
            "description": "تطبيق قانون المساحة ورسم الشكل بالأدوات الهندسية.",
            "assigned_date": "2026-09-12",
            "due_date": "2026-09-18"
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "المعلم غير موجود."}`

---

### 1.6 `POST /api/v1/assignments` — إنشاء ونشر واجب مدرسي جديد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إنشاء تكليف مدرسي جديد وتحديد تفاصيله ومرفقاته وتاريخ التكليف والاستحقاق، مع التحقق من أن المعلم مسند له تدريس الشعبة والمادة.

- **Request Body:**
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
        "file_type": "application/pdf"
      }
    ],
    "assigned_date": "2026-09-10",
    "due_date": "2026-09-15"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
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
            "file_type": "application/pdf"
          }
        ],
        "assigned_date": "2026-09-10",
        "due_date": "2026-09-15",
        "created_at": "2026-09-10T08:00:00Z"
      }
    }
    ```
  - **`403 Forbidden`:** `{"success": false, "message": "غير مصرح لك بنشر واجب لشعبة أو مادة غير موكلة إليك بالإسناد الرسمي."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من مدخلات الواجب المدرسي.",
      "errors": { "due_date": ["تاريخ الاستحقاق يجب أن يكون بعد أو يطابق تاريخ النشر والتكليف."] }
    }
    ```

---

### 1.7 `PUT /api/v1/assignments/:id` — تعديل بيانات ومرفقات وموعد واجب مدرسي

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث عنوان أو تفاصيل أو مرفقات أو تاريخ استحقاق واجب مدرسي قائم.

- **Request Body:**
  ```json
  {
    "title": "حل تمارين ص 45 و 46 - الجبر المحدث",
    "description": "تم إضافة السؤال 6 إلى الواجب المطلوب.",
    "attachments": [
      {
        "file_name": "exercise_page_45_46.pdf",
        "file_url": "https://storage.taqniya.ly/assignments/att_102.pdf",
        "file_type": "application/pdf"
      }
    ],
    "assigned_date": "2026-09-10",
    "due_date": "2026-09-17"
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث الواجب المدرسي بنجاح.",
      "data": {
        "id": 1,
        "title": "حل تمارين ص 45 و 46 - الجبر المحدث",
        "description": "تم إضافة السؤال 6 إلى الواجب المطلوب.",
        "due_date": "2026-09-17"
      }
    }
    ```
  - **`403 Forbidden`:** `{"success": false, "message": "ليس لديك الصلاحية لتعديل هذا الواجب."}`
  - **`404 Not Found`:** `{"success": false, "message": "الواجب المدرسي غير موجود."}`

---

### 1.8 `DELETE /api/v1/assignments/:id` — حذف واجب مدرسي من المنظومة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إلغاء وحذف الواجب المدرسي منطقياً مع توثيق العملية بسجل التدقيق `audit_logs`.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الواجب المدرسي بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "ليس لديك الصلاحية لحذف هذا الواجب."}`
  - **`404 Not Found`:** `{"success": false, "message": "الواجب المدرسي غير موجود."}`

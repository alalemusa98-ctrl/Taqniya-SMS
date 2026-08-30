# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 03-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 5 كاملة لإدارة كشوفات وإسنادات تدريس المواد للمعلمين على الشُعب المدرسية مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة ومنع التكرار، وتزويد مسار جلب القوائم باستجابة هرمية مجمعة بالصفوف والشعب (`classes -> sections -> assignments`) تلغي التكرار وتدعم البحث والتصفية المتكاملة.  
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

### 📋 مصفوفة المسارات الـ 5 الموحدة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `teaching_assignments` | `GET` | `/api/v1/teaching-assignments` | `admin` | استعراض وبحث توزيع الكادر التعليمي على المواد والشعب بالصفوف |
| **2** | `teaching_assignments` | `GET` | `/api/v1/teaching-assignments/:id` | `admin` / `teacher` | استعراض تفاصيل سجل إسناد تدريس محدد بالمعرف |
| **3** | `teaching_assignments` | `GET` | `/api/v1/teachers/:teacher_id/assignments` | `admin` / `teacher (own)` | استعراض النصاب التدريسي والمواد لمعلم محدد بالعام الدراسي |
| **4** | `teaching_assignments` | `POST` | `/api/v1/teaching-assignments` | `admin` | إسناد وتكليف معلم بتدريس مادة لشعبة (مع منع تكرار المادة) |
| **5** | `teaching_assignments` | `PUT` | `/api/v1/teaching-assignments/:id` | `admin` | تعديل إسناد التدريس أو تغيير المعلم/المادة للشعبة |
| **6** | `teaching_assignments` | `DELETE` | `/api/v1/teaching-assignments/:id` | `admin` | فك وإلغاء إسناد تدريس مادة مع فحص الحماية المرجعية (RESTRICT) |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API الـ 5** بالمرحلة:

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

## 📚 الخطوة 1: إدارة سجل وجدول إسناد التدريس الأكاديمي (`teaching_assignments`) — [مواصفات المسارات]

---

### 1.1 `GET /api/v1/teaching-assignments` — استعراض وبحث توزيع الكادر التعليمي على المواد والشعب

> **الوصف الوظيفي:** استرجاع خريطة توزيع الكادر التعليمي على المواد والشعب بالعام الدراسي مجمعة هرمياً لكل صف وشعبة (`classes -> sections -> assignments`) بدون تكرار للبيانات مع دعم التصفية بالصف أو الشعبة أو المعلم أو المادة.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم المعلم، الصف، الشعبة، أو المادة (مثال: `أحمد` أو `خامس` أو `رياضيات`).
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `class_id` (optional, bigint): تصفية لجلب شعب ومواد صف دراسي محدد (مثلاً: `class_id=5`).
  - `class_section_id` (optional, bigint): تصفية لجلب مواد شعبة دراسية محددة فقط.
  - `teacher_id` (optional, bigint): تصفية حسب معلم محدد.
  - `subject_id` (optional, bigint): تصفية حسب المادة التعليمية.
- **Example Request URL:** `/api/v1/teaching-assignments?academic_year_id=1&class_id=5`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة المجمعة بالشعب والمواد):
```json
{
  "success": true,
  "message": "تم جلب توزيع الكادر التعليمي على المواد والشعب بنجاح.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "classes": [
      {
        "class_id": 5,
        "class_name": "الصف الخامس",
        "sections": [
          {
            "class_section_id": 5,
            "section_name": "شعبة أ",
            "assignments": [
              {
                "id": 101,
                "subject_id": 1,
                "subject_name": "الرياضيات",
                "subject_code": "MATH",
                "teacher_id": 1,
                "teacher_code": "TCH-2001",
                "teacher_name": "أحمد محمود سالم"
              },
              {
                "id": 102,
                "subject_id": 2,
                "subject_name": "العلوم",
                "subject_code": "SCI",
                "teacher_id": 2,
                "teacher_code": "TCH-2002",
                "teacher_name": "خالد عبد السلام الفيتوري"
              },
              {
                "id": 103,
                "subject_id": 3,
                "subject_name": "اللغة العربية",
                "subject_code": "ARAB",
                "teacher_id": 3,
                "teacher_code": "TCH-2003",
                "teacher_name": "علي مصطفى الورفلي"
              }
            ]
          },
          {
            "class_section_id": 6,
            "section_name": "شعبة ب",
            "assignments": [
              {
                "id": 104,
                "subject_id": 1,
                "subject_name": "الرياضيات",
                "subject_code": "MATH",
                "teacher_id": 4,
                "teacher_code": "TCH-2004",
                "teacher_name": "محمود إبراهيم علي"
              },
              {
                "id": 105,
                "subject_id": 2,
                "subject_name": "العلوم",
                "subject_code": "SCI",
                "teacher_id": 2,
                "teacher_code": "TCH-2002",
                "teacher_name": "خالد عبد السلام الفيتوري"
              }
            ]
          }
        ]
      },
      {
        "class_id": 9,
        "class_name": "الصف التاسع",
        "sections": [
          {
            "class_section_id": 12,
            "section_name": "شعبة أ",
            "assignments": [
              {
                "id": 106,
                "subject_id": 1,
                "subject_name": "الرياضيات",
                "subject_code": "MATH",
                "teacher_id": 1,
                "teacher_code": "TCH-2001",
                "teacher_name": "أحمد محمود سالم"
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
  "message": "لا توجد إسنادات تدريس مسجلة تطابق محددات البحث.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "classes": []
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.2 `GET /api/v1/teaching-assignments/:id` — استعراض تفاصيل سجل إسناد تدريس محدد

> **الوصف الوظيفي:** استرجاع بيانات سجل إسناد تدريس واحد محدد بالمعرف.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب تفاصيل إسناد التدريس بنجاح.",
  "data": {
    "id": 101,
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "class_id": 5,
    "class_name": "الصف الخامس",
    "class_section_id": 5,
    "section_name": "شعبة أ",
    "subject_id": 1,
    "subject_name": "الرياضيات",
    "subject_code": "MATH",
    "teacher_id": 1,
    "teacher_code": "TCH-2001",
    "teacher_name": "أحمد محمود سالم",
    "created_at": "2026-08-29T12:00:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل إسناد التدريس غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `GET /api/v1/teachers/:teacher_id/assignments` — استعراض النصاب التدريسي والمواد لمعلم محدد

> **الوصف الوظيفي:** استرجاع قائمة كافة الصفوف والشعب والمواد المكلف بها معلم محدد بالعام الدراسي.

- **Query Parameters:**
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي.
  - `search` (optional, string): البحث باسم الصف أو الشعبة أو المادة.
  - `page` (optional, integer, default `1`): رقم الصفحة.
  - `per_page` (optional, integer, default `15`): عدد العناصر بالصفحة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب النصاب الأكاديمي للمعلم بنجاح.",
  "data": [
    {
      "id": 101,
      "academic_year_id": 1,
      "academic_year_name": "2025/2026",
      "class_id": 5,
      "class_name": "الصف الخامس",
      "class_section_id": 5,
      "section_name": "شعبة أ",
      "subject_id": 1,
      "subject_name": "الرياضيات",
      "subject_code": "MATH"
    },
    {
      "id": 105,
      "academic_year_id": 1,
      "academic_year_name": "2025/2026",
      "class_id": 6,
      "class_name": "الصف السادس",
      "class_section_id": 8,
      "section_name": "شعبة ب",
      "subject_id": 1,
      "subject_name": "الرياضيات",
      "subject_code": "MATH"
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

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "ملف المعلم غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `POST /api/v1/teaching-assignments` & `PUT /api/v1/teaching-assignments/:id` — إسناد وتعديل تكليف التدريس (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** تكليف معلم مسؤول عن تدريس مادة معينة لشعبة في عام دراسي محدد.
> * **في التعديل (`PUT`):** تحديث وتعديل سجل الإسناد (تغيير المعلم المكلف أو الشعبة أو المادة) مع التحقق من عدم التعارض.

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "academic_year_id": 1,
    "class_section_id": 5,
    "subject_id": 1,
    "teacher_id": 1
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
```json
{
  "success": true,
  "message": "تم إسناد تدريس المادة للمعلم بنجاح.",
  "data": {
    "id": 101,
    "academic_year_id": 1,
    "class_section_id": 5,
    "subject_id": 1,
    "teacher_id": 1,
    "created_at": "2026-08-29T12:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث وتعديل إسناد التدريس بنجاح.",
  "data": {
    "id": 101,
    "academic_year_id": 1,
    "class_section_id": 5,
    "subject_id": 1,
    "teacher_id": 3
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "سجل إسناد التدريس غير موجود."
}
```

##### ⚡ `409 Conflict` (قيد المعلم المسؤول الوحيد):
```json
{
  "success": false,
  "message": "تعارض في الإسناد: هذه المادة مسندة بالفعل لمعلم آخر في هذه الشعبة خلال العام الدراسي الحالي (uq_teaching_assignment)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات إسناد التدريس غير صالحة.",
  "errors": {
    "teacher_id": ["المعلم المختار غير نشط أو غير موجود."],
    "class_section_id": ["الشعبة المحددة غير صالحة."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.5 `DELETE /api/v1/teaching-assignments/:id` — فك وإلغاء إسناد تدريس مادة

> **الوصف الوظيفي:** فك ارتباط المعلم بالمادة والشعبة، مع التحقق الإجباري الصارم من عدم وجود ارتباطات بحصص أو درجات أو واجبات (`RESTRICT`).

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم فك وإلغاء إسناد التدريس بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل إسناد التدريس غير موجود."
}
```

##### ⚡ `409 Conflict` (حماية النزاهة المرجعية RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن فك إسناد التدريس لوجود حصص دراسية أو درجات أو واجبات مرتبطة به في المنظومة (Foreign Key Restrict)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

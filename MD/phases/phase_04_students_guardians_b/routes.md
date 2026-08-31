# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 04-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 5 كاملة لإدارة تسكين وتسجيل الطلاب بالفصول والشعب وتوليد أرقام الجلوس وحالات التسكين الأكاديمية مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة ومنع التكرار، وتزويد مسار جلب القوائم باستجابة هرمية مجمعة بالصفوف والشعب (`classes -> sections -> students`) تلغي التكرار وتدعم البحث والتصفية المتكاملة.  
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
| **1** | `student_enrollments` | `GET` | `/api/v1/student-enrollments` | `admin` / `teacher` | استعراض وبحث كشف تسكين الطلاب مجمعاً بالصفوف والشعب |
| **2** | `student_enrollments` | `GET` | `/api/v1/students/:student_id/enrollments` | `admin` / `student (own)` / `parent (own)` | استعراض السجل والأرشيف التسكيني التاريخي لطالب محدد |
| **3** | `student_enrollments` | `POST` | `/api/v1/student-enrollments` | `admin` | تسكين وتسجيل طالب في صف وشعبة (مع فحص منع التكرار السنوي) |
| **4** | `student_enrollments` | `PUT` | `/api/v1/student-enrollments/:id` | `admin` | تعديل بيانات التسكين (نقل الشعبة، تحديث رقم الجلوس، أو الحالة) |
| **5** | `student_enrollments` | `POST` | `/api/v1/student-enrollments/bulk-enroll` | `admin` | التسكين والتوزيع الجماعي لمجموعة طلاب دفعة واحدة في شعبة |
| **6** | `student_enrollments` | `DELETE` | `/api/v1/student-enrollments/:id` | `admin` | إلغاء وتجريد تسكين طالب مع فحص الحماية المرجعية (RESTRICT) |

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

## 🏫 الخطوة 1: إدارة تسكين وسجل تسجيل الطلاب الأكاديمي (`student_enrollments`) — [مواصفات المسارات]

---

### 1.1 `GET /api/v1/student-enrollments` — استعراض وبحث كشف تسكين الطلاب بالعام الدراسي

> **الوصف الوظيفي:** استرجاع مصفوفة تسكين الطلاب بالعام الدراسي النشط مجمعة هرمياً لكل صف وشعبة (`classes -> sections -> students`) بدون تكرار للبيانات مع دعم التصفية بالصف أو الشعبة أو الحالة الأكاديمية والبحث النصي.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم الطالب، الكود الموحد `STU-XXXX`، أو رقم الجلوس `seating_number`.
  - `academic_year_id` (optional, bigint): تصفية حسب العام الدراسي (افتراضياً العام النشط).
  - `class_id` (optional, bigint): تصفية لجلب شعب وطلاب صف دراسي محدد (مثلاً: `class_id=5`).
  - `class_section_id` (optional, bigint): تصفية لجلب طلاب شعبة دراسية محددة فقط.
  - `status` (optional, string, enum: `enrolled`, `passed`, `second_round`, `failed`, `graduated`): تصفية بحسب الحالة الأكاديمية.
- **Example Request URL:** `/api/v1/student-enrollments?academic_year_id=1&class_id=5`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة المجمعة بالشعب والطلاب):
```json
{
  "success": true,
  "message": "تم جلب مصفوفة تسكين الطلاب بالصفوف والشعب بنجاح.",
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
            "section_name": "شعبة أ",
            "enrolled_count": 2,
            "students": [
              {
                "enrollment_id": 1,
                "student_id": 1,
                "student_code": "STU-3001",
                "student_name": "محمد علي الفيتوري",
                "seating_number": "SEAT-5001",
                "status": "enrolled",
                "created_at": "2026-08-29T10:00:00Z"
              },
              {
                "enrollment_id": 2,
                "student_id": 2,
                "student_code": "STU-3002",
                "student_name": "فاطمة أحمد سالم",
                "seating_number": "SEAT-5002",
                "status": "enrolled",
                "created_at": "2026-08-29T10:05:00Z"
              }
            ]
          },
          {
            "class_section_id": 6,
            "section_name": "شعبة ب",
            "enrolled_count": 1,
            "students": [
              {
                "enrollment_id": 3,
                "student_id": 3,
                "student_code": "STU-3003",
                "student_name": "أنس خالد السويح",
                "seating_number": "SEAT-5003",
                "status": "enrolled",
                "created_at": "2026-08-29T10:10:00Z"
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
            "enrolled_count": 1,
            "students": [
              {
                "enrollment_id": 4,
                "student_id": 4,
                "student_code": "STU-3004",
                "student_name": "يوسف محمود الزوي",
                "seating_number": "SEAT-9001",
                "status": "enrolled",
                "created_at": "2026-08-29T10:15:00Z"
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
  "message": "لا توجد سجلات تسكين تطابق محددات البحث.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "classes": []
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.2 `GET /api/v1/students/:student_id/enrollments` — استعراض السجل والأرشيف التسكيني لطالب محدد

> **الوصف الوظيفي:** استرجاع السجل التاريخي لتسكين طالب محدد عبر كافة الأعوام الدراسية وتتبع ترفيعه وحالات النجاح والرسوب.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب السجل التسكيني للطالب بنجاح.",
  "data": [
    {
      "id": 25,
      "academic_year_id": 2,
      "academic_year_name": "2025/2026",
      "class_name": "الصف الخامس",
      "grade_level": 5,
      "section_name": "شعبة أ",
      "seating_number": "SEAT-5001",
      "status": "enrolled",
      "created_at": "2025-09-01T08:00:00Z"
    },
    {
      "id": 1,
      "academic_year_id": 1,
      "academic_year_name": "2024/2025",
      "class_name": "الصف الرابع",
      "grade_level": 4,
      "section_name": "شعبة ب",
      "seating_number": "SEAT-4015",
      "status": "passed",
      "created_at": "2024-09-01T08:00:00Z"
    }
  ]
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل الطالب أو التسكين غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `POST /api/v1/student-enrollments` & `PUT /api/v1/student-enrollments/:id` — تسكين وتعديل بيانات تسجيل الطالب (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** تسكين طالب في شعبة بالعام النشط وتوليد/إسناد رقم الجلوس مع الفحص الذري بعدم تكرار التسكين للعام الدراسي (`uq_student_year_enrollment`).
> * **في التعديل (`PUT`):** نقل الطالب لشعبة أخرى أو تحديث رقم الجلوس أو تحديث الحالة الأكاديمية (`enrolled`, `passed`, `second_round`, `failed`, `graduated`).

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "academic_year_id": 1,
    "student_id": 3,
    "class_section_id": 5,
    "seating_number": "SEAT-5003",
    "status": "enrolled"
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
```json
{
  "success": true,
  "message": "تم تسكين وتنسيق الطالب بالفصل والشعبة بنجاح.",
  "data": {
    "id": 3,
    "academic_year_id": 1,
    "student_id": 3,
    "student_code": "STU-3003",
    "student_name": "أنس خالد السويح",
    "class_id": 5,
    "class_name": "الصف الخامس",
    "grade_level": 5,
    "class_section_id": 5,
    "section_name": "شعبة أ",
    "seating_number": "SEAT-5003",
    "status": "enrolled",
    "created_at": "2026-08-29T12:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث بيانات التسكين ورقم الجلوس بنجاح.",
  "data": {
    "id": 3,
    "class_section_id": 6,
    "section_name": "شعبة ب",
    "seating_number": "SEAT-5003-UPDATED",
    "status": "enrolled"
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "سجل التسكين غير موجود."
}
```

##### ⚡ `409 Conflict` (قيد التسكين السنوي الفريد):
```json
{
  "success": false,
  "message": "تعارض في التسكين: الطالب مسكن مسبقاً في هذا العام الدراسي في فصل أو شعبة أخرى (uq_student_year_enrollment)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التسكين غير صالحة.",
  "errors": {
    "student_id": ["الطالب المحدد غير موجود أو غير نشط."],
    "class_section_id": ["الشعبة المحددة غير صالحة أو غير موجودة."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `POST /api/v1/student-enrollments/bulk-enroll` — التسكين والتوزيع الجماعي للطلاب

> **الوصف الوظيفي:** تسكين وتنسيق مجموعة طلاب دفعة واحدة في شعبة دراسية مخصصة بالعام النشط مع الفحص الذري ومنع التكرار.

- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "class_section_id": 5,
    "student_ids": [4, 5, 6]
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم التسكين الجماعي لـ 3 طلاب بنجاح بالحدث الذري.",
  "data": {
    "enrolled_count": 3,
    "class_id": 5,
    "class_name": "الصف الخامس",
    "class_section_id": 5,
    "academic_year_id": 1
  }
}
```

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "تعارض في التسكين الجماعي: أحد الطلاب المحددين مسكن مسبقاً بالعام الدراسي الحالي."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "قائمة الطلاب غير صالحة أو فارغة."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.5 `DELETE /api/v1/student-enrollments/:id` — إلغاء وتجريد تسكين طالب

> **الوصف الوظيفي:** إلغاء سجل تسكين الطالب وحذف تخصيص الشعبة بشرط عدم وجود درجات أو واجبات أو امتحانات مرصودة بالسجل الأكاديمي (`RESTRICT`).

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم إلغاء سجل التسكين وتجريد الطالب بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل التسكين غير موجود."
}
```

##### ⚡ `409 Conflict` (حماية النزاهة المرجعية RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن إلغاء التسكين لارتباط الطالب بدرجات أو واجبات أو امتحانات مرصودة بالسجل الأكاديمي (Foreign Key Restrict)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

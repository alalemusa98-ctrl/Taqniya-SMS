# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-C (Network SSoT)

> **الهدف:** توثيق المسارات الـ 11 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المعياري الموجز لـ [`MD/database.md`](../../database.md)، مع توحيد نمط الروابط والـ Request Body بين الإنشاء والتعديل.  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** ملف [`routes.md`](./routes.md) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Internal Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في هذا الملف حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/academic`
- **Protocol:** `HTTPS`
- **Data Format:** `JSON` (`application/json`)
- **Required Headers:**
  ```http
  Authorization: Bearer <TOKEN>
  Accept: application/json
  Content-Type: application/json
  Accept-Language: ar
  ```

### 📋 مصفوفة المسارات الـ 11 الموحدة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `class_academic_terms` | `GET` | `/api/v1/academic/class-academic-terms` | `admin` | استعراض وبحث فترات وتواريخ الصفوف بالعام |
| **2** | `class_academic_terms` | `POST` | `/api/v1/academic/class-academic-terms` | `admin` | تخصيص وتخطيط فترة وتواريخ لصف |
| **3** | `class_academic_terms` | `POST` | `/api/v1/academic/class-academic-terms/:id/activate` | `admin` | تفعيل الفترة النشطة للصف (Atomic) |
| **4** | `class_academic_terms` | `POST` | `/api/v1/academic/class-academic-terms/:id/close` | `admin` | إغلاق/فتح درجات الفترة للصف للأرشفة |
| **5** | `class_sections` | `GET` | `/api/v1/academic/class-sections` | `admin` | عرض وبحث شعب صف دراسي مفتوحة |
| **6** | `class_sections` | `POST` | `/api/v1/academic/class-sections` | `admin` | تسكين وربط شعبة بصف دراسي |
| **7** | `class_sections` | `DELETE` | `/api/v1/academic/class-sections/:id` | `admin` | فك ربط شعبة من صف |
| **8** | `class_subjects` | `GET` | `/api/v1/academic/class-subjects` | `admin` | استعراض منهج ومقررات الصف بالفصول |
| **9** | `class_subjects` | `POST` | `/api/v1/academic/class-subjects` | `admin` | إسناد مادة وتحديد درجات الفترة |
| **10** | `class_subjects` | `PUT` | `/api/v1/academic/class-subjects/:id` | `admin` | تعديل درجات مادة مسندة بالفترة |
| **11** | `class_subjects` | `DELETE` | `/api/v1/academic/class-subjects/:id` | `admin` | إزالة مادة من منهج فترة الصف |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API الـ 11** بالمنظومة:

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

## 🗓️ الخطوة 1: إدارة تواريخ وتخطيط فترات الصفوف (`class_academic_terms`) — [4 مسارات]

---

### 1.1 `GET /api/v1/academic/class-academic-terms` — عرض وبحث تقويم فترات صفوف العام

> **الوصف الوظيفي:** استرجاع تقويم فترات وتواريخ كافة صفوف المدرسة بالعام الدراسي مجمعة هرمياً لكل صف، مع إمكانية الفلترة لصف دراسي محدد عبر المعامل `class_id`.

- **Query Parameters:**
  - `academic_year_id` (optional, integer): فلترة بحسب العام الدراسي.
  - `class_id` (optional, integer): فلترة لصف دراسي محدد فقط (مثال: `class_id=9`).
  - `search` (optional, string): البحث النصي بمسمى الصف أو الفترة.
  - `is_active` (optional, integer: `0` أو `1`): فلترة حسب الفترة النشطة حالياً.
  - `is_closed` (optional, integer: `0` أو `1`): فلترة حسب الفترة المغلقة.
- **Example Request URL:** `/api/v1/academic/class-academic-terms?academic_year_id=1&class_id=9`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (تقويم وفترات الصفوف بالعام):
```json
{
  "success": true,
  "message": "تم جلب تقويم فترات صفوف العام الدراسي بنجاح.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "classes": [
      {
        "class_id": 9,
        "class_name": "الصف التاسع",
        "terms": [
          {
            "id": 10,
            "academic_term_id": 1,
            "term_name": "الفصل الأول",
            "start_date": "2025-09-01",
            "end_date": "2025-12-31",
            "is_active": 1,
            "is_closed": 0
          },
          {
            "id": 11,
            "academic_term_id": 2,
            "term_name": "الفصل الثاني",
            "start_date": "2026-01-05",
            "end_date": "2026-04-15",
            "is_active": 0,
            "is_closed": 0
          }
        ]
      },
      {
        "class_id": 10,
        "class_name": "الصف العاشر",
        "terms": [
          {
            "id": 12,
            "academic_term_id": 1,
            "term_name": "الفصل الأول",
            "start_date": "2025-09-01",
            "end_date": "2025-12-31",
            "is_active": 1,
            "is_closed": 0
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
  "message": "لا توجد فترات مسجلة تطابق محددات البحث.",
  "data": {
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "classes": []
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.2 `POST /api/v1/academic/class-academic-terms` — تخصيص وتخطيط فترة وتواريخ لصف

> **الوصف الوظيفي:** تخصيص فترة وتواريخ رسمية لصف بالعام الدراسي طبق تقويم الوزارة.

- **Request Body:**
  ```json
  {
    "academic_year_id": 1,
    "class_id": 9,
    "academic_term_id": 1,
    "start_date": "2025-09-01",
    "end_date": "2025-12-31"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تم تخصيص الفترة وتواريخ التقويم للصف بنجاح.",
  "data": {
    "id": 10,
    "academic_year_id": 1,
    "academic_year_name": "2025/2026",
    "class_id": 9,
    "class_name": "الصف التاسع",
    "academic_term_id": 1,
    "term_name": "الفصل الأول",
    "start_date": "2025-09-01",
    "end_date": "2025-12-31",
    "is_active": 0,
    "is_closed": 0
  }
}
```

##### ⚡ `409 Conflict` (تكرار تخصيص الفترة لنفس الصف بالعام):
```json
{
  "success": false,
  "message": "هذه الفترة مخصصة مسبقاً لهذا الصف بالعام الدراسي (uq_class_term_year)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التخصيص غير صالحة.",
  "errors": {
    "end_date": ["تاريخ نهاية الفترة يجب أن يكون بعد تاريخ البداية وضمن العام الدراسي."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `POST /api/v1/academic/class-academic-terms/:id/activate` — تفعيل الفترة النشطة للصف (Atomic)

> **الوصف الوظيفي:** تحويل الفترة المستهدفة إلى الفترة النشطة الحصرية للصف في هذا العام الدراسي (`is_active = 1`) وإلغاء تفعيل بقية فترات نفس الصف ذرياً.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تفعيل الفترة النشطة للصف بنجاح.",
  "data": {
    "id": 10,
    "class_id": 9,
    "academic_term_id": 1,
    "is_active": 1
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "تخصيص فترة الصف غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `POST /api/v1/academic/class-academic-terms/:id/close` — إغلاق/فتح درجات الفترة للصف

> **الوصف الوظيفي:** تبديل حالة إغلاق درجات الفترة للصف (`is_closed: 1 / 0`) للأرشفة ومنع التعديل.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تغيير حالة إغلاق درجات الفترة للصف بنجاح.",
  "data": {
    "id": 10,
    "is_closed": 1
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "تخصيص فترة الصف غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

## 🧩 الخطوة 2: إدارة ربط وتسكين الشُعب بالصفوف (`class_sections`) — [3 مسارات]

---

### 2.1 `GET /api/v1/academic/class-sections` — عرض وبحث شُعب الصفوف المفتوحة

> **الوصف الوظيفي:** استرجاع قائمة الشعب المفتوحة والمسندة لكافة الصفوف الدراسية مجمعة هرمياً، مع إمكانية الفلترة لصف دراسي محدد عبر المعامل `class_id`.

- **Query Parameters:**
  - `class_id` (optional, integer): فلترة الشعب لصف معين فقط (مثال: `class_id=5`).
  - `search` (optional, string): البحث باسم الشعبة أو الصف.
- **Example Request URL:** `/api/v1/academic/class-sections?class_id=5`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (شعب الصفوف الدراسية المفتوحة):
```json
{
  "success": true,
  "message": "تم جلب شعب الصفوف الدراسية بنجاح.",
  "data": {
    "classes": [
      {
        "class_id": 5,
        "class_name": "الصف الخامس",
        "sections": [
          {
            "id": 1,
            "section_id": 1,
            "name": "شعبة أ"
          },
          {
            "id": 2,
            "section_id": 2,
            "name": "شعبة ب"
          }
        ]
      },
      {
        "class_id": 6,
        "class_name": "الصف السادس",
        "sections": [
          {
            "id": 3,
            "section_id": 1,
            "name": "شعبة أ"
          }
        ]
      }
    ]
  }
}
```

##### ⚪ `200 OK` (قائمة فارغة):
```json
{
  "success": true,
  "message": "لا توجد شعب مسجلة تطابق محددات البحث.",
  "data": {
    "classes": []
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.2 `POST /api/v1/academic/class-sections` — تسكين وربط شعبة بصف

> **الوصف الوظيفي:** فتح وتسكين شعبة عامة لصف دراسي محدد.

- **Request Body:**
  ```json
  {
    "class_id": 5,
    "section_id": 1
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تم فتح وتسكين الشعبة للصف بنجاح.",
  "data": {
    "id": 1,
    "class_id": 5,
    "class_name": "الصف الخامس",
    "section_id": 1,
    "section_name": "شعبة أ"
  }
}
```

##### ⚡ `409 Conflict` (تكرار الشعبة لنفس الصف):
```json
{
  "success": false,
  "message": "الشعبة مفتوحة ومسندة مسبقاً لهذا الصف (uq_class_sections)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التسكين غير صالحة.",
  "errors": {
    "section_id": ["الشعبة العامة المحددة غير موجودة."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.3 `DELETE /api/v1/academic/class-sections/:id` — فك ربط شعبة من صف

> **الوصف الوظيفي:** إلغاء تسكين شعبة من صف دراسي بشرط عدم وجود طلاب مسجلين بها.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم فك ربط الشعبة من الصف بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل ربط الشعبة بالصف غير موجود."
}
```

##### ⚡ `409 Conflict` (منع فك الربط لوجود طلاب RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن فك ربط الشعبة لوجود طلاب مسجلين بها في هذا العام (RESTRICT)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

## 📝 الخطوة 3: إدارة مناهج الصفوف والدرجات لكل فترة (`class_subjects`) — [4 مسارات]

---

### 3.1 `GET /api/v1/academic/class-subjects` — استعراض مناهج ومقررات الصفوف بالفصول

> **الوصف الوظيفي:** استرجاع الهيكل الكامل لمناهج ومقررات صفوف المدرسة موزَّعة بحسب الفصول الدراسية (`terms`)، مع تفاصيل المواد ودرجات النجاح والدرجة العظمى لكل فصل دون تكرار، مع إمكانية الفلترة لصف دراسي محدد أو فصل محدد.

- **Query Parameters:**
  - `class_id` (optional, integer): فلترة المنهج لصف دراسي محدد فقط (مثال: `class_id=9`).
  - `class_academic_term_id` (optional, integer): فلترة المنهج لفصل دراسي محدد فقط.
  - `search` (optional, string): البحث النصي باسم المادة أو كودها.
- **Example Request URL:** `/api/v1/academic/class-subjects?class_id=9`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (مناهج الصفوف مقسمة بحسب الفصول):
```json
{
  "success": true,
  "message": "تم جلب مناهج ومقررات الصفوف الدراسية بنجاح.",
  "data": {
    "classes": [
      {
        "class_id": 9,
        "class_name": "الصف التاسع",
        "terms": [
          {
            "class_academic_term_id": 10,
            "term_name": "الفصل الأول",
            "is_active": 1,
            "is_closed": 0,
            "subjects": [
              {
                "id": 1,
                "subject_id": 1,
                "name": "الرياضيات",
                "code": "MATH",
                "passing_score": "50.00",
                "max_score": "100.00"
              },
              {
                "id": 2,
                "subject_id": 2,
                "name": "العلوم",
                "code": "SCI",
                "passing_score": "50.00",
                "max_score": "100.00"
              }
            ]
          },
          {
            "class_academic_term_id": 11,
            "term_name": "الفصل الثاني",
            "is_active": 0,
            "is_closed": 0,
            "subjects": [
              {
                "id": 3,
                "subject_id": 1,
                "name": "الرياضيات",
                "code": "MATH",
                "passing_score": "50.00",
                "max_score": "100.00"
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
  "message": "لا توجد مواد مقررة تطابق محددات البحث.",
  "data": {
    "classes": []
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 3.2 `POST /api/v1/academic/class-subjects` — إسناد مادة وتحديد درجات الفترة

> **الوصف الوظيفي:** إضافة مادة لمنهج فترة محددة بالصف وتعيين درجة النجاح والدرجة العظمى. يستخرج الخادم معرف الصف تلقائياً من `class_academic_term_id`.

- **Request Body:**
  ```json
  {
    "class_academic_term_id": 10,
    "subject_id": 1,
    "passing_score": 50.00,
    "max_score": 100.00
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تم إسناد المادة وتحديد درجات الفترة بنجاح.",
  "data": {
    "id": 1,
    "class_id": 9,
    "subject_id": 1,
    "subject_name": "الرياضيات",
    "class_academic_term_id": 10,
    "passing_score": "50.00",
    "max_score": "100.00"
  }
}
```

##### ⚡ `409 Conflict` (المادة مقررة مسبقاً بنفس الفترة):
```json
{
  "success": false,
  "message": "المادة مقررة ومسندة مسبقاً لهذه الفترة بالصف الدراسي (uq_class_term_subject)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات إسناد المادة غير صالحة.",
  "errors": {
    "passing_score": ["درجة النجاح يجب ألا تتجاوز الدرجة الكلية العظمى."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 3.3 `PUT /api/v1/academic/class-subjects/:id` — تعديل درجات مادة مسندة بالفترة

> **الوصف الوظيفي:** تحديث بيانات مادة مسندة بفترة صف (متطابق تماماً مع هيكل الإنشاء).

- **Request Body:**
  ```json
  {
    "class_academic_term_id": 10,
    "subject_id": 1,
    "passing_score": 60.00,
    "max_score": 100.00
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تحديث درجات المادة بالفترة بنجاح.",
  "data": {
    "id": 1,
    "passing_score": "60.00",
    "max_score": "100.00"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "مقرر المادة بالفترة غير موجود."
}
```

##### ⚡ `409 Conflict` (الفترة مغلقة للأرشفة):
```json
{
  "success": false,
  "message": "لا يمكن تعديل درجات المادة لأن درجات الفترة مغلقة نهائياً للأرشفة (is_closed = 1)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التحديث غير صالحة.",
  "errors": {
    "passing_score": ["درجة النجاح يجب ألا تتجاوز الدرجة العظمى."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 3.4 `DELETE /api/v1/academic/class-subjects/:id` — إزالة مادة من منهج فترة الصف

> **الوصف الوظيفي:** حذف مادة من مقررات فترة الصف بشرط عدم وجود درجات امتحانات مسجلة لها.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تمت إزالة المادة من منهج الفترة بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "مقرر المادة المراد حذفه غير موجود."
}
```

##### ⚡ `409 Conflict` (منع الحذف لوجود درجات أو جدول حصص RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن إزالة المادة لوجود درجات امتحانات رسمية أو جدول حصص مسجل لها في هذه الفترة (RESTRICT)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

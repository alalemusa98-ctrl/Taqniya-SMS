# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 04-A (Network SSoT)

> **الهدف:** توثيق المسارات الـ 14 كاملة لإدارة ملفات الطلاب وأولياء الأمور وشبكة الوصاية الأسرية مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
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

## 🎓 الخطوة 1: إدارة ملفات وسجل الطلاب (`students`) — [5 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لإدارة الطلاب:**
> 1. **الهوية الموحدة وتوليد الكود:** يتولى الخادم تلقائياً عند إضافة طالب جديد إنشاء حساب بجدول `users` وتوليد الرمز الموحد بالبادئة `STU-` برقم تسلسلي فريد (مثل `STU-3001`).
> 2. **بيانات الصف والشعبة:** تتضمن بيانات الاستجابة حقل `class_section` الذي يستعرض الصف والشعبة الحالية للطالب (مثل: "الصف الخامس - شعبة أ" أو `null` عند عدم التسكين).
> 3. **صلاحيات الإدارة:** إنشاء وتعديل وحذف سجلات الطلاب مقتصر حصراً على مدير النظام (`role_type = 'admin'`).
> 4. **حماية الحذف المرجعي:** يمنع حذف أي طالب لديه سجل تسكين أكاديمي بجدول `student_enrollments` أو درجات بجدول `student_grades` (`ON DELETE RESTRICT`).

---

### 1.1 `GET /api/v1/students` — عرض قائمة وبحث سجل الطلاب

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة الطلاب بالمنظومة متضمنة الصف والشعبة `class_section` لكل طالب، وتوفر دعم البحث النصي بالاسم أو الكود الموحد `user_code` والتصفية بالجنس والصف الدراسي والترتيب والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم الطالب أو الرمز المؤسسي الموحد (مثال: `محمد` أو `STU-3001`).
  - `gender` (optional, string, enum: `male`, `female`): تصفية بحسب جنس الطالب.
  - `sort_by` (optional, string, enum: `id`, `full_name`, `user_code`, `birth_date`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/students?search=محمد&gender=male&sort_by=id&sort_order=desc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة الطلاب بنجاح.",
      "data": [
        {
          "id": 1,
          "user_id": 101,
          "user_code": "STU-3001",
          "full_name": "محمد علي الفيتوري",
          "phone": "0911111111",
          "birth_date": "2015-05-12",
          "gender": "male",
          "class_section": "الصف الخامس - شعبة أ"
        },
        {
          "id": 2,
          "user_id": 102,
          "user_code": "STU-3002",
          "full_name": "فاطمة أحمد سالم",
          "phone": "0922222222",
          "birth_date": "2016-03-20",
          "gender": "female",
          "class_section": "الصف الرابع - شعبة ب"
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

### 1.2 `GET /api/v1/students/:id` — عرض تفاصيل ملف طالب محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع الملف الشخصي الكامل للطالب متضمناً حساب دخوله الموحد والصف والشعبة `class_section` وبيانات التواصل وتاريخ الميلاد والجنس.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تفاصيل ملف الطالب بنجاح.",
      "data": {
        "id": 1,
        "user_id": 101,
        "user_code": "STU-3001",
        "full_name": "محمد علي الفيتوري",
        "phone": "0911111111",
        "birth_date": "2015-05-12",
        "gender": "male",
        "class_section": "الصف الخامس - شعبة أ",
        "created_at": "2026-08-29T10:00:00Z"
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "ملف الطالب غير موجود."}`

---

### 1.3 `POST /api/v1/students` — إنشاء ملف طالب وتوليد حساب الدخول الموحد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إنشاء ملف طالب جديد وتوليد حساب الدخول الموحد بجدول `users` بالرمز المؤسسي `STU-XXXX` تلقائياً.

- **Request Body:**
  ```json
  {
    "full_name": "طارق زياد الورفلي",
    "phone": "0933333333",
    "birth_date": "2015-08-10",
    "gender": "male",
    "password": "Password123!"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إنشاء ملف الطالب وتوليد حساب الدخول الموحد بنجاح.",
      "data": {
        "id": 3,
        "user_id": 103,
        "user_code": "STU-3003",
        "full_name": "طارق زياد الورفلي",
        "phone": "0933333333",
        "birth_date": "2015-08-10",
        "gender": "male",
        "class_section": null,
        "created_at": "2026-08-29T12:00:00Z"
      }
    }
    ```
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من مدخلات ملف الطالب.",
      "errors": { "full_name": ["اسم الطالب الرباعي مطلوب."] }
    }
    ```

---

### 1.4 `PUT /api/v1/students/:id` — تعديل البيانات الشخصية للطالب

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث بيانات ملف الطالب (الاسم، الهاتف، تاريخ الميلاد، أو الجنس).

- **Request Body:**
  ```json
  {
    "full_name": "محمد علي الفيتوري المحدث",
    "phone": "0911111111",
    "birth_date": "2015-05-12",
    "gender": "male"
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث بيانات ملف الطالب بنجاح.",
      "data": {
        "id": 1,
        "user_id": 101,
        "user_code": "STU-3001",
        "full_name": "محمد علي الفيتوري المحدث",
        "phone": "0911111111",
        "birth_date": "2015-05-12",
        "gender": "male",
        "class_section": "الصف الخامس - شعبة أ"
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "ملف الطالب غير موجود."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "بيانات التحديث المدخلة غير صالحة."}`

---

### 1.5 `DELETE /api/v1/students/:id` — حذف ملف طالب غير مسجل

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** حذف ملف الطالب وحسابه بشرط عدم وجود تسكين أكاديمي أو درجات مرصودة باسمه.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف ملف الطالب وحسابه بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف ملف الطالب لارتباطه بتسكين أفقياً أو درجات مرصودة (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "ملف الطالب غير موجود."}`

---

## 👨‍👩‍👧‍👦 الخطوة 2: إدارة سجل أولياء الأمور (`guardians`) — [5 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لولي الأمر:**
> 1. **الهوية الموحدة وتوليد الكود:** يتولى الخادم تلقائياً عند إضافة ولي أمر جديد إنشاء حساب بجدول `users` وتوليد الرمز الموحد بالبادئة `PAR-` برقم تسلسلي فريد (مثل `PAR-4001`).
> 2. **قيد تفرد الهاتف:** رقم هاتف ولي الأمر `phone` فريد بالمنظومة لضمان التواصل وحظر تكرار الملفات (`uq_guardians_phone`).

---

### 2.1 `GET /api/v1/guardians` — عرض قائمة وبحث أولياء الأمور

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة أولياء الأمور بالمنظومة مع دعم البحث النصي بالاسم أو رقم الهاتف أو الكود الموحد `user_code` وتصفية القرابة، الترتيب، والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم ولي الأمر أو الهاتف أو الكود (مثال: `علي` أو `0915555555` أو `PAR-4001`).
  - `relationship` (optional, string, enum: `father`, `mother`, `brother`, `uncle`, `other`): تصفية حسب صلة القرابة.
  - `sort_by` (optional, string, enum: `id`, `full_name`, `user_code`, `phone`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/guardians?search=علي&relationship=father&sort_by=id&sort_order=desc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة أولياء الأمور بنجاح.",
      "data": [
        {
          "id": 1,
          "user_id": 201,
          "user_code": "PAR-4001",
          "full_name": "علي مصطفى الفيتوري",
          "phone": "0915555555",
          "relationship": "father"
        },
        {
          "id": 2,
          "user_id": 202,
          "user_code": "PAR-4002",
          "full_name": "أمينة عبد الرحمن سالم",
          "phone": "0926666666",
          "relationship": "mother"
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

### 2.2 `GET /api/v1/guardians/:id` — عرض تفاصيل ولي أمر محدد والأبناء

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع الملف الشخصي لولي الأمر متضمناً حساب دخوله الموحد وقائمة جميع الطلاب الأبناء المرتبطين به والصف والشعبة `class_section` لكل ابن.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تفاصيل ملف ولي الأمر بنجاح.",
      "data": {
        "id": 1,
        "user_id": 201,
        "user_code": "PAR-4001",
        "full_name": "علي مصطفى الفيتوري",
        "phone": "0915555555",
        "relationship": "father",
        "students": [
          {
            "student_id": 1,
            "student_code": "STU-3001",
            "student_name": "محمد علي الفيتوري",
            "class_section": "الصف الخامس - شعبة أ",
            "is_primary": 1
          },
          {
            "student_id": 2,
            "student_code": "STU-3002",
            "student_name": "فاطمة علي الفيتوري",
            "class_section": "الصف الرابع - شعبة ب",
            "is_primary": 1
          }
        ]
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "ملف ولي الأمر غير موجود."}`

---

### 2.3 `POST /api/v1/guardians` — إنشاء ملف ولي أمر وتوليد حساب الدخول الموحد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إنشاء ملف ولي أمر جديد وتوليد حساب الدخول الموحد بجدول `users` بالرمز المؤسسي `PAR-XXXX` تلقائياً.

- **Request Body:**
  ```json
  {
    "full_name": "سالم خليفة الورفلي",
    "phone": "0917777777",
    "relationship": "father",
    "password": "Password123!"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إنشاء ملف ولي الأمر وتوليد حساب الدخول الموحد بنجاح.",
      "data": {
        "id": 3,
        "user_id": 203,
        "user_code": "PAR-4003",
        "full_name": "سالم خليفة الورفلي",
        "phone": "0917777777",
        "relationship": "father",
        "created_at": "2026-08-29T12:00:00Z"
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "رقم هاتف ولي الأمر مسجل مسبقاً (uq_guardians_phone)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من بيانات ولي الأمر."}`

---

### 2.4 `PUT /api/v1/guardians/:id` — تعديل ملف ولي الأمر

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث بيانات ملف ولي الأمر (الاسم، رقم الهاتف، صلة القرابة).

- **Request Body:**
  ```json
  {
    "full_name": "علي مصطفى الفيتوري المحدث",
    "phone": "0915555555",
    "relationship": "father"
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث بيانات ملف ولي الأمر بنجاح.",
      "data": {
        "id": 1,
        "user_id": 201,
        "user_code": "PAR-4001",
        "full_name": "علي مصطفى الفيتوري المحدث",
        "phone": "0915555555",
        "relationship": "father"
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "ملف ولي الأمر غير موجود."}`
  - **`409 Conflict`:** `{"success": false, "message": "رقم الهاتف مستخدم مسبقاً لولي أمر آخر."}`

---

### 2.5 `DELETE /api/v1/guardians/:id` — حذف ملف ولي أمر غير مرتبط

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** حذف ملف ولي الأمر وحسابه بشرط عدم ارتباطه بأبناء بجدول `guardian_students`.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف ملف ولي الأمر بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف ملف ولي الأمر لارتباطه بطالب أو أكثر (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "ملف ولي الأمر غير موجود."}`

---

## 🔗 الخطوة 3: إدارة روابط الوصاية الأسرية (`guardian_students`) — [4 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لشبكة الوصاية:**
> 1. **الوصي الرئيسي للطالب:** يحدد الحقل `is_primary = 1` الوصي المسؤول الأول عن المتابعة الأكاديمية والمالية للطالب.
> 2. **حظر التكرار:** يمنع ربط نفس الطالب بنفس ولي الأمر أكثر من مرة (`uq_guardian_student`).

---

### 3.1 `GET /api/v1/guardians/:guardian_id/students` — عرض قائمة أطفال وأبناء ولي أمر

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة جميع الطلاب المسندين لولي أمر محدد مع بيان الصف والشعبة `class_section` والصفة الرئيسية لكل طالب.

- **Query Parameters:** `page` (optional, default 1), `per_page` (optional, default 15)
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة أبناء ولي الأمر بنجاح.",
      "data": [
        {
          "id": 10,
          "guardian_id": 1,
          "student_id": 1,
          "student_code": "STU-3001",
          "student_name": "محمد علي الفيتوري",
          "class_section": "الصف الخامس - شعبة أ",
          "is_primary": 1
        },
        {
          "id": 11,
          "guardian_id": 1,
          "student_id": 2,
          "student_code": "STU-3002",
          "student_name": "فاطمة علي الفيتوري",
          "class_section": "الصف الرابع - شعبة ب",
          "is_primary": 1
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

### 3.2 `POST /api/v1/guardian-students` — ربط ولي أمر بـ طالب وتحديد صفة الوصاية

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إنشاء رابط وصاية بين ولي أمر وطالب وتحديد ما إذا كان وصياً رئيسياً أم فرعياً.

- **Request Body:**
  ```json
  {
    "guardian_id": 1,
    "student_id": 1,
    "is_primary": 1
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم ربط الطالب بولي الأمر بنجاح.",
      "data": {
        "id": 10,
        "guardian_id": 1,
        "student_id": 1,
        "is_primary": 1
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "الطالب مرتبط مسبقاً بولي الأمر هذا (uq_guardian_student)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "معرف ولي الأمر أو الطالب غير موجود."}`

---

### 3.3 `PUT /api/v1/guardian-students/:id` — تعديل صفة الوصاية المعتمدة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث حقل الوصي الرئيسي `is_primary` لرابط القرابة.

- **Request Body:**
  ```json
  {
    "is_primary": 0
  }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث صفة الوصاية بنجاح.", "data": { "id": 10, "is_primary": 0 }}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل الوصاية غير موجود."}`

---

### 3.4 `DELETE /api/v1/guardian-students/:id` — فك وإلغاء رابط الوصاية

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إلغاء وفك رابط الوصاية بين ولي الأمر والطالب.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم فك رابط الوصاية بنجاح."}`
  - **`404 Not Found`:** `{"success": false, "message": "سجل الوصاية غير موجود."}`

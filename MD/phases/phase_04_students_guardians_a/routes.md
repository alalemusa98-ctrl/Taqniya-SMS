# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 04-A (Network SSoT)

> **الهدف:** توثيق المسارات الـ 11 كاملة لإدارة ملفات وسجلات الطلاب وأولياء الأمور وشبكة الوصاية الأسرية مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتوليد الحسابات الموحدة تلقائياً (`STU-XXXX`, `PAR-XXXX`)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة ومنع التكرار، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم القياسي (`Pagination Meta`).  
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

### 📋 مصفوفة المسارات الـ 11 الموحدة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `students` | `GET` | `/api/v1/students` | `admin` / `teacher` | استعراض وبحث وتصفية قائمة الطلاب بالترقيم والفلترة |
| **2** | `students` | `GET` | `/api/v1/students/:id` | `admin` / `student (own)` / `parent (child)` | استعراض الملف الشخصي الكامل لطالب محدد بالمعرف |
| **3** | `students` | `POST` | `/api/v1/students` | `admin` | إنشاء ملف طالب جديد وتوليد حساب دخوله الذري (`STU-XXXX`) |
| **4** | `students` | `PUT` | `/api/v1/students/:id` | `admin` | تحديث وتعديل البيانات الشخصية للطالب |
| **5** | `students` | `DELETE` | `/api/v1/students/:id` | `admin` | حذف ملف الطالب مع فحص الحماية المرجعية (RESTRICT) |
| **6** | `guardians` | `GET` | `/api/v1/guardians` | `admin` | استعراض وبحث وتصفية قائمة أولياء الأمور بالترقيم |
| **7** | `guardians` | `GET` | `/api/v1/guardians/:id` | `admin` / `parent (own)` | استعراض ملف ولي أمر محدد وبيانات الاتصال وصلة القرابة |
| **8** | `guardians` | `POST` | `/api/v1/guardians` | `admin` | إنشاء ملف ولي أمر جديد وتوليد حساب دخوله الذري (`PAR-XXXX`) |
| **9** | `guardians` | `PUT` | `/api/v1/guardians/:id` | `admin` | تحديث وتعديل بيانات ولي الأمر ورقم الهاتف |
| **10** | `guardians` | `DELETE` | `/api/v1/guardians/:id` | `admin` | حذف ملف ولي الأمر مع فحص الحماية المرجعية (RESTRICT) |
| **11** | `guardian_students` | `GET` | `/api/v1/guardians/:guardian_id/students` | `admin` / `parent (own)` | استعراض قائمة الأبناء المكفولين تحت وصاية ولي أمر محدد |
| **12** | `guardian_students` | `POST` | `/api/v1/guardian-students` | `admin` | ربط وصاية ولي أمر بطالب وتحديد الوصي الرئيسي |
| **13** | `guardian_students` | `PUT` | `/api/v1/guardian-students/:id` | `admin` | تعديل رابط الوصاية وتبديل صفة الوصي الرئيسي |
| **14** | `guardian_students` | `DELETE` | `/api/v1/guardian-students/:id` | `admin` | فك وإلغاء رابط الوصاية بين ولي الأمر والطالب |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API الـ 11** بالمرحلة:

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

## 🎓 الخطوة 1: إدارة ملفات وسجل الطلاب (`students`) — [مواصفات المسارات]

---

### 1.1 `GET /api/v1/students` — استعراض وبحث قائمة الطلاب

> **الوصف الوظيفي:** استرجاع قائمة الطلاب متضمنة حساب الدخول والصف والشعبة الحالية إن وجدت مع دعم البحث والفلترة بالترقيم.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم الطالب أو الكود الموحد (مثال: `محمد` أو `STU-3001`).
  - `gender` (optional, string, enum: `male`, `female`): تصفية بحسب الجنس.
  - `sort_by` (optional, string, enum: `id`, `full_name`, `birth_date`, default `id`): حقل الفرز.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/students?search=محمد&gender=male&page=1&per_page=15`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة):
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
      "class_section": "الصف الخامس - شعبة أ",
      "created_at": "2026-08-29T10:00:00Z"
    },
    {
      "id": 2,
      "user_id": 102,
      "user_code": "STU-3002",
      "full_name": "فاطمة أحمد سالم",
      "phone": "0922222222",
      "birth_date": "2016-03-20",
      "gender": "female",
      "class_section": "الصف الرابع - شعبة ب",
      "created_at": "2026-08-29T10:05:00Z"
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

##### ⚪ `200 OK` (القائمة فارغة):
```json
{
  "success": true,
  "message": "لا توجد سجلات طلاب تطابق محددات البحث.",
  "data": [],
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

### 1.2 `GET /api/v1/students/:id` — استعراض تفاصيل ملف طالب محدد

> **الوصف الوظيفي:** استرجاع الملف الشخصي الكامل للطالب متضمناً حساب دخوله الموحد والصف والشعبة وبيانات التواصل.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
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

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "ملف الطالب غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `POST /api/v1/students` & `PUT /api/v1/students/:id` — إنشاء وتعديل ملف طالب (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** إنشاء ملف طالب وتوليد حساب مستخدم ذري بجدول `users` بالرمز الموحد `STU-XXXX` وكلمة المرور المشفرة.
> * **في التعديل (`PUT`):** تحديث بيانات الطالب وتحديث كلمة المرور عند الرغبة.

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "full_name": "طارق زياد الورفلي",
    "phone": "0933333333",
    "birth_date": "2015-08-10",
    "gender": "male",
    "password": "Password123!"
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
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
    "created_at": "2026-08-29T12:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث بيانات ملف الطالب بنجاح.",
  "data": {
    "id": 3,
    "user_id": 103,
    "user_code": "STU-3003",
    "full_name": "طارق زياد الورفلي المحمودي",
    "phone": "0933333333",
    "birth_date": "2015-08-10",
    "gender": "male"
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "ملف الطالب غير موجود."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات الطالب غير صالحة.",
  "errors": {
    "full_name": ["الاسم الرباعي مطلوب."],
    "gender": ["الجنس المحدد غير صالح."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `DELETE /api/v1/students/:id` — حذف ملف طالب

> **الوصف الوظيفي:** حذف ملف الطالب وحسابه مع التحقق الصارم من عدم وجود تسكين أكاديمي أو درجات أو روابط وصاية (`RESTRICT`).

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف ملف الطالب وحسابه بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "ملف الطالب غير موجود."
}
```

##### ⚡ `409 Conflict` (حماية النزاهة المرجعية RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف الطالب لوجود سجلات تسكين أكاديمي أو درجات أو واجبات مرتبطة به في المنظومة (Foreign Key Restrict)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

## 👨‍👩‍👦 الخطوة 2: إدارة ملفات أولياء الأمور (`guardians`) — [مواصفات المسارات]

---

### 2.1 `GET /api/v1/guardians` — استعراض وبحث قائمة أولياء الأمور

> **الوصف الوظيفي:** استرجاع قائمة أولياء الأمور مع دعم البحث بالاسم أو الهاتف أو كود `PAR-XXXX` والترقيم الصفحي.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم ولي الأمر، الهاتف، أو الرمز الموحد.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب قائمة أولياء الأمور بنجاح.",
  "data": [
    {
      "id": 1,
      "user_id": 201,
      "user_code": "PAR-4001",
      "full_name": "علي محمد الفيتوري",
      "phone": "0912222222",
      "relationship": "father",
      "students_count": 2,
      "created_at": "2026-08-29T10:00:00Z"
    },
    {
      "id": 2,
      "user_id": 202,
      "user_code": "PAR-4002",
      "full_name": "خالد مسعود السويح",
      "phone": "0913333333",
      "relationship": "father",
      "students_count": 1,
      "created_at": "2026-08-29T10:15:00Z"
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

##### ⚪ `200 OK` (فارغة):
```json
{
  "success": true,
  "message": "لا توجد سجلات أولياء أمور تطابق محددات البحث.",
  "data": [],
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

### 2.2 `GET /api/v1/guardians/:id` — استعراض تفاصيل ملف ولي أمر محدد

> **الوصف الوظيفي:** استرجاع بيانات ولي الأمر الشخصية وبيانات حسابه وأرقام الاتصال.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب تفاصيل ملف ولي الأمر بنجاح.",
  "data": {
    "id": 1,
    "user_id": 201,
    "user_code": "PAR-4001",
    "full_name": "علي محمد الفيتوري",
    "phone": "0912222222",
    "relationship": "father",
    "students_count": 2,
    "created_at": "2026-08-29T10:00:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "ملف ولي الأمر غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.3 `POST /api/v1/guardians` & `PUT /api/v1/guardians/:id` — إنشاء وتعديل ملف ولي أمر (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** إنشاء ملف ولي أمر وتوليد حساب مستخدم ذري بجدول `users` بكود `PAR-XXXX` مع التحقق من تفرد رقم الهاتف.
> * **في التعديل (`PUT`):** تحديث بيانات ولي الأمر والقرابة ورقم الهاتف.

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "full_name": "خالد مسعود السويح",
    "phone": "0913333333",
    "relationship": "father",
    "password": "Password123!"
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
```json
{
  "success": true,
  "message": "تم إنشاء ملف ولي الأمر وتوليد حساب الدخول بنجاح.",
  "data": {
    "id": 2,
    "user_id": 202,
    "user_code": "PAR-4002",
    "full_name": "خالد مسعود السويح",
    "phone": "0913333333",
    "relationship": "father",
    "created_at": "2026-08-29T12:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث ملف ولي الأمر بنجاح.",
  "data": {
    "id": 2,
    "user_id": 202,
    "user_code": "PAR-4002",
    "full_name": "خالد مسعود السويح الزنتاني",
    "phone": "0913333333",
    "relationship": "father"
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "ملف ولي الأمر غير موجود."
}
```

##### ⚡ `409 Conflict` (تكرار رقم الهاتف):
```json
{
  "success": false,
  "message": "رقم هاتف ولي الأمر مسجل مسبقاً في المنظومة (uq_guardians_phone)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات ولي الأمر غير صالحة.",
  "errors": {
    "phone": ["رقم الهاتف مطلوب."],
    "full_name": ["الاسم الكامل مطلوب."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.4 `DELETE /api/v1/guardians/:id` — حذف ملف ولي أمر

> **الوصف الوظيفي:** حذف ملف ولي الأمر مع التحقق من عدم وجود وصاية نشطة على طلاب (`RESTRICT`).

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف ملف ولي الأمر وحسابه بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "ملف ولي الأمر غير موجود."
}
```

##### ⚡ `409 Conflict` (حماية النزاهة المرجعية RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف ولي الأمر لارتباطه بروابط وصاية مع طلاب في المنظومة (Foreign Key Restrict)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

## 🔗 الخطوة 3: إدارة روابط الوصاية الأسرية (`guardian_students`) — [مواصفات المسارات]

---

### 3.1 `GET /api/v1/guardians/:guardian_id/students` — استعراض الأبناء المكفولين لولي أمر محدد

> **الوصف الوظيفي:** استرجاع قائمة الطلاب التابعين لوصاية ولي أمر معين لتمكينه من التبديل بين سياقات أبنائه في الواجهة أو لمراجعة أبنائه من قِبل الإدارة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب قائمة الأبناء المكفولين لولي الأمر بنجاح.",
  "data": [
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
      "class_section": "الصف الثالث - شعبة أ",
      "is_primary": 1
    }
  ]
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "ملف ولي الأمر غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 3.2 `POST /api/v1/guardian-students` & `PUT /api/v1/guardian-students/:id` — ربط وتعديل وصاية ولي أمر بطالب (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** إنشاء رابط وصاية جديد بين ولي أمر وطالب وتحديد صفة الوصي الأساسي (`is_primary`) مع منع التكرار (`uq_guardian_student`).
> * **في التعديل (`PUT`):** تعديل رابط الوصاية أو تغيير صفة الوصي الرئيسي.

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "guardian_id": 1,
    "student_id": 2,
    "is_primary": 1
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
```json
{
  "success": true,
  "message": "تم ربط وصاية ولي الأمر بالطالب بنجاح.",
  "data": {
    "id": 2,
    "guardian_id": 1,
    "student_id": 2,
    "is_primary": 1,
    "created_at": "2026-08-29T12:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث بيانات رابط الوصاية بنجاح.",
  "data": {
    "id": 2,
    "guardian_id": 1,
    "student_id": 2,
    "is_primary": 0
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "رابط الوصاية غير موجود."
}
```

##### ⚡ `409 Conflict` (تكرار رابط الوصاية):
```json
{
  "success": false,
  "message": "رابط الوصاية بين ولي الأمر وهذا الطالب مسجل مسبقاً (uq_guardian_student)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات ربط الوصاية غير صالحة.",
  "errors": {
    "guardian_id": ["معرف ولي الأمر غير موجود."],
    "student_id": ["معرف الطالب غير موجود."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 3.3 `DELETE /api/v1/guardian-students/:id` — فك وإلغاء رابط الوصاية

> **الوصف الوظيفي:** فك ارتباط ولي الأمر بالطالب وإلغاء الوصاية.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم فك وإلغاء رابط الوصاية بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "رابط الوصاية غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

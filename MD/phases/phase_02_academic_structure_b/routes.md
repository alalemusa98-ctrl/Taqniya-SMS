# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-B (Network SSoT)

> **الهدف:** توثيق المسارات الـ 12 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المعياري الموجز لـ [`MD/database.md`](../../database.md)، مع عرض عنصرين على الأقل لكل قائمة نتائج لتوضيح نمط المصفوفة (`Multi-Item List Payload`).  
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

### 📋 مصفوفة المسارات الـ 12 الإجمالية (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `classes` | `GET` | `/api/v1/academic/classes` | `admin` | استعراض وبحث قائمة الصفوف الدراسية |
| **2** | `classes` | `POST` | `/api/v1/academic/classes` | `admin` | إنشاء صف دراسي جديد وتسكينه بمرحلة |
| **3** | `classes` | `PUT` | `/api/v1/academic/classes/:id` | `admin` | تعديل بيانات صف دراسي |
| **4** | `classes` | `DELETE` | `/api/v1/academic/classes/:id` | `admin` | حذف صف دراسي غير مرتبط |
| **5** | `sections` | `GET` | `/api/v1/academic/sections` | `admin` | عرض وبحث كتالوج الشعب العامة |
| **6** | `sections` | `POST` | `/api/v1/academic/sections` | `admin` | إنشاء شعبة عامة جديدة بالكتالوج |
| **7** | `sections` | `PUT` | `/api/v1/academic/sections/:id` | `admin` | تعديل مسمى شعبة عامة |
| **8** | `sections` | `DELETE` | `/api/v1/academic/sections/:id` | `admin` | حذف شعبة عامة غير مستخدمة |
| **9** | `subjects` | `GET` | `/api/v1/academic/subjects` | `admin` | استعراض وبحث بنك المواد العامة |
| **10** | `subjects` | `POST` | `/api/v1/academic/subjects` | `admin` | إضافة مادة جديدة لبنك المواد |
| **11** | `subjects` | `PUT` | `/api/v1/academic/subjects/:id` | `admin` | تعديل مادة ببنك المواد |
| **12** | `subjects` | `DELETE` | `/api/v1/academic/subjects/:id` | `admin` | حذف مادة عامة غير مسندة |

### 📋 نمط الاستجابات العامة للأخطاء المشتركة (Common Standard Error Responses)

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

// 500 Internal Server Error
{
  "success": false,
  "message": "حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً."
}
```

---

## 🏫 الخطوة 1: إدارة الصفوف وتحديد تبعيتها للمراحل (`classes`) — [4 مسارات]

---

### 1.1 `GET /api/v1/academic/classes` — عرض قائمة وبحث صفوف المراحل

> **الوصف الوظيفي:** استرجاع قائمة الصفوف الدراسية المضافة بالمنظومة مع دعم البحث النصي باسم الصف، التصفية بالمرحلة التعليمية (`stage_id`) والمستوى الرقمي (`grade_level`)، الترتيب والتقسيم الصفحي.

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم الصف (مثال: `الخامس`).
  - `stage_id` (optional, integer): تصفية الصفوف التابعة لمرحلة تعليمية معينة.
  - `grade_level` (optional, integer): تصفية الصفوف بحسب الترتيب الأكاديمي الرقمي (مثال: `5`, `6`).
  - `sort_by` (optional, string, enum: `id`, `name`, `grade_level`, `stage_id`, default `grade_level`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/academic/classes?search=الخامس&stage_id=1&sort_by=grade_level&sort_order=asc&page=1&per_page=15`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة):
```json
{
  "success": true,
  "message": "تم جلب قائمة الصفوف الدراسية بنجاح.",
  "data": [
    { "id": 5, "stage_id": 1, "stage_name": "المرحلة الابتدائية", "name": "الصف الخامس", "grade_level": 5 },
    { "id": 6, "stage_id": 1, "stage_name": "المرحلة الابتدائية", "name": "الصف السادس", "grade_level": 6 }
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
  "message": "لا توجد صفوف دراسية مسجلة.",
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 0,
    "last_page": 1
  }
}
```

##### 🔒 `401 Unauthorized`:
```json
{
  "success": false,
  "message": "غير مصرح بالوصول. التوكن غير صالح أو منتهي الصلاحية."
}
```

##### 🚫 `403 Forbidden`:
```json
{
  "success": false,
  "message": "ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء."
}
```

---

### 1.2 `POST /api/v1/academic/classes` — إنشاء صف دراسي وتسكينه بمرحلة

> **الوصف الوظيفي:** إضافة صف دراسي جديد وتحديد تبعيته للمرحلة التعليمية والترتيب الرقمي للترحيل (`grade_level`).

- **Request Body:**
  ```json
  {
    "stage_id": 1,
    "name": "الصف الخامس",
    "grade_level": 5
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تم إنشاء الصف الدراسي وتسكينه بالمرحلة بنجاح.",
  "data": {
    "id": 5,
    "stage_id": 1,
    "stage_name": "المرحلة الابتدائية",
    "name": "الصف الخامس",
    "grade_level": 5
  }
}
```

##### ⚡ `409 Conflict` (تكرار الترتيب الرقمي بنفس المرحلة):
```json
{
  "success": false,
  "message": "المستوى الرقمي للصف مكرر بالفعل داخل هذه المرحلة التعليمية (uq_classes_stage_level)."
}
```

##### ⚠️ `422 Unprocessable Entity` (أخطاء التحقق):
```json
{
  "success": false,
  "message": "بيانات الإدخال غير صالحة.",
  "errors": {
    "stage_id": ["المرحلة التعليمية المحددة غير موجودة."],
    "grade_level": ["المستوى الرقمي للصف يجب أن يكون رقماً صحيحاً بين 1 و 12."]
  }
}
```

---

### 1.3 `PUT /api/v1/academic/classes/:id` — تعديل بيانات صف دراسي

> **الوصف الوظيفي:** تحديث مسمى الصف أو مرحلته أو مستواه الرقمي.

- **Request Body:**
  ```json
  {
    "stage_id": 1,
    "name": "الصف الخامس الابتدائي",
    "grade_level": 5
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تحديث الصف الدراسي بنجاح.",
  "data": {
    "id": 5,
    "stage_id": 1,
    "stage_name": "المرحلة الابتدائية",
    "name": "الصف الخامس الابتدائي",
    "grade_level": 5
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

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "المستوى الرقمي للصف مستخدم مسبقاً لصف آخر بنفس المرحلة."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التحديث غير صالحة.",
  "errors": {
    "grade_level": ["المستوى الرقمي للصف يجب أن يكون بين 1 و 12."]
  }
}
```

---

### 1.4 `DELETE /api/v1/academic/classes/:id` — حذف صف دراسي غير مرتبط

> **الوصف الوظيفي:** تنفيذ الحذف المنطقي لصف دراسي بشرط عدم وجود شُعب مفتوحة أو فترات أو مناهج مرتبطة به.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف الصف الدراسي بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الصف الدراسي المراد حذفه غير موجود."
}
```

##### ⚡ `409 Conflict` (منع الحذف لوجود ارتباطات RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف الصف الدراسي لارتباطه بفترات صفوف أو شُعب أو مقررات مسندة (RESTRICT)."
}
```

##### 🚫 `403 Forbidden`:
```json
{
  "success": false,
  "message": "ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء."
}
```

---

## 🔠 الخطوة 2: إدارة بنك الشُعب العامة (`sections`) — [4 مسارات]

---

### 2.1 `GET /api/v1/academic/sections` — عرض قائمة وبحث بنك الشعب العامة

> **الوصف الوظيفي:** استرجاع كتالوج الشعب العامة المعتمدة بالمدرسة لمرة واحدة مع دعم البحث والترقيم.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم الشعبة (مثال: `أ` أو `شعبة أ`).
  - `sort_by` (optional, string, enum: `id`, `name`, default `name`): حقل الفرز.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب بنك الشعب العامة بنجاح.",
  "data": [
    { "id": 1, "name": "شعبة أ" },
    { "id": 2, "name": "شعبة ب" },
    { "id": 3, "name": "شعبة ج" }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 3,
    "last_page": 1
  }
}
```

##### ⚪ `200 OK` (قائمة فارغة):
```json
{
  "success": true,
  "message": "لا توجد شعب عامة مسجلة.",
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 0,
    "last_page": 1
  }
}
```

---

### 2.2 `POST /api/v1/academic/sections` — إنشاء شعبة عامة جديدة

> **الوصف الوظيفي:** إضافة مسمى شعبة عامة جديدة للكتالوج المرجعي العام بالمدرسة.

- **Request Body:**
  ```json
  {
    "name": "شعبة د"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تم إنشاء الشعبة العامة بنجاح.",
  "data": {
    "id": 4,
    "name": "شعبة د"
  }
}
```

##### ⚡ `409 Conflict` (تكرار المسمى):
```json
{
  "success": false,
  "message": "مسمى الشعبة العامة موجود مسبقاً (uq_sections_name)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "مسمى الشعبة حقل إجباري."
}
```

---

### 2.3 `PUT /api/v1/academic/sections/:id` — تعديل مسمى شعبة عامة

> **الوصف الوظيفي:** تحديث مسمى شعبة عامة قائمة بالكتالوج.

- **Request Body:**
  ```json
  {
    "name": "شعبة أ العامة"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تحديث مسمى الشعبة العامة بنجاح.",
  "data": {
    "id": 1,
    "name": "شعبة أ العامة"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الشعبة العامة غير موجودة."
}
```

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "مسمى الشعبة العامة مستخدم مسبقاً لشعبة أخرى."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التحديث المدخلة غير صالحة."
}
```

---

### 2.4 `DELETE /api/v1/academic/sections/:id` — حذف شعبة عامة غير مستخدمة

> **الوصف الوظيفي:** حذف شعبة عامة بشرط عدم تسكينها بصفوف دراسية في `class_sections`.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف الشعبة العامة بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الشعبة العامة المراد حذفها غير موجودة."
}
```

##### ⚡ `409 Conflict` (منع الحذف لوجود ارتباطات RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف الشعبة العامة لاستخدامها في صفوف دراسية (RESTRICT)."
}
```

---

## 📖 الخطوة 3: إدارة بنك المواد الدراسية العامة (`subjects`) — [4 مسارات]

---

### 3.1 `GET /api/v1/academic/subjects` — عرض قائمة وبحث بنك المواد العامة

> **الوصف الوظيفي:** استرجاع الكتالوج العام لكافة المواد والمناهج المعتمدة في بنك مواد المدرسة (Master Catalog) مع دعم البحث النصي والترتيب والترقيم.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم المادة أو كود المادة (مثال: `الرياضيات` أو `MATH`).
  - `code` (optional, string): فلترة مباشرة بحسب الكود الرمزي للمادة.
  - `sort_by` (optional, string, enum: `id`, `name`, `code`, default `name`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب بنك المواد العامة بنجاح.",
  "data": [
    { "id": 1, "name": "الرياضيات", "code": "MATH" },
    { "id": 2, "name": "العلوم", "code": "SCI" },
    { "id": 3, "name": "اللغة العربية", "code": "ARAB" }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 3,
    "last_page": 1
  }
}
```

##### ⚪ `200 OK` (قائمة فارغة):
```json
{
  "success": true,
  "message": "لا توجد مواد مسجلة ببنك المواد.",
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 0,
    "last_page": 1
  }
}
```

---

### 3.2 `POST /api/v1/academic/subjects` — إضافة مادة جديدة لبنك المواد

> **الوصف الوظيفي:** إضافة مادة جديدة وكودها الرمزي لكتالوج المواد العام بالمدرسة.

- **Request Body:**
  ```json
  {
    "name": "الرياضيات",
    "code": "MATH"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تمت إضافة المادة لبنك المواد بنجاح.",
  "data": {
    "id": 1,
    "name": "الرياضيات",
    "code": "MATH"
  }
}
```

##### ⚡ `409 Conflict` (تكرار الاسم أو الكود):
```json
{
  "success": false,
  "message": "اسم المادة أو الرمز الكودي مسجل مسبقاً (uq_subjects_name, uq_subjects_code)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات المادة المدخلة غير صالحة."
}
```

---

### 3.3 `PUT /api/v1/academic/subjects/:id` — تعديل مادة ببنك المواد

> **الوصف الوظيفي:** تحديث بيانات مادة قائمة في بنك المواد (الاسم أو الكود).

- **Request Body:**
  ```json
  {
    "name": "الرياضيات العامة",
    "code": "MATH-GEN"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تحديث المادة بنجاح.",
  "data": {
    "id": 1,
    "name": "الرياضيات العامة",
    "code": "MATH-GEN"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "المادة غير موجودة."
}
```

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "اسم المادة أو الكود الرمزي مستخدم مسبقاً لمادة أخرى."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التحديث المدخلة غير صالحة."
}
```

---

### 3.4 `DELETE /api/v1/academic/subjects/:id` — حذف مادة عامة غير مسندة

> **الوصف الوظيفي:** حذف مادة من الكتالوج العام بشرط عدم تسكينها بصفوف في `class_subjects`.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف المادة من البنك بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "المادة المراد حذفها غير موجودة بالبنك."
}
```

##### ⚡ `409 Conflict` (منع الحذف لوجود إسنادات RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف المادة لإسنادها في مناهج ومقررات صفوف دراسية (RESTRICT)."
}
```

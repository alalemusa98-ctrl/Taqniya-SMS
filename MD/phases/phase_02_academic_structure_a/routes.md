# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-A (Network SSoT)

> **الهدف:** توثيق المسارات الـ 13 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المعياري الموجز لـ [`MD/database.md`](../../database.md)، مع عرض عنصرين على الأقل لكل قائمة نتائج لتوضيح نمط المصفوفة (`Multi-Item List Payload`).  
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

### 📋 مصفوفة المسارات الـ 13 الإجمالية (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `academic_years` | `GET` | `/api/v1/academic/years` | `admin` | استعراض وبحث قائمة السنوات الدراسية |
| **2** | `academic_years` | `POST` | `/api/v1/academic/years` | `admin` | إضافة سنة دراسية جديدة |
| **3** | `academic_years` | `PUT` | `/api/v1/academic/years/:id` | `admin` | تعديل بيانات سنة دراسية |
| **4** | `academic_years` | `DELETE` | `/api/v1/academic/years/:id` | `admin` | حذف سنة دراسية غير مرتبطة |
| **5** | `academic_years` | `POST` | `/api/v1/academic/years/:id/activate` | `admin` | تفعيل السنة النشطة حالياً (Atomic) |
| **6** | `academic_terms` | `GET` | `/api/v1/academic/terms` | `admin` | عرض كتالوج الفترات المرجعي العام |
| **7** | `academic_terms` | `POST` | `/api/v1/academic/terms` | `admin` | إضافة فترة مرجعية للكتالوج |
| **8** | `academic_terms` | `PUT` | `/api/v1/academic/terms/:id` | `admin` | تعديل مسمى أو ترتيب فترة بالكتالوج |
| **9** | `academic_terms` | `DELETE` | `/api/v1/academic/terms/:id` | `admin` | حذف فترة غير مستخدمة من الكتالوج |
| **10** | `academic_stages` | `GET` | `/api/v1/academic/stages` | `admin` | عرض وبحث قائمة المراحل التعليمية |
| **11** | `academic_stages` | `POST` | `/api/v1/academic/stages` | `admin` | إضافة مرحلة تعليمية جديدة |
| **12** | `academic_stages` | `PUT` | `/api/v1/academic/stages/:id` | `admin` | تعديل بيانات مرحلة تعليمية |
| **13** | `academic_stages` | `DELETE` | `/api/v1/academic/stages/:id` | `admin` | حذف مرحلة تعليمية فارغة |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API الـ 13** بالمنظومة:

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

## 📅 الخطوة 1: إدارة السنوات الدراسية (`academic_years`) — [5 مسارات]

---

### 1.1 `GET /api/v1/academic/years` — عرض قائمة وبحث السنوات الدراسية

> **الوصف الوظيفي:** استرجاع قائمة كافة السنوات الدراسية المسجلة بالمنظومة مع دعم البحث النصي، الفلترة حسب حالة التفعيل، الترتيب، والتقسيم الصفحي.

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم السنة الدراسية (مثال: `2026`).
  - `is_active` (optional, integer: `0` أو `1`): فلترة حسب حالة العام النشط (`1 = العام النشط حالياً`, `0 = غير النشط`).
  - `sort_by` (optional, string, enum: `id`, `name`, `start_date`, `end_date`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/academic/years?search=2026&is_active=1&sort_by=start_date&sort_order=asc&page=1&per_page=15`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة):
```json
{
  "success": true,
  "message": "تم جلب قائمة السنوات الدراسية بنجاح.",
  "data": [
    { "id": 1, "name": "2025/2026", "start_date": "2025-09-01", "end_date": "2026-06-30", "is_active": 1 },
    { "id": 2, "name": "2026/2027", "start_date": "2026-09-01", "end_date": "2027-06-30", "is_active": 0 }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 2,
    "last_page": 1
  }
}
```

##### ⚪ `200 OK` (القائمة فارغة - Empty State):
```json
{
  "success": true,
  "message": "لا توجد سنوات دراسية مسجلة.",
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

### 1.2 `POST /api/v1/academic/years` — إضافة سنة دراسية جديدة

> **الوصف الوظيفي:** إنشاء سجل سنة دراسية جديدة في المنظومة.

- **Request Body:**
  ```json
  {
    "name": "2026/2027",
    "start_date": "2026-09-01",
    "end_date": "2027-06-30"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تم إنشاء السنة الدراسية بنجاح.",
  "data": {
    "id": 2,
    "name": "2026/2027",
    "start_date": "2026-09-01",
    "end_date": "2027-06-30",
    "is_active": 0
  }
}
```

##### ⚡ `409 Conflict` (تكرار الاسم):
```json
{
  "success": false,
  "message": "اسم السنة الدراسية موجود مسبقاً (uq_academic_years_name)."
}
```

##### ⚠️ `422 Unprocessable Entity` (أخطاء التحقق):
```json
{
  "success": false,
  "message": "بيانات الإدخال غير صالحة.",
  "errors": {
    "end_date": ["تاريخ النهاية يجب أن يكون بعد تاريخ البداية."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `PUT /api/v1/academic/years/:id` — تعديل سنة دراسية

> **الوصف الوظيفي:** تحديث بيانات سنة دراسية قائمة.

- **Request Body:**
  ```json
  {
    "name": "2026/2027",
    "start_date": "2026-09-01",
    "end_date": "2027-06-30"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تحديث السنة الدراسية بنجاح.",
  "data": {
    "id": 2,
    "name": "2026/2027",
    "start_date": "2026-09-01",
    "end_date": "2027-06-30",
    "is_active": 0
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "السنة الدراسية غير موجودة."
}
```

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "اسم السنة الدراسية مستخدم مسبقاً لسنة أخرى."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التحديث غير صالحة.",
  "errors": {
    "end_date": ["تاريخ النهاية يجب أن يكون بعد تاريخ البداية."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `DELETE /api/v1/academic/years/:id` — حذف سنة دراسية غير مرتبطة

> **الوصف الوظيفي:** تنفيذ الحذف المنطقي لسنة دراسية غير مستخدمة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف السنة الدراسية بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "السنة الدراسية المراد حذفها غير موجودة."
}
```

##### ⚡ `409 Conflict` (منع الحذف لوجود ارتباطات RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف السنة الدراسية لارتباطها بفترات صفوف أو طلاب (RESTRICT)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.5 `POST /api/v1/academic/years/:id/activate` — تفعيل السنة النشطة حالياً (Atomic Activation)

> **الوصف الوظيفي:** تحويل العام المستهدف إلى العام الدراسي النشط الحصري بالمنظومة (`is_active = 1`) وإلغاء تفعيل العام السابق ذرياً.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تفعيل السنة الدراسية كعام نشط للمنظومة بنجاح.",
  "data": {
    "id": 2,
    "name": "2026/2027",
    "is_active": 1
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "السنة الدراسية المراد تفعيلها غير موجودة."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

## 🗓️ الخطوة 2: كتالوج الفترات المرجعي (`academic_terms`) — [4 مسارات]

---

### 2.1 `GET /api/v1/academic/terms` — عرض قائمة وبحث كتالوج الفترات العام

> **الوصف الوظيفي:** استرجاع كتالوج الفترات المعيارية العامة بالدولة لمرة واحدة مرتبة تصاعدياً بـ `term_number ASC`.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم الفترة (مثال: `الأول`).
  - `sort_by` (optional, string, enum: `id`, `name`, `term_number`, default `term_number`): حقل الفرز.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب كتالوج الفترات المعيارية بنجاح.",
  "data": [
    { "id": 1, "name": "الفصل الأول", "term_number": 1 },
    { "id": 2, "name": "الفصل الثاني", "term_number": 2 },
    { "id": 3, "name": "الفصل الثالث", "term_number": 3 }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 3,
    "last_page": 1
  }
}
```

##### ⚪ `200 OK` (القائمة فارغة):
```json
{
  "success": true,
  "message": "لا توجد فترات مسجلة بالكتالوج.",
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

### 2.2 `POST /api/v1/academic/terms` — إضافة فترة لكتالوج الفترات العام

> **الوصف الوظيفي:** إضافة فترة معيارية جديدة للكتالوج المرجعي العام.

- **Request Body:**
  ```json
  {
    "name": "الفصل الرابع",
    "term_number": 4
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تمت إضافة الفترة للكتالوج العام بنجاح.",
  "data": {
    "id": 4,
    "name": "الفصل الرابع",
    "term_number": 4
  }
}
```

##### ⚡ `409 Conflict` (تكرار الاسم أو الترتيب):
```json
{
  "success": false,
  "message": "اسم الفترة أو رقم الترتيب موجود مسبقاً بالكتالوج (uq_terms_name, uq_terms_number)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات الفترة غير صالحة.",
  "errors": {
    "name": ["اسم الفترة حقل إجباري."],
    "term_number": ["ترتيب الفترة يجب أن يكون رقماً صحيحاً موجباً."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.3 `PUT /api/v1/academic/terms/:id` — تعديل مسمى أو ترتيب فترة بالكتالوج

> **الوصف الوظيفي:** تحديث بيانات فترة مرجعية قائمة بالكتالوج.

- **Request Body:**
  ```json
  {
    "name": "الفصل الدراسي الأول",
    "term_number": 1
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تحديث الفترة بنجاح.",
  "data": {
    "id": 1,
    "name": "الفصل الدراسي الأول",
    "term_number": 1
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الفترة غير موجودة بالكتالوج."
}
```

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "اسم الفترة أو رقم الترتيب مستخدم مسبقاً لفترة أخرى."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التحديث غير صالحة."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.4 `DELETE /api/v1/academic/terms/:id` — حذف فترة غير مستخدمة من الكتالوج

> **الوصف الوظيفي:** حذف فترة مرجعية بشرط عدم استخدامها في جدول `class_academic_terms`.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف الفترة من الكتالوج بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "الفترة المراد حذفها غير موجودة بالكتالوج."
}
```

##### ⚡ `409 Conflict` (منع الحذف لوجود ارتباطات RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف الفترة المرجعية لارتباطها بتخصيصات صفوف (RESTRICT)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

## 🏛️ الخطوة 3: إدارة المراحل التعليمية (`academic_stages`) — [4 مسارات]

---

### 3.1 `GET /api/v1/academic/stages` — عرض قائمة وبحث المراحل التعليمية

> **الوصف الوظيفي:** استرجاع المراحل التعليمية مرتبة تصاعدياً بحسب أولوية العرض `order_index ASC`.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم المرحلة (مثال: `الابتدائية`).
  - `sort_by` (optional, string, enum: `id`, `name`, `order_index`, default `order_index`): حقل الفرز.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب قائمة المراحل التعليمية بنجاح.",
  "data": [
    { "id": 1, "name": "المرحلة الابتدائية", "order_index": 1 },
    { "id": 2, "name": "المرحلة الإعدادية", "order_index": 2 },
    { "id": 3, "name": "المرحلة الثانوية", "order_index": 3 }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 3,
    "last_page": 1
  }
}
```

##### ⚪ `200 OK` (القائمة فارغة):
```json
{
  "success": true,
  "message": "لا توجد مراحل تعليمية مسجلة.",
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

### 3.2 `POST /api/v1/academic/stages` — إضافة مرحلة تعليمية جديدة

> **الوصف الوظيفي:** تعريف مرحلة تعليمية جديدة وضبط ترتيبها بالهيكل الأكاديمي.

- **Request Body:**
  ```json
  {
    "name": "مرحلة رياض الأطفال",
    "order_index": 0
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تم إنشاء المرحلة التعليمية بنجاح.",
  "data": {
    "id": 4,
    "name": "مرحلة رياض الأطفال",
    "order_index": 0
  }
}
```

##### ⚡ `409 Conflict` (تكرار الاسم):
```json
{
  "success": false,
  "message": "اسم المرحلة التعليمية موجود مسبقاً (uq_stages_name)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "اسم المرحلة حقل إجباري."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 3.3 `PUT /api/v1/academic/stages/:id` — تعديل مرحلة تعليمية

> **الوصف الوظيفي:** تحديث مسمى المرحلة التعليمية أو ترتيبها الأكاديمي.

- **Request Body:**
  ```json
  {
    "name": "المرحلة الابتدائية الأساسية",
    "order_index": 1
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تحديث المرحلة التعليمية بنجاح.",
  "data": {
    "id": 1,
    "name": "المرحلة الابتدائية الأساسية",
    "order_index": 1
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "المرحلة التعليمية غير موجودة."
}
```

##### ⚡ `409 Conflict`:
```json
{
  "success": false,
  "message": "اسم المرحلة التعليمية مستخدم مسبقاً لمرحلة أخرى."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات التحديث غير صالحة."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 3.4 `DELETE /api/v1/academic/stages/:id` — حذف مرحلة تعليمية فارغة

> **الوصف الوظيفي:** حذف مرحلة تعليمية بشرط عدم احتوائها على صفوف دراسية بجدول `classes`.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف المرحلة التعليمية بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "المرحلة التعليمية المراد حذفها غير موجودة."
}
```

##### ⚡ `409 Conflict` (منع الحذف لوجود ارتباطات RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف المرحلة التعليمية لارتباطها بصفوف دراسية (RESTRICT)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

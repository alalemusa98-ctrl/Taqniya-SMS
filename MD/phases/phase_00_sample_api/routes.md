# 🗺️ مواصفات المسارات ونقاط الاتصال — [اسم المرحلة / Phase Name] (نمط API-First)

> **الهدف:** توثيق كافة نقاط الاتصال البرمجية (RESTful API Endpoints) الخاصة بهذه المرحلة، بما يشمل المعاملات، وهياكل الطلبات (Request Payloads)، وكافة أنواع الاستجابات المحتملة لكل رابط (نجاح، أخطاء تحقق، مصادقة، صلاحيات، عدم وجود، تعارض، أخطاء خادم).

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **المسار الأساسي (Base URI):** `/api/v1/[resources]`
- **بروتوكول النقل (Protocol):** `HTTPS`
- **صيغة البيانات (Data Format):** `JSON` (`application/json`)
- **الترويسات العامة الإلزامية (Common Headers):**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Accept: application/json
  Content-Type: application/json
  Accept-Language: ar
  ```
- **حدود معدل الطلبات (Rate Limiting):** `60 requests / minute` لكل مستخدم/مستأجر ما لم يُحدد خلاف ذلك في `MD/stack.yaml`.

---

## 2. مصفوفة نقاط الاتصال الشاملة (Endpoints Master Matrix)

| العملية (Action) | HTTP Method | الـ Endpoint | المصادقة | الصلاحية المطلوبة (Permission) | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **استعراض القائمة** | `GET` | `/api/v1/[resources]` | مطلوبة | `[resource].read` | جلب قائمة العناصر مع الترقيم والبحث والفلترة. |
| **عرض عنصر محدد** | `GET` | `/api/v1/[resources]/:id` | مطلوبة | `[resource].read` | جلب التفاصيل الكاملة لعنصر مفرد. |
| **إنشاء عنصر جديد** | `POST` | `/api/v1/[resources]` | مطلوبة | `[resource].create` | إنشاء عنصر جديد بعد التحقق الصارم من المدخلات. |
| **تعديل عنصر قائم** | `PUT / PATCH` | `/api/v1/[resources]/:id` | مطلوبة | `[resource].update` | تعديل بيانات عنصر موجود مع منع IDOR. |
| **حذف عنصر (منطقي)** | `DELETE` | `/api/v1/[resources]/:id` | مطلوبة | `[resource].delete` | تنفيذ الحذف المنطقي (Soft Delete) للعنصر. |
| **رفع مرفق/ملف** | `POST` | `/api/v1/[resources]/:id/attachments` | مطلوبة | `[resource].update` | رفع ملفات ومرفقات مرتبطة بالكيان (`multipart/form-data`). |

---

## 3. تفاصيل عقود الطلب والاستجابة الشاملة لكل Endpoint

---

### 3.1 جلب قائمة العناصر (List Resources)

* **المسار:** `GET /api/v1/[resources]`
* **الوصف:** استرجاع قائمة العناصر مع دعم البحث والفلترة والترتيب والترقيم.
* **معاملات الاستعلام (Query Parameters):**

| المعامل (Parameter) | النوع (Type) | الإلزامية | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | اختياري | `1` | رقم الصفحة الحالية للترقيم. |
| `per_page` | `integer` | اختياري | `20` | عدد العناصر في الصفحة (الحد الأقصى: 100). |
| `search` | `string` | اختياري | `null` | البحث النصي الآمن في حقل الاسم أو الرمز. |
| `status` | `string` | اختياري | `null` | الفلترة حسب الحالة (`active`, `draft`, `archived`). |
| `[foreign_id]` | `integer` | اختياري | `null` | الفلترة حسب الكيان الأب أو التصنيف. |
| `sort_by` | `string` | اختياري | `created_at` | حقل الترتيب (من الحقول المسموحة فقط). |
| `sort_order` | `string` | اختياري | `desc` | اتجاه الترتيب (`asc` أو `desc`). |

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب البيانات):
```json
{
  "success": true,
  "message": "Resources retrieved successfully.",
  "data": [
    {
      "id": 1,
      "uuid": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Sample Item Name",
      "code": "ITEM-001",
      "status": "active",
      "foreign_key_id": 5,
      "amount_cents": 15000,
      "currency": "USD",
      "created_at": "2026-08-25T12:00:00Z",
      "updated_at": "2026-08-25T12:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 45,
    "last_page": 3
  }
}
```

##### ⚪ `200 OK` (القائمة فارغة - Empty State):
```json
{
  "success": true,
  "message": "No resources found.",
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 0,
    "last_page": 1
  }
}
```

##### 🔒 `401 Unauthorized` (غياب أو انتهاء التوكن):
```json
{
  "success": false,
  "message": "Unauthenticated access. Please provide a valid bearer token."
}
```

##### 🚫 `403 Forbidden` (عدم امتلاك الصلاحية):
```json
{
  "success": false,
  "message": "You do not have permission to view resources."
}
```

##### ⚠️ `422 Unprocessable Entity` (معامل استعلام غير صالح):
```json
{
  "success": false,
  "message": "Invalid query parameters.",
  "errors": {
    "per_page": ["The per_page field must not exceed 100."],
    "sort_by": ["The selected sort_by field is invalid."]
  }
}
```

##### 💥 `500 Internal Server Error` (خطأ خادم):
```json
{
  "success": false,
  "message": "An internal server error occurred while retrieving resources."
}
```

---

### 3.2 عرض تفاصيل عنصر محدد (Show Resource)

* **المسار:** `GET /api/v1/[resources]/:id`
* **الوصف:** استرجاع البيانات الكاملة لسجل واحد محدد.
* **المعاملات (Route Parameters):** `:id` المعرف الرقمي أو الـ UUID الخاص بالعنصر.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب التفاصيل):
```json
{
  "success": true,
  "message": "Resource details retrieved successfully.",
  "data": {
    "id": 1,
    "uuid": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "name": "Sample Item Name",
    "code": "ITEM-001",
    "description": "Full detailed description text.",
    "status": "active",
    "foreign_key_id": 5,
    "amount_cents": 15000,
    "currency": "USD",
    "created_at": "2026-08-25T12:00:00Z",
    "updated_at": "2026-08-25T12:00:00Z"
  }
}
```

##### 🔒 `401 Unauthorized` (غير مصرح):
```json
{
  "success": false,
  "message": "Unauthenticated access."
}
```

##### 🚫 `403 Forbidden` (الصلاحية غير كافية أو محاولة تجاوز نطاق المستأجر - IDOR):
```json
{
  "success": false,
  "message": "Access denied. You do not have permission to view this resource."
}
```

##### 🔍 `404 Not Found` (العنصر غير موجود أو محذوف منطقياً):
```json
{
  "success": false,
  "message": "Resource not found."
}
```

##### 💥 `500 Internal Server Error` (خطأ خادم):
```json
{
  "success": false,
  "message": "An internal server error occurred."
}
```

---

### 3.3 إنشاء عنصر جديد (Create Resource)

* **المسار:** `POST /api/v1/[resources]`
* **الوصف:** إنشاء سجل جديد بعد التحقق من صحة وتفرد البيانات.
* **جسم الطلب (Request Payload):**
```json
{
  "name": "New Resource Item",
  "code": "ITEM-002",
  "description": "Optional description text",
  "foreign_key_id": 5,
  "amount_cents": 25000,
  "currency": "USD",
  "status": "active"
}
```

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created` (نجاح الإنشاء):
```json
{
  "success": true,
  "message": "Resource created successfully.",
  "data": {
    "id": 2,
    "uuid": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    "name": "New Resource Item",
    "code": "ITEM-002",
    "description": "Optional description text",
    "status": "active",
    "foreign_key_id": 5,
    "amount_cents": 25000,
    "currency": "USD",
    "created_at": "2026-08-25T14:30:00Z"
  }
}
```

##### ⚠️ `400 Bad Request` (صياغة JSON غير صالحة):
```json
{
  "success": false,
  "message": "Malformed JSON payload in request body."
}
```

##### 🔒 `401 Unauthorized` (غير مصادق عليه):
```json
{
  "success": false,
  "message": "Unauthenticated access."
}
```

##### 🚫 `403 Forbidden` (غياب صلاحية الإنشاء):
```json
{
  "success": false,
  "message": "You do not have permission to create resources."
}
```

##### ❌ `422 Unprocessable Entity` (فشل التحقق من صحة المدخلات):
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name field is required."],
    "code": ["The code has already been taken."],
    "foreign_key_id": ["The selected foreign key id is invalid."],
    "amount_cents": ["The amount cents must be a positive integer."]
  }
}
```

##### 💥 `500 Internal Server Error` (فشل العملية في الخادم):
```json
{
  "success": false,
  "message": "Failed to create resource due to an internal server error."
}
```

---

### 3.4 تعديل عنصر قائم (Update Resource)

* **المسار:** `PUT / PATCH /api/v1/[resources]/:id`
* **الوصف:** تعديل بيانات عنصر قائم مع الحفاظ على قيود التفرد ومنع تعديل المعرف الأساسي.
* **جسم الطلب (Request Payload):**
```json
{
  "name": "Updated Resource Name",
  "description": "Updated description text",
  "status": "active",
  "amount_cents": 30000
}
```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح التعديل):
```json
{
  "success": true,
  "message": "Resource updated successfully.",
  "data": {
    "id": 1,
    "name": "Updated Resource Name",
    "code": "ITEM-001",
    "description": "Updated description text",
    "status": "active",
    "amount_cents": 30000,
    "updated_at": "2026-08-25T15:00:00Z"
  }
}
```

##### 🔒 `401 Unauthorized` (غير مصرح):
```json
{
  "success": false,
  "message": "Unauthenticated access."
}
```

##### 🚫 `403 Forbidden` (عدم امتلاك الصلاحية):
```json
{
  "success": false,
  "message": "You do not have permission to update this resource."
}
```

##### 🔍 `404 Not Found` (العنصر غير موجود):
```json
{
  "success": false,
  "message": "Resource not found."
}
```

##### ⚡ `409 Conflict` (تعارض في الحالة أو تحديث متزامن):
```json
{
  "success": false,
  "message": "Resource state conflict. The resource has been modified or closed by another process."
}
```

##### ❌ `422 Unprocessable Entity` (أخطاء التحقق):
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name field must be a string."],
    "status": ["The selected status is invalid."]
  }
}
```

##### 💥 `500 Internal Server Error` (خطأ خادم):
```json
{
  "success": false,
  "message": "Failed to update resource."
}
```

---

### 3.5 حذف عنصر (Delete Resource - Soft Delete)

* **المسار:** `DELETE /api/v1/[resources]/:id`
* **الوصف:** تنفيذ الحذف المنطقي للعنصر مع فحص قيود التبعيات.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح الحذف المنطقي):
```json
{
  "success": true,
  "message": "Resource deleted successfully."
}
```

##### 🔒 `401 Unauthorized` (غير مصرح):
```json
{
  "success": false,
  "message": "Unauthenticated access."
}
```

##### 🚫 `403 Forbidden` (غياب صلاحية الحذف):
```json
{
  "success": false,
  "message": "You do not have permission to delete this resource."
}
```

##### 🔍 `404 Not Found` (العنصر غير موجود مسبقاً):
```json
{
  "success": false,
  "message": "Resource not found."
}
```

##### ⚡ `409 Conflict` (منع الحذف لوجود ارتباطات وسجلات نشطة):
```json
{
  "success": false,
  "message": "Cannot delete resource because it is referenced by active child records."
}
```

##### 💥 `500 Internal Server Error` (خطأ خادم):
```json
{
  "success": false,
  "message": "Failed to delete resource."
}
```

---

### 3.6 رفع مرفق أو ملف (Upload Attachment)

* **المسار:** `POST /api/v1/[resources]/:id/attachments`
* **نوع المحتوى (Content-Type):** `multipart/form-data`
* **جسم الطلب (Form Fields):**
  * `file`: الملف المرفق (Binary File — الحد الأقصى: 10MB).
  * `title`: عنوان المرفق (اختياري).

#### استجابات هذا الرابط (Responses):

##### ✅ `201 Created` (نجاح رفع المرفق):
```json
{
  "success": true,
  "message": "Attachment uploaded successfully.",
  "data": {
    "id": 10,
    "file_name": "document.pdf",
    "file_size": 2048576,
    "mime_type": "application/pdf",
    "url": "https://storage.example.com/attachments/document.pdf",
    "created_at": "2026-08-25T15:15:00Z"
  }
}
```

##### 🔒 `401 Unauthorized` (غير مصرح):
```json
{
  "success": false,
  "message": "Unauthenticated access."
}
```

##### 🚫 `403 Forbidden` (عدم امتلاك الصلاحية):
```json
{
  "success": false,
  "message": "You do not have permission to upload attachments to this resource."
}
```

##### 🔍 `404 Not Found` (العنصر الأصلي غير موجود):
```json
{
  "success": false,
  "message": "Resource not found."
}
```

##### ❌ `422 Unprocessable Entity` (نوع ملف غير مدعوم أو الحجم يتجاوز 10MB):
```json
{
  "success": false,
  "message": "The uploaded file is invalid.",
  "errors": {
    "file": ["The file size must not exceed 10MB.", "The file type must be one of: pdf, png, jpg."]
  }
}
```

##### 💥 `500 Internal Server Error` (فشل التخزين في الخادم):
```json
{
  "success": false,
  "message": "Failed to upload attachment due to a storage server error."
}
```

---

## 4. مصفوفة معالجة الأخطاء الموحدة الشاملة (Global HTTP Error Matrix)

تلتزم كافة المسارات بهياكل الأخطاء الموحدة التالية:

| كود الحالة | نوع الخطأ | هيكل الاستجابة المعياري |
| :--- | :--- | :--- |
| **`400 Bad Request`** | صياغة طلب خاطئة | `{"success": false, "message": "Malformed request payload."}` |
| **`401 Unauthorized`** | غياب أو انتهاء التوكن | `{"success": false, "message": "Unauthenticated access."}` |
| **`403 Forbidden`** | عدم امتلاك الصلاحية | `{"success": false, "message": "You do not have permission to perform this action."}` |
| **`404 Not Found`** | المورد غير موجود | `{"success": false, "message": "Resource not found."}` |
| **`409 Conflict`** | تعارض في الحالة أو العلاقات | `{"success": false, "message": "State conflict or dependency constraint violation."}` |
| **`422 Unprocessable`** | فشل التحقق من المدخلات | `{"success": false, "message": "Validation failed.", "errors": {"field": ["..."]}}` |
| **`429 Rate Limit`** | تجاوز معدل الطلبات | `{"success": false, "message": "Too many requests. Please try again later."}` |
| **`500 Server Error`** | خطأ خادم داخلي | `{"success": false, "message": "An internal server error occurred."}` |

---

## 5. قواعد الحماية وأمان المسارات (Security & Route Protection)

1. **المصادقة الإلزامية:** تغليف كافة مسارات المرحلة بـ Middleware التحقق من المصادقة (Auth Guard).
2. **فحص الصلاحيات (RBAC Middleware):** التحقق من امتلاك المستخدم للصلاحية المحددة في الجدول قبل وصول الطلب إلى المعالج.
3. **عزل المستأجرين (Tenant Scope):** حصر استعلامات المسارات تلقائياً بنطاق المستأجر الحالي لمنع تسريب البيانات.
4. **حماية الـ IDOR:** التأكد من أن المعرف الممرر في الرابط `:id` يتبع للمستأجر/المستخدم صاحب الطلب.

---

## 6. معايير القبول والاكتمال لمسارات الـ API (Acceptance Criteria)

- [ ] كافة المسارات المذكورة في هذا الملف مسجلة وتعمل بالـ HTTP Methods المحددة.
- [ ] الترويسات ومسارات الـ API تتبع نمط التسمية الجمع المعياري (`/api/v1/[resources]`).
- [ ] التحقق الصارم من صحة المدخلات مطبق على مسارات `POST` و `PUT/PATCH` مع إرجاع `422` وهيكل الأخطاء الدقيق.
- [ ] استجابات النجاح والفشل تلتزم بالهيكل الموحد (`success`, `data`, `message`, `errors`).
- [ ] الترقيم الإلزامي يعمل بنجاح مع معاملات `page` و `per_page`.
- [ ] جميع حالات الاستجابة الموثقة لكل رابط (200, 201, 400, 401, 403, 404, 409, 422, 500) مغطاة في الاختبارات الآلية بنسبة 100%.
- [ ] هذا الملف متطابق تماماً ومتزامن مع `MD/database.md` و `backend.md`.

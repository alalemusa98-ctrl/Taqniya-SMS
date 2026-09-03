# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 01: الهوية والمصادقة والتدقيق (Network SSoT)

> **الهدف:** توثيق المسارات الـ 10 كاملة لإدارة الهوية والمصادقة الموحدة وحسابات المستخدمين وسجلات التدقيق الأمني مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع تزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم القياسي (`Pagination Meta`) ودعم البحث والترتيب والتصفية.  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف ([`routes.md`](./routes.md)) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `429 Too Many Requests`, `500 Internal Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في هذا الملف حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1`
- **Protocol:** `HTTPS`
- **Data Format:** `JSON` (`application/json`)
- **Required Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Accept: application/json
  Content-Type: application/json
  Accept-Language: ar
  ```
- **حدود معدل الطلبات (Rate Limiting & Brute Force Protection):**
  - مسار تسجيل الدخول (`/auth/login`): `5 requests / minute` لكل عنوان IP لمنع هجمات التخمين (Brute-force).
  - باقي المسارات العامة: `60 requests / minute` لكل توكن نشط.

### 📋 مصفوفة المسارات الـ 10 الموحدة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `auth` | `POST` | `/api/v1/auth/login` | عام (Public) | تسجيل الدخول الموحد بـ `user_code` وكلمة المرور وإصدار توكن JWT وتوثيق الجلسة |
| **2** | `auth` | `GET` | `/api/v1/auth/me` | مسجل دخول نشط | استرجاع بيانات الملف الشخصي والصلاحيات للمستخدم الحالي لتوجيه الواجهة |
| **3** | `auth` | `POST` | `/api/v1/auth/logout` | مسجل دخول نشط | تسجيل الخروج وإبطال التوكن وشطب الجلسة من `personal_access_tokens` |
| **4** | `auth` | `POST` | `/api/v1/auth/change-password` | مسجل دخول نشط | تغيير كلمة المرور للمستخدم الحالي بعد التحقق الإلزامي من كلمة المرور الحالية |
| **5** | `users` | `GET` | `/api/v1/users` | `admin` | استعراض وتصفية وبحث حسابات المستخدمين بالترقيم والفلترة بالدور والحالة |
| **6** | `users` | `GET` | `/api/v1/users/:id` | `admin` | استعراض تفاصيل حساب مستخدم محدد وسجل آخر دخول |
| **7** | `users` | `PUT` | `/api/v1/users/:id/status` | `admin` | تفعيل أو إيقاف/تعطيل حساب المستخدم (`is_active: 1 / 0`) |
| **8** | `users` | `POST` | `/api/v1/users/:id/reset-password` | `admin` | إعادة تعيين وتوليد كلمة مرور جديدة لحساب مستخدم من قِبل إدارة المدرسة |
| **9** | `audit_logs` | `GET` | `/api/v1/audit-logs` | `admin` | استعراض وتصفية سجلات التدقيق الأمني والحركات الحساسة بالترقيم والفرز |
| **10** | `audit_logs` | `GET` | `/api/v1/audit-logs/:id` | `admin` | استعراض تفاصيل حركة تدقيق محددة ومقارنة القيم السابقة والجديدة |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API الـ 10** بالمرحلة:

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

// 429 Too Many Requests (تجاوز معدل الطلبات المسموح)
{
  "success": false,
  "message": "تم تجاوز الحد الأقصى للطلبات المسموحة. يرجى الانتظار دقيقة واحدة والمحاولة مجدداً."
}

// 500 Internal Server Error (خطأ غير متوقع في الخادم)
{
  "success": false,
  "message": "حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً."
}
```

---

## 🔐 المجموعة 1: المصادقة وإدارة الجلسات (`auth`) — [4 مسارات]

---

### 1.1 `POST /api/v1/auth/login` — تسجيل الدخول الموحد

> **الوصف الوظيفي:** مصادقة المستخدم عبر الرمز المؤسسي الموحد (`user_code`) وفحص حالة التفعيل `is_active` وإصدار توكن الجلسة وتحديث `last_login_at` وتوثيق حركة الدخول في `audit_logs`.

- **Rate Limit:** 5 محاولات في الدقيقة لكل عنوان IP.
- **Request Body:**
  ```json
  {
    "user_code": "ADM-1001",
    "password": "SecretPassword@123",
    "device_name": "Chrome on Windows 11"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح تسجيل الدخول):
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_at": "2026-08-29T16:30:00Z",
    "user": {
      "id": 1,
      "user_code": "ADM-1001",
      "role_type": "admin",
      "is_active": 1,
      "last_login_at": "2026-08-28T16:30:00Z"
    }
  }
}
```

##### 🔒 `401 Unauthorized` (بيانات الدخول غير صحيحة):
```json
{
  "success": false,
  "message": "رمز المستخدم أو كلمة المرور غير صحيحة."
}
```

##### 🚫 `403 Forbidden` (الحساب موقوف أو معطل):
```json
{
  "success": false,
  "message": "هذا الحساب معطل حالياً من قِبل إدارة المدرسة. يرجى مراجعة الإدارة."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "البيانات المدخلة غير مستوفية للشروط.",
  "errors": {
    "user_code": ["حقل رمز المستخدم مطلوب ويجب أن يطابق النمط المؤسسي."],
    "password": ["حقل كلمة المرور مطلوب."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات ومعدل الطلبات والخادم (`401`, `403`, `429`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.2 `GET /api/v1/auth/me` — استرجاع الملف الشخصي والجلسة النشطة

> **الوصف الوظيفي:** استرجاع بيانات المستخدم الحالي الموثق بالتوكن النشط لتوجيه الواجهة وضبط الصلاحيات ولوحة التحكم.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم استرجاع بيانات الملف الشخصي بنجاح.",
  "data": {
    "id": 1,
    "user_code": "ADM-1001",
    "role_type": "admin",
    "is_active": 1,
    "last_login_at": "2026-08-28T16:30:00Z",
    "created_at": "2026-08-25T10:00:00Z"
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `POST /api/v1/auth/logout` — تسجيل الخروج وإبطال الجلسة

> **الوصف الوظيفي:** إبطال توكن الجلسة الحالية وشطبها من `personal_access_tokens` وتوثيق حركة الخروج في `audit_logs`.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح وإبطال جلسة العمل."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `POST /api/v1/auth/change-password` — تغيير كلمة المرور الذاتي

> **الوصف الوظيفي:** تمكين المستخدم الحالي من تحديث كلمة المرور الخاصة به بعد التحقق الإلزامي من كلمة المرور الحالية وتوثيق الحركة في `audit_logs`.

- **Request Body:**
  ```json
  {
    "current_password": "OldPassword@123",
    "new_password": "NewSecurePassword@2026",
    "new_password_confirmation": "NewSecurePassword@2026"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تحديث كلمة المرور بنجاح."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "فشل التحقق من صحة البيانات المدخلة.",
  "errors": {
    "current_password": ["كلمة المرور الحالية غير صحيحة."],
    "new_password": [
      "يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.",
      "يجب أن تتطابق كلمة المرور الجديدة مع حقل التأكيد."
    ]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

## 👥 المجموعة 2: إدارة حسابات المستخدمين (`users`) — [4 مسارات]

---

### 2.1 `GET /api/v1/users` — استعراض وتصفية قائمة المستخدمين

> **الوصف الوظيفي:** استرجاع قائمة حسابات المستخدمين بالمنظومة مع دعم الفلترة بنوع الدور (`role_type`)، حالة الحساب (`is_active`)، والبحث بالرمز المؤسسي (`user_code`) والترقيم القياسي والفرز.

- **الصلاحية المطلوبة:** `admin` حصراً.
- **Query Parameters:**
  - `search` (optional, string): البحث النصي بالرمز المؤسسي (مثل: `TCH-2005`).
  - `role_type` (optional, string, enum: `admin`, `teacher`, `student`, `parent`): تصفية حسب الدور.
  - `is_active` (optional, integer, enum: `0`, `1`): تصفية حسب حالة التفعيل.
  - `sort_by` (optional, string, enum: `id`, `user_code`, `last_login_at`, `created_at`, default `id`): حقل الفرز.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة بالهيكل الشجري المبوب بالأدوار):
```json
{
  "success": true,
  "message": "تم جلب قائمة حسابات المستخدمين بنجاح.",
  "data": {
    "total_users": 4,
    "role_types": [
      {
        "role_type": "admin",
        "role_type_ar": "مديرو النظام",
        "users_count": 1,
        "users": [
          {
            "id": 1,
            "user_code": "ADM-1001",
            "is_active": 1,
            "last_login_at": "2026-08-28T16:30:00Z",
            "created_at": "2026-08-25T10:00:00Z"
          }
        ]
      },
      {
        "role_type": "teacher",
        "role_type_ar": "المعلمون",
        "users_count": 1,
        "users": [
          {
            "id": 2,
            "user_code": "TCH-2001",
            "is_active": 1,
            "last_login_at": "2026-08-28T14:15:00Z",
            "created_at": "2026-08-25T10:30:00Z"
          }
        ]
      },
      {
        "role_type": "student",
        "role_type_ar": "الطلاب",
        "users_count": 1,
        "users": [
          {
            "id": 3,
            "user_code": "STU-3001",
            "is_active": 1,
            "last_login_at": "2026-08-27T18:00:00Z",
            "created_at": "2026-08-25T11:00:00Z"
          }
        ]
      },
      {
        "role_type": "parent",
        "role_type_ar": "أولياء الأمور",
        "users_count": 1,
        "users": [
          {
            "id": 4,
            "user_code": "PAR-4001",
            "is_active": 0,
            "last_login_at": null,
            "created_at": "2026-08-25T11:15:00Z"
          }
        ]
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 4,
    "last_page": 1
  }
}
```

##### ⚪ `200 OK` (القائمة فارغة):
```json
{
  "success": true,
  "message": "لا يوجد مستخدمون يطابقون محددات البحث.",
  "data": {
    "total_users": 0,
    "role_types": []
  },
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

### 2.2 `GET /api/v1/users/:id` — عرض تفاصيل حساب مستخدم محدد

> **الوصف الوظيفي:** استرجاع البيانات التفصيلية لحساب المستخدم وسجل جلسات الدخول.

- **الصلاحية المطلوبة:** `admin` حصراً.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب تفاصيل حساب المستخدم بنجاح.",
  "data": {
    "id": 2,
    "user_code": "TCH-2001",
    "role_type": "teacher",
    "role_type_ar": "معلم",
    "is_active": 1,
    "last_login_at": "2026-08-28T14:15:00Z",
    "created_at": "2026-08-25T10:30:00Z",
    "updated_at": "2026-08-28T14:15:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "حساب المستخدم غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.3 `PUT /api/v1/users/:id/status` — تعديل حالة تفعيل أو إيقاف الحساب

> **الوصف الوظيفي:** تغيير حالة الحساب إلى نشط أو موقوف وتوثيق الحركة في `audit_logs`، وفي حال الإيقاف يتم إبطال كافة الجلسات النشطة للمستخدم فوراً.

- **الصلاحية المطلوبة:** `admin` حصراً.
- **Request Body:**
  ```json
  {
    "is_active": 0,
    "reason": "إيقاف مؤقت بناءً على طلب إدارة شؤون العاملين"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم تحديث حالة تفعيل الحساب بنجاح وإلغاء جلساته النشطة.",
  "data": {
    "id": 4,
    "user_code": "PAR-4001",
    "is_active": 0,
    "updated_at": "2026-08-29T10:00:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "حساب المستخدم غير موجود."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات تعديل الحالة غير صالحة.",
  "errors": {
    "is_active": ["حقل حالة التفعيل مطلوب ويجب أن يكون 0 أو 1."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 2.4 `POST /api/v1/users/:id/reset-password` — إعادة تعيين كلمة المرور من الإدارة

> **الوصف الوظيفي:** قيام مدير النظام بإعادة تعيين كلمة مرور مستخدم (في حال نسيانها) وإلغاء جلسات المستخدم الحالية لفرض تسجيل الدخول بكلمة المرور الجديدة وتوثيق العملية في `audit_logs`.

- **الصلاحية المطلوبة:** `admin` حصراً.
- **Request Body:**
  ```json
  {
    "new_password": "TempPassword@2026"
  }
  ```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم إعادة تعيين كلمة المرور بنجاح وإلغاء جلسات المستخدم السابقة."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "حساب المستخدم غير موجود."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "كلمة المرور الجديدة غير مستوفية للشروط.",
  "errors": {
    "new_password": ["يجب ألا تقل كلمة المرور عن 8 أحرف وتحتوي على أرقام ورموز."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

## 📜 المجموعة 3: سجلات التدقيق الأمني والحركات (`audit_logs`) — [مساران]

---

### 3.1 `GET /api/v1/audit-logs` — استعراض وتصفية سجلات التدقيق الأمني

> **الوصف الوظيفي:** استرجاع قائمة سجلات التدقيق والحركات الحساسة المنفذة بالمنظومة مع دعم الفلترة بالمستخدم المنفذ، نوع الحركة، اسم الكيان، والنطاق الزمني والترقيم.

- **الصلاحية المطلوبة:** `admin` حصراً.
- **Query Parameters:**
  - `user_id` (optional, bigint): تصفية الحركات المنفذة بواسطة مستخدم معين.
  - `action` (optional, string, enum: `login`, `logout`, `create`, `update`, `delete`, `promote`, `password_change`): نوع الحركة.
  - `entity_type` (optional, string): اسم الكيان المتأثر (مثل: `User`, `Student`, `Assignment`).
  - `date_from` (optional, date): بداية النطاق الزمني (`YYYY-MM-DD`).
  - `date_to` (optional, date): نهاية النطاق الزمني (`YYYY-MM-DD`).
  - `sort_by` (optional, string, enum: `id`, `created_at`, default `created_at`): حقل الترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الترتيب.
  - `page` (optional, integer, default `1`): رقم الصفحة.
  - `per_page` (optional, integer, default `15`): عدد السجلات بالصفحة.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة):
```json
{
  "success": true,
  "message": "تم جلب سجلات التدقيق بنجاح.",
  "data": [
    {
      "id": 105,
      "user_id": 1,
      "user_code": "ADM-1001",
      "action": "update",
      "action_ar": "تعديل بيانات",
      "entity_type": "User",
      "entity_id": 4,
      "ip_address": "192.168.1.50",
      "created_at": "2026-08-29T10:00:00Z"
    },
    {
      "id": 104,
      "user_id": 2,
      "user_code": "TCH-2001",
      "action": "login",
      "action_ar": "تسجيل دخول",
      "entity_type": "User",
      "entity_id": 2,
      "ip_address": "192.168.1.75",
      "created_at": "2026-08-28T14:15:00Z"
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
  "message": "لا توجد سجلات تدقيق تطابق محددات البحث.",
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

### 3.2 `GET /api/v1/audit-logs/:id` — استعراض تفاصيل حركة تدقيق محددة

> **الوصف الوظيفي:** استرجاع التفاصيل الكاملة لحركة التدقيق متضمنة مقارنة القيم السابقة (`old_values`) والقيم الجديدة (`new_values`) وبيانات الـ IP والـ User-Agent.

- **الصلاحية المطلوبة:** `admin` حصراً.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب تفاصيل حركة التدقيق بنجاح.",
  "data": {
    "id": 105,
    "user_id": 1,
    "user_code": "ADM-1001",
    "action": "update",
    "action_ar": "تعديل بيانات",
    "entity_type": "User",
    "entity_id": 4,
    "old_values": {
      "is_active": 1
    },
    "new_values": {
      "is_active": 0,
      "reason": "إيقاف مؤقت بناءً على طلب إدارة شؤون العاملين"
    },
    "ip_address": "192.168.1.50",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "created_at": "2026-08-29T10:00:00Z"
  }
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "سجل حركة التدقيق غير موجود."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

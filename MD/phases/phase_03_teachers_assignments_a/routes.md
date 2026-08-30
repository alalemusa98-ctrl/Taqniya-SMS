# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 03-A (Network SSoT)

> **الهدف:** توثيق مسارات إدارة ملفات السجل الوظيفي للكادر التعليمي والمعلمين مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح ومنع التكرار، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم القياسي (`Pagination Meta`).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف ([`routes.md`](./routes.md)) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/teachers`
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
| **1** | `teachers` | `GET` | `/api/v1/teachers` | `admin` | استعراض وبحث قائمة المعلمين بالتخصص والترقيم |
| **2** | `teachers` | `GET` | `/api/v1/teachers/:id` | `admin` / `teacher (own)` | استعراض الملف الشخصي والتفصيلي لمعلم محدد |
| **3** | `teachers` | `POST` | `/api/v1/teachers` | `admin` | إنشاء ملف معلم جديد وتوليد حساب الدخول الموحد (`TCH-XXXX`) ذرياً |
| **4** | `teachers` | `PUT` | `/api/v1/teachers/:id` | `admin` | تعديل البيانات الشخصية والمهنية للمعلم |
| **5** | `teachers` | `DELETE` | `/api/v1/teachers/:id` | `admin` | حذف ملف المعلم وحسابه بشرط عدم وجود إسناد تدريس (RESTRICT) |

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

## 👨‍🏫 الخطوة 1: إدارة ملفات وسجل المعلمين (`teachers`) — [مواصفات المسارات المدمجة]

---

### 1.1 `GET /api/v1/teachers` — استعراض وبحث قائمة المعلمين

> **الوصف الوظيفي:** استرجاع قائمة معلمي المدرسة مع دعم البحث النصي بالاسم أو الرمز الموحد `user_code`، والتصفية بالتخصص وحالة الحساب والفرز والترقيم.

- **Query Parameters:**
  - `search` (optional, string): البحث النصي باسم المعلم أو الرمز المؤسسي الموحد (مثال: `أحمد` أو `TCH-2001`).
  - `specialization` (optional, string): فلترة المعلمين حسب التخصص العلمي (مثال: `الرياضيات`).
  - `is_active` (optional, integer: `0` أو `1`): فلترة بحسب حالة الحساب النشط.
  - `sort_by` (optional, string, enum: `id`, `full_name`, `user_code`, `hire_date`, default `id`): حقل الفرز.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/teachers?search=أحمد&specialization=الرياضيات&sort_by=hire_date&sort_order=desc`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة):
```json
{
  "success": true,
  "message": "تم جلب قائمة المعلمين بنجاح.",
  "data": [
    {
      "id": 1,
      "user_id": 10,
      "user_code": "TCH-2001",
      "full_name": "أحمد محمود سالم",
      "phone": "0912345678",
      "specialization": "الرياضيات",
      "hire_date": "2022-09-01",
      "is_active": 1
    },
    {
      "id": 2,
      "user_id": 11,
      "user_code": "TCH-2002",
      "full_name": "خالد عبد السلام الفيتوري",
      "phone": "0923456789",
      "specialization": "العلوم العامة",
      "hire_date": "2023-01-15",
      "is_active": 1
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
  "message": "لا يوجد معلمون مسجلون يطابقون محددات البحث.",
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

### 1.2 `GET /api/v1/teachers/:id` — استعراض تفاصيل ملف معلم محدد

> **الوصف الوظيفي:** استرجاع الملف الشخصي الكامل لمعلم محدد متضمناً حساب دخوله الموحد وبياناته المهنية.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم جلب تفاصيل ملف المعلم بنجاح.",
  "data": {
    "id": 1,
    "user_id": 10,
    "user_code": "TCH-2001",
    "full_name": "أحمد محمود سالم",
    "phone": "0912345678",
    "specialization": "الرياضيات",
    "hire_date": "2022-09-01",
    "is_active": 1,
    "created_at": "2022-09-01T10:00:00Z"
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

### 1.3 `POST /api/v1/teachers` & `PUT /api/v1/teachers/:id` — إنشاء وتعديل ملف المعلم (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** إنشاء ملف المعلم وتوليد حساب الدخول الموحد (`TCH-XXXX`) في `users` ذرياً.
> * **في التعديل (`PUT`):** تحديث بيانات ملف المعلم (الاسم، الهاتف، التخصص، تاريخ التعيين، أو كلمة المرور).

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "full_name": "علي مصطفى الورفلي",
    "phone": "0934567890",
    "specialization": "اللغة العربية",
    "hire_date": "2026-09-01",
    "password": "Password123!"
  }
  ```
  *(ملاحظة: حقل `password` إلزامي في الإنشاء `POST`، واختياري في التعديل `PUT` عند الرغبة في تغيير كلمة المرور فقط).*

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
```json
{
  "success": true,
  "message": "تم إنشاء ملف المعلم وتوليد حساب الدخول الموحد بنجاح.",
  "data": {
    "id": 3,
    "user_id": 12,
    "user_code": "TCH-2003",
    "full_name": "علي مصطفى الورفلي",
    "phone": "0934567890",
    "specialization": "اللغة العربية",
    "hire_date": "2026-09-01",
    "created_at": "2026-08-29T12:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث بيانات ملف المعلم بنجاح.",
  "data": {
    "id": 1,
    "user_id": 10,
    "user_code": "TCH-2001",
    "full_name": "أحمد محمود سالم الورفلي",
    "phone": "0919999999",
    "specialization": "الرياضيات والفيزياء",
    "hire_date": "2022-09-01"
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "ملف المعلم غير موجود."
}
```

##### ⚡ `409 Conflict` (تكرار رقم الهاتف):
```json
{
  "success": false,
  "message": "رقم هاتف المعلم مسجل مسبقاً."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات ملف المعلم غير صالحة.",
  "errors": {
    "full_name": ["الاسم الرباعي واللقب للمعلم مطلوب."],
    "password": ["كلمة المرور يجب ألا تقل عن 8 خانات وتحتوي على أرقام وحروف."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.4 `DELETE /api/v1/teachers/:id` — حذف ملف معلم غير مرتبط بإسناد

> **الوصف الوظيفي:** تنفيذ الحذف المنطقي لملف المعلم وحسابه بشرط عدم وجود إسنادات تدريس نشطة أو سابقة مرصودة باسمه في `teaching_assignments`.

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف ملف المعلم وحسابه بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "ملف المعلم غير موجود."
}
```

##### ⚡ `409 Conflict` (منع الحذف لوجود إسنادات تدريس RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف ملف المعلم لوجود إسنادات تدريس أو جداول حصص مرتبطة به (RESTRICT)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

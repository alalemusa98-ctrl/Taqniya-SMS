# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 03-A (Network SSoT)

> **الهدف:** توثيق المسارات الـ 5 كاملة لإدارة ملفات السجل الوظيفي للكادر التعليمي والمعلمين مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف (`routes.md`) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/teachers`
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

## 👨‍🏫 الخطوة 1: إدارة ملفات وسجل المعلمين (`teachers`) — [5 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لإدارة الكادر التعليمي:**
> 1. **الهوية الموحدة وتوليد الرمز تلقائياً:** عند إنشاء ملف معلم جديد، يتولى الخادم تلقائياً إنشاء حساب دخول في جدول `users` وتوليد الرمز المؤسسي الموحد بالبادئة `TCH-` برقم تسلسلي فريد (مثل `TCH-2005`).
> 2. **صلاحيات الإدارة:** إنشاء وتعديل وحذف ملفات المعلمين مقتصرة حصراً على مدير النظام (`role_type = 'admin'`).
> 3. **حماية الحذف والمرجعيات:** يمنع حذف أي معلم له إسناد تدريس بجدول `teaching_assignments` لحماية النزاهة التاريخية (`ON DELETE RESTRICT`).

---

### 1.1 `GET /api/v1/teachers` — عرض قائمة وبحث سجل المعلمين

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة معلمي المدرسة مع دعم البحث النصي بالاسم أو الرمز الموحد `user_code` والتصفية بالتخصص وحالة الحساب والترتيب والتقسيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي باسم المعلم أو الرمز المؤسسي الموحد (مثال: `أحمد` أو `TCH-2001`).
  - `specialization` (optional, string): فلترة المعلمين حسب التخصص العلمي (مثال: `الرياضيات`).
  - `is_active` (optional, integer: `0` أو `1`): فلترة بحسب حالة الحساب النشط.
  - `sort_by` (optional, string, enum: `id`, `full_name`, `user_code`, `hire_date`, default `id`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `desc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/teachers?search=أحمد&specialization=الرياضيات&sort_by=hire_date&sort_order=desc`
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة المعلمين بنجاح.",
      "data": [
        { "id": 1, "user_id": 10, "user_code": "TCH-2001", "full_name": "أحمد محمود سالم", "phone": "0912345678", "specialization": "الرياضيات", "hire_date": "2022-09-01", "is_active": 1 },
        { "id": 2, "user_id": 11, "user_code": "TCH-2002", "full_name": "خالد عبد السلام الفيتوري", "phone": "0923456789", "specialization": "العلوم العامة", "hire_date": "2023-01-15", "is_active": 1 }
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

### 1.2 `GET /api/v1/teachers/:id` — عرض تفاصيل ملف معلم محدد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع الملف الشخصي الكامل لمعلم محدد متضمناً حساب دخوله الموحد والبيانات المهنية والتاريخية.

- **Response Payloads:**
  - **`200 OK`:**
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
  - **`404 Not Found`:** `{"success": false, "message": "ملف المعلم غير موجود."}`

---

### 1.3 `POST /api/v1/teachers` — إنشاء ملف معلم وتوليد/ربط حساب الدخول الموحد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إنشاء ملف معلم جديد بالمنظومة وتوليد حساب الدخول الموحد في جدول `users` بالرمز المؤسسي `TCH-XXXX` تلقائياً.

- **Request Body:**
  ```json
  {
    "full_name": "علي مصطفى الورفلي",
    "phone": "0934567890",
    "specialization": "اللغة العربية",
    "hire_date": "2026-09-01",
    "password": "Password123!"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
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
  - **`409 Conflict`:** `{"success": false, "message": "رقم هاتف المعلم مسجل مسبقاً."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من مدخلات ملف المعلم.",
      "errors": { "full_name": ["الاسم الرباعي للمعلم مطلوب."] }
    }
    ```

---

### 1.4 `PUT /api/v1/teachers/:id` — تعديل البيانات الشخصية والمهنية للمعلم

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث بيانات ملف المعلم (الاسم، الهاتف، التخصص، أو تاريخ التعيين).

- **Request Body:**
  ```json
  {
    "full_name": "أحمد محمود سالم الورفلي",
    "phone": "0919999999",
    "specialization": "الرياضيات والفيزياء",
    "hire_date": "2022-09-01"
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
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
  - **`404 Not Found`:** `{"success": false, "message": "ملف المعلم غير موجود."}`
  - **`409 Conflict`:** `{"success": false, "message": "رقم الهاتف مستخدم مسبقاً لمعلم آخر."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من البيانات المدخلة."}`

---

### 1.5 `DELETE /api/v1/teachers/:id` — حذف ملف معلم غير مرتبط بإسناد

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** حذف ملف المعلم وحسابه المنطقي بشرط عدم وجود إسنادات تدريس نشطة أو سابقة مرصودة باسمه في `teaching_assignments`.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف ملف المعلم وحسابه بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف ملف المعلم لارتباطه بالحصة الدراسية أو جدول إسناد التدريس (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "ملف المعلم غير موجود."}`

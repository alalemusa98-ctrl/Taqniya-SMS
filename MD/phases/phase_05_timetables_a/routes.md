# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 05-A (Network SSoT)

> **الهدف:** توثيق المسارات الـ 4 كاملة لإدارة فترات وتوقيتات الحصص والفسح اليومية (`period_slots`) مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، مع دمج وتوحيد مواصفات الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة ومنع التكرار، وتزويد مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم القياسي (`Pagination Meta`) ودعم البحث والترتيب والتصفية.  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف ([`routes.md`](./routes.md)) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**معاملات البحث والفلترة (`Query Parameters & Filters`)**، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في هذا الملف حصراً بدون أي اجتهاد شخصي.

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

### 📋 مصفوفة المسارات الـ 4 الموحدة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `period_slots` | `GET` | `/api/v1/period-slots` | `admin` / `teacher` / `student` / `parent` | استعراض وبحث فترات وتوقيتات الحصص والفسح اليومية |
| **2** | `period_slots` | `POST` | `/api/v1/period-slots` | `admin` | إضافة فترة حصة أو استراحة جديدة مع فحص تفرد التسلسل |
| **3** | `period_slots` | `PUT` | `/api/v1/period-slots/:id` | `admin` | تعديل مسمى وتوقيتات فترة الحصة أو الاستراحة |
| **4** | `period_slots` | `DELETE` | `/api/v1/period-slots/:id` | `admin` | حذف فترة الحصة مع فحص الحماية المرجعية (RESTRICT) |

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

> **قاعدة حوكمية:** هياكل الـ JSON التالية تمثل المعيار العام الموحد للأخطاء المشتركة، وتنطبق تلقائياً على **كافة مسارات الـ API الـ 4** بالمرحلة:

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

## ⏰ الخطوة 1: إدارة سجل فترات وتوقيتات الحصص اليومية (`period_slots`) — [مواصفات المسارات]

---

### 1.1 `GET /api/v1/period-slots` — استعراض وبحث فترات وتوقيتات الحصص والفسح اليومية

> **الوصف الوظيفي:** استرجاع قائمة الفترات الزمنية للحصص والفسح باليوم المدرسي مرتبة تسلسلياً بحسب `slot_number` مع دعم الفلترة بحالة الاستراحة والبحث والترقيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters:**
  - `search` (optional, string): البحث النصي بمسمى الحصة (مثال: `الحصة الأولى` أو `الفسحة`).
  - `is_break` (optional, integer, enum: `0`, `1`): تصفية الحصص التعليمية (`0`) أو فترات الاستراحة (`1`).
  - `sort_by` (optional, string, enum: `id`, `slot_number`, `start_time`, default `slot_number`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/period-slots?is_break=0&sort_by=slot_number&sort_order=asc`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب القائمة):
```json
{
  "success": true,
  "message": "تم جلب فترات الحصص اليومية بنجاح.",
  "data": [
    {
      "id": 1,
      "name": "الحصة الأولى",
      "slot_number": 1,
      "start_time": "08:00:00",
      "end_time": "08:45:00",
      "is_break": 0,
      "created_at": "2026-08-29T08:00:00Z"
    },
    {
      "id": 2,
      "name": "الحصة الثانية",
      "slot_number": 2,
      "start_time": "08:45:00",
      "end_time": "09:30:00",
      "is_break": 0,
      "created_at": "2026-08-29T08:00:00Z"
    },
    {
      "id": 3,
      "name": "الفسحة / الاستراحة",
      "slot_number": 3,
      "start_time": "09:30:00",
      "end_time": "10:00:00",
      "is_break": 1,
      "created_at": "2026-08-29T08:00:00Z"
    }
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
  "message": "لا توجد فترات حصص تطابق محددات البحث.",
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

### 1.2 `POST /api/v1/period-slots` & `PUT /api/v1/period-slots/:id` — إنشاء وتعديل فترة حصة (Combined Specification)

> **الوصف الوظيفي:**
> * **في الإنشاء (`POST`):** إضافة فترة حصة أو فسحة جديدة لليوم المدرسي مع التحقق من تفرد التسلسل (`uq_period_slots_number`) وأسبقية وقت البداية على وقت النهاية.
> * **في التعديل (`PUT`):** تحديث مسمى وتوقيتات الحصة.

- **Request Body (موحد للإنشاء والتعديل):**
  ```json
  {
    "name": "الحصة السادسة",
    "slot_number": 6,
    "start_time": "12:00:00",
    "end_time": "12:45:00",
    "is_break": 0
  }
  ```

#### استجابات الإنشاء والتعديل (Responses):

##### ✅ `201 Created` (خاص بالإنشاء POST):
```json
{
  "success": true,
  "message": "تم إنشاء فترة الحصة اليومية بنجاح.",
  "data": {
    "id": 6,
    "name": "الحصة السادسة",
    "slot_number": 6,
    "start_time": "12:00:00",
    "end_time": "12:45:00",
    "is_break": 0,
    "created_at": "2026-08-29T12:00:00Z"
  }
}
```

##### ✅ `200 OK` (خاص بالتعديل PUT):
```json
{
  "success": true,
  "message": "تم تحديث فترة الحصة اليومية بنجاح.",
  "data": {
    "id": 6,
    "name": "الحصة السادسة والأخيرة",
    "slot_number": 6,
    "start_time": "12:00:00",
    "end_time": "12:50:00",
    "is_break": 0
  }
}
```

##### 🔍 `404 Not Found` (خاص بالتعديل PUT):
```json
{
  "success": false,
  "message": "فترة الحصة غير موجودة."
}
```

##### ⚡ `409 Conflict` (تكرار رقم الحصة التسلسلي):
```json
{
  "success": false,
  "message": "الرقم التسلسلي للحصة مسجل مسبقاً (uq_period_slots_number)."
}
```

##### ⚠️ `422 Unprocessable Entity`:
```json
{
  "success": false,
  "message": "بيانات فترة الحصة غير صالحة.",
  "errors": {
    "end_time": ["وقت النهاية يجب أن يكون لاحقاً لوقت البداية."],
    "slot_number": ["الرقم التسلسلي للحصة مطلوب ويجب أن يكون رقماً صحيحاً موجباً."]
  }
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

---

### 1.3 `DELETE /api/v1/period-slots/:id` — حذف فترة حصة

> **الوصف الوظيفي:** حذف فترة الحصة اليومية بشرط عدم استخدامها في أي جدول حصص أسبوعي (`timetable_slots`).

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK`:
```json
{
  "success": true,
  "message": "تم حذف فترة الحصة بنجاح."
}
```

##### 🔍 `404 Not Found`:
```json
{
  "success": false,
  "message": "فترة الحصة غير موجودة."
}
```

##### ⚡ `409 Conflict` (حماية النزاهة المرجعية RESTRICT):
```json
{
  "success": false,
  "message": "لا يمكن حذف فترة الحصة لارتباطها بحصص مجدولة في الجداول الأسبوعية (Foreign Key Restrict)."
}
```

> 🔒 *أخطاء المصادقة والصلاحيات والخادم (`401`, `403`, `500`) تخضع للمعيار العام الموحد في [القسم 1.1](#-11-نمط-الاستجابات-العامة-للأخطاء-المشتركة-global-standard-error-responses).*

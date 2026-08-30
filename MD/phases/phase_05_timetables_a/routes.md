# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 05-A (Network SSoT)

> **الهدف:** توثيق المسارات الـ 5 كاملة لإدارة فترات وتوقيتات الحصص والفسح اليومية مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md)، وتزويد كافة مسارات جلب القوائم باستجابات موجزة ومستوفية لعدة عناصر (`Multi-Item List Payload`) مع الترقيم المالي القياسي (`Pagination Meta`) ودعم البحث والتصفية (`CRUDS Standard: Create, Read, Update, Delete, Search`).  
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

## ⏰ الخطوة 1: إدارة سجل فترات وتوقيتات الحصص اليومية (`period_slots`) — [5 مسارات]

> [!NOTE]
> **الشرح والملاحظات الحوكمية لـ فترات الحصص:**
> 1. **فرادة الرقم التسلسلي للحصة:** يمنع تكرار `slot_number` لضمان الترتيب التسلسلي المحكم لليوم الدراسي (`uq_period_slots_number`).
> 2. **صلاحيات الإدارة:** إضافة وتعديل وحذف الفترات الزمنية مقتصر حصراً على مدير النظام (`role_type = 'admin'`).
> 3. **حوكمة وقت البداية والنهاية:** يلزم أن يكون وقت البداية `start_time` أسبق منطقياً من وقت النهاية `end_time`.
> 4. **حماية الحذف المرجعي:** يمنع حذف أي فترة حصة مرتبطة بجدول الحصص الأسبوعي بجدول `timetable_slots` (`ON DELETE RESTRICT`).

---

### 1.1 `GET /api/v1/period-slots` — عرض وتصفية فترات الحصص والفسح اليومية

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع قائمة الفترات الزمنية للحصص والفسح باليوم المدرسي مرتبة تسلسلياً بحسب `slot_number` مع دعم الفلترة بحالة الاستراحة والبحث والترقيم الصفحي (CRUDS - Search & Filter Engine).

- **Query Parameters (معاملات الفلترة والبحث والترتيب):**
  - `search` (optional, string): البحث النصي بمسمى الحصة (مثال: `الحصة الأولى` أو `الفسحة`).
  - `is_break` (optional, integer, enum: `0`, `1`): تصفية الحصص التعليمية (`0`) أو فترات الاستراحة (`1`).
  - `sort_by` (optional, string, enum: `id`, `slot_number`, `start_time`, default `slot_number`): حقل الفرز والترتيب.
  - `sort_order` (optional, string, enum: `asc`, `desc`, default `asc`): اتجاه الفرز.
  - `page` (optional, integer, default `1`): رقم الصفحة الحالية.
  - `per_page` (optional, integer, default `15`): عدد السجلات في الصفحة الواحدة.
- **Example Request URL:** `/api/v1/period-slots?is_break=0&sort_by=slot_number&sort_order=asc`
- **Response Payloads:**
  - **`200 OK`:**
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

---

### 1.2 `GET /api/v1/period-slots/:id` — عرض تفاصيل فترة حصة محددة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** استرجاع البيانات التفصيلية لفترة زمنية محددة بليوم المدرسي.

- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب تفاصيل فترة الحصة بنجاح.",
      "data": {
        "id": 1,
        "name": "الحصة الأولى",
        "slot_number": 1,
        "start_time": "08:00:00",
        "end_time": "08:45:00",
        "is_break": 0,
        "created_at": "2026-08-29T08:00:00Z"
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "فترة الحصة غير موجودة."}`

---

### 1.3 `POST /api/v1/period-slots` — إضافة فترة حصة مدرسية جديدة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** إضافة فترة زمنية جديدة وتحديد تسلسلا ومواعيد البداية والنهاية وحالة الاستراحة، مع التحقق من عدم تكرار `slot_number`.

- **Request Body:**
  ```json
  {
    "name": "الحصة الثالثة",
    "slot_number": 4,
    "start_time": "10:00:00",
    "end_time": "10:45:00",
    "is_break": 0
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إضافة فترة الحصة اليومية بنجاح.",
      "data": {
        "id": 4,
        "name": "الحصة الثالثة",
        "slot_number": 4,
        "start_time": "10:00:00",
        "end_time": "10:45:00",
        "is_break": 0,
        "created_at": "2026-08-29T12:00:00Z"
      }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "الرقم التسلسلي للحصة مسجل مسبقاً (uq_period_slots_number)."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من مدخلات فترة الحصة.",
      "errors": { "end_time": ["وقت النهاية يجب أن يكون بعد وقت البداية."] }
    }
    ```

---

### 1.4 `PUT /api/v1/period-slots/:id` — تعديل توقيت أو مسمى فترة الحصة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** تحديث التوقيت الزمني أو المسمى أو الرقم التسلسلي لفترة الحصة.

- **Request Body:**
  ```json
  {
    "name": "الحصة الأولى المحدثة",
    "slot_number": 1,
    "start_time": "08:15:00",
    "end_time": "09:00:00",
    "is_break": 0
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث فترة الحصة بنجاح.",
      "data": {
        "id": 1,
        "name": "الحصة الأولى المحدثة",
        "slot_number": 1,
        "start_time": "08:15:00",
        "end_time": "09:00:00",
        "is_break": 0
      }
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "فترة الحصة غير موجودة."}`
  - **`409 Conflict`:** `{"success": false, "message": "الرقم التسلسلي للحصة مستخدم مسبقاً لفترة أخرى."}`

---

### 1.5 `DELETE /api/v1/period-slots/:id` — حذف فترة حصة غير مسندة

> [!NOTE]
> **الوصف الوظيفي والملاحظات:** حذف سجل فترة الحصة بشرط عدم استخدامها بجدول الحصص الأسبوعي `timetable_slots`.

- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف فترة الحصة بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف فترة الحصة لارتباطها بحصص مسجلة بالجدول الأسبوعي (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "فترة الحصة غير موجودة."}`

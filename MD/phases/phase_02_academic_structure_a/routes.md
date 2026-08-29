# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-A (Network SSoT)

> **الهدف:** توثيق المسارات الـ 14 كاملة مع إضافة شرح بسيط جداً لوظيفة كل رابط قبل شرح الاستجابات، والالتزام التام بهياكل الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف (`routes.md`) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/academic`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Accept: application/json`, `Content-Type: application/json`

---

## 📅 الخطوة 1: إدارة السنوات الدراسية (`academic_years`) — [5 مسارات]

---

### 1.1 `GET /api/v1/academic/years` — عرض قائمة السنوات الدراسية
- **الوصف الوظيفي للرابط:** استرجاع قائمة كافة السنوات الدراسية المسجلة بالمنظومة مع فلترة الحالة النشطة والمقننة بالصفحات.
- **Query Parameters:** `is_active` (optional, boolean), `per_page` (optional, default 15)
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب قائمة السنوات الدراسية بنجاح.",
      "data": [
        {
          "id": 1,
          "name": "2025/2026",
          "start_date": "2025-09-01",
          "end_date": "2026-06-30",
          "is_active": 1,
          "created_at": "2025-08-01T10:00:00Z"
        }
      ],
      "meta": { "total": 1, "page": 1, "per_page": 15 }
    }
    ```
  - **`401 Unauthorized`:** `{"success": false, "message": "Unauthenticated access."}`
  - **`500 Internal Server Error`:** `{"success": false, "message": "An error occurred while fetching years."}`

---

### 1.2 `POST /api/v1/academic/years` — إنشاء سنة دراسية جديدة
- **الوصف الوظيفي للرابط:** إنشاء عام دراسي جديد بالمنظومة وتحديد مسمواه الرسمي وتاريخ بداية ونهاية الدراسة.
- **Request Body:**
  ```json
  {
    "name": "2026/2027",
    "start_date": "2026-09-01",
    "end_date": "2027-06-30"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إنشاء السنة الدراسية بنجاح.",
      "data": {
        "id": 2,
        "name": "2026/2027",
        "start_date": "2026-09-01",
        "end_date": "2027-06-30",
        "is_active": 0,
        "created_at": "2026-08-29T12:00:00Z"
      }
    }
    ```
  - **`400 Bad Request`:** `{"success": false, "message": "Malformed JSON payload."}`
  - **`401 Unauthorized`:** `{"success": false, "message": "Unauthenticated access."}`
  - **`403 Forbidden`:** `{"success": false, "message": "المستخدم لا يملك صلاحية إدارة الهيكل الأكاديمي."}`
  - **`409 Conflict`:** `{"success": false, "message": "مسمى السنة الدراسية مسجل مسبقاً في المنظومة."}`
  - **`422 Unprocessable`:**
    ```json
    {
      "success": false,
      "message": "فشل التحقق من البيانات.",
      "errors": { "end_date": ["تاريخ النهاية يجب أن يكون بعد تاريخ البداية."] }
    }
    ```
  - **`500 Server Error`:** `{"success": false, "message": "خطأ خادم داخلي أثناء إنشاء السنة."}`

---

### 1.3 `PUT /api/v1/academic/years/:id` — تعديل بيانات سنة دراسية
- **الوصف الوظيفي للرابط:** تعديل المسمى الرسمي أو تواريخ سنة دراسية قائمة بشرط ألا تكون السنة مقفلة أو مؤرشفة.
- **Request Body:**
  ```json
  {
    "name": "2026/2027 المعدلة",
    "start_date": "2026-09-05",
    "end_date": "2027-07-05"
  }
  ```
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تحديث بيانات السنة الدراسية بنجاح.",
      "data": { "id": 2, "name": "2026/2027 المعدلة", "start_date": "2026-09-05", "end_date": "2027-07-05", "is_active": 0 }
    }
    ```
  - **`401 Unauthorized`:** `{"success": false, "message": "Unauthenticated."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن تعديل سنة دراسية مغلقة ومؤرشفة."}`
  - **`404 Not Found`:** `{"success": false, "message": "السنة الدراسية المطلوبة غير موجودة."}`
  - **`409 Conflict`:** `{"success": false, "message": "مسمى السنة الدراسية مكرر."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من البيانات."}`
  - **`500 Server Error`:** `{"success": false, "message": "خطأ خادم داخلي."}`

---

### 1.4 `DELETE /api/v1/academic/years/:id` — حذف سنة دراسية غير مرتبطة
- **الوصف الوظيفي للرابط:** حذف سنة دراسية من قاعدة البيانات بشرط ألا تكون مرتبطة بفصول أو بيانات أكاديمية.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف السنة الدراسية بنجاح."}`
  - **`401 Unauthorized`:** `{"success": false, "message": "Unauthenticated."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف السنة الدراسية لارتباطها بفصول دراسية (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "السنة الدراسية غير موجودة."}`
  - **`500 Server Error`:** `{"success": false, "message": "خطأ خادم داخلي."}`

---

### 1.5 `POST /api/v1/academic/years/:id/set-active` — تفعيل السنة النشطة حالياً
- **الوصف الوظيفي للرابط:** تعيين السنة المختارة كسنة نشطة حصرية للمدرسة (`is_active = 1`) وإلغاء تفعيل باقي السنوات ذرياً.
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم تفعيل السنة الدراسية كسنة نشطة حالياً بنجاح.",
      "data": { "id": 2, "name": "2026/2027", "is_active": 1 }
    }
    ```
  - **`401 Unauthorized`:** `{"success": false, "message": "Unauthenticated."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن تفعيل سنة مقفلة."}`
  - **`404 Not Found`:** `{"success": false, "message": "السنة غير موجودة."}`
  - **`500 Server Error`:** `{"success": false, "message": "خطأ خادم داخلي."}`

---

## ⏱️ الخطوة 2: إدارة الفترات/الفصول الدراسية (`academic_terms`) — [5 مسارات]

---

### 2.1 `GET /api/v1/academic/years/:year_id/terms` — عرض فترات سنة دراسية
- **الوصف الوظيفي للرابط:** استرجاع قائمة كافة الفصول والسمسترات الدراسية التابعة لسنة دراسية محددة.
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب فصول السنة الدراسية بنجاح.",
      "data": [
        { "id": 1, "academic_year_id": 1, "name": "الفصل الأول", "term_number": 1, "start_date": "2025-09-01", "end_date": "2026-01-15", "is_active": 1, "is_closed": 0 }
      ]
    }
    ```
  - **`404 Not Found`:** `{"success": false, "message": "السنة الدراسية غير موجودة."}`

---

### 2.2 `POST /api/v1/academic/years/:year_id/terms` — إنشاء فترة دراسية جديدة
- **الوصف الوظيفي للرابط:** إنشاء فصل/فترة دراسية جديدة داخل سنة معينة وتحديد الترتيب الرقمي للفترة `term_number`.
- **Request Body:**
  ```json
  {
    "name": "الفصل الثاني",
    "term_number": 2,
    "start_date": "2026-02-01",
    "end_date": "2026-06-15"
  }
  ```
- **Response Payloads:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "تم إنشاء الفصل الدراسي بنجاح.",
      "data": { "id": 2, "academic_year_id": 1, "name": "الفصل الثاني", "term_number": 2, "is_active": 0, "is_closed": 0 }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "رقم الفصل الدراسي (term_number) مسجل مسبقاً لنفس السنة."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من التواريخ."}`

---

### 2.3 `PUT /api/v1/academic/terms/:id` — تعديل فترة دراسية
- **الوصف الوظيفي للرابط:** تحديث مسمى أو تواريخ فترة دراسية قائمة بشرط ألا تكون مقفلة نهائياً (`is_closed = 1`).
- **Request Body:**
  ```json
  { "name": "الفصل الثاني المعدل", "term_number": 2, "start_date": "2026-02-05", "end_date": "2026-06-20" }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث بيانات الفصل الدراسي بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن تعديل فصل دراسي مغلق نهائياً (is_closed = 1)."}`
  - **`404 Not Found`:** `{"success": false, "message": "الفصل الدراسي غير موجود."}`

---

### 2.4 `DELETE /api/v1/academic/terms/:id` — حذف فترة دراسية
- **الوصف الوظيفي للرابط:** حذف فترة دراسية من المنظومة بشرط عدم وجود أي درجات أو مناهج مسندة إليها (`RESTRICT`).
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الفصل الدراسي بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف الفصل الدراسي لارتباطه بمناهج ودرجات مسندة (RESTRICT)."}`

---

### 2.5 `POST /api/v1/academic/terms/:id/set-active` — تفعيل الفترة النشطة حالياً
- **الوصف الوظيفي للرابط:** تفعيل الفصل/الفترة المختارة كفترة نشطة وحيدة حالياً للعمليات الإدارية والأكاديمية.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تفعيل الفصل الدراسي كفصل نشط حالياً."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن تفعيل فصل مغلق."}`

---

## 🏛️ الخطوة 3: إدارة المراحل التعليمية (`academic_stages`) — [4 مسارات]

---

### 3.1 `GET /api/v1/academic/stages` — عرض شجرة المراحل التعليمية
- **الوصف الوظيفي للرابط:** استرجاع الهيكل العام للمراحل التعليمية (ابتدائي، إعدادي، ثانوي) مرتبة بحسب `order_index`.
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب الهيكل الأكاديمي للمراحل بنجاح.",
      "data": [
        { "id": 1, "name": "المرحلة الابتدائية", "order_index": 1 }
      ]
    }
    ```

---

### 3.2 `POST /api/v1/academic/stages` — إنشاء مرحلة تعليمية جديدة
- **الوصف الوظيفي للرابط:** إضافة مرحلة تعليمية جديدة للهيكل المدرسي وتحديد اسمها وترتيبها الهرمي بالواجهة.
- **Request Body:**
  ```json
  {
    "name": "المرحلة الابتدائية",
    "order_index": 1
  }
  ```
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تم إنشاء المرحلة التعليمية بنجاح.", "data": { "id": 1, "name": "المرحلة الابتدائية", "order_index": 1 }}`
  - **`409 Conflict`:** `{"success": false, "message": "اسم المرحلة التعليمية مسجل مسبقاً."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "فشل التحقق من البيانات."}`

---

### 3.3 `PUT /api/v1/academic/stages/:id` — تعديل مرحلة تعليمية
- **الوصف الوظيفي للرابط:** تعديل اسم مرحلة تعليمية قائمة أو تغيير ترتيب عرضها الهرمي.
- **Request Body:**
  ```json
  { "name": "المرحلة الابتدائية العامة", "order_index": 1 }
  ```
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث المرحلة التعليمية بنجاح."}`
  - **`404 Not Found`:** `{"success": false, "message": "المرحلة غير موجودة."}`

---

### 3.4 `DELETE /api/v1/academic/stages/:id` — حذف مرحلة تعليمية فارغة
- **الوصف الوظيفي للرابط:** حذف مرحلة تعليمية من الهيكل بشرط عدم وجود أي صفوف دراسية مضافة تحتها (`RESTRICT`).
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف المرحلة التعليمية بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف المرحلة التعليمية لارتباطها بصفوف تابعة (RESTRICT)."}`
  - **`404 Not Found`:** `{"success": false, "message": "المرحلة غير موجودة."}`

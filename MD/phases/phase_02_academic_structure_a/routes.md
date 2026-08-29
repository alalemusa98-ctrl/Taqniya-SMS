# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02-A (Network SSoT)

> **الهدف:** توثيق المسارات الـ 13 كاملة مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المعياري الموجز لـ [`MD/database.md`](../../database.md)، مع عرض عنصرين على الأقل لكل قائمة نتائج لتوضيح نمط المصفوفة (`Multi-Item List Payload`).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** ملف [`routes.md`](./routes.md) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1/academic`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Accept: application/json`, `Content-Type: application/json`

---

## 📅 الخطوة 1: إدارة السنوات الدراسية (`academic_years`) — [5 مسارات]

---

### 1.1 `GET /api/v1/academic/years` — عرض قائمة السنوات الدراسية
- **الوصف الوظيفي للرابط:** استرجاع قائمة كافة السنوات الدراسية المسجلة بالمنظومة.
- **Query Parameters:** `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
- **Response Payloads:**
  - **`200 OK`:**
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

---

### 1.2 `POST /api/v1/academic/years` — إضافة سنة دراسية جديدة
- **الوصف الوظيفي للرابط:** إنشاء سجل سنة دراسية جديدة.
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
      "data": { "id": 2, "name": "2026/2027", "start_date": "2026-09-01", "end_date": "2027-06-30", "is_active": 0 }
    }
    ```
  - **`409 Conflict`:** `{"success": false, "message": "اسم السنة الدراسية موجود مسبقاً (uq_academic_years_name)."}`
  - **`422 Unprocessable`:** `{"success": false, "message": "تاريخ النهاية يجب أن يكون بعد تاريخ البداية."}`

---

### 1.3 `PUT /api/v1/academic/years/:id` — تعديل سنة دراسية
- **الوصف الوظيفي للرابط:** تحديث بيانات سنة دراسية قائمة.
- **Request Body:** `{"name": "2026/2027", "start_date": "2026-09-01", "end_date": "2027-06-30"}`
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث السنة الدراسية بنجاح."}`
  - **`404 Not Found`:** `{"success": false, "message": "السنة الدراسية غير موجودة."}`

---

### 1.4 `DELETE /api/v1/academic/years/:id` — حذف سنة دراسية غير مرتبطة
- **الوصف الوظيفي للرابط:** حذف سنة دراسية بشرط عدم وجود بيانات أكاديمية مرصودة عليها.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف السنة الدراسية بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف السنة الدراسية لارتباطها بفترات أو طلاب (RESTRICT)."}`

---

### 1.5 `POST /api/v1/academic/years/:id/activate` — تفعيل السنة النشطة حالياً
- **الوصف الوظيفي للرابط:** تحويل السنة المختارة إلى السنة النشطة بالمنظومة وإلغاء تفعيل البقية بحركة ذرية atomic.
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تفعيل السنة الدراسية كعام نشط للمنظومة بنجاح."}`

---

## 🗓️ الخطوة 2: كتالوج الفترات المرجعي (`academic_terms`) — [4 مسارات]

---

### 2.1 `GET /api/v1/academic/terms` — عرض كتالوج الفترات العام
- **الوصف الوظيفي للرابط:** استرجاع كتالوج الفترات المعياري المعتمد بالمنظومة.
- **Query Parameters:** `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب كتالوج الفترات بنجاح.",
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

---

### 2.2 `POST /api/v1/academic/terms` — إضافة فترة لكتالوج الفترات العام
- **الوصف الوظيفي للرابط:** إضافة فترة مرجعية معيارية جديدة للكتالوج.
- **Request Body:** `{"name": "الفصل الصيفي", "term_number": 4}`
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تمت إضافة الفترة للكتالوج المرجعي بنجاح."}`
  - **`409 Conflict`:** `{"success": false, "message": "اسم الفترة أو رقم الترتيب موجود مسبقاً بالكتالوج."}`

---

### 2.3 `PUT /api/v1/academic/terms/:id` — تعديل مسمى أو ترتيب فترة بالكتالوج
- **Request Body:** `{"name": "الفصل الدراسي الأول", "term_number": 1}`
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث بيانات الفترة بالكتالوج بنجاح."}`

---

### 2.4 `DELETE /api/v1/academic/terms/:id` — حذف فترة غير مستخدمة من الكتالوج
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف الفترة من الكتالوج بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف الفترة المرجعية لارتباطها بتخصيصات صفوف (RESTRICT)."}`

---

## 🏛️ الخطوة 3: إدارة المراحل التعليمية (`academic_stages`) — [4 مسارات]

---

### 3.1 `GET /api/v1/academic/stages` — عرض قائمة المراحل التعليمية
- **الوصف الوظيفي للرابط:** استرجاع قائمة المراحل التعليمية بالمنظومة.
- **Query Parameters:** `page` (optional, integer, default 1), `per_page` (optional, integer, default 15)
- **Response Payloads:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "message": "تم جلب المراحل التعليمية بنجاح.",
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

---

### 3.2 `POST /api/v1/academic/stages` — إضافة مرحلة تعليمية
- **Request Body:** `{"name": "المرحلة الابتدائية", "order_index": 1}`
- **Response Payloads:**
  - **`201 Created`:** `{"success": true, "message": "تمت إضافة المرحلة التعليمية بنجاح."}`
  - **`409 Conflict`:** `{"success": false, "message": "اسم المرحلة التعليمية موجود مسبقاً (uq_stages_name)."}`

---

### 3.3 `PUT /api/v1/academic/stages/:id` — تعديل مرحلة تعليمية
- **Request Body:** `{"name": "المرحلة الابتدائية المحدثة", "order_index": 1}`
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم تحديث بيانات المرحلة التعليمية بنجاح."}`

---

### 3.4 `DELETE /api/v1/academic/stages/:id` — حذف مرحلة فارغة
- **Response Payloads:**
  - **`200 OK`:** `{"success": true, "message": "تم حذف المرحلة التعليمية بنجاح."}`
  - **`403 Forbidden`:** `{"success": false, "message": "لا يمكن حذف المرحلة لارتباطها بصفوف دراسية (RESTRICT)."}`

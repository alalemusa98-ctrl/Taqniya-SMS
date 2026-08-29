# 🖥️ مواصفات Frontend — المرحلة 02-B (User Interface & UX)

> **الهدف:** توثيق الشاشات والنوافل المنبثقة والإجراءات الحصرية للخطوات الثلاث (`classes`, `sections`, `subjects`).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم مطور الواجهات بالكامل برسم وتحديد معالجات الاستجابة (Response Handlers) والتنبيهات بالواجهة بناءً على الهياكل المسجلة في ملف [`routes.md`](./routes.md) حصراً.

---

## 1. شاشة وإجراءات إدارة الصفوف (الخطوة 4)

### 1.1 المكونات والإجراءات:
- **قائمة الصفوف الدراسية:** عرض `name`, `stage_id`, و `grade_level`.
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض الصفوف** | `GET /api/v1/academic/classes` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#41-get-apiv1academicclasses--عرض-صفوف-مرحلة-معينة) |
  | **إنشاء صف وتسكينه** | `POST /api/v1/academic/classes` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#42-post-apiv1academicclasses--إنشاء-صف-دراسي-وتسكينه-بمرحلة) |
  | **تعديل صف** | `PUT /api/v1/academic/classes/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#43-put-apiv1academicclassesid--تعديل-بيانات-صف-دراسي) |
  | **حذف صف** | `DELETE /api/v1/academic/classes/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#44-delete-apiv1academicclassesid--حذف-صف-دراسي-غير-مرتبط) |

---

## 2. شاشة وإجراءات إدارة بنك الشعب والمواد العامة (الخطوات 5 و 6)

### 2.1 المكونات والإجراءات:
- **بنك الشعب العامة (`sections`):** إضافة/تعديل/حذف مسمى شعبة عامة.
- **بنك المواد العام (`subjects`):** إضافة/تعديل/حذف مادة باسمها ورزمها البرمجي.
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض الشعب العامة** | `GET /api/v1/academic/sections` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#51-get-apiv1academicsections--عرض-بنك-الشعب-العامة) |
  | **إنشاء شعبة عامة** | `POST /api/v1/academic/sections` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#52-post-apiv1academicsections--إنشاء-شعبة-عامة-جديدة) |
  | **تعديل شعبة عامة** | `PUT /api/v1/academic/sections/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#53-put-apiv1academicsectionsid--تعديل-مسمى-شعبة-عامة) |
  | **حذف شعبة عامة** | `DELETE /api/v1/academic/sections/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#54-delete-apiv1academicsectionsid--حذف-شعبة-عامة-غير-مستخدمة) |
  | **عرض بنك المواد** | `GET /api/v1/academic/subjects` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#61-get-apiv1academicsubjects--عرض-بنك-المواد-العامة) |
  | **إضافة مادة عامة** | `POST /api/v1/academic/subjects` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#62-post-apiv1academicsubjects--إضافة-مادة-جديدة-لبنك-المواد) |
  | **تعديل مادة عامة** | `PUT /api/v1/academic/subjects/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#63-put-apiv1academicsubjectsid--تعديل-مادة-ببنك-المواد) |
  | **حذف مادة عامة** | `DELETE /api/v1/academic/subjects/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#64-delete-apiv1academicsubjectsid--حذف-مادة-عامة-غير-مسندة) |

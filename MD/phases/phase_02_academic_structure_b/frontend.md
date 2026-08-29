# 🖥️ مواصفات Frontend — المرحلة 02-B (User Interface & UX)

> **الهدف:** توثيق الشاشات والنوافل المنبثقة والإجراءات الحصرية للخطوات الثلاث (`classes`, `sections`, `subjects`) المطابقة بنسبة 100% لـ [`MD/routes.md`](./routes.md) و [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم مطور الواجهات بالكامل برسم وتحديد معالجات الاستجابة (Response Handlers) والتنبيهات بالواجهة بناءً على الهياكل المسجلة في ملف [`routes.md`](./routes.md) حصراً.

---

## 1. شاشة وإجراءات إدارة الصفوف الدراسية (الخطوة 1) — [4 مسارات]

### 1.1 المكونات والإجراءات:
- **جدول عرض الصفوف:** يظهر اسم الصف، المرحلة التعليمية التابع لها، والترتيب الأكاديمي للترحيل (`grade_level`).
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض صفوف مرحلة** | `GET /api/v1/academic/classes` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#11-get-apiv1academicclasses--عرض-صفوف-مرحلة-معينة) |
  | **إنشاء صف وتسكينه** | `POST /api/v1/academic/classes` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#12-post-apiv1academicclasses--إنشاء-صف-دراسي-وتسكينه-بمرحلة) |
  | **تعديل صف** | `PUT /api/v1/academic/classes/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#13-put-apiv1academicclassesid--تعديل-بيانات-صف-دراسي) |
  | **حذف صف غير مرتبط** | `DELETE /api/v1/academic/classes/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#14-delete-apiv1academicclassesid--حذف-صف-دراسي-غير-مرتبط) |

---

## 2. شاشة وإجراءات إدارة بنك الشعب العامة (الخطوة 2) — [4 مسارات]

### 2.1 المكونات والإجراءات:
- **جدول بنك الشعب:** يظهر المسمى المعياري للشعبة العامة (مثل: `شعبة أ`, `شعبة ب`).
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض بنك الشعب** | `GET /api/v1/academic/sections` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#21-get-apiv1academicsections--عرض-بنك-الشعب-العامة) |
  | **إنشاء شعبة عامة** | `POST /api/v1/academic/sections` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#22-post-apiv1academicsections--إنشاء-شعبة-عامة-جديدة) |
  | **تعديل مسمى شعبة** | `PUT /api/v1/academic/sections/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#23-put-apiv1academicsectionsid--تعديل-مسمى-شعبة-عامة) |
  | **حذف شعبة غير مستخدمة**| `DELETE /api/v1/academic/sections/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#24-delete-apiv1academicsectionsid--حذف-شعبة-عامة-غير-مستخدمة) |

---

## 3. شاشة وإجراءات بنك المواد العامة (الخطوة 3) — [4 مسارات]

### 3.1 المكونات والإجراءات:
- **جدول الكتالوج العام للمواد:** يظهر اسم المادة وكودها الرمزي (مثل: `MATH`, `SCI`).
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض بنك المواد** | `GET /api/v1/academic/subjects` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#31-get-apiv1academicsubjects--عرض-بنك-المواد-العامة) |
  | **إضافة مادة عامة** | `POST /api/v1/academic/subjects` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#32-post-apiv1academicsubjects--إضافة-مادة-جديدة-لبنك-المواد) |
  | **تعديل مادة ببنك المواد**| `PUT /api/v1/academic/subjects/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#33-put-apiv1academicsubjectsid--تعديل-مادة-ببنك-المواد) |
  | **حذف مادة غير مسندة** | `DELETE /api/v1/academic/subjects/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#34-delete-apiv1academicsubjectsid--حذف-مادة-عامة-غير-مسندة) |

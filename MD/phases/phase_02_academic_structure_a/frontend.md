# 🖥️ مواصفات Frontend — المرحلة 02-A (User Interface & UX)

> **الهدف:** توثيق الشاشات والنوافل المنبثقة والإجراءات الحصرية للجداول الثلاثة (`academic_years`, `academic_terms`, `academic_stages`) المطابقة بنسبة 100% لـ [`MD/routes.md`](./routes.md) و [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم مطور الواجهات بالكامل برسم وتحديد معالجات الاستجابة (Response Handlers) والتنبيهات بالواجهة بناءً على الهياكل المسجلة في ملف [`routes.md`](./routes.md) حصراً.

---

## 1. شاشة وإجراءات إدارة السنوات الدراسية (الخطوة 1) — [5 مسارات]

### 1.1 المكونات والإجراءات:
- **جدول عرض السنوات:** يظهر `name`, `start_date`, `end_date`, والشارة `is_active`.
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض السنوات** | `GET /api/v1/academic/years` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#11-get-apiv1academicyears--عرض-قائمة-السنوات-الدراسية) |
  | **إضافة سنة جديدة** | `POST /api/v1/academic/years` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#12-post-apiv1academicyears--إضافة-سنة-دراسية-جديدة) |
  | **تعديل سنة** | `PUT /api/v1/academic/years/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#13-put-apiv1academicyearsid--تعديل-سنة-دراسية) |
  | **حذف سنة** | `DELETE /api/v1/academic/years/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#14-delete-apiv1academicyearsid--حذف-سنة-دراسية-غير-مرتبطة) |
  | **تفعيل السنة** | `POST /api/v1/academic/years/:id/activate` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#15-post-apiv1academicyearsidactivate--تفعيل-السنة-النشطة-حالياً) |

---

## 2. شاشة وإجراءات كتالوج الفترات المرجعي (الخطوة 2) — [4 مسارات]

### 2.1 المكونات والإجراءات:
- **جدول الكتالوج العام:** يظهر `name`, `term_number`.
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض كتالوج الفترات** | `GET /api/v1/academic/terms` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#21-get-apiv1academicterms--عرض-كتالوج-الفترات-العام) |
  | **إضافة فترة للكتالوج** | `POST /api/v1/academic/terms` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#22-post-apiv1academicterms--إضافة-فترة-لكتالوج-الفترات-العام) |
  | **تعديل فترة بالكتالوج** | `PUT /api/v1/academic/terms/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#23-put-apiv1academictermsid--تعديل-مسمى-أو-ترتيب-فترة-بالكتالوج) |
  | **حذف فترة غير مستخدمة** | `DELETE /api/v1/academic/terms/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#24-delete-apiv1academictermsid--حذف-فترة-غير-مستخدمة-من-الكتالوج) |

---

## 3. شاشة وإجراءات إدارة المراحل التعليمية (الخطوة 3) — [4 مسارات]

### 3.1 المكونات والإجراءات:
- **جدول المراحل:** يظهر `name`, `order_index`.
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض المراحل** | `GET /api/v1/academic/stages` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#31-get-apiv1academicstages--عرض-قائمة-المراحل-التعليمية) |
  | **إضافة مرحلة** | `POST /api/v1/academic/stages` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#32-post-apiv1academicstages--إضافة-مرحلة-تعليمية) |
  | **تعديل مرحلة** | `PUT /api/v1/academic/stages/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#33-put-apiv1academicstagesid--تعديل-مرحلة-تعليمية) |
  | **حذف مرحلة** | `DELETE /api/v1/academic/stages/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#34-delete-apiv1academicstagesid--حذف-مرحلة-فارغة) |

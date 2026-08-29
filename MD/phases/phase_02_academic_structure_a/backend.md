# ⚙️ مواصفات Backend — المرحلة 02-A (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية للجداول الثلاثة (`academic_years`, `academic_terms`, `academic_stages`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 📅 الخطوة 1: إدارة السنوات الدراسية (`academic_years`) — [5 مسارات]

> **الوصف المختصر:** إدارة الأعوام الدراسية وتحديد بدايتها ونهايتها والتحكم في العام النشط بحركة ذرية single transaction.

### 1.1 جدول العمليات والروابط للخلفية (`academic_years`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض قائمة السنوات الدراسية** | `AcademicYearService::listYears` | `GET /api/v1/academic/years` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1academicyears--عرض-قائمة-السنوات-الدراسية) |
| **إضافة سنة دراسية جديدة** | `AcademicYearService::createYear` | `POST /api/v1/academic/years` | `201 Created` | [في `routes.md`](./routes.md#12-post-apiv1academicyears--إضافة-سنة-دراسية-جديدة) |
| **تعديل سنة دراسية** | `AcademicYearService::updateYear` | `PUT /api/v1/academic/years/:id` | `200 OK` | [في `routes.md`](./routes.md#13-put-apiv1academicyearsid--تعديل-سنة-دراسية) |
| **حذف سنة غير مرتبطة** | `AcademicYearService::deleteYear` | `DELETE /api/v1/academic/years/:id` | `200 OK` | [في `routes.md`](./routes.md#14-delete-apiv1academicyearsid--حذف-سنة-دراسية-غير-مرتبطة) |
| **تفعيل السنة النشطة حالياً** | `AcademicYearService::activateYear` | `POST /api/v1/academic/years/:id/activate` | `200 OK` | [في `routes.md`](./routes.md#15-post-apiv1academicyearsidactivate--تفعيل-السنة-النشطة-حالياً) |

### 1.2 قواعد التحقق (`AcademicYearRequest`):
- `name`: مطلوب، فريد (`uq_academic_years_name`).
- `start_date`: مطلوب، تاريخ معتمد.
- `end_date`: مطلوب، تاريخ بعد `start_date`.

---

## 🗓️ الخطوة 2: كتالوج الفترات المرجعي (`academic_terms`) — [4 مسارات]

> **الوصف المختصر:** إدارة الفترات المعيارية بالكتالوج العام دون ربطها بتواريخ ثابتة.

### 2.1 جدول العمليات والروابط للخلفية (`academic_terms`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض كتالوج الفترات العام** | `AcademicTermCatalogService::listCatalog` | `GET /api/v1/academic/terms` | `200 OK` | [في `routes.md`](./routes.md#21-get-apiv1academicterms--عرض-كتالوج-الفترات-العام) |
| **إضافة فترة للكتالوج العام** | `AcademicTermCatalogService::createTerm` | `POST /api/v1/academic/terms` | `201 Created` | [في `routes.md`](./routes.md#22-post-apiv1academicterms--إضافة-فترة-لكتالوج-الفترات-العام) |
| **تعديل فترة بالكتالوج** | `AcademicTermCatalogService::updateTerm` | `PUT /api/v1/academic/terms/:id` | `200 OK` | [في `routes.md`](./routes.md#23-put-apiv1academictermsid--تعديل-مسمى-أو-ترتيب-فترة-بالكتالوج) |
| **حذف فترة غير مستخدمة** | `AcademicTermCatalogService::deleteTerm` | `DELETE /api/v1/academic/terms/:id` | `200 OK` | [في `routes.md`](./routes.md#24-delete-apiv1academictermsid--حذف-فترة-غير-مستخدمة-من-الكتالوج) |

### 2.2 قواعد التحقق (`AcademicTermCatalogRequest`):
- `name`: مطلوب، فريد بالكتالوج (`uq_terms_name`).
- `term_number`: مطلوب، رقم موجب فريد (`uq_terms_number`).

---

## 🏛️ الخطوة 3: إدارة المراحل التعليمية (`academic_stages`) — [4 مسارات]

> **الوصف المختصر:** إدخال وتعديل المراحل التعليمية الكبرى بالمنظومة (مثل: المرحلة الابتدائية، الإعدادية، الثانوية) وترتيبها.

### 3.1 جدول العمليات والروابط للخلفية (`academic_stages`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض قائمة المراحل التعليمية** | `AcademicStageService::listStages` | `GET /api/v1/academic/stages` | `200 OK` | [في `routes.md`](./routes.md#31-get-apiv1academicstages--عرض-قائمة-المراحل-التعليمية) |
| **إضافة مرحلة تعليمية** | `AcademicStageService::createStage` | `POST /api/v1/academic/stages` | `201 Created` | [في `routes.md`](./routes.md#32-post-apiv1academicstages--إضافة-مرحلة-تعليمية) |
| **تعديل مرحلة تعليمية** | `AcademicStageService::updateStage` | `PUT /api/v1/academic/stages/:id` | `200 OK` | [في `routes.md`](./routes.md#33-put-apiv1academicstagesid--تعديل-مرحلة-تعليمية) |
| **حذف مرحلة فارغة** | `AcademicStageService::deleteStage` | `DELETE /api/v1/academic/stages/:id` | `200 OK` | [في `routes.md`](./routes.md#34-delete-apiv1academicstagesid--حذف-مرحلة-فارغة) |

### 3.2 قواعد التحقق (`AcademicStageRequest`):
- `name`: مطلوب، فريد (`uq_stages_name`).
- `order_index`: مطلوب، رقم صحيح موجب.

---

## ⚖️ 4. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 4.1 حوكمة الأدوار والصلاحيات (RBAC Governance):
- جميع مسارات الإضافة (`POST`)، التعديل (`PUT`)، الحذف (`DELETE`)، والتفعيل النشط مقتصرة **حصراً على مدير النظام (Admin)** (`role_type = 'admin'`).
- يمنع المعلم، الطالب، وولي الأمر منعاً باتاً من تعديل أو إنشاء الهيكل الأكاديمي (إعادة `403 Forbidden`).

### 4.2 قواعد العام الدراسي النشط وقفل السنوات (Academic Year Invariants):
- **العام الدراسي النشط الوحيد (`Single Active Year Invariant`):** يوجد عام دراسي نشط واحد فقط بالمنظومة (`is_active = 1`). عند تفعيل عام جديد، يتم إلغاء تفعيل الأعوام السابقة ذرياً داخل `DB::transaction`:
  ```php
  DB::transaction(function () use ($yearId) {
      AcademicYear::where('is_active', 1)->lockForUpdate()->update(['is_active' => 0]);
      AcademicYear::where('id', $yearId)->update(['is_active' => 1]);
  });
  ```
- **حظر تعديل السنوات المقفلة:** يمنع تعديل أو إضافة بيانات تابعة لعام دراسي تم إغلاقه وأرشفته.

### 4.3 قواعد النزاهة وحظر الحذف العشوائي (Strict RESTRICT Protection):
- **حماية الأعوام:** يمنع حذف أي عام دراسي يحتوي على تخصيصات فترات أو تسجيلات طلاب (`ON DELETE RESTRICT`).
- **حماية الكتالوج:** يمنع حذف أي فترة مرجعية مسندة لتواريخ صفوف بالمنظومة (`ON DELETE RESTRICT`).
- **حماية المراحل:** يمنع حذف أي مرحلة تعليمية تحتوي على صفوف دراسية مضافة في `classes` (`ON DELETE RESTRICT`).

### 4.4 تتبع وسجلات التدقيق (Audit Logging):
- تسجل عمليات إنشاء الأعوام، تعديلها، تفعيل العام النشط، وتعديل الفترات تلقائياً في سجلات التدقيق `audit_logs` لضمان الشفافية.

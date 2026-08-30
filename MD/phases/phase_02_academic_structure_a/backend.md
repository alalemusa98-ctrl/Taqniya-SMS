# ⚙️ مواصفات Backend — المرحلة 02-A (Domain Logic & Architecture)

> **الهدف:** توثيق منطق الأعمال (Domain Logic)، قواعد التحقق (Validation Rules)، المعاملات الذرية (Transactions)، والحوكمة الأمنية للجداول الثلاثة (`academic_years`, `academic_terms`, `academic_stages`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md) و [`MD/business_rules.md`](../../business_rules.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Internal Server Error`) لكل رابط.

---

## 📅 الخطوة 1: إدارة السنوات الدراسية (`academic_years`) — [5 مسارات]

> **الوصف الوظيفي:** إدارة الأعوام الدراسية وتحديد بدايتها ونهايتها والتحكم في العام النشط بحركة ذرية تضمن عدم تعدد الأعوام النشطة في آن واحد.

### 1.1 جدول العمليات والخدمات الخلفية (`academic_years`):
| الإجراء الوظيفي (Action) | العملية المنطقية (Domain Operation) | HTTP Method & Endpoint | رمز النجاح | مرجع العقد في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض قائمة السنوات الدراسية** | `AcademicYearService.listYears` | `GET /api/v1/academic/years` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1academicyears--عرض-قائمة-وبحث-السنوات-الدراسية) |
| **إضافة سنة دراسية جديدة** | `AcademicYearService.createYear` | `POST /api/v1/academic/years` | `201 Created` | [في `routes.md`](./routes.md#12-post-apiv1academicyears--إضافة-سنة-دراسية-جديدة) |
| **تعديل سنة دراسية** | `AcademicYearService.updateYear` | `PUT /api/v1/academic/years/:id` | `200 OK` | [في `routes.md`](./routes.md#13-put-apiv1academicyearsid--تعديل-سنة-دراسية) |
| **حذف سنة غير مرتبطة** | `AcademicYearService.deleteYear` | `DELETE /api/v1/academic/years/:id` | `200 OK` | [في `routes.md`](./routes.md#14-delete-apiv1academicyearsid--حذف-سنة-دراسية-غير-مرتبطة) |
| **تفعيل السنة النشطة حالياً** | `AcademicYearService.activateYear` | `POST /api/v1/academic/years/:id/activate` | `200 OK` | [في `routes.md`](./routes.md#15-post-apiv1academicyearsidactivate--تفعيل-السنة-النشطة-حالياً) |

### 1.2 قواعد التحقق لمدخلات السنة الدراسية (Validation Rules):
- `name`: مطلوب (Required)، نصي (String)، الحد الأقصى 50 حرفاً، فريد بالكامل عبر الجدول (`uq_academic_years_name`).
- `start_date`: مطلوب (Required)، صيغة تاريخ قياسية (`YYYY-MM-DD`).
- `end_date`: مطلوب (Required)، صيغة تاريخ قياسية (`YYYY-MM-DD`)، يجب أن يكون تاريخ النهاية لاحقاً لتاريخ البداية (`end_date > start_date`).

### 1.3 السلوك البرمجي والمعاملات الذرية (Domain Behavior & Transactions):
1. **إنشاء السنة (`createYear`):**
   - التحقق من تفرد الاسم وصحة التواريخ.
   - إنشاء السجل بقيمة افتراضية `is_active = 0`.
   - تسجيل عملية الإنشاء في جدول التدقيق `audit_logs` (`action = 'create'`, `entity_type = 'AcademicYear'`).
2. **تعديل السنة (`updateYear`):**
   - التحقق من وجود السجل وعدم حذفه منطقياً (`deleted_at IS NULL`).
   - التحقق من عدم تعارض الاسم مع سجل آخر.
   - تحديث البيانات وتسجيل القيم السابقة والجديدة في `audit_logs`.
3. **تفعيل العام الدراسي (`activateYear`):**
   - **الشرط الحوكمي:** يجب تنفيذ عملية التفعيل داخل **معاملة قاعدة بيانات ذرية (Atomic Database Transaction)** مع استخدام قفل التنافسية (Concurrency / Row-Level Lock):
     1. قفل وتحديث جميع الأعوام النشطة السابقة لضبط `is_active = 0`.
     2. تحديث العام المستهدف لضبط `is_active = 1`.
     3. تسجيل عملية التفعيل في `audit_logs`.
     4. في حال حدوث أي خطأ، يتم التراجع الفوري الكامل (Rollback).
4. **حذف السنة الدراسية (`deleteYear`):**
   - التحقق من وجود السجل.
   - **فحص الارتباطات التابعة:** التحقق من عدم وجود فترات صفوف في `class_academic_terms` أو تسجيلات طلاب في `student_enrollments`.
   - في حال وجود ارتباطات نشطة: رفض العملية وإرجاع خطأ تعارض `409 Conflict`.
   - في حال عدم وجود ارتباطات: تنفيذ الحذف المنطقي (`deleted_at = CURRENT_TIMESTAMP`) وتسجيل العملية في `audit_logs`.

---

## 🗓️ الخطوة 2: كتالوج الفترات المرجعي (`academic_terms`) — [4 مسارات]

> **الوصف الوظيفي:** إدارة الفترات المعيارية بالكتالوج العام دون ربطها بتواريخ ثابتة (كتالوج مرجعي موحد على مستوى المنظومة).

### 2.1 جدول العمليات والخدمات الخلفية (`academic_terms`):
| الإجراء الوظيفي (Action) | العملية المنطقية (Domain Operation) | HTTP Method & Endpoint | رمز النجاح | مرجع العقد في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض كتالوج الفترات العام** | `AcademicTermCatalogService.listCatalog` | `GET /api/v1/academic/terms` | `200 OK` | [في `routes.md`](./routes.md#21-get-apiv1academicterms--عرض-قائمة-وبحث-كتالوج-الفترات-العام) |
| **إضافة فترة للكتالوج العام** | `AcademicTermCatalogService.createTerm` | `POST /api/v1/academic/terms` | `201 Created` | [في `routes.md`](./routes.md#22-post-apiv1academicterms--إضافة-فترة-لكتالوج-الفترات-العام) |
| **تعديل فترة بالكتالوج** | `AcademicTermCatalogService.updateTerm` | `PUT /api/v1/academic/terms/:id` | `200 OK` | [في `routes.md`](./routes.md#23-put-apiv1academictermsid--تعديل-مسمى-أو-ترتيب-فترة-بالكتالوج) |
| **حذف فترة غير مستخدمة** | `AcademicTermCatalogService.deleteTerm` | `DELETE /api/v1/academic/terms/:id` | `200 OK` | [في `routes.md`](./routes.md#24-delete-apiv1academictermsid--حذف-فترة-غير-مستخدمة-من-الكتالوج) |

### 2.2 قواعد التحقق لمدخلات الكتالوج (Validation Rules):
- `name`: مطلوب (Required)، نصي (String)، الحد الأقصى 50 حرفاً، فريد بالكتالوج (`uq_terms_name`).
- `term_number`: مطلوب (Required)، رقم صحيح موجب (`INTEGER >= 1`)، فريد بالكتالوج (`uq_terms_number`).

### 2.3 السلوك البرمجي وقواعد الحذف (Domain Behavior & Restrictions):
1. **إضافة وتعديل الفترة:** التحقق من تفرد الاسم وترتيب الفصل.
2. **حذف الفترة من الكتالوج:**
   - فحص جدول تخصيص فترات الصفوف `class_academic_terms`.
   - إذا كانت الفترة مستخدمة في أي تخصيص صف: رفض الحذف وإرجاع `409 Conflict`.
   - إذا كانت غير مستخدمة: تنفيذ الحذف المنطقي (`Soft Delete`) مع توثيق الحركة في `audit_logs`.

---

## 🏛️ الخطوة 3: إدارة المراحل التعليمية (`academic_stages`) — [4 مسارات]

> **الوصف الوظيفي:** إدخال وتعديل المراحل التعليمية الكبرى بالمنظومة (مثل: المرحلة الابتدائية، الإعدادية، الثانوية) وضبط ترتيبها الهيكلي.

### 3.1 جدول العمليات والخدمات الخلفية (`academic_stages`):
| الإجراء الوظيفي (Action) | العملية المنطقية (Domain Operation) | HTTP Method & Endpoint | رمز النجاح | مرجع العقد في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض قائمة المراحل التعليمية** | `AcademicStageService.listStages` | `GET /api/v1/academic/stages` | `200 OK` | [في `routes.md`](./routes.md#31-get-apiv1academicstages--عرض-قائمة-وبحث-المراحل-التعليمية) |
| **إضافة مرحلة تعليمية** | `AcademicStageService.createStage` | `POST /api/v1/academic/stages` | `201 Created` | [في `routes.md`](./routes.md#32-post-apiv1academicstages--إضافة-مرحلة-تعليمية) |
| **تعديل مرحلة تعليمية** | `AcademicStageService.updateStage` | `PUT /api/v1/academic/stages/:id` | `200 OK` | [في `routes.md`](./routes.md#33-put-apiv1academicstagesid--تعديل-مرحلة-تعليمية) |
| **حذف مرحلة فارغة** | `AcademicStageService.deleteStage` | `DELETE /api/v1/academic/stages/:id` | `200 OK` | [في `routes.md`](./routes.md#34-delete-apiv1academicstagesid--حذف-مرحلة-فارغة) |

### 3.2 قواعد التحقق لمدخلات المراحل (Validation Rules):
- `name`: مطلوب (Required)، نصي (String)، الحد الأقصى 50 حرفاً، فريد بالجدول (`uq_stages_name`).
- `order_index`: اختياري عند الإنشاء (افتراضي: `1`)، رقم صحيح موجب (`INTEGER >= 1`).

### 3.3 السلوك البرمجي وقواعد الحذف (Domain Behavior & Restrictions):
1. **عرض المراحل:** يتم الفرز الافتراضي تصاعدياً بحسب `order_index ASC`.
2. **حذف المرحلة:**
   - فحص جدول الفصول/الصفوف الدراسية `classes` للتحقق من عدم وجود صفوف مسندة للمرحلة (`stage_id`).
   - في حال وجود صفوف تابعة: رفض الحذف وإرجاع `409 Conflict`.
   - في حال كانت المرحلة فارغة: تنفيذ الحذف المنطقي (`Soft Delete`) وتوثيق الحركة في `audit_logs`.

---

## ⚖️ 4. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain Invariants)

### 4.1 حوكمة المصادقة والصلاحيات (Authentication & RBAC):
- **المصادقة:** كافة المسارات الـ 13 تتطلب مصادقة صالحة عبر توكن `Bearer JWT` نشط وغير منتهي الصلاحية (إرجاع `401 Unauthorized` في حال غيابه أو عدم صلاحيته).
- **الصلاحيات:** كافة مسارات الإنشاء والتعديل والحذف والتفعيل مقتصرة **حصراً على مدير النظام (Admin)** (`role_type = 'admin'`).
- **منع الوصول غير المصرح:** يُمنع المعلم، الطالب، وولي الأمر منعاً باتاً من تنفيذ أي عمليات تعديل أو كتابة على الهيكل الأكاديمي، ويُعاد رمز المنع الصريح `403 Forbidden`.

### 4.2 قاعدة العام النشط الواحد (Single Active Year Invariant):
- لا يجوز وجود أكثر من عام دراسي واحد بحالة `is_active = 1` داخل المنظومة في نفس اللحظة.
- يتم التبديل بين الأعوام حصراً عبر نقطة الاتصال المخصصة `/activate` وبمعاملة ذرية متكاملة.

### 4.3 النزاهة المرجعية ومنع الحذف العشوائي (Strict RESTRICT Policy):
- **حماية الأعوام:** لا يمكن حذف عام دراسي يحتوي على تسجيلات طلاب أو فترات صفوف.
- **حماية الكتالوج:** لا يمكن حذف فترة مرجعية مستخدمة في أي صف دراسي.
- **حماية المراحل:** لا يمكن حذف مرحلة تعليمية تتبعها صفوف دراسية.
- **رمز الاستجابة:** تعاد الاستجابة برمز التعارض `409 Conflict` مع رسالة توضيحية صريحة.

### 4.4 التدقيق وتتبع العمليات (Audit Logging):
- تسجل كافة عمليات الإنشاء، التعديل، الحذف، والتفعيل تلقائياً في جدول `audit_logs` محتوية على:
  - `user_id`: معرف المستخدم المنفذ.
  - `action`: نوع الحركة (`create`, `update`, `delete`, `activate`).
  - `entity_type`: اسم الكيان المتأثر (`AcademicYear`, `AcademicTerm`, `AcademicStage`).
  - `entity_id`: رقم السجل المتأثر.
  - `old_values` & `new_values`: مصفوفة القيم السابقة والجديدة بصيغة JSON.
  - `ip_address` & `user_agent`: بيانات الاتصال.

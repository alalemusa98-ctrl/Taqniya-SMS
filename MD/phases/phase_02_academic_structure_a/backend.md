# ⚙️ مواصفات Backend — المرحلة 02-A (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية للجداول الثلاثة الأولى (`academic_years`, `academic_terms`, `academic_stages`) المطابقة بنسبة 100% للمصدر الرئيسي والحصري للحقيقة: [`MD/database.md`](../../database.md).  
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم على المطور أو الذكاء الاصطناعي قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه قبل التكوييد والبناء.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** ملف [`routes.md`](./routes.md) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 📅 الخطوة 1: إدارة السنوات الدراسية (`academic_years`) — [5 مسارات]

> **الوصف المختصر:** إدارة العام الدراسي وتاريخ البدء والانتهاء، وتفعيل العام النشط حالياً (`is_active = 1`).

### 1.1 جدول العمليات والروابط للخلفية (`academic_years`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **جلب قائمة السنوات الدراسية** | `AcademicYearService::listYears` | `GET /api/v1/academic/years` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1academicyears--عرض-قائمة-السنوات-الدراسية) |
| **إنشاء سنة دراسية جديدة** | `AcademicYearService::createYear` | `POST /api/v1/academic/years` | `201 Created` | [في `routes.md`](./routes.md#12-post-apiv1academicyears--إنشاء-سنة-دراسية-جديدة) |
| **تعديل بيانات سنة دراسية** | `AcademicYearService::updateYear` | `PUT /api/v1/academic/years/:id` | `200 OK` | [في `routes.md`](./routes.md#13-put-apiv1academicyearsid--تعديل-بيانات-سنة-دراسية) |
| **حذف سنة دراسية غير مرتبطة** | `AcademicYearService::deleteYear` | `DELETE /api/v1/academic/years/:id` | `200 OK` | [في `routes.md`](./routes.md#14-delete-apiv1academicyearsid--حذف-سنة-دراسية-غير-مرتبطة) |
| **تفعيل السنة النشطة حالياً** | `AcademicYearService::setActiveYear` | `POST /api/v1/academic/years/:id/set-active` | `200 OK` | [في `routes.md`](./routes.md#15-post-apiv1academicyearsidset-active--تفعيل-السنة-النشطة-حاليا) |

### 1.2 قواعد التحقق (`AcademicYearRequest`):
- `name`: مطلوب، نصي، فريد (`unique:academic_years,name`).
- `start_date`: مطلوب، تاريخ صالح.
- `end_date`: مطلوب، تاريخ بعد `start_date`.

---

## ⏱️ الخطوة 2: إدارة الفترات/الفصول الدراسية (`academic_terms`) — [5 مسارات]

> **الوصف المختصر:** تقسيم العام الدراسي إلى سمسترات وفترات وتنظيم الترتيب الرقمي `term_number` وتسهيل إغلاق الفصل (`is_closed`).

### 2.1 جدول العمليات والروابط للخلفية (`academic_terms`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض فترات سنة دراسية معينة** | `AcademicTermService::listTerms` | `GET /api/v1/academic/years/:year_id/terms` | `200 OK` | [في `routes.md`](./routes.md#21-get-apiv1academicyearsyear_idterms--عرض-فترات-سنة-دراسية) |
| **إنشاء فترة دراسية جديدة** | `AcademicTermService::createTerm` | `POST /api/v1/academic/years/:year_id/terms` | `201 Created` | [في `routes.md`](./routes.md#22-post-apiv1academicyearsyear_idterms--إنشاء-فترة-دراسية-جديدة) |
| **تعديل بيانات فترة دراسية** | `AcademicTermService::updateTerm` | `PUT /api/v1/academic/terms/:id` | `200 OK` | [في `routes.md`](./routes.md#23-put-apiv1academictermsid--تعديل-فترة-دراسية) |
| **حذف فترة دراسية غير مرتبطة**| `AcademicTermService::deleteTerm` | `DELETE /api/v1/academic/terms/:id` | `200 OK` | [في `routes.md`](./routes.md#24-delete-apiv1academictermsid--حذف-فترة-دراسية) |
| **تفعيل الفترة النشطة حالياً** | `AcademicTermService::setActiveTerm` | `POST /api/v1/academic/terms/:id/set-active` | `200 OK` | [في `routes.md`](./routes.md#25-post-apiv1academictermsidset-active--تفعيل-الفترة-النشطة-حاليا) |

### 2.2 قواعد التحقق (`AcademicTermRequest`):
- `academic_year_id`: مطلوب وموجود بجدول `academic_years`.
- `name`: مطلوب، نصي (مثال: `الفصل الأول`).
- `term_number`: مطلوب، رقمي صحيح موجب (`1`, `2`, `3`).
- `start_date` و `end_date`: تواريخ صالحة.
- **قيد التفرد المركب:** `uq_terms_year_number (academic_year_id, term_number)`.

---

## 🏛️ الخطوة 3: إدارة المراحل التعليمية (`academic_stages`) — [4 مسارات]

> **الوصف المختصر:** إدارة المراحل الدراسية الكبرى (ابتدائي، إعدادي، ثانوي) وترتيبها الأكاديمي (`order_index`).

### 3.1 جدول العمليات والروابط للخلفية (`academic_stages`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **جلب شجرة الهيكل الأكاديمي** | `AcademicStageService::getHierarchy` | `GET /api/v1/academic/stages` | `200 OK` | [في `routes.md`](./routes.md#31-get-apiv1academicstages--عرض-شجرة-المراحل-التعليمية) |
| **إنشاء مرحلة تعليمية جديدة** | `AcademicStageService::createStage` | `POST /api/v1/academic/stages` | `201 Created` | [في `routes.md`](./routes.md#32-post-apiv1academicstages--إنشاء-مرحلة-تعليمية-جديدة) |
| **تعديل مرحلة تعليمية** | `AcademicStageService::updateStage` | `PUT /api/v1/academic/stages/:id` | `200 OK` | [في `routes.md`](./routes.md#33-put-apiv1academicstagesid--تعديل-مرحلة-تعليمية) |
| **حذف مرحلة تعليمية فارغة** | `AcademicStageService::deleteStage` | `DELETE /api/v1/academic/stages/:id` | `200 OK` | [في `routes.md`](./routes.md#34-delete-apiv1academicstagesid--حذف-مرحلة-تعليمية-فارغة) |

### 3.2 قواعد التحقق (`AcademicStageRequest`):
- `name`: مطلوب، فريد (`unique:academic_stages,name`).
- `order_index`: رقمي صحيح موجب للعرض والترتيب.

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

### 4.3 قواعد الفصول الدراسية النشطة والمغلقة (Academic Term Invariants):
- **الفصل النشط الوحيد (`Single Active Term Invariant`):** داخل العام الدراسي النشط، يوجد فصل/فترة نشطة واحدة فقط بالمنظومة (`is_active = 1`).
- **الفصل المغلق للأرشفة (`Closed Term Invariant`):** إذا تم إغلاق الفصل نهائياً واعتماد درجاته (`is_closed = 1`)، يمنع تعديل تواريخه أو مناهجه أو تفعيله (إعادة `403 Forbidden`).

### 4.4 قواعد النزاهة وحظر الحذف العشوائي (Strict RESTRICT Protection):
- **حماية الأعوام:** يمنع حذف أي عام دراسي يحتوي على فصول دراسية في `academic_terms` (`ON DELETE RESTRICT`).
- **حماية الفصول:** يمنع حذف أي فصل دراسي يضم مناهج أو درجات مسندة في `class_subjects` (`ON DELETE RESTRICT`).
- **حماية المراحل:** يمنع حذف أي مرحلة تعليمية تحتوي على صفوف دراسية مضافة في `classes` (`ON DELETE RESTRICT`).

### 4.5 تتبع وسجلات التدقيق (Audit Logging):
- تسجل عمليات إنشاء الأعوام، تعديلها، تفعيل العام النشط، وتعديل الفترات تلقائياً في سجلات التدقيق `audit_logs` لضمان الشفافية.

# ⚙️ مواصفات Backend — المرحلة 02-B (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية للجداول الثلاثة (`classes`, `sections`, `subjects`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md) (`stage_id`, `grade_level`).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً.

---

## 🏫 الخطوة 4: إدارة الصفوف وتحديد تبعيتها للمراحل (`classes`) — [4 مسارات]

> **الوصف المختصر:** تعريف وتسكين الصفوف وتعيين `stage_id` والترتيب الأكاديمي للترحيل `grade_level`.

### 4.1 جدول العمليات والروابط للخلفية (`classes`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض صفوف مرحلة معينة** | `ClassService::listClasses` | `GET /api/v1/academic/classes` | `200 OK` | [في `routes.md`](./routes.md#41-get-apiv1academicclasses--عرض-صفوف-مرحلة-معينة) |
| **إنشاء صف دراسي وتسكينه بمرحلة** | `ClassService::createClass` | `POST /api/v1/academic/classes` | `201 Created` | [في `routes.md`](./routes.md#42-post-apiv1academicclasses--إنشاء-صف-دراسي-وتسكينه-بمرحلة) |
| **تعديل بيانات صف دراسي** | `ClassService::updateClass` | `PUT /api/v1/academic/classes/:id` | `200 OK` | [في `routes.md`](./routes.md#43-put-apiv1academicclassesid--تعديل-بيانات-صف-دراسي) |
| **حذف صف دراسي غير مرتبط** | `ClassService::deleteClass` | `DELETE /api/v1/academic/classes/:id` | `200 OK` | [في `routes.md`](./routes.md#44-delete-apiv1academicclassesid--حذف-صف-دراسي-غير-مرتبط) |

### 4.2 قواعد التحقق (`ClassRequest`):
- `stage_id`: مطلوب، وموجود بجدول `academic_stages`.
- `name`: مطلوب، نصي (مثال: `الصف الخامس`).
- `grade_level`: مطلوب، رقمي صحيح موجب (`1` إلى `12`).
- **قيد التفرد المركب:** `uq_classes_stage_level (stage_id, grade_level)`.

---

## 🔠 الخطوة 5: إدارة بنك الشُعب العامة (`sections`) — [4 مسارات]

> **الوصف المختصر:** إدارة بنك أسماء الشعب المعتمدة بالمدرسة لمرة واحدة فقط (Master Sections).

### 5.1 جدول العمليات والروابط للخلفية (`sections`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض بنك الشعب العامة** | `SectionService::listSections` | `GET /api/v1/academic/sections` | `200 OK` | [في `routes.md`](./routes.md#51-get-apiv1academicsections--عرض-بنك-الشعب-العامة) |
| **إنشاء شعبة عامة جديدة** | `SectionService::createSection` | `POST /api/v1/academic/sections` | `201 Created` | [في `routes.md`](./routes.md#52-post-apiv1academicsections--إنشاء-شعبة-عامة-جديدة) |
| **تعديل مسمى شعبة عامة** | `SectionService::updateSection` | `PUT /api/v1/academic/sections/:id` | `200 OK` | [في `routes.md`](./routes.md#53-put-apiv1academicsectionsid--تعديل-مسمى-شعبة-عامة) |
| **حذف شعبة عامة غير مستخدمة** | `SectionService::deleteSection` | `DELETE /api/v1/academic/sections/:id` | `200 OK` | [في `routes.md`](./routes.md#54-delete-apiv1academicsectionsid--حذف-شعبة-عامة-غير-مستخدمة) |

### 5.2 قواعد التحقق (`SectionRequest`):
- `name`: مطلوب، فريد (`uq_sections_name`).

---

## 📖 الخطوة 6: إدارة بنك المواد الدراسية العامة (`subjects`) — [4 مسارات]

> **الوصف المختصر:** إدارة الكتالوج العام للمواد التعليمية والمساقات المتاحة بالمدرسة (Master Catalog).

### 6.1 جدول العمليات والروابط للخلفية (`subjects`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض بنك المواد العامة** | `SubjectService::listSubjects` | `GET /api/v1/academic/subjects` | `200 OK` | [في `routes.md`](./routes.md#61-get-apiv1academicsubjects--عرض-بنك-المواد-العامة) |
| **إضافة مادة جديدة لبنك المواد** | `SubjectService::createSubject` | `POST /api/v1/academic/subjects` | `201 Created` | [في `routes.md`](./routes.md#62-post-apiv1academicsubjects--إضافة-مادة-جديدة-لبنك-المواد) |
| **تعديل مادة ببنك المواد** | `SubjectService::updateSubject` | `PUT /api/v1/academic/subjects/:id` | `200 OK` | [في `routes.md`](./routes.md#63-put-apiv1academicsubjectsid--تعديل-مادة-ببنك-المواد) |
| **حذف مادة عامة غير مسندة** | `SubjectService::deleteSubject` | `DELETE /api/v1/academic/subjects/:id` | `200 OK` | [في `routes.md`](./routes.md#64-delete-apiv1academicsubjectsid--حذف-مادة-عامة-غير-مسندة) |

### 6.2 قواعد التحقق (`SubjectRequest`):
- `name`: مطلوب، فريد (`uq_subjects_name`).
- `code`: اختياري، فريد (`uq_subjects_code`).

---

## ⚖️ 7. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 7.1 حوكمة الأدوار والصلاحيات (RBAC Governance):
- جميع عمليات إنشاء الصفوف والشعب والمواد وتعديلها وحذفها مقتصرة **حصراً على مدير النظام (Admin)** (`role_type = 'admin'`).

### 7.2 قواعد تبعية الصفوف والمراحل (Class-Stage Invariants):
- ينتمي الصف لمرحلة واحدة فقط، وحذف المرحلة فارغة فقط وبحظر صريح `ON DELETE RESTRICT`.

### 7.3 حماية الحذف المرجعي والحظر الحاسم (Strict RESTRICT Protection):
- **حماية الصفوف:** يمنع حذف أي صف دراسي مرتبط بفترات بجدول `class_academic_terms` أو شُعب بـ `class_sections` أو مناهج بـ `class_subjects`.
- **حماية الشعب العامة:** يمنع حذف الشعبة العامة إذا كانت مستخدمة ومفتوحة بصفوف في `class_sections`.
- **حماية المواد العامة:** يمنع حذف المادة من بنك المواد إذا كانت مسندة ومقررة لأي صف بجدول `class_subjects`.

### 7.4 تتبع وسجلات التدقيق (Audit Logging):
- تسجل كافة عمليات إنشاء الصفوف والشعب والمواد وتعديلها في سجلات التدقيق `audit_logs` لضمان التتبع الحوكمي.

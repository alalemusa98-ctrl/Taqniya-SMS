# ⚙️ مواصفات Backend — المرحلة 02-B (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية للجداول الثلاثة (`classes`, `sections`, `subjects`) المطابقة بنسبة 100% لـ [`MD/database/database_phase_02.md`](../../database/database_phase_02.md) (`stage_id`, `grade_level`).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً.

---

## 🏫 الخطوة 4: إدارة الصفوف وتحديد تبعيتها للمراحل (`classes`)

> **الوصف المختصر:** تعريف وتسكين الصفوف وتعيين `stage_id` والترتيب الأكاديمي للترحيل `grade_level`.

### 4.1 العمليات ورابط `routes.md`:
- `GET /api/v1/academic/classes` (`200 OK`) -> `ClassService::listClasses` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#41-get-apiv1academicclasses--عرض-صفوف-مرحلة-معينة))
- `POST /api/v1/academic/classes` (`201 Created`) -> `ClassService::createClass` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#42-post-apiv1academicclasses--إنشاء-صف-دراسي-وتسكينه-بمرحلة))
- `PUT /api/v1/academic/classes/:id` (`200 OK`) -> `ClassService::updateClass` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#43-put-apiv1academicclassesid--تعديل-بيانات-صف-دراسي))
- `DELETE /api/v1/academic/classes/:id` (`200 OK`) -> `ClassService::deleteClass` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#44-delete-apiv1academicclassesid--حذف-صف-دراسي-غير-مرتبط))

### 4.2 قواعد التحقق (`ClassRequest`):
- `stage_id`: مطلوب، وموجود بجدول `academic_stages`.
- `name`: مطلوب، نصي (مثال: `الصف الخامس`).
- `grade_level`: مطلوب، رقمي صحيح موجب (`1` إلى `12`).
- **قيد التفرد المركب:** `uq_classes_stage_level (stage_id, grade_level)`.

### 4.3 قواعد البزنس:
- **تبعية المرحلة:** ينتمي الصف لمرحلة واحدة فقط، وحذف المرحلة محمي بـ `RESTRICT`.
- **حماية الحذف (`RESTRICT`):** يمنع حذف الصف إذا كان يضم شُعباً في `class_sections` أو مناهج في `class_subjects`.

---

## 🔠 الخطوة 5: إدارة بنك الشُعب العامة (`sections`)

> **الوصف المختصر:** إدارة بنك أسماء الشعب المعتمدة بالمدرسة لمرة واحدة فقط (Master Sections).

### 5.1 العمليات ورابط `routes.md`:
- `GET /api/v1/academic/sections` (`200 OK`) -> `SectionService::listSections` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#51-get-apiv1academicsections--عرض-بنك-الشعب-العامة))
- `POST /api/v1/academic/sections` (`201 Created`) -> `SectionService::createSection` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#52-post-apiv1academicsections--إنشاء-شعبة-عامة-جديدة))
- `PUT /api/v1/academic/sections/:id` (`200 OK`) -> `SectionService::updateSection` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#53-put-apiv1academicsectionsid--تعديل-مسمى-شعبة-عامة))
- `DELETE /api/v1/academic/sections/:id` (`200 OK`) -> `SectionService::deleteSection` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#54-delete-apiv1academicsectionsid--حذف-شعبة-عامة-غير-مستخدمة))

### 5.2 قواعد التحقق (`SectionRequest`):
- `name`: مطلوب، فريد (`unique:sections,name`) (مثال: `شعبة أ`, `شعبة ب`).

### 5.3 قواعد البزنس:
- **حماية الحذف (`RESTRICT`):** يمنع حذف الشعبة العامة إذا كانت مستخدمة بصفوف في `class_sections`.

---

## 📖 الخطوة 6: إدارة بنك المواد الدراسية العامة (`subjects`)

> **الوصف المختصر:** إدارة الكتالوج العام للمواد التعليمية والمساقات المتاحة بالمدرسة (Master Catalog).

### 6.1 العمليات ورابط `routes.md`:
- `GET /api/v1/academic/subjects` (`200 OK`) -> `SubjectService::listSubjects` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#61-get-apiv1academicsubjects--عرض-بنك-المواد-العامة))
- `POST /api/v1/academic/subjects` (`201 Created`) -> `SubjectService::createSubject` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#62-post-apiv1academicsubjects--إضافة-مادة-جديدة-لبنك-المواد))
- `PUT /api/v1/academic/subjects/:id` (`200 OK`) -> `SubjectService::updateSubject` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#63-put-apiv1academicsubjectsid--تعديل-مادة-ببنك-المواد))
- `DELETE /api/v1/academic/subjects/:id` (`200 OK`) -> `SubjectService::deleteSubject` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#64-delete-apiv1academicsubjectsid--حذف-مادة-عامة-غير-مسندة))

### 6.2 قواعد التحقق (`SubjectRequest`):
- `name`: مطلوب، فريد (`unique:subjects,name`).
- `code`: اختياري/مطلوب، فريد (`unique:subjects,code`) (مثال: `MATH`, `SCI`).

### 6.3 قواعد البزنس:
- **حماية الحذف (`RESTRICT`):** يمنع حذف المادة العامة إذا كانت مسندة في `class_subjects`.

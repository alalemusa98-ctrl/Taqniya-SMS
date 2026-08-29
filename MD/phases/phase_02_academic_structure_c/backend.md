# ⚙️ مواصفات Backend — المرحلة 02-C (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية للجداول الاثنين (`class_sections`, `class_subjects`) المطابقة بنسبة 100% لـ [`MD/database/database_phase_02.md`](../../database/database_phase_02.md) (`passing_score`, `max_score`, `academic_term_id`).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً.

---

## 🧩 الخطوة 7: إدارة ربط وتسكين الشُعب بالصفوف (`class_sections`)

> **الوصف المختصر:** تخصيص وفتح الشعب الدراسية لكل صف (مثل: خامس/أ، خامس/ب) وإدارتها بحظر التكرار وحماية فك الربط عند تسجيل الطلاب.

### 7.1 العمليات ورابط `routes.md`:
- `GET /api/v1/academic/classes/:class_id/sections` (`200 OK`) -> `ClassSectionService::listClassSections` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#71-get-apiv1academicclassesclass_idsections--عرض-شعب-صف-مفتوحة))
- `POST /api/v1/academic/class-sections` (`201 Created`) -> `ClassSectionService::assignSection` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#72-post-apiv1academicclass-sections--تسكينربط-شعبة-بصف))
- `DELETE /api/v1/academic/class-sections/:id` (`200 OK`) -> `ClassSectionService::removeSection` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#73-delete-apiv1academicclass-sectionsid--فك-ربط-شعبة-من-صف))

### 7.2 قواعد التحقق (`ClassSectionRequest`):
- `class_id`: مطلوب وموجود بجدول `classes`.
- `section_id`: مطلوب وموجود بجدول `sections`.
- **قيد التفرد المركب:** `uq_class_sections (class_id, section_id)`.

### 7.3 قواعد البزنس:
- **حماية فك الربط (`RESTRICT`):** يمنع فك ربط شعبة من صف إذا وجد طلاب مسجلون بتلك الشعبة في `student_enrollments`.

---

## 📝 الخطوة 8: إدارة مناهج الصفوف والدرجات لكل فترة (`class_subjects`)

> **الوصف المختصر:** إسناد المواد لكل صف بالسمستر المحدد وتخصيص درجة النجاح `passing_score` والدرجة العظمى `max_score` بشكل مستقل تماً.

### 8.1 العمليات ورابط `routes.md`:
- `GET /api/v1/academic/classes/:class_id/subjects?academic_term_id=1` (`200 OK`) -> `CurriculumService::getCurriculum` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#81-get-apiv1academicclassesclass_idsubjects--عرض-منهج-الصف-بالفترة))
- `POST /api/v1/academic/classes/:class_id/subjects` (`201 Created`) -> `CurriculumService::assignSubject` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#82-post-apiv1academicclassesclass_idsubjects--إسناد-مادة-لصف-وتحديد-درجات-الفترة))
- `PUT /api/v1/academic/classes/:class_id/subjects/:id` (`200 OK`) -> `CurriculumService::updateSubjectScores` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#83-put-apiv1academicclassesclass_idsubjectsid--تعديل-درجات-مادة-بالفترة))
- `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id?academic_term_id=1` (`200 OK`) -> `CurriculumService::removeSubject` (شكل الاستجابة الكامل في [`routes.md`](./routes.md#84-delete-apiv1academicclassesclass_idsubjectssubject_id--إزالة-مادة-من-منهج-فترة))

### 8.2 قواعد التحقق (`ClassSubjectRequest`):
- `subject_id`: مطلوب وموجود في `subjects`.
- `academic_term_id`: مطلوب وموجود في `academic_terms`.
- `passing_score`: مطلوب، رقمي موجب (`DECIMAL 5,2`, default 50.00).
- `max_score`: مطلوب، رقمي موجب (`DECIMAL 5,2`, default 100.00).
- **قيد النزاهة الإجباري:** `passing_score <= max_score`.
- **قيد التفرد المركب:** `uq_class_subject_term (class_id, subject_id, academic_term_id)`.

### 8.3 قواعد البزنس:
- **استقلالية درجات السمستر:** درجات المادة تحدد وتخصص لكل فصل دراسي (`academic_term_id`) بشكل مستقل تماماً.
- **حظر الحذف المرجعي (`RESTRICT`):** يمنع إزالة المادة من منهج الفصل إذا تم رصد درجات امتحانات رسمية أو جدول حصص للمادة بنفس الفصل.

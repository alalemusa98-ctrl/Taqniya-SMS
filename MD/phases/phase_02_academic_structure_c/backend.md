# ⚙️ مواصفات Backend — المرحلة 02-C (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية للجداول الثلاثة (`class_academic_terms`, `class_sections`, `class_subjects`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 🗓️ الخطوة 1: إدارة تواريخ وتخطيط فترات الصفوف (`class_academic_terms`) — [4 مسارات]

> **الوصف المختصر:** تخصيص الفترات والتواريخ الرسمية لكل صف دراسي بالعام طبق تقويم الوزارة (مثل: 3 فترات للشهادات 9 و 12، وفترتان للصفوف 5 و 6) والتحكم في الفترة النشطة والمغلقة للصف.

### 1.1 جدول العمليات والروابط للخلفية (`class_academic_terms`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض فترات وتواريخ صف بالعام** | `ClassAcademicTermService::listClassTerms` | `GET /api/v1/academic/years/:academic_year_id/classes/:class_id/terms` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1academicyearsacademic_year_idclassesclass_idterms--عرض-فترات-وتواريخ-صف-بالعام) |
| **تخصيص فترة وتواريخ لصف** | `ClassAcademicTermService::assignClassTerm` | `POST /api/v1/academic/class-academic-terms` | `201 Created` | [في `routes.md`](./routes.md#12-post-apiv1academicclass-academic-terms--تخصيص-وتخبيط-فترة-وتواريخ-لصف) |
| **تفعيل الفترة النشطة للصف** | `ClassAcademicTermService::activateClassTerm` | `POST /api/v1/academic/class-academic-terms/:id/activate` | `200 OK` | [في `routes.md`](./routes.md#13-post-apiv1academicclass-academic-termsidactivate--تفعيل-الفترة-النشطة-للصف) |
| **إغلاق/فتح درجات الفترة للصف** | `ClassAcademicTermService::toggleCloseClassTerm` | `POST /api/v1/academic/class-academic-terms/:id/close` | `200 OK` | [في `routes.md`](./routes.md#14-post-apiv1academicclass-academic-termsidclose--إغلاقفتح-درجات-الفترة-للصف) |

### 1.2 قواعد التحقق (`ClassAcademicTermRequest`):
- `academic_year_id`: مطلوب وموجود بجدول `academic_years`.
- `class_id`: مطلوب وموجود بجدول `classes`.
- `academic_term_id`: مطلوب وموجود بجدول `academic_terms`.
- `start_date`: مطلوب، تاريخ ضمن النطاق الزمني للعام الدراسي.
- `end_date`: مطلوب، تاريخ بعد `start_date` وضمن نطاق العام الدراسي.
- **قيد التفرد المركب:** `uq_class_term_year (academic_year_id, class_id, academic_term_id)`.

---

## 🧩 الخطوة 2: إدارة ربط وتسكين الشُعب بالصفوف (`class_sections`) — [3 مسارات]

> **الوصف المختصر:** تخصيص وفتح الشعب الدراسية لكل صف (مثل: خامس/أ، خامس/ب) وإدارتها بحظر التكرار وحماية فك الربط عند تسجيل الطلاب.

### 2.1 جدول العمليات والروابط للخلفية (`class_sections`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض شعب صف مفتوحة** | `ClassSectionService::listClassSections` | `GET /api/v1/academic/classes/:class_id/sections` | `200 OK` | [في `routes.md`](./routes.md#21-get-apiv1academicclassesclass_idsections--عرض-شعب-صف-مفتوحة) |
| **تسكين/ربط شعبة بصف** | `ClassSectionService::assignSection` | `POST /api/v1/academic/class-sections` | `201 Created` | [في `routes.md`](./routes.md#22-post-apiv1academicclass-sections--تسكينربط-شعبة-بصف) |
| **فك ربط شعبة من صف** | `ClassSectionService::removeSection` | `DELETE /api/v1/academic/class-sections/:id` | `200 OK` | [في `routes.md`](./routes.md#23-delete-apiv1academicclass-sectionsid--فك-ربط-شعبة-من-صف) |

### 2.2 قواعد التحقق (`ClassSectionRequest`):
- `class_id`: مطلوب وموجود بجدول `classes`.
- `section_id`: مطلوب وموجود بجدول `sections`.
- **قيد التفرد المركب:** `uq_class_sections (class_id, section_id)`.

---

## 📝 الخطوة 3: إدارة مناهج الصفوف والدرجات لكل فترة (`class_subjects`) — [4 مسارات]

> **الوصف المختصر:** إسناد المواد لكل صف بالسمستر المحدد عبر `class_academic_terms` وتخصيص درجة النجاح `passing_score` والدرجة العظمى `max_score` بشكل مستقل تماماً.

### 3.1 جدول العمليات والروابط للخلفية (`class_subjects`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض منهج الصف بالفترة** | `CurriculumService::getCurriculum` | `GET /api/v1/academic/classes/:class_id/subjects?class_academic_term_id=10` | `200 OK` | [في `routes.md`](./routes.md#31-get-apiv1academicclassesclass_idsubjects--عرض-منهج-الصف-بالفترة) |
| **إسناد مادة لصف وتحديد درجات الفترة** | `CurriculumService::assignSubject` | `POST /api/v1/academic/classes/:class_id/subjects` | `201 Created` | [في `routes.md`](./routes.md#32-post-apiv1academicclassesclass_idsubjects--إسناد-مادة-لصف-وتحديد-درجات-الفترة) |
| **تعديل درجات مادة بالفترة** | `CurriculumService::updateSubjectScores` | `PUT /api/v1/academic/classes/:class_id/subjects/:id` | `200 OK` | [في `routes.md`](./routes.md#33-put-apiv1academicclassesclass_idsubjectsid--تعديل-درجات-مادة-بالفترة) |
| **إزالة مادة من منهج فترة** | `CurriculumService::removeSubject` | `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id?class_academic_term_id=10` | `200 OK` | [في `routes.md`](./routes.md#34-delete-apiv1academicclassesclass_idsubjectssubject_id--إزالة-مادة-من-منهج-فترة) |

### 3.2 قواعد التحقق (`ClassSubjectRequest`):
- `subject_id`: مطلوب وموجود في `subjects`.
- `class_academic_term_id`: مطلوب وموجود في `class_academic_terms`.
- `passing_score`: مطلوب، رقمي موجب (`DECIMAL 5,2`, default 50.00).
- `max_score`: مطلوب، رقمي موجب (`DECIMAL 5,2`, default 100.00).
- **قيد النزاهة الإجباري:** `passing_score <= max_score`.
- **قيد التفرد المركب المحكم:** `uq_class_term_subject (class_academic_term_id, subject_id)`.

---

## ⚖️ 4. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 4.1 حوكمة الأدوار والصلاحيات (RBAC Governance):
- جميع عمليات تخصيص الفترات للصفوف وتسكين الشعب وبناء المناهج مقتصرة **حصراً على مدير النظام (Admin)** (`role_type = 'admin'`).

### 4.2 قواعد الفترة النشطة الوحيدة للصفوف (Class Term Invariants):
- **الفترة النشطة الوحيدة لكل صف:** يمتلك الصف الدراسي بالعام الواحد فترة نشطة واحدة فقط لعمليات الدرجات والتدريس (`is_active = 1`). عند تفعيل فترة جديدة لصف ما، يتم إلغاء تفعيل الفترات الأخرى لنفس الصف بالعام ذرياً داخل `DB::transaction`.
- **الفترة المغلقة للأرشفة:** يمنع تعديل درجات المواد بـ `class_subjects` في فصل مغلق نهائياً للأرشفة (`is_closed = 1`).

### 4.3 حماية الحذف المرجعي والدرجات (Strict RESTRICT Protection):
- **حماية فك ربط الشعب:** يمنع فك ربط شعبة من صف إذا وجد طلاب مسجلون بتلك الشعبة في جدول تسكين الطلاب `student_enrollments`.
- **حماية إزالة المواد:** يمنع إزالة أي مادة من منهج صف إذا تم رصد درجات امتحانات رسمية أو جدول حصص للمادة بتلك الفترة.

### 4.4 تتبع وسجلات التدقيق (Audit Logging):
- تسجل عمليات تخصيص فترات الصفوف، فتح الشعب، وتعيين درجات المناهج تلقائياً في سجلات التدقيق `audit_logs`.

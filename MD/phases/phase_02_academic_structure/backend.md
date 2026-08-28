# ⚙️ مواصفات Backend — المرحلة 02: الهيكل الأكاديمي والمناهج (Domain Logic & Architecture)

> **الهدف:** توثيق منطق الأعمال الخلفي، وقواعد التحقق الصارمة، وقواعد البزنس (Business Rules)، وحماية المعاملات الذرية (ACID Transactions)، والتحميل المسبق للعلاقات (Eager Loading) **مقسماً بالكامل وفق الخطوات التنفيذية الـ 8 المعتمدة**.  
> 
> ⚠️ **تكامل حوكمي صريح ومرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد للشبكة والاستجابات (Network SSoT)**. يلتزم المطور بالكامل بالرجوع لملف [`routes.md`](./routes.md) للاطلاع على هياكل الـ JSON الصريحة لكافة رموز وحالات الاستجابة لكل رابط.

---

## 📅 الخطوة 1: إدارة السنوات الدراسية (`academic_years`)

> **الوصف المختصر:** التأسيس الأكاديمي للعام الدراسي الجديد بالمدرسة، وتحديد تواريخ البداية والنهاية، وتفعيل السنة النشطة الحالية للمنظومة، مع قفل السنوات الدراسية المنتهية لمنع التعديل.

### 1.1 العمليات الخلفية والأوصاف الوظيفية ورموز النجاح:
| الوصف الوظيفية للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | المرجع التفصيلي في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **جلب قائمة السنوات الدراسية** | `AcademicYearService::listYears` | `GET /api/v1/academic/years` | `200 OK` | [الخطوة 1 في `routes.md`](./routes.md#الخطوة-1-إدارة-السنوات-الدراسية-academic_years) |
| **إنشاء سنة دراسية جديدة** | `AcademicYearService::createYear` | `POST /api/v1/academic/years` | `201 Created` | [الخطوة 1 في `routes.md`](./routes.md#الخطوة-1-إدارة-السنوات-الدراسية-academic_years) |
| **تعديل بيانات سنة دراسية** | `AcademicYearService::updateYear` | `PUT /api/v1/academic/years/:id` | `200 OK` | [الخطوة 1 في `routes.md`](./routes.md#الخطوة-1-إدارة-السنوات-الدراسية-academic_years) |
| **حذف سنة دراسية غير مرتبطة** | `AcademicYearService::deleteYear` | `DELETE /api/v1/academic/years/:id` | `200 OK` | [الخطوة 1 في `routes.md`](./routes.md#الخطوة-1-إدارة-السنوات-الدراسية-academic_years) |
| **تفعيل السنة النشطة حالياً** | `AcademicYearService::setCurrentYear`| `POST /api/v1/academic/years/:id/set-current` | `200 OK` | [الخطوة 1 في `routes.md`](./routes.md#الخطوة-1-إدارة-السنوات-الدراسية-academic_years) |

### 1.2 قواعد التحقق (`AcademicYearRequest`):
- `name`: مطلوب، نصي، فريد في جدول `academic_years` بتنسيق السنة (`2025/2026`).
- `start_date` و `end_date`: تواريخ صالحة بشرط أن يكون `end_date > start_date`.

### 1.3 قواعد البزنس والعمليات الذرية:
- **قيد السنة النشطة الحالية (`Single Active Year`):** يوجد سنة دراسية نشطة واحدة فقط على مستوى المنظومة (`is_current = 1`). التفعيل يتم داخل معاملة ذرية:
  ```php
  DB::transaction(function () use ($yearId) {
      AcademicYear::where('is_current', 1)->lockForUpdate()->update(['is_current' => 0]);
      $year = AcademicYear::findOrFail($yearId);
      if ($year->is_locked) {
          throw new AcademicDomainException("لا يمكن تفعيل سنة دراسية مقفلة ومؤرشفة.");
      }
      $year->update(['is_current' => 1]);
  });
  ```
- **حظر التعديل على السنوات المقفلة (`Locked Year Invariant`):** يمنع تماماً إضافة أو تعديل أو حذف أي فصول، صفوف، شُعب، أو درجات تابعة لسنة دراسية مقفلة ومؤرشفة (`is_locked = 1`).
- **حماية الحذف المرجعي (`RESTRICT`):** يمنع حذف أي سنة دراسية ترتبط بفصول دراسية تابعة لها (`academic_terms`).

---

## ⏱️ الخطوة 2: إدارة الفترات/الفصول الدراسية (`academic_terms`)

> **الوصف المختصر:** تقسيم السنة الدراسية المعرفة إلى فترات زمنية (مثل: الفترة الأولى، الفترة الثانية، الفترة الثالثة)، وتحديد تواريخ كل فترة وتفعيل الفترة النشطة الحالية للعمليات والأجهزة.

### 2.1 العمليات الخلفية والأوصاف الوظيفية ورموز النجاح:
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | المرجع التفصيلي في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض فترات سنة دراسية معينة** | `AcademicTermService::listTerms` | `GET /api/v1/academic/years/:year_id/terms` | `200 OK` | [الخطوة 2 في `routes.md`](./routes.md#الخطوة-2-إدارة-الفصولالفترات-الدراسية-academic_terms) |
| **إنشاء فترة دراسية جديدة** | `AcademicTermService::createTerm` | `POST /api/v1/academic/years/:year_id/terms` | `201 Created` | [الخطوة 2 في `routes.md`](./routes.md#الخطوة-2-إدارة-الفصولالفترات-الدراسية-academic_terms) |
| **تعديل بيانات فترة دراسية** | `AcademicTermService::updateTerm` | `PUT /api/v1/academic/terms/:id` | `200 OK` | [الخطوة 2 في `routes.md`](./routes.md#الخطوة-2-إدارة-الفصولالفترات-الدراسية-academic_terms) |
| **حذف فترة دراسية غير مرتبطة**| `AcademicTermService::deleteTerm` | `DELETE /api/v1/academic/terms/:id` | `200 OK` | [الخطوة 2 في `routes.md`](./routes.md#الخطوة-2-إدارة-الفصولالفترات-الدراسية-academic_terms) |
| **تفعيل الفترة النشطة حالياً** | `AcademicTermService::setCurrentTerm`| `POST /api/v1/academic/terms/:id/set-current` | `200 OK` | [الخطوة 2 في `routes.md`](./routes.md#الخطوة-2-إدارة-الفصولالفترات-الدراسية-academic_terms) |

### 2.2 قواعد التحقق (`AcademicTermRequest`):
- `academic_year_id`: مطلوب وموجود في جدول `academic_years`.
- `name`: مطلوب، نصي (مثال: `الفترة الأولى`).
- `term_type`: ضمن القيم المعتمدة (`first_term`, `second_term`, `third_term`, `full_year`).
- **قيد التفرد:** يمنع تكرار نوع الفترة بنفس السنة (`academic_year_id`, `term_type`).

### 2.3 قواعد البزنس والعمليات الذرية:
- **قيد الفترة النشطة للسنة (`Active Term Invariant`):** داخل السنة الدراسية النشطة، يوجد فترة دراسية نشطة واحدة فقط على مستوى المنظومة في نفس الوقت (`is_current = 1`).
- **حماية الحذف المرجعي (`RESTRICT`):** يمنع حذف أي فترة دراسية ترتبط بمناهج أو درجات مسندة للصفوف (`class_subjects`).

---

## 🏛️ الخطوة 3: إدارة المراحل التعليمية (`academic_stages`)

> **الوصف المختصر:** تعريف المظلة الهيكلية الكبرى للمراحل الدراسية بالمدرسة (تمهيدي، ابتدائي، إعدادي، ثانوي) وضبط الترتيب الهرمي للمراحل وتفعيلها.

### 3.1 العمليات الخلفية والأوصاف الوظيفية ورموز النجاح:
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | المرجع التفصيلي في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **جلب شجرة الهيكل الأكاديمي** | `AcademicStageService::getHierarchy` | `GET /api/v1/academic/stages` | `200 OK` | [الخطوة 3 في `routes.md`](./routes.md#الخطوة-3-إدارة-المراحل-التعليمية-academic_stages) |
| **إنشاء مرحلة تعليمية جديدة** | `AcademicStageService::createStage` | `POST /api/v1/academic/stages` | `201 Created` | [الخطوة 3 في `routes.md`](./routes.md#الخطوة-3-إدارة-المراحل-التعليمية-academic_stages) |
| **تعديل مرحلة تعليمية** | `AcademicStageService::updateStage` | `PUT /api/v1/academic/stages/:id` | `200 OK` | [الخطوة 3 في `routes.md`](./routes.md#الخطوة-3-إدارة-المراحل-التعليمية-academic_stages) |
| **حذف مرحلة تعليمية فارغة** | `AcademicStageService::deleteStage` | `DELETE /api/v1/academic/stages/:id` | `200 OK` | [الخطوة 3 في `routes.md`](./routes.md#الخطوة-3-إدارة-المراحل-التعليمية-academic_stages) |

### 3.2 قواعد التحقق (`AcademicStageRequest`):
- `name`: مطلوب، نصي، فريد في جدول `academic_stages`.
- `stage_code`: مطلوب، فريد، باللغة الإنجليزية (مثال: `KG`, `PRIMARY`, `PREP`, `SEC`).
- `order_index`: رقمي صحيح موجب لتحديد ترتيب المرحلة بالواجهة.

### 3.3 قواعد البزنس والنزاهة:
- **حماية الحذف المرجعي (`RESTRICT`):** يمنع حذف أي مرحلة تعليمية تضم صفوفاً تابعة لها في جدول `classes`.

---

## 🏫 الخطوة 4: إدارة الصفوف وتحديد تبعيتها للمراحل (`classes`)

> **الوصف المختصر:** تعريف وتسكين الصفوف الدراسية وتعيين تبعيتها الصريحة للمراحل التعليمية المقابلة (مثال: الصفوف 1-6 تتبع المرحلة الابتدائية، الصفوف 7-9 تتبع الإعدادية، الصفوف 10-12 تتبع الثانوية).

### 4.1 العمليات الخلفية والأوصاف الوظيفية ورموز النجاح:
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | المرجع التفصيلي في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **جلب صفوف مرحلة تعليمية** | `ClassService::listClasses` | `GET /api/v1/academic/classes` | `200 OK` | [الخطوة 4 في `routes.md`](./routes.md#الخطوة-4-إدارة-الصفوف-الدراسية-وتحديد-تببيتها-للمراحل-classes) |
| **إنشاء صف دراسي وتسكينه بمرحلة**| `ClassService::createClass` | `POST /api/v1/academic/classes` | `201 Created` | [الخطوة 4 في `routes.md`](./routes.md#الخطوة-4-إدارة-الصفوف-الدراسية-وتحديد-تببيتها-للمراحل-classes) |
| **تعديل بيانات صف دراسي** | `ClassService::updateClass` | `PUT /api/v1/academic/classes/:id` | `200 OK` | [الخطوة 4 في `routes.md`](./routes.md#الخطوة-4-إدارة-الصفوف-الدراسية-وتحديد-تببيتها-للمراحل-classes) |
| **حذف صف دراسي غير مرتبط** | `ClassService::deleteClass` | `DELETE /api/v1/academic/classes/:id` | `200 OK` | [الخطوة 4 في `routes.md`](./routes.md#الخطوة-4-إدارة-الصفوف-الدراسية-وتحديد-تببيتها-للمراحل-classes) |

### 4.2 قواعد التحقق (`ClassRequest`):
- `academic_stage_id`: مطلوب وموجود في `academic_stages` وتكون المرحلة نشطة (`is_active = 1`).
- `name`: مطلوب، نصي (مثال: `الصف الخامس`).
- **قيد التفرد المركب:** يمنع تكرار اسم الصف داخل نفس المرحلة (`academic_stage_id`, `name`).

### 4.3 قواعد البزنس والتبعية:
- **تبعية المرحلة الصارمة (`Class Stage Belonging`):** ينتمي الصف لمرحلة واحدة فقط (الصفوف 1-6 ابتدائي، 7-9 إعدادي، 10-12 ثانوي).
- **حماية الحذف المرجعي (`RESTRICT`):** يمنع حذف الصف إذا كان يضم شُعباً في `class_sections` أو مناهج في `class_subjects`.

---

## 🔠 الخطوة 5: إدارة بنك الشُعب العامة (`sections`)

> **الوصف المختصر:** إنشاء وتحديث بنك المسميات العامة المتاحة للشعب الدراسية بالمدرسة لمرة واحدة فقط كمرجع عام (مثل: الشعبة أ، الشعبة ب، الشعبة ج).

### 5.1 العمليات الخلفية والأوصاف الوظيفية ورموز النجاح:
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | المرجع التفصيلي في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **جلب بنك الشعب العامة** | `SectionService::listSections` | `GET /api/v1/academic/sections` | `200 OK` | [الخطوة 5 في `routes.md`](./routes.md#الخطوة-5-إدارة-بنك-الشعب-العامة-sections) |
| **إنشاء شعبة عامة جديدة** | `SectionService::createSection` | `POST /api/v1/academic/sections` | `201 Created` | [الخطوة 5 في `routes.md`](./routes.md#الخطوة-5-إدارة-بنك-الشعب-العامة-sections) |
| **تعديل مسمى شعبة عامة** | `SectionService::updateSection` | `PUT /api/v1/academic/sections/:id` | `200 OK` | [الخطوة 5 في `routes.md`](./routes.md#الخطوة-5-إدارة-بنك-الشعب-العامة-sections) |
| **حذف شعبة عامة غير مستخدمة** | `SectionService::deleteSection` | `DELETE /api/v1/academic/sections/:id` | `200 OK` | [الخطوة 5 في `routes.md`](./routes.md#الخطوة-5-إدارة-بنك-الشعب-العامة-sections) |

### 5.2 قواعد التحقق (`SectionRequest`):
- `name`: مطلوب، نصي، فريد في جدول `sections` (مثال: `الشعبة أ`, `الشعبة ب`).

### 5.3 قواعد البزنس والنزاهة:
- **حماية الحذف المرجعي (`RESTRICT`):** يمنع حذف أي شعبة عامة إذا كانت مستخدمة ومسندة لأي صف في `class_sections`.

---

## 📖 الخطوة 6: إدارة بنك المواد الدراسية العامة (`subjects`)

> **الوصف المختصر:** إدارة البنك المركزي للمواد والمساقات التعليمية المتاحة بالمدرسة وتحديد أسمائها العربية ورموزها البرمجية الرسمية (مثل: الرياضيات MATH، العلوم SCI).

### 6.1 العمليات الخلفية والأوصاف الوظيفية ورموز النجاح:
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | المرجع التفصيلي في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **جلب بنك المواد العامة** | `SubjectService::listSubjects` | `GET /api/v1/academic/subjects` | `200 OK` | [الخطوة 6 في `routes.md`](./routes.md#الخطوة-6-إدارة-بنك-المواد-الدراسية-العامة-subjects) |
| **إضافة مادة جديدة لبنك المواد** | `SubjectService::createSubject` | `POST /api/v1/academic/subjects` | `201 Created` | [الخطوة 6 في `routes.md`](./routes.md#الخطوة-6-إدارة-بنك-المواد-الدراسية-العامة-subjects) |
| **تعديل بيانات مادة عامة** | `SubjectService::updateSubject` | `PUT /api/v1/academic/subjects/:id` | `200 OK` | [الخطوة 6 في `routes.md`](./routes.md#الخطوة-6-إدارة-بنك-المواد-الدراسية-العامة-subjects) |
| **حذف مادة عامة غير مسندة** | `SubjectService::deleteSubject` | `DELETE /api/v1/academic/subjects/:id` | `200 OK` | [الخطوة 6 في `routes.md`](./routes.md#الخطوة-6-إدارة-بنك-المواد-الدراسية-العامة-subjects) |

### 6.2 قواعد التحقق (`SubjectRequest`):
- `name`: مطلوب، نصي، فريد في جدول `subjects` (مثال: `الرياضيات`).
- `code`: مطلوب، فريد بالإنجليزية (مثال: `MATH`).

### 6.3 قواعد البزنس والنزاهة:
- **حماية الحذف المرجعي (`RESTRICT`):** يمنع حذف المادة العامة إذا كانت مسندة لمناهج صفوف في `class_subjects`.

---

## 🧩 الخطوة 7: إدارة ربط وتسكين الشُعب بالصفوف (`class_sections`)

> **الوصف المختصر:** تخصيص وفتح الشُعب الصفية المتاحة لتشغيل كل صف دراسي (مثل: فتح الشعبة أ والشعبة ب للصف الخامس لتشكيل فصل خامس/أ وفصل خامس/ب).

### 7.1 العمليات الخلفية والأوصاف الوظيفية ورموز النجاح:
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | المرجع التفصيلي في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض شعب صف دراسي مفتوحة** | `ClassSectionService::listClassSections` | `GET /api/v1/academic/classes/:class_id/sections` | `200 OK` | [الخطوة 7 في `routes.md`](./routes.md#الخطوة-7-إدارة-ربط-وتسكين-الشعب-بالصفوف-class_sections) |
| **فتح وتسكين شعبة لصف دراسي** | `ClassSectionService::assignSection` | `POST /api/v1/academic/class-sections` | `201 Created` | [الخطوة 7 في `routes.md`](./routes.md#الخطوة-7-إدارة-ربط-وتسكين-الشعب-بالصفوف-class_sections) |
| **فك ربط شعبة من صف دراسي** | `ClassSectionService::removeSection` | `DELETE /api/v1/academic/class-sections/:id` | `200 OK` | [الخطوة 7 في `routes.md`](./routes.md#الخطوة-7-إدارة-ربط-وتسكين-الشعب-بالصفوف-class_sections) |

### 7.2 قواعد التحقق (`ClassSectionRequest`):
- `class_id`: مطلوب وموجود في جدول `classes`.
- `section_id`: مطلوب وموجود في جدول `sections`.
- **قيد التفرد المركب:** يمنع تكرار فتح نفس الشعبة لنفس الصف (`class_id`, `section_id`).

### 7.3 قواعد البزنس والنزاهة:
- **حماية فك الربط (`RESTRICT`):** يمنع فك ربط شعبة من صف إذا وجد طلاب مسجلون بتلك الشعبة الصفية في `student_enrollments`.

---

## 📝 الخطوة 8: إدارة مناهج الصفوف والدرجات لكل فترة دراسية (`class_subjects`)

> **الوصف المختصر:** إسناد وتخصيص المواد لكل صف دراسي وتحديد الدرجة العظمى ودرجة النجاح المخصصة لكل فترة دراسية على حدة وبشكل مستقل تماً.

### 8.1 العمليات الخلفية والأوصاف الوظيفية ورموز النجاح:
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | المرجع التفصيلي في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض منهج الصف بالفترة الدراسية** | `CurriculumService::getCurriculum` | `GET /api/v1/academic/classes/:class_id/subjects` | `200 OK` | [الخطوة 8 في `routes.md`](./routes.md#الخطوة-8-إدارة-مناهج-الصفوف-والدرجات-لكل-فترة-دراسية-class_subjects) |
| **إسناد مادة لصف وتحديد درجات الفترة**| `CurriculumService::assignSubject` | `POST /api/v1/academic/classes/:class_id/subjects` | `201 Created` | [الخطوة 8 في `routes.md`](./routes.md#الخطوة-8-إدارة-مناهج-الصفوف-والدرجات-لكل-فترة-دراسية-class_subjects) |
| **تعديل درجات مادة بالفترة الدراسية** | `CurriculumService::updateSubjectScores`| `PUT /api/v1/academic/classes/:class_id/subjects/:id` | `200 OK` | [الخطوة 8 في `routes.md`](./routes.md#الخطوة-8-إدارة-مناهج-الصفوف-والدرجات-لكل-فترة-دراسية-class_subjects) |
| **إزالة مادة من منهج فترة دراسية** | `CurriculumService::removeSubject` | `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id` | `200 OK` | [الخطوة 8 في `routes.md`](./routes.md#الخطوة-8-إدارة-مناهج-الصفوف-والدرجات-لكل-فترة-دراسية-class_subjects) |

### 8.2 قواعد التحقق (`ClassSubjectRequest`):
- `subject_id`: مطلوب وموجود في `subjects` ونشط (`is_active = 1`).
- `academic_term_id`: مطلوب وموجود في `academic_terms`.
- `max_score`: مطلوب، رقمي موجب (`numeric`, `min:1`, `max:1000.00`).
- `pass_score`: مطلوب، رقمي موجب بشرط أن تكون درجة النجاح أقل من أو تساوي الدرجة العظمى (`pass_score <= max_score`).
- **قيد التفرد المركب:** يمنع تكرار إسناد المادة لنفس الصف بنفس الفترة (`class_id`, `subject_id`, `academic_term_id`).

### 8.3 قواعد البزنس واستقلالية الفترات:
- **استقلالية درجات الفترات (`Per-Term Score Isolation`):** تخصيص درجات المادة بالفترة مستقل تماماً بحسب كل فصل دراسي (مثال: الفترة الأولى عظمى 100 ونجاح 50، الفترة الثالثة عظمى 150 ونجاح 75).
- **حماية الإزالة من المنهج (`RESTRICT`):** يمنع إزالة مادة من منهج فترة دراسية محددة إذا تم إنشاء امتحانات رسمية أو حصص لها بنفس الفترة.

---

## ⚡ تسريع الاستعلامات ومعايير القبول العامة (Global Optimization & Acceptance)

### 1. تسريع التحميل المسبق (Eager Loading Optimization):
لمنع مشكلة N+1 Query Problem عند جلب شجرة الهيكل الأكاديمي:
```php
$hierarchy = AcademicStage::with([
    'classes' => function ($query) {
        $query->where('is_active', 1)->orderBy('order_index');
    },
    'classes.classSections.section',
    'classes.classSubjects' => function ($query) use ($activeTermId) {
        $query->where('academic_term_id', $activeTermId)->with('subject');
    }
])->orderBy('order_index')->get();
```

### 2. صلاحيات الإدارة والتدقيق (RBAC & Audit Log):
- كافة العمليات مقتصرة حصرياً على دور الإدارة (`role_type = 'admin'`).
- تسجل عمليات تفعيل السنة النشطة وتعديل درجات المواد تلقائياً في `audit_logs`.

---

## 🏁 معايير القبول لخلفية المنظومة (Backend Acceptance Criteria)

- [ ] إضافة وصف مختصر في بداية كل خطوة من الخطوات التنفيذية الـ 8.
- [ ] إدراج الوصف الوظيفي الصريح لكل رابط وإجراء في الجداول (مثال: "إنشاء سنة دراسية جديدة"، "تعديل مادة").
- [ ] إعادة هيكلة وتسلسل ملف `backend.md` كاملاً وفق الخطوات التنفيذية الـ 8 بنسبة 100%.
- [ ] توثيق ومطابقة كود استجابة النجاح المباشر (`200 OK` أو `201 Created`) لجميع العمليات الـ 34.
- [ ] الإشارة الصريحة لـ `routes.md` بكونه مرجع الشبكة الحصري لكافة الاستجابات.

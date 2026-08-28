# ⚙️ مواصفات Backend — المرحلة 02: الهيكل الأكاديمي والمناهج (Domain Logic & Architecture)

> **الهدف:** توثيق منطق الأعمال الخلفي، وقواعد التحقق الصارمة، وحماية المعاملات الذرية (ACID Transactions)، والتحميل المسبق للعلاقات (Eager Loading)، وتدقيق العمليات الحساسة للهيكل الأكاديمي وفق **الخطوات التنفيذية الـ 8 المعتمدة**.

---

## 1. العمليات الخلفية ونقاط الدخول المرتبة (Operations Mapping)

| # | الخطوة الأكاديمية | العملية الخلفية (Service Method) | نقطة الدخول في الـ API | المرجع التفصيلي في `routes.md` |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **إدارة السنوات الدراسية** | `AcademicYearService::createYear / setCurrent` | `POST /api/v1/academic/years` | [الخطوة 1 في `routes.md`](./routes.md#الخطوة-1-إدارة-السنوات-الدراسية-academic_years) |
| **2** | **إدارة الفترات الدراسية** | `AcademicTermService::createTerm / setCurrent` | `POST /years/:year_id/terms` | [الخطوة 2 في `routes.md`](./routes.md#الخطوة-2-إدارة-الفصولالفترات-الدراسية-academic_terms) |
| **3** | **إدارة المراحل التعليمية** | `AcademicStageService::createStage` | `POST /api/v1/academic/stages` | [الخطوة 3 في `routes.md`](./routes.md#الخطوة-3-إدارة-المراحل-التعليمية-academic_stages) |
| **4** | **إدارة الصفوف وتبعية المرحلة**| `ClassService::createClass` | `POST /api/v1/academic/classes` | [الخطوة 4 في `routes.md`](./routes.md#الخطوة-4-إدارة-الصفوف-الدراسية-وتحديد-تببيتها-للمراحل-classes) |
| **5** | **إدارة بنك الشعب العامة** | `SectionService::createSection` | `POST /api/v1/academic/sections` | [الخطوة 5 في `routes.md`](./routes.md#الخطوة-5-إدارة-بنك-الشعب-العامة-sections) |
| **6** | **إدارة بنك المواد العامة** | `SubjectService::createSubject` | `POST /api/v1/academic/subjects` | [الخطوة 6 في `routes.md`](./routes.md#الخطوة-6-إدارة-بنك-المواد-الدراسية-العامة-subjects) |
| **7** | **تسكين وربط الشعب بالصفوف** | `ClassSectionService::assignSection` | `POST /api/v1/academic/class-sections` | [الخطوة 7 في `routes.md`](./routes.md#الخطوة-7-إدارة-ربط-وتسكين-الشعب-بالصفوف-class_sections) |
| **8** | **إسناد المواد ودرجات الفترة** | `CurriculumService::assignSubject` | `POST /classes/:class_id/subjects` | [الخطوة 8 في `routes.md`](./routes.md#الخطوة-8-إدارة-مناهج-الصفوف-والدرجات-لكل-فترة-دراسية-class_subjects) |

---

## 2. قواعد التحقق الصارم عند الحدود (Ingress Validation Invariants)

### 2.1 قواعد التحقق للسنة الدراسية (`AcademicYearRequest`):
1. **`name`:** مطلوب، نصي، فريد في جدول `academic_years` بتنسيق السنة (`2025/2026`).
2. **`start_date` و `end_date`:** تواريخ صالحة بشرط أن يكون `end_date > start_date`.

### 2.2 قواعد التحقق للفصل/الفترة الدراسية (`AcademicTermRequest`):
1. **`academic_year_id`:** مطلوب وموجود في جدول `academic_years`.
2. **`name`:** مطلوب، نصي (مثال: `الفترة الأولى`).
3. **`term_type`:** ضمن القيم المعتمدة (`first_term`, `second_term`, `third_term`, `full_year`).

### 2.3 قواعد التحقق للصف وتحديد تبعيته للمرحلة (`ClassRequest`):
1. **`academic_stage_id`:** مطلوب وموجود في جدول `academic_stages` وتكون المرحلة نشطة (`is_active = 1`).
2. **`name`:** مطلوب، نصي (مثال: `الصف الخامس`).

### 2.4 قواعد التحقق لإسناد مادة وتحديد درجات الفترة (`ClassSubjectRequest`):
1. **`subject_id`:** مطلوب، وموجود في `subjects` ونشط (`is_active = 1`).
2. **`academic_term_id`:** مطلوب، وموجود في `academic_terms`.
3. **`max_score`:** مطلوب، رقمي موجب (`numeric`, `min:1`, `max:1000.00`).
4. **`pass_score`:** مطلوب، رقمي موجب بشرط أن تكون درجة النجاح أقل من أو تساوي الدرجة العظمى (`pass_score <= max_score`).

---

## 3. منطق الأعمال وحماية المعاملات (Domain Logic & ACID Transactions)

### 3.1 التبديل الذري للسنة والفصل النشط (`Atomic Active Toggle`):
عند تعيين سنة دراسية أو فترة كسنة/فترة نشطة حالياً (`is_current = 1`)، يجب تنفيذ العملية داخل معاملة قاعدة بيانات ذرية:
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

### 3.2 فحص قيود الحذف المرجعي (`Strict Referential Integrity - RESTRICT`):
قبل تنفيذ أي عملية حذف منطقي لأي كيان أكاديمي، يتم فحص التبعيات:
1. **المراحل (`academic_stages`):** يمنع حذف المرحلة إذا كان يوجد أي صف مضاف تحتها في `classes`.
2. **الصفوف (`classes`):** يمنع حذف الصف إذا كان يضم شُعباً صفية في `class_sections` أو مواد بالمنهج في `class_subjects`.
3. **الشعب العامة والمواد:** يمنع حذف المادة العامة أو الشعبة العامة إذا كانت مسندة لأي صف.
4. **مناهج الفترات:** يمنع إزالة المادة من منهج فترة دراسية محددة إذا تم إنشاء امتحانات رسمية أو حصص لها بنفس الفترة.

---

## 4. تسريع الاستعلامات والتحميل المسبق (Eager Loading Optimization)

لمنع مشكلة النوافل الناتجة عن الاستعلام المتكرر (N+1 Query Problem) عند جلب شجرة الهيكل الأكاديمي:
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

---

## 5. معايير القبول والاكتمال لخلفية المنظومة (Backend Acceptance Criteria)

- [ ] تطبيق التبويب والتنفيذ البرمجي المرتب وفق الخطوات التنفيذية الـ 8 بنسبة 100%.
- [ ] ضمان ذرية تبديل السنة النشطة ومنع أي سنة نشطة ثانية بنسبة 100%.
- [ ] فحص صحة وتطابق `pass_score <= max_score` لكل فترة دراسية مستقلة.
- [ ] حماية النظام من الحذف العشوائي وتفعيل قيود النزاهة المرجعية `RESTRICT`.

# ⚙️ مواصفات Backend — المرحلة 03-B (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجدول إسناد التدريس (`teaching_assignments`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 📚 الخطوة 1: إدارة سجل وجدول إسناد التدريس الأكاديمي (`teaching_assignments`) — [5 مسارات]

> **الوصف المختصر:** إسناد المعلمين للمواد والشعب وإدارة النصاب الأكاديمي وضبط قيد التفرغ للمادة بالشعبة.

### 1.1 جدول العمليات والروابط للخلفية (`teaching_assignments`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض جدول إسناد التدريس** | `TeachingAssignmentService::listAssignments` | `GET /api/v1/teaching-assignments` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1teaching-assignments--عرض-وتصفية-جدول-إسناد-التدريس-بالعام-الدراسي) |
| **عرض النصاب للمعلم** | `TeachingAssignmentService::getTeacherAssignments` | `GET /api/v1/teachers/:teacher_id/assignments` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1teachersteacher_idassignments--عرض-النصاب-التدريسي-والمواد-لمعلم-محدد) |
| **تعيين وتكليف معلم بشعبة ومادة**| `TeachingAssignmentService::createAssignment` | `POST /api/v1/teaching-assignments` | `201 Created` | [في `routes.md`](./routes.md#13-post-apiv1teaching-assignments--تعيين-وإسناد-تدريس-مادة-لشعبة-ومعلم) |
| **تعديل المعلم المكلف** | `TeachingAssignmentService::updateAssignment` | `PUT /api/v1/teaching-assignments/:id` | `200 OK` | [في `routes.md`](./routes.md#14-put-apiv1teaching-assignmentsid--تعديل-وتكليف-معلم-آخر-بالمادة-والشعبة) |
| **فك وإزالة إسناد التدريس** | `TeachingAssignmentService::deleteAssignment` | `DELETE /api/v1/teaching-assignments/:id` | `200 OK` | [في `routes.md`](./routes.md#15-delete-apiv1teaching-assignmentsid--فك-وإزالة-إسناد-التدريس) |

### 1.2 قواعد التحقق (`TeachingAssignmentRequest`):
- `academic_year_id`: مطلوب، وموجود بجدول `academic_years`.
- `class_section_id`: مطلوب، وموجود بجدول `class_sections`.
- `subject_id`: مطلوب، وموجود بجدول `subjects`.
- `teacher_id`: مطلوب، وموجود بجدول `teachers`.
- **قيد التفرد المركب:** `uq_teaching_assignment (academic_year_id, class_section_id, subject_id)`.

---

## ⚖️ 4. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 4.1 حوكمة الأدوار والصلاحيات (RBAC Governance):
- جميع عمليات إسناد وتوزيع النصاب الأكاديمي مقتصرة **حصراً على مدير النظام (Admin)** (`role_type = 'admin'`).

### 4.2 قيد المعلم الوحيد للمادة بالشعبة (Single Teacher Per Subject Invariant):
- يضمن النظام تعيين معلم مسؤول أساسي واحد فقط لكل مادة في الشعبة الواحدة خلال العام الدراسي لمنع تضارب رصد الدرجات والواجبات (`uq_teaching_assignment`).
- يتيح النظام للمعلم الواحد تدريس مواد وفصول وشعب متعددة دون قيد.

### 4.3 حماية الحذف المرجعي والحظر الحاسم (Strict RESTRICT Protection):
- **حماية إسناد التدريس:** يمنع فك أو حذف أي سجل إسناد تدريس مرتبط برصد واجبات مدرسية بجدول `assignments` أو اختبارات بجدول `quizzes` أو حصص بجدول `timetable_slots` (`ON DELETE RESTRICT`).

### 4.4 تتبع وسجلات التدقيق (Audit Logging):
- تسجل كافة عمليات إسناد المواد وتعديل المكلفين وفك الإسناد تلقائياً في سجلات التدقيق `audit_logs`.

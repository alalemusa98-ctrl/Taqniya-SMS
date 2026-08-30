# ⚙️ مواصفات Backend — المرحلة 05-B (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجدول الحصص الأسبوعي (`timetable_slots`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 🗓️ الخطوة 1: إدارة جدول الحصص الأسبوعي وحظر التعارضات الزمانية (`timetable_slots`) — [7 مسارات]

> **الوصف المختصر:** توزيع حصص الشعب والماد والمعلمين على أيام الأسبوع وحظر تضارب جدول الشعبة وتضارب جدول المعلم.

### 1.1 جدول العمليات والروابط للخلفية (`timetable_slots`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض مصفوفة الجدول الأسبوعي** | `TimetableService::listTimetableSlots` | `GET /api/v1/timetable-slots` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1timetable-slots--عرض-وتصفية-سجلات-الجدول-الأسبوعي) |
| **عرض جدول شعبة محددة** | `TimetableService::getSectionTimetable` | `GET /api/v1/sections/:section_id/timetable` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1sectionssection_idtimetable--عرض-مصفوفة-الجدول-الأسبوعي-لشعبة-محدد) |
| **عرض جدول معلم محدد** | `TimetableService::getTeacherTimetable` | `GET /api/v1/teachers/:teacher_id/timetable` | `200 OK` | [في `routes.md`](./routes.md#13-get-apiv1teachersteacher_idtimetable--عرض-جدول-الحصص-الأسبوعي-لمعلم-محدد) |
| **تسكين حصة بالجدول الأسبوعي** | `TimetableService::createTimetableSlot` | `POST /api/v1/timetable-slots` | `201 Created` | [في `routes.md`](./routes.md#14-post-apiv1timetable-slots--إضافة-وتسكين-حصة-بالجدول-الأسبوعي) |
| **تعديل موعد أو مادة الحصة** | `TimetableService::updateTimetableSlot` | `PUT /api/v1/timetable-slots/:id` | `200 OK` | [في `routes.md`](./routes.md#15-put-apiv1timetable-slotsid--تعديل-موعد-أو-مادةمعلم-الحصة-بالجدول-الأسبوعي) |
| **الجدولة الجماعية لشعبة** | `TimetableService::bulkScheduleSection` | `POST /api/v1/timetable-slots/bulk-schedule` | `200 OK` | [في `routes.md`](./routes.md#16-post-apiv1timetable-slotsbulk-schedule--التوزيع-والجدولة-الجماعية-لحصص-الشعبة) |
| **إلغاء وتفريغ حصة** | `TimetableService::deleteTimetableSlot` | `DELETE /api/v1/timetable-slots/:id` | `200 OK` | [في `routes.md`](./routes.md#17-delete-apiv1timetable-slotsid--إلغاء-وتفريغ-حصة-من-الجدول-الأسبوعي) |

---

### 1.2 قواعد التحقق (`TimetableSlotRequest`):
- `academic_year_id`: مطلوب وموجود بجدول `academic_years`.
- `class_section_id`: مطلوب وموجود بجدول `class_sections`.
- `day_of_week`: مطلوب، enum (`saturday`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`).
- `period_slot_id`: مطلوب وموجود بجدول `period_slots`.
- `teaching_assignment_id`: مطلوب وموجود بجدول `teaching_assignments`.

---

## ⚖️ 2. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 2.1 حوكمة قيد تفرد حصة الشعبة الزمني (Section Anti-Overlap Invariant):
- تمنع خدمة `TimetableService` إسناد حصتين لنفس الشعبة في نفس اليوم والتوقيت بالعام النشط (`uq_timetable_section_slot`). عند كشف التعارض ترجع `409 Conflict`.

### 2.2 حوكمة تضارب جدول المعلم (Teacher Schedule Anti-Conflict Invariant):
- تفحص خدمة `TimetableService` المعلم المكلف عبر `teaching_assignments.teacher_id` وتتفحص تعارض جدول المعلم مع الشعب الأخرى بالعام النشط (`idx_timetable_teacher_conflict`). إذا كان المعلم يحاضر بشعبة أخرى في نفس اليوم والتوقيت ترجع الخدمة `409 Conflict`.

### 2.3 المعاملات الذرية للجدولة الجماعية (`DB::transaction` Batch Processing):
- تنفذ الجدولة الجماعية للشعبة (`bulk-schedule`) داخل معاملة داتا بيز ذرية (`DB::transaction`) لضمان تسكين كافة حصص الأسبوع بنجاح وإلغاء العملية بالكامل عند كشف أي تضارب.

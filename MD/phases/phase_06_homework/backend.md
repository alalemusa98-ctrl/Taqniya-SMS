# ⚙️ مواصفات Backend — المرحلة 06 (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجدول الواجبات المدرسية (`assignments`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 📚 الخطوة 1: إدارة الواجبات المدرسية والتكاليف المنزلية (`assignments`) — [8 مسارات]

> **الوصف المختصر:** نشر وإدارة التكاليف والواجبات المدرسية ومتابعة مواعيد استحقاقها ومرفقاتها على مستوى الشعب والصفوف الدراسية.

### 1.1 جدول العمليات والروابط للخلفية (`assignments`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض وتصفية الواجبات** | `AssignmentService::listAssignments` | `GET /api/v1/assignments` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1assignments--عرض-وتصفية-قائمة-الواجبات-المدرسية) |
| **عرض تفاصيل واجب محدد** | `AssignmentService::getAssignment` | `GET /api/v1/assignments/:id` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1assignmentsid--عرض-تفاصيل-واجب-مدرسي-محدد) |
| **عرض واجبات شعبة محددة** | `AssignmentService::getSectionAssignments` | `GET /api/v1/sections/:section_id/assignments` | `200 OK` | [في `routes.md`](./routes.md#13-get-apiv1sectionssection_idassignments--عرض-جميع-واجبات-شعبة-محددة) |
| **عرض واجبات صف دراسي محدد** | `AssignmentService::getClassAssignments` | `GET /api/v1/classes/:class_id/assignments` | `200 OK` | [في `routes.md`](./routes.md#14-get-apiv1classesclass_idassignments--عرض-جميع-واجبات-صف-دراسي-محدد-بغض-النظر-عن-الشعبة) |
| **عرض واجبات معلم محدد** | `AssignmentService::getTeacherAssignments` | `GET /api/v1/teachers/:teacher_id/assignments` | `200 OK` | [في `routes.md`](./routes.md#15-get-apiv1teachersteacher_idassignments--عرض-الواجبات-المنشأة-بواسطة-معلم-محدد) |
| **إنشاء ونشر واجب جديد** | `AssignmentService::createAssignment` | `POST /api/v1/assignments` | `201 Created` | [في `routes.md`](./routes.md#16-post-apiv1assignments--إنشاء-ونشر-واجب-مدرسي-جديد) |
| **تعديل واجب مدرسي** | `AssignmentService::updateAssignment` | `PUT /api/v1/assignments/:id` | `200 OK` | [في `routes.md`](./routes.md#17-put-apiv1assignmentsid--تعديل-بيانات-ومرفقات-وموعد-واجب-مدرسي) |
| **حذف واجب مدرسي** | `AssignmentService::deleteAssignment` | `DELETE /api/v1/assignments/:id` | `200 OK` | [في `routes.md`](./routes.md#18-delete-apiv1assignmentsid--حذف-واجب-مدرسي-من-المنظومة) |

---

### 1.2 قواعد التحقق (`AssignmentRequest`):
- `academic_year_id`: مطلوب وموجود بجدول `academic_years`.
- `academic_term_id`: مطلوب وموجود بجدول `academic_terms`.
- `class_section_id`: مطلوب وموجود بجدول `class_sections`.
- `teaching_assignment_id`: مطلوب وموجود بجدول `teaching_assignments`.
- `title`: مطلوب، نصي، أقصى طول 200 حرفاً (مثل: `حل تمارين ص 45 - الجبر`).
- `description`: اختياري، نصي.
- `attachments`: اختياري، array من مصفوفات المرفقات صيغة JSON.
- `assigned_date`: مطلوب، تاريخ بصيغة `YYYY-MM-DD`.
- `due_date`: مطلوب، تاريخ بصيغة `YYYY-MM-DD` ويجب أن يكون منطقياً مساوياً أو بعد تاريخ التكليف (`after_or_equal:assigned_date`).

---

## ⚖️ 2. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 2.1 حوكمة نطاق صلاحيات المعلم الإجبارية (Scoped Teacher Authorization):
- تفحص خدمة `AssignmentService` هويات المعلم من التوكن، وتتأكد من أن سجل `teaching_assignment_id` يرتبط بنفس المعلم (`teachers.user_id = auth_user_id`).
- إذا حاول المعلم نشر أو تعديل واجب مادة أو شعبة غير موكلة إليه رسمياً، ترجع الخدمة استجابة حظر `403 Forbidden`.

### 2.2 المساندة الإدارية وتوثيق المنشئ (`created_by_user_id`):
- يستطيع مدير النظام (`role_type = 'admin'`) إنشاء الواجبات نيابة عن المعلمين المسجلين، ويتم تسجيل `created_by_user_id` بالمعرف الحقيقي لمدير النظام مع توثيق ذلك بسجلات التدقيق `audit_logs`.

### 2.3 الاستعلام والتجميع على مستوى الصف الدراسي (`class_id` Querying):
- تقوم الخدمة `AssignmentService::getClassAssignments` بربط جدول `assignments` مع جدول `class_sections` ثم `classes` لجلب كافة الواجبات الخاصة بالشعب التابعة للصف الدراسي المعني، مما يسهل على الإدارة والمشرفين متابعة واجبات المستوى بالكامل.

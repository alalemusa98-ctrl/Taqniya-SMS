# ⚙️ مواصفات Backend — المرحلة 04-B (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجدول تسكين الطلاب الأكاديمي (`student_enrollments`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 🏫 الخطوة 1: إدارة تسكين سجل الطلاب الأكاديمي (`student_enrollments`) — [6 مسارات]

> **الوصف المختصر:** تسكين الطلاب بالشعب وتوزيع الفصول وإسناد أرقام الجلوس وحالات النقل والترفيع.

### 1.1 جدول العمليات والروابط للخلفية (`student_enrollments`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض وتصفية تسكين الطلاب** | `StudentEnrollmentService::listEnrollments` | `GET /api/v1/student-enrollments` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1student-enrollments--عرض-وتصفية-وسجل-تسكين-الطلاب-بالعام-الدراسي) |
| **عرض أرشيف تسكين طالب** | `StudentEnrollmentService::getStudentEnrollments` | `GET /api/v1/students/:student_id/enrollments` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1studentsstudent_idenrollments--عرض-سجل-التسكين-والأرشيف-الأكاديمي-لطالب-محدد) |
| **تسكين طالب في صف وشعبة**| `StudentEnrollmentService::createEnrollment` | `POST /api/v1/student-enrollments` | `201 Created` | [في `routes.md`](./routes.md#13-post-apiv1student-enrollments--تسكين-وتسجيل-طالب-في-صف-وشعبة) |
| **تعديل التسكين ورقم الجلوس** | `StudentEnrollmentService::updateEnrollment` | `PUT /api/v1/student-enrollments/:id` | `200 OK` | [في `routes.md`](./routes.md#14-put-apiv1student-enrollmentsid--تعديل-بيانات-التسكين-ورقم-الجلوس-والحالة) |
| **التسكين الجماعي للطلاب** | `StudentEnrollmentService::bulkEnroll` | `POST /api/v1/student-enrollments/bulk-enroll` | `200 OK` | [في `routes.md`](./routes.md#15-post-apiv1student-enrollmentsbulk-enroll--التسكين-والتوزيع-الجماعي-للطلاب) |
| **إلغاء وتجريد تسكين طالب** | `StudentEnrollmentService::deleteEnrollment` | `DELETE /api/v1/student-enrollments/:id` | `200 OK` | [في `routes.md`](./routes.md#16-delete-apiv1student-enrollmentsid--إلغاء-وتجريد-تسكين-طالب) |

---

### 1.2 قواعد التحقق (`StudentEnrollmentRequest`):
- `academic_year_id`: مطلوب وموجود بجدول `academic_years`.
- `student_id`: مطلوب وموجود بجدول `students`.
- `class_section_id`: مطلوب وموجود بجدول `class_sections`.
- `seating_number`: اختياري، نصي، أقصى طول 50 حرفاً.
- `status`: اختياري، enum (`enrolled`, `passed`, `second_round`, `failed`, `graduated`), الافتراضي `enrolled`.

---

## ⚖️ 2. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 2.1 حوكمة قيد التفرد السنوي والتسكين الوحيد (Single Enrollment Invariant):
- يمنع تسكين نفس الطالب في أكثر من شعبة أو صف خلال نفس العام الدراسي النشط (`uq_student_enrollment_year: student_id, academic_year_id`).
- عند إجراء محاولة تسكين مكررة، تقوم الخدمة برفض العملية واسترجاع `409 Conflict`.

### 2.2 التلقيم التلقائي للمستوى الأكاديمي (`grade_level` Resolver):
- يتولى السيرفر استخراج معرف الصف `class_id` ومستواه الأكاديمي الرقمي `grade_level` تلقائياً من الشعبة المختارة `class_sections.class_id` -> `classes.grade_level` لضمان الاتساق والنزاهة العلائقية 100%.

### 2.3 حماية الحذف المرجعي والدرجات المعتمدة (Strict RESTRICT Protection):
- يمنع تجريد أو إلغاء تسكين أي طالب لديه درجات امتحانات أو واجبات مرصودة أفقياً بالسجل (`ON DELETE RESTRICT`).

### 2.4 المعاملات الذرية للتسكين الجماعي (`DB::transaction` Batch Processing):
- تنفذ عمليات التسكين الجماعي (`bulk-enroll`) داخل معاملة داتا بيز ذرية حاسمة (`DB::transaction`) لضمان تسكين كافة الطلاب المحددين بنجاح وإلغاء العملية بالكامل (Rollback) في حال وجود عثرة في أحد السجلات.

# ⚙️ مواصفات Backend — المرحلة 08 (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجدول الامتحانات الرسمية (`official_exams`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 📝 الخطوة 1: إدارة جدول الامتحانات الرسمية (`official_exams`) — [6 مسارات]

> **الوصف المختصر:** إدراج وجدولة ونشر مواعيد الامتحانات الرسمية (النصفية، النهائية، والدور الثاني) وإدارتها مركزياً عبر إدارة المدرسة.

### 1.1 جدول العمليات والروابط للخلفية (`official_exams`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض وتصفية الامتحانات الرسمية** | `OfficialExamService::listExams` | `GET /api/v1/official-exams` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1official-exams--عرض-وتصفية-قائمة-الامتحانات-الرسمية) |
| **عرض تفاصيل امتحان رسمي** | `OfficialExamService::getExam` | `GET /api/v1/official-exams/:id` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1official-examsid--عرض-تفاصيل-امتحان-رسمي-محدد) |
| **عرض جدول امتحانات صف محدد** | `OfficialExamService::getClassExams` | `GET /api/v1/classes/:class_id/official-exams` | `200 OK` | [في `routes.md`](./routes.md#13-get-apiv1classesclass_idofficial-exams--عرض-جدول-الامتحانات-الرسمية-لصف-دراسي-محدد) |
| **جدولة امتحان رسمي جديد** | `OfficialExamService::createExam` | `POST /api/v1/official-exams` | `201 Created` | [في `routes.md`](./routes.md#14-post-apiv1official-exams--إضافة-وجدولة-امتحان-رسمي-جديد) |
| **تعديل موعد/نوتس امتحان** | `OfficialExamService::updateExam` | `PUT /api/v1/official-exams/:id` | `200 OK` | [في `routes.md`](./routes.md#15-put-apiv1official-examsid--تعديل-موعد-أو-تعليمات-امتحان-رسمي-قائم) |
| **حذف امتحان رسمي** | `OfficialExamService::deleteExam` | `DELETE /api/v1/official-exams/:id` | `200 OK` | [في `routes.md`](./routes.md#16-delete-apiv1official-examsid--إلغاء-وحذف-امتحان-رسمي-من-الجدول) |

### 1.2 قواعد التحقق (`OfficialExamRequest`):
- `academic_year_id`: مطلوب، `integer` وموجود بجدول `academic_years`.
- `academic_term_id`: مطلوب، `integer` وموجود بجدول `academic_terms`.
- `class_id`: مطلوب، `integer` وموجود بجدول `classes`.
- `subject_id`: مطلوب، `integer` وموجود بجدول `subjects`.
- `exam_type`: مطلوب، enum (`midterm`, `final`, `second_round`).
- `exam_date`: مطلوب، `date` بصيغة `YYYY-MM-DD`.
- `notes`: اختياري، `string` أقصى طول 255 حرفاً.
- **قيد التفرد المركب:** `uq_official_exam_schedule (academic_year_id, academic_term_id, class_id, subject_id, exam_type)`.

---

## ⚖️ 2. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 2.1 حوكمة الصلاحيات الحصرية لمدير النظام (Strict Admin RBAC):
- جميع عمليات إضافة وجدولة وتعديل وحذف الامتحانات الرسمية (النصفية والنهائية والدور الثاني) مقتصرة **حصراً على مدير النظام (Admin)** (`role_type = 'admin'`).
- محاولة التنفيذ من أي معلم أو طالب أو ولي أمر يتم حظرها فوراً باستجابة `403 Forbidden`.

### 2.2 حوكمة تفرد جدولة المادة بالنصف والنهائي (`uq_official_exam_schedule` Invariant):
- تتفحص خدمة `OfficialExamService` قيد التفرد الخماسي، وتمنع تكرار جدولة امتحان رسمي آخر لنفس المادة والصف في نفس السمستر والنوع. وعند التكرار ترجع الاستجابة الصريحة `409 Conflict`.

### 2.3 سياق القراءة للمستخدمين (Read-Only Context):
- يسترجع الطلاب والمعلمون وأولياء الأمور جدول الامتحانات الرسمية للصفوف المعنية عبر المسار `GET /api/v1/classes/:class_id/official-exams` بنمط القراءة فقط مع إبراز تواريخ وأوقات الامتحانات والنوتس الإرشادية.

### 2.4 تتبع وسجلات التدقيق (Audit Logging):
- تسجل كافة عمليات جدولة الامتحانات الرسمية وتعديل مواعيدها أو إلغائها تلقائياً بجدول سجلات التدقيق `audit_logs`.

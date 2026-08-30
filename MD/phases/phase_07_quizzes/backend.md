# ⚙️ مواصفات Backend — المرحلة 07 (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجدول التطبيقات والاختبارات الدورية (`quizzes`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 📝 الخطوة 1: إدارة التطبيقات والاختبارات الدورية (`quizzes`) — [8 مسارات]

> **الوصف المختصر:** إدراج وجدولة ونشر الاختبارات الدورية والتطبيقات الشهرية ومتابعة مواعيد إجرائها بالفصول ومرفقاتها.

### 1.1 جدول العمليات والروابط للخلفية (`quizzes`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض وتصفية التطبيقات** | `QuizService::listQuizzes` | `GET /api/v1/quizzes` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1quizzes--عرض-وتصفية-قائمة-التطبيقات-والاختبارات-الدورية) |
| **عرض تفاصيل تطبيق محدد** | `QuizService::getQuiz` | `GET /api/v1/quizzes/:id` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1quizzesid--عرض-تفاصيل-تطبيقاختبار-دوري-محدد) |
| **عرض تطبيقات شعبة محددة** | `QuizService::getSectionQuizzes` | `GET /api/v1/sections/:section_id/quizzes` | `200 OK` | [في `routes.md`](./routes.md#13-get-apiv1sectionssection_idquizzes--عرض-جميع-تطبيقات-شعبة-محددة) |
| **عرض تطبيقات صف دراسي محدد** | `QuizService::getClassQuizzes` | `GET /api/v1/classes/:class_id/quizzes` | `200 OK` | [في `routes.md`](./routes.md#14-get-apiv1classesclass_idquizzes--عرض-جميع-تطبيقات-صف-دراسي-محدد-بغض-النظر-عن-الشعبة) |
| **عرض تطبيقات معلم محدد** | `QuizService::getTeacherQuizzes` | `GET /api/v1/teachers/:teacher_id/quizzes` | `200 OK` | [في `routes.md`](./routes.md#15-get-apiv1teachersteacher_idquizzes--عرض-التطبيقات-المنشأة-بواسطة-معلم-محدد) |
| **إنشاء ونشر تطبيق جديد** | `QuizService::createQuiz` | `POST /api/v1/quizzes` | `201 Created` | [في `routes.md`](./routes.md#16-post-apiv1quizzes--إنشاء-ونشر-تطبيقاختبار-دوري-جديد) |
| **تعديل تطبيق دوري** | `QuizService::updateQuiz` | `PUT /api/v1/quizzes/:id` | `200 OK` | [في `routes.md`](./routes.md#17-put-apiv1quizzesid--تعديل-مواضيع-ومرفقات-وموعد-إجراء-تطبيقاختبار-دوري) |
| **حذف تطبيق دوري** | `QuizService::deleteQuiz` | `DELETE /api/v1/quizzes/:id` | `200 OK` | [في `routes.md`](./routes.md#18-delete-apiv1quizzesid--إلغاء-وحذف-تطبيقاختبار-دوري-من-المنظومة) |

### 1.2 قواعد التحقق (`QuizRequest`):
- `academic_year_id`: مطلوب، `integer` وموجود بجدول `academic_years`.
- `academic_term_id`: مطلوب، `integer` وموجود بجدول `academic_terms`.
- `class_section_id`: مطلوب، `integer` وموجود بجدول `class_sections`.
- `teaching_assignment_id`: مطلوب، `integer` وموجود بجدول `teaching_assignments`.
- `title`: مطلوب، `string` وأقصى طول 200 حرفاً (مثل: `تطبيق شهري 1 - الجبر والمعادلات`).
- `description`: اختياري، `string`.
- `attachments`: اختياري، `array` صالحة للتحويل إلى `JSON`.
- `quiz_date`: مطلوب، `date` بصيغة `YYYY-MM-DD`.

---

## ⚖️ 2. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 2.1 حوكمة نطاق صلاحيات المعلم الإجبارية (Scoped Teacher Authorization):
- تفحص خدمة `QuizService` هويات المعلم من التوكن، وتتأكد من أن سجل `teaching_assignment_id` يرتبط بنفس المعلم (`teachers.user_id = auth_user_id`).
- إذا حاول المعلم نشر أو تعديل تطبيق مادة أو شعبة غير موكلة إليه رسمياً، ترجع الخدمة استجابة حظر `403 Forbidden`.

### 2.2 المساندة الإدارية وتوثيق المنشئ (`created_by_user_id` & Audit Trail):
- يستطيع مدير النظام (`role_type = 'admin'`) إنشاء التطبيقات والاختبارات الدورية نيابة عن المعلمين المسجلين، ويتم تسجيل `created_by_user_id` بالمعرف الحقيقي لمدير النظام مع توثيق ذلك بسجلات التدقيق `audit_logs`.

### 2.3 الاستعلام والتجميع على مستوى الصف الدراسي (`class_id` Querying):
- تقوم الخدمة `QuizService::getClassQuizzes` بربط جدول `quizzes` مع جدول `class_sections` ثم `classes` لجلب كافة التطبيقات الشهرية المحددة لكافة شعب الصف الدراسي، مما يتيح للإدارة والمشرفين متابعة التقويم الدوري للصف بالكامل.

### 2.4 معالجة المرفقات الهيكلية (`JSON Attachments Handling`):
- يتم تشفير وتخزين مرفقات التطبيقات والاختبارات كـ `JSON Array` بجدول `quizzes.attachments` لتمكين الطلاب وأولياء الأمور من تحميل الملخصات ونماذج التمارين المراجعة مسبقاً.

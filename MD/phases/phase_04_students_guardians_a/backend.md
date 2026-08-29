# ⚙️ مواصفات Backend — المرحلة 04-A (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجداول الطلاب وأولياء الأمور والوصاية الأسرية (`students`, `guardians`, `guardian_students`) وحساباتهم الموحدة (`users`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 🎓 الخطوة 1: إدارة ملفات وسجل الطلاب (`students`) — [5 مسارات]

> **الوصف المختصر:** إعداد ملفات الطلاب وتوليد الرمز الموحد `STU-XXXX` بحسابات `users` واستخراج وسم الصف والشعبة الحالية `class_section`.

### 1.1 جدول العمليات والروابط للخلفية (`students`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض قائمة وبحث الطلاب** | `StudentService::listStudents` | `GET /api/v1/students` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1students--عرض-قائمة-وبحث-سجل-الطلاب) |
| **عرض تفاصيل ملف طالب** | `StudentService::getStudent` | `GET /api/v1/students/:id` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1studentsid--عرض-تفاصيل-ملف-طالب-محدد) |
| **إنشاء ملف طالب وحساب موحد**| `StudentService::createStudent` | `POST /api/v1/students` | `201 Created` | [في `routes.md`](./routes.md#13-post-apiv1students--إنشاء-ملف-طالب-وتوليد-حساب-الدخول-الموحد) |
| **تعديل بيانات ملف طالب** | `StudentService::updateStudent` | `PUT /api/v1/students/:id` | `200 OK` | [في `routes.md`](./routes.md#14-put-apiv1studentsid--تعديل-البيانات-الشخصية-للطالب) |
| **حذف ملف طالب غير مسجل** | `StudentService::deleteStudent` | `DELETE /api/v1/students/:id` | `200 OK` | [في `routes.md`](./routes.md#15-delete-apiv1studentsid--حذف-ملف-طالب-غير-مسجل) |

### 1.2 قواعد التحقق (`StudentRequest`):
- `full_name`: مطلوب، نصي، أقصى طول 150 حرفاً.
- `phone`: اختياري، نص رقمي، أقصى طول 20 حرفاً.
- `birth_date`: اختياري، تاريخ بصيغة `YYYY-MM-DD`.
- `gender`: مطلوب، `male` أو `female`.
- `password`: مطلوب عند الإنشاء.

---

## 👨‍👩‍👧‍👦 الخطوة 2: إدارة سجل أولياء الأمور (`guardians`) — [5 مسارات]

> **الوصف المختصر:** إعداد ملفات أولياء الأمور وحساباتهم الموحدة `PAR-XXXX` واستعراض أبنائهم مع وسم الصف والشعبة `class_section`.

### 2.1 جدول العمليات والروابط للخلفية (`guardians`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض قائمة أولياء الأمور** | `GuardianService::listGuardians` | `GET /api/v1/guardians` | `200 OK` | [في `routes.md`](./routes.md#21-get-apiv1guardians--عرض-قائمة-وبحث-أولياء-الأمور) |
| **عرض تفاصيل ولي أمر وأبنائه**| `GuardianService::getGuardian` | `GET /api/v1/guardians/:id` | `200 OK` | [في `routes.md`](./routes.md#22-get-apiv1guardiansid--عرض-تفاصيل-ولي-أمر-محدد-والأبناء) |
| **إنشاء ملف ولي أمر وحساب موحد**| `GuardianService::createGuardian` | `POST /api/v1/guardians` | `201 Created` | [في `routes.md`](./routes.md#23-post-apiv1guardians--إنشاء-ملف-ولي-أمر-وتوليد-حساب-الدخول-الموحد) |
| **تعديل بيانات ولي الأمر** | `GuardianService::updateGuardian` | `PUT /api/v1/guardians/:id` | `200 OK` | [في `routes.md`](./routes.md#24-put-apiv1guardiansid--تعديل-ملف-ولي-الأمر) |
| **حذف ملف ولي أمر غير مرتبط** | `GuardianService::deleteGuardian` | `DELETE /api/v1/guardians/:id` | `200 OK` | [في `routes.md`](./routes.md#25-delete-apiv1guardiansid--حذف-ملف-ولي-أمر-غير-مرتبط) |

### 2.2 قواعد التحقق (`GuardianRequest`):
- `full_name`: مطلوب، نصي، أقصى طول 150 حرفاً.
- `phone`: مطلوب، رقم فريد `uq_guardians_phone` أقصى طول 20 حرفاً.
- `relationship`: مطلوب، enum (`father`, `mother`, `brother`, `uncle`, `other`).
- `password`: مطلوب عند الإنشاء.

---

## 🔗 الخطوة 3: إدارة روابط الوصاية الأسرية (`guardian_students`) — [4 مسارات]

> **الوصف المختصر:** ربط أولياء الأمور بالطلاب الأبناء وتحديد الوصي الرئيسي `is_primary`.

### 3.1 جدول العمليات والروابط للخلفية (`guardian_students`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض قائمة أبناء ولي أمر** | `GuardianStudentService::listGuardianStudents` | `GET /api/v1/guardians/:guardian_id/students` | `200 OK` | [في `routes.md`](./routes.md#31-get-apiv1guardiansguardian_idstudents--عرض-قائمة-أطفال-وأبناء-ولي-أمر) |
| **ربط ولي أمر بطالب** | `GuardianStudentService::linkGuardian` | `POST /api/v1/guardian-students` | `201 Created` | [في `routes.md`](./routes.md#32-post-apiv1guardian-students--ربط-ولي-أمر-بـ-طالب-وتحديد-صفة-الوصاية) |
| **تعديل صفة الوصاية المعتمدة**| `GuardianStudentService::updateLink` | `PUT /api/v1/guardian-students/:id` | `200 OK` | [في `routes.md`](./routes.md#33-put-apiv1guardian-studentsid--تعديل-صفة-الوصاية-المعتمدة) |
| **فك وإلغاء رابط الوصاية** | `GuardianStudentService::unlinkGuardian` | `DELETE /api/v1/guardian-students/:id` | `200 OK` | [في `routes.md`](./routes.md#34-delete-apiv1guardian-studentsid--فك-وإلغاء-رابط-الوصاية) |

### 3.2 قواعد التحقق (`GuardianStudentRequest`):
- `guardian_id`: مطلوب وموجود بجدول `guardians`.
- `student_id`: مطلوب وموجود بجدول `students`.
- `is_primary`: مطلوب، `0` أو `1`.
- **قيد التفرد المركب:** `uq_guardian_student (guardian_id, student_id)`.

---

## ⚖️ 4. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 4.1 حوكمة الأدوار والصلاحيات (RBAC Governance):
- عمليات إنشاء وتعديل وحذف ملفات الطلاب وأولياء الأمور مقتصرة **حصراً على مدير النظام (Admin)** (`role_type = 'admin'`).
- يتاح لـ **ولي الأمر (`role_type = 'parent'`)** استرجاع واستعراض ملفات الأبناء المكلف بوصايتهم حصراً.

### 4.2 توليد الرموز الموحدة الأسرية (User Code Generation):
- عند إنشاء طالب جديد يتم إنشاء حساب بجدول `users` ذرياً داخل `DB::transaction` بتوليد رمز موحد يبدأ بـ `STU-` (مثال: `STU-3001`).
- عند إنشاء ولي أمر جديد يتم إنشاء حساب بجدول `users` ذرياً داخل `DB::transaction` بتوليد رمز موحد يبدأ بـ `PAR-` (مثال: `PAR-4001`).

### 4.3 حماية الحذف المرجعي والحظر الحاسم (Strict RESTRICT Protection):
- **حماية ملفات الطلاب:** يمنع حذف أي طالب لديه سجل تسكين بجدول `student_enrollments` أو درجات مرصودة بجدول `student_grades` (`ON DELETE RESTRICT`).
- **حماية ملفات أولياء الأمور:** يمنع حذف أي ولي أمر مرتبطة به وصاية أطفال في `guardian_students` (`ON DELETE RESTRICT`).

### 4.4 تتبع وسجلات التدقيق (Audit Logging):
- تسجل كافة عمليات إضافة الطلاب وأولياء الأمور وتعديل بياناتهم وتغيير الوصاية تلقائياً في سجلات التدقيق `audit_logs`.

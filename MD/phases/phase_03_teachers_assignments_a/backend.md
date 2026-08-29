# ⚙️ مواصفات Backend — المرحلة 03-A (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجدول المعلمين (`teachers`) وحساباتهم الموحدة (`users`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 👨‍🏫 الخطوة 1: إدارة ملفات وسجل المعلمين (`teachers`) — [5 مسارات]

> **الوصف المختصر:** إعداد ملفات الكادر التعليمي وتنسيق الحسابات الموحدة للوصول (`user_code` صاحب بادئة `TCH-XXXX`).

### 1.1 جدول العمليات والروابط للخلفية (`teachers`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض قائمة المعلمين** | `TeacherService::listTeachers` | `GET /api/v1/teachers` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1teachers--عرض-قائمة-المعلمين-والجلب-بالترقيم-المالي-والتخصص) |
| **عرض تفاصيل ملف معلم** | `TeacherService::getTeacher` | `GET /api/v1/teachers/:id` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1teachersid--عرض-تفاصيل-ملف-معلم-محدد) |
| **إنشاء ملف معلم وحساب موحد** | `TeacherService::createTeacher` | `POST /api/v1/teachers` | `201 Created` | [في `routes.md`](./routes.md#13-post-apiv1teachers--إنشاء-ملف-معلم-وتوليدربط-حساب-الدخول-الموحد) |
| **تعديل بيانات ملف معلم** | `TeacherService::updateTeacher` | `PUT /api/v1/teachers/:id` | `200 OK` | [في `routes.md`](./routes.md#14-put-apiv1teachersid--تعديل-البيانات-الشخصية-والمهنية-للمعلم) |
| **حذف ملف معلم غير مرتبط** | `TeacherService::deleteTeacher` | `DELETE /api/v1/teachers/:id` | `200 OK` | [في `routes.md`](./routes.md#15-delete-apiv1teachersid--حذف-ملف-معلم-غير-مرتبط-بإسناد) |

### 1.2 قواعد التحقق (`TeacherRequest`):
- `full_name`: مطلوب، نصي، أقصى طول 150 حرفاً.
- `phone`: اختياري، نص رقمي، أقصى طول 20 حرفاً.
- `specialization`: اختياري، نص، أقصى طول 100 حرف.
- `hire_date`: اختياري، تاريخ بصيغة `YYYY-MM-DD`.
- `password`: مطلوب عند الإنشاء، أقصى أمان (8 حروف على الأقل متضمناً رموز وأرقام).

---

## ⚖️ 4. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 4.1 حوكمة الأدوار والصلاحيات (RBAC Governance):
- جميع عمليات إضافة وتعديل وحذف سجلات المعلمين مقتصرة **حصراً على مدير النظام (Admin)** (`role_type = 'admin'`).

### 4.2 توليد الرمز الموحد وحظر التكرار (User Code Generation):
- عند إنشاء معلم جديد، يتم إنشاء حساب بجدول `users` ذرياً داخل `DB::transaction` بتوليد رمز موحد تلقائي يبدأ ببادئة `TCH-` (مثال: `TCH-2001`, `TCH-2002`).
- يمنع ربط أكثر من معلم بحساب واحد (`uq_teachers_user_id`).

### 4.3 حماية الحذف المرجعي والحظر الحاسم (Strict RESTRICT Protection):
- **حماية المعلمين:** يمنع حذف أي معلم مسجل مسبقاً في إسناد تدريس بجدول `teaching_assignments` لضمان السجل التاريخي للدرجات وحصص الجدول (`ON DELETE RESTRICT`).

### 4.4 تتبع وسجلات التدقيق (Audit Logging):
- تسجل كافة عمليات إضافة المعلمين وتعديل بياناتهم وحذفهم تلقائياً في سجلات التدقيق `audit_logs`.

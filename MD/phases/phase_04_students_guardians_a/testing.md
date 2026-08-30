# 🧪 مصفوفة الاختبارات والتحقق — المرحلة 04-A (Testing Specification)

> **الهدف:** توثيق مصفوفة الاختبارات الشاملة (Unit, Integration, Security, Relational Integrity) للمرحلة الفرعية 04-A لضمان جودة الأكواد ومطابقتها التامة لـ [`routes.md`](./routes.md)، [`backend.md`](./backend.md)، و [`MD/database.md`](../../database.md).

---

## 1. استراتيجية الاختبارات العامة (Testing Strategy)

- **نمط الاختبار:** اختبارات تكاملية للـ API، اختبارات التوليد الذري للحسابات (`Atomic User Creation`)، واختبارات قيود قاعدة البيانات (Database Constraints & Relational Integrity).
- **التغطية المطلوبة:** 100% لكافة مسارات الـ API الـ 11، وقواعد التحقق، وحالات التعارض والمنع (409 Conflict).
- **البيئة المعتمدة:** بيئة اختبار معزولة (Test Database) يتم تصفيرها وإعادة ضبطها تلقائياً قبل كل جولة اختبار.

---

## 2. مصفوفة الاختبارات التفصيلية (Comprehensive Test Matrix)

---

### 2.1 اختبارات ملفات الطلاب (`students`) — [الخطوة 1]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-STU-01` | **Integration** | استرجاع قائمة الطلاب مع الترقيم والفلترة بالجنس | `GET /api/v1/students?gender=male&page=1` | `200 OK` مع مصفوفة الطلاب و `meta`. |
| `TC-STU-02` | **Integration** | البحث النصي باسم الطالب أو كود `STU-XXXX` | `GET /api/v1/students?search=STU-3001` | `200 OK` ومطابقة السجل المطلوب. |
| `TC-STU-03` | **Integration** | استرجاع تفاصيل ملف طالب محدد بالمعرف | `GET /api/v1/students/1` | `200 OK` وتفاصيل الحساب والصف الحالي. |
| `TC-STU-04` | **Unit / Atomic** | **إنشاء طالب وتوليد الحساب الذري:** إنشاء ملف طالب والتحقق من إنشاء حساب `users` | `full_name: 'طارق الورفلي', gender: 'male', password: '...'` | `201 Created` وتوليد كود `STU-XXXX` وتشفير كلمة المرور. |
| `TC-STU-05` | **Validation** | رفض إضافة طالب بدون اسم رباعي أو بجنس غير صالح | `full_name: '', gender: 'invalid'` | `422 Unprocessable Entity`. |
| `TC-STU-06` | **Integration** | **تعديل ملف الطالب بنجاح:** تحديث الاسم وتاريخ الميلاد | `PUT /api/v1/students/1` مع `full_name: 'محمد علي جديد'` | `200 OK` وتحديث بيانات الطالب. |
| `TC-STU-07` | **Relational Integrity** | **منع حذف طالب مسكن أو له درجات (RESTRICT):** محاولة حذف طالب مسكن | `DELETE /api/v1/students/1` (مسكن بشعبة) | `409 Conflict` ورفض الحذف. |
| `TC-STU-08` | **Soft Delete** | حذف ملف طالب حر غير مرتبط بتسكين أو درجات | `DELETE /api/v1/students/2` (طالب حر) | `200 OK` وضبط `deleted_at` بجدول `students` و `users`. |

---

### 2.2 اختبارات ملفات أولياء الأمور (`guardians`) — [الخطوة 2]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-GRD-01` | **Integration** | استرجاع قائمة أولياء الأمور مع الترقيم والبحث | `GET /api/v1/guardians?search=0912222222` | `200 OK` مع قائمة الأولياء و `meta`. |
| `TC-GRD-02` | **Integration** | استرجاع تفاصيل ملف ولي أمر محدد بالمعرف | `GET /api/v1/guardians/1` | `200 OK` وتفاصيل الحساب وصلة القرابة. |
| `TC-GRD-03` | **Unit / Atomic** | **إنشاء ولي أمر وتوليد الحساب الذري:** إنشاء ملف ولي أمر وإنشاء حساب `PAR-XXXX` | `full_name: 'خالد السويح', phone: '0913333333', password: '...'` | `201 Created` وتوليد كود `PAR-XXXX`. |
| `TC-GRD-04` | **Conflict / Invariant** | **قيد تفرد هاتف ولي الأمر (uq_guardians_phone):** منع تكرار رقم الهاتف | محاولة إنشاء ولي أمر برقم هاتف مسجل مسبقاً | `409 Conflict` (`uq_guardians_phone`). |
| `TC-GRD-05` | **Integration** | **تعديل ملف ولي الأمر بنجاح:** تحديث الاسم وصلة القرابة | `PUT /api/v1/guardians/1` | `200 OK` وتحديث بيانات السجل. |
| `TC-GRD-06` | **Relational Integrity** | **منع حذف ولي أمر لديه أبناء مكفولين (RESTRICT):** محاولة حذف ولي أمر مرتبط | `DELETE /api/v1/guardians/1` (مرتبط بأبناء) | `409 Conflict` ورفض الحذف. |
| `TC-GRD-07` | **Soft Delete** | حذف ملف ولي أمر حر غير مرتبط بأبناء | `DELETE /api/v1/guardians/2` (ولي أمر حر) | `200 OK` وضبط `deleted_at` وتحديث السجل. |

---

### 2.3 اختبارات روابط الوصاية الأسرية (`guardian_students`) — [الخطوة 3]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-CST-01` | **Integration** | استرجاع قائمة الأبناء المكفولين لولي أمر محدد | `GET /api/v1/guardians/1/students` | `200 OK` وقائمة الطلاب التابعين للوصي. |
| `TC-CST-02` | **Unit / Validation** | **ربط وصاية ولي أمر بطالب بنجاح:** إنشاء رابط وصاية جديد | `guardian_id: 1, student_id: 2, is_primary: 1` | `201 Created` وحفظ السجل بجدول `guardian_students`. |
| `TC-CST-03` | **Conflict / Invariant** | **قيد تفرد رابط الوصاية (uq_guardian_student):** منع تكرار ربط نفس الوصي بالطالب | محاولة ربط نفس الوصي بالطالب مجدداً | `409 Conflict` (`uq_guardian_student`). |
| `TC-CST-04` | **Integration** | **تعديل رابط الوصاية:** تبديل صفة الوصي الأساسي | `PUT /api/v1/guardian-students/1` مع `is_primary: 0` | `200 OK` وتحديث السجل. |
| `TC-CST-05` | **Soft Delete** | فك وإلغاء رابط الوصاية بين ولي الأمر والطالب | `DELETE /api/v1/guardian-students/1` | `200 OK` وضبط `deleted_at` وفك الارتباط. |

---

### 2.4 اختبارات الأمان وحوكمة الصلاحيات (Security & RBAC Tests)

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المستخدم المنفذ | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-01` | **Auth** | محاولة الوصول لأي مسار بدون توكن مصادقة | زائر (Unauthenticated) | `401 Unauthorized`. |
| `TC-RBAC-01` | **RBAC** | محاولة المعلم أو الطالب إنشاء أو تعديل أو حذف طالب أو ولي أمر | `role_type = 'teacher' / 'student'` | `403 Forbidden`. |
| `TC-RBAC-02` | **RBAC** | محاولة ولي الأمر استعراض أبناء ولي أمر آخر | `role_type = 'parent' (other parent)` | `403 Forbidden`. |
| `TC-RBAC-03` | **RBAC** | سماح لولي الأمر باستعراض قائمة أبنائه المكفولين فقط | `role_type = 'parent' (own children)` | `200 OK`. |
| `TC-AUDIT-01` | **Audit** | التحقق من تسجيل وتتبع كافة العمليات في `audit_logs` | مدير النظام (`admin`) | تسجيل السجل الحركي متضمناً `old_values` و `new_values`. |

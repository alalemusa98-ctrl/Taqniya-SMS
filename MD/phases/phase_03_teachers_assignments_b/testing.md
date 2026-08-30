# 🧪 مصفوفة الاختبارات والتحقق — المرحلة 03-B (Testing Specification)

> **الهدف:** توثيق مصفوفة الاختبارات الشاملة (Unit, Integration, Security, Business Invariants) للمرحلة الفرعية 03-B لضمان جودة الأكواد ومطابقتها التامة لـ [`routes.md`](./routes.md)، [`backend.md`](./backend.md)، و [`MD/database.md`](../../database.md).

---

## 1. استراتيجية الاختبارات العامة (Testing Strategy)

- **نمط الاختبار:** اختبارات تكاملية للـ API واختبارات منطق الأعمال للخدمات والمعاملات والقيود المرجعية.
- **التغطية المطلوبة:** 100% لكافة مسارات الـ API الـ 6، وقواعد التحقق، وحالات الحدود (Boundary Cases)، والنزاهة المرجعية.
- **البيئة المعتمدة:** بيئة اختبار معزولة (Test Database) يتم تصفيرها وإعادة ضبطها تلقائياً قبل كل جولة اختبار.

---

## 2. مصفوفة الاختبارات التفصيلية (Comprehensive Test Matrix)

---

### 2.1 اختبارات جدول إسناد التدريس الأكاديمي (`teaching_assignments`) — [الخطوة 1]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-ASN-01` | **Integration** | استرجاع جدول إسناد التدريس المجمع بالصفوف والشعب | `GET /api/v1/teaching-assignments?academic_year_id=1` | `200 OK` بهيكل هرمي يضم الصفوف والشعب والمواد ومعلميها. |
| `TC-ASN-02` | **Integration** | البحث النصي باسم المعلم أو المادة أو الشعبة | `GET /api/v1/teaching-assignments?search=رياضيات` | `200 OK` ومطابقة السجلات المطلوبة. |
| `TC-ASN-03` | **Integration** | استرجاع تفاصيل سجل إسناد محدد | `GET /api/v1/teaching-assignments/101` | `200 OK` وتفاصيل المادة والشعبة والمعلم. |
| `TC-ASN-04` | **Integration** | استرجاع النصاب التدريسي لمعلم محدد | `GET /api/v1/teachers/1/assignments` | `200 OK` وقائمة المواد والشعب المكلف بها. |
| `TC-ASN-05` | **Integration** | استرجاع كشف توزيع معلمي ومناهج صف دراسي محدد | `GET /api/v1/classes/5/assignments` | `200 OK` ومصفوفة شُعب الصف وموادها ومعلميها. |
| `TC-ASN-06` | **Unit / Validation** | **إسناد تدريس مادة لمعلم بنجاح:** إنشاء تكليف جديد بشعبة شاغرة | `year: 1, section: 5, subject: 1, teacher: 1` | `201 Created` وحفظ السجل بجدول `teaching_assignments`. |
| `TC-ASN-07` | **Conflict / Invariant** | **قيد المعلم المسؤول الوحيد (uq_teaching_assignment):** منع إسناد مادة مسندة مسبقاً بنفس الشعبة والعام | محاولة إسناد نفس المادة لنفس الشعبة والعام لمعلم آخر | `409 Conflict` (`uq_teaching_assignment`). |
| `TC-ASN-08` | **Validation** | رفض إسناد لمعلم غير نشط أو معرف شعبة غير موجود | `teacher_id: 99999` | `422 Unprocessable Entity`. |
| `TC-ASN-09` | **Integration** | **تعديل إسناد التدريس بنجاح:** تغيير المعلم المكلف بتدريس المادة | `PUT /api/v1/teaching-assignments/101` مع `teacher_id: 3` | `200 OK` وتحديث المعلم المكلف. |
| `TC-ASN-10` | **Conflict** | منع تعديل ونقل الإسناد إلى شعبة ومادة مسندة مسبقاً لمعلم آخر | `PUT` بشعبة ومادة غير شاغرة | `409 Conflict`. |
| `TC-ASN-11` | **Relational Integrity** | **منع فك إسناد مرتبط بحصص أو درجات (RESTRICT):** محاولة حذف إسناد له حصص أو درجات | `DELETE /api/v1/teaching-assignments/101` (مرتبط بحصص) | `409 Conflict` ورفض الحذف. |
| `TC-ASN-12` | **Soft Delete** | فك إسناد تدريس حر غير مرتبط بحصص أو درجات | `DELETE /api/v1/teaching-assignments/102` (إسناد حر) | `200 OK` وضبط `deleted_at` وتحديث السجل. |

---

### 2.2 اختبارات الأمان وحوكمة الصلاحيات (Security & RBAC Tests)

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المستخدم المنفذ | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-01` | **Auth** | محاولة الوصول لأي مسار بدون توكن مصادقة | زائر (Unauthenticated) | `401 Unauthorized`. |
| `TC-AUTH-02` | **Auth** | محاولة الوصول بتوكن تالف أو منتهي الصلاحية | توكن غير صالح | `401 Unauthorized`. |
| `TC-RBAC-01` | **RBAC** | محاولة المعلم إنشاء أو تعديل أو فك إسناد تدريس | `role_type = 'teacher'` | `403 Forbidden`. |
| `TC-RBAC-02` | **RBAC** | محاولة المعلم استعراض النصاب التدريسي لمعلم آخر | `role_type = 'teacher'` (معلم آخر) | `403 Forbidden`. |
| `TC-RBAC-03` | **RBAC** | سماح للمعلم باستعراض نصابه التدريسي الخاص به فقط | `role_type = 'teacher' (own workload)` | `200 OK`. |
| `TC-RBAC-04` | **RBAC** | محاولة إجراء أي عمليات بواسطة طالب أو ولي أمر | `role_type = 'student' / 'parent'` | `403 Forbidden`. |
| `TC-AUDIT-01` | **Audit** | التحقق من تتبع وتسجيل كافة عمليات الإسناد والتعديل والفك في `audit_logs` | مدير النظام (`admin`) | تسجيل السجل الحركي متضمناً `old_values` و `new_values`. |

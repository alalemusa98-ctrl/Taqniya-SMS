# 🧪 مصفوفة الاختبارات والتحقق — المرحلة 04-B (Testing Specification)

> **الهدف:** توثيق مصفوفة الاختبارات الشاملة (Unit, Integration, Security, Relational Integrity) للمرحلة الفرعية 04-B لضمان جودة الأكواد ومطابقتها التامة لـ [`routes.md`](./routes.md)، [`backend.md`](./backend.md)، و [`MD/database.md`](../../database.md).

---

## 1. استراتيجية الاختبارات العامة (Testing Strategy)

- **نمط الاختبار:** اختبارات تكاملية للـ API واختبارات قيود قاعدة البيانات (Database Constraints & Relational Integrity).
- **التغطية المطلوبة:** 100% لكافة مسارات الـ API الـ 5، وقواعد التحقق، وحالات التضارب السنوي والمنع (409 Conflict).
- **البيئة المعتمدة:** بيئة اختبار معزولة (Test Database) يتم تصفيرها وإعادة ضبطها تلقائياً قبل كل جولة اختبار.

---

## 2. مصفوفة الاختبارات التفصيلية (Comprehensive Test Matrix)

---

### 2.1 اختبارات تسكين الطلاب بالفصول والشعب (`student_enrollments`) — [الخطوة 1]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-ENR-01` | **Integration** | استرجاع كشف تسكين الطلاب المجمع بالصفوف والشعب | `GET /api/v1/student-enrollments?academic_year_id=1` | `200 OK` بهيكل هرمي يضم الصفوف والشعب والطلاب المسكنين. |
| `TC-ENR-02` | **Integration** | تصفية كشف التسكين لصف دراسي محدد | `GET /api/v1/student-enrollments?class_id=5` | `200 OK` بهيكل الصف الخامس وشعبه وطلابه فقط. |
| `TC-ENR-03` | **Integration** | البحث النصي باسم الطالب أو كوده الموحد أو رقم الجلوس | `GET /api/v1/student-enrollments?search=STU-3001` | `200 OK` ومطابقة السجل المطلوب. |
| `TC-ENR-04` | **Integration** | استرجاع السجل التسكيني التاريخي لطالب محدد عبر الأعوام | `GET /api/v1/students/1/enrollments` | `200 OK` وقائمة تدرج الطالب الأكاديمي. |
| `TC-ENR-05` | **Unit / Validation** | **تسكين طالب بنجاح:** إنشاء تسكين فردي لطالب غير مسكن بالعام | `year: 1, student: 3, section: 5, seating: 'SEAT-5003'` | `201 Created` واشتقاق `grade_level` وحفظ السجل. |
| `TC-ENR-06` | **Conflict / Invariant** | **قيد التسكين السنوي الفريد (uq_student_year_enrollment):** منع تكرار تسكين الطالب بالعام | محاولة تسكين طالب مسكن مسبقاً بنفس العام الدراسي | `409 Conflict` (`uq_student_year_enrollment`). |
| `TC-ENR-07` | **Validation** | رفض تسكين طالب غير موجود أو شعبة غير تابعة للصف | `student_id: 99999` | `422 Unprocessable Entity`. |
| `TC-ENR-08` | **Integration** | **تعديل ونقل تسكين الطالب بنجاح:** نقل الطالب لشعبة أخرى بنفس الصف أو تعديل رقم الجلوس | `PUT /api/v1/student-enrollments/3` مع `class_section_id: 6` | `200 OK` وتحديث الشعبة ورقم الجلوس. |
| `TC-ENR-09` | **Integration** | **التسكين الجماعي للطلاب بنجاح:** تسكين دفعة طلاب في شعبة دفعة واحدة | `POST /api/v1/student-enrollments/bulk-enroll` مع `student_ids: [4, 5, 6]` | `200 OK` وتسكين الطلاب بالمعاملة الذرية. |
| `TC-ENR-10` | **Conflict** | منع التسكين الجماعي إذا كان أحد الطلاب مسكناً مسبقاً بالعام | `bulk-enroll` بطالب مسكن مسبقاً | `409 Conflict` وتراجع المعاملة بالكامل. |
| `TC-ENR-11` | **Relational Integrity** | **منع إلغاء تسكين مرتبط بدرجات أو امتحانات (RESTRICT):** محاولة حذف تسكين لطالب له درجات | `DELETE /api/v1/student-enrollments/1` (مرتبط بدرجات) | `409 Conflict` ورفض الحذف. |
| `TC-ENR-12` | **Soft Delete** | إلغاء تسكين طالب حر غير مرتبط بدرجات أو امتحانات | `DELETE /api/v1/student-enrollments/2` (تسكين حر) | `200 OK` وضبط `deleted_at` وتفريغ المقعد. |

---

### 2.2 اختبارات الأمان وحوكمة الصلاحيات (Security & RBAC Tests)

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المستخدم المنفذ | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-01` | **Auth** | محاولة الوصول لأي مسار بدون توكن مصادقة | زائر (Unauthenticated) | `401 Unauthorized`. |
| `TC-AUTH-02` | **Auth** | محاولة الوصول بتوكن تالف أو منتهي الصلاحية | توكن غير صالح | `401 Unauthorized`. |
| `TC-RBAC-01` | **RBAC** | محاولة المعلم أو الطالب تسكين أو تعديل أو إلغاء تسكين | `role_type = 'teacher' / 'student'` | `403 Forbidden`. |
| `TC-RBAC-02` | **RBAC** | محاولة الطالب الاطلاع على السجل التسكيني لطالب آخر | `role_type = 'student' (other student)` | `403 Forbidden`. |
| `TC-RBAC-03` | **RBAC** | سماح للطالب وولي أمره باستعراض سجله التسكيني الخاص فقط | `role_type = 'student' (own history)` | `200 OK`. |
| `TC-AUDIT-01` | **Audit** | التحقق من تتبع وتسجيل كافة عمليات التسكين والنقل والإلغاء في `audit_logs` | مدير النظام (`admin`) | تسجيل السجل الحركي متضمناً `old_values` و `new_values`. |

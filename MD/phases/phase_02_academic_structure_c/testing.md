# 🧪 مصفوفة الاختبارات والتحقق — المرحلة 02-C (Testing Specification)

> **الهدف:** توثيق مصفوفة الاختبارات الشاملة (Unit, Integration, Security, Business Invariants) للمرحلة الفرعية 02-C لضمان جودة الأكواد ومطابقتها التامة لـ [`routes.md`](./routes.md)، [`backend.md`](./backend.md)، و [`MD/database.md`](../../database.md).

---

## 1. استراتيجية الاختبارات العامة (Testing Strategy)

- **نمط الاختبار:** اختبارات تكاملية للـ API واختبارات منطق الأعمال للخدمات والقيود المركبة والمعاملات الذرية.
- **التغطية المطلوبة:** 100% لكافة مسارات الـ API الـ 11، وقواعد التحقق، وحالات الحدود (Boundary Cases)، والنزاهة المرجعية.
- **البيئة المعتمدة:** بيئة اختبار معزولة (Test Database) يتم تصفيرها وإعادة ضبطها تلقائياً قبل كل جولة اختبار.

---

## 2. مصفوفة الاختبارات التفصيلية (Comprehensive Test Matrix)

---

### 2.1 اختبارات فترات وتقويم الصفوف (`class_academic_terms`) — [الخطوة 1]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-CAT-01` | **Integration** | استرجاع فترات وتقويم صف محدد بالعام | `GET /api/v1/academic/years/1/classes/9/terms` | `200 OK` مع قائمة الفترات والتواريخ. |
| `TC-CAT-02` | **Unit / Validation** | تخصيص فترة وتواريخ لصف بنجاح | `year: 1, class: 9, term: 1, start: '2025-09-01', end: '2025-12-31'` | `201 Created`، وحفظ السجل. |
| `TC-CAT-03` | **Conflict** | **منع تكرار تخصيص الفترة لنفس الصف بالعام:** محاولة تخصيص نفس الفترة مجدداً | `year: 1, class: 9, term: 1` (مخصص مسبقاً) | `409 Conflict` (`uq_class_term_year`). |
| `TC-CAT-04` | **Validation** | رفض تواريخ غير منطقية (`end_date <= start_date`) | `start: '2025-12-31', end: '2025-09-01'` | `422 Unprocessable Entity`. |
| `TC-CAT-05` | **Validation** | رفض تواريخ تقع خارج النطاق الزمني للعام الدراسي المستهدف | تواريخ خارج حدود العام | `422 Unprocessable Entity`. |
| `TC-CAT-06` | **Atomic / Concurrency** | **تفعيل الفترة النشطة للصف (Atomic):** تفعيل فترة يلغي تفعيل باقي فترات نفس الصف | `POST /activate` لفترة الصف | `200 OK` مع ضبط `is_active = 1` وإلغاء تفعيل البقية. |
| `TC-CAT-07` | **Integration** | إغلاق درجات الفترة للصف للأرشفة | `POST /close` لفترة مفتوحة | `200 OK` مع ضبط `is_closed = 1`. |

---

### 2.2 اختبارات تسكين الشُعب بالصفوف (`class_sections`) — [الخطوة 2]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-CSE-01` | **Integration** | استرجاع قائمة الشعب المفتوحة لصف معين | `GET /api/v1/academic/classes/5/sections` | `200 OK` مع قائمة شعب الصف. |
| `TC-CSE-02` | **Unit / Validation** | تسكين وفتح شعبة لصف دراسي | `class_id: 5, section_id: 1` | `201 Created` وحفظ السجل. |
| `TC-CSE-03` | **Conflict** | منع تكرار فتح نفس الشعبة لنفس الصف | `class_id: 5, section_id: 1` (مفتوحة مسبقاً) | `409 Conflict` (`uq_class_sections`). |
| `TC-CSE-04` | **Validation** | محاولة تسكين شعبة غير موجودة | `section_id: 99999` | `422 Unprocessable Entity`. |
| `TC-CSE-05` | **Relational Integrity** | **منع فك ربط شعبة بها طلاب (RESTRICT):** محاولة فك ربط شعبة مسجل بها طلاب | `DELETE` لشعبة بها سجلات بـ `student_enrollments` | `409 Conflict` ورفض فك الربط. |
| `TC-CSE-06` | **Soft Delete** | فك ربط شعبة خالية من الطلاب | `DELETE /api/v1/academic/class-sections/:id` | `200 OK` وضبط `deleted_at`. |

---

### 2.3 اختبارات مناهج ودرجات الصفوف بالفترة (`class_subjects`) — [الخطوة 3]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-CSU-01` | **Integration** | استرجاع منهج ومقررات الصف مقسماً بحسب الفصول | `GET /api/v1/academic/classes/9/subjects` | `200 OK` بهيكل هرمي يضم الفصول والمواد والدرجات. |
| `TC-CSU-02` | **Unit / Validation** | إسناد مادة لصف وتحديد درجات الفترة | `term: 10, subject: 1, pass: 50.00, max: 100.00` | `201 Created` وحفظ السجل. |
| `TC-CSU-03` | **Conflict** | منع تكرار إسناد نفس المادة لنفس الفترة بالصف | `term: 10, subject: 1` (مسندة مسبقاً) | `409 Conflict` (`uq_class_term_subject`). |
| `TC-CSU-04` | **Validation** | **قيد النزاهة:** رفض درجة نجاح أكبر من الدرجة العظمى | `passing_score: 110.00, max_score: 100.00` | `422 Unprocessable Entity`. |
| `TC-CSU-05` | **Integration** | تعديل درجات مادة مسندة بفترة مفتوحة | `PUT` مع درجات جديدة صالحة | `200 OK` وتحديث السجل. |
| `TC-CSU-06` | **Conflict / Lock** | **قفل الفترات المغلقة:** محاولة تعديل درجات مادة بفترة مغلقة للأرشفة | `PUT` لفترة تحمل `is_closed = 1` | `409 Conflict` ورفض التعديل. |
| `TC-CSU-07` | **Relational Integrity** | **منع إزالة مادة رصدت درجاتها (RESTRICT):** محاولة إزالة مادة لها درجات أو حصص | `DELETE` لمادة لها درجات مسجلة | `409 Conflict` ورفض الحذف. |
| `TC-CSU-08` | **Soft Delete** | إزالة مادة حرة من منهج الفترة | `DELETE /api/v1/academic/classes/9/subjects/:id` | `200 OK` وضبط `deleted_at`. |

---

### 2.4 اختبارات الأمان وحوكمة الصلاحيات (Security & RBAC Tests)

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المستخدم المنفذ | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-01` | **Auth** | محاولة الوصول لأي مسار بدون توكن مصادقة | زائر (Unauthenticated) | `401 Unauthorized`. |
| `TC-AUTH-02` | **Auth** | محاولة الوصول بتوكن تالف أو منتهي | توكن غير صالح | `401 Unauthorized`. |
| `TC-RBAC-01` | **RBAC** | محاولة تخصيص فترات أو شُعب أو مناهج بواسطة معلم | `role_type = 'teacher'` | `403 Forbidden`. |
| `TC-RBAC-02` | **RBAC** | محاولة إجراء تعديلات بواسطة طالب أو ولي أمر | `role_type = 'student' / 'parent'` | `403 Forbidden`. |
| `TC-AUDIT-01` | **Audit** | التحقق من تتبع وتسجيل كافة العمليات في `audit_logs` | مدير النظام (`admin`) | تسجيل السجل الحركي متضمناً `old_values` و `new_values`. |

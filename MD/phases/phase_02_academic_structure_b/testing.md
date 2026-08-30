# 🧪 مصفوفة الاختبارات والتحقق — المرحلة 02-B (Testing Specification)

> **الهدف:** توثيق مصفوفة الاختبارات الشاملة (Unit, Integration, Security, Business Invariants) للمرحلة الفرعية 02-B لضمان جودة الأكواد ومطابقتها التامة لـ [`routes.md`](./routes.md)، [`backend.md`](./backend.md)، و [`MD/database.md`](../../database.md).

---

## 1. استراتيجية الاختبارات العامة (Testing Strategy)

- **نمط الاختبار:** اختبارات تكاملية للـ API واختبارات منطق الأعمال للخدمات والقيود المركبة.
- **التغطية المطلوبة:** 100% لكافة مسارات الـ API الـ 12، وقواعد التحقق، وحالات الحدود (Boundary Cases)، والنزاهة المرجعية.
- **البيئة المعتمدة:** بيئة اختبار معزولة (Test Database) يتم تصفيرها وإعادة ضبطها تلقائياً قبل كل جولة اختبار.

---

## 2. مصفوفة الاختبارات التفصيلية (Comprehensive Test Matrix)

---

### 2.1 اختبارات الصفوف الدراسية (`classes`) — [الخطوة 1]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-CLS-01` | **Integration** | استرجاع قائمة الصفوف الدراسية مع الترقيم والفلترة بالمرحلة | `GET /api/v1/academic/classes?stage_id=1&page=1` | `200 OK` مع قائمة متضمنة `stage_name`. |
| `TC-CLS-02` | **Unit / Validation** | إنشاء صف دراسي بنجاح وتسكينه بمرحلة | `stage_id: 1`, `name: 'الصف الخامس'`, `grade_level: 5` | `201 Created`، وحفظ السجل. |
| `TC-CLS-03` | **Conflict** | **منع تكرار المستوى الرقمي بالمرحلة (`uq_classes_stage_level`):** إنشاء صف بنفس المرحلة ومستوى رقمي موجود | `stage_id: 1`, `grade_level: 5` (موجود مسبقاً) | `409 Conflict` مع رسالة تعارض المستوى الرقمي. |
| `TC-CLS-04` | **Validation** | رفض مستوى رقمي خارج النطاق (أقل من 1 أو أكثر من 12) | `grade_level: 0` أو `15` | `422 Unprocessable Entity`. |
| `TC-CLS-05` | **Validation** | محاولة إنشاء صف بربطه بمرحلة غير موجودة | `stage_id: 99999` | `422 Unprocessable Entity`. |
| `TC-CLS-06` | **Integration** | تعديل مسمى أو مستوى صف دراسي قائم | `PUT /api/v1/academic/classes/:id` | `200 OK` مع تحديث السجل. |
| `TC-CLS-07` | **Not Found** | محاولة تعديل صف غير موجود | `PUT /api/v1/academic/classes/99999` | `404 Not Found`. |
| `TC-CLS-08` | **Relational Integrity** | **منع حذف صف مرتبط (RESTRICT):** محاولة حذف صف يحتوي على فترات أو شعب مفتوحة أو مقررات | `DELETE` لصف مستخدم بـ `class_sections` أو `class_subjects` | `409 Conflict` مع رسالة منع الحذف المرجعي. |
| `TC-CLS-09` | **Soft Delete** | حذف صف دراسي غير مرتبط | `DELETE /api/v1/academic/classes/:id` لصف حر | `200 OK`، وضبط `deleted_at`. |

---

### 2.2 اختبارات بنك الشعب العامة (`sections`) — [الخطوة 2]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-SEC-01` | **Integration** | استرجاع بنك الشعب العامة مع الترقيم والبحث | `GET /api/v1/academic/sections?search=أ` | `200 OK` مع قائمة الشعب. |
| `TC-SEC-02` | **Unit / Validation** | إضافة شعبة عامة جديدة بنجاح | `name: 'شعبة د'` | `201 Created`، وحفظ السجل. |
| `TC-SEC-03` | **Conflict** | منع تكرار مسمى الشعبة العامة | `name: 'شعبة أ'` (موجود مسبقاً) | `409 Conflict` (`uq_sections_name`). |
| `TC-SEC-04` | **Validation** | رفض مسمى شعبة فارغ | `name: ''` | `422 Unprocessable Entity`. |
| `TC-SEC-05` | **Integration** | تعديل مسمى شعبة عامة قائمة | `PUT /api/v1/academic/sections/:id` | `200 OK` وتحديث السجل. |
| `TC-SEC-06` | **Relational Integrity** | **منع حذف شعبة عامة مستخدمة (RESTRICT):** محاولة حذف شعبة مسندة لصفوف | `DELETE` لشعبة مسجلة بـ `class_sections` | `409 Conflict` ورفض الحذف. |
| `TC-SEC-07` | **Soft Delete** | حذف شعبة عامة غير مستخدمة | `DELETE /api/v1/academic/sections/:id` لشعبة حرة | `200 OK` وضبط `deleted_at`. |

---

### 2.3 اختبارات بنك المواد العامة (`subjects`) — [الخطوة 3]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-SUB-01` | **Integration** | استرجاع بنك المواد العامة مع البحث بالكود | `GET /api/v1/academic/subjects?code=MATH` | `200 OK` مع مصفوفة المواد. |
| `TC-SUB-02` | **Unit / Validation** | إضافة مادة جديدة مع الكود الرمزي | `name: 'الفيزياء'`, `code: 'PHYS'` | `201 Created` وحفظ السجل. |
| `TC-SUB-03` | **Conflict** | منع تكرار اسم المادة العامة | اسم مادة موجود مسبقاً | `409 Conflict` (`uq_subjects_name`). |
| `TC-SUB-04` | **Conflict** | منع تكرار الكود الرمزي للمادة | كود مادة موجود مسبقاً | `409 Conflict` (`uq_subjects_code`). |
| `TC-SUB-05` | **Integration** | تعديل بيانات مادة ببنك المواد | `PUT /api/v1/academic/subjects/:id` | `200 OK` وتحديث السجل. |
| `TC-SUB-06` | **Relational Integrity** | **منع حذف مادة عامة مسندة لمقررات (RESTRICT):** محاولة حذف مادة مستخدمة بصفوف | `DELETE` لمادة مسجلة بـ `class_subjects` | `409 Conflict` ورفض الحذف. |
| `TC-SUB-07` | **Soft Delete** | حذف مادة عامة غير مسندة | `DELETE /api/v1/academic/subjects/:id` لمادة حرة | `200 OK` وضبط `deleted_at`. |

---

### 2.4 اختبارات الأمان وحوكمة الصلاحيات (Security & RBAC Tests)

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المستخدم المنفذ | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-01` | **Auth** | محاولة الوصول لأي مسار بدون توكن مصادقة | زائر (Unauthenticated) | `401 Unauthorized`. |
| `TC-AUTH-02` | **Auth** | محاولة الوصول بتوكن تالف أو منتهي | توكن غير صالح | `401 Unauthorized`. |
| `TC-RBAC-01` | **RBAC** | محاولة إنشاء/تعديل/حذف صف أو شعبة أو مادة بواسطة معلم | `role_type = 'teacher'` | `403 Forbidden`. |
| `TC-RBAC-02` | **RBAC** | محاولة إجراء تعديلات بواسطة طالب | `role_type = 'student'` | `403 Forbidden`. |
| `TC-RBAC-03` | **RBAC** | محاولة إجراء تعديلات بواسطة ولي أمر | `role_type = 'parent'` | `403 Forbidden`. |
| `TC-AUDIT-01` | **Audit** | التحقق من تتبع وتسجيل كافة العمليات في `audit_logs` | مدير النظام (`admin`) | تسجيل السجل الحركي متضمناً `old_values` و `new_values`. |

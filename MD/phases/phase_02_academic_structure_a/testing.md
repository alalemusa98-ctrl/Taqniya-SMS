# 🧪 مصفوفة الاختبارات والتحقق — المرحلة 02-A (Testing Specification)

> **الهدف:** توثيق مصفوفة الاختبارات الشاملة (Unit, Integration, Security, Business Invariants) للمرحلة الفرعية 02-A لضمان جودة الأكواد ومطابقتها التامة لـ [`routes.md`](./routes.md)، [`backend.md`](./backend.md)، و [`MD/database.md`](../../database.md).

---

## 1. استراتيجية الاختبارات العامة (Testing Strategy)

- **نمط الاختبار:** اختبارات تكاملية للـ API واختبارات منطق الأعمال للخدمات والمعاملات الذرية.
- **التغطية المطلوبة:** 100% لكافة مسارات الـ API الـ 13، وقواعد التحقق، وحالات الحدود (Boundary Cases)، والمعاملات الذرية.
- **البيئة المعتمدة:** بيئة اختبار معزولة (Test Database) يتم إعادة ضبطها ومسح بياناتها تلقائياً قبل كل جولة اختبار.

---

## 2. مصفوفة الاختبارات التفصيلية (Comprehensive Test Matrix)

---

### 2.1 اختبارات السنوات الدراسية (`academic_years`) — [الخطوة 1]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AY-01` | **Integration** | استرجاع قائمة السنوات الدراسية مع الترقيم والبحث | `GET /api/v1/academic/years?page=1&per_page=15` | `200 OK` مع قائمة مطابقة لهيكل `routes.md`. |
| `TC-AY-02` | **Unit / Validation** | إنشاء سنة دراسية بنجاح | `POST` ببيانات صالحة (`name`, `start_date`, `end_date`) | `201 Created`، إضافة السجل بـ `is_active = 0`. |
| `TC-AY-03` | **Validation** | فشل إنشاء سنة بتاريخ نهاية يسبق البداية | `start_date: 2026-09-01`, `end_date: 2026-05-01` | `422 Unprocessable Entity` مع رسالة خطأ واضحة. |
| `TC-AY-04` | **Conflict** | فشل إنشاء سنة باسم مكرر | اسم سنة موجود مسبقاً | `409 Conflict` (`uq_academic_years_name`). |
| `TC-AY-05` | **Integration** | تعديل بيانات سنة دراسية قائمة | `PUT /api/v1/academic/years/:id` ببيانات محدثة | `200 OK` مع عكس التحديث بالبيانات. |
| `TC-AY-06` | **Not Found** | محاولة تعديل سنة غير موجودة | `PUT /api/v1/academic/years/99999` | `404 Not Found`. |
| `TC-AY-07` | **Business Invariant** | **تفعيل العام الدراسي الذري (Single Active Year):** تفعيل عام جديد وإلغاء تفعيل الأعوام السابقة | `POST /api/v1/academic/years/:id/activate` | `200 OK`، العام المستهدف `is_active = 1`، وجميع الأعوام الأخرى `is_active = 0`. |
| `TC-AY-08` | **Transaction Rollback** | التراجع عن التفعيل في حال حدوث خطأ أثناء المعاملة | محاكاة فشل في قاعدة البيانات أثناء التفعيل | التراجع الكامل دون تغيير حالة أي عام دراسي. |
| `TC-AY-09` | **Soft Delete** | حذف سنة دراسية غير مرتبطة | `DELETE /api/v1/academic/years/:id` | `200 OK`، ضبط `deleted_at` واستثناؤها من القوائم. |
| `TC-AY-10` | **Relational Integrity** | **منع حذف سنة مرتبطة (RESTRICT):** محاولة حذف سنة تحتوي على فترات صفوف أو طلاب | `DELETE` لسنة مستخدمة في `class_academic_terms` | `409 Conflict` مع رسالة منع الحذف المرجعي. |

---

### 2.2 اختبارات كتالوج الفترات المرجعي (`academic_terms`) — [الخطوة 2]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AT-01` | **Integration** | استرجاع كتالوج الفترات العام | `GET /api/v1/academic/terms` | `200 OK` مع مصفوفة الفترات المرتبة. |
| `TC-AT-02` | **Unit / Validation** | إضافة فترة جديدة للكتالوج | `name: 'الفصل الصيفي'`, `term_number: 4` | `201 Created` مع حفظ السجل. |
| `TC-AT-03` | **Conflict** | منع تكرار اسم الفترة بالكتالوج | اسم فترة مسجل مسبقاً | `409 Conflict` (`uq_terms_name`). |
| `TC-AT-04` | **Conflict** | منع تكرار رقم ترتيب الفصل | `term_number` مسجل مسبقاً | `409 Conflict` (`uq_terms_number`). |
| `TC-AT-05` | **Validation** | رفض رقم ترتيب غير موجب | `term_number: 0` أو قيمة سالبة | `422 Unprocessable Entity`. |
| `TC-AT-06` | **Integration** | تعديل مسمى وترتيب فترة قائمة | `PUT /api/v1/academic/terms/:id` | `200 OK` مع تحديث السجل. |
| `TC-AT-07` | **Relational Integrity** | **منع حذف فترة مستخدمة (RESTRICT):** محاولة حذف فترة مرتبطة بتخصيصات صفوف | `DELETE` لفترة مستخدمة بجدول فترات الصفوف | `409 Conflict` ورفض الحذف. |
| `TC-AT-08` | **Soft Delete** | حذف فترة غير مستخدمة من الكتالوج | `DELETE /api/v1/academic/terms/:id` لفترة حرة | `200 OK` وضبط `deleted_at`. |

---

### 2.3 اختبارات المراحل التعليمية (`academic_stages`) — [الخطوة 3]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AS-01` | **Integration** | استرجاع قائمة المراحل التعليمية مرتبة | `GET /api/v1/academic/stages` | `200 OK` مرتبة تصاعدياً بـ `order_index ASC`. |
| `TC-AS-02` | **Unit / Validation** | إضافة مرحلة تعليمية جديدة | `name: 'المرحلة الثانوية'`, `order_index: 3` | `201 Created` وحفظ السجل. |
| `TC-AS-03` | **Conflict** | منع تكرار اسم المرحلة التعليمية | اسم مرحلة موجود مسبقاً | `409 Conflict` (`uq_stages_name`). |
| `TC-AS-04` | **Integration** | تعديل بيانات مرحلة تعليمية قائمة | `PUT /api/v1/academic/stages/:id` | `200 OK` وتحديث السجل. |
| `TC-AS-05` | **Relational Integrity** | **منع حذف مرحلة تحتوي على صفوف (RESTRICT):** محاولة حذف مرحلة مرتبطة بجدول `classes` | `DELETE` لمرحلة مرتبطة بصفوف | `409 Conflict` ورفض الحذف. |
| `TC-AS-06` | **Soft Delete** | حذف مرحلة تعليمية فارغة | `DELETE /api/v1/academic/stages/:id` لمرحلة حرة | `200 OK` وضبط `deleted_at`. |

---

### 2.4 اختبارات الأمان وحوكمة الصلاحيات (Security & RBAC Tests)

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المستخدم المنفذ | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-SEC-01` | **Auth** | محاولة الوصول لأي مسار بدون توكن مصادقة | زائر (Unauthenticated) | `401 Unauthorized`. |
| `TC-SEC-02` | **Auth** | محاولة الوصول بتوكن منتهي الصلاحية أو غير صالح | توكن تالف أو منتهي | `401 Unauthorized`. |
| `TC-SEC-03` | **RBAC** | محاولة إنشاء/تعديل/حذف من قِبل معلم | `role_type = 'teacher'` | `403 Forbidden`. |
| `TC-SEC-04` | **RBAC** | محاولة إنشاء/تعديل/حذف من قِبل طالب | `role_type = 'student'` | `403 Forbidden`. |
| `TC-SEC-05` | **RBAC** | محاولة إنشاء/تعديل/حذف من قِبل ولي أمر | `role_type = 'parent'` | `403 Forbidden`. |
| `TC-SEC-06` | **Audit** | التحقق من تسجيل العمليات في `audit_logs` | مدير النظام (`admin`) | تسجيل السجل الحركي متضمناً `old_values` و `new_values`. |

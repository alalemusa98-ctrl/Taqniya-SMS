# 🧪 مصفوفة الاختبارات والتحقق — المرحلة 05-A (Testing Specification)

> **الهدف:** توثيق مصفوفة الاختبارات الشاملة (Unit, Integration, Security, Relational Integrity) للمرحلة الفرعية 05-A لضمان جودة الأكواد ومطابقتها التامة لـ [`routes.md`](./routes.md)، [`backend.md`](./backend.md)، و [`MD/database.md`](../../database.md).

---

## 1. استراتيجية الاختبارات العامة (Testing Strategy)

- **نمط الاختبار:** اختبارات تكاملية للـ API، اختبارات التحقق من الترتيب الزمني، واختبارات قيود قاعدة البيانات (Database Constraints & Relational Integrity).
- **التغطية المطلوبة:** 100% لكافة مسارات الـ API الـ 4، وقواعد التحقق، وحالات التعارض والمنع (409 Conflict).
- **البيئة المعتمدة:** بيئة اختبار معزولة (Test Database) يتم تصفيرها وإعادة ضبطها تلقائياً قبل كل جولة اختبار.

---

## 2. مصفوفة الاختبارات التفصيلية (Comprehensive Test Matrix)

---

### 2.1 اختبارات فترات الحصص اليومية (`period_slots`) — [الخطوة 1]

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-SLOT-01` | **Integration** | استرجاع قائمة فترات الحصص مع الفرز بحسب `slot_number` | `GET /api/v1/period-slots?sort_by=slot_number&sort_order=asc` | `200 OK` مع قائمة الفترات مرتبة تصاعدياً. |
| `TC-SLOT-02` | **Integration** | تصفية فترات الاستراحة/الفسح فقط | `GET /api/v1/period-slots?is_break=1` | `200 OK` وجلب فترات الفسحة فقط. |
| `TC-SLOT-03` | **Integration** | استرجاع تفاصيل فترة حصة محددة بالمعرف | `GET /api/v1/period-slots/1` | `200 OK` وتفاصيل الحصة والتوقيتات. |
| `TC-SLOT-04` | **Unit / Validation** | **إنشاء فترة حصة بنجاح:** إضافة فترة حصة جديدة بتوقيت صالح | `name: 'الحصة السادسة', slot_number: 6, start_time: '12:00:00', end_time: '12:45:00'` | `201 Created` وحفظ السجل بجدول `period_slots`. |
| `TC-SLOT-05` | **Validation / Invariant** | **قيد الترتيب الزمني المنطقي:** رفض فترة حصة بوقت نهاية أسبق من البداية | `start_time: '10:00:00', end_time: '09:00:00'` | `422 Unprocessable Entity`. |
| `TC-SLOT-06` | **Conflict / Invariant** | **قيد تفرد الرقم التسلسلي (uq_period_slots_number):** منع تكرار `slot_number` | محاولة إنشاء حصة برقم تسلسلي مسجل مسبقاً | `409 Conflict` (`uq_period_slots_number`). |
| `TC-SLOT-07` | **Integration** | **تعديل فترة الحصة بنجاح:** تحديث المسمى والتوقيت | `PUT /api/v1/period-slots/6` | `200 OK` وتحديث السجل. |
| `TC-SLOT-08` | **Relational Integrity** | **منع حذف فترة حصة مستخدمة بالجدول الأسبوعي (RESTRICT):** محاولة حذف حصة مرتبطة | `DELETE /api/v1/period-slots/1` (مرتبطة بـ timetable_slots) | `409 Conflict` ورفض الحذف. |
| `TC-SLOT-09` | **Soft Delete** | حذف فترة حصة حرة غير مستخدمة في أي جدول | `DELETE /api/v1/period-slots/9` (فترة حرة) | `200 OK` وضبط `deleted_at`. |

---

### 2.2 اختبارات الأمان وحوكمة الصلاحيات (Security & RBAC Tests)

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المستخدم المنفذ | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-01` | **Auth** | محاولة الوصول لأي مسار بدون توكن مصادقة | زائر (Unauthenticated) | `401 Unauthorized`. |
| `TC-RBAC-01` | **RBAC** | محاولة المعلم أو الطالب أو ولي الأمر إنشاء أو تعديل أو حذف فترة حصة | `role_type = 'teacher' / 'student' / 'parent'` | `403 Forbidden`. |
| `TC-RBAC-02` | **RBAC** | سماح لكافة المستخدمين المصادق عليهم باستعراض فترات الحصص | أي مستخدم مسجل | `200 OK`. |
| `TC-AUDIT-01` | **Audit** | التحقق من تتبع وتسجيل عمليات إضافة وتعديل وحذف الفترات في `audit_logs` | مدير النظام (`admin`) | تسجيل السجل الحركي متضمناً `old_values` و `new_values`. |

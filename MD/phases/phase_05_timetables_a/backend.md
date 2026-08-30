# ⚙️ مواصفات Backend — المرحلة 05-A (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجدول فترات وتوقيتات الحصص والفسح اليومية (`period_slots`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## ⏰ الخطوة 1: إدارة سجل فترات وتوقيتات الحصص اليومية (`period_slots`) — [5 مسارات]

> **الوصف المختصر:** إعداد توقيتات وساعات الحصص الدراسية وفترات الاستراحة باليوم المدرسي وتحديد ترتيبها الزمني.

### 1.1 جدول العمليات والروابط للخلفية (`period_slots`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض وتصفية فترات الحصص** | `PeriodSlotService::listPeriodSlots` | `GET /api/v1/period-slots` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1period-slots--عرض-وتصفية-فترات-الحصص-والفسح-اليومية) |
| **عرض تفاصيل فترة حصة** | `PeriodSlotService::getPeriodSlot` | `GET /api/v1/period-slots/:id` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1period-slotsid--عرض-تفاصيل-فترة-حصة-محدد) |
| **إضافة فترة حصة مدرسية** | `PeriodSlotService::createPeriodSlot` | `POST /api/v1/period-slots` | `201 Created` | [في `routes.md`](./routes.md#13-post-apiv1period-slots--إضافة-فترة-حصة-مدرسية-جديدة) |
| **تعديل توقيت ومسمى الحصة** | `PeriodSlotService::updatePeriodSlot` | `PUT /api/v1/period-slots/:id` | `200 OK` | [في `routes.md`](./routes.md#14-put-apiv1period-slotsid--تعديل-توقيت-أو-مسمى-فترة-الحصة) |
| **حذف فترة حصة غير مسندة** | `PeriodSlotService::deletePeriodSlot` | `DELETE /api/v1/period-slots/:id` | `200 OK` | [في `routes.md`](./routes.md#15-delete-apiv1period-slotsid--حذف-فترة-حصة-غير-مسندة) |

---

### 1.2 قواعد التحقق (`PeriodSlotRequest`):
- `name`: مطلوب، نصي، أقصى طول 50 حرفاً (مثل: `الحصة الأولى`).
- `slot_number`: مطلوب، رقم صحيح موجب فريد `uq_period_slots_number` (مثل: `1`).
- `start_time`: مطلوب، توقيت بصيغة `HH:MM:SS` (مثل: `08:00:00`).
- `end_time`: مطلوب، توقيت بصيغة `HH:MM:SS` ويجب أن يكون منطقياً أسبق من وقت النهاية (`after:start_time`).
- `is_break`: اختياري، `0` حقل حصة أو `1` فترة استراحة، الافتراضي `0`.

---

## ⚖️ 2. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 2.1 حوكمة الأدوار والصلاحيات (RBAC Governance):
- إعداد وتعديل وحذف توقيتات الحصص المدرسية مقتصر **حصراً على مدير النظام (Admin)** (`role_type = 'admin'`).

### 2.2 الحوكمة الزمنية لمنع تداخل الحصص (Strict Time Sequence Invariant):
- تفحص خدمة `PeriodSlotService` تسلسل الأوقات، حيث يمنع تكرار رقم الحصة `slot_number` بالمنظومة لضمان الترتيب التتابعي.

### 2.3 حماية الحذف المرجعي والحظر الحاسم (Strict RESTRICT Protection):
- يمنع حذف أي فترة حصة يومية تم الاعتماد عليها بجدول الحصص الأسبوعي بجدول `timetable_slots` (`ON DELETE RESTRICT`).

### 2.4 تتبع وسجلات التدقيق (Audit Logging):
- تسجل كافة عمليات إضافة فترات الحصص وتعديل توقيتاتها تلقائياً في سجلات التدقيق `audit_logs`.

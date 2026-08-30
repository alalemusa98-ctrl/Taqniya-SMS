# ✅ قائمة التحقق والجاهزية — المرحلة 02-A (Phase Readiness Checklist)

> **الهدف:** توثيق قائمة البنود الرقابية والتحققية لمطابقة المرحلة الفرعية 02-A لكافة متطلبات Taqniya AI Development Framework وضمان خلوها من أي تعارضات أو تسريب تقني قبل الاعتماد.

---

## 1. بطاقة وميثاق المرحلة (Phase Contract & Governance)

- [x] تم توثيق النطاق والمخرجات بدقة داخل `README.md`.
- [x] تم تحديد الكيانات الثلاثة المملوكة للمرحلة (`academic_years`, `academic_terms`, `academic_stages`).
- [x] تم توثيق الكيانات التي تقع صراحة خارج نطاق المرحلة (مثل `classes` في 02-B و `subjects` في 02-C).
- [x] تم توثيق خارطة ملفات المرحلة السبعة بالكامل داخل `README.md`.

---

## 2. حوكمة البيانات ومطابقة SSoT (Data & SSoT Governance)

- [x] مطابقة أسماء الجداول والأعمدة في `data.md` بنسبة 100% مع [`MD/database.md`](../../database.md).
- [x] توثيق أنواع البيانات والقيود (`PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT`) بدقة.
- [x] توثيق الفهارس بالكامل متضمنة فهارس الحذف المنطقي (`idx_academic_years_deleted_at`, `idx_academic_years_is_active`, `uq_terms_number`, `idx_stages_order_index`).
- [x] خلو `data.md` من أي صيغ أو دوال خاصة بـ ORM معين أو إطار عمل محدد.

---

## 3. عقد الشبكة ومسارات الـ API (Network & API Contract)

- [x] توثيق مسارات الـ API الـ 13 كاملة في `routes.md`.
- [x] توثيق الترويسات الإلزامية (`Authorization`, `Accept`, `Content-Type`, `Accept-Language`).
- [x] توثيق معاملات البحث والفلترة والترتيب والترقيم لجميع مسارات الـ GET.
- [x] استيفاء هياكل الطلب الكاملة (Request Body Payloads) لمسارات الإضافة والتعديل.
- [x] استيفاء هياكل الاستجابات الصريحة لجميع الـ Status Codes (`200 OK`, `201 Created`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Server Error`).
- [x] تصحيح رمز استجابة منع الحذف المرجعي (RESTRICT) ليكون `409 Conflict` بدلاً من `403 Forbidden`.
- [x] احتواء استجابات القوائم على عنصرين على الأقل لتوضيح نمط المصفوفة (`Multi-Item List Payload`).

---

## 4. منطق الأعمال والخادم (Backend Domain Logic)

- [x] توثيق قواعد التحقق لكافة المدخلات في `backend.md`.
- [x] توثيق حوكمة العام النشط الوحيد (`Single Active Year Invariant`).
- [x] توثيق تنفيذ عملية التفعيل `/activate` داخل معاملة قاعدة بيانات ذرية (Atomic Database Transaction) مع قفل التنافسية.
- [x] توثيق حظر الحذف المرجعي (RESTRICT Policy) وإرجاع `409 Conflict`.
- [x] توثيق تسجيل العمليات الحساسة في سجلات التدقيق `audit_logs` مع حفظ `old_values` و `new_values`.
- [x] إزالة أي كود أو استدعاءات خاصة بـ Laravel (`DB::transaction`, `Eloquent`, `FormRequest`, `lockForUpdate()`) وصياغتها بمفاهيم معمارية محايدة.

---

## 5. واجهات وتجارب المستخدم (Frontend & UX Specifications)

- [x] توثيق الشاشات الثلاث واللوحات الجانبية ونوافذ التأكيد في `frontend.md`.
- [x] مطابقة إجراءات الواجهة مع المسارات الـ 13 ورموز الاستجابات في `routes.md`.
- [x] توثيق حالات الشاشات الأربع (Loading, Empty, Error, Success) لكل شاشة.
- [x] الالتزام بنظام التصميم (Spatial UI) ودعم اتجاه اللغة العربية (`dir="rtl"`).
- [x] خلو مواصفات الواجهة من تسريب كود تنفيذي (مثل `ref()`, `reactive()`, Pinia code).

---

## 6. مصفوفة الاختبارات والتحقق (Testing Matrix)

- [x] توثيق مصفوفة الاختبارات الشاملة في `testing.md`.
- [x] تغطية اختبارات التحقق والحدود (Boundary Cases).
- [x] تغطية اختبارات المعاملات الذرية والتراجع (Atomic Transactions & Rollback).
- [x] تغطية اختبارات التكامل المرجعي والحذف المنطقي (RESTRICT & Soft Delete).
- [x] تغطية اختبارات الأمان والمصادقة والصلاحيات (401, 403, 409).

---

## 7. التكامل والتطابق بين الملفات (Cross-File Consistency)

- [x] تطابق تام بين `data.md` و `MD/database.md`.
- [x] تطابق تام بين `routes.md` و `backend.md` و `frontend.md`.
- [x] تطابق مصفوفة الاختبارات في `testing.md` مع مسارات `routes.md` وقواعد `backend.md`.
- [x] خلو كامل من التعارضات أو الافتراضات غير المعتمدة.

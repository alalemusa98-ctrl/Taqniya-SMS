# ✅ قائمة التحقق والجاهزية — المرحلة 02-C (Phase Readiness Checklist)

> **الهدف:** توثيق قائمة البنود الرقابية والتحققية لمطابقة المرحلة الفرعية 02-C لكافة متطلبات Taqniya AI Development Framework وضمان خلوها من أي تعارضات أو تسريب تقني قبل الاعتماد.

---

## 1. بطاقة وميثاق المرحلة (Phase Contract & Governance)

- [x] تم توثيق النطاق والمخرجات بدقة داخل `README.md`.
- [x] تم تحديد الكيانات الثلاثة المملوكة للمرحلة (`class_academic_terms`, `class_sections`, `class_subjects`).
- [x] تم توثيق الكيانات التي تقع صراحة خارج نطاق المرحلة (مثل `academic_years` في 02-A و `classes` في 02-B).
- [x] تم توثيق خارطة ملفات المرحلة السبعة بالكامل داخل `README.md`.

---

## 2. حوكمة البيانات ومطابقة SSoT (Data & SSoT Governance)

- [x] مطابقة أسماء الجداول والأعمدة في `data.md` بنسبة 100% مع [`MD/database.md`](../../database.md).
- [x] توثيق أنواع البيانات والقيود (`PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT`, `DECIMAL`) بدقة.
- [x] توثيق الفهارس بالكامل متضمنة (`uq_class_term`, `uq_class_sections`, `uq_class_term_subject`, `idx_class_terms_*`, `idx_class_sections_*`, `idx_class_subjects_*`).
- [x] خلو `data.md` من أي صيغ أو دوال خاصة بـ ORM معين أو إطار عمل محدد.

---

## 3. عقد الشبكة ومسارات الـ API (Network & API Contract)

- [x] توثيق مسارات الـ API الـ 12 كاملة في `routes.md`.
- [x] توثيق الترويسات الإلزامية (`Authorization`, `Accept`, `Content-Type`, `Accept-Language`).
- [x] توثيق معاملات البحث والفلترة والترتيب والترقيم لجميع مسارات الـ GET مع دعم `meta`.
- [x] استيفاء هياكل الطلب الكاملة (Request Body Payloads) لمسارات التخصيص والتسكين والتعديل.
- [x] استيفاء هياكل الاستجابات الصريحة لجميع الـ Status Codes (`200 OK`, `201 Created`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Server Error`).
- [x] تطبيق السياسة الموحدة للأخطاء العامة في القسم 1.1 من `routes.md`.
- [x] تصحيح رمز استجابة حظر الحذف المرجعي (RESTRICT) ليكون `409 Conflict`.
- [x] احتواء استجابات القوائم على عنصرين على الأقل لتوضيح نمط المصفوفة (`Multi-Item List Payload`).

---

## 4. منطق الأعمال والخادم (Backend Domain Logic)

- [x] توثيق قيود التناسب الإجبارية للدرجات (`max_score == max_coursework_score + max_exam_score` و `passing_score <= max_score` و `exam_passing_score <= max_exam_score` وقاعدة النجاح المزدوج).
- [x] توثيق حظر تعديل درجات المواد بالفترات المغلقة للأرشفة (`is_closed = 1`).
- [x] توثيق حظر فك الربط وإزالة المواد المرجعي (RESTRICT Policy) وإرجاع `409 Conflict`.
- [x] توثيق تسجيل العمليات الحساسة في سجلات التدقيق `audit_logs`.
- [x] إزالة أي كود أو تسميات خاصة بـ Services/Controllers وصياغتها كـ Domain Operations محايدة تقنياً.

---

## 5. واجهات وتجارب المستخدم (Frontend & UX Specifications)

- [x] توثيق الشاشات الثلاث واللوحات الجانبية ونوافذ التأكيد في `frontend.md`.
- [x] مطابقة إجراءات الواجهة مع المسارات الـ 12 ورموز الاستجابات في `routes.md`.
- [x] توثيق حالات الشاشات الأربع (Loading, Empty, Error, Success) لكل شاشة.
- [x] الالتزام بنظام التصميم (Spatial UI) ودعم اتجاه اللغة العربية (`dir="rtl"`).
- [x] خلو مواصفات الواجهة من تسريب كود تنفيذي.

---

## 6. مصفوفة الاختبارات والتحقق (Testing Matrix)

- [x] تغطية 100% لمسارات الـ 12 بالكامل في `testing.md`.
- [x] توثيق سيناريوهات قفل الفترات المغلقة للأرشفة وحظر الحذف المرجعي RESTRICT.
- [x] توثيق اختبارات تفرد القيود المركبة وتأكيد الحماية الذرية (Atomic Activation).
- [x] توثيق اختبارات الأمان، المصادقة (`401`)، ومصفوفة الصلاحيات (`403`).
- [x] توثيق اختبارات تتبع سجلات التدقيق `audit_logs`.

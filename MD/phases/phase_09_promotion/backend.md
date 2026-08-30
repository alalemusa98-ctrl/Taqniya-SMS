# ⚙️ مواصفات Backend — المرحلة 09 (Domain Logic & Architecture)

> **الهدف:** توثيق الخدمات والتحقق وقواعد البزنس الحصرية لجدولي الصحائف المؤرشفة (`student_transcripts`) ودفعات الترحيل السنوي (`promotion_batches`) المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل بإنشاء ورسم كود الـ Controllers واستجابات الخادم بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 📄 الخطوة 1: أرشفة وتصفح الصحائف المدرسية المؤرشفة (`student_transcripts`) — [4 مسارات]

> **الوصف المختصر:** تجميد الصحائف المدرسية للفصول الدراسية والصحائف السنوية النهائية وتوليد لقطات البيانات الثابتة JSON لحفظ السجل التاريخي للطلاب.

### 1.1 جدول العمليات والروابط للخلفية (`student_transcripts`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض وتصفية الصحائف المدرسية** | `TranscriptService::listTranscripts` | `GET /api/v1/transcripts` | `200 OK` | [في `routes.md`](./routes.md#11-get-apiv1transcripts--عرض-وتصفية-الصحائف-المدرسية-المؤرشفة) |
| **عرض لقطة صحيفة تجميدية** | `TranscriptService::getTranscript` | `GET /api/v1/transcripts/:id` | `200 OK` | [في `routes.md`](./routes.md#12-get-apiv1transcriptsid--عرض-تفاصيل-لقطة-الصحيفة-المؤرشفة-الكاملة) |
| **عرض صحائف طالب تاريخية** | `TranscriptService::getStudentTranscripts` | `GET /api/v1/students/:student_id/transcripts` | `200 OK` | [في `routes.md`](./routes.md#13-get-apiv1studentsstudent_idtranscripts--عرض-جميع-الصحائف-التاريخية-لطالب-محدد) |
| **تجميد وإصدار صحيفة دراسية** | `TranscriptService::freezeTranscript` | `POST /api/v1/transcripts/freeze` | `201 Created` | [في `routes.md`](./routes.md#14-post-apiv1transcriptsfreeze--تجميد-وإصدار-صحيفة-دراسية-فصلية-أو-سنوية) |

### 1.2 قواعد التحقق (`TranscriptFreezeRequest`):
- `student_id`: مطلوب، `integer` وموجود بجدول `students`.
- `transcript_type`: مطلوب، enum (`term`, `annual`).
- `class_academic_term_id`: مطلوب إذا كانت `transcript_type = 'term'` وموجود بجدول `class_academic_terms`.
- `academic_year_name`: مطلوب، `string` (مثال: `2024/2025`).
- `class_name`: مطلوب، `string`.
- `section_name`: مطلوب، `string`.
- `grade_level`: مطلوب، `integer` من 1 إلى 12.
- `total_score`: مطلوب، `numeric`.
- `percentage`: مطلوب، `numeric`.
- `final_status`: مطلوب، enum (`passed`, `second_round`, `failed`, `graduated`).
- `transcript_data`: مطلوب، `array` صالحة للتحويل إلى `JSON` متضمنة حقول `max_coursework_score` و `max_exam_score` و `second_round_details`.
- **قيد التفرد المركب:** `uq_student_transcript_term (student_id, academic_year_name, transcript_type, class_academic_term_id)`.

---

## 🚀 الخطوة 2: محرك الترحيل الأكاديمي الجماعي (`promotion_batches`) — [4 مسارات]

> **الوصف المختصر:** المعالجة الذرية لتنفيذ الترحيل السنوي ونقل الطلاب الناجحين والراسبين وتوزيعهم المتوازن على الشعب.

### 2.1 جدول العمليات والروابط للخلفية (`promotion_batches`):
| الوصف الوظيفي للإجراء (Action Description) | العملية الخلفية (Service Method) | HTTP Method & Endpoint | حالة النجاح | مرجع الهيكل الكامل في `routes.md` |
| :--- | :--- | :--- | :-: | :--- |
| **عرض سجل دفعات الترحيل** | `PromotionService::listBatches` | `GET /api/v1/promotions/batches` | `200 OK` | [في `routes.md`](./routes.md#21-get-apiv1promotionsbatches--عرض-سجل-ودفعات-الترحيل-السنوي-المنفذة) |
| **عرض إحصائيات دفعة ترحيل** | `PromotionService::getBatch` | `GET /api/v1/promotions/batches/:id` | `200 OK` | [في `routes.md`](./routes.md#22-get-apiv1promotionsbatchesid--عرض-تفاصيل-وإحصائيات-دفعة-ترحيل-محددة) |
| **معاينة نتائج الترحيل السنوي** | `PromotionService::previewPromotion` | `POST /api/v1/promotions/preview` | `200 OK` | [في `routes.md`](./routes.md#23-post-apiv1promotionspreview--معاينة-واختبار-نتائج-الترحيل-وتنبيهات-الشعب-قبل-التنفيذ) |
| **تنفيذ الترحيل الجماعي** | `PromotionService::executePromotion` | `POST /api/v1/promotions/execute` | `200 OK` | [في `routes.md`](./routes.md#24-post-apiv1promotionsexecute--اعتماد-وتنفيذ-الترحيل-السنوي-الجماعي) |

### 2.2 قواعد التحقق (`PromotionExecuteRequest`):
- `from_academic_year_id`: مطلوب، `integer` وموجود بجدول `academic_years`.
- `to_academic_year_id`: مطلوب، `integer` وموجود بجدول `academic_years`.
- `execution_notes`: اختياري، `string`.
- **قيد التفرد المركب:** `uq_promotion_batch_years (from_academic_year_id, to_academic_year_id)`.

---

## ⚖️ 3. قواعد منطق الأعمال الأكاديمية والمحددات العامة (Domain & System Business Rules)

تلتزم الخدمات (Services) والمتحكمات (Controllers) بالقواعد المقتبسة من [`MD/business_rules.md`](../../business_rules.md):

### 3.1 حوكمة الترحيل الجماعي الذري (`One-Click DB Transaction`):
- تنفذ خدمة `PromotionService::executePromotion` عملية الترحيل لجميع طلاب المدرسة في حدث ذري حازم (`DB::transaction`).
- يتم نقل الطلاب الناجحين (`passed`) للصف الأعلى، والطلاب الراسبين (`failed`) لنفس الصف للإعادة، وتخزين سجل الدفعة `promotion_batches`.

### 3.2 سياسة النقل المباشر للشعب وتنبيه الشعب المنخفضة (Direct Section Promotion & Low Enrollment Alert):
- **النقل المباشر لذات الشعبة (Direct Section-to-Section Mapping):** يُنقل الطلاب الناجحون بنفس رمز شعبتهم الأصلية إلى الصف الأعلى بالعام الجديد (الناجحون من 5/أ يتسكنون تلقائياً في 6/أ، و 5/ب في 6/ب، و 5/ج في 6/ج) للحفاظ على استقرار واستمرار بيئة المجموعة الطلابية.
- **معالجة الشعب الإضافية للراسبين (Retained Students in Excess Sections):** في حال وجود طلاب راسبين بشعبة سابقة لا مقابل لها في الصف المنقول منه (مثل وجود 7 طلاب راسبين بشعبة 6/د)، يُبقي النظام الشعبة (6/د) بالعام الجديد كما هي دون فرض دمج قسري.
- **مؤشر وتنبيه السعة المنخفضة (Low Enrollment Alert):** يصدر المحرك تنبيهاً وإشعاراً مرئياً للإدارة بتقرير الترحيل وفي الواجهة:  
  `⚠️ تنبيه إداري: الشعبة (السادس/د) تحتوي على عدد طلاب منخفض جداً (7 طلاب - أقل من الحد الأدنى المقترح 10 طلاب). تتيح المنظومة خيار الإبقاء أو الدمج اليدوي.`

### 3.3 اللقطة التجميدية الثابتة والدقيقة للصحائف (`Immutable JSON Transcript Invariant`):
- تحفظ درجات المواد والتقييمات بصيغة JSON غير قابلة للتعديل بجدول `student_transcripts.transcript_data` متضمنة `coursework_score` والحد الأقصى `max_coursework_score` (لمعرفة هل 35 من 35 أم من 40) و `exam_score` والحد الأقصى `max_exam_score` وتفاصيل امتحانات الدور الثاني عند وجودها.

### 3.4 الصلاحيات الحصرية بسجلات التدقيق (Admin RBAC & Audit Trail):
- جميع عمليات الترحيل السنوي وتجميد الصحائف الفترية والسنوية مقتصرة حصراً على مدير النظام (`role_type = 'admin'`) وتسجل في `audit_logs`.

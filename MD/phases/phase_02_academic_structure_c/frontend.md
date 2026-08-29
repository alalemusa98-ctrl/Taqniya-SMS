# 🖥️ مواصفات Frontend — المرحلة 02-C (User Interface & UX)

> **الهدف:** توثيق الشاشات والنوافل المنبثقة والإجراءات الحصرية للخطوات الثلاث (`class_academic_terms`, `class_sections`, `class_subjects`) المطابقة بنسبة 100% لـ [`MD/routes.md`](./routes.md) و [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم مطور الواجهات بالكامل برسم وتحديد معالجات الاستجابة (Response Handlers) والتنبيهات بالواجهة بناءً على الهياكل المسجلة في ملف [`routes.md`](./routes.md) حصراً.

---

## 1. شاشة تواريخ وتخبيط فترات الصفوف (الخطوة 7) — [4 مسارات]

### 1.1 المكونات والإجراءات:
- **جدول تخطيط فترات الصف:** يظهر اسم الفترة، بداية ونهاية الفترة طبق تقويم الوزارة، شارة التفعيل وشارة الإغلاق.
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض فترات صف** | `GET /api/v1/academic/years/:academic_year_id/classes/:class_id/terms` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#71-get-apiv1academicyearsacademic_year_idclassesclass_idterms--عرض-فترات-وتواريخ-صف-بالعام) |
  | **تخصيص فترة لصف** | `POST /api/v1/academic/class-academic-terms` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#72-post-apiv1academicclass-academic-terms--تخصيص-وتخبيط-فترة-وتواريخ-لصف) |
  | **تفعيل فترة نشطة للصف** | `POST /api/v1/academic/class-academic-terms/:id/activate` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#73-post-apiv1academicclass-academic-termsidactivate--تفعيل-الفترة-النشطة-للصف) |
  | **إغلاق/فتح درجات فترة** | `POST /api/v1/academic/class-academic-terms/:id/close` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#74-post-apiv1academicclass-academic-termsidclose--إغلاقفتح-درجات-الفترة-للصف) |

---

## 2. شاشة وإجراءات تسكين شعب الصفوف (الخطوة 8) — [3 مسارات]

### 2.1 المكونات والإجراءات:
- **وسوم الشعب المفتوحة للصف:** عرض الشعب المفتوحة تحت كارت الصف (`خامس/أ`, `خامس/ب`).
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض شعب صف** | `GET /api/v1/academic/classes/:class_id/sections` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#81-get-apiv1academicclassesclass_idsections--عرض-شعب-صف-مفتوحة) |
  | **تسكين شعبة بصف** | `POST /api/v1/academic/class-sections` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#82-post-apiv1academicclass-sections--تسكينربط-شعبة-بصف) |
  | **فك ربط شعبة** | `DELETE /api/v1/academic/class-sections/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#83-delete-apiv1academicclass-sectionsid--فك-ربط-شعبة-من-صف) |

---

## 3. شاشة وإجراءات بناء المناهج والدرجات بالفترة (الخطوة 9) — [4 مسارات]

### 3.1 المكونات والإجراءات:
- **محدِّد الصف الدراسي وتخصيص فترة الصف:** اختيار الصف وتخصيص الفترة التابعة لجدول `class_academic_terms` (`class_academic_term_id`).
- **جدول درجات المناهج:** عرض `passing_score` و `max_score`.
- **مصفوفة الإجراءات والروابط:**
  | الإجراء (UI Action) | نقطة الاتصال في `routes.md` | معالجة سلوك الواجهة رسم استجابات الـ JSON |
  | :--- | :--- | :--- |
  | **عرض منهج الفترة** | `GET /api/v1/academic/classes/:class_id/subjects` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#91-get-apiv1academicclassesclass_idsubjects--عرض-منهج-الصف-بالفترة) |
  | **إسناد مادة وتحديد الدرجات** | `POST /api/v1/academic/classes/:class_id/subjects` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#92-post-apiv1academicclassesclass_idsubjects--إسناد-مادة-لصف-وتحديد-درجات-الفترة) |
  | **تعديل درجات مادة** | `PUT /api/v1/academic/classes/:class_id/subjects/:id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#93-put-apiv1academicclassesclass_idsubjectsid--تعديل-درجات-مادة-بالفترة) |
  | **إزالة مادة من منهج الفترة**| `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id` | [هيكل الاستجابة الكامل في `routes.md`](./routes.md#94-delete-apiv1academicclassesclass_idsubjectssubject_id--إزالة-مادة-من-منهج-فترة) |

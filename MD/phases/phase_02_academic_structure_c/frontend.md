# 🖥️ مواصفات Frontend — المرحلة 02-C (User Interface & UX)

> **الهدف:** توثيق تفاصيل وتصميم الواجهات واللوحات الجانبية المنبثقة (Slide-over Drawer) لكافة عمليات الإضافة والتعديل، ونوافذ التأكيد الحصرية للحذف، وسلوك كافة المسارات البرمجية في المرحلة الفرعية 02-C المطابقة بنسبة 100% لـ [`MD/routes.md`](./routes.md) و [`MD/database.md`](../../database.md).  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `500 Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم مطور الواجهات بالكامل برسم وتحديد معالجات الاستجابة (Response Handlers) والتنبيهات بالواجهة بناءً على الهياكل المسجلة في ملف [`routes.md`](./routes.md) حصراً.

---

## 🗓️ 1. شاشة وإجراءات تواريخ وتخطيط فترات الصفوف (`class_academic_terms`) — (الخطوة 1)

### 1.1 مصفوفة الإجراءات والروابط السريعة (UI Actions & Route Summary):
| الإجراء بالواجهة (UI Action) | نقطة الاتصال في `routes.md` | المكون التفاعلي بالواجهة (UI Component) | مرجع الهيكل في `routes.md` |
| :--- | :--- | :--- | :--- |
| **عرض فترات صف** | `GET /api/v1/academic/years/:academic_year_id/classes/:class_id/terms` | جدول تخطيط تقويم الصف (`Class Terms Table`) | [في `routes.md`](./routes.md#11-get-apiv1academicyearsacademic_year_idclassesclass_idterms--عرض-فترات-وتواريخ-صف-بالعام) |
| **تخصيص فترة لصف** | `POST /api/v1/academic/class-academic-terms` | اللوحة الجانبية المنبثقة (`Slide-over Drawer`) | [في `routes.md`](./routes.md#12-post-apiv1academicclass-academic-terms--تخصيص-وتخبيط-فترة-وتواريخ-لصف) |
| **تفعيل فترة نشطة للصف** | `POST /api/v1/academic/class-academic-terms/:id/activate` | زر تفعيل ذري وحوار تأكيد ⚡ | [في `routes.md`](./routes.md#13-post-apiv1academicclass-academic-termsidactivate--تفعيل-الفترة-النشطة-للصف) |
| **إغلاق/فتح درجات فترة** | `POST /api/v1/academic/class-academic-terms/:id/close` | زر تبديل القفل والحظر 🔒 | [في `routes.md`](./routes.md#14-post-apiv1academicclass-academic-termsidclose--إغلاقفتح-درجات-الفترة-للصف) |

---

### 1.2 التفاصيل والتصميم والتفاعل مع المسارات (Detailed UI & Route Action Flow):

#### 🔹 [المسار 1.1] `GET /api/v1/academic/years/:academic_year_id/classes/:class_id/terms` — عرض فترات وتواريخ صف بالعام:
* **شكل المكون بالواجهة (Listing Component):**
  - **محددات الفلترة التفاعلية (Filter Selectors):** قائمة منسدلة لاختيار العام الدراسي وقائمة اختيار الصف الدراسي.
  - **جدول تخطيط تقويم الصف (Class Terms Calendar Table):** يستعرض الأعمدة التالية:
    1. `#` (المعرف `id`).
    2. `الفترة الرسمية` (`term_name` مثال: `الفصل الأول`).
    3. `تاريخ بداية الفترة` (`start_date`).
    4. `تاريخ نهاية الفترة` (`end_date`).
    5. `حالة الفترة للصف` (شارة خضراء `نشطة حالياً` أو رمادية).
    6. `حالة الإغلاق` (شارة حظر حمراء `مغلقة للأرشفة` أو خضراء `مفتوحة`).
    7. `الإجراءات` (زر `تفعيل الفترة للصف` ⚡، وزر `إغلاق/فتح الدرجات` 🔒).
  - **زر الإضافة العلوي:** `+ تخصيص وتخطيط فترة لصف`.

#### 🔹 [المسار 1.2] `POST /api/v1/academic/class-academic-terms` — تخصيص وتخطيط فترة وتواريخ لصف:
* **شكل المكون وتدفق التفاعل (Create Flow):**
  - **عنصر التفاعل:** عند الضغط على زر التخصيص يتم فتح **لوحة جانبية منبثقة (Slide-over Drawer)** بعرض `500px`.
  - **حقول النموذج (Form Controls):**
    1. `العام الدراسي` (اختيار من قائمة منسدلة `academic_year_id`).
    2. `الصف الدراسي` (اختيار من قائمة منسدلة `class_id` مثال: `الصف التاسع`).
    3. `الفترة المرجعية` (اختيار من الكتالوج العام `academic_term_id` مثال: `الفصل الثالث`).
    4. `تاريخ بداية الفترة بالصف` (`Date Picker` لـ `start_date`).
    5. `تاريخ نهاية الفترة بالصف` (`Date Picker` لـ `end_date`).
  - **أزرار التحكم:** زر `حفظ تخصيص الفترة` وزر `إلغاء`.
* **سلوك المعالجة (Response Handlers):**
  - **نجاح التخصيص (`201 Created`):** إغلاق الدرور، إظهار Toast أخضر "تم تخصيص الفترة وتواريخ التقويم للصف بنجاح"، وتحديث جدول فترات الصف.
  - **تكرار التخصيص (`409 Conflict`):** إظهار تنبيه أحمر: "هذه الفترة مخصصة مسبقاً لهذا الصف بالعام الدراسي".
  - **خطأ التواريخ (`422 Unprocessable`):** "تاريخ بداية ونهاية الفترة يجب أن يكون ضمن النطاق الزمني للعام الدراسي".

#### 🔹 [المسار 1.3] `POST /api/v1/academic/class-academic-terms/:id/activate` — تفعيل الفترة النشطة للصف:
* عند الضغط على ⚡، فتح نافذة تأكيد سريعة. عند النجاح (`200 OK`): إظهار Toast أخضر "تم تفعيل الفترة النشطة للصف بنجاح" وتحديث الشارات.

#### 🔹 [المسار 1.4] `POST /api/v1/academic/class-academic-terms/:id/close` — إغلاق/فتح درجات الفترة للصف:
* عند الضغط على 🔒، تغيير حالة الإغلاق (`is_closed`). عند النجاح (`200 OK`): إظهار Toast أخضر "تمت تغيير حالة إغلاق درجات الفترة للصف بنجاح".

---

## 🧩 2. شاشة وإجراءات تسكين شُعب الصفوف (`class_sections`) — (الخطوة 2)

### 2.1 مصفوفة الإجراءات والروابط السريعة (UI Actions & Route Summary):
| الإجراء بالواجهة (UI Action) | نقطة الاتصال في `routes.md` | المكون التفاعلي بالواجهة (UI Component) | مرجع الهيكل في `routes.md` |
| :--- | :--- | :--- | :--- |
| **عرض شعب صف** | `GET /api/v1/academic/classes/:class_id/sections` | كروت الصفوف والوسوم (`Class Section Cards`) | [في `routes.md`](./routes.md#21-get-apiv1academicclassesclass_idsections--عرض-شعب-صف-مفتوحة) |
| **تسكين شعبة بصف** | `POST /api/v1/academic/class-sections` | اللوحة الجانبية المنبثقة (`Slide-over Drawer`) | [في `routes.md`](./routes.md#22-post-apiv1academicclass-sections--تسكينربط-شعبة-بصف) |
| **فك ربط شعبة** | `DELETE /api/v1/academic/class-sections/:id` | نافذة التأكيد المركزية (`Confirmation Modal`) | [في `routes.md`](./routes.md#23-delete-apiv1academicclass-sectionsid--فك-ربط-شعبة-من-صف) |

---

### 2.2 التفاصيل والتصميم والتفاعل مع المسارات (Detailed UI & Route Action Flow):

#### 🔹 [المسار 2.1] `GET /api/v1/academic/classes/:class_id/sections` — عرض شعب صف مفتوحة:
* **شكل المكون بالواجهة (Listing Component):**
  - **كروت الصفوف والوسوم (Class Section Badges):** عرض كروت الصفوف مع وسوم تفاعلية للشعب المفتوحة لكل صف (مثل: `خامس/أ` ❌، `خامس/ب` ❌).
  - **زر الإسكان:** `+ تسكين شعبة بصف`.

#### 🔹 [المسار 2.2] `POST /api/v1/academic/class-sections` — تسكين/ربط شعبة بصف:
* **شكل المكون وتدفق التفاعل:** عند الضغط على زر التسكين يتم فتح **لوحة جانبية منبثقة (Slide-over Drawer)** بعرض `450px` تتيح اختيار الصف والشعبة العامة المراد فتحها له.
* **سلوك المعالجة (Response Handlers):**
  - **نجاح التسكين (`201 Created`):** إغلاق الدرور تلقائياً، إظهار Toast أخضر "تم فتح وتسكين الشعبة للصف بنجاح"، وإضافة الوسم تحت كارت الصف.
  - **تكرار الشعبة (`409 Conflict`):** رسالة خطأ "الشعبة مفتوحة ومسندة مسبقاً لهذا الصف".

#### 🔹 [المسار 2.3] `DELETE /api/v1/academic/class-sections/:id` — فك ربط شعبة من صف:
* الضغط على زر ❌ على وسم الشعبة يفتح **نافذة تأكيد الحذف المركزية (Confirmation Modal Alert)**.
* **حظر الحذف (`403 Forbidden`):** إظهار Toast تحذيري "لا يمكن فك ربط الشعبة لوجود طلاب مسجلين بها في هذا العام (RESTRICT)".

---

## 📝 3. شاشة وإجراءات مناهج الصفوف والدرجات لكل فترة (`class_subjects`) — (الخطوة 3)

### 3.1 مصفوفة الإجراءات والروابط السريعة (UI Actions & Route Summary):
| الإجراء بالواجهة (UI Action) | نقطة الاتصال في `routes.md` | المكون التفاعلي بالواجهة (UI Component) | مرجع الهيكل في `routes.md` |
| :--- | :--- | :--- | :--- |
| **عرض منهج الفترة** | `GET /api/v1/academic/classes/:class_id/subjects` | جدول مناهج الفترة (`Curriculum Table`) | [في `routes.md`](./routes.md#31-get-apiv1academicclassesclass_idsubjects--عرض-منهج-الصف-بالفترة) |
| **إسناد مادة وتحديد الدرجات** | `POST /api/v1/academic/classes/:class_id/subjects` | اللوحة الجانبية المنبثقة (`Slide-over Drawer`) | [في `routes.md`](./routes.md#32-post-apiv1academicclassesclass_idsubjects--إسناد-مادة-لصف-وتحديد-درجات-الفترة) |
| **تعديل درجات مادة** | `PUT /api/v1/academic/classes/:class_id/subjects/:id` | نفس اللوحة الجانبية (`Slide-over Drawer`) | [في `routes.md`](./routes.md#33-put-apiv1academicclassesclass_idsubjectsid--تعديل-درجات-مادة-بالفترة) |
| **إزالة مادة من منهج الفترة**| `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id` | نافذة التأكيد المركزية (`Confirmation Modal`) | [في `routes.md`](./routes.md#34-delete-apiv1academicclassesclass_idsubjectssubject_id--إزالة-مادة-من-منهج-فترة) |

---

### 3.2 التفاصيل والتصميم والتفاعل مع المسارات (Detailed UI & Route Action Flow):

#### 🔹 [المسار 3.1] `GET /api/v1/academic/classes/:class_id/subjects` — عرض منهج الصف بالفترة:
* **شكل المكون بالواجهة (Listing Component):**
  - **جدول مناهج الفترة (Period Curriculum Table):** بعد اختيار الصف والفترة المخصصة له (`class_academic_term_id`)، يستعرض الجدول الأعمدة:
    1. `#` (`id`).
    2. `المادة التعليمية` (`subject_name` وكودها `subject_code`).
    3. `درجة النجاح الصغرى` (`passing_score`).
    4. `الدرجة العظمى` (`max_score`).
    5. `الإجراءات` (تعديل الدرجات ✏️، وإزالة المادة 🗑️).
  - **زر الإسناد العلوي:** `+ إسناد مادة لصف وتحديد الدرجات`.

#### 🔹 [المسار 3.2] `POST /api/v1/academic/classes/:class_id/subjects` — إسناد مادة لصف وتحديد درجات الفترة:
* **شكل المكون وتدفق التفاعل (Create Flow):**
  - عند الضغط على زر الإسناد يتم فتح **لوحة جانبية منبثقة (Slide-over Drawer)** بعرض `500px`.
  - **حقول النموذج (Form Controls):**
    1. `المادة التعليمية` (اختيار من بنك المواد `subject_id`).
    2. `تخصيص فترة الصف` (اختيار من فترات الصف المتاحة `class_academic_term_id`).
    3. `درجة النجاح الصغرى` (`Number Input` لـ `passing_score` افتراضي 50.00).
    4. `الدرجة العظمى المقررة` (`Number Input` لـ `max_score` افتراضي 100.00).
  - **أزرار التحكم:** زر `إسناد المادة` وزر `إلغاء`.
* **سلوك المعالجة (Response Handlers):**
  - **نجاح الإسناد (`201 Created`):** إغلاق الدرور، إظهار Toast أخضر "تم إسناد المادة وتحديد درجات الفصل الدراسي بنجاح"، وتحديث جدول المناهج.
  - **تكرار المادة بالفترة (`409 Conflict`):** تنبيه أحمر "المادة مضافة ومقررة مسبقاً لهذا الصف في هذا الفصل الدراسي".
  - **خطأ قياس الدرجات (`422 Unprocessable`):** رسالة تحت الحقل "درجة النجاح passing_score يجب أن تكون أقل من أو تساوي الدرجة العظمى max_score".

#### 🔹 [المسار 3.3] `PUT /api/v1/academic/classes/:class_id/subjects/:id` — تعديل درجات مادة بالفترة:
* **شكل المكون وتدفق التفاعل (Edit Flow):**
  - عند الضغط على ✏️ يتم فتح **نفس اللوحة الجانبية المنبثقة (Slide-over Drawer)** محملة بالدرجات الحالية لتحديثها.
  - **نجاح التعديل (`200 OK`):** إغلاق الدرور وإظهار Toast أخضر "تم تحديث درجات المادة للفترة بنجاح".
  - **حظر التعديل بالفصل المغلق (`403 Forbidden`):** تنبيه أحمر "لا يمكن تعديل درجات مادة في فصل مغلق نهائياً (is_closed = 1)".

#### 🔹 [المسار 3.4] `DELETE /api/v1/academic/classes/:class_id/subjects/:subject_id` — إزالة مادة من منهج فترة:
* **شكل المكون وتدفق التفاعل (Delete Flow):**
  - فتح **نافذة تأكيد الحذف المركزية (Confirmation Modal Alert)**.
  - **حظر الإزالة المرجعي (`403 Forbidden`):** Toast تحذيري "لا يمكن إزالة المادة من المنهج لارتباطها باختبارات رسمية أو حصص جدول (RESTRICT)".

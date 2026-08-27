# 📦 المرحلة 09: محرك الترحيل والأرشفة النهائية للصحائف (Promotion & Transcripts Archiving)

---

## 22. جدول الصحائف المدرسية النهائية المؤرشفة (`student_transcripts`)

> **الوصف:**  
> جدول أرشفة وتجميد الصحيفة المدرسية السنوية النهائية للطالب، متضمناً تفاصيل الفصول والدرجات وأعمال السنة والامتحانات كلقطة بيانات نهائية ثابتة (Immutable Snapshot) لا تتأثر ببدء العام الجديد أو مسح الحركات التشغيلية السابقة.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي الفريد لسجل الصحيفة. |
| `student_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف الطالب الدائم (يرتبط بـ `students.id` كالمفتاح الخارجي الوحيد). |
| `academic_year_name` | `VARCHAR(50)` | `NOT NULL` | مسمى العام الدراسي كنص صلب (مثال: `2024/2025`). |
| `class_name` | `VARCHAR(50)` | `NOT NULL` | اسم الصف الدراسي كنص صلب (مثال: `الصف الخامس`). |
| `section_name` | `VARCHAR(50)` | `NOT NULL` | اسم الشعبة كنص صلب (مثال: `شعبة أ`). |
| `grade_level` | `SMALLINT UNSIGNED` | `NOT NULL` | المستوى الأكاديمي الرقمي وقت التخرج من السنة (`1` إلى `12`). |
| `total_score` | `DECIMAL(7,2)` | `NOT NULL` | المجموع الكلي للدرجات التي تحصل عليها الطالب. |
| `percentage` | `DECIMAL(5,2)` | `NOT NULL` | النسبة المئوية العامة للطالب (مثال: `94.50%`). |
| `final_status` | `ENUM('passed', 'second_round', 'failed', 'graduated')` | `NOT NULL` | النتيجة والقرار النهائي للطالب بنهاية العام. |
| `rank` | `SMALLINT UNSIGNED` | `NULL DEFAULT NULL` | الترتيب على مستوى الصف أو الشعبة (مثال: `الأول`, `الثاني`). |
| `transcript_data` | `JSON` | `NOT NULL` | اللقطة الكاملة للصحيفة التفصيلية: درجات كل مادة في كل فصل دراسي (أعمال سنة + امتحان نهائي)، والمجموع النهائي لكل مادة. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت تجميد وإصدار الصحيفة. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `student_id` يرتبط بجدول `students(id)` مع سلوك:
  * `ON DELETE RESTRICT` (يمنع حذف ملف الطالب طالما يملك صحائف دراسية تاريخية محفوظة).
  * `ON UPDATE CASCADE`.
* *لا يحتوي على أي مفاتيح خارجية تشغيلية أخرى لضمان الاستقلالية المطلقة للأرشيف.*

### ⚡ الفهارس وقيود التفرد (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_student_transcript_year (student_id, academic_year_name)`  
  *(يضمن حفظ صحيفة نهائية واحدة معتمدة لكل طالب في العام الدراسي الواحد).*
* `INDEX idx_transcripts_year_class (academic_year_name, class_name)`
* `INDEX idx_transcripts_status (final_status)`

---

## 23. جدول سجل وإحصائيات دفعات الترحيل السنوي (`promotion_batches`)

> **الوصف:**  
> جدول توثيق وتتبع كل دفعة ترحيل سنوي جماعي تنفذها الإدارة، مع حفظ الإحصائيات الشاملة ونسب النجاح والرسوب وأعداد الطلاب لكل صف دراسي.

### 📋 هيكل الأعمدة (Columns Matrix):

| اسم العمود (Column) | نوع البيانات (MySQL Type) | القيود (Constraints) | الوصف والدور المنطقي |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT`, `PRIMARY KEY` | المعرف الرقمي لسجل دفعة الترحيل. |
| `from_academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي المُنتهى المرحل منه (يرتبط بـ `academic_years.id`). |
| `to_academic_year_id` | `BIGINT UNSIGNED` | `NOT NULL` | معرف العام الدراسي الجديد المرحل إليه (يرتبط بـ `academic_years.id`). |
| `executed_by_user_id` | `BIGINT UNSIGNED` | `NOT NULL` | المدير الذي قام باعتماد وتنفيذ عملية الترحيل (يرتبط بـ `users.id`). |
| `total_students` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد طلاب المدرسة المشمولين بالترحيل. |
| `total_promoted` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد الطلاب الناجحين المنقولين للمستوى الأعلى. |
| `total_second_round` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد طلاب الدور الثاني/الملاحق. |
| `total_retained` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد الراسبين الباقين للإعادة في نفس الصف. |
| `total_graduated` | `INT UNSIGNED` | `NOT NULL` | إجمالي عدد الخريجين من المرحلة النهائية. |
| `overall_passing_rate` | `DECIMAL(5,2)` | `NOT NULL` | النسبة المئوية العامة لنجاح المدرسة في ذلك العام (مثال: `88.50%`). |
| `class_statistics` | `JSON` | `NOT NULL` | إحصائيات تفصيلية لكل صف دراسي بصيغة JSON (اسم الصف، عدد الطلاب، عدد الناجحين، عدد الراسبين، ونسبة النجاح الخاصة بكل صف). |
| `execution_notes` | `VARCHAR(255)` | `NULL DEFAULT NULL` | ملاحظات الإدارة على دفعة الترحيل. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | توقيت تنفيذ عملية الترحيل. |
| `updated_at` | `TIMESTAMP` | `NULL ON UPDATE CURRENT_TIMESTAMP` | توقيت آخر تحديث. |
| `deleted_at` | `TIMESTAMP` | `NULL DEFAULT NULL` | طابع الحذف المنطقي. |

### 🔗 العلاقات والمفاتيح الخارجية (Foreign Keys):
* `from_academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `to_academic_year_id` يرتبط بجدول `academic_years(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.
* `executed_by_user_id` يرتبط بجدول `users(id)` مع `ON DELETE RESTRICT, ON UPDATE CASCADE`.

### ⚡ الفهارس وقيود التفرد (Indexes & Constraints):
* `PRIMARY KEY (id)`
* `UNIQUE INDEX uq_promotion_batch_years (from_academic_year_id, to_academic_year_id)`  
  *(يضمن تسجيل دفعة ترحيل واحدة معتمدة بين كل عامين دراسيين).*
* `INDEX idx_promotion_executed_by (executed_by_user_id)`
* `INDEX idx_promotion_created_at (created_at)`

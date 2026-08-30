# ⚙️ مواصفات Backend — المرحلة 03-B: إسناد التدريس والنصاب الأكاديمي (Teaching Assignments)

> **الهدف:** توثيق منطق المعالجة وقواعد التحقق وقواعد حوكمة توزيع المواد على المعلمين لجدول `teaching_assignments` المطابقة بنسبة 100% لـ [`MD/database.md`](../../database.md) و [`MD/business_rules.md`](../../business_rules.md)، مع دمج وتوحيد منطق الإنشاء والتعديل (`POST & PUT`) لتوفير الوضوح والرشاقة.  
> 
> ⚠️ **تكامل حوكمي صريح وملزم — مرجع الاستجابات (Network SSoT):**  
> ملف [`routes.md`](./routes.md) هو **المصدر الرئيسي والحصري والوحيد لكافة استجابات ومدخلات الـ API (Network SSoT)**. تم تسجيل كامل شكل الاستجابة (JSON Response Body) ورسائل الخطأ والنجاح صراحةً في [`routes.md`](./routes.md) لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Internal Server Error`) لكل رابط.  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور أو نموذج الذكاء الاصطناعي بالكامل بإنشاء ورسم كود الخادم واستجابات الـ API بناءً على الهياكل والرموز المسجلة في ملف [`routes.md`](./routes.md) حصراً بدون أي اجتهاد شخصي.

---

## 1. نطاق المرحلة والحدود المعمارية (Scope & Boundaries)

### 🟢 ما تشمله المرحلة (In-Scope):
- **إدارة سجل وجدول إسناد التدريس الأكاديمي (`teaching_assignments`) — [6 مسارات موثقة برباعية العمليات المدمجة]:**
  - استعراض وبحث جدول إسناد التدريس العام بالترقيم والتصفية (`GET /api/v1/teaching-assignments`).
  - استعراض تفاصيل سجل إسناد تدريس محدد (`GET /api/v1/teaching-assignments/:id`).
  - استعراض النصاب التدريسي والمواد لمعلم محدد (`GET /api/v1/teachers/:teacher_id/assignments`).
  - استعراض كشف معلمي ومناهج الصف الدراسي بالشعب (`GET /api/v1/classes/:class_id/assignments`).
  - إنشاء وتعديل إسناد التدريس لمعلم ومادة بشعبة في عام دراسي (`POST & PUT /api/v1/teaching-assignments`).
  - فك وإلغاء إسناد التدريس مع فحص الحماية المرجعية الصارمة (`DELETE /api/v1/teaching-assignments/:id`).
- **الحوكمة والأمان:**
  - قصر عمليات التكليف والتعديل وفك الإسناد على مدير النظام (`admin`).
  - إتاحة عرض النصاب التدريسي للمعلم نفسه (`teacher`) أو لمدير النظام (`admin`).
  - فرض قيد المعلم المسؤول الوحيد لكل مادة بالشعبة في العام الدراسي (`uq_teaching_assignment`).
  - حظر فك الإسناد في حال وجود حصص بالجدول أو درجات أو واجبات (`ON DELETE RESTRICT`) وإرجاع `409 Conflict`.
  - تسجيل كافة العمليات والتعديلات في سجلات التدقيق `audit_logs`.

### 🔴 خارج نطاق المرحلة (Out-of-Scope):
- تعريف المعلمين وإنشاء حساباتهم $\rightarrow$ تابعة للمرحلة `03-A` (`teachers`).
- تسكين جداول الحصص الأسبوعية $\rightarrow$ محال إلى المرحلة `05` (`timetable_slots`).
- رصد الواجبات والامتحانات والدرجات $\rightarrow$ محالة إلى المراحل `06` و `07` و `08`.

---

## 2. حوكمة الأدوار وقواعد الوصول وعزل البيانات (RBAC & Scoping Rules)

### 👥 مصفوفة الفاعلين والصلاحيات:
- **مدير النظام (Admin - `role_type = 'admin'`):**
  - يمتلك الصلاحية الكاملة على كافة مسارات إسناد التدريس (استعراض، تكليف، تعديل، فك إسناد).
- **المعلم (Teacher - `role_type = 'teacher'`):**
  - يمتلك صلاحية استعراض نصابه التدريسي الخاص به فقط (`GET /api/v1/teachers/:teacher_id/assignments` حيث `teacher_id = auth.teacher.id`).
  - يُحظر عليه إنشاء أو تعديل أو فك أي إسناد تدريس (`403 Forbidden`).
- **الطالب (Student) وولي الأمر (Parent):**
  - يُحظر عليهم تماماً الوصول لمسارات إدارة إسناد التدريس (`403 Forbidden`).
- **المستخدم غير المصادق عليه (Unauthenticated):**
  - أي طلب يفتقر إلى توكن `Bearer JWT` صالح ونشط يُرفض برمز `401 Unauthorized`.

---

## 3. دورة حياة الكيانات وقواعد ثبات النظام (Lifecycles & System Invariants)

```mermaid
stateDiagram-v2
    [*] --> ActiveAssignment: إسناد المعلم لمادة بشعبة (تحقق من uq_teaching_assignment)
    ActiveAssignment --> ModifiedAssignment: تعديل المعلم أو الشعبة أو المادة (PUT)
    ModifiedAssignment --> ActiveAssignment
    ActiveAssignment --> SoftDeleted: فك الإسناد بشرط خلو السجل من الحصص والدرجات (RESTRICT)
    SoftDeleted --> [*]
```

### 🔒 قواعد ثبات النظام الصارمة (System Invariants):
1. **قيد المعلم المسؤول الوحيد (Single Assigned Teacher Invariant):**
   - يمتلك كل مقرر دراسي لشعبة محددة في عام دراسي محدد معلماً مسؤولاً أساسياً واحداً فقط (`uq_teaching_assignment: academic_year_id, class_section_id, subject_id`).
   - عند محاولة إسناد مادة مسندة مسبقاً لنفس الشعبة والعام، يرفض الطلب برمز `409 Conflict`.
2. **التحقق من أهلية ونشاط المعلم (Active Teacher Verification):**
   - يُشترط أن يكون المعلم المختار موجوداً وغير محذوف وحسابه نشط (`is_active = 1`).
3. **الحماية المرجعية الصارمة لفك الإسناد (Strict RESTRICT Protection):**
   - يمنع فك أو حذف أي إسناد تدريس إذا تم رصد حصص أسبوعية له بجدول الحصص (`timetable_slots`) أو واجبات (`assignments`) أو اختبارات (`quizzes`) أو درجات رسمية.
   - رمز الخطأ المعياري لحظر الحذف المرجعي هو `409 Conflict`.
4. **دورة حياة الحذف المنطقي (Soft Delete Lifecycle):**
   - عند فك إسناد حر، يتم تعيين `deleted_at = CURRENT_TIMESTAMP` للسجل واستبعاده من الاستعلامات.
5. **سجلات التدقيق (Audit Logging):**
   - تسجل كافة عمليات الإسناد وتغيير المعلم المكلف وفك الإسناد في جدول `audit_logs`.

---

## 4. العمليات المنطقية والمسارات التفصيلية للمجال (Domain Operations & Routes)

---

### 📚 الخطوة 1: إدارة سجل وجدول إسناد التدريس الأكاديمي (`teaching_assignments`)

#### 📋 جدول العمليات المدمجة:
| # | العملية المنطقية (Operation) | HTTP Method & Endpoint | الصلاحية | رمز النجاح | مرجع العقد في `routes.md` |
| :-: | :--- | :--- | :--- | :---: | :--- |
| **1.1** | استعراض وبحث جدول إسناد التدريس العام | `GET /api/v1/teaching-assignments` | `admin` | `200 OK` | [في routes.md](./routes.md) |
| **1.2** | استعراض تفاصيل سجل إسناد تدريس محدد | `GET /api/v1/teaching-assignments/:id` | `admin` / `teacher` | `200 OK` | [في routes.md](./routes.md) |
| **1.3** | استعراض النصاب التدريسي لمعلم محدد | `GET /api/v1/teachers/:teacher_id/assignments` | `admin` / `teacher (own)` | `200 OK` | [في routes.md](./routes.md) |
| **1.4** | استعراض كشف معلمي ومناهج الصف بالشعب | `GET /api/v1/classes/:class_id/assignments` | `admin` | `200 OK` | [في routes.md](./routes.md) |
| **1.5** | إسناد وتعديل تكليف التدريس | `POST /api/v1/teaching-assignments` & `PUT /api/v1/teaching-assignments/:id` | `admin` | `201 Created` / `200 OK` | [في routes.md](./routes.md) |
| **1.6** | فك وإلغاء إسناد تدريس | `DELETE /api/v1/teaching-assignments/:id` | `admin` | `200 OK` | [في routes.md](./routes.md) |

---

#### 🔹 [Operation 1.1] `GET /api/v1/teaching-assignments` — استعراض وبحث جدول إسناد التدريس العام
- **الغرض والوظيفة:** استرجاع خريطة توزيع الكادر التعليمي على المواد والشعب بالعام الدراسي مجمعة هرمياً لكل صف وشعبة (`classes -> sections -> assignments`) بدون تكرار للبيانات.
- **قواعد المعالجة والخادم:**
  - استرجاع السجلات النشطة فقط (`deleted_at IS NULL`).
  - تجميع الشُعب والمواد المخصصة ومعلميها تحت الصف الدراسي التابع لها في مصفوفة `classes`.
  - تضمين مسميات المواد والمعلمين وشاراتهم (`subject_name`, `subject_code`, `teacher_name`, `teacher_code`).
- **عقد الاستجابات والمعاملات (Network SSoT):**
  - معاملات الاستعلام وهياكل الـ JSON الصريحة لـ (`200 OK`) موثقة في [`routes.md`](./routes.md).

#### 🔹 [Operation 1.2] `GET /api/v1/teaching-assignments/:id` — استعراض تفاصيل سجل إسناد تدريس محدد
- **الغرض والوظيفة:** جلب بيانات سجل إسناد تدريس محدد.
- **عقد الاستجابات والمدخلات (Network SSoT):**
  - استجابات (`200 OK`, `404 Not Found`) مسجلة في [`routes.md`](./routes.md).

#### 🔹 [Operation 1.3] `GET /api/v1/teachers/:teacher_id/assignments` — استعراض النصاب التدريسي لمعلم محدد
- **الغرض والوظيفة:** جلب قائمة كافة المواد والشعب المكلف بها معلم محدد بالعام الدراسي.
- **قواعد الوصول:** متاح لمدير النظام (`admin`)، أو للمعلم صاحب النصاب حصراً (`teacher`).
- **عقد الاستجابات والمعاملات (Network SSoT):**
  - استجابات (`200 OK`, `404 Not Found`) مسجلة في [`routes.md`](./routes.md).

#### 🔹 [Operation 1.4] `GET /api/v1/classes/:class_id/assignments` — استعراض كشف معلمي ومناهج الصف بالشعب
- **الغرض والوظيفة:** جلب كشف توزيع معلمي المواد لصف دراسي محدد مع إمكانية التصفية بالشعبة (`section_id`).
- **عقد الاستجابات والمعاملات (Network SSoT):**
  - استجابات (`200 OK`, `404 Not Found`) مسجلة في [`routes.md`](./routes.md).

#### 🔹 [Operation 1.5] `POST /api/v1/teaching-assignments` & `PUT /api/v1/teaching-assignments/:id` — إسناد وتعديل تكليف التدريس (Combined Domain Logic)
- **الغرض والوظيفة:**
  - **في الإنشاء (`POST`):** تكليف معلم مسؤول عن تدريس مادة لشعبة في عام دراسي محدد.
  - **في التعديل (`PUT`):** تحديث وتعديل سجل الإسناد (تغيير المعلم المكلف أو الشعبة أو المادة) مع التحقق من عدم التعارض.
- **قواعد التحقق المشتركة (Validation Rules):**
  - `academic_year_id`: مطلوب، معرف عام دراسي صالح.
  - `class_section_id`: مطلوب، معرف شعبة صف صالحة.
  - `subject_id`: مطلوب، معرف مادة صالحة.
  - `teacher_id`: مطلوب، معرف معلم صالح ونشط.
  - **قيد التفرد المركب:** التحقق من عدم تخصيص نفس المادة لنفس الشعبة بالعام الدراسي لمعلم آخر (`uq_teaching_assignment`).
- **عقد الاستجابات والمدخلات (Network SSoT):**
  - هيكل الطلب واستجابات (`201 Created`, `200 OK`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`) مسجلة في [`routes.md`](./routes.md).

#### 🔹 [Operation 1.6] `DELETE /api/v1/teaching-assignments/:id` — فك وإلغاء إسناد تدريس
- **الغرض والوظيفة:** تنفيذ الحذف المنطقي لسجل إسناد التدريس.
- **قواعد الحماية المرجعية:**
  - فحص وجود حصص مسجلة بجدول الحصص أو واجبات أو تطبيقات أو درجات مرتبطة بهذا الإسناد.
  - إذا وجدت ارتباطات: رفض الطلب وإرجاع `409 Conflict` (حماية RESTRICT).
  - إذا كان الإسناد حراً: تنفيذ الحذف المنطقي (`deleted_at = NOW`) وتوثيق العملية في `audit_logs`.
- **عقد الاستجابات والمدخلات (Network SSoT):**
  - ردود الحذف (`200 OK`, `404 Not Found`, `409 Conflict`) مسجلة صراحةً في [`routes.md`](./routes.md).

---

## 5. الأداء، التزامن، والنزاهة المرجعية (Performance & Data Integrity)

1. **الاستعلامات والفهارس:**
   - استخدام الفهارس المعتمدة في `MD/database.md`: `uq_teaching_assignment`، `idx_teaching_teacher`، `idx_teaching_class_section`، `idx_teaching_subject`، `idx_teaching_deleted_at`.
2. **الترقيم ومنع الإغراق (Pagination & DoS Protection):**
   - حصر عدد السجلات في مسار الـ GET بـ `per_page` لمنع تحميل الذاكرة.
3. **تجنب التسريب التقني والأمني في الاستجابات:**
   - توحيد رسائل الأخطاء عبر الرموز المعيارية (`401`, `403`, `404`, `409`, `422`, `500`).

---

## 6. معايير القبول الهندسية للباك إند (Backend Acceptance Criteria)

تعتبر متطلبات الخادم لهذه المرحلة مستوفاة بالكامل عند تحقق المعايير التالية:

- [ ] قصر صلاحية إدارة إسناد التدريس (تكليف، تعديل، فك إسناد) حصراً على المستخدمين بدور `admin`.
- [ ] إرجاع `401 Unauthorized` لأي طلب بدون توكن مصادقة صالح.
- [ ] إرجاع `403 Forbidden` عند محاولة المعلم تعديل إسنادات أو استعراض نصاب معلم آخر.
- [ ] التحقق الصارم من قيد المعلم المسؤول الوحيد لكل مادة بالشعبة والعام `uq_teaching_assignment` وإرجاع `409 Conflict` عند التكرار.
- [ ] التحقق من أهلية ونشاط المعلم وصحة معرفات الشعبة والمادة.
- [ ] منع فك إسناد أي تكليف مرتبط بحصص دراسية أو درجات أو واجبات وإرجاع `409 Conflict` (RESTRICT).
- [ ] تنفيذ الحذف المنطقي بضبط `deleted_at` للإسنادات الحرة واستبعادها من القوائم.
- [ ] تسجيل جميع العمليات والتعديلات في جدول `audit_logs`.
- [ ] مطابقة كافة المدخلات والمخرجات بنسبة 100% لعقد الشبكة في [`routes.md`](./routes.md).

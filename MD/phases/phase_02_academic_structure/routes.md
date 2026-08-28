# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 02: الهيكل الأكاديمي والمناهج (Network SSoT)

> **الهدف:** توثيق كافة نقاط الاتصال البرمجية (RESTful API Endpoints) مقسمة ومصنفة بحسب **التسلسل التنفيذي الأكاديمي في المدرسة (8 خطوات متسلسلة)**، لتوفير وضوح تام لكل قسم وشاشة وعقد عمل.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **المسار الأساسي (Base URI):** `/api/v1/academic`
- **بروتوكول النقل (Protocol):** `HTTPS`
- **صيغة البيانات (Data Format):** `JSON` (`application/json`)
- **الترويسات العامة الإلزامية (Common Headers):**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Accept: application/json
  Content-Type: application/json
  Accept-Language: ar
  ```
- **حدود معدل الطلبات (Rate Limiting):** `60 requests / minute` لكل مستخدم مسجل.

---

## 📅 الخطوة 1: إدارة السنوات الدراسية (`academic_years`)

> **الوصف:** إدارة التقويم السنوي للمدرسة (مثال: `2025/2026`, `2026/2027`) وتفعيل السنة النشطة حالياً.

### 1.1 مسارات السنوات الدراسية
| العمل المخصص | HTTP Method | الـ Endpoint | الصلاحية | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- |
| **عرض القائمة** | `GET` | `/api/v1/academic/years` | `academic.view` | جلب قائمة السنوات مع فلترة النشطة والمقفلة. |
| **إنشاء سنة جديدة** | `POST` | `/api/v1/academic/years` | `academic.manage` | إضافة سنة دراسية بتواريخ البداية والنهاية. |
| **تعديل سنة دراسية** | `PUT` | `/api/v1/academic/years/:id` | `academic.manage` | تعديل اسم أو تواريخ سنة دراسية غير مقفلة. |
| **حذف سنة دراسية** | `DELETE` | `/api/v1/academic/years/:id` | `academic.manage` | حذف سنة دراسية ما لم ترتبط بفصول (`RESTRICT`). |
| **تفعيل السنة النشطة** | `POST` | `/api/v1/academic/years/:id/set-current` | `academic.manage` | تعيين السنة كسنة نشطة وحيدة ذرياً (`is_current = 1`). |

### 1.2 استجابات السنوات الدراسية
- **`GET /years` (200 OK):** `{"success": true, "data": [{"id": 1, "name": "2025/2026", "is_current": 1}]}`
- **`POST /years` (201 Created):** `{"success": true, "message": "تم إنشاء السنة بنجاح.", "data": {"id": 2, "name": "2026/2027"}}`
- **`PUT /years/:id` (200 OK):** `{"success": true, "message": "تم تحديث السنة بنجاح."}`
- **`DELETE /years/:id` (200 OK):** `{"success": true, "message": "تم حذف السنة بنجاح."}`

---

## ⏱️ الخطوة 2: إدارة الفترات/الفصول الدراسية (`academic_terms`)

> **الوصف:** تقسيم السنة إلى فترات دراسية (مثال: `الفترة الأولى`, `الفترة الثانية`, `الفترة الثالثة`) وتفعيل الفترة الحالية.

### 2.1 مسارات الفترات الدراسية
| العمل المخصص | HTTP Method | الـ Endpoint | الصلاحية | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- |
| **عرض فصول سنة** | `GET` | `/api/v1/academic/years/:year_id/terms` | `academic.view` | جلب كافة الفصول التابعة لسنة محددة. |
| **إضافة فترة دراسية** | `POST` | `/api/v1/academic/years/:year_id/terms` | `academic.manage` | إضافة فترة دراسية لسنة معينة. |
| **تعديل فترة دراسية** | `PUT` | `/api/v1/academic/terms/:id` | `academic.manage` | تعديل مسمى أو تواريخ الفترة. |
| **حذف فترة دراسية** | `DELETE` | `/api/v1/academic/terms/:id` | `academic.manage` | حذف فترة دراسية ما لم ترتبط بمناهج/درجات. |
| **تفعيل الفترة النشطة**| `POST` | `/api/v1/academic/terms/:id/set-current` | `academic.manage` | تفعيل الفترة كفترة نشطة وحيدة لنفس السنة. |

### 2.2 استجابات الفترات الدراسية
- **`POST /years/:year_id/terms` (201 Created):** `{"success": true, "message": "تم إنشاء الفترة بنجاح.", "data": {"id": 1, "name": "الفترة الأولى", "term_type": "first_term"}}`

---

## 🏛️ الخطوة 3: إدارة المراحل التعليمية (`academic_stages`)

> **الوصف:** تصنيف المراحل الدراسية بالمدرسة (مثال: `تمهيدي`, `ابتدائي`, `إعدادي`, `ثانوي`).

### 3.1 مسارات المراحل التعليمية
| العمل المخصص | HTTP Method | الـ Endpoint | الصلاحية | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- |
| **عرض الهيكل** | `GET` | `/api/v1/academic/stages` | `academic.view` | جلب شجرة المراحل مع صفوفها وشعبها. |
| **إضافة مرحلة** | `POST` | `/api/v1/academic/stages` | `academic.manage` | إضافة مرحلة تعليمية بالاسم والرمز البرمجي والترتيب. |
| **تعديل مرحلة** | `PUT` | `/api/v1/academic/stages/:id` | `academic.manage` | تعديل اسم أو ترتيب المرحلة. |
| **حذف مرحلة** | `DELETE` | `/api/v1/academic/stages/:id` | `academic.manage` | حذف مرحلة ما لم تضم صفوفاً تابعة (`RESTRICT`). |

### 3.2 استجابات المراحل التعليمية
- **`POST /stages` (201 Created):** `{"success": true, "message": "تم إنشاء المرحلة بنجاح.", "data": {"id": 1, "name": "المرحلة الابتدائية", "stage_code": "PRIMARY"}}`

---

## 🏫 الخطوة 4: إدارة الصفوف الدراسية وتحديد تبعيتها للمراحل (`classes`)

> **الوصف:** تعريف الصفوف وتحديد تبعيتها للمراحل (مثال: الصفوف 1-6 تتبع الابتدائي، 7-9 تتبع الإعدادي، 10-12 تتبع الثانوي).

### 4.1 مسارات الصفوف الدراسية
| العمل المخصص | HTTP Method | الـ Endpoint | الصلاحية | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- |
| **عرض الصفوف** | `GET` | `/api/v1/academic/classes` | `academic.view` | جلب صفوف مرحلة معينة. |
| **إضافة صف دراسي** | `POST` | `/api/v1/academic/classes` | `academic.manage` | إضافة صف وتحديد المرحلة التابع لها (`academic_stage_id`). |
| **تعديل صف دراسي** | `PUT` | `/api/v1/academic/classes/:id` | `academic.manage` | تعديل اسم أو ترتيب الصف. |
| **حذف صف دراسي** | `DELETE` | `/api/v1/academic/classes/:id` | `academic.manage` | حذف صف ما لم يضم شعباً أو مناهج (`RESTRICT`). |

### 4.2 استجابات الصفوف الدراسية
- **`POST /classes` (201 Created):** `{"success": true, "message": "تم إنشاء الصف وتسكينه بالمرحلة بنجاح.", "data": {"id": 5, "academic_stage_id": 1, "name": "الصف الخامس"}}`

---

## 🔠 الخطوة 5: إدارة بنك الشُعب العامة (`sections`)

> **الوصف:** بنك مسميات الشُعب العامة بالمدرسة (مثال: `الشعبة أ`, `الشعبة ب`, `الشعبة ج`).

### 5.1 مسارات الشُعب العامة
| العمل المخصص | HTTP Method | الـ Endpoint | الصلاحية | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- |
| **عرض بنك الشعب** | `GET` | `/api/v1/academic/sections` | `academic.view` | جلب مسميات الشُعب المتاحة. |
| **إضافة شعبة عامة**| `POST` | `/api/v1/academic/sections` | `academic.manage` | إضافة مسمى شعبة جديد. |
| **تعديل شعبة عامة**| `PUT` | `/api/v1/academic/sections/:id` | `academic.manage` | تعديل مسمى الشعبة العامة. |
| **حذف شعبة عامة**| `DELETE` | `/api/v1/academic/sections/:id` | `academic.manage` | حذف شعبة ما لم تكن مستخدمة بصفوف. |

---

## 📖 الخطوة 6: إدارة بنك المواد الدراسية العامة (`subjects`)

> **الوصف:** بنك المواد والمساقات التعليمية العامة بالمدرسة (مثال: `الرياضيات`, `العلوم`, `اللغة العربية`).

### 6.1 مسارات بنك المواد
| العمل المخصص | HTTP Method | الـ Endpoint | الصلاحية | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- |
| **عرض بنك المواد** | `GET` | `/api/v1/academic/subjects` | `academic.view` | جلب قائمة المواد وروموزها. |
| **إضافة مادة عامة** | `POST` | `/api/v1/academic/subjects` | `academic.manage` | إضافة مادة لبنك المواد العامة. |
| **تعديل مادة عامة** | `PUT` | `/api/v1/academic/subjects/:id` | `academic.manage` | تعديل اسم أو رمز المادة. |
| **حذف مادة عامة** | `DELETE` | `/api/v1/academic/subjects/:id` | `academic.manage` | حذف مادة ما لم تكن مسندة لمناهج. |

---

## 🧩 الخطوة 7: إدارة ربط وتسكين الشُعب بالصفوف (`class_sections`)

> **الوصف:** تخصيص وفتح الشُعب المتاحة لكل صف دراسي (مثال: فتح الشعبة أ والشعبة ب للصف الخامس -> `خامس/أ` و `خامس/ب`).

### 7.1 مسارات ربط الشعب بالصفوف
| العمل المخصص | HTTP Method | الـ Endpoint | الصلاحية | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- |
| **عرض شعب صف** | `GET` | `/api/v1/academic/classes/:class_id/sections` | `academic.view` | جلب الشُعب المفتوحة للصف الدراسي. |
| **ربط شعبة بصف** | `POST` | `/api/v1/academic/class-sections` | `academic.manage` | ربط صف بشعبة دراسية مفتوحة (`class_id`, `section_id`). |
| **فك ربط شعبة** | `DELETE` | `/api/v1/academic/class-sections/:id` | `academic.manage` | إزالة الشعبة من الصف ما لم تضم طلاباً مسجلين (`RESTRICT`). |

---

## 📝 الخطوة 8: إدارة مناهج الصفوف والدرجات لكل فترة دراسية (`class_subjects`)

> **الوصف:** إسناد المواد للصفوف الدراسية وتحديد الدرجة العظمى (`max_score`) ودرجة النجاح (`pass_score`) المخصصة لكل فترة دراسية بشكل مستقل ومفصل.

### 8.1 مسارات مناهج الصفوف والدرجات لكل فترة
| العمل المخصص | HTTP Method | الـ Endpoint | الصلاحية | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- |
| **عرض منهج الصف بالفترة**| `GET` | `/api/v1/academic/classes/:class_id/subjects?academic_term_id=1` | `academic.view` | جلب مواد الصف المقررة بفترة دراسية معينة. |
| **إسناد مادة لصف وفترة** | `POST` | `/api/v1/academic/classes/:class_id/subjects` | `academic.manage` | ربط مادة بصف وفترة دراسية وتحديد `max_score` و `pass_score`. |
| **تعديل درجات مادة بالفترة**| `PUT` | `/api/v1/academic/classes/:class_id/subjects/:id` | `academic.manage` | تعديل الدرجة العظمى والنجاح لهذه الفترة. |
| **حذف مادة من منهج الفترة**| `DELETE` | `/api/v1/academic/classes/:class_id/subjects/:subject_id?academic_term_id=1` | `academic.manage` | إزالة مادة من منهج فترة ما لم ترتبط باختبارات/حصص. |

### 8.2 تفاصيل استجابة إسناد مادة وتحديد درجات الفترة
* **Payload:**
```json
{
  "subject_id": 3,
  "academic_term_id": 1,
  "max_score": 100.00,
  "pass_score": 50.00,
  "order_index": 1
}
```
##### ✅ `201 Created`:
```json
{
  "success": true,
  "message": "تم إسناد مادة الرياضيات للصف الخامس للفترة الأولى بنجاح.",
  "data": {
    "id": 12,
    "class_id": 5,
    "subject_id": 3,
    "academic_term_id": 1,
    "max_score": 100.00,
    "pass_score": 50.00
  }
}
```
##### ❌ `422 Unprocessable`: `{"success": false, "message": "درجة النجاح يجب أن تكون أقل من أو تساوي الدرجة العظمى (max_score)."}`

---

## 4. مصفوفة معالجة الأخطاء الموحدة الشاملة (Global HTTP Error Matrix)

| كود الحالة | نوع الخطأ | هيكل الاستجابة المعياري |
| :--- | :--- | :--- |
| **`400 Bad Request`** | صياغة طلب غير صحيحة | `{"success": false, "message": "Malformed request payload."}` |
| **`401 Unauthorized`** | التوكن غير صالح أو منتهي | `{"success": false, "message": "Unauthenticated access."}` |
| **`403 Forbidden`** | عدم امتلاك صلاحيات أو انتهاك قيد قفل/ارتباط | `{"success": false, "message": "Unauthorized action or entity restricted by active relations."}` |
| **`404 Not Found`** | العنصر الأكاديمي غير موجود | `{"success": false, "message": "Academic resource not found."}` |
| **`409 Conflict`** | تكرار الربط أو انتهاك قيد تفرد | `{"success": false, "message": "Resource conflict or duplicate assignment."}` |
| **`422 Unprocessable`** | فشل التحقق من التواريخ أو الدرجات | `{"success": false, "message": "Validation failed.", "errors": {"field": ["..."]}}` |
| **`500 Server Error`** | خطأ خادم داخلي | `{"success": false, "message": "An internal server error occurred."}` |

# 🧪 استراتيجية ومصفوفة الاختبارات — المرحلة 06 (Testing Matrix)

> **الهدف:** توثيق مصفوفة الاختبارات الشاملة (Unit, Integration, Security/RBAC, Validation Tests) لنظام الواجبات المدرسية والتكاليف المنزلية لضمان مطابقة الـ API بنسبة 100% لـ [`MD/routes.md`](./routes.md) و [`MD/database.md`](../../database.md).

---

## 1. استراتيجية الاختبارات الشاملة (Testing Strategy)

1. **اختبارات التكامل وعقد الشبكة (Network & API Contract Tests):**
   - مطابقة مدخلات ومخرجات كافة المسارات الـ 4 لـ [`routes.md`](./routes.md) بنسبة 100%.
   - التحقق من دقة الترقيم القياسي (`meta.total`, `meta.current_page`) في استعراض القوائم ومحددات الفلترة (`class_id`, `class_section_id`, `teacher_id`, `status`).
2. **اختبارات الأمان وحوكمة الصلاحيات (RBAC & Security Tests):**
   - التحقق من رفض أي طلب بدون توكن برمز `401 Unauthorized`.
   - التحقق من منع المعلم من نشر واجب لشعبة أو مادة غير مسندة إليه رسمياً برمز `403 Forbidden`.
   - التحقق من منع الطلاب وأولياء الأمور من تعديل أو حذف الواجبات برمز `403 Forbidden`.
3. **اختبارات قيود منطق الأعمال وقواعد التحقق (Domain Invariants & Validation Tests):**
   - التحقق من رفض أي واجب يكون فيه `due_date < assigned_date` برمز `422 Unprocessable Entity`.
   - التحقق من صحة مصفوفة المرفقات بصيغة JSON.
   - التحقق من الحذف المنطقي (Soft Delete) عبر `deleted_at`.

---

## 2. مصفوفة حالات الاختبار (Test Cases Matrix)

| معرف الاختبار (Test ID) | نوع الاختبار | السيناريو ووصف الحالة | المدخلات المتوقعة | النتيجة والرمز المتوقع |
| :--- | :--- | :--- | :--- | :--- |
| `TC-ASG-01` | **Integration** | استرجاع قائمة الواجبات المدرسية بالفلترة بالصف والحالة النشطة | `GET /api/v1/assignments?class_id=5&status=active&page=1` | `200 OK` مع قائمة الواجبات و `meta`. |
| `TC-ASG-02` | **Integration** | استرجاع قائمة الواجبات المفلترة بالشعبة الدراسية | `GET /api/v1/assignments?class_section_id=5&page=1` | `200 OK` وواجبات الشعبة في السمستر. |
| `TC-ASG-03` | **Integration** | استرجاع قائمة الواجبات المفلترة بالمعلم | `GET /api/v1/assignments?teacher_id=3&page=1` | `200 OK` وواجبات المعلم الصادرة عنه. |
| `TC-ASG-04` | **Integration** | استرجاع التفاصيل الكاملة والمرفقات لواجب محدد | `GET /api/v1/assignments/1` | `200 OK` وكائن الواجب والمرفقات و `description`. |
| `TC-ASG-05` | **Unit / Validation** | **إنشاء واجب بنجاح:** نشر واجب لمادة وشعبة مسندة بتواريخ صالحة | `year: 1, term: 1, section: 5, assignment: 10, title: 'حل ص 45', assigned: '2026-09-10', due: '2026-09-15'` | `201 Created` وحفظ السجل بجدول `assignments`. |
| `TC-ASG-06` | **Validation** | **فشل تسلسل التواريخ:** تاريخ الاستحقاق يسبق تاريخ التكليف | `assigned_date: '2026-09-15', due_date: '2026-09-10'` | `422 Unprocessable` مع رسالة خطأ تسلسل التواريخ. |
| `TC-ASG-07` | **Security / RBAC** | **حظر النطاق:** معلم يحاول نشر واجب لشعبة غير مسندة إليه | طلب مع توكن معلم غير مسند للشعبة | `403 Forbidden` برسالة الحظر الرسمية. |
| `TC-ASG-08` | **Integration** | **تحديث واجب بنجاح:** تعديل العنوان والمرفقات وتمديد الاستحقاق | `PUT /api/v1/assignments/1` مع `due_date: '2026-09-17'` | `200 OK` وتحديث السجل. |
| `TC-ASG-09` | **Integration** | **حذف واجب منطقياً:** إرسال طلب الحذف من صاحب الصلاحية | `DELETE /api/v1/assignments/1` | `200 OK` وتعيين `deleted_at`. |
| `TC-ASG-10` | **Security / RBAC** | **حظر التعديل:** طالب يحاول تعديل أو حذف واجب | طلب `PUT` أو `DELETE` بتوكن طالب | `403 Forbidden`. |
| `TC-ASG-11` | **Negative** | طلب تفاصيل واجب محذوف أو غير موجود | `GET /api/v1/assignments/9999` | `404 Not Found`. |
| `TC-ASG-12` | **Security** | طلب أي مسار بدون توكن أو بتوكن منتهي | غياب ترويسة `Authorization` | `401 Unauthorized`. |

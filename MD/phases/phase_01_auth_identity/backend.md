# ⚙️ مواصفات Backend — المرحلة 01: الهوية والمصادقة والتدقيق (Domain Logic & Architecture)

> **الهدف:** توثيق منطق الأعمال الخلفي، وقواعد التحقق الصارمة، وحماية المعاملات الذرية (ACID Transactions)، والتشفير، والأحداث، وتوثيق التدقيق الخاص بمرحلة الهوية والمصادقة.  
> ⚠️ **ملاحظة تكامل حوكمية (DRY & SSoT):** كافة تفاصيل مسارات الـ HTTP، وهياكل طلبات واستجابات الـ JSON لكل حالة استجابة، ومصفوفة الـ Status Codes لكل رابط موثقة كمرجع حصري في [`routes.md`](./routes.md).

---

## 1. العمليات الخلفية ونقاط الدخول (Operations Mapping)

| العملية الخلفية (Service Method) | نقطة الدخول في الـ API | المرجع التفصيلي في `routes.md` | الغرض والمسؤولية المنطقية | الصلاحية / القيد |
| :--- | :--- | :--- | :--- | :--- |
| `AuthService::login` | `POST /api/v1/auth/login` | [البند 3.1 في `routes.md`](./routes.md#31-تسجيل-الدخول-الموحد-unified-login) | مطابقة `user_code` وكلمة المرور، فحص `is_active`، إصدار توكن JWT، تحديث `last_login_at`، وتسجيل الحركة. | عام (محدد بـ 5 طلبات/دقيقة) |
| `AuthService::getCurrentUser` | `GET /api/v1/auth/me` | [البند 3.2 في `routes.md`](./routes.md#32-استرجاع-الملف-الشخصي-والجلسة-النشطة-get-current-user--me) | استخراج معرف المستخدم من التوكن المفكك، استرجاع بيانات الملف الشخصي والصلاحيات. | توكن نشط صالح |
| `AuthService::logout` | `POST /api/v1/auth/logout` | [البند 3.3 في `routes.md`](./routes.md#33-تسجيل-الخروج-وإبطال-الجلسة-logout) | حذف سجل الجلسة من `personal_access_tokens` وتوثيق حركة الخروج في `audit_logs`. | توكن نشط صالح |
| `AuthService::changePassword` | `POST /api/v1/auth/change-password` | [البند 3.4 في `routes.md`](./routes.md#34-تغيير-كلمة-المرور-change-password) | التحقق من صحة كلمة المرور الحالية، تشفير وتحديث كلمة المرور الجديدة، وتوثيق العملية. | توكن نشط صالح |
| `AuthService::seedSuperAdmin` | *Database Seeder* | - | زرع حساب المدير الافتراضي (`ADM-1001`) بكلمة مرور مشفرة عند تهيئة المنظومة. | عملية تهيئة النظام |

---

## 2. قواعد التحقق الصارم عند الحدود (Ingress Validation Invariants)

يجب تطبيق التحقق الشامل على كافة الطلبات قبل تمريرها لطبقة الخدمات:

### 2.1 قواعد التحقق لعملية تسجيل الدخول (`LoginRequest`):
1. **`user_code`:**
   * مطلوب (`required`).
   * نصي (`string`)، بحد أقصى 30 حرفاً.
   * يطابق التنسيق المؤسسي المعتمد حصراً (`regex: /^(ADM|TCH|STU|PAR)-[0-9A-Za-z]+$/`).
   * تطهير المدخلات من أي مسافات زائدة (`trim`).
2. **`password`:**
   * مطلوب (`required`).
   * نصي (`string`)، الحد الأدنى 8 أحرف.
3. **`device_name`:**
   * اختياري (`nullable`)، نصي بحد أقصى 255 حرفاً.

### 2.2 قواعد التحقق لتغيير كلمة المرور (`ChangePasswordRequest`):
1. **`current_password`:**
   * مطلوب (`required`).
   * نصي (`string`).
2. **`new_password`:**
   * مطلوب (`required`).
   * نصي (`string`)، لا يقل عن 8 أحرف، يحتوي على حروف وأرقام ورموز.
   * إلزامي التأكيد مع حقل `new_password_confirmation` (`confirmed`).
   * يجب أن يختلف عن كلمة المرور الحالية (`different:current_password`).

---

## 3. منطق وقواعد العمل للعمليات (Domain Logic & Execution Flow)

### 3.1 منطق تسجيل الدخول (Login Workflow):
1. **استعلام المستخدم النشط:**
   * البحث عن المستخدم المطابق لـ `user_code` المستلم.
   * في حال عدم وجود المستخدم، أو كونه محذوفاً منطقياً (`deleted_at IS NOT NULL`): إرجاع خطأ `401 Unauthorized` (مع تسجيل محاولة دخول فاشلة في `audit_logs`).
2. **فحص حالة الحساب (`is_active`):**
   * إذا كانت قيمة `is_active = 0`: إيقاف العملية فوراً وإرجاع `403 Forbidden` برسالة واضحة تفيد بتعطيل الحساب.
3. **مطابقة كلمة المرور:**
   * مطابقة كلمة المرور المدخلة مع الـ Hash المخزن في `users.password` باستخدام `Hash::check()`.
   * إذا تطابقت كلمة المرور: المتابعة. وإذا فشلت: إرجاع `401 Unauthorized` وتوثيق المحاولة الفاشلة.
4. **توليد توكن الجلسة (JWT Token Generation):**
   * توليد توكن مصادقة يحتوي على (معرف المستخدم `sub`, الدور `role`, وقت الإصدار `iat`, وقت الانتهاء `exp = now + 24 hours`).
   * حساب تجزئة التوكن `token_hash = hash('sha256', $plainTextToken)`.
5. **المعاملة الذرية (Atomic Commit):**
   * حفظ سجل الجلسة في `personal_access_tokens` (`user_id`, `token_hash`, `device_name`, `ip_address`, `expires_at`).
   * تحديث حقل `last_login_at = now()` في جدول `users`.
   * إدراج سجل حركة الدخول في `audit_logs` (`action = 'login'`).

---

### 3.2 منطق تسجيل الخروج (Logout Workflow):
1. استخراج التوكن الحالي من الترويسة `Authorization: Bearer`.
2. البحث عن تجزئة التوكن في `personal_access_tokens` وحذف السجل نهائياً.
3. تسجيل حركة الخروج في `audit_logs` (`action = 'logout'`).

---

### 3.3 منطق تغيير كلمة المرور (Change Password Workflow):
1. التحقق من مطابقة `current_password` مع كلمة مرور المستخدم الحالية.
2. تشفير كلمة المرور الجديدة: `$newHash = Hash::make($newPassword)`.
3. تحديث حقل `users.password` داخل Transaction.
4. تسجيل حركة تغيير كلمة المرور في `audit_logs` (`action = 'password_change'`).

---

## 4. المعاملات الذرية والتراجع (ACID Transactions & Boundaries)

* عملية تسجيل الدخول تُنفذ داخل **معاملة ذرية واحدة (`DB::transaction`)**:
  ```php
  DB::transaction(function () use ($user, $tokenData, $request) {
      // 1. إدراج جلسة التوكن
      PersonalAccessToken::create($tokenData);
      
      // 2. تحديث وقت آخر دخول
      $user->update(['last_login_at' => now()]);
      
      // 3. توثيق سجل التدقيق
      AuditLog::create([
          'user_id'     => $user->id,
          'action'      => 'login',
          'entity_type' => 'User',
          'entity_id'   => $user->id,
          'ip_address'  => $request->ip(),
          'user_agent'  => $request->userAgent()
      ]);
  });
  ```
* في حال حدوث أي خطأ غير متوقع، يتم التراجع الشامل (`Rollback`) التلقائي لمنع بقاء جلسات غير مسجلة أو بيانات غير متسقة.

---

## 5. تهيئة حساب المدير الافتراضي (Super Admin Seeder)

عند تشغيل أمر التهيئة الأولي لقاعدة البيانات (`Database Seeder`):
* يتم التحقق من وجود حساب المدير الأساسي، وفي حال عدم وجوده يتم إنشاؤه بالبيانات المرجعية التالية:
  * **`user_code`:** `ADM-1001`
  * **`password`:** مشفرة لخوارزمية `bcrypt` (القيمة الافتراضية للتهيئة الأولى: `Admin@123456`).
  * **`role_type`:** `admin`.
  * **`is_active`:** `1`.

---

## 6. بوابات الحماية والصلاحيات (Auth Middleware & Guards)

1. **`AuthenticateWithToken` Middleware:**
   * فحص ترويسة `Authorization: Bearer`.
   * فك تشفير التوكن، ومطابقة `token_hash` مع `personal_access_tokens`.
   * التحقق من عدم انتهاء الصلاحية (`expires_at > now()`).
   * التحقق من أن حساب المستخدم نشط (`is_active = 1`) وغير محذوف منطقياً.
2. **`RequireRole` Middleware:**
   * التحقق من تطابق `role_type` للمستخدم مع الدور المطلوب للمسار (`admin`, `teacher`, `student`, `parent`).

---

## 7. استراتيجية الاختبارات الآلية للباك إند (Testing Strategy)

يجب توفير حزمة اختبارات تغطي كافة المسارات بنسبة نجاح **100%**:
1. **اختبارات المصادقة والدخول:**
   * اختبار تسجيل الدخول بنجاح برمز وكلمة مرور صحيحة واستلام توكن صالح.
   * اختبار فشل الدخول بكلمة مرور خاطئة وإرجاع `401 Unauthorized`.
   * اختبار فشل الدخول برمز غير موجود وإرجاع `401 Unauthorized`.
   * اختبار منع دخول الحساب المعطل (`is_active = 0`) وإرجاع `403 Forbidden`.
   * اختبار تجاوز معدل الطلبات (أكثر من 5 محاولات) وإرجاع `429 Too Many Requests`.
2. **اختبارات استرجاع الملف الشخصي (`/me`):**
   * اختبار استرجاع البيانات بتوكن صالح (`200 OK`).
   * اختبار رفض الطلب بدون توكن أو بتوكن منتهي (`401 Unauthorized`).
3. **اختبارات تسجيل الخروج:**
   * اختبار حذف التوكن بنجاح بعد استدعاء `/logout` ومنع استخدامه لاحقاً.
4. **اختبارات التدقيق (Audit Logging):**
   * التأكد من إدراج سجل في `audit_logs` لكل عملية دخول وخروج وتغيير كلمة مرور.

---

## 8. معايير القبول والاكتمال للباك إند (Backend Acceptance Criteria)

- [ ] خدمة المصادقة `AuthService` مبنية وتلبي كافة الشروط المحددة.
- [ ] قواعد التحقق `LoginRequest` و `ChangePasswordRequest` مطبقة عند الحدود.
- [ ] جميع العمليات المتعددة مغلفة بـ ACID Transactions.
- [ ] التوكنات مشفرة وتُفحص صلاحيتها في كل طلب.
- [ ] مسجل التدقيق يسجل الأحداث تلقائياً بالـ IP والـ User-Agent.
- [ ] سكريبت التهيئة الافتراضي لحساب المدير الأساسي جاهز ومختبر.
- [ ] كافة الاختبارات الآلية تجتاز بنجاح 100%.

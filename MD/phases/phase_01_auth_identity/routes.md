# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 01: الهوية والمصادقة والتدقيق (Network SSoT)

> **الهدف:** توثيق كافة نقاط الاتصال البرمجية (RESTful API Endpoints) الخاصة بمرحلة الهوية والمصادقة، بما يشمل المعاملات، وهياكل الطلبات (Request Payloads)، وكافة أنواع الاستجابات المحتملة لكل رابط (نجاح، أخطاء تحقق، مصادقة، صلاحيات، تعارض، تجاوز المعدل، أخطاء خادم).

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **المسار الأساسي (Base URI):** `/api/v1/auth`
- **بروتوكول النقل (Protocol):** `HTTPS`
- **صيغة البيانات (Data Format):** `JSON` (`application/json`)
- **الترويسات العامة الإلزامية (Common Headers):**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Accept: application/json
  Content-Type: application/json
  Accept-Language: ar
  ```
- **حدود معدل الطلبات (Rate Limiting & Brute Force Protection):**
  - مسار تسجيل الدخول (`/login`): `5 requests / minute` لكل عنوان IP لمنع هجمات التخمين (Brute-force).
  - باقي المسارات العامة: `60 requests / minute` لكل توكن نشط.

---

## 2. مصفوفة نقاط الاتصال الشاملة (Endpoints Master Matrix)

| العملية (Action) | HTTP Method | الـ Endpoint | المصادقة | الصلاحية المطلوبة (Permission) | الغرض والوظيفة |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **تسجيل الدخول** | `POST` | `/api/v1/auth/login` | عام (Public) | لا يوجد (Any Guest) | التحقق من `user_code` وكلمة المرور وإصدار توكن JWT وتوثيق الدخول. |
| **الملف الشخصي** | `GET` | `/api/v1/auth/me` | مطلوبة (Bearer) | مسجل دخول نشط | استرجاع بيانات الحساب، الدور، والصلاحيات لتوجيه الواجهة. |
| **تسجيل الخروج** | `POST` | `/api/v1/auth/logout` | مطلوبة (Bearer) | مسجل دخول نشط | إبطال التوكن الحالي وحذف الجلسة من `personal_access_tokens`. |
| **تغيير كلمة المرور** | `POST` | `/api/v1/auth/change-password` | مطلوبة (Bearer) | مسجل دخول نشط | تغيير كلمة المرور للمستخدم بعد مطابقة كلمة المرور الحالية. |

---

## 3. تفاصيل عقود الطلب والاستجابة الشاملة لكل Endpoint

---

### 3.1 تسجيل الدخول الموحد (Unified Login)

* **المسار:** `POST /api/v1/auth/login`
* **الوصف:** مصادقة المستخدم عبر الرمز المؤسسي الموحد (`user_code`) وإصدار توكن الجلسة.
* **جسم الطلب (Request Payload):**
```json
{
  "user_code": "ADM-1001",
  "password": "SecretPassword@123",
  "device_name": "Chrome on Windows 11"
}
```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح تسجيل الدخول):
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_at": "2026-08-29T16:30:00Z",
    "user": {
      "id": 1,
      "user_code": "ADM-1001",
      "role_type": "admin",
      "is_active": 1,
      "last_login_at": "2026-08-28T16:30:00Z"
    }
  }
}
```

##### ⚠️ `400 Bad Request` (صياغة JSON مشوهة):
```json
{
  "success": false,
  "message": "جسم الطلب غير صالح أو تالف (Malformed JSON)."
}
```

##### 🔒 `401 Unauthorized` (بيانات الدخول غير صحيحة):
```json
{
  "success": false,
  "message": "رمز المستخدم أو كلمة المرور غير صحيحة."
}
```

##### 🚫 `403 Forbidden` (الحساب معطل أو موقوف):
```json
{
  "success": false,
  "message": "هذا الحساب معطل حالياً من قِبل إدارة المدرسة. يرجى مراجعة الإدارة."
}
```

##### ❌ `422 Unprocessable Entity` (فشل التحقق من المدخلات):
```json
{
  "success": false,
  "message": "البيانات المدخلة غير مستوفية للشروط.",
  "errors": {
    "user_code": ["حقل رمز المستخدم مطلوب."],
    "password": ["حقل كلمة المرور مطلوب."]
  }
}
```

##### ⏳ `429 Too Many Requests` (تجاوز محاولات الدخول):
```json
{
  "success": false,
  "message": "تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى الانتظار دقيقة واحدة والمحاولة مجدداً."
}
```

##### 💥 `500 Internal Server Error` (خطأ خادم داخلي):
```json
{
  "success": false,
  "message": "حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول. يرجى المحاولة لاحقاً."
}
```

---

### 3.2 استرجاع الملف الشخصي والجلسة النشطة (Get Current User / Me)

* **المسار:** `GET /api/v1/auth/me`
* **الوصف:** استرجاع بيانات المستخدم الحالي الموثق بالتوكن النشط لتوجيه الواجهة وضبط الصلاحيات.
* **الترويسات الإلزامية:** `Authorization: Bearer <ACCESS_TOKEN>`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح جلب البيانات):
```json
{
  "success": true,
  "message": "تم استرجاع بيانات المستخدم بنجاح.",
  "data": {
    "id": 1,
    "user_code": "ADM-1001",
    "role_type": "admin",
    "is_active": 1,
    "last_login_at": "2026-08-28T16:30:00Z",
    "created_at": "2026-08-25T10:00:00Z"
  }
}
```

##### 🔒 `401 Unauthorized` (التوكن مفقود أو منتهي الصلاحية):
```json
{
  "success": false,
  "message": "جلسة الدخول غير صالحة أو منتهية. يرجى تسجيل الدخول مجدداً."
}
```

##### 🚫 `403 Forbidden` (الحساب تم تعطيله بعد تسجيل الدخول):
```json
{
  "success": false,
  "message": "تم إيقاف صلاحية هذا الحساب. يرجى مراجعة إدارة المدرسة."
}
```

##### 💥 `500 Internal Server Error` (خطأ خادم):
```json
{
  "success": false,
  "message": "تعذر استرجاع بيانات الملف الشخصي."
}
```

---

### 3.3 تسجيل الخروج وإبطال الجلسة (Logout)

* **المسار:** `POST /api/v1/auth/logout`
* **الوصف:** إبطال توكن الجلسة الحالية وشطبها من `personal_access_tokens` وتسجيل حركة الخروج في `audit_logs`.
* **الترويسات الإلزامية:** `Authorization: Bearer <ACCESS_TOKEN>`

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح تسجيل الخروج):
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح وإبطال جلسة العمل."
}
```

##### 🔒 `401 Unauthorized` (غير مصادق عليه):
```json
{
  "success": false,
  "message": "المستخدم غير مصادق عليه أو الجلسة ملغاة مسبقاً."
}
```

##### 💥 `500 Internal Server Error` (خطأ خادم):
```json
{
  "success": false,
  "message": "حدث خطأ أثناء محاولة تسجيل الخروج."
}
```

---

### 3.4 تغيير كلمة المرور (Change Password)

* **المسار:** `POST /api/v1/auth/change-password`
* **الوصف:** تمكين المستخدم الحالي من تحديث كلمة المرور الخاصة به بعد التحقق الإلزامي من كلمة المرور الحالية.
* **الترويسات الإلزامية:** `Authorization: Bearer <ACCESS_TOKEN>`
* **جسم الطلب (Request Payload):**
```json
{
  "current_password": "OldPassword@123",
  "new_password": "NewSecurePassword@2026",
  "new_password_confirmation": "NewSecurePassword@2026"
}
```

#### استجابات هذا الرابط (Responses):

##### ✅ `200 OK` (نجاح تغيير كلمة المرور):
```json
{
  "success": true,
  "message": "تم تحديث كلمة المرور بنجاح."
}
```

##### 🔒 `401 Unauthorized` (غير مصادق عليه):
```json
{
  "success": false,
  "message": "جلسة الدخول غير صالحة."
}
```

##### ❌ `422 Unprocessable Entity` (فشل التحقق أو كلمة المرور الحالية غير صحيحة):
```json
{
  "success": false,
  "message": "فشل التحقق من صحة البيانات المدخلة.",
  "errors": {
    "current_password": ["كلمة المرور الحالية غير صحيحة."],
    "new_password": [
      "يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.",
      "يجب أن تتطابق كلمة المرور الجديدة مع حقل التأكيد."
    ]
  }
}
```

##### 💥 `500 Internal Server Error` (خطأ خادم):
```json
{
  "success": false,
  "message": "فشل تحديث كلمة المرور بسبب خطأ داخلي في الخادم."
}
```

---

## 4. مصفوفة معالجة الأخطاء الموحدة الشاملة (Global HTTP Error Matrix)

| كود الحالة | نوع الخطأ | هيكل الاستجابة المعياري |
| :--- | :--- | :--- |
| **`400 Bad Request`** | صياغة طلب JSON خاطئة | `{"success": false, "message": "Malformed request payload."}` |
| **`401 Unauthorized`** | غياب أو انتهاء التوكن | `{"success": false, "message": "Unauthenticated access."}` |
| **`403 Forbidden`** | حساب معطل أو عدم امتلاك صلاحية | `{"success": false, "message": "Account deactivated or permission denied."}` |
| **`404 Not Found`** | المسار أو المستخدم غير موجود | `{"success": false, "message": "Resource not found."}` |
| **`422 Unprocessable`** | فشل التحقق من المدخلات | `{"success": false, "message": "Validation failed.", "errors": {"field": ["..."]}}` |
| **`429 Rate Limit`** | تجاوز معدل المحاولات | `{"success": false, "message": "Too many requests. Please try again later."}` |
| **`500 Server Error`** | خطأ خادم داخلي | `{"success": false, "message": "An internal server error occurred."}` |

---

## 5. قواعد الحماية وأمان المسارات (Security & Protection Invariants)

1. **حماية التخمين (Throttle & Brute Force):** تطبيق Rate Limiter صارم (5 محاولات في الدقيقة) على مسار `/login`.
2. **تشفير كلمات المرور:** تشفير كلمات المرور خوارزمياً باستخدام `bcrypt` (عامل كلفة لا يقل عن 12) أو `argon2id`.
3. **تخزين تجزئة التوكن:** حفظ التوكن في قاعدة البيانات كـ `SHA-256 Hash` لمنع تسريبه حتى لو سُحبت قاعدة البيانات.
4. **التدقيق التلقائي (Audit Logging):** تسجيل كافة محاولات الدخول (الناجحة والفاشلة) وعمليات الخروج وتغيير كلمة المرور في `audit_logs` مع الـ IP والـ User-Agent.

---

## 6. معايير القبول والاكتمال لمسارات الـ API (Acceptance Criteria)

- [ ] كافة المسارات الأربعة المذكورة مسجلة وتعمل بـ HTTP Methods المحددة.
- [ ] مسار `/login` يطابق الرموز المؤسسية المعتمدة (`ADM-`, `TCH-`, `STU-`, `PAR-`) بدقة.
- [ ] التحقق الصارم مطبق مع إرجاع كود `422` وهيكل أخطاء دقيق لكل حقل.
- [ ] التوكن الصادر يعمل بنجاح في حماية المسارات مع التحقق من الصلاحية والانتهاء.
- [ ] مسار `/logout` يشطب التوكن فوراً ويمنع إعادة استخدامه.
- [ ] كافة الاستجابات الموثقة تغطي جميع حالات الـ HTTP بنسبة 100%.

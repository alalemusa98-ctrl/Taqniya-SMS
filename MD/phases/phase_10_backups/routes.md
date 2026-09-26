# 🗺️ مواصفات المسارات ونقاط الاتصال — المرحلة 10: النسخ الاحتياطي واستعادة البيانات (Network SSoT)

> **الهدف:** توثيق المسارات الستة لإدارة النسخ الاحتياطية وتوليد ملفات الـ SQL المضغوطة والاستعادة والتنزيل والرفع والحذف مع الاستجابات الصريحة لجميع حالات الـ HTTP Status Codes والـ Payload المطابق لـ [`MD/database.md`](../../database.md).
> 
> ⚠️ **إرشادات وتنبيهات حوكمية إجبارية (System Governance Directives):**  
> 1. **قواعد العمل العامة (Business Rules SSoT):** يلزم قراءة واعتماد **ملف القواعد العامة بالمنظومة [`MD/business_rules.md`](../../business_rules.md)** والالتزام التام بكافة القيود ومصفوفة الصلاحيات والحوكمة المذكورة فيه.  
> 2. **مرجع شبكة الطلبات والاستجابات (Network SSoT):** يعتبر هذا الملف ([`routes.md`](./routes.md)) هو المصدر الرئيسي والوحيد لعقد الشبكة بالمنظومة؛ حيث تم توثيق **جسم الطلب الكامل (`Request Body Payload`)** لكل رابط، و**كامل شكل الاستجابة الصريحة (`Response Body Payload`)** لجميع الرموز والـ Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `500 Internal Server Error`).  
> 📌 **توجيه إجباري عند البناء والتطوير:** يلتزم المطور بالكامل برسم وبناء مدخلات ومخرجات كود الـ Controllers والواجهات بناءً على الهياكل والرموز المسجلة في هذا الملف حصراً بدون أي اجتهاد شخصي.

---

## 1. الإعدادات والترويسات العامة (API Base Configuration)

- **Base URI:** `/api/v1`
- **Protocol:** `HTTPS`
- **Data Format:** `JSON` (`application/json`) / `Multipart` للرفع / `Binary Stream` للتنزيل
- **Required Headers:**
  ```http
  Authorization: Bearer <TOKEN>
  Accept: application/json
  Accept-Language: ar
  ```

### 📋 مصفوفة المسارات الستة (Master Route Matrix):

| # | الكيان | HTTP Method | Endpoint | الصلاحية المطلوبة | الغرض والوظيفة |
| :-: | :--- | :---: | :--- | :---: | :--- |
| **1** | `backups` | `GET` | `/api/v1/backups` | `admin` | استعراض قائمة النسخ الاحتياطية وإحصائيات الحجم والتاريخ والملاحظات |
| **2** | `backups` | `POST` | `/api/v1/backups/create` | `admin` | إنشاء وتوليد نسخة احتياطية فورية ومضغوطة لقاعدة البيانات |
| **3** | `backups` | `POST` | `/api/v1/backups/upload` | `admin` | رفع واستيراد ملف نسخة احتياطية `.zip` من جهاز المستخدم |
| **4** | `backups` | `POST` | `/api/v1/backups/restore/:filename` | `admin` | استعادة قاعدة البيانات من ملف نسخة احتياطية محدد |
| **5** | `backups` | `GET` | `/api/v1/backups/download/:filename` | `admin` | تنزيل وتحميل ملف النسخة الاحتياطية `.zip` إلى الجهاز |
| **6** | `backups` | `DELETE` | `/api/v1/backups/:filename` | `admin` | حذف ملف النسخة الاحتياطية نهائياً من الخادم |

---

### 🔒 1.1 نمط الاستجابات العامة للأخطاء المشتركة (Global Standard Error Responses)

```json
// 401 Unauthorized
{
  "success": false,
  "message": "غير مصرح بالوصول. التوكن غير صالح أو منتهي الصلاحية."
}

// 403 Forbidden
{
  "success": false,
  "message": "ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء."
}

// 500 Internal Server Error
{
  "success": false,
  "message": "حدث خطأ غير متوقع في الخادم أثناء معالجة النسخ الاحتياطي."
}
```

---

## 📄 تفصيل المسارات الستة

---

### 1.1 `GET /api/v1/backups` — استعراض قائمة النسخ الاحتياطية وإحصائياتها

> **الوصف الوظيفي:** فحص مجلد النسخ الاحتياطية واستخراج قائمة بكافة ملفات الـ ZIP مع قراءة الملاحظة الوصفية (`note.txt`) وحجم كل ملف وتاريخ إنشائه مع إجمالي المساحة المستهلكة.

#### 🔐 الصلاحيات:
- `admin` فقط.

#### 📥 مدخلات الطلب (Query Parameters):
- لا توجد مدخلات إجبارية.

#### 📤 الاستجابة الناجحة (`200 OK`):
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_backups": 3,
      "total_size": "14.25 MB",
      "storage_directory": "storage/backups"
    },
    "backups": [
      {
        "filename": "backup_2026-09-26_22-30-00_database.zip",
        "size": "4.75 MB",
        "size_bytes": 4980736,
        "created_at": "2026-09-26 22:30:00",
        "note": "نسخة احتياطية قبل اعتماد الترحيل السنوي"
      },
      {
        "filename": "backup_2026-09-20_18-15-00_database.zip",
        "size": "4.72 MB",
        "size_bytes": 4949248,
        "created_at": "2026-09-20 18:15:00",
        "note": "نسخة احتياطية دورية أسبوعية"
      },
      {
        "filename": "backup_2026-09-01_10-00-00_database.zip",
        "size": "4.78 MB",
        "size_bytes": 5012224,
        "created_at": "2026-09-01 10:00:00",
        "note": null
      }
    ]
  }
}
```

---

### 1.2 `POST /api/v1/backups/create` — إنشاء نسخة احتياطية فورية لقاعدة البيانات

> **الوصف الوظيفي:** تصدير كافة جداول وبيانات قاعدة البيانات بهيكل SQL نظيف وتجزئة دفعية، وضغط الملف مع ملف الملاحظة `note.txt` داخل أرشيف ZIP باسم معياري وحفظه في مسار التخزين.

#### 🔐 الصلاحيات:
- `admin` فقط.

#### 📥 جسم الطلب (`Request Body`):
```json
{
  "note": "نسخة احتياطية قبل اعتماد نتائج الدور الثاني"
}
```

#### 📤 الاستجابة الناجحة (`201 Created`):
```json
{
  "success": true,
  "message": "تم إنشاء النسخة الاحتياطية بنجاح.",
  "data": {
    "filename": "backup_2026-09-26_22-45-10_database.zip",
    "size": "4.76 MB",
    "size_bytes": 4991200,
    "created_at": "2026-09-26 22:45:10",
    "note": "نسخة احتياطية قبل اعتماد نتائج الدور الثاني"
  }
}
```

#### ❌ استجابة الخطأ (`500 Internal Server Error`):
```json
{
  "success": false,
  "message": "تعذر إنشاء النسخة الاحتياطية لقاعدة البيانات: [تفاصيل الخطأ]"
}
```

---

### 1.3 `POST /api/v1/backups/upload` — رفع واستيراد نسخة احتياطية من جهاز المستخدم

> **الوصف الوظيفي:** استقبال ملف مضغوط `.zip` من المستخدم والتحقق من سلامة الأرشيف واحتوائه على ملف SQL صالح، ثم حفظه في مجلد النسخ ليكون متاحاً للاستعادة.

#### 🔐 الصلاحيات:
- `admin` فقط.

#### 📥 جسم الطلب (`Multipart Form Data`):
- `file`: File (`.zip` حتى حجم أقصى 512MB).

#### 📤 الاستجابة الناجحة (`201 Created`):
```json
{
  "success": true,
  "message": "تم رفع النسخة الاحتياطية بنجاح.",
  "data": {
    "filename": "backup_2026-09-26_22-50-00_database.zip",
    "size": "4.75 MB",
    "size_bytes": 4980736,
    "created_at": "2026-09-26 22:50:00",
    "note": "نسخة مستوردة من الخادم الاحتياطي"
  }
}
```

#### ❌ استجابات الخطأ:
```json
// 400 Bad Request (نوع ملف غير مدعوم أو حجم زائد)
{
  "success": false,
  "message": "يجب رفع ملف مضغوط صالح بصيغة ZIP وبحجم لا يتجاوز 512 ميجابايت."
}

// 422 Unprocessable Entity (الملف المضغوط لا يحتوي على database.sql سليم)
{
  "success": false,
  "message": "ملف الأرشيف المضغوط غير صالح أو لا يحتوي على ملف قاعدة بيانات database.sql سليم."
}
```

---

### 1.4 `POST /api/v1/backups/restore/:filename` — استعادة قاعدة البيانات من نسخة محددة

> **الوصف الوظيفي:** فك ضغط ملف النسخة المحددة في مسار مؤقت، وتعطيل قيود المفاتيح الأجنبية `SET FOREIGN_KEY_CHECKS=0;`، ثم تنفيذ استعلامات الـ SQL بالكامل لإعادة بناء الجداول واسترجاع البيانات، وإعادة تفعيل القيود وتنظيف الملفات المؤقتة.

#### 🔐 الصلاحيات:
- `admin` فقط.

#### 📥 معاملات الرابط (`Path Parameters`):
- `filename`: اسم ملف النسخة الاحتياطية (مثال: `backup_2026-09-26_22-30-00_database.zip`).

#### 📤 الاستجابة الناجحة (`200 OK`):
```json
{
  "success": true,
  "message": "تمت استعادة قاعدة البيانات من النسخة الاحتياطية بنجاح.",
  "data": {
    "filename": "backup_2026-09-26_22-30-00_database.zip",
    "restored_at": "2026-09-26 22:52:30"
  }
}
```

#### ❌ استجابات الخطأ:
```json
// 404 Not Found
{
  "success": false,
  "message": "ملف النسخة الاحتياطية غير موجود."
}

// 422 Unprocessable Entity (فشل أثناء تنفيذ استعلامات SQL)
{
  "success": false,
  "message": "فشلت استعادة قاعدة البيانات: [تفاصيل خطأ التنفيذ]"
}
```

---

### 1.5 `GET /api/v1/backups/download/:filename` — تنزيل ملف النسخة الاحتياطية

> **الوصف الوظيفي:** إرسال ملف الـ ZIP المضغوط كدفق ثنائي (Binary Stream) للمتصفح لتحميله وحفظه على جهاز الإدارة بأمان.

#### 🔐 الصلاحيات:
- `admin` فقط.

#### 📥 معاملات الرابط (`Path Parameters`):
- `filename`: اسم ملف النسخة الاحتياطية.

#### 📤 الاستجابة الناجحة (`200 OK`):
- `Content-Type`: `application/zip`
- `Content-Disposition`: `attachment; filename="backup_2026-09-26_22-30-00_database.zip"`
- `Content-Length`: `4980736`
- **Body:** Binary Stream of ZIP file.

#### ❌ استجابة الخطأ (`404 Not Found`):
```json
{
  "success": false,
  "message": "ملف النسخة الاحتياطية غير موجود."
}
```

---

### 1.6 `DELETE /api/v1/backups/:filename` — حذف ملف النسخة الاحتياطية

> **الوصف الوظيفي:** إزالة وحذف ملف النسخة المضغوطة المحدد نهائياً من مجلد التخزين بالخادم.

#### 🔐 الصلاحيات:
- `admin` فقط.

#### 📥 معاملات الرابط (`Path Parameters`):
- `filename`: اسم ملف النسخة الاحتياطية المراد حذفها.

#### 📤 الاستجابة الناجحة (`200 OK`):
```json
{
  "success": true,
  "message": "تم حذف النسخة الاحتياطية بنجاح.",
  "data": {
    "filename": "backup_2026-09-26_22-30-00_database.zip",
    "deleted_at": "2026-09-26 22:55:00"
  }
}
```

#### ❌ استجابة الخطأ (`404 Not Found`):
```json
{
  "success": false,
  "message": "ملف النسخة الاحتياطية غير موجود أو تم حذفه مسبقاً."
}
```

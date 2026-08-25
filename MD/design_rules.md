# 🎨 القيم البصرية وقواعد التصميم لنظام إدارة المدارس (Design Tokens & Spatial UI)

> **المحددات والمتغيرات البصرية ونظام التصميم المعتمد لمشروع إدارة المدارس (Taqniya-SMS).**  
> ⚠️ **ملاحظة:** يتبع النظام فلسفة Spatial UI (VisionOS Inspired) بدعم أصيل كامل للغة العربية (RTL Native).

---

## 🔤 1. الخطوط والطبوغرافيا (Typography)
- **الخط الأساسي للواجهات (Arabic & Latin):** `'Cairo', 'Alexandria', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **خط الأرقام والبيانات المالية والبرمجية:** `'Fira Code', 'JetBrains Mono', monospace`
- **أوزان الخطوط المعتمدة:**
  * Regular: `400` (للنصوص العامة والفقرات)
  * Medium: `500` (لعناصر القوائم والتسميات التوضيحية)
  * Semi-Bold: `600` (لعناوين الأقسام والبطاقات)
  * Bold: `700` (للعناوين الرئيسية والأرقام البارزة)
- **مقياس أحجام النصوص:**
  * `text-xs`: `12px` (0.75rem) — التسميات والحالات
  * `text-sm`: `14px` (0.875rem) — الجداول والمدخلات
  * `text-base`: `16px` (1.00rem) — المتن الأساسي
  * `text-lg`: `18px` (1.125rem) — عناوين البطاقات
  * `text-xl`: `20px` (1.25rem) — عناوين الأقسام
  * `text-2xl`: `24px` (1.50rem) — عناوين الصفحات
  * `text-3xl`: `30px` (1.875rem) — الأرقام والإحصائيات الرئيسية

---

## 🎨 2. لوحة الألوان (Spatial Color Palette)

### 🔵 الألوان الرئيسية للهوية المدرسية (Brand Colors)
- **Primary Indigo:** `#4F46E5` (Indigo 600) — التفاعل الأساسي والأزرار
- **Primary Hover:** `#4338CA` (Indigo 700)
- **Primary Light / Subtle:** `#EEF2FF` (Indigo 50)
- **Secondary Teal / Emerald:** `#0D9488` (Teal 600) — المؤشرات الأكاديمية والنجاح
- **Accent Purple:** `#7C3AED` (Purple 600) — الإحصائيات وبوابات التميز

### ⚪ الألوان المحايدة والأسطح (Light & Dark Theme Surfaces)
- **الوضع الفاتح (Light Mode):**
  * `bg-canvas`: `#F8FAFC` (Slate 50)
  * `bg-surface`: `#FFFFFF`
  * `bg-surface-glass`: `rgba(255, 255, 255, 0.85)` مع `backdrop-blur-md`
  * `text-primary`: `#0F172A` (Slate 900)
  * `text-secondary`: `#475569` (Slate 600)
  * `text-muted`: `#94A3B8` (Slate 400)
  * `border-default`: `#E2E8F0` (Slate 200)
- **الوضع الداكن (Dark Mode):**
  * `bg-canvas`: `#0B0F19` (Deep Obsidian)
  * `bg-surface`: `#111827` (Gray 900)
  * `bg-surface-glass`: `rgba(17, 24, 39, 0.85)` مع `backdrop-blur-md`
  * `text-primary`: `#F9FAFB` (Gray 50)
  * `text-secondary`: `#9CA3AF` (Gray 400)
  * `text-muted`: `#6B7280` (Gray 500)
  * `border-default`: `rgba(255, 255, 255, 0.08)`

### 🟢 ألوان الحالات والتقييمات الأكاديمية (Semantic Statuses)
- **حاضر / ممتاز / مدفوع (Success):** `#10B981` (Emerald 500) | خلفية خفيفة: `#ECFDF5`
- **متأخر / قيد المراجعة / قسط مستحق (Warning):** `#F59E0B` (Amber 500) | خلفية خفيفة: `#FFFBEB`
- **غائب / راسب / متأخر بالسداد (Danger):** `#EF4444` (Red 500) | خلفية خفيفة: `#FEF2F2`
- **معذور / إشعارات إدارية (Info):** `#3B82F6` (Blue 500) | خلفية خفيفة: `#EFF6FF`

---

## 📐 3. الأبعاد والزوايا والظلال (Spatial Geometry & Elevation)

### 🔘 استدارة الحواف (Border Radius)
- `radius-sm`: `6px` — الحقول والمدخلات الصغيرة
- `radius-md`: `10px` — الأزرار والقوائم المنسدلة
- `radius-lg`: `16px` — البطاقات واللوحات (Floating Cards)
- `radius-xl`: `24px` — النوافذ المنبثقة (Modals & Drawers)
- `radius-full`: `9999px` — الصور الرمزية والشارات (Badges & Avatars)

### 🌫️ طبقات العمق والظلال (Spatial Elevation & Glassmorphism)
- **Level 1 (Card Default):** `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`
- **Level 2 (Hover / Floating):** `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)`
- **Level 3 (Modal / Flyout):** `0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)`
- **Glass Border:** `1px solid rgba(255, 255, 255, 0.2)` في الفاتح و `1px solid rgba(255, 255, 255, 0.1)` في الداكن.

---

## 🌍 4. معايير الاتجاه والتوافق (RTL-First Standards)
- الاتجاه الافتراضي: `dir="rtl"` مع استخدام فئات Tailwind المنطقية (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) بدلاً من الفئات المباشرة (`ml-*`, `mr-*`, `left-*`, `right-*`).
- أيقونات التنقل (الأسهم ومؤشرات التالي/السابق) تنعكس تلقائياً مع اتجاه الصفحة.

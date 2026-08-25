# 🎨 القيم البصرية وقواعد التصميم (Design Tokens & Values)

> **المحددات والمتغيرات البصرية الثابتة الخاصة بالمشروع (Design Tokens).**  
> ⚠️ **ملاحظة:** هذا الملف يحدد القيم الرقمية والبصرية فقط ولا يحدد طريقة بناء الواجهات والمكونات (Components Architecture).

---

## 🔤 1. الخطوط والطبوغرافيا (Typography)
- **عائلة الخط الرئيسي (Font Family):** `'Cairo', 'Inter', sans-serif`
- **عائلة خط الكود (Monospace Font):** `'Fira Code', monospace`
- **أوزان الخطوط (Font Weights):**
  - Regular: `400`
  - Medium: `500`
  - Semi-Bold: `600`
  - Bold: `700`
- **أحجام النصوص (Font Sizes):**
  - `xs`: `12px` (0.75rem)
  - `sm`: `14px` (0.875rem)
  - `base`: `16px` (1rem)
  - `lg`: `18px` (1.125rem)
  - `xl`: `20px` (1.25rem)
  - `2xl`: `24px` (1.5rem)
  - `3xl`: `30px` (1.875rem)

---

## 🎨 2. لوحة الألوان (Color Palette)

### 🔵 الألوان الرئيسية (Brand Colors)
- **Primary:** `#2563EB` (Blue 600)
- **Primary Hover:** `#1D4ED8` (Blue 700)
- **Secondary:** `#64748B` (Slate 500)

### ⚪ الألوان المحايدة والخلفيات (Neutrals & Backgrounds)
- **Background Light:** `#F8FAFC`
- **Surface Light:** `#FFFFFF`
- **Text Primary:** `#0F172A`
- **Text Secondary:** `#475569`
- **Border Default:** `#E2E8F0`

### 🟢 ألوان الحالات (Status Colors)
- **Success:** `#16A34A`
- **Warning:** `#D97706`
- **Danger / Error:** `#DC2626`
- **Info:** `#0284C7`

---

## 📐 3. المسافات والحدود (Spacing & Borders)

### 📏 المسافات (Spacing Scale)
- `space-1`: `4px`
- `space-2`: `8px`
- `space-3`: `12px`
- `space-4`: `16px`
- `space-6`: `24px`
- `space-8`: `32px`

### 🔘 استدارة الحواف (Border Radius)
- `radius-sm`: `4px`
- `radius-md`: `8px`
- `radius-lg`: `12px`
- `radius-full`: `9999px`

### 🌫️ الظلال (Shadows)
- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`

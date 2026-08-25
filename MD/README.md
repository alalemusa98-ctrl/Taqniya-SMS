# 📖 دليل توثيق المشروع (Project MD)

> **الملف التعريفي الرئيسي لنظام توثيق المشروع المُوجّه للذكاء الاصطناعي (AI-Driven Documentation)**

---

## 📌 1. نبذة عن المشروع (Project Overview)
- **اسم المشروع:** [أدخل اسم المشروع هنا]
- **الهدف العام:** [وصف شامل للهدف الأساسي من المشروع والحلول التي يقدمها]
- **طبيعة النظام:** [مثلاً: Web Application / SaaS / E-commerce / Mobile API]
- **الحالة الحالية:** 🏗️ في مرحلة التأسيس والتوثيق (In Setup & Specification Phase)

---

## 🎯 2. نطاق المشروع (Project Scope)

### 🟢 ما يتضمنه المشروع (In Scope)
- [الميزة أو النطاق الأول]
- [الميزة أو النطاق الثاني]
- [الميزة أو النطاق الثالث]

### 🔴 ما لا يتضمنه المشروع (Out of Scope)
- [الميزة المستثناة الأولى]
- [الميزة المستثناة الثانية]

---

## 📂 3. هيكل التوثيق (MD Documentation Structure)

ينقسم التوثيق في هذا المجلد إلى **3 مستويات رئيسية**:

```text
PROJECT/MD/
├── 🌐 المستويات العامة (General Specifications)
│   ├── README.md                  (الملف التعريفي والنطاق والحالة)
│   ├── stack.yaml                 (التقنيات والمكتبات المستخدمة)
│   ├── frontend_capabilities.yaml (نموذج مرجعي لسياسة قدرات الواجهة)
│   ├── execution_engine.yaml       (نموذج مرجعي لاختيار محرك التنفيذ)
│   ├── business_rules.md          (قواعد وشروط العمل العامة)
│   ├── data.md                    (التصور العام للبيانات والعلاقات)
│   ├── database.md                (مخطط قاعدة البيانات التفصيلي المعتمد)
│   └── design_rules.md            (القيم البصرية وحسومات التصميم)
│
├── 🤖 موجهات الذكاء الاصطناعي (AI Prompts)
│   └── prompts/
│       ├── README.md                              (دليل وفهرس الموجّهات)
│       ├── 01_project_initialization/             (موجّهات تهيئة المشروع ومراجعة الإعدادات)
│       │   ├── initialize_project.md
│       │   └── review_project_configuration.md
│       ├── 02_project_analysis/                   (موجّهات استيعاب قواعد العمل والنظام)
│       │   └── analyze_project_rules.md
│       ├── 03_database/                           # (موجّهات تصميم وتنفيذ قاعدة البيانات)
│       │   ├── design_database.md
│       │   └── implement_database.md
│       └── 04_phases/                             # (موجّهات تطوير ومراجعة المراحل الوظيفية)
│           ├── analyze_phase.md
│           ├── execute_phase.md
│           └── review_phase.md
│
└── 📦 المراحل الوظيفية (Functional Phases)
    └── phases/
        └── phase_00_sample/   (نموذج مرحلة وظيفية قياسية)
            ├── README.md
            ├── backend.md
            ├── frontend.md
            ├── routes.md
            └── data.md
```

---

## 📋 4. قائمة المراحل (Phases List)

| رقم المرحلة | اسم المرحلة | الوصف | الحالة |
| :--- | :--- | :--- | :--- |
| `phase_00` | `sample` | نموذج مرحلة قياسي توضيحي | 🟡 جاهز للتكييف |
| `phase_01` | [اسم المرحلة 1] | [وصف مختصر للمرحلة] | ⚪ قيد الانتظار |
| `phase_02` | [اسم المرحلة 2] | [وصف مختصر للمرحلة] | ⚪ قيد الانتظار |

---

## 💡 5. آلية وتكامل دورة حياة المشروع مع الذكاء الاصطناعي

تتبع جميع عمليات التطوير في المشروع دورة حياة منضبطة ومحددة:

1. **التهيئة والتدقيق (Initialization & Review):**  
   يتم قراءة `stack.yaml` وفحص نمط الاتصال المعماري (`architecture.communication.mode`). ثم ضبط سياسات الواجهة عبر `frontend_capabilities.yaml` وتحديد محرك التنفيذ عبر `execution_engine.yaml`، وتدقيق الاتساق عبر `01_project_initialization/`.
2. **استيعاب قواعد المشروع (Domain Analysis):**  
   يتم تشغيل `02_project_analysis/analyze_project_rules.md` لاستيعاب منطق العمل والكيانات والقيود قبل كتابة أي كود.
3. **اعتماد وتنفيذ قاعدة البيانات (Database SSoT Gate):**  
   - إذا كان `database.md` غير موجود: يُشغّل `03_database/design_database.md` لإنشاء المخطط وطلب موافقة المطور.
   - إذا كان `database.md` معتمداً: يُشغّل `03_database/implement_database.md` لتطبيق التهجيرات بنسبة تطابق 1:1.
4. **دورة حياة المراحل الوظيفية (Phase Lifecycle):**  
   لكل مرحلة في `phases/<phase_name>/` يتم تطبيق الدورة الثلاثية:
   - **التحليل:** `04_phases/analyze_phase.md` لتفكيك النطاق وتقدير المخاطر.
   - **التنفيذ:** `04_phases/execute_phase.md` لتسليم حزمة الحوكمة للمحرك المعتمد.
   - **المراجعة والاعتماد:** `04_phases/review_phase.md` لتشغيل بوابات التحقق الثمانية واستيفاء معايير الاكتمال (DoD).

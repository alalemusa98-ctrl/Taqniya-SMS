# ✅ قائمة مهام المرحلة 10: النسخ الاحتياطي واستعادة البيانات (Phase Checklist)

> **قائمة التحقق وبوابات الإنجاز المعمارية وفق معايير Taqniya AI Development Framework.**

---

## 📋 بوابات الإنجاز والمراجعة (Verification Gates)

- [ ] **1. مرحلة التوثيق ومرجع الـ SSoT:**
  - [x] إنشاء دليل المرحلة `README.md`.
  - [x] إنشاء مرجع الشبكة والاستجابات `routes.md`.
  - [x] توثيق المواصفات الخلفية `backend.md`.
  - [x] توثيق مواصفات الواجهات `frontend.md`.
  - [x] توثيق هياكل البيانات `data.md`.
  - [x] توثيق مصفوفة الاختبارات `testing.md`.
  - [x] تقرير التدقيق المعماري `audit_report.md`.

- [ ] **2. مرحلة التطوير الخلفي (Backend Implementation):**
  - [ ] بناء `backup.module.ts`.
  - [ ] بناء `backup.service.ts` (محرك التفريغ، ضغط ZIP، فك الضغط، تشغيل الاستعلامات، تنظيف المؤقتات).
  - [ ] بناء `backup.controller.ts` للمسارات الـ 6 مع حماية `Roles('admin')`.
  - [ ] بناء كائنات `create-backup.dto.ts`.

- [ ] **3. مرحلة التطوير الأمامي (Frontend Implementation):**
  - [ ] إنشاء `backup.api.ts`.
  - [ ] بناء شاشة `BackupManagementView.vue` المتوافقة مع Spatial UI.
  - [ ] بناء نافذة `CreateBackupModal.vue`.
  - [ ] بناء نافذة `RestoreBackupModal.vue`.
  - [ ] بناء نافذة `UploadBackupModal.vue`.
  - [ ] تسجيل المسار في Vue Router وإضافة التبويب لشريط القائمة الجانبية للإدارة.

- [ ] **4. مرحلة الاختبارات والجودة (Testing & Verification):**
  - [ ] اختبارات الـ TDD لخدمات ومتحكمات الـ Backend (`phase10.spec.ts`).
  - [ ] اختبار سلامة ملفات ZIP المضغوطة وصلاحية استعادة البيانات.
  - [ ] التحقق من عزل وصلاحيات الـ RBAC (منع المعلمين والطلاب).
  - [ ] التحقق من بناء الواجهة الأمامية `npm run build` بنجاح دون أي تحذيرات.

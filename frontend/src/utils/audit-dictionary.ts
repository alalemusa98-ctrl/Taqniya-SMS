import {
  UserCheck,
  FileText,
  Shield,
  KeyRound,
  Layers,
  Clock,
  Info,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  User,
  Users,
  Hash,
  Phone,
  Mail,
  HeartHandshake,
} from 'lucide-vue-next';

export interface ActionInfo {
  text: string;
  badgeClass: string;
  category: string;
}

export const ACTION_DICTIONARY: Record<string, { text: string; badgeClass: string; category: string }> = {
  // Auth & Security
  login: {
    text: 'تسجيل دخول ناجح',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    category: 'الأمان والمصادقة',
  },
  logout: {
    text: 'تسجيل خروج',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
    category: 'الأمان والمصادقة',
  },
  login_failed: {
    text: 'محاولة دخول فاشلة',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'الأمان والمصادقة',
  },
  login_blocked: {
    text: 'حظر محاولة دخول',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold',
    category: 'الأمان والمصادقة',
  },
  user_activated: {
    text: 'تفعيل حساب مستخدم',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'المستخدمون',
  },
  user_deactivated: {
    text: 'تعطيل حساب مستخدم',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'المستخدمون',
  },
  password_change: {
    text: 'تغيير كلمة المرور',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    category: 'الأمان والمصادقة',
  },
  admin_reset_password: {
    text: 'إعادة تعيين كلمة المرور إدارياً',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    category: 'الأمان والمصادقة',
  },

  // Student Enrollments
  bulk_enroll_students: {
    text: 'تسكين جماعي للطلاب',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-black',
    category: 'تسكين الطلاب',
  },
  create_student_enrollment: {
    text: 'تسكين طالب جديد',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'تسكين الطلاب',
  },
  update_student_enrollment: {
    text: 'تعديل تسكين / نقل شعبة',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'تسكين الطلاب',
  },
  delete_student_enrollment: {
    text: 'إلغاء تسكين طالب',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'تسكين الطلاب',
  },

  // Teaching Assignments
  TEACHING_ASSIGNMENT_CREATED: {
    text: 'إسناد تدريسي جديد',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'النصاب التدريسي',
  },
  TEACHING_ASSIGNMENT_UPDATED: {
    text: 'تعديل إسناد تدريسي',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'النصاب التدريسي',
  },
  TEACHING_ASSIGNMENT_DELETED: {
    text: 'حذف إسناد تدريسي',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'النصاب التدريسي',
  },

  // Teachers
  teacher_created: {
    text: 'إضافة معلم جديد',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'المعلمون',
  },
  teacher_updated: {
    text: 'تعديل بيانات معلم',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'المعلمون',
  },
  teacher_deleted: {
    text: 'حذف معلم',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'المعلمون',
  },

  // Students
  student_created: {
    text: 'تسجيل طالب جديد',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'الطلاب',
  },
  student_updated: {
    text: 'تعديل بيانات طالب',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'الطلاب',
  },
  student_deleted: {
    text: 'حذف طالب',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'الطلاب',
  },

  // Guardians & Custody
  guardian_created: {
    text: 'إضافة ولي أمر',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'أولياء الأمور',
  },
  guardian_updated: {
    text: 'تعديل بيانات ولي أمر',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'أولياء الأمور',
  },
  guardian_deleted: {
    text: 'حذف ولي أمر',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'أولياء الأمور',
  },
  custody_linked: {
    text: 'ربط وصاية طالب',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'أولياء الأمور',
  },
  custody_updated: {
    text: 'تعديل بيانات وصاية',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'أولياء الأمور',
  },
  custody_deleted: {
    text: 'فك وصاية طالب',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'أولياء الأمور',
  },

  // Academic Structure
  academic_year_created: {
    text: 'إضافة عام دراسي',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'الهيكل الأكاديمي',
  },
  academic_year_updated: {
    text: 'تعديل عام دراسي',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'الهيكل الأكاديمي',
  },
  academic_year_activated: {
    text: 'تفعيل العام الدراسي',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold',
    category: 'الهيكل الأكاديمي',
  },
  academic_year_deleted: {
    text: 'حذف عام دراسي',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'الهيكل الأكاديمي',
  },
  academic_term_created: {
    text: 'إضافة فصل دراسي',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'الهيكل الأكاديمي',
  },
  academic_term_updated: {
    text: 'تعديل فصل دراسي',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'الهيكل الأكاديمي',
  },
  academic_term_deleted: {
    text: 'حذف فصل دراسي',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'الهيكل الأكاديمي',
  },
  academic_stage_created: {
    text: 'إضافة مرحلة دراسية',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'الهيكل الأكاديمي',
  },
  academic_stage_updated: {
    text: 'تعديل مرحلة دراسية',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'الهيكل الأكاديمي',
  },
  academic_stage_deleted: {
    text: 'حذف مرحلة دراسية',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'الهيكل الأكاديمي',
  },
  subject_created: {
    text: 'إضافة مادة دراسية',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'المواد والمناهج',
  },
  subject_updated: {
    text: 'تعديل مادة دراسية',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'المواد والمناهج',
  },
  subject_deleted: {
    text: 'حذف مادة دراسية',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'المواد والمناهج',
  },
  class_created: {
    text: 'إضافة صف دراسي',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'الهيكل الأكاديمي',
  },
  class_updated: {
    text: 'تعديل صف دراسي',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'الهيكل الأكاديمي',
  },
  class_deleted: {
    text: 'حذف صف دراسي',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'الهيكل الأكاديمي',
  },
  section_created: {
    text: 'إضافة شعبة دراسية',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'الهيكل الأكاديمي',
  },
  section_updated: {
    text: 'تعديل شعبة دراسية',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'الهيكل الأكاديمي',
  },
  section_deleted: {
    text: 'حذف شعبة دراسية',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'الهيكل الأكاديمي',
  },

  // Timetable & Period Slots
  period_slot_created: {
    text: 'إضافة حصة دراسية',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'الحصص والتوقيتات',
  },
  period_slot_updated: {
    text: 'تعديل حصة دراسية',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'الحصص والتوقيتات',
  },
  period_slot_deleted: {
    text: 'حذف حصة دراسية',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'الحصص والتوقيتات',
  },

  // Generic fallbacks
  create: {
    text: 'إضافة سجل جديد',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'إجراءات عامة',
  },
  update: {
    text: 'تعديل بيانات',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    category: 'إجراءات عامة',
  },
  delete: {
    text: 'حذف سجل',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'إجراءات عامة',
  },
};

export const ENTITY_DICTIONARY: Record<string, { label: string; icon: any }> = {
  StudentEnrollment: { label: 'تسكين الطلاب', icon: GraduationCap },
  TeachingAssignment: { label: 'النصاب التدريسي', icon: School },
  Teacher: { label: 'سجلات المعلمين', icon: UserCheck },
  Student: { label: 'سجلات الطلاب', icon: User },
  Guardian: { label: 'أولياء الأمور', icon: Users },
  GuardianStudent: { label: 'روابط الوصاية', icon: HeartHandshake },
  User: { label: 'حسابات المستخدمين', icon: Shield },
  PersonalAccessToken: { label: 'جلسات المصادقة (Tokens)', icon: KeyRound },
  AcademicYear: { label: 'السنوات الدراسية', icon: Calendar },
  AcademicTerm: { label: 'الفصول الدراسية', icon: Calendar },
  AcademicStage: { label: 'المراحل الدراسية', icon: Layers },
  AcademicClass: { label: 'الصفوف الدراسية', icon: Layers },
  AcademicSection: { label: 'الشعب الدراسية', icon: School },
  AcademicSubject: { label: 'المواد والمناهج', icon: BookOpen },
  PeriodSlot: { label: 'الحصص والتوقيتات', icon: Clock },
};

export const getActionInfo = (action: string): ActionInfo => {
  if (ACTION_DICTIONARY[action]) {
    return ACTION_DICTIONARY[action];
  }

  // Smart humanizer for any unknown codes
  const clean = action
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .toLowerCase();

  let text = clean;
  let badgeClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';

  if (clean.includes('create') || clean.includes('add')) {
    text = `إضافة (${clean})`;
    badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  } else if (clean.includes('update') || clean.includes('edit') || clean.includes('modify')) {
    text = `تعديل (${clean})`;
    badgeClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
  } else if (clean.includes('delete') || clean.includes('remove')) {
    text = `حذف (${clean})`;
    badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
  }

  return { text, badgeClass, category: 'أخرى' };
};

export const getEntityInfo = (entity: string): { label: string; icon: any } => {
  if (ENTITY_DICTIONARY[entity]) {
    return ENTITY_DICTIONARY[entity];
  }
  return { label: entity, icon: Layers };
};

export const getFieldMeta = (key: string) => {
  switch (key) {
    // User & Auth
    case 'is_active':
      return { label: 'حالة الحساب', icon: UserCheck, desc: 'حالة تفعيل أو تعطيل الحساب' };
    case 'reason':
      return { label: 'سبب الإجراء', icon: FileText, desc: 'السبب المسجل للعملية' };
    case 'role_type':
      return { label: 'الدور والصلاحية', icon: Shield, desc: 'الصلاحية المؤسسية' };
    case 'password':
    case 'new_password':
    case 'password_hash':
      return { label: 'كلمة المرور', icon: KeyRound, desc: 'بيانات الحماية والتشفير' };
    case 'user_code':
      return { label: 'الرمز المؤسسي', icon: Hash, desc: 'معرف تسجيل الدخول الرسمي' };
    case 'last_login_at':
      return { label: 'توقيت آخر دخول', icon: Clock, desc: 'سجل نشاط المستخدم' };

    // Student & Enrollment (Singular & Plural)
    case 'seating_number':
      return { label: 'رقم الجلوس', icon: Hash, desc: 'رقم جلوس الطالب للاختبارات' };
    case 'student_id':
      return { label: 'الطالب', icon: GraduationCap, desc: 'بيانات الطالب المعني' };
    case 'student_ids':
    case 'selected_student_ids':
      return { label: 'قائمة الطلاب المحددين', icon: GraduationCap, desc: 'الطلاب المشمولين بالعملية' };
    case 'student_count':
      return { label: 'عدد الطلاب', icon: Users, desc: 'إجمالي الطلاب في العملية' };
    case 'enrolled_count':
      return { label: 'إجمالي المسكنين', icon: Users, desc: 'عدد الطلاب المسكنين' };
    case 'class_section_id':
      return { label: 'الشعبة والصف الدراسي', icon: School, desc: 'الشعبة والصف المقيد به الطالب' };
    case 'class_section_ids':
    case 'section_ids':
      return { label: 'قائمة الشعب الدراسية', icon: School, desc: 'الشعب الدراسية' };
    case 'class_id':
      return { label: 'الصف الدراسي', icon: Layers, desc: 'الصف الأكاديمي' };
    case 'class_ids':
      return { label: 'قائمة الصفوف', icon: Layers, desc: 'الصفوف الدراسية' };
    case 'academic_year_id':
      return { label: 'العام الدراسي', icon: Calendar, desc: 'العام الدراسي المقيد به السجل' };
    case 'academic_term_id':
    case 'term_id':
      return { label: 'الفصل الدراسي', icon: Calendar, desc: 'الفصل الأكاديمي' };
    case 'teacher_id':
      return { label: 'المعلم المكلف', icon: UserCheck, desc: 'المعلم المسند له' };
    case 'teacher_ids':
      return { label: 'قائمة المعلمين', icon: UserCheck, desc: 'المعلمون المعنيون' };
    case 'subject_id':
      return { label: 'المادة الدراسية', icon: BookOpen, desc: 'المقرر الدراسي' };
    case 'subject_ids':
      return { label: 'قائمة المواد', icon: BookOpen, desc: 'المواد والمناهج' };
    case 'user_id':
      return { label: 'حساب المستخدم', icon: Shield, desc: 'معرف الحساب' };
    case 'user_ids':
      return { label: 'قائمة المستخدمين', icon: Shield, desc: 'حسابات المستخدمين' };
    case 'guardian_id':
      return { label: 'ولي الأمر', icon: Users, desc: 'ولي أمر الطالب' };
    case 'guardian_ids':
      return { label: 'أولياء الأمور', icon: Users, desc: 'قائمة أولياء الأمور' };
    case 'stage_id':
      return { label: 'المرحلة الدراسية', icon: Layers, desc: 'المرحلة التعليمية' };
    case 'period_slot_id':
      return { label: 'الحصة الدراسية', icon: Clock, desc: 'الحصة والتوقيت' };
    case 'classroom_id':
      return { label: 'القاعة الدراسية', icon: School, desc: 'القاعة أو الفصل' };
    case 'status':
      return { label: 'الحالة الأكاديمية', icon: Info, desc: 'حالة التسكين أو التدرج الأكاديمي' };
    case 'full_name':
      return { label: 'الاسم الكامل', icon: User, desc: 'الاسم الرباعي الرسمي' };
    case 'national_id':
      return { label: 'الرقم الوطني / الهوية', icon: Hash, desc: 'معرف الهوية الشخصية' };
    case 'birth_date':
      return { label: 'تاريخ الميلاد', icon: Calendar, desc: 'تاريخ الميلاد الرسمي' };
    case 'gender':
      return { label: 'الجنس', icon: User, desc: 'ذكر / أنثى' };
    case 'phone':
      return { label: 'رقم الهاتف', icon: Phone, desc: 'بيانات الاتصال' };
    case 'email':
      return { label: 'البريد الإلكتروني', icon: Mail, desc: 'البريد الإلكتروني الرسمي' };

    // Timetable & Periods
    case 'slot_number':
      return { label: 'ترتيب الحصة', icon: Hash, desc: 'رقم الحصة في الجدول' };
    case 'start_time':
      return { label: 'وقت البداية', icon: Clock, desc: 'موعد بداية الحصة' };
    case 'end_time':
      return { label: 'وقت النهاية', icon: Clock, desc: 'موعد نهاية الحصة' };
    case 'is_break':
      return { label: 'نوع الحصة', icon: Clock, desc: 'هل هي استراحة أم حصة تعليمية' };

    // Custody
    case 'relationship_type':
      return { label: 'صلة القرابة', icon: HeartHandshake, desc: 'درجة القرابة مع الطالب' };
    case 'is_emergency_contact':
      return { label: 'جهة اتصال طوارئ', icon: Phone, desc: 'الاتصال به في الطوارئ' };

    default: {
      let clean = key
        .replace(/_ids$/i, '')
        .replace(/_id$/i, '')
        .replace(/_/g, ' ')
        .trim();

      const commonWords: Record<string, string> = {
        student: 'الطالب',
        students: 'الطلاب',
        teacher: 'المعلم',
        teachers: 'المعلمون',
        class: 'الصف الدراسي',
        classes: 'الصفوف الدراسية',
        section: 'الشعبة الدراسية',
        sections: 'الشعب الدراسية',
        class_section: 'الشعبة والصف',
        subject: 'المادة الدراسية',
        subjects: 'المواد الدراسية',
        term: 'الفصل الدراسي',
        terms: 'الفصول الدراسية',
        year: 'العام الدراسي',
        years: 'السنوات الدراسية',
        stage: 'المرحلة الدراسية',
        stages: 'المراحل الدراسية',
        guardian: 'ولي الأمر',
        guardians: 'أولياء الأمور',
        parent: 'ولي الأمر',
        user: 'المستخدم',
        users: 'المستخدمون',
        classroom: 'القاعة الدراسية',
        room: 'القاعة / الغرفة',
        school: 'المدرسة',
        slot: 'الحصة الدراسية',
        slots: 'الحصص الدراسية',
        created_by: 'المنشئ',
        updated_by: 'المعدل',
      };

      const normalizedKey = key.replace(/_ids$/i, '').replace(/_id$/i, '').toLowerCase();
      if (commonWords[normalizedKey]) {
        clean = commonWords[normalizedKey];
      }

      return { label: clean, icon: Info, desc: 'تعديل حقل بالنظام' };
    }
  }
};

export interface AuditReferenceLookup {
  classSections?: Map<number, string>;
  classes?: Map<number, string>;
  years?: Map<number, string>;
  terms?: Map<number, string>;
  stages?: Map<number, string>;
  subjects?: Map<number, string>;
  teachers?: Map<number, string>;
  students?: Map<number, string>;
  guardians?: Map<number, string>;
  periodSlots?: Map<number, string>;
}

export const parseIdArray = (val: any): number[] => {
  if (val === null || val === undefined || val === '') return [];
  if (Array.isArray(val)) {
    return val
      .map((x) => Number(typeof x === 'object' && x !== null && 'id' in x ? x.id : x))
      .filter((x) => !isNaN(x) && x > 0);
  }
  if (typeof val === 'number') {
    return val > 0 ? [val] : [];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((x) => Number(typeof x === 'object' && x !== null && 'id' in x ? x.id : x))
            .filter((x) => !isNaN(x) && x > 0);
        }
      } catch {
        // ignore
      }
    }
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((x) => !isNaN(x) && x > 0);
    }
    const single = Number(trimmed);
    if (!isNaN(single) && single > 0) return [single];
  }
  return [];
};

export const formatFieldValue = (
  key: string,
  val: any,
  contextObj?: any,
  refs?: AuditReferenceLookup,
): { text: string; badgeClass?: string; isMuted?: boolean } => {
  if (val === null || val === undefined || val === '') {
    return { text: 'لا يوجد / غير محدد', isMuted: true };
  }

  const numVal = Number(val);

  // 1. Array of Student IDs: student_ids, selected_student_ids
  if (key === 'student_ids' || key === 'selected_student_ids') {
    const ids = parseIdArray(val);
    if (ids.length === 0) {
      return { text: 'لا يوجد طلاب محددين', isMuted: true };
    }
    const names = ids.map((id) => refs?.students?.get(id) || `طالب #${id}`);
    const countBadge = ids.length > 1 ? ` (${ids.length} طلاب)` : '';
    return {
      text: `${names.join('، ')}${countBadge}`,
      badgeClass: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 font-bold',
    };
  }

  // 2. Single Student ID: student_id
  if (key === 'student_id') {
    if (contextObj && contextObj.student_name) {
      return {
        text: contextObj.student_name,
        badgeClass: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 font-bold',
      };
    }
    if (refs?.students?.has(numVal)) {
      return {
        text: refs.students.get(numVal)!,
        badgeClass: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 font-bold',
      };
    }
    return {
      text: `طالب #${val}`,
      badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 font-bold',
    };
  }

  // 3. Array of Teacher IDs: teacher_ids, selected_teacher_ids
  if (key === 'teacher_ids' || key === 'selected_teacher_ids') {
    const ids = parseIdArray(val);
    if (ids.length === 0) {
      return { text: 'لا يوجد معلمون محددون', isMuted: true };
    }
    const names = ids.map((id) => refs?.teachers?.get(id) || `معلم #${id}`);
    const countBadge = ids.length > 1 ? ` (${ids.length} معلمين)` : '';
    return {
      text: `${names.join('، ')}${countBadge}`,
      badgeClass: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 font-bold',
    };
  }

  // 4. Single Teacher ID: teacher_id
  if (key === 'teacher_id') {
    if (contextObj && contextObj.teacher_name) {
      return {
        text: contextObj.teacher_name,
        badgeClass: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 font-bold',
      };
    }
    if (refs?.teachers?.has(numVal)) {
      return {
        text: refs.teachers.get(numVal)!,
        badgeClass: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 font-bold',
      };
    }
    return {
      text: `معلم #${val}`,
      badgeClass: 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 font-bold',
    };
  }

  // 5. Array of Section IDs: class_section_ids, section_ids
  if (key === 'class_section_ids' || key === 'section_ids') {
    const ids = parseIdArray(val);
    if (ids.length === 0) {
      return { text: 'لا توجد شعب محددة', isMuted: true };
    }
    const names = ids.map((id) => refs?.classSections?.get(id) || `شعبة #${id}`);
    const countBadge = ids.length > 1 ? ` (${ids.length} شعب)` : '';
    return {
      text: `${names.join('، ')}${countBadge}`,
      badgeClass: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 font-bold',
    };
  }

  // 6. Single Section ID: class_section_id, section_id
  if (key === 'class_section_id' || key === 'section_id') {
    if (contextObj && contextObj.class_name && contextObj.section_name) {
      return {
        text: `${contextObj.class_name} — شعبة (${contextObj.section_name})`,
        badgeClass: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 font-bold',
      };
    }
    if (refs?.classSections?.has(numVal)) {
      return {
        text: refs.classSections.get(numVal)!,
        badgeClass: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 font-bold',
      };
    }
    return {
      text: `الشعبة الدراسية #${val}`,
      badgeClass: 'bg-purple-500/10 text-purple-600 border border-purple-500/20 font-bold',
    };
  }

  // 7. Class IDs (Array & Single)
  if (key === 'class_ids') {
    const ids = parseIdArray(val);
    if (ids.length === 0) return { text: 'لا توجد صفوف محددة', isMuted: true };
    const names = ids.map((id) => refs?.classes?.get(id) || `صف #${id}`);
    return {
      text: names.join('، '),
      badgeClass: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 font-bold',
    };
  }

  if (key === 'class_id') {
    if (contextObj && contextObj.class_name) {
      return {
        text: contextObj.class_name,
        badgeClass: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 font-bold',
      };
    }
    if (refs?.classes?.has(numVal)) {
      return {
        text: refs.classes.get(numVal)!,
        badgeClass: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 font-bold',
      };
    }
    return {
      text: `صف دراسي #${val}`,
      badgeClass: 'bg-blue-500/10 text-blue-700 border border-blue-500/20 font-bold',
    };
  }

  // 8. Subject IDs (Array & Single)
  if (key === 'subject_ids') {
    const ids = parseIdArray(val);
    if (ids.length === 0) return { text: 'لا توجد مواد محددة', isMuted: true };
    const names = ids.map((id) => refs?.subjects?.get(id) || `مادة #${id}`);
    return {
      text: names.join('، '),
      badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold',
    };
  }

  if (key === 'subject_id') {
    if (contextObj && contextObj.subject_name) {
      return {
        text: contextObj.subject_name,
        badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold',
      };
    }
    if (refs?.subjects?.has(numVal)) {
      return {
        text: refs.subjects.get(numVal)!,
        badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold',
      };
    }
    return {
      text: `مادة دراسية #${val}`,
      badgeClass: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold',
    };
  }

  // 9. Academic Year ID: academic_year_id, year_id
  if (key === 'academic_year_id' || key === 'year_id') {
    if (contextObj && contextObj.year_name) {
      return {
        text: `العام الدراسي ${contextObj.year_name}`,
        badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold',
      };
    }
    if (refs?.years?.has(numVal)) {
      return {
        text: `العام الدراسي ${refs.years.get(numVal)!}`,
        badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold',
      };
    }
    return {
      text: `عام دراسي #${val}`,
      badgeClass: 'bg-amber-500/10 text-amber-700 border border-amber-500/20 font-bold',
    };
  }

  // 10. Academic Term ID: academic_term_id, term_id
  if (key === 'academic_term_id' || key === 'term_id') {
    if (contextObj && contextObj.term_name) {
      return {
        text: contextObj.term_name,
        badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold',
      };
    }
    if (refs?.terms?.has(numVal)) {
      return {
        text: refs.terms.get(numVal)!,
        badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold',
      };
    }
    return {
      text: `فصل دراسي #${val}`,
      badgeClass: 'bg-amber-500/10 text-amber-700 border border-amber-500/20 font-bold',
    };
  }

  // 11. Stage ID: stage_id
  if (key === 'stage_id') {
    if (refs?.stages?.has(numVal)) {
      return {
        text: refs.stages.get(numVal)!,
        badgeClass: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 font-bold',
      };
    }
    return {
      text: `مرحلة دراسية #${val}`,
      badgeClass: 'bg-teal-500/10 text-teal-700 border border-teal-500/20 font-bold',
    };
  }

  // 12. Guardian IDs (Array & Single)
  if (key === 'guardian_ids') {
    const ids = parseIdArray(val);
    if (ids.length === 0) return { text: 'لا يوجد أولياء أمور محددين', isMuted: true };
    const names = ids.map((id) => refs?.guardians?.get(id) || `ولي أمر #${id}`);
    return {
      text: names.join('، '),
      badgeClass: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 font-bold',
    };
  }

  if (key === 'guardian_id') {
    if (refs?.guardians?.has(numVal)) {
      return {
        text: refs.guardians.get(numVal)!,
        badgeClass: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 font-bold',
      };
    }
    return {
      text: `ولي أمر #${val}`,
      badgeClass: 'bg-teal-500/10 text-teal-700 border border-teal-500/20 font-bold',
    };
  }

  // 13. Period Slot ID: period_slot_id
  if (key === 'period_slot_id') {
    if (refs?.periodSlots?.has(numVal)) {
      return {
        text: refs.periodSlots.get(numVal)!,
        badgeClass: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 font-bold',
      };
    }
    return {
      text: `حصة دراسية #${val}`,
      badgeClass: 'bg-blue-500/10 text-blue-700 border border-blue-500/20 font-bold',
    };
  }

  // 14. User IDs & User Code
  if (key === 'user_id') {
    if (contextObj && contextObj.user_code) {
      return {
        text: `المستخدم (${contextObj.user_code})`,
        badgeClass: 'bg-slate-500/15 text-slate-800 dark:text-slate-300 border border-slate-500/30 font-bold',
      };
    }
    return {
      text: `مستخدم رقم #${val}`,
      badgeClass: 'bg-slate-500/10 text-slate-700 border border-slate-500/20 font-bold',
    };
  }

  // 15. Student counts
  if (key === 'student_count' || key === 'enrolled_count') {
    return {
      text: `${val} طلاب`,
      badgeClass: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 font-black',
    };
  }

  // 16. Fallback for ANY other IDs array (*_ids)
  if (key.endsWith('_ids')) {
    const ids = parseIdArray(val);
    if (ids.length === 0) {
      return { text: 'لا توجد عناصر محددة', isMuted: true };
    }
    const cleanLabel = getFieldMeta(key).label;
    return {
      text: `${cleanLabel} (${ids.map((x) => `#${x}`).join('، ')}) [${ids.length} عناصر]`,
      badgeClass: 'bg-slate-500/15 text-slate-800 dark:text-slate-300 border border-slate-500/30 font-bold',
    };
  }

  // 17. Fallback for ANY other single ID (*_id)
  if (key.endsWith('_id')) {
    const cleanLabel = getFieldMeta(key).label;
    return {
      text: `${cleanLabel} #${val}`,
      badgeClass: 'bg-slate-500/15 text-slate-800 dark:text-slate-300 border border-slate-500/30 font-bold',
    };
  }

  if (key === 'is_active') {
    if (val === 1 || val === true || val === '1') {
      return {
        text: 'نشط (متاح)',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-black',
      };
    }
    return {
      text: 'معطل وموقوف',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-black',
    };
  }

  if (key === 'is_break') {
    return {
      text: val ? 'استراحة (فسحة)' : 'حصة تعليمية',
      badgeClass: val ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30' : 'bg-blue-500/15 text-blue-700 border border-blue-500/30',
    };
  }

  if (key === 'status') {
    const statuses: Record<string, string> = {
      enrolled: 'مسكن في الشعبة',
      passed: 'ناجح',
      second_round: 'دور ثانٍ',
      failed: 'راسب',
      graduated: 'متخرج',
    };
    return {
      text: statuses[val] || val,
      badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 font-bold',
    };
  }

  if (key === 'role_type') {
    const roles: Record<string, string> = {
      admin: 'مدير نظام',
      teacher: 'معلم',
      student: 'طالب',
      parent: 'ولي أمر',
    };
    return {
      text: roles[val] || val,
      badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 font-black',
    };
  }

  if (key.includes('password')) {
    return {
      text: '•••••••• (مشفرة بأمان)',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-black',
    };
  }

  if (typeof val === 'boolean') {
    return { text: val ? 'نعم' : 'لا' };
  }

  if (typeof val === 'object') {
    return { text: JSON.stringify(val) };
  }

  return { text: String(val) };
};

export const ACTION_FILTER_OPTIONS = [
  { value: '', label: 'كافة العمليات' },
  { value: 'bulk_enroll_students', label: 'تسكين جماعي للطلاب' },
  { value: 'create_student_enrollment', label: 'تسكين طالب' },
  { value: 'update_student_enrollment', label: 'تعديل تسكين / نقل شعبة' },
  { value: 'delete_student_enrollment', label: 'إلغاء تسكين طالب' },
  { value: 'TEACHING_ASSIGNMENT_CREATED', label: 'إسناد تدريسي جديد' },
  { value: 'TEACHING_ASSIGNMENT_UPDATED', label: 'تعديل إسناد تدريسي' },
  { value: 'TEACHING_ASSIGNMENT_DELETED', label: 'حذف إسناد تدريسي' },
  { value: 'teacher_created', label: 'إضافة معلم' },
  { value: 'teacher_updated', label: 'تعديل معلم' },
  { value: 'student_created', label: 'تسجيل طالب' },
  { value: 'student_updated', label: 'تعديل طالب' },
  { value: 'guardian_created', label: 'إضافة ولي أمر' },
  { value: 'custody_linked', label: 'ربط وصاية' },
  { value: 'academic_year_activated', label: 'تفعيل عام دراسي' },
  { value: 'period_slot_created', label: 'إضافة حصة' },
  { value: 'login', label: 'تسجيل دخول' },
  { value: 'logout', label: 'تسجيل خروج' },
  { value: 'user_activated', label: 'تفعيل حساب مستخدم' },
  { value: 'user_deactivated', label: 'تعطيل حساب مستخدم' },
  { value: 'password_change', label: 'تغيير كلمة المرور' },
  { value: 'admin_reset_password', label: 'إعادة تعيين كلمة المرور' },
];

export const ENTITY_FILTER_OPTIONS = [
  { value: '', label: 'كافة الكيانات' },
  { value: 'StudentEnrollment', label: 'تسكين الطلاب' },
  { value: 'TeachingAssignment', label: 'النصاب والإسناد التدريسي' },
  { value: 'Teacher', label: 'المعلمون' },
  { value: 'Student', label: 'الطلاب' },
  { value: 'Guardian', label: 'أولياء الأمور' },
  { value: 'GuardianStudent', label: 'الوصاية وصلة القرابة' },
  { value: 'User', label: 'حسابات المستخدمين' },
  { value: 'AcademicYear', label: 'السنوات الدراسية' },
  { value: 'AcademicClass', label: 'الصفوف الدراسية' },
  { value: 'AcademicSection', label: 'الشعب الدراسية' },
  { value: 'AcademicSubject', label: 'المواد والمناهج' },
  { value: 'PeriodSlot', label: 'الحصص والتوقيتات' },
  { value: 'PersonalAccessToken', label: 'جلسات المصادقة (Tokens)' },
];

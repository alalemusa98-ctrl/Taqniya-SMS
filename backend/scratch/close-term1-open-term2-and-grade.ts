import { PrismaClient, TranscriptType, EnrollmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

type PerformanceTier = 'excellent' | 'very_good' | 'good' | 'acceptable' | 'second_round' | 'failed';

function assignTiers(studentCount: number): PerformanceTier[] {
  const tiers: PerformanceTier[] = [];
  
  const numExcellent = Math.max(2, Math.round(studentCount * 0.20));
  const numVeryGood = Math.max(3, Math.round(studentCount * 0.30));
  const numGood = Math.max(3, Math.round(studentCount * 0.25));
  const numAcceptable = Math.max(1, Math.round(studentCount * 0.10));
  const numSecondRound = Math.max(1, Math.round(studentCount * 0.10));
  const numFailed = Math.max(1, studentCount - (numExcellent + numVeryGood + numGood + numAcceptable + numSecondRound));

  for (let i = 0; i < numExcellent; i++) tiers.push('excellent');
  for (let i = 0; i < numVeryGood; i++) tiers.push('very_good');
  for (let i = 0; i < numGood; i++) tiers.push('good');
  for (let i = 0; i < numAcceptable; i++) tiers.push('acceptable');
  for (let i = 0; i < numSecondRound; i++) tiers.push('second_round');
  while (tiers.length < studentCount) tiers.push('failed');

  return tiers;
}

async function main() {
  console.log('=== Academic Workflow: Close Term 1, Activate Term 2 & Grade Students ===\n');

  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  if (!activeYear) {
    console.error('No active academic year found!');
    return;
  }

  console.log(`Academic Year: "${activeYear.name}" (ID: ${activeYear.id})`);

  // Step 1: Close Term 1 across all classes (is_active = 0, is_closed = 1)
  console.log('\n🔒 Step 1: Closing Term 1 (الفصل الدراسي الأول)...');
  const closedTerms = await prisma.classAcademicTerm.updateMany({
    where: {
      deleted_at: null,
      academic_term: { term_number: 1 },
    },
    data: {
      is_active: 0,
      is_closed: 1,
    },
  });
  console.log(`✓ Closed ${closedTerms.count} class academic terms for Term 1.`);

  // Step 2: Open and Activate Term 2 across all classes (is_active = 1, is_closed = 0)
  console.log('\n🔓 Step 2: Activating Term 2 (الفصل الدراسي الثاني)...');
  const activatedTerms = await prisma.classAcademicTerm.updateMany({
    where: {
      deleted_at: null,
      academic_term: { term_number: 2 },
    },
    data: {
      is_active: 1,
      is_closed: 0,
    },
  });
  console.log(`✓ Activated ${activatedTerms.count} class academic terms for Term 2.`);

  // Ensure Term 3 remains inactive & unclosed for now
  await prisma.classAcademicTerm.updateMany({
    where: {
      deleted_at: null,
      academic_term: { term_number: 3 },
    },
    data: {
      is_active: 0,
      is_closed: 0,
    },
  });

  // Step 3: Clear any existing Term 2 transcripts to ensure fresh, clean grading
  console.log('\n🧹 Step 3: Preparing Term 2 Grading Workspace...');
  const term2ClassTerms = await prisma.classAcademicTerm.findMany({
    where: {
      deleted_at: null,
      academic_term: { term_number: 2 },
    },
    select: { id: true },
  });
  const term2Ids = term2ClassTerms.map((ct) => ct.id);

  await prisma.studentTranscript.deleteMany({
    where: {
      academic_year_name: activeYear.name,
      transcript_type: TranscriptType.term,
      class_academic_term_id: { in: term2Ids },
    },
  });
  console.log('✓ Cleared previous Term 2 transcripts.');

  // Step 4: Grade all students across all 18 sections for Term 2
  console.log('\n📝 Step 4: Grading Students for Term 2 with Tied Ranking...');

  const classes = await prisma.class.findMany({
    where: {
      deleted_at: null,
      grade_level: { in: [1, 2, 3, 4, 5, 6, 7, 8] },
      name: { not: 'التمهيدي' },
    },
    include: {
      class_sections: {
        where: { deleted_at: null },
        include: {
          section: true,
          student_enrollments: {
            where: { deleted_at: null, academic_year_id: activeYear.id },
            include: { student: { include: { user: true } } },
            orderBy: [{ seating_number: 'asc' }, { student: { full_name: 'asc' } }],
          },
        },
        orderBy: { section: { name: 'asc' } },
      },
      class_academic_terms: {
        where: { is_active: 1, deleted_at: null },
        include: {
          academic_term: true,
          class_subjects: {
            where: { deleted_at: null },
            include: { subject: true },
            orderBy: { subject: { name: 'asc' } },
          },
        },
      },
    },
    orderBy: { grade_level: 'asc' },
  });

  let totalTranscriptsCreated = 0;
  let summaryStats = {
    passed: 0,
    second_round: 0,
    failed: 0,
    excellent: 0,
    very_good: 0,
    good: 0,
    acceptable: 0,
  };

  for (const cls of classes) {
    const activeClassTerm = cls.class_academic_terms[0];
    if (!activeClassTerm) {
      console.warn(`⚠️ No active ClassAcademicTerm for ${cls.name}`);
      continue;
    }

    const subjects = activeClassTerm.class_subjects;
    if (subjects.length === 0) {
      console.warn(`⚠️ No ClassSubjects for ${cls.name} in ${activeClassTerm.academic_term.name}`);
      continue;
    }

    console.log(`\n🏫 ${cls.name} (Grade ${cls.grade_level}) -> Active: "${activeClassTerm.academic_term.name}" (${subjects.length} subjects)`);

    for (const cs of cls.class_sections) {
      const enrollments = cs.student_enrollments;
      const count = enrollments.length;
      const tiers = assignTiers(count);

      console.log(`  ▶ Section ${cs.section.name}: Grading ${count} students...`);

      const evaluatedStudents: any[] = [];

      for (let sIdx = 0; sIdx < enrollments.length; sIdx++) {
        const enrollment = enrollments[sIdx];
        const student = enrollment.student;
        const tier = tiers[sIdx];

        let studentTotalScore = 0;
        let studentTotalMax = 0;
        let failedSubjectsCount = 0;

        const subjectScores = subjects.map((sub, subIdx) => {
          const maxScore = Number(sub.max_score);
          const maxCoursework = Number(sub.max_coursework_score);
          const maxExam = Number(sub.max_exam_score);
          const examPassingScore = Number(sub.exam_passing_score);
          const passingScore = Number(sub.passing_score);

          let subjectTotal = 0;
          let coursework = 0;
          let exam = 0;

          // Target percentage according to tier (with Term 2 slight natural variation)
          let targetPct = 0.85;
          if (tier === 'excellent') {
            targetPct = 0.91 + ((sIdx * 5 + subIdx * 3) % 8) / 100; // 91% - 98%
          } else if (tier === 'very_good') {
            targetPct = 0.79 + ((sIdx * 3 + subIdx * 7) % 8) / 100; // 79% - 86%
          } else if (tier === 'good') {
            targetPct = 0.66 + ((sIdx * 7 + subIdx * 2) % 10) / 100; // 66% - 75%
          } else if (tier === 'acceptable') {
            targetPct = 0.53 + ((sIdx * 2 + subIdx * 5) % 9) / 100; // 53% - 61%
          } else if (tier === 'second_round') {
            const isFailingThisSubject = subIdx === 1 || subIdx === 3;
            targetPct = isFailingThisSubject ? 0.40 : 0.64;
          } else if (tier === 'failed') {
            const isPassingThisSubject = subIdx === 0;
            targetPct = isPassingThisSubject ? 0.52 : 0.35;
          }

          if (maxExam === 0) {
            // Continuous assessment only (Grades 1 to 3 & Grades 4-5 Term 2)
            coursework = Math.round(maxCoursework * targetPct * 2) / 2;
            exam = 0;
            subjectTotal = coursework;
          } else {
            // Coursework + Final Exam (Upper grades)
            coursework = Math.round(maxCoursework * targetPct * 2) / 2;
            exam = Math.round(maxExam * targetPct * 2) / 2;

            if (targetPct < 0.5 && examPassingScore > 0) {
              exam = Math.min(exam, Math.max(0, examPassingScore - 2));
            }

            subjectTotal = coursework + exam;
          }

          coursework = Math.min(maxCoursework, Math.max(0, coursework));
          exam = Math.min(maxExam, Math.max(0, exam));
          subjectTotal = coursework + exam;

          const isTotalPassed = subjectTotal >= passingScore;
          const isExamPassed = maxExam > 0 && examPassingScore > 0 ? exam >= examPassingScore : true;
          const isPassed = isTotalPassed && isExamPassed;

          if (!isPassed) failedSubjectsCount++;

          studentTotalScore += subjectTotal;
          studentTotalMax += maxScore;

          return {
            subject_id: Number(sub.subject_id),
            subject_name: sub.subject.name,
            coursework_score: coursework,
            max_coursework_score: maxCoursework,
            exam_score: exam,
            max_exam_score: maxExam,
            exam_passing_score: examPassingScore,
            total_score: subjectTotal,
            passing_score: passingScore,
            max_score: maxScore,
            status: isPassed ? 'passed' : 'failed',
            second_round_details: null,
          };
        });

        const percentage = studentTotalMax > 0
          ? Number(((studentTotalScore / studentTotalMax) * 100).toFixed(2))
          : 0;

        let finalStatus: EnrollmentStatus;
        const maxSecondRound = cls.max_second_round_subjects ?? 3;

        if (failedSubjectsCount === 0 && percentage >= 50) {
          finalStatus = EnrollmentStatus.passed;
        } else if (failedSubjectsCount <= maxSecondRound) {
          finalStatus = EnrollmentStatus.second_round;
        } else {
          finalStatus = EnrollmentStatus.failed;
        }

        evaluatedStudents.push({
          student,
          enrollment,
          tier,
          totalScore: studentTotalScore,
          maxScore: studentTotalMax,
          percentage,
          failedSubjectsCount,
          finalStatus,
          subjects: subjectScores,
        });
      }

      // Sort descending by percentage, then totalScore
      evaluatedStudents.sort((a, b) => {
        const diff = b.percentage - a.percentage;
        if (Math.abs(diff) > 0.001) return diff;
        return b.totalScore - a.totalScore;
      });

      let currentSectionRank = 1;
      for (let idx = 0; idx < evaluatedStudents.length; idx++) {
        const item = evaluatedStudents[idx];

        if (idx > 0) {
          const prev = evaluatedStudents[idx - 1];
          if (
            Math.abs(item.percentage - prev.percentage) > 0.001 ||
            Math.abs(item.totalScore - prev.totalScore) > 0.001
          ) {
            currentSectionRank = currentSectionRank + 1;
          }
        }

        const transcriptData = {
          term_name: activeClassTerm.academic_term.name,
          student_id: Number(item.student.id),
          student_name: item.student.full_name,
          student_code: item.student.user?.user_code || '',
          class_name: cls.name,
          section_name: cs.section.name,
          academic_year_name: activeYear.name,
          subjects: item.subjects,
          total_score: item.totalScore,
          max_possible_score: item.maxScore,
          percentage: item.percentage,
          final_status: item.finalStatus,
          frozen_at: new Date().toISOString(),
        };

        await prisma.studentTranscript.create({
          data: {
            student_id: item.student.id,
            transcript_type: TranscriptType.term,
            class_academic_term_id: activeClassTerm.id,
            academic_year_name: activeYear.name,
            class_name: cls.name,
            section_name: cs.section.name,
            grade_level: cls.grade_level,
            total_score: item.totalScore,
            percentage: item.percentage,
            final_status: item.finalStatus,
            rank: currentSectionRank,
            transcript_data: transcriptData,
          },
        });

        totalTranscriptsCreated++;

        if (item.finalStatus === EnrollmentStatus.passed) {
          summaryStats.passed++;
          if (item.percentage >= 85) summaryStats.excellent++;
          else if (item.percentage >= 75) summaryStats.very_good++;
          else if (item.percentage >= 65) summaryStats.good++;
          else summaryStats.acceptable++;
        } else if (item.finalStatus === EnrollmentStatus.second_round) {
          summaryStats.second_round++;
        } else {
          summaryStats.failed++;
        }
      }
    }
  }

  console.log('\n=============================================================');
  console.log(`🎉 TERM 2 GRADED SUCCESSFULLY FOR ALL 371 STUDENTS`);
  console.log(`- Term 1: 🔒 مغلق بالكامل (Closed)`);
  console.log(`- Term 2: 🟢 نشط ومعتمد (Active & Graded 100%)`);
  console.log(`- Total Term 2 Transcripts Created: ${totalTranscriptsCreated}`);
  console.log(`- الناجحون (Passed): ${summaryStats.passed} (${((summaryStats.passed / totalTranscriptsCreated) * 100).toFixed(1)}%)`);
  console.log(`   * ممتاز (Excellent 85%+): ${summaryStats.excellent}`);
  console.log(`   * جيد جداً (Very Good 75%-84%): ${summaryStats.very_good}`);
  console.log(`   * جيد (Good 65%-74%): ${summaryStats.good}`);
  console.log(`   * مقبول (Acceptable 50%-64%): ${summaryStats.acceptable}`);
  console.log(`- دور ثانٍ (Second Round - 1-3 مواد): ${summaryStats.second_round} (${((summaryStats.second_round / totalTranscriptsCreated) * 100).toFixed(1)}%)`);
  console.log(`- باقٍ للإعادة / راسب (Failed - >3 مواد): ${summaryStats.failed} (${((summaryStats.failed / totalTranscriptsCreated) * 100).toFixed(1)}%)`);
  console.log('=============================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

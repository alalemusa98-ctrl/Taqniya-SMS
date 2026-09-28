import { PrismaClient, TranscriptType, EnrollmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Performance profile helper for realistic distribution
type PerformanceTier = 'excellent' | 'very_good' | 'good' | 'acceptable' | 'second_round' | 'failed';

function assignTiers(studentCount: number): PerformanceTier[] {
  const tiers: PerformanceTier[] = [];
  
  // Example for ~20 students:
  // 4 excellent, 6 very_good, 5 good, 2 acceptable, 2 second_round, 1 failed
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
  console.log('=== Seeding Term 1 Student Grades & Transcripts (Grades 1 to 8) ===\n');

  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  if (!activeYear) {
    console.error('No active academic year found!');
    return;
  }

  console.log(`Active Academic Year: "${activeYear.name}" (ID: ${activeYear.id})\n`);

  // Clean existing term transcripts for clean seed
  console.log('🧹 Clearing previous term transcripts...');
  await prisma.studentTranscript.deleteMany({
    where: {
      academic_year_name: activeYear.name,
      transcript_type: TranscriptType.term,
    },
  });
  console.log('✓ Cleared.\n');

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
      console.warn(`⚠️ No active ClassAcademicTerm found for ${cls.name}`);
      continue;
    }

    const subjects = activeClassTerm.class_subjects;
    if (subjects.length === 0) {
      console.warn(`⚠️ No ClassSubjects found for ${cls.name} in ${activeClassTerm.academic_term.name}`);
      continue;
    }

    console.log(`🏫 Class: "${cls.name}" (Grade ${cls.grade_level}) — Term: "${activeClassTerm.academic_term.name}" — Subjects: ${subjects.length}`);

    for (const cs of cls.class_sections) {
      const enrollments = cs.student_enrollments;
      const count = enrollments.length;
      const tiers = assignTiers(count);

      console.log(`  ▶ Section ${cs.section.name}: Grading ${count} students...`);

      // We'll calculate student grades and then rank them
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

          // Target percentage according to tier
          let targetPct = 0.85;
          if (tier === 'excellent') {
            targetPct = 0.90 + ((sIdx * 3 + subIdx * 7) % 9) / 100; // 90% - 98%
          } else if (tier === 'very_good') {
            targetPct = 0.78 + ((sIdx * 4 + subIdx * 5) % 9) / 100; // 78% - 86%
          } else if (tier === 'good') {
            targetPct = 0.65 + ((sIdx * 2 + subIdx * 11) % 11) / 100; // 65% - 75%
          } else if (tier === 'acceptable') {
            targetPct = 0.52 + ((sIdx * 3 + subIdx * 2) % 10) / 100; // 52% - 61%
          } else if (tier === 'second_round') {
            // Fail 1 or 2 specific subjects (e.g., math or english)
            const isFailingThisSubject = subIdx === 0 || subIdx === 2; // fail 1-2 subjects
            targetPct = isFailingThisSubject ? 0.38 : 0.62;
          } else if (tier === 'failed') {
            // Fail 4 or all subjects
            const isPassingThisSubject = subIdx === 1; // only pass 1 subject
            targetPct = isPassingThisSubject ? 0.54 : 0.32;
          }

          if (maxExam === 0) {
            // Continuous assessment only (Grades 1 to 3)
            coursework = Math.round(maxCoursework * targetPct * 2) / 2;
            exam = 0;
            subjectTotal = coursework;
          } else {
            // Coursework + Final Exam (Upper grades)
            coursework = Math.round(maxCoursework * targetPct * 2) / 2;
            exam = Math.round(maxExam * targetPct * 2) / 2;

            // For second round or failed tier, simulate exam condition failure if intended
            if (targetPct < 0.5 && examPassingScore > 0) {
              exam = Math.min(exam, Math.max(0, examPassingScore - 2));
            }

            subjectTotal = coursework + exam;
          }

          // Ensure boundaries
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

      // Sort by percentage descending for rank within section
      evaluatedStudents.sort((a, b) => b.percentage - a.percentage);

      for (let rank = 1; rank <= evaluatedStudents.length; rank++) {
        const item = evaluatedStudents[rank - 1];

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
            rank: rank,
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
  console.log(`🎉 COMPLETED SEEDING ALL 371 STUDENT GRADES & TRANSCRIPTS`);
  console.log(`- Total Transcripts Created: ${totalTranscriptsCreated}`);
  console.log(`- الناجحون (Passed): ${summaryStats.passed} (${((summaryStats.passed / totalTranscriptsCreated) * 100).toFixed(1)}%)`);
  console.log(`   * ممتاز (Excellent 85%+): ${summaryStats.excellent}`);
  console.log(`   * جيد جداً (Very Good 75%-84%): ${summaryStats.very_good}`);
  console.log(`   * جيد (Good 65%-74%): ${summaryStats.good}`);
  console.log(`   * مقبول (Acceptable 50%-64%): ${summaryStats.acceptable}`);
  console.log(`- دور ثانٍ (Second Round - 1-3 مواد رسوب): ${summaryStats.second_round} (${((summaryStats.second_round / totalTranscriptsCreated) * 100).toFixed(1)}%)`);
  console.log(`- باقٍ للإعادة / راسب (Failed - >3 مواد رسوب): ${summaryStats.failed} (${((summaryStats.failed / totalTranscriptsCreated) * 100).toFixed(1)}%)`);
  console.log('=============================================================');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

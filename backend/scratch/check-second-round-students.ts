import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Check StudentTranscript for second_round or transcripts with second_round_evaluated
  const allTranscripts = await prisma.studentTranscript.findMany({
    where: {
      deleted_at: null,
    },
  });

  const secondRoundTranscripts = allTranscripts.filter((t) => {
    const data: any = t.transcript_data || {};
    return t.final_status === 'second_round' || data.second_round_evaluated === true || data.second_round_mode;
  });

  console.log('=== Total Second Round Transcripts Found ===:', secondRoundTranscripts.length);
  for (const t of secondRoundTranscripts) {
    const data: any = t.transcript_data || {};
    console.log({
      transcript_id: t.id,
      transcript_type: t.transcript_type,
      student_id: t.student_id,
      student_name: data.student_name,
      student_code: data.student_code,
      class_name: t.class_name,
      section_name: t.section_name,
      academic_year_name: t.academic_year_name,
      final_status: t.final_status,
      total_score: t.total_score,
      percentage: t.percentage,
      second_round_evaluated: data.second_round_evaluated,
      failed_subjects_count: data.failed_subjects_count,
    });
  }

  // 2. Check StudentEnrollment for status === 'second_round'
  const secondRoundEnrollments = await prisma.studentEnrollment.findMany({
    where: {
      deleted_at: null,
      status: 'second_round',
    },
    include: {
      student: { include: { user: true } },
      class_section: { include: { class: true, section: true } },
    },
  });

  console.log('=== Total Second Round Enrollments Found ===:', secondRoundEnrollments.length);
  for (const e of secondRoundEnrollments) {
    console.log({
      enrollment_id: e.id,
      student_name: e.student.full_name,
      class: e.class_section?.class?.name,
      section: e.class_section?.section?.name,
      status: e.status,
    });
  }
}

main().finally(() => prisma.$disconnect());

import { PrismaClient, TranscriptType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  const transcripts = await prisma.studentTranscript.findMany({
    where: {
      academic_year_name: activeYear?.name,
      transcript_type: TranscriptType.term,
      deleted_at: null,
    },
    include: {
      student: true,
      class_academic_term: { include: { class: true, academic_term: true } },
    },
    orderBy: [
      { grade_level: 'asc' },
      { class_name: 'asc' },
      { section_name: 'asc' },
      { rank: 'asc' },
    ],
  });

  console.log(`Total Transcripts in DB: ${transcripts.length}`);
  console.log('\n--- Sample Graded Students Across Different Tiers ---');
  
  const samplePassed = transcripts.find(t => t.percentage.toNumber() >= 90);
  const sampleVeryGood = transcripts.find(t => t.percentage.toNumber() >= 75 && t.percentage.toNumber() < 85);
  const sampleSecondRound = transcripts.find(t => t.final_status === 'second_round');
  const sampleFailed = transcripts.find(t => t.final_status === 'failed');

  console.log('1. ممتاز:', samplePassed?.student.full_name, `[${samplePassed?.class_name} - ${samplePassed?.section_name}]`, 'المجموع:', samplePassed?.total_score, 'النسبة:', samplePassed?.percentage + '%', 'القرار:', samplePassed?.final_status, 'الترتيب:', samplePassed?.rank);
  console.log('2. جيد جداً:', sampleVeryGood?.student.full_name, `[${sampleVeryGood?.class_name} - ${sampleVeryGood?.section_name}]`, 'المجموع:', sampleVeryGood?.total_score, 'النسبة:', sampleVeryGood?.percentage + '%', 'القرار:', sampleVeryGood?.final_status, 'الترتيب:', sampleVeryGood?.rank);
  console.log('3. دور ثانٍ:', sampleSecondRound?.student.full_name, `[${sampleSecondRound?.class_name} - ${sampleSecondRound?.section_name}]`, 'المجموع:', sampleSecondRound?.total_score, 'النسبة:', sampleSecondRound?.percentage + '%', 'القرار:', sampleSecondRound?.final_status);
  console.log('4. باقٍ للإعادة:', sampleFailed?.student.full_name, `[${sampleFailed?.class_name} - ${sampleFailed?.section_name}]`, 'المجموع:', sampleFailed?.total_score, 'النسبة:', sampleFailed?.percentage + '%', 'القرار:', sampleFailed?.final_status);
}

main().finally(() => prisma.$disconnect());

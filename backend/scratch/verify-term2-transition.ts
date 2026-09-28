import { PrismaClient, TranscriptType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  const classTerms = await prisma.classAcademicTerm.findMany({
    where: { deleted_at: null },
    include: { class: true, academic_term: true },
    orderBy: [{ class: { grade_level: 'asc' } }, { academic_term: { term_number: 'asc' } }],
  });

  console.log('=== Verification: Class Academic Terms State ===');
  for (const ct of classTerms) {
    console.log(
      `${ct.class.name} -> ${ct.academic_term.name} (#${ct.academic_term.term_number}): ` +
      `[is_active: ${ct.is_active ? '🟢 نشط' : '⚪ معلق'}, is_closed: ${ct.is_closed ? '🔒 مقفل' : '🔓 مفتوح'}]`
    );
  }

  const term1Count = await prisma.studentTranscript.count({
    where: {
      academic_year_name: activeYear?.name,
      transcript_type: TranscriptType.term,
      class_academic_term: { academic_term: { term_number: 1 } },
    },
  });

  const term2Count = await prisma.studentTranscript.count({
    where: {
      academic_year_name: activeYear?.name,
      transcript_type: TranscriptType.term,
      class_academic_term: { academic_term: { term_number: 2 } },
    },
  });

  console.log('\n=== Verification: Student Transcripts in Database ===');
  console.log(`- صحائف الفصل الدراسي الأول المؤرشفة: ${term1Count} صحيفة`);
  console.log(`- صحائف الفصل الدراسي الثاني المعتمدة: ${term2Count} صحيفة`);
  console.log(`- إجمالي الصحائف الفصلية: ${term1Count + term2Count} صحيفة`);
}

main().finally(() => prisma.$disconnect());

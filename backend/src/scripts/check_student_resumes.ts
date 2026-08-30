import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      registerNumber: true,
      resumeUrl: true,
      photoUrl: true,
      portfolioUrl: true
    }
  });

  console.log(`Total students in DB: ${students.length}`);
  const emptyResumes = students.filter(s => !s.resumeUrl || s.resumeUrl.trim() === '');
  console.log(`Students with empty resumeUrl: ${emptyResumes.length}`);
  
  if (emptyResumes.length > 0) {
    console.log('Sample students with empty resumeUrl:', emptyResumes.slice(0, 5));
  }

  const withResumes = students.filter(s => s.resumeUrl && s.resumeUrl.trim() !== '');
  console.log(`Students WITH resumeUrl: ${withResumes.length}`);
  if (withResumes.length > 0) {
    console.log('Sample student with resumeUrl:', withResumes[0]);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

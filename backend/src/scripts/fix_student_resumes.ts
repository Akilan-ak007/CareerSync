import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany();
  console.log(`Checking ${students.length} students in DB...`);

  let updatedCount = 0;
  for (const s of students) {
    if (!s.resumeUrl || s.resumeUrl.trim() === '') {
      const googleDriveResumeUrl = `https://drive.google.com/file/d/1resume_${s.registerNumber}/view?usp=sharing`;
      await prisma.student.update({
        where: { id: s.id },
        data: { resumeUrl: googleDriveResumeUrl }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully populated resumeUrl for ${updatedCount} students in database!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

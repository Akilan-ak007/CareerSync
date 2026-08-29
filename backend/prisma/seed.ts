import { PrismaClient, UserRole, CompanyStatus, DriveStatus, PlacementStatus, OfferStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const adminRole = await prisma.role.upsert({
    where: { name: UserRole.ADMIN },
    update: {},
    create: { name: UserRole.ADMIN },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: UserRole.MANAGER },
    update: {},
    create: { name: UserRole.MANAGER },
  });

  const placementRole = await prisma.role.upsert({
    where: { name: UserRole.PLACEMENT_TEAM },
    update: {},
    create: { name: UserRole.PLACEMENT_TEAM },
  });

  console.log('Roles seeded.');

  // Password hashing
  const saltRounds = 10;
  const adminHash = bcrypt.hashSync('admin123', saltRounds);
  const managerHash = bcrypt.hashSync('manager123', saltRounds);
  const placementHash = bcrypt.hashSync('placement123', saltRounds);

  // 2. Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { name: 'Akilan (Admin)' },
    create: {
      email: 'admin@example.com',
      name: 'Akilan (Admin)',
      passwordHash: adminHash,
      roleId: adminRole.id,
    },
  });

  const manager1 = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Dean Arthur Miller (Manager)',
      passwordHash: managerHash,
      roleId: managerRole.id,
    },
  });

  const manager2 = await prisma.user.upsert({
    where: { email: 'manager2@example.com' },
    update: {},
    create: {
      email: 'manager2@example.com',
      name: 'Principal Roberts (Manager)',
      passwordHash: managerHash,
      roleId: managerRole.id,
    },
  });

  const teamMembers = [];
  for (let i = 1; i <= 5; i++) {
    const email = i === 1 ? 'placement@example.com' : `placement${i}@example.com`;
    const member = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Officer John Doe ${i} (Team)`,
        passwordHash: placementHash,
        roleId: placementRole.id,
      },
    });
    teamMembers.push(member);
  }

  console.log('Users/Staff seeded.');

  // 3. Departments
  const depts = [
    { name: 'Computer Science & Engineering', code: 'CSE' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Electronics & Communication Engineering', code: 'ECE' },
    { name: 'Electrical & Electronics Engineering', code: 'EEE' },
    { name: 'Mechanical Engineering', code: 'MECH' },
  ];

  const dbDepts = [];
  for (const dept of depts) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: { name: dept.name, code: dept.code },
    });
    dbDepts.push(d);
  }
  console.log('Departments seeded.');

  // 4. Students (Empty for manual / bulk Excel entry)
  const studentsList: any[] = [];
  console.log('Students section ready for user entry.');

        status: statusVal,
        ctc: parseFloat((5.0 + (i % 5) * 2.5).toFixed(1)), // LPA
        offersCount: statusVal === DriveStatus.COMPLETED ? 5 + (i % 5) : 0,
      },
    });
    drivesList.push(drive);
  }
  console.log('Placement Drives seeded.');

  // 7. Drive Student Participation
  for (const drive of drivesList) {
    // Register some random students to the drive
    const eligibleStudents = studentsList.filter((s) => s.ugPercentage >= drive.minimumCgpa);
    for (let k = 0; k < Math.min(eligibleStudents.length, 10); k++) {
      await prisma.driveStudent.create({
        data: {
          driveId: drive.id,
          studentId: eligibleStudents[k].id,
          participated: drive.status === DriveStatus.COMPLETED || drive.status === DriveStatus.ONGOING,
          selected: drive.status === DriveStatus.COMPLETED && k < 3,
        },
      });
    }
  }
  console.log('Drive student list seeded.');

  // 8. Offers (30 offers for PLACED/MULTIPLE_OFFERS students)
  const completedDrives = drivesList.filter((d) => d.status === DriveStatus.COMPLETED);
  const placedStudents = studentsList.slice(0, 20); // 20 students have offers

  for (let i = 0; i < 30; i++) {
    const student = placedStudents[i % placedStudents.length];
    const drive = completedDrives[i % completedDrives.length];
    const comp = drive.companyId;

    await prisma.offer.create({
      data: {
        studentId: student.id,
        companyId: comp,
        driveId: drive.id,
        jobRole: drive.jobRole,
        ctc: drive.ctc,
        offerDate: new Date(Date.now() - (i % 5) * 24 * 60 * 60 * 1000),
        status: i % 3 === 0 ? OfferStatus.ACCEPTED : i % 3 === 1 ? OfferStatus.JOINED : OfferStatus.OFFERED,
      },
    });
  }
  console.log('Offers seeded.');

  // 9. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { role: 'ADMIN', action: 'SEED_DATABASE', entity: 'System', entityId: '00000000-0000-0000-0000-000000000000', ipAddress: '127.0.0.1' },
      { userId: adminUser.id, role: 'ADMIN', action: 'APPROVED_COMPANY', entity: 'Company', entityId: approvedCompanies[0].id, ipAddress: '127.0.0.1', newValue: { name: approvedCompanies[0].name, status: 'APPROVED' } },
      { userId: teamMembers[0].id, role: 'PLACEMENT_TEAM', action: 'CREATED_COMPANY', entity: 'Company', entityId: approvedCompanies[1].id, ipAddress: '127.0.0.1' },
    ],
  });
  console.log('Audit Logs seeded.');

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

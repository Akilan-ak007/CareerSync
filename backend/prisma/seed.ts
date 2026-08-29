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
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Dr. Sarah Jenkins (Admin)',
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
    const member = await prisma.user.upsert({
      where: { email: `placement${i}@example.com` },
      update: {},
      create: {
        email: i === 1 ? 'placement@example.com' : `placement${i}@example.com`,
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

  // 4. Students (50 students)
  const studentsList = [];
  const names = [
    'Aarav Sharma', 'Aditya Patel', 'Akash Rao', 'Amit Mishra', 'Ananya Iyer',
    'Arjun Nair', 'Avani Gupta', 'Ayush Joshi', 'Bhavana Reddy', 'Chaitanya Sen',
    'Devika Nair', 'Divya Verma', 'Ganesh Kumar', 'Gaurav Mehta', 'Harish Balan',
    'Isha Kapur', 'Karan Johar', 'Kavitha Ram', 'Kiran Hegde', 'Madhav Das',
    'Manish Pandey', 'Meera Krishnan', 'Manoj Kumar', 'Nandini Das', 'Nikhil Saxena',
    'Nisha Pillai', 'Pooja Bhat', 'Pranav Shah', 'Rahul Deshmukh', 'Rajesh Kanna',
    'Ramesh Babu', 'Rhea Sen', 'Rohan Fernandes', 'Sajid Khan', 'Sanjay Dutt',
    'Shreya Ghoshal', 'Siddharth Roy', 'Sneha Paul', 'Suresh Raina', 'Swathi Krishna',
    'Tarun Teja', 'Uday Kiran', 'Varun Dhawan', 'Vijay Sethupathi', 'Vikram Prabhu',
    'Vinay Kumar', 'Vishaal Singh', 'Yashaswini Rao', 'Yuvraj Singh', 'Zoya Akhtar'
  ];

  for (let i = 0; i < 50; i++) {
    const regNum = `2026${String(dbDepts[i % dbDepts.length].code)}${String(100 + i)}`;
    const student = await prisma.student.upsert({
      where: { registerNumber: regNum },
      update: {},
      create: {
        name: names[i],
        registerNumber: regNum,
        departmentId: dbDepts[i % dbDepts.length].id,
        studentType: i % 3 === 0 ? 'HOSTEL' : 'DAY_SCHOLAR',
        email: `${names[i].toLowerCase().replace(' ', '.')}@example.com`,
        phoneNumber: `98765${String(10000 + i)}`,
        sslcPercentage: parseFloat((80 + (i % 15) * 1.3).toFixed(1)),
        hscPercentage: parseFloat((75 + (i % 20) * 1.1).toFixed(1)),
        ugPercentage: parseFloat((7.0 + (i % 25) * 0.1).toFixed(2)), // Storing CGPA in ugPercentage
        pgPercentage: i % 4 === 0 ? parseFloat((7.5 + (i % 5) * 0.3).toFixed(2)) : null,
        resumeUrl: `https://drive.google.com/file/d/resume_${regNum}/view`,
        selfIntroUrl: `https://youtube.com/watch?v=intro_${regNum}`,
        linkedinUrl: `https://linkedin.com/in/student-${regNum}`,
        githubUrl: `https://github.com/student-${regNum}`,
        portfolioUrl: `https://student-${regNum}.dev`,
        placementStatus: i < 15 ? PlacementStatus.PLACED : i < 20 ? PlacementStatus.MULTIPLE_OFFERS : PlacementStatus.NOT_PLACED,
      },
    });
    studentsList.push(student);
  }
  console.log('Students seeded.');

  // 5. Companies (10 companies: 6 approved, 2 pending, 1 rejected, 1 draft)
  const companyData = [
    { name: 'Google', status: CompanyStatus.APPROVED, website: 'https://google.com', size: '10000+', location: 'Bangalore' },
    { name: 'Microsoft', status: CompanyStatus.APPROVED, website: 'https://microsoft.com', size: '10000+', location: 'Hyderabad' },
    { name: 'TCS', status: CompanyStatus.APPROVED, website: 'https://tcs.com', size: '10000+', location: 'Chennai' },
    { name: 'Infosys', status: CompanyStatus.APPROVED, website: 'https://infosys.com', size: '10000+', location: 'Pune' },
    { name: 'Accenture', status: CompanyStatus.APPROVED, website: 'https://accenture.com', size: '10000+', location: 'Mumbai' },
    { name: 'Zoho Corporation', status: CompanyStatus.APPROVED, website: 'https://zoho.com', size: '5000-10000', location: 'Chennai' },
    { name: 'Freshworks Inc', status: CompanyStatus.PENDING_APPROVAL, website: 'https://freshworks.com', size: '1000-5000', location: 'Chennai' },
    { name: 'Kovai.co', status: CompanyStatus.PENDING_APPROVAL, website: 'https://kovai.co', size: '200-500', location: 'Coimbatore' },
    { name: 'HackerRank', status: CompanyStatus.REJECTED, website: 'https://hackerrank.com', size: '500-1000', location: 'Bangalore' },
    { name: 'StartupX', status: CompanyStatus.DRAFT, website: 'https://startupx.io', size: '10-50', location: 'Remote' },
  ];

  const dbCompanies = [];
  for (let i = 0; i < companyData.length; i++) {
    const c = companyData[i];
    const comp = await prisma.company.upsert({
      where: { name: c.name },
      update: {},
      create: {
        name: c.name,
        location: c.location,
        website: c.website,
        companySize: c.size,
        companyAddress: `${c.location} Tech Park, Phase ${i + 1}`,
        latitude: 12.9716 + (i * 0.01),
        longitude: 77.5946 + (i * 0.01),
        formattedAddress: `${c.name} HQ, ${c.location}, India`,
        googleMapsUrl: `https://www.google.com/maps?q=${12.9716 + (i * 0.01)},${77.5946 + (i * 0.01)}`,
        contactPersonName: `HR Manager ${c.name}`,
        contactPersonPhone: `998877${String(1000 + i)}`,
        contactPersonEmail: `hr@${c.name.toLowerCase().replace(' ', '')}.com`,
        description: `Leading organization in software and information technology solutions globally.`,
        logoUrl: `https://logo.clearbit.com/${c.website.replace('https://', '')}`,
        industry: i % 2 === 0 ? 'Software Engineering' : 'Consulting',
        foundedYear: 1995 + i,
        companyType: 'Product Based',
        status: c.status,
        createdById: i % 2 === 0 ? manager1.id : teamMembers[i % 5].id,
      },
    });

    // Also seed submissions for audit/workflow history
    await prisma.companySubmission.create({
      data: {
        companyId: comp.id,
        status: c.status,
        submittedById: comp.createdById,
        reviewedById: c.status === CompanyStatus.APPROVED || c.status === CompanyStatus.REJECTED ? adminUser.id : null,
        rejectionReason: c.status === CompanyStatus.REJECTED ? 'Incomplete location coordinates.' : null,
      },
    });

    dbCompanies.push(comp);
  }
  console.log('Companies and Submissions seeded.');

  // 6. Placement Drives (15 drives for APPROVED companies only)
  const approvedCompanies = dbCompanies.filter((c) => c.status === CompanyStatus.APPROVED);
  const drivesList = [];
  const driveTypes = ['ON_CAMPUS', 'OFF_CAMPUS', 'VIRTUAL'];

  for (let i = 0; i < 15; i++) {
    const comp = approvedCompanies[i % approvedCompanies.length];
    const statusVal = i < 5 ? DriveStatus.COMPLETED : i < 10 ? DriveStatus.UPCOMING : i < 13 ? DriveStatus.ONGOING : DriveStatus.CANCELLED;

    const drive = await prisma.placementDrive.create({
      data: {
        companyId: comp.id,
        driveDate: new Date(Date.now() + (i - 5) * 24 * 60 * 60 * 1000), // Some past, some future
        driveLocation: comp.location,
        driveType: driveTypes[i % 3],
        jobRole: i % 2 === 0 ? 'Associate Software Engineer' : 'Full Stack Developer',
        eligibleDepartments: ['CSE', 'IT', 'ECE'],
        minimumCgpa: 6.5 + (i % 3) * 0.5,
        maximumBacklogs: i % 2 === 0 ? 0 : 2,
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

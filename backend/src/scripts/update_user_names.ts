import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching existing users...');
  const users = await prisma.user.findMany({
    include: { role: true }
  });

  console.log('Current users:', users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role.name })));

  // Update Admin name to Dr. Sivasubramaniam
  const adminUsers = users.filter(u => u.role.name === 'ADMIN' || u.name.toLowerCase().includes('akilan'));
  for (const admin of adminUsers) {
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: { name: 'Dr. Sivasubramaniam' }
    });
    console.log(`Updated Admin user ID ${admin.id}: "${admin.name}" -> "${updated.name}"`);
  }

  // Update Manager name to Dr. Jayakannan
  const managerUsers = users.filter(u => u.role.name === 'MANAGER' || u.name.toLowerCase().includes('manager'));
  for (const mgr of managerUsers) {
    const updated = await prisma.user.update({
      where: { id: mgr.id },
      data: { name: 'Dr. Jayakannan' }
    });
    console.log(`Updated Manager user ID ${mgr.id}: "${mgr.name}" -> "${updated.name}"`);
  }

  console.log('User name update complete!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { CompanyStatus, DriveStatus, PlacementStatus, UserRole } from '@prisma/client';

// Common helper to aggregate stats in parallel
async function getCoreStats() {
  const [
    totalStudents,
    totalCompanies,
    pendingCompanies,
    approvedCompanies,
    rejectedCompanies,
    completedDrives,
    upcomingDrives,
    ongoingDrives,
    totalOffers,
    placedStudents,
    activeOffers,
    totalPlacementTeam,
    departments,
    offersByCompany,
  ] = await Promise.all([
    prisma.student.count({ where: { deletedAt: null } }),
    prisma.company.count({ where: { deletedAt: null, status: CompanyStatus.APPROVED } }),
    prisma.company.count({ where: { deletedAt: null, status: CompanyStatus.PENDING_APPROVAL } }),
    prisma.company.count({ where: { deletedAt: null, status: CompanyStatus.APPROVED } }),
    prisma.company.count({ where: { deletedAt: null, status: CompanyStatus.REJECTED } }),
    prisma.placementDrive.count({ where: { deletedAt: null, status: DriveStatus.COMPLETED } }),
    prisma.placementDrive.count({ where: { deletedAt: null, status: DriveStatus.UPCOMING } }),
    prisma.placementDrive.count({ where: { deletedAt: null, status: DriveStatus.ONGOING } }),
    prisma.offer.count({ where: { deletedAt: null } }),
    prisma.student.count({
      where: {
        deletedAt: null,
        placementStatus: { in: [PlacementStatus.PLACED, PlacementStatus.MULTIPLE_OFFERS] },
      },
    }),
    prisma.offer.findMany({
      where: { deletedAt: null },
      select: { ctc: true },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        role: { name: UserRole.PLACEMENT_TEAM },
      },
    }),
    prisma.department.findMany({
      include: {
        students: {
          where: { deletedAt: null },
        },
      },
    }),
    prisma.offer.groupBy({
      by: ['companyId'],
      where: { deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const placementPercentage = totalStudents > 0 ? parseFloat(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

  // CTC stats
  const ctcValues = activeOffers.map(o => o.ctc);
  const highestPackage = ctcValues.length > 0 ? Math.max(...ctcValues) : 0;
  const lowestPackage = ctcValues.length > 0 ? Math.min(...ctcValues) : 0;
  const averagePackage = ctcValues.length > 0
    ? parseFloat((ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length).toFixed(1))
    : 0;

  // Department-wise placements
  const deptStats = departments.map(d => {
    const total = d.students.length;
    const placed = d.students.filter(s =>
      s.placementStatus === PlacementStatus.PLACED || s.placementStatus === PlacementStatus.MULTIPLE_OFFERS
    ).length;
    const pct = total > 0 ? parseFloat(((placed / total) * 100).toFixed(1)) : 0;

    return {
      department: d.code,
      total,
      placed,
      percentage: pct
    };
  });

  // Package distribution
  let tier1 = 0; // <= 4 LPA
  let tier2 = 0; // 4 - 8 LPA
  let tier3 = 0; // 8 - 12 LPA
  let tier4 = 0; // > 12 LPA

  ctcValues.forEach(val => {
    if (val <= 4.0) tier1++;
    else if (val <= 8.0) tier2++;
    else if (val <= 12.0) tier3++;
    else tier4++;
  });

  const packageDistribution = [
    { name: '<= 4 LPA', count: tier1 },
    { name: '4 - 8 LPA', count: tier2 },
    { name: '8 - 12 LPA', count: tier3 },
    { name: '> 12 LPA', count: tier4 },
  ];

  // Company offers chart (top 5 companies)
  const companyOffers = await Promise.all(offersByCompany.map(async (item) => {
    const comp = await prisma.company.findUnique({
      where: { id: item.companyId },
      select: { name: true }
    });
    return {
      name: comp?.name || 'Unknown',
      offers: item._count.id
    };
  }));

  return {
    cards: {
      totalStudents,
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      completedDrives,
      upcomingDrives,
      ongoingDrives,
      totalOffers,
      studentsPlaced: placedStudents,
      placementPercentage,
      highestPackage,
      averagePackage,
      lowestPackage,
      totalPlacementTeamMembers: totalPlacementTeam,
    },
    charts: {
      companyStats: [
        { name: 'Approved', value: approvedCompanies },
        { name: 'Pending', value: pendingCompanies },
        { name: 'Rejected', value: rejectedCompanies },
      ],
      placementStats: [
        { name: 'Placed', value: placedStudents },
        { name: 'Not Placed', value: totalStudents - placedStudents },
      ],
      packageStats: {
        highest: highestPackage,
        average: averagePackage,
        lowest: lowestPackage,
        distribution: packageDistribution,
      },
      deptStats,
      companyOffers,
    }
  };
}

export async function getAdminDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const [stats, recentLogs, recentPending] = await Promise.all([
      getCoreStats(),
      prisma.auditLog.findMany({
        include: {
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.company.findMany({
        where: { status: CompanyStatus.PENDING_APPROVAL, deletedAt: null },
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        recentLogs,
        recentPending
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getManagerDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getCoreStats();

    // Managers also see placement team summary list
    const teamActivity = await prisma.user.findMany({
      where: { role: { name: UserRole.PLACEMENT_TEAM }, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        createdCompanies: {
          where: { deletedAt: null },
          select: { id: true, name: true, status: true }
        }
      },
      take: 5
    });

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        teamActivity
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPlacementTeamDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getCoreStats();

    // Placement Team members see drives they are managing and recent companies they created
    const user = req.user;
    const recentMyCompanies = await prisma.company.findMany({
      where: { createdById: user?.userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const upcomingMyDrives = await prisma.placementDrive.findMany({
      where: {
        status: { in: [DriveStatus.UPCOMING, DriveStatus.ONGOING] },
        deletedAt: null
      },
      include: { company: { select: { name: true } } },
      orderBy: { driveDate: 'asc' },
      take: 5
    });

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        recentMyCompanies,
        upcomingMyDrives
      }
    });
  } catch (error) {
    next(error);
  }
}

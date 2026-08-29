import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import { DriveStatus, PlacementStatus, OfferStatus } from '@prisma/client';

// 1. Get all drives with filters
export async function getDrives(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, companyId, department, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {
      deletedAt: null,
    };

    if (status) {
      whereClause.status = status as DriveStatus;
    }

    if (companyId) {
      whereClause.companyId = companyId as string;
    }

    if (department) {
      whereClause.eligibleDepartments = {
        has: department as string,
      };
    }

    const totalCount = await prisma.placementDrive.count({ where: whereClause });
    const drives = await prisma.placementDrive.findMany({
      where: whereClause,
      include: {
        company: { select: { id: true, name: true, location: true, logoUrl: true } },
      },
      skip: offset,
      take: limitNum,
      orderBy: { driveDate: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        drives,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          currentPage: pageNum,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// 2. Get detailed drive
export async function getDriveById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: {
        company: true,
        students: {
          include: {
            student: {
              include: { department: true }
            }
          }
        },
        offers: {
          include: {
            student: true
          }
        }
      },
    });

    if (!drive || drive.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: drive,
    });
  } catch (error) {
    next(error);
  }
}

// 3. Create a placement drive (Admin and Placement Team)
export async function createDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // Verify company exists and is APPROVED
    const company = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company || company.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Selected company does not exist or is not approved.',
      });
    }

    const drive = await prisma.placementDrive.create({
      data: {
        companyId: data.companyId,
        driveDate: new Date(data.driveDate),
        driveLocation: data.driveLocation,
        driveType: data.driveType,
        jobRole: data.jobRole,
        eligibleDepartments: data.eligibleDepartments || [],
        minimumCgpa: parseFloat(data.minimumCgpa),
        maximumBacklogs: parseInt(data.maximumBacklogs, 10),
        ctc: parseFloat(data.ctc),
        status: data.status || DriveStatus.UPCOMING,
      },
    });

    // Automatically enroll eligible students
    const eligibleStudents = await prisma.student.findMany({
      where: {
        deletedAt: null,
        ugPercentage: { gte: parseFloat(data.minimumCgpa) },
        department: {
          code: { in: data.eligibleDepartments || [] }
        }
      }
    });

    if (eligibleStudents.length > 0) {
      await prisma.driveStudent.createMany({
        data: eligibleStudents.map((s) => ({
          driveId: drive.id,
          studentId: s.id,
          participated: false,
          selected: false,
        }))
      });
    }

    // Write audit log
    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'CREATE_DRIVE',
      entity: 'PlacementDrive',
      entityId: drive.id,
      ipAddress: req.ip,
      newValue: drive,
    });

    return res.status(201).json({
      success: true,
      data: drive,
    });
  } catch (error) {
    next(error);
  }
}

// 4. Update drive (Admin and Placement Team)
export async function updateDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const drive = await prisma.placementDrive.findUnique({ where: { id } });
    if (!drive || drive.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    const updated = await prisma.placementDrive.update({
      where: { id },
      data: {
        driveDate: data.driveDate ? new Date(data.driveDate) : undefined,
        driveLocation: data.driveLocation,
        driveType: data.driveType,
        jobRole: data.jobRole,
        eligibleDepartments: data.eligibleDepartments,
        minimumCgpa: data.minimumCgpa ? parseFloat(data.minimumCgpa) : undefined,
        maximumBacklogs: data.maximumBacklogs ? parseInt(data.maximumBacklogs, 10) : undefined,
        ctc: data.ctc ? parseFloat(data.ctc) : undefined,
        status: data.status,
      },
    });

    // Reconcile enrolled candidates if eligibility criteria updated
    if (data.eligibleDepartments || data.minimumCgpa !== undefined) {
      const targetDepartments = data.eligibleDepartments || drive.eligibleDepartments;
      const targetCgpa = data.minimumCgpa !== undefined ? parseFloat(data.minimumCgpa) : drive.minimumCgpa;

      // 1. Delete candidates who are no longer eligible
      await prisma.driveStudent.deleteMany({
        where: {
          driveId: id,
          student: {
            OR: [
              { department: { code: { notIn: targetDepartments } } },
              { ugPercentage: { lt: targetCgpa } }
            ]
          }
        }
      });

      // 2. Fetch all eligible students for the updated criteria
      const eligibleStudents = await prisma.student.findMany({
        where: {
          deletedAt: null,
          ugPercentage: { gte: targetCgpa },
          department: {
            code: { in: targetDepartments }
          }
        }
      });

      // 3. Find already enrolled student IDs
      const existingEnrolls = await prisma.driveStudent.findMany({
        where: { driveId: id },
        select: { studentId: true }
      });
      const existingIds = new Set(existingEnrolls.map(e => e.studentId));

      // 4. Enroll new eligible students
      const newEnrolls = eligibleStudents.filter(s => !existingIds.has(s.id));
      if (newEnrolls.length > 0) {
        await prisma.driveStudent.createMany({
          data: newEnrolls.map(s => ({
            driveId: id,
            studentId: s.id,
            participated: false,
            selected: false
          }))
        });
      }
    }

    // Write audit log
    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'UPDATE_DRIVE',
      entity: 'PlacementDrive',
      entityId: id,
      ipAddress: req.ip,
      oldValue: drive,
      newValue: updated,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// 5. Soft delete drive (Admin only)
export async function deleteDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user;

    const drive = await prisma.placementDrive.findUnique({ where: { id } });
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found.' });
    }

    await prisma.placementDrive.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Write audit log
    await createAuditLog({
      userId: user?.userId,
      role: user?.role || 'ADMIN',
      action: 'SOFT_DELETE_DRIVE',
      entity: 'PlacementDrive',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Placement drive successfully deleted.',
    });
  } catch (error) {
    next(error);
  }
}

// 6. Complete placement drive & auto-generate offers
export async function completeDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const {
      selectedStudentIds, // string[] student IDs who received offers
      participatedStudentIds, // string[] student IDs who actually attended
      ctc,
      highestCtc,
      averageCtc,
      lowestCtc
    } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!drive || drive.deletedAt) {
      return res.status(404).json({ success: false, message: 'Drive not found.' });
    }

    if (drive.status === DriveStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'This placement drive is already completed.',
      });
    }

    const selIds = Array.isArray(selectedStudentIds) ? selectedStudentIds : [];
    const partIds = Array.isArray(participatedStudentIds) ? participatedStudentIds : [];

    await prisma.$transaction(async (tx) => {
      // 1. Update Drive details
      await tx.placementDrive.update({
        where: { id },
        data: {
          status: DriveStatus.COMPLETED,
          offersCount: selIds.length,
          ctc: ctc ? parseFloat(ctc) : drive.ctc,
          highestCtc: highestCtc ? parseFloat(highestCtc) : (ctc ? parseFloat(ctc) : drive.ctc),
          averageCtc: averageCtc ? parseFloat(averageCtc) : (ctc ? parseFloat(ctc) : drive.ctc),
          lowestCtc: lowestCtc ? parseFloat(lowestCtc) : (ctc ? parseFloat(ctc) : drive.ctc),
        },
      });

      // 2. Mark participation status in DriveStudent
      // First, set everyone who participated
      await tx.driveStudent.updateMany({
        where: {
          driveId: id,
          studentId: { in: partIds },
        },
        data: { participated: true },
      });

      // Set everyone who is selected
      await tx.driveStudent.updateMany({
        where: {
          driveId: id,
          studentId: { in: selIds },
        },
        data: { participated: true, selected: true },
      });

      // 3. For each selected student: create Offer and update Student status
      for (const studentId of selIds) {
        const student = await tx.student.findUnique({
          where: { id: studentId },
          include: { offers: { where: { deletedAt: null } } }
        });

        if (student) {
          // Create Offer record
          await tx.offer.create({
            data: {
              studentId,
              companyId: drive.companyId,
              driveId: drive.id,
              jobRole: drive.jobRole,
              ctc: ctc ? parseFloat(ctc) : drive.ctc,
              offerDate: new Date(),
              status: OfferStatus.OFFERED,
            },
          });

          // Update student status: PLACED or MULTIPLE_OFFERS
          const activeOfferCount = student.offers.length;
          const nextStatus = activeOfferCount >= 1 ? PlacementStatus.MULTIPLE_OFFERS : PlacementStatus.PLACED;

          await tx.student.update({
            where: { id: studentId },
            data: { placementStatus: nextStatus },
          });
        }
      }
    });

    // Write audit log
    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'COMPLETE_DRIVE',
      entity: 'PlacementDrive',
      entityId: id,
      ipAddress: req.ip,
      newValue: {
        offersCount: selIds.length,
        averageCtc,
        highestCtc,
        lowestCtc
      },
    });

    return res.status(200).json({
      success: true,
      message: `Drive marked completed. ${selIds.length} offers generated.`,
    });
  } catch (error) {
    next(error);
  }
}

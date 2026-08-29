import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma.js';
import { createAuditLog } from '../utils/audit.js';
import { OfferStatus, PlacementStatus } from '@prisma/client';

// Helper to recalculate student placement status
async function recalculateStudentStatus(tx: any, studentId: string) {
  const activeOffers = await tx.offer.findMany({
    where: { studentId, deletedAt: null },
  });

  let nextStatus: PlacementStatus = PlacementStatus.NOT_PLACED;
  if (activeOffers.length === 1) {
    nextStatus = PlacementStatus.PLACED;
  } else if (activeOffers.length > 1) {
    nextStatus = PlacementStatus.MULTIPLE_OFFERS;
  }

  await tx.student.update({
    where: { id: studentId },
    data: { placementStatus: nextStatus },
  });
}

// 1. Get offers list with search and filters
export async function getOffers(req: Request, res: Response, next: NextFunction) {
  try {
    const { departmentId, companyId, status, search, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {
      deletedAt: null,
      student: { deletedAt: null }
    };

    if (departmentId) {
      whereClause.student = { ...whereClause.student, departmentId: departmentId as string };
    }

    if (companyId) {
      whereClause.companyId = companyId as string;
    }

    if (status) {
      whereClause.status = status as OfferStatus;
    }

    if (search) {
      whereClause.OR = [
        { student: { name: { contains: search as string, mode: 'insensitive' } } },
        { student: { registerNumber: { contains: search as string, mode: 'insensitive' } } },
        { jobRole: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const totalCount = await prisma.offer.count({ where: whereClause });
    const offers = await prisma.offer.findMany({
      where: whereClause,
      include: {
        student: { include: { department: true } },
        company: { select: { id: true, name: true } },
        drive: { select: { id: true, jobRole: true, driveDate: true } },
      },
      skip: offset,
      take: limitNum,
      orderBy: { offerDate: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        offers,
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

// 2. Update offer status or details
export async function updateOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, ctc, jobRole } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer || offer.deletedAt) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    // Restriction: Manager cannot edit, Placement Team can edit, Admin can edit
    if (user.role === 'MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Managers do not have permission to modify offers.',
      });
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        status: status as OfferStatus,
        ctc: ctc ? parseFloat(ctc) : undefined,
        jobRole,
      },
    });

    // Write audit log
    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'UPDATE_OFFER',
      entity: 'Offer',
      entityId: id,
      ipAddress: req.ip,
      oldValue: offer,
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

// 3. Soft delete offer (Admin only)
export async function deleteOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer || offer.deletedAt) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Soft delete offer
      await tx.offer.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // 2. Recalculate placement status for student
      await recalculateStudentStatus(tx, offer.studentId);
    });

    // Write audit log
    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'DELETE_OFFER',
      entity: 'Offer',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Offer successfully deleted.',
    });
  } catch (error) {
    next(error);
  }
}

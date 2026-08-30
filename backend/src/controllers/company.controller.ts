import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import { CompanyStatus } from '@prisma/client';

// 1. Get companies list with role-based restrictions
export async function getCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status, page = '1', limit = '50', sortBy = 'name', sortOrder = 'asc' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // Role-based where condition builder
    const whereClause: any = {
      deletedAt: null,
    };

    // Apply filters from client if specified, otherwise apply role defaults
    if (user.role === 'ADMIN') {
      if (status) {
        whereClause.status = status as CompanyStatus;
      }
    } else if (user.role === 'MANAGER') {
      // Managers see approved companies, or pending companies they submitted
      whereClause.OR = [
        { status: CompanyStatus.APPROVED },
        {
          AND: [
            { status: CompanyStatus.PENDING_APPROVAL },
            { createdById: user.userId }
          ]
        }
      ];
      if (status) {
        // If they ask for a status, filter inside their allowed subset
        whereClause.status = status as CompanyStatus;
      }
    } else if (user.role === 'PLACEMENT_TEAM') {
      // Placement Team see approved companies, or any company they created
      whereClause.OR = [
        { status: CompanyStatus.APPROVED },
        { createdById: user.userId }
      ];
      if (status) {
        whereClause.status = status as CompanyStatus;
      }
    }

    // Search query
    if (search) {
      const searchFilter = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { location: { contains: search as string, mode: 'insensitive' } },
          { industry: { contains: search as string, mode: 'insensitive' } },
        ]
      };
      
      // Merge searchFilter with whereClause
      if (whereClause.OR) {
        // If whereClause already has OR (from Manager/Placement Team restrictions), intersect them
        whereClause.AND = [
          { OR: whereClause.OR },
          searchFilter
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = searchFilter.OR;
      }
    }

    const totalCount = await prisma.company.count({ where: whereClause });
    const companies = await prisma.company.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: { select: { name: true } } }
        }
      },
      skip: offset,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          currentPage: pageNum,
          limit: limitNum,
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// 2. Get company by ID
export async function getCompanyById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        drives: {
          where: { deletedAt: null },
          orderBy: { driveDate: 'desc' }
        },
        submissions: {
          include: {
            submittedBy: { select: { name: true } },
            reviewedBy: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!company || company.deletedAt) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    // Auth check: non-admins can't view private drafts/pending of others
    if (user.role !== 'ADMIN') {
      const isOwner = company.createdById === user.userId;
      const isApproved = company.status === CompanyStatus.APPROVED;

      if (!isApproved && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this company.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
}

// 3. Create Company (Triggers approval workflow for Manager / Placement Team)
export async function createCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // Check unique company name
    const existing = await prisma.company.findUnique({ where: { name: data.name } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Company with name "${data.name}" already exists.`
      });
    }

    // Enforce initial workflow status on backend
    // Admin creates APPROVED immediately, manager/placement submits PENDING_APPROVAL
    let initialStatus: CompanyStatus = CompanyStatus.PENDING_APPROVAL;
    if (user.role === 'ADMIN') {
      initialStatus = data.status || CompanyStatus.APPROVED;
    }

    const company = await prisma.company.create({
      data: {
        name: data.name,
        location: data.location,
        website: data.website,
        companySize: data.companySize,
        companyAddress: data.companyAddress,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        formattedAddress: data.formattedAddress || data.companyAddress,
        googleMapsUrl: data.googleMapsUrl || '',
        contactPersonName: data.contactPersonName,
        contactPersonPhone: data.contactPersonPhone,
        contactPersonEmail: data.contactPersonEmail,
        description: data.description || '',
        logoUrl: data.logoUrl || '',
        industry: data.industry || '',
        foundedYear: data.foundedYear ? parseInt(data.foundedYear, 10) : null,
        companyType: data.companyType || '',
        linkedinUrl: data.linkedinUrl || '',
        ctcLakhs: data.ctcLakhs ? parseFloat(data.ctcLakhs) : null,
        sampleResumeUrl: data.sampleResumeUrl || '',
        status: initialStatus,
        createdById: user.userId,
      }
    });

    // Create CompanySubmission entry
    await prisma.companySubmission.create({
      data: {
        companyId: company.id,
        status: initialStatus,
        submittedById: user.userId,
      }
    });

    // Write audit log
    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'CREATE_COMPANY',
      entity: 'Company',
      entityId: company.id,
      ipAddress: req.ip,
      newValue: company,
    });

    // If submitted by Manager or Placement Team, create notification for Admins
    if (user.role !== 'ADMIN') {
      const admins = await prisma.user.findMany({
        where: { role: { name: 'ADMIN' } }
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Company Approval Request',
            message: `"${company.name}" has been submitted by ${user.email} (${user.role}) and requires review.`,
          }
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: user.role === 'ADMIN'
        ? 'Company created and approved successfully.'
        : 'Company profile created and submitted for Admin approval.',
      data: company
    });
  } catch (error) {
    next(error);
  }
}

// 4. Update Company Profile
export async function updateCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }

    // Role check: Admin can edit anything. Placement Team can edit their own. Manager cannot edit.
    if (user.role === 'MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Managers do not have editing privileges.'
      });
    }

    if (user.role === 'PLACEMENT_TEAM' && company.createdById !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You only have permission to edit companies you submitted.'
      });
    }

    // Check unique company name if changing
    if (data.name && data.name !== company.name) {
      const nameDup = await prisma.company.findUnique({ where: { name: data.name } });
      if (nameDup) {
        return res.status(400).json({ success: false, message: `Company name "${data.name}" already taken.` });
      }
    }

    // Secure rule: non-admin updates reset company status to PENDING_APPROVAL
    let statusToSet = company.status;
    if (user.role !== 'ADMIN' && company.status === CompanyStatus.APPROVED) {
      statusToSet = CompanyStatus.PENDING_APPROVAL;
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        website: data.website,
        companySize: data.companySize,
        companyAddress: data.companyAddress,
        latitude: data.latitude !== undefined ? (data.latitude ? parseFloat(data.latitude) : null) : undefined,
        longitude: data.longitude !== undefined ? (data.longitude ? parseFloat(data.longitude) : null) : undefined,
        formattedAddress: data.formattedAddress,
        googleMapsUrl: data.googleMapsUrl,
        contactPersonName: data.contactPersonName,
        contactPersonPhone: data.contactPersonPhone,
        contactPersonEmail: data.contactPersonEmail,
        description: data.description,
        logoUrl: data.logoUrl,
        industry: data.industry,
        foundedYear: data.foundedYear ? parseInt(data.foundedYear, 10) : undefined,
        companyType: data.companyType,
        linkedinUrl: data.linkedinUrl,
        ctcLakhs: data.ctcLakhs !== undefined ? (data.ctcLakhs ? parseFloat(data.ctcLakhs) : null) : undefined,
        sampleResumeUrl: data.sampleResumeUrl,
        status: statusToSet,
      }
    });

    // If status reset to pending, create submission & notify admin
    if (statusToSet === CompanyStatus.PENDING_APPROVAL && company.status === CompanyStatus.APPROVED) {
      await prisma.companySubmission.create({
        data: {
          companyId: id,
          status: CompanyStatus.PENDING_APPROVAL,
          submittedById: user.userId,
        }
      });

      const admins = await prisma.user.findMany({ where: { role: { name: 'ADMIN' } } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Company Edit Requires Re-approval',
            message: `"${company.name}" details were updated by a Team Member and requires re-approval.`,
          }
        });
      }
    }

    // Write audit log
    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'UPDATE_COMPANY',
      entity: 'Company',
      entityId: id,
      ipAddress: req.ip,
      oldValue: company,
      newValue: updated
    });

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

// 5. Soft Delete Company (Admin only)
export async function deleteCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Write audit log
    await createAuditLog({
      userId: user?.userId,
      role: user?.role || 'ADMIN',
      action: 'SOFT_DELETE_COMPANY',
      entity: 'Company',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Company deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

// 6. Get Company Approval Queue (Admin only)
export async function getApprovalQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const pendingSubmissions = await prisma.companySubmission.findMany({
      where: {
        status: CompanyStatus.PENDING_APPROVAL,
        company: { deletedAt: null }
      },
      include: {
        company: true,
        submittedBy: {
          select: { name: true, email: true, role: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: pendingSubmissions
    });
  } catch (error) {
    next(error);
  }
}

// 7. Approve Company Submission (Admin only)
export async function approveCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { submissionId } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const submission = await prisma.companySubmission.findUnique({
      where: { id: submissionId },
      include: { company: true }
    });

    if (!submission || submission.status !== CompanyStatus.PENDING_APPROVAL) {
      return res.status(404).json({
        success: false,
        message: 'Pending approval submission not found.'
      });
    }

    // Run inside database transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update company status
      await tx.company.update({
        where: { id: submission.companyId },
        data: { status: CompanyStatus.APPROVED }
      });

      // 2. Update submission record
      await tx.companySubmission.update({
        where: { id: submissionId },
        data: {
          status: CompanyStatus.APPROVED,
          reviewedById: user.userId
        }
      });

      // 3. Notify submitter
      await tx.notification.create({
        data: {
          userId: submission.submittedById,
          title: 'Company Approved',
          message: `Your company submission for "${submission.company.name}" has been approved and is now active.`
        }
      });
    });

    // Write audit log
    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'APPROVE_COMPANY',
      entity: 'Company',
      entityId: submission.companyId,
      ipAddress: req.ip,
      newValue: { status: 'APPROVED', approvedBy: user.email }
    });

    return res.status(200).json({
      success: true,
      message: `Company "${submission.company.name}" successfully approved.`
    });
  } catch (error) {
    next(error);
  }
}

// 8. Reject Company Submission (Admin only, reason required)
export async function rejectCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { submissionId } = req.params;
    const { reason } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required.'
      });
    }

    const submission = await prisma.companySubmission.findUnique({
      where: { id: submissionId },
      include: { company: true }
    });

    if (!submission || submission.status !== CompanyStatus.PENDING_APPROVAL) {
      return res.status(404).json({
        success: false,
        message: 'Pending approval submission not found.'
      });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Set company status to REJECTED
      await tx.company.update({
        where: { id: submission.companyId },
        data: { status: CompanyStatus.REJECTED }
      });

      // 2. Update submission
      await tx.companySubmission.update({
        where: { id: submissionId },
        data: {
          status: CompanyStatus.REJECTED,
          reviewedById: user.userId,
          rejectionReason: reason
        }
      });

      // 3. Notify submitter
      await tx.notification.create({
        data: {
          userId: submission.submittedById,
          title: 'Company Rejected',
          message: `Your company submission for "${submission.company.name}" was rejected. Reason: "${reason}"`
        }
      });
    });

    // Write audit log
    await createAuditLog({
      userId: user.userId,
      role: user.role,
      action: 'REJECT_COMPANY',
      entity: 'Company',
      entityId: submission.companyId,
      ipAddress: req.ip,
      newValue: { status: 'REJECTED', reason, rejectedBy: user.email }
    });

    return res.status(200).json({
      success: true,
      message: `Company "${submission.company.name}" successfully rejected.`
    });
  } catch (error) {
    next(error);
  }
}

// 7. Get Soft-Deleted Companies (Admin only - Recycle Bin)
export async function getDeletedCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const companies = await prisma.company.findMany({
      where: { deletedAt: { not: null } },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { deletedAt: 'desc' }
    });
    return res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    next(error);
  }
}

// 8. Restore Soft-Deleted Company
export async function restoreCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user;

    const company = await prisma.company.findFirst({
      where: { id, deletedAt: { not: null } }
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Soft-deleted company not found.' });
    }

    const restored = await prisma.company.update({
      where: { id },
      data: { deletedAt: null }
    });

    // Write audit log
    await createAuditLog({
      userId: user?.userId,
      role: user?.role || 'ADMIN',
      action: 'RESTORE_COMPANY',
      entity: 'Company',
      entityId: id,
      ipAddress: req.ip,
      newValue: restored
    });

    return res.status(200).json({
      success: true,
      message: `Company "${restored.name}" restored successfully.`,
      data: restored
    });
  } catch (error) {
    next(error);
  }
}

// 9. Permanently Delete/Purge Company
export async function permanentlyDeleteCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user;

    const company = await prisma.company.findFirst({
      where: { id, deletedAt: { not: null } }
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Soft-deleted company not found.' });
    }

    // Delete associated company submissions and drives first to prevent SQL errors
    await prisma.companySubmission.deleteMany({ where: { companyId: id } });
    
    // Purge the company record
    await prisma.company.delete({
      where: { id }
    });

    // Write audit log
    await createAuditLog({
      userId: user?.userId,
      role: user?.role || 'ADMIN',
      action: 'PERMANENT_DELETE_COMPANY',
      entity: 'Company',
      entityId: id,
      ipAddress: req.ip,
      oldValue: company
    });

    return res.status(200).json({
      success: true,
      message: `Company "${company.name}" permanently purged from directory.`
    });
  } catch (error) {
    next(error);
  }
}

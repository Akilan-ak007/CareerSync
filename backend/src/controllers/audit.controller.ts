import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { role: { contains: search as string, mode: 'insensitive' } },
        { entity: { contains: search as string, mode: 'insensitive' } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const totalCount = await prisma.auditLog.count({ where: whereClause });
    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
      },
      skip: offset,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        logs,
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

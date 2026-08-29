import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== user.userId) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    await prisma.notification.updateMany({
      where: { userId: user.userId, isRead: false },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
}

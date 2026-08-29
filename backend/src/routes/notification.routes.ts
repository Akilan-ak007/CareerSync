import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.put('/read-all', authenticateToken, markAllAsRead);
router.put('/:id/read', authenticateToken, markAsRead);

export default router;

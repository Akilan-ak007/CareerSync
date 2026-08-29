import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, requireRoles(['ADMIN']), getAuditLogs);

export default router;

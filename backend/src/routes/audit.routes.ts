import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, requireRoles(['ADMIN']), getAuditLogs);

export default router;

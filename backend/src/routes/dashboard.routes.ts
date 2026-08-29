import { Router } from 'express';
import {
  getAdminDashboard,
  getManagerDashboard,
  getPlacementTeamDashboard
} from '../controllers/dashboard.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/admin', authenticateToken, requireRoles(['ADMIN']), getAdminDashboard);
router.get('/manager', authenticateToken, requireRoles(['MANAGER']), getManagerDashboard);
router.get('/placement-team', authenticateToken, requireRoles(['PLACEMENT_TEAM']), getPlacementTeamDashboard);

export default router;

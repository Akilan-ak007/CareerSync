import { Router } from 'express';
import {
  getAdminDashboard,
  getManagerDashboard,
  getPlacementTeamDashboard
} from '../controllers/dashboard.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/admin', authenticateToken, requireRoles(['ADMIN']), getAdminDashboard);
router.get('/manager', authenticateToken, requireRoles(['MANAGER']), getManagerDashboard);
router.get('/placement-team', authenticateToken, requireRoles(['PLACEMENT_TEAM']), getPlacementTeamDashboard);

export default router;

import { Router } from 'express';
import {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
  completeDrive
} from '../controllers/drive.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// CRUD & Completion
router.get('/', authenticateToken, getDrives);
router.get('/:id', authenticateToken, getDriveById);
router.post('/', authenticateToken, requireRoles(['ADMIN', 'PLACEMENT_TEAM']), createDrive);
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'PLACEMENT_TEAM']), updateDrive);
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), deleteDrive);
router.post('/:id/complete', authenticateToken, requireRoles(['ADMIN', 'PLACEMENT_TEAM']), completeDrive);

export default router;

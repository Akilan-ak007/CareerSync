import { Router } from 'express';
import multer from 'multer';
import {
  uploadJDPdf,
  deleteJDPdf,
  extractJDInfo,
  updateJDInfo,
  runAtsMatching,
  getCandidatesList,
  getCandidateAtsDetail,
  updateAtsStatus,
  getAtsAnalytics
} from '../controllers/ats.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Global ATS Analytics
router.get('/dashboard/analytics', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), getAtsAnalytics);

// Drive specific JD / ATS matching routes
router.post('/:id/jd-upload', authenticateToken, requireRoles(['ADMIN', 'PLACEMENT_TEAM']), upload.single('file'), uploadJDPdf);
router.delete('/:id/jd-delete', authenticateToken, requireRoles(['ADMIN', 'PLACEMENT_TEAM']), deleteJDPdf);
router.post('/:id/jd-extract', authenticateToken, requireRoles(['ADMIN', 'PLACEMENT_TEAM']), extractJDInfo);
router.put('/:id/jd-update', authenticateToken, requireRoles(['ADMIN', 'PLACEMENT_TEAM']), updateJDInfo);
router.post('/:id/ats-match', authenticateToken, requireRoles(['ADMIN', 'PLACEMENT_TEAM']), runAtsMatching);
router.get('/:id/ats-candidates', authenticateToken, getCandidatesList);
router.get('/:id/students/:studentId/ats-detail', authenticateToken, getCandidateAtsDetail);
router.put('/:id/students/:studentId/ats-status', authenticateToken, requireRoles(['ADMIN', 'PLACEMENT_TEAM']), updateAtsStatus);

export default router;

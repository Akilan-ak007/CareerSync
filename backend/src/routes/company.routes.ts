import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getApprovalQueue,
  approveCompany,
  rejectCompany,
  getDeletedCompanies,
  restoreCompany,
  permanentlyDeleteCompany
} from '../controllers/company.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Queue & Approvals (Admin only)
router.get('/submissions', authenticateToken, requireRoles(['ADMIN']), getApprovalQueue);
router.post('/submissions/:submissionId/approve', authenticateToken, requireRoles(['ADMIN']), approveCompany);
router.post('/submissions/:submissionId/reject', authenticateToken, requireRoles(['ADMIN']), rejectCompany);

// Deleted Archive (Admin Recycle Bin)
router.get('/deleted', authenticateToken, requireRoles(['ADMIN']), getDeletedCompanies);
router.post('/:id/restore', authenticateToken, requireRoles(['ADMIN']), restoreCompany);
router.delete('/:id/permanent', authenticateToken, requireRoles(['ADMIN']), permanentlyDeleteCompany);

// Standard CRUD (RBAC handled internally inside controller)
router.get('/', authenticateToken, getCompanies);
router.get('/:id', authenticateToken, getCompanyById);
router.post('/', authenticateToken, createCompany);
router.put('/:id', authenticateToken, updateCompany);
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), deleteCompany);

export default router;

import { Router } from 'express';
import multer from 'multer';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadPreview,
  importConfirm,
  getDepartments
} from '../controllers/student.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Departments
router.get('/departments', authenticateToken, getDepartments);

// Students CRUD
router.get('/', authenticateToken, getStudents);
router.get('/:id', authenticateToken, getStudentById);
router.post('/', authenticateToken, requireRoles(['ADMIN']), createStudent);
router.put('/:id', authenticateToken, requireRoles(['ADMIN']), updateStudent);
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), deleteStudent);

// Bulk Excel Upload
router.post('/import/preview', authenticateToken, requireRoles(['ADMIN']), upload.single('file'), uploadPreview);
router.post('/import/confirm', authenticateToken, requireRoles(['ADMIN']), importConfirm);

export default router;

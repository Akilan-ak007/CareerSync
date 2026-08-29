import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// CRUD endpoints for staff accounts
router.get('/', authenticateToken, getUsers);
router.post('/', authenticateToken, requireRoles(['ADMIN']), createUser);
router.put('/:id', authenticateToken, requireRoles(['ADMIN']), updateUser);
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), deleteUser);

export default router;

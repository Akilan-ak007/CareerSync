import { Router } from 'express';
import { getOffers, updateOffer, deleteOffer } from '../controllers/offer.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getOffers);
router.put('/:id', authenticateToken, updateOffer);
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), deleteOffer);

export default router;

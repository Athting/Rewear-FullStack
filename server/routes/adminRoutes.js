import express from 'express';
import {
  getAdminStats,
  getAllUsersForAdmin,
  toggleUserSuspension,
  removeListingByAdmin
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, adminOnly, getAdminStats);
router.get('/users', protect, adminOnly, getAllUsersForAdmin);
router.put('/users/:id/suspend', protect, adminOnly, toggleUserSuspension);
router.delete('/listings/:id', protect, adminOnly, removeListingByAdmin);

export default router;

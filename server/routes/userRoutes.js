import express from 'express';
import multer from 'multer';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAccount,
  getUserById,
  getNotifications,
  markNotificationsRead
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/delete', protect, deleteAccount);
router.get('/me/notifications', protect, getNotifications);
router.put('/me/notifications/read', protect, markNotificationsRead);
router.get('/:id', getUserById);

export default router;

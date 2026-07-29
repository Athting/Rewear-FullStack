import express from 'express';
import { getConversations, getMessages } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/messages/:chatId', protect, getMessages);

export default router;

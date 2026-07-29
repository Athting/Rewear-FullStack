import express from 'express';
import {
  getRecommendations,
  chatAssistant,
  generateDescriptionFromVision
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/recommendations', protect, getRecommendations);
router.post('/chat', protect, chatAssistant);
router.post('/vision-describe', protect, generateDescriptionFromVision);

export default router;

import express from 'express';
import {
  getRecommendations,
  chatAssistant,
  generateDescriptionFromVision,
  getGeminiDiagnostics
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/recommendations', protect, getRecommendations);
router.post('/chat', protect, chatAssistant);
router.post('/vision-describe', protect, generateDescriptionFromVision);
router.get('/test-gemini', getGeminiDiagnostics);

export default router;

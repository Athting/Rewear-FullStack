import express from 'express';
import {
  getMySwaps,
  createSwapRequest,
  respondToSwapRequest,
  completeSwapRequest
} from '../controllers/swapController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMySwaps);
router.post('/', protect, createSwapRequest);
router.put('/:id/respond', protect, respondToSwapRequest);
router.put('/:id/complete', protect, completeSwapRequest);

export default router;

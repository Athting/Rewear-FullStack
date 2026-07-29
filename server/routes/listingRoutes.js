import express from 'express';
import multer from 'multer';
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing
} from '../controllers/listingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { listingValidation } from '../middleware/validation.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', protect, upload.array('images', 5), listingValidation, createListing);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);

export default router;

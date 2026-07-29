import Listing from '../models/Listing.js';
import User from '../models/User.js';
import SwapRequest from '../models/SwapRequest.js';
import {
  generateSwapRecommendations,
  chatFashionAssistant,
  generateListingDetailsFromImage
} from '../services/aiService.js';

// @desc    Get AI Clothing Swap Recommendations
// @route   GET /api/recommendations
// @access  Private
export const getRecommendations = async (req, res, next) => {
  try {
    // 1. Fetch user's own listings (User's Closet)
    const userCloset = await Listing.find({ ownerId: req.user._id, availability: 'available' });

    if (userCloset.length === 0) {
      return res.status(200).json({
        success: true,
        recommendations: [],
        message: 'Upload at least one clothing item to your closet to see matching swap recommendations!'
      });
    }

    // 2. Fetch available items from other users
    const marketplaceListings = await Listing.find({
      ownerId: { $ne: req.user._id },
      availability: 'available'
    }).limit(30); // limit search space for prompt sizes

    // 3. Setup user styling preferences (from bio or completed swaps)
    const userPreferences = {
      size: req.user.locationName ? 'Any' : 'M', // default size
      brands: []
    };

    // 4. Generate recommendations using Gemini Vision/Text
    const recommendations = await generateSwapRecommendations(userCloset, marketplaceListings, userPreferences);

    // Populate listing details in recommendations list
    const populatedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const item = await Listing.findById(rec.matchedListingId).populate('ownerId', 'name avatar rating');
        const offerItem = await Listing.findById(rec.offeredClosetItemId);
        
        return {
          ...rec,
          listing: item,
          offeredItem: offerItem
        };
      })
    );

    res.status(200).json({
      success: true,
      recommendations: populatedRecommendations.filter(r => r.listing && r.offeredItem)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Fashion Assistant Bot Chat
// @route   POST /api/ai/chat
// @access  Private
export const chatAssistant = async (req, res, next) => {
  const { messages } = req.body;

  try {
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Please provide conversation messages history array' });
    }

    const reply = await chatFashionAssistant(messages, {
      name: req.user.name,
      rating: req.user.rating,
      location: req.user.locationName
    });

    res.status(200).json({ success: true, reply });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Vision Description Generator
// @route   POST /api/ai/vision-describe
// @access  Private
export const generateDescriptionFromVision = async (req, res, next) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Please upload or provide clothing image base64 data' });
    }

    const aiSuggestions = await generateListingDetailsFromImage(imageBase64, mimeType || 'image/jpeg');

    res.status(200).json({
      success: true,
      suggestions: aiSuggestions
    });
  } catch (error) {
    next(error);
  }
};

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

// @desc    Test and diagnose Gemini API connectivity
// @route   GET /api/ai/test-gemini
// @access  Public
export const getGeminiDiagnostics = async (req, res, next) => {
  try {
    const rawKey = process.env.GEMINI_API_KEY;

    if (!rawKey) {
      return res.status(200).json({
        success: false,
        message: 'GEMINI_API_KEY environment variable is completely empty or missing on the server.'
      });
    }

    const sanitizedKey = rawKey.trim().replace(/^["']|["']$/g, '');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const tempAi = new GoogleGenerativeAI(sanitizedKey);

    // 1. Fetch all models authorized for this key
    let modelsList = [];
    try {
      const listResult = await tempAi.listModels();
      if (listResult && listResult.models) {
        modelsList = listResult.models.map(m => ({
          name: m.name,
          displayName: m.displayName,
          supportedGenerationMethods: m.supportedGenerationMethods
        }));
      }
    } catch (listErr) {
      console.warn("Failed to retrieve models list:", listErr.message);
    }

    // 2. Attempt lightweight content generation using different models
    let testResponse = null;
    let modelUsed = 'gemini-1.5-flash';

    try {
      const model = tempAi.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent("Say 'Gemini 1.5 is functional!'");
      testResponse = result.response.text();
    } catch (err15) {
      try {
        modelUsed = 'gemini-2.0-flash';
        const model = tempAi.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent("Say 'Gemini 2.0 is functional!'");
        testResponse = result.response.text();
      } catch (err20) {
        throw new Error(`Both gemini-1.5-flash and gemini-2.0-flash failed. 1.5 Error: ${err15.message}. 2.0 Error: ${err20.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Gemini API is functional!',
      modelUsed,
      response: testResponse,
      availableModels: modelsList,
      keyLength: rawKey.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gemini API test failed.',
      errorMessage: err.message
    });
  }
};
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { uploadMultipleImages } from '../services/cloudinaryService.js';

// @desc    Get Clothing Listings (Search, filter, paginate, sort)
// @route   GET /api/listings
// @access  Public
export const getListings = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      condition,
      gender,
      size,
      valueMin,
      valueMax,
      longitude,
      latitude,
      maxDistance, // in miles
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = { availability: 'available' };

    // Text Search Index (Title / Brand match)
    if (search) {
      query.$text = { $search: search };
    }

    // Category / Brand / Gender / Condition / Size Filters
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (gender) query.gender = gender;
    if (condition) query.condition = condition;
    if (size) query.size = size;

    // EcoPoints Value Range
    if (valueMin || valueMax) {
      query.swapValue = {};
      if (valueMin) query.swapValue.$gte = parseInt(valueMin);
      if (valueMax) query.swapValue.$lte = parseInt(valueMax);
    }

    // Geospatial Distance Queries ($geoWithin sphere matching within maxDistance miles)
    if (longitude && latitude && maxDistance) {
      const milesToRadians = 3963.2; // earth radius in miles
      query.locationCoordinates = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(maxDistance) / milesToRadians
          ]
        }
      };
    }

    // Pagination calculations
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build Mongoose query
    let listingsQuery = Listing.find(query).populate('ownerId', 'name avatar rating');

    // Sorting conditions
    if (sort === 'valueLow') {
      listingsQuery = listingsQuery.sort({ swapValue: 1 });
    } else if (sort === 'valueHigh') {
      listingsQuery = listingsQuery.sort({ swapValue: -1 });
    } else if (sort === 'popular') {
      listingsQuery = listingsQuery.sort({ favoritesCount: -1 });
    } else {
      listingsQuery = listingsQuery.sort({ createdAt: -1 }); // Newest (Default)
    }

    // Apply pagination
    listingsQuery = listingsQuery.skip(skip).limit(parseInt(limit));

    // Execute queries
    const listings = await listingsQuery;
    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      listings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Listing by ID
// @route   GET /api/listings/:id
// @access  Public
export const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('ownerId', 'name username avatar rating completedSwaps locationName');
      
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Clothing listing not found' });
    }

    res.status(200).json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Clothing Listing
// @route   POST /api/listings
// @access  Private
export const createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      brand,
      gender,
      size,
      condition,
      color,
      material,
      swapValue,
      locationName,
      longitude,
      latitude,
      tags
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one clothing photo.' });
    }

    // Upload files list to Cloudinary
    const imageUrls = await uploadMultipleImages(req.files);

    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];

    const listing = await Listing.create({
      ownerId: req.user._id,
      title,
      description,
      category,
      brand,
      gender,
      size,
      condition,
      color,
      material,
      swapValue: parseInt(swapValue),
      locationName,
      locationCoordinates: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      images: imageUrls,
      tags: tagsArray
    });

    // Credit User with points for uploading clothing item (+10 EcoPoints!)
    const user = await User.findById(req.user._id);
    user.ecoPoints = (user.ecoPoints || 0) + 10;
    await user.save();

    res.status(201).json({
      success: true,
      listing,
      message: 'Garment added to marketplace! +10 EcoPoints credited!'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Clothing Listing
// @route   PUT /api/listings/:id
// @access  Private
export const updateListing = async (req, res, next) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Verify ownership
    if (listing.ownerId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(401).json({ success: false, message: 'User not authorized to edit this listing' });
    }

    const { availability, title, description, size, condition, swapValue } = req.body;

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (size) listing.size = size;
    if (condition) listing.condition = condition;
    if (swapValue) listing.swapValue = parseInt(swapValue);
    if (availability) listing.availability = availability;

    await listing.save();

    res.status(200).json({ success: true, listing, message: 'Listing updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Clothing Listing
// @route   DELETE /api/listings/:id
// @access  Private
export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Verify ownership
    if (listing.ownerId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(401).json({ success: false, message: 'User not authorized to delete this listing' });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Listing successfully removed from marketplace.' });
  } catch (error) {
    next(error);
  }
};

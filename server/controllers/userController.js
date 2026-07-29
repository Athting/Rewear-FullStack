import User from '../models/User.js';
import Listing from '../models/Listing.js';
import SwapRequest from '../models/SwapRequest.js';
import Notification from '../models/Notification.js';
import { uploadImage } from '../services/cloudinaryService.js';

// @desc    Get Authenticated User Profile
// @route   GET /api/users/me
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  const { name, bio, locationName, longitude, latitude } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (locationName) user.locationName = locationName;
    
    if (longitude && latitude) {
      user.locationCoordinates = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    await user.save();
    res.status(200).json({ success: true, user, message: 'Profile details updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload User Avatar (Profile Image)
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    // Upload to Cloudinary folder 'rewear_avatars'
    const imageUrl = await uploadImage(req.file.buffer, 'rewear_avatars');
    
    const user = await User.findById(req.user._id);
    user.avatar = imageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      avatarUrl: imageUrl,
      message: 'Profile picture updated successfully!'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Account
// @route   DELETE /api/users/delete
// @access  Private
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete user's active clothing listings
    await Listing.deleteMany({ ownerId: userId });

    // Cancel related swap requests
    await SwapRequest.deleteMany({
      $or: [{ requesterId: userId }, { receiverId: userId }]
    });

    // Delete user record
    await User.findByIdAndDelete(userId);

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Public User Details
// @route   GET /api/users/:id
// @access  Public
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-email -createdAt -updatedAt -__v');
      
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get In-App Notifications List
// @route   GET /api/users/me/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ receiverId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark All Notifications as Read
// @route   PUT /api/users/me/notifications/read
// @access  Private
export const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { receiverId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};


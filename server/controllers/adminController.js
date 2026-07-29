import User from '../models/User.js';
import Listing from '../models/Listing.js';
import SwapRequest from '../models/SwapRequest.js';

// @desc    Get Platform Statistics (KPIs & Metrics)
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await Listing.countDocuments();
    const totalSwaps = await SwapRequest.countDocuments();
    const pendingSwaps = await SwapRequest.countDocuments({ status: 'pending' });
    const completedSwaps = await SwapRequest.countDocuments({ status: 'completed' });
    const activeListings = await Listing.countDocuments({ availability: 'available' });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalListings,
        totalSwaps,
        pendingSwaps,
        completedSwaps,
        activeListings,
        platformRevenue: 3450 // simulated from listings commissions or subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle User Account Suspension
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
export const toggleUserSuspension = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(400).json({ success: false, message: 'Administrators cannot be suspended' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: `User account has been successfully ${user.isSuspended ? 'suspended' : 're-activated'}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Flag / Remove Listings by Admin
// @route   DELETE /api/admin/listings/:id
// @access  Private/Admin
export const removeListingByAdmin = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Moderator deleted flagged item listing'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get List of Users for Moderation
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsersForAdmin = async (req, res, next) => {
  try {
    const users = await User.find().select('-password -refreshToken');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

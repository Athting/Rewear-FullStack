import SwapRequest from '../models/SwapRequest.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

// @desc    Propose / Create Swap Request
// @route   POST /api/swaps
// @access  Private
export const createSwapRequest = async (req, res, next) => {
  const { myListingId, theirListingId, note } = req.body;

  try {
    const myItem = await Listing.findById(myListingId);
    const theirItem = await Listing.findById(theirListingId);

    if (!myItem || !theirItem) {
      return res.status(404).json({ success: false, message: 'One or both clothing items not found' });
    }

    if (myItem.ownerId.toString() !== req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You do not own the offered item' });
    }

    if (theirItem.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot swap with your own listing' });
    }

    // Check if swap already pending
    const duplicate = await SwapRequest.findOne({
      requesterId: req.user._id,
      theirListingId,
      status: 'pending'
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: 'You already have a pending swap request for this item' });
    }

    // Calculate Fairness Score (0-100)
    const valueDiff = Math.abs(myItem.swapValue - theirItem.swapValue);
    const condScoreMap = { 'New with Tags': 100, 'Like New': 90, 'Good': 75, 'Fair': 55 };
    const cond1 = condScoreMap[myItem.condition] || 75;
    const cond2 = condScoreMap[theirItem.condition] || 75;
    const condDiff = Math.abs(cond1 - cond2);
    const score = Math.max(30, Math.min(100, Math.round(100 - (valueDiff * 0.5) - (condDiff * 0.3))));

    const swapRequest = await SwapRequest.create({
      requesterId: req.user._id,
      receiverId: theirItem.ownerId,
      myListingId,
      theirListingId,
      score,
      difference: myItem.swapValue - theirItem.swapValue,
      note,
      timeline: [{ status: 'Propose Sent' }]
    });

    // Create Chat Message Offer (Thread ID: sorted IDs)
    const sortedIds = [req.user._id.toString(), theirItem.ownerId.toString()].sort();
    const chatId = `${sortedIds[0]}_${sortedIds[1]}`;

    await Message.create({
      senderId: req.user._id,
      receiverId: theirItem.ownerId,
      chatId,
      text: `Proposed a swap! My "${myItem.title}" (Value: ${myItem.swapValue}) for your "${theirItem.title}" (Value: ${theirItem.swapValue}).`,
      offer: {
        myListingId,
        theirListingId,
        status: 'pending',
        difference: myItem.swapValue - theirItem.swapValue
      }
    });

    // Create Notification for receiver
    await Notification.create({
      receiverId: theirItem.ownerId,
      type: 'swap_request',
      title: 'New Swap Proposal',
      content: `${req.user.name} wants to swap: ${myItem.title} for your ${theirItem.title}`,
      linkId: swapRequest._id.toString()
    });

    res.status(201).json({
      success: true,
      swapRequest,
      message: 'Swap Request proposed successfully! Chat initiated.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to Swap Request (Accept / Reject)
// @route   PUT /api/swaps/:id/respond
// @access  Private
export const respondToSwapRequest = async (req, res, next) => {
  const { status, counterOfferNotes } = req.body;

  try {
    const swap = await SwapRequest.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    if (swap.receiverId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to respond to this swap' });
    }

    if (swap.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This swap has already been resolved' });
    }

    swap.status = status;
    if (counterOfferNotes) {
      swap.counterOfferNotes = counterOfferNotes;
    }
    swap.timeline.push({ status: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}` });
    await swap.save();

    // Lock items availability if accepted
    if (status === 'accepted') {
      await Listing.findByIdAndUpdate(swap.myListingId, { availability: 'pending' });
      await Listing.findByIdAndUpdate(swap.theirListingId, { availability: 'pending' });
    }

    // Notify requester
    await Notification.create({
      receiverId: swap.requesterId,
      type: status === 'accepted' ? 'swap_accepted' : 'swap_rejected',
      title: `Swap Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      content: `${req.user.name} has ${status} your swap request.`,
      linkId: swap._id.toString()
    });

    res.status(200).json({ success: true, swap, message: `Swap request ${status} successfully.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete Swap Transaction (Garments exchanged)
// @route   PUT /api/swaps/:id/complete
// @access  Private
export const completeSwapRequest = async (req, res, next) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    if (swap.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Swap must be accepted first before completing' });
    }

    // Verify participant
    const isRequester = swap.requesterId.toString() === req.user._id.toString();
    const isReceiver = swap.receiverId.toString() === req.user._id.toString();

    if (!isRequester && !isReceiver) {
      return res.status(401).json({ success: false, message: 'Not authorized to complete this transaction' });
    }

    swap.status = 'completed';
    swap.trackingStatus = 'completed';
    swap.completedAt = Date.now();
    swap.timeline.push({ status: 'Swapped Completed' });
    await swap.save();

    // Update listings to swapped
    await Listing.findByIdAndUpdate(swap.myListingId, { availability: 'swapped' });
    await Listing.findByIdAndUpdate(swap.theirListingId, { availability: 'swapped' });

    // Execute EcoPoints transfer
    const requester = await User.findById(swap.requesterId);
    const receiver = await User.findById(swap.receiverId);

    // Difference = My item (requester) value - Their item (receiver) value.
    // If diff is negative, requester owes points to receiver. If positive, receiver owes points to requester.
    const pointsDifference = swap.difference;

    if (pointsDifference < 0) {
      // Requester owes points to receiver
      const pointsToTransfer = Math.abs(pointsDifference);
      requester.ecoPoints = Math.max(0, requester.ecoPoints - pointsToTransfer);
      receiver.ecoPoints = receiver.ecoPoints + pointsToTransfer;
    } else if (pointsDifference > 0) {
      // Receiver owes points to requester
      const pointsToTransfer = pointsDifference;
      receiver.ecoPoints = Math.max(0, receiver.ecoPoints - pointsToTransfer);
      requester.ecoPoints = requester.ecoPoints + pointsToTransfer;
    }

    // Give completion EcoBonus +20 EcoPoints for participating in circular fashion!
    requester.ecoPoints = (requester.ecoPoints || 0) + 20;
    receiver.ecoPoints = (receiver.ecoPoints || 0) + 20;

    // Increment completed swaps counter
    requester.completedSwaps = (requester.completedSwaps || 0) + 1;
    receiver.completedSwaps = (receiver.completedSwaps || 0) + 1;

    await requester.save();
    await receiver.save();

    // Send notifications to both participants
    await Notification.create({
      receiverId: swap.requesterId,
      type: 'swap_completed',
      title: 'Swap Completed! 🎉',
      content: `Your trade is complete! Earned 20 EcoPoints bonus.`,
      linkId: swap._id.toString()
    });

    await Notification.create({
      receiverId: swap.receiverId,
      type: 'swap_completed',
      title: 'Swap Completed! 🎉',
      content: `Your trade is complete! Earned 20 EcoPoints bonus.`,
      linkId: swap._id.toString()
    });

    res.status(200).json({ success: true, swap, message: 'Swap completed! EcoPoints transferred and user bonuses awarded.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Active Swap Requests for Logged-In User
// @route   GET /api/swaps
// @access  Private
export const getMySwaps = async (req, res, next) => {
  try {
    const mySwaps = await SwapRequest.find({
      $or: [{ requesterId: req.user._id }, { receiverId: req.user._id }]
    })
    .populate('requesterId', 'name avatar rating')
    .populate('receiverId', 'name avatar rating')
    .populate('myListingId', 'title images brand size swapValue')
    .populate('theirListingId', 'title images brand size swapValue')
    .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: mySwaps.length, swaps: mySwaps });
  } catch (error) {
    next(error);
  }
};

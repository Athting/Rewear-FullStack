import mongoose from 'mongoose';

const SwapRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  myListingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  theirListingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
    index: true
  },
  score: {
    type: Number,
    required: true
  },
  difference: {
    type: Number,
    required: true // EcoPoints difference
  },
  note: {
    type: String,
    trim: true
  },
  counterOfferNotes: {
    type: String,
    trim: true
  },
  trackingStatus: {
    type: String,
    enum: ['pending', 'shipped', 'received', 'completed'],
    default: 'pending'
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const SwapRequest = mongoose.model('SwapRequest', SwapRequestSchema);
export default SwapRequest;

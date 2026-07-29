import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  senderId: {
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
  chatId: {
    type: String,
    required: true,
    index: true // Group conversation ID: e.g. "userId1_userId2"
  },
  text: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  offer: {
    myListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    },
    theirListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected']
    },
    difference: {
      type: Number
    }
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', MessageSchema);
export default Message;

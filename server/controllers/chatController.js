import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get All Active Conversations List
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // Aggregate query to find last message of each conversation group
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$chatId',
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate participant profiles manually
    const list = await Promise.all(
      conversations.map(async (c) => {
        const lastMsg = c.lastMessage;
        
        // Find which participant is not the current user
        const partnerId = lastMsg.senderId.toString() === userId 
          ? lastMsg.receiverId 
          : lastMsg.senderId;

        const partner = await User.findById(partnerId)
          .select('name username avatar rating');

        return {
          id: c._id, // chatId
          partner,
          lastMessage: {
            text: lastMsg.text,
            image: lastMsg.image,
            offer: lastMsg.offer,
            senderId: lastMsg.senderId,
            read: lastMsg.read,
            createdAt: lastMsg.createdAt
          }
        };
      })
    );

    res.status(200).json({ success: true, count: list.length, conversations: list });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Message History for a Specific Conversation
// @route   GET /api/chat/messages/:chatId
// @access  Private
export const getMessages = async (req, res, next) => {
  const { chatId } = req.params;

  try {
    // Verify participant contains req.user._id
    if (!chatId.includes(req.user._id.toString())) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ chatId })
      .populate('offer.myListingId', 'title images brand size swapValue')
      .populate('offer.theirListingId', 'title images brand size swapValue')
      .sort({ createdAt: 1 });

    // Mark received messages in this chat as read
    await Message.updateMany(
      { chatId, receiverId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

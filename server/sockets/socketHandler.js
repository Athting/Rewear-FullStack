import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Join personal notification channel
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined notification channel.`);
    });

    // Join active conversation room
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined conversation room: ${chatId}`);
    });

    // Handle Real-Time Messaging
    socket.on('send_message', async (data) => {
      const { senderId, receiverId, chatId, text, image, offer } = data;

      try {
        const message = await Message.create({
          senderId,
          receiverId,
          chatId,
          text,
          image,
          offer
        });

        // Broadcast to chat room
        io.to(chatId).emit('receive_message', message);

        // Broadcast new message notification alert
        io.to(receiverId).emit('new_notification', {
          type: 'message',
          title: 'New Message',
          content: text || 'Sent an image or swap offer...',
          linkId: chatId,
          createdAt: new Date()
        });

      } catch (error) {
        console.error('Socket message save error:', error.message);
      }
    });

    // Handle typing status indicator
    socket.on('typing', (data) => {
      const { chatId, userId, isTyping } = data;
      socket.to(chatId).emit('typing_status', { userId, isTyping });
    });

    // Handle message read receipts updates
    socket.on('read_receipt', async (data) => {
      const { chatId, userId } = data; // userId is the reader
      
      try {
        await Message.updateMany(
          { chatId, receiverId: userId, read: false },
          { $set: { read: true } }
        );

        socket.to(chatId).emit('messages_read', { readerId: userId });
      } catch (error) {
        console.error('Socket read receipt error:', error.message);
      }
    });

    // Handle disconnecting
    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });
};

export default socketHandler;

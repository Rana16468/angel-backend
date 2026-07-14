import { Server as HTTPServer } from 'http';
import { Server as ChatServer, Socket } from 'socket.io';
import users from '../app/modules/user/user.model';
import conversations from '../app/modules/conversation/conversation.model';
import handleChatEvents from './handleChatEvents';
import mongoose from 'mongoose';

let io: ChatServer;
const onlineUsers = new Map<string, string>();

const connectSocket = (server: HTTPServer) => {
  if (!io) {
    io = new ChatServer(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      pingInterval: 30000,
      pingTimeout: 5000,
    });
  }

  io.on('connection', async (socket: Socket) => {
    console.log('Client connected:', socket.id);

    const userId = (socket.handshake.query.id as string)?.trim();

    // -----------------------------
    // 1️⃣ Validate userId
    // -----------------------------
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.warn('Invalid or missing userId:', `"${userId}"`);
      socket.emit('error', 'Invalid or missing userId');
      socket.disconnect();
      return;
    }


   

    // -----------------------------
    // 2️⃣ Safe DB query
    // -----------------------------
    const currentUser = await users.findById(userId).select('_id');
    if (!currentUser) {
      socket.emit('error', 'User not found');
      socket.disconnect();
      return;
    }

    const currentUserId = currentUser._id.toString();
    socket.join(currentUserId);

    const userConversations = await conversations
      .find({ participants: currentUserId })
      .select('_id');

    userConversations.forEach((conv) => socket.join(conv._id.toString()));

    handleChatEvents(io, socket, currentUserId);

    console.log('User connected and rooms joined:', currentUserId);

    socket.on('disconnect', () => {
      console.log('Disconnected:', socket.id);
      onlineUsers.delete(currentUserId);
    });
  });

  return io;
};

const getSocketIO = () => {
  if (!io) throw new Error('socket.io is not initialized');
  return io;
};

export { connectSocket, getSocketIO, onlineUsers };

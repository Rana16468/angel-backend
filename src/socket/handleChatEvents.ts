import { Server as IOServer, Socket } from 'socket.io';
import { handleGetConversations } from './chat/getConversation';
import { handleMessagePage } from './chat/getMessages';
import httpStatus from 'http-status';
import conversations from '../app/modules/conversation/conversation.model';
import AppError from '../app/errors/AppError';
import status from 'http-status';
import mongoose from 'mongoose';
import { handleSingleSendMessage } from './chat/handleSingleSendMessage';
import { handleSeenMessage } from './chat/handleSeenMessage';
import { handleSendMessage } from './chat/handleSendMessage';
import messages from '../app/modules/message/message.model';
import QueryBuilder from '../app/builder/QueryBuilder';


const handleChatEvents = async (
  io: IOServer,
  socket: Socket,
  currentUserId: string,
): Promise<void> => {
  
socket.on("specific_conversation", async (data) => {
  try {
    const {
      conversationId,
      page = 1,
      limit = 20,
    } = data;
    
    

    if (!conversationId) {
      return socket.emit("specific_conversation_error", {
        message: "conversationId is required",
      });
    }



    const baseQuery = messages
      .find({ conversationId })
      .populate([
        {
          path: "msgByUserId",
          select: "name photo",
        },
      ])
      .sort({ updatedAt: -1 });

    const messagerQuery = new QueryBuilder(baseQuery, {
      page,
      limit,
    })
      .filter()
      .paginate()
      .fields();

    const allmessage = await messagerQuery.modelQuery;
    const meta = await messagerQuery.countTotal();



   

    socket.emit("specific_conversation_success", {
      meta,
      allmessage
    });

  } catch (error: any) {
    console.error("Socket error:", error);

    socket.emit("specific_conversation_error", {
      message: "Error finding conversation messages",
      error: error?.message,
    });
  }
});

socket.on("join-conversation", async (data: { conversationId: string }) => {
  try {
    const { conversationId } = data;

    if (!conversationId) {
      socket.emit("join-conversation-error", {
        message: "conversationId is required",
      });
      return;
    }

    // 🔥 check conversation exists + user is participant
    const isExistConversation = await conversations.exists({
      _id: new mongoose.Types.ObjectId(conversationId),
      participants: { $in: [currentUserId] },
    });

    if (!isExistConversation) {
      socket.emit("join-conversation-error", {
        message: "Conversation not found or access denied",
      });
      return;
    }

    // 🔥 JOIN SOCKET ROOM (IMPORTANT PART)
    socket.join(conversationId);

    console.log("✅ User joined conversation room:", {
      user: currentUserId,
      conversationId,
    });

    // optional success emit
    socket.emit("join-conversation-success", {
      conversationId,
      message: "Joined successfully",
    });

  } catch (error: any) {
    console.error("Join conversation error:", error);

    socket.emit("join-conversation-error", {
      message: "Internal server error",
      error: error?.message,
    });
  }
});


  socket.on('get-conversations', async(query) => {
    try {
      console.log({currentUserId, query})

      const conversations = await handleGetConversations(currentUserId, query);

      socket.emit('conversation-list', conversations);

    
    } catch (err: any) {
      socket.emit('socket-error', { errorMessage: err.message });
    }
  });
  // handleMessagePage(socket,currentUserId, data);

  socket.on('message-page', (data) => handleMessagePage(socket,currentUserId, data));

  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('user-typing', { conversationId, userId });
  });

  socket.on('stop-typing', ({ conversationId, userId }) => {
    socket
      .to(conversationId)
      .emit('user-stop-typing', { conversationId, userId });
  });

  // handleSendMessage(io, socket, currentUserId, data)
 // group chat 
  socket.on('send-message', (data) =>handleSendMessage(io, socket, currentUserId, data));
// single chat 
  socket.on('single-chat-send-message', (data)=>handleSingleSendMessage(io, socket, currentUserId, data));
  socket.on("seen-message",(data)=>handleSeenMessage(io, socket, currentUserId, data.conversationId))


};

export default handleChatEvents;

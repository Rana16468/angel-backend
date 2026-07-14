


import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import users from '../user/user.model';
import AppError from '../../errors/AppError';
import { getSocketIO, onlineUsers } from '../../../socket/socketConnection';
import conversations from '../conversation/conversation.model';
import messages from './message.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { CHAT_TYPE } from '../conversation/conversation.constant';



interface JwtPayloads {
  id: string;
}

interface NewMessagePayload {
  receiverId: string;
  eventId: string;
  text: string;
  storyUrl: string
  imageUrl?: string[];
  audioUrl?: string;
}

export const new_message_IntoDb = async (
  user: JwtPayloads,
  data: NewMessagePayload
) => {
 
  if (!user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in token", "");
  }

  // ✅ 2. Check if receiver exists
  const isReceiverExist = await users.findById(data.receiverId).select("_id");
  if (!isReceiverExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Receiver ID not found", "");
  }

  // if (user.id === data.receiverId) {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     "SenderId and ReceiverId cannot be the same",
  //     ""
  //   );
  // }

  const io = getSocketIO();
  let isNewConversation = false;

  // ✅ 3. Find or create conversation
  let conversation = await conversations.findOne({
    eventId: data.eventId,
    participants: { $all: [user.id, data.receiverId] },
  });

  if (!conversation) {
    conversation = await conversations.create({
      eventId: data.eventId,
      participants: [user.id, data.receiverId],
    });
    isNewConversation = true;
  } else {
    // verify conversation validity
    if (!conversation._id) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Invalid conversation object",
        ""
      );
    }

    const isExistConversation = await conversations.exists({
      _id: conversation._id,
      participants: user.id,
    });

    if (!isExistConversation) {
      throw new AppError(httpStatus.NOT_FOUND, "Conversation not found", "");
    }

    const updatedConversation = await conversations.findByIdAndUpdate(
      conversation._id,
      { $addToSet: { participants: user.id } },
      { new: true }
    );

    if (!updatedConversation) {
      throw new AppError(
        httpStatus.NOT_EXTENDED,
        "Failed to add participant",
        ""
      );
    }

    conversation = updatedConversation;
  }

  // ✅ 4. Safety check
  if (!conversation || !conversation._id) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Conversation missing _id",
      ""
    );
  }

  // ✅ 5. Join both users to the room if online
  const participants = [user.id, data.receiverId].filter(Boolean);
  for (const participantId of participants) {
    const socketId = onlineUsers.get(participantId.toString());
    if (socketId) {
      const participantSocket = io.sockets.sockets.get(socketId);
      if (participantSocket) {
        const roomId = conversation._id.toString();
        participantSocket.join(roomId);
        participantSocket.data.currentConversationId = roomId;
      }
    }
  }

  // ✅ 6. Save message (FIXED HERE)
  const messageData = {
    text: data.text,
    imageUrl: data.imageUrl || [],
    audioUrl: data.audioUrl || "",
    storyUrl: data.storyUrl,
    msgByUserId: new mongoose.Types.ObjectId(user.id), // 🔥 FIXED
    conversationId: conversation._id,
  };

  const saveMessage = await messages.create(messageData);

  // ✅ 7. Update conversation last message
  await conversations.updateOne(
    { _id: conversation._id },
    { lastMessage: saveMessage._id }
  );

  // ✅ 8. Auto-seen logic
  const roomId = conversation._id?.toString() ?? "";
  if (!roomId) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Missing room ID", "");
  }

  const room = io.sockets.adapter.rooms.get(roomId);
  if (room && room.size > 1) {
    for (const socketId of room) {
      const s = io.sockets.sockets.get(socketId);
      if (
        s &&
        s.data?.currentConversationId === roomId &&
        s.id !== onlineUsers.get(user.id.toString())
      ) {
        await messages.updateOne(
          { _id: saveMessage._id },
          { $set: { seen: true } }
        );

        io.to(roomId).emit("messages-seen", {
          conversationId: conversation._id,
          seenBy: user.id,
          messageIds: [saveMessage._id],
        });
        break;
      }
    }
  }

  // ✅ 9. Emit message event
  const updatedMsg = await messages
    .findById(saveMessage._id)
    .populate("msgByUserId", "name photo email");

  io.to(roomId).emit("new-message", updatedMsg);

  // ✅ 10. Notify receiver & sender if new conversation
  if (isNewConversation) {
    io.to(data.receiverId.toString()).emit("conversation-created", {
      conversationId: conversation._id,
      lastMessage: updatedMsg,
    });
    io.to(data.receiverId.toString()).emit("new-message", updatedMsg);

    const senderSocketId = onlineUsers.get(user.id.toString());
    if (senderSocketId) {
      const senderSocket = io.sockets.sockets.get(senderSocketId);
      senderSocket?.emit("conversation-created", {
        conversationId: conversation._id,
        lastMessage: updatedMsg,
      });
    }
  }

  return updatedMsg;
};
//update message
const updateMessageById_IntoDb = async (
  messageId: string,
  updateData: Partial<{ text: string; imageUrl: string[] }>
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updated = await messages.findByIdAndUpdate(
      messageId,
      { $set: updateData },
      { new: true, session }
    );

    if (!updated) {
      throw new AppError(httpStatus.NOT_FOUND, 'Message not found', 'd');
    }

   
    await conversations.updateMany(
      { lastMessage: messageId },
      { $set: { lastMessage: updated._id } },
      { session }
    );

    const conversation = await conversations.findById(
      updated.conversationId
    ).session(session);

    if (!conversation) {
      throw new AppError(httpStatus.NOT_FOUND, 'Conversation not found', '');
    }

    await session.commitTransaction();
    session.endSession();


    const io = getSocketIO();
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit('message-updated', updated);
    });

    return updated;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error updating message',
      error
    );
  }
};


const deleteMessageById_IntoDb = async (messageId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const message = await messages.findById(messageId).session(session);
    if (!message) {
      throw new AppError(httpStatus.NOT_FOUND, "Message not found", "");
    }

    const conversationId = message.conversationId;


    await message.deleteOne({ _id: messageId }).session(session);

    const conversation = await conversations.findById(conversationId).session(session);
    if (!conversation) {
      throw new AppError(httpStatus.NOT_FOUND, "Conversation not found", "");
    }

 
    if (conversation.lastMessage?.toString() === messageId.toString()) {
      const newLastMessage = await messages.findOne({ conversationId })
        .sort({ createdAt: -1 })
        .session(session);


      conversation.lastMessage = newLastMessage ? newLastMessage._id : null;
      await conversation.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const io = getSocketIO();
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit("message-deleted", {
        messageId,
        conversationId,
      });
    });

    return {
      success: true,
      message: "Message deleted successfully",
      messageId,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error deleting message",
      error,
    );
  }
};


const findBySpecificConversationInDb = async (
  conversationId: string,
  query: Record<string, unknown>
) => {
  try {
    const baseQuery = messages
      .find({ conversationId })
      .populate([
        {
          path: "msgByUserId",
          select: "name photo",
        },
      ])
      .sort({ updatedAt: -1 }); 

    const messagerQuery = new QueryBuilder(baseQuery, query)
      .search(["participants.name"]) 
      .filter()
      .paginate()
      .fields();

    const allmessage = await messagerQuery.modelQuery;
    const meta = await messagerQuery.countTotal();

    return { meta, allmessage };
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error find By Specific Conversation InDb",
      error
    );
  }
};

const single_new_message_IntoDb = async (
  user: JwtPayload,
  data: NewMessagePayload
) => {
  try {
    const senderId = user._id || user.id;

    if (!senderId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Sender ID missing from token");
    }

    if (senderId.toString() === data.receiverId.toString()) {
      throw new AppError(httpStatus.BAD_REQUEST, "You can't chat with yourself");
    }

    // check receiver
    const receiver = await users.findById(data.receiverId).select("_id");
    if (!receiver) {
      throw new AppError(httpStatus.NOT_FOUND, "Receiver not found");
    }

    // find or create conversation
    let isNewConversation = false;

    let conversation = await conversations.findOne({
      chat: CHAT_TYPE.singlechat,
      participants: { $all: [senderId, data.receiverId], $size: 2 },
    });

    if (!conversation) {
      conversation = await conversations.create({
        chat: CHAT_TYPE.singlechat,
        participants: [senderId, data.receiverId],
      });
      isNewConversation = true;
    }

    // create message
    const messageData = {
      text: data.text?.trim() || "",
      imageUrl: data.imageUrl || [],
      audioUrl: data.audioUrl || "",
      eventId: data.eventId || null,
      msgByUserId: senderId,
      conversationId: conversation._id,
    };

    const savedMessage = await messages.create(messageData);

    await conversations.updateOne(
      { _id: conversation._id },
      {
        lastMessage: savedMessage._id,
        updatedAt: new Date(),
      }
    );


    const populatedMessage = await messages
      .findById(savedMessage._id)
      .populate("msgByUserId", "name photo");


    getSocketIO().to(conversation._id.toString()).emit("new-message", {
      ...populatedMessage?.toObject(),
      conversationId: conversation._id,
    });

    

    return {
      success: true,
      message: "Message sent successfully",
      data: {
        isNewConversation,
        conversationId: conversation._id,
      },
    };
  } catch (error: any) {
    console.error("Error single_new_message_IntoDb:", error);

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Error sending message",
      error
    );
  }
};

const MessageService = {
  new_message_IntoDb,
  updateMessageById_IntoDb,
  deleteMessageById_IntoDb,
  findBySpecificConversationInDb,
  single_new_message_IntoDb 
};

export default MessageService;

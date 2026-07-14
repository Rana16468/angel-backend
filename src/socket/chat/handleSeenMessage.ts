import { Server, Socket } from 'socket.io';
import conversations from '../../app/modules/conversation/conversation.model';
import messages from '../../app/modules/message/message.model';


export const handleSeenMessage = async (
  io: Server,
  socket: Socket,
  currentUserId: string,
  conversationId: string,
) => {


    
    
  const conversation = await conversations.findById(conversationId).select("_id participants");
  if (!conversation) {
    return socket.emit("socket-error", {
      errorMessage: "Conversation not found",
    });
  };

  
  const otherUserId: any = conversation.participants.find(
    (id) => id.toString() !== currentUserId
  );

  const unseenMessages = await messages.find({
    conversationId,
    msgByUserId: otherUserId,
    seen: false,
  }).select("_id");


  if (!unseenMessages.length) return;

   await messages.updateMany(
    { _id: { $in: unseenMessages.map((m) => m._id) } },
    { $set: { seen: true } }
  );

  io.to(conversationId.toString()).emit("messages-seen", {
    conversationId,
    seenBy: currentUserId,
    messageIds: unseenMessages.map((m) => m._id), 
  });
};


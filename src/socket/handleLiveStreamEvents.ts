import { Server as IOServer, Socket } from "socket.io";

export const handleLiveStreamEvents = (
  io: IOServer,
  socket: Socket,
  currentUserId: string
) => {
  if (!socket.data.liveEventIds) {
    socket.data.liveEventIds = new Set<string>();
  }

  // User joins live stream room
  socket.on("join-live-stream", (data: { eventId: string }) => {
    if (!data?.eventId) return;
    const roomName = `live_event_${data.eventId}`;
    socket.join(roomName);
    socket.data.liveEventIds.add(data.eventId);

    const viewerCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    io.to(roomName).emit("live-viewer-count", {
      eventId: data.eventId,
      count: viewerCount,
    });
    console.log(`[Socket] User ${currentUserId} joined live room: ${roomName} (Viewers: ${viewerCount})`);
  });

  // User leaves live stream room
  socket.on("leave-live-stream", (data: { eventId: string }) => {
    if (!data?.eventId) return;
    const roomName = `live_event_${data.eventId}`;
    socket.leave(roomName);
    socket.data.liveEventIds.delete(data.eventId);

    const viewerCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    io.to(roomName).emit("live-viewer-count", {
      eventId: data.eventId,
      count: viewerCount,
    });
    console.log(`[Socket] User ${currentUserId} left live room: ${roomName} (Viewers: ${viewerCount})`);
  });

  // Query current viewer count
  socket.on("get-live-viewer-count", (data: { eventId: string }) => {
    if (!data?.eventId) return;
    const roomName = `live_event_${data.eventId}`;
    const viewerCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    socket.emit("live-viewer-count", {
      eventId: data.eventId,
      count: viewerCount,
    });
  });

  // Handle disconnect cleanup
  socket.on("disconnecting", () => {
    if (socket.data.liveEventIds) {
      for (const eventId of socket.data.liveEventIds) {
        const roomName = `live_event_${eventId}`;
        // Room count minus 1 because this socket is disconnecting
        const currentSize = io.sockets.adapter.rooms.get(roomName)?.size || 1;
        const viewerCount = Math.max(0, currentSize - 1);
        socket.to(roomName).emit("live-viewer-count", {
          eventId,
          count: viewerCount,
        });
      }
    }
  });
};

export default handleLiveStreamEvents;

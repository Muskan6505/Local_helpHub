import { Server } from "socket.io";
import { Message } from "../models/message.js";

const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    /* ================= USER JOIN ================= */
    socket.on("join", (userId) => {
      onlineUsers.set(userId.toString(), socket.id);
      socket.join(userId.toString());

      io.emit("onlineUsers", [...onlineUsers.keys()]);
    });

    /* ================= SEND MESSAGE ================= */
    socket.on("sendMessage", async ({ sender, receiver, text, requestId }) => {
      try {
        const receiverOnline = onlineUsers.has(receiver.toString());

        const message = await Message.create({
          sender,
          receiver,
          requestId,
          text,
          delivered: receiverOnline,
          seen: false
        });

        // Send to sender always
        io.to(sender.toString()).emit("receiveMessage", message);

        // Send to receiver ONLY if online
        if (receiverOnline) {
          io.to(receiver.toString()).emit("receiveMessage", message);
        }
      } catch (err) {
        console.error("Send message error:", err);
      }
    });

    /* ================= TYPING ================= */
    socket.on("typing", ({ sender, receiver }) => {
      if (onlineUsers.has(receiver.toString())) {
        io.to(receiver.toString()).emit("typing", sender);
      }
    });

    socket.on("stopTyping", ({ sender, receiver }) => {
      if (onlineUsers.has(receiver.toString())) {
        io.to(receiver.toString()).emit("stopTyping", sender);
      }
    });

    /* ================= MARK AS SEEN (IMPORTANT FIX) ================= */
    socket.on("markSeen", async ({ userId, requestId }) => {
      // user must be online
      if (!onlineUsers.has(userId)) return;

      await Message.updateMany(
        { receiver: userId, requestId, seen: false },
        { $set: { seen: true } }
      );

      io.emit("seenUpdate", { requestId });
    });


    /* ================= DISCONNECT ================= */
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit("onlineUsers", [...onlineUsers.keys()]);
    });
  });

  return io;
};

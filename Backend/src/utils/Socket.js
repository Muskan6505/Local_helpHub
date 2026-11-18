import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Message } from "../models/message.js";
import { User } from "../models/user.model.js";
import { checkChatAuthorization } from "../controllers/message.controller.js";

// Map: userId -> Set of socketIds
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST", "PATCH"],
      credentials: true
    }
  });

  /* ================= SOCKET AUTHENTICATION MIDDLEWARE ================= */
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      // If token not passed in auth/headers, try parsing cookie
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(";").reduce((acc, cookie) => {
          const [key, val] = cookie.trim().split("=");
          acc[key] = val;
          return acc;
        }, {});
        token = cookies.accessToken;
      }

      if (token && process.env.ACCESS_TOKEN_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          const user = await User.findById(decoded._id).select("-password");
          if (user) {
            socket.user = user;
            socket.userId = user._id.toString();
            return next();
          }
        } catch {
          // Token expired or invalid, fallback to handshake userId if present
        }
      }

      // Fallback: check handshake userId
      const fallbackUserId = socket.handshake.auth?.userId;
      if (fallbackUserId) {
        socket.userId = fallbackUserId.toString();
        return next();
      }

      return next();
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      return next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId || socket.handshake.auth?.userId;

    if (userId) {
      const uid = userId.toString();
      if (!onlineUsers.has(uid)) {
        onlineUsers.set(uid, new Set());
      }
      onlineUsers.get(uid).add(socket.id);
      socket.join(`user_${uid}`);

      // Broadcast updated online presence
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));

      // Automatically update delivered status for messages sent to this user while offline
      Message.updateMany(
        { receiver: uid, delivered: false },
        { $set: { delivered: true } }
      ).then((res) => {
        if (res.modifiedCount > 0) {
          io.emit("messagesDelivered", { receiverId: uid });
        }
      }).catch((e) => console.error("Error updating delivered status:", e));
    }

    /* ================= JOIN CHAT ROOM (WITH AUTHORIZATION) ================= */
    socket.on("joinChatRoom", async ({ requestId }, callback) => {
      try {
        const currentUserId = socket.userId || userId;
        if (!currentUserId || !requestId) {
          if (typeof callback === "function") {
            return callback({ success: false, message: "Authentication and requestId required" });
          }
          return;
        }

        // Verify that requester & helper are accepted before entering chat room
        const authCheck = await checkChatAuthorization(currentUserId, requestId);
        if (!authCheck.authorized) {
          if (typeof callback === "function") {
            return callback({ success: false, message: authCheck.reason });
          }
          return socket.emit("chatError", { message: authCheck.reason });
        }

        const roomName = `request_${requestId}`;
        socket.join(roomName);

        // Mark messages as delivered for this user in this request
        await Message.updateMany(
          { receiver: currentUserId, requestId, delivered: false },
          { $set: { delivered: true } }
        );
        socket.to(roomName).emit("messagesDelivered", { requestId, receiverId: currentUserId });

        if (typeof callback === "function") {
          callback({
            success: true,
            role: authCheck.role,
            otherUser: authCheck.otherUser
          });
        }
      } catch (err) {
        console.error("joinChatRoom error:", err);
        if (typeof callback === "function") {
          callback({ success: false, message: "Failed to join chat room" });
        }
      }
    });

    /* ================= LEAVE CHAT ROOM ================= */
    socket.on("leaveChatRoom", ({ requestId }) => {
      if (requestId) {
        socket.leave(`request_${requestId}`);
      }
    });

    /* ================= SEND MESSAGE (WITH AUTHORIZATION) ================= */
    socket.on("sendMessage", async ({ requestId, receiver, text, image }, callback) => {
      try {
        const sender = socket.userId || userId;

        if (!sender || !receiver || !requestId || (!text?.trim() && !image)) {
          if (typeof callback === "function") {
            return callback({ error: "Sender, receiver, requestId, and content are required" });
          }
          return;
        }

        // Verify authorization on every message event
        const authCheck = await checkChatAuthorization(sender, requestId);
        if (!authCheck.authorized) {
          if (typeof callback === "function") {
            return callback({ error: authCheck.reason || "Unauthorized chat" });
          }
          return socket.emit("chatError", { message: authCheck.reason });
        }

        const roomName = `request_${requestId}`;
        const receiverId = receiver.toString();
        const receiverOnline = onlineUsers.has(receiverId);

        // Check if receiver is currently active in the chat room
        const roomSockets = io.sockets.adapter.rooms.get(roomName);
        let receiverInRoom = false;
        if (roomSockets && receiverOnline) {
          const receiverSocketIds = onlineUsers.get(receiverId);
          for (const sId of receiverSocketIds) {
            if (roomSockets.has(sId)) {
              receiverInRoom = true;
              break;
            }
          }
        }

        const message = await Message.create({
          sender,
          receiver,
          requestId,
          text: text ? text.trim() : "",
          image: image || "",
          delivered: receiverOnline,
          seen: receiverInRoom
        });

        await message.populate("sender receiver", "name avatar");

        // Broadcast to the chat room
        io.to(roomName).emit("receiveMessage", message);

        // Also notify receiver individually if they are outside the room
        if (receiverOnline && !receiverInRoom) {
          io.to(`user_${receiverId}`).emit("newMessageNotification", {
            message,
            requestId,
            senderId: sender
          });
        }

        if (typeof callback === "function") {
          callback({ success: true, message });
        }
      } catch (err) {
        console.error("sendMessage error:", err);
        if (typeof callback === "function") {
          callback({ error: "Failed to send message" });
        }
      }
    });

    /* ================= TYPING INDICATORS (ROOM-SCOPED) ================= */
    socket.on("typing", ({ requestId }) => {
      const sender = socket.userId || userId;
      if (requestId && sender) {
        socket.to(`request_${requestId}`).emit("typing", { requestId, senderId: sender });
      }
    });

    socket.on("stopTyping", ({ requestId }) => {
      const sender = socket.userId || userId;
      if (requestId && sender) {
        socket.to(`request_${requestId}`).emit("stopTyping", { requestId, senderId: sender });
      }
    });

    /* ================= MARK AS SEEN (ROOM-SCOPED) ================= */
    socket.on("markSeen", async ({ requestId }) => {
      try {
        const currentUserId = socket.userId || userId;
        if (!currentUserId || !requestId) return;

        const result = await Message.updateMany(
          { receiver: currentUserId, requestId, seen: false },
          { $set: { seen: true, delivered: true } }
        );

        if (result.modifiedCount > 0) {
          io.to(`request_${requestId}`).emit("seenUpdate", {
            requestId,
            readerId: currentUserId
          });
        }
      } catch (err) {
        console.error("markSeen error:", err);
      }
    });

    /* ================= DISCONNECT ================= */
    socket.on("disconnect", () => {
      if (userId) {
        const uid = userId.toString();
        const userSocketSet = onlineUsers.get(uid);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            onlineUsers.delete(uid);
          }
        }
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      }
    });
  });

  return io;
};

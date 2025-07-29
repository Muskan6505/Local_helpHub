let io;

export const initSocket = (server) => {
    const { Server } = require("socket.io");

    io = new Server(server, {
        cors: process.env.CORS_ORIGIN
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        socket.on("join", (userId) => {
        socket.join(userId);
        socket.userId = userId;
        });

        socket.on("typing", ({ to }) => {
        io.to(to).emit("typing", { from: socket.userId });
        });

        socket.on("stopTyping", ({ to }) => {
        io.to(to).emit("stopTyping", { from: socket.userId });
        });

        socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        });
    });
    };

    export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

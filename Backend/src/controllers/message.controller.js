import { Message } from "../models/message";
import {asyncHandler} from "../utils/AsyncHandler"
import {ApiError} from "../utils/AsyncHandler"
import {ApiResponse} from "../utils/ApiResponse"


export const sendMessage = asyncHandler(async (req, res) => {
    const { receiver, requestId, content } = req.body;
    const sender = req.user._id;

    if (!receiver || !requestId || (!content && !req.file)) {
        throw new ApiError(400, "Message content or file required");
    }

    let fileData = null;
    if (req.file) {
        const type = req.file.mimetype.startsWith("image") ? "image"
                : req.file.mimetype === "application/pdf" ? "pdf"
                : "other";

        fileData = {
        url: req.file.path,
        type,
        };
    }

    const message = await Message.create({
        sender,
        receiver,
        requestId,
        content,
        file: fileData,
    });

    req.io?.to(receiver.toString()).emit("newMessage", message); // real-time update

    res.status(201).json(new ApiResponse(201, message, "Message sent"));
});


export const getMessagesByRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const messages = await Message.find({ requestId, isDeleted: false })
        .sort({ createdAt: 1 })
        .populate("sender", "name")
        .populate("receiver", "name");

    res.status(200).json(new ApiResponse(200, messages));
});

export const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { requestId } = req.body;
    const userId = req.user._id;

    await Message.updateMany(
        { requestId, receiver: userId, isRead: false },
        { $set: { isRead: true } }
    );

    res.status(200).json(new ApiResponse(200, null, "Messages marked as read"));
});

export const deleteMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) throw new ApiError(404, "Message not found");

    if (!message.sender.equals(userId)) {
        throw new ApiError(403, "You can only delete your own messages");
    }

    message.isDeleted = true;
    await message.save();

    req.io?.to(message.receiver.toString()).emit("messageDeleted", { messageId: id });

    res.status(200).json(new ApiResponse(200, null, "Message deleted"));
});

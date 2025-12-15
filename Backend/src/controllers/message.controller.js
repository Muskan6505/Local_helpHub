import { Message } from "../models/message.js";

export const getMessagesByRequest = async (req, res) => {
  const { requestId } = req.params;

  const messages = await Message.find({ requestId })
    .sort({ createdAt: 1 });

  res.json(messages);
};

export const getUnreadCount = async (req, res) => {
  const userId = req.user._id;

  const count = await Message.countDocuments({
    receiver: userId,
    seen: false
  });

  res.json({ count });
};
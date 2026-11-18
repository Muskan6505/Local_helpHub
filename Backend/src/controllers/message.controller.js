import { Message } from "../models/message.js";
import { HelpRequest } from "../models/helpRequest.model.js";
import { Response } from "../models/response.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Helper to verify participant authorization for a request
export const checkChatAuthorization = async (userId, requestId) => {
  const helpRequest = await HelpRequest.findById(requestId);
  if (!helpRequest) {
    return { authorized: false, reason: "Help request not found" };
  }

  const isRequester = helpRequest.requester.toString() === userId.toString();

  // If requester, check if there's any accepted response
  if (isRequester) {
    const acceptedResponse = await Response.findOne({
      helpRequest: requestId,
      status: "Accepted"
    });
    if (!acceptedResponse) {
      return { authorized: false, reason: "No accepted volunteer for this request yet" };
    }
    return {
      authorized: true,
      role: "requester",
      otherUser: acceptedResponse.helper.toString()
    };
  }

  // If not requester, check if this user is the accepted volunteer
  const acceptedResponse = await Response.findOne({
    helpRequest: requestId,
    helper: userId,
    status: "Accepted"
  });

  if (!acceptedResponse) {
    return {
      authorized: false,
      reason: "You are not an accepted helper for this request"
    };
  }

  return {
    authorized: true,
    role: "helper",
    otherUser: helpRequest.requester.toString()
  };
};

export const getMessagesByRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const authCheck = await checkChatAuthorization(userId, requestId);
  if (!authCheck.authorized) {
    throw new ApiError(403, authCheck.reason || "Unauthorized to view messages for this request");
  }

  const messages = await Message.find({ requestId })
    .populate("sender", "name avatar")
    .populate("receiver", "name avatar")
    .sort({ createdAt: 1 });

  return res.status(200).json(
    new ApiResponse(200, messages, "Messages fetched successfully")
  );
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await Message.countDocuments({
    receiver: userId,
    seen: false
  });

  return res.status(200).json(
    new ApiResponse(200, { count }, "Unread messages count fetched")
  );
});

export const uploadChatImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  const uploadRes = await uploadOnCloudinary(req.file.path);
  if (!uploadRes?.secure_url && !uploadRes?.url) {
    throw new ApiError(500, "Cloudinary upload failed");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { imageUrl: uploadRes.secure_url || uploadRes.url },
      "Chat image uploaded successfully"
    )
  );
});

export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  await Message.updateMany(
    { receiver: userId, requestId, seen: false },
    { $set: { seen: true } }
  );

  return res.status(200).json(
    new ApiResponse(200, null, "Messages marked as read")
  );
});

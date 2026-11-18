import { SOSRequest } from "../models/sosRequest.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ─── Rate limit helper ────────────────────────────────────────────────────────
// Max 3 active/responded SOS per user per hour
const checkRateLimit = async (userId) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await SOSRequest.countDocuments({
    requester: userId,
    createdAt: { $gte: oneHourAgo },
    status: { $in: ["Active", "Responded"] },
  });
  return recentCount >= 3;
};

// ─── triggerSOS ───────────────────────────────────────────────────────────────
// POST /api/v1/sos
export const triggerSOS = async (req, res) => {
  const userId = req.user._id;
  const { category, description, longitude, latitude, address, emergencyContacts } = req.body;

  if (!category || longitude === undefined || latitude === undefined) {
    throw new ApiError(400, "category, longitude, and latitude are required");
  }

  const parsedLongitude = Number(longitude);
  const parsedLatitude = Number(latitude);
  if (
    !Number.isFinite(parsedLongitude) ||
    !Number.isFinite(parsedLatitude) ||
    parsedLongitude < -180 ||
    parsedLongitude > 180 ||
    parsedLatitude < -90 ||
    parsedLatitude > 90
  ) {
    throw new ApiError(400, "A valid longitude and latitude are required");
  }

  const validCategories = ["Medical", "Personal Safety", "Accident", "Fire", "Other"];
  if (!validCategories.includes(category)) {
    throw new ApiError(400, `category must be one of: ${validCategories.join(", ")}`);
  }

  // Rate limit check
  const limited = await checkRateLimit(userId);
  if (limited) {
    throw new ApiError(429, "You have too many active SOS requests. Please resolve or cancel existing ones before creating a new one.");
  }

  const sos = await SOSRequest.create({
    requester: userId,
    category,
    description: description || "",
    location: {
      type: "Point",
      coordinates: [parsedLongitude, parsedLatitude],
    },
    address: address || "",
    emergencyContacts: Array.isArray(emergencyContacts) ? emergencyContacts : [],
  });

  await sos.populate("requester", "name avatar");

  // Emit to Socket.IO (passed via req.app)
  const io = req.app.get("io");
  if (io) {
    // Find nearby users (within 5 km) to notify
    const nearbySOSList = await SOSRequest.find({
      _id: sos._id,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: 5000,
        },
      },
    }).populate("requester", "name avatar");

    // Broadcast to all connected users — the frontend filters by proximity
    io.emit("sosAlert", { sos: nearbySOSList[0] || sos });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, sos, "SOS request created successfully"));
};

// ─── getMySOS ─────────────────────────────────────────────────────────────────
// GET /api/v1/sos/mine
export const getMySOS = async (req, res) => {
  const userId = req.user._id;

  const sosList = await SOSRequest.find({ requester: userId })
    .populate("respondedBy", "name avatar")
    .sort({ createdAt: -1 })
    .limit(20);

  return res.status(200).json(new ApiResponse(200, sosList, "Your SOS history fetched"));
};

// ─── getNearbyActiveSOS ───────────────────────────────────────────────────────
// GET /api/v1/sos?longitude=&latitude=&radius=5000
export const getNearbyActiveSOS = async (req, res) => {
  const { longitude, latitude, radius = 5000 } = req.query;

  if (!longitude || !latitude) {
    throw new ApiError(400, "longitude and latitude are required query parameters");
  }

  const parsedLongitude = Number(longitude);
  const parsedLatitude = Number(latitude);
  const parsedRadius = Number(radius);
  if (
    !Number.isFinite(parsedLongitude) ||
    !Number.isFinite(parsedLatitude) ||
    parsedLongitude < -180 ||
    parsedLongitude > 180 ||
    parsedLatitude < -90 ||
    parsedLatitude > 90
  ) {
    throw new ApiError(400, "A valid longitude and latitude are required");
  }
  if (!Number.isFinite(parsedRadius) || parsedRadius < 1 || parsedRadius > 50000) {
    throw new ApiError(400, "radius must be between 1 and 50000 meters");
  }

  const sosList = await SOSRequest.find({
    status: "Active",
    requester: { $ne: req.user._id },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parsedLongitude, parsedLatitude],
        },
        $maxDistance: parsedRadius,
      },
    },
  })
    .populate("requester", "name avatar")
    .limit(20);

  return res
    .status(200)
    .json(new ApiResponse(200, sosList, "Nearby active SOS fetched"));
};

// ─── respondToSOS ─────────────────────────────────────────────────────────────
// PATCH /api/v1/sos/:id/respond
export const respondToSOS = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const sos = await SOSRequest.findById(id);
  if (!sos) throw new ApiError(404, "SOS request not found");

  if (sos.status !== "Active") {
    throw new ApiError(400, `Cannot respond to an SOS that is already ${sos.status}`);
  }

  if (sos.requester.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot respond to your own SOS request");
  }

  sos.status = "Responded";
  sos.respondedBy = userId;
  sos.respondedAt = new Date();
  await sos.save();

  await sos.populate("requester respondedBy", "name avatar");

  // Notify requester via socket
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${sos.requester._id}`).emit("sosResponded", { sos });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, sos, "You have responded to this SOS. Help is on the way!"));
};

// ─── resolveSOS ───────────────────────────────────────────────────────────────
// PATCH /api/v1/sos/:id/resolve
export const resolveSOS = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const sos = await SOSRequest.findById(id);
  if (!sos) throw new ApiError(404, "SOS request not found");

  // Only requester or the responder can resolve
  const isRequester = sos.requester.toString() === userId.toString();
  const isResponder = sos.respondedBy?.toString() === userId.toString();
  if (!isRequester && !isResponder) {
    throw new ApiError(403, "Only the requester or the responder can resolve this SOS");
  }

  if (!["Active", "Responded"].includes(sos.status)) {
    throw new ApiError(400, `Cannot resolve an SOS that is already ${sos.status}`);
  }

  sos.status = "Resolved";
  sos.resolvedAt = new Date();
  await sos.save();

  await sos.populate("requester respondedBy", "name avatar");

  // Broadcast resolution via socket
  const io = req.app.get("io");
  if (io) {
    if (sos.respondedBy) {
      io.to(`user_${sos.respondedBy._id}`).emit("sosResolved", { sos });
    }
    io.to(`user_${sos.requester._id}`).emit("sosResolved", { sos });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, sos, "SOS resolved. Thank you for helping the community!"));
};

// ─── cancelSOS ────────────────────────────────────────────────────────────────
// PATCH /api/v1/sos/:id/cancel
export const cancelSOS = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { reason } = req.body;

  const sos = await SOSRequest.findById(id);
  if (!sos) throw new ApiError(404, "SOS request not found");

  if (sos.requester.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the requester can cancel this SOS");
  }

  if (!["Active", "Responded"].includes(sos.status)) {
    throw new ApiError(400, `Cannot cancel an SOS that is already ${sos.status}`);
  }

  sos.status = "Cancelled";
  sos.cancellationReason = reason || "Cancelled by requester";
  await sos.save();

  await sos.populate("requester respondedBy", "name avatar");

  // Notify responder (if any) about cancellation
  const io = req.app.get("io");
  if (io && sos.respondedBy) {
    io.to(`user_${sos.respondedBy._id}`).emit("sosCancelled", { sos });
  }
  // Broadcast cancellation so feed can update
  io?.emit("sosCancelled", { sosId: id });

  return res
    .status(200)
    .json(new ApiResponse(200, sos, "SOS cancelled successfully"));
};

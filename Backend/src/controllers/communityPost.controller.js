import { CommunityPost } from "../models/communityPost.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// Create a new community issue report
export const createPost = asyncHandler(async (req, res) => {
  const { title, description, category, address } = req.body;
  let { coordinates } = req.body;

  if (!title || !description || !category) {
    throw new ApiError(400, "Title, description, and category are required");
  }

  // Handle coordinates if passed as string JSON or array
  if (typeof coordinates === "string") {
    try {
      coordinates = JSON.parse(coordinates);
    } catch {
      throw new ApiError(400, "Invalid coordinates format");
    }
  }

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new ApiError(400, "Valid coordinates [longitude, latitude] are required");
  }

  const [lng, lat] = coordinates.map((c) => parseFloat(c));
  if (isNaN(lng) || isNaN(lat)) {
    throw new ApiError(400, "Coordinates must be valid numbers");
  }

  // Handle uploaded images
  const imageUrls = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    for (const file of req.files) {
      const uploadRes = await uploadOnCloudinary(file.path);
      if (uploadRes?.secure_url || uploadRes?.url) {
        imageUrls.push(uploadRes.secure_url || uploadRes.url);
      }
    }
  }

  const newPost = await CommunityPost.create({
    author: req.user._id,
    title,
    description,
    category,
    images: imageUrls,
    address: address || "",
    location: {
      type: "Point",
      coordinates: [lng, lat]
    }
  });

  const populatedPost = await CommunityPost.findById(newPost._id).populate(
    "author",
    "name avatar trustScore"
  );

  return res.status(201).json(
    new ApiResponse(201, populatedPost, "Community issue reported successfully")
  );
});

// Get nearby community posts with filters
export const getNearbyPosts = asyncHandler(async (req, res) => {
  const { lat, lng, radius, category, status, keyword, sortBy } = req.query;

  const query = {};

  if (category && category !== "All") {
    query.category = category;
  }

  if (status && status !== "All") {
    query.status = status;
  }

  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { address: { $regex: keyword, $options: "i" } }
    ];
  }

  // Geospatial filtering if location provided
  if (lat && lng) {
    const searchRadiusKm = parseFloat(radius) || 10;
    query.location = {
      $geoWithin: {
        $centerSphere: [
          [parseFloat(lng), parseFloat(lat)],
          searchRadiusKm / 6378.1
        ]
      }
    };
  }

  let posts = await CommunityPost.find(query)
    .populate("author", "name avatar trustScore")
    .populate("volunteers", "name avatar trustScore")
    .populate("resolutionProof.resolvedBy", "name avatar")
    .populate("comments.user", "name avatar")
    .sort({ createdAt: -1 });

  // Custom sorting if "popular" / "upvotes" selected
  if (sortBy === "upvotes") {
    posts = posts.sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));
  }

  return res.status(200).json(
    new ApiResponse(200, posts, "Community posts fetched successfully")
  );
});

// Get single post by ID
export const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await CommunityPost.findById(id)
    .populate("author", "name avatar contact trustScore")
    .populate("volunteers", "name avatar trustScore")
    .populate("resolutionProof.resolvedBy", "name avatar")
    .populate("comments.user", "name avatar");

  if (!post) {
    throw new ApiError(404, "Community post not found");
  }

  return res.status(200).json(
    new ApiResponse(200, post, "Post retrieved successfully")
  );
});

// Toggle upvote on a post
export const toggleUpvote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const post = await CommunityPost.findById(id);
  if (!post) {
    throw new ApiError(404, "Community post not found");
  }

  const alreadyUpvoted = post.upvotes.some(
    (upvoteId) => upvoteId.toString() === userId.toString()
  );

  if (alreadyUpvoted) {
    post.upvotes = post.upvotes.filter(
      (upvoteId) => upvoteId.toString() !== userId.toString()
    );
  } else {
    post.upvotes.push(userId);
  }

  await post.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        upvotesCount: post.upvotes.length,
        hasUpvoted: !alreadyUpvoted
      },
      alreadyUpvoted ? "Upvote removed" : "Upvote added"
    )
  );
});

// Toggle volunteer participation
export const toggleVolunteer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const post = await CommunityPost.findById(id);
  if (!post) {
    throw new ApiError(404, "Community post not found");
  }

  const alreadyVolunteered = post.volunteers.some(
    (volunteerId) => volunteerId.toString() === userId.toString()
  );

  if (alreadyVolunteered) {
    post.volunteers = post.volunteers.filter(
      (volunteerId) => volunteerId.toString() !== userId.toString()
    );
  } else {
    post.volunteers.push(userId);
    // If post was still "Reported", automatically update to "In Progress" when someone steps up to help!
    if (post.status === "Reported") {
      post.status = "In Progress";
    }
  }

  await post.save();

  const updatedPost = await CommunityPost.findById(id).populate(
    "volunteers",
    "name avatar trustScore"
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        volunteers: updatedPost.volunteers,
        isVolunteering: !alreadyVolunteered,
        status: updatedPost.status
      },
      alreadyVolunteered ? "Removed from volunteers" : "Joined as volunteer"
    )
  );
});

// Add comment to a post
export const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    throw new ApiError(400, "Comment text is required");
  }

  const post = await CommunityPost.findById(id);
  if (!post) {
    throw new ApiError(404, "Community post not found");
  }

  post.comments.push({
    user: req.user._id,
    text: text.trim()
  });

  await post.save();

  const updatedPost = await CommunityPost.findById(id).populate(
    "comments.user",
    "name avatar"
  );

  return res.status(201).json(
    new ApiResponse(201, updatedPost.comments, "Comment added successfully")
  );
});

// Update status & resolution proof
export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status || !["Reported", "In Progress", "Resolved"].includes(status)) {
    throw new ApiError(400, "Valid status is required");
  }

  const post = await CommunityPost.findById(id);
  if (!post) {
    throw new ApiError(404, "Community post not found");
  }

  // Check permission: author or volunteer can update status
  const isAuthor = post.author.toString() === req.user._id.toString();
  const isVolunteer = post.volunteers.some(
    (vId) => vId.toString() === req.user._id.toString()
  );

  if (!isAuthor && !isVolunteer) {
    throw new ApiError(403, "Only the author or joined volunteers can update this issue's status");
  }

  post.status = status;

  // If marked as resolved, upload proof image if provided
  if (status === "Resolved") {
    let proofImageUrl = post.resolutionProof?.image || "";
    if (req.file) {
      const uploadRes = await uploadOnCloudinary(req.file.path);
      if (uploadRes?.secure_url || uploadRes?.url) {
        proofImageUrl = uploadRes.secure_url || uploadRes.url;
      }
    }

    post.resolutionProof = {
      image: proofImageUrl,
      note: note || post.resolutionProof?.note || "Issue marked as resolved.",
      resolvedBy: req.user._id,
      resolvedAt: new Date()
    };
  }

  await post.save();

  const populated = await CommunityPost.findById(id)
    .populate("author", "name avatar trustScore")
    .populate("volunteers", "name avatar trustScore")
    .populate("resolutionProof.resolvedBy", "name avatar")
    .populate("comments.user", "name avatar");

  return res.status(200).json(
    new ApiResponse(200, populated, `Post status updated to ${status}`)
  );
});

// Delete post
export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await CommunityPost.findById(id);
  if (!post) {
    throw new ApiError(404, "Community post not found");
  }

  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own posts");
  }

  // Delete images from Cloudinary if stored
  if (post.images && post.images.length > 0) {
    for (const imgUrl of post.images) {
      await deleteFromCloudinary(imgUrl);
    }
  }

  if (post.resolutionProof?.image) {
    await deleteFromCloudinary(post.resolutionProof.image);
  }

  await post.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, null, "Community post deleted successfully")
  );
});

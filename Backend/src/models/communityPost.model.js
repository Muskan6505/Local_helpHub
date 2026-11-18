import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

const communityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        "Garbage & Waste",
        "Roads & Potholes",
        "Drainage & Water",
        "Streetlights & Electricity",
        "Animal Welfare",
        "Sanitation",
        "Other"
      ],
      required: true
    },
    images: {
      type: [String],
      default: []
    },
    location: {
      type: {
        type: String,
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    address: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["Reported", "In Progress", "Resolved"],
      default: "Reported"
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    volunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    comments: [commentSchema],
    resolutionProof: {
      image: {
        type: String,
        default: ""
      },
      note: {
        type: String,
        default: ""
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      resolvedAt: {
        type: Date
      }
    }
  },
  { timestamps: true }
);

communityPostSchema.index({ location: "2dsphere" });

export const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);

import mongoose from "mongoose";

const sosRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      enum: ["Medical", "Personal Safety", "Accident", "Fire", "Other"],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Responded", "Resolved", "Cancelled"],
      default: "Active",
    },

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },

    // Emergency contacts pre-filled from user profile
    emergencyContacts: [
      {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
      },
    ],
  },
  { timestamps: true }
);

// 2dsphere index for geo queries
sosRequestSchema.index({ location: "2dsphere" });

// Compound index to find active SOS near a location quickly
sosRequestSchema.index({ status: 1, createdAt: -1 });

export const SOSRequest = mongoose.model("SOSRequest", sosRequestSchema);

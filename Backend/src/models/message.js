import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: true
    },
    text: {
      type: String,
      default: ""
    },
    image: {
      type: String,
      default: ""
    },
    delivered: {
      type: Boolean,
      default: false
    },
    seen: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);

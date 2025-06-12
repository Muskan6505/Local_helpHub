import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    type: { 
      type: String, 
      enum: ['response', 'chat', 'status_update'] 
    },
    content: String,
    isRead: { 
      type: Boolean, 
      default: false 
    },
  }, 
  {
    timestamps: true
  }
);

export const Notification = mongoose.model("Notification", NotificationSchema);
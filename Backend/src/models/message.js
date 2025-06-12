import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    roomId: { 
      type: String, 
      required: true 
    }, // Use HelpRequest ID or custom thread ID

    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    message: String,
  }, 
  {
    timestamps:true
  }
);

export const Message = mongoose.model("Message", ChatMessageSchema);
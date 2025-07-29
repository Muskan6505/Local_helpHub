import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    receiver: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
  
    requestId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'HelpRequest', 
      required: true 
    },

    content: { 
      type: String 
    },

    file: {
      url: String,
      type: { type: String, enum: ['image', 'pdf', 'doc', 'other'] }
    },

    isRead: { 
      type: Boolean, 
      default: false 
    },

    isDeleted: { 
      type: Boolean, 
      default: false 
    },

  },
  { 
    timestamps: true 
  }
);

export const Message = mongoose.model("Message", MessageSchema);

import mongoose from "mongoose";

const ResponseSchema = new mongoose.Schema(
  {
    helper: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    helpRequest: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'HelpRequest', 
      required: true 
    },
    message: String,
    status: { 
      type: String, 
      enum: ['interested', 'in_progress', 'completed'], 
      default: 'interested' 
    }
  },
  {
    timestamps: true
  }
);

export const Response = mongoose.model("Response", ResponseSchema);
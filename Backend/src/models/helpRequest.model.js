import mongoose from "mongoose";

const HelpRequestSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: String,
    category: { 
      type: String, 
      enum: ['Medical', 'Medicines', 'Groceries', 'Food', 'Transport', 'other'] 
    },
    location: {
      type: { 
        type: String, 
        default: "Point" 
      },
      coordinates: { 
        type: [Number], 
        required: true 
      }
    },
    requester: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['open', 'in_progress', 'fulfilled'], 
      default: 'open' 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    }
  }, 
  {
    timestamps: true
  }
);

HelpRequestSchema.index({ location: '2dsphere' });

export const HelpRequest = mongoose.model("HelpRequest", HelpRequestSchema);
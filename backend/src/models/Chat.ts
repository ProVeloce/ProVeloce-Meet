import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  meetingId: string; // Reference to Meeting
  userId: string; // Clerk user ID
  userName: string;
  userImageUrl?: string;
  message: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userImageUrl: String,
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient chat retrieval by meeting
ChatSchema.index({ meetingId: 1, timestamp: -1 });

export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);


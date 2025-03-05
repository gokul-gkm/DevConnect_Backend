import { Schema, model, Types } from 'mongoose';

export interface IChat {
  _id?: string;
  userId: Types.ObjectId;
  developerId: Types.ObjectId;
  lastMessage?: string;
  lastMessageTime?: Date;
  userUnreadCount: number;
  developerUnreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  developerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date
  },
  userUnreadCount: {
    type: Number,
    default: 0
  },
  developerUnreadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

chatSchema.index({ userId: 1, developerId: 1 }, { unique: true });

export const Chat = model<IChat>('Chat', chatSchema);
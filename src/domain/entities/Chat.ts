import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  developerId: mongoose.Types.ObjectId;
  lastMessage?: IMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const chatSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  developerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: messageSchema,
  unreadCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

chatSchema.index({ userId: 1, developerId: 1 }, { unique: true });
chatSchema.index({ updatedAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
export const Chat = mongoose.model<IChat>('Chat', chatSchema);
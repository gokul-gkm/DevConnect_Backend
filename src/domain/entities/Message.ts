import { Schema, model, Types } from 'mongoose';

export interface IMessage {
  _id?: string;
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderType: 'user' | 'developer';
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'developer'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

messageSchema.index({ chatId: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);
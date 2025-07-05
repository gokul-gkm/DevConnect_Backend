import mongoose, { Schema, Document, ObjectId ,Types} from "mongoose";

export interface ISession extends Document {
    _id: ObjectId;
    title: string;
    description: string;
    duration: number;
    price: number;
    status: "pending" | "approved" | "rejected" | "scheduled" | "completed" | "active" | "cancelled";
    paymentStatus: "pending" | "completed";
    paymentTransferStatus?: "pending" | "transferred";
    rejectionReason: string;
    sessionDate: Date;
    startTime: Date;
    createdAt: Date;
    updatedAt: Date;
    topics: String[];
    developerId: Types.ObjectId | null;
    userId: Types.ObjectId | null;
}

const SessionSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  topics: [{ 
    type: String, 
    required: true 
  }],
  sessionDate: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: Number, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'scheduled', 'awaiting_payment','active', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  paymentTransferStatus: {
    type: String,
    enum: ['pending', 'transferred'],
    default: 'pending'
  },
  developerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Developer', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  rejectionReason: { 
    type: String 
  }
}, {
  timestamps: true
});

export const Session = mongoose.model<ISession>('Session', SessionSchema);
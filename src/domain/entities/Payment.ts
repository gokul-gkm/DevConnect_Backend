
import { Types, Schema, model } from 'mongoose';

export interface IPayment {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentId: string;
  stripeSessionId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';
  
  
  const PaymentSchema = new Schema<IPayment>({
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    stripePaymentId: { type: String },
    stripeSessionId: { type: String, required: true },
    metadata: { type: Map, of: Schema.Types.Mixed },
  }, {
    timestamps: true,
    versionKey: false
  });
  
  PaymentSchema.index({ sessionId: 1 });
  PaymentSchema.index({ stripeSessionId: 1 });
  
  export const PaymentModel = model<IPayment>('Payment', PaymentSchema);
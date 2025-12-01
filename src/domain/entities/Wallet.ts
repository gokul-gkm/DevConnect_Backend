import { Types, Schema, model, Document } from 'mongoose';

export interface IWallet extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  adminId?: string
  balance: number;
  transactions: IWalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWalletTransaction {
  _id: Types.ObjectId;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  sessionId?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'completed' | 'pending' | 'failed';


const WalletTransactionSchema = new Schema<IWalletTransaction>({
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['credit', 'debit'], 
    required: true 
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },
  description: { type: String, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
  metadata: { type: Map, of: Schema.Types.Mixed },
}, {
  timestamps: true,
  _id: true
});

const WalletSchema = new Schema<IWallet>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true , unique: true },
  adminId: { type: String, sparse: true },
  balance: { type: Number, default: 0 },
  transactions: [WalletTransactionSchema]
}, {
  timestamps: true,
  versionKey: false
});

WalletSchema.pre('save', function(next) {
  if ((this.userId && this.adminId) || (!this.userId && !this.adminId)) {
    next(new Error('Wallet must have either userId or adminId, but not both'));
  }
  next();
});

WalletSchema.index({ userId: 1 });
WalletSchema.index({ 'transactions.sessionId': 1 });
WalletSchema.index({ adminId: 1 }, { sparse: true });

export const WalletModel = model<IWallet>('Wallet', WalletSchema);



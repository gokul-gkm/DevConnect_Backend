import { Types } from 'mongoose';
import { IWallet, IWalletTransaction } from '../entities/Wallet';

export interface IWalletRepository {
  findByUserId(userId: Types.ObjectId): Promise<IWallet | null>;
  create(userId: Types.ObjectId): Promise<IWallet>;
  addTransaction(walletId: Types.ObjectId, transaction: Partial<IWalletTransaction>): Promise<IWallet>;
  updateBalance(walletId: Types.ObjectId, amount: number): Promise<IWallet>;
  transferFunds(
    fromWalletId: Types.ObjectId,
    toWalletId: Types.ObjectId,
    amount: number,
    sessionId: Types.ObjectId
  ): Promise<void>;
  findByAdminId(adminId: string): Promise<IWallet | null>
  createAdminWallet(): Promise<IWallet>
}
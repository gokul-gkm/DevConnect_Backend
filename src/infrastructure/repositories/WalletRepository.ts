import { Types } from 'mongoose';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { IWallet, IWalletTransaction } from '@/domain/entities/Wallet';
import { WalletModel } from '@/domain/entities/Wallet';
import { AppError } from '@/domain/errors/AppError';

export class WalletRepository implements IWalletRepository {
  async findByUserId(userId: Types.ObjectId): Promise<IWallet | null> {
    try {
      return await WalletModel.findOne({ userId });
    } catch (error) {
      throw new AppError('Failed to fetch wallet', 500);
    }
  }

  async create(userId: Types.ObjectId): Promise<IWallet> {
    try {
      const wallet = new WalletModel({ userId, balance: 0 });
      return await wallet.save();
    } catch (error) {
      throw new AppError('Failed to create wallet', 500);
    }
  }

  async addTransaction(
    walletId: Types.ObjectId,
    transaction: Partial<IWalletTransaction>
  ): Promise<IWallet> {
    try {
      const updatedWallet = await WalletModel.findByIdAndUpdate(
        walletId,
        {
          $push: { transactions: transaction },
          $inc: { balance: transaction.type === 'credit' ? (transaction.amount ?? 0) : -(transaction.amount ?? 0) }
        },
        { new: true }
      );
      if (!updatedWallet) {
        throw new AppError('Wallet not found', 404);
      }
      return updatedWallet;
    } catch (error) {
      throw new AppError('Failed to add transaction', 500);
    }
  }

  async updateBalance(walletId: Types.ObjectId, amount: number): Promise<IWallet> {
    try {
      const updatedWallet = await WalletModel.findByIdAndUpdate(
        walletId,
        { $inc: { balance: amount } },
        { new: true }
      );
      if (!updatedWallet) {
        throw new AppError('Wallet not found', 404);
      }
      return updatedWallet;
    } catch (error) {
      throw new AppError('Failed to update wallet balance', 500);
    }
  }

  async transferFunds(
    fromWalletId: Types.ObjectId,
    toWalletId: Types.ObjectId,
    amount: number,
    sessionId: Types.ObjectId
  ): Promise<void> {
    const session = await WalletModel.startSession();
    
    try {
      session.startTransaction();

      const fromWallet = await WalletModel.findById(fromWalletId);
      if (!fromWallet || fromWallet.balance < amount) {
        throw new AppError('Insufficient funds', 400);
      }

      await WalletModel.findByIdAndUpdate(fromWalletId, {
        $inc: { balance: -amount },
        $push: {
          transactions: {
            amount,
            type: 'debit',
            status: 'completed',
            description: 'Transfer to developer wallet',
            sessionId,
            createdAt: new Date()
          }
        }
      });

      await WalletModel.findByIdAndUpdate(toWalletId, {
        $inc: { balance: amount },
        $push: {
          transactions: {
            amount,
            type: 'credit',
            status: 'completed',
            description: 'Session payment received',
            sessionId,
            createdAt: new Date()
          }
        }
      });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findByAdminId(adminId: string): Promise<IWallet | null> {
    try {
      return await WalletModel.findOne({ adminId });
    } catch (error) {
      throw new AppError('Failed to fetch admin wallet', 500);
    }
  }


  async createAdminWallet(): Promise<IWallet> {
    try {
      const wallet = new WalletModel({
        adminId: process.env.ADMIN_ID,
        balance: 0,
        transactions: []
      });
      return await wallet.save();
    } catch (error) {
      throw new AppError('Failed to create admin wallet', 500);
    }
  }
}
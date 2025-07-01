import mongoose, { Types } from 'mongoose';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { IWallet, IWalletTransaction } from '@/domain/entities/Wallet';
import { WalletModel } from '@/domain/entities/Wallet';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { BaseRepository } from './BaseRepository';

export class WalletRepository extends BaseRepository<IWallet> implements IWalletRepository {
  constructor() {
    super(WalletModel)
}
  async findByUserId(userId: Types.ObjectId): Promise<IWallet | null> {
    try {
      return await WalletModel.findOne({ userId });
    } catch (error) {
      throw new AppError('Failed to fetch wallet', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async create(userId: Types.ObjectId): Promise<IWallet> {
    try {
      const wallet = new WalletModel({ userId, balance: 0 });
      return await wallet.save();
    } catch (error) {
      throw new AppError('Failed to create wallet', StatusCodes.INTERNAL_SERVER_ERROR);
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
        throw new AppError('Wallet not found', StatusCodes.NOT_FOUND);
      }
      return updatedWallet;
    } catch (error) {
      throw new AppError('Failed to add transaction', StatusCodes.INTERNAL_SERVER_ERROR);
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
        throw new AppError('Wallet not found', StatusCodes.NOT_FOUND);
      }
      return updatedWallet;
    } catch (error) {
      throw new AppError('Failed to update wallet balance', StatusCodes.INTERNAL_SERVER_ERROR);
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
        throw new AppError('Insufficient funds', StatusCodes.BAD_REQUEST);
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
      throw new AppError('Failed to fetch admin wallet', StatusCodes.INTERNAL_SERVER_ERROR);
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
      throw new AppError('Failed to create admin wallet', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getTotalRevenue(): Promise<number> {
    try {
      const result = await WalletModel.aggregate([
        {
          $match: { adminId: process.env.ADMIN_ID }
        },
        {
          $unwind: "$transactions"
        },
        {
          $match: { "transactions.type": "credit" }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$transactions.amount" }
          }
        }
      ]);
      
      return result.length > 0 ? result[0].totalRevenue : 0;
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      throw new AppError('Failed to calculate revenue', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getMonthlyRevenue(startDate: Date): Promise<Array<{ year: number; month: number; revenue: number }>> {
    try {
      return await WalletModel.aggregate([
        {
          $match: {
            adminId: process.env.ADMIN_ID,
            'transactions.createdAt': { $gte: startDate }
          }
        },
        {
          $unwind: '$transactions'
        },
        {
          $match: {
            'transactions.type': 'credit'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$transactions.createdAt' },
              month: { $month: '$transactions.createdAt' }
            },
            revenue: { $sum: '$transactions.amount' }
          }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            revenue: 1
          }
        },
        {
          $sort: { year: 1, month: 1 }
        }
      ]);
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      throw new AppError('Failed to fetch revenue data', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }


  async processRefund(sessionId: string, userId: string, developerId: string, amount: number, reason: string): Promise<any> {
    try {
      
      const adminWallet = await WalletModel.findOne({ userId: 'admin' });
      if (!adminWallet) {
        throw new AppError('Admin wallet not found', StatusCodes.INTERNAL_SERVER_ERROR);
      }
  
      // Get user wallet
      const userWallet = await WalletModel.findOne({ userId });
      if (!userWallet) {
        throw new AppError('User wallet not found', StatusCodes.NOT_FOUND);
      }
  
      // Check if admin wallet has sufficient balance
      if (adminWallet.balance < amount) {
        throw new AppError('Insufficient admin wallet balance', StatusCodes.INTERNAL_SERVER_ERROR);
      }
  
      // Start transaction
      const session = await mongoose.startSession();
      session.startTransaction();
  
      try {
        // Deduct from admin wallet
        await WalletModel.findByIdAndUpdate(
          adminWallet._id,
          { 
            $inc: { balance: -amount },
            $push: {
              transactions: {
                amount,
                type: 'debit',
                status: 'completed',
                description: `Refund to user for cancelled session: ${reason}`,
                sessionId: new Types.ObjectId(sessionId),
                createdAt: new Date()
              }
            }
          },
          { session }
        );
  
        // Add to user wallet
        await WalletModel.findByIdAndUpdate(
          userWallet._id,
          { 
            $inc: { balance: amount },
            $push: {
              transactions: {
                amount,
                type: 'credit',
                status: 'completed',
                description: `Refund received for cancelled session: ${reason}`,
                sessionId: new Types.ObjectId(sessionId),
                createdAt: new Date()
              }
            }
          },
          { session }
        );
  
        await session.commitTransaction();
        session.endSession();
  
        return {
          sessionId,
          amount,
          reason,
          status: 'completed'
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process refund', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
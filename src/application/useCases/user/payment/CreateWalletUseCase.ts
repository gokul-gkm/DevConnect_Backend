import { Types } from 'mongoose';
import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';

export class CreateWalletUseCase {
  constructor(private walletRepository: WalletRepository) {}

  async execute(userId: Types.ObjectId): Promise<void> {
    try {
      const existingWallet = await this.walletRepository.findByUserId(userId);
      if (existingWallet) {
        throw new AppError('Wallet already exists for this user', StatusCodes.BAD_REQUEST);
      }

      await this.walletRepository.create(userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create wallet', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
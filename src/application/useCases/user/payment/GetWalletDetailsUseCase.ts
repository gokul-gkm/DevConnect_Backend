import { Types } from 'mongoose';
import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { AppError } from '@/domain/errors/AppError';
import { IWallet } from '@/domain/entities/Wallet';

export class GetWalletDetailsUseCase {
  constructor(private walletRepository: WalletRepository) {}

  async execute(userId: string): Promise<IWallet> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const wallet = await this.walletRepository.findByUserId(
      new Types.ObjectId(userId)
    );

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    return wallet;
  }
}
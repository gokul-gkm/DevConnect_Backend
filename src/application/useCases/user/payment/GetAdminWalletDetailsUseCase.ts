import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { AppError } from '@/domain/errors/AppError';
import { IWallet } from '@/domain/entities/Wallet';

export class GetAdminWalletDetailsUseCase {
  constructor(private walletRepository: WalletRepository) {}

  async execute(adminId: string): Promise<IWallet> {
    if (!adminId) {
      throw new AppError('Admin Id not fount', 400);
    }

    const wallet = await this.walletRepository.findByAdminId(
      adminId
    );

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    return wallet;
  }
}
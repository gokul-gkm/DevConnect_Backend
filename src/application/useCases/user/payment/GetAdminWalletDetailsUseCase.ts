import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { AppError } from '@/domain/errors/AppError';
import { IWallet } from '@/domain/entities/Wallet';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { StatusCodes } from 'http-status-codes';

export class GetAdminWalletDetailsUseCase {
  constructor(private walletRepository: IWalletRepository) {}

  async execute(adminId: string): Promise<IWallet> {
    if (!adminId) {
      throw new AppError('Admin Id not fount', StatusCodes.BAD_REQUEST);
    }

    const wallet = await this.walletRepository.findByAdminId(
      adminId
    );

    if (!wallet) {
      throw new AppError('Wallet not found', StatusCodes.NOT_FOUND);
    }

    return wallet;
  }
}
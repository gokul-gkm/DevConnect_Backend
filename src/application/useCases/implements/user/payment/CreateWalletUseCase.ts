import { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { ICreateWalletUseCase } from '@/application/useCases/interfaces/user/payment/ICreateWalletUseCase';

export class CreateWalletUseCase implements ICreateWalletUseCase {
  constructor(
    private _walletRepository: IWalletRepository
  ) { }

  async execute(userId: Types.ObjectId): Promise<void> {
    try {
      const existingWallet = await this._walletRepository.findByUserId(userId);
      if (existingWallet) {
        throw new AppError('Wallet already exists for this user', StatusCodes.BAD_REQUEST);
      }

      await this._walletRepository.create(userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create wallet', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
import { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { IWallet } from '@/domain/entities/Wallet';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { StatusCodes } from 'http-status-codes';
import { IGetWalletDetailsUseCase } from '@/application/useCases/interfaces/user/payment/IGetWalletDetailsUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class GetWalletDetailsUseCase implements IGetWalletDetailsUseCase {
  constructor(
    @inject(TYPES.IWalletRepository)
    private _walletRepository: IWalletRepository
  ) { }

  async execute(userId: string): Promise<IWallet> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', StatusCodes.BAD_REQUEST);
    }

    const wallet = await this._walletRepository.findByUserId(
      new Types.ObjectId(userId)
    );

    if (!wallet) {
      throw new AppError('Wallet not found', StatusCodes.NOT_FOUND);
    }

    return wallet;
  }
}
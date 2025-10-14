import { AppError } from '@/domain/errors/AppError';
import { IWallet } from '@/domain/entities/Wallet';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { StatusCodes } from 'http-status-codes';
import { IGetAdminWalletDetailsUseCase } from '@/application/useCases/interfaces/user/payment/IGetAdminWalletDetailsUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class GetAdminWalletDetailsUseCase implements IGetAdminWalletDetailsUseCase {
  constructor(
    @inject(TYPES.IWalletRepository)
    private _walletRepository: IWalletRepository
  ) { }

  async execute(adminId: string): Promise<IWallet> {
    if (!adminId) {
      throw new AppError('Admin Id not fount', StatusCodes.BAD_REQUEST);
    }

    const wallet = await this._walletRepository.findByAdminId(
      adminId
    );

    if (!wallet) {
      throw new AppError('Wallet not found', StatusCodes.NOT_FOUND);
    }

    return wallet;
  }
}
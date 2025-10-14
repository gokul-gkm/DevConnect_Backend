import { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { ITransferToDevWalletUseCase } from '@/application/useCases/interfaces/user/payment/ITransferToDevWalletUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class TransferToDevWalletUseCase implements ITransferToDevWalletUseCase {
  private DEVELOPER_PERCENTAGE = Number(process.env.DEVELOPER_PERCENTAGE);

  constructor(
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.IWalletRepository)
    private _walletRepository: IWalletRepository,
  ) {}

  async execute(sessionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID', StatusCodes.BAD_REQUEST);
    }

    const session = await this._sessionRepository.getSessionById(
      new Types.ObjectId(sessionId)
    );

    if (!session) {
      throw new AppError('Session not found', StatusCodes.NOT_FOUND);
    }

    if (session.status !== 'completed') {
      throw new AppError('Session is not completed yet', StatusCodes.BAD_REQUEST);
    }

    if (session.paymentStatus !== 'completed') {
      throw new AppError('Payment is not completed', StatusCodes.BAD_REQUEST);
    }

    if (!session.developerId) {
      throw new AppError('Invalid developer ID', StatusCodes.BAD_REQUEST);
    }

    const developerAmount = session.price * this.DEVELOPER_PERCENTAGE;

    const adminWallet = await this._walletRepository.findByAdminId(process.env.ADMIN_ID!);
    if (!adminWallet) {
      throw new AppError('Admin wallet not found', StatusCodes.NOT_FOUND);
    }

    const developerWallet = await this._walletRepository.findByUserId(session.developerId);
    if (!developerWallet) {
      throw new AppError('Developer wallet not found', StatusCodes.NOT_FOUND);
    }

    await this._walletRepository.transferFunds(
      adminWallet._id,
      developerWallet._id,
      developerAmount,
      new Types.ObjectId(sessionId)
    );

    await this._sessionRepository.updatePaymentTransferStatus(
      new Types.ObjectId(sessionId),
      'transferred'
    );
  }
}
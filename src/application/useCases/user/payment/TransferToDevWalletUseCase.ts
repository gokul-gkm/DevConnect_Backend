import { Types } from 'mongoose';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';

export class TransferToDevWalletUseCase {
  private DEVELOPER_PERCENTAGE = 0.8;

  constructor(
    private sessionRepository: SessionRepository,
    private walletRepository: WalletRepository,
  ) {}

  async execute(sessionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID', StatusCodes.BAD_REQUEST);
    }

    const session = await this.sessionRepository.getSessionById(
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

    const adminWallet = await this.walletRepository.findByAdminId(process.env.ADMIN_ID!);
    if (!adminWallet) {
      throw new AppError('Admin wallet not found', StatusCodes.NOT_FOUND);
    }

    const developerWallet = await this.walletRepository.findByUserId(session.developerId);
    if (!developerWallet) {
      throw new AppError('Developer wallet not found', StatusCodes.NOT_FOUND);
    }

    await this.walletRepository.transferFunds(
      adminWallet._id,
      developerWallet._id,
      developerAmount,
      new Types.ObjectId(sessionId)
    );

    await this.sessionRepository.updatePaymentTransferStatus(
      new Types.ObjectId(sessionId),
      'transferred'
    );
  }
}
import { Types } from 'mongoose';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { AppError } from '@/domain/errors/AppError';

export class TransferToDevWalletUseCase {
  private DEVELOPER_PERCENTAGE = 0.8;

  constructor(
    private sessionRepository: SessionRepository,
    private walletRepository: WalletRepository,
  ) {}

  async execute(sessionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID', 400);
    }

    const session = await this.sessionRepository.getSessionById(
      new Types.ObjectId(sessionId)
    );

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.status !== 'completed') {
      throw new AppError('Session is not completed yet', 400);
    }

    if (session.paymentStatus !== 'completed') {
      throw new AppError('Payment is not completed', 400);
    }

    if (!session.developerId) {
      throw new AppError('Invalid developer ID', 400);
    }

    const developerAmount = session.price * this.DEVELOPER_PERCENTAGE;

    const adminWallet = await this.walletRepository.findByAdminId(process.env.ADMIN_ID!);
    if (!adminWallet) {
      throw new AppError('Admin wallet not found', 404);
    }

    const developerWallet = await this.walletRepository.findByUserId(session.developerId);
    if (!developerWallet) {
      throw new AppError('Developer wallet not found', 404);
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
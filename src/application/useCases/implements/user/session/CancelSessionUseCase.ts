import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { INotificationService } from '@/domain/interfaces/INotificationService';
import { ICancelSessionUseCase } from '@/application/useCases/interfaces/user/session/ICancelSessionUseCase';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';

export class CancelSessionUseCase implements ICancelSessionUseCase {
  constructor(
    private _sessionRepository: ISessionRepository,
    private _notificationService: INotificationService,
    private _walletRepository: IWalletRepository
  ) {}

  async execute(sessionId: string, userId: string, reason: string): Promise<void> {

    if (!sessionId || !userId || !reason) {
      throw new AppError('Session ID, user ID, and reason are required', StatusCodes.BAD_REQUEST);
    }

    const objectId = new mongoose.Types.ObjectId(sessionId)
    const session = await this._sessionRepository.getSessionById(objectId);
    if (!session) {
      throw new AppError('Session not found', StatusCodes.NOT_FOUND);
    }

    if (String(session.userId) !== String(userId)) {
      throw new AppError('Unauthorized to cancel this session', StatusCodes.FORBIDDEN);
    }

    const allowedStatuses = ['pending', 'approved', 'awaiting_payment', 'scheduled'];
    if (!allowedStatuses.includes(session.status)) {
      throw new AppError('Session cannot be cancelled at this stage', StatusCodes.BAD_REQUEST);
    }

    const startTime = new Date(session.startTime).getTime();
    const now = Date.now();
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    
    if (startTime - now <= twelveHoursInMs) {
      throw new AppError('Cannot cancel session within 12 hours of start time', StatusCodes.BAD_REQUEST);
    }

     await this._sessionRepository.cancelSession(sessionId, reason);
    
    let refund = null;
    if (session.paymentStatus === 'completed') {
      refund = await this._walletRepository.processRefund(
        sessionId,
        userId,
        session.developerId.toString(),
        session.price,
        reason
      )
      console.log('refund', refund);
    }

    await this._notificationService.notify(
      session.developerId.toString(),
        'Session Request Cancelled',
        `Your session "${session.title}" has been cancelled. Reason: ${reason}`,
      'session',
      userId
    );

    if (refund) {
      await this._notificationService.notify(
        session.userId.toString(),
        'Session refund',
        `Your refund of $${session.price} has been processed for the cancelled session.`,
        'session',
        session.developerId.toString()
      )
    }

  }
}



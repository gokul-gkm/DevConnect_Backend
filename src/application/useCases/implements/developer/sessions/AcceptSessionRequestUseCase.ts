import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ISessionRepository } from '@/domain/interfaces/repositories/ISessionRepository';
import { ISocketService } from '@/domain/interfaces/services/ISocketService';
import { IAcceptSessionRequestUseCase } from '@/application/useCases/interfaces/developer/sessions/IAcceptSessionRequestUseCase';
import { INotificationService } from '@/domain/interfaces/services/INotificationService';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class AcceptSessionRequestUseCase implements IAcceptSessionRequestUseCase {
  constructor(
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.INotificationService)
    private _notificationService: INotificationService,
    @inject(TYPES.ISocketService)
    private _socketService: ISocketService
  ) {}

  async execute(sessionId: string, developerId: string) {
    try {
      if (!sessionId || !developerId) {
        throw new AppError('Session ID and Developer ID are required', StatusCodes.BAD_REQUEST);
      }

      const session = await this._sessionRepository.getSessionById(
        new Types.ObjectId(sessionId)
      );

      if (!session) {
        throw new AppError('Session not found', StatusCodes.NOT_FOUND);
      }

      if (session.developerId && session.developerId.toString() !== developerId) {
        throw new AppError('Unauthorized to accept this session', StatusCodes.FORBIDDEN);
      }

      if (session.status !== 'pending') {
        throw new AppError('Session is not in pending state', StatusCodes.BAD_REQUEST);
      }

      const updatedSession = await this._sessionRepository.updateSessionStatus(
        new Types.ObjectId(sessionId),
        'approved'
      );

      if (updatedSession && updatedSession.userId) {
        try {
          const recipientId = updatedSession.userId._id.toString();
          
          const notification = await this._notificationService.notify(
            recipientId,
            'Session Request Accepted',
            `Your session "${updatedSession.title}" has been accepted.`,
            'session',
            developerId,
            sessionId
          );

          if (this._socketService.isUserOnline(recipientId)) {
            console.log('user is online. emitting session updated')
            this._socketService.emitToUser(recipientId, 'session:updated', {
              sessionId: sessionId,
              status: 'approved',
            });
          }


        } catch (notificationError) {
          console.error('Failed to create or send notification:', notificationError);
        }
      }

      return updatedSession;
    } catch (error) {
      console.error('Accept session request error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to accept session request', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
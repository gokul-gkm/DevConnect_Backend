import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { SocketService } from '@/infrastructure/services/SocketService';
import mongoose from 'mongoose';
import { ISocketService } from '@/domain/interfaces/ISocketService';
import { IStartSessionUseCase } from '@/application/useCases/interfaces/developer/sessions/IStartSessionUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class StartSessionUseCase implements IStartSessionUseCase{
  constructor(
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.ISocketService)
    private _socketService: ISocketService
  ) {}

  async execute(sessionId: string): Promise<void> {
    const objectId = new mongoose.Types.ObjectId(sessionId);
    const session = await this._sessionRepository.getSessionById(objectId);

    if (!session) {
      throw new AppError('Session not found', StatusCodes.NOT_FOUND);
    }

    if (session.status !== 'scheduled') {
      throw new AppError('Session is not scheduled', StatusCodes.BAD_REQUEST);
    }

    //   await this.sessionRepository.updateSessionStatus(objectId, 'active');
      
    if (session.userId) {
      this._socketService.emitToUser(session.userId.toString(), 'session:started', {
        sessionId,
        message: 'Your session is ready to join'
      });
    }
  }
}

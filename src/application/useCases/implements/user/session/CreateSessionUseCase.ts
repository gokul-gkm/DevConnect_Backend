import { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { ISession } from '@/domain/entities/Session';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES } from '@/utils/constants';
import { ISessionRepository } from '@/domain/interfaces/repositories/ISessionRepository';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { IDeveloperRepository } from '@/domain/interfaces/repositories/IDeveloperRepository';
import { INotificationService } from '@/domain/interfaces/services/INotificationService';
import { ICreateSessionUseCase } from '@/application/useCases/interfaces/user/session/ICreateSessionUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

export interface CreateSessionDTO {
  title: string;
  description: string;
  topics: string[];
  sessionDate: string | Date;
  startTime: string | Date;
  duration: number;
  price: number;
  developerId: string;
  userId: string;
}

@injectable()
export class CreateSessionUseCase implements ICreateSessionUseCase {
  constructor(
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.IUserRepository)
    private _userRepository: IUserRepository,
    @inject(TYPES.IDeveloperRepository)
    private _developerRepository: IDeveloperRepository,
    @inject(TYPES.INotificationService)
    private _notificationService: INotificationService
  ) {}

  async execute(data: CreateSessionDTO): Promise<ISession> {
    try {
     
      const developer = await this._developerRepository.findByUserId(data.developerId);
      
      if (!developer) {
        throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND, StatusCodes.NOT_FOUND);
      }

      const user = await this._userRepository.findById(data.userId);
      if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
      }

      const isAvailable = await this._sessionRepository.checkSlotAvailability(
        data.developerId,
        new Date(data.sessionDate),
        new Date(data.startTime),
        data.duration
      );

      if (!isAvailable) {
        throw new AppError('Selected time slot is not available', StatusCodes.BAD_REQUEST);
      }

      const sessionData: Partial<ISession> = {
        title: data.title,
        description: data.description,
        topics: data.topics,
        sessionDate: new Date(data.sessionDate),
        startTime: new Date(data.startTime),
        duration: data.duration,
        price: data.price,
        developerId: new Types.ObjectId(data.developerId),
        userId: new Types.ObjectId(data.userId),
        status: 'pending',
        paymentStatus: 'pending'
      };
      
      const session = await this._sessionRepository.createSession(sessionData);

      try {
        await this._notificationService.notify(
          data.developerId,
          'New Session Request',
          `${user.username} has requested a new session: "${data.title}"`,
          'session',
          data.userId,
          session._id.toString()
        )
      } catch (notificationError) {
        console.log('Failed to create notification :', notificationError)
      }

      return session;
    } catch (error : any) {
      console.error("Create session error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create session', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
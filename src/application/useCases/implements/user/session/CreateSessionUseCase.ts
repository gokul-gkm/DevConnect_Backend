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
import { validateCreateSession } from '@/utils/validation';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';
import { CreateSessionDTO } from '@/application/dto/users/session/CreateSessionDTO';

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
      const validatedData = validateCreateSession(data);

      const developer = await this._developerRepository.findByUserId(validatedData.developerId);
      
      if (!developer) {
        throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND, StatusCodes.NOT_FOUND);
      }

      const user = await this._userRepository.findById(validatedData.userId);
      if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
      }

      const isAvailable = await this._sessionRepository.checkSlotAvailability(
        validatedData.developerId,
        validatedData.sessionDate,
        validatedData.startTime,
        validatedData.duration
      );

      if (!isAvailable) {
        throw new AppError('Selected time slot is not available', StatusCodes.BAD_REQUEST);
      }

      const sessionData: Partial<ISession> = {
        title: validatedData.title,
        description: validatedData.description,
        topics: validatedData.topics,
        sessionDate: validatedData.sessionDate,
        startTime: validatedData.startTime,
        duration: validatedData.duration,
        price: validatedData.price,
        developerId: new Types.ObjectId(validatedData.developerId),
        userId: new Types.ObjectId(validatedData.userId),
        status: 'pending',
        paymentStatus: 'pending'
      };
      
      const session = await this._sessionRepository.createSession(sessionData);

      try {
        await this._notificationService.notify(
          validatedData.developerId,
          'New Session Request',
          `${user.username} has requested a new session: "${validatedData.title}"`,
          'session',
          validatedData.userId,
          session._id.toString()
        )
      } catch (notificationError) {
        console.log('Failed to create notification :', notificationError)
      }

      return session;
    } catch (error : unknown) {
      console.error("Create session error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create session', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
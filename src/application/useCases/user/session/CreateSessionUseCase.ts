import { Types } from 'mongoose';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { DeveloperRepository } from '@/infrastructure/repositories/DeveloperRepository';
import { MailService } from '@/infrastructure/mail/MailService';
import { AppError } from '@/domain/errors/AppError';
import { ISession } from '@/domain/entities/Session';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '@/infrastructure/services/NotificationService';
import { ERROR_MESSAGES } from '@/utils/constants';

interface CreateSessionDTO {
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

export class CreateSessionUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private userRepository: UserRepository,
    private developerRepository: DeveloperRepository,
    private notificationService: NotificationService
  ) {}

  async execute(data: CreateSessionDTO): Promise<ISession> {
    try {
     
      const developer = await this.developerRepository.findByUserId(data.developerId);
      
      if (!developer) {
        throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND, StatusCodes.NOT_FOUND);
      }

      const user = await this.userRepository.findById(data.userId);
      if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
      }

      const isAvailable = await this.sessionRepository.checkSlotAvailability(
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
      
      const session = await this.sessionRepository.createSession(sessionData);

      try {
        await this.notificationService.notify(
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
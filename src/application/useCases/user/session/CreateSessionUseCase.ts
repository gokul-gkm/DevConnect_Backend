import { Types } from 'mongoose';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { DeveloperRepository } from '@/infrastructure/repositories/DeveloperRepository';
import { MailService } from '@/infrastructure/mail/MailService';
import { AppError } from '@/domain/errors/AppError';
import { ISession } from '@/domain/entities/Session';
import { StatusCodes } from 'http-status-codes';

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
    private mailService: MailService
  ) {}

  async execute(data: CreateSessionDTO): Promise<ISession> {
    try {
     
      const developer = await this.developerRepository.findByUserId(data.developerId);
      
      if (!developer) {
        throw new AppError('Developer not found', StatusCodes.NOT_FOUND);
      }

      const user = await this.userRepository.findById(data.userId);
      if (!user) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
      }

      const isAvailable = await this.sessionRepository.checkSlotAvailability(
        data.developerId,
        new Date(data.sessionDate),
        new Date(data.startTime),
        data.duration
      );

      if (!isAvailable) {
        console.log("selected time slot is not available");
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
      console.log("session :", session);

      // Send email notifications
      // await this.mailService.sendSessionRequestEmail(
      //   developer.userId.email,
      //   {
      //     title: session.title,
      //     sessionDate: session.sessionDate,
      //     startTime: session.startTime,
      //     duration: session.duration,
      //     price: session.price,
      //     username: user.username
      //   }
      // );

      return session;
    } catch (error) {
      console.error("Create session error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create session', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
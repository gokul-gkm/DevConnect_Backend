import { Request, Response } from 'express';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { CreateSessionUseCase } from '@/application/useCases/user/session/CreateSessionUseCase';
import { MailService } from '@/infrastructure/mail/MailService';
import { AppError } from '@/domain/errors/AppError';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { DeveloperRepository } from '@/infrastructure/repositories/DeveloperRepository';
import { GetUserSessionsUseCase } from '@/application/useCases/user/session/GetUserSessionsUseCase';
import { GetUpcomingSessionsUseCase } from '@/application/useCases/user/session/GetUpcomingSessionsUseCase';
import { GetSessionRequestsUseCase } from '@/application/useCases/developer/sessions/GetSessionRequestsUseCase';
import { AcceptSessionRequestUseCase } from '@/application/useCases/developer/sessions/AcceptSessionRequestUseCase';
import { RejectSessionRequestUseCase } from '@/application/useCases/developer/sessions/RejectSessionRequestUseCase';
import { StatusCodes } from 'http-status-codes';
import { GetSessionDetailsUseCase } from '@/application/useCases/user/session/GetSessionDetailsUseCase';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { NotificationRepository } from '@/infrastructure/repositories/NotificationRepositoty';
import { SocketService } from '@/infrastructure/services/SocketService';
import { NotificationService } from '@/infrastructure/services/NotificationService';

export class SessionController {
  private createSessionUseCase: CreateSessionUseCase;
  private getUserSessionsUseCase: GetUserSessionsUseCase;
  private getUpcomingSessionsUseCase: GetUpcomingSessionsUseCase;
  private getSessionRequestsUseCase: GetSessionRequestsUseCase;
  private acceptSessionRequestUseCase: AcceptSessionRequestUseCase;
  private rejectSessionRequestUseCase: RejectSessionRequestUseCase;
  private getSessionDetailsUseCase: GetSessionDetailsUseCase;

  constructor(
    private sessionRepository: SessionRepository,
    private mailService: MailService,
    private userRepository: UserRepository,
    private developerRepository: DeveloperRepository,
    private s3Service: S3Service,
    private notificationRepository: NotificationRepository,
    private socketService: SocketService,
    private notificationService: NotificationService
    ) {
    this.createSessionUseCase = new CreateSessionUseCase(sessionRepository, userRepository, developerRepository, notificationService);
    this.getUserSessionsUseCase = new GetUserSessionsUseCase(sessionRepository);
    this.getUpcomingSessionsUseCase = new GetUpcomingSessionsUseCase(sessionRepository,s3Service);
    this.getSessionRequestsUseCase = new GetSessionRequestsUseCase(sessionRepository);
    this.acceptSessionRequestUseCase = new AcceptSessionRequestUseCase(
      sessionRepository,
      notificationService
    );
    this.rejectSessionRequestUseCase = new RejectSessionRequestUseCase(sessionRepository, notificationService)
    this.getSessionDetailsUseCase = new GetSessionDetailsUseCase(sessionRepository, s3Service);
  }


  async createSession(req: Request, res: Response) {
    try {
      const session = await this.createSessionUseCase.execute({
        ...req.body,
        userId: req.userId
      });

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: session
      });
    } catch (error: any) {
      console.log("error message : ", error.message)
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async getBookedSlots(req: Request, res: Response) {
    try {
      const { developerId, date } = req.query;
      
      if (!developerId || !date) {
        throw new AppError('Developer ID and date are required', StatusCodes.BAD_REQUEST);
      }
  
      const bookedSlots = await this.sessionRepository.getBookedSlots(
        developerId as string,
        new Date(date as string)
      );
  
      const formattedSlots = bookedSlots.map(slot => ({
        startTime: slot.startTime,
        duration: slot.duration
      }));
  
      return res.status(StatusCodes.OK).json({
        success: true,
        data: formattedSlots
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }



  async getUserSessions(req: Request, res: Response) {
    try {
      const userId = req.userId;
      
      if (!userId) {
        throw new AppError('User not authenticated', StatusCodes.UNAUTHORIZED);
      }

      const sessions = await this.getUserSessionsUseCase.execute(userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getUpcomingSessions(req: Request, res: Response) {
    try {
      const userId = req.userId;
      
      if (!userId) {
        throw new AppError('User not authenticated', StatusCodes.UNAUTHORIZED); 
      }
      const sessions = await this.getUpcomingSessionsUseCase.execute(userId);

      return res.status(StatusCodes.OK).json({
        success: true,  
        data: sessions
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      }); 
    }
  }


  getSessionRequests = async (req: Request, res: Response) => {
    try {
      const developerId = req.userId;
      
      if (!developerId) {
        throw new AppError('Developer ID is required', StatusCodes.BAD_REQUEST);
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5; 

      const result = await this.getSessionRequestsUseCase.execute(developerId, page, limit);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result.sessions,
        pagination: result.pagination,
        stats: result.stats
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      }); 
    }
  };

  acceptSessionRequest = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const developerId = req.userId;

      if (!sessionId || !developerId) {
        throw new AppError('Session ID and Developer ID are required', StatusCodes.BAD_REQUEST);
      }
      const session = await this.acceptSessionRequestUseCase.execute(sessionId, developerId);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: session
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      }); 
    }
  };

  rejectSessionRequest = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { rejectionReason } = req.body;
      const developerId = req.userId;

      if (!sessionId || !developerId || !rejectionReason) {
        throw new AppError('Session ID, Developer ID and rejection reason are required', StatusCodes.BAD_REQUEST);
      }

      const session = await this.rejectSessionRequestUseCase.execute(
        sessionId,
        developerId,
        rejectionReason
      );

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: session
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      }); 
    }
  };


  async getSessionDetails(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await this.getSessionDetailsUseCase.execute(sessionId);
      res.json(session);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      }); 
    }  
  }

}
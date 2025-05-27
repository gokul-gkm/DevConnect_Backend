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
import { GetSessionRequestDetailsUseCase } from '@/application/useCases/developer/sessions/GetSessionRequestDetailsUseCase';
import { GetScheduledSessionsUseCase } from '@/application/useCases/developer/sessions/GetScheduledSessionsUseCase';
import { GetScheduledSessionDetailsUseCase } from '@/application/useCases/developer/sessions/GetScheduledSessionDetailsUseCase';
import { IDeveloperSlotRepository } from '@/domain/interfaces/IDeveloperSlotRepository';
import { GetDeveloperUnavailableSlotsUseCase } from '@/application/useCases/user/availability/GetDeveloperUnavailableSlotsUseCase';
import { GetSessionHistoryUseCase } from '@/application/useCases/user/session/GetSessionHistoryUseCase';
import { RatingRepository } from '@/infrastructure/repositories/RatingRepository';
import mongoose from "mongoose";
import { IRatingRepository } from '@/domain/interfaces/IRatingRepository';
import { RateSessionUseCase } from '@/application/useCases/user/rating/RateSessionUseCase';
import { GetDeveloperSessionHistoryUseCase } from '@/application/useCases/developer/sessions/GetDeveloperSessionHistoryUseCase';
import { GetDeveloperSessionHistoryDetailsUseCase } from '@/application/useCases/developer/sessions/GetDeveloperSessionHistoryDetailsUseCase';
import { StartSessionUseCase } from '@/application/useCases/developer/sessions/StartSessionUseCase';
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from '@/utils/constants';

export class SessionController {
  private createSessionUseCase: CreateSessionUseCase;
  private getUserSessionsUseCase: GetUserSessionsUseCase;
  private getUpcomingSessionsUseCase: GetUpcomingSessionsUseCase;
  private getSessionRequestsUseCase: GetSessionRequestsUseCase;
  private acceptSessionRequestUseCase: AcceptSessionRequestUseCase;
  private rejectSessionRequestUseCase: RejectSessionRequestUseCase;
  private getSessionDetailsUseCase: GetSessionDetailsUseCase;
  private getSessionRequestDetailsUseCase: GetSessionRequestDetailsUseCase;
  private getScheduledSessionsUseCase: GetScheduledSessionsUseCase;
  private getScheduledSessionDetailsUseCase: GetScheduledSessionDetailsUseCase;
  private getDeveloperUnavailableSlotsUseCase: GetDeveloperUnavailableSlotsUseCase;
  private getSessionHistoryUseCase: GetSessionHistoryUseCase;
  private rateSessionUseCase: RateSessionUseCase;
  private getDeveloperSessionHistoryUseCase: GetDeveloperSessionHistoryUseCase;
  private getDeveloperSessionHistoryDetailsUseCase: GetDeveloperSessionHistoryDetailsUseCase;
  private startSessionUseCase: StartSessionUseCase;
  

  constructor(
    private sessionRepository: SessionRepository,
    private mailService: MailService,
    private userRepository: UserRepository,
    private developerRepository: DeveloperRepository,
    private s3Service: S3Service,
    private notificationRepository: NotificationRepository,
    private socketService: SocketService,
    private notificationService: NotificationService,
    private developerSlotRepository: IDeveloperSlotRepository,
    private ratingRepository: IRatingRepository
    ) {
    this.createSessionUseCase = new CreateSessionUseCase(sessionRepository, userRepository, developerRepository, notificationService);
    this.getUserSessionsUseCase = new GetUserSessionsUseCase(sessionRepository);
    this.getUpcomingSessionsUseCase = new GetUpcomingSessionsUseCase(sessionRepository,s3Service);
    this.getSessionRequestsUseCase = new GetSessionRequestsUseCase(sessionRepository,s3Service);
    this.acceptSessionRequestUseCase = new AcceptSessionRequestUseCase(
      sessionRepository,
      notificationService,
      socketService
    );
    this.rejectSessionRequestUseCase = new RejectSessionRequestUseCase(sessionRepository, notificationService)
    this.getSessionDetailsUseCase = new GetSessionDetailsUseCase(sessionRepository, s3Service, ratingRepository);
    this.getSessionRequestDetailsUseCase = new GetSessionRequestDetailsUseCase(sessionRepository, s3Service)
    this.getScheduledSessionsUseCase = new GetScheduledSessionsUseCase(sessionRepository, s3Service);
    this.getScheduledSessionDetailsUseCase = new GetScheduledSessionDetailsUseCase(sessionRepository, s3Service);
    this.getDeveloperUnavailableSlotsUseCase = new GetDeveloperUnavailableSlotsUseCase(developerSlotRepository);
    this.getSessionHistoryUseCase = new GetSessionHistoryUseCase(sessionRepository, s3Service);
    this.rateSessionUseCase = new RateSessionUseCase(
      ratingRepository,
      sessionRepository,
      notificationService
    );
    this.getDeveloperSessionHistoryUseCase = new GetDeveloperSessionHistoryUseCase(sessionRepository);
    this.getDeveloperSessionHistoryDetailsUseCase = new GetDeveloperSessionHistoryDetailsUseCase(sessionRepository, s3Service);
    this.startSessionUseCase = new StartSessionUseCase(sessionRepository, socketService);
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getUpcomingSessions(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', StatusCodes.
        UNAUTHORIZED);
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { sessions, pagination } = await this.getUpcomingSessionsUseCase.execute(userId, page, limit);
      return res.status(StatusCodes.OK).json({
        success: true,  
        data: sessions,
        pagination
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      }); 
    }
  }


  getSessionRequests = async (req: Request, res: Response) => {
    try {
      const developerId = req.userId;
      
      if (!developerId) {
        throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED, StatusCodes.BAD_REQUEST);
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      }); 
    }  
  }

  async getSessionRequestDetails (req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await this.getSessionRequestDetailsUseCase.execute(sessionId);
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      }); 
    }  
  }

  getScheduledSessions = async (req: Request, res: Response) => {
    try {
      const developerId = req.userId;
      
      if (!developerId) {
        throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED, StatusCodes.BAD_REQUEST);
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5; 

      const result = await this.getScheduledSessionsUseCase.execute(developerId, page, limit);

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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  getScheduledSessionDetails = async (req: Request, res: Response) => {
    try {
      const developerId = req.userId;
      const { sessionId } = req.params;
      
      if (!developerId) {
        throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED, StatusCodes.BAD_REQUEST);
      }
      
      if (!sessionId) {
        throw new AppError('Session ID is required', StatusCodes.BAD_REQUEST);
      }

      const session = await this.getScheduledSessionDetailsUseCase.execute(sessionId, developerId);

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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getUnavailableSlots(req: Request, res: Response) {
    try {
      const { developerId, date } = req.query;

      if (!developerId || !date) {
        throw new AppError('Developer ID and date are required', StatusCodes.BAD_REQUEST);
      }

      const parsedDate = new Date(date as string);
      if (isNaN(parsedDate.getTime())) {
        throw new AppError('Invalid date format', StatusCodes.BAD_REQUEST);
      }

      const unavailableSlots = await this.getDeveloperUnavailableSlotsUseCase.execute(
        developerId as string,
        parsedDate
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: unavailableSlots
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getSessionHistory(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', StatusCodes.
        UNAUTHORIZED);
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { sessions, pagination } = await this.getSessionHistoryUseCase.execute(userId, page, limit);
      return res.status(StatusCodes.OK).json({
        success: true,
        data: sessions,
        pagination
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }


  async rateSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const userId = req.userId;
      const { rating, feedback } = req.body;
      
      if (!sessionId || !userId) {
        throw new AppError('Session ID and user ID are required', StatusCodes.BAD_REQUEST);
      }
      
      if (!rating || rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', StatusCodes.BAD_REQUEST);
      }

      const ratingData = await this.rateSessionUseCase.execute({
        userId,
        sessionId,
        rating,
        comment: feedback
      });
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: ratingData
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  async updateRating(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const userId = req.userId;
      const { rating, feedback } = req.body;
      
      if (!sessionId || !userId) {
        throw new AppError('Session ID and user ID are required', StatusCodes.BAD_REQUEST);
      }
      
      if (!rating || rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', StatusCodes.BAD_REQUEST);
      }
  
      const ratingData = await this.rateSessionUseCase.execute({
        userId,
        sessionId,
        rating,
        comment: feedback,
        isUpdate: true
      });
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: ratingData
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  getDeveloperSessionHistory = async (req: Request, res: Response) => {
    try {
      const developerId = req.userId;
      if (!developerId) {
        throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED, StatusCodes.BAD_REQUEST);
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const search = (req.query.search as string) || '';
      const result = await this.getDeveloperSessionHistoryUseCase.execute(developerId, page, limit, search);
      res.status(StatusCodes.OK).json({ success: true, ...result });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  };

  getDeveloperSessionHistoryDetails = async (req: Request, res: Response) => {
    try {
      const developerId = req.userId;
      const { sessionId } = req.params;
      if (!developerId || !sessionId) {
        throw new AppError('Developer ID and Session ID are required', StatusCodes.BAD_REQUEST);
      }
      const session = await this.getDeveloperSessionHistoryDetailsUseCase.execute(developerId, sessionId);
      if (!session) {
        return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Session not found' });
      }
      res.status(StatusCodes.OK).json({ success: true, data: session });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  };

  async startSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        throw new AppError('Session ID is required', StatusCodes.BAD_REQUEST);
      }

      await this.startSessionUseCase.execute(sessionId);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Session started successfully'
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
        message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }
}
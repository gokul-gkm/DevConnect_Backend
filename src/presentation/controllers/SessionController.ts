import { Request, Response } from 'express';
import { AppError } from '@/domain/errors/AppError';
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from '@/utils/constants';

import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { IMailService } from '@/domain/interfaces/IMailService';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { IDeveloperRepository } from '@/domain/interfaces/IDeveloperRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { IRatingRepository } from '@/domain/interfaces/IRatingRepository';
import { ISocketService } from '@/domain/interfaces/ISocketService';
import { INotificationService } from '@/domain/interfaces/INotificationService';
import { IDeveloperSlotRepository } from '@/domain/interfaces/IDeveloperSlotRepository';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';

import { CreateSessionUseCase } from '@/application/useCases/implements/user/session/CreateSessionUseCase';
import { GetUserSessionsUseCase } from '@/application/useCases/implements/user/session/GetUserSessionsUseCase';
import { GetUpcomingSessionsUseCase } from '@/application/useCases/implements/user/session/GetUpcomingSessionsUseCase';
import { GetSessionRequestsUseCase } from '@/application/useCases/implements/developer/sessions/GetSessionRequestsUseCase';
import { AcceptSessionRequestUseCase } from '@/application/useCases/implements/developer/sessions/AcceptSessionRequestUseCase';
import { RejectSessionRequestUseCase } from '@/application/useCases/implements/developer/sessions/RejectSessionRequestUseCase';
import { StatusCodes } from 'http-status-codes';
import { GetSessionDetailsUseCase } from '@/application/useCases/implements/user/session/GetSessionDetailsUseCase';
import { GetSessionRequestDetailsUseCase } from '@/application/useCases/implements/developer/sessions/GetSessionRequestDetailsUseCase';
import { GetScheduledSessionsUseCase } from '@/application/useCases/implements/developer/sessions/GetScheduledSessionsUseCase';
import { GetScheduledSessionDetailsUseCase } from '@/application/useCases/implements/developer/sessions/GetScheduledSessionDetailsUseCase';
import { GetDeveloperUnavailableSlotsUseCase } from '@/application/useCases/implements/user/availability/GetDeveloperUnavailableSlotsUseCase';
import { GetSessionHistoryUseCase } from '@/application/useCases/implements/user/session/GetSessionHistoryUseCase';
import { RateSessionUseCase } from '@/application/useCases/implements/user/rating/RateSessionUseCase';
import { GetDeveloperSessionHistoryUseCase } from '@/application/useCases/implements/developer/sessions/GetDeveloperSessionHistoryUseCase';
import { GetDeveloperSessionHistoryDetailsUseCase } from '@/application/useCases/implements/developer/sessions/GetDeveloperSessionHistoryDetailsUseCase';
import { StartSessionUseCase } from '@/application/useCases/implements/developer/sessions/StartSessionUseCase';
import { CancelSessionUseCase } from '@/application/useCases/implements/user/session/CancelSessionUseCase';

import { ICreateSessionUseCase } from '@/application/useCases/interfaces/user/session/ICreateSessionUseCase';
import { IGetUserSessionsUseCase } from '@/application/useCases/interfaces/user/session/IGetUserSessionsUseCase';
import { IGetUpcomingSessionsUseCase } from '@/application/useCases/interfaces/user/session/IGetUpcomingSessionsUseCase';
import { IGetSessionRequestsUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetSessionRequestsUseCase';
import { IAcceptSessionRequestUseCase } from '@/application/useCases/interfaces/developer/sessions/IAcceptSessionRequestUseCase';
import { IRejectSessionRequestUseCase } from '@/application/useCases/interfaces/developer/sessions/IRejectSessionRequestUseCase';
import { IGetSessionDetailsUseCase } from '@/application/useCases/interfaces/user/session/IGetSessionDetailsUseCase';
import { IGetSessionRequestDetailsUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetSessionRequestDetailsUseCase';
import { IGetScheduledSessionsUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetScheduledSessionsUseCase';
import { IGetScheduledSessionDetailsUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetScheduledSessionDetailsUseCase';
import { IGetDeveloperUnavailableSlotsUseCase } from '@/application/useCases/interfaces/user/availability/IGetDeveloperUnavailableSlotsUseCase';
import { IGetSessionHistoryUseCase } from '@/application/useCases/interfaces/user/session/IGetSessionHistoryUseCase';
import { IRateSessionUseCase } from '@/application/useCases/interfaces/user/rating/IRateSessionUseCase';
import { IGetDeveloperSessionHistoryUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetDeveloperSessionHistoryUseCase';
import { IGetDeveloperSessionHistoryDetailsUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetDeveloperSessionHistoryDetailsUseCase';
import { IStartSessionUseCase } from '@/application/useCases/interfaces/developer/sessions/IStartSessionUseCase';
import { ICancelSessionUseCase } from '@/application/useCases/interfaces/user/session/ICancelSessionUseCase';


export class SessionController {
  private _createSessionUseCase: ICreateSessionUseCase;
  private _getUserSessionsUseCase: IGetUserSessionsUseCase;
  private _getUpcomingSessionsUseCase: IGetUpcomingSessionsUseCase;
  private _getSessionRequestsUseCase: IGetSessionRequestsUseCase;
  private _acceptSessionRequestUseCase: IAcceptSessionRequestUseCase;
  private _rejectSessionRequestUseCase: IRejectSessionRequestUseCase;
  private _getSessionDetailsUseCase: IGetSessionDetailsUseCase;
  private _getSessionRequestDetailsUseCase: IGetSessionRequestDetailsUseCase;
  private _getScheduledSessionsUseCase: IGetScheduledSessionsUseCase;
  private _getScheduledSessionDetailsUseCase: IGetScheduledSessionDetailsUseCase;
  private _getDeveloperUnavailableSlotsUseCase: IGetDeveloperUnavailableSlotsUseCase;
  private _getSessionHistoryUseCase: IGetSessionHistoryUseCase;
  private _rateSessionUseCase: IRateSessionUseCase;
  private _getDeveloperSessionHistoryUseCase: IGetDeveloperSessionHistoryUseCase;
  private _getDeveloperSessionHistoryDetailsUseCase: IGetDeveloperSessionHistoryDetailsUseCase;
  private _startSessionUseCase: IStartSessionUseCase;
  private _cancelSessionUseCase: ICancelSessionUseCase;
  

  constructor(
    private _sessionRepository: ISessionRepository,
    private _mailService: IMailService,
    private _userRepository: IUserRepository,
    private _developerRepository: IDeveloperRepository,
    private _s3Service: IS3Service,
    private _notificationRepository: INotificationRepository,
    private _socketService: ISocketService,
    private _notificationService: INotificationService,
    private _developerSlotRepository: IDeveloperSlotRepository,
    private _ratingRepository: IRatingRepository,
    private _walletRepository: IWalletRepository
    ) {
    this._createSessionUseCase = new CreateSessionUseCase(_sessionRepository, _userRepository, _developerRepository, _notificationService);
    this._getUserSessionsUseCase = new GetUserSessionsUseCase(_sessionRepository);
    this._getUpcomingSessionsUseCase = new GetUpcomingSessionsUseCase(_sessionRepository,_s3Service);
    this._getSessionRequestsUseCase = new GetSessionRequestsUseCase(_sessionRepository,_s3Service);
    this._acceptSessionRequestUseCase = new AcceptSessionRequestUseCase(
      _sessionRepository,
      _notificationService,
      _socketService
    );
    this._rejectSessionRequestUseCase = new RejectSessionRequestUseCase(_sessionRepository, _notificationService)
    this._getSessionDetailsUseCase = new GetSessionDetailsUseCase(_sessionRepository, _s3Service, _ratingRepository);
    this._getSessionRequestDetailsUseCase = new GetSessionRequestDetailsUseCase(_sessionRepository, _s3Service)
    this._getScheduledSessionsUseCase = new GetScheduledSessionsUseCase(_sessionRepository, _s3Service);
    this._getScheduledSessionDetailsUseCase = new GetScheduledSessionDetailsUseCase(_sessionRepository, _s3Service);
    this._getDeveloperUnavailableSlotsUseCase = new GetDeveloperUnavailableSlotsUseCase(_developerSlotRepository);
    this._getSessionHistoryUseCase = new GetSessionHistoryUseCase(_sessionRepository, _s3Service);
    this._rateSessionUseCase = new RateSessionUseCase(
      _ratingRepository,
      _sessionRepository,
      _notificationService
    );
    this._getDeveloperSessionHistoryUseCase = new GetDeveloperSessionHistoryUseCase(_sessionRepository);
    this._getDeveloperSessionHistoryDetailsUseCase = new GetDeveloperSessionHistoryDetailsUseCase(_sessionRepository, _s3Service);
    this._startSessionUseCase = new StartSessionUseCase(_sessionRepository, _socketService);
    this._cancelSessionUseCase = new CancelSessionUseCase(_sessionRepository, _notificationService, _walletRepository)
  }


  async createSession(req: Request, res: Response) {
    try {
      const session = await this._createSessionUseCase.execute({
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
  
      const bookedSlots = await this._sessionRepository.getBookedSlots(
        developerId as string,
        new Date(date as string)
      );
  
      const formattedSlots = bookedSlots.map((slot: any) => ({
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

      const sessions = await this._getUserSessionsUseCase.execute(userId);

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
      const { sessions, pagination } = await this._getUpcomingSessionsUseCase.execute(userId, page, limit);
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

      const result = await this._getSessionRequestsUseCase.execute(developerId, page, limit);

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
      const session = await this._acceptSessionRequestUseCase.execute(sessionId, developerId);

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

      const session = await this._rejectSessionRequestUseCase.execute(
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
      const session = await this._getSessionDetailsUseCase.execute(sessionId);
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
      const session = await this._getSessionRequestDetailsUseCase.execute(sessionId);
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

      const result = await this._getScheduledSessionsUseCase.execute(developerId, page, limit);

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

      const session = await this._getScheduledSessionDetailsUseCase.execute(sessionId, developerId);

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

      const unavailableSlots = await this._getDeveloperUnavailableSlotsUseCase.execute(
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
      const { sessions, pagination } = await this._getSessionHistoryUseCase.execute(userId, page, limit);
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

      const ratingData = await this._rateSessionUseCase.execute({
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
  
      const ratingData = await this._rateSessionUseCase.execute({
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
      const result = await this._getDeveloperSessionHistoryUseCase.execute(developerId, page, limit, search);
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
      const session = await this._getDeveloperSessionHistoryDetailsUseCase.execute(developerId, sessionId);
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

      await this._startSessionUseCase.execute(sessionId);

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

  async cancelSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const userId = req.userId;
      const { reason } = req.body;

      if (!sessionId || !userId) {
        throw new AppError('Session ID and user ID are required', StatusCodes.BAD_REQUEST);
      }
  
      await this._cancelSessionUseCase.execute(sessionId, userId, reason);
  
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Session cancelled successfully'
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
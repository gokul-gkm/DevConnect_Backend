import { Request, Response } from 'express';
import { AppError } from '@/domain/errors/AppError';
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from '@/utils/constants';
import { StatusCodes } from 'http-status-codes';
import { inject } from 'inversify';
import { TYPES } from '@/types/types';

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
import { IGetBookedSlotsUseCase } from '@/application/useCases/interfaces/user/session/IGetBookedSlotsUseCase';


export class SessionController {

  constructor(
    @inject(TYPES.ICreateSessionUseCase)
    private _createSessionUseCase: ICreateSessionUseCase,

    @inject(TYPES.IGetUserSessionsUseCase)
    private _getUserSessionsUseCase: IGetUserSessionsUseCase,

    @inject(TYPES.IGetUpcomingSessionsUseCase)
    private _getUpcomingSessionsUseCase: IGetUpcomingSessionsUseCase,

    @inject(TYPES.IGetSessionRequestsUseCase)
    private _getSessionRequestsUseCase: IGetSessionRequestsUseCase,

    @inject(TYPES.IAcceptSessionRequestUseCase)
    private _acceptSessionRequestUseCase: IAcceptSessionRequestUseCase,

    @inject(TYPES.IRejectSessionRequestUseCase)
    private _rejectSessionRequestUseCase: IRejectSessionRequestUseCase,

    @inject(TYPES.IGetSessionDetailsUseCase)
    private _getSessionDetailsUseCase: IGetSessionDetailsUseCase,

    @inject(TYPES.IGetSessionRequestDetailsUseCase)
    private _getSessionRequestDetailsUseCase: IGetSessionRequestDetailsUseCase,

    @inject(TYPES.IGetScheduledSessionsUseCase)
    private _getScheduledSessionsUseCase: IGetScheduledSessionsUseCase,

    @inject(TYPES.IGetScheduledSessionDetailsUseCase)
    private _getScheduledSessionDetailsUseCase: IGetScheduledSessionDetailsUseCase,

    @inject(TYPES.IGetDeveloperUnavailableSlotsUseCase)
    private _getDeveloperUnavailableSlotsUseCase: IGetDeveloperUnavailableSlotsUseCase,

    @inject(TYPES.IGetSessionHistoryUseCase)
    private _getSessionHistoryUseCase: IGetSessionHistoryUseCase,

    @inject(TYPES.IRateSessionUseCase)
    private _rateSessionUseCase: IRateSessionUseCase,

    @inject(TYPES.IGetDeveloperSessionHistoryUseCase)
    private _getDeveloperSessionHistoryUseCase: IGetDeveloperSessionHistoryUseCase,

    @inject(TYPES.IGetDeveloperSessionHistoryDetailsUseCase)
    private _getDeveloperSessionHistoryDetailsUseCase: IGetDeveloperSessionHistoryDetailsUseCase,

    @inject(TYPES.IStartSessionUseCase)
    private _startSessionUseCase: IStartSessionUseCase,

    @inject(TYPES.ICancelSessionUseCase)
    private _cancelSessionUseCase: ICancelSessionUseCase,

    @inject(TYPES.IGetBookedSlotsUseCase)
    private _getBookedSlotsUseCase: IGetBookedSlotsUseCase
  ) {}


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
      
      // if (!developerId || !date) {
      //   throw new AppError('Developer ID and date are required', StatusCodes.BAD_REQUEST);
      // }
  
      // const bookedSlots = await this._sessionRepository.getBookedSlots(
      //   developerId as string,
      //   new Date(date as string)
      // );
  
      // const formattedSlots = bookedSlots.map((slot: any) => ({
      //   startTime: slot.startTime,
      //   duration: slot.duration
      // }));

      const slots = await this._getBookedSlotsUseCase.execute(
        developerId as string,
        date as string
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: slots,
      });
  
      // return res.status(StatusCodes.OK).json({
      //   success: true,
      //   data: formattedSlots
      // });
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
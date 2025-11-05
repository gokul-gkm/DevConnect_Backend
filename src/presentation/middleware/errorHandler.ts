import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { MulterError } from 'multer';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { HTTP_STATUS_MESSAGES } from '../../utils/constants';
import { MongooseValidationError, MongoServerError } from '@/infrastructure/errors/DatabaseErrors';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.statusCode
    });
    return;
  }


  if (err instanceof MulterError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message,
      code: 'FILE_UPLOAD_ERROR'
    });
    return;
  }

  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors: err.errors,
      code: 'VALIDATION_ERROR'
    });
    return;
  }

  if (err.name === 'MongoServerError') {
    const mongoErr = err as MongoServerError;
    if (mongoErr.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: 'Duplicate entry found',
        field: Object.keys(mongoErr.keyPattern ?? {})[0],
        code: 'DUPLICATE_ERROR',
      });
      return;
    }
  }

  if (err.name === 'ValidationError') {
    const validationErr = err as MongooseValidationError;
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(validationErr.errors ?? {}).map((e) => ({
        field: e.path,
        message: e.message,
      })),
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_SERVER_ERROR'
  });
  return;
};
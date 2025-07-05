import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { MulterError } from 'multer';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { HTTP_STATUS_MESSAGES } from './constants';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
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

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: 'Duplicate entry found',
      field: Object.keys((err as any).keyPattern)[0],
      code: 'DUPLICATE_ERROR'
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors: Object.values((err as any).errors).map((err: any) => ({
        field: err.path,
        message: err.message
      })),
      code: 'VALIDATION_ERROR'
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
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "@/domain/errors/AppError";

export function handleControllerError(
  error: unknown,
  res: Response,
  defaultMessage: string
) {
  const message = error instanceof AppError ? error.message : defaultMessage;
  const statusCode =
    error instanceof AppError
      ? error.statusCode
      : StatusCodes.INTERNAL_SERVER_ERROR;

  return res.status(statusCode).json({ success: false, message });
}

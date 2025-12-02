import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';

function hasMessage(error: unknown): error is { message: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    );
}

function hasStatusCode(error: unknown): error is { statusCode: number } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof (error as { statusCode: unknown }).statusCode === 'number'
    );
}

export function handleError(
    error: unknown,
    defaultMessage: string = 'An error occurred',
    defaultStatusCode: number = StatusCodes.INTERNAL_SERVER_ERROR
): never {
    if (error instanceof AppError) {
        throw error;
    }

    const message = hasMessage(error)
        ? error.message
        : error instanceof Error
        ? error.message
        : defaultMessage;

    const statusCode = hasStatusCode(error)
        ? error.statusCode
        : defaultStatusCode;

    throw new AppError(message, statusCode);
}
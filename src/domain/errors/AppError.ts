export class AppError extends Error {
    constructor(
      public readonly message: string,
      public readonly statusCode: number = 400
    ) {
      super(message);
      this.name = 'AppError';
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, AppError);
      }
    }
  }
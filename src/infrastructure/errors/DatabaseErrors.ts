export interface MongoServerError extends Error {
  code?: number;
  keyPattern?: Record<string, unknown>;
}

export interface MongooseValidationError extends Error {
  errors?: Record<string, { path: string; message: string }>;
}

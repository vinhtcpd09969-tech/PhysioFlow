export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly requiresVerification?: boolean;
  public readonly email?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, extra?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (extra) {
      Object.assign(this, extra);
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', extra?: Record<string, any>) {
    super(message, 400, true, extra);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', extra?: Record<string, any>) {
    super(message, 403, true, extra);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
  }
}

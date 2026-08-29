export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, errorCode: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errorCode = 'BAD_REQUEST'): ApiError {
    return new ApiError(400, message, errorCode);
  }

  static unauthorized(message = 'Not authenticated', errorCode = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message = 'Not authorized', errorCode = 'FORBIDDEN'): ApiError {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND'): ApiError {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message: string, errorCode = 'CONFLICT'): ApiError {
    return new ApiError(409, message, errorCode);
  }

  static internal(message = 'Something went wrong', errorCode = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(500, message, errorCode, false);
  }
}

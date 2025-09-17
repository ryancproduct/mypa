import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let errorCode = 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = error.message;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
    statusCode = 401;
    errorMessage = 'Unauthorized';
    errorCode = 'UNAUTHORIZED';
  } else if (error.message.includes('rate limit')) {
    statusCode = 429;
    errorMessage = 'Too Many Requests';
    errorCode = 'RATE_LIMIT_EXCEEDED';
  } else if (error.message.includes('API key') || error.message.includes('authentication')) {
    statusCode = 401;
    errorMessage = 'Authentication failed';
    errorCode = 'AUTH_FAILED';
  } else if (error.message.includes('provider not initialized')) {
    statusCode = 503;
    errorMessage = 'AI service temporarily unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  } else if (error.message.includes('Anthropic') || error.message.includes('OpenAI')) {
    statusCode = 502;
    errorMessage = 'AI provider error';
    errorCode = 'PROVIDER_ERROR';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorMessage = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message: errorMessage,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message
    })
  });
};

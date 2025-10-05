/**
 * Error handling middleware
 */

import { NextFunction, Request, Response } from 'express';
import { OmnistreamError } from '../../core/errors.js';
import { logger } from '../../utils/logger.js';

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof OmnistreamError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      },
    });
    return;
  }

  // Unknown error
  res.status(500).json({
    success: false,
    error: {
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
  });
}

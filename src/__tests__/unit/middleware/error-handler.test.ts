/**
 * Unit tests for error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../api/middleware/error-handler.js';
import {
  OmnistreamError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  PlatformError,
} from '../../../core/errors.js';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    req = {
      path: '/test',
      method: 'GET',
    };

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    res = {
      status: statusMock,
    };

    next = jest.fn();
  });

  it('should handle ValidationError with 400 status', () => {
    const error = new ValidationError('Invalid input');

    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        error: 'ValidationError',
        message: 'Invalid input',
        statusCode: 400,
      }),
    });
  });

  it('should handle AuthenticationError with 401 status', () => {
    const error = new AuthenticationError('Invalid credentials');

    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        error: 'AuthenticationError',
        message: 'Invalid credentials',
        statusCode: 401,
      }),
    });
  });

  it('should handle NotFoundError with 404 status', () => {
    const error = new NotFoundError('Resource not found');

    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        error: 'NotFoundError',
        message: 'Resource not found',
        statusCode: 404,
      }),
    });
  });

  it('should handle PlatformError with custom status', () => {
    const error = new PlatformError('YouTube', 'API rate limited', 429);

    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        error: 'PlatformError',
        message: 'YouTube: API rate limited',
        statusCode: 429,
      }),
    });
  });

  it('should handle OmnistreamError with details', () => {
    const error = new OmnistreamError('Error with details', 500, {
      code: 'ERR_001',
      extra: 'info',
    });

    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        error: 'OmnistreamError',
        message: 'Error with details',
        statusCode: 500,
        details: { code: 'ERR_001', extra: 'info' },
      }),
    });
  });

  it('should handle unknown errors with 500 status', () => {
    const error = new Error('Unexpected error');

    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        statusCode: 500,
      },
    });
  });

  it('should not expose error details for unknown errors', () => {
    const error = new Error('Internal database error: password=secret123');

    errorHandler(error, req as Request, res as Response, next);

    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        statusCode: 500,
      },
    });

    // Ensure the actual error message is not exposed
    const call = jsonMock.mock.calls[0][0];
    expect(call.error.message).not.toContain('password');
    expect(call.error.message).not.toContain('secret123');
  });
});

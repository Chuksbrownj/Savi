import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId: string;
}

/**
 * Global HTTP exception filter.
 * Returns a consistent error envelope for all exceptions.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let error: string;
    let message: string | string[];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.message;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp['message'] as string | string[]) ?? exception.message;
        error = (resp['error'] as string) ?? exception.message;
      } else {
        message = exception.message;
        error = exception.message;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      message = 'An unexpected error occurred';
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    const requestId = (request.headers['x-request-id'] as string) ?? 'unknown';

    const body: ErrorResponse = {
      statusCode,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId,
    };

    response.status(statusCode).json(body);
  }
}

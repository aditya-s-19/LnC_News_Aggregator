import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class UnhandledExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnhandledExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception instanceof HttpException) {
      // Let intended exceptions pass through exactly as-is
      const status = exception.getStatus();
      const resBody = exception.getResponse();

      response.status(status).json({
        statusCode: status,
        message:
          typeof resBody === 'string'
            ? resBody
            : (resBody as any).message || 'Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    // Catch all unhandled/unexpected errors here
    console.error(exception);

    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

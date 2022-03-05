import { Catch, ArgumentsHost, Logger } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private logger = new Logger("AllExceptionsFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    // console.log(exception);

    const ctx = host.switchToHttp();

    const request = ctx.getRequest<Request>();

    const errorLog = {
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      exception: exception,
    };
    this.logger.error(`${request.method} ${request.url}`, errorLog);

    super.catch(exception, host);
  }
}

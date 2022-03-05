import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Socket } from "socket.io";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { ReflectKey } from "../constants/reflect-keys";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("ResponseLogger");
  constructor(private reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();

    let endpoint;
    const type = context.getType();
    if (type === "http") {
      const request = context.switchToHttp().getRequest() as Request;
      endpoint = `<${request.method} ${request.url}>`;
    } else if (type === "ws") {
      const event = this.reflector.get<string>(
        ReflectKey.WS_EVENT,
        context.getHandler()
      );
      const namespace = (context.switchToWs().getClient() as Socket).nsp.name;
      endpoint = `<${namespace} ${event}>`;
    }

    return next.handle().pipe(
      tap((v) => {
        const elapsedTime = Date.now() - now;

        this.logger.log({
          message: `${endpoint} ${elapsedTime}ms`,
          // response: v,
        });
      })
    );
  }
}

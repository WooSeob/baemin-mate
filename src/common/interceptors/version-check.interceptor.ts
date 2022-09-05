import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import VersionChecker from "../version/VersionChecker";
import MinerVersionCheckPolicy from "../version/policy/MinerVersionCheckPolicy";

@Injectable()
export class VersionCheckInterceptor implements NestInterceptor {
  private readonly logger = new Logger("VersionCheckInterceptor");

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === "http") {
      const request = context.switchToHttp().getRequest() as Request;

      const versionChecker = this.getClientVersion(request);
      if (!versionChecker) {
        throw new BadRequestException("클라이언트 버전 정보가 없습니다.");
      }

      versionChecker.check();
    }

    return next.handle().pipe(tap((v) => {}));
  }

  private getClientVersion(request: Request): VersionChecker | undefined {
    const value = request.header("Client-Version");
    if (!value) return undefined;

    try {
      const [type, version] = value.split(" ");
      return new VersionChecker(new MinerVersionCheckPolicy(), type, version);
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }
}

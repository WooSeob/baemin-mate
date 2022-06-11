import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth.service";
import { Request } from "express";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private logger = new Logger("JwtAuthGuard");

  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.getBearerToken(request);
    if (!token) {
      this.logger.error("토큰이 없습니다.", request.header);
      throw new UnauthorizedException("인증 토큰이 없습니다.");
    }

    const payload = await this.authService.validate(token);
    if (!payload) {
      this.logger.error("페이로드가 없습니다.", request.header);
      throw new UnauthorizedException("유효하지 않은 토큰입니다.");
    }

    Reflect.set(request, "user", payload);
    return true;
  }

  private getBearerToken(request: Request): string | undefined {
    const value = request.header("Authorization");
    if (!value) return undefined;

    const [tokenType, token] = value.split(" ");
    if (tokenType.toUpperCase() !== "BEARER") {
      return undefined;
    }

    return token;
  }
}

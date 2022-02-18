import {
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Request } from "express";
import { AuthService } from "../auth.service";
import { UserService } from "../../user/user.service";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private logger = new Logger("SessionAuthGuard");

  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    let token = request.headers.authorization;
    this.logger.log(token);
    if (token.split(" ").length > 1) {
      token = token.split(" ")[1];
    }

    try {
      const user = await this.authService.validate(token);
      Reflect.set(request, "user", user);
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }
}

import {
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Request } from "express";
import axios, { AxiosResponse } from "axios";
import { User } from "../../user/entity/user.entity";
import { UserService } from "../../user/user.service";
import { NaverAuthResponse } from "../interface/NaverAuthResponse";

@Injectable()
export class NaverAuthGuard implements CanActivate {
  private logger: Logger = new Logger("NaverAuthGuard");

  constructor(
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    // console.log(request);
    let token = request.headers.authorization;

    if (!token) {
      console.log("token invalid");
      return false;
    }
    // if (!token || token.split(" ").length < 2) {
    //   return false;
    // }
    if (token.split(" ").length > 1) {
      token = token.split(" ")[1];
    }

    const user = await this.validate(token);

    if (!user) {
      console.log("user invalid");
      return false;
    }

    this.logger.log(`${user.name}(${user.id}) is authenticated`);
    Reflect.set(request, "user", user);
    return true;
  }
  private async validate(token: string): Promise<User> {
    let res: AxiosResponse;
    try {
      res = await axios.get("https://openapi.naver.com/v1/nid/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.log(e);
      return null;
    }

    const info: NaverAuthResponse = res.data.response;
    const found = await this.userService.findUserById(info.id);
    if (!found) {
      // return this.userService.createUserByNaver(
      //   info.id,
      //   info.name,
      //   info.mobile_e164
      // );
    }
    return found;
  }
}

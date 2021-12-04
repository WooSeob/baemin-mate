import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { Request } from "express";
import { AuthService } from "../auth.service";
import axios, { AxiosResponse } from "axios";
import { User } from "../../user/entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

interface NaverAuthResponse {
  id: string;
  mobile: string;
  mobile_e164: string;
  name: string;
}

@Injectable()
export class NaverAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    // console.log(request);
    let token = request.headers.authorization;

    if (!token) {
      console.log("token anvalid");
      return false;
    }
    // if (!token || token.split(" ").length < 2) {
    //   return false;
    // }
    if (token.split(" ").length > 1) {
      token = token.split(" ")[1];
    }

    console.log(token);
    const user = await this.validate(token);
    console.log(user);

    if (!user) {
      console.log("user anvalid");
      return false;
    }
    // request.user = User;
    // console.log(user);
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
    console.log(info);
    const found = await this.userRepository.findOne({ id: info.id });
    if (!found) {
      // console.log(info);
      const newUser = new User();
      newUser.id = info.id;
      newUser.name = info.name;
      newUser.phone = info.mobile_e164;
      await this.userRepository.save(newUser);
      return newUser;
    }
    return found;
  }
}

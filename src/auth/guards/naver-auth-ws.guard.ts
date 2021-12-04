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
export class NaverAuthGuardWs implements CanActivate {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    console.log(request);

    const token = request.handshake.auth.token;
    console.log(token);
    if (!token || token.split(" ").length < 2) {
      return false;
    }

    const user = await this.validate(token.split(" ")[1]);
    console.log(user);

    if (!user) {
      return false;
    }
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
      return null;
    }

    const info: NaverAuthResponse = res.data.response;
    const found = await this.userRepository.findOne({ id: info.id });
    if (!found) {
      console.log(info);
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

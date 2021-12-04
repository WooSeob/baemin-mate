import { ConsoleLogger, Inject, Injectable } from "@nestjs/common";
import { IUserContainer } from "../core/container/IUserContainer";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import axios, { AxiosResponse } from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../user/entity/user.entity";
import { Repository } from "typeorm";

interface NaverAuthResponse {
  id: string;
  mobile: string;
  mobile_e164: string;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>
  ) {}

  async validate(token: string): Promise<User> {
    const res: AxiosResponse = await axios.get(
      "https://openapi.naver.com/v1/nid/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // console.log(res.data);
    if (res.data.error) {
      console.log(res.data);
      throw null;
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

  login(loginDto: LoginDto) {
    // if (this.validate(loginDto)) {
    //   const userEntity = this.database.get(loginDto.userId);
    //   this.userContainer.push(
    //     new User(userEntity.id, userEntity.section, userEntity.manner)
    //   );
    //   return this.userContainer.findById(loginDto.userId).sessionId;
    // }
    // return null;
  }

  logout(logoutDto: LogoutDto) {
    // const user = this.userContainer.findById(logoutDto.userId);
    // if (!user) {
    //   return null;
    // }
    // if (logoutDto.sessionId != user.sessionId) {
    //   return null;
    // }
    // this.userContainer.delete(user);
  }

  // validate(loginDto: LoginDto) {
  //   if (this.database.has(loginDto.userId)) {
  //     const userEntity = this.database.get(loginDto.userId);
  //     if (loginDto.password === userEntity.password) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  verifySession(id, token) {
    // return (
    //   this.userContainer.findById(id) &&
    //   this.userContainer.findById(id).sessionId == token
    // );
    return true;
  }
}

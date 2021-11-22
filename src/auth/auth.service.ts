import { ConsoleLogger, Inject, Injectable } from "@nestjs/common";
import { IUserContainer } from "../core/container/IUserContainer";
import { SECTION, SectionType, User } from "../user/interfaces/user";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";

interface UserEntity {
  id: string;
  password: string;
  section: SectionType;
  manner: number;
}
@Injectable()
export class AuthService {
  private database: Map<string, UserEntity> = new Map();
  constructor(@Inject("IUserContainer") private userContainer: IUserContainer) {
    this.database.set("wooseob", {
      id: "wooseob",
      password: "qwer",
      section: SECTION.NARAE,
      manner: 35,
    });
    this.database.set("qwer", {
      id: "qwer",
      password: "qwer",
      section: SECTION.BIBONG,
      manner: 35,
    });
    this.database.set("gildong", {
      id: "gildong",
      password: "qwer",
      section: SECTION.HOYOEN,
      manner: 35,
    });
  }

  login(loginDto: LoginDto) {
    if (this.validate(loginDto)) {
      const userEntity = this.database.get(loginDto.userId);
      this.userContainer.push(new User(userEntity.id, userEntity.section, userEntity.manner));
      return this.userContainer.findById(loginDto.userId).sessionId;
    }
    return null;
  }

  logout(logoutDto: LogoutDto) {
    const user = this.userContainer.findById(logoutDto.userId);
    if (!user) {
      return null;
    }
    if (logoutDto.sessionId != user.sessionId) {
      return null;
    }
    this.userContainer.delete(user);
  }

  validate(loginDto: LoginDto) {
    if (this.database.has(loginDto.userId)) {
      const userEntity = this.database.get(loginDto.userId);
      if (loginDto.password === userEntity.password) {
        return true;
      }
    }
    return false;
  }

  verifySession(id, token) {
    return (
      this.userContainer.findById(id) && this.userContainer.findById(id).sessionId == token
    );
  }
}

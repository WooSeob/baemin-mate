import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserBuilder } from "./entity/user.entity";
import { Repository } from "typeorm";
import { OAuthUser } from "./entity/OAuthUser";
import { OAuthProvider } from "../auth/interface/OAuthProvider";
import EventEmitter from "events";
import { UserEvent } from "./const/UserEvent";

@Injectable()
export class UserService extends EventEmitter {
  private logger = new Logger("UserService");
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(OAuthUser) private oauthRepository: Repository<OAuthUser>
  ) {
    super();
  }

  override emit(eventName: string | symbol, ...args: any[]): boolean {
    this.logger.log({ message: "[UserEvent]", event: eventName, args: args });
    return super.emit(eventName, ...args);
  }

  async createUserByNaver(
    id: string,
    name: string,
    univId: number
  ): Promise<User> {
    const newUser = new User();
    newUser.name = name;
    newUser.verified = true;
    newUser.universityId = univId;
    const created = await this.userRepository.save(newUser);

    const oauthUser = new OAuthUser();
    oauthUser.id = id;
    oauthUser.provider = OAuthProvider.NAVER;
    oauthUser.user = created;
    await this.oauthRepository.save(oauthUser);
    this.emit(UserEvent.CREATED, created);
    return created;
  }

  async deleteUser(uid: string) {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.rooms", "participant")
      .leftJoinAndSelect("participant.room", "room")
      .where("user.id = :id", { id: uid })
      .andWhere("user.deletedAt IS NULL")
      .getOne();

    if (!user) {
      throw new NotFoundException("존재하지 않는 회원입니다.");
    }

    user.delete();
    await this.oauthRepository.delete({ user: user });
    await this.userRepository.save(user);
    this.emit(UserEvent.DELETED, user);
  }

  /**
   * id로 유저를 찾고
   * 없으면 name이 "(알수없음)" 으로 설정된 기본 유저를 반환합니다.
   * */
  async findUserOrUnknownIfNotExist(id: string): Promise<User> {
    //TODO async 최적화?
    const user = await this.findUserById(id);
    return user
      ? user
      : new UserBuilder().setId(id).setName("(알수없음)").build();
  }

  async findUserByOauthId(oauthId: string): Promise<User> {
    const oauthUser = await this.oauthRepository.findOne(oauthId);
    if (!oauthUser) {
      return undefined;
    }
    return oauthUser.user;
  }

  findUserById(id: string): Promise<User> {
    return this.userRepository.findOne({ id: id, deletedAt: null });
  }

  async verify(user: User) {
    user.verified = true;
    await this.userRepository.save(user);
  }

  async getJoinedRoomIds(userId: string) {
    //TODO 트랜잭션?

    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.rooms", "rooms")
      .where("user.id = :id", { id: userId })
      .andWhere("user.deletedAt IS NULL")
      .getOne();

    if (!user) {
      throw new NotFoundException("존재하지 않는 회원입니다.");
    }

    return user.rooms.map((participant) => participant.roomId);
  }
}

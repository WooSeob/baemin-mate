import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity, UserBuilder } from "./entity/user.entity";
import { Repository } from "typeorm";
import { UserOauthEntity } from "./entity/user-oauth.entity";
import { OAuthProvider } from "../auth/interface/OAuthProvider";
import EventEmitter from "events";
import { UserEvent } from "./const/UserEvent";
import { Builder } from "builder-pattern";
import { State } from "../room/entity/participant.entity";

@Injectable()
export class UserService extends EventEmitter {
  private logger = new Logger("UserService");
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserOauthEntity)
    private oauthRepository: Repository<UserOauthEntity>
  ) {
    super();
  }

  override emit(eventName: string | symbol, ...args: any[]): boolean {
    this.logger.log({ message: "[UserEvent]", event: eventName, args: args });
    return super.emit(eventName, ...args);
  }

  async createUser(
    id: string,
    name: string,
    univId: number,
    oauthProvider: OAuthProvider
  ): Promise<UserEntity> {
    const created = await this.userRepository.save(
      Builder(UserEntity).name(name).verified(true).universityId(univId).build()
    );

    await this.oauthRepository.save(
      Builder(UserOauthEntity)
        .id(id)
        .provider(oauthProvider)
        .user(created)
        .build()
    );

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
  async findUserOrUnknownIfNotExist(id: string): Promise<UserEntity> {
    //TODO async 최적화?
    const user = await this.findUserById(id);
    return user
      ? user
      : new UserBuilder().setId(id).setName("(알수없음)").build();
  }

  async findUserByOauthId(oauthId: string): Promise<UserEntity> {
    const oauthUser = await this.oauthRepository.findOne(oauthId);

    const asdf = await this.oauthRepository.find(undefined);
    this.logger.log(asdf);

    if (!oauthUser) {
      return undefined;
    }
    return oauthUser.user;
  }

  findUserById(id: string): Promise<UserEntity> {
    return this.userRepository.findOne({ id: id, deletedAt: null });
  }

  async verify(user: UserEntity) {
    user.verified = true;
    await this.userRepository.save(user);
  }

  async getParticipations(userId: string) {
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
    return user.rooms;
  }

  async getJoinedRoomIds(userId: string) {
    return (await this.getParticipations(userId))
      .filter((p) => p.state === State.JOINED)
      .map((participant) => participant.roomId);
  }
}

import { Inject, Injectable, Logger } from "@nestjs/common";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { CheckOrderDto } from "./dto/request/check-order.dto";
import { RoomState } from "./const/RoomState";
import { UserEntity } from "../user/entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, QueryRunner, Repository } from "typeorm";
import { RoomEntity, RoomRole } from "./entity/room.entity";
import { ParticipantEntity } from "./entity/participant.entity";
import { MenuEntity } from "./entity/menu.entity";
import { AddMenuDto } from "../user/dto/request/add-menu.dto";
import { UpdateMenuDto } from "../user/dto/request/update-menu.dto";

import { RoomBlackListReason } from "./entity/room-blacklist.entity";
import RoomVoteEntity, { RoomVoteType } from "./entity/room-vote.entity";
import KickVoteFactory from "./entity/Vote/KickVote/KickVoteFactory";
import ResetVoteFactory from "./entity/Vote/ResetVote/ResetVoteFactory";
import { RoomEventType } from "./const/RoomEventType";
import { EventEmitter } from "events";
import { UploadFileDto } from "../infra/s3/s3.service";
import { ImageFileEntity } from "./entity/image-file.entity";
import { RoomAccountEntity } from "./entity/room-account.entity";
import { UserService } from "../user/user.service";
import { UserEvent } from "../user/const/UserEvent";
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from "nest-winston";

//StrictEventEmitter<RoomEvents, RoomEvents>
@Injectable()
export class RoomService extends EventEmitter {
  private logger = new Logger("RoomService");
  constructor(
    public connection: Connection,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ParticipantEntity)
    private participantRepository: Repository<ParticipantEntity>,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
    @InjectRepository(ImageFileEntity)
    private imageFileRepository: Repository<ImageFileEntity>,
    @InjectRepository(RoomAccountEntity)
    private accountRepository: Repository<RoomAccountEntity>,
    private userService: UserService
  ) {
    super();

    userService.on(UserEvent.DELETED, async (user: UserEntity) => {
      for (const participant of user.rooms) {
        // 탈퇴 유저의 방들은 모두 비 활성 상태
        if (participant.role == RoomRole.PURCHASER) {
          const accountInfo = await this.accountRepository.findOne({
            roomId: participant.roomId,
          });

          if (!accountInfo) {
            continue;
          }

          accountInfo.softDelete();
          await this.accountRepository.save(accountInfo);
        }
      }
    });
  }

  override emit(eventName: string | symbol, ...args: any[]): boolean {
    this.logger.log({ message: "[RoomEvent]", event: eventName, args: args });
    return super.emit(eventName, ...args);
  }

  async clear() {
    const rooms = await this.roomRepository.find();
    const promises = [];
    for (const room of rooms) {
      promises.push(this.roomRepository.remove(room));
    }
    await Promise.all(promises);
    this.logger.warn("all rooms cleared");
  }

  async getRoomRole(
    roomId: string,
    userId: string
  ): Promise<RoomRole | undefined> {
    const participant = await this.participantRepository.findOne({
      roomId: roomId,
      userId: userId,
    });
    if (!participant) {
      return undefined;
    }
    return participant.role;
  }

  findRoomById(id: string): Promise<RoomEntity> {
    return this.roomRepository
      .createQueryBuilder("room")
      .leftJoinAndSelect("room.purchaser", "purchaser")
      .leftJoinAndSelect("room.participants", "participants")
      .leftJoinAndSelect("participants.user", "user")
      .leftJoinAndSelect("participants.menus", "menu")
      .where({ id: id })
      .getOne();
  }

  async getMenuById(id: string): Promise<MenuEntity> {
    return this.menuRepository.findOne(id);
  }

  getParticipants(room: RoomEntity): Promise<ParticipantEntity[]> {
    return this.participantRepository.find({ where: { room: room } });
  }

  getAccountInfo(rid: string): Promise<RoomAccountEntity> {
    return this.accountRepository.findOne({ roomId: rid });
  }
  // create
  // join
  // leave
  // kick
  // kick

  private checkAllReadyOrCanceled(
    prevState: RoomState,
    currentState: RoomState,
    roomId: string
  ) {
    if (prevState == RoomState.ALL_READY) {
      if (currentState == RoomState.PREPARE) {
        this.emit(RoomEventType.ALL_READY_CANCELED, roomId);
      }
    } else if (prevState == RoomState.PREPARE) {
      if (currentState == RoomState.ALL_READY) {
        this.emit(RoomEventType.ALL_READY, roomId);
      }
    }
  }
  private forwardEvent() {}
  // RoomService
  async joinRoom(roomId: string, userId: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("SERIALIZABLE");

    try {
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );
      const userWithRooms: UserEntity = await queryRunner.manager
        .createQueryBuilder(UserEntity, "user")
        .leftJoinAndSelect("user.rooms", "participation")
        .leftJoinAndSelect("participation.room", "room")
        .where("user.id = :id", { id: userId })
        .getOne();

      const prevState = room.phase;
      room.join(userWithRooms);

      const created = await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();

      this.emit(RoomEventType.USER_ENTER, roomId, userWithRooms.id);
      this.checkAllReadyOrCanceled(prevState, room.phase, roomId);

      return created;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createRoom(
    userId: string,
    createRoomDto: CreateRoomDto
  ): Promise<RoomEntity> {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let created;
    try {
      const userWithJoinedRooms: UserEntity = await queryRunner.manager
        .createQueryBuilder(UserEntity, "user")
        .leftJoinAndSelect("user.rooms", "participation")
        .leftJoinAndSelect("participation.room", "room")
        .where("user.id = :id", { id: userId })
        .getOne();

      created = await queryRunner.manager.save(
        RoomEntity.create(userWithJoinedRooms, createRoomDto)
      );

      await queryRunner.commitTransaction();
      this.emit(RoomEventType.CREATE, created);
      this.emit(RoomEventType.USER_ENTER, created.id, userId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return created;
  }

  async leaveRoom(roomId: string, userId: string) {
    // update room state? when?

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );
      const prevState = room.phase;

      const toRemove: ParticipantEntity = room.leave(userId);

      await queryRunner.manager.remove(toRemove);

      // TODO 소켓 leave 처리
      if (room.getUserCount() == 0) {
        //모두 나가면 방 삭제
        //TODO imagefile들 s3에서 삭제 후, 테이블 삭제
        await queryRunner.manager.remove(room);
        await queryRunner.commitTransaction();

        //TODO 삭제하고 이벤트 만들면 이미 match.roomId = null 되어버렸기 때문에 매치를 찾을수가 없음
        this.emit(RoomEventType.DELETED, room);
        return room;
      }

      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();

      this.emit(RoomEventType.USER_LEAVE, roomId, toRemove.userId);
      this.checkAllReadyOrCanceled(prevState, room.phase, roomId);
      return room;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  getRoomById(id: string): Promise<RoomEntity> {
    return this.roomRepository.findOne(id);
  }

  private aFewMinutesLater(m) {
    return new Promise((res, rej) => {
      setTimeout(() => {
        res(1);
      }, m);
    });
  }

  // only purchaser
  async fixOrder(roomId: string, userId: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("SERIALIZABLE");

    try {
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );
      room.fixOrder();

      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();

      this.emit(RoomEventType.ORDER_FIXED, roomId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.log(err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async uploadOrderImages(rid: string, uploadFileDtos: UploadFileDto<any>[]) {
    const room = await this.roomRepository.findOne(rid);
    //TODO 구현

    for (const dto of uploadFileDtos) {
      const imageFile = new ImageFileEntity();
      imageFile.room = room;
      imageFile.s3url = dto.key;
      await this.imageFileRepository.save(imageFile);
    }
  }

  async getOrderImageKeys(rid: string) {
    return (await this.imageFileRepository.find({ roomId: rid })).map(
      (imageFile) => {
        return imageFile.s3url;
      }
    );
  }

  async checkOrder(
    roomId: string,
    userId: string,
    checkOrderDto: CheckOrderDto
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );
      await room.checkOrder(checkOrderDto.deliveryTip);

      this.logger.log(room);
      const account = RoomAccountEntity.create(
        room,
        checkOrderDto.accountBank,
        checkOrderDto.accountNum,
        checkOrderDto.accountHolderName
      );
      await queryRunner.manager.save(account);
      await queryRunner.manager.save(room);

      await queryRunner.commitTransaction();

      this.emit(RoomEventType.ORDER_CHECKED, roomId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async doneOrder(roomId: string, userId: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log("done");
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );
      this.logger.log(room);

      room.doneOrder();
      this.logger.log(room);

      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();
      this.logger.log("commit");

      this.emit(RoomEventType.ORDER_DONE, roomId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 레디에 관해서
   * 1 - 1 직접적으로 레디 : true <
   * 1 - 2 직접적으로 레디 : false <
   * 2. 새로운 유저가 참가할 때
   * 3. 어떤 유저가 스스로 나갈 때
   * 4. 어떤 유저가 강퇴 당할 때
   * */
  async kick(roomId: string, targetId: string, reason: RoomBlackListReason) {
    this.logger.log("kick");
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );
      const prevState = room.phase;

      const targetParticipant = room.kickUser(targetId, reason);

      await queryRunner.manager.remove(targetParticipant);
      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();

      const event =
        reason === RoomBlackListReason.KICKED_BY_PURCHASER
          ? RoomEventType.USER_KICKED
          : RoomEventType.USER_KICKED_BY_VOTE;

      this.emit(event, roomId, targetParticipant.userId);

      this.checkAllReadyOrCanceled(prevState, room.phase, roomId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async setReady(roomId: string, userId: string, readyState: boolean) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );
      const prevState = room.phase;
      room.setReady(userId, readyState);

      await queryRunner.manager.save(room);

      await queryRunner.commitTransaction();
      this.checkAllReadyOrCanceled(prevState, room.phase, roomId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // async getMenus(room: RoomEntity, user: User): Promise<MenuEntity[]> {
  //   return (await this.getParticipant(room, user)).menus;
  // }

  async addMenu(
    roomId: string,
    userId: string,
    addMenuDto: AddMenuDto
  ): Promise<MenuEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const participantWithRoom = await queryRunner.manager.findOne(
        ParticipantEntity,
        {
          roomId: roomId,
          userId: userId,
        },
        { relations: ["room"] }
      );

      const menu: MenuEntity = await this.menuRepository.save({
        participant: participantWithRoom,
        ...addMenuDto,
      });

      participantWithRoom.addMenu(menu);

      await queryRunner.commitTransaction();

      this.emit(RoomEventType.MENU_UPDATE, participantWithRoom.room.id);
      return menu;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateMenu(
    roomId: string,
    userId: string,
    menuId: string,
    updateMenuDto: UpdateMenuDto
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const participantWithRoom = await queryRunner.manager.findOne(
        ParticipantEntity,
        {
          roomId: roomId,
          userId: userId,
        },
        { relations: ["room"] }
      );

      const menu: MenuEntity = await this.menuRepository.create({
        id: menuId,
        ...updateMenuDto,
      });

      participantWithRoom.updateMenu(menu);
      await queryRunner.manager.save(ParticipantEntity, participantWithRoom);
      await queryRunner.commitTransaction();

      this.emit(RoomEventType.MENU_UPDATE, participantWithRoom.room.id);
      return menu;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteMenu(roomId: string, userId: string, menuId: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const participantWithRoom = await queryRunner.manager.findOne(
        ParticipantEntity,
        {
          roomId: roomId,
          userId: userId,
        },
        { relations: ["room"] }
      );

      participantWithRoom.deleteMenu(menuId);

      await queryRunner.manager.delete(MenuEntity, menuId);

      await queryRunner.commitTransaction();
      this.emit(RoomEventType.MENU_UPDATE, participantWithRoom.room.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findMenusByParticipant(
    roomId: string,
    userId: string
  ): Promise<MenuEntity[]> {
    return (
      await this.participantRepository.findOne({
        roomId: roomId,
        userId: userId,
      })
    ).getMenus();
  }

  async findMenuByParticipant(
    roomId: string,
    userId: string,
    menuId: string
  ): Promise<MenuEntity> {
    return (
      await this.participantRepository.findOne({
        roomId: roomId,
        userId: userId,
      })
    ).getMenuById(menuId);
  }

  async createKickVote(
    roomId: string,
    requestUserId: string,
    targetUserId: string
  ): Promise<RoomVoteEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );

      // 강퇴 투표 생성
      const created = await queryRunner.manager.save(
        KickVoteFactory.create(room, requestUserId, targetUserId)
      );

      // 강퇴 투표 생성 이벤트 발생
      this.emit(RoomEventType.KICK_VOTE_CREATED, created);

      await queryRunner.commitTransaction();
      return created;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createResetVote(
    roomId: string,
    requestUserId: string
  ): Promise<RoomVoteEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );

      // 리셋 투표 생성
      const created = await queryRunner.manager.save(
        ResetVoteFactory.create(room, requestUserId)
      );

      // 리셋 투표 생성 이벤트 발생
      this.emit(RoomEventType.RESET_VOTE_CREATED, created);

      await queryRunner.commitTransaction();
      return created;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async doVote(voteId: string, userId: string, opinion: boolean) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const voteWithRoomAndOpinions: RoomVoteEntity = await queryRunner.manager
        .createQueryBuilder(RoomVoteEntity, "kickVote")
        .leftJoinAndSelect("kickVote.room", "room")
        .leftJoinAndSelect("room.participants", "participants") // noti service
        .leftJoinAndSelect("kickVote.opinions", "voteOpinion")
        .leftJoinAndSelect("kickVote.targetUser", "targetUser")
        .leftJoinAndSelect("voteOpinion.participant", "participant")
        .where("kickVote.id = :id", { id: voteId })
        .getOne();

      // 투표 의견 제출
      voteWithRoomAndOpinions.doVote(userId, opinion);

      // 투표 종료시 이벤트 생성
      if (voteWithRoomAndOpinions.finished) {
        if (voteWithRoomAndOpinions.voteType === RoomVoteType.KICK) {
          this.emit(RoomEventType.KICK_VOTE_FINISHED, voteWithRoomAndOpinions);
          if (voteWithRoomAndOpinions.result) {
            this.kick(
              voteWithRoomAndOpinions.roomId,
              voteWithRoomAndOpinions.targetUserId,
              RoomBlackListReason.KICKED_BY_VOTE
            );
          }
        } else if (voteWithRoomAndOpinions.voteType === RoomVoteType.RESET) {
          this.emit(RoomEventType.RESET_VOTE_FINISHED, voteWithRoomAndOpinions);
          if (voteWithRoomAndOpinions.result) {
            // 리셋 처리
            this.resetRoom(voteWithRoomAndOpinions.roomId);
          }
        }
      }

      await queryRunner.manager.save(voteWithRoomAndOpinions);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async resetRoom(roomId: string) {
    //TODO
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<RoomEntity>(
        RoomEntity,
        roomId
      );
      room.cancel();
      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  getVoteById(voteId: string): Promise<RoomVoteEntity> {
    return this.connection.manager
      .createQueryBuilder(RoomVoteEntity, "kickVote")
      .leftJoinAndSelect("kickVote.room", "room")
      .leftJoinAndSelect("room.participants", "participants")
      .leftJoinAndSelect("kickVote.targetUser", "targetUser")
      .leftJoinAndSelect("kickVote.opinions", "voteOpinion")
      .leftJoinAndSelect("voteOpinion.participant", "participant")
      .where("kickVote.id = :id", { id: voteId })
      .getOne();
  }
  getRoomVotes(roomId: string): Promise<RoomVoteEntity[]> {
    return this.connection.manager
      .createQueryBuilder(RoomVoteEntity, "kickVote")
      .leftJoinAndSelect("kickVote.room", "room")
      .leftJoinAndSelect("kickVote.opinions", "voteOpinion")
      .leftJoinAndSelect("voteOpinion.participant", "participant")
      .where("kickVote.room = :id", { id: roomId })
      .getMany();
  }

  async receiveChat(roomId: string, userId: string, message: string) {
    this.emit(RoomEventType.CHAT, roomId, userId, message);
  }

  /**
   * ParticipantService
   * - get menus
   * - get menu by id
   * - add menu
   * - update menu
   * - delete menu
   * - setReady(boolean)
   *
   * 특정 room phase 에만 추가/수정/삭제 가능
   * 자기 자신 menu 만 조작 가능
   * 수정 시 room 금액 등 반영
   *
   * RoomService
   * - join room
   * - leave room
   * - create room
   * - kick User
   * - fix order
   * - check order
   * - done order
   * - get receipt
   *
   * VoteService
   * - createVote
   * - doVote
   * - getResult
   *
   * */
}

// @Inject() private eventService: EventService
// @Inject("IUserContainer") private userContainer: IUserContainer, // @Inject("IMatchContainer") private matchContainer: IMatchContainer, // @Inject("IRoomContainer") private roomContainer: IRoomContainer,

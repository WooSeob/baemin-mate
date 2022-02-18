import { Injectable, Logger } from "@nestjs/common";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { CheckOrderDto } from "./dto/request/check-order.dto";
import { RoomState } from "./const/RoomState";
import { User } from "../user/entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, QueryRunner, Repository } from "typeorm";
import { Room } from "./entity/Room";
import { Participant } from "./entity/Participant";
import { Menu } from "./entity/Menu";
import { AddMenuDto } from "../user/dto/request/add-menu.dto";
import { UpdateMenuDto } from "../user/dto/request/update-menu.dto";

import { RoomBlackListReason } from "./entity/RoomBlackList";
import RoomVote, { RoomVoteType } from "./entity/RoomVote";
import KickVoteFactory from "./entity/Vote/KickVote/KickVoteFactory";
import ResetVoteFactory from "./entity/Vote/ResetVote/ResetVoteFactory";
import { RoomEventType } from "./const/RoomEventType";
import { EventEmitter } from "stream";

//StrictEventEmitter<RoomEvents, RoomEvents>
@Injectable()
export class RoomService extends EventEmitter {
  private logger = new Logger("RoomService");
  constructor(
    public connection: Connection,
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(Menu) private menuRepository: Repository<Menu>
  ) {
    super();
  }

  async clear() {
    const rooms = await this.roomRepository.find();
    for (const room of rooms) {
      await this.roomRepository.remove(room);
    }
  }

  isParticipant(user: User, room: Room) {
    // return room.users.has(user);
  }

  findRoomById(id: string): Promise<Room> {
    return this.roomRepository
      .createQueryBuilder("room")
      .leftJoinAndSelect("room.purchaser", "purchaser")
      .leftJoinAndSelect("room.participants", "participants")
      .leftJoinAndSelect("participants.user", "user")
      .leftJoinAndSelect("participants.menus", "menu")
      .where({ id: id })
      .getOne();
  }

  async getMenuById(id: string): Promise<Menu> {
    return this.menuRepository.findOne(id);
  }

  getParticipants(room: Room): Promise<Participant[]> {
    return this.participantRepository.find({ where: { room: room } });
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
    await this.aFewMinutesLater(100);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("SERIALIZABLE");

    try {
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);
      const userWithRooms: User = await queryRunner.manager
        .createQueryBuilder(User, "user")
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
      console.log(err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createRoom(
    userId: string,
    createRoomDto: CreateRoomDto
  ): Promise<Room> {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let created;
    try {
      const userWithJoinedRooms: User = await queryRunner.manager
        .createQueryBuilder(User, "user")
        .leftJoinAndSelect("user.rooms", "participation")
        .leftJoinAndSelect("participation.room", "room")
        .where("user.id = :id", { id: userId })
        .getOne();

      created = await queryRunner.manager.save(
        Room.create(userWithJoinedRooms, createRoomDto)
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
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);
      const prevState = room.phase;

      const toRemove: Participant = room.leave(userId);

      await queryRunner.manager.remove(toRemove);

      this.emit(RoomEventType.USER_LEAVE, roomId, toRemove.userId);

      // TODO 소켓 leave 처리
      if (room.getUserCount() == 0) {
        this.emit(RoomEventType.DELETED, room);
        //모두 나가면 방 삭제
        await queryRunner.manager.remove(room);
      } else {
        //퇴장 수행 저장
        await queryRunner.manager.save(room);
      }
      await queryRunner.commitTransaction();

      this.checkAllReadyOrCanceled(prevState, room.phase, roomId);
      return room;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  getRoomById(id: string): Promise<Room> {
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
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);
      room.changePhase(RoomState.ORDER_FIX);

      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();

      this.emit(RoomEventType.ORDER_FIXED, roomId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.log(err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async uploadOrderImages(roomId: string, images) {
    //TODO 구현
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
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);
      await room.checkOrder(checkOrderDto.tip);

      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();

      this.emit(RoomEventType.ORDER_CHECKED, roomId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async doneOrder(roomId: string, userId: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);
      room.changePhase(RoomState.ORDER_DONE);

      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();

      this.emit(RoomEventType.ORDER_DONE, roomId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
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
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);
      const prevState = room.phase;

      const targetParticipant = room.kickUser(targetId, reason);

      await queryRunner.manager.remove(targetParticipant);
      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();

      this.emit(RoomEventType.USER_KICKED, roomId, targetParticipant.userId);
      this.emit(RoomEventType.USER_LEAVE, roomId, targetParticipant.userId);

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
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);
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

  // async getMenus(room: Room, user: User): Promise<Menu[]> {
  //   return (await this.getParticipant(room, user)).menus;
  // }

  async addMenu(
    roomId: string,
    userId: string,
    addMenuDto: AddMenuDto
  ): Promise<Menu> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const participantWithRoom = await queryRunner.manager.findOne(
        Participant,
        {
          roomId: roomId,
          userId: userId,
        },
        { relations: ["room"] }
      );

      const menu: Menu = await this.menuRepository.save({
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
        Participant,
        {
          roomId: roomId,
          userId: userId,
        },
        { relations: ["room"] }
      );

      const menu: Menu = await this.menuRepository.create({
        id: menuId,
        ...updateMenuDto,
      });

      participantWithRoom.updateMenu(menu);
      await queryRunner.manager.save(Participant, participantWithRoom);
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
        Participant,
        {
          roomId: roomId,
          userId: userId,
        },
        { relations: ["room"] }
      );

      participantWithRoom.deleteMenu(menuId);

      await queryRunner.manager.delete(Menu, menuId);

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
  ): Promise<Menu[]> {
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
  ): Promise<Menu> {
    return (
      await this.participantRepository.findOne({
        roomId: roomId,
        userId: userId,
      })
    ).getMenuById(menuId);
  }

  async createKickVote(
    roomId: string,
    targetUserId: string
  ): Promise<RoomVote> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);

      // 강퇴 투표 생성
      const created = await queryRunner.manager.save(
        KickVoteFactory.create(room, targetUserId)
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

  async createResetVote(roomId: string): Promise<RoomVote> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);

      // 리셋 투표 생성
      const created = await queryRunner.manager.save(
        ResetVoteFactory.create(room)
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
      const voteWithRoomAndOpinions: RoomVote = await queryRunner.manager
        .createQueryBuilder(RoomVote, "kickVote")
        .leftJoinAndSelect("kickVote.room", "room")
        .leftJoinAndSelect("kickVote.opinions", "voteOpinion")
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
            console.log(voteWithRoomAndOpinions);
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
      const room = await queryRunner.manager.findOne<Room>(Room, roomId);
      room.reset();
      await queryRunner.manager.save(room);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  getVoteById(voteId: string): Promise<RoomVote> {
    return this.connection.manager
      .createQueryBuilder(RoomVote, "kickVote")
      .leftJoinAndSelect("kickVote.room", "room")
      .leftJoinAndSelect("kickVote.opinions", "voteOpinion")
      .leftJoinAndSelect("voteOpinion.participant", "participant")
      .where("kickVote.id = :id", { id: voteId })
      .getOne();
  }
  getRoomVotes(roomId: string): Promise<RoomVote[]> {
    return this.connection.manager
      .createQueryBuilder(RoomVote, "kickVote")
      .leftJoinAndSelect("kickVote.room", "room")
      .leftJoinAndSelect("kickVote.opinions", "voteOpinion")
      .leftJoinAndSelect("voteOpinion.participant", "participant")
      .where("kickVote.room = :id", { id: roomId })
      .getMany();
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

import { Inject, Injectable, Logger, UseInterceptors } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { SubscribeMatchDto } from "./dto/request/subscribe-match.dto";
import { UserEntity } from "../user/entity/user.entity";
import { CategoryType } from "./interfaces/category.interface";
import { RoomEventType } from "../room/const/RoomEventType";
import { RoomService } from "../room/room.service";
import { Connection, QueryRunner, Repository } from "typeorm";
import { MatchEntity } from "./entity/match.entity";
import MatchInfo from "./dto/response/match-info.interface";
import { RoomEntity } from "../room/entity/room.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { UniversityService } from "../university/university.service";

enum MatchNamespace {
  CREATE = "new-arrive",
  UPDATE = "update",
  DELETE = "closed",
}
@UseInterceptors()
@Injectable()
export class MatchService {
  private readonly logger = new Logger("MatchService");
  _server: Server = null;

  get server() {
    return this._server;
  }
  constructor(
    private connection: Connection,
    private roomService: RoomService,
    private universityService: UniversityService,
    @InjectRepository(MatchEntity)
    private matchRepository: Repository<MatchEntity>
  ) {
    // 룸이 새로 생성되었을 때
    // 노출 가능 상태가 되었을 때(-> prepare, -> all ready)
    roomService.on(RoomEventType.CREATE, async (room: RoomEntity) => {
      await this.handleCreateEvent(room);
    });

    // 룸 변경
    // 합계 금액이 변경되었을 떄
    // 유저가 입장 했을 때
    // 유저가 퇴장 했을 때
    roomService.on(RoomEventType.USER_ENTER, async (roomId, userId) => {
      return this.handleUpdateEvent(roomId);
    });

    roomService.on(RoomEventType.USER_LEAVE, async (roomId, userId) => {
      return this.handleUpdateEvent(roomId);
    });

    // 메뉴 추가 수정 삭제
    roomService.on(RoomEventType.MENU_UPDATE, async (roomId: string) => {
      await this.handleUpdateEvent(roomId);
    });

    //TODO
    roomService.on(RoomEventType.USER_KICKED, async (roomId, userId) => {
      return this.handleUpdateEvent(roomId);
    });

    // 룸 자체가 삭제 되었을 때
    // 비 노출 상태가 되었을 때 (-> orderfix )
    roomService.on(RoomEventType.DELETED, async (roomId) => {
      const matches = await this.matchRepository.find({ roomId: null });
      matches.forEach((match) => {
        this.server
          .to(
            this.socketRoomStringResolver(
              match.targetUnivId,
              match.category,
              match.sectionId
            )
          )
          .emit(MatchNamespace.DELETE, MatchInfo.from(match));
      });

      await this.matchRepository.remove(matches);
    });
    roomService.on(RoomEventType.ORDER_FIXED, async (roomId) => {
      await this.handleDeleteEvent(roomId);
    });
  }

  async handleCreateEvent(room: RoomEntity) {
    console.log(room);
    // 매치 영속화
    const dormitory = await this.universityService.getDormitoryById(
      room.sectionId
    );
    //TODO try catch
    await this.matchRepository.save(MatchEntity.create(room, dormitory.name));

    const created = await this.matchRepository.findOne({ roomId: room.id });
    this.server
      .to(
        this.socketRoomStringResolver(
          room.targetUnivId,
          room.category,
          room.sectionId
        )
      )
      .emit(MatchNamespace.CREATE, MatchInfo.from(created));
  }

  async handleDeleteEvent(roomId: string) {
    const matches = await this.matchRepository.find({ roomId: roomId });

    matches.forEach((match) => {
      this.server
        .to(
          this.socketRoomStringResolver(
            match.targetUnivId,
            match.category,
            match.sectionId
          )
        )
        .emit(MatchNamespace.DELETE, MatchInfo.from(match));
    });

    await this.matchRepository.remove(matches);
  }

  async handleUpdateEvent(roomId: string) {
    const room = await this.roomService.findRoomById(roomId);

    const matches = await this.matchRepository.find({ roomId: roomId });
    const updatedMatches = await this.matchRepository.save(
      matches.map((match) => match.update(room, match.sectionName))
    );

    updatedMatches.forEach((match) => {
      this.server
        .to(
          this.socketRoomStringResolver(
            match.targetUnivId,
            match.category,
            match.sectionId
          )
        )
        .emit(MatchNamespace.UPDATE, MatchInfo.from(match));
    });
  }

  private socketRoomStringResolver(
    univ: number,
    category: string,
    sectionId: number
  ) {
    return `${univ} - ${sectionId} - ${category}`;
  }

  async subscribeByCategory(
    user: UserEntity,
    subscribeMatchDto: SubscribeMatchDto,
    client: Socket
  ) {
    for (let room of client.rooms) {
      client.leave(room);
    }

    const matches = await this.findMatches(
      user.universityId,
      subscribeMatchDto.section,
      subscribeMatchDto.category
    );

    for (let category of subscribeMatchDto.category) {
      for (let section of subscribeMatchDto.section) {
        client.join(
          this.socketRoomStringResolver(user.universityId, category, section)
        );
      }
    }

    return matches;
  }

  async findMatches(
    univId: number,
    sectionIds: number[],
    categories: CategoryType[]
  ): Promise<MatchEntity[]> {
    if (sectionIds.length == 0 || categories.length == 0) {
      return Promise.resolve([]);
    }

    const queryBuilder = await this.matchRepository.createQueryBuilder("match");

    queryBuilder.where("match.targetUnivId = :id", { id: univId });
    queryBuilder.andWhere("match.sectionId IN (:...sectionIds)", {
      sectionIds: sectionIds,
    });
    queryBuilder.andWhere("match.category IN (:...categories)", {
      categories: categories,
    });
    queryBuilder.andWhere("match.roomId IS NOT NULL");

    return queryBuilder.getMany();
  }

  findMatchById(id: string): Promise<MatchEntity> {
    return this.matchRepository
      .createQueryBuilder("match")
      .leftJoinAndSelect("match.room", "room")
      .leftJoinAndSelect("room.purchaser", "purchaser")
      .leftJoinAndSelect("room.participants", "participant")
      .where({ id: id })
      .getOne();
  }
}

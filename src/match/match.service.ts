import { Inject, Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { SubscribeMatchDto } from "./dto/request/subscribe-match.dto";
import { User } from "../user/entity/user.entity";
import { CategoryType } from "./interfaces/category.interface";
import { SectionType } from "../user/interfaces/user";
import { RoomEventType } from "../entities/RoomEventType";
import { RoomService } from "../room/room.service";
import { Repository } from "typeorm";
import { Match } from "../entities/Match";
import MatchInfo from "./dto/response/match-info.interface";
import { query } from "express";
import { Room } from "../entities/Room";
import { InjectRepository } from "@nestjs/typeorm";

enum MatchNamespace {
  CREATE = "new-arrive",
  UPDATE = "update",
  DELETE = "closed",
}
@Injectable()
export class MatchService {
  public server: Server = null;

  constructor(
    private roomService: RoomService,
    @InjectRepository(Match) private matchRepository: Repository<Match>
  ) {
    // 룸이 새로 생성되었을 때
    // 노출 가능 상태가 되었을 때(-> prepare, -> all ready)
    roomService.on(RoomEventType.CREATE, this.handleCreateEvent);

    // 룸 변경
    // 합계 금액이 변경되었을 떄
    // 유저가 입장 했을 때
    // 유저가 퇴장 했을 때
    roomService.on(RoomEventType.USER_ENTER, async (roomId, userId) => {
      const room = await roomService.findRoomById(roomId);
      return this.handleUpdateEvent(room);
    });

    roomService.on(RoomEventType.USER_LEAVE, async (roomId, userId) => {
      const room = await roomService.findRoomById(roomId);
      return this.handleUpdateEvent(room);
    });

    // 메뉴 추가 수정 삭제
    // TODO 나중에 꼮하기 !
    // roomService.on(RoomEventType.UPDATE, this.handleUpdateEvent);

    //TODO
    // roomService.on(RoomEventType.USER_KICKED, async (roomId, userId) => {
    //   const room = await roomService.findRoomById(roomId);
    //   return this.handleUpdateEvent(room);
    // });

    // 룸 자체가 삭제 되었을 때
    // 비 노출 상태가 되었을 때 (-> orderfix )
    roomService.on(RoomEventType.DELETED, this.handleDeleteEvent);
    roomService.on(RoomEventType.ORDER_FIXED, async (roomId) => {
      const room = await roomService.findRoomById(roomId);
      // match 삭제해 주기
      return this.handleDeleteEvent(room);
    });
  }

  async handleCreateEvent(room: Room) {
    // 매치 영속화
    const match = new Match();
    match.room = room;
    await this.matchRepository.save(match);

    this.server
      .to(this.socketRoomStringResolver(room.category, room.section))
      .emit(MatchNamespace.CREATE, MatchService.toMatchInfo(match));
  }

  async handleDeleteEvent(room: Room) {
    //TODO 최적화
    const matches = await this.matchRepository.find({ roomId: room.id });

    matches.forEach((match) => {
      this.server
        .to(this.socketRoomStringResolver(room.category, room.section))
        .emit(MatchNamespace.DELETE, MatchService.toMatchInfo(match));
    });
  }

  async handleUpdateEvent(room: Room) {
    const matches = await this.matchRepository.find({ roomId: room.id });
    matches.forEach((match) => {
      this.server
        .to(this.socketRoomStringResolver(room.category, room.section))
        .emit(MatchNamespace.UPDATE, MatchService.toMatchInfo(match));
    });
  }

  private static toMatchInfo(match: Match): MatchInfo {
    return {
      id: match.id,
      shopName: match.room.shopName,
      section: match.room.section,
      total: match.room.getTotalPrice(),
      priceAtLeast: match.room.atLeastPrice,
      purchaserName: match.room.purchaser.name,
      createdAt: match.room.createdAt,
    };
  }

  private socketRoomStringResolver(category: string, section: string) {
    return `${category} - ${section}`;
  }

  async subscribeByCategory(
    subscribeMatchDto: SubscribeMatchDto,
    client: Socket
  ) {
    for (let room of client.rooms) {
      client.leave(room);
    }

    const sections = subscribeMatchDto.section;
    const categorise = subscribeMatchDto.category;

    const cartesianProduct = (a, b) =>
      a.reduce((p, x) => [...p, ...b.map((y) => [x, y])], []);
    const options = cartesianProduct(sections, categorise);

    // section  bibong, narae
    // category korean, chicken

    // product
    // (bibong, korean) ,(bibong, chicken), (narea, korean), (narea, chicken)

    const queryBuilder = await this.matchRepository
      .createQueryBuilder("match")
      .leftJoinAndSelect("match.room", "room")
      .leftJoinAndSelect("room.purchaser", "purchaser");

    for (const option of options) {
      const [section, category] = option;
      queryBuilder.orWhere("room.section = :section", { section: section });
      queryBuilder.andWhere("room.category = :category", {
        category: category,
      });
    }

    const matches = await queryBuilder.getMany();

    // TODO 데이터 중복 가능성?
    for (let category of subscribeMatchDto.category) {
      for (let section of subscribeMatchDto.section) {
        client.join(this.socketRoomStringResolver(category, section));
      }
    }

    return matches;
  }

  findMatchById(id: string): Promise<Match> {
    return this.matchRepository.findOne(id);
  }
}

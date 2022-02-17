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
    roomService.on(RoomEventType.CREATE, async (room: Room) => {
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
    // roomService.on(RoomEventType.USER_KICKED, async (roomId, userId) => {
    //   const room = await roomService.findRoomById(roomId);
    //   return this.handleUpdateEvent(room);
    // });

    // 룸 자체가 삭제 되었을 때
    // 비 노출 상태가 되었을 때 (-> orderfix )
    roomService.on(RoomEventType.DELETED, async (roomId) => {
      await this.handleDeleteEvent(roomId);
    });
    roomService.on(RoomEventType.ORDER_FIXED, async (roomId) => {
      await this.handleDeleteEvent(roomId);
    });
  }

  async handleCreateEvent(room: Room) {
    // 매치 영속화
    const created = await this.matchRepository.save(Match.create(room));
    this.server
      .to(this.socketRoomStringResolver(room.category, room.section))
      .emit(MatchNamespace.CREATE, MatchInfo.from(created));
  }

  async handleDeleteEvent(roomId: string) {
    const matches = await this.matchRepository.find({ roomId: roomId });

    matches.forEach((match) => {
      this.server
        .to(this.socketRoomStringResolver(match.category, match.section))
        .emit(MatchNamespace.DELETE, MatchInfo.from(match));
    });

    await this.matchRepository.remove(matches);
  }

  async handleUpdateEvent(roomId: string) {
    const room = await this.roomService.findRoomById(roomId);

    const matches = await this.matchRepository.find({ roomId: roomId });
    const updatedMatches = await this.matchRepository.save(
      matches.map((match) => match.update(room))
    );

    updatedMatches.forEach((match) => {
      this.server
        .to(this.socketRoomStringResolver(match.category, match.section))
        .emit(MatchNamespace.UPDATE, MatchInfo.from(match));
    });
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

    const matches = await this.findMatches(
      subscribeMatchDto.section,
      subscribeMatchDto.category
    );

    for (let category of subscribeMatchDto.category) {
      for (let section of subscribeMatchDto.section) {
        client.join(this.socketRoomStringResolver(category, section));
      }
    }

    return matches;
  }

  async findMatches(
    sections: SectionType[],
    categories: CategoryType[]
  ): Promise<Match[]> {
    if (sections.length == 0 || categories.length == 0) {
      return Promise.resolve([]);
    }

    const queryBuilder = await this.matchRepository.createQueryBuilder("match");

    queryBuilder.where("match.section IN (:...sections)", {
      sections: sections,
    });
    queryBuilder.andWhere("match.category IN (:...categories)", {
      categories: categories,
    });
    queryBuilder.andWhere("match.roomId IS NOT NULL");

    return queryBuilder.getMany();
  }

  findMatchById(id: string): Promise<Match> {
    return this.matchRepository
      .createQueryBuilder("match")
      .leftJoinAndSelect("match.room", "room")
      .leftJoinAndSelect("room.purchaser", "purchaser")
      .leftJoinAndSelect("room.participants", "participant")
      .where({ id: id })
      .getOne();
  }
}

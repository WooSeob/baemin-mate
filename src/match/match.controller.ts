import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { NaverAuthGuard } from "../auth/guards/naver-auth.guard";
import { ApiBearerAuth, ApiCreatedResponse } from "@nestjs/swagger";

import { MatchService } from "./match.service";
import { Request } from "express";
import { User } from "../user/entity/user.entity";
import MatchDetailResponseDto from "./dto/response/detail.response.dto";
import RoomDetailForUser from "../user/dto/response/room";
import { SECTION } from "../user/interfaces/user";
import { RoomService } from "../room/room.service";
import { RoomRole } from "../entities/Room";

@Controller("match")
export class MatchController {
  constructor(
    private matchService: MatchService,
    private roomService: RoomService
  ) {}

  /**
   * 유저의 기숙사 section들을 반환합니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "유저의 기숙사 section들을 반환합니다.",
    type: [String],
  })
  @Get("/sections")
  async getSections(@Req() request: Request): Promise<String[]> {
    return [SECTION.NARAE, SECTION.HOYOEN, SECTION.BIBONG, SECTION.CHANGZO];
  }

  /**
   * matchId에 해당하는 match에 대한 상세정보를 반환합니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "matchId에 해당하는 match에 대한 상세정보를 반환합니다.",
    type: MatchDetailResponseDto,
  })
  @Get("/:matchId/info")
  async getMatchInfo(
    @Param("matchId") mid: string
  ): Promise<MatchDetailResponseDto> {
    const match = await this.matchService.findMatchById(mid);
    if (!match) {
      throw new HttpException("match not found", HttpStatus.NOT_FOUND);
    }
    return MatchDetailResponseDto.from(match);
  }

  /**
   * matchId에 해당하는 match에 참가합니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "matchId에 해당하는 Match에 참가를 시도합니다.",
    type: RoomDetailForUser,
  })
  @Get("/:matchId/join")
  async joinMatch(
    @Param("matchId") mid: string,
    @Req() request: Request
  ): Promise<RoomDetailForUser> {
    const match = await this.matchService.findMatchById(mid);

    if (!match) {
      throw new HttpException("match not found", HttpStatus.NOT_FOUND);
    }

    await this.roomService.joinRoom(match.roomId, (request.user as User).id);

    const room = await this.roomService.findRoomById(match.roomId);
    return {
      id: room.id,
      purchaserId: room.purchaser.id,
      shopName: room.shopName,
      state: room.phase,
      //TODO 이거 똥임
      role: RoomRole.MEMBER,
      isReady: false,
    };
  }
}

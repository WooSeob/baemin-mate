import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";

import { MatchService } from "./match.service";
import { Request } from "express";
import { UserEntity } from "../user/entity/user.entity";
import MatchDetailResponseDto from "./dto/response/detail.response.dto";
import RoomDetailForUser from "../user/dto/response/room";
import { SECTION } from "../user/interfaces/user";
import { RoomService } from "../room/room.service";
import { RoomRole } from "../room/entity/room.entity";
import { JwtAuthGuard } from "../auth/guards/JwtAuthGuard";
import { AccessTokenPayload } from "../auth/auth.service";
import { JustLoggedIn } from "../room/decorators/room.decorator";
import ReportReason from "../report/dto/ReportReason";
import { SubscribeCategoryDto } from "./dto/request/subscribe-category.dto";
import { RecommendService } from "./recommend.service";
import { CategoryType } from "./interfaces/category.interface";

@ApiHeader({
  name: "Client-Version",
  description: "클라이언트 버전",
})
@Controller("match")
export class MatchController {
  constructor(
    private matchService: MatchService,
    private roomService: RoomService,
    private recommendService: RecommendService
  ) {}

  /**
   * 유저의 기숙사 section들을 반환합니다.
   * */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    type: [String],
  })
  @ApiOperation({
    tags: ["Match"],
    description: "유저의 기숙사 section들을 반환합니다.",
  })
  @Get("/sections")
  async getSections(@Req() request: Request): Promise<String[]> {
    return [SECTION.NARAE, SECTION.HOYOEN, SECTION.BIBONG, SECTION.CHANGZO];
  }

  /**
   * matchId에 해당하는 match에 대한 상세정보를 반환합니다.
   * */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    type: MatchDetailResponseDto,
  })
  @ApiOperation({
    tags: ["Match"],
    description: "matchId에 해당하는 match에 대한 상세정보를 반환합니다.",
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    type: RoomDetailForUser,
  })
  @ApiOperation({
    tags: ["Match"],
    description: "matchId에 해당하는 Match에 참가를 시도합니다.",
  })
  @Get("/:matchId/join")
  async joinMatch(
    @Param("matchId") mid: string,
    @Req() request: Request
  ): Promise<RoomDetailForUser> {
    const userId = (request.user as AccessTokenPayload).id;

    const match = await this.matchService.findMatchById(mid);
    if (!match) {
      throw new HttpException("match not found", HttpStatus.NOT_FOUND);
    }

    await this.roomService.joinRoom(match.roomId, userId);

    const room = await this.roomService.findRoomById(match.roomId);
    return {
      id: room.id,
      purchaserId: room.purchaser.id,
      shopName: room.shopName,
      state: room.phase,
      shopLink: room.linkFor3rdApp,
      //TODO 이거 똥임
      role: RoomRole.MEMBER,
      isReady: false,
      isReadyAvailable: room.canReady(userId),
    };
  }

  // @ApiResponse({
  //   type: [ReportReason],
  // })

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    tags: ["Match"],
    description: "특정 카테고리들을 구독한다.",
  })
  @Put("/category/subscribe")
  async subscribeCategory(
    @Req() request: Request,
    @Body() subscribeCategoryDto: SubscribeCategoryDto
  ) {
    const userId = (request.user as AccessTokenPayload).id;
    const univId = (request.user as AccessTokenPayload).univId;

    await this.recommendService.subscribeCategory(
      userId,
      univId,
      subscribeCategoryDto
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    tags: ["Match"],
    description: "특정 카테고리에 대한 구독을 취소한다.",
  })
  @Delete("/category/:cid/subscribe")
  async deleteSubscription(
    @Req() request: Request,
    @Param("cid") category: CategoryType
  ) {
    const userId = (request.user as AccessTokenPayload).id;

    return this.recommendService.deleteSubscription(userId, category);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    tags: ["Match"],
    description: "해당 유저의 카테고리 구독 정보를 조회한다.",
  })
  @Get("/category/subscribe")
  async getSubscriptions(@Req() request: Request) {
    const userId = (request.user as AccessTokenPayload).id;

    return this.recommendService.getSubscriptions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    tags: ["Match"],
    description: "특정 카테고리의 구독자 수를 조회한다.",
  })
  @Get("/category/:cid/subscribers")
  async getSubscribersOfCategory(
    @Req() request: Request,
    @Param("cid") category: CategoryType
  ) {
    const univId = (request.user as AccessTokenPayload).univId;

    return {
      category: category,
      subscribers: await this.recommendService.getSubscribersOfCategory(
        univId,
        category
      ),
    };
  }
}

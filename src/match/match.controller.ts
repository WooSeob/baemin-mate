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

@Controller("match")
export class MatchController {
  constructor(private matchService: MatchService) {}
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
    const match = this.matchService.findMatchById(mid);
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
  })
  @Get("/:matchId/join")
  async joinMatch(@Param("matchId") mid: string, @Req() request: Request) {
    const match = this.matchService.findMatchById(mid);
    if (!match) {
      throw new HttpException("match not found", HttpStatus.NOT_FOUND);
    }
    this.matchService.join(match, request.user as User);
  }
}

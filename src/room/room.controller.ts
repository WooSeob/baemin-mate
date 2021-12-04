import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { RoomService } from "./room.service";
import RoomUserView from "./dto/response/user-view.dto";
import CreateVoteDto from "./dto/request/create-vote-dto";
import DoVoteDto from "./dto/request/do-vote.dto";
import { UserService } from "../user/user.service";
import { Room } from "../domain/room/room";
import RoomView from "./dto/response/room-view.dto";
import { NaverAuthGuard } from "../auth/guards/naver-auth.guard";
import { Request } from "express";
import { ApiBearerAuth } from "@nestjs/swagger";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { User } from "../user/entity/user.entity";

@Controller("room")
export class RoomController {
  constructor(
    private authService: AuthService,
    private roomService: RoomService,
    private userService: UserService
  ) {}

  private _roleParticipant(user: User, room: Room) {
    // 방 참여자가 아니라면 exception
    if (!this.roomService.isParticipant(user, room)) {
      throw new HttpException(
        `${user.id} is not member of room(${room.id})`,
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * rid를 id로 하는 room의 정보를 가져옵니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/:rid")
  async getRoom(
    @Req() request: Request,
    @Param("rid") rid: string
  ): Promise<RoomView> {
    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    return RoomView.from(room);
  }

  /**
   * 새로운 Room 을 생성합니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Post("/")
  async createRoom(
    @Req() request: Request,
    @Body() createRoomDto: CreateRoomDto
  ): Promise<RoomView> {
    const room = this.roomService.createRoom(
      request.user as User,
      createRoomDto
    );
    return RoomView.from(room);
  }

  /**
   * rid를 id로 하는 room의 전체 menu들에 대한 정보를 가져옵니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/:rid/menus")
  async getMenus(@Param("rid") rid: string) {
    //유효한 room 인지?
    //해당 room에 접근권한이 있는지?

    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    const menuMap = this.roomService.getMenus(room);
    return Array.from(menuMap.entries()).map((e) => {
      return {
        user: RoomUserView.from(e[0]),
        menus: e[1],
      };
    });
  }

  /**
   * rid를 id로 하는 room의 vote를 생성합니다.
   * vote type
   *    1. kick  : target_uid를 강제퇴장 시키는 건의 투표를 생성합니다.
   *               생성이 완료된 경우 해당 방의 유저들에게 생성된 투표 아이디(vid)가
   *               "vote-start" 이벤트를 통해 전달되며
   *               이를 통해 유저들은 "POST /:rid/vote/:vid"을 통해서 해당 투표건에 대한
   *               의사를 표시할 수 있습니다.
   *               투표가 종료 조건이 발동되면 "vote-finish" 이벤트를 통해 결과를 통지합니다.
   *    2. reset : 해당 방을 리셋 시키는 건의 투표를 생성합니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Post("/:rid/vote")
  async createVote(
    @Param("rid") rid: string,
    @Body() createVoteDto: CreateVoteDto
  ) {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    const targetUser = await this.userService.findUserById(
      createVoteDto.target_uid
    );
    if (!targetUser) {
      throw new HttpException(
        "user(target_uid) not found",
        HttpStatus.NOT_FOUND
      );
    }

    //투표 제기자가 방 참여인원인지?
    //방의 상태가 투표를 시행할 수 있는 상태인지?
    //현재 진행중인 투표가 있는지?
    if (createVoteDto.type == "kick") {
      this._roleParticipant(targetUser, room);
      try {
        this.roomService.createKickVote(room, targetUser);
      } catch (e) {
        throw new HttpException(
          `vote is unavailable now`,
          HttpStatus.BAD_REQUEST
        );
      }
    } else if (createVoteDto.type == "reset") {
      try {
        this.roomService.createResetVote(room);
      } catch (e) {
        throw new HttpException(
          `vote is unavailable now`,
          HttpStatus.BAD_REQUEST
        );
      }
    } else {
      throw new HttpException(
        `please check vote type : ${createVoteDto.type}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 해당 room의 vid에 해당하는 투표건에 투표를 행사합니다.
   *
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Post("/:rid/vote/:vid")
  async doVote(
    @Param("rid") rid: string,
    @Param("vid") vid: string,
    @Body() doVoteDto: DoVoteDto
  ) {
    //현재 진행중인 투표가 있는지?
    //이미 투표하지 않았는지?
    //투표할 수 없는 인원이 투표권을 행사한건지?
    // this.roomService.doVote()
  }

  /**
   * 해당 room의 order 정보를 fix 합니다.
   * 모든 참여자들에게 해당 이벤트는 push notification 되며
   * order-done 전까지
   * 레디한 참여자들은 레디를 헤제할 수 없고, 방에서 나갈 수 없습니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Post("/:rid/order-fix")
  async fixOrder() {
    //호출 시점에 all-ready 인지 다시 확인하기
  }

  /**
   * 해당 room의 order 정보를 바탕으로 purchaser 는
   *    1. 3rd app 에서 결제하기 직전의 스크린샷
   *    2. 배달팁 정보
   *    를 업로드 합니다.
   * 위 내용을 "" 이벤트를 통해 참가자들에게 브로드 캐스트 합니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Post("/:rid/order-check")
  async checkOrder() {}

  /**
   * 해당 room의 purchaser 는 결제를 완료하고 해당 api를 호출합니다.
   * 이 시점 이후로 참여자들은 방을 나갈 수 있습니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Post("/:rid/order-done")
  async doneOrder() {}
}

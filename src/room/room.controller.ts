import {
  Body,
  Controller,
  forwardRef,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Render,
  Req,
  Res,
  Response,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
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
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse} from "@nestjs/swagger";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { User } from "../user/entity/user.entity";
import { CheckOrderDto } from "./dto/request/check-order.dto";
import MenusResponseDto, { UserMenus } from "./dto/response/menus.response.dto";
import CreateRoomResponse from "./dto/response/create-room.response";
import { CATEGORY } from "src/match/interfaces/category.interface";
import { SECTION } from "src/user/interfaces/user";
import { FileInterceptor } from "@nestjs/platform-express";
import { createReadStream, writeFile } from "fs";
import { join } from "path";
import OrderReceiptResonse from "./dto/response/order-receipt.response";
import OrderReceiptResponse from "./dto/response/order-receipt.response";
import RoomStateResponse from "./dto/response/room-state.response";
import {ChatBody, Message, SystemBody} from "./dto/response/message.response";
import RoomUser from "./dto/response/user.response";
import {ApiImplicitFile} from "@nestjs/swagger/dist/decorators/api-implicit-file.decorator";

@Controller("room")
export class RoomController {
  constructor(
    private authService: AuthService,
    private roomService: RoomService,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  private _roleParticipant(user: User, room: Room) {
    // 방 참여자가 아니라면 exception
    if (!this.roomService.isParticipant(user, room)) {
      throw new HttpException(`not member of room`, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 새로운 Room 을 생성합니다.
   * */
  @ApiCreatedResponse({
    description: "fixOrderTest",
  })
  @Get("/test/:rid/order-fix")
  async fixOrderTest(@Param("rid") rid: string) {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    this.roomService.fixOrder(room, room.info.purchaser);
  }

  /**
   * test 입장
   * */
  @ApiCreatedResponse({
    description: "test입장",
  })
  @Get("/test/:rid/join")
  async joinTestRoom(@Param("rid") rid: string) {
    const user = await this.userService.findUserById(
      "s1zP0trpx0OusFQekHGBIaDsvuOy-AxmwCCskEJBwc0"
    );
    const room = await this.roomService.findRoomById(rid);
    room.users.add(user);
  }

  /**
   * 새로운 Room 을 생성합니다.
   * */
  @ApiCreatedResponse({
    description: "rid 에 test 메시지를 broadcast 합니다.",
    type: CreateRoomResponse,
  })
  @Get("/test/:rid/send/:msg")
  async makeTestChatBroadcast(@Param("rid") rid: string, @Param("msg") msg: string) {
    const room = await this.roomService.findRoomById(rid);
    room.chat.receive(room.info.purchaser, msg);
  }

  /**
   * 새로운 Room 을 생성합니다.
   * */
  @ApiCreatedResponse({
    description: "새로운 TEST Room 을 생성합니다.",
    type: CreateRoomResponse,
  })
  @Get("/test/:uid")
  async makeTestRoom(@Param("uid") uid: string): Promise<CreateRoomResponse> {
    const createRoomDto: CreateRoomDto = {
      shopName: "테스트샵",
      deliveryPriceAtLeast: 777,
      shopLink: "naver.com",
      category: CATEGORY.KOREAN,
      section: SECTION.NARAE,
    };
    const hostUser = await this.userService.findUserById(uid);
    if (!hostUser) {
      throw new HttpException("host not found", HttpStatus.NOT_FOUND);
    }
    const room = this.roomService.createRoom(hostUser, createRoomDto);
    return CreateRoomResponse.from(room);
  }

  //유저 in Room 상태 정보
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "해당 방의 상태 정보를 가져옵니다.",
    type: RoomStateResponse,
  })
  @Get("/:rid/state")
  async getJoinedRooms(@Req() request: Request, @Param("rid") rid: string): Promise<RoomStateResponse> {
    const user = request.user as User;
    if (!user) {
      throw new HttpException("user not found", HttpStatus.NOT_FOUND);
    }

    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    return {
      state: room.ctx.state,
      role: room.info.purchaser == user ? "purchaser" : "member",
      isReady: room.users.getIsReady(user),
    };
  }
  /**
   * rid를 id로 하는 room의 정보를 가져옵니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "rid를 id로 하는 room의 정보를 가져옵니다.",
    type: RoomView,
  })
  @Get("/:rid")
  async getRoom(@Req() request: Request, @Param("rid") rid: string): Promise<RoomView> {
    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    return RoomView.from(room);
  }

  /**
   * rid 에 해당하는 Room의 현재 참여자 정보를 불러옵니다.
   * */
  @ApiCreatedResponse({
    description: "현재 참여자 정보를 불러옵니다.",
    type: [RoomUser],
  })
  @Get("/:rid/participants")
  async getParticipants(@Param("rid") rid: string): Promise<RoomUser[]> {
    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    const users = room.users.getUserList();

    return users.map((user) => {
      return {
        id: user.id,
        name: user.name,
      };
    });
  }

  /**
   * rid 에 해당하는 Room의 채팅 내용을 불러옵니다.
   * */
  @ApiCreatedResponse({
    description: "채팅 내용을 반환합니다.",
  })
  @Get("/:rid/chat/:idx")
  async getMessages(
    @Req() request: Request,
    @Param("rid") rid: string,
    @Param("idx") idx: number
  ): Promise<Message<ChatBody | SystemBody>[]> {
    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    const user = request.user as User;

    return room.chat.getMessagesFromIdx(idx);
  }

  /**
   * 새로운 Room 을 생성합니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "새로운 Room 을 생성합니다.",
    type: CreateRoomResponse,
  })
  @Post("/")
  async createRoom(
    @Req() request: Request,
    @Body(new ValidationPipe()) createRoomDto: CreateRoomDto
  ): Promise<CreateRoomResponse> {
    const room = this.roomService.createRoom(request.user as User, createRoomDto);
    return CreateRoomResponse.from(room);
  }

  /**
   * rid 에 해당하는 Room 에서 퇴장 합니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "rid 에 해당하는 Room 에서 퇴장 합니다.",
  })
  @Get("/:rid/leave")
  async leaveRoom(@Param("rid") rid: string, @Req() request: Request) {
    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    this.roomService.leaveRoom(room, request.user as User);
  }

  /**
   * uid를 에 해당하는 유저를 강퇴시킵니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "uid를 에 해당하는 유저를 강퇴시킵니다",
  })
  @Get("/:rid/kick")
  async kickUser(
    @Req() request: Request,
    @Param("rid") rid: string,
    @Query("uid") uid: string
  ) {
    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    const targetUser = await this.userService.findUserById(uid);
    if (!targetUser) {
      throw new HttpException("target user not found", HttpStatus.NOT_FOUND);
    }
    room.users.delete(targetUser);
  }

  /**
   * uid를 에 해당하는 유저를 강퇴시킵니다.
   * */
  @ApiCreatedResponse({
    description: "uid를 에 해당하는 유저를 ready set합니다.",
  })
  @Get("/:rid/ready")
  async setReadyUser(
    @Req() request: Request,
    @Param("rid") rid: string,
    @Query("uid") uid: string
  ) {
    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    const targetUser = await this.userService.findUserById(uid);
    if (!targetUser) {
      throw new HttpException("target user not found", HttpStatus.NOT_FOUND);
    }
    room.users.setReady(targetUser, true);
  }

  /**
   * rid를 id로 하는 room의 전체 menu들에 대한 정보를 가져옵니다.
   * */
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "rid를 id로 하는 room의 전체 menu들에 대한 정보를 가져옵니다.",
    type: [UserMenus],
  })
  @Get("/:rid/menus")
  async getMenus(@Param("rid") rid: string): Promise<UserMenus[]> {
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

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: `rid를 id로 하는 room의 강퇴 투표를 생성합니다.
    생성된 Vote Id 를 반환합니다.\n
    쿼리스트링 targetId 유저에 대해 강제퇴장 시키는 건의 투표를 생성합니다.\n
    생성이 완료된 경우 해당 방의 유저들에게 생성된 투표 아이디(vid)가\n
    "vote-start" 이벤트를 통해 전달되며\n
    이를 통해 유저들은 "POST /:rid/vote/:vid"을 통해서 해당 투표건에 대한 의사를 표시할 수 있습니다.
    투표가 종료 조건이 발동되면 "vote-finish" 이벤트를 통해 결과를 통지합니다.`,
    type: String,
  })
  @Post("/:rid/vote-kick")
  async createkickVote(
    @Param("rid") rid: string,
    @Query("targetId") targetId: string
  ): Promise<string> {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    //투표 제기자가 방 참여인원인지?
    //방의 상태가 투표를 시행할 수 있는 상태인지?
    //현재 진행중인 투표가 있는지?
    const targetUser = await this.userService.findUserById(targetId);
    if (!targetUser) {
      throw new HttpException("user(target_uid) not found", HttpStatus.NOT_FOUND);
    }

    this._roleParticipant(targetUser, room);
    try {
      let vid = this.roomService.createKickVote(room, targetUser);
      return vid;
    } catch (e) {
      throw new HttpException(`vote is unavailable now`, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: `rid를 id로 하는 room의 reset vote를 생성합니다.
    해당 방을 리셋 시키는 건의 투표를 생성합니다
    생성된 Vote Id 를 반환합니다.`,
    type: String,
  })
  @Post("/:rid/vote-reset")
  async createResetVote(@Param("rid") rid: string): Promise<string> {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    //투표 제기자가 방 참여인원인지?
    //방의 상태가 투표를 시행할 수 있는 상태인지?
    //현재 진행중인 투표가 있는지?
    try {
      let vid = this.roomService.createResetVote(room);
      return vid;
    } catch (e) {
      throw new HttpException(`vote is unavailable now`, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description:
      "해당 room의 vid에 해당하는 투표건에 의견을 제출합니다. / isAgree : true == 해당 투표에 찬성함",
  })
  @Post("/:rid/vote/:vid")
  async doVote(
    @Param("rid") rid: string,
    @Param("vid") vid: string,
    @Query("isAgree") isAgree: boolean,
    @Req() request: Request
  ) {
    //현재 진행중인 투표가 있는지?
    //이미 투표하지 않았는지?
    //투표할 수 없는 인원이 투표권을 행사한건지?
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    this.roomService.doVote(room, request.user as User, isAgree);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: `해당 room의 order 정보를 fix 합니다.
   - 모든 참여자들에게 해당 이벤트는 push notification 되며
   - order-done 전까지 레디한 참여자들은 레디를 헤제할 수 없고, 방에서 나갈 수 없습니다.`,
  })
  @Post("/:rid/order-fix")
  async fixOrder(@Param("rid") rid: string, @Req() request: Request) {
    //호출 시점에 all-ready 인지 다시 확인하기
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    this.roomService.fixOrder(room, request.user as User);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: `해당 room의 purchaser 는 배달팁 정보를 업로드 합니다.
    이 api를 호출하기 전에 POST /room/:rid/purchase-screenshot 호출을 통해 결제 이미지를 업로드 성공한 상태여야 합니다.
    위 내용은 "order-checked" 이벤트를 통해 참가자들에게 브로드 캐스트 합니다.`,
  })
  @Post("/:rid/order-check")
  async checkOrder(
    @Param("rid") rid: string,
    @Req() request: Request,
    @Query("delivery-tip") deliveryTip: number
  ) {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    this.roomService.checkOrder(room, request.user as User, { tip: deliveryTip });
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: `해당 room의 purchaser 는 결제를 완료하고 해당 api를 호출합니다.
   * 이 시점 이후로 참여자들은 방을 나갈 수 있습니다.`,
  })
  @Post("/:rid/order-done")
  async doneOrder(@Param("rid") rid: string, @Req() request: Request) {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    throw new HttpException("not implemented yet", HttpStatus.NOT_IMPLEMENTED);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        purchase_screenshot: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: `해당 room의 결제 정보 스크린샷 이미지를 업로드 합니다.`,
  })
  @Post("/:rid/purchase-screenshot")
  @UseInterceptors(FileInterceptor("purchase_screenshot"))
  async uploadPurchaseScreenshot(
    @Param("rid") rid: string,
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File
  ) {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      console.log("room not found");
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    //TODO interceptor 관리, 확장자 필터링하기, S3 or db 연동하기
    writeFile(join(process.cwd(), `${room.id}.jpg`), file.buffer, function (err) {
      if (err) {
        return console.log(err);
      }
      room.order.upload();
      console.log("The file was saved!");
    });
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: `해당 room의 결제 정보 스크린샷 이미지를 다운로드 합니다.`,
  })
  @Get("/:rid/purchase-screenshot")
  async getPurchaseScreenshot(
    @Param("rid") rid: string,
    @Req() request: Request,
    @Response({ passthrough: true }) res
  ) {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    const file = createReadStream(join(process.cwd(), `${room.id}.jpg`));
    res.set({
      "Content-Type": "image/jpg",
      "Content-Disposition": `attachment; filename="${room.id}.jpg"`,
    });
    return new StreamableFile(file);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: `해당 room의 purchaser 는 결제를 완료하고 해당 api를 호출합니다.
   * 이 시점 이후로 참여자들은 방을 나갈 수 있습니다.`,
    type: OrderReceiptResonse,
  })
  @Get("/:rid/receipt")
  async getMyReceipt(
    @Param("rid") rid: string,
    @Req() request: Request,
    @Response({ passthrough: true }) res
  ): Promise<OrderReceiptResonse> {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    const menus = room.menus.getMenusByUser(request.user as User);

    let totalMenuPrice = 0;

    for (let menu of menus) {
      totalMenuPrice += menu.price * menu.quantity;
    }

    return {
      menus: room.menus.getMenusByUser(request.user as User),
      tipForUser: Math.ceil(room.price.tip / room.users.getUserCount()),
      totalPrice: totalMenuPrice + Math.ceil(room.price.tip / room.users.getUserCount()),
      accountNumber: "353-104387-01-010",
      accountBank: "기업은행",
      accountUserName: "변우섭",
    };
  }
}

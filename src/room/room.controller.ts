import {
  Body,
  Controller,
  forwardRef,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  ParseBoolPipe,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
  ValidationPipe,
} from "@nestjs/common";
import { AccessTokenPayload, AuthService } from "../auth/auth.service";
import { RoomService } from "./room.service";
import RoomUserView from "./dto/response/user-view.dto";
import { UserService } from "../user/user.service";
import RoomView from "./dto/response/room-view.dto";
import { Request } from "express";
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiHeader,
} from "@nestjs/swagger";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { UserEntity } from "../user/entity/user.entity";
import { UserMenus } from "./dto/response/menus.response.dto";
import CreateRoomResponse from "./dto/response/create-room.response";
import { FilesInterceptor } from "@nestjs/platform-express";
import OrderReceiptResonse from "./dto/response/order-receipt.response";
import RoomStateResponse from "./dto/response/room-state.response";
import { ChatBody, Message, SystemBody } from "./dto/response/message.response";
import RoomUser from "./dto/response/user.response";
import { ChatService } from "../chat/chat.service";
import { RoomBlackListReason } from "./entity/room-blacklist.entity";
import { v4 as uuid } from "uuid";
import { ExtensionExtractor } from "../common/util/ExtensionExtractor";
import { S3Service } from "../infra/s3/s3.service";
import { CheckOrderDto } from "./dto/request/check-order.dto";
import { ROOM_ID } from "./const/Param";
import {
  JustLoggedIn,
  OnlyForParticipant,
  OnlyForParticipantAndBanned,
  OnlyForPurchaser,
} from "./decorators/room.decorator";
import { VoteResponse } from "./dto/response/vote.response";
import ChatReadIdDto from "../chat/dto/response/chat-read-ids.dto";

@ApiHeader({
  name: "Client-Version",
  description: "클라이언트 버전",
})
@Controller("room")
export class RoomController {
  private readonly logger = new Logger("RoomController");

  constructor(
    private authService: AuthService,
    private roomService: RoomService,
    private chatService: ChatService,
    private s3Service: S3Service,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  //유저 in RoomEntity 상태 정보
  @OnlyForParticipantAndBanned()
  @ApiCreatedResponse({
    description: "해당 방의 상태 정보를 가져옵니다.",
    type: RoomStateResponse,
  })
  @Get(`/:${ROOM_ID}/state`)
  async getJoinedRooms(
    @Req() request: Request,
    @Param(ROOM_ID) rid: string
  ): Promise<RoomStateResponse> {
    const user = request.user as UserEntity;
    if (!user) {
      throw new HttpException("user not found", HttpStatus.NOT_FOUND);
    }

    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    const participant = room.getParticipant(user.id);

    return {
      state: room.phase,
      role: participant.role,
      isReady: participant.isReady,
      isReadyAvailable: room.canReady(user.id),
    };
  }

  /**
   * rid를 id로 하는 room의 정보를 가져옵니다.
   * */
  @OnlyForParticipant()
  @ApiCreatedResponse({
    description: "rid를 id로 하는 room의 정보를 가져옵니다.",
    type: RoomView,
  })
  @Get(`/:${ROOM_ID}`)
  async getRoom(
    @Req() request: Request,
    @Param(ROOM_ID) rid: string
  ): Promise<RoomView> {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    return RoomView.from(room);
  }

  /**
   * rid 에 해당하는 Room의 현재 참여자 정보를 불러옵니다.
   * */
  @OnlyForParticipant()
  @ApiCreatedResponse({
    description: "현재 참여자 정보를 불러옵니다.",
    type: [RoomUser],
  })
  @Get(`/:${ROOM_ID}/participants`)
  async getParticipants(@Param(ROOM_ID) rid: string): Promise<RoomUser[]> {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    return room.currentParticipants.map((p) => {
      return { id: p.user.id, name: p.user.name };
    });
  }

  /**
   * rid 에 해당하는 Room의 각 유저별 최신 읽은 메시지 id들을 반환합니다.
   * */
  @OnlyForParticipantAndBanned()
  @ApiCreatedResponse({
    description: "각 유저별 최신 읽은 메시지 id들을 반환합니다.",
  })
  @Get(`/:${ROOM_ID}/chat/read`)
  async getChatReadIds(
    @Req() request: Request,
    @Param(ROOM_ID) rid: string
  ): Promise<ChatReadIdDto[]> {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    return this.chatService.getReadMessageIds(room.id);
  }

  /**
   * rid 에 해당하는 Room의 채팅 내용을 불러옵니다.
   * */
  @OnlyForParticipantAndBanned()
  @ApiCreatedResponse({
    description: "채팅 내용을 반환합니다.",
  })
  @Get(`/:${ROOM_ID}/chat/:idx`)
  async getMessages(
    @Req() request: Request,
    @Param(ROOM_ID) rid: string,
    @Param("idx") idx: number
  ): Promise<Message<ChatBody | SystemBody>[]> {
    const user = request.user as AccessTokenPayload;

    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    return this.chatService.getAllMessagesResponse(room.id, user.id);
  }

  /**
   * 새로운 RoomEntity 을 생성합니다.
   * */
  @JustLoggedIn()
  @ApiCreatedResponse({
    description: "새로운 RoomEntity 을 생성합니다.",
    type: CreateRoomResponse,
  })
  @Post("/")
  async createRoom(
    @Req() request: Request,
    @Body(new ValidationPipe()) createRoomDto: CreateRoomDto
  ): Promise<CreateRoomResponse> {
    const room = await this.roomService.createRoom(
      (request.user as UserEntity).id,
      createRoomDto
    );
    return CreateRoomResponse.from(room);
  }

  /**
   * rid 에 해당하는 RoomEntity 에서 퇴장 합니다.
   * */
  @OnlyForParticipantAndBanned()
  @ApiCreatedResponse({
    description: "rid 에 해당하는 RoomEntity 에서 퇴장 합니다.",
  })
  @Get(`/:${ROOM_ID}/leave`)
  async leaveRoom(@Param(ROOM_ID) rid: string, @Req() request: Request) {
    const room = this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    return this.roomService.leaveRoom(rid, (request.user as UserEntity).id);
  }

  /**
   * uid를 에 해당하는 유저를 강퇴시킵니다.
   * */
  @OnlyForPurchaser()
  @ApiCreatedResponse({
    description: "uid를 에 해당하는 유저를 강퇴시킵니다",
  })
  @Get(`/:${ROOM_ID}/kick`)
  async kickUser(
    @Req() request: Request,
    @Param(ROOM_ID) rid: string,
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

    return this.roomService.kick(
      rid,
      uid,
      RoomBlackListReason.KICKED_BY_PURCHASER
    );
  }

  /**
   * rid를 id로 하는 room의 전체 menu들에 대한 정보를 가져옵니다.
   * */
  @OnlyForParticipant()
  @ApiCreatedResponse({
    description: "rid를 id로 하는 room의 전체 menu들에 대한 정보를 가져옵니다.",
    type: [UserMenus],
  })
  @Get(`/:${ROOM_ID}/menus`)
  async getMenus(@Param(ROOM_ID) rid: string): Promise<UserMenus[]> {
    //유효한 room 인지?
    //해당 room에 접근권한이 있는지?

    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    return room.currentParticipants.map((p) => {
      const ret = {
        user: RoomUserView.from(p.user),
        menus: p.menus,
        deliveryTip: -1,
        totalPrice: -1,
      };

      try {
        const receiptInfo = room.getReceiptForUser(p.userId);
        ret.deliveryTip = receiptInfo.tipForUser;
        ret.totalPrice = receiptInfo.totalPrice;
      } catch (e) {}

      return ret;
    });
  }

  @OnlyForParticipant()
  @ApiCreatedResponse({
    description: `rid를 id로 하는 room의 강퇴 투표를 생성합니다.
    생성된 Vote Id 를 반환합니다.\n
    쿼리스트링 targetId 유저에 대해 강제퇴장 시키는 건의 투표를 생성합니다.\n
    생성이 완료된 경우 해당 방의 유저들에게 생성된 투표 아이디(vid)가\n
    "vote-start" 이벤트를 통해 전달되며\n
    이를 통해 유저들은 "POST /${ROOM_ID}/vote/:vid"을 통해서 해당 투표건에 대한 의사를 표시할 수 있습니다.
    투표가 종료 조건이 발동되면 "vote-finish" 이벤트를 통해 결과를 통지합니다.`,
    type: String,
  })
  @Post(`/:${ROOM_ID}/vote-kick`)
  async createKickVote(
    @Param(ROOM_ID) rid: string,
    @Query("targetId") targetId: string,
    @Req() request: Request
  ): Promise<string> {
    //투표 제기자가 방 참여인원인지?
    //방의 상태가 투표를 시행할 수 있는 상태인지?
    //현재 진행중인 투표가 있는지?
    const targetUser = await this.userService.findUserById(targetId);
    if (!targetUser) {
      throw new HttpException(
        "user(target_uid) not found",
        HttpStatus.NOT_FOUND
      );
    }

    let vote = await this.roomService.createKickVote(
      rid,
      (request.user as UserEntity).id,
      targetId
    );
    return vote.id;
  }

  @OnlyForParticipant()
  @ApiCreatedResponse({
    description: `rid를 id로 하는 room의 reset vote를 생성합니다.
    해당 방을 리셋 시키는 건의 투표를 생성합니다
    생성된 Vote Id 를 반환합니다.`,
    type: String,
  })
  @Post(`/:${ROOM_ID}/vote-reset`)
  async createResetVote(
    @Param(ROOM_ID) rid: string,
    @Req() request: Request
  ): Promise<string> {
    //투표 제기자가 방 참여인원인지?
    //방의 상태가 투표를 시행할 수 있는 상태인지?
    //현재 진행중인 투표가 있는지?

    let vote = await this.roomService.createResetVote(
      rid,
      (request.user as UserEntity).id
    );
    return vote.id;
  }

  @OnlyForParticipant()
  @ApiCreatedResponse({
    description: "vote에 대한 정보를 조회합니다.",
    type: VoteResponse,
  })
  @Get(`/:${ROOM_ID}/vote/:vid`)
  async getVote(
    @Param(ROOM_ID) rid: string,
    @Param("vid") vid: string,
    @Req() request: Request
  ): Promise<VoteResponse> {
    const userId = (request.user as AccessTokenPayload).id;

    const [vote, room] = await Promise.all([
      this.roomService.getVoteById(vid),
      this.roomService.getRoomById(rid),
    ]);

    if (!vote) {
      throw new NotFoundException("존재하지 않는 투표입니다.");
    }

    const participant = room.getParticipant(userId);
    if (!participant) {
      throw new NotFoundException("참여자가 아닙니다");
    }

    return VoteResponse.from(vote, participant.id);
  }

  @OnlyForParticipant()
  @ApiCreatedResponse({
    description:
      "해당 room의 vid에 해당하는 투표건에 의견을 제출합니다. / isAgree : true == 해당 투표에 찬성함",
  })
  @Post(`/:${ROOM_ID}/vote/:vid`)
  async doVote(
    @Param(ROOM_ID) rid: string,
    @Param("vid") vid: string,
    @Query("isAgree", new ParseBoolPipe()) isAgree: boolean,
    @Req() request: Request
  ) {
    //현재 진행중인 투표가 있는지?
    //이미 투표하지 않았는지?
    //투표할 수 없는 인원이 투표권을 행사한건지?
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    await this.roomService.doVote(
      vid,
      (request.user as UserEntity).id,
      isAgree
    );
  }

  @OnlyForPurchaser()
  @ApiCreatedResponse({
    description: `해당 room의 order 정보를 fix 합니다.
   - 모든 참여자들에게 해당 이벤트는 push notification 되며
   - order-done 전까지 레디한 참여자들은 레디를 헤제할 수 없고, 방에서 나갈 수 없습니다.`,
  })
  @Post(`/:${ROOM_ID}/order-fix`)
  async fixOrder(@Param(ROOM_ID) rid: string, @Req() request: Request) {
    //호출 시점에 all-ready 인지 다시 확인하기
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    return this.roomService.fixOrder(rid, (request.user as UserEntity).id);
  }

  @OnlyForPurchaser()
  @ApiCreatedResponse({
    description: `해당 room의 purchaser 는 배달팁 정보를 업로드 합니다.
    이 api를 호출하기 전에 POST /room/${ROOM_ID}/purchase-screenshot 호출을 통해 결제 이미지를 업로드 성공한 상태여야 합니다.
    위 내용은 "order-checked" 이벤트를 통해 참가자들에게 브로드 캐스트 합니다.`,
  })
  @Post(`/:${ROOM_ID}/order-check`)
  async checkOrder(
    @Param(ROOM_ID) rid: string,
    @Req() request: Request,
    @Body() checkOrderDto: CheckOrderDto
  ) {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    return this.roomService.checkOrder(
      rid,
      (request.user as UserEntity).id,
      checkOrderDto
    );
  }

  @OnlyForPurchaser()
  @ApiCreatedResponse({
    description: `해당 room의 purchaser 는 결제를 완료하고 해당 api를 호출합니다.
   * 이 시점 이후로 참여자들은 방을 나갈 수 있습니다.`,
  })
  @Post(`/:${ROOM_ID}/order-done`)
  async doneOrder(@Param(ROOM_ID) rid: string, @Req() request: Request) {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    return this.roomService.doneOrder(rid, (request.user as UserEntity).id);
  }

  @OnlyForParticipant()
  @ApiCreatedResponse({
    description: `해당 room의 결제 정보 스크린샷 이미지 url 들을 반환합니다.`,
    type: [String],
  })
  @Get(`/:${ROOM_ID}/purchase-screenshot-urls`)
  async getOrderImageUrl(@Param(ROOM_ID) rid: string) {
    const keys: string[] = await this.roomService.getOrderImageKeys(rid);
    return this.s3Service.getSignedUrls(keys);
  }

  @OnlyForPurchaser()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        purchase_screenshot: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: `해당 room의 결제 정보 스크린샷 이미지를 업로드 합니다.`,
  })
  @Post(`/:${ROOM_ID}/purchase-screenshot`)
  @UseInterceptors(FilesInterceptor("purchase_screenshot", 3))
  async uploadPurchaseScreenshot(
    @Param(ROOM_ID) rid: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    // TODO 파일 확장자 필터링

    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      this.logger.log("room not found");
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    const fileDTOs = files.map((file) => {
      return {
        file: file,
        key: `${uuid()}.${ExtensionExtractor.from(file.originalname)}`,
      };
    });

    try {
      await this.s3Service.upload(fileDTOs);
    } catch (e) {
      this.logger.error("S3 upload failed", e);
      throw e;
    }

    await this.roomService.uploadOrderImages(rid, fileDTOs);
  }

  @OnlyForParticipant()
  @ApiCreatedResponse({
    description:
      "개개인의 주문 정보를 반환합니다. 결제정보 스크린샷은 포함되어 있지 않으며, " +
      "개개인의 메뉴, 배달팁, 총 금액, purchaser의 계좌 정보를 반환합니다.",
    type: OrderReceiptResonse,
  })
  @Get(`/:${ROOM_ID}/receipt`)
  async getMyReceipt(
    @Param(ROOM_ID) rid: string,
    @Req() request: Request
  ): Promise<OrderReceiptResonse> {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }

    const accountInfo = await this.roomService.getAccountInfo(rid);
    const receiptInfo = room.getReceiptForUser((request.user as UserEntity).id);
    return {
      totalDeliveryTip: receiptInfo.totalDeliveryTip,
      tipForUser: receiptInfo.tipForUser,
      totalPrice: receiptInfo.totalPrice,
      menus: room.getParticipant((request.user as UserEntity).id).menus,
      accountNumber: accountInfo.number,
      accountBank: accountInfo.bank,
      accountUserName: accountInfo.holderName,
    };
  }
}

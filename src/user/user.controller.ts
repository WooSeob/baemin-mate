import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param, ParseBoolPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";
import { NaverAuthGuard } from "../auth/guards/naver-auth.guard";
import {ApiBearerAuth, ApiCreatedResponse} from "@nestjs/swagger";
import { RoomService } from "../room/room.service";
import { User } from "./entity/user.entity";
import { Room } from "../domain/room/room";
import RoomDetailForUser from "./dto/response/room";
import OrderReceiptResonse from "../room/dto/response/order-receipt.response";
import RoomUserView from "../room/dto/response/user-view.dto";
import {MenuItem} from "../match/interfaces/shop.interface";

// 로그인이 안되어 있으면 exception

@Controller("user")
export class UserController {
  constructor(
    private userService: UserService,
    @Inject(forwardRef(() => RoomService)) private roomService: RoomService
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

  private async checkRoomAndUser(rid: string, uid: string) {
    const room = await this.roomService.findRoomById(rid);
    if (!room) {
      throw new HttpException("room not found", HttpStatus.NOT_FOUND);
    }
    const user = await this.userService.findUserById(uid);
    if (!user) {
      throw new HttpException("user not found", HttpStatus.NOT_FOUND);
    }
    this._roleParticipant(user, room);
    return { room, user };
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: '해당 유저의 해당 방에 추가한 메뉴들을 반환합니다.',
    type: [MenuItem],
  })
  @Get("/:uid/room/:rid/menus")
  async getMenus(@Param("uid") uid: string, @Param("rid") rid: string): Promise<MenuItem[]> {
    // 참여한 곳이 없으면 exception
    // 방 상태가 활성 상태가 아니라면 exception

    const { room, user } = await this.checkRoomAndUser(rid, uid);

    return this.userService.getMenus(room, user);
  }

  // 유저 프로필
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: '해당 유저의 프로필 정보를 반환합니다.',
    type: RoomUserView,
  })
  @Get("/:uid/profile")
  async getProfile(@Param("uid") uid: string): Promise<RoomUserView> {
    const user = await this.userService.findUserById(uid);

    if (!user) {
      throw new HttpException("user not found", HttpStatus.NOT_FOUND);
    }

    return {
      userId: user.id,
      name: user.name,
    };
  }

  //유저 참여 방 리스트
  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: '해당 유저의 참여 방 정보를 반환합니다.',
    type: [RoomDetailForUser],
  })
  @Get("/:uid/rooms")
  async getJoinedRooms(@Param("uid") uid: string): Promise<RoomDetailForUser[]> {
    const user = await this.userService.findUserById(uid);

    if (!user) {
      throw new HttpException("user not found", HttpStatus.NOT_FOUND);
    }

    return user.joinedRooms.map((room) => {
      //TODO 이거 interface로 client에서 RoomModel임
      return {
        id: room.id,
        purchaserId: room.info.purchaser.id,
        shopName: room.info.shopName,
        state: room.ctx.state,
        role: room.info.purchaser == user ? "purchaser" : "member",
        isReady: room.users.getIsReady(user),
      };
    });
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: '해당 유저, 해당 방에 새 메뉴를 추가합니다.',
  })
  @Post("/:uid/room/:rid/menus")
  async addMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Body() addMenuDto: AddMenuDto
  ): Promise<string> {
    // 참여한 곳이 없으면 exception
    const { room, user } = await this.checkRoomAndUser(rid, uid);

    return this.userService.addMenu(room, user, addMenuDto);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: '해당 유저, 해당 방에서 메뉴 id에 해당하는 메뉴 하나를 반환합니다.',
    type: MenuItem
  })
  @Get("/:uid/room/:rid/menus/:mid")
  async getMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Param("mid") mid: string
  ): Promise<MenuItem> {
    const { room, user } = await this.checkRoomAndUser(rid, uid);

    const menu = await this.userService.getMenu(room, user, mid);
    if (!menu) {
      throw new HttpException("menu not found", HttpStatus.NOT_FOUND);
    }
    return menu;
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: '해당 유저, 해당 방에서 메뉴 id에 해당하는 메뉴 하나를 수정합니다.',
  })
  @Put("/:uid/room/:rid/menus/:mid")
  async updateMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Param("mid") mid: string,
    @Body() updateMenuDto: UpdateMenuDto
  ) {
    const { room, user } = await this.checkRoomAndUser(rid, uid);

    await this.userService.updateMenu(room, user, mid, updateMenuDto);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: '해당 유저, 해당 방에서 메뉴 id에 해당하는 메뉴 하나를 삭제합니다.',
  })
  @Delete("/:uid/room/:rid/menus/:mid")
  async deleteMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Param("mid") mid: string
  ) {
    const { room, user } = await this.checkRoomAndUser(rid, uid);
    await this.userService.deleteMenu(room, user, mid);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: '해당 유저, 해당 방에서 유저의 레디 상태를 state(boolean)로 세트합니다.',
  })
  @Get("/:uid/room/:rid/ready")
  async toggleReady(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Query("state", ParseBoolPipe) readyState: boolean
  ) {
    const { room, user } = await this.checkRoomAndUser(rid, uid);
    await this.userService.setReady(room, user, readyState);
  }
}

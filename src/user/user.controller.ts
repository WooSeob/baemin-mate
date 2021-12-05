import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";
import { NaverAuthGuard } from "../auth/guards/naver-auth.guard";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoomService } from "../room/room.service";
import { User } from "./entity/user.entity";
import { Room } from "../domain/room/room";

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
  @Get("/:uid/room/:rid/menus")
  async getMenus(@Param("uid") uid: string, @Param("rid") rid: string) {
    // 참여한 곳이 없으면 exception
    // 방 상태가 활성 상태가 아니라면 exception

    const { room, user } = await this.checkRoomAndUser(rid, uid);

    return this.userService.getMenus(room, user);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
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
  @Get("/:uid/room/:rid/menus/:mid")
  async getMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Param("mid") mid: string
  ) {
    const { room, user } = await this.checkRoomAndUser(rid, uid);

    const menu = await this.userService.getMenu(room, user, mid);
    if (!menu) {
      throw new HttpException("menu not found", HttpStatus.NOT_FOUND);
    }
    return menu;
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Put("/:uid/room/:rid/menus/:mid")
  async updateMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Param("mid") mid: string,
    @Body() updateMenuDto: UpdateMenuDto
  ) {
    const { room, user } = await this.checkRoomAndUser(rid, uid);

    this.userService.updateMenu(room, user, mid, updateMenuDto);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Delete("/:uid/room/:rid/menus/:mid")
  async deleteMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Param("mid") mid: string
  ) {
    const { room, user } = await this.checkRoomAndUser(rid, uid);
    this.userService.deleteMenu(room, user, mid);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/:uid/room/:rid/ready")
  async toggleReady(@Param("uid") uid: string, @Param("rid") rid: string) {
    const { room, user } = await this.checkRoomAndUser(rid, uid);
    return this.userService.toggleReady(room, user);
  }
}

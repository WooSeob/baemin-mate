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
  UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { RoomService } from "../room/room.service";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";
import { SetReadyDto } from "./dto/request/set-ready.dto";
import { NaverAuthGuard } from "../auth/guards/naver-auth.guard";
import { ApiBearerAuth } from "@nestjs/swagger";

// 로그인이 안되어 있으면 exception

@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}

  private _roleParticipant(uid: string, rid: string) {
    // 방 참여자가 아니라면 exception
    if (!this.userService.isParticipant(uid, rid)) {
      throw new HttpException(
        `${uid} is not member of room(${rid})`,
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  private _isMenuNotFound(rid, uid, mid) {
    const menu = this.userService.getMenu(rid, uid, mid);
    if (!menu) {
      throw new HttpException(
        `there is no menu(${mid}) for ${uid}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/:uid/room/:rid/menus")
  async getMenus(@Param("uid") uid: string, @Param("rid") rid: string) {
    // 참여한 곳이 없으면 exception
    // 방 상태가 활성 상태가 아니라면 exception

    this._roleParticipant(uid, rid);

    return this.userService.getMenus(rid, uid);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Post("/:uid/room/:rid/menus")
  async addMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Body() addMenuDto: AddMenuDto
  ) {
    // 참여한 곳이 없으면 exception
    this._roleParticipant(uid, rid);
    const menuId = this.userService.addMenu(addMenuDto, rid, uid);
    return menuId;
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/:uid/room/:rid/menus/:mid")
  async getMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Param("mid") mid: string
  ) {
    // 참가자가 아님
    this._roleParticipant(uid, rid);
    // 메뉴 없음
    this._isMenuNotFound(rid, uid, mid);

    return this.userService.getMenu(rid, uid, mid);
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
    this._roleParticipant(uid, rid);
    // 메뉴 없음
    this._isMenuNotFound(rid, uid, mid);
    this.userService.updateMenu(updateMenuDto, rid, uid, mid);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Delete("/:uid/room/:rid/menus/:mid")
  async deleteMenu(
    @Param("uid") uid: string,
    @Param("rid") rid: string,
    @Param("mid") mid: string
  ) {
    this._roleParticipant(uid, rid);
    // 메뉴 없음
    this._isMenuNotFound(rid, uid, mid);
    this.userService.deleteMenu(rid, uid, mid);
  }

  @UseGuards(NaverAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/:uid/room/:rid/ready")
  async toggleReady(@Param("uid") uid: string, @Param("rid") rid: string) {
    this._roleParticipant(uid, rid);
    return this.userService.toggleReady(rid, uid);
  }
}

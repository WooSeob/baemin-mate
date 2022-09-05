import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/JwtAuthGuard";
import { ApiBearerAuth, ApiCreatedResponse, ApiHeader } from "@nestjs/swagger";
import { Request } from "express";
import { NotificationService } from "./notification.service";
import { AddTokenDto } from "./dto/request/add-token.dto";
import { UserEntity } from "../user/entity/user.entity";
import { NotificationDto } from "./dto/request/notification.dto";
import { AccessTokenPayload } from "../auth/auth.service";
import { NotificationResponse } from "./dto/response/notification.dto";

@ApiHeader({
  name: "Client-Version",
  description: "클라이언트 버전",
})
@Controller("notification")
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Put("/push/:notificationId")
  async setReadFlagOnNotification(
    @Req() request: Request,
    @Param("notificationId") notificationId: number
  ) {
    const userId = (request.user as AccessTokenPayload).id;

    await this.notificationService.setReadFlagOnNotification(
      notificationId,
      userId
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @Get("/push")
  async getNotifications(@Req() request: Request) {
    const userId = (request.user as AccessTokenPayload).id;

    const notifications =
      await this.notificationService.findNotificationsByUserId(userId);

    return notifications.map((notification) =>
      NotificationResponse.from(notification)
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "로그인한 유저의 푸시 관련 정보를 수정합니다.",
  })
  @Patch("/") //TODO 'notification/' -> 'user/{uid}/notification/option'
  async patch(
    @Req() request: Request,
    @Body(new ValidationPipe({ transform: true }))
    notificationDto: NotificationDto
  ) {
    if (notificationDto.enabled !== undefined) {
      await this.notificationService.setEnabled(
        (request.user as UserEntity).id,
        notificationDto.enabled
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "기존 디바이스 토큰을 수정하거나 없으면 추가합니다.",
  })
  @Put("/token") //TODO 'notification/token' -> 'user/{uid}/notification/token'
  async putToken(@Req() request: Request, @Body() addTokenDto: AddTokenDto) {
    return this.notificationService.put(
      (request.user as UserEntity).id,
      addTokenDto.token
    );
  }
}

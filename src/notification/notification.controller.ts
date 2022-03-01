import {
  Body,
  Controller,
  Patch,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/JwtAuthGuard";
import { ApiBearerAuth, ApiCreatedResponse } from "@nestjs/swagger";
import { Request } from "express";
import { NotificationService } from "./notification.service";
import { AddTokenDto } from "./dto/add-token.dto";
import { User } from "../user/entity/user.entity";
import { NotificationDto } from "./dto/notification.dto";

@Controller("notification")
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "로그인한 유저의 푸시 관련 정보를 수정합니다.",
  })
  @Patch("/")
  async patch(
    @Req() request: Request,
    @Body(new ValidationPipe({ transform: true }))
    notificationDto: NotificationDto
  ) {
    if (notificationDto.enabled !== undefined) {
      await this.notificationService.setEnabled(
        (request.user as User).id,
        notificationDto.enabled
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("swagger-auth")
  @ApiCreatedResponse({
    description: "기존 디바이스 토큰을 수정하거나 없으면 추가합니다.",
  })
  @Put("/token")
  async putToken(@Req() request: Request, @Body() addTokenDto: AddTokenDto) {
    return this.notificationService.put(
      (request.user as User).id,
      addTokenDto.token
    );
  }
}

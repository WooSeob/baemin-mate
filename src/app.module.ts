import { Module } from "@nestjs/common";
import { MatchModule } from "./match/match.module";
import { ChatModule } from "./chat/chat.module";
import { AuthModule } from "./auth/auth.module";
import { RoomModule } from "./room/room.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "./user/user.module";
import { UniversityModule } from "./university/university.module";
import { S3Module } from "./infra/s3/s3.module";
import { FcmModule } from "./infra/fcm/fcm.module";
import { NotificationModule } from "./notification/notification.module";
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from "nest-winston";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { VersionCheckInterceptor } from "./common/interceptors/version-check.interceptor";

@Module({
  imports: [
    RoomModule,
    UserModule,
    AuthModule,
    MatchModule,
    ChatModule,
    TypeOrmModule.forRoot(),
    UniversityModule,
    S3Module,
    FcmModule,
    NotificationModule,
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.metadata({
          fillExcept: ["message", "level", "timestamp", "context"],
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            nestWinstonModuleUtilities.format.nestLike("Gachihasil", {
              prettyPrint: true,
            })
          ),
        }),
        new DailyRotateFile({
          format: winston.format.combine(winston.format.json()),
          filename: "logs/%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
        }),
      ],
    }),
  ],
  controllers: [],
  providers: [VersionCheckInterceptor],
})
export class AppModule {}

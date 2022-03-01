import { Module } from "@nestjs/common";
import { MatchModule } from "./match/match.module";
import { ChatModule } from "./chat/chat.module";
import { AuthModule } from "./auth/auth.module";
import { RoomModule } from "./room/room.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "./user/user.module";
import { db, db_test } from "../config";
import { UniversityModule } from "./university/university.module";
import { S3Module } from "./infra/s3/s3.module";
import { FcmModule } from "./infra/fcm/fcm.module";
import { NotificationModule } from "./notification/notification.module";

@Module({
  imports: [
    RoomModule,
    UserModule,
    AuthModule,
    MatchModule,
    ChatModule,
    TypeOrmModule.forRoot(db),
    UniversityModule,
    S3Module,
    FcmModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

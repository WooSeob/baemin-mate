import { Module } from "@nestjs/common";
import { MatchModule } from "./match/match.module";
import { ChatModule } from "./chat/chat.module";
import { AuthModule } from "./auth/auth.module";
import { RoomModule } from "./room/room.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "./user/user.module";
import { db } from "../config";
import { UniversityModule } from './university/university.module';

@Module({
  imports: [
    RoomModule,
    UserModule,
    AuthModule,
    MatchModule,
    ChatModule,
    TypeOrmModule.forRoot(db),
    UniversityModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

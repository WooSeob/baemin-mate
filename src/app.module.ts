import { Module } from "@nestjs/common";
import { MatchModule } from "./match/match.module";
import { ChatModule } from "./chat/chat.module";
import { UserController } from "./user/user.controller";
import { UserService } from "./user/user.service";
import { UserModule } from "./user/user.module";
import { AuthController } from "./auth/auth.controller";
import { AuthModule } from "./auth/auth.module";
import { RoomModule } from "./room/room.module";

@Module({
  imports: [MatchModule, ChatModule, UserModule, AuthModule, RoomModule],
  controllers: [UserController],
  providers: [UserService],
})
export class AppModule {}

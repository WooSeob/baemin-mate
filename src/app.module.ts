import { Module } from "@nestjs/common";
import { MatchModule } from "./match/match.module";
import { ChatModule } from "./chat/chat.module";
import { UserController } from "./user/user.controller";
import { UserService } from "./user/user.service";
import { UserModule } from "./user/user.module";

@Module({
  imports: [MatchModule, ChatModule, UserModule],
  controllers: [UserController],
  providers: [UserService],
})
export class AppModule {}

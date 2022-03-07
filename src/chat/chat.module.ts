import { forwardRef, Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import RoomChatEntity from "../room/entity/room-chat.entity";
import { RoomModule } from "../room/room.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomChatEntity]),
    forwardRef(() => RoomModule),
    forwardRef(() => UserModule),
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}

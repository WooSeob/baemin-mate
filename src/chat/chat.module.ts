import { forwardRef, Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import RoomChat from "../room/entity/RoomChat";
import { RoomModule } from "../room/room.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomChat]),
    forwardRef(() => RoomModule),
    forwardRef(() => UserModule),
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}

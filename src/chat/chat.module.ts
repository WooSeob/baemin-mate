import { forwardRef, Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import RoomChatEntity from "../room/entity/room-chat.entity";
import { RoomModule } from "../room/room.module";
import { UserModule } from "../user/user.module";
import UserChatMetadataEntity from "./entity/user-chat-metadata.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomChatEntity]),
    TypeOrmModule.forFeature([UserChatMetadataEntity]),
    forwardRef(() => RoomModule),
    forwardRef(() => UserModule),
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}

import { forwardRef, Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import RoomChatEntity from "../room/entity/room-chat.entity";
import { RoomModule } from "../room/room.module";
import { UserModule } from "../user/user.module";
import UserChatMetadataEntity from "./entity/user-chat-metadata.entity";
import { AuthModule } from "../auth/auth.module";
import { ChatGateway } from "./chat.gateway";

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomChatEntity]),
    TypeOrmModule.forFeature([UserChatMetadataEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => RoomModule),
    forwardRef(() => UserModule),
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}

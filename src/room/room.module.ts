import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { RoomGateway } from "./room.gateway";
import { RoomService } from "./room.service";
import { RoomController } from "./room.controller";
import { UserModule } from "../user/user.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Room } from "./entity/Room";
import { Participant } from "./entity/Participant";
import { ChatModule } from "../chat/chat.module";
import { Menu } from "./entity/Menu";

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    TypeOrmModule.forFeature([Participant]),
    TypeOrmModule.forFeature([Menu]),

    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => ChatModule),
  ],
  providers: [RoomGateway, RoomService],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}

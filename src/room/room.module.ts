import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { RoomGateway } from "./room.gateway";
import { EventService } from "./event.service";
import { RoomService } from "./room.service";
import { RoomController } from "./room.controller";
import { UserModule } from "../user/user.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Room } from "../entities/Room";
import { Participant } from "../entities/Participant";
import { ChatModule } from "../chat/chat.module";
import { Menu } from "../entities/Menu";

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    TypeOrmModule.forFeature([Participant]),
    TypeOrmModule.forFeature([Menu]),

    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => ChatModule),
  ],
  providers: [RoomGateway, RoomService, EventService],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}

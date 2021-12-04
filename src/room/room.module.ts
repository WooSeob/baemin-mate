import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { ContainerModule } from "../core/container/container.module";
import { RoomGateway } from "./room.gateway";
import { RoomSender } from "./room.sender";
import { RoomService } from "./room.service";
import { RoomController } from "./room.controller";
import { UserService } from "../user/user.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [ContainerModule, AuthModule, UserModule],
  providers: [RoomGateway, RoomService, RoomSender],
  controllers: [RoomController],
})
export class RoomModule {}

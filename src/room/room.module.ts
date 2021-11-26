import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { ContainerModule } from "../core/container/container.module";
import { RoomGateway } from "./room.gateway";
import { RoomSender } from "./room.sender";
import { RoomService } from "./room.service";

@Module({
  imports: [ContainerModule, AuthModule],
  providers: [RoomGateway, RoomService, RoomSender],
})
export class RoomModule {}

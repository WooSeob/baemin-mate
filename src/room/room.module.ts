import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { ContainerModule } from "../core/container/container.module";
import { RoomGateway } from "./room.gateway";
import { RoomService } from './room.service';

@Module({
  imports: [ContainerModule, AuthModule],
  providers: [RoomGateway, RoomService],
})
export class RoomModule {}

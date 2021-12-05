import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { ContainerModule } from "../core/container/container.module";
import { RoomGateway } from "./room.gateway";
import { RoomSender } from "./room.sender";
import { RoomService } from "./room.service";
import { RoomController } from "./room.controller";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    ContainerModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  providers: [RoomGateway, RoomService, RoomSender],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}

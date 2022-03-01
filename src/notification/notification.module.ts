import { forwardRef, Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { RoomModule } from "../room/room.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserDeviceToken } from "./entity/UserDeviceToken";
import { FcmModule } from "../infra/fcm/fcm.module";
import { NotificationController } from "./notification.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    RoomModule,
    TypeOrmModule.forFeature([UserDeviceToken]),
    FcmModule,
    forwardRef(() => AuthModule),
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}

import { forwardRef, Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { RoomModule } from "../room/room.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserDeviceTokenEntity } from "./entity/user-device-token.entity";
import { FcmModule } from "../infra/fcm/fcm.module";
import { NotificationController } from "./notification.controller";
import { AuthModule } from "../auth/auth.module";
import { NotificationEntity } from "./entity/notification.entity";

@Module({
  imports: [
    forwardRef(() => RoomModule),
    TypeOrmModule.forFeature([UserDeviceTokenEntity]),
    TypeOrmModule.forFeature([NotificationEntity]),
    FcmModule,
    forwardRef(() => AuthModule),
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}

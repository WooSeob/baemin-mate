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
import { S3Module } from "../infra/s3/s3.module";
import { ImageFile } from "./entity/ImageFile";
import { RoomAccount } from "./entity/RoomAccount";

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    TypeOrmModule.forFeature([Participant]),
    TypeOrmModule.forFeature([Menu]),
    TypeOrmModule.forFeature([ImageFile]),
    TypeOrmModule.forFeature([RoomAccount]),

    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => ChatModule),
    S3Module,
  ],
  providers: [RoomGateway, RoomService],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}

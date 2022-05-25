import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { ChatGateway } from "../chat/chat.gateway";
import { RoomService } from "./room.service";
import { RoomController } from "./room.controller";
import { UserModule } from "../user/user.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoomEntity } from "./entity/room.entity";
import { ParticipantEntity } from "./entity/participant.entity";
import { ChatModule } from "../chat/chat.module";
import { MenuEntity } from "./entity/menu.entity";
import { S3Module } from "../infra/s3/s3.module";
import { ImageFileEntity } from "./entity/image-file.entity";
import { RoomAccountEntity } from "./entity/room-account.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomEntity]),
    TypeOrmModule.forFeature([ParticipantEntity]),
    TypeOrmModule.forFeature([MenuEntity]),
    TypeOrmModule.forFeature([ImageFileEntity]),
    TypeOrmModule.forFeature([RoomAccountEntity]),

    forwardRef(() => ChatModule),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    S3Module,
  ],
  providers: [RoomService],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}

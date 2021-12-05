import { forwardRef, Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { ContainerModule } from "../core/container/container.module";
import { UserController } from "./user.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entity/user.entity";
import { RoomModule } from "../room/room.module";

@Module({
  imports: [
    ContainerModule,
    TypeOrmModule.forFeature([User]),
    forwardRef(() => RoomModule),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}

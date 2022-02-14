import { forwardRef, Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entity/user.entity";
import { UserController } from "./user.controller";
import { RoomModule } from "../room/room.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => RoomModule)],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}

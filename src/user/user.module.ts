import { forwardRef, Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./entity/user.entity";
import { UserController } from "./user.controller";
import { RoomModule } from "../room/room.module";
import { AuthModule } from "../auth/auth.module";
import { UserOauthEntity } from "./entity/user-oauth.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([UserOauthEntity]),
    forwardRef(() => RoomModule),
    forwardRef(() => AuthModule),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}

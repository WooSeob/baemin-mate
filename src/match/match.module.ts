import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { MatchGateway } from "./match.gateway";
import { MatchService } from "./match.service";
import { MatchController } from "./match.controller";
import { UserModule } from "../user/user.module";
import { RoomModule } from "../room/room.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Match } from "./entity/Match";

@Module({
  imports: [
    AuthModule,
    UserModule,
    RoomModule,
    TypeOrmModule.forFeature([Match]),
  ],
  providers: [MatchService, MatchGateway],
  controllers: [MatchController],
})
export class MatchModule {}

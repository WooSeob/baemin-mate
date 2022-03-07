import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { MatchGateway } from "./match.gateway";
import { MatchService } from "./match.service";
import { MatchController } from "./match.controller";
import { UserModule } from "../user/user.module";
import { RoomModule } from "../room/room.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MatchEntity } from "./entity/match.entity";
import { UniversityModule } from "../university/university.module";

@Module({
  imports: [
    AuthModule,
    UserModule,
    RoomModule,
    UniversityModule,
    TypeOrmModule.forFeature([MatchEntity]),
  ],
  providers: [MatchService, MatchGateway],
  controllers: [MatchController],
})
export class MatchModule {}

import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { ContainerModule } from "../core/container/container.module";
import { MatchGateway } from "./match.gateway";
import { MatchSender } from "./match.sender";
import { MatchService } from "./match.service";
import { MatchController } from "./match.controller";
import { UserModule } from "../user/user.module";

@Module({
  imports: [ContainerModule, AuthModule, UserModule],
  providers: [MatchService, MatchGateway, MatchSender],
  controllers: [MatchController],
})
export class MatchModule {}

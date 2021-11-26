import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { ContainerModule } from "../core/container/container.module";
import { MatchGateway } from "./match.gateway";
import { MatchSender } from "./match.sender";
import { MatchService } from "./match.service";

@Module({
  imports: [ContainerModule, AuthModule],
  providers: [MatchService, MatchGateway, MatchSender],
})
export class MatchModule {}

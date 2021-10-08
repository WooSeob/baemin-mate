import { Module } from "@nestjs/common";
import { ContainerModule } from "../core/container/container.module";
import { MatchGateway } from "./match.gateway";
import { MatchService } from "./match.service";

@Module({
  imports: [ContainerModule],
  providers: [MatchService, MatchGateway],
})
export class MatchModule {}

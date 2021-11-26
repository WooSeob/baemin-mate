import { Module } from "@nestjs/common";
import { MatchContainer } from "./MatchContainer";
import { UserContainer } from "./UserContainer";

const UserContainerProvider = {
  provide: "IUserContainer",
  useClass: UserContainer,
};

const MatchContainerProvider = {
  provide: "IMatchContainer",
  useClass: MatchContainer,
};
@Module({
  providers: [UserContainerProvider, MatchContainerProvider],
  exports: [UserContainerProvider, MatchContainerProvider],
})
export class ContainerModule {}

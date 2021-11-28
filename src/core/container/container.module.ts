import { Module } from "@nestjs/common";
import { MatchContainer } from "./MatchContainer";
import { UserContainer } from "./UserContainer";
import { RoomContainer } from "./RoomContainer";

const UserContainerProvider = {
  provide: "IUserContainer",
  useClass: UserContainer,
};

const MatchContainerProvider = {
  provide: "IMatchContainer",
  useClass: MatchContainer,
};

const RoomContainerProvider = {
  provide: "IRoomContainer",
  useClass: RoomContainer,
};
@Module({
  providers: [
    UserContainerProvider,
    MatchContainerProvider,
    RoomContainerProvider,
  ],
  exports: [
    UserContainerProvider,
    MatchContainerProvider,
    RoomContainerProvider,
  ],
})
export class ContainerModule {}

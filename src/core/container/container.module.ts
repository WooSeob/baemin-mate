import { Module } from "@nestjs/common";
import { UserContainer } from "./UserContainer";

const UserContainerProvider = {
  provide: "IUserContainer",
  useClass: UserContainer,
};
@Module({
  providers: [UserContainerProvider],
  exports: [UserContainerProvider],
})
export class ContainerModule {}

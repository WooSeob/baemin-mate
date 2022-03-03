import { SetMetadata } from "@nestjs/common";
import { RoomRole } from "../../room/entity/Room";

export const RoomRoles = (...roles: RoomRole[]) =>
  SetMetadata("roomRoles", roles);

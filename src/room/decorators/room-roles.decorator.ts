import { SetMetadata } from "@nestjs/common";
import { RoomRole } from "../entity/Room";
import { ReflectKey } from "../../common/constants/reflect-keys";

export const RoomRoles = (...roles: RoomRole[]) =>
  SetMetadata(ReflectKey.ROOM_ROLES, roles);

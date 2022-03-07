import { SetMetadata } from "@nestjs/common";
import { RoomRole } from "../entity/room.entity";
import { ReflectKey } from "../../common/constants/reflect-keys";

export const RoomRoles = (...roles: RoomRole[]) =>
  SetMetadata(ReflectKey.ROOM_ROLES, roles);

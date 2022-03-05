import { applyDecorators, UseGuards } from "@nestjs/common";
import { RoomRoles } from "./room-roles.decorator";
import { RoomRole } from "../entity/Room";
import { JwtAuthGuard } from "../../auth/guards/JwtAuthGuard";
import { RoomRolesGuard } from "../guards/room-roles.guard";
import { ApiBearerAuth } from "@nestjs/swagger";

export function OnlyForPurchaser() {
  return applyDecorators(
    RoomRoles(RoomRole.PURCHASER),
    UseGuards(JwtAuthGuard, RoomRolesGuard),
    ApiBearerAuth("swagger-auth")
  );
}

export function OnlyForParticipant() {
  return applyDecorators(
    RoomRoles(RoomRole.PURCHASER, RoomRole.MEMBER),
    UseGuards(JwtAuthGuard, RoomRolesGuard),
    ApiBearerAuth("swagger-auth")
  );
}

export function OnlyForMember() {
  return applyDecorators(
    RoomRoles(RoomRole.MEMBER),
    UseGuards(JwtAuthGuard, RoomRolesGuard),
    ApiBearerAuth("swagger-auth")
  );
}

export function JustLoggedIn() {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth("swagger-auth")
  );
}

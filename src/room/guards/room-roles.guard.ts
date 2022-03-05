import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoomRole } from "../entity/Room";
import { AccessTokenPayload } from "../../auth/auth.service";
import { ROOM_ID } from "../const/Param";
import { RoomService } from "../room.service";
import { ReflectKey } from "../../common/constants/reflect-keys";

@Injectable()
export class RoomRolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private roomService: RoomService) {}
  private logger = new Logger("RoomRolesGuard");

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<RoomRole[]>(
      ReflectKey.ROOM_ROLES,
      context.getHandler()
    );
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user: AccessTokenPayload = request.user;
    const roomId = request.params[ROOM_ID];
    if (!roomId) {
      throw new Error("roomId를 찾을 수 없습니다.");
    }
    return this.matchRoles(roles, user.id, roomId);
  }

  private async matchRoles(
    targetRoles: RoomRole[],
    userId: string,
    roomId: string
  ) {
    const userRole = await this.roomService.getRoomRole(roomId, userId);
    return targetRoles.includes(userRole);
  }
}

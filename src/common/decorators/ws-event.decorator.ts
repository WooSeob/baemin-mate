import { SetMetadata } from "@nestjs/common";
import { ReflectKey } from "../constants/reflect-keys";

export const WsEvent = (event: string) =>
  SetMetadata(ReflectKey.WS_EVENT, event);

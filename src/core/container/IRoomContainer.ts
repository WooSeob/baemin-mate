import { Room } from "../../domain/room/room";
import { EventEmitter } from "stream";

export interface IRoomContainer extends EventEmitter {
  findAll(): Room[];
  findById(id: string): Room;
  push(room: Room);
  delete(room: Room);
}

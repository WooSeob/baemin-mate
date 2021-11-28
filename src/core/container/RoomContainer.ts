import { Injectable } from "@nestjs/common";
import { Room } from "../../domain/room/room";
import { IRoomContainer } from "./IRoomContainer";
import { EventEmitter } from "stream";

@Injectable()
export class RoomContainer extends EventEmitter implements IRoomContainer {
  private container: Map<string, Room> = new Map();

  findAll(): Room[] {
    return [...this.container.values()];
  }

  findById(id: string): Room {
    return this.container.get(id);
  }

  push(room: Room) {
    this.container.set(room.id, room);
    this.emit("push", room);
  }

  delete(room: Room) {
    this.container.delete(room.id);
    this.emit("delete", room);
  }
}

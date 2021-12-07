import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm";
import { SectionType } from "../interfaces/user";
import { Room } from "../../domain/room/room";

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({
    nullable: false,
  })
  name: string;

  @Column({
    nullable: false,
  })
  phone: string;

  @Column({
    nullable: true,
  })
  email: string;

  @Column({
    default: "unknown",
  })
  section: string;

  @Column({
    type: "bool",
    default: false,
  })
  verified: boolean;

  @Column({
    default: 35,
  })
  mannerRate: number;

  @Column({
    nullable: true,
  })
  currentJoinedRoom: string;

  //TODO DB 칼럼 추가!!!
  private _joinRoom: Room;
  private _joinedRooms: Room[] = [];

  get joinRoom(): Room {
    return this._joinRoom;
  }

  get joinedRooms() {
    return this._joinedRooms;
  }

  join(room: Room) {
    this._joinRoom = room;
    this._joinedRooms.push(room);
  }

  leaveRoom(roomId: string) {
    this._joinRoom = null;

    let toDeleteIdx = -1;
    for (let i = 0; i < this._joinedRooms.length; i++) {
      const room = this._joinedRooms[i];
      if (room.id === roomId) {
        toDeleteIdx = i;
        break;
      }
    }
    if (toDeleteIdx > -1) {
      this._joinedRooms = this._joinedRooms.splice(toDeleteIdx, 1);
    }
  }
}

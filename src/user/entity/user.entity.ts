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

  private _joinRoom: Room;

  get joinRoom(): Room {
    return this._joinRoom;
  }

  join(room: Room) {
    this._joinRoom = room;
  }
  leaveRoom() {
    this._joinRoom = null;
  }
  isAlreadyJoined() {
    return this._joinRoom != null;
  }
}

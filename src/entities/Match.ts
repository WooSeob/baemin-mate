import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./Room";

@Entity("match_entity")
export class Match {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  roomId: string;

  @ManyToOne(() => Room, (room) => room.participants, { onDelete: "CASCADE" })
  @JoinColumn()
  room: Room;
}

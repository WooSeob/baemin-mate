import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./Room";

@Entity()
export class RoomAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  bank: string;

  @Column({ nullable: false })
  number: string;

  @Column({ nullable: false })
  holderName: string;

  @Column()
  roomId: string;

  @OneToOne(() => Room, { onDelete: "CASCADE" })
  @JoinColumn()
  room: Room;

  static create(room: Room, bank: string, number: string, holderName: string) {
    const instance = new RoomAccount();
    instance.room = room;
    instance.bank = bank;
    instance.number = number;
    instance.holderName = holderName;
    return instance;
  }

  softDelete() {
    this.number = "(탈퇴 유저)";
    this.holderName = "(탈퇴 유저)";
  }
}

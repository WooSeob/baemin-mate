import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomEntity } from "./room.entity";

@Entity()
export class RoomAccountEntity {
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

  @OneToOne(() => RoomEntity, { onDelete: "CASCADE" })
  @JoinColumn()
  room: RoomEntity;

  static create(room: RoomEntity, bank: string, number: string, holderName: string) {
    const instance = new RoomAccountEntity();
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

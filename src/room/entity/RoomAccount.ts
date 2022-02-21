import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./Room";
import { User } from "../../user/entity/user.entity";

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
}

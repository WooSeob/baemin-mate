import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Participant } from "./Participant";

@Entity()
export class Menu {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Participant, (participant) => participant.menus, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  participant: Participant;

  @Column({
    nullable: false,
  })
  name: string;

  @Column({
    nullable: false,
  })
  price: number;

  @Column({
    nullable: false,
  })
  quantity: number;

  @Column()
  description: string;

  getPriceSum(): number {
    return this.price * this.quantity;
  }
}

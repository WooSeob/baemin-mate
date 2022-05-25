import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ParticipantEntity } from "./participant.entity";

@Entity()
export class MenuEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => ParticipantEntity, (participant) => participant.menus, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  participant: ParticipantEntity;

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

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from "typeorm";
import { Room } from "./Room";
import { SectionType } from "../user/interfaces/user";
import { CategoryType } from "../match/interfaces/category.interface";
import { BigIntTransformer } from "../common/BigIntTransformer";

@Entity("match_entity")
export class Match {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    nullable: false,
  })
  shopName: string;

  @Column({
    nullable: false,
  })
  purchaserName: string;

  @Column({
    nullable: false,
  })
  category: CategoryType;

  @Column({
    nullable: false,
  })
  section: SectionType;

  @Column({
    nullable: false,
  })
  atLeastPrice: number;

  @Column({
    nullable: false,
  })
  totalPrice: number;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  createdAt: number;

  @Column({ nullable: false })
  targetUnivId: number;

  @Column({ nullable: true })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: "SET NULL" })
  room: Room;

  static create(room: Room): Match {
    return new Match().update(room);
  }

  update(room: Room): Match {
    this.shopName = room.shopName;
    this.purchaserName = room.purchaser.name;
    this.category = room.category;
    this.section = room.section;
    this.atLeastPrice = room.atLeastPrice;
    this.totalPrice = room.getTotalPrice();
    this.targetUnivId = room.targetUnivId;
    this.room = room;
    return this;
  }
}

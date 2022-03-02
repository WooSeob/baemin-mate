import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from "typeorm";
import { Room } from "../../room/entity/Room";
import { SectionType } from "../../user/interfaces/user";
import { CategoryType } from "../interfaces/category.interface";
import { BigIntTransformer } from "../../common/BigIntTransformer";

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
  sectionId: number;

  @Column({
    nullable: false,
  })
  sectionName: string;

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

  //TODO 리팩토링
  static create(room: Room, sectionName: string): Match {
    return new Match().update(room, sectionName);
  }

  update(room: Room, sectionName: string): Match {
    this.shopName = room.shopName;
    this.purchaserName = room.purchaser.name;
    this.category = room.category;
    this.sectionId = room.sectionId;
    this.sectionName = sectionName;
    this.atLeastPrice = room.atLeastPrice;
    this.totalPrice = room.getTotalPrice();
    this.targetUnivId = room.targetUnivId;
    this.room = room;
    return this;
  }
}
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from "typeorm";
import { RoomEntity } from "../../room/entity/room.entity";
import { SectionType } from "../../user/interfaces/user";
import { CategoryType } from "../interfaces/category.interface";
import { BigIntTransformer } from "../../common/BigIntTransformer";

@Entity("match_entity")
export class MatchEntity {
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

  @ManyToOne(() => RoomEntity, { onDelete: "SET NULL" })
  room: RoomEntity;

  //TODO 리팩토링
  static create(room: RoomEntity, sectionName: string): MatchEntity {
    return new MatchEntity().update(room, sectionName);
  }

  update(room: RoomEntity, sectionName: string): MatchEntity {
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

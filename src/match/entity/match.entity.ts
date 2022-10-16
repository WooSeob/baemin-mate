import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomEntity } from "../../room/entity/room.entity";
import { CategoryType } from "../interfaces/category.interface";
import { BigIntTransformer } from "../../common/BigIntTransformer";
import { MatchType } from "../interfaces/MatchType";

@Entity("match_entity")
export class MatchEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // 매치 도메인
  @Column({ nullable: false })
  matchType: MatchType;

  @Column({ nullable: true })
  metadata: string;

  // 검색용
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

  @Column({ nullable: false })
  targetUnivId: number;

  // 반정규화
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
  atLeastPrice: number;

  @Column({
    nullable: false,
  })
  totalPrice: number;

  @CreateDateColumn({ transformer: [BigIntTransformer] })
  createdAt: number;

  @Column({ nullable: true })
  roomId: string;

  @ManyToOne(() => RoomEntity, { onDelete: "SET NULL" })
  room: RoomEntity;

  private constructor() {}

  static fromFeed(room: RoomEntity, sectionName: string) {
    const entity = this.create(room, sectionName);
    entity.matchType = MatchType.HomeFeed;
    return entity;
  }

  static fromSubscription(room: RoomEntity, sectionName: string) {
    const entity = this.create(room, sectionName);
    entity.matchType = MatchType.CategorySubscription;
    return entity;
  }

  static fromShare(room: RoomEntity, sectionName: string) {
    const entity = this.create(room, sectionName);
    entity.matchType = MatchType.Share;
    return entity;
  }

  //TODO 리팩토링
  private static create(room: RoomEntity, sectionName: string): MatchEntity {
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

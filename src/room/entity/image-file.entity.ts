import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomEntity } from "./room.entity";
import { BigIntTransformer } from "../../common/BigIntTransformer";

@Entity()
export class ImageFileEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: true })
  roomId: string;

  @ManyToOne(() => RoomEntity, (room) => room.orderCheckScreenShots, {
    onDelete: "SET NULL",
  })
  room: RoomEntity;

  @Column({
    nullable: false,
  })
  s3url: string;

  @CreateDateColumn({ transformer: [BigIntTransformer] })
  createdAt: number;

  @Column({
    nullable: true,
  })
  updatedAt: number;
}

import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomEntity } from "./room.entity";

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

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
  })
  createdAt: number;

  @Column({
    nullable: true,
  })
  updatedAt: number;
}

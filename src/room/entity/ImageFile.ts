import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./Room";

@Entity()
export class ImageFile {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: true })
  roomId: string;

  @ManyToOne(() => Room, (room) => room.orderCheckScreenShots, {
    onDelete: "SET NULL",
  })
  room: Room;

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

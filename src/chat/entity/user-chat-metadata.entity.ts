import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomEntity } from "../../room/entity/room.entity";
import { UserEntity } from "../../user/entity/user.entity";

@Entity()
export default class UserChatMetadataEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  roomId: string;

  @Column({ nullable: false })
  userId: string;

  @ManyToOne(() => RoomEntity, { onDelete: "CASCADE" })
  @JoinColumn()
  room: RoomEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn()
  user: UserEntity;

  @Column({ nullable: false })
  chatStartId: number;

  @Column({ nullable: true })
  chatEndId: number;

  @Column({ nullable: false })
  readToId: number;

  updateReadMessageId(mid: number) {
    this.readToId = mid;
  }
}

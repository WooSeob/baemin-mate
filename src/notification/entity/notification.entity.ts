import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "../../user/entity/user.entity";
import { BigIntTransformer } from "../../common/BigIntTransformer";
import { NotificationType } from "../const/NotificationType";

@Entity()
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn()
  user: UserEntity;

  @Column({ nullable: false, default: false })
  isRead: boolean;

  @Column({ nullable: false })
  type: NotificationType;

  @Column({ nullable: false })
  metadata: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  body: string;

  @CreateDateColumn({ transformer: [BigIntTransformer] })
  createdAt: number;

  @UpdateDateColumn({ transformer: [BigIntTransformer] })
  updateAt: number;

  constructor(
    user: UserEntity,
    type: NotificationType,
    metadata: string,
    title: string,
    body: string
  ) {
    this.user = user;
    this.type = type;
    this.metadata = metadata;
    this.title = title;
    this.body = body;
  }
}

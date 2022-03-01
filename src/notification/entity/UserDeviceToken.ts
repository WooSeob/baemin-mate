import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../user/entity/user.entity";
import { BigIntTransformer } from "../../common/BigIntTransformer";

@Entity()
export class UserDeviceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @Column({ nullable: false, unique: true })
  deviceToken: string;

  @Column({ nullable: false, default: true })
  enabled: boolean;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  createdAt: number;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  updateAt: number;
}

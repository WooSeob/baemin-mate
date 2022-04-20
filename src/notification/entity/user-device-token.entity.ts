import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "../../user/entity/user.entity";
import { BigIntTransformer } from "../../common/BigIntTransformer";

@Entity()
export class UserDeviceTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn()
  user: UserEntity;

  @Column({ nullable: false, unique: true })
  deviceToken: string;

  @Column({ nullable: false, default: true })
  enabled: boolean;

  @CreateDateColumn({ transformer: [BigIntTransformer] })
  createdAt: number;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  updateAt: number;
}

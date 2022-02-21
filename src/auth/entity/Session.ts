import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../user/entity/user.entity";

@Entity()
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, { onDelete: "CASCADE", eager: true })
  @JoinColumn()
  user: User;

  static create(user: User) {
    const instance = new Session();
    instance.user = user;
    return instance;
  }
}

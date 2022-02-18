import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import University from "../../university/entity/University";
import { BigIntTransformer } from "../../common/BigIntTransformer";

@Entity()
export class UniversityEmailAuth {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: false, unique: true })
  oauthId: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  universityId: number;

  @Column({ nullable: false })
  authCode: string;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  createdAt: number;

  @ManyToOne(() => University, { onDelete: "NO ACTION" })
  @JoinColumn()
  university: University;
}

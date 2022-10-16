import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  UpdateDateColumn,
} from "typeorm";
import { CategoryType } from "../interfaces/category.interface";
import {
  BigIntDateTransformer,
  BigIntTransformer,
} from "../../common/BigIntTransformer";
import { UserEntity } from "../../user/entity/user.entity";
import UniversityEntity from "../../university/entity/university.entity";

@Entity()
export class SubscribeCategoryEntity {
  @Column()
  univId: number;

  @ManyToOne(() => UniversityEntity, (univ) => univ.id)
  univ: UniversityEntity;

  @CreateDateColumn({ transformer: [BigIntTransformer] })
  createdAt: number;

  @UpdateDateColumn({ transformer: [BigIntTransformer] })
  updateAt: number;

  @Column({
    type: "datetime",
    transformer: [BigIntDateTransformer],
    nullable: false,
  })
  expiresAt: number;

  @ManyToOne(() => UserEntity, (user) => user.id, { primary: true })
  user: UserEntity;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false, primary: true })
  category: CategoryType;
}

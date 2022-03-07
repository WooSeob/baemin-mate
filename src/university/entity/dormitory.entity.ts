import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import UniversityEntity from "./university.entity";

@Entity()
export default class DormitoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @ManyToOne(() => UniversityEntity, { onDelete: "CASCADE" })
  @JoinColumn()
  university: UniversityEntity;
}

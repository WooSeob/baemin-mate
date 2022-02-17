import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import University from "./University";

@Entity()
export default class Dormitory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @ManyToOne(() => University, { onDelete: "CASCADE" })
  @JoinColumn()
  university: University;
}

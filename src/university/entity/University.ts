import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Dormitory from "./Dormitory";

@Entity()
export default class University {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  korName: string;

  @Column({ nullable: false })
  engName: string;

  @Column({ nullable: false })
  emailDomain: string;

  @OneToMany(() => Dormitory, (d) => d.university, { cascade: true })
  dormitories: Dormitory[];
}

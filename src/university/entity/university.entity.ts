import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import DormitoryEntity from "./dormitory.entity";

@Entity()
export default class UniversityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  korName: string;

  @Column({ nullable: false })
  engName: string;

  @Column({ nullable: false })
  emailDomain: string;

  @OneToMany(() => DormitoryEntity, (d) => d.university, { cascade: true })
  dormitories: DormitoryEntity[];
}

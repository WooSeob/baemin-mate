import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { Participant } from "../../room/entity/Participant";
import University from "../../university/entity/University";

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({
    nullable: false,
  })
  name: string;

  @Column({
    nullable: false,
  })
  phone: string;

  @Column({
    nullable: true,
  })
  email: string;

  @Column({
    default: "unknown",
  })
  section: string;

  @Column({
    type: "bool",
    default: false,
  })
  verified: boolean;

  @Column({
    default: 35,
  })
  mannerRate: number;

  @Column()
  universityId: number;

  @OneToMany(() => Participant, (p) => p.user)
  rooms: Participant[];

  @ManyToOne(() => University, { onDelete: "NO ACTION" })
  @JoinColumn()
  university: University;
}

export class UserBuilder {
  private readonly object: User;

  constructor() {
    this.object = new User();
  }

  setId(id: string): UserBuilder {
    this.object.id = id;
    return this;
  }

  setName(name: string): UserBuilder {
    this.object.name = name;
    return this;
  }

  setPhone(phone: string): UserBuilder {
    this.object.phone = phone;
    return this;
  }

  build(): User {
    return this.object;
  }
}

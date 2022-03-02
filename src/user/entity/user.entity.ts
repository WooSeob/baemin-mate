import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Participant } from "../../room/entity/Participant";
import University from "../../university/entity/University";
import { RoomState } from "../../room/const/RoomState";
import { BigIntTransformer } from "../../common/BigIntTransformer";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    nullable: false,
  })
  name: string;

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

  @Column({
    nullable: true,
    type: "bigint",
    transformer: [BigIntTransformer],
  })
  deletedAt: number;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  createdAt: number;

  @Column()
  universityId: number;

  @OneToMany(() => Participant, (p) => p.user)
  rooms: Participant[];

  @ManyToOne(() => University, { onDelete: "NO ACTION" })
  @JoinColumn()
  university: University;

  delete() {
    // 참여 방 중 활성상태인 방이 있으면 탈퇴할 수 없다
    for (const participant of this.rooms) {
      participant.room.onlyAt(RoomState.ORDER_DONE, RoomState.ORDER_CANCELED);
    }

    this.name = "";
    this.deletedAt = Date.now();
  }
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

  build(): User {
    return this.object;
  }
}

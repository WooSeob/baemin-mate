import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ParticipantEntity } from "../../room/entity/participant.entity";
import UniversityEntity from "../../university/entity/university.entity";
import { RoomState } from "../../room/const/RoomState";
import { BigIntTransformer } from "../../common/BigIntTransformer";

@Entity()
export class UserEntity {
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

  @OneToMany(() => ParticipantEntity, (p) => p.user)
  rooms: ParticipantEntity[];

  @ManyToOne(() => UniversityEntity, { onDelete: "NO ACTION" })
  @JoinColumn()
  university: UniversityEntity;

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
  private readonly object: UserEntity;

  constructor() {
    this.object = new UserEntity();
  }

  setId(id: string): UserBuilder {
    this.object.id = id;
    return this;
  }

  setName(name: string): UserBuilder {
    this.object.name = name;
    return this;
  }

  build(): UserEntity {
    return this.object;
  }
}

import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./Room";
import VoteOpinion from "./VoteOpinion";
import { User } from "../../user/entity/user.entity";
import VoteStrategyFactory from "./Vote/VoteStrategyFactory";

export enum RoomVoteType {
  KICK,
  RESET,
}

@Entity()
export default class RoomVote {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  voteType: RoomVoteType;

  @Column({ default: false })
  finished: boolean;

  @Column({ default: false })
  result: boolean;

  @Column({ nullable: true })
  targetUserId: string;

  @Column()
  roomId: string;

  // TODO 유저가 탈퇴해 버리면 투표가 삭제되버림
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  targetUser: User;

  @ManyToOne(() => Room, { onDelete: "CASCADE" })
  room: Room;

  @OneToMany(() => VoteOpinion, (v) => v.vote, {
    eager: true,
    cascade: true,
  })
  opinions: VoteOpinion[];

  doVote(userId: string, opinion: boolean) {
    if (this.finished) {
      throw new Error("종료된 투표입니다.");
    }
    VoteStrategyFactory.create(this.voteType).doVote(this, userId, opinion);
  }
}

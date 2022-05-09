import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomEntity } from "./room.entity";
import VoteOpinionEntity from "./vote-opinion.entity";
import { UserEntity } from "../../user/entity/user.entity";
import VoteStrategyFactory from "./Vote/VoteStrategyFactory";

export enum RoomVoteType {
  KICK,
  RESET,
}

@Entity()
export default class RoomVoteEntity {
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

  @Column({ nullable: false })
  requestUserId: string;

  @Column()
  roomId: string;

  // TODO 유저가 탈퇴해 버리면 투표가 삭제되버림
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn()
  requestUser: UserEntity;

  // TODO 유저가 탈퇴해 버리면 투표가 삭제되버림
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn()
  targetUser: UserEntity;

  @ManyToOne(() => RoomEntity, { onDelete: "CASCADE" })
  @JoinColumn()
  room: RoomEntity;

  @OneToMany(() => VoteOpinionEntity, (v) => v.vote, {
    eager: true,
    cascade: true,
  })
  opinions: VoteOpinionEntity[];

  doVote(userId: string, opinion: boolean) {
    if (this.finished) {
      throw new Error("종료된 투표입니다.");
    }
    VoteStrategyFactory.create(this.voteType).doVote(this, userId, opinion);
  }

  getOpinion(participantId: string): VoteOpinionEntity {
    return this.opinions.find(
      (voteOpinion) => voteOpinion.participantId == participantId
    );
  }
}

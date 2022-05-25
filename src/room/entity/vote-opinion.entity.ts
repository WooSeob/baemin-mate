import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ParticipantEntity } from "./participant.entity";
import RoomVoteEntity from "./room-vote.entity";

@Entity()
export default class VoteOpinionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, default: false })
  opinion: boolean;

  @Column({ nullable: false, default: false })
  submitted: boolean;

  @Column()
  participantId: string;

  //TODO 누군가 나가면 투표 종료기준은? -> 현재는 투표 가능 시점에 나갈 수 없음
  @ManyToOne(() => ParticipantEntity, { onDelete: "CASCADE" })
  participant: ParticipantEntity;

  @ManyToOne(() => RoomVoteEntity, (v) => v.opinions, { onDelete: "CASCADE" })
  vote: RoomVoteEntity;

  constructor(vote: RoomVoteEntity, participant: ParticipantEntity) {
    this.vote = vote;
    this.participant = participant;
  }
}

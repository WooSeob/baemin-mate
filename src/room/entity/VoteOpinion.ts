import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Participant } from "./Participant";
import RoomVote from "./RoomVote";

@Entity()
export default class VoteOpinion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, default: false })
  opinion: boolean;

  @Column({ nullable: false, default: false })
  submitted: boolean;

  @Column()
  participantId: string;

  //TODO 누군가 나가면 투표 종료기준은? -> 현재는 투표 가능 시점에 나갈 수 없음
  @ManyToOne(() => Participant, { onDelete: "CASCADE" })
  participant: Participant;

  @ManyToOne(() => RoomVote, (v) => v.opinions, { onDelete: "CASCADE" })
  vote: RoomVote;

  constructor(vote: RoomVote, participant: Participant) {
    this.vote = vote;
    this.participant = participant;
  }
}

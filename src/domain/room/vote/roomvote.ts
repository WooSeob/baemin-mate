import { EventEmitter } from "stream";
import { Room } from "../room";
import Vote from "./vote";
import KickVote from "./KickVote";
import ResetVote from "./ResetVote";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../../user/entity/user.entity";

/**
 * created-reset : 리셋에 대한 투표가 실시됨
 * created-kick : 강퇴에 대한 투표가 실시됨
 * finish : 투표의 결과가 나옴
 *
 * RoomVote 는 Vote 의 일종의 프록시
 * */
export default class RoomVote extends EventEmitter {
  get vid(): string {
    return this._vid;
  }

  private _room: Room;
  private vote: Vote;
  private _vid: string;

  constructor(room: Room) {
    super();
    this._room = room;
  }

  createKickVote(targetUser: User) {
    this._isVoteAlreadyExist();
    this._createVote(new KickVote(this._room, targetUser), () => {
      //실제 강퇴 처리
      this._room.users.delete(targetUser);
    });
    this.emit("created-kick", this);
  }

  createResetVote() {
    this._isVoteAlreadyExist();
    this._createVote(new ResetVote(this._room), () => {
      //TODO 실제 리셋 처리
    });
    this.emit("created-reset", this);
  }

  doVote(user: User, opinion: boolean) {
    if (!this.vote) {
      throw Error("there is no vote");
    }
    this.vote.vote(user, opinion);
  }

  private _isVoteAlreadyExist() {
    if (this.vote) {
      throw Error("already vote exist");
    }
  }

  private _createVote(instance: Vote, voteCallback: Function) {
    instance.on("finish", (result: boolean) => {
      //vote 결과 알림 브로드캐스팅
      this.emit("finish", result);
      //vote 종료
      this.vote = null;
      //vote type 별 결과 처리
      voteCallback();
    });
    this.vote = instance;
    this._vid = uuidv4();
  }
}

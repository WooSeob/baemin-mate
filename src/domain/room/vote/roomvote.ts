import { EventEmitter } from "stream";
import { Room } from "../room";
import Vote from "./vote";
import KickVote from "./KickVote";
import ResetVote from "./ResetVote";
import { User } from "../../../user/entity/user.entity";

/**
 * created-reset : 리셋에 대한 투표가 실시됨
 * created-kick : 강퇴에 대한 투표가 실시됨
 * finish : 투표의 결과가 나옴
 *
 * RoomVote 는 Vote 의 일종의 프록시
 * */
export default class RoomVote extends EventEmitter {
  private _room: Room;
  private vote: Vote;
  //TODO _vid Vote 속으로 숨기기

  constructor(room: Room) {
    super();
    this._room = room;
  }

  get vid() {
    return this.vote.id;
  }

  //TODO Vote 인스턴스별 결과 처리 로직 캡슐화 해야함
  createKickVote(targetUser: User) {
    this._isVoteAlreadyExist();
    const kickVoteInstance = new KickVote(this._room, targetUser);
    this._createVote(kickVoteInstance, (result: boolean) => {
      //vote 결과 알림 브로드캐스팅
      this.emit("kick-finish", kickVoteInstance);
      //TODO callback으로 들어온 값과 인스턴스의 값이 다른듯?
      if (kickVoteInstance.result) {
        //실제 강퇴 처리
        this._room.users.delete(targetUser);
      }
    });
    //지목된 사람 닉네임 아이디
    this.emit("created-kick", kickVoteInstance);
  }

  createResetVote() {
    this._isVoteAlreadyExist();
    const resetVoteInstance = new ResetVote(this._room);
    this._createVote(resetVoteInstance, (result: boolean) => {
      //vote 결과 알림 브로드캐스팅
      this.emit("reset-finish", resetVoteInstance);
      if (result) {
        //TODO 실제 리셋 처리
      }
    });
    this.emit("created-reset", resetVoteInstance);
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
      //vote 종료
      this.vote = null;
      //vote type 별 결과 처리
      voteCallback(result);
    });
    this.vote = instance;
  }
}

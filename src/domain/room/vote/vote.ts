import { EventEmitter } from "stream";
import { User } from "../../../user/entity/user.entity";
import { v4 as uuidv4 } from "uuid";

export default abstract class Vote extends EventEmitter {
  // 투표 timeout 처리를 위한 상수, timer handler
  private readonly timeout: number;
  private readonly timer: NodeJS.Timeout;

  // 투표 id
  private readonly _id: string;
  // 투표권을 행사할 수 있는 대상 집합, 아직 투표하지 않은 대상 집합.
  // 해당 집합은 구현 클래스에서 결정
  protected remain: Set<string>;

  //최종 투표 결과 T/F
  protected _result: boolean = true;

  get result(): boolean {
    return this._result;
  }

  get id(): string {
    return this._id;
  }
  // public get id(): string {
  //   return this._id;
  // }
  /**
   * 투표가 끝나면 => result() 를 호출한다.
   * result()가 호출되는 경우는 아래와 같다.
   *    1. 종료조건
   *        vote() 에서 구현.
   *        종료조건이 달성되면 vote() 내부에서 result()를 호출 할것.
   *    2. 타임아웃
   *        타임아웃 콜백으로 result() 가 호출된다.
   * */
  protected constructor() {
    super();
    this._id = uuidv4();
    this.timeout = 90 * 1000; // 이건 policy 인데.. 여기있어도 되나..
    this.timer = setTimeout(() => {
      this.resultHook();
    }, this.timeout);
  }

  // 투표 방식은 구현 클래스에서 결정
  abstract vote(user: User, opinion: boolean);

  protected resultHook() {
    this.clearTimer();
    this.emit("finish", this._result);
  }

  protected clearTimer() {
    clearTimeout(this.timer);
  }
}

import { Valuable } from "src/core/interface/valuable";
import { User } from "src/user/interfaces/user";

export class Awaiter implements Valuable {
  user: User;
  createdAt: number;
  constructor() {}

  value(): number {
    let elapsedTime = Date.now() - this.createdAt;
    return elapsedTime * 0.6 + this.user.getMannerRate() * 0.4;
  }
}

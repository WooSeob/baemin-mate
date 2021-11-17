import { SectionType, User } from "src/user/interfaces/user";
import { ISectionPriorityQueue } from "../interfaces/ISectionPriorityQueue";
import { Match } from "../match";
import PriorityQueue from "../../../core/collection/PriorityQueue";
import { Awaiter } from "../awaiter";
export class SectionPriorityQueue implements ISectionPriorityQueue {
  readonly section: SectionType;

  private joiners: PriorityQueue<Awaiter>;

  private queue: PriorityQueue<Match>;
  private matchesByShop: Map<string, Match>;

  constructor(section: SectionType) {
    this.section = section;
    this.matchesByShop = new Map();
    this.queue = new PriorityQueue();
    this.joiners = new PriorityQueue();
  }
  getAll(): Match[] {
    return this.queue.getAll();
  }

  matchEnqueue(match: Match) {
    if (this.matchesByShop.has(match.shopName)) {
      let found: Match = this.matchesByShop.get(match.shopName);
      match.emit("leave", { user: match.perchaser });
      //파라미터로 들어온 이 match 삭제해 줘야함.
      //따로 큐에 넣는 작업을 안하기만 하면 이 함수가 끝날때 사라질것임.
      found.emit("match joined", { user: match.perchaser });
    } else {
      this.queue.enqueue(match);
      this.matchesByShop.set(match.shopName, match);
    }
  }

  matchDequeue(): Match {
    throw new Error("Method not implemented.");
  }

  joinerEnqueue(awaiter: Awaiter) {
    this.joiners.enqueue(awaiter);

    if (!this.queue.isEmpty()) {
      let matchTo: Match = this.queue.dequeue();

      let awaiter = this.joiners.dequeue();
      matchTo.emit("match joined", { user: awaiter.user });

      this.queue.enqueue(matchTo);
    }
  }

  joinerDequeue(): User {
    throw new Error("Method not implemented.");
  }
}

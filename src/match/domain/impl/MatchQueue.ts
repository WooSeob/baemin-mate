import { User } from "src/user/interfaces/user";
import { IMatchQueue } from "../interfaces/IMatchQueue";
import { Room } from "../../../domain/room/room";
import { SectionPriorityQueue } from "./SectioniPriorityQueue";

export class MatchQueue implements IMatchQueue {
  queueBySection: Map<string, SectionPriorityQueue> = new Map<string, SectionPriorityQueue>();

  matchEnqueue(match: Room) {
    // throw new Error("Method not implemented.");
    let section = match.perchaser.getSection();

    if (this.queueBySection.has(section)) {
      let queue = this.queueBySection.get(section);
      queue.matchEnqueue(match);
    } else {
      let queue = new SectionPriorityQueue();
      queue.matchEnqueue(match);
      this.queueBySection.set(section, queue);
    }
  }
  matchDequeue(): Room {
    throw new Error("Method not implemented.");
  }
  joinerEnqueue(user: User) {
    throw new Error("Method not implemented.");
  }
  joinerDequeue(): User {
    throw new Error("Method not implemented.");
  }
}

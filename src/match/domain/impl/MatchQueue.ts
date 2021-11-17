import { User, SECTION, SectionType } from "../../../user/interfaces/user";
import { Awaiter } from "../awaiter";
import { IMatchQueue } from "../interfaces/IMatchQueue";
import { ISectionPriorityQueue } from "../interfaces/ISectionPriorityQueue";
import { Match } from "../match";
import { SectionPriorityQueue } from "./SectioniPriorityQueue";

export class MatchQueue implements IMatchQueue {
  queueBySection: Map<SectionType, ISectionPriorityQueue> = new Map<
    SectionType,
    SectionPriorityQueue
  >();

  constructor() {
    this.queueBySection.set(SECTION.NARAE, new SectionPriorityQueue(SECTION.NARAE));
    this.queueBySection.set(SECTION.HOYOEN, new SectionPriorityQueue(SECTION.HOYOEN));
    this.queueBySection.set(SECTION.CHANGZO, new SectionPriorityQueue(SECTION.CHANGZO));
    this.queueBySection.set(SECTION.BIBONG, new SectionPriorityQueue(SECTION.BIBONG));
  }
  getAll(): Match[] {
    let spqs = [...this.queueBySection.values()];
    let ret = [];
    for (let spq of spqs) {
      ret.push(spq.getAll());
    }
    return ret;
  }
  matchEnqueue(match: Match) {
    // throw new Error("Method not implemented.");
    let section = match.perchaser.getSection();
    let queue = this.queueBySection.get(section);
    queue.matchEnqueue(match);
  }
  matchDequeue(): Match {
    throw new Error("Method not implemented.");
  }
  joinerEnqueue(awaiter: Awaiter) {
    let queue = this.queueBySection.get(awaiter.user.getSection());
    queue.joinerEnqueue(awaiter);
  }
  joinerDequeue(): User {
    throw new Error("Method not implemented.");
  }
}

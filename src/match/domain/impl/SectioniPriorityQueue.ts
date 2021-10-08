import { User } from "src/user/interfaces/user";
import { ISectionPriorityQueue } from "../interfaces/ISectionPriorityQueue";
import { Match } from "../match";

export class SectionPriorityQueue implements ISectionPriorityQueue {
  matches: Match[];
  joiners: User[];

  constructor() {
    this.matches = [];
    this.joiners = [];
  }
  matchEnqueue(match: Match) {
    this.matches.push(match);
  }
  matchDequeue(): Match {
    throw new Error("Method not implemented.");
  }
  joinerEnqueue(user: User) {
    throw new Error("Method not implemented.");
  }
  joinerDequeue(): User {
    throw new Error("Method not implemented.");
  }
}

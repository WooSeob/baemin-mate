import { User } from "src/user/interfaces/user";
import { ISectionPriorityQueue } from "../interfaces/ISectionPriorityQueue";
import { Room } from "../../../domain/room/room";

export class SectionPriorityQueue implements ISectionPriorityQueue {
  matches: Room[];
  joiners: User[];

  constructor() {
    this.matches = [];
    this.joiners = [];
  }
  matchEnqueue(match: Room) {
    this.matches.push(match);
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

import { User } from "src/user/interfaces/user";
import { Awaiter } from "../awaiter";
import { Match } from "../match";

export interface ISectionPriorityQueue {
  getAll(): Match[];
  matchEnqueue(match: Match);
  matchDequeue(): Match;
  joinerEnqueue(awaiter: Awaiter);
  joinerDequeue(): User;
}

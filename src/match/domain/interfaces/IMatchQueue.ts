import { User } from "src/user/interfaces/user";
import { Match } from "../match";

export interface IMatchQueue {
  matchEnqueue(match: Match);
  matchDequeue(): Match;
  joinerEnqueue(user: User);
  joinerDequeue(): User;
}

import { User } from "src/user/interfaces/user";
import { Room } from "../../../domain/room/room";

export interface ISectionPriorityQueue {
  matchEnqueue(match: Room);
  matchDequeue(): Room;
  joinerEnqueue(user: User);
  joinerDequeue(): User;
}

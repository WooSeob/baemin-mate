import { Room } from "src/domain/room/room";
import { CategoryType } from "src/match/interfaces/category.interface";
import { SectionType } from "src/user/interfaces/user";
import { EventEmitter } from "stream";

export interface IMatchContainer extends EventEmitter {
  findAll(): Room[];
  findBySection(section: SectionType): Room[];
  findByCategory(category: CategoryType): Room[];
  findById(id: string): Room;
  push(match: Room);
  delete(match: Room);
}

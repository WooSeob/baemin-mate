import { CategoryType } from "src/match/interfaces/category.interface";
import { SectionType } from "src/user/interfaces/user";
import { EventEmitter } from "stream";
import { Match } from "../../domain/match/match";

export interface IMatchContainer extends EventEmitter {
  findAll(): Match[];
  findBySection(section: SectionType): Match[];
  findByCategory(category: CategoryType): Match[];
  findById(id: string): Match;
  push(match: Match);
  delete(match: Match);
}

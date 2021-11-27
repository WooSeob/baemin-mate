import { Injectable } from "@nestjs/common";
import { Room } from "src/domain/room/room";
import { CategoryType } from "src/match/interfaces/category.interface";
import { SectionType } from "src/user/interfaces/user";
import { EventEmitter } from "stream";
import { IMatchContainer } from "./IMatchContainer";

@Injectable()
export class MatchContainer extends EventEmitter implements IMatchContainer {
  private container: Map<string, Room> = new Map();
  private byCategoryAndSection: Map<string, Map<string, Map<string, Room>>> = new Map();

  findAll(): Room[] {
    for (let category of this.byCategoryAndSection.keys()) {
      for (let section of this.byCategoryAndSection.get(category).keys()) {
        console.log(category, section);
        console.log([...this.byCategoryAndSection.get(category).get(section)]);
      }
    }
    return [...this.container.values()];
  }

  findBySection(section: SectionType): Room[] {
    let ret: Room[] = [];
    for (let cat of this.byCategoryAndSection.keys()) {
      for (let sec of this.byCategoryAndSection.get(cat).keys()) {
        if (section == sec) {
          ret = [...ret, ...this.byCategoryAndSection.get(cat).get(sec).values()];
        }
      }
    }
    return ret;
  }

  findByCategory(category: CategoryType): Room[] {
    let ret: Room[] = [];
    for (let cat of this.byCategoryAndSection.keys()) {
      if (category == cat) {
        for (let sec of this.byCategoryAndSection.get(cat).keys()) {
          ret = [...ret, ...this.byCategoryAndSection.get(cat).get(sec).values()];
        }
      }
    }
    return ret;
  }

  findById(id: string): Room {
    return this.container.get(id);
  }

  push(match: Room) {
    this.container.set(match.id, match);

    // match.category -> match.section
    if (!this.byCategoryAndSection.has(match.category)) {
      this.byCategoryAndSection.set(match.category, new Map());
    }
    let byCategory = this.byCategoryAndSection.get(match.category);

    if (!byCategory.has(match.targetSection)) {
      byCategory.set(match.targetSection, new Map());
    }
    let bySectioin = byCategory.get(match.targetSection);
    bySectioin.set(match.id, match);
    this.emit("push", match);

    match.on("update-matchInfo", (updatedMatch) => {
      this.emit("update-matchInfo", updatedMatch);
    });
  }

  delete(match: Room) {
    this.container.delete(match.id);
    this.byCategoryAndSection.get(match.category).get(match.targetSection).delete(match.id);
    this.emit("delete", match);
  }
}

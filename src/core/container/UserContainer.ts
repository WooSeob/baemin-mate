import { Injectable } from "@nestjs/common";
import { SECTION, User } from "src/user/interfaces/user";
import { IUserContainer } from "./IUserContainer";

@Injectable()
export class UserContainer implements IUserContainer {
  private container: Map<string, User> = new Map<string, User>();

  constructor() {
    this.push(new User("wooseob", SECTION.NARAE, 35));
    this.push(new User("qerty123", SECTION.NARAE, 30));
    this.push(new User("jinwoo", SECTION.NARAE, 40));
    this.push(new User("haesung", SECTION.NARAE, 60));
    this.push(new User("kiwoong", SECTION.NARAE, 20));
    this.push(new User("geonsu", SECTION.NARAE, 30));
    this.push(new User("segoo", SECTION.NARAE, 50));
  }

  findAll(): User[] {
    return [...this.container.values()];
  }

  findBySection(section: string): User[] {
    throw new Error("Method not implemented.");
  }

  findById(id: string): User {
    return this.container.get(id);
  }

  push(user: User) {
    this.container.set(user.getId(), user);
  }

  delete(user: User) {
    this.container.delete(user.getId());
  }
}
